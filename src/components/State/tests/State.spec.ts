import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import {
  getEnvObject,
  getEnvObjectByCloudflareId,
  getStateMethods,
  parseObjectStateMapping,
} from "..";
import { OBMT } from "../../ObjectBase";

/**
 * Unit tests for the Durable Object state proxy.
 */
describe("parseObjectStateMapping", () => {
  beforeEach(() => {
    apiker.debug = false;
    apiker.env = { APIKER_SECRET_KEY: "k" };
    apiker.requestParams = {
      headers: new Headers({ "CF-Connecting-IP": "9.9.9.9", "User-Agent": "UA" }),
    } as any;
  });

  it("returns a literal token unchanged", () => {
    expect(parseObjectStateMapping("myLiteral")).toBe("myLiteral");
  });

  it("resolves a route-parameter token from matches", () => {
    expect(parseObjectStateMapping("id", { params: { id: "42" } } as any)).toBe("42");
  });

  it("falls back to the token itself when the route param is absent", () => {
    expect(parseObjectStateMapping("id", { params: {} } as any)).toBe("id");
  });

  it("resolves IP to the raw client IP", () => {
    expect(parseObjectStateMapping(OBMT.IP)).toBe("9.9.9.9");
  });

  it("resolves CLIENTID to a signed hash string", () => {
    const value = parseObjectStateMapping(OBMT.CLIENTID);
    expect(typeof value).toBe("string");
    expect((value as string).length).toBeGreaterThan(0);
  });

  it("resolves SIGNEDIP to a signed hash string", () => {
    const value = parseObjectStateMapping(OBMT.SIGNEDIP);
    expect(typeof value).toBe("string");
    expect((value as string).length).toBeGreaterThan(0);
  });

  it("returns undefined for an undefined mapping", () => {
    expect(parseObjectStateMapping(undefined as any)).toBeUndefined();
  });
});

describe("getEnvObject / getEnvObjectByCloudflareId", () => {
  it("derives an instance id from a name", () => {
    apiker.env = { Foo: { idFromName: (n: string) => `id-${n}`, get: (id: string) => ({ id }) } };
    expect(getEnvObject("Foo", "abc")).toEqual({ id: "id-abc" });
  });

  it("returns undefined for an unknown object namespace", () => {
    apiker.env = {};
    expect(getEnvObject("Missing", "x")).toBeUndefined();
  });

  it("derives an instance from a Cloudflare id string", () => {
    apiker.env = {
      Foo: { idFromString: (s: string) => `cf-${s}`, get: (id: string) => ({ id }) },
    };
    expect(getEnvObjectByCloudflareId("Foo", "raw")).toEqual({ id: "cf-raw" });
  });
});

describe("getStateMethods", () => {
  beforeEach(() => {
    apiker.debug = false;
    apiker.objectStateMapping = {};
  });

  it("returns no-op methods when the object namespace is missing", () => {
    apiker.env = {};
    const state = getStateMethods("Common")("Common", "id");
    expect(state.get("x")).toBeUndefined();
  });

  it("proxies each method to the Durable Object over fetch with the right endpoint", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ ok: 1 })));
    apiker.env = {
      Common: { idFromName: () => "id", get: () => ({ fetch: fetchMock }) },
    };
    const state = getStateMethods("Common")("Common", "myId");

    await expect(state.get("prop")).resolves.toEqual({ ok: 1 });
    await state.put({ prop: 1 });
    await state.delete("prop");
    await state.deleteAll();
    await state.list({ prefix: "p" });
    await state.increment({ increments: { hits: 1 } });

    const endpoints = fetchMock.mock.calls.map((c: any[]) => c[0]);
    expect(endpoints.some((u: string) => u.endsWith("/get"))).toBe(true);
    expect(endpoints.some((u: string) => u.endsWith("/put"))).toBe(true);
    expect(endpoints.some((u: string) => u.endsWith("/delete"))).toBe(true);
    expect(endpoints.some((u: string) => u.endsWith("/deleteall"))).toBe(true);
    expect(endpoints.some((u: string) => u.endsWith("/list"))).toBe(true);
    expect(endpoints.some((u: string) => u.endsWith("/increment"))).toBe(true);
  });

  it("sends the increment payload to the object and returns the totals", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ hits: 7 })));
    apiker.env = { Common: { idFromName: () => "id", get: () => ({ fetch: fetchMock }) } };
    const state = getStateMethods("Common")("Common", "myId");

    await expect(state.increment({ increments: { hits: 1 } })).resolves.toEqual({ hits: 7 });
    expect(JSON.parse((fetchMock.mock.calls[0] as any[])[1].body)).toEqual({ increments: { hits: 1 } });
  });

  it("uses an explicitly provided objectId", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({})));
    const idFromName = jest.fn(() => "id");
    apiker.env = { Common: { idFromName, get: () => ({ fetch: fetchMock }) } };
    await getStateMethods("Common")("Common", "explicit-id").get("k");
    expect(idFromName).toHaveBeenCalledWith("explicit-id");
  });
});

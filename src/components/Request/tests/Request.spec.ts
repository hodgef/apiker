import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../Apiker";
import { handleEntryRequest, readRequestBody } from "..";
import { res } from "../../Response";

/**
 * A minimal Durable Object namespace mock whose instances return an empty
 * JSON object for every storage operation.
 */
const doNamespace = () => ({
  idFromName: () => "id",
  idFromString: () => "id",
  get: () => ({ fetch: async () => new Response(JSON.stringify({})) }),
});

const makeEnv = () => ({
  APIKER_SECRET_KEY: "test-secret",
  Common: doNamespace(),
  Bans: doNamespace(),
});

describe("readRequestBody", () => {
  const post = (body: string | null, contentType?: string) =>
    new Request("https://api.test/x", {
      method: "POST",
      headers: contentType ? { "content-type": contentType } : undefined,
      body,
    });

  it("parses an application/json body", async () => {
    expect(await readRequestBody(post(JSON.stringify({ a: 1 }), "application/json"))).toEqual({
      a: 1,
    });
  });

  it("returns null for an empty json body", async () => {
    expect(await readRequestBody(post("", "application/json"))).toBeNull();
  });

  it("throws on malformed json", async () => {
    await expect(readRequestBody(post("{not-json", "application/json"))).rejects.toThrow(
      "An exception occurred while parsing the request body"
    );
  });

  it("parses a form-urlencoded body into an object", async () => {
    const req = post("a=1&b=2", "application/x-www-form-urlencoded");
    expect(await readRequestBody(req)).toEqual({ a: "1", b: "2" });
  });

  it("returns the raw text for an unknown content type", async () => {
    expect(await readRequestBody(post("plain text", "text/plain"))).toBe("plain text");
  });

  it("returns null for an empty body with no content type", async () => {
    expect(await readRequestBody(post(null))).toBeNull();
  });
});

describe("handleEntryRequest routing", () => {
  beforeEach(() => {
    apiker.debug = false;
    apiker.firewall = false;
    apiker.objects = ["Common", "Bans"];
    apiker.objectStateMapping = { Bans: "userId" };
    apiker.controllers = {};
  });

  const get = (path: string) =>
    new Request(`https://api.test${path}`, {
      headers: { "CF-Connecting-IP": "1.2.3.4", "User-Agent": "jest" },
    });

  it("routes a matching request to its handler with route params", async () => {
    apiker.routes = {
      "/users/:id": ({ matches }) => res(matches.params.id),
    };
    const response = (await handleEntryRequest(get("/users/42"), makeEnv(), {})) as Response;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "42" });
  });

  it("returns 404 when no route matches", async () => {
    apiker.routes = { "/users/:id": () => res("hit") };
    const response = (await handleEntryRequest(get("/nothing-here"), makeEnv(), {})) as Response;
    expect(response.status).toBe(404);
  });

  it("resolves a string 'Controller.method' handler", async () => {
    class UserController {
      show = ({ matches }: any) => res(`user-${matches.params.id}`);
    }
    apiker.controllers = { UserController };
    apiker.routes = { "/c/:id": "UserController.show" };
    const response = (await handleEntryRequest(get("/c/7"), makeEnv(), {})) as Response;
    expect(await response.json()).toEqual({ message: "user-7" });
  });

  it("exposes the parsed body to the handler", async () => {
    apiker.routes = {
      "/echo": ({ body }) => res(body),
    };
    const req = new Request("https://api.test/echo", {
      method: "POST",
      headers: { "content-type": "application/json", "CF-Connecting-IP": "1.2.3.4" },
      body: JSON.stringify({ hello: "world" }),
    });
    const response = (await handleEntryRequest(req, makeEnv(), {})) as Response;
    expect(await response.json()).toEqual({ hello: "world" });
  });
});

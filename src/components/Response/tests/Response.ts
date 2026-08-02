import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../Apiker";
import {
  res,
  res_200,
  res_201,
  res_204,
  res_400,
  res_401,
  res_404,
  res_405,
  res_429,
  res_500,
  resRaw,
} from "..";
import { RESPONSE_MESSAGES } from "../constants";

/**
 * Unit tests for the Response helpers (res / res_xxx / resRaw).
 */
describe("Response helpers", () => {
  beforeEach(() => {
    apiker.responseHeaders = new Headers({ "content-type": "application/json" });
    apiker.debug = false;
  });

  describe("res()", () => {
    it("wraps a string into { message }", async () => {
      const r = res("hello");
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ message: "hello" });
    });

    it("wraps a number into { message }", async () => {
      expect(await res(42).json()).toEqual({ message: 42 });
    });

    it("spreads an object payload", async () => {
      expect(await res({ a: 1, b: "x" }).json()).toEqual({ a: 1, b: "x" });
    });

    it("applies a numeric status passed as options", () => {
      expect(res("x", 418).status).toBe(418);
    });

    it("merges a ResponseInit options object", () => {
      const r = res("x", { status: 201, headers: apiker.responseHeaders });
      expect(r.status).toBe(201);
    });

    it("applies the configured default response headers", () => {
      expect(res("x").headers.get("content-type")).toBe("application/json");
    });

    it("pretty-prints the body when debug is enabled", async () => {
      apiker.debug = true;
      const body = await res({ a: 1 }).text();
      expect(body).toContain("\n");
    });

    it("does not pretty-print when debug is disabled", async () => {
      const body = await res({ a: 1 }).text();
      expect(body).not.toContain("\n");
    });
  });

  describe("status helpers", () => {
    // 204 is excluded: the Node/undici runtime forbids a body on a 204 (Workers allows it).
    it.each([
      [res_200, 200],
      [res_201, 201],
      [res_400, 400],
      [res_401, 401],
      [res_404, 404],
      [res_405, 405],
      [res_429, 429],
      [res_500, 500],
    ])("returns the right status and default message", async (fn: any, status: number) => {
      const r = fn();
      expect(r.status).toBe(status);
      expect(await r.json()).toEqual({ message: (RESPONSE_MESSAGES as any)[status] });
    });

    it("accepts a custom payload overriding the default message", async () => {
      expect(await res_400({ error: "bad" }).json()).toEqual({ error: "bad" });
    });

    it("res_204() cannot carry a body under the Node/undici test runtime (Workers-only)", () => {
      // Documents a Workers-vs-Node difference: undici throws for a 204 with a body.
      expect(() => res_204()).toThrow();
    });
  });

  describe("resRaw()", () => {
    it("returns the raw content and defaults to text/html", async () => {
      const r = resRaw("<h1>Hi</h1>");
      expect(r.headers.get("content-type")).toBe("text/html;charset=UTF-8");
      expect(await r.text()).toBe("<h1>Hi</h1>");
    });

    it("accepts a custom content type", () => {
      const r = resRaw("body { }", "text/css");
      expect(r.headers.get("content-type")).toBe("text/css;charset=UTF-8");
    });
  });
});

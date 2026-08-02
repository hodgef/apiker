import { describe, it, expect, jest } from "@jest/globals";
import { forwardToMiddleware } from "..";

/**
 * Unit tests for the middleware runner.
 */
describe("forwardToMiddleware", () => {
  const params: any = {};

  it("returns the first truthy response and short-circuits the chain", async () => {
    const first = new Response("first");
    const later = jest.fn();
    const result = await forwardToMiddleware(params, [
      () => undefined as any,
      () => first,
      later as any,
    ]);
    expect(result).toBe(first);
    expect(later).not.toHaveBeenCalled();
  });

  it("awaits asynchronous middleware", async () => {
    const r = new Response("async");
    const result = await forwardToMiddleware(params, [async () => r]);
    expect(result).toBe(r);
  });

  it("runs middleware in order until one responds", async () => {
    const calls: number[] = [];
    const result = await forwardToMiddleware(params, [
      () => {
        calls.push(1);
        return undefined as any;
      },
      () => {
        calls.push(2);
        return new Response("stop");
      },
      () => {
        calls.push(3);
        return new Response("never");
      },
    ]);
    expect(calls).toEqual([1, 2]);
    expect(await (result as Response).text()).toBe("stop");
  });

  it("catches a thrown error and returns a Response with the message", async () => {
    const result = (await forwardToMiddleware(params, [
      () => {
        throw new Error("boom");
      },
    ])) as Response;
    expect(result).toBeInstanceOf(Response);
    expect(await result.text()).toBe("boom");
  });

  it("returns a Response when no middleware yields a truthy value", async () => {
    const result = await forwardToMiddleware(params, [
      () => undefined as any,
      async () => undefined as any,
    ]);
    expect(result).toBeInstanceOf(Response);
  });

  it("returns a Response for an empty middleware list", async () => {
    const result = await forwardToMiddleware(params, []);
    expect(result).toBeInstanceOf(Response);
  });
});

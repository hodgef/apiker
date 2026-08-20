import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { rateLimitEndpoint } from "../Api/rateLimitEndpoint";

/**
 * Unit tests for the per-identity rate-limit history.
 *
 * RateLimit instances are namespaced per identity, so this reads that identity's
 * own instance directly instead of a shared index (there isn't one — see the
 * endpoint's own doc comment for why).
 */

let entriesByObjectId: Record<string, any[]>;
let requestedArgs: any[];

jest.mock("../../Logging", () => ({
  getAllLogEntries: async (objectName: string, limit: number, objectId: string) => {
    requestedArgs.push({ objectName, limit, objectId });
    return entriesByObjectId[objectId] || [];
  },
}));

const params = (search: string): any => ({
  request: new Request(`https://api.test/admp/ratelimit${search}`),
});

const body = async (res: any) => JSON.parse(await res.text());

describe("Rate limit history endpoint", () => {
  beforeEach(() => {
    entriesByObjectId = {};
    requestedArgs = [];
  });

  it("reads the requested identity's own instance, not any other's", async () => {
    entriesByObjectId["abc"] = [{ propertyName: "auth:abc:1", time: 1, id: "abc" }];
    entriesByObjectId["xyz"] = [{ propertyName: "auth:xyz:2", time: 2, id: "xyz" }];

    const { entries } = await body(await rateLimitEndpoint(params("?identity=abc")));

    expect(requestedArgs).toEqual([{ objectName: "RateLimit", limit: 200, objectId: "abc" }]);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("abc");
  });

  it("labels each entry by the prefix it counted toward", async () => {
    entriesByObjectId["abc"] = [{ propertyName: "auth-register:abc:1", time: 1, id: "abc" }];

    const { entries } = await body(await rateLimitEndpoint(params("?identity=abc")));

    expect(entries[0].type).toBe("auth-register");
  });

  it("returns newest first", async () => {
    entriesByObjectId["abc"] = [
      { propertyName: "auth:abc:1", time: 1, id: "abc" },
      { propertyName: "auth:abc:2", time: 2, id: "abc" },
    ];

    const { entries } = await body(await rateLimitEndpoint(params("?identity=abc")));

    expect(entries.map((e: any) => e.time)).toEqual([2, 1]);
  });

  it("does not query anything without an identity", async () => {
    const { entries } = await body(await rateLimitEndpoint(params("")));

    expect(entries).toEqual([]);
    expect(requestedArgs).toEqual([]);
  });
});

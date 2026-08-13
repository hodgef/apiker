import { describe, it, expect, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { banEntity, getBannedEntries, isEntityBanned } from "..";

/**
 * Builds a request context with a stubbed Durable Object state factory.
 */
const setup = (state: any) => {
  apiker.env = { APIKER_SECRET_KEY: "k" };
  apiker.objects = ["Bans"];
  apiker.requestParams = {
    headers: new Headers({ "CF-Connecting-IP": "1.1.1.1", "User-Agent": "jest" }),
    request: new Request("https://api.test/foo"),
    state,
  } as any;
};

/**
 * Unit tests for the Bans helpers.
 */
describe("Bans", () => {
  it("isEntityBanned returns false when there are no ban entries", async () => {
    setup(() => ({ list: async () => ({}) }));
    await expect(isEntityBanned("entity-1")).resolves.toBe(false);
  });

  it("isEntityBanned returns true when a ban entry exists", async () => {
    setup(() => ({ list: async () => ({ k: { propertyName: "bans:entity-1" } }) }));
    await expect(isEntityBanned("entity-1")).resolves.toBe(true);
  });

  it("getBannedEntries returns the listed ban entries", async () => {
    setup(() => ({ list: async () => ({ k: { id: "entity-1" } }) }));
    await expect(getBannedEntries("entity-1")).resolves.toEqual([{ id: "entity-1" }]);
  });

  it("banEntity records a ban log entry", async () => {
    const put = jest.fn(async () => ({}));
    setup(() => ({ put, get: async () => undefined, list: async () => ({}) }));
    await banEntity("entity-1");
    expect(put).toHaveBeenCalledTimes(1);
  });
});

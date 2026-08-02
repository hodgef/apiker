import { describe, it, expect, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import {
  addLogEntry,
  getAllLogEntries,
  getLogEntries,
  getLogParams,
  getUserLogPropertyName,
} from "..";

/**
 * Builds a request context with a stubbed Durable Object state factory.
 */
const setup = (state: any) => {
  apiker.env = { APIKER_SECRET_KEY: "k" };
  apiker.requestParams = {
    headers: new Headers({
      "CF-Connecting-IP": "1.1.1.1",
      "CF-IPCountry": "US",
      "User-Agent": "jest",
    }),
    request: new Request("https://api.test/foo?bar=1"),
    state,
  } as any;
};

/**
 * Unit tests for the Logging helpers.
 */
describe("Logging", () => {
  it("getUserLogPropertyName joins prefix and signed IP", () => {
    setup(() => ({}));
    expect(getUserLogPropertyName("bans", "sig")).toBe("bans:sig");
  });

  it("getLogParams builds a log object from the request context", () => {
    setup(() => ({}));
    const params = getLogParams("prop", "sig", "cid", { extra: true } as any);
    expect(params).toMatchObject({
      propertyName: "prop",
      id: "sig",
      clientId: "cid",
      countryCode: "US",
      pathname: "/foo",
      extra: true,
    });
    expect(typeof params.time).toBe("number");
  });

  it("getLogEntries returns the values of the listed entries", async () => {
    setup(() => ({
      list: async () => ({ k1: { propertyName: "a" }, k2: { propertyName: "b" } }),
    }));
    await expect(getLogEntries("prefix")).resolves.toEqual([
      { propertyName: "a" },
      { propertyName: "b" },
    ]);
  });

  it("getAllLogEntries returns every entry value", async () => {
    setup(() => ({ list: async () => ({ k1: { id: 1 }, k2: { id: 2 } }) }));
    await expect(getAllLogEntries()).resolves.toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("addLogEntry is a no-op when the object is not registered", async () => {
    const put = jest.fn();
    setup(() => ({ put }));
    apiker.objects = [];
    await addLogEntry("p", {}, "Logs");
    expect(put).not.toHaveBeenCalled();
  });

  it("addLogEntry writes an entry when the object is registered", async () => {
    const put = jest.fn(async (_payload?: any) => ({}));
    setup(() => ({ put }));
    apiker.objects = ["Logs"];
    await addLogEntry("p", {}, "Logs");
    expect(put).toHaveBeenCalledTimes(1);
    const written = put.mock.calls[0][0];
    expect(Object.keys(written)).toHaveLength(1);
  });
});

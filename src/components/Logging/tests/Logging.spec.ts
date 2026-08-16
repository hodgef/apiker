import { describe, it, expect, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { getTokens } from "../../Auth";
import {
  addLogEntry,
  getAllLogEntries,
  getIndexedLogEntries,
  getLogEntries,
  getLogParams,
  getUserLogPropertyName,
  logIndexInstance,
  logIndexKey,
  pruneLogIndexShard,
  pruneLogSeries,
  shouldPruneLogs,
  sweepLogInstance,
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

  it("getLogParams attributes the entry to the signed-in user", () => {
    setup(() => ({}));
    const { token } = getTokens("user-123");
    apiker.requestParams.headers = new Headers({
      "CF-Connecting-IP": "1.1.1.1",
      "CF-IPCountry": "US",
      "User-Agent": "jest",
      Authorization: `Bearer ${token}`,
    });
    expect(getLogParams("prop", "sig", "cid").userId).toBe("user-123");
  });

  it("getLogParams leaves anonymous requests unattributed", () => {
    setup(() => ({}));
    expect("userId" in getLogParams("prop", "sig", "cid")).toBe(false);
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
    // The entry itself, plus the copy that makes it listable.
    expect(put).toHaveBeenCalledTimes(2);
    const written = put.mock.calls[0][0];
    expect(Object.keys(written)).toHaveLength(1);
  });

  it("addLogEntry mirrors the entry into the caller's index shard", async () => {
    const put = jest.fn(async (_payload?: any) => ({}));
    const instances: any[] = [];
    setup((objectName: string, objectId: string) => {
      instances.push({ objectName, objectId });
      return { put };
    });
    apiker.objects = ["Logs"];

    await addLogEntry("p", {}, "Logs", "sig");

    expect(instances[1]).toEqual({ objectName: "Logs", objectId: logIndexInstance("sig") });
    const [key] = Object.keys(put.mock.calls[1][0]);
    expect(key).toMatch(/^\d{16}:p:sig:\d+$/);
  });

  it("addLogEntry leaves other objects unmirrored", async () => {
    const put = jest.fn(async (_payload?: any) => ({}));
    setup(() => ({ put }));
    apiker.objects = ["Bans"];
    await addLogEntry("p", {}, "Bans");
    expect(put).toHaveBeenCalledTimes(1);
  });

  // Logging must not put a second round trip in front of the caller's response.
  it("addLogEntry hands the mirror to the runtime when it can", async () => {
    const put = jest.fn(async (_payload?: any) => ({}));
    const deferred: any[] = [];
    setup(() => ({ put }));
    apiker.objects = ["Logs"];
    apiker.ctx = { waitUntil: (promise: any) => deferred.push(promise) };

    await addLogEntry("p", {}, "Logs");

    expect(deferred).toHaveLength(1);
    await Promise.all(deferred);
    expect(put).toHaveBeenCalledTimes(2);
    apiker.ctx = undefined;
  });

  it("logIndexInstance keeps one entity in one shard", () => {
    expect(logIndexInstance("sig")).toBe(logIndexInstance("sig"));
    expect(logIndexInstance("")).toMatch(/^_logindex:\d$/);
  });

  it("logIndexKey sorts by time, not by prefix", () => {
    const early = logIndexKey({ time: 2, propertyName: "zeta:x:2" } as any);
    const late = logIndexKey({ time: 10, propertyName: "alpha:x:10" } as any);
    expect(early < late).toBe(true);
  });

  it("getIndexedLogEntries merges every shard, newest first", async () => {
    const shards: Record<string, any> = {
      "_logindex:0": { a: { time: 1 }, b: { time: 9 } },
      "_logindex:3": { c: { time: 5 } },
    };
    setup((_objectName: string, objectId: string) => ({
      list: async () => shards[objectId] || {},
    }));

    const { entries, truncated } = await getIndexedLogEntries();

    expect(entries.map(({ time }) => time)).toEqual([9, 5, 1]);
    expect(truncated).toBe(false);
  });

  it("getIndexedLogEntries reports a shard that filled its read", async () => {
    setup(() => ({ list: async () => ({ a: { time: 1 }, b: { time: 2 } }) }));

    const { truncated } = await getIndexedLogEntries(2);

    expect(truncated).toBe(true);
  });

  it("getIndexedLogEntries ignores a shard it cannot read", async () => {
    setup((_objectName: string, objectId: string) => ({
      list: async () => {
        if (objectId === "_logindex:0") throw new Error("unreachable");
        return { a: { time: 4 } };
      },
    }));

    const { entries } = await getIndexedLogEntries();

    expect(entries).toHaveLength(7);
  });

  describe("retention", () => {
    const DAY = 86400000;

    it("deletes only the entries of the series that fell out of retention", async () => {
      const list = jest.fn(async (_payload?: any) => ({ "p:sig:1": {}, "p:sig:2": {} }));
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ list, delete: del }));

      await expect(pruneLogSeries("p", "Logs", "sig")).resolves.toBe(2);

      const payload: any = list.mock.calls[0][0];
      expect(payload.prefix).toBe("p:sig:");
      expect(Number(payload.end.replace("p:sig:", ""))).toBeLessThanOrEqual(Date.now() - 30 * DAY);
      expect(del).toHaveBeenCalledWith(["p:sig:1", "p:sig:2"]);
    });

    it("deletes nothing when the series is within retention", async () => {
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ list: async () => ({}), delete: del }));

      await expect(pruneLogSeries("p", "Logs", "sig")).resolves.toBe(0);
      expect(del).not.toHaveBeenCalled();
    });

    // A ban is a decision, not an event: it has to outlive any window.
    it("never prunes an object without a retention", async () => {
      const list = jest.fn(async (_payload?: any) => ({ "p:sig:1": {} }));
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ list, delete: del }));

      await expect(pruneLogSeries("bans", "Bans", "sig")).resolves.toBe(0);
      expect(list).not.toHaveBeenCalled();
      expect(del).not.toHaveBeenCalled();
    });

    it("keeps rate limit counters for days, far beyond any window", async () => {
      const list = jest.fn(async (_payload?: any) => ({}));
      setup(() => ({ list, delete: async () => ({}) }));

      await pruneLogSeries("auth", "RateLimit", "sig");

      const payload: any = list.mock.calls[0][0];
      expect(Number(payload.end.replace("auth:sig:", ""))).toBeLessThanOrEqual(Date.now() - 2 * DAY);
    });

    it("prunes the mirror by time, since its keys start with one", async () => {
      const list = jest.fn(async (_payload?: any) => ({ "0000000000000001:p": {} }));
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ list, delete: del }));

      await expect(pruneLogIndexShard("_logindex:1")).resolves.toBe(1);

      const payload: any = list.mock.calls[0][0];
      expect(payload.prefix).toBeUndefined();
      expect(payload.end).toHaveLength(16);
      expect(del).toHaveBeenCalledWith(["0000000000000001:p"]);
    });

    it("survives an instance that cannot be swept", async () => {
      setup(() => ({
        list: async () => {
          throw new Error("unreachable");
        },
      }));

      await expect(pruneLogSeries("p", "Logs", "sig")).resolves.toBe(0);
      await expect(pruneLogIndexShard("_logindex:1")).resolves.toBe(0);
    });

    it("sweeps on a fraction of writes, not on every one", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.9);
      expect(shouldPruneLogs()).toBe(false);
      jest.spyOn(Math, "random").mockReturnValue(0);
      expect(shouldPruneLogs()).toBe(true);
      jest.restoreAllMocks();
    });

    it("addLogEntry sweeps in the background when the write is sampled", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      const put = jest.fn(async (_payload?: any) => ({}));
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ put, list: async () => ({ "p:sig:1": {} }), delete: del }));
      apiker.objects = ["Logs"];

      await addLogEntry("p", {}, "Logs", "sig");

      expect(del).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it("addLogEntry does not sweep a write it did not sample", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.9);
      const put = jest.fn(async (_payload?: any) => ({}));
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ put, list: async () => ({ "p:sig:1": {} }), delete: del }));
      apiker.objects = ["Logs"];

      await addLogEntry("p", {}, "Logs", "sig");

      expect(del).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  describe("sweepLogInstance", () => {
    const DAY = 86400000;
    const fresh = { time: Date.now(), id: "sig", propertyName: "p:sig:1" };
    const old = { time: Date.now() - 40 * DAY, id: "sig", propertyName: "p:sig:0" };

    it("drops what is past retention and indexes what is left", async () => {
      const del = jest.fn(async (_keys?: any) => ({}));
      const put = jest.fn(async (_payload?: any) => ({}));
      setup(() => ({
        list: async () => ({ "p:sig:0": old, "p:sig:1": fresh }),
        delete: del,
        put,
      }));

      await expect(sweepLogInstance("cf-id")).resolves.toEqual({ deleted: 1, indexed: 1 });
      expect(del).toHaveBeenCalledWith(["p:sig:0"]);
      expect(Object.keys(put.mock.calls[0][0])[0]).toBe(logIndexKey(fresh as any));
    });

    it("reads the instance by its Cloudflare id", async () => {
      const instances: any[] = [];
      setup((objectName: string, objectId: string, isCloudflareObjectId?: boolean) => {
        instances.push({ objectName, objectId, isCloudflareObjectId });
        return { list: async () => ({}), delete: async () => ({}), put: async () => ({}) };
      });

      await sweepLogInstance("cf-id");

      expect(instances[0]).toEqual({
        objectName: "Logs",
        objectId: "cf-id",
        isCloudflareObjectId: true,
      });
    });

    it("does not re-index the mirror's own entries", async () => {
      const put = jest.fn(async (_payload?: any) => ({}));
      setup(() => ({
        list: async () => ({ [logIndexKey(fresh as any)]: fresh }),
        delete: async () => ({}),
        put,
      }));

      await expect(sweepLogInstance("cf-id")).resolves.toEqual({ deleted: 0, indexed: 0 });
      expect(put).not.toHaveBeenCalled();
    });

    it("deletes in batches a Durable Object will accept", async () => {
      const stored: Record<string, any> = {};
      for (let i = 0; i < 200; i++) stored[`p:sig:${i}`] = old;
      const del = jest.fn(async (_keys?: any) => ({}));
      setup(() => ({ list: async () => stored, delete: del, put: async () => ({}) }));

      const { deleted } = await sweepLogInstance("cf-id");

      expect(deleted).toBe(200);
      expect(del).toHaveBeenCalledTimes(2);
      expect((del.mock.calls[0][0] as any).length).toBe(128);
    });

    it("gives up quietly on an instance it cannot read", async () => {
      setup(() => ({
        list: async () => {
          throw new Error("unreachable");
        },
      }));

      await expect(sweepLogInstance("cf-id")).resolves.toEqual({ deleted: 0, indexed: 0 });
    });
  });
});

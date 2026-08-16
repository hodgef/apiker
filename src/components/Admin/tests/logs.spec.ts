import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { searchLogsEndpoint, sweepLogsEndpoint } from "../Api/logsEndpoint";

/**
 * Unit tests for log browsing.
 *
 * Logs live in an object per caller, so the endpoint reads the index instead;
 * without that an admin only ever sees the entries their own requests produced.
 */

let indexed: any[];
let indexTruncated: boolean;
let instanceList: any;
let swept: string[];
let sweptAt: number | undefined;
let stored: any;

jest.mock("../../Logging", () => ({
  LOG_INDEX_SCAN: 200,
  LOG_RETENTION_DAYS: { Logs: 30 },
  getIndexedLogEntries: async () => ({ entries: indexed, truncated: indexTruncated }),
  sweepLogInstance: async (id: string) => {
    swept.push(id);
    return { deleted: 1, indexed: 2 };
  },
}));

jest.mock("../../Cloudflare", () => ({
  getInstanceList: async () => {
    if (instanceList instanceof Error) {
      throw instanceList;
    }
    return instanceList;
  },
}));

const params = (search = ""): any => ({
  request: new Request(`https://api.test/admp/logs${search}`),
  state: () => ({
    get: async () => sweptAt,
    put: async (payload: any) => {
      stored = payload;
    },
  }),
});

const entry = (propertyName: string, time: number) => ({ propertyName, time, id: "abc" });

const body = async (res: any) => JSON.parse(await res.text());

/** The index hands entries over newest first. */
const byNewest = (entries: any[]) => [...entries].sort((a, b) => b.time - a.time);

describe("Logs endpoint", () => {
  beforeEach(() => {
    apiker.responseHeaders = new Headers();
    apiker.env = { CLOUDFLARE_ACCOUNT_ID: "a", CLOUDFLARE_EMAIL: "b", CLOUDFLARE_API_KEY: "c" };
    indexed = [];
    indexTruncated = false;
    sweptAt = undefined;
    stored = undefined;
  });

  // A namespace walk is only worth offering when it would actually find something.
  it("asks for a sweep while none has ever run", async () => {
    const { sweepNeeded, sweptAt: reported } = await body(await searchLogsEndpoint(params()));

    expect(sweepNeeded).toBe(true);
    expect(reported).toBeNull();
  });

  it("stops asking once one has run", async () => {
    sweptAt = Date.now();

    const { sweepNeeded } = await body(await searchLogsEndpoint(params()));

    expect(sweepNeeded).toBe(false);
  });

  it("asks again once a retention period of strays could have built up", async () => {
    sweptAt = Date.now() - 31 * 86400000;

    const { sweepNeeded } = await body(await searchLogsEndpoint(params()));

    expect(sweepNeeded).toBe(true);
  });

  it("never asks for a sweep it could not run", async () => {
    apiker.env = { CLOUDFLARE_ACCOUNT_ID: "a" };

    const { sweepNeeded } = await body(await searchLogsEndpoint(params()));

    expect(sweepNeeded).toBe(false);
  });

  it("lists the available log ids with a count", async () => {
    indexed = byNewest([
      entry("admin-login:a:3", 3),
      entry("admin-login:b:2", 2),
      entry("signup:c:1", 1),
    ]);

    const { logIds } = await body(await searchLogsEndpoint(params()));

    expect(logIds).toEqual([
      { id: "admin-login", count: 2, lastSeen: 3 },
      { id: "signup", count: 1, lastSeen: 1 },
    ]);
  });

  it("orders log ids by the most recent activity", async () => {
    indexed = byNewest([entry("old:a:1", 1), entry("fresh:b:9", 9)]);

    const { logIds } = await body(await searchLogsEndpoint(params()));

    expect(logIds.map((log: any) => log.id)).toEqual(["fresh", "old"]);
  });

  it("returns recent entries newest first when nothing is selected", async () => {
    indexed = byNewest([entry("a:x:1", 1), entry("b:x:5", 5)]);

    const { entries } = await body(await searchLogsEndpoint(params()));

    expect(entries.map((e: any) => e.time)).toEqual([5, 1]);
  });

  it("filters by the requested log id", async () => {
    indexed = byNewest([
      entry("signup:a:2", 2),
      entry("signup:b:7", 7),
      entry("admin-login:c:9", 9),
    ]);

    const { entries, logIds } = await body(await searchLogsEndpoint(params("?logId=signup")));

    expect(entries.map((e: any) => e.time)).toEqual([7, 2]);
    expect(logIds).toBeUndefined();
  });

  // A dashboard row is one caller's event, so drilling in follows the caller.
  it("follows one request identity across every log", async () => {
    indexed = byNewest([
      { propertyName: "signup:me:2", time: 2, id: "me" },
      { propertyName: "config:me:7", time: 7, id: "me" },
      { propertyName: "config:someone:9", time: 9, id: "someone" },
    ]);

    const { entries } = await body(await searchLogsEndpoint(params("?identity=me")));

    expect(entries.map((e: any) => e.propertyName)).toEqual(["config:me:7", "signup:me:2"]);
  });

  it("matches a signed-in user id as an identity too", async () => {
    indexed = [{ propertyName: "config:sig:1", time: 1, id: "sig", userId: "user-1" }];

    const { entries } = await body(await searchLogsEndpoint(params("?identity=user-1")));

    expect(entries).toHaveLength(1);
  });

  it("combines an identity with a log id", async () => {
    indexed = byNewest([
      { propertyName: "signup:me:2", time: 2, id: "me" },
      { propertyName: "config:me:7", time: 7, id: "me" },
      { propertyName: "config:someone:9", time: 9, id: "someone" },
    ]);

    const { entries } = await body(await searchLogsEndpoint(params("?identity=me&logId=config")));

    expect(entries.map((e: any) => e.propertyName)).toEqual(["config:me:7"]);
  });

  it("says nothing was found rather than falling back to everything", async () => {
    indexed = [entry("signup:a:2", 2)];

    const { entries } = await body(await searchLogsEndpoint(params("?identity=nobody")));

    expect(entries).toEqual([]);
  });

  it("has nothing to offer when no logs were recorded", async () => {
    const { logIds, entries } = await body(await searchLogsEndpoint(params()));

    expect(logIds).toEqual([]);
    expect(entries).toEqual([]);
  });

  it("does not claim to be truncated when the scan fits", async () => {
    indexed = [entry("a:x:1", 1)];

    const { truncated, scanned, limit } = await body(await searchLogsEndpoint(params()));

    expect(truncated).toBe(false);
    expect(scanned).toBe(1);
    expect(limit).toBe(200);
  });

  it("passes on that the index hit its read limit", async () => {
    indexed = [entry("a:x:1", 1)];
    indexTruncated = true;

    const { truncated } = await body(await searchLogsEndpoint(params()));

    expect(truncated).toBe(true);
  });

  it("reports truncation on a filtered read too", async () => {
    indexed = [entry("signup:x:1", 1)];
    indexTruncated = true;

    const { truncated, limit } = await body(await searchLogsEndpoint(params("?logId=signup")));

    expect(truncated).toBe(true);
    expect(limit).toBe(100);
  });
});

/**
 * The sweep is the only thing that reaches instances nobody writes to any more,
 * so it has to be resumable and must never run without credentials.
 */
describe("Logs sweep", () => {
  const env = { CLOUDFLARE_ACCOUNT_ID: "a", CLOUDFLARE_EMAIL: "b", CLOUDFLARE_API_KEY: "c" };
  const instances = (count: number) =>
    ({ result: Array.from({ length: count }, (_, i) => ({ id: `id-${String(i).padStart(3, "0")}` })) });

  beforeEach(() => {
    apiker.responseHeaders = new Headers();
    apiker.env = { ...env };
    apiker.name = "demo";
    instanceList = instances(0);
    swept = [];
    sweptAt = undefined;
    stored = undefined;
  });

  it("refuses to run without the Cloudflare credentials", async () => {
    apiker.env = { CLOUDFLARE_ACCOUNT_ID: "a" };

    const { available, missing } = await body(await sweepLogsEndpoint(params()));

    expect(available).toBe(false);
    expect(missing).toEqual(["CLOUDFLARE_EMAIL", "CLOUDFLARE_API_KEY"]);
    expect(swept).toEqual([]);
  });

  it("reports a Cloudflare API failure instead of throwing", async () => {
    instanceList = new Error("nope");

    const { available, error } = await body(await sweepLogsEndpoint(params()));

    expect(available).toBe(false);
    expect(error).toBe("nope");
  });

  it("sweeps a chunk and reports where to resume", async () => {
    instanceList = instances(30);

    const { deleted, indexed: kept, read, nextCursor, remaining } =
      await body(await sweepLogsEndpoint(params()));

    expect(swept).toHaveLength(25);
    expect(deleted).toBe(25);
    expect(kept).toBe(50);
    expect(read).toBe(25);
    expect(nextCursor).toBe(swept[24]);
    expect(remaining).toBe(30);
  });

  it("resumes after the given instance and finishes", async () => {
    instanceList = instances(30);
    const sorted = instances(30).result.map((i: any) => i.id).sort();

    const { read, nextCursor } = await body(await sweepLogsEndpoint(params(`?after=${sorted[24]}`)));

    expect(swept).toEqual(sorted.slice(25));
    expect(read).toBe(5);
    expect(nextCursor).toBeNull();
  });

  /**
   * Sweeping empties instances, which drops them from the listing: a positional
   * resume would step over everything that shifted down.
   */
  it("skips nothing when swept instances fall out of the listing", async () => {
    const all = instances(30).result.map((i: any) => i.id).sort();
    instanceList = instances(30);

    const first = await body(await sweepLogsEndpoint(params()));

    instanceList = { result: all.slice(25).map((id: string) => ({ id })) };
    swept = [];

    await sweepLogsEndpoint(params(`?after=${first.nextCursor}`));

    expect(swept).toEqual(all.slice(25));
  });

  it("records the sweep only once it has covered everything", async () => {
    instanceList = instances(30);
    const sorted = instances(30).result.map((i: any) => i.id).sort();

    const first = await body(await sweepLogsEndpoint(params()));
    expect(stored).toBeUndefined();
    expect(first.nextCursor).toBe(sorted[24]);

    await sweepLogsEndpoint(params(`?after=${sorted[24]}`));
    expect(stored.logsSweptAt).toBeGreaterThan(0);
  });

  it("skips instances that hold nothing", async () => {
    instanceList = { result: [{ id: "id-0", hasStoredData: false }, { id: "id-1" }] };

    await sweepLogsEndpoint(params());

    expect(swept).toEqual(["id-1"]);
  });
});

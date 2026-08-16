import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { getTokens } from "../../Auth";
import {
  BEACON_REPORT_NAMES,
  BEACON_SHARD_COUNT,
  areBeaconsAvailable,
  beaconShardInstance,
  getBeaconDay,
  getBeaconHour,
  getBeaconReport,
  localDayOf,
  normalizeBeaconName,
  parseBeaconKey,
  pruneBeacons,
  sendBeacon,
} from "..";

const DAY = 86400000;

/**
 * Records every call made through the state proxy so tests can assert on what
 * the beacons wrote, and to which shard.
 */
const makeState = (stores: Record<string, any> = {}) => {
  const calls: any[] = [];

  const state = jest.fn((objectName: string, objectId: string) => ({
    increment: jest.fn(async (payload: any) => {
      calls.push({ objectName, objectId, payload });
      return Object.keys(payload.increments || {}).reduce(
        (totals: any, key) => ({ ...totals, [key]: payload.increments[key] }),
        {}
      );
    }),
    list: jest.fn(async (options: any) => {
      calls.push({ objectName, objectId, list: options });
      return stores[objectId] || {};
    }),
    delete: jest.fn(async (propertyName: any) => {
      calls.push({ objectName, objectId, delete: propertyName });
      return true;
    }),
  }));

  return { state, calls };
};

const setup = (stores?: Record<string, any>) => {
  const { state, calls } = makeState(stores);

  apiker.env = { APIKER_SECRET_KEY: "k" };
  apiker.objects = [OBN.BEACONS];
  apiker.requestParams = {
    headers: new Headers({
      "CF-Connecting-IP": "1.1.1.1",
      "CF-IPCountry": "US",
      "User-Agent": "jest",
    }),
    request: new Request("https://api.test/pricing"),
    state,
  } as any;

  return { state, calls };
};

/**
 * Unit tests for the server-side beacons.
 */
describe("Beacons", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("normalizeBeaconName", () => {
    it("reduces a name to a safe key fragment", () => {
      expect(normalizeBeaconName("Page View")).toBe("page_view");
      expect(normalizeBeaconName("  sign:up! ")).toBe("sign_up");
    });

    it("is empty for a name with nothing usable in it", () => {
      expect(normalizeBeaconName("   ")).toBe("");
      expect(normalizeBeaconName(undefined as any)).toBe("");
    });
  });

  describe("getBeaconDay", () => {
    it("buckets by UTC day", () => {
      expect(getBeaconDay(Date.UTC(2024, 0, 31, 23, 59))).toBe("2024-01-31");
    });
  });

  describe("parseBeaconKey", () => {
    it("reads a plain counter", () => {
      expect(parseBeaconKey("b:2024-01-31T09:page_view")).toMatchObject({
        bucket: "2024-01-31T09",
        name: "page_view",
      });
    });

    it("reads a dimension counter", () => {
      expect(parseBeaconKey("b:2024-01-31:page_view:country:US")).toMatchObject({
        dimension: "country",
        value: "US",
      });
    });

    it("ignores keys that are not counters", () => {
      expect(parseBeaconKey("e:3")).toBeUndefined();
      expect(parseBeaconKey("")).toBeUndefined();
    });
  });

  describe("sendBeacon", () => {
    it("does nothing when the object is not registered", async () => {
      const { state } = setup();
      apiker.objects = [];
      await expect(sendBeacon("page_view")).resolves.toBe(false);
      expect(state).not.toHaveBeenCalled();
      expect(areBeaconsAvailable()).toBe(false);
    });

    it("does nothing for an unusable event name", async () => {
      const { state } = setup();
      await expect(sendBeacon("  ")).resolves.toBe(false);
      expect(state).not.toHaveBeenCalled();
    });

    it("counts the event by the hour, and its country by the day", async () => {
      const { calls } = setup();
      await expect(sendBeacon("Page View")).resolves.toBe(true);

      const day = getBeaconDay();
      const hour = getBeaconHour();
      expect(calls).toHaveLength(1);
      expect(calls[0].objectName).toBe(OBN.BEACONS);
      expect(calls[0].payload.increments).toEqual({
        [`b:${hour}:page_view`]: 1,
        [`b:${day}:page_view:country:US`]: 1,
      });
    });

    it("keeps a rotating sample of the event", async () => {
      const { calls } = setup();
      await sendBeacon("page_view", { plan: "pro" });

      const { ring } = calls[0].payload;
      expect(ring.prefix).toBe("e:");
      expect(ring.size).toBeGreaterThan(0);
      expect(ring.value).toMatchObject({
        name: "page_view",
        pathname: "/pricing",
        countryCode: "US",
        props: { plan: "pro" },
      });
    });

    it("attributes the event to the signed-in user", async () => {
      const { calls } = setup();
      const { token } = getTokens("user-123");
      apiker.requestParams.headers.set("Authorization", `Bearer ${token}`);

      await sendBeacon("page_view");

      expect(calls[0].payload.ring.value.userId).toBe("user-123");
    });

    it("keeps oversized properties out of storage", async () => {
      const { calls } = setup();
      const props: Record<string, any> = { long: "x".repeat(500) };
      for (let i = 0; i < 20; i++) props[`k${i}`] = i;

      await sendBeacon("page_view", props);

      const stored = calls[0].payload.ring.value.props;
      expect(Object.keys(stored).length).toBeLessThanOrEqual(8);
      expect(stored.long.length).toBe(120);
    });

    it("spreads writes over the shards", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.99);
      const { calls } = setup();
      await sendBeacon("page_view");
      expect(calls[0].objectId).toBe(beaconShardInstance(BEACON_SHARD_COUNT - 1));
    });

    it("never lets a storage failure reach the caller", async () => {
      setup();
      apiker.requestParams.state = () => ({
        increment: async () => {
          throw new Error("object unreachable");
        },
      });
      await expect(sendBeacon("page_view")).resolves.toBe(false);
    });
  });

  describe("getBeaconReport", () => {
    it("reports as unavailable when the object is not registered", async () => {
      setup();
      apiker.objects = [];
      await expect(getBeaconReport()).resolves.toEqual({
        available: false,
        days: [],
        totals: [],
        samples: [],
      });
    });

    it("folds counters from every shard into totals, days and countries", async () => {
      const today = getBeaconDay();
      const todayNoon = `${today}T12`;
      const yesterday = getBeaconDay(Date.now() - DAY);
      const yesterdayNoon = `${yesterday}T12`;

      setup({
        [beaconShardInstance(0)]: {
          [`b:${yesterdayNoon}:page_view`]: 2,
          [`b:${todayNoon}:page_view`]: 3,
          [`b:${today}:page_view:country:US`]: 3,
          [`b:${todayNoon}:signup`]: 1,
        },
        [beaconShardInstance(1)]: {
          [`b:${todayNoon}:page_view`]: 4,
          [`b:${today}:page_view:country:FR`]: 4,
        },
      });

      const report = await getBeaconReport(7);

      expect(report.available).toBe(true);
      expect(report.days).toEqual([yesterday, today].sort());
      expect(report.totals[0]).toMatchObject({
        name: "page_view",
        count: 9,
        countries: { US: 3, FR: 4 },
      });
      expect(report.totals[0].daily[today]).toBe(7);
      expect(report.totals[1]).toMatchObject({ name: "signup", count: 1 });
    });

    /**
     * Buckets are UTC hours; the days a report is grouped into belong to whoever
     * is reading it. Without this, "Today" empties out every evening for anyone
     * west of UTC.
     */
    describe("in the caller's timezone", () => {
      const hourly = (bucket: string, count: number) => ({
        [beaconShardInstance(0)]: { [`b:${bucket}:page_view`]: count },
      });

      it("counts an early UTC hour as the previous day for a western caller", async () => {
        const utcNow = new Date();
        const bucket = `${utcNow.toISOString().slice(0, 10)}T01`;
        setup(hourly(bucket, 4));

        // 01:00 UTC is still 21:00 the day before in New York (UTC+300 minutes).
        const report = await getBeaconReport(7, undefined, undefined, 300);

        const expected = new Date(Date.parse(`${bucket}:00:00Z`) - 300 * 60000)
          .toISOString()
          .slice(0, 10);
        expect(report.totals[0].daily[expected]).toBe(4);
        expect(report.days).toEqual([expected]);
      });

      it("counts a late UTC hour as the next day for an eastern caller", async () => {
        const utcNow = new Date();
        const bucket = `${utcNow.toISOString().slice(0, 10)}T23`;
        setup(hourly(bucket, 2));

        // 23:00 UTC is already 09:00 tomorrow in Sydney (UTC-600 minutes).
        const report = await getBeaconReport(7, undefined, undefined, -600);

        const expected = new Date(Date.parse(`${bucket}:00:00Z`) + 600 * 60000)
          .toISOString()
          .slice(0, 10);
        expect(report.totals[0].daily[expected]).toBe(2);
      });

      it("groups by UTC when no offset is given", async () => {
        const bucket = `${getBeaconDay()}T12`;
        setup(hourly(bucket, 5));

        const report = await getBeaconReport(7);

        expect(report.totals[0].daily[getBeaconDay()]).toBe(5);
      });

      it("leaves out an hour that falls before the caller's window", async () => {
        const midnight = new Date().setUTCHours(0, 0, 0, 0);
        const bucket = getBeaconHour(midnight - 3600000);
        setup(hourly(bucket, 9));

        const report = await getBeaconReport(1);

        expect(report.totals).toEqual([]);
      });

      // Counted before events were bucketed by the hour, so it keeps its own date.
      it("still reports a bucket that has no hour", async () => {
        setup(hourly(getBeaconDay(), 12));

        const report = await getBeaconReport(1);

        expect(report.totals[0]).toMatchObject({ name: "page_view", count: 12 });
        expect(report.days).toEqual([getBeaconDay()]);
      });
    });

    describe("localDayOf", () => {
      it("shifts an hour bucket into the caller's day", () => {
        expect(localDayOf("2026-08-14T01", 300)).toBe("2026-08-13");
        expect(localDayOf("2026-08-13T23", -600)).toBe("2026-08-14");
      });

      it("keeps a bucket with no hour on its own date, whatever the offset", () => {
        expect(localDayOf("2026-08-13", 0)).toBe("2026-08-13");
        expect(localDayOf("2026-08-13", 720)).toBe("2026-08-13");
        expect(localDayOf("2026-08-13", -780)).toBe("2026-08-13");
      });
    });

    it("starts the read on a date, so day-bucketed keys are not sorted past", async () => {
      const { calls } = setup();
      await getBeaconReport(7);

      const midnight = new Date().setUTCHours(0, 0, 0, 0);
      const listing = calls.find((call) => call.list && call.list.start);
      expect(listing.list.start).toBe(`b:${getBeaconDay(midnight - 6 * DAY - 3600000)}`);
    });

    it("returns the newest samples first", async () => {
      setup({
        [beaconShardInstance(0)]: {
          "e:0": { name: "page_view", time: 10 },
          "e:1": { name: "page_view", time: 30 },
        },
        [beaconShardInstance(1)]: {
          "e:0": { name: "signup", time: 20 },
        },
      });

      const report = await getBeaconReport(7);
      expect(report.samples.map(({ time }) => time)).toEqual([30, 20, 10]);
    });

    it("narrows to a single event name", async () => {
      const today = getBeaconDay();

      setup({
        [beaconShardInstance(0)]: {
          [`b:${today}:page_view`]: 3,
          [`b:${today}:signup`]: 1,
          "e:0": { name: "signup", time: 5 },
          "e:1": { name: "page_view", time: 6 },
        },
      });

      const report = await getBeaconReport(7, "Page View");
      expect(report.totals).toHaveLength(1);
      expect(report.totals[0].name).toBe("page_view");
      expect(report.samples.map(({ name }) => name)).toEqual(["page_view"]);
    });

    it("searches names by fragment", async () => {
      const today = getBeaconDay();

      setup({
        [beaconShardInstance(0)]: {
          [`b:${today}:user_login`]: 3,
          [`b:${today}:user_register`]: 2,
          [`b:${today}:deploy_success`]: 1,
          "e:0": { name: "deploy_success", time: 5 },
          "e:1": { name: "user_login", time: 6 },
        },
      });

      const report = await getBeaconReport(7, undefined, "USER");
      expect(report.totals.map(({ name }) => name)).toEqual(["user_login", "user_register"]);
      expect(report.samples.map(({ name }) => name)).toEqual(["user_login"]);
    });

    it("reports everything when the search is empty", async () => {
      const today = getBeaconDay();

      setup({
        [beaconShardInstance(0)]: {
          [`b:${today}:user_login`]: 3,
          [`b:${today}:deploy_success`]: 1,
        },
      });

      const report = await getBeaconReport(7, undefined, "   ");
      expect(report.totals).toHaveLength(2);
    });

    it("survives a shard that cannot be read", async () => {
      setup();
      apiker.requestParams.state = () => ({
        list: async () => {
          throw new Error("object unreachable");
        },
      });

      await expect(getBeaconReport(7)).resolves.toMatchObject({ available: true, totals: [] });
    });

    it("returns only the busiest names, so a flood of them cannot bloat the report", async () => {
      const today = getBeaconDay();
      const counters: Record<string, number> = {};
      for (let i = 0; i < BEACON_REPORT_NAMES + 20; i++) {
        counters[`b:${today}:event_${i}`] = i;
      }

      setup({ [beaconShardInstance(0)]: counters });

      const report = await getBeaconReport(7);
      expect(report.totals).toHaveLength(BEACON_REPORT_NAMES);
      expect(report.totals[0].count).toBe(BEACON_REPORT_NAMES + 19);
    });
  });

  describe("pruneBeacons", () => {
    it("deletes counters older than the cutoff, per shard", async () => {
      const { calls } = setup({
        [beaconShardInstance(0)]: { "b:2020-01-01:page_view": 1, "b:2020-01-02:page_view": 2 },
      });

      await expect(pruneBeacons("2024-01-01")).resolves.toBe(2);

      const deletion = calls.find((call) => call.delete);
      expect(deletion.delete).toEqual(["b:2020-01-01:page_view", "b:2020-01-02:page_view"]);
      expect(calls.filter((call) => call.list).length).toBe(BEACON_SHARD_COUNT);
    });

    it("deletes nothing when every counter is inside retention", async () => {
      const { calls } = setup();
      await expect(pruneBeacons("2024-01-01")).resolves.toBe(0);
      expect(calls.some((call) => call.delete)).toBe(false);
    });

    it("does nothing when the object is not registered", async () => {
      setup();
      apiker.objects = [];
      await expect(pruneBeacons("2024-01-01")).resolves.toBe(0);
    });
  });
});

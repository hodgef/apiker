import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { overviewEndpoint } from "../Api/overviewEndpoint";

/**
 * Unit tests for the dashboard payload.
 *
 * The dashboard is the only place an admin sees the deployment's posture, so the
 * counts have to be honest and the environment must never leak its values.
 */

let logEntries: any[];
let banEntries: any[];
let rateLimitEntries: any[];
let adminIds: string[];

jest.mock("../../Logging", () => ({
  getAllLogEntries: async (objectName: string) =>
    objectName === "RateLimit" ? rateLimitEntries : logEntries,
  getIndexedLogEntries: async () => ({ entries: logEntries, truncated: false }),
}));

jest.mock("../../Bans", () => ({
  getBannedEntities: async () => banEntries,
}));

const params = (): any => ({
  state: () => ({ get: async (key: string) => (key === "adminIds" ? adminIds : undefined) }),
});

const entry = (overrides: any = {}) => ({
  propertyName: "admin-login:abc:1",
  time: Date.now(),
  id: "abc",
  ...overrides,
});

const body = async (res: any) => JSON.parse(await res.text());

describe("Overview endpoint", () => {
  beforeEach(() => {
    apiker.name = "Demo";
    apiker.objects = [OBN.COMMON, OBN.LOGS, OBN.BANS, OBN.RATELIMIT];
    apiker.routes = { "/a": null, "/b": null } as any;
    apiker.responseHeaders = new Headers();
    apiker.env = {};
    logEntries = [];
    banEntries = [];
    rateLimitEntries = [];
    adminIds = ["admin-1"];
  });

  it("reports what the deployment is running", async () => {
    apiker.authRoutes = true;
    apiker.firewall = { limitRequestsPerMinute: 30 } as any;

    const { deployment } = await body(await overviewEndpoint(params()));

    expect(deployment.name).toBe("Demo");
    expect(deployment.authRoutes).toBe(true);
    expect(deployment.firewall).toEqual({ limitRequestsPerMinute: 30 });
    expect(deployment.routes).toEqual(["/a", "/b"]);
    expect(deployment.adminCount).toBe(1);
  });

  it("reports protections as booleans, never their values", async () => {
    apiker.env = { ADMP_SETUP_SECRET: "super-secret", ADMP_IP_WHITELIST: "1.2.3.4" };

    const res = await overviewEndpoint(params());
    const payload = await res.clone().text();
    const { deployment } = JSON.parse(payload);

    expect(deployment.protections).toEqual({
      setupSecret: true,
      ipWhitelist: true,
      ispWhitelist: false,
      cityWhitelist: false,
      cloudflareWaf: false,
    });
    expect(payload).not.toContain("super-secret");
    expect(payload).not.toContain("1.2.3.4");
  });

  it("counts only what happened inside each window", async () => {
    const old = Date.now() - 1000 * 60 * 60 * 48;
    logEntries = [entry(), entry({ time: old })];
    banEntries = [entry({ time: old })];
    rateLimitEntries = [entry(), entry({ time: Date.now() - 1000 * 60 * 90 })];

    const { totals } = await body(await overviewEndpoint(params()));

    expect(totals).toMatchObject({
      events: 2,
      eventsToday: 1,
      bans: 1,
      bansToday: 0,
      countedLastHour: 1,
      admins: 1,
    });
  });

  it("returns the newest events first and labels them by prefix", async () => {
    logEntries = [
      entry({ propertyName: "admin-login:a:1", time: 1 }),
      entry({ propertyName: "signup:b:2", time: 2 }),
    ];

    const { events } = await body(await overviewEndpoint(params()));

    expect(events.map((e: any) => e.type)).toEqual(["signup", "admin-login"]);
  });

  it("caps the number of events it sends", async () => {
    logEntries = Array.from({ length: 40 }, (_, index) =>
      entry({ propertyName: `admin-login:a:${index}`, time: index })
    );

    const { events, totals } = await body(await overviewEndpoint(params()));

    expect(events).toHaveLength(25);
    expect(totals.events).toBe(40);
  });

  it("stays usable when the optional objects are not registered", async () => {
    apiker.objects = [OBN.COMMON];
    logEntries = [entry()];
    banEntries = [entry()];

    const { events, bans, totals } = await body(await overviewEndpoint(params()));

    expect(events).toEqual([]);
    expect(bans).toEqual([]);
    expect(totals.events).toBe(0);
  });

  it("builds a 7-day event trend with today's count in the last bucket", async () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    logEntries = [entry({ time: Date.now() }), entry({ time: Date.now() }), entry({ time: twoDaysAgo })];

    const { eventsTrend } = await body(await overviewEndpoint(params()));

    expect(eventsTrend.days).toHaveLength(7);
    expect(eventsTrend.values).toHaveLength(7);
    expect(eventsTrend.values[6]).toBe(2);
    expect(eventsTrend.values.reduce((sum: number, n: number) => sum + n, 0)).toBe(3);
  });

  it("gives every day in the trend a bucket, even with no events", async () => {
    logEntries = [];

    const { eventsTrend } = await body(await overviewEndpoint(params()));

    expect(eventsTrend.values.every((n: number) => n === 0)).toBe(true);
  });
});

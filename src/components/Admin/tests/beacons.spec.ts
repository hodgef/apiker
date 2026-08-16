import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { beaconsEndpoint } from "../Api/beaconsEndpoint";

/**
 * Unit tests for the beacon report endpoint.
 *
 * The window is caller-supplied, so what it does with it is what keeps a report
 * from costing more than it should.
 */

let requested: { days?: number; name?: string; search?: string; offset?: number };

jest.mock("../../Beacons", () => ({
  BEACON_REPORT_DAYS: 7,
  getBeaconReport: async (days: number, name?: string, search?: string, offset?: number) => {
    requested = { days, name, search, offset };
    return { available: true, days: [], totals: [], samples: [] };
  },
}));

const params = (search = ""): any => ({
  request: new Request(`https://api.test/admp/beacons${search}`),
});

const body = async (res: any) => JSON.parse(await res.text());

describe("Beacons endpoint", () => {
  beforeEach(() => {
    apiker.responseHeaders = new Headers();
    requested = {};
  });

  it("reports on a week by default", async () => {
    await beaconsEndpoint(params());
    expect(requested).toEqual({ days: 7, name: undefined, search: undefined, offset: 0 });
  });

  // Buckets are UTC hours; the days belong to whoever is reading the report.
  it("passes the caller's timezone offset through", async () => {
    await beaconsEndpoint(params("?offset=300"));
    expect(requested.offset).toBe(300);

    await beaconsEndpoint(params("?offset=-600"));
    expect(requested.offset).toBe(-600);
  });

  it("refuses an offset that is not a timezone", async () => {
    await beaconsEndpoint(params("?offset=99999"));
    expect(requested.offset).toBe(840);

    await beaconsEndpoint(params("?offset=nonsense"));
    expect(requested.offset).toBe(0);
  });

  it("honours the requested window", async () => {
    await beaconsEndpoint(params("?days=30"));
    expect(requested.days).toBe(30);
  });

  it("caps the window so one request cannot read the whole store", async () => {
    await beaconsEndpoint(params("?days=100000"));
    expect(requested.days).toBe(90);
  });

  it("never reads less than a day", async () => {
    await beaconsEndpoint(params("?days=0"));
    expect(requested.days).toBe(1);
  });

  it("falls back to the default for a window that is not a number", async () => {
    await beaconsEndpoint(params("?days=lots"));
    expect(requested.days).toBe(7);
  });

  it("passes a name filter through for drill-down", async () => {
    await beaconsEndpoint(params("?name=page_view"));
    expect(requested.name).toBe("page_view");
  });

  it("passes a search fragment through", async () => {
    await beaconsEndpoint(params("?q=user"));
    expect(requested.search).toBe("user");
  });

  it("returns the report", async () => {
    await expect(body(await beaconsEndpoint(params()))).resolves.toEqual({
      available: true,
      days: [],
      totals: [],
      samples: [],
    });
  });
});

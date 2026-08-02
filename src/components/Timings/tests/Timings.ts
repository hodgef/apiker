import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../Apiker";
import { elapsedSinceRequestStart, measureTiming } from "..";
import { TIMINGS } from "../constants";

/**
 * Unit tests for the Timings helpers.
 */
describe("Timings", () => {
  beforeEach(() => {
    apiker.timings = {};
  });

  it("measureTiming stores the timestamp under the given name and returns it", () => {
    const before = Date.now();
    const t = measureTiming("foo");
    expect(apiker.timings.foo).toBe(t);
    expect(t).toBeGreaterThanOrEqual(before);
  });

  it("measureTiming overwrites a previous value for the same name", () => {
    measureTiming("foo");
    const second = measureTiming("foo");
    expect(apiker.timings.foo).toBe(second);
  });

  it("elapsedSinceRequestStart returns the elapsed ms since REQUEST_START", () => {
    apiker.timings[TIMINGS.REQUEST_START] = Date.now() - 50;
    expect(elapsedSinceRequestStart()).toBeGreaterThanOrEqual(50);
  });
});

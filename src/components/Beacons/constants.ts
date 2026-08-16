/** Key prefix for beacon counters: `b:<day>:<name>[:<dimension>:<value>]`. */
export const BEACON_COUNTER_PREFIX = "b";

/** Key prefix for the rotating sample buffer: `e:<slot>`. */
export const BEACON_SAMPLE_PREFIX = "e:";

/**
 * Writes are spread across this many object instances so that a busy deployment
 * is not funnelled through a single Durable Object.
 */
export const BEACON_SHARD_COUNT = 8;

/** Samples kept per shard. Storage for samples is therefore fixed, never growing. */
export const BEACON_SAMPLE_SLOTS = 20;

/** How far back the report looks by default. */
export const BEACON_REPORT_DAYS = 7;

/** Counters older than this are dropped when a report is requested. */
export const BEACON_RETENTION_DAYS = 60;

/** Dimension recorded alongside the plain event count. */
export const BEACON_COUNTRY_DIMENSION = "country";

/** Busiest event names a report returns, so one noisy name set cannot flood it. */
export const BEACON_REPORT_NAMES = 50;

/**
 * Log entries live in a Durable Object instance per caller (`Logs` maps to
 * `signedIp` by default), which makes them invisible to anything that did not
 * write them. Every entry is therefore mirrored into a small, fixed set of
 * instances that can actually be listed.
 */
export const LOG_INDEX_PREFIX = "_logindex:";

/** Instances the mirror is spread over, so one object is not a write bottleneck. */
export const LOG_INDEX_SHARDS = 8;

/** Entries read per shard when the panel lists activity. */
export const LOG_INDEX_SCAN = 200;

/**
 * How long entries are kept, per object.
 *
 * Objects missing from this table are never pruned — bans in particular are a
 * decision, not an event, and have to outlive any window.
 */
export const LOG_RETENTION_DAYS: Record<string, number> = {
    Logs: 30,
    /** Counters are only ever read over a window of minutes or hours. */
    RateLimit: 2
};

/** Writes that also sweep the series they just wrote to, as a 1-in-N chance. */
export const LOG_PRUNE_CHANCE = 20;

/** Keys deleted per sweep; a Durable Object takes at most 128 in one delete. */
export const LOG_PRUNE_LIMIT = 128;

/** Entries read from one instance during a namespace sweep. */
export const LOG_SWEEP_SCAN = 512;

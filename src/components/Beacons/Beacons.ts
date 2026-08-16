import { apiker } from "../Apiker";
import { getCurrentUserId } from "../Auth";
import { OBN } from "../ObjectBase";
import {
    BEACON_COUNTER_PREFIX,
    BEACON_COUNTRY_DIMENSION,
    BEACON_REPORT_DAYS,
    BEACON_REPORT_NAMES,
    BEACON_RETENTION_DAYS,
    BEACON_SAMPLE_PREFIX,
    BEACON_SAMPLE_SLOTS,
    BEACON_SHARD_COUNT
} from "./constants";
import { BeaconReport, BeaconSample, BeaconTotal } from "./interfaces";

const DAY = 86400000;
const HOUR = 3600000;
const MAX_PROPS = 8;
const MAX_PROP_LENGTH = 120;

/** Day bucket a beacon's dimensions are counted in, as `YYYY-MM-DD`. */
export const getBeaconDay = (time = Date.now()) => new Date(time).toISOString().slice(0, 10);

/**
 * Bucket an event is counted in, as `YYYY-MM-DDTHH`.
 *
 * Counting by the hour is what lets a report add the buckets up into the days of
 * whatever timezone is asking: a UTC day cannot be split into a local one.
 */
export const getBeaconHour = (time = Date.now()) => new Date(time).toISOString().slice(0, 13);

/**
 * The day a bucket falls on for a viewer that many minutes behind UTC.
 *
 * A bucket recorded before events were counted hourly has no hour to place it by,
 * so it keeps its own date rather than being slid into a neighbouring one.
 */
export const localDayOf = (bucket: string, offsetMinutes = 0) =>
    bucket.length > 10
        ? new Date(Date.parse(`${bucket}:00:00Z`) - offsetMinutes * 60000).toISOString().slice(0, 10)
        : bucket;

/** Instance a shard's counters live in. */
export const beaconShardInstance = (shard: number) => `_beacons:${shard}`;

/**
 * Event names become part of a storage key, so they are reduced to a safe,
 * predictable form: lowercase, no separators, bounded length.
 */
export const normalizeBeaconName = (name: string) =>
    String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48);

/** Keeps a sample small enough to be worth storing on every event. */
const normalizeProps = (props: Record<string, any> = {}) => {
    const entries = Object.keys(props || {})
        .slice(0, MAX_PROPS)
        .map((key) => {
            const value = props[key];
            const isPlain = typeof value === "number" || typeof value === "boolean";
            return [key, isPlain ? value : String(value ?? "").slice(0, MAX_PROP_LENGTH)];
        });

    return entries.length ? (Object as any).fromEntries(entries) : undefined;
};

/** Whether this deployment records beacons at all. */
export const areBeaconsAvailable = () => !!apiker.objects?.includes(OBN.BEACONS);

/**
 * Records a server-side event.
 *
 * Counting happens inside the Durable Object, so concurrent requests cannot
 * overwrite each other's increment, and writes are spread over
 * {@link BEACON_SHARD_COUNT} instances so no single object becomes the
 * bottleneck. Alongside the counters a copy of the event is kept in a rotating,
 * fixed-size buffer so the panel can show what actually happened.
 *
 * Never throws: reporting must not be able to fail a request.
 *
 * @param name Event name, e.g. `page_view`.
 * @param props Small, free-form details to keep with the sample.
 * @returns Whether the event was recorded.
 */
export const sendBeacon = async (name: string, props: Record<string, any> = {}): Promise<boolean> => {
    const eventName = normalizeBeaconName(name);

    if (!eventName || !areBeaconsAvailable()) {
        return false;
    }

    try {
        const { state, headers, request } = apiker.requestParams;
        const countryCode = headers?.get("CF-IPCountry") as string;
        const pathname = request ? new URL(request.url).pathname : undefined;
        const day = getBeaconDay();
        const counter = `${BEACON_COUNTER_PREFIX}:${getBeaconHour()}:${eventName}`;

        const increments: Record<string, number> = { [counter]: 1 };

        if (countryCode) {
            /** Dimensions stay per day: they are read as a total, not as a series. */
            increments[`${BEACON_COUNTER_PREFIX}:${day}:${eventName}:${BEACON_COUNTRY_DIMENSION}:${countryCode}`] = 1;
        }

        const sample: BeaconSample = {
            name: eventName,
            time: Date.now(),
            pathname,
            countryCode,
            userId: getCurrentUserId(),
            props: normalizeProps(props)
        };

        const shard = Math.floor(Math.random() * BEACON_SHARD_COUNT);

        await state(OBN.BEACONS, beaconShardInstance(shard)).increment({
            increments,
            ring: {
                prefix: BEACON_SAMPLE_PREFIX,
                size: BEACON_SAMPLE_SLOTS,
                from: counter,
                value: sample
            }
        });

        return true;
    } catch (e) {
        return false;
    }
};

/** Splits `b:<bucket>:<name>[:<dimension>:<value>]` into its parts. */
export const parseBeaconKey = (key: string) => {
    const [prefix, bucket, name, dimension, ...rest] = String(key || "").split(":");

    if (prefix !== BEACON_COUNTER_PREFIX || !bucket || !name) {
        return;
    }

    return { bucket, name, dimension, value: rest.join(":") };
};

const emptyTotal = (name: string): BeaconTotal => ({ name, count: 0, daily: {}, countries: {} });

/**
 * Reads every shard and folds the counters into per-name totals, per-day series
 * and per-country breakdowns, plus the newest samples.
 *
 * The listing starts at the first day in the window, so the cost is bounded by
 * the window rather than by how long the deployment has been running. Counters
 * that fell out of retention are dropped on the way.
 *
 * @param days How many days back to report on.
 * @param name Restrict the report to a single event name.
 * @param search Keep only names containing this fragment.
 * @param offsetMinutes The caller's `getTimezoneOffset()`, so days are theirs.
 */
export const getBeaconReport = async (
    days = BEACON_REPORT_DAYS,
    name?: string,
    search?: string,
    offsetMinutes = 0
): Promise<BeaconReport> => {
    if (!areBeaconsAvailable()) {
        return { available: false, days: [], totals: [], samples: [] };
    }

    const { state } = apiker.requestParams;
    const wanted = normalizeBeaconName(name || "");
    const fragment = normalizeBeaconName(search || "");
    const matches = (eventName: string) =>
        (!wanted || eventName === wanted) && (!fragment || eventName.includes(fragment));
    const window = Math.max(1, days);
    const offset = Number.isFinite(offsetMinutes) ? offsetMinutes : 0;

    /**
     * The window is the caller's days, so the read starts at the UTC date their
     * first midnight falls in: a whole date rather than an hour, because a bucket
     * with no hour (`b:<day>:…`) sorts before any hour of that same date. Hours
     * that turn out to be someone else's day are dropped below.
     */
    const localNow = Date.now() - offset * 60000;
    const localMidnight = new Date(localNow).setUTCHours(0, 0, 0, 0);
    const windowStart = localMidnight - (window - 1) * DAY;
    const from = getBeaconDay(windowStart + offset * 60000 - HOUR);
    const earliest = new Date(windowStart).toISOString().slice(0, 10);
    const cutoff = getBeaconDay(Date.now() - BEACON_RETENTION_DAYS * DAY);

    const shards = Array.from({ length: BEACON_SHARD_COUNT }, (_, shard) => shard);

    const readings = await Promise.all(
        shards.map(async (shard) => {
            const instance = state(OBN.BEACONS, beaconShardInstance(shard));

            try {
                /**
                 * Sample keys sort after every counter key, so a single listing
                 * from the start of the window returns both.
                 */
                return (await instance.list({ start: `${BEACON_COUNTER_PREFIX}:${from}` })) || {};
            } catch (e) {
                return {};
            }
        })
    );

    const totals: Record<string, BeaconTotal> = {};
    const dayNames: Record<string, true> = {};
    let samples: BeaconSample[] = [];

    readings.forEach((entries) => {
        Object.keys(entries).forEach((key) => {
            if (key.startsWith(BEACON_SAMPLE_PREFIX)) {
                const sample = entries[key] as BeaconSample;

                if (sample?.name && matches(sample.name)) {
                    samples.push(sample);
                }

                return;
            }

            const parsed = parseBeaconKey(key);
            const count = Number(entries[key]) || 0;

            if (!parsed || !matches(parsed.name)) {
                return;
            }

            if (parsed.dimension === BEACON_COUNTRY_DIMENSION) {
                const total = totals[parsed.name] || (totals[parsed.name] = emptyTotal(parsed.name));
                total.countries[parsed.value] = (total.countries[parsed.value] || 0) + count;
                return;
            }

            const day = localDayOf(parsed.bucket, offset);

            /** An hour read for the offset's sake can still fall outside the window. */
            if (day < earliest) {
                return;
            }

            const total = totals[parsed.name] || (totals[parsed.name] = emptyTotal(parsed.name));

            dayNames[day] = true;
            total.count += count;
            total.daily[day] = (total.daily[day] || 0) + count;
        });
    });

    samples = samples.sort((a, b) => (b.time || 0) - (a.time || 0));

    await pruneBeacons(cutoff);

    return {
        available: true,
        days: Object.keys(dayNames).sort(),
        totals: Object.keys(totals)
            .map((key) => totals[key])
            .sort((a, b) => b.count - a.count)
            .slice(0, BEACON_REPORT_NAMES),
        samples
    };
};

/**
 * Deletes counters older than the given day. Bounded per call: anything left
 * over is picked up the next time a report is requested.
 *
 * @param cutoffDay Oldest day to keep, as `YYYY-MM-DD`.
 * @param limit Maximum number of counters to delete per shard.
 * @returns How many counters were deleted.
 */
export const pruneBeacons = async (cutoffDay: string, limit = 128): Promise<number> => {
    if (!areBeaconsAvailable()) {
        return 0;
    }

    const { state } = apiker.requestParams;

    const deleted = await Promise.all(
        Array.from({ length: BEACON_SHARD_COUNT }, async (_, shard) => {
            const instance = state(OBN.BEACONS, beaconShardInstance(shard));

            try {
                const stale =
                    (await instance.list({
                        prefix: `${BEACON_COUNTER_PREFIX}:`,
                        end: `${BEACON_COUNTER_PREFIX}:${cutoffDay}`,
                        limit
                    })) || {};

                const keys = Object.keys(stale);

                if (!keys.length) {
                    return 0;
                }

                await instance.delete(keys);
                return keys.length;
            } catch (e) {
                return 0;
            }
        })
    );

    return deleted.reduce((sum, count) => sum + count, 0);
};

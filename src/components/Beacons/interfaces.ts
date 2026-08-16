/** One recorded beacon, kept in the rotating sample buffer for drill-down. */
export interface BeaconSample {
    /** Event name, e.g. `page_view`. */
    name: string;
    /** When it happened. */
    time: number;
    /** Request path the event was recorded on. */
    pathname?: string;
    /** Country the request came from. */
    countryCode?: string;
    /** Signed-in user the event belongs to, when there is one. */
    userId?: string;
    /** Free-form details supplied by the caller. */
    props?: Record<string, any>;
}

/** Counts for a single event name over the reported window. */
export interface BeaconTotal {
    name: string;
    count: number;
    /** Counts per day, newest last. */
    daily: Record<string, number>;
    /** Counts per country. */
    countries: Record<string, number>;
}

/** Everything the panel needs to render the beacon report. */
export interface BeaconReport {
    /** Whether beacons are recorded by this deployment at all. */
    available: boolean;
    /** Days covered, oldest first. */
    days: string[];
    /** One entry per event name, busiest first. */
    totals: BeaconTotal[];
    /** Newest recorded events, for drill-down. */
    samples: BeaconSample[];
}

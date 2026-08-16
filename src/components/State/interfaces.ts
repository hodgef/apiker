/** Payload for a `put` operation: a map of property names to values. */
export interface PutRequestObject {
    [propertyName: string] : any
}

/** Options for a `list` operation, mirroring the Durable Object `storage.list` API. */
export interface ListRequestObject {
    /** Only return keys starting with this prefix. */
    prefix?: string;
    /** Start listing at this key (inclusive). */
    start?: string;
    /** Start listing after this key (exclusive). */
    startAfter?: string;
    /** Stop listing before this key (exclusive). */
    end?: string;
    /** Return entries in descending key order. */
    reverse?: boolean;
    /** Maximum number of entries to return. */
    limit?: number | null;
    /** Bypass any read cache for this listing. */
    noCache?: boolean;
}

/** Payload for an `increment` operation. */
export interface IncrementRequestObject {
    /** Property names to bump, mapped to the amount to add. */
    increments: { [propertyName: string]: number };
    /** Optional fixed-size sample buffer written in the same, atomic pass. */
    ring?: {
        /** Key prefix the slot number is appended to. */
        prefix: string;
        /** Number of slots; the buffer never grows past it. */
        size: number;
        /** Counter whose new total picks the slot. */
        from: string;
        /** Value to store in the chosen slot. */
        value: any;
    };
}

/**
 * Factory returning the storage methods for a Durable Object instance.
 *
 * @param objectName Durable Object class name; defaults to `"Common"`.
 * @param objectId Explicit instance id; derived from `objectStateMapping` when omitted.
 * @param isCloudflareObjectId Treat `objectId` as a raw Cloudflare object id.
 */
export type StateFn = (objectName?: string, objectId?: string, isCloudflareObjectId?: boolean) => StateMethods;

/** Async storage operations for a Durable Object instance. */
export interface StateMethods {
    /** Reads a single property. */
    get: (propertyName: string) => Promise<any>;
    /** Persists one or more properties. */
    put: (putRequestObject: PutRequestObject) => Promise<any>;
    /** Atomically adds to one or more counters, returning their new totals. */
    increment: (incrementRequestObject: IncrementRequestObject) => Promise<any>;
    /** Deletes one or more properties. */
    delete: (propertyName: string | string[]) => Promise<any>;
    /** Deletes every property. */
    deleteAll: () => Promise<any>;
    /** Lists stored entries. */
    list: (listRequestObject?: ListRequestObject) => Promise<any>;
}
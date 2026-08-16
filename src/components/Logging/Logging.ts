import { OBN } from "../ObjectBase";
import { apiker } from "../Apiker";
import { getClientId, getCurrentUserId, getSignedIp } from "../Auth";
import { ListRequestObject } from "../State";
import { LOG_INDEX_PREFIX, LOG_INDEX_SCAN, LOG_INDEX_SHARDS, LOG_PRUNE_CHANCE, LOG_PRUNE_LIMIT, LOG_RETENTION_DAYS, LOG_SWEEP_SCAN } from "./constants";
import { LogObject } from "./interfaces";

/** Keeps one caller's entries together, which is what makes them deletable again. */
export const logIndexInstance = (entity = "") => {
    let hash = 0;

    for (let i = 0; i < entity.length; i++) {
        hash = (hash * 31 + entity.charCodeAt(i)) % 100003;
    }

    return `${LOG_INDEX_PREFIX}${hash % LOG_INDEX_SHARDS}`;
};

/** Time first, so a listing is newest-first across every prefix rather than per prefix. */
export const logIndexKey = ({ time, propertyName }: LogObject) =>
    `${String(time || 0).padStart(16, "0")}:${propertyName}`;

/**
 * Reads the mirrored entries, newest first.
 *
 * @param limit Entries to read per shard.
 * @returns The entries and whether a shard hit the limit, so callers can say so.
 */
export const getIndexedLogEntries = async (limit = LOG_INDEX_SCAN) => {    const { state } = apiker.requestParams;

    const readings = await Promise.all(
        Array.from({ length: LOG_INDEX_SHARDS }, async (_, shard) => {
            try {
                const entries = await state(OBN.LOGS, `${LOG_INDEX_PREFIX}${shard}`).list({
                    reverse: true,
                    limit
                } as ListRequestObject);

                return Object.values(entries || {}) as LogObject[];
            } catch (e) {
                return [] as LogObject[];
            }
        })
    );

    return {
        entries: ([] as LogObject[])
            .concat(...readings)
            .sort((a, b) => (b.time || 0) - (a.time || 0)),
        truncated: readings.some((shard) => shard.length >= limit)
    };
};

export const addUniqueLogEntry = async (prefix: string, additionalParams = {}, objectName = OBN.LOGS, signedIp: string | undefined = undefined, clientId: string | undefined = undefined) => {
    const entries = await getUserLogEntries(prefix, 1, objectName, signedIp);
    if(entries?.length){
        return;
    }
    await addLogEntry(prefix, additionalParams, objectName, signedIp, clientId);
};

const DAY = 86400000;

/**
 * Deletes entries of one series (a prefix written by one caller) that fell out
 * of retention.
 *
 * Keys end in the timestamp and sort chronologically within a series, so the
 * expired ones are exactly the range below the cutoff: no scanning, and nothing
 * newer is ever read. Objects with no retention configured are left alone.
 *
 * @returns How many entries were deleted.
 */
export const pruneLogSeries = async (prefix: string, objectName = OBN.LOGS, signedIp?: string, objectId?: string) => {
    const days = LOG_RETENTION_DAYS[objectName];

    if(!days){
        return 0;
    }

    const { state } = apiker.requestParams;
    const series = getUserLogPropertyName(prefix, signedIp) + ":";
    const instance = state(objectName, objectId);

    try {
        const stale = await instance.list({
            prefix: series,
            end: series + (Date.now() - days * DAY),
            limit: LOG_PRUNE_LIMIT
        } as ListRequestObject);

        const keys = Object.keys(stale || {});

        if(!keys.length){
            return 0;
        }

        await instance.delete(keys);
        return keys.length;
    } catch (e) {
        return 0;
    }
};

/** Same, for a mirror shard: its keys start with the timestamp. */
export const pruneLogIndexShard = async (instance: string) => {
    const days = LOG_RETENTION_DAYS[OBN.LOGS];

    if(!days){
        return 0;
    }

    const { state } = apiker.requestParams;
    const shard = state(OBN.LOGS, instance);

    try {
        const stale = await shard.list({
            end: String(Date.now() - days * DAY).padStart(16, "0"),
            limit: LOG_PRUNE_LIMIT
        } as ListRequestObject);

        const keys = Object.keys(stale || {});

        if(!keys.length){
            return 0;
        }

        await shard.delete(keys);
        return keys.length;
    } catch (e) {
        return 0;
    }
};

/** Sweeping on a fraction of writes keeps storage bounded without a scheduled job. */
export const shouldPruneLogs = () => Math.random() * LOG_PRUNE_CHANCE < 1;

/** Mirror keys start with a padded timestamp; a log's own key starts with its prefix. */
const isIndexKey = (key: string) => /^\d{16}:/.test(key);

/**
 * Prunes and indexes one `Logs` instance, addressed by its Cloudflare id.
 *
 * Retention on write only reaches instances someone still writes to, and the
 * mirror only holds what was written since it existed. This reaches the rest:
 * expired entries are deleted, and what remains is mirrored so the panel can see
 * history that predates the index.
 *
 * @param instanceId Cloudflare object id of the instance.
 * @returns How many entries were `deleted` and `indexed`.
 */
export const sweepLogInstance = async (instanceId: string) => {
    const days = LOG_RETENTION_DAYS[OBN.LOGS];
    const { state } = apiker.requestParams;
    const cutoff = Date.now() - (days || 0) * DAY;

    try {
        const instance = state(OBN.LOGS, instanceId, true);
        const stored = (await instance.list({ limit: LOG_SWEEP_SCAN } as ListRequestObject)) || {};
        const keys = Object.keys(stored);

        const expired = days ? keys.filter((key) => ((stored[key]?.time || 0) < cutoff)) : [];
        const live = keys.filter((key) => !expired.includes(key) && !isIndexKey(key));

        for(let i = 0; i < expired.length; i += LOG_PRUNE_LIMIT){
            await instance.delete(expired.slice(i, i + LOG_PRUNE_LIMIT));
        }

        await Promise.all(
            live.map((key) => {
                const entry = stored[key] as LogObject;
                return state(OBN.LOGS, logIndexInstance(entry.id)).put({ [logIndexKey(entry)]: entry });
            })
        );

        return { deleted: expired.length, indexed: live.length };
    } catch (e) {
        return { deleted: 0, indexed: 0 };
    }
};

export const addLogEntry = async (prefix: string, additionalParams = {} as any, objectName = OBN.LOGS, signedIp: string | undefined = undefined, clientId: string | undefined = undefined) => {
    if(apiker.objects.includes(objectName)){
        const { state } = apiker.requestParams;
        const { objectId = null, isCloudflareObjectId = null } = additionalParams;
        const propertyName = getUserLogPropertyName(prefix, signedIp) + ":" + Date.now();
        const logParams = getLogParams(propertyName, signedIp, clientId, additionalParams);
        await state(objectName, objectId, isCloudflareObjectId).put({ [propertyName]: logParams });

        /**
         * Bookkeeping only, and the mirror's instance can live in another region,
         * so it is handed to the runtime instead of being waited on: logging must
         * not add a round trip to the caller's response.
         */
        const background: Promise<any>[] = [];

        if(objectName === OBN.LOGS){
            background.push(state(objectName, logIndexInstance(logParams.id)).put({ [logIndexKey(logParams)]: logParams }));
        }

        if(shouldPruneLogs()){
            background.push(pruneLogSeries(prefix, objectName, signedIp, objectId));

            if(objectName === OBN.LOGS){
                background.push(pruneLogIndexShard(logIndexInstance(logParams.id)));
            }
        }

        if(!background.length){
            return;
        }

        if(typeof apiker.ctx?.waitUntil === "function"){
            apiker.ctx.waitUntil(Promise.all(background));
        } else {
            await Promise.all(background);
        }
    }
};

export const getLogParams = (propertyName: string, signedIp: string | undefined = getSignedIp(), clientId: string | undefined = getClientId(), additionalParams = {}): LogObject => {
    const { headers, request } = apiker.requestParams;
    const countryCode = headers.get("CF-IPCountry") as string;
    const url = new URL(request.url);
    const pathname = url.pathname;

    /**
     * Read straight from the token: it tells us who acted without costing a
     * storage read on every logged request. Anonymous requests stay anonymous.
     */
    const userId = getCurrentUserId();

    return {
        propertyName,
        time: Date.now(),
        id: signedIp,
        clientId,
        countryCode,
        pathname,
        ...(userId ? { userId } : {}),
        ...additionalParams
    };
};

export const getUserLogPropertyName = (prefix: string, signedIp: string | null = getSignedIp()) => {
    const propertyName = `${prefix}:${signedIp}`;
    return propertyName;
};

export const getUserLogEntries = async (prefix: string, limit = 10, objectName = OBN.LOGS, signedIp: string | undefined = undefined, objectId?: string) => {
    const propertyName = getUserLogPropertyName(prefix, signedIp);
    return getLogEntries(propertyName, limit, objectName, objectId);
};

export const getLogEntries = async (prefix: string, limit: number | null = 10, objectName = OBN.LOGS, objectId?: string, isCloudflareObjectId?: boolean) => {
    const { state } = apiker.requestParams;
    const payload = {
        prefix,
        reverse: true,
        noCache: objectName !== OBN.LOGS,
    } as ListRequestObject;

    if(limit){
        payload.limit = limit; 
    }
    const entries = await state(objectName, objectId, isCloudflareObjectId).list(payload);
    return Object.values(entries) as LogObject[];
};

export const getAllLogEntries = async (objectName = OBN.LOGS, limit: number | null = null, objectId?: string, isCloudflareObjectId?: boolean) => {
    const { state } = apiker.requestParams;
    const payload = {
        reverse: true,
        noCache: objectName !== OBN.LOGS
    } as ListRequestObject;

    if(limit){
        payload.limit = limit; 
    }
    const entries = await state(objectName, objectId, isCloudflareObjectId).list(payload);
    return Object.values(entries) as LogObject[];
};

export const deleteAllLogsInObject = async (objectName: string, signedIp: string) => {
    const { state } = apiker.requestParams;
    return await state(objectName, signedIp).deleteAll();
};

export const deleteUserLogEntries = async (prefix: string, objectName = OBN.LOGS, signedIp: string | undefined = undefined) => {
    const userPrefix = getUserLogPropertyName(prefix, signedIp);
    return await deleteLogEntries(userPrefix, objectName);
};

export const deleteLogEntries = async (prefix: string, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const entries = await getLogEntries(prefix, null, objectName);
    const promises = entries.map(({ propertyName }: LogObject) => state(objectName).delete(propertyName));

    if(objectName === OBN.LOGS){
        entries.forEach((entry: LogObject) => {
            promises.push(state(objectName, logIndexInstance(entry.id)).delete(logIndexKey(entry)));
        });
    }

    return Promise.all(promises);
};
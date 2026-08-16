import { apiker } from '../../Apiker';
import { getInstanceList } from '../../Cloudflare';
import { getIndexedLogEntries, LOG_INDEX_SCAN, LOG_RETENTION_DAYS, LogObject, sweepLogInstance } from '../../Logging';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res } from '../../Response';

const ENTRY_LIMIT = 100;

const REQUIRED_ENV = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_EMAIL", "CLOUDFLARE_API_KEY"];

/** One instance per caller, and a Worker holds few outgoing connections open. */
const SWEEP_CHUNK = 25;

/** When the last full sweep is recorded, so the panel can stop offering one. */
const SWEPT_AT = "logsSweptAt";

const DAY = 86400000;

/** Log keys are `prefix:entity:timestamp`, and the prefix is the log's id. */
const logIdOf = (entry: LogObject) => String(entry.propertyName || "").split(":")[0];

/**
 * Lists log entries, or the available log ids when none is given, so the panel can
 * offer what exists instead of asking an admin to guess a prefix.
 *
 * Entries come from the log index rather than from a log object directly: `Logs`
 * maps to the caller, so a direct read would only ever show the entries the
 * admin's own requests produced.
 *
 * `truncated` reports that a shard hit its read limit, which means the response
 * covers recent activity rather than all of history.
 *
 * @param logId Prefix to filter by. Omit to receive every log id plus recent entries.
 * @param identity Request identity or user id to filter by, for following one caller.
 * @returns `entries`, `truncated`, and (unfiltered) `logIds` with counts and `scanned`.
 */
export const searchLogsEndpoint: Handler = async (params) => {
  const { request, state } = params;
  const url = new URL(request.url);
  const search = new URLSearchParams(url.search);
  const logId = search.get("logId") || "";
  const identity = (search.get("identity") || "").trim();
  const { entries: indexEntries, truncated } = await getIndexedLogEntries();

  const all = identity
    ? indexEntries.filter((entry) => entry.id === identity || entry.userId === identity)
    : indexEntries;

  if(logId || identity){
    const entries = logId ? all.filter((entry) => logIdOf(entry) === logId) : all;
    return res({ entries: entries.slice(0, ENTRY_LIMIT), truncated, limit: ENTRY_LIMIT });
  }

  const summaries: Record<string, { id: string; count: number; lastSeen: number }> = {};

  all.forEach((entry) => {
    const id = logIdOf(entry);

    if(!id){
      return;
    }

    if(!summaries[id]){
      summaries[id] = { id, count: 0, lastSeen: 0 };
    }

    summaries[id].count++;
    summaries[id].lastSeen = Math.max(summaries[id].lastSeen, entry.time || 0);
  });

  /**
   * Sweeping is a namespace walk, so it is only worth offering when it would
   * find something: history predating the index, or storage stranded in objects
   * nobody writes to any more, which takes a retention period to build up again.
   */
  const sweptAt = (await state(OBN.COMMON).get(SWEPT_AT)) || 0;
  const retention = LOG_RETENTION_DAYS[OBN.LOGS] || 0;

  return res({
    logIds: Object.values(summaries).sort((a, b) => b.lastSeen - a.lastSeen),
    entries: all.slice(0, ENTRY_LIMIT),
    truncated,
    scanned: all.length,
    limit: LOG_INDEX_SCAN,
    sweptAt: sweptAt || null,
    sweepNeeded: !REQUIRED_ENV.some((key) => !apiker.env?.[key])
      && (!sweptAt || Date.now() - sweptAt > retention * DAY)
  });
}

/**
 * Sweeps the log objects themselves: drops what fell out of retention and mirrors
 * what remains into the index.
 *
 * Retention on write only reaches instances that are still being written to, and
 * the index only holds what was written since it existed — a visitor who never
 * comes back is invisible to both. Runs in chunks, resuming from the last
 * instance id rather than a position: sweeping empties instances, which drops
 * them from the listing and would shift every position after them. Enumerating
 * the instances needs `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL` and
 * `CLOUDFLARE_API_KEY`.
 *
 * @param after Instance id the previous call stopped at.
 * @returns How many entries were `deleted` and `indexed`, plus the `nextCursor`.
 */
export const sweepLogsEndpoint: Handler = async ({ request, state }) => {
  const missing = REQUIRED_ENV.filter((key) => !apiker.env?.[key]);

  if(missing.length){
    return res({ available: false, missing, deleted: 0, indexed: 0 });
  }

  const after = new URL(request.url).searchParams.get("after") || "";
  let instances: { id: string; hasStoredData?: boolean }[] = [];

  try {
    const response = await getInstanceList(apiker.env.CLOUDFLARE_SCRIPT_NAME || apiker.name, OBN.LOGS) as any;
    instances = response?.result || [];
  } catch (e: any) {
    return res({ available: false, error: e?.message || "Could not reach the Cloudflare API", deleted: 0, indexed: 0 });
  }

  const remaining = instances
    .filter(({ hasStoredData }) => hasStoredData !== false)
    .map(({ id }) => id)
    .sort()
    .filter((id) => id > after);

  const chunk = remaining.slice(0, SWEEP_CHUNK);
  const swept = await Promise.all(chunk.map((id) => sweepLogInstance(id)));
  const nextCursor = remaining.length > chunk.length ? chunk[chunk.length - 1] : null;

  if(nextCursor === null){
    await state(OBN.COMMON).put({ [SWEPT_AT]: Date.now() });
  }

  return res({
    available: true,
    deleted: swept.reduce((sum, { deleted }) => sum + deleted, 0),
    indexed: swept.reduce((sum, { indexed }) => sum + indexed, 0),
    remaining: remaining.length,
    read: chunk.length,
    nextCursor
  });
}
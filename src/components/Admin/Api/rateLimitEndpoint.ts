import { getAllLogEntries, LogObject } from '../../Logging';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res } from '../../Response';

const ENTRY_LIMIT = 200;

/** Log keys are `prefix:entity:timestamp`, and the prefix is what the entry counted toward. */
const eventType = (entry: LogObject) => String(entry.propertyName || "").split(":")[0] || "request";

/**
 * Lists every rate-limit counter entry recorded for one identity.
 *
 * `RateLimit` instances are namespaced per identity already (see
 * `objectStateMapping`), so this reads that identity's own instance directly —
 * unlike logs, there is no shared index to query. Building one would mean an
 * extra write on the rate limiter's own (very hot) request path for a feature
 * only ever read from the admin panel, so it stays a targeted, on-demand read.
 *
 * @param identity Request identity (signed IP) whose counters to read.
 * @returns `entries`, newest first.
 */
export const rateLimitEndpoint: Handler = async ({ request }) => {
  const identity = (new URL(request.url).searchParams.get("identity") || "").trim();

  if(!identity){
    return res({ entries: [] });
  }

  const entries = await getAllLogEntries(OBN.RATELIMIT, ENTRY_LIMIT, identity);

  return res({
    entries: entries
      .map((entry) => ({ ...entry, type: eventType(entry) }))
      .sort((a, b) => (b.time || 0) - (a.time || 0))
  });
};

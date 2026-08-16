import { apiker } from '../../Apiker';
import { getBannedEntities } from '../../Bans';
import { getAllLogEntries, getIndexedLogEntries, LogObject } from '../../Logging';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res } from '../../Response';

const DAY = 86400000;
const HOUR = 3600000;

const byNewest = (entries: LogObject[]) =>
  [...entries].sort((a, b) => (b.time || 0) - (a.time || 0));

/** Log keys are `prefix:entity:timestamp`, and the prefix is what the event means. */
const eventType = (entry: LogObject) => String(entry.propertyName || "").split(":")[0] || "event";

const readLog = async (objectName: string, limit: number): Promise<LogObject[]> => {
  if (!apiker.objects?.includes(objectName)) {
    return [];
  }

  try {
    return byNewest(await getAllLogEntries(objectName, limit));
  } catch (e) {
    return [];
  }
};

const since = (entries: LogObject[], window: number) =>
  entries.filter(({ time }) => time && Date.now() - time < window).length;

/**
 * Everything the panel's dashboard shows, in a single round trip: what the
 * deployment is running, what it has been doing, and where it is unprotected.
 *
 * Environment variables are reported as booleans only, never as their values.
 *
 * @returns `deployment` (configuration and protections), `totals` (counts per time
 * window), and the latest `events`, `bans` and `rateLimit` entries.
 */
export const overviewEndpoint: Handler = async ({ state }) => {
  const adminIds = (await state(OBN.COMMON).get("adminIds")) || [];
  /** Logs map to the caller, so only the index sees what everyone else did. */
  const events = apiker.objects?.includes(OBN.LOGS)
    ? byNewest((await getIndexedLogEntries()).entries)
    : [];
  const rateLimit = await readLog(OBN.RATELIMIT, 100);

  let bans: LogObject[] = [];

  if (apiker.objects?.includes(OBN.BANS)) {
    try {
      bans = byNewest(await getBannedEntities(50));
    } catch (e) {
      bans = [];
    }
  }

  const withType = (entries: LogObject[]) =>
    entries.map((entry) => ({ ...entry, type: eventType(entry) }));

  return res({
    deployment: {
      name: apiker.name,
      objectVersion: apiker.objectVersion,
      debug: !!apiker.debug,
      authRoutes: !!apiker.authRoutes,
      email: !!apiker.email,
      firewall: apiker.firewall
        ? typeof apiker.firewall === "object"
          ? apiker.firewall
          : {}
        : null,
      objects: apiker.objects || [],
      routes: Object.keys(apiker.routes || {}),
      adminCount: adminIds.length,
      /** Booleans only: the values are secrets. */
      protections: {
        setupSecret: !!apiker.env?.ADMP_SETUP_SECRET,
        ipWhitelist: !!apiker.env?.ADMP_IP_WHITELIST,
        ispWhitelist: !!apiker.env?.ADMP_ISP_WHITELIST,
        cityWhitelist: !!apiker.env?.ADMP_CITY_WHITELIST,
        cloudflareWaf: !!apiker.env?.CLOUDFLARE_WAF_KEY
      }
    },
    totals: {
      events: events.length,
      eventsToday: since(events, DAY),
      bans: bans.length,
      bansToday: since(bans, DAY),
      /** Requests counted toward a limit, not requests that were refused. */
      countedLastHour: since(rateLimit, HOUR),
      admins: adminIds.length
    },
    events: withType(events.slice(0, 25)),
    bans: withType(bans.slice(0, 10)),
    rateLimit: withType(rateLimit.slice(0, 10))
  });
};

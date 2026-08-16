import { BEACON_REPORT_DAYS, getBeaconReport } from '../../Beacons';
import { Handler } from '../../Request';
import { res } from '../../Response';

const MAX_DAYS = 90;

/** Offsets run from -14h to +12h; anything else is not a timezone. */
const MAX_OFFSET = 840;

/**
 * The beacon report behind the panel's Beacons screen.
 *
 * @param days Size of the window to report on, defaulting to a week.
 * @param name Restrict the report to a single event name.
 * @param q Keep only event names containing this fragment.
 * @param offset The caller's `getTimezoneOffset()`, so the days are theirs.
 * @returns `available`, the `days` covered, per-name `totals` and recent `samples`.
 */
export const beaconsEndpoint: Handler = async ({ request }) => {
  const search = new URLSearchParams(new URL(request.url).search);
  const requested = parseInt(search.get("days") || "", 10);
  const days = Number.isNaN(requested) ? BEACON_REPORT_DAYS : Math.min(Math.max(requested, 1), MAX_DAYS);
  const requestedOffset = parseInt(search.get("offset") || "", 10);
  const offset = Number.isNaN(requestedOffset) ? 0 : Math.min(Math.max(requestedOffset, -MAX_OFFSET), MAX_OFFSET);

  return res(await getBeaconReport(
    days,
    search.get("name") || undefined,
    search.get("q") || undefined,
    offset
  ));
};

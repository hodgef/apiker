import { apiker } from "../Apiker";
import { TIMINGS } from "./constants";

/**
 * Records the current epoch time under a named key on `apiker.timings`.
 *
 * @param timingName Key to store the timestamp under.
 * @returns The recorded timestamp in milliseconds.
 */
export const measureTiming = (timingName: string): number => {
    const time = Date.now();
    apiker.timings[timingName] = time;
    return time;
}

/**
 * Returns the elapsed time since the request started.
 *
 * @returns Milliseconds since the `REQUEST_START` timing was recorded.
 */
export const elapsedSinceRequestStart = (): number => {
    return Date.now() - apiker.timings[TIMINGS.REQUEST_START];
}
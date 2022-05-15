import { apiker } from "../Apiker";
import { TIMINGS } from "./constants";

export const measureTiming = (timingName: string): number => {
    const time = Date.now();
    apiker.timings[timingName] = time;
    return time;
}

export const elapsedSinceRequestStart = (): number => {
    return Date.now() - apiker.timings[TIMINGS.REQUEST_START];
}
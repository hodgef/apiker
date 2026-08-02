import { apiker } from "../Apiker";
import { GEOLOCATION_ENDPOINT } from "./constants";

/**
 * Looks up geolocation data for the current request's client IP.
 *
 * @returns A promise resolving to the geolocation payload (or `{}` when the IP is unknown).
 */
export const getCurrentUserGeodata = () => {
    const { headers } = apiker.requestParams;
    const ip = headers.get("CF-Connecting-IP") as string;
    return getUserGeodata(ip);
};

/**
 * Looks up geolocation data for a given IP address.
 *
 * @param ip IP address to resolve.
 * @returns A promise resolving to the geolocation payload (or `{}` when `ip` is falsy).
 */
export const getUserGeodata = (ip: string): Promise<any> => {
    if(!ip) return Promise.resolve({});
    return fetch(GEOLOCATION_ENDPOINT + ip).then(res => res.json());
};
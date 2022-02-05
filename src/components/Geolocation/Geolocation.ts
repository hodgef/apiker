import { apiker } from "../Apiker";
import { GEOLOCATION_ENDPOINT } from "./constants";

export const getCurrentUserGeodata = () => {
    const { headers } = apiker.requestParams;
    const ip = headers.get("CF-Connecting-IP") as string;
    return getUserGeodata(ip);
};

export const getUserGeodata = (ip: string): Promise<any> => {
    if(!ip) return Promise.resolve({});
    return fetch(GEOLOCATION_ENDPOINT + ip).then(res => res.json());
};
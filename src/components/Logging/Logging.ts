import { OBN } from "..";
import { apiker } from "../Apiker";
import { getClientId, getSignedIp } from "../Auth";
import { LogObject } from "./interfaces";

export const addLogEntry = async (prefix: string, additionalParams = {}, objectName = OBN.LOGS) => {
    if(apiker.objects.includes(objectName)){
        const { state } = apiker.requestParams;
        const propertyName = getUserLogPropertyName(prefix) + Date.now();
        await state(objectName).put({ [propertyName]: getLogParams(propertyName, additionalParams) });
    }
};

export const getLogParams = (propertyName: string, additionalParams = {}): LogObject => {
    const { headers, request } = apiker.requestParams;
    const countryCode = headers.get("CF-IPCountry") as string;
    const url = new URL(request.url);
    const pathname = url.pathname;
    return {
        propertyName,
        time: Date.now(),
        id: getSignedIp(),
        clientId: getClientId(),
        countryCode,
        pathname,
        ...additionalParams
    }
}

export const getUserLogPropertyName = (prefix: string) => {
    const signedIp = getSignedIp();
    const propertyName = `${prefix}:${signedIp}`;
    return propertyName;
};

export const getUserLogEntries = async (prefix: string, limit = 10, objectName = OBN.LOGS) => {
    return getLogEntries(getUserLogPropertyName(prefix), limit, objectName);
}

export const getLogEntries = async (prefix: string, limit = 10, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const entries = await state(objectName).list({
        prefix,
        reverse: true,
        noCache: true,
        limit
    });
    return Object.values(entries) as LogObject[];
}

export const getAllLogEntries = async (limit = 10, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const entries = await state(objectName).list({
        reverse: true,
        noCache: true,
        limit
    });
    return Object.values(entries) as LogObject[];
}
import { OBN } from "../ObjectBase";
import { apiker } from "../Apiker";
import { getClientId, getSignedIp } from "../Auth";
import { ListRequestObject } from "../State";
import { LogObject } from "./interfaces";

export const addUniqueLogEntry = async (prefix: string, additionalParams = {}, objectName = OBN.LOGS, signedIp: string | undefined = undefined, clientId: string | undefined = undefined) => {
    const entries = await getUserLogEntries(prefix, 1, objectName, signedIp);
    if(entries?.length){
        return;
    }
    await addLogEntry(prefix, additionalParams, objectName, signedIp, clientId);
}

export const addLogEntry = async (prefix: string, additionalParams = {}, objectName = OBN.LOGS, signedIp: string | undefined = undefined, clientId: string | undefined = undefined) => {
    if(apiker.objects.includes(objectName)){
        const { state } = apiker.requestParams;
        const propertyName = getUserLogPropertyName(prefix, signedIp) + Date.now();
        await state(objectName).put({ [propertyName]: getLogParams(propertyName, signedIp, clientId, additionalParams) });
    }
};

export const getLogParams = (propertyName: string, signedIp: string | undefined = getSignedIp(), clientId: string | undefined = getClientId(), additionalParams = {}): LogObject => {
    const { headers, request } = apiker.requestParams;
    const countryCode = headers.get("CF-IPCountry") as string;
    const url = new URL(request.url);
    const pathname = url.pathname;
    return {
        propertyName,
        time: Date.now(),
        id: signedIp,
        clientId,
        countryCode,
        pathname,
        ...additionalParams
    }
}

export const getUserLogPropertyName = (prefix: string, signedIp: string | null = getSignedIp()) => {
    const propertyName = `${prefix}:${signedIp}`;
    return propertyName;
};

export const getUserLogEntries = async (prefix: string, limit = 10, objectName = OBN.LOGS, signedIp: string | undefined = undefined) => {
    const propertyName = getUserLogPropertyName(prefix, signedIp);
    return getLogEntries(propertyName, limit, objectName);
}

export const getLogEntries = async (prefix: string, limit: number | null = 10, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const payload = {
        prefix,
        reverse: true,
        noCache: objectName !== OBN.LOGS,
    } as ListRequestObject;

    if(limit){
        payload.limit = limit; 
    }
    const entries = await state(objectName).list(payload);
    return Object.values(entries) as LogObject[];
}

export const deleteUserLogEntries = async (prefix: string, objectName = OBN.LOGS, signedIp: string | undefined = undefined) => {
    const userPrefix = getUserLogPropertyName(prefix, signedIp);
    await deleteLogEntries(userPrefix, objectName);
}

export const deleteLogEntries = async (prefix: string, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const entries = await getLogEntries(prefix, null, objectName);
    const promises = entries.map(({ propertyName }: LogObject) => state(objectName).delete(propertyName));
    return Promise.all(promises);
}

export const getAllLogEntries = async (limit = 10, objectName = OBN.LOGS) => {
    const { state } = apiker.requestParams;
    const entries = await state(objectName).list({
        reverse: true,
        noCache: objectName !== OBN.LOGS,
        limit
    });
    return Object.values(entries) as LogObject[];
}
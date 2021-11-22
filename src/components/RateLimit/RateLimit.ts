import { apiker } from "../Apiker";
import {  sign } from "../Auth";
import { OBN } from "../ObjectBase";
import { Handler, RequestParams } from "../Request";
import { StateFn } from "../State";
import { REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";
import { res_429 } from "../Response";

export const rateLimitRequest = async (prefix: string, handler: Handler, params: RequestParams, limit = REQUEST_LIMIT_AMOUNT_PER_HOUR): Promise<Response> => {
    if(apiker.objects.includes(OBN.RATELIMIT)){
        const { state } = params;
        const rateLimitReached = await isRateLimitReached(prefix, state, limit);

        if(rateLimitReached){
            return res_429();
        } else {
            await addToRateLimit(prefix, state);
        }
    }

    return handler(params);
};

export const isRateLimitReached = async (prefix: string, state: StateFn, limit: number) => {
    const propertyName = getRateLimitPropertyName(prefix);
    const latestRequests = await state(OBN.RATELIMIT).list({
        prefix: propertyName,
        reverse: true,
        limit
    });

    const hourInMs = 3600000;
    const requestValues = Object.values(latestRequests) as number[];
    const earliestValue = requestValues[limit - 1];
    return earliestValue && Date.now() - earliestValue < hourInMs;
};

export const addToRateLimit = async (prefix: string, state: StateFn) => {
    const propertyName = getRateLimitPropertyName(prefix) + Date.now();
    await state(OBN.RATELIMIT).put({ [propertyName]: Date.now() });
};

export const getRateLimitPropertyName = (prefix: string) => {
    const ip = apiker.headers.get("CF-Connecting-IP");
    const signedIp = sign(ip);
    const propertyName = `${prefix}:${signedIp}`;
    return propertyName;
};
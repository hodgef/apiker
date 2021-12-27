import { apiker } from "../Apiker";
import {  sign } from "../Auth";
import { OBN } from "../ObjectBase";
import { Handler, RequestParams } from "../Request";
import { StateFn } from "../State";
import { res_429 } from "../Response";
import { REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";

export const rateLimitRequest = async (prefix: string, handler: Handler, params: RequestParams, limit = REQUEST_LIMIT_AMOUNT_PER_HOUR, timeLapse = 3600000, onLimitReached = res_429 as any): Promise<Response> => {
    if(apiker.objects.includes(OBN.RATELIMIT)){
        const { state } = params;
        const { rateLimitReached, requestCount } = await isRateLimitReached(prefix, state, limit, timeLapse);
        const rateLimitRemaining = limit - requestCount;

        if(rateLimitReached){
            return onLimitReached();
        } else {
            await addToRateLimit(prefix, state);
        }

        apiker.responseHeaders.append("X-RateLimit-Limit", limit.toString());
        apiker.responseHeaders.append("X-RateLimit-Remaining", rateLimitRemaining.toString());
    }

    return handler(params);
};

export const isRateLimitReached = async (prefix: string, state: StateFn, limit: number, timeLapse: number) => {
    const propertyName = getRateLimitPropertyName(prefix);
    const latestRequests = await state(OBN.RATELIMIT).list({
        prefix: propertyName,
        reverse: true,
        noCache: true,
        limit
    });

    const requestValues = Object.values(latestRequests) as number[];
    const requestCount = requestValues.filter(value => {
        return (value && Date.now() - value < timeLapse)
    }).length;

    const earliestValue = requestValues[limit - 1];
    return {
        rateLimitReached: earliestValue && Date.now() - earliestValue < timeLapse,
        requestCount
    };
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
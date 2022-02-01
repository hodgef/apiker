import { apiker } from "../Apiker";
import { OBN } from "../ObjectBase";
import { Handler, RequestParams } from "../Request";
import { res_429 } from "../Response";
import { REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";
import { addLogEntry, getUserLogEntries } from "../Logging";

const hourInMs = 3600000;

export const rateLimitRequest = async (prefix: string, handler: Handler, params: RequestParams, limit = REQUEST_LIMIT_AMOUNT_PER_HOUR, timeLapse = hourInMs, onLimitReached = res_429 as any): Promise<Response> => {
    if(apiker.objects.includes(OBN.RATELIMIT)){
        const { state } = params;
        const { rateLimitReached, requestCount } = await isRateLimitReached(prefix, limit, timeLapse);
        const rateLimitRemaining = limit - requestCount;

        apiker.responseHeaders.append("X-RateLimit-Limit", limit.toString());
        apiker.responseHeaders.append("X-RateLimit-Remaining", rateLimitRemaining.toString());

        if(rateLimitReached){
            return onLimitReached();
        } else {
            await addLogEntry(prefix, {}, OBN.RATELIMIT);
        }

        /**
         * Handle RateLimit purging
         */
        const lastRateLimitPurge = await state().get("lastRateLimitPurge");

        if(!lastRateLimitPurge){
            state().put({ lastRateLimitPurge: Date.now() });
        } else {
            if(Date.now() - lastRateLimitPurge >= hourInMs){
                state(OBN.RATELIMIT).deleteAll();
                state().put({ lastRateLimitPurge: Date.now() });
            }
        }
    }

    return handler(params);
};

export const isRateLimitReached = async (prefix: string, limit: number, timeLapse: number) => {
    const requestValues = await getUserLogEntries(prefix, limit, OBN.RATELIMIT);
    const requestTimes = requestValues.map(requestValue => (Number.isInteger(requestValue)) ? requestValue as unknown as number : requestValue.time );
    const requestCount = requestTimes.filter(value => {
        return (value && Date.now() - value < timeLapse);
    }).length;

    const earliestValue = requestTimes[limit - 1];
    return {
        rateLimitReached: earliestValue && Date.now() - earliestValue < timeLapse,
        requestCount
    };
};
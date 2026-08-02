import { apiker } from "../Apiker";
import { OBN } from "../ObjectBase";
import { Handler, RequestParams } from "../Request";
import { res_429 } from "../Response";
import { REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";
import { addLogEntry, getUserLogEntries } from "../Logging";

const hourInMs = 3600000;

/**
 * Rate-limits a request by counting recent entries under a prefix in the
 * `RateLimit` Durable Object, then either invokes the handler or the
 * limit-reached response. Appends `X-RateLimit-Limit` / `X-RateLimit-Remaining`
 * headers. A no-op passthrough to `handlerFn` when the `RateLimit` object is not
 * registered.
 *
 * @param prefix Namespace for the counter (e.g. `"auth"`), scoped per client.
 * @param params The request context, forwarded to `handlerFn`.
 * @param handlerFn Handler to run when under the limit.
 * @param limit Maximum requests allowed within `timeLapse`.
 * @param timeLapse Sliding window in milliseconds; defaults to one hour.
 * @param onLimitReached Response factory used when the limit is exceeded; defaults to `res_429`.
 * @returns The handler's response, or the limit-reached response.
 */
export const rateLimitRequest = async (prefix: string, params: RequestParams, handlerFn?: Handler, limit = REQUEST_LIMIT_AMOUNT_PER_HOUR, timeLapse = hourInMs, onLimitReached = res_429 as any) => {
    if(apiker.objects.includes(OBN.RATELIMIT)){
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
         * TODO: This relies on the common object. To be rewritten
         */
        // const lastRateLimitPurge = await state().get("lastRateLimitPurge");

        // if(!lastRateLimitPurge){
        //     state().put({ lastRateLimitPurge: Date.now() });
        // } else {
        //     if(Date.now() - lastRateLimitPurge >= hourInMs){
        //         state(OBN.RATELIMIT).deleteAll();
        //         state().put({ lastRateLimitPurge: Date.now() });
        //     }
        // }
    }

    if(handlerFn){
        return handlerFn(params);
    }
};

/**
 * Determines whether the client has exceeded the rate limit within the window.
 *
 * @param prefix Counter namespace to inspect.
 * @param limit Maximum requests allowed within `timeLapse`.
 * @param timeLapse Sliding window in milliseconds.
 * @returns `rateLimitReached` and the current `requestCount` in the window.
 */
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
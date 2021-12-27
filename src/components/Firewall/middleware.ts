import { res_429 } from "../Response";
import { apiker } from "../Apiker";
import { rateLimitRequest } from "../RateLimit";
import { Middleware } from "../Request";
import { FIREWALL_RATELIMIT_PREFIX, FIREWALL_REQUESTS_MINUTE } from "./constants";
import { banIP } from "./Firewall";

export const firewallMiddleWare: Middleware = (params, {}, nextMiddleware) => {
    const ip = apiker.headers.get("CF-Connecting-IP") as string;
    const minuteInMs = 60000;

    const limitRequestsPerMinute = typeof apiker.firewall === "object" ? apiker.firewall.limitRequestsPerMinute : null;
    
    return rateLimitRequest(
        FIREWALL_RATELIMIT_PREFIX,
        nextMiddleware,
        params,
        limitRequestsPerMinute || FIREWALL_REQUESTS_MINUTE,
        minuteInMs, 
        async () => {
            await banIP(ip);
            return res_429("You've made too many requests. Please try again later.");
        }
    );
}
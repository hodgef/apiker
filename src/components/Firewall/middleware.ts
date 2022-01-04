import { res_429 } from "../Response";
import { apiker } from "../Apiker";
import { rateLimitRequest } from "../RateLimit";
import { Middleware } from "../Request";
import { FIREWALL_RATELIMIT_PREFIX, FIREWALL_REQUESTS_MINUTE } from "./constants";
import { firewallBanIP } from "./Firewall";
import { banSignedIP } from "../Bans";
import { getCurrentUser } from "../Auth";

export const firewallMiddleWare: Middleware = (params, nextMiddleware) => {
    const { headers } = apiker.requestParams;
    const ip = headers.get("CF-Connecting-IP") as string;
    const minuteInMs = 60000;

    const limitRequestsPerMinute = typeof apiker.firewall === "object" ? apiker.firewall.limitRequestsPerMinute : null;
    
    return rateLimitRequest(
        FIREWALL_RATELIMIT_PREFIX,
        nextMiddleware,
        params,
        limitRequestsPerMinute || FIREWALL_REQUESTS_MINUTE,
        minuteInMs, 
        async () => {
            const user = await getCurrentUser();
            if(user?.role !== "admin"){
                apiker.bans.push(ip);
                await banSignedIP();
                await firewallBanIP(ip);
                return res_429();
            }
        }
    );
}
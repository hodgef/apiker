import { res_429 } from "../Response";
import { apiker } from "../Apiker";
import { rateLimitRequest } from "../RateLimit";
import { Middleware } from "../Middleware";
import { FIREWALL_RATELIMIT_PREFIX, FIREWALL_REQUESTS_MINUTE } from "./constants";
import { firewallBanIP } from "./Firewall";
import { banSignedIP } from "../Bans";
import { getCurrentUser, getSignedIp } from "../Auth";
import { OBN } from "../ObjectBase";

export const firewallMiddleware: Middleware = (params) => {
    const { headers } = apiker.requestParams;
    const ip = headers.get("CF-Connecting-IP") as string;
    const minuteInMs = 60000;

    const limitRequestsPerMinute = typeof apiker.firewall === "object" ? apiker.firewall.limitRequestsPerMinute : null;

    return rateLimitRequest(
        FIREWALL_RATELIMIT_PREFIX,
        params,
        undefined,
        limitRequestsPerMinute || FIREWALL_REQUESTS_MINUTE,
        minuteInMs, 
        async () => {
            const user = await getCurrentUser();
            if(user?.role !== "admin"){
                await banSignedIP(getSignedIp());
                await firewallBanIP(ip);
                // Since we've banned the user, we can delete all related rate limit entries
                const { state } = apiker.requestParams;
                state(OBN.RATELIMIT).deleteAll();
                return res_429();
            }
        }
    );
};
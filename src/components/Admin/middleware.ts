import { apiker } from "../Apiker";
import { getCurrentUser, isCurrentUserAdmin, parseJWT } from "../Auth";
import { getCurrentUserGeodata } from "../Geolocation";
import { Middleware, forwardToMiddleware } from "../Middleware";
import { Handler } from "../Request";
import { res_204, res_401 } from "../Response";

export const adminLoginMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    // adminIds is the authoritative list; a role on the user object alone is not.
    if(!await isCurrentUserAdmin()){
        return res_401();
    }

    if(handlerFn){
        return handlerFn(params);
    }
};

export const adminCsrfCheckMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    const { headers } = apiker.requestParams;
    const csrfToken = headers.get("X-Apiker-Csrf") as string;
    const parsedCsrfToken = parseJWT(csrfToken);

    if(!csrfToken || !parsedCsrfToken){
        return res_401();
    }

    if(parsedCsrfToken.sub){
        const user = await getCurrentUser();

        if(user?.id !== parsedCsrfToken.sub){
            return res_401();
        }
    }

    if(handlerFn){
        return handlerFn(params);
    }
}

/**
 * A whitelist variable holds one value or a comma-separated list of them, so an
 * admin can reach the panel from more than one network without editing the
 * deployment each time they move.
 *
 * A single `*` entry is an allow-all escape hatch for local development; it is
 * only honored when `allowWildcard` is set (see `isLocalRuntime`), so it can
 * never open a public deployment.
 */
export const isWhitelisted = (value: string | undefined, whitelist: string | undefined, allowWildcard = false) => {
    const entries = String(whitelist || "")
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean);

    if(allowWildcard && entries.includes("*")){
        return true;
    }

    return entries.some(entry => entry === String(value || "").trim());
};

/**
 * Privileged routes: the token has to belong to the admin making the call.
 *
 * The signed-out panel page hands out a token with no subject, so accepting one
 * here would let any visitor mint a token that satisfies the CSRF check.
 */
export const adminSessionCsrfCheckMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    const { headers } = apiker.requestParams;
    const csrfToken = headers.get("X-Apiker-Csrf") as string;
    const parsedCsrfToken = parseJWT(csrfToken);

    if(!csrfToken || !parsedCsrfToken?.sub){
        return res_401();
    }

    const user = await getCurrentUser();

    if(!user?.id || user.id !== parsedCsrfToken.sub){
        return res_401();
    }

    if(handlerFn){
        return handlerFn(params);
    }
}

/**
 * Cloudflare's edge sets `CF-Connecting-IP` on every production request and a client
 * cannot remove it, so its absence means the worker is running locally (wrangler dev).
 * The `*` allowlist escape hatch is honored only here — never on a public deployment.
 */
const isLocalRuntime = () => !apiker.requestParams.headers.get("CF-Connecting-IP");

export const adminWhitelistMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    const { ADMP_IP_WHITELIST, ADMP_ISP_WHITELIST, ADMP_CITY_WHITELIST } = apiker.env;

    // Fail closed: the panel stays unreachable until at least one allowlist is configured, so a
    // deployment can never accidentally expose it to the public internet.
    if(!ADMP_IP_WHITELIST && !ADMP_ISP_WHITELIST && !ADMP_CITY_WHITELIST){
        return res_401();
    }

    const allowWildcard = isLocalRuntime();
    const { headers } = apiker.requestParams;
    const ip = headers.get("CF-Connecting-IP") as string;

    if(ADMP_IP_WHITELIST && !isWhitelisted(ip, ADMP_IP_WHITELIST, allowWildcard)){
        return res_401();
    }

    // Geolocation costs an external lookup, so only resolve it when a geo allowlist is set.
    if(ADMP_ISP_WHITELIST || ADMP_CITY_WHITELIST){
        const userGeoloc = await getCurrentUserGeodata();

        if(ADMP_ISP_WHITELIST && !isWhitelisted(userGeoloc.isp, ADMP_ISP_WHITELIST, allowWildcard)){
            return res_401();
        }

        if(ADMP_CITY_WHITELIST && !isWhitelisted(userGeoloc.city, ADMP_CITY_WHITELIST, allowWildcard)){
            return res_401();
        }
    }

    if(handlerFn){
        return handlerFn(params);
    }
};

export const adminMiddleware: Middleware = async (params, handlerFn = () => res_204()) => {
    return forwardToMiddleware(params, [
        adminSessionCsrfCheckMiddleware,
        adminWhitelistMiddleware,
        adminLoginMiddleware,
        handlerFn
    ]);
};

/** Entry points: reachable before an admin exists, so only the network gate applies. */
export const adminEntryMiddleware: Middleware = async (params, handlerFn = () => res_204()) => {
    return forwardToMiddleware(params, [
        adminWhitelistMiddleware,
        handlerFn
    ]);
};

/** Login additionally proves the request came from a panel page. */
export const adminLoginRouteMiddleware: Middleware = async (params, handlerFn = () => res_204()) => {
    return forwardToMiddleware(params, [
        adminCsrfCheckMiddleware,
        adminWhitelistMiddleware,
        handlerFn
    ]);
};
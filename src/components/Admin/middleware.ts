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

export const adminWhitelistMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    if(apiker.env.ADMP_IP_WHITELIST || apiker.env.ADMP_ISP_WHITELIST || apiker.env.ADMP_CITY_WHITELIST){
        const { headers } = apiker.requestParams;
        const ip = headers.get("CF-Connecting-IP") as string;
        const userGeoloc = await getCurrentUserGeodata();

        if(apiker.env.ADMP_IP_WHITELIST && ip !== apiker.env.ADMP_IP_WHITELIST){
            return res_401();
        }

        if(apiker.env.ADMP_ISP_WHITELIST && userGeoloc.isp !== apiker.env.ADMP_ISP_WHITELIST){
            return res_401();
        }
    
        if(apiker.env.ADMP_CITY_WHITELIST && userGeoloc.city !== apiker.env.ADMP_CITY_WHITELIST){
            return res_401();
        }
    }

    if(handlerFn){
        return handlerFn(params);
    }
};

export const adminMiddleware: Middleware = async (params, handlerFn = () => res_204()) => {
    return forwardToMiddleware(params, [
        adminCsrfCheckMiddleware,
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
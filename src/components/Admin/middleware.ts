import { apiker } from "../Apiker";
import { getCurrentUser, parseJWT } from "../Auth";
import { getCurrentUserGeodata } from "../Geolocation";
import { Middleware, forwardToMiddleware } from "../Middleware";
import { Handler } from "../Request";
import { res_204, res_401 } from "../Response";

export const adminLoginMiddleware: Middleware = async (params, handlerFn?: Handler) => {
    const user = await getCurrentUser();
    if(user?.role !== "admin"){
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
        handlerFn
    ]);
};
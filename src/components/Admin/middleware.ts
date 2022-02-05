import { apiker } from "../Apiker";
import { getCurrentUser } from "../Auth";
import { getCurrentUserGeodata } from "../Geolocation";
import { Middleware } from "../Middleware";
import { res_401 } from "../Response";

export const adminLoginMiddleware: Middleware = async (params, nextMiddleware) => {
    const user = await getCurrentUser();
    if(user?.role !== "admin"){
        return res_401();
    }
    return nextMiddleware(params);
};

export const adminWhitelistMiddleware: Middleware = async (params, nextMiddleware) => {
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
    
    return adminLoginMiddleware(params, nextMiddleware);
};
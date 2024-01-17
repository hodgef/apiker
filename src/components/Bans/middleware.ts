import { res_401 } from "../Response";
import { Middleware } from "../Middleware";
import { isEntityBanned } from "./Bans";
import { getSignedIp } from "../Auth";

export const bansMiddleware: Middleware = async () => {
    if(await isEntityBanned(getSignedIp())){
        return res_401();
    }
};
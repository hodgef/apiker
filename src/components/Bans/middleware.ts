import { res_401 } from "../Response";
import { Middleware } from "../Middleware";
import { isSignedIPBanned } from "./Bans";
import { getSignedIp } from "../Auth";

export const bansMiddleware: Middleware = async () => {
    if(await isSignedIPBanned(getSignedIp())){
        return res_401();
    }
};
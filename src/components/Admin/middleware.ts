import { getCurrentUser } from "../Auth";
import { Middleware } from "../Request";
import { res_401 } from "../Response";

export const adminMiddleware: Middleware = async (params, nextMiddleware) => {
    const user = await getCurrentUser();
    if(user?.role !== "admin"){
        return res_401();
    }
    return nextMiddleware(params);
}
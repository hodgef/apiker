import { adminPanelBanId } from "./BanId";
import { Handler, RequestParams } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { adminPanelBans } from "./Bans";
import { adminPanelDashboard } from "./Dashboard";
import { adminMiddleware } from "./middleware";
import { adminPanelSetup } from "./Setup";
import { adminPanelVisitors } from "./Visitors";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    "/admp": adminPanelSetup,
    "/admp/static.js": adminPanelStatic,
    "/admp/dashboard": (params: RequestParams) => adminMiddleware(params, adminPanelDashboard),
    "/admp/visitors": (params: RequestParams) => adminMiddleware(params, adminPanelVisitors),
    "/admp/bans": (params: RequestParams) => adminMiddleware(params, adminPanelBans),
    "/admp/banid": (params: RequestParams) => adminMiddleware(params, adminPanelBanId),
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
}
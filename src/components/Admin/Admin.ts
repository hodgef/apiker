import { adminPanelBanId } from "./BanId";
import { Handler, RequestParams } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { adminPanelBans } from "./Bans";
import { adminPanelDashboard } from "./Dashboard";
import { adminWhitelistMiddleware } from "./middleware";
import { adminPanelSetup } from "./Setup";
import { adminPanelVisitors } from "./Visitors";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    "/admp": adminPanelSetup,
    "/admp/static.js": adminPanelStatic,
    "/admp/dashboard": (params: RequestParams) => adminWhitelistMiddleware(params, adminPanelDashboard),
    "/admp/visitors": (params: RequestParams) => adminWhitelistMiddleware(params, adminPanelVisitors),
    "/admp/bans": (params: RequestParams) => adminWhitelistMiddleware(params, adminPanelBans),
    "/admp/banid": (params: RequestParams) => adminWhitelistMiddleware(params, adminPanelBanId),
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
};
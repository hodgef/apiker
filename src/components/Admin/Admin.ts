import { Handler } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { adminPanelDashboard } from "./Dashboard";
import { adminPanelSetup } from "./Setup";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    "/admp": adminPanelSetup,
    "/admp/dashboard": adminPanelDashboard,
    "/admp/static.js": adminPanelStatic
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
}
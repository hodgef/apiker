import { Handler } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { adminPanelPage } from "./Panel";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    "/admp": adminPanelPage,
    "/admp/static.js": adminPanelStatic
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
};
import { Handler, RequestParams } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { bansEndpoint, loginEndpoint, searchBansEndpoint, sendEmailEndpoint, updateUserEndpoint } from "./Api";
import { adminPanelPage } from "./Panel";
import { adminCsrfCheckMiddleware, adminMiddleware } from "./middleware";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    // Entry endpoints under global ratelimit
    "/admp": adminPanelPage,
    "/admp/static.js": adminPanelStatic,

    // Login endpoint only checks for CSRF
    "/admp/login": (params: RequestParams) => adminCsrfCheckMiddleware(params, loginEndpoint),

    // Check for admin logged in and CSRF
    "/admp/bans": (params: RequestParams) => adminMiddleware(params, bansEndpoint),
    "/admp/bans/:userId": (params: RequestParams) => adminMiddleware(params, searchBansEndpoint),
    "/admp/email": (params: RequestParams) => adminMiddleware(params, sendEmailEndpoint),
    "/admp/user": (params: RequestParams) => adminMiddleware(params, updateUserEndpoint),
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
};
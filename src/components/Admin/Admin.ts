import { Handler, RequestParams } from "../Request";
import { resRaw } from "../Response";
import { apikerPagesStatic } from "../Static";
import { beaconsEndpoint, createAdminEndpoint, listUsersEndpoint, rebuildUserIndexEndpoint, overviewEndpoint, rateLimitEndpoint, searchLogsEndpoint, sweepLogsEndpoint, bansEndpoint, loginEndpoint, logoutEndpoint, searchBansEndpoint, sendEmailEndpoint, updateUserEndpoint } from "./Api";
import { adminPanelPage } from "./Panel";
import { adminCsrfCheckMiddleware, adminEntryMiddleware, adminLoginRouteMiddleware, adminMiddleware } from "./middleware";

/**
 * Responses
 */
export const getAdminRoutes = () => ({
    // Entry endpoints under global ratelimit
    "/admp": (params: RequestParams) => adminEntryMiddleware(params, adminPanelPage),
    /** The page is useless without it, so it answers to whoever may load the page. */
    "/admp/static.js": (params: RequestParams) => adminEntryMiddleware(params, adminPanelStatic),

    // Login endpoint only checks for CSRF
    "/admp/login": (params: RequestParams) => adminLoginRouteMiddleware(params, loginEndpoint),
    "/admp/logout": (params: RequestParams) => adminMiddleware(params, logoutEndpoint),

    // Check for admin logged in and CSRF
    "/admp/overview": (params: RequestParams) => adminMiddleware(params, overviewEndpoint),
    "/admp/logs": (params: RequestParams) => adminMiddleware(
        params,
        params.request.method === "POST" ? sweepLogsEndpoint : searchLogsEndpoint
    ),
    "/admp/beacons": (params: RequestParams) => adminMiddleware(params, beaconsEndpoint),
    "/admp/ratelimit": (params: RequestParams) => adminMiddleware(params, rateLimitEndpoint),
    "/admp/bans": (params: RequestParams) => adminMiddleware(params, bansEndpoint),
    "/admp/bans/:userId": (params: RequestParams) => adminMiddleware(params, searchBansEndpoint),
    "/admp/email": (params: RequestParams) => adminMiddleware(params, sendEmailEndpoint),
    "/admp/user": (params: RequestParams) => adminMiddleware(params, updateUserEndpoint),
    "/admp/users": (params: RequestParams) => adminMiddleware(
        params,
        params.request.method === "POST" ? rebuildUserIndexEndpoint : listUsersEndpoint
    ),
    "/admp/admins": (params: RequestParams) => adminMiddleware(params, createAdminEndpoint),
});

export const adminPanelStatic: Handler = () => {
    return resRaw(apikerPagesStatic, "text/javascript");
};
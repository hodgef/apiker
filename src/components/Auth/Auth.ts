import { rateLimitRequest } from "../RateLimit";
import { AUTH_PREFIX, AUTH_REGISTER_PREFIX, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./Apiker/constants";
import { RouteObject } from "../Request";
import { deleteUser, forgotUser, forgotUserReset, loginUser, refreshUser, registerUser, verifyUser, verifyUserProcess } from "./Apiker";
import { authorize as githubAuthorize, callback as githubCallback } from "./Github";

/**
 * Apiker
 */
export const getApikerAuthRoutes = (): RouteObject => ({
  "/auth/register": params => rateLimitRequest(AUTH_REGISTER_PREFIX, params, registerUser, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR),
  "/auth/login": params => rateLimitRequest(AUTH_PREFIX, params, loginUser),
  "/auth/refresh": params => rateLimitRequest(AUTH_PREFIX, params, refreshUser),
  "/auth/delete": params => rateLimitRequest(AUTH_PREFIX, params, deleteUser),
  "/auth/forgot": params =>  rateLimitRequest(AUTH_PREFIX, params, forgotUser),
  "/auth/forgot/reset": params =>  rateLimitRequest(AUTH_PREFIX, params, forgotUserReset),
  "/auth/verify": params =>  rateLimitRequest(AUTH_PREFIX, params, verifyUser),
  "/auth/verify/action": params =>  rateLimitRequest(AUTH_PREFIX, params, verifyUserProcess)
});

/**
 * Github
 */
export const getGithubAuthRoutes = (): RouteObject => ({
  "/auth/github/authorize": params => rateLimitRequest(AUTH_PREFIX, params, githubAuthorize),
  "/auth/github/callback": params => rateLimitRequest(AUTH_PREFIX, params, githubCallback)
});
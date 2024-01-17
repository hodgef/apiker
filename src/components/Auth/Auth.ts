import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { refreshUser } from "./refreshUser";
import { deleteUser } from "./deleteUser";
import { rateLimitRequest } from "../RateLimit";
import { AUTH_PREFIX, AUTH_REGISTER_PREFIX, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";
import { RouteObject } from "../Request";
import { forgotUser, forgotUserReset } from "./forgotUser";
import { verifyUser, verifyUserProcess } from "./verifyUser";

/**
 * Responses
 */
export const getAuthRoutes = (): RouteObject => ({
  "/auth/register": params => rateLimitRequest(AUTH_REGISTER_PREFIX, params, registerUser, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR),
  "/auth/login": params => rateLimitRequest(AUTH_PREFIX, params, loginUser),
  "/auth/refresh": params => rateLimitRequest(AUTH_PREFIX, params, refreshUser),
  "/auth/delete": params => rateLimitRequest(AUTH_PREFIX, params, deleteUser),
  "/auth/forgot": params =>  rateLimitRequest(AUTH_PREFIX, params, forgotUser),
  "/auth/forgot/reset": params =>  rateLimitRequest(AUTH_PREFIX, params, forgotUserReset),
  "/auth/verify": params =>  rateLimitRequest(AUTH_PREFIX, params, verifyUser),
  "/auth/verify/action": params =>  rateLimitRequest(AUTH_PREFIX, params, verifyUserProcess)
});
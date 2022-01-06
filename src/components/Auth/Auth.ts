import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { refreshUser } from "./refreshUser";
import { deleteUser } from "./deleteUser";
import { rateLimitRequest } from "../RateLimit";
import { AUTH_PREFIX, AUTH_REGISTER_PREFIX, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR } from "./constants";

/**
 * Responses
 */
export const getAuthRoutes = () => ({
  "/auth/register": params => rateLimitRequest(AUTH_REGISTER_PREFIX, registerUser, params, REGISTER_REQUEST_LIMIT_AMOUNT_PER_HOUR),
  "/auth/login": params => rateLimitRequest(AUTH_PREFIX, loginUser, params),
  "/auth/refresh": params => rateLimitRequest(AUTH_PREFIX, refreshUser, params),
  "/auth/delete": params => rateLimitRequest(AUTH_PREFIX, deleteUser, params)
});
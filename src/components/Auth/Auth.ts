import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { refreshUser } from "./refreshUser";
import { deleteUser } from "./deleteUser";
import { rateLimitRequest } from "../RateLimit";
import { AUTH_PREFIX } from "./constants";

/**
 * Responses
 */
export const getAuthRoutes = () => ({
  // rate limit requests to auth to prevent bruteforce
  "/auth/register": params => rateLimitRequest(AUTH_PREFIX, registerUser, params),
  "/auth/login": params => rateLimitRequest(AUTH_PREFIX, loginUser, params),
  "/auth/refresh": params => rateLimitRequest(AUTH_PREFIX, refreshUser, params),
  "/auth/delete": params => rateLimitRequest(AUTH_PREFIX, deleteUser, params),
});
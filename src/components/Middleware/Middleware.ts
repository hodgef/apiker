import { RequestParams } from "../Request";
import { res_204 } from "../Response";
import { Middleware } from "./interfaces";

/**
 * Runs a chain of middleware in order, returning the first `Response` any of
 * them produces. If none returns a truthy value, a `204 No Content` is returned.
 * A thrown error is caught and returned as a plain `Response` with its message.
 *
 * @param params The request context passed to every middleware.
 * @param middlewares Middleware to run, in order. The last entry is typically
 *   the route handler.
 * @returns The first truthy `Response`, or `res_204()` when none respond.
 */
export const forwardToMiddleware = async (params: RequestParams, middlewares: Middleware[] = []): Promise<Response | Middleware> => {
    try {
      for (let index = 0; index < middlewares.length; index++) {
        const middleware = middlewares[index];
        const response = await middleware(params);
        if(response) {
          return response;
        }
      }

      return res_204();
    } catch(e: any) {
      return new Response(e.message);
    }
};
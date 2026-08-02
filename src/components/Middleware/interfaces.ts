import { Handler, RequestParams } from "../Request";

/**
 * A middleware (or route handler) function. Receives the request context and
 * either returns a `Response` to short-circuit the chain, or a falsy value to
 * pass control to the next middleware.
 */
export type Middleware = (params: RequestParams, handlerFn?: Handler) => Response | Middleware | Promise<Middleware | Response | undefined>;
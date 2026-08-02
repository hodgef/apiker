import { MatchResult } from "path-to-regexp";
import { StateFn } from "../State";

/** Context passed to every route handler and middleware. */
export interface RequestParams {
  /** Factory for the Durable Object state accessor. */
  state: StateFn;
  /** Route match result from `path-to-regexp`; `matches.params` holds route params. */
  matches: MatchResult<any>;
  /** Parsed request body (see `readRequestBody`). */
  body: any;
  /** Incoming request headers. */
  headers: Headers;
  /** The raw incoming request. */
  request: Request;
}

/** Context passed to a scheduled (cron) handler. */
export interface ScheduledParams {
  /** Factory for the Durable Object state accessor. */
  state: StateFn;
  /** The scheduled event provided by the Workers runtime. */
  event?: any;
  /** Worker environment bindings. */
  env?: any;
  /** Worker execution context. */
  ctx?: any;
}

/** A route handler: receives the request context and returns a `Response`. */
export type Handler = ((params: RequestParams) => Response | Promise<Response>);

/** A map of route patterns to their handlers. */
export interface RouteObject {
  [route: string]: Handler;
}
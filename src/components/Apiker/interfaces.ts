import { RequestParams, ScheduledParams } from "../Request";

/** A map of route patterns to handler functions or `"Controller.method"` strings. */
export interface Routes {
  [route: string]: any;
}

/** A map of controller class names to their constructors, resolved by string routes. */
export interface Controllers {
  [className: string]: Controller;
}

/** Options accepted by `apiker.init()`. */
export interface Options {
  /** Route pattern → handler function or `"Controller.method"` string. */
  routes?: Routes;
  /** Controller classes referenced by string routes. */
  controllers?: Controllers;
  /** Enable verbose logging and pretty-printed JSON responses. */
  debug?: boolean;
  /** Durable Object schema version tag. */
  objectVersion?: string;
  /** The Worker's `exports` object; Apiker attaches handlers and DO classes to it. */
  exports?: any;
  /** Durable Object class names to generate and export. */
  objects?: string[];
  /** Per-object rule for deriving the Durable Object instance id. */
  objectStateMapping?: ObjectStateMapping;
  /** Worker environment bindings (set per request). */
  env?: any;
  /** Worker execution context (set per request). */
  ctx?: any;
  /** Enable the built-in `/auth/*` routes. Defaults to `false`. */
  authRoutes?: boolean;
  /** Current request context (set per request). */
  requestParams?: RequestParams;
  /** Enable the request firewall; `true` for defaults or an object to configure it. */
  firewall?: Firewall | boolean;
  /** Enable the built-in admin panel routes (`/admp*`). Defaults to `false`. */
  adminPanel?: boolean;
  /** Application name. Defaults to `"Apiker"`. */
  name?: string;
  /** Transactional email configuration. */
  email?: EmailOptions;
  /** Handler invoked on scheduled (cron) events. */
  scheduled?: (params: ScheduledParams) => Promise<void>;
}

/** Named timing marks (epoch ms), keyed by timing name. */
export type Timings = { [timingName: string]: number };
/** Per-object rule for deriving a Durable Object instance id (an `OBMT` token, route param, or literal). */
export type ObjectStateMapping = { [objectName: string]: string };

/** Configuration for outbound transactional email. */
export interface EmailOptions {
  /** Display name for the sender. */
  name?: string;
  /** Sender email address. */
  senderEmail: string;
}

/** Firewall configuration. */
export interface Firewall {
  /** Maximum requests allowed per client per minute before banning. */
  limitRequestsPerMinute: number;
}

/** A controller class constructor referenced by a string route. */
export type Controller = new (...args: any[]) => any;
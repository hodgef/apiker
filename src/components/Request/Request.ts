import { apiker } from "../Apiker";
import { match } from "path-to-regexp";
import { RESPONSE_HEADERS_DEFAULT, res_404 } from "../Response";
import { getStateMethods } from "../State";
import { Handler, RequestParams } from "./interfaces";
import { firewallMiddleWare } from "../Firewall/middleware";
import { forwardToMiddleware, Middleware } from "../Middleware";
import { measureTiming } from "../Timings";
import { TIMINGS } from "../Timings/constants";

/**
 * Handles incoming Cloudflare Worker requests
 */
export const handleEntryRequest = async (request: Request, env: any) => {
  measureTiming(TIMINGS.REQUEST_START);
  
  try {
    apiker.setProps({ env });
    apiker.responseHeaders = new Headers(RESPONSE_HEADERS_DEFAULT);

    const url = new URL(request.url);
    const { pathname } = url;
  
    let handlerFn: Handler = () => res_404();
    const body = await readRequestBody(request);
    const headers = request.headers;
    let params = { request, body, headers } as RequestParams;
  
    /**
     * Check if path matches with a defined route
     */
    Object.keys(apiker.routes).some((routeName) => {
      const fn = match(routeName, { decode: decodeURIComponent });
      const matches = fn(pathname);
  
      if (matches) {
        const handler = apiker.routes[routeName];

        if(typeof handler === "function") {
          handlerFn = handler;

        } else if(typeof handler === "string") {
          const [handlerClass, handlerMethod] = handler.split(".");
          handlerFn = (new apiker.controllers[handlerClass]())[handlerMethod];
        }

        const state = getStateMethods(apiker.defaultObjectName, matches);
        params = {...params, matches, state };
      } else {
        const state = getStateMethods(apiker.defaultObjectName);
        params = {...params, state };
      }
  
      return !!matches;
    });

    apiker.requestParams = params;

    const middlewares: Handler[] & Middleware[] = [];

    /**
     * Apply middleware
     */
     if(apiker.firewall) {
      middlewares.push(firewallMiddleWare);
    }

  
    return forwardToMiddleware(params, handlerFn, middlewares);

  } catch (e: any) {
    return new Response(e.message);
  }
};

export const readRequestBody = async (request) => {
  let resBody;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const resText = await request.text();
      resBody = resText ? JSON.parse(resText): null;

    } else if (contentType.includes("application/text")) {
      resBody = request.text();

    } else if (contentType.includes("text/html")) {
      resBody = request.text();

    } else if (contentType.includes("form")) {
      const formData = await request.formData();
      const body = (Object as any).fromEntries(formData);
      resBody = body || {};

    } else {
      const textContent = await request.text();
      resBody = textContent || null;
    }
  } catch(e) {
    console.error("ERR readRequestBody", resBody);
    throw new Error("An exception occurred while parsing the request body");
  }
  
  return resBody;
};
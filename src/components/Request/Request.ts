import { apiker } from "../Apiker";
import { match } from "path-to-regexp";
import { res_404 } from "../Response";
import { getStateMethods } from "../State";
import { Handler, RequestParams } from "./interfaces";

/**
 * Handles incoming Cloudflare Worker requests
 */
export const handleEntryRequest = async (request: Request, env: any) => {
  try {
    apiker.setProps({ env });

    const url = new URL(request.url);
    const { pathname } = url;
  
    let handlerFn: Handler | undefined;
    let params = { request } as Partial<RequestParams>;
    const body = await readRequestBody(request);
    const headers = request.headers;
  
    /**
     * Check if path matches with a defined route
     */
    Object.keys(apiker.routes).some((routeName) => {
      const fn = match(routeName, { decode: decodeURIComponent });
      const matches = fn(pathname);
  
      if (matches) {
        const handler = apiker.routes[routeName];

        if(typeof handler === "string") {
          const [handlerClass, handlerMethod] = handler.split(".");
          handlerFn = (new apiker.controllers[handlerClass]())[handlerMethod];
  
        } else if(typeof handler === "function") {
          handlerFn = handler;
        }
  
        params = {...params, state: getStateMethods(apiker.defaultObjectName), matches, body, headers };
        apiker.setProps({ headers });
      }
  
      return !!matches;
    });
  
    return handlerFn
      ? forwardToHandler(handlerFn, params)
      : res_404();
  } catch (e: any) {
    return new Response(e.message);
  }
};

export const forwardToHandler = (handlerFn, params) => {
  try {
    return handlerFn(params);
  } catch(e: any) {
    return new Response(e.message);
  }
};

export const readRequestBody = async (request) => {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) || {};
  }
  if (contentType.includes("application/text")) {
    return request.text();
  }
  if (contentType.includes("text/html")) {
    return request.text();
  }
  if (contentType.includes("form")) {
    const formData = await request.formData();
    const body = (Object as any).fromEntries(formData);
    return body || {};
  }
  
  const textContent = await request.text();
  
  return textContent || null;
};
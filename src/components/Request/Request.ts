import { apiker, Handler } from "../Apiker";
import { match } from "path-to-regexp";
import { res_404 } from "../Response";

/**
 * Handles incoming Cloudflare Worker requests
 */
const handleRequest = async (request: any) => {
  const url = new URL(request.url);
  const { pathname } = url;

  let handler!: Handler;
  let method!: string;
  let params = { state: apiker.state, request } as any;

  /**
   * Check if path matches with a defined route
   */
  Object.keys(apiker.routes).some((routeName) => {
    const fn = match(routeName, { decode: decodeURIComponent });
    const matches = fn(pathname);

    if (matches) {
      const [handlerClass, handlerMethod] = apiker.routes[routeName].split(".");

      handler = apiker.handlers[handlerClass];
      method = handlerMethod;
      params = {...params, matches };
    }

    return !!matches;
  });

  return handler
    ? new handler()[method](params)
    : res_404();
};

export { handleRequest };

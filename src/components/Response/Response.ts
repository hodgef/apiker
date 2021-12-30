import { apiker } from "../Apiker";
import { RESPONSE_MESSAGES } from "./constants";

/**
 * Responses
 */
export const res_200 = (message = "", options = null) => res(message || RESPONSE_MESSAGES[200], options || 200);
export const res_400 = (message = "", options = null) => res(message || RESPONSE_MESSAGES[400], options || 400);
export const res_404 = (message = "", options = null) => res(message || RESPONSE_MESSAGES[404], options || 404);
export const res_429 = (message = "", options = null) => res(message || RESPONSE_MESSAGES[429], options || 429);

export const res = (input: any, options = {} as any) => {
  const data = typeof input === "string" || typeof input === "number" ? { message: input } : (input || {});
  return new Response(JSON.stringify({ ...data }, undefined, apiker.debug ? 4 : undefined), {
    headers: apiker.responseHeaders,
    ...(Number.isInteger(options) ? { status: options } : options)
  });
};

export const resRaw = (htmlContent: string, contentType = "text/html") => {
  const headers = apiker.responseHeaders;
  headers.set("content-type", `${contentType};charset=UTF-8`);
  return new Response(htmlContent, { headers });
}
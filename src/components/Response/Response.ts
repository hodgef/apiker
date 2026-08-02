import { apiker } from "../Apiker";
import { RESPONSE_MESSAGES } from "./constants";

/**
 * Normalizes a response payload into an object: a `string` or `number` becomes
 * `{ message: input }`, an object is passed through unchanged, and a nullish
 * value becomes `{}`.
 */
const parseInput = (input: any) => typeof input === "string" || typeof input === "number" ? { message: input } : (input || {});

/** Sends a `200 OK` JSON response. */
export const res_200 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[200], options || 200);
/** Sends a `201 Created` JSON response. */
export const res_201 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[201], options || 201);
/** Sends a `204 No Content` JSON response. */
export const res_204 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[204], options || 204);
/** Sends a `400 Bad Request` JSON response. */
export const res_400 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[400], options || 400);
/** Sends a `401 Unauthorized` JSON response. */
export const res_401 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[401], options || 401);
/** Sends a `404 Not Found` JSON response. */
export const res_404 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[404], options || 404);
/** Sends a `405 Method Not Allowed` JSON response. */
export const res_405 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[405], options || 405);
/** Sends a `429 Too Many Requests` JSON response. */
export const res_429 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[429], options || 429);
/** Sends a `500 Internal Server Error` JSON response. */
export const res_500 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[500], options || 500);

/**
 * Builds a JSON `Response` using Apiker's per-request response headers.
 *
 * The payload is normalized (strings/numbers become `{ message }`) and
 * pretty-printed with 4-space indentation when `apiker.debug` is enabled.
 *
 * @param input Response payload — a string, number, or object.
 * @param options Either a numeric HTTP status code, or a `ResponseInit` object
 *   that is merged into the response (status defaults to `200`).
 * @returns A `Response` with a JSON body and the configured headers.
 * @example
 * return res({ id: user.id }, 201);
 */
export const res = (input: any, options = {} as any) => {
  const data = parseInput(input);
  return new Response(JSON.stringify({ ...data }, undefined, apiker.debug ? 4 : undefined), {
    headers: apiker.responseHeaders,
    ...(Number.isInteger(options) ? { status: options } : options),
  });
};

/**
 * Builds a raw (non-JSON) `Response`, e.g. for serving HTML admin pages.
 *
 * @param htmlContent Raw response body.
 * @param contentType MIME type of the body; defaults to `text/html`.
 *   `;charset=UTF-8` is appended automatically.
 * @returns A `Response` with the raw body and the configured headers.
 */
export const resRaw = (htmlContent: string, contentType = "text/html") => {
  const headers = apiker.responseHeaders;
  headers.set("content-type", `${contentType};charset=UTF-8`);
  return new Response(htmlContent, { headers });
}
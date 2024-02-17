import { apiker } from "../Apiker";
import { RESPONSE_MESSAGES } from "./constants";

/**
 * Responses
 */
const parseInput = (input: any) => typeof input === "string" || typeof input === "number" ? { message: input } : (input || {});

export const res_200 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[200], options || 200);
export const res_201 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[201], options || 201);
export const res_204 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[204], options || 204);
export const res_400 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[400], options || 400);
export const res_401 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[401], options || 401);
export const res_404 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[404], options || 404);
export const res_405 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[405], options || 405);
export const res_429 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[429], options || 429);
export const res_500 = (input?: any, options = null) => res(input ? parseInput(input) : RESPONSE_MESSAGES[500], options || 500);

export const res = (input: any, options = {} as any) => {
  const data = parseInput(input);
  return new Response(JSON.stringify({ ...data }, undefined, apiker.debug ? 4 : undefined), {
    ...(Number.isInteger(options) ? { status: options } : options),
    headers: {
      ...apiker.responseHeaders,
      ...(options.headers || {})
    },
  });
};

export const resRaw = (htmlContent: string, contentType = "text/html") => {
  const headers = apiker.responseHeaders;
  headers.set("content-type", `${contentType};charset=UTF-8`);
  return new Response(htmlContent, { headers });
}
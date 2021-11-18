import { apiker } from "../Apiker";
import { RESPONSE_HEADERS_DEFAULT } from "./constants";

/**
 * Responses
 */
 export const res_200 = (message = "Success", options: {[key: string]: any} = {}) => {
  return new Response(JSON.stringify({ message, status: 200 }, undefined, apiker.debug ? 4 : undefined), {
    status: 200,
    headers: RESPONSE_HEADERS_DEFAULT,
    ...options
  });
};

export const res_404 = (message = "Not Found", options: {[key: string]: any} = {}) => {
  return new Response(JSON.stringify({ message, status: 404 }, undefined, apiker.debug ? 4 : undefined), {
    status: 404,
    headers: RESPONSE_HEADERS_DEFAULT,
    ...options
  });
};

export const res_400 = (message = "Bad request", options: {[key: string]: any} = {}) => {
  return new Response(JSON.stringify({ message, status: 400 }, undefined, apiker.debug ? 4 : undefined), {
    status: 400,
    headers: RESPONSE_HEADERS_DEFAULT,
    ...options
  });
};

export const res = (input: any, options = {} as any ) => {
  const data = typeof input === "string" ? { message: input } : (input || {});
  return new Response(JSON.stringify({ ...data }, undefined, apiker.debug ? 4 : undefined), {
    headers: RESPONSE_HEADERS_DEFAULT,
    ...(Number.isInteger(options) ? { status: options } : options)
  });
};
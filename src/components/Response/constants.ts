export const RESPONSE_HEADERS_DEFAULT = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,HEAD,PUT,POST,DELETE,PATCH",
  "content-type": "application/json"
};

export const RESPONSE_MESSAGES = {
  200: "Success",
  201: "Created",
  204: "No Content",
  400: "Bad request",
  401: "Forbidden",
  404: "Not found",
  405: "Invalid Method",
  429: "Too many requests",
  500: "Internal Server Error"
};
/** Canonical Durable Object names used by Apiker's built-in features. */
export const OBN = {
  COMMON: "Common",
  USERS: "Users",
  EMAILTOUUID: "EmailToUUID",
  RATELIMIT: "RateLimit",
  LOGS: "Logs",
  BANS: "Bans",
  BEACONS: "Beacons"
};

/**
 * Object-state-mapping tokens. They determine how an object name resolves to a
 * concrete instance id (see `parseObjectStateMapping`).
 */
export const OBMT = {
  DEFAULT: "default",
  SIGNEDIP: "signedIp",
  CLIENTID: "clientId",
  IP: "ip"
}

/** Dummy origin used for `fetch` calls to a Durable Object (the host is ignored). */
export const OB_ENDPOINT = `https://durable-object`;
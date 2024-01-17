import { apiker } from "../Apiker";
import { parse } from "cookie"
import cryptojs from "cfw-crypto";
import bcrypt from "cfw-bcrypt";
import { OBN } from "../ObjectBase";
import { User } from "./interfaces";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";

const CryptoJS = cryptojs();
const Bcrypt = bcrypt();

/**
 * Encodes an input into Base64
 * @param inputStr Base64 input to decode
 */
export const encodeString = (inputStr: any) => {
  const wordArr = CryptoJS.enc.Utf8.parse(inputStr);
  const result = CryptoJS.enc.Base64.stringify(wordArr);
  return result;
};

/**
 * Decodes a Base64 input
 * @param inputStr Base64 input to decode
 */
export const decodeString = (inputStr: any) => {
  const keyb64 = inputStr.toString(CryptoJS.enc.Base64);
  const result = CryptoJS.enc.Base64.parse(keyb64).toString(CryptoJS.enc.Utf8);
  return JSON.parse(result);
};

/**
 * Generates a JWT token
 * @param data Payload to include in the token
 * @param expirationInMinutes Expiration of the token (in minutes)
 */
export const createJWT = (data: any, expirationInMinutes = 0) => {
  if(expirationInMinutes > 0){
    data.exp = Date.now() + (expirationInMinutes * 60 * 1000);
  }

  const header = {alg: "HS256", typ: "JWT"};
  const headerStr = encodeString(JSON.stringify(header));
  const payloadStr = encodeString(JSON.stringify(data));
  const signature = sign(headerStr + "." + payloadStr);
  const result = `${headerStr}.${payloadStr}.${signature}`;
  return result;
};

/**
 * Parses a JWT token
 * @param token JWT token
 */
export const parseJWT = (token: string, disableClientIdCheck?: boolean) => {
  if(!token){
    return;
  }

  const [header, payload, signature] = token.split(".");
  const headerPayloadStr = `${header}.${payload}`;

  /**
   * Check for signature early
   */
  if(signature === sign(headerPayloadStr)){
    const resPayload = decodeString(payload);

    const isExpired = (
      resPayload.exp && Date.now() > resPayload.exp
    );

    const isSameClient = (
      disableClientIdCheck ||
      resPayload.clientId === getClientId() ||
      !resPayload.clientId
    );

    if(isSameClient && !isExpired){
      return resPayload;
    }
  }
};

/**
 * Generates a bcrypt hash of a given message
 * @param message Message to hash
 */
export const hash_bcrypt = (message: string): string => {
  const salt = Bcrypt.genSaltSync(7);
  const hash = Bcrypt.hashSync(message, salt);
  return hash;
};

/**
 * Compares a raw value with a bcrypt hash
 * @param message Raw input to compare
 * @param hash Hash to compare against
 */
export const compare_bcrypt = (message: string, hash: string): boolean => {
  return Bcrypt.compareSync(message, hash);
};

/**
 * Creates a Base64 hash signed with the Apiker's installation secret key
 */
export const sign = (message): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("env.APIKER_SECRET_KEY is undefined. Please consult the documentation");
  }

  const signature = CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY);
  return CryptoJS.enc.Base64.stringify(signature);
};

/**
 * Creates a SHA256 hash signed with the Apiker's installation secret key
 */
export const sign_sha256 = (message: string): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("env.APIKER_SECRET_KEY is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

/**
 * Creates a SHA1 hash signed with the Apiker's installation secret key
 */
export const sign_sha1 = (message: string): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("env.APIKER_SECRET_KEY is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA1(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

/**
 * Creates a random SHA256 hash
 */
export const randomHash = () => {
  const wordArray = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
};

/**
 * Creates a random SHA1 hash
 */
export const randomHash_SHA1 = (): string => {
  const wordArray = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
};

/**
 * Generating a clientId
 * This value is returned to client and not stored
 */
export const getClientId = () => {
  const { headers } = apiker.requestParams;
  const ip = headers.get("CF-Connecting-IP");
  const userAgent = headers.get("User-Agent") || "";
  const clientId = sign_sha1(ip + userAgent);
  return clientId;
};

/**
 * Retrieves the auth tokens from the request headers or cookies.
 */
export const extractToken = (): string => {
  const { headers, request } = apiker.requestParams;
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const authHeader = headers?.get("Authorization");
  const cookie = parse(headers?.get("Cookie") || "")
  const authCookie = cookie["apikerToken"] || "";
  const authParam = params.get("t") ? `Bearer ${params.get("t")}`: "";
  const authValue = (authHeader || authCookie || authParam);

  if(authValue?.includes("Bearer")){
    return authValue.split(" ")[1];
  } else {
    return "";
  }
};

/**
 * Fetches the current user by checking for the auth token in the request headers or in the cookies.
 */
export const getCurrentUser = async (disableClientIdCheck?: boolean): Promise<User | undefined> => {
  const { state } = apiker.requestParams;
  const token = extractToken();

  if(!token){
    return;
  }

  const payload = parseJWT(token, disableClientIdCheck);

  if(!payload){
    return;
  }

  const { sub: userId } = payload;
  const user = await state(OBN.USERS, userId).get(userId);

  if(user?.password){
    return user;
  }
}

/**
 * Checks whether a given user is an admin
 */
export const isUserAdmin = async (userId = ""): Promise<boolean> => {
  if(!userId) return false;
  const { state } = apiker.requestParams;
  const adminIds = await state(OBN.COMMON).get("adminIds");
  return adminIds.includes(userId);
}

/**
 * Checks whether the current user is an admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return await isUserAdmin(user?.id);
}

/**
 * Generates auth tokens for a given user
 * @param userId The user's ID
 * @param expirationInMinutes The expiration time for the action token. The refresh token does not expire.
 */
export const getTokens = (userId: string, expirationInMinutes = AUTH_TOKEN_DURATION_MINS_DEFAULT) => {
  const clientId = getClientId();
  const token = createJWT({ sub: userId, clientId }, expirationInMinutes);
  const refreshToken = createJWT({ sub: userId, clientId });

  return { userId, token, refreshToken };
};

/**
 * Gets the client's IP
 */
export const getRawIp = () => {
  const { headers } = apiker.requestParams;
  return headers.get("CF-Connecting-IP") as string;
}

/**
 * Gets the client's IP signed in SHA1 format.
 */
export const getSignedIp = () => {
  return sign_sha1(getRawIp());
}
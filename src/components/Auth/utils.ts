import { apiker } from "../Apiker";
import { parse } from "cookie"
import cryptojs from "cfw-crypto";
import bcrypt from "cfw-bcrypt";
import { OBN } from "../ObjectBase";
import { User } from "./interfaces";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";

const CryptoJS = cryptojs();
const Bcrypt = bcrypt();

export const encodeString = (inputStr) => {
  const wordArr = CryptoJS.enc.Utf8.parse(inputStr);
  const result = CryptoJS.enc.Base64.stringify(wordArr);
  return result;
};

export const decodeString = (inputStr) => {
  const keyb64 = inputStr.toString(CryptoJS.enc.Base64);
  const result = CryptoJS.enc.Base64.parse(keyb64).toString(CryptoJS.enc.Utf8);
  return JSON.parse(result);
};

export const createJWT = (data, expirationInMinutes = 0) => {
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

export const parseJWT = (token: string) => {
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
      resPayload.clientId === getClientId() ||
      !resPayload.clientId
    );

    if(isSameClient && !isExpired){
      return resPayload;
    }
  }
};

export const hash_bcrypt = (message: string): string => {
  const salt = Bcrypt.genSaltSync(7);
  const hash = Bcrypt.hashSync(message, salt);
  return hash;
};

export const compare_bcrypt = (message: string, hash: string): boolean => {
  return Bcrypt.compareSync(message, hash);
};

export const sign = (message): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  const signature = CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY);
  return CryptoJS.enc.Base64.stringify(signature);
};

export const sign_sha256 = (message: string): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

export const sign_sha1 = (message: string): string => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA1(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

export const randomHash = () => {
  const wordArray = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
};

export const randomHash_SHA1 = () => {
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
  const clientId = sign(ip + userAgent);
  return clientId;
};

export const extractToken = () => {
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
  }
};

export const getCurrentUser = async (): Promise<User | undefined> => {
  const { state } = apiker.requestParams;
  const token = extractToken();

  if(!token){
    return;
  }

  const payload = parseJWT(token);

  if(!payload){
    return;
  }

  const { sub: userId } = payload;
  const user = await state(OBN.USERS, userId).get(userId);

  if(user?.password){
    return user;
  }
}

export const isUserAdmin = async (userId = ""): Promise<boolean> => {
  if(!userId) return false;
  const { state } = apiker.requestParams;
  const adminIds = await state(OBN.COMMON).get("adminIds");
  return adminIds.includes(userId);
}

export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return await isUserAdmin(user?.id);
}

export const getTokens = (userId: string, expirationInMinutes = AUTH_TOKEN_DURATION_MINS_DEFAULT) => {
  const clientId = getClientId();
  const token = createJWT({ sub: userId, clientId }, expirationInMinutes);
  const refreshToken = createJWT({ sub: userId, clientId });

  return { userId, token, refreshToken };
};

export const getRawIp = () => {
  const { headers } = apiker.requestParams;
  return headers.get("CF-Connecting-IP") as string;
}

export const getSignedIp = () => {
  return sign(getRawIp());
}
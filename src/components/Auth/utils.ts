import { apiker } from "../Apiker";
import cryptojs from "../Vendor/crypto";
import bcrypt from "../Vendor/bcrypt";

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

export const hash_bcrypt = (message: string) => {
  const salt = Bcrypt.genSaltSync(7);
  const hash = Bcrypt.hashSync(message, salt);
  return hash;
};

export const compare_bcrypt = (message: string, hash: string) => {
  return Bcrypt.compareSync(message, hash);
};

export const sign = (message) => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  const signature = CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY);
  return CryptoJS.enc.Base64.stringify(signature);
};

export const sign_sha256 = (message) => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA256(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

export const sign_sha1 = (message) => {
  if(!apiker.env.APIKER_SECRET_KEY){
    throw new Error("Apiker secret key is undefined. Please consult the documentation");
  }

  return CryptoJS.HmacSHA1(message, apiker.env.APIKER_SECRET_KEY).toString(CryptoJS.enc.Hex);
};

export const randomHash = () => {
  const wordArray = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
};

export const randomHash_sha1 = () => {
  const wordArray = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
};

/**
 * Generating a clientId
 * This value is returned to client and not stored
 */
export const getClientId = () => {
  const ip = apiker.headers.get("CF-Connecting-IP");
  const userAgent = apiker.headers.get("User-Agent") || "";
  const clientId = sign(ip + userAgent);
  return clientId;
};

export const extractToken = (headers: Headers) => {
  const authHeader = headers.get("Authorization");

  if(authHeader?.includes("Bearer")){
    return authHeader.split(" ")[1];
  }
};
import { RequestParams } from "./../Request";
import { res, res_200, res_400 } from "../Response";
import { createJWT, getClientId, parseJWT, randomHash, sign } from "./utils";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";
import { OBN } from "../ObjectBase";

/**
 * Responses
 */
export const getAuthRoutes = () => ({
  "/auth/register": registerUser,
  "/auth/login": loginUser,
  "/auth/refresh": refreshUser,
  "/auth/delete": deleteUser,
});

const getTokens = (userId: string) => {
  const clientId = getClientId();
  const token = createJWT({ sub: userId, clientId }, AUTH_TOKEN_DURATION_MINS_DEFAULT);
  const refreshToken = createJWT({ sub: userId, clientId });

  return { userId, token, refreshToken };
};

export const extractToken = (headers: Headers) => {
  const authHeader = headers.get("Authorization");

  if(authHeader?.includes("Bearer")){
    return authHeader.split(" ")[1];
  }
};

export const registerUser = async ({ body, state }: RequestParams) => {
  const { email, password } = body;

  if(!email || !password) {
    return res_400();
  }

  /**
   * Check if user exists
   */
  const currentUserId = await state(OBN.EMAILTOUUID).get(email);

  if(currentUserId) {
    return res_400();
  }

  const userId = randomHash();
  const signedPassword = sign(password);

  /**
   * Create user
   */
  await state(OBN.USERS).put({ [userId]: {
    email,
    password: signedPassword,
    createdAt: Date.now()
  }});

  /**
   * Create EmailToUUID entry
   */
  await state(OBN.EMAILTOUUID).put({ [email]: userId });
  
  return res(getTokens(userId));
};

export const loginUser = async ({ body, state }: RequestParams) => {
  const { email, password } = body;

  if(!email || !password) {
    return res_400();
  }

  /**
   * Check if user exists
   */
  const userId = await state(OBN.EMAILTOUUID).get(email);
  const signedPassword = sign(password);

  if(!userId) {
    return res_400();
  }

  /**
   * Check user
   */
  const user = await state(OBN.USERS).get(userId);

  if(user?.password === signedPassword){
    return res(getTokens(userId));
  } else {
    return res_400();
  }
};

export const refreshUser = async ({ headers, state }: RequestParams) => {
  const token = extractToken(headers);

  if(!token){
    return res_400();
  }

  const payload = parseJWT(token);

  if(!payload){
    return res_400();
  }

  const { sub: userId } = payload;
  const user = await state(OBN.USERS).get(userId);

  if(user?.password){
    return res(getTokens(userId));
  } else {
    return res_400();
  }
};

export const deleteUser = async ({ headers, state }: RequestParams) => {
  const token = extractToken(headers);

  if(!token){
    return res_400();
  }

  const payload = parseJWT(token);

  if(!payload){
    return res_400();
  }

  const { sub: userId } = payload;
  const user = await state(OBN.USERS).get(userId);

  if(!user?.email){
    return res_400();
  }

  await state(OBN.EMAILTOUUID).delete(user.email);
  await state(OBN.USERS).delete(userId);

  return res_200();
};
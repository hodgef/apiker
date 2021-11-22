import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res, res_400 } from "../Response";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";
import { createJWT, extractToken, getClientId, parseJWT } from "./utils";

const getTokens = (userId: string) => {
  const clientId = getClientId();
  const token = createJWT({ sub: userId, clientId }, AUTH_TOKEN_DURATION_MINS_DEFAULT);
  const refreshToken = createJWT({ sub: userId, clientId });

  return { userId, token, refreshToken };
};

export const refreshUser: Handler = async ({ headers, state }) => {
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
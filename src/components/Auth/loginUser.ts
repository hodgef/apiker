import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res, res_400 } from "../Response";
import { isEmail, isRequiredLength } from "../Validation";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";
import { compare_bcrypt, createJWT, getClientId } from "./utils";

const getTokens = (userId: string) => {
    const clientId = getClientId();
    const token = createJWT({ sub: userId, clientId }, AUTH_TOKEN_DURATION_MINS_DEFAULT);
    const refreshToken = createJWT({ sub: userId, clientId });
  
    return { userId, token, refreshToken };
};

export const loginUser: Handler = async ({ body, state }) => {
    const { email, password } = body;
  
    if(!isEmail(email) || !isRequiredLength(password)) {
      return res_400();
    }
  
    /**
     * Check if user exists
     */
    const userId = await state(OBN.EMAILTOUUID).get(email);
  
    if(!userId) {
      return res_400();
    }
  
    /**
     * Check user
     */
    const user = await state(OBN.USERS).get(userId);
  
    if(user?.password && compare_bcrypt(password, user.password)){
      return res(getTokens(userId));
    } else {
      return res_400();
    }
  };
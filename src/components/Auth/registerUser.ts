import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res, res_400 } from "../Response";
import { isEmail, isRequiredLength } from "../Validation";
import { AUTH_TOKEN_DURATION_MINS_DEFAULT } from "./constants";
import { createJWT, getClientId, hash_bcrypt, randomHash } from "./utils";

const getTokens = (userId: string) => {
  const clientId = getClientId();
  const token = createJWT({ sub: userId, clientId }, AUTH_TOKEN_DURATION_MINS_DEFAULT);
  const refreshToken = createJWT({ sub: userId, clientId });

  return { userId, token, refreshToken };
};

export const registerUser: Handler = async ({ body, state }) => {
    const { email, password } = body;
  
    if(!isEmail(email) || !isRequiredLength(password)) {
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
    const signedPassword = hash_bcrypt(password);
  
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
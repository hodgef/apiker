import { apiker } from "../Apiker";
import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res, res_400 } from "../Response";
import { isEmail, isRequiredLength } from "../Validation";
import { User } from "./interfaces";
import { getTokens, hash_bcrypt, randomHash_SHA1 } from "./utils";

export const registerUser: Handler = async ({ body }) => {
    const { email, password } = body;
  
    const user = await registerUserAction(email, password);

    if(!user?.id){
      return res_400();
    }

    const tokens = getTokens(user?.id);
  
    if(tokens) {
      return res(tokens);
    } else {
      return res_400();
    }
};


export const registerUserAction = async (email: string, password: string, extraParams = {}) => {
  const { state } = apiker.requestParams;
  if(!isEmail(email) || !isRequiredLength(password)) {
    return;
  }

  /**
   * Check if user exists
   */
  const currentUserId = await state(OBN.EMAILTOUUID, email).get(email);

  if(currentUserId) {
    return;
  }

  const id = randomHash_SHA1();
  const signedPassword = hash_bcrypt(password);
  const user: User = {
    id,
    email,
    password: signedPassword,
    createdAt: Date.now(),
    ...extraParams,
  };

  /**
   * Create user
   */
  await state(OBN.USERS, id).put({ [id]: user });

  /**
   * Create EmailToUUID entry
   */
  await state(OBN.EMAILTOUUID, email).put({ [email]: id });
  return user;
}
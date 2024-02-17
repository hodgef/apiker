import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { Handler } from "../../Request";
import { res, res_400 } from "../../Response";
import { isEmail, isRequiredLength } from "../../Validation";
import { AUTH_ERRORS } from "./constants";
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
      return res({ email: user.email, ...tokens });
    } else {
      return res_400();
    }
};


export const registerUserAction = async (email: string, password: string, extraParams = {} as any): Promise<User | undefined> => {
  const { state } = apiker.requestParams;
  if(!isEmail(email) || !isRequiredLength(password)) {
    return;
  }

  /**
   * Check if user exists
   */
  const currentUserId = await state(OBN.EMAILTOUUID, email).get(email);

  if(currentUserId) {
    apiker.responseParams.setError(AUTH_ERRORS.USER_EXISTS);
    return;
  }

  const id = randomHash_SHA1();

  if(!id){
    apiker.responseParams.setError(AUTH_ERRORS.ID_GEN_ERROR);
    return;
  }

  const signedPassword = hash_bcrypt(password);
  const user: User = {
    id,
    email,
    password: signedPassword,
    verified: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
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

  /**
   * If it's an admin, create an entry in admin table
   */
  if(extraParams.role === "admin"){
    const adminIds = await state(OBN.COMMON).get("adminIds") || [];
    adminIds.push(id);
    await state(OBN.COMMON).put({ adminIds });
  }
  return user;
}
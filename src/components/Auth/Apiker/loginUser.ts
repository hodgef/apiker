import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { Handler } from "../../Request";
import { res, res_401 } from "../../Response";
import { isEmail, isRequiredLength } from "../../Validation";
import { User } from "./interfaces";
import { compare_bcrypt, getTokens } from "./utils";

export const loginUser: Handler = async ({ body }) => {
    const { email, password } = body;

    const tokens = await loginUserAction(email, password);
  
    if(tokens) {
      return res(tokens);
    } else {
      return res_401();
    }
};

export const loginUserAction = async (email: string, password: string) => {
  if(!isEmail(email) || !isRequiredLength(password)) {
    return;
  }

  const user = await checkUser(email, password);

  if(user?.password && compare_bcrypt(password, user.password)){
    return { email: user.email, ...getTokens(user.id) };
  }
}

export const checkUser = async (email: string, password: string) => {
  const { state } = apiker.requestParams;
  if(!isEmail(email) || !isRequiredLength(password)) {
    return;
  }

  /**
   * Check if user exists
   */
  const userId = await state(OBN.EMAILTOUUID, email).get(email);

  if(!userId) {
    return;
  }

  /**
   * Check user
   */
  const user = await state(OBN.USERS, userId).get(userId) as User;

  if(user?.password && compare_bcrypt(password, user.password)){
    return user;
  }
}
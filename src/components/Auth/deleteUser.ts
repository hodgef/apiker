import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res_200, res_400 } from "../Response";
import { extractToken, parseJWT } from "./utils";

export const deleteUser: Handler = async ({ headers, state }) => {
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
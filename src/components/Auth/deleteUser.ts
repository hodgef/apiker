import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res_200, res_400 } from "../Response";
import { StateFn } from "../State";
import { User } from "./interfaces";
import { getCurrentUser } from "./utils";

export const deleteUser: Handler = async ({ headers, state }) => {
    const user = await getCurrentUser(headers, state);

    if(!user?.id){
      return res_400();
    }
    
    const success = await deleteUserAction(state, user);
  
    if(success){
      return res_200();
    } else {
      return res_400();
    }
};

export const deleteUserAction = async (state: StateFn, user: User) => {
  await state(OBN.EMAILTOUUID).delete(user.email);
  await state(OBN.USERS).delete(user.id);
  return true;
}
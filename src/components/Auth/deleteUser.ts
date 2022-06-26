import { apiker } from "../Apiker";
import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res_200, res_400 } from "../Response";
import { User } from "./interfaces";
import { getCurrentUser } from "./utils";

export const deleteUser: Handler = async ({ state }) => {
    const user = await getCurrentUser();

    if(!user?.id){
      return res_400();
    }
    
    const success = await deleteUserAction(user);
  
    if(success){
      return res_200();
    } else {
      return res_400();
    }
};

export const deleteUserAction = async (user: User) => {
  const { state } = apiker.requestParams;
  await state(OBN.EMAILTOUUID, user.email).delete(user.email);
  await state(OBN.USERS, user.id).delete(user.id);
  return true;
}
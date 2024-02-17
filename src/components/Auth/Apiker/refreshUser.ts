import { Handler } from "../../Request";
import { res, res_400 } from "../../Response";
import { getCurrentUser, getTokens } from "./utils";

export const refreshUser: Handler = async () => {
  const user = await getCurrentUser();

  if(user?.id){
    return res(getTokens(user.id));
  } else {
    return res_400();
  }
};
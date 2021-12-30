import { Handler } from "../Request";
import { res, res_400 } from "../Response";
import { getCurrentUser, getTokens } from "./utils";

export const refreshUser: Handler = async ({ headers, state }) => {
  const user = await getCurrentUser(headers, state);

  if(user?.id){
    return res(getTokens(user.id));
  } else {
    return res_400();
  }
};
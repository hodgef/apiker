import { Handler } from '../../Request';
import { checkUser, getCurrentUser, getTokens, isUserAdmin, registerUserAction, User } from '../../Auth';
import { OBN } from '../../ObjectBase';
import cookie from "cookie";
import { apiker } from '../../Apiker';
import { addLogEntry } from '../../Logging';
import { ADMIN_LOGIN_PREFIX } from '../constants';
import { res_200, res_401 } from '../../Response';

export const loginEndpoint: Handler = async (params) => {
  const { state, body } = params;
  const { email, password } = body || {};
  let user: User | undefined;

  /**
   * If there's an user, it's a login, otherwise it's a registration
   */
  if(email && password){
    const adminIds = await state(OBN.COMMON).get("adminIds");
    const hasAdmins = !!adminIds?.length;

    if(hasAdmins) {
      user = await checkUser(email, password);
    } else {
      user = await registerUserAction(email, password, { role: "admin" });
    }

    if(user && await isUserAdmin(user.id)){
      const { token } = getTokens(user?.id, 60);
      apiker.responseHeaders.set('Set-Cookie', cookie.serialize('apikerToken', `Bearer ${token}`, {
        sameSite: true,
        httpOnly: true,
        secure: true,
        maxAge: 3600 // 1hr
      }));

      /**
       * Add log entry
       */
      await addLogEntry(ADMIN_LOGIN_PREFIX);
    }
  } else {
    user = await getCurrentUser();
  }

  if(!user){
    return res_401();
  }

  if(!await isUserAdmin(user.id)){
    return res_401();
  }

  return res_200();
}
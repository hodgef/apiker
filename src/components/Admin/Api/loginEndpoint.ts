import { Handler } from '../../Request';
import { addAdminId, checkUser, getCurrentUser, getTokens, isUserAdmin, registerUserAction, User } from '../../Auth';
import { OBN } from '../../ObjectBase';
import cookie from "cookie";
import { apiker } from '../../Apiker';
import { addLogEntry } from '../../Logging';
import { ADMIN_LOGIN_PREFIX } from '../constants';
import { res_200, res_401 } from '../../Response';

/**
 * Creates the account as an admin, or grants admin to one that already exists.
 *
 * Promoting an existing account still requires that account's own password, so
 * holding the setup secret cannot take over somebody else's account.
 */
const provisionAdmin = async (email: string, password: string): Promise<User | undefined> => {
  const created = await registerUserAction(email, password, { role: "admin" });

  if(created){
    return created;
  }

  const existing = await checkUser(email, password);

  if(existing){
    await addAdminId(existing.id);
  }

  return existing;
};

export const loginEndpoint: Handler = async (params) => {
  const { state, body } = params;
  const { email, password, setupSecret } = body || {};
  let user: User | undefined;

  /**
   * If there's an user, it's a login, otherwise it's a registration
   */
  if(email && password){
    const adminIds = await state(OBN.COMMON).get("adminIds");
    const hasAdmins = !!adminIds?.length;
    const expectedSecret = apiker.env.ADMP_SETUP_SECRET;
    const provisioning = !!expectedSecret && setupSecret === expectedSecret;

    if(provisioning) {
      /**
       * The setup secret exists only in the deployment's environment, so it is
       * also the way back in if every admin credential is lost.
       */
      user = await provisionAdmin(email, password);
    } else if(hasAdmins) {
      user = await checkUser(email, password);
    } else {
      /**
       * Claiming the first admin account is unauthenticated by nature, so it is
       * only possible with the setup secret. Without that, anyone reaching the
       * panel of a fresh deployment could claim it.
       */
      return res_401();
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
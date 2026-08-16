import { addAdminId, registerUserAction, User } from '../../Auth';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res_200, res_400 } from '../../Response';
import { isEmail } from '../../Validation';

/**
 * Grants admin rights to an account, creating it when the email is unknown.
 *
 * Reachable only through `adminMiddleware`, so an existing admin is the sole way to
 * create another one once the panel is set up. Promoting an existing account keeps
 * its current password; a new account uses the password given in the request.
 *
 * @param body.email Email of the account to grant admin rights to.
 * @param body.password Password for the account, used only when it does not exist yet.
 * @returns `200` with `promoted` or `created`, `400` for an invalid email.
 */
export const createAdminEndpoint: Handler = async ({ state, body }) => {
  const { email, password } = body || {};

  if(!isEmail(email)){
    return res_400();
  }

  const userId = await state(OBN.EMAILTOUUID, email).get(email);

  if(userId){
    const user = await state(OBN.USERS, userId).get(userId) as User;

    if(!user){
      return res_400();
    }

    await addAdminId(user.id);
    return res_200({ promoted: true });
  }

  const created = await registerUserAction(email, password, { role: "admin" });

  return created ? res_200({ created: true }) : res_400();
};

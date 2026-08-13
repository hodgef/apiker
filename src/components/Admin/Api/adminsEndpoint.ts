import { addAdminId, registerUserAction, User } from '../../Auth';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res_200, res_400 } from '../../Response';
import { isEmail } from '../../Validation';

/**
 * Grants admin rights. Reachable only through `adminMiddleware`, so an existing
 * admin is the sole way to create another one once the panel is set up.
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

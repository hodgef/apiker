import { forgotUserAction } from '../../Auth';
import { verifyUserAction } from '../../Auth/Apiker/verifyUser';
import { Handler } from '../../Request';
import { res_400 } from '../../Response';

export const sendEmailEndpoint: Handler = async ({ body }) => {
  const { userEmail, template } = body || {};

  if(!userEmail || !template){
    return res_400();
  }

  let actionResult: Response | undefined;
  if(template === "forgotPassword"){
    actionResult = await forgotUserAction(userEmail);

  } else if(template === "verifyAccount"){
    actionResult = await verifyUserAction(userEmail);

  } else {
    return res_400();
  }

  return actionResult ? actionResult : res_400();
}
import { apiker } from '../../Apiker';
import { User } from '../../Auth';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res_200, res_400, res_401, res_404, res_500 } from '../../Response';
import { isEmail } from '../../Validation';

export const updateUserEndpoint: Handler = async ({ state, body, request }) => {
  let userEmail: string = "";

  if(request.method === "GET"){
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    userEmail = params.get("userEmail") || "";

  } else if(request.method === "POST"){
    userEmail = body?.userEmail || "";

  } else {
    return res_400();
  }

  if(!isEmail(userEmail)) {
    return res_400();
  }

  /** Check if user exists */
  const userId = await state(OBN.EMAILTOUUID, userEmail).get(userEmail);

  if(!userId) {
    return res_400();
  }

  const user = await state(OBN.USERS, userId).get(userId) as User;

  if(!user){
    return res_404();
  }

  let updatedFields: { email?: string } = {};
  if(request.method === "POST"){
    /** Do not allow user update of admin, unless same user */
    if(user?.email !== userEmail && user?.role === "admin"){
      return res_401();
    }

    const { email } = body?.updatedUser ? JSON.parse(body.updatedUser) : {} as User;

    if(apiker.debug){
      console.log("updatedUser", JSON.parse(body.updatedUser));
      console.log("Current Email", user.email);
      console.log("New Email", email);
    }

    /** The actual fields that will be updated */
    if(email && email !== user.email){
      updatedFields["email"] = email;
      const formEmailDelete = await state(OBN.EMAILTOUUID, userEmail).deleteAll();
      const userEmailDelete = await state(OBN.EMAILTOUUID, user.email).deleteAll();
      const newUserEmailPut = await state(OBN.EMAILTOUUID, email).put({ [email]: user.id });

      if(apiker.debug){
        console.log("formEmailDelete", formEmailDelete);
        console.log("userEmailDelete", userEmailDelete);
        console.log("newUserEmailPut", newUserEmailPut);
      }
      
    }

    if(Object.keys(updatedFields).length){
      const newUser = { ...user, ...updatedFields };

      /** Displayed field */
      const newUserPut = await state(OBN.USERS, user.id).put({ [user.id]: newUser });

      console.log("newUserPut", newUserPut);
    }
  }

  let returnObj: any;
  if(request.method === "POST"){
    returnObj = {
      updatedFields: Object.keys(updatedFields)
    }
  } else if (request.method === "GET"){
    const savedUser = await state(OBN.USERS, userId).get(userId) as User;

    if(!savedUser){
      return res_500();
    }

    const partialUser = {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    }

    returnObj = {
      partialUser
    }
  }

  return res_200({ ...returnObj, success: true });
}
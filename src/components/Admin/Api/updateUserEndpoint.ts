import { apiker } from '../../Apiker';
import { User } from '../../Auth';
import { unbanEntity } from '../../Bans';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res_200, res_400, res_401, res_404, res_500 } from '../../Response';
import { isEmail } from '../../Validation';

export const updateUserEndpoint: Handler = async ({ state, body, request }) => {
  let userEmail: string = "";
  let userId = "";
  let user: User | null = null;
  let returnObj = {};

  if(request.method === "GET"){
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    userEmail = params.get("userEmail") || "";

  } else if(request.method === "PUT" || request.method === "DELETE"){
    userEmail = body?.userEmail || "";

  } else {
    return res_400();
  }

  if(!isEmail(userEmail)) {
    return res_400();
  }

  if(request.method === "GET" || request.method === "PUT" || request.method === "DELETE"){
      /** Check if user exists */
    userId = await state(OBN.EMAILTOUUID, userEmail).get(userEmail);

    if(!userId) {
      return res_400();
    }

    user = await state(OBN.USERS, userId).get(userId) as User;

    if(!user){
      return res_404();
    }
  }

  let updatedFields: { email?: string } = {};
  if(request.method === "PUT"){
    /** Do not allow user update of admin, unless same user */
    if(user?.email !== userEmail && user?.role === "admin"){
      return res_401();
    }

    const { email } = body?.updatedUser ? JSON.parse(body.updatedUser) : {} as User;

    if(apiker.debug){
      console.log("updatedUser", JSON.parse(body.updatedUser));
      console.log("Current Email", user!.email);
      console.log("New Email", email);
    }

    /** The actual fields that will be updated */
    if(email && email !== user!.email){
      updatedFields["email"] = email;
      const formEmailDelete = await state(OBN.EMAILTOUUID, userEmail).deleteAll();
      const userEmailDelete = await state(OBN.EMAILTOUUID, user!.email).deleteAll();
      const newUserEmailPut = await state(OBN.EMAILTOUUID, email).put({ [email]: user!.id });

      if(apiker.debug){
        console.log("formEmailDelete", formEmailDelete);
        console.log("userEmailDelete", userEmailDelete);
        console.log("newUserEmailPut", newUserEmailPut);
      }
    }

    if(Object.keys(updatedFields).length){
      const newUser = { ...user, ...updatedFields };

      /** Displayed field */
      const newUserPut = await state(OBN.USERS, user!.id).put({ [user!.id]: newUser });

      if(apiker.debug){
        console.log("newUserPut", newUserPut);
      }
    }
  }

  if(request.method === "PUT"){
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
      role: savedUser.role,
      verified: savedUser.verified || false
    }

    returnObj = {
      partialUser
    }
  } else if(request.method === "DELETE"){
    const formEmailDelete = await state(OBN.EMAILTOUUID, userEmail).deleteAll();
    const userEmailDelete = await state(OBN.EMAILTOUUID, user!.email).deleteAll();
    const userDelete = await state(OBN.USERS, user!.id).deleteAll();
    const formEmailUnban = await unbanEntity(userEmail);
    const userEmailUnban = await unbanEntity(user!.email);
    const userIdUnban = await unbanEntity(user!.id);

    if(apiker.debug){
      console.log("formEmailDelete", formEmailDelete);
      console.log("userEmailDelete", userEmailDelete);
      console.log("userDelete", userDelete);
      console.log("formEmailUnban", formEmailUnban);
      console.log("userEmailUnban", userEmailUnban);
      console.log("userIdUnban", userIdUnban);
    }
  }

  return res_200({ ...returnObj, success: true });
}
import { apiker } from "../Apiker";
import { sendEmail } from "../Email";
import { EmailActor } from "../Email/interfaces";
import { verifyAccountTemplate, verifyAccountSuccessTemplate } from "../EmailTemplates";
import { OBN } from "../ObjectBase";
import { Handler } from "../Request";
import { res_200, res_400, res_401 } from "../Response";
import { isEmail } from "../Validation";
import { User } from "./interfaces";
import { extractToken, getCurrentUser, getTokens, hash_bcrypt, randomHash_SHA1 } from "./utils";

export const verifyUser: Handler = async () => {
  const user = await getCurrentUser();

  if(!user?.id){
    return res_401();
  }

  const res = await verifyUserAction(user.email);

  if(res){
    return res;
  } else {
    return res_400();
  }
}

export const verifyUserAction = async (email: string) => {
  const { state } = apiker.requestParams;
  const emailTitle = `${apiker.name} - Verify User`;

  if(!isEmail(email)) {
    return;
  }

  if(!apiker.env.APIKER_ROOT_URL){
    throw new Error("env.APIKER_ROOT_URL is undefined. Please consult the documentation");
  }

  /**
   * Check if user exists
   */
  const currentUserId = await state(OBN.EMAILTOUUID, email).get(email);

  if(!currentUserId) {
    return;
  }

  /**
   * Create an auth token that will expire in 5 minutes
   */
  const { token: tempToken } = getTokens(currentUserId, 40);

  const recipients: EmailActor[] = [
    {
      name: `${apiker.name} User`,
      email
    }
  ];

  /**
   * Verify url
   */
  const activateUrl = `${apiker.env.APIKER_ROOT_URL}/auth/verify/action?t=${encodeURIComponent(tempToken)}`;
  const template = verifyAccountTemplate.replace("{activateUrl}", activateUrl).replace("{appName}", apiker.name);
  const result = await sendEmail(emailTitle, template, recipients);
  return result;
}

/**
 * Verify user action
 */
export const verifyUserProcess: Handler = async ({ state, request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const emailTitle = `${apiker.name} - Account Verified`;
  const authParam = params.get("t");

  if(!authParam){
    return res_400();
  }

  /** We need to ensure that the token utilized was the token passed in the "t" param */
  const authToken = extractToken();

  if(authToken !== authParam){
    return res_400("Token mismatch");
  }

  /** Get current user **Without Client ID Check!** */
  const user = await getCurrentUser(true);

  if(!user?.id){
    return res_401();
  }

  /** Verify account */
  const updatedUser: User = {
    ...user,
    verified: true,
    updatedAt: Date.now()
  };

  const id = user.id;

  /** Update user */
  await state(OBN.USERS, id).put({ [id]: updatedUser });

  const recipients: EmailActor[] = [
    {
      name: `${apiker.name} User`,
      email: user.email
    }
  ];

  const template = verifyAccountSuccessTemplate.replace("{appName}", apiker.name);

  /**
   * Return an email with the user's new password
   */
  await sendEmail(emailTitle, template, recipients);
  return res_200();
};

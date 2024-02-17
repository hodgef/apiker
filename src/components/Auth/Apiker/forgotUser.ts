import { apiker } from "../../Apiker";
import { sendEmail } from "../../Email";
import { EmailActor } from "../../Email/interfaces";
import { forgotPasswordTemplate, newPasswordTemplate } from "../../EmailTemplates";
import { OBN } from "../../ObjectBase";
import { Handler } from "../../Request";
import { res_200, res_400, res_401, res_500 } from "../../Response";
import { isEmail } from "../../Validation";
import { User } from "./interfaces";
import { extractToken, getCurrentUser, getTokens, hash_bcrypt, randomHash_SHA1 } from "./utils";

export const forgotUser: Handler = async () => {
  const user = await getCurrentUser();

  if(!user?.id){
    return res_401();
  }

  const res = await forgotUserAction(user.email);

  if(res){
    return res;
  } else {
    return res_400();
  }
}

export const forgotUserAction = async (email: string) => {
  const { state } = apiker.requestParams;
  const emailTitle = `${apiker.name} - Forgot Password`;

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
  const { token: resetToken } = getTokens(currentUserId, 5);

  const recipients: EmailActor[] = [
    {
      name: `${apiker.name} User`,
      email
    }
  ];

  /**
   * Reset url
   */
  const resetUrl = `${apiker.env.APIKER_ROOT_URL}/auth/forgot/reset?t=${encodeURIComponent(resetToken)}`;
  const template = forgotPasswordTemplate.replace("{resetUrl}", resetUrl);
  const result = await sendEmail(emailTitle, template, recipients);
  return result;
}

/**
 * Forgot user reset action
 */
export const forgotUserReset: Handler = async ({ state, request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const emailTitle = `${apiker.name} - New Password`;
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

  /** Reset password */
  const newPassword = randomHash_SHA1().substring(0, 10);

  if(newPassword?.length < 10){
    return res_500();
  }

  const signedPassword = hash_bcrypt(newPassword);

  const updatedUser: User = {
    ...user,
    password: signedPassword,
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

  const template = newPasswordTemplate.replace("{newPassword}", newPassword);

  /**
   * Return an email with the user's new password
   */
  await sendEmail(emailTitle, template, recipients);
  return res_200();
};

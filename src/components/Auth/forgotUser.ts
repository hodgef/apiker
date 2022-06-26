import { apiker } from "../Apiker";
import { sendEmail } from "../Email";
import { EmailActor } from "../Email/interfaces";
import { forgotPasswordTemplate } from "../EmailTemplates";
import { OBN } from "../ObjectBase";
import { isEmail } from "../Validation";
import { getTokens } from "./utils";

export const forgotUserAction = async (
  email: string,
  resetUrl: string,
  emailTitle = `${apiker.name} - Forgot Password`,
  renderTemplate = forgotPasswordTemplate
) => {
  const { state } = apiker.requestParams;

  if(!isEmail(email)) {
    return;
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

  await sendEmail(emailTitle, renderTemplate({ resetUrl, resetToken }), recipients);
  return true;
}

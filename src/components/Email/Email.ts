import { apiker } from "../Apiker";
import { isEmail } from "../Validation";
import { EMAIL_API_ENDPOINT } from "./constants";
import { EmailActor } from "./interfaces";

export const sendEmail = async (
  subject: string,
  content: string,
  to: EmailActor[] = [],
  sender: EmailActor = {
    name:  apiker.email?.name || apiker.name,
    email: apiker.email?.senderEmail || ""
  }
) => {
    if(
      // Email option not active
      !apiker.email ||

      // No API key
      !apiker.env.SENDINBLUE_API_KEY ||

      // No receipients
      !to.length ||

      // Invalid emails
      !(isEmail(sender.email) && to.every(item => isEmail(item.email))) ||

      // Invalid sender name
      !sender.name
    ){
      return;
    }

    const response = await fetch(EMAIL_API_ENDPOINT, {
      body: JSON.stringify({
        subject,
        sender,
        to,
        htmlContent: content
      }),
      headers: {
        'api-key': apiker.env.SENDINBLUE_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      method: 'POST',
    });

    return response;
  }
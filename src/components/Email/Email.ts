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
      !apiker.env.BREVO_API_KEY ||

      // No receipients
      !to.length ||

      // Invalid emails
      !(isEmail(sender.email) && to.every(item => isEmail(item.email))) ||

      // Invalid sender name
      !sender.name
    ){
      return;
    }

    const bodyParams = {
      subject,
      sender,
      to,
      htmlContent: content
    };

    const response = await fetch(EMAIL_API_ENDPOINT, {
      body: JSON.stringify(bodyParams),
      headers: {
        'api-key': apiker.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      method: 'POST',
    });

    if(apiker.debug){
      console.log("bodyParams", bodyParams);
      console.log("response", response);
    }

    return response;
  }
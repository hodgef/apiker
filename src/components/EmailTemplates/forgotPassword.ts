import { wrapEmailTemplate } from "./EmailTemplates";
import { EmailTemplate } from "./interfaces";

export const forgotPasswordTemplate: EmailTemplate = ({ resetUrl, resetToken }) => {
    return wrapEmailTemplate("Email Reset", `
        <p>
        If you received this email, it means that you've used the Reset Password feature. If so,
        click the following link to proceed:
        </p>
        <p>
        <a href="${resetUrl}?t=${encodeURIComponent(resetToken)}">Reset User Email</a>
        </p>
        <p>
        If you have not initiated this request, please disregard this message.
        </p>
    `);
}
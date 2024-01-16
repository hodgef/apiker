export const forgotPasswordTemplate = `<html>
        <head></head>
        <body>
            <h1>Email Reset</h1>
            <div>
                <p>If you received this email, it means that you've used the Reset Password feature. If so, click the following link to proceed:</p>
                <p><a href="{resetUrl}">Reset User Email</a></p>
                <p>If you have not initiated this request, please disregard this message. The link will expire in 5 minutes.</p>
            </div>
        </body>
    </html>`;

export const newPasswordTemplate = `<html>
    <head></head>
    <body>
        <h1>New Password</h1>
        <div>
            <p>Your password has been reset successfully.</p>
            <p><b>New password</b>: {newPassword}</p>
            <p>If you have not initiated this request, please reach out to support.</p>
        </div>
    </body>
</html>`;

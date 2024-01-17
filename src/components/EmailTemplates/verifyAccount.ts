export const verifyAccountTemplate = `<html>
        <head></head>
        <body>
            <h1>Verify Account</h1>
            <div>
                <p>If you received this email, it means that you've created an account at {appName}. If so, click the following link to activate your account:</p>
                <p><a href="{activateUrl}">Activate account</a></p>
                <p>If you have not initiated this request, please disregard this message. The link will expire in 5 minutes.</p>
            </div>
        </body>
    </html>`;

export const verifyAccountSuccessTemplate = `<html>
    <head></head>
    <body>
        <h1>Account verified</h1>
        <div>
            <p>You have verified your account at {appName}.</p>
            <p>Have a great day!</p>
        </div>
    </body>
</html>`;
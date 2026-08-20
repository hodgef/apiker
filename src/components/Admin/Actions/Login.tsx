import React from "react";
import { LoginPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { authActions } from "../constants";
import { Alert, Button, Field, Form, Input } from "../ui";

export const Login: React.FC<LoginPageProps> = (props) => {
    const { isSetup, pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onSubmit = () => {
        const formData = new FormData();

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        fetch('/admp/login', {
            method: 'post',
            body: formData,
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r =>  r.json().then(res => ({status: r.status, body: res})))
            .then(data => {
                const { status, body } = data;
                const isSucessful = status === 200;

                const action = isSucessful ? undefined : props.action;
                const message = isSucessful ? "Sucess! You can now select a new action" : "Failure returned by the endpoint.";

                setProps({
                    ...props,
                    action,
                    actions: authActions,
                    /**
                     * A signed-out page's props never update on their own, so without
                     * these the panel keeps rendering the login screen (and any
                     * privileged action would 401 on the stale, sub-less token) until
                     * the next full reload.
                     */
                    ...(isSucessful ? { isAdminLoggedIn: true, isSetup: false, csrfToken: body?.csrfToken || csrfToken } : {}),
                    dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message }
                });
            })
            .catch(error => {
                setProps({
                    ...props,
                    dialog: { className: "alert-danger", message: error?.message }
                });
            })
    };

    return (
        <div className="admp-action">
            {isSetup && (
                <Alert>Welcome to Apiker. Set up your account to manage this app.</Alert>
            )}
            <Form onSubmit={onSubmit}>
                <Field label="Email" htmlFor="email">
                    <Input id="email" type="email" placeholder="you@example.com" autoComplete="username" />
                </Field>
                <Field label="Password" htmlFor="password">
                    <Input id="password" type="password" autoComplete="current-password" />
                </Field>
                {isSetup && (
                    <Field
                        label="Setup secret"
                        htmlFor="setupSecret"
                        hint="The ADMP_SETUP_SECRET value configured for this deployment."
                    >
                        <Input id="setupSecret" type="password" autoComplete="off" />
                    </Field>
                )}
                <Button type="submit" block>{isSetup ? "Create admin account" : "Sign in"}</Button>
            </Form>
        </div>
    );
}
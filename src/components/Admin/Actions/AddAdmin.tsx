import React from "react";
import { AddAdminPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Alert, Button, Field, Form, Input } from "../ui";

export const AddAdmin: React.FC<AddAdminPageProps> = (props) => {
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onSubmit = () => {
        const formData = new FormData();

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        fetch('/admp/admins', {
            method: 'post',
            body: formData,
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r =>  r.json().then(res => ({status: r.status, body: res})))
            .then(data => {
                const { status } = data;
                const isSucessful = status === 200;

                const message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";

                setProps({
                    ...props,
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
            <Alert>
                Admins have full access to this panel. Existing accounts are promoted and keep their
                current password.
            </Alert>
            <Form onSubmit={onSubmit}>
                <Field label="Email" htmlFor="email">
                    <Input id="email" type="email" placeholder="admin@example.com" autoComplete="off" />
                </Field>
                <Field label="Password" htmlFor="password" hint="Only used when the account does not exist yet.">
                    <Input id="password" type="password" autoComplete="new-password" />
                </Field>
                <Button type="submit">Grant admin</Button>
            </Form>
        </div>
    );
}

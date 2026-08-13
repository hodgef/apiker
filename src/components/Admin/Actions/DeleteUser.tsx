import React from "react";
import { DeleteUserPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Button, Field, Form, Input } from "../ui";

export const DeleteUser: React.FC<DeleteUserPageProps> = (props) => {
    const [shouldAskConfirm, setShouldAskConfirm] = React.useState(false);
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onSubmit = () => {
        const userEmail = (document.getElementById("userEmail") as HTMLInputElement)?.value;
        if(!userEmail.trim()){
            setProps({
                ...props,
                dialog: { className: "alert-danger", message: "You must provide the user email" }
            });
            return;
        }

        if(!shouldAskConfirm || !isConfirmed){
            setShouldAskConfirm(true);
            return;
        }

        const formData = new FormData();

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        fetch('/admp/user', {
            method: 'delete',
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
            <Form onSubmit={onSubmit}>
                <Field label="User email" htmlFor="userEmail" hint="The account and its data are removed permanently.">
                    <Input id="userEmail" type="email" placeholder="user@example.com" />
                </Field>

                {(isConfirmed || !shouldAskConfirm) ? (
                    <Button type="submit" variant="destructive">Delete user</Button>
                ) : (
                    <Button type="button" variant="destructive" onClick={() => setIsConfirmed(true)}>
                        Are you sure? This cannot be undone
                    </Button>
                )}
            </Form>
        </div>
    );
}
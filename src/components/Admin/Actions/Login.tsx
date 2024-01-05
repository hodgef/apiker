import React from "react";
import { LoginPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { authActions } from "../constants";

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
                const { status } = data;
                const isSucessful = status === 200;

                const action = isSucessful ? undefined : props.action;
                const message = isSucessful ? "Sucess! You can now select a new action" : "Failure returned by the endpoint.";

                setProps({
                    ...props,
                    action,
                    actions: authActions,
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
        <div className="action-wrapper">
            {isSetup && (
                <div className="alert alert-primary mb-0" role="alert">
                    Welcome to Apiker! Please setup your account in order to manage your app.
                </div>
            )}
            <form className="login-form" onSubmit={onSubmit}>
                <input className="form-control form-control-lg mt-2" id="email" type="email" placeholder="Email" />
                <input className="form-control form-control-lg mt-2" id="password" type="password" placeholder="Password" />
                <button className="btn btn-primary mt-2 action-btn" type="submit">{isSetup ? "Setup User" : "Submit"}</button>
            </form>
        </div>
    );
}
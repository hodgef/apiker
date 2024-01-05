import React from "react";
import { UnbanUserPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";

export const UnbanUser: React.FC<UnbanUserPageProps> = (props) => {
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onSubmit = () => {
        const formData = new FormData();

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        fetch('/admp/bans', {
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
        <div className="action-wrapper">
            <form className="login-form" onSubmit={onSubmit}>
                <input className="form-control form-control-lg mt-2" id="userId" type="text" placeholder="User ID" />
                <button className="btn btn-primary mt-2 action-btn" type="submit">Submit</button>
            </form>
        </div>
    );
}
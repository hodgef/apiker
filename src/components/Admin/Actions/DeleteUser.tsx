import React from "react";
import { DeleteUserPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";

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
        <div className="action-wrapper">
            <form className="login-form" onSubmit={onSubmit}>
                <input className="form-control form-control-lg mt-2" id="userEmail" type="text" placeholder="User Email" />

                {(isConfirmed || !shouldAskConfirm) ? (
                    <button className="btn btn-primary mt-2 action-btn" type="submit">Submit</button>
                ): (
                    <button className="btn btn-danger mt-2 action-btn" type="button" onClick={() => { setIsConfirmed(true)} }>Are you sure? This cannot be undone</button>
                )}
            </form>
        </div>
    );
}
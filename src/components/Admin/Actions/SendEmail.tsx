import React from "react";
import { SendEmailPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { forgotPasswordTemplate } from "../../EmailTemplates";

export const emailTemplates = {
    forgotPassword: forgotPasswordTemplate
}

export const SendEmail: React.FC<SendEmailPageProps> = (props) => {
    const [template, setTemplate] = React.useState<string>();
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onDropdownItemClick = (selectedTemplate: string) => {
        setTemplate(selectedTemplate);
    }

    const onSubmit = () => {
        const formData = new FormData() as any;

        if(!template){
            return;
        }

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        formData.append("template", template);

        fetch('/admp/email', {
            method: 'post',
            body: formData,
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r =>  r.json().then(res => ({status: r.status, body: res})))
            .then(data => {
                const { status } = data;
                const isSucessful = status === 200 || status === 201;

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

    const selectTemplateDropdown = (
        <div className="btn-group mt-2">
            <button className="btn btn-transparent btn-lg dropdown-toggle action-dropdown" type="button" id="main-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                {template ? template : "Email template"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="main-dropdown">
                {Object.keys(emailTemplates).map((templateName) => {
                    return (
                        <li key={templateName}><a className="dropdown-item" href="#" onClick={() => onDropdownItemClick(templateName)}>{templateName}</a></li>
                    )
                })}
            </ul>
        </div>
    )

    return (
        <div className="action-wrapper">
            <div className="alert alert-warning mb-0" role="alert">
                <b>Note:</b> This option requires the "email" and "authRoutes" options to be enabled.
            </div>
            <form className="login-form" onSubmit={onSubmit}>
                <input className="form-control form-control-lg mt-2" id="userEmail" type="email" placeholder="User Email" />
                {selectTemplateDropdown}
                {template ? (
                    <pre className="m-0 mt-2">
                        <code>{emailTemplates[template]}</code>
                    </pre>
                ): null}
                <button className="btn btn-primary mt-2 action-btn" type="submit">Submit</button>
            </form>
        </div>
    );
}
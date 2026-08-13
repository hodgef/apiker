import React from "react";
import { SendEmailPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { forgotPasswordTemplate, verifyAccountTemplate } from "../../EmailTemplates";
import { Alert, Button, Field, Form, Input, Select } from "../ui";

export const emailTemplates = {
    forgotPassword: forgotPasswordTemplate,
    verifyAccount: verifyAccountTemplate
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
        <Select
            value={template ? { id: template, displayName: template } : undefined}
            options={Object.keys(emailTemplates).map((templateName) => ({ id: templateName, displayName: templateName }))}
            placeholder="Select a template"
            onSelect={(option) => onDropdownItemClick(option.id)}
        />
    )

    return (
        <div className="admp-action">
            <Alert tone="warning">
                <b>Note:</b> This option requires the "email" and "authRoutes" options to be enabled.
            </Alert>
            <Form onSubmit={onSubmit}>
                <Field label="User email" htmlFor="userEmail">
                    <Input id="userEmail" type="email" placeholder="user@example.com" />
                </Field>
                <Field label="Template">
                    {selectTemplateDropdown}
                </Field>
                {template ? (
                    <pre className="admp-pre"><code>{emailTemplates[template]}</code></pre>
                ) : null}
                <Button type="submit" disabled={!template}>Send email</Button>
            </Form>
        </div>
    );
}
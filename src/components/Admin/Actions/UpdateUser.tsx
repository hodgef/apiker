import React from "react";
import { UpdateUserPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Button, Field, Form, InlineRow, Input, Textarea } from "../ui";

export const UpdateUser: React.FC<UpdateUserPageProps> = (props) => {
    const initialValue = React.useRef("");
    const [ partialUser, setPartialUser ] = React.useState<string>("");
    const [ userEmail, setUserEmail ] = React.useState<string>("");
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onUserSeek = () => {
        if(!userEmail.includes("@")){
            setProps({
                ...props,
                dialog: {
                    className: "alert-danger",
                    message: "Accounts are found by email address, not by the request ids shown elsewhere in the panel."
                }
            });
            return;
        }

        fetch('/admp/user?' + new URLSearchParams({ userEmail }), {
            method: 'get',
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r =>  r.json().then(res => ({status: r.status, body: res})))
            .then(data => {
                const { status, body: { partialUser: bodyPartialUser } = {} } = data;
                const isSucessful = status === 200;

                if(!isSucessful){
                    setProps({
                        ...props,
                        dialog: { className: "alert-danger", message: "User not found!" }
                    });
                } else {
                    if(bodyPartialUser){
                        const stringifiedPartialUser = JSON.stringify(bodyPartialUser);
                        trySetPartialUser(stringifiedPartialUser, (output: string) => {
                            initialValue.current = output;
                        });

                        setProps({
                            ...props,
                            dialog: { className: "alert-primary", message: "Action performed successfully" }
                        });
                    } else {
                        setProps({
                            ...props,
                            dialog: { className: "alert-danger", message: "Endpoint error" }
                        });
                    }
                }
            })
            .catch(error => {
                setProps({
                    ...props,
                    dialog: { className: "alert-danger", message: error?.message }
                });
            })
    }

    const onSubmit = () => {
        if(!userEmail.trim()){
            setProps({
                ...props,
                dialog: { className: "alert-danger", message: "You must provide the user email" }
            });
            return;
        }

        if(!initialValue.current || !partialUser || (initialValue.current === partialUser)){
            setProps({
                ...props,
                dialog: { className: "alert-danger", message: "Please fill out the fields correctly" }
            });
            return;
        }

        const formData = new FormData() as any;

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            formData.append(key, input.value);
        });

        formData.append("updatedUser", partialUser);

        fetch('/admp/user', {
            method: 'put',
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

    const trySetPartialUser = (inputPartialUser: string, callback?: any) => {
        let parsedValue;
        try {
            parsedValue = JSON.parse(inputPartialUser);
        } catch (e){}

        if(parsedValue) {
            const stringifiedPartialUser = JSON.stringify(parsedValue);
            setPartialUser(stringifiedPartialUser);

            if(callback){
                callback(stringifiedPartialUser);
            }
        }
    }

    return (
        <div className="admp-action">
            <Form onSubmit={onSubmit}>
                <Field label="User email" htmlFor="userEmail" hint="Accounts are found by email address. Find one first, then edit the record below.">
                    <InlineRow>
                        <Input
                            id="userEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={userEmail}
                            onChange={e => setUserEmail(e.target.value)}
                        />
                        <Button variant="secondary" onClick={onUserSeek}>Find</Button>
                    </InlineRow>
                </Field>
                {partialUser ? (
                    <Field label="User record" htmlFor="partialUser">
                        <Textarea
                            id="partialUser"
                            spellCheck={false}
                            onChange={e => trySetPartialUser(e.target.value)}
                            value={JSON.stringify(JSON.parse(partialUser), null, 2)}
                        />
                    </Field>
                ) : null}
                <Button type="submit" disabled={!partialUser}>Save changes</Button>
            </Form>
        </div>
    );
}
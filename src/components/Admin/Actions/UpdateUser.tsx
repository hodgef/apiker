import React from "react";
import { UpdateUserPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";

const InputGroup = ({ onButtonClick, onChange, buttonLabel, value }) => {
    React.useEffect(() => {
        const handleInputWidth = () => {
            const inputElem = document.querySelector("#input-group-1 input") as HTMLElement;
            const buttonElem = document.querySelector("#input-group-1 button") as HTMLElement;
            const offsetWidth = parseFloat(buttonElem.offsetWidth as unknown as string);
            inputElem.style.maxWidth = `calc(100% - ${offsetWidth}px - 15px)`;
        }

        (window as any).addEventListener("resize", handleInputWidth);
        handleInputWidth();
    }, []);

    return (
        <div className="input-group mt-2" id="input-group-1">
            <input className="form-control form-control-lg" id="userEmail" type="email" placeholder="User Email" onChange={onChange} value={value}/>
            <button className="btn btn-outline-secondary" type="button" onClick={onButtonClick}>{buttonLabel}</button>
        </div>
    );
}

export const UpdateUser: React.FC<UpdateUserPageProps> = (props) => {
    const initialValue = React.useRef("");
    const [ partialUser, setPartialUser ] = React.useState<string>("");
    const [ userEmail, setUserEmail ] = React.useState<string>("");
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);

    const onUserSeek = () => {
        console.log("onUserEmailChange", userEmail);

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

                console.log(data);
            })
            .catch(error => {
                console.log(error);
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

    console.log("partialUser", partialUser);

    return (
        <div className="action-wrapper">
            <form className="login-form" onSubmit={onSubmit}>
                <InputGroup value={userEmail} onButtonClick={onUserSeek} onChange={e => setUserEmail(e.target.value)} buttonLabel={"Find"} />
                {partialUser ? (
                    <textarea className="m-0 mt-2" onChange={e => trySetPartialUser(e.target.value)} value={JSON.stringify(JSON.parse(partialUser), null, 2)} />
                ): null}
                <button className="btn btn-primary mt-2 action-btn" type="submit">Submit</button>
            </form>
        </div>
    );
}
import React from "react";
import { LogResults, SearchBansPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";

export const SearchBans: React.FC<SearchBansPageProps> = (props) => {
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const [results, setResults] = React.useState<LogResults[]>([]);

    const onSubmit = () => {
        const data = {} as { userId: string };

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            data[key] = input.value;
        });

        if (!data.userId) {
            setProps({
                ...props,
                dialog: { className: "alert-danger", message: "You must provide an user id" }
            });
        }

        fetch(`/admp/bans/${data.userId}`, {
            method: 'get',
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r => r.json().then(res => ({ status: r.status, body: res })))
            .then(data => {
                const { status, body = {} } = data;
                const { entries = [] } = body;
                const isSucessful = status === 200;

                const mappedEntries = entries.map(({ time, id, clientId, countryCode, pathname, issuedBy }) => ({
                    time, id, clientId, countryCode, pathname, issuedBy
                })) as LogResults[];

                const message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";

                setProps({
                    ...props,
                    dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message }
                });

                setResults(mappedEntries);
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
            {(results && results.length) ? results.map(({ time, id, clientId, countryCode, pathname, issuedBy }) => (
                <div className="results-container">
                    <div className="results-item">
                        <ul>
                            <li><span className="title">time</span> <span className="text" title={new Date(time as string).toLocaleString()}>{new Date(time as string).toLocaleString()}</span></li>
                            <li><span className="title">id</span> <span className="text" title={id}>{id}</span></li>
                            <li><span className="title">clientId</span> <span className="text" title={clientId}>{clientId}</span></li>
                            <li><span className="title">countryCode</span> <span className="text" title={countryCode}>{countryCode}</span></li>
                            <li><span className="title">pathname</span> <span className="text" title={pathname}>{pathname}</span></li>
                            <li><span className="title">issuedBy</span> <span className="text" title={issuedBy}>{issuedBy}</span></li>
                        </ul>
                    </div>
                </div>
            )) : null}
        </div>
    );
}
import React from "react";
import { LogResults, ListLogsPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";

export const ListLogs: React.FC<ListLogsPageProps> = (props) => {
    const { pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const [results, setResults] = React.useState<LogResults[]>([]);

    const onSubmit = () => {
        const data = {} as { logId: string };

        Array.from(document.querySelectorAll("input")).forEach(input => {
            const key = input.getAttribute("id") as string;
            data[key] = input.value;
        });

        if (!data.logId) {
            setProps({
                ...props,
                dialog: { className: "alert-danger", message: "You must provide a log id" }
            });
        }

        fetch(`/admp/logs?logId=${data.logId}`, {
            method: 'get',
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r => r.json().then(res => ({ status: r.status, body: res })))
            .then(data => {
                const { status, body = {} } = data;
                const { entries = [] } = body;
                const isSucessful = status === 200;

                const message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";

                setProps({
                    ...props,
                    dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message }
                });

                setResults(entries);
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
                <input className="form-control form-control-lg mt-2" id="logId" type="text" placeholder="Log ID" />
                <button className="btn btn-primary mt-2 action-btn" type="submit">Submit</button>
            </form>
            {(results && results.length) ? results.map((result) => (
                <div className="results-container">
                    <div className="results-item">
                        <ul>
                            {Object.keys(result).map((key) => (
                                <li><span className="title">{key}</span> <span className="text" title={key === "time" ? new Date(result[key] as string).toLocaleString() : result[key]}>
                                    {key === "time" ? new Date(result[key] as string).toLocaleString() : result[key]}
                                </span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )) : null}
        </div>
    );
}
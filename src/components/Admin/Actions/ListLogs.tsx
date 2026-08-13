import React from "react";
import { LogResults, ListLogsPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Button, DataList, Field, Form, Input } from "../ui";

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

                setResults(entries.map(({ time, id, clientId, countryCode, pathname, issuedBy }) => ({
                    time, id, clientId, countryCode, pathname, issuedBy
                })) as LogResults[]);
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
                <Field label="Log ID" htmlFor="logId">
                    <Input id="logId" type="text" placeholder="Log ID" />
                </Field>
                <Button type="submit">List logs</Button>
            </Form>
            {!!results?.length && (
                <DataList
                    rows={results.map((result) => ({
                        ...result,
                        time: result.time ? new Date(result.time).toLocaleString() : result.time
                    })) as any}
                />
            )}
        </div>
    );
}
import React from "react";
import { LogResults, SearchBansPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Button, DataList, Field, Form, Input } from "../ui";

export const SearchBans: React.FC<SearchBansPageProps> = (props) => {
    const { pageName = "", csrfToken = "", presetValue } = props;
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
        <div className="admp-action">
            <Form onSubmit={onSubmit}>
                <Field label="User ID" htmlFor="userId">
                    <Input id="userId" type="text" placeholder="User ID" defaultValue={presetValue} />
                </Field>
                <Button type="submit">Search bans</Button>
            </Form>
            {!!results?.length && <DataList rows={results as any} />}
        </div>
    );
}
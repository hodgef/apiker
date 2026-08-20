import React from "react";
import { AdminPanelPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Alert, Button, DataList, Field, InlineRow, Input } from "../ui";

interface RateLimitEntry {
    time?: number;
    type?: string;
    pathname?: string;
    countryCode?: string;
}

export interface RateLimitHistoryPageProps extends AdminPanelPageProps {}

const formatTime = (time?: number) => (time ? new Date(time).toLocaleString() : "");

/** Every counter one identity has ever tripped or added to, newest first. */
export const RateLimitHistory: React.FC<RateLimitHistoryPageProps> = (props) => {
    const { pageName = "", csrfToken = "", presetValue = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const [identityInput, setIdentityInput] = React.useState(presetValue);
    const [identity, setIdentity] = React.useState(presetValue);
    const [entries, setEntries] = React.useState<RateLimitEntry[]>([]);
    const [loading, setLoading] = React.useState(false);

    const load = React.useCallback((who: string) => {
        if (!who) {
            setEntries([]);
            return;
        }

        setLoading(true);

        fetch(`/admp/ratelimit?identity=${encodeURIComponent(who)}`, {
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
            .then(body => setEntries(body?.entries || []))
            .catch(error => setProps({
                ...props,
                dialog: { className: "alert-danger", message: error?.message }
            }))
            .finally(() => setLoading(false));
    }, [csrfToken]);

    React.useEffect(() => { load(identity); }, [load, identity]);

    return (
        <div className="admp-action">
            <Field
                label="Identity"
                htmlFor="rateLimitIdentity"
                hint="A request identity (signed IP), to see every counter it has added to."
            >
                <InlineRow>
                    <Input
                        id="rateLimitIdentity"
                        placeholder="Request identity"
                        value={identityInput}
                        onChange={e => setIdentityInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") setIdentity(identityInput); }}
                    />
                    <Button onClick={() => setIdentity(identityInput)}>Filter</Button>
                </InlineRow>
            </Field>

            {identity && (
                <Alert tone="info" onDismiss={() => { setIdentityInput(""); setIdentity(""); }}>
                    Showing every counter <strong>{identity}</strong> has added to.
                </Alert>
            )}

            {identity && <Button variant="secondary" onClick={() => load(identity)}>Refresh</Button>}

            {entries.length ? (
                <DataList
                    rows={entries.map(({ time, type, pathname, countryCode }) => ({
                        time: formatTime(time),
                        counter: type,
                        path: pathname,
                        country: countryCode
                    }))}
                />
            ) : (
                <p className="admp-empty">
                    {!identity ? "Enter an identity to see its counters." : loading ? "Loading..." : "Nothing counted for this identity."}
                </p>
            )}
        </div>
    );
};

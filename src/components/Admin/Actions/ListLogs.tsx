import React from "react";
import { LogResults, ListLogsPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Alert, Button, DataList, Field, InlineRow, Input, Select } from "../ui";

const ALL_LOGS = "__all";

interface LogId {
    id: string;
    count: number;
}

interface SweepResponse {
    available?: boolean;
    missing?: string[];
    error?: string;
    deleted?: number;
    indexed?: number;
    nextCursor?: string | null;
}

export const ListLogs: React.FC<ListLogsPageProps> = (props) => {
    const { pageName = "", csrfToken = "", presetValue = "", presetFilter = "logId" } = props;
    const { setProps } = getAppHelper(pageName);
    const preset = presetFilter === "identity" ? "" : presetValue;
    const presetIdentity = presetFilter === "identity" ? presetValue : "";
    const [results, setResults] = React.useState<LogResults[]>([]);
    const [logIds, setLogIds] = React.useState<LogId[]>([]);
    const [selected, setSelected] = React.useState(preset || ALL_LOGS);
    const [identity, setIdentity] = React.useState(presetIdentity);
    const [identityInput, setIdentityInput] = React.useState(presetIdentity);
    const [notice, setNotice] = React.useState<string>();
    const [sweeping, setSweeping] = React.useState<string>();
    const [sweepNeeded, setSweepNeeded] = React.useState(false);

    const load = React.useCallback((logId: string, who = "", catalogueOnly = false) => {
        const query = [
            logId === ALL_LOGS ? "" : `logId=${encodeURIComponent(logId)}`,
            who ? `identity=${encodeURIComponent(who)}` : ""
        ].filter(Boolean).join("&");

        fetch(`/admp/logs${query ? `?${query}` : ""}`, { headers: { "X-Apiker-Csrf": csrfToken } })
            .then(r => r.json().then(res => ({ status: r.status, body: res })))
            .then(({ status, body = {} as any }) => {
                if(status !== 200){
                    setProps({
                        ...props,
                        dialog: { className: "alert-danger", message: "Failure returned by the endpoint." }
                    });
                    return;
                }

                if(body.logIds){
                    setLogIds(body.logIds);
                    setSweepNeeded(!!body.sweepNeeded);
                }

                if(catalogueOnly){
                    return;
                }

                setNotice(
                    body.truncated
                        ? body.logIds
                            ? `Only the newest ${body.limit} entries were scanned, so this list of logs may be incomplete.`
                            : `Showing the newest ${body.limit} entries of this log.`
                        : undefined
                );

                setResults((body.entries || []).map(({ time, id, userId, clientId, countryCode, pathname, issuedBy }) => ({
                    time: time ? new Date(time).toLocaleString() : time,
                    id, userId, clientId, countryCode, pathname, issuedBy
                })) as LogResults[]);
            })
            .catch(error => {
                setProps({
                    ...props,
                    dialog: { className: "alert-danger", message: error?.message }
                });
            })
    }, [csrfToken]);

    /**
     * A filtered read returns no catalogue, so the ids are fetched too — otherwise
     * an event opened from the dashboard would land on an empty log selector.
     */
    React.useEffect(() => {
        load(preset || ALL_LOGS, presetIdentity);

        if(preset || presetIdentity){
            load(ALL_LOGS, "", true);
        }
    }, [load, preset, presetIdentity]);

    /** Walks the whole namespace: entries older than the index, and callers who never came back. */
    const sweep = (after = "", deleted = 0, indexed = 0) => {
        setSweeping(after ? `Swept ${indexed} entries so far...` : "Starting...");

        fetch(`/admp/logs${after ? `?after=${encodeURIComponent(after)}` : ""}`, {
            method: "post",
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r => r.json())
            .then((body: SweepResponse) => {
                if(!body.available){
                    setSweeping(undefined);
                    setProps({
                        ...props,
                        dialog: {
                            className: "alert-danger",
                            message: body.missing?.length
                                ? `Sweeping needs ${body.missing.join(", ")} set for this deployment.`
                                : body.error || "Sweeping failed."
                        }
                    });
                    return;
                }

                const removed = deleted + (body.deleted || 0);
                const kept = indexed + (body.indexed || 0);

                if(body.nextCursor){
                    sweep(body.nextCursor, removed, kept);
                    return;
                }

                setSweeping(undefined);
                setProps({
                    ...props,
                    dialog: {
                        className: "alert-primary",
                        message: `Indexed ${kept} entries and removed ${removed} past retention`
                    }
                });
                load(selected, identity);
            })
            .catch(error => {
                setSweeping(undefined);
                setProps({ ...props, dialog: { className: "alert-danger", message: error?.message } });
            });
    };

    const options = [
        { id: ALL_LOGS, displayName: "All logs" },
        ...logIds.map(({ id, count }) => ({ id, displayName: `${id} (${count})` }))
    ];

    return (
        <div className="admp-action">
            <Field label="Log" hint="Every log recorded by this deployment, most recently active first.">
                <Select
                    value={options.find(option => option.id === selected)}
                    options={options}
                    placeholder="Select a log"
                    onSelect={(option) => { setSelected(option.id); load(option.id, identity); }}
                />
            </Field>

            <Field
                label="Identity"
                htmlFor="logIdentity"
                hint="A request identity or a user id, to follow one caller across every log."
            >
                <InlineRow>
                    <Input
                        id="logIdentity"
                        placeholder="Request identity or user id"
                        value={identityInput}
                        onChange={e => setIdentityInput(e.target.value)}
                        onKeyDown={e => {
                            if(e.key === "Enter"){
                                setIdentity(identityInput);
                                load(selected, identityInput);
                            }
                        }}
                    />
                    <Button onClick={() => { setIdentity(identityInput); load(selected, identityInput); }}>
                        Filter
                    </Button>
                    {identity && (
                        <Button
                            variant="secondary"
                            onClick={() => { setIdentityInput(""); setIdentity(""); load(selected); }}
                        >
                            Clear
                        </Button>
                    )}
                </InlineRow>
            </Field>

            {identity && (
                <Alert tone="info" onDismiss={() => { setIdentityInput(""); setIdentity(""); load(selected); }}>
                    Showing what <strong>{identity}</strong> did
                    {selected === ALL_LOGS ? ", across every log." : `, in ${selected}.`}
                </Alert>
            )}

            <InlineRow>
                <Button variant="secondary" onClick={() => load(selected, identity)}>Refresh</Button>
                {sweepNeeded && (
                    <Button variant="secondary" onClick={() => sweep()} disabled={!!sweeping}>
                        {sweeping || "Sweep older logs"}
                    </Button>
                )}
            </InlineRow>
            {sweepNeeded && (
                <p className="admp-hint">
                    Sweeping walks every log object: it indexes entries recorded before this panel
                    could list them and drops what is past retention.
                </p>
            )}
            {notice && <Alert tone="warning">{notice}</Alert>}
            {results?.length ? (
                <DataList rows={results as any} />
            ) : (
                <p className="admp-empty">
                    {identity ? "Nothing recorded for this identity." : "No entries recorded for this log."}
                </p>
            )}
        </div>
    );
}
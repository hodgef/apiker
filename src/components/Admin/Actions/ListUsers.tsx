import React from "react";
import { ListUsersPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Alert, Button, DataList, Field, InlineRow, Input } from "../ui";

interface UserRow {
    id?: string;
    email?: string;
    role?: string;
    verified?: boolean;
    createdAt?: number;
}

interface UsersResponse {
    users?: UserRow[];
    cursor?: string | null;
    query?: string;
    role?: string;
}

interface RebuildResponse {
    available?: boolean;
    missing?: string[];
    error?: string;
    indexed?: number;
    instances?: number;
    read?: number;
    nextOffset?: number | null;
}

export const ListUsers: React.FC<ListUsersPageProps> = (props) => {
    const { pageName = "", csrfToken = "", presetValue = "", presetFilter = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const presetRole = presetFilter === "role" ? presetValue : "";
    const presetQuery = presetFilter === "role" ? "" : presetValue;
    const [users, setUsers] = React.useState<UserRow[]>([]);
    const [cursor, setCursor] = React.useState<string | null>(null);
    const [query, setQuery] = React.useState(presetQuery);
    const [searched, setSearched] = React.useState("");
    const [role, setRole] = React.useState(presetRole);
    const [loaded, setLoaded] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [rebuilding, setRebuilding] = React.useState<string>();

    const fail = (message?: string) =>
        setProps({ ...props, dialog: { className: "alert-danger", message: message || "Request failed" } });

    const load = React.useCallback((from?: string | null, search = "", onlyRole = "") => {
        setLoading(true);

        const params = onlyRole
            ? `?role=${encodeURIComponent(onlyRole)}`
            : search.trim()
                ? `?q=${encodeURIComponent(search.trim())}`
                : from ? `?cursor=${encodeURIComponent(from)}` : "";

        fetch(`/admp/users${params}`, { headers: { "X-Apiker-Csrf": csrfToken } })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Listing failed (${r.status})`))))
            .then((body: UsersResponse) => {
                setUsers(current => (from ? [...current, ...(body.users || [])] : body.users || []));
                setCursor(body.cursor || null);
                setSearched(body.query || "");
                setRole(body.role || "");
                setLoaded(true);
            })
            .catch(error => fail(error?.message))
            .finally(() => setLoading(false));
    }, [csrfToken]);

    /** Opened from the dashboard: land on that user, or on the admins. */
    React.useEffect(() => { load(undefined, presetQuery, presetRole); }, [load, presetQuery, presetRole]);

    /** Walks the whole namespace so accounts predating the directory get listed too. */
    const importExisting = (offset = 0, total = 0) => {
        setRebuilding(offset ? `Imported ${total} so far…` : "Starting…");

        fetch(`/admp/users${offset ? `?offset=${offset}` : ""}`, {
            method: "post",
            headers: { "X-Apiker-Csrf": csrfToken }
        })
            .then(r => r.json())
            .then((body: RebuildResponse) => {
                if(!body.available){
                    setRebuilding(undefined);
                    fail(body.missing?.length
                        ? `Importing needs ${body.missing.join(", ")} set for this deployment.`
                        : body.error);
                    return;
                }

                const indexed = total + (body.indexed || 0);

                if(body.nextOffset){
                    importExisting(body.nextOffset, indexed);
                    return;
                }

                setRebuilding(undefined);
                setProps({
                    ...props,
                    dialog: { className: "alert-primary", message: `Imported ${indexed} accounts` }
                });
                load();
            })
            .catch(error => {
                setRebuilding(undefined);
                fail(error?.message);
            });
    };

    if(!loaded){
        return <p className="admp-empty">Loading…</p>;
    }

    const rows = users.map(({ email, id, role, verified, createdAt }) => ({
        email,
        id,
        role: role || "user",
        verified: verified ? "yes" : "no",
        created: createdAt ? new Date(createdAt).toLocaleString() : ""
    }));

    return (
        <div className="admp-action">
            <Field label="Search" htmlFor="userSearch" hint="An email, the start of one, or a user id.">
                <InlineRow>
                    <Input
                        id="userSearch"
                        type="text"
                        placeholder="user@example.com"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if(e.key === "Enter") load(null, query); }}
                    />
                    <Button onClick={() => load(null, query)} disabled={loading}>Search</Button>
                    {searched || role ? (
                        <Button variant="secondary" onClick={() => { setQuery(""); load(); }} disabled={loading}>
                            Clear
                        </Button>
                    ) : null}
                </InlineRow>
            </Field>
            {role === "admin" && (
                <Alert tone="info" onDismiss={() => { setQuery(""); load(); }}>
                    Showing the accounts with panel access.
                </Alert>
            )}
            <p className="admp-hint">
                {role === "admin"
                    ? `${rows.length} admin${rows.length === 1 ? "" : "s"}, newest first.`
                    : searched
                        ? `${rows.length} account${rows.length === 1 ? "" : "s"} matching "${searched}".`
                        : `${rows.length} account${rows.length === 1 ? "" : "s"}, newest first. Reading a page costs the same whether this deployment has ten accounts or a million.`}
            </p>
            {rebuilding && <Alert>{rebuilding}</Alert>}
            {rows.length ? (
                <DataList rows={rows as any} />
            ) : (
                <p className="admp-empty">
                    {role === "admin"
                        ? "No account holds admin rights."
                        : searched
                            ? "No account matches that."
                            : "No accounts listed. Accounts created before this panel kept a directory have to be imported once."}
                </p>
            )}
            <InlineRow>
                {cursor ? (
                    <Button onClick={() => load(cursor)} disabled={loading}>
                        {loading ? "Loading…" : "Load more"}
                    </Button>
                ) : null}
                <Button variant="secondary" onClick={() => load(null, searched, role)} disabled={loading}>Refresh</Button>
                {/* A one-off migration, so it is only offered when there is nothing to list. */}
                {!rows.length && !searched && !role ? (
                    <Button variant="ghost" onClick={() => importExisting()} disabled={!!rebuilding}>
                        Import existing accounts
                    </Button>
                ) : null}
            </InlineRow>
        </div>
    );
}

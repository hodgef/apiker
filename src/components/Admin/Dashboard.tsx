import React from "react";
import { Action, Actions, AdminPanelPageProps } from "./interfaces";
import { getAppHelper } from "./Utils";
import { Button, Icon, Menu, Tooltip } from "./ui";
import { Trend } from "./Actions/Beacons";

interface DashboardEvent {
    propertyName?: string;
    type?: string;
    time?: number;
    id?: string;
    userId?: string;
    clientId?: string;
    countryCode?: string;
    pathname?: string;
    issuedBy?: string;
}

interface OverviewData {
    deployment: {
        name?: string;
        objectVersion?: string;
        debug?: boolean;
        authRoutes?: boolean;
        email?: boolean;
        firewall?: { limitRequestsPerMinute?: number } | null;
        objects?: string[];
        routes?: string[];
        adminCount?: number;
        protections?: Record<string, boolean>;
    };
    totals: Record<string, number>;
    events: DashboardEvent[];
    bans: DashboardEvent[];
    rateLimit: DashboardEvent[];
    eventsTrend: { days: string[]; values: number[] };
}

const PROTECTION_LABELS: Record<string, string> = {
    setupSecret: "Setup secret",
    ipWhitelist: "Admin IP allowlist",
    ispWhitelist: "Admin ISP allowlist",
    cityWhitelist: "Admin city allowlist",
    cloudflareWaf: "Cloudflare WAF key"
};

const formatTime = (time?: number) =>
    time
        ? new Date(time).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
          })
        : "—";

const Stat: React.FC<{
    label: string;
    value: React.ReactNode;
    hint?: string;
    tone?: "default" | "warning";
    onSelect?: () => void;
    selectLabel?: string;
}> = ({ label, value, hint, tone = "default", onSelect, selectLabel }) => {
    const className = `admp-stat${tone === "warning" ? " admp-stat--warning" : ""}${onSelect ? " admp-stat--action" : ""}`;
    const body = (
        <>
            <span className="admp-stat__label">{label}</span>
            <span className="admp-stat__value">{value}</span>
            {hint && <span className="admp-stat__hint">{hint}</span>}
        </>
    );

    if (!onSelect) {
        return <div className={className}>{body}</div>;
    }

    return (
        <Tooltip label={selectLabel || label}>
            <button type="button" className={className} onClick={onSelect}>
                {body}
            </button>
        </Tooltip>
    );
};

const Panel: React.FC<{ id?: string; title: string; description?: string; children: React.ReactNode }> = ({
    id,
    title,
    description,
    children
}) => (
    <section className="admp-panel" id={id}>
        <header className="admp-panel__header">
            <h2>{title}</h2>
            {description && <p>{description}</p>}
        </header>
        {children}
    </section>
);

/** The bans and rate limit counters are already on this page, so the stat leads to them. */
const scrollToPanel = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

interface DashboardProps extends AdminPanelPageProps {
    actions: Actions;
    onSelect: (action: Action, presetValue?: string, presetFilter?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    const { actions, onSelect, pageName = "", csrfToken = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const [data, setData] = React.useState<OverviewData>();
    const [error, setError] = React.useState<string>();

    const load = React.useCallback(() => {
        fetch("/admp/overview", { headers: { "X-Apiker-Csrf": csrfToken } })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Overview failed (${r.status})`))))
            .then(setData)
            .catch((e) => setError(e?.message));
    }, [csrfToken]);

    React.useEffect(load, [load]);

    const actionById = (id: string) => actions.find((action) => action.id === id) as Action;

    const unban = (userId?: string) => {
        if (!userId) return;

        const formData = new FormData();
        formData.append("userId", userId);

        fetch("/admp/bans", { method: "delete", body: formData, headers: { "X-Apiker-Csrf": csrfToken } })
            .then((r) => {
                setProps({
                    ...props,
                    dialog: {
                        className: r.ok ? "alert-primary" : "alert-danger",
                        message: r.ok ? "Unbanned" : "Failure returned by the endpoint."
                    }
                });
                load();
            })
            .catch((e) => setProps({ ...props, dialog: { className: "alert-danger", message: e?.message } }));
    };

    if (error) {
        return <p className="admp-empty">{error}</p>;
    }

    if (!data) {
        return <p className="admp-empty">Loading…</p>;
    }

    const { deployment, totals } = data;
    const missingProtections = Object.entries(deployment.protections || {}).filter(([, enabled]) => !enabled);

    return (
        <div className="admp-dashboard">
            <div className="admp-stats">
                <Stat
                    label="Events today"
                    value={totals.eventsToday}
                    hint={`${totals.events} recorded`}
                    onSelect={() => onSelect(actionById("listLogs"))}
                    selectLabel="Browse every log"
                />
                <Stat
                    label="Active bans"
                    value={totals.bans}
                    hint={`${totals.bansToday} today`}
                    tone={totals.bansToday ? "warning" : "default"}
                    onSelect={() => scrollToPanel("admp-panel-bans")}
                    selectLabel="Show the bans below"
                />
                <Stat
                    label="Counted requests"
                    value={totals.countedLastHour}
                    hint="last hour, toward rate limits"
                    onSelect={data.rateLimit.length ? () => scrollToPanel("admp-panel-ratelimit") : undefined}
                    selectLabel="Show the counters below"
                />
                <Stat
                    label="Admins"
                    value={totals.admins}
                    hint="with panel access"
                    onSelect={() => onSelect(actionById("listUsers"), "admin", "role")}
                    selectLabel="Show the admin accounts"
                />
            </div>

            <Panel title="Events trend" description="Recorded events per day, over the last week.">
                <Trend days={data.eventsTrend.days} values={data.eventsTrend.values} />
            </Panel>

            <Panel title="Latest events" description="Newest first, across every logged prefix. Select an event to open its log.">
                {data.events.length ? (
                    <div className="admp-table">
                        {data.events.map((event) => (
                            <div className="admp-table__row" key={event.propertyName}>
                                <Tooltip label={`Everything this identity did, starting with ${event.type}`}>
                                    <button
                                        type="button"
                                        className="admp-tag admp-tag--action"
                                        onClick={() => onSelect(actionById("listLogs"), event.id, "identity")}
                                    >
                                        {event.type}
                                    </button>
                                </Tooltip>
                                <span className="admp-table__time">{formatTime(event.time)}</span>
                                <span className="admp-table__main" title={event.pathname}>{event.pathname}</span>
                                <span className="admp-table__meta">{event.countryCode}</span>
                                <Tooltip label="Request identity: a hash of the caller's IP">
                                    <span className="admp-table__id">{event.id}</span>
                                </Tooltip>
                                <span className="admp-table__actions">
                                    <Menu
                                        items={[
                                            {
                                                id: "activity",
                                                label: "Follow this identity",
                                                description: "Every log entry this caller produced.",
                                                onSelect: () => onSelect(actionById("listLogs"), event.id, "identity")
                                            },
                                            {
                                                id: "logs",
                                                label: `Open the ${event.type} log`,
                                                description: "Every entry recorded under this prefix, by anyone.",
                                                onSelect: () => onSelect(actionById("listLogs"), event.type, "logId")
                                            },
                                            ...(event.userId ? [{
                                                id: "user",
                                                label: "Show the account",
                                                description: `Signed in as ${event.userId}`,
                                                onSelect: () => onSelect(actionById("listUsers"), event.userId)
                                            }] : []),
                                            {
                                                id: "searchBans",
                                                label: "Review bans",
                                                description: "Ban entries recorded for this request identity.",
                                                onSelect: () => onSelect(actionById("searchBans"), event.id)
                                            },
                                            {
                                                id: "ban",
                                                label: "Ban this identity",
                                                description: "Blocks it from reaching the API.",
                                                destructive: true,
                                                onSelect: () => onSelect(actionById("banUser"), event.id)
                                            }
                                        ]}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="admp-empty">No events recorded yet.</p>
                )}
            </Panel>

            <Panel id="admp-panel-bans" title="Bans" description="Request identities currently blocked from reaching the API.">
                {data.bans.length ? (
                    <div className="admp-table">
                        {data.bans.map((ban) => (
                            <div className="admp-table__row" key={ban.propertyName}>
                                <span className="admp-table__time">{formatTime(ban.time)}</span>
                                <Tooltip label="Request identity: a hash of the caller's IP">
                                    <span className="admp-table__main">{ban.id}</span>
                                </Tooltip>
                                <span className="admp-table__meta">{ban.countryCode}</span>
                                <span className="admp-table__id" title={ban.issuedBy}>
                                    {ban.issuedBy ? `by ${ban.issuedBy}` : ""}
                                </span>
                                <span className="admp-table__actions">
                                    <Menu
                                        items={[
                                            {
                                                id: "activity",
                                                label: "Follow this identity",
                                                description: "Every log entry this caller produced.",
                                                onSelect: () => onSelect(actionById("listLogs"), ban.id, "identity")
                                            },
                                            {
                                                id: "unban",
                                                label: "Lift this ban",
                                                description: "Restores the identity's access immediately.",
                                                onSelect: () => unban(ban.id)
                                            },
                                            {
                                                id: "searchBans",
                                                label: "Review bans",
                                                description: "Ban entries recorded for this request identity.",
                                                onSelect: () => onSelect(actionById("searchBans"), ban.id)
                                            }
                                        ]}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="admp-empty">Nothing is banned.</p>
                )}
            </Panel>

            {!!data.rateLimit.length && (
                <Panel
                    id="admp-panel-ratelimit"
                    title="Rate limit counters"
                    description="Requests counted toward a limit. Refused requests are not recorded."
                >
                    <div className="admp-table">
                        {data.rateLimit.map((entry) => (
                            <div className="admp-table__row" key={entry.propertyName}>
                                <span className="admp-tag">{entry.type}</span>
                                <span className="admp-table__time">{formatTime(entry.time)}</span>
                                <span className="admp-table__main" title={entry.pathname}>{entry.pathname}</span>
                                <Tooltip label="Request identity: a hash of the caller's IP">
                                    <span className="admp-table__id">{entry.id}</span>
                                </Tooltip>
                                <span className="admp-table__actions">
                                    <Menu
                                        items={[
                                            {
                                                id: "rateLimitHistory",
                                                label: "Show this identity's counters",
                                                description: "Every rate-limit entry this identity has added to.",
                                                onSelect: () => onSelect(actionById("rateLimitHistory"), entry.id)
                                            },
                                            {
                                                id: "activity",
                                                label: "Follow this identity",
                                                description: "Every log entry this caller produced.",
                                                onSelect: () => onSelect(actionById("listLogs"), entry.id, "identity")
                                            },
                                            {
                                                id: "ban",
                                                label: "Ban this identity",
                                                description: "Blocks it from reaching the API.",
                                                destructive: true,
                                                onSelect: () => onSelect(actionById("banUser"), entry.id)
                                            }
                                        ]}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}

            <Panel title="Deployment" description="What this worker is running.">
                <dl className="admp-facts">
                    <div><dt>Object version</dt><dd>{deployment.objectVersion}</dd></div>
                    <div><dt>Debug logging</dt><dd>{deployment.debug ? "on" : "off"}</dd></div>
                    <div><dt>Auth routes</dt><dd>{deployment.authRoutes ? "enabled" : "disabled"}</dd></div>
                    <div><dt>Email</dt><dd>{deployment.email ? "configured" : "not configured"}</dd></div>
                    <div>
                        <dt>Firewall</dt>
                        <dd>
                            {deployment.firewall
                                ? `on${
                                      deployment.firewall.limitRequestsPerMinute
                                          ? ` — ${deployment.firewall.limitRequestsPerMinute}/min`
                                          : ""
                                  }`
                                : "off"}
                        </dd>
                    </div>
                    <div><dt>Durable Objects</dt><dd>{(deployment.objects || []).join(", ")}</dd></div>
                    <div><dt>Routes</dt><dd>{(deployment.routes || []).length}</dd></div>
                </dl>

                <div className="admp-posture">
                    {Object.entries(deployment.protections || {}).map(([key, enabled]) => (
                        <span className={`admp-posture__item${enabled ? " is-on" : ""}`} key={key}>
                            <Icon name={enabled ? "check_circle" : "remove_circle_outline"} />
                            {PROTECTION_LABELS[key] || key}
                        </span>
                    ))}
                </div>
                {!!missingProtections.length && (
                    <p className="admp-hint">
                        {missingProtections.length} optional protection
                        {missingProtections.length > 1 ? "s are" : " is"} not configured.
                    </p>
                )}
            </Panel>

            <Panel title="Actions" description="Everything this panel can do.">
                <div className="admp-tiles">
                    {actions.map((action) => (
                        <button type="button" className="admp-tile" key={action.id} onClick={() => onSelect(action)}>
                            <span className="admp-tile__icon"><Icon name={action.icon} /></span>
                            <span className="admp-tile__title">{action.displayName}</span>
                            {action.description && (
                                <span className="admp-tile__description">{action.description}</span>
                            )}
                        </button>
                    ))}
                </div>
            </Panel>
        </div>
    );
};

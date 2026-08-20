import React from "react";
import { BeaconsPageProps } from "../interfaces";
import { getAppHelper } from "../Utils";
import { Alert, Button, DataList, Field, InlineRow, Input, Select } from "../ui";

interface BeaconTotal {
    name: string;
    count: number;
    daily: Record<string, number>;
    countries: Record<string, number>;
}

interface BeaconSample {
    name?: string;
    time?: number;
    pathname?: string;
    countryCode?: string;
    userId?: string;
    props?: Record<string, any>;
}

interface BeaconReport {
    available?: boolean;
    days?: string[];
    totals?: BeaconTotal[];
    samples?: BeaconSample[];
}

const RANGES = [
    { id: "1", displayName: "Today" },
    { id: "7", displayName: "Last 7 days" },
    { id: "30", displayName: "Last 30 days" },
    { id: "90", displayName: "Last 90 days" }
];

const formatTime = (time?: number) => (time ? new Date(time).toLocaleString() : "");

const formatDay = (day: string) =>
    new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });

/** Busiest countries first, as `US 12`, `FR 3`. */
const topCountries = (countries: Record<string, number> = {}) =>
    Object.keys(countries)
        .sort((a, b) => countries[b] - countries[a])
        .slice(0, 4)
        .map((code) => `${code} ${countries[code]}`);

/**
 * The daily series, drawn as an area with its trend line on top.
 *
 * The stroke is kept at its drawn width so the line does not smear when the
 * fixed viewBox is stretched across the card.
 */
export const Trend: React.FC<{ days: string[]; values: number[] }> = ({ days, values }) => {
    if (!days.length) {
        return null;
    }

    const height = 40;
    const headroom = 4;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? 100 / (values.length - 1) : 0;
    const y = (value: number) => (height - (value / max) * (height - headroom)).toFixed(2);

    const line =
        values.length > 1
            ? values.map((value, index) => `${(index * step).toFixed(2)},${y(value)}`).join(" ")
            : `0,${y(values[0])} 100,${y(values[0])}`;

    return (
        <div className="admp-chart">
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-label="Events per day">
                <polygon className="admp-chart__area" points={`0,${height} ${line} 100,${height}`} />
                <polyline className="admp-chart__line" points={line} vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="admp-chart__axis">
                <span>{formatDay(days[0])}</span>
                <span>{`peak ${max}`}</span>
                <span>{formatDay(days[days.length - 1])}</span>
            </div>
        </div>
    );
};

export const Beacons: React.FC<BeaconsPageProps> = (props) => {
    const { pageName = "", csrfToken = "", presetValue = "" } = props;
    const { setProps } = getAppHelper(pageName);
    const [report, setReport] = React.useState<BeaconReport>({});
    const [range, setRange] = React.useState(RANGES[1]);
    const [name, setName] = React.useState(presetValue);
    const [query, setQuery] = React.useState("");
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const load = React.useCallback((days: string, eventName: string, fragment: string) => {
        setLoading(true);

        const params = [
            `days=${encodeURIComponent(days)}`,
            `offset=${new Date().getTimezoneOffset()}`,
            eventName ? `name=${encodeURIComponent(eventName)}` : "",
            fragment ? `q=${encodeURIComponent(fragment)}` : ""
        ].filter(Boolean).join("&");

        fetch(`/admp/beacons?${params}`, { headers: { "X-Apiker-Csrf": csrfToken } })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
            .then((body: BeaconReport) => setReport(body || {}))
            .catch(error => setProps({
                ...props,
                dialog: { className: "alert-danger", message: error?.message }
            }))
            .finally(() => setLoading(false));
    }, [csrfToken]);

    React.useEffect(() => { load(range.id, name, search); }, [load, range.id, name, search]);

    if (report.available === false) {
        return (
            <div className="admp-action">
                <Alert tone="info">
                    This deployment does not record beacons yet. Add <code>"Beacons"</code> to
                    <code> src/objects.json</code> and deploy: apiker registers the object and its
                    migration for you.
                </Alert>
            </div>
        );
    }

    const totals = report.totals || [];
    const samples = report.samples || [];
    const days = report.days || [];
    const selected = name ? totals.find((total) => total.name === name) : undefined;
    const series = days.map((day) =>
        (selected ? [selected] : totals).reduce((sum, total) => sum + (total.daily[day] || 0), 0)
    );

    return (
        <div className="admp-action">
            <Field label="Range" hint="Events are counted by the hour and added up into your days.">
                <Select value={range} options={RANGES} onSelect={setRange} />
            </Field>

            <Field label="Search" hint="Matches part of an event name, such as user or deploy.">
                <InlineRow>
                    <Input
                        value={query}
                        placeholder="Event name"
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Enter") setSearch(query); }}
                    />
                    <Button onClick={() => setSearch(query)}>Search</Button>
                    {(search || name) && (
                        <Button
                            variant="secondary"
                            onClick={() => { setQuery(""); setSearch(""); setName(""); }}
                        >
                            Clear
                        </Button>
                    )}
                </InlineRow>
            </Field>

            {name && (
                <Alert tone="info" onDismiss={() => setName("")}>
                    Showing <strong>{name}</strong> only.
                </Alert>
            )}

            <Trend days={days} values={series} />

            <div className="admp-group">
                <span className="admp-label">Events</span>
                <div className="admp-beacons">
                    {totals.length ? (
                        totals.map((total) => (
                            <div className="admp-beacons__row" key={total.name}>
                                <span className="admp-tag">{total.count}</span>
                                <span className="admp-beacons__name" title={total.name}>{total.name}</span>
                                <span className="admp-beacons__countries">
                                    {topCountries(total.countries).map((entry) => (
                                        <span className="admp-chip" key={entry}>{entry}</span>
                                    ))}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setName(name === total.name ? "" : total.name)}
                                >
                                    {name === total.name ? "Clear" : "Drill down"}
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="admp-empty">
                            {loading ? "Loading..." : "No events recorded in this range."}
                        </p>
                    )}
                </div>
            </div>

            {selected && (
                <div className="admp-group">
                    <span className="admp-label">Per day</span>
                    <DataList
                        rows={days.map((day) => ({ day, events: selected.daily[day] || 0 }))}
                        emptyLabel="Nothing counted in this range."
                    />
                </div>
            )}

            <div className="admp-group">
                <span className="admp-label">Recent events</span>
                <p className="admp-hint">A rotating sample of what was recorded, newest first.</p>
                <DataList
                    rows={samples.map((sample) => ({
                        time: formatTime(sample.time),
                        event: sample.name,
                        path: sample.pathname,
                        country: sample.countryCode,
                        user: sample.userId,
                        ...(sample.props || {})
                    }))}
                    emptyLabel="No samples recorded yet."
                />
            </div>

            <Button variant="secondary" onClick={() => load(range.id, name, search)} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
            </Button>
        </div>
    );
};

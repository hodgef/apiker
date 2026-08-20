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
 * The daily series, drawn as a smooth curve with its area filled underneath.
 *
 * The curve is a Catmull-Rom spline (rendered as cubic Beziers) rather than
 * straight polyline segments, so it reads as one smooth trend instead of
 * sharp, angular joints. Headroom on every side is generous enough to absorb
 * the spline's natural overshoot past its control points, so a steep run
 * never gets clipped by the viewBox.
 */
export const Trend: React.FC<{ days: string[]; values: number[]; showAxis?: boolean }> = ({
    days,
    values,
    showAxis = true
}) => {
    if (!days.length) {
        return null;
    }

    const width = 100;
    const height = 40;
    const padTop = 8;
    const padBottom = 6;
    const max = Math.max(...values, 1);

    const x = (index: number) => (values.length > 1 ? (index * width) / (values.length - 1) : width / 2);
    const y = (value: number) => height - padBottom - (value / max) * (height - padTop - padBottom);

    const points = values.map((value, index) => [x(index), y(value)]);

    /** Catmull-Rom through the points, converted to the cubic Beziers SVG paths use. */
    const smoothPath = (pts: number[][]) => {
        if (pts.length < 2) {
            const [px, py] = pts[0];
            return `M${px},${py} L${px},${py}`;
        }

        let path = `M${pts[0][0]},${pts[0][1]}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] || p2;

            const c1x = p1[0] + (p2[0] - p0[0]) / 6;
            const c1y = p1[1] + (p2[1] - p0[1]) / 6;
            const c2x = p2[0] - (p3[0] - p1[0]) / 6;
            const c2y = p2[1] - (p3[1] - p1[1]) / 6;

            path += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
        }

        return path;
    };

    const linePath = smoothPath(points);
    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L${lastPoint[0]},${height} L${points[0][0]},${height} Z`;

    return (
        <div className="admp-chart">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Events per day">
                <path className="admp-chart__area" d={areaPath} />
                <path className="admp-chart__line" d={linePath} vectorEffect="non-scaling-stroke" />
            </svg>
            {showAxis && (
                <div className="admp-chart__axis">
                    <span>{formatDay(days[0])}</span>
                    <span>{`peak ${max}`}</span>
                    <span>{formatDay(days[days.length - 1])}</span>
                </div>
            )}
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

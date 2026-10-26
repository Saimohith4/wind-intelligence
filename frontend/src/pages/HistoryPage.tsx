import { useMemo, useState } from "react";
import { Database, Download, Search } from "lucide-react";
import type { PageProps } from "../App";
import { exportUrl, type Row } from "../api";
import PageHeader from "../components/PageHeader";
import { formatNumber, formatUtcTime } from "../components/ChartTooltip";

export default function HistoryPage(props: PageProps) {
  const { data, loading, ...controls } = props;
  const [search, setSearch] = useState("");
  const [matchedOnly, setMatchedOnly] = useState(true);
  const rows = useMemo(() => data?.rows.filter(row => {
    const matchesStatus = !matchedOnly || row.status === "matched";
    const query = `${row.startTime} ${row.publishTime ?? ""} ${row.status}`;
    return matchesStatus && query.toLowerCase().includes(search.toLowerCase());
  }) ?? [], [data, matchedOnly, search]);

  return (
    <>
      <PageHeader {...controls} loading={loading} title="Forecast history" subtitle="Trace every selected forecast back to its publication time and compare it with delivered generation." section="TRACEABLE DATA" />
      <section className="panel history">
        <div className="panel-head">
          <div><div className="kicker">01 / TRACEABLE DATA</div><h3>Settlement interval detail</h3><p>Inspect publication time, delivery time and generation.</p></div>
          <a className="secondary" href={exportUrl(controls.start, controls.end)}><Download size={14} /> Export CSV</a>
        </div>
        <div className="table-tools">
          <label className="search"><Search size={14} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search timestamps or status…" /></label>
          <label className="check"><input type="checkbox" checked={matchedOnly} onChange={e => setMatchedOnly(e.target.checked)} /> Matched only</label>
          <span>{rows.length.toLocaleString("en-GB")} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Delivery period (UTC)</th><th>Forecast published (UTC)</th><th>Forecast MW</th><th>Actual MW</th><th>Signed error</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((row: Row) => (
                <tr key={`${row.startTime}-${row.publishTime}`}>
                  <td>{formatUtcTime(row.startTime)}</td>
                  <td>{row.publishTime ? formatUtcTime(row.publishTime) : "—"}</td>
                  <td>{formatNumber(row.forecast_generation)}</td>
                  <td>{formatNumber(row.actual_generation)}</td>
                  <td className={row.error_mw == null ? "" : row.error_mw > 0 ? "positive" : row.error_mw < 0 ? "negative" : ""}>{formatNumber(row.error_mw)}</td>
                  <td><span className={`status ${row.status}`}>{row.status.replace("_", " ")}</span></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="empty-cell">{loading ? "Loading…" : "No records found. Adjust your search."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-end">Showing {rows.length.toLocaleString("en-GB")} filtered records. Scroll within the table to inspect the full result set.</div>
      </section>
      <div className="alert info"><Database size={18} /><p>Publication time is the vintage selected under the configured day-ahead cutoff. The cutoff is a modelling assumption, not a time explicitly prescribed in the challenge brief.</p></div>
    </>
  );
}

import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PageProps } from "../App";
import PageHeader from "../components/PageHeader";
import Kpi from "../components/Kpi";
import ChartTooltip, { formatNumber, formatChartTick } from "../components/ChartTooltip";

export default function AccuracyPage(props: PageProps) {
  const { data, loading, ...controls } = props;
  const [view, setView] = useState<"generation" | "error">("generation");
  const metrics = data?.metrics;
  const chart = useMemo(() => data?.rows.filter(r => r.actual_generation != null || r.forecast_generation != null).map(row => ({
    ...row, label: formatChartTick(row.startTime), actual: row.actual_generation, forecast: row.forecast_generation, error: row.error_mw,
  })) ?? [], [data]);
  const matched = metrics?.matched_intervals ?? 0;
  const over = metrics?.overforecast_intervals ?? 0;
  const under = metrics?.underforecast_intervals ?? 0;

  return (
    <>
      <PageHeader {...controls} loading={loading} title="Forecast accuracy" subtitle="Measure forecast error, bias and the intervals where estimates diverged from delivered generation." section="ACCURACY" />
      <div className="section-title"><div><h2>Accuracy metrics</h2><p>Metrics are calculated from matched hourly delivery intervals.</p></div><span>ALL VALUES IN MW</span></div>
      <section className="kpis">
        <Kpi title="Mean absolute error" value={formatNumber(metrics?.mae_mw)} unit="MW" desc="Typical absolute miss" icon={Activity} tone="mint" />
        <Kpi title="Root mean squared error" value={formatNumber(metrics?.rmse_mw)} unit="MW" desc="Penalizes larger misses" icon={Zap} tone="blue" />
        <Kpi title="Mean forecast bias" value={formatNumber(metrics?.mbe_mw)} unit="MW" desc={metrics?.mbe_mw != null && metrics.mbe_mw > 0 ? "Forecasts tend to run high" : "Signed average error"} icon={metrics?.mbe_mw != null && metrics.mbe_mw < 0 ? ArrowDownRight : ArrowUpRight} tone="violet" />
        <Kpi title="Matched coverage" value={formatNumber(metrics?.coverage_percent)} unit="%" desc={`${formatNumber(matched, 0)} matched intervals`} icon={ShieldCheck} tone="amber" />
      </section>
      <section className="panel">
        <div className="panel-head">
          <div><div className="kicker">01 / ERROR DIAGNOSTICS</div><h3>Forecast performance over time</h3><p>Switch between generation levels and signed forecast error.</p></div>
          <div className="tabs"><button className={view === "generation" ? "chosen" : ""} onClick={() => setView("generation")}>Generation</button><button className={view === "error" ? "chosen" : ""} onClick={() => setView("error")}>Forecast error</button></div>
        </div>
        <div className="chart">
          {loading ? <div className="empty">Loading analysis…</div> : (
            <ResponsiveContainer width="100%" height="100%">
              {view === "generation" ? (
                <LineChart data={chart} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 5" stroke="#263746" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={38} />
                  <YAxis tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} /><Legend />
                  <Line name="Actual" dataKey="actual" stroke="#7ce0ba" strokeWidth={2} dot={false} />
                  <Line name="Forecast" dataKey="forecast" stroke="#8cb4ff" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={chart} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 5" stroke="#263746" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={38} />
                  <YAxis tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area name="Signed error" dataKey="error" stroke="#c1a6ff" fill="#c1a6ff" fillOpacity={0.13} dot={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </section>
      <section className="lower">
        <div className="panel">
          <div className="panel-head"><div><div className="kicker">02 / ERROR DIRECTION</div><h3>Forecasting tendency</h3><p>Distribution of overforecast and underforecast intervals.</p></div></div>
          <div className="bias">
            <div className="bias-row"><span>🟠 &nbsp; Overforecast<small>Forecast above actual</small></span><b>{formatNumber(over, 0)}</b></div>
            <div className="track"><div className="fill over" style={{ width: `${matched ? over / matched * 100 : 0}%` }} /></div>
            <div className="bias-row"><span>🔵 &nbsp; Underforecast<small>Forecast below actual</small></span><b>{formatNumber(under, 0)}</b></div>
            <div className="track"><div className="fill under" style={{ width: `${matched ? under / matched * 100 : 0}%` }} /></div>
            <div className="bias-foot">Matched intervals only <span>{formatNumber(matched, 0)} periods</span></div>
          </div>
        </div>
        <div className="insight"><ShieldCheck size={21} /><div className="kicker">INTERPRETATION</div><h3>Accuracy is more than one number.</h3><p>MAE describes typical error size. RMSE gives more weight to large misses. Bias shows whether forecasts tend to run high or low.</p><hr /><small>Metrics use matched records only.</small></div>
      </section>
    </>
  );
}

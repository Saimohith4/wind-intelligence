import { useMemo } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Database, FileWarning, Gauge, ShieldCheck, Zap } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PageProps } from "../App";
import PageHeader from "../components/PageHeader";
import Kpi from "../components/Kpi";
import ChartTooltip, { formatNumber, formatChartTick } from "../components/ChartTooltip";

export default function OverviewPage(props: PageProps) {
  const { data, loading, error, ...controls } = props;
  const metrics = data?.metrics;
  const chart = useMemo(() => data?.rows.filter(r => r.actual_generation != null || r.forecast_generation != null).map(row => ({
    ...row, label: formatChartTick(row.startTime), actual: row.actual_generation, forecast: row.forecast_generation,
  })) ?? [], [data]);

  return (
    <>
      <PageHeader {...controls} loading={loading} title="Wind intelligence" subtitle="Understand forecast performance before the market opens." />
      {data?.data_available && <div className="alert info"><ShieldCheck /><p>{data.message}</p></div>}
      {!data?.data_available && !loading && !error && <div className="alert warning"><Database /><p>Source datasets are not loaded. Check the FUELHH and WINDFOR files in backend/data.</p></div>}
      <div className="section-title"><div><h2>Performance snapshot</h2><p>Quantifying the gap between expected and delivered wind generation.</p></div><span>ALL VALUES IN MW</span></div>
      <section className="kpis">
        <Kpi title="Mean absolute error" value={formatNumber(metrics?.mae_mw)} unit="MW" desc="Average absolute forecast miss" icon={Activity} tone="mint" />
        <Kpi title="Root mean squared error" value={formatNumber(metrics?.rmse_mw)} unit="MW" desc="Highlights larger misses" icon={Zap} tone="blue" />
        <Kpi title="Mean forecast bias" value={formatNumber(metrics?.mbe_mw)} unit="MW" desc={metrics?.mbe_mw == null ? "Positive = overforecast" : metrics.mbe_mw > 0 ? "Systematic overforecast" : metrics.mbe_mw < 0 ? "Systematic underforecast" : "No net signed bias"} icon={metrics?.mbe_mw != null && metrics.mbe_mw < 0 ? ArrowDownRight : ArrowUpRight} tone="violet" />
        <Kpi title="Matched coverage" value={formatNumber(metrics?.coverage_percent)} unit="%" desc={`${formatNumber(metrics?.matched_intervals, 0)} / ${formatNumber(metrics?.expected_intervals, 0)} intervals`} icon={ShieldCheck} tone="amber" />
      </section>
      <section className="panel">
        <div className="panel-head"><div><div className="kicker">01 / GENERATION PROFILE</div><h3>Forecast vs actual</h3><p>Hourly delivery periods · UTC</p></div></div>
        <div className="chart">
          {loading ? <div className="empty">Loading analysis…</div> : !chart.length ? <div className="empty"><FileWarning />No data available</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 5" stroke="#263746" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={38} />
                <YAxis tick={{ fill: "#8093a5", fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} /><Legend />
                <Line name="Actual" dataKey="actual" stroke="#7ce0ba" strokeWidth={2} dot={false} connectNulls={false} />
                <Line name="Forecast" dataKey="forecast" stroke="#8cb4ff" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="chart-foot"><span><i className="mint-dot" /> Actual generation</span><span><i className="blue-dot" /> Selected day-ahead forecast</span><small>Forecast − actual = signed error</small></div>
      </section>
      <section className="insight overview-insight">
        <Gauge size={21} /><div className="kicker">OVERVIEW</div><h3>Start with the signal, then investigate the detail.</h3>
        <p>The overview summarizes the size and direction of forecast errors. Open Forecast accuracy for error diagnostics, or Forecast history to inspect individual delivery periods and publication times.</p>
      </section>
    </>
  );
}

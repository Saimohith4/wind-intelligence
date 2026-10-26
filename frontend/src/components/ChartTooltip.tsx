export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function formatUtcTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "UTC", timeZoneName: "short",
  });
}

export function formatChartTick(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

export default function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; name: string; color?: string; value?: number | null }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <b>{label}</b>
      {payload.map(item => (
        <div key={item.dataKey}><i style={{ background: item.color }} /> {item.name}: <strong>{formatNumber(item.value)} MW</strong></div>
      ))}
    </div>
  );
}

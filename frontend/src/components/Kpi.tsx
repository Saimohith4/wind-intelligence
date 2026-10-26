import type { LucideIcon } from "lucide-react";

type Props = { title: string; value: string; unit: string; desc: string; icon: LucideIcon; tone: string };

export default function Kpi({ title, value, unit, desc, icon: Icon, tone }: Props) {
  return (
    <article className="kpi">
      <div className="kpi-top">{title}<span className={`kpi-icon ${tone}`}><Icon size={17} /></span></div>
      <div className="kpi-value">{value}<small>{unit}</small></div>
      <div className="muted tiny">{desc}</div>
    </article>
  );
}

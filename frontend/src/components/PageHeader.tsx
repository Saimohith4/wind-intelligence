import { CalendarDays, Search } from "lucide-react";
import type { PageProps } from "../App";

type Props = Pick<PageProps, "start" | "end" | "setStart" | "setEnd" | "analyze" | "loading"> & {
  title: string;
  subtitle: string;
  section?: string;
};

export default function PageHeader({ title, subtitle, section, start, end, setStart, setEnd, analyze, loading }: Props) {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">— &nbsp; UK NATIONAL GENERATION · ELEXON</div>
          <h1>{title}<span>.</span></h1>
          <p>{subtitle}</p>
        </div>
        <div className="window">
          <CalendarDays />
          <div><small>ANALYSIS WINDOW</small><b>{start} — {end}</b></div>
        </div>
      </section>
      <section className="controls">
        <div className="control-label">● &nbsp; ANALYSIS CONTROLS {section ? ` / ${section}` : ""}</div>
        <div className="date-row">
          <label>From <input type="date" min="2026-01-01" max="2026-01-31" value={start} onChange={e => setStart(e.target.value)} /></label>
          <label>To <input type="date" min="2026-01-02" max="2026-02-01" value={end} onChange={e => setEnd(e.target.value)} /></label>
          <button className="primary" disabled={loading || start >= end} onClick={analyze}><Search size={14} /> Analyze</button>
        </div>
      </section>
    </>
  );
}

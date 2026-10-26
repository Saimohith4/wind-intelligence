import { NavLink } from "react-router-dom";
import { Activity, Database, Gauge, ShieldCheck, Wind } from "lucide-react";

type Props = { dataAvailable: boolean };

export default function Sidebar({ dataAvailable }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Wind /></span>
        <div><b>WIND<span>/</span>INTEL</b><small>ENERGY ANALYTICS</small></div>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <NavLink className={({ isActive }) => `nav${isActive ? " active" : ""}`} to="/overview">
        <Gauge size={17} /> Overview <i />
      </NavLink>
      <NavLink className={({ isActive }) => `nav${isActive ? " active" : ""}`} to="/accuracy">
        <Activity size={17} /> Forecast accuracy <i />
      </NavLink>
      <NavLink className={({ isActive }) => `nav${isActive ? " active" : ""}`} to="/history">
        <Database size={17} /> Forecast history <i />
      </NavLink>
      <div className="side-bottom">
        <div className="source-card">
          <span className={`pulse${dataAvailable ? " online" : ""}`} />
          <div><b>Source connection</b><small>{dataAvailable ? "Data loaded" : "Awaiting datasets"}</small></div>
        </div>
        <div className="side-foot"><ShieldCheck size={14} /> Research workspace <span>v1.0</span></div>
      </div>
    </aside>
  );
}

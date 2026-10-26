import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import {
  RefreshCw,
  ShieldCheck,
  Wind,
} from "lucide-react";

import { getOverview, type Overview } from "./api";
import Sidebar from "./components/Sidebar";

import OverviewPage from "./pages/OverviewPage";
import AccuracyPage from "./pages/AccuracyPage";
import HistoryPage from "./pages/HistoryPage";

const FIRST_DAY = "2026-01-01";
const DAY_AFTER_RANGE = "2026-02-01";

export type PageProps = {
  data: Overview | null;
  loading: boolean;
  error: string;
  start: string;
  end: string;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
  analyze: () => void;
};

function Workspace() {
  const [start, setStart] = useState(FIRST_DAY);
  const [end, setEnd] = useState(DAY_AFTER_RANGE);

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function analyze() {
    if (start >= end) {
      setError("The end date must be after the start date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getOverview(start, end);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "API connection failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void analyze();

    // Load the initial analysis when the application mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageProps: PageProps = {
    data,
    loading,
    error,
    start,
    end,
    setStart,
    setEnd,
    analyze,
  };

  return (
    <div className="shell">
      {/* Persistent sidebar with three navigation links */}
      <Sidebar dataAvailable={Boolean(data?.data_available)} />

      <main className="main">
        {/* Shared top navigation */}
        <header className="topbar">
          <div className="crumb">
            Workspace <span>/</span> <b>Wind generation</b>
          </div>

          <div className="top-right">
            <span className="month-pill">
              ● &nbsp; JANUARY 2026
            </span>

            <button
              className="icon-btn"
              onClick={() => void analyze()}
              title="Refresh analysis"
              aria-label="Refresh analysis"
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "spin" : ""}
              />
            </button>

            <span className="avatar">WI</span>
          </div>
        </header>

        {/* Global error message */}
        {error && (
          <div className="alert danger">
            <ShieldCheck size={18} />

            <div>
              <b>Could not load analysis</b>
              <p>{error}</p>
            </div>

            <button onClick={() => void analyze()}>
              Retry
            </button>
          </div>
        )}

        {/* Page navigation */}
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/overview" replace />}
          />

          <Route
            path="/overview"
            element={<OverviewPage {...pageProps} />}
          />

          <Route
            path="/accuracy"
            element={<AccuracyPage {...pageProps} />}
          />

          <Route
            path="/history"
            element={<HistoryPage {...pageProps} />}
          />

          {/* Unknown routes return to Overview */}
          <Route
            path="*"
            element={<Navigate to="/overview" replace />}
          />
        </Routes>

        {/* Shared footer */}
        <footer>
          <b>
            <Wind size={16} /> WIND<span>/</span>INTEL
          </b>

          <span>Source: Elexon BMRS · FUELHH + WINDFOR</span>

          <span>
            Cutoff: {data?.cutoff_hour_utc ?? 18}:00 UTC previous day*
          </span>

          <small>
            *Verify market convention before operational use.
          </small>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Workspace />
    </BrowserRouter>
  );
}
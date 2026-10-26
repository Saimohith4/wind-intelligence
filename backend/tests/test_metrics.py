import pandas as pd
from app.analytics.metrics import select_vintage, calculate_metrics, build_matched

def test_select_latest_vintage_before_cutoff():
    t = pd.Timestamp("2026-01-02T12:00:00Z")
    f = pd.DataFrame([
        {"startTime": t, "publishTime": pd.Timestamp("2026-01-01T10:00:00Z"), "forecast_generation": 100.},
        {"startTime": t, "publishTime": pd.Timestamp("2026-01-01T15:00:00Z"), "forecast_generation": 120.},
        {"startTime": t, "publishTime": pd.Timestamp("2026-01-01T18:00:00Z"), "forecast_generation": 999.},
    ])
    assert select_vintage(f, 16).iloc[0].forecast_generation == 120.

def test_metrics():
    rows = pd.DataFrame({"status": ["matched"]*3, "error_mw": [10., -10., 20.]})
    m = calculate_metrics(rows, 3)
    assert abs(m["mae_mw"] - 40/3) < 1e-9
    assert abs(m["rmse_mw"] - (200 ** .5)) < 1e-9
    assert abs(m["mbe_mw"] - 20/3) < 1e-9
    assert m["coverage_percent"] == 100.

def test_empty_data_has_no_fake_metrics():
    m = calculate_metrics(pd.DataFrame(), 48)
    assert m["mae_mw"] is None and m["matched_intervals"] == 0

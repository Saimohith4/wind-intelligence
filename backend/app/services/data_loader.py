
import json
from pathlib import Path

import pandas as pd


def _read(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)

    payload = json.loads(path.read_text(encoding="utf-8"))

    if isinstance(payload, dict):
        payload = payload.get(
            "data",
            payload.get("results", payload.get("items", [])),
        )

    if not isinstance(payload, list):
        raise ValueError(
            f"{path.name}: expected a JSON array or "
            "data/results/items array"
        )

    return pd.DataFrame(payload)


def _find(folder: Path, names: tuple[str, ...]):
    return next(
        (folder / name for name in names if (folder / name).exists()),
        None,
    )


def _col(df, names, required=True):
    lookup = {str(col).strip().lower(): col for col in df.columns}

    for name in names:
        if name.lower() in lookup:
            return lookup[name.lower()]

    if required:
        raise ValueError(
            "Missing required column: " + " / ".join(names)
        )

    return None


def load_data(folder: Path):
    actual_path = _find(
        folder,
        (
            "fuelhh_actuals.json",
            "fuelhh_actuals.csv",
            "FUELHH.json",
            "FUELHH.csv",
        ),
    )

    forecast_path = _find(
        folder,
        (
            "windfor_history_combined.json",
            "windfor_history_combined.csv",
            "windfor_history.json",
            "windfor_forecasts.csv",
            "windfor_forecasts.json",
            "WINDFOR.csv",
            "WINDFOR.json",
        ),
    )

    if actual_path is None or forecast_path is None:
        return (
            pd.DataFrame(columns=["startTime", "actual_generation"]),
            pd.DataFrame(
                columns=[
                    "startTime",
                    "publishTime",
                    "forecast_generation",
                ]
            ),
            {
                "actual_file": actual_path.name if actual_path else None,
                "forecast_file": (
                    forecast_path.name if forecast_path else None
                ),
                "message": (
                    "Add FUELHH actuals and consolidated WINDFOR "
                    "publication history to backend/data/."
                ),
            },
        )

    actual_raw = _read(actual_path)
    forecast_raw = _read(forecast_path)

    actual_time_col = _col(
        actual_raw, ("startTime", "start_time")
    )
    actual_value_col = _col(
        actual_raw, ("generation", "actual_generation")
    )
    fuel_col = _col(
        actual_raw, ("fuelType", "fuel_type"), required=False
    )

    actual_raw["startTime"] = pd.to_datetime(
        actual_raw[actual_time_col], utc=True, errors="coerce"
    )
    actual_raw["generation"] = pd.to_numeric(
        actual_raw[actual_value_col], errors="coerce"
    )

    if fuel_col:
        actual_raw = actual_raw.loc[
            actual_raw[fuel_col].astype(str).str.upper().eq("WIND")
        ]

    actual_raw = actual_raw.dropna(
        subset=["startTime", "generation"]
    )

    begin = pd.Timestamp("2026-01-01", tz="UTC")
    finish = pd.Timestamp("2026-02-01", tz="UTC")

    actual_raw = actual_raw.loc[
        (actual_raw["startTime"] >= begin)
        & (actual_raw["startTime"] < finish)
    ].copy()

    # Each hourly actual is the average of its two half-hourly readings.
    actual_raw["hour"] = actual_raw["startTime"].dt.floor("h")

    hourly = actual_raw.groupby("hour")["generation"].agg(
        ["mean", "count"]
    )

    # Avoid silently treating partial hours as complete observations.
    hourly = hourly.loc[hourly["count"] == 2]

    actual = (
        hourly.reset_index()
        .rename(
            columns={
                "hour": "startTime",
                "mean": "actual_generation",
            }
        )[["startTime", "actual_generation"]]
        .sort_values("startTime")
        .reset_index(drop=True)
    )

    forecast_time_col = _col(
        forecast_raw, ("startTime", "start_time")
    )
    publish_col = _col(
        forecast_raw, ("publishTime", "publish_time")
    )
    forecast_value_col = _col(
        forecast_raw, ("generation", "forecast_generation")
    )

    forecasts = pd.DataFrame(
        {
            "startTime": pd.to_datetime(
                forecast_raw[forecast_time_col],
                utc=True,
                errors="coerce",
            ),
            "publishTime": pd.to_datetime(
                forecast_raw[publish_col],
                utc=True,
                errors="coerce",
            ),
            "forecast_generation": pd.to_numeric(
                forecast_raw[forecast_value_col],
                errors="coerce",
            ),
        }
    )

    forecasts = forecasts.dropna(
        subset=["startTime", "publishTime", "forecast_generation"]
    )

    forecasts = forecasts.loc[
        (forecasts["startTime"] >= begin)
        & (forecasts["startTime"] < finish)
    ]

    forecasts = (
        forecasts.drop_duplicates(
            ["startTime", "publishTime"], keep="last"
        )
        .sort_values(["startTime", "publishTime"])
        .reset_index(drop=True)
    )

    message = (
        "Loaded hourly actuals and forecast publication history. "
        "Only complete hours with two actual observations are retained."
    )

    return actual, forecasts, {
        "actual_file": actual_path.name,
        "forecast_file": forecast_path.name,
        "message": message,
    }

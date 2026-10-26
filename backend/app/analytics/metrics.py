
import pandas as pd

from app.config import CUTOFF_HOUR_UTC


def decision_cutoff(start_time, cutoff_hour_utc=CUTOFF_HOUR_UTC):
    target = pd.Timestamp(start_time)

    if target.tzinfo is None:
        target = target.tz_localize("UTC")
    else:
        target = target.tz_convert("UTC")

    return (
        target.normalize()
        - pd.Timedelta(days=1)
        + pd.Timedelta(hours=cutoff_hour_utc)
    )


def select_vintage(
    forecasts: pd.DataFrame,
    cutoff_hour_utc=CUTOFF_HOUR_UTC,
):
    columns = [
        "startTime",
        "publishTime",
        "forecast_generation",
    ]

    if forecasts.empty:
        return pd.DataFrame(columns=columns)

    selected = []

    for target, group in forecasts.groupby("startTime", sort=True):
        cutoff = decision_cutoff(target, cutoff_hour_utc)

        eligible = group.loc[
            group["publishTime"] <= cutoff
        ].sort_values("publishTime")

        if not eligible.empty:
            selected.append(eligible.iloc[-1])

    if not selected:
        return pd.DataFrame(columns=forecasts.columns)

    return (
        pd.DataFrame(selected)
        .reindex(columns=forecasts.columns)
        .reset_index(drop=True)
    )


def build_matched(
    actual: pd.DataFrame,
    forecasts: pd.DataFrame,
    cutoff_hour_utc=CUTOFF_HOUR_UTC,
):
    columns = [
        "startTime",
        "publishTime",
        "forecast_generation",
        "actual_generation",
        "error_mw",
        "absolute_error_mw",
        "status",
    ]

    chosen = select_vintage(forecasts, cutoff_hour_utc)

    if actual.empty and chosen.empty:
        return pd.DataFrame(columns=columns)

    merged = chosen.merge(
        actual,
        on="startTime",
        how="outer",
        indicator=True,
        validate="one_to_one",
    )

    merged["status"] = merged["_merge"].map(
        {
            "both": "matched",
            "left_only": "missing_actual",
            "right_only": "missing_forecast",
        }
    )

    merged = merged.drop(columns="_merge")

    merged["error_mw"] = (
        merged["forecast_generation"] - merged["actual_generation"]
    )
    merged["absolute_error_mw"] = merged["error_mw"].abs()

    return (
        merged.reindex(columns=columns)
        .sort_values("startTime")
        .reset_index(drop=True)
    )


def calculate_metrics(rows, expected_intervals=744):
    valid = (
        rows.loc[
            rows["status"].eq("matched")
            & rows["error_mw"].notna()
        ]
        if not rows.empty
        else pd.DataFrame()
    )

    count = len(valid)

    if count:
        errors = valid["error_mw"].astype(float)
        mae = float(errors.abs().mean())
        rmse = float((errors.pow(2).mean()) ** 0.5)
        mbe = float(errors.mean())
        over = int((errors > 0).sum())
        under = int((errors < 0).sum())
    else:
        mae = rmse = mbe = None
        over = under = 0

    return {
        "mae_mw": mae,
        "rmse_mw": rmse,
        "mbe_mw": mbe,
        "matched_intervals": int(count),
        "expected_intervals": int(expected_intervals),
        "coverage_percent": (
            round(count / expected_intervals * 100, 2)
            if expected_intervals
            else None
        ),
        "overforecast_intervals": over,
        "underforecast_intervals": under,
    }

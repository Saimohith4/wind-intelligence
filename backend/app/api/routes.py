
from datetime import date, timedelta
import io

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import DATA_DIR, CUTOFF_HOUR_UTC
from app.services.data_loader import load_data
from app.analytics.metrics import build_matched, calculate_metrics

router = APIRouter(prefix="/api")


def _load():
    try:
        return load_data(DATA_DIR)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not load source files: {exc}",
        ) from exc


def _json_rows(rows):
    out = []

    for _, row in rows.iterrows():

        def val(key):
            value = row.get(key)

            if pd.isna(value):
                return None

            if key in ("startTime", "publishTime"):
                return value.isoformat().replace("+00:00", "Z")

            if key in (
                "forecast_generation",
                "actual_generation",
                "error_mw",
                "absolute_error_mw",
            ):
                return float(value)

            return value

        out.append({
            key: val(key)
            for key in (
                "startTime",
                "publishTime",
                "forecast_generation",
                "actual_generation",
                "error_mw",
                "absolute_error_mw",
                "status",
            )
        })

    return out


def _overview(start, end):
    if end <= start:
        raise HTTPException(
            status_code=400,
            detail="'end' must be after 'start'",
        )

    if start < date(2026, 1, 1) or end > date(2026, 2, 1):
        raise HTTPException(
            status_code=400,
            detail="This app is scoped to January 2026.",
        )

    actual, forecasts, meta = _load()

    rows = build_matched(
        actual,
        forecasts,
        CUTOFF_HOUR_UTC,
    )

    if not rows.empty:
        start_timestamp = pd.Timestamp(start, tz="UTC")
        end_timestamp = pd.Timestamp(end, tz="UTC")

        rows = rows.loc[
            (rows["startTime"] >= start_timestamp)
            & (rows["startTime"] < end_timestamp)
        ].copy()

    # Hourly evaluation: 24 intervals per calendar day.
    expected = (end - start).days * 24

    if actual.empty or forecasts.empty:
        message = meta["message"]
    else:
        message = (
            f"Forecast cutoff: {CUTOFF_HOUR_UTC:02d}:00 UTC "
            "on the preceding calendar day. "
            "This is a documented modelling assumption, "
            "not a cutoff specified by the challenge."
        )

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "cutoff_hour_utc": CUTOFF_HOUR_UTC,
        "metrics": calculate_metrics(rows, expected),
        "rows": _json_rows(rows),
        "data_available": not actual.empty and not forecasts.empty,
        "message": message,
    }


@router.get("/health")
def health():
    actual, forecasts, meta = _load()

    return {
        "status": "ok",
        "data_available": not actual.empty and not forecasts.empty,
        "actual_rows": len(actual),
        "forecast_rows": len(forecasts),
        "actual_file": meta["actual_file"],
        "forecast_file": meta["forecast_file"],
        "message": meta["message"],
    }


@router.get("/overview")
def overview(
    start: date = date(2026, 1, 1),
    end: date = date(2026, 2, 1),
):
    return _overview(start, end)


@router.get("/accuracy")
def accuracy(
    start: date = date(2026, 1, 1),
    end: date = date(2026, 2, 1),
):
    result = _overview(start, end)

    return {
        "start": result["start"],
        "end": result["end"],
        "metrics": result["metrics"],
    }


@router.get("/series")
def series(
    start: date = date(2026, 1, 1),
    end: date = date(2026, 2, 1),
):
    result = _overview(start, end)

    return {
        "start": result["start"],
        "end": result["end"],
        "rows": result["rows"],
    }


@router.get("/forecasts")
def forecasts(day: date = date(2026, 1, 1)):
    if day < date(2026, 1, 1) or day >= date(2026, 2, 1):
        raise HTTPException(
            status_code=400,
            detail="Select a date in January 2026.",
        )

    result = _overview(day, day + timedelta(days=1))

    return {
        "date": day.isoformat(),
        "cutoff_hour_utc": CUTOFF_HOUR_UTC,
        "rows": result["rows"],
    }


@router.get("/export.csv")
def export_csv(
    start: date = date(2026, 1, 1),
    end: date = date(2026, 2, 1),
):
    result = _overview(start, end)

    buffer = io.StringIO()
    pd.DataFrame(result["rows"]).to_csv(buffer, index=False)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; filename=wind-analysis-january-2026.csv"
            )
        },
    )

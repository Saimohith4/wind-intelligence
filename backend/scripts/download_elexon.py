import argparse, json
from pathlib import Path
import httpx
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FUELHH_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
WINDFOR_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

def fetch(client, url, params):
    response = client.get(url, params=params, timeout=120)
    response.raise_for_status()
    payload = response.json()
    if isinstance(payload, dict):
        payload = payload.get("data", payload.get("results", payload.get("items", [])))
    if not isinstance(payload, list):
        raise ValueError(f"Unexpected JSON response from {url}: expected an array")
    return payload

def main():
    parser = argparse.ArgumentParser(description="Download January 2026 Elexon FUELHH and WINDFOR records.")
    parser.add_argument("--start", default="2026-01-01", help="Inclusive delivery date YYYY-MM-DD")
    parser.add_argument("--end", default="2026-02-01", help="Exclusive delivery date YYYY-MM-DD")
    parser.add_argument("--output", default=str(ROOT / "data"))
    args = parser.parse_args()
    start, end = pd.Timestamp(args.start, tz="UTC"), pd.Timestamp(args.end, tz="UTC")
    if end <= start:
        parser.error("--end must be after --start")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    # FUELHH is filtered by settlement dates. WINDFOR is queried by publication
    # timestamp so historical forecast vintages are retained; filter target startTime
    # to the requested delivery window after retrieval.
    actual_params = {
        "settlementDateFrom": start.strftime("%Y-%m-%d"),
        "settlementDateTo": (end - pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
        "fuelType": "WIND",
    }
    publish_start = start - pd.Timedelta(days=1)
    forecast_params = {
        "publishDateTimeFrom": publish_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    with httpx.Client(headers={"Accept": "application/json"}) as client:
        print("Fetching FUELHH actuals...")
        actual_records = fetch(client, FUELHH_URL, actual_params)
        print("Fetching WINDFOR forecast publication history...")
        forecast_records = fetch(client, WINDFOR_URL, forecast_params)

    (output / "fuelhh_actuals_raw.json").write_text(json.dumps(actual_records, indent=2), encoding="utf-8")
    (output / "windfor_forecasts_raw.json").write_text(json.dumps(forecast_records, indent=2), encoding="utf-8")
    actuals, forecasts = pd.DataFrame(actual_records), pd.DataFrame(forecast_records)

    if not actuals.empty:
        if "fuelType" in actuals.columns:
            actuals = actuals.loc[actuals["fuelType"].astype(str).str.upper().eq("WIND")]
        if "startTime" in actuals.columns:
            ts = pd.to_datetime(actuals["startTime"], utc=True, errors="coerce")
            actuals = actuals.loc[(ts >= start) & (ts < end)]
        actuals.to_csv(output / "fuelhh_actuals.csv", index=False)

    if not forecasts.empty:
        required = {"startTime", "publishTime", "generation"}
        missing = required - set(forecasts.columns)
        if missing:
            raise ValueError(f"WINDFOR response missing expected fields: {', '.join(sorted(missing))}")
        ts = pd.to_datetime(forecasts["startTime"], utc=True, errors="coerce")
        forecasts = forecasts.loc[(ts >= start) & (ts < end)]
        forecasts.to_csv(output / "windfor_forecasts.csv", index=False)

    print(f"Saved files to: {output.resolve()}")
    print(f"FUELHH rows: {len(actuals)}; WINDFOR rows: {len(forecasts)}")
    if actuals.empty or forecasts.empty:
        raise SystemExit(
            "One or both datasets are empty. Check the current endpoint documentation, "
            "query parameters, historical availability and returned field names."
        )
    print("Inspect the returned data and verify that WINDFOR contains multiple publishTime vintages.")
    print("A latest-only endpoint is not sufficient to reconstruct historical decision-time forecasts.")

if __name__ == "__main__":
    main()

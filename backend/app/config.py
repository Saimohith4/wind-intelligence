
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path(os.getenv("DATA_DIR", str(ROOT / "data")))
# Modelling assumption: day-ahead decision cutoff at 18:00 UTC
# on the calendar day before delivery.
CUTOFF_HOUR_UTC = int(os.getenv("DECISION_CUTOFF_HOUR_UTC", "18"))

if not 0 <= CUTOFF_HOUR_UTC <= 23:
    raise ValueError("DECISION_CUTOFF_HOUR_UTC must be between 0 and 23.")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")
    if origin.strip()
]

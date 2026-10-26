# System Architecture

## Overview

Wind Intelligence separates data preparation and authoritative analytics from frontend presentation. The FastAPI backend loads and evaluates the Elexon datasets; the React frontend consumes the API and presents the results through an interactive dashboard.

## Data flow

```text
Elexon FUELHH actuals       Elexon WINDFOR forecast history
          |                              |
          v                              v
       Data files and source records
                      |
                      v
             FastAPI data loader
                      |
                      v
        Timestamp normalization (UTC)
                      |
                      v
        Hourly actual data preparation
                      |
                      v
       Decision-cutoff forecast selection
                      |
                      v
          Actual/forecast matching
                      |
                      v
       MAE / RMSE / MBE / coverage
                      |
                      v
                FastAPI endpoints
                      |
                      v
           React + TypeScript frontend
                      |
                      v
       Charts, KPI cards, tables, CSV export
```

## Backend responsibilities

The Python backend is responsible for:

- Loading actual generation and forecast publication history.
- Filtering the evaluation to the intended delivery period.
- Preparing complete hourly actual values.
- Normalizing delivery and publication timestamps.
- Selecting the latest forecast eligible at the configured cutoff.
- Matching forecast and actual values.
- Computing accuracy metrics and coverage.
- Returning structured data to the frontend.
- Providing evaluation records for inspection and CSV export.

The backend is the source of truth for forecast selection and metric calculations. The frontend should not independently recalculate authoritative metrics or choose forecast vintages.

## Frontend responsibilities

The React, TypeScript, and Vite application is responsible for:

- Requesting data from the backend API.
- Presenting overview KPIs and time-series charts.
- Displaying forecast accuracy and evaluation history.
- Supporting inspection of individual delivery intervals.
- Providing CSV export through the backend.
- Communicating loading, empty, and error states clearly.

The interface is organized into navigable pages to keep the overview, accuracy analysis, and forecast history distinct.

## API surface

The application exposes the following documented routes, subject to the current backend implementation:

- `GET /api/health`
- `GET /api/overview`
- `GET /api/accuracy`
- `GET /api/series`
- `GET /api/forecasts`
- `GET /api/export.csv`

The health endpoint checks service availability. The remaining endpoints expose summary metrics, time-series data, forecast evaluation records, and downloadable results.

## Runtime and deployment

Docker Compose orchestrates the frontend and backend for local development. The frontend communicates with the backend using HTTP requests, and the backend must be configured to permit the appropriate frontend origin.

For deployment, configure production API URLs, allowed origins, data-file availability, and service startup settings explicitly. Do not rely on development-only localhost addresses in a public deployment.

## Data integrity considerations

- Forecast publication time and delivery time have different meanings and must remain distinct.
- Forecasts published after the decision cutoff must not be selected.
- Missing observations must not be silently interpreted as zero.
- Metrics must be calculated from a consistent set of matched intervals.
- The configured decision cutoff must be documented alongside the reported evaluation results.

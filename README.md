# Wind Intelligence

A full-stack analytics platform for evaluating UK wind-generation forecasts against actual generation data for January 2026. Built for the REint Full Stack SWE Challenge.

Wind Intelligence helps users explore forecast accuracy, understand forecast errors, inspect individual delivery intervals, and export evaluation data.

## Overview

The application combines Elexon generation data with a Python analytics backend and an interactive React dashboard.

### Key features

- **Forecast vs. actual analysis** — compare predicted and observed wind generation.
- **Forecast accuracy metrics** — calculate Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Bias Error (MBE).
- **Coverage analysis** — inspect matched delivery intervals and data availability.
- **Forecast vintage selection** — select the latest eligible forecast publication for each delivery period using a configurable decision cutoff.
- **Forecast history** — inspect individual evaluation records and forecast errors.
- **CSV export** — download evaluation results for further analysis.
- **Responsive dashboard** — explore results through charts, KPI cards, tables, and separate application pages.
- **Missing-data handling** — preserve missing observations instead of treating them as zero.
- **Containerized setup** — run the frontend and backend using Docker Compose.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Visualization | Recharts |
| Backend | Python, FastAPI |
| Data processing | Pandas |
| Data source | Elexon BMRS |
| Containerization | Docker, Docker Compose |

## Data sources

The analysis uses the following Elexon datasets:

- **FUELHH** — actual half-hourly generation. Filter records to `fuelType = WIND` and use `startTime` and `generation`.
- **WINDFOR** — wind-generation forecast publications. Use `startTime`, `publishTime`, and `generation` to distinguish delivery periods from forecast publication times.

Official dataset documentation:

- [FUELHH API documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
- [WINDFOR API documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)

The analysis covers delivery periods in January 2026. The end boundary, `2026-02-01`, is exclusive.

### Data preparation

The application normalizes timestamps to UTC and aggregates half-hourly actual generation into hourly values. Only complete hours containing both expected half-hourly observations are retained.

Forecast publication history is preserved so the backend can select an eligible forecast vintage for each delivery period. Missing actual or forecast observations are not silently replaced with zero.

## Evaluation methodology

For each delivery hour, the backend selects the latest forecast published on or before the configured decision cutoff for the preceding day.

The default decision cutoff is configured in the backend. The 18:00 UTC cutoff used in the evaluation is a modelling assumption for this project; it is not specified as a mandatory cutoff in the challenge brief.

The forecast error is:

`Error = Forecast - Actual`

- Positive error: overforecast.
- Negative error: underforecast.
- MAE: average absolute forecast error.
- RMSE: square root of the average squared forecast error.
- MBE: average signed forecast error; a positive value indicates overforecasting on average.
- Coverage: proportion of expected delivery intervals with matched actual and forecast values.

See [`docs/analysis-methodology.md`](docs/analysis-methodology.md) for details and limitations.

## Getting started

### Prerequisites

- Docker Desktop with Docker Compose
- Git

### Run the application

Clone the repository and enter the project directory:

```bash
git clone <YOUR_PUBLIC_REPOSITORY_URL>
cd reint_wind_intelligence
```

Build and start the services:

```bash
docker compose up -d --build
```

Open the application and API:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API health check | http://localhost:8000/api/health |
| API documentation | http://localhost:8000/docs |

The exact endpoints depend on the backend route configuration.

### Useful Docker commands

View service status:

```bash
docker compose ps
```

Follow backend logs:

```bash
docker compose logs -f backend
```

Follow frontend logs:

```bash
docker compose logs -f frontend
```

Stop the application:

```bash
docker compose down
```

Rebuild after code changes:

```bash
docker compose up -d --build
```

### Verify loaded data

To inspect the records loaded by the backend, run:

```bash
docker compose exec backend python -c "from app.config import DATA_DIR; from app.services.data_loader import load_data; a,f,m=load_data(DATA_DIR); print('Actual rows:',len(a)); print('Forecast rows:',len(f)); print('Metadata:',m)"
```

This command reports the number of prepared hourly actuals and available forecast publication records. These counts are not, by themselves, proof that every delivery interval has an eligible forecast under the selected cutoff.

## API endpoints

The backend exposes the following endpoints, subject to the current route implementation:

| Endpoint | Purpose |
|---|---|
| `/api/health` | Service health check |
| `/api/overview` | Summary KPIs and overview information |
| `/api/accuracy` | Forecast accuracy metrics |
| `/api/series` | Time-series data for charts |
| `/api/forecasts` | Forecast evaluation records |
| `/api/export.csv` | CSV export of evaluation results |

Interactive API documentation is available at `http://localhost:8000/docs` when running locally.

## Project structure

```text
reint_wind_intelligence/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── ...
│   ├── data/
│   └── requirements.txt
├── frontend/
├── docs/
│   ├── analysis-methodology.md
│   └── architecture.md
├── docker-compose.yml
└── README.md
```

The exact internal structure may include additional modules and configuration files.

## Limitations

- The evaluation covers January 2026 delivery periods, not every month or every generation source.
- The decision cutoff is an explicit modelling assumption and should not be interpreted as an official procurement rule.
- Forecast error alone does not establish the financial impact of a purchasing decision.
- The analysis does not include electricity prices, demand, other generation sources, plant constraints, or a complete trading strategy.
- Results depend on the source data, timestamp handling, forecast-vintage selection, and configured cutoff.

## Further documentation

- [Analysis methodology](docs/analysis-methodology.md)
- [System architecture](docs/architecture.md)

## License

Add the license required by your intended distribution and repository policy.

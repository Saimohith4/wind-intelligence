# Analysis Methodology

## 1. Objective

Evaluate the accuracy of UK wind-generation forecasts against actual generation during January 2026, using the Elexon FUELHH and WINDFOR datasets.

The purpose is to quantify forecast error, coverage, and the direction of forecasting bias. These measures provide evidence for understanding forecast quality, but they do not directly determine the profitability of an electricity purchasing decision.

## 2. Source datasets

### FUELHH: actual generation

The application uses actual generation records filtered to `fuelType = WIND`.

Relevant fields:

- `startTime`: delivery interval timestamp.
- `generation`: observed generation.

The source data is half-hourly. The loader combines two complete half-hourly observations into an hourly average. Hours without both expected observations are excluded from the prepared hourly actual dataset.

### WINDFOR: forecast publications

The application uses wind-generation forecast records and retains:

- `startTime`: forecast delivery interval.
- `publishTime`: forecast publication timestamp.
- `generation`: forecast generation value.

Publication history matters because multiple forecasts may exist for the same delivery interval. Selecting a forecast without considering when it was published can introduce look-ahead bias.

## 3. Evaluation period and timestamps

The delivery period is January 1 through January 31, 2026, inclusive. The exclusive end boundary is February 1, 2026.

Timestamps are normalized to UTC before matching actual and forecast records.

Actuals and forecasts are joined using their normalized delivery timestamps, not the forecast publication timestamp.

## 4. Decision cutoff and forecast selection

For each delivery hour, the backend determines the configured cutoff on the preceding calendar day and selects the latest forecast publication satisfying:

`publishTime <= decision cutoff`

The evaluation uses an 18:00 UTC preceding-day cutoff as a project modelling assumption. The challenge brief does not prescribe this exact time.

This cutoff must be consistent across the evaluation and documentation. If the configuration changes, rerun the evaluation and update the reported metrics accordingly.

Forecasts published after the cutoff must not be used for that delivery period. This prevents later information from leaking into an earlier decision.

## 5. Matching and missing data

The selected forecast is matched with the corresponding hourly actual.

Missing actual or forecast values are not replaced with zero. The application should distinguish between:

- Expected delivery intervals.
- Intervals with available actual data.
- Intervals with an eligible forecast.
- Intervals with both values available for evaluation.

Coverage must use a clearly defined denominator. For a full January hourly evaluation, the expected count is 744 delivery hours.

## 6. Forecast error

For each matched interval:

`Error = Forecast - Actual`

- Positive error indicates overforecasting.
- Negative error indicates underforecasting.

The sign convention must remain consistent across metrics, charts, tables, and exported CSV files.

## 7. Evaluation metrics

### Mean Absolute Error (MAE)

The mean magnitude of the forecast error, without regard to direction.

`MAE = mean(abs(Forecast - Actual))`

Lower MAE indicates smaller average absolute errors.

### Root Mean Squared Error (RMSE)

The square root of the mean squared error.

`RMSE = sqrt(mean((Forecast - Actual)^2))`

RMSE penalizes larger errors more strongly than MAE.

### Mean Bias Error (MBE)

The average signed error.

`MBE = mean(Forecast - Actual)`

- Positive MBE indicates average overforecasting.
- Negative MBE indicates average underforecasting.
- A value near zero indicates low net signed bias, but does not necessarily mean individual forecasts are accurate.

### Coverage

Coverage measures how many expected delivery intervals have both a selected eligible forecast and an actual observation.

`Coverage (%) = Matched intervals / Expected intervals * 100`

The denominator and evaluation period should be stated when presenting coverage.

### Overforecast and underforecast counts

Overforecast intervals have positive errors; underforecast intervals have negative errors. Intervals with exactly zero error should be counted separately or excluded from both directional counts, according to the implementation.

## 8. Interpretation and limitations

These metrics describe forecast accuracy over the selected evaluation period. They do not by themselves quantify procurement cost or trading performance.

A financial assessment would additionally require information such as wholesale prices, demand, procurement positions, other generation sources, and applicable operational constraints.

Results should be reported only after confirming that the live API uses the documented cutoff, the intended data files, and the same error sign convention.

## 9. Reproducibility checklist

Before publishing final results:

1. Confirm the configured UTC cutoff.
2. Confirm the actual and forecast source files used by the loader.
3. Confirm the delivery period and timestamp normalization.
4. Verify that no forecast published after its decision cutoff is selected.
5. Check the expected, matched, and missing interval counts.
6. Recalculate MAE, RMSE, and MBE from the same matched evaluation rows.
7. Confirm that dashboard KPIs, charts, tables, and CSV exports agree.

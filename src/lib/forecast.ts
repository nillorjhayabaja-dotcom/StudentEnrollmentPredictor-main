// Lightweight ARIMA-style forecasting using Holt's linear trend + additive seasonal component.
// Suitable for semester-level enrollment series (small N, trend + seasonality).

export type Point = { t: number; y: number; label: string };
export type Forecast = { t: number; label: string; yhat: number; lower: number; upper: number };

// Holt-Winters additive (seasonality length m=2 for semesters)
export function forecast(series: Point[], horizon = 4, m = 2): Forecast[] {
  const n = series.length;
  if (n < m * 2) return [];
  const ys = series.map((p) => p.y);

  const alpha = 0.5, beta = 0.25, gamma = 0.4;

  // init level/trend from first season vs second
  const seasonAvg = (start: number) => {
    let s = 0;
    for (let i = 0; i < m; i++) s += ys[start + i];
    return s / m;
  };
  let level = seasonAvg(0);
  let trend = (seasonAvg(m) - seasonAvg(0)) / m;
  const seasons: number[] = [];
  for (let i = 0; i < m; i++) seasons.push(ys[i] - level);

  const errors: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = seasons[i % m];
    const yhat = level + trend + s;
    errors.push(ys[i] - yhat);
    const newLevel = alpha * (ys[i] - s) + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    const newSeason = gamma * (ys[i] - newLevel) + (1 - gamma) * s;
    level = newLevel;
    trend = newTrend;
    seasons[i % m] = newSeason;
  }

  // residual std for confidence band
  const meanErr = errors.reduce((a, b) => a + b, 0) / errors.length;
  const variance = errors.reduce((a, b) => a + (b - meanErr) ** 2, 0) / Math.max(1, errors.length - 1);
  const sigma = Math.sqrt(variance);

  const last = series[n - 1];
  const out: Forecast[] = [];
  for (let h = 1; h <= horizon; h++) {
    const yhat = level + h * trend + seasons[(n + h - 1) % m];
    const band = 1.96 * sigma * Math.sqrt(h); // widening interval
    const t = last.t + h;
    const year = Math.floor((t - 1) / m) + series[0].t / m + 0;
    // Build a label from index
    out.push({
      t,
      label: nextLabel(last.label, h),
      yhat: Math.max(0, Math.round(yhat)),
      lower: Math.max(0, Math.round(yhat - band)),
      upper: Math.round(yhat + band),
    });
  }
  return out;
}

function nextLabel(lastLabel: string, h: number) {
  // labels look like "2025 S1"
  const m = lastLabel.match(/(\d{4})\s*S(\d)/);
  if (!m) return `+${h}`;
  let year = parseInt(m[1], 10);
  let sem = parseInt(m[2], 10);
  for (let i = 0; i < h; i++) {
    sem += 1;
    if (sem > 2) { sem = 1; year += 1; }
  }
  return `${year} S${sem}`;
}

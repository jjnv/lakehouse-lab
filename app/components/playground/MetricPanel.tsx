"use client";

import type { PlaygroundLocale, ScenarioDefinition, ScenarioMetric, SimulationState } from "../../playground/domain/types";

const HIDDEN_SENTINEL = 9999;

export function formatMetric(metric: ScenarioMetric | undefined, value: number, locale: PlaygroundLocale) {
  const tag = locale === "en" ? "en-US" : "es-ES";
  if (metric?.id.endsWith("AtMinute") && value >= HIDDEN_SENTINEL) return "—";
  const unit = metric?.unit;
  const digits = unit === "gb" || unit === "units" || unit === "ratio" ? 2 : unit === "minutes" || unit === "seconds" || unit === "percent" ? 1 : 0;
  const formatted = new Intl.NumberFormat(tag, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  return unit === "percent" ? `${formatted} %` : formatted;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - ((value - min) / span) * 26}`).join(" ");
  return <svg className="pg-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

/** Métricas reales del motor: valor actual, objetivo, tendencia y serie temporal. */
export default function MetricPanel({ definition, state, labels, locale, targetLabel }: { definition: ScenarioDefinition; state: SimulationState; labels: Record<string, string>; locale: PlaygroundLocale; targetLabel: string }) {
  const visible = definition.metrics.filter((metric) => metric.id !== "clock");
  return <ul className="pg-metrics">
    {visible.map((metric) => {
      const value = state.metrics[metric.id] ?? 0;
      const series = state.history.map((point) => point.metrics[metric.id] ?? 0).filter((item) => item < HIDDEN_SENTINEL);
      const previous = state.history.length > 1 ? state.history[state.history.length - 2].metrics[metric.id] : undefined;
      const targetMet = metric.target === undefined ? null : metric.better === "lower" ? value <= metric.target : value >= metric.target;
      const delta = previous === undefined || previous >= HIDDEN_SENTINEL || value >= HIDDEN_SENTINEL ? 0 : value - previous;
      const improving = delta === 0 ? null : (metric.better === "lower" ? delta < 0 : delta > 0);
      return <li key={metric.id} className={targetMet === null ? "" : targetMet ? "is-ok" : "is-alert"}>
        <span>{labels[metric.id] ?? metric.id}</span>
        <strong>{formatMetric(metric, value, locale)}</strong>
        {metric.target !== undefined ? <small>{targetLabel}: {formatMetric(metric, metric.target, locale)}</small> : null}
        {improving !== null ? <small className={improving ? "pg-trend-good" : "pg-trend-bad"}>{delta > 0 ? "▲" : "▼"} {formatMetric(metric, Math.abs(delta), locale)}</small> : null}
        <Sparkline values={series} />
      </li>;
    })}
  </ul>;
}

"use client";

import { useEffect, useState } from "react";
import type { PlaygroundLocale } from "../../playground/domain/types";
import { PLAYGROUND_UI } from "../../playground/i18n/ui";
import { scenarioById } from "../../playground/scenarios";
import { loadHistory, loadLast, type LocalHistoryEntry } from "./storage";

/** Continuar la última actividad e historial guardados solo en este navegador. */
export default function PlaygroundResume({ locale }: { locale: PlaygroundLocale }) {
  const [last, setLast] = useState<string | null>(null);
  const [history, setHistory] = useState<LocalHistoryEntry[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe tras hidratar.
    setLast(loadLast()?.scenarioId ?? null);
    setHistory(loadHistory().slice(0, 5));
  }, []);
  const ui = PLAYGROUND_UI[locale];
  const lastScenario = last ? scenarioById(last) : undefined;
  return <section className="ent-section pg-resume-card" aria-labelledby="pg-resume-heading">
    <h2 id="pg-resume-heading">{ui.labels.lastActivity}</h2>
    {lastScenario ? <p><a className="ent-primary-action" href={`/playground/scenario/${lastScenario.definition.id}`}>{ui.labels.continue}: {lastScenario.copy[locale].title}</a></p> : <p className="pg-muted">{ui.labels.noHistory}</p>}
    {history.length ? <>
      <h3>{ui.labels.recentHistory}</h3>
      <ul className="pg-history">{history.map((entry) => {
        const scenario = scenarioById(entry.scenarioId);
        return <li key={`${entry.scenarioId}-${entry.at}`}>{scenario?.copy[locale].title ?? entry.scenarioId} · {ui.statuses[entry.status as keyof typeof ui.statuses] ?? entry.status} · {entry.score}/100 · {ui.modes[entry.mode].label}</li>;
      })}</ul>
    </> : null}
  </section>;
}

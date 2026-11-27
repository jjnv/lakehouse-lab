"use client";

import { useEffect, useRef } from "react";
import type { EvaluationResult, LocalizedScenario, PlaygroundLocale, SimulationState } from "../../playground/domain/types";
import { buildPostmortemMarkdown, type LessonLink } from "../../playground/evaluation/report";
import { eventText, noteText } from "../../playground/i18n/resolve";
import { PLAYGROUND_UI } from "../../playground/i18n/ui";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "needs-session";

type Props = {
  scenario: LocalizedScenario;
  locale: PlaygroundLocale;
  state: SimulationState;
  evaluation: EvaluationResult;
  lessons: LessonLink[];
  authenticated: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onRestart: () => void;
};

export default function PlaygroundReport({ scenario, locale, state, evaluation, lessons, authenticated, saveStatus, onSave, onRestart }: Props) {
  const ui = PLAYGROUND_UI[locale];
  const label = ui.labels;
  const copy = scenario.copy[locale];
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  const download = () => {
    const markdown = buildPostmortemMarkdown(scenario, locale, state, evaluation, lessons);
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `postmortem-${scenario.definition.id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const decisionList = (verdict: "good" | "unnecessary" | "dangerous") => {
    const items = evaluation.decisions.filter((decision) => decision.verdict === verdict);
    if (!items.length) return <p className="pg-muted">—</p>;
    return <ul>{items.map((decision) => <li key={`${decision.step}-${decision.actionId}`}><strong>{copy.actions[decision.actionId]?.label}</strong> <span className="pg-muted">({decision.atMinute} {label.minutes})</span><br />{noteText(scenario, locale, decision.note)}</li>)}</ul>;
  };
  const returnTo = encodeURIComponent(`/playground/scenario/${scenario.definition.id}`);

  return <section className="pg-report" aria-labelledby="pg-report-heading">
    <header className="pg-report-head">
      <div>
        <p className="ent-kicker">{label.report}</p>
        <h2 id="pg-report-heading" ref={headingRef} tabIndex={-1}>{copy.title}</h2>
        <p>{ui.statuses[state.status]} · {state.elapsedMinutes} {label.minutes} · {evaluation.cost} {label.units} · {ui.modes[state.mode].label}</p>
        {state.mode === "practice" ? <p className="pg-muted">{label.practiceNoScore}</p> : null}
      </div>
      <div className="pg-score" aria-label={`${label.score}: ${evaluation.score}/100`}><strong>{evaluation.score}</strong><span>/100</span><small>{label.score}</small></div>
    </header>

    <div className="pg-report-actions">
      <button type="button" className="ent-primary-action" onClick={download}>{label.download}</button>
      {authenticated
        ? <button type="button" className="ent-secondary-action" onClick={onSave} disabled={saveStatus === "saving" || saveStatus === "saved"}>{saveStatus === "saving" ? label.saving : label.save}</button>
        : <a className="ent-secondary-action" href={`/entrar?return_to=${returnTo}`}>{label.createSpace}</a>}
      <button type="button" className="ent-secondary-action" onClick={onRestart}>{label.restart}</button>
    </div>
    <p role="status" className="pg-save-status">{saveStatus === "saved" ? label.saved : saveStatus === "error" ? label.saveError : saveStatus === "needs-session" || !authenticated ? label.saveNeedsSession : ""}</p>

    <div className="pg-report-grid">
      <article>
        <h3>{label.score}</h3>
        <table className="pg-dimensions">
          <caption className="pg-sr">{label.score}</caption>
          <tbody>
            {evaluation.dimensions.map((dimension) => <tr key={dimension.dimension}>
              <th scope="row">{ui.dimensions[dimension.dimension]}</th>
              <td><span className="pg-bar" aria-hidden="true"><i style={{ width: `${Math.round(dimension.score * 100)}%` }} /></span>{Math.round(dimension.score * 100)} %</td>
              <td>{ui.reasons[dimension.reason] ?? dimension.reason}</td>
            </tr>)}
          </tbody>
        </table>
        {evaluation.penalties.length ? <p className="pg-alert">{label.penalties}: {evaluation.penalties.map((penalty) => `−${penalty.points}`).join(", ")}</p> : null}
      </article>
      <article>
        <h3>{label.yourDiagnosis}</h3>
        <ul>{evaluation.diagnosis.selected.length ? evaluation.diagnosis.selected.map((id) => {
          const role = scenario.definition.diagnosis.find((option) => option.id === id)?.role ?? "wrong";
          return <li key={id}>{copy.diagnosis[id]} — <strong>{ui.diagnosisRoles[role]}</strong></li>;
        }) : <li>—</li>}</ul>
        <h3>{label.rootCause}</h3>
        <p>{copy.retrospective.rootCause}</p>
        <h3>{label.symptoms}</h3>
        <ul>{copy.retrospective.symptoms.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{label.aggravating}</h3>
        <ul>{copy.retrospective.aggravating.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article>
        <h3>{label.goodActions}</h3>{decisionList("good")}
        <h3>{label.unnecessaryActions}</h3>{decisionList("unnecessary")}
        <h3>{label.dangerousActions}</h3>{decisionList("dangerous")}
      </article>
      <article>
        <h3>{label.alternatives}</h3>
        <ul>{copy.retrospective.alternatives.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{label.prevention}</h3>
        <ul>{copy.retrospective.prevention.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{label.improvementPlan}</h3>
        <ul>{copy.retrospective.improvementPlan.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{label.lessons}</h3>
        <ul>{lessons.map((lesson) => <li key={lesson.href}><a href={lesson.href}>{lesson.label}</a></li>)}</ul>
      </article>
    </div>

    <details className="pg-chronology">
      <summary>{label.chronology}</summary>
      <ol>{state.events.map((event) => <li key={event.seq} className={`is-${event.severity}`}><span>{event.atMinute} {label.minutes}</span> {eventText(scenario, locale, event.textKey)}</li>)}</ol>
    </details>
  </section>;
}

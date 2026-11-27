"use client";

import { useEffect, useState } from "react";
import { evaluateCondition } from "../../playground/domain/conditions";
import type { ActionKind, LearningMode, PlaygroundLocale, ScenarioDefinition, SimulationAction, SimulationState } from "../../playground/domain/types";
import { LEARNING_MODES } from "../../playground/domain/types";
import { MAX_DIAGNOSIS_HYPOTHESES, actionAvailability, applyInput, createSimulation, isTerminal, replay, timeLimitFor } from "../../playground/engines/incident-engine";
import { evaluateAttempt } from "../../playground/evaluation/evaluate";
import type { LessonLink } from "../../playground/evaluation/report";
import { eventText } from "../../playground/i18n/resolve";
import { PLAYGROUND_UI } from "../../playground/i18n/ui";
import { scenarioById } from "../../playground/scenarios";
import MetricPanel from "./MetricPanel";
import PlaygroundReport, { type SaveStatus } from "./PlaygroundReport";
import { loadAttempt, pushHistory, randomKey, randomSeed, saveAttempt } from "./storage";

type Props = { scenarioId: string; locale: PlaygroundLocale; authenticated: boolean; lessons: LessonLink[] };
type Session = { seed: number; mode: LearningMode; inputs: SimulationAction[]; idempotencyKey: string; savedAttemptId?: string };
type Panel = "context" | "actions" | "evidence" | "timeline";

const KIND_ORDER: ActionKind[] = ["investigate", "mitigate", "change", "recover", "validate", "communicate", "prevent"];
const KIND_LABEL: Record<ActionKind, string> = { investigate: "kindInvestigate", mitigate: "kindMitigate", change: "kindChange", recover: "kindRecover", validate: "kindValidate", communicate: "kindCommunicate", prevent: "kindPrevent" };
const RISK_LABEL = { none: "riskNone", low: "riskLow", medium: "riskMedium", high: "riskHigh" } as const;

function currentState(definition: ScenarioDefinition, session: Session): SimulationState {
  try {
    return replay(definition, { seed: session.seed, mode: session.mode }, session.inputs);
  } catch {
    return createSimulation(definition, { seed: session.seed, mode: session.mode });
  }
}

export default function IncidentWorkspace({ scenarioId, locale, authenticated, lessons }: Props) {
  const scenario = scenarioById(scenarioId);
  if (!scenario) throw new Error(`Escenario desconocido: ${scenarioId}`);
  const definition = scenario.definition;
  const copy = scenario.copy[locale];
  const ui = PLAYGROUND_UI[locale];
  const label = ui.labels;

  const [boot, setBoot] = useState<{ session: Session; ready: boolean; resumed: boolean }>(() => ({ session: { seed: 1, mode: "guided", inputs: [], idempotencyKey: "pending-key-000000" }, ready: false, resumed: false }));
  const { session, ready, resumed } = boot;
  const [panel, setPanel] = useState<Panel>("actions");
  const [hypotheses, setHypotheses] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [inputError, setInputError] = useState<string | null>(null);

  // Recupera el intento local (si existe y es de esta versión) tras hidratar.
  useEffect(() => {
    const stored = loadAttempt(definition.id);
    let next: Session = { seed: randomSeed(), mode: "guided", inputs: [], idempotencyKey: randomKey() };
    let wasResumed = false;
    if (stored && stored.version === definition.version.version) {
      try {
        replay(definition, { seed: stored.seed, mode: stored.mode }, stored.inputs);
        next = { seed: stored.seed, mode: stored.mode, inputs: stored.inputs, idempotencyKey: stored.idempotencyKey, savedAttemptId: stored.savedAttemptId };
        wasResumed = stored.inputs.length > 0;
      } catch {
        // Intento local incompatible: se empieza de nuevo.
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo puede leerse tras hidratar.
    setBoot({ session: next, ready: true, resumed: wasResumed });
  }, [definition]);

  const state: SimulationState = currentState(definition, session);
  const finished = isTerminal(state);
  const evaluation = finished ? evaluateAttempt(definition, state) : null;
  const availability = new Map(actionAvailability(definition, state).map((item) => [item.actionId, item]));
  const lastEvent = state.events[state.events.length - 1];

  const persist = (next: Session, keepResumed = resumed) => {
    setBoot({ session: next, ready: true, resumed: keepResumed });
    saveAttempt({ scenarioId: definition.id, version: definition.version.version, ...next });
  };

  const send = (input: SimulationAction) => {
    try {
      const nextState = applyInput(definition, state, input);
      setInputError(null);
      const next = { ...session, inputs: [...session.inputs, input] };
      persist(next);
      if (isTerminal(nextState)) {
        const result = evaluateAttempt(definition, nextState);
        pushHistory({ scenarioId: definition.id, score: result.score, status: nextState.status, mode: session.mode, at: new Date().toISOString() });
      }
    } catch (error) {
      setInputError(error instanceof Error ? error.message : "ERROR");
    }
  };

  const restart = (mode: LearningMode = session.mode) => {
    setHypotheses([]);
    setSaveStatus("idle");
    persist({ seed: randomSeed(), mode, inputs: [], idempotencyKey: randomKey() }, false);
  };

  const save = async () => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/playground/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId: definition.id, scenarioVersion: definition.version.version, mode: session.mode, seed: session.seed, inputs: session.inputs, idempotencyKey: session.idempotencyKey }),
      });
      if (response.status === 401) return setSaveStatus("needs-session");
      if (!response.ok) return setSaveStatus("error");
      const body = await response.json() as { attempt: { id: string } };
      persist({ ...session, savedAttemptId: body.attempt.id });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const hint = session.mode === "guided" && !finished ? scenario.hints.find((item) => evaluateCondition(item.when, state)) : undefined;
  const hintText = hint ? copy.hints.find((item) => item.id === hint.id)?.text : undefined;
  const effectiveSaveStatus: SaveStatus = saveStatus === "idle" && session.savedAttemptId ? "saved" : saveStatus;

  if (finished && evaluation) {
    return <div className="pg-workspace">
      <PlaygroundReport scenario={scenario} locale={locale} state={state} evaluation={evaluation} lessons={lessons} authenticated={authenticated} saveStatus={effectiveSaveStatus} onSave={save} onRestart={() => restart()} />
    </div>;
  }

  const panelButton = (id: Panel, text: string) => <button type="button" aria-pressed={panel === id} aria-controls={`pg-panel-${id}`} onClick={() => setPanel(id)}>{text}</button>;

  return <div className="pg-workspace" aria-busy={!ready}>
    <p className="pg-synthetic" role="note">{label.syntheticNotice}</p>
    {resumed ? <p className="pg-resume" role="status">{label.resumeNotice}</p> : null}

    <div className="pg-statusbar">
      <dl>
        <div><dt>{label.status}</dt><dd>{ui.statuses[state.status]}</dd></div>
        <div><dt>{label.elapsed}</dt><dd>{state.elapsedMinutes} / {timeLimitFor(definition, session.mode)} {label.minutes}</dd></div>
        <div><dt>{label.cost}</dt><dd>{Math.round(state.cost * 100) / 100} {label.units}</dd></div>
        <div><dt>{label.evidence}</dt><dd>{state.revealedEvidence.length} / {definition.evidence.length}</dd></div>
      </dl>
      <label className="pg-mode">
        <span>{label.mode}</span>
        <select value={session.mode} onChange={(event) => restart(event.target.value as LearningMode)} aria-describedby="pg-mode-help">
          {LEARNING_MODES.map((mode) => <option key={mode} value={mode}>{ui.modes[mode].label}</option>)}
        </select>
      </label>
      <p id="pg-mode-help" className="pg-muted">{ui.modes[session.mode].description}</p>
    </div>

    <p className="pg-live" aria-live="polite">{lastEvent ? eventText(scenario, locale, lastEvent.textKey) : ""}</p>
    {inputError ? <p className="pg-alert" role="alert">{inputError}</p> : null}
    {hintText ? <aside className="pg-hint" aria-label={label.hint}><strong>{label.hint}:</strong> {hintText}</aside> : null}

    <section className="pg-metrics-section" aria-labelledby="pg-metrics-heading">
      <h2 id="pg-metrics-heading">{label.metrics}</h2>
      <MetricPanel definition={definition} state={state} labels={copy.metrics} locale={locale} targetLabel={label.target} />
    </section>

    <nav className="pg-panel-switch" aria-label={label.actions}>
      {panelButton("context", label.tabContext)}
      {panelButton("actions", label.tabActions)}
      {panelButton("evidence", label.tabEvidence)}
      {panelButton("timeline", label.tabTimeline)}
    </nav>

    <div className="pg-grid">
      <section id="pg-panel-context" className="pg-panel" data-active={panel === "context"} aria-labelledby="pg-context-heading">
        <h2 id="pg-context-heading">{label.context}</h2>
        <p>{copy.business}</p>
        <h3>{label.objectives}</h3>
        <p>{copy.objectiveText}</p>
        <ul className="pg-objectives">
          {definition.objectives.map((objective) => {
            const met = evaluateCondition(objective.condition, state);
            return <li key={objective.id} className={met ? "is-met" : ""}><span aria-hidden="true">{met ? "✓" : "○"}</span> {copy.objectives[objective.id]} <span className="pg-sr">({met ? label.met : label.pending})</span></li>;
          })}
        </ul>
        <dl className="pg-facts">
          <div><dt>SLA / SLO</dt><dd>{copy.slo}</dd></div>
          <div><dt>{locale === "en" ? "Volume" : "Volumen"}</dt><dd>{copy.volume}</dd></div>
          <div><dt>{locale === "en" ? "Resources" : "Recursos"}</dt><dd>{copy.resources}</dd></div>
          <div><dt>{locale === "en" ? "Budget" : "Presupuesto"}</dt><dd>{copy.budget}</dd></div>
          <div><dt>{locale === "en" ? "Consumers" : "Consumidores"}</dt><dd>{copy.consumers}</dd></div>
          <div><dt>{locale === "en" ? "Recent changes" : "Cambios recientes"}</dt><dd>{copy.recentChanges}</dd></div>
          <div><dt>{locale === "en" ? "Unknowns" : "Desconocido"}</dt><dd>{copy.unknowns}</dd></div>
        </dl>
        <h3>{label.architecture}</h3>
        <ol className="pg-architecture">{copy.architecture.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section id="pg-panel-actions" className="pg-panel" data-active={panel === "actions"} aria-labelledby="pg-actions-heading">
        <h2 id="pg-actions-heading">{label.actions}</h2>
        {KIND_ORDER.map((kind) => {
          const actions = definition.actions.filter((action) => action.kind === kind);
          if (!actions.length) return null;
          return <div key={kind} className="pg-action-group">
            <h3>{label[KIND_LABEL[kind]]}</h3>
            <ul>
              {actions.map((action) => {
                const item = availability.get(action.id);
                const disabled = !ready || !item?.available;
                const reason = item?.reason === "already-done" ? label.done : item?.reason ? label.unavailable : null;
                return <li key={action.id}>
                  <button type="button" className="pg-action" disabled={disabled} onClick={() => send({ type: "action", actionId: action.id })} aria-describedby={`pg-action-${action.id}-meta`}>
                    <span>{copy.actions[action.id].label}</span>
                    <small id={`pg-action-${action.id}-meta`}>{copy.actions[action.id].description} · {action.minutes} {label.minutes}{action.cost ? ` · ${action.cost} ${label.units}` : ""} · {label[RISK_LABEL[action.risk]]}{reason ? ` · ${reason}` : ""}</small>
                  </button>
                </li>;
              })}
            </ul>
          </div>;
        })}

        <fieldset className="pg-diagnosis" disabled={!ready || state.diagnosis !== null}>
          <legend>{label.diagnose}</legend>
          <p className="pg-muted">{label.diagnoseLead}</p>
          {definition.diagnosis.map((option) => {
            const checked = state.diagnosis ? state.diagnosis.includes(option.id) : hypotheses.includes(option.id);
            return <label key={option.id}>
              <input type="checkbox" checked={checked} onChange={(event) => setHypotheses((current) => event.target.checked ? [...current, option.id].slice(0, MAX_DIAGNOSIS_HYPOTHESES) : current.filter((id) => id !== option.id))} />
              <span>{copy.diagnosis[option.id]}</span>
            </label>;
          })}
          <button type="button" className="ent-secondary-action" disabled={!hypotheses.length || state.diagnosis !== null} onClick={() => send({ type: "diagnose", hypotheses })}>{label.diagnoseSubmit}</button>
        </fieldset>

        <div className="pg-close">
          <button type="button" className="ent-primary-action" disabled={!ready} onClick={() => { if (window.confirm(label.closeConfirm)) send({ type: "close" }); }}>{label.close}</button>
          <button type="button" className="ent-secondary-action" onClick={() => restart()}>{label.restart}</button>
        </div>
      </section>

      <section id="pg-panel-evidence" className="pg-panel" data-active={panel === "evidence"} aria-labelledby="pg-evidence-heading">
        <h2 id="pg-evidence-heading">{label.evidence}</h2>
        {state.revealedEvidence.length ? <ul className="pg-evidence">
          {[...state.revealedEvidence].reverse().map((id) => {
            const kind = definition.evidence.find((item) => item.id === id)?.kind ?? "log";
            return <li key={id}><article><h3><span className="pg-kind">{kind}</span> {copy.evidence[id].title}</h3><pre>{copy.evidence[id].body}</pre></article></li>;
          })}
        </ul> : <p className="pg-muted">{label.noEvidence}</p>}
      </section>

      <section id="pg-panel-timeline" className="pg-panel" data-active={panel === "timeline"} aria-labelledby="pg-timeline-heading">
        <h2 id="pg-timeline-heading">{label.timeline}</h2>
        <ol className="pg-timeline">
          {[...state.events].reverse().map((event) => <li key={event.seq} className={`is-${event.severity}`}><span>{event.atMinute} {label.minutes}</span> {eventText(scenario, locale, event.textKey)}</li>)}
        </ol>
      </section>
    </div>
  </div>;
}

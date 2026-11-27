/**
 * Motor determinista de incidencias de producción.
 *
 * Modelo: estado + entradas -> nuevo estado. Cada acción consume tiempo
 * simulado; durante ese tiempo el sistema evoluciona según las dinámicas del
 * escenario (con el estado previo a la acción) y, al terminar, se aplican los
 * efectos condicionales cuya condición se cumple. Las consecuencias se derivan
 * de reglas y estado, nunca de resultados aleatorios.
 *
 * La única fuente de variación es una semilla reproducible que modula la
 * deriva de las dinámicas pasivas.
 */
import { evaluateCondition } from "../domain/conditions";
import { jitterFor } from "../domain/random";
import type {
  ActionAvailability,
  ActionEffect,
  LearningMode,
  ScenarioDefinition,
  SimulationAction,
  SimulationActionDefinition,
  SimulationEvent,
  SimulationState,
} from "../domain/types";

/** Límite de entradas por intento: evita repeticiones abusivas y payloads enormes. */
export const MAX_SIMULATION_INPUTS = 80;
/** Límite de hipótesis por diagnóstico. */
export const MAX_DIAGNOSIS_HYPOTHESES = 4;

const CHANGE_KINDS = new Set(["mitigate", "change", "recover"]);

export function timeLimitFor(definition: ScenarioDefinition, mode: LearningMode) {
  return mode === "production" ? Math.round(definition.timeLimitMinutes * 0.75) : definition.timeLimitMinutes;
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

function clampMetric(definition: ScenarioDefinition, metricId: string, value: number) {
  const metric = definition.metrics.find((item) => item.id === metricId);
  let next = value;
  if (metric?.min !== undefined) next = Math.max(metric.min, next);
  if (metric?.max !== undefined) next = Math.min(metric.max, next);
  return round(next);
}

export function createSimulation(definition: ScenarioDefinition, options: { seed: number; mode: LearningMode }): SimulationState {
  const derived = definition.derive?.(definition.initialMetrics, definition.initialFlags) ?? {};
  const metrics = { ...definition.initialMetrics };
  for (const [metricId, value] of Object.entries(derived)) metrics[metricId] = clampMetric(definition, metricId, value);
  return {
    scenarioId: definition.id,
    scenarioVersion: definition.version.version,
    seed: options.seed >>> 0,
    mode: options.mode,
    status: "running",
    elapsedMinutes: 0,
    cost: metrics.cost ?? 0,
    metrics,
    flags: { ...definition.initialFlags },
    revealedEvidence: [...definition.initialEvidence],
    performed: [],
    diagnosis: null,
    diagnosisAtStep: null,
    violatedConstraints: [],
    objectivesMetAtMinute: null,
    objectivesMetAtStep: null,
    evidenceBeforeFirstChange: null,
    decisions: [],
    events: [{ seq: 0, atMinute: 0, type: "system", textKey: "system.start", severity: "warning", metricsAfter: { ...metrics } }],
    history: [{ step: 0, atMinute: 0, metrics: { ...metrics } }],
  };
}

export function findAction(definition: ScenarioDefinition, actionId: string): SimulationActionDefinition | undefined {
  return definition.actions.find((action) => action.id === actionId);
}

export function actionAvailability(definition: ScenarioDefinition, state: SimulationState): ActionAvailability[] {
  return definition.actions.map((action) => {
    if (state.status !== "running") return { actionId: action.id, available: false, reason: "finished" };
    if (action.repeatable === false && state.performed.includes(action.id)) return { actionId: action.id, available: false, reason: "already-done" };
    if (!evaluateCondition(action.requires, state)) return { actionId: action.id, available: false, reason: "requires" };
    return { actionId: action.id, available: true };
  });
}

function pushEvent(state: SimulationState, event: Omit<SimulationEvent, "seq" | "atMinute">) {
  state.events.push({ ...event, seq: state.events.length, atMinute: state.elapsedMinutes });
}

function advanceTime(definition: ScenarioDefinition, state: SimulationState, minutes: number) {
  for (let minute = 0; minute < minutes; minute += 1) {
    const snapshot = { ...state, metrics: { ...state.metrics } };
    definition.dynamics.forEach((dynamic, dynamicIndex) => {
      if (!evaluateCondition(dynamic.when, snapshot)) return;
      dynamic.perMinute.forEach((change, changeIndex) => {
        const jitter = jitterFor(state.seed, state.elapsedMinutes, dynamicIndex * 31 + changeIndex, dynamic.jitter ?? 0);
        const current = state.metrics[change.metric] ?? 0;
        const base = change.fromMetric ? change.add * (snapshot.metrics[change.fromMetric] ?? 0) : change.add;
        state.metrics[change.metric] = clampMetric(definition, change.metric, current + base * (1 + jitter));
      });
    });
    state.elapsedMinutes += 1;
    applyDerived(definition, state);
  }
}

function applyDerived(definition: ScenarioDefinition, state: SimulationState) {
  if (!definition.derive) return;
  for (const [metricId, value] of Object.entries(definition.derive(state.metrics, state.flags))) {
    state.metrics[metricId] = clampMetric(definition, metricId, value);
  }
}

function applyEffects(definition: ScenarioDefinition, state: SimulationState, effects: ActionEffect[], actionId: string) {
  // Todas las condiciones se evalúan sobre la misma instantánea para que el
  // resultado no dependa del orden de declaración.
  const snapshot = { ...state, metrics: { ...state.metrics }, flags: { ...state.flags }, revealedEvidence: [...state.revealedEvidence] };
  const applicable = effects.filter((effect) => evaluateCondition(effect.when, snapshot));
  for (const effect of applicable) {
    for (const change of effect.metrics ?? []) {
      const current = state.metrics[change.metric] ?? 0;
      const next = "set" in change ? change.set
        : "add" in change ? current + change.add
          : "multiply" in change ? current * change.multiply
            : "copyFrom" in change ? snapshot.metrics[change.copyFrom] ?? current
              : current + (snapshot.metrics[change.addFrom] ?? 0) * (change.factor ?? 1);
      state.metrics[change.metric] = clampMetric(definition, change.metric, next);
    }
    Object.assign(state.flags, effect.flags ?? {});
    for (const evidenceId of effect.reveals ?? []) {
      if (!state.revealedEvidence.includes(evidenceId)) state.revealedEvidence.push(evidenceId);
    }
    applyDerived(definition, state);
    pushEvent(state, { type: "effect", actionId, textKey: `event.${effect.event}`, severity: effect.severity ?? "info", metricsAfter: { ...state.metrics } });
  }
}

function objectivesMet(definition: ScenarioDefinition, state: SimulationState) {
  return definition.objectives.filter((objective) => objective.required).every((objective) => evaluateCondition(objective.condition, state));
}

function settle(definition: ScenarioDefinition, state: SimulationState) {
  state.cost = round(state.metrics.cost ?? state.cost);
  for (const constraint of definition.constraints) {
    if (state.violatedConstraints.includes(constraint.id)) continue;
    if (evaluateCondition(constraint.violatedWhen, state)) {
      state.violatedConstraints.push(constraint.id);
      pushEvent(state, { type: "system", textKey: `constraint.${constraint.id}`, severity: "critical" });
      if (constraint.critical) {
        state.status = "failed";
        pushEvent(state, { type: "system", textKey: "system.failed", severity: "critical" });
      }
    }
  }
  if (state.status === "running" && state.objectivesMetAtMinute === null && objectivesMet(definition, state)) {
    state.objectivesMetAtMinute = state.elapsedMinutes;
    state.objectivesMetAtStep = state.performed.length;
    pushEvent(state, { type: "system", textKey: "system.objectivesMet", severity: "success" });
  }
  if (state.status === "running" && state.elapsedMinutes >= timeLimitFor(definition, state.mode)) {
    state.status = "expired";
    pushEvent(state, { type: "system", textKey: "system.expired", severity: "critical" });
  }
  state.history.push({ step: state.history.length, atMinute: state.elapsedMinutes, metrics: { ...state.metrics } });
}

function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    metrics: { ...state.metrics },
    flags: { ...state.flags },
    revealedEvidence: [...state.revealedEvidence],
    performed: [...state.performed],
    diagnosis: state.diagnosis ? [...state.diagnosis] : null,
    violatedConstraints: [...state.violatedConstraints],
    evidenceBeforeFirstChange: state.evidenceBeforeFirstChange ? [...state.evidenceBeforeFirstChange] : null,
    decisions: [...state.decisions],
    events: [...state.events],
    history: [...state.history],
  };
}

export class SimulationInputError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "SimulationInputError";
  }
}

/**
 * Aplica una entrada. Devuelve un estado nuevo; nunca muta el recibido.
 * Lanza SimulationInputError si la entrada no es aplicable.
 */
export function applyInput(definition: ScenarioDefinition, current: SimulationState, input: SimulationAction): SimulationState {
  if (current.status !== "running") throw new SimulationInputError("SIMULATION_FINISHED");
  const state = cloneState(current);

  if (input.type === "diagnose") {
    if (state.diagnosis) throw new SimulationInputError("DIAGNOSIS_ALREADY_DECLARED");
    const unique = [...new Set(input.hypotheses)];
    if (!unique.length || unique.length > MAX_DIAGNOSIS_HYPOTHESES || unique.length !== input.hypotheses.length) throw new SimulationInputError("INVALID_DIAGNOSIS");
    if (unique.some((id) => !definition.diagnosis.some((option) => option.id === id))) throw new SimulationInputError("UNKNOWN_HYPOTHESIS");
    state.diagnosis = [...unique].sort();
    state.diagnosisAtStep = state.performed.length;
    pushEvent(state, { type: "diagnosis", textKey: "system.diagnosis", severity: "info" });
    return state;
  }

  if (input.type === "close") {
    const met = objectivesMet(definition, state);
    state.status = met ? "recovered" : "failed";
    pushEvent(state, { type: "system", textKey: met ? "system.closedRecovered" : "system.closedUnresolved", severity: met ? "success" : "critical" });
    if (met && state.objectivesMetAtMinute === null) {
      state.objectivesMetAtMinute = state.elapsedMinutes;
      state.objectivesMetAtStep = state.performed.length;
    }
    return state;
  }

  const action = findAction(definition, input.actionId);
  if (!action) throw new SimulationInputError("UNKNOWN_ACTION");
  const availability = actionAvailability(definition, state).find((item) => item.actionId === action.id);
  if (!availability?.available) throw new SimulationInputError(availability?.reason === "already-done" ? "ACTION_ALREADY_DONE" : "ACTION_NOT_AVAILABLE");

  // La valoración pedagógica se hace con el estado previo: lo que el usuario sabía al decidir.
  const assessment = action.assessment.find((rule) => evaluateCondition(rule.when, state)) ?? { verdict: "neutral" as const, note: "neutral" };
  state.decisions.push({ step: state.performed.length + 1, actionId: action.id, verdict: assessment.verdict, note: assessment.note, atMinute: state.elapsedMinutes });
  if (CHANGE_KINDS.has(action.kind) && state.evidenceBeforeFirstChange === null) state.evidenceBeforeFirstChange = [...state.revealedEvidence];

  pushEvent(state, { type: "action", actionId: action.id, textKey: `action.${action.id}`, severity: "info" });
  advanceTime(definition, state, action.minutes);
  state.metrics.cost = clampMetric(definition, "cost", (state.metrics.cost ?? 0) + action.cost);
  state.performed.push(action.id);
  applyEffects(definition, state, action.effects, action.id);
  settle(definition, state);
  return state;
}

/** Re-ejecuta una secuencia completa de entradas. Base de la corrección en servidor. */
export function replay(definition: ScenarioDefinition, options: { seed: number; mode: LearningMode }, inputs: SimulationAction[]): SimulationState {
  if (inputs.length > MAX_SIMULATION_INPUTS) throw new SimulationInputError("TOO_MANY_INPUTS");
  return inputs.reduce((state, input) => applyInput(definition, state, input), createSimulation(definition, options));
}

export function isTerminal(state: SimulationState) {
  return state.status !== "running";
}

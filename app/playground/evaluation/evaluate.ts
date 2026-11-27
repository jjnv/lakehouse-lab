/**
 * Evaluación transparente de un intento. No mide solo si el sistema se
 * recuperó: pondera diagnóstico, evidencias, orden, tiempo, coste, riesgo,
 * integridad, SLA, validación y prevención. Las puntuaciones son orientativas
 * y van acompañadas de su motivo; no son una medición oficial de competencia.
 */
import { compare } from "../domain/conditions";
import type {
  EvaluationDimension,
  EvaluationResult,
  ScenarioDefinition,
  ScoredDimension,
  SimulationState,
  SkillEvidence,
} from "../domain/types";
import { EVALUATION_DIMENSIONS } from "../domain/types";

/** Penalización explícita por pérdida o corrupción de datos (puntos sobre 100). */
export const INTEGRITY_PENALTY = 30;
/** Techo de puntuación cuando el incidente no se recupera. */
export const UNRESOLVED_CAP = 40;

const RISK_WEIGHT = { none: 0, low: 0.05, medium: 0.15, high: 0.3 } as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ratio(part: number, total: number) {
  return total ? part / total : 1;
}

function budgetScore(actual: number, reference: number) {
  if (actual <= reference) return 1;
  return clamp01(1 - (actual - reference) / reference);
}

export function evaluateAttempt(definition: ScenarioDefinition, state: SimulationState): EvaluationResult {
  const rubric = definition.rubric;
  const productionFactor = state.mode === "production" ? 0.8 : 1;
  const roots = definition.diagnosis.filter((option) => option.role === "root").map((option) => option.id);
  const contributing = definition.diagnosis.filter((option) => option.role === "contributing").map((option) => option.id);
  const selected = state.diagnosis ?? [];
  const wrong = selected.filter((id) => {
    const role = definition.diagnosis.find((option) => option.id === id)?.role;
    return role === "wrong" || role === "symptom";
  });
  const rootsFound = roots.filter((id) => selected.includes(id)).length;
  const contributingFound = contributing.filter((id) => selected.includes(id)).length;
  const correctRoot = roots.length > 0 && rootsFound === roots.length;

  const scored: Record<EvaluationDimension, Omit<ScoredDimension, "dimension" | "weight">> = {} as never;

  scored.diagnosis = state.diagnosis
    ? {
      score: clamp01(0.6 * ratio(rootsFound, roots.length) + 0.25 * ratio(contributingFound, contributing.length) + (wrong.length ? 0 : 0.15) - 0.2 * wrong.length),
      reason: correctRoot ? (wrong.length ? "diagnosis.rootWithNoise" : "diagnosis.root") : "diagnosis.missedRoot",
      detail: { rootsFound, roots: roots.length, contributingFound, contributing: contributing.length, wrong: wrong.length },
    }
    : { score: 0, reason: "diagnosis.none" };

  const expected = rubric.expectedEvidence;
  const beforeChange = state.evidenceBeforeFirstChange ?? state.revealedEvidence;
  const beforeCount = expected.filter((id) => beforeChange.includes(id)).length;
  const finalCount = expected.filter((id) => state.revealedEvidence.includes(id)).length;
  scored.evidence = {
    score: clamp01(0.7 * ratio(beforeCount, expected.length) + 0.3 * ratio(finalCount, expected.length)),
    reason: beforeCount === expected.length ? "evidence.complete" : beforeCount ? "evidence.partial" : "evidence.actedBlind",
    detail: { beforeChange: beforeCount, total: expected.length, final: finalCount },
  };

  const firstChangeStep = state.decisions.find((decision) => {
    const action = definition.actions.find((item) => item.id === decision.actionId);
    return action && (action.kind === "change" || action.kind === "recover" || action.kind === "mitigate");
  })?.step ?? null;
  const diagnosedBeforeChange = state.diagnosisAtStep !== null && (firstChangeStep === null || state.diagnosisAtStep < firstChangeStep);
  const investigatedFirst = state.decisions.length > 0 && definition.actions.find((item) => item.id === state.decisions[0].actionId)?.kind === "investigate";
  const firstRecoverStep = state.decisions.find((decision) => definition.actions.find((item) => item.id === decision.actionId)?.kind === "recover")?.step ?? null;
  const validatedAfterRecovery = firstRecoverStep !== null && state.decisions.some((decision) => decision.step > firstRecoverStep && rubric.validationActions.includes(decision.actionId));
  const orderingChecks = [diagnosedBeforeChange, investigatedFirst, validatedAfterRecovery];
  scored.ordering = {
    score: orderingChecks.filter(Boolean).length / orderingChecks.length,
    reason: orderingChecks.every(Boolean) ? "ordering.sound" : !diagnosedBeforeChange ? "ordering.changedBeforeDiagnosis" : !investigatedFirst ? "ordering.noInitialInvestigation" : "ordering.noPostValidation",
    detail: { diagnosedBeforeChange: Number(diagnosedBeforeChange), investigatedFirst: Number(investigatedFirst), validatedAfterRecovery: Number(validatedAfterRecovery) },
  };

  const referenceMinutes = rubric.referenceMinutes * productionFactor;
  scored.time = {
    score: budgetScore(state.elapsedMinutes, referenceMinutes),
    reason: state.elapsedMinutes <= referenceMinutes ? "time.withinReference" : "time.overReference",
    detail: { minutes: state.elapsedMinutes, reference: Math.round(referenceMinutes) },
  };

  const spent = state.cost - (definition.initialMetrics.cost ?? 0);
  const referenceCost = rubric.referenceCost * productionFactor;
  scored.cost = {
    score: budgetScore(spent, referenceCost),
    reason: spent <= referenceCost ? "cost.withinReference" : "cost.overReference",
    detail: { cost: Math.round(spent * 100) / 100, reference: Math.round(referenceCost * 100) / 100 },
  };

  let riskPenalty = 0;
  for (const decision of state.decisions) {
    const action = definition.actions.find((item) => item.id === decision.actionId);
    if (!action) continue;
    if (decision.verdict === "dangerous") riskPenalty += Math.max(0.25, RISK_WEIGHT[action.risk]);
    else if (decision.verdict === "unnecessary") riskPenalty += RISK_WEIGHT[action.risk];
  }
  scored.risk = {
    score: clamp01(1 - riskPenalty),
    reason: riskPenalty === 0 ? "risk.controlled" : "risk.unjustified",
    detail: { dangerous: state.decisions.filter((decision) => decision.verdict === "dangerous").length },
  };

  const integrityBreaches = rubric.integrityFlags.filter((flag) => state.flags[flag]);
  scored.integrity = {
    score: integrityBreaches.length ? 0 : 1,
    reason: integrityBreaches.length ? "integrity.compromised" : "integrity.preserved",
    detail: { breaches: integrityBreaches.length },
  };

  const slaValue = state.metrics[rubric.sla.metric] ?? Number.NaN;
  const slaMet = compare(slaValue, rubric.sla.op, rubric.sla.value);
  scored.sla = {
    score: slaMet ? 1 : 0,
    reason: slaMet ? "sla.met" : "sla.missed",
    detail: { value: slaValue, target: rubric.sla.value },
  };

  const validationDone = rubric.validationActions.filter((id) => state.performed.includes(id)).length;
  scored.validation = {
    score: ratio(validationDone, rubric.validationActions.length),
    reason: validationDone === rubric.validationActions.length ? "validation.complete" : validationDone ? "validation.partial" : "validation.missing",
    detail: { done: validationDone, total: rubric.validationActions.length },
  };

  const preventionDone = rubric.preventionActions.filter((id) => state.performed.includes(id)).length;
  scored.prevention = {
    score: ratio(preventionDone, rubric.preventionActions.length),
    reason: preventionDone === rubric.preventionActions.length ? "prevention.complete" : preventionDone ? "prevention.partial" : "prevention.missing",
    detail: { done: preventionDone, total: rubric.preventionActions.length },
  };

  const dimensions: ScoredDimension[] = EVALUATION_DIMENSIONS.map((dimension) => ({ dimension, weight: rubric.weights[dimension], ...scored[dimension] }));
  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  let score = totalWeight ? dimensions.reduce((sum, item) => sum + item.weight * item.score, 0) / totalWeight * 100 : 0;
  const penalties = integrityBreaches.map((flag) => ({ id: `integrity.${flag}`, points: INTEGRITY_PENALTY }));
  score -= penalties.reduce((sum, penalty) => sum + penalty.points, 0);
  if (state.status !== "recovered") score = Math.min(score, UNRESOLVED_CAP);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const solved = state.status === "recovered" && correctRoot && integrityBreaches.length === 0;
  const modeFactor = state.mode === "guided" ? 0.7 : state.mode === "practice" ? 0 : 1;
  const skills: SkillEvidence[] = modeFactor === 0 || state.status === "running"
    ? []
    : definition.skills.map((skillId) => ({
      skillId,
      level: solved ? "problem-solved" : "simulation-applied",
      strength: Math.round((score / 100) * modeFactor * 100) / 100,
      source: { kind: "scenario", id: definition.id, version: definition.version.version },
    }));

  return {
    scenarioId: definition.id,
    scenarioVersion: definition.version.version,
    status: state.status,
    score,
    dimensions,
    decisions: state.decisions,
    diagnosis: { selected, correctRoot, missedContributing: contributing.filter((id) => !selected.includes(id)), wrong },
    penalties,
    skills,
    durationMinutes: state.elapsedMinutes,
    cost: Math.round(spent * 100) / 100,
  };
}

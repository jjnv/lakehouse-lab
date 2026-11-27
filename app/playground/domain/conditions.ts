import type { ComparisonOp, Condition, SimulationState } from "./types";

export function compare(left: number, op: ComparisonOp, right: number): boolean {
  switch (op) {
    case "lt": return left < right;
    case "lte": return left <= right;
    case "gt": return left > right;
    case "gte": return left >= right;
    case "eq": return left === right;
  }
}

type ConditionState = Pick<SimulationState, "flags" | "metrics" | "revealedEvidence" | "performed" | "elapsedMinutes">;

/** Evalúa una condición declarativa contra el estado. Pura y determinista. */
export function evaluateCondition(condition: Condition | undefined, state: ConditionState): boolean {
  if (!condition) return true;
  if ("all" in condition) return condition.all.every((item) => evaluateCondition(item, state));
  if ("any" in condition) return condition.any.some((item) => evaluateCondition(item, state));
  if ("not" in condition) return !evaluateCondition(condition.not, state);
  if ("flag" in condition) return Boolean(state.flags[condition.flag]) === (condition.is ?? true);
  if ("metric" in condition) {
    const value = state.metrics[condition.metric];
    return typeof value === "number" && compare(value, condition.op, condition.value);
  }
  if ("evidence" in condition) return state.revealedEvidence.includes(condition.evidence);
  if ("done" in condition) return state.performed.includes(condition.done);
  if ("elapsedMinutes" in condition) return compare(state.elapsedMinutes, condition.elapsedMinutes, condition.value);
  return false;
}

/** Recoge identificadores referenciados (para validar la integridad de escenarios). */
export function conditionReferences(condition: Condition | undefined, into = { flags: new Set<string>(), metrics: new Set<string>(), evidence: new Set<string>(), actions: new Set<string>() }) {
  if (!condition) return into;
  if ("all" in condition) condition.all.forEach((item) => conditionReferences(item, into));
  else if ("any" in condition) condition.any.forEach((item) => conditionReferences(item, into));
  else if ("not" in condition) conditionReferences(condition.not, into);
  else if ("flag" in condition) into.flags.add(condition.flag);
  else if ("metric" in condition) into.metrics.add(condition.metric);
  else if ("evidence" in condition) into.evidence.add(condition.evidence);
  else if ("done" in condition) into.actions.add(condition.done);
  return into;
}

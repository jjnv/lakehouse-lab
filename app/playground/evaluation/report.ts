/**
 * Informe post mortem educativo generado a partir de los eventos reales de la
 * simulación y de la evaluación. Puro: se usa en la UI y en las pruebas.
 */
import type { EvaluationResult, LocalizedScenario, PlaygroundLocale, SimulationState } from "../domain/types";
import { eventText, noteText } from "../i18n/resolve";
import { PLAYGROUND_UI } from "../i18n/ui";

export type LessonLink = { href: string; label: string };

export function buildPostmortemMarkdown(scenario: LocalizedScenario, locale: PlaygroundLocale, state: SimulationState, evaluation: EvaluationResult, lessons: LessonLink[]): string {
  const ui = PLAYGROUND_UI[locale];
  const copy = scenario.copy[locale];
  const label = ui.labels;
  const definition = scenario.definition;
  const lines: string[] = [];
  const list = (items: string[]) => (items.length ? items.map((item) => `- ${item}`) : ["- —"]);
  const decisions = (verdict: string) => evaluation.decisions.filter((decision) => decision.verdict === verdict)
    .map((decision) => `${copy.actions[decision.actionId]?.label ?? decision.actionId} — ${noteText(scenario, locale, decision.note) ?? ""}`);

  lines.push(`# ${label.report}: ${copy.title}`, "");
  lines.push(`> ${label.syntheticNotice}`, "");
  lines.push(`- ${label.status}: ${ui.statuses[state.status]}`);
  lines.push(`- ${label.score}: ${evaluation.score}/100`);
  lines.push(`- ${label.mode}: ${ui.modes[state.mode].label}`);
  lines.push(`- ${label.elapsed}: ${state.elapsedMinutes} ${label.minutes} · ${label.cost}: ${evaluation.cost} ${label.units}`);
  lines.push(`- ${label.version}: ${definition.version.version} · ${label.seed}: ${state.seed}`, "");

  lines.push(`## ${label.chronology}`, "");
  for (const event of state.events) {
    if (event.type === "effect" && !event.actionId) continue;
    const text = eventText(scenario, locale, event.textKey) ?? event.textKey;
    lines.push(`- [${event.atMinute} ${label.minutes}] ${event.type === "action" ? `**${text}**` : text}`);
  }
  lines.push("");

  lines.push(`## ${label.yourDiagnosis}`, "");
  lines.push(...list(evaluation.diagnosis.selected.map((id) => {
    const role = definition.diagnosis.find((option) => option.id === id)?.role ?? "wrong";
    return `${copy.diagnosis[id]} (${ui.diagnosisRoles[role]})`;
  })), "");

  lines.push(`## ${label.rootCause}`, "", copy.retrospective.rootCause, "");
  lines.push(`## ${label.symptoms}`, "", ...list(copy.retrospective.symptoms), "");
  lines.push(`## ${label.aggravating}`, "", ...list(copy.retrospective.aggravating), "");
  lines.push(`## ${label.goodActions}`, "", ...list(decisions("good")), "");
  lines.push(`## ${label.unnecessaryActions}`, "", ...list(decisions("unnecessary")), "");
  lines.push(`## ${label.dangerousActions}`, "", ...list(decisions("dangerous")), "");
  lines.push(`## ${label.alternatives}`, "", ...list(copy.retrospective.alternatives), "");

  lines.push(`## ${label.score}`, "");
  for (const dimension of evaluation.dimensions) {
    lines.push(`- ${ui.dimensions[dimension.dimension]}: ${Math.round(dimension.score * 100)} % (${ui.reasons[dimension.reason] ?? dimension.reason})`);
  }
  if (evaluation.penalties.length) lines.push(`- ${label.penalties}: ${evaluation.penalties.map((penalty) => `−${penalty.points}`).join(", ")}`);
  lines.push("");

  lines.push(`## ${label.prevention}`, "", ...list(copy.retrospective.prevention), "");
  lines.push(`## ${label.lessons}`, "", ...list(lessons.map((lesson) => `[${lesson.label}](${lesson.href})`)), "");
  lines.push(`## ${label.improvementPlan}`, "", ...list(copy.retrospective.improvementPlan), "");
  lines.push(`## ${label.limitations}`, "", ...list(copy.limitations), "");
  return lines.join("\n");
}

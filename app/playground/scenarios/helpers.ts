import type { SimulationActionDefinition } from "../domain/types";
import type { SkillId } from "../domain/skills";

/** Acción de investigación de una sola vez que revela una evidencia. */
export function investigate(id: string, minutes: number, evidence: string, note: string, skills: SkillId[], cost = 0): SimulationActionDefinition {
  return {
    id,
    kind: "investigate",
    minutes,
    cost,
    risk: "none",
    repeatable: false,
    skills,
    effects: [{ event: `${id}`, reveals: [evidence] }],
    assessment: [{ verdict: "good", note }],
  };
}

/** Acción para dejar pasar tiempo observando el sistema. */
export function observe(id: string, minutes: number, goodWhenFlag?: string): SimulationActionDefinition {
  return {
    id,
    kind: "investigate",
    minutes,
    cost: 0,
    risk: "none",
    skills: ["observability"],
    effects: [{ event: "observed" }],
    assessment: goodWhenFlag
      ? [{ when: { flag: goodWhenFlag }, verdict: "good", note: "observeDrain" }, { verdict: "neutral", note: "observeWithoutChange" }]
      : [{ verdict: "neutral", note: "observeWithoutChange" }],
  };
}

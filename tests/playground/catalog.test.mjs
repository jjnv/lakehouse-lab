import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { loadModules } from "./load.mjs";

const { modules, cleanup } = await loadModules([
  "app/playground/scenarios/index.ts",
  "app/playground/domain/conditions.ts",
  "app/playground/domain/skills.ts",
  "app/playground/i18n/ui.ts",
  "app/playground/i18n/resolve.ts",
]);
after(cleanup);

const { PLAYGROUND_SCENARIOS } = modules["app/playground/scenarios/index.ts"];
const { conditionReferences } = modules["app/playground/domain/conditions.ts"];
const { SKILL_IDS, SKILL_LABELS } = modules["app/playground/domain/skills.ts"];
const { PLAYGROUND_UI, PLAYGROUND_ROADMAP } = modules["app/playground/i18n/ui.ts"];
const { eventText, noteText } = modules["app/playground/i18n/resolve.ts"];
const courseSource = readFileSync("app/course-data.ts", "utf8");

function allConditions(definition, hints) {
  const conditions = [];
  for (const action of definition.actions) {
    conditions.push(action.requires);
    action.effects.forEach((effect) => conditions.push(effect.when));
    action.assessment.forEach((rule) => conditions.push(rule.when));
  }
  definition.dynamics.forEach((dynamic) => conditions.push(dynamic.when));
  definition.objectives.forEach((objective) => conditions.push(objective.condition));
  definition.constraints.forEach((constraint) => conditions.push(constraint.violatedWhen));
  hints.forEach((hint) => conditions.push(hint.when));
  const refs = { flags: new Set(), metrics: new Set(), evidence: new Set(), actions: new Set() };
  conditions.forEach((condition) => conditionReferences(condition, refs));
  return refs;
}

test("scenario ids are unique and stable kebab-case", () => {
  const ids = PLAYGROUND_SCENARIOS.map((s) => s.definition.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^[a-z0-9][a-z0-9-]+$/u));
});

for (const scenario of PLAYGROUND_SCENARIOS) {
  const definition = scenario.definition;
  test(`${definition.id}: definition is internally consistent`, () => {
    const metricIds = new Set(definition.metrics.map((m) => m.id));
    const evidenceIds = new Set(definition.evidence.map((e) => e.id));
    const actionIds = new Set(definition.actions.map((a) => a.id));
    assert.equal(actionIds.size, definition.actions.length, "acciones duplicadas");
    assert.ok(metricIds.has("cost"), "toda simulación registra coste");
    const refs = allConditions(definition, scenario.hints);
    refs.flags.forEach((flag) => assert.ok(flag in definition.initialFlags, `flag desconocido ${flag}`));
    refs.metrics.forEach((metric) => assert.ok(metricIds.has(metric), `métrica desconocida ${metric}`));
    refs.evidence.forEach((id) => assert.ok(evidenceIds.has(id), `evidencia desconocida ${id}`));
    refs.actions.forEach((id) => assert.ok(actionIds.has(id), `acción desconocida ${id}`));
    for (const action of definition.actions) {
      assert.ok(action.assessment.length > 0, `${action.id} sin valoración`);
      action.skills.forEach((skill) => assert.ok(SKILL_IDS.includes(skill)));
      for (const effect of action.effects) {
        Object.keys(effect.flags ?? {}).forEach((flag) => assert.ok(flag in definition.initialFlags, `${action.id}: flag ${flag}`));
        (effect.metrics ?? []).forEach((change) => assert.ok(metricIds.has(change.metric), `${action.id}: métrica ${change.metric}`));
        (effect.reveals ?? []).forEach((id) => assert.ok(evidenceIds.has(id), `${action.id}: evidencia ${id}`));
      }
    }
    Object.keys(definition.initialMetrics).forEach((metric) => assert.ok(metricIds.has(metric)));
    definition.initialEvidence.forEach((id) => assert.ok(evidenceIds.has(id)));
    assert.ok(definition.diagnosis.some((option) => option.role === "root"));
    assert.ok(definition.diagnosis.some((option) => option.role === "wrong"), "debe haber hipótesis incorrectas plausibles");
    definition.referenceDiagnosis.forEach((id) => assert.ok(definition.diagnosis.some((option) => option.id === id)));
    const rubric = definition.rubric;
    rubric.expectedEvidence.forEach((id) => assert.ok(evidenceIds.has(id)));
    [...rubric.validationActions, ...rubric.preventionActions].forEach((id) => assert.ok(actionIds.has(id), id));
    rubric.integrityFlags.forEach((flag) => assert.ok(flag in definition.initialFlags));
    assert.ok(metricIds.has(rubric.sla.metric));
    assert.ok(actionIds.has(definition.waitActionId));
    definition.referencePaths.flatMap((path) => path.actions).filter((token) => !token.startsWith("@")).forEach((id) => assert.ok(actionIds.has(id), id));
    assert.ok(definition.actions.some((action) => action.assessment.some((rule) => rule.verdict === "dangerous")), "debe existir al menos una acción peligrosa");
  });

  test(`${definition.id}: editorial metadata and curriculum references are real`, () => {
    assert.match(definition.version.version, /^\d+\.\d+\.\d+$/u);
    assert.match(definition.version.reviewedAt, /^\d{4}-\d{2}-\d{2}$/u);
    assert.ok(definition.version.authors.length > 0);
    assert.notEqual(definition.version.reviewStatus, "reviewed", "no declaramos revisiones independientes inexistentes");
    assert.equal(definition.executionKind, "conceptual-simulation");
    assert.ok(definition.technologies.length > 0 && definition.compatibility.length > 10);
    assert.ok(definition.sources.length >= 2);
    definition.sources.forEach((source) => assert.match(source.url, /^https:\/\/(docs\.databricks\.com|spark\.apache\.org|docs\.delta\.io)\//u));
    assert.ok(definition.curriculum.length > 0);
    for (const ref of definition.curriculum) {
      const moduleNumber = Number(ref.moduleId.slice(1));
      assert.ok(/^m\d{2}$/u.test(ref.moduleId) && moduleNumber >= 1 && moduleNumber <= 32, ref.moduleId);
      assert.ok(courseSource.includes(`id:"${ref.moduleId}"`), `módulo inexistente ${ref.moduleId}`);
      if (ref.lessonId) assert.match(ref.lessonId, new RegExp(`^${ref.moduleId}-l[1-5]$`, "u"));
    }
    definition.skills.forEach((skill) => assert.ok(SKILL_IDS.includes(skill)));
  });

  test(`${definition.id}: Spanish and English copy are complete and aligned`, () => {
    const { es, en } = scenario.copy;
    const keyed = ["metrics", "actions", "evidence", "events", "diagnosis", "objectives", "constraints", "notes"];
    for (const field of keyed) assert.deepEqual(Object.keys(en[field]).sort(), Object.keys(es[field]).sort(), `claves distintas en ${field}`);
    assert.deepEqual(en.hints.map((h) => h.id), es.hints.map((h) => h.id));
    assert.deepEqual(scenario.hints.map((h) => h.id), es.hints.map((h) => h.id));
    assert.deepEqual(Object.keys(es.actions).sort(), definition.actions.map((a) => a.id).sort());
    assert.deepEqual(Object.keys(es.evidence).sort(), definition.evidence.map((e) => e.id).sort());
    assert.deepEqual(Object.keys(es.diagnosis).sort(), definition.diagnosis.map((d) => d.id).sort());
    assert.deepEqual(Object.keys(es.metrics).sort(), definition.metrics.map((m) => m.id).sort());
    assert.deepEqual(Object.keys(es.objectives).sort(), definition.objectives.map((o) => o.id).sort());
    assert.deepEqual(Object.keys(es.constraints).sort(), definition.constraints.map((c) => c.id).sort());
    for (const locale of ["es", "en"]) {
      const copy = scenario.copy[locale];
      for (const action of definition.actions) {
        for (const effect of action.effects) assert.ok(eventText(scenario, locale, `event.${effect.event}`), `${locale}: evento ${effect.event}`);
        for (const rule of action.assessment) assert.ok(noteText(scenario, locale, rule.note), `${locale}: nota ${rule.note}`);
      }
      definition.constraints.forEach((constraint) => assert.ok(eventText(scenario, locale, `constraint.${constraint.id}`)));
      for (const text of [copy.title, copy.summary, copy.business, copy.retrospective.rootCause, ...copy.architecture, ...copy.limitations]) assert.ok(text.trim().length > 0);
      assert.ok(copy.retrospective.alternatives.length >= 2 && copy.retrospective.prevention.length >= 2);
    }
    assert.notEqual(en.title, es.title);
    assert.notEqual(en.retrospective.rootCause, es.retrospective.rootCause);
  });
}

test("shared UI text and skills have identical keys in both languages", () => {
  for (const field of Object.keys(PLAYGROUND_UI.es)) {
    assert.deepEqual(Object.keys(PLAYGROUND_UI.en[field]).sort(), Object.keys(PLAYGROUND_UI.es[field]).sort(), field);
  }
  assert.deepEqual(Object.keys(SKILL_LABELS.en).sort(), [...SKILL_IDS].sort());
  assert.deepEqual(Object.keys(SKILL_LABELS.es).sort(), [...SKILL_IDS].sort());
  assert.deepEqual(PLAYGROUND_ROADMAP.en.map((item) => item.id), PLAYGROUND_ROADMAP.es.map((item) => item.id));
});

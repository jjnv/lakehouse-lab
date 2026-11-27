import assert from "node:assert/strict";
import test, { after } from "node:test";
import { loadModules, runPath } from "./load.mjs";

const { modules, cleanup } = await loadModules([
  "app/playground/engines/incident-engine.ts",
  "app/playground/evaluation/evaluate.ts",
  "app/playground/evaluation/report.ts",
  "app/playground/scenarios/index.ts",
]);
after(cleanup);

const engine = modules["app/playground/engines/incident-engine.ts"];
const { evaluateAttempt } = modules["app/playground/evaluation/evaluate.ts"];
const { buildPostmortemMarkdown } = modules["app/playground/evaluation/report.ts"];
const { PLAYGROUND_SCENARIOS } = modules["app/playground/scenarios/index.ts"];

test("the postmortem is built from the real simulation events in both languages", () => {
  for (const scenario of PLAYGROUND_SCENARIOS) {
    const definition = scenario.definition;
    const state = runPath(engine, definition, definition.referencePaths[0].actions);
    const evaluation = evaluateAttempt(definition, state);
    for (const locale of ["es", "en"]) {
      const copy = scenario.copy[locale];
      const markdown = buildPostmortemMarkdown(scenario, locale, state, evaluation, [{ href: "/curso/x/m01-l1", label: "Lección" }]);
      assert.ok(markdown.includes(copy.retrospective.rootCause));
      assert.ok(markdown.includes(`${evaluation.score}/100`));
      for (const decision of evaluation.decisions) assert.ok(markdown.includes(copy.actions[decision.actionId].label), decision.actionId);
      assert.doesNotMatch(markdown, /\b(event|action|system|constraint)\.[a-zA-Z-]+/u, "no deben quedar claves sin traducir");
      assert.ok(markdown.includes("](/curso/x/m01-l1)"));
    }
  }
});

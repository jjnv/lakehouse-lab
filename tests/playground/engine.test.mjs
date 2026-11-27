import assert from "node:assert/strict";
import test, { after } from "node:test";
import { loadModules, runPath } from "./load.mjs";

const { modules, cleanup } = await loadModules([
  "app/playground/engines/incident-engine.ts",
  "app/playground/evaluation/evaluate.ts",
  "app/playground/scenarios/index.ts",
  "app/playground/domain/attempt-contract.ts",
]);
after(cleanup);

const engine = modules["app/playground/engines/incident-engine.ts"];
const { evaluateAttempt, INTEGRITY_PENALTY, UNRESOLVED_CAP } = modules["app/playground/evaluation/evaluate.ts"];
const { PLAYGROUND_SCENARIOS, scenarioById } = modules["app/playground/scenarios/index.ts"];
const { parseAttemptPayload } = modules["app/playground/domain/attempt-contract.ts"];
const def = (id) => scenarioById(id).definition;
const act = (actionId) => ({ type: "action", actionId });

test("the catalog ships five complete incident scenarios", () => {
  assert.equal(PLAYGROUND_SCENARIOS.length, 5);
  assert.deepEqual(new Set(PLAYGROUND_SCENARIOS.map((s) => s.definition.category)), new Set(["streaming", "delta", "performance", "governance", "orchestration"]));
});

test("simulation is deterministic for a seed and does not mutate previous states", () => {
  const definition = def("streaming-state-growth");
  const inputs = [act("inspect-state-store"), act("observe-pipeline"), act("scale-cluster"), act("observe-pipeline")];
  const first = engine.replay(definition, { seed: 7, mode: "evaluation" }, inputs);
  const second = engine.replay(definition, { seed: 7, mode: "evaluation" }, inputs);
  assert.deepEqual(first, second);
  const other = engine.replay(definition, { seed: 8, mode: "evaluation" }, inputs);
  assert.notEqual(first.metrics.backlog, other.metrics.backlog, "la semilla modula la deriva pasiva");
  const before = engine.createSimulation(definition, { seed: 1, mode: "guided" });
  const snapshot = JSON.stringify(before);
  engine.applyInput(definition, before, act("inspect-plan"));
  assert.equal(JSON.stringify(before), snapshot);
});

for (const scenario of PLAYGROUND_SCENARIOS) {
  const definition = scenario.definition;
  test(`${definition.id}: every reference path recovers with integrity and a high score`, () => {
    assert.ok(definition.referencePaths.length >= 2, "al menos dos rutas válidas");
    for (const path of definition.referencePaths) {
      const state = runPath(engine, definition, path.actions);
      assert.equal(state.status, "recovered", `${path.id} debe recuperarse`);
      const result = evaluateAttempt(definition, state);
      assert.ok(result.score >= 85, `${path.id}: ${result.score}`);
      assert.equal(result.dimensions.find((d) => d.dimension === "integrity").score, 1);
      assert.equal(result.diagnosis.correctRoot, true);
      assert.ok(result.skills.length > 0);
    }
  });

  test(`${definition.id}: actions change state and time passes`, () => {
    const start = engine.createSimulation(definition, { seed: 3, mode: "evaluation" });
    const investigated = engine.applyInput(definition, start, act(definition.actions[0].id));
    assert.ok(investigated.elapsedMinutes > 0);
    assert.ok(investigated.revealedEvidence.length > start.revealedEvidence.length, "investigar revela evidencias nuevas");
    assert.equal(investigated.history.length, 2);
  });
}

test("streaming: scaling raises cost without fixing unbounded state", () => {
  const definition = def("streaming-state-growth");
  const state = engine.replay(definition, { seed: 1, mode: "evaluation" }, [act("inspect-state-store"), act("scale-cluster"), ...Array(5).fill(act("observe-pipeline"))]);
  const baseline = engine.replay(definition, { seed: 1, mode: "evaluation" }, [act("inspect-state-store"), act("increase-trigger-interval"), ...Array(5).fill(act("observe-pipeline"))]);
  assert.ok(state.metrics.stateGb > definition.initialMetrics.stateGb, "el estado sigue creciendo");
  assert.ok(state.metrics.cost > baseline.metrics.cost, "escalar cuesta más");
  assert.equal(state.flags.stateBounded, false);
  assert.equal(state.objectivesMetAtMinute, null);
});

test("streaming: changing the stateful operator without a checkpoint plan fails to start", () => {
  const definition = def("streaming-state-growth");
  const state = engine.replay(definition, { seed: 1, mode: "evaluation" }, [act("inspect-state-store"), act("stop-query"), act("deploy-within-watermark")]);
  assert.equal(state.flags.fixApplied, false);
  assert.ok(state.revealedEvidence.includes("incompatible-state"));
  assert.equal(state.decisions.at(-1).verdict, "dangerous");
});

test("streaming: a fast recovery with data loss scores worse than a slower safe one", () => {
  const definition = def("streaming-state-growth");
  const safe = evaluateAttempt(definition, runPath(engine, definition, definition.referencePaths[0].actions));
  const lossy = runPath(engine, definition, ["inspect-state-store", "inspect-plan", "review-change-history", "inspect-event-time", "inspect-checkpoint", "@diagnose", "delete-checkpoint", "plan-checkpoint-migration", "stop-query", "deploy-within-watermark", "reconcile-boundary", "monitor-state-after-fix", "@drain", "compare-counts", "@close"]);
  const lossyResult = evaluateAttempt(definition, lossy);
  assert.ok(lossy.flags.dataLoss);
  assert.ok(lossy.elapsedMinutes < safe.durationMinutes, "la ruta con pérdida es más rápida");
  assert.ok(lossyResult.score <= safe.score - INTEGRITY_PENALTY, `${lossyResult.score} vs ${safe.score}`);
  assert.ok(lossyResult.penalties.some((penalty) => penalty.id === "integrity.dataLoss"));
});

test("merge: deleting the whole batch hides the symptom but never recovers", () => {
  const definition = def("merge-not-idempotent");
  const state = runPath(engine, definition, ["describe-history", "review-merge-code", "@diagnose", "delete-batch", "fix-pipeline", "rebuild-gold", "@close"]);
  assert.equal(state.status, "failed");
  const result = evaluateAttempt(definition, state);
  assert.ok(result.score <= UNRESOLVED_CAP);
  assert.equal(result.dimensions.find((d) => d.dimension === "integrity").score, 0);
});

test("merge: RESTORE without re-applying later writes is not a recovery", () => {
  const definition = def("merge-not-idempotent");
  const state = runPath(engine, definition, ["describe-history", "review-merge-code", "@diagnose", "fix-pipeline", "restore-table", "rerun-merge-day", "rebuild-gold", "@close"]);
  assert.equal(state.flags.addressUpdatesLost, true);
  assert.equal(state.status, "failed");
});

test("skew: filtering the hot key is faster but cannot pass result validation", () => {
  const definition = def("data-skew-join");
  const state = runPath(engine, definition, ["open-spark-ui-stages", "query-key-distribution", "@diagnose", "filter-guest", "run-full-job", "validate-equivalence", "@close"]);
  assert.equal(state.flags.rowsLost, true);
  assert.equal(state.status, "failed");
  const scaled = engine.replay(definition, { seed: 1, mode: "evaluation" }, [act("scale-out")]);
  assert.ok(scaled.metrics.jobMinutes > 60, "escalar no corrige el skew");
  assert.ok(scaled.metrics.costPerRun > engine.createSimulation(definition, { seed: 1, mode: "evaluation" }).metrics.costPerRun);
});

test("governance: excessive privileges unblock the job but are penalized even after revoking", () => {
  const definition = def("uc-permissions-run-as");
  const state = runPath(engine, definition, ["read-error-log", "@diagnose", "grant-all-catalog", "repair-run", "revoke-excessive", "grant-use-schema", "grant-read-volume", "verify-negative-access", "@close"]);
  assert.equal(state.status, "recovered");
  const result = evaluateAttempt(definition, state);
  const safe = evaluateAttempt(definition, runPath(engine, definition, definition.referencePaths[0].actions));
  assert.equal(result.dimensions.find((d) => d.dimension === "integrity").score, 0);
  assert.ok(result.score < safe.score - INTEGRITY_PENALTY);
});

test("orchestration: notifying before deduplicating causes a critical failure", () => {
  const definition = def("orchestration-retry-effects");
  const state = runPath(engine, definition, ["view-run-history", "inspect-bundle-diff", "fix-bundle-deploy", "repair-notify"]);
  assert.equal(state.status, "failed");
  assert.equal(state.flags.partnersOverpaid, true);
  assert.throws(() => engine.applyInput(definition, state, act("validate-ledger")), /SIMULATION_FINISHED/u);
  const runNow = engine.replay(definition, { seed: 1, mode: "evaluation" }, [act("run-now-full")]);
  assert.equal(runNow.metrics.ledgerDuplicateRows, 24800, "relanzar todo vuelve a duplicar");
});

test("engine rejects invalid inputs and enforces prerequisites", () => {
  const definition = def("streaming-state-growth");
  const state = engine.createSimulation(definition, { seed: 1, mode: "evaluation" });
  assert.throws(() => engine.applyInput(definition, state, act("nope")), /UNKNOWN_ACTION/u);
  assert.throws(() => engine.applyInput(definition, state, act("reconcile-boundary")), /ACTION_NOT_AVAILABLE/u);
  const once = engine.applyInput(definition, state, act("inspect-plan"));
  assert.throws(() => engine.applyInput(definition, once, act("inspect-plan")), /ACTION_ALREADY_DONE/u);
  assert.throws(() => engine.applyInput(definition, state, { type: "diagnose", hypotheses: ["unknown-hypothesis"] }), /UNKNOWN_HYPOTHESIS/u);
  const diagnosed = engine.applyInput(definition, state, { type: "diagnose", hypotheses: ["kafka-partitions"] });
  assert.throws(() => engine.applyInput(definition, diagnosed, { type: "diagnose", hypotheses: ["kafka-partitions"] }), /DIAGNOSIS_ALREADY_DECLARED/u);
  assert.throws(() => engine.replay(definition, { seed: 1, mode: "evaluation" }, Array(81).fill(act("observe-pipeline"))), /TOO_MANY_INPUTS/u);
});

test("evaluation rewards correct diagnosis and modes change evidence and limits", () => {
  const definition = def("uc-permissions-run-as");
  const path = definition.referencePaths[0].actions;
  const right = evaluateAttempt(definition, runPath(engine, definition, path));
  const wrongPath = path.map((token) => token);
  let state = engine.createSimulation(definition, { seed: 42, mode: "evaluation" });
  for (const token of wrongPath) {
    if (token === "@diagnose") state = engine.applyInput(definition, state, { type: "diagnose", hypotheses: ["storage-credential", "access-mode"] });
    else if (token === "@close") state = engine.applyInput(definition, state, { type: "close" });
    else state = engine.applyInput(definition, state, act(token));
  }
  const wrong = evaluateAttempt(definition, state);
  assert.ok(wrong.score < right.score);
  assert.equal(wrong.diagnosis.correctRoot, false);
  const practice = evaluateAttempt(definition, runPath(engine, definition, path, { seed: 42, mode: "practice" }));
  assert.deepEqual(practice.skills, []);
  assert.ok(engine.timeLimitFor(definition, "production") < engine.timeLimitFor(definition, "evaluation"));
});

test("attempt payload validation is strict and ignores no extra fields", () => {
  const valid = { scenarioId: "merge-not-idempotent", scenarioVersion: "1.0.0", mode: "evaluation", seed: 12, idempotencyKey: "a".repeat(24), inputs: [act("describe-history"), { type: "diagnose", hypotheses: ["full-job-rerun"] }, { type: "close" }] };
  assert.equal(parseAttemptPayload(valid).inputs.length, 3);
  for (const [field, value] of [["score", 100], ["userId", "x"]]) assert.throws(() => parseAttemptPayload({ ...valid, [field]: value }), /UNEXPECTED_FIELD/u);
  assert.throws(() => parseAttemptPayload({ ...valid, seed: -1 }), /INVALID_SEED/u);
  assert.throws(() => parseAttemptPayload({ ...valid, seed: 1.5 }), /INVALID_SEED/u);
  assert.throws(() => parseAttemptPayload({ ...valid, mode: "god" }), /INVALID_MODE/u);
  assert.throws(() => parseAttemptPayload({ ...valid, idempotencyKey: "short" }), /INVALID_IDEMPOTENCY_KEY/u);
  assert.throws(() => parseAttemptPayload({ ...valid, inputs: Array(81).fill(act("wait-status")) }), /INVALID_INPUTS/u);
  assert.throws(() => parseAttemptPayload({ ...valid, inputs: [{ type: "action", actionId: "x", extra: true }] }), /INVALID_INPUT/u);
  assert.throws(() => parseAttemptPayload({ ...valid, inputs: [{ type: "close" }, act("describe-history")] }), /INVALID_INPUTS/u);
});

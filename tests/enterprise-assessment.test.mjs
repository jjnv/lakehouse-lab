import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);

async function loadEnterpriseRuntime() {
  const temporary = await mkdtemp(join(tmpdir(), "lakehouse-enterprise-"));
  const sources = [
    "app/enterprise/assessment.ts",
    "app/enterprise/assessment-private.ts",
    "app/enterprise/certificate.ts",
  ];

  for (const sourcePath of sources) {
    const source = await readFile(new URL(sourcePath, root), "utf8");
    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        strict: true,
      },
    });
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    assert.deepEqual(errors, [], `No se pudo transpilar ${sourcePath}`);
    await writeFile(join(temporary, basename(sourcePath, ".ts") + ".js"), result.outputText, "utf8");
  }

  const runtime = {
    assessment: require(join(temporary, "assessment.js")),
    privateAssessment: require(join(temporary, "assessment-private.js")),
    certificate: require(join(temporary, "certificate.js")),
  };
  await rm(temporary, { recursive: true, force: true });
  return runtime;
}

const { assessment, privateAssessment, certificate } = await loadEnterpriseRuntime();

function definition(kind, count, sourceId = `source-${kind}`) {
  return {
    sourceId,
    contentVersion: "course-v2",
    kind,
    title: `Evaluación ${kind}`,
    instructions: "Selecciona una opción por pregunta.",
    baseDurationMinutes: 60,
    questions: Array.from({ length: count }, (_, index) => ({
      sourceId: `${sourceId}-q${index + 1}`,
      question: `Pregunta ${index + 1} de ${kind}`,
      options: [`Correcta ${index + 1}`, `Distractor A ${index + 1}`, `Distractor B ${index + 1}`, `Distractor C ${index + 1}`],
      answer: 0,
      explanation: `Explicación privada ${index + 1}`,
      domain: index % 2 === 0 ? "Arquitectura" : "Operación",
      moduleId: `m${String(index + 1).padStart(2, "0")}`,
    })),
  };
}

function selectionsFor(answerKey, correctCount) {
  return Object.fromEntries(answerKey.questionOrder.map((questionId, index) => {
    const keyed = answerKey.questions[questionId];
    const selected = index < correctCount
      ? keyed.correctOptionId
      : keyed.optionIds.find((optionId) => optionId !== keyed.correctOptionId);
    return [questionId, selected];
  }));
}

function grade(prepared, correctCount, attemptId = `attempt-${correctCount}`) {
  const attempt = assessment.createAssessmentAttempt({
    attemptId,
    payload: prepared.publicPayload,
    startedAt: "2026-07-22T10:00:00.000Z",
  });
  return privateAssessment.gradeAssessment(prepared.answerKey, attempt, {
    attemptId,
    assessmentId: prepared.publicPayload.id,
    selections: selectionsFor(prepared.answerKey, correctCount),
    submittedAt: "2026-07-22T10:30:00.000Z",
  });
}

function allPropertyNames(value, names = []) {
  if (!value || typeof value !== "object") return names;
  for (const [key, child] of Object.entries(value)) {
    names.push(key);
    allPropertyNames(child, names);
  }
  return names;
}

test("the public payload never exposes keys, answers or explanations", () => {
  const prepared = privateAssessment.prepareAssessment(definition("associate-simulator", 5), "1x");
  const names = allPropertyNames(prepared.publicPayload);

  for (const forbidden of ["answer", "explanation", "correctOptionId", "optionIds"]) {
    assert.equal(names.includes(forbidden), false, `El payload público expone ${forbidden}`);
  }
  assert.equal(JSON.stringify(prepared.publicPayload).includes("Explicación privada"), false);
  assert.equal(Object.keys(prepared.answerKey.questions).length, 5);
  assert.ok(prepared.answerKey.questions[prepared.answerKey.questionOrder[0]].correctOptionId);
});

test("assessment and question ids remain stable independently of presentation order", () => {
  const original = definition("module-quiz", 4);
  const first = privateAssessment.prepareAssessment(original, "untimed");
  const second = privateAssessment.prepareAssessment({ ...original, questions: [...original.questions].reverse() }, "2x");
  const firstIds = Object.fromEntries(first.publicPayload.questions.map((question) => [question.prompt, question.id]));
  const secondIds = Object.fromEntries(second.publicPayload.questions.map((question) => [question.prompt, question.id]));

  assert.equal(first.publicPayload.id, second.publicPayload.id);
  assert.deepEqual(firstIds, secondIds);
});

test("timing supports untimed, 1x, 1.5x and 2x without hidden defaults", () => {
  assert.deepEqual(assessment.resolveAssessmentTiming(60, "untimed"), {
    mode: "untimed",
    multiplier: null,
    durationSeconds: null,
  });
  assert.equal(assessment.resolveAssessmentTiming(60, "1x").durationSeconds, 3_600);
  assert.equal(assessment.resolveAssessmentTiming(60, "1.5x").durationSeconds, 5_400);
  assert.equal(assessment.resolveAssessmentTiming(60, "2x").durationSeconds, 7_200);
});

test("module quizzes use an exact 75 percent pass policy", () => {
  const prepared = privateAssessment.prepareAssessment(definition("module-quiz", 4), "untimed");
  const pass = grade(prepared, 3);
  const fail = grade(prepared, 2);

  assert.equal(prepared.publicPayload.policy.passPercent, 75);
  assert.equal(pass.scorePercent, 75);
  assert.equal(pass.passed, true);
  assert.equal(fail.scorePercent, 50);
  assert.equal(fail.passed, false);
  assert.equal(pass.domainBreakdown.reduce((sum, domain) => sum + domain.totalQuestions, 0), 4);
});

test("associate and professional readiness use an exact 80 percent pass policy", () => {
  for (const kind of ["associate-simulator", "professional-simulator"]) {
    const prepared = privateAssessment.prepareAssessment(definition(kind, 5), "1x");
    const pass = grade(prepared, 4, `${kind}-pass`);
    const fail = grade(prepared, 3, `${kind}-fail`);

    assert.equal(prepared.publicPayload.policy.passPercent, 80);
    assert.equal(pass.scorePercent, 80);
    assert.equal(pass.passed, true);
    assert.equal(fail.scorePercent, 60);
    assert.equal(fail.passed, false);
  }
});

test("a legacy passing score is historical evidence and always requires revalidation", () => {
  const legacy = privateAssessment.evaluateLegacyAttempt({
    attemptId: "legacy-1",
    assessmentId: "legacy-associate",
    kind: "associate-simulator",
    scorePercent: 92,
    completed: true,
  });
  const failedLegacy = privateAssessment.evaluateLegacyAttempt({
    attemptId: "legacy-2",
    assessmentId: "legacy-associate",
    kind: "associate-simulator",
    scorePercent: 79,
    completed: true,
  });

  assert.equal(legacy.status, "revalidation-required");
  assert.equal(legacy.eligible, false);
  assert.equal(legacy.requiresRevalidation, true);
  assert.equal(failedLegacy.status, "failed");
  assert.equal(failedLegacy.requiresRevalidation, false);
});

test("certificate specifications are deterministic, minimal and reject legacy attempts", () => {
  const prepared = privateAssessment.prepareAssessment(definition("associate-simulator", 5), "untimed");
  const result = grade(prepared, 4, "secure-attempt-1");
  const input = {
    learner: { id: "employee-internal-42", displayName: "Ada Lovelace" },
    issuer: { name: "Lakehouse Lab", signatoryName: "Equipo de formación", signatoryRole: "Learning Operations" },
    credential: { id: "databricks-associate-path", title: "Ruta Databricks Associate", courseVersion: "course-v2", level: "Associate" },
    qualifyingResult: result,
    issuedAt: "2026-07-22T11:00:00.000Z",
    locale: "es-ES",
    verificationBaseUrl: "https://learning.example.test/certificates/verify",
  };
  const first = certificate.buildCertificateSpecification(input);
  const second = certificate.buildCertificateSpecification(input);

  assert.equal(first.certificateId, second.certificateId);
  assert.equal(first.achievement.thresholdPercent, 80);
  assert.equal(first.verification.cryptographicallySigned, false);
  assert.match(first.verification.url, /^https:\/\/learning\.example\.test\//);
  assert.equal(JSON.stringify(first).includes("employee-internal-42"), false);
  assert.deepEqual(first.accessibility.readingOrder, ["heading", "learner", "achievement", "issuer", "verification"]);

  const legacyResult = { ...result, provenance: "legacy-client" };
  assert.throws(
    () => certificate.buildCertificateSpecification({ ...input, qualifyingResult: legacyResult }),
    (error) => error instanceof certificate.CertificateEligibilityError
      && error.decision.status === "revalidation-required",
  );
});

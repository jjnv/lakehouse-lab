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
    "app/enterprise/credential-version-policy.ts",
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
    credentialVersionPolicy: require(join(temporary, "credential-version-policy.js")),
  };
  await rm(temporary, { recursive: true, force: true });
  return runtime;
}

const { assessment, privateAssessment, certificate, credentialVersionPolicy } = await loadEnterpriseRuntime();

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
      editorialId: `${kind}-editorial-${index + 1}`,
      objectiveIds: [`${kind}-objective-${index + 1}`],
      refIds: [`${kind}-reference-${index + 1}`],
      scope: kind === "professional-simulator" ? "professional-extension" : "blueprint",
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

  for (const forbidden of ["answer", "explanation", "correctOptionId", "optionIds", "editorialId", "objectiveIds", "refIds", "scope"]) {
    assert.equal(names.includes(forbidden), false, `El payload público expone ${forbidden}`);
  }
  assert.equal(JSON.stringify(prepared.publicPayload).includes("Explicación privada"), false);
  assert.equal(Object.keys(prepared.answerKey.questions).length, 5);
  const privateQuestion = prepared.answerKey.questions[prepared.answerKey.questionOrder[0]];
  assert.ok(privateQuestion.correctOptionId);
  assert.equal(privateQuestion.editorialId, "associate-simulator-editorial-1");
  assert.deepEqual(privateQuestion.objectiveIds, ["associate-simulator-objective-1"]);
  assert.deepEqual(privateQuestion.refIds, ["associate-simulator-reference-1"]);
  assert.equal(privateQuestion.scope, "blueprint");
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

test("a late submission expires even when every answer is correct", () => {
  const prepared = privateAssessment.prepareAssessment(definition("associate-simulator", 5), "1x");
  const attempt = assessment.createAssessmentAttempt({
    attemptId: "expired-perfect-attempt",
    payload: prepared.publicPayload,
    startedAt: "2026-07-22T10:00:00.000Z",
  });
  const result = privateAssessment.gradeAssessment(prepared.answerKey, attempt, {
    attemptId: attempt.id,
    assessmentId: prepared.publicPayload.id,
    selections: selectionsFor(prepared.answerKey, 5),
    submittedAt: "2026-07-22T11:00:01.000Z",
  });

  assert.equal(result.scorePercent, 100);
  assert.equal(result.status, "expired");
  assert.equal(result.timingCompliant, false);
  assert.equal(result.passed, false);
  assert.equal(privateAssessment.evaluateAssessmentForCredential(result).status, "expired");
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

test("new credentials require passing both simulators in the current assessment version", () => {
  const historicalAttempt = (id, kind) => ({
    id,
    kind,
    assessmentVersion: "lakehouse-lab-v2.0.0",
    provenance: "server_graded",
    passed: true,
    submittedAt: "2026-07-24T10:00:00.000Z",
  });
  const currentAttempt = (id, kind, submittedAt) => ({
    id,
    kind,
    assessmentVersion: "lakehouse-lab-v2.1.0",
    provenance: "server_graded",
    passed: true,
    submittedAt,
  });

  const historicalOnly = credentialVersionPolicy.evaluateCredentialVersionPolicy({
    attempts: [historicalAttempt("associate-v2", "associate_exam"), historicalAttempt("professional-v2", "professional_exam")],
    currentAssessmentVersion: "lakehouse-lab-v2.1.0",
    existingCredentialStatus: null,
  });
  assert.deepEqual(historicalOnly.simulatorStatus, {
    associate: "revalidation-required",
    professional: "revalidation-required",
  });
  assert.equal(historicalOnly.hasEligibleSimulatorPair, false);

  const currentPair = credentialVersionPolicy.evaluateCredentialVersionPolicy({
    attempts: [
      historicalAttempt("associate-v2", "associate_exam"),
      currentAttempt("associate-v21-old", "associate_exam", "2026-08-25T09:00:00.000Z"),
      currentAttempt("associate-v21-new", "associate_exam", "2026-08-25T10:00:00.000Z"),
      currentAttempt("professional-v21", "professional_exam", "2026-08-25T11:00:00.000Z"),
      { ...currentAttempt("legacy-client-v21", "professional_exam", "2026-08-25T12:00:00.000Z"), provenance: "legacy_client" },
    ],
    currentAssessmentVersion: "lakehouse-lab-v2.1.0",
    existingCredentialStatus: null,
  });
  assert.deepEqual(currentPair.simulatorStatus, { associate: "passed", professional: "passed" });
  assert.equal(currentPair.currentPassingAttempts.associate.id, "associate-v21-new");
  assert.equal(currentPair.currentPassingAttempts.professional.id, "professional-v21");
  assert.equal(currentPair.hasEligibleSimulatorPair, true);
});

test("an issued credential stays valid while a revoked credential is never treated as issued", () => {
  const historicalAttempts = [
    { id: "associate-v2", kind: "associate_exam", assessmentVersion: "lakehouse-lab-v2.0.0", provenance: "server_graded", passed: true, submittedAt: "2026-07-24T10:00:00.000Z" },
    { id: "professional-v2", kind: "professional_exam", assessmentVersion: "lakehouse-lab-v2.0.0", provenance: "server_graded", passed: true, submittedAt: "2026-07-24T11:00:00.000Z" },
  ];
  const issued = credentialVersionPolicy.evaluateCredentialVersionPolicy({
    attempts: [],
    currentAssessmentVersion: "lakehouse-lab-v2.1.0",
    existingCredentialStatus: "issued",
  });
  assert.deepEqual(issued.simulatorStatus, { associate: "passed", professional: "passed" });
  assert.equal(issued.credentialAlreadyExists, true);
  assert.equal(issued.hasEligibleSimulatorPair, false);

  const revoked = credentialVersionPolicy.evaluateCredentialVersionPolicy({
    attempts: historicalAttempts,
    currentAssessmentVersion: "lakehouse-lab-v2.1.0",
    existingCredentialStatus: "revoked",
  });
  assert.deepEqual(revoked.simulatorStatus, {
    associate: "revalidation-required",
    professional: "revalidation-required",
  });
  assert.equal(revoked.credentialAlreadyExists, true);
  assert.equal(revoked.hasEligibleSimulatorPair, false);
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

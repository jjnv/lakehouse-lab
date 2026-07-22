/**
 * Server-only assessment preparation and grading.
 *
 * Do not import this module from client components. It accepts authored answer
 * material and produces the private key used by trusted server code.
 */

import {
  ASSESSMENT_SCHEMA_VERSION,
  ASSESSMENT_TIMING_MODES,
  assessmentPolicyForKind,
  resolveAssessmentTiming,
  stableAssessmentId,
  stableOptionId,
  stableQuestionId,
  type AssessmentAttempt,
  type AssessmentAttemptProvenance,
  type AssessmentKind,
  type AssessmentPolicyId,
  type AssessmentSubmission,
  type AssessmentTimingMode,
  type PublicAssessmentPayload,
  type PublicAssessmentQuestion,
} from "./assessment";

export type PrivateAssessmentQuestionInput = Readonly<{
  sourceId?: string;
  officialSampleId?: string;
  question: string;
  options: readonly string[];
  answer: number;
  explanation: string;
  domain?: string;
  moduleId?: string;
  origin?: string;
  originLabel?: string;
  sourceLabel?: string;
}>;

export type PrivateAssessmentDefinition = Readonly<{
  sourceId: string;
  contentVersion: string;
  kind: AssessmentKind;
  title: string;
  instructions?: string;
  baseDurationMinutes: number;
  questions: readonly PrivateAssessmentQuestionInput[];
}>;

export type AssessmentKeyQuestion = Readonly<{
  id: string;
  optionIds: readonly string[];
  correctOptionId: string;
  explanation: string;
  domain: string;
  moduleId?: string;
}>;

export type AssessmentAnswerKey = Readonly<{
  schemaVersion: typeof ASSESSMENT_SCHEMA_VERSION;
  assessmentId: string;
  kind: AssessmentKind;
  policyId: AssessmentPolicyId;
  questionOrder: readonly string[];
  questions: Readonly<Record<string, AssessmentKeyQuestion>>;
}>;

export type PreparedAssessment = Readonly<{
  publicPayload: PublicAssessmentPayload;
  answerKey: AssessmentAnswerKey;
}>;

export type AssessmentQuestionCorrection = Readonly<{
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
  explanation: string;
  domain: string;
  moduleId?: string;
}>;

export type AssessmentDomainBreakdown = Readonly<{
  domain: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  scorePercent: number;
}>;

export type AssessmentResult = Readonly<{
  attemptId: string;
  assessmentId: string;
  kind: AssessmentKind;
  policyId: AssessmentPolicyId;
  provenance: AssessmentAttemptProvenance;
  timingMode: AssessmentTimingMode;
  status: "graded" | "expired";
  startedAt: string;
  submittedAt: string;
  completed: boolean;
  timingCompliant: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  passed: boolean;
  corrections: readonly AssessmentQuestionCorrection[];
  domainBreakdown: readonly AssessmentDomainBreakdown[];
}>;

export type CredentialEligibilityStatus =
  | "eligible"
  | "incomplete"
  | "failed"
  | "expired"
  | "revalidation-required";

export type CredentialEligibilityDecision = Readonly<{
  status: CredentialEligibilityStatus;
  eligible: boolean;
  requiresRevalidation: boolean;
  attemptId: string;
  assessmentId: string;
  policyId: AssessmentPolicyId;
  thresholdPercent: 75 | 80;
  scorePercent: number;
  reason: string;
}>;

export function prepareAssessment(
  definition: PrivateAssessmentDefinition,
  timingMode: AssessmentTimingMode,
): PreparedAssessment {
  assertRequiredText(definition.sourceId, "sourceId");
  assertRequiredText(definition.contentVersion, "contentVersion");
  assertRequiredText(definition.title, "title");
  if (!definition.questions.length) throw new RangeError("An assessment must contain at least one question");

  const assessmentId = stableAssessmentId(definition.sourceId, definition.contentVersion, definition.kind);
  const policy = assessmentPolicyForKind(definition.kind);
  const publicQuestions: PublicAssessmentQuestion[] = [];
  const keyQuestions: Record<string, AssessmentKeyQuestion> = {};

  for (const source of definition.questions) {
    assertRequiredText(source.question, "question");
    assertRequiredText(source.explanation, "explanation");
    if (source.options.length < 2) throw new RangeError("Assessment questions need at least two options");
    if (!Number.isInteger(source.answer) || source.answer < 0 || source.answer >= source.options.length) {
      throw new RangeError(`Invalid correct option for question: ${source.question}`);
    }

    const sourceIdentity = source.sourceId
      ?? source.officialSampleId
      ?? `${source.moduleId ?? "global"}:${source.question}`;
    const questionId = stableQuestionId(assessmentId, sourceIdentity, source.question);
    if (keyQuestions[questionId]) {
      throw new Error(`Duplicate stable question id ${questionId}; provide distinct sourceId values`);
    }

    const optionIds = source.options.map((option) => {
      assertRequiredText(option, "option");
      return stableOptionId(questionId, option);
    });
    if (new Set(optionIds).size !== optionIds.length) {
      throw new Error(`Question ${questionId} contains duplicate option text`);
    }

    publicQuestions.push({
      id: questionId,
      prompt: source.question,
      options: source.options.map((text, index) => ({ id: optionIds[index], text })),
      ...(source.domain ? { domain: source.domain } : {}),
      ...(source.moduleId ? { moduleId: source.moduleId } : {}),
      ...(source.origin ? { origin: source.origin } : {}),
      ...(source.originLabel ? { originLabel: source.originLabel } : {}),
      ...(source.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
    });
    keyQuestions[questionId] = {
      id: questionId,
      optionIds,
      correctOptionId: optionIds[source.answer],
      explanation: source.explanation,
      domain: source.domain?.trim() || "Sin dominio",
      ...(source.moduleId ? { moduleId: source.moduleId } : {}),
    };
  }

  const publicPayload: PublicAssessmentPayload = {
    schemaVersion: ASSESSMENT_SCHEMA_VERSION,
    id: assessmentId,
    sourceId: definition.sourceId,
    contentVersion: definition.contentVersion,
    kind: definition.kind,
    title: definition.title,
    ...(definition.instructions ? { instructions: definition.instructions } : {}),
    policy,
    timing: resolveAssessmentTiming(definition.baseDurationMinutes, timingMode),
    allowedTimingModes: [...ASSESSMENT_TIMING_MODES],
    questions: publicQuestions,
  };

  return {
    publicPayload,
    answerKey: {
      schemaVersion: ASSESSMENT_SCHEMA_VERSION,
      assessmentId,
      kind: definition.kind,
      policyId: policy.id,
      questionOrder: publicQuestions.map((question) => question.id),
      questions: keyQuestions,
    },
  };
}

export function gradeAssessment(
  answerKey: AssessmentAnswerKey,
  attempt: AssessmentAttempt,
  submission: AssessmentSubmission,
): AssessmentResult {
  if (attempt.assessmentId !== answerKey.assessmentId || submission.assessmentId !== answerKey.assessmentId) {
    throw new Error("Assessment id mismatch while grading");
  }
  if (attempt.id !== submission.attemptId) throw new Error("Attempt id mismatch while grading");
  if (attempt.kind !== answerKey.kind || attempt.policyId !== answerKey.policyId) {
    throw new Error("Attempt policy does not match the answer key");
  }
  if (attempt.status !== "in-progress") {
    throw new Error(`Attempt ${attempt.id} cannot be graded from status ${attempt.status}`);
  }

  const submittedAt = parseIsoInstant(submission.submittedAt, "submittedAt");
  if (Date.parse(submittedAt) < Date.parse(attempt.startedAt)) {
    throw new RangeError("submittedAt cannot precede startedAt");
  }

  for (const [questionId, optionId] of Object.entries(submission.selections)) {
    const keyed = answerKey.questions[questionId];
    if (!keyed) throw new Error(`Unknown question id in submission: ${questionId}`);
    if (!keyed.optionIds.includes(optionId)) throw new Error(`Unknown option id for question ${questionId}`);
  }

  const corrections = answerKey.questionOrder.map((questionId): AssessmentQuestionCorrection => {
    const keyed = answerKey.questions[questionId];
    const selectedOptionId = submission.selections[questionId] ?? null;
    return {
      questionId,
      selectedOptionId,
      correctOptionId: keyed.correctOptionId,
      correct: selectedOptionId === keyed.correctOptionId,
      explanation: keyed.explanation,
      domain: keyed.domain,
      ...(keyed.moduleId ? { moduleId: keyed.moduleId } : {}),
    };
  });

  const totalQuestions = corrections.length;
  const answeredQuestions = corrections.filter((item) => item.selectedOptionId !== null).length;
  const correctAnswers = corrections.filter((item) => item.correct).length;
  const completed = answeredQuestions === totalQuestions;
  const timingCompliant = attempt.expiresAt === null || Date.parse(submittedAt) <= Date.parse(attempt.expiresAt);
  const policy = assessmentPolicyForKind(answerKey.kind);
  const scorePercent = percent(correctAnswers, totalQuestions);
  const thresholdMet = correctAnswers * 100 >= policy.passPercent * totalQuestions;
  const passed = completed && timingCompliant && thresholdMet;

  return {
    attemptId: attempt.id,
    assessmentId: answerKey.assessmentId,
    kind: answerKey.kind,
    policyId: answerKey.policyId,
    provenance: attempt.provenance,
    timingMode: attempt.timingMode,
    status: timingCompliant ? "graded" : "expired",
    startedAt: attempt.startedAt,
    submittedAt,
    completed,
    timingCompliant,
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    scorePercent,
    passed,
    corrections,
    domainBreakdown: buildDomainBreakdown(corrections),
  };
}

export function buildDomainBreakdown(
  corrections: readonly AssessmentQuestionCorrection[],
): readonly AssessmentDomainBreakdown[] {
  const domains = new Map<string, { total: number; answered: number; correct: number }>();
  for (const correction of corrections) {
    const current = domains.get(correction.domain) ?? { total: 0, answered: 0, correct: 0 };
    current.total += 1;
    if (correction.selectedOptionId !== null) current.answered += 1;
    if (correction.correct) current.correct += 1;
    domains.set(correction.domain, current);
  }

  return [...domains.entries()]
    .map(([domain, values]) => ({
      domain,
      totalQuestions: values.total,
      answeredQuestions: values.answered,
      correctAnswers: values.correct,
      scorePercent: percent(values.correct, values.total),
    }))
    .sort((left, right) => left.domain < right.domain ? -1 : left.domain > right.domain ? 1 : 0);
}

export function evaluateAssessmentForCredential(result: AssessmentResult): CredentialEligibilityDecision {
  const policy = assessmentPolicyForKind(result.kind);
  const base = {
    attemptId: result.attemptId,
    assessmentId: result.assessmentId,
    policyId: result.policyId,
    thresholdPercent: policy.passPercent,
    scorePercent: result.scorePercent,
  } as const;

  if (!result.completed) {
    return { ...base, status: "incomplete", eligible: false, requiresRevalidation: false, reason: "El intento no contiene respuesta para todas las preguntas." };
  }
  if (!result.timingCompliant) {
    return { ...base, status: "expired", eligible: false, requiresRevalidation: false, reason: "El intento se entregó fuera de su tiempo autorizado." };
  }

  const thresholdMet = result.correctAnswers * 100 >= policy.passPercent * result.totalQuestions;
  if (!thresholdMet) {
    return { ...base, status: "failed", eligible: false, requiresRevalidation: false, reason: `El resultado no alcanza el ${policy.passPercent} %.` };
  }
  if (result.provenance === "legacy-client") {
    return { ...base, status: "revalidation-required", eligible: false, requiresRevalidation: true, reason: "El resultado heredado debe revalidarse en una evaluación corregida por el servidor." };
  }

  return { ...base, status: "eligible", eligible: true, requiresRevalidation: false, reason: "El intento completo y corregido por el servidor cumple la política vigente." };
}

export function evaluateLegacyAttempt(input: Readonly<{
  attemptId: string;
  assessmentId: string;
  kind: AssessmentKind;
  scorePercent: number;
  completed: boolean;
}>): CredentialEligibilityDecision {
  if (!Number.isFinite(input.scorePercent) || input.scorePercent < 0 || input.scorePercent > 100) {
    throw new RangeError("Legacy scorePercent must be between 0 and 100");
  }
  const policy = assessmentPolicyForKind(input.kind);
  const base = {
    attemptId: input.attemptId,
    assessmentId: input.assessmentId,
    policyId: policy.id,
    thresholdPercent: policy.passPercent,
    scorePercent: input.scorePercent,
  } as const;

  if (!input.completed) {
    return { ...base, status: "incomplete", eligible: false, requiresRevalidation: false, reason: "El intento heredado está incompleto." };
  }
  if (input.scorePercent < policy.passPercent) {
    return { ...base, status: "failed", eligible: false, requiresRevalidation: false, reason: `El resultado heredado no alcanza el ${policy.passPercent} %.` };
  }
  return { ...base, status: "revalidation-required", eligible: false, requiresRevalidation: true, reason: "El resultado heredado se conserva como historial, pero requiere un nuevo intento corregido por el servidor." };
}

function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 10_000) / 100;
}

function assertRequiredText(value: string, field: string): void {
  if (!value.trim()) throw new TypeError(`${field} is required`);
}

function parseIsoInstant(value: string, field: string): string {
  const timestamp = Date.parse(value);
  if (!value || !Number.isFinite(timestamp)) throw new TypeError(`${field} must be a valid ISO date-time`);
  return new Date(timestamp).toISOString();
}

/**
 * Public assessment contracts.
 *
 * This module is safe to share with a client. Answer keys, explanations and
 * grading functions intentionally live in assessment-private.ts.
 */

export const ASSESSMENT_SCHEMA_VERSION = "1.0" as const;

export const ASSESSMENT_TIMING_MODES = ["untimed", "1x", "1.5x", "2x"] as const;

export type AssessmentTimingMode = (typeof ASSESSMENT_TIMING_MODES)[number];
export type AssessmentKind = "module-quiz" | "associate-simulator" | "professional-simulator";
export type AssessmentPolicyId = "module-quiz-75-v1" | "certification-readiness-80-v1";
export type AssessmentAttemptStatus = "in-progress" | "submitted" | "graded" | "expired" | "invalidated";
export type AssessmentAttemptProvenance = "server-graded" | "legacy-client";

export type AssessmentPolicy = Readonly<{
  id: AssessmentPolicyId;
  passPercent: 75 | 80;
  requireAllQuestions: true;
}>;

export const ASSESSMENT_POLICIES: Readonly<Record<AssessmentPolicyId, AssessmentPolicy>> = {
  "module-quiz-75-v1": {
    id: "module-quiz-75-v1",
    passPercent: 75,
    requireAllQuestions: true,
  },
  "certification-readiness-80-v1": {
    id: "certification-readiness-80-v1",
    passPercent: 80,
    requireAllQuestions: true,
  },
};

export type AssessmentTiming = Readonly<{
  mode: AssessmentTimingMode;
  multiplier: null | 1 | 1.5 | 2;
  durationSeconds: number | null;
}>;

export type PublicAssessmentOption = Readonly<{
  id: string;
  text: string;
}>;

export type PublicAssessmentQuestion = Readonly<{
  id: string;
  prompt: string;
  options: readonly PublicAssessmentOption[];
  domain?: string;
  moduleId?: string;
  origin?: string;
  originLabel?: string;
  sourceLabel?: string;
}>;

export type PublicAssessmentPayload = Readonly<{
  schemaVersion: typeof ASSESSMENT_SCHEMA_VERSION;
  id: string;
  sourceId: string;
  contentVersion: string;
  kind: AssessmentKind;
  title: string;
  instructions?: string;
  policy: AssessmentPolicy;
  timing: AssessmentTiming;
  allowedTimingModes: readonly AssessmentTimingMode[];
  questions: readonly PublicAssessmentQuestion[];
}>;

export type AssessmentAttempt = Readonly<{
  id: string;
  assessmentId: string;
  kind: AssessmentKind;
  policyId: AssessmentPolicyId;
  timingMode: AssessmentTimingMode;
  durationSeconds: number | null;
  provenance: AssessmentAttemptProvenance;
  status: AssessmentAttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
}>;

export type AssessmentSubmission = Readonly<{
  attemptId: string;
  assessmentId: string;
  selections: Readonly<Record<string, string>>;
  submittedAt: string;
}>;

export function assessmentPolicyForKind(kind: AssessmentKind): AssessmentPolicy {
  return kind === "module-quiz"
    ? ASSESSMENT_POLICIES["module-quiz-75-v1"]
    : ASSESSMENT_POLICIES["certification-readiness-80-v1"];
}

export function resolveAssessmentTiming(
  baseDurationMinutes: number,
  mode: AssessmentTimingMode,
): AssessmentTiming {
  if (!Number.isFinite(baseDurationMinutes) || baseDurationMinutes <= 0) {
    throw new RangeError("baseDurationMinutes must be a positive finite number");
  }
  if (!ASSESSMENT_TIMING_MODES.includes(mode)) {
    throw new RangeError(`Unsupported assessment timing mode: ${String(mode)}`);
  }

  const multiplier = mode === "untimed" ? null : Number.parseFloat(mode) as 1 | 1.5 | 2;
  return {
    mode,
    multiplier,
    durationSeconds: multiplier === null ? null : Math.round(baseDurationMinutes * 60 * multiplier),
  };
}

/**
 * Produces deterministic, opaque identifiers for content identity and
 * idempotency. It is deliberately not a signature or secret token.
 */
export function stableOpaqueId(prefix: string, ...parts: readonly (string | number)[]): string {
  if (!/^[a-z][a-z0-9-]*$/u.test(prefix)) {
    throw new TypeError("Stable id prefixes must use lowercase ASCII letters, digits or hyphens");
  }

  let hash = 0x811c9dc5;
  for (const part of parts) {
    const normalized = String(part).normalize("NFKC");
    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    hash ^= 0x1f;
    hash = Math.imul(hash, 0x01000193);
  }

  return `${prefix}_${(hash >>> 0).toString(36).padStart(7, "0")}`;
}

export function stableAssessmentId(
  sourceId: string,
  contentVersion: string,
  kind: AssessmentKind,
): string {
  return stableOpaqueId("asm", sourceId, contentVersion, kind);
}

export function stableQuestionId(assessmentId: string, sourceIdentity: string, prompt: string): string {
  return stableOpaqueId("q", assessmentId, sourceIdentity, prompt);
}

export function stableOptionId(questionId: string, text: string): string {
  return stableOpaqueId("opt", questionId, text);
}

export function createAssessmentAttempt(input: Readonly<{
  attemptId: string;
  payload: PublicAssessmentPayload;
  startedAt: string;
  provenance?: AssessmentAttemptProvenance;
}>): AssessmentAttempt {
  const startedAt = parseIsoInstant(input.startedAt, "startedAt");
  if (!input.attemptId.trim()) throw new TypeError("attemptId is required");

  const duration = input.payload.timing.durationSeconds;
  return {
    id: input.attemptId,
    assessmentId: input.payload.id,
    kind: input.payload.kind,
    policyId: input.payload.policy.id,
    timingMode: input.payload.timing.mode,
    durationSeconds: duration,
    provenance: input.provenance ?? "server-graded",
    status: "in-progress",
    startedAt,
    expiresAt: duration === null ? null : new Date(Date.parse(startedAt) + duration * 1000).toISOString(),
    submittedAt: null,
  };
}

function parseIsoInstant(value: string, field: string): string {
  const timestamp = Date.parse(value);
  if (!value || !Number.isFinite(timestamp)) throw new TypeError(`${field} must be a valid ISO date-time`);
  return new Date(timestamp).toISOString();
}

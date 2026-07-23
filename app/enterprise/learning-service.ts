import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { getDb } from "../../db";
import {
  assessmentAttempts,
  assessmentResponses,
  auditEvents,
  credentials,
  earnedRewards,
  gamificationSummaries,
  labAttestations,
  legacyImports,
  learnerAssignments,
  learnerPreferences,
  learningEvents,
  lessonProgress,
  privacyRequests,
  progressSnapshots,
  reviewSchedules,
  users,
} from "../../db/schema";
import { buildExamQuestions, modules, trackMeta, type QuizQuestion } from "../course-data";
import { recommendationsForModule } from "../curriculum/community-resources";
import { badgeCatalog } from "../gamification";
import { CONTENT_VERSION, sanitizeProgress, type ReviewRating } from "../progress";
import {
  createAssessmentAttempt,
  type AssessmentAttempt,
  type AssessmentKind,
  type AssessmentTimingMode,
} from "./assessment";
import {
  gradeAssessment,
  prepareAssessment,
  type AssessmentDomainBreakdown,
  type PreparedAssessment,
  type PrivateAssessmentDefinition,
} from "./assessment-private";
import { INTERNAL_CERTIFICATE_DISCLAIMER as CERTIFICATE_DISCLAIMER } from "./certificate";
import type {
  AssessmentAttemptPublic,
  Credential,
  LearnerDashboard,
  ModuleProgressPublic,
  MutationEnvelope,
  ProgressRevision,
  PublicCredentialVerification,
  TenantBrandConfig,
} from "./contracts";
import { getOrganizationBranding, PROFESSIONAL_CURRICULUM_VERSION_ID } from "./store";
import type { LearnerContext } from "./types";

const MUTATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,159}$/u;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/u;

type StoredAttemptMetadata = {
  attemptNumber: number;
  timingMode: AssessmentTimingMode;
  moduleId?: string;
  legacy?: boolean;
  result?: {
    scorePercent: number;
    passed: boolean;
    status: "graded" | "expired";
    correctAnswers: number;
    totalQuestions: number;
    completed: boolean;
    domainBreakdown: readonly AssessmentDomainBreakdown[];
    corrections: readonly { questionId: string; correctOptionId: string; correct: boolean; explanation: string; domain: string }[];
  };
};

type MutationInput = {
  clientMutationId: string;
  expectedRevision: number;
};

type MutationRecord = MutationInput & Record<string, unknown>;

type MutationGuard = {
  key: string;
  payloadHash: string;
  replayed: boolean;
  merged: boolean;
  revision: ProgressRevision;
};

export class LearningApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly currentRevision?: number;

  constructor(status: number, code: string, message: string, retryable = false, currentRevision?: number) {
    super(message);
    this.name = "LearningApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.currentRevision = currentRevision;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function todayUtc() {
  return nowIso().slice(0, 10);
}

function addDays(day: string, days: number) {
  const value = new Date(`${day}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, nested]) => [key, stableValue(nested)]));
}

function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function opaqueId(prefix: string, value: string) {
  return `${prefix}_${(await sha256(value)).slice(0, 32)}`;
}

function assertMutationInput(value: unknown): asserts value is MutationRecord {
  if (!isRecord(value) || typeof value.clientMutationId !== "string" || !MUTATION_ID.test(value.clientMutationId)) {
    throw new LearningApiError(422, "INVALID_MUTATION_ID", "clientMutationId debe tener entre 16 y 160 caracteres seguros.");
  }
  if (!Number.isInteger(value.expectedRevision) || Number(value.expectedRevision) < 0) {
    throw new LearningApiError(422, "INVALID_REVISION", "expectedRevision debe ser un entero no negativo.");
  }
}

export async function getProgressRevision(learner: LearnerContext): Promise<ProgressRevision> {
  const db = getDb();
  const [row] = await db.select({ value: learnerAssignments.progressRevision, updatedAt: learnerAssignments.updatedAt })
    .from(learnerAssignments)
    .where(and(eq(learnerAssignments.assignmentId, learner.professionalAssignment.id), eq(learnerAssignments.userId, learner.user.id)))
    .limit(1);
  if (!row) throw new LearningApiError(403, "ENROLLMENT_REQUIRED", "No existe una matrícula activa para esta cuenta.");
  return { value: row.value, updatedAt: row.updatedAt };
}

async function guardMutation(
  learner: LearnerContext,
  input: MutationInput,
  action: string,
  payload: unknown,
  options: { allowMonotonicMerge?: boolean } = {},
): Promise<MutationGuard> {
  assertMutationInput(input);
  const db = getDb();
  const key = `${learner.user.id}:${input.clientMutationId}`;
  const payloadHash = await sha256(stableJson({ action, payload }));
  const [existing] = await db.select().from(learningEvents).where(eq(learningEvents.idempotencyKey, key)).limit(1);
  const revision = await getProgressRevision(learner);
  if (existing) {
    if (existing.payloadHash !== payloadHash || existing.type !== action) {
      throw new LearningApiError(409, "IDEMPOTENCY_CONFLICT", "Este clientMutationId ya se utilizó con otro contenido.", false, revision.value);
    }
    return { key, payloadHash, replayed: true, merged: false, revision };
  }
  let expectedForCas = input.expectedRevision;
  let merged = false;
  if (input.expectedRevision !== revision.value) {
    if (!options.allowMonotonicMerge) {
      throw new LearningApiError(409, "REVISION_CONFLICT", "El progreso cambió en otro dispositivo. Actualiza los datos antes de reintentar.", true, revision.value);
    }
    expectedForCas = revision.value;
    merged = true;
  }
  const changedAt = nowIso();
  let advanced = await db.update(learnerAssignments).set({
    progressRevision: sql`${learnerAssignments.progressRevision} + 1`,
    updatedAt: changedAt,
  }).where(and(
    eq(learnerAssignments.assignmentId, learner.professionalAssignment.id),
    eq(learnerAssignments.userId, learner.user.id),
    eq(learnerAssignments.progressRevision, expectedForCas),
  )).returning({ value: learnerAssignments.progressRevision, updatedAt: learnerAssignments.updatedAt });
  if (!advanced[0] && options.allowMonotonicMerge) {
    const latest = await getProgressRevision(learner);
    advanced = await db.update(learnerAssignments).set({
      progressRevision: sql`${learnerAssignments.progressRevision} + 1`,
      updatedAt: changedAt,
    }).where(and(
      eq(learnerAssignments.assignmentId, learner.professionalAssignment.id),
      eq(learnerAssignments.userId, learner.user.id),
      eq(learnerAssignments.progressRevision, latest.value),
    )).returning({ value: learnerAssignments.progressRevision, updatedAt: learnerAssignments.updatedAt });
    merged = true;
  }
  if (!advanced[0]) {
    const current = await getProgressRevision(learner);
    throw new LearningApiError(409, "REVISION_CONFLICT", "El progreso cambió en otro dispositivo. Actualiza los datos antes de reintentar.", true, current.value);
  }
  return { key, payloadHash, replayed: false, merged, revision: { value: advanced[0].value, updatedAt: advanced[0].updatedAt } };
}

async function recordMutation(
  learner: LearnerContext,
  guard: MutationGuard,
  action: string,
  objectType: string,
  objectId: string,
  metadata: unknown = {},
) {
  const db = getDb();
  const occurredAt = nowIso();
  await db.insert(learningEvents).values({
    id: await opaqueId("evt", guard.key),
    organizationId: learner.organization.id,
    userId: learner.user.id,
    assignmentId: learner.professionalAssignment.id,
    type: action,
    objectType,
    objectId,
    idempotencyKey: guard.key,
    payloadHash: guard.payloadHash,
    metadataJson: stableJson({ ...(isRecord(metadata) ? metadata : { value: metadata }), mergedFromConflict: guard.merged }),
    occurredAt,
  }).onConflictDoNothing();
  if (action !== "progress.deleted") {
    await db.update(learnerAssignments).set({
      status: "in_progress",
      startedAt: sql`coalesce(${learnerAssignments.startedAt}, ${occurredAt})`,
      updatedAt: occurredAt,
    }).where(and(eq(learnerAssignments.assignmentId, learner.professionalAssignment.id), eq(learnerAssignments.userId, learner.user.id)));
  }
  await db.update(users).set({ lastActivityAt: occurredAt, lastSeenAt: occurredAt, updatedAt: occurredAt }).where(eq(users.id, learner.user.id));
  return guard.revision;
}

function envelope<T>(data: T, revision: ProgressRevision, replayed: boolean): MutationEnvelope<T> {
  return { data, revision, replayed };
}

function findModule(moduleId: string) {
  const curriculumModule = modules.find((item) => item.id === moduleId || item.slug === moduleId);
  if (!curriculumModule) throw new LearningApiError(422, "UNKNOWN_MODULE", "El módulo indicado no existe.");
  return curriculumModule;
}

function findLesson(moduleId: string, lessonId: string) {
  const curriculumModule = findModule(moduleId);
  const lesson = curriculumModule.lessons.find((item) => item.id === lessonId);
  if (!lesson) throw new LearningApiError(422, "UNKNOWN_LESSON", "La lección indicada no pertenece al módulo.");
  return { curriculumModule, lesson };
}

function mapAssessmentKind(kind: AssessmentKind) {
  if (kind === "module-quiz") return "module_quiz" as const;
  if (kind === "associate-simulator") return "associate_exam" as const;
  return "professional_exam" as const;
}

function unmapAssessmentKind(kind: "module_quiz" | "associate_exam" | "professional_exam"): AssessmentKind {
  if (kind === "module_quiz") return "module-quiz";
  if (kind === "associate_exam") return "associate-simulator";
  return "professional-simulator";
}

function parseAttemptMetadata(value: string | null): StoredAttemptMetadata {
  if (!value) return { attemptNumber: 1, timingMode: "untimed" };
  try {
    const parsed = JSON.parse(value) as Partial<StoredAttemptMetadata>;
    const timingMode = parsed.timingMode;
    return {
      attemptNumber: Number.isInteger(parsed.attemptNumber) && Number(parsed.attemptNumber) > 0 ? Number(parsed.attemptNumber) : 1,
      timingMode: timingMode === "1x" || timingMode === "1.5x" || timingMode === "2x" ? timingMode : "untimed",
      ...(typeof parsed.moduleId === "string" ? { moduleId: parsed.moduleId } : {}),
      ...(parsed.legacy === true ? { legacy: true } : {}),
      ...(parsed.result && isRecord(parsed.result) ? { result: parsed.result as StoredAttemptMetadata["result"] } : {}),
    };
  } catch {
    return { attemptNumber: 1, timingMode: "untimed" };
  }
}

function privateQuestion(question: QuizQuestion, index: number, fallbackModuleId?: string) {
  return {
    sourceId: question.officialSampleId ?? `${fallbackModuleId ?? "exam"}:${index}`,
    question: question.question,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    domain: question.domain,
    ...(question.moduleId ?? fallbackModuleId ? { moduleId: question.moduleId ?? fallbackModuleId } : {}),
    ...(question.origin ? { origin: question.origin } : {}),
    ...(question.originLabel ? { originLabel: question.originLabel } : {}),
    ...(question.sourceLabel ? { sourceLabel: question.sourceLabel } : {}),
  };
}

function assessmentDefinition(kind: AssessmentKind, moduleId: string | undefined, attemptNumber: number): PrivateAssessmentDefinition {
  if (kind === "module-quiz") {
    if (!moduleId) throw new LearningApiError(422, "MODULE_REQUIRED", "El test necesita un moduleId.");
    const curriculumModule = findModule(moduleId);
    return {
      sourceId: `quiz:${curriculumModule.id}`,
      contentVersion: CONTENT_VERSION,
      kind,
      title: `Test · ${curriculumModule.number}. ${curriculumModule.title}`,
      instructions: "Responde las cuatro preguntas. Necesitas al menos un 75 %.",
      baseDurationMinutes: 10,
      questions: curriculumModule.quiz.map((question, index) => privateQuestion(question, index, curriculumModule.id)),
    };
  }

  const level = kind === "associate-simulator" ? "associate" : "professional";
  const questions = buildExamQuestions(level, attemptNumber);
  return {
    sourceId: `${level}:simulator:${attemptNumber}`,
    contentVersion: CONTENT_VERSION,
    kind,
    title: level === "associate" ? "Simulacro Data Engineer Associate" : "Simulacro Data Engineer Professional",
    instructions: "Completa todas las preguntas. El resultado de referencia es el 80 %.",
    baseDurationMinutes: level === "associate" ? 90 : 120,
    questions: questions.map((question, index) => privateQuestion(question, index)),
  };
}

function prepareStoredAttempt(
  row: typeof assessmentAttempts.$inferSelect,
): { prepared: PreparedAssessment; attempt: AssessmentAttempt; metadata: StoredAttemptMetadata } {
  const metadata = parseAttemptMetadata(row.seed);
  const kind = unmapAssessmentKind(row.kind);
  let prepared: PreparedAssessment;
  try {
    const publicPayload = JSON.parse(row.publicPayloadJson) as PreparedAssessment["publicPayload"];
    const answerKey = JSON.parse(row.answerKeyJson) as PreparedAssessment["answerKey"];
    if (!publicPayload?.id || publicPayload.id !== row.assessmentId || answerKey?.assessmentId !== row.assessmentId) throw new Error("invalid stored assessment");
    prepared = { publicPayload, answerKey };
  } catch {
    prepared = prepareAssessment(assessmentDefinition(kind, row.moduleId ?? metadata.moduleId, metadata.attemptNumber), row.timingMode);
  }
  const attempt = createAssessmentAttempt({ attemptId: row.id, payload: prepared.publicPayload, startedAt: row.startedAt, provenance: row.provenance === "legacy_client" ? "legacy-client" : "server-graded" });
  return {
    prepared,
    metadata,
    attempt: {
      ...attempt,
      timingMode: row.timingMode,
      durationSeconds: row.durationSeconds,
      expiresAt: row.expiresAt,
      status: row.status === "started" ? "in-progress" : "submitted",
      submittedAt: row.submittedAt,
    },
  };
}

async function activeSelections(row: typeof assessmentAttempts.$inferSelect, prepared: PreparedAssessment) {
  if (row.status !== "started") return {};
  const db = getDb();
  const stored = await db.select().from(assessmentResponses).where(eq(assessmentResponses.attemptId, row.id));
  const byQuestion = new Map(stored.map((response) => [response.questionId, response.selectedOptionId]));
  return Object.fromEntries(prepared.publicPayload.questions.flatMap((question) => {
    const selectedOptionId = byQuestion.get(question.id);
    const option = selectedOptionId === undefined ? null : question.options.find((item) => item.id === selectedOptionId);
    return option ? [[question.id, option.id]] : [];
  }));
}

async function publicAttempt(row: typeof assessmentAttempts.$inferSelect): Promise<AssessmentAttemptPublic> {
  const { prepared, attempt } = prepareStoredAttempt(row);
  const expired = row.status === "started" && attempt.expiresAt !== null && Date.now() > Date.parse(attempt.expiresAt);
  return {
    id: row.id,
    kind: prepared.publicPayload.kind,
    timingMode: prepared.publicPayload.timing.mode,
    startedAt: row.startedAt,
    expiresAt: attempt.expiresAt,
    status: expired ? "expired" : row.status === "started" ? "in-progress" : "graded",
    assessment: prepared.publicPayload,
    selections: await activeSelections(row, prepared),
  };
}

async function ensureModuleUnlocked(learner: LearnerContext, moduleId: string) {
  const curriculumModule = findModule(moduleId);
  if (!curriculumModule.prerequisites.length) return;
  const progress = await calculateModuleProgress(learner);
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.moduleId));
  if (!curriculumModule.prerequisites.every((id) => completed.has(id))) {
    throw new LearningApiError(422, "PREREQUISITES_REQUIRED", "Completa los prerrequisitos antes de registrar esta actividad.");
  }
}

async function progressRows(learner: LearnerContext) {
  const db = getDb();
  const [lessons, labs, attempts] = await Promise.all([
    db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, learner.user.id), eq(lessonProgress.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))),
    db.select().from(labAttestations).where(and(eq(labAttestations.userId, learner.user.id), eq(labAttestations.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID), eq(labAttestations.status, "self_attested"))),
    db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.userId, learner.user.id), eq(assessmentAttempts.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID), eq(assessmentAttempts.status, "submitted"))),
  ]);
  return { lessons, labs, attempts };
}

async function calculateModuleProgress(learner: LearnerContext): Promise<ModuleProgressPublic[]> {
  const { lessons, labs, attempts } = await progressRows(learner);
  return calculateModuleProgressFromRows(lessons, labs, attempts);
}

function calculateModuleProgressFromRows(
  lessons: Array<typeof lessonProgress.$inferSelect>,
  labs: Array<typeof labAttestations.$inferSelect>,
  attempts: Array<typeof assessmentAttempts.$inferSelect>,
): ModuleProgressPublic[] {
  const lessonDates = new Map(lessons.filter((row) => row.status === "completed").map((row) => [row.lessonId, row.completedAt]));
  const labsDone = new Set(labs.map((row) => row.labId));
  const quizBest = new Map<string, number>();
  for (const attempt of attempts.filter((row) => row.kind === "module_quiz")) {
    const moduleId = parseAttemptMetadata(attempt.seed).moduleId;
    if (!moduleId || attempt.percent === null) continue;
    quizBest.set(moduleId, Math.max(quizBest.get(moduleId) ?? 0, attempt.percent));
  }

  const completed = new Set<string>();
  return modules.map((curriculumModule): ModuleProgressPublic => {
    const completedLessonIds = curriculumModule.lessons.filter((lesson) => lessonDates.has(lesson.id)).map((lesson) => lesson.id);
    const labAttested = labsDone.has(curriculumModule.lab.id) || labsDone.has(curriculumModule.id);
    const quizBestPercent = quizBest.get(curriculumModule.id) ?? null;
    const unlocked = curriculumModule.prerequisites.every((id) => completed.has(id));
    const moduleCompleted = unlocked && completedLessonIds.length === curriculumModule.lessons.length && labAttested && (quizBestPercent ?? 0) >= 75;
    if (moduleCompleted) completed.add(curriculumModule.id);
    const dates = completedLessonIds.map((id) => lessonDates.get(id)).filter((date): date is string => Boolean(date)).sort();
    return {
      moduleId: curriculumModule.id,
      completedLessonIds,
      labAttested,
      quizBestPercent,
      completed: moduleCompleted,
      unlocked,
      startedAt: dates[0] ?? null,
      completedAt: moduleCompleted ? dates.at(-1) ?? null : null,
    };
  });
}

async function getLegacyImportRecord(learner: LearnerContext) {
  const db = getDb();
  const [row] = await db.select().from(legacyImports).where(and(
    eq(legacyImports.userId, learner.user.id),
    eq(legacyImports.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID),
  )).limit(1);
  return row ?? null;
}

async function hasPermanentLegacyImport(learner: LearnerContext) {
  return Boolean(await getLegacyImportRecord(learner));
}

async function hasServerActivity(learner: LearnerContext) {
  const db = getDb();
  const [lessonCount, labCount, attemptCount] = await Promise.all([
    db.select({ value: count() }).from(lessonProgress).where(and(eq(lessonProgress.userId, learner.user.id), eq(lessonProgress.source, "native"))),
    db.select({ value: count() }).from(labAttestations).where(and(eq(labAttestations.userId, learner.user.id), eq(labAttestations.status, "self_attested"))),
    db.select({ value: count() }).from(assessmentAttempts).where(eq(assessmentAttempts.userId, learner.user.id)),
  ]);
  return [lessonCount, labCount, attemptCount].some(([row]) => Number(row?.value ?? 0) > 0);
}

function publicCredential(row: typeof credentials.$inferSelect): Credential {
  return {
    id: row.id,
    certificateNumber: row.certificateNumber,
    title: row.title,
    contentVersion: row.contentVersion,
    issuedAt: row.issuedAt,
    status: row.status,
    verificationHref: `/certificados/${encodeURIComponent(row.id)}?code=${encodeURIComponent(row.verificationCode)}`,
    pdfHref: `/api/credentials/${encodeURIComponent(row.id)}/pdf`,
  };
}

export async function getLearnerDashboard(learner: LearnerContext): Promise<LearnerDashboard> {
  const db = getDb();
  const weekStart = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [brand, dashboardRows] = await Promise.all([
    getOrganizationBranding(learner.organization.id),
    db.batch([
      db.select({ value: learnerAssignments.progressRevision, updatedAt: learnerAssignments.updatedAt }).from(learnerAssignments).where(and(eq(learnerAssignments.assignmentId, learner.professionalAssignment.id), eq(learnerAssignments.userId, learner.user.id))).limit(1),
      db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, learner.user.id), eq(lessonProgress.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))),
      db.select().from(labAttestations).where(and(eq(labAttestations.userId, learner.user.id), eq(labAttestations.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID), eq(labAttestations.status, "self_attested"))),
      db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.userId, learner.user.id), eq(assessmentAttempts.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))),
      db.select().from(reviewSchedules).where(and(eq(reviewSchedules.userId, learner.user.id), eq(reviewSchedules.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))).orderBy(reviewSchedules.dueOn),
      db.select().from(credentials).where(and(eq(credentials.userId, learner.user.id), eq(credentials.assignmentId, learner.professionalAssignment.id))).limit(1),
      db.select().from(progressSnapshots).where(and(eq(progressSnapshots.userId, learner.user.id), eq(progressSnapshots.assignmentId, learner.professionalAssignment.id))).limit(1),
      db.select().from(gamificationSummaries).where(and(eq(gamificationSummaries.userId, learner.user.id), eq(gamificationSummaries.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))).limit(1),
      db.select().from(earnedRewards).where(and(eq(earnedRewards.userId, learner.user.id), eq(earnedRewards.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID), eq(earnedRewards.rewardType, "badge"))),
      db.select().from(legacyImports).where(and(eq(legacyImports.userId, learner.user.id), eq(legacyImports.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID))).limit(1),
      db.select({ occurredAt: learningEvents.occurredAt }).from(learningEvents).where(eq(learningEvents.userId, learner.user.id)).orderBy(desc(learningEvents.occurredAt)).limit(1),
      db.select({ type: learningEvents.type, objectId: learningEvents.objectId, metadataJson: learningEvents.metadataJson }).from(learningEvents).where(and(eq(learningEvents.userId, learner.user.id), gte(learningEvents.occurredAt, weekStart))),
      db.select().from(learnerPreferences).where(eq(learnerPreferences.userId, learner.user.id)).limit(1),
    ] as const),
  ]);
  const [revisionRows, lessonRows, labRows, allAttempts, reviews, credentialRows, snapshot, motivationRows, rewardRows, legacyRows, latestEvent, weeklyEvents, preferenceRows] = dashboardRows;
  const revisionRow = revisionRows[0];
  if (!revisionRow) throw new LearningApiError(403, "ENROLLMENT_REQUIRED", "No existe una matrícula activa para esta cuenta.");
  const revision: ProgressRevision = { value: revisionRow.value, updatedAt: revisionRow.updatedAt };
  const attempts = allAttempts.filter((row) => row.status === "submitted");
  const progress = calculateModuleProgressFromRows(lessonRows, labRows, attempts);
  const legacyImport = legacyRows[0] ?? null;
  const activity = lessonRows.some((row) => row.source === "native") || labRows.length > 0 || allAttempts.length > 0;

  const best = (kind: "associate_exam" | "professional_exam") => {
    const scores = attempts.filter((row) => row.kind === kind && row.percent !== null).map((row) => row.percent as number);
    return scores.length ? Math.max(...scores) : null;
  };
  const imported = Boolean(legacyImport);
  const passed = (kind: "associate_exam" | "professional_exam") => attempts.some((row) => row.kind === kind && row.passed === true);
  const nativeProfessionalPassed = attempts.some((attempt) => attempt.kind === "professional_exam"
    && attempt.provenance === "server_graded"
    && attempt.passed === true
    && (!legacyImport || (attempt.submittedAt !== null && Date.parse(attempt.submittedAt) > Date.parse(legacyImport.importedAt))));
  const requiresProfessionalRevalidation = imported && !nativeProfessionalPassed;
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.moduleId));
  const dueReview = reviews.find((review) => review.dueOn <= todayUtc());
  const nextModuleProgress = progress.find((item) => item.unlocked && !item.completed);
  const nextModule = nextModuleProgress ? modules.find((item) => item.id === nextModuleProgress.moduleId) : null;
  let nextActivity: LearnerDashboard["nextActivity"];
  if (dueReview) {
    const owner = modules.find((item) => item.lessons.some((lesson) => lesson.id === dueReview.lessonId));
    nextActivity = { kind: "review", moduleId: owner?.id ?? null, lessonId: dueReview.lessonId, label: "Completar repaso pendiente", reason: `Este recuerdo está programado desde el ${dueReview.dueOn}; repasarlo ahora refuerza la retención antes de avanzar.`, href: owner ? `/curso/${owner.slug}?lesson=${dueReview.lessonId}&review=1` : "/mi-aprendizaje" };
  } else if (nextModule && nextModuleProgress) {
    const lesson = nextModule.lessons.find((item) => !nextModuleProgress.completedLessonIds.includes(item.id));
    nextActivity = lesson
      ? { kind: "lesson", moduleId: nextModule.id, lessonId: lesson.id, label: `Continuar · ${lesson.title}`, reason: `Es la primera lección pendiente del módulo ${nextModule.number} y mantiene el orden de prerrequisitos de la ruta.`, href: `/curso/${nextModule.slug}?lesson=${lesson.id}` }
      : !nextModuleProgress.labAttested
        ? { kind: "lab", moduleId: nextModule.id, lessonId: null, label: `Completar laboratorio · ${nextModule.short}`, reason: "Ya has leído las cinco lecciones; la práctica es el siguiente paso antes de evaluar el módulo.", href: `/curso/${nextModule.slug}?view=lab` }
        : { kind: "quiz", moduleId: nextModule.id, lessonId: null, label: `Realizar test · ${nextModule.short}`, reason: nextModuleProgress.quizBestPercent === null ? "Lecciones y laboratorio completos: falta comprobar la comprensión del módulo." : `Tu mejor resultado es ${nextModuleProgress.quizBestPercent} %; el objetivo del módulo es 75 %.`, href: `/curso/${nextModule.slug}?view=quiz` };
  } else if (!passed("associate_exam")) {
    const score = best("associate_exam");
    nextActivity = { kind: "associate_simulator", moduleId: null, lessonId: null, label: "Realizar simulacro Associate", reason: score === null ? "Has completado el tramo Associate; el simulacro mide qué dominios conviene reforzar." : `Tu mejor resultado es ${score} % y el objetivo es 80 %.`, href: "/simulacro/associate" };
  } else if (!passed("professional_exam") || requiresProfessionalRevalidation) {
    const score = best("professional_exam");
    nextActivity = { kind: "professional_simulator", moduleId: null, lessonId: null, label: "Realizar simulacro Professional", reason: requiresProfessionalRevalidation ? "La importación se conserva, pero una credencial requiere un intento Professional corregido por este servidor." : score === null ? "La ruta está completa; el simulacro final comprueba la preparación transversal." : `Tu mejor resultado es ${score} % y el objetivo es 80 %.`, href: "/simulacro/professional" };
  } else {
    nextActivity = { kind: "certificate", moduleId: null, lessonId: null, label: "Consultar expediente y certificado", reason: "Todos los requisitos están completos; revisa la evidencia y comparte el enlace público si lo deseas.", href: "/expediente" };
  }

  let snapshotPayload: Record<string, unknown> = {};
  if (snapshot[0]) {
    try { snapshotPayload = JSON.parse(snapshot[0].snapshotJson) as Record<string, unknown>; } catch { snapshotPayload = {}; }
  }
  const snapshotBadges = isRecord(snapshotPayload.gamification) && Array.isArray(snapshotPayload.gamification.badges)
    ? snapshotPayload.gamification.badges.filter((item): item is string => typeof item === "string" && item in badgeCatalog)
    : [];
  const badges = [...new Set([...snapshotBadges, ...rewardRows.map((row) => row.rewardId).filter((item) => item in badgeCatalog)])];
  const supportEmail = brand.supportUrl?.startsWith("mailto:") ? brand.supportUrl.slice("mailto:".length) : null;
  const tenantBrand: TenantBrandConfig = {
    organizationName: brand.organizationName,
    productName: brand.productName,
    logoUrl: brand.logoUrl,
    primaryColor: brand.primaryColor,
    accentColor: brand.accentColor,
    timezone: learner.organization.timezone,
    supportEmail,
  };
  const startedAt = learner.professionalAssignment.assignedAt;
  const dueAt = learner.professionalAssignment.dueAt;
  const allModulesComplete = completed.size === modules.length;
  const routeComplete = allModulesComplete && passed("associate_exam") && passed("professional_exam");
  const weeklyMinutes = Math.round(weeklyEvents.reduce((total, event) => {
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(event.metadataJson) as Record<string, unknown>; } catch { metadata = {}; }
    if (event.type === "lesson.reviewed" && metadata.action === "complete") {
      const owner = modules.find((item) => item.id === metadata.moduleId);
      return total + (owner ? owner.minutes * 0.5 / owner.lessons.length : 20);
    }
    if (event.type === "lab.attested") {
      const owner = modules.find((item) => item.id === metadata.moduleId);
      return total + (owner ? owner.minutes * 0.35 : 45);
    }
    if (event.type === "assessment.submitted") return total + (metadata.kind === "module_quiz" ? 20 : metadata.kind === "associate_exam" ? 90 : 120);
    return total;
  }, 0));
  const preferences = preferenceRows[0];
  const weeklyTargetMinutes = preferences?.weeklyTargetMinutes ?? 300;

  return {
    brand: tenantBrand,
    learner: {
      displayName: learner.user.displayName,
      email: learner.user.email,
      locale: learner.user.locale,
      timezone: learner.user.timezone,
      lastActivityAt: learner.user.lastActivityAt ?? latestEvent[0]?.occurredAt ?? null,
    },
    enrollment: {
      programId: "professional-v1",
      contentVersion: learner.professionalAssignment.contentVersion,
      startedAt,
      dueAt,
      durationDays: 140,
      weeklyTargetMinutes,
      status: routeComplete ? "completed" : activity ? "in_progress" : "not_started",
      overdue: !routeComplete && Date.parse(dueAt) < Date.now(),
      completionPolicy: {
        requiredModules: 32,
        lessonsPerModule: 5,
        moduleQuizMinimumPercent: 75,
        simulatorMinimumPercent: 80,
        requireAllLabs: true,
        requireAssociateSimulator: true,
        requireProfessionalSimulator: true,
        requireCapstone: true,
      },
    },
    revision,
    modules: modules.map((item) => {
      const resources = recommendationsForModule(item.id);
      return {
        id: item.id,
        slug: item.slug,
        number: item.number,
        title: item.title,
        short: item.short,
        description: item.description,
        phase: trackMeta[item.track].name,
        phaseId: item.track,
        level: item.level,
        minutes: item.minutes,
        prerequisiteIds: item.prerequisites,
        resourceCount: resources.length,
        resourceConcepts: [...new Set(resources.flatMap((resource) => resource.concepts))],
      };
    }),
    progress,
    reviews: reviews.map((review) => {
      const owner = modules.find((item) => item.lessons.some((lesson) => lesson.id === review.lessonId));
      return { moduleId: owner?.id ?? "", lessonId: review.lessonId, dueOn: review.dueOn, intervalDays: review.intervalDays, attempts: review.attempts };
    }).filter((review) => Boolean(review.moduleId)),
    motivation: { xp: motivationRows[0]?.xp ?? snapshot[0]?.xp ?? 0, streakDays: motivationRows[0]?.streakDays ?? snapshot[0]?.streak ?? 0, badges },
    bestSimulatorScores: { associate: best("associate_exam"), professional: best("professional_exam") },
    weeklyMinutes,
    nextActivity,
    credential: credentialRows[0] ? publicCredential(credentialRows[0]) : null,
    preferences: {
      goal: preferences?.goal ?? "professional",
      weeklyTargetMinutes,
      cloud: preferences?.cloud ?? "multicloud",
      onboardingCompleted: Boolean(preferences?.onboardingCompletedAt),
      updatedAt: preferences?.updatedAt ?? null,
    },
    legacyImport: {
      eligible: !imported && !activity,
      alreadyImported: imported,
      serverHasActivity: activity,
      requiresProfessionalRevalidation,
    },
  };
}

export async function updateLearnerPreferences(learner: LearnerContext, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "Las preferencias no tienen un formato válido.");
  assertMutationInput(body);
  const goal = body.goal;
  const cloud = body.cloud;
  const weeklyTargetMinutes = body.weeklyTargetMinutes;
  if (goal !== "associate" && goal !== "professional" && goal !== "topics") {
    throw new LearningApiError(422, "INVALID_GOAL", "El objetivo de aprendizaje no es válido.");
  }
  if (cloud !== "multicloud" && cloud !== "azure" && cloud !== "aws" && cloud !== "gcp" && cloud !== "free-edition") {
    throw new LearningApiError(422, "INVALID_CLOUD", "El entorno de práctica no es válido.");
  }
  if (!Number.isInteger(weeklyTargetMinutes) || Number(weeklyTargetMinutes) < 60 || Number(weeklyTargetMinutes) > 840 || Number(weeklyTargetMinutes) % 30 !== 0) {
    throw new LearningApiError(422, "INVALID_WEEKLY_TARGET", "El objetivo semanal debe estar entre 60 y 840 minutos, en bloques de 30.");
  }
  const canonical: {
    goal: "associate" | "professional" | "topics";
    cloud: "multicloud" | "azure" | "aws" | "gcp" | "free-edition";
    weeklyTargetMinutes: number;
  } = { goal, cloud, weeklyTargetMinutes: Number(weeklyTargetMinutes) };
  const guard = await guardMutation(learner, body, "preferences.updated", canonical);
  if (guard.replayed) return envelope((await getLearnerDashboard(learner)).preferences, guard.revision, true);
  const changedAt = nowIso();
  const db = getDb();
  await db.insert(learnerPreferences).values({
    userId: learner.user.id,
    ...canonical,
    onboardingCompletedAt: changedAt,
    updatedAt: changedAt,
  }).onConflictDoUpdate({
    target: learnerPreferences.userId,
    set: { ...canonical, onboardingCompletedAt: changedAt, updatedAt: changedAt },
  });
  const revision = await recordMutation(learner, guard, "preferences.updated", "user", learner.user.id, canonical);
  return envelope((await getLearnerDashboard(learner)).preferences, revision, false);
}

export async function importLegacyProgress(learner: LearnerContext, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "La importación no tiene un formato válido.");
  assertMutationInput(body);
  const source = body.progress ?? body.legacyProgress ?? body.legacy;
  if (!isRecord(source)) throw new LearningApiError(422, "INVALID_IMPORT", "Falta el progreso local que se quiere importar.");
  const progress = sanitizeProgress(source);
  const safePayload = {
    completedLessons: progress.completedLessons,
    labsPassed: progress.labConfirmed,
    quizScores: progress.quizScores,
    examScores: progress.examScores,
    examCompleted: progress.examCompleted,
    lessonReviews: progress.lessonReviews,
    gamification: progress.gamification,
  };
  const db = getDb();
  const scopedMutationKey = `${learner.user.id}:${body.clientMutationId}`;
  const [existingMutation] = await db.select({ id: learningEvents.id }).from(learningEvents).where(eq(learningEvents.idempotencyKey, scopedMutationKey)).limit(1);
  if (existingMutation) {
    const replay = await guardMutation(learner, body, "progress.imported", safePayload);
    return envelope(await getLearnerDashboard(learner), replay.revision, true);
  }
  const alreadyImported = await hasPermanentLegacyImport(learner);
  if (alreadyImported) throw new LearningApiError(409, "IMPORT_ALREADY_COMPLETED", "El progreso de este perfil ya se importó una vez.");
  if (await hasServerActivity(learner)) throw new LearningApiError(409, "SERVER_PROGRESS_EXISTS", "La importación solo está disponible antes de iniciar actividad en el perfil servidor.");
  const guard = await guardMutation(learner, body, "progress.imported", safePayload);
  const importedAt = nowIso();
  for (const curriculumModule of modules) {
    for (const lessonId of progress.completedLessons[curriculumModule.id] ?? []) {
      await db.insert(lessonProgress).values({
        userId: learner.user.id,
        curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
        moduleId: curriculumModule.id,
        lessonId,
        status: "completed",
        completedAt: importedAt,
        source: "legacy_device",
        updatedAt: importedAt,
      }).onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.curriculumVersionId, lessonProgress.lessonId],
        set: { status: "completed", completedAt: importedAt, source: "legacy_device", updatedAt: importedAt },
      });
    }
    if (progress.labConfirmed.includes(curriculumModule.id)) {
      const key = `${learner.user.id}:legacy:lab:${curriculumModule.id}`;
      await db.insert(labAttestations).values({
        id: await opaqueId("lab", key),
        userId: learner.user.id,
        curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
        assignmentId: learner.professionalAssignment.id,
        labId: curriculumModule.lab.id,
        status: "self_attested",
        checksJson: "[]",
        idempotencyKey: key,
        attestedAt: importedAt,
      }).onConflictDoNothing();
    }
    const quizScore = progress.quizScores[curriculumModule.id];
    if (Number.isInteger(quizScore)) {
      const key = `${learner.user.id}:legacy:quiz:${curriculumModule.id}`;
      await db.insert(assessmentAttempts).values({
        id: await opaqueId("attempt", key),
        userId: learner.user.id,
        curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
        assignmentId: learner.professionalAssignment.id,
        assessmentId: `legacy:quiz:${curriculumModule.id}`,
        moduleId: curriculumModule.id,
        kind: "module_quiz",
        assessmentVersion: CONTENT_VERSION,
        seed: stableJson({ attemptNumber: 1, timingMode: "untimed", moduleId: curriculumModule.id, legacy: true }),
        timingMode: "untimed",
        provenance: "legacy_client",
        status: "submitted",
        score: quizScore,
        maxScore: curriculumModule.quiz.length,
        percent: Math.round((quizScore / curriculumModule.quiz.length) * 100),
        passed: quizScore / curriculumModule.quiz.length >= 0.75,
        idempotencyKey: key,
        startedAt: importedAt,
        submittedAt: importedAt,
      }).onConflictDoNothing();
    }
  }

  for (const [key, review] of Object.entries(progress.lessonReviews)) {
    const [moduleId, lessonId] = key.split(":");
    if (!modules.some((item) => item.id === moduleId && item.lessons.some((lesson) => lesson.id === lessonId))) continue;
    await db.insert(reviewSchedules).values({
      userId: learner.user.id,
      curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
      moduleId,
      lessonId,
      dueOn: review.dueOn,
      intervalDays: review.intervalDays,
      attempts: review.attempts,
      lastRating: review.lastRating,
      lastReviewedOn: review.lastReviewedOn,
      updatedAt: importedAt,
    }).onConflictDoUpdate({
      target: [reviewSchedules.userId, reviewSchedules.curriculumVersionId, reviewSchedules.lessonId],
      set: { dueOn: review.dueOn, intervalDays: review.intervalDays, attempts: review.attempts, lastRating: review.lastRating, lastReviewedOn: review.lastReviewedOn, updatedAt: importedAt },
    });
  }

  for (const level of ["associate", "professional"] as const) {
    const score = progress.examScores[level];
    if (score === undefined) continue;
    const key = `${learner.user.id}:legacy:exam:${level}`;
    await db.insert(assessmentAttempts).values({
      id: await opaqueId("attempt", key),
      userId: learner.user.id,
      curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
      assignmentId: learner.professionalAssignment.id,
      assessmentId: `legacy:${level}`,
      kind: level === "associate" ? "associate_exam" : "professional_exam",
      assessmentVersion: CONTENT_VERSION,
      seed: stableJson({ attemptNumber: 1, timingMode: "untimed", legacy: true }),
      timingMode: "untimed",
      provenance: "legacy_client",
      status: "submitted",
      score,
      maxScore: 100,
      percent: Math.round(score),
      passed: progress.examCompleted[level] === true && score >= 80,
      idempotencyKey: key,
      startedAt: importedAt,
      submittedAt: importedAt,
    }).onConflictDoNothing();
  }

  const completedLessonIds = Object.values(progress.completedLessons).flat();
  const safeSnapshot = {
    source: "legacy_device",
    completedModuleIds: progress.completedModules,
    completedLessonIds,
    labsPassed: progress.labConfirmed,
    quizBestScores: progress.quizScores,
    gamification: progress.gamification,
  };
  const snapshotHash = await sha256(stableJson(safeSnapshot));
  const quizScores = Object.values(progress.quizScores);
  await db.insert(progressSnapshots).values({
    assignmentId: learner.professionalAssignment.id,
    userId: learner.user.id,
    contentVersion: CONTENT_VERSION,
    completedModules: progress.completedModules.length,
    totalModules: modules.length,
    completedLessons: completedLessonIds.length,
    totalLessons: modules.reduce((sum, item) => sum + item.lessons.length, 0),
    labsPassed: progress.labConfirmed.length,
    quizAveragePercent: quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / (quizScores.length * 4) * 100) : 0,
    progressPercent: Math.round((progress.completedModules.length / modules.length) * 100),
    xp: progress.gamification.xp,
    streak: progress.gamification.streak,
    payloadHash: snapshotHash,
    snapshotJson: stableJson(safeSnapshot),
    capturedAt: importedAt,
    updatedAt: importedAt,
  }).onConflictDoUpdate({
    target: [progressSnapshots.assignmentId, progressSnapshots.userId],
    set: { snapshotJson: stableJson(safeSnapshot), payloadHash: snapshotHash, capturedAt: importedAt, updatedAt: importedAt },
  });

  await db.insert(gamificationSummaries).values({
    userId: learner.user.id,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    xp: progress.gamification.xp,
    streakDays: progress.gamification.streak,
    lastStudyOn: progress.gamification.activityDates.at(-1) ?? null,
    updatedAt: importedAt,
  }).onConflictDoUpdate({
    target: [gamificationSummaries.userId, gamificationSummaries.curriculumVersionId],
    set: { xp: progress.gamification.xp, streakDays: progress.gamification.streak, lastStudyOn: progress.gamification.activityDates.at(-1) ?? null, updatedAt: importedAt },
  });
  for (const badge of progress.gamification.badges) {
    await db.insert(earnedRewards).values({
      userId: learner.user.id,
      curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
      rewardId: badge,
      rewardType: "badge",
      value: 0,
      earnedAt: importedAt,
      source: "legacy_device",
    }).onConflictDoNothing();
  }
  await db.insert(legacyImports).values({
    id: await opaqueId("legacy", `${learner.user.id}:${PROFESSIONAL_CURRICULUM_VERSION_ID}`),
    userId: learner.user.id,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    clientMutationId: body.clientMutationId,
    payloadHash: snapshotHash,
    importedAt,
    requiresProfessionalRevalidation: true,
  }).onConflictDoNothing();

  await db.insert(auditEvents).values({
    id: await opaqueId("audit", `legacy:${learner.user.id}`),
    organizationId: learner.organization.id,
    actorUserId: learner.user.id,
    action: "learner.legacy_import.completed",
    targetType: "user",
    targetId: learner.user.id,
    reason: "Importación consentida desde progreso local",
    payloadJson: stableJson({ importedAt, counts: { lessons: completedLessonIds.length, labs: progress.labConfirmed.length, quizzes: quizScores.length } }),
    createdAt: importedAt,
  }).onConflictDoNothing();

  const revision = await recordMutation(learner, guard, "progress.imported", "assignment", learner.professionalAssignment.id, { importedAt });
  return envelope(await getLearnerDashboard(learner), revision, false);
}

export async function reviewLesson(learner: LearnerContext, moduleId: string, lessonId: string, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "La actividad no tiene un formato válido.");
  assertMutationInput(body);
  const action = body.action === "review" ? "review" : body.action === "complete" || body.action === undefined ? "complete" : null;
  if (!action) throw new LearningApiError(422, "INVALID_LESSON_ACTION", "La acción debe ser complete o review.");
  const rating: ReviewRating = body.rating === "again" || body.rating === "good" ? body.rating : action === "complete" ? "good" : (() => { throw new LearningApiError(422, "INVALID_REVIEW_RATING", "La valoración debe ser again o good."); })();
  const { curriculumModule, lesson } = findLesson(moduleId, lessonId);
  await ensureModuleUnlocked(learner, curriculumModule.id);
  const reviewedOn = typeof body.reviewedOn === "string" && ISO_DAY.test(body.reviewedOn) ? body.reviewedOn : todayUtc();
  const guard = await guardMutation(learner, body, "lesson.reviewed", { moduleId: curriculumModule.id, lessonId: lesson.id, action, rating, reviewedOn }, { allowMonotonicMerge: action === "complete" });
  if (guard.replayed) return envelope(await getLearnerDashboard(learner), guard.revision, true);

  const db = getDb();
  const completedAt = nowIso();
  await db.insert(lessonProgress).values({
    userId: learner.user.id,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    moduleId: curriculumModule.id,
    lessonId: lesson.id,
    status: "completed",
    completedAt,
    source: "native",
    updatedAt: completedAt,
  }).onConflictDoUpdate({
    target: [lessonProgress.userId, lessonProgress.curriculumVersionId, lessonProgress.lessonId],
    set: { status: "completed", completedAt: sql`coalesce(${lessonProgress.completedAt}, ${completedAt})`, updatedAt: completedAt },
  });

  const [previous] = await db.select().from(reviewSchedules).where(and(
    eq(reviewSchedules.userId, learner.user.id),
    eq(reviewSchedules.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID),
    eq(reviewSchedules.lessonId, lesson.id),
  )).limit(1);
  const intervals = [1, 3, 7, 14, 30];
  const intervalDays = rating === "again" ? 1 : intervals.find((value) => value > (previous?.intervalDays ?? 0)) ?? 30;
  if (!guard.merged || !previous) {
    await db.insert(reviewSchedules).values({
      userId: learner.user.id,
      curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
      moduleId: curriculumModule.id,
      lessonId: lesson.id,
      dueOn: addDays(reviewedOn, intervalDays),
      intervalDays,
      attempts: (previous?.attempts ?? 0) + 1,
      lastRating: rating,
      lastReviewedOn: reviewedOn,
      updatedAt: completedAt,
    }).onConflictDoUpdate({
      target: [reviewSchedules.userId, reviewSchedules.curriculumVersionId, reviewSchedules.lessonId],
      set: { dueOn: addDays(reviewedOn, intervalDays), intervalDays, attempts: (previous?.attempts ?? 0) + 1, lastRating: rating, lastReviewedOn: reviewedOn, updatedAt: completedAt },
    });
  }
  const revision = await recordMutation(learner, guard, "lesson.reviewed", "lesson", lesson.id, {
    moduleId: curriculumModule.id,
    action,
    rating,
    intervalDays: guard.merged && previous ? previous.intervalDays : intervalDays,
    schedulePreserved: guard.merged && Boolean(previous),
  });
  return envelope(await getLearnerDashboard(learner), revision, false);
}

export async function attestLab(learner: LearnerContext, moduleId: string, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "La atestación no tiene un formato válido.");
  assertMutationInput(body);
  if (body.attested !== true) throw new LearningApiError(422, "ATTESTATION_REQUIRED", "Confirma expresamente que has completado el laboratorio.");
  const curriculumModule = findModule(moduleId);
  await ensureModuleUnlocked(learner, curriculumModule.id);
  const db = getDb();
  const completedLessons = await db.select({ id: lessonProgress.lessonId }).from(lessonProgress).where(and(
    eq(lessonProgress.userId, learner.user.id),
    eq(lessonProgress.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID),
    eq(lessonProgress.status, "completed"),
    inArray(lessonProgress.lessonId, curriculumModule.lessons.map((lesson) => lesson.id)),
  ));
  if (new Set(completedLessons.map(({ id }) => id)).size < curriculumModule.lessons.length) {
    throw new LearningApiError(422, "LESSONS_REQUIRED", "Completa las cinco lecciones antes de confirmar el laboratorio.");
  }
  const expectedCheckIds = curriculumModule.lab.checks.map((_, index) => `${curriculumModule.lab.id}-check-${index + 1}`);
  const providedCheckIds = Array.isArray(body.checkIds)
    ? [...new Set(body.checkIds.filter((item): item is string => typeof item === "string"))]
    : [];
  if (providedCheckIds.length !== expectedCheckIds.length || expectedCheckIds.some((id) => !providedCheckIds.includes(id))) {
    throw new LearningApiError(422, "LAB_CHECKS_REQUIRED", "Confirma toda la evidencia del laboratorio antes de autoatestiguarlo.");
  }
  const guard = await guardMutation(learner, body, "lab.attested", { moduleId: curriculumModule.id, attested: true }, { allowMonotonicMerge: true });
  if (guard.replayed) return envelope(await getLearnerDashboard(learner), guard.revision, true);
  const attestedAt = nowIso();
  await db.insert(labAttestations).values({
    id: await opaqueId("lab", guard.key),
    userId: learner.user.id,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    assignmentId: learner.professionalAssignment.id,
    labId: curriculumModule.lab.id,
    status: "self_attested",
    checksJson: stableJson(providedCheckIds),
    idempotencyKey: guard.key,
    attestedAt,
  }).onConflictDoNothing();
  const revision = await recordMutation(learner, guard, "lab.attested", "lab", curriculumModule.lab.id, { moduleId: curriculumModule.id, selfAttested: true });
  return envelope(await getLearnerDashboard(learner), revision, false);
}

async function assertAssessmentAvailable(learner: LearnerContext, kind: AssessmentKind, moduleId?: string) {
  const progress = await calculateModuleProgress(learner);
  if (kind === "module-quiz") {
    if (!moduleId) throw new LearningApiError(422, "MODULE_REQUIRED", "El test necesita un moduleId.");
    const curriculumModule = findModule(moduleId);
    await ensureModuleUnlocked(learner, curriculumModule.id);
    const moduleProgress = progress.find((item) => item.moduleId === curriculumModule.id);
    if (!moduleProgress || moduleProgress.completedLessonIds.length !== curriculumModule.lessons.length || !moduleProgress.labAttested) {
      throw new LearningApiError(422, "MODULE_ACTIVITY_REQUIRED", "Completa las lecciones y el laboratorio antes de iniciar el test.");
    }
    return;
  }
  const requiredIds = kind === "associate-simulator" ? modules.slice(0, 12).map((item) => item.id) : modules.map((item) => item.id);
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.moduleId));
  if (!requiredIds.every((id) => completed.has(id))) {
    throw new LearningApiError(422, "PROGRAM_ACTIVITY_REQUIRED", kind === "associate-simulator" ? "Completa los doce módulos troncales antes del simulacro Associate." : "Completa los 32 módulos antes del simulacro Professional.");
  }
}

export async function getPublicCredentialVerification(credentialId: string, verificationCode: string): Promise<PublicCredentialVerification> {
  const unknown: PublicCredentialVerification = {
    valid: false,
    status: "unknown",
    credentialId,
    certificateNumber: null,
    title: null,
    contentVersion: null,
    issuedAt: null,
    revokedAt: null,
    learnerDisplayName: null,
    issuerName: "Lakehouse Lab",
  };
  if (!credentialId || credentialId.length > 120 || !verificationCode || verificationCode.length > 120) return unknown;
  const db = getDb();
  const [row] = await db.select({
    id: credentials.id,
    status: credentials.status,
    certificateNumber: credentials.certificateNumber,
    title: credentials.title,
    contentVersion: credentials.contentVersion,
    issuedAt: credentials.issuedAt,
    revokedAt: credentials.revokedAt,
    organizationId: credentials.organizationId,
    learnerDisplayName: users.displayName,
  }).from(credentials)
    .innerJoin(users, eq(users.id, credentials.userId))
    .where(and(eq(credentials.id, credentialId), eq(credentials.verificationCode, verificationCode)))
    .limit(1);
  if (!row) return unknown;
  const brand = await getOrganizationBranding(row.organizationId);
  return {
    valid: row.status === "issued",
    status: row.status,
    credentialId: row.id,
    certificateNumber: row.certificateNumber,
    title: row.title,
    contentVersion: row.contentVersion,
    issuedAt: row.issuedAt,
    revokedAt: row.revokedAt,
    learnerDisplayName: row.learnerDisplayName,
    issuerName: brand.organizationName,
  };
}

export async function getActiveAssessment(learner: LearnerContext, kind: unknown, requestedModuleId?: unknown) {
  if (kind !== "module-quiz" && kind !== "associate-simulator" && kind !== "professional-simulator") {
    throw new LearningApiError(422, "INVALID_ASSESSMENT_KIND", "El tipo de evaluación no es válido.");
  }
  const moduleId = kind === "module-quiz"
    ? typeof requestedModuleId === "string" ? findModule(requestedModuleId).id : null
    : null;
  if (kind === "module-quiz" && !moduleId) {
    throw new LearningApiError(422, "MODULE_REQUIRED", "El test necesita un moduleId.");
  }
  const db = getDb();
  const conditions = [
    eq(assessmentAttempts.userId, learner.user.id),
    eq(assessmentAttempts.curriculumVersionId, PROFESSIONAL_CURRICULUM_VERSION_ID),
    eq(assessmentAttempts.kind, mapAssessmentKind(kind)),
    eq(assessmentAttempts.status, "started"),
  ];
  if (moduleId) conditions.push(eq(assessmentAttempts.moduleId, moduleId));
  const [row] = await db.select().from(assessmentAttempts)
    .where(and(...conditions))
    .orderBy(desc(assessmentAttempts.startedAt))
    .limit(1);
  return row ? publicAttempt(row) : null;
}

export async function startAssessment(learner: LearnerContext, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "La solicitud de evaluación no tiene un formato válido.");
  assertMutationInput(body);
  const kind = body.kind;
  const timingMode = body.timingMode;
  if (kind !== "module-quiz" && kind !== "associate-simulator" && kind !== "professional-simulator") throw new LearningApiError(422, "INVALID_ASSESSMENT_KIND", "El tipo de evaluación no es válido.");
  if (timingMode !== "untimed" && timingMode !== "1x" && timingMode !== "1.5x" && timingMode !== "2x") throw new LearningApiError(422, "INVALID_TIMING_MODE", "El modo de tiempo no es válido.");
  const moduleId = typeof body.moduleId === "string" ? findModule(body.moduleId).id : undefined;
  await assertAssessmentAvailable(learner, kind, moduleId);
  const guard = await guardMutation(learner, body, "assessment.started", { kind, timingMode, moduleId });
  const db = getDb();
  if (guard.replayed) {
    const [existing] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.idempotencyKey, guard.key)).limit(1);
    if (!existing) throw new LearningApiError(409, "INCOMPLETE_REPLAY", "El intento idempotente no se pudo recuperar.", true, guard.revision.value);
    return envelope(await publicAttempt(existing), guard.revision, true);
  }
  const [attemptCount] = await db.select({ value: count() }).from(assessmentAttempts).where(and(
    eq(assessmentAttempts.userId, learner.user.id),
    eq(assessmentAttempts.kind, mapAssessmentKind(kind)),
  ));
  const attemptNumber = Number(attemptCount?.value ?? 0) + 1;
  const prepared = prepareAssessment(assessmentDefinition(kind, moduleId, attemptNumber), timingMode);
  const startedAt = nowIso();
  const attemptId = await opaqueId("attempt", guard.key);
  const metadata: StoredAttemptMetadata = { attemptNumber, timingMode, ...(moduleId ? { moduleId } : {}) };
  await db.insert(assessmentAttempts).values({
    id: attemptId,
    userId: learner.user.id,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    assignmentId: learner.professionalAssignment.id,
    assessmentId: prepared.publicPayload.id,
    moduleId: moduleId ?? null,
    kind: mapAssessmentKind(kind),
    assessmentVersion: CONTENT_VERSION,
    seed: stableJson(metadata),
    timingMode,
    durationSeconds: prepared.publicPayload.timing.durationSeconds,
    expiresAt: createAssessmentAttempt({ attemptId, payload: prepared.publicPayload, startedAt }).expiresAt,
    provenance: "server_graded",
    publicPayloadJson: stableJson(prepared.publicPayload),
    answerKeyJson: stableJson(prepared.answerKey),
    status: "started",
    idempotencyKey: guard.key,
    startedAt,
  });
  const revision = await recordMutation(learner, guard, "assessment.started", "assessment_attempt", attemptId, { kind, timingMode, moduleId });
  const [stored] = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.id, attemptId)).limit(1);
  if (!stored) throw new Error("No se pudo recuperar el intento creado.");
  return envelope(await publicAttempt(stored), revision, false);
}

async function ownAttempt(learner: LearnerContext, attemptId: string) {
  const db = getDb();
  const [row] = await db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.id, attemptId), eq(assessmentAttempts.userId, learner.user.id))).limit(1);
  if (!row) throw new LearningApiError(404, "ASSESSMENT_NOT_FOUND", "No se ha encontrado ese intento.");
  return row;
}

export async function saveAssessmentSelections(learner: LearnerContext, attemptId: string, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "Las respuestas no tienen un formato válido.");
  assertMutationInput(body);
  if (!isRecord(body.selections)) throw new LearningApiError(422, "INVALID_SELECTIONS", "selections debe ser un mapa de pregunta y opción.");
  const row = await ownAttempt(learner, attemptId);
  if (row.status !== "started") throw new LearningApiError(422, "ATTEMPT_IMMUTABLE", "Un intento enviado ya no se puede modificar.");
  if (row.expiresAt !== null && Date.now() > Date.parse(row.expiresAt)) {
    throw new LearningApiError(422, "ATTEMPT_EXPIRED", "El tiempo del intento ha terminado. Envíalo para obtener el resultado.");
  }
  const { prepared } = prepareStoredAttempt(row);
  const selections = Object.fromEntries(Object.entries(body.selections).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  for (const [questionId, optionId] of Object.entries(selections)) {
    const question = prepared.publicPayload.questions.find((item) => item.id === questionId);
    if (!question || !question.options.some((option) => option.id === optionId)) throw new LearningApiError(422, "INVALID_SELECTION", "Una respuesta no pertenece a este intento.");
  }
  const guard = await guardMutation(learner, body, "assessment.answers_saved", { attemptId, selections });
  if (guard.replayed) return envelope(await publicAttempt(row), guard.revision, true);
  const db = getDb();
  await db.delete(assessmentResponses).where(eq(assessmentResponses.attemptId, attemptId));
  for (const [questionId, optionId] of Object.entries(selections)) {
    const question = prepared.publicPayload.questions.find((item) => item.id === questionId)!;
    await db.insert(assessmentResponses).values({
      attemptId,
      questionId,
      selectedOptionId: optionId,
      correct: false,
      objectiveId: question.domain ?? null,
    }).onConflictDoUpdate({
      target: [assessmentResponses.attemptId, assessmentResponses.questionId],
      set: { selectedOptionId: optionId, correct: false, objectiveId: question.domain ?? null },
    });
  }
  await db.update(assessmentAttempts).set({ selectionsJson: stableJson(selections) }).where(and(
    eq(assessmentAttempts.id, attemptId),
    eq(assessmentAttempts.userId, learner.user.id),
    eq(assessmentAttempts.status, "started"),
  ));
  const revision = await recordMutation(learner, guard, "assessment.answers_saved", "assessment_attempt", attemptId, { answered: Object.keys(selections).length });
  const updated = await ownAttempt(learner, attemptId);
  return envelope(await publicAttempt(updated), revision, false);
}

async function maybeIssueCredential(learner: LearnerContext, professionalAttempt: typeof assessmentAttempts.$inferSelect) {
  if (professionalAttempt.kind !== "professional_exam" || professionalAttempt.passed !== true || professionalAttempt.provenance !== "server_graded") return null;
  const db = getDb();
  const legacyImport = await getLegacyImportRecord(learner);
  if (legacyImport && (!professionalAttempt.submittedAt || Date.parse(professionalAttempt.submittedAt) <= Date.parse(legacyImport.importedAt))) return null;
  const progress = await calculateModuleProgress(learner);
  if (!progress.every((item) => item.completed)) return null;
  const submitted = await db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.userId, learner.user.id), eq(assessmentAttempts.status, "submitted")));
  const associatePassed = submitted.some((item) => item.kind === "associate_exam" && item.passed === true);
  if (!associatePassed) return null;
  const issuedAt = professionalAttempt.submittedAt ?? nowIso();
  const credentialId = await opaqueId("credential", `${learner.professionalAssignment.id}:${learner.user.id}`);
  const certificateNumber = `LL-${issuedAt.slice(0, 4)}-${(await sha256(credentialId)).slice(0, 10).toUpperCase()}`;
  await db.insert(credentials).values({
    id: credentialId,
    organizationId: learner.organization.id,
    userId: learner.user.id,
    assignmentId: learner.professionalAssignment.id,
    status: "issued",
    title: "Ruta profesional de Data Engineering con Databricks",
    certificateNumber,
    contentVersion: CONTENT_VERSION,
    criteriaJson: stableJson({
      requiredModules: 32,
      lessonsPerModule: 5,
      moduleQuizPercent: 75,
      associateSimulatorPercent: 80,
      professionalSimulatorPercent: 80,
      capstone: true,
      professionalAttemptId: professionalAttempt.id,
      professionalSubmittedAt: professionalAttempt.submittedAt,
      postImportRevalidated: Boolean(legacyImport),
      disclaimer: CERTIFICATE_DISCLAIMER,
    }),
    verificationCode: certificateNumber,
    issuedAt,
  }).onConflictDoNothing();
  await db.update(learnerAssignments).set({ status: "completed", completedAt: issuedAt, updatedAt: issuedAt }).where(and(
    eq(learnerAssignments.assignmentId, learner.professionalAssignment.id),
    eq(learnerAssignments.userId, learner.user.id),
  ));
  const [stored] = await db.select().from(credentials).where(and(eq(credentials.userId, learner.user.id), eq(credentials.assignmentId, learner.professionalAssignment.id))).limit(1);
  return stored ?? null;
}

export async function submitAssessment(learner: LearnerContext, attemptId: string, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "El envío no tiene un formato válido.");
  assertMutationInput(body);
  const row = await ownAttempt(learner, attemptId);
  if (row.status !== "started") {
    const scopedKey = `${learner.user.id}:${body.clientMutationId}`;
    const db = getDb();
    const [existing] = await db.select({ id: learningEvents.id }).from(learningEvents).where(eq(learningEvents.idempotencyKey, scopedKey)).limit(1);
    if (!existing) throw new LearningApiError(422, "ATTEMPT_IMMUTABLE", "Este intento ya fue enviado.");
  }
  const guard = await guardMutation(learner, body, "assessment.submitted", { attemptId }, { allowMonotonicMerge: true });
  if (guard.replayed) return envelope(assessmentResultPublic(row), guard.revision, true);
  const { prepared, attempt, metadata } = prepareStoredAttempt(row);
  const selections = await activeSelections(row, prepared);
  const result = gradeAssessment(prepared.answerKey, attempt, { attemptId, assessmentId: prepared.publicPayload.id, selections, submittedAt: nowIso() });
  const db = getDb();
  const nextMetadata: StoredAttemptMetadata = {
    ...metadata,
    result: {
      scorePercent: result.scorePercent,
      passed: result.passed,
      status: result.status,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      completed: result.completed,
      domainBreakdown: result.domainBreakdown,
      corrections: result.corrections.map(({ questionId, correctOptionId, correct, explanation, domain }) => ({ questionId, correctOptionId, correct, explanation, domain })),
    },
  };
  const submitted = await db.update(assessmentAttempts).set({
    status: "submitted",
    score: result.correctAnswers,
    maxScore: result.totalQuestions,
    percent: Math.round(result.scorePercent),
    passed: result.passed,
    submittedAt: result.submittedAt,
    seed: stableJson(nextMetadata),
    selectionsJson: "{}",
    domainBreakdownJson: stableJson(result.domainBreakdown),
  }).where(and(
    eq(assessmentAttempts.id, attemptId),
    eq(assessmentAttempts.userId, learner.user.id),
    eq(assessmentAttempts.status, "started"),
  ));
  if (submitted.rowsAffected !== 1) {
    throw new LearningApiError(422, "ATTEMPT_IMMUTABLE", "Este intento ya fue enviado.");
  }
  await db.delete(assessmentResponses).where(eq(assessmentResponses.attemptId, attemptId));
  const updated = await ownAttempt(learner, attemptId);
  const credential = await maybeIssueCredential(learner, updated);
  const revision = await recordMutation(learner, guard, "assessment.submitted", "assessment_attempt", attemptId, { kind: row.kind, scorePercent: result.scorePercent, passed: result.passed, credentialIssued: Boolean(credential) });
  return envelope({
    ...assessmentResultPublic(updated),
    correctAnswers: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    completed: result.completed,
    corrections: result.corrections,
    domainBreakdown: result.domainBreakdown,
  }, revision, false);
}

function assessmentResultPublic(row: typeof assessmentAttempts.$inferSelect) {
  const metadata = parseAttemptMetadata(row.seed);
  return {
    id: row.id,
    kind: unmapAssessmentKind(row.kind),
    status: row.status === "submitted" ? (metadata.result?.status ?? "graded") : "in-progress",
    score: row.score,
    maxScore: row.maxScore,
    scorePercent: row.percent,
    passed: row.passed,
    submittedAt: row.submittedAt,
    correctAnswers: metadata.result?.correctAnswers ?? row.score ?? 0,
    totalQuestions: metadata.result?.totalQuestions ?? row.maxScore ?? 0,
    completed: metadata.result?.completed ?? row.status === "submitted",
    domainBreakdown: metadata.result?.domainBreakdown ?? [],
    corrections: (metadata.result?.corrections ?? []).map((item) => ({ ...item, selectedOptionId: null })),
  };
}

export async function getCredentialForLearner(learner: LearnerContext, credentialId: string) {
  const db = getDb();
  const [row] = await db.select().from(credentials).where(and(eq(credentials.id, credentialId), eq(credentials.userId, learner.user.id), eq(credentials.organizationId, learner.organization.id))).limit(1);
  if (!row) throw new LearningApiError(404, "CREDENTIAL_NOT_FOUND", "No se ha encontrado ese certificado.");
  return row;
}

function pdfCompatibleText(font: PDFFont, value: string) {
  let safe = "";
  for (const character of value.normalize("NFC")) {
    try {
      font.encodeText(character);
      safe += character;
      continue;
    } catch {
      const fallback = character.normalize("NFKD").replace(/[\u0300-\u036f]/gu, "");
      let appended = false;
      for (const candidate of fallback) {
        try {
          font.encodeText(candidate);
          safe += candidate;
          appended = true;
        } catch {
          // Continue looking for a representable compatibility character.
        }
      }
      if (!appended) safe += "?";
    }
  }
  return safe || "—";
}

function pdfColor(hex: string) {
  return rgb(
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  );
}

export async function renderCredentialPdf(learner: LearnerContext, row: typeof credentials.$inferSelect) {
  const brand = await getOrganizationBranding(learner.organization.id);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Credencial de finalización · ${learner.user.displayName}`);
  pdf.setSubject(`${row.title}. ${CERTIFICATE_DISCLAIMER}`);
  pdf.setAuthor(brand.organizationName);
  pdf.setCreator("Lakehouse Lab Enterprise");
  pdf.setProducer("Lakehouse Lab Enterprise · pdf-lib");
  pdf.setKeywords(["formación interna", "Databricks", "Lakehouse Lab", row.contentVersion]);

  const page = pdf.addPage([841.89, 595.28]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regularText = (value: string) => pdfCompatibleText(regular, value);
  const boldText = (value: string) => pdfCompatibleText(bold, value);
  const ink = rgb(0.12, 0.14, 0.17);
  const muted = rgb(0.35, 0.39, 0.44);
  const purple = pdfColor(brand.primaryColor);
  const coral = pdfColor(brand.accentColor);
  const pale = rgb(0.96, 0.95, 0.98);

  page.drawRectangle({ x: 28, y: 28, width: 785.89, height: 539.28, borderColor: rgb(0.84, 0.85, 0.88), borderWidth: 1 });
  page.drawRectangle({ x: 28, y: 552, width: 785.89, height: 15.28, color: purple });
  page.drawRectangle({ x: 654, y: 552, width: 159.89, height: 15.28, color: coral });
  page.drawRectangle({ x: 58, y: 86, width: 725.89, height: 80, color: pale });

  page.drawText(boldText(brand.organizationName), { x: 58, y: 518, size: 11, font: bold, color: ink });
  page.drawText(regularText("Lakehouse Lab · Proyecto educativo independiente"), { x: 58, y: 500, size: 9, font: regular, color: muted });
  page.drawText(boldText("CERTIFICADO INTERNO DE FINALIZACIÓN"), { x: 58, y: 445, size: 12, font: bold, color: purple });
  page.drawText(boldText(row.title), { x: 58, y: 397, size: 27, font: bold, color: ink, maxWidth: 725 });
  page.drawText(regularText("Otorgado a"), { x: 58, y: 342, size: 10, font: regular, color: muted });
  page.drawText(boldText(learner.user.displayName), { x: 58, y: 304, size: 25, font: bold, color: ink, maxWidth: 725 });
  page.drawText(regularText("Ha completado los requisitos fijados de la ruta Professional."), { x: 58, y: 270, size: 12, font: regular, color: muted });

  const issuedDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: learner.organization.timezone }).format(new Date(row.issuedAt));
  const facts = [
    ["FECHA DE EMISIÓN", issuedDate],
    ["VERSIÓN DE CONTENIDO", row.contentVersion],
    ["NÚMERO DE CERTIFICADO", row.certificateNumber],
  ] as const;
  facts.forEach(([label, value], index) => {
    const x = 74 + index * 240;
    page.drawText(boldText(label), { x, y: 135, size: 8, font: bold, color: purple });
    page.drawText(regularText(value), { x, y: 113, size: 10, font: regular, color: ink, maxWidth: 210 });
  });
  page.drawText(regularText("Criterios: 32 módulos, cinco lecciones por módulo, laboratorios autoatestiguados, tests con al menos el 75 %, simulacros Associate y Professional con al menos el 80 % y capstone."), { x: 58, y: 66, size: 8.5, font: regular, color: muted, maxWidth: 725 });
  page.drawText(boldText(CERTIFICATE_DISCLAIMER), { x: 58, y: 45, size: 8.5, font: bold, color: coral, maxWidth: 725 });
  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}

export async function exportLearnerData(learner: LearnerContext) {
  const db = getDb();
  const [dashboard, lessons, reviews, labs, attempts, credentialRows, events] = await Promise.all([
    getLearnerDashboard(learner),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, learner.user.id)),
    db.select().from(reviewSchedules).where(eq(reviewSchedules.userId, learner.user.id)),
    db.select().from(labAttestations).where(eq(labAttestations.userId, learner.user.id)),
    db.select().from(assessmentAttempts).where(eq(assessmentAttempts.userId, learner.user.id)),
    db.select().from(credentials).where(eq(credentials.userId, learner.user.id)),
    db.select({ type: learningEvents.type, objectType: learningEvents.objectType, objectId: learningEvents.objectId, occurredAt: learningEvents.occurredAt }).from(learningEvents).where(eq(learningEvents.userId, learner.user.id)).orderBy(learningEvents.occurredAt),
  ]);
  return {
    exportedAt: nowIso(),
    profile: dashboard.learner,
    enrollment: dashboard.enrollment,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Internal proof and idempotency fields are intentionally omitted from exports.
    progress: { modules: dashboard.progress, reviews, lessons, labs: labs.map(({ checksJson: _checks, idempotencyKey: _key, ...lab }) => lab) },
    assessments: attempts.map(assessmentResultPublic),
    credentials: credentialRows.map(publicCredential),
    learningEvents: events,
  };
}

export async function deleteLearnerProgress(learner: LearnerContext, body: unknown) {
  if (!isRecord(body)) throw new LearningApiError(422, "INVALID_BODY", "La solicitud de borrado no tiene un formato válido.");
  assertMutationInput(body);
  const confirmation = body.confirm ?? body.confirmation;
  if (confirmation !== "ELIMINAR" && confirmation !== "BORRAR") throw new LearningApiError(422, "CONFIRMATION_REQUIRED", "Escribe ELIMINAR para confirmar la eliminación del progreso.");
  const guard = await guardMutation(learner, body, "progress.deleted", { confirm: "ELIMINAR" });
  if (guard.replayed) return envelope({ deleted: true }, guard.revision, true);
  const db = getDb();
  const attempts = await db.select({ id: assessmentAttempts.id }).from(assessmentAttempts).where(eq(assessmentAttempts.userId, learner.user.id));
  if (attempts.length) await db.delete(assessmentResponses).where(inArray(assessmentResponses.attemptId, attempts.map(({ id }) => id)));
  await db.delete(assessmentAttempts).where(eq(assessmentAttempts.userId, learner.user.id));
  await db.delete(reviewSchedules).where(eq(reviewSchedules.userId, learner.user.id));
  await db.delete(lessonProgress).where(eq(lessonProgress.userId, learner.user.id));
  await db.delete(labAttestations).where(eq(labAttestations.userId, learner.user.id));
  await db.delete(progressSnapshots).where(eq(progressSnapshots.userId, learner.user.id));
  await db.delete(earnedRewards).where(eq(earnedRewards.userId, learner.user.id));
  await db.delete(gamificationSummaries).where(eq(gamificationSummaries.userId, learner.user.id));
  await db.delete(credentials).where(eq(credentials.userId, learner.user.id));
  await db.delete(learningEvents).where(eq(learningEvents.userId, learner.user.id));
  const resetGuard = { ...guard, key: `${learner.user.id}:${body.clientMutationId}`, replayed: false };
  const deletedAt = nowIso();
  const revision = await recordMutation(learner, resetGuard, "progress.deleted", "user", learner.user.id, { deletedAt });
  await db.insert(privacyRequests).values({
    id: await opaqueId("privacy", resetGuard.key),
    organizationId: learner.organization.id,
    subjectUserId: learner.user.id,
    requestedByUserId: learner.user.id,
    type: "delete",
    status: "completed",
    requestedAt: deletedAt,
    completedAt: deletedAt,
    resolutionNote: "Progreso personal eliminado por solicitud autenticada del estudiante.",
  }).onConflictDoNothing();
  await db.update(learnerAssignments).set({ status: "not_started", startedAt: null, completedAt: null, updatedAt: deletedAt }).where(and(eq(learnerAssignments.userId, learner.user.id), eq(learnerAssignments.assignmentId, learner.professionalAssignment.id)));
  return envelope({ deleted: true }, revision, false);
}

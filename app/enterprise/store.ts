import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../../db";
import {
  anonymousRecoveryCredentials,
  anonymousSessions,
  assignments,
  assignmentUsers,
  auditEvents,
  curriculumVersions,
  learningEvents,
  learningPaths,
  learnerAssignments,
  organizationBranding,
  organizationMemberships,
  organizations,
  progressSnapshots,
  roleGrants,
  users,
} from "../../db/schema";
import { modules } from "../course-data";
import { CONTENT_VERSION } from "../progress";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  RECOVERY_CODE_TTL_DAYS,
} from "./anonymous-recovery";
import { DEFAULT_BRAND_CONFIG, parseBrandConfig, resolveTenantBrandConfig } from "./brand";
import type { Locale } from "../i18n/config";
import type {
  BrandConfig,
  CompletionPolicy,
  CurriculumManifest,
  EnterpriseIdentity,
  EnterpriseRole,
  IdempotentWriteResult,
  LearnerContext,
  ProgressSnapshotInput,
  ProgressSnapshotRecord,
} from "./types";

export const DEFAULT_ENTERPRISE_ORGANIZATION_ID = "org-lakehouse-lab";
export const PROFESSIONAL_PATH_ID = "professional";
export const PROFESSIONAL_CURRICULUM_VERSION_ID = "professional-v1";
export const PROFESSIONAL_ASSIGNMENT_ID = "professional-v1-auto";
export const PROFESSIONAL_ENROLLMENT_DAYS = 140;

type RuntimeEnvironment = {
  ORG_DISPLAY_NAME?: string;
  ORG_LOGO_URL?: string;
  ORG_BRAND_COLOR?: string;
  ORG_ACCENT_COLOR?: string;
  ORG_TIMEZONE?: string;
  ORG_SUPPORT_EMAIL?: string;
};

function runtimeEnvironment(): RuntimeEnvironment {
  return process.env as RuntimeEnvironment;
}

function runtimeBrandConfig(base: BrandConfig) {
  const runtime = runtimeEnvironment();
  return resolveTenantBrandConfig(base, {
    organizationName: runtime.ORG_DISPLAY_NAME,
    logoUrl: runtime.ORG_LOGO_URL,
    primaryColor: runtime.ORG_BRAND_COLOR,
    accentColor: runtime.ORG_ACCENT_COLOR,
    supportEmail: runtime.ORG_SUPPORT_EMAIL,
  });
}

function runtimeOrganizationTimezone(fallback = "Europe/Madrid") {
  const candidate = runtimeEnvironment().ORG_TIMEZONE?.trim();
  if (!candidate) return fallback;
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return fallback;
  }
}

export const PROFESSIONAL_COMPLETION_POLICY: CompletionPolicy = Object.freeze({
  requiredModuleIds: modules.map((module) => module.id),
  minimumModuleQuizPercent: 75,
  minimumFinalAssessmentPercent: 80,
  requireLabs: true,
  requireCapstone: true,
  issueInternalCredential: true,
});

export const PROFESSIONAL_MANIFEST: CurriculumManifest = Object.freeze({
  id: PROFESSIONAL_CURRICULUM_VERSION_ID,
  learningPathSlug: PROFESSIONAL_PATH_ID,
  contentVersion: CONTENT_VERSION,
  title: "Ruta profesional de Data Engineering con Databricks",
  moduleIds: modules.map((module) => module.id),
  completionPolicy: PROFESSIONAL_COMPLETION_POLICY,
});

const validLessonIds = new Set(modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)));
const validModuleIds = new Set(PROFESSIONAL_MANIFEST.moduleIds);
const PROFESSIONAL_TOTAL_LESSONS = modules.reduce((total, module) => total + module.lessons.length, 0);

export class EnterpriseInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnterpriseInputError";
  }
}

export class LearnerAccessError extends Error {
  constructor(message = "La cuenta no tiene acceso activo a la academia.") {
    super(message);
    this.name = "LearnerAccessError";
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("La clave de idempotencia ya se utilizó con otro contenido.");
    this.name = "IdempotencyConflictError";
  }
}

export class RecoveryCodeError extends Error {
  constructor() {
    super("El código de recuperación no es válido, ha caducado o ha sido revocado.");
    this.name = "RecoveryCodeError";
  }
}

function nowIso() {
  return new Date().toISOString();
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new EnterpriseInputError("La fecha de matrícula no es válida.");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function normalizeEmail(value: string) {
  const email = value.trim().toLocaleLowerCase("en-US");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new EnterpriseInputError("La identidad autenticada no contiene un email válido.");
  }
  return email;
}

function normalizeDisplayName(value: string, fallback: string) {
  const displayName = value.trim().replace(/\s+/g, " ");
  return (displayName || fallback).slice(0, 160);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
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

async function deterministicId(prefix: string, value: string) {
  return `${prefix}_${(await sha256(value)).slice(0, 32)}`;
}

function parseCompletionPolicy(value: string): CompletionPolicy {
  try {
    const parsed = JSON.parse(value) as Partial<CompletionPolicy>;
    if (!Array.isArray(parsed.requiredModuleIds)) return PROFESSIONAL_COMPLETION_POLICY;
    return {
      requiredModuleIds: parsed.requiredModuleIds.filter((id): id is string => typeof id === "string"),
      minimumModuleQuizPercent: Number(parsed.minimumModuleQuizPercent),
      minimumFinalAssessmentPercent: Number(parsed.minimumFinalAssessmentPercent),
      requireLabs: parsed.requireLabs === true,
      requireCapstone: parsed.requireCapstone === true,
      issueInternalCredential: parsed.issueInternalCredential === true,
    };
  } catch {
    return PROFESSIONAL_COMPLETION_POLICY;
  }
}

type EnterpriseBootstrapResult = { manifestHash: string; manifest: CurriculumManifest };
let enterpriseBootstrapPromise: Promise<EnterpriseBootstrapResult> | null = null;

async function bootstrapEnterprise(): Promise<EnterpriseBootstrapResult> {
  const db = getDb();
  const created = nowIso();
  const tenantBrand = runtimeBrandConfig(DEFAULT_BRAND_CONFIG);
  const tenantTimezone = runtimeOrganizationTimezone();
  const manifestJson = stableJson(PROFESSIONAL_MANIFEST);
  const manifestHash = await sha256(manifestJson);
  const policyJson = stableJson(PROFESSIONAL_COMPLETION_POLICY);

  const [existingAssignment] = await db.select({ id: assignments.id }).from(assignments)
    .where(eq(assignments.id, PROFESSIONAL_ASSIGNMENT_ID)).limit(1);
  if (existingAssignment) return { manifestHash, manifest: PROFESSIONAL_MANIFEST };

  await db.insert(organizations).values({
    id: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    slug: "lakehouse-lab",
    name: tenantBrand.organizationName,
    timezone: tenantTimezone,
    status: "active",
    createdAt: created,
    updatedAt: created,
  }).onConflictDoNothing();

  await db.insert(learningPaths).values({
    id: PROFESSIONAL_PATH_ID,
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    slug: PROFESSIONAL_PATH_ID,
    title: PROFESSIONAL_MANIFEST.title,
    description: "Los 32 módulos, laboratorios y evaluaciones de la ruta Professional.",
    status: "active",
    createdAt: created,
    updatedAt: created,
  }).onConflictDoNothing();

  await db.insert(curriculumVersions).values({
    id: PROFESSIONAL_CURRICULUM_VERSION_ID,
    learningPathId: PROFESSIONAL_PATH_ID,
    version: "v1",
    manifestHash,
    manifestJson,
    completionPolicyJson: policyJson,
    status: "published",
    publishedAt: created,
    createdAt: created,
  }).onConflictDoNothing();

  await db.insert(assignments).values({
    id: PROFESSIONAL_ASSIGNMENT_ID,
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    curriculumVersionId: PROFESSIONAL_CURRICULUM_VERSION_ID,
    title: PROFESSIONAL_MANIFEST.title,
    status: "active",
    autoEnroll: true,
    defaultDurationDays: PROFESSIONAL_ENROLLMENT_DAYS,
    completionPolicyJson: policyJson,
    createdAt: created,
    updatedAt: created,
  }).onConflictDoNothing();

  await db.insert(organizationBranding).values({
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    ...tenantBrand,
    updatedAt: created,
  }).onConflictDoNothing();

  return { manifestHash, manifest: PROFESSIONAL_MANIFEST };
}

export function ensureEnterpriseBootstrap(): Promise<EnterpriseBootstrapResult> {
  if (!enterpriseBootstrapPromise) {
    enterpriseBootstrapPromise = bootstrapEnterprise().catch((error) => {
      enterpriseBootstrapPromise = null;
      throw error;
    });
  }
  return enterpriseBootstrapPromise;
}

export async function autoEnrollProfessionalV1(userId: string, assignedAt = nowIso()) {
  const db = getDb();
  await ensureEnterpriseBootstrap();
  const learnerAssignmentId = await deterministicId("lasg", `${PROFESSIONAL_ASSIGNMENT_ID}:${userId}`);
  const dueAt = addDays(assignedAt, PROFESSIONAL_ENROLLMENT_DAYS);

  await db.insert(assignmentUsers).values({
    assignmentId: PROFESSIONAL_ASSIGNMENT_ID,
    userId,
    assignedAt,
  }).onConflictDoNothing();

  await db.insert(learnerAssignments).values({
    id: learnerAssignmentId,
    assignmentId: PROFESSIONAL_ASSIGNMENT_ID,
    userId,
    status: "not_started",
    assignedAt,
    dueAt,
    updatedAt: assignedAt,
  }).onConflictDoNothing();

  const [enrollment] = await db.select().from(learnerAssignments).where(and(
    eq(learnerAssignments.assignmentId, PROFESSIONAL_ASSIGNMENT_ID),
    eq(learnerAssignments.userId, userId),
  )).limit(1);
  if (!enrollment) throw new Error("No se pudo crear o recuperar la matrícula Professional.");
  return enrollment;
}

async function loadLearnerContext(email: string): Promise<LearnerContext | null> {
  const db = getDb();
  const rows = await db.select({
    userId: users.id,
    email: users.emailNormalized,
    displayName: users.displayName,
    locale: users.locale,
    userTimezone: users.timezone,
    userLastActivityAt: users.lastActivityAt,
    userStatus: users.status,
    membershipStatus: organizationMemberships.status,
    organizationId: organizations.id,
    organizationSlug: organizations.slug,
    organizationName: organizations.name,
    organizationTimezone: organizations.timezone,
    organizationStatus: organizations.status,
    role: roleGrants.role,
    assignmentId: assignments.id,
    enrollmentStatus: learnerAssignments.status,
    assignedAt: learnerAssignments.assignedAt,
    dueAt: learnerAssignments.dueAt,
    assignmentTitle: assignments.title,
    assignmentDurationDays: assignments.defaultDurationDays,
    completionPolicyJson: assignments.completionPolicyJson,
    curriculumVersionId: curriculumVersions.id,
  }).from(users)
    .innerJoin(organizationMemberships, and(
      eq(organizationMemberships.userId, users.id),
      eq(organizationMemberships.organizationId, DEFAULT_ENTERPRISE_ORGANIZATION_ID),
    ))
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .innerJoin(learnerAssignments, and(
      eq(learnerAssignments.userId, users.id),
      eq(learnerAssignments.assignmentId, PROFESSIONAL_ASSIGNMENT_ID),
    ))
    .innerJoin(assignments, eq(assignments.id, learnerAssignments.assignmentId))
    .innerJoin(curriculumVersions, eq(curriculumVersions.id, assignments.curriculumVersionId))
    .leftJoin(roleGrants, and(
      eq(roleGrants.userId, users.id),
      eq(roleGrants.organizationId, organizations.id),
    ))
    .where(eq(users.emailNormalized, email));
  const row = rows[0];
  if (!row) return null;
  if (row.userStatus !== "active" || row.membershipStatus !== "active" || row.organizationStatus !== "active") {
    throw new LearnerAccessError();
  }
  return {
    organization: {
      id: row.organizationId,
      slug: row.organizationSlug,
      name: row.organizationName,
      timezone: runtimeOrganizationTimezone(row.organizationTimezone),
    },
    user: {
      id: row.userId,
      email: row.email,
      displayName: row.displayName,
      locale: row.locale,
      timezone: row.userTimezone,
      lastActivityAt: row.userLastActivityAt,
      status: row.userStatus,
    },
    roles: rows.map(({ role }) => role).filter((role): role is EnterpriseRole => role !== null),
    professionalAssignment: {
      id: row.assignmentId,
      title: row.assignmentTitle,
      curriculumVersionId: row.curriculumVersionId,
      contentVersion: PROFESSIONAL_MANIFEST.contentVersion,
      assignedAt: row.assignedAt,
      dueAt: row.dueAt,
      durationDays: row.assignmentDurationDays,
      status: row.enrollmentStatus,
      completionPolicy: parseCompletionPolicy(row.completionPolicyJson),
    },
  };
}

export async function ensureLearner(identity: EnterpriseIdentity): Promise<LearnerContext> {
  const db = getDb();
  await ensureEnterpriseBootstrap();
  const email = normalizeEmail(identity.email);
  const displayName = normalizeDisplayName(identity.fullName ?? identity.displayName, email);
  const userId = await deterministicId("usr", email);
  const seenAt = nowIso();

  const existing = await loadLearnerContext(email);
  if (existing) return existing;

  await db.insert(users).values({
    id: userId,
    emailNormalized: email,
    displayName,
    status: "active",
    createdAt: seenAt,
    updatedAt: seenAt,
    lastSeenAt: seenAt,
  }).onConflictDoUpdate({
    target: users.emailNormalized,
    set: { displayName, lastSeenAt: seenAt, updatedAt: seenAt },
  });

  const [storedUser] = await db.select().from(users).where(eq(users.emailNormalized, email)).limit(1);
  if (!storedUser || storedUser.status !== "active") throw new LearnerAccessError();

  await db.insert(organizationMemberships).values({
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    userId: storedUser.id,
    status: "active",
    joinedAt: seenAt,
  }).onConflictDoNothing();

  await db.insert(roleGrants).values({
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    userId: storedUser.id,
    role: "learner",
    grantedAt: seenAt,
  }).onConflictDoNothing();

  await autoEnrollProfessionalV1(storedUser.id, seenAt);
  const created = await loadLearnerContext(email);
  if (!created) throw new LearnerAccessError("No se pudo completar la matrícula de esta cuenta.");
  return created;
}

export type AnonymousSessionResolution =
  | { status: "missing" | "inactive" }
  | {
    status: "active";
    identity: EnterpriseIdentity;
    userId: string;
    expiresAt: string;
  };

function validSecretHash(value: string) {
  return /^[a-f0-9]{64}$/u.test(value);
}

function assertFutureIso(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    throw new EnterpriseInputError("La expiración de la sesión no es válida.");
  }
}

export async function resolveAnonymousSession(tokenHash: string): Promise<AnonymousSessionResolution> {
  if (!validSecretHash(tokenHash)) return { status: "missing" };
  const db = getDb();
  const [row] = await db.select({
    userId: users.id,
    email: users.emailNormalized,
    displayName: users.displayName,
    userStatus: users.status,
    expiresAt: anonymousSessions.expiresAt,
    revokedAt: anonymousSessions.revokedAt,
  }).from(anonymousSessions)
    .innerJoin(users, eq(users.id, anonymousSessions.userId))
    .where(eq(anonymousSessions.tokenHash, tokenHash))
    .limit(1);
  if (!row) return { status: "missing" };
  if (row.revokedAt !== null || row.userStatus !== "active" || Date.parse(row.expiresAt) <= Date.now()) {
    return { status: "inactive" };
  }
  return {
    status: "active",
    identity: {
      email: row.email,
      displayName: row.displayName,
      fullName: null,
    },
    userId: row.userId,
    expiresAt: row.expiresAt,
  };
}

export async function bindAnonymousSession(tokenHash: string, userId: string, expiresAt: string) {
  if (!validSecretHash(tokenHash)) throw new EnterpriseInputError("La sesión anónima no es válida.");
  assertFutureIso(expiresAt);
  const db = getDb();
  const [existing] = await db.select({
    userId: anonymousSessions.userId,
    revokedAt: anonymousSessions.revokedAt,
  }).from(anonymousSessions).where(eq(anonymousSessions.tokenHash, tokenHash)).limit(1);
  if (existing) {
    if (existing.userId !== userId || existing.revokedAt !== null) {
      throw new LearnerAccessError("La sesión anónima ya no puede vincularse.");
    }
    return;
  }
  const createdAt = nowIso();
  await db.insert(anonymousSessions).values({
    tokenHash,
    userId,
    createdAt,
    expiresAt,
    lastSeenAt: createdAt,
  }).onConflictDoNothing();
}

export async function revokeAnonymousSession(tokenHash: string) {
  if (!validSecretHash(tokenHash)) return false;
  const db = getDb();
  const revokedAt = nowIso();
  const revoked = await db.transaction(async (tx) => {
    const rows = await tx.update(anonymousSessions).set({ revokedAt })
      .where(and(
        eq(anonymousSessions.tokenHash, tokenHash),
        isNull(anonymousSessions.revokedAt),
      ))
      .returning({ userId: anonymousSessions.userId });
    const row = rows[0];
    if (!row) return false;
    await tx.insert(auditEvents).values({
      id: await deterministicId("aud", `session-revoked:${tokenHash}`),
      organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
      actorUserId: row.userId,
      action: "anonymous_session.revoked",
      targetType: "user",
      targetId: row.userId,
      payloadJson: "{}",
      createdAt: revokedAt,
    }).onConflictDoNothing();
    return true;
  });
  return revoked;
}

export async function issueAnonymousRecoveryCode(learner: LearnerContext) {
  const code = generateRecoveryCode();
  const codeHash = hashRecoveryCode(code)!;
  const createdAt = nowIso();
  const expiresAt = addDays(createdAt, RECOVERY_CODE_TTL_DAYS);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(anonymousRecoveryCredentials).values({
      userId: learner.user.id,
      codeHash,
      createdAt,
      expiresAt,
    }).onConflictDoUpdate({
      target: anonymousRecoveryCredentials.userId,
      set: {
        codeHash,
        createdAt,
        expiresAt,
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    await tx.insert(auditEvents).values({
      id: await deterministicId("aud", `recovery-issued:${codeHash}`),
      organizationId: learner.organization.id,
      actorUserId: learner.user.id,
      action: "anonymous_recovery.issued",
      targetType: "user",
      targetId: learner.user.id,
      payloadJson: stableJson({ expiresAt }),
      createdAt,
    }).onConflictDoNothing();
  });
  return { code, expiresAt };
}

export async function revokeAnonymousRecoveryCode(learner: LearnerContext) {
  const db = getDb();
  const revokedAt = nowIso();
  return db.transaction(async (tx) => {
    const rows = await tx.update(anonymousRecoveryCredentials).set({ revokedAt })
      .where(and(
        eq(anonymousRecoveryCredentials.userId, learner.user.id),
        isNull(anonymousRecoveryCredentials.revokedAt),
      ))
      .returning({ codeHash: anonymousRecoveryCredentials.codeHash });
    const row = rows[0];
    if (!row) return { revoked: false };
    await tx.insert(auditEvents).values({
      id: await deterministicId("aud", `recovery-revoked:${row.codeHash}`),
      organizationId: learner.organization.id,
      actorUserId: learner.user.id,
      action: "anonymous_recovery.revoked",
      targetType: "user",
      targetId: learner.user.id,
      payloadJson: "{}",
      createdAt: revokedAt,
    }).onConflictDoNothing();
    return { revoked: true };
  });
}

export async function recoverAnonymousSession(code: unknown, tokenHash: string, expiresAt: string) {
  const codeHash = hashRecoveryCode(code);
  if (!codeHash || !validSecretHash(tokenHash)) throw new RecoveryCodeError();
  assertFutureIso(expiresAt);
  const db = getDb();
  const usedAt = nowIso();
  return db.transaction(async (tx) => {
    const rows = await tx.update(anonymousRecoveryCredentials).set({ lastUsedAt: usedAt })
      .where(and(
        eq(anonymousRecoveryCredentials.codeHash, codeHash),
        isNull(anonymousRecoveryCredentials.revokedAt),
        gt(anonymousRecoveryCredentials.expiresAt, usedAt),
      ))
      .returning({ userId: anonymousRecoveryCredentials.userId });
    const credential = rows[0];
    if (!credential) throw new RecoveryCodeError();

    const [user] = await tx.select({
      id: users.id,
      userStatus: users.status,
      membershipStatus: organizationMemberships.status,
      organizationStatus: organizations.status,
    }).from(users)
      .innerJoin(organizationMemberships, and(
        eq(organizationMemberships.userId, users.id),
        eq(organizationMemberships.organizationId, DEFAULT_ENTERPRISE_ORGANIZATION_ID),
      ))
      .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
      .where(eq(users.id, credential.userId))
      .limit(1);
    if (
      !user
      || user.userStatus !== "active"
      || user.membershipStatus !== "active"
      || user.organizationStatus !== "active"
    ) {
      throw new RecoveryCodeError();
    }

    await tx.insert(anonymousSessions).values({
      tokenHash,
      userId: user.id,
      createdAt: usedAt,
      expiresAt,
      lastSeenAt: usedAt,
    });
    await tx.insert(auditEvents).values({
      id: await deterministicId("aud", `recovery-used:${tokenHash}`),
      organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
      actorUserId: user.id,
      action: "anonymous_recovery.used",
      targetType: "user",
      targetId: user.id,
      payloadJson: stableJson({ sessionExpiresAt: expiresAt }),
      createdAt: usedAt,
    });
    return { userId: user.id, expiresAt };
  });
}

function validateSnapshot(input: ProgressSnapshotInput) {
  if (input.contentVersion !== PROFESSIONAL_MANIFEST.contentVersion) throw new EnterpriseInputError("La versión de progreso no coincide con professional-v1.");
  if (!Number.isInteger(input.totalModules) || input.totalModules !== PROFESSIONAL_MANIFEST.moduleIds.length) throw new EnterpriseInputError("El total de módulos no coincide con el manifiesto Professional.");
  if (!Number.isInteger(input.totalLessons) || input.totalLessons !== PROFESSIONAL_TOTAL_LESSONS) throw new EnterpriseInputError("El total de lecciones no coincide con el manifiesto Professional.");
  if (input.completedModuleIds.some((id) => !validModuleIds.has(id))) throw new EnterpriseInputError("El snapshot contiene un módulo desconocido.");
  if (input.completedLessonIds.some((id) => !validLessonIds.has(id))) throw new EnterpriseInputError("El snapshot contiene una lección desconocida.");
  if (input.labsPassed.some((id) => !validModuleIds.has(id))) throw new EnterpriseInputError("El snapshot contiene un laboratorio desconocido.");
  if (Object.entries(input.quizBestScores).some(([id, score]) => !validModuleIds.has(id) || !Number.isInteger(score) || score < 0 || score > 4)) throw new EnterpriseInputError("El snapshot contiene una nota de test inválida.");
  for (const [label, number, maximum] of [["progreso", input.progressPercent, 100], ["XP", input.xp, 100_000], ["racha", input.streak, 10_000]] as const) {
    if (!Number.isInteger(number) || number < 0 || number > maximum) throw new EnterpriseInputError(`El valor de ${label} no es válido.`);
  }
  if (Number.isNaN(new Date(input.capturedAt).getTime())) throw new EnterpriseInputError("La fecha del snapshot no es válida.");
}

function snapshotRecord(row: typeof progressSnapshots.$inferSelect): ProgressSnapshotRecord {
  return {
    assignmentId: row.assignmentId,
    userId: row.userId,
    contentVersion: row.contentVersion,
    completedModules: row.completedModules,
    totalModules: row.totalModules,
    completedLessons: row.completedLessons,
    totalLessons: row.totalLessons,
    labsPassed: row.labsPassed,
    quizAveragePercent: row.quizAveragePercent,
    progressPercent: row.progressPercent,
    xp: row.xp,
    streak: row.streak,
    capturedAt: row.capturedAt,
    payloadHash: row.payloadHash,
  };
}

export async function getProgressSnapshot(learner: LearnerContext): Promise<ProgressSnapshotRecord | null> {
  const db = getDb();
  const [row] = await db.select().from(progressSnapshots).where(and(
    eq(progressSnapshots.assignmentId, learner.professionalAssignment.id),
    eq(progressSnapshots.userId, learner.user.id),
  )).limit(1);
  return row ? snapshotRecord(row) : null;
}

export async function saveProgressSnapshot(
  learner: LearnerContext,
  input: ProgressSnapshotInput,
  idempotencyKey: string,
): Promise<IdempotentWriteResult<ProgressSnapshotRecord>> {
  validateSnapshot(input);
  if (idempotencyKey.length < 16 || idempotencyKey.length > 160) throw new EnterpriseInputError("La clave de idempotencia debe tener entre 16 y 160 caracteres.");
  const db = getDb();
  const canonicalInput: ProgressSnapshotInput = {
    ...input,
    completedModuleIds: [...new Set(input.completedModuleIds)].sort(),
    completedLessonIds: [...new Set(input.completedLessonIds)].sort(),
    labsPassed: [...new Set(input.labsPassed)].sort(),
    quizBestScores: Object.fromEntries(Object.entries(input.quizBestScores).sort(([first], [second]) => first.localeCompare(second))),
  };
  const snapshotJson = stableJson(canonicalInput);
  const payloadHash = await sha256(snapshotJson);
  const [existingEvent] = await db.select().from(learningEvents).where(eq(learningEvents.idempotencyKey, idempotencyKey)).limit(1);
  if (existingEvent && existingEvent.payloadHash !== payloadHash) throw new IdempotencyConflictError();

  const [existingSnapshot] = await db.select().from(progressSnapshots).where(and(
    eq(progressSnapshots.assignmentId, learner.professionalAssignment.id),
    eq(progressSnapshots.userId, learner.user.id),
  )).limit(1);
  if (existingSnapshot && existingSnapshot.capturedAt > canonicalInput.capturedAt) {
    return { value: snapshotRecord(existingSnapshot), replayed: true };
  }

  const eventId = await deterministicId("evt", idempotencyKey);
  const occurredAt = canonicalInput.capturedAt;
  await db.insert(learningEvents).values({
    id: eventId,
    organizationId: learner.organization.id,
    userId: learner.user.id,
    assignmentId: learner.professionalAssignment.id,
    type: canonicalInput.source === "legacy_device" ? "progress.imported" : "progress.snapshot",
    objectType: "assignment",
    objectId: learner.professionalAssignment.id,
    idempotencyKey,
    payloadHash,
    metadataJson: stableJson({ source: canonicalInput.source, progressPercent: canonicalInput.progressPercent }),
    occurredAt,
  }).onConflictDoNothing();

  const quizScores = Object.values(canonicalInput.quizBestScores);
  const quizAveragePercent = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / (quizScores.length * 4) * 100) : 0;
  const values = {
    assignmentId: learner.professionalAssignment.id,
    userId: learner.user.id,
    contentVersion: canonicalInput.contentVersion,
    completedModules: canonicalInput.completedModuleIds.length,
    totalModules: canonicalInput.totalModules,
    completedLessons: canonicalInput.completedLessonIds.length,
    totalLessons: canonicalInput.totalLessons,
    labsPassed: canonicalInput.labsPassed.length,
    quizAveragePercent,
    progressPercent: canonicalInput.progressPercent,
    xp: canonicalInput.xp,
    streak: canonicalInput.streak,
    payloadHash,
    snapshotJson,
    capturedAt: canonicalInput.capturedAt,
    updatedAt: nowIso(),
  };
  await db.insert(progressSnapshots).values(values).onConflictDoUpdate({
    target: [progressSnapshots.assignmentId, progressSnapshots.userId],
    set: values,
  });

  const hasActivity = canonicalInput.completedLessonIds.length > 0 || canonicalInput.labsPassed.length > 0 || Object.keys(canonicalInput.quizBestScores).length > 0;
  const completed = PROFESSIONAL_MANIFEST.moduleIds.every((id) => canonicalInput.completedModuleIds.includes(id));
  const [currentEnrollment] = await db.select().from(learnerAssignments).where(and(
    eq(learnerAssignments.assignmentId, learner.professionalAssignment.id),
    eq(learnerAssignments.userId, learner.user.id),
  )).limit(1);
  if (currentEnrollment && currentEnrollment.status !== "waived" && currentEnrollment.status !== "cancelled") {
    await db.update(learnerAssignments).set({
      status: completed ? "completed" : hasActivity ? "in_progress" : "not_started",
      startedAt: hasActivity ? currentEnrollment.startedAt ?? occurredAt : null,
      completedAt: completed ? currentEnrollment.completedAt ?? occurredAt : null,
      updatedAt: nowIso(),
    }).where(eq(learnerAssignments.id, currentEnrollment.id));
  }

  const [stored] = await db.select().from(progressSnapshots).where(and(
    eq(progressSnapshots.assignmentId, learner.professionalAssignment.id),
    eq(progressSnapshots.userId, learner.user.id),
  )).limit(1);
  if (!stored) throw new Error("No se pudo recuperar el snapshot guardado.");
  return { value: snapshotRecord(stored), replayed: Boolean(existingEvent) };
}

export async function getOrganizationBranding(organizationId = DEFAULT_ENTERPRISE_ORGANIZATION_ID): Promise<BrandConfig> {
  const db = getDb();
  await ensureEnterpriseBootstrap();
  const [row] = await db.select().from(organizationBranding).where(eq(organizationBranding.organizationId, organizationId)).limit(1);
  const stored = row ? parseBrandConfig(row) : DEFAULT_BRAND_CONFIG;
  return runtimeBrandConfig(stored);
}

export async function setLearnerLocale(learner: LearnerContext, locale: Locale) {
  const changedAt = nowIso();
  const db = getDb();
  await db.update(users).set({
    locale,
    updatedAt: changedAt,
    lastSeenAt: changedAt,
  }).where(eq(users.id, learner.user.id));
}

export async function saveOrganizationBranding(
  actor: LearnerContext,
  value: unknown,
  idempotencyKey: string,
): Promise<IdempotentWriteResult<BrandConfig>> {
  if (!actor.roles.includes("admin")) throw new LearnerAccessError("Solo un administrador puede cambiar la marca de la organización.");
  if (idempotencyKey.length < 16 || idempotencyKey.length > 160) throw new EnterpriseInputError("La clave de idempotencia debe tener entre 16 y 160 caracteres.");
  const brand = parseBrandConfig(value);
  const payloadJson = stableJson(brand);
  const auditId = await deterministicId("aud", `branding:${idempotencyKey}`);
  const db = getDb();
  const [existingAudit] = await db.select().from(auditEvents).where(eq(auditEvents.id, auditId)).limit(1);
  if (existingAudit && existingAudit.payloadJson !== payloadJson) throw new IdempotencyConflictError();
  const changedAt = nowIso();

  await db.insert(organizationBranding).values({
    organizationId: actor.organization.id,
    ...brand,
    updatedByUserId: actor.user.id,
    updatedAt: changedAt,
  }).onConflictDoUpdate({
    target: organizationBranding.organizationId,
    set: { ...brand, updatedByUserId: actor.user.id, updatedAt: changedAt },
  });
  await db.insert(auditEvents).values({
    id: auditId,
    organizationId: actor.organization.id,
    actorUserId: actor.user.id,
    action: "organization.branding.updated",
    targetType: "organization",
    targetId: actor.organization.id,
    payloadJson,
    createdAt: changedAt,
  }).onConflictDoNothing();
  return { value: brand, replayed: Boolean(existingAudit) };
}

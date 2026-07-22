import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../db";
import {
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
import { DEFAULT_BRAND_CONFIG, parseBrandConfig, resolveTenantBrandConfig } from "./brand";
import type {
  AssignmentSnapshot,
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

type SitesTenantEnvironment = {
  ORG_DISPLAY_NAME?: string;
  ORG_LOGO_URL?: string;
  ORG_BRAND_COLOR?: string;
  ORG_ACCENT_COLOR?: string;
  ORG_TIMEZONE?: string;
  ORG_SUPPORT_EMAIL?: string;
};

function sitesTenantEnvironment() {
  return env as unknown as SitesTenantEnvironment;
}

function runtimeBrandConfig(base: BrandConfig) {
  const runtime = sitesTenantEnvironment();
  return resolveTenantBrandConfig(base, {
    organizationName: runtime.ORG_DISPLAY_NAME,
    logoUrl: runtime.ORG_LOGO_URL,
    primaryColor: runtime.ORG_BRAND_COLOR,
    accentColor: runtime.ORG_ACCENT_COLOR,
    supportEmail: runtime.ORG_SUPPORT_EMAIL,
  });
}

function runtimeOrganizationTimezone(fallback = "Europe/Madrid") {
  const candidate = sitesTenantEnvironment().ORG_TIMEZONE?.trim();
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

export async function ensureEnterpriseBootstrap() {
  const db = getDb();
  const created = nowIso();
  const tenantBrand = runtimeBrandConfig(DEFAULT_BRAND_CONFIG);
  const tenantTimezone = runtimeOrganizationTimezone();
  const manifestJson = stableJson(PROFESSIONAL_MANIFEST);
  const manifestHash = await sha256(manifestJson);
  const policyJson = stableJson(PROFESSIONAL_COMPLETION_POLICY);

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

export async function ensureLearner(identity: EnterpriseIdentity): Promise<LearnerContext> {
  const db = getDb();
  await ensureEnterpriseBootstrap();
  const email = normalizeEmail(identity.email);
  const displayName = normalizeDisplayName(identity.fullName ?? identity.displayName, email);
  const userId = await deterministicId("usr", email);
  const seenAt = nowIso();

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

  const [membership] = await db.select().from(organizationMemberships).where(and(
    eq(organizationMemberships.organizationId, DEFAULT_ENTERPRISE_ORGANIZATION_ID),
    eq(organizationMemberships.userId, storedUser.id),
  )).limit(1);
  if (!membership || membership.status !== "active") throw new LearnerAccessError();

  await db.insert(roleGrants).values({
    organizationId: DEFAULT_ENTERPRISE_ORGANIZATION_ID,
    userId: storedUser.id,
    role: "learner",
    grantedAt: seenAt,
  }).onConflictDoNothing();

  const enrollment = await autoEnrollProfessionalV1(storedUser.id, seenAt);
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, DEFAULT_ENTERPRISE_ORGANIZATION_ID)).limit(1);
  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, PROFESSIONAL_ASSIGNMENT_ID)).limit(1);
  const [curriculum] = await db.select().from(curriculumVersions).where(eq(curriculumVersions.id, PROFESSIONAL_CURRICULUM_VERSION_ID)).limit(1);
  const grantedRoles = await db.select({ role: roleGrants.role }).from(roleGrants).where(and(
    eq(roleGrants.organizationId, DEFAULT_ENTERPRISE_ORGANIZATION_ID),
    eq(roleGrants.userId, storedUser.id),
  ));
  if (!organization || organization.status !== "active" || !assignment || !curriculum) throw new LearnerAccessError();

  const assignmentSnapshot: AssignmentSnapshot = {
    id: assignment.id,
    title: assignment.title,
    curriculumVersionId: curriculum.id,
    contentVersion: PROFESSIONAL_MANIFEST.contentVersion,
    assignedAt: enrollment.assignedAt,
    dueAt: enrollment.dueAt,
    durationDays: assignment.defaultDurationDays,
    status: enrollment.status,
    completionPolicy: parseCompletionPolicy(assignment.completionPolicyJson),
  };

  return {
    organization: { id: organization.id, slug: organization.slug, name: organization.name, timezone: runtimeOrganizationTimezone(organization.timezone) },
    user: { id: storedUser.id, email: storedUser.emailNormalized, displayName: storedUser.displayName, locale: storedUser.locale, timezone: storedUser.timezone, lastActivityAt: storedUser.lastActivityAt, status: storedUser.status },
    roles: grantedRoles.map(({ role }) => role as EnterpriseRole),
    professionalAssignment: assignmentSnapshot,
  };
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

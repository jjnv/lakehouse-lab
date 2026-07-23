import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = () => text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () => text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`);

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("Europe/Madrid"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("organizations_slug_unique").on(table.slug),
]);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  emailNormalized: text("email_normalized").notNull(),
  displayName: text("display_name").notNull(),
  locale: text("locale", { enum: ["es", "en"] }).notNull().default("es"),
  timezone: text("timezone").notNull().default("Europe/Madrid"),
  status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastSeenAt: text("last_seen_at").notNull(),
  lastActivityAt: text("last_activity_at"),
}, (table) => [
  uniqueIndex("users_email_normalized_unique").on(table.emailNormalized),
]);

export const anonymousSessions = sqliteTable("anonymous_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  revokedAt: text("revoked_at"),
}, (table) => [
  index("anonymous_sessions_user_idx").on(table.userId, table.expiresAt),
]);

export const anonymousRecoveryCredentials = sqliteTable("anonymous_recovery_credentials", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  lastUsedAt: text("last_used_at"),
  revokedAt: text("revoked_at"),
}, (table) => [
  uniqueIndex("anonymous_recovery_credentials_code_unique").on(table.codeHash),
]);

export const learnerPreferences = sqliteTable("learner_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  goal: text("goal", { enum: ["associate", "professional", "topics"] }).notNull().default("professional"),
  weeklyTargetMinutes: integer("weekly_target_minutes").notNull().default(300),
  cloud: text("cloud", { enum: ["multicloud", "azure", "aws", "gcp", "free-edition"] }).notNull().default("multicloud"),
  onboardingCompletedAt: text("onboarding_completed_at"),
  updatedAt: updatedAt(),
});

export const organizationMemberships = sqliteTable("organization_memberships", {
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
  joinedAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
  index("organization_memberships_user_idx").on(table.userId),
]);

export const roleGrants = sqliteTable("role_grants", {
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["learner", "manager", "admin"] }).notNull(),
  grantedByUserId: text("granted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  grantedAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId, table.role] }),
  index("role_grants_user_idx").on(table.userId),
]);

export const cohorts = sqliteTable("cohorts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  startsOn: text("starts_on"),
  endsOn: text("ends_on"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("cohorts_org_slug_unique").on(table.organizationId, table.slug),
  index("cohorts_org_status_idx").on(table.organizationId, table.status),
]);

export const cohortMembers = sqliteTable("cohort_members", {
  cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: createdAt(),
  removedAt: text("removed_at"),
}, (table) => [
  primaryKey({ columns: [table.cohortId, table.userId] }),
  index("cohort_members_user_idx").on(table.userId),
]);

export const cohortManagers = sqliteTable("cohort_managers", {
  cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.cohortId, table.userId] }),
  index("cohort_managers_user_idx").on(table.userId),
]);

export const learningPaths = sqliteTable("learning_paths", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("learning_paths_org_slug_unique").on(table.organizationId, table.slug),
]);

export const curriculumVersions = sqliteTable("curriculum_versions", {
  id: text("id").primaryKey(),
  learningPathId: text("learning_path_id").notNull().references(() => learningPaths.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  manifestHash: text("manifest_hash").notNull(),
  manifestJson: text("manifest_json").notNull(),
  completionPolicyJson: text("completion_policy_json").notNull(),
  status: text("status", { enum: ["draft", "published", "retired"] }).notNull().default("published"),
  publishedAt: text("published_at").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("curriculum_versions_path_version_unique").on(table.learningPathId, table.version),
  index("curriculum_versions_status_idx").on(table.status),
]);

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  status: text("status", { enum: ["active", "closed", "cancelled"] }).notNull().default("active"),
  autoEnroll: integer("auto_enroll", { mode: "boolean" }).notNull().default(false),
  defaultDurationDays: integer("default_duration_days").notNull().default(140),
  startsAt: text("starts_at"),
  dueAt: text("due_at"),
  completionPolicyJson: text("completion_policy_json").notNull(),
  createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("assignments_org_status_idx").on(table.organizationId, table.status),
  index("assignments_curriculum_idx").on(table.curriculumVersionId),
]);

export const assignmentCohorts = sqliteTable("assignment_cohorts", {
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  assignedAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.assignmentId, table.cohortId] }),
]);

export const assignmentUsers = sqliteTable("assignment_users", {
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.assignmentId, table.userId] }),
  index("assignment_users_user_idx").on(table.userId),
]);

export const learnerAssignments = sqliteTable("learner_assignments", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["not_started", "in_progress", "completed", "waived", "cancelled"] }).notNull().default("not_started"),
  assignedAt: text("assigned_at").notNull(),
  dueAt: text("due_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  waivedAt: text("waived_at"),
  waiverReason: text("waiver_reason"),
  progressRevision: integer("progress_revision").notNull().default(0),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("learner_assignments_assignment_user_unique").on(table.assignmentId, table.userId),
  index("learner_assignments_user_status_idx").on(table.userId, table.status),
  index("learner_assignments_assignment_status_idx").on(table.assignmentId, table.status),
  index("learner_assignments_due_idx").on(table.dueAt, table.status),
]);

export const lessonProgress = sqliteTable("lesson_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  status: text("status", { enum: ["not_started", "completed"] }).notNull().default("not_started"),
  completedAt: text("completed_at"),
  source: text("source", { enum: ["native", "legacy_device", "admin_import"] }).notNull().default("native"),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.curriculumVersionId, table.lessonId] }),
  index("lesson_progress_curriculum_status_idx").on(table.curriculumVersionId, table.status),
]);

export const reviewSchedules = sqliteTable("review_schedules", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  dueOn: text("due_on").notNull(),
  intervalDays: integer("interval_days").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastRating: text("last_rating", { enum: ["again", "good"] }).notNull(),
  lastReviewedOn: text("last_reviewed_on").notNull(),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.curriculumVersionId, table.lessonId] }),
  index("review_schedules_user_due_idx").on(table.userId, table.dueOn),
]);

export const labAttestations = sqliteTable("lab_attestations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "set null" }),
  labId: text("lab_id").notNull(),
  status: text("status", { enum: ["self_attested", "revoked"] }).notNull().default("self_attested"),
  checksJson: text("checks_json").notNull().default("[]"),
  idempotencyKey: text("idempotency_key").notNull(),
  attestedAt: text("attested_at").notNull(),
  revokedAt: text("revoked_at"),
}, (table) => [
  uniqueIndex("lab_attestations_idempotency_unique").on(table.idempotencyKey),
  index("lab_attestations_user_lab_idx").on(table.userId, table.curriculumVersionId, table.labId),
]);

export const assessmentAttempts = sqliteTable("assessment_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "set null" }),
  assessmentId: text("assessment_id").notNull(),
  moduleId: text("module_id"),
  kind: text("kind", { enum: ["module_quiz", "associate_exam", "professional_exam"] }).notNull(),
  assessmentVersion: text("assessment_version").notNull(),
  seed: text("seed"),
  timingMode: text("timing_mode", { enum: ["untimed", "1x", "1.5x", "2x"] }).notNull().default("untimed"),
  durationSeconds: integer("duration_seconds"),
  expiresAt: text("expires_at"),
  provenance: text("provenance", { enum: ["server_graded", "legacy_client"] }).notNull().default("server_graded"),
  publicPayloadJson: text("public_payload_json").notNull().default("{}"),
  answerKeyJson: text("answer_key_json").notNull().default("{}"),
  selectionsJson: text("selections_json").notNull().default("{}"),
  domainBreakdownJson: text("domain_breakdown_json"),
  status: text("status", { enum: ["started", "submitted", "abandoned"] }).notNull().default("started"),
  score: integer("score"),
  maxScore: integer("max_score"),
  percent: integer("percent"),
  passed: integer("passed", { mode: "boolean" }),
  idempotencyKey: text("idempotency_key").notNull(),
  startedAt: text("started_at").notNull(),
  submittedAt: text("submitted_at"),
}, (table) => [
  uniqueIndex("assessment_attempts_idempotency_unique").on(table.idempotencyKey),
  index("assessment_attempts_user_assessment_idx").on(table.userId, table.assessmentId, table.submittedAt),
]);

export const assessmentResponses = sqliteTable("assessment_responses", {
  attemptId: text("attempt_id").notNull().references(() => assessmentAttempts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  selectedOptionId: text("selected_option_id").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  objectiveId: text("objective_id"),
}, (table) => [
  primaryKey({ columns: [table.attemptId, table.questionId] }),
  index("assessment_responses_objective_idx").on(table.objectiveId, table.correct),
]);

export const learningEvents = sqliteTable("learning_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  objectType: text("object_type").notNull(),
  objectId: text("object_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  payloadHash: text("payload_hash").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  occurredAt: text("occurred_at").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("learning_events_idempotency_unique").on(table.idempotencyKey),
  index("learning_events_user_occurred_idx").on(table.userId, table.occurredAt),
  index("learning_events_assignment_occurred_idx").on(table.assignmentId, table.occurredAt),
]);

export const progressSnapshots = sqliteTable("progress_snapshots", {
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentVersion: text("content_version").notNull(),
  completedModules: integer("completed_modules").notNull(),
  totalModules: integer("total_modules").notNull(),
  completedLessons: integer("completed_lessons").notNull(),
  totalLessons: integer("total_lessons").notNull(),
  labsPassed: integer("labs_passed").notNull(),
  quizAveragePercent: integer("quiz_average_percent").notNull(),
  progressPercent: integer("progress_percent").notNull(),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  payloadHash: text("payload_hash").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  capturedAt: text("captured_at").notNull(),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.assignmentId, table.userId] }),
  index("progress_snapshots_assignment_progress_idx").on(table.assignmentId, table.progressPercent),
]);

export const credentials = sqliteTable("credentials", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "restrict" }),
  status: text("status", { enum: ["issued", "revoked"] }).notNull().default("issued"),
  title: text("title").notNull(),
  certificateNumber: text("certificate_number").notNull(),
  contentVersion: text("content_version").notNull(),
  criteriaJson: text("criteria_json").notNull(),
  verificationCode: text("verification_code").notNull(),
  issuedAt: text("issued_at").notNull(),
  revokedAt: text("revoked_at"),
  revokedByUserId: text("revoked_by_user_id").references(() => users.id, { onDelete: "set null" }),
  revocationReason: text("revocation_reason"),
}, (table) => [
  uniqueIndex("credentials_assignment_user_unique").on(table.assignmentId, table.userId),
  uniqueIndex("credentials_number_unique").on(table.certificateNumber),
  uniqueIndex("credentials_verification_unique").on(table.verificationCode),
]);

export const legacyImports = sqliteTable("legacy_imports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  clientMutationId: text("client_mutation_id").notNull(),
  payloadHash: text("payload_hash").notNull(),
  importedAt: text("imported_at").notNull(),
  requiresProfessionalRevalidation: integer("requires_professional_revalidation", { mode: "boolean" }).notNull().default(true),
}, (table) => [
  uniqueIndex("legacy_imports_user_curriculum_unique").on(table.userId, table.curriculumVersionId),
  uniqueIndex("legacy_imports_mutation_unique").on(table.clientMutationId),
]);

export const earnedRewards = sqliteTable("earned_rewards", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  rewardId: text("reward_id").notNull(),
  rewardType: text("reward_type", { enum: ["xp", "badge"] }).notNull(),
  value: integer("value").notNull().default(0),
  earnedAt: text("earned_at").notNull(),
  source: text("source", { enum: ["native", "legacy_device"] }).notNull().default("native"),
}, (table) => [
  primaryKey({ columns: [table.userId, table.curriculumVersionId, table.rewardId] }),
]);

export const gamificationSummaries = sqliteTable("gamification_summaries", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  curriculumVersionId: text("curriculum_version_id").notNull().references(() => curriculumVersions.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastStudyOn: text("last_study_on"),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.curriculumVersionId] }),
]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["assignment", "due_soon", "overdue", "inactive", "manager_nudge", "credential"] }).notNull(),
  status: text("status", { enum: ["unread", "read", "dismissed"] }).notNull().default("unread"),
  dedupeKey: text("dedupe_key").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  actionHref: text("action_href"),
  createdAt: createdAt(),
  readAt: text("read_at"),
}, (table) => [
  uniqueIndex("notifications_dedupe_unique").on(table.dedupeKey),
  index("notifications_user_status_idx").on(table.userId, table.status, table.createdAt),
]);

export const organizationBranding = sqliteTable("organization_branding", {
  organizationId: text("organization_id").primaryKey().references(() => organizations.id, { onDelete: "cascade" }),
  organizationName: text("organization_name").notNull(),
  productName: text("product_name").notNull(),
  logoUrl: text("logo_url"),
  logoAlt: text("logo_alt"),
  primaryColor: text("primary_color").notNull(),
  accentColor: text("accent_color").notNull(),
  supportUrl: text("support_url"),
  privacyUrl: text("privacy_url"),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: createdAt(),
}, (table) => [
  index("audit_events_org_created_idx").on(table.organizationId, table.createdAt),
  index("audit_events_target_idx").on(table.targetType, table.targetId),
]);

export const privacyRequests = sqliteTable("privacy_requests", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subjectUserId: text("subject_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestedByUserId: text("requested_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: text("type", { enum: ["export", "delete"] }).notNull(),
  status: text("status", { enum: ["requested", "processing", "completed", "rejected"] }).notNull().default("requested"),
  requestedAt: text("requested_at").notNull(),
  completedAt: text("completed_at"),
  resolutionNote: text("resolution_note"),
}, (table) => [
  index("privacy_requests_org_status_idx").on(table.organizationId, table.status, table.requestedAt),
]);

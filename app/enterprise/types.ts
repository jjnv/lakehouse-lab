export const ENTERPRISE_ROLES = ["learner", "manager", "admin"] as const;
export type EnterpriseRole = (typeof ENTERPRISE_ROLES)[number];

export const LEARNER_ASSIGNMENT_STATUSES = ["not_started", "in_progress", "completed", "waived", "cancelled"] as const;
export type LearnerAssignmentStatus = (typeof LEARNER_ASSIGNMENT_STATUSES)[number];

export type EnterpriseIdentity = {
  email: string;
  displayName: string;
  fullName: string | null;
};

export type EnterpriseOrganization = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
};

export type EnterpriseUser = {
  id: string;
  email: string;
  displayName: string;
  locale: "es" | "en";
  timezone: string;
  lastActivityAt: string | null;
  status: "active" | "disabled";
};

export type CompletionPolicy = {
  requiredModuleIds: readonly string[];
  minimumModuleQuizPercent: number;
  minimumFinalAssessmentPercent: number;
  requireLabs: boolean;
  requireCapstone: boolean;
  issueInternalCredential: boolean;
};

export type CurriculumManifest = {
  id: string;
  learningPathSlug: string;
  contentVersion: string;
  title: string;
  moduleIds: readonly string[];
  completionPolicy: CompletionPolicy;
};

export type AssignmentSnapshot = {
  id: string;
  title: string;
  curriculumVersionId: string;
  contentVersion: string;
  assignedAt: string;
  dueAt: string;
  durationDays: number;
  status: LearnerAssignmentStatus;
  completionPolicy: CompletionPolicy;
};

export type LearnerContext = {
  organization: EnterpriseOrganization;
  user: EnterpriseUser;
  roles: readonly EnterpriseRole[];
  professionalAssignment: AssignmentSnapshot;
};

export type ProgressSnapshotInput = {
  contentVersion: string;
  completedModuleIds: readonly string[];
  totalModules: number;
  completedLessonIds: readonly string[];
  totalLessons: number;
  labsPassed: readonly string[];
  quizBestScores: Readonly<Record<string, number>>;
  progressPercent: number;
  xp: number;
  streak: number;
  capturedAt: string;
  source: "native" | "legacy_device";
};

export type ProgressSnapshotRecord = {
  assignmentId: string;
  userId: string;
  contentVersion: string;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  labsPassed: number;
  quizAveragePercent: number;
  progressPercent: number;
  xp: number;
  streak: number;
  capturedAt: string;
  payloadHash: string;
};

export type IdempotentWriteResult<T> = {
  value: T;
  replayed: boolean;
};

export type BrandConfig = {
  organizationName: string;
  productName: string;
  logoUrl: string | null;
  logoAlt: string | null;
  primaryColor: string;
  accentColor: string;
  supportUrl: string | null;
  privacyUrl: string | null;
};

export type BrandValidationIssue = {
  field: keyof BrandConfig | "root";
  message: string;
};

export type BrandValidationResult =
  | { success: true; data: BrandConfig; issues: [] }
  | { success: false; data: null; issues: BrandValidationIssue[] };

export type EnterpriseMessageKind = "assignment" | "due_soon" | "overdue" | "inactive" | "manager_nudge" | "credential";

export type EnterpriseMessage = {
  kind: EnterpriseMessageKind;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

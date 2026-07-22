import type { AssessmentKind, AssessmentTimingMode, PublicAssessmentPayload } from "./assessment";

export type TenantBrandConfig = {
  organizationName: string;
  productName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  timezone: string;
  supportEmail: string | null;
};
export type LearnerProfile = {
  displayName: string;
  email: string;
  locale: "es" | "en";
  timezone: string;
  lastActivityAt: string | null;
};

export type ProgramEnrollment = {
  programId: "professional-v1";
  contentVersion: string;
  startedAt: string;
  dueAt: string;
  durationDays: 140;
  weeklyTargetMinutes: 300;
  status: "not_started" | "in_progress" | "completed";
  overdue: boolean;
  completionPolicy: {
    requiredModules: 32;
    lessonsPerModule: 5;
    moduleQuizMinimumPercent: 75;
    simulatorMinimumPercent: 80;
    requireAllLabs: true;
    requireAssociateSimulator: true;
    requireProfessionalSimulator: true;
    requireCapstone: true;
  };
};

export type ProgressRevision = {
  value: number;
  updatedAt: string;
};

export type ModuleSummary = {
  id: string;
  slug: string;
  number: string;
  title: string;
  short: string;
  description: string;
  phase: string;
  phaseId: string;
  level: string;
  minutes: number;
  prerequisiteIds: string[];
};

export type ModuleProgressPublic = {
  moduleId: string;
  completedLessonIds: string[];
  labAttested: boolean;
  quizBestPercent: number | null;
  completed: boolean;
  unlocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

export type ReviewSchedulePublic = {
  moduleId: string;
  lessonId: string;
  dueOn: string;
  intervalDays: number;
  attempts: number;
};

export type PersonalMotivation = {
  xp: number;
  streakDays: number;
  badges: string[];
};

export type Credential = {
  id: string;
  certificateNumber: string;
  title: string;
  contentVersion: string;
  issuedAt: string;
  status: "issued" | "revoked";
  verificationHref: string;
  pdfHref: string;
};

export type LegacyImportPreview = {
  eligible: boolean;
  alreadyImported: boolean;
  serverHasActivity: boolean;
  requiresProfessionalRevalidation: boolean;
};

export type LearnerDashboard = {
  brand: TenantBrandConfig;
  learner: LearnerProfile;
  enrollment: ProgramEnrollment;
  revision: ProgressRevision;
  modules: ModuleSummary[];
  progress: ModuleProgressPublic[];
  reviews: ReviewSchedulePublic[];
  motivation: PersonalMotivation;
  bestSimulatorScores: { associate: number | null; professional: number | null };
  weeklyMinutes: number;
  nextActivity: {
    kind: "lesson" | "review" | "lab" | "quiz" | "associate_simulator" | "professional_simulator" | "certificate";
    moduleId: string | null;
    lessonId: string | null;
    label: string;
    href: string;
  };
  credential: Credential | null;
  legacyImport: LegacyImportPreview;
};

export type AssessmentAttemptPublic = {
  id: string;
  kind: AssessmentKind;
  timingMode: AssessmentTimingMode;
  startedAt: string;
  expiresAt: string | null;
  status: "in-progress" | "submitted" | "graded" | "expired";
  assessment: PublicAssessmentPayload;
  selections: Record<string, string>;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  retryable: boolean;
  currentRevision?: number;
};

export type MutationEnvelope<T> = {
  data: T;
  revision: ProgressRevision;
  replayed: boolean;
};

export type ClientMutation = {
  clientMutationId: string;
  expectedRevision: number;
};

export type AssessmentStartRequest = ClientMutation & {
  kind: AssessmentKind;
  moduleId?: string;
  timingMode: AssessmentTimingMode;
};

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
  weeklyTargetMinutes: number;
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
  resourceCount: number;
  resourceConcepts: string[];
};

export type LearnerPreferences = {
  goal: "associate" | "professional" | "topics";
  weeklyTargetMinutes: number;
  cloud: "multicloud" | "azure" | "aws" | "gcp" | "free-edition";
  onboardingCompleted: boolean;
  updatedAt: string | null;
};

export type CurriculumSearchResult = {
  id: string;
  kind: "concept" | "lesson" | "module" | "resource";
  label: string;
  description: string;
  location: string;
  href: string;
};

export type CommunityResourceFormat = "ipynb" | "databricks-source" | "dbc" | "bundle" | "repository" | "project";
export type CommunityResourceCoverage = "direct" | "partial" | "equivalent";
export type CommunityResourceDifficulty = "beginner" | "intermediate" | "advanced";
export type CommunityResourceLicenseStatus = "verified" | "unknown" | "restricted";
export type CommunityResourcePreviewUnavailableReason =
  | "license_unverified"
  | "restricted_license"
  | "no_compatible_file";

export type CommunityResourcePublic = {
  id: string;
  title: string;
  summary: string;
  href: string;
  repositoryName: string;
  repositoryUrl: string;
  author: string;
  provenance: "official" | "community";
  license: string;
  licenseStatus: CommunityResourceLicenseStatus;
  licenseEvidenceHref: string | null;
  format: CommunityResourceFormat;
  languages: string[];
  clouds: string[];
  difficulty: CommunityResourceDifficulty;
  runtimeNotes: string;
  freeEdition: "supported" | "partial" | "unsupported" | "unknown";
  previewAvailable: boolean;
  previewUnavailableReason: CommunityResourcePreviewUnavailableReason | null;
  viewMode: "internal" | "github";
  sourcePath: string;
  upstreamRef: string | null;
  reviewedAt: string;
  usageInstructions: string[];
};

export type CommunityResourceRecommendationPublic = CommunityResourcePublic & {
  rank: 1 | 2 | 3;
  preferred: boolean;
  coverage: CommunityResourceCoverage;
  concepts: string[];
  rationale: string;
};

export type CommunityResourceCatalogEntry = CommunityResourcePublic & {
  concepts: string[];
  preferred: boolean;
  relatedModules: Array<{
    id: string;
    number: string;
    slug: string;
    title: string;
    phase: string;
    phaseId: string;
    rank: 1 | 2 | 3;
    coverage: CommunityResourceCoverage;
  }>;
};

export type NotebookPreviewOutput =
  | { kind: "text"; text: string }
  | { kind: "image"; mime: "image/png" | "image/jpeg"; dataUrl: string };

export type NotebookGuideReference = {
  id: string;
  title: string;
  publisher: string;
  href: string;
  reviewedAt: string;
};

export type NotebookGuidePoint = {
  title: string;
  what: string;
  why: string;
  bestPractices: string[];
  warnings: string[];
  status: "current" | "demo-only" | "legacy" | "risky";
  referenceIds: string[];
};

export type NotebookCellGuide = {
  points: NotebookGuidePoint[];
  prerequisites: string[];
  expectedEvidence: string[];
};

export type NotebookPreviewCell =
  | {
      id: string;
      sourceIndex: number;
      sourceDigest: string;
      kind: "markdown";
      text: string;
      guide: NotebookCellGuide | null;
    }
  | {
      id: string;
      sourceIndex: number;
      sourceDigest: string;
      kind: "code";
      language: string;
      text: string;
      outputs: NotebookPreviewOutput[];
      guide: NotebookCellGuide | null;
    };

export type NotebookGuideCoverage = {
  status: "complete" | "partial";
  annotatedCells: number;
  totalCells: number;
  reviewedAt: string | null;
  references: NotebookGuideReference[];
};

export type NotebookPreviewPayload = {
  resourceId: string;
  title: string;
  sourceHref: string;
  upstreamRef: string;
  path: string;
  reviewedAt: string;
  cells: NotebookPreviewCell[];
  truncated: boolean;
  guideCoverage: NotebookGuideCoverage;
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

export type PublicCredentialVerification = {
  valid: boolean;
  status: "issued" | "revoked" | "unknown";
  credentialId: string;
  certificateNumber: string | null;
  title: string | null;
  contentVersion: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  learnerDisplayName: string | null;
  issuerName: string;
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
    reason: string;
    href: string;
  };
  credential: Credential | null;
  preferences: LearnerPreferences;
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

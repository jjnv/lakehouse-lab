import { modules, type CurriculumModule } from "./course-data";
import { emptyGamification, sanitizeGamification, type GamificationState } from "./gamification";

export type ModuleView = "lessons" | "lab" | "quiz";
export type ExamMode = "associate" | "professional";
export type QuizAnswers = Record<string, Record<number, number>>;
export type ReviewRating = "again" | "good";
export type LessonReview = {
  dueOn: string;
  intervalDays: number;
  attempts: number;
  lastRating: ReviewRating;
  lastReviewedOn: string;
};

export type ProgressState = {
  contentVersion: string;
  completedLessons: Record<string, string[]>;
  labsPassed: string[];
  labConfirmed: string[];
  quizScores: Record<string, number>;
  quizAnswers: QuizAnswers;
  completedModules: string[];
  labCode: Record<string, string>;
  examScores: Partial<Record<ExamMode, number>>;
  examCompleted: Partial<Record<ExamMode, boolean>>;
  lessonReviews: Record<string, LessonReview>;
  lastModuleId: string;
  lastView: ModuleView;
  gamification: GamificationState;
};

export const STORAGE_KEY = "lakehouse-lab-progress-v2";
export const CONTENT_VERSION = "lakehouse-lab-v1.7.0";

export const emptyProgress: ProgressState = {
  contentVersion: CONTENT_VERSION,
  completedLessons: {},
  labsPassed: [],
  labConfirmed: [],
  quizScores: {},
  quizAnswers: {},
  completedModules: [],
  labCode: {},
  examScores: {},
  examCompleted: {},
  lessonReviews: {},
  lastModuleId: "m01",
  lastView: "lessons",
  gamification: emptyGamification,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validModuleIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const allowed = new Set(modules.map((module) => module.id));
  return [...new Set(values.filter((value): value is string => typeof value === "string" && allowed.has(value)))];
}

export function lessonReviewKey(moduleId: string, lessonId: string) {
  return `${moduleId}:${lessonId}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function scheduleLessonReview(progress: ProgressState, moduleId: string, lessonId: string, rating: ReviewRating, today: string): ProgressState {
  const key = lessonReviewKey(moduleId, lessonId);
  const previous = progress.lessonReviews[key];
  const intervals = [1, 3, 7, 14, 30];
  const intervalDays = rating === "again"
    ? 1
    : previous?.lastReviewedOn === today
      ? Math.max(1, previous.intervalDays)
      : intervals.find((interval) => interval > (previous?.intervalDays ?? 0)) ?? 30;
  return {
    ...progress,
    lessonReviews: {
      ...progress.lessonReviews,
      [key]: {
        dueOn: addDays(today, intervalDays),
        intervalDays,
        attempts: (previous?.attempts ?? 0) + 1,
        lastRating: rating,
        lastReviewedOn: today,
      },
    },
  };
}

export function dueLessonReviews(progress: ProgressState, today: string) {
  const scheduled = Object.entries(progress.lessonReviews)
    .filter(([, review]) => review.dueOn <= today)
    .map(([key, review]) => {
      const [moduleId, lessonId] = key.split(":");
      const curriculumModule = modules.find((item) => item.id === moduleId);
      const lesson = curriculumModule?.lessons.find((item) => item.id === lessonId);
      const completed = progress.completedLessons[moduleId]?.includes(lessonId);
      return curriculumModule && lesson && completed ? { module: curriculumModule, lesson, review } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.review.dueOn.localeCompare(b.review.dueOn));

  const scheduledKeys = new Set(Object.keys(progress.lessonReviews));
  const legacy = modules.flatMap((curriculumModule) => (progress.completedLessons[curriculumModule.id] ?? [])
    .filter((lessonId) => !scheduledKeys.has(lessonReviewKey(curriculumModule.id, lessonId)))
    .map((lessonId) => {
      const lesson = curriculumModule.lessons.find((item) => item.id === lessonId);
      return lesson ? {
        module: curriculumModule,
        lesson,
        review: { dueOn: today, intervalDays: 0, attempts: 0, lastRating: "good" as const, lastReviewedOn: today },
      } : null;
    }))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return [...scheduled, ...legacy.slice(0, Math.max(0, 3 - scheduled.length))];
}

export function deriveProgress(progress: ProgressState): ProgressState {
  const completed = new Set<string>();
  for (const curriculumModule of modules) {
    const lessonsDone = new Set(progress.completedLessons[curriculumModule.id] ?? []).size >= curriculumModule.lessons.length;
    const labDone = progress.labsPassed.includes(curriculumModule.id) && progress.labConfirmed.includes(curriculumModule.id);
    const quizDone = (progress.quizScores[curriculumModule.id] ?? 0) >= 3;
    const examDone = curriculumModule.id === "m12"
      ? progress.examCompleted.associate === true
      : curriculumModule.id === "m32"
        ? progress.examCompleted.professional === true
        : true;
    const prerequisitesDone = curriculumModule.prerequisites.every((id) => completed.has(id));
    if (lessonsDone && labDone && quizDone && examDone && prerequisitesDone) completed.add(curriculumModule.id);
  }
  return { ...progress, completedModules: [...completed] };
}

export function sanitizeProgress(value: unknown): ProgressState {
  if (!isRecord(value)) return emptyProgress;
  const completedLessons: Record<string, string[]> = {};
  if (isRecord(value.completedLessons)) {
    for (const curriculumModule of modules) {
      const raw = value.completedLessons[curriculumModule.id];
      if (!Array.isArray(raw)) continue;
      const allowed = new Set(curriculumModule.lessons.map((lesson) => lesson.id));
      completedLessons[curriculumModule.id] = [...new Set(raw.filter((item): item is string => typeof item === "string" && allowed.has(item)))];
    }
  }

  const quizScores: Record<string, number> = {};
  if (isRecord(value.quizScores)) {
    for (const curriculumModule of modules) {
      const score = value.quizScores[curriculumModule.id];
      if (typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= curriculumModule.quiz.length) quizScores[curriculumModule.id] = score;
    }
  }

  const quizAnswers: QuizAnswers = {};
  if (isRecord(value.quizAnswers)) {
    for (const curriculumModule of modules) {
      const raw = value.quizAnswers[curriculumModule.id];
      if (!isRecord(raw)) continue;
      const answers: Record<number, number> = {};
      for (let question = 0; question < curriculumModule.quiz.length; question += 1) {
        const answer = raw[String(question)];
        if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < 4) answers[question] = answer;
      }
      quizAnswers[curriculumModule.id] = answers;
    }
  }

  const labCode: Record<string, string> = {};
  if (isRecord(value.labCode)) {
    for (const curriculumModule of modules) {
      const code = value.labCode[curriculumModule.id];
      if (typeof code === "string" && code.length <= 100_000) labCode[curriculumModule.id] = code;
    }
  }

  const examScores: ProgressState["examScores"] = {};
  if (isRecord(value.examScores)) {
    for (const mode of ["associate", "professional"] as const) {
      const score = value.examScores[mode];
      if (typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100) examScores[mode] = score;
    }
  }

  const examCompleted: ProgressState["examCompleted"] = {};
  if (isRecord(value.examCompleted)) {
    for (const mode of ["associate", "professional"] as const) {
      if (value.examCompleted[mode] === true) examCompleted[mode] = true;
    }
  }

  const lessonReviews: Record<string, LessonReview> = {};
  if (isRecord(value.lessonReviews)) {
    const validKeys = new Set(modules.flatMap((curriculumModule) => curriculumModule.lessons.map((lesson) => lessonReviewKey(curriculumModule.id, lesson.id))));
    for (const [key, raw] of Object.entries(value.lessonReviews)) {
      if (!validKeys.has(key) || !isRecord(raw)) continue;
      const dueOn = raw.dueOn;
      const lastReviewedOn = raw.lastReviewedOn;
      const intervalDays = raw.intervalDays;
      const attempts = raw.attempts;
      const lastRating = raw.lastRating;
      if (typeof dueOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) continue;
      if (typeof lastReviewedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(lastReviewedOn)) continue;
      if (typeof intervalDays !== "number" || !Number.isInteger(intervalDays) || intervalDays < 0 || intervalDays > 365) continue;
      if (typeof attempts !== "number" || !Number.isInteger(attempts) || attempts < 0 || attempts > 10_000) continue;
      if (lastRating !== "again" && lastRating !== "good") continue;
      lessonReviews[key] = { dueOn, intervalDays, attempts, lastRating, lastReviewedOn };
    }
  }

  const labsPassed = validModuleIds(value.labsPassed);
  const confirmed = validModuleIds(value.labConfirmed);
  const labConfirmed = confirmed.length ? confirmed : labsPassed;
  const lastModuleId = typeof value.lastModuleId === "string" && modules.some((module) => module.id === value.lastModuleId) ? value.lastModuleId : "m01";
  const lastView = value.lastView === "lab" || value.lastView === "quiz" ? value.lastView : "lessons";

  return deriveProgress({
    contentVersion: CONTENT_VERSION,
    completedLessons,
    labsPassed,
    labConfirmed,
    quizScores,
    quizAnswers,
    completedModules: [],
    labCode,
    examScores,
    examCompleted,
    lessonReviews,
    lastModuleId,
    lastView,
    gamification: sanitizeGamification(value.gamification),
  });
}

export function isUnlocked(module: CurriculumModule, completed: Set<string>): boolean {
  return module.prerequisites.every((id) => completed.has(id));
}

export function hasStarted(module: CurriculumModule, progress: ProgressState): boolean {
  return Boolean(
    progress.completedLessons[module.id]?.length ||
    progress.labCode[module.id] ||
    progress.labConfirmed.includes(module.id) ||
    progress.quizAnswers[module.id] && Object.keys(progress.quizAnswers[module.id]).length,
  );
}

export function earnedMinutes(module: CurriculumModule, progress: ProgressState): number {
  const lessonShare = module.kind === "capstone" ? 0.3 : module.kind === "branch-project" ? 0.35 : 0.5;
  const labShare = module.kind === "capstone" ? 0.4 : module.kind === "branch-project" ? 0.5 : 0.35;
  const quizShare = 0.15;
  const examShare = module.kind === "capstone" ? 0.15 : 0;
  const lessonRatio = Math.min(1, new Set(progress.completedLessons[module.id] ?? []).size / module.lessons.length);
  const labRatio = progress.labsPassed.includes(module.id) && progress.labConfirmed.includes(module.id) ? 1 : 0;
  const quizRatio = (progress.quizScores[module.id] ?? 0) >= 3 ? 1 : 0;
  const examRatio = module.id === "m12"
    ? progress.examCompleted.associate === true ? 1 : 0
    : module.id === "m32"
      ? progress.examCompleted.professional === true ? 1 : 0
      : 0;
  return module.minutes * (lessonRatio * lessonShare + labRatio * labShare + quizRatio * quizShare + examRatio * examShare);
}

export function moduleProgressPercent(module: CurriculumModule, progress: ProgressState): number {
  return Math.round((earnedMinutes(module, progress) / module.minutes) * 100);
}

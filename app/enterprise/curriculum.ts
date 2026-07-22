import { buildExamQuestions, modules, trackMeta, type CurriculumModule, type QuizQuestion } from "../course-data";
import { CONTENT_VERSION } from "../progress";
import { prepareAssessment, type PrivateAssessmentDefinition, type PreparedAssessment } from "./assessment-private";
import type { AssessmentKind, AssessmentTimingMode } from "./assessment";
import type { ModuleSummary } from "./contracts";

export const LEARNING_PHASES = [
  { id: "fundamentos", name: "Fundamentos lakehouse", track: "core" },
  { id: "streaming", name: "Streaming y CDC", track: "streaming" },
  { id: "pipelines", name: "Pipelines y orquestación", track: "pipelines" },
  { id: "rendimiento", name: "Rendimiento y FinOps", track: "performance" },
  { id: "entrega", name: "Entrega y gobierno", track: "delivery" },
  { id: "capstone", name: "Convergencia Professional", track: "final" },
] as const;

const phaseByTrack = new Map(LEARNING_PHASES.map((phase) => [phase.track, phase]));

export type PublicLesson = Omit<CurriculumModule["lessons"][number], "checkpoint"> & {
  checkpoint: { question: string; answer: string };
};

export type PublicLab = Omit<CurriculumModule["lab"], "checks"> & {
  checks: Array<{ id: string; label: string }>;
};

export type PublicModule = Omit<CurriculumModule, "quiz" | "lab" | "lessons"> & {
  lessons: PublicLesson[];
  lab: PublicLab;
  quiz: Array<{ id: string; prompt: string; options: string[]; domain: string }>;
};

export function moduleSummaries(): ModuleSummary[] {
  return modules.map((module) => {
    const phase = phaseByTrack.get(module.track) ?? LEARNING_PHASES[0];
    return {
      id: module.id,
      slug: module.slug,
      number: module.number,
      title: module.title,
      short: module.short,
      description: module.description,
      phase: phase.name,
      phaseId: phase.id,
      level: module.level,
      minutes: module.minutes,
      prerequisiteIds: [...module.prerequisites],
    };
  });
}
export function findModuleBySlug(slug: string): CurriculumModule | null {
  return modules.find((module) => module.slug === slug) ?? null;
}

export function findModuleById(moduleId: string): CurriculumModule | null {
  return modules.find((module) => module.id === moduleId) ?? null;
}

export function publicModule(module: CurriculumModule): PublicModule {
  return {
    id: module.id,
    number: module.number,
    slug: module.slug,
    title: module.title,
    short: module.short,
    kind: module.kind,
    track: module.track,
    level: module.level,
    minutes: module.minutes,
    description: module.description,
    outcomes: [...module.outcomes],
    examDomains: [...module.examDomains],
    prerequisites: [...module.prerequisites],
    sources: module.sources.map((source) => ({ ...source })),
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      decisions: [...lesson.decisions],
      explanation: [...lesson.explanation] as [string, string],
      keyPoints: [...lesson.keyPoints] as [string, string, string],
      pitfalls: [...lesson.pitfalls] as [string, string],
      refIds: [...lesson.refIds],
      checkpoint: { question: lesson.checkpoint.question, answer: lesson.checkpoint.answer },
    })),
    lab: {
      ...module.lab,
      prerequisites: [...module.lab.prerequisites],
      permissions: [...module.lab.permissions],
      cleanup: [...module.lab.cleanup],
      troubleshooting: module.lab.troubleshooting.map((item) => ({ ...item })),
      refIds: [...module.lab.refIds],
      steps: [...module.lab.steps],
      expectedEvidence: [...module.lab.expectedEvidence],
      cloudNotes: module.lab.cloudNotes.map((item) => ({ ...item })),
      checks: module.lab.checks.map((check, index) => ({ id: `${module.lab.id}-check-${index + 1}`, label: check.label })),
    },
    quiz: module.quiz.map((question, index) => ({
      id: `${module.id}-quiz-${index + 1}`,
      prompt: question.question,
      options: [...question.options],
      domain: question.domain,
    })),
  };
}

function assessmentDefinition(kind: AssessmentKind, moduleId: string | undefined, attemptOrdinal: number): PrivateAssessmentDefinition {
  if (kind === "module-quiz") {
    const module = moduleId ? findModuleById(moduleId) : null;
    if (!module) throw new RangeError("El módulo indicado no existe.");
    return {
      sourceId: `module:${module.id}:quiz`,
      contentVersion: CONTENT_VERSION,
      kind,
      title: `Evaluación · ${module.title}`,
      instructions: "Responde las cuatro preguntas. Necesitas al menos tres respuestas correctas.",
      baseDurationMinutes: 15,
      questions: module.quiz.map((question, index) => privateQuestion(question, `${module.id}:q${index + 1}`)),
    };
  }

  const mode = kind === "associate-simulator" ? "associate" : "professional";
  const questions = buildExamQuestions(mode, Math.max(1, attemptOrdinal));
  return {
    sourceId: `simulator:${mode}:${Math.max(1, attemptOrdinal)}`,
    contentVersion: CONTENT_VERSION,
    kind,
    title: `Simulacro ${mode === "associate" ? "Associate" : "Professional"}`,
    instructions: "Completa el intento y alcanza al menos el 80 %. Puedes repetirlo sin límite.",
    baseDurationMinutes: mode === "associate" ? 90 : 120,
    questions: questions.map((question, index) => privateQuestion(question, `${mode}:q${index + 1}`)),
  };
}

function privateQuestion(question: QuizQuestion, sourceId: string) {
  return {
    sourceId,
    question: question.question,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    domain: question.domain,
    moduleId: question.moduleId,
    origin: question.origin,
    originLabel: question.originLabel,
    sourceLabel: question.sourceLabel,
  };
}

export function prepareEnterpriseAssessment(input: {
  kind: AssessmentKind;
  moduleId?: string;
  timingMode: AssessmentTimingMode;
  attemptOrdinal?: number;
}): PreparedAssessment {
  return prepareAssessment(
    assessmentDefinition(input.kind, input.moduleId, input.attemptOrdinal ?? 1),
    input.timingMode,
  );
}

export function trackLabel(module: CurriculumModule): string {
  return trackMeta[module.track].name;
}

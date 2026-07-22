import { buildExamQuestions, modules, trackMeta, type CurriculumModule, type QuizQuestion } from "../course-data";
import { CONTENT_VERSION } from "../progress";
import { prepareAssessment, type PrivateAssessmentDefinition, type PreparedAssessment } from "./assessment-private";
import type { AssessmentKind, AssessmentTimingMode } from "./assessment";
import type { CurriculumSearchResult, ModuleSummary } from "./contracts";
import { conceptAnchor } from "./search-anchor";

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

type IndexedCurriculumResult = CurriculumSearchResult & {
  searchableLabel: string;
  searchableDescription: string;
  searchableLocation: string;
  order: number;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const curriculumSearchIndex: IndexedCurriculumResult[] = modules.flatMap((module, moduleIndex) => {
  const phase = phaseByTrack.get(module.track) ?? LEARNING_PHASES[0];
  const moduleLocation = `Módulo ${module.number} · ${phase.name}`;
  const moduleResult: IndexedCurriculumResult = {
    id: `module:${module.id}`,
    kind: "module",
    label: module.title,
    description: module.description,
    location: moduleLocation,
    href: `/curso/${module.slug}`,
    searchableLabel: normalizeSearchText(`${module.title} ${module.short}`),
    searchableDescription: normalizeSearchText(`${module.description} ${module.outcomes.join(" ")} ${module.examDomains.join(" ")}`),
    searchableLocation: normalizeSearchText(moduleLocation),
    order: moduleIndex * 100,
  };

  const lessonResults = module.lessons.flatMap((lesson, lessonIndex): IndexedCurriculumResult[] => {
    const lessonLocation = `${moduleLocation} · Lección ${lessonIndex + 1}`;
    const lessonResult: IndexedCurriculumResult = {
      id: `lesson:${lesson.id}`,
      kind: "lesson",
      label: lesson.title,
      description: lesson.summary,
      location: lessonLocation,
      href: `/curso/${module.slug}?lesson=${encodeURIComponent(lesson.id)}#lesson-${lesson.id}`,
      searchableLabel: normalizeSearchText(`${lesson.title} ${lesson.kicker}`),
      searchableDescription: normalizeSearchText(`${lesson.summary} ${lesson.detail} ${lesson.keyPoints.join(" ")} ${lesson.decisions.join(" ")}`),
      searchableLocation: normalizeSearchText(`${lessonLocation} ${module.title}`),
      order: moduleIndex * 100 + lessonIndex * 10 + 1,
    };
    const conceptResults = lesson.deepDive.concepts.map((concept, conceptIndex): IndexedCurriculumResult => {
      const anchor = conceptAnchor(lesson.id, concept.term);
      return {
        id: `concept:${lesson.id}:${conceptIndex}`,
        kind: "concept",
        label: concept.term,
        description: concept.definition,
        location: `${lessonLocation} · ${lesson.title}`,
        href: `/curso/${module.slug}?lesson=${encodeURIComponent(lesson.id)}&concept=${encodeURIComponent(anchor)}#${anchor}`,
        searchableLabel: normalizeSearchText(concept.term),
        searchableDescription: normalizeSearchText(`${concept.definition} ${concept.whyItMatters}`),
        searchableLocation: normalizeSearchText(`${lessonLocation} ${lesson.title} ${module.title}`),
        order: moduleIndex * 100 + lessonIndex * 10 + conceptIndex + 2,
      };
    });
    return [lessonResult, ...conceptResults];
  });

  return [moduleResult, ...lessonResults];
});

function searchScore(entry: IndexedCurriculumResult, query: string, tokens: string[]) {
  const haystack = `${entry.searchableLabel} ${entry.searchableDescription} ${entry.searchableLocation}`;
  if (!tokens.every((token) => haystack.includes(token))) return -1;
  let score = entry.kind === "concept" ? 12 : entry.kind === "lesson" ? 6 : 3;
  if (entry.searchableLabel === query) score += 240;
  else if (entry.searchableLabel.startsWith(query)) score += 150;
  else if (entry.searchableLabel.includes(query)) score += 105;
  if (entry.searchableDescription.includes(query)) score += 45;
  if (entry.searchableLocation.includes(query)) score += 20;
  for (const token of tokens) {
    if (entry.searchableLabel.includes(token)) score += 22;
    if (entry.searchableDescription.includes(token)) score += 8;
    if (entry.searchableLocation.includes(token)) score += 3;
  }
  return score;
}

export function searchCurriculum(input: string, limit = 8): CurriculumSearchResult[] {
  const query = normalizeSearchText(input).slice(0, 100);
  if (query.length < 2) return [];
  const tokens = query.split(" ").filter((token) => token.length > 1).slice(0, 8);
  if (!tokens.length) return [];
  return curriculumSearchIndex
    .map((entry) => ({ entry, score: searchScore(entry, query, tokens) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score || left.entry.order - right.entry.order)
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map(({ entry }) => ({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      description: entry.description,
      location: entry.location,
      href: entry.href,
    }));
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
    const courseModule = moduleId ? findModuleById(moduleId) : null;
    if (!courseModule) throw new RangeError("El módulo indicado no existe.");
    return {
      sourceId: `module:${courseModule.id}:quiz`,
      contentVersion: CONTENT_VERSION,
      kind,
      title: `Evaluación · ${courseModule.title}`,
      instructions: "Responde las cuatro preguntas. Necesitas al menos tres respuestas correctas.",
      baseDurationMinutes: 15,
      questions: courseModule.quiz.map((question, index) => privateQuestion(question, `${courseModule.id}:q${index + 1}`)),
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

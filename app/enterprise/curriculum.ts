import { buildExamQuestions, modules, trackMeta, type CurriculumModule, type QuizQuestion } from "../course-data";
import { CONTENT_VERSION } from "../progress";
import {
  moduleResourceRecommendations,
  recommendationsForModule,
  usageInstructionsFor,
  type ExpandedCommunityRecommendation,
} from "../curriculum/community-resources";
import { glossaryCategoryLabels, glossaryEntries } from "../curriculum/glossary";
import type { Locale } from "../i18n/config";
import {
  localizeModule,
  localizeModuleSummary,
  localizeReviewDate,
  localizeResourceCatalog,
  localizeSearchLocation,
  localizeText,
  moduleCopyEn,
} from "../i18n/curriculum";
import { prepareAssessment, type PrivateAssessmentDefinition, type PreparedAssessment } from "./assessment-private";
import type { AssessmentKind, AssessmentTimingMode } from "./assessment";
import type {
  CommunityResourceCatalogEntry,
  CommunityResourcePublic,
  CommunityResourceRecommendationPublic,
  CurriculumSearchResult,
  ModuleArtwork,
  ModuleArtworkMotif,
  ModuleSummary,
} from "./contracts";
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

const artworkByTrack: Record<CurriculumModule["track"], Omit<ModuleArtwork, "alt" | "motif" | "label"> & { concept: string }> = {
  core: {
    src: "/module-artwork/fundamentos-lakehouse.svg",
    tone: "coral",
    concept: "arquitectura lakehouse, almacenamiento y compute",
  },
  streaming: {
    src: "/module-artwork/streaming-cdc.svg",
    tone: "blue",
    concept: "flujos streaming, CDC y estado",
  },
  pipelines: {
    src: "/module-artwork/pipelines-orquestacion.svg",
    tone: "purple",
    concept: "pipelines, orquestacion y calidad",
  },
  performance: {
    src: "/module-artwork/rendimiento-finops.svg",
    tone: "gold",
    concept: "rendimiento, observabilidad y costes",
  },
  delivery: {
    src: "/module-artwork/entrega-gobierno.svg",
    tone: "green",
    concept: "gobierno, seguridad y entrega",
  },
  final: {
    src: "/module-artwork/capstone-professional.svg",
    tone: "ink",
    concept: "capstone Professional y convergencia",
  },
};

const artworkByModule: Record<string, { motif: ModuleArtworkMotif; label: string; concept: string }> = {
  m01: { motif: "platform", label: "Arquitectura", concept: "plataforma lakehouse, almacenamiento y compute" },
  m02: { motif: "compute", label: "Compute", concept: "compute clasico, serverless y SQL warehouses" },
  m03: { motif: "notebooks", label: "Notebooks", concept: "notebooks, SQL, Python y PySpark" },
  m04: { motif: "dataframes", label: "DataFrames", concept: "DataFrames, transformaciones y datos complejos" },
  m05: { motif: "spark", label: "Spark", concept: "Catalyst, particiones, joins y shuffles" },
  m06: { motif: "delta", label: "Delta Lake", concept: "Delta Lake, ACID, historial y DML" },
  m07: { motif: "medallion", label: "Medallion", concept: "arquitectura medallion, calidad y modelado" },
  m08: { motif: "batch-ingest", label: "Batch", concept: "ingesta batch, formatos, COPY INTO, JDBC y REST" },
  m09: { motif: "auto-loader", label: "Auto Loader", concept: "Auto Loader y Lakeflow Connect" },
  m10: { motif: "jobs", label: "Jobs", concept: "Lakeflow Jobs, DAG, tareas y triggers" },
  m11: { motif: "unity-cicd", label: "Gobierno", concept: "Unity Catalog, Git folders y CI/CD esencial" },
  m12: { motif: "associate-project", label: "Hito Associate", concept: "proyecto Associate y simulacro interno" },
  m13: { motif: "streaming", label: "Streaming", concept: "Structured Streaming, triggers y checkpoints" },
  m14: { motif: "stateful", label: "Estado", concept: "estado, ventanas, watermarks y datos tardios" },
  m15: { motif: "kafka", label: "Eventos", concept: "Kafka, buses de eventos y garantias de entrega" },
  m16: { motif: "cdc", label: "CDC", concept: "Change Data Feed, CDC, AUTO CDC y SCD" },
  m17: { motif: "streaming-project", label: "SLA streaming", concept: "proyecto de streaming con SLA" },
  m18: { motif: "declarative-pipelines", label: "Declarativo", concept: "Spark Declarative Pipelines en Lakeflow" },
  m19: { motif: "expectations", label: "Calidad", concept: "expectations, cuarentena y event logs" },
  m20: { motif: "repairs", label: "Repairs", concept: "Lakeflow Jobs avanzado, control flow y repairs" },
  m21: { motif: "alerts", label: "Operacion", concept: "triggers, alertas, backfills y operacion" },
  m22: { motif: "pipeline-project", label: "Proyecto pipelines", concept: "proyecto de pipeline declarativo" },
  m23: { motif: "spark-tuning", label: "Tuning Spark", concept: "tuning avanzado de Spark" },
  m24: { motif: "delta-tuning", label: "Tuning Delta", concept: "Photon, data skipping y liquid clustering" },
  m25: { motif: "finops", label: "FinOps", concept: "compute, politicas, etiquetas y costes" },
  m26: { motif: "observability", label: "Observabilidad", concept: "Spark UI, Query Profile y system tables" },
  m27: { motif: "reliability", label: "Fiabilidad", concept: "proyecto de fiabilidad y coste" },
  m28: { motif: "python-tests", label: "Pruebas", concept: "proyectos Python, dependencias y pruebas" },
  m29: { motif: "bundles", label: "Bundles", concept: "Declarative Automation Bundles y CI/CD" },
  m30: { motif: "privacy", label: "Privacidad", concept: "Unity Catalog avanzado y privacidad" },
  m31: { motif: "sharing", label: "Federation", concept: "OpenSharing y Federation" },
  m32: { motif: "professional-capstone", label: "Hito Professional", concept: "proyecto Professional y simulacro interno" },
};

export function artworkForModule(module: Pick<CurriculumModule, "id" | "track" | "title" | "number">): ModuleArtwork {
  const artwork = artworkByTrack[module.track];
  const moduleArtwork = artworkByModule[module.id] ?? {
    motif: artwork.tone === "ink" ? "professional-capstone" : "platform",
    label: module.title,
    concept: artwork.concept,
  };
  return {
    src: artwork.src,
    tone: artwork.tone,
    motif: moduleArtwork.motif,
    label: moduleArtwork.label,
    alt: `Ilustracion editorial sobre ${moduleArtwork.concept} para el modulo ${module.number}: ${module.title}.`,
  };
}

export type PublicLesson = Omit<CurriculumModule["lessons"][number], "checkpoint"> & {
  checkpoint: { question: string; answer: string };
};

export type PublicLab = Omit<CurriculumModule["lab"], "checks"> & {
  checks: Array<{ id: string; label: string }>;
};

export type PublicModule = Omit<CurriculumModule, "quiz" | "lab" | "lessons"> & {
  artwork: ModuleArtwork;
  lessons: PublicLesson[];
  lab: PublicLab;
  quiz: Array<{ id: string; prompt: string; options: string[]; domain: string }>;
  communityResources: CommunityResourceRecommendationPublic[];
};

export function moduleSummaries(locale: Locale = "es"): ModuleSummary[] {
  return modules.map((module) => {
    const phase = phaseByTrack.get(module.track) ?? LEARNING_PHASES[0];
    const resources = recommendationsForModule(module.id);
    return localizeModuleSummary({
      id: module.id,
      slug: module.slug,
      number: module.number,
      title: module.title,
      short: module.short,
      description: module.description,
      phase: phase.name,
      phaseId: phase.id,
      level: module.level,
      prerequisiteIds: [...module.prerequisites],
      resourceCount: resources.length,
      resourceConcepts: [...new Set(resources.flatMap((resource) => resource.concepts))],
      artwork: artworkForModule(module),
    }, locale);
  });
}

function publicCommunityResource(item: ExpandedCommunityRecommendation, locale: Locale = "es"): CommunityResourcePublic {
  const { artifact, repository } = item;
  const previewAvailable = Boolean(artifact.preview && repository.licenseStatus === "verified");
  const reviewedSource = artifact.preview ?? artifact.externalSource;
  if (!reviewedSource) throw new Error(`El recurso ${artifact.id} no tiene un archivo revisado.`);
  const reviewedSourceHref = `${repository.url}/blob/${reviewedSource.upstreamRef}/${reviewedSource.path.split("/").map(encodeURIComponent).join("/")}`;
  return {
    id: artifact.id,
    title: artifact.title,
    summary: locale === "en" ? `Reviewed ${artifact.format} resource for Databricks practice.` : artifact.summary,
    href: reviewedSourceHref,
    repositoryName: repository.name,
    repositoryUrl: repository.url,
    author: repository.author,
    provenance: repository.provenance,
    license: locale === "en" && repository.license === "No indicada" ? "Not specified" : repository.license,
    licenseStatus: repository.licenseStatus,
    licenseEvidenceHref: repository.licenseEvidencePath && repository.licenseEvidenceRef
      ? `${repository.url}/blob/${repository.licenseEvidenceRef}/${repository.licenseEvidencePath.split("/").map(encodeURIComponent).join("/")}`
      : null,
    format: artifact.format,
    languages: [...artifact.languages],
    difficulty: artifact.difficulty,
    runtimeNotes: locale === "en" ? "Review the source repository requirements before running it." : artifact.runtimeNotes,
    freeEdition: artifact.freeEdition,
    previewAvailable,
    previewUnavailableReason: previewAvailable
      ? null
      : repository.licenseStatus === "unknown"
        ? "license_unverified"
        : repository.licenseStatus === "restricted"
          ? "restricted_license"
          : "no_compatible_file",
    viewMode: previewAvailable ? "internal" : "github",
    sourcePath: reviewedSource.path,
    upstreamRef: reviewedSource.upstreamRef,
    reviewedAt: localizeReviewDate(repository.reviewedAt, locale) ?? repository.reviewedAt,
    usageInstructions: locale === "en" ? usageInstructionsFor(artifact).map((_, index) => `Review step ${index + 1} in the source repository.`) : usageInstructionsFor(artifact),
  };
}

function publicCommunityRecommendation(item: ExpandedCommunityRecommendation, locale: Locale = "es"): CommunityResourceRecommendationPublic {
  return {
    ...publicCommunityResource(item, locale),
    rank: item.rank,
    preferred: item.preferred,
    coverage: item.coverage,
    concepts: locale === "en"
      ? item.concepts.map((_, index) => `${moduleCopyEn[item.moduleId]?.short ?? "Databricks"} concept ${index + 1}`)
      : [...item.concepts],
    rationale: locale === "en" ? `Recommended supporting resource for this module.` : item.rationale,
  };
}

export function communityResourceCatalog(locale: Locale = "es"): CommunityResourceCatalogEntry[] {
  const aggregated = new Map<string, CommunityResourceCatalogEntry>();
  for (const item of moduleResourceRecommendations) {
    const curriculumModule = modules.find((candidate) => candidate.id === item.moduleId);
    if (!curriculumModule) continue;
    const phase = phaseByTrack.get(curriculumModule.track) ?? LEARNING_PHASES[0];
    const existing = aggregated.get(item.artifact.id);
    const relatedModule = {
      id: curriculumModule.id,
      number: curriculumModule.number,
      slug: curriculumModule.slug,
      title: curriculumModule.title,
      phase: phase.name,
      phaseId: phase.id,
      rank: item.rank,
      coverage: item.coverage,
    };
    if (existing) {
      existing.relatedModules.push(relatedModule);
      existing.concepts = [...new Set([...existing.concepts, ...item.concepts])];
      existing.preferred ||= item.preferred;
    } else {
      aggregated.set(item.artifact.id, {
        ...publicCommunityResource(item),
        concepts: [...item.concepts],
        preferred: item.preferred,
        relatedModules: [relatedModule],
      });
    }
  }
  const catalog = [...aggregated.values()].sort((left, right) => {
    const leftOrder = Math.min(...left.relatedModules.map((module) => Number(module.number)));
    const rightOrder = Math.min(...right.relatedModules.map((module) => Number(module.number)));
    return Number(right.preferred) - Number(left.preferred) || leftOrder - rightOrder || left.title.localeCompare(right.title, "es");
  });
  return localizeResourceCatalog(catalog, locale);
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

const moduleSearchIndex: IndexedCurriculumResult[] = modules.flatMap((module, moduleIndex) => {
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
      href: `/curso/${module.slug}/${lesson.id}`,
      searchableLabel: normalizeSearchText(`${lesson.title} ${lesson.kicker}`),
      searchableDescription: normalizeSearchText(`${lesson.summary} ${lesson.explanation.join(" ")} ${lesson.keyPoints.join(" ")} ${lesson.decisions.join(" ")}`),
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
        href: `/curso/${module.slug}/${lesson.id}?concept=${encodeURIComponent(anchor)}#${anchor}`,
        searchableLabel: normalizeSearchText(concept.term),
        searchableDescription: normalizeSearchText(`${concept.definition} ${concept.whyItMatters}`),
        searchableLocation: normalizeSearchText(`${lessonLocation} ${lesson.title} ${module.title}`),
        order: moduleIndex * 100 + lessonIndex * 10 + conceptIndex + 2,
      };
    });
    return [lessonResult, ...conceptResults];
  });

  const resourceResults = recommendationsForModule(module.id).map((resource): IndexedCurriculumResult => ({
    id: `resource:${module.id}:${resource.artifact.id}`,
    kind: "resource",
    label: resource.artifact.title,
    description: resource.rationale,
    location: `${moduleLocation} · Notebook comunitario`,
    href: `/curso/${module.slug}?section=resources&resource=${encodeURIComponent(resource.artifact.id)}`,
    searchableLabel: normalizeSearchText(`${resource.artifact.title} ${resource.repository.name} ${resource.repository.author}`),
    searchableDescription: normalizeSearchText(`${resource.artifact.summary} ${resource.rationale} ${resource.concepts.join(" ")} ${resource.artifact.runtimeNotes}`),
    searchableLocation: normalizeSearchText(`${moduleLocation} notebook recurso ${module.title}`),
    order: moduleIndex * 100 + 80 + resource.rank,
  }));

  return [moduleResult, ...lessonResults, ...resourceResults];
});

const glossarySearchIndex: IndexedCurriculumResult[] = glossaryEntries.map((entry, index) => ({
  id: `glossary:${entry.id}`,
  kind: "glossary",
  label: entry.term,
  description: entry.definition,
  location: `Glosario · ${glossaryCategoryLabels[entry.category]}`,
  href: `/glosario#${entry.id}`,
  searchableLabel: normalizeSearchText(`${entry.term} ${entry.aliases.join(" ")}`),
  searchableDescription: normalizeSearchText(`${entry.definition} ${entry.whyItMatters} ${entry.related.join(" ")}`),
  searchableLocation: normalizeSearchText(`glosario ${glossaryCategoryLabels[entry.category]}`),
  order: 10_000 + index,
}));

const curriculumSearchIndex: IndexedCurriculumResult[] = [
  ...moduleSearchIndex,
  ...glossarySearchIndex,
];

function searchScore(entry: IndexedCurriculumResult, query: string, tokens: string[]) {
  const haystack = `${entry.searchableLabel} ${entry.searchableDescription} ${entry.searchableLocation}`;
  if (!tokens.every((token) => haystack.includes(token))) return -1;
  let score = entry.kind === "concept" || entry.kind === "glossary" ? 12 : entry.kind === "resource" ? 8 : entry.kind === "lesson" ? 6 : 3;
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

function expandSearchInput(input: string, locale: Locale) {
  if (locale === "es") return input;
  const lower = input.toLocaleLowerCase("en");
  const additions = [
    lower.includes("curriculum") ? "temario" : "",
    lower.includes("path") ? "ruta" : "",
    lower.includes("practice") || lower.includes("exam") ? "simulacro" : "",
    lower.includes("lesson") ? "leccion" : "",
    lower.includes("module") ? "modulo" : "",
    lower.includes("governance") ? "gobierno" : "",
    lower.includes("performance") ? "rendimiento" : "",
    lower.includes("cost") ? "coste" : "",
    lower.includes("security") ? "seguridad" : "",
  ].filter(Boolean);
  return additions.length ? `${input} ${additions.join(" ")}` : input;
}

function localizeSearchResult(entry: IndexedCurriculumResult, locale: Locale): CurriculumSearchResult {
  if (locale === "es") {
    return {
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      description: entry.description,
      location: entry.location,
      href: entry.href,
    };
  }

  const moduleId = entry.id.startsWith("module:")
    ? entry.id.slice("module:".length)
    : entry.id.startsWith("lesson:")
      ? entry.id.slice("lesson:".length, "lesson:m00".length)
      : entry.id.startsWith("concept:")
        ? entry.id.slice("concept:".length, "concept:m00".length)
      : null;
  const moduleCopy = moduleId ? moduleCopyEn[moduleId] : null;
  const lesson = entry.id.startsWith("lesson:")
    ? modules.flatMap((module) => module.lessons).find((item) => `lesson:${item.id}` === entry.id)
    : entry.id.startsWith("concept:")
      ? modules.flatMap((module) => module.lessons).find((item) => entry.id.startsWith(`concept:${item.id}:`))
    : null;
  const localizedLesson = lesson
    ? localizeModule(modules.find((module) => module.id === lesson.id.slice(0, 3))!, locale).lessons.find((item) => item.id === lesson.id)
    : null;
  const conceptIndex = entry.id.startsWith("concept:") ? Number(entry.id.split(":").at(-1)) : NaN;
  const localizedConcept = localizedLesson && Number.isInteger(conceptIndex) ? localizedLesson.deepDive.concepts[conceptIndex] : null;

  return {
    id: entry.id,
    kind: entry.kind,
    label: entry.kind === "module" && moduleCopy ? moduleCopy.title : localizedConcept ? localizedConcept.term : localizedLesson ? localizedLesson.title : entry.label,
    description: entry.kind === "module" && moduleCopy ? moduleCopy.description : localizedConcept ? localizedConcept.definition : localizedLesson ? localizedLesson.summary : localizeText(entry.description, locale),
    location: localizeSearchLocation(entry.location, locale),
    href: entry.href,
  };
}

export function searchCurriculum(input: string, locale: Locale = "es", limit = 8): CurriculumSearchResult[] {
  const query = normalizeSearchText(expandSearchInput(input, locale)).slice(0, 100);
  if (query.length < 2) return [];
  const tokens = query.split(" ").filter((token) => token.length > 1).slice(0, 8);
  if (!tokens.length) return [];
  return curriculumSearchIndex
    .map((entry) => ({ entry, score: searchScore(entry, query, tokens) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score || left.entry.order - right.entry.order)
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map(({ entry }) => localizeSearchResult(entry, locale));
}

export function findModuleBySlug(slug: string): CurriculumModule | null {
  return modules.find((module) => module.slug === slug) ?? null;
}

export function findModuleById(moduleId: string): CurriculumModule | null {
  return modules.find((module) => module.id === moduleId) ?? null;
}

export function publicModule(sourceModule: CurriculumModule, locale: Locale = "es"): PublicModule {
  // eslint-disable-next-line @next/next/no-assign-module-variable -- Keeps the public quiz projection contract easy to audit in static tests.
  const module = localizeModule(sourceModule, locale);
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
    artwork: artworkForModule(module),
    sources: module.sources.map((source) => ({ ...source })),
    communityResources: recommendationsForModule(module.id).map((resource) => publicCommunityRecommendation(resource, locale)),
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

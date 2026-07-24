import { modules, type CurriculumModule, type Lesson, type SourceReference } from "./course-data";
import { CONTENT_REVIEW_DATE, PROJECT_ISSUES_URL } from "./project-info";
import { OFFICIAL_BLUEPRINTS, REVIEWED_AT } from "./editorial-data";
import { learningPathProfiles } from "./learning-paths";

export type EditorialChange = {
  date: string;
  target: string;
  type: "contenido" | "fuentes" | "producto" | "privacidad" | "accesibilidad";
  description: string;
  reference: string | null;
};

export const EDITORIAL_OWNER = {
  name: "Juan José Navarro Vidal",
  role: "Autor y mantenedor del proyecto Lakehouse Lab",
  note: "El repositorio no declara revisores externos ni afiliación con Databricks. La metodología deja esos campos preparados para completarlos cuando exista evidencia verificable.",
} as const;

export const EDITORIAL_REVIEW_STATUS = "Revisión editorial interna";
export const EDITORIAL_UPDATE_FREQUENCY = "Revisión planificada cuando cambian blueprints, documentación oficial o dependencias del currículo.";

export const editorialChangelog: EditorialChange[] = [
  {
    date: "2026-07-24",
    target: "Portada, navegación y rutas de entrada",
    type: "producto",
    description: "Reposicionamiento hacia aprendizaje práctico de ingeniería de datos con Databricks y certificaciones como resultado del itinerario.",
    reference: null,
  },
  {
    date: "2026-07-24",
    target: "Metodología, metadatos editoriales y URLs de lección",
    type: "contenido",
    description: "Añadida estructura pública para explicar fuentes, revisión, reporte de errores, política de versiones y navegación estable por lección.",
    reference: null,
  },
  {
    date: "2026-07-22",
    target: "Currículo v2.0.0",
    type: "fuentes",
    description: "Publicación del currículo de 32 módulos con fuentes oficiales, laboratorios, simulacros internos y revisión editorial inicial.",
    reference: null,
  },
];

export function issueHref(target: string) {
  const title = encodeURIComponent(`Corrección editorial: ${target}`);
  const body = encodeURIComponent("Describe el problema, la URL afectada y la fuente que lo corrige.");
  return `${PROJECT_ISSUES_URL}/new?labels=contenido&title=${title}&body=${body}`;
}

export function primarySources(module: Pick<CurriculumModule, "sources">, refIds?: string[]) {
  const selected = refIds?.length
    ? module.sources.filter((source) => refIds.includes(source.id))
    : module.sources;
  return selected.length ? selected : module.sources.slice(0, 3);
}

export function moduleEditorialMetadata(module: CurriculumModule) {
  const relatedPaths = learningPathProfiles
    .filter((path) => path.moduleIds.includes(module.id))
    .map((path) => path.shortTitle);
  return {
    reviewedAt: CONTENT_REVIEW_DATE,
    level: module.level,
    relatedPaths,
    blueprintDomains: module.examDomains,
    sources: primarySources(module).slice(0, 4),
    reviewStatus: EDITORIAL_REVIEW_STATUS,
    reportHref: issueHref(`Módulo ${module.number}: ${module.title}`),
  };
}

export function lessonEditorialMetadata(module: CurriculumModule, lesson: Lesson) {
  const moduleMetadata = moduleEditorialMetadata(module);
  return {
    ...moduleMetadata,
    sources: primarySources(module, lesson.refIds).slice(0, 4),
    estimatedMinutes: Math.max(12, Math.round((module.minutes * 0.5) / module.lessons.length)),
    prerequisites: module.prerequisites,
    reportHref: issueHref(`Lección ${lesson.id}: ${lesson.title}`),
  };
}

export function findLesson(moduleSlug: string, lessonId: string) {
  const courseModule = modules.find((candidate) => candidate.slug === moduleSlug);
  if (!courseModule) return null;
  const lessonIndex = courseModule.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex < 0) return null;
  return { module: courseModule, lesson: courseModule.lessons[lessonIndex], lessonIndex };
}

export function lessonNeighbors(moduleSlug: string, lessonId: string) {
  const flattened = modules.flatMap((courseModule) => courseModule.lessons.map((lesson) => ({ module: courseModule, lesson })));
  const index = flattened.findIndex((item) => item.module.slug === moduleSlug && item.lesson.id === lessonId);
  return {
    previous: index > 0 ? flattened[index - 1] : null,
    next: index >= 0 && index < flattened.length - 1 ? flattened[index + 1] : null,
  };
}

export function sourceStructuredData(source: SourceReference) {
  return {
    "@type": "CreativeWork",
    name: source.label,
    url: source.href,
    publisher: source.publisher,
    dateModified: REVIEWED_AT,
  };
}

export const methodologyReferences = [
  OFFICIAL_BLUEPRINTS.Associate,
  OFFICIAL_BLUEPRINTS.Professional,
];

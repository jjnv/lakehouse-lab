import { modules, type CurriculumModule } from "./course-data";

export type LearningPathId =
  | "associate"
  | "professional"
  | "databricks-cero"
  | "streaming-cdc"
  | "laboratorios";

export type LearningPathProfile = {
  id: LearningPathId;
  title: string;
  shortTitle: string;
  href: string;
  cta: string;
  forWhom: string;
  prerequisites: string;
  objective: string;
  expectedOutcome: string;
  moduleIds: string[];
  durationMinutes: number;
  durationLabel: string;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
  assessmentCount: number;
};

export const DURATION_METHOD =
  "Las duraciones suman los minutos definidos en el currículo por módulo. Cada módulo incluye cinco lecciones, un laboratorio y una evaluación. Para la ruta de laboratorios se estima solo la parte práctica: 45 min por laboratorio estándar, 75 min por proyecto de rama y 120 min por capstone.";

function formatDuration(minutes: number) {
  const hours = Math.round(minutes / 60);
  return `${hours} h aprox.`;
}

function labOnlyMinutes(module: CurriculumModule) {
  if (module.kind === "capstone") return 120;
  if (module.kind === "branch-project") return 75;
  return 45;
}

function profile(input: Omit<LearningPathProfile, "durationMinutes" | "durationLabel" | "moduleCount" | "lessonCount" | "labCount" | "assessmentCount"> & { durationMinutes?: number }): LearningPathProfile {
  const selected = modules.filter((module) => input.moduleIds.includes(module.id));
  const durationMinutes = input.durationMinutes ?? selected.reduce((total, module) => total + module.minutes, 0);
  return {
    ...input,
    durationMinutes,
    durationLabel: formatDuration(durationMinutes),
    moduleCount: selected.length,
    lessonCount: selected.reduce((total, module) => total + module.lessons.length, 0),
    labCount: selected.length,
    assessmentCount: selected.length,
  };
}

const associateModuleIds = modules.slice(0, 12).map((module) => module.id);
const professionalModuleIds = modules.map((module) => module.id);
const streamingModuleIds = modules.filter((module) => module.track === "streaming").map((module) => module.id);
const labModuleIds = modules.map((module) => module.id);

export const learningPathProfiles: LearningPathProfile[] = [
  profile({
    id: "associate",
    title: "Preparar Data Engineer Associate",
    shortTitle: "Associate",
    href: "/catalogo?level=associate",
    cta: "Ver módulos Associate",
    forWhom: "Personas que ya conocen SQL o Python básico y quieren ordenar los fundamentos de Databricks.",
    prerequisites: "SQL básico, nociones de datos tabulares y lectura técnica en español.",
    objective: "Cubrir plataforma, Delta Lake, ingesta, transformación, Jobs, Unity Catalog y CI/CD esencial.",
    expectedOutcome: "Llegar al simulacro Associate con los dominios troncales practicados en laboratorios guiados.",
    moduleIds: associateModuleIds,
  }),
  profile({
    id: "professional",
    title: "Preparar Data Engineer Professional",
    shortTitle: "Professional",
    href: "/catalogo?level=professional",
    cta: "Ver itinerario completo",
    forWhom: "Data engineers con fundamentos Associate que necesitan practicar decisiones de producción.",
    prerequisites: "Base lakehouse, Spark/SQL y experiencia leyendo pipelines o notebooks de datos.",
    objective: "Conectar streaming, CDC, orquestación, rendimiento, FinOps, seguridad, CI/CD y gobierno.",
    expectedOutcome: "Construir criterio técnico para el simulacro Professional y para defender arquitecturas lakehouse.",
    moduleIds: professionalModuleIds,
  }),
  profile({
    id: "databricks-cero",
    title: "Aprender Databricks desde cero",
    shortTitle: "Desde cero",
    href: "/catalogo?phase=fundamentos",
    cta: "Empezar por fundamentos",
    forWhom: "Personas que quieren entender Databricks antes de pensar en un examen.",
    prerequisites: "Curiosidad por ingeniería de datos; ayuda conocer SQL, pero la ruta arranca por conceptos base.",
    objective: "Construir el modelo mental de plataforma, compute, notebooks, Spark, Delta, medallion y Jobs.",
    expectedOutcome: "Saber navegar el workspace, leer un plan de datos y ejecutar prácticas pequeñas con criterio.",
    moduleIds: associateModuleIds,
  }),
  profile({
    id: "streaming-cdc",
    title: "Mejorar en streaming y CDC",
    shortTitle: "Streaming y CDC",
    href: "/catalogo?phase=streaming",
    cta: "Ver rama streaming",
    forWhom: "Quien ya trabaja con batch y necesita dominar estado, eventos tardíos y cambios incrementales.",
    prerequisites: "Fundamentos de Spark, Delta Lake y Jobs; idealmente haber completado el tramo Associate.",
    objective: "Practicar Structured Streaming, watermarks, Kafka, Change Data Feed, AUTO CDC y un proyecto con SLA.",
    expectedOutcome: "Diseñar flujos incrementales con checkpoints, recuperación y decisiones explícitas de latencia.",
    moduleIds: streamingModuleIds,
  }),
  profile({
    id: "laboratorios",
    title: "Practicar con laboratorios",
    shortTitle: "Laboratorios",
    href: "/recursos",
    cta: "Abrir recursos prácticos",
    forWhom: "Personas que aprenden mejor ejecutando, comparando evidencia y revisando notebooks.",
    prerequisites: "Acceso a Databricks Free Edition o a un workspace aislado cuando el laboratorio lo requiera.",
    objective: "Recorrer prácticas guiadas con starter code, checks, evidencia esperada y recursos complementarios.",
    expectedOutcome: "Acumular evidencia reproducible y detectar qué conceptos necesitan repaso antes de evaluar.",
    moduleIds: labModuleIds,
    durationMinutes: modules.reduce((total, module) => total + labOnlyMinutes(module), 0),
  }),
];

export function getLearningPathProfile(id: LearningPathId) {
  return learningPathProfiles.find((path) => path.id === id) ?? null;
}

export function modulesForPath(path: LearningPathProfile) {
  const selected = new Set(path.moduleIds);
  return modules.filter((module) => selected.has(module.id));
}

export function totalLessonCount() {
  return modules.reduce((total, module) => total + module.lessons.length, 0);
}

/**
 * Contratos del Data Engineering Playground.
 *
 * El dominio es puro: no importa React, Next.js ni la base de datos, de modo
 * que el mismo motor se ejecuta en el navegador (experiencia interactiva) y en
 * el servidor (re-ejecución autoritativa al guardar un intento).
 *
 * Todos los valores numéricos de los escenarios son SINTÉTICOS y educativos;
 * no son benchmarks ni mediciones de Databricks, Spark o Delta Lake.
 */
import type { SkillId } from "./skills";

export type PlaygroundLocale = "es" | "en";

/** Modos de aprendizaje que reutilizan el mismo motor. */
export type LearningMode = "guided" | "practice" | "evaluation" | "production";
export const LEARNING_MODES: readonly LearningMode[] = ["guided", "practice", "evaluation", "production"];

export type ComparisonOp = "lt" | "lte" | "gt" | "gte" | "eq";

/** Lenguaje de condiciones declarativo evaluado contra el estado actual. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { flag: string; is?: boolean }
  | { metric: string; op: ComparisonOp; value: number }
  | { evidence: string }
  | { done: string }
  | { elapsedMinutes: ComparisonOp; value: number };

export type MetricUnit = "count" | "minutes" | "seconds" | "gb" | "percent" | "units" | "ratio" | "rows";

export type ScenarioMetric = {
  id: string;
  unit: MetricUnit;
  /** Dirección deseable, usada para pintar tendencias. */
  better: "lower" | "higher";
  /** Umbral objetivo opcional (SLO o límite). */
  target?: number;
  min?: number;
  max?: number;
};

export type MetricEffect =
  | { metric: string; set: number }
  | { metric: string; add: number }
  | { metric: string; multiply: number }
  /** Copia el valor actual de otra métrica (p. ej. registrar el minuto de publicación). */
  | { metric: string; copyFrom: string }
  /** Suma `factor` veces el valor actual de otra métrica. */
  | { metric: string; addFrom: string; factor?: number };

/** Efecto condicional de una acción: se aplica solo si `when` se cumple. */
export type ActionEffect = {
  when?: Condition;
  metrics?: MetricEffect[];
  flags?: Record<string, boolean>;
  /** Clave de texto del evento que se añade al registro de la simulación. */
  event: string;
  severity?: "info" | "warning" | "critical" | "success";
  /** Evidencias que se revelan al aplicar este efecto. */
  reveals?: string[];
};

export type ActionKind = "investigate" | "mitigate" | "change" | "recover" | "validate" | "communicate" | "prevent";
export type RiskLevel = "none" | "low" | "medium" | "high";

/**
 * Valoración pedagógica de una acción en un contexto. La primera regla cuyo
 * `when` se cumple (en el estado previo a la acción) clasifica la decisión.
 */
export type ActionAssessment = {
  when?: Condition;
  verdict: "good" | "neutral" | "unnecessary" | "dangerous";
  /** Clave de texto que explica la valoración en la retrospectiva. */
  note: string;
};

export type SimulationActionDefinition = {
  id: string;
  kind: ActionKind;
  /** Minutos simulados que consume la acción. */
  minutes: number;
  /** Unidades de coste sintéticas que consume la acción. */
  cost: number;
  risk: RiskLevel;
  /** Condición necesaria para ejecutarla. */
  requires?: Condition;
  /** Las acciones `repeatable: false` solo pueden ejecutarse una vez. */
  repeatable?: boolean;
  effects: ActionEffect[];
  assessment: ActionAssessment[];
  /** Competencias que ejercita esta decisión. */
  skills: SkillId[];
};

/** Dinámica pasiva: se aplica por cada minuto simulado mientras `when` se cumple. */
export type ScenarioDynamic = {
  when?: Condition;
  /** Si `fromMetric` existe, el incremento es `add * metrics[fromMetric]`. */
  perMinute: Array<{ metric: string; add: number; fromMetric?: string }>;
  /** Amplitud relativa (0..1) de la variación determinista por semilla. */
  jitter?: number;
};

export type ScenarioEvidence = {
  id: string;
  /** Tipo de panel con el que se representa. */
  kind: "log" | "metric" | "plan" | "config" | "history" | "query" | "diff" | "permissions" | "dag";
  /** Si es `true`, la evidencia apunta directamente a la causa raíz. */
  pointsToRoot?: boolean;
};

export type DiagnosisOption = {
  id: string;
  role: "root" | "contributing" | "symptom" | "wrong";
};

export type ScenarioObjective = {
  id: string;
  condition: Condition;
  /** Objetivos obligatorios cuentan para la recuperación. */
  required: boolean;
};

export type ScenarioConstraint = {
  id: string;
  /** Si la condición se cumple, se ha violado la restricción. */
  violatedWhen: Condition;
  /** Una violación crítica termina el escenario como fracaso. */
  critical: boolean;
};

export type EvaluationDimension =
  | "diagnosis"
  | "evidence"
  | "ordering"
  | "time"
  | "cost"
  | "risk"
  | "integrity"
  | "sla"
  | "validation"
  | "prevention";

export const EVALUATION_DIMENSIONS: readonly EvaluationDimension[] = [
  "diagnosis", "evidence", "ordering", "time", "cost", "risk", "integrity", "sla", "validation", "prevention",
];

export type EvaluationRubric = {
  weights: Record<EvaluationDimension, number>;
  /** Minutos de referencia de una resolución razonable. */
  referenceMinutes: number;
  /** Coste de referencia de una resolución razonable. */
  referenceCost: number;
  /** Evidencias mínimas esperadas antes de cambiar el sistema. */
  expectedEvidence: string[];
  /** Acciones de validación posteriores a la recuperación. */
  validationActions: string[];
  /** Acciones preventivas (runbook, alertas, contrato...). */
  preventionActions: string[];
  /** Flag que indica pérdida o corrupción de datos. */
  integrityFlags: string[];
  /** Métrica de SLA y umbral. */
  sla: { metric: string; op: ComparisonOp; value: number };
};

export type CurriculumReference = {
  moduleId: string;
  lessonId?: string;
};

export type ScenarioSource = {
  label: string;
  url: string;
  publisher: "Databricks" | "Apache Spark" | "Delta Lake" | "Apache Kafka";
};

export type ScenarioVersion = {
  version: string;
  reviewedAt: string;
  authors: string[];
  reviewStatus: "draft" | "internal-review" | "reviewed";
};

export type ScenarioDifficulty = "foundation" | "intermediate" | "advanced";
export type ScenarioCategory = "streaming" | "delta" | "performance" | "governance" | "orchestration";

/** Tipo de ejecución, mostrado visualmente para no confundir con ejecución real. */
export type ExecutionKind = "conceptual-simulation" | "local-execution" | "external-documented" | "reproduced-lab" | "verified-lab";

export type ScenarioDefinition = {
  id: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  executionKind: ExecutionKind;
  version: ScenarioVersion;
  technologies: string[];
  compatibility: string;
  skills: SkillId[];
  curriculum: CurriculumReference[];
  sources: ScenarioSource[];
  /**
   * Métricas derivadas recalculadas tras cada minuto simulado a partir de las
   * métricas base y los flags (p. ej. retraso = backlog / tasa de entrada).
   * Debe ser una función pura.
   */
  derive?: (metrics: Record<string, number>, flags: Record<string, boolean>) => Record<string, number>;
  initialMetrics: Record<string, number>;
  initialFlags: Record<string, boolean>;
  metrics: ScenarioMetric[];
  dynamics: ScenarioDynamic[];
  evidence: ScenarioEvidence[];
  /** Evidencias visibles desde el principio (síntomas observables). */
  initialEvidence: string[];
  actions: SimulationActionDefinition[];
  diagnosis: DiagnosisOption[];
  objectives: ScenarioObjective[];
  constraints: ScenarioConstraint[];
  /** Límite de minutos simulados antes de que el escenario expire. */
  timeLimitMinutes: number;
  rubric: EvaluationRubric;
  /**
   * Rutas alternativas válidas, usadas por las pruebas. Tokens especiales:
   * `@diagnose` (declara referenceDiagnosis), `@drain` (repite waitActionId
   * hasta cumplir objetivos) y `@close`.
   */
  referencePaths: Array<{ id: string; actions: string[] }>;
  /** Acción que deja pasar tiempo sin cambiar el sistema. */
  waitActionId: string;
  /** Hipótesis correctas para declarar el diagnóstico en las rutas de referencia. */
  referenceDiagnosis: string[];
};

export type SimulationEvent = {
  seq: number;
  atMinute: number;
  type: "action" | "effect" | "system" | "diagnosis" | "rejected";
  actionId?: string;
  textKey: string;
  severity: "info" | "warning" | "critical" | "success";
  metricsAfter?: Record<string, number>;
};

export type SimulationStatus = "running" | "recovered" | "failed" | "expired";

export type SimulationState = {
  scenarioId: string;
  scenarioVersion: string;
  seed: number;
  mode: LearningMode;
  status: SimulationStatus;
  elapsedMinutes: number;
  cost: number;
  metrics: Record<string, number>;
  flags: Record<string, boolean>;
  revealedEvidence: string[];
  performed: string[];
  diagnosis: string[] | null;
  /** Minuto en que se declaró el diagnóstico (para evaluar el orden). */
  diagnosisAtStep: number | null;
  violatedConstraints: string[];
  /** Minuto en que se cumplieron por primera vez los objetivos obligatorios. */
  objectivesMetAtMinute: number | null;
  /** Paso (número de acciones) en que se cumplieron los objetivos obligatorios. */
  objectivesMetAtStep: number | null;
  /** Evidencias reveladas antes del primer cambio sobre el sistema. */
  evidenceBeforeFirstChange: string[] | null;
  decisions: DecisionReview[];
  events: SimulationEvent[];
  /** Serie temporal de métricas tras cada paso, para los gráficos. */
  history: Array<{ step: number; atMinute: number; metrics: Record<string, number> }>;
};

/** Entrada de usuario que el motor sabe aplicar. */
export type SimulationAction =
  | { type: "action"; actionId: string }
  | { type: "diagnose"; hypotheses: string[] }
  | { type: "close" };

export type ActionAvailability = {
  actionId: string;
  available: boolean;
  reason?: "requires" | "already-done" | "finished";
};

export type ScoredDimension = {
  dimension: EvaluationDimension;
  /** 0..1 */
  score: number;
  weight: number;
  /** Clave de explicación transparente. */
  reason: string;
  detail?: Record<string, number | string>;
};

export type DecisionReview = {
  step: number;
  actionId: string;
  verdict: ActionAssessment["verdict"];
  note: string;
  atMinute: number;
};

export type EvaluationResult = {
  scenarioId: string;
  scenarioVersion: string;
  status: SimulationStatus;
  /** 0..100, orientativo. */
  score: number;
  dimensions: ScoredDimension[];
  decisions: DecisionReview[];
  diagnosis: { selected: string[]; correctRoot: boolean; missedContributing: string[]; wrong: string[] };
  /** Penalizaciones explícitas, p. ej. pérdida de datos. */
  penalties: Array<{ id: string; points: number }>;
  skills: SkillEvidence[];
  durationMinutes: number;
  cost: number;
};

export type SkillEvidence = {
  skillId: SkillId;
  level: "simulation-applied" | "problem-solved";
  /** 0..1 contribución orientativa de este intento. */
  strength: number;
  source: { kind: "scenario"; id: string; version: string };
};

export type ScenarioAttempt = {
  scenarioId: string;
  scenarioVersion: string;
  mode: LearningMode;
  seed: number;
  inputs: SimulationAction[];
};

export type ScenarioHint = {
  /** Se muestra solo en modo guiado cuando la condición se cumple. */
  when: Condition;
  textKey: string;
};

export type LearningRecommendation = {
  kind: "scenario" | "lesson" | "repeat";
  targetId: string;
  reasonKey: string;
  skillId?: SkillId;
};

/** Textos localizados de un escenario: claves estables, mismo motor. */
export type ScenarioCopy = {
  title: string;
  summary: string;
  business: string;
  architecture: string[];
  objectiveText: string;
  slo: string;
  volume: string;
  resources: string;
  budget: string;
  consumers: string;
  recentChanges: string;
  unknowns: string;
  metrics: Record<string, string>;
  actions: Record<string, { label: string; description: string }>;
  evidence: Record<string, { title: string; body: string }>;
  events: Record<string, string>;
  diagnosis: Record<string, string>;
  objectives: Record<string, string>;
  constraints: Record<string, string>;
  notes: Record<string, string>;
  hints: ScenarioHintCopy[];
  retrospective: {
    rootCause: string;
    symptoms: string[];
    aggravating: string[];
    alternatives: string[];
    prevention: string[];
    improvementPlan: string[];
  };
  assumptions: string[];
  limitations: string[];
};

export type ScenarioHintCopy = { id: string; text: string };

export type LocalizedScenario = {
  definition: ScenarioDefinition;
  hints: Array<{ id: string; when: Condition }>;
  copy: Record<PlaygroundLocale, ScenarioCopy>;
};

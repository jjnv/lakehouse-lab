/** Identificadores estables de competencias. No renombrar sin plan de compatibilidad. */
export const SKILL_IDS = [
  "lakehouse-architecture",
  "sql",
  "python",
  "pyspark",
  "spark-internals",
  "batch-ingestion",
  "streaming",
  "cdc",
  "delta-lake",
  "modeling",
  "data-quality",
  "orchestration",
  "unity-catalog",
  "security",
  "cicd",
  "observability",
  "troubleshooting",
  "performance",
  "finops",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === "string" && (SKILL_IDS as readonly string[]).includes(value);
}

export const SKILL_LABELS: Record<"es" | "en", Record<SkillId, string>> = {
  es: {
    "lakehouse-architecture": "Arquitectura lakehouse",
    sql: "SQL",
    python: "Python",
    pyspark: "PySpark",
    "spark-internals": "Spark internals",
    "batch-ingestion": "Ingesta batch",
    streaming: "Streaming",
    cdc: "CDC",
    "delta-lake": "Delta Lake",
    modeling: "Modelado",
    "data-quality": "Calidad de datos",
    orchestration: "Orquestación",
    "unity-catalog": "Unity Catalog",
    security: "Seguridad",
    cicd: "CI/CD",
    observability: "Observabilidad",
    troubleshooting: "Troubleshooting",
    performance: "Rendimiento",
    finops: "FinOps",
  },
  en: {
    "lakehouse-architecture": "Lakehouse architecture",
    sql: "SQL",
    python: "Python",
    pyspark: "PySpark",
    "spark-internals": "Spark internals",
    "batch-ingestion": "Batch ingestion",
    streaming: "Streaming",
    cdc: "CDC",
    "delta-lake": "Delta Lake",
    modeling: "Modeling",
    "data-quality": "Data quality",
    orchestration: "Orchestration",
    "unity-catalog": "Unity Catalog",
    security: "Security",
    cicd: "CI/CD",
    observability: "Observability",
    troubleshooting: "Troubleshooting",
    performance: "Performance",
    finops: "FinOps",
  },
};

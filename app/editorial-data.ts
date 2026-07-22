export const SITE_VERSION = "1.4.0";
export const PUBLISHED_AT = "22 jul 2026";
export const REVIEWED_AT = "22 jul 2026";

export const OFFICIAL_BLUEPRINTS = {
  Associate: {
    label: "Data Engineer Associate · mayo de 2026",
    href: "https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf",
  },
  Professional: {
    label: "Data Engineer Professional · 30 de noviembre de 2025",
    href: "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf",
  },
} as const;

export const PLATFORM_REFERENCES = {
  freeEdition: {
    id: "free-edition-limits",
    label: "Limitaciones de Databricks Free Edition",
    href: "https://docs.databricks.com/aws/en/getting-started/free-edition-limitations",
    publisher: "Databricks",
    reviewedAt: REVIEWED_AT,
    cloud: "Multinube",
    version: "Free Edition · julio de 2026",
  },
  runtime: {
    id: "runtime-support",
    label: "Versiones y compatibilidad de Databricks Runtime",
    href: "https://docs.databricks.com/aws/en/release-notes/runtime",
    publisher: "Databricks",
    reviewedAt: REVIEWED_AT,
    cloud: "Multinube",
    version: "DBR 17.3 LTS · Spark 4.0",
  },
  pricing: {
    id: "databricks-pricing",
    label: "Precios y calculadora de Databricks",
    href: "https://www.databricks.com/product/pricing",
    publisher: "Databricks",
    reviewedAt: REVIEWED_AT,
    cloud: "AWS · Azure · GCP",
    version: "Precios consultados en julio de 2026",
  },
} as const;

export type CertificationLevel = keyof typeof OFFICIAL_BLUEPRINTS;

export type BlueprintObjective = {
  id: string;
  level: CertificationLevel;
  domain: string;
  objective: string;
  moduleIds: string[];
  theory: boolean;
  practice: boolean;
  assessment: boolean;
  reproduced: boolean;
};

function objective(
  id: string,
  level: CertificationLevel,
  domain: string,
  text: string,
  moduleIds: string[],
): BlueprintObjective {
  return { id, level, domain, objective: text, moduleIds, theory: true, practice: true, assessment: true, reproduced: false };
}

export const blueprintObjectives: BlueprintObjective[] = [
  objective("a-platform-architecture", "Associate", "Databricks Intelligence Platform", "Explicar arquitectura, Delta Lake y Unity Catalog como componentes diferenciados.", ["m01", "m06", "m11"]),
  objective("a-platform-compute", "Associate", "Databricks Intelligence Platform", "Comparar servicios de compute, limitaciones, costes y adecuación al workload.", ["m02", "m25"]),
  objective("a-ingest-patterns", "Associate", "Data Ingestion and Loading", "Elegir patrones batch, streaming e incrementales según volumen, frecuencia y gobierno.", ["m08", "m09", "m13"]),
  objective("a-ingest-copy", "Associate", "Data Ingestion and Loading", "Usar COPY INTO con object storage y tablas gobernadas por Unity Catalog.", ["m08"]),
  objective("a-ingest-autoloader", "Associate", "Data Ingestion and Loading", "Configurar Auto Loader con enforcement, evolución de esquema y modos de descubrimiento.", ["m09"]),
  objective("a-ingest-connect", "Associate", "Data Ingestion and Loading", "Configurar Lakeflow Connect y distinguir conectores standard, managed y partner.", ["m09"]),
  objective("a-ingest-jdbc", "Associate", "Data Ingestion and Loading", "Integrar JDBC, ODBC y REST mediante notebooks y Lakeflow Jobs.", ["m08", "m10"]),
  objective("a-ingest-choice", "Associate", "Data Ingestion and Loading", "Priorizar Auto Loader, Lakeflow Connect, conectores partner u otros métodos según volumen, frecuencia, tipo de dato y gobierno.", ["m08", "m09"]),
  objective("a-ingest-semi", "Associate", "Data Ingestion and Loading", "Ingerir datos semiestructurados y anidados en tablas Delta gobernadas.", ["m04", "m08", "m09"]),
  objective("a-transform-clean", "Associate", "Data Transformation and Modeling", "Limpiar bronze con PySpark o SQL y publicar datasets silver fiables.", ["m04", "m07"]),
  objective("a-transform-joins", "Associate", "Data Transformation and Modeling", "Combinar DataFrames con joins, unions y claves múltiples.", ["m04", "m05"]),
  objective("a-transform-structure", "Associate", "Data Transformation and Modeling", "Manipular columnas, filas, arrays, maps y structs.", ["m04"]),
  objective("a-transform-aggregate", "Associate", "Data Transformation and Modeling", "Deduplicar y calcular agregaciones y métricas con DataFrames.", ["m04", "m07"]),
  objective("a-transform-tuning", "Associate", "Data Transformation and Modeling", "Interpretar parámetros básicos de paralelismo, memoria y broadcast y volver a medir.", ["m05", "m23"]),
  objective("a-transform-gold", "Associate", "Data Transformation and Modeling", "Elegir vistas, materialized views, streaming tables y tablas Gold.", ["m07", "m18"]),
  objective("a-transform-quality", "Associate", "Data Transformation and Modeling", "Aplicar validaciones de calidad en Silver y Gold.", ["m07", "m19"]),
  objective("a-jobs-control", "Associate", "Working with Lakeflow Jobs", "Implementar retries, branching y looping en Lakeflow Jobs.", ["m10", "m20"]),
  objective("a-jobs-tasks", "Associate", "Working with Lakeflow Jobs", "Configurar tareas notebook, SQL, dashboard y pipeline y sus dependencias.", ["m10"]),
  objective("a-jobs-triggers", "Associate", "Working with Lakeflow Jobs", "Elegir schedules, file arrival y table update triggers.", ["m10", "m21"]),
  objective("a-jobs-trigger-choice", "Associate", "Working with Lakeflow Jobs", "Elegir entre disparadores temporales y dirigidos por datos según disponibilidad y dependencias.", ["m10", "m21"]),
  objective("a-cicd-git", "Associate", "Implementing CI/CD", "Gestionar ramas, commits, pushes y pull requests con Git folders.", ["m03", "m11"]),
  objective("a-cicd-config", "Associate", "Implementing CI/CD", "Promocionar configuración por entorno con variables y overrides.", ["m11", "m29"]),
  objective("a-cicd-bundles", "Associate", "Implementing CI/CD", "Validar y desplegar Declarative Automation Bundles con CLI.", ["m11", "m29"]),
  objective("a-cicd-cli", "Associate", "Implementing CI/CD", "Usar Databricks CLI para validar, desplegar y gestionar Bundles y activos de workspace en CI/CD.", ["m11", "m29"]),
  objective("a-monitor-history", "Associate", "Troubleshooting, Monitoring, and Optimization", "Detectar tendencias con historial de runs y métricas de ejecución.", ["m10", "m26"]),
  objective("a-monitor-ui", "Associate", "Troubleshooting, Monitoring, and Optimization", "Interpretar DAGs, estados, runtimes y bloqueos en Lakeflow Jobs.", ["m10", "m21", "m26"]),
  objective("a-monitor-spark", "Associate", "Troubleshooting, Monitoring, and Optimization", "Diagnosticar skew, shuffle y spill con Spark UI.", ["m05", "m23", "m26"]),
  objective("a-optimize-delta", "Associate", "Troubleshooting, Monitoring, and Optimization", "Explicar liquid clustering y predictive optimization.", ["m24"]),
  objective("a-troubleshoot-compute", "Associate", "Troubleshooting, Monitoring, and Optimization", "Diagnosticar fallos de arranque, librerías y out-of-memory.", ["m02", "m05", "m26"]),
  objective("a-govern-tables", "Associate", "Governance and Security", "Diferenciar y operar tablas managed y external.", ["m06", "m11"]),
  objective("a-govern-grants", "Associate", "Governance and Security", "Aplicar GRANT, REVOKE y DENY en la jerarquía adecuada.", ["m11", "m30"]),
  objective("a-govern-masks", "Associate", "Governance and Security", "Configurar column masks y row-level security según grupos de usuarios.", ["m30"]),
  objective("a-govern-abac", "Associate", "Governance and Security", "Aplicar políticas ABAC de Unity Catalog para centralizar filtros de fila y máscaras de columna.", ["m30"]),

  objective("p-code-project", "Professional", "Developing Code", "Diseñar proyectos Python modulares preparados para Bundles y CI/CD.", ["m28", "m29"]),
  objective("p-code-deps", "Professional", "Developing Code", "Gestionar y resolver dependencias PyPI, wheels y source archives.", ["m28"]),
  objective("p-code-udf", "Professional", "Developing Code", "Elegir y desarrollar UDF de Python y Pandas UDF.", ["m23", "m28"]),
  objective("p-code-pipelines", "Professional", "Developing Code", "Construir pipelines batch y streaming productivos con Lakeflow y Auto Loader.", ["m09", "m13", "m18"]),
  objective("p-code-jobs", "Professional", "Developing Code", "Crear y automatizar cargas ETL con Lakeflow Jobs mediante UI, API y CLI.", ["m10", "m20", "m29"]),
  objective("p-code-table-types", "Professional", "Developing Code", "Comparar ventajas y limitaciones de streaming tables y materialized views.", ["m18"]),
  objective("p-code-cdc", "Professional", "Developing Code", "Implementar CDC con AUTO CDC/APPLY CHANGES.", ["m16", "m18"]),
  objective("p-code-approach", "Professional", "Developing Code", "Comparar Structured Streaming y Lakeflow Declarative Pipelines para elegir el enfoque ETL escalable.", ["m13", "m18"]),
  objective("p-code-control", "Professional", "Developing Code", "Crear componentes de pipeline con operadores de control flow.", ["m20"]),
  objective("p-code-config", "Professional", "Developing Code", "Elegir configuración de entorno, dependencias, memoria y optimización para las tareas.", ["m20", "m25", "m29"]),
  objective("p-code-tests", "Professional", "Developing Code", "Crear pruebas unitarias e integración de datos y esquemas.", ["m28"]),
  objective("p-ingest-formats", "Professional", "Data Ingestion & Acquisition", "Diseñar ingesta de formatos estructurados, semiestructurados y binarios.", ["m08", "m09", "m15"]),
  objective("p-ingest-append", "Professional", "Data Ingestion & Acquisition", "Crear pipelines append-only para batch y streaming.", ["m13", "m18"]),
  objective("p-quality-transform", "Professional", "Transformation, Cleansing, and Quality", "Aplicar ventanas, joins y agregaciones avanzadas con Spark SQL y PySpark.", ["m04", "m14", "m23"]),
  objective("p-quality-quarantine", "Professional", "Transformation, Cleansing, and Quality", "Implementar expectations y cuarentena para datos inválidos.", ["m19"]),
  objective("p-share", "Professional", "Sharing and Federation", "Configurar Databricks-to-Databricks y open sharing con gobierno.", ["m31"]),
  objective("p-federation", "Professional", "Sharing and Federation", "Configurar Lakehouse Federation y decidir entre federar, compartir o ingerir.", ["m31"]),
  objective("p-share-live", "Professional", "Sharing and Federation", "Usar Delta Sharing para compartir datos vivos del Lakehouse con cualquier plataforma compatible.", ["m31"]),
  objective("p-monitor-system", "Professional", "Monitoring and Alerting", "Usar system tables para coste, auditoría y observabilidad de workloads.", ["m25", "m26"]),
  objective("p-monitor-ui", "Professional", "Monitoring and Alerting", "Usar Query Profile y Spark UI para monitorizar workloads.", ["m23", "m26"]),
  objective("p-monitor-api", "Professional", "Monitoring and Alerting", "Monitorizar Jobs y pipelines con Databricks REST API y CLI.", ["m21", "m26", "m29"]),
  objective("p-monitor-events", "Professional", "Monitoring and Alerting", "Usar event logs de Lakeflow Declarative Pipelines para monitorización.", ["m19", "m26"]),
  objective("p-alert-sql", "Professional", "Monitoring and Alerting", "Usar SQL Alerts para monitorizar calidad de datos.", ["m19", "m26"]),
  objective("p-alert-jobs", "Professional", "Monitoring and Alerting", "Configurar notificaciones de estado y rendimiento con Workflows UI y Jobs API.", ["m21", "m26"]),
  objective("p-optimize-managed", "Professional", "Cost & Performance Optimisation", "Reducir operación mediante tablas managed y automatización de mantenimiento.", ["m24", "m25"]),
  objective("p-optimize-delta", "Professional", "Cost & Performance Optimisation", "Aplicar deletion vectors y liquid clustering.", ["m24"]),
  objective("p-optimize-query", "Professional", "Cost & Performance Optimisation", "Aplicar data skipping, file pruning y otras optimizaciones para grandes datasets.", ["m23", "m24"]),
  objective("p-optimize-cdf", "Professional", "Cost & Performance Optimisation", "Usar Change Data Feed para cambios incrementales y latencia.", ["m16", "m24"]),
  objective("p-optimize-profile", "Professional", "Cost & Performance Optimisation", "Localizar joins ineficientes, shuffles y skipping deficiente con Query Profile.", ["m23", "m26"]),
  objective("p-security-acl", "Professional", "Security and Compliance", "Aplicar mínimo privilegio en objetos de workspace y securables.", ["m30"]),
  objective("p-security-mask", "Professional", "Security and Compliance", "Aplicar row filters y column masks a datos sensibles.", ["m30"]),
  objective("p-security-anonymize", "Professional", "Security and Compliance", "Aplicar hashing, tokenización, supresión y generalización a datos confidenciales.", ["m30"]),
  objective("p-security-pii", "Professional", "Security and Compliance", "Implementar pipelines batch y streaming que detecten y enmascaren PII.", ["m30"]),
  objective("p-security-retention", "Professional", "Security and Compliance", "Desarrollar una solución de purga conforme a políticas de retención.", ["m30"]),
  objective("p-govern-metadata", "Professional", "Data Governance", "Publicar metadatos y descripciones que mejoren descubrimiento y ownership.", ["m11", "m30"]),
  objective("p-govern-inheritance", "Professional", "Data Governance", "Razonar sobre herencia de permisos de Unity Catalog.", ["m11", "m30"]),
  objective("p-debug-diagnostics", "Professional", "Debugging and Deploying", "Recopilar diagnósticos en Spark UI, logs, system tables y Query Profile.", ["m23", "m26"]),
  objective("p-debug-repair", "Professional", "Debugging and Deploying", "Reparar runs fallidos y aplicar parameter overrides.", ["m20", "m21"]),
  objective("p-debug-pipelines", "Professional", "Debugging and Deploying", "Depurar Lakeflow Declarative Pipelines y pipelines Spark con event logs y Spark UI.", ["m18", "m26"]),
  objective("p-deploy-bundles", "Professional", "Debugging and Deploying", "Desplegar recursos con Bundles y flujos Git de CI/CD.", ["m29"]),
  objective("p-deploy-git", "Professional", "Debugging and Deploying", "Integrar Git-based CI/CD y Databricks Git Folders para desplegar notebooks y código.", ["m11", "m29"]),
  objective("p-model-delta", "Professional", "Data Modelling", "Diseñar modelos escalables sobre Delta Lake.", ["m06", "m07"]),
  objective("p-model-liquid", "Professional", "Data Modelling", "Simplificar decisiones de layout y optimizar consultas con liquid clustering.", ["m24"]),
  objective("p-model-layout", "Professional", "Data Modelling", "Explicar beneficios de liquid clustering frente a particionado y Z-Ordering.", ["m24"]),
  objective("p-model-dimensional", "Professional", "Data Modelling", "Diseñar modelos dimensionales eficientes para analítica.", ["m07"]),
];

export function coverageFor(level: CertificationLevel) {
  const items = blueprintObjectives.filter((item) => item.level === level);
  const percentage = (predicate: (item: BlueprintObjective) => boolean) =>
    Math.round((items.filter(predicate).length / Math.max(1, items.length)) * 100);
  return {
    total: percentage((item) => item.moduleIds.length > 0),
    theory: percentage((item) => item.theory),
    practice: percentage((item) => item.practice),
    assessment: percentage((item) => item.assessment),
    reproduced: percentage((item) => item.reproduced),
    counts: {
      total: items.length,
      mapped: items.filter((item) => item.moduleIds.length > 0).length,
      explained: items.filter((item) => item.theory).length,
      practiced: items.filter((item) => item.practice).length,
      assessed: items.filter((item) => item.assessment).length,
      reproduced: items.filter((item) => item.reproduced).length,
    },
  };
}

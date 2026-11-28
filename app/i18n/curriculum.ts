import { canonicalQuestionOptions, type CurriculumModule, type Lesson, type QuizQuestion } from "../course-data";
import { glossaryCategoryLabels, glossaryCategoryLabelsEn, type GlossaryCategory, type GlossaryEntry } from "../curriculum/glossary";
import type { CommunityResourceCatalogEntry, ModuleSummary } from "../enterprise/contracts";
import type { Locale } from "./config";
import { localizeReviewDate } from "./dates";
import { englishLabContentFor } from "./english-lab-content";
import { englishLessonContentFor } from "./english-lesson-content";
import { englishQuizContent } from "./english-quiz-content";
import { lessonEssentialsFor } from "../curriculum/lesson-essentials";

type ModuleCopy = {
  title: string;
  short: string;
  description: string;
  outcomes: string[];
};

type LessonTitleSet = [string, string, string, string, string];

export const trackCopy: Record<Locale, Record<string, { name: string; description: string }>> = {
  es: {},
  en: {
    core: { name: "Core foundation", description: "The complete base for mastering the Associate blueprint." },
    streaming: { name: "Streaming and CDC", description: "State, events, late data, and real-time changes." },
    pipelines: { name: "Pipelines and orchestration", description: "Declarative pipelines, quality, and DAG operations." },
    performance: { name: "Performance and FinOps", description: "Tuning, observability, reliability, and cost." },
    delivery: { name: "Delivery and governance", description: "Testing, CI/CD, security, and interoperability." },
    final: { name: "Professional convergence", description: "Final project and Professional practice exam." },
  },
};

export const moduleCopyEn: Record<string, ModuleCopy> = {
  m01: { title: "Data Intelligence Platform and lakehouse architecture", short: "Platform", description: "Build a precise mental model of storage, compute, governance, and work surfaces.", outcomes: ["Explain the separation between storage and compute", "Connect Delta Lake, Unity Catalog, and execution engines", "Choose the right surface for each workload"] },
  m02: { title: "Classic compute, serverless, and SQL warehouses", short: "Compute", description: "Select resources by workload pattern, isolation, latency, governance, and total cost.", outcomes: ["Compare serverless, classic compute, and SQL warehouses", "Size resources without overprovisioning", "Apply auto-stop, policies, and performance modes"] },
  m03: { title: "Notebooks, SQL, Python, and PySpark in the workspace", short: "Development", description: "Work with notebooks and files as maintainable, reproducible, parameterized code.", outcomes: ["Match SQL, Python, and PySpark to workloads", "Manage parameters and dependencies", "Avoid hidden state in notebooks"] },
  m04: { title: "DataFrames, transformations, and complex data", short: "DataFrames", description: "Master real ETL operations: joins, arrays, structs, windows, and deduplication.", outcomes: ["Transform columns and rows with native functions", "Manipulate arrays, maps, and structs", "Combine and deduplicate datasets deterministically"] },
  m05: { title: "Catalyst, partitions, joins, and shuffles", short: "Spark", description: "Reason about logical and physical plans before changing settings or adding compute.", outcomes: ["Read explain formatted output", "Detect Exchange, skew, and spill", "Choose broadcast, repartition, or coalesce with evidence"] },
  m06: { title: "Delta Lake: ACID, schema, history, and DML", short: "Delta", description: "Use the transaction log to build reliable, auditable, idempotent tables.", outcomes: ["Explain snapshots and optimistic concurrency", "Apply MERGE, UPDATE, and DELETE correctly", "Differentiate table types, conversion, schema evolution, and time travel"] },
  m07: { title: "Medallion architecture, quality, and modeling", short: "Modeling", description: "Design layers and contracts from consumption, traceability, and rerun needs.", outcomes: ["Assign responsibilities to bronze, silver, and gold", "Design facts, dimensions, and SCD", "Define quality controls at each boundary"] },
  m08: { title: "Batch ingestion, formats, COPY INTO, JDBC, and REST", short: "Batch ingestion", description: "Choose a reproducible entry path for files, databases, and APIs.", outcomes: ["Compare full and incremental loads", "Use COPY INTO idempotently", "Control formats, compression, and source metadata"] },
  m09: { title: "Auto Loader and Lakeflow Connect", short: "Managed ingestion", description: "Choose between file discovery, managed connectors, and integration alternatives.", outcomes: ["Configure schemaLocation and checkpointLocation", "Handle evolution and rescued data", "Choose Lakeflow Connect, Auto Loader, or partner connectors"] },
  m10: { title: "Lakeflow Jobs: DAGs, tasks, and triggers", short: "Jobs", description: "Turn manual runs into parameterized, idempotent, observable workflows.", outcomes: ["Design a DAG with safe parallelism", "Configure tasks, parameters, and dependencies", "Choose time-based or data-driven triggers"] },
  m11: { title: "Unity Catalog, Git folders, and essential CI/CD", short: "Governance and CI/CD", description: "Connect data governance with reviewable code delivery across environments.", outcomes: ["Apply namespaces and least privilege", "Differentiate managed, external, volumes, and credentials", "Promote the same code with environment variables"] },
  m12: { title: "Associate project and 45-question practice exam", short: "Associate milestone", description: "Deliver the first integrated project and measure Associate readiness.", outcomes: ["Define verifiable acceptance criteria", "Integrate ingestion, transformation, governance, and consumption", "Review by domain using scenario-based decisions"] },
  m13: { title: "Structured Streaming fundamentals", short: "Streaming", description: "Understand streaming queries, triggers, checkpoints, and bounded state.", outcomes: ["Separate streaming semantics from batch habits", "Choose triggers and output modes", "Protect recovery with checkpoints"] },
  m14: { title: "State, windows, watermarks, and late data", short: "State", description: "Design stateful processing with explicit time, memory, and correctness tradeoffs.", outcomes: ["Use event time and watermarks", "Reason about windows and late arrivals", "Control state growth"] },
  m15: { title: "Kafka, event buses, and delivery guarantees", short: "Events", description: "Connect event sources while preserving offsets, schema, and replay strategy.", outcomes: ["Compare event ingestion patterns", "Handle offsets and failures", "Document delivery guarantees"] },
  m16: { title: "Change Data Feed, CDC, AUTO CDC, and SCD", short: "CDC", description: "Propagate inserts, updates, and deletes into reliable downstream tables.", outcomes: ["Use Delta Change Data Feed", "Model CDC and SCD requirements", "Handle deletes and ordering"] },
  m17: { title: "Streaming SLA project", short: "Streaming SLA", description: "Build and operate a streaming pipeline with latency and recovery evidence.", outcomes: ["Define measurable freshness", "Prove recovery behavior", "Operate under late-data constraints"] },
  m18: { title: "Spark Declarative Pipelines in Lakeflow", short: "Declarative", description: "Express datasets and dependencies declaratively instead of hand-rolled orchestration.", outcomes: ["Define tables and views declaratively", "Trace dependencies", "Choose pipeline boundaries"] },
  m19: { title: "Expectations, quarantine, and event logs", short: "Quality", description: "Make data quality visible and operational through rules, actions, and logs.", outcomes: ["Choose expectation actions", "Design quarantine paths", "Read event-log evidence"] },
  m20: { title: "Advanced Lakeflow Jobs, control flow, and repairs", short: "Repairs", description: "Operate complex workflows with conditional paths, retries, and selective recovery.", outcomes: ["Use control-flow tasks", "Repair failed subsets", "Pass safe task values"] },
  m21: { title: "Triggers, alerts, backfills, and operations", short: "Operations", description: "Turn workflow execution into recoverable, observable daily operations.", outcomes: ["Choose schedules and file triggers", "Design actionable alerts", "Plan backfills safely"] },
  m22: { title: "Declarative pipeline project", short: "Pipeline project", description: "Deliver a governed pipeline with quality, operations, and evidence.", outcomes: ["Design the pipeline graph", "Encode quality gates", "Produce operational evidence"] },
  m23: { title: "Advanced Spark tuning", short: "Spark tuning", description: "Diagnose and improve Spark workloads using evidence from plans and metrics.", outcomes: ["Identify skew and spill", "Tune joins and partitions", "Validate improvements"] },
  m24: { title: "Photon, data skipping, and liquid clustering", short: "Delta tuning", description: "Improve Delta performance through engine, statistics, and layout decisions.", outcomes: ["Use Photon where compatible", "Reason about data skipping", "Apply liquid clustering appropriately"] },
  m25: { title: "Compute, policies, tags, and costs", short: "FinOps", description: "Attribute consumption, enforce guardrails, and optimize cost without losing workload value.", outcomes: ["Query costs with system tables", "Tag and attribute usage", "Choose serverless modes and policies"] },
  m26: { title: "Spark UI, Query Profile, and system tables", short: "Observability", description: "Combine execution, platform, and data signals to reduce diagnosis time.", outcomes: ["Find bottlenecks in Spark UI and Query Profile", "Query Jobs and audit history", "Automate diagnostics with CLI and REST"] },
  m27: { title: "Reliability and cost project", short: "FinOps project", description: "Recover a degraded workload while balancing SLA, capacity, layout, code, and budget.", outcomes: ["Resolve an incident methodically", "Prove improvement with metrics", "Define prevention and alerts"] },
  m28: { title: "Python projects, dependencies, and tests", short: "Code quality", description: "Turn notebooks into a testable package with clear boundaries and reproducible environments.", outcomes: ["Design a modular Python package", "Manage wheels and dependencies", "Test DataFrames and contracts"] },
  m29: { title: "Declarative Automation Bundles and CI/CD", short: "CI/CD", description: "Define resources as code and promote one validated artifact across targets.", outcomes: ["Structure a complete bundle", "Validate and deploy with the CLI", "Integrate service identity and Git pipelines"] },
  m30: { title: "Advanced Unity Catalog and privacy", short: "Security", description: "Apply centralized controls to sensitive data and prove compliance through audit evidence.", outcomes: ["Design inheritance and ownership", "Apply row filters, masks, and ABAC", "Implement retention, anonymization, and purge"] },
  m31: { title: "OpenSharing and Federation", short: "Interoperability", description: "Share or query external data with minimum movement and a governed perimeter.", outcomes: ["Compare Databricks-to-Databricks and Databricks-to-Open", "Configure federation with pushdown", "Choose sharing, federation, or ingestion"] },
  m32: { title: "Professional project and 59-question practice exam", short: "Professional milestone", description: "Converge all branches into a production-grade solution and measure final readiness.", outcomes: ["Design and defend a complete platform", "Respond to failures, costs, and compliance", "Complete an original Professional practice exam"] },
};

const lessonTitlesEn: Record<string, LessonTitleSet> = {
  m01: ["Lake, warehouse, and lakehouse without oversimplifying", "Control plane and data plane", "Object storage and open formats", "Workspace, metastore, and compute resources", "End-to-end reference architecture"],
  m02: ["Serverless versus classic compute", "All-purpose compute, jobs compute, and SQL warehouses", "Autoscaling, auto-stop, and pools", "Access modes and workload isolation", "DBUs, startup latency, and cost"],
  m03: ["Workspace notebooks and files", "SQL versus PySpark", "Widgets and task parameters", "Libraries and reproducible environments", "Collaboration, review, and modularity"],
  m04: ["Transformations and actions", "Select, filter, and withColumn", "Joins, unions, and composite keys", "Explode, arrays, maps, and structs", "Windows, aggregations, and deduplication"],
  m05: ["Lazy evaluation and the Spark DAG", "Catalyst and query optimization", "Partitions and parallelism", "Shuffles, skew, and spill", "Join strategies and broadcast"],
  m06: ["Transaction log and ACID properties", "Managed tables, external tables, and SET MANAGED", "Schema enforcement and evolution", "MERGE and idempotency", "History, time travel, and VACUUM"],
  m07: ["Medallion as a pattern, not dogma", "Bronze and source traceability", "Silver, conformance, and quality", "Gold, facts, and dimensions", "Contracts, SLOs, and ownership"],
  m08: ["Ingestion pattern matrix", "CSV, JSON, Parquet, Avro, ORC, and binary files", "COPY INTO and file history", "JDBC, ODBC, and REST ingestion", "Metadata, errors, and quarantine"],
  m09: ["Auto Loader and cloudFiles", "Directory listing and file notification", "Schema inference, hints, and evolution", "Standard and managed Lakeflow Connect", "Decision matrix by volume, freshness, and governance"],
  m10: ["Jobs, runs, and task graphs", "Notebook, Python, SQL, and pipeline tasks", "Parameters and task values", "Schedule, file arrival, and table update triggers", "Retries, timeouts, and notifications"],
  m11: ["Metastore, catalog, schema, and object", "Privileges, inheritance, and service principals", "External locations, volumes, and storage credentials", "Git folders and branch workflow", "Bundles, targets, and environment variables"],
  m12: ["Brief and acceptance criteria", "Initial architecture and security", "Building the Associate pipeline", "Testing, operations, and documentation", "Retrospective and Associate practice exam"],
  m13: ["Structured Streaming's incremental model", "Sources, sinks, and output modes", "availableNow and processingTime triggers", "Offsets, commits, and checkpoints", "Recovery and compatible changes"],
  m14: ["Event time versus processing time", "Tumbling and sliding windows", "Watermarks and finalization", "Stateful deduplication", "State store metrics and memory pressure"],
  m15: ["Kafka topics, partitions, and consumer offsets", "Key, value, headers, and timestamps", "Authentication and secrets", "Practical at-least-once and exactly-once behavior", "Backpressure, lag, and capacity"],
  m16: ["CDC, CDF, and their differences", "Change types and commit versions", "Keys and sequence_by", "AUTO CDC and the former APPLY CHANGES pattern", "SCD type 1, SCD type 2, and deletes"],
  m17: ["Defining the streaming SLA", "Events and partition design", "State, CDC, and quality", "Observability and alerts", "Game day and recovery"],
  m18: ["Spark Declarative Pipelines and Lakeflow", "Declarative model and graph", "Streaming tables and materialized views", "Python and SQL in pipelines", "Serverless and execution modes"],
  m19: ["Quality dimensions and contracts", "EXPECT and observation", "EXPECT OR DROP", "EXPECT OR FAIL", "Quarantine pattern and event log"],
  m20: ["If/else tasks", "For each tasks", "Run job and modularity", "Job repairs and parameter overrides", "Concurrency and queueing"],
  m21: ["Schedules and time zones", "File arrival and table update triggers", "Continuous and triggered pipelines", "Backfills and processing windows", "Alerts, webhooks, and ownership"],
  m22: ["Pipeline architecture", "Declarative implementation", "Expectations and quarantine", "Wrapper job and deployment", "Operational testing"],
  m23: ["Physical plans and stage metrics", "Skew and adaptive query execution", "Broadcast and sort merge joins", "Shuffle partitions and file sizing", "UDFs, Pandas UDFs, and serialization"],
  m24: ["Photon and vectorized execution", "Statistics and data skipping", "Partitioning and its limits", "Liquid clustering", "Deletion vectors and predictive optimization"],
  m25: ["DBUs, SKUs, and cloud cost", "system.billing.usage", "Tags and chargeback", "Compute policies and budgets", "Standard versus performance optimized"],
  m26: ["Spark UI: jobs, stages, and executors", "Query Profile and operators", "Workflow system tables", "Event logs and cluster logs", "CLI, REST APIs, and automation"],
  m27: ["Triage and severity", "Hypotheses and evidence", "Code and layout correction", "Right-sizing and cost", "Postmortem and preventive actions"],
  m28: ["src layout and I/O separation", "Wheels, PyPI, and pinned versions", "Pure transform functions", "assertDataFrameEqual and assertSchemaEqual", "Unit, integration, and smoke tests"],
  m29: ["Bundle configuration and includes", "Resources: jobs and pipelines", "Variables, substitutions, and targets", "validate, deploy, and run", "CI/CD, service principals, and approvals"],
  m30: ["Privilege model and inheritance", "Workspace ACLs and securables", "Row filters and column masks", "ABAC and centralized policies", "PII, tokenization, retention, and audit"],
  m31: ["OpenSharing, shares, and recipients", "Databricks-to-Databricks sharing", "Databricks-to-Open and OIDC", "Lakehouse Federation and connections", "Choosing between sharing, federation, and copying"],
  m32: ["Brief, NFRs, and architecture", "Batch and streaming pipeline", "Security, interoperability, and CI/CD", "Game day, FinOps, and postmortem", "Technical defense and Professional practice exam"],
};

export { localizeReviewDate };

const exactTextEn: Record<string, string> = {
  "Responde las cuatro preguntas. Necesitas al menos un 75 %.": "Answer the four questions. You need at least 75%.",
  "Completa todas las preguntas. El resultado de referencia es el 80 %.": "Complete all questions. The reference score is 80%.",
};

/** Traduce textos de interfaz generados en servidor; si falta la traducción conserva el original. */
export function localizeText(value: string, locale: Locale): string {
  if (locale === "es") return value;
  return exactTextEn[value] ?? value;
}

const domainSegmentsEn: Record<string, string> = {
  "Todos los dominios Associate": "All Associate domains",
  "Todos los dominios Professional": "All Professional domains",
  "Arquitectura": "Architecture",
  "Extensión profesional": "Professional extension",
  "orden y deduplicación": "ordering and deduplication",
  "cuarentena": "quarantine",
  "recuperación": "recovery",
  "garantías end-to-end": "end-to-end guarantees",
  "offsets y checkpoints": "offsets and checkpoints",
  "rendimiento": "performance",
  "trazabilidad": "traceability",
  "concurrencia": "concurrency",
  "parámetros y task values": "parameters and task values",
  "Spark Declarative Pipelines en Lakeflow": "Spark Declarative Pipelines in Lakeflow",
  "despliegue": "deployment",
  "modelo declarativo": "declarative model",
  "capacidad": "capacity",
  "deduplicación": "deduplication",
  "estado": "state",
  "garantías de entrega": "delivery guarantees",
  "monitorización": "monitoring",
  "acceso de motores externos": "external engine access",
  "capa semántica": "semantic layer",
  "certificación de activos": "asset certification",
  "datos semiestructurados": "semi-structured data",
  "observabilidad de datos": "data observability",
  "flows y sinks": "flows and sinks",
  "motor directo de Bundles": "Bundles direct engine",
};

function englishDomain(domain: string): string {
  return domain.split(" · ").map((segment) => domainSegmentsEn[segment] ?? segment).join(" · ");
}

const questionLabelsEn: Record<string, string> = {
  "Original del curso": "Original course item",
  "Sintética · ampliada desde muestra oficial": "Synthetic · expanded from an official sample",
  "Contexto, valores y distractores nuevos; se conserva únicamente el objetivo técnico de la muestra retirada.": "New context, values and distractors; only the technical objective of the retired sample is kept.",
  "Databricks · ABAC frente a filtros y máscaras de tabla": "Databricks · ABAC versus table filters and masks",
  "Databricks · APIs AUTO CDC": "Databricks · AUTO CDC APIs",
  "Databricks · conceptos ABAC de Unity Catalog": "Databricks · Unity Catalog ABAC concepts",
  "Databricks · diagnóstico de skew y spill en Spark UI": "Databricks · diagnosing skew and spill in the Spark UI",
  "Databricks · monitorizar coste y rendimiento de Jobs": "Databricks · monitoring Jobs cost and performance",
  "Databricks · query federation frente a Lakeflow Connect": "Databricks · query federation versus Lakeflow Connect",
  "Databricks · schedules y triggers de Lakeflow Jobs": "Databricks · Lakeflow Jobs schedules and triggers",
};

function englishQuestionLabel(value: string | undefined) {
  if (!value) return value;
  const retiredSample = /^Guía oficial (Associate|Professional) · muestra retirada (\d+)$/u.exec(value);
  if (retiredSample) return `Official ${retiredSample[1]} guide · retired sample ${retiredSample[2]}`;
  return questionLabelsEn[value] ?? value;
}

function englishLessonTitle(lesson: Lesson, moduleId: string, index: number) {
  return lessonTitlesEn[moduleId]?.[index] ?? lesson.title;
}

const labTextEn: Record<string, string> = {
  "La práctica completa requiere capacidades de cuenta de pago. Incluye una simulación reducida para conservar el objetivo didáctico.": "The full practice requires paid-account capabilities. A reduced simulation is included to preserve the learning objective.",
  "Compatible con Free Edition dentro de sus cuotas diarias y límites de serverless.": "Compatible with Free Edition within its daily quotas and serverless limits.",
  "Serverless administrado por Databricks": "Databricks-managed serverless",
  "Free Edition para la simulación o workspace de pago para la práctica completa": "Free Edition for the simulation or a paid workspace for the full practice",
  "Workspace de Databricks Free Edition": "Databricks Free Edition workspace",
  "Permiso para crear objetos en un catálogo de aprendizaje": "Permission to create objects in a learning catalog",
  "Dataset de práctica sin información sensible": "Practice dataset without sensitive information",
  "Workspace Databricks de pago; Free Edition solo para la simulación reducida": "Paid Databricks workspace; Free Edition only for the reduced simulation",
  "Databricks Free Edition o workspace empresarial aislado": "Databricks Free Edition or an isolated enterprise workspace",
  "Compute clásico · DBR 17.3 LTS / Spark 4.0": "Classic compute · DBR 17.3 LTS / Spark 4.0",
  "SQL warehouse serverless; alternativa clásica documentada": "Serverless SQL warehouse; documented classic alternative",
  "USE CATALOG sobre el catálogo de aprendizaje": "USE CATALOG on the learning catalog",
  "USE SCHEMA y CREATE TABLE sobre el esquema aislado del laboratorio": "USE SCHEMA and CREATE TABLE on the isolated lab schema",
  "CAN USE sobre el SQL warehouse asignado": "CAN USE on the assigned SQL warehouse",
  "CAN ATTACH TO sobre el compute clásico asignado; no se requiere permiso de creación": "CAN ATTACH TO on the assigned classic compute; no create permission is required",
  "Se genera con el código inicial del laboratorio; no requiere credenciales, descargas privadas ni datos personales.": "Generated by the lab's starter code; no credentials, private downloads or personal data are required.",
  "Procedimiento especificado y autocomprobado; ejecución independiente documentada todavía pendiente.": "Procedure specified and self-checked; a documented independent run is still pending.",
  "0 USD · sujeto a fair use y cuotas diarias": "0 USD · subject to fair use and daily quotas",
  "Detén Jobs, pipelines o streams creados para la práctica.": "Stop any Jobs, pipelines or streams created for the practice.",
  "Elimina checkpoints, volúmenes y recursos cloud temporales identificados con el prefijo del laboratorio.": "Delete checkpoints, volumes and temporary cloud resources identified with the lab prefix.",
  "El objeto no se encuentra": "Object not found",
  "Comprueba catálogo, esquema, USE CATALOG/SCHEMA y el nombre de tres niveles.": "Check the catalog, schema, USE CATALOG/SCHEMA and the three-level name.",
  "Permiso denegado": "Permission denied",
  "Verifica USE CATALOG, USE SCHEMA y el privilegio mínimo sobre el objeto.": "Verify USE CATALOG, USE SCHEMA and the minimum privilege on the object.",
  "La salida no coincide": "Output does not match",
  "Reinicia desde el cleanup, valida el input y vuelve a ejecutar los pasos en orden.": "Restart from cleanup, validate the input and run the steps again in order.",
};

/** Traduce los metadatos plantilla de un laboratorio; los literales SQL o técnicos se conservan. */
function englishLabText(value: string): string {
  if (labTextEn[value]) return labTextEn[value];
  const dataset = /^Dataset sintético (\S+)$/u.exec(value);
  if (dataset) return `Synthetic dataset ${dataset[1]}`;
  const assumptions = /^Precios consultados el (.+)\. Una ejecución, tamaño mínimo compatible y duración indicada; sin impuestos, descuentos ni transferencia de datos\.$/u.exec(value);
  if (assumptions) return `Prices checked on ${localizeReviewDate(assumptions[1], "en")}. One run, the minimum compatible size and the stated duration; excluding taxes, discounts and data transfer.`;
  return value;
}

function englishUsdRange(value: string) {
  return value.replace(/(\d),(\d)/gu, "$1.$2");
}

function englishLab(module: CurriculumModule): CurriculumModule["lab"] {
  const lab = module.lab;
  const copy = englishLabContentFor(module.id);
  if (copy.steps.length !== lab.steps.length || copy.checkLabels.length !== lab.checks.length || copy.expectedEvidence.length !== lab.expectedEvidence.length) {
    throw new Error(`English lab overlay for ${module.id} does not match the canonical structure`);
  }
  return {
    ...lab,
    title: copy.title,
    goal: copy.goal,
    scenario: copy.scenario,
    steps: [...copy.steps],
    expectedEvidence: [...copy.expectedEvidence],
    deliberateFailure: { ...copy.deliberateFailure },
    checks: lab.checks.map((check, index) => ({ ...check, label: copy.checkLabels[index] })),
    cloudNotes: lab.cloudNotes.map((item) => ({ ...item, note: copy.cloudNotes[item.cloud] })),
    reviewedAt: localizeReviewDate(lab.reviewedAt, "en") ?? lab.reviewedAt,
    freeEdition: { ...lab.freeEdition, note: englishLabText(lab.freeEdition.note) },
    runtime: { free: englishLabText(lab.runtime.free), classic: englishLabText(lab.runtime.classic) },
    prerequisites: lab.prerequisites.map(englishLabText),
    environment: englishLabText(lab.environment),
    compute: englishLabText(lab.compute),
    permissions: lab.permissions.map(englishLabText),
    dataset: { name: englishLabText(lab.dataset.name), acquisition: englishLabText(lab.dataset.acquisition) },
    reproducibility: { ...lab.reproducibility, note: englishLabText(lab.reproducibility.note) },
    estimatedCost: {
      free: englishLabText(lab.estimatedCost.free),
      paid: Object.fromEntries(Object.entries(lab.estimatedCost.paid).map(([cloud, range]) => [cloud, englishUsdRange(range)])) as typeof lab.estimatedCost.paid,
      assumptions: englishLabText(lab.estimatedCost.assumptions),
    },
    expectedOutcome: copy.expectedEvidence.join(" · "),
    cleanup: lab.cleanup.map(englishLabText),
    troubleshooting: lab.troubleshooting.map((item) => ({ symptom: englishLabText(item.symptom), fix: englishLabText(item.fix) })),
  };
}

export function localizeModuleSummary(summary: ModuleSummary, locale: Locale): ModuleSummary {
  if (locale === "es") return summary;
  const copy = moduleCopyEn[summary.id];
  if (!copy) return summary;
  return {
    ...summary,
    title: copy.title,
    short: copy.short,
    description: copy.description,
    phase: trackCopy.en[summary.phaseId]?.name ?? summary.phase,
    artwork: {
      ...summary.artwork,
      label: copy.short,
      alt: `Editorial illustration for module ${summary.number}: ${copy.title}.`,
    },
  };
}

const sourceTextEn: Record<string, string> = {
  "Multinube": "Multicloud",
  "Documentación vigente en agosto de 2026": "Documentation current as of August 2026",
  "Arquitectura de referencia 2026": "Reference architecture 2026",
  "Protocolos Delta 2026": "Delta protocols 2026",
  "Arquitectura lakehouse": "Lakehouse architecture",
  "Arquitectura de red: control plane y compute planes": "Network architecture: control plane and compute planes",
  "Red del serverless compute plane": "Serverless compute plane networking",
  "Red serverless en Azure Databricks": "Serverless networking on Azure Databricks",
  "Red serverless en Google Cloud": "Serverless networking on Google Cloud",
  "SQL warehouses: propósito y tipos de compute": "SQL warehouses: purpose and compute types",
  "Conectar y ejecutar con serverless compute": "Connect and run with serverless compute",
  "Dimensionado, escalado y colas de SQL warehouses": "SQL warehouse sizing, scaling and queuing",
  "Arquitectura y requisitos de SQL warehouses serverless": "Serverless SQL warehouse architecture and requirements",
  "Modelar datos semiestructurados y VARIANT": "Model semi-structured data and VARIANT",
  "Optimización en Databricks": "Optimization on Databricks",
  "Debugging con Spark UI": "Debugging with the Spark UI",
  "Convertir a managed con SET MANAGED": "Convert to managed with SET MANAGED",
  "Delta Lake y su transaction log": "Delta Lake and its transaction log",
  "Garantías ACID en Databricks": "ACID guarantees on Databricks",
  "Compatibilidad y protocolos de Delta Lake": "Delta Lake compatibility and protocols",
  "Versionado y compatibilidad del protocolo Delta": "Delta protocol versioning and compatibility",
  "Metric views de Unity Catalog": "Unity Catalog metric views",
  "Query-based connectors de Lakeflow Connect": "Lakeflow Connect query-based connectors",
  "Modelos de control de acceso en Unity Catalog": "Access control models in Unity Catalog",
  "Referencia de privilegios de Unity Catalog": "Unity Catalog privileges reference",
  "Workspace-catalog bindings en Google Cloud": "Workspace-catalog bindings on Google Cloud",
  "Sinks en Lakeflow pipelines · Databricks": "Sinks in Lakeflow pipelines · Databricks",
  "Migrar al motor de despliegue directo": "Migrate to the direct deployment engine",
  "Certificar o deprecar activos": "Certify or deprecate assets",
  "Acceso desde clientes Apache Iceberg": "Access from Apache Iceberg clients",
};

function englishSourceText(value: string) {
  return sourceTextEn[value] ?? value;
}

const englishPerformanceObjectives: Record<string, string> = {
  m01: "Given a business case, draw a lakehouse architecture that separates storage, compute, and governance, and justify each surface with a verifiable decision.",
  m02: "For three workloads with an SLA and budget, select and size compute, and deliver a comparison matrix with expected latency, isolation, and cost.",
  m03: "Given a notebook with hidden state, refactor it into parameterized code and show that a clean run reproduces the same output.",
  m04: "Given a semi-structured dataset, publish a normalized table with an explicit schema and prove key uniqueness, cardinality, and handling of invalid records.",
  m05: "Given a query with shuffle or skew, locate the cause in the plan and metrics, apply a single change, and show an improvement without altering the result.",
  m06: "Implement an idempotent Delta write and prove with history, keys, and a second run that the retry keeps the same logical state.",
  m07: "Design a bronze-silver-gold product with explicit grain, contracts, and consumption object, and reconcile counts and amounts across layers.",
  m08: "Load the same governed batch twice, keep provenance and quarantine, and prove that the second run duplicates neither entities nor files.",
  m09: "Implement an incremental ingestion with controlled state and evolution, and justify Auto Loader or Lakeflow Connect by volume, freshness, and operations.",
  m10: "Define a parameterized DAG with trigger, retry, and dependencies, and demonstrate a partial recovery that does not repeat already committed effects.",
  m11: "Apply least privilege and promote the same artifact between dev and prod, providing positive and negative access and configuration tests.",
  m12: "Deliver an end-to-end Associate mini-lakehouse and prove each acceptance criterion with an evidence matrix and defensible decisions.",
  m13: "Restart a streaming query from its checkpoint and prove with offsets, counts, and keys that it neither loses nor duplicates events.",
  m14: "Configure windows and a watermark for a time-based SLA, and use boundary data to identify which events are updated, dropped, and kept in state.",
  m15: "Integrate an event bus preserving offsets and keys, and demonstrate replay, quarantine of invalid messages, and lag within target.",
  m16: "Materialize ordered CDC with inserts, updates, and deletes, and reconcile final state and history for out-of-order events.",
  m17: "Operate a streaming pipeline against an SLO and run a game day that proves recovery within RTO/RPO without loss or duplicates.",
  m18: "Declare a bronze-silver-gold graph without imperative side effects and demonstrate dependencies, incremental refresh, and the strategy observed in the event log.",
  m19: "Implement rules with observe, isolate, and fail actions, and demonstrate rates, traceable quarantine, and remediation through the event log.",
  m20: "Design bounded control flow and repair only the failed subset, demonstrating idempotency and preservation of already successful tasks.",
  m21: "Plan a 90-day backfill compatible with the daily load and prove there are no overlaps, duplicates, or unprocessed windows.",
  m22: "Deliver a production declarative pipeline with quality, CDC, and operations, and demonstrate deployment, backfill, controlled failure, and recovery.",
  m23: "Optimize a skewed workload with a measurable hypothesis and present plan, shuffle, spill, duration, and correctness before and after.",
  m24: "Choose and apply a Delta layout from filter patterns, and demonstrate fewer files or bytes read without over-partitioning.",
  m25: "Build an attributable cost report and propose three quantified guardrails that reduce spend without breaking the SLA.",
  m26: "Investigate an incident by correlating at least three surfaces and deliver a reproducible hypothesis with IDs, evidence, confidence level, and next test.",
  m27: "Recover a degraded workload and deliver a postmortem that demonstrates improved reliability and cost and assigns preventive actions.",
  m28: "Package a transformation with pinned dependencies and prove its contract with unit, schema, and integration tests.",
  m29: "Promote the same artifact through a bundle, keep plan and hash, and demonstrate smoke test, run identity, and a documented rollback.",
  m30: "Protect a sensitive domain with least privilege and centralized policies, and demonstrate allow, masked/filtered, deny, retention, and audit.",
  m31: "Select sharing, federation, or ingestion for two consumers, and demonstrate minimal contract, pushdown or read, and revocation per pattern.",
  m32: "Deliver and defend a complete Professional platform, pass a game day, and trace every NFR to technical, operational, and cost evidence.",
};


export function localizeModule(module: CurriculumModule, locale: Locale): CurriculumModule {
  if (locale === "es") return module;
  const copy = moduleCopyEn[module.id];
  if (!copy) return module;
  return {
    ...module,
    title: copy.title,
    short: copy.short,
    description: copy.description,
    outcomes: copy.outcomes,
    performanceObjective: englishPerformanceObjectives[module.id] ?? module.performanceObjective,
    examDomains: module.examDomains.map(englishDomain),
    sources: module.sources.map((source) => ({
      ...source,
      label: englishSourceText(source.label),
      cloud: englishSourceText(source.cloud),
      version: englishSourceText(source.version),
      reviewedAt: localizeReviewDate(source.reviewedAt, locale) ?? source.reviewedAt,
    })),
    lessons: module.lessons.map((lesson, index) => localizeLesson(lesson, module.id, index)),
    lab: englishLab(module),
    quiz: module.quiz.map((question) => localizeQuizQuestion(question, locale)),
  };
}

function localizeLesson(lesson: Lesson, moduleId: string, index: number): Lesson {
  const content = englishLessonContentFor(lesson.id);
  return {
    ...lesson,
    kicker: `Lesson ${index + 1}`,
    title: englishLessonTitle(lesson, moduleId, index),
    summary: content.summary,
    decisions: content.decisions,
    explanation: content.explanation,
    deepDive: content.deepDive,
    keyPoints: content.keyPoints,
    example: { ...lesson.example, ...content.example },
    pitfalls: content.pitfalls,
    essentials: lessonEssentialsFor(lesson.id, "en"),
    examDecision: content.examDecision,
    checkpoint: content.checkpoint,
  };
}

/**
 * Proyecta una pregunta al inglés conservando identidad, clave y orden de
 * opciones. Las preguntas de simulacro llegan barajadas: cada opción se
 * traduce localizando su posición en el orden editorial canónico.
 */
export function localizeQuizQuestion(question: QuizQuestion, locale: Locale): QuizQuestion {
  if (locale === "es") return question;
  const copy = englishQuizContent[question.editorialId];
  const canonical = canonicalQuestionOptions(question.editorialId);
  if (!copy || !canonical) throw new Error(`Missing English assessment copy for ${question.editorialId}`);
  const options = question.options.map((option) => {
    const canonicalIndex = canonical.indexOf(option);
    if (canonicalIndex < 0) throw new Error(`Unknown option in ${question.editorialId}`);
    return copy.options[canonicalIndex];
  });
  return {
    ...question,
    question: copy.question,
    options,
    explanation: copy.explanation,
    domain: englishDomain(question.domain),
    ...(question.originLabel ? { originLabel: englishQuestionLabel(question.originLabel) } : {}),
    ...(question.sourceLabel ? { sourceLabel: englishQuestionLabel(question.sourceLabel) } : {}),
    ...(question.augmentationMethod ? { augmentationMethod: englishQuestionLabel(question.augmentationMethod) } : {}),
  };
}

/** Localiza los módulos relacionados de un catálogo cuyo texto propio ya se proyectó por idioma. */
export function localizeResourceCatalog(resources: CommunityResourceCatalogEntry[], locale: Locale): CommunityResourceCatalogEntry[] {
  if (locale === "es") return resources;
  return resources.map((resource) => ({
    ...resource,
    relatedModules: resource.relatedModules.map((module) => ({
      ...module,
      title: moduleCopyEn[module.id]?.title ?? module.title,
      phase: trackCopy.en[module.phaseId]?.name ?? module.phase,
    })),
  }));
}

export function localizeSearchLocation(location: string, locale: Locale): string {
  if (locale === "es") return location;
  return location
    .replace(/^Módulo /u, "Module ")
    .replace(" · Lección ", " · Lesson ")
    .replace(" · Notebook comunitario", " · Community notebook")
    .replace(/^Glosario/u, "Glossary");
}

export function localizeGlossaryCategory(category: string, locale: Locale): string {
  const key = category as GlossaryCategory;
  return locale === "en" ? glossaryCategoryLabelsEn[key] ?? category : glossaryCategoryLabels[key] ?? category;
}

/** Proyecta una entrada del glosario al idioma pedido usando su redacción editorial. */
export function localizeGlossaryEntry(entry: GlossaryEntry, locale: Locale): GlossaryEntry {
  if (locale === "es") return entry;
  return {
    ...entry,
    term: entry.en.term ?? entry.term,
    aliases: entry.en.aliases,
    definition: entry.en.definition,
    whyItMatters: entry.en.whyItMatters,
    example: entry.en.example,
  };
}

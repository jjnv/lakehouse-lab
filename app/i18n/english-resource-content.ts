import type { CommunityArtifact } from "../curriculum/community-resources";
import type { CanonicalModuleId } from "./english-lab-content";

/**
 * English projection of the community resource registry. Repository metadata,
 * licenses, URLs and preview references stay canonical in
 * `app/curriculum/community-resources.ts`; only learner-facing prose lives here.
 */
export const englishArtifactCopy: Record<string, { summary: string; runtimeNotes: string }> = {
  "learn": { summary: "Cross-cutting reference on Spark, Delta Lake, Lakeflow, Unity Catalog, Workflows and Bundles.", runtimeNotes: "Living content; validate every example on a recent runtime." },
  "learn-photon": { summary: "Reading notebook with technical references to understand Photon and vectorized execution.", runtimeNotes: "Reference notebook; you do not need to run every cell." },
  "startup-erp": { summary: "Bronze/Silver/Gold project with synthetic data, KPIs, and privacy and compliance controls.", runtimeNotes: "Requires Unity Catalog and declares DBR 13.0+." },
  "free-pipelines": { summary: "Hands-on course on medallion architecture and declarative pipelines with e-commerce data.", runtimeNotes: "Designed for Databricks Free Edition and Lakeflow Designer." },
  "azure-hands-on": { summary: "Linear path of PySpark, SQL, streaming and distributed orchestration exercises packaged as a DBC file.", runtimeNotes: "Import HandsOn.dbc into an Azure Databricks workspace." },
  "azure-streaming": { summary: "Guided exercises to connect Structured Streaming with Event Hubs or Kafka.", runtimeNotes: "Needs the event service and Azure credentials." },
  "sql-start-stop": { summary: "Automates start, stop and configuration of SQL warehouses through Workflows.", runtimeNotes: "The job principal needs permissions on the warehouse." },
  "best-practices": { summary: "Turns an exploratory notebook into modular, tested, schedulable code ready for CI/CD.", runtimeNotes: "Official example based on Python and Databricks notebooks." },
  "jump-start": { summary: "Long-standing collection of Python, Scala, SQL and R examples to explore Spark workloads.", runtimeNotes: "The author states that most examples worked on Community Edition." },
  "jump-flight": { summary: "Flight workload useful to study plans, partitioning, graphs and Spark behavior.", runtimeNotes: "Historical example: review APIs and runtime before running it." },
  "jump-streaming": { summary: "Sequence of Scala notebooks on DataFrames, streaming and stateful aggregations.", runtimeNotes: "Historical material; use it for concepts, not as a recipe for the current runtime." },
  "databricks-examples": { summary: "Community examples and anti-patterns to discuss Spark design and performance.", runtimeNotes: "Pick specific examples and validate their dependencies." },
  "delta-quickstart": { summary: "Official quickstart to read and write Delta tables with PySpark.", runtimeNotes: "Runs with PySpark and Delta Lake; adaptable to Databricks." },
  "delta-create-table": { summary: "Official example for creating and managing Delta tables.", runtimeNotes: "Runs with PySpark and Delta Lake." },
  "delta-cdf": { summary: "Official notebook dedicated to Change Data Feed, history and change consumption.", runtimeNotes: "Needs a Delta version that supports Change Data Feed." },
  "delta-examples": { summary: "Official collection of OSS examples for Delta Lake operations, tables and patterns.", runtimeNotes: "Adapt the OSS configuration to the Databricks runtime you use." },
  "dlt-notebooks": { summary: "Official repository of declarative pipeline demos covering quality, streaming and CDC.", runtimeNotes: "Create a pipeline and reference the corresponding folder as a library." },
  "dlt-kimball": { summary: "Official demo of Kimball-style dimensional modeling on declarative pipelines.", runtimeNotes: "Requires Lakeflow Declarative Pipelines." },
  "dlt-state": { summary: "Official demo of stateful processing and watermarks with applyInPandasWithState.", runtimeNotes: "Requires modern state APIs and a compatible pipeline." },
  "dlt-cdc": { summary: "Official CDC example with a data generator, Python/SQL pipeline and monitoring.", runtimeNotes: "Requires Lakeflow Declarative Pipelines." },
  "dlt-kafka": { summary: "Official streaming analytics pipeline with Kafka, an event generator and SQL.", runtimeNotes: "Needs Kafka access and Lakeflow Declarative Pipelines." },
  "yokawasa-notebooks": { summary: "Clear notebooks on file operations and ELT with Azure data services.", runtimeNotes: "Some examples need storage accounts or Azure services." },
  "yokawasa-eventhub": { summary: "Streaming notebook that connects Azure Event Hubs with processing in Databricks.", runtimeNotes: "Needs an Event Hub and connection secrets." },
  "azure-ingestion": { summary: "Demos of ADLS Gen2, Cosmos DB, and ingestion and medallion architecture patterns.", runtimeNotes: "Needs Azure resources and configured secrets." },
  "azure-governance": { summary: "Demos of Unity Catalog, Purview, secrets and classification for corporate governance on Azure.", runtimeNotes: "Needs Unity Catalog, Purview and Azure permissions." },
  "azure-federation": { summary: "Equivalent interoperability and mirroring pattern between Unity Catalog and Microsoft Fabric.", runtimeNotes: "It is a practical equivalent, not a direct OpenSharing lab." },
  "crdb": { summary: "Ingestion and CDC project from CockroachDB into Databricks.", runtimeNotes: "Needs a CockroachDB source and configured connectivity." },
  "bundles": { summary: "Official Declarative Automation Bundles examples for Python, SQL, Jobs and Lakeflow.", runtimeNotes: "Requires the Databricks CLI and workspace authentication." },
  "lakeflow-demo": { summary: "Structured project with SCD2, tests and deployment through Bundles.", runtimeNotes: "Built for Free Edition with the Databricks CLI and Bundles." },
  "sales-pipeline": { summary: "Declarative sales pipeline to practice expectations, transformation and medallion layers.", runtimeNotes: "Requires Lakeflow Declarative Pipelines." },
  "finops": { summary: "Queries and references for spend, usage, audit and observability through system tables.", runtimeNotes: "Needs system tables enabled; the repository works as a query guide." },
  "cost": { summary: "Project to allocate shared compute and SQL warehouse cost by user or business unit.", runtimeNotes: "Needs usage data and permissions on system tables." },
  "lighthouse": { summary: "Tool to observe lakehouse layout health, clustering, maintenance and cost.", runtimeNotes: "Validate compatibility with the target tables and runtime." },
  "bundles-tutorial": { summary: "Community tutorial on structuring and running Python and SQL notebooks inside Bundles.", runtimeNotes: "Requires the Databricks CLI and a configured workspace." },
  "purview": { summary: "Specialized examples of cataloging, metadata and lineage between Unity Catalog and Purview.", runtimeNotes: "Needs Azure Databricks, Unity Catalog and Microsoft Purview." },
  "unity-oss": { summary: "Open, multi-engine catalog to explore interoperability beyond a Databricks notebook.", runtimeNotes: "Conceptual equivalent; it is not a notebook and does not replace an OpenSharing lab." },
};

/** Practice focus per module, mirroring `moduleFocus` in the community registry. */
export const englishModuleResourceFocus: Record<CanonicalModuleId, { focus: string; concepts: string[] }> = {
  m01: { focus: "lakehouse architecture and how the platform surfaces relate", concepts: ["lakehouse architecture", "Spark", "Delta Lake", "Unity Catalog"] },
  m02: { focus: "selecting and operating compute and SQL warehouses", concepts: ["compute", "serverless", "SQL Warehouses", "Workflows"] },
  m03: { focus: "maintainable notebooks with Python, SQL and PySpark", concepts: ["notebooks", "PySpark", "modularity", "testing"] },
  m04: { focus: "DataFrames, transformations and complex data", concepts: ["DataFrames", "transformations", "arrays", "structs"] },
  m05: { focus: "execution plans, partitions, joins and shuffles", concepts: ["Catalyst", "partitions", "joins", "shuffles"] },
  m06: { focus: "reliable operations on Delta tables", concepts: ["Delta Lake", "ACID", "schema", "history"] },
  m07: { focus: "medallion layers, quality and dimensional modeling", concepts: ["medallion", "quality", "modeling", "Kimball"] },
  m08: { focus: "batch ingestion from files and external systems", concepts: ["batch ingestion", "formats", "ELT", "ADLS"] },
  m09: { focus: "incremental ingestion with Auto Loader and connectors", concepts: ["Auto Loader", "Lakeflow Connect", "schema evolution", "CDC"] },
  m10: { focus: "Lakeflow Jobs DAGs, tasks, parameters and triggers", concepts: ["Jobs", "DAG", "tasks", "triggers"] },
  m11: { focus: "governance and code delivery across environments", concepts: ["Unity Catalog", "Git folders", "CI/CD", "Bundles"] },
  m12: { focus: "an end-to-end Associate project", concepts: ["project", "Associate", "medallion", "orchestration"] },
  m13: { focus: "Structured Streaming, triggers and checkpoints", concepts: ["Structured Streaming", "checkpoints", "triggers", "micro-batch"] },
  m14: { focus: "state, windows, watermarks and late data", concepts: ["state", "windows", "watermarks", "late data"] },
  m15: { focus: "integration with Kafka and event buses", concepts: ["Kafka", "Event Hubs", "delivery semantics", "streaming"] },
  m16: { focus: "Change Data Feed, CDC and SCD dimensions", concepts: ["CDF", "CDC", "AUTO CDC", "SCD"] },
  m17: { focus: "a streaming project with an observable SLA", concepts: ["streaming", "SLA", "operations", "pipeline"] },
  m18: { focus: "declarative pipelines in Lakeflow", concepts: ["Lakeflow", "declarative pipelines", "medallion", "deployment"] },
  m19: { focus: "expectations, quarantine and event logs", concepts: ["expectations", "quality", "quarantine", "event log"] },
  m20: { focus: "control flow, retries and repairs in Jobs", concepts: ["control flow", "retries", "repairs", "Jobs"] },
  m21: { focus: "triggers, alerts, backfills and operations", concepts: ["triggers", "alerts", "backfills", "operations"] },
  m22: { focus: "a deployable declarative pipeline project", concepts: ["capstone", "Lakeflow", "SCD2", "Bundles"] },
  m23: { focus: "evidence-based advanced tuning", concepts: ["Spark tuning", "plans", "partitions", "performance"] },
  m24: { focus: "Photon, data skipping and liquid clustering", concepts: ["Photon", "data skipping", "liquid clustering", "layout"] },
  m25: { focus: "policies, tags and cost attribution", concepts: ["FinOps", "policies", "tags", "chargeback"] },
  m26: { focus: "diagnosis with Spark UI, Query Profile and system tables", concepts: ["Spark UI", "Query Profile", "system tables", "observability"] },
  m27: { focus: "a reliability and cost project", concepts: ["reliability", "FinOps", "TCO", "observability"] },
  m28: { focus: "Python projects, dependencies and tests", concepts: ["Python", "dependencies", "testing", "modularity"] },
  m29: { focus: "Declarative Automation Bundles and CI/CD", concepts: ["Bundles", "CI/CD", "targets", "deployment"] },
  m30: { focus: "privacy and advanced governance with Unity Catalog", concepts: ["Unity Catalog", "privacy", "Purview", "lineage"] },
  m31: { focus: "interoperability, OpenSharing and Federation", concepts: ["interoperability", "sharing", "federation", "open catalog"] },
  m32: { focus: "a Professional project with governance, operations and cost", concepts: ["Professional", "architecture", "governance", "FinOps"] },
};

const englishUsageInstructions: Record<CommunityArtifact["importMode"], string[]> = {
  "ipynb": ["Review the preview and the resource requirements.", "Download the .ipynb file or import it from its URL into the workspace.", "Attach compatible compute and run the cells in order."],
  "databricks-source": ["Open the source file and review its Markdown and code cells.", "Import it as a notebook or add the repository as a Git folder.", "Configure catalogs, schemas and parameters before running."],
  "dbc": ["Download the .dbc file referenced by the repository.", "In Workspace, use Import and select the DBC file.", "Review the required compute and credentials before running."],
  "bundle": ["Clone the repository and review the bundle targets and variables.", "Run validation against your development environment.", "Deploy and run only after checking permissions and resource names."],
  "repository": ["Open the README and locate the recommended example.", "Review license, dependencies, data and runtime.", "Create a working copy in your Git folder and adapt parameters before running."],
};

export function englishArtifactFor(artifactId: string) {
  const copy = englishArtifactCopy[artifactId];
  if (!copy) throw new Error(`Missing English copy for community resource ${artifactId}`);
  return copy;
}

export function englishFocusFor(moduleId: string) {
  const focus = englishModuleResourceFocus[moduleId as CanonicalModuleId];
  if (!focus) throw new Error(`Missing English resource focus for ${moduleId}`);
  return focus;
}

export function englishUsageInstructionsFor(importMode: CommunityArtifact["importMode"]) {
  return [...englishUsageInstructions[importMode]];
}

export function englishRationale(artifactId: string, moduleId: string) {
  return `${englishArtifactFor(artifactId).summary} In this module it is suggested for practicing ${englishFocusFor(moduleId).focus}.`;
}

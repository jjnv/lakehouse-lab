import type { CurriculumModule, Lesson, QuizQuestion } from "../course-data";
import type { GlossaryEntry } from "../curriculum/glossary";
import type { CommunityResourceCatalogEntry, ModuleSummary } from "../enterprise/contracts";
import type { Locale } from "./config";
import { englishLessonContent } from "./english-lesson-content";

type ModuleCopy = {
  title: string;
  short: string;
  description: string;
  outcomes: string[];
};

type LessonCopy = {
  title: string;
  summary: string;
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

type EnglishLessonNarrative = {
  summary: string;
  explanation: [string, string];
};

/**
 * The first ten modules are the learner's foundation. Keep their English copy
 * explicit and topic-specific instead of falling back to the generic review
 * template; the Spanish content remains the editorial source of truth.
 */
const englishLessonNarratives: Record<string, EnglishLessonNarrative[]> = {
  m01: [
    { summary: "Separate lake, warehouse, and lakehouse by storage, compute, governance, and consumption rather than by product names.", explanation: ["A lake keeps durable files, a warehouse optimizes structured analytical queries, and a lakehouse combines open storage with transactional and governance capabilities. The useful comparison is the contract each workload needs.", "Start with the consumer, freshness, concurrency, and recovery requirements. Then choose the smallest Databricks surface that can meet them without creating a second uncontrolled copy of the data."] },
    { summary: "Follow a request across the control plane and compute plane to understand where orchestration, execution, identity, and network boundaries live.", explanation: ["The control plane coordinates workspace configuration, APIs, job definitions, and resource state. The compute plane runs code and reaches governed data using an authorized identity; it does not invent permissions by itself.", "When diagnosing a failure, identify the last boundary that worked. A control-plane authorization error, a network restriction, and a Spark execution failure require different evidence and different owners."] },
    { summary: "Use object storage and open formats as the durable foundation, then add table semantics where the workload needs them.", explanation: ["Object storage provides durable, elastic files, while formats such as Parquet preserve columnar structure and interoperability. A table layer adds schema, transaction, history, and governance semantics on top of those files.", "Do not confuse an open file with a governed table. Record the schema contract, ownership, retention, and access path so that another engine can read the data without bypassing the platform's controls."] },
    { summary: "Map workspace objects, the metastore, and compute resources to the responsibility they actually own.", explanation: ["A workspace is a collaboration and execution surface; a metastore and catalog organize governed data objects; compute provides the resources that run SQL, Python, or Spark. These layers are related but are not interchangeable.", "A defensible design names the catalog and schema, the runtime or warehouse, the identity, and the minimum permissions. This makes the architecture reproducible across environments instead of depending on a user's current session."] },
    { summary: "Assemble an end-to-end reference architecture by connecting sources, storage, processing, governance, serving, and operations.", explanation: ["A reference architecture is useful only when every arrow has a purpose: where data arrives, which layer transforms it, who can read it, how consumers access it, and how failures are recovered.", "Validate the design with a small path from source to published result. Capture lineage, schema, permissions, runtime evidence, and cleanup so the diagram describes something the team can actually operate."] },
  ],
  m02: [
    { summary: "Choose serverless or classic compute by weighing startup time, control, isolation, compatibility, and governance.", explanation: ["Serverless reduces infrastructure management and can start quickly, while classic compute offers more control over runtime and network configuration. Neither is universally better; the workload contract decides.", "Compare the required libraries, data access, latency, concurrency, and operational ownership before choosing. Record the reason so a later cost or incident review does not turn into guesswork."] },
    { summary: "Match all-purpose compute, jobs compute, and SQL warehouses to interactive development, repeatable workloads, and concurrent SQL consumption.", explanation: ["All-purpose compute supports exploration, jobs compute isolates scheduled execution, and SQL warehouses serve SQL and BI workloads. Sharing one interactive resource for every purpose hides ownership and makes cost attribution harder.", "Choose a surface that gives the workload its own lifecycle, identity, permissions, and evidence. Prototype interactively, but promote production work to a repeatable task or query service."] },
    { summary: "Use autoscaling, auto-stop, and pools to balance capacity, startup latency, and idle cost.", explanation: ["Autoscaling changes worker capacity with demand, auto-stop limits idle spend, and pools can reduce startup time for compatible classic workloads. Each control solves a different part of the capacity problem.", "Tune from observed utilization and queueing rather than from a larger default. Check whether the policy, workload burst, and startup requirement justify the operational complexity."] },
    { summary: "Treat access modes and workload isolation as part of the compute design, not as an afterthought.", explanation: ["Access mode determines how identities and data access are enforced while code runs. Isolation also separates interactive users, scheduled jobs, sensitive data, and incompatible dependencies.", "Grant only the permissions needed by the workload and choose a compute boundary that prevents one user's libraries, commands, or data access from becoming another user's implicit trust boundary."] },
    { summary: "Read DBUs, startup latency, utilization, and workload value together before making a cost decision.", explanation: ["A cheaper resource can cost more when it queues, runs inefficiently, or stays idle. Billing records show consumption, but they need workload identity, tags, and runtime context to explain why it happened.", "Use a measured baseline, change one relevant variable, and compare cost with freshness, throughput, and reliability. Cost optimization is a constrained engineering decision, not a race to the smallest cluster."] },
  ],
  m03: [
    { summary: "Use workspace notebooks and files as collaboration surfaces while keeping production logic reviewable and reproducible.", explanation: ["Notebooks are excellent for exploration and explanation, but hidden state, cell order, and untracked dependencies make them fragile as the only production artifact.", "Separate configuration, pure transformations, I/O, and orchestration. A reviewer should be able to identify the inputs, outputs, required identity, and rerun behavior without opening a user's session."] },
    { summary: "Choose SQL, Python, or PySpark based on the operation and its ownership rather than personal preference.", explanation: ["SQL is often the clearest choice for relational transformations and BI, while Python coordinates logic and PySpark expresses distributed transformations. The execution engine, not the notebook language, determines the data movement.", "Keep the boundary explicit: pass tables, paths, or small task values between units and persist datasets durably. Do not rely on a DataFrame remaining in memory for a later task."] },
    { summary: "Parameterize notebooks and tasks with validated inputs instead of hard-coding dates, paths, or sensitive values.", explanation: ["Widgets and task parameters arrive as strings and must be parsed, constrained, and logged. A date or processing window can vary safely; a password or token belongs in a governed secret or connection.", "Define defaults for development, reject invalid values early, and record the effective parameters in run evidence. This is what makes a backfill distinguishable from a normal daily run."] },
    { summary: "Make libraries and runtime dependencies reproducible across local, interactive, and scheduled execution.", explanation: ["A notebook that works because a user installed a package manually is not a dependable artifact. Pin compatible versions, declare where dependencies are installed, and test the environment used by the job.", "Keep credentials out of dependency configuration and validate imports in an isolated run. Compatibility and startup cost are part of the dependency decision, not merely packaging details."] },
    { summary: "Use collaboration, review, and modularity to turn exploratory notebooks into maintainable data products.", explanation: ["Reviewable work has a clear diff, small units, named contracts, and tests or checks that expose assumptions. Modular code also makes it possible to reuse a transformation from a job, a notebook, or a test.", "Preserve the notebook as an explanation when useful, but move reusable behavior behind functions or files with explicit inputs and outputs. The goal is a handoff another engineer can rerun safely."] },
  ],
  m04: [
    { summary: "Distinguish lazy transformations from actions so you can reason about when Spark builds a plan and when it executes it.", explanation: ["Transformations describe a new DataFrame without immediately reading all input; an action requests a result and triggers execution. This separation lets Spark optimize a chain, but it also means repeated actions can repeat work.", "Keep the transformation graph understandable and materialize only at deliberate boundaries. Validate both the logical result and the execution evidence instead of assuming a successful cell proves the full pipeline."] },
    { summary: "Use select, filter, and withColumn to express column-level contracts without hiding type or null behavior.", explanation: ["Column expressions are safer than unstructured string manipulation because they expose types, null semantics, and the intended projection. Filters should state which records are accepted and what happens to rejected data.", "Name derived columns and validate their schema, cardinality, and representative values. A correct expression is not enough if it silently changes the contract consumed by the next layer."] },
    { summary: "Design joins, unions, and composite keys around explicit grain and duplicate behavior.", explanation: ["Before joining, state the grain of each input and whether the key is unique. A many-to-many join can multiply rows without raising an error, while a union requires compatible meaning as well as compatible types.", "Use deterministic keys and checks for row counts, unmatched records, and duplicates. The result should explain not only which rows were combined, but why that combination is valid."] },
    { summary: "Flatten arrays, maps, and structs while preserving the relationship between the parent record and each nested value.", explanation: ["Nested data is not merely a formatting problem: exploding an array changes grain, and selecting a map key can turn missing values into nulls. Keep the parent identifier available through the transformation.", "Document whether empty arrays are dropped or retained, how malformed records are handled, and which schema the normalized table promises to downstream consumers."] },
    { summary: "Combine windows, aggregations, and deduplication with an explicit ordering and retention rule.", explanation: ["Window functions calculate over related rows without necessarily collapsing them, while aggregations change grain. Deduplication needs a deterministic winner, such as the latest trusted event by timestamp and sequence.", "Test ties, nulls, late records, and reruns. A stable result requires both the right expression and a rule that remains true when input order changes."] },
  ],
  m05: [
    { summary: "Use lazy evaluation and the Spark DAG to distinguish the code you wrote from the work Spark will actually execute.", explanation: ["Spark builds a logical graph first and schedules stages only when an action runs. Two compact lines can still produce a large scan, shuffle, or repeated computation.", "Read the plan before changing resources. Identify the expensive boundary, the data it moves, and the evidence that would show an improvement after the change."] },
    { summary: "Read Catalyst's logical and physical plan as a decision aid rather than treating explain output as decoration.", explanation: ["Catalyst can push filters, prune columns, simplify expressions, and choose physical operators. The optimized plan explains what Spark understood, while the physical plan shows exchanges, joins, scans, and execution boundaries.", "Compare plans before and after a change and connect them to runtime metrics. A configuration is justified only when the plan and observed behavior support the same diagnosis."] },
    { summary: "Treat partitions and parallelism as a relationship between data distribution, task size, and available resources.", explanation: ["Too few partitions create large tasks and poor parallelism; too many create scheduling and file overhead. The useful target depends on input size, cluster capacity, and the next operation.", "Measure task duration and partition sizes instead of copying a fixed number. Repartition when you need to redistribute data, and coalesce only when reducing partitions without a full shuffle is safe."] },
    { summary: "Recognize shuffles, skew, and spill as different symptoms of data movement and resource pressure.", explanation: ["A shuffle redistributes records across the network, skew makes a few tasks disproportionately large, and spill moves intermediate state from memory to disk. They can appear together but require different remedies.", "Use stage metrics, task duration distribution, and the plan to locate the cause. Scaling every worker may hide skew or a poor join while increasing cost without fixing the shape of the work."] },
    { summary: "Choose broadcast, sort-merge, or another join strategy from table size, key distribution, and evidence.", explanation: ["Broadcast can avoid a large shuffle when one side is genuinely small enough for executors. Sort-merge joins are safer for large inputs but still depend on partitioning, skew, and spill behavior.", "Validate the chosen strategy with the physical plan and runtime metrics. Do not force a broadcast based only on a stale size estimate or an assumption that the small table will stay small."] },
  ],
  m06: [
    { summary: "Use the Delta transaction log and ACID properties to reason about snapshots, commits, and concurrent writers.", explanation: ["Delta records table versions and the actions that create each snapshot, allowing readers to see a consistent state while writers commit optimistically. Files alone do not provide this transaction contract.", "When a write conflicts, inspect the operation and retry only when the write is safe to repeat. Preserve the log and history as operational evidence rather than treating them as disposable metadata."] },
    { summary: "Choose managed or external tables from ownership, storage location, lifecycle, and governance requirements.", explanation: ["Managed tables let the platform own the data lifecycle; external tables keep storage ownership outside the metastore boundary. The choice affects deletion, access, migration, and recovery.", "Do not change table type or location casually. State who owns the files, who can delete them, and which catalog and workspace boundaries must remain valid after deployment."] },
    { summary: "Apply schema enforcement and evolution deliberately so new data cannot silently change a downstream contract.", explanation: ["Enforcement rejects incompatible writes, while evolution can add compatible structure under defined rules. Both protect consumers only when the team has decided which changes are acceptable.", "Test additive, incompatible, and malformed changes separately. Record the schema version and the behavior of quarantined or rescued fields before promoting the change."] },
    { summary: "Design MERGE, UPDATE, and DELETE operations around keys, ordering, and idempotent replay.", explanation: ["A MERGE must define how source rows match targets and what happens when multiple source records address one key. Updates and deletes are business changes, not merely SQL syntax.", "Use a durable event or business key, a deterministic ordering rule, and a rerun test. The same input should converge to the same logical table state without duplicate side effects."] },
    { summary: "Use history, time travel, and VACUUM with a clear recovery and retention policy.", explanation: ["History explains committed operations and time travel reads an earlier table version while the required files remain available. VACUUM removes files outside the retention window and can eliminate recovery options.", "Choose retention from legal, operational, and replay needs. Before cleanup, verify that no reader, clone, backfill, or incident investigation still depends on those versions."] },
  ],
  m07: [
    { summary: "Use medallion as a responsibility pattern for contracts and traceability, not as a rigid three-table recipe.", explanation: ["Bronze preserves source context, silver applies conformance and quality, and gold serves a defined consumer. Some domains need more layers or different boundaries, but each boundary must have an owner and purpose.", "Start from consumption and recovery requirements, then decide where each transformation belongs. Avoid copying data between layers without a contract or a reason a consumer needs the boundary."] },
    { summary: "Keep bronze close to the source while preserving provenance, replay information, and malformed records safely.", explanation: ["A useful bronze layer records source identifiers, arrival metadata, ingestion version, and the original payload or a recoverable representation. It should not pretend that source data is already clean.", "Separate quarantine from silent loss and make the replay path explicit. The source contract and retention policy determine what must be preserved and for how long."] },
    { summary: "Use silver to conform types, keys, quality rules, and shared meaning across sources.", explanation: ["Silver is where schemas, units, time zones, identifiers, and quality expectations become consistent enough for multiple consumers. It is also where rejected records need a visible reason.", "Make quality checks observable and idempotent. A silver table should be explainable from its source rows and its contract, not from a notebook author's memory."] },
    { summary: "Design gold facts and dimensions from business grain, query patterns, and change history.", explanation: ["A fact table states what one row measures; dimensions provide descriptive context and may need slowly changing dimension behavior. The model is justified by questions consumers must answer.", "Choose keys, grain, and history before writing SQL. Validate totals against the conformed layer and document which dimensions are current, historical, or intentionally denormalized."] },
    { summary: "Make contracts, SLOs, and ownership explicit at every layer boundary.", explanation: ["A data contract names schema, freshness, quality, access, and failure behavior. An SLO turns freshness or completeness into a measurable promise, while ownership defines who responds when it is violated.", "Publish evidence with the dataset: version, checks, lineage, and run context. This makes reruns and handoffs safer than relying on a dashboard with no operating agreement."] },
  ],
  m08: [
    { summary: "Choose a batch ingestion pattern from source behavior, volume, replay needs, freshness, and governance.", explanation: ["Full loads are simple but expensive at scale; incremental loads reduce work but need a durable watermark, change key, or file history. APIs and databases add rate limits, credentials, and consistency concerns.", "Define the source contract before choosing a connector. The ingestion path must explain how it resumes, handles duplicates, quarantines bad input, and proves what was loaded."] },
    { summary: "Select file formats by schema, compression, interoperability, and the way downstream engines will read them.", explanation: ["CSV is broadly portable but weakly typed, while JSON preserves nested structure and Parquet, Avro, or ORC provide stronger schema and encoding tradeoffs. Binary files require a decoder and an explicit contract.", "Do not optimize only for ingestion convenience. Validate type inference, compression, malformed records, and the resulting table schema before accepting a format as standard."] },
    { summary: "Use COPY INTO and file history to make file ingestion repeatable and idempotent.", explanation: ["COPY INTO tracks files already processed and can load new arrivals without appending the same file again. That behavior is useful only when the landing path and file identity are stable.", "Test a first run, an identical rerun, a corrected file, and a partial failure. Keep source metadata so the table can explain which file produced each record."] },
    { summary: "Use JDBC, ODBC, or REST with explicit pagination, watermarks, credentials, and rate-limit behavior.", explanation: ["Database extraction depends on a stable query and incremental key; REST extraction depends on pagination, cursor persistence, retries, and API limits. ODBC or JDBC does not remove those source semantics.", "Store secrets in governed connections, persist progress, and make writes idempotent. A retry must not skip a page or create duplicates when the source changes during extraction."] },
    { summary: "Preserve ingestion metadata, classify errors, and quarantine records without hiding source problems.", explanation: ["Input path, file name, source version, arrival time, extraction window, and run ID turn a raw load into an auditable operation. Errors should distinguish malformed data, schema drift, authentication, and transient availability.", "Route records that can be repaired to quarantine with a reason and retain enough context to replay them. Alert on trends instead of silently dropping input to keep a job green."] },
  ],
  m09: [
    { summary: "Use Auto Loader and cloudFiles when durable file discovery and incremental state are the primary requirements.", explanation: ["Auto Loader discovers new files and records progress through checkpoint state, avoiding a full directory scan on every run. The source format, schema location, and checkpoint location are part of the pipeline contract.", "Keep those locations stable and isolated by workload. Test restart and replay behavior before changing the landing path or deploying a second consumer against the same state."] },
    { summary: "Choose directory listing or file notification from scale, arrival pattern, cloud setup, and operational ownership.", explanation: ["Directory listing is simple and can suit smaller or controlled paths; file notification scales discovery differently but adds cloud configuration and monitoring responsibilities.", "Compare discovery latency, listing cost, permissions, and recovery behavior. The correct mode is the one whose operational boundary the team can own and verify."] },
    { summary: "Control schema inference, hints, evolution, and rescued data instead of letting new files redefine the contract silently.", explanation: ["Inference is a starting point, not a governance policy. Hints, explicit schemas, and evolution rules decide which changes are accepted, promoted, or retained as rescued data.", "Exercise additive, conflicting, and malformed input and inspect both the target schema and rescued column. Consumers need a visible rule for when a new field becomes trusted."] },
    { summary: "Compare standard and managed Lakeflow Connect by source coverage, freshness, maintenance, and governance.", explanation: ["A managed connector can reduce custom extraction code and operational ownership for supported systems; a standard connector or custom pipeline may offer more control or broader flexibility.", "Evaluate credentials, incremental semantics, monitoring, limits, and destination behavior. Choose the connector that exposes the evidence and recovery controls the workload needs."] },
    { summary: "Use a decision matrix that connects volume, freshness, source shape, evolution, and governance to the ingestion choice.", explanation: ["Auto Loader is strong for cloud files, Lakeflow Connect can simplify supported SaaS or database sources, and partner connectors may fill a specific integration gap. The product name is not the decision rule.", "Write down why the selected path wins, what would invalidate it, and how the team will replay or migrate. This keeps an ingestion design aligned as source volume and SLA change."] },
  ],
  m10: [
    { summary: "Model Lakeflow Jobs as a DAG of observable, retryable tasks with explicit dependencies and ownership.", explanation: ["A task defines a unit of execution, compute, identity, parameters, timeout, and retry behavior; an edge expresses a dependency or condition. The DAG coordinates durable results but does not transport an in-memory DataFrame.", "Add a dependency only when the downstream task needs the upstream result or success. This preserves safe parallelism and makes repair possible without replaying the entire workflow."] },
    { summary: "Choose notebook, Python, SQL, or pipeline tasks according to the artifact and execution boundary they own.", explanation: ["Notebook tasks are useful for parameterized code and explanation, Python tasks for packaged logic, SQL tasks for governed queries, and pipeline tasks for a managed dataflow update.", "Keep each task small enough to observe and retry, but large enough to represent a meaningful operational boundary. Persist datasets between tasks and pass only small scalar task values."] },
    { summary: "Use job parameters and task values to pass controlled context without turning orchestration into hidden state.", explanation: ["Job parameters express run-level context such as a processing date; task values expose small results such as a validation status. Neither is a substitute for a table, file, or governed secret.", "Validate parameters at the boundary, record the effective values, and keep sensitive data in connections or secret scopes. A rerun should show exactly which inputs it used."] },
    { summary: "Choose schedule, file-arrival, or table-update triggers from the SLA and the source's real arrival semantics.", explanation: ["Schedules provide predictable cadence, file-arrival triggers react to landing activity, and table-update triggers react to a governed data change. A frequent schedule is not automatically low latency.", "Measure freshness from source arrival to consumer availability and account for startup, queueing, and retry time. Use the trigger that expresses the business event without polling unnecessarily."] },
    { summary: "Design retries, timeouts, and notifications around idempotency, failure classification, and actionable ownership.", explanation: ["Retries help with transient failures but amplify duplicates or external side effects when a task is not idempotent. Timeouts bound a stuck run; notifications must identify the task, run, cause, and next safe action.", "Test failure and repair paths deliberately. Keep run history and outputs, and ensure the workflow can resume from a durable boundary instead of repeating successful work blindly."] },
  ],
  m11: [
    { summary: "Use the metastore, catalog, schema, and object hierarchy to make data ownership and access boundaries explicit.", explanation: ["Unity Catalog gives governed data a namespace that consumers can address consistently. Catalogs, schemas, tables, views, volumes, and models are different objects with different lifecycle and privilege implications.", "Design the namespace from domains and ownership, then test the exact three-level names from the identity that will run the workload. A convenient name is not a substitute for a clear boundary."] },
    { summary: "Apply least privilege through grants, inheritance, and service principals instead of sharing personal access.", explanation: ["Privileges should flow from groups and service identities to the smallest securable that needs them. Inheritance reduces repetition, but it must be understood before granting access at a broad parent level.", "Separate deploy identity from runtime identity where possible, revoke unused access, and verify both allowed and denied paths. The audit trail should identify the actor that read or changed a resource."] },
    { summary: "Choose external locations, volumes, and storage credentials according to who owns storage and how files are accessed.", explanation: ["Storage credentials represent an authorized cloud identity, external locations bind that identity to a governed path, and volumes provide a cataloged way to work with files. They solve different parts of the access chain.", "Avoid embedding cloud keys in notebooks or granting a workspace a broad bucket path. Test the least privilege required for the intended read or write and document the owner of each resource."] },
    { summary: "Use Git folders and branch workflow to make notebooks and code reviewable without turning the workspace into the source of truth.", explanation: ["Git folders connect workspace development with branches, commits, and review. They improve collaboration, but production behavior still needs a repeatable deployment artifact and environment-specific configuration.", "Keep changes small, review generated or notebook diffs, and separate code from secrets and target-specific values. A clean branch is evidence of collaboration, not proof that deployment is safe by itself."] },
    { summary: "Promote one bundle through targets and environment variables while keeping resources, identities, and permissions explicit.", explanation: ["A bundle describes project resources and artifacts as code; targets express real environment differences without copying an entire definition. Deployment identity and runtime identity should be constrained to their roles.", "Validate and plan before deploying, review destructive actions, and promote the same artifact. This prevents dev and prod from drifting into two independently edited systems."] },
  ],
  m12: [
    { summary: "Turn the Associate brief into acceptance criteria that can be tested, evidenced, and defended.", explanation: ["A useful brief names sources, consumers, freshness, quality, security, cost, and recovery expectations. Acceptance criteria translate those needs into observable results rather than architectural slogans.", "Prioritize the smallest end-to-end path and define what counts as success or a controlled failure. Every criterion should map to a test, query, metric, permission check, or runbook step."] },
    { summary: "Establish architecture and security boundaries before building the pipeline so later implementation choices remain coherent.", explanation: ["Choose namespaces, identities, storage boundaries, compute surfaces, and data layers before writing transformations. Security is part of the design contract, not a review item added after the tables exist.", "Document who can ingest, transform, publish, and consume. Test denied access as deliberately as successful access and retain the evidence with the project decision record."] },
    { summary: "Build the Associate pipeline as one repeatable path from landing data to a governed gold result.", explanation: ["The project should connect ingestion, DataFrame or SQL transformations, Delta tables, quality checks, and Lakeflow Jobs. Each step must have a durable output and an explicit contract with the next step.", "Prefer a small pipeline that reruns safely over a large demo with hidden manual state. Capture parameters, row counts, schema, lineage, and the job run that produced the result."] },
    { summary: "Prove the project through tests, operational evidence, and documentation that another engineer can execute.", explanation: ["A successful happy-path run does not demonstrate recovery, idempotency, permissions, or cost awareness. Add checks for invalid input, repeated execution, partial failure, and the most important access boundary.", "The handoff should include architecture, assumptions, run instructions, evidence locations, cleanup, and a response path for common failures. Documentation is part of the deliverable because it makes the design operable."] },
    { summary: "Use the retrospective and practice exam to label reasoning gaps rather than chasing a single score.", explanation: ["Review errors by domain and by reasoning type: missing concept, misread scenario, terminology confusion, or incorrect tradeoff. Then return to the relevant lesson and answer a variant with a changed constraint.", "A practice result is evidence for the next study decision, not an official certification result. Explain why the distractors fail and connect the answer to a source, lab, or observed behavior."] },
  ],
  m13: [
    { summary: "Understand Structured Streaming as incremental computation over new data, with explicit progress and recovery semantics.", explanation: ["A streaming query repeatedly processes available input while retaining offsets and state. It is not simply a batch query in a loop: source progress, trigger behavior, checkpointing, and sink guarantees all matter.", "Define what one run means, where progress is stored, and how a restart resumes. The design is correct only when the output and recovery behavior match the freshness contract."] },
    { summary: "Match sources, sinks, and output modes to the shape of the stream and the table consumers need.", explanation: ["Sources define how new records arrive, sinks define where results become durable, and output modes define whether the query appends, updates, or replaces visible results. These choices are coupled to state and checkpoint behavior.", "Name the input and output grain before choosing a mode. Test empty input, duplicate input, and a restart so the sink contract is demonstrated rather than assumed."] },
    { summary: "Choose availableNow or processingTime from freshness, boundedness, startup cost, and operational ownership.", explanation: ["processingTime keeps a query active on a cadence, while availableNow processes the data available to that execution and then finishes, often through multiple microbatches. Neither mode changes the underlying incremental semantics.", "Compare the freshness SLO with compute startup and idle cost. A ten-second trigger cannot deliver ten-second freshness if each microbatch takes two minutes or the source is delayed."] },
    { summary: "Treat offsets, commits, and checkpoints as the durable evidence that connects input progress to output state.", explanation: ["Offsets identify what the source has made available, commits and sink behavior indicate what was successfully published, and checkpoints preserve the query's recovery state. Losing or sharing a checkpoint can change the meaning of a restart.", "Use one stable checkpoint per compatible query and isolate it by environment and target. Inspect the state before changing source options or deploying a second consumer."] },
    { summary: "Design recovery and code changes so a restarted stream preserves correctness instead of silently resetting or duplicating state.", explanation: ["A restart should resume from durable progress, but only changes compatible with the existing checkpoint and state schema are safe. Incompatible changes require a deliberate migration or a new checkpoint with a replay plan.", "Test failure during processing, sink retry, and restart after deployment. Preserve the old evidence and make the cutover or replay boundary explicit."] },
  ],
  m14: [
    { summary: "Separate event time from processing time before designing windows, lateness, or freshness metrics.", explanation: ["Event time describes when a business event happened; processing time describes when the platform handled it. Using processing time for a business window can misclassify delayed events.", "Keep both timestamps where useful and define which one drives aggregation, watermarking, and SLA measurement. A correct temporal model prevents accidental loss of valid late data."] },
    { summary: "Choose tumbling or sliding windows from the business question and the amount of overlapping state they create.", explanation: ["Tumbling windows partition time into non-overlapping intervals; sliding windows produce overlapping results at a configured slide. The latter can answer rolling questions but increases computation and state.", "State the window boundary, timezone, lateness policy, and output grain. Validate boundary events and empty windows rather than testing only records in the middle of an interval."] },
    { summary: "Use watermarks to bound state and define when the system may finalize or discard late information.", explanation: ["A watermark advances from observed event time and allows the engine to clean state after the configured lateness threshold. It is a correctness and resource decision, not a generic performance switch.", "Choose the threshold from source delay evidence and business tolerance. Measure late records and make discarded data visible so the freshness tradeoff can be reviewed."] },
    { summary: "Deduplicate statefully with a durable event identity and an explicit retention horizon.", explanation: ["Streaming deduplication remembers identifiers across microbatches, which prevents replayed events from creating duplicates. Without a bounded state policy, memory and recovery cost grow with history.", "Use a stable event key and decide how long duplicates can arrive. Test duplicate events before and after the watermark and document which late records are no longer recoverable."] },
    { summary: "Read state-store metrics and memory pressure as evidence for both correctness and capacity decisions.", explanation: ["State size, update time, watermark progress, and batch duration reveal whether a query is retaining too much history or falling behind. A slow batch is not always fixed by adding workers.", "Correlate state growth with window and watermark rules, key distribution, and input rate. Change one boundary, then verify latency, output correctness, and recovery time together."] },
  ],
  m15: [
    { summary: "Use Kafka topics, partitions, and consumer offsets to reason about parallelism, ordering, and replay.", explanation: ["A topic groups events, partitions provide ordered lanes, and offsets identify a consumer's position within each lane. Ordering is normally guaranteed only within a partition, so the key affects business correctness.", "Choose a partition key that balances load without breaking the ordering needed by the entity. Persist offsets through the streaming checkpoint and define how replays are handled."] },
    { summary: "Preserve Kafka key, value, headers, and timestamps because they carry semantics beyond the decoded payload.", explanation: ["The value contains the event body, while the key can determine partitioning and entity identity; headers and timestamps often carry routing, schema, or source context. Dropping them early weakens replay and diagnosis.", "Decode with an explicit schema and retain source metadata in the Delta target. Validate null keys, malformed payloads, and timestamps that arrive outside the expected range."] },
    { summary: "Configure Kafka authentication and secrets through governed connections rather than notebook literals.", explanation: ["Kafka access may require TLS, SASL, OAuth, or cloud-specific credentials. These settings belong in a controlled secret or connection boundary and should be available to the runtime identity without exposing the value.", "Test both authorization and network reachability with minimum permissions. Rotate credentials without rewriting data code and record which identity consumed each stream."] },
    { summary: "Distinguish at-least-once delivery from exactly-once effects at the source, processing, and sink boundaries.", explanation: ["A stream can receive an event more than once even when checkpointing is correct. Exactly-once business effects require compatible source, state, and sink semantics plus an idempotent or transactional write design.", "Describe the guarantee in operational terms: what may repeat, what cannot be duplicated, and how a replay converges. Do not infer end-to-end exactly-once from a single connector option."] },
    { summary: "Use lag, backpressure, and capacity metrics to decide whether a Kafka stream is late because of input, processing, or resources.", explanation: ["Consumer lag shows distance from the source, while batch duration, input rate, and resource metrics explain whether the stream can catch up. Backpressure changes intake behavior but does not repair a malformed or slow transformation.", "Set alerts against the freshness SLO and identify the owner for source, compute, and sink. Scale only after the bottleneck and the cost of catching up are understood."] },
  ],
  m16: [
    { summary: "Separate Change Data Feed, generic CDC, and the downstream table's change semantics before choosing a pattern.", explanation: ["CDC describes the propagation of inserts, updates, and deletes; Delta Change Data Feed exposes row changes between table versions; the downstream design still decides ordering, keys, and history.", "Document the source contract, retention window, and consumer replay needs. A feed is useful only when the consumer can identify the correct version and apply it deterministically."] },
    { summary: "Use change types and commit versions to reconstruct what changed without confusing transaction order with business event time.", explanation: ["Change records identify whether a row was inserted, updated, or deleted and associate it with a Delta commit. Commit order is durable table history, but it may not equal the order in which business events occurred.", "Keep commit metadata and source sequence where available. Reconcile gaps, deletes, and duplicate changes before publishing a downstream current-state or history table."] },
    { summary: "Choose stable keys and sequence_by rules so CDC updates converge when events arrive out of order.", explanation: ["The key identifies the entity being changed; sequence_by identifies which change wins when several records compete. Without both, a late update can overwrite a newer state.", "Test equal sequences, missing keys, deletes, and late records. The rule must be explicit enough that a replay produces the same current state and history."] },
    { summary: "Use AUTO CDC and the current pipeline semantics while recognizing the former APPLY CHANGES terminology.", explanation: ["AUTO CDC expresses how change records should be applied and can manage ordering and SCD behavior within the supported pipeline model. Older material may call the pattern APPLY CHANGES, but the decision remains about keys, sequence, and deletes.", "Verify the supported syntax and capabilities for the runtime in use. Keep the migration boundary documented so code, runbooks, and exam vocabulary do not diverge."] },
    { summary: "Choose SCD type 1, SCD type 2, or delete behavior from the consumer's need for current state and history.", explanation: ["SCD type 1 keeps the latest value, while type 2 preserves effective periods and prior versions. Deletes require a business rule: remove, mark inactive, or retain a tombstone.", "Define validity intervals, keys, sequence, and retention before implementing. Validate current-state queries and historical queries separately because they have different correctness contracts."] },
  ],
  m17: [
    { summary: "Define a streaming SLA with measurable freshness, completeness, availability, and recovery targets.", explanation: ["A production streaming promise should state how late an event may be, how quickly it becomes consumable, what completeness means, and how long recovery may take.", "Tie each target to a metric and a responsible owner. Avoid saying real time when the system has no agreed measurement from source arrival to published output."] },
    { summary: "Design event partitions and keys for both throughput and the ordering needed by the business entity.", explanation: ["Partitioning controls parallelism and affects ordering; a key that concentrates traffic can create hot partitions, while a random key may destroy per-entity sequence.", "Use source volume and cardinality evidence to choose the key, then test peak traffic, skew, replay, and a changed partition count before declaring the design ready."] },
    { summary: "Combine state, CDC, and quality rules without allowing late or invalid events to become invisible failures.", explanation: ["A streaming project must define how state is bounded, how changes are ordered, and how invalid events are observed or quarantined. These controls interact with freshness and recovery.", "Expose rejected counts, rescued data, state growth, and applied versions. The gold result should be explainable from the accepted source events and the rules that excluded others."] },
    { summary: "Build observability and alerts around the SLA symptoms that operators can act on.", explanation: ["Useful signals include input rate, lag, batch duration, watermark, state size, output freshness, error rate, and checkpoint health. A dashboard without thresholds or owners does not operate the stream.", "Alert on sustained breach or trend, include run and target context, and link to a runbook. Keep sensitive payloads out of broad operational views."] },
    { summary: "Run a game day that proves failure, recovery, replay, and communication instead of only measuring the happy path.", explanation: ["Inject a controlled source delay, sink failure, permission issue, or malformed event and record how the system detects and recovers. Preserve checkpoints and evidence so the exercise can be repeated safely.", "Close the loop with time-to-detect, time-to-recover, duplicate checks, and a post-incident action list. Production readiness is demonstrated by recovery behavior, not by a diagram."] },
  ],
  m18: [
    { summary: "Use Spark Declarative Pipelines and Lakeflow to declare datasets and dependencies instead of hand-building every orchestration step.", explanation: ["The declarative model describes what tables or views should exist and how they depend on inputs; the framework manages graph evaluation and incremental execution within its supported boundaries.", "Keep the distinction clear between the Spark Declarative Pipelines framework and managed Lakeflow capabilities. Choose the layer that owns the data graph and leave external workflow concerns to Jobs."] },
    { summary: "Read the declarative graph as a contract for datasets, dependencies, refresh behavior, and ownership.", explanation: ["A graph should expose which inputs feed each dataset, which transformations are incremental, and what downstream consumers can expect. It should not hide side effects or duplicate an external orchestration DAG.", "Use stable names and explicit boundaries. Validate lineage and update behavior after a change so the graph remains a reliable source of truth."] },
    { summary: "Choose streaming tables or materialized views from input semantics, freshness, state, and consumer needs.", explanation: ["Streaming tables process incremental input with checkpointed state; materialized views maintain a query result according to the supported refresh model. The choice changes recovery, latency, and cost behavior.", "State the freshness and update contract before selecting the dataset type. Test initial load, incremental update, schema change, and restart with the same evidence expected in production."] },
    { summary: "Use Python and SQL where each expresses the declarative transformation clearly and remains reviewable.", explanation: ["SQL can state relational intent compactly, while Python can express reusable logic and framework decorators. Mixing languages is fine when the boundary and dependencies remain explicit.", "Keep credentials, arbitrary side effects, and environment-specific paths out of dataset definitions. Review the generated graph and test the code with representative schema and quality failures."] },
    { summary: "Select serverless or another execution mode by compatibility, governance, cost, and the pipeline's operational boundary.", explanation: ["Managed execution can simplify provisioning and scaling, while other modes may be required for compatibility or network constraints. Execution mode does not remove the need for permissions, checkpoints, and evidence.", "Use the smallest compatible mode, verify access to source and target, and compare runtime metrics with freshness and cost. Document any feature or cloud limitation that changes the design."] },
  ],
  m19: [
    { summary: "Translate data quality dimensions into contracts for validity, completeness, uniqueness, timeliness, and consistency.", explanation: ["A quality rule is useful when it names the invariant, the affected dataset, the action on failure, and the evidence an operator will inspect. Different consumers may need different thresholds.", "Place checks at the boundary where the invariant becomes knowable. Keep the failing records or reason available when the team needs to repair and replay them."] },
    { summary: "Use EXPECT as an observable rule when invalid records should be measured without stopping the pipeline.", explanation: ["An expectation can count violations and expose quality drift while allowing the update to continue. Observation is appropriate only when downstream consumers can tolerate the invalid rows or a later boundary removes them.", "Track input, valid, and invalid counts by update. Treat a rising violation rate as an operational signal rather than hiding it inside a green run."] },
    { summary: "Use EXPECT OR DROP when invalid records must not reach the target but the valid stream should continue.", explanation: ["Dropping a record is a data decision, so the pipeline must make the reason and count visible and preserve a recovery path where the business requires it.", "Choose the rule from the target contract, not from convenience. Test all-invalid input, a mixed batch, and a rerun to verify that cleanup and observability remain correct."] },
    { summary: "Use EXPECT OR FAIL when violating the contract makes the published dataset unsafe or misleading.", explanation: ["Failing the update protects consumers when an invariant is fundamental, such as a required key or an impossible amount. It also creates an operational incident that needs ownership and recovery.", "Pair the failure with alerting, evidence, and a repair path. Do not choose fail for every minor issue or drop for a critical contract simply to keep the schedule green."] },
    { summary: "Build quarantine and event-log views so quality failures are traceable, repairable, and measurable over time.", explanation: ["Quarantine preserves rejected records with rule, update, source, and timestamp context; event logs provide operational evidence about updates and expectations. Together they separate remediation from the published path.", "Give operators a way to inspect trends, correct data, and replay only the affected scope. Protect sensitive fields while keeping enough evidence to explain the decision."] },
  ],
  m20: [
    { summary: "Use If/else tasks to branch on small, explicit decisions produced by an earlier validation or control step.", explanation: ["A branch should depend on a documented scalar condition such as a quality status, row count, or environment flag. It should not hide a second workflow inside an opaque notebook.", "Publish the value with clear type and scope, define both branches, and test missing or unexpected values. The run graph should show why publication or containment occurred."] },
    { summary: "Use For each tasks with bounded concurrency and independent inputs, not as a shortcut for an unmodeled dependency graph.", explanation: ["For each can fan out work across regions, dates, or entities when iterations are isolated and idempotent. Unlimited parallelism can overload APIs, compute, or downstream tables.", "Define the item schema, maximum concurrency, retry behavior, and aggregation of results. Preserve enough context to repair only the failed iterations without rerunning successful ones."] },
    { summary: "Use Run job tasks and modularity to compose workflows while preserving ownership and observable contracts.", explanation: ["A child job should own a coherent reusable operation with its own parameters, permissions, and run evidence. Calling it from a parent does not transfer its data implicitly.", "Pass small controlled parameters, persist larger outputs, and document the parent-child dependency. Avoid circular orchestration and make failure ownership unambiguous."] },
    { summary: "Apply retries, repairs, and parameter overrides only when the failed scope and idempotency contract are understood.", explanation: ["A repair run can rerun failed tasks without repeating successful work, while an override changes context and can invalidate the original evidence. Both are operational actions, not generic reset buttons.", "Preserve the original run, identify the exact failed subset, and record why the repair is safe. Never override a business window or target without checking its effect on downstream state."] },
    { summary: "Control concurrency and queueing as part of reliability, cost, and downstream capacity management.", explanation: ["Parallel tasks reduce elapsed time only when dependencies, APIs, compute, and sinks can handle the load. Queueing and limits protect the platform but can change freshness and retry timing.", "Set a bounded concurrency policy, observe queue and task duration, and alert on sustained backlog. Tune the graph and resource limits together rather than adding workers without evidence."] },
  ],
  m21: [
    { summary: "Choose schedules and time zones from the business window, data availability, and the operator's real calendar.", explanation: ["A schedule is a contract about when a run should start, not a guarantee that the source or compute is ready. Time zones, daylight-saving changes, and missed runs can alter the effective window.", "Store the business timezone explicitly, test boundary dates, and make the processing window an observable parameter. A production schedule should explain what happens after a delay or overlap."] },
    { summary: "Use file-arrival and table-update triggers when the data event, not the clock, should start processing.", explanation: ["File-arrival triggers react to new landing data, while table-update triggers react to changes in a governed table. Both avoid polling blindly, but they depend on stable permissions and source semantics.", "Define whether one event starts one run, how bursts are coalesced, and how duplicate notifications are handled. Measure freshness from source event to published result."] },
    { summary: "Distinguish continuous and triggered pipelines by freshness, resource lifetime, and the recovery model they require.", explanation: ["A continuous pipeline keeps processing while a triggered update runs a bounded increment. Continuous execution can reduce startup delay but increases idle exposure and operational responsibility.", "Choose from the SLA and arrival pattern, then validate checkpoint, deployment, and failure behavior. A triggered design is not automatically batch if it processes incrementally."] },
    { summary: "Plan backfills as controlled processing windows that reuse the production contract without competing with daily runs.", explanation: ["A backfill needs explicit start and end boundaries, idempotent writes, capacity limits, and a decision about how it interacts with current data. Copying a notebook for history creates a second implementation to maintain.", "Use the same artifact with a backfill mode, isolate or coordinate its target, and record the range, run, and validation evidence. Repair only the affected window when possible."] },
    { summary: "Make alerts and webhooks actionable by connecting symptoms, run context, ownership, and a safe next step.", explanation: ["An alert should identify the breached SLO, dataset or task, run, time window, and severity. A webhook or notification without an owner and response procedure merely moves noise to another system.", "Define thresholds from normal behavior, suppress duplicates, and link the runbook. Keep sensitive payloads out of broad notifications while preserving enough context to investigate."] },
  ],
  m22: [
    { summary: "Design the declarative pipeline architecture around dataset boundaries, dependencies, consumers, and operational ownership.", explanation: ["The graph should show which sources feed bronze, silver, and gold datasets, where quality is enforced, and which outputs are published. External orchestration should wrap the pipeline rather than duplicate every internal dependency.", "Start from the consumer contract and recovery path. Name the owner for each boundary and validate lineage, refresh behavior, and permissions before adding more datasets."] },
    { summary: "Implement the pipeline declaratively so code states the intended datasets while the framework manages incremental execution.", explanation: ["A declarative definition expresses tables, views, transformations, and dependencies instead of manually sequencing every update. The result remains a program with contracts, versioning, and failure behavior.", "Keep definitions deterministic and environment-aware without embedding secrets or side effects. Review the graph and test initial creation, incremental updates, schema change, and restart."] },
    { summary: "Combine expectations and quarantine so quality gates protect published data without losing repairable input.", explanation: ["Critical invariants can fail an update, while recoverable violations can be dropped into a traced quarantine. The action must match the consumer risk and preserve evidence for remediation.", "Measure accepted, rejected, and quarantined rows by update. A quality gate is complete only when an operator can locate the failure, correct the source, and replay the affected scope."] },
    { summary: "Wrap the pipeline with a job that supplies parameters, validates results, controls publication, and handles deployment boundaries.", explanation: ["Lakeflow Jobs can coordinate prechecks, pipeline updates, post-update validation, notifications, and backfills without recreating the dataset graph. The wrapper owns external operational flow; the pipeline owns its datasets.", "Pass explicit environment and business-window parameters, read event evidence, and make publication conditional on quality. Keep identity and permissions least-privileged at both layers."] },
    { summary: "Test operational behavior, not only transformations, before calling the pipeline ready for production.", explanation: ["A useful test set includes replay, schema evolution, expectation failure, source delay, sink failure, checkpoint recovery, permissions, cost limits, and concurrent updates. Happy-path output is only one signal.", "Capture run history, event logs, metrics, and recovery time. Turn failures into a runbook with symptoms, safe decisions, rollback limits, and clear ownership."] },
  ],
  m23: [
    { summary: "Use physical plans and stage metrics to locate the actual Spark bottleneck before tuning configuration.", explanation: ["The plan identifies scans, exchanges, joins, and operators; stage metrics reveal task duration, input, shuffle, spill, and executor behavior. Together they connect code shape to runtime cost.", "Form a hypothesis, change one relevant factor, and compare the same workload. A faster sample that changes input or caching conditions is not reliable evidence."] },
    { summary: "Diagnose skew and adaptive query execution as data-distribution problems rather than simply adding compute.", explanation: ["Skew creates a few oversized tasks when key frequencies are uneven. Adaptive query execution can adjust some decisions at runtime, but it cannot make a pathological business key uniform by itself.", "Inspect partition and task distributions, identify the hot keys, and choose salting, pre-aggregation, a different join shape, or a bounded exception with evidence."] },
    { summary: "Choose broadcast or sort-merge joins using size, statistics, key distribution, and executor memory.", explanation: ["Broadcast avoids a large shuffle when one side is reliably small; sort-merge is safer for large relations but can still spill or suffer skew. The physical operator should match the observed input.", "Check statistics and plan output before forcing a strategy. Validate wall time, shuffle, memory, and correctness after the change, including when the small side grows."] },
    { summary: "Tune shuffle partitions and file sizing together so parallelism does not create a small-file or scheduling problem.", explanation: ["Too few shuffle partitions make tasks heavy; too many increase scheduling overhead and can publish many tiny files. The right target depends on data volume, cluster capacity, and downstream layout.", "Measure task size and output files, then tune the boundary that caused the problem. Preserve a baseline and validate read performance after writing, not only the producing job."] },
    { summary: "Treat Python UDFs, Pandas UDFs, and serialization as execution boundaries with measurable cost.", explanation: ["Native Spark expressions expose more information to the optimizer. Python boundaries can add serialization, worker startup, and memory pressure, while Pandas UDFs change batching and type behavior.", "Use a UDF when its semantics are necessary, isolate it, and compare it with native alternatives. Test nulls, schema, batch size, and failure behavior rather than optimizing only a microbenchmark."] },
  ],
  m24: [
    { summary: "Use Photon when its supported execution path matches the workload and the measured benefit justifies the mode.", explanation: ["Photon accelerates compatible SQL and Spark operations through a vectorized engine, but unsupported operations or bottlenecks elsewhere can limit the benefit.", "Compare the same query with plan, runtime, and cost evidence. Do not treat Photon as a substitute for fixing skew, excessive data movement, or an incorrect table layout."] },
    { summary: "Use statistics and data skipping to reduce the files and rows a query must inspect.", explanation: ["Data skipping relies on file-level statistics and predicates that let the engine avoid irrelevant data. It is strongest when filters align with the values and layout actually stored.", "Inspect query plans and file statistics, then validate selectivity on representative data. A predicate that looks selective may still scan broadly if statistics or layout do not support it."] },
    { summary: "Treat traditional partitioning as a bounded layout decision with costs for fragmentation and maintenance.", explanation: ["Partitioning can prune large ranges when the partition column has suitable cardinality, but high-cardinality or tiny partitions create small files and expensive management.", "Choose a partition key from query and arrival patterns, measure file sizes, and avoid using partitions as a replacement for clustering or proper predicates."] },
    { summary: "Use liquid clustering when query patterns and evolving data distribution need layout maintenance without fixed partitions.", explanation: ["Liquid clustering organizes data around chosen clustering keys and can adapt as the table changes. It reduces the need to commit to a rigid partition layout, but it still consumes compute and requires a workload rationale.", "Select keys that match frequent filters and joins, inspect clustering and skipping evidence, and measure maintenance cost. Revisit the keys when consumer behavior changes."] },
    { summary: "Combine deletion vectors and predictive optimization with governance, retention, and measured table behavior.", explanation: ["Deletion vectors can represent row-level changes without rewriting every file, while predictive optimization can automate selected maintenance decisions. These features change storage and read behavior but do not remove retention obligations.", "Verify runtime and engine compatibility, monitor maintenance and query cost, and document how deletes, compaction, and historical recovery interact before enabling them broadly."] },
  ],
  m25: [
    { summary: "Relate DBUs, SKUs, and cloud charges to the workload value and resource behavior they represent.", explanation: ["A billing unit is an accounting measure, while a SKU and cloud charge describe the priced resource or service. None explains cost without time, workload, owner, and utilization context.", "Start with a baseline by workload and environment, then connect spend to freshness, throughput, reliability, and data movement. Optimize the cause rather than the label on the invoice."] },
    { summary: "Query system.billing.usage with time, workspace, resource, and identity dimensions that support a real decision.", explanation: ["Billing data becomes useful when filtered to a period and grouped by stable attributes such as job, warehouse, cluster, tags, or owner. A total monthly number cannot identify the action that changes cost.", "Reconcile usage with run history and workload output. Protect sensitive billing views and state which records or discounts are outside the analysis."] },
    { summary: "Use tags and chargeback to assign consumption without turning attribution into an uncontrolled source of personal data.", explanation: ["Tags can connect compute and jobs to team, product, environment, or cost center. They need a naming contract and enforcement so that missing or inconsistent tags do not distort accountability.", "Prefer group or service ownership over individual identifiers, validate propagation, and report unattributed spend as a control failure. Chargeback should support decisions, not punish exploratory work blindly."] },
    { summary: "Use compute policies and budgets as guardrails that prevent unsafe resource choices while preserving required workloads.", explanation: ["Policies constrain size, runtime, access mode, tags, and lifecycle; budgets or alerts surface spend before it becomes an incident. Guardrails work only when exceptions have an owner and an expiry.", "Choose defaults from measured workload needs, deny risky combinations, and review policy impact on latency and reliability. An over-restrictive policy can move cost into retries and queues."] },
    { summary: "Compare standard and performance-optimized modes using cost per useful result, not the hourly rate alone.", explanation: ["A performance mode can reduce elapsed time or resource usage for a compatible workload, while a cheaper standard mode may be sufficient for low urgency. The comparison needs the same input and target result.", "Measure runtime, retries, output quality, and total consumption. Keep the chosen mode documented and revisit it when data volume, SLA, or engine support changes."] },
  ],
  m26: [
    { summary: "Read Spark UI jobs, stages, and executors from the query plan down to the task distribution.", explanation: ["Jobs show action boundaries, stages show shuffle and dependency boundaries, and executors expose task, memory, and spill behavior. The slowest stage is a starting point, not automatically the root cause.", "Trace one run with a hypothesis and connect the UI evidence to code and input shape. Preserve the run ID and query so another engineer can reproduce the diagnosis."] },
    { summary: "Use Query Profile to inspect operators, data movement, and execution time for a specific query.", explanation: ["Query Profile provides an operator-level view that complements Spark UI and the physical plan. It can reveal scans, joins, exchanges, and filters that explain why a query consumes time or data.", "Compare the profile before and after a targeted change. Validate output equivalence and cost as well as elapsed time, especially when caching or data freshness can distort the result."] },
    { summary: "Use workflow system tables to join job runs, task timelines, retries, and ownership into an operational history.", explanation: ["System tables reveal patterns across runs that a single UI view cannot: queueing, task duration, retries, failures, and changes by environment or owner.", "Build queries that retain run, task, target, and time context. Limit access to operational and personal data, and publish redacted views when broader teams need the trend."] },
    { summary: "Combine event logs and cluster logs to distinguish workflow state, platform events, and Spark execution failures.", explanation: ["Event logs describe pipeline or framework updates, while cluster and executor logs contain runtime details. Lakeflow Jobs adds task and attempt context; these surfaces answer different questions.", "Start at the last successful boundary and follow the evidence to the failing component. Do not try to solve a permission error with Spark tuning or a driver failure with table history."] },
    { summary: "Automate diagnosis with CLI and REST only after the evidence, permissions, and retry behavior are defined.", explanation: ["CLI and REST can collect runs, configuration, logs, and metrics repeatedly, but automation can amplify load or expose sensitive data if it lacks scope and redaction.", "Use a least-privileged service identity, bounded queries, retries for transient calls, and stable output. The automation should link evidence to a runbook decision rather than create another opaque dashboard."] },
  ],
  m27: [
    { summary: "Triage a reliability or cost incident by impact, scope, freshness, data correctness, and reversibility.", explanation: ["Severity reflects user and data impact, not only a red status. First protect consumers and evidence, then decide whether to stop, contain, repair, or roll forward.", "Record the affected runs, datasets, owners, and time window. Avoid destructive cleanup until recovery and investigation requirements are clear."] },
    { summary: "Use competing hypotheses and evidence instead of changing code, compute, and layout at the same time.", explanation: ["A slow workload may come from skew, file size, a plan change, resource pressure, concurrency, or input growth. Each hypothesis predicts different signals in plans, system tables, and UI metrics.", "Test the smallest reversible change and compare against a baseline. Keep a decision log so the final fix can be explained and repeated."] },
    { summary: "Correct code and data layout only after the evidence identifies whether the defect is semantic, physical, or operational.", explanation: ["A wrong join can produce a correct-looking but inflated result; poor layout can make a correct query slow; a retry policy can multiply side effects. These problems require different fixes.", "Validate correctness first, then performance, then operational behavior. Re-run representative input and inspect both output and runtime evidence before promoting the change."] },
    { summary: "Right-size compute and cost controls while preserving the SLA and the capacity needed to recover.", explanation: ["Reducing workers during an incident may increase backlog and extend user impact, while adding capacity can hide a persistent plan or data problem. Cost decisions must include recovery and retry work.", "Compare cost per successful result, queueing, freshness, and failure rate. Remove temporary resources after stabilization and restore policy boundaries deliberately."] },
    { summary: "Write a postmortem that connects trigger, impact, detection, decisions, recovery, and preventive actions.", explanation: ["A useful postmortem distinguishes the baseline from the incident, preserves evidence, and explains why existing controls did or did not catch the problem. It should not become a blame narrative.", "Assign owners and due dates to prevention, alert, test, and runbook changes. Verify the fix with a replay or game day and record the remaining uncertainty."] },
  ],
  m28: [
    { summary: "Separate package structure, I/O, configuration, and transformations so Python code can be tested outside a notebook.", explanation: ["A src layout makes reusable code importable and keeps cloud paths, secrets, and runtime context at the boundary. Pure transformations are easier to reason about than functions that read and write implicitly.", "Define inputs, outputs, schema assumptions, and error behavior. The notebook or task should orchestrate the package, not contain the only copy of the business logic."] },
    { summary: "Build wheels with pinned dependencies and a compatible runtime so deployment is reproducible.", explanation: ["A wheel is an immutable artifact that can move through environments; pinned versions reduce surprise, but must remain compatible with the Databricks Runtime and Python version.", "Resolve dependencies in CI, record hashes or versions, and test installation in an isolated target. Never put credentials in package metadata or dependency URLs."] },
    { summary: "Write pure transform functions that expose data contracts instead of hiding Spark actions and side effects.", explanation: ["A pure transformation accepts a DataFrame and configuration and returns a predictable DataFrame, making schema and edge cases testable. Reads, writes, logging, and secrets belong at explicit boundaries.", "Test nulls, empty input, duplicates, and schema changes. Keep the function small enough that a failed assertion points to a business rule rather than an entire workflow."] },
    { summary: "Use assertDataFrameEqual and assertSchemaEqual to verify both data results and structural contracts.", explanation: ["Value equality checks whether rows and columns match the expected result; schema equality checks names, types, nullability, and sometimes metadata. A data test that ignores schema can let a breaking change pass.", "Build fixtures with representative edge cases and define ordering or set semantics explicitly. Keep tests deterministic and avoid depending on a live production table."] },
    { summary: "Layer unit, integration, and smoke tests so each catches a different failure boundary.", explanation: ["Unit tests isolate transformations, integration tests exercise real catalog, identity, and runtime contracts, and smoke tests confirm the deployed entry point works. None replaces the others.", "Use unique temporary resources and clean only what the test owns. Repeat the important path to prove idempotency and run the same validated artifact that production will use."] },
  ],
  m29: [
    { summary: "Structure bundle configuration and includes so code, artifacts, resources, permissions, and targets remain reviewable.", explanation: ["A bundle should express a coherent project without becoming one unmanageable YAML file. Includes and variables separate jobs, pipelines, artifacts, and environment differences while preserving one source of truth.", "Keep target-specific values explicit and avoid hard-coded workspace IDs or secrets. Review the resolved configuration before allowing deployment."] },
    { summary: "Define jobs and pipelines as resources that reference versioned code and stable project boundaries.", explanation: ["Resource definitions connect Lakeflow Jobs, pipelines, notebooks, wheels, and permissions into a deployable unit. References should resolve through the bundle rather than relying on copied IDs.", "Give each resource one owner and test dependency, identity, compute, and cleanup behavior. A bundle is not a license for two systems to manage the same job."] },
    { summary: "Use variables, substitutions, and targets to express real environment differences without forking the application.", explanation: ["Targets select workspace, catalog, schema, identity, and runtime values; substitutions connect resources within the same project. They should vary configuration, not business logic.", "Validate required variables and their types, keep secrets in CI or governed configuration, and show the resolved target in deployment evidence."] },
    { summary: "Treat validate, deploy, and run as separate actions with separate evidence and approval boundaries.", explanation: ["Validate checks configuration and schema, deploy applies resources and artifacts, and run executes a deployed resource. A successful validation does not prove that the workload ran correctly.", "Capture the plan, require review for destructive changes, deploy the same artifact, and perform a smoke test with the target identity. Keep rollback options visible before applying changes."] },
    { summary: "Build CI/CD around service identity, protected environments, artifact promotion, and reversible change.", explanation: ["CI should build and test the artifact, validate and plan in a safe target, then promote the same artifact with a workload identity limited to the destination. Personal tokens are not a production ownership model.", "Require approval for production, prevent unmanaged drift, and log commit, target, identity, and result. Rollback must consider code, schema, data, and triggers together."] },
  ],
  m30: [
    { summary: "Apply the privilege model and inheritance deliberately across catalogs, schemas, objects, and workspaces.", explanation: ["Inheritance simplifies grants but can make a broad parent privilege affect more data than intended. Ownership, groups, service principals, and workspace bindings determine who can administer or use a resource.", "Model allowed and denied paths, then test with the actual runtime identities. Keep administrative ownership separate from application access and review changes through audit evidence."] },
    { summary: "Use workspace ACLs and securables together so workspace collaboration does not bypass data governance.", explanation: ["Workspace permissions control notebooks, jobs, folders, and other workspace objects; Unity Catalog privileges control governed data and resources. Access to one does not automatically justify access to the other.", "Define the user and service boundary for each operation and verify that a notebook cannot grant more data access than its identity already has. Document cross-workspace and catalog bindings."] },
    { summary: "Apply row filters and column masks at the governed data boundary when consumers need different views of sensitive data.", explanation: ["Row filters restrict which records a principal can see, while column masks transform or hide sensitive values. Centralized policies reduce copy-pasted security logic but must remain understandable to consumers.", "Test representative roles, joins, null behavior, and privileged access. Verify that derived tables, exports, and caches do not create an unprotected copy of the sensitive field."] },
    { summary: "Use ABAC and centralized policies when classification, tags, and reusable attributes provide a safer control than per-table grants.", explanation: ["Attribute-based access control can express policy from data and identity attributes, reducing repetitive object-specific rules. It still needs clear ownership, precedence, testing, and an exception process.", "Start with a small policy, observe allowed and denied decisions, and audit the attributes that caused the result. Avoid a central policy whose logic no team can explain or safely change."] },
    { summary: "Treat PII, tokenization, retention, deletion, and audit as one lifecycle rather than isolated privacy features.", explanation: ["Privacy protection covers collection, use, sharing, retention, and purge. Tokenization or masking reduces exposure but does not remove obligations around lineage, access, or deletion.", "Define the subject or business key, retention clock, legal hold behavior, and evidence of purge. Keep audit views useful without exposing the raw sensitive value to investigators who do not need it."] },
  ],
  m31: [
    { summary: "Choose OpenSharing, shares, and recipients from data ownership, consumer capability, movement, and governance requirements.", explanation: ["A share defines what a provider exposes and a recipient defines who can use it. Sharing can reduce copies, but access, revocation, schema evolution, and audit remain part of the contract.", "Name the provider, recipient, objects, refresh expectations, and offboarding path. Test the recipient's actual query and ensure sensitive metadata is not exposed accidentally."] },
    { summary: "Compare Databricks-to-Databricks sharing with the permissions and operational model available to both workspaces.", explanation: ["Native sharing can preserve governed access and efficient exchange when both parties support the required capabilities. It does not remove the need to align identities, regions, versions, and data contracts.", "Validate access from the recipient boundary and document ownership of schema changes, support, cost, and revocation. Avoid copying data just because sharing was not modeled precisely."] },
    { summary: "Use Databricks-to-Open sharing and OIDC when an external consumer needs an interoperable, identity-aware data boundary.", explanation: ["Open protocols broaden interoperability, while OIDC can provide short-lived identity assertions instead of shared long-lived secrets. The provider still controls the share and its audit perimeter.", "Check token audience, expiry, recipient scope, network, and revocation behavior. Test the external client with least privilege and record which objects and versions were consumed."] },
    { summary: "Use Lakehouse Federation and connections when querying external data in place is preferable to copying it into the lakehouse.", explanation: ["Federation exposes external sources through governed connections and can push filters or projections down to reduce movement. The source remains responsible for availability and some performance behavior.", "Evaluate latency, pushdown support, credentials, concurrency, and failure semantics. A federated table should not be used for a workload whose SLA requires a durable local snapshot without acknowledging that tradeoff."] },
    { summary: "Choose sharing, federation, or ingestion with a matrix for movement, freshness, control, cost, and recovery.", explanation: ["Sharing is useful when the provider owns the data product, federation when queries can stay near the source, and ingestion when local performance, transformation, or resilience requires a copy.", "Write the decision and its exit criteria: what source or SLA change would justify moving to another pattern. Keep lineage, ownership, and deletion obligations visible in every option."] },
  ],
  m32: [
    { summary: "Turn the Professional brief and non-functional requirements into an architecture that can be defended with evidence.", explanation: ["The capstone must connect batch, streaming or CDC, governance, security, interoperability, CI/CD, performance, cost, and operations. NFRs make tradeoffs explicit instead of rewarding a diagram with every feature.", "State the consumer, SLA, failure budget, privacy boundary, ownership, and recovery path before selecting services. Each major decision should map to a test, metric, permission, or source."] },
    { summary: "Integrate batch and streaming pipelines around shared contracts, keys, quality rules, and consumption semantics.", explanation: ["A production platform may combine batch snapshots, incremental files, streams, and CDC. The integration boundary must define identity, ordering, schema evolution, deduplication, and how current and historical views are reconciled.", "Use common contracts and idempotent publication rather than separate special-case code. Demonstrate replay, late data, backfill, and a controlled handoff to downstream consumers."] },
    { summary: "Converge security, interoperability, and CI/CD so delivery does not weaken the platform's data perimeter.", explanation: ["The final design should show least-privilege identities, sensitive-data controls, sharing or federation boundaries, tested artifacts, and protected environment promotion. These are connected controls, not independent checkboxes.", "Trace one change from review to deployment to runtime access and audit. Confirm that rollback, revocation, schema change, and incident response remain possible after release."] },
    { summary: "Use a game day, FinOps review, and postmortem to prove the platform can survive real operational pressure.", explanation: ["Exercise delayed input, failed tasks, bad permissions, data-quality violations, capacity pressure, and a cost spike. Observe detection, containment, recovery, duplicate behavior, and communication.", "Compare SLA and cost before and after recovery, remove temporary access or resources, and turn findings into owned preventive actions. Readiness is the evidence pack, not the successful demo alone."] },
    { summary: "Defend the design and use the Professional practice exam to measure scenario reasoning across all domains.", explanation: ["A strong defense explains why each capability belongs at its boundary, which alternative was rejected, how it fails, and what signal proves it works. The answer should remain coherent when volume, latency, cost, or compliance constraints change.", "Review practice errors by domain and tradeoff, return to the relevant evidence, and answer a variant. The original exam is a readiness tool, not a guarantee of certification, so keep the reasoning and sources visible."] },
  ],
};

const glossaryCategoryEn: Record<string, string> = {
  plataforma: "Platform",
  gobierno: "Governance",
  almacenamiento: "Storage",
  ingesta: "Ingestion",
  streaming: "Streaming",
  orquestacion: "Orchestration",
  rendimiento: "Performance",
  desarrollo: "Development",
  seguridad: "Security",
  coste: "Cost",
};

const exactTextEn: Record<string, string> = {
  "Modelo mental": "Mental model",
  "Implementación": "Implementation",
  "Operación": "Operations",
  "Diagnóstico": "Diagnosis",
  "Decisión de diseño": "Design decision",
  "Módulo": "Module",
  "Lección": "Lesson",
  "Notebook comunitario": "Community notebook",
  "Evaluación": "Assessment",
  "Inicial": "Beginner",
  "Intermedio": "Intermediate",
  "Avanzado": "Advanced",
  "Superado": "Passed",
  "En curso": "In progress",
  "Disponible": "Available",
  "Vista previa": "Preview",
  "Contenido abierto": "Open content",
  "Responde las cuatro preguntas. Necesitas al menos tres respuestas correctas.": "Answer the four questions. You need at least three correct answers.",
  "Responde las cuatro preguntas. Necesitas al menos un 75 %.": "Answer the four questions. You need at least 75%.",
  "Completa el intento y alcanza al menos el 80 %. Puedes repetirlo sin límite.": "Complete the attempt and reach at least 80%. You can retake it without limit.",
  "Completa todas las preguntas. El resultado de referencia es el 80 %.": "Complete all questions. The reference score is 80%.",
};

export function localizeText(value: string, locale: Locale): string {
  if (locale === "es") return value;
  if (exactTextEn[value]) return exactTextEn[value];
  return "Review the Databricks requirement, choose the smallest governed pattern that satisfies it, and keep evidence for reruns, access, and operations.";
}

function lowerFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase("en")}${value.slice(1)}` : value;
}

export function localizeReviewDate(value: string | null, locale: Locale): string | null {
  if (locale === "es" || !value) return value;
  return value
    .replace("24 de julio de 2026", "July 24, 2026")
    .replace("23 de julio de 2026", "July 23, 2026")
    .replace("21 de julio de 2026", "July 21, 2026")
    .replace("24 jul 2026", "Jul 24, 2026")
    .replace("23 jul 2026", "Jul 23, 2026")
    .replace("21 jul 2026", "Jul 21, 2026");
}

function englishLessonCopy(moduleId: string, moduleCopy: ModuleCopy, index: number): LessonCopy {
  const title = lessonTitlesEn[moduleId]?.[index] ?? `${moduleCopy.short} decision ${index + 1}`;
  const outcome = moduleCopy.outcomes[index % moduleCopy.outcomes.length] ?? moduleCopy.description;
  const narrative = englishLessonNarratives[moduleId]?.[index];
  return {
    title,
    summary: narrative?.summary ?? `${title} explains how to ${lowerFirst(outcome)} in a Databricks lakehouse without relying on hidden state or manual recovery.`,
  };
}

function englishConcepts(title: string, moduleCopy: ModuleCopy, index: number): Lesson["deepDive"]["concepts"] {
  const focus = moduleCopy.outcomes[index % moduleCopy.outcomes.length] ?? moduleCopy.description;
  return [
    {
      term: title,
      definition: `The lesson focus inside ${moduleCopy.title}: the specific Databricks capability, boundary, or design choice being evaluated.`,
      whyItMatters: `It prevents treating ${moduleCopy.short} as a checklist and instead connects the feature to a workload, owner, and evidence.`,
    },
    {
      term: `${moduleCopy.short} contract`,
      definition: `The explicit statement of inputs, outputs, permissions, runtime assumptions, and failure behavior for this part of the module.`,
      whyItMatters: `A clear contract makes retries, handoffs, and exam scenario decisions defensible instead of accidental.`,
    },
    {
      term: `${moduleCopy.short} evidence`,
      definition: `The observable proof that the chosen pattern satisfies ${lowerFirst(focus)}.`,
      whyItMatters: `Evidence is what separates a correct lakehouse design from a diagram that cannot be operated or audited.`,
    },
  ];
}

function englishDeepDive(title: string, moduleCopy: ModuleCopy, index: number): Lesson["deepDive"] {
  const primary = moduleCopy.outcomes[index % moduleCopy.outcomes.length] ?? moduleCopy.description;
  const secondary = moduleCopy.outcomes[(index + 1) % moduleCopy.outcomes.length] ?? moduleCopy.description;
  return {
    mentalModel: `${title} is a decision point in ${moduleCopy.title}. Start from the workload contract, then decide which Databricks surface, data object, runtime mode, or governance boundary should own the behavior. A good answer names the tradeoff, the operational signal, and the recovery path.`,
    mechanics: [
      `Mechanically, identify the input shape, freshness target, ownership boundary, and minimum privileges before choosing an implementation. Then map the decision to the module goal: ${lowerFirst(primary)}.`,
      `After implementation, validate the result with observable evidence: schema, counts, lineage, runtime metrics, costs, or a rerun. If the evidence does not support ${lowerFirst(secondary)}, revisit the design before scaling resources.`,
    ],
    concepts: englishConcepts(title, moduleCopy, index),
    workedScenario: {
      situation: `A team needs to apply ${title.toLocaleLowerCase("en")} while keeping the ${moduleCopy.short} workload reliable and reviewable.`,
      reasoning: [
        `First classify the requirement: data contract, execution behavior, governance, performance, cost, or recovery.`,
        `Next choose the Databricks capability that satisfies the requirement with the fewest manual steps and the clearest owner.`,
        `Finally capture evidence that the decision can be repeated: configuration, query result, metric, audit record, or run output.`,
      ],
      outcome: `The team can explain why the selected ${moduleCopy.short} pattern is correct, how it fails safely, and what signal proves it is working.`,
    },
  };
}

function englishKeyPoints(title: string, moduleCopy: ModuleCopy, index: number): Lesson["keyPoints"] {
  const outcome = moduleCopy.outcomes[index % moduleCopy.outcomes.length] ?? moduleCopy.description;
  return [
    `Use ${title} to support a concrete workload requirement, not as an isolated feature.`,
    `Connect the choice to ${lowerFirst(outcome)} and document the tradeoff you accepted.`,
    `Validate the decision with a rerunnable check, metric, permission review, or operational signal.`,
  ];
}

function englishDecisions(title: string, moduleCopy: ModuleCopy): string[] {
  return [
    `What workload or exam requirement makes ${title} the right focus?`,
    `Which Databricks object, runtime, or governance boundary should own the behavior?`,
    `What evidence would prove that the ${moduleCopy.short} decision is correct after a rerun or incident?`,
  ];
}

function englishPitfalls(title: string, moduleCopy: ModuleCopy): Lesson["pitfalls"] {
  return [
    `Treating ${title} as a generic best practice without tying it to a workload contract.`,
    `Changing compute, permissions, or pipeline state before preserving evidence for the ${moduleCopy.short} decision.`,
  ];
}

function englishExample(lesson: Lesson, title: string, moduleCopy: ModuleCopy): Lesson["example"] {
  return {
    ...lesson.example,
    title: `Minimal ${moduleCopy.short} check for ${title}`,
    note: `Use the snippet as a reading anchor. Before running anything, confirm the target catalog, schema, permissions, expected result, and cleanup path.`,
  };
}

function englishDomain(domain: string): string {
  return domain
    .replace("Todos los dominios Associate", "All Associate domains")
    .replace("Todos los dominios Professional", "All Professional domains")
    .replace("Arquitectura", "Architecture")
    .replace("Calidad", "Quality")
    .replace("OperaciÃ³n", "Operations")
    .replace("Operacion", "Operations")
    .replace("Rendimiento", "Performance")
    .replace("Coste", "Cost")
    .replace("Gobierno", "Governance")
    .replace("Seguridad", "Security")
    .replace("Ingesta", "Ingestion");
}

function englishLab(module: CurriculumModule, moduleCopy: ModuleCopy): CurriculumModule["lab"] {
  const schema = `main.lakehouse_lab_${module.id}`;
  return {
    ...module.lab,
    title: `${moduleCopy.short} guided lab`,
    goal: `Practice ${moduleCopy.outcomes.map(lowerFirst).join(", ")} with a small, isolated Databricks exercise.`,
    scenario: `You are asked to turn ${moduleCopy.title} into reproducible evidence for a reviewable lakehouse workload.`,
    freeEdition: {
      ...module.lab.freeEdition,
      note: module.lab.freeEdition.supported
        ? "Compatible with Databricks Free Edition within daily quotas and serverless limits."
        : "The full practice needs paid-workspace features. A reduced simulation preserves the learning objective.",
    },
    runtime: {
      free: "Databricks-managed serverless compute",
      classic: "Databricks Runtime 17.3 LTS with Apache Spark 4.0",
    },
    prerequisites: [
      module.lab.freeEdition.supported ? "Databricks Free Edition or an isolated enterprise workspace" : "Paid Databricks workspace for the full practice, or Free Edition for the reduced simulation",
      "Permission to create objects in a learning catalog or schema",
      "Practice data without personal or sensitive information",
    ],
    environment: module.lab.freeEdition.supported ? "Databricks Free Edition or an isolated enterprise workspace" : "Paid Databricks workspace; Free Edition only for the reduced simulation",
    compute: "Use the smallest compatible serverless or classic compute mode for this module, then document the runtime used.",
    permissions: [
      "USE CATALOG on the learning catalog",
      "USE SCHEMA and CREATE TABLE on the isolated lab schema",
      "CAN USE or CAN ATTACH TO only on the assigned compute resource",
    ],
    dataset: {
      name: `Synthetic dataset lakehouse_lab_${module.id}`,
      acquisition: "Generated by the lab scaffold; no private downloads, credentials, or personal data are required.",
    },
    reproducibility: {
      ...module.lab.reproducibility,
      note: "The procedure is specified for repeatable practice; keep run evidence, parameters, and cleanup output.",
    },
    deliberateFailure: {
      scenario: "Run once with the wrong catalog, schema, permission, or checkpoint boundary to observe a controlled failure.",
      recovery: "Correct the namespace or permission, preserve the failure evidence, and rerun from the idempotent cleanup point.",
    },
    estimatedCost: {
      ...module.lab.estimatedCost,
      free: "0 USD, subject to fair-use limits and daily quotas",
      assumptions: "Estimate assumes one small practice run, minimum compatible resources, and no taxes, discounts, or data-transfer charges.",
    },
    expectedOutcome: `A short evidence pack that proves the ${moduleCopy.short} decisions: configuration, output table or query result, validation check, and cleanup record.`,
    cleanup: [
      `DROP SCHEMA IF EXISTS ${schema} CASCADE;`,
      "Stop any jobs, pipelines, streams, or warehouses created for the practice.",
      "Delete temporary checkpoints, volumes, and cloud resources that use the lab prefix.",
    ],
    troubleshooting: [
      { symptom: "Object not found", fix: "Check catalog, schema, three-level names, and the active USE CATALOG / USE SCHEMA context." },
      { symptom: "Permission denied", fix: "Verify the minimum privilege for the object and compute surface instead of broadening access globally." },
      { symptom: "Output does not match", fix: "Restart from cleanup, validate the input contract, and rerun the steps in order." },
    ],
    steps: [
      `Create or select the isolated schema ${schema} and record the runtime.`,
      `Implement the smallest example that demonstrates ${lowerFirst(moduleCopy.outcomes[0])}.`,
      `Add a validation check for ${lowerFirst(moduleCopy.outcomes[1] ?? moduleCopy.description)}.`,
      `Capture the result, metric, permission, or lineage evidence that supports the design decision.`,
      "Run cleanup and confirm that rerunning the lab would not duplicate or leak data.",
    ],
    starterCode: `-- ${moduleCopy.title}\nCREATE SCHEMA IF NOT EXISTS ${schema};\nUSE SCHEMA ${schema};\n-- Add the module-specific objects and checks here.\nSELECT '${module.id}' AS module_id, current_timestamp() AS started_at;`,
    solution: `-- Sample solution outline for ${moduleCopy.title}\n-- 1. Create isolated objects in ${schema}.\n-- 2. Run the transformation or configuration that demonstrates the module decision.\n-- 3. Validate counts, schema, permissions, metrics, or lineage.\n-- 4. Record evidence and clean up temporary resources.\nSELECT '${moduleCopy.short}' AS focus, 'evidence captured' AS status;`,
    checks: module.lab.checks.map((_, index) => ({
      label: `Evidence check ${index + 1}: ${moduleCopy.outcomes[index % moduleCopy.outcomes.length]}`,
      pattern: ".*",
    })) as CurriculumModule["lab"]["checks"],
    expectedEvidence: [
      `Runtime and namespace used for ${moduleCopy.short}.`,
      "A query result, table sample, metric, or configuration screenshot that proves the selected pattern.",
      "Cleanup output or written note showing how the practice can be rerun safely.",
    ],
    cloudNotes: module.lab.cloudNotes.map((item) => ({
      ...item,
      note: `On ${item.cloud}, use an isolated workspace or Free Edition where available, keep credentials out of notebooks, and document any cloud-specific service limits.`,
    })),
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
    examDomains: module.examDomains.map(englishDomain),
    sources: module.sources.map((source, index) => ({
      ...source,
      label: index === 0 ? `Primary Databricks source for ${copy.title}` : `Supporting Databricks source ${index + 1} for ${copy.short}`,
      reviewedAt: localizeReviewDate(source.reviewedAt, locale) ?? source.reviewedAt,
    })),
    lessons: module.lessons.map((lesson, index) => localizeLesson(lesson, locale, copy, index)),
    lab: englishLab(module, copy),
    quiz: module.quiz.map((question, index) => localizeQuizQuestion(question, locale, index)),
  };
}

function localizeLesson(lesson: Lesson, locale: Locale, moduleCopy: ModuleCopy, index: number): Lesson {
  const moduleId = lesson.id.slice(0, 3);
  const copy = englishLessonCopy(moduleId, moduleCopy, index);
  const narrative = englishLessonNarratives[moduleId]?.[index];
  const fullContent = englishLessonContent[lesson.id];
  return {
    ...lesson,
    kicker: `Lesson ${index + 1}`,
    title: copy.title,
    summary: fullContent?.summary ?? copy.summary,
    decisions: fullContent?.decisions ?? englishDecisions(copy.title, moduleCopy),
    explanation: fullContent?.explanation ?? narrative?.explanation ?? [
      `${copy.summary} The important habit is to name the requirement before naming the tool: freshness, isolation, idempotency, governance, latency, cost, or recovery.`,
      `Apply the lesson by mapping the requirement to the smallest Databricks capability that satisfies it, then prove the choice with evidence. For ${moduleCopy.short}, that evidence should connect configuration, data output, access control, runtime behavior, and cleanup.`,
    ],
    deepDive: fullContent?.deepDive ?? englishDeepDive(copy.title, moduleCopy, index),
    keyPoints: fullContent?.keyPoints ?? englishKeyPoints(copy.title, moduleCopy, index),
    example: fullContent ? { ...lesson.example, ...fullContent.example } : englishExample(lesson, copy.title, moduleCopy),
    pitfalls: fullContent?.pitfalls ?? englishPitfalls(copy.title, moduleCopy),
    examDecision: fullContent?.examDecision ?? `In an exam or architecture review, choose the option that satisfies the stated ${moduleCopy.short} requirement while preserving governance, idempotency, and observable evidence.`,
    checkpoint: fullContent?.checkpoint ?? {
      question: `What must you prove after choosing a pattern for ${copy.title}?`,
      answer: `You must prove that the chosen pattern satisfies the workload contract and can be rerun, audited, and recovered without hidden manual state.`,
    },
  };
}

export function localizeQuizQuestion(question: QuizQuestion, locale: Locale, index = 0): QuizQuestion {
  if (locale === "es") return question;
  const moduleCopy = question.moduleId ? moduleCopyEn[question.moduleId] : null;
  const focus = moduleCopy?.short ?? englishDomain(question.domain || "Databricks");
  const outcome = moduleCopy?.outcomes[index % moduleCopy.outcomes.length] ?? "choose the governed, evidence-backed Databricks option";
  const correct = `Apply the ${focus} option that satisfies ${lowerFirst(outcome)} and preserves operational evidence.`;
  const distractors = [
    "Scale compute first and postpone validation until users report a problem.",
    "Bypass governance controls to make the implementation faster.",
    "Delete state, checkpoints, or history before proving the root cause.",
  ];
  const options = question.options.map((_, optionIndex) => optionIndex === question.answer
    ? correct
    : distractors.shift() ?? `Use a manual workaround for ${focus} without documenting evidence.`);
  return {
    ...question,
    question: moduleCopy
      ? `For ${moduleCopy.title}, which decision best fits the ${englishDomain(question.domain)} scenario?`
      : `Which answer best resolves this ${englishDomain(question.domain || "Databricks")} scenario?`,
    options,
    explanation: `The correct answer is the one that keeps the Databricks decision tied to the requirement, uses the smallest governed pattern, and leaves evidence for validation, reruns, and recovery.`,
    domain: englishDomain(question.domain),
  };
}

export function localizeResourceCatalog(resources: CommunityResourceCatalogEntry[], locale: Locale): CommunityResourceCatalogEntry[] {
  if (locale === "es") return resources;
  return resources.map((resource) => ({
    ...resource,
    reviewedAt: localizeReviewDate(resource.reviewedAt, locale) ?? resource.reviewedAt,
    summary: `Reviewed ${resource.format} resource for Databricks practice.`,
    concepts: resource.concepts.map((_, index) => {
      const primaryModule = resource.relatedModules[0];
      const focus = primaryModule ? moduleCopyEn[primaryModule.id]?.short : null;
      return `${focus ?? "Databricks"} concept ${index + 1}`;
    }),
    runtimeNotes: "Review the source repository requirements before running it.",
    usageInstructions: resource.usageInstructions.map((_, index) => `Review step ${index + 1} in the source repository.`),
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
  return locale === "en" ? glossaryCategoryEn[category] ?? category : category;
}

function englishGlossaryDefinition(entry: GlossaryEntry) {
  const category = localizeGlossaryCategory(entry.category, "en").toLocaleLowerCase("en");
  return `${entry.term} is a Databricks ${category} concept used to reason about platform design, data contracts, governance boundaries, or operational behavior in a lakehouse architecture.`;
}

function englishGlossaryWhy(entry: GlossaryEntry) {
  return `It matters because ${entry.term} affects how teams choose services, assign ownership, validate permissions, operate workloads, and answer scenario-based certification questions.`;
}

function englishAliases(aliases: string[]) {
  const spanishHints = /\b(cuenta|entorno|catalogo|catálogo|tabla|volumen|ingesta|coste|esquema|gestionada|externa|datos|calidad|gobierno|seguridad)\b/iu;
  return aliases.filter((alias) => !spanishHints.test(alias));
}

export function localizeGlossaryEntry(entry: GlossaryEntry, locale: Locale): GlossaryEntry {
  if (locale === "es") return entry;
  return {
    ...entry,
    aliases: englishAliases(entry.aliases),
    definition: englishGlossaryDefinition(entry),
    whyItMatters: englishGlossaryWhy(entry),
    related: entry.related.map((item) => exactTextEn[item] ?? item),
  };
}

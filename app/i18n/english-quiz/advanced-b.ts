import type { EnglishQuizCopyTable } from "./types";

export const englishQuizAdvancedB: EnglishQuizCopyTable = {
  "m23-q1": {
    question: "A stage shows high aggregate spill, but 98% of it comes from two tasks that also read ten times more shuffle data than the median. What is the soundest first action?",
    options: [
      "Permanently double every worker.",
      "Identify the keys in those partitions and check how AQE handles the skew.",
      "Disable AQE to stabilize the initial plan.",
      "Reduce `spark.sql.shuffle.partitions` to one.",
    ],
    explanation: "Concentration in two tasks points to partition skew. More global capacity can mask it, but it does not fix the distribution.",
  },
  "m23-q2": {
    question: "A filtered dimension takes 80 MB and is stable; the fact table holds 4 TB. Statistics are current and the join type supports broadcasting. Which plan avoids the most data movement?",
    options: [
      "A cross join followed by a filter.",
      "Repartition both sides into a single partition.",
      "Persist the entire fact table before every run.",
      "A broadcast hash join of the projected dimension.",
    ],
    explanation: "Broadcasting the small, bounded relation avoids shuffling the fact table; projecting it also reduces the replicated memory footprint.",
  },
  "m23-q3": {
    question: "Which of the following is a real capability of AQE in Databricks?",
    options: [
      "Coalescing small post-shuffle partitions using runtime statistics.",
      "Arbitrarily reordering every join while the query runs.",
      "Converting a stateful streaming transformation into batch.",
      "Removing the need for statistics and observability.",
    ],
    explanation: "AQE can coalesce partitions, switch certain strategies, handle skew, and propagate empty relations; it does not redesign the whole query.",
  },
  "m23-q4": {
    question: "A pipeline uses a scalar Python UDF to normalize a date that `to_date` and `date_trunc` can already handle. Which change usually improves both performance and explainability?",
    options: [
      "Increase driver memory without changing the code.",
      "Convert every row to pandas and back to Spark.",
      "Replace the UDF with native functions and verify the plan.",
      "Add a `collect()` before the UDF.",
    ],
    explanation: "Native functions avoid the Python/JVM boundary and keep the expression visible to Catalyst and Photon.",
  },
  "m24-q1": {
    question: "A query runs on Photon, but the profile shows a fallback around a Python transformation. What is the best first improvement?",
    options: [
      "Change the table format from Delta to CSV.",
      "Disable Photon so the plan is uniform.",
      "Replace the UDF with native functions if an equivalent exists.",
      "Shrink the warehouse to a single unit.",
    ],
    explanation: "Native functions keep the operation visible and compatible with the engine; scaling does not remove the UDF boundary.",
  },
  "m24-q2": {
    question: "A managed table receives shifting filters on date and customer and must adapt its layout without rigid partitions. Which strategy fits best?",
    options: [
      "Liquid clustering based on observed access patterns, ideally with predictive optimization.",
      "Partition by every customer_id.",
      "Run `coalesce(1)` after every write.",
      "Disable file statistics.",
    ],
    explanation: "Liquid clustering lets clustering keys evolve and avoids high-cardinality physical partitions.",
  },
  "m24-q3": {
    question: "What requirement must be checked before enabling deletion vectors on a table that is consumed outside Databricks?",
    options: [
      "That every query uses `SELECT *`.",
      "That the table is partitioned by date.",
      "That the driver has twice the memory.",
      "That every reader and writer supports the protocol feature.",
    ],
    explanation: "Deletion vectors raise the table's protocol features; an incompatible client may no longer be able to read or write the table.",
  },
  "m24-q4": {
    question: "Predictive optimization is enabled on a catalog of managed tables. Which FinOps practice is most reasonable?",
    options: [
      "Also keep an hourly global `OPTIMIZE` just in case.",
      "Retire blanket maintenance jobs after reviewing history, performance, and the cost of the automated operations.",
      "Convert every table to external.",
      "Disable `ANALYZE` to reduce metadata.",
    ],
    explanation: "The automation selects beneficial operations; avoid duplicating them and validate the outcome with history and billing data.",
  },
  "m25-q1": {
    question: "A daily Python job tolerates six minutes of startup, uses supported APIs, and needs no custom networking. Which initial option is most reasonable?",
    options: [
      "Serverless jobs in standard mode.",
      "Always-on classic all-purpose compute.",
      "A classic SQL warehouse.",
      "A single-node cluster without auto-termination.",
    ],
    explanation: "The workload is compatible and tolerates startup time; standard mode costs less than performance-optimized mode.",
  },
  "m25-q2": {
    question: "Runtime is dominated by a single high-CPU task while the remaining workers sit idle. Which change does NOT address the cause?",
    options: [
      "Profile the key that feeds that task.",
      "Review partitioning and skew.",
      "Double the maximum number of workers without changing the plan.",
      "Check whether the operation is serial or cannot be parallelized.",
    ],
    explanation: "More workers do not speed up a single task; first restore parallelism or fix the skew.",
  },
  "m25-q3": {
    question: "Which mechanism attributes tags to serverless notebooks and jobs in `system.billing.usage`?",
    options: [
      "A global init script.",
      "A serverless usage policy assigned to the user or workload.",
      "Renaming the warehouse.",
      "A scheduled `VACUUM`.",
    ],
    explanation: "Serverless usage policies propagate their custom tags to the billing records.",
  },
  "m25-q4": {
    question: "A consumption report excludes negative rows from `system.billing.usage`. What is the risk?",
    options: [
      "Losing only the notebook name.",
      "Disabling Photon.",
      "Turning DBUs into CPU hours.",
      "Ignoring correction retractions and overstating consumption.",
    ],
    explanation: "Corrections can appear as a retraction plus a restatement; the signed quantity must be aggregated.",
  },
  "m26-q1": {
    question: "A classic-compute job takes 35 minutes. What is the most efficient diagnostic sequence in the Spark UI?",
    options: [
      "Change the node type, then open the UI.",
      "Read every driver log from the beginning.",
      "Start with the timeline, locate the dominant stage, and drill down into its tasks.",
      "Run `collect()` to get a local sample.",
    ],
    explanation: "Top-down navigation connects overall duration to the stage and tasks that actually explain it.",
  },
  "m26-q2": {
    question: "A serverless query has no Spark UI. Which tool shows top operators, pruning, I/O, and time spent in Photon?",
    options: [
      "Query Profile.",
      "The DBFS browser.",
      "The classic compute event log.",
      "A `DESCRIBE HISTORY` on any table.",
    ],
    explanation: "Query Profile is the diagnostic interface for SQL warehouses and serverless compute.",
  },
  "m26-q3": {
    question: "A job ends with `SUCCESS`, but the table lands late and its distribution shifts without any execution errors. Which signal adds the missing evidence?",
    options: [
      "Only the job's worker count.",
      "Data Quality Monitoring: freshness/completeness anomaly detection and distribution/drift profiling.",
      "`bundle validate`, because it validates the contents of each table.",
      "`VACUUM`, because it records any semantic degradation.",
    ],
    explanation: "Run status describes execution. Data Quality Monitoring observes asset health and lets you correlate freshness, completeness, or distribution anomalies with the run.",
  },
  "m26-q4": {
    question: "An on-call script fetches a failed run and immediately calls `repair-run`. What is the main weakness?",
    options: [
      "The CLI cannot query jobs.",
      "It mutates the incident before the causal evidence is preserved and evaluated.",
      "Repairs always create a new job.",
      "OAuth does not work with the CLI.",
    ],
    explanation: "Capture and repair must be separate steps to preserve evidence and avoid incorrect automated actions.",
  },
  "m27-q1": {
    question: "During a SEV-2, adding compute restores the SLA but the cause is still unknown. How should this be recorded?",
    options: [
      "As a permanent fix because it worked.",
      "As the root cause of the incident.",
      "As proof that CPU was lacking.",
      "As a temporary mitigation with an expiry, cost, and rollback.",
    ],
    explanation: "The action reduces impact but does not prove the cause; it needs explicit limits and a way to revert.",
  },
  "m27-q2": {
    question: "A retry turned the run green, but the sink was append-only and the first attempt wrote partially. What is missing before closing the incident?",
    options: [
      "Increase driver log retention.",
      "Reconcile duplicates and partial effects for the affected range.",
      "Run `VACUUM RETAIN 0 HOURS`.",
      "Delete the job history.",
    ],
    explanation: "A green status does not validate semantics; a partial append can duplicate data after the retry.",
  },
  "m27-q3": {
    question: "What is the best falsifiable hypothesis for a stage with five stragglers?",
    options: [
      "Five hot keys concentrate the data; this will be checked with key frequencies and bytes per task.",
      "Spark is slow and needs more nodes.",
      "The cloud provider had a problem.",
      "The query is too complex.",
    ],
    explanation: "The hypothesis names a mechanism and the evidence that can confirm or refute it.",
  },
  "m27-q4": {
    question: "Which postmortem action is defined in a verifiable way?",
    options: [
      "Improve observability soon.",
      "Remind the team to review joins.",
      "Alert if p95 exceeds 24 min in two runs, with an owner, a runbook, and a firing test.",
      "Be more careful in production.",
    ],
    explanation: "It includes a metric, threshold, window, owner, and test condition.",
  },
  "m28-q1": {
    question: "A notebook imports another notebook to reuse a function on a modern runtime. Which refactor improves testability and compatibility?",
    options: [
      "Duplicate the cell in every notebook.",
      "Move the function to a `.py` file inside an importable package.",
      "Turn the function into a widget.",
      "Store the code in a compute tag.",
    ],
    explanation: "Python modules are the right unit for shared code; notebooks should orchestrate and present.",
  },
  "m28-q2": {
    question: "Which test provides the best evidence about a Spark transformation?",
    options: [
      "Check only that it returns a DataFrame object.",
      "Manually review `show()` output in production.",
      "Compare only the number of columns.",
      "Materialize synthetic data and validate schema, rows, and edge cases.",
    ],
    explanation: "Lazy evaluation and business contracts require executing and comparing a concrete result.",
  },
  "m28-q3": {
    question: "What is the most reproducible strategy for promoting a library?",
    options: [
      "Build a wheel once and promote the same hash across environments.",
      "Run an unpinned `%pip install` in every notebook.",
      "Rebuild from `main` during every deploy.",
      "Install dependencies with an init script on serverless.",
    ],
    explanation: "An immutable artifact prevents code and dependency-resolution drift between test and production.",
  },
  "m28-q4": {
    question: "What should an integration test cover that a pure unit test does not?",
    options: [
      "Adding two numbers in Python.",
      "The formatting of a function name.",
      "Real permissions, wheel installation, and idempotent Delta side effects.",
      "The spelling of the README.",
    ],
    explanation: "Those behaviors depend on the platform and on the deployed identity.",
  },
  "m29-q1": {
    question: "An already deployed bundle keeps Terraform state and the team upgrades to CLI 1.3+. Which sequence protects the identity of its resources when adopting the GA direct engine?",
    options: [
      "Delete `terraform.tfstate` and deploy as a new bundle",
      "Change `root_path` and trust that the names will match",
      "Complete a deploy with the current engine, run `bundle deployment migrate` per target, and check that the plan proposes no unexpected actions",
      "Rebuild the wheel with a different hash in each target",
    ],
    explanation: "The official migration converts the deployment state while keeping resource IDs. A plan that proposes actions requires reconciling drift before continuing.",
  },
  "m29-q2": {
    question: "Three targets duplicate the entire job definition and only the catalog changes. Which design reduces drift?",
    options: [
      "Three independent repositories.",
      "One base definition and a `catalog` variable overridden per target.",
      "Manually edit the job after every deploy.",
      "Hardcode table IDs in the wheel.",
    ],
    explanation: "Targets should express only real differences; duplicating resources lets the DAG diverge.",
  },
  "m29-q3": {
    question: "Which identity should run a production job even when an engineer triggers the deployment?",
    options: [
      "The last user who edited the YAML.",
      "A shared account administrator.",
      "A stable service principal defined through `run_as`.",
      "Any user with CAN VIEW.",
    ],
    explanation: "Separating deployment from execution stabilizes permissions, ownership, and operational continuity.",
  },
  "m29-q4": {
    question: "What does redeploying the previous bundle version guarantee after a faulty `MERGE`?",
    options: [
      "It automatically restores the table with time travel.",
      "It deletes every failed run.",
      "It revokes the CI credentials.",
      "It restores the declared configuration and code, but does not by itself revert data already written.",
    ],
    explanation: "Deployment rollback and data rollback or repair are separate problems.",
  },
  "m30-q1": {
    question: "A group has `SELECT` on a table but gets an access error when resolving its name. What should be checked first?",
    options: [
      "`USE CATALOG` and `USE SCHEMA`.",
      "Photon on the warehouse.",
      "Deletion vectors.",
      "The number of workers.",
    ],
    explanation: "Traversing the catalog and schema is a usual prerequisite even when SELECT is granted on the object.",
  },
  "m30-q2": {
    question: "Hundreds of new tables tagged `restricted` must receive the same mask. Which option scales best?",
    options: [
      "A manual grant to each owner.",
      "A different view created by each analyst.",
      "An ABAC policy based on governed tags at the catalog or schema level.",
      "Copy the UDF into every notebook.",
    ],
    explanation: "ABAC separates classification from policy and automatically covers objects that carry the attribute.",
  },
  "m30-q3": {
    question: "An external process loads Salesforce data before Unity Catalog, and Power BI consumes the result outside Databricks. How is the end-to-end graph completed?",
    options: [
      "With placeholder jobs inside the workspace",
      "With external metadata objects and external lineage relationships to the Unity Catalog objects",
      "With ALL PRIVILEGES grants to both systems",
      "With a free-form tag that contains the credentials",
    ],
    explanation: "External lineage represents the first mile and last mile that Databricks automatic lineage cannot observe, linking them to governed objects.",
  },
  "m30-q4": {
    question: "Which interpretation of the tag `system.certification_status = certified` is defensible?",
    options: [
      "Databricks officially guarantees there will never be errors",
      "The asset met documented internal standards and must keep an owner, evidence, and review",
      "Every user automatically receives SELECT",
      "The data becomes a requirement of the certification exam",
    ],
    explanation: "Certification status communicates trust according to the organization's process; it does not replace controls, permissions, or tests and is not an official vendor guarantee.",
  },
  "m31-q1": {
    question: "Two organizations use Unity Catalog workspaces. Which model avoids exchanging a credential file?",
    options: [
      "Databricks-to-Databricks OpenSharing.",
      "A CSV export to public object storage.",
      "A bearer token shared over chat.",
      "Query federation from the recipient into the internal metastore.",
    ],
    explanation: "The native metastore-to-metastore integration uses platform identity and does not require the credential file of the open model.",
  },
  "m31-q2": {
    question: "A PostgreSQL database is queried in an exploratory, read-only way with selective filters. Which option reduces initial ingestion time?",
    options: [
      "A full daily backfill.",
      "Outbound OpenSharing.",
      "Lakehouse query federation through a foreign catalog.",
      "Manually copying dumps to the DBFS root.",
    ],
    explanation: "Federation provides governed in-place access and pushdown without migrating the data first.",
  },
  "m31-q3": {
    question: "When should federation be replaced by incremental ingestion?",
    options: [
      "When the query runs monthly and filters a single row.",
      "When frequent, heavy loads affect the source and need their own SLA.",
      "When the catalog is named `foreign`.",
      "Whenever the recipient uses SQL.",
    ],
    explanation: "Materialization decouples performance and availability from a remote source under repeated load.",
  },
  "m31-q4": {
    question: "A trusted Trino engine must write to a governed Managed Iceberg table without receiving permanent cloud keys. Which pattern should be evaluated?",
    options: [
      "OpenSharing, which grants the partner write access",
      "A direct path to the bucket with a permanent access key",
      "The Unity Catalog Iceberg REST Catalog with credential vending and a least-privilege principal",
      "Compatibility Mode as a GA write path for any table",
    ],
    explanation: "Iceberg REST and credential vending let compatible clients inherit permissions and use temporary credentials; Managed Iceberg supports read/write. Compatibility Mode is in Public Preview and read-only.",
  },
  "m32-q1": {
    question: "A requirement says 'near real-time data' with no further detail. What should the architect do first?",
    options: [
      "Choose continuous streaming.",
      "Increase the number of workers.",
      "Define the freshness SLO, volume, late-data tolerance, and breach response.",
      "Create a table partitioned by second.",
    ],
    explanation: "Technology is chosen only after turning the ambiguity into measurable constraints.",
  },
  "m32-q2": {
    question: "A CDC feed receives two out-of-order updates for the same key. Which design prevents the older one from overwriting the newer one?",
    options: [
      "Apply key and sequence, accepting only the most recent event.",
      "Append and deduplicate in the dashboard.",
      "Delete the checkpoint every night.",
      "Order only by the file's arrival time.",
    ],
    explanation: "Deterministic CDC needs a source or business sequence in addition to the key.",
  },
  "m32-q3": {
    question: "The job finished successfully, but the gold table's freshness is 80 minutes against a 15-minute SLO. What is the state of the product?",
    options: [
      "Healthy because the job is green.",
      "Breaching the SLO; the chain and its consumers must be investigated.",
      "Correct if Photon was enabled.",
      "Impossible to tell without clearing the cache.",
    ],
    explanation: "Execution status does not replace the outcome metric that matters to the consumer.",
  },
  "m32-q4": {
    question: "CI deploys and the job runs with the same administrator principal. Which improvement reduces the blast radius?",
    options: [
      "Add the token to a notebook for recovery.",
      "Give the job ownership of every catalog.",
      "Share the principal with analysts for support.",
      "Separate the deploy identity from `run_as`, each with least privilege.",
    ],
    explanation: "The two functions need different permissions; separating them improves least privilege and auditability.",
  },
};

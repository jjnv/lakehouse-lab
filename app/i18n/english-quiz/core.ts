import type { EnglishQuizCopyTable } from "./types";

export const englishQuizCore: EnglishQuizCopyTable = {
  "m01-q1": {
    question: "Which component provides ACID transactions over the files of a lakehouse table?",
    options: ["Unity Catalog", "Delta Lake", "SQL warehouse", "Git folder"],
    explanation: "Delta Lake maintains the transaction log and defines the table guarantees; Unity Catalog governs the object.",
  },
  "m01-q2": {
    question: "A team needs to work with the same dataset from BI and PySpark without creating two copies. Which design fits best?",
    options: ["Two CSV exports", "A shared notebook", "A governed Delta table with separate compute resources", "A permanent cluster per user"],
    explanation: "Separating storage from compute lets several engines access the same governed object.",
  },
  "m01-q3": {
    question: "Which object organizes catalogs and is assigned to workspaces?",
    options: ["Unity Catalog metastore", "SQL warehouse", "Checkpoint", "Task value"],
    explanation: "The metastore is the top-level Unity Catalog scope and contains the governed catalogs.",
  },
  "m01-q4": {
    question: "Which surface is the most appropriate for concurrent SQL BI?",
    options: ["The driver of a personal cluster", "Auto Loader", "Storage credential", "SQL warehouse"],
    explanation: "SQL warehouses are designed to run SQL workloads with isolation and concurrency.",
  },
  "m02-q1": {
    question: "Which option minimizes administration for an ETL workload that is compatible with managed capabilities?",
    options: ["Serverless Jobs", "Personal cluster without auto-stop", "Pool with a permanent cluster", "Classic SQL warehouse for PySpark"],
    explanation: "Serverless Jobs manages compute provisioning and optimization for compatible tasks.",
  },
  "m02-q2": {
    question: "Which feature specifically reduces the startup time of classic clusters?",
    options: ["Auto-termination", "Liquid clustering", "Instance pool", "Unity Catalog"],
    explanation: "A pool keeps instances ready; auto-termination addresses idle time, not startup.",
  },
  "m02-q3": {
    question: "A query has a single slow partition caused by skew. Which action is NOT sufficient on its own?",
    options: ["Review the physical plan", "Analyze the skewed keys", "Change the join strategy", "Enable autoscaling"],
    explanation: "Adding workers does not automatically split a skewed partition; the distribution or the plan must be fixed first.",
  },
  "m02-q4": {
    question: "Where would you query DBUs attributed through tags?",
    options: ["DESCRIBE HISTORY", "system.billing.usage", "Git folder", "Streaming checkpoint"],
    explanation: "The billing.usage system table records usage and custom_tags for attribution.",
  },
  "m03-q1": {
    question: "What best reveals that a notebook depends on hidden state?",
    options: ["It has several Markdown cells", "It does not use display", "It fails after a restart and run-all in order", "It includes a SQL query"],
    explanation: "A clean run clears variables and leftover state, exposing implicit dependencies.",
  },
  "m03-q2": {
    question: "Where do the Spark operations submitted through Databricks Connect run?",
    options: ["On the remote compute", "Always in local pandas", "In GitHub Actions", "In the browser"],
    explanation: "The local client builds plans, but Spark executes them on Databricks.",
  },
  "m03-q3": {
    question: "Which value is appropriate for a Job parameter?",
    options: ["The JDBC password", "A serialized dataset", "A private key", "The processing date"],
    explanation: "The date varies the run without exposing credentials; secrets must be handled through dedicated mechanisms.",
  },
  "m03-q4": {
    question: "A native function exists to transform a column. Which option best preserves optimization?",
    options: ["collect and a local loop", "The native SQL/PySpark function", "An equivalent Python UDF", "Converting the whole table to pandas"],
    explanation: "Native expressions are visible to Catalyst and avoid unnecessary Python serialization.",
  },
  "m04-q1": {
    question: "Which of these operations triggers execution?",
    options: ["select", "filter", "withColumn", "count"],
    explanation: "count is an action; the others build the plan.",
  },
  "m04-q2": {
    question: "You need to keep every order even when no customer exists. Which join do you use?",
    options: ["Left join from orders", "Inner join", "Cross join", "Left semi join"],
    explanation: "A left join keeps every row from the left side and adds nulls when there is no matching dimension.",
  },
  "m04-q3": {
    question: "A JSON payload carries hundreds of optional fields that change over time, but three critical fields must be queried with stable types. Which design is most defensible?",
    options: [
      "Store only the JSON string and parse all of it in every query",
      "Create one column for every possible field and accept silent drift",
      "Keep the payload as VARIANT and project the critical fields into typed columns",
      "Use VARIANT as the clustering key and group directly by the full payload",
    ],
    explanation: "VARIANT keeps flexibility and an optimized encoding; typed projections stabilize contracts and allow the fields in use to be optimized. VARIANT does not support clustering or direct aggregation on the whole column.",
  },
  "m04-q4": {
    question: "Which pattern keeps the most recent event deterministically?",
    options: ["dropDuplicates without ordering", "row_number over a window with a tiebreaker", "distinct after collect", "groupBy on every column"],
    explanation: "The window expresses priority and a stable tiebreaker.",
  },
  "m05-q1": {
    question: "In one stage, a single task takes 12 minutes and the rest take 20 seconds. What do you suspect first?",
    options: ["Skew", "A missing catalog", "Auto-stop", "A syntax error"],
    explanation: "A long tail within the same stage is the typical sign of a skewed partition.",
  },
  "m05-q2": {
    question: "What does repartition do?",
    options: ["It only changes metadata", "It always reduces partitions without a shuffle", "It redistributes data through a shuffle", "It materializes data on the driver"],
    explanation: "repartition creates a new distribution and normally a shuffle.",
  },
  "m05-q3": {
    question: "When is a broadcast reasonable?",
    options: ["Both sides are huge", "The small side fits comfortably in the executors", "There is a single partition", "The driver has little disk"],
    explanation: "Broadcast replicates the small side and avoids shuffling the large one.",
  },
  "m05-q4": {
    question: "A cluster never reaches RUNNING. Which surface do you check first?",
    options: ["Query Profile", "DESCRIBE HISTORY", "Lineage", "Compute events and configuration"],
    explanation: "The Spark UI does not contain jobs yet; the failure lies in provisioning or configuration.",
  },
  "m06-q1": {
    question: "How do you convert an eligible external Delta table to managed while keeping history, permissions, and views?",
    options: ["CREATE TABLE AS SELECT", "ALTER TABLE … SET MANAGED", "DROP and manual re-creation", "VACUUM"],
    explanation: "SET MANAGED keeps the identity and continuity of the object; the conversion requires compatible compute and clients and restarting streams.",
  },
  "m06-q2": {
    question: "What prevents an old event from reverting a customer during a MERGE?",
    options: ["A sequence condition on MATCHED", "VACUUM", "A final SELECT DISTINCT", "Auto-stop"],
    explanation: "Comparing updated_at or a sequence prevents an earlier version from being applied.",
  },
  "m06-q3": {
    question: "Which command removes obsolete Delta files according to retention?",
    options: ["OPTIMIZE", "RESTORE", "VACUUM", "ANALYZE"],
    explanation: "VACUUM removes unreferenced files; OPTIMIZE reorganizes active files.",
  },
  "m06-q4": {
    question: "What does schema enforcement provide?",
    options: ["It accepts any column", "It deletes invalid records", "It converts every table to external", "It rejects incompatible writes"],
    explanation: "It protects the table schema against incompatible data.",
  },
  "m07-q1": {
    question: "Which layer preserves source fidelity so data can be reprocessed?",
    options: ["Gold", "Bronze", "Dashboard", "Dimension"],
    explanation: "Bronze preserves the original data and its metadata.",
  },
  "m07-q2": {
    question: "What must a fact table define first?",
    options: ["The dashboard color", "The number of partitions", "Grain", "The warehouse type"],
    explanation: "The grain determines meaning and aggregation.",
  },
  "m07-q3": {
    question: "Finance and three dashboards compute revenue with different filters but must share one governed definition. Which object centralizes measures and dimensions without duplicating the metric in every tool?",
    options: ["A Unity Catalog metric view", "One widget per dashboard", "A shared checkpoint", "An external location"],
    explanation: "A metric view defines reusable semantics and lets each consumer evaluate measures with its own groupings and filters.",
  },
  "m07-q4": {
    question: "What should you do with repairable errors without blocking valid records?",
    options: ["Ignore them", "Delete Bronze", "Grant permissions", "Traceable quarantine"],
    explanation: "Quarantine preserves evidence and lets valid records move forward.",
  },
  "m08-q1": {
    question: "What does COPY INTO guarantee by default?",
    options: ["Deduplication by key", "A history of processed files", "CDC for deletes", "Broadcast join"],
    explanation: "It tracks files, not business duplicates.",
  },
  "m08-q2": {
    question: "Which format includes a transaction log?",
    options: ["CSV", "JSON", "Delta", "Plain Parquet"],
    explanation: "Delta combines Parquet files with a transaction log.",
  },
  "m08-q3": {
    question: "Where should governed non-tabular files be stored?",
    options: ["Unity Catalog Volume", "Local driver storage", "Git folder", "Widget"],
    explanation: "Volumes govern access to files.",
  },
  "m08-q4": {
    question: "What is the risk of a highly parallelized JDBC read?",
    options: ["It creates lineage", "It enables Photon", "It converts the data to Delta", "It overloads the source"],
    explanation: "Each partition can open a concurrent connection.",
  },
  "m09-q1": {
    question: "Which option configures the file format in Auto Loader?",
    options: ["cloudFiles.format", "checkpointLocation", "mergeSchema", "trigger"],
    explanation: "cloudFiles.format identifies JSON, CSV, Parquet, and so on.",
  },
  "m09-q2": {
    question: "Which path must two streaming queries never share?",
    options: ["Catalog", "Checkpoint", "Team name", "Dashboard"],
    explanation: "Each query needs its own compatible checkpoint.",
  },
  "m09-q3": {
    question: "A database does not expose CDC, but `updated_at` increases monotonically on every insert or update. A scheduled load without a gateway or staging is required. Which pattern fits?",
    options: [
      "COPY INTO over the remote table",
      "An Auto Loader checkpoint over JDBC",
      "Query-based Lakeflow Connect with `updated_at` as the cursor",
      "Federation plus a manual overwrite of Gold",
    ],
    explanation: "The query-based connector uses the cursor as a high-water mark, queries new values on each scheduled run, and writes the target without a gateway or staging.",
  },
  "m09-q4": {
    question: "What preserves an unexpected field during ingestion?",
    options: ["VACUUM", "Auto-stop", "Broadcast", "rescuedDataColumn"],
    explanation: "Rescued data avoids losing the part of the payload that does not fit the schema.",
  },
  "m10-q1": {
    question: "How do you recover only the failed tasks of a job run?",
    options: ["A new workspace", "Repair run", "VACUUM", "Clone"],
    explanation: "Repair reruns the required subset.",
  },
  "m10-q2": {
    question: "What carries a DataFrame between tasks?",
    options: ["Task value", "Widget", "Governed table", "Email"],
    explanation: "Datasets must be persisted; task values are small scalars.",
  },
  "m10-q3": {
    question: "Which trigger responds to irregular data arrival?",
    options: ["File arrival", "Cron every minute", "Auto-stop", "SQL alert"],
    explanation: "It is a data-driven trigger.",
  },
  "m10-q4": {
    question: "When is a retry safe?",
    options: ["When append duplicates rows", "Never", "Only when run manually", "When the task is idempotent"],
    explanation: "Repeating the task must produce the same logical state.",
  },
  "m11-q1": {
    question: "Which minimum privileges allow a user to read a table?",
    options: ["SELECT only", "USE CATALOG, USE SCHEMA, and SELECT", "MODIFY", "OWN"],
    explanation: "The user must be able to traverse the ancestors and read the object.",
  },
  "m11-q2": {
    question: "What scales column masks by data classification?",
    options: ["ABAC", "Widget", "Pool", "Checkpoint"],
    explanation: "ABAC applies policies based on governed tags.",
  },
  "m11-q3": {
    question: "Which command applies the resources of a bundle?",
    options: ["bundle init", "bundle summary", "bundle deploy", "fs cp"],
    explanation: "deploy creates or updates the resources of the target.",
  },
  "m11-q4": {
    question: "Which identity should run production?",
    options: ["Any analyst", "A token in YAML", "The user who made the commit", "A dedicated service principal"],
    explanation: "It avoids depending on a personal identity and applies least privilege.",
  },
  "m12-q1": {
    question: "Hourly JSON files with growing, high volume: which ingestion approach is preferred?",
    options: ["Auto Loader", "collect", "Git", "VACUUM"],
    explanation: "Auto Loader discovers files incrementally with managed state.",
  },
  "m12-q2": {
    question: "In the capstone DAG, what recovers failed tasks without repeating the successful ones?",
    options: ["RESTORE", "Repair run", "REVOKE", "OPTIMIZE"],
    explanation: "Repair acts on a subset of the DAG.",
  },
  "m12-q3": {
    question: "Which combination grants minimal read access?",
    options: ["OWN", "MODIFY", "USE CATALOG + USE SCHEMA + SELECT", "ALL PRIVILEGES"],
    explanation: "It allows resolving the ancestors and reading the object.",
  },
  "m12-q4": {
    question: "A Spark task has a single extreme partition. What is the first diagnosis?",
    options: ["More permissions", "A new catalog", "Auto-stop", "Skew in the Spark UI"],
    explanation: "An uneven distribution of tasks points to skew.",
  },
};

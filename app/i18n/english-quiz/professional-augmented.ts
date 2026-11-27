import type { EnglishQuizCopyTable } from "./types";

export const englishQuizProfessionalAugmented: EnglishQuizCopyTable = {
  "professional-aug-01-01": {
    question: "An external Delta table is renamed within the same catalog. What necessarily changes?",
    options: ["The reference registered in the catalog/metastore", "The file path moves automatically", "A new transaction log is created", "All Parquet files are rewritten"],
    explanation: "The name is catalog metadata; a rename does not imply moving the external location.",
  },
  "professional-aug-01-02": {
    question: "A managed table is renamed without changing catalogs. Which statement is defensible?",
    options: ["Every file receives the new name", "The catalog updates the logical identity; the platform manages the associated storage", "An automatic deep clone runs", "The reader protocol version is incremented"],
    explanation: "A rename operates on metadata; it is not equivalent to cloning or upgrading the protocol.",
  },
  "professional-aug-01-03": {
    question: "After RENAME TABLE, a job still uses the previous identifier. What must be updated?",
    options: ["The checkpoint, so it creates a new Delta log", "All Parquet files", "The job's reference to the table name", "The Spark version in the metastore"],
    explanation: "Consumers that resolve by name must adopt the newly registered identifier.",
  },
  "professional-aug-01-04": {
    question: "What is the main risk of confusing a catalog rename with a change of location?",
    options: ["Photon gets disabled", "The SQL warehouse loses auto-stop", "VACUUM creates a catalog", "Assuming the physical path moved when only the logical name changed"],
    explanation: "Distinguishing the logical reference from the storage location prevents later operations from targeting the wrong path.",
  },
  "professional-aug-02-01": {
    question: "Micro-batches take 18 s with a 10 s trigger and the backlog keeps growing. What should be done first?",
    options: ["Optimize or scale so that processing time falls back under the SLA", "Lower the trigger to 1 s without measuring", "Delete the checkpoint", "Start two queries on the same checkpoint"],
    explanation: "A shorter interval does not add concurrency between micro-batches of the same query when processing is already falling behind.",
  },
  "professional-aug-02-02": {
    question: "A query normally takes 2 s but reaches 25 s during peak hours because of skew. Which action addresses the cause?",
    options: ["Change outputMode without reviewing state", "Measure the distribution and fix the skew or capacity before changing the trigger", "Delete committed offsets", "Run trigger once every five seconds"],
    explanation: "The irregularity comes from per-batch work; the trigger does not remove skew or spill.",
  },
  "professional-aug-02-03": {
    question: "The SLA requires under 10 s and each sustained batch takes 12 s. Which conclusion is correct?",
    options: ["A 5 s trigger will run two batches simultaneously", "The checkpoint prevents any tuning", "The query cannot keep up; per-batch processing time must be reduced", "availableNow guarantees continuous latency"],
    explanation: "Processing capacity must exceed the input rate to avoid accumulating a backlog.",
  },
  "professional-aug-02-04": {
    question: "Which metrics help decide whether a latency problem lies in input, processing, or state?",
    options: ["Only the notebook name", "Number of catalogs and users", "Size of the README", "inputRowsPerSecond, processedRowsPerSecond, batchDuration, and state store metrics"],
    explanation: "Progress metrics separate arrival rate, throughput, and state pressure.",
  },
  "professional-aug-03-01": {
    question: "A table holding years of events is almost always queried by event_date. Which column has the right cardinality and access pattern for layout?",
    options: ["event_date", "Unique event_id", "JSON payload", "Millisecond-level ingest_timestamp"],
    explanation: "A date used in filters avoids the extreme cardinality of identifiers or fine-grained timestamps.",
  },
  "professional-aug-03-02": {
    question: "A table receives shifting filters on customer_id and region. Which alternative reduces rigid partitioning decisions?",
    options: ["Partition by every column", "Liquid clustering with observed, revisable keys", "One file per customer", "Collect and write locally"],
    explanation: "Liquid clustering supports flexible keys without fixing a traditional directory hierarchy.",
  },
  "professional-aug-03-03": {
    question: "Which column is a poor candidate for traditional partitioning of a posts table?",
    options: ["date with frequent filters", "region with bounded cardinality", "Nearly unique post_id", "Derived event_day"],
    explanation: "A nearly unique key produces far too many small partitions.",
  },
  "professional-aug-03-04": {
    question: "Before choosing a layout column, what should primarily be measured?",
    options: ["Length of the notebook name", "Number of dashboards without queries", "Number of repository users", "Filter patterns, cardinality, volume, and file sizes"],
    explanation: "Layout must respond to real access patterns and physical distribution.",
  },
  "professional-aug-04-01": {
    question: "A view returns the real email only to marketing and REDACTED to everyone else. What will an analyst outside the group see?",
    options: ["The projected columns, with REDACTED in email", "The full base table", "An error for not being the owner", "An extra column named marketing"],
    explanation: "The CASE expression evaluates group membership and replaces the value for unauthorized users.",
  },
  "professional-aug-04-02": {
    question: "A dynamic view uses is_account_group_member for finance. Where is the displayed value decided?",
    options: ["In the job checkpoint", "In the view expression at query time", "In VACUUM", "In the warehouse size"],
    explanation: "The view logic evaluates the caller's identity at query time.",
  },
  "professional-aug-04-03": {
    question: "Which permission does a consumer need on a view, in addition to traversing the catalog and schema?",
    options: ["OWN on the base table", "CREATE CATALOG", "SELECT on the view", "MANAGE on the metastore"],
    explanation: "Consumers query the view through SELECT; they do not need ownership of the base table.",
  },
  "professional-aug-04-04": {
    question: "A policy must automatically cover new columns tagged PII. Which mechanism scales better than manual views?",
    options: ["One notebook per table", "One CSV copy per group", "One cluster per user", "ABAC with governed tags"],
    explanation: "ABAC applies centralized policies to objects that match the governed attributes.",
  },
  "professional-aug-05-01": {
    question: "A pipeline takes 8 minutes and must finish every hour. Which compute minimizes idle time?",
    options: ["Job compute or serverless started for each run", "An interactive cluster that is always on", "A SQL warehouse without auto-stop for PySpark", "A pool with no associated jobs"],
    explanation: "Ephemeral compute avoids paying for idle capacity between runs.",
  },
  "professional-aug-05-02": {
    question: "A memory-intensive notebook cannot tolerate retries. Which configuration should be prioritized?",
    options: ["A more frequent trigger", "Sufficient memory and max_retries=0 for that task", "A Delta Sharing recipient", "A new schemaLocation"],
    explanation: "The task must be sized for its profile and explicitly declared as non-retryable.",
  },
  "professional-aug-05-03": {
    question: "The SLA is daily and the job takes 20 minutes. Which option is usually cheapest?",
    options: ["All-purpose compute running 24x7", "Two active clusters for redundancy with no such requirement", "A scheduled run on ephemeral compute with auto-termination", "Continuous streaming with no data"],
    explanation: "Ephemeral scheduling aligns consumption with the work actually performed.",
  },
  "professional-aug-05-04": {
    question: "A task can produce non-idempotent external side effects. Which setting prevents repeating them automatically?",
    options: ["Raise retries to infinity", "Delete the job history", "Use a shared interactive cluster", "Disable retries and design a controlled recovery"],
    explanation: "Automatic retries can duplicate side effects; recovery must be explicit.",
  },
  "professional-aug-06-01": {
    question: "dbutils.secrets.get returns a password that is then printed. What output should be expected in the notebook?",
    options: ["A redacted value, although the secret can still leak through unsafe transformations", "The password, always in plain text", "An interactive input box", "The secret automatically saved to DBFS"],
    explanation: "Databricks attempts to redact direct access, but code must still avoid exposing or transforming secrets.",
  },
  "professional-aug-06-02": {
    question: "How should a JDBC secret be passed to the password option?",
    options: ["By pasting it into the notebook", "By fetching it at runtime from an authorized secret scope", "By storing it in a public table", "By including it in the job name"],
    explanation: "The secret scope keeps the sensitive value separate from versioned code.",
  },
  "professional-aug-06-03": {
    question: "A user without READ on the secret scope runs dbutils.secrets.get. What happens?",
    options: ["An empty string is returned", "A personal scope is created", "The read fails with an authorization error", "Access is granted because a cluster is being used"],
    explanation: "Access to compute does not imply permission on the secret scope.",
  },
  "professional-aug-06-04": {
    question: "Which practice remains unsafe even though the UI redacts a direct print?",
    options: ["Using a scope with an ACL", "Rotating the credential", "Limiting READ to the job's principal", "Concatenating, encoding, or sending the secret to another destination"],
    explanation: "Redaction is not a security boundary against code that transforms or exfiltrates the value.",
  },
  "professional-aug-07-01": {
    question: "1 TB will be written as 512 MB files with no prior shuffle. Which write setting should be evaluated?",
    options: ["spark.sql.files.maxRecordsPerFile or explicit repartitioning based on measurements", "Only autoBroadcastJoinThreshold", "A streaming trigger", "USE CATALOG"],
    explanation: "Controlling file size requires relating volume, rows, and partitions; a join setting does not do that.",
  },
  "professional-aug-07-02": {
    question: "A transformation already produces a shuffle and AQE is enabled. What helps approximate the target partition size?",
    options: ["spark.sql.files.openCostInBytes as the only guarantee", "spark.sql.adaptive.advisoryPartitionSizeInBytes", "spark.sql.autoBroadcastJoinThreshold", "delta.deletedFileRetentionDuration"],
    explanation: "AQE can coalesce post-shuffle partitions using the target size as an advisory value.",
  },
  "professional-aug-07-03": {
    question: "Which setting mainly affects the maximum partition size when reading files, not the final number of files written?",
    options: ["maxRecordsPerFile", "repartition before write", "spark.sql.files.maxPartitionBytes", "AQE advisory partition size after a shuffle"],
    explanation: "maxPartitionBytes governs read partitioning and does not guarantee the output layout.",
  },
  "professional-aug-07-04": {
    question: "Before fixing 2,048 partitions based on theoretical arithmetic, what should be checked?",
    options: ["Number of Git branches", "Dashboard colors", "Number of workspace users", "Actual compression, distribution, shuffle, and observed sizes"],
    explanation: "Logical volume alone does not predict compressed size or partition skew.",
  },
  "professional-aug-08-01": {
    question: "Marketing must expose approved columns with sales naming and reflect changes immediately. Which solution is simplest?",
    options: ["A view with projection and aliases", "An automatically synchronized deep clone", "A manually recreated CTAS", "Another write in every pipeline"],
    explanation: "The view avoids duplication and reflects base-table changes at query time.",
  },
  "professional-aug-08-02": {
    question: "Which statement about DEEP CLONE is correct?",
    options: ["It is a logical view", "It copies data and metadata to an independent target; it does not stay synchronized automatically", "It always shares the same files", "It renames the source table"],
    explanation: "A deep clone materializes a copy and requires later actions to keep it updated.",
  },
  "professional-aug-08-03": {
    question: "Three columns must be hidden and two names standardized without storing another copy. Which object should be used?",
    options: ["A shallow clone for row-level security", "A checkpoint", "A governed view", "A recipient"],
    explanation: "A view controls projection and aliases with minimal operational overhead.",
  },
  "professional-aug-08-04": {
    question: "When would a derived table be more appropriate than a view?",
    options: ["When only an alias changes", "When a column is hidden", "When the latest data is always required without a refresh", "When an expensive result must be materialized with its own SLA and refresh cycle"],
    explanation: "Materialization is justified by performance or decoupling, at the cost of operations and freshness.",
  },
  "professional-aug-09-01": {
    question: "A finishes; B and C start. B finishes and C fails after writing partially. Which state is possible?",
    options: ["A and B remain completed, and the effects C produced before failing may persist", "Everything is rolled back globally", "B is undone automatically", "No task commits until the end of the DAG"],
    explanation: "A multi-task job does not provide a global transaction across notebooks and systems.",
  },
  "professional-aug-09-02": {
    question: "After C fails, the run is repaired by selecting only the failed tasks. What must the design assume?",
    options: ["A and B always run again from scratch", "Already completed tasks are not repeated, and C must be idempotent when resumed", "The repair deletes every table", "The DAG becomes a transaction"],
    explanation: "A repair run reuses successful results where applicable; the repaired task must tolerate partial effects.",
  },
  "professional-aug-09-03": {
    question: "B and C depend on A, and D depends on both. C fails. What normally happens to D?",
    options: ["It runs once B finishes", "It rolls back A and B", "It does not run because a required dependency failed", "It ignores C's status"],
    explanation: "Default run conditions require upstream dependencies to have succeeded.",
  },
  "professional-aug-09-04": {
    question: "Which design lets a notification task run even if one branch of the DAG fails?",
    options: ["Remove every dependency", "Use an all-purpose cluster", "Store the alert in a comment", "Set the task's run condition to completion or failure as appropriate"],
    explanation: "Run conditions model final error-handling tasks without assuming a global rollback.",
  },
};

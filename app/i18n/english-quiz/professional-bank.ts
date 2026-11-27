import type { EnglishQuizCopyTable } from "./types";

export const englishQuizProfessionalBank: EnglishQuizCopyTable = {
  "pro-001": {
    question: "A team maintains an 1,800-line notebook that reads tables, transforms orders and publishes results. Tests can only run by launching the whole notebook, and every environment requires editing catalog names by hand. Which refactoring provides the most maintainable foundation for a Declarative Automation Bundle (Asset Bundle in the blueprint)?",
    options: [
      "Duplicate the notebook for dev, test and prod and protect each copy with workspace permissions.",
      "Extract pure transformations into a package under src, keep I/O and parameters in a thin layer, and declare per-target resources and variables in the bundle.",
      "Convert every cell to dynamic SQL and store the catalogs in global notebook variables.",
      "Move the notebook to a Git folder and always use the prod catalog to avoid differences between environments.",
    ],
    explanation: "Separating pure logic, I/O and configuration enables unit tests without running the whole workflow. Bundle targets change parameters and resources while the same versioned artifact is promoted across environments.",
  },
  "pro-002": {
    question: "An internal library works in development with the latest pandas release, but fails in production two weeks later because the environment resolved a different version of a transitive dependency. Which strategy best reduces this drift without installing dependencies manually on every run?",
    options: [
      "Run pip install --upgrade at the top of the notebook to always get the newest versions.",
      "Attach the full source repository as a workspace file and rely on the preinstalled libraries.",
      "Build a versioned wheel, pin compatible dependencies and deploy that artifact from the bundle to every target.",
      "Install the library once on a shared interactive cluster and reuse that cluster indefinitely.",
    ],
    explanation: "An immutable wheel with pinned versions makes dependency resolution reproducible. The bundle can reference the same tested artifact; upgrading everything on each run or depending on a cluster's state introduces variability.",
  },
  "pro-003": {
    question: "A transformation applies a row-by-row Python UDF to normalize arrays of codes. Query Profile shows a lot of time spent exchanging data between the JVM and Python, and the same rule can be expressed with transform and regexp_replace. What is the most appropriate first technical change?",
    options: [
      "Replace the UDF with native Spark SQL array functions to keep optimization and vectorized execution where possible.",
      "Turn it into a globally registered scalar Python UDF so Catalyst can inspect its body.",
      "Increase spark.sql.shuffle.partitions even though the operation does not produce a shuffle.",
      "Persist each array as JSON and process it in a second single-node Python task.",
    ],
    explanation: "Native functions are visible to Catalyst and avoid the serialization boundary of a Python UDF. Registering the same UDF does not make its logic transparent, and adding partitions does not fix that bottleneck.",
  },
  "pro-004": {
    question: "A transform function adds computed columns to a DataFrame. An accidental change keeps the expected values but converts amount from decimal to double and swaps the order of two columns required by the contract. Which set of tests explicitly detects both kinds of regression?",
    options: [
      "Compare only actual.count() with expected.count().",
      "Collect the first row and check that amount is greater than zero.",
      "Run explain and verify that no Exchange appears.",
      "Use assertDataFrameEqual for the data and assertSchemaEqual for the schema contract.",
    ],
    explanation: "Row equality does not replace a schema check. PySpark testing utilities let you express separate expectations about data and about types, names, nullability and structure.",
  },
  "pro-005": {
    question: "A job receives a list of regions validated by an initial task. It must run the same notebook for each region with limited concurrency, and then continue with a single consolidation task. Which design best expresses that intent in Lakeflow Jobs?",
    options: [
      "Create one hundred fixed tasks, one per possible region, and skip from the notebook those that are not in the list.",
      "Publish the list as a task value, consume it in a For each task and make the consolidation depend on that task.",
      "Launch Python threads from the driver and manually write each region's status to DBFS.",
      "Create a separate job per region and schedule them all at the same time without dependencies.",
    ],
    explanation: "For each models dynamic fan-out, allows concurrency control and keeps every iteration inside the observable graph. A task value is the right channel to pass the small list produced upstream.",
  },
  "pro-006": {
    question: "The same bundle must create resources with a personal prefix in development, use an integration catalog in test, and deploy stable names under a service identity in production. How should that variation be represented without maintaining three copies of the bundle?",
    options: [
      "Define targets with variables and substitutions, apply development mode where appropriate and configure the production run_as explicitly.",
      "Read the user name inside each notebook and build every resource name at runtime.",
      "Edit databricks.yml on the main branch before each deployment and revert it afterwards.",
      "Use a single target that deploys to the three workspaces simultaneously.",
    ],
    explanation: "Targets encapsulate declarative environment differences and variables avoid duplicating resources. The prod run identity must be controlled by configuration, not inferred inside the code.",
  },
  "pro-007": {
    question: "A streaming transformation must call an external service with a proprietary protocol, manage one transaction per micro-batch and write to a sink that Spark Declarative Pipelines in Lakeflow does not support. Which approach keeps the required control with the least contrivance?",
    options: [
      "Declare a materialized view, because every materialized view supports external sinks.",
      "Use COPY INTO with a ten-second trigger against the remote service.",
      "Implement Structured Streaming with foreachBatch, a stable checkpoint and explicit idempotency in the sink.",
      "Use a declarative streaming table and run the remote call inside an expectation.",
    ],
    explanation: "foreachBatch provides per-micro-batch control for integrations not covered by managed sinks. That control requires designing the external operation for retries; an expectation is not a side-effect mechanism.",
  },
  "pro-008": {
    question: "A notebook task calls an API that charges twice if the request is repeated. There is no idempotency key or reliable pre-check yet, and the team prefers to fail and review rather than duplicate charges. Which immediate configuration reflects that policy while the design is fixed?",
    options: [
      "Increase the number of workers so the call finishes before the timeout.",
      "Configure unlimited retries with an increasing interval.",
      "Enable automatic repair of every task that already succeeded.",
      "Set max_retries to 0 for that task and alert on the failure for intervention.",
    ],
    explanation: "Without idempotency, an automatic retry can repeat the external effect. Disabling retries is a temporary guardrail; the structural fix is still to introduce an idempotency key or a verifiable transaction.",
  },
  "pro-009": {
    question: "An ephemeral job needs an in-house library and two PyPI packages. Developers want every run to start clean and the code version to stay tied to the deployment that created the job. Where should that production dependency preferably be declared?",
    options: [
      "In a %pip cell that the owner runs manually whenever the cluster changes.",
      "As a task library or bundle resource, pointing to the versioned wheel and compatible PyPI versions.",
      "In each developer's local Databricks CLI profile.",
      "In a global variable of an interactive cluster that the job reuses.",
    ],
    explanation: "Declaring libraries next to the deployed resource lets infrastructure and code evolve traceably. Manual installs or the state of a shared cluster are not reproducible.",
  },
  "pro-010": {
    question: "A PySpark function fails only with a nested struct that contains empty and null arrays. The notebook mixes reading, logic and writing, so the debugger forces reprocessing millions of rows to reproduce the error. Which change shortens the diagnostic loop the most?",
    options: [
      "Add display after every transformation and always run against production.",
      "Cache all input tables before opening the debugger.",
      "Isolate the transformation in a function, build a minimal DataFrame with the edge case and debug/test it locally in the session.",
      "Convert the struct to a string so that any schema is accepted.",
    ],
    explanation: "A minimal case and a side-effect-free transformation make the failure reproducible and allow tests and debugging without a full run. Converting to a string hides the contract instead of fixing it.",
  },
  "pro-011": {
    question: "A bucket receives 40 million JSON files per month. Ingestion must discover only new objects, keep the inferred schema across runs and resume without reprocessing history. Which configuration covers those three needs?",
    options: [
      "Auto Loader with a durable schemaLocation and a checkpointLocation dedicated to the query.",
      "spark.read.json over the whole prefix followed by an in-memory dropDuplicates.",
      "COPY INTO without a target table and with force=true on every run.",
      "A binaryFile read that uses the object size as a unique identifier.",
    ],
    explanation: "Auto Loader keeps scalable discovery state; schemaLocation persists the inferred evolution and the checkpoint keeps the query's progress and commits. Both must live in durable storage and must not be shared between different queries.",
  },
  "pro-012": {
    question: "A pipeline must ingest medical images without interpreting them yet, keeping bytes, path, length and modification time for a later extraction stage. Which Spark source best fits the first step?",
    options: [
      "csv with inferSchema=true and a BINARY column.",
      "text, because it automatically keeps the original bytes of any file.",
      "binaryFile, which exposes the object's content and metadata as columns.",
      "parquet, after renaming the extension of each image.",
    ],
    explanation: "The binaryFile source reads each file as a record with content and metadata such as path, length and modificationTime. text decodes text and does not generally preserve the original binary content.",
  },
  "pro-013": {
    question: "A query reads Kafka and writes normalized events to Delta. After a crash, some messages may be presented again from the checkpoint, and the business cannot tolerate two orders with the same event_id. Which design addresses the end-to-end guarantee?",
    options: [
      "Rely only on Kafka's enable.auto.commit and delete the checkpoint.",
      "Use processingTime=1 second, because more frequent micro-batches eliminate duplicates.",
      "Add more partitions to the topic without changing the sink logic.",
      "Keep a stable checkpoint and make the Delta write idempotent with event_id and a bounded deduplication or a deterministic MERGE.",
    ],
    explanation: "Recoverable offsets prevent losing progress, but the business guarantee also depends on the sink. A stable key and an idempotent write absorb possible repetition without confusing trigger frequency with delivery semantics.",
  },
  "pro-014": {
    question: "An 800 GB PostgreSQL table is read over JDBC with a single partition and saturates one core. There is an increasing numeric id column, and the database can handle eight concurrent connections without affecting the transactional system. Which setting parallelizes the read in a controlled way?",
    options: [
      "Increase spark.sql.shuffle.partitions to 8 after the read finishes.",
      "Set partitionColumn=id, lowerBound, upperBound and numPartitions=8, first validating the distribution and the source's capacity.",
      "Run eight full reads and apply union followed by distinct.",
      "Sort the remote table by id and use coalesce(8) in Spark.",
    ],
    explanation: "JDBC options split the range across several connections; the bounds compute the strides and are not row filters. They must be chosen considering skew and the maximum number of connections acceptable to the source database.",
  },
  "pro-015": {
    question: "Closed files arrive in the landing zone every night. The whole pending arrival must be processed, compute must stop when finished, and an append-only bronze table must continue tomorrow from the previous state. Which pattern provides incremental behavior with bounded cost?",
    options: [
      "Auto Loader in Structured Streaming with the availableNow trigger, a durable checkpoint and append to Delta bronze.",
      "A continuous stream without auto-stop even though the landing zone stays empty most of the day.",
      "Overwrite the whole bronze table every night and rebuild history from scratch.",
      "Read every file in batch and rely only on dropDuplicates without persisting progress.",
    ],
    explanation: "availableNow processes the available backlog incrementally and then stops. The checkpoint keeps which files and offsets were committed, while Delta keeps bronze append-only for replay and auditing.",
  },
  "pro-016": {
    question: "An events table contains several revisions per business_key. Two revisions can share updated_at, but source_sequence is unique and increasing within each key. How is the current revision selected deterministically?",
    options: [
      "Apply distinct to all columns and keep the first row Spark returns.",
      "Group by business_key and take max(updated_at), without retrieving the remaining columns.",
      "Use row_number over a window partitioned by business_key ordered by updated_at DESC and source_sequence DESC, and filter row_number=1.",
      "Sort globally by updated_at and run dropDuplicates without specifying a partition.",
    ],
    explanation: "row_number lets you define the partition and a total tiebreaker. max(timestamp) alone loses the associated columns, and a dropDuplicates without deterministic ordering can pick different revisions between runs.",
  },
  "pro-017": {
    question: "A 9 TB transactions DataFrame must keep only rows whose customer_id exists in a governed list of active customers. No column from the list is needed. Which operation best expresses the intent and avoids needlessly widening the result?",
    options: [
      "A cross join followed by an equality filter.",
      "A left_semi join on customer_id.",
      "A full_outer join and a null filter.",
      "A unionByName followed by dropDuplicates.",
    ],
    explanation: "A left semi join implements an existence test and returns only left-side columns. It avoids materializing lookup columns and tells the optimizer exactly which semantics are required.",
  },
  "pro-018": {
    question: "A dataset contains an items column with arrays of structs. One row per item is required, but orders whose array is empty or null must still appear for a later reconciliation. Which transformation satisfies the cardinality and keeps those orders?",
    options: [
      "explode(items), because it automatically generates a null row for empty arrays.",
      "flatten(items), because it turns each struct into a new row.",
      "collect_list(items) followed by distinct.",
      "explode_outer(items), keeping the order columns and allowing a null item.",
    ],
    explanation: "explode_outer keeps a row when the collection is null or empty, unlike explode. That makes it possible to reconcile the order even if it has no valid lines yet.",
  },
  "pro-019": {
    question: "A quality rule compares country_code with a master value. On both sides, null means “not provided” and must count as a match for this validation only; the = operator returns unknown. Which comparison avoids manual null-case logic?",
    options: [
      "Use null-safe equality, <=> in SQL or eqNullSafe in PySpark.",
      "Permanently fill every null with an empty string in the source tables.",
      "Filter out nulls before comparing and assume they were valid.",
      "Cast the columns to boolean and apply AND.",
    ],
    explanation: "Null-safe equality returns true for null versus null and false when only one side is null. It avoids introducing a sentinel that could collide with real data or permanently alter the model.",
  },
  "pro-020": {
    question: "In a declarative pipeline, 0.3% of orders arrive with a negative amount. The team must publish valid records immediately, keep invalid ones with a rejection reason and measure the rate per update. Which pattern offers better traceability than silently dropping them?",
    options: [
      "Apply EXPECT OR DROP and keep no copy of the dropped rows.",
      "Apply EXPECT OR FAIL to stop every order until the source fixes each row.",
      "Evaluate one shared rule, route valid rows to the main dataset and invalid ones to a quarantine table, and query the metrics/event log.",
      "Change amount to string so that any value passes validation.",
    ],
    explanation: "Quarantine preserves evidence and enables remediation without blocking good data. The same condition must govern both paths, and pipeline metrics let you monitor the violation rate.",
  },
  "pro-021": {
    question: "A MERGE accidentally receives two source rows for the same target key, and both satisfy the update condition. Each row has ingest_sequence and event_ts. Which preprocessing makes the result reproducible before the MERGE?",
    options: [
      "Increase the cluster size so Delta resolves the conflict faster.",
      "Canonicalize the source to one row per key with a total ordering by event_ts and ingest_sequence, and validate uniqueness.",
      "Run MERGE twice; the second run will pick the right row.",
      "Remove the ON condition and update every target row.",
    ],
    explanation: "A MERGE needs an unambiguous source for each target match. Deduplicating with a deterministic rule and checking uniqueness avoids order-dependent results or multiple-match errors.",
  },
  "pro-022": {
    question: "A session aggregation receives events up to 20 minutes late. The team adds a 20-minute watermark, but groups only by user_id and keeps the stream running for months. Why can state keep growing, and what is the conceptual fix?",
    options: [
      "Because every watermark duplicates state; remove it and use complete mode.",
      "Because user_id must be cast to double before grouping.",
      "Because checkpoints prevent releasing any key; create a new one every day.",
      "Because an aggregation without a time window gives no time bound for closing keys; add an event-time window compatible with the SLA.",
    ],
    explanation: "A watermark alone does not turn a global per-key aggregation into bounded state. An event-time window lets the engine determine when a result can be considered final and clean up old state.",
  },
  "pro-023": {
    question: "Two business units of the same company use different workspaces and metastores. The producer wants to grant access to up-to-date Delta tables without copying files or issuing permanent storage credentials to the Databricks consumer. Which mechanism is the natural fit?",
    options: [
      "Databricks-to-Databricks OpenSharing (Delta Sharing in the blueprint), publishing a share and authorizing the corresponding recipient.",
      "Export CSV files every night to a public bucket and email the path.",
      "Create a Lakehouse Federation connection from the producer to the consumer's metastore.",
      "Run a daily DEEP CLONE of every table into the consumer workspace.",
    ],
    explanation: "D2D Sharing lets the recipient access current, governed shared data without maintaining an exchange copy. Federation is for querying compatible external systems, not a replacement for the sharing protocol between providers and recipients.",
  },
  "pro-024": {
    question: "A partner uses a non-Databricks engine that supports OpenSharing (Delta Sharing in the blueprint) clients. It must read only two approved views, and the provider needs to revoke access without changing analysts' internal permissions. Which design fits that consumer?",
    options: [
      "Databricks-to-Databricks sharing, even though the partner has no Databricks workspace.",
      "Grant the partner direct SELECT on the internal catalog and access to the cloud console.",
      "Mount the provider's storage in the partner's system with a shared account key.",
      "Databricks-to-Open OpenSharing with an external recipient, managed authentication and a share limited to the approved objects.",
    ],
    explanation: "The open protocol is designed for compatible external clients. The share defines the minimal dataset, and the recipient separates the consumer's identity and revocation from the workspace's internal permissions.",
  },
  "pro-025": {
    question: "Finance needs to query a few tables from a supported operational database, with minutes-level freshness and low volume. Duplicating the whole database in Delta would add a pipeline the team does not want to operate. When is Lakehouse Federation a reasonable choice?",
    options: [
      "When repeated large-scale training is required even though the source database cannot sustain the load.",
      "When the query can benefit from pushdown, the source tolerates the demand and governed access without an initial copy is preferred.",
      "When any Spark transformation must be written back to the remote system with Delta guarantees.",
      "When the goal is to remove the source system's credentials and permissions entirely.",
    ],
    explanation: "Federation fits low- or moderate-frequency access where pushdown and source capacity are sufficient. For heavy ETL, isolation or repeatable performance, ingesting a governed copy is usually better.",
  },
  "pro-026": {
    question: "A team creates a foreign catalog pointing to a corporate database. The password is written in every notebook and all users reuse a remote account with administrator privileges. Which change aligns federation with a governed perimeter?",
    options: [
      "Copy the password into a hidden widget in each notebook.",
      "Grant CAN EDIT on the notebooks only to administrators and keep the remote account.",
      "Create a governed connection with a dedicated least-privilege credential, control its use in Unity Catalog and expose only the required objects.",
      "Store the password in a Delta table readable by the engineering group.",
    ],
    explanation: "The connection centralizes the credential and makes it possible to govern who can use it. The remote identity must also have minimal permissions; hiding text in a notebook does not stop secret sprawl or excess privilege.",
  },
  "pro-027": {
    question: "A pipeline's daily cost doubled, but the row count grew only 8%. The team must attribute the increase to a job, SKU and owner before changing compute. Which investigation produces useful cost and execution evidence?",
    options: [
      "Review only DESCRIBE HISTORY of the output table.",
      "Query system.billing.usage by interval, SKU and custom tags, and correlate the resource with the Lakeflow runs and their durations.",
      "Count the notebooks in the team's Git folder.",
      "Enable caching on every table without measuring prior consumption.",
    ],
    explanation: "The billing system table attributes usage with metadata and tags. Correlating that usage in time with runs avoids confusing data growth, retries, SKU changes or idle compute.",
  },
  "pro-028": {
    question: "A query running on a SQL warehouse takes 11 minutes. The team wants to know which operator concentrates the time, how many rows flow through each node and whether the join causes a shuffle. Which surface should it check first?",
    options: [
      "The query's Query Profile, inspecting operators, metrics and the execution graph.",
      "The Git history of the dashboard definition.",
      "The workspace's list of secrets.",
      "The event log of an unrelated declarative pipeline.",
    ],
    explanation: "Query Profile is built to break down a SQL query by operators and metrics. Spark UI can complement Spark workloads, but Git logs, secrets or an unrelated pipeline do not locate that query's bottleneck.",
  },
  "pro-029": {
    question: "A declarative pipeline finishes green, but the published table has 18% fewer rows. An expectation drops invalid records and there is no quality dashboard. Which signal directly explains the loss without treating it as an infrastructure failure?",
    options: [
      "The number of commits to the Git folder during the day.",
      "Total DBU usage across all of the account's workspaces.",
      "The number of files in the checkpoint directory.",
      "The expectation metrics and flow events in the pipeline's event log.",
    ],
    explanation: "The event log records pipeline events and metrics, including quality actions. A successful run can drop rows according to policy, so operational success and data quality must be observed separately.",
  },
  "pro-030": {
    question: "A gold table holds a quality_failure_rate indicator computed every fifteen minutes. Operations wants a notification when it exceeds 2%, while the workflow owner also needs to know about failures and runs that take too long. Which combination correctly separates the two kinds of signal?",
    options: [
      "A single CPU-usage alert for both data and workflow.",
      "A file-arrival trigger for both conditions.",
      "A SQL Alert on the indicator query and job notifications for run status or duration.",
      "A print in the notebook and a weekly manual review.",
    ],
    explanation: "A SQL Alert evaluates a condition on data; job notifications cover the run's lifecycle and performance. Separating them improves ownership, severity and responsiveness.",
  },
  "pro-031": {
    question: "An operations service queries thousands of runs through the Jobs API. It reads only the first response, concludes that there are no older failures, and sometimes marks a run as finished while it is still in a transitional state. What must be fixed in the client?",
    options: [
      "Always request a limit of a single run to avoid inconsistent states.",
      "Implement pagination and polling with backoff until a terminal state, also inspecting task states.",
      "Replace run identifiers with notebook names.",
      "Automatically repair every run while it is RUNNING.",
    ],
    explanation: "List APIs can paginate and a run's state evolves. A robust monitor consumes all relevant pages, respects limits with backoff and distinguishes lifecycle and result states at both run and task level.",
  },
  "pro-032": {
    question: "Hundreds of managed tables receive frequent MERGE and DELETE operations. The team maintains its own cron jobs for compaction, statistics and VACUUM, but they overlap, fail and consume on-call time. Which capability reduces that maintenance burden when it is available for those tables?",
    options: [
      "Convert every table to external and disable Delta history.",
      "Run OPTIMIZE after every micro-batch, even when nothing changed.",
      "Enable predictive optimization so Databricks schedules appropriate maintenance operations on managed tables.",
      "Manually empty the transaction log at the end of each job.",
    ],
    explanation: "Predictive optimization automates maintenance such as OPTIMIZE, VACUUM and statistics updates where appropriate. Managed tables let the platform take on more operational responsibility without breaking the transaction log.",
  },
  "pro-033": {
    question: "A 120 TB events table is filtered today by customer_id and event_date, but the team expects to add region and device_type. customer_id has very high cardinality and partitioning by it would produce millions of small directories. Which layout adapts best?",
    options: [
      "Use liquid clustering with a small set of relevant keys and revisit those keys as the query pattern changes.",
      "Physically partition by customer_id, region, device_type and every future column.",
      "Create a full table per customer.",
      "Sort the DataFrame once before writing and assume the global order will be preserved forever.",
    ],
    explanation: "Liquid clustering avoids a rigid directory scheme and lets keys evolve without immediately rewriting all existing data. A very high-cardinality key is usually a poor traditional partition.",
  },
  "pro-034": {
    question: "A 30 TB table receives selective deletes of a few rows spread across many files. Rewriting each whole file makes nightly maintenance exceed its window. What advantage do deletion vectors bring to this pattern?",
    options: [
      "They immediately delete the physical files and all their history without needing VACUUM.",
      "They mark rows as deleted without immediately rewriting each data file, deferring physical materialization to later operations.",
      "They automatically convert any non-Delta Parquet table into a streaming table.",
      "They avoid checking protocol compatibility with any external reader.",
    ],
    explanation: "Deletion vectors represent logical deletes and can speed up selective DML by avoiding immediate rewrites. Maintenance, retention and client/protocol compatibility considerations still apply.",
  },
  "pro-035": {
    question: "Query Profile shows that a query scans almost every file of a table even though it filters by account_id and event_date. There is no meaningful skew and the time is dominated by bytes read. Which intervention is guided by that evidence?",
    options: [
      "Raise spark.sql.shuffle.partitions, even though the profile shows no dominant shuffle.",
      "Force a broadcast of the large table.",
      "Change every string column to binary without reviewing consumers.",
      "Improve layout and statistics for those columns (for example with liquid clustering) and measure data skipping again.",
    ],
    explanation: "The signal points to poor pruning/data skipping, not shuffle parallelism. Organizing data around selective filters and maintaining statistics lets files be skipped; the change must then be checked in the profile.",
  },
  "pro-036": {
    question: "In a sort-merge join, a single “UNKNOWN” key holds 38% of the rows. Spark UI shows one task 40 times slower than the median while the others finish quickly. Which response addresses the observed cause first?",
    options: [
      "Disable AQE and reduce the number of executors to one.",
      "Cache the output table after the join.",
      "Enable/verify AQE skew join and, if that is not enough, separate or salt the skewed key while preserving semantics.",
      "Apply coalesce(1) before the join to concentrate all keys equally.",
    ],
    explanation: "A long tail caused by a dominant key is skew. AQE can split skewed partitions; extreme cases require explicit handling such as separating the key or salting with correct recombination.",
  },
  "pro-037": {
    question: "A workload runs on Photon, but its slowest stage executes a complex Python UDF. Adding nodes barely reduces the time and the profile shows the Python boundary as dominant. Which optimization is most likely to take advantage of the vectorized engine?",
    options: [
      "Rewrite the rule with supported native SQL/PySpark expressions and compare the plan before and after.",
      "Register the same Python UDF under a shorter name.",
      "Convert the UDF's output to JSON before writing.",
      "Disable Photon so that the UDF no longer appears in the profile.",
    ],
    explanation: "Photon accelerates supported operators but cannot optimize the opaque body of a Python UDF. Expressing the logic with native functions can remove serialization and expand the portion the engine can execute.",
  },
  "pro-038": {
    question: "A batch pipeline takes twelve minutes every hour and keeps an all-purpose cluster running permanently. It needs no in-memory state between runs and the team accepts serverless's functional profile. Which change is likely to reduce idle cost without sacrificing cadence?",
    options: [
      "Duplicate the all-purpose cluster so there is always a spare one.",
      "Keep the current cluster and disable auto-termination.",
      "Turn the batch into a continuous stream that never stops.",
      "Run the job on suitable serverless or ephemeral compute and validate duration, limits and cost with system tables.",
    ],
    explanation: "An ephemeral resource removes most of the idle time of a permanent interactive cluster. The decision must be verified against the SLA and actual consumption, not just the nominal DBU price.",
  },
  "pro-039": {
    question: "Regional analysts query the same customers table. Each group must see only its region, and email must appear partially hidden except for the fraud team. The logic must apply to any tool that queries the table. Which centralized control best meets the requirement?",
    options: [
      "Create a physical copy of the table per user and sync it every night.",
      "Apply a row filter for region and a column mask for email, with functions and permissions governed in Unity Catalog.",
      "Hide the columns in Catalog Explorer without changing query permissions.",
      "Ask every dashboard to include its own WHERE and regexp_replace.",
    ],
    explanation: "Row filters and column masks are enforced on table access and do not depend on each consumer remembering the rule. The functions must be carefully designed and governed to preserve least privilege.",
  },
  "pro-040": {
    question: "Data science needs to link a customer's events over time but must not receive the real customer_id. Compliance requires that an authorized service can reverse the substitution during an investigation. Which technique fits better than an unkeyed irreversible hash?",
    options: [
      "Suppress the whole row and replace it with null.",
      "Generalize customer_id by rounding it to the nearest thousand.",
      "Tokenize the identifier through a controlled service that keeps the mapping and separates the keys from the analytical data.",
      "Publish customer_id in clear text and rely on a contractual clause.",
    ],
    explanation: "Tokenization can keep join stability and reversibility under specific controls. A simple hash can be attacked and offers no authorized reversal; suppression or generalization do not meet the need for exact linkage.",
  },
  "pro-041": {
    question: "A valid request requires erasing a data subject from production Delta tables and preventing them from reappearing from bronze, Change Data Feed, checkpoints or reruns. The team proposes only running DELETE on the gold table. Which plan addresses the full lifecycle?",
    options: [
      "Locate the subject in every layer and derivative, prevent its replay, run governed deletes and apply retention/VACUUM according to policy and verified legal constraints.",
      "Drop the gold view; the underlying files and tables will disappear automatically.",
      "Rename the identifier column so the subject can no longer be found.",
      "RESTORE to a version before the subject arrived without considering later data.",
    ],
    explanation: "Purging must cover sources, layers, derivatives, replay mechanisms and physical retention. A DELETE on one output does not stop a backfill from regenerating the data, and VACUUM must respect the approved policy and dependencies such as CDF or time travel.",
  },
  "pro-042": {
    question: "A user has CAN EDIT on a notebook that contains SELECT * FROM main.finance.payroll, but Unity Catalog grants them neither USE CATALOG, USE SCHEMA nor SELECT on the table. Which security outcome should be expected when the notebook runs under their identity?",
    options: [
      "CAN EDIT automatically inherits SELECT on any table mentioned in the notebook.",
      "The notebook runs the query but masks every column without additional configuration.",
      "The workspace permission replaces Unity Catalog only during the first run.",
      "The query fails for lack of data privileges; workspace object ACLs do not grant access to the table.",
    ],
    explanation: "Permissions to edit a notebook and privileges on securables are separate controls. The user needs the applicable catalog/schema privileges and SELECT on the table, or an equivalent authorized path.",
  },
  "pro-043": {
    question: "A stream of requests may include PII in free-text fields. Silver feeds many consumers, and the requirement states that no unclassified record may reach that layer, but doubtful cases must not be lost. Which architecture best enforces the privacy boundary?",
    options: [
      "Publish to silver first and run a weekly mask over rows that were already consumed.",
      "Detect and classify before publishing, transform or mask valid cases, quarantine doubtful ones and record metrics and lineage.",
      "Drop all free text without keeping evidence or a reason.",
      "Rely solely on users not selecting the sensitive column.",
    ],
    explanation: "The control must sit before the consumption boundary. Separating doubtful cases allows review without exposure or silent loss, and metrics show that the control works in both batch and streaming.",
  },
  "pro-044": {
    question: "The sales_readers group must query every current and future table in main.sales, but not other schemas in the main catalog. Today permissions are granted table by table and new publications fail for readers. Which use of inheritance simplifies the model?",
    options: [
      "Grant SELECT on the whole metastore and rely on naming conventions.",
      "Give ownership of main to every member of sales_readers.",
      "Grant the group the required usage privileges and SELECT on the main.sales schema, leveraging inheritance to its objects.",
      "Grant CAN MANAGE on every SQL warehouse in the account.",
    ],
    explanation: "A grant on the schema can be inherited by child objects and avoids maintaining table lists. The applicable USE privileges must be included without widening access to unrelated schemas.",
  },
  "pro-045": {
    question: "Data search shows dozens of tables named customer_final_v2 with no description, functional owner or classification. Analysts open tickets to find out which one is reliable and which columns contain PII. Which improvement directly increases discoverability and governance?",
    options: [
      "Add clear comments to tables and columns, ownership and governed domain/sensitivity tags, without storing secrets in metadata.",
      "Rename every table to data and hide them from the catalog.",
      "Grant global SELECT so every user can explore the full content.",
      "Copy the documentation into a personal spreadsheet without linking it to the objects.",
    ],
    explanation: "Metadata next to the object improves search, understanding and policy enforcement. Tags must follow a governed taxonomy and must never contain sensitive values or credentials.",
  },
  "pro-046": {
    question: "A platform creates hundreds of new tables, and the team does not want to manage paths, orphaned-file cleanup and maintenance separately. There is no requirement for another platform to write directly to those locations. Which table type reduces operational overhead and keeps central governance?",
    options: [
      "External tables with a different path created manually by each developer.",
      "Session temporary views as production storage.",
      "Parquet files that are not registered in the catalog.",
      "Unity Catalog managed tables, letting the platform manage location and lifecycle.",
    ],
    explanation: "With a managed table, Unity Catalog and Databricks manage storage and metadata as one unit, enabling more automation. External tables remain valid when external control of the location is needed, but they add operational responsibility.",
  },
  "pro-047": {
    question: "The organization applies different masks by classification and country. Creating a function and a manual ALTER TABLE for each column no longer scales, and classifications are expressed through governed tags. Which approach centralizes the policy when the capability is enabled?",
    options: [
      "Generate an ungoverned copy of each table per country.",
      "Define ABAC policies based on governed tags, with explicit exceptions and per-role access tests.",
      "Ask every team to implement a different CASE WHEN in its dashboards.",
      "Grant SELECT only to the administrator and export CSV files to everyone else.",
    ],
    explanation: "ABAC expresses reusable controls over governed attributes, reducing object-by-object configuration. Taxonomy, precedence and tests remain essential to avoid misclassification.",
  },
  "pro-048": {
    question: "In a job A→B→C and A→D, A and D succeeded, B failed before writing and C was skipped because of its dependency. The failure is fixed by changing one parameter of B for that historical run. Which repair minimizes repeated work?",
    options: [
      "Create a new job that runs A, B, C and D from scratch.",
      "Manually mark the run as successful without running B.",
      "Delete the outputs of A and D and relaunch every task.",
      "Repair the run with the authorized override, rerunning B and its failed/skipped dependents without repeating the successful A and D.",
    ],
    explanation: "Job repair keeps the run's context and lets you repeat only the necessary part. Independent successful tasks do not need to run again; any partial effect of B must remain idempotent or be cleaned up explicitly.",
  },
  "pro-049": {
    question: "A stage has 2,000 tasks. The median takes 14 seconds, the 99th percentile exceeds 9 minutes, and the slow tasks read far more input and spill to disk. The logs show no functional errors. Which hypothesis is best supported by Spark UI?",
    options: [
      "A missing SELECT permission in Unity Catalog.",
      "Data skew that creates disproportionate partitions and memory pressure/spill.",
      "A syntax error in databricks.yml.",
      "An expired OpenSharing credential.",
    ],
    explanation: "Large dispersion in duration, bytes and spill within the same stage is typical evidence of skew. The next step is to locate dominant keys/partitions and review the plan, AQE and join strategy.",
  },
  "pro-050": {
    question: "A Spark Declarative Pipelines in Lakeflow update fails while materializing silver_orders, but other tables in the graph are updated. The job's summary message does not reveal whether the quality rule, the flow or the compute failed. Where is the dataset- and update-specific context obtained first?",
    options: [
      "In the pipeline's event log, filtering by the affected update, flow and dataset, and complementing with Spark UI where appropriate.",
      "In the browsing history of the developer who deployed.",
      "In system.billing.usage alone, because it contains the full stack trace of each dataset.",
      "In DESCRIBE HISTORY of an unrelated table.",
    ],
    explanation: "The event log is the structured source of the pipeline's events, state, quality and execution details. If the failure reaches Spark execution, its references let you dig further into Spark UI and logs.",
  },
  "pro-051": {
    question: "A CI pipeline deploys the same bundle to test and prod. In production, runs must use a restricted service principal and point to main_prod; in test, to main_test and a test identity. Which configuration makes safe promotion explicit?",
    options: [
      "A notebook that detects the workspace URL and changes its permissions with the REST API.",
      "Separate targets with catalog variables and the appropriate run_as, deployed by least-privilege CI identities.",
      "A manual copy of the YAML kept outside Git for each workspace.",
      "A personal administrator token shared by every runner.",
    ],
    explanation: "Targets and variables represent environment differences without forking the artifact. run_as controls the run identity, while the deploying identity should only have permissions to manage the required resources.",
  },
  "pro-052": {
    question: "The team keeps notebooks in a Git folder and assumes that pulling main will automatically update production jobs, permissions, pipelines and schedules. After the pull, the resources still have the previous configuration. Which concept corrects that assumption?",
    options: [
      "Git folders also manage all infrastructure state even when there is no declarative definition.",
      "Production jobs must always be edited by hand after each merge.",
      "The Git folder syncs code; resources and their configuration must be declared and deployed, for example through a bundle in CI/CD.",
      "Unity Catalog permissions are inferred from the Git branch name.",
    ],
    explanation: "Versioning code is not the same as applying resource configuration. A bundle describes jobs, pipelines, identities and parameters, and the delivery pipeline validates and deploys that definition in a controlled way.",
  },
  "pro-053": {
    question: "After deploying a faulty version, the team goes back to the previous wheel. However, the failed run had already run a MERGE into silver and sent some records to an external system. Which statement should guide the recovery?",
    options: [
      "Reverting the artifact automatically reverts every Delta commit and external effect.",
      "Deleting the job also removes its tables and published messages.",
      "A code rollback does not revert data or side effects; idempotent writes, reconciliation and a validated compensation or restore procedure are required.",
      "Rerunning the previous wheel by itself guarantees there will be no duplicates.",
    ],
    explanation: "Code, configuration, Delta commits and external systems have different lifecycles. A deployment strategy must combine reversible artifacts with idempotency, checkpoints and data-repair runbooks.",
  },
  "pro-054": {
    question: "A job fails intermittently with executor lost. Spark UI shows that all tasks are uniform, but the cluster logs record system memory pressure and node restarts during the same interval. Which diagnostic sequence avoids a premature conclusion?",
    options: [
      "Immediately switch every table to CSV.",
      "Ignore the timestamps and increase retries until some run finishes.",
      "Restore an old version of each input table.",
      "Correlate run, stage and compute logs by time, distinguish an infrastructure failure from a data error and test the change in a controlled run.",
    ],
    explanation: "The signals point to the execution environment, but they must be correlated before changing capacity or code. Retries can hide the incident and raise cost; a controlled test confirms the hypothesis.",
  },
  "pro-055": {
    question: "A sales model mixes order lines and daily totals in the same table. When revenue is summed by store, totals are doubled because some rows represent items and others represent whole days. Which modeling decision must be made before choosing keys or measures?",
    options: [
      "Declare a single, explicit grain for the fact table, separating facts with different granularities.",
      "Add more nullable columns so each row can represent any level.",
      "Apply distinct to the result of every dashboard.",
      "Partition by every numeric measure.",
    ],
    explanation: "The grain defines what a row represents and determines keys and additive measures. Mixing granularities produces ambiguous joins and aggregations that distinct cannot reliably fix.",
  },
  "pro-056": {
    question: "The business needs both each customer's current address and the address that was valid when a sale happened. The CDC feed contains the key, the operation and a monotonic sequence per customer. Which materialization preserves the required history?",
    options: [
      "Overwrite the whole dimension with the latest address and discard earlier events.",
      "Apply CDC with the correct keys and sequence_by for an SCD type 2 dimension, keeping validity intervals.",
      "Store each event as a new column in the customer row.",
      "Create a view that picks a random address when there are duplicates.",
    ],
    explanation: "SCD type 2 keeps versions and intervals to resolve the dimension in effect at the time of the fact. The CDC sequence orders changes and prevents an old event from replacing a newer version.",
  },
  "pro-057": {
    question: "A sale arrives before the dimension row for a new supplier. The fact must be published today with reconcilable amounts, and tomorrow the dimension will arrive with its final attributes. Which pattern keeps analytical integrity during the late arrival?",
    options: [
      "Permanently discard the sale because the dimension does not exist.",
      "Copy every supplier attribute as free text into the fact.",
      "Wait indefinitely and block the whole sales batch.",
      "Assign an unknown dimension row with a controlled surrogate key and reconcile/rekey when the real supplier arrives.",
    ],
    explanation: "The unknown dimension keeps the fact row and avoids null keys. A reconciliation process must identify those cases and link them to the final dimension without duplicating measures.",
  },
  "pro-058": {
    question: "Operations needs to answer how many contracts were active at the close of each day and compare daily balances. Rebuilding state from millions of events every time misses the dashboard SLA. Which fact type best serves that query pattern?",
    options: [
      "A table without dates that holds only the last observed contract.",
      "An SCD type 1 dimension with the aggregated balance of the whole company.",
      "A periodic snapshot fact with one row per contract and day (or the agreed closing grain) and balance/status measures.",
      "A bridge table between employees and offices.",
    ],
    explanation: "A periodic snapshot materializes state at regular points in time and makes trends and closes efficient. The grain must be defined explicitly to avoid double counting and control volume.",
  },
  "pro-059": {
    question: "A campaign can belong to several segments and a segment contains many campaigns. Joining campaign_fact directly with segment_dim duplicates revenue when the report aggregates by campaign. Which structure models the relationship without hiding the cardinality?",
    options: [
      "Add segment_1, segment_2 and segment_3 columns to the fact and limit the model to three segments.",
      "Randomly pick one segment per campaign before publishing.",
      "Concatenate all segments into a string and use LIKE in every query.",
      "Create a campaign-segment bridge table and define allocation or weighting rules for measures that are not additive across segments.",
    ],
    explanation: "The bridge table explicitly represents the many-to-many relationship. If a measure is split by segment, the model must define weights or aggregation rules so that revenue is not multiplied.",
  },
  "pro-060": {
    question: "A team maintains pipelines that use APPLY CHANGES and wants to adopt the recommended naming without redesigning its CDC logic. Which migration reflects Databricks' current recommendation?",
    options: [
      "Replace APPLY CHANGES with AUTO CDC, keeping the syntax and validating the flow's behavior.",
      "Rewrite each change as an append-only INSERT and remove the keys.",
      "Move CDC into a Python UDF executed row by row.",
      "Use Lakehouse Federation to modify the remote target table.",
    ],
    explanation: "AUTO CDC replaces APPLY CHANGES as the recommended name and keeps the same syntax. The migration must be validated, but it does not require changing the CDC model.",
  },
  "pro-061": {
    question: "A repository uses Asset Bundles in production. After the rename to Declarative Automation Bundles, the team worries that its bundle commands and configurations will stop working. Which action is technically correct?",
    options: [
      "Delete every target and recreate them from the UI.",
      "Keep using the existing configuration; the rename does not break the bundle command or its resources.",
      "Convert the bundle into a monolithic notebook.",
      "Manually rename every asset YAML key to declarative.",
    ],
    explanation: "The rename is non-disruptive. Existing commands and configurations keep working, even though the documentation and the course use the new name.",
  },
  "pro-062": {
    question: "FinOps wants to attribute cost per job run precisely. Some jobs share an all-purpose cluster with interactive notebooks and others use dedicated job compute. Which set provides the most reliable attribution?",
    options: [
      "The all-purpose jobs, because all usage belongs to the last job that ran.",
      "Job compute or serverless, joining usage_metadata with the system.lakeflow tables and prices.",
      "The number of notebooks per workspace multiplied by the list price.",
      "The cluster's duration without considering concurrency or SKU.",
    ],
    explanation: "Job compute and serverless expose job and run metadata suitable for joining usage, prices and the job definition. On shared compute, exact attribution is ambiguous.",
  },
  "pro-063": {
    question: "A catalog contains hundreds of tables. Columns tagged as PII must be masked, even when new tables appear, and owners must not be able to remove the protection. Which design best satisfies centralized control?",
    options: [
      "A separate view created manually by each owner.",
      "A catalog-level ABAC policy based on governed tags, plus separate base grants.",
      "A DENY applied to the SQL warehouse.",
      "Copy every PII column to a catalog with no users.",
    ],
    explanation: "ABAC lets you attach a policy to the catalog and match it dynamically against tagged tables and columns. Base grants are still controlled separately.",
  },
  "pro-064": {
    question: "A team needs to explore an external database without moving data during a proof of concept. If the use case becomes a high-volume, low-latency dashboard, it will accept materializing the data. Which sequence of decisions is the most defensible?",
    options: [
      "Start with query federation and, if the pattern becomes recurring and demanding, evaluate managed Lakeflow Connect.",
      "Create a manual CSV export from day one and keep it for production.",
      "Use Delta Sharing to write into the external database.",
      "Always keep federation because it never depends on source performance.",
    ],
    explanation: "Federation avoids data movement and fits ad hoc exploration; managed ingestion usually scales better for large volumes, recurrence and lower query latency.",
  },
};

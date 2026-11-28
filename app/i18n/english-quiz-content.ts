/**
 * English editorial projection of every assessment item (module quizzes and
 * both practice-exam banks), keyed by the persistent `editorialId`.
 *
 * Options are listed in the canonical Spanish order, so the correct answer index,
 * scoring keys and exam shuffling stay owned by the Spanish source. This file is
 * imported only by server-side localization; it must never ship answer keys.
 */
export type EnglishQuizCopy = {
  question: string;
  options: [string, string, string, string];
  explanation: string;
};

export const englishQuizContent: Record<string, EnglishQuizCopy> = {
  "m01-q1": {
    question: "Which component provides ACID transactions over the files of a lakehouse table?",
    options: ["Unity Catalog", "Delta Lake", "SQL warehouse", "Git folder"],
    explanation: "Delta Lake maintains the transaction log and defines the table guarantees; Unity Catalog governs the object.",
  },
  "m01-q2": {
    question: "A team needs to run the same dataset from BI and PySpark without creating two copies. Which design fits best?",
    options: ["Two CSV exports", "A shared notebook", "A governed Delta table and separate compute resources", "A permanent cluster per user"],
    explanation: "Separating storage and compute lets several engines access the same governed object.",
  },
  "m01-q3": {
    question: "Which object organizes catalogs and is assigned to workspaces?",
    options: ["Unity Catalog metastore", "SQL warehouse", "Checkpoint", "Task value"],
    explanation: "The metastore is the top-level Unity Catalog scope and contains the governed catalogs.",
  },
  "m01-q4": {
    question: "Which surface is most suitable for concurrent SQL BI?",
    options: ["Driver of a personal cluster", "Auto Loader", "Storage credential", "SQL warehouse"],
    explanation: "SQL warehouses are designed to run SQL workloads with isolation and concurrency.",
  },
  "m02-q1": {
    question: "Which option minimizes administration for an ETL workload compatible with the managed capabilities?",
    options: ["Serverless Jobs", "Personal cluster without auto-stop", "Pool with a permanent cluster", "Classic SQL warehouse for PySpark"],
    explanation: "Serverless Jobs manages compute provisioning and optimization for compatible tasks.",
  },
  "m02-q2": {
    question: "Which feature specifically reduces the startup time of classic clusters?",
    options: ["Auto-termination", "Liquid clustering", "Instance pool", "Unity Catalog"],
    explanation: "A pool keeps instances ready; auto-termination addresses idleness, not startup.",
  },
  "m02-q3": {
    question: "A query has a single slow partition caused by skew. Which action is NOT sufficient on its own?",
    options: ["Review the physical plan", "Analyze skewed keys", "Change the join strategy", "Enable autoscaling"],
    explanation: "Adding workers does not automatically split a skewed partition; the distribution or the plan must be fixed first.",
  },
  "m02-q4": {
    question: "Where would you query DBUs attributed through tags?",
    options: ["DESCRIBE HISTORY", "system.billing.usage", "Git folder", "Streaming checkpoint"],
    explanation: "The billing.usage system table records usage and custom_tags for attribution.",
  },
  "m03-q1": {
    question: "What best reveals that a notebook depends on hidden state?",
    options: ["It has several Markdown cells", "It does not use display", "It fails when restarted and run all in order", "It includes a SQL query"],
    explanation: "A clean run removes leftover variables and state, exposing implicit dependencies.",
  },
  "m03-q2": {
    question: "Where do Spark operations submitted through Databricks Connect run?",
    options: ["On the remote compute", "Always in local pandas", "In GitHub Actions", "In the browser"],
    explanation: "The local client builds the plans, but Spark executes on Databricks.",
  },
  "m03-q3": {
    question: "Which value is appropriate for a Job parameter?",
    options: ["The JDBC password", "A serialized dataset", "A private key", "The processing date"],
    explanation: "The date varies the run without exposing credentials; secrets must be handled through dedicated mechanisms.",
  },
  "m03-q4": {
    question: "A native function exists to transform a column. Which option best preserves optimization?",
    options: ["collect and a local loop", "The native SQL/PySpark function", "An equivalent Python UDF", "Convert the whole table to pandas"],
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
    explanation: "A left join keeps every row on the left side and adds null when the dimension is missing.",
  },
  "m04-q3": {
    question: "A JSON payload carries hundreds of optional fields that change, but three critical fields must be queried with stable types. Which design is most defensible?",
    options: ["Store only the JSON string and parse it fully in every query", "Create one column per possible field and accept silent drift", "Keep the payload as VARIANT and project the critical fields to typed columns", "Use VARIANT as the clustering key and group directly by the full payload"],
    explanation: "VARIANT keeps flexibility and an optimized encoding; typed projections stabilize contracts and let the fields in use be optimized. VARIANT does not support clustering or direct aggregation on the whole column.",
  },
  "m04-q4": {
    question: "Which pattern keeps the most recent event deterministically?",
    options: ["dropDuplicates without ordering", "row_number over a window with a tiebreaker", "distinct after collect", "groupBy over every column"],
    explanation: "The window expresses priority and a stable tiebreaker.",
  },
  "m05-q1": {
    question: "In one stage a single task takes 12 minutes and the rest take 20 seconds. What do you suspect first?",
    options: ["Skew", "Missing catalog", "Auto-stop", "Syntax error"],
    explanation: "A long tail inside the same stage is the typical signal of a skewed partition.",
  },
  "m05-q2": {
    question: "What does repartition do?",
    options: ["It only changes metadata", "It always reduces partitions without a shuffle", "It redistributes data through a shuffle", "It materializes data on the driver"],
    explanation: "repartition creates a new distribution and normally a shuffle.",
  },
  "m05-q3": {
    question: "When is a broadcast reasonable?",
    options: ["Both sides are huge", "The small side fits comfortably on the executors", "There is a single partition", "The driver has little disk"],
    explanation: "Broadcast replicates the small side and avoids shuffling the large one.",
  },
  "m05-q4": {
    question: "A cluster never reaches RUNNING. Which surface do you check first?",
    options: ["Query Profile", "DESCRIBE HISTORY", "Lineage", "Compute events and configuration"],
    explanation: "The Spark UI does not contain any jobs yet; the failure lies in provisioning or configuration.",
  },
  "m06-q1": {
    question: "How do you convert an eligible external Delta table to managed while keeping history, permissions and views?",
    options: ["CREATE TABLE AS SELECT", "ALTER TABLE … SET MANAGED", "DROP and manual re-creation", "VACUUM"],
    explanation: "SET MANAGED preserves the identity and continuity of the object; the conversion requires compatible compute and clients and restarting streams.",
  },
  "m06-q2": {
    question: "What prevents an old event from reverting a customer in a MERGE?",
    options: ["A sequence condition in MATCHED", "VACUUM", "A final SELECT DISTINCT", "Auto-stop"],
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
    question: "Which layer keeps source fidelity so you can rerun?",
    options: ["Gold", "Bronze", "Dashboard", "Dimension"],
    explanation: "Bronze preserves the original data and its metadata.",
  },
  "m07-q2": {
    question: "What does a fact table define first?",
    options: ["Dashboard color", "Number of partitions", "Grain", "Warehouse type"],
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
    explanation: "Quarantine keeps evidence and lets valid records move forward.",
  },
  "m08-q1": {
    question: "What does COPY INTO guarantee by default?",
    options: ["Deduplication by key", "History of processed files", "CDC of deletes", "Broadcast join"],
    explanation: "It tracks files, not business duplicates.",
  },
  "m08-q2": {
    question: "Which format includes a transaction log?",
    options: ["CSV", "JSON", "Delta", "Plain Parquet"],
    explanation: "Delta combines Parquet files with a transaction log.",
  },
  "m08-q3": {
    question: "Where should governed non-tabular files live?",
    options: ["Unity Catalog Volume", "Local driver", "Git folder", "Widget"],
    explanation: "Volumes govern access to files.",
  },
  "m08-q4": {
    question: "What is the risk of a highly parallelized JDBC read?",
    options: ["It creates lineage", "It enables Photon", "It converts to Delta", "It overloads the source"],
    explanation: "Each partition can open a concurrent connection.",
  },
  "m09-q1": {
    question: "Which option sets the format in Auto Loader?",
    options: ["cloudFiles.format", "checkpointLocation", "mergeSchema", "trigger"],
    explanation: "cloudFiles.format identifies JSON, CSV, Parquet, and so on.",
  },
  "m09-q2": {
    question: "Which path must two queries never share?",
    options: ["Catalog", "Checkpoint", "Team name", "Dashboard"],
    explanation: "Each query needs its own compatible checkpoint.",
  },
  "m09-q3": {
    question: "A database does not expose CDC, but `updated_at` increases monotonically on every insert or update. A scheduled load without a gateway or staging is required. Which pattern fits?",
    options: ["COPY INTO over the remote table", "An Auto Loader checkpoint over JDBC", "Lakeflow Connect query-based with `updated_at` as the cursor", "Federation and a manual overwrite of Gold"],
    explanation: "The query-based connector uses the cursor as a high-water mark, queries new values on each scheduled run and writes the target without a gateway or staging.",
  },
  "m09-q4": {
    question: "What preserves an unexpected field?",
    options: ["VACUUM", "Auto-stop", "Broadcast", "rescuedDataColumn"],
    explanation: "Rescued data avoids losing the part of the payload that does not fit the schema.",
  },
  "m10-q1": {
    question: "How do you recover only the failed tasks?",
    options: ["A new workspace", "Repair run", "VACUUM", "Clone"],
    explanation: "Repair reruns only the necessary subset.",
  },
  "m10-q2": {
    question: "What carries a DataFrame between tasks?",
    options: ["Task value", "Widget", "Governed table", "Email"],
    explanation: "Datasets must be persisted; task values are small scalars.",
  },
  "m10-q3": {
    question: "Which trigger responds to irregular arrivals?",
    options: ["File arrival", "Cron every minute", "Auto-stop", "SQL alert"],
    explanation: "It is a data-driven trigger.",
  },
  "m10-q4": {
    question: "When is a retry safe?",
    options: ["When the append duplicates", "Never", "Only manually", "When the task is idempotent"],
    explanation: "Repeating it must produce the same logical state.",
  },
  "m11-q1": {
    question: "Which minimum privileges allow reading a table?",
    options: ["SELECT only", "USE CATALOG, USE SCHEMA and SELECT", "MODIFY", "OWN"],
    explanation: "You need to traverse the ancestors and read the object.",
  },
  "m11-q2": {
    question: "What scales masks by classification?",
    options: ["ABAC", "Widget", "Pool", "Checkpoint"],
    explanation: "ABAC applies policies based on governed tags.",
  },
  "m11-q3": {
    question: "Which command applies the resources of a bundle?",
    options: ["bundle init", "bundle summary", "bundle deploy", "fs cp"],
    explanation: "deploy creates or updates the target's resources.",
  },
  "m11-q4": {
    question: "Which identity should run production?",
    options: ["Any analyst", "A token in YAML", "The user who made the commit", "A dedicated service principal"],
    explanation: "It avoids depending on a personal identity and applies least privilege.",
  },
  "m12-q1": {
    question: "Growing hourly JSON at high volume: which ingestion is preferred?",
    options: ["Auto Loader", "collect", "Git", "VACUUM"],
    explanation: "Auto Loader discovers files incrementally with state.",
  },
  "m12-q2": {
    question: "What recovers failed tasks without repeating successful ones?",
    options: ["RESTORE", "Repair run", "REVOKE", "OPTIMIZE"],
    explanation: "Repair acts on a subset of the DAG.",
  },
  "m12-q3": {
    question: "Which combination grants minimum read access?",
    options: ["OWN", "MODIFY", "USE CATALOG + USE SCHEMA + SELECT", "ALL PRIVILEGES"],
    explanation: "It allows resolving the ancestors and reading the object.",
  },
  "m12-q4": {
    question: "A Spark job has a single extreme partition. What is the first diagnosis?",
    options: ["More permissions", "A new catalog", "Auto-stop", "Skew in the Spark UI"],
    explanation: "Uneven task distribution points to skew.",
  },
  "m13-q1": {
    question: "A Job must process everything accumulated every ten minutes and then finish so compute does not sit idle. Which configuration fits best?",
    options: ["A full batch read without a checkpoint", "A query with `availableNow=True` and a stable checkpoint", "A 100-millisecond trigger running continuously", "Deleting the checkpoint at the start of every Job"],
    explanation: "`availableNow` incrementally drains the available backlog and stops; the checkpoint lets the next run continue without rereading what was already committed.",
  },
  "m13-q2": {
    question: "After changing the keys of a stateful aggregation, the query does not restart from the previous checkpoint. What is the correct response?",
    options: ["Add workers until the checkpoint becomes compatible", "Disable commit writing", "Plan a migration/reprocessing with a new checkpoint because the state schema changed", "Set `failOnDataLoss=false` on any source"],
    explanation: "The keys of a stateful operation are part of the state schema. The change is usually incompatible and requires a controlled cutover, not more capacity.",
  },
  "m13-q3": {
    question: "A `foreachBatch` calls an API that creates a charge, and the driver fails before committing the batch. What prevents duplicate charges on retry?",
    options: ["Sending a stable idempotency key per transaction", "Using a longer trigger", "Changing the output mode to `complete`", "Reducing the DataFrame to a single partition"],
    explanation: "The micro-batch can be presented again. An idempotency key accepted by the external system makes the repetition have the same final effect.",
  },
  "m13-q4": {
    question: "The input rate is 8,000 rows/s, the processed rate 5,000 rows/s, and lag grows for an hour. Which conclusion is supported?",
    options: ["The source is empty", "The checkpoint has deduplicated too many rows", "The watermark is necessarily too short", "The query cannot sustain the arrival rate and accumulates backlog"],
    explanation: "A processed rate that stays below the input rate, together with growing lag, demonstrates a capacity deficit or an execution bottleneck that must be diagnosed.",
  },
  "m14-q1": {
    question: "An event happened at 10:02, arrived at 10:19, and must be counted in the real sales interval. Which timestamp governs the window?",
    options: ["The cluster start time", "The 10:19 processing time", "The 10:02 event time", "The time of the next Job run"],
    explanation: "The business window must use event time so that late arrivals and replays keep the same time assignment.",
  },
  "m14-q2": {
    question: "The state of an aggregation grows without bound even though `withWatermark` exists. Which check is most relevant first?",
    options: ["That the marked column actually participates in the window and has valid timestamps", "That the SQL warehouse has auto-stop", "That the catalog uses three-level names", "That the notebook has fewer cells"],
    explanation: "A watermark on a column the operator does not use, or one pushed ahead by wrong timestamps, does not provide the expected state boundary.",
  },
  "m14-q3": {
    question: "Two copies of the same `event_id` can differ by 25 minutes of event time. Which configuration guarantees both are recognized as duplicates?",
    options: ["A five-minute trigger without a watermark", "`distinct()` over `ingested_at`", "A ten-minute watermark", "`dropDuplicatesWithinWatermark` with a horizon longer than 25 minutes"],
    explanation: "The tolerance must exceed the maximum expected time gap between duplicates; otherwise the first key may leave the state before the second one arrives.",
  },
  "m14-q4": {
    question: "A left outer stream-stream join emits unmatched records too late for the consumer. What explains that latency?",
    options: ["Delta Lake always waits for `OPTIMIZE`", "The engine must wait for the watermark and the time bound before concluding that no match will arrive", "Outer joins only run in batch", "The checkpoint rereads every event"],
    explanation: "An unmatched row is not final until the time horizon closes; that wait is part of the correctness of the outer join.",
  },
  "m15-q1": {
    question: "A team changes `startingOffsets` from `latest` to `earliest`, keeps the checkpoint, and expects to reread six months. What will happen?",
    options: ["It will reread from earliest in the next micro-batch", "Kafka will delete the consumer group", "It will resume from the checkpoint; an isolated reprocessing is needed to rewind", "It will duplicate only the last partition"],
    explanation: "In a resumed streaming query the checkpoint offsets take precedence. `startingOffsets` only applies when a new query starts.",
  },
  "m15-q2": {
    question: "You must investigate exactly which message produced an incorrect silver row. Which metadata is essential to keep?",
    options: ["Topic, partition and offset", "Only the cluster time", "Only the micro-batch number", "The notebook name and the driver size"],
    explanation: "A Kafka position is identified by topic-partition-offset; keeping the payload and schema version completes the traceability.",
  },
  "m15-q3": {
    question: "Each micro-batch finishes in 20 seconds, but lag grows because 300,000 events arrive per minute and `maxOffsetsPerTrigger` is 100,000. Which diagnosis is correct?",
    options: ["The trigger is deduplicating by mistake", "The checkpoint should be deleted every minute", "The topic needs less retention", "The ingestion limit is below the arrival rate and the pipeline does not converge"],
    explanation: "Processing at most 100,000 per trigger against 300,000 incoming creates backlog even though each individual batch is short.",
  },
  "m15-q4": {
    question: "An HTTP sink receives the same micro-batch twice after a failure. Which design preserves a single effect per order?",
    options: ["Changing `subscribe` to `assign`", "Sending `event_id` as an idempotency key accepted by the service", "Removing the Kafka key", "Setting `failOnDataLoss=false`"],
    explanation: "The checkpoint cannot revert an HTTP effect that was already confirmed; the receiver must deduplicate with a stable idempotency key.",
  },
  "m16-q1": {
    question: "An update with sequence 104 arrives before another with sequence 103. What must remain current after AUTO CDC?",
    options: ["103, because it arrived last", "104, because `SEQUENCE BY` represents the authoritative order", "Both as current rows", "Neither until `VACUUM` runs"],
    explanation: "AUTO CDC uses the declared sequence to resolve out-of-order events; arrival time must not move the state backwards.",
  },
  "m16-q2": {
    question: "A new solution uses Lakeflow pipelines to apply a CDC feed. Which API should current documentation name?",
    options: ["COPY CHANGES", "MERGE STREAM", "APPLY CHANGES as the only current API", "AUTO CDC, noting that it replaces APPLY CHANGES"],
    explanation: "Databricks recommends AUTO CDC; APPLY CHANGES is the former name and remains available for compatibility.",
  },
  "m16-q3": {
    question: "Reporting must know the segment a customer had when each sale happened. Which modeling applies?",
    options: ["SCD type 2 with validity intervals", "SCD type 1 overwriting the segment", "A view of the last micro-batch without a key", "Deleting history after every run"],
    explanation: "SCD 2 keeps the versions needed for a point-in-time join; SCD 1 keeps only the current value.",
  },
  "m16-q4": {
    question: "A CDF consumer was stopped for longer than the retention period and the required version no longer exists. Which response is safe?",
    options: ["Use `failOnDataLoss=false` and assume nothing is missing", "Invent the version from the current timestamp", "Rebuild from a valid snapshot and reset the incremental starting point", "Delete the source table"],
    explanation: "When feed versions are missing, continuity cannot be guaranteed; an authoritative snapshot lets you rebuild the state and restart consumption.",
  },
  "m17-q1": {
    question: "The query is ACTIVE, but the maximum published `event_ts` is 40 minutes behind. Which indicator is breached?",
    options: ["Metastore availability", "Business freshness", "VACUUM retention, necessarily", "Number of notebooks"],
    explanation: "The process can be active and still publish old data. The gap between event time and publication measures freshness.",
  },
  "m17-q2": {
    question: "After a transient executor failure, code, source and state have not changed. Which recovery minimizes risk?",
    options: ["Resume with the same checkpoint", "Delete bronze and start from latest", "Create a new checkpoint without reconciliation", "Empty the target before every retry"],
    explanation: "With a compatible topology, the checkpoint keeps offsets, commits and state and lets processing continue from the last committed point.",
  },
  "m17-q3": {
    question: "After an outage, the pipeline processes at exactly the same rate at which new events arrive. What happens to the backlog?",
    options: ["It disappears thanks to the watermark", "It doubles on every trigger", "It stays roughly constant and the SLA is not recovered", "Delta automatically turns it into batch"],
    explanation: "To reduce backlog, throughput must temporarily exceed the arrival rate; matching it only stops it from growing.",
  },
  "m17-q4": {
    question: "A game day is declared successful because the Job returns to RUNNING, but 4% of events are lost. What is the correct assessment?",
    options: ["Success, because the RUNNING state is enough", "Success if the cluster uses Photon", "Success if the checkpoint was deleted", "Failure: recovery must also restore completeness and the SLO within the RTO"],
    explanation: "The goal is to recover the correct service, not just restart the process. The loss breaches the completeness criterion.",
  },
  "m18-q1": {
    question: "A decorated function calls `saveAsTable` and then returns a DataFrame. What problem does this introduce?",
    options: ["None; every declarative function must write manually", "The pipeline loses Unity Catalog", "It mixes an imperative side effect with the declaration and hinders re-evaluation/optimization", "It automatically turns the table into SCD 2"],
    explanation: "Pipeline functions must describe datasets by returning DataFrames. The service manages writes and execution.",
  },
  "m18-q2": {
    question: "Gold must reflect updates in silver and serve an already materialized per-customer aggregate. Which object fits?",
    options: ["A materialized view", "An append of files without a table", "A notebook with `display`", "A checkpoint shared between queries"],
    explanation: "The materialized view keeps the result, and the service can refresh it from upstream changes.",
  },
  "m18-q3": {
    question: "A global streaming aggregate without a watermark must emit only the rows that change to a sink. Which proposal correctly describes the current capability?",
    options: ["Use AUTO CDC, which computes any global aggregate without a sequence", "Use a SQL append flow and assume it updates earlier rows", "Use `@dp.update_flow` in Python, stating that it is in Public Preview", "Use `ONCE`, which reruns every micro-batch"],
    explanation: "`update_flow` emits changes of a global aggregate to a sink, but it remains in Public Preview and is only available in Python.",
  },
  "m18-q4": {
    question: "What must stay the same when promoting from test to prod?",
    options: ["Catalog, credentials and capacity", "The code artifact and its versioned logic", "Every physical resource name", "The developer's identity"],
    explanation: "The same artifact is promoted; configuration, identities, targets and capacity change per environment.",
  },
  "m19-q1": {
    question: "A new currency rule must be measured for two weeks without blocking or dropping orders. Which action applies?",
    options: ["`expect_or_fail`", "`expect`", "`expect_or_drop` without quarantine", "Delete the event log"],
    explanation: "`expect` keeps records and produces metrics, which suits observing the impact before tightening the contract.",
  },
  "m19-q2": {
    question: "Operations needs to fix and reinject orders without `order_id`. Which design provides enough evidence?",
    options: ["A quarantine table with payload, reason, provenance and version", "A counter of dropped rows without data", "`expect_or_drop` and no additional record", "A screenshot of the pipeline once a month"],
    explanation: "Remediation requires keeping the row and its origin, plus a stable reason that guides the fix.",
  },
  "m19-q3": {
    question: "Where are the structured metrics of an expectation found during an update?",
    options: ["Only in the driver's Spark UI", "In the physical name of the checkpoint", "In the pipeline event log, inside `flow_progress` events", "Only in `VACUUM` history"],
    explanation: "The event log records progress and `data_quality` per flow/update and can be queried from SQL.",
  },
  "m19-q4": {
    question: "You want to automatically detect a table that stopped updating and changes in distribution, without modifying the producing job. Which capability fits?",
    options: ["`expect_or_fail` for any table, even if it is not part of the pipeline", "Data Quality Monitoring: anomaly detection for freshness/completeness and data profiling for distribution/drift", "A daily `VACUUM` as a monitor", "A manual screenshot of the catalog"],
    explanation: "Data Quality Monitoring observes Unity Catalog assets without modifying the table or adding overhead to the producing job; on its own it does not apply DROP or FAIL actions.",
  },
  "m20-q1": {
    question: "A cleanup task must run even if either of two branches fails. Which condition applies?",
    options: ["If/else on the number of rows", "Run if `ALL_DONE`", "Run if `ALL_SUCCESS`", "An independent continuous trigger"],
    explanation: "`ALL_DONE` evaluates upstream states and allows cleanup after success or failure.",
  },
  "m20-q2": {
    question: "An API accepts at most four simultaneous requests and there are 30 regions. Which design is appropriate?",
    options: ["A For each with concurrency 4 and an idempotent body", "Thirty Jobs without a concurrency limit", "A Python loop on the driver without tasks", "A Kafka `maxOffsetsPerTrigger`"],
    explanation: "For each models operational units, and its concurrency protects the external limit.",
  },
  "m20-q3": {
    question: "The invalid rate computed by `validate` decides whether to publish. How is it best passed along?",
    options: ["Copying the whole DataFrame into a widget", "With a global variable from the upstream notebook", "Writing it into the cluster name", "As a task value referenced by the If/else task"],
    explanation: "It is a small scalar produced upstream, the natural case for `taskValues` and a dynamic reference.",
  },
  "m20-q4": {
    question: "A task failed with a timeout after the other regions finished. The quota is fixed and you want to keep the run. Which action minimizes repetition?",
    options: ["Delete every table and launch a different Job", "Increase retries indefinitely", "Repair the run by rerunning the failed subset, verifying idempotency", "Manually mark the task as success"],
    explanation: "A repair run keeps context and reruns failed/skipped tasks; idempotency protects against partial effects.",
  },
  "m21-q1": {
    question: "The files of a batch arrive over 45 seconds and the Job must not start halfway through. Which option addresses that requirement?",
    options: ["`wait_after_last_change_seconds` greater than the internal gap of the batch", "`max_concurrent_runs=20`", "A schedule every second", "Deleting files after the first one"],
    explanation: "The debounce restarts the wait with every arrival and launches the run once a quiet period has elapsed.",
  },
  "m21-q2": {
    question: "A consumer depends on a commit to a Unity Catalog table, not on the physical files. Which trigger is most direct?",
    options: ["Continuous without a source", "Yearly schedule", "Table update", "File arrival on `_delta_log`"],
    explanation: "Table update observes the governed update of the table and avoids depending on internal Delta files.",
  },
  "m21-q3": {
    question: "You need to reprocess 90 days with the same daily logic. Which approach reduces divergence?",
    options: ["Copy the notebook and remove validations to speed it up", "Use a backfill of the same Job parameterized by date with an idempotent write", "Overwrite the whole table for every day", "Create 90 different permanent Jobs"],
    explanation: "The backfill reuses the production automation and generates runs per interval with controlled parameters.",
  },
  "m21-q4": {
    question: "Runs take 40 minutes and triggers arrive every 10. All of them overwrite the same partition. Which change is unsafe?",
    options: ["Measure and shorten the critical path", "Apply queueing for a bounded peak", "Change the write to an idempotent per-date boundary", "Increase concurrency without isolating the writes"],
    explanation: "Concurrent runs that mutate the same range create races; isolation or a proven transactional operation is needed first.",
  },
  "m22-q1": {
    question: "Customers arrive as out-of-order updates and deletes and only the current state is needed. Which object is appropriate?",
    options: ["Append flow without a key", "Materialized view without a sequence", "AUTO CDC with SCD type 1, a key and `SEQUENCE BY`", "APPLY CHANGES presented as the only current API"],
    explanation: "AUTO CDC is the current API, and SCD 1 materializes the current state by resolving order and deletes per key.",
  },
  "m22-q2": {
    question: "An order without an ID must be fixed later without stopping valid orders. Which action satisfies the requirement?",
    options: ["Classify it into a traceable quarantine and exclude it from silver", "Fail every parallel flow", "Keep it in gold with a null ID", "Drop it without a record"],
    explanation: "Quarantine keeps evidence and enables remediation while the valid branch continues.",
  },
  "m22-q3": {
    question: "Publishing must be blocked when the invalid rate exceeds 1%, while keeping the declarative transformation clean. Where does the branching go?",
    options: ["Inside `@dp.table`, calling an API", "In `VACUUM`", "In the Kafka schema", "In Lakeflow Jobs through validation, a task value and If/else"],
    explanation: "The pipeline produces data and metrics; Jobs coordinates decisions and operational effects through control flow.",
  },
  "m22-q4": {
    question: "The pipeline finished green once. What evidence is missing to call it production-ready?",
    options: ["Just changing the dashboard color", "Tests of idempotency, failure/repair, backfill, quality, SLO and permissions", "An additional notebook that is never run", "Deleting the event log to save space"],
    explanation: "Production readiness includes behavior under retries and incidents, observability and governance, not just the happy path.",
  },
  "m23-q1": {
    question: "A stage shows high aggregate spill, but 98% of it comes from two tasks that also read ten times more shuffle than the median. Which action is most solid first?",
    options: ["Permanently double every worker.", "Identify the keys of those partitions and check AQE's skew handling.", "Disable AQE to stabilize the initial plan.", "Reduce `spark.sql.shuffle.partitions` to one."],
    explanation: "Concentration in two tasks points to per-partition skew. More global capacity can hide it but does not fix the distribution.",
  },
  "m23-q2": {
    question: "A filtered dimension takes 80 MB and is stable; the fact has 4 TB. Statistics are up to date and the join type supports broadcast. Which plan avoids the most movement?",
    options: ["Cross join with a later filter.", "Repartition both sides to one partition.", "Persist the whole fact before every run.", "Broadcast hash join of the projected dimension."],
    explanation: "Broadcasting the small, bounded relation avoids shuffling the fact; the projection also reduces the replicated memory.",
  },
  "m23-q3": {
    question: "Which is a real capability of AQE in Databricks?",
    options: ["Coalescing small post-shuffle partitions using runtime statistics.", "Arbitrarily reordering every join during the query.", "Converting a stateful streaming transformation into batch.", "Removing the need for statistics and observability."],
    explanation: "AQE can coalesce partitions, switch certain strategies, handle skew and propagate empty relations; it does not redesign the whole query.",
  },
  "m23-q4": {
    question: "A pipeline uses a scalar Python UDF to normalize a date that `to_date` and `date_trunc` can handle. Which change usually improves performance and explainability?",
    options: ["Increase driver memory without changing the code.", "Convert every row to pandas and back to Spark.", "Replace the UDF with native functions and verify the plan.", "Add a `collect()` before the UDF."],
    explanation: "Native functions avoid the Python/JVM barrier and keep the expression visible to Catalyst and Photon.",
  },
  "m24-q1": {
    question: "A query uses Photon, but the profile shows a fallback around a Python transformation. What is the best first improvement?",
    options: ["Change the Delta format to CSV.", "Disable Photon so the plan is uniform.", "Replace the UDF with native functions if an equivalent exists.", "Shrink the warehouse to a single unit."],
    explanation: "Native functions keep the operation visible and compatible with the engine; scaling does not remove the UDF barrier.",
  },
  "m24-q2": {
    question: "A managed table receives changing filters by date and customer and needs to adapt its layout without rigid partitions. Which strategy fits best?",
    options: ["Liquid clustering based on observed patterns, ideally with predictive optimization.", "Partition by every customer_id.", "Run `coalesce(1)` after every write.", "Disable file statistics."],
    explanation: "Liquid clustering lets keys evolve and avoids high-cardinality physical partitions.",
  },
  "m24-q3": {
    question: "Which requirement must be checked before enabling deletion vectors on a table consumed outside Databricks?",
    options: ["That every query uses `SELECT *`.", "That the table is partitioned by date.", "That the driver has twice the memory.", "That every reader and writer supports the protocol feature."],
    explanation: "Deletion vectors raise the protocol features; an incompatible client may stop being able to read or write the table.",
  },
  "m24-q4": {
    question: "Predictive optimization is active on a catalog of managed tables. Which FinOps practice is most reasonable?",
    options: ["Also keep an hourly global `OPTIMIZE` just in case.", "Retire indiscriminate maintenance after reviewing the history, performance and cost of the automatic operations.", "Convert every table to external.", "Disable `ANALYZE` to reduce metadata."],
    explanation: "The automation selects beneficial operations; avoid duplicating them and validate with history and billing.",
  },
  "m25-q1": {
    question: "A daily Python job tolerates six minutes of startup, uses supported APIs and needs no custom networking. Which initial option is most reasonable?",
    options: ["Serverless Jobs in standard mode.", "An always-on classic all-purpose cluster.", "Classic SQL warehouse.", "A single-node cluster without auto-termination."],
    explanation: "The workload is compatible and tolerates the startup; standard mode reduces cost compared with performance optimized.",
  },
  "m25-q2": {
    question: "Duration is dominated by a single task with high CPU; the rest of the workers sit idle. Which change does NOT address the cause?",
    options: ["Profile the key that feeds that task.", "Review partitioning and skew.", "Double the maximum workers without changing the plan.", "Check whether the operation is serial or not parallelizable."],
    explanation: "More workers do not speed up a single task; parallelism must be recovered or skew fixed first.",
  },
  "m25-q3": {
    question: "Which mechanism attributes tags to serverless notebooks and jobs in `system.billing.usage`?",
    options: ["A global init script.", "A serverless usage policy assigned to the user or workload.", "Renaming the warehouse.", "A scheduled `VACUUM`."],
    explanation: "Serverless usage policies propagate their custom tags to the billing records.",
  },
  "m25-q4": {
    question: "A consumption report excludes negative rows from `system.billing.usage`. What is the risk?",
    options: ["Losing only the notebook name.", "Disabling Photon.", "Converting DBUs into CPU hours.", "Ignoring correction retractions and overestimating consumption."],
    explanation: "Corrections can appear as a retraction plus a restatement; the signed quantity must be aggregated.",
  },
  "m26-q1": {
    question: "A classic job takes 35 minutes. What is the most efficient diagnostic sequence in the Spark UI?",
    options: ["Change the node type and then open the UI.", "Read every driver log from the beginning.", "Start with the timeline, find the dominant stage and drill down into its tasks.", "Run `collect()` to get a local sample."],
    explanation: "Top-down navigation links the overall duration to the stage and tasks that actually explain it.",
  },
  "m26-q2": {
    question: "A serverless query has no Spark UI. Which tool shows top operators, pruning, I/O and time spent in Photon?",
    options: ["Query Profile.", "The DBFS browser.", "The classic compute event log.", "A `DESCRIBE HISTORY` of any table."],
    explanation: "Query Profile is the diagnostic interface for SQL warehouses and serverless compute.",
  },
  "m26-q3": {
    question: "A job ends with `SUCCESS`, but the table arrives late and its distribution changes without execution errors. Which signal adds the missing evidence?",
    options: ["Only the job's number of workers.", "Data Quality Monitoring: anomaly detection for freshness/completeness and profiling for distribution/drift.", "`bundle validate`, because it validates the content of every table.", "`VACUUM`, because it records any semantic degradation."],
    explanation: "The run state describes execution. Data Quality Monitoring observes asset health and lets you correlate freshness, completeness or distribution anomalies with the run.",
  },
  "m26-q4": {
    question: "An on-call script fetches a failed run and immediately calls `repair-run`. What is the main weakness?",
    options: ["The CLI cannot query jobs.", "It mutates the incident before preserving and evaluating the causal evidence.", "Repairs always create a new job.", "OAuth does not work with the CLI."],
    explanation: "Capture and repair must be separated to keep evidence and avoid wrong automatic actions.",
  },
  "m27-q1": {
    question: "During a SEV-2, adding compute restores the SLA but the cause remains unknown. How should it be recorded?",
    options: ["As a permanent fix because it worked.", "As the root cause of the incident.", "As proof that CPU was missing.", "As a temporary mitigation with an expiry, cost and rollback."],
    explanation: "The action reduces impact but does not demonstrate the cause; it needs explicit limits and reversal.",
  },
  "m27-q2": {
    question: "A retry turned the run green, but the sink was append-only and the first attempt wrote partially. What is missing before closing?",
    options: ["Increase driver log retention.", "Reconcile duplicates and partial effects for the affected range.", "Run `VACUUM RETAIN 0 HOURS`.", "Delete the job history."],
    explanation: "A green state does not validate semantics; a partial append can duplicate data after the retry.",
  },
  "m27-q3": {
    question: "What is the best falsifiable hypothesis for a stage with five stragglers?",
    options: ["Five hot keys concentrate the data; this will be checked with frequencies and bytes per task.", "Spark is slow and needs more nodes.", "The cloud provider had a problem.", "The query is too complex."],
    explanation: "The hypothesis specifies a mechanism and evidence that can confirm or refute it.",
  },
  "m27-q4": {
    question: "Which postmortem action is defined in a verifiable way?",
    options: ["Improve observability soon.", "Remind the team to review joins.", "Alert if p95 exceeds 24 min in two runs, with an owner, runbook and firing test.", "Be more careful in production."],
    explanation: "It includes a metric, threshold, window, owner and test condition.",
  },
  "m28-q1": {
    question: "A notebook imports another notebook to reuse a function on a modern runtime. Which refactor improves testability and compatibility?",
    options: ["Duplicate the cell in every notebook.", "Move the function into a `.py` file inside an importable package.", "Turn the function into a widget.", "Store the code in a compute tag."],
    explanation: "Python modules are the right unit for shared code; notebooks should orchestrate and present.",
  },
  "m28-q2": {
    question: "Which test gives the best evidence about a Spark transformation?",
    options: ["Checking only that it returns a DataFrame object.", "Manually reviewing `show()` in production.", "Comparing only the number of columns.", "Materializing synthetic data and validating schema, rows and edge cases."],
    explanation: "Lazy evaluation and business contracts require executing and comparing a concrete result.",
  },
  "m28-q3": {
    question: "What is the most reproducible strategy to promote a library?",
    options: ["Build a wheel once and promote the same hash across environments.", "Run `%pip install` without a version in every notebook.", "Rebuild from `main` during every deploy.", "Install dependencies with an init script on serverless."],
    explanation: "An immutable artifact avoids code and resolution divergence between test and production.",
  },
  "m28-q4": {
    question: "What must an integration test cover that a pure unit test does not?",
    options: ["Adding two numbers in Python.", "The format of a function name.", "Real permissions, wheel installation and idempotent Delta side effects.", "The spelling of the README."],
    explanation: "Those behaviors depend on the platform and the deployed identity.",
  },
  "m29-q1": {
    question: "An already deployed bundle keeps Terraform state and the team upgrades to CLI 1.3+. Which sequence protects the identity of its resources when adopting the GA direct engine?",
    options: ["Delete `terraform.tfstate` and deploy as a new bundle", "Change `root_path` and trust that the names match", "Complete a deploy with the current engine, run `bundle deployment migrate` per target and check that the plan proposes no unexpected actions", "Rebuild the wheel with a different hash in each target"],
    explanation: "The official migration converts the deployment state while keeping IDs. A plan with actions requires reconciling drift before continuing.",
  },
  "m29-q2": {
    question: "Three targets duplicate the whole job definition and only the catalog changes. Which design reduces drift?",
    options: ["Three independent repositories.", "A base definition and a `catalog` variable overridden per target.", "Manually editing the job after every deploy.", "Hardcoding table IDs in the wheel."],
    explanation: "Targets should express only real differences; duplicating resources lets the DAG diverge.",
  },
  "m29-q3": {
    question: "Which identity should run a production job even when an engineer launches the deployment?",
    options: ["The last user who edited the YAML.", "A shared account administrator.", "A stable service principal defined through `run_as`.", "Any user with CAN VIEW."],
    explanation: "Separating deployment from execution stabilizes permissions, ownership and operational continuity.",
  },
  "m29-q4": {
    question: "What does deploying the previous bundle version after a faulty `MERGE` guarantee?",
    options: ["It automatically restores the table with time travel.", "It deletes every failed run.", "It revokes the CI credentials.", "It restores the declared configuration/code, but does not on its own revert data already written."],
    explanation: "Deployment rollback and data rollback or repair are different problems.",
  },
  "m30-q1": {
    question: "A group has `SELECT` on a table but gets an access error when resolving the name. What should be checked first?",
    options: ["`USE CATALOG` and `USE SCHEMA`.", "Photon on the warehouse.", "Deletion vectors.", "The number of workers."],
    explanation: "Navigating the catalog and schema is the usual prerequisite even when SELECT exists on the object.",
  },
  "m30-q2": {
    question: "Hundreds of new tables tagged `restricted` must receive the same mask. Which option scales best?",
    options: ["A manual grant for each owner.", "A different view created by each analyst.", "An ABAC policy based on governed tags at the catalog or schema level.", "Copying the UDF into every notebook."],
    explanation: "ABAC separates classification from policy and automatically covers objects that match the attribute.",
  },
  "m30-q3": {
    question: "An external process loads Salesforce before Unity Catalog, and Power BI consumes the result outside Databricks. How is the end-to-end graph completed?",
    options: ["With fake jobs inside the workspace", "With external metadata objects and external lineage relationships to the Unity Catalog objects", "With ALL PRIVILEGES grants to both systems", "With a free-form tag containing the credentials"],
    explanation: "External lineage represents the first mile and last mile that Databricks' automatic lineage does not observe, linking them to governed objects.",
  },
  "m30-q4": {
    question: "Which interpretation of the tag `system.certification_status = certified` is defensible?",
    options: ["Databricks officially guarantees there will never be errors", "The asset met documented internal standards and must keep an owner, evidence and review", "Every user automatically receives SELECT", "The data becomes a requirement of the certification exam"],
    explanation: "Certification status communicates trust according to the organization's process; it does not replace controls, permissions or tests and is not an official vendor guarantee.",
  },
  "m31-q1": {
    question: "Two organizations use Unity Catalog workspaces. Which model avoids exchanging a credential file?",
    options: ["Databricks-to-Databricks OpenSharing.", "A CSV export to public object storage.", "A bearer token shared over chat.", "Query federation from the recipient to the internal metastore."],
    explanation: "The native integration between metastores uses platform identity and does not require the credential file of the open model.",
  },
  "m31-q2": {
    question: "A PostgreSQL database is queried in an exploratory, read-only way with selective filters. Which option reduces initial ingestion time?",
    options: ["A full daily backfill.", "Outbound OpenSharing.", "Lakehouse query federation through a foreign catalog.", "Manually copying dumps to the DBFS root."],
    explanation: "Federation provides governed in-place access and pushdown without migrating the data first.",
  },
  "m31-q3": {
    question: "When should federation be replaced by incremental ingestion?",
    options: ["When the query runs monthly and filters a single row.", "When frequent, intensive loads affect the source and need their own SLA.", "When the catalog is named `foreign`.", "Whenever the recipient uses SQL."],
    explanation: "Materialization decouples performance and availability from a remote source under repeated load.",
  },
  "m31-q4": {
    question: "A trusted Trino engine must write to a governed Managed Iceberg table without receiving permanent cloud keys. Which pattern should be evaluated?",
    options: ["OpenSharing, which grants the partner write access", "A direct path to the bucket with a permanent access key", "Unity Catalog's Iceberg REST Catalog with credential vending and a least-privilege principal", "Compatibility Mode as GA writes on any table"],
    explanation: "Iceberg REST and credential vending let compatible clients inherit permissions and use temporary credentials; Managed Iceberg supports read/write. Compatibility Mode is Public Preview and read-only.",
  },
  "m32-q1": {
    question: "A requirement says 'near real-time data' with no further detail. What should the architect do first?",
    options: ["Choose continuous streaming.", "Increase the number of workers.", "Define the freshness SLO, volume, late-data tolerance and the response to a breach.", "Create a table partitioned by second."],
    explanation: "Technology is chosen after turning the ambiguity into measurable constraints.",
  },
  "m32-q2": {
    question: "A CDC feed receives two out-of-order updates for the same key. Which design prevents the old one from overwriting the new one?",
    options: ["Apply a key and a sequence, accepting only the most recent event.", "Run an append and deduplicate in the dashboard.", "Delete the checkpoint every night.", "Order only by file arrival time."],
    explanation: "Deterministic CDC needs a source/business sequence in addition to the key.",
  },
  "m32-q3": {
    question: "The job finished successfully, but the gold table has 80 minutes of freshness against a 15-minute SLO. What is the state of the product?",
    options: ["Healthy because the job is green.", "Breaching the SLO; the chain and consumers must be investigated.", "Correct if Photon was active.", "It cannot be determined without clearing the cache."],
    explanation: "Execution state does not replace the outcome metric for the consumer.",
  },
  "m32-q4": {
    question: "CI deploys and the job runs with the same administrator principal. Which improvement reduces the blast radius?",
    options: ["Add the token to a notebook for recovery.", "Give the job ownership of every catalog.", "Share the principal with analysts for support.", "Separate the deployment identity from `run_as`, each with least privilege."],
    explanation: "The two functions need different permissions; separating them improves least privilege and auditing.",
  },
  "associate-bank-001": {
    question: "A company wants PySpark ETL and SQL dashboards to query the same governed copy of sales data, while each workload scales independently. Which architecture best satisfies the requirement?",
    options: ["Export a different CSV for each consumer", "Store a Delta table in object storage, govern it with Unity Catalog and use separate compute", "Keep one permanent all-purpose cluster for every workload", "Replicate the table into the local storage of each workspace"],
    explanation: "Separating storage and compute makes it possible to share a governed Delta table and size each execution surface for its workload.",
  },
  "associate-bank-002": {
    question: "A pipeline needs a corporate init script and network connectivity that are not available on serverless. Which compute should the engineer evaluate first?",
    options: ["A serverless SQL warehouse", "A Delta Sharing endpoint", "Classic compute configured through a policy", "A Git folder"],
    explanation: "Classic compute offers runtime, initialization and network controls that may not be available on serverless; a policy keeps the guardrails.",
  },
  "associate-bank-003": {
    question: "Hundreds of analysts run short SQL queries from a BI tool and demand changes throughout the day. Which resource is most appropriate?",
    options: ["A SQL warehouse with auto-stop and scaling", "A personal cluster per analyst", "A pool without associated clusters", "A Lakeflow Jobs for-each task"],
    explanation: "SQL warehouses are designed for concurrent SQL and BI workloads, with dedicated scaling and automatic stop mechanisms.",
  },
  "associate-bank-004": {
    question: "A reader queries a table while another process commits a Delta batch. Which mechanism prevents the reader from observing a partial write?",
    options: ["Git history", "Compute auto-stop", "A temporary view", "The snapshot defined by an atomic commit to the transaction log"],
    explanation: "Delta publishes changes through atomic commits; each reader resolves a consistent snapshot of the transaction log.",
  },
  "associate-bank-005": {
    question: "A team compares two configurations for the same job. One costs less per hour, but takes twice as long and fails more often. Which metric enables a correct decision?",
    options: ["Number of notebooks in the workspace", "Cost per successful run that meets the SLA", "Maximum number of configured workers", "Price of a single DBU without considering runtime"],
    explanation: "Cost must be normalized by outcome and SLA; the hourly price alone does not capture duration, retries or cloud infrastructure.",
  },
  "associate-bank-006": {
    question: "An architecture review places the execution of Spark transformations inside the control plane. Which correction should be made?",
    options: ["Move execution to the compute plane and leave configuration/orchestration in the control plane", "Move the Delta tables to the browser", "Replace Unity Catalog with a pool", "Run Spark inside the Git repository"],
    explanation: "The compute plane processes the data; the control plane provides the platform UI, APIs, configuration and coordination.",
  },
  "associate-bank-007": {
    question: "New JSON files arrive in a Volume every hour. The team wants a SQL statement that remembers which files it has already loaded. Which option fits best?",
    options: ["INSERT OVERWRITE without a filter", "collect and a local write", "COPY INTO a governed table", "VACUUM on the directory"],
    explanation: "COPY INTO keeps a history of processed files and offers a simple incremental SQL load; it does not deduplicate business entities.",
  },
  "associate-bank-008": {
    question: "An Auto Loader stream receives an unexpected JSON field. The requirement is to keep the payload for review without adding it to the Silver schema yet. Which setting helps?",
    options: ["rescuedDataColumn", "spark.sql.shuffle.partitions", "autoBroadcastJoinThreshold", "RESTORE TABLE"],
    explanation: "The rescued data column keeps fields that do not fit the schema so they can be measured and handled later.",
  },
  "associate-bank-009": {
    question: "A bucket contains tens of millions of files and full listing has become a bottleneck. Which Auto Loader discovery mode should be evaluated?",
    options: ["A cross join with the target table", "File notification, with the required cloud configuration", "A collect of the file names", "A cluster with a single worker"],
    explanation: "Notifications avoid relying on repeated full listings and scale discovery, although they require permissions and infrastructure from the provider.",
  },
  "associate-bank-010": {
    question: "A managed Lakeflow Connect connector exists for the source SaaS application and the team wants to minimize infrastructure and maintenance. Which decision is most solid?",
    options: ["Build a custom scraper first", "Manually export CSV every week", "Use JDBC even though the source does not expose it", "Evaluate the managed connector and confirm its freshness and CDC capabilities"],
    explanation: "A managed connector reduces operations, but supported objects, regional availability, latency and incremental semantics must be checked.",
  },
  "associate-bank-011": {
    question: "A sequential JDBC read takes hours and the source table has a uniformly distributed numeric key. The database allows eight connections. Which change is appropriate?",
    options: ["Configure partitionColumn, bounds and numPartitions=8", "Only increase spark.sql.shuffle.partitions", "Convert the result to pandas before reading", "Open one connection per row"],
    explanation: "A partitioned JDBC read parallelizes ranges and numPartitions limits connections; the bounds split the read, they do not filter records.",
  },
  "associate-bank-012": {
    question: "A REST API returns pages and applies rate limits. Which design makes it easier to resume after an error without duplicating data?",
    options: ["Always restart from the first page and append", "Store the token in the code", "Persist a cursor/checkpoint, use backoff and insert with an idempotent key", "Disable HTTP error codes"],
    explanation: "A durable cursor and an idempotent write make resuming possible; backoff respects limits without hiding permanent failures.",
  },
  "associate-bank-013": {
    question: "Images and documents must be governed before tabular information is extracted from them. Which Unity Catalog object is suitable for the files?",
    options: ["A task value", "A SQL warehouse", "A temporary view", "A Volume"],
    explanation: "Unity Catalog Volumes govern access to non-tabular files and provide paths compatible with data workloads.",
  },
  "associate-bank-014": {
    question: "An Auto Loader query uses an existing checkpoint. The engineer changes the starting options expecting to reread every historical file. What must be taken into account?",
    options: ["The checkpoint keeps the progress and the new options do not necessarily rewind the query", "The SQL warehouse will delete the checkpoint", "Unity Catalog will recreate the files", "VACUUM automatically forces a reload"],
    explanation: "The checkpoint is part of the query contract and keeps the processed files/offsets; a backfill must be designed explicitly.",
  },
  "associate-bank-015": {
    question: "Every order must survive even if some customer_id values do not exist in the dimension. Which join preserves the required semantics?",
    options: ["Inner join", "Left join with orders on the left", "Left semi join", "Cross join"],
    explanation: "A left join keeps every row of the left dataset and produces null values for dimensions that are not found.",
  },
  "associate-bank-016": {
    question: "Two DataFrames contain the same columns in a different order. How do you combine them without swapping values by position?",
    options: ["union", "crossJoin", "unionByName", "intersect"],
    explanation: "unionByName aligns columns by name; the traditional union combines them by position and does not remove duplicates.",
  },
  "associate-bank-017": {
    question: "Each order contains an items array and one row per element is needed while keeping order_id. Which pattern is appropriate?",
    options: ["Select order_id and explode_outer(items), then project the struct fields", "Apply count to the array", "Convert the whole table to pandas", "Use dropDuplicates over every column"],
    explanation: "explode_outer increases cardinality per element and keeps the parent when the array is null or empty; order_id preserves the context.",
  },
  "associate-bank-018": {
    question: "Several versions of an order arrive and the most recent one must be kept, breaking ties with ingest_id. Which solution is deterministic?",
    options: ["distinct without ordering", "groupBy over every column", "dropDuplicates(['order_id'])", "row_number over a window ordered by event_ts and ingest_id descending"],
    explanation: "The window explicitly expresses priority and the tiebreaker; operations without ordering do not guarantee which version survives.",
  },
  "associate-bank-019": {
    question: "A pipeline uses a Python UDF to convert text to lowercase, even though Spark provides lower. Which change is preferable?",
    options: ["Use collect and a local str.lower", "Replace the UDF with the native lower function", "Enlarge the driver", "Create another UDF to validate the first one"],
    explanation: "Native functions are visible to Catalyst and avoid the JVM-Python serialization that many UDFs incur.",
  },
  "associate-bank-020": {
    question: "An amount column contains some non-numeric values. The batch must continue, but the invalid values must be measured. Which strategy is appropriate?",
    options: ["Fill all of them with zero", "Drop the column", "Use try_cast and quantify or quarantine the resulting nulls", "Apply VACUUM"],
    explanation: "try_cast converts valid inputs and returns null for incompatible ones; the metric or quarantine avoids hiding the loss.",
  },
  "associate-bank-021": {
    question: "After a groupBy, Spark creates thousands of tiny tasks with large overhead. Which setting should be reviewed and measured?",
    options: ["spark.sql.shuffle.partitions", "The metastore password", "The catalog name", "The Git TTL"],
    explanation: "spark.sql.shuffle.partitions affects the number of partitions after SQL shuffles; it must be tuned using observed sizes and durations.",
  },
  "associate-bank-022": {
    question: "A Gold aggregation is expensive, is queried hundreds of times a day and can be refreshed in a managed way. Which object should be evaluated?",
    options: ["A notebook variable", "A temporary view", "A materialized view", "A secret scope"],
    explanation: "A materialized view keeps the result and manages its refresh, avoiding recomputing the whole aggregation on every read.",
  },
  "associate-bank-023": {
    question: "A record violates a repairable rule, but the rest of the batch is valid and must be published. Which treatment preserves traceability?",
    options: ["Ignore the rule", "Send the record to quarantine with a reason and a reference to the batch", "Delete Bronze", "Grant ALL PRIVILEGES"],
    explanation: "Quarantine separates repairable records and keeps evidence without stopping valid data or losing the original.",
  },
  "associate-bank-024": {
    question: "A workflow has independent ingest_eu and ingest_us tasks and a conform task that needs both. Which DAG maximizes correct parallelism?",
    options: ["conform first", "All of them without dependencies", "Both ingestions in parallel and conform depending on both", "A chain ingest_eu → ingest_us → conform"],
    explanation: "The ingestions can run simultaneously; conform must wait for both dependencies.",
  },
  "associate-bank-025": {
    question: "A validate task produces the scalar invalid_ratio that a downstream condition must compare. How should it be shared?",
    options: ["Publish it with taskValues and reference it from the conditional task", "Serialize the whole DataFrame into a widget", "Store the value in the cluster name", "Use Delta Sharing"],
    explanation: "Task values are designed for small values between tasks; full datasets must be persisted in tables or files.",
  },
  "associate-bank-026": {
    question: "A task that appends without a key may run again after a timeout. What must be fixed before enabling automatic retries?",
    options: ["Increase the number of dashboards", "Make the write idempotent through a key, a replaceable partition or MERGE", "Remove the timeout", "Rename the task"],
    explanation: "A retry can repeat effects; the task must produce the same logical state for the same input.",
  },
  "associate-bank-027": {
    question: "A job must publish if valid_ratio ≥ 0.99 and run quarantine otherwise. Which component best models the decision?",
    options: ["A for-each task over every row", "An additional SQL warehouse", "An If/else task based on the value from validate", "A pool"],
    explanation: "If/else expresses a control branch based on a parameter or task value; for-each handles iterations over collections.",
  },
  "associate-bank-028": {
    question: "Files arrive at unpredictable times and you want to avoid empty runs every five minutes. Which trigger should you choose?",
    options: ["A more frequent cron schedule", "A file arrival trigger on the governed location", "A 24-hour auto-stop", "A periodic repair run"],
    explanation: "The arrival-driven trigger starts the Job when new input exists and reduces polling and runs without work.",
  },
  "associate-bank-029": {
    question: "In a ten-task DAG only publish fails. The nine earlier tasks finished successfully and are expensive. How do you recover with the least reprocessing?",
    options: ["Delete the Job", "Create another workspace", "Restart every task from scratch", "Use a repair run from the failed task"],
    explanation: "Repair run keeps successful results and reruns failed or selected tasks together with the dependents they require.",
  },
  "associate-bank-030": {
    question: "A developer wants to debug in VS Code while the Spark operations run on Databricks. Which tool covers this workflow?",
    options: ["Databricks Connect", "Delta Sharing", "COPY INTO", "Predictive optimization"],
    explanation: "Databricks Connect lets you develop from a local IDE and send plans to compatible remote compute.",
  },
  "associate-bank-031": {
    question: "A notebook change must be reviewed before it reaches main. Which sequence reflects a correct Git workflow?",
    options: ["Edit main and duplicate the notebook", "Create a branch, commit, push and open a pull request", "Export the table to Git", "Store a token in the notebook"],
    explanation: "Branches isolate the change and the pull request provides review; Git folders sync the code with the provider.",
  },
  "associate-bank-032": {
    question: "Before deploying a Declarative Automation Bundle to test, the team wants to resolve variables and check its schema. Which command should they use?",
    options: ["databricks fs rm", "databricks bundle run", "databricks bundle validate -t test", "RESTORE TABLE"],
    explanation: "bundle validate checks and resolves the target configuration; deploy applies the resources and run executes them.",
  },
  "associate-bank-033": {
    question: "Dev, test and prod must use the same code but different catalogs. How should this be modeled in a Bundle?",
    options: ["Three copies of the repository", "A different notebook per workspace", "Production IDs hardcoded in Python", "A catalog variable overridden by each target"],
    explanation: "Targets and variables separate configuration from the artifact, so the same validated code can be promoted.",
  },
  "associate-bank-034": {
    question: "A production Job deployed by CI must not depend on the developer's personal account. Which configuration is preferable?",
    options: ["run_as with a least-privilege service principal", "A personal PAT inside databricks.yml", "ALL PRIVILEGES for everyone", "Always running from the interactive notebook"],
    explanation: "A stable service identity separates deployment from execution and avoids failures when the team changes.",
  },
  "associate-bank-035": {
    question: "In the Spark UI, 199 tasks take 20 seconds and one takes 14 minutes while processing far more bytes. What is the strongest initial hypothesis?",
    options: ["Missing USE SCHEMA", "Data skew in the slow partition", "Auto-stop set too low", "A Git error"],
    explanation: "A long tail with an extreme distribution inside the same stage points to a skewed key or partition.",
  },
  "associate-bank-036": {
    question: "Many tasks show spill to disk during a sort and all of them process large partitions. Which investigation is most relevant?",
    options: ["Review partition size, execution memory and shuffle volume", "Grant SELECT to the driver", "Change the catalog", "Delete the transaction log"],
    explanation: "Spill indicates that execution structures do not fit in memory; it must be correlated with partitions, operators and configuration.",
  },
  "associate-bank-037": {
    question: "A cluster never reaches the RUNNING state, so no Spark job exists. Where should diagnosis begin?",
    options: ["In Query Profile", "In DESCRIBE HISTORY", "In compute events, policy, quota and network configuration", "In a window function"],
    explanation: "If Spark never started, the provisioning and configuration events provide the relevant evidence.",
  },
  "associate-bank-038": {
    question: "A notebook fails with ModuleNotFoundError only in production. What should be compared first?",
    options: ["The dashboard color", "Versions and origin of the dependencies installed in both environments", "The number of catalogs", "The VACUUM retention"],
    explanation: "The error points to a missing or incompatible dependency; comparing artifact, environment and logs is more direct than adding compute.",
  },
  "associate-bank-039": {
    question: "The team wants to know whether a Job's duration has gradually worsened over a month. Which source is most suitable?",
    options: ["A screenshot of the last run", "The checkpoint contents", "The repository README", "Run history or system.lakeflow.job_run_timeline"],
    explanation: "Run history makes it possible to compare durations and states against a baseline over time.",
  },
  "associate-bank-040": {
    question: "A large managed table has changing filter patterns and needs a flexible layout and automated maintenance. Which capabilities should be evaluated?",
    options: ["Liquid clustering and predictive optimization", "More widgets", "A cross join", "One PAT per reader"],
    explanation: "Liquid clustering adapts layout keys and predictive optimization can maintain eligible managed tables according to observed benefit.",
  },
  "associate-bank-041": {
    question: "The analysts group has SELECT on main.gold.sales but gets an error when resolving the object. Which privileges must be checked on the ancestors?",
    options: ["MODIFY and OWN", "CREATE TABLE and MANAGE", "USE CATALOG on main and USE SCHEMA on main.gold", "EXECUTE on the SQL warehouse"],
    explanation: "SELECT authorizes reading, but the principal also needs to traverse the catalog and schema through USE.",
  },
  "associate-bank-042": {
    question: "The organization wants every column tagged as PII to receive a central mask, even in new tables. Which mechanism scales best?",
    options: ["An ABAC policy based on governed tags", "An individual grant per column", "One cluster per user", "Copying the table without PII every night"],
    explanation: "ABAC applies mask or filter policies to objects that match governed attributes, reducing per-table configuration.",
  },
  "associate-bank-043": {
    question: "An external Delta table must become managed without losing its name, history, permissions or views. Which operation provides that continuity?",
    options: ["DROP and CREATE on another path", "CREATE TABLE AS SELECT", "ALTER TABLE … SET MANAGED", "VACUUM followed by CLONE"],
    explanation: "SET MANAGED converts an eligible external Delta table while keeping its identity and history; runtime, readers, features and streams must be validated first.",
  },
  "associate-bank-044": {
    question: "Security is investigating who changed permissions; engineering wants to know which table feeds a dashboard. Which signals correspond, respectively?",
    options: ["Spark UI and checkpoint", "Audit logs and lineage", "Liquid clustering and Photon", "COPY INTO and VACUUM"],
    explanation: "Auditing records the actions of principals; lineage represents relationships between objects and transformations.",
  },
  "associate-bank-045": {
    question: "A pipeline needs to read an external S3/ADLS/GCS path without handing cloud credentials to every user. Which Unity Catalog pattern applies?",
    options: ["A storage credential and an external location with minimum permissions", "Keys pasted into widgets", "A token inside the table", "ALL PRIVILEGES on the workspace"],
    explanation: "The storage credential encapsulates the cloud identity and the external location associates that identity with a governed path.",
  },
  "associate-bank-046": {
    question: "A source table is updated at unpredictable times and the consuming job must start when new data exists, without keeping compute running. Which trigger fits best?",
    options: ["A schedule every minute", "A Lakeflow Jobs table update trigger", "A permanent all-purpose cluster", "A while loop inside a notebook"],
    explanation: "The table update trigger starts the job when changes are detected in the monitored tables and avoids polling on a schedule or keeping compute active without work.",
  },
  "associate-bank-047": {
    question: "The same project must be promoted from dev to prod changing catalog, identity and compute size, but not the tested code. Which design is most appropriate?",
    options: ["Edit the notebook after every deployment", "Keep a branch with different code per environment", "Use targets, variables and overrides of a Declarative Automation Bundle", "Store the prod values in comments"],
    explanation: "Targets and overrides make it possible to reuse the same versioned artifact and apply environment-specific configuration without introducing manual drift in the code.",
  },
  "associate-bank-048": {
    question: "An ABAC policy masks PII columns, but a new analyst cannot query the table. What must be checked in addition to the policy?",
    options: ["That a base SELECT grant and the required USE privileges exist", "That the analyst owns the metastore", "That the table has ZORDER", "That the SQL warehouse has no auto-stop"],
    explanation: "Mask and filter policies restrict data on top of permissions already granted; they do not replace SELECT or the traversal privileges on catalog and schema.",
  },
  "associate-bank-049": {
    question: "A compatible managed connector exists for a high-volume enterprise source and recurring low latency is required. Which option should be evaluated before ad hoc federation?",
    options: ["Manually copying CSV files", "Managed Lakeflow Connect with a governed destination", "Always querying the remote database from every dashboard", "Exporting the source to a local notebook"],
    explanation: "Managed ingestion is aimed at recurring loads and high volumes; federation is better suited to ad hoc exploration or tests without moving the data.",
  },
  "associate-bank-050": {
    question: "A Spark stage shows a few very long tasks, heavy shuffle read and spill, while most tasks finish quickly. What is the first hypothesis to validate?",
    options: ["Skew in the partitioning keys", "A missing Git folder", "Excessive USE SCHEMA permissions", "A VACUUM retention that is too long"],
    explanation: "The combination of stragglers, disproportionate shuffle and spill usually indicates skewed partitions; the distribution must be measured before changing compute or parameters.",
  },
  "pro-001": {
    question: "A team maintains an 1,800-line notebook that reads tables, transforms orders and publishes results. Tests can only run by executing the whole notebook, and each environment requires editing catalog names by hand. Which refactoring provides the most maintainable foundation for a Declarative Automation Bundle (Asset Bundle in the blueprint)?",
    options: ["Duplicate the notebook for dev, test and prod and protect each copy with workspace permissions.", "Extract pure transformations into a package under src, keep I/O and parameters in a thin layer, and declare resources and variables per target in the bundle.", "Convert every cell to dynamic SQL and store the catalogs in global notebook variables.", "Move the notebook to a Git folder and always use the prod catalog to avoid differences between environments."],
    explanation: "Separating pure logic, I/O and configuration enables unit tests without running the whole workflow. Bundle targets change parameters and resources while the same versioned artifact is promoted across environments.",
  },
  "pro-002": {
    question: "An internal library works in development with the latest pandas version, but fails in production two weeks later because the environment resolved a different version of a transitive dependency. Which strategy best reduces this drift without installing dependencies manually on every run?",
    options: ["Run pip install --upgrade at the start of the notebook to always get the newest versions.", "Attach the full source repository as a workspace file and rely on the preinstalled libraries.", "Build a versioned wheel, pin compatible dependencies and deploy that artifact from the bundle to every target.", "Install the library once on a shared interactive cluster and reuse that cluster indefinitely."],
    explanation: "An immutable wheel with pinned versions makes dependency resolution reproducible. The bundle can reference the same tested artifact; upgrading everything on every run or depending on a cluster's state introduces variability.",
  },
  "pro-003": {
    question: "A transformation applies a Python UDF row by row to normalize arrays of codes. Query Profile shows a lot of time spent exchanging data between the JVM and Python, and the same rule can be expressed with transform and regexp_replace. What is the most appropriate first technical change?",
    options: ["Replace the UDF with native Spark SQL array functions to keep optimization and vectorized execution where possible.", "Turn it into a globally registered scalar Python UDF so Catalyst can inspect its body.", "Increase spark.sql.shuffle.partitions even though the operation does not produce a shuffle.", "Persist each array as JSON and process it in a second single-node Python task."],
    explanation: "Native functions are visible to Catalyst and avoid the serialization boundary of a Python UDF. Registering the same UDF does not make its logic transparent, and adding partitions does not fix that bottleneck.",
  },
  "pro-004": {
    question: "A transform function adds computed columns to a DataFrame. An accidental change keeps the expected values but converts amount from decimal to double and changes the order of two columns required by the contract. Which set of tests explicitly detects both kinds of regression?",
    options: ["Compare only actual.count() with expected.count().", "Collect the first row and check that amount is greater than zero.", "Run explain and check that no Exchange appears.", "Use assertDataFrameEqual for the data and assertSchemaEqual for the schema contract."],
    explanation: "Row equality does not replace a schema check. PySpark's testing utilities let you express separate expectations about the data and about types, names, nullability and structure.",
  },
  "pro-005": {
    question: "A job receives a list of regions validated by an initial task. It must run the same notebook for each region, with limited concurrency, and then continue with a single consolidation task. Which design best expresses that intent in Lakeflow Jobs?",
    options: ["Create one hundred fixed tasks, one per possible region, and skip from the notebook those not in the list.", "Publish the list as a task value, consume it in a For each task and make the consolidation depend on that task.", "Launch Python threads from the driver and manually write each region's state to DBFS.", "Create a separate job per region and schedule them all at the same time without dependencies."],
    explanation: "For each models the dynamic fan-out, lets you control concurrency and keeps each iteration inside the observable graph. A task value is the right channel to pass the small list produced upstream.",
  },
  "pro-006": {
    question: "The same bundle must create resources with a personal prefix in development, use an integration catalog in test and deploy stable names under a service identity in production. How should that variation be represented without maintaining three copies of the bundle?",
    options: ["Define targets with variables and substitutions, apply development mode where appropriate and configure the production run_as explicitly.", "Read the user name inside every notebook and build all resource names at runtime.", "Modify databricks.yml on the main branch before each deployment and revert it afterwards.", "Use a single target that deploys to all three workspaces at once."],
    explanation: "Targets encapsulate the declarative differences between environments and variables avoid duplicating resources. The prod execution identity must be controlled by configuration, not inferred inside the code.",
  },
  "pro-007": {
    question: "A streaming transformation needs to call an external service with its own protocol, manage one transaction per micro-batch and write to a sink not supported by Spark Declarative Pipelines in Lakeflow. Which approach keeps the required control with the least contrivance?",
    options: ["Declare a materialized view, because every materialized view supports external sinks.", "Use COPY INTO with a ten-second trigger over the remote service.", "Implement Structured Streaming with foreachBatch, a stable checkpoint and explicit idempotency in the sink.", "Use a declarative streaming table and make the remote call inside an expectation."],
    explanation: "foreachBatch provides per-micro-batch control for integrations not covered by managed sinks. That control requires designing the external operation for retries; an expectation is not a side-effect mechanism.",
  },
  "pro-008": {
    question: "A notebook task calls an API that charges twice if the request is repeated. There is no idempotency key or reliable prior check yet, and the team would rather fail and review than duplicate charges. Which immediate configuration reflects that policy while the design is fixed?",
    options: ["Increase the number of workers so the call finishes before the timeout.", "Configure unlimited retries with an increasing interval.", "Enable automatic repair of every task that already succeeded.", "Set max_retries to 0 for that task and alert on the failure for intervention."],
    explanation: "Without idempotency, an automatic retry can repeat the external effect. Disabling retries is a temporary guardrail; the structural fix is still to introduce an idempotency key or a verifiable transaction.",
  },
  "pro-009": {
    question: "An ephemeral job needs an internal library and two PyPI packages. Developers want every run to start clean and the code version to be tied to the deployment that created the job. Where should that production dependency preferably be declared?",
    options: ["In a %pip cell run manually by the owner whenever the cluster changes.", "As a task library or bundle resource, pointing to the versioned wheel and compatible PyPI versions.", "In each developer's local Databricks CLI profile.", "In a global variable on an interactive cluster that the job reuses."],
    explanation: "Declaring libraries next to the deployed resource makes infrastructure and code evolve traceably. Manual installs or the state of a shared cluster are not reproducible.",
  },
  "pro-010": {
    question: "A PySpark function fails only with a nested struct that contains empty and null arrays. The notebook mixes reading, logic and writing, so the debugger forces reprocessing millions of rows to reproduce the error. Which change shortens the diagnostic loop the most?",
    options: ["Add display after every transformation and always run against production.", "Cache every input table before opening the debugger.", "Isolate the transformation in a function, build a minimal DataFrame with the edge case and debug/test it locally in the session.", "Convert the struct to a string so any schema is accepted."],
    explanation: "A minimal case and a side-effect-free transformation make the failure reproducible and allow testing and debugging without a full run. Converting to a string hides the contract instead of fixing it.",
  },
  "pro-011": {
    question: "A bucket receives 40 million JSON files per month. Ingestion must discover only new objects, keep the inferred schema between runs and resume without reprocessing history. Which configuration covers those three needs?",
    options: ["Auto Loader with a durable schemaLocation and a checkpointLocation exclusive to the query.", "spark.read.json over the whole prefix followed by an in-memory dropDuplicates.", "COPY INTO without a target table and with force=true on every run.", "A binaryFile read that uses the object size as a unique identifier."],
    explanation: "Auto Loader keeps scalable discovery state; schemaLocation persists the inferred evolution and the checkpoint keeps the query's progress and commits. Both must live in durable storage and not be shared between different queries.",
  },
  "pro-012": {
    question: "A pipeline must ingest medical images without interpreting them yet, keeping bytes, path, length and modification date for a later extraction stage. Which Spark source best fits the first step?",
    options: ["csv with inferSchema=true and a BINARY column.", "text, because it automatically keeps the original bytes of any file.", "binaryFile, which exposes the object's content and metadata as columns.", "parquet, after renaming each image's extension."],
    explanation: "The binaryFile source reads each file as a record with content and metadata such as path, length and modificationTime. text decodes text and does not generally preserve the original binary content.",
  },
  "pro-013": {
    question: "A query reads Kafka and writes normalized events to Delta. After a crash, some messages may be presented again from the checkpoint, and the business cannot tolerate two orders with the same event_id. Which design addresses the end-to-end guarantee?",
    options: ["Rely only on Kafka's enable.auto.commit and delete the checkpoint.", "Use processingTime=1 second, because more frequent micro-batches remove duplicates.", "Add more partitions to the topic without changing the sink logic.", "Keep a stable checkpoint and make the Delta write idempotent with event_id and bounded deduplication or a deterministic MERGE."],
    explanation: "Recoverable offsets avoid losing progress, but the business guarantee also depends on the sink. A stable key and an idempotent write absorb possible repetition without confusing trigger frequency with delivery semantics.",
  },
  "pro-014": {
    question: "An 800 GB PostgreSQL table is read through JDBC with a single partition and saturates one core. There is an increasing numeric id column and the database accepts eight concurrent connections without affecting the transactional system. Which setting parallelizes the read in a controlled way?",
    options: ["Increase spark.sql.shuffle.partitions to 8 after the read finishes.", "Configure partitionColumn=id, lowerBound, upperBound and numPartitions=8, first validating the distribution and the source's capacity.", "Run eight full reads and apply union followed by distinct.", "Sort the remote table by id and use coalesce(8) in Spark."],
    explanation: "The JDBC options split the range across several connections; the bounds compute the strides, they are not row filters. They must be chosen considering skew and the maximum number of connections the source database can accept.",
  },
  "pro-015": {
    question: "Closed files arrive in the landing zone every night. All pending arrivals must be processed, compute must stop when finished, and an append-only bronze table must continue tomorrow from the previous state. Which pattern provides incremental behavior with bounded cost?",
    options: ["Auto Loader in Structured Streaming with an availableNow trigger, a durable checkpoint and append to Delta bronze.", "A continuous stream without auto-stop even though the landing zone stays empty most of the day.", "Overwrite the whole bronze table every night and rebuild history from scratch.", "Read every file in batch and rely only on dropDuplicates without persisting progress."],
    explanation: "availableNow processes the available backlog incrementally and stops. The checkpoint keeps which files and offsets were committed, while Delta keeps the append-only bronze table for replay and auditing.",
  },
  "pro-016": {
    question: "An events table contains several revisions per business_key. Two revisions can share updated_at, but source_sequence is unique and increasing within each key. How do you deterministically select the current revision?",
    options: ["Apply distinct over every column and keep the first row Spark returns.", "Group by business_key and take max(updated_at), without retrieving the other columns.", "Use row_number over a window partitioned by business_key and ordered by updated_at DESC and source_sequence DESC, then filter row_number=1.", "Sort globally by updated_at and run dropDuplicates without specifying a partition."],
    explanation: "row_number lets you define the partition and a total tiebreaker. max(timestamp) alone loses the associated columns, and a dropDuplicates without deterministic ordering can choose different revisions between runs.",
  },
  "pro-017": {
    question: "A 9 TB DataFrame of transactions must keep only rows whose customer_id exists in a governed list of active customers. No column from the list is needed. Which operation best expresses the intent and avoids widening the result unnecessarily?",
    options: ["A cross join followed by an equality filter.", "A left_semi join on customer_id.", "A full_outer join and a null filter.", "A unionByName followed by dropDuplicates."],
    explanation: "The left semi join implements an existence test and returns only columns from the left side. It avoids materializing lookup columns and tells the optimizer exactly which semantics are required.",
  },
  "pro-018": {
    question: "A dataset contains an items column with arrays of structs. One row per item is required, but orders whose array is empty or null must still appear for a later reconciliation. Which transformation satisfies the cardinality and keeps those orders?",
    options: ["explode(items), because it automatically generates a null row for empty arrays.", "flatten(items), because it turns each struct into a new row.", "collect_list(items) followed by distinct.", "explode_outer(items), keeping the order columns and allowing a null item."],
    explanation: "explode_outer keeps a row when the collection is null or empty, unlike explode. This makes it possible to reconcile the order even if it has no valid lines yet.",
  },
  "pro-019": {
    question: "A quality rule compares country_code with a master value. On both sides, null means 'not provided' and must count as a match for this validation only; the = operator returns unknown. Which comparison avoids manual null-handling logic?",
    options: ["Use null-safe equality, <=> in SQL or eqNullSafe in PySpark.", "Permanently fill every null with an empty string in the source tables.", "Filter out nulls before comparing and assume they were valid.", "Convert the columns to boolean and apply AND."],
    explanation: "Null-safe equality returns true for null versus null and false when only one side is null. It avoids introducing a sentinel that could collide with real data or permanently alter the model.",
  },
  "pro-020": {
    question: "In a declarative pipeline, 0.3% of orders arrive with a negative amount. The team must publish valid records immediately, keep invalid ones with a rejection reason and measure the rate per update. Which pattern provides better traceability than silently dropping them?",
    options: ["Apply EXPECT OR DROP and keep no copy of the dropped rows.", "Apply EXPECT OR FAIL to stop every order until the source fixes each row.", "Evaluate a shared rule, route valid rows to the main dataset and invalid ones to a quarantine table, and query metrics/event log.", "Change amount to string so any value passes validation."],
    explanation: "Quarantine preserves evidence and enables remediation without blocking good data. The same condition must govern both paths, and the pipeline metrics make it possible to monitor the failure percentage.",
  },
  "pro-021": {
    question: "A MERGE accidentally receives two source rows for the same target key and both satisfy the update condition. Each row has ingest_sequence and event_ts. Which preprocessing makes the result reproducible before the MERGE?",
    options: ["Increase the cluster size so Delta resolves the conflict faster.", "Canonicalize the source to one row per key with a total order by event_ts and ingest_sequence, and validate uniqueness.", "Run the MERGE twice; the second run will choose the right row.", "Remove the ON condition and update every target row."],
    explanation: "A MERGE needs an unambiguous source for each target match. Deduplicating with a deterministic criterion and checking uniqueness avoids order-dependent results or errors caused by multiple matches.",
  },
  "pro-022": {
    question: "A session aggregation receives events up to 20 minutes late. The team adds a 20-minute watermark, but groups only by user_id and keeps the stream running for months. Why can the state keep growing, and what is the conceptual fix?",
    options: ["Because every watermark duplicates state; remove it and use complete mode.", "Because user_id must be converted to double before grouping.", "Because checkpoints prevent releasing any key; create a new one every day.", "Because an aggregation without a time window provides no time bound to close keys; an event-time window compatible with the SLA must be added."],
    explanation: "A watermark alone does not turn a global per-key aggregation into bounded state. An event-time window lets the engine determine when a result can be considered final and clean up old state.",
  },
  "pro-023": {
    question: "Two business units of the same company use different workspaces and metastores. The producer wants to grant access to up-to-date Delta tables without copying files or issuing permanent storage credentials to the Databricks consumer. Which mechanism is the natural fit?",
    options: ["Databricks-to-Databricks OpenSharing (Delta Sharing in the blueprint), publishing a share and authorizing the corresponding recipient.", "Export CSV every night to a public bucket and email the path.", "Create a Lakehouse Federation from the producer to the consumer's metastore.", "Run a daily DEEP CLONE of every table into the consumer workspace."],
    explanation: "D2D Sharing lets the recipient access governed, current shared data without maintaining an exchange copy. Federation is for querying compatible external systems, not a replacement for the sharing protocol between providers and recipients.",
  },
  "pro-024": {
    question: "A partner uses a non-Databricks engine that supports OpenSharing (Delta Sharing in the blueprint) clients. It must read only two approved views, and the provider needs to revoke access without changing the analysts' internal permissions. Which design fits that consumer?",
    options: ["Databricks-to-Databricks sharing, even though the partner has no Databricks workspace.", "Grant the partner direct SELECT on the internal catalog and access to the cloud console.", "Mount the provider's storage in the partner's system with a shared account key.", "Databricks-to-Open OpenSharing with an external recipient, managed authentication and a share limited to the approved objects."],
    explanation: "The open protocol is designed for compatible external clients. The share defines the minimum set of data and the recipient separates the consumer's identity/revocation from the workspace's internal permissions.",
  },
  "pro-025": {
    question: "Finance needs to query a few tables of a supported operational database, with freshness of minutes and low volume. Duplicating the whole database into Delta would add a pipeline the team does not want to operate. When is Lakehouse Federation a reasonable choice?",
    options: ["When massive repeated training is required even though the source database cannot handle the load.", "When the query can benefit from pushdown, the source tolerates the demand and governed access without an initial copy is preferred.", "When any Spark transformation must be written back to the remote system with Delta guarantees.", "When you want to remove the source system's credentials and permissions entirely."],
    explanation: "Federation fits low- or moderate-frequency access where pushdown and the source's capacity are enough. For intensive ETL, isolation or repeatable performance, ingesting a governed copy is usually better.",
  },
  "pro-026": {
    question: "A team creates a foreign catalog to a corporate database. The password is written in every notebook and all users reuse a remote account with administrator privileges. Which change aligns federation with a governed perimeter?",
    options: ["Copy the password into a hidden widget in every notebook.", "Grant CAN EDIT on the notebooks only to administrators and keep the remote account.", "Create a governed connection with a dedicated least-privilege credential, control its use in Unity Catalog and expose only the necessary objects.", "Store the password in a Delta table accessible to the engineering group."],
    explanation: "The connection centralizes the credential and lets you govern who can use it. The remote identity must also have minimum permissions; hiding text in a notebook does not stop secret sprawl or excess privilege.",
  },
  "pro-027": {
    question: "A pipeline's daily cost doubled, but the number of rows grew only 8%. The team needs to attribute the increase to a job, SKU and owner before changing compute. Which investigation produces useful cost and execution evidence?",
    options: ["Review only DESCRIBE HISTORY of the output table.", "Query system.billing.usage by interval, SKU and custom tags, and correlate the resource with the Lakeflow runs and their timings.", "Count the notebooks in the team's Git folder.", "Enable caching on every table without measuring prior consumption."],
    explanation: "The billing system table lets you attribute usage with metadata and tags. Correlating that consumption over time with runs avoids confusing data growth, retries, SKU changes or idle compute.",
  },
  "pro-028": {
    question: "A query run on a SQL warehouse takes 11 minutes. The team wants to know which operator concentrates the time, how many rows pass through each node and whether the join is causing a shuffle. Which surface should it check first?",
    options: ["The query's Query Profile, inspecting operators, metrics and the execution graph.", "The Git history of the dashboard definition.", "The workspace's list of secrets.", "The event log of an unrelated declarative pipeline."],
    explanation: "Query Profile is designed to break a SQL query down by operators and metrics. The Spark UI can complement Spark workloads, but Git logs, secrets or an unrelated pipeline do not locate that query's bottleneck.",
  },
  "pro-029": {
    question: "A declarative pipeline finishes green, but the published table contains 18% fewer rows. An expectation drops invalid records and there is no quality dashboard. Which signal directly explains the loss without treating it as an infrastructure failure?",
    options: ["The number of commits to the Git folder during the day.", "Total DBU usage of every workspace in the account.", "The number of files in the checkpoint directory.", "The expectation metrics and flow events in the pipeline event log."],
    explanation: "The event log records pipeline events and metrics, including quality actions. A successful run can drop rows according to policy; that is why operational success and data quality must be observed separately.",
  },
  "pro-030": {
    question: "A gold table contains a quality_failure_rate indicator computed every fifteen minutes. Operations wants a notification when it exceeds 2%, while the workflow owner also needs to know about failures and overly long runs. Which combination correctly separates the two kinds of signal?",
    options: ["A single CPU-usage alert for both data and workflow.", "A file arrival trigger for both conditions.", "A SQL Alert on the indicator query and job notifications for run status or duration.", "A print in the notebook and a weekly manual review."],
    explanation: "The SQL Alert evaluates a condition on data; job notifications cover the run's lifecycle and performance. Separating them improves ownership, severity and response capacity.",
  },
  "pro-031": {
    question: "An operations service queries thousands of runs through the Jobs API. It reads only the first response, concludes there are no older failures and sometimes marks a run as finished while it is still in a transitional state. What must be fixed in the client?",
    options: ["Always request a limit of a single run to avoid inconsistent states.", "Implement pagination and polling with backoff until a terminal state, also inspecting task states.", "Replace run identifiers with notebook names.", "Automatically repair every run while it is RUNNING."],
    explanation: "Listing APIs can paginate and the run state evolves. A robust monitor consumes every relevant page, respects limits with backoff and distinguishes lifecycle and result states at run and task level.",
  },
  "pro-032": {
    question: "Hundreds of managed tables receive frequent MERGE and DELETE operations. The team keeps its own cron jobs for compaction, statistics and VACUUM, but they overlap, fail and consume on-call time. Which capability reduces that maintenance burden when it is available for those tables?",
    options: ["Convert every table to external and disable Delta history.", "Run OPTIMIZE after every micro-batch, even when there are no changes.", "Enable predictive optimization so Databricks schedules appropriate maintenance operations on managed tables.", "Manually empty the transaction log at the end of every job."],
    explanation: "Predictive optimization automates maintenance such as OPTIMIZE, VACUUM and statistics updates where appropriate. Managed tables let the platform take on more operational responsibility without breaking the transaction log.",
  },
  "pro-033": {
    question: "A 120 TB events table is filtered today by customer_id and event_date, but the team expects to add region and device_type. customer_id has very high cardinality and partitioning by it would produce millions of small directories. Which layout offers the best adaptability?",
    options: ["Use liquid clustering with a small set of relevant keys and revise those keys as the query pattern changes.", "Physically partition by customer_id, region, device_type and every future column.", "Create a full table per customer.", "Sort the DataFrame once before writing and assume the global order will be preserved forever."],
    explanation: "Liquid clustering avoids the rigid directory scheme and lets keys evolve without immediately rewriting all existing data. A very high-cardinality key is usually a poor traditional partition.",
  },
  "pro-034": {
    question: "A 30 TB table receives selective deletes of a few rows spread across many files. Rewriting every whole file makes nightly maintenance exceed its window. What advantage do deletion vectors bring in this pattern?",
    options: ["They immediately remove the physical files and all their history without needing VACUUM.", "They mark rows as deleted without immediately rewriting each data file, deferring physical materialization to later operations.", "They automatically turn any non-Delta Parquet table into a streaming table.", "They avoid checking protocol compatibility with any external reader."],
    explanation: "Deletion vectors represent logical deletes and can speed up selective DML by avoiding immediate rewrites. Maintenance, retention and client/protocol compatibility considerations still apply.",
  },
  "pro-035": {
    question: "Query Profile shows a query scanning almost every file of a table even though it filters by account_id and event_date. There is no relevant skew and the time is dominated by bytes read. Which intervention does that evidence point to?",
    options: ["Raise spark.sql.shuffle.partitions, even though the profile shows no dominant shuffle.", "Force a broadcast of the large table.", "Change every string column to binary without reviewing consumers.", "Improve the layout and statistics for those columns (for example with liquid clustering) and measure data skipping again."],
    explanation: "The signal points to poor pruning/data skipping, not shuffle parallelism. Organizing the data around selective filters and keeping statistics lets files be skipped; the change must then be checked in the profile.",
  },
  "pro-036": {
    question: "In a sort-merge join, a single 'UNKNOWN' key concentrates 38% of the rows. The Spark UI shows one task 40 times slower than the median while the others finish early. Which response tackles the observed cause first?",
    options: ["Disable AQE and reduce the number of executors to one.", "Add caching to the output table after the join.", "Enable/verify AQE skew join and, if that is not enough, isolate or salt the skewed key while preserving semantics.", "Apply coalesce(1) before the join to concentrate all keys equally."],
    explanation: "The long tail caused by a dominant key is skew. AQE can split skewed partitions; extreme cases require explicit handling such as isolating the key or salting with correct recombination.",
  },
  "pro-037": {
    question: "A workload runs on Photon, but the slowest section executes a complex Python UDF. Adding nodes barely reduces the time and the profile shows the Python boundary as dominant. Which optimization is most likely to benefit from the vectorized engine?",
    options: ["Rewrite the rule with supported native SQL/PySpark expressions and compare the plan before and after.", "Register the same Python UDF under a shorter name.", "Convert the UDF result to JSON before writing.", "Disable Photon so the UDF no longer appears in the profile."],
    explanation: "Photon accelerates supported operators, but it cannot optimize the opaque body of a Python UDF. Expressing the logic with native functions can remove serialization and widen the portion the engine can execute.",
  },
  "pro-038": {
    question: "A batch pipeline takes twelve minutes every hour and keeps an all-purpose cluster permanently on. It needs no in-memory state between runs and the team accepts serverless's functional profile. Which change will probably reduce idle cost without sacrificing the cadence?",
    options: ["Duplicate the all-purpose cluster so there is always a spare.", "Keep the current cluster and disable auto-termination.", "Turn the batch into a continuous stream that never stops.", "Run the job on suitable serverless or ephemeral compute and validate duration, limits and cost with system tables."],
    explanation: "An ephemeral resource removes most of the idle time of a permanent interactive cluster. The decision must be verified against the SLA and real consumption, not only the nominal price of a DBU.",
  },
  "pro-039": {
    question: "Regional analysts query the same customers table. Each group must see only its region, and email must appear partially hidden except for the fraud team. The logic must apply to any tool that queries the table. Which centralized control best meets the requirement?",
    options: ["Create a physical copy of the table per user and sync it every night.", "Apply a row filter for region and a column mask for email, with functions and permissions governed in Unity Catalog.", "Hide the columns in the catalog explorer without changing query permissions.", "Ask every dashboard to include its own WHERE and regexp_replace."],
    explanation: "Row filters and column masks are applied when the table is accessed and do not depend on every consumer remembering the rule. The functions must be designed and governed carefully to preserve least privilege.",
  },
  "pro-040": {
    question: "Data science needs to link a customer's events over time but must not receive the real customer_id. Compliance requires an authorized service to be able to reverse the substitution during an investigation. Which technique fits better than an unkeyed irreversible hash?",
    options: ["Suppress the whole row and replace it with null.", "Generalize customer_id by rounding it to the nearest thousand.", "Tokenize the identifier through a controlled service that keeps the mapping and separates the keys from the analytical data.", "Publish customer_id in clear text and rely on a contractual clause."],
    explanation: "Tokenization can keep stability for joins and reversibility under specific controls. A simple hash can be attacked and offers no authorized reversal; suppression or generalization do not meet the need for exact linkage.",
  },
  "pro-041": {
    question: "A valid request requires removing a data subject from production Delta tables and preventing it from reappearing from bronze, Change Data Feed, checkpoints or reruns. The team proposes running DELETE only on the gold table. Which plan addresses the full lifecycle?",
    options: ["Locate the subject in every layer and derivative, prevent its replay, run governed deletes and apply retention/VACUUM according to policy and verified legal constraints.", "Delete the gold view; the underlying files and tables will disappear automatically.", "Rename the identifier column so the subject can no longer be found.", "RESTORE to a version before the subject arrived without considering later data."],
    explanation: "The purge must cover sources, layers, derivatives, replay mechanisms and physical retention. A DELETE on one output does not stop a backfill from regenerating the data, and VACUUM must respect the approved policy and dependencies such as CDF or time travel.",
  },
  "pro-042": {
    question: "A user has CAN EDIT on a notebook that contains SELECT * FROM main.finance.payroll, but Unity Catalog does not grant them USE CATALOG, USE SCHEMA or SELECT on the table. What security outcome should be expected when the notebook runs with their identity?",
    options: ["CAN EDIT automatically inherits SELECT on any table mentioned in the notebook.", "The notebook runs the query but masks every column without additional configuration.", "The workspace permission replaces Unity Catalog only during the first run.", "The query fails for lack of data privileges; workspace object ACLs do not grant access to the table."],
    explanation: "Permissions to edit a notebook and privileges on securables are distinct controls. The user needs the applicable privileges on the catalog/schema and SELECT on the table, or an equivalent authorized path.",
  },
  "pro-043": {
    question: "A stream of requests may include PII in free-text fields. Silver feeds many consumers and the requirement states that no unclassified record may reach that layer, but doubtful cases must not be lost. Which architecture best enforces the privacy boundary?",
    options: ["Publish to silver first and run a weekly mask over the rows already consumed.", "Detect and classify before publishing, transform or mask valid cases, quarantine doubtful ones and record metrics and lineage.", "Drop all free text without keeping evidence or a reason.", "Rely only on users not selecting the sensitive column."],
    explanation: "The control must sit before the consumption boundary. Separating doubtful cases enables review without exposure or silent loss, and the metrics demonstrate that the control works in both batch and streaming.",
  },
  "pro-044": {
    question: "The sales_readers group must query every current and future table in main.sales, but no other schemas in the main catalog. Today permissions are granted table by table and new publications fail for readers. Which use of inheritance simplifies the model?",
    options: ["Grant SELECT on the whole metastore and rely on naming conventions.", "Give ownership of main to every member of sales_readers.", "Grant the group the necessary usage privileges and SELECT on the main.sales schema, taking advantage of inheritance to its objects.", "Grant CAN MANAGE on every SQL warehouse in the account."],
    explanation: "A grant on the schema can be inherited by its child objects and avoids maintaining lists of tables. The applicable USE privileges must be included without widening access to unrelated schemas.",
  },
  "pro-045": {
    question: "The data search shows dozens of tables named customer_final_v2 without a description, business owner or classification. Analysts open tickets to find out which one is reliable and which columns contain PII. Which improvement directly increases discoverability and governance?",
    options: ["Add clear comments to tables and columns, ownership and governed domain/sensitivity tags, without storing secrets in metadata.", "Rename every table to data and hide them from the catalog.", "Grant global SELECT so every user can explore the full content.", "Copy the documentation into a personal spreadsheet without linking it to the objects."],
    explanation: "Metadata next to the object improves search, understanding and policy enforcement. Tags must follow a governed taxonomy and never contain sensitive values or credentials.",
  },
  "pro-046": {
    question: "A platform creates hundreds of new tables and the team does not want to manage paths, orphan-file cleanup and maintenance separately. There is no requirement for another platform to write directly to those locations. Which table type reduces operational overhead and keeps central governance?",
    options: ["External tables with a different path created manually by each developer.", "Session temporary views as production storage.", "Parquet files not registered in the catalog.", "Unity Catalog managed tables, letting the platform manage location and lifecycle."],
    explanation: "With a managed table, Unity Catalog and Databricks manage storage and metadata as a unit, enabling more automation. External remains valid when external control of the location is required, but it adds operational responsibility.",
  },
  "pro-047": {
    question: "The organization applies different masks depending on classification and country. Creating a function and a manual ALTER TABLE for every column no longer scales, and classifications are expressed through governed tags. Which approach centralizes the policy when the capability is enabled?",
    options: ["Generate an ungoverned copy of every table per country.", "Define ABAC policies based on governed tags, with explicit exceptions and access tests per role.", "Ask each team to implement a different CASE WHEN in its dashboards.", "Grant SELECT only to the administrator and export CSV to everyone else."],
    explanation: "ABAC lets you express reusable controls over governed attributes, reducing object-by-object configuration. Taxonomy, precedence and tests remain essential to avoid incorrect classifications.",
  },
  "pro-048": {
    question: "In a job A→B→C and A→D, A and D finished successfully, B failed before writing and C was skipped because of the dependency. The failure is fixed by changing one of B's parameters for that historical run. Which repair minimizes repeated work?",
    options: ["Create a new job that runs A, B, C and D from scratch.", "Manually mark the run as successful without running B.", "Delete the outputs of A and D and relaunch every task.", "Repair the run with the authorized override, rerunning B and its failed/skipped dependents without repeating the successful A and D."],
    explanation: "Job repair keeps the run's context and lets you repeat only the necessary segment. Independent successful tasks do not need to run again; any partial effect of B must still be idempotent or explicitly cleaned up.",
  },
  "pro-049": {
    question: "A stage has 2,000 tasks. The median takes 14 seconds, the 99th percentile exceeds 9 minutes and the slow tasks read much more input and spill to disk. The logs show no functional errors. Which hypothesis is best supported by the Spark UI?",
    options: ["A missing SELECT permission in Unity Catalog.", "Data skew creating disproportionate partitions and memory/spill pressure.", "A syntax error in databricks.yml.", "An expired OpenSharing credential."],
    explanation: "The wide spread in duration, bytes and spill inside the same stage is typical evidence of skew. The next step is to locate the dominant keys/partitions and review the plan, AQE and join strategy.",
  },
  "pro-050": {
    question: "An update of Spark Declarative Pipelines in Lakeflow fails while materializing silver_orders, but other tables in the graph are updated. The job's summary message does not reveal whether the quality rule, the flow or the compute failed. Where do you first get the specific context of the dataset and the update?",
    options: ["In the pipeline event log, filtering the affected update, flow and dataset, and complementing with the Spark UI if needed.", "In the browsing history of the developer who did the deploy.", "Only in system.billing.usage, because it contains the full stack trace of every dataset.", "In DESCRIBE HISTORY of an unrelated table."],
    explanation: "The event log is the structured source of the pipeline's events, state, quality and execution details. If the failure lies in Spark execution, its references let you drill down later into the Spark UI and logs.",
  },
  "pro-051": {
    question: "A CI pipeline deploys the same bundle to test and prod. In production, runs must use a restricted service principal and point to main_prod; in test, to main_test and a test identity. Which configuration makes safe promotion explicit?",
    options: ["A notebook that detects the workspace URL and changes its permissions through the REST API.", "Separate targets with catalog variables and the appropriate run_as, deployed by CI identities with minimum permissions.", "A manual copy of the YAML kept outside Git for each workspace.", "A personal administrator token shared by every runner."],
    explanation: "Targets and variables represent environment differences without forking the artifact. run_as controls the execution identity, while the deploying identity must have only the permissions to manage the required resources.",
  },
  "pro-052": {
    question: "The team keeps notebooks in a Git folder and assumes that pulling main will automatically update production jobs, permissions, pipelines and schedules. After the pull, the resources still have the previous configuration. Which concept corrects that assumption?",
    options: ["Git folders also manage all infrastructure state even without a declarative definition.", "Production jobs must always be edited by hand after every merge.", "The Git folder syncs code; resources and their configuration must be declared and deployed, for example through a bundle in CI/CD.", "Unity Catalog permissions are inferred from the Git branch name."],
    explanation: "Versioning code is not the same as applying resource configuration. A bundle describes jobs, pipelines, identities and parameters, and the delivery pipeline validates and deploys that definition in a controlled way.",
  },
  "pro-053": {
    question: "After deploying a faulty version, the team goes back to the previous wheel. However, the failed run had already done a MERGE into silver and sent part of the records to an external system. Which statement should guide the recovery?",
    options: ["Reverting the artifact automatically reverts every Delta commit and external effect.", "Deleting the job also deletes its tables and published messages.", "A code rollback does not revert data or side effects; idempotent writes, reconciliation and a validated compensation or restore procedure are needed.", "Rerunning the previous wheel alone guarantees there will be no duplicates."],
    explanation: "Code, configuration, Delta commits and external systems have different lifecycles. A deployment strategy must combine reversible artifacts with idempotency, checkpoints and data-repair runbooks.",
  },
  "pro-054": {
    question: "A job fails intermittently with executor lost. The Spark UI shows all tasks are uniform, but the cluster logs record system memory pressure and node restarts during the same interval. Which diagnostic sequence avoids a premature conclusion?",
    options: ["Immediately change every table to CSV.", "Ignore the timestamps and increase retries until some run finishes.", "Restore an old version of every input table.", "Correlate run, stage and compute logs by time, distinguish an infrastructure failure from a data error and test the change in a controlled run."],
    explanation: "The signals point to the execution environment, but they must be correlated before changing capacity or code. Retries can hide the incident and raise cost; a controlled test confirms the hypothesis.",
  },
  "pro-055": {
    question: "A sales model mixes order lines and daily totals in the same table. When revenue is summed by store, totals are duplicated because some rows represent items and others represent whole days. Which modeling decision must be made before choosing keys or measures?",
    options: ["Declare a single, explicit grain for the fact table, separating facts with different granularities.", "Add more nullable columns so each row can represent any level.", "Apply distinct to the result of every dashboard.", "Partition by every numeric measure."],
    explanation: "The grain defines what a row represents and determines keys and additive measures. Mixing granularities produces ambiguous joins and aggregations that distinct cannot reliably fix.",
  },
  "pro-056": {
    question: "The business needs to know both each customer's current address and the address that was valid when a sale happened. The CDC feed contains key, operation and a monotonic sequence per customer. Which materialization preserves the required history?",
    options: ["Overwrite the whole dimension with the latest address and discard earlier events.", "Apply CDC with the correct keys and sequence_by for an SCD type 2 dimension, keeping validity intervals.", "Store each event as a new column on the customer's row.", "Create a view that picks a random address when there are duplicates."],
    explanation: "SCD type 2 keeps versions and intervals to resolve the dimension valid at the time of the fact. The CDC sequence orders changes and prevents an old event from replacing a newer version.",
  },
  "pro-057": {
    question: "A sale arrives before the dimension of the new supplier. The fact must be published today with reconcilable amounts, and tomorrow the dimension will arrive with its final attributes. Which pattern keeps analytical integrity during the late arrival?",
    options: ["Permanently drop the sale because the dimension does not exist.", "Copy every supplier attribute as free text into the fact.", "Wait indefinitely and block the whole sales batch.", "Assign an unknown dimension row with a controlled surrogate key and reconcile/rekey when the real supplier arrives."],
    explanation: "The unknown dimension keeps the fact row and avoids null keys. A reconciliation process must identify those cases and link them to the final dimension without duplicating measures.",
  },
  "pro-058": {
    question: "Operations needs to answer how many contracts were active at the close of each day and compare daily balances. Rebuilding the state from millions of events every time breaches the dashboard's SLA. Which type of fact best serves that query pattern?",
    options: ["A table without a date that contains only the last observed contract.", "An SCD type 1 dimension with the aggregated balance of the whole company.", "A periodic snapshot fact with one row per contract and day (or the agreed closing granularity) and balance/status measures.", "A bridge table between employees and offices."],
    explanation: "The periodic snapshot materializes state at regular points in time and makes trends and closes efficient. The grain must be defined explicitly to avoid double counting and to control volume.",
  },
  "pro-059": {
    question: "A campaign can belong to several segments and a segment contains many campaigns. Joining campaign_fact directly with segment_dim duplicates revenue when the report aggregates by campaign. Which structure models the relationship without hiding the cardinality?",
    options: ["Add segment_1, segment_2 and segment_3 columns to the fact and limit the model to three segments.", "Pick one segment per campaign at random before publishing.", "Concatenate every segment into a string and use LIKE in every query.", "Create a campaign-segment bridge table and define allocation or weighting rules for measures that are not additive across segments."],
    explanation: "The bridge table explicitly represents the many-to-many relationship. If a measure is split by segment, the model must define weights or aggregation rules so revenue is not multiplied.",
  },
  "pro-060": {
    question: "A team keeps pipelines that use APPLY CHANGES and wants to adopt the recommended naming without redesigning its CDC logic. Which migration reflects Databricks' current recommendation?",
    options: ["Replace APPLY CHANGES with AUTO CDC, keeping the syntax and validating the flow's behavior.", "Rewrite every change as an append-only INSERT and remove the keys.", "Move CDC into a Python UDF executed row by row.", "Use Lakehouse Federation to modify the remote target table."],
    explanation: "AUTO CDC replaces APPLY CHANGES as the recommended name and keeps the same syntax. The migration must be validated, but it does not require changing the CDC model.",
  },
  "pro-061": {
    question: "A repository uses Asset Bundles in production. After the rename to Declarative Automation Bundles, the team fears its bundle commands and configurations will stop working. Which action is technically correct?",
    options: ["Delete every target and recreate them from the UI.", "Keep using the existing configuration; the rename does not break the bundle command or its resources.", "Convert the bundle into a monolithic notebook.", "Manually rename every YAML key from asset to declarative."],
    explanation: "The rename is non-disruptive. Existing commands and configurations keep working, even though the documentation and the course use the new name.",
  },
  "pro-062": {
    question: "FinOps wants to attribute cost per job run precisely. Some jobs share an all-purpose cluster with interactive notebooks and others use dedicated job compute. Which set provides the most reliable attribution?",
    options: ["The all-purpose jobs, because all usage belongs to the last job that ran.", "Job compute or serverless, joining usage_metadata with the system.lakeflow tables and prices.", "The number of notebooks per workspace multiplied by the list price.", "The cluster duration without considering concurrency or SKU."],
    explanation: "Job compute and serverless expose job and run metadata suitable for joining consumption, prices and the job definition. On shared compute, exact attribution is ambiguous.",
  },
  "pro-063": {
    question: "A catalog contains hundreds of tables. Columns tagged as PII must be masked, even when new tables appear, and owners must not be able to remove the protection. Which design best satisfies centralized control?",
    options: ["A different view created manually by each owner.", "A catalog-level ABAC policy based on governed tags, plus separate base grants.", "A DENY applied to the SQL warehouse.", "Copying every PII column into a catalog without users."],
    explanation: "ABAC lets you attach a policy to the catalog and match it dynamically to tagged tables and columns. Base grants are still controlled separately.",
  },
  "pro-064": {
    question: "A team needs to explore an external database without moving data during a proof of concept. If the case becomes a high-volume, low-latency dashboard, it will accept materializing the data. Which sequence of decisions is most defensible?",
    options: ["Start with query federation and, if the pattern becomes recurring and demanding, evaluate managed Lakeflow Connect.", "Create a manual CSV export from day one and keep it for production.", "Use Delta Sharing to write to the external database.", "Always keep federation because it never depends on the source's performance."],
    explanation: "Federation avoids movement and fits ad hoc exploration; managed ingestion usually scales better for large volumes, recurrence and lower query latency.",
  },
  "associate-aug-01-01": {
    question: "One row per date is needed with the total amount and the number of unique orders. Which aggregations apply?",
    options: ["sum(amount) and count_distinct(order_id)", "sum(order_id) and count(amount)", "avg(amount) and sum(order_id)", "collect_list(amount) and count(customer_id)"],
    explanation: "The metric combines a sum of the amount with a distinct count of the order key.",
  },
  "associate-aug-01-02": {
    question: "A table contains several lines per invoice. How do you compute revenue and unique invoices per store?",
    options: ["groupBy(invoice_id).agg(sum(store_id), count(net))", "groupBy(store_id).agg(sum(net), count_distinct(invoice_id))", "select(store_id, sum(net), invoice_id)", "groupBy(store_id).agg(count(net), sum(invoice_id))"],
    explanation: "The grouping uses the store dimension and the right metrics for amount and invoice cardinality.",
  },
  "associate-aug-01-03": {
    question: "Which expression gets units sold and unique customers per product?",
    options: ["groupBy(customer_id).agg(sum(product_id), count(quantity))", "groupBy(product_id).agg(avg(quantity), sum(customer_id))", "groupBy(product_id).agg(sum(quantity), count_distinct(customer_id))", "select(product_id, quantity, customer_id).distinct()"],
    explanation: "The grain is product; units are summed and customers are deduplicated.",
  },
  "associate-aug-01-04": {
    question: "The same ticket appears in several detail rows. To count daily tickets without duplicating them you should use:",
    options: ["sum(ticket_id) without grouping", "count(item_id) after groupBy(ticket_id)", "collect_set(sale_date) as the amount", "count_distinct(ticket_id) after groupBy(sale_date)"],
    explanation: "The ticket key is counted distinctly within each date.",
  },
  "associate-aug-01-05": {
    question: "Which calculation produces the average salary and the number of unique employees per department?",
    options: ["groupBy(department).agg(avg(salary), count_distinct(employee_id))", "groupBy(employee_id).agg(sum(department), count(salary))", "groupBy(department).agg(sum(employee_id), max(salary))", "select(department, salary).distinct()"],
    explanation: "The dimension is department; salary needs an average and headcount a distinct count.",
  },
  "associate-aug-01-06": {
    question: "A DataFrame has repeated events per session. Which summary counts events and unique sessions per day?",
    options: ["groupBy(session_id).agg(count(event_date), sum(event_id))", "groupBy(event_date).agg(count(event_id), count_distinct(session_id))", "groupBy(event_date).agg(sum(session_id), count(event_id))", "dropDuplicates([event_date]) without aggregation"],
    explanation: "The total of events allows count; sessions require count_distinct.",
  },
  "associate-aug-02-01": {
    question: "The finance group can already traverse the catalog and schema. Which grant provides read-only access to every table in the schema?",
    options: ["GRANT MODIFY ON SCHEMA finance TO `finance-readers`", "GRANT CREATE TABLE ON SCHEMA finance TO `finance-readers`", "GRANT SELECT ON SCHEMA finance TO `finance-readers`", "GRANT ALL PRIVILEGES ON CATALOG main TO `finance-readers`"],
    explanation: "SELECT on the schema grants inheritable read access without write or create permissions.",
  },
  "associate-aug-02-02": {
    question: "A group must create tables in sandbox but not administer the catalog. Which minimum privilege is missing?",
    options: ["OWN on the metastore", "ALL PRIVILEGES on the catalog", "MODIFY on every production table", "CREATE TABLE on the sandbox schema"],
    explanation: "Creating a table requires traversal access and CREATE TABLE on the target schema.",
  },
  "associate-aug-02-03": {
    question: "A user has SELECT on a table but cannot resolve its three-level name. What should be checked?",
    options: ["USE CATALOG and USE SCHEMA on the ancestors", "CREATE CATALOG and MANAGE", "MODIFY and DELETE", "CAN MANAGE on the workspace"],
    explanation: "SELECT does not replace the privileges needed to traverse the catalog and schema.",
  },
  "associate-aug-02-04": {
    question: "Which statement removes the ability to modify a table without removing the read access already granted?",
    options: ["DROP TABLE main.ops.orders", "REVOKE MODIFY ON TABLE main.ops.orders FROM `operators`", "REVOKE USE CATALOG ON CATALOG main FROM `operators`", "DENY SELECT ON TABLE main.ops.orders TO `operators`"],
    explanation: "REVOKE removes the specific privilege and keeps other independent grants.",
  },
  "associate-aug-02-05": {
    question: "A team needs to execute a governed function, but not edit it. Which privilege applies?",
    options: ["MODIFY on the catalog", "CREATE SCHEMA on the metastore", "EXECUTE on the function", "OWN on the function"],
    explanation: "EXECUTE allows invoking the function without transferring ownership or the ability to modify it.",
  },
  "associate-aug-02-06": {
    question: "To read governed files in a Volume, in addition to traversing the catalog and schema, you need:",
    options: ["SELECT on the SQL warehouse", "MODIFY on every table", "CREATE MANAGED STORAGE on the metastore", "READ VOLUME on the Volume"],
    explanation: "Files in a Volume are authorized with READ VOLUME, not with table SELECT.",
  },
  "associate-aug-03-01": {
    question: "Two Databricks accounts want to share live tables while keeping the identity of both parties. Which mode should be prioritized?",
    options: ["Databricks-to-Databricks sharing", "A CSV sent by email", "An open token for any recipient", "A nightly copy through JDBC"],
    explanation: "The Databricks-to-Databricks mode uses account identities and avoids open credentials for the recipient.",
  },
  "associate-aug-03-02": {
    question: "A partner without Databricks needs to query a shared dataset. Which mode fits?",
    options: ["Grant them ownership of the metastore", "Open sharing with a recipient credential and a secure profile", "Add them to the workspace admins group", "Hand over the bucket's cloud credentials"],
    explanation: "Open sharing is designed for recipients outside Databricks without exposing storage credentials.",
  },
  "associate-aug-03-03": {
    question: "What is added to a share to publish only approved columns with adapted names?",
    options: ["An all-purpose cluster", "A recipient storage credential", "A shareable view that projects and renames the columns", "A Structured Streaming checkpoint"],
    explanation: "A view lets you control the projection without physically duplicating the data product.",
  },
  "associate-aug-03-04": {
    question: "A Delta Sharing recipient needs to modify the provider's table. What must be clarified?",
    options: ["The recipient automatically gets MODIFY", "The recipient inherits ownership of the catalog", "The share turns the table into a Volume", "The protocol provides read access to the shared data; writes are managed by the provider"],
    explanation: "Delta Sharing distributes read access; it does not delegate writes on the source table.",
  },
  "associate-aug-03-05": {
    question: "Before sharing data across cloud regions, you should especially evaluate:",
    options: ["Transfer cost, residency and latency", "Number of notebook cells", "Dashboard color", "Alphabetical order of the catalogs"],
    explanation: "Access across regions or clouds can introduce egress, regulatory restrictions and latency.",
  },
  "associate-aug-03-06": {
    question: "Which object groups the tables and views the provider wants to expose through Delta Sharing?",
    options: ["A recipient", "A share", "A SQL warehouse", "A job cluster"],
    explanation: "The share represents the set of published assets; the recipient represents whoever consumes them.",
  },
  "associate-aug-04-01": {
    question: "An empty table must be declaratively recreated even if it already exists. Which SQL form applies?",
    options: ["CREATE TABLE IF NOT EXISTS without replacement", "INSERT OVERWRITE without a target table", "CREATE OR REPLACE TABLE ... (columns) USING DELTA", "ALTER VIEW ADD COLUMNS"],
    explanation: "CREATE OR REPLACE applies the given definition whether or not the table exists.",
  },
  "associate-aug-04-02": {
    question: "You want to keep an existing table and create it only when it is missing. Which clause expresses that intent?",
    options: ["CREATE OR REPLACE TABLE", "DROP TABLE IF EXISTS", "REPLACE WHERE", "CREATE TABLE IF NOT EXISTS"],
    explanation: "IF NOT EXISTS avoids replacing a table that has already been created.",
  },
  "associate-aug-04-03": {
    question: "Which statement creates a Delta table from the result of a query?",
    options: ["CREATE TABLE target USING DELTA AS SELECT ...", "ALTER TABLE target SELECT ...", "GRANT TABLE AS SELECT ...", "MERGE TABLE WITHOUT SOURCE"],
    explanation: "CTAS combines definition and population through the result of SELECT.",
  },
  "associate-aug-04-04": {
    question: "A nullable column must become NOT NULL after the data is validated. Which type of operation is used?",
    options: ["VACUUM to rewrite the schema", "ALTER TABLE to modify the column definition", "DESCRIBE HISTORY to apply the change", "OPTIMIZE to add the constraint"],
    explanation: "ALTER TABLE modifies schema metadata; maintenance operations do not declare constraints.",
  },
  "associate-aug-04-05": {
    question: "Which command drops a table only if it exists, making cleanup idempotent?",
    options: ["DELETE TABLE ALWAYS", "TRUNCATE IF MISSING", "DROP TABLE IF EXISTS", "REMOVE TABLE CASCADE FILES"],
    explanation: "IF EXISTS makes the operation repeatable when the object has already been removed.",
  },
  "associate-aug-04-06": {
    question: "You need to change a table's logical name without creating a copy of the data. Which statement applies?",
    options: ["CREATE TABLE new_name CLONE old_name", "INSERT INTO new_name SELECT * FROM old_name", "COPY INTO new_name FROM old_name", "ALTER TABLE old_name RENAME TO new_name"],
    explanation: "RENAME updates the catalog reference instead of materializing another table.",
  },
  "associate-aug-05-01": {
    question: "Which SQL form adds a complete row to an existing Delta table?",
    options: ["INSERT INTO target VALUES (...) ", "UPDATE VALUES (...) target", "CREATE ROW INTO target", "APPEND TABLE target SET (...)"],
    explanation: "INSERT INTO ... VALUES expresses a row insertion in SQL.",
  },
  "associate-aug-05-02": {
    question: "A load brings new and existing keys. Which operation updates matches and inserts the missing ones?",
    options: ["VACUUM with RETAIN 0 HOURS", "MERGE INTO with WHEN MATCHED and WHEN NOT MATCHED", "DESCRIBE DETAIL", "GRANT MODIFY"],
    explanation: "MERGE models an atomic upsert based on the match condition.",
  },
  "associate-aug-05-03": {
    question: "rating must be corrected only for id='a1'. Which DML applies?",
    options: ["INSERT target WHERE id='a1'", "ALTER COLUMN rating=9.4", "UPDATE target SET rating=9.4 WHERE id='a1'", "OPTIMIZE target WHERE id='a1'"],
    explanation: "UPDATE modifies existing rows selected by a predicate.",
  },
  "associate-aug-05-04": {
    question: "Which statement removes expired rows from a Delta table?",
    options: ["DROP TABLE target WHERE expires_at", "VACUUM target WHERE expires_at", "REVOKE SELECT WHERE expires_at", "DELETE FROM target WHERE expires_at < current_date()"],
    explanation: "DELETE is the DML operation for removing rows that meet a condition.",
  },
  "associate-aug-05-05": {
    question: "To append the result of a query while respecting the column order you use:",
    options: ["INSERT INTO target SELECT ...", "ALTER TABLE target AS SELECT", "UPDATE target CREATE SELECT", "COPY TABLE target VALUES SELECT"],
    explanation: "INSERT INTO can directly consume the rows produced by SELECT.",
  },
  "associate-aug-05-06": {
    question: "A retryable ingestion must avoid inserting an already processed key again. Which pattern is most solid?",
    options: ["INSERT INTO without a condition on every retry", "MERGE with a stable key and a match condition", "collect before writing", "Rename the table on every run"],
    explanation: "The stable key lets the retry update or ignore the match instead of duplicating it.",
  },
  "professional-aug-01-01": {
    question: "An external Delta table is renamed within the same catalog. What necessarily changes?",
    options: ["The reference registered in the catalog/metastore", "The file path moves automatically", "A new transaction log is created", "Every Parquet file is rewritten"],
    explanation: "The name is catalog metadata; the rename does not imply moving the external location.",
  },
  "professional-aug-01-02": {
    question: "A managed table is renamed without changing catalog. Which statement is defensible?",
    options: ["Every file receives the new name", "The catalog updates the logical identity; the platform manages the associated storage", "An automatic deep clone runs", "The reader protocol is incremented"],
    explanation: "The rename operates on metadata; it is not equivalent to cloning or raising the protocol.",
  },
  "professional-aug-01-03": {
    question: "After RENAME TABLE, a job keeps using the previous identifier. What must be updated?",
    options: ["The checkpoint, to create a new Delta log", "Every Parquet file", "The job's reference to the table name", "The Spark version in the metastore"],
    explanation: "Consumers that refer to the table by name must adopt the newly registered identifier.",
  },
  "professional-aug-01-04": {
    question: "What is the main risk of confusing a catalog rename with a change of location?",
    options: ["Photon being disabled", "The SQL warehouse losing auto-stop", "VACUUM creating a catalog", "Assuming the physical path has moved when only the logical name changed"],
    explanation: "Distinguishing the logical reference from the location prevents later operations on the wrong path.",
  },
  "professional-aug-02-01": {
    question: "Micro-batches take 18 s with a 10 s trigger and the backlog grows. What should be done first?",
    options: ["Optimize or scale so the processing time falls back under the SLA", "Lower the trigger to 1 s without measuring", "Delete the checkpoint", "Start two queries on the same checkpoint"],
    explanation: "A shorter interval does not add concurrency between micro-batches of the same query when processing is already behind.",
  },
  "professional-aug-02-02": {
    question: "A query normally takes 2 s but reaches 25 s because of skew at peak hours. Which action tackles the cause?",
    options: ["Change outputMode without reviewing the state", "Measure the distribution and fix the skew or capacity before changing the trigger", "Delete committed offsets", "Run trigger once every five seconds"],
    explanation: "The irregularity comes from the per-batch work; the trigger does not remove skew or spill.",
  },
  "professional-aug-02-03": {
    question: "The SLA requires less than 10 s and every sustained batch takes 12 s. Which conclusion is correct?",
    options: ["A 5 s trigger will run two batches simultaneously", "The checkpoint prevents any tuning", "The query cannot keep up; the processing time per batch must be reduced", "availableNow guarantees continuous latency"],
    explanation: "Processing capacity must exceed the input rate to avoid accumulation.",
  },
  "professional-aug-02-04": {
    question: "Which metrics help decide whether the latency problem lies in input, processing or state?",
    options: ["Only the notebook name", "Number of catalogs and users", "Size of the README", "inputRowsPerSecond, processedRowsPerSecond, batchDuration and state store metrics"],
    explanation: "Progress metrics separate arrival rate, throughput and state pressure.",
  },
  "professional-aug-03-01": {
    question: "A table holding years of events is almost always queried by event_date. Which column has the right cardinality and pattern for layout?",
    options: ["event_date", "Unique event_id", "JSON payload", "Millisecond-level ingest_timestamp"],
    explanation: "A date used in filters avoids the extreme cardinality of identifiers or fine-grained timestamps.",
  },
  "professional-aug-03-02": {
    question: "A table receives changing filters on customer_id and region. Which alternative reduces rigid partitioning decisions?",
    options: ["Partition by every column", "Liquid clustering with observed, revisable keys", "One file per customer", "Collect and a local write"],
    explanation: "Liquid clustering supports flexible keys without fixing a traditional directory hierarchy.",
  },
  "professional-aug-03-03": {
    question: "Which column is a poor candidate for traditional partitioning of a posts table?",
    options: ["date with frequent filters", "region with bounded cardinality", "Nearly unique post_id", "Derived event_day"],
    explanation: "A nearly unique key generates too many small partitions.",
  },
  "professional-aug-03-04": {
    question: "Before choosing a layout column, you should mainly measure:",
    options: ["Length of the notebook name", "Number of dashboards without queries", "Number of repository users", "Filter patterns, cardinality, volume and file size"],
    explanation: "The layout must respond to real access and physical distribution.",
  },
  "professional-aug-04-01": {
    question: "A view returns the real email only to marketing and REDACTED to everyone else. What will an analyst outside the group see?",
    options: ["The projected columns, with REDACTED in email", "The whole base table", "An error for not being the owner", "An extra column named marketing"],
    explanation: "The CASE expression evaluates membership and replaces the value for unauthorized users.",
  },
  "professional-aug-04-02": {
    question: "A dynamic view uses is_account_group_member for finance. Where is the displayed value decided?",
    options: ["In the job checkpoint", "In the view expression at query time", "In VACUUM", "In the warehouse size"],
    explanation: "The view logic evaluates the identity at query time.",
  },
  "professional-aug-04-03": {
    question: "Which permission does a consumer need on a view in addition to traversing the catalog and schema?",
    options: ["OWN on the base table", "CREATE CATALOG", "SELECT on the view", "MANAGE on the metastore"],
    explanation: "Consumers query the view through SELECT; they do not need ownership of the base table.",
  },
  "professional-aug-04-04": {
    question: "A policy must automatically cover new columns tagged PII. Which mechanism scales better than manual views?",
    options: ["One notebook per table", "One CSV copy per group", "One cluster per user", "ABAC with governed tags"],
    explanation: "ABAC applies centralized policies to objects that match the governed attributes.",
  },
  "professional-aug-05-01": {
    question: "A pipeline takes 8 min and must finish every hour. Which compute minimizes idle time?",
    options: ["Job compute or serverless started for each run", "An interactive cluster that is always on", "A SQL warehouse without auto-stop for PySpark", "A pool without associated jobs"],
    explanation: "Ephemeral compute avoids paying for idle capacity between runs.",
  },
  "professional-aug-05-02": {
    question: "A memory-intensive notebook does not support retries. Which configuration should be prioritized?",
    options: ["A more frequent trigger", "Enough memory and max_retries=0 for that task", "A Delta Sharing recipient", "A new schemaLocation"],
    explanation: "The task must be sized for its profile and explicitly reflect that it is not retryable.",
  },
  "professional-aug-05-03": {
    question: "The SLA is daily and the job takes 20 minutes. Which option is usually cheaper?",
    options: ["All-purpose 24x7", "Two active clusters for redundancy without a requirement", "A scheduled run on ephemeral compute with auto-termination", "Continuous streaming without data"],
    explanation: "Ephemeral scheduling aligns consumption with the work performed.",
  },
  "professional-aug-05-04": {
    question: "A task can produce non-idempotent external effects. Which setting prevents repeating them automatically?",
    options: ["Increase retries to infinity", "Delete the job history", "Use a shared interactive cluster", "Disable retries and design a controlled recovery"],
    explanation: "Automatic retries can duplicate effects; recovery must be explicit.",
  },
  "professional-aug-06-01": {
    question: "dbutils.secrets.get returns a password that is printed. What output should be expected in the notebook?",
    options: ["A redacted value, although the secret can still leak through unsafe transformations", "The password always in clear text", "An interactive input box", "The secret automatically saved to DBFS"],
    explanation: "Databricks tries to redact direct access, but code must avoid exposing or transforming secrets.",
  },
  "professional-aug-06-02": {
    question: "How should a JDBC secret be passed to the password option?",
    options: ["Pasting it into the notebook", "Fetching it at runtime from an authorized secret scope", "Storing it in a public table", "Including it in the job name"],
    explanation: "The secret scope separates the sensitive value from the versioned code.",
  },
  "professional-aug-06-03": {
    question: "A user without READ on the secret scope runs dbutils.secrets.get. What happens?",
    options: ["An empty string is returned", "A personal scope is created", "The read fails for authorization reasons", "Access is granted because a cluster is used"],
    explanation: "Access to compute does not imply permission on the secret scope.",
  },
  "professional-aug-06-04": {
    question: "Which practice remains unsafe even though the UI redacts the direct print?",
    options: ["Using a scope with ACLs", "Rotating the credential", "Limiting READ to the job principal", "Concatenating, encoding or sending the secret to another destination"],
    explanation: "Redaction is not a security boundary against code that transforms or exfiltrates the value.",
  },
  "professional-aug-07-01": {
    question: "1 TB will be written in 512 MB files without a prior shuffle. Which write setting should be evaluated?",
    options: ["spark.sql.files.maxRecordsPerFile or explicit repartitioning based on measurements", "Only autoBroadcastJoinThreshold", "A streaming trigger", "USE CATALOG"],
    explanation: "Controlling size requires relating volume, rows and partitions; not a join option.",
  },
  "professional-aug-07-02": {
    question: "A transformation already produces a shuffle and AQE is enabled. What helps approximate the target partition size?",
    options: ["spark.sql.files.openCostInBytes as the only guarantee", "spark.sql.adaptive.advisoryPartitionSizeInBytes", "spark.sql.autoBroadcastJoinThreshold", "delta.deletedFileRetentionDuration"],
    explanation: "AQE can coalesce post-shuffle partitions using the target size as a recommendation.",
  },
  "professional-aug-07-03": {
    question: "Which setting mainly affects the maximum partition size when reading files, not the final number of files written?",
    options: ["maxRecordsPerFile", "repartition before write", "spark.sql.files.maxPartitionBytes", "AQE advisory partition size after a shuffle"],
    explanation: "maxPartitionBytes governs read partitioning and does not guarantee the output layout.",
  },
  "professional-aug-07-04": {
    question: "Before setting 2,048 partitions based on theoretical arithmetic, you should check:",
    options: ["Number of Git branches", "Dashboard colors", "Number of workspace users", "Real compression, distribution, shuffle and observed sizes"],
    explanation: "Logical volume alone does not predict the compressed size or the skew of the partitions.",
  },
  "professional-aug-08-01": {
    question: "Marketing must expose approved columns with sales names and reflect changes instantly. Which solution is simplest?",
    options: ["A view with projection and aliases", "An automatically synchronized deep clone", "A manually recreated CTAS", "Another write in every pipeline"],
    explanation: "The view avoids duplication and reflects the base table's changes at query time.",
  },
  "professional-aug-08-02": {
    question: "Which statement about DEEP CLONE is correct?",
    options: ["It is a logical view", "It copies data and metadata to an independent target; it does not keep automatic synchronization", "It always shares the same files", "It renames the source table"],
    explanation: "A deep clone materializes a copy and requires later actions to update it.",
  },
  "professional-aug-08-03": {
    question: "You need to hide three columns and standardize two names without storing another copy. Which object should you use?",
    options: ["A shallow clone for row security", "A checkpoint", "A governed view", "A recipient"],
    explanation: "The view controls projection and aliases with minimal operations.",
  },
  "professional-aug-08-04": {
    question: "When would a derived table be more appropriate than a view?",
    options: ["When only an alias changes", "When a column is hidden", "When the latest data is always required without a refresh", "When an expensive result must be materialized with its own SLA and refresh cycle"],
    explanation: "Materialization is justified by performance or decoupling, at the cost of operations and freshness.",
  },
  "professional-aug-09-01": {
    question: "A finishes; B and C start. B finishes and C fails after writing partially. Which state is possible?",
    options: ["A and B are complete and the effects produced before C failed may persist", "Everything is rolled back globally", "B is automatically undone", "No task commits until the end of the DAG"],
    explanation: "A multi-task job does not provide a global transaction across notebooks and systems.",
  },
  "professional-aug-09-02": {
    question: "After C fails, the run is repaired selecting only the failed tasks. What must the design assume?",
    options: ["A and B always run from scratch", "Completed tasks are not repeated and C must be idempotent when resumed", "The repair deletes every table", "The DAG becomes a transaction"],
    explanation: "Repair run reuses successful results where appropriate; the repaired task must tolerate partial effects.",
  },
  "professional-aug-09-03": {
    question: "B and C depend on A and D depends on both. C fails. What normally happens to D?",
    options: ["It runs when B finishes", "It rolls back A and B", "It does not run because a required dependency failed", "It ignores C's state"],
    explanation: "The default run conditions require the upstream dependencies to have succeeded.",
  },
  "professional-aug-09-04": {
    question: "Which design lets a notification task run even if a branch of the DAG fails?",
    options: ["Remove every dependency", "Use an all-purpose cluster", "Store the alert in a comment", "Configure the task's run condition for completion or failure as appropriate"],
    explanation: "Run conditions model final error-handling tasks without assuming a global rollback.",
  },
};

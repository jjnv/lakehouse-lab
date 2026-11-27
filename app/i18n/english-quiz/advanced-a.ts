import type { EnglishQuizCopyTable } from "./types";

export const englishQuizAdvancedA: EnglishQuizCopyTable = {
  "m13-q1": {
    question: "A Job must process everything accumulated every ten minutes and then finish so compute does not sit idle. Which configuration fits best?",
    options: ["A full batch read without a checkpoint", "A query with `availableNow=True` and a stable checkpoint", "A 100-millisecond trigger running continuously", "Deleting the checkpoint at the start of each Job"],
    explanation: "`availableNow` incrementally drains the available backlog and then stops; the checkpoint lets the next run continue without rereading what was already committed.",
  },
  "m13-q2": {
    question: "After the keys of a stateful aggregation are changed, the query will not restart from the previous checkpoint. What is the correct response?",
    options: ["Add workers until the checkpoint becomes compatible", "Disable commit writes", "Plan a migration or reprocessing with a new checkpoint, because the state schema changed", "Set `failOnDataLoss=false` on every source"],
    explanation: "The keys of a stateful operation are part of the state schema. Changing them is usually incompatible and requires a controlled cutover, not more capacity.",
  },
  "m13-q3": {
    question: "A `foreachBatch` calls an API that creates a charge, and the driver fails before the batch is committed. What prevents duplicate charges on retry?",
    options: ["Sending a stable idempotency key per transaction", "Using a longer trigger", "Switching the output mode to `complete`", "Reducing the DataFrame to a single partition"],
    explanation: "The micro-batch can be delivered again. An idempotency key accepted by the external system makes the repetition produce the same final effect.",
  },
  "m13-q4": {
    question: "The input rate is 8,000 rows/s, the processed rate is 5,000 rows/s, and lag has grown for an hour. Which conclusion is supported?",
    options: ["The source is empty", "The checkpoint has deduplicated too many rows", "The watermark is necessarily too short", "The query cannot sustain the arrival rate and is accumulating backlog"],
    explanation: "A processed rate that stays below the input rate, together with growing lag, shows a capacity deficit or an execution bottleneck that must be diagnosed.",
  },
  "m14-q1": {
    question: "An event happened at 10:02, arrived at 10:19, and must be counted in the actual sales interval. Which timestamp governs the window?",
    options: ["The cluster start time", "The 10:19 processing time", "The 10:02 event time", "The time of the next Job run"],
    explanation: "The business window must use event time so that late arrivals and replays keep the same time assignment.",
  },
  "m14-q2": {
    question: "The state of an aggregation grows without bound even though `withWatermark` is present. Which check matters most first?",
    options: ["That the watermarked column actually participates in the window and has valid timestamps", "That the SQL warehouse has auto-stop", "That the catalog uses three-level names", "That the notebook has fewer cells"],
    explanation: "A watermark on a column the operator does not use, or one pushed ahead by bad timestamps, does not provide the expected state boundary.",
  },
  "m14-q3": {
    question: "Two copies of the same `event_id` can differ by 25 minutes of event time. Which configuration guarantees that both are recognized as duplicates?",
    options: ["A five-minute trigger without a watermark", "`distinct()` on `ingested_at`", "A ten-minute watermark", "`dropDuplicatesWithinWatermark` with a horizon longer than 25 minutes"],
    explanation: "The tolerance must exceed the maximum expected time gap between duplicates; otherwise the first key can leave state before the second one arrives.",
  },
  "m14-q4": {
    question: "A left outer stream-stream join emits unmatched records too late for the consumer. What explains that latency?",
    options: ["Delta Lake always waits for `OPTIMIZE`", "The engine must wait for the watermark and the time bound before concluding that no match will arrive", "Outer joins only run in batch", "The checkpoint rereads every event"],
    explanation: "An unmatched row is not final until the time horizon closes; that wait is part of the outer join's correctness.",
  },
  "m15-q1": {
    question: "A team changes `startingOffsets` from `latest` to `earliest`, keeps the checkpoint, and expects to reread six months. What will happen?",
    options: ["It will reread from earliest in the next micro-batch", "Kafka will delete the consumer group", "It will resume from the checkpoint; rewinding requires an isolated reprocessing", "It will duplicate only the last partition"],
    explanation: "In a resumed streaming query, the checkpoint offsets take precedence. `startingOffsets` only applies when a new query starts.",
  },
  "m15-q2": {
    question: "You must investigate exactly which message produced an incorrect silver row. Which metadata is essential to keep?",
    options: ["Topic, partition, and offset", "Only the cluster time", "Only the micro-batch number", "The notebook name and the driver size"],
    explanation: "A Kafka position is identified by topic, partition, and offset; keeping the payload and schema version completes the traceability.",
  },
  "m15-q3": {
    question: "Each micro-batch finishes in 20 seconds, but lag grows because 300,000 events/minute arrive and `maxOffsetsPerTrigger` is 100,000. Which diagnosis is correct?",
    options: ["The trigger is deduplicating by mistake", "The checkpoint should be deleted every minute", "The topic needs less retention", "The ingestion limit is below the arrival rate and the pipeline does not converge"],
    explanation: "Processing at most 100,000 per trigger against 300,000 incoming creates backlog even though each individual batch is short.",
  },
  "m15-q4": {
    question: "An HTTP sink receives the same micro-batch twice after a failure. Which design preserves a single effect per order?",
    options: ["Replacing `subscribe` with `assign`", "Sending `event_id` as an idempotency key accepted by the service", "Removing the Kafka key", "Setting `failOnDataLoss=false`"],
    explanation: "The checkpoint cannot undo an HTTP effect that was already committed; the receiver must deduplicate using a stable idempotency key.",
  },
  "m16-q1": {
    question: "An update with sequence 104 arrives before another with sequence 103. What must remain current after AUTO CDC?",
    options: ["103, because it arrived last", "104, because `SEQUENCE BY` represents the authoritative order", "Both, as current rows", "Neither, until `VACUUM` runs"],
    explanation: "AUTO CDC uses the declared sequence to resolve out-of-order events; arrival time must not move the state backward.",
  },
  "m16-q2": {
    question: "A new solution uses Lakeflow pipelines to apply a CDC feed. Which API should current documentation name?",
    options: ["COPY CHANGES", "MERGE STREAM", "APPLY CHANGES as the only current API", "AUTO CDC, noting that it replaces APPLY CHANGES"],
    explanation: "Databricks recommends AUTO CDC; APPLY CHANGES is the earlier name and remains available for compatibility.",
  },
  "m16-q3": {
    question: "Reporting must know which segment a customer belonged to when each sale happened. Which modeling approach applies?",
    options: ["SCD type 2 with validity intervals", "SCD type 1, overwriting the segment", "A view of the latest micro-batch without a key", "Deleting history after each run"],
    explanation: "SCD 2 keeps the versions needed for a point-in-time join; SCD 1 only keeps the current value.",
  },
  "m16-q4": {
    question: "A CDF consumer was stopped longer than the retention period and the required version no longer exists. Which response is safe?",
    options: ["Use `failOnDataLoss=false` and assume nothing is missing", "Invent the version from the current timestamp", "Rebuild from a valid snapshot and reset the incremental starting point", "Delete the source table"],
    explanation: "When feed versions are missing, continuity cannot be guaranteed; an authoritative snapshot lets you rebuild state and restart consumption.",
  },
  "m17-q1": {
    question: "The query is ACTIVE, but the maximum published `event_ts` is 40 minutes behind. Which indicator is being breached?",
    options: ["Metastore availability", "Business freshness", "VACUUM retention, necessarily", "Number of notebooks"],
    explanation: "A process can be active and still publish stale data. The gap between event time and publication measures freshness.",
  },
  "m17-q2": {
    question: "After a transient executor failure, the code, source, and state are unchanged. Which recovery minimizes risk?",
    options: ["Resume with the same checkpoint", "Delete bronze and start from latest", "Create a new checkpoint without reconciliation", "Empty the target before each retry"],
    explanation: "With a compatible topology, the checkpoint preserves offsets, commits, and state, and lets processing continue from the last committed point.",
  },
  "m17-q3": {
    question: "After an outage, the pipeline processes at exactly the same rate at which new events arrive. What happens to the backlog?",
    options: ["It disappears because of the watermark", "It doubles on every trigger", "It stays roughly constant and the SLA is not recovered", "Delta automatically turns it into batch"],
    explanation: "To reduce backlog, throughput must temporarily exceed the arrival rate; matching it only keeps the backlog from growing.",
  },
  "m17-q4": {
    question: "A game day is declared successful because the Job returns to RUNNING, but 4% of events are lost. What is the correct assessment?",
    options: ["Success, because the RUNNING state is enough", "Success if the cluster uses Photon", "Success if the checkpoint was deleted", "Failure: recovery must also restore completeness and the SLO within the RTO"],
    explanation: "The goal is to recover a correct service, not just restart the process. The loss breaches the completeness criterion.",
  },
  "m18-q1": {
    question: "A decorated function calls `saveAsTable` and then returns a DataFrame. What problem does this introduce?",
    options: ["None; every declarative function must write manually", "The pipeline loses Unity Catalog", "It mixes an imperative side effect with the declaration and hinders re-evaluation and optimization", "It automatically turns the table into SCD 2"],
    explanation: "Pipeline functions should describe datasets by returning DataFrames. The service manages writes and execution.",
  },
  "m18-q2": {
    question: "Gold must reflect updates in silver and serve an already materialized per-customer aggregate. Which object fits?",
    options: ["A materialized view", "A file append without a table", "A notebook with `display`", "A checkpoint shared between queries"],
    explanation: "The materialized view stores the result, and the service can refresh it from upstream changes.",
  },
  "m18-q3": {
    question: "A global streaming aggregate without a watermark must emit only the rows that change to a sink. Which proposal correctly describes the current capability?",
    options: ["Use AUTO CDC, which computes any global aggregate without a sequence", "Use a SQL append flow and assume it updates earlier rows", "Use `@dp.update_flow` in Python, stating that it is in Public Preview", "Use `ONCE`, which re-runs every micro-batch"],
    explanation: "`update_flow` emits changes from a global aggregate to a sink, but it remains in Public Preview and is only available in Python.",
  },
  "m18-q4": {
    question: "What must stay the same when promoting from test to prod?",
    options: ["Catalog, credentials, and capacity", "The code artifact and its versioned logic", "Every physical resource name", "The developer's identity"],
    explanation: "The same artifact is promoted; configuration, identities, targets, and capacity change per environment.",
  },
  "m19-q1": {
    question: "A new currency rule must be measured for two weeks without blocking or dropping orders. Which action applies?",
    options: ["`expect_or_fail`", "`expect`", "`expect_or_drop` without quarantine", "Deleting the event log"],
    explanation: "`expect` keeps records and produces metrics, which suits observing the impact before tightening the contract.",
  },
  "m19-q2": {
    question: "Operations needs to fix and reinject orders that have no `order_id`. Which design provides sufficient evidence?",
    options: ["A quarantine table with payload, reason, provenance, and version", "A counter of dropped rows without the data", "`expect_or_drop` and no additional record", "A screenshot of the pipeline once a month"],
    explanation: "Remediation requires keeping the row and its origin, plus a stable reason that guides the fix.",
  },
  "m19-q3": {
    question: "Where are an expectation's structured metrics found during an update?",
    options: ["Only in the driver's Spark UI", "In the checkpoint's physical name", "In the pipeline event log, inside `flow_progress` events", "Only in `VACUUM` history"],
    explanation: "The event log records progress and `data_quality` per flow and update, and it can be queried from SQL.",
  },
  "m19-q4": {
    question: "You want to automatically detect a table that stopped updating and changes in distribution, without modifying the producing job. Which capability fits?",
    options: ["`expect_or_fail` on any table, even one outside the pipeline", "Data Quality Monitoring: anomaly detection for freshness and completeness, and data profiling for distribution and drift", "A daily `VACUUM` acting as a monitor", "A manual screenshot of the catalog"],
    explanation: "Data Quality Monitoring observes Unity Catalog assets without modifying the table or adding overhead to the producing job; on its own, it does not apply DROP or FAIL actions.",
  },
  "m20-q1": {
    question: "A cleanup task must run even if either of two branches fails. Which condition applies?",
    options: ["If/else on the row count", "Run if `ALL_DONE`", "Run if `ALL_SUCCESS`", "A separate continuous trigger"],
    explanation: "`ALL_DONE` evaluates upstream states and allows cleanup after either success or failure.",
  },
  "m20-q2": {
    question: "An API accepts at most four concurrent requests and there are 30 regions. Which design is appropriate?",
    options: ["A For each task with concurrency 4 and an idempotent body", "Thirty Jobs with no concurrency limit", "A Python loop on the driver without tasks", "A Kafka `maxOffsetsPerTrigger`"],
    explanation: "For each models operational units, and its concurrency setting protects the external limit.",
  },
  "m20-q3": {
    question: "The invalid rate computed by `validate` decides whether to publish. How is it best passed along?",
    options: ["By copying the full DataFrame into a widget", "With a global variable in the upstream notebook", "By writing it into the cluster name", "As a task value referenced by the If/else task"],
    explanation: "It is a small scalar produced upstream, a natural case for `taskValues` and a dynamic reference.",
  },
  "m20-q4": {
    question: "One task failed with a timeout after the other regions finished. The quota is fixed and you want to keep the run. Which action minimizes repeated work?",
    options: ["Delete every table and launch a different Job", "Increase retries indefinitely", "Repair the run by re-running the failed subset, verifying idempotency", "Manually mark the task as success"],
    explanation: "A repair run keeps the context and re-runs failed or skipped tasks; idempotency protects against partial effects.",
  },
  "m21-q1": {
    question: "The files of one batch arrive over 45 seconds and the Job must not start halfway through. Which option addresses that requirement?",
    options: ["`wait_after_last_change_seconds` longer than the internal gap between the batch's files", "`max_concurrent_runs=20`", "A schedule every second", "Deleting files after the first one"],
    explanation: "The debounce restarts the wait with each arrival and launches the run once a quiet period has elapsed.",
  },
  "m21-q2": {
    question: "A consumer depends on a commit to a Unity Catalog table, not on physical files. Which trigger is the most direct?",
    options: ["Continuous with no source", "Yearly schedule", "Table update", "File arrival on `_delta_log`"],
    explanation: "Table update watches the governed update of the table and avoids depending on internal Delta files.",
  },
  "m21-q3": {
    question: "Ninety days must be reprocessed with the same daily logic. Which approach reduces divergence?",
    options: ["Copy the notebook and remove validations to speed it up", "Use a backfill of the same Job parameterized by date with an idempotent write", "Overwrite the whole table for each day", "Create 90 separate permanent Jobs"],
    explanation: "The backfill reuses the production automation and generates runs per interval with controlled parameters.",
  },
  "m21-q4": {
    question: "Runs take 40 minutes and triggers arrive every 10. All of them overwrite the same partition. Which change is unsafe?",
    options: ["Measure and reduce the duration of the critical path", "Apply queueing for a bounded spike", "Change the write to an idempotent per-date boundary", "Increase concurrency without isolating the writes"],
    explanation: "Concurrent runs that mutate the same range create races; isolation or a proven transactional operation is needed first.",
  },
  "m22-q1": {
    question: "Customers arrive as out-of-order updates and deletes, and only the current state is needed. Which object is appropriate?",
    options: ["An append flow without a key", "A materialized view without a sequence", "AUTO CDC with SCD type 1, a key, and `SEQUENCE BY`", "APPLY CHANGES presented as the only current API"],
    explanation: "AUTO CDC is the current API, and SCD 1 materializes the current state by resolving order and deletes per key.",
  },
  "m22-q2": {
    question: "An order without an ID must be fixed later without stopping valid orders. Which action meets the requirement?",
    options: ["Route it to a traceable quarantine and exclude it from silver", "Fail every parallel flow", "Keep it in gold with a null ID", "Drop it without a record"],
    explanation: "Quarantine preserves evidence and enables remediation while the valid branch continues.",
  },
  "m22-q3": {
    question: "Publication must be blocked when the invalid rate exceeds 1%, while keeping the declarative transformation clean. Where does the branching go?",
    options: ["Inside `@dp.table`, calling an API", "In `VACUUM`", "In the Kafka schema", "In Lakeflow Jobs, through validation, a task value, and If/else"],
    explanation: "The pipeline produces data and metrics; Jobs coordinates decisions and operational effects through control flow.",
  },
  "m22-q4": {
    question: "The pipeline finished green once. What evidence is missing before calling it production-ready?",
    options: ["Only changing the dashboard color", "Tests for idempotency, failure and repair, backfill, quality, SLO, and permissions", "An additional notebook that was never run", "Deleting the event log to save space"],
    explanation: "Production readiness includes behavior under retries and incidents, observability, and governance, not just the happy path.",
  },
};

import type { EnglishQuizCopyTable } from "./types";

/**
 * English copy for the Associate exam bank and the Associate official-sample
 * augmentations. Options follow the canonical Spanish order.
 */
export const englishQuizAssociate: EnglishQuizCopyTable = {
  "associate-bank-001": {
    question: "A company wants PySpark ETL and SQL dashboards to query the same governed copy of sales data, while each workload scales independently. Which architecture best meets the requirement?",
    options: ["Export a separate CSV for each consumer", "Store a Delta table in object storage, govern it with Unity Catalog, and use separate compute", "Keep one permanent all-purpose cluster for every workload", "Replicate the table into each workspace's local storage"],
    explanation: "Separating storage from compute lets workloads share one governed Delta table while each execution surface is sized for its own workload.",
  },
  "associate-bank-002": {
    question: "A pipeline needs a corporate init script and network connectivity that are not available on serverless. Which compute should the engineer evaluate first?",
    options: ["A serverless SQL warehouse", "A Delta Sharing endpoint", "Classic compute configured through a policy", "A Git folder"],
    explanation: "Classic compute offers runtime, initialization, and network controls that may not be available on serverless; a policy keeps the guardrails in place.",
  },
  "associate-bank-003": {
    question: "Hundreds of analysts run short SQL queries from a BI tool, and demand changes throughout the day. Which resource is most appropriate?",
    options: ["A SQL warehouse with auto-stop and scaling", "A personal cluster per analyst", "A pool with no attached clusters", "A Lakeflow Jobs for-each task"],
    explanation: "SQL warehouses are designed for concurrent SQL and BI workloads, with dedicated scaling and automatic stop mechanisms.",
  },
  "associate-bank-004": {
    question: "A reader queries a table while another process commits a Delta batch. Which mechanism prevents the reader from observing a partial write?",
    options: ["The Git history", "Compute auto-stop", "A temporary view", "The snapshot defined by an atomic commit to the transaction log"],
    explanation: "Delta publishes changes through atomic commits; every reader resolves a consistent snapshot of the transaction log.",
  },
  "associate-bank-005": {
    question: "A team compares two configurations for the same job. One costs less per hour but takes twice as long and fails more often. Which metric supports a correct decision?",
    options: ["Number of notebooks in the workspace", "Cost per successful run that meets the SLA", "Maximum number of configured workers", "Price of a single DBU without considering runtime"],
    explanation: "Cost must be normalized by outcome and SLA; the hourly price alone does not capture duration, retries, or cloud infrastructure.",
  },
  "associate-bank-006": {
    question: "An architecture review places the execution of Spark transformations inside the control plane. What correction should be made?",
    options: ["Move execution to the compute plane and keep configuration and orchestration in the control plane", "Move the Delta tables into the browser", "Replace Unity Catalog with a pool", "Run Spark inside the Git repository"],
    explanation: "The compute plane processes data; the control plane provides the platform's UI, APIs, configuration, and coordination.",
  },
  "associate-bank-007": {
    question: "New JSON files land in a Volume every hour. The team wants a SQL statement that remembers which files it has already loaded. Which option fits best?",
    options: ["INSERT OVERWRITE without a filter", "collect and a local write", "COPY INTO a governed table", "VACUUM on the directory"],
    explanation: "COPY INTO keeps a history of processed files and provides simple incremental loading in SQL; it does not deduplicate business entities.",
  },
  "associate-bank-008": {
    question: "An Auto Loader stream receives an unexpected JSON field. The requirement is to keep the payload for review without adding it to the Silver schema yet. Which setting helps?",
    options: ["rescuedDataColumn", "spark.sql.shuffle.partitions", "autoBroadcastJoinThreshold", "RESTORE TABLE"],
    explanation: "The rescued data column preserves fields that do not match the schema so they can be measured and handled later.",
  },
  "associate-bank-009": {
    question: "A bucket holds tens of millions of files and full directory listing has become a bottleneck. Which Auto Loader discovery mode should be evaluated?",
    options: ["A cross join with the target table", "File notification, with the required cloud configuration", "A collect of the file names", "A cluster with a single worker"],
    explanation: "Notifications avoid relying on repeated full listings and scale file discovery, although they require cloud-provider permissions and infrastructure.",
  },
  "associate-bank-010": {
    question: "A managed Lakeflow Connect connector exists for the source SaaS application, and the team wants to minimize infrastructure and maintenance. Which decision is most sound?",
    options: ["Build a custom scraper first", "Export CSV files manually every week", "Use JDBC even though the source does not expose it", "Evaluate the managed connector and confirm its freshness and CDC capabilities"],
    explanation: "A managed connector reduces operational work, but supported objects, regional availability, latency, and incremental semantics must be verified.",
  },
  "associate-bank-011": {
    question: "A sequential JDBC read takes hours, and the source table has a uniformly distributed numeric key. The database allows eight connections. Which change is appropriate?",
    options: ["Configure partitionColumn, bounds, and numPartitions=8", "Increase spark.sql.shuffle.partitions only", "Convert the result to pandas before reading", "Open one connection per row"],
    explanation: "A partitioned JDBC read parallelizes key ranges and numPartitions caps the connections; the bounds split the read but do not filter records.",
  },
  "associate-bank-012": {
    question: "A REST API returns paginated results and enforces rate limits. Which design makes it easy to resume after an error without duplicating data?",
    options: ["Always restart from the first page and append", "Store the token in the code", "Persist a cursor or checkpoint, use backoff, and insert with an idempotent key", "Disable HTTP error codes"],
    explanation: "A durable cursor and an idempotent write make resumption possible; backoff respects the limits without hiding permanent failures.",
  },
  "associate-bank-013": {
    question: "Images and documents must be governed before tabular information is extracted from them. Which Unity Catalog object is suitable for the files?",
    options: ["A task value", "A SQL warehouse", "A temporary view", "A Volume"],
    explanation: "Unity Catalog Volumes govern access to non-tabular files and provide paths that work with data workloads.",
  },
  "associate-bank-014": {
    question: "An Auto Loader query uses an existing checkpoint. The engineer changes the starting options expecting to reread every historical file. What must be taken into account?",
    options: ["The checkpoint keeps progress, and new options do not necessarily rewind the query", "The SQL warehouse will delete the checkpoint", "Unity Catalog will recreate the files", "VACUUM automatically forces a reload"],
    explanation: "The checkpoint is part of the query contract and keeps the processed files and offsets; a backfill must be designed explicitly.",
  },
  "associate-bank-015": {
    question: "Every order must be kept even when some customer_id values do not exist in the dimension. Which join preserves the required semantics?",
    options: ["Inner join", "Left join with orders on the left", "Left semi join", "Cross join"],
    explanation: "A left join keeps every row from the left dataset and produces nulls for dimension rows that are not found.",
  },
  "associate-bank-016": {
    question: "Two DataFrames contain the same columns in a different order. How do you combine them without swapping values by position?",
    options: ["union", "crossJoin", "unionByName", "intersect"],
    explanation: "unionByName aligns columns by name; the classic union combines them by position and does not remove duplicates.",
  },
  "associate-bank-017": {
    question: "Each order contains an items array, and one row per element is needed while keeping order_id. Which pattern is appropriate?",
    options: ["Select order_id and explode_outer(items), then project the struct fields", "Apply count to the array", "Convert the whole table to pandas", "Use dropDuplicates on every column"],
    explanation: "explode_outer increases cardinality to one row per element and keeps the parent when the array is null or empty; order_id preserves the context.",
  },
  "associate-bank-018": {
    question: "Several versions of an order arrive, and the most recent one must be kept, breaking ties with ingest_id. Which solution is deterministic?",
    options: ["distinct without ordering", "groupBy on every column", "dropDuplicates(['order_id'])", "row_number over a window ordered by event_ts and ingest_id descending"],
    explanation: "The window states the priority and the tiebreaker explicitly; operations without an ordering do not guarantee which version survives.",
  },
  "associate-bank-019": {
    question: "A pipeline uses a Python UDF to convert text to lowercase, even though Spark provides lower. Which change is preferable?",
    options: ["Use collect and a local str.lower", "Replace the UDF with the native lower function", "Increase the driver size", "Create another UDF to validate the first one"],
    explanation: "Native functions are visible to Catalyst and avoid the JVM-to-Python serialization that many UDFs incur.",
  },
  "associate-bank-020": {
    question: "An amount column contains some non-numeric values. The batch must continue, but the invalid values have to be measured. Which strategy is appropriate?",
    options: ["Fill all of them with zero", "Drop the column", "Use try_cast and count or quarantine the resulting nulls", "Run VACUUM"],
    explanation: "try_cast converts valid input and returns null for incompatible values; the metric or quarantine keeps the loss from being hidden.",
  },
  "associate-bank-021": {
    question: "After a groupBy, Spark creates thousands of tiny tasks with heavy overhead. Which setting should be reviewed and measured?",
    options: ["spark.sql.shuffle.partitions", "The metastore password", "The catalog name", "The Git TTL"],
    explanation: "spark.sql.shuffle.partitions influences the number of partitions after SQL shuffles; it should be tuned from observed sizes and durations.",
  },
  "associate-bank-022": {
    question: "A Gold aggregation is expensive, is queried hundreds of times a day, and can be refreshed in a managed way. Which object should be evaluated?",
    options: ["A notebook variable", "A temporary view", "A materialized view", "A secret scope"],
    explanation: "A materialized view stores the result and manages its refresh, avoiding recomputation of the whole aggregation on every read.",
  },
  "associate-bank-023": {
    question: "A record violates a repairable rule, but the rest of the batch is valid and must be published. Which treatment preserves traceability?",
    options: ["Ignore the rule", "Send the record to quarantine with a reason and a reference to the batch", "Delete Bronze", "Grant ALL PRIVILEGES"],
    explanation: "Quarantine separates repairable records and keeps evidence without blocking valid data or losing the original.",
  },
  "associate-bank-024": {
    question: "A workflow has independent ingest_eu and ingest_us tasks and a conform task that needs both. Which DAG maximizes correct parallelism?",
    options: ["conform first", "All tasks with no dependencies", "Both ingestions in parallel and conform depending on both", "A chain ingest_eu → ingest_us → conform"],
    explanation: "The ingestions can run at the same time; conform must wait for both dependencies.",
  },
  "associate-bank-025": {
    question: "A validate task produces the scalar invalid_ratio, which a downstream condition must compare. How should it be shared?",
    options: ["Publish it with taskValues and reference it from the condition task", "Serialize the whole DataFrame into a widget", "Store the value in the cluster name", "Use Delta Sharing"],
    explanation: "Task values are designed for small values passed between tasks; full datasets should be persisted in tables or files.",
  },
  "associate-bank-026": {
    question: "A task that appends without a key may run again after a timeout. What must be fixed before enabling automatic retries?",
    options: ["Increase the number of dashboards", "Make the write idempotent through a key, a replaceable partition, or MERGE", "Remove the timeout", "Rename the task"],
    explanation: "A retry can repeat side effects; the task must produce the same logical state for the same input.",
  },
  "associate-bank-027": {
    question: "A job must publish if valid_ratio ≥ 0.99 and run quarantine otherwise. Which component best models the decision?",
    options: ["A for-each task over every row", "An additional SQL warehouse", "An If/else task based on the value from validate", "A pool"],
    explanation: "If/else expresses a control branch based on a parameter or task value; for-each handles iteration over collections.",
  },
  "associate-bank-028": {
    question: "Files arrive at unpredictable times, and the team wants to avoid empty runs every five minutes. Which trigger should be chosen?",
    options: ["A more frequent cron schedule", "A file arrival trigger on the governed location", "A 24-hour auto-stop", "A periodic repair run"],
    explanation: "An arrival-driven trigger starts the job when new input exists and reduces polling and runs with no work to do.",
  },
  "associate-bank-029": {
    question: "In a ten-task DAG, only publish fails. The nine earlier tasks finished successfully and are expensive. How do you recover with the least reprocessing?",
    options: ["Delete the job", "Create another workspace", "Restart every task from scratch", "Use a repair run starting from the failed task"],
    explanation: "A repair run keeps successful results and reruns the failed or selected tasks along with their required dependents.",
  },
  "associate-bank-030": {
    question: "A developer wants to debug in VS Code while the Spark operations run on Databricks. Which tool covers this workflow?",
    options: ["Databricks Connect", "Delta Sharing", "COPY INTO", "Predictive optimization"],
    explanation: "Databricks Connect lets you develop from a local IDE and send plans to compatible remote compute.",
  },
  "associate-bank-031": {
    question: "A notebook change must be reviewed before it reaches main. Which sequence reflects a correct Git workflow?",
    options: ["Edit main and duplicate the notebook", "Create a branch, commit, push, and open a pull request", "Export the table to Git", "Store a token in the notebook"],
    explanation: "Branches isolate the change and the pull request provides review; Git folders sync the code with the Git provider.",
  },
  "associate-bank-032": {
    question: "Before deploying a Declarative Automation Bundle to test, the team wants to resolve variables and check its schema. Which command should be used?",
    options: ["databricks fs rm", "databricks bundle run", "databricks bundle validate -t test", "RESTORE TABLE"],
    explanation: "bundle validate checks and resolves the target configuration; deploy applies the resources and run executes them.",
  },
  "associate-bank-033": {
    question: "Dev, test, and prod must use the same code but different catalogs. How should this be modeled in a bundle?",
    options: ["Three copies of the repository", "A different notebook per workspace", "Production IDs hardcoded in Python", "A catalog variable overridden by each target"],
    explanation: "Targets and variables separate configuration from the artifact, so the same validated code can be promoted.",
  },
  "associate-bank-034": {
    question: "A production job deployed by CI must not depend on a developer's personal account. Which configuration is preferable?",
    options: ["run_as with a least-privilege service principal", "A personal PAT inside databricks.yml", "ALL PRIVILEGES for everyone", "Always run from the interactive notebook"],
    explanation: "A stable service identity separates deployment from execution and avoids failures when team membership changes.",
  },
  "associate-bank-035": {
    question: "In the Spark UI, 199 tasks take 20 seconds and one takes 14 minutes while processing far more bytes. What is the strongest initial hypothesis?",
    options: ["USE SCHEMA is missing", "Data skew in the slow partition", "Auto-stop is set too low", "A Git error"],
    explanation: "A long tail with an extreme distribution inside the same stage points to a skewed key or partition.",
  },
  "associate-bank-036": {
    question: "Many tasks show spill to disk during a sort, and all of them process large partitions. Which investigation is most relevant?",
    options: ["Review partition size, execution memory, and shuffle volume", "Grant SELECT to the driver", "Change the catalog", "Delete the transaction log"],
    explanation: "Spill indicates that execution data structures do not fit in memory; it must be correlated with partitions, operators, and configuration.",
  },
  "associate-bank-037": {
    question: "A cluster never reaches the RUNNING state, so no Spark job exists. Where should the diagnosis start?",
    options: ["In Query Profile", "In DESCRIBE HISTORY", "In compute events, policy, quota, and network configuration", "In a window function"],
    explanation: "If Spark never started, the provisioning and configuration events provide the relevant evidence.",
  },
  "associate-bank-038": {
    question: "A notebook fails with ModuleNotFoundError only in production. What should be compared first?",
    options: ["The dashboard color", "Versions and sources of the installed dependencies in both environments", "The number of catalogs", "The VACUUM retention"],
    explanation: "The error points to a missing or incompatible dependency; comparing artifact, environment, and logs is more direct than adding compute.",
  },
  "associate-bank-039": {
    question: "The team wants to know whether a job's duration has gradually worsened over a month. Which source is most suitable?",
    options: ["A screenshot of the last run", "The checkpoint contents", "The repository README", "Run history or system.lakeflow.job_run_timeline"],
    explanation: "Run history makes it possible to compare durations and states against a baseline over time.",
  },
  "associate-bank-040": {
    question: "A large managed table has changing filter patterns and needs a flexible layout and automated maintenance. Which capabilities should be evaluated?",
    options: ["Liquid clustering and predictive optimization", "More widgets", "A cross join", "One PAT per reader"],
    explanation: "Liquid clustering adapts the layout keys, and predictive optimization can maintain eligible managed tables based on observed benefit.",
  },
  "associate-bank-041": {
    question: "The analysts group has SELECT on main.gold.sales but gets an error when resolving the object. Which privileges must be checked on the parent objects?",
    options: ["MODIFY and OWN", "CREATE TABLE and MANAGE", "USE CATALOG on main and USE SCHEMA on main.gold", "EXECUTE on the SQL warehouse"],
    explanation: "SELECT authorizes reading, but the principal also needs to traverse the catalog and schema through USE privileges.",
  },
  "associate-bank-042": {
    question: "The organization wants every column tagged as PII to receive a central mask, even in new tables. Which mechanism scales best?",
    options: ["An ABAC policy based on governed tags", "An individual grant per column", "One cluster per user", "Copy the table without PII every night"],
    explanation: "ABAC applies mask or filter policies to objects that match governed attributes, reducing per-table configuration.",
  },
  "associate-bank-043": {
    question: "An external Delta table must become managed without losing its name, history, permissions, or views. Which operation provides that continuity?",
    options: ["DROP and CREATE on another path", "CREATE TABLE AS SELECT", "ALTER TABLE … SET MANAGED", "VACUUM followed by CLONE"],
    explanation: "SET MANAGED converts an eligible external Delta table while keeping its identity and history; runtime, readers, features, and streams must be validated first.",
  },
  "associate-bank-044": {
    question: "Security is investigating who changed permissions; engineering wants to know which table feeds a dashboard. Which signals correspond to each need, respectively?",
    options: ["Spark UI and checkpoint", "Audit logs and lineage", "Liquid clustering and Photon", "COPY INTO and VACUUM"],
    explanation: "Auditing records actions taken by principals; lineage represents the relationships between objects and transformations.",
  },
  "associate-bank-045": {
    question: "A pipeline needs to read an external S3/ADLS/GCS path without handing cloud credentials to every user. Which Unity Catalog pattern applies?",
    options: ["A storage credential and an external location with minimal permissions", "Keys pasted into widgets", "A token stored inside the table", "ALL PRIVILEGES on the workspace"],
    explanation: "The storage credential encapsulates the cloud identity, and the external location binds that identity to a governed path.",
  },
  "associate-bank-046": {
    question: "A source table is updated at unpredictable times, and the consuming job must start when new data is available without keeping compute running. Which trigger fits best?",
    options: ["A schedule every minute", "A Lakeflow Jobs table update trigger", "A permanent all-purpose cluster", "A while loop inside a notebook"],
    explanation: "The table update trigger starts the job when changes are detected in the monitored tables, avoiding time-based polling or idle compute.",
  },
  "associate-bank-047": {
    question: "The same project must be promoted from dev to prod while changing the catalog, identity, and compute size, but not the tested code. Which design is most appropriate?",
    options: ["Edit the notebook after each deployment", "Keep a branch with different code per environment", "Use the targets, variables, and overrides of a Declarative Automation Bundle", "Store the prod values in comments"],
    explanation: "Targets and overrides reuse the same versioned artifact and apply environment-specific configuration without introducing manual drift into the code.",
  },
  "associate-bank-048": {
    question: "An ABAC policy masks PII columns, but a new analyst cannot query the table. What must be checked besides the policy?",
    options: ["That a base SELECT grant and the required USE privileges exist", "That the analyst owns the metastore", "That the table has ZORDER", "That the SQL warehouse has no auto-stop"],
    explanation: "Mask and filter policies restrict data on top of permissions already granted; they do not replace SELECT or the catalog and schema traversal privileges.",
  },
  "associate-bank-049": {
    question: "A compatible managed connector exists for a high-volume enterprise source, and recurring low latency is required. Which option should be evaluated before ad hoc federation?",
    options: ["Copy CSV files manually", "Managed Lakeflow Connect with a governed destination", "Always query the remote database from each dashboard", "Export the source to a local notebook"],
    explanation: "Managed ingestion targets recurring, high-volume loads; federation is better suited to ad hoc exploration or tests without moving the data.",
  },
  "associate-bank-050": {
    question: "A Spark stage shows a few very long tasks, heavy shuffle read, and spill, while most tasks finish quickly. What is the first hypothesis to validate?",
    options: ["Skew in the partitioning keys", "A missing Git folder", "Excessive USE SCHEMA permissions", "A VACUUM retention that is too long"],
    explanation: "The combination of stragglers, disproportionate shuffle, and spill usually indicates skewed partitions; measure the distribution before changing compute or parameters.",
  },

  "associate-aug-01-01": {
    question: "You need one row per date with the total amount and the number of unique orders. Which aggregations apply?",
    options: ["sum(amount) and count_distinct(order_id)", "sum(order_id) and count(amount)", "avg(amount) and sum(order_id)", "collect_list(amount) and count(customer_id)"],
    explanation: "The metric combines a sum of the amount with a distinct count of the order key.",
  },
  "associate-aug-01-02": {
    question: "A table contains several lines per invoice. How do you calculate revenue and unique invoices per store?",
    options: ["groupBy(invoice_id).agg(sum(store_id), count(net))", "groupBy(store_id).agg(sum(net), count_distinct(invoice_id))", "select(store_id, sum(net), invoice_id)", "groupBy(store_id).agg(count(net), sum(invoice_id))"],
    explanation: "The grouping uses the store dimension and the right metrics for amount and invoice cardinality.",
  },
  "associate-aug-01-03": {
    question: "Which expression returns units sold and unique customers per product?",
    options: ["groupBy(customer_id).agg(sum(product_id), count(quantity))", "groupBy(product_id).agg(avg(quantity), sum(customer_id))", "groupBy(product_id).agg(sum(quantity), count_distinct(customer_id))", "select(product_id, quantity, customer_id).distinct()"],
    explanation: "The grain is the product; units are summed and customers are deduplicated.",
  },
  "associate-aug-01-04": {
    question: "The same ticket appears in several detail rows. To count daily tickets without double counting, you should use:",
    options: ["sum(ticket_id) with no grouping", "count(item_id) after groupBy(ticket_id)", "collect_set(sale_date) as the amount", "count_distinct(ticket_id) after groupBy(sale_date)"],
    explanation: "The ticket key is counted distinctly within each date.",
  },
  "associate-aug-01-05": {
    question: "Which calculation produces the average salary and the number of unique employees per department?",
    options: ["groupBy(department).agg(avg(salary), count_distinct(employee_id))", "groupBy(employee_id).agg(sum(department), count(salary))", "groupBy(department).agg(sum(employee_id), max(salary))", "select(department, salary).distinct()"],
    explanation: "The dimension is the department; salary needs an average and headcount needs a distinct count.",
  },
  "associate-aug-01-06": {
    question: "A DataFrame has repeated events per session. Which summary counts events and unique sessions per day?",
    options: ["groupBy(session_id).agg(count(event_date), sum(event_id))", "groupBy(event_date).agg(count(event_id), count_distinct(session_id))", "groupBy(event_date).agg(sum(session_id), count(event_id))", "dropDuplicates([event_date]) with no aggregation"],
    explanation: "Total events can use count; sessions require count_distinct.",
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
    question: "A user has SELECT on a table but cannot resolve its three-level name. What should be reviewed?",
    options: ["USE CATALOG and USE SCHEMA on the parent objects", "CREATE CATALOG and MANAGE", "MODIFY and DELETE", "CAN MANAGE on the workspace"],
    explanation: "SELECT does not replace the privileges needed to traverse the catalog and schema.",
  },
  "associate-aug-02-04": {
    question: "Which statement removes the ability to modify a table without removing read access that was already granted?",
    options: ["DROP TABLE main.ops.orders", "REVOKE MODIFY ON TABLE main.ops.orders FROM `operators`", "REVOKE USE CATALOG ON CATALOG main FROM `operators`", "DENY SELECT ON TABLE main.ops.orders TO `operators`"],
    explanation: "REVOKE removes the specific privilege and keeps other independent grants.",
  },
  "associate-aug-02-05": {
    question: "A team needs to run a governed function but not edit it. Which privilege applies?",
    options: ["MODIFY on the catalog", "CREATE SCHEMA on the metastore", "EXECUTE on the function", "OWN on the function"],
    explanation: "EXECUTE allows invoking the function without transferring ownership or the ability to modify it.",
  },
  "associate-aug-02-06": {
    question: "To read governed files in a Volume, in addition to traversing the catalog and schema, you need:",
    options: ["SELECT on the SQL warehouse", "MODIFY on every table", "CREATE MANAGED STORAGE on the metastore", "READ VOLUME on the Volume"],
    explanation: "Files in a Volume are authorized with READ VOLUME, not with table SELECT.",
  },
  "associate-aug-03-01": {
    question: "Two Databricks accounts want to share live tables while preserving the identity of both parties. Which mode should be prioritized?",
    options: ["Databricks-to-Databricks sharing", "A CSV sent by email", "An open token for any recipient", "A nightly copy over JDBC"],
    explanation: "Databricks-to-Databricks mode uses account identities and avoids open credentials for the recipient.",
  },
  "associate-aug-03-02": {
    question: "A partner without Databricks needs to query a shared dataset. Which sharing mode fits?",
    options: ["Grant them ownership of the metastore", "Open sharing with a recipient credential and a secure profile", "Add them to the workspace admins group", "Hand over the bucket's cloud credentials"],
    explanation: "Open sharing is designed for recipients outside Databricks without exposing storage credentials.",
  },
  "associate-aug-03-03": {
    question: "What do you add to a share to publish only approved columns with adapted names?",
    options: ["An all-purpose cluster", "A storage credential belonging to the recipient", "A shareable view that projects and renames the columns", "A Structured Streaming checkpoint"],
    explanation: "A view controls the projection without physically duplicating the data product.",
  },
  "associate-aug-03-04": {
    question: "A Delta Sharing recipient needs to modify the provider's table. What should be clarified?",
    options: ["The recipient gets MODIFY automatically", "The recipient inherits ownership of the catalog", "The share turns the table into a Volume", "The protocol provides read access to the shared data; writes are handled on the provider side"],
    explanation: "Delta Sharing distributes read access; it does not delegate writes to the source table.",
  },
  "associate-aug-03-05": {
    question: "Before sharing data across cloud regions, what should be evaluated in particular?",
    options: ["Transfer cost, data residency, and latency", "Number of notebook cells", "Dashboard color", "Alphabetical order of the catalogs"],
    explanation: "Cross-region or cross-cloud access can introduce egress charges, regulatory restrictions, and latency.",
  },
  "associate-aug-03-06": {
    question: "Which object groups the tables and views that the provider wants to expose through Delta Sharing?",
    options: ["A recipient", "A share", "A SQL warehouse", "A job cluster"],
    explanation: "The share represents the set of published assets; the recipient represents whoever consumes them.",
  },
  "associate-aug-04-01": {
    question: "An empty table must be recreated declaratively even if it already exists. Which SQL form applies?",
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
    explanation: "CTAS combines definition and population using the result of the SELECT.",
  },
  "associate-aug-04-04": {
    question: "A nullable column must become NOT NULL after the data has been validated. Which type of operation is used?",
    options: ["VACUUM to rewrite the schema", "ALTER TABLE to modify the column definition", "DESCRIBE HISTORY to apply the change", "OPTIMIZE to add the constraint"],
    explanation: "ALTER TABLE modifies schema metadata; maintenance operations do not declare constraints.",
  },
  "associate-aug-04-05": {
    question: "Which command drops a table only if it exists, making cleanup idempotent?",
    options: ["DELETE TABLE ALWAYS", "TRUNCATE IF MISSING", "DROP TABLE IF EXISTS", "REMOVE TABLE CASCADE FILES"],
    explanation: "IF EXISTS makes the operation repeatable when the object has already been dropped.",
  },
  "associate-aug-04-06": {
    question: "You need to change the logical name of a table without creating a copy of the data. Which statement applies?",
    options: ["CREATE TABLE new_name CLONE old_name", "INSERT INTO new_name SELECT * FROM old_name", "COPY INTO new_name FROM old_name", "ALTER TABLE old_name RENAME TO new_name"],
    explanation: "RENAME updates the catalog reference instead of materializing another table.",
  },
  "associate-aug-05-01": {
    question: "Which SQL form adds a complete row to an existing Delta table?",
    options: ["INSERT INTO target VALUES (...)", "UPDATE VALUES (...) target", "CREATE ROW INTO target", "APPEND TABLE target SET (...)"],
    explanation: "INSERT INTO ... VALUES expresses a row insert in SQL.",
  },
  "associate-aug-05-02": {
    question: "A load brings both new and existing keys. Which operation updates matches and inserts missing rows?",
    options: ["VACUUM with RETAIN 0 HOURS", "MERGE INTO with WHEN MATCHED and WHEN NOT MATCHED", "DESCRIBE DETAIL", "GRANT MODIFY"],
    explanation: "MERGE models an atomic upsert based on the match condition.",
  },
  "associate-aug-05-03": {
    question: "The rating must be corrected only for id='a1'. Which DML statement applies?",
    options: ["INSERT target WHERE id='a1'", "ALTER COLUMN rating=9.4", "UPDATE target SET rating=9.4 WHERE id='a1'", "OPTIMIZE target WHERE id='a1'"],
    explanation: "UPDATE modifies existing rows selected by a predicate.",
  },
  "associate-aug-05-04": {
    question: "Which statement removes expired rows from a Delta table?",
    options: ["DROP TABLE target WHERE expires_at", "VACUUM target WHERE expires_at", "REVOKE SELECT WHERE expires_at", "DELETE FROM target WHERE expires_at < current_date()"],
    explanation: "DELETE is the DML operation that removes rows matching a condition.",
  },
  "associate-aug-05-05": {
    question: "To append the result of a query while respecting the column order, you use:",
    options: ["INSERT INTO target SELECT ...", "ALTER TABLE target AS SELECT", "UPDATE target CREATE SELECT", "COPY TABLE target VALUES SELECT"],
    explanation: "INSERT INTO can directly consume the rows produced by SELECT.",
  },
  "associate-aug-05-06": {
    question: "A retryable ingestion must avoid inserting a key that has already been processed. Which pattern is most robust?",
    options: ["INSERT INTO without a condition on every retry", "MERGE with a stable key and a match condition", "collect before writing", "Rename the table on every run"],
    explanation: "A stable key lets the retry update or ignore the match instead of duplicating it.",
  },
};

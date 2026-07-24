import type { NotebookGuideReference } from "./types";

const REVIEWED_AT = "23 jul 2026";

export const notebookGuideReferences = [
  { id: "dbx-notebooks", title: "Databricks notebooks", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/notebooks/", reviewedAt: REVIEWED_AT },
  { id: "dbx-libraries", title: "Notebook-scoped Python libraries", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/libraries/notebooks-python-libraries", reviewedAt: REVIEWED_AT },
  { id: "dbx-widgets", title: "Databricks widgets", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/notebooks/widgets", reviewedAt: REVIEWED_AT },
  { id: "dbx-secrets", title: "Secret management", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/security/secrets/", reviewedAt: REVIEWED_AT },
  { id: "dbx-medallion", title: "Medallion architecture", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/lakehouse/medallion", reviewedAt: REVIEWED_AT },
  { id: "dbx-photon", title: "What is Photon?", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/compute/photon", reviewedAt: REVIEWED_AT },
  { id: "dbx-unity-catalog", title: "What is Unity Catalog?", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/", reviewedAt: REVIEWED_AT },
  { id: "dbx-lineage", title: "Capture and view data lineage", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/data-lineage", reviewedAt: REVIEWED_AT },
  { id: "dbx-system-billing", title: "Billing system table reference", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/admin/system-tables/billing", reviewedAt: REVIEWED_AT },
  { id: "dbx-structured-streaming", title: "Structured Streaming on Databricks", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/structured-streaming/", reviewedAt: REVIEWED_AT },
  { id: "dbx-files", title: "Work with files on Databricks", publisher: "Databricks", href: "https://docs.databricks.com/aws/en/files/", reviewedAt: REVIEWED_AT },
  { id: "delta-quickstart", title: "Delta Lake quick start", publisher: "Delta Lake", href: "https://docs.delta.io/latest/quick-start.html", reviewedAt: REVIEWED_AT },
  { id: "delta-table", title: "DeltaTable utility API", publisher: "Delta Lake", href: "https://docs.delta.io/api/latest/python/spark/", reviewedAt: REVIEWED_AT },
  { id: "delta-cdf", title: "Use Delta Lake change data feed", publisher: "Delta Lake", href: "https://docs.delta.io/latest/delta-change-data-feed.html", reviewedAt: REVIEWED_AT },
  { id: "delta-optimize", title: "Optimizations", publisher: "Delta Lake", href: "https://docs.delta.io/latest/optimizations-oss.html", reviewedAt: REVIEWED_AT },
  { id: "spark-dataframe", title: "DataFrame API", publisher: "Apache Spark", href: "https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/dataframe.html", reviewedAt: REVIEWED_AT },
  { id: "spark-sql", title: "Spark SQL reference", publisher: "Apache Spark", href: "https://spark.apache.org/docs/latest/sql-ref.html", reviewedAt: REVIEWED_AT },
  { id: "spark-streaming", title: "Structured Streaming programming guide", publisher: "Apache Spark", href: "https://spark.apache.org/docs/latest/streaming/index.html", reviewedAt: REVIEWED_AT },
  { id: "azure-adls", title: "Connect to Azure Data Lake Storage", publisher: "Microsoft", href: "https://learn.microsoft.com/azure/databricks/connect/storage/azure-storage", reviewedAt: REVIEWED_AT },
  { id: "azure-event-hubs", title: "Use Azure Event Hubs with Apache Spark", publisher: "Microsoft", href: "https://learn.microsoft.com/azure/event-hubs/event-hubs-kafka-spark-tutorial", reviewedAt: REVIEWED_AT },
  { id: "azure-purview", title: "Classifications in Microsoft Purview Data Map", publisher: "Microsoft", href: "https://learn.microsoft.com/purview/data-map-classifications", reviewedAt: REVIEWED_AT },
  { id: "cockroach-changefeed", title: "Change data capture overview", publisher: "Cockroach Labs", href: "https://www.cockroachlabs.com/docs/stable/change-data-capture-overview", reviewedAt: REVIEWED_AT },
  { id: "unity-oss", title: "Unity Catalog OSS quickstart", publisher: "Unity Catalog", href: "https://docs.unitycatalog.io/quickstart/", reviewedAt: REVIEWED_AT },
] as const satisfies readonly NotebookGuideReference[];

export type NotebookGuideReferenceId = (typeof notebookGuideReferences)[number]["id"];

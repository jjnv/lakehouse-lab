export type CommunityRepository = {
  id: string;
  name: string;
  url: string;
  author: string;
  provenance: "official" | "community";
  license: string;
  licenseStatus: "verified" | "unknown" | "restricted";
  reviewedAt: string;
};

export type CommunityArtifact = {
  id: string;
  repositoryId: string;
  title: string;
  href?: string;
  summary: string;
  format: "ipynb" | "databricks-source" | "dbc" | "bundle" | "repository" | "project";
  languages: string[];
  clouds: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  runtimeNotes: string;
  freeEdition: "supported" | "partial" | "unsupported" | "unknown";
  importMode: "ipynb" | "databricks-source" | "dbc" | "bundle" | "repository";
  preview?: {
    kind: "ipynb" | "databricks-source";
    rawUrl: string;
    path: string;
    upstreamRef: string;
  };
};

type Coverage = "direct" | "partial" | "equivalent";
type ModuleRecommendationSeed = string | readonly [artifactId: string, coverage: Coverage];

const REVIEWED_AT = "23 jul 2026";
const DELTA_REF = "82ed21472bcd9801f0919b98a5afe9f40b3fcd74";
const LEARN_REF = "08c378cf95c0c1f16b9a7db25b6c7a01a643dd72";
const STARTUP_REF = "ba6c71ba1efa12faf27746b2302c60cf26b66d20";
const BEST_PRACTICES_REF = "b4f55c13dc76f34c1861b25221b8ac6bb17956d8";
const YOKAWASA_REF = "51e8e4b19a947cbb83f4780fbab513b0f3b176f4";
const AZURE_DEMOS_REF = "2fcc3dbaf53bcfc691b9f598887d7c09db5b3512";
const COST_REF = "8e4bf7ca6508d4cdc20e8b01463896c903ef427d";

export const communityRepositories: CommunityRepository[] = [
  { id: "learn", name: "Learn Databricks", url: "https://github.com/jaceklaskowski/learn-databricks", author: "Jacek Laskowski", provenance: "community", license: "Apache-2.0", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "startup", name: "Startup ERP Data Lakehouse", url: "https://github.com/Caliu-Data/databricks-startups-metrics", author: "Caliu-Data", provenance: "community", license: "Apache-2.0", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "free-pipelines", name: "Databricks Free Declarative Pipelines", url: "https://github.com/andkret/Databricks-Free-Declarative-Pipelines", author: "andkret", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "azure-hands-on", name: "Azure Databricks Hands-on", url: "https://github.com/tsmatsuz/azure-databricks-exercise", author: "Tsuyoshi Matsuzaki", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "sql-start-stop", name: "databricks-sql-start-stop", url: "https://github.com/guanjieshen/databricks-sql-start-stop", author: "guanjieshen", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "best-practices", name: "notebook-best-practices", url: "https://github.com/databricks/notebook-best-practices", author: "Databricks", provenance: "official", license: "Apache-2.0", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "jump-start", name: "Databricks Jump Start Sample Notebooks", url: "https://github.com/dennyglee/databricks", author: "Denny Lee", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "databricks-examples", name: "databricks-examples", url: "https://github.com/data-engineering-helpers/databricks-examples", author: "data-engineering-helpers", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "delta-examples", name: "Delta Lake examples", url: "https://github.com/delta-io/delta-examples", author: "Delta Lake", provenance: "official", license: "Apache-2.0", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "dlt-notebooks", name: "Lakeflow Declarative Pipelines examples", url: "https://github.com/databricks/delta-live-tables-notebooks", author: "Databricks", provenance: "official", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "yokawasa", name: "databricks-notebooks", url: "https://github.com/yokawasa/databricks-notebooks", author: "yokawasa", provenance: "community", license: "MIT", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "azure-demos", name: "Azure Databricks Integration Demos", url: "https://github.com/mjtpena/azure-databricks-demos", author: "Michael John Peña", provenance: "community", license: "MIT", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "crdb", name: "crdb_to_dbx", url: "https://github.com/rsleedbx/crdb_to_dbx", author: "rsleedbx", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "bundles", name: "bundle-examples", url: "https://github.com/databricks/bundle-examples", author: "Databricks", provenance: "official", license: "Databricks License", licenseStatus: "restricted", reviewedAt: REVIEWED_AT },
  { id: "lakeflow-demo", name: "lakeflow_declarative_pipelines_demo", url: "https://github.com/MikolajSedek/lakeflow_declarative_pipelines_demo", author: "Mikołaj Sędek", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "sales-pipeline", name: "Sales Data Declarative Pipeline", url: "https://github.com/meetzaveri29/databricks-declarative-pipeline", author: "meetzaveri29", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "finops", name: "databricks-finops-system-tables", url: "https://github.com/drcaiomoreno/databricks-finops-system-tables", author: "Caio Moreno", provenance: "community", license: "MIT", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "cost", name: "Databricks shared clusters cost calculator", url: "https://github.com/mwojtyczka/databricks-shared-clusters-cost-calculator", author: "mwojtyczka", provenance: "community", license: "MIT", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
  { id: "lighthouse", name: "lighthouse", url: "https://github.com/Databeans/lighthouse", author: "DataBeans", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "bundles-tutorial", name: "Databricks Asset Bundles tutorial", url: "https://github.com/Dateonic/Databricks-Asset-Bundles-tutorial", author: "Dateonic", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "purview", name: "Unity Catalog + Purview samples", url: "https://github.com/davegeyer/unity-catalog-purview-integration-samples", author: "Dave Geyer", provenance: "community", license: "No indicada", licenseStatus: "unknown", reviewedAt: REVIEWED_AT },
  { id: "unity-oss", name: "Unity Catalog OSS", url: "https://github.com/unitycatalog/unitycatalog", author: "Unity Catalog", provenance: "official", license: "Apache-2.0", licenseStatus: "verified", reviewedAt: REVIEWED_AT },
];

const artifact = (value: CommunityArtifact) => value;
const raw = (repository: string, ref: string, path: string) => `https://raw.githubusercontent.com/${repository}/${ref}/${path.split("/").map(encodeURIComponent).join("/")}`;

export const communityArtifacts: CommunityArtifact[] = [
  artifact({ id: "learn", repositoryId: "learn", title: "Learn Databricks", summary: "Referencia transversal sobre Spark, Delta Lake, Lakeflow, Unity Catalog, Workflows y Bundles.", format: "repository", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Contenido vivo; valida cada ejemplo con un runtime reciente.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "learn-photon", repositoryId: "learn", title: "Photon.py", href: "https://github.com/jaceklaskowski/learn-databricks/blob/main/Photon.py", summary: "Notebook de lectura con referencias técnicas para entender Photon y la ejecución vectorizada.", format: "databricks-source", languages: ["Python", "Markdown"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Notebook de referencia; no requiere ejecutar todas sus celdas.", freeEdition: "partial", importMode: "databricks-source", preview: { kind: "databricks-source", rawUrl: raw("jaceklaskowski/learn-databricks", LEARN_REF, "Photon.py"), path: "Photon.py", upstreamRef: LEARN_REF } }),
  artifact({ id: "startup-erp", repositoryId: "startup", title: "Startup ERP Data Lakehouse", summary: "Proyecto Bronze/Silver/Gold con datos sintéticos, KPIs y controles de privacidad y cumplimiento.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Unity Catalog y declara DBR 13.0+.", freeEdition: "partial", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("Caliu-Data/databricks-startups-metrics", STARTUP_REF, "notebooks/01_bronze_generate_startup_erp_data.py"), path: "notebooks/01_bronze_generate_startup_erp_data.py", upstreamRef: STARTUP_REF } }),
  artifact({ id: "free-pipelines", repositoryId: "free-pipelines", title: "Databricks Free Declarative Pipelines", summary: "Curso práctico de arquitectura medallion y pipelines declarativos con datos de comercio electrónico.", format: "project", languages: ["SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Diseñado para Databricks Free Edition y Lakeflow Designer.", freeEdition: "supported", importMode: "repository" }),
  artifact({ id: "azure-hands-on", repositoryId: "azure-hands-on", title: "Azure Databricks Hands-on", summary: "Ruta lineal de ejercicios PySpark, SQL, streaming y orquestación distribuida como archivo DBC.", format: "dbc", languages: ["Python", "SQL"], clouds: ["Azure"], difficulty: "beginner", runtimeNotes: "Importa HandsOn.dbc en un workspace de Azure Databricks.", freeEdition: "partial", importMode: "dbc" }),
  artifact({ id: "azure-streaming", repositoryId: "azure-hands-on", title: "Structured Streaming with Event Hubs or Kafka", summary: "Ejercicios guiados para conectar Structured Streaming con Event Hubs o Kafka.", format: "dbc", languages: ["Python"], clouds: ["Azure"], difficulty: "intermediate", runtimeNotes: "Necesita el servicio de eventos y credenciales de Azure.", freeEdition: "unsupported", importMode: "dbc" }),
  artifact({ id: "sql-start-stop", repositoryId: "sql-start-stop", title: "databricks-sql-start-stop", summary: "Automatiza arranque, parada y configuración de SQL Warehouses mediante Workflows.", format: "project", languages: ["Python"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "El principal del job necesita permisos sobre el warehouse.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "best-practices", repositoryId: "best-practices", title: "notebook-best-practices", summary: "Transforma un notebook exploratorio en código modular, probado, programable y apto para CI/CD.", format: "project", languages: ["Python"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Ejemplo oficial basado en Python y notebooks Databricks.", freeEdition: "partial", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("databricks/notebook-best-practices", BEST_PRACTICES_REF, "notebooks/covid_eda_modular.py"), path: "notebooks/covid_eda_modular.py", upstreamRef: BEST_PRACTICES_REF } }),
  artifact({ id: "jump-start", repositoryId: "jump-start", title: "Databricks Jump Start Sample Notebooks", summary: "Colección veterana de ejemplos en Python, Scala, SQL y R para explorar cargas Spark.", format: "repository", languages: ["Python", "Scala", "SQL", "R"], clouds: ["Multinube"], difficulty: "beginner", runtimeNotes: "El autor indica que la mayoría de ejemplos funcionaban en Community Edition.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "jump-flight", repositoryId: "jump-start", title: "On-Time Flight Performance", href: "https://github.com/dennyglee/databricks/tree/master/notebooks/Users/denny%40databricks.com/flights", summary: "Workload de vuelos útil para estudiar planes, particionado, grafos y comportamiento de Spark.", format: "repository", languages: ["Python"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Ejemplo histórico: revisa APIs y runtime antes de ejecutarlo.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "jump-streaming", repositoryId: "jump-start", title: "Streaming Meetup RSVPs", href: "https://github.com/dennyglee/databricks/tree/master/notebooks/Users/denny%40databricks.com/content/Streaming%20Meetup%20RSVPs", summary: "Secuencia de notebooks Scala sobre DataFrames, streaming y agregaciones con estado.", format: "repository", languages: ["Scala"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Material histórico; úsalo para conceptos, no como receta de runtime actual.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "databricks-examples", repositoryId: "databricks-examples", title: "databricks-examples", summary: "Ejemplos y anti-patrones comunitarios para discutir diseño y rendimiento de Spark.", format: "repository", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Selecciona ejemplos concretos y valida sus dependencias.", freeEdition: "unknown", importMode: "repository" }),
  artifact({ id: "delta-quickstart", repositoryId: "delta-examples", title: "01_quickstart.ipynb", href: "https://github.com/delta-io/delta-examples/blob/master/notebooks/pyspark/01_quickstart.ipynb", summary: "Quickstart oficial para leer y escribir tablas Delta con PySpark.", format: "ipynb", languages: ["Python"], clouds: ["Multinube"], difficulty: "beginner", runtimeNotes: "Ejecutable con PySpark y Delta Lake; adaptable a Databricks.", freeEdition: "supported", importMode: "ipynb", preview: { kind: "ipynb", rawUrl: raw("delta-io/delta-examples", DELTA_REF, "notebooks/pyspark/01_quickstart.ipynb"), path: "notebooks/pyspark/01_quickstart.ipynb", upstreamRef: DELTA_REF } }),
  artifact({ id: "delta-create-table", repositoryId: "delta-examples", title: "create-table-delta-lake.ipynb", href: "https://github.com/delta-io/delta-examples/blob/master/notebooks/pyspark/create-table-delta-lake.ipynb", summary: "Ejemplo oficial de creación y manejo de tablas Delta.", format: "ipynb", languages: ["Python"], clouds: ["Multinube"], difficulty: "beginner", runtimeNotes: "Ejecutable con PySpark y Delta Lake.", freeEdition: "supported", importMode: "ipynb", preview: { kind: "ipynb", rawUrl: raw("delta-io/delta-examples", DELTA_REF, "notebooks/pyspark/create-table-delta-lake.ipynb"), path: "notebooks/pyspark/create-table-delta-lake.ipynb", upstreamRef: DELTA_REF } }),
  artifact({ id: "delta-cdf", repositoryId: "delta-examples", title: "change-data-feed.ipynb", href: "https://github.com/delta-io/delta-examples/blob/master/notebooks/pyspark/change-data-feed.ipynb", summary: "Notebook oficial dedicado a Change Data Feed, historial y consumo de cambios.", format: "ipynb", languages: ["Python"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Necesita una versión de Delta compatible con Change Data Feed.", freeEdition: "supported", importMode: "ipynb", preview: { kind: "ipynb", rawUrl: raw("delta-io/delta-examples", DELTA_REF, "notebooks/pyspark/change-data-feed.ipynb"), path: "notebooks/pyspark/change-data-feed.ipynb", upstreamRef: DELTA_REF } }),
  artifact({ id: "delta-examples", repositoryId: "delta-examples", title: "delta-examples", summary: "Colección oficial de ejemplos OSS para operaciones, tablas y patrones Delta Lake.", format: "repository", languages: ["Python", "Scala"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Adapta la configuración OSS al runtime Databricks usado.", freeEdition: "supported", importMode: "repository" }),
  artifact({ id: "dlt-notebooks", repositoryId: "dlt-notebooks", title: "Lakeflow Declarative Pipelines examples", summary: "Repositorio oficial de demos de pipelines declarativos, calidad, streaming y CDC.", format: "repository", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Crea un pipeline y referencia la carpeta correspondiente como librería.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "dlt-kimball", repositoryId: "dlt-notebooks", title: "kimball_modelling_demo", href: "https://github.com/databricks/delta-live-tables-notebooks/tree/main/kimball_modelling_demo", summary: "Demo oficial de modelado dimensional tipo Kimball sobre pipelines declarativos.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Lakeflow Declarative Pipelines.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "dlt-state", repositoryId: "dlt-notebooks", title: "applyInPandasWithState integral calculus", href: "https://github.com/databricks/delta-live-tables-notebooks/tree/main/applyInPandasWithState-integral-calculus", summary: "Demo oficial de procesamiento con estado y watermarks mediante applyInPandasWithState.", format: "project", languages: ["Python"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Requiere APIs modernas de estado y un pipeline compatible.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "dlt-cdc", repositoryId: "dlt-notebooks", title: "change-data-capture-example", href: "https://github.com/databricks/delta-live-tables-notebooks/tree/main/change-data-capture-example", summary: "Ejemplo oficial de CDC con generador, pipeline Python/SQL y monitorización.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Lakeflow Declarative Pipelines.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "dlt-kafka", repositoryId: "dlt-notebooks", title: "kafka-dlt-streaminganalytics", href: "https://github.com/databricks/delta-live-tables-notebooks/tree/main/kafka-dlt-streaminganalytics", summary: "Pipeline oficial de analítica streaming con Kafka, generador de eventos y SQL.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Necesita acceso a Kafka y Lakeflow Declarative Pipelines.", freeEdition: "unsupported", importMode: "repository" }),
  artifact({ id: "yokawasa-notebooks", repositoryId: "yokawasa", title: "File operations and ELT notebooks", href: "https://github.com/yokawasa/databricks-notebooks/tree/master/notebooks", summary: "Notebooks claros de operaciones de archivos y ELT con servicios de datos de Azure.", format: "ipynb", languages: ["Python"], clouds: ["Azure"], difficulty: "beginner", runtimeNotes: "Algunos ejemplos necesitan cuentas de almacenamiento o servicios Azure.", freeEdition: "partial", importMode: "ipynb", preview: { kind: "ipynb", rawUrl: raw("yokawasa/databricks-notebooks", YOKAWASA_REF, "notebooks/file-operations-python.ipynb"), path: "notebooks/file-operations-python.ipynb", upstreamRef: YOKAWASA_REF } }),
  artifact({ id: "yokawasa-eventhub", repositoryId: "yokawasa", title: "Streaming Sample: Azure Event Hub", href: "https://github.com/yokawasa/databricks-notebooks/blob/master/notebooks/tweet-streaming-eventhub-python.ipynb", summary: "Notebook de streaming que conecta Azure Event Hubs con procesamiento en Databricks.", format: "ipynb", languages: ["Python"], clouds: ["Azure"], difficulty: "intermediate", runtimeNotes: "Necesita un Event Hub y secretos de conexión.", freeEdition: "unsupported", importMode: "ipynb", preview: { kind: "ipynb", rawUrl: raw("yokawasa/databricks-notebooks", YOKAWASA_REF, "notebooks/tweet-streaming-eventhub-python.ipynb"), path: "notebooks/tweet-streaming-eventhub-python.ipynb", upstreamRef: YOKAWASA_REF } }),
  artifact({ id: "azure-ingestion", repositoryId: "azure-demos", title: "Azure integration · ingesta y medallion", href: "https://github.com/mjtpena/azure-databricks-demos/tree/master/01-adls-gen2-integration", summary: "Demos de ADLS Gen2, Cosmos DB y patrones de ingesta y arquitectura medallion.", format: "project", languages: ["Python"], clouds: ["Azure"], difficulty: "intermediate", runtimeNotes: "Necesita recursos Azure y secretos configurados.", freeEdition: "unsupported", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("mjtpena/azure-databricks-demos", AZURE_DEMOS_REF, "01-adls-gen2-integration/notebooks/03-medallion-architecture.py"), path: "01-adls-gen2-integration/notebooks/03-medallion-architecture.py", upstreamRef: AZURE_DEMOS_REF } }),
  artifact({ id: "azure-governance", repositoryId: "azure-demos", title: "Azure integration · Unity Catalog y Purview", href: "https://github.com/mjtpena/azure-databricks-demos/tree/master/09-unity-catalog-purview", summary: "Demos de Unity Catalog, Purview, secretos y clasificación para gobierno corporativo en Azure.", format: "project", languages: ["Python"], clouds: ["Azure"], difficulty: "advanced", runtimeNotes: "Necesita Unity Catalog, Purview y permisos Azure.", freeEdition: "unsupported", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("mjtpena/azure-databricks-demos", AZURE_DEMOS_REF, "09-unity-catalog-purview/notebooks/03-lineage-and-classification.py"), path: "09-unity-catalog-purview/notebooks/03-lineage-and-classification.py", upstreamRef: AZURE_DEMOS_REF } }),
  artifact({ id: "azure-federation", repositoryId: "azure-demos", title: "Unity Catalog · Fabric mirror", href: "https://github.com/mjtpena/azure-databricks-demos/tree/master/06-unity-catalog-fabric-mirror", summary: "Patrón equivalente de interoperabilidad y mirroring entre Unity Catalog y Microsoft Fabric.", format: "project", languages: ["Python"], clouds: ["Azure"], difficulty: "advanced", runtimeNotes: "Es un equivalente práctico, no un laboratorio directo de OpenSharing.", freeEdition: "unsupported", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("mjtpena/azure-databricks-demos", AZURE_DEMOS_REF, "06-unity-catalog-fabric-mirror/notebooks/01-prepare-unity-catalog-tables.py"), path: "06-unity-catalog-fabric-mirror/notebooks/01-prepare-unity-catalog-tables.py", upstreamRef: AZURE_DEMOS_REF } }),
  artifact({ id: "crdb", repositoryId: "crdb", title: "crdb_to_dbx", summary: "Proyecto de ingestión y CDC desde CockroachDB hacia Databricks.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Necesita una fuente CockroachDB y conectividad configurada.", freeEdition: "unsupported", importMode: "repository" }),
  artifact({ id: "bundles", repositoryId: "bundles", title: "bundle-examples", summary: "Ejemplos oficiales de Declarative Automation Bundles para Python, SQL, Jobs y Lakeflow.", format: "bundle", languages: ["Python", "SQL", "YAML"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Databricks CLI y autenticación del workspace.", freeEdition: "partial", importMode: "bundle" }),
  artifact({ id: "lakeflow-demo", repositoryId: "lakeflow-demo", title: "lakeflow_declarative_pipelines_demo", summary: "Proyecto estructurado con SCD2, pruebas y despliegue mediante Bundles.", format: "bundle", languages: ["Python", "SQL", "YAML"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Pensado para Free Edition con Databricks CLI y Bundles.", freeEdition: "supported", importMode: "bundle" }),
  artifact({ id: "sales-pipeline", repositoryId: "sales-pipeline", title: "Sales Data Declarative Pipeline", summary: "Pipeline declarativo de ventas para practicar expectations, transformación y capas medallion.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Lakeflow Declarative Pipelines.", freeEdition: "partial", importMode: "repository" }),
  artifact({ id: "finops", repositoryId: "finops", title: "databricks-finops-system-tables", summary: "Consultas y referencias para gasto, uso, auditoría y observabilidad mediante system tables.", format: "repository", languages: ["SQL"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Necesita system tables habilitadas; el repositorio actúa como guía de consultas.", freeEdition: "unsupported", importMode: "repository" }),
  artifact({ id: "cost", repositoryId: "cost", title: "Granular Cost Calculator", summary: "Proyecto para asignar coste de compute compartido y SQL Warehouses por usuario o unidad.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Necesita datos de uso y permisos sobre system tables.", freeEdition: "unsupported", importMode: "repository", preview: { kind: "databricks-source", rawUrl: raw("mwojtyczka/databricks-shared-clusters-cost-calculator", COST_REF, "lake_view/demo_setup.py"), path: "lake_view/demo_setup.py", upstreamRef: COST_REF } }),
  artifact({ id: "lighthouse", repositoryId: "lighthouse", title: "lighthouse", summary: "Herramienta para observar salud del layout, clustering, mantenimiento y coste del lakehouse.", format: "project", languages: ["Python", "SQL"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Valida compatibilidad con las tablas y runtime de destino.", freeEdition: "unknown", importMode: "repository" }),
  artifact({ id: "bundles-tutorial", repositoryId: "bundles-tutorial", title: "Databricks Asset Bundles tutorial", summary: "Tutorial comunitario sobre estructura y ejecución de notebooks Python y SQL dentro de Bundles.", format: "bundle", languages: ["Python", "SQL", "YAML"], clouds: ["Multinube"], difficulty: "intermediate", runtimeNotes: "Requiere Databricks CLI y un workspace configurado.", freeEdition: "partial", importMode: "bundle" }),
  artifact({ id: "purview", repositoryId: "purview", title: "unity-catalog-purview-integration-samples", summary: "Ejemplos especializados de catalogación, metadatos y lineage entre Unity Catalog y Purview.", format: "project", languages: ["Python"], clouds: ["Azure"], difficulty: "advanced", runtimeNotes: "Necesita Azure Databricks, Unity Catalog y Microsoft Purview.", freeEdition: "unsupported", importMode: "repository" }),
  artifact({ id: "unity-oss", repositoryId: "unity-oss", title: "Unity Catalog OSS", summary: "Catálogo abierto y multi-engine para explorar interoperabilidad más allá de un notebook Databricks.", format: "project", languages: ["Java", "Python"], clouds: ["Multinube"], difficulty: "advanced", runtimeNotes: "Equivalente conceptual; no es un notebook ni sustituye un laboratorio de OpenSharing.", freeEdition: "unknown", importMode: "repository" }),
];

const moduleFocus: Record<string, { focus: string; concepts: string[] }> = {
  m01: { focus: "arquitectura lakehouse y relación entre las superficies de la plataforma", concepts: ["arquitectura lakehouse", "Spark", "Delta Lake", "Unity Catalog"] },
  m02: { focus: "selección y operación de compute y SQL Warehouses", concepts: ["compute", "serverless", "SQL Warehouses", "Workflows"] },
  m03: { focus: "notebooks mantenibles con Python, SQL y PySpark", concepts: ["notebooks", "PySpark", "modularidad", "testing"] },
  m04: { focus: "DataFrames, transformaciones y datos complejos", concepts: ["DataFrames", "transformaciones", "arrays", "structs"] },
  m05: { focus: "planes de ejecución, particiones, joins y shuffles", concepts: ["Catalyst", "particiones", "joins", "shuffles"] },
  m06: { focus: "operaciones fiables con tablas Delta", concepts: ["Delta Lake", "ACID", "esquema", "historial"] },
  m07: { focus: "capas medallion, calidad y modelado dimensional", concepts: ["medallion", "calidad", "modelado", "Kimball"] },
  m08: { focus: "ingesta batch desde archivos y sistemas externos", concepts: ["ingesta batch", "formatos", "ELT", "ADLS"] },
  m09: { focus: "ingesta incremental con Auto Loader y conectores", concepts: ["Auto Loader", "Lakeflow Connect", "schema evolution", "CDC"] },
  m10: { focus: "DAGs, tareas, parámetros y triggers de Lakeflow Jobs", concepts: ["Jobs", "DAG", "tareas", "triggers"] },
  m11: { focus: "gobierno y entrega de código entre entornos", concepts: ["Unity Catalog", "Git folders", "CI/CD", "Bundles"] },
  m12: { focus: "un proyecto Associate de extremo a extremo", concepts: ["proyecto", "Associate", "medallion", "orquestación"] },
  m13: { focus: "Structured Streaming, triggers y checkpoints", concepts: ["Structured Streaming", "checkpoints", "triggers", "micro-batch"] },
  m14: { focus: "estado, ventanas, watermarks y datos tardíos", concepts: ["estado", "ventanas", "watermarks", "late data"] },
  m15: { focus: "integración con Kafka y buses de eventos", concepts: ["Kafka", "Event Hubs", "delivery semantics", "streaming"] },
  m16: { focus: "Change Data Feed, CDC y dimensiones SCD", concepts: ["CDF", "CDC", "AUTO CDC", "SCD"] },
  m17: { focus: "un proyecto streaming con SLA observable", concepts: ["streaming", "SLA", "operación", "pipeline"] },
  m18: { focus: "pipelines declarativos en Lakeflow", concepts: ["Lakeflow", "pipelines declarativos", "medallion", "deployment"] },
  m19: { focus: "expectations, cuarentena y event logs", concepts: ["expectations", "calidad", "cuarentena", "event log"] },
  m20: { focus: "control flow, reintentos y repairs en Jobs", concepts: ["control flow", "retries", "repairs", "Jobs"] },
  m21: { focus: "triggers, alertas, backfills y operación", concepts: ["triggers", "alertas", "backfills", "operación"] },
  m22: { focus: "un proyecto de pipeline declarativo desplegable", concepts: ["capstone", "Lakeflow", "SCD2", "Bundles"] },
  m23: { focus: "tuning avanzado basado en evidencia", concepts: ["Spark tuning", "planes", "particiones", "rendimiento"] },
  m24: { focus: "Photon, data skipping y liquid clustering", concepts: ["Photon", "data skipping", "liquid clustering", "layout"] },
  m25: { focus: "políticas, etiquetas y atribución de costes", concepts: ["FinOps", "políticas", "tags", "chargeback"] },
  m26: { focus: "diagnóstico con Spark UI, Query Profile y system tables", concepts: ["Spark UI", "Query Profile", "system tables", "observabilidad"] },
  m27: { focus: "un proyecto de fiabilidad y coste", concepts: ["fiabilidad", "FinOps", "TCO", "observabilidad"] },
  m28: { focus: "proyectos Python, dependencias y pruebas", concepts: ["Python", "dependencias", "testing", "modularidad"] },
  m29: { focus: "Declarative Automation Bundles y CI/CD", concepts: ["Bundles", "CI/CD", "targets", "deployment"] },
  m30: { focus: "privacidad y gobierno avanzado con Unity Catalog", concepts: ["Unity Catalog", "privacidad", "Purview", "lineage"] },
  m31: { focus: "interoperabilidad, OpenSharing y Federation", concepts: ["interoperabilidad", "sharing", "federation", "catálogo abierto"] },
  m32: { focus: "un proyecto Professional con gobierno, operación y coste", concepts: ["Professional", "arquitectura", "gobierno", "FinOps"] },
};

const recommendationMatrix: Record<string, readonly ModuleRecommendationSeed[]> = {
  m01: ["learn", "startup-erp", "free-pipelines"],
  m02: ["azure-hands-on", "sql-start-stop", ["learn", "partial"]],
  m03: ["best-practices", "azure-hands-on", "learn"],
  m04: ["azure-hands-on", "learn", "jump-start"],
  m05: ["learn", ["jump-flight", "partial"], ["databricks-examples", "partial"]],
  m06: ["delta-quickstart", "delta-create-table", "delta-cdf"],
  m07: ["startup-erp", "free-pipelines", "dlt-kimball"],
  m08: ["yokawasa-notebooks", "azure-ingestion", "azure-hands-on"],
  m09: ["crdb", "free-pipelines", ["dlt-notebooks", "partial"]],
  m10: ["learn", "best-practices", "sql-start-stop"],
  m11: ["bundles", "best-practices", "learn"],
  m12: [["azure-hands-on", "partial"], "startup-erp", "free-pipelines"],
  m13: ["azure-hands-on", ["jump-streaming", "partial"], "dlt-notebooks"],
  m14: ["azure-hands-on", "dlt-state", "dlt-kafka"],
  m15: ["azure-streaming", "dlt-kafka", "yokawasa-eventhub"],
  m16: ["delta-cdf", "dlt-cdc", "crdb"],
  m17: ["free-pipelines", "azure-hands-on", "dlt-kafka"],
  m18: ["learn", "free-pipelines", "lakeflow-demo"],
  m19: ["dlt-notebooks", "free-pipelines", "sales-pipeline"],
  m20: ["learn", "bundles", "azure-hands-on"],
  m21: ["free-pipelines", ["sql-start-stop", "partial"], ["learn", "partial"]],
  m22: ["free-pipelines", "lakeflow-demo", "bundles"],
  m23: ["learn", ["jump-start", "partial"], ["databricks-examples", "partial"]],
  m24: ["learn-photon", ["delta-examples", "partial"], ["lighthouse", "partial"]],
  m25: ["finops", "cost", "sql-start-stop"],
  m26: ["finops", ["learn", "partial"], ["jump-start", "partial"]],
  m27: ["finops", "lighthouse", "cost"],
  m28: ["best-practices", "bundles", "lakeflow-demo"],
  m29: ["bundles", "learn", "bundles-tutorial"],
  m30: ["startup-erp", "azure-governance", "purview"],
  m31: [["azure-federation", "equivalent"], ["learn", "partial"], ["unity-oss", "equivalent"]],
  m32: ["startup-erp", "free-pipelines", "finops"],
};

export type ExpandedCommunityRecommendation = {
  artifact: CommunityArtifact;
  repository: CommunityRepository;
  moduleId: string;
  rank: 1 | 2 | 3;
  preferred: boolean;
  coverage: Coverage;
  concepts: string[];
  rationale: string;
};

const repositoryById = new Map(communityRepositories.map((repository) => [repository.id, repository]));
const artifactById = new Map(communityArtifacts.map((item) => [item.id, item]));

export const moduleResourceRecommendations: ExpandedCommunityRecommendation[] = Object.entries(recommendationMatrix).flatMap(([moduleId, seeds]) => {
  const focus = moduleFocus[moduleId];
  return seeds.map((seed, index) => {
    const artifactId = typeof seed === "string" ? seed : seed[0];
    const coverage = typeof seed === "string" ? "direct" : seed[1];
    const item = artifactById.get(artifactId);
    if (!item) throw new Error(`Recurso comunitario desconocido: ${artifactId}`);
    const repository = repositoryById.get(item.repositoryId);
    if (!repository) throw new Error(`Repositorio comunitario desconocido: ${item.repositoryId}`);
    const rank = (index + 1) as 1 | 2 | 3;
    return {
      artifact: item,
      repository,
      moduleId,
      rank,
      preferred: rank === 1,
      coverage,
      concepts: [...focus.concepts],
      rationale: `${item.summary} En este módulo se propone para practicar ${focus.focus}.`,
    };
  });
});

export function recommendationsForModule(moduleId: string) {
  return moduleResourceRecommendations.filter((item) => item.moduleId === moduleId);
}

export function findCommunityArtifact(resourceId: string) {
  const item = artifactById.get(resourceId);
  if (!item) return null;
  const repository = repositoryById.get(item.repositoryId);
  return repository ? { artifact: item, repository } : null;
}

function validateCommunityRegistry() {
  if (communityRepositories.length !== 22) throw new Error("El registro comunitario debe contener 22 repositorios.");
  if (repositoryById.size !== communityRepositories.length) throw new Error("Hay IDs de repositorio comunitario duplicados.");
  if (artifactById.size !== communityArtifacts.length) throw new Error("Hay IDs de recurso comunitario duplicados.");
  if (Object.keys(recommendationMatrix).length !== 32) throw new Error("Deben existir recomendaciones para 32 módulos.");
  if (moduleResourceRecommendations.length !== 96) throw new Error("Deben existir exactamente 96 recomendaciones comunitarias.");
  for (const [moduleId, seeds] of Object.entries(recommendationMatrix)) {
    if (!/^m\d{2}$/.test(moduleId) || !moduleFocus[moduleId]) throw new Error(`Módulo comunitario no válido: ${moduleId}`);
    if (seeds.length !== 3) throw new Error(`${moduleId} debe tener exactamente tres recursos comunitarios.`);
  }
  for (const item of communityArtifacts) {
    const repository = repositoryById.get(item.repositoryId);
    if (!repository) throw new Error(`Falta el repositorio de ${item.id}.`);
    if (item.preview) {
      if (repository.licenseStatus !== "verified") throw new Error(`${item.id} no puede previsualizarse sin licencia verificada.`);
      if (!/^[a-f0-9]{40}$/.test(item.preview.upstreamRef)) throw new Error(`${item.id} necesita un commit fijado.`);
      if (!item.preview.rawUrl.startsWith("https://raw.githubusercontent.com/")) throw new Error(`${item.id} usa un origen de preview no permitido.`);
    }
  }
}

validateCommunityRegistry();

export function usageInstructionsFor(item: CommunityArtifact) {
  switch (item.importMode) {
    case "ipynb":
      return ["Revisa la vista previa y los requisitos del recurso.", "Descarga el archivo .ipynb o impórtalo desde su URL en el workspace.", "Adjunta compute compatible y ejecuta las celdas en orden."];
    case "databricks-source":
      return ["Abre el archivo fuente y revisa sus celdas Markdown y de código.", "Impórtalo como notebook o añade el repositorio como Git folder.", "Configura catálogos, esquemas y parámetros antes de ejecutar."];
    case "dbc":
      return ["Descarga el archivo .dbc indicado por el repositorio.", "En Workspace, usa Import y selecciona el archivo DBC.", "Revisa el compute y las credenciales requeridas antes de ejecutar."];
    case "bundle":
      return ["Clona el repositorio y revisa los targets y variables del bundle.", "Ejecuta la validación contra tu entorno de desarrollo.", "Despliega y ejecuta solo después de comprobar permisos y nombres de recursos."];
    default:
      return ["Abre el README y localiza el ejemplo recomendado.", "Revisa licencia, dependencias, datos y runtime.", "Crea una copia de trabajo en tu Git folder y adapta parámetros antes de ejecutar."];
  }
}

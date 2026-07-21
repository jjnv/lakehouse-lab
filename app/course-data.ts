export type TrackId = "core" | "streaming" | "pipelines" | "performance" | "delivery" | "final";
export type ExamLevel = "Associate" | "Associate + Professional" | "Professional";

export type SourceReference = {
  label: string;
  href: string;
  reviewedAt: string;
};

export type Lesson = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  detail: string;
  decisions: string[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Lab = {
  title: string;
  goal: string;
  steps: string[];
  starterCode: string;
  solution: string;
  checks: { label: string; pattern: string }[];
  cloudNotes: { cloud: "AWS" | "Azure" | "GCP"; note: string }[];
};

export type CurriculumModule = {
  id: string;
  number: string;
  slug: string;
  title: string;
  short: string;
  track: TrackId;
  level: ExamLevel;
  minutes: number;
  description: string;
  outcomes: string[];
  lessons: Lesson[];
  lab: Lab;
  quiz: QuizQuestion[];
  examDomains: string[];
  prerequisites: string[];
  source: SourceReference;
};

type ModuleSeed = Omit<CurriculumModule, "number" | "slug" | "lessons" | "lab" | "quiz" | "prerequisites" | "source"> & {
  topics: string[];
  practice: string;
  snippet: string;
  checkTerms: string[];
  sourcePath: string;
};

export const trackMeta: Record<TrackId, { name: string; eyebrow: string; color: string; description: string }> = {
  core: { name: "Tronco común", eyebrow: "01—12", color: "coral", description: "La base completa para dominar el blueprint Associate." },
  streaming: { name: "Streaming y CDC", eyebrow: "13—17", color: "blue", description: "Estado, eventos, datos tardíos y cambios en tiempo real." },
  pipelines: { name: "Pipelines y orquestación", eyebrow: "18—22", color: "purple", description: "Pipelines declarativos, calidad y operación de DAGs." },
  performance: { name: "Rendimiento y FinOps", eyebrow: "23—27", color: "gold", description: "Tuning, observabilidad, fiabilidad y coste." },
  delivery: { name: "Entrega y gobierno", eyebrow: "28—31", color: "green", description: "Pruebas, CI/CD, seguridad e interoperabilidad." },
  final: { name: "Convergencia Professional", eyebrow: "32", color: "ink", description: "Proyecto final y simulacro Professional." },
};

const seeds: ModuleSeed[] = [
  { id:"m01", title:"Data Intelligence Platform y arquitectura lakehouse", short:"Plataforma", track:"core", level:"Associate", minutes:170, description:"Construye un modelo mental preciso de almacenamiento, cómputo, gobierno y superficies de trabajo.", outcomes:["Explicar la separación entre storage y compute","Relacionar Delta Lake, Unity Catalog y motores de ejecución","Elegir la superficie adecuada para cada carga"], topics:["Lake, warehouse y lakehouse sin simplificaciones","Plano de control y plano de datos","Object storage y formatos abiertos","Workspace, metastore y recursos de cómputo","Arquitectura de referencia de extremo a extremo"], practice:"Dibuja y documenta una arquitectura lakehouse para una empresa de comercio electrónico.", snippet:"DESCRIBE DETAIL main.learning.events;", checkTerms:["DESCRIBE DETAIL","main.learning.events"], examDomains:["Databricks Intelligence Platform","Arquitectura"], sourcePath:"/lakehouse/" },
  { id:"m02", title:"Compute clásico, serverless y SQL warehouses", short:"Compute", track:"core", level:"Associate", minutes:170, description:"Selecciona recursos por patrón de carga, aislamiento, latencia, gobernanza y coste total.", outcomes:["Comparar serverless, classic y SQL warehouses","Dimensionar sin sobredimensionar","Aplicar auto-stop, políticas y modos de rendimiento"], topics:["Serverless frente a compute clásico","All-purpose, jobs compute y SQL warehouses","Autoscaling, auto-stop y pools","Access modes y aislamiento","DBUs, latencia de arranque y coste"], practice:"Elige compute y política para tres cargas con SLA y presupuestos distintos.", snippet:"SELECT * FROM system.billing.usage LIMIT 20;", checkTerms:["system.billing.usage","SELECT"], examDomains:["Compute services","Cost models"], sourcePath:"/compute/" },
  { id:"m03", title:"Notebooks, SQL, Python y PySpark en el workspace", short:"Desarrollo", track:"core", level:"Associate", minutes:170, description:"Trabaja con notebooks y archivos como código mantenible, reproducible y parametrizable.", outcomes:["Distinguir SQL, Python y PySpark por carga","Gestionar parámetros y dependencias","Evitar estado oculto en notebooks"], topics:["Notebooks y archivos de workspace","SQL frente a PySpark","Widgets y parámetros de tareas","Librerías y entornos reproducibles","Colaboración, revisión y modularidad"], practice:"Refactoriza un notebook monolítico en funciones parametrizadas y comprobables.", snippet:"orders = spark.table(\"main.sales.orders\")\ndisplay(orders.limit(20))", checkTerms:["spark.table","main.sales.orders"], examDomains:["Workspace","PySpark"], sourcePath:"/pyspark/" },
  { id:"m04", title:"DataFrames, transformaciones y datos complejos", short:"DataFrames", track:"core", level:"Associate", minutes:170, description:"Domina las operaciones que aparecen en ETL real: joins, arrays, structs, ventanas y deduplicación.", outcomes:["Transformar columnas y filas con funciones nativas","Manipular arrays, maps y structs","Combinar y deduplicar datasets de forma determinista"], topics:["Transformaciones y acciones","Select, filter y withColumn","Joins, unions y claves compuestas","explode, arrays, maps y structs","Ventanas, agregaciones y deduplicación"], practice:"Normaliza pedidos JSON anidados y publica una tabla de líneas deduplicadas.", snippet:"from pyspark.sql import functions as F\nclean = raw.select(\"order_id\", F.explode(\"items\").alias(\"item\"))", checkTerms:["explode","order_id"], examDomains:["Data Transformation and Modeling","PySpark DataFrames"], sourcePath:"/pyspark/basics" },
  { id:"m05", title:"Catalyst, particiones, joins y shuffles", short:"Spark", track:"core", level:"Associate + Professional", minutes:170, description:"Razona sobre el plan lógico y físico antes de ajustar configuraciones o añadir cómputo.", outcomes:["Leer explain formatted","Detectar Exchange, skew y spill","Elegir broadcast, repartition o coalesce con evidencia"], topics:["Lazy evaluation y DAG de Spark","Catalyst y optimizaciones de consulta","Particiones y paralelismo","Shuffles, skew y spills","Estrategias de join y broadcast"], practice:"Compara dos planes físicos y justifica una reducción del movimiento de datos.", snippet:"daily.explain(\"formatted\")", checkTerms:["explain","formatted"], examDomains:["Troubleshooting and Optimization","Spark execution"], sourcePath:"/optimizations/" },
  { id:"m06", title:"Delta Lake: ACID, esquema, historial y DML", short:"Delta", track:"core", level:"Associate + Professional", minutes:170, description:"Usa el transaction log para construir tablas fiables, auditables e idempotentes.", outcomes:["Explicar snapshots y concurrencia optimista","Aplicar MERGE, UPDATE y DELETE correctamente","Diferenciar enforcement, evolution y time travel"], topics:["Transaction log y propiedades ACID","Tablas managed y external","Schema enforcement y evolution","MERGE e idempotencia","History, time travel y VACUUM"], practice:"Implementa un MERGE incremental que resista reintentos y eventos antiguos.", snippet:"MERGE INTO main.silver.customers t USING updates s ON t.id=s.id WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *;", checkTerms:["MERGE INTO","WHEN NOT MATCHED"], examDomains:["Delta Lake","Data management"], sourcePath:"/delta/" },
  { id:"m07", title:"Arquitectura medallion, calidad y modelado", short:"Modelado", track:"core", level:"Associate + Professional", minutes:170, description:"Diseña capas y contratos desde las necesidades de consumo, trazabilidad y reejecución.", outcomes:["Asignar responsabilidades a bronze, silver y gold","Diseñar hechos, dimensiones y SCD","Definir controles de calidad por frontera"], topics:["Medallion como patrón, no dogma","Bronze y trazabilidad de origen","Silver, conformado y calidad","Gold, hechos y dimensiones","Contratos, SLOs y ownership"], practice:"Diseña un modelo dimensional de ventas con reglas explícitas en cada capa.", snippet:"CREATE OR REPLACE VIEW main.gold.daily_sales AS SELECT order_date, sum(amount) revenue FROM main.silver.orders GROUP BY order_date;", checkTerms:["main.gold.daily_sales","sum(amount)"], examDomains:["Data Modelling","Data Quality"], sourcePath:"/lakehouse-architecture/medallion" },
  { id:"m08", title:"Ingesta batch, formatos, COPY INTO, JDBC y REST", short:"Ingesta batch", track:"core", level:"Associate", minutes:170, description:"Elige una vía de entrada reproducible para archivos, bases de datos y APIs.", outcomes:["Comparar cargas completas e incrementales","Usar COPY INTO de forma idempotente","Controlar formatos, compresión y metadatos de origen"], topics:["Matriz de patrones de ingesta","CSV, JSON, Parquet, Avro, ORC y binary","COPY INTO e historial de archivos","JDBC, ODBC y REST","Metadatos, errores y cuarentena"], practice:"Carga un lote JSON gobernado y demuestra que una segunda ejecución no duplica filas.", snippet:"COPY INTO main.bronze.orders FROM '/Volumes/main/landing/orders' FILEFORMAT = JSON;", checkTerms:["COPY INTO","FILEFORMAT = JSON"], examDomains:["Data Ingestion and Loading","File formats"], sourcePath:"/ingestion/" },
  { id:"m09", title:"Auto Loader y Lakeflow Connect", short:"Ingesta managed", track:"core", level:"Associate + Professional", minutes:170, description:"Selecciona entre descubrimiento de archivos, conectores gestionados y alternativas de integración.", outcomes:["Configurar schemaLocation y checkpointLocation","Gestionar evolución y rescued data","Elegir Lakeflow Connect, Auto Loader o partner connector"], topics:["Auto Loader y cloudFiles","Directory listing y file notification","Inferencia, hints y evolución de esquema","Lakeflow Connect standard y managed","Matriz de decisión por volumen, frescura y gobierno"], practice:"Construye una carga incremental con estado durable y política de evolución explícita.", snippet:"spark.readStream.format(\"cloudFiles\").option(\"cloudFiles.format\", \"json\").load(landing)", checkTerms:["cloudFiles","readStream"], examDomains:["Data Ingestion and Loading","Lakeflow Connect"], sourcePath:"/ingestion/cloud-object-storage/auto-loader/" },
  { id:"m10", title:"Lakeflow Jobs: DAG, tareas y triggers", short:"Jobs", track:"core", level:"Associate + Professional", minutes:170, description:"Convierte ejecuciones manuales en workflows parametrizados, idempotentes y observables.", outcomes:["Diseñar un DAG con paralelismo seguro","Configurar tareas, parámetros y dependencias","Elegir triggers temporales o dirigidos por datos"], topics:["Jobs, runs y task graph","Notebook, Python, SQL y pipeline tasks","Parámetros y task values","Schedule, file arrival y table update","Retries, timeout y notificaciones"], practice:"Diseña un job bronze-silver-gold con parámetros y un trigger adecuado al SLA.", snippet:"resources:\n  jobs:\n    orders_job:\n      tasks: []", checkTerms:["jobs","tasks"], examDomains:["Working with Lakeflow Jobs","Orchestration"], sourcePath:"/jobs/" },
  { id:"m11", title:"Unity Catalog, Git folders y CI/CD esencial", short:"Gobierno y CI/CD", track:"core", level:"Associate + Professional", minutes:170, description:"Une gobierno de datos con una entrega de código revisable y promocionable entre entornos.", outcomes:["Aplicar el namespace y mínimo privilegio","Diferenciar managed, external, volumes y credentials","Promover el mismo código con variables por entorno"], topics:["Metastore, catalog, schema y object","Privilegios, herencia y service principals","External locations, volumes y storage credentials","Git folders y flujo de ramas","Bundles, targets y variables por entorno"], practice:"Define permisos de un dominio y un esqueleto de bundle para dev y prod.", snippet:"bundle:\n  name: learning\ntargets:\n  dev:\n    default: true\n  prod: {}", checkTerms:["bundle","targets"], examDomains:["Governance and Security","Implementing CI/CD"], sourcePath:"/data-governance/unity-catalog/" },
  { id:"m12", title:"Proyecto Associate y simulacro de 45 preguntas", short:"Hito Associate", track:"core", level:"Associate", minutes:300, description:"Integra ingesta, transformación, gobierno, Jobs y CI/CD en una solución defendible.", outcomes:["Entregar un pipeline Associate completo","Justificar decisiones de arquitectura","Medir preparación con un simulacro original"], topics:["Brief y criterios de aceptación","Arquitectura y seguridad inicial","Construcción del pipeline","Pruebas, operación y documentación","Retrospectiva y simulacro Associate"], practice:"Entrega un mini-lakehouse de pedidos desde landing hasta gold con job y controles.", snippet:"-- CAPSTONE ASSOCIATE\nSELECT count(*) AS rows_checked FROM main.gold.daily_sales;", checkTerms:["CAPSTONE ASSOCIATE","main.gold.daily_sales"], examDomains:["Todos los dominios Associate"], sourcePath:"https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf" },

  { id:"m13", title:"Structured Streaming, triggers y checkpoints", short:"Streaming", track:"streaming", level:"Professional", minutes:170, description:"Construye consultas incrementales con estado durable y semántica de recuperación clara.", outcomes:["Explicar microbatches y progreso","Configurar triggers y checkpoints","Diseñar sinks idempotentes"], topics:["Modelo incremental de Structured Streaming","Sources, sinks y output modes","Triggers availableNow y processingTime","Offsets, commits y checkpoints","Recuperación y compatibilidad de cambios"], practice:"Procesa eventos con availableNow y demuestra reanudación desde checkpoint.", snippet:"stream.writeStream.option(\"checkpointLocation\", checkpoint).trigger(availableNow=True).toTable(target)", checkTerms:["checkpointLocation","availableNow"], examDomains:["Data Ingestion and Acquisition","Structured Streaming"], sourcePath:"/structured-streaming/" },
  { id:"m14", title:"Estado, ventanas, watermarks y datos tardíos", short:"Estado", track:"streaming", level:"Professional", minutes:170, description:"Controla el crecimiento de estado y la corrección temporal con eventos fuera de orden.", outcomes:["Definir event time y processing time","Aplicar watermark con intención","Deduplicar y agregar ventanas acotando estado"], topics:["Event time frente a processing time","Ventanas tumbling y sliding","Watermarks y finalización","Deduplicación con estado","State store, métricas y presión de memoria"], practice:"Agrega eventos tardíos por ventana y documenta qué registros pueden descartarse.", snippet:"events.withWatermark(\"event_ts\", \"10 minutes\").dropDuplicatesWithinWatermark([\"event_id\"])", checkTerms:["withWatermark","event_id"], examDomains:["Streaming state","Reliability"], sourcePath:"/structured-streaming/watermarks" },
  { id:"m15", title:"Kafka, buses de eventos y garantías de entrega", short:"Kafka", track:"streaming", level:"Professional", minutes:170, description:"Integra sistemas de eventos sin confundir offsets, claves, orden y garantías end-to-end.", outcomes:["Configurar lectura Kafka con seguridad","Interpretar particiones y offsets","Diseñar idempotencia entre source y sink"], topics:["Kafka topics, partitions y consumer offsets","key, value, headers y timestamps","Autenticación y secretos","At-least-once y exactly-once práctico","Backpressure, lag y capacidad"], practice:"Decodifica un topic de pedidos, preserva metadatos y publica Delta idempotente.", snippet:"spark.readStream.format(\"kafka\").option(\"subscribe\", \"orders\").load()", checkTerms:["format(\"kafka\")","subscribe"], examDomains:["Message buses","Streaming ingestion"], sourcePath:"/connect/streaming/kafka" },
  { id:"m16", title:"Change Data Feed, CDC, APPLY CHANGES y SCD", short:"CDC", track:"streaming", level:"Professional", minutes:170, description:"Procesa inserciones, actualizaciones y borrados respetando clave, secuencia y retención.", outcomes:["Consumir Change Data Feed","Modelar CDC con APPLY CHANGES","Elegir SCD tipo 1 o 2"], topics:["CDC, CDF y sus diferencias","Change types y versiones de commit","Keys y sequence_by","APPLY CHANGES y AUTO CDC","SCD 1, SCD 2 y borrados"], practice:"Materializa el historial de clientes desde un feed CDC con eventos fuera de orden.", snippet:"ALTER TABLE main.silver.customers SET TBLPROPERTIES (delta.enableChangeDataFeed = true);", checkTerms:["enableChangeDataFeed","ALTER TABLE"], examDomains:["CDC","Change Data Feed"], sourcePath:"/delta/delta-change-data-feed" },
  { id:"m17", title:"Proyecto de streaming con SLA", short:"Proyecto streaming", track:"streaming", level:"Professional", minutes:300, description:"Entrega un flujo operable que soporte datos tardíos, recuperación e incidentes reproducibles.", outcomes:["Cumplir SLA de frescura y completitud","Recuperar sin duplicados","Crear métricas y runbook"], topics:["Definición del SLA","Diseño de eventos y particiones","Estado, CDC y calidad","Observabilidad y alertas","Game day y recuperación"], practice:"Construye y opera un pipeline clickstream con CDC de perfiles y gold casi en tiempo real.", snippet:"SELECT max(event_ts) AS max_event, current_timestamp() - max(event_ts) AS freshness FROM main.silver.events;", checkTerms:["freshness","main.silver.events"], examDomains:["Streaming production readiness"], sourcePath:"/structured-streaming/production" },

  { id:"m18", title:"Lakeflow Spark Declarative Pipelines", short:"Declarativo", track:"pipelines", level:"Professional", minutes:170, description:"Declara datasets y dependencias para que el servicio gestione el grafo y la ejecución incremental.", outcomes:["Crear tablas streaming y materialized views","Comparar declarativo con Structured Streaming","Organizar código de pipeline"], topics:["Modelo declarativo y grafo","Streaming tables","Materialized views","Python y SQL en pipelines","Serverless y modos de ejecución"], practice:"Declara un pipeline bronze-silver con una tabla streaming y una vista materializada.", snippet:"from pyspark import pipelines as dp\n@dp.table\ndef orders_bronze(): return spark.readStream.table(\"main.raw.orders\")", checkTerms:["@dp.table","readStream"], examDomains:["Lakeflow Spark Declarative Pipelines"], sourcePath:"/ldp/" },
  { id:"m19", title:"Expectations, cuarentena y event logs", short:"Calidad", track:"pipelines", level:"Professional", minutes:170, description:"Haz visibles las decisiones de calidad y separa observación, descarte, fallo y remediación.", outcomes:["Elegir EXPECT, DROP o FAIL","Diseñar una cuarentena trazable","Consultar métricas en event logs"], topics:["Dimensiones y contratos de calidad","EXPECT y observación","EXPECT OR DROP","EXPECT OR FAIL","Quarantine pattern y event log"], practice:"Implementa reglas con acciones distintas y un dashboard mínimo de calidad.", snippet:"@dp.expect_or_drop(\"valid_id\", \"order_id IS NOT NULL\")", checkTerms:["expect_or_drop","order_id"], examDomains:["Data Transformation, Cleansing, and Quality","Monitoring"], sourcePath:"/ldp/expectations" },
  { id:"m20", title:"Lakeflow Jobs avanzado: control flow y repairs", short:"Jobs avanzado", track:"pipelines", level:"Professional", minutes:170, description:"Orquesta decisiones, bucles y recuperaciones sin convertir el DAG en lógica opaca.", outcomes:["Usar branching y for-each con límites","Aplicar retries y repairs correctamente","Transferir parámetros y task values"], topics:["If/else task","For each task","Run job y modularidad","Job repairs y parameter overrides","Concurrency y queueing"], practice:"Diseña un workflow multi-región con branch, for-each y recuperación de una partición.", snippet:"dbutils.jobs.taskValues.set(key=\"row_count\", value=validated.count())", checkTerms:["taskValues.set","row_count"], examDomains:["Debugging and Deploying","Lakeflow Jobs"], sourcePath:"/jobs/control-flow" },
  { id:"m21", title:"Triggers, alertas, backfills y operación", short:"Operación", track:"pipelines", level:"Professional", minutes:170, description:"Opera pipelines según disponibilidad real del dato y recupera ventanas históricas sin romper producción.", outcomes:["Elegir trigger por evento o calendario","Diseñar backfills seguros","Crear alertas accionables y SLOs"], topics:["Schedule y time zones","File arrival y table update","Continuous y triggered pipelines","Backfills y ventanas de proceso","Alertas, webhooks y ownership"], practice:"Planifica un backfill de 90 días compatible con la ejecución diaria.", snippet:"process_date = dbutils.widgets.get(\"process_date\")", checkTerms:["widgets.get","process_date"], examDomains:["Monitoring and Alerting","Orchestration"], sourcePath:"/jobs/triggers" },
  { id:"m22", title:"Proyecto de pipeline declarativo", short:"Proyecto pipelines", track:"pipelines", level:"Professional", minutes:300, description:"Construye una cadena declarativa con calidad, CDC, orquestación y operación documentada.", outcomes:["Entregar datasets incrementales fiables","Probar dependencias y reglas","Operar fallos y backfills"], topics:["Arquitectura del pipeline","Implementación declarativa","Expectations y cuarentena","Job envolvente y despliegue","Pruebas operativas"], practice:"Entrega un pipeline de clientes y pedidos con CDC, quality dashboard y job de publicación.", snippet:"SELECT * FROM event_log(TABLE(main.pipeline.orders));", checkTerms:["event_log","pipeline"], examDomains:["Production pipelines"], sourcePath:"/ldp/monitor-event-logs" },

  { id:"m23", title:"Tuning avanzado de Spark", short:"Tuning Spark", track:"performance", level:"Professional", minutes:170, description:"Optimiza con evidencia del plan y las métricas, no con recetas globales ni más cómputo por defecto.", outcomes:["Diagnosticar skew y spill","Ajustar joins y particiones","Evaluar UDF, Pandas UDF y funciones nativas"], topics:["Plan físico y métricas de stages","Skew y adaptive query execution","Broadcast y sort merge join","Shuffle partitions y file sizing","UDF, Pandas UDF y serialización"], practice:"Reduce tiempo y shuffle de una consulta sesgada y registra el antes/después.", snippet:"spark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")", checkTerms:["adaptive.enabled","true"], examDomains:["Cost & Performance Optimisation","Spark UI"], sourcePath:"/optimizations/aqe" },
  { id:"m24", title:"Photon, data skipping y liquid clustering", short:"Tuning Delta", track:"performance", level:"Professional", minutes:170, description:"Diseña layout y mantenimiento de tablas según patrones de consulta que cambian con el tiempo.", outcomes:["Interpretar data skipping y pruning","Elegir liquid clustering","Explicar deletion vectors, Photon y predictive optimization"], topics:["Photon y ejecución vectorizada","Statistics y data skipping","Particionado y sus límites","Liquid clustering","Deletion vectors y predictive optimization"], practice:"Optimiza una tabla de eventos para filtros por cliente y fecha sin sobreparticionar.", snippet:"ALTER TABLE main.silver.events CLUSTER BY (customer_id, event_date);", checkTerms:["CLUSTER BY","customer_id"], examDomains:["Delta optimization","Performance"], sourcePath:"/delta/clustering" },
  { id:"m25", title:"Compute, políticas, etiquetas y costes", short:"FinOps", track:"performance", level:"Professional", minutes:170, description:"Atribuye consumo, controla guardrails y optimiza coste sin degradar el valor del workload.", outcomes:["Consultar costes con system tables","Etiquetar y atribuir consumo","Elegir modos serverless y políticas"], topics:["DBUs, SKUs y coste cloud","system.billing.usage","Tags y chargeback","Compute policies y budgets","Standard frente a performance optimized"], practice:"Crea un informe de coste por equipo y recomienda tres acciones cuantificables.", snippet:"SELECT custom_tags.team, sum(usage_quantity) usage FROM system.billing.usage GROUP BY custom_tags.team;", checkTerms:["system.billing.usage","sum(usage_quantity)"], examDomains:["Cost optimization","System tables"], sourcePath:"/admin/usage/" },
  { id:"m26", title:"Spark UI, Query Profile y system tables", short:"Observabilidad", track:"performance", level:"Professional", minutes:170, description:"Combina señales de ejecución, plataforma y datos para reducir el tiempo de diagnóstico.", outcomes:["Localizar cuellos en Spark UI y Query Profile","Consultar historial de Jobs y auditoría","Usar CLI y REST para automatizar diagnóstico"], topics:["Spark UI: jobs, stages y executors","Query Profile y operadores","System tables de workflows","Event logs y cluster logs","CLI, REST APIs y automatización"], practice:"Investiga un job lento con un árbol de hipótesis y evidencia de tres superficies.", snippet:"SELECT * FROM system.lakeflow.job_run_timeline ORDER BY period_start_time DESC LIMIT 20;", checkTerms:["system.lakeflow","ORDER BY"], examDomains:["Monitoring and Alerting","Debugging"], sourcePath:"/admin/system-tables/" },
  { id:"m27", title:"Proyecto de fiabilidad y coste", short:"Proyecto FinOps", track:"performance", level:"Professional", minutes:300, description:"Recupera un workload degradado equilibrando SLA, capacidad, layout, código y presupuesto.", outcomes:["Resolver un incidente con método","Demostrar mejora con métricas","Definir prevención y alertas"], topics:["Triage y severidad","Hipótesis y evidencia","Corrección de código y layout","Right-sizing y coste","Postmortem y acciones preventivas"], practice:"Diagnostica un pipeline con skew, archivos pequeños y gasto creciente; entrega postmortem.", snippet:"DESCRIBE HISTORY main.silver.events;", checkTerms:["DESCRIBE HISTORY","main.silver.events"], examDomains:["Reliability","Cost & Performance"], sourcePath:"/lakehouse-architecture/reliability/" },

  { id:"m28", title:"Proyectos Python, dependencias y pruebas", short:"Calidad de código", track:"delivery", level:"Professional", minutes:170, description:"Convierte notebooks en un paquete comprobable con límites claros y entornos reproducibles.", outcomes:["Diseñar un paquete Python modular","Gestionar wheels y dependencias","Probar DataFrames y contratos"], topics:["Estructura src y separación de I/O","Wheels, PyPI y versiones fijadas","Funciones transform puras","assertDataFrameEqual y assertSchemaEqual","Unit, integration y smoke tests"], practice:"Extrae una transformación a paquete y crea pruebas de datos y esquema.", snippet:"from pyspark.testing import assertDataFrameEqual\nassertDataFrameEqual(actual, expected)", checkTerms:["assertDataFrameEqual","actual"], examDomains:["Developing Code","Testing"], sourcePath:"/pyspark/testing" },
  { id:"m29", title:"Declarative Automation Bundles y CI/CD", short:"CI/CD", track:"delivery", level:"Professional", minutes:170, description:"Define recursos como código y promociona el mismo artefacto validado entre targets.", outcomes:["Estructurar un bundle completo","Validar y desplegar con CLI","Integrar identidad de servicio y pipeline Git"], topics:["Bundle configuration y includes","Resources: jobs y pipelines","Variables, substitutions y targets","validate, deploy y run","CI/CD, service principals y approvals"], practice:"Empaqueta un job y pipeline con targets dev, test y prod y una validación automática.", snippet:"databricks bundle validate -t dev\ndatabricks bundle deploy -t dev", checkTerms:["bundle validate","bundle deploy"], examDomains:["Deploying CI/CD","Databricks CLI"], sourcePath:"/dev-tools/bundles/" },
  { id:"m30", title:"Unity Catalog avanzado y privacidad", short:"Seguridad", track:"delivery", level:"Professional", minutes:170, description:"Aplica controles centralizados a datos sensibles y demuestra cumplimiento mediante auditoría.", outcomes:["Diseñar herencia y ownership","Aplicar row filters, masks y ABAC","Implementar retención, anonimización y purga"], topics:["Modelo de privilegios e inheritance","Workspace ACLs y securables","Row filters y column masks","ABAC y políticas centralizadas","PII, tokenización, retención y auditoría"], practice:"Protege un dominio de clientes con ABAC, máscara de email y política de retención.", snippet:"ALTER TABLE main.gold.customers ALTER COLUMN email SET MASK main.security.email_mask;", checkTerms:["SET MASK","email"], examDomains:["Data Security and Compliance","Data Governance"], sourcePath:"/data-governance/unity-catalog/filters-and-masks/" },
  { id:"m31", title:"Delta Sharing y Lakehouse Federation", short:"Interoperabilidad", track:"delivery", level:"Professional", minutes:170, description:"Comparte o consulta datos externos con el mínimo movimiento y un perímetro gobernado.", outcomes:["Comparar D2D y open sharing","Configurar federation con pushdown","Elegir compartir, federar o ingerir"], topics:["Delta Sharing y shares","Databricks-to-Databricks","Open sharing recipients","Lakehouse Federation y connections","Matriz compartir, federar o copiar"], practice:"Diseña una colaboración con un socio externo y una consulta federada de baja frecuencia.", snippet:"CREATE SHARE partner_share;\nALTER SHARE partner_share ADD TABLE main.gold.sales;", checkTerms:["CREATE SHARE","ADD TABLE"], examDomains:["Data Sharing and Federation"], sourcePath:"/delta-sharing/" },

  { id:"m32", title:"Proyecto Professional y simulacro de 59 preguntas", short:"Hito Professional", track:"final", level:"Professional", minutes:210, description:"Converge las cuatro ramas en una solución production-grade y mide la preparación final.", outcomes:["Diseñar y defender una plataforma completa","Responder a fallos, costes y cumplimiento","Completar un simulacro Professional original"], topics:["Brief, NFRs y arquitectura","Pipeline batch y streaming","Seguridad, interoperabilidad y CI/CD","Game day, FinOps y postmortem","Defensa técnica y simulacro Professional"], practice:"Entrega una plataforma de pedidos omnicanal con CDC, SLO, CI/CD, gobierno y runbook.", snippet:"-- CAPSTONE PROFESSIONAL\nSELECT 'ready' AS status, current_timestamp() AS reviewed_at;", checkTerms:["CAPSTONE PROFESSIONAL","reviewed_at"], examDomains:["Todos los dominios Professional"], sourcePath:"https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf" },
];

const lessonKickers = ["Modelo mental", "Implementación", "Operación", "Diagnóstico", "Decisión de diseño"];

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function prerequisitesFor(index: number, track: TrackId): string[] {
  if (index === 0) return [];
  if (track === "core") return [seeds[index - 1].id];
  if (track === "final") return ["m17", "m22", "m27", "m31"];
  const previous = seeds[index - 1];
  return previous.track === track ? [previous.id] : ["m12"];
}

function makeLessons(seed: ModuleSeed): Lesson[] {
  return seed.topics.map((topic, index) => ({
    id: `${seed.id}-l${index + 1}`,
    kicker: lessonKickers[index],
    title: topic,
    summary: `Esta lección sitúa ${topic.toLowerCase()} dentro de ${seed.title.toLowerCase()}, con una decisión técnica concreta y criterios para comprobarla.`,
    detail: index === 0
      ? `${seed.description} Empieza por el modelo mental: identifica qué estado persiste, qué componente ejecuta la carga y dónde se aplican los controles. El objetivo no es memorizar nombres, sino poder defender la arquitectura ante requisitos de volumen, latencia, seguridad y coste.`
      : `Trabaja el tema con datos representativos y compara el resultado esperado con las señales de ejecución. Documenta supuestos, límites y el comportamiento ante reintentos o cambios de esquema; en producción, una solución correcta también debe ser observable, gobernable y recuperable.`,
    decisions: [seed.outcomes[index % seed.outcomes.length], `Evita aplicar ${topic.toLowerCase()} como receta universal`, "Valida la decisión con métricas y una condición de aceptación"],
  }));
}

function makeLab(seed: ModuleSeed): Lab {
  return {
    title: seed.track === "final" || ["m12", "m17", "m22", "m27"].includes(seed.id) ? seed.title : `Laboratorio: ${seed.short}`,
    goal: seed.practice,
    steps: ["Prepara un catálogo y esquema de aprendizaje sin credenciales incrustadas.", seed.practice, "Ejecuta dos veces o simula un fallo para comprobar idempotencia y recuperación.", "Registra resultado, métricas, supuestos y una mejora pendiente."],
    starterCode: `# Completa el ejercicio de ${seed.short}\n# TODO: aplica la solución y documenta la evidencia\n`,
    solution: seed.snippet,
    checks: seed.checkTerms.map((term) => ({ label: `Incluye ${term}`, pattern: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") })),
    cloudNotes: [
      { cloud:"AWS", note:"Usa S3 y una storage credential de Unity Catalog cuando el ejercicio necesite object storage." },
      { cloud:"Azure", note:"Sustituye el almacenamiento por ADLS Gen2 y usa la identidad administrada o service principal autorizada." },
      { cloud:"GCP", note:"Usa GCS y una storage credential respaldada por una service account con mínimo privilegio." },
    ],
  };
}

function makeQuiz(seed: ModuleSeed): QuizQuestion[] {
  return [
    { question:`¿Cuál es el resultado principal del módulo ${seed.id.slice(1)}?`, options:[seed.outcomes[0],"Aumentar compute sin medir","Eliminar los controles de gobierno","Convertir toda carga en streaming"], answer:0, explanation:`El objetivo evaluado es ${seed.outcomes[0].toLowerCase()}; las demás opciones son decisiones sin contexto.` },
    { question:"¿Qué enfoque es más sólido para producción?", options:["Copiar una receta sin revisar el workload",seed.outcomes[1],"Ocultar métricas para simplificar","Depender de una ejecución manual"], answer:1, explanation:`La opción correcta conecta la implementación con el resultado observable: ${seed.outcomes[1].toLowerCase()}.` },
    { question:`¿Qué error conviene evitar al trabajar con ${seed.short}?`, options:["Documentar supuestos","Probar con datos representativos",`Aplicar ${seed.topics[2].toLowerCase()} como regla universal`,"Definir una condición de aceptación"], answer:2, explanation:"Una práctica útil en un contexto puede ser perjudicial en otro; hay que validar con evidencia y restricciones reales." },
    { question:"¿Qué evidencia demuestra mejor que el laboratorio está terminado?", options:["Una captura sin contexto","Que el código no dé error una vez","Haber leído la documentación",`Resultado reproducible, métricas y explicación de ${seed.outcomes[2].toLowerCase()}`], answer:3, explanation:"La finalización exige resultado reproducible, evidencia y capacidad de explicar la decisión." },
  ];
}

export const modules: CurriculumModule[] = seeds.map((seed, index) => ({
  ...seed,
  number: String(index + 1).padStart(2, "0"),
  slug: slugify(seed.title),
  lessons: makeLessons(seed),
  lab: makeLab(seed),
  quiz: makeQuiz(seed),
  prerequisites: prerequisitesFor(index, seed.track),
  source: {
    label: seed.sourcePath.startsWith("http") ? "Blueprint oficial de certificación" : "Documentación oficial de Databricks",
    href: seed.sourcePath.startsWith("http") ? seed.sourcePath : `https://docs.databricks.com/aws/en${seed.sourcePath}`,
    reviewedAt: "21 jul 2026",
  },
}));

export const totalMinutes = modules.reduce((total, module) => total + module.minutes, 0);

export const associateBlueprint = "https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf";
export const professionalBlueprint = "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf";

export function buildExamQuestions(level: "associate" | "professional"): QuizQuestion[] {
  const count = level === "associate" ? 45 : 59;
  const pool = level === "associate" ? modules.slice(0, 12) : modules;
  return Array.from({ length: count }, (_, index) => {
    const module = pool[index % pool.length];
    const lesson = module.lessons[Math.floor(index / pool.length) % module.lessons.length];
    const correctIndex = index % 4;
    const correct = `${module.short}: ${lesson.title}`;
    const distractors = ["Aumentar compute antes de investigar", "Eliminar el checkpoint para repetir la carga", "Conceder permisos amplios a usuarios individuales"];
    const options = [...distractors];
    options.splice(correctIndex, 0, correct);
    return {
      question: `Escenario ${index + 1}: la decisión afecta a ${module.title}. ¿Qué área debes revisar primero para resolver el requisito descrito?`,
      options,
      answer: correctIndex,
      explanation: `La respuesta se encuentra en ${module.number} · ${lesson.title}. Revisa el modelo, la señal observable y el criterio de aceptación antes de cambiar recursos.`,
    };
  });
}

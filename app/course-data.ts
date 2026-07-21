export type LessonSection = {
  title: string;
  kicker: string;
  paragraphs: string[];
  points: string[];
};

export type TestQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type CourseModule = {
  number: string;
  title: string;
  short: string;
  level: string;
  exam: "Associate" | "Associate + Professional" | "Professional";
  duration: string;
  icon: string;
  description: string;
  outcomes: string[];
  sections: LessonSection[];
  code: { language: string; title: string; content: string };
  lab: {
    title: string;
    goal: string;
    steps: string[];
    checkpoint: string;
    language: "SQL" | "Python";
    dataset: { name: string; schema: string[]; preview: string[][] };
    challenge: string;
    starterCode: string;
    solution: string;
    checks: { label: string; pattern: string }[];
    result: { columns: string[]; rows: string[][] };
    successMessage: string;
    hints: string[];
  };
  questions: TestQuestion[];
  source: { label: string; href: string };
};

export const modules: CourseModule[] = [
  {
    number: "01",
    title: "Fundamentos de Lakehouse",
    short: "Lakehouse",
    level: "Base",
    exam: "Associate",
    duration: "55 min",
    icon: "</>",
    description: "Entiende cómo encajan almacenamiento, cómputo, metadatos y gobierno antes de escribir una sola transformación.",
    outcomes: ["Distinguir lake, warehouse y lakehouse", "Elegir cómputo según la carga", "Navegar el modelo catálogo → esquema → objeto"],
    sections: [
      {
        kicker: "Modelo mental",
        title: "Un lakehouse separa almacenamiento y cómputo",
        paragraphs: [
          "Databricks ejecuta motores de cómputo sobre datos almacenados en object storage. Esa separación permite escalar el cómputo sin copiar el dato a otro sistema y apagar recursos cuando no se usan.",
          "La capa de tablas aporta transacciones, esquema y metadatos sobre archivos. El resultado combina la flexibilidad de un data lake con propiedades que normalmente asociamos a un warehouse.",
        ],
        points: ["El dato persiste aunque termine el clúster", "Varias cargas pueden usar el mismo dato gobernado", "El formato de tabla evita tratar archivos sueltos como una base de datos"],
      },
      {
        kicker: "Superficie de trabajo",
        title: "Workspace, notebook y compute cumplen funciones distintas",
        paragraphs: [
          "El workspace organiza artefactos y colaboración; el notebook contiene código y narrativa; el compute aporta CPU y memoria para ejecutar. Confundir estas capas conduce a permisos excesivos y costes difíciles de explicar.",
          "Para SQL interactivo se usa un SQL warehouse. Para notebooks y tareas de ingeniería puede usarse compute serverless o clásico, según disponibilidad, control requerido y política de la organización.",
        ],
        points: ["Serverless reduce operación de infraestructura", "El compute debe dimensionarse por patrón de carga, no por intuición", "La terminación automática es una medida de coste, no de rendimiento"],
      },
      {
        kicker: "Gobierno",
        title: "Unity Catalog define el perímetro de confianza",
        paragraphs: [
          "Unity Catalog organiza objetos con una jerarquía de tres niveles: catálogo, esquema y objeto. Los privilegios se conceden sobre esa jerarquía y pueden heredarse, lo que simplifica políticas coherentes.",
          "Gobierno no es solo acceso. También incluye descubrimiento, linaje, auditoría y propiedad. Una tabla técnicamente correcta pero sin dueño, descripción o controles sigue siendo un activo débil.",
        ],
        points: ["Usa nombres de tres partes: catalog.schema.table", "Aplica mínimo privilegio a grupos, no a individuos", "Diferencia tablas administradas de datos externos"],
      },
    ],
    code: {
      language: "SQL",
      title: "Explorar el namespace gobernado",
      content: `USE CATALOG main;
USE SCHEMA learning;

CREATE TABLE IF NOT EXISTS events (
  event_id BIGINT,
  event_type STRING,
  event_ts TIMESTAMP
) USING DELTA;

DESCRIBE DETAIL main.learning.events;`,
    },
    lab: {
      title: "Mapea tu primer workspace",
      goal: "Identificar correctamente cada capa y crear una tabla Delta gobernada.",
      steps: ["Abre Catalog Explorer y localiza un catálogo al que tengas USE CATALOG.", "Crea un esquema de aprendizaje o utiliza uno autorizado.", "Ejecuta el bloque SQL y revisa DESCRIBE DETAIL.", "Anota dónde vive el dato, qué compute usaste y quién es propietario del objeto."],
      checkpoint: "Puedes explicar por qué borrar el compute no borra la tabla y localizar sus permisos efectivos.",
      language: "SQL",
      dataset: { name: "workspace_sandbox", schema: ["main", "learning", "events"], preview: [["catalog", "main"], ["schema", "learning"], ["target", "events"]] },
      challenge: "Selecciona el catálogo main y el esquema learning. Después crea events como tabla Delta con event_id BIGINT, event_type STRING y event_ts TIMESTAMP.",
      starterCode: `-- Define el namespace y crea la tabla
USE CATALOG ...;
USE SCHEMA ...;

CREATE TABLE ... (
  event_id BIGINT,
  event_type STRING,
  event_ts TIMESTAMP
) USING ...;`,
      solution: `USE CATALOG main;
USE SCHEMA learning;

CREATE TABLE events (
  event_id BIGINT,
  event_type STRING,
  event_ts TIMESTAMP
) USING DELTA;`,
      checks: [
        { label: "Selecciona el catálogo main", pattern: "use\\s+catalog\\s+main" },
        { label: "Selecciona el esquema learning", pattern: "use\\s+schema\\s+learning" },
        { label: "Crea la tabla events", pattern: "create\\s+table(?:\\s+if\\s+not\\s+exists)?\\s+(?:main\\.learning\\.)?events" },
        { label: "Usa el formato Delta", pattern: "using\\s+delta" },
      ],
      result: { columns: ["catalog", "schema", "table", "format"], rows: [["main", "learning", "events", "DELTA"]] },
      successMessage: "Tabla gobernada creada. El namespace y el formato coinciden con el objetivo.",
      hints: ["USE CATALOG y USE SCHEMA establecen el namespace de la sesión.", "El formato se declara al final con USING DELTA."],
    },
    questions: [
      { question: "¿Qué persiste cuando se termina el compute?", options: ["Solo el notebook", "Los datos en almacenamiento y sus metadatos", "La memoria del ejecutor", "El caché local del clúster"], answer: 1, explanation: "El cómputo es efímero. Los datos y metadatos se mantienen en las capas de almacenamiento y catálogo." },
      { question: "¿Qué recurso es específico para consultas SQL interactivas?", options: ["Model Registry", "SQL warehouse", "Repos", "Feature Store"], answer: 1, explanation: "Un SQL warehouse proporciona cómputo optimizado y un endpoint para Databricks SQL." },
      { question: "¿Cuál es el orden correcto del namespace de Unity Catalog?", options: ["schema.catalog.table", "workspace.cluster.table", "catalog.schema.table", "table.schema.catalog"], answer: 2, explanation: "Unity Catalog usa nombres de tres partes: catálogo, esquema y objeto." },
      { question: "¿Cuál es la mejor práctica de acceso?", options: ["Conceder ALL PRIVILEGES a cada analista", "Compartir un usuario técnico", "Conceder mínimo privilegio a grupos", "Evitar propietarios"], answer: 2, explanation: "Los grupos y el mínimo privilegio hacen la política auditable, mantenible y menos frágil." },
    ],
    source: { label: "Documentación: conceptos de tablas", href: "https://docs.databricks.com/aws/en/tables/tables-concepts" },
  },
  {
    number: "02",
    title: "Apache Spark en profundidad",
    short: "Spark",
    level: "Intermedio",
    exam: "Associate + Professional",
    duration: "70 min",
    icon: "✦",
    description: "Pasa de usar DataFrames a razonar sobre planes, particiones, shuffles y coste de ejecución distribuida.",
    outcomes: ["Diferenciar transformaciones y acciones", "Leer un plan físico", "Reducir shuffles y movimiento de datos"],
    sections: [
      {
        kicker: "Ejecución",
        title: "Spark construye un plan antes de tocar los datos",
        paragraphs: [
          "Las transformaciones como select, filter o join son perezosas: describen un plan lógico. Una acción como count, collect o write desencadena la optimización y ejecución del grafo completo.",
          "Esta pereza permite que Catalyst elimine columnas, empuje filtros y reorganice operaciones. También significa que encadenar transformaciones no equivale a ejecutar repetidamente.",
        ],
        points: ["Transformación: produce otro DataFrame", "Acción: solicita un resultado o materializa una salida", "explain() revela el plan, no ejecuta la carga"],
      },
      {
        kicker: "Distribución",
        title: "El shuffle suele dominar el coste",
        paragraphs: [
          "Agrupaciones, joins y repartition pueden redistribuir datos entre ejecutores. Ese movimiento implica red, serialización y escritura temporal; por eso un shuffle grande cuesta mucho más que una proyección local.",
          "Un broadcast join evita redistribuir la tabla grande cuando una dimensión es suficientemente pequeña. No debe forzarse sin comprobar tamaño y memoria: un broadcast demasiado grande puede desestabilizar ejecutores.",
        ],
        points: ["Filtra y proyecta antes de un join", "Vigila skew: pocas claves concentran demasiadas filas", "No uses repartition como receta universal"],
      },
      {
        kicker: "API",
        title: "Las funciones nativas preservan optimización",
        paragraphs: [
          "Las expresiones nativas de Spark quedan visibles para el optimizador. Una UDF opaca parte de esa lógica y puede introducir costes de serialización entre runtimes.",
          "Prefiere funciones built-in y expresiones SQL. Usa una UDF cuando la regla no pueda expresarse razonablemente con funciones nativas y mide su impacto con datos representativos.",
        ],
        points: ["Evita collect() sobre datos no acotados", "Cachea solo cuando reutilizas y puedes medir el beneficio", "Compara planes antes y después de optimizar"],
      },
    ],
    code: {
      language: "Python",
      title: "Plan y agregación distribuida",
      content: `from pyspark.sql import functions as F

orders = spark.table("main.sales.orders")

daily = (
    orders
      .filter(F.col("status") == "COMPLETE")
      .select("order_date", "customer_id", "amount")
      .groupBy("order_date")
      .agg(F.sum("amount").alias("revenue"))
)

daily.explain("formatted")
daily.write.mode("overwrite").saveAsTable("main.sales.daily_revenue")`,
    },
    lab: {
      title: "Diagnostica un plan",
      goal: "Localizar un shuffle y justificar una mejora con evidencia.",
      steps: ["Ejecuta una agregación sobre una tabla de muestra y abre explain('formatted').", "Localiza Exchange: marca el límite de redistribución.", "Añade un filtro y selección de columnas antes de la agregación.", "Compara filas leídas, tiempo y plan; documenta qué cambió y qué no."],
      checkpoint: "Puedes señalar la acción, el shuffle y el motivo por el que la versión revisada procesa menos datos.",
      language: "Python",
      dataset: { name: "main.sales.orders", schema: ["order_id BIGINT", "order_date DATE", "status STRING", "amount DOUBLE"], preview: [["101", "2026-07-18", "COMPLETE", "120.50"], ["102", "2026-07-18", "CANCELLED", "45.00"], ["103", "2026-07-19", "COMPLETE", "79.50"]] },
      challenge: "Lee main.sales.orders con spark.table, filtra status = COMPLETE, agrupa por order_date y calcula revenue como suma de amount.",
      starterCode: `from pyspark.sql import functions as F

orders = spark.table("...")

daily = (
    orders
      # completa las transformaciones
)

display(daily)`,
      solution: `from pyspark.sql import functions as F

orders = spark.table("main.sales.orders")

daily = (
    orders
      .filter(F.col("status") == "COMPLETE")
      .groupBy("order_date")
      .agg(F.sum("amount").alias("revenue"))
)

display(daily)`,
      checks: [
        { label: "Lee la tabla con spark.table", pattern: "spark\\.table\\(\\s*[\"']main\\.sales\\.orders[\"']\\s*\\)" },
        { label: "Filtra pedidos COMPLETE", pattern: "\\.filter\\([^\\n]*complete" },
        { label: "Agrupa por order_date", pattern: "\\.groupby\\(\\s*[\"']order_date[\"']\\s*\\)" },
        { label: "Suma amount como revenue", pattern: "sum\\(\\s*[\"']amount[\"']\\s*\\).*alias\\(\\s*[\"']revenue[\"']" },
      ],
      result: { columns: ["order_date", "revenue"], rows: [["2026-07-18", "120.50"], ["2026-07-19", "79.50"]] },
      successMessage: "Transformación válida. El resultado conserva solo pedidos completos y agrega por día.",
      hints: ["Encadena filter antes de groupBy para reducir filas antes del shuffle.", "La agregación esperada es F.sum('amount').alias('revenue')."],
    },
    questions: [
      { question: "¿Qué ocurre al llamar a filter() sobre un DataFrame?", options: ["Se leen todos los archivos", "Se ejecuta un job inmediatamente", "Se añade una transformación al plan", "Se crea una tabla Delta"], answer: 2, explanation: "filter() es una transformación perezosa; añade lógica al plan sin ejecutar aún el job." },
      { question: "¿Qué operación suele provocar un shuffle?", options: ["select de una columna", "groupBy por una clave", "withColumn con literal", "limit en el driver"], answer: 1, explanation: "Para agrupar una clave, Spark normalmente debe reunir valores iguales desde distintas particiones." },
      { question: "¿Cuándo tiene sentido un broadcast join?", options: ["Cuando ambas tablas son enormes", "Cuando una tabla es pequeña y cabe con seguridad en memoria", "Siempre que exista skew", "Solo en streaming"], answer: 1, explanation: "Replicar una dimensión pequeña evita redistribuir la tabla grande, siempre que el tamaño sea seguro." },
      { question: "¿Por qué se prefieren funciones nativas a una UDF?", options: ["Nunca pueden fallar", "El optimizador puede entenderlas y optimizarlas", "Solo usan el driver", "No requieren esquema"], answer: 1, explanation: "Las expresiones nativas permanecen visibles para Catalyst y suelen evitar barreras de serialización." },
    ],
    source: { label: "Documentación: PySpark en Databricks", href: "https://docs.databricks.com/aws/en/pyspark/" },
  },
  {
    number: "03",
    title: "Ingesta incremental y Auto Loader",
    short: "Ingesta",
    level: "Intermedio",
    exam: "Associate + Professional",
    duration: "75 min",
    icon: "▱",
    description: "Elige el patrón correcto para cargas batch e incrementales y controla esquema, checkpoints y evolución.",
    outcomes: ["Elegir COPY INTO, Auto Loader o streaming", "Diseñar una ingesta incremental", "Separar schemaLocation y checkpointLocation"],
    sections: [
      {
        kicker: "Patrones de carga",
        title: "Batch e incremental resuelven problemas distintos",
        paragraphs: [
          "COPY INTO carga archivos de forma idempotente al mantener registro de los ya procesados. Es una buena opción SQL para ingestiones periódicas y sencillas desde almacenamiento cloud o Volumes.",
          "Auto Loader está diseñado para descubrir y procesar nuevos archivos de forma incremental a escala. Usa el origen cloudFiles y mantiene estado para no releer todo el directorio.",
        ],
        points: ["COPY INTO: batch SQL idempotente", "Auto Loader: descubrimiento incremental escalable", "Una carga completa sigue siendo válida para datasets pequeños y acotados"],
      },
      {
        kicker: "Estado",
        title: "El checkpoint es la memoria operativa del stream",
        paragraphs: [
          "checkpointLocation registra el progreso de una consulta de streaming: offsets, commits y estado necesario para continuar. Reutilizar o borrar checkpoints sin entender la semántica puede reprocesar datos.",
          "cloudFiles.schemaLocation conserva el esquema inferido y su evolución. Aunque ambos paths pueden coincidir en algunos patrones, representan responsabilidades distintas y conviene diseñarlos explícitamente.",
        ],
        points: ["Un checkpoint pertenece a una única consulta", "No lo borres para arreglar un bug de código", "Los paths de estado deben ser durables y únicos"],
      },
      {
        kicker: "Esquema",
        title: "Inferir no equivale a gobernar",
        paragraphs: [
          "La inferencia acelera el arranque, pero una pipeline productiva necesita una política de evolución y columnas rescatadas. Auto Loader puede capturar datos que no encajan en el esquema para evitar pérdida silenciosa.",
          "En bronze suele preservarse el payload con metadatos de origen; la validación fuerte llega en silver. Esta separación permite reejecutar transformaciones sin volver a contactar la fuente.",
        ],
        points: ["Conserva nombre de archivo y timestamp de ingesta", "Define cómo tratar columnas nuevas", "No promuevas automáticamente cualquier cambio de tipo"],
      },
    ],
    code: {
      language: "Python",
      title: "Auto Loader con estado separado",
      content: `landing = "/Volumes/main/landing/orders"

stream = (
  spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", "/Volumes/main/state/orders/schema")
    .load(landing)
)

(stream.writeStream
  .option("checkpointLocation", "/Volumes/main/state/orders/checkpoint")
  .trigger(availableNow=True)
  .toTable("main.bronze.orders"))`,
    },
    lab: {
      title: "Carga nuevos JSON con COPY INTO",
      goal: "Escribir una ingesta SQL idempotente desde un Volume a una tabla bronze.",
      steps: ["Revisa la ruta y el esquema de los archivos de entrada.", "Escribe COPY INTO sobre main.bronze.orders.", "Declara JSON como formato de origen y activa inferSchema.", "Ejecuta dos veces y comprueba que los archivos ya cargados no se duplican."],
      checkpoint: "La segunda ejecución no añade filas porque COPY INTO reconoce los archivos procesados.",
      language: "SQL",
      dataset: { name: "/Volumes/main/landing/orders", schema: ["order_id BIGINT", "order_ts TIMESTAMP", "customer_id BIGINT", "amount DOUBLE"], preview: [["1001", "2026-07-18T09:00:00", "81", "120.50"], ["1002", "2026-07-18T09:04:00", "22", "45.00"], ["1003", "2026-07-18T09:08:00", "81", "79.50"]] },
      challenge: "Carga los JSON de /Volumes/main/landing/orders en main.bronze.orders con COPY INTO. Activa inferSchema dentro de FORMAT_OPTIONS.",
      starterCode: `COPY INTO ...
FROM '...'
FILEFORMAT = ...
FORMAT_OPTIONS (...);`,
      solution: `COPY INTO main.bronze.orders
FROM '/Volumes/main/landing/orders'
FILEFORMAT = JSON
FORMAT_OPTIONS ('inferSchema' = 'true');`,
      checks: [
        { label: "Usa COPY INTO sobre la tabla bronze", pattern: "copy\\s+into\\s+main\\.bronze\\.orders" },
        { label: "Lee desde el Volume indicado", pattern: "from\\s+[\"']/volumes/main/landing/orders[\"']" },
        { label: "Declara JSON como formato", pattern: "fileformat\\s*=\\s*json" },
        { label: "Activa inferSchema", pattern: "format_options[\\s\\S]*inferschema[\"']?\\s*=\\s*[\"']true" },
      ],
      result: { columns: ["files_loaded", "rows_loaded", "status"], rows: [["3", "3", "SUCCESS"]] },
      successMessage: "Carga completada. Una segunda ejecución simulará 0 archivos nuevos por idempotencia.",
      hints: ["La tabla objetivo va justo después de COPY INTO.", "FORMAT_OPTIONS recibe pares clave/valor; usa 'inferSchema' = 'true'."],
    },
    questions: [
      { question: "¿Qué patrón SQL evita volver a cargar archivos ya procesados?", options: ["INSERT OVERWRITE", "COPY INTO", "CACHE TABLE", "VACUUM"], answer: 1, explanation: "COPY INTO mantiene registro de archivos cargados y ofrece un patrón batch idempotente." },
      { question: "¿Qué formato activa Auto Loader?", options: ["deltaFiles", "cloudFiles", "autoStream", "fileLoader"], answer: 1, explanation: "Auto Loader se configura con .format('cloudFiles') y el formato real en cloudFiles.format." },
      { question: "¿Qué guarda checkpointLocation?", options: ["Solo el esquema", "Progreso y estado de la consulta streaming", "Las credenciales", "El código del notebook"], answer: 1, explanation: "El checkpoint permite reanudar una consulta manteniendo offsets, commits y estado." },
      { question: "¿Dónde conviene aplicar reglas de calidad fuertes en medallion?", options: ["Solo en el fichero fuente", "En silver, preservando bronze para trazabilidad", "Después de gold", "En el driver"], answer: 1, explanation: "Bronze conserva la entrada; silver aplica conformado, deduplicación y calidad reutilizable." },
    ],
    source: { label: "Documentación: Auto Loader", href: "https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/auto-loader/" },
  },
  {
    number: "04",
    title: "Delta Lake y modelado fiable",
    short: "Delta",
    level: "Avanzado",
    exam: "Associate + Professional",
    duration: "80 min",
    icon: "◇",
    description: "Construye tablas transaccionales, cargas incrementales idempotentes y capas medallion con contratos explícitos.",
    outcomes: ["Razonar sobre el log transaccional", "Diseñar MERGE idempotente", "Gestionar esquema, historial y calidad"],
    sections: [
      {
        kicker: "Tabla abierta",
        title: "Delta añade un protocolo transaccional a archivos",
        paragraphs: [
          "Una tabla Delta combina archivos de datos con un transaction log que registra versiones y acciones. Los lectores obtienen una instantánea coherente; los escritores aplican control de concurrencia en lugar de editar archivos a ciegas.",
          "ACID no elimina la necesidad de diseñar claves, contratos y procesos idempotentes. Garantiza consistencia transaccional, no semántica de negocio.",
        ],
        points: ["Cada commit produce una nueva versión", "Los lectores trabajan sobre snapshots coherentes", "La tabla es más que una carpeta de Parquet"],
      },
      {
        kicker: "Medallion",
        title: "Bronze, silver y gold separan responsabilidades",
        paragraphs: [
          "Bronze preserva la entrada con mínima transformación; silver normaliza, deduplica y aplica reglas; gold presenta entidades y métricas orientadas a consumo. No son tres copias arbitrarias, sino contratos con propósitos distintos.",
          "MERGE es útil para upserts, pero la condición debe identificar de forma estable la fila objetivo. Si la fuente contiene duplicados para la misma clave, debes resolverlos antes del merge.",
        ],
        points: ["Bronze optimiza trazabilidad", "Silver concentra calidad y conformado", "Gold se diseña desde el caso de uso"],
      },
      {
        kicker: "Evolución",
        title: "El esquema es un contrato, no un accidente",
        paragraphs: [
          "Delta aplica enforcement al escribir: los datos deben ser compatibles con el esquema. La evolución puede habilitarse de forma explícita para cambios soportados, pero automatizarla sin controles puede propagar columnas inesperadas.",
          "Time travel consulta versiones anteriores mientras los archivos necesarios sigan retenidos. No sustituye un backup ni garantiza recuperación después de eliminar físicamente archivos antiguos.",
        ],
        points: ["Diferencia enforcement de evolution", "Revisa retención antes de depender de time travel", "Usa historial para investigar cambios"],
      },
    ],
    code: {
      language: "SQL",
      title: "Upsert incremental e histórico",
      content: `MERGE INTO main.silver.customers AS target
USING main.bronze.customer_updates AS source
ON target.customer_id = source.customer_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;

DESCRIBE HISTORY main.silver.customers;

SELECT * FROM main.silver.customers VERSION AS OF 12;`,
    },
    lab: {
      title: "Prueba la idempotencia",
      goal: "Ejecutar dos veces la misma carga sin duplicar ni degradar datos.",
      steps: ["Crea una fuente con dos actualizaciones para la misma customer_id.", "Deduplica por clave conservando el updated_at más reciente.", "Ejecuta MERGE y registra conteo y hash de control.", "Repite exactamente la misma carga y demuestra que el resultado no cambia."],
      checkpoint: "La segunda ejecución produce cero cambio semántico y puedes justificar la condición de MATCH.",
      language: "SQL",
      dataset: { name: "main.bronze.customer_updates", schema: ["customer_id BIGINT", "email STRING", "updated_at TIMESTAMP"], preview: [["7", "ana@example.com", "2026-07-18T10:00:00"], ["7", "ana.new@example.com", "2026-07-18T11:00:00"], ["9", "leo@example.com", "2026-07-18T10:30:00"]] },
      challenge: "Haz MERGE de customer_updates sobre main.silver.customers por customer_id. Actualiza solo cuando source.updated_at sea más reciente e inserta las claves nuevas.",
      starterCode: `MERGE INTO main.silver.customers AS target
USING main.bronze.customer_updates AS source
ON ...
WHEN MATCHED AND ... THEN
  UPDATE SET *
WHEN ... THEN
  ...;`,
      solution: `MERGE INTO main.silver.customers AS target
USING main.bronze.customer_updates AS source
ON target.customer_id = source.customer_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;`,
      checks: [
        { label: "Usa MERGE sobre la tabla silver", pattern: "merge\\s+into\\s+main\\.silver\\.customers" },
        { label: "Une por customer_id", pattern: "target\\.customer_id\\s*=\\s*source\\.customer_id" },
        { label: "Protege contra actualizaciones antiguas", pattern: "source\\.updated_at\\s*>\\s*target\\.updated_at" },
        { label: "Inserta claves nuevas", pattern: "when\\s+not\\s+matched[\\s\\S]*insert" },
      ],
      result: { columns: ["customer_id", "email", "operation"], rows: [["7", "ana.new@example.com", "UPDATE"], ["9", "leo@example.com", "INSERT"]] },
      successMessage: "MERGE válido. La condición evita que una actualización antigua reemplace datos más recientes.",
      hints: ["La condición ON identifica la entidad; la condición de WHEN MATCHED decide si actualizar.", "Las filas nuevas se manejan con WHEN NOT MATCHED THEN INSERT *."],
    },
    questions: [
      { question: "¿Qué registra el Delta transaction log?", options: ["Solo permisos", "Versiones y acciones sobre la tabla", "El caché de Spark", "Contraseñas de conexión"], answer: 1, explanation: "El log permite reconstruir snapshots y coordinar commits sobre los archivos de datos." },
      { question: "¿Qué debe ocurrir antes de MERGE si la fuente repite la clave?", options: ["Aumentar el warehouse", "Deduplicar con una regla determinista", "Ejecutar VACUUM", "Convertir todo a STRING"], answer: 1, explanation: "Múltiples filas fuente para el mismo objetivo hacen ambiguo el upsert; hay que resolverlas primero." },
      { question: "¿Qué describe mejor silver?", options: ["Copia inmutable de la entrada", "Datos conformados con calidad aplicada", "Dashboard final", "Solo archivos temporales"], answer: 1, explanation: "Silver concentra limpieza, normalización, deduplicación y reglas de calidad reutilizables." },
      { question: "¿Qué limitación tiene time travel?", options: ["Solo funciona con CSV", "Depende de que los archivos históricos sigan retenidos", "No admite SQL", "Duplica siempre la tabla"], answer: 1, explanation: "Si el mantenimiento elimina archivos necesarios, una versión antigua ya no puede reconstruirse." },
    ],
    source: { label: "Documentación: Delta Lake", href: "https://docs.databricks.com/aws/en/delta/" },
  },
  {
    number: "05",
    title: "Pipelines declarativos y calidad",
    short: "Pipelines",
    level: "Avanzado",
    exam: "Professional",
    duration: "90 min",
    icon: "⌘",
    description: "Construye pipelines declarativos con streaming tables, materialized views, expectations y gestión incremental.",
    outcomes: ["Elegir streaming table o materialized view", "Aplicar expectations de calidad", "Diseñar CDC y observabilidad"],
    sections: [
      {
        kicker: "Declarativo",
        title: "Describe el resultado; el sistema resuelve la ejecución",
        paragraphs: [
          "Lakeflow Declarative Pipelines permite declarar tablas y vistas a partir de consultas. El motor construye dependencias, administra ejecución incremental y registra eventos del pipeline.",
          "Una streaming table procesa nuevas entradas de manera incremental; una materialized view recalcula resultados de consulta mediante estrategias gestionadas. La elección depende de semántica, no solo de latencia.",
        ],
        points: ["Streaming table: flujo incremental", "Materialized view: resultado mantenido de una consulta", "La dependencia se infiere de las lecturas"],
      },
      {
        kicker: "Calidad",
        title: "Una expectation hace visible la decisión sobre datos inválidos",
        paragraphs: [
          "Las expectations expresan una condición y una acción: registrar, descartar o fallar. Elegir la acción exige distinguir si una fila inválida es tolerable, corregible o compromete todo el dataset.",
          "Fallar protege contratos estrictos, pero también detiene downstream. Descartar mantiene el flujo, aunque requiere métricas y una vía para investigar lo rechazado.",
        ],
        points: ["EXPECT: observa", "EXPECT OR DROP: excluye filas", "EXPECT OR FAIL: aborta la actualización"],
      },
      {
        kicker: "CDC y operación",
        title: "El orden de cambios importa tanto como la clave",
        paragraphs: [
          "Un flujo CDC debe identificar claves y una secuencia que ordene actualizaciones. Sin orden estable, un evento antiguo puede sobrescribir un estado más reciente.",
          "El event log del pipeline permite observar progreso, calidad y fallos. La observabilidad debe conectarse a alertas y SLOs; consultar el log solo durante incidentes llega demasiado tarde.",
        ],
        points: ["Define keys y sequence_by", "Decide SCD tipo 1 o 2", "Monitoriza expectativas y duración de updates"],
      },
    ],
    code: {
      language: "Python",
      title: "Streaming table con expectation",
      content: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.table(name="orders_silver")
@dp.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dp.expect("non_negative_amount", "amount >= 0")
def orders_silver():
    return (
        spark.readStream.table("main.bronze.orders")
          .withColumn("order_date", F.to_date("order_ts"))
    )`,
    },
    lab: {
      title: "Declara una streaming table con calidad",
      goal: "Crear una tabla silver incremental que descarte filas sin order_id y registre importes negativos.",
      steps: ["Importa pipelines como dp y functions como F.", "Declara orders_silver con @dp.table.", "Añade expect_or_drop para order_id y expect para amount.", "Lee main.bronze.orders con spark.readStream.table."],
      checkpoint: "La definición es declarativa, incremental y diferencia claramente la política de cada regla de calidad.",
      language: "Python",
      dataset: { name: "main.bronze.orders", schema: ["order_id BIGINT", "order_ts TIMESTAMP", "amount DOUBLE"], preview: [["1001", "2026-07-18T09:00:00", "120.50"], ["null", "2026-07-18T09:02:00", "40.00"], ["1003", "2026-07-18T09:08:00", "-5.00"]] },
      challenge: "Define orders_silver como tabla declarativa. Descarta order_id nulos, registra amount negativo sin detener el pipeline y lee la tabla bronze como stream.",
      starterCode: `from pyspark import pipelines as dp

# añade decoradores de tabla y calidad
def orders_silver():
    return ...`,
      solution: `from pyspark import pipelines as dp

@dp.table(name="orders_silver")
@dp.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dp.expect("non_negative_amount", "amount >= 0")
def orders_silver():
    return spark.readStream.table("main.bronze.orders")`,
      checks: [
        { label: "Declara la tabla orders_silver", pattern: "@dp\\.table\\([^)]*orders_silver" },
        { label: "Descarta order_id nulos", pattern: "@dp\\.expect_or_drop\\([^)]*order_id\\s+is\\s+not\\s+null" },
        { label: "Registra la regla de amount", pattern: "@dp\\.expect\\([^)]*amount\\s*>=\\s*0" },
        { label: "Lee bronze como stream", pattern: "spark\\.readstream\\.table\\(\\s*[\"']main\\.bronze\\.orders[\"']\\s*\\)" },
      ],
      result: { columns: ["dataset", "accepted", "dropped", "quality_warnings"], rows: [["orders_silver", "2", "1", "1"]] },
      successMessage: "Pipeline válido. La fila sin order_id se descarta y el importe negativo queda registrado como métrica de calidad.",
      hints: ["Los decoradores se aplican encima de def orders_silver().", "expect_or_drop elimina; expect registra la violación y conserva la fila."],
    },
    questions: [
      { question: "¿Qué hace EXPECT OR DROP?", options: ["Detiene todo el pipeline", "Registra y descarta filas inválidas", "Corrige valores automáticamente", "Borra la tabla"], answer: 1, explanation: "La expectation registra la métrica y excluye las filas que no cumplen la condición." },
      { question: "¿Qué objeto conviene para una fuente incremental continua?", options: ["Streaming table", "Temporary view local", "Scalar function", "Dashboard"], answer: 0, explanation: "Una streaming table mantiene incrementalmente un flujo de entradas nuevas." },
      { question: "¿Qué necesita un CDC para ordenar cambios?", options: ["Solo el nombre de tabla", "Clave y columna de secuencia", "Un SQL warehouse grande", "VACUUM diario"], answer: 1, explanation: "La clave identifica la entidad y sequence_by decide qué cambio es más reciente." },
      { question: "¿Dónde se observan eventos y métricas del pipeline?", options: ["Solo en stdout", "En el event log", "En el Model Registry", "En el navegador del usuario"], answer: 1, explanation: "El event log registra actualizaciones, progreso, calidad y detalles operativos del pipeline." },
    ],
    source: { label: "Documentación: Lakeflow Declarative Pipelines", href: "https://docs.databricks.com/aws/en/ldp/" },
  },
  {
    number: "06",
    title: "Producción con Lakeflow Jobs",
    short: "Producción",
    level: "Avanzado",
    exam: "Associate + Professional",
    duration: "90 min",
    icon: "↗",
    description: "Diseña DAGs idempotentes, observables y gobernados para sustituir ejecuciones manuales de notebooks.",
    outcomes: ["Diseñar un job multi-tarea", "Gestionar fallos y reintentos", "Definir criterios reales de producción"],
    sections: [
      {
        kicker: "Orquestación",
        title: "Un job expresa dependencias, no una lista de notebooks",
        paragraphs: [
          "Lakeflow Jobs organiza tareas en un DAG: una tarea debe depender solo de salidas necesarias, permitiendo paralelismo y recuperación localizada. Un notebook monolítico oculta esas fronteras.",
          "Parametriza entorno y ventana de proceso en vez de editar código. Las tareas deben ser idempotentes para que un reintento no duplique resultados ni corrompa estado.",
        ],
        points: ["Separa ingestión, calidad y publicación", "Explicita dependencias de datos", "Diseña para reejecución segura"],
      },
      {
        kicker: "Fiabilidad",
        title: "Reintentar solo ayuda ante fallos transitorios",
        paragraphs: [
          "Un retry puede resolver una interrupción temporal, pero repite un bug determinista y puede empeorar una escritura no idempotente. Clasifica fallos y limita reintentos con backoff.",
          "Observabilidad combina estado de la tarea, métricas de datos, logs y alertas accionables. Una notificación que no identifica impacto, run y punto de fallo produce ruido, no operación.",
        ],
        points: ["Alerta sobre impacto, no sobre cada evento", "Distingue calidad de fallo técnico", "Conserva run_id y parámetros para diagnóstico"],
      },
      {
        kicker: "Entrega",
        title: "Producción es un conjunto de garantías",
        paragraphs: [
          "Promover código requiere versionado, revisión, pruebas y configuración separada del código. Las credenciales deben resolverse mediante mecanismos de secretos o identidades de servicio, nunca incrustarse en notebooks.",
          "Define SLOs de frescura y éxito, ownership, runbook y estrategia de rollback. Si el equipo no sabe detectar, mitigar y recuperar un fallo, el pipeline aún no está listo para producción.",
        ],
        points: ["Código revisado y versionado", "Configuración por entorno", "SLO, alertas, runbook y rollback"],
      },
    ],
    code: {
      language: "Python",
      title: "Esqueleto idempotente por ventana",
      content: `from datetime import date
from pyspark.sql import functions as F

process_date = dbutils.widgets.get("process_date")
source = spark.table("main.bronze.events")

batch = source.filter(F.to_date("event_ts") == F.lit(process_date))

(batch.write
  .format("delta")
  .mode("overwrite")
  .option("replaceWhere", f"event_date = '{process_date}'")
  .saveAsTable("main.silver.events"))`,
    },
    lab: {
      title: "Lleva un flujo a producción",
      goal: "Transformar una secuencia manual en un DAG operable.",
      steps: ["Divide ingestión, validación y publicación en tareas con límites claros.", "Añade process_date como parámetro y prueba la reejecución de la misma ventana.", "Configura retry solo para una tarea con fallo transitorio simulado.", "Define alerta, SLO de frescura y un runbook de cinco pasos."],
      checkpoint: "Puedes reejecutar una fecha sin duplicados y explicar cómo detectar, contener y recuperar un fallo.",
      language: "Python",
      dataset: { name: "main.bronze.events", schema: ["event_id BIGINT", "event_ts TIMESTAMP", "event_date DATE", "payload STRING"], preview: [["501", "2026-07-18T08:00:00", "2026-07-18", "open"], ["502", "2026-07-18T08:02:00", "2026-07-18", "click"], ["503", "2026-07-19T09:00:00", "2026-07-19", "open"]] },
      challenge: "Filtra main.bronze.events por process_date y sobrescribe solo esa partición en main.silver.events usando replaceWhere. El código debe ser seguro al reintentarse.",
      starterCode: `process_date = "2026-07-18"
source = spark.table("...")

batch = source.filter(...)

(batch.write
  .format("delta")
  .mode(...)
  .option(...)
  .saveAsTable(...))`,
      solution: `from pyspark.sql import functions as F

process_date = "2026-07-18"
source = spark.table("main.bronze.events")
batch = source.filter(F.col("event_date") == process_date)

(batch.write
  .format("delta")
  .mode("overwrite")
  .option("replaceWhere", f"event_date = '{process_date}'")
  .saveAsTable("main.silver.events"))`,
      checks: [
        { label: "Lee la fuente bronze", pattern: "spark\\.table\\(\\s*[\"']main\\.bronze\\.events[\"']\\s*\\)" },
        { label: "Filtra por event_date", pattern: "\\.filter\\([^\\n]*event_date" },
        { label: "Sobrescribe de forma controlada", pattern: "\\.mode\\(\\s*[\"']overwrite[\"']\\s*\\)" },
        { label: "Limita la escritura con replaceWhere", pattern: "\\.option\\(\\s*[\"']replacewhere[\"']" },
        { label: "Publica en silver", pattern: "saveastable\\(\\s*[\"']main\\.silver\\.events[\"']\\s*\\)" },
      ],
      result: { columns: ["event_date", "rows_written", "target", "retry_safe"], rows: [["2026-07-18", "2", "main.silver.events", "true"]] },
      successMessage: "Escritura acotada por partición. Repetir la misma fecha reemplaza esa ventana en vez de duplicarla.",
      hints: ["mode('overwrite') sin replaceWhere sería demasiado amplio.", "replaceWhere debe expresar la misma ventana usada en el filtro."],
    },
    questions: [
      { question: "¿Qué propiedad hace seguro un retry?", options: ["Más memoria", "Idempotencia", "Un nombre corto", "Un dashboard"], answer: 1, explanation: "Una tarea idempotente produce el mismo estado correcto al repetirse con la misma entrada." },
      { question: "¿Cuándo es apropiado reintentar?", options: ["Ante cualquier bug", "Ante fallos transitorios acotados", "Cuando una regla de calidad falla siempre", "Para corregir credenciales inválidas"], answer: 1, explanation: "Los reintentos ayudan con fallos temporales; los deterministas requieren corregir causa o entrada." },
      { question: "¿Qué describe mejor un DAG?", options: ["Una lista visual sin dependencias", "Tareas y dependencias dirigidas sin ciclos", "Un tipo de tabla", "Un clúster compartido"], answer: 1, explanation: "El DAG expresa orden y paralelismo mediante dependencias dirigidas acíclicas." },
      { question: "¿Qué conjunto indica preparación operativa?", options: ["Notebook y captura de pantalla", "SLO, alertas, runbook y rollback", "Solo auto-scaling", "Un propietario sin pruebas"], answer: 1, explanation: "Producción exige garantías para detectar, responder y recuperar, además de ejecutar código." },
    ],
    source: { label: "Documentación: Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/" },
  },
];

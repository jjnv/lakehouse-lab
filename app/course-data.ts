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
  duration: string;
  icon: string;
  description: string;
  outcomes: string[];
  sections: LessonSection[];
  code: { language: string; title: string; content: string };
  lab: { title: string; goal: string; steps: string[]; checkpoint: string };
  questions: TestQuestion[];
  source: { label: string; href: string };
};

export const modules: CourseModule[] = [
  {
    number: "01",
    title: "Fundamentos de Lakehouse",
    short: "Lakehouse",
    level: "Base",
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
    title: "SQL y analítica gobernada",
    short: "SQL",
    level: "Intermedio",
    duration: "65 min",
    icon: "▱",
    description: "Diseña consultas mantenibles, elige un warehouse y publica métricas que conserven contexto y permisos.",
    outcomes: ["Modelar consultas analíticas robustas", "Optimizar lectura y joins", "Publicar un dashboard gobernado"],
    sections: [
      {
        kicker: "Compute SQL",
        title: "El warehouse es el motor, no el dato",
        paragraphs: [
          "Un SQL warehouse ejecuta consultas y atiende conexiones BI, mientras las tablas permanecen en el catálogo. Separar ambos conceptos permite escalar concurrencia sin duplicar la fuente de verdad.",
          "Serverless simplifica arranque, escalado y mantenimiento cuando está disponible. La elección de tamaño y auto-stop debe basarse en latencia, concurrencia y coste observados.",
        ],
        points: ["Escala por concurrencia, no solo por volumen", "Usa auto-stop para cargas intermitentes", "Consulta Query History antes de sobredimensionar"],
      },
      {
        kicker: "Semántica",
        title: "Una métrica necesita definición además de SQL",
        paragraphs: [
          "Una consulta correcta puede producir una métrica incorrecta si mezcla granularidades o duplica filas en un join. Declara el grano de cada relación y valida unicidad antes de agregar.",
          "Las vistas sirven para encapsular lógica reutilizable, pero no reemplazan documentación, ownership ni pruebas. Publica significado, filtros temporales y supuestos junto al resultado.",
        ],
        points: ["Declara el grano: una fila representa…", "Valida claves antes de unir", "Diferencia dimensiones, hechos y métricas derivadas"],
      },
      {
        kicker: "Entrega",
        title: "Un dashboard es una interfaz operativa",
        paragraphs: [
          "Los dashboards AI/BI permiten convertir datasets en visualizaciones compartibles. El consumidor debe entender periodo, unidad, frescura y filtros sin abrir el SQL.",
          "El acceso al dashboard no debe romper el gobierno del dato subyacente. Revisa el modo de publicación y la identidad con la que se ejecutan consultas antes de ampliar audiencia.",
        ],
        points: ["Incluye fecha de actualización", "Reduce visualizaciones a decisiones concretas", "Prueba filtros y estados sin datos"],
      },
    ],
    code: {
      language: "SQL",
      title: "Métrica con grano explícito",
      content: `WITH orders AS (
  SELECT
    date_trunc('day', order_ts) AS order_day,
    order_id,
    customer_id,
    net_amount
  FROM main.sales.orders
  WHERE order_status = 'COMPLETE'
)
SELECT
  order_day,
  count(DISTINCT order_id) AS orders,
  sum(net_amount) AS revenue,
  sum(net_amount) / nullif(count(DISTINCT order_id), 0) AS aov
FROM orders
GROUP BY order_day
ORDER BY order_day;`,
    },
    lab: {
      title: "Publica un KPI defendible",
      goal: "Crear una métrica que otro analista pueda auditar y reutilizar.",
      steps: ["Escribe en una frase el grano de la tabla de origen.", "Construye pedidos, ingresos y ticket medio sin duplicación por joins.", "Verifica tres días manualmente contra filas de detalle.", "Crea una visualización con periodo, unidad, frescura y filtro documentados."],
      checkpoint: "Otro usuario puede explicar el KPI y reproducir un día concreto desde el detalle.",
    },
    questions: [
      { question: "¿Dónde permanecen los datos al detener un SQL warehouse?", options: ["En el caché del warehouse", "En las tablas gobernadas del almacenamiento", "En el navegador", "Se eliminan"], answer: 1, explanation: "El warehouse aporta cómputo; las tablas y metadatos persisten independientemente." },
      { question: "¿Qué riesgo introduce un join many-to-many antes de sumar?", options: ["Reduce la precisión decimal", "Duplica filas y puede inflar la métrica", "Desactiva Unity Catalog", "Impide usar filtros"], answer: 1, explanation: "Si ambos lados repiten la clave, el join multiplica combinaciones y distorsiona agregados." },
      { question: "¿Qué debe guiar el tamaño de un warehouse?", options: ["El número de notebooks", "Latencia, concurrencia y coste medidos", "El nombre del catálogo", "La cantidad de dashboards publicados"], answer: 1, explanation: "La configuración correcta depende del patrón real de consultas y usuarios concurrentes." },
      { question: "¿Qué dato contextual es esencial en un dashboard?", options: ["Color corporativo", "Periodo y frescura", "Nombre del clúster", "Versión de Python"], answer: 1, explanation: "Sin periodo y frescura el lector no puede interpretar correctamente la métrica." },
    ],
    source: { label: "Documentación: AI/BI dashboards", href: "https://docs.databricks.com/aws/en/dashboards/" },
  },
  {
    number: "04",
    title: "Delta Lake y modelado fiable",
    short: "Delta",
    level: "Avanzado",
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
    title: "MLflow y ciclo de vida de modelos",
    short: "MLflow",
    level: "Avanzado",
    duration: "85 min",
    icon: "⌘",
    description: "Convierte experimentos aislados en evidencia reproducible, modelos gobernados y promociones controladas.",
    outcomes: ["Diseñar tracking reproducible", "Comparar runs con criterio", "Promover modelos mediante aliases"],
    sections: [
      {
        kicker: "Tracking",
        title: "Una run debe explicar cómo se obtuvo el resultado",
        paragraphs: [
          "MLflow Tracking registra parámetros, métricas, artefactos y contexto de una ejecución. Una métrica sin versión de datos, código o configuración no permite reproducir ni depurar el resultado.",
          "Autologging captura información útil, pero no conoce la decisión de negocio. Añade explícitamente métricas de validación, segmentos críticos y artefactos que expliquen errores.",
        ],
        points: ["Parámetro: entrada de configuración", "Métrica: medida evaluada a lo largo de una run", "Artefacto: archivo o salida asociada"],
      },
      {
        kicker: "Evaluación",
        title: "El mejor score global puede ser el peor modelo operativo",
        paragraphs: [
          "Comparar modelos exige el mismo split, métrica y protocolo. También debes revisar estabilidad por segmento, calibración, coste de inferencia y restricciones del caso de uso.",
          "Evita seleccionar sobre el conjunto de test y después reportar ese mismo resultado como estimación imparcial. Reserva el test para la evaluación final del candidato ya elegido.",
        ],
        points: ["Define la métrica antes de entrenar", "Compara bajo el mismo dataset", "Registra tanto rendimiento como coste"],
      },
      {
        kicker: "Registro",
        title: "El Registry separa artefacto y decisión de promoción",
        paragraphs: [
          "El Model Registry mantiene versiones, linaje, metadatos y aliases. Un alias como Champion puede apuntar a una versión aprobada sin codificar un número fijo en cada consumidor.",
          "Registrar no equivale a aprobar. La promoción debe depender de pruebas, revisión y políticas; el alias expresa la decisión vigente y permite revertirla con claridad.",
        ],
        points: ["La versión identifica un artefacto inmutable", "El alias expresa una función operativa", "El linaje conecta modelo, run y datos"],
      },
    ],
    code: {
      language: "Python",
      title: "Run reproducible y registro",
      content: `import mlflow
from mlflow.models import infer_signature

with mlflow.start_run() as run:
    mlflow.log_params({"max_depth": 8, "seed": 42})
    model.fit(X_train, y_train)
    predictions = model.predict(X_valid)
    mlflow.log_metric("valid_f1", f1_score(y_valid, predictions))
    mlflow.sklearn.log_model(
        model,
        name="model",
        signature=infer_signature(X_train, predictions),
        registered_model_name="main.ml.customer_churn"
    )`,
    },
    lab: {
      title: "Promueve con evidencia",
      goal: "Comparar dos runs y justificar qué versión merece un alias operativo.",
      steps: ["Entrena dos configuraciones con el mismo split y seed controlada.", "Registra F1, latencia por lote y matriz de confusión como artefacto.", "Compara segmentos y documenta el trade-off.", "Registra el candidato y asigna un alias solo si supera tus criterios previos."],
      checkpoint: "Puedes reconstruir la decisión desde la versión registrada hasta parámetros, datos y métricas.",
    },
    questions: [
      { question: "¿Cuál es un parámetro de una run?", options: ["F1 de validación", "max_depth", "Matriz de confusión", "Modelo serializado"], answer: 1, explanation: "max_depth configura el entrenamiento; F1 es métrica y los otros pueden almacenarse como artefactos." },
      { question: "¿Por qué no elegir repetidamente sobre el test?", options: ["Porque MLflow lo prohíbe", "Porque deja de ser una estimación imparcial", "Porque aumenta el coste de storage", "Porque elimina el modelo"], answer: 1, explanation: "Decidir con el test filtra información y sobreajusta la selección a ese conjunto." },
      { question: "¿Qué ventaja aporta un alias del Registry?", options: ["Hace mutable la versión", "Desacopla consumidores de un número de versión fijo", "Reentrena el modelo", "Cifra los datos"], answer: 1, explanation: "El alias puede moverse de forma controlada mientras cada versión permanece identificable e inmutable." },
      { question: "¿Qué falta si solo registras accuracy?", options: ["Nada", "Contexto reproducible y evaluación relevante", "Un SQL warehouse", "Un catálogo separado"], answer: 1, explanation: "Una sola métrica no captura configuración, datos, segmentos, coste ni artefactos de diagnóstico." },
    ],
    source: { label: "Documentación: MLflow en Databricks", href: "https://docs.databricks.com/aws/en/mlflow/" },
  },
  {
    number: "06",
    title: "Producción con Lakeflow Jobs",
    short: "Producción",
    level: "Avanzado",
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

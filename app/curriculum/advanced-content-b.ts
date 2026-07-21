import type { ModuleContentPack } from "./content-types";

const reviewedAt = "21 jul 2026";

export const advancedContentB: Record<string, ModuleContentPack> = {
  m23: {
    lessons: [
      {
        summary: "Aprende a distinguir skew real de una etapa simplemente costosa usando la distribución de tiempos, bytes y registros por tarea.",
        explanation: [
          "En Spark, una etapa termina cuando acaba su tarea más lenta. Por eso una media razonable puede ocultar una cola extrema: si la mediana dura 18 segundos y una tarea tarda 11 minutos, añadir workers no elimina la clave caliente que concentra datos. La evidencia útil está en la pestaña Stages de Spark UI: duración máxima frente a mediana, registros de entrada, shuffle read y tamaño de cada tarea.",
          "Antes de aplicar salting, confirma la causa. Un join con una clave nula dominante, un cliente desproporcionado o una partición temporal demasiado amplia producen remedios distintos. AQE puede dividir particiones sesgadas en joins compatibles; si la distribución forma parte del negocio, conviene además aislar claves calientes o rediseñar la agregación y medir el efecto con el mismo conjunto de datos.",
        ],
        keyPoints: [
          "Compara percentiles y máximos por tarea, no sólo la duración media de la etapa.",
          "Relaciona la tarea lenta con sus bytes de shuffle y número de registros.",
          "Corrige la distribución de datos antes de aumentar capacidad de forma permanente.",
        ],
        example: {
          language: "PySpark",
          title: "Medir la distribución de una clave antes del join",
          code: `from pyspark.sql import functions as F

key_profile = (
    orders.groupBy("customer_id")
    .count()
    .orderBy(F.desc("count"))
)

key_profile.show(20, truncate=False)
orders.where(F.col("customer_id").isNull()).count()`,
          note: "La tabla de frecuencias no sustituye Spark UI, pero permite conectar una tarea extrema con una clave de negocio concreta.",
        },
        pitfalls: [
          "Confundir muchas tareas pequeñas con skew: en ese caso el problema puede ser sobreparticionado y overhead de planificación.",
          "Aplicar salting a todas las claves y encarecer el join aunque sólo una fracción mínima esté sesgada.",
        ],
        examDecision: "Si unas pocas tareas concentran mucho más shuffle y tiempo que la mediana, investiga skew y deja que AQE actúe antes de redimensionar el clúster.",
        checkpoint: {
          question: "Una etapa tiene 4.000 tareas; 3.995 duran menos de 25 segundos y cinco superan 12 minutos con diez veces más shuffle read. ¿Cuál es la primera hipótesis?",
          answer: "Skew de datos en unas pocas particiones; hay que localizar las claves calientes y comprobar si AQE las divide.",
        },
      },
      {
        summary: "Interpreta memory spill y disk spill como síntomas de presión durante sort, aggregate o join, no como una orden automática de comprar más memoria.",
        explanation: [
          "Spark derrama datos cuando una operación no puede mantener en memoria sus estructuras intermedias. El spill a disco añade serialización e I/O; un volumen pequeño puede ser normal, pero spill masivo junto con garbage collection, tareas largas o executor lost indica que el plan y la forma de los datos no caben de manera eficiente. Revisa la etapa concreta, el operador y la distribución antes de cambiar la máquina.",
          "Las palancas tienen costes distintos. Reducir el ancho de fila proyectando sólo columnas necesarias, filtrar antes del shuffle o sustituir una UDF por funciones nativas reduce trabajo. Reparticionar puede distribuir mejor la carga, mientras que workers con más memoria ayudan cuando cada partición es legítimamente grande. Aumentar `spark.sql.shuffle.partitions` sin medir puede crear miles de tareas diminutas.",
        ],
        keyPoints: [
          "Ubica el spill en una etapa y operador concretos.",
          "Reduce datos antes del shuffle mediante filtros y proyección de columnas.",
          "Diferencia presión por partición de falta de memoria global del workload.",
        ],
        example: {
          language: "PySpark",
          title: "Reducir el ancho antes de agregar",
          code: `from pyspark.sql import functions as F

daily_net = (
    events
    .where(F.col("event_date") >= F.date_sub(F.current_date(), 30))
    .select("event_date", "store_id", "net_amount")
    .groupBy("event_date", "store_id")
    .agg(F.sum("net_amount").alias("net_amount"))
)

daily_net.explain("formatted")`,
          note: "La proyección temprana evita transportar payloads que no participan en la agregación; confirma el cambio en el plan y en los bytes de shuffle.",
        },
        pitfalls: [
          "Aumentar el tamaño de los workers sin eliminar columnas grandes que atraviesan el shuffle.",
          "Usar `coalesce(1)` para controlar archivos y concentrar toda la escritura en una tarea.",
        ],
        examDecision: "Ante spill, reduce primero el volumen por partición y verifica el plan; escala verticalmente sólo cuando la partición necesaria sigue excediendo memoria.",
        checkpoint: {
          question: "¿Por qué un spill elevado no demuestra por sí solo que falte memoria en todo el clúster?",
          answer: "Porque puede originarse en una única partición sesgada o en un operador que mueve columnas innecesarias; hay que localizar etapa y tarea.",
        },
      },
      {
        summary: "Comprende qué puede reoptimizar Adaptive Query Execution en tiempo de ejecución y qué decisiones siguen dependiendo del diseño del ingeniero.",
        explanation: [
          "AQE usa estadísticas disponibles después de exchanges para cambiar una estrategia sort-merge a broadcast hash, combinar particiones post-shuffle demasiado pequeñas, dividir particiones sesgadas y propagar relaciones vacías. En Databricks está habilitado por defecto para consultas batch compatibles con exchanges o subconsultas. El plan adaptativo final puede diferir del plan inicial mostrado antes de ejecutar.",
          "AQE no reordena dinámicamente todos los joins ni arregla un modelo de datos deficiente. Una relación que parece pequeña en catálogo puede superar el límite real, y determinados tipos de join no admiten broadcast en uno de sus lados. Usa `explain('formatted')`, el plan final de Spark UI y métricas de ejecución para demostrar qué regla se aplicó; evita copiar configuraciones antiguas que anulen los defaults optimizados.",
        ],
        keyPoints: [
          "AQE decide con estadísticas posteriores al shuffle, más precisas que muchas estimaciones previas.",
          "Puede coalescer particiones y tratar skew sin alterar el resultado lógico.",
          "No sustituye el orden lógico de joins ni una buena reducción temprana de datos.",
        ],
        example: {
          language: "PySpark",
          title: "Inspeccionar configuración y plan adaptativo",
          code: `print(spark.conf.get("spark.sql.adaptive.enabled"))

result = (
    facts.join(dimensions, "product_id")
    .groupBy("category")
    .count()
)

result.explain("formatted")
result.count()  # materializa el plan para revisarlo en Spark UI`,
          note: "La acción materializa la consulta; revisa después el plan final y no deduzcas la estrategia sólo del plan inicial.",
        },
        pitfalls: [
          "Suponer que AQE reordena automáticamente una cadena de joins mal diseñada.",
          "Desactivar AQE para reproducir una configuración heredada sin comparar resultados y métricas.",
        ],
        examDecision: "Confía en AQE para ajustes runtime compatibles; conserva hints sólo cuando conoces la relación y puedes demostrar que anticipar la estrategia evita trabajo.",
        checkpoint: {
          question: "¿Qué ventaja tiene un broadcast planeado estáticamente frente a uno elegido tarde por AQE?",
          answer: "Puede evitar desde el inicio el shuffle de ambos lados; AQE quizá sólo descubra el tamaño real después de que ese intercambio ya ocurra.",
        },
      },
      {
        summary: "Selecciona broadcast, sort-merge u otra estrategia según tamaño, tipo de join, estadísticas y riesgo para el driver y los executors.",
        explanation: [
          "Un broadcast hash join replica la relación pequeña y evita repartir la grande por la clave. Es excelente para una dimensión realmente pequeña, pero peligroso si las estadísticas están obsoletas o si el lado difundido crece: la transferencia y la tabla hash consumen memoria en cada executor. Los hints expresan una preferencia al optimizador, no corrigen una semántica de join incompatible.",
          "Para joins grandes, el sort-merge distribuye ambos lados y paga shuffle y ordenación. Reduce primero las filas y columnas, conserva estadísticas y observa si hay claves calientes. En SQL y DataFrames, el criterio no es 'broadcast siempre es más rápido', sino coste total, compatibilidad del tipo de join y evidencia estable en ejecuciones representativas.",
        ],
        keyPoints: [
          "Difunde sólo relaciones acotadas cuyo tamaño conoces en producción.",
          "Un hint no cambia qué lado puede difundirse en cada tipo de join.",
          "Actualiza estadísticas y compara el plan físico, no sólo el código fuente.",
        ],
        example: {
          language: "PySpark",
          title: "Broadcast explícito de una dimensión acotada",
          code: `from pyspark.sql import functions as F

active_products = (
    spark.table("prod.ref.products")
    .where("is_active = true")
    .select("product_id", "category")
)

enriched = orders.join(F.broadcast(active_products), "product_id", "left")
enriched.explain("formatted")`,
          note: "Documenta el tamaño máximo esperado de `active_products`; un snapshot pequeño hoy no garantiza que siga siendo difundible.",
        },
        pitfalls: [
          "Forzar broadcast a partir de un `count()` de muestra que no representa el máximo diario.",
          "Difundir una tabla ancha cuando bastaba proyectar dos columnas de la dimensión.",
        ],
        examDecision: "Elige broadcast para una relación pequeña y acotada, compatible con el join; si ambas son grandes, reduce datos y deja una estrategia distribuida.",
        checkpoint: {
          question: "Una dimensión tiene 20 millones de filas pero sólo se necesitan dos columnas y los registros activos son el 1 %. ¿Qué harías antes del join?",
          answer: "Filtrar activos y proyectar las dos columnas; después medir el tamaño resultante y sólo entonces decidir si broadcast es seguro.",
        },
      },
      {
        summary: "Evita barreras entre Python y el motor usando expresiones nativas y reserva UDFs para lógica que la plataforma no puede expresar.",
        explanation: [
          "Las funciones SQL y PySpark nativas permanecen visibles para Catalyst y pueden beneficiarse de Photon, generación de código, pushdown y simplificación de expresiones. Una UDF escalar de Python serializa datos entre JVM y Python, oculta parte de la lógica al optimizador y puede provocar fallback de Photon. Antes de crearla, busca funciones integradas para arrays, mapas, strings, fechas y tipos complejos.",
          "Cuando la lógica no existe, una pandas UDF o APIs basadas en Arrow pueden procesar lotes y reducir el coste por fila, pero siguen requiriendo medición, tipos explícitos y pruebas de nulos. La optimización correcta incluye mantenibilidad: una expresión nativa legible suele ser más fácil de gobernar y portar que una UDF opaca.",
        ],
        keyPoints: [
          "Prefiere funciones nativas porque el optimizador conserva visibilidad de la expresión.",
          "Comprueba en Query Profile o Spark UI si una UDF provoca fallback de Photon.",
          "Si necesitas Python, vectoriza por lotes y define contratos de tipos y nulos.",
        ],
        example: {
          language: "PySpark",
          title: "Normalización nativa sin UDF",
          code: `from pyspark.sql import functions as F

normalized = customers.withColumn(
    "email_domain",
    F.lower(F.element_at(F.split(F.trim("email"), "@"), -1)),
).withColumn(
    "is_company_email",
    ~F.col("email_domain").isin("gmail.com", "outlook.com", "yahoo.com"),
)`,
          note: "La expresión queda disponible para el plan; prueba explícitamente emails nulos, sin arroba y con espacios.",
        },
        pitfalls: [
          "Crear una UDF para operaciones ya cubiertas por `when`, `transform`, `regexp_extract` o funciones de fecha.",
          "Sustituir una UDF escalar por pandas UDF sin medir serialización, tamaño de lote y presión de memoria.",
        ],
        examDecision: "Si existe una expresión nativa equivalente, úsala; elige una UDF sólo por necesidad funcional y valida el coste y la compatibilidad del motor.",
        checkpoint: {
          question: "¿Qué señal confirma que una UDF perjudica Photon?",
          answer: "El plan o Query Profile muestra operadores que caen al runtime Spark alrededor de la UDF y aumenta el tiempo fuera de Photon.",
        },
      },
    ],
    lab: {
      title: "Diagnóstico de un join con skew y spill",
      goal: "Producir un diagnóstico reproducible que reduzca la cola de tareas sin sobredimensionar compute.",
      scenario: "El job nocturno `orders_enrichment` pasó de 18 a 54 minutos. El volumen creció 12 %, pero una etapa de join concentra el 71 % del tiempo, muestra spill a disco y cinco tareas extremas. Debes perfilar claves, reducir el lado grande, decidir si la dimensión puede difundirse y dejar una consulta optimizada verificable.",
      steps: [
        "Perfila `customer_id`, incluidos nulos, y documenta las cinco frecuencias más altas.",
        "Proyecta y filtra `prod.ref.customer_tier` antes del join para acotar su tamaño lógico.",
        "Activa una estrategia justificable: broadcast de la dimensión acotada o tratamiento aislado de claves calientes.",
        "Muestra el plan con `explain('formatted')` y materializa una acción de validación.",
        "Compara duración máxima/mediana, shuffle y spill de la etapa antes y después; registra un criterio de rollback.",
      ],
      starterCode: `from pyspark.sql import functions as F

orders = spark.table("prod.silver.orders")
tiers = spark.table("prod.ref.customer_tier")

# 1. Perfila las claves calientes y los nulos.
# 2. Reduce tiers a filas vigentes y columnas necesarias.
# 3. Construye enriched con una estrategia de join justificada.
# 4. Imprime el plan y una evidencia reproducible.`,
      solution: `from pyspark.sql import functions as F

orders = spark.table("prod.silver.orders")
tiers = spark.table("prod.ref.customer_tier")

key_profile = (
    orders.groupBy("customer_id")
    .count()
    .orderBy(F.desc("count"))
)
key_profile.show(5, truncate=False)
print("null_keys=", orders.where(F.col("customer_id").isNull()).count())

current_tiers = (
    tiers.where("valid_to IS NULL")
    .select("customer_id", "tier")
)

enriched = (
    orders
    .where(F.col("customer_id").isNotNull())
    .select("order_id", "customer_id", "order_date", "net_amount")
    .join(F.broadcast(current_tiers), "customer_id", "left")
)

enriched.explain("formatted")
print("validated_rows=", enriched.count())`,
      checks: [
        { label: "Perfila la distribución de customer_id", pattern: "groupBy\\(\"customer_id\"\\)" },
        { label: "Reduce la dimensión antes del join", pattern: "valid_to IS NULL" },
        { label: "Explicita la decisión de broadcast", pattern: "broadcast\\(current_tiers\\)" },
        { label: "Expone el plan físico", pattern: "explain\\(\"formatted\"\\)" },
      ],
      expectedEvidence: [
        "Tabla con las claves más frecuentes y recuento de claves nulas.",
        "Plan físico que muestre la estrategia de join aplicada.",
        "Comparación antes/después de máximo y mediana por tarea, shuffle read, spill y duración total.",
      ],
      cloudNotes: {
        AWS: "En compute clásico, relaciona spill con memoria y almacenamiento local de la familia EC2; no uses spot para el driver y verifica si Graviton es compatible con tus librerías.",
        Azure: "En compute clásico, compara familias de Azure VM con memoria/local SSD equivalentes y mantén el driver en capacidad bajo demanda; documenta restricciones de disponibilidad regional.",
        GCP: "En compute clásico, valida memoria y disco local de la familia Compute Engine elegida y evita preemptibles para el driver; AQE y el diagnóstico del plan no cambian entre nubes.",
      },
    },
    quiz: [
      {
        question: "Un stage tiene un spill agregado alto, pero el 98 % procede de dos tareas que también leen diez veces más shuffle que la mediana. ¿Qué acción es más sólida primero?",
        options: [
          "Duplicar todos los workers de forma permanente.",
          "Identificar las claves de esas particiones y comprobar el tratamiento de skew de AQE.",
          "Desactivar AQE para estabilizar el plan inicial.",
          "Reducir `spark.sql.shuffle.partitions` a uno.",
        ],
        answer: 1,
        explanation: "La concentración en dos tareas apunta a skew por partición. Más capacidad global puede ocultarlo, pero no corrige la distribución.",
        domain: "Data processing · performance",
      },
      {
        question: "Una dimensión filtrada ocupa 80 MB y es estable; el fact tiene 4 TB. Las estadísticas están actualizadas y el tipo de join admite broadcast. ¿Qué plan evita más movimiento?",
        options: [
          "Cross join y filtro posterior.",
          "Reparticionar ambos lados a una partición.",
          "Persistir el fact completo antes de cada ejecución.",
          "Broadcast hash join de la dimensión proyectada.",
        ],
        answer: 3,
        explanation: "Difundir la relación pequeña y acotada evita el shuffle del fact; la proyección reduce además la memoria replicada.",
        domain: "Data processing · joins",
      },
      {
        question: "¿Cuál es una capacidad real de AQE en Databricks?",
        options: [
          "Combinar particiones post-shuffle pequeñas usando estadísticas de ejecución.",
          "Reordenar arbitrariamente todos los joins durante la consulta.",
          "Convertir una transformación stateful streaming en batch.",
          "Eliminar la necesidad de estadísticas y observabilidad.",
        ],
        answer: 0,
        explanation: "AQE puede coalescer particiones, cambiar ciertas estrategias, manejar skew y propagar relaciones vacías; no rediseña toda la consulta.",
        domain: "Data processing · Spark",
      },
      {
        question: "Un pipeline usa una UDF escalar de Python para normalizar una fecha que admite `to_date` y `date_trunc`. ¿Qué cambio suele mejorar rendimiento y explicabilidad?",
        options: [
          "Aumentar la memoria del driver sin cambiar el código.",
          "Convertir cada fila a pandas y volver a Spark.",
          "Sustituir la UDF por funciones nativas y verificar el plan.",
          "Añadir un `collect()` antes de la UDF.",
        ],
        answer: 2,
        explanation: "Las funciones nativas evitan la barrera Python/JVM y conservan la expresión visible para Catalyst y Photon.",
        domain: "Data processing · optimization",
      },
    ],
    sources: [
      { label: "Adaptive query execution", href: "https://docs.databricks.com/aws/en/optimizations/aqe", reviewedAt },
      { label: "Diagnose cost and performance issues using the Spark UI", href: "https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/", reviewedAt },
      { label: "Best practices for performance efficiency", href: "https://docs.databricks.com/aws/en/lakehouse-architecture/performance-efficiency/best-practices", reviewedAt },
    ],
  },

  m24: {
    lessons: [
      {
        summary: "Entiende dónde Photon acelera el plan, cómo detecta un fallback y por qué medir precio/rendimiento importa más que comparar DBU por hora.",
        explanation: [
          "Photon es el motor vectorizado nativo de Databricks. Catalyst sigue generando el plan, mientras Photon ejecuta operadores compatibles en lotes columnares y usa un runtime C++ que reduce costes de JVM. Está habilitado en serverless y SQL warehouses, y por defecto en compute clásico moderno; acelera scans, joins, agregaciones, shuffles y escrituras compatibles sin exigir reescribir SQL o DataFrames.",
          "No toda consulta mejora igual. UDFs, RDDs, APIs Dataset y operaciones no compatibles pueden ejecutar partes en Spark, y consultas subsegundo suelen estar dominadas por planificación. En Spark UI los operadores Photon se distinguen en el DAG; en Query Profile se observa el porcentaje de tiempo. Evalúa duración, task time, datos leídos y coste total, no sólo que la casilla esté activada.",
        ],
        keyPoints: [
          "Photon cambia la ejecución física, no la semántica ni el plan lógico de Catalyst.",
          "Localiza fallbacks con Spark UI o Query Profile.",
          "Compara coste por trabajo terminado, no tarifa aislada de DBU.",
        ],
        example: {
          language: "SQL",
          title: "Consulta compatible con ejecución vectorizada",
          code: `SELECT
  order_date,
  customer_segment,
  SUM(net_amount) AS net_revenue,
  COUNT(DISTINCT order_id) AS orders
FROM prod.gold.sales
WHERE order_date >= current_date() - INTERVAL 30 DAYS
GROUP BY order_date, customer_segment;`,
          note: "Revisa el Query Profile para confirmar pruning, operadores más caros y tiempo en Photon; no infieras el resultado sólo por la sintaxis.",
        },
        pitfalls: [
          "Atribuir toda mejora a Photon sin controlar caché, volumen y concurrencia entre pruebas.",
          "Mantener una UDF evitable y concluir que Photon no aporta valor al workload.",
        ],
        examDecision: "Elige Photon para SQL/DataFrames compatibles y decide con métricas de precio/rendimiento; investiga fallback antes de escalar compute.",
        checkpoint: {
          question: "¿Qué ocurre cuando Photon encuentra una operación no compatible?",
          answer: "Esa parte del plan cae de forma transparente al runtime Spark; el resultado sigue siendo correcto, pero puede perder aceleración.",
        },
      },
      {
        summary: "Diseña data skipping a partir de predicados reales y estadísticas, evitando layouts que sólo reflejan cómo llegó el dato.",
        explanation: [
          "Delta registra estadísticas por archivo para que el motor descarte archivos cuyo rango no puede satisfacer el filtro. El skipping funciona cuando las columnas consultadas tienen estadísticas útiles y los valores están organizados de forma que distintos archivos cubren rangos discriminantes. Un filtro muy selectivo no ayuda si todos los archivos contienen casi todo el rango de la columna.",
          "En tablas Unity Catalog administradas, predictive optimization puede recopilar estadísticas automáticamente. Si cambias las columnas de estadísticas, `ANALYZE TABLE ... COMPUTE DELTA STATISTICS` recalcula la información del log; las estadísticas del optimizador se actualizan con `ANALYZE TABLE ... COMPUTE STATISTICS`. Verifica en Query Profile bytes leídos y porcentaje podado, no sólo el tiempo caliente de una segunda ejecución.",
        ],
        keyPoints: [
          "El skipping depende de estadísticas y distribución física, no de índices de filas tradicionales.",
          "Prioriza columnas presentes en filtros selectivos y frecuentes.",
          "Mide bytes/archivos podados con caché controlada.",
        ],
        example: {
          language: "SQL",
          title: "Actualizar estadísticas tras cambiar columnas de skipping",
          code: `ALTER TABLE prod.gold.orders
SET TBLPROPERTIES ('delta.dataSkippingStatsColumns' = 'order_date,customer_id');

ANALYZE TABLE prod.gold.orders COMPUTE DELTA STATISTICS;
ANALYZE TABLE prod.gold.orders COMPUTE STATISTICS;

SELECT *
FROM prod.gold.orders
WHERE order_date = DATE '2026-07-20'
  AND customer_id = 184203;`,
          note: "La recomputación puede ser costosa en tablas grandes; documenta el cambio y compara bytes leídos antes y después.",
        },
        pitfalls: [
          "Añadir muchas columnas de estadísticas sin relación con predicados, aumentando metadatos y mantenimiento.",
          "Medir sólo una segunda consulta que ya se beneficia de caché.",
        ],
        examDecision: "Cuando un filtro lee demasiados archivos, comprueba primero estadísticas y layout de las columnas filtradas; más compute no crea pruning.",
        checkpoint: {
          question: "Una consulta filtra por `customer_id`, pero todos los archivos contienen IDs de todo el rango. ¿Por qué el skipping será débil?",
          answer: "Porque los min/max de casi todos los archivos podrían contener el ID y el motor no puede descartarlos aunque el filtro sea selectivo.",
        },
      },
      {
        summary: "Usa liquid clustering para adaptar el layout a patrones de acceso cambiantes sin heredar la rigidez de particiones físicas de alta cardinalidad.",
        explanation: [
          "Liquid clustering reemplaza particionado y `ZORDER` para tablas nuevas que necesitan layout flexible. `CLUSTER BY` define claves y las operaciones de mantenimiento reagrupan datos incrementalmente. Las claves pueden evolucionar sin reescribir inmediatamente toda la tabla; lecturas y escrituras requieren versiones compatibles del runtime y no debes mezclar la tabla con particionado tradicional o `ZORDER`.",
          "Automatic liquid clustering usa predictive optimization para escoger y evolucionar claves cuando el ahorro esperado por skipping supera el coste de clustering. La decisión práctica parte de consultas observadas: filtros por fecha y cliente pueden justificar claves, mientras una columna de cardinalidad extrema sin patrón estable puede empeorar mantenimiento. Valida en historial y perfiles qué archivos se podan.",
        ],
        keyPoints: [
          "Liquid clustering admite evolución de claves sin redefinir particiones físicas.",
          "No combines `CLUSTER BY` con `PARTITIONED BY` o `ZORDER` en la misma estrategia.",
          "Automatic liquid clustering requiere predictive optimization.",
        ],
        example: {
          language: "SQL",
          title: "Crear una tabla con liquid clustering",
          code: `CREATE TABLE prod.gold.customer_orders (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  net_amount DECIMAL(18,2)
)
USING DELTA
CLUSTER BY (order_date, customer_id);

INSERT INTO prod.gold.customer_orders
SELECT order_id, customer_id, order_date, net_amount
FROM prod.silver.orders;`,
          note: "Elige claves a partir de filtros reales; habilitar clustering no garantiza beneficio si las consultas no podan por esas columnas.",
        },
        pitfalls: [
          "Replicar la antigua columna de partición como clave sin revisar el historial de consultas.",
          "Ejecutar mantenimiento manual agresivo mientras predictive optimization ya gestiona la tabla.",
        ],
        examDecision: "Prefiere liquid clustering para tablas Delta nuevas con patrones de filtro evolutivos; usa particionado sólo cuando exista una razón de compatibilidad concreta.",
        checkpoint: {
          question: "¿Qué ventaja ofrece cambiar claves de liquid clustering frente a cambiar particiones tradicionales?",
          answer: "Las claves pueden evolucionar y el reclustering ocurre de forma incremental, sin exigir una reescritura inmediata y completa del layout.",
        },
      },
      {
        summary: "Relaciona deletion vectors, predictive I/O y concurrencia por fila con el coste real de `MERGE`, `UPDATE` y `DELETE`.",
        explanation: [
          "Sin deletion vectors, modificar pocas filas puede obligar a reescribir archivos Parquet completos. Con la característica activada, Delta registra qué filas están lógicamente eliminadas y difiere la reescritura física. Photon puede usar predictive I/O para acelerar actualizaciones y lecturas compatibles; el protocolo de tabla se eleva, por lo que todos los clientes externos deben soportarlo.",
          "Los vectores no eliminan mantenimiento: operaciones posteriores materializan cambios cuando conviene, y `VACUUM` sigue gobernado por retención. También habilitan row-level concurrency en tablas elegibles, reduciendo conflictos entre escrituras sobre filas distintas. Desactivarlos por costumbre puede perder concurrencia; activarlos sin inventariar lectores externos puede romper interoperabilidad.",
        ],
        keyPoints: [
          "Deletion vectors evitan reescribir inmediatamente archivos completos por cambios de pocas filas.",
          "Comprueba compatibilidad de protocolo de todos los lectores y escritores.",
          "Predictive I/O para updates requiere Photon y usa deletion vectors.",
        ],
        example: {
          language: "SQL",
          title: "Habilitar vectores y verificar el protocolo",
          code: `ALTER TABLE prod.silver.customers
SET TBLPROPERTIES ('delta.enableDeletionVectors' = true);

DESCRIBE DETAIL prod.silver.customers;

DELETE FROM prod.silver.customers
WHERE deletion_requested_at < current_date() - INTERVAL 30 DAYS;`,
          note: "Revisa `tableFeatures` en `DESCRIBE DETAIL` y valida previamente cada motor externo que accede a la tabla.",
        },
        pitfalls: [
          "Activar una característica de protocolo sin probar consumidores Delta externos.",
          "Confundir borrado lógico inmediato con eliminación física segura de archivos.",
        ],
        examDecision: "Usa deletion vectors para DML frecuente y concurrencia compatible; prioriza interoperabilidad cuando existe un lector que no soporta la característica.",
        checkpoint: {
          question: "¿Por qué `DELETE` con deletion vectors no significa que el archivo antiguo desaparezca inmediatamente?",
          answer: "La fila queda marcada lógicamente; la reescritura y eliminación física se realizan después según mantenimiento y retención.",
        },
      },
      {
        summary: "Delega `OPTIMIZE`, `VACUUM` y `ANALYZE` a predictive optimization cuando la tabla administrada y su gobierno lo permiten.",
        explanation: [
          "Predictive optimization observa tablas administradas por Unity Catalog y ejecuta mantenimiento donde estima beneficio: compacta y aplica clustering con `OPTIMIZE`, elimina archivos no referenciados con `VACUUM` y mantiene estadísticas mediante `ANALYZE`. Puede habilitarse en cuenta, catálogo, esquema o tabla, con herencia; las tablas externas quedan bajo responsabilidad del propietario.",
          "Automatizar no significa perder control. Revisa la propiedad efectiva con `DESCRIBE ... EXTENDED`, el historial de operaciones y el coste atribuido a `PREDICTIVE_OPTIMIZATION` en `system.billing.usage`. Evita jobs cron que ejecutan `OPTIMIZE` sobre todas las tablas sin observar necesidad: compiten con la automatización y pueden gastar más que el beneficio obtenido.",
        ],
        keyPoints: [
          "Sólo tablas administradas elegibles reciben predictive optimization.",
          "La configuración hereda desde cuenta, catálogo y esquema salvo override explícito.",
          "Audita tanto beneficio como consumo de las operaciones automáticas.",
        ],
        example: {
          language: "SQL",
          title: "Habilitar por catálogo y verificar una tabla",
          code: `ALTER CATALOG prod ENABLE PREDICTIVE OPTIMIZATION;

DESCRIBE CATALOG EXTENDED prod;
DESCRIBE TABLE EXTENDED prod.gold.orders;

SELECT operation, operationParameters, operationMetrics, timestamp
FROM (DESCRIBE HISTORY prod.gold.orders)
ORDER BY timestamp DESC
LIMIT 20;`,
          note: "La herencia no anula un `DISABLE` explícito en un hijo; verifica la configuración efectiva antes de diagnosticar ausencia de mantenimiento.",
        },
        pitfalls: [
          "Asumir que una tabla externa recibe mantenimiento automático porque está registrada en Unity Catalog.",
          "Conservar un job global de `OPTIMIZE` y `VACUUM` sin comprobar si duplica predictive optimization.",
        ],
        examDecision: "Para tablas administradas, habilita predictive optimization y elimina mantenimiento indiscriminado; para externas, diseña y observa tu propia política.",
        checkpoint: {
          question: "¿Qué tres operaciones principales ejecuta predictive optimization?",
          answer: "`OPTIMIZE`, `VACUUM` y `ANALYZE`, aplicadas selectivamente a tablas administradas elegibles.",
        },
      },
    ],
    lab: {
      title: "Rehabilitar una tabla Delta con scans excesivos y DML costoso",
      goal: "Diseñar un layout mantenible y demostrar pruning y menor amplificación de escrituras.",
      scenario: "`prod.gold.order_events` recibe `MERGE` cada quince minutos y alimenta consultas por `event_date` y `customer_id`. Query Profile muestra que una búsqueda de un cliente lee casi todos los archivos. La tabla está administrada, no tiene clustering y un job antiguo ejecuta `OPTIMIZE ... ZORDER` cada noche.",
      steps: [
        "Captura `DESCRIBE DETAIL`, historial y Query Profile de una consulta representativa.",
        "Define estadísticas para `event_date` y `customer_id` y actualízalas de forma consciente.",
        "Migra el layout a liquid clustering o crea una tabla de reemplazo compatible si el cambio in-place no es válido para el estado actual.",
        "Comprueba deletion vectors y compatibilidad de los consumidores antes de habilitarlos.",
        "Habilita predictive optimization en el ámbito correcto y retira el mantenimiento duplicado sólo tras observar una ventana completa.",
        "Compara bytes podados, archivos leídos, duración de `MERGE` y coste de mantenimiento.",
      ],
      starterCode: `-- Sustituye los nombres si trabajas en un catálogo de laboratorio.
DESCRIBE DETAIL prod.gold.order_events;
DESCRIBE HISTORY prod.gold.order_events;

-- 1. Configura estadísticas útiles.
-- 2. Define la estrategia de clustering.
-- 3. Habilita deletion vectors y predictive optimization si son compatibles.
-- 4. Incluye una consulta de validación selectiva.`,
      solution: `ALTER TABLE prod.gold.order_events
SET TBLPROPERTIES (
  'delta.dataSkippingStatsColumns' = 'event_date,customer_id',
  'delta.enableDeletionVectors' = true
);

ANALYZE TABLE prod.gold.order_events COMPUTE DELTA STATISTICS;
ANALYZE TABLE prod.gold.order_events COMPUTE STATISTICS;

ALTER TABLE prod.gold.order_events
CLUSTER BY (event_date, customer_id);

ALTER TABLE prod.gold.order_events
ENABLE PREDICTIVE OPTIMIZATION;

SELECT event_id, event_ts, event_type
FROM prod.gold.order_events
WHERE event_date = DATE '2026-07-20'
  AND customer_id = 184203;`,
      checks: [
        { label: "Configura columnas de skipping", pattern: "dataSkippingStatsColumns" },
        { label: "Actualiza estadísticas Delta", pattern: "COMPUTE DELTA STATISTICS" },
        { label: "Declara liquid clustering", pattern: "CLUSTER BY" },
        { label: "Activa mantenimiento predictivo", pattern: "ENABLE PREDICTIVE OPTIMIZATION" },
      ],
      expectedEvidence: [
        "Detalle de protocolo y características antes/después.",
        "Query Profile comparable con archivos y bytes leídos/podados.",
        "Historial de mantenimiento sin ejecución duplicada del job antiguo.",
      ],
      cloudNotes: {
        AWS: "Valida clientes Delta que lean directamente desde S3 y contabiliza egress/requests de S3 al comparar layouts; Photon y predictive optimization siguen siendo capacidades Databricks.",
        Azure: "Comprueba consumidores que accedan a ADLS Gen2 fuera de Databricks y el impacto de transacciones/listados; no asumas que todos soportan deletion vectors.",
        GCP: "Inventaría lectores directos de GCS y compatibilidad de protocolo; usa métricas de bytes y operaciones de GCS junto con el Query Profile para el coste total.",
      },
    },
    quiz: [
      {
        question: "Una consulta usa Photon, pero el perfil muestra fallback alrededor de una transformación de Python. ¿Cuál es la mejor primera mejora?",
        options: [
          "Cambiar el formato Delta a CSV.",
          "Deshabilitar Photon para que el plan sea uniforme.",
          "Reemplazar la UDF por funciones nativas si existe equivalencia.",
          "Reducir el warehouse a una sola unidad.",
        ],
        answer: 2,
        explanation: "Las funciones nativas mantienen la operación visible y compatible con el motor; escalar no elimina la barrera de la UDF.",
        domain: "Data processing · Photon",
      },
      {
        question: "Una tabla administrada recibe filtros cambiantes por fecha y cliente y necesita adaptar el layout sin particiones rígidas. ¿Qué estrategia encaja mejor?",
        options: [
          "Liquid clustering basado en patrones observados, idealmente con predictive optimization.",
          "Particionar por cada customer_id.",
          "Ejecutar `coalesce(1)` tras cada escritura.",
          "Desactivar las estadísticas de archivos.",
        ],
        answer: 0,
        explanation: "Liquid clustering permite evolucionar claves y evita particiones físicas de alta cardinalidad.",
        domain: "Data processing · Delta optimization",
      },
      {
        question: "¿Qué requisito debe comprobarse antes de habilitar deletion vectors en una tabla consumida fuera de Databricks?",
        options: [
          "Que todas las consultas usen `SELECT *`.",
          "Que la tabla esté particionada por fecha.",
          "Que el driver tenga el doble de memoria.",
          "Que todos los lectores y escritores soporten la característica de protocolo.",
        ],
        answer: 3,
        explanation: "Deletion vectors elevan las características del protocolo; un cliente incompatible puede dejar de leer o escribir la tabla.",
        domain: "Data processing · reliability",
      },
      {
        question: "Predictive optimization está activo en un catálogo de tablas administradas. ¿Qué práctica FinOps es más razonable?",
        options: [
          "Mantener además un `OPTIMIZE` global cada hora por seguridad.",
          "Retirar mantenimiento indiscriminado tras observar historial, rendimiento y coste automático.",
          "Convertir todas las tablas en externas.",
          "Deshabilitar `ANALYZE` para reducir metadatos.",
        ],
        answer: 1,
        explanation: "La automatización selecciona operaciones beneficiosas; conviene evitar duplicarlas y validar con historial y billing.",
        domain: "Operations · optimization",
      },
    ],
    sources: [
      { label: "What is Photon?", href: "https://docs.databricks.com/aws/en/compute/photon", reviewedAt },
      { label: "Use liquid clustering for tables", href: "https://docs.databricks.com/aws/en/delta/clustering", reviewedAt },
      { label: "Predictive optimization for Unity Catalog managed tables", href: "https://docs.databricks.com/aws/en/optimizations/predictive-optimization", reviewedAt },
      { label: "What is predictive I/O?", href: "https://docs.databricks.com/aws/en/optimizations/predictive-io", reviewedAt },
    ],
  },

  m25: {
    lessons: [
      {
        summary: "Elige serverless, SQL warehouse o compute clásico según APIs, latencia, control de infraestructura y patrón operativo.",
        explanation: [
          "Databricks recomienda serverless para la mayoría de notebooks, jobs y pipelines porque administra aprovisionamiento, escalado, Photon y actualizaciones. Un SQL warehouse serverless sirve BI y SQL; jobs serverless sirve tareas automatizadas sin configurar clúster. Compute clásico sigue siendo válido cuando una API, runtime, red o configuración especializada no está soportada en serverless.",
          "La decisión se toma por requisito, no por preferencia histórica. Define SLA de arranque y ejecución, lenguaje, librerías, conectividad y observabilidad disponible. En serverless no hay Spark UI: se usa Query Profile. En clásico controlas familias y autoscaling, pero también capacidad, parches y tiempo ocioso. Evita all-purpose para producción automatizada salvo una excepción explícita.",
        ],
        keyPoints: [
          "Serverless es la opción por defecto para workloads compatibles.",
          "SQL warehouse corresponde a SQL/BI; jobs serverless a automatización general compatible.",
          "Compute clásico se justifica con una limitación concreta, no con costumbre.",
        ],
        example: {
          language: "JSON",
          title: "Registro de decisión de compute",
          code: `{
  "workload": "daily_customer_360",
  "candidate": "serverless_jobs",
  "requirements": {
    "startup_sla_minutes": 8,
    "languages": ["Python", "SQL"],
    "network": "managed_connector",
    "spark_ui_required": false
  },
  "fallback": "classic_jobs_compute",
  "review_after_runs": 20
}`,
          note: "La decisión incluye un fallback y una fecha de revisión; evita declarar serverless o clásico como dogma.",
        },
        pitfalls: [
          "Usar all-purpose compartido para un job crítico y mezclar su coste con trabajo interactivo.",
          "Migrar a serverless sin revisar configuraciones Spark, sinks o dependencias no compatibles.",
        ],
        examDecision: "Empieza por serverless; elige clásico sólo cuando un requisito verificado no esté cubierto y documenta cómo retirar la excepción.",
        checkpoint: {
          question: "¿Cuándo elegirías un SQL warehouse frente a jobs serverless?",
          answer: "Cuando la carga es SQL/BI y necesita las capacidades y concurrencia del warehouse; para tareas Python o workflows generales, jobs serverless suele encajar mejor.",
        },
      },
      {
        summary: "Dimensiona compute clásico con el cuello de botella real: memoria por partición, CPU, I/O, paralelismo y capacidad del driver.",
        explanation: [
          "Más nodos pequeños y pocos nodos grandes pueden sumar cores y memoria similares, pero no se comportan igual. Joins y agregaciones con particiones grandes necesitan memoria por executor; workloads muy paralelos pueden aprovechar más workers. El driver planifica, recopila metadatos y recibe resultados de acciones como `collect()`, por lo que escalar workers no resuelve un driver sobrecargado.",
          "Comienza con una familia general, autoscaling y límites observables. Revisa utilización de CPU, memoria, spill, I/O y duración por stage; cambia una variable cada vez. En AWS, Azure y GCP varían nombres, discos y mercados spot, pero el método es el mismo. Mantén el driver bajo demanda y usa spot/preemptible en workers sólo si el workload tolera interrupciones.",
        ],
        keyPoints: [
          "Dimensiona por recursos de la etapa crítica, no por volumen total de la tabla.",
          "El driver y los workers tienen responsabilidades distintas.",
          "Autoscaling no arregla skew ni un único task no paralelizable.",
        ],
        example: {
          language: "JSON",
          title: "Rango de autoscaling para un job clásico",
          code: `{
  "spark_version": "16.4.x-scala2.12",
  "runtime_engine": "PHOTON",
  "autoscale": {
    "min_workers": 2,
    "max_workers": 8
  },
  "autotermination_minutes": 20,
  "custom_tags": {
    "cost_center": "finance-data",
    "environment": "prod"
  }
}`,
          note: "Los node types son deliberadamente externos al ejemplo porque cambian por nube; selecciónalos después de perfilar CPU, memoria y disco.",
        },
        pitfalls: [
          "Elevar `max_workers` cuando una sola tarea sesgada domina la duración.",
          "Usar spot/preemptible para el driver y exponer el job completo a una reclamación.",
        ],
        examDecision: "Si falta paralelismo, añade workers; si cada tarea derrama por memoria, mejora el plan o usa workers mayores; si falla el driver, trata el driver y elimina acciones locales.",
        checkpoint: {
          question: "Un job tiene CPU baja en casi todos los workers y una única tarea de 40 minutos. ¿Ayudará duplicar `max_workers`?",
          answer: "Probablemente no; la etapa no usa paralelismo disponible. Hay que investigar skew, particionado o una operación serial.",
        },
      },
      {
        summary: "Equilibra coste y latencia en serverless mediante modos de rendimiento, entornos versionados y límites de microbatch.",
        explanation: [
          "Serverless jobs y pipelines ofrecen modo performance optimized para arranque rápido y modo standard para automatizaciones que toleran aproximadamente 4–6 minutos de inicio a cambio de menor coste. Los notebooks usan el modo interactivo adecuado. Serverless administra infraestructura y Photon, pero el ingeniero sigue controlando la forma de la consulta, paquetes, parámetros y cuánto dato procesa cada ejecución.",
          "Los entornos serverless sustituyen la selección directa de Databricks Runtime y mantienen una API base estable. Fija versiones de paquetes y usa entornos/base environments, porque init scripts no están soportados. En streaming serverless, `Trigger.AvailableNow` procesa lo disponible; limita `maxFilesPerTrigger` o `maxBytesPerTrigger` para evitar microbatches impredecibles.",
        ],
        keyPoints: [
          "Usa modo standard cuando el SLA admite más arranque y prima el coste.",
          "Fija versiones de paquetes dentro del modelo de entorno serverless.",
          "La infraestructura gestionada no elimina la necesidad de acotar cada workload.",
        ],
        example: {
          language: "Python",
          title: "Dependencias reproducibles para serverless",
          code: `# requirements.txt
pydantic==2.11.7
requests==2.32.4
tenacity==9.1.2

# En el job, selecciona un entorno compatible y conserva
# este fichero versionado junto al código y sus pruebas.`,
          note: "No dependas de una versión transitiva no fijada; valida el entorno en test antes de promoverlo.",
        },
        pitfalls: [
          "Elegir performance optimized para miles de jobs batch cuyo SLA tolera el arranque standard.",
          "Copiar init scripts de compute clásico a una migración serverless.",
        ],
        examDecision: "Para batch programado tolerante al arranque, usa modo standard; conserva performance optimized para interacción o SLA de inicio exigente.",
        checkpoint: {
          question: "¿Qué compensación introduce el modo standard de serverless jobs?",
          answer: "Acepta un arranque más lento para reducir coste frente al modo performance optimized.",
        },
      },
      {
        summary: "Impone guardrails con compute policies y atribuye serverless mediante usage policies sin incluir información sensible en tags.",
        explanation: [
          "Las compute policies restringen la creación de compute clásico: pueden fijar runtime, modo de acceso, Photon, límites de workers, autotermination y tags. Las familias de políticas aportan bases mantenidas por Databricks. Una buena policy reduce opciones peligrosas y deja editables sólo parámetros que el equipo debe decidir; instalar librerías mediante policies es preferible a init scripts.",
          "Serverless usage policies son objetos distintos que asignan tags de coste a notebooks, jobs, pipelines y otros workloads serverless. Sus tags aparecen en `system.billing.usage.custom_tags`. Los tags viajan a registros y pueden replicarse globalmente: usa centro de coste, producto y entorno, nunca correo, nombre de cliente o datos confidenciales. Recuerda que un pipeline disparado por un job conserva su propia policy.",
        ],
        keyPoints: [
          "Compute policies gobiernan configuración clásica; serverless usage policies atribuyen actividad serverless.",
          "Fija y oculta guardrails, permite sólo decisiones necesarias.",
          "Los tags no son un almacén seguro para datos personales o secretos.",
        ],
        example: {
          language: "JSON",
          title: "Fragmento de compute policy con guardrails",
          code: `{
  "autotermination_minutes": {
    "type": "range",
    "maxValue": 60,
    "defaultValue": 20
  },
  "autoscale.max_workers": {
    "type": "range",
    "maxValue": 12,
    "defaultValue": 4
  },
  "custom_tags.cost_center": {
    "type": "fixed",
    "value": "finance-data"
  }
}`,
          note: "Completa la policy con familia y reglas del workspace; prueba que usuarios previstos pueden crear compute y no pueden superar guardrails.",
        },
        pitfalls: [
          "Usar la misma etiqueta `Name` que Databricks aplica al clúster y romper atribución/terminación.",
          "Incluir identificadores personales o secretos en tags de coste.",
        ],
        examDecision: "Usa policies para prevenir configuraciones caras y tags estables para chargeback; no confíes en disciplina manual del creador.",
        checkpoint: {
          question: "¿Dónde aparecen los tags heredados de una serverless usage policy?",
          answer: "En `custom_tags` de los registros correspondientes de `system.billing.usage`.",
        },
      },
      {
        summary: "Construye FinOps con cantidades de uso, precios efectivos, correcciones y metadatos de workload, no con estimaciones de horas de clúster.",
        explanation: [
          "`system.billing.usage` ofrece registros regionales de consumo con SKU, producto origen, metadatos de job/notebook/warehouse, identidad y tags. Para coste monetario se une con la tabla de precios por SKU y vigencia; las correcciones pueden emitir retracciones y restatements, así que agrega `usage_quantity` con su signo en lugar de descartar filas negativas.",
          "Un dashboard útil separa coste, volumen y resultado: coste por ejecución, por millón de filas o por SLA cumplido. Segmenta serverless por `billing_origin_product` y `usage_metadata`, porque varias capacidades comparten SKU. Define presupuestos y alertas como detección temprana, no como mecanismo que detiene automáticamente todos los workloads.",
        ],
        keyPoints: [
          "Suma registros de corrección con signo para obtener consumo neto.",
          "Une uso y precios por SKU y periodo de vigencia.",
          "Normaliza coste por unidad de negocio o trabajo terminado.",
        ],
        example: {
          language: "SQL",
          title: "Uso diario por producto y centro de coste",
          code: `SELECT
  usage_date,
  billing_origin_product,
  custom_tags['cost_center'] AS cost_center,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
GROUP BY usage_date, billing_origin_product,
         custom_tags['cost_center'], sku_name
ORDER BY usage_date DESC, usage_quantity DESC;`,
          note: "Para moneda, une con `system.billing.list_prices` respetando SKU y periodo; este ejemplo evita fingir que DBU equivale directamente a coste.",
        },
        pitfalls: [
          "Multiplicar todas las DBU por un único precio sin considerar SKU ni vigencia contractual.",
          "Ignorar correcciones negativas y sobreestimar consumo histórico.",
        ],
        examDecision: "Usa system tables para coste neto y atribución; decide optimizaciones con coste por resultado y SLA, no sólo con DBU totales.",
        checkpoint: {
          question: "¿Por qué no conviene filtrar los registros con `usage_quantity < 0`?",
          answer: "Pueden ser retracciones de correcciones; eliminarlas deja el consumo original sin compensar y distorsiona el total.",
        },
      },
    ],
    lab: {
      title: "Plan FinOps para un portfolio híbrido",
      goal: "Asignar compute adecuado, guardrails y coste observable a tres workloads con SLA distinto.",
      scenario: "Un equipo ejecuta un dashboard SQL interactivo, un job batch diario tolerante a diez minutos de arranque y un pipeline con un conector no soportado en serverless. El gasto creció 38 % y parte del uso carece de centro de coste. Debes decidir compute, definir atribución y producir una consulta de control.",
      steps: [
        "Clasifica cada workload por lenguaje, SLA, conectividad y necesidad de control de infraestructura.",
        "Asigna SQL warehouse serverless, jobs serverless standard o jobs compute clásico según la evidencia.",
        "Diseña tags no sensibles y una serverless usage policy; añade guardrails al caso clásico.",
        "Consulta `system.billing.usage` por producto, workload y centro de coste preservando correcciones.",
        "Define dos alertas: incremento de coste y porcentaje de uso sin atribuir, con propietario y respuesta.",
      ],
      starterCode: `-- Completa una vista de atribución para los últimos 30 días.
SELECT
  usage_date,
  billing_origin_product,
  custom_tags['cost_center'] AS cost_center,
  usage_metadata.job_id AS job_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
-- Añade agrupación y una marca para uso no atribuido.`,
      solution: `CREATE OR REPLACE VIEW finops.ops.daily_attribution AS
SELECT
  usage_date,
  billing_origin_product,
  COALESCE(custom_tags['cost_center'], 'UNALLOCATED') AS cost_center,
  usage_metadata.job_id AS job_id,
  usage_metadata.warehouse_id AS warehouse_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
GROUP BY
  usage_date,
  billing_origin_product,
  COALESCE(custom_tags['cost_center'], 'UNALLOCATED'),
  usage_metadata.job_id,
  usage_metadata.warehouse_id,
  sku_name;

SELECT *
FROM finops.ops.daily_attribution
WHERE cost_center = 'UNALLOCATED'
   OR usage_quantity > 500
ORDER BY usage_date DESC, usage_quantity DESC;`,
      checks: [
        { label: "Consulta la tabla oficial de uso", pattern: "system\\.billing\\.usage" },
        { label: "Atribuye por custom_tags", pattern: "custom_tags\\['cost_center'\\]" },
        { label: "Conserva uso no asignado", pattern: "UNALLOCATED" },
        { label: "Agrega usage_quantity neta", pattern: "SUM\\(usage_quantity\\)" },
      ],
      expectedEvidence: [
        "Matriz de decisión de compute para los tres workloads y su excepción documentada.",
        "Vista diaria que exponga consumo sin centro de coste.",
        "Umbrales, propietario y runbook de las dos alertas FinOps.",
      ],
      cloudNotes: {
        AWS: "Para la excepción clásica, compara familias EC2, Graviton y spot en workers; al conciliar factura considera los tags propagados a recursos AWS y el egress de S3.",
        Azure: "Mapea node types a familias Azure VM y usa spot sólo en workers tolerantes; concilia los tags de Databricks con Azure Cost Management sin incluir PII.",
        GCP: "Evalúa familias Compute Engine y preemptible/spot en workers; contrasta los tags Databricks con Cloud Billing y el coste de operaciones/egress de GCS.",
      },
    },
    quiz: [
      {
        question: "Un job Python diario tolera seis minutos de arranque, usa APIs soportadas y no necesita red personalizada. ¿Qué opción inicial es más razonable?",
        options: [
          "Jobs serverless en modo standard.",
          "All-purpose clásico siempre encendido.",
          "SQL warehouse classic.",
          "Un clúster de un solo nodo sin autotermination.",
        ],
        answer: 0,
        explanation: "El workload es compatible y tolera el arranque; el modo standard reduce coste frente a performance optimized.",
        domain: "Operations · compute selection",
      },
      {
        question: "La duración está dominada por una única tarea con CPU alta; el resto de workers está ocioso. ¿Qué cambio NO aborda la causa?",
        options: [
          "Perfilar la clave que alimenta esa tarea.",
          "Revisar particionado y skew.",
          "Duplicar el máximo de workers sin cambiar el plan.",
          "Comprobar si la operación es serial o no paralelizable.",
        ],
        answer: 2,
        explanation: "Más workers no aceleran una tarea única; primero hay que recuperar paralelismo o corregir skew.",
        domain: "Operations · sizing",
      },
      {
        question: "¿Qué mecanismo atribuye tags a notebooks y jobs serverless en `system.billing.usage`?",
        options: [
          "Una init script global.",
          "Una serverless usage policy asignada al usuario o workload.",
          "Cambiar el nombre del warehouse.",
          "Un `VACUUM` programado.",
        ],
        answer: 1,
        explanation: "Las serverless usage policies propagan sus custom tags al registro de facturación.",
        domain: "Operations · governance",
      },
      {
        question: "Un informe de consumo excluye filas negativas de `system.billing.usage`. ¿Cuál es el riesgo?",
        options: [
          "Perder el nombre del notebook únicamente.",
          "Deshabilitar Photon.",
          "Convertir las DBU en horas de CPU.",
          "Ignorar retracciones de correcciones y sobreestimar consumo.",
        ],
        answer: 3,
        explanation: "Las correcciones pueden aparecer como retracción y restatement; hay que agregar la cantidad con signo.",
        domain: "Operations · FinOps",
      },
    ],
    sources: [
      { label: "Compute selection recommendations", href: "https://docs.databricks.com/aws/en/compute/choose-compute", reviewedAt },
      { label: "Best practices for serverless compute", href: "https://docs.databricks.com/aws/en/compute/serverless/best-practices", reviewedAt },
      { label: "Create and manage compute policies", href: "https://docs.databricks.com/aws/en/admin/clusters/policies", reviewedAt },
      { label: "Monitor the cost of serverless compute", href: "https://docs.databricks.com/aws/en/admin/system-tables/serverless-billing", reviewedAt },
    ],
  },

  m26: {
    lessons: [
      {
        summary: "Lee Spark UI de arriba abajo: job, stage, task y executor, manteniendo una hipótesis que conecte tiempo con datos y recursos.",
        explanation: [
          "Spark UI es la herramienta de detalle para compute clásico. Empieza por la timeline y el job más largo, entra en su stage crítico y compara tareas. Scheduling delay señala falta de slots o overhead; shuffle read/write muestra movimiento; spill, GC y duración extrema orientan a memoria o skew. Los executors permiten comprobar si el trabajo se distribuyó y si hubo pérdidas.",
          "No conviertas cada métrica en una receta. Un stage con 90 % de tiempo en una tarea no mejora con más workers; una etapa I/O-bound puede necesitar mejor layout o pruning. Conserva IDs de job, stage y run, captura percentiles y anota el plan o commit analizado para que otra persona reproduzca el diagnóstico.",
        ],
        keyPoints: [
          "Navega desde la duración global hasta la tarea que explica el cuello.",
          "Correlaciona tiempo, bytes, registros, spill y ejecutor.",
          "Guarda identificadores y baseline para reproducibilidad.",
        ],
        example: {
          language: "PySpark",
          title: "Etiquetar una ejecución antes de abrir Spark UI",
          code: `spark.sparkContext.setJobGroup(
    "daily-margin-2026-07-21",
    "Daily margin aggregation · release 4f2c9ab",
)

result = build_daily_margin(spark.table("prod.silver.order_lines"))
result.write.mode("overwrite").saveAsTable("prod.gold.daily_margin")`,
          note: "El job group facilita localizar la ejecución correcta; no registres secretos ni datos personales en la descripción.",
        },
        pitfalls: [
          "Mirar sólo la página Executors y perder la etapa concreta que causa el problema.",
          "Comparar una ejecución fría con otra caliente sin registrar caché y volumen.",
        ],
        examDecision: "En compute clásico, empieza por la timeline, baja al stage más largo y decide con la distribución de tareas antes de cambiar recursos.",
        checkpoint: {
          question: "¿Qué vista usarías para demostrar que cinco tareas concentran el shuffle de una etapa?",
          answer: "Los detalles del stage y su tabla de tasks en Spark UI, comparando bytes de shuffle y duración por tarea.",
        },
      },
      {
        summary: "Usa Query Profile para serverless y SQL warehouses, separando cola, planificación, pruning y ejecución por operador.",
        explanation: [
          "Query Profile visualiza el DAG de operadores y métricas como filas, tiempo, memoria y I/O. El resumen distingue wall-clock de task time agregado: el segundo puede ser mayor porque suma trabajo paralelo. Los top operators revelan scans completos, joins explosivos y agregaciones caras; los indicadores de pruning muestran si el layout evita leer datos irrelevantes.",
          "En serverless no hay Spark UI, por lo que Query Profile y query history son la ruta principal. Una consulta servida desde cache puede no disponer de perfil; cambia de forma inocua la consulta para una medición controlada. Usa CAN MONITOR en el warehouse o propiedad de la consulta, y concede acceso al mínimo grupo operativo necesario.",
        ],
        keyPoints: [
          "Wall-clock y task time agregado miden fenómenos distintos.",
          "Top operators y DAG localizan el operador dominante.",
          "Pruning e I/O validan layout mejor que una sensación de rapidez.",
        ],
        example: {
          language: "SQL",
          title: "Consulta etiquetada para comparar perfiles",
          code: `-- incident: INC-2041 | variant: filtered-before-join
WITH recent_orders AS (
  SELECT order_id, customer_id, net_amount
  FROM prod.gold.orders
  WHERE order_date >= current_date() - INTERVAL 7 DAYS
)
SELECT c.segment, SUM(o.net_amount) AS revenue
FROM recent_orders o
JOIN prod.gold.customers c USING (customer_id)
GROUP BY c.segment;`,
          note: "Guarda statement ID, variante y ventana de datos; compara las mismas métricas y concurrencia.",
        },
        pitfalls: [
          "Interpretar task time agregado como duración percibida por el usuario.",
          "Optimizar el operador más vistoso sin comprobar si está en la ruta crítica.",
        ],
        examDecision: "Para SQL warehouse o serverless, usa Query Profile; identifica el top operator y valida el cambio con I/O, pruning y wall-clock.",
        checkpoint: {
          question: "¿Por qué task time puede superar wall-clock?",
          answer: "Porque suma el tiempo de tareas ejecutadas en paralelo en distintos cores, mientras wall-clock mide tiempo transcurrido.",
        },
      },
      {
        summary: "Convierte system tables en una línea de tiempo común para consultas, jobs, compute y coste a escala de cuenta y región.",
        explanation: [
          "`system.query.history` registra statements de SQL warehouses y serverless con estado, duración, compute y métricas. `system.lakeflow.job_run_timeline` y `job_task_run_timeline` permiten analizar ejecuciones y tareas de jobs; `system.billing.usage` aporta consumo. Estas tablas son regionales en gran parte, tienen retenciones documentadas y están gobernadas por Unity Catalog.",
          "Construye vistas restringidas para equipos en vez de conceder acceso amplio al catálogo `system`. Une usando IDs de job/run/statement disponibles y conserva intervalos temporales; no fuerces joins cuando la fuente no emite un identificador común. Una línea de tiempo fiable diferencia fallo de compute, cola, ejecución lenta y reintento posterior.",
        ],
        keyPoints: [
          "Respeta ámbito regional y retención de cada system table.",
          "Concede `USE` y `SELECT` mediante vistas de mínimo privilegio.",
          "Correlaciona por IDs y tiempo, declarando lag y huecos de telemetría.",
        ],
        example: {
          language: "SQL",
          title: "Detectar consultas fallidas y lentas",
          code: `SELECT
  workspace_id,
  statement_id,
  executed_by,
  execution_status,
  total_duration_ms,
  compute.type AS compute_type,
  error_message
FROM system.query.history
WHERE start_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (execution_status = 'FAILED' OR total_duration_ms > 600000)
ORDER BY start_time DESC;`,
          note: "Expón esta información mediante una vista que filtre workspaces o equipos; los mensajes pueden contener detalles sensibles.",
        },
        pitfalls: [
          "Asumir que una consulta desde otra región aparecerá en el metastore consultado.",
          "Dar `SELECT` amplio sobre auditoría y query history a todo el workspace.",
        ],
        examDecision: "Usa system tables para tendencias y correlación de cuenta; usa el perfil/UI del run para detalle puntual.",
        checkpoint: {
          question: "¿Por qué una vista dinámica es preferible a compartir directamente `system.query.history`?",
          answer: "Permite limitar filas y columnas por equipo o workspace y evitar exponer texto, errores e identidades innecesarias.",
        },
      },
      {
        summary: "Escoge event logs, driver logs o executor logs según el fallo y entiende cómo modo de acceso y retención limitan la investigación.",
        explanation: [
          "El compute event log explica creación, cambios, escalado y terminación. Driver stdout/stderr/log4j contiene excepciones de planificación y aplicación; los worker/executor logs ayudan cuando una tarea concreta falla. Spark UI conserva detalle del runtime activo, pero reiniciar compute puede perder la vista histórica; configura entrega de logs cuando la política de soporte exige retención externa.",
          "El acceso depende del modo de compute. En standard, los usuarios no ven todos los logs de executor y sólo admins acceden a ciertos driver logs; en dedicated, el principal asignado obtiene más visibilidad. No registres payloads, secretos o tokens para facilitar depuración. Usa correlation IDs y métricas estructuradas que permitan unir el fallo con job/run sin exponer datos.",
        ],
        keyPoints: [
          "Event log describe ciclo de vida; driver logs, aplicación; executor logs, tareas concretas.",
          "Planifica retención antes del incidente.",
          "El modo de acceso condiciona quién puede investigar cada señal.",
        ],
        example: {
          language: "Python",
          title: "Logging estructurado sin datos de negocio",
          code: `import json
import logging

logger = logging.getLogger("orders_pipeline")
logger.setLevel(logging.INFO)

logger.info(json.dumps({
    "event": "quality_gate_completed",
    "run_id": dbutils.widgets.get("run_id"),
    "table": "prod.silver.orders",
    "invalid_rows": invalid_count,
    "contains_customer_data": False,
}))`,
          note: "Evita imprimir registros fallidos completos; guarda muestras sensibles sólo en una cuarentena gobernada.",
        },
        pitfalls: [
          "Reiniciar compute antes de capturar evidencia que no tiene entrega persistente.",
          "Añadir `print(df.collect())` y filtrar datos personales a logs operativos.",
        ],
        examDecision: "Elige la señal más cercana a la capa fallida y preserva evidencia antes de reparar; no amplíes permisos de logs sin necesidad.",
        checkpoint: {
          question: "El compute no llegó a iniciar la aplicación. ¿Qué revisarías antes que los executor logs?",
          answer: "El compute event log y los driver/init-script logs, porque quizá nunca existieron executors útiles para la tarea.",
        },
      },
      {
        summary: "Automatiza una captura mínima con CLI y APIs, manteniendo autenticación segura, paginación y trazabilidad de cada artefacto.",
        explanation: [
          "La CLI ofrece comandos `jobs get-run`, `get-run-output`, `list-runs` y `repair-run`; el grupo `api` sirve para endpoints aún no envueltos. Una captura de incidente debe conservar run ID, estado, timestamps, configuración efectiva y enlaces a perfiles, no ejecutar reparaciones en el mismo paso. Usa OAuth para automatización y perfiles separados, nunca tokens pegados en scripts o notebooks.",
          "Las respuestas pueden paginarse y algunos outputs de tareas tienen límites. Diseña el script como lectura idempotente, almacena JSON en un volumen gobernado con retención y redacta campos sensibles. Después de formular una hipótesis, la reparación se convierte en una acción aprobada con evidencia antes/después.",
        ],
        keyPoints: [
          "Separa captura read-only de acciones de reparación.",
          "Usa OAuth/service principal y perfiles de entorno.",
          "Gestiona paginación, límites y redacción de datos sensibles.",
        ],
        example: {
          language: "CLI",
          title: "Captura read-only de un run",
          code: `databricks jobs get-run 987654321 --output json > run-987654321.json
databricks jobs get-run-output 987654321 --output json > output-987654321.json

# Inspecciona antes de cualquier repair-run.
# La autenticación procede de OAuth o de un perfil seguro, no del script.`,
          note: "Guarda los ficheros en un destino gobernado y aplica redacción si el output contiene parámetros sensibles.",
        },
        pitfalls: [
          "Ejecutar `repair-run` automáticamente al detectar cualquier fallo y borrar la evidencia causal.",
          "Guardar un PAT junto al script de diagnóstico o en el historial del shell.",
        ],
        examDecision: "Automatiza inventario y captura con CLI/API; deja repair/cancel como una fase controlada después del diagnóstico.",
        checkpoint: {
          question: "¿Por qué conviene separar la captura de `repair-run`?",
          answer: "Para preservar el estado causal, evitar mutaciones prematuras y permitir una decisión de reparación revisable.",
        },
      },
    ],
    lab: {
      title: "Expediente reproducible de una degradación",
      goal: "Correlacionar query history, job timeline y coste para priorizar el operador que realmente explica el incidente.",
      scenario: "El job `daily_margin` incumplió su SLA tres días seguidos. Dos runs fueron lentos y uno reintentó una tarea. El equipo sólo tiene capturas aisladas. Debes construir una vista de runs recientes, enlazar consultas lentas por ventana temporal y producir una secuencia de diagnóstico con acceso de mínimo privilegio.",
      steps: [
        "Extrae runs y task runs de `system.lakeflow` para el job y conserva IDs y tiempos.",
        "Localiza statements lentos o fallidos de la misma ventana en `system.query.history`.",
        "Clasifica tiempo de cola, ejecución, retry y fallo sin asumir causalidad por simple proximidad.",
        "Abre Query Profile o Spark UI del candidato y registra top operator, I/O, pruning, shuffle y spill aplicables.",
        "Crea una vista operativa limitada al equipo y un checklist de captura read-only por CLI.",
      ],
      starterCode: `-- Parámetros del incidente
-- job_id: 482901
-- window_start: 2026-07-18T00:00:00Z

WITH runs AS (
  SELECT *
  FROM system.lakeflow.job_run_timeline
  WHERE job_id = 482901
    AND period_start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
),
queries AS (
  SELECT *
  FROM system.query.history
  WHERE start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
)
-- Resume runs y consultas candidatas sin inventar una clave inexistente.`,
      solution: `CREATE OR REPLACE VIEW ops.observability.daily_margin_incident AS
WITH runs AS (
  SELECT
    workspace_id, job_id, run_id,
    period_start_time, period_end_time, result_state
  FROM system.lakeflow.job_run_timeline
  WHERE job_id = 482901
    AND period_start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
),
queries AS (
  SELECT
    workspace_id, statement_id, start_time, end_time,
    execution_status, total_duration_ms, error_message
  FROM system.query.history
  WHERE start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
)
SELECT
  r.job_id, r.run_id, r.result_state,
  r.period_start_time, r.period_end_time,
  q.statement_id, q.execution_status, q.total_duration_ms
FROM runs r
LEFT JOIN queries q
  ON q.workspace_id = r.workspace_id
 AND q.start_time BETWEEN r.period_start_time AND r.period_end_time
ORDER BY r.period_start_time DESC, q.total_duration_ms DESC;`,
      checks: [
        { label: "Usa timeline de runs", pattern: "system\\.lakeflow\\.job_run_timeline" },
        { label: "Incluye query history", pattern: "system\\.query\\.history" },
        { label: "Acota por intervalo temporal", pattern: "BETWEEN r\\.period_start_time AND r\\.period_end_time" },
        { label: "Expone statement y run IDs", pattern: "statement_id" },
      ],
      expectedEvidence: [
        "Línea de tiempo de runs, task retries y statements candidatos.",
        "Captura de perfil con operador dominante y métricas comparables.",
        "Hipótesis, nivel de confianza, siguiente prueba y permisos de la vista operativa.",
      ],
      cloudNotes: {
        AWS: "Si la evidencia apunta a capacidad, añade eventos EC2/spot y acceso a S3 al expediente; los system tables siguen siendo regionales respecto al metastore.",
        Azure: "Correlaciona eventos de Azure VM/spot y acceso a ADLS cuando proceda, sin sustituir los IDs de run y statement por timestamps aproximados.",
        GCP: "Añade eventos de Compute Engine/preemptible y métricas de GCS si explican el incidente; consulta system tables desde la región correcta.",
      },
    },
    quiz: [
      {
        question: "Un job clásico tarda 35 minutos. ¿Cuál es la secuencia de diagnóstico más eficiente en Spark UI?",
        options: [
          "Cambiar el node type y después abrir la UI.",
          "Leer todos los driver logs desde el principio.",
          "Empezar por la timeline, localizar el stage dominante y bajar a sus tasks.",
          "Ejecutar `collect()` para obtener una muestra local.",
        ],
        answer: 2,
        explanation: "La navegación descendente conecta duración global con la etapa y las tareas que realmente la explican.",
        domain: "Operations · monitoring",
      },
      {
        question: "Una consulta serverless no tiene Spark UI. ¿Qué herramienta muestra top operators, pruning, I/O y tiempo en Photon?",
        options: [
          "Query Profile.",
          "El navegador de DBFS.",
          "Compute event log clásico.",
          "Un `DESCRIBE HISTORY` de cualquier tabla.",
        ],
        answer: 0,
        explanation: "Query Profile es la interfaz de diagnóstico para SQL warehouses y serverless compute.",
        domain: "Operations · query diagnostics",
      },
      {
        question: "¿Qué práctica protege mejor el acceso a `system.query.history` para un equipo de soporte?",
        options: [
          "Conceder administración de cuenta a todo el equipo.",
          "Exportar diariamente todo el texto a un bucket público.",
          "Compartir capturas manuales sin IDs.",
          "Crear una vista restringida por workspace/equipo y columnas necesarias.",
        ],
        answer: 3,
        explanation: "La vista aplica mínimo privilegio y evita exponer texto, errores o identidades fuera del ámbito operativo.",
        domain: "Data governance · system tables",
      },
      {
        question: "Un script de guardia obtiene un run fallido y llama inmediatamente a `repair-run`. ¿Cuál es la principal debilidad?",
        options: [
          "La CLI no puede consultar jobs.",
          "Muta el incidente antes de preservar y evaluar la evidencia causal.",
          "Los repairs siempre crean un job nuevo.",
          "OAuth no funciona con la CLI.",
        ],
        answer: 1,
        explanation: "Captura y reparación deben separarse para conservar evidencia y evitar acciones automáticas incorrectas.",
        domain: "Operations · incident response",
      },
    ],
    sources: [
      { label: "Query profile", href: "https://docs.databricks.com/aws/en/sql/user/queries/query-profile", reviewedAt },
      { label: "System tables reference", href: "https://docs.databricks.com/aws/en/admin/system-tables", reviewedAt },
      { label: "Monitor Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/monitor", reviewedAt },
      { label: "Debugging with the Spark UI", href: "https://docs.databricks.com/aws/en/compute/troubleshooting/debugging-spark-ui", reviewedAt },
    ],
  },

  m27: {
    lessons: [
      {
        summary: "Dirige un incidente con severidad, roles, timeline y criterios de éxito explícitos antes de tocar configuración.",
        explanation: [
          "Un incidente de datos combina impacto técnico y de negocio: atraso, datos incorrectos, duplicados, indisponibilidad o sobrecoste. Declara severidad y alcance, asigna incident commander y comunicación, congela cambios no esenciales y establece una línea de tiempo en UTC con IDs de job, run, statement y commit. La primera meta es contener impacto sin destruir evidencia.",
          "Diferencia mitigación de causa raíz. Reprocesar una partición puede restaurar el SLA, pero no explica por qué falló; ampliar compute puede ganar tiempo, pero aumenta coste y oculta skew. Define criterios cuantificados de recuperación —freshness, completitud, duración, coste— y un rollback antes de ejecutar cualquier cambio.",
        ],
        keyPoints: [
          "Prioriza impacto y seguridad de datos sobre una optimización elegante.",
          "Registra cada hipótesis, acción, resultado e identificador.",
          "Separa mitigación inmediata de corrección permanente.",
        ],
        example: {
          language: "YAML",
          title: "Cabecera de un expediente de incidente",
          code: `incident: INC-2041
severity: SEV-2
started_at_utc: 2026-07-21T01:42:00Z
impact: "gold.sales_daily fuera de SLA; dashboards sin actualizar"
commander: data-platform-oncall
data_safety: "no ejecutar VACUUM ni borrar checkpoints"
recovery_criteria:
  freshness_minutes: 30
  duplicate_order_ids: 0
  p95_runtime_minutes: 24
rollback: "restaurar bundle release-2026.07.20"`,
          note: "El expediente es operativo: evita nombres de clientes y enlaza evidencia gobernada en lugar de pegar datos sensibles.",
        },
        pitfalls: [
          "Cambiar varias configuraciones a la vez y perder atribución causal.",
          "Declarar resuelto al terminar el job sin validar calidad y consumidores downstream.",
        ],
        examDecision: "Contén, preserva evidencia y define recuperación medible; la optimización permanente viene después de restaurar servicio seguro.",
        checkpoint: {
          question: "¿Qué diferencia una mitigación de una causa raíz?",
          answer: "La mitigación reduce impacto ahora; la causa raíz explica el mecanismo que originó el fallo y permite prevenir recurrencia.",
        },
      },
      {
        summary: "Triangula rendimiento con tres capas: plan y datos, recursos de ejecución y demanda/concurrencia del servicio.",
        explanation: [
          "Una regresión puede provenir de cambio de código, crecimiento o distribución de datos, estadísticas/layout, compute o concurrencia. Compara el último run sano con el primero degradado usando la misma ventana: plan, top operator, bytes leídos, shuffle, spill, workers y cola. Un diff de bundle o historial de tabla acota cambios sin especular.",
          "Formula hipótesis falsables: 'la clave nula genera skew' se prueba con distribución y tareas; 'el warehouse se satura' con cola y concurrencia; 'faltan estadísticas' con pruning y plan. Prioriza la prueba barata y reversible que más reduce incertidumbre. No redimensiones hasta saber si la etapa puede utilizar capacidad adicional.",
        ],
        keyPoints: [
          "Compara un run sano y uno degradado con volumen controlado.",
          "Distingue plan/datos, recursos y concurrencia.",
          "Prueba una hipótesis a la vez con métrica de aceptación.",
        ],
        example: {
          language: "SQL",
          title: "Baseline de consultas por p95 y datos leídos",
          code: `SELECT
  DATE_TRUNC('day', start_time) AS day,
  statement_type,
  percentile(total_duration_ms, 0.95) AS p95_duration_ms,
  SUM(read_bytes) AS read_bytes,
  COUNT(*) AS executions
FROM system.query.history
WHERE start_time >= current_timestamp() - INTERVAL 14 DAYS
  AND statement_type IN ('SELECT', 'MERGE')
GROUP BY day, statement_type
ORDER BY day DESC;`,
          note: "Ajusta nombres de métricas al esquema disponible en tu región; conserva statement IDs para abrir el perfil concreto.",
        },
        pitfalls: [
          "Comparar runs con ventanas de datos o caché diferentes.",
          "Tratar correlación temporal entre dos eventos como causa demostrada.",
        ],
        examDecision: "Antes de escalar, localiza si el tiempo está en cola, scan, shuffle, spill o una tarea extrema y cambia la palanca correspondiente.",
        checkpoint: {
          question: "¿Qué evidencia refutaría la hipótesis de falta de capacidad global?",
          answer: "Workers mayoritariamente ociosos y una única tarea dominante muestran que más capacidad paralela no se aprovecharía.",
        },
      },
      {
        summary: "Recupera fiabilidad respetando idempotencia, checkpoints, contratos Delta y límites exactos del backfill.",
        explanation: [
          "Antes de reintentar, determina el efecto parcial: qué commits Delta existen, qué tarea falló y si el sink externo recibió operaciones. Un `MERGE` con clave estable puede repetirse; un append sin deduplicación puede duplicar. En streaming, borrar un checkpoint cambia el progreso y el estado y rara vez es una reparación segura. Usa repair run para tareas fallidas cuando sus dependencias y outputs sean reutilizables.",
          "Un backfill debe declarar rango, versión de código, tabla destino, estrategia de overwrite/merge y validaciones. Aísla el proceso de la ingesta viva para evitar carreras y conserva una tabla de control de lotes. La recuperación termina cuando reconcilias conteos, claves únicas, freshness y consumidores, no sólo cuando el run aparece verde.",
        ],
        keyPoints: [
          "Inspecciona commits y efectos externos antes de reintentar.",
          "No borres checkpoints para resolver un fallo de código o calidad.",
          "Acota y valida cada backfill con una clave de lote.",
        ],
        example: {
          language: "SQL",
          title: "MERGE idempotente para un rango de backfill",
          code: `MERGE INTO prod.silver.orders AS target
USING staging.backfill_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;

SELECT order_id, COUNT(*) AS copies
FROM prod.silver.orders
GROUP BY order_id
HAVING COUNT(*) > 1;`,
          note: "La segunda consulta es una evidencia mínima; añade reconciliación de importes y rango temporal según el contrato.",
        },
        pitfalls: [
          "Borrar checkpoint y reprocesar toda la fuente sin conocer retención ni idempotencia.",
          "Ejecutar backfill y pipeline vivo sobre el mismo rango sin coordinación.",
        ],
        examDecision: "Repara sólo tareas fallidas cuando outputs previos son válidos; usa backfill acotado e idempotente cuando el dato histórico debe recalcularse.",
        checkpoint: {
          question: "¿Por qué un run verde después de un retry no demuestra recuperación completa?",
          answer: "Puede haber duplicados, efectos parciales o datos fuera de SLA; hay que validar contratos y consumidores downstream.",
        },
      },
      {
        summary: "Controla el gasto del incidente sin sacrificar evidencia ni convertir un aumento temporal de compute en deuda permanente.",
        explanation: [
          "Durante un incidente puede ser racional aumentar temporalmente capacidad para restaurar un SLA, pero registra quién lo aprobó, duración máxima y rollback automático. `system.billing.usage` permite atribuir el run y comparar coste por ejecución. Una reparación que reduce runtime pero duplica coste no es mejora salvo que el impacto evitado justifique esa compensación.",
          "Después de estabilizar, elimina recursos temporales, restaura límites de policies y calcula coste de reintentos, backfill y mantenimiento. Distingue coste causado por el incidente del baseline. Los presupuestos alertan; no sustituyen un control operativo de concurrencia, autotermination y modos serverless adecuados.",
        ],
        keyPoints: [
          "Todo escalado de emergencia necesita caducidad y rollback.",
          "Compara coste por run y cumplimiento de SLA.",
          "Incluye reintentos y backfills en el coste total del incidente.",
        ],
        example: {
          language: "SQL",
          title: "Consumo asociado a un job durante el incidente",
          code: `SELECT
  usage_date,
  usage_metadata.job_id AS job_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_metadata.job_id = '482901'
  AND usage_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-21'
GROUP BY usage_date, usage_metadata.job_id, sku_name
ORDER BY usage_date;`,
          note: "Une precios para moneda y compara con días sanos equivalentes; conserva correcciones de uso.",
        },
        pitfalls: [
          "Dejar un warehouse o clúster sobredimensionado después de la mitigación.",
          "Omitir el coste de retries y backfills al evaluar la solución.",
        ],
        examDecision: "Acepta capacidad temporal si restaura un SLA crítico con rollback; para la solución final exige rendimiento, fiabilidad y coste medidos juntos.",
        checkpoint: {
          question: "¿Qué dos datos mínimos acompañan un escalado de emergencia?",
          answer: "Un criterio de caducidad/rollback y una métrica de impacto que justifique el coste adicional.",
        },
      },
      {
        summary: "Cierra con un postmortem sin culpa que transforme la causa técnica en controles, pruebas y observabilidad verificables.",
        explanation: [
          "El postmortem reconstruye impacto, detección, timeline, causa raíz y factores contribuyentes con evidencia. Evita 'error humano' como causa final: pregunta qué guardrail, test o diseño permitió que una acción normal causara daño. Separa acciones correctivas por prevenir, detectar, mitigar y aprender, con propietario y fecha.",
          "Cada acción debe tener condición de cierre. 'Mejorar monitorización' no sirve; 'alertar si p95 supera 24 min durante dos runs y enlazar el Query Profile' sí. Actualiza runbooks, añade una prueba de regresión con distribución representativa y valida el fix bajo carga. Comparte el aprendizaje sin incluir datos sensibles del incidente.",
        ],
        keyPoints: [
          "Describe mecanismos y condiciones, no culpas.",
          "Convierte acciones en resultados verificables con propietario.",
          "Añade una prueba que reproduzca el patrón causal.",
        ],
        example: {
          language: "YAML",
          title: "Acciones correctivas verificables",
          code: `actions:
  - id: INC-2041-A1
    class: prevent
    owner: data-orders
    change: "test de skew con 45 % de claves nulas"
    done_when: "p95 de tareas < 3x mediana en CI de rendimiento"
  - id: INC-2041-A2
    class: detect
    owner: platform-observability
    change: "alerta de p95 runtime y enlace a statement_id"
    due: 2026-08-05`,
          note: "Una acción se cierra con evidencia; no marques completado sólo por crear un ticket.",
        },
        pitfalls: [
          "Usar 'formar al operador' como única acción ante un sistema sin guardrails.",
          "Cerrar tareas por despliegue sin verificar que el indicador cambió.",
        ],
        examDecision: "El postmortem útil produce controles medibles y una prueba de no regresión; una narración sin acciones no mejora la fiabilidad.",
        checkpoint: {
          question: "¿Qué hace verificable la acción 'añadir una alerta'?",
          answer: "Definir métrica, umbral, ventana, propietario, destino y una prueba que demuestre que dispara y conduce al runbook correcto.",
        },
      },
    ],
    lab: {
      title: "Recuperación integral de un pipeline dentro de SLA y presupuesto",
      goal: "Restaurar datos correctos, demostrar la causa y cerrar con controles de rendimiento, coste y fiabilidad.",
      scenario: "Una release cambió un join de `gold.sales_daily`. El runtime pasó de 19 a 61 minutos, un retry duplicó 0,4 % de pedidos y el clúster de emergencia duplicó el coste. Debes contener, reparar idempotentemente el rango afectado, validar el plan corregido y redactar acciones preventivas.",
      steps: [
        "Declara severidad, impacto, roles, ventana afectada, criterios de recuperación y acciones prohibidas.",
        "Compara release sana/degradada en plan, distribución de claves, stage crítico y coste por run.",
        "Corrige el join con filtros/proyección y una estrategia compatible; prueba con la distribución que causó skew.",
        "Repara el rango mediante `MERGE` idempotente y reconcilia duplicados, importes y freshness.",
        "Revierte el escalado temporal y valida dos runs consecutivos contra SLA y presupuesto.",
        "Entrega postmortem con causa, factores contribuyentes y al menos una acción preventiva y otra de detección.",
      ],
      starterCode: `-- Ventana afectada: 2026-07-18 a 2026-07-20
-- 1. Deduplica staging por order_id conservando el updated_at más reciente.
-- 2. Haz MERGE idempotente sobre prod.silver.orders.
-- 3. Añade queries de evidencia: duplicados, recuento e importe.

WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY order_id ORDER BY updated_at DESC
         ) AS rn
  FROM staging.recovered_orders
)
SELECT * FROM ranked WHERE rn = 1;`,
      solution: `CREATE OR REPLACE TEMP VIEW recovered_orders_dedup AS
SELECT * EXCEPT (rn)
FROM (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY order_id ORDER BY updated_at DESC
         ) AS rn
  FROM staging.recovered_orders
  WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
)
WHERE rn = 1;

MERGE INTO prod.silver.orders AS target
USING recovered_orders_dedup AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

SELECT COUNT(*) AS duplicate_keys
FROM (
  SELECT order_id
  FROM prod.silver.orders
  WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
  GROUP BY order_id
  HAVING COUNT(*) > 1
);

SELECT order_date, COUNT(*) AS rows, SUM(net_amount) AS net_amount
FROM prod.silver.orders
WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
GROUP BY order_date
ORDER BY order_date;`,
      checks: [
        { label: "Acota la ventana de recuperación", pattern: "BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'" },
        { label: "Deduplica por clave y recencia", pattern: "ROW_NUMBER\\(\\) OVER" },
        { label: "Aplica MERGE idempotente", pattern: "MERGE INTO prod\\.silver\\.orders" },
        { label: "Reconcilia duplicados", pattern: "HAVING COUNT\\(\\*\\) > 1" },
      ],
      expectedEvidence: [
        "Timeline con release, runs, mitigación y rollback del compute de emergencia.",
        "Cero claves duplicadas y reconciliación diaria de filas e importe.",
        "Dos runs dentro de SLA, comparación de coste y postmortem con acciones verificables.",
      ],
      cloudNotes: {
        AWS: "Incluye en el coste del incidente spot interruptions, EC2 temporal, requests/egress S3 y confirma que el driver de emergencia no quedó en spot.",
        Azure: "Registra evictions de Azure Spot, cambios de VM y transacciones/egress de ADLS; revierte capacidad temporal mediante la configuración versionada.",
        GCP: "Incluye preemptions de Compute Engine, cambios de machine type y operaciones/egress GCS; devuelve policies y límites al baseline aprobado.",
      },
    },
    quiz: [
      {
        question: "Durante un SEV-2, aumentar compute restaura el SLA pero la causa sigue desconocida. ¿Cómo debe registrarse?",
        options: [
          "Como solución permanente porque funcionó.",
          "Como causa raíz del incidente.",
          "Como prueba de que faltaba CPU.",
          "Como mitigación temporal con caducidad, coste y rollback.",
        ],
        answer: 3,
        explanation: "La acción reduce impacto, pero no demuestra causa; necesita límites y reversión explícitos.",
        domain: "Operations · incident management",
      },
      {
        question: "Un retry dejó el run verde, pero el sink era append y la primera ejecución escribió parcialmente. ¿Qué falta antes de cerrar?",
        options: [
          "Aumentar la retención del driver log.",
          "Reconciliar duplicados y efectos parciales del rango afectado.",
          "Ejecutar `VACUUM RETAIN 0 HOURS`.",
          "Borrar el historial del job.",
        ],
        answer: 1,
        explanation: "El estado verde no valida semántica; un append parcial puede duplicar datos después del retry.",
        domain: "Data processing · reliability",
      },
      {
        question: "¿Cuál es la mejor hipótesis falsable para una etapa con cinco stragglers?",
        options: [
          "Cinco claves calientes concentran datos; se comprobará con frecuencias y bytes por task.",
          "Spark está lento y necesita más nodos.",
          "El cloud provider tuvo un problema.",
          "La consulta es demasiado compleja.",
        ],
        answer: 0,
        explanation: "La hipótesis especifica mecanismo y evidencia que puede confirmarla o refutarla.",
        domain: "Operations · root cause analysis",
      },
      {
        question: "¿Qué acción de postmortem está definida de forma verificable?",
        options: [
          "Mejorar observabilidad pronto.",
          "Recordar al equipo que revise los joins.",
          "Alertar si p95 supera 24 min en dos runs, con owner, runbook y prueba de disparo.",
          "Ser más cuidadosos en producción.",
        ],
        answer: 2,
        explanation: "Incluye métrica, umbral, ventana, propietario y condición de prueba.",
        domain: "Operations · continuous improvement",
      },
    ],
    sources: [
      { label: "Monitor Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/monitor", reviewedAt },
      { label: "Query profile", href: "https://docs.databricks.com/aws/en/sql/user/queries/query-profile", reviewedAt },
      { label: "Billable usage system table reference", href: "https://docs.databricks.com/aws/en/admin/system-tables/billing", reviewedAt },
    ],
  },

  m28: {
    lessons: [
      {
        summary: "Separa lógica de negocio, adaptadores Databricks y puntos de entrada para que el mismo código pueda probarse sin ejecutar un notebook completo.",
        explanation: [
          "Un proyecto mantenible sitúa el paquete importable bajo `src/`, las pruebas bajo `tests/` y deja los notebooks como orquestadores finos. La lógica que transforma DataFrames vive en funciones con entradas y salidas explícitas; acceso a widgets, secretos, paths y escritura se encapsula en adaptadores. Así un cambio de notebook no es la única unidad desplegable ni verificable.",
          "`pyproject.toml` declara el paquete, versión de Python, dependencias y herramientas. El layout `src/` evita importar accidentalmente el código desde el directorio de trabajo en vez del artefacto instalado. En Databricks Runtime 16.0 o superior, un notebook no debe usarse como módulo Python: refactoriza código compartido a archivos `.py` o a una wheel.",
        ],
        keyPoints: [
          "Notebooks coordinan; módulos Python implementan lógica reutilizable.",
          "Separa transformaciones puras de lectura, escritura, widgets y secretos.",
          "Usa layout `src/` para probar el paquete que realmente distribuyes.",
        ],
        example: {
          language: "Python",
          title: "Transformación importable sin estado global",
          code: `# src/orders/transforms.py
from pyspark.sql import DataFrame, functions as F

def valid_orders(df: DataFrame) -> DataFrame:
    return (
        df.where(F.col("order_id").isNotNull())
          .where(F.col("net_amount") >= 0)
          .withColumn("order_date", F.to_date("ordered_at"))
          .select("order_id", "customer_id", "order_date", "net_amount")
    )`,
          note: "La función no conoce catálogo, widgets ni modo de escritura; esas decisiones pertenecen al entry point del job.",
        },
        pitfalls: [
          "Encapsular toda la pipeline en un notebook con variables globales y orden de celdas implícito.",
          "Importar un notebook como módulo cuando el runtime moderno exige archivos Python para código compartido.",
        ],
        examDecision: "Extrae lógica reutilizable a módulos y mantén los notebooks finos; un job productivo debe poder instalar y probar un artefacto versionado.",
        checkpoint: {
          question: "¿Por qué una función de transformación no debería leer directamente `dbutils.widgets`?",
          answer: "Porque acopla la lógica al notebook y dificulta pruebas; el entry point debe convertir parámetros y pasarlos a la función.",
        },
      },
      {
        summary: "Diseña contratos de DataFrame explícitos para que los tests detecten cambios de esquema, nulos, duplicados y semántica, no sólo errores de ejecución.",
        explanation: [
          "Spark evalúa de forma perezosa, por lo que construir un DataFrame no demuestra que la transformación sea válida. Las pruebas deben materializar un resultado pequeño y comparar esquema, filas y casos borde. Crea fixtures mínimas que incluyan nulos, duplicados, timestamps y valores inválidos; evita copiar datasets productivos con información sensible.",
          "Una transformación testable recibe DataFrames y parámetros ordinarios. Para comparar resultados, ordena por claves deterministas o utiliza utilidades de aserción de DataFrames disponibles en tu stack; nunca dependas del orden natural de particiones. Separa el contrato técnico —tipos y columnas— del contrato de negocio —por ejemplo, un único pedido por ID—.",
        ],
        keyPoints: [
          "Materializa acciones pequeñas para ejecutar el plan bajo prueba.",
          "Compara esquema y contenido con orden determinista.",
          "Incluye casos borde sintéticos y libres de datos personales.",
        ],
        example: {
          language: "Python",
          title: "Prueba unitaria de una transformación Spark",
          code: `# tests/test_transforms.py
from orders.transforms import valid_orders

def test_valid_orders_rejects_negative_amounts(spark):
    source = spark.createDataFrame(
        [(1, 7, "2026-07-20T10:00:00Z", 12.5),
         (2, 8, "2026-07-20T11:00:00Z", -4.0)],
        "order_id long, customer_id long, ordered_at string, net_amount double",
    )

    actual = valid_orders(source).orderBy("order_id").collect()

    assert [row.order_id for row in actual] == [1]
    assert str(actual[0].order_date) == "2026-07-20"`,
          note: "El fixture prueba un comportamiento concreto; añade tests separados para nulos, zona horaria y esquema.",
        },
        pitfalls: [
          "Afirmar sólo que `df.count()` no lanza error sin comprobar valores o esquema.",
          "Comparar listas no ordenadas y aceptar tests intermitentes por particionado.",
        ],
        examDecision: "Para lógica DataFrame, prueba entradas sintéticas mínimas, fuerza evaluación y valida esquema más reglas de negocio.",
        checkpoint: {
          question: "¿Por qué `result = transform(df)` no basta como test?",
          answer: "Por lazy evaluation: muchos errores aparecen sólo al ejecutar una acción, y aún no se ha comprobado la semántica del resultado.",
        },
      },
      {
        summary: "Distribuye wheels reproducibles y fija dependencias en el nivel correcto para evitar que notebook, job y serverless resuelvan entornos distintos.",
        explanation: [
          "Una wheel empaqueta módulos y metadatos en un artefacto versionado. Declara dependencias directas en `pyproject.toml`, crea un lock o constraints para CI y fija versiones cuando la reproducibilidad lo exija. En jobs, instala la wheel como librería de la tarea; para compute clásico puedes almacenarla en workspace files o Unity Catalog Volumes según modo de acceso y runtime.",
          "Serverless usa entornos y no admite init scripts. Fija paquetes y prueba el environment version seleccionado. Evita `%pip install` disperso por notebooks productivos: puede reiniciar Python, cambiar precedencia y hacer que dos tareas ejecuten código distinto. La promoción debe mover el mismo hash de wheel, no reconstruirla de fuentes diferentes en cada ambiente.",
        ],
        keyPoints: [
          "Promueve el mismo artefacto inmutable entre dev, test y prod.",
          "Declara dependencias directas y controla resolución transitiva.",
          "Adapta la instalación a serverless, access mode y ubicación gobernada.",
        ],
        example: {
          language: "Python",
          title: "Metadatos mínimos de paquete en pyproject.toml",
          code: `# pyproject.toml
[build-system]
requires = ["hatchling==1.27.0"]
build-backend = "hatchling.build"

[project]
name = "orders-pipeline"
version = "1.4.0"
requires-python = ">=3.11"
dependencies = [
  "pydantic==2.11.7",
]

[tool.pytest.ini_options]
testpaths = ["tests"]`,
          note: "No declares PySpark a ciegas como dependencia runtime si lo proporciona el entorno Databricks; documenta cómo lo aporta cada target de pruebas.",
        },
        pitfalls: [
          "Reconstruir la wheel en prod y obtener dependencias transitivas distintas a test.",
          "Usar init scripts para gestionar paquetes de serverless, donde no están soportados.",
        ],
        examDecision: "Construye una wheel una vez, verifica su hash y promueve ese artefacto; el entorno aporta Spark y las dependencias del proyecto quedan declaradas.",
        checkpoint: {
          question: "¿Qué riesgo evita promover exactamente la misma wheel de test a prod?",
          answer: "Evita divergencia de código o dependencias causada por reconstrucciones y resoluciones diferentes entre entornos.",
        },
      },
      {
        summary: "Combina tests unitarios rápidos con integración Databricks para cubrir catálogos, permisos, formatos y comportamiento distribuido.",
        explanation: [
          "Los tests unitarios verifican funciones y contratos con datos pequeños; no demuestran que el service principal pueda leer Unity Catalog, que la wheel se instale o que un `MERGE` sea idempotente. Las pruebas de integración despliegan en un catálogo aislado, ejecutan el entry point con identidad real y validan side effects. Deben usar nombres únicos por ejecución y limpiar sólo recursos etiquetados como temporales.",
          "Databricks permite ejecutar pytest en el workspace y Databricks Connect puede acercar desarrollo local al compute remoto. Mantén la pirámide: muchas pruebas sin red, menos integraciones y pocas pruebas end-to-end. Marca suites y establece timeouts para que CI no ejecute por accidente una carga completa.",
        ],
        keyPoints: [
          "Unit tests cubren lógica; integración cubre plataforma, permisos y side effects.",
          "Aísla catálogos/esquemas de prueba por ejecución.",
          "Marca suites lentas y limita datos, tiempo y coste.",
        ],
        example: {
          language: "Python",
          title: "Test de integración idempotente",
          code: `import pytest

@pytest.mark.integration
def test_merge_is_idempotent(spark, target_table, sample_orders):
    sample_orders.createOrReplaceTempView("incoming_orders")
    run_merge(spark, "incoming_orders", target_table)
    first = spark.table(target_table).count()

    run_merge(spark, "incoming_orders", target_table)
    second = spark.table(target_table).count()

    assert second == first`,
          note: "El fixture `target_table` debe crear un nombre aislado y eliminar sólo ese objeto al finalizar, incluso si el test falla.",
        },
        pitfalls: [
          "Ejecutar integraciones contra tablas compartidas y generar colisiones entre ramas.",
          "Sustituir toda prueba por mocks y no detectar permisos o DDL incompatibles.",
        ],
        examDecision: "Usa unit tests para lógica pura y una capa de integración acotada para identidad, catálogos, artefacto y side effects.",
        checkpoint: {
          question: "¿Qué fallo sólo detectaría probablemente una prueba de integración?",
          answer: "Que el service principal del job carece de `USE SCHEMA` o que la wheel no puede instalarse en el access mode elegido.",
        },
      },
      {
        summary: "Convierte calidad en una puerta de promoción: formato, tipos, unit tests, integración, seguridad y contrato del artefacto.",
        explanation: [
          "Una pipeline CI debe fallar pronto: lint y type check, tests unitarios, build de wheel, escaneo y validación del bundle. La integración se ejecuta con una identidad no humana y permisos mínimos en un target efímero o compartimentado. Conserva reporte de tests, hash del artefacto y commit para reconstruir la decisión de despliegue.",
          "Los secretos pertenecen al proveedor de identidad o al gestor de secretos del CI; prefiere OAuth workload identity/service principal a PAT de usuario. La promoción a producción requiere que el mismo artefacto superado sea referenciado por la configuración prod. Añade rollback a la versión anterior y una comprobación post-deploy antes de dirigir triggers reales.",
        ],
        keyPoints: [
          "Falla rápido antes de consumir compute remoto.",
          "CI usa identidad no humana y mínimo privilegio.",
          "Firma la promoción con commit y hash del artefacto.",
        ],
        example: {
          language: "YAML",
          title: "Orden de puertas en CI",
          code: `quality_gates:
  - name: unit
    command: pytest -m "not integration"
  - name: build
    command: python -m build
  - name: bundle_validate
    command: databricks bundle validate -t test
  - name: integration
    command: pytest -m integration
  - name: artifact_manifest
    command: sha256sum dist/*.whl`,
          note: "Adapta el sintaxis al CI elegido; el principio importante es que prod use el hash que superó estas puertas.",
        },
        pitfalls: [
          "Usar el PAT personal de un desarrollador y perder el pipeline cuando cambia de equipo.",
          "Desplegar desde la rama local después de que CI probó otro commit.",
        ],
        examDecision: "Promueve sólo artefactos trazables que superaron puertas automáticas con identidad de servicio; valida y conserva rollback.",
        checkpoint: {
          question: "¿Qué dos identificadores permiten demostrar qué código llegó a producción?",
          answer: "El commit de origen y el hash/version de la wheel desplegada.",
        },
      },
    ],
    lab: {
      title: "Empaquetar y probar una transformación de pedidos",
      goal: "Extraer lógica de notebook a un paquete, probar casos borde y definir una integración idempotente.",
      scenario: "Un notebook de 1.100 líneas normaliza pedidos, lee widgets en mitad de la lógica y escribe directamente en prod. Cada cambio exige ejecutar todo el notebook. Debes crear un módulo importable, pruebas unitarias y una prueba de integración que use una tabla aislada.",
      steps: [
        "Define `src/orders/transforms.py` con una función que reciba y devuelva DataFrames sin `dbutils`.",
        "Crea fixtures sintéticas para importe negativo, ID nulo, duplicado y timestamp inválido.",
        "Añade tests que materialicen resultados y validen esquema, filas y clave única.",
        "Declara paquete y dependencias en `pyproject.toml`; construye una wheel una vez.",
        "Diseña un test de integración idempotente con esquema o tabla única por run y limpieza segura.",
        "Registra hash de wheel, commit y resultados como evidencia de promoción.",
      ],
      starterCode: `from pyspark.sql import DataFrame

def normalize_orders(df: DataFrame) -> DataFrame:
    """Devuelve pedidos válidos con una fila por order_id."""
    # TODO: filtra ID/importe, convierte ordered_at y deduplica por updated_at.
    return df`,
      solution: `from pyspark.sql import DataFrame, Window, functions as F

def normalize_orders(df: DataFrame) -> DataFrame:
    latest = Window.partitionBy("order_id").orderBy(F.desc("updated_at"))

    return (
        df.where(F.col("order_id").isNotNull())
          .where(F.col("net_amount") >= 0)
          .withColumn("order_ts", F.to_timestamp("ordered_at"))
          .where(F.col("order_ts").isNotNull())
          .withColumn("_rank", F.row_number().over(latest))
          .where(F.col("_rank") == 1)
          .drop("_rank")
          .select(
              "order_id", "customer_id", "order_ts",
              "updated_at", "net_amount",
          )
    )`,
      checks: [
        { label: "Valida order_id", pattern: "order_id.*isNotNull" },
        { label: "Rechaza importes negativos", pattern: "net_amount.*>= 0" },
        { label: "Convierte y valida timestamp", pattern: "to_timestamp" },
        { label: "Deduplica por recencia", pattern: "row_number\\(\\).*over" },
      ],
      expectedEvidence: [
        "Suite unitaria con casos borde y salida determinista.",
        "Wheel y manifiesto con hash ligados al commit.",
        "Prueba de integración repetida dos veces sin duplicados y con limpieza limitada al recurso temporal.",
      ],
      cloudNotes: {
        AWS: "Para integración, usa un catálogo de test con storage credential hacia S3 y una identidad IAM de mínimo privilegio; almacena wheels en workspace files o Volumes según access mode.",
        Azure: "Aísla el esquema de test sobre ADLS Gen2 mediante managed identity o service principal; la wheel puede residir en workspace files o Unity Catalog Volumes.",
        GCP: "Usa una service account limitada al bucket GCS de test y un catálogo/esquema efímero; no copies credenciales de servicio al repositorio de pruebas.",
      },
    },
    quiz: [
      {
        question: "Un notebook importa otro notebook para reutilizar una función en un runtime moderno. ¿Qué refactor mejora testabilidad y compatibilidad?",
        options: [
          "Duplicar la celda en cada notebook.",
          "Mover la función a un archivo `.py` dentro de un paquete importable.",
          "Convertir la función en un widget.",
          "Guardar el código en un tag de compute.",
        ],
        answer: 1,
        explanation: "Los módulos Python son la unidad adecuada para código compartido; los notebooks deben coordinar y presentar.",
        domain: "Software engineering · project structure",
      },
      {
        question: "¿Qué prueba ofrece mejor evidencia sobre una transformación Spark?",
        options: [
          "Comprobar sólo que devuelve un objeto DataFrame.",
          "Revisar manualmente `show()` en producción.",
          "Comparar únicamente el número de columnas.",
          "Materializar datos sintéticos y validar esquema, filas y casos borde.",
        ],
        answer: 3,
        explanation: "La evaluación perezosa y los contratos de negocio requieren ejecutar y comparar un resultado concreto.",
        domain: "Software engineering · testing",
      },
      {
        question: "¿Cuál es la estrategia más reproducible para promover una librería?",
        options: [
          "Construir una wheel una vez y promover el mismo hash por ambientes.",
          "Ejecutar `%pip install` sin versión en cada notebook.",
          "Reconstruir desde `main` durante cada deploy.",
          "Instalar dependencias con init script en serverless.",
        ],
        answer: 0,
        explanation: "Un artefacto inmutable evita divergencias de código y resolución entre test y producción.",
        domain: "Software engineering · dependencies",
      },
      {
        question: "¿Qué debe cubrir una prueba de integración que un unit test puro no cubre?",
        options: [
          "La suma de dos números en Python.",
          "El formato del nombre de una función.",
          "Permisos reales, instalación de wheel y side effects Delta idempotentes.",
          "La ortografía del README.",
        ],
        answer: 2,
        explanation: "Esos comportamientos dependen de la plataforma y la identidad desplegada.",
        domain: "Software engineering · integration testing",
      },
    ],
    sources: [
      { label: "Python unit testing in the workspace", href: "https://docs.databricks.com/aws/en/files/python-unit-tests", reviewedAt },
      { label: "What are workspace files?", href: "https://docs.databricks.com/aws/en/files/workspace", reviewedAt },
      { label: "Install libraries", href: "https://docs.databricks.com/aws/en/libraries/", reviewedAt },
      { label: "Share code between Databricks notebooks", href: "https://docs.databricks.com/aws/en/notebooks/share-code", reviewedAt },
    ],
  },

  m29: {
    lessons: [
      {
        summary: "Modela código, artefactos y recursos Databricks como una unidad declarativa versionada mediante Declarative Automation Bundles.",
        explanation: [
          "Declarative Automation Bundles —antes Asset Bundles— describen jobs, pipelines, permisos, artefactos y configuración junto al código. `databricks.yml` identifica el bundle y puede incluir ficheros por dominio; `resources` usa el esquema de las APIs de Databricks, mientras `artifacts` construye wheels u otros entregables. `sync` controla qué fuentes se envían al workspace.",
          "Un bundle no reemplaza Terraform para infraestructura de cuenta o nube. Su frontera natural son recursos del proyecto dentro de Databricks. Evita un YAML monolítico: separa `resources/jobs.yml`, `resources/pipelines.yml` y variables; valida que referencias como `${resources.jobs.orders.id}` se resuelven sin hardcodear IDs entre ambientes.",
        ],
        keyPoints: [
          "El bundle une configuración de recursos y artefactos versionados.",
          "Usa includes y referencias en lugar de duplicar IDs.",
          "Mantén fuera credenciales e infraestructura cloud no propia del proyecto.",
        ],
        example: {
          language: "YAML",
          title: "Anatomía mínima de un bundle",
          code: `bundle:
  name: orders-platform

include:
  - resources/*.yml

artifacts:
  default:
    type: whl
    build: python -m build
    path: .

sync:
  include:
    - src/**
    - tests/**
  exclude:
    - .venv/**`,
          note: "El recurso job puede vivir en `resources/orders.job.yml` y referenciar la wheel construida por el artefacto.",
        },
        pitfalls: [
          "Guardar host, token o contraseña dentro de `databricks.yml`.",
          "Usar bundles para crear redes, buckets y metastores que pertenecen a otra capa de infraestructura.",
        ],
        examDecision: "Usa Bundles para el ciclo de vida del proyecto Databricks; reserva IaC de cuenta/cloud para Terraform u otra herramienta dedicada.",
        checkpoint: {
          question: "¿Qué ventaja aporta referenciar un job por `${resources.jobs.<key>.id}`?",
          answer: "El ID se resuelve por target y despliegue, evitando hardcodear identificadores distintos entre workspaces.",
        },
      },
      {
        summary: "Define targets dev, test y prod con overrides mínimos, rutas aisladas y modos que expresen claramente la intención de cada ambiente.",
        explanation: [
          "Un target aplica variables, workspace, modo y overrides a la misma definición base. Development mode añade aislamiento apropiado al desarrollador y permite iteración; production mode aplica validaciones y nombres estables. Las variables cambian catálogo, esquema, policy o warehouse, pero no deben duplicar toda la definición del job.",
          "Usa `${bundle.target}` y `${workspace.current_user.userName}` para rutas de desarrollo, y una identidad de despliegue estable en producción. Define `run_as` de forma explícita: quien despliega no tiene por qué ser quien ejecuta. Antes de promocionar, compara el plan para detectar eliminaciones o reemplazos inesperados.",
        ],
        keyPoints: [
          "Una base común reduce drift; targets sólo expresan diferencias reales.",
          "Aísla rutas y nombres de desarrollo por usuario/target.",
          "Separa deployment identity de `run_as` del workload.",
        ],
        example: {
          language: "YAML",
          title: "Targets con variables y modos",
          code: `variables:
  catalog:
    description: Catálogo de datos del target

targets:
  dev:
    mode: development
    default: true
    variables:
      catalog: dev
    workspace:
      root_path: /Workspace/Users/\${workspace.current_user.userName}/.bundle/\${bundle.name}/\${bundle.target}

  prod:
    mode: production
    variables:
      catalog: prod
    run_as:
      service_principal_name: \${var.prod_run_as}`,
          note: "Declara `prod_run_as` por un canal seguro de configuración; no pegues credenciales ni un ID de usuario personal.",
        },
        pitfalls: [
          "Copiar el job entero dentro de cada target y permitir que sus DAG diverjan.",
          "Ejecutar producción como el desarrollador que lanzó el deploy.",
        ],
        examDecision: "Mantén una definición común y limita overrides a catálogo, identidad, tamaño o schedule; producción usa service principal estable.",
        checkpoint: {
          question: "¿Por qué `run_as` debe separarse del usuario que ejecuta `bundle deploy`?",
          answer: "Para que permisos y continuidad del job dependan de una identidad de servicio gobernada, no de una persona.",
        },
      },
      {
        summary: "Usa `validate`, `plan`, `deploy` y `run` como puertas distintas; no conviertas un deploy correcto en prueba suficiente del workload.",
        explanation: [
          "`bundle validate` resuelve configuración y comprueba el esquema contra el target. `bundle plan` muestra acciones previstas sin aplicarlas. `bundle deploy` sincroniza artefactos y recursos, y `bundle run` ejecuta un recurso ya desplegado. Una pipeline segura captura el plan, requiere aprobación para cambios destructivos y despliega el mismo artefacto validado.",
          "La validación no ejecuta SQL ni demuestra permisos de datos del `run_as`. Después del deploy, ejecuta un smoke test con parámetros y datos acotados, comprueba estado y contrato, y sólo entonces habilita triggers o tráfico productivo. Usa `bundle summary` y output estructurado para trazabilidad.",
        ],
        keyPoints: [
          "Validate comprueba configuración; plan anticipa cambios; deploy aplica; run verifica ejecución.",
          "Revisa manualmente cambios destructivos antes de desplegar.",
          "Añade smoke test post-deploy antes de activar producción.",
        ],
        example: {
          language: "CLI",
          title: "Secuencia segura de promoción",
          code: `databricks bundle validate -t test
databricks bundle plan -t test
databricks bundle deploy -t test
databricks bundle run -t test orders_smoke -- --business_date 2026-07-20

# Tras aprobar evidencia y el plan de prod:
databricks bundle plan -t prod
databricks bundle deploy -t prod`,
          note: "No uses `--force` para saltar validaciones de rama como comportamiento normal de CI.",
        },
        pitfalls: [
          "Desplegar directamente en prod sin leer un plan que elimina o reemplaza recursos.",
          "Confundir bundle validado con job funcional sobre datos y permisos reales.",
        ],
        examDecision: "Valida y planifica antes de desplegar; prueba el recurso desplegado con un smoke test antes de activar el trigger.",
        checkpoint: {
          question: "¿Qué aporta `bundle plan` que no aporta `bundle validate`?",
          answer: "Muestra las acciones sobre recursos —crear, actualizar o eliminar— que el despliegue realizaría en ese target.",
        },
      },
      {
        summary: "Autentica CI con OAuth y aplica promoción por ambientes sin tokens personales, rebuilds ni edición manual del workspace.",
        explanation: [
          "CI debe usar workload identity federation o un service principal con OAuth y permisos limitados al workspace/recursos destino. Los secretos, hosts y client IDs viven en el sistema de CI o perfiles seguros. Un PAT personal tiene ciclo de vida humano, privilegios difíciles de justificar y riesgo de exposición; no es la identidad productiva adecuada.",
          "Construye y prueba la wheel, publica un manifiesto de hash, despliega en test y promueve el mismo artefacto a prod. Protege el ambiente prod con aprobación y branch policy. Prohíbe ediciones manuales de recursos gestionados por bundle o documenta un proceso de importación del cambio, porque el siguiente deploy puede sobrescribir drift.",
        ],
        keyPoints: [
          "CI usa OAuth y service principal de mínimo privilegio.",
          "El mismo hash atraviesa test y producción.",
          "Los recursos declarativos no se editan manualmente sin reconciliar código.",
        ],
        example: {
          language: "YAML",
          title: "Contrato conceptual de una promoción CI",
          code: `promotion:
  source_commit: 4f2c9ab
  artifact: orders_pipeline-1.4.0-py3-none-any.whl
  sha256: "<sha256-verificado-en-ci>"
  deploy_identity: sp-data-platform-cicd
  run_identity: sp-orders-prod
  gates:
    - bundle_plan_approved
    - integration_tests_passed
    - rollback_version_recorded`,
          note: "El fichero ilustra evidencia; las credenciales se obtienen por OAuth y nunca se escriben en el manifiesto.",
        },
        pitfalls: [
          "Reutilizar un PAT de administrador para todos los workspaces.",
          "Volver a construir el paquete en cada ambiente y perder identidad del artefacto.",
        ],
        examDecision: "CI/CD productivo usa identidad no humana, privilegios por target y promoción inmutable; evita cambios manuales que introduzcan drift.",
        checkpoint: {
          question: "¿Por qué un PAT personal es una mala dependencia de producción?",
          answer: "Expira o se revoca con la persona, suele tener permisos excesivos y no representa una identidad operativa estable.",
        },
      },
      {
        summary: "Gestiona drift, ownership, permisos y rollback como parte del bundle para que un despliegue sea reversible y auditable.",
        explanation: [
          "Un recurso creado manualmente puede incorporarse mediante generación o binding según soporte, pero primero hay que decidir quién será su fuente de verdad. Dos bundles no deben gestionar el mismo job. Usa permisos declarados, nombres estables y ownership operativo; revisa el plan cuando cambia la identidad o la ruta raíz porque puede aparentar un recurso nuevo.",
          "Rollback normalmente despliega la última versión conocida del bundle y artefacto, no restaura datos automáticamente. Los cambios de esquema requieren una estrategia compatible hacia delante y hacia atrás. Conserva manifest, plan y resultados de smoke test por release; si un deploy falla a mitad, inspecciona el estado real antes de relanzar.",
        ],
        keyPoints: [
          "Un recurso tiene una sola fuente de verdad y un único bundle propietario.",
          "Rollback de configuración no revierte side effects de datos.",
          "Revisa plan y estado real antes de reparar un deploy parcial.",
        ],
        example: {
          language: "CLI",
          title: "Inventario antes de reconciliar un recurso existente",
          code: `databricks bundle validate -t prod
databricks bundle plan -t prod
databricks bundle summary -t prod

# Si el job ya existe, documenta ownership y usa el flujo
# de generación/binding soportado en lugar de duplicarlo.`,
          note: "No ejecutes binding a ciegas: confirma que ningún otro bundle o proceso gestiona ese recurso.",
        },
        pitfalls: [
          "Crear un job duplicado porque cambió `root_path` o la identidad del bundle.",
          "Creer que desplegar la versión anterior revierte filas ya escritas.",
        ],
        examDecision: "Ante drift, establece primero la fuente de verdad; usa plan/binding de forma consciente y diseña rollback de datos por separado.",
        checkpoint: {
          question: "¿Qué no resuelve por sí solo volver a desplegar el bundle anterior?",
          answer: "No revierte tablas, mensajes o side effects que la versión defectuosa ya produjo.",
        },
      },
    ],
    lab: {
      title: "Promoción reproducible de un job Python wheel",
      goal: "Crear un bundle con targets aislados, artefacto único, identidad de ejecución y una secuencia validate-plan-deploy-run.",
      scenario: "El job `orders_quality` se configuró manualmente en tres workspaces y sus parámetros divergieron. Debes declararlo una vez, usar catálogos dev/test/prod, ejecutar como service principal en producción y conservar el hash exacto de la wheel promovida.",
      steps: [
        "Crea `databricks.yml` con bundle, includes, artifact wheel y variable `catalog`.",
        "Define el job en `resources/orders.job.yml` con parámetros y referencia al artefacto.",
        "Configura targets dev, test y prod; aísla rutas dev y usa `run_as` no humano en prod.",
        "Ejecuta validate y plan en test, despliega y lanza un smoke test acotado.",
        "Promueve el mismo hash a prod sólo tras aprobar plan, permisos y rollback.",
        "Documenta ownership para evitar que el job vuelva a editarse manualmente.",
      ],
      starterCode: `bundle:
  name: orders-quality

variables:
  catalog:
    description: Catálogo del ambiente

# TODO: artifact wheel, resources y targets dev/test/prod.
# Producción debe usar un service principal en run_as.`,
      solution: `bundle:
  name: orders-quality

include:
  - resources/*.yml

variables:
  catalog:
    description: Catálogo del ambiente
  prod_run_as:
    description: Application ID del service principal productivo

artifacts:
  default:
    type: whl
    path: .
    build: python -m build

targets:
  dev:
    mode: development
    default: true
    variables:
      catalog: dev
    workspace:
      root_path: /Workspace/Users/\${workspace.current_user.userName}/.bundle/\${bundle.name}/\${bundle.target}
  test:
    variables:
      catalog: test
  prod:
    mode: production
    variables:
      catalog: prod
    run_as:
      service_principal_name: \${var.prod_run_as}`,
      checks: [
        { label: "Construye una wheel", pattern: "type: whl" },
        { label: "Incluye tres targets", pattern: "dev:[\\s\\S]*test:[\\s\\S]*prod:" },
        { label: "Aísla la ruta de desarrollo", pattern: "workspace\\.current_user\\.userName" },
        { label: "Usa service principal en producción", pattern: "service_principal_name" },
      ],
      expectedEvidence: [
        "Salida de validate y plan de test sin cambios destructivos inesperados.",
        "Smoke test exitoso con catálogo test y permisos del `run_as`.",
        "Manifiesto de commit, hash de wheel, plan prod aprobado y versión de rollback.",
      ],
      cloudNotes: {
        AWS: "Configura OAuth del service principal y variables de rutas S3/storage credentials por target; la autenticación cloud del dato no debe hardcodearse en el bundle.",
        Azure: "Usa el service principal/managed identity adecuado para ADLS y OAuth de Databricks; mantén IDs y hosts en configuración segura del target CI.",
        GCP: "Separa el service principal Databricks de la service account usada por storage credentials de GCS; ninguna clave JSON debe entrar en YAML o Git.",
      },
    },
    quiz: [
      {
        question: "¿Qué herramienta del bundle muestra cambios previstos sin aplicarlos?",
        options: [
          "`databricks bundle plan`",
          "`databricks bundle run`",
          "`databricks jobs repair-run`",
          "`DESCRIBE HISTORY`",
        ],
        answer: 0,
        explanation: "Plan calcula las acciones del target y permite revisar creaciones, actualizaciones o eliminaciones antes de deploy.",
        domain: "Deployment · Bundles",
      },
      {
        question: "Tres targets duplican toda la definición del job y sólo cambia el catálogo. ¿Qué diseño reduce drift?",
        options: [
          "Tres repositorios independientes.",
          "Una definición base y una variable `catalog` sobrescrita por target.",
          "Editar manualmente el job después de cada deploy.",
          "Hardcodear IDs de tablas en el wheel.",
        ],
        answer: 1,
        explanation: "Los targets deben expresar sólo diferencias reales; duplicar recursos permite que el DAG diverja.",
        domain: "Deployment · environment promotion",
      },
      {
        question: "¿Qué identidad debe ejecutar un job productivo aunque un ingeniero lance el despliegue?",
        options: [
          "El último usuario que editó el YAML.",
          "Un administrador de cuenta compartido.",
          "Un service principal estable definido mediante `run_as`.",
          "Cualquier usuario con CAN VIEW.",
        ],
        answer: 2,
        explanation: "Separar deploy y ejecución estabiliza permisos, ownership y continuidad operativa.",
        domain: "Deployment · identity",
      },
      {
        question: "Desplegar la versión anterior del bundle después de un `MERGE` defectuoso, ¿qué garantiza?",
        options: [
          "Restaura automáticamente la tabla con time travel.",
          "Elimina todos los runs fallidos.",
          "Revoca las credenciales del CI.",
          "Restaura configuración/código declarado, pero no revierte por sí solo datos escritos.",
        ],
        answer: 3,
        explanation: "El rollback del deployment y el rollback o reparación de datos son problemas distintos.",
        domain: "Deployment · rollback",
      },
    ],
    sources: [
      { label: "What are Declarative Automation Bundles?", href: "https://docs.databricks.com/aws/en/dev-tools/bundles/", reviewedAt },
      { label: "Bundle command group", href: "https://docs.databricks.com/aws/en/dev-tools/cli/bundle-commands", reviewedAt },
      { label: "Declarative Automation Bundles resources", href: "https://docs.databricks.com/aws/en/dev-tools/bundles/resources", reviewedAt },
    ],
  },

  m30: {
    lessons: [
      {
        summary: "Construye acceso base con ownership, grupos y herencia de privilegios, evitando grants directos a personas y propietarios operativos ambiguos.",
        explanation: [
          "Unity Catalog evalúa privilegios en una jerarquía. Para consultar una tabla suelen intervenir `USE CATALOG`, `USE SCHEMA` y `SELECT`; los grants sobre catálogo o esquema pueden heredarse por descendientes según el modelo de privilegios. Ownership concede capacidades amplias, mientras `MANAGE` permite administrar permisos sin transferir propiedad en los objetos compatibles.",
          "Asigna privilegios a grupos de cuenta y service principals, no a usuarios individuales. Separa productores, consumidores y administradores de políticas. El propietario de un catálogo no debería ser una persona que puede marcharse, sino un grupo gobernado. Usa `SHOW GRANTS` e information schema para revisar acceso efectivo antes de añadir otro grant aparentemente necesario.",
        ],
        keyPoints: [
          "Concede a grupos y hereda desde el nivel más estable y limitado.",
          "Ownership no es el mecanismo cotidiano para consumir datos.",
          "Verifica privilegios efectivos y prerequisitos `USE` antes de ampliar acceso.",
        ],
        example: {
          language: "SQL",
          title: "Acceso de sólo lectura por grupo",
          code: `GRANT USE CATALOG ON CATALOG prod TO finance_analysts;
GRANT USE SCHEMA ON SCHEMA prod.gold TO finance_analysts;
GRANT SELECT ON TABLE prod.gold.daily_margin TO finance_analysts;

SHOW GRANTS ON TABLE prod.gold.daily_margin;`,
          note: "Si todo el esquema comparte el mismo contrato, evalúa un grant en esquema; no amplíes más de lo que el grupo necesita.",
        },
        pitfalls: [
          "Conceder `ALL PRIVILEGES` a usuarios para resolver un `USE SCHEMA` ausente.",
          "Dejar catálogos productivos propiedad de una cuenta personal.",
        ],
        examDecision: "Soluciona primero la cadena de `USE` y el privilegio mínimo sobre el objeto; usa grupos y ownership operativo estable.",
        checkpoint: {
          question: "Un grupo tiene `SELECT` sobre una tabla pero no puede consultarla. ¿Qué privilegios de navegación revisarías?",
          answer: "`USE CATALOG` en el catálogo y `USE SCHEMA` en el esquema que contiene la tabla.",
        },
      },
      {
        summary: "Escala protección con governed tags y ABAC para que nuevos objetos clasificados reciban políticas sin grants o masks manuales por tabla.",
        explanation: [
          "Governed tags son etiquetas de cuenta con valores permitidos y permisos de asignación. Heredan desde catálogo y esquema a objetos descendientes, salvo reglas específicas como columnas. ABAC evalúa esos atributos y aplica políticas de row filter o column mask en el ámbito definido. Así el equipo de gobierno escribe una política y los data stewards clasifican objetos sin poder desactivar la protección.",
          "ABAC requiere compute compatible y governed tags, no etiquetas libres. Cambios de tag pueden tardar unos minutos en aplicarse. Diseña taxonomías pequeñas —clasificación, región, dominio— y evita PII en valores de tag porque pueden replicarse globalmente. Prueba conflictos: si varias políticas distintas aplican al mismo usuario/objeto, el acceso puede bloquearse de forma segura.",
        ],
        keyPoints: [
          "Los tags gobernados controlan valores y quién puede asignarlos.",
          "ABAC separa autores de política de propietarios de tablas.",
          "Prueba compatibilidad de compute, herencia y conflictos de políticas.",
        ],
        example: {
          language: "SQL",
          title: "Clasificar una tabla con tags gobernados",
          code: `ALTER TABLE prod.hr.employees
SET TAGS (
  'data_classification' = 'restricted',
  'data_region' = 'eu'
);

SHOW TAGS ON TABLE prod.hr.employees;`,
          note: "Los tags deben existir y el ejecutor necesita permiso ASSIGN; la política ABAC se gestiona por separado en el ámbito del catálogo o esquema.",
        },
        pitfalls: [
          "Crear etiquetas libres con variantes `PII`, `pii` y `personal` y esperar una política coherente.",
          "Guardar nombres de clientes o emails en tags para decidir acceso.",
        ],
        examDecision: "Usa ABAC cuando muchas tablas comparten reglas basadas en clasificación; reserva asignación manual por tabla para excepciones concretas.",
        checkpoint: {
          question: "¿Por qué ABAC escala mejor que una mask configurada manualmente en cada tabla?",
          answer: "La política se aplica automáticamente a objetos que cumplen los tags y protege también nuevas tablas clasificadas sin intervención por objeto.",
        },
      },
      {
        summary: "Aplica row filters y column masks con funciones simples, deterministas y auditables, entendiendo su impacto en optimización e interoperabilidad.",
        explanation: [
          "Un row filter devuelve boolean y elimina filas que el usuario no debe ver; una column mask devuelve el valor original o transformado con un tipo compatible. Pueden asignarse directamente a una tabla mediante UDFs SQL o centralizarse con ABAC. La política se evalúa en query time y la seguridad prima sobre optimizaciones que pudieran filtrar información.",
          "Mantén UDFs simples: evita agregaciones, ventanas y lógica no determinista que limite `MERGE` o pushdown. Prueba cada grupo con usuarios representativos, incluyendo administradores exentos y service principals. Acceso por path y ciertos clientes externos no soportan tablas con políticas; inventaría interoperabilidad y crea una vista o share seguro cuando proceda.",
        ],
        keyPoints: [
          "Row filter controla filas; column mask transforma valores visibles.",
          "El tipo de la mask debe ser compatible con la columna.",
          "Políticas complejas pueden afectar DML, pushdown y clientes externos.",
        ],
        example: {
          language: "SQL",
          title: "Filtro regional y mask de email por tabla",
          code: `CREATE OR REPLACE FUNCTION prod.governance.region_filter(region STRING)
RETURN IF(is_account_group_member('finance_global'), TRUE, region = 'EU');

CREATE OR REPLACE FUNCTION prod.governance.mask_email(email STRING)
RETURN IF(
  is_account_group_member('pii_readers'),
  email,
  CONCAT('***@', element_at(split(email, '@'), -1))
);

ALTER TABLE prod.sales.customers
SET ROW FILTER prod.governance.region_filter ON (region);

ALTER TABLE prod.sales.customers
ALTER COLUMN email SET MASK prod.governance.mask_email;`,
          note: "El filtro fijo a EU es un ejemplo de laboratorio; en producción mapea identidad a región mediante una tabla de autorización gobernada.",
        },
        pitfalls: [
          "Implementar una mask que cambia STRING por un tipo incompatible.",
          "Usar una UDF no determinista o con subconsultas complejas y bloquear DML necesario.",
        ],
        examDecision: "Usa funciones simples y centraliza con ABAC a escala; valida DML y clientes compatibles antes de aplicar la política ampliamente.",
        checkpoint: {
          question: "¿Qué ocurre con una fila si el row filter devuelve FALSE?",
          answer: "La fila se excluye del resultado para ese usuario; la tabla base no se modifica.",
        },
      },
      {
        summary: "Demuestra quién hizo qué mediante `system.access.audit` y lineage, manteniendo separación de funciones y acceso restringido a telemetría sensible.",
        explanation: [
          "El audit log system table registra eventos de cuenta y workspace con identidad, servicio, acción, parámetros y respuesta. Consulta cambios de permisos, tags, policies y accesos dentro de la región y retención documentada. Los eventos de creación, modificación y eliminación de políticas ABAC son auditables; una alerta debe filtrar acciones relevantes y enlazar el objeto afectado.",
          "Lineage de Unity Catalog captura lecturas y escrituras a nivel de tabla y columna para interfaces compatibles, y ayuda a analizar impacto de un cambio o flujo de PII. No reemplaza auditoría: lineage explica flujo, audit explica acción/actor. Expón vistas redactadas a seguridad y operaciones; no distribuyas request parameters completos sin evaluar secretos o datos personales.",
        ],
        keyPoints: [
          "Audit responde actor y acción; lineage, procedencia y consumo.",
          "Restringe columnas y filas de telemetría según función.",
          "Alerta sobre cambios de grants, policies, tags y accesos anómalos.",
        ],
        example: {
          language: "SQL",
          title: "Auditar cambios de permisos y políticas",
          code: `SELECT
  event_time,
  user_identity.email AS actor,
  service_name,
  action_name,
  request_params,
  response.status_code AS status_code
FROM system.access.audit
WHERE event_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (
    lower(action_name) LIKE '%grant%'
    OR lower(action_name) LIKE '%policy%'
    OR lower(action_name) LIKE '%tag%'
  )
ORDER BY event_time DESC;`,
          note: "Valida los action names reales de tu cuenta y limita la vista; `request_params` puede contener información que no necesita todo el equipo.",
        },
        pitfalls: [
          "Conceder acceso al audit log completo a quienes sólo investigan un catálogo.",
          "Interpretar ausencia de lineage de una API no soportada como prueba de que no hubo acceso.",
        ],
        examDecision: "Para investigar permisos usa audit; para impacto upstream/downstream usa lineage; combina ambos sin ampliar acceso innecesariamente.",
        checkpoint: {
          question: "¿Qué fuente usarías para saber quién revocó un grant y cuál para descubrir dashboards afectados?",
          answer: "`system.access.audit` para actor/acción y Unity Catalog lineage para consumidores downstream.",
        },
      },
      {
        summary: "Integra privacidad con clasificación, minimización, workspace bindings, retención y pruebas de acceso negativas.",
        explanation: [
          "Privacidad no se limita a una mask. Clasifica datos, minimiza columnas, limita retención y separa ambientes. Workspace bindings restringen desde qué workspaces pueden usarse catálogos, external locations o storage credentials; combinados con grants y ABAC reducen el radio de exposición. Las tablas administradas permiten a Unity Catalog controlar también el ciclo de vida de almacenamiento.",
          "Prueba políticas desde tres perspectivas: usuario autorizado ve original, usuario restringido ve mask/filtro y principal no autorizado recibe denegación. Añade pruebas de path bypass, clones, time travel y shares según las limitaciones actuales. Cuando se comparte fuera, publica una vista/tabla derivada con minimización y contrato, no la tabla sensible por comodidad.",
        ],
        keyPoints: [
          "Combina clasificación, mínimo privilegio, bindings y ciclo de vida.",
          "Incluye pruebas negativas y de bypass en cada release de política.",
          "Comparte productos minimizados en lugar de exponer fuentes sensibles.",
        ],
        example: {
          language: "SQL",
          title: "Vista minimizada para consumo analítico",
          code: `CREATE OR REPLACE VIEW prod.analytics.customer_activity_safe AS
SELECT
  sha2(CAST(customer_id AS STRING), 256) AS customer_key,
  region,
  DATE_TRUNC('month', last_order_at) AS activity_month,
  order_count_12m
FROM prod.sales.customers
WHERE consent_analytics = TRUE;

GRANT SELECT ON VIEW prod.analytics.customer_activity_safe
TO marketing_analysts;`,
          note: "Hashing no es anonimización automática; evalúa reidentificación, salt/gestión de claves y necesidad real de cada atributo.",
        },
        pitfalls: [
          "Creer que una mask sustituye consentimiento, retención y minimización.",
          "Probar sólo con un administrador y no verificar la experiencia del usuario restringido.",
        ],
        examDecision: "Diseña defensa en profundidad y prueba allow/deny; una política correcta incluye también rutas, workspaces y activos compartidos.",
        checkpoint: {
          question: "¿Qué añade un workspace binding a un grant de Unity Catalog?",
          answer: "Limita desde qué workspaces puede accederse al objeto, reduciendo el ámbito aunque el principal tenga privilegios.",
        },
      },
    ],
    lab: {
      title: "Control fino de clientes por región y sensibilidad",
      goal: "Implementar un piloto de filtro/mask, tags gobernados y auditoría con pruebas positivas y negativas.",
      scenario: "Analistas regionales necesitan ventas de su región, el grupo `pii_readers` puede ver email completo y seguridad necesita auditar cambios. La tabla `prod.sales.customers` contiene EU/US y hoy todos los analistas tienen SELECT directo sin filtro.",
      steps: [
        "Define grupos, owner operativo y matriz de privilegios mínimos, incluidos `USE`.",
        "Clasifica tabla/columnas con governed tags y documenta la política ABAC objetivo.",
        "Crea UDFs simples y aplica un row filter regional y column mask de email como piloto controlado.",
        "Prueba usuario global, usuario restringido y principal sin acceso; valida también DML requerido.",
        "Crea una vista de audit log restringida para cambios de grants, masks y tags.",
        "Documenta migración del piloto por tabla a ABAC central antes de ampliar cobertura.",
      ],
      starterCode: `-- 1. Crea funciones region_filter y mask_email.
-- 2. Asócialas a prod.sales.customers.
-- 3. Consulta system.access.audit para cambios de política.

SHOW GRANTS ON TABLE prod.sales.customers;`,
      solution: `CREATE OR REPLACE FUNCTION prod.governance.region_filter(region STRING)
RETURN IF(is_account_group_member('finance_global'), TRUE, region = 'EU');

CREATE OR REPLACE FUNCTION prod.governance.mask_email(email STRING)
RETURN IF(
  is_account_group_member('pii_readers'),
  email,
  CONCAT('***@', element_at(split(email, '@'), -1))
);

ALTER TABLE prod.sales.customers
SET TAGS ('data_classification' = 'restricted');

ALTER TABLE prod.sales.customers
SET ROW FILTER prod.governance.region_filter ON (region);

ALTER TABLE prod.sales.customers
ALTER COLUMN email SET MASK prod.governance.mask_email;

SELECT event_time, user_identity.email, action_name, request_params
FROM system.access.audit
WHERE event_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (lower(action_name) LIKE '%grant%'
       OR lower(action_name) LIKE '%tag%'
       OR lower(action_name) LIKE '%mask%');`,
      checks: [
        { label: "Clasifica con tag gobernado", pattern: "data_classification" },
        { label: "Aplica row filter", pattern: "SET ROW FILTER" },
        { label: "Aplica column mask", pattern: "SET MASK" },
        { label: "Consulta auditoría", pattern: "system\\.access\\.audit" },
      ],
      expectedEvidence: [
        "Matriz de acceso y resultados de pruebas allow, masked/filtered y deny.",
        "Salida de `SHOW GRANTS` y tags sin PII.",
        "Vista/eventos de auditoría y evaluación de compatibilidad con DML y consumidores externos.",
      ],
      cloudNotes: {
        AWS: "Sincroniza grupos desde tu IdP/IAM Identity Center y gobierna storage credentials sobre S3; ABAC de Unity Catalog no reemplaza políticas IAM de mínimo privilegio.",
        Azure: "Usa grupos de Microsoft Entra ID y managed identities/service principals para ADLS; valida que workspace bindings y RBAC cloud no abran una ruta alternativa.",
        GCP: "Sincroniza grupos del proveedor de identidad y limita service accounts/storage credentials sobre GCS; las IAM policies cloud y Unity Catalog deben ser coherentes.",
      },
    },
    quiz: [
      {
        question: "Un grupo tiene `SELECT` en una tabla pero recibe un error de acceso al resolver el nombre. ¿Qué revisar primero?",
        options: [
          "`USE CATALOG` y `USE SCHEMA`.",
          "Photon en el warehouse.",
          "Deletion vectors.",
          "El número de workers.",
        ],
        answer: 0,
        explanation: "La navegación por catálogo y esquema es prerequisito habitual aunque exista SELECT en el objeto.",
        domain: "Data governance · privileges",
      },
      {
        question: "Cientos de tablas nuevas con tag `restricted` deben recibir la misma mask. ¿Qué opción escala mejor?",
        options: [
          "Un grant manual a cada owner.",
          "Una vista diferente creada por cada analista.",
          "Una política ABAC basada en governed tags en catálogo o esquema.",
          "Copiar la UDF a cada notebook.",
        ],
        answer: 2,
        explanation: "ABAC separa clasificación y política y cubre automáticamente objetos que cumplen el atributo.",
        domain: "Data governance · ABAC",
      },
      {
        question: "¿Qué combinación responde mejor a 'quién cambió un grant y qué dashboards dependen de la tabla'?",
        options: [
          "Sólo `DESCRIBE DETAIL`.",
          "Audit log para el cambio y lineage para consumidores downstream.",
          "Spark UI y driver logs.",
          "Billing usage y list prices.",
        ],
        answer: 1,
        explanation: "Auditoría registra actor/acción; lineage describe flujo y dependencias.",
        domain: "Data governance · auditing",
      },
      {
        question: "Una column mask devuelve un integer para una columna email STRING. ¿Qué problema existe?",
        options: [
          "Las masks sólo funcionan con números.",
          "Obliga a habilitar liquid clustering.",
          "Concede SELECT al owner automáticamente.",
          "El resultado debe ser compatible con el tipo de la columna protegida.",
        ],
        answer: 3,
        explanation: "La mask debe devolver el mismo tipo o uno castable; de lo contrario la política no es válida/usable.",
        domain: "Data governance · masks",
      },
    ],
    sources: [
      { label: "Access control in Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control", reviewedAt },
      { label: "Attribute-based access control in Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/abac", reviewedAt },
      { label: "Row filters and column masks", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks/", reviewedAt },
      { label: "Governed tags", href: "https://docs.databricks.com/aws/en/admin/governed-tags", reviewedAt },
    ],
  },

  m31: {
    lessons: [
      {
        summary: "Distingue Databricks-to-Databricks OpenSharing de Open-to-Databricks y elige autenticación OIDC antes que credenciales portables de larga duración.",
        explanation: [
          "OpenSharing es la evolución del intercambio abierto conocido históricamente como Delta Sharing. Entre metastores Databricks, el recipient accede mediante integración nativa y no necesita un fichero de credenciales. Para receptores sin Unity Catalog, el protocolo abierto permite Spark, pandas, Power BI y otros conectores mediante bearer token u OIDC federation.",
          "Los activos se consumen en modo read-only y el proveedor controla qué agrega al share. Prefiere OIDC con tokens cortos cuando el receptor puede federar su identidad; los bearer tokens requieren distribución segura, rotación y revocación. La nube del proveedor y receptor puede diferir, pero egress, ubicación y residencia siguen siendo decisiones de arquitectura.",
        ],
        keyPoints: [
          "Databricks-to-Databricks evita intercambiar ficheros de credenciales.",
          "OIDC reduce riesgo frente a bearer tokens largos.",
          "Compartir es read-only y no copia necesariamente los datos al receptor.",
        ],
        example: {
          language: "SQL",
          title: "Crear un share y añadir una tabla",
          code: `CREATE SHARE IF NOT EXISTS retail_partner;

ALTER SHARE retail_partner
ADD TABLE prod.shared.daily_inventory;

SHOW ALL IN SHARE retail_partner;`,
          note: "Antes de asignar un recipient, revisa columnas, historial compartido, región y contrato de datos.",
        },
        pitfalls: [
          "Enviar un bearer token por correo o guardarlo en un notebook compartido.",
          "Asumir que read-only elimina coste de egress o riesgo de reidentificación.",
        ],
        examDecision: "Usa Databricks-to-Databricks cuando ambos lados tienen UC; para clientes abiertos, prefiere OIDC y gobierna ciclo de vida del recipient.",
        checkpoint: {
          question: "¿Qué ventaja de seguridad ofrece OIDC frente a un bearer token duradero?",
          answer: "Intercambia identidad federada por credenciales OAuth de corta duración, reduciendo distribución y exposición de secretos persistentes.",
        },
      },
      {
        summary: "Publica un producto de datos mínimo mediante shares, views y recipients con ownership, contrato y revocación ensayada.",
        explanation: [
          "El proveedor crea un share, añade tablas, vistas u otros activos compatibles y concede acceso a un recipient. Una vista compartida puede minimizar columnas y filtrar datos según contrato, pero sus capacidades y coste dependen del modelo de sharing. El owner del share debe ser un grupo operativo y los cambios deben pasar revisión igual que un API público.",
          "Versiona esquema y comunica breaking changes. Monitoriza accesos, establece fecha de expiración del acuerdo y prueba revocación. No compartas la tabla bronze por conveniencia: crea una capa estable, documentada y sin campos internos. Si el receptor necesita escribir o transformar en origen, sharing no satisface ese requisito read-only.",
        ],
        keyPoints: [
          "Comparte un contrato estable, no una tabla interna mutable.",
          "Ownership y revocación forman parte del producto.",
          "Read-only no cubre casos que requieren escritura remota.",
        ],
        example: {
          language: "SQL",
          title: "Vista minimizada para un partner",
          code: `CREATE OR REPLACE VIEW prod.shared.partner_inventory AS
SELECT
  sku,
  DATE_TRUNC('day', snapshot_ts) AS snapshot_date,
  region,
  available_units
FROM prod.gold.inventory
WHERE partner_visible = TRUE;

ALTER SHARE retail_partner
ADD VIEW prod.shared.partner_inventory;`,
          note: "Comprueba requisitos actuales para compartir vistas y quién paga el compute asociado; prueba el resultado como recipient.",
        },
        pitfalls: [
          "Compartir campos internos y confiar en que el receptor no los use.",
          "Cambiar nombres/tipos sin versión ni aviso porque el share sigue siendo accesible.",
        ],
        examDecision: "Expón una vista o tabla de producto minimizada y versionada; sharing es un contrato externo, no un atajo a silver/bronze.",
        checkpoint: {
          question: "¿Por qué conviene compartir una vista estable en lugar de la tabla operacional?",
          answer: "Permite minimizar y desacoplar el contrato externo de columnas y cambios internos.",
        },
      },
      {
        summary: "Gobierna sharing con auditoría, residencia, egress, rotación y compatibilidad de políticas antes de incorporar un consumidor.",
        explanation: [
          "El proveedor conserva el control y puede revocar el recipient o retirar activos. Registra owner, propósito, región, base legal, clasificación, protocolo y método de autenticación. Audita acciones de shares/recipients y accesos según las system tables disponibles. Si usas bearer credentials, almacénalas como secretos, rota con solapamiento y destruye copias antiguas.",
          "Row filters/masks y ABAC tienen limitaciones específicas al compartir; no presupongas que una política aplicada a la fuente se reproduce igual en el receptor. Prueba el share con una identidad real del recipient. Modela egress cloud y foreign compute en el coste, especialmente para vistas, materialized views, streaming tables o datos federados.",
        ],
        keyPoints: [
          "Prueba la experiencia y restricciones desde el lado receptor.",
          "Incluye egress, compute y fuente remota en FinOps del share.",
          "Ensaya rotación y revocación antes del incidente.",
        ],
        example: {
          language: "SQL",
          title: "Inventario de objetos compartidos",
          code: `SHOW SHARES;
SHOW RECIPIENTS;
SHOW ALL IN SHARE retail_partner;

-- Conserva la salida con owner, propósito y fecha de revisión
-- en una tabla de control gobernada, no en una hoja personal.`,
          note: "Complementa el inventario con audit logs y el contrato del recipient; `SHOW` por sí solo no describe la base legal ni el coste.",
        },
        pitfalls: [
          "Suponer que una mask de la tabla base siempre se conserva igual en OpenSharing.",
          "Crear recipients sin owner o fecha de revisión y acumular acceso huérfano.",
        ],
        examDecision: "Antes de compartir, valida política efectiva, residencia, autenticación y coste desde el receptor; después monitoriza y recertifica.",
        checkpoint: {
          question: "¿Qué prueba demuestra mejor que una revocación funciona?",
          answer: "Revocar en un entorno controlado y comprobar desde la identidad del recipient que ya no puede enumerar o consultar el activo.",
        },
      },
      {
        summary: "Diferencia query federation de catalog federation y entiende dónde se ejecuta cada parte, qué se empuja y por qué ambas son read-only.",
        explanation: [
          "Lakehouse Federation ofrece acceso gobernado mediante foreign catalogs. Query federation conecta bases relacionales por JDBC: Databricks empuja filtros/agregaciones compatibles y parte de la consulta se ejecuta en el sistema remoto. Catalog federation conecta catálogos externos como Hive Metastore, AWS Glue o plataformas compatibles y Databricks lee datos del object storage con su propio compute.",
          "Ambas rutas son read-only y sirven exploración, BI o migración gradual, no sustituyen una ingesta para cargas intensivas repetidas. Comprueba pushdown con `EXPLAIN`, latencia de red, límites del origen y concurrencia. Una consulta que extrae millones de filas sin filtro puede saturar la base operacional aunque el warehouse Databricks tenga capacidad.",
        ],
        keyPoints: [
          "Query federation usa JDBC y compute remoto con pushdown.",
          "Catalog federation lee object storage usando compute Databricks.",
          "Para transformación frecuente o escritura, ingiere y materializa en lakehouse.",
        ],
        example: {
          language: "SQL",
          title: "Crear un foreign catalog sobre una conexión existente",
          code: `CREATE FOREIGN CATALOG finance_postgres
USING CONNECTION finance_pg
OPTIONS (database 'finance');

EXPLAIN FORMATTED
SELECT region, SUM(amount) AS revenue
FROM finance_postgres.public.invoices
WHERE invoice_date >= current_date() - INTERVAL 7 DAYS
GROUP BY region;`,
          note: "La conexión debe usar secretos y red privada/permitida; revisa el plan para verificar qué predicados se empujan.",
        },
        pitfalls: [
          "Tratar un foreign catalog como destino escribible de ETL.",
          "Lanzar scans completos contra una base OLTP en horario de máxima carga.",
        ],
        examDecision: "Usa federation para acceso read-only y exploratorio con pushdown; ingiere cuando el uso es repetitivo, intensivo, transformacional o necesita SLA independiente.",
        checkpoint: {
          question: "¿Dónde se ejecuta una consulta de query federation?",
          answer: "Parte en Databricks y parte en la base remota mediante pushdown JDBC, según operaciones soportadas.",
        },
      },
      {
        summary: "Selecciona sharing, federation o ingestión comparando dirección, frecuencia, frescura, escritura, gobierno, coste y aislamiento operacional.",
        explanation: [
          "Sharing publica un producto gobernado hacia consumidores externos; federation consulta una fuente externa in situ; ingestión copia cambios al lakehouse para transformación y SLA propios. Si un partner necesita leer una tabla curada, sharing evita una exportación. Si un analista explora PostgreSQL unas veces, federation reduce time-to-value. Si cientos de jobs agregan esa base cada hora, ingiere incrementalmente.",
          "Interoperabilidad no elimina contratos. Documenta tipos, time zones, semántica de deletes, límites y ownership. Considera Iceberg REST Catalog u otros protocolos cuando clientes externos deban leer tablas gobernadas directamente, siempre contrastando soporte de features Delta/ABAC. Diseña una salida: cómo revocar, materializar o migrar sin romper consumidores.",
        ],
        keyPoints: [
          "Sharing sirve publicación; federation, consulta in situ; ingestión, procesamiento controlado.",
          "La frecuencia y carga sobre el origen suelen decidir entre federation e ingesta.",
          "Cada patrón necesita contrato, owner, coste y estrategia de salida.",
        ],
        example: {
          language: "JSON",
          title: "Matriz de decisión de interoperabilidad",
          code: `{
  "use_case": "partner_inventory_daily",
  "direction": "outbound",
  "write_required": false,
  "freshness": "daily",
  "consumer_platform": "non_databricks",
  "classification": "internal",
  "selected_pattern": "open_sharing_oidc",
  "rejected": {
    "federation": "el partner no debe acceder al sistema operacional",
    "file_export": "duplica datos y credenciales"
  }
}`,
          note: "Una decisión útil conserva también el motivo de alternativas rechazadas y la fecha de revisión.",
        },
        pitfalls: [
          "Usar federation para una transformación horaria pesada y trasladar el cuello al OLTP.",
          "Exportar ficheros con credenciales estáticas cuando OpenSharing cubre el contrato.",
        ],
        examDecision: "Elige por dirección y patrón: outbound curado → sharing; lectura ocasional externa → federation; procesamiento recurrente/independiente → ingesta.",
        checkpoint: {
          question: "¿Qué señal indica que una consulta federada debería materializarse por ingesta?",
          answer: "Es frecuente, mueve mucho dato, carga el origen o necesita transformaciones/SLA que no deben depender del sistema remoto.",
        },
      },
    ],
    lab: {
      title: "Producto compartido y acceso federado con límites explícitos",
      goal: "Publicar inventario minimizado a un partner y diseñar una conexión federada segura para conciliación ocasional.",
      scenario: "Un partner sin Databricks necesita inventario diario read-only. Finanzas también consulta PostgreSQL dos veces al mes para conciliación. No se permite exportar CSV ni compartir credenciales permanentes; la base OLTP no debe recibir scans completos.",
      steps: [
        "Crea una vista de inventario con sólo columnas acordadas y contrato de esquema.",
        "Añade la vista a un share y diseña recipient OpenSharing con OIDC, owner y expiración.",
        "Prueba enumeración, lectura y revocación desde el receptor; registra egress y política efectiva.",
        "Define una connection gobernada a PostgreSQL y un foreign catalog sin secretos en código.",
        "Escribe una consulta de conciliación con filtros empujables y límite de ventana.",
        "Documenta cuándo migrar de federation a ingesta incremental.",
      ],
      starterCode: `CREATE SHARE IF NOT EXISTS retail_partner;

-- TODO: crea prod.shared.partner_inventory con datos mínimos.
-- TODO: añade la vista al share y muestra su inventario.
-- La conexión federada se crea con secretos fuera del código.`,
      solution: `CREATE OR REPLACE VIEW prod.shared.partner_inventory AS
SELECT
  sku,
  region,
  DATE_TRUNC('day', snapshot_ts) AS snapshot_date,
  available_units
FROM prod.gold.inventory
WHERE partner_visible = TRUE;

CREATE SHARE IF NOT EXISTS retail_partner;

ALTER SHARE retail_partner
ADD VIEW prod.shared.partner_inventory;

SHOW ALL IN SHARE retail_partner;

-- La conexión finance_pg ya existe y usa secretos gobernados.
CREATE FOREIGN CATALOG IF NOT EXISTS finance_postgres
USING CONNECTION finance_pg
OPTIONS (database 'finance');

SELECT invoice_date, SUM(amount) AS amount
FROM finance_postgres.public.invoices
WHERE invoice_date BETWEEN DATE '2026-07-01' AND DATE '2026-07-31'
GROUP BY invoice_date
ORDER BY invoice_date;`,
      checks: [
        { label: "Crea un producto minimizado", pattern: "partner_inventory" },
        { label: "Añade la vista al share", pattern: "ALTER SHARE retail_partner" },
        { label: "Declara foreign catalog", pattern: "CREATE FOREIGN CATALOG" },
        { label: "Acota la consulta remota", pattern: "BETWEEN DATE '2026-07-01' AND DATE '2026-07-31'" },
      ],
      expectedEvidence: [
        "Contrato del share, owner, recipient OIDC, resultado de lectura y prueba de revocación.",
        "Inventario de objetos compartidos sin columnas internas.",
        "Plan de consulta federada con filtro empujado y umbral documentado para migrar a ingesta.",
      ],
      cloudNotes: {
        AWS: "Calcula egress de S3 si el receptor está en otra región/nube y usa PrivateLink/VPC connectivity para la base federada cuando esté soportado; secretos en Unity Catalog connection.",
        Azure: "Evalúa egress de ADLS y residencia entre regiones; conecta Azure Database mediante red privada/allowlist adecuada y secretos gobernados, no en SQL versionado.",
        GCP: "Incluye egress de GCS y ubicación del recipient; para Cloud SQL usa conectividad permitida y una service account/secretos de mínimo privilegio.",
      },
    },
    quiz: [
      {
        question: "Dos organizaciones usan workspaces Unity Catalog. ¿Qué modelo evita intercambiar un fichero de credenciales?",
        options: [
          "Databricks-to-Databricks OpenSharing.",
          "Un export CSV a object storage público.",
          "Un bearer token compartido en chat.",
          "Query federation desde el receptor al metastore interno.",
        ],
        answer: 0,
        explanation: "La integración nativa entre metastores usa identidad de plataforma y no requiere el credential file del modelo abierto.",
        domain: "Data sharing · authentication",
      },
      {
        question: "Una base PostgreSQL se consulta de forma exploratoria y read-only con filtros selectivos. ¿Qué opción reduce tiempo de ingestión inicial?",
        options: [
          "Un backfill completo diario.",
          "OpenSharing outbound.",
          "Lakehouse query federation mediante foreign catalog.",
          "Copiar manualmente dumps a DBFS root.",
        ],
        answer: 2,
        explanation: "Federation ofrece acceso gobernado in situ y pushdown sin migrar primero los datos.",
        domain: "Interoperability · federation",
      },
      {
        question: "¿Cuándo conviene sustituir federation por ingesta incremental?",
        options: [
          "Cuando la consulta es mensual y filtra una fila.",
          "Cuando cargas frecuentes e intensivas afectan al origen y necesitan SLA propio.",
          "Cuando el catálogo se llama `foreign`.",
          "Siempre que el receptor use SQL.",
        ],
        answer: 1,
        explanation: "La materialización desacopla rendimiento y disponibilidad de una fuente remota sometida a carga repetida.",
        domain: "Interoperability · architecture",
      },
      {
        question: "Un partner no Databricks puede federar su IdP. ¿Qué autenticación es preferible para OpenSharing?",
        options: [
          "Una contraseña incluida en el nombre del share.",
          "Un PAT de administrador sin caducidad.",
          "Un bearer token publicado en Git.",
          "OIDC con intercambio por tokens OAuth de corta duración.",
        ],
        answer: 3,
        explanation: "OIDC evita distribuir una credencial portable de larga duración y facilita ciclo de vida centralizado.",
        domain: "Data sharing · security",
      },
    ],
    sources: [
      { label: "What is OpenSharing?", href: "https://docs.databricks.com/aws/en/opensharing", reviewedAt },
      { label: "Share data and AI assets securely", href: "https://docs.databricks.com/aws/en/data-sharing", reviewedAt },
      { label: "Connect to external databases and catalogs", href: "https://docs.databricks.com/aws/en/query-federation/", reviewedAt },
      { label: "What is query federation?", href: "https://docs.databricks.com/aws/en/query-federation/database-federation", reviewedAt },
    ],
  },

  m32: {
    lessons: [
      {
        summary: "Convierte requisitos ambiguos en una arquitectura defendible con SLO, contratos, ownership y trazabilidad hacia dominios Professional.",
        explanation: [
          "El proyecto final comienza con decisiones, no productos. Define volumen, latencia, freshness, calidad, retención, RPO/RTO, consumidores, clasificación, regiones y presupuesto. Después asigna cada requisito a una capacidad: Auto Loader/Lakeflow Connect para ingesta, pipelines declarativos para transformación, Jobs para orquestación, Unity Catalog para gobierno y system tables para operación.",
          "Documenta alternativas rechazadas y condiciones de cambio. Una arquitectura Professional no es la que usa más servicios, sino la que minimiza estados y responsabilidades ambiguas. Cada tabla, checkpoint, job, policy y alerta tiene owner; cada SLO tiene una señal medible y un runbook. Mapea además evidencias a los dominios del blueprint sin convertirlo en memorización.",
        ],
        keyPoints: [
          "Requisitos cuantificados preceden a la selección de servicios.",
          "Cada componente necesita estado, owner, SLO y estrategia de recuperación.",
          "Registra alternativas y triggers que obligarían a revisar la decisión.",
        ],
        example: {
          language: "YAML",
          title: "Contrato de arquitectura y SLO",
          code: `product: commerce-orders
owners:
  product: commerce-analytics
  platform: data-platform
slos:
  freshness_minutes: 15
  completeness_percent: 99.95
  p95_pipeline_minutes: 12
recovery:
  rpo_minutes: 15
  rto_minutes: 60
governance:
  classification: confidential
  regions: [eu-west, us-east]
finops:
  monthly_budget_eur: 18000`,
          note: "Cada valor debe enlazar a una medición y una respuesta; un SLO sin observabilidad es sólo una aspiración.",
        },
        pitfalls: [
          "Elegir componentes antes de aclarar latencia, volumen y ownership.",
          "Confundir alta disponibilidad de la plataforma con idempotencia y recuperación de la aplicación.",
        ],
        examDecision: "Ante un escenario complejo, identifica primero requisito dominante y estado que debe protegerse; sólo después selecciona el componente.",
        checkpoint: {
          question: "¿Qué convierte un requisito 'casi en tiempo real' en una decisión arquitectónica comprobable?",
          answer: "Un SLO de freshness cuantificado, su señal, ventana de medición y respuesta al incumplimiento.",
        },
      },
      {
        summary: "Diseña un flujo end-to-end idempotente desde ingestión y CDC hasta modelos curados, con backfill y evolución de esquema ensayados.",
        explanation: [
          "La ingesta incremental conserva progreso mediante checkpoint o estado del conector; bronze retiene hechos crudos suficientes para replay; silver aplica contratos, deduplicación y CDC; gold sirve modelos de consumo. Cada escritura usa una clave de negocio y semántica de retry conocida. Los datos tardíos, deletes y cambios de esquema tienen una política explícita, no un comportamiento accidental.",
          "Prueba replay y backfill antes de producción. Un pipeline vivo y un backfill no deben competir por el mismo rango sin coordinación. Usa `MERGE` o `APPLY CHANGES` según la herramienta y orden de secuencia, conserva cuarentena para incumplimientos y reconcilia conteos/importe entre capas. Versiona cambios incompatibles del contrato.",
        ],
        keyPoints: [
          "Checkpoint más bronze reproducible permiten recuperación sin volver al origen cuando la retención lo permite.",
          "CDC necesita clave, secuencia y semántica de deletes.",
          "Backfill se diseña y prueba como un modo operativo de primera clase.",
        ],
        example: {
          language: "SQL",
          title: "MERGE idempotente de pedidos CDC",
          code: `MERGE INTO prod.silver.orders AS target
USING staging.orders_cdc AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.op = 'DELETE' THEN DELETE
WHEN MATCHED AND source.sequence_ts > target.sequence_ts THEN UPDATE SET *
WHEN NOT MATCHED AND source.op <> 'DELETE' THEN INSERT *;`,
          note: "Deduplica previamente múltiples eventos por clave/secuencia y define qué hacer con eventos fuera de orden.",
        },
        pitfalls: [
          "Borrar checkpoint para forzar un replay sin comprobar retención y side effects.",
          "Aplicar CDC sin una secuencia determinista y sobrescribir un estado nuevo con un evento tardío.",
        ],
        examDecision: "Para CDC, exige clave y orden; para recovery, preserva bronze/checkpoint y ejecuta backfills acotados e idempotentes.",
        checkpoint: {
          question: "¿Qué tres elementos mínimos necesita un CDC determinista?",
          answer: "Clave de negocio, columna/criterio de secuencia y semántica explícita para inserts, updates y deletes.",
        },
      },
      {
        summary: "Opera el producto con expectations, event logs, system tables, lineage, alertas y runbooks que cubran datos y plataforma.",
        explanation: [
          "La observabilidad se diseña en capas: freshness y completitud del producto, calidad de registros, estado/duración/retries del pipeline, perfiles de consulta y coste. Expectations pueden fallar, descartar o registrar según severidad; event logs de pipelines explican updates y calidad; system tables agregan jobs, queries, billing, audit y lineage.",
          "Una alerta debe ser accionable: incluye umbral, ventana, owner, contexto y enlace al runbook. Evita alert fatigue agrupando síntomas del mismo fallo. En recuperación, valida downstream y no sólo el run. Usa lineage para impacto, audit para actor/cambio y Query Profile/Spark UI para rendimiento. Ensaya RTO con game days.",
        ],
        keyPoints: [
          "Mide producto, datos, ejecución y coste por separado.",
          "Cada alerta conduce a una decisión concreta y un owner.",
          "Prueba recovery y RTO; no confíes sólo en documentación.",
        ],
        example: {
          language: "SQL",
          title: "Indicador de freshness consumible por alertas",
          code: `CREATE OR REPLACE VIEW ops.slo.orders_freshness AS
SELECT
  MAX(processed_at) AS last_processed_at,
  TIMESTAMPDIFF(MINUTE, MAX(processed_at), current_timestamp()) AS freshness_minutes,
  CASE
    WHEN TIMESTAMPDIFF(MINUTE, MAX(processed_at), current_timestamp()) <= 15
      THEN 'OK'
    ELSE 'BREACH'
  END AS slo_state
FROM prod.silver.orders;`,
          note: "Distingue ausencia legítima de eventos de pipeline detenido; combina freshness con señal del origen y calendario de negocio.",
        },
        pitfalls: [
          "Alertar por cada tarea fallida aunque el retry automático recupere dentro del SLO.",
          "Declarar recuperación al ver un run verde sin medir freshness, duplicados y consumidores.",
        ],
        examDecision: "Elige la señal que representa impacto al consumidor y enlázala con telemetría técnica para diagnóstico; no alertes sólo por ruido interno.",
        checkpoint: {
          question: "¿Qué diferencia una métrica de producto de una métrica de ejecución?",
          answer: "La primera mide el resultado para el consumidor —por ejemplo freshness—; la segunda describe el mecanismo —duración, estado o retries del job—.",
        },
      },
      {
        summary: "Integra seguridad, privacidad y FinOps en el diseño: identidades de servicio, ABAC, datos minimizados y coste por unidad de valor.",
        explanation: [
          "Cada job ejecuta como service principal con privilegios mínimos; CI despliega con otra identidad. Unity Catalog aporta grupos, grants, governed tags, ABAC, masks y audit. Clasifica antes de compartir y restringe workspaces/locations. Los secretos se referencian desde scopes o mecanismos administrados, nunca desde notebooks, tags o YAML versionado.",
          "El coste se atribuye mediante tags/policies y `system.billing.usage`; compara coste por millón de pedidos y por SLO cumplido. Serverless reduce gestión, pero no elimina consultas ineficientes. Predicitive optimization, Photon y liquid clustering se habilitan donde el workload lo justifica y se validan con perfiles. El presupuesto incluye reintentos, backfills, egress y sharing/federation.",
        ],
        keyPoints: [
          "Separa identidad de deploy, run y consumo humano.",
          "La clasificación dirige policies y sharing minimizado.",
          "Optimiza coste por resultado, no sólo consumo bruto.",
        ],
        example: {
          language: "SQL",
          title: "Coste operativo atribuido por producto",
          code: `SELECT
  usage_date,
  custom_tags['data_product'] AS data_product,
  billing_origin_product,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
  AND custom_tags['data_product'] = 'commerce-orders'
GROUP BY usage_date, custom_tags['data_product'],
         billing_origin_product, sku_name
ORDER BY usage_date DESC;`,
          note: "Une precios efectivos y una métrica de pedidos procesados para convertir consumo en coste unitario.",
        },
        pitfalls: [
          "Ejecutar CI y producción con el mismo principal administrador.",
          "Aplicar una mask a la tabla pero compartir una copia sin esa protección.",
        ],
        examDecision: "Diseña identidad y política junto al dato; FinOps y seguridad son requisitos de arquitectura, no tareas posteriores al go-live.",
        checkpoint: {
          question: "¿Por qué conviene separar service principal de CI y de ejecución?",
          answer: "CI necesita gestionar recursos; el workload sólo necesita ejecutar y acceder a datos. Separarlos reduce privilegios y mejora auditoría.",
        },
      },
      {
        summary: "Resuelve el simulacro Professional como una revisión de decisiones: identifica requisito, descarta absolutismos y justifica con señales observables.",
        explanation: [
          "Las preguntas originales del simulacro deben ejercitar escenarios, no recordar frases. Lee primero la restricción dominante —SLA, recovery, mínimo privilegio, compatibilidad o coste— y después compara opciones. Descarta respuestas irreversibles, manuales o que eliminan estado sin diagnóstico. Cuando dos alternativas son técnicamente posibles, elige la que satisface requisitos con menor operación y mejor evidencia.",
          "Tras cada intento, agrupa errores por dominio y por tipo de razonamiento: confundir mitigación con solución, escalar antes de diagnosticar, ignorar idempotencia o ampliar permisos. Vuelve a los módulos y reproduce la decisión en un lab. El 80 % interno sólo señala preparación; no es nota oficial ni garantiza el examen. No uses dumps ni preguntas reales.",
        ],
        keyPoints: [
          "Extrae requisito y estado antes de leer las opciones como recetas.",
          "Prefiere decisiones reversibles, gestionadas y observables.",
          "Convierte errores del simulacro en prácticas dirigidas por dominio.",
        ],
        example: {
          language: "YAML",
          title: "Registro de revisión del simulacro",
          code: `attempt: professional-02
score_percent: 78
weak_domains:
  - performance_diagnosis
  - unity_catalog_abac
reasoning_errors:
  - "escalé antes de localizar el stage crítico"
  - "confundí SELECT con la cadena USE CATALOG/USE SCHEMA"
next_actions:
  - module: 23
    evidence: "comparar max/mediana por task en un join sesgado"
  - module: 30
    evidence: "probar allow, mask y deny con tres identidades"`,
          note: "Registra categorías y evidencia, no el texto de preguntas reales de certificación.",
        },
        pitfalls: [
          "Memorizar que una opción suele ser correcta por contener una palabra de producto.",
          "Repetir inmediatamente el mismo intento hasta recordar posiciones de respuestas.",
        ],
        examDecision: "Elige la opción que satisface la restricción con operación mínima y evidencia; evita absolutos como borrar, conceder todo o escalar siempre.",
        checkpoint: {
          question: "¿Qué revisión aporta más valor que repetir de inmediato el simulacro?",
          answer: "Clasificar el error de razonamiento, volver al dominio débil y producir una evidencia práctica antes del siguiente intento.",
        },
      },
    ],
    lab: {
      title: "Capstone Professional: comercio omnicanal gobernado",
      goal: "Entregar una arquitectura implementable con SLO, CDC, despliegue, observabilidad, seguridad, FinOps y recuperación demostrables.",
      scenario: "Una empresa ingiere pedidos CDC desde PostgreSQL y eventos de clickstream. Necesita silver en 15 minutos, gold horario, EU/US aislados, backfill de 90 días, compartir inventario con un partner y reducir coste 20 % sin empeorar el SLA. El equipo exige promoción dev/test/prod y RTO de 60 minutos.",
      steps: [
        "Especifica contratos, SLO, RPO/RTO, clasificación, ownership, regiones y presupuesto.",
        "Diseña ingesta CDC/eventos, bronze replayable, silver idempotente y gold dimensional con política de late data.",
        "Define Jobs/pipelines, targets Bundle, service principals y pruebas unitarias/integración.",
        "Diseña grants/ABAC, masks, workspace bindings y un producto OpenSharing minimizado.",
        "Crea métricas de freshness, calidad, p95, retries, coste unitario y alertas con runbook.",
        "Ejecuta tabletop de fallo y backfill; demuestra RTO, reconciliación y rollback.",
      ],
      starterCode: `product: commerce-orders
requirements:
  freshness_minutes: 15
  rpo_minutes: 15
  rto_minutes: 60
  backfill_days: 90

# Completa las secciones: architecture, data_contracts, delivery,
# governance, observability, finops, recovery y acceptance_evidence.`,
      solution: `product: commerce-orders
requirements:
  freshness_minutes: 15
  rpo_minutes: 15
  rto_minutes: 60
  backfill_days: 90
architecture:
  orders_cdc: lakeflow_connect
  clickstream: structured_streaming
  bronze: replayable_delta
  silver: keyed_sequence_aware_merge
  gold: hourly_dimensional_models
delivery:
  artifact: python_wheel
  automation: declarative_automation_bundle
  targets: [dev, test, prod]
  run_as: service_principal
governance:
  catalog: unity_catalog
  policy: governed_tags_plus_abac
  pii: column_masks
  partner: open_sharing_oidc_minimized_view
observability:
  product: [freshness, completeness, duplicate_keys]
  execution: [p95_runtime, retries, failed_tasks]
  cost: [cost_per_million_orders, unallocated_usage]
finops:
  serverless_mode: standard_for_scheduled_batch
  table_maintenance: predictive_optimization
  target_reduction_percent: 20
recovery:
  preserve: [checkpoints, bronze, delta_history]
  backfill: isolated_idempotent_range
  validation: [row_reconciliation, amount_reconciliation, downstream_freshness]
acceptance_evidence:
  - two_consecutive_runs_within_slo
  - tested_rto_under_60_minutes
  - zero_duplicate_order_ids
  - prod_bundle_hash_matches_test`,
      checks: [
        { label: "Define SLO y recuperación", pattern: "freshness_minutes:[\\s\\S]*rto_minutes:" },
        { label: "Incluye entrega declarativa", pattern: "declarative_automation_bundle" },
        { label: "Aplica gobierno y sharing", pattern: "governed_tags_plus_abac[\\s\\S]*open_sharing" },
        { label: "Exige evidencia verificable", pattern: "acceptance_evidence" },
      ],
      expectedEvidence: [
        "Diagrama/ADR con alternativas, estados, owners y mapping a requisitos.",
        "Resultados de unit/integration, plan Bundle y hash promovido.",
        "Dashboard SLO/coste y tabletop con RTO, backfill, reconciliación y rollback demostrados.",
      ],
      cloudNotes: {
        AWS: "Usa S3, IAM roles/storage credentials y conectividad privada a RDS/Kafka cuando corresponda; calcula egress del partner y separa regiones EU/US con catálogos/workspaces coherentes.",
        Azure: "Mapea almacenamiento a ADLS Gen2, identidades a Entra/managed identities y orígenes a Azure Database/Event Hubs; valida Private Link, residencia y egress del share.",
        GCP: "Usa GCS, service accounts/storage credentials y conectividad a Cloud SQL/Pub/Sub; respeta regiones del metastore, egress y aislamiento EU/US.",
      },
    },
    quiz: [
      {
        question: "Un requisito dice 'datos casi en tiempo real' sin más detalle. ¿Qué debe hacer primero el arquitecto?",
        options: [
          "Elegir streaming continuo.",
          "Aumentar el número de workers.",
          "Definir freshness SLO, volumen, tolerancia a late data y respuesta al breach.",
          "Crear una tabla particionada por segundo.",
        ],
        answer: 2,
        explanation: "La tecnología se elige después de convertir la ambigüedad en restricciones medibles.",
        domain: "Architecture · requirements",
      },
      {
        question: "Un CDC recibe dos updates fuera de orden para la misma clave. ¿Qué diseño evita que el antiguo sobrescriba al nuevo?",
        options: [
          "Aplicar clave y secuencia, aceptando sólo el evento más reciente.",
          "Ejecutar append y deduplicar en el dashboard.",
          "Borrar el checkpoint cada noche.",
          "Ordenar por hora de llegada del archivo únicamente.",
        ],
        answer: 0,
        explanation: "El CDC determinista necesita una secuencia de origen/negocio además de la clave.",
        domain: "Data processing · CDC",
      },
      {
        question: "El job terminó con éxito pero la tabla gold tiene freshness de 80 minutos frente a SLO 15. ¿Cuál es el estado del producto?",
        options: [
          "Sano porque el job está verde.",
          "Incumpliendo el SLO; hay que investigar la cadena y consumidores.",
          "Correcto si Photon estuvo activo.",
          "No puede determinarse sin borrar caché.",
        ],
        answer: 1,
        explanation: "El estado de ejecución no sustituye la métrica de resultado para el consumidor.",
        domain: "Operations · SLO",
      },
      {
        question: "CI despliega y el job ejecuta con el mismo principal administrador. ¿Qué mejora reduce el radio de impacto?",
        options: [
          "Añadir el token a un notebook para recuperación.",
          "Dar ownership de todos los catálogos al job.",
          "Compartir el principal con analistas para soporte.",
          "Separar identidad de deploy y `run_as`, cada una con privilegios mínimos.",
        ],
        answer: 3,
        explanation: "Las funciones requieren permisos distintos; separarlas mejora mínimo privilegio y auditoría.",
        domain: "Security · identity",
      },
    ],
    sources: [
      { label: "Data Engineer Professional exam guide", href: "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf", reviewedAt },
      { label: "Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/", reviewedAt },
      { label: "Best practices for performance efficiency", href: "https://docs.databricks.com/aws/en/lakehouse-architecture/performance-efficiency/best-practices", reviewedAt },
      { label: "Data and AI governance with Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance", reviewedAt },
    ],
  },
};

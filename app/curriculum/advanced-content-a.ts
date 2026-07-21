import type { ModuleContentPack } from "./content-types";

const reviewedAt = "21 jul 2026";

export const advancedContentA: Record<string, ModuleContentPack> = {
  m13: {
    lessons: [
      {
        summary: "Structured Streaming ejecuta una consulta incremental como una secuencia de microbatches y conserva el progreso necesario para continuar tras un fallo.",
        explanation: [
          "Una lectura con `readStream` describe un flujo que todavía no está en ejecución. Spark construye el plan, descubre qué datos nuevos están disponibles en cada trigger y solo entonces materializa un microbatch. La misma API de DataFrames permite reutilizar transformaciones batch, pero una operación válida en batch puede ser inviable en streaming si exige conservar estado sin límite.",
          "En un pipeline de pedidos conviene separar tres decisiones: cómo se descubre la entrada, qué transformaciones son incrementales y cómo se confirma la salida. El SLA no lo decide `readStream`; lo determinan el trigger, el volumen por lote, la capacidad y el comportamiento del sink ante reintentos.",
        ],
        keyPoints: [
          "`readStream` y `writeStream` definen una consulta continua; una acción batch no la inicia.",
          "Cada microbatch procesa un rango identificable de entrada y lo confirma en el checkpoint.",
          "Una transformación stateful requiere límites temporales y una estrategia de recuperación explícita.",
        ],
        example: {
          language: "PySpark",
          title: "Consulta incremental mínima con destino Delta",
          code: `orders = spark.readStream.table("main.bronze.orders")

query = (
    orders.where("order_id IS NOT NULL")
      .writeStream
      .option("checkpointLocation", "/Volumes/main/ops/checkpoints/orders_silver")
      .trigger(processingTime="1 minute")
      .toTable("main.silver.orders")
)`,
          note: "El objeto `query` permite consultar estado y progreso; el checkpoint debe ser exclusivo de esta consulta.",
        },
        pitfalls: [
          "Confundir la latencia del trigger con el tiempo real de proceso: si un lote tarda dos minutos, un trigger de diez segundos no crea capacidad adicional.",
          "Usar el mismo checkpoint para dos consultas o destinos distintos, mezclando offsets y commits incompatibles.",
        ],
        examDecision: "Si el requisito pide procesamiento incremental recuperable, busca una fuente streaming, un sink compatible y un checkpoint durable; no basta con ejecutar repetidamente una lectura batch.",
        checkpoint: {
          question: "¿Qué parte del código inicia realmente la consulta?",
          answer: "La llamada terminal del `DataStreamWriter`, en este caso `toTable`; `readStream` solo construye el plan.",
        },
      },
      {
        summary: "El trigger expresa cuándo intentar procesar datos disponibles; `processingTime` prioriza cadencia y `availableNow` vacía el backlog y termina.",
        explanation: [
          "`processingTime` mantiene una consulta activa y lanza microbatches con la periodicidad solicitada, siempre que el anterior haya acabado. Es apropiado para un dashboard que debe actualizarse durante todo el día. Reducir el intervalo por debajo de la duración real del lote solo aumenta la presión de planificación.",
          "`availableNow=True` procesa todos los datos disponibles en uno o varios microbatches y finaliza. Encaja con trabajos incrementales programados porque conserva checkpoints y límites por lote sin pagar por una consulta ociosa. También simplifica backfills controlados: el trabajo termina cuando alcanza el inicio del trigger.",
        ],
        keyPoints: [
          "`availableNow` conserva semántica incremental y puede crear varios lotes hasta agotar la entrada.",
          "Un trigger no sustituye el dimensionamiento ni controla por sí solo el tamaño del backlog.",
          "La elección se basa en SLA, patrón de llegada y modelo operativo, no en preferencia de sintaxis.",
        ],
        example: {
          language: "PySpark",
          title: "Ejecución incremental finita para un Job",
          code: `(
  spark.readStream.table("main.bronze.order_events")
    .writeStream
    .option("checkpointLocation", "/Volumes/main/ops/checkpoints/order_events")
    .trigger(availableNow=True)
    .toTable("main.silver.order_events")
    .awaitTermination()
)`,
          note: "La tarea del Job termina después de consumir el backlog disponible, pero la siguiente ejecución reanuda desde el mismo checkpoint.",
        },
        pitfalls: [
          "Sustituir `availableNow` por una lectura batch y perder el seguimiento incremental de offsets.",
          "Suponer que `availableNow` equivale a un único microbatch; puede dividir el backlog según los límites de la fuente.",
        ],
        examDecision: "Para una carga incremental orquestada que debe acabar y liberar compute, elige `availableNow`; para latencia continua, usa un trigger periódico o el modo compatible con el SLA.",
        checkpoint: {
          question: "¿Qué ocurre si llegan archivos mientras una ejecución `availableNow` está activa?",
          answer: "La ejecución procesa el conjunto delimitado por el trigger; los datos que queden fuera se recogerán en la siguiente ejecución desde el checkpoint.",
        },
      },
      {
        summary: "El checkpoint conserva offsets, commits y estado; forma parte de la identidad lógica de una consulta, no es una carpeta temporal.",
        explanation: [
          "Al reiniciar, Spark consulta el checkpoint para conocer qué rangos de la fuente fueron procesados y qué lotes se confirmaron en el sink. Las operaciones con estado añaden metadatos y datos del state store. Borrar la carpeta convierte el siguiente arranque en una consulta nueva y puede reintroducir datos o perder la posición esperada.",
          "No todos los cambios de código son compatibles con un checkpoint existente. Cambiar el número de fuentes, el topic Kafka, el tipo de sink, las claves de una agregación o el esquema del estado suele exigir un checkpoint nuevo y un plan de migración o reproceso. Un simple filtro suele ser compatible, aunque puede cambiar el resultado funcional.",
        ],
        keyPoints: [
          "Un checkpoint pertenece a una consulta y debe residir en almacenamiento durable y gobernado.",
          "Offsets y commits permiten reanudar; el state store permite reconstruir operadores stateful.",
          "Cambiar la topología stateful sin evaluar compatibilidad puede impedir el reinicio.",
        ],
        example: {
          language: "Python",
          title: "Ruta de checkpoint estable por entorno y pipeline",
          code: `catalog = spark.conf.get("app.catalog", "main")
environment = spark.conf.get("app.environment", "dev")
checkpoint = f"/Volumes/{catalog}/ops/checkpoints/{environment}/orders_v1"

assert environment in {"dev", "test", "prod"}
print({"checkpoint": checkpoint, "query_version": 1})`,
          note: "Versiona la consulta cuando un cambio incompatible requiera un checkpoint nuevo; conserva el anterior hasta verificar el cutover.",
        },
        pitfalls: [
          "Guardar checkpoints críticos en una ubicación efímera o eliminarlos como primera respuesta ante un fallo.",
          "Reutilizar el checkpoint de producción durante pruebas, avanzando offsets o alterando estado real.",
        ],
        examDecision: "Ante un cambio de claves, fuente o estado, evalúa compatibilidad del checkpoint antes de reiniciar; crear uno nuevo implica decidir desde qué datos reconstruir el resultado.",
        checkpoint: {
          question: "¿Por qué no debe borrarse un checkpoint para 'forzar' un reintento?",
          answer: "Porque se pierden offsets, commits y estado; la consulta deja de ser una reanudación y puede duplicar, omitir o reconstruir incorrectamente datos.",
        },
      },
      {
        summary: "La garantía extremo a extremo depende tanto del seguimiento de offsets como de que el sink confirme lotes de forma idempotente.",
        explanation: [
          "Los sinks Delta integrados coordinan los commits de cada microbatch con el checkpoint. Si una tarea falla después de escribir pero antes de confirmar, el reinicio puede volver a presentar el mismo lote y el sink debe reconocerlo. La garantía de la fuente por sí sola no impide duplicados en un servicio externo.",
          "`foreachBatch` abre la puerta a `MERGE`, múltiples destinos o APIs, pero transfiere responsabilidad al código. El `batch_id` y una clave de negocio estable permiten registrar el lote o hacer upsert determinista. Enviar eventos a un endpoint sin clave idempotente conserva, como mucho, semántica at-least-once.",
        ],
        keyPoints: [
          "Exactly-once es una propiedad del recorrido fuente–estado–sink, no una etiqueta aislada.",
          "`foreachBatch` permite lógica batch por microbatch y debe tolerar la repetición del mismo lote.",
          "Una clave de negocio suele ser más útil que confiar únicamente en el número de lote.",
        ],
        example: {
          language: "PySpark",
          title: "Upsert idempotente por microbatch",
          code: `from delta.tables import DeltaTable

def upsert_orders(batch_df, batch_id):
    target = DeltaTable.forName(spark, "main.silver.orders_current")
    (target.alias("t")
      .merge(batch_df.alias("s"), "t.order_id = s.order_id")
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute())

(orders.writeStream
  .foreachBatch(upsert_orders)
  .option("checkpointLocation", "/Volumes/main/ops/checkpoints/orders_upsert")
  .start())`,
          note: "El `MERGE` debe resolver múltiples cambios de la misma clave dentro del lote antes del upsert.",
        },
        pitfalls: [
          "Hacer `append` en `foreachBatch` y asumir que el checkpoint evita cualquier repetición posterior al fallo.",
          "Ejecutar varias acciones sobre `batch_df` sin persistirlo cuando el coste de recomputación sea relevante.",
        ],
        examDecision: "Si el sink no participa en commits exactamente una vez, diseña idempotencia explícita con clave o ledger de lotes y acepta que la entrega puede repetirse.",
        checkpoint: {
          question: "¿Qué debe garantizar una función `foreachBatch` para soportar reintentos?",
          answer: "Que ejecutar de nuevo el mismo microbatch produzca el mismo estado final, normalmente mediante deduplicación, `MERGE` o una clave idempotente.",
        },
      },
      {
        summary: "El progreso de una consulta permite separar falta de entrada, capacidad insuficiente, estado creciente y problemas del sink.",
        explanation: [
          "`lastProgress` expone tasas de entrada y proceso, duración de fases, offsets y métricas de estado. Si `inputRowsPerSecond` supera sostenidamente `processedRowsPerSecond`, crece el backlog; si no hay filas nuevas, una latencia alta puede proceder del trigger o del propio sink. En Kafka, el desfase de offsets aporta otra señal independiente.",
          "La operación necesita umbrales vinculados al SLA: frescura máxima, duración p95 del lote, filas descartadas y tamaño del estado. Un runbook útil conecta cada alerta con hipótesis y acciones seguras, evitando reiniciar o borrar checkpoints sin diagnóstico.",
        ],
        keyPoints: [
          "Compara tasa de llegada con tasa de proceso a lo largo de varios lotes, no en una sola muestra.",
          "`stateOperators` revela filas y memoria mantenidas por agregaciones, joins o deduplicación.",
          "La frescura de negocio requiere comparar el máximo event time publicado con el reloj, no solo observar que el query está activo.",
        ],
        example: {
          language: "Python",
          title: "Inspección defensiva del último progreso",
          code: `progress = query.lastProgress or {}
summary = {
    "batch_id": progress.get("batchId"),
    "input_rps": progress.get("inputRowsPerSecond", 0),
    "processed_rps": progress.get("processedRowsPerSecond", 0),
    "batch_ms": progress.get("durationMs", {}).get("triggerExecution"),
    "state": progress.get("stateOperators", []),
}
print(summary)`,
          note: "En producción, envía estas métricas a una tabla o plataforma de monitorización en vez de depender de impresiones del driver.",
        },
        pitfalls: [
          "Interpretar una consulta `ACTIVE` como prueba de que cumple el SLA de frescura.",
          "Aumentar compute sin comprobar si el cuello está en el sink, el estado, el throttling de la fuente o datos sesgados.",
        ],
        examDecision: "Ante un stream atrasado, compara backlog, tasas, duración del microbatch y métricas de estado antes de cambiar recursos o el trigger.",
        checkpoint: {
          question: "¿Qué señal distingue un backlog creciente de una fuente momentáneamente vacía?",
          answer: "El backlog u offsets pendientes crecen y la tasa de entrada supera de forma sostenida la tasa procesada; una fuente vacía no acumula offsets nuevos.",
        },
      },
    ],
    lab: {
      title: "Pipeline incremental recuperable de pedidos",
      goal: "Publicar eventos válidos en Delta con `availableNow`, un checkpoint gobernado y evidencia de que un segundo arranque no reprocesa el mismo backlog.",
      scenario: "Una tienda deja JSON de pedidos en una tabla bronze alimentada continuamente. Operaciones quiere ejecutar el transformado cada cinco minutos como tarea finita y poder recuperar un fallo sin duplicar `order_id`.",
      steps: [
        "Lee `main.bronze.order_events` como stream y conserva solo eventos con identificador, timestamp e importe válidos.",
        "Selecciona un esquema silver estable y deduplica por `order_id` dentro del microbatch antes de escribir.",
        "Configura un checkpoint exclusivo bajo un Volume de operaciones y usa `availableNow=True`.",
        "Ejecuta, registra `lastProgress`, vuelve a ejecutar sin añadir datos y compara los conteos.",
        "Añade un evento nuevo y demuestra que solo ese cambio incrementa la tabla destino.",
      ],
      starterCode: `from pyspark.sql import functions as F

source = spark.readStream.table("main.bronze.order_events")

valid = source.where(
    F.col("order_id").isNotNull() &
    F.col("event_ts").isNotNull() &
    (F.col("amount") >= 0)
)

# TODO: selecciona columnas, configura checkpoint, availableNow y destino Delta.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m13_order_events_v1"
target = "main.silver.order_events"

source = spark.readStream.table("main.bronze.order_events")

valid = (
    source.where(
        F.col("order_id").isNotNull() &
        F.col("event_ts").isNotNull() &
        (F.col("amount") >= 0)
    )
    .select(
        "order_id",
        F.col("event_ts").cast("timestamp").alias("event_ts"),
        F.col("amount").cast("decimal(18,2)").alias("amount"),
        "customer_id",
        "source_file"
    )
    .dropDuplicates(["order_id"])
)

query = (
    valid.writeStream
      .queryName("m13_orders_to_silver")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable(target)
)
query.awaitTermination()

evidence = {
    "target": target,
    "rows": spark.table(target).count(),
    "progress": query.lastProgress,
}
print(evidence)`,
      checks: [
        { label: "Lee la fuente con readStream", pattern: "readStream\\.table" },
        { label: "Declara un checkpoint durable", pattern: "checkpointLocation" },
        { label: "Usa una ejecución incremental finita", pattern: "availableNow\\s*=\\s*True" },
        { label: "Publica en una tabla Delta", pattern: "toTable" },
      ],
      expectedEvidence: [
        "Conteo del destino tras la primera ejecución y el mismo conteo tras una segunda sin entrada nueva.",
        "`lastProgress` con `batchId`, número de filas de entrada y duración del trigger.",
        "Ruta de checkpoint exclusiva y nombre completo de la tabla silver.",
        "Prueba de que un nuevo evento válido aumenta el destino exactamente una vez.",
      ],
      cloudNotes: {
        AWS: "Aloja el Volume/checkpoint sobre S3 mediante una external location de Unity Catalog y una storage credential asociada a un IAM role; no incrustes access keys.",
        Azure: "Usa un Volume respaldado por ADLS Gen2 y una managed identity o service principal en la storage credential; valida permisos sobre contenedor y ruta.",
        GCP: "Usa GCS detrás de una external location y una service account de mínimo privilegio; separa los prefijos de checkpoint de dev y prod.",
      },
    },
    quiz: [
      {
        question: "Un Job debe procesar cada diez minutos todo lo acumulado y finalizar para no mantener compute ocioso. ¿Qué configuración encaja mejor?",
        options: [
          "Una lectura batch completa sin checkpoint",
          "Una consulta con `availableNow=True` y checkpoint estable",
          "Un trigger de 100 milisegundos ejecutado continuamente",
          "Borrar el checkpoint al comienzo de cada Job",
        ],
        answer: 1,
        explanation: "`availableNow` vacía incrementalmente el backlog disponible y termina; el checkpoint permite que la siguiente ejecución continúe sin releer lo ya confirmado.",
        domain: "Structured Streaming · triggers",
      },
      {
        question: "Tras cambiar las claves de una agregación stateful, la consulta no reinicia con el checkpoint anterior. ¿Cuál es la respuesta correcta?",
        options: [
          "Aumentar el número de workers hasta que el checkpoint sea compatible",
          "Desactivar la escritura de commits",
          "Evaluar una migración/reproceso con checkpoint nuevo porque cambió el esquema de estado",
          "Configurar `failOnDataLoss=false` en cualquier fuente",
        ],
        answer: 2,
        explanation: "Las claves de una operación stateful forman parte del esquema de estado. El cambio suele ser incompatible y exige un cutover controlado, no más capacidad.",
        domain: "Structured Streaming · checkpoints",
      },
      {
        question: "Un `foreachBatch` llama a una API que crea un cargo y el driver falla antes de confirmar el lote. ¿Qué evita cargos duplicados al reintentar?",
        options: [
          "Enviar una clave idempotente estable por transacción",
          "Usar un trigger más largo",
          "Cambiar el output mode a `complete`",
          "Reducir las particiones del DataFrame a una",
        ],
        answer: 0,
        explanation: "El microbatch puede volver a presentarse. Una clave idempotente aceptada por el sistema externo hace que la repetición tenga el mismo efecto final.",
        domain: "Structured Streaming · garantías de entrega",
      },
      {
        question: "La tasa de entrada es 8.000 filas/s, la procesada 5.000 filas/s y el lag crece durante una hora. ¿Qué conclusión está respaldada?",
        options: [
          "La fuente está vacía",
          "El checkpoint ha deduplicado demasiadas filas",
          "El watermark es necesariamente demasiado corto",
          "La consulta no sostiene la tasa de llegada y acumula backlog",
        ],
        answer: 3,
        explanation: "Una tasa procesada sostenidamente inferior a la tasa de entrada, junto con lag creciente, demuestra un déficit de capacidad o un cuello de ejecución que debe diagnosticarse.",
        domain: "Structured Streaming · monitorización",
      },
    ],
    sources: [
      {
        label: "Structured Streaming checkpoints · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/checkpoints",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
    ],
  },

  m14: {
    lessons: [
      {
        summary: "El event time pertenece al hecho de negocio; el processing time describe cuándo lo observa la plataforma y no corrige el desorden de llegada.",
        explanation: [
          "Un pago generado a las 10:03 puede llegar a las 10:17 por una desconexión móvil. Agrupar por la hora de ingesta lo asignaría a una ventana distinta y haría que un reproceso produzca otro resultado. La columna de event time debe proceder del evento, convertirse a `timestamp` y validarse antes de cualquier operación temporal.",
          "El retraso `processing_time - event_time` es una distribución, no una constante. Para elegir tolerancia se estudian percentiles y casos extremos por fuente. Un reloj del productor defectuoso debe enviarse a cuarentena; ampliar indefinidamente el watermark para ocultarlo traslada el problema al state store.",
        ],
        keyPoints: [
          "Event time determina ventanas reproducibles; processing time mide la observación del sistema.",
          "La calidad y zona horaria del timestamp son parte del contrato del evento.",
          "La distribución de tardanza informa el watermark y el SLA de correcciones.",
        ],
        example: {
          language: "PySpark",
          title: "Normalización del tiempo de evento",
          code: `from pyspark.sql import functions as F

events = (
    raw.withColumn("event_ts", F.to_timestamp("event_time_iso"))
       .withColumn("ingested_at", F.current_timestamp())
       .withColumn(
           "lateness_seconds",
           F.col("ingested_at").cast("long") - F.col("event_ts").cast("long")
       )
)

valid = events.where("event_ts IS NOT NULL AND lateness_seconds >= 0")`,
          note: "Conserva ambos tiempos: uno gobierna la semántica y el otro permite medir el comportamiento de la fuente.",
        },
        pitfalls: [
          "Usar `current_timestamp()` como event time porque siempre está presente, haciendo que un replay cambie los resultados.",
          "Aceptar timestamps sin zona o muy futuros y permitir que adelanten prematuramente el watermark.",
        ],
        examDecision: "Si el resultado debe conservar la hora real del negocio pese a retrasos o replays, las ventanas deben usar event time validado.",
        checkpoint: {
          question: "¿Por qué un reproceso debe conservar el event time original?",
          answer: "Porque así el evento vuelve a la misma ventana de negocio; usar el momento del reproceso produciría agregados distintos.",
        },
      },
      {
        summary: "Una ventana agrupa por event time y el watermark limita cuánto estado se conserva antes de considerar una ventana finalizable.",
        explanation: [
          "Las ventanas tumbling no se solapan; las sliding pueden asignar el mismo evento a varias ventanas. En una agregación, Spark mantiene acumuladores para ventanas todavía abiertas. El watermark avanza a partir del máximo event time observado menos el retraso configurado y permite retirar estado antiguo.",
          "Una tolerancia corta reduce memoria y acelera resultados finales, pero descarta más eventos tardíos. Una tolerancia larga mejora completitud a costa de latencia y estado. La decisión debe expresar un compromiso medible, por ejemplo aceptar el 99,5% de eventos en quince minutos y corregir el resto mediante un proceso separado.",
        ],
        keyPoints: [
          "Watermark no significa esperar exactamente ese tiempo desde la llegada de cada fila.",
          "La columna marcada debe participar en la ventana o condición temporal del operador stateful.",
          "Output mode y watermark determinan cuándo se emiten y retiran resultados.",
        ],
        example: {
          language: "PySpark",
          title: "Ventas por ventanas de cinco minutos",
          code: `from pyspark.sql import functions as F

sales_5m = (
    events.withWatermark("event_ts", "15 minutes")
      .groupBy(F.window("event_ts", "5 minutes"), "store_id")
      .agg(
          F.countDistinct("order_id").alias("orders"),
          F.sum("amount").alias("revenue")
      )
)`,
          note: "El retraso de quince minutos debe justificarse con la distribución real de tardanza y el SLA de publicación.",
        },
        pitfalls: [
          "Aplicar `withWatermark` a una columna y agrupar por otra, impidiendo que el operador use la marca temporal esperada.",
          "Elegir un watermark igual al intervalo de trigger; resuelven problemas diferentes.",
        ],
        examDecision: "Para acotar una agregación de event time, configura watermark según tardanza tolerada y usa esa columna en `window`; no lo sustituyas por más particiones.",
        checkpoint: {
          question: "¿Qué se sacrifica al reducir de una hora a diez minutos el watermark?",
          answer: "Se conserva menos estado y puede bajar la latencia, pero aumentan los eventos demasiado tardíos que ya no actualizarán el resultado.",
        },
      },
      {
        summary: "La deduplicación con watermark mantiene identificadores durante un horizonte finito y elimina repeticiones sin hacer crecer el estado para siempre.",
        explanation: [
          "`dropDuplicatesWithinWatermark([\"event_id\"])` recuerda las claves observadas mientras el evento pueda seguir teniendo duplicados dentro de la tolerancia. La marca temporal debe definirse antes. Si dos copias pueden diferir en timestamp, la tolerancia debe superar la máxima distancia temporal entre ellas para garantizar la deduplicación.",
          "La clave debe representar identidad de negocio, no una combinación accidental de todas las columnas. Antes de deduplicar conviene validar nulos y normalizar tipos. Los eventos que llegan más tarde que el umbral pueden descartarse; la métrica de descarte y una ruta de reconciliación son parte del diseño.",
        ],
        keyPoints: [
          "`distinct` sin watermark puede conservar todas las filas únicas indefinidamente.",
          "`dropDuplicatesWithinWatermark` requiere una marca temporal en el DataFrame streaming.",
          "El horizonte debe cubrir la separación máxima esperada entre copias del mismo evento.",
        ],
        example: {
          language: "PySpark",
          title: "Deduplicación acotada por identificador",
          code: `deduplicated = (
    events.where("event_id IS NOT NULL AND event_ts IS NOT NULL")
      .withWatermark("event_ts", "30 minutes")
      .dropDuplicatesWithinWatermark(["event_id"])
)`,
          note: "Mide duplicados y eventos tardíos con datos de prueba que crucen varios microbatches.",
        },
        pitfalls: [
          "Deduplicar por todas las columnas cuando dos copias llevan distinto `ingested_at` y, por tanto, nunca coinciden.",
          "Escoger un umbral menor que el retraso entre duplicados y prometer una garantía que el estado ya no puede cumplir.",
        ],
        examDecision: "Si hay un ID estable y duplicados retrasados, usa deduplicación con watermark; un `dropDuplicates` sin límite puede comprometer memoria y latencia.",
        checkpoint: {
          question: "¿Qué condición permite retirar del estado un `event_id` antiguo?",
          answer: "Que el watermark haya avanzado más allá del horizonte en el que todavía se garantiza reconocer duplicados de ese evento.",
        },
      },
      {
        summary: "Un join entre dos streams necesita watermarks y una condición temporal para que Spark pueda descartar pares que ya no pueden coincidir.",
        explanation: [
          "Relacionar clics con pagos solo por `session_id` deja abierta para siempre la posibilidad de una coincidencia futura. Añadir que el pago ocurra entre el clic y treinta minutos después proporciona un intervalo acotado. Cada entrada debe declarar su tolerancia de tardanza para que el motor calcule cuándo retirar estado.",
          "Los joins outer requieren esperar a que transcurra el horizonte antes de emitir una fila no emparejada. Eso aumenta la latencia de los `NULL` esperados. En múltiples streams, la política global por defecto avanza con el watermark más lento; cambiarla a `max` reduce latencia, pero puede descartar datos del stream rezagado.",
        ],
        keyPoints: [
          "Las claves de igualdad no acotan por sí solas el estado de un stream-stream join.",
          "La condición de rango temporal y los watermarks trabajan conjuntamente.",
          "Un outer join no puede declarar una fila sin pareja hasta que expire la posibilidad de coincidencia.",
        ],
        example: {
          language: "PySpark",
          title: "Join temporal de clics y pagos",
          code: `clicks_wm = clicks.withWatermark("click_ts", "20 minutes")
payments_wm = payments.withWatermark("payment_ts", "10 minutes")

matched = clicks_wm.join(
    payments_wm,
    (clicks_wm.session_id == payments_wm.session_id) &
    (payments_wm.payment_ts >= clicks_wm.click_ts) &
    (payments_wm.payment_ts <= clicks_wm.click_ts + F.expr("INTERVAL 30 MINUTES")),
    "leftOuter",
)`,
          note: "Documenta por separado la tardanza de cada fuente y el máximo intervalo de negocio entre los dos eventos.",
        },
        pitfalls: [
          "Añadir watermarks pero omitir el rango temporal del join, por lo que el estado sigue sin una frontera útil.",
          "Esperar que un outer join emita inmediatamente los no emparejados, antes de que expire el watermark.",
        ],
        examDecision: "Ante estado creciente en un stream-stream join, comprueba watermarks en ambas entradas y una condición temporal acotada antes de escalar compute.",
        checkpoint: {
          question: "¿Por qué un left outer join retrasa las filas sin pago?",
          answer: "Porque debe esperar hasta que el watermark demuestre que ya no puede llegar un pago válido dentro del intervalo temporal.",
        },
      },
      {
        summary: "Las métricas del state store revelan si el compromiso entre tardanza, cardinalidad y capacidad sigue siendo sostenible.",
        explanation: [
          "`stateOperators` informa filas totales y actualizadas, memoria usada y filas retiradas por watermark. Un crecimiento continuo después de varios horizontes puede indicar claves de cardinalidad extrema, timestamps futuros, ausencia de watermark efectivo o una condición de join no acotada.",
          "El diagnóstico debe reproducir datos puntuales: a tiempo, duplicados, tardíos dentro de tolerancia, demasiado tardíos y timestamps inválidos. Una prueba de recuperación reinicia desde el mismo checkpoint; cambiar access mode o esquema de estado durante el experimento puede introducir otra variable.",
        ],
        keyPoints: [
          "El número de filas de estado debe estabilizarse para una carga estacionaria y un horizonte finito.",
          "Los timestamps futuros pueden empujar el watermark y provocar pérdidas silenciosas de eventos normales.",
          "La política global `max` favorece latencia y puede descartar datos del stream más lento; `min` prioriza seguridad.",
        ],
        example: {
          language: "Python",
          title: "Resumen de operadores con estado",
          code: `progress = query.lastProgress or {}
for operator in progress.get("stateOperators", []):
    print({
        "rows_total": operator.get("numRowsTotal"),
        "rows_updated": operator.get("numRowsUpdated"),
        "rows_removed": operator.get("numRowsRemoved"),
        "memory_bytes": operator.get("memoryUsedBytes"),
    })`,
          note: "Guarda la serie temporal; una única observación no permite distinguir una ventana grande de una fuga lógica de estado.",
        },
        pitfalls: [
          "Medir solo uso de CPU y omitir filas/memoria del estado.",
          "Cambiar a la política `max` para ocultar un stream lento sin aceptar explícitamente los descartes resultantes.",
        ],
        examDecision: "Si el estado crece sin estabilizarse, valida primero event time, watermark, cardinalidad y condiciones temporales; más memoria solo pospone el fallo.",
        checkpoint: {
          question: "¿Qué patrón indica que un watermark no está retirando estado como se esperaba?",
          answer: "Con entrada estable, `numRowsTotal` y memoria crecen durante muchos horizontes mientras `numRowsRemoved` permanece nulo o muy bajo.",
        },
      },
    ],
    lab: {
      title: "Deduplicación y ventanas con datos tardíos",
      goal: "Construir un agregado de cinco minutos que deduplique eventos, tolere quince minutos de tardanza y produzca evidencia sobre estado y descartes.",
      scenario: "Los dispositivos de tiendas envían ventas con reintentos y desconexiones. El 99% llega en menos de quince minutos, pero algunos eventos llegan duplicados o con timestamps inválidos.",
      steps: [
        "Normaliza `event_ts` y separa filas nulas o futuras antes de la operación stateful.",
        "Aplica un watermark de quince minutos y deduplica por `event_id` dentro del horizonte.",
        "Agrupa por ventanas tumbling de cinco minutos y `store_id`, calculando pedidos e importe.",
        "Escribe en Delta con checkpoint propio y ejecuta un conjunto de eventos a tiempo, duplicados y tardíos.",
        "Captura métricas de `stateOperators` y explica qué evento demasiado tardío no modifica el agregado.",
      ],
      starterCode: `from pyspark.sql import functions as F

events = spark.readStream.table("main.bronze.store_sales")
clean = events.withColumn("event_ts", F.to_timestamp("event_ts"))

# TODO: valida tiempos, aplica watermark, deduplica y agrega en ventanas de 5 minutos.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m14_sales_windows_v1"

events = (
    spark.readStream.table("main.bronze.store_sales")
      .withColumn("event_ts", F.to_timestamp("event_ts"))
      .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
)

clean = events.where(
    F.col("event_id").isNotNull() &
    F.col("event_ts").isNotNull() &
    (F.col("event_ts") <= F.current_timestamp() + F.expr("INTERVAL 2 MINUTES"))
)

deduplicated = (
    clean.withWatermark("event_ts", "15 minutes")
         .dropDuplicatesWithinWatermark(["event_id"])
)

sales_5m = (
    deduplicated.groupBy(
        F.window("event_ts", "5 minutes"),
        "store_id",
    )
    .agg(
        F.count("event_id").alias("orders"),
        F.sum("amount").alias("revenue"),
    )
    .select(
        "store_id",
        F.col("window.start").alias("window_start"),
        F.col("window.end").alias("window_end"),
        "orders",
        "revenue",
    )
)

query = (
    sales_5m.writeStream
      .outputMode("append")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable("main.gold.store_sales_5m")
)
query.awaitTermination()
print(query.lastProgress.get("stateOperators", []))`,
      checks: [
        { label: "Usa event time con watermark", pattern: "withWatermark\\(\"event_ts\",\\s*\"15 minutes\"\\)" },
        { label: "Deduplica dentro del horizonte", pattern: "dropDuplicatesWithinWatermark" },
        { label: "Agrupa en ventanas de cinco minutos", pattern: "window\\(\"event_ts\",\\s*\"5 minutes\"\\)" },
        { label: "Conserva un checkpoint", pattern: "checkpointLocation" },
      ],
      expectedEvidence: [
        "Tabla de entrada de prueba que identifica eventos a tiempo, duplicados, tardíos y demasiado tardíos.",
        "Conteos e importe por ventana antes y después de introducir un duplicado.",
        "Métricas `numRowsTotal`, `numRowsRemoved` y `memoryUsedBytes` del operador de estado.",
        "Explicación cuantitativa de por qué quince minutos satisface el objetivo de completitud.",
      ],
      cloudNotes: {
        AWS: "Mantén fuente y checkpoint en ubicaciones de S3 gobernadas por Unity Catalog; revisa que el IAM role permita listar y escribir solo los prefijos necesarios.",
        Azure: "Usa ADLS Gen2 mediante external locations y evita claves de cuenta; la identidad administrada necesita permisos separados para entrada y checkpoint.",
        GCP: "Separa buckets o prefijos de datos y estado en GCS y concede a la service account acceso mínimo de lectura/escritura según función.",
      },
    },
    quiz: [
      {
        question: "Un evento ocurrió a las 10:02, llegó a las 10:19 y debe contabilizarse en el intervalo real de venta. ¿Qué timestamp gobierna la ventana?",
        options: [
          "El momento de inicio del cluster",
          "El processing time de las 10:19",
          "El event time de las 10:02",
          "La hora de la siguiente ejecución del Job",
        ],
        answer: 2,
        explanation: "La ventana de negocio debe usar event time para que llegadas tardías y replays conserven la misma asignación temporal.",
        domain: "Structured Streaming · event time",
      },
      {
        question: "El estado de una agregación crece sin límite aunque existe `withWatermark`. ¿Qué revisión es más relevante primero?",
        options: [
          "Que la columna marcada participe realmente en la ventana y tenga timestamps válidos",
          "Que el SQL warehouse tenga auto-stop",
          "Que el catálogo use nombres de tres niveles",
          "Que el notebook tenga menos celdas",
        ],
        answer: 0,
        explanation: "Un watermark sobre una columna no utilizada por el operador, o adelantada por timestamps erróneos, no proporciona la frontera de estado esperada.",
        domain: "Structured Streaming · estado",
      },
      {
        question: "Dos copias del mismo `event_id` pueden diferir en 25 minutos de event time. ¿Qué configuración garantiza reconocer ambas como duplicadas?",
        options: [
          "Un trigger de cinco minutos sin watermark",
          "`distinct()` sobre `ingested_at`",
          "Un watermark de diez minutos",
          "`dropDuplicatesWithinWatermark` con un horizonte superior a 25 minutos",
        ],
        answer: 3,
        explanation: "La tolerancia debe superar la máxima separación temporal esperada entre duplicados; de lo contrario la primera clave puede salir del estado antes de llegar la segunda.",
        domain: "Structured Streaming · deduplicación",
      },
      {
        question: "Un left outer stream-stream join emite los registros sin pareja demasiado tarde para el consumidor. ¿Qué explica esa latencia?",
        options: [
          "Delta Lake siempre espera a `OPTIMIZE`",
          "El motor debe esperar al watermark y al límite temporal antes de concluir que no llegará una pareja",
          "Los outer joins solo se ejecutan en batch",
          "El checkpoint vuelve a leer todos los eventos",
        ],
        answer: 1,
        explanation: "La fila sin coincidencia no es definitiva hasta que el horizonte temporal se cierra; esa espera es parte de la corrección del outer join.",
        domain: "Structured Streaming · stream-stream joins",
      },
    ],
    sources: [
      {
        label: "Apply watermarks to control data processing thresholds · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/watermarks",
        reviewedAt,
      },
      {
        label: "dropDuplicatesWithinWatermark · Databricks PySpark reference",
        href: "https://docs.databricks.com/aws/en/pyspark/reference/classes/dataframe/dropDuplicatesWithinWatermark",
        reviewedAt,
      },
    ],
  },

  m15: {
    lessons: [
      {
        summary: "Kafka entrega registros binarios con metadatos de topic, partición y offset; deserializar el payload sin perder esa trazabilidad es la primera responsabilidad del consumidor.",
        explanation: [
          "El DataFrame de Kafka expone `key`, `value`, `topic`, `partition`, `offset`, `timestamp` y headers. `key` y `value` llegan como bytes, por lo que hacer solo `CAST(value AS STRING)` no valida el contrato. Un esquema explícito con `from_json` permite distinguir una fila corrupta de una evolución compatible.",
          "Conservar `topic`, `partition` y `offset` en bronze permite investigar pérdidas, reconstruir un rango y demostrar qué mensaje originó una fila. La clave Kafka también importa: el productor la usa para particionar y preservar orden dentro de una partición, pero Kafka no ofrece orden global entre particiones.",
        ],
        keyPoints: [
          "El offset solo es único dentro de un par topic-partición.",
          "La key dirige particionado y orden local; no sustituye la clave de negocio del payload.",
          "Bronze debe conservar metadatos Kafka y el payload original o una referencia auditable.",
        ],
        example: {
          language: "PySpark",
          title: "Lectura con metadatos Kafka preservados",
          code: `kafka_raw = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .load()
)

bronze = kafka_raw.selectExpr(
    "CAST(key AS STRING) AS message_key",
    "CAST(value AS STRING) AS payload",
    "topic", "partition", "offset",
    "timestamp AS kafka_timestamp"
)`,
          note: "No registres credenciales en opciones ni notebooks; obtén endpoints y secretos desde configuración gobernada.",
        },
        pitfalls: [
          "Tratar `(offset)` como identificador global y provocar colisiones entre particiones.",
          "Descartar metadatos inmediatamente, haciendo imposible demostrar qué mensaje produjo un error.",
        ],
        examDecision: "Si la pregunta exige trazabilidad o replay selectivo, conserva topic, partición y offset junto al payload antes de transformar.",
        checkpoint: {
          question: "¿Qué combinación identifica de forma inequívoca una posición Kafka?",
          answer: "Topic, partición y offset; el offset por sí solo se repite en otras particiones y topics.",
        },
      },
      {
        summary: "Las opciones de suscripción y offsets solo fijan el inicio de una consulta nueva; al reanudar, el checkpoint gobierna la posición.",
        explanation: [
          "`subscribe` elige topics concretos, `subscribePattern` usa una expresión regular y `assign` fija particiones. Debe configurarse exactamente uno. En streaming, `startingOffsets` es `latest` por defecto y solo se consulta si no existe progreso previo; cambiarlo después no rebobina una consulta con checkpoint.",
          "Para un backfill se usa un checkpoint y destino separados o una lectura batch con rangos explícitos, no se modifica a ciegas una consulta productiva. `failOnDataLoss=false` permite continuar cuando offsets ya no existen, pero acepta una posible pérdida y debe acompañarse de reconciliación; no es una solución genérica para errores.",
        ],
        keyPoints: [
          "Una consulta reanudada toma offsets del checkpoint, no de `startingOffsets`.",
          "`earliest` en una consulta nueva puede consumir toda la retención y generar un backlog considerable.",
          "`failOnDataLoss=false` cambia una garantía de integridad y exige una decisión operativa explícita.",
        ],
        example: {
          language: "PySpark",
          title: "Suscripción inicial controlada",
          code: `orders = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .option("startingOffsets", "earliest")
      .option("failOnDataLoss", "true")
      .option("maxOffsetsPerTrigger", 500000)
      .load()
)`,
          note: "Tras el primer commit, `startingOffsets` deja de decidir la posición; el checkpoint continúa desde los offsets confirmados.",
        },
        pitfalls: [
          "Cambiar `startingOffsets` a `earliest` esperando que un stream existente relea su historia.",
          "Desactivar `failOnDataLoss` para silenciar una retención insuficiente sin medir el hueco perdido.",
        ],
        examDecision: "Para reanudar exactamente donde quedó una consulta, conserva su checkpoint; para reprocesar, aísla checkpoint y destino y define el rango de offsets.",
        checkpoint: {
          question: "¿Qué ocurre si se cambia `startingOffsets` en una consulta que conserva el mismo checkpoint?",
          answer: "La consulta reanuda desde los offsets del checkpoint; la opción inicial no rebobina el progreso existente.",
        },
      },
      {
        summary: "Un contrato de evento separa deserialización, validación y evolución para que los mensajes incompatibles no detengan ni contaminen el flujo válido.",
        explanation: [
          "Con JSON, un `StructType` explícito evita inferencia por microbatch y permite detectar `_corrupt_record` o campos obligatorios nulos. Avro o Protobuf con un schema registry ofrecen contratos más fuertes, pero siguen necesitando una política de compatibilidad entre productor y consumidor.",
          "Un patrón robusto publica el mensaje crudo en bronze, enruta fallos a cuarentena con el motivo y solo expone columnas tipadas en silver. Añadir un campo opcional suele ser compatible; renombrar o cambiar tipo requiere una migración coordinada o lectura multi-versión mediante un campo `schema_version`.",
        ],
        keyPoints: [
          "El esquema se valida antes de aplicar reglas de negocio.",
          "La cuarentena conserva payload y coordenadas Kafka para remediación.",
          "La evolución se negocia entre productor y consumidor; no se resuelve concediendo tipos `string` a todo.",
        ],
        example: {
          language: "PySpark",
          title: "Deserialización JSON con contrato",
          code: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
    T.StructField("schema_version", T.IntegerType(), False),
])

decoded = bronze.withColumn(
    "event", F.from_json("payload", order_schema)
)`,
          note: "Mantén `payload` hasta que la fila haya superado validación para poder diagnosticar y reintentar.",
        },
        pitfalls: [
          "Inferir el esquema en cada ejecución y aceptar cambios accidentales del productor.",
          "Descartar mensajes inválidos sin contador, payload ni coordenadas de origen.",
        ],
        examDecision: "Ante varios formatos o versiones, valida con un contrato explícito y enruta incompatibles; no detengas todo el topic por una fila ni la ignores sin evidencia.",
        checkpoint: {
          question: "¿Qué datos mínimos necesita una cuarentena Kafka para reprocesar una fila?",
          answer: "Payload original, motivo de rechazo, timestamp y coordenadas topic-partición-offset, además de la versión de esquema cuando exista.",
        },
      },
      {
        summary: "Kafka, checkpoint y Delta pueden ofrecer procesamiento exactamente una vez, pero cualquier sink externo vuelve a exigir idempotencia end-to-end.",
        explanation: [
          "Spark registra rangos de offsets en el checkpoint y Delta confirma cada microbatch de manera transaccional. Un fallo puede hacer que el motor vuelva a calcular el lote, pero el protocolo del sink evita materializarlo dos veces. Esto no deduplica dos mensajes distintos que el productor publicó con el mismo `order_id`.",
          "Cuando el destino es una API, una base no transaccional o varios sistemas, `foreachBatch` ofrece semántica at-least-once a menos que la función sea idempotente. Un outbox del productor, identificadores de evento estables y `MERGE` en silver resuelven capas distintas del problema.",
        ],
        keyPoints: [
          "Exactly-once de procesamiento no elimina duplicados creados por el productor.",
          "Un checkpoint no puede deshacer un efecto externo ya confirmado fuera de Spark.",
          "La clave `event_id` permite deduplicación de negocio además de coordinación técnica de offsets.",
        ],
        example: {
          language: "SQL",
          title: "Upsert de eventos Kafka deduplicados",
          code: `MERGE INTO main.silver.orders AS target
USING staged_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.event_ts > target.event_ts THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;`,
          note: "Antes del `MERGE`, conserva una sola fila ganadora por `order_id` dentro del microbatch para evitar múltiples matches.",
        },
        pitfalls: [
          "Prometer exactly-once porque Kafka usa offsets, aunque el sink sea una API sin clave idempotente.",
          "Confundir reejecución del mismo offset con dos mensajes distintos enviados por el productor.",
        ],
        examDecision: "Evalúa garantías de cada frontera. Para un destino Delta integrado, usa checkpoint; para efectos externos, añade una operación idempotente o un ledger.",
        checkpoint: {
          question: "¿Puede el checkpoint eliminar un cargo duplicado ya creado en una API externa?",
          answer: "No. La API debe aceptar una clave idempotente o el pipeline debe registrar transacciones para que el reintento no repita el efecto.",
        },
      },
      {
        summary: "Particiones, límites de offsets y métricas de lag permiten regular throughput sin confundir una protección temporal con una solución de capacidad.",
        explanation: [
          "El paralelismo máximo de lectura está condicionado por las particiones Kafka, aunque Spark pueda dividir rangos grandes en más tareas según capacidades de la fuente. `maxOffsetsPerTrigger` limita el volumen de un microbatch y protege al sink durante recuperación, pero si queda por debajo de la tasa de llegada el lag crecerá indefinidamente.",
          "Las métricas `avgOffsetsBehindLatest`, `maxOffsetsBehindLatest` y bytes estimados muestran atraso por fuente. Deben correlacionarse con duración del trigger, distribución de particiones y tasas de procesamiento. Una sola partición caliente puede dominar el SLA aunque la media parezca saludable.",
        ],
        keyPoints: [
          "`maxOffsetsPerTrigger` controla lote, no aumenta capacidad.",
          "La key del productor puede crear skew persistente entre particiones.",
          "Mide lag máximo y por partición, además de la media.",
        ],
        example: {
          language: "Python",
          title: "Extracción de lag desde el progreso",
          code: `progress = query.lastProgress or {}
for source in progress.get("sources", []):
    metrics = source.get("metrics", {})
    print({
        "description": source.get("description"),
        "avg_lag": metrics.get("avgOffsetsBehindLatest"),
        "max_lag": metrics.get("maxOffsetsBehindLatest"),
        "bytes_behind": metrics.get("estimatedTotalBytesBehindLatest"),
    })`,
          note: "Alerta por tendencia y tiempo estimado de recuperación, no por un valor aislado durante un pico esperado.",
        },
        pitfalls: [
          "Reducir el lote hasta estabilizar la duración mientras el backlog crece silenciosamente.",
          "Añadir workers cuando el topic tiene una sola partición caliente y no ofrece paralelismo útil.",
        ],
        examDecision: "Si el lag crece, compara tasa de llegada, límite por trigger, particiones y cuello del sink; ajusta el límite para estabilidad y la capacidad para converger.",
        checkpoint: {
          question: "¿Por qué un `maxOffsetsPerTrigger` demasiado bajo puede incumplir el SLA aunque cada lote termine rápido?",
          answer: "Porque admite menos eventos por unidad de tiempo de los que llegan y el backlog aumenta pese a microbatches cortos.",
        },
      },
    ],
    lab: {
      title: "Ingesta Kafka gobernada con cuarentena y trazabilidad",
      goal: "Consumir pedidos Kafka, conservar coordenadas de origen, validar un esquema y separar mensajes inválidos sin ocultar pérdida de offsets.",
      scenario: "El topic `orders.v1` recibe JSON de varios productores. Algunos mensajes están truncados y un productor reintenta eventos. Operaciones necesita una tabla bronze auditable y una silver tipada sin detener el flujo por una fila corrupta.",
      steps: [
        "Configura `subscribe`, bootstrap servers y offsets iniciales sin incrustar secretos.",
        "Conserva key, payload, topic, partition, offset y timestamp en la capa bronze.",
        "Deserializa con un `StructType` explícito y clasifica filas válidas e inválidas.",
        "Escribe válidas y cuarentena en tablas Delta usando checkpoints independientes o una operación idempotente común.",
        "Mide lag, duplicados y tasa de errores; documenta cómo se reprocesaría un rango concreto.",
      ],
      starterCode: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("event_id", T.StringType(), False),
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
])

# TODO: lee Kafka, conserva metadatos y separa válidas de cuarentena.`,
      solution: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("event_id", T.StringType(), False),
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
])

raw = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .option("startingOffsets", "latest")
      .option("failOnDataLoss", "true")
      .option("maxOffsetsPerTrigger", 250000)
      .load()
)

bronze = raw.selectExpr(
    "CAST(key AS STRING) AS message_key",
    "CAST(value AS STRING) AS payload",
    "topic", "partition", "offset",
    "timestamp AS kafka_timestamp"
).withColumn("event", F.from_json("payload", order_schema))

valid = (
    bronze.where(
        F.col("event").isNotNull() &
        F.col("event.event_id").isNotNull() &
        F.col("event.order_id").isNotNull() &
        (F.col("event.amount") >= 0)
    )
    .select("event.*", "topic", "partition", "offset", "kafka_timestamp")
)

quarantine = (
    bronze.where(
        F.col("event").isNull() |
        F.col("event.event_id").isNull() |
        F.col("event.order_id").isNull() |
        (F.col("event.amount") < 0)
    )
    .withColumn(
        "reason",
        F.when(F.col("event").isNull(), "INVALID_JSON")
         .when(F.col("event.event_id").isNull(), "MISSING_EVENT_ID")
         .when(F.col("event.order_id").isNull(), "MISSING_ORDER_ID")
         .otherwise("INVALID_AMOUNT")
    )
)

def publish(batch_df, batch_id):
    (batch_df.where("event IS NOT NULL")
       .select("event.*", "topic", "partition", "offset", "kafka_timestamp")
       .dropDuplicates(["event_id"])
       .write.mode("append").saveAsTable("main.silver.kafka_orders"))
    (batch_df.where("event IS NULL OR event.event_id IS NULL OR event.order_id IS NULL OR event.amount < 0")
       .withColumn("quarantined_at", F.current_timestamp())
       .write.mode("append").saveAsTable("main.ops.kafka_orders_quarantine"))

query = (
    bronze.writeStream.foreachBatch(publish)
      .option("checkpointLocation", "/Volumes/main/ops/checkpoints/m15_kafka_orders_v1")
      .start()
)`,
      checks: [
        { label: "Configura una suscripción Kafka", pattern: "format\\(\"kafka\"\\)[\\s\\S]*option\\(\"subscribe\"" },
        { label: "Conserva coordenadas de origen", pattern: "topic[\\s\\S]*partition[\\s\\S]*offset" },
        { label: "Deserializa con un esquema", pattern: "from_json" },
        { label: "Define checkpoint y cuarentena", pattern: "(?:checkpointLocation[\\s\\S]*quarantine|quarantine[\\s\\S]*checkpointLocation)" },
      ],
      expectedEvidence: [
        "Filas silver con `event_id` único y columnas topic, partition y offset.",
        "Filas de cuarentena con payload, coordenadas y motivo de rechazo.",
        "Captura de `lastProgress` con offsets y métricas de lag.",
        "Procedimiento de replay que usa checkpoint/destino aislados y un rango de offsets documentado.",
      ],
      cloudNotes: {
        AWS: "Para Amazon MSK, usa conectividad privada y el mecanismo SASL/IAM o TLS aprobado; almacena parámetros sensibles en secretos y limita Security Groups al compute.",
        Azure: "Con Event Hubs mediante su endpoint compatible con Kafka, configura SASL_SSL y la identidad/secreto gobernado; valida throughput units y retención además del código Spark.",
        GCP: "Para un servicio Kafka gestionado o Confluent en GCP, usa Private Service Connect/VPC según disponibilidad y una identidad de servicio; si la fuente es Pub/Sub, el conector y sus garantías son distintos y no debe disfrazarse como Kafka.",
      },
    },
    quiz: [
      {
        question: "Un equipo cambia `startingOffsets` de `latest` a `earliest`, mantiene el checkpoint y espera releer seis meses. ¿Qué ocurrirá?",
        options: [
          "Releerá desde earliest en el siguiente microbatch",
          "Kafka borrará el consumer group",
          "Reanudará desde el checkpoint; hace falta un reproceso aislado para rebobinar",
          "Duplicará solo la última partición",
        ],
        answer: 2,
        explanation: "En una consulta streaming reanudada mandan los offsets del checkpoint. `startingOffsets` solo aplica al arranque de una consulta nueva.",
        domain: "Kafka · offsets y checkpoints",
      },
      {
        question: "Debe investigarse exactamente qué mensaje produjo una fila silver incorrecta. ¿Qué metadatos son imprescindibles conservar?",
        options: [
          "Topic, partición y offset",
          "Solo la hora del cluster",
          "Solo el número de microbatch",
          "El nombre del notebook y el tamaño del driver",
        ],
        answer: 0,
        explanation: "La posición Kafka se identifica por topic-partición-offset; conservar payload y schema version completa la trazabilidad.",
        domain: "Kafka · trazabilidad",
      },
      {
        question: "Cada microbatch termina en 20 segundos, pero el lag crece porque llegan 300.000 eventos/minuto y `maxOffsetsPerTrigger` vale 100.000. ¿Qué diagnóstico es correcto?",
        options: [
          "El trigger está deduplicando por error",
          "El checkpoint debería borrarse cada minuto",
          "El topic necesita menos retención",
          "El límite de ingestión es inferior a la llegada y el pipeline no converge",
        ],
        answer: 3,
        explanation: "Procesar como máximo 100.000 por trigger frente a 300.000 entrantes crea backlog aunque cada lote individual sea corto.",
        domain: "Kafka · rendimiento",
      },
      {
        question: "Un sink HTTP recibe dos veces el mismo microbatch tras un fallo. ¿Qué diseño preserva un único efecto por pedido?",
        options: [
          "Cambiar `subscribe` por `assign`",
          "Enviar `event_id` como clave idempotente aceptada por el servicio",
          "Eliminar la key Kafka",
          "Establecer `failOnDataLoss=false`",
        ],
        answer: 1,
        explanation: "El checkpoint no puede revertir un efecto HTTP ya confirmado; el receptor debe deduplicar mediante una clave idempotente estable.",
        domain: "Kafka · garantías end-to-end",
      },
    ],
    sources: [
      {
        label: "Kafka connector for Structured Streaming · Databricks",
        href: "https://docs.databricks.com/aws/en/connect/streaming/kafka",
        reviewedAt,
      },
      {
        label: "Spark API options reference · Databricks",
        href: "https://docs.databricks.com/aws/en/spark/api-options",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
    ],
  },

  m16: {
    lessons: [
      {
        summary: "Delta Change Data Feed expone cambios confirmados de una tabla junto con su tipo, versión y timestamp de commit para consumo incremental.",
        explanation: [
          "Al habilitar `delta.enableChangeDataFeed`, las versiones futuras pueden leerse con `readChangeFeed=true`. La salida incluye `_change_type`, `_commit_version` y `_commit_timestamp`; los updates generan imágenes previa y posterior. CDF no reconstruye cambios anteriores a su activación.",
          "El historial disponible depende de la retención de la tabla y de `VACUUM`. Un consumidor que permanezca caído más allá del horizonte puede no recuperar versiones antiguas. Por eso el SLA de recuperación debe relacionar retención, máxima indisponibilidad y una alternativa de snapshot.",
        ],
        keyPoints: [
          "CDF se habilita antes de los cambios que se quieren capturar.",
          "`update_preimage` y `update_postimage` representan dos vistas del mismo update.",
          "La versión de commit ordena cambios Delta; el timestamp ayuda a auditoría, pero no sustituye la secuencia de origen.",
        ],
        example: {
          language: "PySpark",
          title: "Lectura incremental de Change Data Feed",
          code: `spark.sql("""
ALTER TABLE main.bronze.customers
SET TBLPROPERTIES (delta.enableChangeDataFeed = true)
""")

changes = (
    spark.readStream
      .option("readChangeFeed", "true")
      .table("main.bronze.customers")
      .where("_change_type IN ('insert', 'update_postimage', 'delete')")
)`,
          note: "En un stream nuevo se puede fijar `startingVersion`; al reanudar, el checkpoint conserva la posición.",
        },
        pitfalls: [
          "Esperar que habilitar CDF genere retroactivamente cambios de versiones anteriores.",
          "Consumir preimages y postimages como dos actualizaciones independientes y duplicar efectos.",
        ],
        examDecision: "Usa CDF cuando la fuente ya es Delta y necesitas cambios fila a fila; si faltan versiones por retención, reconstruye desde snapshot en lugar de inventar offsets.",
        checkpoint: {
          question: "¿Qué tipos de cambio suelen conservarse para materializar el estado actual?",
          answer: "`insert`, `update_postimage` y `delete`; `update_preimage` sirve para auditoría o comparaciones, no como nuevo estado.",
        },
      },
      {
        summary: "Un feed CDC solo es determinista si define claves, una secuencia total por clave y semántica explícita para deletes y valores nulos.",
        explanation: [
          "La hora de llegada no es una secuencia fiable: un update antiguo puede llegar después de uno nuevo. `SEQUENCE BY` debe usar un LSN, número de versión u otra columna monotónica del origen. Si hay empates, un `struct` con campos de desempate produce un orden lexicográfico estable.",
          "El pipeline también debe decidir si un `NULL` borra el valor o significa 'campo no enviado', y cómo identificar borrados. La clave no debe cambiar silenciosamente; una modificación de clave suele modelarse como delete de la antigua e insert de la nueva.",
        ],
        keyPoints: [
          "La secuencia se evalúa por clave y debe resolver eventos fuera de orden.",
          "`APPLY AS DELETE WHEN` convierte una condición del feed en eliminación lógica del target.",
          "`IGNORE NULL UPDATES` solo es correcto cuando los nulos significan ausencia de cambio.",
        ],
        example: {
          language: "SQL",
          title: "Orden compuesto para CDC",
          code: `SELECT
  customer_id,
  operation,
  sequence_number,
  event_ts,
  named_struct(
    'sequence_number', sequence_number,
    'event_ts', event_ts
  ) AS cdc_sequence
FROM STREAM(main.bronze.customer_cdc);`,
          note: "El primer campo del struct debe representar el orden autoritativo del origen; el timestamp solo desempata si su calidad está garantizada.",
        },
        pitfalls: [
          "Ordenar por `current_timestamp()` y permitir que el evento más tardío en llegar sobrescriba al más nuevo del origen.",
          "Activar `IGNORE NULL UPDATES` cuando un nulo representa realmente una eliminación de atributo.",
        ],
        examDecision: "Ante CDC fuera de orden, elige una secuencia monotónica del sistema fuente; añadir más compute no corrige la selección de una versión equivocada.",
        checkpoint: {
          question: "¿Por qué un timestamp de ingesta no es un buen `SEQUENCE BY`?",
          answer: "Porque ordena por llegada, no por el commit del origen; un cambio antiguo retrasado podría vencer a uno más reciente.",
        },
      },
      {
        summary: "AUTO CDC es el nombre actual de las APIs de pipelines que reemplazan a APPLY CHANGES y automatizan orden, deduplicación, deletes y SCD.",
        explanation: [
          "En SQL se declara una streaming table target y un flow `AUTO CDC INTO`. En Python se usa la API equivalente de Lakeflow Spark Declarative Pipelines. La fuente debe ser streaming y la clave, secuencia y reglas de borrado quedan en la definición declarativa.",
          "`APPLY CHANGES` sigue disponible por compatibilidad y comparte sintaxis, pero Databricks recomienda AUTO CDC. En documentación, código nuevo y respuestas de diseño debe aparecer el nombre actual; mencionar APPLY CHANGES solo aclara una configuración anterior o una migración.",
        ],
        keyPoints: [
          "AUTO CDC sustituye a APPLY CHANGES con la misma finalidad y sintaxis equivalente.",
          "El target de un flow AUTO CDC es una streaming table.",
          "La declaración no elimina la necesidad de validar claves, secuencia, deletes y retención.",
        ],
        example: {
          language: "SQL",
          title: "AUTO CDC SCD tipo 1",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_cdc_flow AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(sequence_number, event_ts)
COLUMNS * EXCEPT (operation, sequence_number)
STORED AS SCD TYPE 1;`,
          note: "`APPLY CHANGES INTO` es la denominación anterior. Para implementaciones nuevas usa `AUTO CDC INTO`.",
        },
        pitfalls: [
          "Copiar ejemplos antiguos y presentar APPLY CHANGES como la API recomendada actual.",
          "Omitir `SEQUENCE BY` autoritativo y asumir que el pipeline puede inferir el orden correcto.",
        ],
        examDecision: "Para aplicar un feed CDC en Lakeflow pipelines, elige AUTO CDC; usa SCD 1 o 2 según si el consumidor necesita estado actual o historia.",
        checkpoint: {
          question: "¿Cuál es la relación entre AUTO CDC y APPLY CHANGES?",
          answer: "AUTO CDC reemplaza y es el nombre recomendado para las APIs antes llamadas APPLY CHANGES; las anteriores siguen disponibles por compatibilidad.",
        },
      },
      {
        summary: "SCD tipo 1 conserva el valor vigente; SCD tipo 2 crea intervalos de validez para responder cómo era una dimensión en un momento pasado.",
        explanation: [
          "Tipo 1 sobrescribe atributos y es apropiado para correcciones donde la historia no aporta valor. Tipo 2 conserva versiones con columnas de inicio y fin administradas por el pipeline. Consultas de hechos históricos pueden unir el event time del hecho con el intervalo de la dimensión.",
          "Guardar historia multiplica filas y exige decidir qué columnas disparan una nueva versión. `TRACK HISTORY ON` puede limitar ese conjunto en AUTO CDC. Campos operativos como `ingested_at` no deberían crear una versión de negocio cada vez que cambia.",
        ],
        keyPoints: [
          "SCD 1 responde 'cuál es el valor actual'; SCD 2 responde también 'cuál era entonces'.",
          "La secuencia determina intervalos; no debe confundirse con la fecha de carga.",
          "El conjunto de columnas históricas controla ruido y coste de almacenamiento.",
        ],
        example: {
          language: "SQL",
          title: "AUTO CDC SCD tipo 2 selectivo",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

CREATE FLOW customers_history_flow AS AUTO CDC INTO
  main.silver.customers_history
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY sequence_number
COLUMNS * EXCEPT (operation)
STORED AS SCD TYPE 2
TRACK HISTORY ON (name, segment, country);`,
          note: "Verifica los nombres de las columnas de control que expone el target antes de diseñar consultas point-in-time.",
        },
        pitfalls: [
          "Usar SCD 2 para cada atributo técnico y generar versiones sin valor analítico.",
          "Sobrescribir con SCD 1 cuando auditoría o reporting histórico necesitan el valor vigente al producirse el hecho.",
        ],
        examDecision: "Si el requisito contiene 'estado actual', SCD 1 suele bastar; si pide auditoría o joins históricos point-in-time, elige SCD 2.",
        checkpoint: {
          question: "¿Qué problema evita `TRACK HISTORY ON` en un target SCD 2?",
          answer: "Evita abrir una versión histórica por cambios en columnas irrelevantes y limita la historia a atributos de negocio seleccionados.",
        },
      },
      {
        summary: "AUTO CDC FROM SNAPSHOT procesa snapshots ordenados cuando la fuente no ofrece un log de cambios, pero necesita una versión fiable y cobertura completa.",
        explanation: [
          "Algunas bases entregan una extracción completa diaria. Comparar snapshots permite inferir inserts, updates y deletes, y las APIs AUTO CDC FROM SNAPSHOT automatizan esa materialización. Cada snapshot debe tener una versión estrictamente creciente y representar el conjunto completo esperado.",
          "Una extracción parcial confundida con snapshot completo produciría borrados masivos. Antes de publicar se validan conteos, particiones y marcadores de finalización. Si el origen sí ofrece CDC continuo, AUTO CDC normal evita comparar toda la dimensión y reduce latencia.",
        ],
        keyPoints: [
          "Snapshot CDC sirve cuando no existe un feed de cambios fiable.",
          "La versión del snapshot debe ordenar entregas y no reutilizarse.",
          "La completitud se comprueba antes de interpretar ausencias como deletes.",
        ],
        example: {
          language: "Python",
          title: "Contrato mínimo de un snapshot",
          code: `snapshot_manifest = {
    "snapshot_version": 2026072101,
    "source_table": "crm.customers",
    "expected_rows": 12_450_230,
    "completed": True,
    "landing_path": "/Volumes/main/landing/customers/2026-07-21/",
}

assert snapshot_manifest["completed"]
assert snapshot_manifest["expected_rows"] > 0`,
          note: "La función que entrega snapshots a AUTO CDC debe ordenar versiones y devolver `None` cuando no haya una nueva disponible.",
        },
        pitfalls: [
          "Interpretar una partición ausente por fallo de extracción como eliminación de todos sus clientes.",
          "Procesar snapshots fuera de orden y reabrir una versión antigua como si fuera nueva.",
        ],
        examDecision: "Si la fuente solo entrega imágenes completas, usa AUTO CDC FROM SNAPSHOT con versión y validación de completitud; no fabriques un feed fila a fila sin base autoritativa.",
        checkpoint: {
          question: "¿Qué validación evita deletes falsos al comparar snapshots?",
          answer: "Confirmar mediante manifiesto/conteos que el snapshot es completo antes de interpretar filas ausentes como eliminadas.",
        },
      },
    ],
    lab: {
      title: "Dimensión de clientes SCD 2 con AUTO CDC",
      goal: "Materializar un feed CDC fuera de orden como historia SCD 2, con deletes explícitos y una secuencia compuesta determinista.",
      scenario: "El CRM publica inserts, updates y deletes de clientes. Los reintentos pueden entregar cambios fuera de orden y dos cambios comparten ocasionalmente timestamp, pero `sequence_number` es monotónico por cliente.",
      steps: [
        "Valida que `customer_id`, `sequence_number`, `operation` y `event_ts` estén presentes en bronze.",
        "Declara una streaming table target para el historial de clientes.",
        "Crea un flow AUTO CDC —no uno nuevo con el nombre anterior APPLY CHANGES— con clave y secuencia compuesta.",
        "Mapea `DELETE`, excluye columnas operativas y conserva historia solo para atributos de negocio.",
        "Prueba dos updates fuera de orden y demuestra que la versión de mayor secuencia queda vigente.",
      ],
      starterCode: `-- Lakeflow Spark Declarative Pipelines SQL
CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

-- TODO: crea un FLOW AUTO CDC desde main.bronze.customer_cdc
-- con customer_id, secuencia determinista, deletes y SCD TYPE 2.`,
      solution: `-- Lakeflow Spark Declarative Pipelines SQL
CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

CREATE FLOW customers_history_cdc AS AUTO CDC INTO
  main.silver.customers_history
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
IGNORE NULL UPDATES
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(sequence_number, event_ts)
COLUMNS * EXCEPT (
  operation,
  sequence_number,
  source_lsn,
  ingested_at
)
STORED AS SCD TYPE 2
TRACK HISTORY ON (
  name,
  email,
  segment,
  country
);`,
      checks: [
        { label: "Usa la API AUTO CDC actual", pattern: "AUTO CDC INTO" },
        { label: "Define clave de negocio", pattern: "KEYS\\s*\\(\\s*customer_id\\s*\\)" },
        { label: "Ordena con una secuencia", pattern: "SEQUENCE BY" },
        { label: "Conserva historia SCD 2", pattern: "STORED AS SCD TYPE 2" },
      ],
      expectedEvidence: [
        "Caso de prueba con insert, update nuevo, update antiguo retrasado y delete para la misma clave.",
        "Consulta del target que muestra intervalos SCD 2 sin solapamiento y una sola versión vigente.",
        "Prueba de que el update retrasado no reemplaza la versión de mayor `sequence_number`.",
        "Explicación de la semántica de `IGNORE NULL UPDATES` para este feed concreto.",
      ],
      cloudNotes: {
        AWS: "Si el CDC procede de una base en AWS, usa conectividad privada y Lakeflow Connect/DMS según el patrón; gobierna tablas y checkpoints en Unity Catalog con IAM role de mínimo privilegio.",
        Azure: "Para CDC desde Azure SQL u otra fuente, prioriza conectividad privada e identidad administrada cuando sea compatible; guarda secretos de conexión fuera del pipeline.",
        GCP: "Para fuentes en GCP, usa private connectivity y service accounts separadas para extracción y almacenamiento; documenta retención del log o snapshots de recuperación.",
      },
    },
    quiz: [
      {
        question: "Un update con secuencia 104 llega antes que otro con secuencia 103. ¿Qué debe quedar vigente tras AUTO CDC?",
        options: [
          "El 103, porque llegó el último",
          "El 104, porque `SEQUENCE BY` representa el orden autoritativo",
          "Ambos como filas vigentes",
          "Ninguno hasta ejecutar `VACUUM`",
        ],
        answer: 1,
        explanation: "AUTO CDC usa la secuencia declarada para resolver eventos fuera de orden; la hora de llegada no debe hacer retroceder el estado.",
        domain: "CDC · orden y deduplicación",
      },
      {
        question: "Una solución nueva usa Lakeflow pipelines para aplicar un feed CDC. ¿Qué API debe nombrar la documentación actual?",
        options: [
          "COPY CHANGES",
          "MERGE STREAM",
          "APPLY CHANGES como única API vigente",
          "AUTO CDC, indicando que reemplaza a APPLY CHANGES",
        ],
        answer: 3,
        explanation: "Databricks recomienda AUTO CDC; APPLY CHANGES es la denominación anterior y sigue disponible por compatibilidad.",
        domain: "Lakeflow pipelines · AUTO CDC",
      },
      {
        question: "Reporting debe saber el segmento que tenía un cliente cuando se produjo cada venta. ¿Qué modelado corresponde?",
        options: [
          "SCD tipo 2 con intervalos de validez",
          "SCD tipo 1 sobrescribiendo el segmento",
          "Una vista del último microbatch sin clave",
          "Eliminar el historial tras cada ejecución",
        ],
        answer: 0,
        explanation: "SCD 2 conserva las versiones necesarias para un join point-in-time; SCD 1 solo conserva el valor actual.",
        domain: "CDC · SCD",
      },
      {
        question: "Un consumidor CDF estuvo detenido más tiempo que la retención y ya no existe la versión requerida. ¿Qué respuesta es segura?",
        options: [
          "Usar `failOnDataLoss=false` y asumir que no falta nada",
          "Inventar la versión a partir del timestamp actual",
          "Reconstruir desde un snapshot válido y restablecer el punto incremental",
          "Borrar la tabla fuente",
        ],
        answer: 2,
        explanation: "Cuando faltan versiones del feed no puede garantizarse continuidad; un snapshot autoritativo permite reconstruir el estado y reiniciar el consumo.",
        domain: "Delta Change Data Feed · recuperación",
      },
    ],
    sources: [
      {
        label: "Delta Change Data Feed · Databricks",
        href: "https://docs.databricks.com/aws/en/delta/delta-change-data-feed",
        reviewedAt,
      },
      {
        label: "AUTO CDC APIs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/cdc",
        reviewedAt,
      },
      {
        label: "AUTO CDC INTO SQL reference · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/developer/ldp-sql-ref-apply-changes-into",
        reviewedAt,
      },
    ],
  },

  m17: {
    lessons: [
      {
        summary: "Un SLA de streaming debe traducirse en indicadores medibles de frescura, completitud, corrección y disponibilidad, con ventanas y responsables explícitos.",
        explanation: [
          "Decir 'tiempo real' no permite diseñar ni operar. Un SLO útil puede exigir que el p95 de `published_at - event_ts` sea inferior a cinco minutos y que al menos el 99,5% de eventos válidos aparezcan antes de quince minutos. La completitud se reconcilia con una fuente autoritativa, no con que el stream siga activo.",
          "Cada indicador necesita una fuente de medición, periodo y presupuesto de error. Un watermark de diez minutos no garantiza por sí mismo diez minutos de frescura: el backlog, el trigger y el sink también cuentan. La arquitectura se valida contra los SLO, no al revés.",
        ],
        keyPoints: [
          "Frescura compara tiempo de negocio publicado con el reloj; disponibilidad solo indica si el proceso está ejecutándose.",
          "Completitud requiere un denominador o reconciliación autoritativa.",
          "El presupuesto de error determina cuándo una desviación es incidente y qué cambios se priorizan.",
        ],
        example: {
          language: "SQL",
          title: "Indicadores de frescura y completitud",
          code: `WITH stream AS (
  SELECT
    date_trunc('hour', event_ts) AS hour,
    percentile_approx(
      unix_timestamp(published_at) - unix_timestamp(event_ts),
      0.95
    ) AS freshness_p95_s,
    count(DISTINCT event_id) AS published_events
  FROM main.silver.clickstream
  WHERE event_ts >= current_timestamp() - INTERVAL 24 HOURS
  GROUP BY 1
)
SELECT * FROM stream ORDER BY hour DESC;`,
          note: "La completitud necesita comparar `published_events` con un conteo independiente de la fuente o un manifiesto de productores.",
        },
        pitfalls: [
          "Medir solo duración de microbatch y llamarla frescura de negocio.",
          "Fijar un SLA sin definir zona horaria, percentil, ventana ni exclusiones de eventos inválidos.",
        ],
        examDecision: "Si el requisito es operacional, busca una métrica observable y un umbral; seleccionar `continuous` o más workers sin SLO no demuestra cumplimiento.",
        checkpoint: {
          question: "¿Por qué una consulta `ACTIVE` puede incumplir frescura?",
          answer: "Puede seguir activa mientras acumula backlog o publica eventos antiguos; hay que medir la diferencia entre event time y tiempo de publicación.",
        },
      },
      {
        summary: "La arquitectura separa entrada auditable, transformación stateful, publicación idempotente y observabilidad para que cada frontera pueda recuperarse.",
        explanation: [
          "Bronze conserva el evento original y coordenadas de origen. Silver valida esquema, deduplica y aplica reglas temporales. Gold sirve agregados con la latencia acordada. Cada consulta tiene un checkpoint exclusivo y cada tabla una clave o contrato que permite recomponerla desde una capa anterior.",
          "La capacidad se diseña para la tasa sostenida más un margen de recuperación. Si tras una hora de caída llegan diez millones de eventos, el pipeline debe procesar más rápido que la tasa normal para volver al SLA. Separar ingestión de agregación evita que un operador stateful pesado bloquee la captura de entrada.",
        ],
        keyPoints: [
          "Bronze inmutable proporciona replay y auditoría.",
          "Checkpoints independientes reducen el radio de impacto de un cambio o fallo.",
          "Capacidad de recuperación debe superar la tasa de llegada, no solo sostenerla.",
        ],
        example: {
          language: "YAML",
          title: "Contrato operativo del pipeline",
          code: `pipeline: clickstream
sources:
  - main.bronze.web_events
targets:
  silver: main.silver.web_events
  gold: main.gold.sessions_5m
slo:
  freshness_p95_seconds: 300
  completeness_percent: 99.5
recovery:
  rto_minutes: 30
  replay_source: main.bronze.web_events
owner: data-platform-oncall`,
          note: "Este contrato debe acompañarse de consultas que calculen cada indicador y enlaces al runbook.",
        },
        pitfalls: [
          "Acoplar ingestión, enrichments externos y agregación en una sola consulta sin punto de replay intermedio.",
          "Dimensionar únicamente para el promedio y no poder reducir backlog después de una interrupción.",
        ],
        examDecision: "Para limitar radio de fallo y permitir replay, persiste bronze y separa checkpoints por etapa; no encadenes todos los efectos en un único `foreachBatch` opaco.",
        checkpoint: {
          question: "¿Qué condición permite que un pipeline recupere backlog?",
          answer: "Su throughput efectivo durante recuperación debe superar la tasa de llegada mientras el origen conserve los datos necesarios.",
        },
      },
      {
        summary: "Un plan de recuperación distingue reinicio, replay y rebuild, y nunca borra estado antes de capturar evidencia y delimitar el rango afectado.",
        explanation: [
          "Un fallo transitorio del executor suele resolverse reanudando desde el mismo checkpoint. Un cambio incompatible de estado requiere checkpoint nuevo y reconstrucción desde bronze. Un error lógico publicado exige identificar versiones o tiempos afectados, corregir código y escribir de forma idempotente en un destino aislado antes del cutover.",
          "La retención de Kafka, CDF, archivos y Delta debe cubrir el RTO y el máximo tiempo de detección. Si el origen ya eliminó datos, restaurar compute no recupera completitud. Los runbooks incluyen criterios para pausar productores o consumidores, rutas alternativas y validación posterior.",
        ],
        keyPoints: [
          "Reinicio conserva checkpoint; replay usa un rango y estado aislados; rebuild reconstruye una tabla completa.",
          "Captura `lastProgress`, offsets, versión de código y error antes de mutar estado.",
          "La retención de origen es un requisito de recuperación, no solo una decisión de coste.",
        ],
        example: {
          language: "SQL",
          title: "Delimitación de una ventana de reparación",
          code: `SELECT
  min(event_ts) AS first_affected,
  max(event_ts) AS last_affected,
  count(*) AS affected_rows,
  count(DISTINCT event_id) AS affected_events
FROM main.silver.web_events
WHERE pipeline_version = '2026.07.20-bad'
  AND event_date BETWEEN DATE '2026-07-20' AND DATE '2026-07-21';`,
          note: "Repara primero en una tabla sombra y compara claves/conteos antes de reemplazar o hacer `MERGE` en producción.",
        },
        pitfalls: [
          "Borrar checkpoint como primer paso y perder el punto exacto del incidente.",
          "Reprocesar todo el histórico en el mismo destino sin aislar escrituras ni evitar duplicados.",
        ],
        examDecision: "Fallo transitorio: reanuda. Cambio stateful incompatible: checkpoint nuevo y rebuild. Error de datos: replay delimitado e idempotente con validación previa.",
        checkpoint: {
          question: "¿Cuándo es apropiado conservar el checkpoint durante la recuperación?",
          answer: "Cuando la topología y estado siguen siendo compatibles y el fallo es transitorio; así se reanuda desde los offsets confirmados.",
        },
      },
      {
        summary: "La observabilidad combina progreso Spark, lag de fuente, calidad de datos y SLO de negocio para ofrecer alertas accionables.",
        explanation: [
          "El progreso de la consulta muestra duración, tasas y estado; Kafka o Auto Loader aportan backlog; las tablas silver aportan máximo event time y descartes. Una alerta de frescura debe enlazar esas señales para diferenciar fuente parada, cuello de proceso, dato inválido o sink lento.",
          "Las métricas se escriben en una tabla con `query_id`, `batch_id`, versión y timestamp. Un dashboard sin alertas ni propietario no reduce tiempo de recuperación. Cada alarma debe incluir umbral, periodo, severidad, enlace a evidencia y primera acción segura.",
        ],
        keyPoints: [
          "Una única métrica técnica rara vez explica un incumplimiento de negocio.",
          "Las alertas usan ventanas sostenidas para evitar ruido de un microbatch aislado.",
          "Versión de código y query ID permiten correlacionar regresiones con despliegues.",
        ],
        example: {
          language: "Python",
          title: "Registro estructurado del progreso",
          code: `import json
from pyspark.sql import Row

progress = query.lastProgress or {}
record = Row(
    query_id=str(query.id),
    batch_id=progress.get("batchId"),
    observed_at=progress.get("timestamp"),
    input_rps=progress.get("inputRowsPerSecond", 0.0),
    processed_rps=progress.get("processedRowsPerSecond", 0.0),
    progress_json=json.dumps(progress),
)
spark.createDataFrame([record]).write.mode("append").saveAsTable(
    "main.ops.streaming_progress"
)`,
          note: "Para una solución productiva usa un listener o monitor administrado y controla volumen/PII del JSON de progreso.",
        },
        pitfalls: [
          "Alertar por una tasa baja cuando la fuente no tiene eventos y el SLO sigue satisfecho.",
          "Guardar logs sin `batch_id`, versión ni owner, impidiendo correlación y respuesta.",
        ],
        examDecision: "Si una alerta debe ser accionable, incluye la señal de negocio, backlog/progreso y contexto de despliegue; no alertes solo porque una consulta está inactiva.",
        checkpoint: {
          question: "¿Qué señales distinguen una fuente parada de un consumidor lento?",
          answer: "Fuente parada: no aumentan offsets ni event time. Consumidor lento: aumentan offsets/backlog mientras la tasa procesada queda por debajo de la llegada.",
        },
      },
      {
        summary: "Un game day verifica con fallos controlados que checkpoints, capacidad, alertas y runbook cumplen el RTO sin duplicar ni perder datos.",
        explanation: [
          "La prueba puede detener compute durante diez minutos, introducir un evento tardío y reiniciar desde el mismo checkpoint. Se mide tiempo hasta recuperar frescura, lag máximo, duplicados y completitud. Otra prueba despliega un cambio stateful incompatible en un entorno aislado para practicar rollback o rebuild.",
          "El runbook se escribe como decisiones observables: si el checkpoint está íntegro y el código es compatible, reanudar; si faltan offsets, escalar pérdida y reconciliar; si el sink tiene efectos externos, verificar idempotencia. El resultado del ejercicio genera acciones con responsable y fecha.",
        ],
        keyPoints: [
          "Define estado inicial y criterios de éxito antes de inyectar el fallo.",
          "Mide RTO y calidad final, no solo que el proceso vuelve a estado RUNNING.",
          "El game day debe ser reversible, aislado y aprobado por el owner del servicio.",
        ],
        example: {
          language: "YAML",
          title: "Caso de game day reproducible",
          code: `experiment: stop-streaming-compute
preconditions:
  - bronze_backlog_is_zero
  - baseline_freshness_p95_lt_300s
fault:
  duration_minutes: 10
success:
  - no_duplicate_event_ids
  - completeness_percent_gte_99.5
  - freshness_recovered_within_30m
rollback:
  - resume_original_job
  - preserve_checkpoint
owner: data-platform-oncall`,
          note: "No ejecutes un experimento de resiliencia en producción sin límites, observabilidad y autorización explícitos.",
        },
        pitfalls: [
          "Declarar éxito cuando el query reinicia aunque el backlog y los duplicados sigan creciendo.",
          "Probar borrado de checkpoint productivo sin snapshot, aislamiento ni procedimiento de rollback.",
        ],
        examDecision: "Una recuperación se considera completa cuando restablece SLO y calidad dentro del RTO; `RUNNING` por sí solo no es criterio suficiente.",
        checkpoint: {
          question: "¿Qué cuatro resultados mínimos debe registrar un game day de streaming?",
          answer: "RTO, frescura recuperada, completitud final y ausencia/control de duplicados, junto con la evidencia del backlog.",
        },
      },
    ],
    lab: {
      title: "Proyecto: clickstream con SLA y recuperación",
      goal: "Entregar un flujo deduplicado con ventanas, métricas de frescura, checkpoint recuperable y un game day que demuestre el RTO.",
      scenario: "Producto necesita sesiones de clics cada cinco minutos. El p95 de frescura debe ser menor de cinco minutos, el 99,5% debe publicarse en quince minutos y una parada de diez minutos debe recuperarse en menos de treinta.",
      steps: [
        "Define consultas SQL que midan frescura, completitud y duplicados sobre datos de prueba.",
        "Implementa validación temporal, watermark de quince minutos y deduplicación por `event_id`.",
        "Publica ventanas de cinco minutos con checkpoint versionado y `availableNow` para el ejercicio.",
        "Captura progreso y máximo event time después de cada ejecución.",
        "Simula una parada/backlog, reanuda con el mismo checkpoint y mide tiempo hasta recuperar el SLO.",
        "Entrega un runbook con criterios de reinicio, replay y rebuild.",
      ],
      starterCode: `from pyspark.sql import functions as F

events = spark.readStream.table("main.bronze.web_events")

# TODO: validar event_ts, deduplicar con watermark, crear ventanas y publicar.
# SLO: freshness p95 < 300 s; completeness >= 99.5%; RTO < 30 min.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m17_clickstream_v1"
source = spark.readStream.table("main.bronze.web_events")

clean = (
    source.withColumn("event_ts", F.to_timestamp("event_ts"))
      .where(
          F.col("event_id").isNotNull() &
          F.col("session_id").isNotNull() &
          F.col("event_ts").isNotNull() &
          (F.col("event_ts") <= F.current_timestamp() + F.expr("INTERVAL 2 MINUTES"))
      )
)

deduplicated = (
    clean.withWatermark("event_ts", "15 minutes")
         .dropDuplicatesWithinWatermark(["event_id"])
)

sessions_5m = (
    deduplicated.groupBy(
        F.window("event_ts", "5 minutes"),
        "session_id",
    )
    .agg(
        F.count("event_id").alias("events"),
        F.countDistinct("page").alias("pages"),
        F.max("event_ts").alias("last_event_ts"),
    )
    .select(
        "session_id",
        F.col("window.start").alias("window_start"),
        F.col("window.end").alias("window_end"),
        "events", "pages", "last_event_ts",
        F.current_timestamp().alias("published_at"),
    )
)

query = (
    sessions_5m.writeStream
      .queryName("m17_clickstream_sessions")
      .outputMode("append")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable("main.gold.clickstream_sessions_5m")
)
query.awaitTermination()
print({
    "progress": query.lastProgress,
    "target_rows": spark.table("main.gold.clickstream_sessions_5m").count(),
})`,
      checks: [
        { label: "Aplica watermark y deduplicación", pattern: "withWatermark[\\s\\S]*dropDuplicatesWithinWatermark" },
        { label: "Crea ventanas de cinco minutos", pattern: "window\\(\"event_ts\",\\s*\"5 minutes\"\\)" },
        { label: "Usa checkpoint versionado", pattern: "(?:checkpointLocation[\\s\\S]*m17_clickstream_v1|m17_clickstream_v1[\\s\\S]*checkpointLocation)" },
        { label: "Conserva evidencia de progreso", pattern: "lastProgress" },
      ],
      expectedEvidence: [
        "Definición cuantitativa de frescura, completitud, duplicados y RTO.",
        "Resultados de casos a tiempo, tardíos dentro del umbral, demasiado tardíos y duplicados.",
        "Serie antes/durante/después del game day con backlog y frescura.",
        "Prueba de reanudación desde el mismo checkpoint sin duplicar `event_id`.",
        "Runbook con responsables y decisiones de reinicio, replay y rebuild.",
      ],
      cloudNotes: {
        AWS: "Asegura que la retención de MSK/Kinesis o S3 cubra detección más RTO; usa CloudWatch y conectividad privada junto a las métricas de Databricks.",
        Azure: "Alinea retención de Event Hubs/ADLS con el RTO y usa Azure Monitor más métricas de streaming; la managed identity debe acceder a checkpoints durante recuperación.",
        GCP: "Configura retención de Pub/Sub/Kafka/GCS por encima del peor tiempo de recuperación y correlaciona Cloud Monitoring con el progreso de Databricks.",
      },
    },
    quiz: [
      {
        question: "La consulta está ACTIVE, pero el máximo `event_ts` publicado tiene 40 minutos de retraso. ¿Qué indicador está incumplido?",
        options: [
          "Disponibilidad del metastore",
          "Frescura de negocio",
          "Retención de VACUUM necesariamente",
          "Número de notebooks",
        ],
        answer: 1,
        explanation: "El proceso puede estar activo y, aun así, publicar datos antiguos. La diferencia entre event time y publicación mide frescura.",
        domain: "Streaming production readiness · SLA",
      },
      {
        question: "Tras un fallo transitorio del executor, código, fuente y estado no han cambiado. ¿Qué recuperación minimiza riesgo?",
        options: [
          "Reanudar con el mismo checkpoint",
          "Borrar bronze y empezar desde latest",
          "Crear un checkpoint nuevo sin reconciliación",
          "Vaciar el target antes de cada reintento",
        ],
        answer: 0,
        explanation: "Con topología compatible, el checkpoint conserva offsets, commits y estado y permite continuar desde el último punto confirmado.",
        domain: "Streaming production readiness · recuperación",
      },
      {
        question: "Después de una caída, el pipeline procesa exactamente a la misma tasa a la que llegan eventos nuevos. ¿Qué ocurre con el backlog?",
        options: [
          "Desaparece por el watermark",
          "Se duplica en cada trigger",
          "Permanece aproximadamente constante y no se recupera el SLA",
          "Delta lo convierte automáticamente en batch",
        ],
        answer: 2,
        explanation: "Para reducir backlog el throughput debe superar temporalmente la tasa de llegada; igualarla solo evita que aumente.",
        domain: "Streaming production readiness · capacidad",
      },
      {
        question: "Un game day se declara exitoso porque el Job vuelve a RUNNING, pero hay 4% de eventos perdidos. ¿Cuál es la evaluación correcta?",
        options: [
          "Éxito, porque el estado RUNNING es suficiente",
          "Éxito si el cluster usa Photon",
          "Éxito si se borró el checkpoint",
          "Fallo: la recuperación debe restaurar también completitud y SLO dentro del RTO",
        ],
        answer: 3,
        explanation: "El objetivo es recuperar el servicio correcto, no solo reiniciar el proceso. La pérdida incumple el criterio de completitud.",
        domain: "Streaming production readiness · game day",
      },
    ],
    sources: [
      {
        label: "Production considerations for Structured Streaming · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/production",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
      {
        label: "Structured Streaming checkpoints · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/checkpoints",
        reviewedAt,
      },
    ],
  },

  m18: {
    lessons: [
      {
        summary: "Lakeflow Spark Declarative Pipelines describe datasets y dependencias; el servicio construye el grafo, planifica actualizaciones y registra linaje y eventos.",
        explanation: [
          "En lugar de iniciar manualmente varios `writeStream`, cada función devuelve un DataFrame que define un dataset. Las lecturas entre datasets establecen dependencias y el pipeline determina el orden. Esto reduce código operativo, pero no elimina decisiones sobre contrato, incrementabilidad, calidad o coste.",
          "El grafo debe expresar transformaciones de datos, no pasos imperativos con efectos externos. Crear archivos, llamar APIs o mutar tablas arbitrariamente dentro de una función declarativa rompe reevaluación y dificulta optimización. Esos efectos pertenecen a tareas de Jobs alrededor del pipeline.",
        ],
        keyPoints: [
          "Las funciones declarativas devuelven DataFrames y no deben ejecutar acciones como `collect()` o escrituras manuales.",
          "Las dependencias proceden de lecturas, no del orden físico de funciones en el archivo.",
          "El event log ofrece progreso, calidad, linaje y errores del grafo.",
        ],
        example: {
          language: "PySpark",
          title: "Dos datasets declarativos conectados",
          code: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.table(name="orders_bronze")
def orders_bronze():
    return spark.readStream.table("main.raw.orders")

@dp.materialized_view(name="daily_order_totals")
def daily_order_totals():
    return (
        spark.read.table("orders_bronze")
          .groupBy(F.to_date("event_ts").alias("order_date"))
          .agg(F.sum("amount").alias("revenue"))
    )`,
          note: "El nombre lógico `orders_bronze` crea la dependencia; el pipeline administra actualización y metadatos.",
        },
        pitfalls: [
          "Llamar `display`, `count` o `saveAsTable` dentro de una función decorada y mezclar declaración con ejecución.",
          "Depender del orden del archivo en vez de leer explícitamente el dataset upstream.",
        ],
        examDecision: "Si el objetivo es declarar un grafo de tablas y vistas con operación gestionada, usa pipelines; para efectos externos o control flow, envuélvelo con Lakeflow Jobs.",
        checkpoint: {
          question: "¿Qué crea una arista entre dos datasets del pipeline?",
          answer: "Que la definición downstream lea el dataset upstream; la posición de las funciones en el archivo no determina la dependencia.",
        },
      },
      {
        summary: "Una streaming table procesa nuevas filas de una fuente streaming y conserva semántica incremental apropiada para bronze y silver append/CDC.",
        explanation: [
          "Una definición con `spark.readStream` produce un flujo continuo o por triggers dentro del pipeline. La tabla persiste resultados y el servicio gestiona checkpoints internos. Es adecuada cuando cada registro nuevo puede procesarse incrementalmente sin recalcular todo el resultado.",
          "No debe leerse una fuente cambiante con `spark.read` y esperar semántica streaming. Tampoco se usa una streaming table para una consulta que necesita revisar cambios arbitrarios en ambos lados de un join batch; una materialized view puede permitir actualización incremental gestionada.",
        ],
        keyPoints: [
          "`spark.readStream` señala una entrada incremental.",
          "El pipeline administra estado operativo; no se define `checkpointLocation` dentro del dataset.",
          "La compatibilidad de transformaciones streaming sigue aplicando, incluidos watermarks para estado acotado.",
        ],
        example: {
          language: "PySpark",
          title: "Streaming table desde archivos con Auto Loader",
          code: `from pyspark import pipelines as dp

@dp.table(
    name="orders_bronze",
    comment="Pedidos crudos con metadatos de origen",
    table_properties={"quality": "bronze"},
)
def orders_bronze():
    return (
        spark.readStream.format("cloudFiles")
          .option("cloudFiles.format", "json")
          .option("cloudFiles.schemaLocation", "/Volumes/main/ops/schemas/orders")
          .load("/Volumes/main/landing/orders")
    )`,
          note: "La ubicación de esquema de Auto Loader sigue siendo necesaria aunque el pipeline gestione su propio estado.",
        },
        pitfalls: [
          "Añadir manualmente `writeStream` o `checkpointLocation` dentro de una definición de pipeline.",
          "Aplicar una agregación stateful sin watermark y trasladar al servicio un estado ilimitado.",
        ],
        examDecision: "Elige streaming table cuando la entrada y transformación son incrementales fila a fila; conserva materialized view para resultados que el servicio puede refrescar desde cambios upstream.",
        checkpoint: {
          question: "¿Quién gestiona el checkpoint de una streaming table en un pipeline?",
          answer: "Lakeflow Spark Declarative Pipelines; el código del dataset no debe iniciar un `writeStream` ni declarar su checkpoint.",
        },
      },
      {
        summary: "Una materialized view almacena el resultado de una consulta batch declarativa y el servicio intenta actualizarla incrementalmente cuando cambian sus dependencias.",
        explanation: [
          "A diferencia de una vista lógica, la salida se materializa para servir consultas rápidas. La definición suele usar `spark.read.table` porque describe el resultado completo correcto. El motor decide si puede aplicar cambios incrementales o si necesita recomputar según consulta y origen.",
          "Es apropiada para joins, agregaciones y modelos gold donde el resultado puede cambiar por actualizaciones upstream. No promete que toda consulta sea siempre incremental; diseño de claves, filtros y operaciones influye en el plan de refresh y debe observarse en el event log.",
        ],
        keyPoints: [
          "La definición expresa el resultado completo, aunque el refresh pueda ser incremental.",
          "Una materialized view almacena datos; una vista estándar recalcula al consultar.",
          "El event log permite verificar modo y coste del refresh en vez de asumirlo.",
        ],
        example: {
          language: "PySpark",
          title: "Vista materializada gold",
          code: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.materialized_view(name="customer_order_metrics")
def customer_order_metrics():
    orders = spark.read.table("orders_silver")
    return (
        orders.groupBy("customer_id")
          .agg(
              F.countDistinct("order_id").alias("orders"),
              F.sum("amount").alias("lifetime_value"),
              F.max("event_ts").alias("last_order_at"),
          )
    )`,
          note: "Consulta el event log para confirmar si las actualizaciones concretas usan refresh incremental.",
        },
        pitfalls: [
          "Usar `readStream` por reflejo en una materialized view que describe un resultado completo cambiante.",
          "Prometer refresh incremental para cualquier UDF o consulta sin observar el plan real.",
        ],
        examDecision: "Para un agregado gold materializado que debe reflejar updates upstream, prefiere materialized view; para append continuo por fila, streaming table.",
        checkpoint: {
          question: "¿Por qué la definición de una materialized view puede usar una lectura batch y seguir actualizándose incrementalmente?",
          answer: "Porque declara el resultado completo y el servicio analiza cambios upstream para elegir una estrategia de refresh cuando es compatible.",
        },
      },
      {
        summary: "Los flows permiten varias entradas hacia un target y distinguen append, AUTO CDC y cargas `ONCE` dentro del mismo modelo declarativo.",
        explanation: [
          "Un default flow acompaña la definición normal de un dataset. Flows adicionales pueden unir feeds regionales en una misma streaming table sin construir un `union` monolítico. Un append flow añade filas; AUTO CDC aplica cambios ordenados; `ONCE` ejecuta una carga batch una sola vez salvo full refresh.",
          "Cada flow debe tener identidad y semántica compatibles con el target. Un target de AUTO CDC solo recibe flows AUTO CDC. Para backfill histórico, un append flow `ONCE` aislado puede coexistir con la ingesta continua, siempre que no duplique rangos ya procesados.",
        ],
        keyPoints: [
          "Varios append flows pueden escribir en una misma streaming table.",
          "AUTO CDC targets solo aceptan flows AUTO CDC.",
          "`ONCE` sirve para una carga finita y vuelve a ejecutarse en un full refresh.",
        ],
        example: {
          language: "SQL",
          title: "Flows regionales hacia una tabla",
          code: `CREATE OR REFRESH STREAMING TABLE main.bronze.orders_all;

CREATE FLOW orders_eu AS INSERT INTO main.bronze.orders_all
BY NAME SELECT *, 'eu' AS region
FROM STREAM(main.raw.orders_eu);

CREATE FLOW orders_us AS INSERT INTO main.bronze.orders_all
BY NAME SELECT *, 'us' AS region
FROM STREAM(main.raw.orders_us);`,
          note: "Valida claves y esquema comunes; `BY NAME` evita depender del orden físico de columnas.",
        },
        pitfalls: [
          "Mezclar append y AUTO CDC sobre el mismo target sin respetar las restricciones del flow.",
          "Usar `ONCE` para datos que seguirán llegando y dejar de ingerir silenciosamente después de la primera actualización.",
        ],
        examDecision: "Cuando varias fuentes compatibles alimentan el mismo target, usa flows separados; para cambios de estado usa AUTO CDC, no un append de updates.",
        checkpoint: {
          question: "¿Cuándo volvería a ejecutarse un flow marcado `ONCE`?",
          answer: "En la primera actualización y de nuevo si se realiza un full refresh del target o pipeline, según la semántica documentada.",
        },
      },
      {
        summary: "Un pipeline mantenible separa datasets por dominio y capa, parametriza catálogos/rutas y mantiene efectos operativos fuera de las definiciones.",
        explanation: [
          "Los archivos Python pueden agruparse por bronze, silver y gold o por dominio, siempre que los nombres de dataset sean únicos. Configuración como catálogo fuente, paths y umbrales entra mediante parámetros del pipeline, no constantes replicadas. Las funciones de transformación puras se prueban fuera de los decoradores.",
          "Dev, test y prod ejecutan el mismo código con targets y permisos distintos. Una actualización se valida en un catálogo aislado y con datos representativos antes de promover. El owner revisa event log, lineage y cambios de esquema tras desplegar.",
        ],
        keyPoints: [
          "Configuración cambia por entorno; lógica y artefacto permanecen iguales.",
          "Transformaciones puras son comprobables sin arrancar el pipeline completo.",
          "Nombres, comentarios y propiedades de tabla forman parte del contrato gobernado.",
        ],
        example: {
          language: "Python",
          title: "Configuración de entorno sin duplicar código",
          code: `source_catalog = spark.conf.get("pipelines.source_catalog")
target_catalog = spark.conf.get("pipelines.target_catalog")
lateness = spark.conf.get("pipelines.orders_lateness", "15 minutes")

source_table = f"{source_catalog}.bronze.orders"
target_prefix = f"{target_catalog}.commerce"

assert source_catalog != target_catalog or target_catalog.endswith("_dev")`,
          note: "Aplica permisos y ownership en la configuración de despliegue; una aserción no sustituye las políticas del entorno.",
        },
        pitfalls: [
          "Copiar el pipeline entero para prod y permitir que las versiones diverjan.",
          "Introducir llamadas externas en funciones declarativas y crear resultados no deterministas durante reevaluación.",
        ],
        examDecision: "Para promoción segura, usa un artefacto único parametrizado por entorno y prueba transformaciones puras; no mantengas ramas de código permanentes por workspace.",
        checkpoint: {
          question: "¿Qué debe variar entre dev y prod?",
          answer: "Catálogos, rutas, tamaños, identidades y parámetros; la misma lógica versionada debe promocionarse entre entornos.",
        },
      },
    ],
    lab: {
      title: "Pipeline declarativo de pedidos",
      goal: "Declarar una streaming table bronze, una silver validada y una materialized view gold sin escrituras imperativas dentro de las funciones.",
      scenario: "Pedidos llegan como JSON a un Volume. El equipo necesita ingesta incremental, una tabla silver tipada y métricas diarias que reflejen correcciones upstream con operación administrada.",
      steps: [
        "Crea una streaming table bronze con Auto Loader, metadatos de origen y schema location.",
        "Define una streaming table silver que normalice tipos y descarte filas estructuralmente inválidas.",
        "Define una materialized view diaria por fecha y región.",
        "Parametriza catálogo de entrada y ruta de landing mediante configuración del pipeline.",
        "Actualiza el pipeline dos veces y usa event log/lineage para demostrar dependencias y procesamiento incremental.",
      ],
      starterCode: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

landing = spark.conf.get("pipelines.orders_landing")

# TODO: @dp.table orders_bronze
# TODO: @dp.table orders_silver
# TODO: @dp.materialized_view daily_orders`,
      solution: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

landing = spark.conf.get("pipelines.orders_landing")
schema_location = spark.conf.get("pipelines.orders_schema_location")

@dp.table(
    name="orders_bronze",
    comment="Pedidos JSON crudos con procedencia",
    table_properties={"quality": "bronze"},
)
def orders_bronze():
    return (
        spark.readStream.format("cloudFiles")
          .option("cloudFiles.format", "json")
          .option("cloudFiles.schemaLocation", schema_location)
          .load(landing)
          .withColumn("source_file", F.input_file_name())
          .withColumn("ingested_at", F.current_timestamp())
    )

@dp.table(
    name="orders_silver",
    comment="Pedidos válidos y tipados",
    table_properties={"quality": "silver"},
)
def orders_silver():
    return (
        spark.readStream.table("orders_bronze")
          .withColumn("event_ts", F.to_timestamp("event_ts"))
          .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
          .where(
              F.col("order_id").isNotNull() &
              F.col("event_ts").isNotNull() &
              (F.col("amount") >= 0)
          )
          .select(
              "order_id", "customer_id", "region",
              "event_ts", "amount", "source_file", "ingested_at"
          )
    )

@dp.materialized_view(
    name="daily_orders",
    comment="Métricas diarias por región",
)
def daily_orders():
    return (
        spark.read.table("orders_silver")
          .groupBy(F.to_date("event_ts").alias("order_date"), "region")
          .agg(
              F.countDistinct("order_id").alias("orders"),
              F.sum("amount").alias("revenue"),
          )
    )`,
      checks: [
        { label: "Declara datasets con decoradores", pattern: "@dp\\.(table|materialized_view)" },
        { label: "Usa Auto Loader en bronze", pattern: "cloudFiles" },
        { label: "Lee silver como stream", pattern: "readStream\\.table\\(\"orders_bronze\"\\)" },
        { label: "Crea una materialized view gold", pattern: "@dp\\.materialized_view" },
      ],
      expectedEvidence: [
        "Grafo con `orders_bronze` → `orders_silver` → `daily_orders` y lineage visible.",
        "Primera actualización con archivos procesados y segunda sin duplicar entradas.",
        "Filas de muestra que demuestran tipos silver y agregados diarios.",
        "Consulta del event log con estado de los tres flows y estrategia de actualización observada.",
      ],
      cloudNotes: {
        AWS: "Configura `orders_landing` sobre un Volume/external location en S3 y usa managed file events cuando corresponda; la storage credential debe asumir un IAM role.",
        Azure: "Apunta el Volume a ADLS Gen2 y autoriza una managed identity o service principal; habilita file events compatibles en la external location.",
        GCP: "Usa GCS mediante external location y service account de mínimo privilegio; configura file events administrados cuando estén disponibles para el origen.",
      },
    },
    quiz: [
      {
        question: "Una función decorada llama `saveAsTable` y después devuelve un DataFrame. ¿Qué problema introduce?",
        options: [
          "Ninguno; toda función declarativa debe escribir manualmente",
          "El pipeline pierde Unity Catalog",
          "Mezcla un efecto imperativo con la declaración y dificulta reevaluación/optimización",
          "Convierte automáticamente la tabla en SCD 2",
        ],
        answer: 2,
        explanation: "Las funciones del pipeline deben describir datasets devolviendo DataFrames. El servicio administra escrituras y ejecución.",
        domain: "Lakeflow Spark Declarative Pipelines · modelo declarativo",
      },
      {
        question: "Gold debe reflejar updates en silver y servir un agregado por cliente ya materializado. ¿Qué objeto encaja?",
        options: [
          "Una materialized view",
          "Un append de archivos sin tabla",
          "Un notebook con `display`",
          "Un checkpoint compartido entre consultas",
        ],
        answer: 0,
        explanation: "La materialized view conserva el resultado y el servicio puede refrescarlo a partir de cambios upstream.",
        domain: "Lakeflow Spark Declarative Pipelines · materialized views",
      },
      {
        question: "Tres regiones alimentan una misma streaming table con el mismo contrato. ¿Qué diseño evita un `union` monolítico?",
        options: [
          "Tres catálogos sin dependencias",
          "Un full refresh por cada archivo",
          "Tres Jobs que sobrescriben el target",
          "Flows append separados hacia el mismo target",
        ],
        answer: 3,
        explanation: "Múltiples append flows pueden alimentar una streaming table y mantienen separada la operación de cada fuente.",
        domain: "Lakeflow Spark Declarative Pipelines · flows",
      },
      {
        question: "¿Qué combinación debe mantenerse igual al promover de test a prod?",
        options: [
          "Catálogo, credenciales y capacidad",
          "El artefacto de código y su lógica versionada",
          "Todos los nombres físicos de recursos",
          "La identidad del desarrollador",
        ],
        answer: 1,
        explanation: "Se promociona el mismo artefacto; configuración, identidades, targets y capacidad cambian por entorno.",
        domain: "Lakeflow Spark Declarative Pipelines · despliegue",
      },
    ],
    sources: [
      {
        label: "Lakeflow Spark Declarative Pipelines flows · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/flows",
        reviewedAt,
      },
      {
        label: "Materialized views · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/materialized-views",
        reviewedAt,
      },
      {
        label: "Lakeflow Spark Declarative Pipelines · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/",
        reviewedAt,
      },
    ],
  },

  m19: {
    lessons: [
      {
        summary: "Las expectations convierten reglas de calidad en métricas y acciones declarativas: observar, descartar o fallar la actualización.",
        explanation: [
          "`expect` conserva tanto filas válidas como inválidas y registra métricas; es útil durante adopción o para reglas informativas. `expect_or_drop` elimina las filas que incumplen y permite continuar. `expect_or_fail` detiene el flow y revierte atómicamente la actualización afectada cuando aceptar datos incorrectos sería peor que retrasar publicación.",
          "La acción se elige por impacto y capacidad de remediación, no por severidad nominal. Un `order_id` nulo puede ir a cuarentena si el resto del pipeline debe continuar; una violación de unicidad en un saldo regulado puede justificar fallo. Toda regla necesita owner, definición y umbral operativo.",
        ],
        keyPoints: [
          "`expect` mide sin eliminar; `expect_or_drop` continúa sin la fila; `expect_or_fail` aborta el flow afectado.",
          "Los nombres de expectation deben ser estables y describir el contrato.",
          "Fallar una actualización protege el target, pero puede consumir el presupuesto de frescura.",
        ],
        example: {
          language: "PySpark",
          title: "Tres acciones de calidad diferenciadas",
          code: `from pyspark import pipelines as dp

@dp.table(name="orders_silver")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return spark.readStream.table("orders_bronze")`,
          note: "Aplicar tres acciones al mismo dataset solo es correcto si negocio ha decidido explícitamente el tratamiento de cada violación.",
        },
        pitfalls: [
          "Usar `expect_or_fail` para toda anomalía y convertir una fila reparable en una caída completa del flow.",
          "Usar `expect` para una clave obligatoria y permitir que inválidos lleguen silenciosamente a consumidores.",
        ],
        examDecision: "Observabilidad sin bloquear: `expect`. Filas aislables: `expect_or_drop` más cuarentena. Contrato cuya violación invalida el resultado: `expect_or_fail`.",
        checkpoint: {
          question: "¿Qué acción conserva filas inválidas pero produce métricas?",
          answer: "`expect`; ni descarta la fila ni falla la actualización.",
        },
      },
      {
        summary: "Una cuarentena útil conserva la fila, procedencia, regla incumplida y versión para que pueda corregirse y reprocesarse.",
        explanation: [
          "Descartar con una expectation no crea automáticamente una tabla de cuarentena. El patrón explícito clasifica una vista común en salida válida e inválida. La rama inválida añade `failure_reasons`, timestamp, source file u offset y versión de pipeline; la rama válida aplica las mismas condiciones complementarias.",
          "La cuarentena necesita política de acceso porque puede contener PII, retención y un flujo de remediación. Reinyectar datos corregidos directamente en silver salta trazabilidad; conviene publicar una nueva entrada con identidad estable o una tabla de correcciones que pase por las mismas reglas.",
        ],
        keyPoints: [
          "Válidos e inválidos deben derivarse de una única clasificación para evitar huecos.",
          "Cada fila inválida conserva evidencia suficiente para diagnóstico y replay.",
          "La remediación vuelve a entrar por una frontera gobernada y evita doble conteo.",
        ],
        example: {
          language: "PySpark",
          title: "Clasificación con motivos de rechazo",
          code: `from pyspark.sql import functions as F

classified = (
    spark.readStream.table("orders_bronze")
      .withColumn(
          "failure_reasons",
          F.array_compact(F.array(
              F.when(F.col("order_id").isNull(), F.lit("MISSING_ORDER_ID")),
              F.when(F.col("amount") < 0, F.lit("NEGATIVE_AMOUNT")),
              F.when(F.col("event_ts").isNull(), F.lit("INVALID_EVENT_TS")),
          ))
      )
)

valid = classified.where("size(failure_reasons) = 0")
quarantine = classified.where("size(failure_reasons) > 0")`,
          note: "Usa una función compartida para que la condición válida sea exactamente el complemento de la cuarentena.",
        },
        pitfalls: [
          "Definir filtros independientes para válidos e inválidos y dejar filas que no caen en ninguna rama.",
          "Guardar solo un conteo de errores, sin payload ni procedencia para repararlos.",
        ],
        examDecision: "Si el requisito pide investigar o recuperar inválidos, una expectation de drop no basta: materializa una rama de cuarentena con motivos y procedencia.",
        checkpoint: {
          question: "¿Qué propiedad evita perder o duplicar filas entre silver y cuarentena?",
          answer: "Que ambas ramas provengan de una clasificación común y usen condiciones complementarias sobre la misma lista de motivos.",
        },
      },
      {
        summary: "El pipeline event log es la fuente estructurada para progreso, calidad, linaje y errores, y debe consultarse usando campos documentados.",
        explanation: [
          "Los eventos `flow_progress` incluyen estado, métricas y `data_quality` dentro de `details`. `origin` identifica pipeline, update y flow. La función `event_log(TABLE(...))` permite consultar el log asociado a una tabla del pipeline desde SQL y construir tendencias por expectation.",
          "No todo campo interno es contrato público. Las consultas operativas seleccionan campos documentados y toleran ausencia de métricas en eventos que no sean de progreso. Conservar `update_id`, nombre de flow y timestamp permite relacionar una caída de calidad con despliegue y lote.",
        ],
        keyPoints: [
          "Filtra `event_type = 'flow_progress'` antes de interpretar métricas de flow.",
          "El JSON `details` se analiza con rutas documentadas y tipos explícitos.",
          "Event log complementa, no sustituye, una reconciliación de negocio.",
        ],
        example: {
          language: "SQL",
          title: "Inspección de calidad en el event log",
          code: `SELECT
  timestamp,
  origin.update_id AS update_id,
  origin.flow_name AS flow_name,
  details:flow_progress.status::STRING AS status,
  details:flow_progress.data_quality:expectations AS expectations
FROM event_log(TABLE(main.silver.orders_silver))
WHERE event_type = 'flow_progress'
ORDER BY timestamp DESC
LIMIT 100;`,
          note: "Normaliza el array de expectations en una vista operativa para calcular tasas por regla y actualización.",
        },
        pitfalls: [
          "Consultar cualquier evento como si contuviera `flow_progress` y generar nulos difíciles de interpretar.",
          "Construir dependencias permanentes sobre campos internos no documentados del JSON.",
        ],
        examDecision: "Para saber cuántas filas violaron una expectation o por qué falló un flow, consulta event log; el historial de Jobs solo indica el resultado de la tarea envolvente.",
        checkpoint: {
          question: "¿Qué evento contiene normalmente las métricas de expectations?",
          answer: "`flow_progress`, dentro de la sección documentada `details.flow_progress.data_quality`.",
        },
      },
      {
        summary: "Un contrato de calidad define dimensión, expresión, acción, umbral, owner y procedimiento de remediación antes de escribir código.",
        explanation: [
          "Validez, completitud, unicidad, consistencia, puntualidad y exactitud requieren evidencias diferentes. `amount >= 0` comprueba validez, pero no exactitud frente al sistema de pagos. Una expectation fila a fila tampoco demuestra unicidad global sin una transformación o agregación adecuada.",
          "Las reglas evolucionan como código versionado. Un cambio de umbral debe revisar impacto histórico y despliegue; renombrar una expectation rompe series de métricas. Las reglas críticas pueden agruparse con `expect_all_or_fail`, mientras reglas de observación usan `expect_all` para una configuración compartida.",
        ],
        keyPoints: [
          "Cada expresión debe medir la dimensión que afirma medir.",
          "Acción y umbral forman parte del contrato, no son detalles de implementación.",
          "Nombres estables permiten comparar calidad entre versiones y actualizaciones.",
        ],
        example: {
          language: "Python",
          title: "Diccionario versionable de reglas",
          code: `structural_rules = {
    "order_id_present": "order_id IS NOT NULL",
    "event_ts_present": "event_ts IS NOT NULL",
    "amount_non_negative": "amount >= 0",
}

business_observations = {
    "known_currency": "currency IN ('EUR', 'USD', 'GBP')",
    "reasonable_amount": "amount <= 100000",
}`,
          note: "Agrupar expresiones facilita reutilización, pero documenta por separado la acción y el owner de cada conjunto.",
        },
        pitfalls: [
          "Llamar 'exactitud' a una comprobación de formato que no compara con una fuente autoritativa.",
          "Cambiar nombres de reglas en cada release y perder continuidad del indicador.",
        ],
        examDecision: "Antes de elegir expectation, identifica si la regla es fila a fila, agregada o de reconciliación; no toda dimensión cabe en un predicado SQL por registro.",
        checkpoint: {
          question: "¿Puede `amount >= 0` demostrar que el importe cobrado es exacto?",
          answer: "No; demuestra validez de rango. La exactitud requiere comparar con una fuente autoritativa, como el sistema de pagos.",
        },
      },
      {
        summary: "La operación de calidad convierte métricas del event log en tasas, alertas sostenidas y decisiones de detener, degradar o remediar.",
        explanation: [
          "Un conteo absoluto de inválidos confunde crecimiento de volumen con degradación. La tasa `failed / (passed + failed)` por expectation, flow y ventana permite comparar. Para reglas críticas, una sola violación puede fallar; para calidad gradual, un umbral sostenido durante varias actualizaciones evita ruido.",
          "La alerta incluye filas de muestra seguras, enlace al update y owner. Si la tasa aumenta después de un despliegue, se decide rollback; si procede de un productor concreto, se aísla por `source_system`. La remediación se verifica con el mismo indicador hasta cerrar el incidente.",
        ],
        keyPoints: [
          "Normaliza por volumen y conserva numerador/denominador.",
          "Segmenta por fuente o versión para localizar el origen de una regresión.",
          "Una alerta se cierra cuando el indicador y los datos reparados vuelven al objetivo.",
        ],
        example: {
          language: "SQL",
          title: "Tasa de violación por regla",
          code: `SELECT
  window_start,
  flow_name,
  expectation_name,
  failed_records,
  passed_records,
  failed_records / NULLIF(failed_records + passed_records, 0) AS failure_rate
FROM main.ops.pipeline_expectation_metrics
WHERE window_start >= current_timestamp() - INTERVAL 24 HOURS
ORDER BY failure_rate DESC;`,
          note: "Define el umbral y la duración mínima de incumplimiento en el runbook, no dentro de una consulta ad hoc.",
        },
        pitfalls: [
          "Alertar solo por conteo y generar falsos positivos cuando el volumen crece.",
          "Mostrar payload con PII en la notificación en vez de enlazar a una vista restringida.",
        ],
        examDecision: "Para una alerta de calidad operable, usa tasa por regla y ventana, segmentación de origen y owner; una captura manual del UI no es monitorización.",
        checkpoint: {
          question: "¿Por qué es mejor alertar por tasa que solo por número de fallos?",
          answer: "Porque relaciona fallos con volumen total y permite distinguir crecimiento normal de una degradación proporcional real.",
        },
      },
    ],
    lab: {
      title: "Expectations, cuarentena y dashboard de calidad",
      goal: "Implementar acciones de calidad diferenciadas, una cuarentena trazable y una consulta del event log que calcule tasas por regla.",
      scenario: "El pipeline de pedidos recibe nulos, importes negativos y monedas nuevas. Finanzas exige bloquear importes negativos; operaciones quiere aislar IDs ausentes y observar monedas desconocidas sin detener toda la publicación.",
      steps: [
        "Clasifica cada regla como observación, descarte/cuarentena o fallo atómico y documenta el motivo.",
        "Construye una vista clasificada con `failure_reasons` y dos tablas complementarias: válidos y cuarentena.",
        "Aplica expectations con nombres estables a la tabla válida.",
        "Ejecuta datos de prueba para cada regla y confirma la acción esperada.",
        "Consulta el event log, extrae métricas por expectation y calcula tasas por update.",
      ],
      starterCode: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

rules = {
    "valid_order_id": "order_id IS NOT NULL",
    "non_negative_amount": "amount >= 0",
    "known_currency": "currency IN ('EUR', 'USD', 'GBP')",
}

# TODO: clasifica, crea orders_silver y orders_quarantine, y aplica acciones.`,
      solution: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.temporary_view(name="orders_classified")
def orders_classified():
    return (
        spark.readStream.table("orders_bronze")
          .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
          .withColumn(
              "failure_reasons",
              F.array_compact(F.array(
                  F.when(F.col("order_id").isNull(), F.lit("MISSING_ORDER_ID")),
                  F.when(F.col("event_ts").isNull(), F.lit("INVALID_EVENT_TS")),
              ))
          )
    )

@dp.table(name="orders_quarantine", comment="Pedidos reparables rechazados")
def orders_quarantine():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) > 0")
          .withColumn("quarantined_at", F.current_timestamp())
          .withColumn("pipeline_version", F.lit("m19-v1"))
    )

@dp.table(name="orders_silver", comment="Pedidos válidos para consumo")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) = 0")
          .drop("failure_reasons")
    )

# Consulta después de actualizar el pipeline:
# SELECT timestamp, origin.flow_name,
#        details:flow_progress.data_quality:expectations AS expectations
# FROM event_log(TABLE(main.silver.orders_silver))
# WHERE event_type = 'flow_progress';`,
      checks: [
        { label: "Crea una cuarentena explícita", pattern: "orders_quarantine" },
        { label: "Observa una regla sin descartar", pattern: "@dp\\.expect\\(" },
        { label: "Falla ante la regla crítica", pattern: "@dp\\.expect_or_fail" },
        { label: "Incluye consulta del event log", pattern: "event_log\\(TABLE" },
      ],
      expectedEvidence: [
        "Matriz regla → dimensión → acción → owner → procedimiento de remediación.",
        "Filas de cuarentena con `failure_reasons`, procedencia y versión.",
        "Prueba de que una moneda desconocida se publica y mide, mientras un importe negativo falla el flow.",
        "Consulta de event log con métricas por expectation y tasa calculada por update.",
      ],
      cloudNotes: {
        AWS: "Restringe la tabla de cuarentena con Unity Catalog y, si expone muestras mediante alertas en AWS, evita enviar payload sensible a SNS/CloudWatch logs.",
        Azure: "Aplica permisos separados sobre cuarentena y usa Key Vault/managed identity para integraciones de alertas; no copies PII en notificaciones de Azure Monitor.",
        GCP: "Usa service accounts distintas para operación y consumo, limita acceso a cuarentena y envía solo identificadores no sensibles a Cloud Monitoring/Pub/Sub.",
      },
    },
    quiz: [
      {
        question: "Una regla de moneda nueva debe medirse durante dos semanas sin bloquear ni eliminar pedidos. ¿Qué acción corresponde?",
        options: [
          "`expect_or_fail`",
          "`expect`",
          "`expect_or_drop` sin cuarentena",
          "Borrar el event log",
        ],
        answer: 1,
        explanation: "`expect` conserva registros y produce métricas, adecuado para observar impacto antes de endurecer el contrato.",
        domain: "Lakeflow pipelines · expectations",
      },
      {
        question: "Operaciones necesita corregir y reinyectar pedidos sin `order_id`. ¿Qué diseño aporta evidencia suficiente?",
        options: [
          "Una tabla de cuarentena con payload, motivo, procedencia y versión",
          "Un contador de filas descartadas sin datos",
          "`expect_or_drop` y ningún registro adicional",
          "Un screenshot del pipeline una vez al mes",
        ],
        answer: 0,
        explanation: "La remediación requiere conservar la fila y su origen, además de una razón estable que guíe la corrección.",
        domain: "Data quality · cuarentena",
      },
      {
        question: "¿Dónde se encuentran las métricas estructuradas de una expectation durante una actualización?",
        options: [
          "Solo en Spark UI del driver",
          "En el nombre físico del checkpoint",
          "En el pipeline event log, dentro de eventos `flow_progress`",
          "En `VACUUM` history únicamente",
        ],
        answer: 2,
        explanation: "El event log registra progreso y `data_quality` por flow/update y puede consultarse desde SQL.",
        domain: "Lakeflow pipelines · event log",
      },
      {
        question: "Los fallos pasan de 100 a 150, pero el volumen crece de 10.000 a 100.000. ¿Qué indicador evita concluir erróneamente que la calidad empeoró?",
        options: [
          "El número de workers",
          "La versión de Photon",
          "El tamaño de cada archivo",
          "La tasa de fallos sobre registros evaluados",
        ],
        answer: 3,
        explanation: "La tasa cae del 1% al 0,15%; el conteo absoluto por sí solo ocultaría la mejora proporcional.",
        domain: "Data quality · observabilidad",
      },
    ],
    sources: [
      {
        label: "Manage data quality with pipeline expectations · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/expectations",
        reviewedAt,
      },
      {
        label: "Pipeline event log schema · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-log-schema",
        reviewedAt,
      },
      {
        label: "Monitor Lakeflow pipelines event logs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-logs",
        reviewedAt,
      },
    ],
  },

  m20: {
    lessons: [
      {
        summary: "El DAG de Lakeflow Jobs expresa dependencias de ejecución y permite paralelismo solo cuando tareas y datos son realmente independientes.",
        explanation: [
          "Cada task tiene una responsabilidad, parámetros y resultado observable. Dos ingestas regionales pueden ejecutarse en paralelo si escriben particiones o targets independientes; la publicación gold depende de ambas. Introducir dependencias innecesarias alarga el critical path, pero eliminar una dependencia de datos crea carreras.",
          "El DAG no debe ocultar lógica de transformación dentro de docenas de notebooks. Jobs coordina unidades desplegables —pipeline, wheel, SQL o notebook— y las tareas comparten información mediante parámetros, task values o outputs, no variables de memoria del driver.",
        ],
        keyPoints: [
          "Dependencias representan requisitos de datos/estado, no preferencia visual.",
          "Tareas independientes pueden usar compute y retries separados.",
          "El critical path determina la latencia mínima del workflow.",
        ],
        example: {
          language: "YAML",
          title: "Paralelismo y convergencia explícitos",
          code: `tasks:
  - task_key: ingest_eu
    python_wheel_task:
      package_name: commerce
      entry_point: ingest
  - task_key: ingest_us
    python_wheel_task:
      package_name: commerce
      entry_point: ingest
  - task_key: publish_gold
    depends_on:
      - task_key: ingest_eu
      - task_key: ingest_us
    pipeline_task:
      pipeline_id: \${resources.pipelines.orders.id}`,
          note: "En el bundle real usa la sintaxis de sustitución `${resources.pipelines.orders.id}`; aquí se escapa el signo para mantener el ejemplo como texto.",
        },
        pitfalls: [
          "Serializar tareas independientes y aumentar tiempo/coste sin mejorar corrección.",
          "Ejecutar en paralelo tareas que sobrescriben el mismo rango de la tabla.",
        ],
        examDecision: "Añade una dependencia solo si existe una precondición real; para ramas independientes, paraleliza y converge en una tarea downstream.",
        checkpoint: {
          question: "¿Qué determina el critical path de un Job?",
          answer: "La cadena dependiente de mayor duración; acelerar una tarea fuera de esa cadena no reduce necesariamente el tiempo total.",
        },
      },
      {
        summary: "Job parameters, task values y referencias dinámicas trasladan contexto entre tareas sin acoplarlas a estado de notebook.",
        explanation: [
          "Los job parameters describen entradas del run y se propagan a tareas compatibles. Una tarea puede publicar un valor pequeño mediante `dbutils.jobs.taskValues.set`; downstream lo referencia como `{{tasks.<task>.values.<key>}}`. Las referencias se sustituyen como texto, no evalúan expresiones.",
          "Los task values sirven para contadores, rutas o listas pequeñas, no para transportar DataFrames. Los datos voluminosos se materializan en tablas/Volumes y se pasa un identificador. Un nombre mal escrito puede tratarse como literal, así que la validación del bundle y una prueba smoke son esenciales.",
        ],
        keyPoints: [
          "Job parameter identifica el run; task value comunica un resultado pequeño de upstream.",
          "Referencias dinámicas usan doble llave y no ejecutan código.",
          "Datos grandes se comparten mediante almacenamiento gobernado, no mediante valores del DAG.",
        ],
        example: {
          language: "Python",
          title: "Publicación de evidencia para una condición",
          code: `invalid_rows = spark.table("main.ops.validation_results").where(
    "run_id = :run_id AND is_valid = false"
).count()

total_rows = spark.table("main.ops.validation_results").where(
    "run_id = :run_id"
).count()

ratio = invalid_rows / total_rows if total_rows else 1.0
dbutils.jobs.taskValues.set(key="invalid_ratio", value=ratio)`,
          note: "El downstream referencia `{{tasks.validate.values.invalid_ratio}}`; conserva el detalle de filas en una tabla, no en el task value.",
        },
        pitfalls: [
          "Pasar miles de filas como JSON en un task value y alcanzar límites de tamaño.",
          "Usar una referencia dinámica inexistente y no detectar que quedó como texto literal.",
        ],
        examDecision: "Para un escalar calculado por upstream usa task value; para entrada del run usa job parameter; para datasets usa una tabla o Volume.",
        checkpoint: {
          question: "¿Cómo consume downstream el valor `invalid_ratio` publicado por `validate`?",
          answer: "Mediante la referencia dinámica `{{tasks.validate.values.invalid_ratio}}` en un campo o parámetro compatible.",
        },
      },
      {
        summary: "If/else decide por un valor; Run if decide por el estado de tareas upstream y ambos resuelven problemas distintos.",
        explanation: [
          "Una If/else task compara parámetros, valores dinámicos o task values con operadores como `>`, `==` o `!=`. Por ejemplo, publica si `invalid_ratio <= 0.01` y envía a cuarentena en caso contrario. Las tareas de cada rama declaran el outcome requerido.",
          "`Run if` se configura sobre una dependencia para ejecutar limpieza, notificación o recuperación según estados como `ALL_SUCCESS`, `AT_LEAST_ONE_FAILED` o `ALL_DONE`. No se debe codificar un valor de negocio como estado de tarea ni usar If/else para saber si upstream lanzó una excepción.",
        ],
        keyPoints: [
          "If/else evalúa datos o parámetros; Run if evalúa resultado de ejecución.",
          "Una tarea de cleanup suele usar `ALL_DONE` para ejecutarse incluso tras fallos.",
          "Las ramas deben converger con condiciones que acepten outcomes esperados.",
        ],
        example: {
          language: "JSON",
          title: "Condición basada en calidad",
          code: `{
  "task_key": "quality_gate",
  "depends_on": [{"task_key": "validate"}],
  "condition_task": {
    "op": "LESS_THAN_OR_EQUAL",
    "left": "{{tasks.validate.values.invalid_ratio}}",
    "right": "0.01"
  }
}`,
          note: "Las tareas downstream de publicación o cuarentena dependen de `quality_gate` con el outcome true o false correspondiente.",
        },
        pitfalls: [
          "Usar If/else para capturar fallos técnicos cuando `Run if` ya modela estados de upstream.",
          "Olvidar una rama o convergencia y dejar el Job aparentemente correcto pero incompleto.",
        ],
        examDecision: "Valor calculado determina ruta: If/else. Éxito, fallo o finalización upstream determina ruta: Run if.",
        checkpoint: {
          question: "¿Qué condición usarías para liberar un recurso tanto si upstream tuvo éxito como si falló?",
          answer: "Una dependencia con Run if `ALL_DONE`, no una comparación If/else de un task value.",
        },
      },
      {
        summary: "For each ejecuta una tarea anidada por elemento con concurrencia limitada y exige que cada iteración sea aislable e idempotente.",
        explanation: [
          "La lista puede venir de un job parameter, task value o salida SQL y cada elemento se referencia con `{{input...}}`. Procesar regiones o fechas en paralelo reduce latencia, pero la concurrencia debe respetar límites del sistema origen, compute y destino.",
          "Cada iteración escribe una partición o clave independiente. Si todas hacen `overwrite` de la tabla completa, el loop crea carreras. Para miles de elementos, agrupar en rangos o usar una transformación Spark distribuida suele ser mejor que crear miles de task runs.",
        ],
        keyPoints: [
          "For each contiene exactamente una tarea anidada que recibe el elemento actual.",
          "Concurrency limita iteraciones simultáneas y protege dependencias externas.",
          "El cuerpo debe poder reintentarse por elemento sin duplicar efectos.",
        ],
        example: {
          language: "JSON",
          title: "Procesamiento regional acotado",
          code: `{
  "task_key": "process_regions",
  "for_each_task": {
    "inputs": "{{tasks.discover.values.regions}}",
    "concurrency": 4,
    "task": {
      "task_key": "process_region",
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/process_region",
        "base_parameters": {"region": "{{input}}"}
      }
    }
  }
}`,
          note: "`regions` debe ser JSON válido y pequeño; el notebook escribe solo el rango de la región recibida.",
        },
        pitfalls: [
          "Configurar concurrencia igual al número de elementos y saturar la API o base fuente.",
          "Usar For each para millones de filas que Spark puede procesar en un único DataFrame distribuido.",
        ],
        examDecision: "Usa For each para una colección moderada de unidades operativas; usa Spark para paralelismo por filas y limita concurrency según el sistema más restrictivo.",
        checkpoint: {
          question: "¿Qué hace segura una reparación parcial de un For each?",
          answer: "Que cada iteración esté aislada por clave/rango y sea idempotente, de modo que reintentar solo las fallidas no corrompa las exitosas.",
        },
      },
      {
        summary: "Retries corrigen fallos transitorios de una tarea; repair runs reejecutan el subconjunto fallido tras corregir la causa sin repetir trabajo exitoso.",
        explanation: [
          "Una retry policy limita intentos e intervalo y debe reservarse para fallos plausiblemente transitorios. Reintentar una violación de esquema determinista solo consume tiempo. Las tareas con efectos deben ser idempotentes porque tanto retry como repair pueden ejecutarlas de nuevo.",
          "Un repair run mantiene el contexto del run original y permite reejecutar tareas fallidas o omitidas, con parámetros corregidos cuando corresponda. Antes de reparar se inspecciona error, input y versión; después se valida el resultado downstream. Una nueva ejecución completa es preferible si cambió el alcance o no puede garantizarse coherencia con tareas exitosas anteriores.",
        ],
        keyPoints: [
          "Retry es automática y cercana al fallo; repair es una decisión sobre una ejecución existente.",
          "No todos los errores son transitorios ni deben reintentarse.",
          "Idempotencia permite reejecutar una tarea sin duplicar o retroceder estado.",
        ],
        example: {
          language: "YAML",
          title: "Política de retry limitada",
          code: `task_key: ingest_partner_api
max_retries: 3
min_retry_interval_millis: 60000
retry_on_timeout: true
timeout_seconds: 1800
python_wheel_task:
  package_name: commerce
  entry_point: ingest_partner`,
          note: "El código debe escribir con una clave de petición o `MERGE`; tres reintentos de un append no idempotente pueden triplicar datos.",
        },
        pitfalls: [
          "Configurar retries ilimitados para un error de datos permanente y ocultar el incidente.",
          "Reparar downstream con parámetros distintos sin verificar que los outputs upstream exitosos siguen siendo compatibles.",
        ],
        examDecision: "Fallo transitorio: retry acotado. Causa corregida dentro del mismo run: repair. Cambio de alcance o outputs incompatibles: nuevo run controlado.",
        checkpoint: {
          question: "¿Por qué una tarea que soporta retries debe ser idempotente?",
          answer: "Porque puede haber producido parte o todo el efecto antes de fallar y la siguiente ejecución no debe duplicarlo.",
        },
      },
    ],
    lab: {
      title: "Job con quality gate, For each y reparación segura",
      goal: "Diseñar un DAG que descubra regiones, procese cada una con concurrencia limitada, condicione publicación por calidad y permita reparar solo fallos.",
      scenario: "Cada día deben procesarse regiones activas. Una API solo admite cuatro llamadas simultáneas. Si más del 1% de filas es inválido, no se publica gold; limpieza y notificación deben ejecutarse aunque falle una rama.",
      steps: [
        "Define tareas `discover_regions`, `process_regions`, `validate`, `quality_gate`, `publish`, `quarantine` y `cleanup`.",
        "Publica la lista de regiones y la tasa inválida como task values pequeños.",
        "Configura For each con concurrencia cuatro y una tarea idempotente por región.",
        "Usa If/else para el umbral de calidad y Run if para cleanup/notificación.",
        "Inyecta un fallo transitorio en una región, repáralo y demuestra que las exitosas no se duplican.",
      ],
      starterCode: `{
  "name": "regional_orders",
  "tasks": [
    {"task_key": "discover_regions"},
    {"task_key": "process_regions"},
    {"task_key": "validate"},
    {"task_key": "quality_gate"}
  ]
}`,
      solution: `{
  "name": "regional_orders",
  "max_concurrent_runs": 1,
  "parameters": [
    {"name": "process_date", "default": "{{job.start_time.iso_date}}"}
  ],
  "tasks": [
    {
      "task_key": "discover_regions",
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/discover_regions"
      }
    },
    {
      "task_key": "process_regions",
      "depends_on": [{"task_key": "discover_regions"}],
      "for_each_task": {
        "inputs": "{{tasks.discover_regions.values.regions}}",
        "concurrency": 4,
        "task": {
          "task_key": "process_region",
          "max_retries": 2,
          "min_retry_interval_millis": 60000,
          "notebook_task": {
            "notebook_path": "/Workspace/commerce/process_region",
            "base_parameters": {
              "region": "{{input}}",
              "process_date": "{{job.parameters.process_date}}"
            }
          }
        }
      }
    },
    {
      "task_key": "validate",
      "depends_on": [{"task_key": "process_regions"}],
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/validate"
      }
    },
    {
      "task_key": "quality_gate",
      "depends_on": [{"task_key": "validate"}],
      "condition_task": {
        "op": "LESS_THAN_OR_EQUAL",
        "left": "{{tasks.validate.values.invalid_ratio}}",
        "right": "0.01"
      }
    },
    {
      "task_key": "publish",
      "depends_on": [{"task_key": "quality_gate", "outcome": "true"}],
      "notebook_task": {"notebook_path": "/Workspace/commerce/publish"}
    },
    {
      "task_key": "quarantine",
      "depends_on": [{"task_key": "quality_gate", "outcome": "false"}],
      "notebook_task": {"notebook_path": "/Workspace/commerce/quarantine"}
    },
    {
      "task_key": "cleanup",
      "depends_on": [
        {"task_key": "publish"},
        {"task_key": "quarantine"}
      ],
      "run_if": "ALL_DONE",
      "notebook_task": {"notebook_path": "/Workspace/commerce/cleanup"}
    }
  ]
}`,
      checks: [
        { label: "Incluye un For each", pattern: "for_each_task" },
        { label: "Limita concurrencia a cuatro", pattern: "\"concurrency\"\\s*:\\s*4" },
        { label: "Usa una If/else task", pattern: "condition_task" },
        { label: "Ejecuta cleanup tras cualquier resultado", pattern: "\"run_if\"\\s*:\\s*\"ALL_DONE\"" },
      ],
      expectedEvidence: [
        "Diagrama del DAG con ramas true/false y convergencia de cleanup.",
        "Task values publicados y referencia dinámica resuelta en el run.",
        "Máximo de cuatro iteraciones regionales simultáneas observado.",
        "Repair run que reejecuta la región fallida sin cambiar conteos de regiones exitosas.",
      ],
      cloudNotes: {
        AWS: "Si cada iteración llama una API o RDS en AWS, limita concurrency según quotas y conexiones; usa IAM roles/Secrets Manager mediante integración aprobada, no credenciales en parámetros.",
        Azure: "Alinea concurrency con límites de Azure SQL/API Management y usa managed identity/Key Vault; registra throttling 429 como fallo transitorio con backoff.",
        GCP: "Respeta quotas de Cloud SQL o APIs, usa service accounts y Secret Manager; configura retry solo para códigos transitorios y conserva claves idempotentes.",
      },
    },
    quiz: [
      {
        question: "Una tarea de limpieza debe ejecutarse incluso si cualquiera de dos ramas falla. ¿Qué condición corresponde?",
        options: [
          "If/else sobre el número de filas",
          "Run if `ALL_DONE`",
          "Run if `ALL_SUCCESS`",
          "Un trigger continuo independiente",
        ],
        answer: 1,
        explanation: "`ALL_DONE` evalúa estados upstream y permite cleanup después de éxito o fallo.",
        domain: "Lakeflow Jobs · control flow",
      },
      {
        question: "Una API admite como máximo cuatro peticiones simultáneas y hay 30 regiones. ¿Qué diseño es adecuado?",
        options: [
          "Un For each con concurrency 4 y cuerpo idempotente",
          "Treinta Jobs sin límite de concurrencia",
          "Un loop Python en el driver sin tareas",
          "Un `maxOffsetsPerTrigger` Kafka",
        ],
        answer: 0,
        explanation: "For each modela unidades operativas y su concurrency protege el límite externo.",
        domain: "Lakeflow Jobs · For each",
      },
      {
        question: "La tasa inválida calculada por `validate` decide si publicar. ¿Cómo se transmite mejor?",
        options: [
          "Copiando el DataFrame completo en un widget",
          "Con una variable global del notebook upstream",
          "Escribiéndola en el nombre del cluster",
          "Como task value referenciado por la If/else task",
        ],
        answer: 3,
        explanation: "Es un escalar pequeño producido por upstream, caso natural para `taskValues` y referencia dinámica.",
        domain: "Lakeflow Jobs · parámetros y task values",
      },
      {
        question: "Una tarea falló por timeout después de que las demás regiones terminaran. Se corrige la cuota y se quiere conservar el run. ¿Qué acción minimiza repetición?",
        options: [
          "Borrar todas las tablas y lanzar un Job distinto",
          "Aumentar retries infinitamente",
          "Reparar el run reejecutando el subconjunto fallido, verificando idempotencia",
          "Marcar manualmente la tarea como success",
        ],
        answer: 2,
        explanation: "Un repair run conserva contexto y reejecuta tareas fallidas/omitidas; la idempotencia protege frente a efectos parciales.",
        domain: "Lakeflow Jobs · repairs",
      },
    ],
    sources: [
      {
        label: "Control the flow of tasks within Lakeflow Jobs · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/control-flow",
        reviewedAt,
      },
      {
        label: "Dynamic value references · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/dynamic-value-references",
        reviewedAt,
      },
      {
        label: "Troubleshoot and repair job failures · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/repair-job-failures",
        reviewedAt,
      },
    ],
  },

  m21: {
    lessons: [
      {
        summary: "Un trigger se elige por la señal real de disponibilidad: calendario para obligaciones temporales, evento para llegadas irregulares y ejecución continua para servicios siempre activos.",
        explanation: [
          "Un schedule es apropiado cuando el negocio define un corte, por ejemplo cerrar ventas a las 06:00 Europe/Madrid aunque no haya archivos. La zona horaria debe ser explícita y los cambios DST pueden producir intervalos irregulares; UTC simplifica cadencia técnica, pero quizá no coincide con el día de negocio.",
          "Un trigger por archivo o tabla evita polling y runs vacíos cuando la llegada es irregular. Sin embargo, un evento indica que hubo un cambio, no que un lote multiarchivo esté completo. El pipeline conserva idempotencia y consulta su propia frontera de datos en vez de asumir que cada trigger corresponde a un único lote.",
        ],
        keyPoints: [
          "Schedule expresa tiempo; file/table update expresa disponibilidad observada.",
          "Zona horaria y DST forman parte del contrato de un calendario.",
          "Todo trigger puede coalescer o repetir señales; la tarea sigue siendo idempotente.",
        ],
        example: {
          language: "YAML",
          title: "Schedule con zona y pausa inicial",
          code: `schedule:
  quartz_cron_expression: "0 0 6 * * ?"
  timezone_id: "Europe/Madrid"
  pause_status: "PAUSED"`,
          note: "Despliega el trigger pausado en producción, valida parámetros y permisos, y actívalo mediante el proceso de cambio aprobado.",
        },
        pitfalls: [
          "Usar la zona local por defecto y descubrir que el Job cambia de hora alrededor de DST.",
          "Programar cada minuto una fuente que entrega un lote diario y generar 1.439 ejecuciones vacías.",
        ],
        examDecision: "Obligación a una hora: schedule. Llegada irregular gobernada: file/table trigger. Servicio que debe reiniciar al acabar o fallar: continuous, evaluando coste y semántica.",
        checkpoint: {
          question: "¿Por qué UTC no siempre puede sustituir la zona de negocio en un cierre diario?",
          answer: "Porque el día local puede cambiar de offset con DST y el requisito suele referirse a una hora/calendario local, no a una hora UTC fija.",
        },
      },
      {
        summary: "File arrival monitoriza una external location o Volume de Unity Catalog y usa cooldown/debounce para convertir múltiples archivos en runs controlados.",
        explanation: [
          "El trigger observa una raíz o subruta y comprueba recursivamente nuevas llegadas. Con managed file events en la external location, Databricks aprovecha notificaciones del proveedor y reduce listing. El Job necesita permisos de lectura sobre la ubicación y administración del Job.",
          "`wait_after_last_change_seconds` implementa debounce: espera un periodo sin cambios para agrupar un lote. `min_time_between_triggers_seconds` limita frecuencia. Ninguno garantiza completitud absoluta; productores serios publican un manifiesto o marcador y el código valida conteos antes de promover.",
        ],
        keyPoints: [
          "La ruta debe estar gobernada por Unity Catalog como external location o Volume.",
          "Debounce agrupa ráfagas; cooldown limita runs consecutivos.",
          "File events mejoran descubrimiento, pero la idempotencia sigue residiendo en el pipeline.",
        ],
        example: {
          language: "JSON",
          title: "Trigger de llegada con debounce",
          code: `{
  "trigger": {
    "file_arrival": {
      "url": "/Volumes/main/landing/orders/",
      "min_time_between_triggers_seconds": 900,
      "wait_after_last_change_seconds": 60
    }
  }
}`,
          note: "El ejemplo espera 60 segundos de calma y no crea runs con menos de 15 minutos de separación.",
        },
        pitfalls: [
          "Apuntar a una ruta no gobernada o sin permisos y asumir que el trigger hereda credenciales del notebook.",
          "Tratar el primer archivo como prueba de lote completo cuando el productor publica decenas durante varios minutos.",
        ],
        examDecision: "Para archivos irregulares en UC usa file arrival; configura debounce según patrón de lote y verifica completitud mediante manifiesto si el origen lo ofrece.",
        checkpoint: {
          question: "¿Qué diferencia hay entre cooldown y debounce?",
          answer: "Cooldown limita la frecuencia máxima de runs; debounce espera silencio tras el último cambio para agrupar una ráfaga antes de iniciar.",
        },
      },
      {
        summary: "Table update inicia un Job cuando cambian tablas Unity Catalog y entrega la lista actualizada como referencia dinámica para procesamiento selectivo.",
        explanation: [
          "Es útil cuando una publicación Delta upstream es la señal autoritativa y no interesa observar archivos físicos. El trigger puede monitorizar una o varias tablas y el downstream consulta `{{job.trigger.table_update.updated_tables}}` para saber cuáles cambiaron desde el run anterior.",
          "La señal no debe convertirse en lógica frágil por tabla sin fallback. Un Job puede recibir varias actualizaciones coalescidas y debe leer el estado confirmado de cada tabla. Si se requiere orden transaccional entre varias tablas, un trigger separado no crea esa transacción; se necesita un marcador de publicación o una capa coordinadora.",
        ],
        keyPoints: [
          "Table update reacciona al objeto gobernado, no a su implementación de archivos.",
          "La lista de tablas actualizadas está disponible mediante dynamic value reference.",
          "Una notificación puede representar varios cambios y no sustituye un contrato de consistencia multitabla.",
        ],
        example: {
          language: "JSON",
          title: "Paso de tablas actualizadas a una tarea",
          code: `{
  "task_key": "refresh_consumers",
  "notebook_task": {
    "notebook_path": "/Workspace/commerce/refresh_consumers",
    "base_parameters": {
      "updated_tables": "{{job.trigger.table_update.updated_tables}}",
      "trigger_type": "{{job.trigger.type}}"
    }
  }
}`,
          note: "El notebook debe validar el JSON y ser capaz de actualizar todas las tablas relevantes aunque varias aparezcan en el mismo run.",
        },
        pitfalls: [
          "Monitorizar archivos de una tabla Delta y disparar antes de que el commit sea visible.",
          "Suponer que una señal por cada tabla ofrece una snapshot consistente entre varias tablas relacionadas.",
        ],
        examDecision: "Si el consumidor depende de commits de tablas UC, usa table update; si depende de archivos de landing aún no convertidos en tabla, usa file arrival.",
        checkpoint: {
          question: "¿Qué ventaja tiene table update sobre observar archivos internos Delta?",
          answer: "Reacciona al commit gobernado de la tabla y evita depender de detalles físicos que pueden cambiar o aparecer antes de una publicación consistente.",
        },
      },
      {
        summary: "Concurrencia, queueing, timeouts y notificaciones determinan cómo responde el Job cuando llegan triggers más rápido de lo que termina el trabajo.",
        explanation: [
          "Por defecto, un Job suele admitir un run activo. Aumentar `max_concurrent_runs` puede reducir espera, pero solo si runs simultáneos escriben rangos aislados. Si no, aparecen carreras y sobrecarga. Queueing conserva runs cuando no hay capacidad; omitirlo o superar límites puede producir skips.",
          "Continuous inicia otro run al completar o fallar el anterior y aplica reintentos/backoff propios. Es adecuado para servicios siempre activos, no para un batch que espera datos. Las notificaciones se configuran para fallo, duración o atraso y deben incluir owner y contexto sin secretos.",
        ],
        keyPoints: [
          "Más concurrencia solo es segura con entradas y efectos aislables.",
          "Queueing gestiona presión del planificador; no corrige un Job más lento que la llegada indefinidamente.",
          "Timeout y alertas delimitan fallos colgados y protegen el SLO.",
        ],
        example: {
          language: "YAML",
          title: "Guardrails de ejecución",
          code: `max_concurrent_runs: 1
queue:
  enabled: true
timeout_seconds: 7200
email_notifications:
  on_failure:
    - data-platform-oncall@example.invalid
  on_duration_warning_threshold_exceeded:
    - data-platform-oncall@example.invalid`,
          note: "La dirección `.invalid` es deliberadamente ficticia; reemplázala por un destino gestionado del entorno.",
        },
        pitfalls: [
          "Aumentar concurrencia para reducir cola mientras todos los runs sobrescriben la misma partición.",
          "Usar continuous para una fuente ociosa y pagar reinicios/compute sin mejorar frescura.",
        ],
        examDecision: "Si se acumulan triggers, primero mide duración y aislamiento. Usa queueing para picos; aumenta concurrencia solo si las escrituras son independientes.",
        checkpoint: {
          question: "¿Cuándo es seguro permitir varios runs concurrentes del mismo Job?",
          answer: "Cuando cada run procesa rangos/targets independientes o las escrituras son transaccionales e idempotentes bajo concurrencia demostrada.",
        },
      },
      {
        summary: "Un backfill reutiliza el mismo Job parametrizado que producción para ejecutar intervalos históricos, con concurrencia y publicación controladas.",
        explanation: [
          "Lakeflow Jobs puede generar múltiples runs para un rango e intervalo y pasar parámetros de backfill. El código usa `process_date` o límites temporales explícitos y escribe idempotentemente la partición correspondiente. Mantener una ruta de código distinta para históricos provoca divergencia justo cuando más se necesita fiabilidad.",
          "Antes de lanzar noventa días se calcula número de runs, volumen, coste, capacidad de origen y colisión con producción. Puede reducirse concurrency, escribir en una tabla sombra y promover por lotes. La validación compara conteos y totales por día, y el rollback conoce exactamente qué particiones tocó.",
        ],
        keyPoints: [
          "Backfill y ejecución ordinaria comparten artefacto y contrato.",
          "Parámetros temporales deben ser explícitos y usar límites no solapados.",
          "Coste, concurrencia y reconciliación se estiman antes de crear cientos de runs.",
        ],
        example: {
          language: "SQL",
          title: "Transformación idempotente por fecha",
          code: `MERGE INTO main.silver.orders_daily AS target
USING (
  SELECT *
  FROM main.bronze.orders
  WHERE event_date = :process_date
) AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;`,
          note: "El parámetro del run delimita el rango, mientras `MERGE` permite reintentar el mismo día sin duplicar claves.",
        },
        pitfalls: [
          "Crear un notebook especial para backfill que ya no comparte validaciones ni lógica de producción.",
          "Lanzar todos los días con máxima concurrencia y degradar el workload diario o la fuente.",
        ],
        examDecision: "Para reparar historia, usa backfill del mismo Job con parámetros y escrituras idempotentes; no copies código ni ejecutes un overwrite global.",
        checkpoint: {
          question: "¿Qué evita que reintentar un día de backfill duplique filas?",
          answer: "Una frontera temporal no solapada y una escritura idempotente, por ejemplo `MERGE` por la clave de negocio.",
        },
      },
    ],
    lab: {
      title: "Trigger por archivos y backfill de 90 días",
      goal: "Configurar una operación que agrupe llegadas irregulares, evite runs superpuestos y reutilice el mismo Job para un backfill idempotente.",
      scenario: "Un proveedor entrega entre 10 y 80 archivos por lote, sin horario fijo y durante ráfagas de hasta 45 segundos. Faltan además 90 días históricos y el sistema fuente admite como máximo cuatro lecturas simultáneas.",
      steps: [
        "Configura file arrival sobre un Volume con debounce de 60 s y cooldown de 15 min.",
        "Mantén `max_concurrent_runs=1` para producción y pasa la ubicación disparadora como parámetro observable.",
        "Implementa `process_date` opcional y un `MERGE` idempotente por pedido.",
        "Calcula el plan de backfill de 90 días con concurrency máxima cuatro y coste estimado.",
        "Ejecuta dos días de prueba, repara uno y reconcilia conteo/importe antes de ampliar el rango.",
      ],
      starterCode: `# Configuración conceptual del Job
job = {
    "name": "partner_orders",
    "max_concurrent_runs": 1,
    "parameters": [{"name": "process_date", "default": ""}],
    # TODO: file_arrival con debounce y cooldown
}

# TODO en la tarea: limitar lectura por process_date y hacer MERGE idempotente.`,
      solution: `# Jobs API / bundle fragment
job = {
    "name": "partner_orders",
    "max_concurrent_runs": 1,
    "queue": {"enabled": True},
    "parameters": [
        {"name": "process_date", "default": ""},
        {"name": "trigger_location", "default": "{{job.trigger.file_arrival.location}}"},
    ],
    "trigger": {
        "file_arrival": {
            "url": "/Volumes/main/landing/partner_orders/",
            "min_time_between_triggers_seconds": 900,
            "wait_after_last_change_seconds": 60,
        }
    },
    "tasks": [{
        "task_key": "process_orders",
        "max_retries": 2,
        "min_retry_interval_millis": 60000,
        "notebook_task": {
            "notebook_path": "/Workspace/commerce/process_partner_orders",
            "base_parameters": {
                "process_date": "{{job.parameters.process_date}}",
                "trigger_location": "{{job.parameters.trigger_location}}",
            },
        },
    }],
}

# Lógica SQL parametrizada de la tarea:
# MERGE INTO main.silver.partner_orders AS t
# USING (
#   SELECT * FROM main.bronze.partner_orders
#   WHERE (:process_date = '' OR event_date = CAST(:process_date AS DATE))
# ) AS s
# ON t.order_id = s.order_id
# WHEN MATCHED THEN UPDATE SET *
# WHEN NOT MATCHED THEN INSERT *;

backfill_plan = {
    "start_date": "2026-04-22",
    "end_date": "2026-07-20",
    "interval": "1 day",
    "max_concurrent_runs": 4,
    "parameter": "process_date",
}
print({"job": job, "backfill": backfill_plan})`,
      checks: [
        { label: "Configura file arrival", pattern: "file_arrival" },
        { label: "Incluye debounce de 60 segundos", pattern: "wait_after_last_change_seconds[\"']?\\s*:\\s*60" },
        { label: "Incluye cooldown de 900 segundos", pattern: "min_time_between_triggers_seconds[\"']?\\s*:\\s*900" },
        { label: "Define backfill diario y concurrencia cuatro", pattern: "backfill_plan[\\s\\S]*max_concurrent_runs[\"']?\\s*:\\s*4" },
      ],
      expectedEvidence: [
        "Prueba de que una ráfaga de archivos produce un solo run después del debounce.",
        "Dos ejecuciones del mismo `process_date` con el mismo conteo y sin claves duplicadas.",
        "Plan de 90 runs con concurrency ≤ 4, coste y ventana de ejecución estimados.",
        "Reconciliación por fecha de filas e importe contra el manifiesto del proveedor.",
      ],
      cloudNotes: {
        AWS: "Habilita managed file events en la external location de S3 cuando corresponda y configura el IAM role para eventos/listing; considera costes y límites del proveedor.",
        Azure: "Usa external location/Volume en ADLS Gen2 con file events y managed identity; valida la configuración administrada de eventos disponible.",
        GCP: "Usa GCS mediante external location y managed file events cuando estén soportados; concede a la service account permisos mínimos para objetos y notificaciones.",
      },
    },
    quiz: [
      {
        question: "Los archivos de un lote llegan durante 45 segundos y no debe iniciarse el Job a mitad. ¿Qué opción aborda ese requisito?",
        options: [
          "`wait_after_last_change_seconds` superior a la separación interna del lote",
          "`max_concurrent_runs=20`",
          "Un schedule cada segundo",
          "Borrar archivos tras el primero",
        ],
        answer: 0,
        explanation: "El debounce reinicia la espera con cada llegada y lanza el run cuando transcurre un periodo de calma.",
        domain: "Lakeflow Jobs · file arrival",
      },
      {
        question: "Un consumidor depende de un commit en una tabla Unity Catalog, no de los archivos físicos. ¿Qué trigger es más directo?",
        options: ["Continuous sin fuente", "Schedule anual", "Table update", "File arrival sobre `_delta_log`"],
        answer: 2,
        explanation: "Table update observa la actualización gobernada de la tabla y evita depender de archivos internos Delta.",
        domain: "Lakeflow Jobs · table update",
      },
      {
        question: "Se necesitan reprocesar 90 días con la misma lógica diaria. ¿Qué enfoque reduce divergencia?",
        options: [
          "Copiar el notebook y eliminar validaciones para acelerar",
          "Usar backfill del mismo Job parametrizado por fecha y escritura idempotente",
          "Sobrescribir toda la tabla con cada día",
          "Crear 90 Jobs permanentes distintos",
        ],
        answer: 1,
        explanation: "El backfill reutiliza la automatización productiva y genera runs por intervalo con parámetros controlados.",
        domain: "Lakeflow Jobs · backfills",
      },
      {
        question: "Runs tardan 40 minutos y llegan triggers cada 10. Todos sobrescriben la misma partición. ¿Qué cambio es inseguro?",
        options: [
          "Medir y reducir la duración del critical path",
          "Aplicar queueing para un pico acotado",
          "Cambiar la escritura a una frontera idempotente por fecha",
          "Aumentar concurrencia sin aislar las escrituras",
        ],
        answer: 3,
        explanation: "Runs concurrentes que mutan el mismo rango crean carreras; primero se necesita aislamiento o una operación transaccional demostrada.",
        domain: "Lakeflow Jobs · concurrencia",
      },
    ],
    sources: [
      {
        label: "Automate jobs with schedules and triggers · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/triggers",
        reviewedAt,
      },
      {
        label: "Trigger jobs when new files arrive · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/file-arrival-triggers",
        reviewedAt,
      },
      {
        label: "Backfill jobs · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/backfill-jobs",
        reviewedAt,
      },
    ],
  },

  m22: {
    lessons: [
      {
        summary: "El proyecto de producción parte de contratos y NFR: fuentes, claves, latencia, calidad, seguridad, recuperación y consumidores antes de elegir objetos del pipeline.",
        explanation: [
          "Pedidos append y clientes CDC tienen naturalezas distintas: los primeros encajan en streaming tables; los segundos en AUTO CDC. Gold necesita métricas consistentes con updates de ambas fuentes y puede ser una materialized view. El diseño identifica owners y fronteras bronze/silver/gold con nombres gobernados.",
          "Los NFR se convierten en decisiones comprobables: p95 de frescura, umbral de errores, RTO, retención y presupuesto. Un diagrama sin criterios de aceptación no permite saber si el pipeline está terminado ni qué hacer ante un fallo.",
        ],
        keyPoints: [
          "Cada fuente declara semántica append, CDC o snapshot.",
          "Cada target declara clave, consumidor, SLO y estrategia de rebuild.",
          "Dependencias externas, clasificación de datos y PII se identifican antes de desplegar.",
        ],
        example: {
          language: "YAML",
          title: "Contrato mínimo del proyecto",
          code: `domain: commerce
sources:
  orders:
    semantics: append
    key: order_id
    freshness_p95_minutes: 10
  customers:
    semantics: cdc
    key: customer_id
    sequence: source_lsn
targets:
  silver_orders: main.silver.orders
  current_customers: main.silver.customers_current
  daily_sales: main.gold.daily_customer_sales
rto_minutes: 60
owner: commerce-data`,
          note: "Añade consumidores, clasificación, reconciliaciones y consultas de evidencia concretas en la entrega final.",
        },
        pitfalls: [
          "Elegir todos los targets como streaming tables sin considerar updates y resultado completo.",
          "Diseñar la capa gold antes de acordar claves y semántica de las fuentes.",
        ],
        examDecision: "Mapea semántica de fuente a objeto: append incremental → streaming table; CDC → AUTO CDC; resultado materializado con updates → materialized view.",
        checkpoint: {
          question: "¿Qué dato del feed de clientes es imprescindible además de `customer_id`?",
          answer: "Una secuencia autoritativa por clave y semántica explícita de operación/delete para resolver cambios fuera de orden.",
        },
      },
      {
        summary: "La implementación combina append de pedidos y AUTO CDC de clientes sin mezclar estados ni presentar el nombre anterior APPLY CHANGES como API nueva.",
        explanation: [
          "Pedidos se ingieren en bronze y se validan en silver con lectura streaming. Clientes llegan como operaciones con `source_lsn`; AUTO CDC materializa el estado actual SCD 1 o el historial SCD 2. La streaming table target se declara antes del flow y las columnas operativas se excluyen.",
          "Gold une pedidos con clientes según la necesidad temporal. Si se necesita el cliente actual, SCD 1 basta; si la segmentación al momento del pedido importa, se usa SCD 2 y un join por intervalo. Esa decisión cambia corrección, coste y complejidad.",
        ],
        keyPoints: [
          "AUTO CDC es la API actual; APPLY CHANGES es la denominación anterior.",
          "Append y CDC usan flows/targets diferentes y convergen en consumo.",
          "El join dimensional se alinea con SCD 1 actual o SCD 2 point-in-time según requisito.",
        ],
        example: {
          language: "SQL",
          title: "Clientes actuales con AUTO CDC",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_current_cdc AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY source_lsn
COLUMNS * EXCEPT (operation)
STORED AS SCD TYPE 1;`,
          note: "Valida que `source_lsn` sea monotónico por clave y que su tipo tenga un orden total estable.",
        },
        pitfalls: [
          "Hacer append de updates CDC y dejar múltiples estados vigentes por cliente.",
          "Elegir SCD 1 cuando reporting necesita la dimensión histórica al momento del pedido.",
        ],
        examDecision: "Estado actual: AUTO CDC SCD 1. Historia point-in-time: SCD 2. Evita un MERGE manual si el pipeline ofrece AUTO CDC para ese feed.",
        checkpoint: {
          question: "¿Qué resuelve AUTO CDC frente a un append simple del feed?",
          answer: "Ordena por secuencia, deduplica cambios, interpreta deletes y materializa SCD 1 o 2 por clave.",
        },
      },
      {
        summary: "Calidad se diseña como rutas: observación para señales, cuarentena para filas reparables y fallo para invariantes que invalidan el target.",
        explanation: [
          "Pedidos sin ID van a cuarentena con archivo y motivo. Monedas desconocidas pueden observarse mientras negocio decide. Un importe negativo en una tabla financiera puede fallar la actualización. La clasificación compartida evita que una fila desaparezca entre filtros inconsistentes.",
          "El event log alimenta un dashboard por update y flow. La aceptación incluye casos para cada acción, una tasa máxima y un procedimiento de reentrada. Proteger la cuarentena con permisos más estrictos evita convertir observabilidad en fuga de PII.",
        ],
        keyPoints: [
          "Regla, acción y remediación se prueban conjuntamente.",
          "Cuarentena es un producto operado con retención y acceso, no un vertedero permanente.",
          "Event log ofrece métricas; reconciliación externa valida completitud y exactitud.",
        ],
        example: {
          language: "PySpark",
          title: "Contrato crítico en silver",
          code: `@dp.table(name="orders_silver")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) = 0")
          .drop("failure_reasons")
    )`,
          note: "La rama `orders_quarantine` materializa las filas donde `failure_reasons` no está vacía.",
        },
        pitfalls: [
          "Aplicar `expect_or_drop` y afirmar que existe cuarentena aunque no se conserve la fila.",
          "Fallar por una regla reparable de baja severidad y consumir innecesariamente el SLO de frescura.",
        ],
        examDecision: "Si se necesita remediación, materializa cuarentena; si el target completo sería inválido, falla el flow; si solo se mide, observa.",
        checkpoint: {
          question: "¿Qué evidencia demuestra que una regla de cuarentena funciona?",
          answer: "La fila inválida aparece con motivo y procedencia, no llega a silver y puede corregirse/reinyectarse sin duplicar.",
        },
      },
      {
        summary: "Lakeflow Jobs envuelve el pipeline para parametrizar entorno, ejecutar validaciones, condicionar publicación y manejar alertas o backfills.",
        explanation: [
          "Una pipeline task actualiza datasets declarativos. Una tarea posterior consulta event log y reconciliación; una If/else bloquea publicación si se supera el umbral. Cleanup y notificación usan Run if. El mismo bundle define recursos para dev, test y prod con identidades y catálogos diferentes.",
          "La promoción no consiste en copiar notebooks. Se valida el bundle, se despliega el mismo artefacto, se ejecuta un smoke test y se compara lineage/esquema. Producción se activa con trigger pausado inicialmente y rollback conocido.",
        ],
        keyPoints: [
          "Pipelines transforma; Jobs coordina control flow y efectos operativos.",
          "El mismo artefacto se parametriza por target y se ejecuta con service principal.",
          "Quality gate usa métricas persistidas y bloquea solo publicación downstream.",
        ],
        example: {
          language: "YAML",
          title: "DAG de actualización y validación",
          code: `tasks:
  - task_key: update_pipeline
    pipeline_task:
      pipeline_id: orders_pipeline
  - task_key: validate_update
    depends_on:
      - task_key: update_pipeline
    notebook_task:
      notebook_path: /Workspace/commerce/validate_update
  - task_key: quality_gate
    depends_on:
      - task_key: validate_update
    condition_task:
      left: "{{tasks.validate_update.values.failure_rate}}"
      op: LESS_THAN_OR_EQUAL
      right: "0.01"`,
          note: "En un bundle real `pipeline_id` referencia el recurso desplegado; evita IDs fijos entre entornos.",
        },
        pitfalls: [
          "Meter notificaciones y llamadas externas dentro de una función declarativa del pipeline.",
          "Desplegar prod con identidad personal y rutas hardcoded de dev.",
        ],
        examDecision: "Control de datos declarativo pertenece al pipeline; branching, alertas, aprobaciones y promoción pertenecen al Job y bundle.",
        checkpoint: {
          question: "¿Por qué separar `validate_update` del pipeline task?",
          answer: "Permite usar métricas como quality gate, reparar/alertar con control flow y mantener efectos operativos fuera de las definiciones declarativas.",
        },
      },
      {
        summary: "La preparación productiva se demuestra con replay, backfill, fallo de calidad, métricas, coste y un runbook ejecutado, no solo con un update exitoso.",
        explanation: [
          "El equipo prueba una segunda ejecución sin datos, un update CDC fuera de orden, una fila en cuarentena y una caída recuperable. Un backfill de una fecha usa el mismo pipeline/Job y se reconcilia. El event log debe explicar qué flows procesaron filas y qué expectations fallaron.",
          "El runbook identifica owner, SLO, paneles, decisiones de retry, repair o full refresh y rutas de rollback. La entrega incluye consultas de evidencia y límites conocidos. Una demo feliz sin incidente ni recuperación no valida producción.",
        ],
        keyPoints: [
          "Idempotencia se prueba ejecutando dos veces el mismo input.",
          "Recuperación se prueba con fallo y checkpoint/estado realista.",
          "Aceptación incluye calidad, observabilidad, seguridad y coste además del resultado funcional.",
        ],
        example: {
          language: "YAML",
          title: "Checklist de aceptación operativa",
          code: `acceptance:
  - second_run_adds_zero_duplicates
  - out_of_order_cdc_keeps_highest_sequence
  - invalid_order_is_quarantined_with_reason
  - expectation_metrics_visible_in_event_log
  - one_day_backfill_reconciles_to_manifest
  - repair_run_preserves_successful_outputs
  - rto_under_60_minutes
  - service_principal_has_least_privilege`,
          note: "Cada elemento enlaza a una consulta, run o captura reproducible, no a una marca manual sin evidencia.",
        },
        pitfalls: [
          "Aceptar el proyecto porque las tablas existen aunque no haya pruebas de reintento o recuperación.",
          "Realizar full refresh por defecto sin estimar coste, disponibilidad ni efecto en consumers.",
        ],
        examDecision: "Antes de declarar production-ready, exige evidencia de idempotencia, observabilidad, reparación y NFR; un pipeline verde una vez no basta.",
        checkpoint: {
          question: "¿Qué prueba distingue idempotencia de una ejecución simplemente exitosa?",
          answer: "Repetir exactamente el mismo input y demostrar que estado final y conteos no cambian ni duplican efectos.",
        },
      },
    ],
    lab: {
      title: "Proyecto de pipeline declarativo de producción",
      goal: "Entregar pedidos append y clientes AUTO CDC con calidad, cuarentena, gold materializado, quality gate y evidencias de operación.",
      scenario: "Comercio quiere publicar ventas diarias enriquecidas con clientes. Pedidos llegan por archivos; clientes por CDC fuera de orden. Un ID ausente se repara, un importe negativo bloquea publicación y el proyecto debe soportar backfill diario.",
      steps: [
        "Declara contratos, SLO, claves y secuencias para pedidos y clientes.",
        "Implementa bronze/silver de pedidos con clasificación, cuarentena y expectations.",
        "Materializa clientes actuales mediante AUTO CDC SCD 1 y deletes explícitos.",
        "Crea una materialized view gold de ventas por día y segmento.",
        "Consulta event log y publica `failure_rate` para un quality gate de Jobs.",
        "Ejecuta casos de idempotencia, CDC fuera de orden, repair y backfill de un día.",
      ],
      starterCode: `-- Pipeline SQL
CREATE OR REFRESH STREAMING TABLE main.bronze.orders;
CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

-- TODO: orders_silver con constraints
-- TODO: orders_quarantine
-- TODO: FLOW AUTO CDC de clientes
-- TODO: MATERIALIZED VIEW daily_customer_sales
-- TODO: consulta event_log para quality gate`,
      solution: `-- Pedidos válidos; bronze ya se alimenta mediante Auto Loader.
CREATE OR REFRESH STREAMING TABLE main.silver.orders_silver (
  CONSTRAINT valid_order_id EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT non_negative_amount EXPECT (amount >= 0) ON VIOLATION FAIL UPDATE,
  CONSTRAINT known_currency EXPECT (currency IN ('EUR', 'USD', 'GBP'))
)
AS SELECT
  order_id,
  customer_id,
  CAST(event_ts AS TIMESTAMP) AS event_ts,
  CAST(amount AS DECIMAL(18,2)) AS amount,
  currency,
  source_file,
  ingested_at
FROM STREAM(main.bronze.orders)
WHERE event_ts IS NOT NULL;

-- Cuarentena explícita para filas reparables.
CREATE OR REFRESH STREAMING TABLE main.ops.orders_quarantine
AS SELECT
  *,
  CASE
    WHEN order_id IS NULL THEN 'MISSING_ORDER_ID'
    WHEN event_ts IS NULL THEN 'INVALID_EVENT_TS'
    ELSE 'UNKNOWN'
  END AS failure_reason,
  current_timestamp() AS quarantined_at
FROM STREAM(main.bronze.orders)
WHERE order_id IS NULL OR event_ts IS NULL;

-- API actual: AUTO CDC; APPLY CHANGES es el nombre anterior.
CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_current_cdc AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(source_lsn, event_ts)
COLUMNS * EXCEPT (operation, ingested_at)
STORED AS SCD TYPE 1;

-- Capa de consumo materializada.
CREATE OR REFRESH MATERIALIZED VIEW main.gold.daily_customer_sales
AS SELECT
  CAST(o.event_ts AS DATE) AS order_date,
  c.segment,
  count(DISTINCT o.order_id) AS orders,
  sum(o.amount) AS revenue
FROM main.silver.orders_silver o
LEFT JOIN main.silver.customers_current c
  ON o.customer_id = c.customer_id
GROUP BY CAST(o.event_ts AS DATE), c.segment;

-- Evidencia para quality gate de Lakeflow Jobs.
SELECT
  timestamp,
  origin.update_id AS update_id,
  origin.flow_name AS flow_name,
  details:flow_progress.data_quality:expectations AS expectations
FROM event_log(TABLE(main.silver.orders_silver))
WHERE event_type = 'flow_progress'
ORDER BY timestamp DESC;`,
      checks: [
        { label: "Usa expectations con acciones distintas", pattern: "EXPECT[\\s\\S]*(DROP ROW|FAIL UPDATE)" },
        { label: "Materializa cuarentena", pattern: "orders_quarantine" },
        { label: "Aplica clientes con AUTO CDC", pattern: "AUTO CDC INTO[\\s\\S]*KEYS[\\s\\S]*SEQUENCE BY" },
        { label: "Crea gold y consulta event log", pattern: "MATERIALIZED VIEW[\\s\\S]*event_log\\(TABLE" },
      ],
      expectedEvidence: [
        "Grafo y contratos de datasets con owners, SLO y estrategia de rebuild.",
        "Caso CDC fuera de orden donde vence el mayor `source_lsn` y un delete desaparece del estado actual.",
        "Filas inválidas en cuarentena y métricas de expectations en event log.",
        "Segunda ejecución idempotente y backfill diario reconciliado contra un manifiesto.",
        "Run/repair de Jobs con quality gate y runbook de producción.",
      ],
      cloudNotes: {
        AWS: "Usa Volumes sobre S3, IAM roles en storage credentials y conectividad privada a la fuente CDC; CloudWatch complementa alertas, pero event log conserva evidencia del pipeline.",
        Azure: "Usa ADLS Gen2 con managed identity, Private Link para fuentes y Key Vault para secretos; Azure Monitor complementa Jobs/event log sin copiar PII.",
        GCP: "Usa GCS con service accounts, conectividad privada y Secret Manager; Cloud Monitoring complementa métricas manteniendo Unity Catalog como frontera de gobierno.",
      },
    },
    quiz: [
      {
        question: "Clientes llegan como updates y deletes fuera de orden y solo se necesita el estado vigente. ¿Qué objeto es adecuado?",
        options: [
          "Append flow sin clave",
          "Materialized view sin secuencia",
          "AUTO CDC con SCD tipo 1, clave y `SEQUENCE BY`",
          "APPLY CHANGES presentado como única API actual",
        ],
        answer: 2,
        explanation: "AUTO CDC es la API actual y SCD 1 materializa estado vigente resolviendo orden y deletes por clave.",
        domain: "Production pipelines · CDC",
      },
      {
        question: "Un pedido sin ID debe corregirse más tarde sin detener pedidos válidos. ¿Qué acción satisface el requisito?",
        options: [
          "Clasificarlo en una cuarentena trazable y excluirlo de silver",
          "Fallar todos los flows paralelos",
          "Conservarlo en gold con ID nulo",
          "Descartarlo sin registro",
        ],
        answer: 0,
        explanation: "La cuarentena conserva evidencia y permite remediación, mientras la rama válida continúa.",
        domain: "Production pipelines · quality",
      },
      {
        question: "Se requiere bloquear publicación cuando la tasa inválida supera 1%, manteniendo limpia la transformación declarativa. ¿Dónde va el branching?",
        options: [
          "Dentro de `@dp.table` llamando una API",
          "En `VACUUM`",
          "En el schema Kafka",
          "En Lakeflow Jobs mediante validación, task value e If/else",
        ],
        answer: 3,
        explanation: "El pipeline produce datos y métricas; Jobs coordina decisiones y efectos operativos mediante control flow.",
        domain: "Production pipelines · orchestration",
      },
      {
        question: "El pipeline terminó verde una vez. ¿Qué evidencia falta para llamarlo production-ready?",
        options: [
          "Solo cambiar el color del dashboard",
          "Pruebas de idempotencia, fallo/repair, backfill, calidad, SLO y permisos",
          "Un notebook adicional sin ejecutar",
          "Eliminar el event log para ahorrar espacio",
        ],
        answer: 1,
        explanation: "La preparación productiva incluye comportamiento bajo reintentos e incidentes, observabilidad y gobierno, no solo el happy path.",
        domain: "Production pipelines · readiness",
      },
    ],
    sources: [
      {
        label: "Best practices for Lakeflow Spark Declarative Pipelines · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/best-practices",
        reviewedAt,
      },
      {
        label: "AUTO CDC APIs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/cdc",
        reviewedAt,
      },
      {
        label: "Pipeline event log schema · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-log-schema",
        reviewedAt,
      },
    ],
  },
};

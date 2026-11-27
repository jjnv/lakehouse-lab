import type { LessonEssentialsSource } from "../content-types";

/** «Lo esencial» de los módulos m13–m17 (rama de streaming). */
export const streamingEssentials = {
  "m13-l1": {
    glossary: ["structured-streaming", "stream-processing", "batch-processing"],
    es: {
      plain: "Structured Streaming trata un flujo de datos como una tabla que no para de crecer. Cada cierto tiempo procesa solo las filas nuevas (un microlote) con el mismo código que usarías en batch.",
      analogy: "Una cinta transportadora: no esperas a tener todo el pedido para empaquetar; vas cerrando cajas a medida que llegan productos.",
      buildsOn: "Parte de la diferencia batch/streaming de los fundamentos y de Auto Loader (m09), que ya era streaming.",
    },
    en: {
      plain: "Structured Streaming treats a data stream as a table that keeps growing. Every so often it processes only the new rows (a micro-batch) with the same code you would use in batch.",
      analogy: "A conveyor belt: you do not wait for the whole order before packing; you close boxes as products arrive.",
      buildsOn: "It builds on the batch/streaming distinction from the foundations and on Auto Loader (m09), which was already streaming.",
    },
  },
  "m13-l2": {
    glossary: ["structured-streaming", "delta-table", "kafka"],
    es: {
      plain: "Toda consulta de streaming lee de un origen (source), escribe en un destino (sink) y elige un modo de salida: añadir solo filas nuevas (append), reescribir el resultado (complete) o actualizar lo cambiado (update).",
      analogy: "Un grifo (origen), un depósito (destino) y la decisión de rellenar, vaciar y llenar, o solo reponer lo gastado.",
      buildsOn: "Concreta las piezas del modelo incremental de la lección anterior.",
    },
    en: {
      plain: "Every streaming query reads from a source, writes to a sink and chooses an output mode: add only new rows (append), rewrite the result (complete) or update what changed (update).",
      analogy: "A tap (source), a tank (sink) and the choice of topping up, emptying and refilling, or replacing only what was used.",
      buildsOn: "It makes concrete the pieces of the previous lesson's incremental model.",
    },
  },
  "m13-l3": {
    glossary: ["streaming-trigger", "latency-freshness", "dbu"],
    es: {
      plain: "El trigger decide cuándo se ejecuta cada microlote. `processingTime` mantiene la consulta viva y procesa cada intervalo; `availableNow` procesa todo lo pendiente y se para, ideal para ejecutarlo desde un job.",
      analogy: "Un autobús que pasa cada diez minutos frente a un taxi que llamas, te lleva y se va.",
      buildsOn: "Relaciona la frescura de los fundamentos con el coste del compute del módulo 2.",
    },
    en: {
      plain: "The trigger decides when each micro-batch runs. `processingTime` keeps the query alive and processes every interval; `availableNow` processes everything pending and stops, ideal for running from a job.",
      analogy: "A bus that comes every ten minutes versus a taxi you call, that drops you off and leaves.",
      buildsOn: "It links freshness from the foundations with compute cost from module 2.",
    },
  },
  "m13-l4": {
    glossary: ["checkpoint", "kafka", "idempotency"],
    es: {
      plain: "Para no perder ni repetir datos, la consulta anota en el checkpoint qué posiciones (offsets) ha leído y qué lotes ha confirmado. Al reiniciar, continúa justo donde lo dejó.",
      analogy: "Un marcapáginas: si cierras el libro, sabes exactamente en qué página seguir.",
      buildsOn: "Profundiza en el checkpoint que ya usaste con Auto Loader.",
    },
    en: {
      plain: "To avoid losing or repeating data, the query records in the checkpoint which positions (offsets) it has read and which batches it has committed. On restart it continues exactly where it left off.",
      analogy: "A bookmark: if you close the book, you know exactly which page to continue from.",
      buildsOn: "It goes deeper into the checkpoint you already used with Auto Loader.",
    },
  },
  "m13-l5": {
    glossary: ["checkpoint", "schema-evolution", "repair-run"],
    es: {
      plain: "No todos los cambios en una consulta de streaming son compatibles con su checkpoint. Algunos (añadir un filtro) se pueden hacer; otros (cambiar la agregación) exigen un checkpoint nuevo y un plan de reproceso.",
      analogy: "Puedes cambiar el color de una casa sin derribarla, pero no mover los cimientos.",
      buildsOn: "Usa todo lo anterior para operar el streaming cuando el código evoluciona.",
    },
    en: {
      plain: "Not every change to a streaming query is compatible with its checkpoint. Some (adding a filter) are fine; others (changing the aggregation) need a new checkpoint and a reprocessing plan.",
      analogy: "You can repaint a house without knocking it down, but you cannot move the foundations.",
      buildsOn: "It uses everything so far to operate streaming as the code evolves.",
    },
  },
  "m14-l1": {
    glossary: ["event-time", "latency-freshness", "stream-processing"],
    es: {
      plain: "Event time es cuándo ocurrió algo; processing time es cuándo lo procesa el sistema. Como los eventos llegan tarde o desordenados, las métricas de negocio deben agruparse por event time.",
      analogy: "Una carta fechada el lunes que llega el jueves sigue siendo del lunes.",
      buildsOn: "Añade el tiempo como dimensión al modelo incremental del módulo 13.",
    },
    en: {
      plain: "Event time is when something happened; processing time is when the system processes it. Because events arrive late or out of order, business metrics should be grouped by event time.",
      analogy: "A letter dated Monday that arrives on Thursday still belongs to Monday.",
      buildsOn: "It adds time as a dimension to module 13's incremental model.",
    },
  },
  "m14-l2": {
    glossary: ["aggregation", "event-time", "stateful-processing"],
    es: {
      plain: "Una ventana agrupa eventos por intervalos de tiempo. Las tumbling no se solapan (cada 10 minutos); las sliding sí (10 minutos que avanzan cada 5), así un evento puede contar en varias.",
      analogy: "Tumbling son las páginas de un calendario; sliding es una lupa que vas deslizando sobre la línea de tiempo.",
      buildsOn: "Combina agregaciones (m04) con event time.",
    },
    en: {
      plain: "A window groups events by time intervals. Tumbling windows do not overlap (every 10 minutes); sliding windows do (10 minutes moving every 5), so one event may count in several.",
      analogy: "Tumbling windows are calendar pages; a sliding window is a magnifying glass moved along a timeline.",
      buildsOn: "It combines aggregations (m04) with event time.",
    },
  },
  "m14-l3": {
    glossary: ["watermark", "event-time", "stateful-processing"],
    es: {
      plain: "Un watermark dice cuánto retraso aceptas. Pasado ese margen, Spark cierra la ventana, emite el resultado final y libera memoria. Los eventos que lleguen después se descartan.",
      analogy: "La hora de cierre de un buzón: lo que llegue después ya no entra en el reparto de hoy.",
      buildsOn: "Resuelve el problema de las ventanas: ¿cuándo se puede dar por cerrada una?",
    },
    en: {
      plain: "A watermark states how much delay you accept. Beyond that margin, Spark closes the window, emits the final result and frees memory. Events arriving later are dropped.",
      analogy: "A postbox collection time: anything posted afterwards misses today's delivery.",
      buildsOn: "It solves the window problem: when can one be considered closed?",
    },
  },
  "m14-l4": {
    glossary: ["stateful-processing", "watermark", "primary-key"],
    es: {
      plain: "Para deduplicar un flujo, Spark recuerda los identificadores ya vistos. Con un watermark, solo los recuerda durante un tiempo acotado, de modo que la memoria no crece sin fin.",
      analogy: "Un portero que recuerda las caras de quien entró en la última hora, no de toda la vida.",
      buildsOn: "Aplica watermarks a la deduplicación que conociste en batch (m04).",
    },
    en: {
      plain: "To deduplicate a stream, Spark remembers the identifiers it has already seen. With a watermark it remembers them only for a bounded time, so memory does not grow forever.",
      analogy: "A doorman who remembers the faces of everyone who came in during the last hour, not forever.",
      buildsOn: "It applies watermarks to the deduplication you met in batch (m04).",
    },
  },
  "m14-l5": {
    glossary: ["stateful-processing", "spill", "spark-ui"],
    es: {
      plain: "El state store guarda la memoria de las consultas con estado. Sus métricas (número de claves, memoria usada) indican si el estado está acotado o crece hasta poner en riesgo el cluster.",
      analogy: "Vigilar cuánto ocupa el archivo de una oficina: si no se purga nunca, acaba bloqueando el pasillo.",
      buildsOn: "Cierra el módulo enseñando a vigilar el coste del estado que has creado.",
    },
    en: {
      plain: "The state store holds the memory of stateful queries. Its metrics (number of keys, memory used) show whether state is bounded or growing until it endangers the cluster.",
      analogy: "Watching how much room an office archive takes: if it is never purged, it ends up blocking the corridor.",
      buildsOn: "It closes the module by teaching you to monitor the cost of the state you created.",
    },
  },
  "m15-l1": {
    glossary: ["kafka", "partition", "checkpoint"],
    es: {
      plain: "Kafka organiza los mensajes en topics divididos en particiones. Dentro de cada partición los mensajes tienen orden y un número de posición (offset) que el consumidor usa para saber por dónde va.",
      analogy: "Varias colas de supermercado (particiones) con tiques numerados (offsets): el orden se respeta dentro de cada cola, no entre colas.",
      buildsOn: "Conecta el streaming del módulo 13 con el bus de eventos más común.",
    },
    en: {
      plain: "Kafka organises messages into topics split into partitions. Within each partition messages are ordered and carry a position number (offset) the consumer uses to know where it is.",
      analogy: "Several supermarket queues (partitions) with numbered tickets (offsets): order is kept within each queue, not across queues.",
      buildsOn: "It connects module 13's streaming with the most common event bus.",
    },
  },
  "m15-l2": {
    glossary: ["kafka", "event-time", "json"],
    es: {
      plain: "Cada mensaje Kafka trae una clave (key), un contenido (value, en bytes), cabeceras y una marca de tiempo. Hay que decodificar el value y conservar los metadatos útiles para trazar el origen.",
      analogy: "Un paquete con etiqueta de destino (key), contenido (value), notas pegadas (headers) y matasellos (timestamp).",
      buildsOn: "Aplica la lectura de JSON y los tipos de datos (m04, m08) a mensajes Kafka.",
    },
    en: {
      plain: "Each Kafka message carries a key, a value (in bytes), headers and a timestamp. You must decode the value and keep the useful metadata to trace the source.",
      analogy: "A parcel with a destination label (key), contents (value), stuck-on notes (headers) and a postmark (timestamp).",
      buildsOn: "It applies JSON parsing and data types (m04, m08) to Kafka messages.",
    },
  },
  "m15-l3": {
    glossary: ["secret-scope", "service-principal", "least-privilege"],
    es: {
      plain: "Conectar con Kafka exige credenciales. Deben guardarse en un gestor de secretos y leerse en tiempo de ejecución, nunca escribirse en el notebook ni aparecer en logs.",
      analogy: "La llave de la oficina se guarda en una caja fuerte, no pegada a la puerta con cinta.",
      buildsOn: "Aplica la seguridad de Unity Catalog (m11) a las conexiones externas.",
    },
    en: {
      plain: "Connecting to Kafka requires credentials. They must be stored in a secret manager and read at runtime, never written in the notebook or shown in logs.",
      analogy: "The office key is kept in a safe, not taped to the door.",
      buildsOn: "It applies Unity Catalog security (m11) to external connections.",
    },
  },
  "m15-l4": {
    glossary: ["idempotency", "checkpoint", "merge"],
    es: {
      plain: "Kafka y Spark garantizan que ningún mensaje se pierda, pero tras un fallo alguno puede procesarse dos veces (at-least-once). El «exactamente una vez» práctico se consigue con un destino idempotente, como un MERGE por clave.",
      analogy: "Si un mensajero entrega dos veces la misma carta, el destinatario la reconoce por su número y no la archiva dos veces.",
      buildsOn: "Une checkpoints (m13) e idempotencia (m06) para garantías de extremo a extremo.",
    },
    en: {
      plain: "Kafka and Spark ensure no message is lost, but after a failure some may be processed twice (at-least-once). Practical exactly-once comes from an idempotent sink, such as a MERGE by key.",
      analogy: "If a courier delivers the same letter twice, the recipient recognises its number and does not file it twice.",
      buildsOn: "It combines checkpoints (m13) and idempotency (m06) for end-to-end guarantees.",
    },
  },
  "m15-l5": {
    glossary: ["kafka", "partition", "latency-freshness"],
    es: {
      plain: "El lag es cuántos mensajes van por detrás los consumidores. Si crece, el sistema no da abasto: hay que limitar cuánto se lee por lote (backpressure) o añadir capacidad y particiones.",
      analogy: "Una cola que se alarga en la caja: o abres más cajas o regulas cuánta gente entra a la vez.",
      buildsOn: "Cierra Kafka con la operación: medir y dimensionar.",
    },
    en: {
      plain: "Lag is how many messages consumers are behind. If it grows, the system cannot keep up: you must limit how much is read per batch (backpressure) or add capacity and partitions.",
      analogy: "A checkout queue getting longer: either open more checkouts or control how many people come in at once.",
      buildsOn: "It closes Kafka with operations: measuring and sizing.",
    },
  },
  "m16-l1": {
    glossary: ["cdc", "change-data-feed", "oltp"],
    es: {
      plain: "CDC captura los cambios de una base de datos de origen; Change Data Feed (CDF) registra los cambios de una tabla Delta. Ambos describen inserciones, actualizaciones y borrados, pero en lugares distintos de la cadena.",
      analogy: "CDC es el extracto del banco que te envían; CDF es el registro de movimientos que llevas tú en tu propia libreta.",
      buildsOn: "Retoma MERGE (m06) y el streaming para propagar cambios, no tablas completas.",
    },
    en: {
      plain: "CDC captures changes from a source database; Change Data Feed (CDF) records changes in a Delta table. Both describe inserts, updates and deletes, but at different points in the chain.",
      analogy: "CDC is the bank statement they send you; CDF is the transaction log you keep in your own notebook.",
      buildsOn: "It returns to MERGE (m06) and streaming to propagate changes rather than whole tables.",
    },
  },
  "m16-l2": {
    glossary: ["change-data-feed", "transaction-log", "time-travel"],
    es: {
      plain: "En CDF cada fila cambiada lleva un tipo (insert, update_preimage, update_postimage, delete) y la versión de la tabla en la que ocurrió. Así sabes qué cambió y en qué orden.",
      analogy: "Un registro de obras con «antes» y «después» de cada reforma, fechado y numerado.",
      buildsOn: "Se apoya en las versiones del transaction log que viste en m06.",
    },
    en: {
      plain: "In CDF each changed row carries a type (insert, update_preimage, update_postimage, delete) and the table version where it happened. That tells you what changed and in what order.",
      analogy: "A renovation log with a “before” and “after” of each change, dated and numbered.",
      buildsOn: "It relies on the transaction-log versions you saw in m06.",
    },
  },
  "m16-l3": {
    glossary: ["primary-key", "cdc", "event-time"],
    es: {
      plain: "Para aplicar cambios bien necesitas dos cosas: una clave que diga a qué registro afecta cada cambio y una columna de secuencia que diga cuál es el más reciente, aunque lleguen desordenados.",
      analogy: "Para ordenar las versiones de un contrato necesitas saber de qué contrato es (clave) y su número de versión (secuencia).",
      buildsOn: "Combina claves (m04) con el problema del desorden temporal (m14).",
    },
    en: {
      plain: "To apply changes correctly you need two things: a key saying which record each change affects and a sequence column saying which is newest, even if they arrive out of order.",
      analogy: "To sort versions of a contract you need to know which contract it is (key) and its version number (sequence).",
      buildsOn: "It combines keys (m04) with the problem of time disorder (m14).",
    },
  },
  "m16-l4": {
    glossary: ["auto-cdc", "lakeflow-pipelines", "merge"],
    es: {
      plain: "AUTO CDC (antes APPLY CHANGES) aplica un flujo de cambios a una tabla indicando solo la clave y la secuencia. La plataforma resuelve el orden, los borrados y el historial sin que escribas MERGE complejos.",
      analogy: "Un gestor que lleva tu contabilidad: le das los movimientos y él cuadra el saldo final.",
      buildsOn: "Automatiza lo que en la lección anterior harías a mano con claves y secuencias.",
    },
    en: {
      plain: "AUTO CDC (formerly APPLY CHANGES) applies a change stream to a table by specifying just the key and sequence. The platform handles ordering, deletes and history without you writing complex MERGEs.",
      analogy: "An accountant who keeps your books: you hand over the transactions and they reconcile the final balance.",
      buildsOn: "It automates what you would do by hand in the previous lesson with keys and sequences.",
    },
  },
  "m16-l5": {
    glossary: ["scd", "fact-dimension", "auto-cdc"],
    es: {
      plain: "SCD tipo 1 sobrescribe el valor y solo guarda el estado actual; SCD tipo 2 guarda una fila por versión con fechas de validez. También hay que decidir qué hacer con los borrados.",
      analogy: "Tipo 1 es actualizar la dirección en la agenda; tipo 2 es guardar todas las direcciones con fecha de mudanza.",
      buildsOn: "Cierra CDC aplicándolo a las dimensiones del modelo gold (m07).",
    },
    en: {
      plain: "SCD type 1 overwrites the value and keeps only the current state; SCD type 2 keeps one row per version with validity dates. You must also decide what to do with deletes.",
      analogy: "Type 1 is updating the address in your contacts; type 2 is keeping every address with its moving date.",
      buildsOn: "It closes CDC by applying it to gold-layer dimensions (m07).",
    },
  },
  "m17-l1": {
    glossary: ["sla-slo", "latency-freshness", "data-contract"],
    es: {
      plain: "Un SLA de streaming dice qué frescura y completitud se prometen, por ejemplo «datos con menos de 5 minutos de retraso el 99 % del tiempo». Todo el diseño posterior se justifica con él.",
      analogy: "Una empresa de reparto promete entrega en 24 horas; eso decide cuántas furgonetas necesita.",
      buildsOn: "Abre el proyecto de streaming usando SLOs (m07) y frescura.",
    },
    en: {
      plain: "A streaming SLA states the promised freshness and completeness, for example “data less than 5 minutes late 99% of the time”. Every later design choice is justified by it.",
      analogy: "A delivery company promises 24-hour delivery; that decides how many vans it needs.",
      buildsOn: "It opens the streaming project using SLOs (m07) and freshness.",
    },
  },
  "m17-l2": {
    glossary: ["kafka", "partition", "primary-key"],
    es: {
      plain: "Diseña los eventos con identificador único, marca de tiempo de evento y una clave de partición que reparta la carga sin romper el orden necesario.",
      analogy: "Etiquetar bien los paquetes antes de enviarlos evita perderlos y ordenarlos a mano después.",
      buildsOn: "Aplica Kafka (m15) y event time (m14) al diseño del proyecto.",
    },
    en: {
      plain: "Design events with a unique identifier, an event timestamp and a partition key that spreads load without breaking the ordering you need.",
      analogy: "Labelling parcels properly before shipping avoids losing them and sorting them by hand later.",
      buildsOn: "It applies Kafka (m15) and event time (m14) to the project design.",
    },
  },
  "m17-l3": {
    glossary: ["stateful-processing", "cdc", "data-quality"],
    es: {
      plain: "El pipeline combina estado acotado (ventanas, deduplicación), cambios CDC de perfiles y reglas de calidad. Cada pieza tiene su límite de memoria y su forma de tratar los datos malos.",
      analogy: "Una cocina con varias estaciones: cada una tiene su espacio, sus tiempos y su control de calidad antes de emplatar.",
      buildsOn: "Junta los módulos 14 y 16 en una sola solución.",
    },
    en: {
      plain: "The pipeline combines bounded state (windows, deduplication), CDC profile changes and quality rules. Each piece has its memory limit and its way of handling bad data.",
      analogy: "A kitchen with several stations: each has its space, timings and quality check before plating.",
      buildsOn: "It brings modules 14 and 16 together in one solution.",
    },
  },
  "m17-l4": {
    glossary: ["sla-slo", "system-tables", "lakeflow-jobs"],
    es: {
      plain: "Para cumplir el SLA hay que medirlo: frescura, lag, filas descartadas y errores. Las alertas deben avisar a alguien concreto con información suficiente para actuar.",
      analogy: "El salpicadero del coche: no basta con conducir, hay que ver la velocidad y que se encienda la luz de aviso a tiempo.",
      buildsOn: "Añade observabilidad al pipeline del proyecto.",
    },
    en: {
      plain: "To meet the SLA you have to measure it: freshness, lag, dropped rows and errors. Alerts must reach a specific person with enough information to act.",
      analogy: "A car dashboard: driving is not enough; you need to see your speed and have the warning light come on in time.",
      buildsOn: "It adds observability to the project pipeline.",
    },
  },
  "m17-l5": {
    glossary: ["checkpoint", "idempotency", "repair-run"],
    es: {
      plain: "Un game day provoca fallos a propósito (datos tardíos, reinicios, errores) para comprobar que el pipeline se recupera sin perder ni duplicar datos, y que el equipo sabe qué hacer.",
      analogy: "Un simulacro de incendio: se practica la evacuación antes de que haga falta de verdad.",
      buildsOn: "Cierra la rama de streaming demostrando que todo lo anterior funciona bajo presión.",
    },
    en: {
      plain: "A game day causes failures on purpose (late data, restarts, errors) to check that the pipeline recovers without losing or duplicating data, and that the team knows what to do.",
      analogy: "A fire drill: you practise evacuating before it is needed for real.",
      buildsOn: "It closes the streaming track by showing everything so far works under pressure.",
    },
  },
} satisfies Record<string, LessonEssentialsSource>;

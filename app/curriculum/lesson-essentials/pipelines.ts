import type { LessonEssentialsSource } from "../content-types";

/** «Lo esencial» de los módulos m18–m22 (pipelines declarativos y orquestación). */
export const pipelinesEssentials = {
  "m18-l1": {
    glossary: ["lakeflow-pipelines", "apache-spark", "structured-streaming"],
    es: {
      plain: "Spark Declarative Pipelines es un framework abierto de Spark para declarar tablas y sus dependencias; Lakeflow es la oferta gestionada de Databricks que lo ejecuta con compute, monitorización y gobierno integrados.",
      analogy: "La receta (framework) es pública; el restaurante (Lakeflow) pone la cocina, el personal y el control sanitario.",
      buildsOn: "Ofrece una alternativa más declarativa a los jobs (m10) y al streaming manual (m13).",
    },
    en: {
      plain: "Spark Declarative Pipelines is an open Spark framework for declaring tables and their dependencies; Lakeflow is Databricks' managed offering that runs it with built-in compute, monitoring and governance.",
      analogy: "The recipe (framework) is public; the restaurant (Lakeflow) provides the kitchen, the staff and the health inspection.",
      buildsOn: "It offers a more declarative alternative to jobs (m10) and hand-written streaming (m13).",
    },
  },
  "m18-l2": {
    glossary: ["lakeflow-pipelines", "data-pipeline", "lazy-evaluation"],
    es: {
      plain: "En el modelo declarativo dices qué tabla quieres y de qué otras depende; el sistema deduce el orden, construye el grafo y decide qué recalcular. Tú no programas el «cuándo» ni el «cómo».",
      analogy: "Pedir un mueble terminado al carpintero frente a darle instrucciones de cada corte.",
      buildsOn: "Recuerda a la evaluación perezosa de Spark (m04), pero a nivel de tablas completas.",
    },
    en: {
      plain: "In the declarative model you say which table you want and which others it depends on; the system works out the order, builds the graph and decides what to recompute. You do not code the “when” or the “how”.",
      analogy: "Ordering a finished piece of furniture from a carpenter versus giving instructions for every cut.",
      buildsOn: "It echoes Spark's lazy evaluation (m04), but at the level of whole tables.",
    },
  },
  "m18-l3": {
    glossary: ["streaming-table", "materialized-view", "auto-loader"],
    es: {
      plain: "Hay dos tipos principales de dataset: la streaming table, que procesa cada fila nueva una vez (ideal para ingesta), y la materialized view, que guarda el resultado de una consulta y lo refresca (ideal para agregados).",
      analogy: "Una cinta que va llenando cajas (streaming table) frente a un informe que se reimprime actualizado (materialized view).",
      buildsOn: "Traduce bronze/silver/gold (m07) a los objetos del modelo declarativo.",
    },
    en: {
      plain: "There are two main dataset types: the streaming table, which processes each new row once (ideal for ingestion), and the materialized view, which stores a query result and refreshes it (ideal for aggregates).",
      analogy: "A belt that keeps filling boxes (streaming table) versus a report reprinted with fresh figures (materialized view).",
      buildsOn: "It maps bronze/silver/gold (m07) onto the objects of the declarative model.",
    },
  },
  "m18-l4": {
    glossary: ["sql", "pyspark", "lakeflow-pipelines"],
    es: {
      plain: "Los pipelines se pueden escribir en SQL (`CREATE OR REFRESH ...`) o en Python con decoradores como `@dp.table`. Puedes mezclar ambos en el mismo pipeline según convenga.",
      analogy: "Un mismo plano puede dibujarse a mano o con un programa de diseño; el edificio resultante es igual.",
      buildsOn: "Retoma la comparación SQL/PySpark del módulo 3 dentro de un pipeline.",
    },
    en: {
      plain: "Pipelines can be written in SQL (`CREATE OR REFRESH ...`) or in Python with decorators such as `@dp.table`. You can mix both in the same pipeline as needed.",
      analogy: "The same blueprint can be drawn by hand or in design software; the resulting building is the same.",
      buildsOn: "It revisits module 3's SQL/PySpark comparison inside a pipeline.",
    },
  },
  "m18-l5": {
    glossary: ["serverless-compute", "streaming-trigger", "lakeflow-pipelines"],
    es: {
      plain: "Un pipeline puede ejecutarse de forma programada (triggered: procesa lo pendiente y se para) o continua (siempre encendido). Con serverless, la plataforma gestiona las máquinas y el escalado.",
      analogy: "Un tren con horarios frente a una cinta mecánica que nunca se detiene.",
      buildsOn: "Aplica la elección de trigger (m13) y de compute (m02) al pipeline declarativo.",
    },
    en: {
      plain: "A pipeline can run on a schedule (triggered: it processes what is pending and stops) or continuously (always on). With serverless, the platform manages machines and scaling.",
      analogy: "A train with a timetable versus a moving walkway that never stops.",
      buildsOn: "It applies the choice of trigger (m13) and compute (m02) to the declarative pipeline.",
    },
  },
  "m19-l1": {
    glossary: ["data-quality", "data-contract", "expectations"],
    es: {
      plain: "La calidad tiene dimensiones: completitud, validez, unicidad, coherencia y frescura. Un contrato concreta qué reglas debe cumplir cada tabla y qué pasa si no las cumple.",
      analogy: "Una inspección de alimentos revisa temperatura, caducidad, etiquetado y aspecto; cada fallo tiene un protocolo.",
      buildsOn: "Formaliza la calidad que empezaste a aplicar en silver (m07).",
    },
    en: {
      plain: "Quality has dimensions: completeness, validity, uniqueness, consistency and freshness. A contract states which rules each table must meet and what happens if it does not.",
      analogy: "A food inspection checks temperature, expiry, labelling and appearance; each failure has a protocol.",
      buildsOn: "It formalises the quality you started applying in silver (m07).",
    },
  },
  "m19-l2": {
    glossary: ["expectations", "event-log", "data-quality"],
    es: {
      plain: "Una expectation básica (EXPECT) solo observa: deja pasar todas las filas pero cuenta cuántas incumplen la regla. Sirve para medir antes de decidir si bloquear.",
      analogy: "Un radar que registra la velocidad de los coches sin multar, para saber si hace falta poner una multa.",
      buildsOn: "Es la primera acción de calidad dentro de los pipelines del módulo 18.",
    },
    en: {
      plain: "A basic expectation (EXPECT) only observes: it lets every row through but counts how many break the rule. It helps you measure before deciding whether to block.",
      analogy: "A speed camera that records speeds without fining, to find out whether fines are needed.",
      buildsOn: "It is the first quality action inside module 18's pipelines.",
    },
  },
  "m19-l3": {
    glossary: ["expectations", "quarantine", "data-quality"],
    es: {
      plain: "EXPECT OR DROP descarta las filas que no cumplen la regla y deja pasar las demás. Útil cuando una fila mala no debe contaminar la tabla, pero sí quieres que el pipeline siga.",
      analogy: "Un control que retira las frutas en mal estado y deja seguir al resto del lote.",
      buildsOn: "Pasa de observar (EXPECT) a actuar sobre las filas malas.",
    },
    en: {
      plain: "EXPECT OR DROP discards rows that break the rule and lets the rest through. Useful when a bad row must not pollute the table but you still want the pipeline to continue.",
      analogy: "A checkpoint that removes spoiled fruit and lets the rest of the batch move on.",
      buildsOn: "It moves from observing (EXPECT) to acting on bad rows.",
    },
  },
  "m19-l4": {
    glossary: ["expectations", "data-contract", "sla-slo"],
    es: {
      plain: "EXPECT OR FAIL detiene la actualización si alguna fila incumple la regla. Se reserva para reglas críticas, donde publicar datos incorrectos es peor que no publicar.",
      analogy: "Parar la línea de producción si un frenado falla: mejor retrasar que vender un coche inseguro.",
      buildsOn: "Completa el abanico de acciones: observar, descartar o detener.",
    },
    en: {
      plain: "EXPECT OR FAIL stops the update if any row breaks the rule. It is kept for critical rules, where publishing wrong data is worse than not publishing.",
      analogy: "Stopping the production line when a brake test fails: better late than selling an unsafe car.",
      buildsOn: "It completes the range of actions: observe, drop or stop.",
    },
  },
  "m19-l5": {
    glossary: ["quarantine", "event-log", "system-tables"],
    es: {
      plain: "La cuarentena guarda las filas rechazadas con el motivo para revisarlas, y el event log registra métricas de calidad de cada actualización. Juntos permiten explicar y corregir problemas.",
      analogy: "Un almacén de devoluciones con etiqueta de motivo y un registro diario de cuántas devoluciones hubo.",
      buildsOn: "Recupera la cuarentena de la ingesta (m08) dentro de los pipelines.",
    },
    en: {
      plain: "Quarantine stores rejected rows with the reason so they can be reviewed, and the event log records quality metrics for each update. Together they let you explain and fix problems.",
      analogy: "A returns warehouse with reason labels and a daily log of how many returns came in.",
      buildsOn: "It brings ingestion quarantine (m08) into pipelines.",
    },
  },
  "m20-l1": {
    glossary: ["task", "task-values", "lakeflow-jobs"],
    es: {
      plain: "Una tarea if/else elige qué rama del job ejecutar según una condición, por ejemplo si se cargaron filas. Así el DAG toma decisiones sin esconder lógica dentro de un notebook.",
      analogy: "Un cruce con semáforo: según la luz, el tráfico sigue por una calle u otra.",
      buildsOn: "Usa task values (m10) para decidir el camino del job.",
    },
    en: {
      plain: "An if/else task picks which branch of the job to run based on a condition, for example whether rows were loaded. The DAG makes decisions without hiding logic inside a notebook.",
      analogy: "A junction with traffic lights: depending on the light, traffic takes one street or another.",
      buildsOn: "It uses task values (m10) to decide the job's path.",
    },
  },
  "m20-l2": {
    glossary: ["task", "task-values", "partition"],
    es: {
      plain: "Una tarea for each repite la misma subtarea para cada elemento de una lista (regiones, fechas, tablas), con un límite de concurrencia para no saturar recursos.",
      analogy: "Un cartero que recorre la misma ruta en cada barrio, pero no más de tres barrios a la vez.",
      buildsOn: "Añade bucles controlados al grafo del job.",
    },
    en: {
      plain: "A for each task repeats the same subtask for every item in a list (regions, dates, tables), with a concurrency limit so resources are not overwhelmed.",
      analogy: "A postal worker who walks the same route in each neighbourhood, but no more than three at a time.",
      buildsOn: "It adds controlled loops to the job graph.",
    },
  },
  "m20-l3": {
    glossary: ["lakeflow-jobs", "task"],
    es: {
      plain: "Una tarea puede lanzar otro job completo. Esto permite reutilizar flujos (por ejemplo, un job de ingesta) desde varios orquestadores sin copiar su definición.",
      analogy: "Usar una receta base de masa en varias recetas de pizza en lugar de reescribirla cada vez.",
      buildsOn: "Lleva la modularidad del código (m03) al nivel de los jobs.",
    },
    en: {
      plain: "A task can launch another whole job. This lets you reuse flows (for example, an ingestion job) from several orchestrators without copying their definition.",
      analogy: "Using one base dough recipe in several pizza recipes instead of rewriting it each time.",
      buildsOn: "It brings code modularity (m03) to the job level.",
    },
  },
  "m20-l4": {
    glossary: ["repair-run", "task-values", "idempotency"],
    es: {
      plain: "Un repair vuelve a ejecutar solo las tareas que fallaron y las que dependen de ellas, y permite cambiar parámetros puntualmente. Funciona bien si las tareas son idempotentes.",
      analogy: "Repetir solo la escena que salió mal en un rodaje, no la película entera.",
      buildsOn: "Amplía los reintentos del módulo 10 con recuperación selectiva.",
    },
    en: {
      plain: "A repair re-runs only the tasks that failed and those depending on them, and lets you override parameters for that run. It works well if tasks are idempotent.",
      analogy: "Reshooting only the scene that went wrong, not the whole film.",
      buildsOn: "It extends module 10's retries with selective recovery.",
    },
  },
  "m20-l5": {
    glossary: ["lakeflow-jobs", "idempotency", "backfill"],
    es: {
      plain: "La concurrencia decide cuántas ejecuciones del mismo job pueden correr a la vez; la cola (queueing) hace esperar a las que llegan cuando se alcanza el límite, en lugar de descartarlas.",
      analogy: "Un probador de ropa con dos cabinas: si están ocupadas, haces cola en vez de irte.",
      buildsOn: "Protege los datos de ejecuciones simultáneas que podrían pisarse.",
    },
    en: {
      plain: "Concurrency decides how many runs of the same job may execute at once; queueing makes new runs wait when the limit is reached, instead of dropping them.",
      analogy: "A fitting room with two cubicles: if both are busy, you queue instead of leaving.",
      buildsOn: "It protects data from simultaneous runs that could overwrite each other.",
    },
  },
  "m21-l1": {
    glossary: ["file-arrival-trigger", "sla-slo"],
    es: {
      plain: "Programar un job a una hora exige fijar la zona horaria y pensar en cambios de horario. Un «todos los días a las 02:00» puede saltarse o repetirse si no se define bien.",
      analogy: "Una alarma que no se ajusta al cambio de hora y te hace llegar tarde una vez al año.",
      buildsOn: "Profundiza en el trigger por calendario que viste en m10.",
    },
    en: {
      plain: "Scheduling a job at a set time requires choosing the time zone and thinking about daylight-saving changes. An “every day at 02:00” may be skipped or repeated if not defined carefully.",
      analogy: "An alarm that ignores the clock change and makes you late once a year.",
      buildsOn: "It goes deeper into the calendar trigger you saw in m10.",
    },
  },
  "m21-l2": {
    glossary: ["file-arrival-trigger", "volume", "latency-freshness"],
    es: {
      plain: "Los triggers por llegada de archivo o por actualización de tabla arrancan el job cuando hay datos nuevos. Evitan ejecuciones vacías y reducen la espera frente a un horario fijo.",
      analogy: "Un timbre que suena cuando llega el repartidor, en lugar de bajar a mirar cada hora.",
      buildsOn: "Sustituye el «cuándo» por calendario por el «cuándo» por disponibilidad del dato.",
    },
    en: {
      plain: "File-arrival or table-update triggers start the job when there is new data. They avoid empty runs and cut waiting time compared with a fixed schedule.",
      analogy: "A doorbell that rings when the courier arrives, instead of going down to check every hour.",
      buildsOn: "It replaces “when” by calendar with “when” by data availability.",
    },
  },
  "m21-l3": {
    glossary: ["streaming-trigger", "lakeflow-pipelines", "dbu"],
    es: {
      plain: "Un pipeline continuo está siempre encendido y da la mínima latencia; uno triggered procesa lo pendiente y se apaga, con menor coste. La elección depende del SLA, no de la moda.",
      analogy: "Un horno siempre encendido para servir al momento frente a encenderlo solo cuando hay pedidos.",
      buildsOn: "Aplica el equilibrio frescura-coste a los pipelines del módulo 18.",
    },
    en: {
      plain: "A continuous pipeline is always on and gives minimum latency; a triggered one processes what is pending and shuts down, at lower cost. The choice depends on the SLA, not on fashion.",
      analogy: "An oven always on to serve instantly versus switching it on only when there are orders.",
      buildsOn: "It applies the freshness–cost balance to module 18's pipelines.",
    },
  },
  "m21-l4": {
    glossary: ["backfill", "task-values", "idempotency"],
    es: {
      plain: "Un backfill reprocesa un periodo pasado, por ejemplo 90 días, normalmente en ventanas pequeñas parametrizadas. Debe convivir con la ejecución diaria sin duplicar datos ni bloquearla.",
      analogy: "Repintar las habitaciones de una casa habitada: una a una, sin impedir que la familia siga viviendo.",
      buildsOn: "Usa parámetros (m10) e idempotencia (m06) para recargar historia con seguridad.",
    },
    en: {
      plain: "A backfill reprocesses a past period, for example 90 days, usually in small parameterised windows. It must coexist with the daily run without duplicating data or blocking it.",
      analogy: "Repainting the rooms of an occupied house: one at a time, without stopping the family from living there.",
      buildsOn: "It uses parameters (m10) and idempotency (m06) to reload history safely.",
    },
  },
  "m21-l5": {
    glossary: ["sla-slo", "lakeflow-jobs", "service-principal"],
    es: {
      plain: "Una alerta útil llega a un responsable concreto, explica qué pasó y qué hacer. Las notificaciones y webhooks conectan los jobs con herramientas como el correo o la mensajería del equipo.",
      analogy: "Una alarma de incendio que además indica en qué planta está el fuego y a quién llamar.",
      buildsOn: "Cierra la operación diaria uniendo triggers, SLOs y responsables.",
    },
    en: {
      plain: "A useful alert reaches a specific owner and explains what happened and what to do. Notifications and webhooks connect jobs to tools such as email or the team's chat.",
      analogy: "A fire alarm that also tells you which floor is burning and whom to call.",
      buildsOn: "It completes daily operations by tying together triggers, SLOs and owners.",
    },
  },
  "m22-l1": {
    glossary: ["lakeflow-pipelines", "medallion-architecture", "data-contract"],
    es: {
      plain: "Antes de programar, dibuja el grafo del pipeline: qué tablas hay en cada capa, de qué dependen, qué contrato cumple cada una y quién es su dueño.",
      analogy: "El plano de una casa indica habitaciones, tuberías y quién se encarga de cada instalación.",
      buildsOn: "Arranca el proyecto de pipelines con la arquitectura medallion (m07).",
    },
    en: {
      plain: "Before coding, draw the pipeline graph: which tables sit in each layer, what they depend on, which contract each meets and who owns it.",
      analogy: "A house plan shows rooms, pipes and who is responsible for each installation.",
      buildsOn: "It starts the pipelines project with the medallion architecture (m07).",
    },
  },
  "m22-l2": {
    glossary: ["streaming-table", "materialized-view", "auto-cdc"],
    es: {
      plain: "Implementa el grafo con streaming tables para la ingesta, AUTO CDC para los cambios de clientes y materialized views para los agregados de negocio.",
      analogy: "Montar la casa con las piezas adecuadas: tuberías para el agua, cables para la luz, no al revés.",
      buildsOn: "Aplica los objetos de m18 y el CDC de m16.",
    },
    en: {
      plain: "Implement the graph with streaming tables for ingestion, AUTO CDC for customer changes and materialized views for business aggregates.",
      analogy: "Building the house with the right parts: pipes for water, cables for light, not the other way round.",
      buildsOn: "It applies the objects from m18 and the CDC from m16.",
    },
  },
  "m22-l3": {
    glossary: ["expectations", "quarantine", "event-log"],
    es: {
      plain: "Añade reglas de calidad con la acción adecuada para cada una (observar, descartar o detener) y una cuarentena para revisar rechazos. Comprueba en el event log que se aplican.",
      analogy: "Poner controles de calidad en cada estación de la fábrica y revisar el informe al final del turno.",
      buildsOn: "Lleva al proyecto todo el módulo 19.",
    },
    en: {
      plain: "Add quality rules with the right action for each (observe, drop or stop) and a quarantine to review rejects. Check in the event log that they are applied.",
      analogy: "Placing quality checks at each factory station and reviewing the report at the end of the shift.",
      buildsOn: "It brings the whole of module 19 into the project.",
    },
  },
  "m22-l4": {
    glossary: ["lakeflow-jobs", "declarative-automation-bundles", "ci-cd"],
    es: {
      plain: "Un job envuelve el pipeline con tareas previas y posteriores (validaciones, publicación) y un bundle lo despliega igual en cada entorno.",
      analogy: "Empaquetar un producto con instrucciones y garantía para que llegue igual a cualquier tienda.",
      buildsOn: "Combina jobs (m10, m20) y bundles (m11) con el pipeline declarativo.",
    },
    en: {
      plain: "A job wraps the pipeline with tasks before and after it (validations, publishing) and a bundle deploys it identically to each environment.",
      analogy: "Packaging a product with instructions and warranty so it reaches every shop the same way.",
      buildsOn: "It combines jobs (m10, m20) and bundles (m11) with the declarative pipeline.",
    },
  },
  "m22-l5": {
    glossary: ["backfill", "repair-run", "data-testing"],
    es: {
      plain: "Prueba el pipeline en situaciones reales: fallos de una tarea, datos inválidos, cambios de esquema y un backfill. Documenta cómo se detecta y se recupera cada caso.",
      analogy: "La prueba de carga de un puente antes de abrirlo al tráfico.",
      buildsOn: "Cierra la rama de pipelines demostrando que se puede operar.",
    },
    en: {
      plain: "Test the pipeline in real situations: a task failure, invalid data, schema changes and a backfill. Document how each case is detected and recovered.",
      analogy: "The load test of a bridge before it opens to traffic.",
      buildsOn: "It closes the pipelines track by showing it can be operated.",
    },
  },
} satisfies Record<string, LessonEssentialsSource>;

import type { LessonEssentialsSource } from "../content-types";

/** «Lo esencial» de los módulos m23–m27 (rendimiento, coste y fiabilidad). */
export const performanceEssentials = {
  "m23-l1": {
    glossary: ["catalyst", "spark-ui", "shuffle"],
    es: {
      plain: "Para optimizar con criterio, primero mira el plan físico y las métricas de cada etapa: cuánto se lee, cuánto se mueve por red y cuánto tarda cada tarea. Sin esa evidencia, los ajustes son apuestas.",
      analogy: "Un médico pide análisis antes de recetar; no da antibióticos a ciegas.",
      buildsOn: "Retoma Catalyst y shuffles (m05) con herramientas de diagnóstico.",
    },
    en: {
      plain: "To optimise with judgement, first look at the physical plan and each stage's metrics: how much is read, how much moves over the network and how long each task takes. Without that evidence, tuning is guesswork.",
      analogy: "A doctor orders tests before prescribing; they do not hand out antibiotics blindly.",
      buildsOn: "It revisits Catalyst and shuffles (m05) with diagnostic tools.",
    },
  },
  "m23-l2": {
    glossary: ["data-skew", "aqe", "spark-ui"],
    es: {
      plain: "Skew es cuando unas pocas claves concentran casi todos los datos. AQE puede detectarlo y partir esas particiones en tiempo de ejecución; si no basta, se corrige en los datos (por ejemplo, tratando aparte los nulos).",
      analogy: "En una mudanza, si un mozo carga todas las cajas pesadas, se reparten entre varios.",
      buildsOn: "Pasa de reconocer el skew (m05) a corregirlo.",
    },
    en: {
      plain: "Skew is when a few keys hold almost all the data. AQE can detect it and split those partitions at runtime; if that is not enough, you fix it in the data (for example, handling nulls separately).",
      analogy: "In a house move, if one mover carries all the heavy boxes, they are shared among several.",
      buildsOn: "It moves from recognising skew (m05) to fixing it.",
    },
  },
  "m23-l3": {
    glossary: ["broadcast-join", "join", "shuffle"],
    es: {
      plain: "El sort merge join ordena y mueve ambas tablas; el broadcast join copia la pequeña a todos. Elegir bien depende del tamaño real tras filtrar, que puedes comprobar en el plan.",
      analogy: "Para cruzar dos listas largas, se ordenan ambas; si una es una hoja, basta con fotocopiarla para cada persona.",
      buildsOn: "Profundiza en las estrategias de join que viste en m05.",
    },
    en: {
      plain: "Sort merge join sorts and moves both tables; broadcast join copies the small one to everyone. Choosing well depends on the real size after filtering, which you can check in the plan.",
      analogy: "To match two long lists, you sort both; if one is a single page, photocopying it for each person is enough.",
      buildsOn: "It goes deeper into the join strategies from m05.",
    },
  },
  "m23-l4": {
    glossary: ["partition", "small-files", "shuffle"],
    es: {
      plain: "El número de particiones tras un shuffle y el tamaño de los archivos escritos afectan a la velocidad de esta consulta y de las siguientes. Ni muy pocas ni demasiadas: se ajusta al volumen real.",
      analogy: "Dividir un pedido en cajas: ni una caja imposible de levantar ni mil cajas diminutas.",
      buildsOn: "Conecta las particiones de Spark (m05) con los archivos de Delta (m06).",
    },
    en: {
      plain: "The number of partitions after a shuffle and the size of the files written affect the speed of this query and the following ones. Neither too few nor too many: tune to the real volume.",
      analogy: "Splitting an order into boxes: neither one box too heavy to lift nor a thousand tiny boxes.",
      buildsOn: "It connects Spark partitions (m05) with Delta files (m06).",
    },
  },
  "m23-l5": {
    glossary: ["udf", "pyspark", "photon"],
    es: {
      plain: "Las funciones nativas de Spark son las más rápidas; las Pandas UDF procesan lotes y son aceptables; las UDF de Python fila a fila son lentas porque cada valor viaja entre la JVM y Python.",
      analogy: "Hablar el idioma del país frente a usar un intérprete para cada frase.",
      buildsOn: "Cierra el tuning de código mostrando el coste de salir del motor.",
    },
    en: {
      plain: "Spark's native functions are fastest; Pandas UDFs process batches and are acceptable; row-by-row Python UDFs are slow because every value travels between the JVM and Python.",
      analogy: "Speaking the local language versus using an interpreter for every sentence.",
      buildsOn: "It completes code tuning by showing the cost of leaving the engine.",
    },
  },
  "m24-l1": {
    glossary: ["photon", "columnar-format", "sql-warehouse"],
    es: {
      plain: "Photon es un motor vectorizado: procesa muchos valores de una columna a la vez en lugar de fila a fila. Acelera SQL y DataFrames sin cambiar el código, si los operadores son compatibles.",
      analogy: "Sellar cien sobres con un rodillo frente a sellarlos uno a uno.",
      buildsOn: "Aprovecha el formato columnar de los fundamentos a nivel de ejecución.",
    },
    en: {
      plain: "Photon is a vectorised engine: it processes many values of a column at once rather than row by row. It speeds up SQL and DataFrames without code changes, if operators are compatible.",
      analogy: "Stamping a hundred envelopes with a roller versus stamping them one by one.",
      buildsOn: "It exploits the columnar format from the foundations at execution level.",
    },
  },
  "m24-l2": {
    glossary: ["data-skipping", "parquet", "delta-table"],
    es: {
      plain: "Delta guarda el mínimo y el máximo de las columnas de cada archivo. Al filtrar, salta los archivos que no pueden contener resultados, y lee mucho menos.",
      analogy: "El lomo de los archivadores indica «A–C», «D–F»: para buscar «Martínez» no abres los demás.",
      buildsOn: "Usa las estadísticas de Parquet y del transaction log (m06).",
    },
    en: {
      plain: "Delta stores the minimum and maximum of columns for each file. When filtering, it skips files that cannot contain results, reading much less.",
      analogy: "Binder spines say “A–C”, “D–F”: to find “Martinez” you do not open the others.",
      buildsOn: "It uses Parquet and transaction-log statistics (m06).",
    },
  },
  "m24-l3": {
    glossary: ["partition", "small-files", "liquid-clustering"],
    es: {
      plain: "Particionar una tabla crea una carpeta por valor de una columna. Funciona con columnas de pocos valores y tablas grandes; con muchas particiones pequeñas genera archivos diminutos y empeora el rendimiento.",
      analogy: "Un cajón por año es práctico; un cajón por segundo llena la casa de cajones vacíos.",
      buildsOn: "Muestra los límites de la organización física clásica antes de ver la alternativa.",
    },
    en: {
      plain: "Partitioning a table creates a folder per value of a column. It works with low-cardinality columns and large tables; with many small partitions it produces tiny files and hurts performance.",
      analogy: "A drawer per year is handy; a drawer per second fills the house with empty drawers.",
      buildsOn: "It shows the limits of classic physical layout before the alternative.",
    },
  },
  "m24-l4": {
    glossary: ["liquid-clustering", "data-skipping", "optimize"],
    es: {
      plain: "Liquid clustering organiza los datos por las columnas que más se filtran, sin crear carpetas fijas, y puedes cambiar esas columnas más adelante sin reescribir toda la tabla.",
      analogy: "Una estantería que puedes reordenar por autor o por tema según lo que más busquen los lectores.",
      buildsOn: "Sustituye al particionado de la lección anterior para mejorar el data skipping.",
    },
    en: {
      plain: "Liquid clustering organises data by the most-filtered columns without creating fixed folders, and you can change those columns later without rewriting the whole table.",
      analogy: "A bookshelf you can reorder by author or by topic depending on what readers look for most.",
      buildsOn: "It replaces the previous lesson's partitioning to improve data skipping.",
    },
  },
  "m24-l5": {
    glossary: ["deletion-vectors", "predictive-optimization", "vacuum"],
    es: {
      plain: "Los deletion vectors marcan filas borradas sin reescribir archivos, lo que acelera DELETE y MERGE. Predictive optimization decide por ti cuándo compactar y limpiar las tablas gestionadas.",
      analogy: "Tachar una línea de la lista en lugar de reescribirla entera, y que alguien la pase a limpio cuando toque.",
      buildsOn: "Cierra el módulo con el mantenimiento automático de las tablas Delta.",
    },
    en: {
      plain: "Deletion vectors mark deleted rows without rewriting files, which speeds up DELETE and MERGE. Predictive optimization decides for you when to compact and clean managed tables.",
      analogy: "Crossing out a line on the list instead of rewriting it, and having someone write a clean copy when it is due.",
      buildsOn: "It closes the module with automatic maintenance of Delta tables.",
    },
  },
  "m25-l1": {
    glossary: ["dbu", "compute", "serverless-compute"],
    es: {
      plain: "El coste combina DBUs (lo que cobra Databricks según el producto o SKU) y, en compute clásico, las máquinas y el almacenamiento de la nube. Cada tipo de carga tiene un precio por DBU distinto.",
      analogy: "Un viaje en coche de alquiler: pagas el alquiler, la gasolina y el parking por separado.",
      buildsOn: "Amplía la idea de DBU del módulo 2.",
    },
    en: {
      plain: "Cost combines DBUs (what Databricks charges per product or SKU) and, on classic compute, the cloud machines and storage. Each workload type has a different price per DBU.",
      analogy: "A rental car trip: you pay the rental, the fuel and the parking separately.",
      buildsOn: "It extends module 2's DBU idea.",
    },
  },
  "m25-l2": {
    glossary: ["system-tables", "dbu", "sql"],
    es: {
      plain: "La tabla `system.billing.usage` registra el consumo detallado. Con SQL puedes ver cuánto gasta cada job, warehouse o día, y detectar tendencias antes de que llegue la factura.",
      analogy: "El desglose de la factura del móvil: ves qué llamada o qué datos te costaron más.",
      buildsOn: "Usa SQL (fundamentos) sobre las tablas de sistema.",
    },
    en: {
      plain: "The `system.billing.usage` table records detailed consumption. With SQL you can see how much each job, warehouse or day costs, and spot trends before the invoice arrives.",
      analogy: "The itemised phone bill: you see which call or which data use cost the most.",
      buildsOn: "It applies SQL (foundations) to system tables.",
    },
  },
  "m25-l3": {
    glossary: ["custom-tags", "system-tables"],
    es: {
      plain: "Las etiquetas (tags) en compute y jobs permiten atribuir el gasto a equipos o proyectos. Con eso puedes repartir costes (chargeback) y hablar de datos, no de impresiones.",
      analogy: "Poner el nombre de cada compañero en su táper de la nevera para saber de quién es cada cosa.",
      buildsOn: "Hace útil la tabla de facturación de la lección anterior.",
    },
    en: {
      plain: "Tags on compute and jobs let you attribute spend to teams or projects. With them you can allocate costs (chargeback) and discuss data, not impressions.",
      analogy: "Putting each colleague's name on their lunchbox in the shared fridge so you know whose is whose.",
      buildsOn: "It makes the previous lesson's billing table useful.",
    },
  },
  "m25-l4": {
    glossary: ["compute-policy", "custom-tags", "autoscaling"],
    es: {
      plain: "Las compute policies limitan qué compute se puede crear (tamaños, tags obligatorios, auto-stop), y los presupuestos avisan cuando el gasto se acerca a un umbral.",
      analogy: "Una tarjeta de empresa con límite y categorías permitidas, más un aviso cuando llevas gastado el 80 %.",
      buildsOn: "Pasa de medir el coste a ponerle límites preventivos.",
    },
    en: {
      plain: "Compute policies limit what compute can be created (sizes, mandatory tags, auto-stop), and budgets alert you when spend approaches a threshold.",
      analogy: "A company card with a limit and allowed categories, plus an alert when you have spent 80%.",
      buildsOn: "It moves from measuring cost to setting preventive limits.",
    },
  },
  "m25-l5": {
    glossary: ["serverless-compute", "dbu", "latency-freshness"],
    es: {
      plain: "Serverless ofrece un modo estándar, más económico, y otro optimizado para rendimiento, que arranca y escala más rápido pero cuesta más. Se elige según el SLA de cada carga.",
      analogy: "Envío estándar o urgente: el urgente llega antes pero cuesta más, y no todo lo necesita.",
      buildsOn: "Cierra FinOps conectando coste con requisitos de servicio.",
    },
    en: {
      plain: "Serverless offers a standard, cheaper mode and a performance-optimised one that starts and scales faster but costs more. You choose based on each workload's SLA.",
      analogy: "Standard or express shipping: express arrives sooner but costs more, and not everything needs it.",
      buildsOn: "It closes FinOps by linking cost to service requirements.",
    },
  },
  "m26-l1": {
    glossary: ["spark-ui", "driver-executor", "spill"],
    es: {
      plain: "La Spark UI muestra los jobs, sus etapas y tareas, y cada executor. Con ella encuentras la etapa más lenta, las tareas desiguales y los volcados a disco.",
      analogy: "El cronómetro por vueltas de una carrera: ves exactamente en qué tramo se pierde el tiempo.",
      buildsOn: "Es la herramienta práctica para lo aprendido en m05 y m23.",
    },
    en: {
      plain: "The Spark UI shows jobs, their stages and tasks, and each executor. With it you find the slowest stage, uneven tasks and spills to disk.",
      analogy: "A lap timer in a race: you see exactly in which section time is lost.",
      buildsOn: "It is the practical tool for what you learned in m05 and m23.",
    },
  },
  "m26-l2": {
    glossary: ["query-profile", "photon", "data-skipping"],
    es: {
      plain: "Query Profile muestra cada operador de una consulta SQL con su tiempo, filas y bytes. Es la forma más rápida de saber si el problema es leer demasiado, un join o un shuffle.",
      analogy: "La radiografía de una consulta: ves qué hueso está roto sin adivinar.",
      buildsOn: "Lleva el diagnóstico de la Spark UI a los SQL warehouses.",
    },
    en: {
      plain: "Query Profile shows each operator of a SQL query with its time, rows and bytes. It is the fastest way to tell whether the problem is reading too much, a join or a shuffle.",
      analogy: "An X-ray of a query: you see which bone is broken without guessing.",
      buildsOn: "It brings Spark UI-style diagnosis to SQL warehouses.",
    },
  },
  "m26-l3": {
    glossary: ["system-tables", "lakeflow-jobs", "sla-slo"],
    es: {
      plain: "Las tablas de sistema de workflows registran cada ejecución de job y tarea con su duración y resultado. Con SQL puedes ver tendencias, fallos recurrentes y si se cumplen los SLO.",
      analogy: "El historial de mantenimiento de una flota de coches: ves qué vehículo falla más y cuándo.",
      buildsOn: "Combina las tablas de sistema (m25) con los jobs (m10).",
    },
    en: {
      plain: "Workflow system tables record every job and task run with its duration and result. With SQL you can see trends, recurring failures and whether SLOs are met.",
      analogy: "A fleet's maintenance history: you see which vehicle fails most and when.",
      buildsOn: "It combines system tables (m25) with jobs (m10).",
    },
  },
  "m26-l4": {
    glossary: ["event-log", "compute", "driver-executor"],
    es: {
      plain: "Los event logs de pipelines y los logs de cluster guardan lo que ocurrió: arranques, errores, salidas del driver. Son la caja negra cuando algo falla y nadie estaba mirando.",
      analogy: "La caja negra de un avión: registra todo para reconstruir lo que pasó.",
      buildsOn: "Completa las fuentes de evidencia para diagnosticar.",
    },
    en: {
      plain: "Pipeline event logs and cluster logs keep what happened: start-ups, errors, driver output. They are the black box when something fails and nobody was watching.",
      analogy: "An aircraft's black box: it records everything to reconstruct what happened.",
      buildsOn: "It completes the sources of evidence for diagnosis.",
    },
  },
  "m26-l5": {
    glossary: ["databricks-cli", "system-tables", "service-principal"],
    es: {
      plain: "La CLI y las APIs REST permiten automatizar el diagnóstico: listar ejecuciones fallidas, descargar logs o lanzar comprobaciones de forma programada, con una identidad de servicio.",
      analogy: "Programar el robot de cocina en vez de remover a mano cada vez.",
      buildsOn: "Convierte las consultas de diagnóstico en tareas repetibles.",
    },
    en: {
      plain: "The CLI and REST APIs let you automate diagnosis: listing failed runs, downloading logs or launching checks on a schedule, with a service identity.",
      analogy: "Programming the kitchen robot instead of stirring by hand every time.",
      buildsOn: "It turns diagnostic queries into repeatable tasks.",
    },
  },
  "m27-l1": {
    glossary: ["sla-slo", "data-contract"],
    es: {
      plain: "Ante un incidente, primero clasifica la gravedad: a quién afecta, desde cuándo y qué SLA se incumple. Eso decide la urgencia y quién debe intervenir.",
      analogy: "En urgencias se atiende primero según la gravedad, no por orden de llegada.",
      buildsOn: "Abre el proyecto de fiabilidad usando contratos y SLOs.",
    },
    en: {
      plain: "During an incident, first classify severity: who is affected, since when and which SLA is breached. That decides urgency and who must step in.",
      analogy: "In A&E, patients are seen by severity, not order of arrival.",
      buildsOn: "It opens the reliability project using contracts and SLOs.",
    },
  },
  "m27-l2": {
    glossary: ["spark-ui", "query-profile", "system-tables"],
    es: {
      plain: "Formula hipótesis («hay skew», «hay archivos pequeños», «el compute es pequeño») y busca evidencia que las confirme o descarte en la Spark UI, Query Profile y tablas de sistema.",
      analogy: "Un detective no acusa al primero que ve: reúne pistas y descarta sospechosos.",
      buildsOn: "Pone en práctica las herramientas del módulo 26.",
    },
    en: {
      plain: "Form hypotheses (“there is skew”, “there are small files”, “compute is too small”) and look for evidence that confirms or rules them out in the Spark UI, Query Profile and system tables.",
      analogy: "A detective does not accuse the first person they see: they gather clues and rule suspects out.",
      buildsOn: "It puts module 26's tools into practice.",
    },
  },
  "m27-l3": {
    glossary: ["data-skew", "small-files", "liquid-clustering"],
    es: {
      plain: "Corrige la causa confirmada en el sitio adecuado: el código (skew, UDF), la organización de la tabla (clustering, compactación) o ambos. Después mide de nuevo para demostrar la mejora.",
      analogy: "Si la casa tiene goteras, arreglas el tejado, no compras más cubos.",
      buildsOn: "Aplica el tuning de los módulos 23 y 24 con evidencia previa.",
    },
    en: {
      plain: "Fix the confirmed cause in the right place: the code (skew, UDFs), the table layout (clustering, compaction) or both. Then measure again to prove the improvement.",
      analogy: "If the roof leaks, you fix the roof; you do not buy more buckets.",
      buildsOn: "It applies the tuning from modules 23 and 24 with prior evidence.",
    },
  },
  "m27-l4": {
    glossary: ["autoscaling", "dbu", "compute-policy"],
    es: {
      plain: "Right-sizing es ajustar el compute a lo que la carga necesita de verdad tras las correcciones: ni más grande «por si acaso», ni tan pequeño que incumpla el SLA.",
      analogy: "Elegir talla de ropa después de adelgazar, no antes.",
      buildsOn: "Une la optimización técnica con FinOps (m25).",
    },
    en: {
      plain: "Right-sizing means matching compute to what the workload really needs after the fixes: not bigger “just in case”, nor so small that it breaks the SLA.",
      analogy: "Choosing your clothing size after losing weight, not before.",
      buildsOn: "It joins technical optimisation with FinOps (m25).",
    },
  },
  "m27-l5": {
    glossary: ["sla-slo", "data-testing", "lakeflow-jobs"],
    es: {
      plain: "Un postmortem explica qué pasó, por qué, cómo se detectó y qué acciones evitarán que se repita, sin buscar culpables. Cada acción tiene un responsable y una fecha.",
      analogy: "El informe tras un accidente aéreo: no busca a quién castigar, sino qué cambiar para que no vuelva a ocurrir.",
      buildsOn: "Cierra la rama de rendimiento convirtiendo el incidente en aprendizaje.",
    },
    en: {
      plain: "A postmortem explains what happened, why, how it was detected and which actions will stop it recurring, without blaming anyone. Each action has an owner and a date.",
      analogy: "The report after an air accident: it does not look for someone to punish, but for what to change so it does not happen again.",
      buildsOn: "It closes the performance track by turning the incident into learning.",
    },
  },
} satisfies Record<string, LessonEssentialsSource>;

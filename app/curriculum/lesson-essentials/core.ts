import type { LessonEssentialsSource } from "../content-types";

/** «Lo esencial» de los módulos m01–m12 (ruta Associate). */
export const coreEssentials = {
  "m01-l1": {
    glossary: ["data-lake", "data-warehouse", "lakehouse", "open-table-format"],
    es: {
      plain: "Un data lake guarda muchos archivos baratos pero sin garantías; un data warehouse ofrece tablas fiables pero cerradas y caras de copiar. El lakehouse junta lo mejor de ambos: archivos abiertos en la nube con una capa que los convierte en tablas fiables.",
      analogy: "Un data lake es un trastero enorme donde todo cabe; un warehouse es una biblioteca ordenada pero pequeña. El lakehouse es ese trastero con un bibliotecario que cataloga cada caja y controla quién entra.",
      buildsOn: "Es el punto de partida del temario. Si te suenan poco «archivo», «tabla» o «SQL», repasa antes la página de fundamentos.",
    },
    en: {
      plain: "A data lake stores lots of cheap files without guarantees; a data warehouse offers reliable tables but is closed and costly to copy into. The lakehouse combines the best of both: open files in the cloud plus a layer that turns them into reliable tables.",
      analogy: "A data lake is a huge storage unit where everything fits; a warehouse is a tidy but small library. The lakehouse is that storage unit with a librarian who catalogues every box and controls who gets in.",
      buildsOn: "This is the starting point of the curriculum. If “file”, “table” or “SQL” feel unfamiliar, read the foundations page first.",
    },
  },
  "m01-l2": {
    glossary: ["control-plane", "compute", "workspace"],
    es: {
      plain: "Databricks se divide en dos partes: el plano de control, que es la «oficina» donde configuras y programas el trabajo, y el plano de cómputo, donde las máquinas realmente leen y procesan tus datos.",
      analogy: "Es como un restaurante: la sala recibe pedidos y organiza (control); la cocina cocina con los ingredientes (cómputo). Los ingredientes no tienen por qué pasar por la sala.",
      buildsOn: "Parte de la idea anterior de separar almacenamiento y cómputo, y añade quién coordina el trabajo.",
    },
    en: {
      plain: "Databricks is split into two parts: the control plane, the “office” where you configure and schedule work, and the compute plane, where machines actually read and process your data.",
      analogy: "Think of a restaurant: the dining room takes orders and organises (control); the kitchen cooks with the ingredients (compute). Ingredients do not need to pass through the dining room.",
      buildsOn: "It builds on the previous idea of separating storage and compute, and adds who coordinates the work.",
    },
  },
  "m01-l3": {
    glossary: ["object-storage", "parquet", "open-table-format", "delta-lake"],
    es: {
      plain: "Tus datos viven como archivos en un almacenamiento de objetos de la nube (S3, ADLS, GCS). Guardarlos en formatos abiertos como Parquet y Delta permite que cualquier motor los lea sin quedar atrapado en un producto.",
      analogy: "Es como guardar documentos en PDF en lugar de en un formato que solo abre un programa: cualquiera puede leerlos dentro de diez años.",
      buildsOn: "Concreta dónde está el «trastero» del lakehouse que viste en la primera lección.",
    },
    en: {
      plain: "Your data lives as files in cloud object storage (S3, ADLS, GCS). Keeping them in open formats such as Parquet and Delta lets any engine read them without getting locked into one product.",
      analogy: "It is like saving documents as PDF rather than in a format only one program can open: anyone can still read them ten years from now.",
      buildsOn: "It pins down where the lakehouse “storage unit” from the first lesson actually is.",
    },
  },
  "m01-l4": {
    glossary: ["workspace", "metastore", "unity-catalog", "compute"],
    es: {
      plain: "El workspace es tu espacio de trabajo; el metastore de Unity Catalog es el registro central de qué tablas existen y quién puede usarlas; y el compute son las máquinas que ejecutan tu código. Son piezas distintas que se combinan.",
      analogy: "Una oficina (workspace), el archivo central con fichas y llaves (metastore) y los empleados que hacen el trabajo (compute).",
      buildsOn: "Pone nombre a los componentes que aparecían en el plano de control y el de cómputo.",
    },
    en: {
      plain: "The workspace is where you work; the Unity Catalog metastore is the central registry of which tables exist and who can use them; and compute is the machines that run your code. They are separate pieces that combine.",
      analogy: "An office (workspace), the central filing room with cards and keys (metastore) and the staff who do the work (compute).",
      buildsOn: "It names the components that appeared in the control and compute planes.",
    },
  },
  "m01-l5": {
    glossary: ["lakehouse", "medallion-architecture", "data-pipeline", "sql-warehouse"],
    es: {
      plain: "Una arquitectura de referencia junta todo: los datos llegan, se guardan en bruto, se limpian, se modelan y se consumen en dashboards o modelos, con gobierno y compute adecuados en cada paso.",
      analogy: "Es el plano completo de una fábrica: muelle de carga, almacén, líneas de producción y tienda, con control de accesos en cada puerta.",
      buildsOn: "Integra las cuatro lecciones anteriores en un único dibujo de extremo a extremo.",
    },
    en: {
      plain: "A reference architecture puts it all together: data arrives, is stored raw, cleaned, modelled and consumed in dashboards or models, with the right governance and compute at each step.",
      analogy: "It is the complete floor plan of a factory: loading dock, warehouse, production lines and shop, with access control at every door.",
      buildsOn: "It combines the four previous lessons into a single end-to-end picture.",
    },
  },
  "m02-l1": {
    glossary: ["serverless-compute", "compute", "control-plane"],
    es: {
      plain: "Con compute clásico tú eliges y gestionas las máquinas; con serverless, Databricks las prepara y escala por ti. Serverless arranca más rápido y requiere menos operación; el clásico da más control.",
      analogy: "Clásico es tener coche propio: lo eliges y lo mantienes. Serverless es pedir un taxi: llega rápido y solo pagas el trayecto.",
      buildsOn: "Aplica la separación entre plano de control y de cómputo del módulo 1 a la elección práctica de máquinas.",
    },
    en: {
      plain: "With classic compute you choose and manage the machines; with serverless, Databricks prepares and scales them for you. Serverless starts faster and needs less operations; classic gives more control.",
      analogy: "Classic is owning a car: you choose it and maintain it. Serverless is hailing a taxi: it arrives quickly and you pay only for the ride.",
      buildsOn: "It applies module 1's control-plane/compute-plane split to the practical choice of machines.",
    },
  },
  "m02-l2": {
    glossary: ["compute", "job-cluster", "sql-warehouse"],
    es: {
      plain: "Hay tres tipos de compute según el uso: all-purpose para explorar en notebooks, jobs compute para ejecuciones automáticas que nacen y mueren con el job, y SQL warehouses para consultas y dashboards.",
      analogy: "Un taller compartido para probar ideas, una cuadrilla contratada para una obra concreta y un mostrador de atención pensado para muchos clientes a la vez.",
      buildsOn: "Partiendo de serverless frente a clásico, ahora eliges según para qué se usa el compute.",
    },
    en: {
      plain: "There are three kinds of compute by purpose: all-purpose for exploring in notebooks, jobs compute for automatic runs that live and die with the job, and SQL warehouses for queries and dashboards.",
      analogy: "A shared workshop to try ideas, a crew hired for one specific job and a service counter built for many customers at once.",
      buildsOn: "Building on serverless versus classic, you now choose by what the compute is used for.",
    },
  },
  "m02-l3": {
    glossary: ["autoscaling", "compute", "dbu"],
    es: {
      plain: "Autoscaling añade o quita máquinas según la carga; auto-stop apaga el compute cuando nadie lo usa; los pools mantienen máquinas preparadas para arrancar antes. Todo busca pagar solo por lo que se usa.",
      analogy: "Abrir más cajas en el supermercado cuando hay cola, apagar las luces al salir y tener empleados de reserva listos para entrar.",
      buildsOn: "Una vez elegido el tipo de compute, aprendes a ajustar su tamaño y su ciclo de vida.",
    },
    en: {
      plain: "Autoscaling adds or removes machines according to load; auto-stop turns compute off when nobody uses it; pools keep machines ready to start sooner. All of it aims to pay only for what is used.",
      analogy: "Opening more checkouts when there is a queue, switching off the lights when you leave and keeping standby staff ready to step in.",
      buildsOn: "Once the compute type is chosen, you learn to tune its size and lifecycle.",
    },
  },
  "m02-l4": {
    glossary: ["access-mode", "unity-catalog", "least-privilege"],
    es: {
      plain: "El access mode decide cómo conviven los usuarios en un mismo cluster y cómo se aplican los permisos de Unity Catalog: compartido con aislamiento (standard) o reservado a una persona o grupo (dedicated).",
      analogy: "Una oficina compartida con taquillas individuales frente a un despacho privado con llave propia.",
      buildsOn: "Añade seguridad a las decisiones de compute: no solo cuánto cuesta, sino quién comparte la máquina.",
    },
    en: {
      plain: "The access mode decides how users share a cluster and how Unity Catalog permissions are enforced: shared with isolation (standard) or reserved for one person or group (dedicated).",
      analogy: "A shared office with individual lockers versus a private room with its own key.",
      buildsOn: "It adds security to compute decisions: not only what it costs, but who shares the machine.",
    },
  },
  "m02-l5": {
    glossary: ["dbu", "custom-tags", "system-tables"],
    es: {
      plain: "Databricks mide el consumo en DBUs: cada tipo de compute gasta una cantidad por hora. El coste total suma DBUs y, en clásico, las máquinas cloud. Esperar a que arranque también tiene un coste en tiempo.",
      analogy: "Como la factura de la luz: cada aparato consume según su potencia y las horas encendido; el precio del kWh depende de la tarifa.",
      buildsOn: "Cierra el módulo convirtiendo todas las decisiones anteriores en una cifra comparable.",
    },
    en: {
      plain: "Databricks measures consumption in DBUs: each compute type spends an amount per hour. Total cost adds DBUs and, on classic, the cloud machines. Waiting for start-up also costs time.",
      analogy: "Like an electricity bill: each appliance consumes according to its power and the hours it is on; the kWh price depends on the tariff.",
      buildsOn: "It closes the module by turning all previous decisions into a comparable figure.",
    },
  },
  "m03-l1": {
    glossary: ["notebook", "workspace", "git-folders"],
    es: {
      plain: "Un notebook mezcla código, resultados y texto en celdas; los archivos del workspace guardan código normal (.py, .sql). Los notebooks son ideales para explorar; los archivos, para código que se reutiliza y se prueba.",
      analogy: "El notebook es un cuaderno de laboratorio con notas y resultados; el archivo de código es la receta limpia que se archiva para repetirla.",
      buildsOn: "Ahora que tienes compute, aprendes dónde escribir el código que se ejecutará en él.",
    },
    en: {
      plain: "A notebook mixes code, results and text in cells; workspace files hold regular code (.py, .sql). Notebooks are ideal for exploring; files are for code that is reused and tested.",
      analogy: "The notebook is a lab book with notes and results; the code file is the clean recipe you file away to repeat it.",
      buildsOn: "Now that you have compute, you learn where to write the code that will run on it.",
    },
  },
  "m03-l2": {
    glossary: ["sql", "pyspark", "dataframe"],
    es: {
      plain: "SQL describe el resultado que quieres con un lenguaje declarativo; PySpark usa Python para encadenar transformaciones sobre DataFrames. Ambos acaban en el mismo motor, así que eliges según legibilidad y necesidad.",
      analogy: "Pedir un plato del menú (SQL) frente a dar instrucciones paso a paso al cocinero (PySpark): el resultado puede ser el mismo.",
      buildsOn: "Usa los conceptos de tabla y consulta de los fundamentos y los aplica dentro de un notebook.",
    },
    en: {
      plain: "SQL describes the result you want in a declarative language; PySpark uses Python to chain transformations on DataFrames. Both end up in the same engine, so you choose by readability and need.",
      analogy: "Ordering a dish from the menu (SQL) versus giving the chef step-by-step instructions (PySpark): the result can be the same.",
      buildsOn: "It uses the table and query concepts from the foundations and applies them inside a notebook.",
    },
  },
  "m03-l3": {
    glossary: ["task-values", "notebook", "lakeflow-jobs"],
    es: {
      plain: "Los parámetros (widgets o parámetros de tarea) sacan los valores variables del código, como la fecha a procesar. Así el mismo notebook sirve para hoy, para ayer o para otro entorno.",
      analogy: "Un formulario con huecos para rellenar en lugar de reescribir la carta cada vez.",
      buildsOn: "Prepara el código del notebook para que un job pueda ejecutarlo automáticamente más adelante.",
    },
    en: {
      plain: "Parameters (widgets or task parameters) take variable values out of the code, such as the date to process. That way the same notebook works for today, yesterday or another environment.",
      analogy: "A form with blanks to fill in instead of rewriting the letter every time.",
      buildsOn: "It prepares notebook code so a job can run it automatically later on.",
    },
  },
  "m03-l4": {
    glossary: ["python-wheel", "databricks-runtime", "compute"],
    es: {
      plain: "Tu código depende de librerías; si sus versiones cambian sin control, el mismo código puede dar otro resultado. Fijar versiones y empaquetar dependencias hace que la ejecución sea repetible.",
      analogy: "Una receta que dice «harina» frente a una que dice «harina de trigo tipo 55, 500 g»: solo la segunda sale igual cada vez.",
      buildsOn: "Tras parametrizar el código, aseguras que el entorno donde corre también sea predecible.",
    },
    en: {
      plain: "Your code depends on libraries; if their versions change without control, the same code may produce a different result. Pinning versions and packaging dependencies makes runs repeatable.",
      analogy: "A recipe saying “flour” versus one saying “type 55 wheat flour, 500 g”: only the second turns out the same every time.",
      buildsOn: "After parameterising the code, you make sure the environment it runs in is predictable too.",
    },
  },
  "m03-l5": {
    glossary: ["git-folders", "notebook", "ci-cd"],
    es: {
      plain: "Trabajar en equipo exige revisar cambios, dividir el código en funciones pequeñas y versionarlo en Git. Un notebook gigante con estado oculto es difícil de entender y de probar.",
      analogy: "Un libro escrito a varias manos necesita capítulos, borradores y un editor que revise antes de imprimir.",
      buildsOn: "Combina notebooks, parámetros y entornos reproducibles en una forma de trabajar profesional.",
    },
    en: {
      plain: "Teamwork requires reviewing changes, splitting code into small functions and versioning it in Git. A giant notebook with hidden state is hard to understand and test.",
      analogy: "A book written by several authors needs chapters, drafts and an editor who reviews before printing.",
      buildsOn: "It combines notebooks, parameters and reproducible environments into a professional way of working.",
    },
  },
  "m04-l1": {
    glossary: ["lazy-evaluation", "dataframe", "apache-spark"],
    es: {
      plain: "En Spark, las transformaciones (filter, select, join) solo describen qué hacer; nada se ejecuta hasta que una acción (count, write, display) pide un resultado. Entonces Spark ejecuta todo el plan de una vez.",
      analogy: "Escribir la lista de la compra no te lleva al supermercado; solo cuando sales a comprar (la acción) se hace el recorrido completo y optimizado.",
      buildsOn: "Profundiza en el DataFrame que conociste al comparar SQL y PySpark.",
    },
    en: {
      plain: "In Spark, transformations (filter, select, join) only describe what to do; nothing runs until an action (count, write, display) asks for a result. Then Spark runs the whole plan at once.",
      analogy: "Writing a shopping list does not take you to the supermarket; only when you go shopping (the action) is the full, optimised route made.",
      buildsOn: "It goes deeper into the DataFrame you met when comparing SQL and PySpark.",
    },
  },
  "m04-l2": {
    glossary: ["dataframe", "row-column", "data-type"],
    es: {
      plain: "Tres operaciones básicas: `select` elige columnas, `filter` elige filas y `withColumn` crea o cambia una columna. Con ellas se construye la mayoría de transformaciones.",
      analogy: "En una hoja de cálculo: ocultar columnas, filtrar filas y añadir una columna con una fórmula.",
      buildsOn: "Aplica la idea de transformación perezosa a las operaciones más frecuentes sobre filas y columnas.",
    },
    en: {
      plain: "Three basic operations: `select` picks columns, `filter` picks rows and `withColumn` creates or changes a column. Most transformations are built from them.",
      analogy: "In a spreadsheet: hiding columns, filtering rows and adding a column with a formula.",
      buildsOn: "It applies the idea of lazy transformation to the most frequent row and column operations.",
    },
  },
  "m04-l3": {
    glossary: ["join", "primary-key", "aggregation"],
    es: {
      plain: "Un join combina dos tablas por una clave; un union apila filas de tablas con la misma forma. Si la clave no es única, el join multiplica filas sin avisar.",
      analogy: "Unir la lista de alumnos con la de notas usando el DNI; si un DNI aparece dos veces, el alumno sale repetido.",
      buildsOn: "Tras trabajar con una sola tabla, aprendes a combinar varias de forma segura.",
    },
    en: {
      plain: "A join combines two tables on a key; a union stacks rows from tables with the same shape. If the key is not unique, the join multiplies rows without warning.",
      analogy: "Matching the student list with the grades list by ID number; if an ID appears twice, the student shows up twice.",
      buildsOn: "After working with a single table, you learn to combine several safely.",
    },
  },
  "m04-l4": {
    glossary: ["json", "data-type", "dataframe"],
    es: {
      plain: "Los datos reales suelen venir anidados: listas (arrays), diccionarios (maps) y objetos (structs). `explode` convierte cada elemento de una lista en una fila para poder analizarlo.",
      analogy: "Un pedido es una caja con varios productos dentro; `explode` abre la caja y pone cada producto en su propia línea del albarán.",
      buildsOn: "Extiende select y withColumn a columnas que contienen estructuras, como las de un JSON.",
    },
    en: {
      plain: "Real data often arrives nested: lists (arrays), dictionaries (maps) and objects (structs). `explode` turns each element of a list into a row so it can be analysed.",
      analogy: "An order is a box with several products inside; `explode` opens the box and puts each product on its own line of the delivery note.",
      buildsOn: "It extends select and withColumn to columns that hold structures, like those in a JSON file.",
    },
  },
  "m04-l5": {
    glossary: ["window-function", "aggregation", "idempotency"],
    es: {
      plain: "Las agregaciones resumen grupos en una fila; las funciones de ventana calculan por grupo sin perder filas. Con `ROW_NUMBER` puedes quedarte con la versión más reciente de cada clave y eliminar duplicados de forma determinista.",
      analogy: "Ordenar los recibos de cada cliente por fecha y quedarte solo con el último de cada uno.",
      buildsOn: "Cierra el módulo uniendo joins, columnas complejas y claves en una tabla limpia y sin duplicados.",
    },
    en: {
      plain: "Aggregations summarise groups into one row; window functions compute per group without losing rows. With `ROW_NUMBER` you can keep the latest version of each key and remove duplicates deterministically.",
      analogy: "Sorting each customer's receipts by date and keeping only the latest one for each.",
      buildsOn: "It closes the module by combining joins, complex columns and keys into a clean, duplicate-free table.",
    },
  },
  "m05-l1": {
    glossary: ["lazy-evaluation", "driver-executor", "partition"],
    es: {
      plain: "Spark convierte tu código en un grafo de pasos (DAG), lo divide en etapas y cada etapa en tareas, una por partición. El driver coordina y los executors ejecutan las tareas en paralelo.",
      analogy: "Un jefe de obra (driver) reparte un plano en fases y cada fase en encargos para varios obreros (executors) que trabajan a la vez.",
      buildsOn: "Explica qué pasa por dentro cuando una acción dispara la evaluación perezosa del módulo anterior.",
    },
    en: {
      plain: "Spark turns your code into a graph of steps (DAG), splits it into stages and each stage into tasks, one per partition. The driver coordinates and the executors run tasks in parallel.",
      analogy: "A site manager (driver) splits a blueprint into phases and each phase into assignments for several workers (executors) working at once.",
      buildsOn: "It explains what happens inside when an action triggers the lazy evaluation from the previous module.",
    },
  },
  "m05-l2": {
    glossary: ["catalyst", "lazy-evaluation", "data-skipping"],
    es: {
      plain: "Catalyst es el optimizador de Spark: reordena y simplifica tu consulta (por ejemplo, filtra antes de unir) y elige cómo ejecutarla. Con `explain` puedes ver el plan que ha elegido.",
      analogy: "Un GPS que, sabiendo todas las paradas, reordena la ruta para recorrer menos kilómetros.",
      buildsOn: "Muestra por qué la evaluación perezosa es útil: le da a Spark el plan completo para optimizarlo.",
    },
    en: {
      plain: "Catalyst is Spark's optimiser: it reorders and simplifies your query (for example, filtering before joining) and chooses how to run it. With `explain` you can see the plan it picked.",
      analogy: "A GPS that, knowing every stop, reorders the route to drive fewer kilometres.",
      buildsOn: "It shows why lazy evaluation helps: it gives Spark the whole plan to optimise.",
    },
  },
  "m05-l3": {
    glossary: ["partition", "distributed-computing", "small-files"],
    es: {
      plain: "Una partición es un trozo de datos que procesa una tarea. Con pocas particiones sobran núcleos ociosos; con demasiadas, el coste de coordinar y de escribir archivos pequeños se dispara.",
      analogy: "Repartir una pila de exámenes entre correctores: con dos montones sobran correctores; con mil montones de una hoja, se pierde el tiempo repartiendo.",
      buildsOn: "Concreta la idea de tareas en paralelo que viste en el DAG de Spark.",
    },
    en: {
      plain: "A partition is a slice of data processed by one task. With too few partitions, cores sit idle; with too many, the cost of coordinating and writing small files soars.",
      analogy: "Sharing a pile of exams among markers: with two piles, markers sit idle; with a thousand single-page piles, time is wasted handing them out.",
      buildsOn: "It makes concrete the idea of parallel tasks you saw in Spark's DAG.",
    },
  },
  "m05-l4": {
    glossary: ["shuffle", "data-skew", "spill"],
    es: {
      plain: "Un shuffle mueve datos entre máquinas para reunir las filas con la misma clave. Si una clave tiene muchos más datos (skew), una tarea tarda mucho; si no cabe en memoria, se vuelca a disco (spill).",
      analogy: "Reorganizar todas las cartas de una oficina de correos por código postal: si media ciudad vive en un mismo código, ese cartero no termina nunca.",
      buildsOn: "Explica qué ocurre entre etapas y por qué el tamaño de las particiones importa tanto.",
    },
    en: {
      plain: "A shuffle moves data between machines to bring rows with the same key together. If one key has far more data (skew), one task takes very long; if it does not fit in memory, it spills to disk.",
      analogy: "Re-sorting every letter in a post office by postcode: if half the city shares one postcode, that postman never finishes.",
      buildsOn: "It explains what happens between stages and why partition size matters so much.",
    },
  },
  "m05-l5": {
    glossary: ["broadcast-join", "join", "aqe"],
    es: {
      plain: "Spark puede unir tablas moviendo ambas (sort merge join) o enviando una copia de la pequeña a todas las máquinas (broadcast join). La segunda evita el shuffle de la grande cuando un lado es pequeño.",
      analogy: "Para que todos los empleados consulten un listín corto, se le da una fotocopia a cada uno en vez de llevar a todos al archivo.",
      buildsOn: "Aplica lo aprendido sobre shuffles a la operación que más los provoca: el join.",
    },
    en: {
      plain: "Spark can join tables by moving both (sort merge join) or by sending a copy of the small one to every machine (broadcast join). The latter avoids shuffling the large side when one side is small.",
      analogy: "So every employee can check a short phone list, each gets a photocopy instead of everyone walking to the archive.",
      buildsOn: "It applies what you learned about shuffles to the operation that causes them most: the join.",
    },
  },
  "m06-l1": {
    glossary: ["transaction-log", "acid", "delta-table"],
    es: {
      plain: "Una tabla Delta es una carpeta de archivos Parquet más un registro (`_delta_log`) que anota cada cambio como una versión. Gracias a ese registro, una escritura se aplica entera o no se aplica (ACID).",
      analogy: "Un libro de contabilidad: no se borran páginas, se añaden asientos numerados, y el saldo se calcula leyendo los asientos válidos.",
      buildsOn: "Retoma el formato Parquet del módulo 1 y explica qué lo convierte en una tabla fiable.",
    },
    en: {
      plain: "A Delta table is a folder of Parquet files plus a log (`_delta_log`) that records each change as a version. Thanks to that log, a write is applied entirely or not at all (ACID).",
      analogy: "An accounting ledger: pages are never torn out, numbered entries are added, and the balance is computed from the valid entries.",
      buildsOn: "It returns to module 1's Parquet format and explains what turns it into a reliable table.",
    },
  },
  "m06-l2": {
    glossary: ["managed-table", "external-table", "unity-catalog"],
    es: {
      plain: "En una tabla gestionada, la plataforma decide dónde se guardan los archivos y los cuida; en una externa, los archivos están en una ruta que controlas tú. Por defecto conviene la gestionada.",
      analogy: "Alquilar un piso amueblado con mantenimiento incluido frente a registrar a tu nombre una casa que ya tenías.",
      buildsOn: "Tras saber qué es una tabla Delta, decides quién gestiona su almacenamiento.",
    },
    en: {
      plain: "In a managed table the platform decides where files are stored and looks after them; in an external table the files sit at a path you control. Managed is the sensible default.",
      analogy: "Renting a furnished flat with maintenance included versus registering a house you already owned.",
      buildsOn: "After learning what a Delta table is, you decide who manages its storage.",
    },
  },
  "m06-l3": {
    glossary: ["schema-enforcement", "schema-evolution", "table-schema"],
    es: {
      plain: "Delta rechaza por defecto los datos que no encajan con el esquema de la tabla (enforcement). Si un cambio es deseado, como una columna nueva, lo permites de forma explícita (evolution).",
      analogy: "Un portero que solo deja pasar a quien está en la lista; para añadir a alguien, se actualiza la lista a propósito.",
      buildsOn: "Usa el concepto de esquema de los fundamentos para proteger la tabla Delta.",
    },
    en: {
      plain: "By default Delta rejects data that does not match the table schema (enforcement). If a change is wanted, such as a new column, you allow it explicitly (evolution).",
      analogy: "A doorman who only lets in people on the list; to add someone, the list is updated on purpose.",
      buildsOn: "It uses the schema concept from the foundations to protect the Delta table.",
    },
  },
  "m06-l4": {
    glossary: ["merge", "idempotency", "primary-key"],
    es: {
      plain: "MERGE compara los datos nuevos con la tabla por una clave: actualiza los que existen e inserta los nuevos, todo en una transacción. Bien diseñado, repetirlo con los mismos datos no cambia el resultado.",
      analogy: "Actualizar una agenda: si el contacto ya existe, corriges el teléfono; si no, lo añades. Hacerlo dos veces no crea contactos repetidos.",
      buildsOn: "Combina claves (módulo 4) y transacciones Delta para cargar datos de forma segura una y otra vez.",
    },
    en: {
      plain: "MERGE compares new data with the table by key: it updates rows that exist and inserts new ones, all in one transaction. Well designed, repeating it with the same data does not change the result.",
      analogy: "Updating an address book: if the contact exists, you fix the phone; if not, you add it. Doing it twice does not create duplicates.",
      buildsOn: "It combines keys (module 4) and Delta transactions to load data safely again and again.",
    },
  },
  "m06-l5": {
    glossary: ["time-travel", "vacuum", "transaction-log"],
    es: {
      plain: "Como Delta guarda versiones, puedes consultar o restaurar la tabla tal como estaba antes (time travel). VACUUM borra archivos viejos para ahorrar espacio, pero a partir de entonces ya no se puede volver tan atrás.",
      analogy: "El historial de versiones de un documento compartido: puedes recuperar el de ayer, pero si vacías la papelera, lo antiguo desaparece.",
      buildsOn: "Saca partido al transaction log de la primera lección para auditar y recuperar errores.",
    },
    en: {
      plain: "Because Delta keeps versions, you can query or restore the table as it was before (time travel). VACUUM deletes old files to save space, but from then on you cannot go back as far.",
      analogy: "The version history of a shared document: you can recover yesterday's, but if you empty the bin, the old ones are gone.",
      buildsOn: "It takes advantage of the first lesson's transaction log to audit and recover from mistakes.",
    },
  },
  "m07-l1": {
    glossary: ["medallion-architecture", "bronze-silver-gold", "elt"],
    es: {
      plain: "Medallion organiza los datos en capas de calidad creciente: bronze (bruto), silver (limpio) y gold (listo para negocio). Es una guía, no una regla rígida: puedes tener más o menos capas si está justificado.",
      analogy: "El agua pasa por captación, depuradora y grifo: cada etapa tiene su función y su control de calidad.",
      buildsOn: "Pone orden a las tablas Delta del módulo anterior según su propósito.",
    },
    en: {
      plain: "Medallion organises data into layers of increasing quality: bronze (raw), silver (clean) and gold (business-ready). It is a guide, not a rigid rule: you can have more or fewer layers when justified.",
      analogy: "Water goes through intake, treatment plant and tap: each stage has its own purpose and quality check.",
      buildsOn: "It organises the previous module's Delta tables by purpose.",
    },
  },
  "m07-l2": {
    glossary: ["bronze-silver-gold", "metadata", "lineage"],
    es: {
      plain: "Bronze guarda el dato tal como llegó, con metadatos de origen (archivo, hora de carga). Así siempre puedes reprocesar si cambian las reglas o se descubre un error.",
      analogy: "Guardar el ticket original de compra aunque luego pases los gastos a una hoja de cálculo.",
      buildsOn: "Es la primera capa de medallion y aplica la idea de ELT: cargar primero, transformar después.",
    },
    en: {
      plain: "Bronze keeps the data as it arrived, with source metadata (file, load time). That way you can always reprocess if the rules change or an error is found.",
      analogy: "Keeping the original receipt even after you type the expense into a spreadsheet.",
      buildsOn: "It is medallion's first layer and applies the ELT idea: load first, transform later.",
    },
  },
  "m07-l3": {
    glossary: ["data-quality", "primary-key", "schema-enforcement"],
    es: {
      plain: "Silver limpia y conforma: tipa columnas, elimina duplicados, unifica códigos y aplica reglas de calidad. Es la versión reutilizable y fiable de cada entidad, como clientes o pedidos.",
      analogy: "Pasar a limpio unos apuntes: corriges faltas, unificas abreviaturas y quitas repeticiones.",
      buildsOn: "Usa deduplicación y ventanas (módulo 4) y MERGE (módulo 6) sobre la capa bronze.",
    },
    en: {
      plain: "Silver cleans and conforms: it types columns, removes duplicates, unifies codes and applies quality rules. It is the reusable, trusted version of each entity, such as customers or orders.",
      analogy: "Writing up rough notes neatly: you fix typos, standardise abbreviations and remove repetitions.",
      buildsOn: "It uses deduplication and windows (module 4) and MERGE (module 6) on top of the bronze layer.",
    },
  },
  "m07-l4": {
    glossary: ["fact-dimension", "aggregation", "scd"],
    es: {
      plain: "Gold modela los datos para una pregunta de negocio concreta, a menudo con hechos (ventas) y dimensiones (cliente, producto, fecha). Así los dashboards son simples y coherentes.",
      analogy: "El escaparate de una tienda: no muestra el almacén entero, sino lo que el cliente necesita ver, bien ordenado.",
      buildsOn: "Construye sobre silver para publicar métricas fiables.",
    },
    en: {
      plain: "Gold models data for a specific business question, often with facts (sales) and dimensions (customer, product, date). This keeps dashboards simple and consistent.",
      analogy: "A shop window: it does not show the whole warehouse, only what the customer needs to see, well arranged.",
      buildsOn: "It builds on silver to publish trusted metrics.",
    },
  },
  "m07-l5": {
    glossary: ["data-contract", "sla-slo", "data-governance"],
    es: {
      plain: "Cada tabla importante necesita un dueño, un contrato (qué garantiza) y objetivos medibles como la frescura. Sin eso, nadie sabe qué tabla usar ni a quién avisar cuando falla.",
      analogy: "Un producto en el súper lleva etiqueta: fabricante, ingredientes y fecha de caducidad.",
      buildsOn: "Cierra medallion añadiendo responsabilidades y compromisos a cada capa.",
    },
    en: {
      plain: "Every important table needs an owner, a contract (what it guarantees) and measurable targets such as freshness. Without them nobody knows which table to use or whom to alert when it fails.",
      analogy: "A supermarket product carries a label: maker, ingredients and expiry date.",
      buildsOn: "It completes medallion by adding responsibilities and commitments to each layer.",
    },
  },
  "m08-l1": {
    glossary: ["batch-processing", "etl", "latency-freshness"],
    es: {
      plain: "Antes de elegir herramienta, clasifica el origen: ¿archivos, base de datos o API? ¿Carga completa o solo lo nuevo? ¿Con qué frescura? Esas respuestas reducen mucho las opciones.",
      analogy: "Antes de elegir transporte, preguntas qué llevas, cuánto pesa y para cuándo debe llegar.",
      buildsOn: "Abre la ingesta, que alimenta la capa bronze del módulo anterior.",
    },
    en: {
      plain: "Before choosing a tool, classify the source: files, database or API? Full load or only what is new? With what freshness? Those answers narrow the options a lot.",
      analogy: "Before choosing transport, you ask what you are carrying, how heavy it is and when it must arrive.",
      buildsOn: "It opens ingestion, which feeds the previous module's bronze layer.",
    },
  },
  "m08-l2": {
    glossary: ["csv", "json", "parquet", "columnar-format"],
    es: {
      plain: "Cada formato tiene ventajas: CSV y JSON son texto legible pero sin tipos fiables; Parquet, Avro y ORC son binarios, tipados y eficientes. Conocerlos te dice qué opciones de lectura necesitas.",
      analogy: "Recibir una carta manuscrita, un formulario rellenado o una ficha digital: cada una se lee de forma distinta.",
      buildsOn: "Amplía los formatos de archivo que viste en los fundamentos con su uso práctico en la ingesta.",
    },
    en: {
      plain: "Each format has strengths: CSV and JSON are readable text without reliable types; Parquet, Avro and ORC are binary, typed and efficient. Knowing them tells you which read options you need.",
      analogy: "Receiving a handwritten letter, a filled-in form or a digital record card: each is read differently.",
      buildsOn: "It expands the file formats from the foundations with their practical use in ingestion.",
    },
  },
  "m08-l3": {
    glossary: ["copy-into", "idempotency", "volume"],
    es: {
      plain: "COPY INTO carga en una tabla los archivos de una carpeta y recuerda cuáles ya ha cargado. Si lo ejecutas otra vez, solo procesa los nuevos, así que no duplica datos.",
      analogy: "Un registro de entrada en un almacén: cada paquete se anota al llegar y, si vuelve a aparecer el mismo albarán, no se recibe dos veces.",
      buildsOn: "Aplica la idea de idempotencia a la carga de archivos.",
    },
    en: {
      plain: "COPY INTO loads a folder's files into a table and remembers which ones it has already loaded. If you run it again, it only processes new ones, so data is not duplicated.",
      analogy: "A warehouse goods-in log: each parcel is recorded on arrival and, if the same delivery note shows up again, it is not received twice.",
      buildsOn: "It applies the idea of idempotency to loading files.",
    },
  },
  "m08-l4": {
    glossary: ["oltp", "lakehouse-federation", "lakeflow-connect"],
    es: {
      plain: "Para leer bases de datos se usan conectores JDBC u ODBC; para servicios web, llamadas REST. En ambos casos hay que controlar credenciales, paginación, límites y qué filas son nuevas.",
      analogy: "Hacer pedidos a un proveedor por teléfono: necesitas el número, una clave de cliente y no pedir lo mismo dos veces.",
      buildsOn: "Tras los archivos, cubre los otros dos orígenes típicos: bases de datos y APIs.",
    },
    en: {
      plain: "Databases are read through JDBC or ODBC connectors; web services through REST calls. In both cases you must handle credentials, pagination, limits and which rows are new.",
      analogy: "Ordering from a supplier by phone: you need the number, a customer code and must not order the same thing twice.",
      buildsOn: "After files, it covers the other two typical sources: databases and APIs.",
    },
  },
  "m08-l5": {
    glossary: ["metadata", "quarantine", "rescued-data"],
    es: {
      plain: "Una buena ingesta añade metadatos (archivo de origen, hora de carga) y no tira los registros erróneos: los separa en cuarentena con el motivo para revisarlos.",
      analogy: "En control de calidad, los productos defectuosos no se tiran a la basura: se apartan con una etiqueta que explica el fallo.",
      buildsOn: "Cierra la ingesta batch preparando datos trazables para la capa bronze.",
    },
    en: {
      plain: "Good ingestion adds metadata (source file, load time) and does not discard bad records: it sets them aside in quarantine with the reason so they can be reviewed.",
      analogy: "In quality control, defective products are not thrown away: they are set aside with a label explaining the fault.",
      buildsOn: "It completes batch ingestion by preparing traceable data for the bronze layer.",
    },
  },
  "m09-l1": {
    glossary: ["auto-loader", "checkpoint", "object-storage"],
    es: {
      plain: "Auto Loader vigila una carpeta y procesa cada archivo nuevo exactamente una vez, guardando su progreso en un checkpoint. Escala a millones de archivos mejor que COPY INTO.",
      analogy: "Un buzón con contador: cada carta nueva se procesa y se anota, y si el proceso se interrumpe y vuelve a arrancar, sigue por la siguiente.",
      buildsOn: "Es la evolución de COPY INTO para volúmenes grandes y llegada continua.",
    },
    en: {
      plain: "Auto Loader watches a folder and processes each new file exactly once, saving its progress in a checkpoint. It scales to millions of files better than COPY INTO.",
      analogy: "A mailbox with a counter: each new letter is processed and logged, and if processing stops and restarts, it continues with the next one.",
      buildsOn: "It is the evolution of COPY INTO for large volumes and continuous arrival.",
    },
  },
  "m09-l2": {
    glossary: ["auto-loader", "object-storage"],
    es: {
      plain: "Auto Loader puede descubrir archivos nuevos listando la carpeta (directory listing) o recibiendo avisos de la nube cuando llega uno (file notification). El segundo escala mejor con carpetas enormes.",
      analogy: "Revisar el buzón cada rato frente a que el cartero llame al timbre cuando trae algo.",
      buildsOn: "Detalla cómo Auto Loader sabe qué archivos son nuevos.",
    },
    en: {
      plain: "Auto Loader can discover new files by listing the folder (directory listing) or by receiving cloud notifications when one arrives (file notification). The latter scales better with huge folders.",
      analogy: "Checking the mailbox every so often versus the postman ringing the bell whenever there is a delivery.",
      buildsOn: "It details how Auto Loader knows which files are new.",
    },
  },
  "m09-l3": {
    glossary: ["schema-evolution", "rescued-data", "table-schema"],
    es: {
      plain: "Auto Loader puede deducir el esquema, aceptar pistas (hints) sobre tipos y decidir qué hacer cuando aparece una columna nueva: añadirla, fallar o guardarla en `_rescued_data`.",
      analogy: "Un formulario que se adapta: si un cliente añade un campo, decides si lo incorporas al formulario o lo guardas aparte para revisarlo.",
      buildsOn: "Aplica schema evolution (módulo 6) a la ingesta continua.",
    },
    en: {
      plain: "Auto Loader can infer the schema, accept hints about types and decide what to do when a new column appears: add it, fail or keep it in `_rescued_data`.",
      analogy: "A form that adapts: if a customer adds a field, you decide whether to add it to the form or keep it aside for review.",
      buildsOn: "It applies schema evolution (module 6) to continuous ingestion.",
    },
  },
  "m09-l4": {
    glossary: ["lakeflow-connect", "cdc", "oltp"],
    es: {
      plain: "Lakeflow Connect ofrece conectores gestionados para traer datos de aplicaciones (como Salesforce) y bases de datos sin programar la extracción. Tú configuras origen y destino; la plataforma mantiene la carga incremental.",
      analogy: "Contratar una empresa de mudanzas con ruta fija en lugar de alquilar una furgoneta y hacer tú cada viaje.",
      buildsOn: "Complementa Auto Loader (archivos) con orígenes que no son archivos.",
    },
    en: {
      plain: "Lakeflow Connect provides managed connectors to bring data from applications (such as Salesforce) and databases without coding the extraction. You configure source and target; the platform keeps the load incremental.",
      analogy: "Hiring a removal company with a fixed route instead of renting a van and doing every trip yourself.",
      buildsOn: "It complements Auto Loader (files) with sources that are not files.",
    },
  },
  "m09-l5": {
    glossary: ["latency-freshness", "auto-loader", "copy-into", "lakeflow-connect"],
    es: {
      plain: "Para elegir herramienta de ingesta, pregunta: ¿de dónde viene el dato, cuánto llega, con qué frescura y qué control necesitas? Con esas cuatro respuestas, COPY INTO, Auto Loader o Lakeflow Connect se ordenan solos.",
      analogy: "Elegir entre bicicleta, furgoneta o camión según la carga, la distancia y la prisa.",
      buildsOn: "Resume los módulos 8 y 9 en una matriz de decisión.",
    },
    en: {
      plain: "To pick an ingestion tool, ask: where does the data come from, how much arrives, with what freshness and how much control do you need? With those four answers, COPY INTO, Auto Loader or Lakeflow Connect fall into place.",
      analogy: "Choosing between a bike, a van or a lorry depending on load, distance and urgency.",
      buildsOn: "It summarises modules 8 and 9 into a decision matrix.",
    },
  },
  "m10-l1": {
    glossary: ["lakeflow-jobs", "task", "data-pipeline"],
    es: {
      plain: "Un job define qué tareas ejecutar y en qué orden; cada ejecución concreta es un run. Las dependencias entre tareas forman un grafo que decide qué va en paralelo y qué espera.",
      analogy: "Una receta (job) que cocinas varios días (runs), donde algunos pasos se hacen a la vez y otros esperan a que termine el anterior.",
      buildsOn: "Automatiza los notebooks parametrizados del módulo 3 y las cargas de los módulos 8 y 9.",
    },
    en: {
      plain: "A job defines which tasks to run and in what order; each concrete execution is a run. Dependencies between tasks form a graph that decides what runs in parallel and what waits.",
      analogy: "A recipe (job) you cook on several days (runs), where some steps happen at once and others wait for the previous one.",
      buildsOn: "It automates module 3's parameterised notebooks and the loads from modules 8 and 9.",
    },
  },
  "m10-l2": {
    glossary: ["task", "notebook", "lakeflow-pipelines"],
    es: {
      plain: "Una tarea puede ejecutar un notebook, un script Python, una consulta SQL, un pipeline declarativo u otro job. Elegir el tipo adecuado simplifica el mantenimiento.",
      analogy: "En una obra, cada encargo lo hace el oficio adecuado: fontanero, electricista o pintor.",
      buildsOn: "Detalla qué puede contener cada nodo del grafo del job.",
    },
    en: {
      plain: "A task can run a notebook, a Python script, a SQL query, a declarative pipeline or another job. Choosing the right type simplifies maintenance.",
      analogy: "On a building site each job goes to the right trade: plumber, electrician or painter.",
      buildsOn: "It details what each node of the job graph can contain.",
    },
  },
  "m10-l3": {
    glossary: ["task-values", "lakeflow-jobs"],
    es: {
      plain: "Los parámetros del job llegan a todas las tareas; los task values permiten que una tarea pase un resultado pequeño a las siguientes, como el número de filas procesadas.",
      analogy: "Una nota que pasa de mano en mano en una cadena de montaje: «este lote tiene 120 piezas».",
      buildsOn: "Lleva los widgets del módulo 3 al nivel de job y conecta tareas entre sí.",
    },
    en: {
      plain: "Job parameters reach every task; task values let one task pass a small result to the next ones, such as the number of rows processed.",
      analogy: "A note passed hand to hand along an assembly line: “this batch has 120 parts”.",
      buildsOn: "It lifts module 3's widgets to the job level and connects tasks to each other.",
    },
  },
  "m10-l4": {
    glossary: ["file-arrival-trigger", "latency-freshness", "sla-slo"],
    es: {
      plain: "Un job puede arrancar a una hora (schedule), al llegar archivos nuevos (file arrival) o cuando cambia una tabla (table update). Lo ideal es arrancar cuando el dato está listo, no a ciegas.",
      analogy: "Ir a recoger un paquete a una hora fija frente a ir cuando te avisan de que ha llegado.",
      buildsOn: "Decide cuándo se ejecuta el grafo que ya sabes construir.",
    },
    en: {
      plain: "A job can start at a set time (schedule), when new files arrive (file arrival) or when a table changes (table update). Ideally it starts when the data is ready, not blindly.",
      analogy: "Collecting a parcel at a fixed time versus going when you are told it has arrived.",
      buildsOn: "It decides when the graph you already know how to build runs.",
    },
  },
  "m10-l5": {
    glossary: ["repair-run", "idempotency", "lakeflow-jobs"],
    es: {
      plain: "Los fallos ocurren: los reintentos repiten una tarea automáticamente, los timeouts cortan las que se cuelgan y las notificaciones avisan a la persona responsable. Todo esto solo es seguro si las tareas son idempotentes.",
      analogy: "Un despertador con repetición, un temporizador de horno y un aviso al móvil si algo se quema.",
      buildsOn: "Cierra el módulo haciendo que el job sea operable cuando algo sale mal.",
    },
    en: {
      plain: "Failures happen: retries repeat a task automatically, timeouts stop the ones that hang and notifications alert the person in charge. All of this is only safe if tasks are idempotent.",
      analogy: "An alarm clock with snooze, an oven timer and a phone alert if something burns.",
      buildsOn: "It closes the module by making the job operable when something goes wrong.",
    },
  },
  "m11-l1": {
    glossary: ["metastore", "catalog", "schema", "unity-catalog"],
    es: {
      plain: "Todo objeto tiene un nombre de tres partes: `catalog.schema.objeto`. El catálogo suele separar entornos o dominios, el schema agrupa por tema o capa, y el objeto es la tabla, vista o volumen.",
      analogy: "Una dirección postal: ciudad, calle y número. Con las tres partes no hay ambigüedad.",
      buildsOn: "Formaliza el metastore del módulo 1 y da nombre estable a las tablas de medallion.",
    },
    en: {
      plain: "Every object has a three-part name: `catalog.schema.object`. The catalog usually separates environments or domains, the schema groups by topic or layer, and the object is the table, view or volume.",
      analogy: "A postal address: city, street and number. With all three parts there is no ambiguity.",
      buildsOn: "It formalises module 1's metastore and gives medallion tables stable names.",
    },
  },
  "m11-l2": {
    glossary: ["privilege", "least-privilege", "service-principal"],
    es: {
      plain: "Para usar un objeto necesitas permisos en cada nivel: USE CATALOG, USE SCHEMA y, por ejemplo, SELECT en la tabla. Los permisos se heredan hacia abajo y las automatizaciones usan service principals, no cuentas personales.",
      analogy: "Para entrar en un despacho necesitas llave del edificio, de la planta y de la puerta.",
      buildsOn: "Añade control de acceso a la jerarquía de nombres de la lección anterior.",
    },
    en: {
      plain: "To use an object you need permissions at each level: USE CATALOG, USE SCHEMA and, for example, SELECT on the table. Permissions inherit downwards, and automations use service principals, not personal accounts.",
      analogy: "To enter an office you need keys to the building, the floor and the door.",
      buildsOn: "It adds access control to the previous lesson's naming hierarchy.",
    },
  },
  "m11-l3": {
    glossary: ["external-location", "storage-credential", "volume"],
    es: {
      plain: "Para acceder a archivos de forma gobernada, Unity Catalog usa storage credentials (la identidad cloud), external locations (la ruta permitida) y volúmenes (carpetas con permisos). Nadie necesita claves en el código.",
      analogy: "Una tarjeta de acceso (credential) que abre solo ciertas salas (locations), con taquillas asignadas (volumes).",
      buildsOn: "Extiende los permisos de tablas a los archivos del object storage.",
    },
    en: {
      plain: "To access files in a governed way, Unity Catalog uses storage credentials (the cloud identity), external locations (the allowed path) and volumes (folders with permissions). Nobody needs keys in code.",
      analogy: "An access card (credential) that opens only certain rooms (locations), with assigned lockers (volumes).",
      buildsOn: "It extends table permissions to files in object storage.",
    },
  },
  "m11-l4": {
    glossary: ["git-folders", "ci-cd", "notebook"],
    es: {
      plain: "Con Git folders cada persona trabaja en su rama, propone cambios con un pull request y otra persona los revisa antes de fusionarlos. Así producción solo recibe código revisado.",
      analogy: "Escribir un borrador, pedir a un compañero que lo revise y publicar solo la versión aprobada.",
      buildsOn: "Lleva la colaboración del módulo 3 a un flujo formal con ramas y revisiones.",
    },
    en: {
      plain: "With Git folders each person works on a branch, proposes changes through a pull request and someone else reviews them before merging. Production only receives reviewed code.",
      analogy: "Writing a draft, asking a colleague to review it and publishing only the approved version.",
      buildsOn: "It turns module 3's collaboration into a formal flow with branches and reviews.",
    },
  },
  "m11-l5": {
    glossary: ["declarative-automation-bundles", "ci-cd", "databricks-cli"],
    es: {
      plain: "Un bundle describe en YAML tus jobs y pipelines, con un target por entorno (dev, prod) y variables que cambian entre ellos. El mismo código se despliega en todos lados con un comando.",
      analogy: "Una plantilla de evento que sirve para Madrid o Lisboa cambiando solo la dirección y la fecha.",
      buildsOn: "Une Git, jobs y permisos en un despliegue repetible entre entornos.",
    },
    en: {
      plain: "A bundle describes your jobs and pipelines in YAML, with one target per environment (dev, prod) and variables that change between them. The same code is deployed everywhere with one command.",
      analogy: "An event template that works for Madrid or Lisbon by changing only the address and date.",
      buildsOn: "It ties together Git, jobs and permissions in a repeatable deployment across environments.",
    },
  },
  "m12-l1": {
    glossary: ["data-contract", "sla-slo"],
    es: {
      plain: "Todo proyecto empieza por entender qué se pide: quién usará el resultado, qué debe garantizar y cómo sabrás que está terminado. Los criterios de aceptación convierten eso en comprobaciones.",
      analogy: "Antes de construir una casa, se acuerda el plano y qué inspecciones debe pasar.",
      buildsOn: "Arranca el proyecto Associate que integra los módulos 1 a 11.",
    },
    en: {
      plain: "Every project starts by understanding the ask: who will use the result, what it must guarantee and how you will know it is done. Acceptance criteria turn that into checks.",
      analogy: "Before building a house, you agree on the plan and which inspections it must pass.",
      buildsOn: "It kicks off the Associate project that integrates modules 1 to 11.",
    },
  },
  "m12-l2": {
    glossary: ["lakehouse", "unity-catalog", "least-privilege"],
    es: {
      plain: "Dibuja la arquitectura antes de programar: capas, tablas, compute y permisos mínimos desde el primer día. Añadir seguridad al final siempre sale más caro.",
      analogy: "Poner las cerraduras mientras se construye la casa, no después de mudarse.",
      buildsOn: "Aplica medallion (m07) y Unity Catalog (m11) al caso del proyecto.",
    },
    en: {
      plain: "Draw the architecture before coding: layers, tables, compute and minimum permissions from day one. Adding security at the end is always more expensive.",
      analogy: "Fitting the locks while the house is being built, not after moving in.",
      buildsOn: "It applies medallion (m07) and Unity Catalog (m11) to the project case.",
    },
  },
  "m12-l3": {
    glossary: ["data-pipeline", "auto-loader", "merge"],
    es: {
      plain: "Construye el pipeline paso a paso: ingesta a bronze, limpieza a silver, modelo gold y un job que lo orqueste. Comprueba cada capa antes de pasar a la siguiente.",
      analogy: "Montar un mueble siguiendo las instrucciones y comprobando que cada pieza encaja antes de seguir.",
      buildsOn: "Pone en práctica ingesta (m08–m09), transformación (m04) y Delta (m06).",
    },
    en: {
      plain: "Build the pipeline step by step: ingestion to bronze, cleaning to silver, a gold model and a job to orchestrate it. Check each layer before moving to the next.",
      analogy: "Assembling furniture by following the instructions and checking each piece fits before continuing.",
      buildsOn: "It puts ingestion (m08–m09), transformation (m04) and Delta (m06) into practice.",
    },
  },
  "m12-l4": {
    glossary: ["data-testing", "data-quality", "lakeflow-jobs"],
    es: {
      plain: "Un pipeline no está terminado hasta que se prueba, se puede operar y está documentado: qué hace, cómo se ejecuta, qué hacer si falla y quién es responsable.",
      analogy: "Un coche nuevo pasa la ITV y lleva manual de instrucciones antes de salir a la calle.",
      buildsOn: "Añade calidad, operación (m10) y documentación a lo construido.",
    },
    en: {
      plain: "A pipeline is not finished until it is tested, operable and documented: what it does, how it runs, what to do if it fails and who is responsible.",
      analogy: "A new car passes its inspection and comes with a manual before going on the road.",
      buildsOn: "It adds quality, operations (m10) and documentation to what was built.",
    },
  },
  "m12-l5": {
    glossary: ["lakehouse", "data-pipeline"],
    es: {
      plain: "Revisa qué salió bien y qué no, y mide tu preparación con un simulacro. Los errores del simulacro indican qué módulos repasar, no son un examen final.",
      analogy: "Un partido de entrenamiento antes de la competición: sirve para ver dónde fallas.",
      buildsOn: "Cierra la ruta Associate y prepara el salto a la ruta Professional.",
    },
    en: {
      plain: "Review what went well and what did not, and measure your readiness with a practice exam. Practice mistakes point to which modules to revisit; they are not a final exam.",
      analogy: "A friendly match before the tournament: it shows where you are weak.",
      buildsOn: "It closes the Associate path and prepares the move to the Professional path.",
    },
  },
} satisfies Record<string, LessonEssentialsSource>;

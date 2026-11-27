/**
 * Página «Fundamentos»: recorrido previo al módulo 1 que construye, capítulo a
 * capítulo, el vocabulario mínimo para entender un lakehouse. El contenido es
 * editorial y versionado aquí; los IDs de capítulo son anclas públicas
 * (`/fundamentos#id`) referenciadas desde el glosario.
 */

export type FoundationExample =
  | { kind: "table"; caption: string; columns: string[]; rows: string[][] }
  | { kind: "code"; language: string; caption: string; code: string };

export type FoundationChapterText = {
  title: string;
  /** Qué sabrás al terminar el capítulo. */
  goal: string;
  body: string[];
  analogy: string;
  example: FoundationExample;
  /** Resumen memorable en una frase. */
  oneLiner: string;
  check: { question: string; answer: string };
};

export type FoundationChapter = {
  id: string;
  /** IDs del glosario relacionados. */
  glossary: string[];
  /** Módulos del temario donde se profundiza. */
  modules: string[];
  es: FoundationChapterText;
  en: FoundationChapterText;
};

export const foundationChapters: FoundationChapter[] = [
  {
    id: "datos",
    glossary: ["data", "row-column", "table", "data-type", "primary-key", "table-schema"],
    modules: ["m04"],
    es: {
      title: "Datos, tablas y tipos",
      goal: "Reconocer filas, columnas, tipos y claves en cualquier conjunto de datos.",
      body: [
        "Un **dato** es un hecho concreto: un importe, una fecha, un identificador. Por sí solo dice poco; cobra sentido cuando lo organizamos junto a otros.",
        "La forma más común de organizarlos es una **tabla**: cada **fila** representa una cosa o un suceso (un pedido) y cada **columna** una característica que comparten todas las filas (el importe, la fecha).",
        "Cada columna tiene un **tipo** (texto, número, fecha…) que decide qué operaciones tienen sentido. Y casi toda tabla útil tiene una **clave**: una columna que identifica cada fila sin ambigüedad.",
        "El conjunto de columnas, tipos y reglas de una tabla es su **esquema**. Es el primer «contrato» entre quien produce los datos y quien los usa.",
      ],
      analogy: "Una hoja de cálculo bien hecha: cada fila es un registro, cada columna tiene un encabezado claro y nadie escribe texto en la columna de importes.",
      example: {
        kind: "table",
        caption: "Tabla «pedidos»: clave `order_id`, tipos entero, decimal y fecha.",
        columns: ["order_id (INT)", "customer_id (INT)", "amount (DECIMAL)", "order_date (DATE)"],
        rows: [
          ["1042", "7", "59.90", "2026-03-03"],
          ["1043", "12", "18.50", "2026-03-03"],
          ["1044", "7", "120.00", "2026-03-04"],
        ],
      },
      oneLiner: "Filas para cada cosa, columnas para cada característica, tipos para que los valores tengan sentido y una clave para no confundir filas.",
      check: {
        question: "En la tabla de ejemplo, ¿qué columna usarías para detectar pedidos duplicados y por qué?",
        answer: "`order_id`, porque es la clave: identifica cada pedido de forma única. Si aparece dos veces, hay un duplicado.",
      },
    },
    en: {
      title: "Data, tables and types",
      goal: "Recognise rows, columns, types and keys in any dataset.",
      body: [
        "A piece of **data** is a concrete fact: an amount, a date, an identifier. On its own it says little; it gains meaning when organised together with others.",
        "The most common way to organise data is a **table**: each **row** represents one thing or event (an order) and each **column** a characteristic shared by every row (the amount, the date).",
        "Each column has a **type** (text, number, date…) that decides which operations make sense. And almost every useful table has a **key**: a column that identifies each row unambiguously.",
        "A table's set of columns, types and rules is its **schema**. It is the first “contract” between whoever produces the data and whoever uses it.",
      ],
      analogy: "A well-built spreadsheet: each row is a record, each column has a clear header and nobody types text into the amounts column.",
      example: {
        kind: "table",
        caption: "“orders” table: key `order_id`; integer, decimal and date types.",
        columns: ["order_id (INT)", "customer_id (INT)", "amount (DECIMAL)", "order_date (DATE)"],
        rows: [
          ["1042", "7", "59.90", "2026-03-03"],
          ["1043", "12", "18.50", "2026-03-03"],
          ["1044", "7", "120.00", "2026-03-04"],
        ],
      },
      oneLiner: "Rows for each thing, columns for each characteristic, types so values make sense and a key so rows are never confused.",
      check: {
        question: "In the example table, which column would you use to detect duplicate orders, and why?",
        answer: "`order_id`, because it is the key: it uniquely identifies each order. If it appears twice, there is a duplicate.",
      },
    },
  },
  {
    id: "archivos",
    glossary: ["csv", "json", "parquet", "columnar-format", "object-storage"],
    modules: ["m01", "m08"],
    es: {
      title: "Archivos y formatos",
      goal: "Distinguir formatos de texto y columnares, y saber por qué Parquet domina en analítica.",
      body: [
        "Las tablas se guardan, al final, en **archivos**. El formato del archivo decide cuánto ocupa, qué información conserva y lo rápido que se lee.",
        "**CSV** y **JSON** son texto: fáciles de leer por una persona y muy comunes para intercambiar datos, pero no guardan tipos fiables y ocupan mucho. JSON admite estructuras anidadas, como una lista de productos dentro de un pedido.",
        "**Parquet** es binario y **columnar**: guarda juntos los valores de cada columna, los comprime y apunta estadísticas como el mínimo y el máximo. Si una consulta solo necesita dos columnas de cincuenta, solo lee esas dos.",
        "En la nube, estos archivos viven en un **almacenamiento de objetos** (S3, ADLS, GCS): muy barato, duradero y prácticamente ilimitado.",
      ],
      analogy: "Un CSV es como una carta manuscrita: cualquiera la lee, pero hay que interpretarla. Parquet es un archivador por secciones: si buscas solo facturas, abres solo ese cajón.",
      example: {
        kind: "code",
        language: "CSV · JSON",
        caption: "El mismo pedido en CSV y en JSON. Parquet guardaría lo mismo en binario, por columnas y con tipos.",
        code: "# CSV\norder_id,customer_id,amount\n1042,7,59.90\n\n# JSON\n{\"order_id\": 1042, \"customer_id\": 7, \"items\": [{\"sku\": \"A1\", \"qty\": 2}]}",
      },
      oneLiner: "Texto para intercambiar, columnar para analizar: Parquet lee solo lo que necesitas.",
      check: {
        question: "Una consulta calcula la media de `amount` sobre 100 millones de filas con 40 columnas. ¿Por qué es mucho más rápida en Parquet que en CSV?",
        answer: "Porque Parquet es columnar: lee solo la columna `amount` (y comprimida), mientras que con CSV hay que leer y separar todas las columnas de cada línea.",
      },
    },
    en: {
      title: "Files and formats",
      goal: "Tell text and columnar formats apart, and know why Parquet dominates analytics.",
      body: [
        "Tables are ultimately stored in **files**. The file format decides how much space they take, what information they keep and how fast they are read.",
        "**CSV** and **JSON** are text: easy for a person to read and very common for exchanging data, but they do not keep reliable types and take a lot of space. JSON supports nested structures, such as a list of products inside an order.",
        "**Parquet** is binary and **columnar**: it stores each column's values together, compresses them and records statistics such as minimum and maximum. If a query needs only two of fifty columns, it reads only those two.",
        "In the cloud, these files live in **object storage** (S3, ADLS, GCS): very cheap, durable and practically unlimited.",
      ],
      analogy: "A CSV is like a handwritten letter: anyone can read it, but it must be interpreted. Parquet is a filing cabinet by section: if you only want invoices, you open only that drawer.",
      example: {
        kind: "code",
        language: "CSV · JSON",
        caption: "The same order in CSV and JSON. Parquet would store the same data in binary, by column and with types.",
        code: "# CSV\norder_id,customer_id,amount\n1042,7,59.90\n\n# JSON\n{\"order_id\": 1042, \"customer_id\": 7, \"items\": [{\"sku\": \"A1\", \"qty\": 2}]}",
      },
      oneLiner: "Text to exchange, columnar to analyse: Parquet reads only what you need.",
      check: {
        question: "A query averages `amount` over 100 million rows with 40 columns. Why is it much faster on Parquet than on CSV?",
        answer: "Because Parquet is columnar: it reads only the `amount` column (compressed), whereas with CSV every column of every line must be read and split.",
      },
    },
  },
  {
    id: "sql",
    glossary: ["sql", "join", "aggregation", "window-function"],
    modules: ["m03", "m04"],
    es: {
      title: "SQL: hacer preguntas a los datos",
      goal: "Leer una consulta SQL básica: elegir, filtrar, agrupar y unir.",
      body: [
        "**SQL** es el idioma estándar para preguntar a las tablas. Es **declarativo**: describes el resultado que quieres y el motor decide cómo calcularlo.",
        "Cuatro piezas cubren la mayoría de preguntas: `SELECT` elige columnas, `WHERE` filtra filas, `GROUP BY` resume grupos (sumas, recuentos) y `JOIN` combina tablas por una clave.",
        "Un **join** mal planteado es la fuente de errores más común: si la clave no es única en uno de los lados, las filas se multiplican sin ningún aviso.",
        "En Databricks escribirás SQL directamente o su equivalente en Python con PySpark; ambos se traducen al mismo plan de ejecución.",
      ],
      analogy: "Pedir en un restaurante: dices qué plato quieres (SELECT), sin cebolla (WHERE), para compartir por mesa (GROUP BY). No le dices al cocinero en qué orden cortar.",
      example: {
        kind: "code",
        language: "SQL",
        caption: "Gasto total por país en marzo: filtra, une, agrupa y ordena.",
        code: "SELECT c.country, sum(o.amount) AS revenue\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nWHERE o.order_date >= '2026-03-01'\nGROUP BY c.country\nORDER BY revenue DESC;",
      },
      oneLiner: "SQL describe qué quieres; el motor decide cómo conseguirlo.",
      check: {
        question: "Si `customers` tuviera dos filas con el mismo `id`, ¿qué le pasaría al resultado de la consulta de ejemplo?",
        answer: "Los pedidos de ese cliente se contarían dos veces, porque el JOIN emparejaría cada pedido con las dos filas. Por eso la clave del lado de dimensión debe ser única.",
      },
    },
    en: {
      title: "SQL: asking questions of data",
      goal: "Read a basic SQL query: select, filter, group and join.",
      body: [
        "**SQL** is the standard language for asking tables questions. It is **declarative**: you describe the result you want and the engine decides how to compute it.",
        "Four pieces cover most questions: `SELECT` picks columns, `WHERE` filters rows, `GROUP BY` summarises groups (sums, counts) and `JOIN` combines tables on a key.",
        "A badly designed **join** is the most common source of errors: if the key is not unique on one side, rows multiply without any warning.",
        "In Databricks you will write SQL directly or its Python equivalent with PySpark; both translate into the same execution plan.",
      ],
      analogy: "Ordering at a restaurant: you say which dish you want (SELECT), without onion (WHERE), shared per table (GROUP BY). You do not tell the chef in which order to chop.",
      example: {
        kind: "code",
        language: "SQL",
        caption: "Total spend per country in March: filter, join, group and sort.",
        code: "SELECT c.country, sum(o.amount) AS revenue\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nWHERE o.order_date >= '2026-03-01'\nGROUP BY c.country\nORDER BY revenue DESC;",
      },
      oneLiner: "SQL describes what you want; the engine decides how to get it.",
      check: {
        question: "If `customers` had two rows with the same `id`, what would happen to the example query's result?",
        answer: "That customer's orders would be counted twice, because the JOIN would match each order with both rows. That is why the key on the dimension side must be unique.",
      },
    },
  },
  {
    id: "oltp-olap",
    glossary: ["oltp", "olap", "cdc"],
    modules: ["m01", "m08"],
    es: {
      title: "Sistemas que operan y sistemas que analizan",
      goal: "Entender por qué los datos se copian de las aplicaciones a una plataforma analítica.",
      body: [
        "Las aplicaciones del día a día (la tienda online, el CRM) usan bases de datos **OLTP**: muchas operaciones pequeñas y rápidas sobre filas concretas, como «crear el pedido 1044».",
        "Las preguntas de negocio son distintas: «¿cuánto vendimos por país en cinco años?». Son cargas **OLAP**: leen y agregan millones de filas.",
        "Si lanzas consultas OLAP contra la base OLTP, la ralentizas y afectas a los clientes. Por eso los datos se **copian** (ingieren) a una plataforma analítica pensada para ese trabajo.",
        "Para no copiar todo cada vez, se capturan solo los cambios (**CDC**): qué filas se insertaron, actualizaron o borraron desde la última vez.",
      ],
      analogy: "La caja registradora de una tienda (OLTP) cobra rápido una compra tras otra. El informe anual de ventas (OLAP) se hace en la oficina, no en la caja mientras hay cola.",
      example: {
        kind: "table",
        caption: "Dos tipos de carga sobre los mismos datos.",
        columns: ["", "OLTP", "OLAP"],
        rows: [
          ["Operación típica", "Insertar o actualizar un pedido", "Sumar ventas de 5 años"],
          ["Filas por operación", "Una o pocas", "Millones"],
          ["Prioridad", "Latencia de milisegundos", "Leer mucho de forma eficiente"],
        ],
      },
      oneLiner: "Las aplicaciones operan en OLTP; el análisis se hace en una copia optimizada para OLAP.",
      check: {
        question: "¿Por qué no basta con conectar los dashboards directamente a la base de datos de la tienda online?",
        answer: "Porque las consultas analíticas son pesadas y competirían con las ventas en tiempo real, además de que la base OLTP no está optimizada para recorrer millones de filas.",
      },
    },
    en: {
      title: "Systems that operate and systems that analyse",
      goal: "Understand why data is copied from applications to an analytics platform.",
      body: [
        "Day-to-day applications (the online shop, the CRM) use **OLTP** databases: many small, fast operations on specific rows, such as “create order 1044”.",
        "Business questions are different: “how much did we sell per country over five years?”. These are **OLAP** workloads: they read and aggregate millions of rows.",
        "If you run OLAP queries against the OLTP database, you slow it down and affect customers. That is why data is **copied** (ingested) to an analytics platform built for that work.",
        "To avoid copying everything every time, only the changes are captured (**CDC**): which rows were inserted, updated or deleted since last time.",
      ],
      analogy: "A shop's till (OLTP) rings up one purchase after another quickly. The annual sales report (OLAP) is produced in the back office, not at the till while customers queue.",
      example: {
        kind: "table",
        caption: "Two kinds of workload on the same data.",
        columns: ["", "OLTP", "OLAP"],
        rows: [
          ["Typical operation", "Insert or update an order", "Sum 5 years of sales"],
          ["Rows per operation", "One or a few", "Millions"],
          ["Priority", "Millisecond latency", "Reading lots efficiently"],
        ],
      },
      oneLiner: "Applications operate on OLTP; analysis happens on a copy optimised for OLAP.",
      check: {
        question: "Why is it not enough to connect dashboards directly to the online shop's database?",
        answer: "Because analytical queries are heavy and would compete with real-time sales, and the OLTP database is not optimised to scan millions of rows.",
      },
    },
  },
  {
    id: "distribuido",
    glossary: ["distributed-computing", "apache-spark", "partition", "driver-executor", "dataframe"],
    modules: ["m04", "m05"],
    es: {
      title: "Procesamiento distribuido y Spark",
      goal: "Explicar cómo Spark reparte un trabajo grande entre muchas máquinas.",
      body: [
        "Cuando los datos son demasiados para un solo ordenador, se **reparten**: el conjunto se divide en trozos (**particiones**) y varias máquinas procesan cada trozo a la vez.",
        "**Apache Spark** automatiza ese reparto. Un **driver** planifica el trabajo y unos **executors** lo ejecutan sobre las particiones en paralelo.",
        "Trabajas con **DataFrames**: tablas distribuidas sobre las que encadenas operaciones. Spark no ejecuta nada hasta que pides un resultado; entonces optimiza el plan completo.",
        "Algunas operaciones, como agrupar por cliente o unir tablas, obligan a **mover datos** entre máquinas (shuffle). Es la parte más cara y la primera que se mira al optimizar.",
      ],
      analogy: "Contar los votos de unas elecciones: cada mesa cuenta los suyos a la vez (particiones) y una persona suma los resultados al final (driver).",
      example: {
        kind: "code",
        language: "PySpark",
        caption: "Nada se ejecuta hasta la última línea; entonces Spark reparte el trabajo.",
        code: "orders = spark.read.table(\"main.sales.orders\")      # describe la fuente\nlarge = orders.filter(\"amount > 100\")                # transformación\nby_day = large.groupBy(\"order_date\").count()          # transformación (shuffle)\nby_day.show()                                         # acción: ahora se ejecuta",
      },
      oneLiner: "Divide los datos, procesa las partes a la vez y combina el resultado: eso es Spark.",
      check: {
        question: "¿Por qué `groupBy(\"order_date\")` provoca mover datos entre máquinas?",
        answer: "Porque las filas de una misma fecha pueden estar en particiones distintas; para contarlas juntas hay que reunirlas en la misma máquina (shuffle).",
      },
    },
    en: {
      title: "Distributed processing and Spark",
      goal: "Explain how Spark splits a large job across many machines.",
      body: [
        "When there is too much data for one computer, it is **split**: the dataset is divided into chunks (**partitions**) and several machines process each chunk at the same time.",
        "**Apache Spark** automates that split. A **driver** plans the work and **executors** run it on the partitions in parallel.",
        "You work with **DataFrames**: distributed tables on which you chain operations. Spark runs nothing until you ask for a result; then it optimises the whole plan.",
        "Some operations, such as grouping by customer or joining tables, force **data movement** between machines (shuffle). It is the most expensive part and the first thing to look at when optimising.",
      ],
      analogy: "Counting election votes: each polling station counts its own at the same time (partitions) and one person adds up the results at the end (driver).",
      example: {
        kind: "code",
        language: "PySpark",
        caption: "Nothing runs until the last line; then Spark splits the work.",
        code: "orders = spark.read.table(\"main.sales.orders\")      # describes the source\nlarge = orders.filter(\"amount > 100\")                # transformation\nby_day = large.groupBy(\"order_date\").count()          # transformation (shuffle)\nby_day.show()                                         # action: now it runs",
      },
      oneLiner: "Split the data, process the parts at once and combine the result: that is Spark.",
      check: {
        question: "Why does `groupBy(\"order_date\")` cause data to move between machines?",
        answer: "Because rows for the same date may sit in different partitions; to count them together they must be brought to the same machine (shuffle).",
      },
    },
  },
  {
    id: "lake-warehouse",
    glossary: ["data-warehouse", "data-lake", "object-storage", "open-table-format"],
    modules: ["m01"],
    es: {
      title: "Data warehouse y data lake",
      goal: "Comparar las dos arquitecturas clásicas y sus límites.",
      body: [
        "Un **data warehouse** guarda tablas estructuradas con transacciones y un SQL muy rápido. Es fiable para informes, pero suele usar formatos propietarios, cuesta más y encaja mal con datos no estructurados o aprendizaje automático.",
        "Un **data lake** guarda cualquier archivo en almacenamiento de objetos a muy bajo coste. Es flexible y escala sin límite, pero sin control: no hay transacciones, el esquema no se respeta y es fácil acabar con archivos incoherentes.",
        "Durante años muchas empresas mantuvieron **ambos**: el lake para el bruto y el ML, y el warehouse para los informes, copiando datos de uno a otro. Eso duplica costes, retrasa los datos y crea dos versiones de la verdad.",
      ],
      analogy: "El warehouse es una biblioteca con catálogo y préstamo controlado, pero pequeña y cara. El lake es un trastero inmenso y barato donde todo cabe, pero nadie encuentra nada.",
      example: {
        kind: "table",
        caption: "Ventajas y límites de cada enfoque.",
        columns: ["", "Data warehouse", "Data lake"],
        rows: [
          ["Formato", "Propietario", "Archivos abiertos"],
          ["Garantías", "Transacciones y esquema", "Ninguna por defecto"],
          ["Coste de almacenamiento", "Alto", "Muy bajo"],
          ["Datos no estructurados y ML", "Limitado", "Natural"],
        ],
      },
      oneLiner: "El warehouse aporta orden; el lake, escala y apertura. Tener los dos por separado duplica el trabajo.",
      check: {
        question: "¿Qué problema principal aparece al mantener un data lake y un data warehouse con copias de los mismos datos?",
        answer: "Hay dos versiones de la verdad que pueden diferir, más coste de almacenamiento y pipelines extra para mantenerlas sincronizadas.",
      },
    },
    en: {
      title: "Data warehouse and data lake",
      goal: "Compare the two classic architectures and their limits.",
      body: [
        "A **data warehouse** stores structured tables with transactions and very fast SQL. It is reliable for reporting, but often uses proprietary formats, costs more and fits poorly with unstructured data or machine learning.",
        "A **data lake** stores any file on object storage very cheaply. It is flexible and scales without limit, but uncontrolled: no transactions, schemas are not enforced and inconsistent files pile up easily.",
        "For years many companies kept **both**: the lake for raw data and ML, the warehouse for reports, copying data between them. That doubles costs, delays data and creates two versions of the truth.",
      ],
      analogy: "The warehouse is a library with a catalogue and controlled lending, but small and expensive. The lake is a huge, cheap storage unit where everything fits but nobody finds anything.",
      example: {
        kind: "table",
        caption: "Strengths and limits of each approach.",
        columns: ["", "Data warehouse", "Data lake"],
        rows: [
          ["Format", "Proprietary", "Open files"],
          ["Guarantees", "Transactions and schema", "None by default"],
          ["Storage cost", "High", "Very low"],
          ["Unstructured data and ML", "Limited", "Natural"],
        ],
      },
      oneLiner: "The warehouse brings order; the lake brings scale and openness. Keeping both separately doubles the work.",
      check: {
        question: "What is the main problem of keeping a data lake and a data warehouse with copies of the same data?",
        answer: "There are two versions of the truth that may differ, plus extra storage cost and pipelines to keep them in sync.",
      },
    },
  },
  {
    id: "lakehouse",
    glossary: ["lakehouse", "delta-lake", "acid", "unity-catalog", "compute"],
    modules: ["m01", "m06", "m11"],
    es: {
      title: "Lakehouse: lo mejor de ambos",
      goal: "Identificar las tres capas de un lakehouse y qué aporta cada una.",
      body: [
        "Un **lakehouse** conserva los archivos abiertos y baratos del data lake y les añade las garantías del warehouse. Se apoya en tres capas que conviene distinguir siempre:",
        "**Almacenamiento con formato de tabla abierto** (Delta Lake): archivos Parquet más un registro de transacciones que da **ACID**, versiones y control de esquema.",
        "**Gobierno** (Unity Catalog): nombres, dueños, permisos, auditoría y linaje para cada tabla, sea cual sea el motor que la lea.",
        "**Compute** separado del almacenamiento: distintos motores (jobs de Spark, SQL warehouses) leen la misma copia de los datos y se encienden, escalan y apagan según la carga.",
      ],
      analogy: "El trastero del data lake con un bibliotecario (gobierno), un libro de registro de cada cambio (Delta) y salas de lectura que se abren solo cuando hay lectores (compute).",
      example: {
        kind: "table",
        caption: "Cuatro preguntas que separan las capas.",
        columns: ["Pregunta", "Quién responde"],
        rows: [
          ["¿Dónde están los bytes?", "Object storage (S3, ADLS, GCS)"],
          ["¿Qué archivos forman la tabla válida?", "Delta Lake (transaction log)"],
          ["¿Quién puede leerla?", "Unity Catalog"],
          ["¿Qué máquina calcula la consulta?", "Compute: cluster o SQL warehouse"],
        ],
      },
      oneLiner: "Una sola copia abierta y gobernada de los datos, leída por el compute que cada carga necesite.",
      check: {
        question: "Un analista recibe «permiso denegado» al leer una tabla. ¿Cuál de las capas debe revisarse primero?",
        answer: "El gobierno (Unity Catalog): el problema es de autorización, no de almacenamiento ni de compute.",
      },
    },
    en: {
      title: "Lakehouse: the best of both",
      goal: "Identify the three layers of a lakehouse and what each contributes.",
      body: [
        "A **lakehouse** keeps the data lake's open, cheap files and adds warehouse guarantees on top. It relies on three layers worth always telling apart:",
        "**Storage with an open table format** (Delta Lake): Parquet files plus a transaction log that provides **ACID**, versions and schema control.",
        "**Governance** (Unity Catalog): names, owners, permissions, auditing and lineage for every table, whatever engine reads it.",
        "**Compute** separate from storage: different engines (Spark jobs, SQL warehouses) read the same copy of the data and start, scale and stop according to the load.",
      ],
      analogy: "The data lake's storage unit with a librarian (governance), a ledger of every change (Delta) and reading rooms that open only when there are readers (compute).",
      example: {
        kind: "table",
        caption: "Four questions that separate the layers.",
        columns: ["Question", "Who answers"],
        rows: [
          ["Where are the bytes?", "Object storage (S3, ADLS, GCS)"],
          ["Which files form the valid table?", "Delta Lake (transaction log)"],
          ["Who may read it?", "Unity Catalog"],
          ["Which machine computes the query?", "Compute: cluster or SQL warehouse"],
        ],
      },
      oneLiner: "One open, governed copy of the data, read by whatever compute each workload needs.",
      check: {
        question: "An analyst gets “permission denied” when reading a table. Which layer should be checked first?",
        answer: "Governance (Unity Catalog): the problem is authorisation, not storage or compute.",
      },
    },
  },
  {
    id: "pipelines",
    glossary: ["etl", "elt", "data-pipeline", "batch-processing", "stream-processing", "medallion-architecture", "idempotency"],
    modules: ["m07", "m08", "m10", "m13"],
    es: {
      title: "Pipelines: ETL, batch, streaming y medallion",
      goal: "Describir cómo viajan los datos desde el origen hasta un dashboard.",
      body: [
        "Un **pipeline** es una cadena automática de pasos que mueve y transforma datos. El patrón clásico es **ETL**: extraer, transformar y cargar. En un lakehouse es habitual **ELT**: cargar primero el bruto y transformarlo dentro.",
        "Puede ejecutarse por **lotes** (batch: cada noche, cada hora) o en **streaming** (continuamente, procesando solo lo nuevo). La elección depende de la **frescura** que necesite quien consume los datos.",
        "La **arquitectura medallion** ordena las tablas en capas: **bronze** guarda el dato tal cual llega, **silver** lo limpia y deduplica, y **gold** lo modela para una pregunta de negocio.",
        "Todo pipeline fallará alguna vez. Por eso cada paso debe ser **idempotente**: si se repite con la misma entrada, el resultado es el mismo y no se duplican datos.",
      ],
      analogy: "Una depuradora: el agua entra del río (bronze), se filtra y trata (silver) y sale lista para el grifo (gold). Si un filtro se atasca, se repite ese tramo sin contaminar el depósito.",
      example: {
        kind: "code",
        language: "Diagrama",
        caption: "Un pipeline medallion típico, de archivo a dashboard.",
        code: "archivos JSON  ─▶  bronze.orders   (tal cual llega + metadatos)\n               ─▶  silver.orders   (tipado, sin duplicados, reglas de calidad)\n               ─▶  gold.daily_sales (ventas por día y país)\n               ─▶  dashboard",
      },
      oneLiner: "Bruto, limpio, listo para negocio: y cada paso se puede repetir sin miedo.",
      check: {
        question: "Un job de carga falla a mitad y se reintenta. ¿Qué propiedad evita que la tabla acabe con filas duplicadas?",
        answer: "La idempotencia del paso de escritura, por ejemplo usando MERGE por clave o una carga que recuerde qué archivos ya procesó.",
      },
    },
    en: {
      title: "Pipelines: ETL, batch, streaming and medallion",
      goal: "Describe how data travels from the source to a dashboard.",
      body: [
        "A **pipeline** is an automatic chain of steps that moves and transforms data. The classic pattern is **ETL**: extract, transform and load. In a lakehouse **ELT** is common: load the raw data first and transform it inside.",
        "It can run in **batches** (every night, every hour) or in **streaming** (continuously, processing only what is new). The choice depends on the **freshness** the data's consumers need.",
        "The **medallion architecture** orders tables in layers: **bronze** keeps data as it arrives, **silver** cleans and deduplicates it, and **gold** models it for a business question.",
        "Every pipeline will fail at some point. That is why each step must be **idempotent**: if it is repeated with the same input, the result is the same and no data is duplicated.",
      ],
      analogy: "A water treatment plant: water comes in from the river (bronze), is filtered and treated (silver) and leaves ready for the tap (gold). If a filter clogs, that stretch is repeated without polluting the tank.",
      example: {
        kind: "code",
        language: "Diagram",
        caption: "A typical medallion pipeline, from file to dashboard.",
        code: "JSON files  ─▶  bronze.orders    (as it arrives + metadata)\n            ─▶  silver.orders    (typed, deduplicated, quality rules)\n            ─▶  gold.daily_sales (sales by day and country)\n            ─▶  dashboard",
      },
      oneLiner: "Raw, clean, business-ready: and every step can be repeated without fear.",
      check: {
        question: "A load job fails halfway and is retried. Which property prevents the table from ending up with duplicate rows?",
        answer: "Idempotency of the write step, for example using MERGE by key or a load that remembers which files it already processed.",
      },
    },
  },
  {
    id: "gobierno",
    glossary: ["data-governance", "least-privilege", "data-quality", "data-contract", "metadata", "pii"],
    modules: ["m07", "m11", "m30"],
    es: {
      title: "Gobierno, calidad y confianza",
      goal: "Entender por qué los datos necesitan dueños, permisos y reglas de calidad.",
      body: [
        "Los datos solo son útiles si la gente **confía** en ellos. Eso exige tres cosas: saber quién es el **dueño** de cada tabla, controlar **quién puede verla** y comprobar que cumple **reglas de calidad**.",
        "El **gobierno** aplica el principio de **mínimo privilegio**: cada persona o proceso recibe solo los permisos que necesita. Los datos personales (**PII**) requieren además enmascarado, retención limitada y auditoría.",
        "La **calidad** se define con reglas explícitas (no nulos, rangos válidos, sin duplicados) y un **contrato de datos** que dice qué garantiza cada tabla y con qué frescura.",
        "Los **metadatos** (descripción, dueño, etiquetas, linaje) permiten encontrar la tabla correcta y saber de dónde viene cada cifra.",
      ],
      analogy: "Un supermercado de confianza: cada producto tiene etiqueta con fabricante y caducidad (metadatos y contrato), inspecciones sanitarias (calidad) y el almacén solo lo abre el personal autorizado (permisos).",
      example: {
        kind: "code",
        language: "SQL",
        caption: "Permisos mínimos y una regla de calidad expresados como código.",
        code: "-- Solo el grupo de analistas puede leer la tabla de ventas\nGRANT SELECT ON TABLE main.gold.daily_sales TO `analysts`;\n\n-- Regla de calidad: ningún pedido sin identificador ni con importe negativo\nSELECT count(*) AS bad_rows\nFROM main.silver.orders\nWHERE order_id IS NULL OR amount < 0;",
      },
      oneLiner: "Dueño claro, acceso mínimo y reglas comprobables: así se gana la confianza en los datos.",
      check: {
        question: "Un equipo nuevo necesita las ventas diarias agregadas. ¿Le das acceso a la tabla de pedidos con emails de clientes?",
        answer: "No: aplicando mínimo privilegio, se le concede SELECT solo sobre la tabla gold agregada, que no contiene datos personales.",
      },
    },
    en: {
      title: "Governance, quality and trust",
      goal: "Understand why data needs owners, permissions and quality rules.",
      body: [
        "Data is only useful if people **trust** it. That takes three things: knowing who **owns** each table, controlling **who can see it** and checking that it meets **quality rules**.",
        "**Governance** applies the principle of **least privilege**: each person or process gets only the permissions it needs. Personal data (**PII**) also requires masking, limited retention and auditing.",
        "**Quality** is defined with explicit rules (not null, valid ranges, no duplicates) and a **data contract** stating what each table guarantees and how fresh it is.",
        "**Metadata** (description, owner, tags, lineage) lets you find the right table and know where every figure comes from.",
      ],
      analogy: "A trustworthy supermarket: every product has a label with maker and expiry date (metadata and contract), health inspections (quality) and only authorised staff can open the stockroom (permissions).",
      example: {
        kind: "code",
        language: "SQL",
        caption: "Minimum permissions and a quality rule expressed as code.",
        code: "-- Only the analysts group can read the sales table\nGRANT SELECT ON TABLE main.gold.daily_sales TO `analysts`;\n\n-- Quality rule: no order without an id or with a negative amount\nSELECT count(*) AS bad_rows\nFROM main.silver.orders\nWHERE order_id IS NULL OR amount < 0;",
      },
      oneLiner: "Clear owner, minimal access and testable rules: that is how trust in data is earned.",
      check: {
        question: "A new team needs aggregated daily sales. Do you give them access to the orders table with customer emails?",
        answer: "No: applying least privilege, they get SELECT only on the aggregated gold table, which contains no personal data.",
      },
    },
  },
];

/** Cómo continúa el recorrido tras los fundamentos. */
export const foundationNextSteps: { modules: string[]; es: string; en: string }[] = [
  { modules: ["m01", "m02", "m03"], es: "Plataforma: arquitectura, compute y entorno de trabajo.", en: "Platform: architecture, compute and workspace." },
  { modules: ["m04", "m05", "m06"], es: "Procesamiento: DataFrames, Spark por dentro y tablas Delta.", en: "Processing: DataFrames, Spark internals and Delta tables." },
  { modules: ["m07", "m08", "m09"], es: "Diseño e ingesta: medallion, cargas batch e incrementales.", en: "Design and ingestion: medallion, batch and incremental loads." },
  { modules: ["m10", "m11", "m12"], es: "Producción: jobs, gobierno, CI/CD y proyecto Associate.", en: "Production: jobs, governance, CI/CD and the Associate project." },
];

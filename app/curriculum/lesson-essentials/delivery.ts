import type { LessonEssentialsSource } from "../content-types";

/** «Lo esencial» de los módulos m28–m32 (entrega, seguridad, interoperabilidad y proyecto final). */
export const deliveryEssentials = {
  "m28-l1": {
    glossary: ["python-wheel", "data-testing", "dataframe"],
    es: {
      plain: "Separa el código en dos partes: funciones que transforman DataFrames (lógica pura) y funciones que leen o escriben tablas (I/O). La lógica pura se puede probar sin tocar datos reales.",
      analogy: "En una cocina, la receta se prueba con ingredientes de muestra; el reparto a domicilio es otro proceso aparte.",
      buildsOn: "Profesionaliza la modularidad de notebooks del módulo 3.",
    },
    en: {
      plain: "Split code into two parts: functions that transform DataFrames (pure logic) and functions that read or write tables (I/O). Pure logic can be tested without touching real data.",
      analogy: "In a kitchen, the recipe is tested with sample ingredients; home delivery is a separate process.",
      buildsOn: "It professionalises module 3's notebook modularity.",
    },
  },
  "m28-l2": {
    glossary: ["python-wheel", "databricks-runtime"],
    es: {
      plain: "Empaquetar el código como wheel y fijar las versiones de sus dependencias garantiza que se despliega exactamente lo que se probó, sin sorpresas por actualizaciones.",
      analogy: "Enviar un mueble con todas sus piezas y tornillos numerados, no «busca tornillos parecidos».",
      buildsOn: "Amplía los entornos reproducibles del módulo 3.",
    },
    en: {
      plain: "Packaging code as a wheel and pinning its dependencies' versions ensures you deploy exactly what was tested, with no surprises from upgrades.",
      analogy: "Shipping furniture with all its parts and numbered screws, not “find similar screws”.",
      buildsOn: "It extends module 3's reproducible environments.",
    },
  },
  "m28-l3": {
    glossary: ["dataframe", "idempotency", "data-testing"],
    es: {
      plain: "Una función de transformación pura recibe DataFrames y devuelve DataFrames, sin leer tablas, sin fechas «de hoy» escondidas y sin efectos secundarios. Con la misma entrada, siempre da la misma salida.",
      analogy: "Una calculadora: 2 + 2 siempre es 4, sin importar el día ni quién pulse.",
      buildsOn: "Concreta la separación lógica/I-O de la primera lección.",
    },
    en: {
      plain: "A pure transformation function takes DataFrames and returns DataFrames, without reading tables, hidden “today” dates or side effects. Same input, same output, every time.",
      analogy: "A calculator: 2 + 2 is always 4, whatever the day or whoever presses the keys.",
      buildsOn: "It makes the first lesson's logic/I-O split concrete.",
    },
  },
  "m28-l4": {
    glossary: ["data-testing", "table-schema", "dataframe"],
    es: {
      plain: "`assertDataFrameEqual` compara un resultado con el esperado fila a fila; `assertSchemaEqual` comprueba columnas y tipos. Son las herramientas básicas para probar transformaciones de PySpark.",
      analogy: "Comparar tu examen con la plantilla de respuestas, pregunta por pregunta.",
      buildsOn: "Prueba las funciones puras de la lección anterior.",
    },
    en: {
      plain: "`assertDataFrameEqual` compares a result with the expected one row by row; `assertSchemaEqual` checks columns and types. They are the basic tools to test PySpark transformations.",
      analogy: "Checking your exam against the answer sheet, question by question.",
      buildsOn: "It tests the previous lesson's pure functions.",
    },
  },
  "m28-l5": {
    glossary: ["data-testing", "ci-cd", "lakeflow-jobs"],
    es: {
      plain: "Los tests unitarios prueban funciones aisladas; los de integración, piezas juntas con datos reales pequeños; los smoke tests, que lo desplegado arranca y responde. Cada nivel detecta errores distintos.",
      analogy: "Probar cada pieza de un coche, luego el motor montado y, al final, dar una vuelta a la manzana.",
      buildsOn: "Cierra el módulo con una estrategia de pruebas completa.",
    },
    en: {
      plain: "Unit tests check isolated functions; integration tests check pieces together with small real data; smoke tests check that what was deployed starts and responds. Each level catches different errors.",
      analogy: "Testing each car part, then the assembled engine and, finally, driving around the block.",
      buildsOn: "It closes the module with a complete testing strategy.",
    },
  },
  "m29-l1": {
    glossary: ["declarative-automation-bundles", "git-folders"],
    es: {
      plain: "Un bundle se define en `databricks.yml` y puede repartirse en varios archivos con `include`. Describe qué recursos tiene el proyecto y cómo se despliegan.",
      analogy: "El índice de un libro que remite a cada capítulo.",
      buildsOn: "Profundiza en los bundles presentados en el módulo 11.",
    },
    en: {
      plain: "A bundle is defined in `databricks.yml` and can be split into several files with `include`. It describes which resources the project has and how they are deployed.",
      analogy: "A book's table of contents pointing to each chapter.",
      buildsOn: "It goes deeper into the bundles introduced in module 11.",
    },
  },
  "m29-l2": {
    glossary: ["declarative-automation-bundles", "lakeflow-jobs", "lakeflow-pipelines"],
    es: {
      plain: "En la sección `resources` declaras los jobs y pipelines como código: tareas, compute, parámetros y permisos. Lo que no esté ahí no forma parte del despliegue.",
      analogy: "La lista de equipaje de un viaje: si no está en la lista, no va en la maleta.",
      buildsOn: "Traduce los jobs (m10) y pipelines (m18) a definiciones versionadas.",
    },
    en: {
      plain: "In the `resources` section you declare jobs and pipelines as code: tasks, compute, parameters and permissions. Anything not there is not part of the deployment.",
      analogy: "A trip's packing list: if it is not on the list, it is not in the suitcase.",
      buildsOn: "It turns jobs (m10) and pipelines (m18) into versioned definitions.",
    },
  },
  "m29-l3": {
    glossary: ["declarative-automation-bundles", "catalog"],
    es: {
      plain: "Las variables y sustituciones permiten que el mismo bundle use, por ejemplo, el catálogo `dev` en un target y `prod` en otro. El código no cambia; solo la configuración del entorno.",
      analogy: "La misma carta con huecos para el nombre y la dirección de cada destinatario.",
      buildsOn: "Formaliza los targets por entorno del módulo 11.",
    },
    en: {
      plain: "Variables and substitutions let the same bundle use, for example, the `dev` catalog in one target and `prod` in another. The code does not change; only the environment configuration does.",
      analogy: "The same letter with blanks for each recipient's name and address.",
      buildsOn: "It formalises module 11's per-environment targets.",
    },
  },
  "m29-l4": {
    glossary: ["databricks-cli", "declarative-automation-bundles"],
    es: {
      plain: "El ciclo es: `bundle validate` comprueba la configuración, `bundle deploy` crea o actualiza los recursos y `bundle run` ejecuta uno. Validar primero evita desplegar errores.",
      analogy: "Revisar el billete, subir al tren y luego arrancar el viaje.",
      buildsOn: "Pone en marcha el bundle definido en las lecciones anteriores.",
    },
    en: {
      plain: "The cycle is: `bundle validate` checks the configuration, `bundle deploy` creates or updates resources and `bundle run` executes one. Validating first avoids deploying errors.",
      analogy: "Checking your ticket, boarding the train and then starting the journey.",
      buildsOn: "It puts the bundle defined in the previous lessons into action.",
    },
  },
  "m29-l5": {
    glossary: ["ci-cd", "service-principal", "data-testing"],
    es: {
      plain: "En CI/CD, cada cambio pasa pruebas y validación automáticas; el despliegue a producción lo hace un service principal tras una aprobación, nunca una persona desde su portátil.",
      analogy: "Un control de seguridad en el aeropuerto: todo pasa por el mismo escáner y solo embarcan quienes lo superan.",
      buildsOn: "Une pruebas (m28), bundles y service principals (m11).",
    },
    en: {
      plain: "In CI/CD every change goes through automatic tests and validation; deployment to production is done by a service principal after approval, never by a person from their laptop.",
      analogy: "Airport security: everything goes through the same scanner and only those who pass board.",
      buildsOn: "It combines tests (m28), bundles and service principals (m11).",
    },
  },
  "m30-l1": {
    glossary: ["privilege", "unity-catalog", "least-privilege"],
    es: {
      plain: "En Unity Catalog los permisos se heredan: un GRANT en un catálogo se aplica a sus schemas y tablas. Cada objeto tiene un dueño que puede gestionarlo. Diseñar bien la herencia evita conceder de más.",
      analogy: "Dar la llave maestra de un edificio da acceso a todas sus plantas; por eso se da con cuidado.",
      buildsOn: "Profundiza en los privilegios del módulo 11.",
    },
    en: {
      plain: "In Unity Catalog permissions inherit: a GRANT on a catalog applies to its schemas and tables. Each object has an owner who can manage it. Designing inheritance well avoids over-granting.",
      analogy: "Handing over a building's master key gives access to every floor; that is why it is given carefully.",
      buildsOn: "It goes deeper into module 11's privileges.",
    },
  },
  "m30-l2": {
    glossary: ["workspace", "privilege", "unity-catalog"],
    es: {
      plain: "Además de los datos, hay permisos sobre objetos del workspace (notebooks, jobs, clusters). Un securable es cualquier objeto al que se le pueden asignar permisos; hay que saber qué sistema gobierna cada uno.",
      analogy: "En una empresa, las llaves de los despachos y las contraseñas de los ordenadores las gestionan equipos distintos.",
      buildsOn: "Completa el mapa de permisos más allá de las tablas.",
    },
    en: {
      plain: "Besides data, there are permissions on workspace objects (notebooks, jobs, clusters). A securable is any object that can have permissions; you need to know which system governs each.",
      analogy: "In a company, office keys and computer passwords are managed by different teams.",
      buildsOn: "It completes the permission map beyond tables.",
    },
  },
  "m30-l3": {
    glossary: ["row-filter-column-mask", "pii", "privilege"],
    es: {
      plain: "Un row filter decide qué filas ve cada usuario y un column mask qué valor ve en una columna sensible. Así una sola tabla sirve a públicos distintos sin crear copias.",
      analogy: "Un documento en el que cada lector ve tachadas las partes que no le corresponden.",
      buildsOn: "Pasa de permisos por tabla a permisos por fila y columna.",
    },
    en: {
      plain: "A row filter decides which rows each user sees and a column mask what value they see in a sensitive column. One table can thus serve different audiences without copies.",
      analogy: "A document in which each reader sees the parts not meant for them blacked out.",
      buildsOn: "It moves from table-level to row- and column-level permissions.",
    },
  },
  "m30-l4": {
    glossary: ["abac", "metadata", "row-filter-column-mask"],
    es: {
      plain: "Con ABAC etiquetas los datos (por ejemplo, `pii`) y defines políticas centrales que se aplican a todo lo etiquetado. Una columna nueva queda protegida en cuanto recibe la etiqueta.",
      analogy: "Marcar con pegatina roja los documentos confidenciales: la norma «lo rojo no sale de la oficina» se aplica sola.",
      buildsOn: "Escala los filtros y máscaras de la lección anterior.",
    },
    en: {
      plain: "With ABAC you tag data (for example, `pii`) and define central policies that apply to everything tagged. A new column is protected as soon as it gets the tag.",
      analogy: "Putting a red sticker on confidential documents: the rule “red does not leave the office” applies by itself.",
      buildsOn: "It scales the previous lesson's filters and masks.",
    },
  },
  "m30-l5": {
    glossary: ["pii", "vacuum", "system-tables"],
    es: {
      plain: "Proteger datos personales implica minimizar, tokenizar o enmascarar, fijar cuánto tiempo se conservan, poder borrarlos de verdad (incluido el historial Delta) y auditar quién accede.",
      analogy: "Una clínica guarda historiales bajo llave, los destruye cuando vence el plazo legal y registra quién los consulta.",
      buildsOn: "Une gobierno (m11), VACUUM (m06) y tablas de sistema (m25) bajo la normativa de privacidad.",
    },
    en: {
      plain: "Protecting personal data means minimising, tokenising or masking it, setting how long it is kept, being able to truly delete it (including Delta history) and auditing who accesses it.",
      analogy: "A clinic keeps records locked away, destroys them when the legal period ends and logs who consults them.",
      buildsOn: "It ties governance (m11), VACUUM (m06) and system tables (m25) to privacy regulation.",
    },
  },
  "m31-l1": {
    glossary: ["delta-sharing", "unity-catalog"],
    es: {
      plain: "OpenSharing (antes Delta Sharing) permite compartir tablas en vivo sin copiarlas. Un share agrupa lo que compartes y un recipient es quien lo recibe; tú controlas y revocas el acceso.",
      analogy: "Compartir una carpeta en la nube con permiso de solo lectura en lugar de enviar copias por correo.",
      buildsOn: "Extiende el gobierno de Unity Catalog fuera de tu organización.",
    },
    en: {
      plain: "OpenSharing (formerly Delta Sharing) lets you share live tables without copying them. A share groups what you share and a recipient is who receives it; you control and revoke access.",
      analogy: "Sharing a cloud folder with read-only permission instead of emailing copies.",
      buildsOn: "It extends Unity Catalog governance beyond your organisation.",
    },
  },
  "m31-l2": {
    glossary: ["delta-sharing", "metastore", "unity-catalog"],
    es: {
      plain: "Cuando el receptor también usa Databricks con Unity Catalog, el intercambio Databricks-to-Databricks es el más integrado: el share aparece como un catálogo más, con permisos y auditoría.",
      analogy: "Dos oficinas de la misma cadena que comparten el mismo sistema de archivo.",
      buildsOn: "Concreta el primer modo de compartir.",
    },
    en: {
      plain: "When the recipient also uses Databricks with Unity Catalog, Databricks-to-Databricks sharing is the most integrated: the share appears as just another catalog, with permissions and auditing.",
      analogy: "Two branches of the same chain sharing the same filing system.",
      buildsOn: "It makes the first sharing mode concrete.",
    },
  },
  "m31-l3": {
    glossary: ["delta-sharing", "open-table-format", "service-principal"],
    es: {
      plain: "Para receptores que no usan Databricks, el modo abierto entrega los datos a cualquier cliente compatible, autenticado con un token o con federación OIDC, que evita compartir secretos de larga duración.",
      analogy: "Dar acceso a un invitado externo con un pase temporal verificado, no con una copia de tu llave.",
      buildsOn: "Amplía el intercambio a cualquier plataforma.",
    },
    en: {
      plain: "For recipients that do not use Databricks, open mode delivers data to any compatible client, authenticated with a token or with OIDC federation, which avoids sharing long-lived secrets.",
      analogy: "Giving an external guest a verified temporary pass, not a copy of your key.",
      buildsOn: "It extends sharing to any platform.",
    },
  },
  "m31-l4": {
    glossary: ["lakehouse-federation", "oltp", "unity-catalog"],
    es: {
      plain: "Lakehouse Federation consulta bases de datos externas sin copiarlas: creas una connection y un foreign catalog, y Databricks envía parte de la consulta al origen (pushdown).",
      analogy: "Consultar el catálogo de otra biblioteca desde la tuya en lugar de traer todos sus libros.",
      buildsOn: "Ofrece la alternativa a ingerir que estudiaste en m08–m09.",
    },
    en: {
      plain: "Lakehouse Federation queries external databases without copying them: you create a connection and a foreign catalog, and Databricks pushes part of the query down to the source.",
      analogy: "Searching another library's catalogue from yours instead of bringing all its books over.",
      buildsOn: "It offers the alternative to ingesting that you studied in m08–m09.",
    },
  },
  "m31-l5": {
    glossary: ["delta-sharing", "lakehouse-federation", "lakeflow-connect"],
    es: {
      plain: "Compartir, federar o copiar: compartir si otro necesita tus datos; federar para consultas puntuales a una fuente externa; ingerir (copiar) cuando el uso es intenso, necesita historial o rendimiento.",
      analogy: "Prestar un libro, consultarlo en otra biblioteca o comprar tu propio ejemplar según cuánto lo vayas a usar.",
      buildsOn: "Resume el módulo en una matriz de decisión.",
    },
    en: {
      plain: "Share, federate or copy: share if someone else needs your data; federate for occasional queries to an external source; ingest (copy) when use is heavy or needs history or performance.",
      analogy: "Lending a book, reading it at another library or buying your own copy, depending on how much you will use it.",
      buildsOn: "It summarises the module in a decision matrix.",
    },
  },
  "m32-l1": {
    glossary: ["sla-slo", "data-contract", "lakehouse"],
    es: {
      plain: "El proyecto final empieza por los requisitos no funcionales (NFRs): frescura, disponibilidad, privacidad, coste y recuperación. La arquitectura se elige para cumplirlos, no para usar todas las herramientas.",
      analogy: "Diseñar un hospital empieza por cuántos pacientes, qué urgencias y qué normativa, no por el color de las paredes.",
      buildsOn: "Abre el proyecto Professional que integra todas las ramas.",
    },
    en: {
      plain: "The final project starts with non-functional requirements (NFRs): freshness, availability, privacy, cost and recovery. The architecture is chosen to meet them, not to use every tool.",
      analogy: "Designing a hospital starts with how many patients, which emergencies and which regulations, not the colour of the walls.",
      buildsOn: "It opens the Professional project that integrates every track.",
    },
  },
  "m32-l2": {
    glossary: ["batch-processing", "stream-processing", "cdc"],
    es: {
      plain: "Integra cargas batch, streaming y CDC alrededor de contratos comunes: mismas claves, mismas reglas de calidad y publicación idempotente, para que todas acaben en tablas coherentes.",
      analogy: "Varios ríos que desembocan en el mismo embalse: cada uno llega a su ritmo, pero el agua se trata igual.",
      buildsOn: "Une las ramas de streaming (m13–m17) y pipelines (m18–m22).",
    },
    en: {
      plain: "Integrate batch, streaming and CDC loads around shared contracts: same keys, same quality rules and idempotent publishing, so they all end up in consistent tables.",
      analogy: "Several rivers flowing into the same reservoir: each arrives at its own pace, but the water is treated the same way.",
      buildsOn: "It brings together the streaming (m13–m17) and pipelines (m18–m22) tracks.",
    },
  },
  "m32-l3": {
    glossary: ["least-privilege", "delta-sharing", "ci-cd"],
    es: {
      plain: "Seguridad, interoperabilidad y CI/CD deben encajar: identidades mínimas, datos sensibles protegidos, fronteras de compartición claras y despliegues probados que no abran huecos.",
      analogy: "Instalar una puerta nueva sin dejar abierta la de atrás.",
      buildsOn: "Aplica los módulos 28 a 31 al proyecto final.",
    },
    en: {
      plain: "Security, interoperability and CI/CD must fit together: minimal identities, protected sensitive data, clear sharing boundaries and tested deployments that do not open gaps.",
      analogy: "Installing a new front door without leaving the back door open.",
      buildsOn: "It applies modules 28 to 31 to the final project.",
    },
  },
  "m32-l4": {
    glossary: ["sla-slo", "dbu", "repair-run"],
    es: {
      plain: "Prueba la plataforma bajo presión: datos tardíos, fallos, permisos erróneos y un pico de coste. Mide cómo se detecta, cuánto tarda en recuperarse y qué cambia después.",
      analogy: "Un simulacro general en el que se apaga la luz, falla un proveedor y hay que seguir dando servicio.",
      buildsOn: "Repite el game day (m17) y el postmortem (m27) a escala de plataforma.",
    },
    en: {
      plain: "Test the platform under pressure: late data, failures, wrong permissions and a cost spike. Measure how it is detected, how long recovery takes and what changes afterwards.",
      analogy: "A full drill where the power goes out, a supplier fails and service must continue.",
      buildsOn: "It repeats the game day (m17) and postmortem (m27) at platform scale.",
    },
  },
  "m32-l5": {
    glossary: ["lakehouse", "data-contract", "sla-slo"],
    es: {
      plain: "Defender el diseño es explicar por qué cada pieza está donde está, qué alternativa descartaste, cómo falla y cómo sabrías que funciona. El simulacro final mide ese razonamiento en todos los dominios.",
      analogy: "Defender un trabajo de fin de máster: no basta con que funcione, hay que justificar cada decisión.",
      buildsOn: "Cierra todo el temario: cada lección anterior es un argumento de esta defensa.",
    },
    en: {
      plain: "Defending the design means explaining why each piece sits where it does, which alternative you rejected, how it fails and how you would know it works. The final practice exam measures that reasoning across every domain.",
      analogy: "Defending a master's thesis: it is not enough that it works; you must justify every decision.",
      buildsOn: "It closes the whole curriculum: every previous lesson is an argument in this defence.",
    },
  },
} satisfies Record<string, LessonEssentialsSource>;

import type { LessonContent, LessonDeepDive, ModuleContentPack } from "./content-types";

const reviewedAt = "21 jul 2026";
const source = (label: string, href: string) => ({ label, href, reviewedAt });

type BaseLesson = Omit<LessonContent, "deepDive">;
type BaseModuleContentPack = Omit<ModuleContentPack, "lessons"> & {
  lessons: [BaseLesson, BaseLesson, BaseLesson, BaseLesson, BaseLesson];
};

const concept = (term: string, definition: string, whyItMatters: string) => ({ term, definition, whyItMatters });

const dive = (
  mentalModel: string,
  mechanics: [string, string],
  concepts: LessonDeepDive["concepts"],
  situation: string,
  reasoning: [string, string, string],
  outcome: string,
): LessonDeepDive => ({ mentalModel, mechanics, concepts, workedScenario: { situation, reasoning, outcome } });

const deepDives01To04: Record<string, [LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive]> = {
  m01: [
    dive(
      `Piensa en un lakehouse como un sistema de tablas confiables construido sobre almacenamiento de objetos, no como una mezcla superficial de data lake y warehouse. El almacenamiento conserva archivos baratos y durables; Delta Lake convierte conjuntos de esos archivos en snapshots transaccionales; Unity Catalog asigna nombres, propietarios y permisos; y distintos recursos de compute leen el mismo estado lógico. Este desacoplamiento evita que la copia física pertenezca a un motor concreto. Para razonar correctamente, separa siempre cuatro preguntas: dónde persisten los bytes, qué protocolo define una tabla válida, quién puede usarla y qué motor ejecuta la consulta. Esa separación explica simultáneamente elasticidad, interoperabilidad, gobierno y recuperación.`,
      [
        `Cuando un escritor modifica una tabla Delta no edita un archivo central. Produce nuevos archivos Parquet y propone al transaction log un conjunto de acciones que añade y retira archivos del snapshot. El commit aceptado recibe una versión ordenada. Un lector elige una versión coherente y resuelve sus archivos activos; por eso no observa una escritura parcial. El object storage aporta durabilidad, mientras el protocolo Delta aporta el significado transaccional que una carpeta de Parquet por sí sola no tiene.`,
        `La separación de compute permite que un Job de PySpark transforme durante la noche y un SQL warehouse atienda BI por la mañana sin mover la tabla. Cada recurso obtiene autorización mediante Unity Catalog y construye su propio plan sobre el mismo snapshot. Apagar el compute no elimina datos ni metadatos. El beneficio económico aparece solo si los ciclos de vida se ajustan a la demanda; mantener recursos ociosos o duplicar tablas por consumidor anula gran parte del diseño lakehouse.`,
      ],
      [
        concept("Snapshot", "Vista inmutable y coherente de los archivos activos de una tabla en una versión concreta del transaction log.", "Permite explicar por qué lectores concurrentes ven estados completos y reproducibles."),
        concept("Formato abierto", "Representación documentada de datos y transacciones que no depende exclusivamente de una aplicación propietaria para interpretarse.", "Reduce copias y facilita que distintos motores trabajen sobre una fuente común."),
        concept("Separación storage-compute", "Diseño en el que persistencia y capacidad de ejecución tienen ciclos de vida y escalado independientes.", "Permite elegir rendimiento, aislamiento y coste por workload sin trasladar los datos."),
      ],
      "Una empresa conserva cinco años de pedidos en object storage, ejecuta ETL nocturno y sirve cien dashboards durante horario laboral.",
      [
        "Identificar que los pedidos necesitan una representación transaccional común, no una exportación diferente para cada consumidor.",
        "Mantener una tabla Delta gobernada y asignar Jobs compute al ETL y un SQL warehouse al consumo concurrente.",
        "Escalar o detener cada compute por separado, verificando permisos y SLA sobre el mismo snapshot de la tabla.",
      ],
      "La arquitectura conserva una sola fuente gobernada, aísla cargas y reduce coste ocioso sin sacrificar consistencia.",
    ),
    dive(
      `Un despliegue Databricks se entiende mejor como dos ámbitos de responsabilidad coordinados. El plano de control mantiene la experiencia del producto: configuración del workspace, APIs, definiciones de Jobs y coordinación de recursos. El plano de cómputo ejecuta instrucciones y accede a datos con una identidad autorizada. Esta división no significa que todo dato de usuario viaje al plano de control ni que el plano de cómputo decida permisos por sí mismo. El modelo mental útil sigue una solicitud: una persona o servicio declara qué ejecutar, el control plane autentica y orquesta, y el compute plane materializa el trabajo cerca de las fuentes gobernadas, sujeto a red e identidad.`,
      [
        `Al enviar una ejecución, los servicios de control validan la definición y coordinan la creación o selección del compute. El driver interpreta el plan y los executors procesan particiones, leen almacenamiento y escriben resultados. Las credenciales efectivas no deben incrustarse en el notebook: proceden de mecanismos de identidad y objetos gobernados. Los metadatos de Unity Catalog orientan resolución y autorización, pero los bytes se leen desde la ubicación asociada al objeto cuando el motor ejecuta el plan.`,
        `En classic compute, los recursos se aprovisionan dentro de la cuenta cloud del cliente y admiten más decisiones sobre red, runtime e instancias. En serverless, Databricks administra infraestructura, escalado y versiones compatibles dentro de una arquitectura serverless protegida. La elección cambia responsabilidades y conectividad, no la semántica de una tabla. Por eso una evaluación de seguridad debe seguir rutas reales de red, identidades y almacenamiento, en vez de inferir exposición a partir de etiquetas comerciales.`,
      ],
      [
        concept("Control plane", "Servicios administrados que ofrecen interfaz, APIs, configuración y coordinación de la plataforma.", "Ubica correctamente autenticación y orquestación al analizar una arquitectura."),
        concept("Compute plane", "Recursos donde drivers y executors procesan datos y materializan resultados.", "Concentra las decisiones de red, capacidad e identidad efectiva del workload."),
        concept("Responsabilidad compartida", "Distribución explícita de tareas operativas y de seguridad entre Databricks, el proveedor cloud y el cliente.", "Evita asumir que serverless elimina la obligación de gobernar datos, identidades y uso."),
      ],
      "Un Job serverless debe consultar una base privada y el equipo supone que funcionará porque la tabla aparece en el catálogo.",
      [
        "Separar descubrimiento del objeto, autorización de Unity Catalog y conectividad de red hacia la base privada.",
        "Comprobar que la región y la conectividad privada serverless soportan el destino y que la identidad posee privilegios mínimos.",
        "Si la restricción no puede cumplirse, documentar classic compute con red controlada como alternativa, sin cambiar la capa de datos.",
      ],
      "La decisión se basa en una ruta verificable de ejecución y acceso, no en la mera visibilidad del objeto.",
    ),
    dive(
      `Delta Lake, Unity Catalog y los motores de ejecución forman capas complementarias con contratos distintos. Delta responde qué archivos componen una versión válida y cómo se confirman cambios. Unity Catalog responde cómo se llama el objeto, quién lo posee, qué principal puede usarlo y de dónde procede. Spark, Photon o un SQL warehouse responden cómo calcular una consulta con recursos concretos. Ninguna capa sustituye a las demás: registrar Parquet en un catálogo no crea transacciones Delta, convertir archivos a Delta no concede SELECT y cambiar de motor no modifica por sí mismo el ownership. El examen suele presentar un síntoma; la habilidad es localizar la capa que tiene autoridad para resolverlo.`,
      [
        `La resolución comienza con un identificador catalog.schema.object. Unity Catalog busca el objeto, comprueba privilegios efectivos y devuelve metadatos necesarios para acceder. Después Catalyst analiza expresiones y crea un plan; Photon puede ejecutar operadores compatibles de forma vectorizada. Finalmente, el lector Delta usa el log para determinar archivos activos y estadísticas. Este orden conceptual explica por qué una consulta puede fallar por nombre, permiso, protocolo o ejecución, aunque el mensaje visible aparezca en una sola interfaz.`,
        `Las operaciones administrativas también respetan fronteras. GRANT cambia autorización en Unity Catalog, OPTIMIZE reorganiza el layout de archivos de una tabla Delta y cambiar el tamaño del warehouse modifica recursos de ejecución. Aplicar la acción en la capa equivocada produce coste sin corregir la causa. Una práctica operativa sólida clasifica primero el problema, conserva evidencia del estado anterior y verifica después el efecto mediante permisos efectivos, DESCRIBE DETAIL, historial o perfil de consulta según corresponda.`,
      ],
      [
        concept("Protocolo de tabla", "Reglas que determinan commits válidos, funcionalidades de lectura y escritura y compatibilidad de clientes.", "Distingue una tabla Delta de una simple colección de archivos Parquet."),
        concept("Securable", "Objeto de Unity Catalog sobre el que pueden evaluarse ownership y privilegios.", "Permite aplicar mínimo privilegio al nivel correcto del namespace."),
        concept("Motor de ejecución", "Implementación que transforma un plan físico en tareas y operaciones sobre datos.", "Explica por qué rendimiento y compatibilidad dependen del compute sin alterar el gobierno lógico."),
      ],
      "Una analista puede descubrir main.gold.sales pero recibe PERMISSION_DENIED; el equipo propone ejecutar OPTIMIZE.",
      [
        "Clasificar el fallo como autorización porque el objeto se resuelve pero la identidad no puede leerlo.",
        "Comprobar USE CATALOG, USE SCHEMA y SELECT efectivos, además de cualquier binding aplicable.",
        "Conceder al grupo únicamente los privilegios necesarios y volver a probar desde su identidad.",
      ],
      "La consulta funciona tras corregir Unity Catalog; no se reescriben archivos ni se incrementa compute inútilmente.",
    ),
    dive(
      `El namespace de Unity Catalog es una jerarquía de gobierno, mientras un workspace es una superficie de colaboración y ejecución. Un metastore se asigna a workspaces y contiene catálogos; cada catálogo contiene esquemas; cada esquema contiene tablas, vistas, volúmenes, funciones y otros objetos. El nombre completo catalog.schema.object hace que el significado no dependa del contexto accidental de la sesión. La asignación del metastore habilita un ámbito común, pero no concede acceso automáticamente: visibilidad, privilegios, workspace bindings y conectividad siguen siendo controles diferentes. Pensar en contenedores anidados evita la falsa idea de que copiar un notebook o cambiar de workspace duplica o transfiere la propiedad de una tabla.`,
      [
        `Cuando se ejecuta un nombre de tres partes, el catálogo determina primero qué objeto se busca. Para acceder suelen requerirse privilegios de uso en los ancestros y una capacidad concreta, como SELECT, en el objeto o en un nivel del que se herede. El propietario puede administrar el securable, pero ownership tampoco sustituye requisitos de red o credenciales para ubicaciones externas. Usar nombres completos reduce colisiones y hace que Jobs y pruebas produzcan el mismo resultado en sesiones distintas.`,
        `Un workspace asociado al metastore puede descubrir catálogos compartidos, aunque los workspace bindings pueden restringir qué workspaces usan un catálogo, una external location o una storage credential. Esta distinción permite aislar producción sin crear otro sistema de nombres. Los artefactos de workspace, como notebooks o Git folders, tienen su propio ciclo de vida; las tablas de Unity Catalog permanecen en el metastore. Diseñar promoción significa cambiar configuración y destinos autorizados, no copiar manualmente datos gobernados salvo requisito explícito.`,
      ],
      [
        concept("Metastore", "Ámbito superior de Unity Catalog asignable a uno o varios workspaces y contenedor de catálogos.", "Define la frontera administrativa en la que se resuelven objetos gobernados."),
        concept("Namespace de tres niveles", "Identificación inequívoca de un objeto mediante catálogo, esquema y nombre.", "Hace reproducibles consultas y despliegues entre sesiones y entornos."),
        concept("Workspace binding", "Restricción que limita el uso de determinados securables a workspaces seleccionados.", "Añade aislamiento de entorno sin confundirlo con permisos de usuario sobre datos."),
      ],
      "Dev y prod comparten metastore; una tarea de desarrollo no debe escribir accidentalmente en el catálogo productivo.",
      [
        "Nombrar siempre el destino completo y parametrizar el catálogo por target en lugar de depender de USE CATALOG manual.",
        "Aplicar workspace binding al catálogo de producción y privilegios de escritura solo al principal productivo.",
        "Validar el bundle desde dev con identidad de desarrollo y comprobar que el acceso a prod queda denegado.",
      ],
      "El mismo código se promociona con configuración explícita, mientras los límites del catálogo impiden escrituras cruzadas.",
    ),
    dive(
      `Elegir una superficie Databricks es emparejar el ciclo de vida del trabajo con un servicio, no decidir qué icono resulta más familiar. Un notebook favorece conversación interactiva y exploración; Lakeflow Jobs convierte tareas en ejecuciones repetibles; un SQL warehouse atiende SQL concurrente y herramientas BI; Spark Declarative Pipelines en Lakeflow expresa datasets y dependencias de forma declarativa. Antes de elegir, fija consumidor, lenguaje, latencia, frecuencia, estado, concurrencia, identidad y recuperación. El mismo cálculo puede prototiparse en notebook y desplegarse como tarea, pero la superficie productiva debe ofrecer contrato de entrada, observabilidad y reintento. Esta matriz evita usar clusters interactivos permanentes como solución universal.`,
      [
        `En desarrollo, el estado de una sesión acelera iteración, pero también puede ocultar dependencias y orden de ejecución. Al pasar a producción, un Job crea un run con parámetros, tareas, dependencias, identidad y resultado observable. Si el producto son tablas incrementales cuya dependencia puede declararse, un pipeline administra el grafo y el estado de actualización. Si el consumidor emite SQL de corta duración y alta concurrencia, el warehouse gestiona colas, escalado y aislamiento adecuados al patrón.`,
        `La selección debe incluir fallos. Un dashboard necesita auto-stop y capacidad de escalar concurrencia; un ETL necesita idempotencia, retries y repair; un flujo continuo necesita checkpoint y política de reinicio; una exploración necesita límites para no convertirse en dependencia productiva. El dato gobernado puede permanecer igual mientras cambia la superficie. Esta independencia permite evolucionar desde prototipo a operación sin exportaciones intermedias, siempre que código, parámetros y permisos sean explícitos.`,
      ],
      [
        concept("Superficie de ejecución", "Servicio o entorno desde el que se desarrolla, programa o sirve un workload.", "Conecta requisitos operativos con capacidades concretas de Databricks."),
        concept("Ciclo de vida", "Secuencia de creación, actividad, escalado, recuperación y terminación de una ejecución.", "Determina coste, estado residual y mecanismos de operación necesarios."),
        concept("Carga declarativa", "Definición del resultado deseado y sus dependencias sin programar manualmente todo el orden de ejecución.", "Permite que Lakeflow Pipelines gestione planificación y estado incremental."),
      ],
      "Un cálculo de ventas se ejecuta manualmente en notebook y alimenta un dashboard de dirección cada mañana.",
      [
        "Reconocer que el consumidor exige horario, repetibilidad y alerta, capacidades ausentes en la operación manual.",
        "Extraer la transformación comprobable y desplegarla como pipeline o tarea de Job con tabla Gold gobernada.",
        "Servir el resultado mediante SQL warehouse y verificar SLA, idempotencia y procedimiento de repair.",
      ],
      "El dashboard deja de depender de una sesión personal y conserva trazabilidad completa desde el run hasta la tabla.",
    ),
  ],
  m02: [
    dive(
      `Serverless y classic no son niveles de calidad; son modelos de responsabilidad. Serverless delega a Databricks la selección, provisión, escalado y actualización del compute compatible, de modo que el equipo se concentra en el workload. Classic expone decisiones sobre runtime, instancias, red, políticas e inicialización dentro de la cuenta cloud. La comparación correcta comienza por restricciones: conectividad privada, librerías, tipo de tarea, versión requerida, región y controles corporativos. Después se valoran arranque, elasticidad, coste y capacidad operativa. Elegir classic por costumbre añade superficie de mantenimiento; elegir serverless ignorando una limitación puede impedir la ejecución. El objetivo es el mínimo control necesario para cumplir requisitos verificables.`,
      [
        `En serverless Jobs, Databricks crea recursos efímeros, habilita optimizaciones compatibles y actualiza el entorno según la política del servicio. El usuario no selecciona nodos como en classic y debe comprobar límites de tareas, red y runtime. La identidad del run y Unity Catalog siguen gobernando los datos. Que la infraestructura sea administrada no convierte en seguras las escrituras no idempotentes ni elimina la necesidad de observabilidad, presupuestos y controles sobre quién puede ejecutar.`,
        `En classic compute, una definición especifica runtime, tipos y cantidad de nodos, access mode, políticas, tags y terminación. Esto permite integrar requisitos especiales, pero obliga a gestionar compatibilidad, disponibilidad y utilización. Una comparación económica debe incluir tiempo de arranque, ociosidad, fallos y trabajo humano, no solo precio horario. El mismo benchmark con datos representativos y SLA común permite saber si el control adicional aporta valor o solamente más decisiones operativas.`,
      ],
      [
        concept("Serverless compute", "Capacidad gestionada por Databricks que se aprovisiona y escala sin configurar infraestructura subyacente.", "Reduce operación cuando el workload y la conectividad están soportados."),
        concept("Classic compute", "Recursos configurables en la cuenta cloud del cliente con mayor control de runtime, nodo y red.", "Es necesario cuando una restricción no cabe en la superficie serverless disponible."),
        concept("Restricción de compatibilidad", "Requisito de tarea, biblioteca, red, región o runtime que determina si una superficie puede ejecutar el trabajo.", "Debe comprobarse antes de comparar rendimiento o coste."),
      ],
      "Un JAR con inicialización de sistema y acceso a un servicio privado debe migrarse desde un cluster clásico.",
      [
        "Enumerar dependencias del JAR, init script, versión de runtime y ruta de red en vez de asumir equivalencia.",
        "Contrastar cada requisito con las tareas y limitaciones serverless vigentes; identificar los no soportados.",
        "Mantener classic Jobs bajo compute policy si persiste una restricción, y preparar una prueba serverless cuando se elimine.",
      ],
      "La arquitectura usa serverless solo donde es compatible y conserva control clásico de forma justificada y acotada.",
    ),
    dive(
      `All-purpose compute, jobs compute y SQL warehouses se distinguen por quién los usa y cuánto estado deben conservar. All-purpose acompaña una sesión humana interactiva y admite iteración; jobs compute acompaña un run automatizado y favorece un entorno reproducible; un SQL warehouse es un endpoint SQL optimizado para consultas, dashboards y herramientas BI concurrentes. No son tres tamaños del mismo cluster. Asignar producción a un recurso interactivo introduce estado residual, permisos personales y costes de inactividad. Servir BI desde un cluster de desarrollo mezcla colas y ciclos de escalado incompatibles. El modelo adecuado vincula cada recurso a una intención operativa y hace que el dato persista fuera de él.`,
      [
        `Un all-purpose cluster puede permanecer activo entre comandos, por lo que variables, cachés o librerías instaladas durante la sesión influyen en resultados posteriores. Es útil para explorar, pero una automatización debe declarar sus dependencias. Jobs crea una ejecución identificable; serverless o classic jobs compute se prepara para las tareas compatibles y el estado relevante se persiste en tablas, checkpoints o artefactos. El run puede reintentarse, repararse y auditarse sin depender del usuario que abrió un notebook.`,
        `Un SQL warehouse recibe sentencias mediante Databricks SQL, conectores JDBC/ODBC y herramientas BI. Sus mecanismos de auto-stop, escalado y concurrencia responden a ráfagas de consultas, no a un DAG PySpark de larga duración. Seleccionar la superficie correcta mejora aislamiento y atribución. Aun así, un warehouse no arregla un modelo Gold deficiente ni un filtro que escanea toda la tabla; compute y diseño de datos deben medirse conjuntamente.`,
      ],
      [
        concept("All-purpose compute", "Compute clásico orientado al trabajo interactivo de usuarios en notebooks y exploración.", "Explica por qué no es la opción recomendada para Jobs productivos repetibles."),
        concept("Jobs compute", "Compute asociado a ejecuciones automatizadas y definido para las tareas de un workflow.", "Reduce estado residual y vincula coste, logs y dependencias al run."),
        concept("SQL warehouse", "Recurso de cómputo especializado que expone un endpoint SQL para analítica y BI.", "Aporta aislamiento, concurrencia y ciclo de auto-stop acordes al consumo SQL."),
      ],
      "Cincuenta analistas consultan ventas a las 9:00 mientras el equipo modifica notebooks de desarrollo en el mismo cluster.",
      [
        "Separar el patrón concurrente y corto de BI del patrón interactivo y cambiante de desarrollo.",
        "Publicar una tabla Gold y conectarla a un SQL warehouse con escalado adecuado, manteniendo all-purpose para explorar.",
        "Mover cualquier actualización programada a Jobs compute y medir cola, latencia y coste por cada superficie.",
      ],
      "Los usuarios de BI obtienen latencia estable y el desarrollo deja de competir por recursos o introducir estado accidental.",
    ),
    dive(
      `Autoscaling, auto-termination y pools actúan en momentos diferentes del ciclo de compute. Autoscaling modifica workers dentro de límites para una demanda paralelizable; no parte una única tarea sesgada ni acelera código ejecutado solo en el driver. Auto-termination apaga un recurso interactivo tras inactividad y controla ociosidad. Un pool conserva instancias clásicas preparadas para reducir aprovisionamiento, pero no mantiene un cluster completo ni se aplica al compute serverless gestionado. La pregunta útil no es cuál activar siempre, sino qué latencia o desperdicio se observa. Primero se identifica si el problema ocurre durante ejecución, durante inactividad o durante arranque; después se selecciona el mecanismo y se mide su efecto.`,
      [
        `El autoscaler observa demanda y ajusta workers entre mínimo y máximo. Spark solo aprovecha nuevos workers cuando existen suficientes tareas ejecutables; una partición enorme sigue limitada a una tarea. Un mínimo alto mejora respuesta pero mantiene coste, mientras un máximo insuficiente limita picos. Serverless gestiona su propia elasticidad; en classic, los límites deben respetar cuotas, políticas y características del workload. La evaluación se hace con distribución de tareas, duración y utilización, no únicamente con promedio de CPU.`,
        `Auto-termination cuenta periodos de inactividad según el tipo de compute y evita jornadas completas de recursos olvidados. Los pools atacan otra espera: conservan máquinas ociosas listas para que nuevos clusters clásicos arranquen antes, con su propio coste. Compartir un pool entre jobs compatibles puede amortizar capacidad, pero versiones, tipos de instancia y aislamiento deben concordar. En producción se combinan guardrails: límites de escalado, terminación razonable, tags y alertas sobre utilización.`,
      ],
      [
        concept("Elasticidad horizontal", "Aumento o reducción del número de workers disponibles para tareas paralelas.", "Aclara cuándo autoscaling puede reducir duración y cuándo no."),
        concept("Inactividad", "Periodo en el que un recurso permanece activo sin trabajo reconocido que justifique su coste.", "Es la señal que auto-termination pretende limitar."),
        concept("Instance pool", "Conjunto de instancias cloud preaprovisionadas para acelerar la creación de compute clásico.", "Reduce latencia de arranque sin confundirla con capacidad durante una ejecución."),
      ],
      "Jobs clásicos cortos tardan seis minutos en arrancar y dos en procesar; aumentar workers no reduce la espera.",
      [
        "Separar en las métricas tiempo de aprovisionamiento y tiempo real de Spark, confirmando que el cuello está antes del run.",
        "Evaluar un pool compatible o serverless, en vez de elevar el máximo de autoscaling que solo actúa durante ejecución.",
        "Comparar latencia y coste total por run, incluyendo la capacidad ociosa mantenida por el pool.",
      ],
      "Se elige el mecanismo que reduce el arranque con coste medido; el paralelismo permanece dimensionado al trabajo real.",
    ),
    dive(
      `El access mode define cómo se aísla la ejecución y qué funcionalidades de gobierno admite el compute; no concede permisos sobre tablas. Standard es el modo multiusuario recomendado para muchas cargas gobernadas y aplica aislamiento entre usuarios. Dedicated asigna el recurso a un único usuario o grupo y se reserva para necesidades de aislamiento o compatibilidad no cubiertas por Standard. Unity Catalog evalúa aparte quién puede usar cada securable. Una compute policy transforma esta decisión en guardrails: fija o limita modo, runtime, nodos, terminación y tags. El principio de mínimo privilegio abarca tanto los datos como la capacidad de crear infraestructura costosa o insegura.`,
      [
        `En Standard, el sistema asocia cada operación a la identidad efectiva y restringe APIs o patrones que romperían el aislamiento. La compatibilidad ha evolucionado con los runtimes, por lo que debe consultarse para la versión y funcionalidad concretas. Dedicated ofrece un contexto asignado y puede admitir requisitos adicionales, pero aumenta coste y superficie de gestión si se adopta sin necesidad. En serverless Jobs, el servicio usa el modelo de aislamiento compatible y oculta gran parte de la configuración del cluster.`,
        `Las compute policies evalúan configuraciones al crear recursos. Un campo fixed impone un valor; rangos y listas permiten opciones controladas; valores por defecto orientan sin sustituir validación. Además de seguridad, las políticas pueden exigir tags de coste, auto-termination y familias de instancia aprobadas. No reemplazan GRANT, workspace bindings ni credenciales. Un diseño completo combina política de compute, identidad de ejecución y privilegios de Unity Catalog con responsabilidades claramente separadas.`,
      ],
      [
        concept("Standard access mode", "Modo multiusuario con aislamiento y compatibilidad gobernada para workloads admitidos.", "Es el punto de partida recomendado cuando varias identidades comparten compute."),
        concept("Dedicated access mode", "Modo de compute asignado a una identidad o grupo específico.", "Cubre requisitos explícitos que no funcionan o no deben compartirse en Standard."),
        concept("Compute policy", "Conjunto administrado de reglas que limita y predetermina configuraciones de compute clásico.", "Convierte decisiones de coste y seguridad en controles aplicables, no recomendaciones."),
      ],
      "Cien usuarios pueden crear clusters sin auto-stop y varios eligen Dedicated para leer las mismas tablas públicas internas.",
      [
        "Confirmar que las funciones utilizadas son compatibles con Standard y que Unity Catalog ya gestiona el acceso a datos.",
        "Crear una policy con Standard, auto-termination, tipos aprobados y tags obligatorios, reservando una excepción documentada.",
        "Medir utilización y revisar periódicamente quién necesita la excepción Dedicated y por qué.",
      ],
      "El uso normal queda aislado y gobernado con menor coste, mientras las excepciones son escasas, justificadas y auditables.",
    ),
    dive(
      `El coste de Databricks es una consecuencia del trabajo completado, no solo del precio por hora. Intervienen DBUs, infraestructura cloud cuando aplica, tiempo de arranque, duración, utilización, reintentos, almacenamiento y esfuerzo operativo. La unidad de comparación debe mantener constante el resultado y el SLA: coste por pipeline correcto, por terabyte transformado o por consulta servida dentro del objetivo. Un cluster barato que tarda tres veces más o falla dos veces puede costar más. Las system tables de billing registran uso y metadatos atribuibles; precios y tags permiten convertirlo en responsabilidad por producto. FinOps útil une telemetría técnica con una decisión concreta de diseño.`,
      [
        `system.billing.usage contiene registros de consumo con cantidades, SKU, tiempos y etiquetas disponibles. La suma debe considerar correcciones o restatements según el esquema vigente, y puede unirse con list_prices para estimar moneda. Tags consistentes o budget policies serverless permiten agrupar por equipo, aplicación y ambiente. La atribución falla si se etiqueta solo el cluster pero se ignoran otros productos, o si cada equipo usa valores libres que no se normalizan.`,
        `Optimizar comienza con una línea base: mismo input, salida validada y SLA. Después se cambia una variable, como superficie, tamaño, layout o frecuencia, y se compara duración, uso, fallos y coste. Reducir compute puede empeorar spill; añadir compute puede no afectar una única partición sesgada. Los ahorros defendibles se expresan por unidad de valor y se vigilan durante suficiente tiempo para incluir picos, arranques y comportamiento de autoscaling.`,
      ],
      [
        concept("DBU", "Unidad de consumo de capacidad Databricks cuyo ritmo depende del producto y SKU utilizados.", "Permite medir servicio, pero debe combinarse con costes cloud y resultado del workload."),
        concept("Coste por resultado", "Relación entre coste total y una salida correcta que cumple un SLA definido.", "Evita optimizaciones aparentes basadas solo en tarifa o tamaño."),
        concept("Atribución", "Asignación consistente del consumo a propietario, producto, ambiente o centro de coste.", "Hace posible responsabilizar, presupuestar y priorizar optimizaciones."),
      ],
      "Un ETL pasa de ocho a cuatro workers: baja el coste horario, pero duplica duración y pierde el SLA tres días.",
      [
        "Calcular coste total por ejecución exitosa, incluyendo reintentos y penalización operativa, no solo tarifa horaria.",
        "Comparar métricas de tareas y spill para determinar si el tamaño menor causó el alargamiento.",
        "Probar una configuración intermedia o corregir el plan, y conservar la opción que cumple SLA al menor coste total.",
      ],
      "La decisión se sustenta en valor entregado y telemetría; se descarta el falso ahorro que incumple el servicio.",
    ),
  ],
  m03: [
    dive(
      `Un notebook es simultáneamente documento, cliente de ejecución y estado interactivo. Esa combinación acelera el aprendizaje, pero dificulta reproducibilidad cuando las celdas se ejecutan fuera de orden o dependen de variables, tablas temporales y librerías instaladas manualmente. El modelo autosuficiente separa narración de lógica: el notebook recibe parámetros, invoca funciones importables, muestra evidencia pequeña y termina con salidas gobernadas. Debe poder ejecutarse desde un estado limpio de principio a fin. Los archivos de workspace y paquetes Python guardan lógica comprobable; Jobs aporta el contrato productivo. La pregunta clave no es si una celda funcionó una vez, sino qué dependencias explican exactamente su resultado.`,
      [
        `El proceso Python conectado al compute conserva variables, imports y caché entre comandos. Las celdas SQL pueden crear vistas temporales ligadas a la sesión. Si una celda posterior usa ese estado y otra persona ejecuta el notebook desde cero, el resultado cambia o falla. Restart Python y Run all son pruebas útiles, pero no sustituyen dependencias fijadas, parámetros explícitos y escrituras idempotentes. Los efectos secundarios deben estar localizados y verificarse mediante tablas o métricas.`,
        `Una estructura mantenible coloca transformaciones puras en módulos bajo control de versiones y deja al notebook como punto de entrada. Las funciones reciben DataFrames o valores, devuelven resultados y pueden probarse con fixtures pequeños. En producción, una tarea de Job instala el artefacto fijado y pasa parámetros. Esto reduce el acoplamiento a rutas personales, facilita revisión y permite que la explicación pedagógica siga siendo clara sin convertirse en la única implementación del negocio.`,
      ],
      [
        concept("Estado de sesión", "Variables, imports, vistas temporales y cachés que sobreviven entre comandos de una sesión activa.", "Es la causa principal de notebooks que funcionan solo para su autor."),
        concept("Efecto secundario", "Cambio observable fuera del valor devuelto, como escribir una tabla o modificar configuración.", "Debe aislarse para que reintentos y pruebas sean predecibles."),
        concept("Reproducibilidad", "Capacidad de obtener la misma salida desde entradas, código, parámetros y dependencias declarados.", "Es el criterio que permite promover un notebook a operación confiable."),
      ],
      "Un notebook diario funciona si su autora ejecuta primero la celda 17, pero falla como tarea nueva de Job.",
      [
        "Reiniciar la sesión y ejecutar de arriba abajo para localizar variables o vistas creadas fuera del orden narrativo.",
        "Mover la transformación a una función importable y declarar parámetros, librerías y tablas de entrada.",
        "Ejecutar dos veces como Job con entorno limpio y comparar salida, métricas e idempotencia.",
      ],
      "El proceso deja de depender de memoria personal y se convierte en un entry point reproducible y auditable.",
    ),
    dive(
      `SQL y PySpark expresan planes sobre el mismo motor, pero ofrecen distintas herramientas cognitivas. SQL describe relaciones y resultados mediante álgebra declarativa; suele ser la forma más legible para filtros, joins, agregaciones y modelos que revisan perfiles diversos. PySpark compone la API DataFrame desde Python y facilita abstracciones, control, reutilización y pruebas. No hay premio por traducir cada consulta de una forma a otra. Primero se representa la transformación con funciones nativas que Catalyst pueda analizar; después se elige el lenguaje que hace visible la intención y reduce complejidad accidental. Una UDF Python es una frontera de optimización y debe justificarse, no un atajo habitual.`,
      [
        `Tanto una sentencia SQL como una cadena DataFrame construyen un plan lógico con columnas, filtros y relaciones. Catalyst resuelve nombres y tipos, aplica reglas y selecciona un plan físico. Por ello filter en PySpark y WHERE en SQL pueden producir operaciones equivalentes. Las funciones incorporadas conservan expresiones visibles para el optimizador. Encapsular la misma lógica en una UDF Python puede añadir serialización y ocultar semántica, aunque ciertas UDF vectorizadas mitiguen parte del coste.`,
        `PySpark aporta el ecosistema de módulos, funciones, tipos y tests de Python, útil cuando la transformación depende de configuración o se combina en una aplicación. SQL facilita revisión directa, permisos sobre vistas y modelos declarativos. En un proyecto mixto, define contratos comunes de entrada y salida y evita saltos de lenguaje que solo fragmenten el flujo. La equivalencia se valida por esquema, filas y plan, no por parecido textual entre implementaciones.`,
      ],
      [
        concept("Plan lógico", "Representación declarativa de operaciones sobre relaciones antes de escoger algoritmos físicos.", "Permite entender que SQL y DataFrames pueden converger en la misma ejecución."),
        concept("Función nativa", "Expresión conocida por Spark y visible para análisis, optimización y generación de código.", "Suele conservar mejor rendimiento y diagnósticos que una UDF opaca."),
        concept("UDF Python", "Función definida por el usuario ejecutada en la frontera entre JVM y proceso Python.", "Puede ser necesaria, pero introduce costes y limita optimizaciones si reemplaza funciones incorporadas."),
      ],
      "Una transformación normaliza emails, agrega ventas y aplica una compleja biblioteca Python de clasificación.",
      [
        "Expresar normalización y agregación con funciones SQL/DataFrame nativas para que Catalyst las optimice.",
        "Aislar solo la clasificación sin equivalente nativo en una función comprobable, evaluando una UDF vectorizada si procede.",
        "Comparar esquema, resultados y perfil con un conjunto representativo antes de adoptar la implementación.",
      ],
      "La solución mantiene la mayor parte del plan visible y reserva Python especializado para el requisito que realmente lo necesita.",
    ),
    dive(
      `Un parámetro es parte del contrato de una ejecución: tiene nombre, origen, tipo esperado, valor permitido y efecto. Un widget es solo una interfaz para recibir valores en un notebook; no debe convertirse en almacenamiento de configuración ni en secreto. Los parámetros de Job se resuelven para un run y pueden transmitirse a tareas compatibles. La transformación convierte cadenas recibidas en tipos de dominio y falla pronto si son inválidas. Separar parámetros de datos evita pasar grandes payloads por la orquestación: una fecha, ruta o identificador referencia entradas persistidas; la tabla o Volume contiene el dataset. Así una ejecución puede reconstruirse leyendo run, código y valores registrados.`,
      [
        `Lakeflow Jobs define parámetros a nivel de job y tarea, y admite referencias dinámicas a contexto y salidas pequeñas. En un notebook, dbutils.widgets.get devuelve texto, por lo que el código debe analizar fechas, enumeraciones y límites antes de consultar. Los valores predeterminados facilitan desarrollo, pero producción debe registrar cuáles se aplicaron. Un parámetro sensible no se escribe en YAML o widgets: se resuelve mediante secretos, conexiones o identidades gobernadas según el caso.`,
        `La parametrización correcta modifica selección o destino sin duplicar lógica. process_date puede determinar una partición; catalog puede variar por target; mode puede limitarse a un conjunto seguro. Si un valor cambia estructura SQL, debe evitar concatenación insegura y usar APIs de parámetros soportadas. El contrato se prueba con valor válido, borde y error. Un run reproducible conserva la versión de código y los parámetros efectivos junto con métricas de salida.`,
      ],
      [
        concept("Parámetro de Job", "Valor declarado y registrado que configura una ejecución o tarea concreta.", "Permite reusar código y reconstruir por qué un run procesó una entrada determinada."),
        concept("Widget", "Control de notebook que expone un valor textual a la sesión interactiva o parametrizada.", "Es una interfaz de entrada, no un sistema de tipos ni un almacén de secretos."),
        concept("Referencia dinámica", "Expresión que resuelve metadatos del run o valores producidos por tareas en tiempo de ejecución.", "Conecta tareas sin valores manuales y mantiene trazabilidad del contexto."),
      ],
      "Un backfill requiere reprocesar 2026-06-30 y alguien propone editar una fecha literal en diez notebooks.",
      [
        "Definir process_date una vez en el Job y propagarlo como parámetro a las tareas que seleccionan particiones.",
        "Validar formato y rango al inicio; mantener datos intermedios en tablas, no como valores de tarea.",
        "Lanzar un run parametrizado y conservar métricas de esa fecha para comparar con producción.",
      ],
      "El backfill usa el mismo código desplegado, queda auditable y no introduce divergencias por ediciones manuales.",
    ),
    dive(
      `Databricks Connect separa la experiencia de edición local del lugar donde Spark ejecuta. El IDE mantiene código, depurador y pruebas; una sesión remota envía planes a compute de Databricks y utiliza datos gobernados allí. No es un Spark local que copie automáticamente tablas al portátil. La compatibilidad depende de la versión de Databricks Connect, runtime y capacidades soportadas; la autenticación identifica al desarrollador o principal. El modelo mental evita dos errores: asumir que el procesamiento grande ocurre localmente o creer que depurar autoriza datos adicionales. La productividad mejora cuando lógica pura se prueba localmente y las integraciones Spark se verifican contra un entorno remoto acotado.`,
      [
        `El cliente crea una SparkSession configurada para Databricks Connect. Las llamadas DataFrame se serializan mediante el protocolo compatible y el backend remoto analiza y ejecuta el plan. Solo resultados solicitados cruzan hacia el cliente, por lo que collect sigue siendo peligroso para volúmenes grandes. Unity Catalog evalúa la identidad configurada y el compute debe admitir el modo de conexión. Los logs pueden repartirse entre cliente y ejecución remota, de modo que el diagnóstico comienza ubicando dónde ocurrió el error.`,
        `La configuración reproducible fija dependencias del proyecto y una versión compatible del cliente. Los perfiles o variables de autenticación no se comitean; se utilizan mecanismos oficiales y credenciales de corta vida. Un test unitario puede ejecutar funciones sin conexión cuando no necesitan Spark, mientras un test de integración crea datos temporales gobernados y limpia su propio namespace. Así el desarrollo local no elude políticas ni convierte producción en banco de pruebas.`,
      ],
      [
        concept("Spark Connect", "Arquitectura cliente-servidor usada para construir planes en un cliente y ejecutarlos en un backend Spark remoto.", "Explica la separación entre IDE local y procesamiento de Databricks."),
        concept("Compatibilidad de versión", "Correspondencia soportada entre cliente Databricks Connect y runtime o compute remoto.", "Evita errores de protocolo y funciones inexistentes durante desarrollo."),
        concept("Prueba de integración", "Comprobación que ejercita dependencias reales como Spark remoto, catálogo y almacenamiento en un entorno controlado.", "Detecta problemas que una prueba puramente local no puede representar."),
      ],
      "Un desarrollador quiere depurar una transformación de mil millones de filas desde VS Code y ejecutar collect para inspeccionarla.",
      [
        "Confirmar que el plan se ejecutará remotamente y que collect trasladaría el resultado al cliente, creando un riesgo de memoria y datos.",
        "Probar funciones puras con fixtures locales y ejecutar una integración remota sobre una muestra gobernada representativa.",
        "Inspeccionar agregados limitados y el plan, manteniendo versiones y autenticación compatibles.",
      ],
      "Se conserva la comodidad del IDE sin extraer el dataset ni confundir depuración local con capacidad de ejecución remota.",
    ),
    dive(
      `Un proyecto productivo necesita separar tres versiones: código, dependencias e infraestructura declarada. Git folders sincroniza archivos del workspace con un repositorio y permite ramas; un lock o especificación fija bibliotecas; un paquete Python ofrece una unidad instalable e importable; un bundle describe Jobs, pipelines y targets. Copiar un notebook para dev, test y prod rompe esa identidad porque cada copia deriva. El modelo correcto promociona el mismo commit y artefacto, mientras configuración, catálogo e identidad cambian por target. Los secretos nunca forman parte del repositorio. Esta estructura hace posible revisar diferencias, reproducir un run y revertir una versión sin reconstruir manualmente el estado del workspace.`,
      [
        `Git registra contenido y relaciones entre commits. Una rama aísla trabajo; un pull request permite revisión antes de integrar. Git folders lleva ese código al workspace, pero no reemplaza las protecciones del proveedor ni almacena tablas. Los notebooks modernos pueden versionarse como archivos, aunque las salidas y estado interactivo no deben considerarse artefactos productivos. Los cambios de esquema y recursos necesitan su propia definición revisable para acompañar al código.`,
        `El paquete agrupa módulos bajo un namespace y declara versiones de dependencias. CI construye una vez el artefacto, ejecuta tests y conserva su identidad. El despliegue usa Declarative Automation Bundles o APIs para aplicar recursos por target. Un principal de servicio ejecuta producción con privilegios mínimos. Si una librería se instala manualmente en un cluster o un token aparece en configuración, ya no puede demostrarse que dos runs usaron el mismo entorno.`,
      ],
      [
        concept("Artefacto", "Salida versionada e inmutable de un proceso de construcción, como una wheel de Python.", "Permite desplegar exactamente lo probado en vez de reconstruir por ambiente."),
        concept("Git folder", "Carpeta del workspace conectada a un repositorio Git para editar y sincronizar código.", "Facilita colaboración sin convertir el workspace en fuente única de verdad."),
        concept("Lock de dependencias", "Registro de versiones concretas resueltas para bibliotecas directas y transitivas.", "Reduce diferencias de entorno y hace repetibles pruebas y ejecuciones."),
      ],
      "Un hotfix funciona en dev porque alguien instaló manualmente una librería más nueva, pero falla al desplegarse en prod.",
      [
        "Comparar dependencias declaradas y entorno efectivo para identificar la instalación no versionada.",
        "Fijar la versión, reconstruir un único artefacto y ejecutar pruebas automatizadas con ese lock.",
        "Promover el mismo artefacto mediante targets y eliminar cambios manuales del compute.",
      ],
      "Dev y prod ejecutan una unidad idéntica y la diferencia de configuración queda explícita, revisable y reversible.",
    ),
  ],
  m04: [
    dive(
      `La API DataFrame es perezosa: una transformación describe una nueva relación y una acción exige un resultado. Spark no procesa fila por fila al escribir select, filter o join; acumula un plan lógico que Catalyst puede reorganizar. count, collect, write o una visualización desencadenan un job que materializa parte del linaje. Esta separación permite pushdown, poda de columnas y elección de joins, pero también sorprende cuando una acción repetida recalcula todo. Cache solo tiene sentido si el mismo resultado costoso se reutiliza y cabe con seguridad. Para razonar sobre rendimiento, identifica dónde se define el plan, dónde nace una acción y qué fronteras de shuffle dividen stages.`,
      [
        `Cada DataFrame contiene esquema y nodo de plan, no una colección local de filas. Al invocar una transformación se devuelve otro DataFrame con un plan ampliado. Cuando llega una acción, Spark analiza, optimiza y genera un plan físico; el driver crea jobs y stages, y los executors procesan particiones. Dos acciones sobre el mismo linaje pueden ejecutar dos veces si no existe reutilización o caché efectiva. explain permite inspeccionar antes de materializar.`,
        `Persistir un DataFrame introduce una materialización reutilizable tras la primera acción y consume memoria o disco según el nivel. Debe liberarse cuando deja de servir. Escribir una tabla crea un efecto durable y su modo define semántica de repetición. collect traslada todas las filas al driver y rompe la distribución; take, limit o agregados reducidos son alternativas para inspección. La pereza no evita errores: algunos aparecen solo al ejecutar porque el plan aún no tocó datos.`,
      ],
      [
        concept("Transformación", "Operación perezosa que produce un nuevo DataFrame y amplía el plan lógico.", "Permite componer trabajo antes de que Spark elija cómo ejecutarlo."),
        concept("Acción", "Operación que solicita un resultado y desencadena la ejecución del plan necesario.", "Marca el punto donde aparecen coste, jobs y errores ligados a datos."),
        concept("Linaje", "Cadena de dependencias de transformaciones necesaria para recomputar un DataFrame.", "Explica recalculo, recuperación y cuándo una caché puede aportar valor."),
      ],
      "Un notebook llama count, display y write sobre la misma transformación cara y tarda tres veces más de lo esperado.",
      [
        "Reconocer tres acciones independientes y comprobar en Spark UI que el linaje se recalcula.",
        "Determinar si el resultado se reutiliza lo suficiente y su tamaño permite persistirlo sin presión de memoria.",
        "Persistir una vez, ejecutar las acciones necesarias, medir de nuevo y liberar la caché al terminar.",
      ],
      "La mejora se acepta solo si reduce trabajo total sin introducir spill u ocupación prolongada de memoria.",
    ),
    dive(
      `Limpiar datos significa convertir ambigüedad de origen en un contrato explícito, no encadenar dropna y cast hasta que el job termine. Primero se define el grain de la tabla, las columnas canónicas, tipos, nulos permitidos, zonas horarias y reglas de dominio. Después se distinguen tres resultados: válido, corregible y rechazado. try_cast convierte errores de representación en null para poder medirlos; cast estricto puede ser preferible cuando el contrato exige fallo. Silver debe conservar claves y evidencia de origen suficientes para reconciliar. Una regla de calidad sin denominador, umbral y acción es solo una expresión, no un control operativo.`,
      [
        `El análisis comienza con schema y profiling de valores, no inferencias desde pocas filas. Las operaciones normalizan nombres, recortan texto, convierten tipos y estandarizan timestamps en un orden que preserve información. Cada conversión crea una señal de validez: por ejemplo, amount original no nulo y amount_decimal nulo indica fallo. Las filas no deben desaparecer silenciosamente; se cuentan y, si procede, se escriben en cuarentena con razón, lote y ruta de origen.`,
        `Un contrato Silver fija claves, semántica y expectativas que los consumidores pueden asumir. Los nulos se interpretan por columna: desconocido no equivale a cero ni a cadena vacía. La calidad se mide por lote y a lo largo del tiempo para detectar degradación. Corregir en origen es mejor que acumular heurísticas, pero la plataforma necesita una política mientras tanto. La publicación se bloquea, advierte o deriva según impacto y SLA definidos por el owner.`,
      ],
      [
        concept("Grain", "Significado exacto de una fila y conjunto mínimo de dimensiones que identifica un hecho.", "Evita duplicados conceptuales y agregaciones incorrectas en capas posteriores."),
        concept("try_cast", "Conversión que devuelve null cuando un valor no puede representarse en el tipo solicitado.", "Permite cuantificar errores sin abortar todo el lote, siempre que se controle el null resultante."),
        concept("Cuarentena", "Destino gobernado para registros inválidos junto con su causa y contexto de ingestión.", "Conserva evidencia y permite reparación sin contaminar la tabla confiable."),
      ],
      "Pedidos traen amount como texto; algunos usan coma decimal, otros dicen N/A y el dashboard suma la columna.",
      [
        "Definir DECIMAL, moneda y política de formatos admitidos antes de convertir; preservar el valor original.",
        "Normalizar formatos válidos, aplicar try_cast y etiquetar los fallos con razón y lote.",
        "Publicar solo filas válidas, medir ratio y comparar suma con control de origen antes de cumplir el SLA.",
      ],
      "Silver ofrece importes con semántica conocida y una cuarentena reconciliable, en lugar de ceros inventados o pérdidas silenciosas.",
    ),
    dive(
      `Un join combina conjuntos según predicados, pero su corrección depende del grain y la cardinalidad antes que del tipo sintáctico. Inner conserva coincidencias; left preserva todas las filas izquierdas; semi responde existencia sin añadir columnas; anti conserva ausencias. Si una clave es única en un lado y repetida en otro, el resultado puede multiplicar filas legítimamente. Si se esperaba uno a uno, esa multiplicación es un defecto de datos o de predicado. Antes de optimizar broadcast o particiones, declara qué fila representa cada entrada, normaliza claves y estima conteos. Un join rápido que duplica ingresos es peor que uno lento: semántica y reconciliación son criterios de aceptación.`,
      [
        `Spark analiza la condición y elige estrategia física usando tamaños, estadísticas, hints y configuración. Un equi-join puede usar broadcast hash si un lado es pequeño, o sort-merge con shuffles para lados grandes. El tipo lógico determina supervivencia de filas independientemente de la estrategia. Los null no igualan a otros null bajo igualdad normal; si el negocio necesita equivalencia null-safe debe expresarse conscientemente. Predicados incompletos, como omitir tenant_id, producen coincidencias cruzadas.`,
        `La validación compara conteo, claves distintas, no coincidencias y distribución de multiplicidad. Para hechos enriquecidos con dimensión tipo 1, la dimensión debe tener una fila por clave efectiva. En SCD tipo 2, la condición incluye rango temporal y puede detectar solapamientos. Semi y anti joins evitan arrastrar columnas cuando solo importa existencia. Elegir primero la semántica limita el espacio de optimización y proporciona invariantes que deben mantenerse después de cualquier cambio físico.`,
      ],
      [
        concept("Cardinalidad", "Relación de multiplicidad entre claves de dos datasets, como uno-a-uno o uno-a-muchos.", "Predice el número de filas y revela duplicaciones accidentales."),
        concept("Left semi join", "Join que conserva filas izquierdas con al menos una coincidencia sin añadir columnas derechas.", "Es la forma precisa y eficiente de filtrar por existencia."),
        concept("Null-safe equality", "Comparación que considera dos null equivalentes mediante una semántica explícita.", "Evita asumir que la igualdad SQL ordinaria empareja valores desconocidos."),
      ],
      "Pedidos multitenant se unen con clientes solo por customer_id y los ingresos se duplican entre países.",
      [
        "Examinar grain y comprobar que customer_id solo es único dentro de tenant_id.",
        "Cambiar el predicado a tenant_id más customer_id y validar unicidad de la dimensión por esa clave compuesta.",
        "Reconciliar conteo e importe antes y después, y solo entonces revisar estrategia física del join.",
      ],
      "La clave compuesta restaura la correspondencia de negocio y elimina multiplicaciones sin ocultarlas mediante distinct.",
    ),
    dive(
      `Los tipos complejos conservan estructura: un struct agrupa campos con esquema, un array mantiene una secuencia y un map asocia claves con valores. No es necesario convertir JSON a cadenas ni explotar todo inmediatamente. Las funciones de orden superior transform, filter, exists y aggregate operan dentro de un array preservando la fila padre; la notación de campo navega structs; element_at consulta colecciones. explode cambia el grain al crear filas y, por tanto, exige conservar claves del padre. explode_outer mantiene una representación cuando la colección es null o vacía. Elegir entre transformación anidada y normalización depende del consumidor y de la semántica, no de una limitación de Spark.`,
      [
        `Al leer con esquema explícito, Spark representa el árbol de tipos y puede podar campos anidados en formatos compatibles. select de un campo struct no obliga a serializar todo como JSON. transform aplica una expresión a cada elemento y devuelve un array; filter conserva los elementos que cumplen; aggregate reduce la colección. Estas operaciones mantienen una fila por entidad padre y evitan shuffles que una normalización seguida de reagrupación podría introducir.`,
        `explode y posexplode son generadores: convierten cada elemento en una fila, y posexplode añade posición. Deben seleccionarse también la clave estable del padre y cualquier índice necesario para reconstruir identidad. Con arrays vacíos, explode produce cero filas; explode_outer produce una con elemento null, lo que puede ser crucial en left semantics. Tras normalizar, el nuevo grain y las pruebas de cardinalidad deben documentarse igual que en cualquier join.`,
      ],
      [
        concept("Struct", "Valor compuesto con campos nombrados y tipos definidos dentro de una columna.", "Permite conservar jerarquía y seleccionar atributos sin perder el contrato."),
        concept("Función de orden superior", "Expresión que aplica una operación a elementos de una colección sin convertirlos en filas independientes.", "Preserva grain y suele simplificar transformaciones de arrays."),
        concept("explode_outer", "Generador que expande elementos y conserva el padre con null cuando la colección no aporta elementos.", "Evita perder entidades padre cuando la ausencia de detalles tiene significado."),
      ],
      "Cada pedido contiene items y se necesita eliminar cantidades no positivas sin perder pedidos todavía vacíos.",
      [
        "Mantener inicialmente una fila por pedido y aplicar filter al array para retirar elementos inválidos.",
        "Usar explode_outer solo en la tabla de líneas, conservando order_id y posición para definir el nuevo grain.",
        "Validar número de pedidos, líneas válidas y padres sin líneas mediante métricas separadas.",
      ],
      "Se obtiene una tabla de líneas correcta y reconciliable, mientras los pedidos vacíos siguen visibles para calidad.",
    ),
    dive(
      `Una window calcula sobre un conjunto relacionado con cada fila sin colapsarlo como groupBy. PARTITION BY define el grupo lógico, ORDER BY establece secuencia y el frame delimita qué filas contribuyen. row_number asigna una prioridad total solo si el orden contiene un desempate estable; rank y dense_rank expresan empates con semánticas diferentes. Para deduplicar, primero se define la identidad del evento y qué versión debe ganar; después se ordena por tiempo de negocio, secuencia y un identificador determinista. dropDuplicates expresa igualdad, no preferencia, y en batch no garantiza conservar el evento más nuevo. El resultado se valida por unicidad y reconciliación de versiones descartadas.`,
      [
        `Spark redistribuye normalmente por las columnas de partición y ordena dentro de cada partición para evaluar la window. Muchas claves pequeñas permiten paralelismo; una clave dominante puede producir una partición sesgada. El frame por defecto depende de la función y el orden, por lo que acumulados deben declarar rowsBetween o rangeBetween cuando la diferencia importa. ORDER BY timestamp sin desempate deja resultados variables si dos eventos comparten instante.`,
        `Para la versión más reciente, row_number sobre la clave de negocio ordenada por event_ts descendente y luego ingest_id descendente produce un ganador único si ingest_id es estable. rank conservaría varios ganadores empatados y no cumple una tabla con una fila por clave. En streaming, la deduplicación además necesita límites de estado y watermark, tema distinto del batch. En todos los casos se cuentan claves duplicadas después y se conserva evidencia de descartes si el negocio requiere auditoría.`,
      ],
      [
        concept("Window specification", "Definición de partición, orden y frame utilizada para calcular una función por cada fila.", "Determina tanto la semántica como el movimiento de datos de una window."),
        concept("row_number", "Función que asigna una secuencia única dentro de cada partición según el orden declarado.", "Permite seleccionar un único ganador cuando el orden es totalmente determinista."),
        concept("Desempate estable", "Columna adicional única o de orden consistente usada cuando el criterio principal empata.", "Evita que reintentos elijan versiones diferentes con los mismos timestamps."),
      ],
      "Dos actualizaciones del mismo cliente comparten updated_at, pero una llegó después y contiene el email corregido.",
      [
        "Definir customer_id como identidad y updated_at más ingest_sequence como orden de preferencia descendente.",
        "Calcular row_number y conservar rn igual a uno, enviando las demás versiones a evidencia de deduplicación.",
        "Probar con reparticionado y segundo run que el mismo registro gana y que queda una fila por cliente.",
      ],
      "La deduplicación es reproducible y conserva la corrección tardía sin depender del orden físico de archivos.",
    ),
  ],
};

const deepDives05To08: Record<string, [LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive]> = {
  m05: [
    dive(
      `Un plan de Spark es una explicación ejecutable de cómo una intención relacional se convierte en trabajo distribuido. El plan lógico conserva operaciones como filtro, proyección y join; Catalyst lo analiza y optimiza; el plan físico elige scans, algoritmos de join, exchanges y agregaciones concretas. explain formatted muestra estructura y estimaciones, pero no sustituye métricas reales. Spark UI revela stages, tareas, bytes, shuffle, spill y distribución temporal después de ejecutar. La lectura competente conecta ambos: un Exchange anticipa redistribución, mientras las métricas confirman su volumen y equilibrio. Optimizar significa formular una hipótesis causal, cambiar una sola variable y comparar contra una línea base semánticamente equivalente.`,
      [
        `Catalyst resuelve atributos y tipos, aplica reglas como predicate pushdown o column pruning y estima alternativas con estadísticas disponibles. El plan físico puede incluir BroadcastHashJoin, SortMergeJoin, scans y Exchange. Adaptive Query Execution puede modificar ciertas decisiones durante la ejecución al observar tamaños reales. Por eso explain antes de ejecutar y el plan final adaptativo pueden diferir. Las estimaciones obsoletas ayudan a explicar elecciones inesperadas, pero el operador visible no prueba por sí solo que sea el cuello de botella.`,
        `Spark divide el plan en stages alrededor de dependencias anchas, generalmente exchanges. Cada stage contiene tareas por partición. En Spark UI se comparan mediana y máximos de duración, input, shuffle read/write, spill y tiempo de scheduler. Muchas tareas homogéneas lentas sugieren presión general; una cola extrema sugiere skew. La optimización conserva primero conteo y semántica, registra plan y métricas y solo después introduce cambios como broadcast, reparticionado o layout.`,
      ],
      [
        concept("Catalyst", "Optimizador de consultas de Spark que analiza expresiones y transforma planes lógicos en alternativas físicas.", "Permite razonar sobre por qué código distinto puede producir ejecución equivalente."),
        concept("Exchange", "Operador físico que redistribuye datos entre executors y suele crear una frontera de stage.", "Señala un shuffle potencialmente costoso que debe confirmarse con métricas."),
        concept("Plan adaptativo", "Plan que AQE puede revisar durante ejecución usando estadísticas observadas en runtime.", "Explica cambios de estrategia y particiones que no aparecen en el plan inicial."),
      ],
      "Un join tarda veinte minutos; explain muestra SortMergeJoin y dos Exchange, pero el equipo propone aumentar el driver.",
      [
        "Relacionar los Exchange con los stages y comprobar bytes, tareas máximas y spill en Spark UI.",
        "Verificar tamaños y estadísticas de ambos lados para decidir si broadcast o una corrección de skew es plausible.",
        "Aplicar una alternativa, reconciliar filas y comparar plan final, runtime y shuffle con la línea base.",
      ],
      "La acción se elige por evidencia del movimiento distribuido; no se aumenta un componente irrelevante por intuición.",
    ),
    dive(
      `Una partición de Spark es la unidad de datos que una tarea procesa secuencialmente. El número y distribución de particiones delimitan paralelismo, overhead, memoria por tarea y archivos de salida. Muy pocas dejan cores ociosos y crean tareas grandes; demasiadas producen planificación, conexiones y archivos pequeños. spark.sql.shuffle.partitions fija un punto de partida para shuffles SQL, aunque AQE puede fusionar particiones posteriores. repartition introduce una redistribución para aumentar o equilibrar; coalesce suele reducir aprovechando la distribución existente. No existe un número universal. Se dimensiona a partir de volumen comprimido, recursos, operadores y distribución, y se valida con métricas por tarea y tamaño de archivos.`,
      [
        `Las particiones de entrada proceden de archivos, bloques y configuración del lector. Tras una dependencia ancha, Spark produce nuevas particiones de shuffle. Cada tarea necesita memoria para sus operadores y escribe bloques intermedios que otros executors leen. Si una partición es enorme, una tarea puede derramar a disco o fallar; si es minúscula, el coste fijo domina. AQE puede coalescer particiones pequeñas y dividir algunas sesgadas cuando su detección es aplicable.`,
        `repartition(n, columnas) realiza un shuffle por hash o rango y debe reservarse para corregir distribución o preparar operaciones posteriores. coalesce(n) intenta combinar particiones sin redistribución completa y puede producir tamaños desiguales; coalesce(1) serializa la escritura y rara vez es aceptable. Para tablas Delta, el layout y las optimizaciones gestionadas también influyen en archivos, por lo que ajustar particiones de ejecución no debe convertirse en microgestión permanente del almacenamiento.`,
      ],
      [
        concept("Partición", "Segmento lógico de un dataset que una tarea Spark procesa en un executor.", "Conecta distribución de datos con paralelismo, memoria y duración."),
        concept("Dependencia ancha", "Relación en la que una partición de salida necesita datos de múltiples particiones de entrada.", "Suele requerir shuffle y crear una nueva etapa de ejecución."),
        concept("repartition", "Operación que redistribuye datos mediante shuffle para crear una nueva partición física.", "Puede equilibrar o aumentar paralelismo, pero añade coste que debe amortizarse."),
      ],
      "Un terabyte se agrega con ocho particiones de shuffle en un cluster de sesenta y cuatro cores y aparecen OOM por tarea.",
      [
        "Confirmar en Spark UI que solo ocho tareas procesan particiones enormes y que la distribución no es una clave sesgada aislada.",
        "Aumentar particiones de shuffle a un valor experimental acorde al volumen y permitir que AQE fusione las pequeñas.",
        "Comparar utilización, spill, duración y archivos producidos, manteniendo idéntico el resultado agregado.",
      ],
      "El trabajo usa paralelismo real y reduce memoria por tarea sin caer en miles de particiones diminutas.",
    ),
    dive(
      `Un broadcast join cambia quién se mueve. En un shuffle join ambos lados se redistribuyen por clave; en BroadcastHashJoin el lado pequeño se recopila y distribuye a los executors para construir una tabla hash local, de modo que las particiones del lado grande pueden leerse donde están. La ventaja depende del tamaño serializado real y de la memoria disponible en cada executor, no de que el dataset se llame dimensión. Catalyst puede elegir broadcast con estadísticas y umbral, y un hint puede influir, pero forzar una relación creciente puede causar OOM. Cuando ambos lados son grandes, sort-merge suele ser una estrategia razonable aunque implique shuffle.`,
      [
        `El driver coordina la materialización del lado broadcast y su distribución. Cada executor conserva una copia para resolver coincidencias de sus particiones grandes. El coste total multiplica esa memoria por executors y añade tiempo de transferencia, pero evita escribir y leer el shuffle del lado grande. Proyectar solo columnas necesarias y filtrar primero puede volver elegible una dimensión. Estadísticas inexactas pueden impedir un broadcast útil o intentar uno demasiado grande.`,
        `Un hint broadcast es una instrucción fuerte, no una garantía de que el dato cabe. Debe comprobarse el tamaño después de filtros, la variabilidad entre días y la memoria junto con otras tareas. AQE puede convertir ciertos joins usando tamaños observados. Si existe skew en la clave grande, broadcast elimina el shuffle del join pero no necesariamente otros operadores ni una agregación posterior. El resultado se valida por cardinalidad además de tiempo y bytes movidos.`,
      ],
      [
        concept("BroadcastHashJoin", "Join que replica una relación pequeña y construye una tabla hash local en cada executor.", "Evita redistribuir el lado grande cuando la memoria soporta la réplica."),
        concept("Estadística de tamaño", "Estimación del volumen de una relación usada por el optimizador para comparar estrategias.", "Una estimación obsoleta puede conducir a un plan físico inadecuado."),
        concept("Hint", "Indicación declarativa que influye en la estrategia seleccionada por Catalyst.", "Debe usarse con evidencia porque puede imponerse sobre una decisión adaptativa más segura."),
      ],
      "Una tabla de hechos de 4 TB se une cada día con una referencia filtrada de 18 MB; ambos lados se barajan.",
      [
        "Proyectar la referencia a clave y atributos necesarios y medir su tamaño efectivo después del filtro.",
        "Comprobar estadísticas y probar broadcast, verificando el operador final y memoria de executors.",
        "Reconciliar filas y comparar shuffle, duración y estabilidad en varios días de crecimiento.",
      ],
      "La referencia se replica con margen y desaparece el shuffle masivo de hechos sin comprometer la corrección.",
    ),
    dive(
      `Shuffle describe movimiento de datos entre particiones; skew describe desigualdad; spill describe uso de disco cuando el estado en memoria no cabe. Pueden coexistir, pero no son sinónimos. Un shuffle grande puede estar equilibrado y terminar correctamente. Una clave dominante produce una o pocas tareas largas aunque el resto termine pronto. Spill generalizado puede indicar particiones demasiado grandes, agregaciones extensas o memoria insuficiente. AQE adapta particiones y puede mitigar algunos joins sesgados, pero no corrige una clave nula que debería tratarse semánticamente ni una llamada collect que desborda el driver. El diagnóstico compara distribución por tarea y conecta cada síntoma con el operador del plan.`,
      [
        `Durante un shuffle, las tareas map escriben bloques por partición de destino y las tareas reduce los recuperan. Si una clave concentra gran parte de filas, su partición recibe muchos más bytes y determina la cola final. AQE puede detectar tamaños por encima de umbrales y dividir particiones sesgadas en estrategias compatibles. El salting reparte artificialmente una clave, pero requiere recomponer resultados y aumenta complejidad; filtrar o separar una categoría especial puede ser semánticamente mejor.`,
        `Spill ocurre cuando estructuras de sort, hash o agregación liberan páginas de memoria hacia disco. Una cantidad pequeña no prueba un problema, mientras spill masivo, garbage collection u OOM sí justifican revisar tamaños. Driver OOM se asocia a collect, broadcast materializado, metadatos o resultados; executor OOM ocurre dentro de tareas. Añadir memoria puede aliviar presión, pero primero se corrige distribución, proyección y algoritmo para evitar pagar por un defecto lógico.`,
      ],
      [
        concept("Skew", "Distribución extrema en la que unas pocas particiones contienen mucho más trabajo que sus pares.", "Explica colas largas que no mejoran añadiendo workers."),
        concept("Spill", "Escritura temporal a disco de estado de ejecución que no cabe en la memoria disponible.", "Indica presión de memoria, aunque su severidad debe cuantificarse."),
        concept("AQE", "Adaptive Query Execution, mecanismo que revisa decisiones físicas con estadísticas observadas durante el run.", "Puede fusionar particiones o mitigar skew sin cambiar la lógica declarada."),
      ],
      "En un stage, 399 tareas duran treinta segundos y una dura catorce minutos con una clave UNKNOWN que concentra 40%.",
      [
        "Clasificar la señal como skew y confirmar bytes y filas de la tarea extrema, no como falta global de workers.",
        "Decidir si UNKNOWN debe separarse semánticamente; evaluar AQE o salting solo si la relación necesita join normal.",
        "Reejecutar y comprobar distribución, mismo conteo y tratamiento explícito de la categoría desconocida.",
      ],
      "La cola desaparece mediante una regla de datos defendible y no mediante sobredimensionamiento permanente.",
    ),
    dive(
      `Diagnosticar empieza por localizar la fase del fallo: aprovisionamiento, inicialización, carga de dependencias, planificación, ejecución distribuida o commit de salida. Un cluster que nunca alcanza RUNNING no tiene todavía stages útiles; se investiga en eventos y configuración. Un ModuleNotFoundError pertenece al entorno de la tarea. Driver OOM y executor OOM apuntan a memorias y patrones distintos. Una consulta lenta exige plan, Spark UI o Query Profile. El mensaje exacto, run_id, task_key, compute y timestamp forman la evidencia mínima. Cambiar runtime, tamaño y código a la vez destruye causalidad. El método reproduce con el menor input que conserva el síntoma y modifica una variable por experimento.`,
      [
        `El plano de control registra eventos de creación y estado del compute; init scripts y librerías producen logs antes o durante el arranque. Una vez Spark ejecuta, driver y executors generan logs y métricas vinculadas a jobs y stages. Lakeflow Jobs añade contexto de tarea, intento y resultado. Identificar el último componente que funcionó acota la búsqueda: una permission denied al leer tabla no se arregla reinstalando Python, y un fallo de instancia no aparece en DESCRIBE HISTORY.`,
        `La reproducción mínima conserva versión de código, parámetros, identidad y una muestra que activa el fallo. El runbook registra hipótesis, cambio y resultado para evitar ensayos repetidos. Si el error desaparece al reducir datos, se investiga escala, distribución o memoria; si persiste antes de leer, se revisa entorno y permisos. Tras corregir, se añade una prueba o alerta que detecte la causa antes, no solo una nota sobre el síntoma.`,
      ],
      [
        concept("Fase de fallo", "Etapa concreta del ciclo del workload en la que deja de progresar correctamente.", "Dirige hacia la superficie de evidencia adecuada y evita cambios irrelevantes."),
        concept("Driver OOM", "Agotamiento de memoria en el proceso coordinador, a menudo por resultados locales o metadatos excesivos.", "Requiere un diagnóstico diferente del fallo de una tarea en executor."),
        concept("Reproducción mínima", "Caso más pequeño que mantiene la causa y condiciones esenciales del fallo.", "Permite probar hipótesis rápidamente sin perder causalidad."),
      ],
      "Un Job falla antes de crear Spark UI; el evento de compute indica que un init script no puede descargar un paquete.",
      [
        "Ubicar el fallo en inicialización y preservar el evento, ruta, identidad de red y versión del script.",
        "Verificar repositorio, conectividad y dependencia fijada con un compute de prueba de configuración idéntica.",
        "Corregir una causa, relanzar y añadir una comprobación de dependencia o artefacto preconstruido.",
      ],
      "La recuperación actúa sobre el entorno de arranque y evita aumentar workers o modificar transformaciones que nunca ejecutaron.",
    ),
  ],
  m06: [
    dive(
      `Una tabla Delta es un historial ordenado de acciones sobre archivos, no un directorio cuyo contenido actual se deduce listándolo. Cada commit añade una versión al transaction log con archivos agregados, retirados y metadatos. Un lector reconstruye un snapshot consistente desde log y checkpoints, y solo lee archivos activos en esa versión. Los escritores usan concurrencia optimista: trabajan sobre un snapshot y al confirmar verifican si cambios concurrentes entran en conflicto. ACID garantiza atomicidad y aislamiento del commit, pero no conoce la clave de negocio ni impide que un pipeline append inserte el mismo pedido dos veces. Idempotencia pertenece a la lógica y debe diseñarse sobre estas garantías.`,
      [
        `El escritor produce nuevos archivos de datos y prepara acciones AddFile y RemoveFile, entre otras. La publicación atómica del nuevo registro de versión hace visible todo el cambio o ninguno. Los archivos retirados pueden permanecer físicamente para time travel hasta su limpieza. Los checkpoints del log compactan metadatos para acelerar reconstrucción, pero no son checkpoints de Structured Streaming. Manipular archivos directamente elude el protocolo y puede dejar el snapshot y el almacenamiento en desacuerdo.`,
        `La validación de concurrencia compara lo leído y escrito por la transacción con commits posteriores. Operaciones sobre regiones independientes pueden coexistir; otras chocan y deben reintentarse sobre un snapshot nuevo. DESCRIBE HISTORY muestra operaciones, actores y parámetros útiles para auditoría. Sin embargo, un retry ciego de append puede confirmar otro commit válido con filas duplicadas. Claves, MERGE determinista o marcadores de lote traducen el concepto de repetición segura al dominio.`,
      ],
      [
        concept("Transaction log", "Secuencia versionada de acciones que define metadatos y archivos activos de una tabla Delta.", "Es la fuente de verdad para snapshots, historial y concurrencia."),
        concept("Concurrencia optimista", "Modelo en el que escritores avanzan sin bloqueo global y validan conflictos al confirmar.", "Permite paralelismo, pero exige manejar reintentos y operaciones conflictivas."),
        concept("Idempotencia", "Propiedad por la que repetir una operación con la misma entrada produce el mismo estado lógico.", "ACID no la aporta automáticamente y es esencial para retries seguros."),
      ],
      "Dos Jobs actualizan simultáneamente particiones distintas; uno falla por conflicto y se reintenta automáticamente.",
      [
        "Confirmar que el conflicto es transaccional y revisar qué archivos o predicados leyó y escribió cada operación.",
        "Asegurar que el retry reconstruye su fuente de forma determinista y usa MERGE o reemplazo acotado, no append duplicable.",
        "Validar historial, claves y conteos después del nuevo commit para demostrar un único estado de negocio.",
      ],
      "La tabla conserva commits atómicos y el reintento resuelve concurrencia sin crear duplicados lógicamente válidos.",
    ),
    dive(
      `Managed y external describen el control del ciclo de vida y la ubicación; no describen si una tabla es Delta, segura o accesible externamente. En una managed table de Unity Catalog, Databricks administra ubicación y archivos junto con metadatos y puede aplicar capacidades gestionadas como predictive optimization cuando corresponda. En una external table, los archivos permanecen bajo una ruta gobernada que la organización controla; DROP TABLE elimina el objeto del catálogo, pero no los bytes. Ambas necesitan privilegios y pueden usar Delta. Para una external Delta elegible, ALTER TABLE SET MANAGED convierte el objeto conservando nombre, permisos, vistas, configuración e historial; no equivale a crear una copia CTAS.`,
      [
        `Al crear una managed table sin LOCATION, Unity Catalog determina una ubicación dentro del managed storage configurado. El usuario trabaja con el nombre y evita dependencias de rutas. Al eliminarla, el servicio gestiona datos según el comportamiento y retención aplicables. Esta propiedad habilita optimizaciones más automatizadas porque Databricks controla tanto metadatos como layout. No significa que cualquier usuario pueda descubrirla: ownership y grants siguen gobernando el objeto.`,
        `Una external table referencia una ubicación cubierta por external location y una storage credential. Para convertirla con SET MANAGED debe ser Delta y, según la documentación vigente, ejecutarse en Serverless o Databricks Runtime 17.3 LTS o superior; los lectores y escritores Databricks deben inventariarse y actualizarse, se pausan operaciones OPTIMIZE y se reinician streams después del cambio. La conversión copia datos y log, hace un cambio final breve, conserva redirección temporal para accesos por ruta y permite rollback con UNSET MANAGED durante la ventana documentada de 14 días.`,
      ],
      [
        concept("Managed table", "Tabla cuyo almacenamiento de datos y metadatos gestiona Unity Catalog como una unidad de ciclo de vida.", "Es la opción recomendada cuando no se necesita controlar una ubicación externa."),
        concept("External table", "Objeto gobernado cuyos archivos residen en una ubicación externa administrada separadamente.", "Permite interoperabilidad o control cloud, pero DROP no elimina esos archivos."),
        concept("SET MANAGED", "Operación ALTER TABLE que convierte una external Delta elegible en managed conservando identidad, historial, permisos y vistas.", "Evita la pérdida de continuidad de CTAS y ofrece redirección y rollback controlados."),
      ],
      "Una external Delta de 1 TB debe adoptar optimización gestionada; todavía tiene lectores por ruta, dos streams y un Job OPTIMIZE nocturno.",
      [
        "Verificar formato, DESCRIBE DETAIL, versiones de runtime, clientes externos y compatibilidad de features antes de autorizar la conversión.",
        "Pausar OPTIMIZE, programar la ventana y ejecutar ALTER TABLE catalog.schema.table SET MANAGED desde compute compatible.",
        "Reiniciar streams, migrar accesos por ruta a nombres y conservar un plan UNSET MANAGED dentro de la ventana de rollback.",
      ],
      "La tabla conserva identidad e historial como managed, los consumidores quedan verificados y el rollback permanece disponible durante la transición.",
    ),
    dive(
      `DDL define estructura y objetos; DML expresa cambios sobre filas. En Delta, CREATE, ALTER o REPLACE modifican metadatos y versiones; INSERT, UPDATE, DELETE y MERGE producen nuevos commits. MERGE no significa simplemente sincronizar: compara una fuente con un destino mediante una condición y aplica cláusulas a filas coincidentes o no coincidentes. Para ser determinista, la fuente debe producir como máximo una versión ganadora por clave y las reglas deben decidir cómo tratar eventos tardíos. UPDATE SET * no corrige una fuente ambigua. Antes de escribir se define clave, secuencia, semántica de borrado y comportamiento de reintento.`,
      [
        `MERGE construye coincidencias entre source y target. WHEN MATCHED puede actualizar o borrar bajo una condición; WHEN NOT MATCHED puede insertar; otras cláusulas soportadas cubren filas de destino sin fuente. Delta valida que varias filas fuente no intenten modificar ambiguamente la misma fila destino según la semántica vigente. Deduplicar con window y desempate antes del MERGE convierte un lote de eventos en una fuente determinista.`,
        `La condición de secuencia evita que un evento antiguo sobrescriba estado reciente: una actualización solo se aplica si source.sequence supera o iguala la conservada según el contrato. Los deletes pueden representarse con una operación CDC o una marca lógica. Para retry, la misma fuente y clave deben terminar en el mismo estado. Métricas de operación e historial permiten reconciliar inserted, updated y deleted con el lote de entrada.`,
      ],
      [
        concept("DDL", "Lenguaje de definición que crea o modifica objetos, esquema y propiedades.", "Distingue cambios estructurales de modificaciones de filas."),
        concept("MERGE", "Operación Delta que aplica cláusulas condicionadas según coincidencia entre una fuente y un destino.", "Implementa upsert y CDC cuando clave y orden están bien definidos."),
        concept("Secuencia", "Valor monotónico de negocio o fuente que ordena versiones de una misma entidad.", "Impide que eventos tardíos reviertan un estado más reciente."),
      ],
      "Un lote contiene dos cambios del cliente 42 y el más antiguo aparece después en el archivo por orden físico.",
      [
        "Definir customer_id como clave y source_lsn como secuencia autoritativa, ignorando el orden del archivo.",
        "Seleccionar una fila ganadora por clave y aplicar MERGE solo si su secuencia supera la del destino.",
        "Repetir el lote y reconciliar métricas para verificar que el estado y el número de filas no cambian.",
      ],
      "El cliente conserva la versión más nueva y el pipeline soporta desorden y reintentos sin duplicación.",
    ),
    dive(
      `Schema enforcement protege la tabla frente a escrituras incompatibles; schema evolution modifica el contrato bajo una autorización explícita. Enforcement compara nombres, tipos y estructura con el esquema de destino y evita aceptar silenciosamente datos imposibles. Evolution puede añadir columnas o realizar cambios soportados cuando se habilita en la operación adecuada. No es una licencia para que una columna cambie de significado o para activar autoMerge global sin revisión. Bronze puede tolerar atributos nuevos para no perder ingestión; Silver debe decidir si son válidos, cómo se rellenan históricamente y qué consumidores se rompen. El esquema es sintaxis, mientras el contrato incluye semántica y calidad.`,
      [
        `Durante append o MERGE, Delta analiza el esquema de entrada. Sin evolución, una columna extra o tipo incompatible provoca error en vez de escribir un conjunto heterogéneo. mergeSchema y las cláusulas de evolución soportadas autorizan cambios locales; autoMerge amplía comportamiento de sesión y aumenta el riesgo de aceptación accidental. Column mapping y protocol features determinan compatibilidad de ciertos cambios como renombrar o eliminar sin reescritura.`,
        `Una evolución segura registra productor, motivo, compatibilidad y plan para datos existentes. Añadir una columna nullable suele ser compatible físicamente, pero puede romper un consumidor que usa SELECT * o espera JSON exacto. Cambiar STRING a INT no se resuelve declarando evolución si valores y semántica no son convertibles. Se prueba con lectores reales, se monitoriza null ratio y se promueve de Bronze a Silver solo después de validar el contrato.`,
      ],
      [
        concept("Schema enforcement", "Validación en escritura que rechaza datos que no cumplen el esquema admitido por la tabla.", "Evita corrupción silenciosa y hace visibles los cambios de productor."),
        concept("Schema evolution", "Cambio controlado del esquema de destino durante operaciones compatibles.", "Permite adaptar columnas sin desactivar la protección general."),
        concept("Column mapping", "Funcionalidad Delta que identifica columnas más allá de su nombre físico y habilita ciertos cambios de metadatos.", "Afecta renombres, drops y compatibilidad de clientes."),
      ],
      "El proveedor añade loyalty_tier a JSON; Bronze debe seguir, pero un modelo Silver exige valores conocidos.",
      [
        "Permitir la columna aditiva en Bronze de forma localizada y registrar cuándo apareció y su ratio de presencia.",
        "Definir dominio, default o nulabilidad con el owner antes de incorporarla al contrato Silver.",
        "Probar consumidores y desplegar la evolución Silver como cambio versionado, manteniendo cuarentena para valores inválidos.",
      ],
      "La ingesta no pierde eventos y la capa confiable solo expone el nuevo atributo cuando su semántica está acordada.",
    ),
    dive(
      `Time travel, RESTORE y VACUUM operan sobre dimensiones distintas del historial. Time travel lee un snapshot anterior por versión o timestamp, siempre que log y archivos necesarios sigan retenidos. RESTORE crea un nuevo commit cuyo estado lógico referencia el contenido de una versión elegida; no borra versiones posteriores del historial. VACUUM elimina físicamente archivos que ya no están activos y superan el umbral seguro, reduciendo la ventana real de time travel. OPTIMIZE, en cambio, reorganiza layout y no es una limpieza de historial. La retención se diseña con recuperación, lectores concurrentes y normativa; DESCRIBE HISTORY por sí solo no garantiza que un snapshot antiguo siga materializable.`,
      [
        `Cada commit retira lógicamente archivos pero los bytes pueden conservarse. VERSION AS OF reconstruye la lista activa en ese punto y lee esos archivos. Si VACUUM ya los eliminó, conservar entradas del log no basta. RESTORE calcula acciones para que el estado actual corresponda al snapshot objetivo y publica otra versión, permitiendo auditar la recuperación. Antes de restaurar conviene consultar el snapshot y cuantificar el impacto.`,
        `VACUUM determina archivos no referenciados por snapshots dentro de retención y los elimina. Reducir controles de seguridad sin asegurar que no existen writers o readers de larga duración puede causar fallos o pérdida de recuperación. La retención de datos, log y CDF son configuraciones relacionadas pero no idénticas. Un runbook especifica RPO, periodo requerido, copias externas si proceden y quién autoriza una limpieza agresiva.`,
      ],
      [
        concept("Time travel", "Lectura de un snapshot histórico de Delta mediante versión o timestamp disponible.", "Permite auditoría, reproducción y validación antes de una recuperación."),
        concept("RESTORE", "Operación que publica un nuevo commit para devolver el estado lógico a un snapshot anterior.", "Recupera sin reescribir manualmente archivos ni borrar el historial posterior."),
        concept("VACUUM", "Eliminación física de archivos obsoletos que superan la política de retención.", "Ahorra almacenamiento, pero limita recuperación y time travel reales."),
      ],
      "Un DELETE accidental afectó hoy a Gold; history muestra la versión previa y no se ha ejecutado VACUUM.",
      [
        "Consultar la versión anterior y comparar conteos y métricas para confirmar que representa el estado correcto.",
        "Pausar consumidores sensibles y ejecutar RESTORE autorizado a esa versión, registrando el nuevo commit.",
        "Validar datos y dependencias, reanudar el servicio y corregir controles que permitieron el DELETE.",
      ],
      "La tabla recupera el estado válido de forma auditable y conserva la secuencia completa del incidente.",
    ),
  ],
  m07: [
    dive(
      `Medallion es una separación de responsabilidades y niveles de confianza, no una obligación de triplicar físicamente todos los datos. Bronze conserva una representación fiel y reproducible de la llegada; Silver aplica contratos, deduplicación y conformidad; Gold publica modelos orientados a consumidores. Algunas fuentes o resultados pueden saltar una materialización si la trazabilidad, SLA y recuperación se mantienen. Cada frontera debe responder qué garantías se añaden, quién es owner y cómo se repara. Una capa nombrada Silver que solo copia columnas no aporta valor. El diseño se evalúa por capacidad de replay, aislamiento de cambios de origen y claridad del contrato, no por el número de carpetas de colores.`,
      [
        `Bronze suele añadir metadatos de ingestión, lote y origen mientras evita transformaciones irreversibles. Esto permite reinterpretar datos cuando cambia una regla sin volver a consultar la fuente. Silver lee Bronze incrementalmente, normaliza tipos y claves y separa inválidos. Gold puede agregarse o modelarse según consultas concretas. Las tablas Delta ofrecen commits entre fronteras, de modo que cada capa puede reintentarse y auditarse con un contrato explícito.`,
        `Materializar tiene coste de almacenamiento y latencia, pero aporta desacoplamiento y recuperación. Una vista puede bastar para una transformación ligera estable; una tabla puede ser necesaria cuando se reutiliza mucho o protege de una fuente volátil. El linaje debe permitir rastrear una métrica Gold hasta registros y reglas previas. Retención y acceso pueden diferir: no todos los consumidores necesitan ver payload Bronze sensible.`,
      ],
      [
        concept("Bronze", "Capa de ingestión que conserva datos de origen y contexto suficiente para replay y auditoría.", "Aísla cambios de fuente y evita depender de una reextracción imposible."),
        concept("Silver", "Capa de entidades o eventos conformados que cumplen tipos, claves y reglas de calidad definidos.", "Proporciona una base reutilizable y confiable para distintos productos."),
        concept("Gold", "Capa de productos de datos optimizados para preguntas y consumidores concretos.", "Traduce entidades confiables a métricas y modelos con SLA de consumo."),
      ],
      "Telemetría de dispositivos se usa para auditoría cruda, alertas operativas y un informe mensual agregado.",
      [
        "Conservar payload y metadatos de archivo en Bronze para replay, con acceso restringido.",
        "Normalizar dispositivo, timestamp y calidad en Silver, separando eventos inválidos y duplicados.",
        "Crear Gold para alertas y agregados mensuales según SLA, materializando solo donde mejora aislamiento o coste.",
      ],
      "Cada consumidor recibe el nivel apropiado de detalle y confianza sin imponer tres copias idénticas.",
    ),
    dive(
      `Silver convierte registros de una fuente en entidades y eventos con significado compartido. El proceso comienza declarando grain y clave, después tipos, zonas horarias, deduplicación, referencias y reglas de calidad. Conformar no significa borrar toda anomalía: significa decidir qué es válido, qué puede corregirse y qué se cuarentena, conservando evidencia. Una tabla Silver reutilizable evita que cada equipo interprete de forma distinta customer_id o revenue. Su contrato necesita owner, SLA y estrategia de cambios. Las reglas deben ser medibles por lote y temporalmente, porque un 99% de validez puede ocultar deterioro concentrado en un país o una fuente.`,
      [
        `La transformación preserva identificadores de origen y añade claves canónicas. Los tipos se convierten con señales de error; timestamps se normalizan manteniendo zona o instante correcto; eventos repetidos se ordenan por secuencia estable. Los joins con referencias se validan por cardinalidad. Las filas fallidas se etiquetan con regla y contexto, y las métricas resumen total, válido, rechazado y corregido. Esta contabilidad permite reconciliar Silver con Bronze.`,
        `El contrato Silver se publica junto con comentarios, expectations o pruebas aplicables. NOT NULL y CHECK pueden proteger determinadas invariantes Delta, mientras otras reglas requieren evaluación de pipeline. Las restricciones informativas no siempre se aplican físicamente y no deben confundirse con validación. Cuando cambia el productor, Bronze absorbe la llegada y Silver negocia la evolución; así los consumidores no reciben semántica nueva por accidente.`,
      ],
      [
        concept("Conformidad", "Proceso de convertir representaciones heterogéneas a claves, tipos y semántica compartidos.", "Hace comparables datos de varias fuentes y reutilizables los modelos posteriores."),
        concept("Regla de calidad", "Condición medible con ámbito, umbral y acción acordada ante incumplimiento.", "Convierte una suposición de datos en un control operativo."),
        concept("Reconciliación", "Comprobación cuantitativa de que entradas, salidas y descartes explican el procesamiento completo.", "Detecta pérdidas o multiplicaciones silenciosas durante transformación."),
      ],
      "Dos CRM usan identificadores y zonas horarias diferentes para clientes y ambos alimentan campañas globales.",
      [
        "Definir una clave canónica y reglas de enlace, preservando identificadores originales y sistema de procedencia.",
        "Normalizar timestamps a una semántica común y medir ambigüedades, duplicados y enlaces no resueltos.",
        "Publicar Silver solo con reglas aprobadas, dejando casos ambiguos en cuarentena para resolución del owner.",
      ],
      "Las campañas usan una entidad cliente defendible y las excepciones quedan visibles en vez de fusionarse arbitrariamente.",
    ),
    dive(
      `Gold es una interfaz de datos para una decisión o aplicación. Puede ser tabla, vista, materialized view o streaming table; la elección equilibra frescura, coste de recomputación, complejidad y capacidad de recuperación. Una vista calcula al consultar y conserva máxima actualidad, pero traslada coste y variabilidad al consumidor. Una materialized view mantiene físicamente resultados y Databricks gestiona su actualización según capacidades. Una tabla creada por Job ofrece control explícito. Una streaming table representa ingestión o transformación incremental continua. Antes de elegir se define métrica, grain, dimensiones, SLA y patrón de consulta. Gold no es simplemente la última sentencia SELECT de Silver.`,
      [
        `Una vista guarda la consulta y aplica permisos sobre el objeto, pero el motor ejecuta sus dependencias cuando se usa. Una materialized view almacena resultados y el sistema decide cómo refrescarlos incrementalmente cuando puede, lo que reduce latencia de lectura a cambio de mantenimiento. Las tablas de salida de Jobs se actualizan con la semántica que implemente el workflow. El consumidor debe conocer periodicidad y momento de corte para interpretar cifras.`,
        `El diseño físico sigue las preguntas: filtros frecuentes, rango temporal, cardinalidad y concurrencia. La tabla Gold incluye descripciones y controles de calidad derivados de Silver. Si varias métricas comparten definición, centralizarlas evita divergencia; si tienen granos incompatibles, mezclarlas puede duplicar. Los accesos se conceden al producto estable y se restringen detalles sensibles. El SLA incluye freshness, disponibilidad y comportamiento cuando la actualización falla.`,
      ],
      [
        concept("Materialized view", "Consulta cuyo resultado se almacena y mantiene mediante una actualización gestionada.", "Reduce coste de lectura para transformaciones repetidas y puede aprovechar mantenimiento incremental."),
        concept("Freshness", "Edad del dato publicado respecto al evento o corte esperado por el consumidor.", "Determina si schedule, actualización incremental y alertas cumplen el producto."),
        concept("Producto de datos", "Dataset con consumidor, semántica, owner, calidad y SLA explícitos.", "Obliga a diseñar Gold como contrato de uso y no como residuo técnico."),
      ],
      "Un dashboard consulta cada minuto una agregación de 5 TB que cambia cada quince minutos y tarda cuarenta segundos.",
      [
        "Definir que la frescura requerida es quince minutos y que cientos de lecturas repiten exactamente la agregación.",
        "Evaluar una materialized view o tabla incremental que mantenga el resultado, frente a recalcular una vista en cada consulta.",
        "Medir tiempo de refresh, latencia de lectura, coste y comportamiento ante fallo antes de fijar el contrato.",
      ],
      "El producto sirve resultados consistentes con baja latencia y una frescura explícita, sin recomputación redundante.",
    ),
    dive(
      `El modelado dimensional organiza hechos medibles alrededor de contexto descriptivo. Una tabla de hechos declara un grain y contiene medidas y claves hacia dimensiones; una dimensión describe entidades como cliente, producto o fecha. El esquema estrella favorece consultas comprensibles y evita unir cadenas normalizadas innecesarias para BI. La decisión central es el grain: una fila por línea de pedido no es una fila por pedido ni por día. Mezclar medidas de granos distintos produce doble conteo. Las dimensiones lentamente cambiantes determinan si una consulta debe ver atributos actuales o los vigentes cuando ocurrió el hecho. Claves sustitutas y rangos temporales hacen explícita esa historia.`,
      [
        `En un hecho transaccional, cada evento se inserta al grain definido y las medidas aditivas pueden sumarse sobre dimensiones compatibles. Una dimensión tipo 1 sobrescribe atributos y representa estado actual. Tipo 2 cierra la versión anterior y abre otra con vigencia, conservando historia. Al cargar un hecho, se resuelve la versión dimensional válida para el timestamp del evento, normalmente con clave de negocio y rango temporal.`,
        `Las claves sustitutas separan identidad del warehouse de claves cambiantes de origen. Una dimensión fecha aporta atributos calendáricos consistentes. Las relaciones primary/foreign key en Unity Catalog pueden ser informativas y ayudar a herramientas, pero las garantías efectivas deben validarse según capacidades. El modelo se prueba con consultas de reconciliación y casos tardíos: un cambio de segmento recibido tarde no debe reasignar ventas históricas si el contrato exige perspectiva temporal.`,
      ],
      [
        concept("Grain de hecho", "Evento o nivel exacto que representa una fila de la tabla de hechos.", "Es la base para interpretar medidas y evitar doble conteo."),
        concept("Dimensión SCD tipo 2", "Dimensión que conserva versiones con intervalos de vigencia para representar cambios históricos.", "Permite analizar hechos con el contexto que era válido cuando ocurrieron."),
        concept("Clave sustituta", "Identificador interno estable asignado a una versión dimensional, separado de la clave fuente.", "Resuelve múltiples fuentes y versiones sin depender de identificadores operacionales mutables."),
      ],
      "Un cliente cambia de región en julio; finanzas debe atribuir ventas de junio a la región antigua y las nuevas a la actual.",
      [
        "Elegir SCD tipo 2 porque el análisis exige contexto histórico, no solo el atributo más reciente.",
        "Cerrar la versión antigua y crear otra con rangos no solapados y una nueva clave sustituta.",
        "Resolver cada hecho por customer_id y order_ts, validando que exactamente una versión dimensional coincide.",
      ],
      "Las ventas mantienen atribución temporal correcta y el cambio de región no reescribe la historia financiera.",
    ),
    dive(
      `Un contrato de datos reúne lo que productor y consumidores pueden asumir: esquema, significado, grain, claves, calidad, frescura, retención, ownership y política de cambios. Un DDL captura solo una parte. El contrato debe ser verificable mediante pruebas y observabilidad, y cada incumplimiento necesita acción y responsable. La evolución compatible se juzga desde consumidores: añadir una columna nullable puede ser sintácticamente segura, pero romper SELECT * o una serialización rígida. Versionar contratos no implica duplicar siempre tablas; implica comunicar, probar y controlar la transición. Sin ownership, una alerta solo describe un problema. Sin SLA medido, la promesa de datos frescos no es operable.`,
      [
        `El productor publica esquema y semántica junto con reglas como unicidad, dominio, null ratio y reconciliación. El pipeline evalúa estas reglas por lote o ventana y registra métricas. Unity Catalog aporta comentarios, tags, linaje y privilegios; expectations y tests aportan controles de proceso. Los consumidores validan compatibilidad en CI o un entorno de prueba. Cada campo crítico indica unidad, zona temporal y tratamiento de desconocidos.`,
        `El proceso de cambio clasifica adición, deprecación o ruptura. Una columna nueva se anuncia y prueba; un rename puede requerir coexistencia; un cambio de grain suele necesitar una nueva versión del producto. El owner aprueba excepciones y define periodo de migración. Durante operación, freshness y calidad se observan juntas: una tabla actualizada a tiempo con 30% de nulos no cumple el contrato completo.`,
      ],
      [
        concept("Contrato de datos", "Acuerdo verificable sobre estructura, semántica, operación y evolución de un producto de datos.", "Reduce interpretaciones implícitas y coordina cambios entre equipos."),
        concept("Cambio compatible", "Modificación que los consumidores soportados pueden adoptar sin alterar su comportamiento esperado.", "Debe demostrarse con pruebas, no asumirse por ser aditiva."),
        concept("Ownership", "Responsabilidad explícita de decidir, operar y responder por un dataset o contrato.", "Convierte alertas y solicitudes de cambio en acciones con autoridad."),
      ],
      "El productor quiere renombrar net_sales y cambiar euros por céntimos sin avisar a doce dashboards.",
      [
        "Clasificar el cambio de nombre y unidad como ruptura semántica aunque el tipo siga siendo numérico.",
        "Publicar temporalmente una columna o versión nueva con unidad documentada y pruebas de equivalencia.",
        "Acordar migración con consumidores, observar uso y retirar el campo antiguo solo tras el periodo definido.",
      ],
      "La evolución evita cifras mil veces mayores y deja una transición auditable con responsables y fecha de retirada.",
    ),
  ],
  m08: [
    dive(
      `Seleccionar ingesta significa traducir propiedades de la fuente a garantías de destino. Un conjunto finito de archivos puede cargarse en batch; una ruta creciente necesita descubrimiento incremental; una base operacional puede requerir snapshot, consultas JDBC o CDC; una API exige paginación y control de límites. Volumen, velocidad, esquema, orden, borrados, autenticación, replay y SLA determinan la herramienta. COPY INTO, Auto Loader y Lakeflow Connect no son sinónimos de pequeño, mediano y grande: ofrecen modelos de estado y operación distintos. La decisión autosuficiente identifica primero qué constituye un dato nuevo y cómo se demuestra que no se perdió ni se procesó dos veces.`,
      [
        `La ingesta batch enumera una entrada acotada y publica un commit. La incremental mantiene estado sobre archivos, offsets o cambios para continuar desde un punto. Una fuente mutable obliga a decidir si se extrae estado actual o eventos de cambio. El destino Bronze conserva metadatos suficientes para reconciliar: identificador de lote, archivo, offset, tiempo de extracción y versión de esquema. Unity Catalog gobierna rutas, conexiones y tablas para evitar credenciales embebidas.`,
        `El SLA incluye latencia y recuperación. Polling frecuente puede crear ejecuciones vacías; notificaciones o conectores reducen esa carga. Un conector gestionado simplifica operación si soporta la fuente y semántica necesarias; código personalizado aporta control con mayor responsabilidad. Antes de producción se prueba backfill, duplicación, borrado y caída entre lectura y commit. La elección se documenta con una alternativa descartada y su trade-off observable.`,
      ],
      [
        concept("Unidad incremental", "Elemento cuya identidad permite reconocer progreso, como archivo, offset o versión de cambio.", "Define cómo reanudar y evitar reprocesamiento accidental."),
        concept("Replay", "Capacidad de volver a procesar una entrada durable desde un punto conocido.", "Es esencial para corregir lógica sin depender de la disponibilidad de la fuente."),
        concept("CDC", "Captura de inserciones, actualizaciones y borrados de una fuente con orden o secuencia asociados.", "Conserva cambios que un snapshot periódico podría perder."),
      ],
      "Una base actualiza pedidos cada minuto, elimina cancelados y solo permite una ventana nocturna para extractos completos.",
      [
        "Reconocer que snapshots diarios pueden perder estados intermedios y que los borrados necesitan representación explícita.",
        "Evaluar un conector CDC gestionado o log-based compatible, con secuencia y destino Bronze durable.",
        "Diseñar snapshot inicial, reanudación, reconciliación y tratamiento de deletes antes de fijar el SLA.",
      ],
      "La ingesta conserva cada cambio relevante y puede reanudarse sin repetir extractos completos ni ignorar borrados.",
    ),
    dive(
      `El formato determina qué información estructural puede usar el motor antes de leer cada valor. CSV es texto sin tipos embebidos y exige delimitador, escape, locale y esquema externo. JSON conserva jerarquía, pero su verbosidad y variabilidad complican análisis masivo. Parquet es columnar, tipado y comprimido; permite poda de columnas y pushdown de filtros según metadatos. Delta usa Parquet para datos y añade transaction log, versiones y DML. La compresión reduce bytes a costa de CPU con algoritmos distintos. Elegir no es solo comparar tamaño: se valora interoperabilidad, evolución, patrones de lectura, calidad y necesidad de transacciones.`,
      [
        `Un lector CSV debe tokenizar cada registro y convertir texto según esquema; inferSchema añade lectura y puede producir tipos inestables entre lotes. JSON requiere un esquema para estabilizar structs y arrays. Parquet almacena columnas en grupos con estadísticas y codecs, de modo que una consulta puede evitar columnas y, en algunos casos, grupos irrelevantes. Sin embargo, miles de archivos pequeños añaden metadatos y overhead aunque el formato sea columnar.`,
        `Delta registra archivos Parquet activos y metadatos en commits, habilitando enforcement, MERGE e historial. No convierte automáticamente un modelo incorrecto en eficiente: layout, tamaños y filtros siguen importando. Para intercambio, el formato fuente puede conservarse en landing y normalizarse a Delta Bronze. La elección de codec se prueba con tiempo de escritura, lectura y ratio; un archivo más pequeño no es mejor si incumple la latencia de procesamiento.`,
      ],
      [
        concept("Formato columnar", "Organización física que almacena valores de una misma columna juntos y conserva metadatos por grupos.", "Favorece poda, compresión y análisis de subconjuntos de columnas."),
        concept("Predicate pushdown", "Aplicación de filtros en el lector para evitar materializar datos que no pueden cumplirlos.", "Reduce I/O cuando el formato y la expresión lo permiten."),
        concept("Codec", "Algoritmo que comprime y descomprime bloques de datos con trade-offs de tamaño y CPU.", "Afecta coste de storage, red y tiempo de proceso."),
      ],
      "Un proveedor entrega CSV de 2 TB diarios y cada lote infiere amount de modo distinto por valores vacíos.",
      [
        "Rechazar inferencia como contrato y declarar esquema, locale, delimitador y política de registros corruptos.",
        "Conservar archivo original en landing y convertir una vez a Delta Bronze con metadatos de origen.",
        "Comparar tamaño y tiempo de consultas representativas, verificando tipos y conteos después de la conversión.",
      ],
      "La plataforma estabiliza el esquema y evita releer texto costoso, sin perder la evidencia entregada por el proveedor.",
    ),
    dive(
      `COPY INTO es una carga SQL incremental de archivos que registra qué entradas se procesaron para una tabla y permite reejecutar sin cargar normalmente los mismos archivos. Es apropiado para lotes simples o periódicos desde object storage cuando no se necesita el control streaming de Auto Loader. La idempotencia se basa en identidad de archivos y estado de carga, no en la clave de negocio; si el productor publica el mismo contenido con otro nombre, puede volver a entrar. FILEFORMAT, FORMAT_OPTIONS y COPY_OPTIONS separan cómo leer de cómo cargar. Validación, esquema y errores deben configurarse conscientemente antes de convertir COPY INTO en una promesa de exactamente una fila por evento.`,
      [
        `La sentencia resuelve una ruta gobernada, lista archivos candidatos y compara su identidad con el historial de cargas mantenido para la tabla. Los nuevos se leen con el formato y opciones declarados y se confirman en Delta. Un fallo antes del commit puede reintentarse; una ejecución posterior omite archivos ya registrados salvo opciones explícitas. Patrones y validación permiten acotar, pero rutas cambiantes o sobrescrituras del proveedor requieren un contrato adicional.`,
        `COPY INTO no mantiene un checkpoint de Structured Streaming ni descubre con las mismas optimizaciones a escala de Auto Loader. Es fácil de programar en Jobs y auditar mediante historial y métricas de fila. Para seguridad se usa un Volume o external location, no claves en la sentencia. Se prueba con primer run, segundo run, un archivo nuevo, un archivo malformado y una copia renombrada para comprender los límites reales de idempotencia.`,
      ],
      [
        concept("COPY INTO", "Comando SQL que carga archivos nuevos en una tabla y mantiene estado de archivos procesados.", "Ofrece una ruta batch simple y reintentable para object storage."),
        concept("FILEFORMAT", "Declaración del formato de origen que selecciona el lector de los archivos.", "Debe corresponder a la representación física y no sustituye opciones de parseo."),
        concept("Identidad de archivo", "Metadatos usados para distinguir entradas ya procesadas de candidatas nuevas.", "Aclara por qué renombrar contenido puede provocar una nueva carga."),
      ],
      "Cada hora llegan veinte Parquet inmutables; el volumen es moderado y el equipo solo opera SQL batch.",
      [
        "Confirmar que la fuente es append-only, los nombres son estables y una hora cumple la frescura requerida.",
        "Usar COPY INTO desde una ubicación gobernada y programarlo como Job con esquema y métricas explícitas.",
        "Ejecutar dos veces el mismo lote y añadir un archivo nuevo para demostrar estado e idempotencia por archivo.",
      ],
      "La solución cumple el SLA con mínima operación y deja claro que duplicados de negocio requieren controles separados.",
    ),
    dive(
      `JDBC y ODBC presentan un modelo tabular de consulta; REST presenta recursos y respuestas paginadas bajo un contrato HTTP. En JDBC, la partición de lectura determina paralelismo y puede sobrecargar la base si se eligen demasiadas conexiones. Predicados y columnas deben empujarse cuando sea posible. En REST, cada página, cursor, límite de tasa, retry y error parcial forma parte del estado. Ninguna interfaz debe usarse como almacenamiento intermedio invisible: las respuestas se persisten durably antes o junto con su transformación. La autenticación se resuelve mediante secretos o conexiones gobernadas, y los logs nunca deben exponer tokens o datos sensibles.`,
      [
        `spark.read.jdbc puede dividir un rango mediante partitionColumn, lowerBound, upperBound y numPartitions, creando consultas concurrentes. Los límites no filtran necesariamente el conjunto; determinan el stride de partición, por lo que la consulta debe incluir su propia condición incremental. Una columna distribuida de forma desigual produce skew. El aislamiento y la ventana de lectura de la base determinan si las particiones observan un snapshot consistente.`,
        `Una extracción REST itera next token o enlaces hasta completar, respeta Retry-After y distingue errores recuperables de inválidos. El checkpoint guarda cursor y lote confirmado solo después de persistir la página, para no saltar datos tras un fallo. Las respuestas originales pueden almacenarse en landing con request id, timestamp y hash. La lógica de paginación se prueba con página vacía, última página, 429 y respuesta repetida.`,
      ],
      [
        concept("Pushdown", "Ejecución de proyecciones o filtros en el sistema fuente en lugar de transferir todos los datos.", "Reduce red y carga Spark, aunque debe verificarse en el plan."),
        concept("Cursor", "Token opaco emitido por una API para continuar una secuencia paginada desde una posición.", "Debe persistirse con el lote confirmado para reanudar sin huecos."),
        concept("Rate limit", "Política del servicio que restringe solicitudes en una ventana y comunica cómo reintentar.", "Obliga a diseñar backoff y throughput sin provocar bloqueos."),
      ],
      "Una API devuelve cien elementos por página, limita a diez solicitudes por segundo y falla después de la página 800.",
      [
        "Persistir cada página con cursor de entrada, request id y hash antes de avanzar el progreso confirmado.",
        "Aplicar backoff con jitter para 429 y reintentar desde el último cursor confirmado, no desde el principio sin deduplicación.",
        "Reconciliar elementos y páginas, controlando respuestas repetidas mediante una clave estable de la API.",
      ],
      "La extracción reanuda sin huecos ni tormentas de peticiones y conserva evidencia para reproducir el lote.",
    ),
    dive(
      `Landing es una frontera durable entre recepción y procesamiento. Conserva los bytes entregados, identidad del objeto, tiempo, productor, lote y, cuando procede, checksum o metadatos de transporte. No es un vertedero anónimo ni necesariamente una tabla para analistas. Su propósito es demostrar qué llegó y permitir replay cuando cambia la lógica Silver o falla un proceso posterior. Unity Catalog Volumes y external locations gobiernan rutas y evitan credenciales en código. La estructura de carpetas puede ayudar a operación, pero no debe sustituir un manifiesto y metadatos consultables. Retención, cifrado, clasificación y acceso se definen según sensibilidad y capacidad de reextracción.`,
      [
        `El receptor escribe un objeto inmutable o lo registra con identidad estable antes de marcar el lote disponible. Un manifiesto incluye nombre, tamaño, checksum, source timestamp y estado. La ingesta a Bronze añade _metadata.file_path y tiempos para relacionar filas con archivos. Si el productor sobrescribe nombres, una zona de llegada debe versionar o renombrar de forma controlada; de lo contrario, el replay no reconstruye exactamente la entrada original.`,
        `El acceso se concede a service principals de ingesta y operación, no a todos los consumidores. La retención equilibra regulación, coste y posibilidad de recuperar desde fuente. Un proceso de limpieza solo elimina datos cuando los commits posteriores y los requisitos de replay lo permiten. Los archivos inválidos se conservan con estado y razón, sin mezclarse de nuevo automáticamente. Las métricas de manifiesto se comparan con filas Bronze para detectar pérdida o lectura parcial.`,
      ],
      [
        concept("Landing zone", "Área gobernada donde se conserva la representación recibida antes de transformaciones irreversibles.", "Desacopla disponibilidad de la fuente y permite replay verificable."),
        concept("Manifiesto", "Registro de objetos esperados y observados con tamaño, checksum, lote y estado.", "Permite reconciliar transferencias y detectar archivos ausentes o alterados."),
        concept("Provenance", "Información que relaciona un dato con productor, objeto, instante y proceso de origen.", "Sustenta auditoría y localización de errores a lo largo del pipeline."),
      ],
      "Un proveedor sobrescribe orders.csv cada noche y a veces corrige el archivo dos horas después sin avisar.",
      [
        "Copiar cada recepción a una ruta inmutable con timestamp y checksum antes de procesar.",
        "Registrar ambas versiones en el manifiesto y asociar filas Bronze a la versión exacta mediante metadatos.",
        "Definir con negocio si la corrección reemplaza el lote y ejecutar replay idempotente con evidencia de diferencias.",
      ],
      "La plataforma puede explicar y reproducir cada versión recibida, incluso cuando el nombre externo no cambia.",
    ),
  ],
};

const deepDives09To12: Record<string, [LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive]> = {
  m09: [
    dive(
      `Auto Loader es una fuente incremental de Structured Streaming llamada cloudFiles que transforma un directorio creciente en una secuencia de archivos descubiertos y procesados con estado. No observa filas nuevas dentro de un archivo mutable ni convierte automáticamente duplicados de negocio en eventos únicos. Su unidad de progreso es el archivo identificado durante descubrimiento. Un checkpoint conserva avance de streaming y el schema location mantiene la historia usada para inferencia y evolución; cumplen funciones distintas y ambos pertenecen a una única carga lógica. Auto Loader puede ejecutarse directamente con Structured Streaming o dentro de Spark Declarative Pipelines, el framework actual que sustenta la oferta gestionada Lakeflow pipelines, denominación todavía visible en materiales anteriores.`,
      [
        `El lector usa format cloudFiles y cloudFiles.format para interpretar archivos subyacentes. Durante cada trigger descubre candidatos nuevos, consulta su estado y planifica un microbatch. La consulta transforma esos datos y un sink transaccional confirma el lote junto con el avance del checkpoint según las garantías del motor. El modo availableNow procesa lo disponible y termina; un trigger continuo mantiene la consulta activa. La elección depende del SLA y del coste operativo, no cambia la naturaleza incremental de la fuente.`,
        `La inferencia de esquema muestrea archivos y persiste el resultado en schemaLocation. Con schema evolution, una columna nueva puede detener, rescatar o ampliar el esquema según configuración; el comportamiento debe probarse y monitorizarse. rescuedDataColumn conserva campos que no encajan, pero no sustituye un contrato Silver. Cada pipeline y ambiente usa rutas de checkpoint y esquema exclusivas: compartirlas mezcla progreso, impide backfills independientes y puede hacer que una aplicación crea haber procesado archivos que pertenecían a otra.`,
      ],
      [
        concept("cloudFiles", "Nombre de la fuente de Structured Streaming de Auto Loader que descubre y procesa incrementalmente archivos en almacenamiento cloud.", "Distingue el mecanismo de descubrimiento del formato real, como JSON, CSV o Parquet, contenido en cada archivo."),
        concept("Checkpoint", "Directorio durable que conserva offsets, commits y estado necesario para reanudar una consulta de streaming identificable.", "Permite continuar después de un fallo sin olvidar el progreso confirmado por esa carga lógica concreta."),
        concept("Schema location", "Ubicación durable donde Auto Loader registra el esquema inferido y su evolución a través de lotes sucesivos.", "Separa la historia del contrato estructural del progreso de datos guardado en el checkpoint."),
      ],
      "Una plataforma recibe decenas de miles de JSON por hora en una ruta S3, requiere resultados cada quince minutos y debe recuperarse tras reinicios sin releer seis meses completos.",
      [
        "Seleccionar Auto Loader porque la fuente es un directorio append-only creciente y la unidad incremental verificable es cada archivo descubierto.",
        "Configurar cloudFiles, esquema explícito o controlado, schemaLocation y checkpoint únicos, usando availableNow programado si satisface los quince minutos.",
        "Probar primer lote, reinicio y columna nueva, reconciliando archivos y filas antes de declarar cumplidas recuperación y evolución.",
      ],
      "La ingesta reanuda desde estado durable, limita el trabajo a archivos nuevos y hace visible cualquier cambio de esquema antes de contaminar Silver.",
    ),
    dive(
      `Directory listing y file notification son estrategias para encontrar archivos, no formatos de entrada ni garantías de entrega final. El listado consulta la jerarquía de object storage y compara resultados con estado; es sencillo y funciona sin infraestructura de eventos, pero su coste de enumeración crece con rutas enormes. Las notificaciones aprovechan eventos cloud y colas para señalar objetos nuevos, reduciendo listados a escala, a cambio de permisos y componentes adicionales. Auto Loader administra el estado de archivos en ambos casos. La elección depende de número total de objetos, tasa de llegada, SLA, restricciones de red y capacidad operativa. Un evento de notificación no sustituye la validación del objeto ni el commit del sink.`,
      [
        `En listing, el descubrimiento obtiene metadatos de objetos y Auto Loader filtra los que ya constan procesados. Organizar prefijos y evitar backfills mezclados puede reducir trabajo, aunque las rutas deben seguir siendo reproducibles. El servicio cloud puede ofrecer listados consistentes con sus propias características, pero el pipeline debe tratar la identidad del archivo y el estado del checkpoint como autoridad de proceso. Un listado frecuente sobre millones de objetos puede dominar coste y latencia.`,
        `En notification mode, eventos de creación llegan a una cola o servicio administrado. Databricks obtiene candidatos y verifica los archivos antes de leerlos; eventos duplicados o desordenados son normales en arquitecturas de mensajería y el estado evita procesarlos sin control. En configuraciones modernas puede existir file events administrado mediante external locations. Los permisos deben cubrir eventos y almacenamiento, y el runbook necesita explicar retrasos, objetos borrados antes de lectura y recuperación de una cola interrumpida.`,
      ],
      [
        concept("Directory listing", "Descubrimiento que enumera objetos bajo una ruta y compara sus metadatos con el estado incremental previamente conservado.", "Ofrece menor complejidad inicial, pero puede convertirse en el coste dominante cuando la jerarquía acumula millones de archivos."),
        concept("File notification", "Descubrimiento basado en eventos cloud que anuncian la creación de objetos mediante una cola o servicio equivalente.", "Reduce enumeraciones masivas, aunque añade configuración de identidad, eventos y operación de la infraestructura asociada."),
        concept("File event", "Señal potencialmente duplicada o desordenada que identifica un objeto candidato, no una confirmación de procesamiento completo.", "Obliga a conservar estado y verificar el archivo antes de considerar que los datos llegaron correctamente al destino."),
      ],
      "Una landing contiene ciento cincuenta millones de objetos históricos y recibe dos millones diarios; el listado de cada trigger tarda más que la transformación y amenaza el SLA.",
      [
        "Separar tiempo de descubrimiento y proceso mediante métricas, confirmando que la enumeración acumulada es el cuello y no el parseo.",
        "Evaluar file notification o file events administrados con permisos mínimos, retención de cola y ruta externa correctamente gobernada.",
        "Ejecutar ambos modos sobre una ventana representativa y comprobar latencia, coste, duplicados de eventos y reconciliación de archivos procesados.",
      ],
      "La estrategia basada en eventos reduce el trabajo de enumeración sin confundir una notificación con un commit exitoso ni perder capacidad de recuperación.",
    ),
    dive(
      `Lakeflow Connect organiza opciones de ingesta desde conectores muy gestionados hasta interfaces más personalizables. Los managed connectors encapsulan autenticación, lectura incremental, serverless compute y destino gobernado para fuentes soportadas. Los standard connectors exponen capacidades desde SQL, Python o APIs de streaming cuando se necesita controlar transformaciones, opciones o fuentes. La documentación actual recomienda comenzar por la capa más gestionada que cumpla requisitos y descender solo ante una limitación concreta. El framework de transformaciones se denomina Spark Declarative Pipelines; Lakeflow pipelines es la oferta gestionada que lo extiende y aún aparece como nombre abreviado en el blueprint y material heredado. Ningún conector elimina la necesidad de validar semántica CDC y SLA.`,
      [
        `Un managed connector suele definir una Connection de Unity Catalog, una ingestion pipeline y streaming tables de destino. La Connection protege detalles de autenticación y es un securable; el pipeline lee snapshots o cambios según el conector y se ejecuta en serverless por defecto cuando está disponible. El equipo opera configuración, schedule, selección de objetos y observabilidad, sin implementar la lógica de bajo nivel. Las funcionalidades y estados de disponibilidad varían por fuente y nube, por lo que deben comprobarse antes de comprometer el diseño.`,
        `Un standard connector permite usar Auto Loader, Kafka, JDBC u otras fuentes desde Structured Streaming o Spark Declarative Pipelines, con mayor control sobre opciones y código. Ese control transfiere responsabilidad por checkpoints, evolución, retries, compatibilidad y rendimiento. Un conector gestionado tampoco garantiza que el modelo de destino represente correctamente deletes, secuencia o claves; se reconcilian snapshot inicial, cambios y conteos con la fuente. La decisión registra qué requisito no cubría la capa más administrada.`,
      ],
      [
        concept("Managed connector", "Integración configurada que administra lectura incremental, compute y publicación gobernada para una fuente empresarial explícitamente soportada.", "Reduce código y operación cuando sus capacidades, región y semántica coinciden con los requisitos reales de ingestión."),
        concept("Standard connector", "Interfaz de ingesta disponible desde código o SQL que concede mayor control sobre opciones y comportamiento del pipeline.", "Permite cubrir fuentes o requisitos especiales, pero hace responsable al equipo del estado, pruebas y recuperación."),
        concept("Connection", "Securable de Unity Catalog que representa conectividad y autenticación administrada hacia un sistema de datos externo.", "Evita repartir credenciales entre notebooks y permite conceder uso del acceso externo mediante gobierno centralizado."),
      ],
      "La empresa necesita replicar Salesforce, fuente soportada, con selección estándar de objetos y sin transformaciones previas complejas; solo tres personas operan la plataforma.",
      [
        "Verificar disponibilidad regional, objetos soportados, frecuencia, autenticación y tratamiento incremental del managed connector de Salesforce vigente.",
        "Elegir la opción gestionada y una Connection gobernada porque ninguna necesidad declarada justifica implementar un lector personalizado.",
        "Probar snapshot inicial, cambio, borrado y recuperación; reconciliar tablas destino antes de transferir la operación al equipo reducido.",
      ],
      "La ingesta reduce superficie de código y credenciales manteniendo pruebas explícitas de completitud, evolución y semántica de los cambios publicados.",
    ),
    dive(
      `Una matriz de ingesta obliga a comparar soluciones sobre el mismo conjunto de requisitos en vez de elegir por familiaridad. Las filas representan fuentes o casos; las columnas capturan volumen, frecuencia, latencia, mutabilidad, deletes, esquema, autenticación, replay, backfill, disponibilidad regional, coste y operación. Cada opción se puntúa con evidencia y se documenta una condición que invalidaría la decisión. COPY INTO puede ganar para batch SQL simple; Auto Loader para archivos crecientes; un managed connector para una aplicación soportada; CDC para cambios de base; REST personalizado para una API sin integración. La matriz no sustituye una prueba: identifica qué hipótesis debe validar el laboratorio.`,
      [
        `El volumen incluye tanto bytes como número de objetos, porque millones de archivos pequeños se comportan distinto a pocos grandes. La frecuencia distingue una obligación temporal de una señal de datos. La mutabilidad pregunta si los registros se actualizan o borran. Gobierno cubre dónde viven credenciales, cómo se limita la ruta y quién ejecuta. Recuperación exige definir unidad incremental, checkpoint, backfill y reconciliación. Una opción incapaz de representar deletes queda descartada aunque su throughput sea excelente.`,
        `Después de filtrar incompatibilidades, se realiza un benchmark con datos y fallos representativos. Se mide latencia end-to-end, carga sobre la fuente, coste de compute, intervención operativa y exactitud. La matriz registra fecha y enlaces oficiales porque las capacidades cambian. Elegir la capa más gestionada reduce trabajo solo si cumple el contrato; una personalización innecesaria crea deuda, mientras una abstracción insuficiente puede ocultar una limitación crítica.`,
      ],
      [
        concept("Criterio eliminatorio", "Requisito obligatorio cuya ausencia descarta una alternativa antes de comparar ventajas secundarias como comodidad o precio.", "Evita seleccionar una herramienta popular que no puede representar la semántica indispensable de la fuente."),
        concept("Benchmark representativo", "Prueba con distribución, escala, concurrencia y fallos semejantes a la operación esperada, acompañada de métricas reproducibles.", "Convierte la decisión arquitectónica en evidencia y revela límites que una tabla teórica no muestra."),
        concept("Carga operacional", "Tiempo, conocimiento y acciones humanas necesarios para configurar, vigilar, reparar y evolucionar una solución de ingesta.", "Forma parte del coste total y favorece servicios gestionados cuando satisfacen el contrato técnico."),
      ],
      "Un comité compara COPY INTO, Auto Loader y un conector propio para 500 archivos diarios, pero no ha documentado si existen correcciones, deletes o backfills.",
      [
        "Detener la puntuación y completar primero mutabilidad, identidad de archivo, SLA, esquema, reextracción y restricciones de autenticación.",
        "Descartar opciones incompatibles y construir una prueba con segundo run, archivo corregido, fallo intermedio y backfill controlado.",
        "Comparar exactitud, latencia y operación, registrando por qué la alternativa elegida sigue siendo válida para el volumen esperado.",
      ],
      "La decisión queda vinculada a requisitos comprobables y puede revisarse cuando cambie la fuente, en lugar de convertirse en preferencia irreversible.",
    ),
    dive(
      `El checkpoint y el schema location son parte de la identidad de un pipeline, igual que su código y destino. Dev, test, prod, backfill y una nueva lógica no deben compartirlos accidentalmente. El checkpoint afirma qué unidades se confirmaron y puede contener estado de operadores; reutilizarlo con otra consulta puede omitir datos, rechazar cambios incompatibles o mezclar semánticas. El schema location conserva evolución inferida y también debe corresponder a una fuente y contrato. Para reprocesar, se crea una identidad nueva y un destino o estrategia idempotente; borrar un checkpoint productivo no es un botón de retry. Las rutas se nombran, gobiernan y retienen con la misma disciplina que una tabla.`,
      [
        `Structured Streaming asocia el checkpoint a la topología de fuentes, operadores con estado y sink. Algunos cambios de consulta son compatibles y otros no; la documentación del motor debe consultarse antes de desplegarlos sobre estado existente. Auto Loader registra archivos descubiertos y procesados, mientras las transacciones del sink evitan publicar lotes parciales. Copiar el checkpoint de prod a dev puede exponer metadatos y hacer que dev salte todo el histórico, aunque apunte a otra tabla.`,
        `Un backfill se ejecuta con checkpoint exclusivo y rango o ruta acotados. Sus resultados se escriben en staging o se integran mediante MERGE determinista para no competir con el flujo continuo. La evolución de esquema se prueba con una copia controlada del contrato y luego se promociona. El runbook conserva ubicación, owner, fuente, destino y procedimiento de recuperación; la limpieza requiere verificar que ningún run activo o auditoría depende del estado.`,
      ],
      [
        concept("Identidad de pipeline", "Conjunto estable de fuente, transformación, destino y estado durable que define una carga incremental concreta.", "Impide tratar checkpoints como archivos intercambiables entre ambientes o lógicas con significados diferentes."),
        concept("Estado de operador", "Datos intermedios persistidos para ventanas, agregaciones, deduplicación u otras operaciones que dependen de eventos anteriores.", "Hace que ciertos cambios de código sean incompatibles con un checkpoint existente y requieran migración planificada."),
        concept("Backfill aislado", "Reprocesamiento histórico con estado y ámbito propios que integra resultados mediante una escritura controlada e idempotente.", "Evita alterar progreso productivo o duplicar datos mientras continúa la ingesta ordinaria."),
      ],
      "Un ingeniero copia el checkpoint productivo a test para ahorrar tiempo; la prueba termina sin leer ningún archivo y se considera erróneamente exitosa.",
      [
        "Reconocer que el estado heredado marca archivos como procesados y que una ejecución vacía no valida la nueva lógica.",
        "Crear checkpoint, schema location y destino exclusivos de test, cargando un conjunto conocido con cambios de esquema representativos.",
        "Verificar archivos esperados, filas, estado y segundo run antes de autorizar promoción sobre el checkpoint productivo compatible.",
      ],
      "La prueba ejerce realmente la ingesta y conserva aislamiento, mientras producción mantiene su progreso durable y una ruta de migración explícita.",
    ),
  ],
  m10: [
    dive(
      `Lakeflow Jobs modela un workflow como un grafo dirigido acíclico de tareas. Cada nodo tiene tipo, compute, parámetros, identidad, timeout y política de retry; cada arista expresa una dependencia y condición de ejecución. El DAG no transporta automáticamente DataFrames ni garantiza idempotencia: coordina unidades que deben publicar resultados durables o valores pequeños. Las dependencias permiten paralelismo cuando no existe relación causal y bloquean downstream cuando una precondición falla. Un buen grafo refleja fronteras operativas: una tarea debe poder reintentarse, observarse y repararse sin repetir todo. El nombre Lakeflow Jobs es la superficie de orquestación; no debe confundirse con Spark Declarative Pipelines, framework para declarar datasets.`,
      [
        `Al iniciar un run, Jobs resuelve parámetros y planifica tareas cuyas dependencias se satisfacen. Cada tarea ejecuta un notebook, wheel, pipeline, SQL u otro tipo soportado en compute compatible. Los estados upstream determinan si downstream corre, se omite o evalúa una condición. Tareas independientes pueden usar recursos separados y ejecutarse en paralelo. Compartir classic jobs compute puede reducir arranque, pero acopla entorno y ciclo de las tareas; serverless selecciona capacidad gestionada para tipos admitidos.`,
        `El grafo debe conservar datos intermedios en tablas o Volumes gobernados con claves del run o partición cuando proceda. La observabilidad registra job_id, run_id, task_key, intento, entrada y métricas. Si una tarea combina ingestión, calidad y publicación en un bloque indivisible, un fallo final obliga a repetir trabajo y dificulta ownership. Si se fragmenta excesivamente, crecen overhead y dependencias. La frontera correcta coincide con un resultado verificable y una estrategia de recuperación.`,
      ],
      [
        concept("DAG", "Grafo dirigido sin ciclos que representa tareas y dependencias causales dentro de un workflow ejecutable.", "Permite planificar paralelismo, propagación de fallos y recuperación selectiva de manera explícita."),
        concept("Task", "Unidad observable de trabajo con entrada, compute, parámetros, resultado y política operacional propios dentro de un Job.", "Define el nivel al que se reintenta, alerta, mide y repara una parte del proceso."),
        concept("Dependencia", "Relación que condiciona la elegibilidad de una tarea al estado o salida de otra tarea anterior.", "Evita ejecutar consumidores antes de que sus precondiciones durables y verificadas estén disponibles."),
      ],
      "Un pipeline diario ingiere pedidos, valida calidad, actualiza dos productos Gold independientes y notifica al terminar; hoy todo vive en un único notebook de noventa minutos.",
      [
        "Separar ingestión y validación porque publican estados verificables y la calidad decide si los productos pueden continuar.",
        "Modelar las dos publicaciones Gold como tareas paralelas dependientes de validación y la notificación como dependencia final de ambas.",
        "Persistir salidas intermedias gobernadas y probar un fallo de una rama para demostrar repair sin repetir la otra.",
      ],
      "El DAG reduce el camino crítico, localiza fallos y permite recuperar únicamente la rama afectada sin perder trazabilidad ni duplicar ingestión.",
    ),
    dive(
      `Los parámetros configuran una ejecución antes o al iniciar tareas; los task values comunican pequeños valores calculados durante el run. Ninguno debe transportar datasets. Una fecha, ruta lógica, umbral o identificador de versión cabe en el contrato; millones de filas pertenecen a una tabla gobernada o un Volume. Los parámetros de Job centralizan valores compartidos y las referencias dinámicas aportan contexto como start time o salidas upstream. Un task value tiene clave, productor y consumidor explícitos y está sujeto a límites de tamaño. Convertir todos los valores a tipos de dominio y validar rangos evita que una cadena vacía cambie silenciosamente la partición procesada.`,
      [
        `Jobs resuelve parámetros definidos y los pasa a tareas de acuerdo con cada tipo. En notebooks suelen recibirse como strings y deben analizarse. Las dynamic value references se evalúan en runtime con sintaxis administrada y permiten referenciar metadatos del job, run o task. No son plantillas arbitrarias ni un lugar para secretos. Los valores efectivos aparecen en la ejecución, facilitando reproducción y auditoría si el código usa la misma semántica.`,
        `Una tarea puede establecer un task value pequeño, por ejemplo valid_ratio o snapshot_version, y una condición downstream puede consumirlo. El dataset que produjo esa métrica se escribe durably con identidad del run. Si se intenta serializar una lista enorme, aumentan límites, fragilidad y falta de gobierno. El contrato define qué ocurre si el valor no existe, es nulo o procede de un retry. La prueba cubre default, override y referencia inválida.`,
      ],
      [
        concept("Job parameter", "Valor declarado a nivel de workflow que configura un run y puede propagarse de manera consistente a varias tareas.", "Evita editar código por fecha o ambiente y deja la configuración efectiva registrada junto con la ejecución."),
        concept("Task value", "Par clave-valor pequeño publicado por una tarea para control o parametrización de otras tareas del mismo run.", "Permite comunicar métricas y decisiones sin usar la orquestación como transporte de datasets completos."),
        concept("Dynamic value reference", "Referencia resuelta por Jobs a metadatos de ejecución o salidas disponibles cuando una tarea se prepara.", "Conecta contexto y control flow de forma auditable sin valores copiados manualmente entre notebooks."),
      ],
      "La tarea validate calcula 98,7% de filas válidas y publish debe ejecutarse solo a partir de 99%; el equipo quiere pasar las filas válidas como JSON.",
      [
        "Persistir las filas válidas en una tabla staging identificada por fecha o run, porque constituyen un dataset gobernado.",
        "Publicar únicamente valid_ratio como task value pequeño y comparar ese valor en una condition task con el umbral parametrizado.",
        "Probar ratio ausente, valor inferior y retry de validate para asegurar que la decisión usa la salida del intento correcto.",
      ],
      "El workflow transporta control ligero mediante task values y mantiene los datos en una superficie durable, auditable y accesible por permisos.",
    ),
    dive(
      `Retries recuperan fallos transitorios; if/else elige una rama por una condición; for each repite una tarea parametrizada sobre una colección acotada. Son primitivas de control flow, no sustitutos de lógica de datos ni de un diseño idempotente. Un retry seguro presupone que volver a ejecutar la tarea no duplica efectos. La condición debe depender de un valor pequeño y estable, no del estado invisible de una sesión. Un loop necesita límite de concurrencia, identidad por elemento y estrategia para fallos parciales. Modelar estos caminos en Jobs hace visibles intentos y ramas; esconderlos en un gran notebook reduce observabilidad y obliga a repetir trabajo ya correcto.`,
      [
        `max_retries y min_retry_interval_millis controlan nuevos intentos ante estados fallidos; timeout limita tareas bloqueadas. Reintentar una escritura append no deduplicada puede convertir un fallo de red posterior al commit en duplicados, porque el orquestador no sabe si el efecto ocurrió. MERGE por clave, replaceWhere acotado o commit con batch_id hacen repetible la tarea. Errores de datos deterministas deben fallar hacia cuarentena o intervención, no consumir retries idénticos.`,
        `Una condition task evalúa operadores sobre strings o valores disponibles y activa outcomes diferenciados. For each itera entradas y puede ejecutar elementos en paralelo dentro de límites, útil para países o fechas de backfill. La colección debe ser razonable y no reemplaza una operación Spark distribuida sobre millones de claves. En repair, se eligen tareas e intentos afectados conservando resultados exitosos. Cada rama produce evidencia y converge solo cuando sus precondiciones son claras.`,
      ],
      [
        concept("Retry", "Nuevo intento automático de una tarea fallida bajo una política de número, intervalo y timeout determinada.", "Solo es seguro cuando los efectos de la tarea son idempotentes y el error puede ser transitorio."),
        concept("Condition task", "Nodo de control que evalúa dos operandos y determina qué dependencias de outcome quedan habilitadas.", "Hace visible una decisión operacional como publicar, cuarentenizar o detener según una métrica pequeña."),
        concept("For each task", "Control que ejecuta una tarea anidada por cada elemento de una colección parametrizada con concurrencia limitada.", "Simplifica backfills o fan-out acotados sin confundir orquestación con paralelismo de filas de Spark."),
      ],
      "Debe reprocesarse una lista de treinta fechas; cinco fallan por archivos ausentes y las otras veinticinco ya publicaron resultados correctamente.",
      [
        "Usar for each con una fecha por elemento y escritura idempotente por partición, limitando concurrencia para proteger fuentes.",
        "Clasificar archivo ausente como rama o fallo accionable, evitando retries repetidos si la entrada realmente no existe.",
        "Reparar únicamente los cinco elementos cuando lleguen archivos y reconciliar particiones sin repetir las veinticinco exitosas.",
      ],
      "El backfill conserva progreso por fecha, protege sistemas dependientes y recupera fallos parciales sin duplicar resultados ya confirmados.",
    ),
    dive(
      `Los triggers responden a dos clases de obligación: tiempo y disponibilidad de datos. Un schedule declara cuándo debe comenzar un run según cron y zona horaria. File arrival reacciona a nuevos archivos en una ubicación soportada y evita polling frecuente. Table update responde a actualizaciones de tablas compatibles y puede coordinar downstream a partir de cambios publicados. Elegir data-driven reduce ejecuciones vacías y latencia cuando la llegada es irregular; elegir calendario es correcto cuando el compromiso es un cierre temporal aunque no haya datos nuevos. Ningún trigger prueba que la entrada sea completa: el Job todavía necesita validación, idempotencia, concurrencia y política para múltiples eventos.`,
      [
        `Un schedule Quartz incluye segundos, expresión y timezone. El horario de verano puede producir intervalos distintos o ejecuciones ambiguas en zonas locales; usar UTC simplifica cuando el negocio no exige hora civil. La configuración de concurrencia decide qué ocurre si un run anterior sigue activo. Un cron cada minuto para buscar un archivo mensual crea miles de runs vacíos y ruido, aunque técnicamente cumpla la comprobación.`,
        `File arrival observa una ruta gobernada y aplica parámetros de espera o número mínimo de archivos según capacidades. Table update usa eventos de actualización de tablas para disparar consumidores. Los eventos pueden agruparse y no reemplazan la semántica incremental de la tarea. Un trigger debe documentar origen, latencia esperada, deduplicación de runs y backfill. Si el SLA exige las 06:00 incluso sin entrada, un schedule con validación y alerta es más honesto que esperar indefinidamente una señal.`,
      ],
      [
        concept("Schedule trigger", "Disparador temporal que crea runs mediante una expresión cron interpretada en una zona horaria declarada.", "Es apropiado cuando la obligación de proceso o cierre depende del reloj y no solo de datos nuevos."),
        concept("File arrival trigger", "Disparador dirigido por datos que inicia un Job al detectar archivos nuevos en una ubicación compatible.", "Reduce polling y runs vacíos para fuentes de archivos con llegadas irregulares o impredecibles."),
        concept("Table update trigger", "Disparador que responde a actualizaciones observadas en una o varias tablas soportadas por la plataforma.", "Permite desacoplar productor y consumidor usando una publicación gobernada como señal operacional."),
      ],
      "Un socio entrega archivos entre las 08:00 y las 14:00 sin patrón; el consumidor exige publicación veinte minutos después de cada llegada, no a una hora fija.",
      [
        "Elegir file arrival porque la señal real es disponibilidad del objeto y un cron frecuente generaría ejecuciones vacías.",
        "Configurar ruta gobernada, control de concurrencia e ingestión idempotente por archivo, midiendo latencia desde creación hasta commit.",
        "Añadir una alerta de ausencia máxima separada para detectar que el socio no entregó nada durante el día esperado.",
      ],
      "El Job responde con baja latencia a entregas reales y mantiene una vigilancia distinta para incumplimientos de la fuente.",
    ),
    dive(
      `Run history explica el estado del workflow; Spark UI explica la ejecución distribuida dentro de tareas Spark; alertas movilizan a un owner; repair run recupera un subconjunto conservando éxitos previos. Estas superficies responden preguntas diferentes y deben formar un runbook. Primero se identifica job, run, task e intento; después se clasifica si el fallo es de orquestación, dependencia, datos, compute o plan. Repair no corrige una causa y no debe pulsarse antes de verificar idempotencia. Las system tables de Lakeflow permiten analizar tendencias y SLA más allá de la retención visual disponible. Una alerta útil incluye impacto, enlace, owner y primera acción, no solo el texto FAILED.`,
      [
        `Jobs registra estados por run y tarea, tiempos, parámetros y mensajes. Un repair run crea intentos para tareas seleccionadas y dependientes según el grafo; puede admitir overrides para corregir una partición. Las salidas de tareas exitosas deben seguir disponibles y ser compatibles. Si se modifica código entre intento y repair, la ejecución ya no es una repetición idéntica y el cambio debe quedar registrado. Reejecutar todo puede duplicar ingestión y alargar recuperación innecesariamente.`,
        `Spark UI se abre cuando existe ejecución Spark y permite estudiar stages, tareas, shuffle y skew. Query Profile atiende SQL. system.lakeflow.job_run_timeline y tablas relacionadas permiten calcular tasa de éxito, duración y retrasos por periodo. Las alertas se deduplican para evitar fatiga y se escalonan por severidad. Tras el incidente, el runbook se actualiza con causa, evidencia y prevención; una reparación sin aprendizaje deja la misma fragilidad.`,
      ],
      [
        concept("Repair run", "Reejecución selectiva de tareas fallidas o elegidas y de sus dependientes dentro de un run existente.", "Reduce tiempo y riesgo al conservar trabajo exitoso, siempre que las fronteras de tareas sean idempotentes."),
        concept("Run history", "Registro de ejecuciones, estados, parámetros, intentos y tiempos de Jobs disponible para diagnóstico y auditoría.", "Localiza dónde falló el workflow antes de investigar detalles de compute o datos."),
        concept("Runbook", "Procedimiento operativo versionado que conecta síntomas, evidencia, owner, decisión de recuperación y criterios de cierre.", "Hace que una alerta se convierta en una respuesta consistente en lugar de improvisación personal."),
      ],
      "La tarea Silver terminó bien, Gold falló por un permiso retirado y el equipo propone relanzar todo el DAG desde ingestión.",
      [
        "Usar run history para confirmar la frontera exacta y comprobar que Silver publicó un resultado durable e idempotente.",
        "Restaurar el privilegio mínimo del principal productivo y verificarlo sin cambiar datos ni configuración no relacionada.",
        "Ejecutar repair desde Gold, validar consumidores y añadir detección de grants al despliegue o runbook preventivo.",
      ],
      "El servicio se recupera rápidamente sin repetir ingestión y el control preventivo reduce la probabilidad de que el permiso vuelva a romper producción.",
    ),
  ],
  m11: [
    dive(
      `Unity Catalog modela gobierno mediante una jerarquía de securables, ownership y privilegios heredables. El metastore contiene catálogos; los catálogos contienen esquemas; los esquemas agrupan tablas, vistas, volúmenes, funciones y modelos. Resolver catalog.schema.object identifica el recurso sin depender del contexto. El owner puede administrar el objeto y delegar, pero los usuarios ordinarios deben recibir capacidades concretas a través de grupos o service principals. Managed y external cambian el ciclo de vida del almacenamiento, no la existencia de gobierno. La jerarquía permite conceder a un nivel amplio cuando la política es realmente común o al objeto cuando se necesita aislamiento; facilidad no debe convertirse en ALL PRIVILEGES generalizado.`,
      [
        `Los principals existen a nivel de cuenta y reciben privilegios sobre securables. Para usar un objeto se evalúan permisos del objeto y sus ancestros, además de workspace bindings u otras restricciones aplicables. La herencia permite que un GRANT en catálogo o esquema afecte a objetos actuales y futuros según la semántica soportada. Ownership es potente y debe reservarse a roles administradores, no al usuario que casualmente ejecutó un notebook de creación.`,
        `Managed storage permite que Unity Catalog gestione ubicación y lifecycle de tablas. Para datos externos, una storage credential representa acceso cloud y una external location asocia credencial con ruta; los usuarios reciben privilegios sobre esos objetos en vez de secretos. Volumes gobiernan archivos no tabulares dentro del namespace. La selección de catálogo y esquema refleja dominio, ambiente y frontera de administración, evitando una jerarquía por persona que dificulta políticas compartidas.`,
      ],
      [
        concept("Securable", "Objeto de Unity Catalog sobre el que se pueden conceder privilegios, establecer ownership y aplicar determinadas restricciones.", "Proporciona la unidad concreta para diseñar y auditar mínimo privilegio dentro de la plataforma."),
        concept("Ownership", "Autoridad administrativa sobre un securable que permite modificarlo, conceder acceso y transferir su propiedad bajo reglas aplicables.", "Debe asignarse a roles estables porque supera la simple capacidad de leer o escribir datos."),
        concept("Privilege inheritance", "Propagación de privilegios concedidos en un contenedor hacia objetos descendientes según la jerarquía de Unity Catalog.", "Simplifica políticas por dominio, pero amplía alcance y exige revisar la concesión efectiva completa."),
      ],
      "Un usuario creó personalmente todas las tablas Gold y abandona la empresa; los Jobs de producción dependen de su ownership y credenciales externas.",
      [
        "Inventariar objetos, propietarios, grants y credenciales para separar autoridad de datos, identidad de ejecución y acceso cloud.",
        "Transferir ownership a un grupo administrador estable y configurar service principal productivo con privilegios mínimos heredados donde convenga.",
        "Sustituir credenciales personales por storage credentials y external locations administradas, verificando Jobs antes de revocar accesos antiguos.",
      ],
      "La plataforma deja de depender del ciclo laboral de una persona y conserva administración, ejecución y almacenamiento bajo identidades gobernadas.",
    ),
    dive(
      `GRANT añade una concesión; REVOKE retira una concesión concreta; DENY, donde esté soportado, establece una prohibición explícita que debe entenderse frente a herencia. Leer una tabla de tres niveles requiere poder recorrer catálogo y esquema mediante USE y disponer de SELECT efectivo sobre el objeto o un ancestro heredable. USE no permite leer filas y SELECT sin acceso a ancestros no basta para resolver el nombre. Las concesiones se asignan preferentemente a grupos y service principals, no individuo por individuo. El análisis de acceso calcula permisos efectivos desde todas las pertenencias y niveles: retirar un GRANT directo puede no cambiar nada si el mismo permiso llega heredado.`,
      [
        `GRANT USE CATALOG y USE SCHEMA habilitan resolución de namespace, mientras SELECT, MODIFY, CREATE TABLE u otros privilegios autorizan acciones específicas. Un principal puede pertenecer a varios grupos, y los grants se acumulan. SHOW GRANTS y las vistas de información disponibles ayudan a investigar, pero el contexto debe incluir ownership y herencia. ALL PRIVILEGES es dinámico según la semántica del producto y rara vez representa mínimo privilegio para consumidores.`,
        `REVOKE elimina la concesión en el nivel indicado, no niega automáticamente permisos recibidos por otro camino. DENY explícito puede prevalecer en ámbitos soportados, pero diseñar una maraña de excepciones negativas hace difícil razonar. La estrategia más mantenible crea grupos por responsabilidad, concede lectura en esquemas de producto y escritura solo a principals de publicación. Las pruebas impersonan o usan identidades de test equivalentes para demostrar allow y deny esperados.`,
      ],
      [
        concept("GRANT", "Operación que concede a un principal un privilegio específico sobre un securable determinado de Unity Catalog.", "Es la base positiva del modelo de autorización y debe limitarse a la capacidad realmente necesaria."),
        concept("REVOKE", "Operación que retira una concesión concreta sin eliminar otros caminos heredados o grupales que otorguen el mismo privilegio.", "Explica por qué un usuario puede conservar acceso después de retirar únicamente su grant directo."),
        concept("Permiso efectivo", "Resultado agregado de ownership, grants directos, pertenencia a grupos, herencia y prohibiciones aplicables para una identidad.", "Es el valor que debe comprobarse al diagnosticar acceso, no una sola sentencia aislada."),
      ],
      "Se revoca SELECT directo a una analista, pero continúa leyendo Gold porque pertenece a finance_all, que tiene SELECT en el catálogo completo.",
      [
        "Calcular el permiso efectivo y localizar la concesión heredada del grupo, en vez de asumir un fallo de caché o catálogo.",
        "Decidir si finance_all debe conservar alcance global o dividirse en grupos por producto con grants de esquema más precisos.",
        "Aplicar REVOKE o rediseño en el nivel correcto y probar USE y SELECT con la identidad afectada antes de cerrar.",
      ],
      "El acceso final coincide con la política de negocio y queda explicado por una jerarquía comprensible, sin denegaciones improvisadas que oculten grants excesivos.",
    ),
    dive(
      `Lineage responde de dónde proviene un objeto y qué consumidores dependen de él; audit logs responden quién realizó una acción, cuándo y desde qué contexto; ABAC aplica políticas mediante atributos y governed tags. Son controles relacionados pero no intercambiables. Lineage no demuestra que un usuario leyó una fila concreta, y audit no explica por sí solo la transformación semántica entre tablas. Una column mask o row filter directa sirve a un caso acotado; ABAC escala cuando la misma clasificación, como PII o región, debe gobernar muchos objetos. La política se diseña con tags controlados, funciones seguras y excepciones mínimas, y se prueba con identidades representativas.`,
      [
        `Unity Catalog captura lineage de operaciones soportadas a nivel de tabla y columna, permitiendo evaluar impacto antes de cambios. system.access.audit ofrece eventos de acciones según disponibilidad y esquema, útiles para investigación y cumplimiento. La correlación usa tiempo, workspace, principal, request y objeto, respetando retención. Ni una gráfica de lineage ni un evento auditado sustituye comentarios, owner y contrato; aportan evidencia operacional complementaria.`,
        `ABAC asocia policies a catálogos o esquemas y usa governed tags para seleccionar objetos o columnas, aplicando filtros y máscaras de forma centralizada. Las funciones de política deben evitar dependencias excesivas y mantener rendimiento. Una máscara directa se configura sobre una columna concreta; escalar cientos de sentencias manuales genera deriva. Antes de desplegar, se comprueban administradores, service principals, grupos permitidos, usuarios restringidos y comportamiento de joins o agregaciones sobre valores enmascarados.`,
      ],
      [
        concept("Lineage", "Metadatos que relacionan objetos y columnas de entrada con resultados producidos por operaciones capturadas por la plataforma.", "Permite análisis de impacto, descubrimiento de dependencias y explicación técnica del origen de una métrica."),
        concept("Audit log", "Registro temporal de acciones realizadas por principals sobre servicios y objetos, con contexto disponible de la solicitud.", "Sustenta investigación de quién hizo qué, pero no reemplaza la semántica de transformación del lineage."),
        concept("ABAC", "Control de acceso basado en atributos que aplica políticas centralizadas usando governed tags y funciones de filtrado o máscara.", "Escala protección coherente por clasificación sin configurar manualmente cada columna sensible de cada tabla."),
      ],
      "Cientos de tablas contienen columnas etiquetadas como PII; soporte debe ver dominios pero no valores, mientras compliance necesita acceso íntegro y auditable.",
      [
        "Crear governed tags con ownership restringido y clasificar columnas mediante un proceso revisado, evitando etiquetas libres manipulables.",
        "Definir una política ABAC de máscara que preserve compliance y proteja soporte, probando funciones con ambos grupos y service principals.",
        "Usar audit para vigilar accesos y lineage para evaluar consumidores afectados, midiendo también impacto de rendimiento de la política.",
      ],
      "La protección sigue la clasificación de forma centralizada y verificable, mientras acceso privilegiado y dependencias permanecen visibles para cumplimiento y operación.",
    ),
    dive(
      `Git folders ofrece una copia de trabajo del repositorio dentro del workspace para ramas, commits, pulls y pushes. Git sigue siendo la fuente de verdad del código; el proveedor aloja pull requests, reglas de revisión y protección de ramas. Una rama representa una línea de cambios, no un ambiente de datos. Los notebooks y archivos se versionan, pero tablas, checkpoints, secretos y resultados de ejecución pertenecen a otras superficies. El flujo profesional crea una rama corta, modifica código y tests, sincroniza, abre pull request y deja que CI valide. Copiar carpetas como final_v2 evita conflictos momentáneamente, pero destruye historial común y hace imposible saber qué versión llegó a producción.`,
      [
        `Git registra snapshots de archivos mediante commits enlazados y detecta divergencias por líneas o celdas serializadas. Pull incorpora cambios remotos; merge o rebase integra historiales según política; los conflictos requieren una decisión humana sobre intención. Git folders autentica contra el proveedor mediante credenciales configuradas, que no deben aparecer en el repositorio. Los cambios sin commit pueden perderse o bloquear actualizaciones y deben revisarse antes de cambiar de rama.`,
        `El pull request combina diff, conversación, checks y aprobación. CI instala dependencias fijadas, ejecuta tests y construye un artefacto; CD despliega después mediante una identidad controlada. Las migraciones de tablas se revisan como código o recursos, pero los datos no viajan en Git. Un hotfix sigue el mismo camino con alcance reducido y evidencia, porque editar directamente la rama principal del workspace crea un estado productivo no reproducible.`,
      ],
      [
        concept("Git folder", "Directorio del workspace conectado a un repositorio remoto que permite trabajar con ramas y sincronizar archivos versionados.", "Acerca desarrollo al compute sin convertir el workspace en sustituto del historial y gobierno del proveedor Git."),
        concept("Pull request", "Propuesta revisable para integrar commits de una rama, acompañada de diff, checks automáticos y decisiones humanas.", "Introduce una frontera de calidad y seguridad antes de que el cambio alcance la rama protegida."),
        concept("Conflicto de merge", "Situación en la que Git no puede decidir automáticamente cómo combinar cambios concurrentes sobre contenido relacionado.", "Debe resolverse entendiendo la intención; elegir siempre una versión puede borrar lógica o pruebas válidas."),
      ],
      "Dos ingenieras editan el mismo notebook de producción; una copia el archivo como orders_final y la otra hace cambios directos en main.",
      [
        "Detener la proliferación de copias y representar cada cambio en una rama con commits pequeños sobre el mismo archivo fuente.",
        "Resolver el conflicto comparando intención y tests, abrir pull request y exigir checks antes de integrar en main protegida.",
        "Desplegar el commit aprobado mediante automatización y retirar copias que no correspondan a una versión soportada.",
      ],
      "La versión productiva queda asociada a un commit revisado y el historial conserva ambas contribuciones sin depender de nombres manuales de archivo.",
    ),
    dive(
      `Declarative Automation Bundles, nombre actual de la capacidad antes conocida como Databricks Asset Bundles, describe recursos, artefactos, variables y targets como código. databricks.yml es la raíz; include separa definiciones; targets aplican overrides de ambiente; artifacts construye unidades como wheels; resources declara Jobs y pipelines. validate comprueba configuración, deploy crea o actualiza recursos y run ejecuta un recurso desplegado. El principio esencial es construir y probar una vez, luego promocionar el mismo commit o artefacto cambiando catálogo, identidad y parámetros por target. Duplicar código para dev y prod impide demostrar equivalencia. La identidad run_as productiva debe ser estable y mínima, nunca el usuario que lanzó el despliegue por casualidad.`,
      [
        `La CLI carga la configuración, resuelve variables y target, valida referencias y genera un plan de recursos con nombres y estado asociados al bundle. En modo development puede aplicar prefijos o comportamientos convenientes; production exige configuración deliberada. deploy sincroniza artefactos y usa APIs para reconciliar recursos administrados, pero no prueba la lógica de datos por sí mismo. Los permisos del deployer y run_as son responsabilidades distintas y deben limitarse.`,
        `CI ejecuta format, unit tests, validate y construcción del artefacto en un commit. Un ambiente test recibe ese mismo artefacto con variables propias y pruebas de integración. La promoción a prod referencia la versión aprobada y requiere controles. Los secretos se obtienen mediante mecanismos gobernados, no variables en texto. Rollback significa desplegar una versión previa compatible y considerar estado o migraciones de datos; no siempre basta con revertir YAML si el esquema ya cambió.`,
      ],
      [
        concept("Bundle target", "Configuración nombrada que aplica valores y overrides específicos de un ambiente sobre una definición común de recursos.", "Permite separar catálogo, workspace e identidad sin mantener copias divergentes del código productivo."),
        concept("run_as", "Identidad estable bajo la que se ejecutan recursos desplegados, independiente de quien invoca el despliegue cuando se configura.", "Evita que producción dependa de permisos personales y facilita aplicar mínimo privilegio a cada workload."),
        concept("bundle validate", "Comando que resuelve y comprueba la configuración del bundle para un target antes de aplicar cambios remotos.", "Detecta referencias y estructura inválidas temprano, aunque debe complementarse con tests de lógica e integración."),
      ],
      "Dev funciona con catálogo personal, pero producción debe usar prod.sales, un service principal y una wheel exactamente igual a la probada en test.",
      [
        "Declarar código y Job una sola vez, construir la wheel versionada y parametrizar catálogo mediante variables por target.",
        "Configurar run_as productivo con service principal mínimo y ejecutar validate y pruebas de integración sobre el artefacto inmutable.",
        "Promover la misma versión a prod mediante aprobación, verificar recursos y registrar commit, target e identidad efectivos.",
      ],
      "La promoción conserva equivalencia del software y limita las diferencias a configuración revisada, con identidad productiva estable y trazabilidad completa.",
    ),
  ],
  m12: [
    dive(
      `Un proyecto de certificación comienza traduciendo una historia ambigua en criterios observables. Fuente, volumen, frecuencia, mutabilidad, SLA, consumidores, seguridad, coste y recuperación definen el problema; una lista de servicios no. Cada requisito se convierte en métrica, umbral, prueba y evidencia con owner. Freshness de treinta minutos necesita un timestamp de inicio y fin; cero duplicados necesita grain y clave; acceso restringido necesita identities y prueba negativa. Los criterios también fijan alcance y alternativas descartadas. Esta disciplina prepara para el examen Associate porque las preguntas situacionales incluyen restricciones cuya combinación elimina opciones plausibles. Elegir antes de explicitar criterios favorece respuestas por palabra clave y arquitecturas imposibles de validar.`,
      [
        `La fase de descubrimiento inventaría fuentes y contratos, separa requisitos funcionales de cualidades operativas y pregunta qué ocurre durante fallos o backfills. Una matriz de trazabilidad relaciona cada requisito con componente, configuración, prueba y evidencia. Los supuestos se registran y validan; por ejemplo, append-only cambia por completo la idempotencia de archivos. Un objetivo como rápido se reemplaza por percentil, ventana y volumen representativo.`,
        `La aceptación incluye happy path y degradación: dato inválido, archivo repetido, permiso retirado, fuente tardía y retry. Cada umbral tiene una respuesta, como bloquear publicación, cuarentenizar o alertar. El proyecto no necesita demostrar toda Databricks, sino justificar la superficie mínima que cumple. Durante el examen, el mismo método identifica la opción que satisface simultáneamente gobierno, operación y rendimiento sin añadir control innecesario.`,
      ],
      [
        concept("Criterio de aceptación", "Condición medible con umbral y procedimiento de comprobación que determina si una entrega satisface un requisito concreto.", "Transforma objetivos vagos en evidencia reproducible y permite comparar decisiones arquitectónicas bajo las mismas obligaciones."),
        concept("Matriz de trazabilidad", "Relación explícita entre requisito, componente, configuración, prueba, resultado y owner responsable de aceptar la evidencia.", "Evita funciones sin propósito y revela requisitos importantes que todavía no tienen una comprobación implementada."),
        concept("Supuesto", "Afirmación no verificada que se utiliza temporalmente para diseñar y cuya falsedad cambiaría la decisión o su validez.", "Hacerlo visible permite validarlo antes de que se convierta en una dependencia oculta de producción."),
      ],
      "Negocio solicita un pipeline rápido y sin duplicados para pedidos, pero no define si una fila representa pedido o línea ni desde qué instante mide rapidez.",
      [
        "Acordar grain, clave y semántica de versiones para convertir sin duplicados en una consulta y una prueba reproducible.",
        "Definir freshness desde creación del archivo hasta commit Gold, con percentil y volumen esperado durante el periodo de mayor carga.",
        "Trazar ambas obligaciones a ingesta, deduplicación, métricas y owner, añadiendo pruebas de reintento y fuente tardía.",
      ],
      "El proyecto obtiene criterios que discriminan soluciones, permiten validar el SLA real y evitan declarar éxito sobre una definición ambigua de pedido.",
    ),
    dive(
      `La arquitectura Associate debe formar una cadena de garantías: una entrada durable y gobernada permite replay; Delta aporta commits de tabla; Silver añade contrato; Gold atiende consumidores; Unity Catalog aplica identidad y permisos; compute y Jobs ejecutan y observan cada frontera. Ningún componente resuelve todo. El diagrama debe mostrar datos, control, identidades y recuperación, no solo cajas. Dev y prod comparten código pero separan catálogos, estado y principals. La elección entre COPY INTO, Auto Loader o conector nace de la fuente; entre SQL warehouse y Jobs compute, del consumidor y workload. Una arquitectura defendible explica también dos alternativas descartadas y el cambio de requisito que las haría preferibles.`,
      [
        `La ruta de datos comienza en Volume o external location, se ingiere a Bronze con provenance y se conforma en Silver mediante claves y calidad. Gold se materializa según freshness y consulta. Unity Catalog resuelve cada nombre y concede al principal de ejecución escritura solo en sus destinos; analistas reciben uso de ancestros y SELECT en productos. Los checkpoints y schema locations permanecen por ambiente. El compute se crea o escala independientemente del almacenamiento.`,
        `La ruta de control usa Lakeflow Jobs para dependencias, parámetros, triggers, retries y repair. Spark Declarative Pipelines puede declarar datasets cuando sus capacidades gestionadas encajan; materiales anteriores pueden denominar a la oferta Lakeflow pipelines. Métricas y alertas prueban SLA, mientras run history y Spark UI separan fallo de workflow y rendimiento distribuido. El diseño de replay se realiza antes de automatizar: origen durable, escrituras idempotentes y procedimientos de backfill.`,
      ],
      [
        concept("Cadena de garantías", "Secuencia de fronteras donde cada capa añade una propiedad verificable sin asumir que otra herramienta la proporcionará implícitamente.", "Permite localizar fallos y demostrar que gobierno, calidad, recuperación y servicio están cubiertos de extremo a extremo."),
        concept("Frontera de identidad", "Punto en el que un principal concreto recibe únicamente los privilegios necesarios para leer o publicar un objeto gobernado.", "Evita credenciales compartidas y limita el impacto de un Job comprometido o configurado incorrectamente."),
        concept("Alternativa descartada", "Opción plausible no elegida acompañada de la restricción, coste o capacidad que justificó excluirla en ese contexto.", "Demuestra razonamiento comparativo y permite revisar la arquitectura si cambian requisitos o capacidades oficiales."),
      ],
      "Pedidos JSON horarios deben llegar a un dashboard en treinta minutos; analistas solo leen Gold y producción no puede depender de identidades personales.",
      [
        "Diseñar landing gobernada, Auto Loader o pipeline declarativo hacia Bronze, Silver contractual y Gold orientado al dashboard con estado separado por ambiente.",
        "Asignar service principal productivo a Jobs y grants mínimos, sirviendo BI mediante SQL warehouse sin copiar datos a otro sistema.",
        "Añadir trigger, checkpoint, escritura idempotente, métricas de freshness, alertas y repair; contrastar COPY INTO si volumen y SLA lo permitieran.",
      ],
      "La solución cumple latencia y gobierno con una única cadena de datos, puede reanudarse y explica por qué cada superficie responde a una restricción concreta.",
    ),
    dive(
      `Una implementación confiable es idempotente, parametrizada, observable y comprobable. Idempotente significa que la misma entrada repetida converge al mismo estado lógico; parametrizada significa que fecha, catálogo y modo se declaran sin editar código; observable significa que cada run publica métricas y contexto; comprobable significa que tests y reconciliaciones detectan desviaciones. COPY INTO o Auto Loader resuelven progreso de archivos, no duplicados de negocio. DataFrames expresan transformación; Delta MERGE o reemplazo acotado define escrituras; Jobs coordina. La prueba decisiva ejecuta dos veces, introduce un fallo después de un efecto parcial y demuestra que la recuperación no cambia conteos ni métricas correctas.`,
      [
        `La ingesta conserva batch_id, file_path y tiempos. Silver deduplica con clave y secuencia deterministas, convierte tipos y separa cuarentena. Una escritura MERGE utiliza fuente con una fila ganadora por clave; un agregado Gold reemplaza una partición o recalcula mediante una operación controlada. Los parámetros se validan al comienzo y la versión de código se registra. Cada etapa emite input, output, rejected y duración para reconciliar.`,
        `Las pruebas unitarias cubren funciones y reglas con datos pequeños; las integraciones ejercitan catálogo, Delta y permisos en un namespace aislado; una prueba end-to-end verifica SLA y recuperación. Un retry se simula alrededor del punto de commit para detectar append duplicable. La observabilidad no consiste en imprimir: métricas consultables, run_id, task_key y lineage conectan evidencia. La solución solo se acepta cuando un segundo run produce el mismo estado esperado.`,
      ],
      [
        concept("Idempotencia de negocio", "Propiedad por la que reejecutar una entrada identificable conserva una única representación correcta de cada entidad o evento.", "Completa las garantías técnicas de archivos y commits con la semántica necesaria para retries productivos seguros."),
        concept("Reconciliación end-to-end", "Comprobación que relaciona unidades de origen, filas válidas, rechazos, cambios aplicados y resultados publicados durante un run.", "Detecta pérdidas y multiplicaciones que podrían pasar inadvertidas aunque todas las tareas terminen con estado SUCCESS."),
        concept("Prueba de fallo", "Experimento controlado que interrumpe una ejecución en un punto relevante y verifica reanudación y estado final.", "Demuestra recuperación real en vez de asumirla a partir de una configuración de retries no ejercitada."),
      ],
      "Un Job hace append a Silver y pierde conexión antes de registrar su métrica final; Jobs reintenta y duplica todos los pedidos del lote.",
      [
        "Reconocer que el primer commit pudo completarse y que ausencia de métrica no demuestra ausencia del efecto durable.",
        "Reemplazar append por MERGE sobre clave y secuencia o reemplazo idempotente del batch, registrando batch_id en destino.",
        "Repetir el fallo controlado y reconciliar origen, cambios e inventario final para demostrar convergencia tras cualquier intento.",
      ],
      "La tarea puede reintentarse después de un resultado ambiguo y converge al estado correcto sin depender de saber si el primer intento confirmó.",
    ),
    dive(
      `Operar exige distinguir estado del workflow, ejecución del motor y salud del producto de datos. Run history muestra qué tarea, intento y parámetro falló; Spark UI y Query Profile explican planes, stages y recursos; métricas de calidad y freshness muestran si una ejecución técnicamente exitosa sirvió datos válidos. Las alertas dirigen a un owner con impacto y acción. El runbook decide pausar, reparar, hacer rollback o backfill según evidencia. Repair run evita repetir tareas correctas, pero solo cuando las salidas son durables y compatibles. Una operación madura define SLI, umbral y respuesta antes del incidente, y conserva postmortem para eliminar la causa, no solo restaurar el color verde.`,
      [
        `El triage comienza con hora, consumidor afectado, último estado bueno y cambio reciente. Se localiza run y tarea; si Spark empezó, se inspeccionan plan y distribución; si no, eventos de compute, permisos o dependencias. Las métricas de tabla comparan freshness, volumen y calidad con baseline. Un dashboard vacío puede proceder de una regla que filtró todo aunque el Job sea SUCCESS, por lo que estados técnicos y resultado de datos deben correlacionarse.`,
        `El runbook contiene owner, enlaces, consultas, decisiones y criterios de cierre. Un repair puede usar parámetros corregidos y conservar upstream; un RESTORE recupera una tabla Delta cuando el commit fue erróneo; un backfill reconstruye periodos con estado aislado. Alertas se agrupan para evitar tormentas y se prueban. El postmortem añade control preventivo, como validación de permisos, canary o umbral de volumen, y comprueba que realmente dispara.`,
      ],
      [
        concept("SLI", "Indicador cuantitativo del servicio, como freshness, tasa de éxito, duración o ratio de calidad observado en producción.", "Proporciona la señal objetiva que se compara con el objetivo y activa una respuesta operacional proporcional."),
        concept("Triage", "Proceso inicial de acotar impacto, fase, evidencia y urgencia antes de modificar sistemas o relanzar trabajos.", "Evita cambios simultáneos y dirige al equipo hacia la superficie de diagnóstico que contiene la causa probable."),
        concept("Criterio de cierre", "Conjunto verificable de condiciones de datos, servicio y prevención que permite declarar resuelto un incidente.", "Impide cerrar únicamente porque una tarea aparece verde mientras consumidores o controles siguen degradados."),
      ],
      "El Job aparece SUCCESS, pero Gold contiene cero filas porque una conversión nueva volvió null todas las fechas y un filtro las eliminó silenciosamente.",
      [
        "Tratarlo como incidente de producto, medir impacto y localizar la primera etapa donde el volumen se apartó de baseline.",
        "Pausar publicación, corregir conversión con prueba representativa y reparar desde Silver o restaurar Gold según el último estado válido.",
        "Validar filas, freshness y consumidores; añadir umbral de volumen y cuarentena que impidan otro SUCCESS vacío.",
      ],
      "El servicio recupera datos correctos y una señal preventiva vincula calidad con ejecución, evitando que el estado técnico oculte otra pérdida total.",
    ),
    dive(
      `Prepararse para Associate significa construir modelos mentales que permitan decidir en escenarios nuevos, no memorizar menús o dumps. El blueprint vigente para exámenes desde el 4 de mayo de 2026 organiza capacidades de plataforma, desarrollo, ingesta, transformación, Jobs, CI/CD, troubleshooting y gobierno. Cada error de simulacro se clasifica por dominio y por causa: desconocimiento, lectura apresurada, restricción ignorada o distractor absoluto. La revisión útil explica por qué la opción correcta satisface todas las condiciones y por qué cada alternativa falla al menos una. El 80% de esta academia es un indicador interno de preparación, no una nota oficial publicada. La práctica debe incluir código, operación y decisiones, no solo preguntas.`,
      [
        `El plan de estudio parte del exam guide vigente, fecha de examen y documentación oficial. Para cada objetivo se construye una explicación, un ejemplo y un contraejemplo. La recuperación espaciada revisa conceptos, mientras laboratorios aportan evidencia procedimental. Los simulacros se realizan con tiempo y sin documentación para medir decisión; después se revisan sin límite y se enlaza cada fallo a una fuente y ejercicio. Memorizar la letra de respuesta no crea transferencia.`,
        `Las preguntas situacionales suelen incluir pistas sobre escala, latencia, identidad, estado o operación. Primero se formula el requisito dominante, luego se descartan opciones incompatibles y finalmente se elige la solución más administrada o simple que cumple, salvo restricción explícita. Palabras como siempre o nunca son sospechosas cuando el producto tiene condiciones. La preparación termina cuando el rendimiento es estable por dominio y la persona puede defender decisiones en voz propia, no al alcanzar una única puntuación fortuita.`,
      ],
      [
        concept("Blueprint", "Guía oficial fechada que enumera dominios y objetivos evaluables para una versión concreta del examen de certificación.", "Define el alcance real de preparación y debe revisarse si la fecha del examen cruza una actualización publicada."),
        concept("Distractor", "Opción plausible que viola una restricción, confunde capas o aplica una función correcta al problema equivocado.", "Analizarlo desarrolla discriminación conceptual y evita depender de reconocer literalmente una respuesta vista anteriormente."),
        concept("Transferencia", "Capacidad de aplicar un principio comprendido a un escenario nuevo con detalles, nombres o restricciones diferentes.", "Es una señal más robusta de preparación que memorizar preguntas, letras o secuencias de interfaz."),
      ],
      "Una alumna obtiene 87% al repetir el mismo simulacro, pero falla laboratorios de permisos y no puede explicar por qué REVOKE no elimina un grant heredado.",
      [
        "Clasificar el resultado como memoria del banco y detectar una debilidad conceptual en Governance and Security, no como preparación completa.",
        "Reestudiar permisos efectivos con escenarios nuevos, ejecutar grants y revokes en laboratorio y verbalizar cada capa de herencia.",
        "Realizar otro simulacro con preguntas distintas y exigir estabilidad por dominio junto con evidencia práctica antes de cerrar el repaso.",
      ],
      "La puntuación posterior representa razonamiento transferible y práctica verificable, reduciendo la dependencia de exposición previa a un conjunto fijo de preguntas.",
    ),
  ],
};

const coreBase: Record<string, BaseModuleContentPack> = {
  m01: {
    lessons: [
      {
        summary: "Un lakehouse combina la flexibilidad de un data lake con controles y rendimiento propios de un warehouse, manteniendo los datos en formatos abiertos.",
        explanation: [
          "La separación entre almacenamiento y cómputo permite conservar una única copia gobernada de los datos y asignar motores distintos a ETL, BI o streaming. El object storage aporta durabilidad y elasticidad; el cómputo se crea, escala y termina según la carga.",
          "Delta Lake añade un registro transaccional sobre archivos Parquet. Así, una tabla puede ofrecer ACID, evolución controlada del esquema e historial sin abandonar un formato accesible por varios motores. El valor no está en juntar productos, sino en reducir copias y fronteras operativas.",
        ],
        keyPoints: ["Storage y compute tienen ciclos de vida independientes", "Delta conserva datos y transacciones en formatos abiertos", "Una única capa gobernada sirve a ETL, BI y streaming"],
        example: { language: "SQL", title: "Inspeccionar una tabla Delta", code: "DESCRIBE DETAIL main.learning.events;", note: "Comprueba format, location y propiedades antes de asumir cómo está almacenada una tabla." },
        pitfalls: ["Describir lakehouse como un simple data lake con SQL", "Duplicar datos por cada motor sin justificar latencia o aislamiento"],
        examDecision: "Si el requisito pide desacoplar capacidad de proceso y persistencia, identifica object storage como capa durable y compute como recurso elástico.",
        checkpoint: { question: "¿Qué componente conserva el historial ACID de una tabla Delta?", answer: "El transaction log de Delta, almacenado junto a los archivos de datos." },
      },
      {
        summary: "El plano de control administra configuración y metadatos; el plano de cómputo procesa los datos dentro del perímetro definido para la cuenta.",
        explanation: [
          "El plano de control contiene servicios de interfaz, APIs, configuración y orquestación. El plano de cómputo alberga los recursos que ejecutan Spark o SQL y acceden al almacenamiento mediante las identidades configuradas.",
          "En serverless, Databricks gestiona el plano de cómputo y su red; en compute clásico, la organización controla más elementos de la red y de las instancias. Esta diferencia afecta tiempo de arranque, responsabilidad operativa y controles de conectividad, no la ubicación lógica de las tablas en Unity Catalog.",
        ],
        keyPoints: ["El plano de control no es la ubicación de las tablas", "Serverless reduce la operación de infraestructura", "La conectividad debe diseñarse según el tipo de compute"],
        example: { language: "JSON", title: "Separar responsabilidades", code: "{\n  \"control_plane\": [\"workspace config\", \"jobs orchestration\"],\n  \"compute_plane\": [\"Spark execution\", \"data access\"]\n}", note: "Úsalo como lista de comprobación al revisar un diagrama de arquitectura." },
        pitfalls: ["Afirmar que el plano de control ejecuta las transformaciones Spark", "Suponer que classic y serverless comparten idénticas opciones de red"],
        examDecision: "Ante una pregunta de responsabilidad, asigna ejecución y acceso a datos al plano de cómputo; asigna configuración, UI y coordinación al plano de control.",
        checkpoint: { question: "¿Qué cambia principalmente al elegir serverless?", answer: "Databricks asume la provisión, escalado y mantenimiento del compute, con opciones de red y operación diferentes." },
      },
      {
        summary: "Delta Lake, Unity Catalog y los motores de ejecución resuelven problemas distintos y se complementan en una arquitectura gobernada.",
        explanation: [
          "Delta Lake define el formato de tabla y las garantías transaccionales. Unity Catalog registra objetos, privilegios, linaje y credenciales. Spark, Photon y los SQL warehouses ejecutan consultas y transformaciones sobre esos objetos.",
          "Una consulta se resuelve primero contra el namespace de Unity Catalog, después se autoriza con la identidad efectiva y finalmente se ejecuta en un recurso de cómputo. Confundir esas capas lleva a conceder permisos en el lugar equivocado o a intentar resolver un problema de layout añadiendo privilegios.",
        ],
        keyPoints: ["Delta es formato y protocolo de tabla", "Unity Catalog es gobierno y descubrimiento", "Spark, Photon y SQL warehouses son superficies de ejecución"],
        example: { language: "SQL", title: "Resolver un objeto gobernado", code: "USE CATALOG main;\nUSE SCHEMA learning;\nSELECT count(*) FROM events;", note: "El nombre se resuelve en Unity Catalog; la consulta se ejecuta en el compute asociado." },
        pitfalls: ["Tratar Unity Catalog como formato de almacenamiento", "Atribuir a Delta la gestión de usuarios y grupos"],
        examDecision: "Elige Delta para ACID y evolución de tablas; Unity Catalog para permisos y linaje; compute para ejecutar el workload.",
        checkpoint: { question: "¿Dónde se concede SELECT sobre una tabla?", answer: "En Unity Catalog, sobre el securable correspondiente y a un principal de cuenta." },
      },
      {
        summary: "Workspace, metastore, catálogo y esquema forman ámbitos distintos; entenderlos evita nombres ambiguos y permisos mal aplicados.",
        explanation: [
          "Un workspace es la superficie de colaboración y ejecución. Un metastore de Unity Catalog gobierna catálogos y se asigna a workspaces; el namespace de tres niveles catalog.schema.object identifica tablas, vistas, funciones y volúmenes.",
          "El workspace no es el propietario físico de una tabla de Unity Catalog. Varios workspaces asociados al mismo metastore pueden descubrir un objeto, aunque workspace bindings, privilegios y conectividad pueden limitar su uso.",
        ],
        keyPoints: ["El namespace recomendado tiene tres niveles", "El metastore se asigna a uno o varios workspaces", "Visibilidad y autorización no son equivalentes"],
        example: { language: "SQL", title: "Explorar el namespace", code: "SHOW CATALOGS;\nSHOW SCHEMAS IN main;\nSHOW TABLES IN main.learning;", note: "Ejecuta las tres sentencias para localizar en qué nivel falla el descubrimiento." },
        pitfalls: ["Usar nombres de una parte y depender del contexto de sesión", "Confundir ACL del workspace con privilegios sobre datos"],
        examDecision: "Cuando varias tablas tienen el mismo nombre, usa catalog.schema.table; cuando un usuario no accede, comprueba USE CATALOG, USE SCHEMA y el privilegio del objeto.",
        checkpoint: { question: "¿Cuál es el nombre completo de la tabla events?", answer: "main.learning.events: catálogo main, esquema learning y objeto events." },
      },
      {
        summary: "La superficie correcta depende de latencia, lenguaje, concurrencia y ciclo de vida, no de una preferencia universal.",
        explanation: [
          "Los notebooks favorecen exploración y desarrollo interactivo; Lakeflow Jobs ejecuta tareas productivas con dependencias; SQL warehouses atienden SQL y BI concurrente; Spark Declarative Pipelines en Lakeflow gestiona grafos incrementales declarativos.",
          "Antes de seleccionar una superficie, fija SLA, patrón de ejecución, identidad, necesidad de estado y consumidores. Una transformación PySpark exploratoria puede empezar en notebook y terminar empaquetada como tarea de Job sin cambiar la tabla gobernada que produce.",
        ],
        keyPoints: ["Notebook no equivale a despliegue productivo", "SQL warehouse prioriza cargas SQL y concurrencia", "Jobs y pipelines automatizan ciclos de ejecución distintos"],
        example: { language: "Python", title: "Matriz mínima de decisión", code: "surface = {\n    \"interactive_pyspark\": \"notebook\",\n    \"scheduled_etl\": \"lakeflow_job\",\n    \"concurrent_bi\": \"sql_warehouse\",\n    \"declarative_incremental\": \"lakeflow_pipeline\",\n}", note: "Añade SLA y restricciones de red antes de convertir la matriz en una decisión de arquitectura." },
        pitfalls: ["Ejecutar producción manualmente desde un notebook", "Usar un cluster interactivo permanente para consultas BI esporádicas"],
        examDecision: "Asocia BI SQL concurrente con SQL warehouse, tareas programadas con Jobs y datasets declarativos incrementales con Lakeflow pipelines.",
        checkpoint: { question: "¿Qué superficie escogerías para un dashboard SQL con muchos usuarios?", answer: "Un SQL warehouse, dimensionado y configurado para la concurrencia requerida." },
      },
    ],
    lab: {
      title: "Diseño de una arquitectura lakehouse justificable",
      goal: "Separar almacenamiento, gobierno, ejecución y consumo para una plataforma de pedidos.",
      scenario: "Una tienda recibe archivos de pedidos cada hora, necesita un dashboard en menos de 20 minutos y exige acceso limitado por equipo. Debes proponer componentes Databricks sin duplicar innecesariamente los datos.",
      steps: ["Clasifica requisitos funcionales, SLA y restricciones", "Asigna cada responsabilidad a storage, Delta, Unity Catalog y compute", "Elige superficie para ingestión, transformación y BI", "Añade identidades, observabilidad y recuperación", "Registra dos alternativas descartadas y su coste"],
      starterCode: "architecture:\n  storage: TODO\n  governance: TODO\n  ingestion: TODO\n  transformation: TODO\n  serving: TODO\n  sla_minutes: 20\n",
      solution: "architecture:\n  storage: cloud_object_storage\n  table_format: delta\n  governance: unity_catalog\n  ingestion: autoloader_job\n  transformation: lakeflow_pipeline\n  serving: serverless_sql_warehouse\n  namespace: main.sales.orders\n  identity: service_principal_per_workload\n  recovery: checkpoint_and_delta_history\n  observability: job_run_history_and_system_tables\n  sla_minutes: 20\ntradeoffs:\n  rejected_all_purpose_for_bi: lower_isolation_and_manual_operations\n  rejected_data_copy_per_team: governance_and_freshness_cost\n",
      checks: [{ label: "Separa formato y gobierno", pattern: "table_format:\\s*delta[\\s\\S]+governance:\\s*unity_catalog" }, { label: "Define serving SQL", pattern: "serving:\\s*(serverless_)?sql_warehouse" }, { label: "Incluye recuperación", pattern: "recovery:[^\\n]+" }],
      expectedEvidence: ["Diagrama o YAML con límites claros", "Justificación de cada superficie frente al SLA", "Dos alternativas descartadas con sus trade-offs"],
      cloudNotes: { AWS: "Usa S3 mediante una external location e IAM role; no incrustes claves en notebooks.", Azure: "Usa ADLS Gen2 mediante Access Connector y managed identity cuando el almacenamiento sea externo.", GCP: "Usa GCS mediante una storage credential respaldada por la service account generada por Databricks." },
    },
    quiz: [
      { question: "¿Qué componente aporta transacciones ACID sobre archivos de una tabla lakehouse?", options: ["Unity Catalog", "Delta Lake", "SQL warehouse", "Git folder"], answer: 1, explanation: "Delta Lake mantiene el transaction log y define las garantías de tabla; Unity Catalog gobierna el objeto.", domain: "Databricks Intelligence Platform" },
      { question: "Un equipo necesita ejecutar el mismo dataset desde BI y PySpark sin crear dos copias. ¿Qué diseño encaja mejor?", options: ["Dos exportaciones CSV", "Un notebook compartido", "Una tabla Delta gobernada y distintos recursos de compute", "Un cluster permanente por usuario"], answer: 2, explanation: "La separación storage-compute permite que varios motores accedan al mismo objeto gobernado.", domain: "Databricks Intelligence Platform" },
      { question: "¿Qué objeto organiza catálogos y se asigna a workspaces?", options: ["Metastore de Unity Catalog", "SQL warehouse", "Checkpoint", "Task value"], answer: 0, explanation: "El metastore es el ámbito superior de Unity Catalog y contiene los catálogos gobernados.", domain: "Governance and Security" },
      { question: "¿Cuál es la superficie más adecuada para BI SQL concurrente?", options: ["Driver de un cluster personal", "Auto Loader", "Storage credential", "SQL warehouse"], answer: 3, explanation: "Los SQL warehouses están diseñados para ejecutar cargas SQL con aislamiento y concurrencia.", domain: "Databricks Intelligence Platform" },
    ],
    sources: [source("Data engineering with Databricks", "https://docs.databricks.com/aws/en/data-engineering"), source("Arquitectura lakehouse", "https://docs.databricks.com/aws/en/lakehouse-architecture/")],
  },

  m02: {
    lessons: [
      {
        summary: "Serverless prioriza operación gestionada y arranque rápido; classic compute ofrece mayor control de configuración y red.",
        explanation: [
          "En serverless, Databricks aprovisiona y optimiza el recurso, aplica versiones compatibles y cobra según uso. Es una opción natural cuando se busca reducir administración y el workload admite sus límites regionales, de red y de funcionalidad.",
          "Classic compute se ejecuta con recursos configurables de la cuenta cloud y permite más control sobre runtime, tipos de nodo, políticas e inicialización. Ese control aumenta las decisiones operativas; no implica automáticamente mejor rendimiento o menor coste.",
        ],
        keyPoints: ["Serverless elimina gran parte de la gestión de infraestructura", "Classic conserva opciones avanzadas de configuración", "La disponibilidad y conectividad varían por nube y región"],
        example: { language: "YAML", title: "Criterios antes de elegir", code: "workload:\n  latency_sensitive: true\n  custom_runtime_required: false\n  private_dependency: false\n  operations_capacity: low\nchoice: serverless\n", note: "La elección es válida solo si la región y las dependencias están soportadas." },
        pitfalls: ["Elegir classic solo porque permite más parámetros", "Suponer que serverless permite cualquier init script o ruta de red"],
        examDecision: "Cuando el escenario pide compute administrado y auto-optimizado con mínima operación, prioriza serverless salvo una limitación explícita.",
        checkpoint: { question: "¿Qué requisito suele empujar hacia classic compute?", answer: "Una configuración de runtime, librería, red o infraestructura no admitida por serverless." },
      },
      {
        summary: "All-purpose, jobs compute y SQL warehouses responden a ciclos de trabajo y consumidores diferentes.",
        explanation: [
          "All-purpose compute favorece desarrollo interactivo compartido. Jobs compute se crea para ejecuciones automatizadas y puede aislar dependencias por tarea o job. Un SQL warehouse ofrece un endpoint SQL para consultas, dashboards y herramientas BI.",
          "Para producción repetible, jobs compute o serverless Jobs evita depender del estado de una sesión interactiva. Para BI, el SQL warehouse proporciona controles de escalado y concurrencia que no deben simularse con un notebook conectado permanentemente.",
        ],
        keyPoints: ["All-purpose es interactivo", "Jobs compute acompaña ejecuciones automatizadas", "SQL warehouse sirve SQL y BI"],
        example: { language: "Python", title: "Selección por carga", code: "def compute_for(kind: str) -> str:\n    return {\n        \"exploration\": \"all-purpose\",\n        \"scheduled_etl\": \"jobs compute\",\n        \"bi_sql\": \"sql warehouse\",\n    }[kind]\n", note: "Añade requisitos de serverless y aislamiento en una decisión real." },
        pitfalls: ["Programar un notebook de producción sobre un cluster personal", "Conectar una herramienta BI al compute de desarrollo"],
        examDecision: "Asocia el ciclo interactivo con all-purpose, la automatización con jobs compute y los consumidores SQL con warehouses.",
        checkpoint: { question: "¿Por qué preferir jobs compute para ETL programado?", answer: "Porque ofrece un entorno reproducible ligado a la ejecución y evita el estado residual de un cluster interactivo." },
      },
      {
        summary: "Autoscaling, auto-termination y pools resuelven problemas distintos: capacidad, inactividad y latencia de aprovisionamiento.",
        explanation: [
          "Autoscaling modifica el número de workers dentro de límites; no corrige un plan con skew ni garantiza que una tarea monohilo acelere. Auto-termination finaliza compute inactivo y reduce coste, pero debe equilibrarse con la experiencia interactiva.",
          "Los pools mantienen instancias preparadas para classic compute y reducen el tiempo de arranque sin mantener clusters completos. Serverless gestiona su propio aprovisionamiento, por lo que no se combina con pools creados por el usuario.",
        ],
        keyPoints: ["Autoscaling responde a demanda paralelizable", "Auto-termination controla inactividad", "Pools reducen el arranque de classic compute"],
        example: { language: "JSON", title: "Guardrails de un cluster interactivo", code: "{\n  \"autoscale\": {\"min_workers\": 2, \"max_workers\": 8},\n  \"autotermination_minutes\": 20,\n  \"instance_pool_id\": \"pool-data-eng\"\n}", note: "Una compute policy debe limitar los valores permitidos en producción." },
        pitfalls: ["Usar autoscaling como solución automática al skew", "Configurar auto-termination por encima de la jornada laboral"],
        examDecision: "Si el problema es arranque de clusters clásicos recurrentes, piensa en pools; si es inactividad, auto-termination; si es demanda variable, autoscaling.",
        checkpoint: { question: "¿Un pool mantiene un cluster ejecutándose?", answer: "No; mantiene instancias listas para reducir el aprovisionamiento de clusters clásicos." },
      },
      {
        summary: "El access mode determina aislamiento y compatibilidad con Unity Catalog; no debe elegirse por el nombre del equipo.",
        explanation: [
          "Standard access mode permite múltiples usuarios con aislamiento y es la opción recomendada para muchas cargas. Dedicated asigna el recurso a un usuario o grupo y cubre requisitos que necesitan acceso dedicado o funciones no soportadas en Standard.",
          "Las políticas de compute deben fijar versiones, tipos de nodo, tags y límites coherentes. El mínimo privilegio también incluye impedir que cada usuario cree recursos sin guardrails financieros o de seguridad.",
        ],
        keyPoints: ["Standard combina uso compartido y aislamiento", "Dedicated se reserva para requisitos explícitos", "Compute policies convierten decisiones en guardrails"],
        example: { language: "JSON", title: "Restricción con compute policy", code: "{\n  \"data_security_mode\": {\"type\": \"fixed\", \"value\": \"USER_ISOLATION\"},\n  \"autotermination_minutes\": {\"type\": \"range\", \"maxValue\": 30}\n}", note: "USER_ISOLATION corresponde al modo Standard en la API de compute clásico." },
        pitfalls: ["Usar Dedicated para todos sin revisar necesidad", "Confundir access mode con privilegios de tabla"],
        examDecision: "Elige Standard por defecto para workloads multiusuario gobernados; usa Dedicated si una limitación o requisito de aislamiento lo exige.",
        checkpoint: { question: "¿Quién concede acceso a una tabla: el access mode o Unity Catalog?", answer: "Unity Catalog; el access mode define cómo se aísla y ejecuta el compute." },
      },
      {
        summary: "El coste total combina DBUs, infraestructura cloud, tiempo de arranque, utilización y trabajo operativo.",
        explanation: [
          "Una comparación útil mide el consumo por unidad de resultado: coste por ejecución, por GB procesado o por consulta dentro del SLA. Reducir el precio horario puede aumentar el coste si alarga el runtime o produce fallos y reintentos.",
          "La tabla system.billing.usage registra consumo atribuible y etiquetas; para obtener coste monetario puede combinarse con system.billing.list_prices. Los tags y las serverless budget policies permiten asignación por equipo o producto.",
        ],
        keyPoints: ["DBU no es todo el coste cloud", "Optimiza coste por resultado, no tamaño aislado", "Tags y system tables permiten atribución"],
        example: { language: "SQL", title: "Consumo por equipo", code: "SELECT\n  custom_tags['team'] AS team,\n  sum(usage_quantity) AS dbus\nFROM system.billing.usage\nWHERE usage_date >= date_sub(current_date(), 30)\nGROUP BY custom_tags['team'];", note: "Filtra retractions y restatements mediante la suma; agrega precios si necesitas moneda." },
        pitfalls: ["Comparar solo DBUs sin coste de infraestructura", "Reducir workers sin volver a medir duración y SLA"],
        examDecision: "Si el enunciado pide atribución, usa tags y system.billing.usage; si pide optimización, compara coste y rendimiento antes y después.",
        checkpoint: { question: "¿Qué métrica permite comparar configuraciones de forma justa?", answer: "El coste por ejecución o unidad de trabajo cumpliendo el mismo SLA." },
      },
    ],
    lab: {
      title: "Selección y coste de compute para tres SLA",
      goal: "Justificar compute, escalado y guardrails para desarrollo, ETL y BI.",
      scenario: "Un equipo desarrolla PySpark durante el día, ejecuta un ETL nocturno de 40 minutos y sirve un dashboard con picos a las 9:00. Debes reducir operación sin perder aislamiento ni trazabilidad de coste.",
      steps: ["Caracteriza concurrencia, horario y SLA de cada carga", "Asigna una superficie y decide classic o serverless", "Define auto-stop, escalado y access mode", "Añade tags y límites de política", "Especifica cómo medirás coste por resultado"],
      starterCode: "workloads:\n  development:\n    compute: TODO\n  nightly_etl:\n    compute: TODO\n  dashboard:\n    compute: TODO\nguardrails:\n  tags: {}\n  cost_metric: TODO\n",
      solution: "workloads:\n  development:\n    compute: standard_all_purpose\n    autoscale: [2, 6]\n    auto_termination_minutes: 20\n  nightly_etl:\n    compute: serverless_jobs\n    max_runtime_minutes: 55\n    retries: 1\n  dashboard:\n    compute: serverless_sql_warehouse\n    auto_stop_minutes: 10\n    scaling: multi_cluster\nguardrails:\n  access_mode: standard\n  tags:\n    team: data_engineering\n    product: commerce\n  cost_metric: dbus_per_successful_run_within_sla\n  evidence_table: system.billing.usage\n",
      checks: [{ label: "Distingue los tres tipos de compute", pattern: "all_purpose[\\s\\S]+serverless_jobs[\\s\\S]+sql_warehouse" }, { label: "Incluye terminación o auto-stop", pattern: "auto_(termination|stop)_minutes" }, { label: "Define atribución", pattern: "(tags:|system\\.billing\\.usage)" }],
      expectedEvidence: ["Matriz de decisión por workload", "Guardrails de coste y seguridad", "Consulta o métrica para comparar consumo tras una semana"],
      cloudNotes: { AWS: "Incluye coste de EC2 en classic compute y verifica conectividad de serverless a dependencias privadas.", Azure: "Incluye coste de VM y considera private endpoints o reglas de acceso de serverless cuando proceda.", GCP: "Incluye coste de Compute Engine y valida disponibilidad regional de serverless y tipos de máquina." },
    },
    quiz: [
      { question: "¿Qué opción minimiza administración para un ETL compatible con las capacidades gestionadas?", options: ["Serverless Jobs", "Cluster personal sin auto-stop", "Pool con cluster permanente", "SQL warehouse Classic para PySpark"], answer: 0, explanation: "Serverless Jobs gestiona aprovisionamiento y optimización del compute para tareas compatibles.", domain: "Databricks Intelligence Platform" },
      { question: "¿Qué función reduce específicamente el tiempo de arranque de clusters clásicos?", options: ["Auto-termination", "Liquid clustering", "Pool de instancias", "Unity Catalog"], answer: 2, explanation: "Un pool conserva instancias listas; auto-termination atiende inactividad, no arranque.", domain: "Databricks Intelligence Platform" },
      { question: "Una consulta tiene una única partición lenta por skew. ¿Qué acción NO es suficiente por sí sola?", options: ["Revisar el plan físico", "Analizar claves sesgadas", "Cambiar la estrategia de join", "Activar autoscaling"], answer: 3, explanation: "Añadir workers no divide automáticamente una partición sesgada; primero hay que corregir el reparto o el plan.", domain: "Troubleshooting, Monitoring, and Optimization" },
      { question: "¿Dónde consultarías DBUs atribuidos mediante tags?", options: ["DESCRIBE HISTORY", "system.billing.usage", "Git folder", "Checkpoint de streaming"], answer: 1, explanation: "La tabla de sistema billing.usage registra uso y custom_tags para atribución.", domain: "Databricks Intelligence Platform" },
    ],
    sources: [source("Compute", "https://docs.databricks.com/aws/en/compute/"), source("Serverless compute", "https://docs.databricks.com/aws/en/compute/serverless/"), source("Billable usage system table", "https://docs.databricks.com/aws/en/admin/system-tables/billing")],
  },

  m03: {
    lessons: [
      {
        summary: "Un notebook es útil para desarrollo interactivo cuando sus dependencias, parámetros y orden de ejecución son explícitos.",
        explanation: [
          "Las celdas admiten SQL, Python y visualizaciones, pero el estado del proceso permite ejecutar fuera de orden. Para que otra persona reproduzca el resultado, la ejecución desde cero debe crear las mismas variables, tablas temporales y salidas.",
          "Los archivos de workspace y módulos Python facilitan separar lógica reutilizable del relato exploratorio. Un notebook de entrada debería coordinar funciones comprobables, no concentrar transformaciones y efectos secundarios en decenas de celdas.",
        ],
        keyPoints: ["Ejecutar desde cero revela estado oculto", "La lógica reusable pertenece a módulos", "La salida debe depender de parámetros explícitos"],
        example: { language: "Python", title: "Notebook como punto de entrada", code: "from commerce.transforms import clean_orders\n\nsource = spark.table(\"main.bronze.orders\")\nresult = clean_orders(source)\ndisplay(result.limit(20))", note: "clean_orders puede probarse fuera del notebook con DataFrames pequeños." },
        pitfalls: ["Depender de una celda ejecutada horas antes", "Instalar librerías manualmente sin fijar versión"],
        examDecision: "Si un notebook funciona solo tras ejecutar celdas en cierto orden, elimina estado oculto y extrae lógica antes de productivizar.",
        checkpoint: { question: "¿Qué prueba rápida detecta estado oculto?", answer: "Reiniciar el proceso y ejecutar todas las celdas en orden desde el principio." },
      },
      {
        summary: "SQL expresa transformaciones relacionales con claridad; PySpark facilita composición, control y pruebas en proyectos Python.",
        explanation: [
          "SQL resulta conciso para selección, agregación, joins y DDL/DML. PySpark usa el mismo optimizador para operaciones DataFrame y permite construir funciones, iterar sobre metadatos o integrar librerías Python.",
          "La elección no debe basarse en una supuesta diferencia universal de rendimiento: muchas expresiones convergen en planes equivalentes. Conviene priorizar mantenibilidad, conocimientos del equipo y necesidad de abstracción, usando funciones nativas antes que UDF Python.",
        ],
        keyPoints: ["SQL y DataFrame API comparten optimizador", "PySpark facilita modularidad Python", "Las funciones nativas suelen superar a UDF Python"],
        example: { language: "PySpark", title: "Transformación nativa equivalente a SQL", code: "from pyspark.sql import functions as F\n\ndaily = (orders\n    .filter(F.col(\"status\") == \"paid\")\n    .groupBy(\"order_date\")\n    .agg(F.sum(\"amount\").alias(\"revenue\")))", note: "Compara daily.explain('formatted') con la consulta SQL equivalente." },
        pitfalls: ["Convertir a pandas para una transformación distribuida", "Crear una UDF para una función ya disponible en Spark SQL"],
        examDecision: "Cuando exista una función nativa de SQL/PySpark, úsala antes que una UDF para conservar optimización y ejecución eficiente.",
        checkpoint: { question: "¿SQL es siempre más rápido que PySpark DataFrames?", answer: "No; expresiones equivalentes suelen generar el mismo plan optimizado." },
      },
      {
        summary: "Los parámetros de Job y widgets convierten una ejecución en un contrato reproducible, no en una colección de valores editados a mano.",
        explanation: [
          "Un widget recibe valores de texto en un notebook y puede ser alimentado por parámetros de tarea. Conviene validar formato, rango y valores permitidos al comienzo para fallar antes de modificar datos.",
          "Los parámetros deben representar variación de ejecución, como fecha o catálogo objetivo; secretos y credenciales no deben viajar como texto. Para compartir valores pequeños entre tareas se usan task values, mientras que datasets se publican en almacenamiento gobernado.",
        ],
        keyPoints: ["Los widgets reciben strings", "Valida parámetros antes de escribir", "No uses task values para transportar datasets"],
        example: { language: "Python", title: "Parámetro de fecha validado", code: "from datetime import date\n\ndbutils.widgets.text(\"process_date\", \"\")\nraw = dbutils.widgets.get(\"process_date\")\nprocess_date = date.fromisoformat(raw)\nif process_date > date.today():\n    raise ValueError(\"process_date no puede ser futura\")", note: "El Job puede pasar process_date sin editar el notebook." },
        pitfalls: ["Leer un widget sin validar su tipo", "Incluir contraseñas directamente en parámetros del Job"],
        examDecision: "Usa parámetros para variar ejecución y secret scopes o credenciales gobernadas para autenticación.",
        checkpoint: { question: "¿Qué tipo devuelve dbutils.widgets.get?", answer: "Una cadena; el código debe convertirla y validarla." },
      },
      {
        summary: "Databricks Connect permite ejecutar y depurar código Spark desde un IDE local contra compute de Databricks.",
        explanation: [
          "Databricks Connect implementa Spark Connect: el proceso local construye planes que se ejecutan remotamente. Esto permite usar depurador, tests e integración del IDE sin descargar el dataset completo al portátil.",
          "La versión del cliente debe ser compatible con el runtime o serverless seleccionado y la autenticación debe configurarse mediante un perfil, OAuth u otro mecanismo soportado. Código que depende de APIs exclusivas del driver o del filesystem local puede necesitar adaptación.",
        ],
        keyPoints: ["El procesamiento Spark ocurre en Databricks", "Cliente y runtime deben ser compatibles", "La autenticación no se incrusta en el código"],
        example: { language: "Python", title: "Sesión con Databricks Connect", code: "from databricks.connect import DatabricksSession\n\nspark = DatabricksSession.builder.profile(\"dev\").serverless().getOrCreate()\nprint(spark.range(10).count())", note: "El perfil dev se configura fuera del repositorio; serverless requiere soporte en el workspace." },
        pitfalls: ["Creer que Spark procesa los datos en el portátil", "Guardar un personal access token en el repositorio"],
        examDecision: "Si se pide desarrollo local con ejecución remota y depuración en IDE, Databricks Connect es la herramienta específica.",
        checkpoint: { question: "¿Dónde se ejecuta spark.range(10).count() con Connect?", answer: "En el compute remoto de Databricks; el cliente local envía el plan y recibe el resultado." },
      },
      {
        summary: "Git folders, dependencias fijadas y paquetes separan colaboración, entorno y lógica de negocio.",
        explanation: [
          "Un Git folder sincroniza archivos del workspace con un proveedor Git y permite ramas, commits y revisión. No sustituye un proceso de CI ni convierte automáticamente un notebook en artefacto desplegable.",
          "Un proyecto mantenible declara dependencias en pyproject.toml, limita rangos de versión y construye un wheel cuando corresponde. Dev, test y prod deben ejecutar el mismo artefacto, cambiando configuración mediante variables y no mediante copias del código.",
        ],
        keyPoints: ["Git registra código, no datos ni secretos", "pyproject.toml declara dependencias", "El mismo artefacto debe promocionarse entre entornos"],
        example: { language: "YAML", title: "Dependencias de proyecto", code: "project:\n  source: src/commerce\n  tests: tests\n  artifact: dist/commerce.whl\n  environments: [dev, test, prod]\n  secrets_in_repo: false", note: "El bundle del módulo 11 automatizará la promoción del artefacto." },
        pitfalls: ["Cometer credenciales o datos sensibles", "Mantener una versión distinta del notebook por entorno"],
        examDecision: "Para colaboración usa Git folders; para promoción repetible empaqueta código y aplica configuración por target.",
        checkpoint: { question: "¿Qué debe cambiar entre dev y prod?", answer: "La configuración y las identidades del target, no una copia divergente de la lógica." },
      },
    ],
    lab: {
      title: "Del notebook con estado a un flujo reproducible",
      goal: "Refactorizar una transformación parametrizada y preparar ejecución local con Databricks Connect.",
      scenario: "Un notebook de ventas depende de una variable creada manualmente y de una ruta escrita en una celda. Debe poder ejecutarse desde IDE y Job usando la misma función de transformación.",
      steps: ["Extrae la transformación a una función pura de DataFrame", "Recibe process_date como parámetro y valídalo", "Lee y escribe mediante nombres de Unity Catalog", "Crea un punto de entrada para Databricks Connect", "Documenta autenticación fuera del código y una prueba mínima"],
      starterCode: "from pyspark.sql import DataFrame\n\ndef build_daily_sales(orders: DataFrame, process_date: str) -> DataFrame:\n    # TODO: validar, filtrar y agregar con funciones nativas\n    return orders\n",
      solution: "from datetime import date\nfrom pyspark.sql import DataFrame, functions as F\n\ndef build_daily_sales(orders: DataFrame, process_date: str) -> DataFrame:\n    run_date = date.fromisoformat(process_date)\n    if run_date > date.today():\n        raise ValueError(\"process_date no puede ser futura\")\n    return (orders\n        .filter(F.col(\"order_date\") == F.lit(process_date).cast(\"date\"))\n        .filter(F.col(\"status\") == \"paid\")\n        .groupBy(\"order_date\")\n        .agg(F.sum(\"amount\").alias(\"revenue\"),\n             F.count_distinct(\"order_id\").alias(\"orders\")))\n\n# Entry point: spark puede proceder de notebook, Job o Databricks Connect.\nresult = build_daily_sales(spark.table(\"main.silver.orders\"), process_date)\nresult.write.mode(\"overwrite\").option(\"replaceWhere\", f\"order_date = '{process_date}'\").saveAsTable(\"main.gold.daily_sales\")\n",
      checks: [{ label: "Función DataFrame reutilizable", pattern: "def\\s+build_daily_sales\\s*\\(" }, { label: "Valida la fecha", pattern: "date\\.fromisoformat|ValueError" }, { label: "Usa funciones Spark nativas", pattern: "F\\.(col|sum|count_distinct)" }, { label: "Escritura idempotente por fecha", pattern: "replaceWhere" }],
      expectedEvidence: ["Función importable y sin dbutils", "Ejecución con un process_date válido y rechazo de uno inválido", "Plan o resultado con revenue y número de pedidos"],
      cloudNotes: { AWS: "El perfil de Connect puede usar OAuth o autenticación soportada; evita claves de S3 porque la tabla se autoriza mediante Unity Catalog.", Azure: "Configura el perfil contra el workspace Azure y usa OAuth/Entra según la política; no incluyas secretos de ADLS.", GCP: "Autentica el cliente contra el workspace y deja que la identidad de Databricks acceda a tablas gobernadas en GCS." },
    },
    quiz: [
      { question: "¿Qué revela mejor que un notebook depende de estado oculto?", options: ["Tiene varias celdas Markdown", "No usa display", "Falla al reiniciar y ejecutar todo en orden", "Incluye una consulta SQL"], answer: 2, explanation: "Una ejecución limpia elimina variables y estado residual, mostrando dependencias implícitas.", domain: "Databricks Intelligence Platform" },
      { question: "¿Dónde se ejecutan las operaciones Spark enviadas por Databricks Connect?", options: ["En el compute remoto", "Siempre en pandas local", "En GitHub Actions", "En el navegador"], answer: 0, explanation: "El cliente local construye planes, pero Spark ejecuta en Databricks.", domain: "Databricks Intelligence Platform" },
      { question: "¿Qué valor es apropiado para un parámetro de Job?", options: ["La contraseña JDBC", "Un dataset serializado", "Una clave privada", "La fecha de proceso"], answer: 3, explanation: "La fecha varía la ejecución sin exponer credenciales; los secretos deben gestionarse por mecanismos dedicados.", domain: "Working with Lakeflow Jobs" },
      { question: "Existe una función nativa para transformar una columna. ¿Qué opción preserva mejor la optimización?", options: ["collect y un bucle local", "La función nativa SQL/PySpark", "Una UDF Python equivalente", "Convertir toda la tabla a pandas"], answer: 1, explanation: "Las expresiones nativas son visibles para Catalyst y evitan serialización Python innecesaria.", domain: "Data Transformation and Modeling" },
    ],
    sources: [source("Databricks notebooks", "https://docs.databricks.com/aws/en/notebooks/"), source("Databricks Connect", "https://docs.databricks.com/aws/en/dev-tools/databricks-connect/"), source("Git folders", "https://docs.databricks.com/aws/en/repos/")],
  },

  m04: {
    lessons: [
      {
        summary: "Las transformaciones construyen un plan lógico; las acciones lo ejecutan y materializan un resultado.",
        explanation: ["DataFrames son inmutables: select, filter o withColumn devuelven un nuevo plan sin leer todos los datos inmediatamente. Catalyst puede reorganizar y simplificar ese plan antes de ejecutarlo.", "count, collect, write y display son acciones. Repetir acciones sobre el mismo linaje puede recalcularlo; cache solo compensa si hay reutilización medida y memoria suficiente."],
        keyPoints: ["Transformaciones son lazy", "Acciones disparan jobs", "Cache es una decisión medida"],
        example: { language: "PySpark", title: "Observar lazy evaluation", code: "paid = orders.filter(\"status = 'paid'\").select(\"order_id\", \"amount\")\npaid.explain(\"formatted\")\nrows = paid.count()", note: "explain inspecciona el plan; count inicia la ejecución." },
        pitfalls: ["Usar collect sobre un dataset grande", "Cachear cada DataFrame por costumbre"],
        examDecision: "Distingue una transformación que devuelve DataFrame de una acción que devuelve datos o escribe una salida.",
        checkpoint: { question: "¿filter ejecuta inmediatamente una lectura?", answer: "No; añade una operación al plan lógico lazy." },
      },
      {
        summary: "La limpieza fiable hace explícitos nulos, tipos, nombres y reglas antes de publicar Silver.",
        explanation: ["Convierte tipos con cast o try_cast según la política de error, normaliza texto con funciones nativas y decide si un nulo se rechaza, imputa o conserva. Una conversión silenciosa a null debe medirse.", "select con expresiones explícitas produce contratos más revisables que arrastrar todas las columnas. Añade columnas técnicas como ingestion_ts o source_file cuando aporten trazabilidad."],
        keyPoints: ["Cada nulo requiere una política", "El esquema objetivo debe ser explícito", "Las funciones nativas conservan optimización"],
        example: { language: "SQL", title: "Limpieza defensiva", code: "SELECT order_id,\n       try_cast(amount AS DECIMAL(18,2)) AS amount,\n       lower(trim(email)) AS email\nFROM main.bronze.orders\nWHERE order_id IS NOT NULL;", note: "Cuenta los amount convertidos a null antes de aceptar el lote." },
        pitfalls: ["Rellenar todos los nulos con cero", "Usar SELECT * en un contrato Silver"],
        examDecision: "Para datos potencialmente inválidos, usa conversión tolerante más una métrica o cuarentena; no ocultes pérdidas.",
        checkpoint: { question: "¿Qué ventaja ofrece try_cast?", answer: "Devuelve null para valores no convertibles, permitiendo medirlos y tratarlos sin abortar toda la consulta." },
      },
      {
        summary: "El tipo de join expresa qué filas deben sobrevivir; la cardinalidad y las claves determinan corrección y coste.",
        explanation: ["Inner conserva coincidencias; left conserva todas las filas de la izquierda; full conserva ambos lados. Antes del join comprueba unicidad: una dimensión duplicada puede multiplicar hechos sin producir error.", "union combina por posición y unionByName por nombre; ninguna elimina duplicados. Broadcast puede evitar shuffle para un lado pequeño, pero solo tras confirmar tamaño."],
        keyPoints: ["Elige join por semántica", "Valida cardinalidad antes y después", "Union no deduplica"],
        example: { language: "PySpark", title: "Join con claves compuestas", code: "enriched = orders.join(\n    customers.select(\"tenant_id\", \"customer_id\", \"segment\"),\n    [\"tenant_id\", \"customer_id\"],\n    \"left\",\n)", note: "Compara row count y claves sin correspondencia después del join." },
        pitfalls: ["Unir solo por customer_id en un sistema multitenant", "Confundir union con eliminación de duplicados"],
        examDecision: "Si deben conservarse todos los registros de origen aunque falte dimensión, selecciona left join.",
        checkpoint: { question: "¿Qué puede revelar un aumento inesperado de filas?", answer: "Una relación muchos-a-muchos o claves duplicadas en el lado que se creía único." },
      },
      {
        summary: "Arrays, structs y maps pueden transformarse sin perder el contexto de la fila padre.",
        explanation: ["explode crea una fila por elemento; explode_outer conserva la fila cuando la colección es null o vacía. Los campos de un struct se seleccionan con notación de punto y transform procesa arrays sin expandirlos.", "Al normalizar JSON, conserva la clave del registro padre y define qué hacer con arrays vacíos. Inferir indefinidamente el esquema de producción hace que cambios de origen alteren resultados sin revisión."],
        keyPoints: ["explode cambia cardinalidad", "explode_outer conserva padres sin elementos", "El esquema anidado debe versionarse"],
        example: { language: "PySpark", title: "Normalizar líneas de pedido", code: "lines = (raw\n  .select(\"order_id\", F.explode_outer(\"items\").alias(\"item\"))\n  .select(\"order_id\", F.col(\"item.sku\").alias(\"sku\"), F.col(\"item.qty\").alias(\"qty\")))", note: "Decide si una fila con sku null debe ir a cuarentena." },
        pitfalls: ["Perder order_id al explotar items", "Usar explode cuando transform mantiene mejor la cardinalidad"],
        examDecision: "Usa explode para convertir elementos en filas; usa acceso de struct o transform si no necesitas aumentar filas.",
        checkpoint: { question: "¿Cuándo elegir explode_outer?", answer: "Cuando la fila padre debe conservarse aunque el array sea null o esté vacío." },
      },
      {
        summary: "Ventanas calculan métricas por grupo sin colapsar filas y permiten deduplicación determinista.",
        explanation: ["groupBy reduce cada grupo; una window mantiene cada registro y añade ranking, acumulados o valores previos. El orden debe resolver empates para que el resultado sea repetible.", "Para conservar la versión más reciente, combina row_number con una ordenación por event_ts y un segundo campo estable. dropDuplicates sin criterio temporal no expresa qué versión conservar."],
        keyPoints: ["Window no colapsa filas", "El orden debe ser total", "Deduplicar exige regla de supervivencia"],
        example: { language: "PySpark", title: "Último evento por clave", code: "w = Window.partitionBy(\"order_id\").orderBy(F.desc(\"event_ts\"), F.desc(\"ingest_id\"))\nlatest = events.withColumn(\"rn\", F.row_number().over(w)).filter(\"rn = 1\").drop(\"rn\")", note: "ingest_id rompe empates de event_ts y hace la salida determinista." },
        pitfalls: ["Omitir criterio de desempate", "Usar groupBy cuando se necesitan columnas de detalle"],
        examDecision: "Para elegir una fila por grupo según prioridad, usa row_number sobre una window ordenada.",
        checkpoint: { question: "¿Por qué dropDuplicates no basta para elegir el evento más nuevo?", answer: "Porque elimina duplicados sin expresar una prioridad temporal determinista." },
      },
    ],
    lab: {
      title: "Normalización determinista de pedidos JSON", goal: "Crear una tabla de líneas limpia sin multiplicaciones ni duplicados accidentales.",
      scenario: "Pedidos multitenant llegan con items anidados, importes como texto y reenvíos del mismo evento. Silver necesita una fila por línea de la versión más reciente.",
      steps: ["Define esquema y selecciona campos", "Convierte importe y normaliza texto", "Deduplica pedidos con window y desempate", "Explota items conservando claves", "Valida cardinalidad, nulos y suma"],
      starterCode: "from pyspark.sql import functions as F, Window\nraw = spark.table(\"main.bronze.orders_json\")\n# TODO: deduplicar por tenant_id/order_id y normalizar items\n",
      solution: "from pyspark.sql import functions as F, Window\nw = Window.partitionBy(\"tenant_id\", \"order_id\").orderBy(F.desc(\"event_ts\"), F.desc(\"ingest_id\"))\nlatest = (raw\n  .withColumn(\"rn\", F.row_number().over(w)).filter(\"rn = 1\").drop(\"rn\")\n  .withColumn(\"amount\", F.expr(\"try_cast(amount AS DECIMAL(18,2))\")))\nlines = (latest\n  .select(\"tenant_id\", \"order_id\", \"event_ts\", F.explode_outer(\"items\").alias(\"item\"))\n  .select(\"tenant_id\", \"order_id\", \"event_ts\", F.col(\"item.sku\").alias(\"sku\"), F.col(\"item.qty\").cast(\"int\").alias(\"qty\"))\n  .filter(\"sku IS NOT NULL AND qty > 0\"))\nlines.write.mode(\"overwrite\").saveAsTable(\"main.silver.order_lines\")",
      checks: [{ label: "Deduplicación determinista", pattern: "(?:row_number[\\s\\S]+orderBy|orderBy[\\s\\S]+row_number)" }, { label: "Normaliza items", pattern: "explode_outer" }, { label: "Conserva claves multitenant", pattern: "tenant_id[\\s\\S]+order_id" }],
      expectedEvidence: ["Conteo antes/después con explicación", "Cero claves duplicadas en tenant_id/order_id/sku", "Registro de filas rechazadas por sku o qty"],
      cloudNotes: { AWS: "Si el JSON procede de S3, conserva _metadata.file_path para trazabilidad.", Azure: "Para ADLS Gen2 conserva la ruta de origen gobernada por external location.", GCP: "Para GCS evita claves embebidas y conserva metadatos del archivo de entrada." },
    },
    quiz: [
      { question: "¿Cuál de estas operaciones dispara ejecución?", options: ["select", "filter", "withColumn", "count"], answer: 3, explanation: "count es una acción; las otras construyen el plan.", domain: "Data Transformation and Modeling" },
      { question: "Necesitas conservar todas las órdenes aunque no exista cliente. ¿Qué join usas?", options: ["Left join desde órdenes", "Inner join", "Cross join", "Left semi join"], answer: 0, explanation: "Left mantiene todas las filas de la izquierda y añade null cuando no hay dimensión.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué operación conserva una fila con array vacío?", options: ["explode", "flatten", "explode_outer", "collect_list"], answer: 2, explanation: "explode_outer conserva el padre con valor null.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué patrón conserva el evento más reciente de forma determinista?", options: ["dropDuplicates sin orden", "row_number con window y desempate", "distinct después de collect", "groupBy de todas las columnas"], answer: 1, explanation: "La window expresa prioridad y desempate estable.", domain: "Data Transformation and Modeling" },
    ],
    sources: [source("PySpark DataFrames", "https://docs.databricks.com/aws/en/pyspark/basics"), source("DataFrame transformations", "https://docs.databricks.com/aws/en/transform/")],
  },

  m05: {
    lessons: [
      { summary: "El plan físico y sus métricas indican dónde se mueve y procesa el dato.", explanation: ["explain formatted separa plan lógico y físico; Exchange suele indicar shuffle, y el tipo de join muestra la estrategia elegida.", "Spark UI confirma con bytes, duración y distribución por tarea. Optimiza una hipótesis cada vez y conserva una línea base."], keyPoints: ["Exchange señala redistribución", "Plan y métricas se complementan", "Mide antes y después"], example: { language: "PySpark", title: "Plan físico", code: "result.explain(\"formatted\")", note: "Busca Exchange, Scan y el operador de join; después contrasta en Spark UI." }, pitfalls: ["Ajustar configuraciones sin línea base", "Interpretar solo el plan lógico"], examDecision: "Si preguntan por skew, shuffle o spill, revisa stages y tareas en Spark UI, no solo el tiempo total.", checkpoint: { question: "¿Qué operador suele delimitar un shuffle?", answer: "Exchange en el plan físico." } },
      { summary: "Particiones determinan paralelismo, tamaño de tareas y número de archivos.", explanation: ["spark.sql.shuffle.partitions controla particiones tras shuffles SQL; spark.default.parallelism influye en operaciones RDD y ciertos orígenes.", "repartition provoca shuffle y puede aumentar o redistribuir; coalesce suele reducir sin shuffle completo. El objetivo es tareas suficientemente numerosas y archivos de tamaño razonable."], keyPoints: ["Muy pocas particiones limitan paralelismo", "Demasiadas crean overhead", "repartition y coalesce no son equivalentes"], example: { language: "PySpark", title: "Reparto consciente", code: "spark.conf.set(\"spark.sql.shuffle.partitions\", 200)\nbalanced = events.repartition(200, \"event_date\")", note: "El valor 200 es punto de prueba, no receta; mide tamaños y duración." }, pitfalls: ["Copiar un número fijo a cualquier volumen", "coalesce a 1 antes de cada escritura"], examDecision: "Usa repartition para redistribuir o aumentar; coalesce para reducir cuando no necesitas equilibrado total.", checkpoint: { question: "¿Qué ajuste controla particiones de shuffle SQL?", answer: "spark.sql.shuffle.partitions." } },
      { summary: "Broadcast evita mover el lado grande cuando el otro cabe con seguridad en ejecutores.", explanation: ["BroadcastHashJoin distribuye una relación pequeña a cada executor y elimina el shuffle de la grande. El umbral automático o broadcast hint influyen en Catalyst.", "Una estimación obsoleta puede emitir un broadcast demasiado grande y causar presión de memoria. SortMergeJoin es razonable para dos lados grandes."], keyPoints: ["Broadcast mueve el lado pequeño", "Las estadísticas importan", "Dos lados grandes suelen requerir shuffle"], example: { language: "PySpark", title: "Broadcast explícito", code: "from pyspark.sql.functions import broadcast\nenriched = facts.join(broadcast(dim.select(\"id\", \"segment\")), \"id\")", note: "Confirma el tamaño real de dim y el operador del plan." }, pitfalls: ["Broadcast de una dimensión no acotada", "Forzar hint sin revisar memoria"], examDecision: "Con hechos grandes y dimensión pequeña, broadcast puede eliminar el shuffle de hechos.", checkpoint: { question: "¿Qué dataset se replica en BroadcastHashJoin?", answer: "El lado pequeño del join." } },
      { summary: "Skew, shuffle y spill son síntomas diferentes y requieren evidencia distinta.", explanation: ["Skew aparece cuando pocas tareas duran o leen mucho más que el resto. AQE puede dividir particiones sesgadas, pero una clave nula dominante o diseño incorrecto puede exigir filtrado, salting o preagregación.", "Spill indica que una operación usa disco por falta de memoria de ejecución; OOM puede proceder de collect, broadcast excesivo o particiones enormes. Añadir memoria sin corregir el patrón solo pospone el fallo."], keyPoints: ["Skew es distribución desigual", "Spill no equivale siempre a fallo", "AQE adapta el plan en runtime"], example: { language: "SQL", title: "Detectar claves dominantes", code: "SELECT join_key, count(*) AS rows\nFROM main.silver.events\nGROUP BY join_key\nORDER BY rows DESC\nLIMIT 20;", note: "Compara con la distribución de duración por tarea en Spark UI." }, pitfalls: ["Desactivar AQE sin causa", "Resolver OOM aumentando driver si falla un executor"], examDecision: "Una tarea extrema entre muchas rápidas sugiere skew; muchas tareas con spill sugieren presión general de memoria o particiones grandes.", checkpoint: { question: "¿Qué señal distingue skew?", answer: "Una distribución muy desigual de duración o bytes entre tareas del mismo stage." } },
      { summary: "El diagnóstico eficaz separa fallos de arranque, librerías, driver y ejecutores.", explanation: ["Un cluster que no inicia se investiga en eventos de compute y configuración; un import error en logs de tarea apunta a dependencias; driver OOM suele relacionarse con collect o metadatos.", "Parte del mensaje exacto, correlaciona run, task y cluster, y reproduce con el menor input. Cambiar simultáneamente runtime, nodos y código destruye la evidencia."], keyPoints: ["Localiza primero la fase del fallo", "Driver y executor tienen causas distintas", "Cambia una variable por experimento"], example: { language: "Python", title: "Evitar materializar en driver", code: "# Evita: rows = large_df.collect()\nsummary = large_df.groupBy(\"status\").count()\ndisplay(summary)", note: "Agrega de forma distribuida antes de devolver un resultado pequeño." }, pitfalls: ["Reinstalar librerías sin leer el error", "Aumentar el driver para un problema de skew"], examDecision: "Startup failure: eventos de compute; consulta lenta: Spark UI/Query Profile; conflicto de librería: logs y versiones.", checkpoint: { question: "¿Dónde empiezas ante un cluster que nunca arrancó?", answer: "En el event log del compute y la configuración, antes de Spark UI." } },
    ],
    lab: { title: "Diagnóstico de un join sesgado", goal: "Reducir shuffle y cola larga con evidencia.", scenario: "Un join diario tarda 42 minutos; una clave UNKNOWN concentra 38% de las filas y una dimensión de 20 MB se baraja.", steps: ["Captura plan y baseline", "Mide distribución de claves", "Separa o trata UNKNOWN", "Evalúa broadcast de dimensión", "Vuelve a medir runtime, shuffle y tarea máxima"], starterCode: "facts = spark.table(\"main.silver.events\")\ndim = spark.table(\"main.reference.event_types\")\nresult = facts.join(dim, \"event_type\")\nresult.explain(\"formatted\")", solution: "from pyspark.sql import functions as F\nfrom pyspark.sql.functions import broadcast\nvalid = facts.filter(F.col(\"event_type\").isNotNull() & (F.col(\"event_type\") != \"UNKNOWN\"))\nunknown = facts.filter(F.col(\"event_type\").isNull() | (F.col(\"event_type\") == \"UNKNOWN\")).withColumn(\"description\", F.lit(\"Unknown\"))\njoined = valid.join(broadcast(dim.select(\"event_type\", \"description\")), \"event_type\", \"left\")\nresult = joined.unionByName(unknown.select(joined.columns))\nresult.explain(\"formatted\")\n# Registrar: runtime, shuffle_read_bytes, max_task_duration y row_count antes/después.", checks: [{ label: "Trata la clave sesgada", pattern: "UNKNOWN" }, { label: "Evalúa broadcast", pattern: "broadcast\\s*\\(" }, { label: "Conserva filas", pattern: "unionByName" }], expectedEvidence: ["Plan antes/después", "Métricas de shuffle y duración máxima", "Mismo conteo y semántica de UNKNOWN"], cloudNotes: { AWS: "Relaciona métricas Spark con tipo y memoria de instancias EC2 solo después de corregir el plan.", Azure: "Comprueba si el cuello es ejecución antes de cambiar tamaños de VM.", GCP: "No cambies tipos de máquina hasta separar skew de falta global de memoria." } },
    quiz: [
      { question: "En un stage una tarea dura 12 minutos y el resto 20 segundos. ¿Qué sospechas primero?", options: ["Skew", "Falta de catálogo", "Auto-stop", "Error de sintaxis"], answer: 0, explanation: "La cola larga dentro del mismo stage es la señal típica de partición sesgada.", domain: "Troubleshooting, Monitoring, and Optimization" },
      { question: "¿Qué hace repartition?", options: ["Solo cambia metadatos", "Siempre reduce sin shuffle", "Redistribuye datos mediante shuffle", "Materializa en driver"], answer: 2, explanation: "repartition crea una nueva distribución y normalmente un shuffle.", domain: "Data Transformation and Modeling" },
      { question: "¿Cuándo es razonable broadcast?", options: ["Ambos lados son enormes", "El lado pequeño cabe con margen en ejecutores", "Hay una única partición", "El driver tiene poco disco"], answer: 1, explanation: "Broadcast replica el lado pequeño y evita barajar el grande.", domain: "Troubleshooting, Monitoring, and Optimization" },
      { question: "Un cluster no llega a RUNNING. ¿Qué superficie revisas primero?", options: ["Query Profile", "DESCRIBE HISTORY", "Lineage", "Eventos y configuración de compute"], answer: 3, explanation: "Spark UI aún no contiene jobs; el fallo está en aprovisionamiento o configuración.", domain: "Troubleshooting, Monitoring, and Optimization" },
    ],
    sources: [source("Optimización en Databricks", "https://docs.databricks.com/aws/en/optimizations/"), source("Debugging con Spark UI", "https://docs.databricks.com/aws/en/compute/troubleshooting/debugging-spark-ui")],
  },

  m06: {
    lessons: [
      { summary: "El transaction log ordena commits y permite snapshots consistentes sobre archivos Parquet.", explanation: ["Cada operación escribe acciones atómicas en _delta_log; los lectores construyen un snapshot válido sin observar archivos parcialmente publicados.", "La concurrencia optimista detecta conflictos al confirmar. ACID protege la tabla, pero no vuelve idempotente una lógica que inserta duplicados."], keyPoints: ["El log define el snapshot", "Lectores y escritores pueden concurrir", "ACID no sustituye claves idempotentes"], example: { language: "SQL", title: "Historial de commits", code: "DESCRIBE HISTORY main.silver.customers;", note: "Relaciona operation, user y parámetros con el incidente investigado." }, pitfalls: ["Modificar archivos Delta fuera del protocolo", "Confundir commit atómico con deduplicación"], examDecision: "Para auditoría de cambios usa DESCRIBE HISTORY; para contenido anterior usa time travel mientras esté retenido.", checkpoint: { question: "¿Qué evita que un lector vea media escritura?", answer: "El snapshot definido por un commit atómico del transaction log." } },
      { summary: "Managed y external describen el ciclo de vida; una external Delta elegible puede convertirse con SET MANAGED.", explanation: ["En una managed table, Unity Catalog administra datos y metadatos; en una external table gobierna el objeto, pero DROP TABLE no borra los archivos de la ubicación externa.", "ALTER TABLE … SET MANAGED conserva nombre, historial, permisos y vistas. Exige Delta y compute compatible; antes se inventarían todos los lectores, features, optimizaciones y streams. UNSET MANAGED permite rollback dentro de la ventana documentada."], keyPoints: ["Ambas pueden ser Delta", "SET MANAGED conserva continuidad", "La conversión exige inventario y reinicio de streams"], example: { language: "SQL", title: "Convertir y verificar", code: "DESCRIBE DETAIL main.learning.external_orders;\nALTER TABLE main.learning.external_orders SET MANAGED;\nDESCRIBE EXTENDED main.learning.external_orders;\n-- Rollback durante la ventana admitida:\n-- ALTER TABLE main.learning.external_orders UNSET MANAGED;", note: "Usa Serverless o DBR 17.3 LTS+; pausa OPTIMIZE y valida todos los lectores y escritores antes y después." }, pitfalls: ["Usar CTAS y perder continuidad sin necesidad", "Convertir sin inventariar clientes por ruta ni reiniciar streams"], examDecision: "Para convertir una external Delta elegible preservando historial y permisos, usa SET MANAGED; CTAS no ofrece la misma continuidad.", checkpoint: { question: "¿Qué conserva SET MANAGED frente a recrear por CTAS?", answer: "La identidad de tabla, configuración, permisos, vistas e historial, además de una ruta de rollback controlada." } },
      { summary: "DDL define objetos y DML modifica filas; MERGE expresa upsert con condiciones claras.", explanation: ["CREATE OR REPLACE redefine una tabla de forma atómica; INSERT añade, UPDATE cambia y DELETE elimina filas. MERGE combina coincidencias y no coincidencias desde una fuente.", "La fuente de MERGE debe tener como máximo una fila relevante por clave o definir previamente cuál gana. Añade una condición de secuencia para impedir que un evento antiguo sobrescriba uno reciente."], keyPoints: ["CREATE OR REPLACE sustituye el objeto", "MERGE necesita fuente determinista", "La secuencia protege de eventos antiguos"], example: { language: "SQL", title: "Upsert con secuencia", code: "MERGE INTO main.silver.customers t\nUSING updates s ON t.customer_id = s.customer_id\nWHEN MATCHED AND s.updated_at >= t.updated_at THEN UPDATE SET *\nWHEN NOT MATCHED THEN INSERT *;", note: "Deduplica updates por customer_id antes del MERGE." }, pitfalls: ["Múltiples filas fuente para una clave", "UPDATE sin condición temporal en CDC"], examDecision: "Para insertar y actualizar según coincidencia usa MERGE; para append puro usa INSERT.", checkpoint: { question: "¿Por qué condicionar updated_at?", answer: "Para que un evento tardío antiguo no revierta el estado nuevo." } },
      { summary: "Schema enforcement rechaza incompatibilidades; schema evolution acepta cambios configurados de forma explícita.", explanation: ["Enforcement evita escribir columnas o tipos incompatibles con el contrato. Evolution puede añadir columnas durante append o merge cuando se habilita por operación o configuración soportada.", "Aceptar columnas nuevas no significa aceptar cualquier cambio de tipo o semántica. Bronze puede ser más tolerante; Silver debe controlar contrato, nulos y consumidores."], keyPoints: ["Enforcement protege el contrato", "Evolution es opt-in", "Cambio sintáctico no garantiza compatibilidad semántica"], example: { language: "PySpark", title: "Evolución controlada", code: "(incoming.write\n  .format(\"delta\")\n  .mode(\"append\")\n  .option(\"mergeSchema\", \"true\")\n  .saveAsTable(\"main.bronze.orders\"))", note: "Registra columnas nuevas y prueba consumidores antes de propagarlas a Silver." }, pitfalls: ["Activar autoMerge global sin gobernanza", "Cambiar STRING a INT suponiendo evolución automática"], examDecision: "Si llegan columnas aditivas previstas, habilita evolution de forma localizada; para errores de contrato, deja que enforcement falle.", checkpoint: { question: "¿mergeSchema convierte cualquier tipo incompatible?", answer: "No; facilita cambios compatibles, especialmente columnas aditivas, pero no elimina restricciones de tipos." } },
      { summary: "Time travel consulta snapshots retenidos; VACUUM elimina archivos ya no referenciados tras un umbral.", explanation: ["VERSION AS OF y TIMESTAMP AS OF permiten reproducir una lectura anterior si existen log y archivos. RESTORE crea un nuevo commit que devuelve la tabla al estado elegido.", "VACUUM recupera almacenamiento, pero limita time travel y puede afectar lectores de larga duración si se reduce la retención sin criterio. History no garantiza que los archivos históricos sigan disponibles."], keyPoints: ["Time travel depende de retención", "RESTORE añade un commit", "VACUUM no es compactación"], example: { language: "SQL", title: "Comparar y restaurar", code: "SELECT count(*) FROM main.silver.orders VERSION AS OF 42;\nRESTORE TABLE main.silver.orders TO VERSION AS OF 42;", note: "Valida el snapshot antes de restaurar; RESTORE no borra el historial posterior." }, pitfalls: ["Usar VACUUM para compactar archivos", "Reducir retención ignorando lectores concurrentes"], examDecision: "OPTIMIZE aborda layout; VACUUM elimina archivos obsoletos; RESTORE revierte lógicamente a un snapshot.", checkpoint: { question: "¿DESCRIBE HISTORY garantiza time travel ilimitado?", answer: "No; puede listar versiones cuyos archivos ya no están retenidos." } },
    ],
    lab: { title: "MERGE idempotente con eventos tardíos", goal: "Actualizar clientes sin duplicados ni regresiones temporales.", scenario: "Un lote puede reintentarse y contiene dos cambios para el mismo cliente, incluido uno más antiguo que el estado actual.", steps: ["Deduplica la fuente por clave y secuencia", "Define condición de coincidencia", "Protege updates frente a eventos antiguos", "Ejecuta el lote dos veces", "Compara historial, conteo y valores"], starterCode: "-- updates(customer_id, email, updated_at, ingest_id)\nMERGE INTO main.silver.customers t\nUSING updates s\nON TODO\nWHEN MATCHED THEN TODO\nWHEN NOT MATCHED THEN TODO;", solution: "CREATE OR REPLACE TEMP VIEW latest_updates AS\nSELECT customer_id, email, updated_at\nFROM (\n  SELECT *, row_number() OVER (PARTITION BY customer_id ORDER BY updated_at DESC, ingest_id DESC) AS rn\n  FROM updates\n) WHERE rn = 1;\n\nMERGE INTO main.silver.customers t\nUSING latest_updates s ON t.customer_id = s.customer_id\nWHEN MATCHED AND s.updated_at >= t.updated_at THEN\n  UPDATE SET email = s.email, updated_at = s.updated_at\nWHEN NOT MATCHED THEN\n  INSERT (customer_id, email, updated_at) VALUES (s.customer_id, s.email, s.updated_at);\n\nDESCRIBE HISTORY main.silver.customers;", checks: [{ label: "Deduplica por clave", pattern: "row_number\\(\\)[\\s\\S]+PARTITION BY customer_id" }, { label: "Protege la secuencia", pattern: "s\\.updated_at\\s*>=\\s*t\\.updated_at" }, { label: "Cubre insert", pattern: "WHEN NOT MATCHED[\\s\\S]+INSERT" }], expectedEvidence: ["Mismo conteo y valores tras segundo run", "Evento antiguo no sobrescribe el nuevo", "Dos operaciones observables en history sin duplicación lógica"], cloudNotes: { AWS: "Para external tables usa una external location S3; el MERGE es idéntico.", Azure: "En ADLS gobierna la ubicación con storage credential y external location.", GCP: "En GCS usa la service account de la storage credential, no una clave en SQL." } },
    quiz: [
      { question: "¿Cómo conviertes una external Delta elegible a managed conservando historial, permisos y vistas?", options: ["CREATE TABLE AS SELECT", "ALTER TABLE … SET MANAGED", "DROP y recreación manual", "VACUUM"], answer: 1, explanation: "SET MANAGED conserva la identidad y continuidad del objeto; la conversión exige compute y clientes compatibles y reiniciar streams." , domain: "Governance and Security" },
      { question: "¿Qué evita que un evento antiguo revierta un cliente en MERGE?", options: ["Una condición de secuencia en MATCHED", "VACUUM", "SELECT DISTINCT final", "Auto-stop"], answer: 0, explanation: "Comparar updated_at o secuencia impide aplicar una versión anterior.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué comando elimina archivos Delta obsoletos según retención?", options: ["OPTIMIZE", "RESTORE", "VACUUM", "ANALYZE"], answer: 2, explanation: "VACUUM elimina archivos no referenciados; OPTIMIZE reorganiza archivos activos.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué aporta schema enforcement?", options: ["Acepta cualquier columna", "Borra registros inválidos", "Convierte toda tabla a external", "Rechaza escrituras incompatibles"], answer: 3, explanation: "Protege el esquema de la tabla ante datos incompatibles.", domain: "Data Transformation and Modeling" },
    ],
    sources: [source("Delta Lake", "https://docs.databricks.com/aws/en/delta/"), source("Convertir a managed con SET MANAGED", "https://docs.databricks.com/aws/en/tables/convert-to-managed"), source("MERGE INTO", "https://docs.databricks.com/aws/en/sql/language-manual/delta-merge-into")],
  },

  m07: {
    lessons: [
      { summary: "Medallion separa responsabilidades de datos, no obliga a copiar cada fila tres veces.", explanation: ["Bronze conserva fidelidad y trazabilidad; Silver aplica contratos y conformado; Gold publica modelos orientados a consumo.", "Cada frontera debe tener propietario, regla de calidad y estrategia de reejecución. Una capa solo se justifica si cambia garantías o consumidores."], keyPoints: ["Bronze prioriza replay", "Silver conforma", "Gold sirve casos de uso"], example: { language: "SQL", title: "Responsabilidades explícitas", code: "CREATE TABLE main.silver.orders_clean AS\nSELECT * FROM main.bronze.orders WHERE order_id IS NOT NULL;", note: "En producción añade tipos, deduplicación y métricas de rechazados." }, pitfalls: ["Tratar medallion como obligación física", "Limpiar Bronze hasta perder el original"], examDecision: "Asocia datos crudos reejecutables con Bronze, entidades validadas con Silver y métricas de negocio con Gold.", checkpoint: { question: "¿Dónde debe conservarse el dato original reproducible?", answer: "En Bronze, con metadatos de origen y sin transformaciones destructivas." } },
      { summary: "Silver convierte datos de origen en entidades confiables mediante contratos medibles.", explanation: ["Normaliza tipos, claves y zonas horarias; deduplica con reglas deterministas y separa registros que incumplen el contrato.", "Calidad no equivale a descartar: observa, cuarentena o falla según impacto y posibilidad de reparación."], keyPoints: ["Contrato explícito", "Cuarentena trazable", "Métricas por regla"], example: { language: "SQL", title: "Separar válidos", code: "SELECT * FROM main.bronze.orders\nWHERE order_id IS NOT NULL AND amount >= 0;", note: "Publica también el motivo y la fila rechazada en una tabla de cuarentena." }, pitfalls: ["Descartar sin contar", "Mezclar reglas técnicas y de negocio"], examDecision: "Falla ante corrupción que invalida el dataset; cuarentena errores reparables sin detener datos válidos.", checkpoint: { question: "¿Qué debe acompañar una cuarentena?", answer: "Registro original, regla fallida, momento y referencia al lote." } },
      { summary: "Gold puede publicar tablas, vistas, materialized views o streaming tables según frescura y coste.", explanation: ["Una vista calcula al consultar; una materialized view conserva resultados y refresca; una streaming table procesa entradas incrementales; una tabla se mantiene mediante una carga explícita.", "La elección depende de latencia, patrón de cambios y coste de recomputación, no de que Gold signifique siempre tabla física."], keyPoints: ["Vista calcula en lectura", "MV materializa y refresca", "Streaming table procesa incrementalmente"], example: { language: "SQL", title: "Objeto Gold materializado", code: "CREATE OR REFRESH MATERIALIZED VIEW main.gold.daily_sales AS\nSELECT order_date, sum(amount) revenue\nFROM main.silver.orders GROUP BY order_date;", note: "Valida soporte y política de refresh del entorno." }, pitfalls: ["Usar vista para agregación costosa muy consultada", "Elegir streaming sin requisito de frescura"], examDecision: "Para resultado persistido y refresco gestionado elige materialized view; para lógica siempre actual al consultar, view.", checkpoint: { question: "¿Qué diferencia una MV de una view?", answer: "La MV almacena y refresca resultados; la view almacena la consulta." } },
      { summary: "Un modelo dimensional separa medidas de eventos y contexto descriptivo.", explanation: ["La tabla de hechos fija un grain inequívoco y contiene claves y medidas; dimensiones describen cliente, producto o tiempo.", "El grain se define antes de columnas. Mezclar una fila por pedido con una por línea duplica importes y rompe agregaciones."], keyPoints: ["Define grain primero", "Hechos contienen medidas", "Dimensiones aportan contexto"], example: { language: "SQL", title: "Hecho a grain de línea", code: "SELECT order_id, line_id, customer_key, product_key, quantity, net_amount\nFROM main.silver.order_lines;", note: "Declara que cada fila representa exactamente una línea de pedido." }, pitfalls: ["No declarar grain", "Sumar importe de pedido repetido por línea"], examDecision: "Si una métrica se duplica al unir, revisa grain y cardinalidad antes de cambiar SQL.", checkpoint: { question: "¿Qué se define primero en una tabla de hechos?", answer: "El grain: qué evento representa cada fila." } },
      { summary: "Un contrato de datos une esquema, semántica, calidad, SLA y ownership.", explanation: ["Checks de unicidad, completitud, validez y frescura deben tener umbral y acción, no solo una consulta booleana.", "Los SLO permiten detectar degradación y decidir si bloquear publicación. El contrato se versiona cuando cambia la expectativa del consumidor."], keyPoints: ["Cada regla tiene umbral", "SLO mide servicio", "Ownership habilita respuesta"], example: { language: "SQL", title: "Métrica de completitud", code: "SELECT avg(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END) AS completeness\nFROM main.silver.orders;", note: "Compara con un umbral, por ejemplo 0.995, y registra la decisión." }, pitfalls: ["Check sin acción", "SLA sin propietario"], examDecision: "Elige una regla que mida el requisito y una acción proporcional; no conviertas todo fallo en DROP.", checkpoint: { question: "¿Qué diferencia un check de un contrato operativo?", answer: "El contrato añade umbral, acción, propietario y expectativa temporal." } },
    ],
    lab: { title: "Modelo medallion de ventas", goal: "Definir grain, controles y objeto Gold adecuado.", scenario: "Pedidos JSON incluyen reenvíos, líneas y clientes incompletos; finanzas necesita ingresos diarios reproducibles.", steps: ["Define responsabilidades por capa", "Declara grain de Silver y Gold", "Especifica tres reglas con acción", "Elige objeto Gold", "Prueba reconciliación de importes"], starterCode: "-- TODO: main.silver.order_lines y main.gold.daily_sales\n", solution: "CREATE OR REPLACE TABLE main.silver.order_lines AS\nSELECT tenant_id, order_id, item.line_id, order_date, customer_id,\n       item.sku, item.qty, item.qty * item.unit_price AS net_amount\nFROM main.bronze.orders, LATERAL explode(items) AS item\nWHERE order_id IS NOT NULL AND item.qty > 0;\n\nCREATE OR REFRESH MATERIALIZED VIEW main.gold.daily_sales AS\nSELECT order_date, sum(net_amount) AS revenue, count(DISTINCT order_id) AS orders\nFROM main.silver.order_lines GROUP BY order_date;\n\nSELECT sum(net_amount) AS silver_revenue FROM main.silver.order_lines;", checks: [{ label: "Grain de línea", pattern: "line_id" }, { label: "Objeto Gold", pattern: "MATERIALIZED VIEW" }, { label: "Reconciliación", pattern: "sum\\(net_amount\\)" }], expectedEvidence: ["Grain documentado", "Conteos de reglas y cuarentena", "Reconciliación Silver-Gold"], cloudNotes: { AWS: "Bronze puede aterrizar en un Volume respaldado por S3 y gobernado por UC.", Azure: "Usa ADLS Gen2 mediante Volume/external location para landing.", GCP: "Usa GCS mediante Volume/external location, conservando ruta de origen." } },
    quiz: [
      { question: "¿Qué capa conserva fidelidad para reejecutar?", options: ["Gold", "Bronze", "Dashboard", "Dimensión"], answer: 1, explanation: "Bronze preserva el original y sus metadatos.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué define primero una tabla de hechos?", options: ["Color del dashboard", "Número de particiones", "Grain", "Tipo de warehouse"], answer: 2, explanation: "El grain determina significado y agregación.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué objeto almacena resultados refrescables?", options: ["Materialized view", "View normal", "Widget", "External location"], answer: 0, explanation: "Una MV materializa el resultado y gestiona refresh.", domain: "Data Transformation and Modeling" },
      { question: "¿Qué hacer con errores reparables sin bloquear válidos?", options: ["Ignorarlos", "Borrar Bronze", "Conceder permisos", "Cuarentena trazable"], answer: 3, explanation: "La cuarentena conserva evidencia y deja avanzar registros válidos.", domain: "Data Transformation and Modeling" },
    ],
    sources: [source("Medallion architecture", "https://docs.databricks.com/aws/en/lakehouse-architecture/medallion"), source("Materialized views", "https://docs.databricks.com/aws/en/ldp/materialized-views")],
  },

  m08: {
    lessons: [
      { summary: "La ingesta se elige por origen, volumen, frescura, cambios y gobierno.", explanation: ["Carga completa simplifica fuentes pequeñas; incremental reduce movimiento pero necesita cursor, archivos descubiertos o CDC.", "Antes de seleccionar herramienta define reintento, borrados, esquema y límite de responsabilidad."], keyPoints: ["Full e incremental tienen trade-offs", "Idempotencia es requisito", "El origen condiciona el patrón"], example: { language: "YAML", title: "Contrato de ingesta", code: "source: orders_api\nmode: incremental\ncursor: updated_at\nreplay: true\ndeletes: tombstone", note: "El cursor debe ser estable y soportar desempates." }, pitfalls: ["Incremental sin cursor fiable", "Full load que borra historia útil"], examDecision: "Archivos recurrentes: COPY INTO o Auto Loader; conector empresarial soportado: Lakeflow Connect; API específica: REST orquestado.", checkpoint: { question: "¿Qué exige una carga incremental desde API?", answer: "Cursor o token estable, reintento idempotente y política de borrados." } },
      { summary: "Formato y compresión afectan esquema, pushdown, tamaño y coste.", explanation: ["Parquet y Delta son columnares; JSON/CSV requieren parseo y contratos; XML, text y binary cubren fuentes no tabulares.", "Bronze puede conservar payload y metadatos, pero debe fijar encoding, delimitador y tratamiento de registros corruptos."], keyPoints: ["Parquet es columnar", "Delta añade transacciones", "Semiestructurado exige esquema"], example: { language: "PySpark", title: "Lectura con esquema", code: "raw = (spark.read.schema(order_schema)\n  .option(\"mode\", \"PERMISSIVE\")\n  .json(\"/Volumes/main/landing/orders/incoming\"))", note: "Mide la columna de registros corruptos si la configuras." }, pitfalls: ["Inferir CSV en cada run", "Confundir Parquet con Delta"], examDecision: "Delta es tabla transaccional; Parquet es formato de archivo sin transaction log.", checkpoint: { question: "¿Qué añade Delta a Parquet?", answer: "Un protocolo y transaction log con ACID y gestión de tabla." } },
      { summary: "COPY INTO carga archivos nuevos de object storage de forma reintentable.", explanation: ["Mantiene historial de archivos ya procesados para evitar recarga en ejecuciones normales y permite opciones de formato y transformación limitada.", "Es apropiado para ingesta incremental SQL sencilla; Auto Loader escala mejor para descubrimiento continuo y evolución avanzada."], keyPoints: ["Rastrea archivos", "Es SQL declarativo", "No sustituye CDC de filas"], example: { language: "SQL", title: "COPY INTO gobernado", code: "COPY INTO main.bronze.orders\nFROM '/Volumes/main/landing/orders/incoming'\nFILEFORMAT = JSON\nFORMAT_OPTIONS ('inferSchema' = 'false');", note: "Crea previamente la tabla con esquema explícito." }, pitfalls: ["Renombrar contenido y esperar deduplicación de filas", "Usar force sin entender recarga"], examDecision: "Para archivos periódicos y SQL simple, COPY INTO; para alta escala y streaming, Auto Loader.", checkpoint: { question: "¿COPY INTO deduplica por order_id?", answer: "No; evita reprocesar archivos registrados, no entidades de negocio." } },
      { summary: "JDBC/ODBC consultan sistemas tabulares; REST requiere paginación, límites y persistencia durable.", explanation: ["Una lectura JDBC paralela necesita partitionColumn y bounds coherentes; demasiadas conexiones pueden dañar el origen.", "Una API REST debe manejar rate limits, retries con backoff, tokens, paginación y checkpoints antes de publicar en UC."], keyPoints: ["Protege el sistema fuente", "Persistencia antes de transformar", "Credenciales fuera del código"], example: { language: "PySpark", title: "JDBC particionado", code: "df = (spark.read.format(\"jdbc\")\n .option(\"url\", jdbc_url).option(\"dbtable\", \"orders\")\n .option(\"partitionColumn\", \"order_id\").option(\"lowerBound\", 1)\n .option(\"upperBound\", 1000000).option(\"numPartitions\", 8).load())", note: "Los bounds dividen lectura, no filtran filas." }, pitfalls: ["Abrir cientos de conexiones", "Loggear tokens REST"], examDecision: "Paraleliza JDBC solo si la fuente tolera conexiones y existe columna de partición adecuada.", checkpoint: { question: "¿numPartitions en JDBC también limita conexiones?", answer: "Sí, acota el número máximo de particiones/conexiones concurrentes." } },
      { summary: "Una landing gobernada conserva origen, lote y evidencia para replay.", explanation: ["Volumes ofrecen rutas de archivos bajo Unity Catalog; tablas Bronze organizan registros con metadatos de ingestión.", "La idempotencia se demuestra repitiendo el mismo lote y comparando filas, claves y commits, no solo ausencia de error."], keyPoints: ["Volumes gobiernan archivos", "Bronze conserva metadata", "Replay debe probarse"], example: { language: "SQL", title: "Metadatos de origen", code: "SELECT *, _metadata.file_path, _metadata.file_modification_time\nFROM read_files('/Volumes/main/landing/orders', format => 'json');", note: "Persiste los metadatos necesarios para investigar duplicados." }, pitfalls: ["Guardar landing en ruta personal", "Declarar idempotencia sin segundo run"], examDecision: "Para archivos no tabulares gobernados, usa Volumes; para consumo relacional, publica tablas UC.", checkpoint: { question: "¿Qué evidencia prueba reintento seguro?", answer: "Mismo resultado lógico tras ejecutar dos veces el mismo lote." } },
    ],
    lab: { title: "Lote JSON idempotente con COPY INTO", goal: "Cargar archivos gobernados y demostrar que no se duplican al reintentar.", scenario: "Cada hora llega un lote JSON a un Volume; auditoría exige ruta y fecha del archivo.", steps: ["Crea tabla Bronze con esquema", "Ejecuta COPY INTO", "Captura conteo e historial", "Repite sin nuevos archivos", "Valida metadata y registros inválidos"], starterCode: "CREATE TABLE IF NOT EXISTS main.bronze.orders_raw (order_id STRING, amount DECIMAL(18,2), source_file STRING);\n-- TODO COPY INTO", solution: "COPY INTO main.bronze.orders_raw\nFROM (SELECT order_id, try_cast(amount AS DECIMAL(18,2)), _metadata.file_path\n      FROM '/Volumes/main/landing/orders/incoming')\nFILEFORMAT = JSON\nCOPY_OPTIONS ('mergeSchema' = 'false');\n\nSELECT count(*) rows, count(DISTINCT source_file) files\nFROM main.bronze.orders_raw;\nDESCRIBE HISTORY main.bronze.orders_raw;", checks: [{ label: "Usa COPY INTO", pattern: "COPY INTO" }, { label: "Conserva file_path", pattern: "_metadata\\.file_path" }, { label: "Valida reintento", pattern: "count\\(" }], expectedEvidence: ["Conteo idéntico en segundo run", "Lista de archivos cargados", "Registros con amount inválido cuantificados"], cloudNotes: { AWS: "El Volume puede referenciar S3 mediante IAM role y external location.", Azure: "El Volume puede referenciar ADLS Gen2 mediante managed identity.", GCP: "El Volume puede referenciar GCS mediante service account gobernada." } },
    quiz: [
      { question: "¿Qué garantiza COPY INTO por defecto?", options: ["Deduplicación por clave", "Historial de archivos procesados", "CDC de borrados", "Broadcast join"], answer: 1, explanation: "Rastrea archivos, no duplicados de negocio.", domain: "Data Ingestion and Loading" },
      { question: "¿Qué formato incluye transaction log?", options: ["CSV", "JSON", "Delta", "Parquet solo"], answer: 2, explanation: "Delta combina archivos Parquet y transaction log.", domain: "Data Ingestion and Loading" },
      { question: "¿Dónde colocar archivos gobernados no tabulares?", options: ["Unity Catalog Volume", "Driver local", "Git folder", "Widget"], answer: 0, explanation: "Volumes gobiernan acceso a archivos.", domain: "Governance and Security" },
      { question: "¿Qué riesgo tiene JDBC muy paralelizado?", options: ["Crea lineage", "Activa Photon", "Convierte a Delta", "Sobrecarga la fuente"], answer: 3, explanation: "Cada partición puede abrir conexión concurrente.", domain: "Data Ingestion and Loading" },
    ],
    sources: [source("Ingestion", "https://docs.databricks.com/aws/en/ingestion/"), source("COPY INTO", "https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/copy-into/")],
  },

  m09: {
    lessons: [
      { summary: "Auto Loader descubre archivos incrementalmente mediante cloudFiles.", explanation: ["readStream.format('cloudFiles') conserva estado de archivos y escala sin listar todo repetidamente.", "Necesita formato de origen, checkpoint durable y, según el caso, schemaLocation o esquema proporcionado."], keyPoints: ["cloudFiles es la fuente", "Checkpoint conserva progreso", "Esquema debe gobernarse"], example: { language: "PySpark", title: "Auto Loader", code: "stream = (spark.readStream.format(\"cloudFiles\")\n .option(\"cloudFiles.format\", \"json\")\n .option(\"cloudFiles.schemaLocation\", schema_path)\n .load(landing_path))", note: "Usa rutas distintas de schema y checkpoint por workload." }, pitfalls: ["Compartir checkpoint", "Borrarlo para reintentar"], examDecision: "Para archivos crecientes a escala y procesamiento incremental, Auto Loader es la opción directa.", checkpoint: { question: "¿Qué opción indica formato de los archivos?", answer: "cloudFiles.format." } },
      { summary: "Directory listing simplifica; file notification reduce listados a gran escala.", explanation: ["El modo de descubrimiento se elige por volumen y configuración cloud; ambos necesitan permisos correctos.", "rescuedDataColumn conserva campos que no encajan y permite estudiar evolución sin perder payload."], keyPoints: ["Listing requiere menos infraestructura", "Notifications escalan descubrimiento", "Rescued data preserva anomalías"], example: { language: "PySpark", title: "Rescatar cambios", code: "stream = (spark.readStream.format(\"cloudFiles\")\n .option(\"cloudFiles.format\", \"json\")\n .option(\"rescuedDataColumn\", \"_rescued_data\")\n .load(landing_path))", note: "Alerta si crece _rescued_data." }, pitfalls: ["Ignorar rescued data", "Cambiar esquema sin probar checkpoint"], examDecision: "Si aparecen campos inesperados, rescátalos y evalúa evolución antes de descartarlos.", checkpoint: { question: "¿Para qué sirve _rescued_data?", answer: "Para conservar datos que no coinciden con el esquema esperado." } },
      { summary: "Lakeflow Connect managed connectors gestionan ingestión; standard connectors ofrecen acceso desde código.", explanation: ["Managed connectors reducen operación y crean pipelines gobernados para fuentes compatibles. Standard connectors amplían fuentes desde Spark o pipelines.", "La disponibilidad, latencia y capacidades de CDC dependen del conector; no todos ofrecen la misma semántica."], keyPoints: ["Managed minimiza operación", "Standard da control en código", "Capacidades dependen de fuente"], example: { language: "YAML", title: "Evaluación de conector", code: "source: salesforce\nconnector: managed\nmode: incremental\ntarget_catalog: main\nlatency_slo_minutes: 30", note: "Confirma soporte regional y objetos de origen." }, pitfalls: ["Prometer CDC sin verificar conector", "Elegir custom antes de revisar managed"], examDecision: "Fuente empresarial soportada y baja operación: managed connector; lógica especial: standard/custom.", checkpoint: { question: "¿Qué ventaja central ofrece managed?", answer: "Databricks administra infraestructura y operación de la ingesta compatible." } },
      { summary: "La matriz de decisión compara volumen, frecuencia, tipos y gobierno.", explanation: ["COPY INTO encaja en lotes de archivos simples; Auto Loader en archivos incrementales escalables; Connect en SaaS y bases soportadas.", "JDBC/REST siguen siendo válidos cuando el origen o contrato no está cubierto, pero trasladan más responsabilidad al equipo."], keyPoints: ["No existe una herramienta universal", "Gobierno forma parte de la elección", "Operación es un coste"], example: { language: "Python", title: "Regla legible", code: "choice = \"autoloader\" if source == \"files\" and continuous else \"copy_into\"\nif managed_connector_available: choice = \"lakeflow_connect\"", note: "Completa con SLA, CDC y limitaciones." }, pitfalls: ["Usar streaming para un lote mensual", "Construir REST para fuente ya soportada"], examDecision: "Prioriza la opción gestionada que cumpla requisitos; aumenta control solo con una causa concreta.", checkpoint: { question: "¿Qué elegir para JSON continuo en S3/ADLS/GCS?", answer: "Auto Loader, con checkpoint y esquema gobernados." } },
      { summary: "Evolución y estado deben aislarse por pipeline y ambiente.", explanation: ["Checkpoint codifica offsets y estado compatible con la consulta; cambios de fuente, claves o estado pueden exigir nueva ubicación y backfill.", "Dev y prod no comparten schemaLocation ni checkpoint. La tabla objetivo se gobierna en UC y la identidad tiene mínimo privilegio."], keyPoints: ["Checkpoint es parte del contrato", "Entornos aislados", "Backfill se planifica"], example: { language: "PySpark", title: "Escritura durable", code: "(stream.writeStream\n .option(\"checkpointLocation\", checkpoint_path)\n .trigger(availableNow=True)\n .toTable(\"main.bronze.orders\"))", note: "availableNow procesa lo disponible y se detiene conservando progreso." }, pitfalls: ["Reutilizar checkpoint con otra query", "Guardar checkpoint en ruta temporal"], examDecision: "Para ejecución incremental por lotes con estado durable, combina Auto Loader, availableNow y checkpoint estable.", checkpoint: { question: "¿Qué ocurre al borrar checkpoint?", answer: "Se pierde progreso; la fuente puede reprocesarse o volverse incompatible según configuración." } },
    ],
    lab: { title: "Auto Loader con evolución controlada", goal: "Ingerir JSON incremental con estado, rescued data y evidencia de reanudación.", scenario: "Miles de archivos diarios añaden ocasionalmente columnas; el pipeline corre con availableNow cada 15 minutos.", steps: ["Configura cloudFiles", "Separa schemaLocation y checkpoint", "Conserva rescued data", "Ejecuta dos lotes", "Demuestra reanudación y política de evolución"], starterCode: "landing = \"/Volumes/main/landing/orders\"\nschema_path = \"/Volumes/main/checkpoints/orders/schema\"\ncheckpoint = \"/Volumes/main/checkpoints/orders/run\"\n# TODO readStream/writeStream", solution: "stream = (spark.readStream.format(\"cloudFiles\")\n .option(\"cloudFiles.format\", \"json\")\n .option(\"cloudFiles.schemaLocation\", schema_path)\n .option(\"cloudFiles.schemaEvolutionMode\", \"rescue\")\n .option(\"rescuedDataColumn\", \"_rescued_data\")\n .load(landing))\n(stream.writeStream.option(\"checkpointLocation\", checkpoint)\n .trigger(availableNow=True).toTable(\"main.bronze.orders_raw\"))", checks: [{ label: "Fuente cloudFiles", pattern: "format\\(\\\"cloudFiles\\\"\\)" }, { label: "Estado separado", pattern: "schemaLocation[\\s\\S]+checkpointLocation" }, { label: "Rescata cambios", pattern: "rescuedDataColumn|schemaEvolutionMode" }], expectedEvidence: ["Primer y segundo run con archivos procesados", "Cero reproceso al repetir sin archivos", "Conteo y muestra de rescued data"], cloudNotes: { AWS: "File notification usa servicios y permisos AWS específicos; valida external location S3.", Azure: "Configura eventos y permisos de ADLS Gen2 si eliges notificaciones.", GCP: "Configura notificaciones GCS/Pub/Sub según el modo soportado y mínimo privilegio." } },
    quiz: [
      { question: "¿Qué formato configura Auto Loader?", options: ["cloudFiles.format", "checkpointLocation", "mergeSchema", "trigger"], answer: 0, explanation: "cloudFiles.format identifica JSON, CSV, Parquet, etc.", domain: "Data Ingestion and Loading" },
      { question: "¿Qué ruta no deben compartir dos consultas?", options: ["Catálogo", "Checkpoint", "Nombre de equipo", "Dashboard"], answer: 1, explanation: "Cada query necesita checkpoint propio y compatible.", domain: "Data Ingestion and Loading" },
      { question: "¿Qué opción reduce operación para una fuente SaaS soportada?", options: ["Bucle REST manual", "COPY INTO", "Lakeflow Connect managed", "collect"], answer: 2, explanation: "Managed connectors operan la ingesta compatible.", domain: "Data Ingestion and Loading" },
      { question: "¿Qué conserva un campo inesperado?", options: ["VACUUM", "Auto-stop", "Broadcast", "rescuedDataColumn"], answer: 3, explanation: "Rescued data evita perder el payload no ajustado al esquema.", domain: "Data Ingestion and Loading" },
    ],
    sources: [source("Auto Loader", "https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/auto-loader/"), source("Lakeflow Connect", "https://docs.databricks.com/aws/en/ingestion/")],
  },

  m10: {
    lessons: [
      { summary: "Lakeflow Jobs expresa workflows como DAG de tareas con dependencias observables.", explanation: ["Cada tarea define tipo, compute, identidad y resultado; dependencias permiten paralelismo cuando no existe relación de datos.", "Divide por unidades reintentables e idempotentes, no por cada línea de código."], keyPoints: ["DAG dirige orden", "Tareas independientes paralelizan", "Cada tarea debe ser reintentable"], example: { language: "YAML", title: "DAG mínimo", code: "tasks:\n  - task_key: bronze\n  - task_key: silver\n    depends_on: [{task_key: bronze}]\n  - task_key: gold\n    depends_on: [{task_key: silver}]", note: "Asigna compute y código en la definición completa." }, pitfalls: ["DAG totalmente serial", "Estado oculto entre notebooks"], examDecision: "Usa dependencias solo cuando una tarea necesita la salida o éxito de otra.", checkpoint: { question: "¿Qué permite ejecutar dos tareas a la vez?", answer: "Que no exista una dependencia entre ellas y haya capacidad disponible." } },
      { summary: "Parámetros configuran runs y task values intercambian valores pequeños entre tareas.", explanation: ["Los job parameters pueden propagarse y los task parameters alimentan notebooks, Python o SQL.", "taskValues transporta IDs, fechas o conteos; las tablas y archivos transportan datasets."], keyPoints: ["Parámetros son configuración", "Task values son pequeños", "Datos pasan por storage"], example: { language: "Python", title: "Valor entre tareas", code: "dbutils.jobs.taskValues.set(key=\"validated_rows\", value=validated.count())\nrows = dbutils.jobs.taskValues.get(taskKey=\"validate\", key=\"validated_rows\")", note: "No uses count en definiciones declarativas de pipeline; este ejemplo es tarea Job clásica." }, pitfalls: ["Pasar secretos como parámetro", "Serializar DataFrame en task value"], examDecision: "Para valor escalar entre tareas usa task values; para dataset publica tabla gobernada.", checkpoint: { question: "¿Es taskValues apropiado para un millón de filas?", answer: "No; publica el dataset en una tabla o archivo gobernado." } },
      { summary: "Retries, if/else y for-each modelan recuperación y control flow sin duplicar lógica.", explanation: ["Retry atiende fallos transitorios si la tarea es idempotente; if/else evalúa una condición y for-each repite sobre una lista acotada.", "Una rama no sustituye validación de datos y un bucle masivo puede crear demasiadas tareas."], keyPoints: ["Retry exige idempotencia", "If/else decide rutas", "For-each requiere límites"], example: { language: "YAML", title: "Retry controlado", code: "task_key: publish\nmax_retries: 2\nmin_retry_interval_millis: 60000\ntimeout_seconds: 1800", note: "Clasifica errores permanentes para no reintentarlos inútilmente." }, pitfalls: ["Retry de append no idempotente", "For-each con miles de elementos"], examDecision: "Fallo transitorio: retry; decisión basada en valor: if/else; lista pequeña dinámica: for-each.", checkpoint: { question: "¿Qué debe comprobarse antes de activar retry?", answer: "Que repetir la tarea no duplique ni corrompa resultados." } },
      { summary: "Schedule, file arrival y table update disparan Jobs por tiempo o disponibilidad del dato.", explanation: ["Schedule usa calendario y zona horaria; file arrival observa nuevas llegadas; table update reacciona a cambios de tablas compatibles.", "Elige señal de datos cuando evita espera o runs vacíos; usa calendario cuando la obligación es temporal."], keyPoints: ["Cron depende de zona horaria", "File arrival es data-driven", "Table update sigue tablas"], example: { language: "YAML", title: "Schedule UTC", code: "schedule:\n  quartz_cron_expression: '0 0 2 * * ?'\n  timezone_id: UTC\n  pause_status: UNPAUSED", note: "Documenta cómo afecta horario de verano si no usas UTC." }, pitfalls: ["Cron sin timezone", "File trigger sobre ruta inestable"], examDecision: "Si el requisito dice 'cuando llegue el archivo', elige file arrival, no polling frecuente.", checkpoint: { question: "¿Qué trigger reduce runs vacíos cuando llegan archivos irregularmente?", answer: "File arrival trigger." } },
      { summary: "Run history, repairs y alertas convierten un DAG fallido en una recuperación auditable.", explanation: ["Repair run reejecuta tareas fallidas y dependientes sin repetir éxitos innecesarios; parameter override permite corregir una partición.", "Las alertas deben indicar owner, run y acción. Spark UI atiende ejecución; run history atiende tendencia y estado del workflow."], keyPoints: ["Repair preserva éxitos", "Override corrige el run", "Alertas deben ser accionables"], example: { language: "SQL", title: "Historial en system table", code: "SELECT job_id, run_id, result_state, period_start_time\nFROM system.lakeflow.job_run_timeline\nORDER BY period_start_time DESC;", note: "Une jobs para obtener nombre y segmenta por workspace." }, pitfalls: ["Relanzar todo tras una única tarea fallida", "Alerta sin enlace al run"], examDecision: "Para recuperar parte de un workflow, usa repair run; para investigar tendencia, run history/system tables.", checkpoint: { question: "¿Qué evita repetir tareas ya correctas?", answer: "Un repair run desde las tareas fallidas o seleccionadas." } },
    ],
    lab: { title: "Job bronze-silver-gold operable", goal: "Definir DAG, parámetros, control flow y recuperación.", scenario: "Pedidos llegan irregularmente; calidad decide publicar o cuarentena y una partición puede repararse.", steps: ["Diseña DAG", "Añade process_date", "Incluye condición de calidad", "Configura trigger y retry", "Documenta repair"], starterCode: "resources:\n  jobs:\n    orders_job:\n      tasks: []", solution: "resources:\n  jobs:\n    orders_job:\n      parameters: [{name: process_date, default: '{{job.start_time.iso_date}}'}]\n      tasks:\n        - task_key: bronze\n          notebook_task: {notebook_path: ../src/bronze}\n          max_retries: 2\n        - task_key: validate\n          depends_on: [{task_key: bronze}]\n          notebook_task: {notebook_path: ../src/validate}\n        - task_key: publish\n          depends_on: [{task_key: validate}]\n          condition_task: {op: GREATER_THAN, left: '{{tasks.validate.values.valid_ratio}}', right: '0.99'}\n      trigger:\n        file_arrival: {url: /Volumes/main/landing/orders}", checks: [{ label: "DAG", pattern: "depends_on" }, { label: "Control flow", pattern: "condition_task" }, { label: "Trigger", pattern: "file_arrival" }], expectedEvidence: ["Grafo y ejecución de prueba", "Retry sin duplicados", "Procedimiento de repair por fecha"], cloudNotes: { AWS: "File arrival apunta a Volume/external location S3.", Azure: "Apunta a ADLS gobernado y valida eventos soportados.", GCP: "Apunta a GCS gobernado y valida disponibilidad regional." } },
    quiz: [
      { question: "¿Cómo recuperas solo tareas fallidas?", options: ["Nuevo workspace", "Repair run", "VACUUM", "Clone"], answer: 1, explanation: "Repair reejecuta el subconjunto necesario.", domain: "Working with Lakeflow Jobs" },
      { question: "¿Qué transporta un DataFrame entre tareas?", options: ["Task value", "Widget", "Tabla gobernada", "Email"], answer: 2, explanation: "Datasets deben persistirse; task values son escalares pequeños.", domain: "Working with Lakeflow Jobs" },
      { question: "¿Qué trigger responde a una llegada irregular?", options: ["File arrival", "Cron cada minuto", "Auto-stop", "SQL alert"], answer: 0, explanation: "Es un trigger dirigido por datos.", domain: "Working with Lakeflow Jobs" },
      { question: "¿Cuándo es seguro retry?", options: ["Append duplica", "Nunca", "Solo manual", "La tarea es idempotente"], answer: 3, explanation: "Repetir debe producir el mismo estado lógico.", domain: "Working with Lakeflow Jobs" },
    ], sources: [source("Lakeflow Jobs", "https://docs.databricks.com/aws/en/jobs/"), source("Control flow", "https://docs.databricks.com/aws/en/jobs/control-flow"), source("Triggers", "https://docs.databricks.com/aws/en/jobs/triggers")],
  },

  m11: {
    lessons: [
      { summary: "Unity Catalog gobierna objetos mediante jerarquía, ownership y herencia.", explanation: ["Catalog contiene schemas; schemas contienen tablas, vistas, volúmenes y funciones.", "Managed prioriza gestión Databricks; external conserva ciclo de vida cloud mediante credential y external location."], keyPoints: ["Tres niveles", "Ownership permite administrar", "Managed recomendado"], example: { language: "SQL", title: "Namespace", code: "CREATE SCHEMA IF NOT EXISTS main.sales;\nCREATE TABLE main.sales.orders (id BIGINT) USING DELTA;", note: "Concede privilegios al grupo, no a individuos." }, pitfalls: ["Nombres de una parte", "Credenciales a usuarios finales"], examDecision: "Managed para nuevas tablas salvo necesidad explícita de ubicación externa.", checkpoint: { question: "¿Qué contiene un schema?", answer: "Tablas, vistas, volúmenes, funciones y otros objetos." } },
      { summary: "GRANT, REVOKE y DENY aplican mínimo privilegio a principals de cuenta.", explanation: ["USE CATALOG y USE SCHEMA permiten recorrer namespace; SELECT autoriza lectura del objeto.", "Concede a grupos o service principals y aprovecha herencia; DENY explícito prevalece donde esté soportado."], keyPoints: ["Principals son de cuenta", "USE no concede SELECT", "Grupos simplifican"], example: { language: "SQL", title: "Lectura mínima", code: "GRANT USE CATALOG ON CATALOG main TO `analysts`;\nGRANT USE SCHEMA ON SCHEMA main.gold TO `analysts`;\nGRANT SELECT ON TABLE main.gold.daily_sales TO `analysts`;", note: "REVOKE retira una concesión; revisa herencia antes de asumir pérdida efectiva." }, pitfalls: ["GRANT a cada persona", "SELECT sin USE ancestors"], examDecision: "Para leer tabla se requieren USE en ancestros y SELECT en objeto o nivel heredable.", checkpoint: { question: "¿USE SCHEMA permite leer tablas?", answer: "No por sí solo; también se requiere SELECT." } },
      { summary: "Lineage, audit logs y ABAC aportan trazabilidad y políticas centralizadas.", explanation: ["Lineage registra relaciones entre objetos; system.access.audit registra acciones según disponibilidad.", "ABAC usa governed tags y policies para máscaras y filtros a escala; una máscara directa encaja en casos aislados."], keyPoints: ["Lineage muestra dependencias", "Audit muestra acciones", "ABAC aplica por atributos"], example: { language: "SQL", title: "Máscara directa", code: "ALTER TABLE main.gold.customers ALTER COLUMN email SET MASK main.security.email_mask;", note: "Para muchas tablas sensibles, evalúa política ABAC con governed tags." }, pitfalls: ["Confundir lineage con auditoría", "UDF de máscara con acceso excesivo"], examDecision: "Control repetido por clasificación: ABAC; caso único: row filter/column mask directa.", checkpoint: { question: "¿Qué diferencia audit y lineage?", answer: "Audit registra quién hizo qué; lineage relaciona entradas y salidas de datos." } },
      { summary: "Git folders permiten ramas, commits y pull requests desde el workspace.", explanation: ["Sincronizan código con Git para colaboración y revisión.", "No almacenan tablas ni sustituyen CI; conflictos se resuelven como en un repositorio normal."], keyPoints: ["Código versionado", "Ramas aíslan cambios", "PR revisa"], example: { language: "CLI", title: "Flujo conceptual", code: "git checkout -b feature/orders-quality\ngit add src tests\ngit commit -m 'Add order quality checks'\ngit push -u origin feature/orders-quality", note: "La creación del PR ocurre en el proveedor Git." }, pitfalls: ["Commit de secretos", "Edición directa en main"], examDecision: "Para desarrollar una feature crea rama, commit, push y PR; no copies notebooks por entorno.", checkpoint: { question: "¿Dónde se aprueba un PR?", answer: "En el proveedor Git integrado." } },
      { summary: "Declarative Automation Bundles empaqueta recursos y promueve el mismo código por targets.", explanation: ["databricks.yml define bundle, includes, variables, artifacts, resources y targets.", "validate comprueba configuración, deploy aplica recursos y run ejecuta; dev/test/prod cambian variables e identidad, no lógica."], keyPoints: ["Mismo artefacto", "Targets configuran", "CLI automatiza"], example: { language: "YAML", title: "Targets", code: "bundle: {name: orders}\nvariables: {catalog: {default: dev}}\ntargets:\n  dev: {default: true}\n  prod:\n    variables: {catalog: prod}", note: "Añade resources e identidad run_as para producción." }, pitfalls: ["Código duplicado por target", "Deploy prod con identidad personal"], examDecision: "validate antes de deploy; usa variables/overrides para promocionar recursos entre entornos.", checkpoint: { question: "¿Qué comando comprueba un bundle?", answer: "databricks bundle validate -t <target>." } },
    ],
    lab: { title: "Gobierno y bundle dev/prod", goal: "Aplicar mínimo privilegio y empaquetar un Job.", scenario: "Analistas leen Gold; un service principal publica; el mismo Job pasa de dev a prod.", steps: ["Define grants", "Añade máscara/ABAC", "Crea bundle y variables", "Define targets", "Valida identidad de prod"], starterCode: "bundle:\n  name: orders\nvariables: {}\nresources: {}\ntargets: {}", solution: "bundle: {name: orders}\nvariables:\n  catalog: {default: dev}\nresources:\n  jobs:\n    publish_orders:\n      name: publish-orders\n      tasks: [{task_key: publish, notebook_task: {notebook_path: ../src/publish}}]\ntargets:\n  dev: {default: true}\n  prod:\n    variables: {catalog: prod}\n    run_as: {service_principal_name: orders-prod-sp}\n# SQL separado: GRANT USE CATALOG/USE SCHEMA/SELECT TO `analysts`", checks: [{ label: "Targets", pattern: "dev:[\\s\\S]+prod:" }, { label: "Service principal", pattern: "service_principal" }, { label: "Job resource", pattern: "resources:[\\s\\S]+jobs:" }], expectedEvidence: ["bundle validate para ambos targets", "Plan de grants efectivo", "Identidad no personal en prod"], cloudNotes: { AWS: "Storage credential usa IAM role.", Azure: "Usa managed identity/Access Connector.", GCP: "Usa service account generada por UC." } },
    quiz: [
      { question: "¿Qué privilegios mínimos permiten leer una tabla?", options: ["SELECT solo", "USE CATALOG, USE SCHEMA y SELECT", "MODIFY", "OWN"], answer: 1, explanation: "Se necesita recorrer ancestros y leer el objeto.", domain: "Governance and Security" },
      { question: "¿Qué escala máscaras por clasificación?", options: ["ABAC", "Widget", "Pool", "Checkpoint"], answer: 0, explanation: "ABAC aplica policies según governed tags.", domain: "Governance and Security" },
      { question: "¿Qué comando aplica recursos de un bundle?", options: ["bundle init", "bundle summary", "bundle deploy", "fs cp"], answer: 2, explanation: "deploy crea o actualiza recursos del target.", domain: "Implementing CI/CD" },
      { question: "¿Qué identidad debe ejecutar prod?", options: ["Cualquier analista", "Token en YAML", "Usuario que hizo commit", "Service principal dedicado"], answer: 3, explanation: "Evita dependencia de identidad personal y aplica mínimo privilegio.", domain: "Implementing CI/CD" },
    ], sources: [source("Unity Catalog", "https://docs.databricks.com/aws/en/data-governance/unity-catalog/"), source("ABAC", "https://docs.databricks.com/aws/en/data-governance/unity-catalog/abac/"), source("Declarative Automation Bundles", "https://docs.databricks.com/aws/en/dev-tools/bundles/")],
  },

  m12: {
    lessons: [
      { summary: "El proyecto Associate comienza por criterios verificables, no por herramientas.", explanation: ["Define fuentes, SLA, consumidores, seguridad y aceptación.", "Traza cada requisito a componente, prueba y evidencia."], keyPoints: ["Criterios medibles", "Alcance explícito", "Trazabilidad"], example: { language: "YAML", title: "Aceptación", code: "acceptance:\n  freshness_minutes: 30\n  duplicate_order_ids: 0\n  valid_amount_ratio: 0.995", note: "Añade owner y respuesta al incumplimiento." }, pitfalls: ["Empezar por cluster", "SLA sin métrica"], examDecision: "Traduce primero el requisito; después selecciona servicio.", checkpoint: { question: "¿Qué convierte un objetivo en aceptación?", answer: "Una métrica, umbral y forma de comprobarla." } },
      { summary: "La arquitectura integra ingesta, transformación, gobierno y consumo con mínimo privilegio.", explanation: ["Usa UC como frontera, Delta como tabla y compute adecuado por workload.", "Aísla dev/prod y diseña replay antes de automatizar."], keyPoints: ["UC gobierna", "Delta persiste", "Compute se elige"], example: { language: "YAML", title: "Flujo", code: "flow: [volume, bronze_delta, silver_delta, gold_mv, sql_warehouse]\norchestrator: lakeflow_jobs", note: "Añade identidades y checkpoints." }, pitfalls: ["Credenciales en código", "Una copia por equipo"], examDecision: "Selecciona el componente que resuelve la restricción concreta.", checkpoint: { question: "¿Dónde aplicas permisos de tabla?", answer: "Unity Catalog." } },
      { summary: "La implementación debe ser idempotente, parametrizada y observable.", explanation: ["COPY INTO/Auto Loader ingiere, DataFrames conforman y Jobs coordina.", "Cada escritura se prueba con segundo run y datos inválidos."], keyPoints: ["Replay", "Parámetros", "Métricas"], example: { language: "SQL", title: "Control final", code: "SELECT count(*) rows, count(DISTINCT order_id) ids\nFROM main.silver.orders;", note: "Si grain no es pedido, usa la clave correcta." }, pitfalls: ["Validar solo happy path", "Append no idempotente"], examDecision: "Un retry seguro produce el mismo estado lógico.", checkpoint: { question: "¿Cómo demuestras idempotencia?", answer: "Repites la misma entrada y comparas estado y métricas." } },
      { summary: "Operación combina run history, Spark UI, alertas y runbook.", explanation: ["Run history localiza tarea; Spark UI diagnostica ejecución.", "Runbook define owner, reparación y escalado."], keyPoints: ["Señal correcta", "Repair selectivo", "Owner"], example: { language: "SQL", title: "Runs recientes", code: "SELECT * FROM system.lakeflow.job_run_timeline\nORDER BY period_start_time DESC LIMIT 20;", note: "Filtra workspace y job." }, pitfalls: ["Reejecutar todo", "Alerta sin acción"], examDecision: "Workflow fallido: run history; stage lento: Spark UI.", checkpoint: { question: "¿Dónde investigas skew?", answer: "En métricas por stage/tarea de Spark UI." } },
      { summary: "La preparación Associate se mide por dominio y capacidad de decidir en escenarios nuevos.", explanation: ["El blueprint vigente cubre plataforma, ingesta, transformación, Jobs, CI/CD, diagnóstico y gobierno.", "Un simulacro útil explica distractores y dirige repaso; no memoriza dumps."], keyPoints: ["Blueprint manda", "Repaso por dominio", "Sin dumps"], example: { language: "YAML", title: "Registro de preparación", code: "domains:\n  ingestion: 0.82\n  transformation: 0.76\n  jobs: 0.88\n  governance: 0.71", note: "Prioriza gobierno sin abandonar práctica integrada." }, pitfalls: ["Memorizar respuestas", "Ignorar dominio débil"], examDecision: "Compara todas las opciones con restricciones; descarta absolutos no justificados.", checkpoint: { question: "¿Es 80% la nota oficial?", answer: "No; es un indicador interno, no un umbral publicado por Databricks." } },
    ],
    lab: { title: "Capstone Associate: pedidos de landing a Gold", goal: "Entregar pipeline gobernado, reintentable y operable.", scenario: "JSON horario debe alimentar ventas diarias con SLA de 30 minutos y acceso de solo lectura para analistas.", steps: ["Define criterios y arquitectura", "Ingiere a Bronze", "Conforma Silver", "Publica Gold", "Orquesta y prueba fallo", "Entrega grants y runbook"], starterCode: "-- Entregables: bronze, silver, gold, job, grants, evidence\nCREATE SCHEMA IF NOT EXISTS main.learning;", solution: "COPY INTO main.learning.orders_bronze FROM '/Volumes/main/landing/orders' FILEFORMAT = JSON;\nCREATE OR REPLACE TABLE main.learning.orders_silver AS\nSELECT order_id, order_date, try_cast(amount AS DECIMAL(18,2)) amount\nFROM main.learning.orders_bronze WHERE order_id IS NOT NULL;\nCREATE OR REFRESH MATERIALIZED VIEW main.learning.daily_sales AS\nSELECT order_date, sum(amount) revenue FROM main.learning.orders_silver GROUP BY order_date;\nGRANT USE CATALOG ON CATALOG main TO `analysts`;\nGRANT USE SCHEMA ON SCHEMA main.learning TO `analysts`;\nGRANT SELECT ON TABLE main.learning.daily_sales TO `analysts`;\n-- Job: ingest -> validate -> publish; repair desde tarea fallida.", checks: [{ label: "Tres capas", pattern: "orders_bronze[\\s\\S]+orders_silver[\\s\\S]+daily_sales" }, { label: "Calidad", pattern: "order_id IS NOT NULL" }, { label: "Gobierno", pattern: "GRANT SELECT" }, { label: "Orquestación", pattern: "Job|job|repair" }], expectedEvidence: ["Segundo run sin duplicación lógica", "SLA y calidad medidos", "Captura del DAG/repair", "Grants efectivos y arquitectura"], cloudNotes: { AWS: "Landing en S3 gobernado por IAM role y Volume.", Azure: "Landing en ADLS Gen2 gobernado por managed identity.", GCP: "Landing en GCS gobernado por service account UC." } },
    quiz: [
      { question: "JSON horario creciente y alto volumen: ¿ingesta preferida?", options: ["Auto Loader", "collect", "Git", "VACUUM"], answer: 0, explanation: "Auto Loader descubre archivos incrementalmente con estado.", domain: "Data Ingestion and Loading" },
      { question: "¿Qué recupera tareas fallidas sin repetir éxitos?", options: ["RESTORE", "Repair run", "REVOKE", "OPTIMIZE"], answer: 1, explanation: "Repair actúa sobre subconjunto del DAG.", domain: "Working with Lakeflow Jobs" },
      { question: "¿Qué combinación da lectura mínima?", options: ["OWN", "MODIFY", "USE CATALOG + USE SCHEMA + SELECT", "ALL PRIVILEGES"], answer: 2, explanation: "Permite resolver ancestros y leer el objeto.", domain: "Governance and Security" },
      { question: "Una tarea Spark tiene una única partición extrema. ¿Primer diagnóstico?", options: ["Más permisos", "Nuevo catálogo", "Auto-stop", "Skew en Spark UI"], answer: 3, explanation: "La distribución desigual de tareas apunta a skew.", domain: "Troubleshooting, Monitoring, and Optimization" },
    ], sources: [source("Blueprint Associate 4-May-2026", "https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf"), source("Data engineering", "https://docs.databricks.com/aws/en/data-engineering"), source("Lakeflow Jobs", "https://docs.databricks.com/aws/en/jobs/")],
  },
};

const deepDives: Record<string, [LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive, LessonDeepDive]> = {
  ...deepDives01To04,
  ...deepDives05To08,
  ...deepDives09To12,
};

export const coreContent = Object.fromEntries(
  Object.entries(coreBase).map(([moduleId, pack]) => {
    const moduleDeepDives = deepDives[moduleId];
    if (!moduleDeepDives) throw new Error(`Missing deep-dive content for ${moduleId}`);

    return [
      moduleId,
      {
        ...pack,
        lessons: pack.lessons.map((lesson, index) => ({
          ...lesson,
          deepDive: moduleDeepDives[index],
        })) as ModuleContentPack["lessons"],
      },
    ];
  }),
) as Record<string, ModuleContentPack>;

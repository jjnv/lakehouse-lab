import type { ExamQuestionOrigin } from "./exam-augmentations";

export const PROFESSIONAL_EXAM_BLUEPRINT = {
  revision: "2025-11-30",
  itemCount: 59,
  sourceUrl:
    "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf",
  note: "Banco original de estudio: no reproduce preguntas reales ni retiradas del examen.",
} as const;

export const professionalExamDomains = [
  "Section 1: Developing Code for Data Processing using Python and SQL",
  "Section 2: Data Ingestion & Acquisition",
  "Section 3: Data Transformation, Cleansing, and Quality",
  "Section 4: Data Sharing and Federation",
  "Section 5: Monitoring and Alerting",
  "Section 6: Cost & Performance Optimisation",
  "Section 7: Ensuring Data Security and Compliance",
  "Section 8: Data Governance",
  "Section 9: Debugging and Deploying",
  "Section 10: Data Modelling",
] as const;

export type ProfessionalExamDomain = (typeof professionalExamDomains)[number];

export type ProfessionalExamQuestion = {
  id: `pro-${string}`;
  scenario: string;
  question: string;
  options: readonly [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  domain: ProfessionalExamDomain;
  moduleId: `m${string}`;
  sourceLabel?: string;
  sourceUrl?: string;
  origin?: ExamQuestionOrigin;
  originLabel?: string;
  officialSampleId?: string;
  augmentationMethod?: string;
};

export const professionalExamBank = [
  {
    id: "pro-001",
    scenario:
      "Un equipo mantiene un notebook de 1.800 líneas que lee tablas, transforma pedidos y publica resultados. Las pruebas solo pueden ejecutarse levantando el notebook completo y cada entorno requiere editar nombres de catálogo a mano.",
    question: "¿Qué refactorización ofrece la base más mantenible para un Declarative Automation Bundle (Asset Bundle en el blueprint)?",
    options: [
      "Duplicar el notebook para dev, test y prod y proteger cada copia con permisos de workspace.",
      "Extraer transformaciones puras a un paquete bajo src, dejar I/O y parámetros en una capa fina y declarar recursos y variables por target en el bundle.",
      "Convertir todas las celdas a SQL dinámico y guardar los catálogos en variables globales del notebook.",
      "Mover el notebook a una Git folder y usar siempre el catálogo prod para evitar diferencias entre entornos.",
    ],
    answer: 1,
    explanation:
      "Separar lógica pura, I/O y configuración permite pruebas unitarias sin ejecutar todo el workflow. Los targets del bundle cambian parámetros y recursos, mientras el mismo artefacto versionado se promociona entre entornos.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m28",
  },
  {
    id: "pro-002",
    scenario:
      "Una librería interna funciona en desarrollo con la versión más reciente de pandas, pero falla en producción dos semanas después porque el entorno resolvió una versión distinta de una dependencia transitiva.",
    question: "¿Qué estrategia reduce mejor esta deriva sin instalar dependencias manualmente en cada ejecución?",
    options: [
      "Ejecutar pip install --upgrade al principio del notebook para obtener siempre las versiones más nuevas.",
      "Adjuntar el repositorio fuente completo como archivo workspace y confiar en las librerías preinstaladas.",
      "Construir un wheel versionado, fijar dependencias compatibles y desplegar ese artefacto desde el bundle en todos los targets.",
      "Instalar la librería una vez en un clúster interactivo compartido y reutilizar indefinidamente ese clúster.",
    ],
    answer: 2,
    explanation:
      "Un wheel inmutable con versiones fijadas hace reproducible la resolución de dependencias. El bundle puede referenciar el mismo artefacto probado; actualizar todo en cada run o depender del estado de un clúster introduce variabilidad.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m28",
  },
  {
    id: "pro-003",
    scenario:
      "Una transformación aplica una Python UDF fila a fila para normalizar arrays de códigos. Query Profile muestra mucho tiempo en intercambio entre JVM y Python, y la misma regla puede expresarse con transform y regexp_replace.",
    question: "¿Cuál es el primer cambio técnico más apropiado?",
    options: [
      "Sustituir la UDF por funciones nativas de Spark SQL sobre arrays para conservar optimización y ejecución vectorizada cuando sea posible.",
      "Convertirla en una UDF escalar de Python registrada globalmente para que Catalyst inspeccione su cuerpo.",
      "Aumentar spark.sql.shuffle.partitions aunque la operación no produzca un shuffle.",
      "Persistir cada array como JSON y procesarlo en una segunda tarea Python de un solo nodo.",
    ],
    answer: 0,
    explanation:
      "Las funciones nativas son visibles para Catalyst y evitan la frontera de serialización de una Python UDF. Registrar la misma UDF no vuelve transparente su lógica, y aumentar particiones no corrige ese cuello de botella.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m23",
  },
  {
    id: "pro-004",
    scenario:
      "Una función transform añade columnas calculadas a un DataFrame. Un cambio accidental mantiene los valores esperados, pero convierte amount de decimal a double y altera el orden de dos columnas exigido por el contrato.",
    question: "¿Qué conjunto de pruebas detecta de forma explícita ambos tipos de regresión?",
    options: [
      "Comparar únicamente actual.count() con expected.count().",
      "Recoger la primera fila y comprobar que amount sea mayor que cero.",
      "Ejecutar explain y verificar que no aparezca Exchange.",
      "Usar assertDataFrameEqual para los datos y assertSchemaEqual para el contrato de esquema.",
    ],
    answer: 3,
    explanation:
      "La igualdad de filas no sustituye la comprobación del esquema. Las utilidades de testing de PySpark permiten expresar por separado expectativas sobre datos y tipos, nombres, nulabilidad y estructura.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m28",
  },
  {
    id: "pro-005",
    scenario:
      "Un job recibe una lista de regiones validada por una tarea inicial. Debe ejecutar el mismo notebook para cada región, con concurrencia limitada, y continuar después con una única tarea de consolidación.",
    question: "¿Qué diseño expresa mejor esa intención en Lakeflow Jobs?",
    options: [
      "Crear cien tareas fijas, una por región posible, y saltar desde el notebook las que no aparezcan en la lista.",
      "Publicar la lista como task value, consumirla en una tarea For each y hacer depender la consolidación de esa tarea.",
      "Lanzar hilos Python desde el driver y escribir manualmente el estado de cada región en DBFS.",
      "Crear un job distinto por región y programarlos todos a la misma hora sin dependencias.",
    ],
    answer: 1,
    explanation:
      "For each modela el fan-out dinámico, permite controlar la concurrencia y conserva cada iteración dentro del grafo observable. Un task value es el canal adecuado para transferir la lista pequeña producida aguas arriba.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m20",
  },
  {
    id: "pro-006",
    scenario:
      "El mismo bundle debe crear recursos con prefijo personal en desarrollo, usar un catálogo de integración en test y desplegar nombres estables bajo una identidad de servicio en producción.",
    question: "¿Cómo debe representarse esa variación sin mantener tres copias del bundle?",
    options: [
      "Definir targets con variables y sustituciones, aplicar el modo de desarrollo donde proceda y configurar run_as de producción explícitamente.",
      "Leer el nombre del usuario dentro de cada notebook y construir todos los nombres de recursos en tiempo de ejecución.",
      "Modificar databricks.yml en la rama principal antes de cada despliegue y revertirlo después.",
      "Usar un único target que despliegue simultáneamente en los tres workspaces.",
    ],
    answer: 0,
    explanation:
      "Los targets encapsulan las diferencias declarativas de entorno y las variables evitan duplicar recursos. La identidad de ejecución de prod debe quedar controlada por configuración, no inferida dentro del código.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m29",
  },
  {
    id: "pro-007",
    scenario:
      "Una transformación de streaming necesita llamar a un servicio externo con un protocolo propio, administrar una transacción por microbatch y escribir en un sink no soportado por Spark Declarative Pipelines en Lakeflow.",
    question: "¿Qué enfoque conserva el control requerido con el menor artificio?",
    options: [
      "Declarar una materialized view, porque todas las vistas materializadas admiten sinks externos.",
      "Usar COPY INTO con un trigger de diez segundos sobre el servicio remoto.",
      "Implementar Structured Streaming con foreachBatch, checkpoint estable e idempotencia explícita en el sink.",
      "Usar una tabla streaming declarativa y ejecutar la llamada remota dentro de una expectation.",
    ],
    answer: 2,
    explanation:
      "foreachBatch ofrece control por microbatch para integraciones no cubiertas por sinks gestionados. Ese control exige diseñar la operación externa para reintentos; una expectation no es un mecanismo de efectos laterales.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m13",
  },
  {
    id: "pro-008",
    scenario:
      "Una tarea de notebook llama a una API que cobra dos veces si se repite la petición. Todavía no existe una clave idempotente ni una comprobación previa fiable, y el equipo prefiere fallar y revisar antes que duplicar cargos.",
    question: "¿Qué configuración inmediata refleja esa política mientras se corrige el diseño?",
    options: [
      "Aumentar el número de workers para que la llamada termine antes del timeout.",
      "Configurar reintentos ilimitados con un intervalo creciente.",
      "Activar reparación automática de todas las tareas que ya tuvieron éxito.",
      "Establecer max_retries en 0 para esa tarea y alertar el fallo para intervención.",
    ],
    answer: 3,
    explanation:
      "Sin idempotencia, un retry automático puede repetir el efecto externo. Desactivar reintentos es un guardrail temporal; la solución estructural sigue siendo introducir una clave idempotente o una transacción verificable.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m20",
  },
  {
    id: "pro-009",
    scenario:
      "Un job efímero necesita una librería propia y dos paquetes de PyPI. Los desarrolladores quieren que cada run nazca limpio y que la versión de código quede asociada al despliegue que creó el job.",
    question: "¿Dónde debe declararse preferentemente esa dependencia de producción?",
    options: [
      "En una celda %pip ejecutada manualmente por el propietario cuando cambie el clúster.",
      "Como librería de la tarea o recurso del bundle, apuntando al wheel versionado y a versiones compatibles de PyPI.",
      "En el perfil local de Databricks CLI de cada desarrollador.",
      "En una variable global de un clúster interactivo que el job reutilice.",
    ],
    answer: 1,
    explanation:
      "Declarar librerías junto al recurso desplegado hace que infraestructura y código evolucionen de forma trazable. Las instalaciones manuales o el estado de un clúster compartido no son reproducibles.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m29",
  },
  {
    id: "pro-010",
    scenario:
      "Una función PySpark falla solo con un struct anidado que contiene arrays vacíos y nulos. El notebook mezcla lectura, lógica y escritura, por lo que el depurador obliga a reprocesar millones de filas para reproducir el error.",
    question: "¿Qué cambio reduce más el ciclo de diagnóstico?",
    options: [
      "Añadir display después de cada transformación y ejecutar siempre contra producción.",
      "Cachear todas las tablas de entrada antes de abrir el depurador.",
      "Aislar la transformación en una función, crear un DataFrame mínimo con el caso límite y depurarlo/probarlo localmente en la sesión.",
      "Convertir el struct a string para que cualquier esquema sea aceptado.",
    ],
    answer: 2,
    explanation:
      "Un caso mínimo y una transformación sin efectos laterales hacen reproducible el fallo y permiten usar pruebas y depuración sin una ejecución completa. Convertir a string oculta el contrato en lugar de corregirlo.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m28",
  },
  {
    id: "pro-011",
    scenario:
      "Un bucket recibe 40 millones de archivos JSON al mes. La ingesta debe descubrir solo objetos nuevos, conservar el esquema inferido entre ejecuciones y reanudarse sin volver a procesar el histórico.",
    question: "¿Qué configuración cubre esas tres necesidades?",
    options: [
      "Auto Loader con una schemaLocation durable y una checkpointLocation exclusiva para la consulta.",
      "spark.read.json sobre todo el prefijo seguido de dropDuplicates en memoria.",
      "COPY INTO sin tabla destino y con force=true en cada ejecución.",
      "Una lectura binaryFile que use el tamaño del objeto como identificador único.",
    ],
    answer: 0,
    explanation:
      "Auto Loader mantiene estado escalable de descubrimiento; schemaLocation persiste la evolución inferida y el checkpoint conserva progreso y commits de la consulta. Deben ubicarse en almacenamiento durable y no compartirse entre consultas distintas.",
    domain: "Section 2: Data Ingestion & Acquisition",
    moduleId: "m09",
  },
  {
    id: "pro-012",
    scenario:
      "Un pipeline debe ingerir imágenes médicas sin interpretarlas todavía, conservando bytes, ruta, longitud y fecha de modificación para una etapa posterior de extracción.",
    question: "¿Qué fuente de Spark se ajusta mejor al primer paso?",
    options: [
      "csv con inferSchema=true y una columna de tipo BINARY.",
      "text, porque mantiene automáticamente los bytes originales de cualquier archivo.",
      "binaryFile, que expone contenido y metadatos del objeto como columnas.",
      "parquet, después de renombrar la extensión de cada imagen.",
    ],
    answer: 2,
    explanation:
      "La fuente binaryFile lee cada archivo como un registro con content y metadatos como path, length y modificationTime. text decodifica texto y no conserva de forma general el contenido binario original.",
    domain: "Section 2: Data Ingestion & Acquisition",
    moduleId: "m08",
  },
  {
    id: "pro-013",
    scenario:
      "Una consulta lee Kafka y escribe eventos normalizados en Delta. Tras una caída, algunos mensajes pueden volver a presentarse desde el checkpoint y el negocio no tolera dos pedidos con el mismo event_id.",
    question: "¿Qué diseño aborda la garantía de extremo a extremo?",
    options: [
      "Confiar solo en enable.auto.commit de Kafka y eliminar el checkpoint.",
      "Usar processingTime=1 second, porque microbatches más frecuentes eliminan duplicados.",
      "Añadir más particiones al topic sin cambiar la lógica del sink.",
      "Mantener un checkpoint estable y hacer idempotente la escritura Delta con event_id y una deduplicación acotada o MERGE determinista.",
    ],
    answer: 3,
    explanation:
      "Los offsets recuperables evitan perder progreso, pero la garantía de negocio también depende del sink. Una clave estable y una escritura idempotente absorben la repetición posible sin confundir frecuencia de trigger con semántica de entrega.",
    domain: "Section 2: Data Ingestion & Acquisition",
    moduleId: "m15",
  },
  {
    id: "pro-014",
    scenario:
      "Una tabla PostgreSQL de 800 GB se lee por JDBC con una sola partición y satura un único core. Existe una columna numérica id creciente y la base admite ocho conexiones concurrentes sin afectar al sistema transaccional.",
    question: "¿Qué ajuste paraleliza de forma controlada la lectura?",
    options: [
      "Aumentar spark.sql.shuffle.partitions a 8 después de terminar la lectura.",
      "Configurar partitionColumn=id, lowerBound, upperBound y numPartitions=8, validando antes la distribución y capacidad del origen.",
      "Ejecutar ocho lecturas completas y aplicar union seguida de distinct.",
      "Ordenar la tabla remota por id y usar coalesce(8) en Spark.",
    ],
    answer: 1,
    explanation:
      "Las opciones JDBC dividen el rango en varias conexiones; los límites calculan los strides, no son filtros de filas. Deben elegirse considerando skew y el máximo de conexiones aceptable para la base fuente.",
    domain: "Section 2: Data Ingestion & Acquisition",
    moduleId: "m08",
  },
  {
    id: "pro-015",
    scenario:
      "Cada noche llegan archivos cerrados al landing. Se necesita procesar toda la llegada pendiente, detener el compute al finalizar y dejar una tabla bronze append-only que mañana continúe desde el estado anterior.",
    question: "¿Qué patrón ofrece comportamiento incremental con coste acotado?",
    options: [
      "Auto Loader en Structured Streaming con trigger availableNow, checkpoint durable y append a Delta bronze.",
      "Un stream continuo sin auto-stop aunque el landing permanezca vacío casi todo el día.",
      "Sobrescribir bronze completa cada noche y reconstruir el historial desde cero.",
      "Leer todos los archivos con batch y confiar solo en dropDuplicates sin persistir progreso.",
    ],
    answer: 0,
    explanation:
      "availableNow procesa el backlog disponible de forma incremental y termina. El checkpoint conserva qué archivos y offsets se comprometieron, mientras Delta mantiene la bronze append-only para replay y auditoría.",
    domain: "Section 2: Data Ingestion & Acquisition",
    moduleId: "m13",
  },
  {
    id: "pro-016",
    scenario:
      "Una tabla de eventos contiene varias revisiones por business_key. Dos revisiones pueden compartir updated_at, pero source_sequence es único y creciente dentro de cada clave.",
    question: "¿Cómo se selecciona de forma determinista la revisión vigente?",
    options: [
      "Aplicar distinct a todas las columnas y conservar la primera fila que devuelva Spark.",
      "Agrupar por business_key y tomar max(updated_at), sin recuperar el resto de columnas.",
      "Usar row_number sobre una ventana por business_key ordenada por updated_at DESC y source_sequence DESC, y filtrar row_number=1.",
      "Ordenar globalmente por updated_at y ejecutar dropDuplicates sin especificar partición.",
    ],
    answer: 2,
    explanation:
      "row_number permite definir partición y desempate total. Solo max(timestamp) pierde las columnas asociadas y un dropDuplicates sin orden determinista puede elegir revisiones distintas entre ejecuciones.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m04",
  },
  {
    id: "pro-017",
    scenario:
      "Un DataFrame de 9 TB de transacciones debe conservar únicamente filas cuyo customer_id exista en una lista gobernada de clientes activos. No se necesita ninguna columna de la lista.",
    question: "¿Qué operación expresa mejor la intención y evita ensanchar innecesariamente el resultado?",
    options: [
      "Un cross join seguido de un filtro de igualdad.",
      "Un left_semi join por customer_id.",
      "Un full_outer join y un filtro de nulos.",
      "Un unionByName seguido de dropDuplicates.",
    ],
    answer: 1,
    explanation:
      "El left semi join implementa una prueba de existencia y devuelve solo columnas del lado izquierdo. Evita materializar columnas del lookup y comunica al optimizador exactamente la semántica requerida.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m04",
  },
  {
    id: "pro-018",
    scenario:
      "Un dataset contiene una columna items con arrays de structs. Se requiere una fila por artículo, pero los pedidos cuyo array esté vacío o sea nulo deben seguir apareciendo para una reconciliación posterior.",
    question: "¿Qué transformación satisface la cardinalidad y conserva esos pedidos?",
    options: [
      "explode(items), porque genera automáticamente una fila nula para arrays vacíos.",
      "flatten(items), porque convierte cada struct en una fila nueva.",
      "collect_list(items) seguido de distinct.",
      "explode_outer(items), conservando las columnas de pedido y admitiendo item nulo.",
    ],
    answer: 3,
    explanation:
      "explode_outer mantiene una fila cuando la colección es nula o vacía, a diferencia de explode. Esto permite reconciliar el pedido aunque todavía no tenga líneas válidas.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m04",
  },
  {
    id: "pro-019",
    scenario:
      "Una regla de calidad compara country_code con un valor maestro. En ambos lados, null significa “no informado” y debe considerarse coincidencia solo para esta validación; el operador = devuelve unknown.",
    question: "¿Qué comparación evita lógica manual de casos nulos?",
    options: [
      "Usar igualdad null-safe, <=> en SQL o eqNullSafe en PySpark.",
      "Rellenar todos los null con una cadena vacía en las tablas fuente de forma permanente.",
      "Filtrar los null antes de comparar y asumir que eran válidos.",
      "Convertir las columnas a boolean y aplicar AND.",
    ],
    answer: 0,
    explanation:
      "La igualdad null-safe devuelve true para null frente a null y false cuando solo un lado es null. Evita introducir un sentinel que podría colisionar con datos reales o alterar permanentemente el modelo.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m04",
  },
  {
    id: "pro-020",
    scenario:
      "En un pipeline declarativo, el 0,3 % de pedidos llega con importe negativo. El equipo debe publicar de inmediato los registros válidos, conservar los inválidos con motivo de rechazo y medir la tasa por actualización.",
    question: "¿Qué patrón ofrece mejor trazabilidad que descartar silenciosamente?",
    options: [
      "Aplicar EXPECT OR DROP y no conservar ninguna copia de las filas descartadas.",
      "Aplicar EXPECT OR FAIL para detener todos los pedidos hasta que el origen corrija cada fila.",
      "Evaluar una regla común, enrutar válidos al dataset principal e inválidos a una tabla de cuarentena, y consultar métricas/event log.",
      "Cambiar amount a string para que cualquier valor pase la validación.",
    ],
    answer: 2,
    explanation:
      "La cuarentena preserva evidencia y permite remediación sin bloquear datos buenos. La misma condición debe gobernar ambos caminos y las métricas del pipeline permiten vigilar el porcentaje de incumplimiento.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m19",
  },
  {
    id: "pro-021",
    scenario:
      "Un MERGE recibe accidentalmente dos filas fuente para la misma clave destino y ambas satisfacen la condición de actualización. Cada fila tiene ingest_sequence y event_ts.",
    question: "¿Qué preprocesamiento hace el resultado reproducible antes del MERGE?",
    options: [
      "Aumentar el tamaño del clúster para que Delta resuelva el conflicto más rápido.",
      "Canonicalizar la fuente a una fila por clave con un orden total por event_ts e ingest_sequence, y validar unicidad.",
      "Ejecutar MERGE dos veces; la segunda ejecución elegirá la fila correcta.",
      "Eliminar la condición ON y actualizar todas las filas destino.",
    ],
    answer: 1,
    explanation:
      "Un MERGE necesita una fuente no ambigua para cada coincidencia de destino. Deduplicar con criterio determinista y comprobar la unicidad evita resultados dependientes del orden o errores por múltiples matches.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m06",
  },
  {
    id: "pro-022",
    scenario:
      "Una agregación de sesiones recibe eventos hasta 20 minutos tarde. El equipo añade un watermark de 20 minutos, pero agrupa solo por user_id y mantiene el stream durante meses.",
    question: "¿Por qué el estado puede seguir creciendo y cuál es la corrección conceptual?",
    options: [
      "Porque todo watermark duplica el estado; hay que eliminarlo y usar complete mode.",
      "Porque user_id debe convertirse a double antes de agrupar.",
      "Porque los checkpoints impiden liberar cualquier clave; hay que crear uno nuevo cada día.",
      "Porque una agregación sin ventana temporal no proporciona un límite temporal para cerrar claves; debe incorporarse una ventana de event time compatible con el SLA.",
    ],
    answer: 3,
    explanation:
      "El watermark por sí solo no convierte una agregación global por clave en estado acotado. Una ventana de event time permite que el motor determine cuándo un resultado puede considerarse final y limpiar estado antiguo.",
    domain: "Section 3: Data Transformation, Cleansing, and Quality",
    moduleId: "m14",
  },
  {
    id: "pro-023",
    scenario:
      "Dos unidades de una misma empresa usan workspaces y metastores distintos. El productor quiere conceder acceso a tablas Delta actualizadas sin copiar archivos ni emitir credenciales permanentes de almacenamiento al consumidor Databricks.",
    question: "¿Qué mecanismo es el ajuste natural?",
    options: [
      "Databricks-to-Databricks OpenSharing —Delta Sharing en el blueprint—, publicando un share y autorizando al recipient correspondiente.",
      "Exportar CSV cada noche a un bucket público y enviar la ruta por correo.",
      "Crear una Lakehouse Federation desde el productor hacia el metastore del consumidor.",
      "Hacer DEEP CLONE diaria de cada tabla en el workspace consumidor.",
    ],
    answer: 0,
    explanation:
      "D2D Sharing permite al receptor acceder a datos compartidos gobernados y actuales sin mantener una copia de intercambio. Federation sirve para consultar sistemas externos compatibles, no para sustituir el protocolo de compartición entre proveedores y receptores.",
    domain: "Section 4: Data Sharing and Federation",
    moduleId: "m31",
  },
  {
    id: "pro-024",
    scenario:
      "Un socio usa un motor que no es Databricks pero admite clientes OpenSharing —Delta Sharing en el blueprint—. Debe leer solo dos vistas aprobadas y el proveedor necesita revocar el acceso sin cambiar permisos internos de los analistas.",
    question: "¿Qué diseño corresponde a ese consumidor?",
    options: [
      "Databricks-to-Databricks sharing, aunque el socio no disponga de un workspace Databricks.",
      "Conceder al socio SELECT directo sobre el catálogo interno y acceso a la consola cloud.",
      "Montar el almacenamiento del proveedor en el sistema del socio con una clave de cuenta compartida.",
      "Databricks-to-Open OpenSharing con un recipient externo, autenticación gestionada y un share limitado a los objetos aprobados.",
    ],
    answer: 3,
    explanation:
      "El protocolo abierto está diseñado para clientes externos compatibles. El share define el mínimo conjunto de datos y el recipient separa la identidad/revocación del consumidor de los permisos internos del workspace.",
    domain: "Section 4: Data Sharing and Federation",
    moduleId: "m31",
  },
  {
    id: "pro-025",
    scenario:
      "Finanzas necesita consultar unas pocas tablas de una base operacional soportada, con frescura de minutos y bajo volumen. Duplicar toda la base en Delta añadiría una canalización que el equipo no quiere operar.",
    question: "¿Cuándo es Lakehouse Federation una elección razonable?",
    options: [
      "Cuando se requiere entrenamiento masivo repetitivo aunque la base origen no soporte la carga.",
      "Cuando la consulta puede aprovechar pushdown, el origen tolera la demanda y se prefiere acceso gobernado sin copia inicial.",
      "Cuando se necesita escribir cualquier transformación Spark de vuelta al sistema remoto con garantías Delta.",
      "Cuando se desea eliminar por completo las credenciales y permisos del sistema fuente.",
    ],
    answer: 1,
    explanation:
      "Federation encaja en acceso de baja o moderada frecuencia donde el pushdown y la capacidad del origen son suficientes. Para ETL intensivo, aislamiento o rendimiento repetible suele ser mejor ingerir una copia gobernada.",
    domain: "Section 4: Data Sharing and Federation",
    moduleId: "m31",
  },
  {
    id: "pro-026",
    scenario:
      "Un equipo crea un foreign catalog hacia una base corporativa. La contraseña está escrita en cada notebook y todos los usuarios reutilizan una cuenta remota con privilegios de administrador.",
    question: "¿Qué cambio alinea la federación con un perímetro gobernado?",
    options: [
      "Copiar la contraseña a un widget oculto de cada notebook.",
      "Conceder CAN EDIT sobre los notebooks solo a administradores y mantener la cuenta remota.",
      "Crear una connection gobernada con credencial dedicada de mínimo privilegio, controlar su uso en Unity Catalog y exponer solo los objetos necesarios.",
      "Guardar la contraseña en una tabla Delta accesible por el grupo de ingeniería.",
    ],
    answer: 2,
    explanation:
      "La connection centraliza la credencial y permite gobernar quién puede usarla. La identidad remota también debe tener permisos mínimos; ocultar texto en un notebook no elimina la proliferación de secretos ni el exceso de privilegios.",
    domain: "Section 4: Data Sharing and Federation",
    moduleId: "m31",
  },
  {
    id: "pro-027",
    scenario:
      "El coste diario de un pipeline se duplicó, pero el número de filas solo creció un 8 %. El equipo necesita atribuir el aumento a un job, SKU y propietario antes de cambiar compute.",
    question: "¿Qué investigación produce evidencia útil de coste y ejecución?",
    options: [
      "Revisar únicamente DESCRIBE HISTORY de la tabla de salida.",
      "Consultar system.billing.usage por intervalo, SKU y custom tags, y correlacionar el recurso con las ejecuciones de Lakeflow y sus tiempos.",
      "Contar notebooks en la Git folder del equipo.",
      "Activar cache en todas las tablas sin medir el consumo previo.",
    ],
    answer: 1,
    explanation:
      "La system table de billing permite atribuir uso con metadatos y etiquetas. Cruzar temporalmente ese consumo con runs evita confundir crecimiento de datos, reintentos, cambio de SKU o compute ocioso.",
    domain: "Section 5: Monitoring and Alerting",
    moduleId: "m25",
  },
  {
    id: "pro-028",
    scenario:
      "Una consulta ejecutada en un SQL warehouse tarda 11 minutos. El equipo quiere saber qué operador concentra el tiempo, cuántas filas atraviesan cada nodo y si el join está provocando shuffle.",
    question: "¿Qué superficie debe consultar primero?",
    options: [
      "Query Profile de la consulta, inspeccionando operadores, métricas y grafo de ejecución.",
      "El historial de Git de la definición del dashboard.",
      "La lista de secretos del workspace.",
      "El event log de un pipeline declarativo no relacionado.",
    ],
    answer: 0,
    explanation:
      "Query Profile está orientado a descomponer una consulta SQL por operadores y métricas. Spark UI puede complementar cargas Spark, pero logs de Git, secretos o un pipeline ajeno no localizan el cuello de esa consulta.",
    domain: "Section 5: Monitoring and Alerting",
    moduleId: "m26",
  },
  {
    id: "pro-029",
    scenario:
      "Un pipeline declarativo finaliza en verde, pero la tabla publicada contiene 18 % menos filas. Se usa una expectation que descarta registros inválidos y no existe un dashboard de calidad.",
    question: "¿Qué señal explica directamente la pérdida sin convertirla en fallo de infraestructura?",
    options: [
      "El número de commits de la Git folder durante el día.",
      "El uso total de DBU de todos los workspaces de la cuenta.",
      "La cantidad de archivos en el directorio del checkpoint.",
      "Las métricas de expectations y eventos de flujo del event log del pipeline.",
    ],
    answer: 3,
    explanation:
      "El event log registra eventos y métricas del pipeline, incluidas acciones de calidad. Un run correcto puede descartar filas de acuerdo con la política; por eso éxito operativo y calidad del dato deben observarse por separado.",
    domain: "Section 5: Monitoring and Alerting",
    moduleId: "m19",
  },
  {
    id: "pro-030",
    scenario:
      "Una tabla gold contiene un indicador quality_failure_rate calculado cada quince minutos. Operaciones quiere aviso cuando supere 2 %, mientras que el propietario del workflow también necesita conocer fallos y ejecuciones demasiado largas.",
    question: "¿Qué combinación separa correctamente las dos clases de señal?",
    options: [
      "Una única alerta por uso de CPU para datos y workflow.",
      "Un trigger por llegada de archivos para ambas condiciones.",
      "Una SQL Alert sobre la consulta del indicador y notificaciones del job para estado o duración de runs.",
      "Un print en el notebook y revisión manual semanal.",
    ],
    answer: 2,
    explanation:
      "La SQL Alert evalúa una condición sobre datos; las notificaciones del job cubren el ciclo de vida y rendimiento de la ejecución. Separarlas mejora ownership, severidad y capacidad de respuesta.",
    domain: "Section 5: Monitoring and Alerting",
    moduleId: "m21",
  },
  {
    id: "pro-031",
    scenario:
      "Un servicio de operaciones consulta miles de runs mediante la Jobs API. Solo lee la primera respuesta, concluye que no existen fallos antiguos y a veces marca como terminado un run aún en estado transitorio.",
    question: "¿Qué debe corregirse en el cliente?",
    options: [
      "Solicitar siempre un límite de una sola ejecución para evitar estados inconsistentes.",
      "Implementar paginación y polling con backoff hasta un estado terminal, inspeccionando también estados de tareas.",
      "Sustituir los identificadores de run por nombres de notebook.",
      "Reparar automáticamente todos los runs mientras estén en RUNNING.",
    ],
    answer: 1,
    explanation:
      "Las APIs de listado pueden paginar y el estado del run evoluciona. Un monitor robusto consume todas las páginas relevantes, respeta límites con backoff y distingue estados de ciclo de vida y resultado a nivel de run y tarea.",
    domain: "Section 5: Monitoring and Alerting",
    moduleId: "m26",
  },
  {
    id: "pro-032",
    scenario:
      "Cientos de tablas managed reciben MERGE y DELETE frecuentes. El equipo mantiene cron jobs propios para compactación, estadísticas y VACUUM, pero se solapan, fallan y consumen guardias operativas.",
    question: "¿Qué capacidad reduce esa carga de mantenimiento cuando está disponible para esas tablas?",
    options: [
      "Convertir todas las tablas en external y desactivar el historial Delta.",
      "Ejecutar OPTIMIZE después de cada microbatch, incluso cuando no hay cambios.",
      "Habilitar predictive optimization para que Databricks programe operaciones de mantenimiento apropiadas en tablas managed.",
      "Vaciar manualmente el transaction log al terminar cada job.",
    ],
    answer: 2,
    explanation:
      "Predictive optimization automatiza mantenimiento como OPTIMIZE, VACUUM y actualización de estadísticas donde corresponda. Las tablas managed permiten a la plataforma asumir más responsabilidad operativa sin romper el transaction log.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m24",
  },
  {
    id: "pro-033",
    scenario:
      "Una tabla de eventos de 120 TB se filtra hoy por customer_id y event_date, pero el equipo prevé añadir region y device_type. customer_id tiene cardinalidad muy alta y particionar por él produciría millones de directorios pequeños.",
    question: "¿Qué layout ofrece mejor capacidad de adaptación?",
    options: [
      "Usar liquid clustering con un conjunto pequeño de claves relevantes y revisar esas claves conforme cambie el patrón de consulta.",
      "Particionar físicamente por customer_id, region, device_type y cada columna futura.",
      "Crear una tabla completa por cliente.",
      "Ordenar una vez el DataFrame antes de escribir y asumir que el orden global se conservará para siempre.",
    ],
    answer: 0,
    explanation:
      "Liquid clustering evita el esquema rígido de directorios y permite evolucionar las claves sin reescribir inmediatamente todos los datos existentes. Una clave de altísima cardinalidad suele ser mala partición tradicional.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m24",
  },
  {
    id: "pro-034",
    scenario:
      "Una tabla de 30 TB recibe borrados selectivos de pocas filas repartidas por muchos archivos. Reescribir cada archivo completo hace que el mantenimiento nocturno exceda su ventana.",
    question: "¿Qué ventaja aportan deletion vectors en este patrón?",
    options: [
      "Eliminan inmediatamente los archivos físicos y todo su historial sin necesidad de VACUUM.",
      "Permiten marcar filas eliminadas sin reescribir de inmediato cada archivo de datos, difiriendo la materialización física a operaciones posteriores.",
      "Convierten automáticamente cualquier tabla Parquet no Delta en una tabla streaming.",
      "Evitan comprobar compatibilidad de protocolo con cualquier lector externo.",
    ],
    answer: 1,
    explanation:
      "Deletion vectors representan borrados lógicos y pueden acelerar DML selectivo al evitar reescrituras inmediatas. Siguen existiendo consideraciones de mantenimiento, retención y compatibilidad de clientes/protocolo.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m24",
  },
  {
    id: "pro-035",
    scenario:
      "Query Profile muestra que una consulta escanea casi todos los archivos de una tabla aunque filtra por account_id y event_date. No hay skew relevante y el tiempo está dominado por bytes leídos.",
    question: "¿Cuál es la intervención guiada por esa evidencia?",
    options: [
      "Subir spark.sql.shuffle.partitions, aunque el perfil no muestre shuffle dominante.",
      "Forzar broadcast de la tabla grande.",
      "Cambiar todas las columnas string a binary sin revisar consumidores.",
      "Mejorar el layout y las estadísticas para esas columnas —por ejemplo con liquid clustering— y volver a medir data skipping.",
    ],
    answer: 3,
    explanation:
      "La señal apunta a pruning/data skipping deficiente, no a paralelismo de shuffle. Organizar los datos alrededor de filtros selectivos y mantener estadísticas permite omitir archivos; después debe comprobarse el cambio en el perfil.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m24",
  },
  {
    id: "pro-036",
    scenario:
      "En un sort-merge join, una sola clave “UNKNOWN” concentra 38 % de las filas. Spark UI muestra una tarea 40 veces más lenta que la mediana mientras las demás terminan pronto.",
    question: "¿Qué respuesta ataca primero la causa observada?",
    options: [
      "Desactivar AQE y reducir el número de executors a uno.",
      "Añadir cache a la tabla de salida después del join.",
      "Activar/verificar skew join de AQE y, si no basta, separar o salar la clave sesgada preservando la semántica.",
      "Aplicar coalesce(1) antes del join para concentrar todas las claves por igual.",
    ],
    answer: 2,
    explanation:
      "La larga cola por una clave dominante es skew. AQE puede dividir particiones sesgadas; casos extremos requieren tratamiento explícito como separar la clave o salting con recomposición correcta.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m23",
  },
  {
    id: "pro-037",
    scenario:
      "Un workload corre sobre Photon, pero el tramo más lento ejecuta una Python UDF compleja. Aumentar nodos reduce poco el tiempo y el perfil muestra la frontera Python como dominante.",
    question: "¿Qué optimización tiene mayor probabilidad de aprovechar el motor vectorizado?",
    options: [
      "Reescribir la regla con expresiones SQL/PySpark nativas soportadas y comparar el plan antes y después.",
      "Registrar la misma Python UDF con un nombre más corto.",
      "Convertir el resultado de la UDF a JSON antes de escribir.",
      "Desactivar Photon para que la UDF deje de aparecer en el perfil.",
    ],
    answer: 0,
    explanation:
      "Photon acelera operadores soportados, pero no puede optimizar el cuerpo opaco de una Python UDF. Expresar la lógica con funciones nativas puede eliminar serialización y ampliar la porción ejecutable por el motor.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m23",
  },
  {
    id: "pro-038",
    scenario:
      "Un pipeline batch tarda doce minutos cada hora y mantiene un clúster all-purpose encendido permanentemente. No necesita estado en memoria entre ejecuciones y el equipo acepta el perfil funcional de serverless.",
    question: "¿Qué cambio reduce probablemente el coste ocioso sin sacrificar la cadencia?",
    options: [
      "Duplicar el clúster all-purpose para que siempre haya uno de reserva.",
      "Mantener el clúster actual y desactivar auto-termination.",
      "Convertir el batch en un stream continuo que no se detenga nunca.",
      "Ejecutar el job en compute serverless o efímero adecuado y validar duración, límites y coste con system tables.",
    ],
    answer: 3,
    explanation:
      "Un recurso efímero elimina gran parte del tiempo ocioso de un clúster interactivo permanente. La decisión debe verificarse con SLA y consumo real, no solo con el precio nominal de una DBU.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m25",
  },
  {
    id: "pro-039",
    scenario:
      "Analistas regionales consultan la misma tabla customers. Cada grupo debe ver solo su región y el email debe aparecer parcialmente oculto salvo para el equipo de fraude. La lógica debe aplicarse a cualquier herramienta que consulte la tabla.",
    question: "¿Qué control centralizado responde mejor al requisito?",
    options: [
      "Crear una copia física de la tabla por usuario y sincronizarla cada noche.",
      "Aplicar un row filter para región y una column mask para email, con funciones y permisos gobernados en Unity Catalog.",
      "Ocultar las columnas en el explorador de catálogos, sin cambiar permisos de consulta.",
      "Pedir a cada dashboard que incluya su propio WHERE y regexp_replace.",
    ],
    answer: 1,
    explanation:
      "Los filtros de fila y máscaras de columna se aplican en el acceso a la tabla y no dependen de que cada consumidor recuerde la regla. Las funciones deben diseñarse y gobernarse cuidadosamente para conservar mínimo privilegio.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
  },
  {
    id: "pro-040",
    scenario:
      "Ciencia de datos necesita unir eventos de un cliente a lo largo del tiempo, pero no debe recibir su customer_id real. Cumplimiento exige que un servicio autorizado pueda revertir la sustitución durante una investigación.",
    question: "¿Qué técnica encaja mejor que un hash irreversible sin clave?",
    options: [
      "Suprimir toda la fila y reemplazarla por null.",
      "Generalizar customer_id redondeándolo al millar más cercano.",
      "Tokenizar el identificador mediante un servicio controlado que mantenga la correspondencia y separe las claves de los datos analíticos.",
      "Publicar el customer_id en texto claro y confiar en una cláusula contractual.",
    ],
    answer: 2,
    explanation:
      "La tokenización puede conservar estabilidad para joins y reversibilidad bajo controles específicos. Un hash simple puede ser atacable y no ofrece reversión autorizada; supresión o generalización no cumplen la necesidad de vinculación exacta.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
  },
  {
    id: "pro-041",
    scenario:
      "Una solicitud válida exige eliminar un sujeto de tablas Delta productivas y evitar que reaparezca desde bronze, Change Data Feed, checkpoints o reejecuciones. El equipo propone solo ejecutar DELETE en la tabla gold.",
    question: "¿Qué plan aborda el ciclo de vida completo?",
    options: [
      "Localizar el sujeto en todas las capas y derivados, impedir su replay, ejecutar borrados gobernados y aplicar retención/VACUUM según política y restricciones legales verificadas.",
      "Borrar la vista gold; los archivos y tablas subyacentes desaparecerán automáticamente.",
      "Cambiar el nombre de la columna identificadora para que el sujeto ya no pueda encontrarse.",
      "Ejecutar RESTORE a una versión anterior a la llegada del sujeto sin considerar datos posteriores.",
    ],
    answer: 0,
    explanation:
      "La purga debe abarcar fuentes, capas, derivados, mecanismos de replay y retención física. DELETE en una salida no evita que un backfill regenere los datos, y VACUUM debe respetar la política aprobada y dependencias como CDF o time travel.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
  },
  {
    id: "pro-042",
    scenario:
      "Un usuario tiene CAN EDIT sobre un notebook que contiene SELECT * FROM main.finance.payroll, pero Unity Catalog no le concede USE CATALOG, USE SCHEMA ni SELECT sobre la tabla.",
    question: "¿Qué resultado de seguridad debe esperarse al ejecutar el notebook con su identidad?",
    options: [
      "CAN EDIT hereda automáticamente SELECT sobre cualquier tabla mencionada en el notebook.",
      "El notebook ejecuta la consulta, pero enmascara todas las columnas sin configuración adicional.",
      "El permiso del workspace sustituye a Unity Catalog solo durante la primera ejecución.",
      "La consulta falla por falta de privilegios de datos; los ACL del objeto workspace no conceden acceso a la tabla.",
    ],
    answer: 3,
    explanation:
      "Los permisos para editar un notebook y los privilegios sobre securables son controles distintos. El usuario necesita los privilegios aplicables en el catálogo/esquema y SELECT sobre la tabla o una vía autorizada equivalente.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
  },
  {
    id: "pro-043",
    scenario:
      "Un stream de solicitudes puede incluir PII en campos de texto libre. Silver alimenta a muchos consumidores y el requisito establece que ningún registro sin clasificar llegue a esa capa, pero los casos dudosos no deben perderse.",
    question: "¿Qué arquitectura cumple mejor la frontera de privacidad?",
    options: [
      "Publicar primero en silver y ejecutar una máscara semanal sobre las filas ya consumidas.",
      "Detectar y clasificar antes de publicar, transformar o enmascarar los casos válidos, cuarentenar los dudosos y registrar métricas y lineage.",
      "Descartar todos los textos libres sin conservar evidencia ni razón.",
      "Confiar únicamente en que los usuarios no seleccionen la columna sensible.",
    ],
    answer: 1,
    explanation:
      "El control debe estar antes de la frontera de consumo. Separar casos dudosos permite revisión sin exposición ni pérdida silenciosa, y las métricas demuestran que el control opera tanto en batch como en streaming.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
  },
  {
    id: "pro-044",
    scenario:
      "El grupo sales_readers debe consultar todas las tablas actuales y futuras de main.sales, pero no otras schemas del catálogo main. Hoy se conceden permisos tabla por tabla y las nuevas publicaciones fallan para los lectores.",
    question: "¿Qué uso de herencia simplifica el modelo?",
    options: [
      "Conceder SELECT sobre el metastore completo y confiar en convenciones de nombres.",
      "Dar ownership de main a cada miembro de sales_readers.",
      "Conceder los privilegios de uso necesarios y SELECT en el schema main.sales al grupo, aprovechando la herencia hacia sus objetos.",
      "Conceder CAN MANAGE sobre todos los SQL warehouses de la cuenta.",
    ],
    answer: 2,
    explanation:
      "Un grant en el schema puede heredarse por los objetos subordinados y evita mantener listas de tablas. Deben incluirse los privilegios USE aplicables sin ampliar el acceso a schemas no relacionados.",
    domain: "Section 8: Data Governance",
    moduleId: "m30",
  },
  {
    id: "pro-045",
    scenario:
      "El buscador de datos muestra docenas de tablas llamadas customer_final_v2 sin descripción, propietario funcional ni clasificación. Los analistas abren tickets para saber cuál es fiable y qué columnas contienen PII.",
    question: "¿Qué mejora aumenta directamente descubribilidad y gobierno?",
    options: [
      "Añadir comentarios claros a tablas y columnas, ownership y tags gobernados de dominio/sensibilidad sin almacenar secretos en metadata.",
      "Renombrar todas las tablas a data y ocultarlas del catálogo.",
      "Conceder SELECT global para que cada usuario explore el contenido completo.",
      "Copiar la documentación a una hoja personal sin enlazarla con los objetos.",
    ],
    answer: 0,
    explanation:
      "Metadata junto al objeto mejora búsqueda, comprensión y aplicación de políticas. Las etiquetas deben seguir una taxonomía gobernada y nunca contener valores sensibles o credenciales.",
    domain: "Section 8: Data Governance",
    moduleId: "m30",
  },
  {
    id: "pro-046",
    scenario:
      "Una plataforma crea cientos de tablas nuevas y el equipo no quiere administrar rutas, limpieza de archivos huérfanos y mantenimiento por separado. No existe requisito de que otra plataforma escriba directamente en esas ubicaciones.",
    question: "¿Qué tipo de tabla reduce el overhead operativo y conserva gobierno central?",
    options: [
      "Tablas external con una ruta distinta creada manualmente por cada desarrollador.",
      "Vistas temporales de sesión como almacenamiento productivo.",
      "Archivos Parquet sin registro en catálogo.",
      "Tablas managed de Unity Catalog, dejando a la plataforma gestionar ubicación y ciclo de vida.",
    ],
    answer: 3,
    explanation:
      "En una tabla managed, Unity Catalog y Databricks administran almacenamiento y metadatos como una unidad, habilitando más automatización. External sigue siendo válida cuando se necesita control externo de la ubicación, pero añade responsabilidad operativa.",
    domain: "Section 8: Data Governance",
    moduleId: "m11",
  },
  {
    id: "pro-047",
    scenario:
      "La organización aplica máscaras distintas según clasificación y país. Crear una función y un ALTER TABLE manual por cada columna ya no escala y las clasificaciones se expresan mediante tags gobernados.",
    question: "¿Qué enfoque centraliza la política cuando la capacidad está habilitada?",
    options: [
      "Generar una copia no gobernada de cada tabla por país.",
      "Definir políticas ABAC basadas en tags gobernados, con excepciones explícitas y pruebas de acceso por rol.",
      "Pedir a cada equipo que implemente CASE WHEN diferente en sus dashboards.",
      "Dar SELECT solo al administrador y exportar CSV a los demás usuarios.",
    ],
    answer: 1,
    explanation:
      "ABAC permite expresar controles reutilizables sobre atributos gobernados, reduciendo configuración objeto por objeto. La taxonomía, precedencia y pruebas siguen siendo esenciales para evitar clasificaciones incorrectas.",
    domain: "Section 8: Data Governance",
    moduleId: "m30",
  },
  {
    id: "pro-048",
    scenario:
      "En un job A→B→C y A→D, A y D terminaron correctamente, B falló antes de escribir y C quedó omitida por dependencia. El fallo se corrige cambiando un parámetro de B para esa ejecución histórica.",
    question: "¿Qué reparación minimiza trabajo repetido?",
    options: [
      "Crear un job nuevo que ejecute A, B, C y D desde cero.",
      "Marcar manualmente el run como exitoso sin ejecutar B.",
      "Borrar las salidas de A y D y relanzar todas las tareas.",
      "Reparar el run con el override autorizado, reejecutando B y sus dependientes fallidos/omitidos sin repetir A y D exitosas.",
    ],
    answer: 3,
    explanation:
      "Job repair conserva el contexto del run y permite repetir el tramo necesario. Las tareas exitosas independientes no tienen que ejecutarse de nuevo; cualquier efecto parcial de B debe seguir siendo idempotente o limpiarse explícitamente.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m20",
  },
  {
    id: "pro-049",
    scenario:
      "Un stage tiene 2.000 tareas. La mediana tarda 14 segundos, el percentil 99 supera 9 minutos y las tareas lentas leen mucha más entrada y derraman a disco. Los logs no muestran errores funcionales.",
    question: "¿Qué hipótesis está mejor respaldada por Spark UI?",
    options: [
      "Un permiso SELECT ausente en Unity Catalog.",
      "Skew de datos que crea particiones desproporcionadas y presión de memoria/spill.",
      "Un error de sintaxis en databricks.yml.",
      "Una credencial de OpenSharing expirada.",
    ],
    answer: 1,
    explanation:
      "La gran dispersión de duración, bytes y spill dentro del mismo stage es evidencia típica de skew. El siguiente paso es localizar claves/particiones dominantes y revisar plan, AQE y estrategia de join.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m26",
  },
  {
    id: "pro-050",
    scenario:
      "Una actualización de Spark Declarative Pipelines en Lakeflow falla al materializar silver_orders, pero otras tablas del grafo se actualizan. El mensaje resumido del job no revela si falló la regla de calidad, el flujo o el compute.",
    question: "¿Dónde se obtiene primero el contexto específico del dataset y la actualización?",
    options: [
      "En el event log del pipeline, filtrando la actualización, flujo y dataset afectados, y complementando con Spark UI si procede.",
      "En el historial de navegación del desarrollador que hizo el deploy.",
      "En system.billing.usage únicamente, porque contiene el stack trace completo de cada dataset.",
      "En DESCRIBE HISTORY de una tabla no relacionada.",
    ],
    answer: 0,
    explanation:
      "El event log es la fuente estructurada de eventos, estado, calidad y detalles de ejecución del pipeline. Si el fallo entra en ejecución Spark, sus referencias permiten profundizar después en Spark UI y logs.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m26",
  },
  {
    id: "pro-051",
    scenario:
      "Un pipeline CI despliega el mismo bundle en test y prod. En producción, los runs deben usar un service principal restringido y apuntar a main_prod; en test, a main_test y una identidad de pruebas.",
    question: "¿Qué configuración hace explícita la promoción segura?",
    options: [
      "Un notebook que detecte la URL del workspace y cambie sus permisos con la REST API.",
      "Targets separados con variables de catálogo y run_as apropiado, desplegados por identidades CI con permisos mínimos.",
      "Una copia manual del YAML guardada fuera de Git para cada workspace.",
      "Un token personal de administrador compartido entre todos los runners.",
    ],
    answer: 1,
    explanation:
      "Targets y variables representan diferencias de entorno sin bifurcar el artefacto. run_as controla la identidad de ejecución, mientras la identidad que despliega debe tener solo permisos para administrar los recursos necesarios.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m29",
  },
  {
    id: "pro-052",
    scenario:
      "El equipo guarda notebooks en una Git folder y asume que hacer pull de main actualizará automáticamente jobs, permisos, pipelines y schedules productivos. Después del pull, los recursos siguen con la configuración anterior.",
    question: "¿Qué concepto corrige esa suposición?",
    options: [
      "Git folders administran también todo el estado de infraestructura aunque no exista definición declarativa.",
      "Los jobs productivos deben editarse siempre a mano después de cada merge.",
      "La Git folder sincroniza código; los recursos y su configuración deben declararse y desplegarse, por ejemplo mediante un bundle en CI/CD.",
      "Los permisos de Unity Catalog se infieren del nombre de la rama Git.",
    ],
    answer: 2,
    explanation:
      "Versionar código no equivale a aplicar configuración de recursos. Un bundle describe jobs, pipelines, identidades y parámetros, y el pipeline de entrega valida y despliega esa definición de forma controlada.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m29",
  },
  {
    id: "pro-053",
    scenario:
      "Tras desplegar una versión defectuosa, el equipo vuelve al wheel anterior. Sin embargo, el run fallido ya hizo MERGE en silver y envió parte de los registros a un sistema externo.",
    question: "¿Qué afirmación debe guiar la recuperación?",
    options: [
      "Revertir el artefacto revierte automáticamente todos los commits Delta y efectos externos.",
      "Borrar el job elimina también sus tablas y mensajes publicados.",
      "El rollback de código no revierte datos ni efectos laterales; se necesitan escrituras idempotentes, conciliación y un procedimiento de compensación o restauración validado.",
      "Reejecutar el wheel anterior garantiza por sí solo que no habrá duplicados.",
    ],
    answer: 2,
    explanation:
      "Código, configuración, commits Delta y sistemas externos tienen ciclos de vida distintos. Una estrategia de despliegue debe combinar artefactos reversibles con idempotencia, checkpoints y runbooks de reparación de datos.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m29",
  },
  {
    id: "pro-054",
    scenario:
      "Un job falla de forma intermitente con executor lost. Spark UI muestra que todas las tareas son uniformes, pero los logs del clúster registran presión de memoria del sistema y reinicio de nodos durante el mismo intervalo.",
    question: "¿Qué secuencia de diagnóstico evita una conclusión prematura?",
    options: [
      "Cambiar de inmediato todas las tablas a CSV.",
      "Ignorar los timestamps y aumentar retries hasta que algún run termine.",
      "Restaurar una versión antigua de cada tabla de entrada.",
      "Correlacionar run, stage y logs de compute por tiempo, distinguir fallo de infraestructura de error de datos y probar el cambio en una ejecución controlada.",
    ],
    answer: 3,
    explanation:
      "Las señales apuntan al entorno de ejecución, pero deben correlacionarse antes de cambiar capacidad o código. Los retries pueden ocultar el incidente y elevar coste; una prueba controlada confirma la hipótesis.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m27",
  },
  {
    id: "pro-055",
    scenario:
      "Un modelo de ventas mezcla líneas de pedido y totales diarios en una misma tabla. Al sumar revenue por tienda, los totales se duplican porque algunas filas representan artículos y otras representan días completos.",
    question: "¿Qué decisión de modelado debe tomarse antes de elegir claves o medidas?",
    options: [
      "Declarar un grain único y explícito para la tabla de hechos, separando hechos con granularidades distintas.",
      "Añadir más columnas nullable para que cada fila pueda representar cualquier nivel.",
      "Aplicar distinct al resultado de todos los dashboards.",
      "Particionar por todas las medidas numéricas.",
    ],
    answer: 0,
    explanation:
      "El grain define qué representa una fila y determina claves y medidas aditivas. Mezclar granularidades produce joins y agregaciones ambiguas que no se corrigen de forma fiable con distinct.",
    domain: "Section 10: Data Modelling",
    moduleId: "m07",
  },
  {
    id: "pro-056",
    scenario:
      "El negocio necesita conocer tanto la dirección actual de cada cliente como la dirección válida cuando ocurrió una venta. El feed CDC contiene clave, operación y una secuencia monotónica por cliente.",
    question: "¿Qué materialización preserva el historial requerido?",
    options: [
      "Sobrescribir la dimensión completa con la última dirección y descartar eventos anteriores.",
      "Aplicar CDC con claves y sequence_by correctas para una dimensión SCD tipo 2, manteniendo intervalos de vigencia.",
      "Guardar cada evento como una nueva columna de la fila del cliente.",
      "Crear una vista que elija una dirección aleatoria cuando haya duplicados.",
    ],
    answer: 1,
    explanation:
      "SCD tipo 2 conserva versiones e intervalos para resolver la dimensión vigente en el momento del hecho. La secuencia del CDC ordena cambios y evita que un evento antiguo sustituya una versión más nueva.",
    domain: "Section 10: Data Modelling",
    moduleId: "m16",
  },
  {
    id: "pro-057",
    scenario:
      "Una venta llega antes que la dimensión del nuevo proveedor. El fact debe publicarse hoy con importes reconciliables, y mañana la dimensión llegará con sus atributos definitivos.",
    question: "¿Qué patrón mantiene integridad analítica durante la llegada tardía?",
    options: [
      "Descartar permanentemente la venta porque no existe la dimensión.",
      "Copiar todos los atributos del proveedor como texto libre dentro del fact.",
      "Esperar indefinidamente y bloquear todo el lote de ventas.",
      "Asignar una fila de dimensión desconocida con surrogate key controlada y reconciliar/rekey cuando llegue el proveedor real.",
    ],
    answer: 3,
    explanation:
      "La dimensión desconocida conserva la fila de hecho y evita claves nulas. Un proceso de reconciliación debe identificar esos casos y vincularlos a la dimensión definitiva sin duplicar medidas.",
    domain: "Section 10: Data Modelling",
    moduleId: "m07",
  },
  {
    id: "pro-058",
    scenario:
      "Operaciones necesita responder cuántos contratos estaban activos al cierre de cada día y comparar saldos diarios. Reconstruir el estado desde millones de eventos cada vez incumple el SLA del dashboard.",
    question: "¿Qué tipo de hecho atiende mejor ese patrón de consulta?",
    options: [
      "Una tabla sin fecha que contenga solo el último contrato observado.",
      "Una dimensión SCD tipo 1 con el saldo agregado de toda la empresa.",
      "Un periodic snapshot fact con una fila por contrato y día —o la granularidad de cierre acordada— y medidas de saldo/estado.",
      "Una bridge table entre empleados y oficinas.",
    ],
    answer: 2,
    explanation:
      "El snapshot periódico materializa el estado en instantes regulares y hace eficientes tendencias y cierres. El grain debe definirse explícitamente para evitar doble conteo y controlar volumen.",
    domain: "Section 10: Data Modelling",
    moduleId: "m07",
  },
  {
    id: "pro-059",
    scenario:
      "Una campaña puede pertenecer a varios segmentos y un segmento contiene muchas campañas. Unir directamente campaign_fact con segment_dim duplica revenue cuando el informe agrega por campaña.",
    question: "¿Qué estructura modela la relación sin ocultar la cardinalidad?",
    options: [
      "Añadir una columna segment_1, segment_2 y segment_3 al fact y limitar el modelo a tres segmentos.",
      "Elegir al azar un segmento por campaña antes de publicar.",
      "Concatenar todos los segmentos en un string y usar LIKE en cada consulta.",
      "Crear una bridge table campaña-segmento y definir reglas de asignación o ponderación para las medidas no aditivas entre segmentos.",
    ],
    answer: 3,
    explanation:
      "La bridge table representa explícitamente el many-to-many. Si una medida se reparte por segmento, el modelo debe definir ponderaciones o reglas de agregación para no multiplicar el revenue.",
    domain: "Section 10: Data Modelling",
    moduleId: "m07",
  },
  {
    id: "pro-060",
    scenario: "Un equipo conserva pipelines que usan APPLY CHANGES y quiere adoptar la nomenclatura recomendada sin rediseñar su lógica CDC.",
    question: "¿Qué migración refleja la recomendación vigente de Databricks?",
    options: [
      "Sustituir APPLY CHANGES por AUTO CDC, conservando la sintaxis y validando el comportamiento del flujo.",
      "Reescribir cada cambio como un INSERT append-only y eliminar las claves.",
      "Mover el CDC a una Python UDF ejecutada fila a fila.",
      "Usar Lakehouse Federation para modificar la tabla destino remota.",
    ],
    answer: 0,
    explanation: "AUTO CDC reemplaza a APPLY CHANGES como nombre recomendado y mantiene la misma sintaxis. La migración debe validarse, pero no exige cambiar el modelo CDC.",
    domain: "Section 1: Developing Code for Data Processing using Python and SQL",
    moduleId: "m16",
    sourceLabel: "Databricks · APIs AUTO CDC",
    sourceUrl: "https://docs.databricks.com/aws/en/ldp/cdc",
  },
  {
    id: "pro-061",
    scenario: "Un repositorio usa Asset Bundles en producción. Tras el cambio de nombre a Declarative Automation Bundles, el equipo teme que sus comandos bundle y configuraciones dejen de funcionar.",
    question: "¿Qué acción es técnicamente correcta?",
    options: [
      "Eliminar todos los targets y volver a crearlos desde la UI.",
      "Seguir usando la configuración existente; el cambio de nombre no rompe el comando bundle ni sus recursos.",
      "Convertir el bundle a un notebook monolítico.",
      "Renombrar manualmente cada clave YAML de asset a declarative.",
    ],
    answer: 1,
    explanation: "El cambio de nombre es no disruptivo. Los comandos y configuraciones existentes continúan funcionando, aunque la documentación y el curso usen el nombre nuevo.",
    domain: "Section 9: Debugging and Deploying",
    moduleId: "m29",
    sourceLabel: "Databricks · Declarative Automation Bundles FAQ",
    sourceUrl: "https://docs.databricks.com/aws/en/dev-tools/bundles/faqs",
  },
  {
    id: "pro-062",
    scenario: "FinOps quiere atribuir con precisión coste por job run. Algunos jobs comparten un cluster all-purpose con notebooks interactivos y otros usan job compute dedicado.",
    question: "¿Qué conjunto ofrece la atribución más fiable?",
    options: [
      "Los jobs de all-purpose, porque todo el uso pertenece al último job ejecutado.",
      "Job compute o serverless, uniendo usage_metadata con las tablas system.lakeflow y precios.",
      "El número de notebooks por workspace multiplicado por el precio de lista.",
      "La duración del cluster sin considerar concurrencia ni SKU.",
    ],
    answer: 1,
    explanation: "Job compute y serverless exponen metadatos de job y run adecuados para unir consumo, precios y definición del job. En compute compartido la atribución exacta es ambigua.",
    domain: "Section 6: Cost & Performance Optimisation",
    moduleId: "m25",
    sourceLabel: "Databricks · monitorizar coste y rendimiento de Jobs",
    sourceUrl: "https://docs.databricks.com/aws/en/admin/system-tables/jobs-cost",
  },
  {
    id: "pro-063",
    scenario: "Un catálogo contiene cientos de tablas. Las columnas etiquetadas como PII deben quedar enmascaradas, incluso cuando aparezcan tablas nuevas, y los propietarios no deben poder retirar la protección.",
    question: "¿Qué diseño satisface mejor el control centralizado?",
    options: [
      "Una vista distinta creada manualmente por cada propietario.",
      "Una policy ABAC a nivel de catálogo basada en governed tags, más grants base separados.",
      "Un DENY aplicado al SQL warehouse.",
      "Copiar todas las columnas PII a un catálogo sin usuarios.",
    ],
    answer: 1,
    explanation: "ABAC permite asociar una policy al catálogo y hacerla coincidir dinámicamente con tablas y columnas etiquetadas. Los grants base siguen controlándose por separado.",
    domain: "Section 7: Ensuring Data Security and Compliance",
    moduleId: "m30",
    sourceLabel: "Databricks · conceptos ABAC de Unity Catalog",
    sourceUrl: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/abac/core-concepts",
  },
  {
    id: "pro-064",
    scenario: "Un equipo necesita explorar una base externa sin mover datos durante una prueba de concepto. Si el caso se convierte en un dashboard de alto volumen y baja latencia, aceptará materializar los datos.",
    question: "¿Qué secuencia de decisiones es la más defendible?",
    options: [
      "Empezar con query federation y, si el patrón se vuelve recurrente y exigente, evaluar Lakeflow Connect managed.",
      "Crear desde el primer día un export manual de CSV y mantenerlo para producción.",
      "Usar Delta Sharing para escribir en la base externa.",
      "Mantener siempre federation porque nunca depende del rendimiento de la fuente.",
    ],
    answer: 0,
    explanation: "La federación evita movimiento y encaja en exploración ad hoc; la ingesta gestionada suele escalar mejor para grandes volúmenes, recurrencia y menor latencia de consulta.",
    domain: "Section 4: Data Sharing and Federation",
    moduleId: "m31",
    sourceLabel: "Databricks · query federation frente a Lakeflow Connect",
    sourceUrl: "https://docs.databricks.com/aws/en/query-federation/database-federation",
  },
] as const satisfies readonly ProfessionalExamQuestion[];

export const professionalExamDomainTargets = {
  "Section 1: Developing Code for Data Processing using Python and SQL": 10,
  "Section 2: Data Ingestion & Acquisition": 5,
  "Section 3: Data Transformation, Cleansing, and Quality": 7,
  "Section 4: Data Sharing and Federation": 4,
  "Section 5: Monitoring and Alerting": 5,
  "Section 6: Cost & Performance Optimisation": 7,
  "Section 7: Ensuring Data Security and Compliance": 5,
  "Section 8: Data Governance": 4,
  "Section 9: Debugging and Deploying": 7,
  "Section 10: Data Modelling": 5,
} as const satisfies Record<ProfessionalExamDomain, number>;

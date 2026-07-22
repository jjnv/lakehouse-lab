export type ExamQuestionOrigin = "official-retired-sample" | "augmented-official-sample" | "original-course";

export type AugmentedExamQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  domain: string;
  moduleId: string;
  origin: ExamQuestionOrigin;
  originLabel: string;
  officialSampleId: string;
  augmentationMethod: string;
  sourceLabel: string;
  sourceUrl: string;
};

const associateGuide = "https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf";
const professionalGuide = "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf";

export const officialSampleCatalog = {
  associate: [
    { id: "associate-q1", number: 1, page: 3, objective: "Agregaciones y métricas con DataFrames PySpark" },
    { id: "associate-q2", number: 2, page: 4, objective: "Permisos de usuarios y grupos en Unity Catalog" },
    { id: "associate-q3", number: 3, page: 5, objective: "Compartición de datos con Delta Sharing" },
    { id: "associate-q4", number: 4, page: 5, objective: "Creación de tablas mediante DDL" },
    { id: "associate-q5", number: 5, page: 6, objective: "Inserción de registros mediante DML" },
  ],
  professional: [
    { id: "professional-q1", number: 1, page: 5, objective: "Operaciones de catálogo y metastore con Delta Lake" },
    { id: "professional-q2", number: 2, page: 5, objective: "Structured Streaming con requisitos de latencia" },
    { id: "professional-q3", number: 3, page: 6, objective: "Modelado escalable y selección de layout" },
    { id: "professional-q4", number: 4, page: 6, objective: "Herencia de permisos y vistas dinámicas" },
    { id: "professional-q5", number: 5, page: 7, objective: "Compute y programación con coste mínimo" },
    { id: "professional-q6", number: 6, page: 7, objective: "Gestión segura de secretos en notebooks" },
    { id: "professional-q7", number: 7, page: 8, objective: "Tamaño de archivos y configuración de Spark" },
    { id: "professional-q8", number: 8, page: 8, objective: "Vistas, clones y productos derivados" },
    { id: "professional-q9", number: 9, page: 9, objective: "Jobs multitarea y semántica de fallos" },
  ],
} as const;

function augmented(
  level: "Associate" | "Professional",
  sample: number,
  domain: string,
  moduleId: string,
  question: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
  answerPosition: 0 | 1 | 2 | 3,
): AugmentedExamQuestion {
  const options = [...distractors];
  options.splice(answerPosition, 0, correct);
  const sourceUrl = level === "Associate" ? associateGuide : professionalGuide;
  const prefix = level.toLowerCase();
  return {
    question,
    options,
    answer: answerPosition,
    explanation,
    domain,
    moduleId,
    origin: "augmented-official-sample",
    originLabel: "Sintética · ampliada desde muestra oficial",
    officialSampleId: `${prefix}-q${sample}`,
    augmentationMethod: "Contexto, valores y distractores nuevos; se conserva únicamente el objetivo técnico de la muestra retirada.",
    sourceLabel: `Guía oficial ${level} · muestra retirada ${sample}`,
    sourceUrl,
  };
}

const a = (sample: number, domain: string, moduleId: string, question: string, correct: string, distractors: [string,string,string], explanation: string, answer: 0|1|2|3) => augmented("Associate", sample, domain, moduleId, question, correct, distractors, explanation, answer);
const p = (sample: number, domain: string, moduleId: string, question: string, correct: string, distractors: [string,string,string], explanation: string, answer: 0|1|2|3) => augmented("Professional", sample, domain, moduleId, question, correct, distractors, explanation, answer);

export const associateOfficialAugmentations: AugmentedExamQuestion[] = [
  a(1,"Data Transformation and Modeling","m04","Se necesita una fila por fecha con importe total y número de pedidos únicos. ¿Qué agregaciones corresponden?","sum(amount) y count_distinct(order_id)",["sum(order_id) y count(amount)","avg(amount) y sum(order_id)","collect_list(amount) y count(customer_id)"],"La métrica combina una suma del importe con un recuento distinto de la clave de pedido.",0),
  a(1,"Data Transformation and Modeling","m04","Una tabla contiene varias líneas por factura. ¿Cómo se calcula por tienda el ingreso y las facturas únicas?","groupBy(store_id).agg(sum(net), count_distinct(invoice_id))",["groupBy(invoice_id).agg(sum(store_id), count(net))","select(store_id, sum(net), invoice_id)","groupBy(store_id).agg(count(net), sum(invoice_id))"],"La agrupación usa la dimensión tienda y las métricas adecuadas para importe y cardinalidad de facturas.",1),
  a(1,"Data Transformation and Modeling","m04","¿Qué expresión obtiene unidades vendidas y clientes únicos por producto?","groupBy(product_id).agg(sum(quantity), count_distinct(customer_id))",["groupBy(customer_id).agg(sum(product_id), count(quantity))","groupBy(product_id).agg(avg(quantity), sum(customer_id))","select(product_id, quantity, customer_id).distinct()"],"La granularidad es producto; las unidades se suman y los clientes se deduplican.",2),
  a(1,"Data Transformation and Modeling","m04","El mismo ticket aparece en varias filas de detalle. Para contar tickets diarios sin duplicarlos debe usarse:","count_distinct(ticket_id) después de groupBy(sale_date)",["sum(ticket_id) sin agrupación","count(item_id) después de groupBy(ticket_id)","collect_set(sale_date) como importe"],"La clave del ticket se cuenta de forma distinta dentro de cada fecha.",3),
  a(1,"Data Transformation and Modeling","m04","¿Qué cálculo produce por departamento el salario medio y el número de empleados únicos?","groupBy(department).agg(avg(salary), count_distinct(employee_id))",["groupBy(employee_id).agg(sum(department), count(salary))","groupBy(department).agg(sum(employee_id), max(salary))","select(department, salary).distinct()"],"La dimensión es departamento; el salario requiere promedio y la plantilla un recuento distinto.",0),
  a(1,"Data Transformation and Modeling","m04","Un DataFrame tiene eventos repetidos por sesión. ¿Qué resumen cuenta eventos y sesiones únicas por día?","groupBy(event_date).agg(count(event_id), count_distinct(session_id))",["groupBy(session_id).agg(count(event_date), sum(event_id))","groupBy(event_date).agg(sum(session_id), count(event_id))","dropDuplicates([event_date]) sin agregación"],"El total de eventos admite count; las sesiones requieren count_distinct.",1),

  a(2,"Governance and Security","m11","El grupo finance ya puede recorrer catálogo y esquema. ¿Qué concesión ofrece solo lectura de todas las tablas del esquema?","GRANT SELECT ON SCHEMA finance TO `finance-readers`",["GRANT MODIFY ON SCHEMA finance TO `finance-readers`","GRANT CREATE TABLE ON SCHEMA finance TO `finance-readers`","GRANT ALL PRIVILEGES ON CATALOG main TO `finance-readers`"],"SELECT sobre el esquema concede lectura heredable sin permisos de escritura o creación.",2),
  a(2,"Governance and Security","m11","Un grupo debe crear tablas en sandbox pero no administrar el catálogo. ¿Qué privilegio mínimo falta?","CREATE TABLE sobre el esquema sandbox",["OWN sobre el metastore","ALL PRIVILEGES sobre el catálogo","MODIFY sobre todas las tablas de producción"],"Crear una tabla requiere acceso de recorrido y CREATE TABLE en el esquema destino.",3),
  a(2,"Governance and Security","m11","Un usuario tiene SELECT sobre una tabla pero no puede resolver su nombre de tres niveles. ¿Qué debe revisarse?","USE CATALOG y USE SCHEMA en los ancestros",["CREATE CATALOG y MANAGE","MODIFY y DELETE","CAN MANAGE sobre el workspace"],"SELECT no sustituye los privilegios necesarios para recorrer catálogo y esquema.",0),
  a(2,"Governance and Security","m11","¿Qué sentencia retira la capacidad de modificar una tabla sin eliminar el acceso de lectura ya concedido?","REVOKE MODIFY ON TABLE main.ops.orders FROM `operators`",["DROP TABLE main.ops.orders","REVOKE USE CATALOG ON CATALOG main FROM `operators`","DENY SELECT ON TABLE main.ops.orders TO `operators`"],"REVOKE elimina el privilegio concreto y conserva otros grants independientes.",1),
  a(2,"Governance and Security","m11","Un equipo necesita ejecutar una función gobernada, pero no editarla. ¿Qué privilegio corresponde?","EXECUTE sobre la función",["MODIFY sobre el catálogo","CREATE SCHEMA sobre el metastore","OWN sobre la función"],"EXECUTE permite invocar la función sin transferir ownership ni capacidad de modificación.",2),
  a(2,"Governance and Security","m11","Para leer archivos gobernados en un Volume, además de recorrer catálogo y esquema, se necesita:","READ VOLUME sobre el Volume",["SELECT sobre el SQL warehouse","MODIFY sobre todas las tablas","CREATE MANAGED STORAGE sobre el metastore"],"Los archivos de un Volume se autorizan con READ VOLUME, no con SELECT de tabla.",3),

  a(3,"Governance and Security","m31","Dos cuentas Databricks quieren compartir tablas vivas conservando identidad de ambas partes. ¿Qué modo debe priorizarse?","Databricks-to-Databricks sharing",["Un CSV enviado por correo","Un token abierto para cualquier receptor","Una copia nocturna mediante JDBC"],"El modo Databricks-to-Databricks usa identidades de cuenta y evita credenciales abiertas para el receptor.",0),
  a(3,"Governance and Security","m31","Un socio sin Databricks necesita consultar un dataset compartido. ¿Qué modalidad encaja?","Open sharing con credencial de receptor y perfil seguro",["Concederle ownership del metastore","Añadirlo al grupo admins del workspace","Entregar las credenciales cloud del bucket"],"Open sharing está diseñado para receptores externos a Databricks sin exponer credenciales de almacenamiento.",1),
  a(3,"Governance and Security","m31","¿Qué se añade a un share para publicar únicamente columnas aprobadas con nombres adaptados?","Una vista compartible que proyecte y renombre las columnas",["Un cluster all-purpose","Una storage credential del receptor","Un checkpoint de Structured Streaming"],"Una vista permite controlar la proyección sin duplicar físicamente el producto de datos.",2),
  a(3,"Governance and Security","m31","Un receptor de Delta Sharing necesita modificar la tabla del proveedor. ¿Qué debe aclararse?","El protocolo ofrece acceso de lectura al dato compartido; las escrituras se gestionan en el proveedor",["El receptor obtiene MODIFY automáticamente","El receptor hereda ownership del catálogo","El share convierte la tabla en un Volume"],"Delta Sharing distribuye acceso de lectura; no delega escritura sobre la tabla fuente.",3),
  a(3,"Governance and Security","m31","Antes de compartir datos entre regiones cloud debe evaluarse especialmente:","Coste de transferencia, residencia y latencia",["Número de celdas del notebook","Color del dashboard","Orden alfabético de los catálogos"],"El acceso entre regiones o clouds puede introducir egress, restricciones regulatorias y latencia.",0),
  a(3,"Governance and Security","m31","¿Qué objeto agrupa las tablas y vistas que el proveedor desea exponer mediante Delta Sharing?","Un share",["Un recipient","Un SQL warehouse","Un job cluster"],"El share representa el conjunto de activos publicados; el recipient representa a quien los consume.",1),

  a(4,"Data Transformation and Modeling","m06","Debe recrearse de forma declarativa una tabla vacía incluso si ya existe. ¿Qué forma SQL corresponde?","CREATE OR REPLACE TABLE ... (columnas) USING DELTA",["CREATE TABLE IF NOT EXISTS sin reemplazo","INSERT OVERWRITE sin tabla destino","ALTER VIEW ADD COLUMNS"],"CREATE OR REPLACE aplica la definición indicada tanto si la tabla existe como si no.",2),
  a(4,"Data Transformation and Modeling","m06","Se quiere conservar una tabla existente y crearla solo cuando falte. ¿Qué cláusula expresa esa intención?","CREATE TABLE IF NOT EXISTS",["CREATE OR REPLACE TABLE","DROP TABLE IF EXISTS","REPLACE WHERE"],"IF NOT EXISTS evita sustituir una tabla ya creada.",3),
  a(4,"Data Transformation and Modeling","m06","¿Qué sentencia crea una tabla Delta a partir del resultado de una consulta?","CREATE TABLE target USING DELTA AS SELECT ...",["ALTER TABLE target SELECT ...","GRANT TABLE AS SELECT ...","MERGE TABLE WITHOUT SOURCE"],"CTAS combina definición y población mediante el resultado de SELECT.",0),
  a(4,"Data Transformation and Modeling","m06","Una columna nullable debe pasar a NOT NULL después de validar los datos. ¿Qué tipo de operación se usa?","ALTER TABLE para modificar la definición de la columna",["VACUUM para reescribir el esquema","DESCRIBE HISTORY para aplicar el cambio","OPTIMIZE para añadir la restricción"],"ALTER TABLE modifica metadatos de esquema; las operaciones de mantenimiento no declaran restricciones.",1),
  a(4,"Data Transformation and Modeling","m06","¿Qué comando elimina una tabla solo si existe, facilitando cleanup idempotente?","DROP TABLE IF EXISTS",["DELETE TABLE ALWAYS","TRUNCATE IF MISSING","REMOVE TABLE CASCADE FILES"],"IF EXISTS hace que la operación sea repetible cuando el objeto ya fue eliminado.",2),
  a(4,"Data Transformation and Modeling","m06","Se necesita cambiar el nombre lógico de una tabla sin crear una copia de datos. ¿Qué sentencia corresponde?","ALTER TABLE old_name RENAME TO new_name",["CREATE TABLE new_name CLONE old_name","INSERT INTO new_name SELECT * FROM old_name","COPY INTO new_name FROM old_name"],"RENAME actualiza la referencia de catálogo en lugar de materializar otra tabla.",3),

  a(5,"Data Transformation and Modeling","m06","¿Qué forma SQL añade una fila completa a una tabla Delta existente?","INSERT INTO target VALUES (...) ",["UPDATE VALUES (...) target","CREATE ROW INTO target","APPEND TABLE target SET (...)"],"INSERT INTO ... VALUES expresa una inserción de fila en SQL.",0),
  a(5,"Data Transformation and Modeling","m06","Una carga trae claves nuevas y existentes. ¿Qué operación permite actualizar coincidencias e insertar ausencias?","MERGE INTO con WHEN MATCHED y WHEN NOT MATCHED",["VACUUM con RETAIN 0 HOURS","DESCRIBE DETAIL","GRANT MODIFY"],"MERGE modela un upsert atómico basado en la condición de coincidencia.",1),
  a(5,"Data Transformation and Modeling","m06","Debe corregirse rating únicamente para id='a1'. ¿Qué DML corresponde?","UPDATE target SET rating=9.4 WHERE id='a1'",["INSERT target WHERE id='a1'","ALTER COLUMN rating=9.4","OPTIMIZE target WHERE id='a1'"],"UPDATE modifica filas existentes seleccionadas por un predicado.",2),
  a(5,"Data Transformation and Modeling","m06","¿Qué sentencia elimina de una tabla Delta las filas expiradas?","DELETE FROM target WHERE expires_at < current_date()",["DROP TABLE target WHERE expires_at","VACUUM target WHERE expires_at","REVOKE SELECT WHERE expires_at"],"DELETE es la operación DML para retirar filas que cumplen una condición.",3),
  a(5,"Data Transformation and Modeling","m06","Para añadir el resultado de una consulta respetando el orden de columnas se utiliza:","INSERT INTO target SELECT ...",["ALTER TABLE target AS SELECT","UPDATE target CREATE SELECT","COPY TABLE target VALUES SELECT"],"INSERT INTO puede consumir directamente las filas producidas por SELECT.",0),
  a(5,"Data Transformation and Modeling","m06","Una ingesta reintentable debe evitar insertar de nuevo una clave ya procesada. ¿Qué patrón es más sólido?","MERGE con clave estable y condición de coincidencia",["INSERT INTO sin condición en cada reintento","collect antes de escribir","Cambiar el nombre de la tabla en cada run"],"La clave estable permite que el reintento actualice o ignore la coincidencia en vez de duplicarla.",1),
];

export const professionalOfficialAugmentations: AugmentedExamQuestion[] = [
  p(1,"Section 10: Data Modelling","m06","Una tabla externa Delta se renombra dentro del mismo catálogo. ¿Qué cambia necesariamente?","La referencia registrada en el catálogo/metastore",["La ruta de los archivos se mueve automáticamente","Se crea un nuevo transaction log","Se reescriben todos los Parquet"],"El nombre es metadato de catálogo; el rename no implica mover la ubicación externa.",0),
  p(1,"Section 10: Data Modelling","m06","Se renombra una tabla managed sin cambiar de catálogo. ¿Qué afirmación es defendible?","El catálogo actualiza la identidad lógica; la plataforma gestiona el almacenamiento asociado",["Cada archivo recibe el nuevo nombre","Se ejecuta un deep clone automático","El protocolo reader se incrementa"],"El rename opera sobre metadatos; no equivale a clonar ni a subir el protocolo.",1),
  p(1,"Section 9: Debugging and Deploying","m06","Después de RENAME TABLE, un job sigue usando el identificador anterior. ¿Qué debe actualizarse?","La referencia del job al nombre de tabla",["El checkpoint para crear un nuevo Delta log","Todos los archivos Parquet","La versión de Spark en el metastore"],"Los consumidores por nombre deben adoptar el nuevo identificador registrado.",2),
  p(1,"Section 10: Data Modelling","m06","¿Cuál es el principal riesgo de confundir rename de catálogo con cambio de ubicación?","Asumir que la ruta física se ha movido cuando solo cambió el nombre lógico",["Que Photon se desactive","Que SQL warehouse pierda auto-stop","Que VACUUM cree un catálogo"],"La distinción entre referencia lógica y ubicación evita operaciones posteriores sobre una ruta equivocada.",3),

  p(2,"Section 2: Data Ingestion & Acquisition","m13","Los microbatches tardan 18 s con trigger de 10 s y aumenta el backlog. ¿Qué debe hacerse primero?","Optimizar o escalar para que el tiempo de proceso vuelva a quedar bajo el SLA",["Reducir el trigger a 1 s sin medir","Eliminar el checkpoint","Iniciar dos queries sobre el mismo checkpoint"],"Un intervalo menor no aporta concurrencia entre microbatches de una misma consulta cuando el procesamiento ya está retrasado.",0),
  p(2,"Section 5: Monitoring and Alerting","m13","Una consulta tarda normalmente 2 s pero alcanza 25 s por skew en horas punta. ¿Qué acción ataca la causa?","Medir la distribución y corregir el skew o la capacidad antes de cambiar el trigger",["Cambiar outputMode sin revisar el estado","Borrar offsets confirmados","Ejecutar trigger once cada cinco segundos"],"La irregularidad viene del trabajo por batch; el trigger no elimina skew ni spill.",1),
  p(2,"Section 2: Data Ingestion & Acquisition","m13","El SLA exige menos de 10 s y cada batch sostenido tarda 12 s. ¿Qué conclusión es correcta?","La consulta no sostiene el ritmo; debe reducirse el tiempo de proceso por batch",["Un trigger de 5 s ejecutará dos batches simultáneos","El checkpoint impide cualquier ajuste","availableNow garantiza latencia continua"],"La capacidad de proceso debe superar la tasa de entrada para evitar acumulación.",2),
  p(2,"Section 9: Debugging and Deploying","m26","¿Qué métricas ayudan a decidir si el problema de latencia está en entrada, proceso o estado?","inputRowsPerSecond, processedRowsPerSecond, batchDuration y métricas del state store",["Solo el nombre del notebook","Número de catálogos y usuarios","Tamaño del README"],"Las métricas de progreso separan tasa de llegada, rendimiento y presión del estado.",3),

  p(3,"Section 10: Data Modelling","m24","Una tabla de años de eventos se consulta casi siempre por event_date. ¿Qué columna tiene cardinalidad y patrón adecuados para layout?","event_date",["event_id único","payload JSON","ingest_timestamp a nivel de milisegundo"],"Una fecha usada en filtros evita la cardinalidad extrema de identificadores o timestamps finos.",0),
  p(3,"Section 10: Data Modelling","m24","Una tabla recibe filtros cambiantes por customer_id y region. ¿Qué alternativa reduce decisiones rígidas de particionado?","Liquid clustering con claves observadas y revisables",["Particionar por cada columna","Un archivo por cliente","Collect y escritura local"],"Liquid clustering admite claves flexibles sin fijar una jerarquía de directorios tradicional.",1),
  p(3,"Section 6: Cost & Performance Optimisation","m24","¿Qué columna es mala candidata para particionado tradicional de una tabla de posts?","post_id casi único",["date con filtros frecuentes","region con cardinalidad acotada","event_day derivado"],"Una clave casi única genera demasiadas particiones pequeñas.",2),
  p(3,"Section 10: Data Modelling","m24","Antes de elegir una columna de layout debe medirse principalmente:","Patrones de filtro, cardinalidad, volumen y tamaño de archivos",["Longitud del nombre del notebook","Cantidad de dashboards sin consultas","Número de usuarios del repositorio"],"El layout debe responder al acceso real y a la distribución física.",3),

  p(4,"Section 7: Ensuring Data Security and Compliance","m30","Una vista devuelve email real solo a marketing y REDACTED al resto. ¿Qué verá un analista fuera del grupo?","Las columnas proyectadas, con REDACTED en email",["La tabla base completa","Un error por no ser owner","Una columna adicional llamada marketing"],"La expresión CASE evalúa la pertenencia y sustituye el valor para usuarios no autorizados.",0),
  p(4,"Section 8: Data Governance","m30","Una vista dinámica usa is_account_group_member para finanzas. ¿Dónde se decide el valor mostrado?","En la expresión de la vista durante la consulta",["En el checkpoint del job","En VACUUM","En el tamaño del warehouse"],"La lógica de la vista evalúa la identidad en tiempo de consulta.",1),
  p(4,"Section 7: Ensuring Data Security and Compliance","m30","¿Qué permiso necesita un consumidor sobre una vista además de recorrer catálogo y esquema?","SELECT sobre la vista",["OWN sobre la tabla base","CREATE CATALOG","MANAGE sobre el metastore"],"Los consumidores consultan la vista mediante SELECT; no necesitan ownership de la tabla base.",2),
  p(4,"Section 8: Data Governance","m30","Una política debe cubrir automáticamente columnas nuevas etiquetadas PII. ¿Qué mecanismo escala mejor que vistas manuales?","ABAC con governed tags",["Un notebook por tabla","Una copia CSV por grupo","Un cluster por usuario"],"ABAC aplica políticas centralizadas a objetos que cumplen los atributos gobernados.",3),

  p(5,"Section 6: Cost & Performance Optimisation","m25","Un pipeline tarda 8 min y debe terminar cada hora. ¿Qué compute minimiza tiempo ocioso?","Job compute o serverless que se inicia para cada ejecución",["Cluster interactivo encendido permanentemente","SQL warehouse sin auto-stop para PySpark","Pool sin jobs asociados"],"El compute efímero evita pagar capacidad inactiva entre ejecuciones.",0),
  p(5,"Section 1: Developing Code for Data Processing using Python and SQL","m20","Un notebook intensivo en memoria no admite reintentos. ¿Qué configuración debe priorizarse?","Memoria suficiente y max_retries=0 para esa tarea",["Un trigger más frecuente","Un recipient de Delta Sharing","Un schemaLocation nuevo"],"La tarea debe dimensionarse para su perfil y reflejar explícitamente que no es reintentable.",1),
  p(5,"Section 6: Cost & Performance Optimisation","m25","El SLA es diario y el job tarda 20 minutos. ¿Qué opción suele ser más barata?","Ejecución programada en compute efímero con auto-terminación",["All-purpose 24x7","Dos clusters activos por redundancia sin requisito","Streaming continuo sin datos"],"La programación efímera alinea consumo con trabajo realizado.",2),
  p(5,"Section 9: Debugging and Deploying","m20","Una tarea puede producir efectos externos no idempotentes. ¿Qué ajuste evita repetirlos automáticamente?","Desactivar retries y diseñar una recuperación controlada",["Aumentar retries a infinito","Borrar el historial del job","Usar un cluster interactivo compartido"],"Los reintentos automáticos pueden duplicar efectos; la recuperación debe ser explícita.",3),

  p(6,"Section 7: Ensuring Data Security and Compliance","m30","dbutils.secrets.get devuelve una contraseña que se imprime. ¿Qué salida debe esperarse en el notebook?","Un valor redactado, aunque el secreto todavía puede filtrarse mediante transformaciones inseguras",["La contraseña siempre en claro","Un cuadro de entrada interactivo","El secreto guardado automáticamente en DBFS"],"Databricks intenta redactar accesos directos, pero el código debe evitar exponer o transformar secretos.",0),
  p(6,"Section 1: Developing Code for Data Processing using Python and SQL","m03","¿Cómo debe pasarse un secreto JDBC a la opción password?","Obteniéndolo en tiempo de ejecución desde un secret scope autorizado",["Pegándolo en el notebook","Guardándolo en una tabla pública","Incluyéndolo en el nombre del job"],"El secret scope separa el valor sensible del código versionado.",1),
  p(6,"Section 7: Ensuring Data Security and Compliance","m30","Un usuario sin READ en el secret scope ejecuta dbutils.secrets.get. ¿Qué ocurre?","La lectura falla por autorización",["Se devuelve una cadena vacía","Se crea un scope personal","Se concede acceso por usar un cluster"],"El acceso al compute no implica permiso sobre el secret scope.",2),
  p(6,"Section 7: Ensuring Data Security and Compliance","m30","¿Qué práctica sigue siendo insegura aunque la UI redacte el print directo?","Concatenar, codificar o enviar el secreto a otro destino",["Usar un scope con ACL","Rotar la credencial","Limitar READ al principal del job"],"La redacción no es una frontera de seguridad contra código que transforma o exfiltra el valor.",3),

  p(7,"Section 6: Cost & Performance Optimisation","m23","Se escribirá 1 TB en archivos de 512 MB sin shuffle previo. ¿Qué ajuste de escritura debe evaluarse?","spark.sql.files.maxRecordsPerFile o reparticionado explícito basado en mediciones",["Solo autoBroadcastJoinThreshold","Un trigger de streaming","USE CATALOG"],"El control de tamaño requiere relacionar volumen, filas y particiones; no una opción de joins.",0),
  p(7,"Section 6: Cost & Performance Optimisation","m23","Una transformación ya produce un shuffle y AQE está activo. ¿Qué ayuda a aproximar el tamaño objetivo de partición?","spark.sql.adaptive.advisoryPartitionSizeInBytes",["spark.sql.files.openCostInBytes como única garantía","spark.sql.autoBroadcastJoinThreshold","delta.deletedFileRetentionDuration"],"AQE puede coalescer particiones posteriores al shuffle usando el tamaño objetivo como recomendación.",1),
  p(7,"Section 6: Cost & Performance Optimisation","m23","¿Qué configuración afecta principalmente al tamaño máximo de particiones al leer archivos, no al número final de archivos escritos?","spark.sql.files.maxPartitionBytes",["maxRecordsPerFile","repartition antes de write","AQE advisory partition size tras shuffle"],"maxPartitionBytes gobierna el particionado de lectura y no garantiza el layout de salida.",2),
  p(7,"Section 9: Debugging and Deploying","m26","Antes de fijar 2.048 particiones por aritmética teórica debe comprobarse:","Compresión real, distribución, shuffle y tamaños observados",["Número de ramas Git","Color de los dashboards","Cantidad de usuarios del workspace"],"El volumen lógico no predice por sí solo el tamaño comprimido ni el sesgo de las particiones.",3),

  p(8,"Section 10: Data Modelling","m07","Marketing debe exponer columnas aprobadas con nombres de ventas y reflejar cambios al instante. ¿Qué solución es más simple?","Una vista con proyección y aliases",["Un deep clone sincronizado automáticamente","Un CTAS recreado manualmente","Otra escritura en cada pipeline"],"La vista evita duplicación y refleja los cambios de la tabla base al consultar.",0),
  p(8,"Section 10: Data Modelling","m06","¿Qué afirmación sobre DEEP CLONE es correcta?","Copia datos y metadatos en un destino independiente; no mantiene sincronización automática",["Es una vista lógica","Comparte siempre los mismos archivos","Renombra la tabla fuente"],"Un deep clone materializa una copia y requiere acciones posteriores para actualizarla.",1),
  p(8,"Section 7: Ensuring Data Security and Compliance","m30","Se necesita ocultar tres columnas y estandarizar dos nombres sin almacenar otra copia. ¿Qué objeto usar?","Una vista gobernada",["Un shallow clone para seguridad de filas","Un checkpoint","Un recipient"],"La vista controla proyección y aliases con mínima operación.",2),
  p(8,"Section 10: Data Modelling","m06","¿Cuándo sería más apropiada una tabla derivada que una vista?","Cuando se necesita materializar un resultado costoso con SLA y ciclo de actualización propios",["Cuando solo cambia un alias","Cuando se oculta una columna","Cuando se requiere siempre el dato más reciente sin refresh"],"La materialización se justifica por rendimiento o desacoplamiento, a cambio de operación y frescura.",3),

  p(9,"Section 9: Debugging and Deploying","m20","A termina; B y C arrancan. B termina y C falla después de escribir parcialmente. ¿Qué estado es posible?","A y B quedan completadas y los efectos previos al fallo de C pueden persistir",["Todo se revierte globalmente","B se deshace automáticamente","Ninguna tarea confirma hasta el final del DAG"],"Un job multitarea no proporciona una transacción global entre notebooks y sistemas.",0),
  p(9,"Section 9: Debugging and Deploying","m21","Tras fallar C, se repara el run seleccionando solo tareas fallidas. ¿Qué debe asumir el diseño?","Las tareas ya completadas no se repiten y C debe ser idempotente al reanudarse",["A y B siempre se ejecutan desde cero","El repair borra todas las tablas","El DAG se convierte en una transacción"],"Repair run reutiliza resultados exitosos cuando procede; la tarea reparada debe tolerar efectos parciales.",1),
  p(9,"Section 1: Developing Code for Data Processing using Python and SQL","m20","B y C dependen de A y D depende de ambas. C falla. ¿Qué sucede normalmente con D?","No se ejecuta porque una dependencia requerida falló",["Se ejecuta al terminar B","Revierte A y B","Ignora el estado de C"],"Las condiciones de ejecución por defecto requieren que las dependencias previas hayan tenido éxito.",2),
  p(9,"Section 5: Monitoring and Alerting","m21","¿Qué diseño permite ejecutar una tarea de notificación aunque una rama del DAG falle?","Configurar la condición de ejecución de la tarea para completado o fallo según el caso",["Eliminar todas las dependencias","Usar un cluster all-purpose","Guardar la alerta en un comentario"],"Las condiciones de ejecución modelan tareas finales de manejo de errores sin asumir rollback global.",3),
];

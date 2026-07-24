import { notebookGuideReferences, type NotebookGuideReferenceId } from "./references";
import type {
  NotebookCellGuide,
  NotebookGuideManifest,
  NotebookGuidePoint,
  NotebookGuideStatus,
} from "./types";

export type GuideTopic =
  | "orientation"
  | "environment"
  | "parameters"
  | "secrets"
  | "files"
  | "dataframe"
  | "sql"
  | "delta"
  | "cdf"
  | "optimization"
  | "streaming"
  | "medallion"
  | "governance"
  | "lineage"
  | "finops"
  | "validation"
  | "visualization"
  | "cleanup"
  | "photon"
  | "unity-oss"
  | "azure"
  | "cdc";

type TopicGuidance = {
  why: string;
  bestPractices: readonly [string, string];
  warnings: readonly [string, string];
  prerequisites: string;
  evidence: string;
  referenceIds: readonly NotebookGuideReferenceId[];
};

const topicGuidance: Record<GuideTopic, TopicGuidance> = {
  orientation: {
    why: "Sitúa la intención y los límites del ejemplo antes de ejecutar operaciones con estado.",
    bestPractices: ["Relaciona cada sección con una pregunta verificable.", "Distingue la explicación del comportamiento que debe comprobarse en el runtime."],
    warnings: ["El texto describe un ejemplo fijado a un commit, no una garantía para cualquier runtime.", "Comprueba los enlaces y nombres de producto antes de reutilizarlos en documentación propia."],
    prerequisites: "Leer el objetivo del recurso y reconocer el lenguaje de las celdas siguientes.",
    evidence: "Resumen propio que identifica objetivo, entradas, salidas y límites del ejemplo.",
    referenceIds: ["dbx-notebooks"],
  },
  environment: {
    why: "Una sesión reproducible evita atribuir al código resultados causados por dependencias o configuración implícita.",
    bestPractices: ["Fija versiones compatibles cuando el laboratorio dependa de una API concreta.", "Reinicia o separa la sesión cuando una instalación cambie el entorno de Python."],
    warnings: ["Instalar en una celda modifica el entorno del notebook y puede requerir reinicio.", "No promociones una combinación de versiones sin validarla en el runtime objetivo."],
    prerequisites: "Permiso para instalar dependencias y conocer el runtime del compute.",
    evidence: "Versiones efectivas de runtime y paquetes registradas junto al resultado de importación.",
    referenceIds: ["dbx-libraries"],
  },
  parameters: {
    why: "Separar parámetros de lógica permite repetir el laboratorio sin editar código ni ocultar supuestos.",
    bestPractices: ["Valida valores y nombres totalmente cualificados antes de usarlos.", "Registra parámetros no sensibles junto a la evidencia de ejecución."],
    warnings: ["Un valor predeterminado de demostración puede apuntar a un catálogo o ruta inexistente.", "Nunca uses widgets para mostrar o conservar secretos."],
    prerequisites: "Conocer catálogo, esquema, rutas y permisos del entorno de práctica.",
    evidence: "Parámetros efectivos no sensibles y resolución correcta de los objetos de destino.",
    referenceIds: ["dbx-widgets", "dbx-unity-catalog"],
  },
  secrets: {
    why: "Las credenciales deben resolverse fuera del código para evitar exposición y facilitar rotación.",
    bestPractices: ["Usa identidades administradas o un almacén de secretos con mínimo privilegio.", "Redacta valores sensibles en salidas, capturas y registros."],
    warnings: ["No ejecutes literales que parezcan claves, cadenas de conexión o tokens.", "La ocultación visual de un secreto no impide que el código lo filtre a otra salida."],
    prerequisites: "Scope o identidad configurados y permiso mínimo sobre el servicio externo.",
    evidence: "Conexión correcta sin valores sensibles visibles en la celda ni en su salida.",
    referenceIds: ["dbx-secrets"],
  },
  files: {
    why: "La ruta y el protocolo determinan permisos, consistencia y portabilidad de la ingesta.",
    bestPractices: ["Prefiere volúmenes o ubicaciones externas gobernadas frente a rutas personales.", "Comprueba esquema, recuento y procedencia después de leer o copiar datos."],
    warnings: ["Montajes y rutas DBFS heredadas pueden no ser apropiados con Unity Catalog.", "Las operaciones recursivas o de sobrescritura pueden afectar más datos de los previstos."],
    prerequisites: "Acceso de lectura o escritura a una ubicación de laboratorio aislada.",
    evidence: "Listado o lectura que demuestra la ruta efectiva y el conjunto de archivos esperado.",
    referenceIds: ["dbx-files", "dbx-unity-catalog"],
  },
  dataframe: {
    why: "Las transformaciones declarativas permiten inspeccionar esquema y plan antes de materializar resultados.",
    bestPractices: ["Expresa columnas con funciones nativas y conserva tipos explícitos.", "Comprueba esquema, nulos, cardinalidad y claves tras cada transformación relevante."],
    warnings: ["Una vista parcial no prueba completitud ni unicidad.", "Acciones como collect o toPandas pueden agotar memoria con datos no acotados."],
    prerequisites: "DataFrame de entrada disponible y comprensión de su esquema.",
    evidence: "Esquema y métricas de calidad que justifican la transformación aplicada.",
    referenceIds: ["spark-dataframe"],
  },
  sql: {
    why: "SQL hace explícitos selección, agregación y relaciones, pero su corrección depende de claves y granularidad.",
    bestPractices: ["Califica catálogo y esquema para evitar resolver objetos inesperados.", "Valida cardinalidad y nulos antes y después de joins o agregaciones."],
    warnings: ["DROP, DELETE, TRUNCATE y sobrescrituras cambian estado; aísla el laboratorio.", "Una consulta que devuelve filas no demuestra que la granularidad sea correcta."],
    prerequisites: "Objetos de entrada accesibles y permisos SQL limitados al entorno de práctica.",
    evidence: "Consulta reproducible con recuentos, esquema y comprobación de granularidad.",
    referenceIds: ["spark-sql", "dbx-unity-catalog"],
  },
  delta: {
    why: "El registro transaccional de Delta permite razonar sobre versiones, esquema y operaciones atómicas.",
    bestPractices: ["Inspecciona el historial y valida el esquema después de cada escritura.", "Usa rutas o tablas de práctica aisladas y nombres totalmente cualificados."],
    warnings: ["Overwrite, merge, update y delete alteran datos persistentes.", "Las capacidades disponibles dependen de la versión de Delta y del runtime."],
    prerequisites: "Sesión con Delta Lake y destino de laboratorio con permiso de escritura.",
    evidence: "Tabla Delta legible, historial de operación y resultado esperado a nivel de filas.",
    referenceIds: ["delta-quickstart", "delta-table"],
  },
  cdf: {
    why: "Change Data Feed expone cambios por versión para construir consumidores incrementales auditables.",
    bestPractices: ["Persiste el último límite procesado y diseña el consumidor para reintentos.", "Conserva claves y metadatos de cambio al validar inserciones, actualizaciones y borrados."],
    warnings: ["CDF no sustituye una estrategia de retención y recuperación.", "Un límite inicial fuera de la historia disponible impide reconstruir cambios anteriores."],
    prerequisites: "Tabla Delta con Change Data Feed habilitado antes de los cambios que se quieren observar.",
    evidence: "Filas de cambio con tipo y versión que corresponden a operaciones ejecutadas deliberadamente.",
    referenceIds: ["delta-cdf"],
  },
  optimization: {
    why: "La distribución física de archivos afecta lectura y coste sin cambiar la semántica lógica de la tabla.",
    bestPractices: ["Mide número y tamaño de archivos antes y después.", "Optimiza solo después de observar el patrón real de filtros y escrituras."],
    warnings: ["Compactar consume compute y no corrige un particionado lógico incorrecto.", "Opciones de optimización pueden variar entre Delta OSS y Databricks Runtime."],
    prerequisites: "Tabla de práctica con suficientes archivos y acceso a su historial o métricas.",
    evidence: "Comparación antes/después de archivos, plan o duración con la misma consulta.",
    referenceIds: ["delta-optimize"],
  },
  streaming: {
    why: "Un flujo incremental necesita límites, estado y checkpoints para ofrecer resultados repetibles ante fallos.",
    bestPractices: ["Asigna un checkpoint exclusivo y duradero por consulta.", "Define esquema, claves, watermark y disparador según el contrato de datos."],
    warnings: ["Reutilizar o borrar checkpoints puede duplicar o reprocesar datos.", "Una consulta activa consume recursos hasta detenerse explícitamente."],
    prerequisites: "Fuente incremental accesible y ubicación gobernada para checkpoints.",
    evidence: "Progreso de streaming con lotes procesados, checkpoint y salida sin duplicados inesperados.",
    referenceIds: ["dbx-structured-streaming", "spark-streaming"],
  },
  medallion: {
    why: "Separar Bronze, Silver y Gold conserva procedencia mientras aplica calidad y semántica de negocio de forma gradual.",
    bestPractices: ["Define el contrato y la evidencia de calidad de cada capa.", "Mantén Bronze reproducible y aplica deduplicación y reglas explícitas en Silver."],
    warnings: ["Los nombres de capas no garantizan calidad por sí solos.", "No mezcles datos sensibles de demostración con ubicaciones productivas."],
    prerequisites: "Catálogo o rutas aisladas y contrato conocido para las fuentes.",
    evidence: "Tablas por capa con linaje, recuentos y reglas de calidad verificadas.",
    referenceIds: ["dbx-medallion", "dbx-unity-catalog"],
  },
  governance: {
    why: "Catálogo, propiedad y permisos hacen que el dato sea descubrible y controlable más allá del notebook.",
    bestPractices: ["Usa nombres de tres niveles y mínimo privilegio.", "Documenta propietario, finalidad, clasificación y política de retención."],
    warnings: ["Crear objetos o conceder permisos requiere autoridad que el laboratorio no debe asumir.", "No uses datos sensibles reales para demostrar gobierno o clasificación."],
    prerequisites: "Unity Catalog habilitado y permisos limitados para crear o consultar objetos de práctica.",
    evidence: "Objeto gobernado con propietario, permisos y descripción inspeccionables.",
    referenceIds: ["dbx-unity-catalog"],
  },
  lineage: {
    why: "El linaje permite seguir dependencias y evaluar el impacto de un cambio de datos.",
    bestPractices: ["Ejecuta lecturas y escrituras sobre objetos gobernados para capturar relaciones.", "Comprueba el linaje a nivel de tabla y, cuando aplique, de columna."],
    warnings: ["El linaje observado depende de operaciones y superficies compatibles.", "Una integración externa puede necesitar permisos adicionales y no sustituye el control de acceso."],
    prerequisites: "Objetos de Unity Catalog y permisos para consultar linaje o metadatos.",
    evidence: "Relación de origen y destino visible y coherente con la operación ejecutada.",
    referenceIds: ["dbx-lineage", "dbx-unity-catalog"],
  },
  finops: {
    why: "Relacionar uso, precio e identidad permite atribuir coste y detectar oportunidades de eficiencia.",
    bestPractices: ["Conserva unidad, moneda y vigencia temporal al unir uso con precios.", "Separa coste observado de estimaciones y documenta reglas de reparto."],
    warnings: ["System tables pueden tener retraso y requieren permisos de cuenta.", "Una asignación proporcional es una decisión analítica, no una factura oficial."],
    prerequisites: "Acceso autorizado a system.billing y comprensión del periodo analizado.",
    evidence: "Consulta con periodo, unidad, regla de atribución y reconciliación del total.",
    referenceIds: ["dbx-system-billing", "spark-sql"],
  },
  validation: {
    why: "Las comprobaciones convierten una ejecución aparente en evidencia defendible sobre datos y comportamiento.",
    bestPractices: ["Formula expectativas sobre esquema, claves, nulos y recuentos.", "Haz que un incumplimiento produzca una señal inequívoca y contextualizada."],
    warnings: ["Un assert sobre una muestra no valida el conjunto completo.", "Evita expectativas dependientes del orden si este no está definido."],
    prerequisites: "Resultado de la operación anterior y criterio observable de aceptación.",
    evidence: "Comprobación reproducible que pasa con el resultado esperado y falla al introducir un caso inválido.",
    referenceIds: ["spark-dataframe"],
  },
  visualization: {
    why: "Una salida visual ayuda a explorar patrones, pero debe conservar contexto y escala para no inducir conclusiones falsas.",
    bestPractices: ["Acompaña la visualización con filtros, unidades y periodo.", "Valida las agregaciones antes de interpretar la forma del gráfico."],
    warnings: ["display, show o una tabla parcial son evidencia exploratoria, no una prueba completa.", "No expongas identificadores o valores sensibles en capturas."],
    prerequisites: "Resultado agregado y acotado con semántica y unidades conocidas.",
    evidence: "Vista etiquetada y reconciliada con una consulta de control.",
    referenceIds: ["dbx-notebooks", "spark-dataframe"],
  },
  cleanup: {
    why: "Retirar artefactos del laboratorio evita coste, colisiones y resultados contaminados en repeticiones posteriores.",
    bestPractices: ["Elimina solo objetos creados por el ejercicio y registra sus nombres.", "Haz la limpieza idempotente y confirma el ámbito antes de ejecutar."],
    warnings: ["DROP, rm y borrados recursivos son destructivos.", "No ejecutes limpieza con parámetros vacíos, comodines o catálogos compartidos."],
    prerequisites: "Inventario exacto de objetos creados y permiso limitado a la zona de práctica.",
    evidence: "Comprobación de que los objetos del laboratorio ya no existen y otros objetos permanecen intactos.",
    referenceIds: ["dbx-files", "spark-sql"],
  },
  photon: {
    why: "Photon acelera cargas compatibles mediante ejecución vectorizada, pero debe evaluarse con el mismo plan lógico y datos.",
    bestPractices: ["Compara la misma consulta, datos y configuración con métricas de ejecución.", "Confirma que los operadores relevantes se ejecutan en Photon."],
    warnings: ["Una afirmación de rendimiento sin medición comparable no es evidencia.", "La cobertura y disponibilidad dependen del runtime y del tipo de compute."],
    prerequisites: "Compute compatible y una consulta representativa con métricas accesibles.",
    evidence: "Comparación controlada del plan y métricas de ejecución.",
    referenceIds: ["dbx-photon"],
  },
  "unity-oss": {
    why: "La implementación abierta permite explorar contratos de catálogo e interoperabilidad fuera de un workspace administrado.",
    bestPractices: ["Aísla el servidor local y usa datos sin sensibilidad.", "Distingue la API OSS de las capacidades administradas de Unity Catalog en Databricks."],
    warnings: ["El quickstart local no demuestra paridad funcional ni operativa con el servicio administrado.", "No expongas el servidor de demostración sin autenticación y controles adecuados."],
    prerequisites: "Herramientas y puertos del quickstart disponibles en un entorno local aislado.",
    evidence: "Servidor local accesible y operación de catálogo reproducible con sus límites documentados.",
    referenceIds: ["unity-oss", "dbx-unity-catalog"],
  },
  azure: {
    why: "La integración con servicios Azure depende de identidad, red y permisos además del código del notebook.",
    bestPractices: ["Prefiere identidades administradas y mínimo privilegio.", "Separa nombres de recursos, credenciales y lógica de transformación."],
    warnings: ["El ejemplo puede crear consumo o modificar recursos externos.", "No copies identificadores, endpoints o credenciales del autor en tu entorno."],
    prerequisites: "Suscripción o recursos Azure de práctica, red e identidad configuradas.",
    evidence: "Acceso al recurso autorizado sin secretos visibles y con trazabilidad de la identidad usada.",
    referenceIds: ["azure-adls", "dbx-secrets"],
  },
  cdc: {
    why: "CDC conserva cambios de la fuente para actualizar destinos sin releer todo el conjunto.",
    bestPractices: ["Usa claves estables, offsets persistentes e idempotencia.", "Valida inserción, actualización, borrado, reintento y orden fuera de secuencia."],
    warnings: ["Cambiar de modo o checkpoint puede duplicar o perder cambios.", "La retención de la fuente limita desde qué punto puede recuperarse el flujo."],
    prerequisites: "Fuente CDC aislada, conectividad y credenciales administradas fuera del notebook.",
    evidence: "Secuencia controlada de cambios reflejada una sola vez en el destino.",
    referenceIds: ["cockroach-changefeed", "dbx-structured-streaming"],
  },
};

export type GuidePointSeed = {
  title: string;
  what: string;
  topic: GuideTopic;
  status?: NotebookGuideStatus;
};

export type GuideCellSeed = {
  sourceIndex: number;
  sourceDigest: string;
  points: readonly GuidePointSeed[];
  prerequisites?: readonly string[];
  expectedEvidence?: readonly string[];
};

function pointFromSeed(seed: GuidePointSeed): NotebookGuidePoint {
  const guidance = topicGuidance[seed.topic];
  return {
    title: seed.title,
    what: seed.what,
    why: guidance.why,
    bestPractices: [...guidance.bestPractices],
    warnings: [...guidance.warnings],
    status: seed.status ?? "current",
    referenceIds: [...guidance.referenceIds],
  };
}

function guideFromSeed(seed: GuideCellSeed): NotebookCellGuide {
  const points = seed.points.map(pointFromSeed);
  const topics = [...new Set(seed.points.map((point) => point.topic))];
  return {
    points,
    prerequisites: seed.prerequisites
      ? [...seed.prerequisites]
      : topics.map((topic) => topicGuidance[topic].prerequisites),
    expectedEvidence: seed.expectedEvidence
      ? [...seed.expectedEvidence]
      : topics.map((topic) => topicGuidance[topic].evidence),
  };
}

export function createNotebookGuideManifest(
  identity: Pick<NotebookGuideManifest, "resourceId" | "upstreamRef" | "path" | "reviewedAt">,
  seeds: readonly GuideCellSeed[],
): NotebookGuideManifest {
  const cells = seeds.map((seed) => ({
    sourceIndex: seed.sourceIndex,
    sourceDigest: seed.sourceDigest,
    guide: guideFromSeed(seed),
  }));
  const referenced = new Set(cells.flatMap((cell) => cell.guide.points.flatMap((point) => point.referenceIds)));
  return {
    ...identity,
    references: notebookGuideReferences.filter((reference) => referenced.has(reference.id)),
    cells,
  };
}

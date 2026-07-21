import type { LessonDeepDive, ModuleContentPack } from "./content-types";

const reviewedAt = "21 jul 2026";

function deepDive(
  mentalModel: string,
  mechanics: [string, string],
  concepts: [
    [term: string, definition: string, whyItMatters: string],
    [term: string, definition: string, whyItMatters: string],
    [term: string, definition: string, whyItMatters: string],
  ],
  situation: string,
  reasoning: [string, string, string],
  outcome: string,
): LessonDeepDive {
  return {
    mentalModel,
    mechanics,
    concepts: concepts.map(([term, definition, whyItMatters]) => ({ term, definition, whyItMatters })) as LessonDeepDive["concepts"],
    workedScenario: { situation, reasoning, outcome },
  };
}

const deepDives = {
  m13l1: deepDive(
    "Imagina Structured Streaming como un motor de consultas incrementales que avanza una frontera de datos confirmados, no como un bucle que vuelve a ejecutar una consulta batch completa. `readStream` declara una fuente cuyo final se mueve; las transformaciones construyen un plan lógico y `writeStream` crea una consulta activa. En cada microbatch, Spark determina un rango nuevo de entrada, ejecuta solo ese delta y coordina el resultado con el checkpoint. La API parece idéntica a DataFrames batch porque comparte álgebra, pero la viabilidad cambia: una proyección es stateless, mientras que contar por cliente obliga a recordar información entre lotes. Por eso una solución de producción se diseña alrededor de tres fronteras: qué progreso ofrece la fuente, cuánto estado requiere el plan y cómo confirma el sink. El trigger regula cuándo se intenta avanzar; no garantiza por sí mismo latencia, capacidad ni exactamente una vez.",
    [
      "Al iniciar la consulta, Spark materializa el plan incremental y pide a cada fuente su último offset disponible. Para el lote N registra primero qué rango pretende leer, ejecuta las particiones, actualiza operadores stateful si existen y solicita al sink que publique el resultado. Cuando la escritura termina, anota el commit del lote en el checkpoint. En el siguiente trigger parte del límite confirmado, no de una exploración completa de la tabla. Esta secuencia permite reanudar tras un fallo del driver y explica por qué una misma consulta necesita una ubicación de checkpoint exclusiva y durable.",
      "El coste y la latencia emergen del volumen acumulado, la distribución de claves, los shuffles, el estado y la velocidad del destino. Si el lote tarda más que el intervalo configurado, los triggers no se ejecutan en paralelo para recuperar mágicamente el retraso: la siguiente ejecución comienza al quedar libre el motor. Una transformación batch que necesita todo el historial, como un orden global sin límite, puede ser inválida o generar estado ilimitado. El diseño debe acotar la semántica mediante ventanas, watermarks o una etapa batch posterior, y debe asumir que una tarea puede repetirse después de un fallo.",
    ],
    [
      ["Consulta incremental", "Plan que procesa únicamente el rango de entrada aún no confirmado y conserva continuidad entre ejecuciones.", "Evita razonar como si cada trigger recalculara toda la fuente y permite estimar coste y recuperación correctamente."],
      ["Microbatch", "Unidad transaccional de progreso que agrupa un rango de offsets, su cómputo y el intento de escritura al sink.", "Es la frontera práctica para reintentos, métricas, idempotencia y diagnóstico de latencia."],
      ["Operador stateful", "Transformación que mantiene información de lotes anteriores, como una agregación, deduplicación o join stream-stream.", "Su estado condiciona memoria, checkpoint, compatibilidad de cambios y necesidad de watermarks."],
    ],
    "Una plataforma de comercio recibe eventos de pedidos las veinticuatro horas, promete disponibilidad silver en menos de cinco minutos y debe sobrevivir a la caída del driver sin duplicar ingresos.",
    [
      "Clasificar el filtro y la selección como stateless, pero reconocer que una deduplicación por `order_id` conserva estado y necesita un horizonte de tardanza.",
      "Elegir un sink Delta y un checkpoint exclusivo en almacenamiento gobernado, midiendo que cada microbatch termine holgadamente dentro del SLA.",
      "Probar un fallo después de iniciar la escritura y verificar que el reinicio retoma offsets confirmados y deja una sola versión lógica de cada pedido.",
    ],
    "El pipeline avanza solo sobre eventos nuevos, recupera su estado desde el checkpoint y cumple el SLA con una semántica de publicación demostrable, no asumida.",
  ),
  m13l2: deepDive(
    "Un trigger es una política de servicio para una consulta incremental: decide cuándo pedir al motor que avance, pero no cambia la semántica del plan ni fabrica capacidad. `processingTime` mantiene la consulta activa y busca una cadencia recurrente; `availableNow` captura los datos disponibles para esa ejecución, los procesa en tantos microbatches como requieran los límites de la fuente y termina. La elección se parece a decidir entre un servicio residente y un trabajo incremental finito. Debe partir del SLA de frescura, la forma en que llegan los datos, el tiempo de arranque del compute y el coste de mantener recursos ociosos. Un intervalo de diez segundos no significa diez segundos de latencia si cada lote tarda dos minutos. Del mismo modo, `availableNow` no significa batch completo: conserva offsets, checkpoints y procesamiento incremental entre ejecuciones orquestadas.",
    [
      "Con `processingTime`, al finalizar un microbatch el planificador compara el reloj con la siguiente cadencia. Si el lote anterior consumió todo el intervalo, inicia el siguiente tan pronto como puede; no solapa dos lotes de la misma consulta. Con `availableNow`, la fuente fija una frontera alcanzable al comienzo de la ejecución. Spark puede subdividir el backlog según opciones como límites de archivos u offsets, confirma cada subdivisión y detiene la consulta cuando alcanza esa frontera. La próxima ejecución abre el mismo checkpoint y pide únicamente lo posterior al último commit.",
      "Una consulta residente reduce la latencia de arranque y se adapta a llegadas continuas, pero consume capacidad incluso con tráfico bajo y necesita operación permanente. Un trabajo `availableNow` libera compute y encaja con Jobs, aunque su frescura mínima incluye la frecuencia del trigger externo más el arranque y el procesamiento. Backlogs grandes requieren límites para no crear lotes inmanejables; límites demasiado pequeños multiplican overhead. En ambos modos, un sink lento, una partición Kafka caliente o un state store sobredimensionado dominan la duración y deben diagnosticarse antes de acortar la cadencia.",
    ],
    [
      ["Processing time trigger", "Política que intenta iniciar microbatches repetidamente con una cadencia temporal mientras la consulta permanece activa.", "Permite relacionar latencia continua con capacidad, pero no garantiza que cada lote termine dentro del intervalo."],
      ["Available Now", "Trigger finito que procesa incrementalmente el conjunto disponible al inicio y termina tras confirmar todos sus microbatches.", "Es la opción clave para cargas incrementales orquestadas que deben liberar compute sin perder checkpoints."],
      ["Frontera de ejecución", "Límite superior de entrada que una ejecución concreta se compromete a alcanzar antes de finalizar.", "Distingue los datos pertenecientes al run actual de los que quedarán para el siguiente y hace reproducible un backfill."],
    ],
    "Un retailer recibe archivos en ráfagas durante la noche; el dataset debe estar listo cada quince minutos, pero mantener un cluster activo durante horas sin archivos resulta costoso.",
    [
      "Calcular la frescura como frecuencia de Job más tiempo de arranque y duración p95, comprobando que cabe dentro de quince minutos.",
      "Usar `availableNow` con checkpoint estable y límites de entrada para dividir ráfagas sin convertirlas en un único lote desmesurado.",
      "Alertar si una ejecución no vacía su frontera antes del siguiente horario, porque entonces la cadencia solicitada supera la capacidad efectiva.",
    ],
    "La carga conserva progreso incremental, termina cuando no queda backlog de su ejecución y reduce coste ocioso sin prometer una latencia que el compute no puede sostener.",
  ),
  m13l3: deepDive(
    "El checkpoint es la memoria transaccional y operativa de una consulta streaming. No es un simple caché que pueda eliminarse para solucionar errores: contiene la identidad del plan, los rangos de fuente observados, los lotes comprometidos y, cuando hay operadores stateful, el esquema y contenido del estado. Piensa en él como el diario que permite responder qué se leyó, qué se publicó y qué debe restaurarse. La ruta pertenece a una única consulta lógica y a una versión compatible de su topología. Cambiar el topic, el tipo de fuente, el sink, las claves de agregación o el esquema del state store puede invalidar esa continuidad. En ese caso, un checkpoint nuevo no es una reparación neutra; crea una consulta nueva y obliga a decidir explícitamente desde qué punto reponer datos y cómo reconciliar la salida existente.",
    [
      "Antes de ejecutar un microbatch, el offset log conserva los límites que se van a procesar. Después de una escritura satisfactoria, el commit log marca el lote como completado. Los operadores stateful persisten versiones del state store ligadas al batch; durante el reinicio, Spark reconstruye la versión confirmada y continúa con el offset siguiente. Si el proceso cae entre escritura y commit, el protocolo y la idempotencia del sink determinan si repetir el lote conserva el mismo resultado. La durabilidad del directorio es por ello una dependencia de disponibilidad de producción.",
      "Spark valida parte de la compatibilidad al restaurar, pero no puede garantizar que todo cambio de código conserve la intención de negocio. Añadir un filtro puede arrancar con el mismo checkpoint, aunque cambia qué filas futuras se publican; modificar claves stateful suele requerir un estado nuevo. Una migración segura congela la versión anterior, determina un offset o versión de corte, construye la nueva salida desde datos retenidos y compara invariantes antes de cambiar consumidores. Borrar el checkpoint sin esa secuencia puede reingerir todo, saltar historia ya expirada o dejar dos verdades incompatibles.",
    ],
    [
      ["Offset log", "Registro por microbatch de los límites de entrada que la consulta ha planificado y procesado.", "Permite retomar desde una posición precisa y diagnosticar si el problema está antes o después de leer la fuente."],
      ["Commit log", "Registro de lotes cuya salida se considera confirmada para la consulta.", "Separa un intento incompleto de un avance durable y participa en la prevención de reprocesados indebidos."],
      ["Compatibilidad de estado", "Condición por la que la topología, claves, esquema y proveedor del state store pueden restaurarse con un checkpoint existente.", "Determina si un despliegue puede reanudar o necesita migración y reconstrucción deliberadas."],
    ],
    "Un equipo quiere añadir una segunda clave a una agregación de fraude y propone reutilizar el checkpoint de producción para evitar reprocesar seis meses de eventos.",
    [
      "Reconocer que cambiar las claves modifica el esquema y significado del estado, por lo que la restauración con el checkpoint actual no es compatible.",
      "Crear una versión nueva con checkpoint y destino separados, reconstruyéndola desde la retención disponible hasta un offset de corte documentado.",
      "Comparar totales y alertas durante una ejecución paralela antes de cambiar la vista consumida y conservar el estado antiguo para rollback.",
    ],
    "La actualización se convierte en una migración auditable, sin corromper el state store ni confundir un arranque limpio con una continuidad real.",
  ),
  m13l4: deepDive(
    "Exactly-once no es una propiedad que la fuente Kafka, el checkpoint o Delta puedan declarar aisladamente; es un resultado extremo a extremo. Spark puede volver a presentar un microbatch cuando no sabe si el intento anterior quedó publicado. Un sink transaccional integrado puede reconocer el lote y coordinarlo con el progreso, mientras que una API REST, un correo o dos destinos independientes no participan automáticamente en ese protocolo. Por eso el modelo mental correcto separa entrega de procesamiento: at-least-once admite reintentos y posible repetición; idempotencia hace que repetir produzca el mismo estado final. `foreachBatch` ofrece toda la expresividad batch, incluido `MERGE`, pero traslada al autor la responsabilidad de claves, orden y atomicidad. Un `batch_id` identifica un intento lógico de la consulta; una clave de negocio identifica el hecho y suele sobrevivir mejor a reconstrucciones con un checkpoint nuevo.",
    [
      "En cada microbatch, Spark llama a la función `foreachBatch` con un DataFrame y un identificador monotónico dentro de ese checkpoint. Si la función termina, el motor puede registrar el commit; si el driver falla en la frontera, el mismo `batch_id` puede invocarse otra vez. Un `MERGE` determinista por clave puede convertir el reintento en un no-op lógico, siempre que se resuelvan previamente múltiples cambios de la misma clave. Para APIs externas, se envía una clave idempotente persistente o se usa un ledger transaccional que registre solicitudes ya aceptadas.",
      "Escribir dos sinks dentro de una función no crea una transacción distribuida: el primero puede confirmar y el segundo fallar. Repetir resolverá la divergencia solo si ambos toleran duplicados y el orden no cambia el resultado. Persistir `batch_df` evita recomputaciones cuando se realizan varias acciones, pero añade memoria y no resuelve atomicidad. Si la salida exige consistencia fuerte entre destinos, el patrón más seguro es confirmar una tabla Delta canónica y dejar que consumidores independientes, cada uno con su checkpoint, publiquen los efectos secundarios de manera idempotente.",
    ],
    [
      ["At-least-once", "Garantía de que un registro no se pierde, aunque un fallo pueda provocar uno o más intentos de entrega.", "Obliga a diseñar consumidores que toleren repetición en vez de inferir unicidad por la existencia del checkpoint."],
      ["Idempotencia", "Propiedad por la que aplicar varias veces la misma operación deja el mismo estado que aplicarla una vez.", "Convierte reintentos inevitables en recuperación segura para `MERGE`, APIs y efectos externos."],
      ["Clave de negocio", "Identificador estable del hecho o entidad, independiente del lote y del intento técnico que lo transporta.", "Permite deduplicar incluso después de reconstruir una consulta con otro checkpoint o redistribuir eventos."],
    ],
    "Un flujo de pagos actualiza una tabla Delta y llama a un proveedor de notificaciones; el proceso cae después de aceptar el mensaje externo pero antes de confirmar el microbatch.",
    [
      "Asumir que el lote se repetirá y que el checkpoint por sí solo no puede deshacer una llamada ya aceptada por un sistema externo.",
      "Usar `payment_id` como clave idempotente del proveedor y hacer `MERGE` determinista en la tabla canónica, registrando el estado de publicación.",
      "Separar la notificación en un consumidor de la tabla Delta si se necesita aislar fallos y reintentar el efecto sin reejecutar la transformación principal.",
    ],
    "El fallo produce un reintento observable, pero ni el saldo ni la notificación se duplican porque cada frontera externa reconoce la identidad del pago.",
  ),
  m13l5: deepDive(
    "Observar streaming consiste en reconstruir una cadena causal entre llegada, procesamiento, estado y publicación. Que una consulta esté `ACTIVE` solo dice que el driver no ha terminado; no demuestra que reciba eventos, avance offsets ni cumpla la frescura de negocio. El progreso de cada microbatch aporta una instantánea: filas y bytes de entrada, tasas, duración por fase, offsets y métricas de operadores stateful. La lectura correcta compara series, no una sola muestra. Si la entrada supera sostenidamente al proceso, crece el backlog; si ambos son bajos pero la duración es alta, puede dominar el sink, el arranque o un operador sin filas. La frescura se mide con event time del último dato válido frente al reloj y debe complementarse con completitud, fallos de calidad y latencia del consumidor. Así, cada alerta conduce a una hipótesis comprobable en vez de a reinicios ciegos.",
    [
      "Tras cada trigger, `StreamingQueryProgress` expone el identificador de lote, marcas temporales, tasas calculadas, duración de planificación y ejecución, descripciones de fuentes y sinks, y `stateOperators`. Estas métricas pueden serializarse a una tabla de operaciones. Para Kafka se correlacionan con offsets y lag; para archivos, con el backlog de archivos o bytes. Una métrica de frescura robusta calcula `current_timestamp - max(event_time)` sobre la salida publicada, diferenciando una fuente quieta por diseño de una ingestión bloqueada mediante una expectativa de actividad.",
      "Las tasas instantáneas son ruidosas: un microbatch que vacía una ráfaga puede mostrar gran capacidad y el siguiente cero. Se usan percentiles y ventanas sostenidas alineadas con el SLA. Un estado que aumenta sin que el watermark avance sugiere datos tardíos, una partición de entrada detenida o umbral excesivo; un `processedRowsPerSecond` alto con sink lento puede ocultar que el commit domina. Escalar compute ayuda solo cuando las fases paralelizables están saturadas. Antes hay que descartar throttling de la fuente, skew, archivos pequeños, API externa lenta y límites configurados deliberadamente.",
    ],
    [
      ["Backlog", "Cantidad de datos disponibles en la fuente que todavía no forman parte de un commit confirmado de la consulta.", "Distingue falta de capacidad de ausencia de datos y permite estimar tiempo de recuperación."],
      ["Frescura", "Diferencia entre el reloj de observación y el event time más reciente que llegó correctamente al producto de datos.", "Mide el SLA percibido por el consumidor, que no se deriva del simple estado activo del proceso."],
      ["State operator metric", "Métrica por operador sobre filas mantenidas, actualizadas, eliminadas y memoria o almacenamiento del estado.", "Revela crecimiento no acotado y separa problemas stateful de cuellos en fuente o sink."],
    ],
    "Un dashboard muestra ventas con cuarenta minutos de retraso aunque el Job está verde y la consulta aparece activa; operaciones propone duplicar workers inmediatamente.",
    [
      "Comparar offsets pendientes y tasas durante varios lotes para comprobar si existe backlog o si la fuente dejó de producir eventos.",
      "Desglosar `durationMs` y `stateOperators`, y calcular la frescura del máximo `event_ts` publicado para localizar sink lento o estado creciente.",
      "Aplicar la acción específica —reparticionar, ajustar estado, reparar sink o escalar— y verificar que la tendencia recupera el SLA antes de cerrar la alerta.",
    ],
    "El runbook identifica el cuello real y restaura frescura con una intervención medible, evitando gastar más compute cuando la causa está fuera del motor.",
  ),
  m14l1: deepDive(
    "Event time y processing time responden preguntas diferentes. Event time pertenece al hecho: cuándo ocurrió la compra, lectura o clic según el productor. Processing time pertenece a la plataforma: cuándo el evento fue observado y transformado. En un sistema distribuido, reintentos, desconexiones móviles, buffers y particiones hacen que el orden de llegada difiera del orden de negocio. Structured Streaming no puede corregir ese desorden mirando el reloj del cluster; necesita una columna de event time válida y una política explícita de tardanza. El modelo mental útil es una línea temporal que avanza con evidencia imperfecta: cada fuente revela máximos observados, el watermark deriva una frontera conservadora y los operadores deciden cuándo dejar de esperar. Antes de agregar, hay que normalizar zona horaria, precisión, valores imposibles y semántica del productor, porque un timestamp incorrecto puede adelantar la frontera y expulsar datos legítimos.",
    [
      "El payload se deserializa con un esquema que convierte la marca del productor a `timestamp`. Spark asocia metadatos de watermark a esa columna cuando se llama `withWatermark`. Los operadores stateful posteriores usan el máximo event time observado menos el retraso configurado para determinar qué estado ya no necesita conservarse. El processing time sigue gobernando cuándo se ejecutan triggers y timeouts de ese tipo, pero no debe reemplazar el event time en ventanas de negocio. Los eventos tardíos aceptables actualizan ventanas existentes; los demasiado antiguos pueden descartarse según el operador y modo de salida.",
      "Una fuente con relojes defectuosos puede emitir una fecha futura y mover prematuramente su máximo, causando pérdida aparente de eventos normales. La defensa incluye validación de rangos, cuarentena y métricas de skew entre event y ingestion time. Convertir todas las zonas a UTC preserva comparabilidad, pero la zona de negocio puede seguir siendo necesaria para cortes diarios. Un umbral de tardanza corto reduce estado y latencia; uno largo aumenta corrección histórica y coste. La decisión se basa en la distribución real de retrasos y en el coste de corregir datos fuera de ventana.",
    ],
    [
      ["Event time", "Instante en que ocurrió el hecho según el dominio productor, transportado como parte del evento.", "Es la base correcta para ventanas, orden de negocio y análisis reproducible pese a retrasos de red."],
      ["Processing time", "Instante en que el motor recibe o procesa el evento en una ejecución concreta.", "Sirve para operación y triggers, pero produce resultados dependientes de retrasos y reejecuciones si se usa como tiempo de negocio."],
      ["Ingestion time", "Marca añadida al entrar en una frontera controlada de la plataforma.", "Permite medir retraso y detectar relojes anómalos sin sustituir la semántica del event time."],
    ],
    "Sensores de tres países envían lecturas con zona local, algunos dispositivos quedan offline seis horas y uno adelanta su reloj dos días tras una actualización defectuosa.",
    [
      "Convertir el timestamp con la zona declarada a UTC y conservar ingestion time para medir la distribución de retrasos por dispositivo.",
      "Cuarentenar fechas futuras o imposibles antes de aplicar el watermark, evitando que un máximo espurio adelante la frontera global.",
      "Elegir el umbral según percentiles de retraso y definir una ruta de corrección para el pequeño porcentaje que llegue fuera de ventana.",
    ],
    "Las ventanas representan cuándo ocurrieron las lecturas, el estado queda acotado y un reloj roto no provoca la eliminación silenciosa de datos válidos.",
  ),
  m14l2: deepDive(
    "Una ventana transforma un flujo infinito en grupos temporales finitos; un watermark proporciona la evidencia para dejar de mantener algunos de esos grupos. No es un temporizador que espera exactamente N minutos después de cada evento ni una promesa de que todo lo anterior se descartará en un instante preciso. Spark observa el máximo event time visto y resta el retraso configurado para obtener una frontera. Una ventana cuyo final queda suficientemente atrás puede cerrarse y su estado eliminarse según el modo de salida. El compromiso es explícito: ampliar la tardanza protege más eventos desordenados, pero conserva más claves y ventanas, aumenta checkpoint y retrasa resultados finales. Reducirla mejora coste y latencia a cambio de una ruta de excepciones. La columna marcada debe ser la misma que alimenta `window`; perder su metadato mediante expresiones mal ubicadas puede impedir el comportamiento esperado.",
    [
      "En una agregación, cada microbatch asigna filas a ventanas usando event time, busca o crea las claves correspondientes en el state store y actualiza acumuladores. El watermark se calcula a partir del máximo observado menos el delay. En append mode, un resultado puede publicarse cuando la ventana se considera final y el estado puede evacuarse; en update mode se emiten cambios compatibles mientras la ventana sigue abierta. Complete mode conserva y reescribe todo el resultado, por lo que no ofrece el mismo beneficio de eliminación. El progreso reporta filas actualizadas y eliminadas para verificar el efecto real.",
      "Con varias fuentes, cada una mantiene su watermark y Spark deriva una frontera global. La política predeterminada conservadora avanza con la fuente más lenta, evitando marcar sus datos como tardíos pero retrasando salida y limpieza de estado. Una política basada en la fuente más rápida reduce latencia a costa de descartar datos del stream rezagado, y solo se justifica con un contrato explícito. Una partición inactiva, relojes desalineados o eventos futuros alteran la progresión; por eso se monitorizan máximo event time, watermark y tamaño de estado conjuntamente.",
    ],
    [
      ["Ventana tumbling", "Intervalos contiguos de tamaño fijo sin solapamiento, donde cada evento pertenece a una sola ventana.", "Simplifica totales por minuto u hora y limita el número de acumuladores activos por clave."],
      ["Ventana sliding", "Intervalos de tamaño fijo iniciados con una cadencia menor, de modo que un evento puede pertenecer a varias ventanas.", "Permite métricas móviles, pero multiplica actualizaciones y estado respecto a una ventana tumbling."],
      ["Watermark", "Frontera derivada del máximo event time observado menos una tolerancia de tardanza.", "Da al motor una condición para limpiar estado y al negocio una política cuantificable sobre datos tardíos."],
    ],
    "Un sistema de fraude calcula conteos de diez minutos cada minuto y debe tolerar eventos móviles que llegan hasta treinta minutos tarde en el 99,8 % de los casos.",
    [
      "Reconocer que la ventana sliding replica cada evento en varias ventanas y dimensionar estado por claves activas, solapamiento y treinta minutos de tolerancia.",
      "Aplicar el watermark sobre la columna de evento validada antes de agrupar, seleccionando un modo de salida compatible con el consumo de resultados parciales.",
      "Medir filas eliminadas del state store y enrutar el 0,2 % fuera de ventana a una corrección batch en lugar de aumentar indefinidamente el delay.",
    ],
    "El detector entrega métricas móviles con tardanza controlada, coste de estado previsible y una política explícita para excepciones extremas.",
  ),
  m14l3: deepDive(
    "Deduplicar un stream significa recordar identidades ya observadas durante el periodo en que todavía podrían repetirse. Sin un límite, cualquier identificador histórico podría reaparecer y el state store tendría que crecer para siempre. El watermark acota esa obligación temporal, pero la clave y el timestamp deben representar el contrato real. `dropDuplicatesWithinWatermark` está pensado para mantener la clave dentro del horizonte aun cuando los duplicados lleven timestamps ligeramente distintos; combinar `dropDuplicates` con una columna temporal en la clave puede tratar cada timestamp como un registro diferente. La deduplicación técnica tampoco reemplaza la idempotencia del destino: un evento puede salir una sola vez de este operador y aun así repetirse por un fallo en una llamada externa. Primero se decide qué constituye el mismo hecho, cuánto tiempo puede repetirse y qué hacer con una repetición más antigua que la retención.",
    [
      "Para cada fila, el operador deriva la clave de deduplicación, consulta el state store y decide si es nueva. Si no existe, la registra y deja pasar la fila; si ya existe dentro del estado retenido, la descarta. El watermark sobre event time permite eliminar claves cuya ventana de posible repetición ha expirado. El estado y sus cambios se checkpointan por microbatch, de modo que un reinicio no olvida inmediatamente las identidades. La métrica de filas descartadas debe distinguir duplicados esperados de un productor defectuoso que reenvía volúmenes anómalos.",
      "El horizonte debe cubrir el máximo intervalo de reintento upstream, no solo el retraso promedio. Aumentarlo eleva cardinalidad, almacenamiento y duración de checkpoint; reducirlo hace que duplicados muy tardíos vuelvan a considerarse nuevos. Si existe una tabla de negocio con clave única lógica, un `MERGE` posterior añade una segunda barrera y permite reconciliar historia completa. Para eventos sin identificador, construir una huella de todas las columnas es frágil ante campos mutables; conviene corregir el contrato en origen o definir una clave compuesta estable y documentada.",
    ],
    [
      ["Clave de deduplicación", "Conjunto mínimo de atributos que identifica de forma estable un único hecho de negocio.", "Una clave incorrecta elimina eventos legítimos o deja pasar reintentos como si fueran hechos distintos."],
      ["Horizonte de deduplicación", "Periodo durante el cual el motor conserva una clave porque todavía acepta la llegada de una repetición.", "Controla directamente el equilibrio entre corrección ante reintentos tardíos y tamaño del state store."],
      ["dropDuplicatesWithinWatermark", "Operador que deduplica por claves dentro de la tolerancia temporal marcada sin exigir el timestamp como parte de la identidad.", "Resuelve productores que reemiten el mismo identificador con pequeñas variaciones temporales y mantiene estado acotado."],
    ],
    "Una pasarela conserva eventos durante incidencias y puede reenviarlos durante 48 horas; cada reintento mantiene `event_id`, pero actualiza el timestamp de transmisión.",
    [
      "Definir `event_id` como identidad y usar el tiempo de negocio validado para un watermark superior al contrato de reintento de 48 horas.",
      "Evitar incluir el timestamp de transmisión en la clave, porque convertiría cada reenvío en una identidad distinta.",
      "Añadir `MERGE` por `event_id` en la tabla canónica y alertar sobre tasas de duplicados para detectar tormentas de reintentos.",
    ],
    "Los reenvíos normales se absorben durante el horizonte, el estado no crece indefinidamente y el destino conserva una barrera histórica adicional.",
  ),
  m14l4: deepDive(
    "Un join stream-stream intenta emparejar dos conjuntos que nunca dejan de crecer. Una igualdad de clave no basta para saber cuándo eliminar una fila no emparejada: en teoría, su pareja podría llegar años después. Para acotar estado se necesitan watermarks en las entradas y una condición temporal que limite qué pares son válidos, por ejemplo una impresión ocurrida entre cero y treinta minutos antes de una compra. El motor combina esas restricciones para decidir cuándo un evento ya no puede encontrar pareja futura. Los inner joins pueden ejecutarse sin watermark, pero retendrían estado sin límite; los outer joins necesitan límites para determinar cuándo emitir el lado nulo. El modelo mental es doble: la clave reduce candidatos y el intervalo temporal cierra la búsqueda. El watermark global y la fuente más lenta condicionan cuándo se limpia y cuándo aparecen resultados no emparejados.",
    [
      "Cada microbatch inserta nuevas filas de ambos streams en state stores indexados por las claves de igualdad y busca coincidencias contra el estado opuesto. La expresión temporal filtra pares fuera del intervalo permitido. Con watermarks, Spark estima cuándo una fila de un lado es demasiado antigua para que un evento futuro del otro pueda satisfacer la condición; entonces la elimina. En outer join, solo en ese momento puede emitir de forma segura una fila con null para el lado ausente. El modo admitido es append, porque los pares confirmados se publican incrementalmente.",
      "Los retrasos asimétricos requieren watermarks distintos y un rango basado en conocimiento del dominio. Una tolerancia amplia conserva más datos y eleva estado; una estrecha pierde coincidencias legítimas. Skew en una clave popular produce particiones calientes aunque la retención sea finita. Antes del join se filtran campos inválidos, se deduplican identidades y, cuando una dimensión cambia lentamente pero no es un stream equivalente, puede preferirse un join stream-static con snapshot controlado. Una fuente detenida puede frenar el watermark global y retrasar la limpieza, por lo que debe monitorizarse separadamente.",
    ],
    [
      ["Condición temporal", "Predicado que limita la diferencia permitida entre los event times de dos filas candidatas al join.", "Hace posible demostrar que una fila antigua ya no podrá emparejarse y permite limpiar su estado."],
      ["Watermark global", "Frontera derivada de los watermarks de varias entradas que gobierna operadores stateful conjuntos.", "Explica por qué una fuente lenta puede retener estado y retrasar salidas aunque la otra avance."],
      ["Stream-static join", "Join entre un flujo incremental y una relación batch leída como referencia durante la consulta.", "Suele requerir menos estado que stream-stream y es apropiado cuando un lado no necesita emparejamiento temporal continuo."],
    ],
    "Publicidad quiere atribuir compras a impresiones del mismo usuario ocurridas durante los treinta minutos anteriores, admitiendo dos horas de retraso en móviles y diez minutos en compras.",
    [
      "Aplicar watermarks específicos a ambos event times y expresar igualdad de usuario más el intervalo impresión ≤ compra ≤ impresión + treinta minutos.",
      "Estimar estado con las tolerancias asimétricas y vigilar claves de usuarios anómalamente activos para detectar skew.",
      "Probar eventos en los bordes y una fuente detenida, verificando cuándo se limpian filas y cómo progresa el watermark global.",
    ],
    "La atribución conserva solo candidatos temporalmente posibles y produce coincidencias reproducibles sin un state store ilimitado.",
  ),
  m14l5: deepDive(
    "El state store es una base de datos incremental local y checkpointada que materializa la memoria de agregaciones, deduplicaciones y joins. Su tamaño no depende solo de filas por segundo: depende del número de claves vivas, ventanas simultáneas, versiones por clave, retraso aceptado y velocidad con que el watermark permite evacuar. Por eso un stream de bajo volumen pero millones de dispositivos únicos puede ser más difícil que uno denso con pocas claves. Las métricas deben leerse como un balance: filas actualizadas entran, filas eliminadas salen y el total retenido refleja la deuda de estado. Memoria, latencia de commit y tamaño de checkpoint crecen de manera distinta según el proveedor. RocksDB con changelog checkpointing puede reducir presión y duración de checkpoints en cargas stateful, pero cambiar el mecanismo de estado de una consulta ya iniciada puede exigir un checkpoint nuevo y reconstrucción.",
    [
      "Durante un microbatch, cada operador stateful restaura o abre una versión del store, realiza lecturas y actualizaciones por clave y crea una nueva versión consistente con el lote. El checkpoint conserva los metadatos y cambios necesarios para recuperación. `stateOperators` reporta filas totales, actualizadas y eliminadas, además de memoria y métricas personalizadas del proveedor. Si el watermark avanza y `numRowsRemoved` permanece siempre en cero, puede haber una columna mal marcada, un modo incompatible o una condición que nunca permite cerrar el estado.",
      "El tuning empieza por semántica: reducir cardinalidad con claves correctas, filtrar antes del operador, acortar tolerancia según evidencia y evitar ventanas solapadas innecesarias. Después se dimensiona particionado y proveedor de estado. Reparticionar arbitrariamente puede cambiar distribución y recuperación; la migración se prueba con copias de producción. Changelog checkpointing reduce la necesidad de subir snapshots completos en cada lote, a cambio de una reconstrucción que combina snapshot y cambios. Ninguna opción compensa un estado conceptualmente ilimitado; ese requisito debe rediseñarse o trasladarse a una tabla durable y procesamiento incremental diferente.",
    ],
    [
      ["State store", "Almacén versionado por operador que mantiene claves y valores necesarios entre microbatches y participa en la recuperación.", "Es el principal determinante de estabilidad para operaciones stateful y debe dimensionarse como parte del diseño, no al final."],
      ["Cardinalidad viva", "Número de claves y ventanas que todavía no pueden eliminarse según la política temporal del operador.", "Predice mejor el tamaño del estado que el throughput bruto de entrada."],
      ["Changelog checkpointing", "Estrategia que persiste cambios del estado entre snapshots periódicos en lugar de cargar un snapshot completo en cada checkpoint.", "Puede reducir latencia de checkpoint para grandes estados RocksDB, pero requiere una decisión de arquitectura y recuperación compatible."],
    ],
    "Un contador por dispositivo procesa pocas lecturas por minuto, pero el state store crece hasta cientos de millones de claves y los checkpoints superan el SLA nocturno.",
    [
      "Correlacionar filas totales y eliminadas con el watermark para confirmar que dispositivos inactivos permanecen vivos por una tolerancia demasiado amplia.",
      "Revisar si el negocio necesita estado por dispositivo indefinido; mover el valor vigente a Delta y limitar la agregación streaming a ventanas finitas.",
      "Evaluar RocksDB con changelog checkpointing en una consulta versionada y medir recuperación, latencia y coste antes del cutover.",
    ],
    "El rediseño limita cardinalidad viva, conserva historia en almacenamiento durable y devuelve checkpoints y recuperación a objetivos operables.",
  ),
  m15l1: deepDive(
    "Kafka no entrega objetos de negocio; entrega registros ordenados dentro de particiones, identificados por topic, partición y offset, con key, value, headers y timestamps en representación binaria. El consumidor debe preservar primero ese sobre técnico y deserializar después el payload con un contrato versionado. El offset no es un identificador global ni representa el orden entre particiones: solo avanza dentro de una partición concreta. La key influye en el particionado del productor y, por tanto, en qué entidades comparten orden. Structured Streaming proyecta esos metadatos como columnas y conserva su progreso en el checkpoint. Eliminarlos antes de validar dificulta auditar duplicados, reconstruir un rango o localizar un productor defectuoso. Una arquitectura robusta mantiene una capa bronze con bytes y metadatos inmutables, añade resultado de parsing y errores, y solo promueve a silver los eventos que satisfacen el contrato.",
    [
      "El conector crea una partición de entrada por partición Kafka relevante y pide rangos de offsets para cada microbatch. Spark recibe `key` y `value` binarios junto con `topic`, `partition`, `offset`, `timestamp` y otros metadatos. La deserialización convierte `value` mediante `from_json`, Avro o Protobuf y produce campos tipados; una estructura de corrupt record o una ruta explícita captura fallos. Conservar topic-partition-offset permite formar una clave técnica única del registro y comprobar que un replay leyó exactamente el rango pretendido.",
      "El orden por entidad solo se mantiene si el productor usa una key estable que la enruta a la misma partición. Aumentar particiones puede redistribuir claves futuras y no crea orden global. Headers y versión de esquema ayudan a elegir el decoder sin probar formatos a ciegas. El timestamp de Kafka puede representar creación o ingestión según configuración del broker y no debe confundirse automáticamente con event time del dominio. El diseño valida también tamaño, compresión y poison pills para impedir que un único payload incompatible detenga continuamente el lote.",
    ],
    [
      ["Topic-partition-offset", "Coordenada única de un registro dentro de la retención de un topic Kafka.", "Permite auditoría, replay preciso y deduplicación técnica sin asumir un offset global inexistente."],
      ["Record key", "Bytes usados normalmente por el productor para elegir partición y agrupar el orden de entidades relacionadas.", "Una key estable preserva orden por entidad y evita particiones calientes por estrategias defectuosas."],
      ["Envelope", "Conjunto de metadatos técnicos y payload crudo que rodea al evento de negocio.", "Conservarlo en bronze hace diagnosticables los errores de contrato y posibilita volver a decodificar sin releer Kafka."],
    ],
    "Una empresa recibe cambios de cuenta en doce particiones; algunos mensajes JSON fallan tras una nueva versión y auditoría exige reproducir exactamente los afectados.",
    [
      "Persistir en bronze key, value, headers, topic, partition, offset y timestamp antes de interpretar el payload.",
      "Elegir el esquema por versión, enviar errores de parsing con su coordenada Kafka a cuarentena y promover solo registros tipados.",
      "Construir el replay con rangos de partición y offset documentados, sin confundir el mismo número de offset en particiones diferentes.",
    ],
    "La actualización incompatible no bloquea datos sanos y cada evento fallido puede localizarse, corregirse y reprocesarse con trazabilidad completa.",
  ),
  m15l2: deepDive(
    "La posición inicial de Kafka se decide una vez, cuando nace una consulta sin checkpoint. Después, el checkpoint es la autoridad sobre offsets; cambiar `startingOffsets` no rebobina una consulta existente. Esta distinción evita dos errores frecuentes: creer que `latest` salta datos en cada reinicio o intentar un backfill modificando opciones mientras se reutiliza el mismo estado. `subscribe` sigue topics explícitos, `assign` fija particiones concretas y `subscribePattern` descubre topics que coinciden con un patrón; cada opción cambia la topología y debe gobernarse. `earliest` procesa lo aún retenido, no una historia ilimitada. Si Kafka ha eliminado offsets que el checkpoint necesita, la decisión entre fallar, saltar o reconstruir afecta completitud y no debe ocultarse. Un replay fiable usa una consulta y destino separados con límites de offsets, dejando intacta la continuidad de producción.",
    [
      "Al arrancar sin checkpoint, el conector consulta `startingOffsets` y resuelve para cada TopicPartition un número concreto. En cada microbatch obtiene los latest offsets, aplica límites de tasa, procesa el intervalo y registra sus finales en el checkpoint. En el reinicio lee primero esos registros y continúa desde ellos, ignorando la preferencia inicial. Nuevas particiones descubiertas necesitan una regla de inicio propia según el conector. Si se cambia topic, modalidad de suscripción o número de fuentes, la compatibilidad del checkpoint deja de estar garantizada y suele requerir una consulta nueva.",
      "Kafka retiene por tiempo o tamaño, así que un offset confirmado puede desaparecer durante una parada prolongada. `failOnDataLoss` hace visible el hueco; desactivarlo puede permitir continuar pero acepta omisión y requiere una política de reconciliación. Limitar offsets por trigger suaviza carga y sink, aunque prolonga el backlog. Para backfill se capturan offsets iniciales y finales por partición, se escribe a una tabla de staging y se reconcilia por clave. Alterar offsets de la consulta principal mezcla recuperación y corrección histórica, complica exactly-once y puede duplicar efectos.",
    ],
    [
      ["Starting offsets", "Posición usada para inicializar cada partición únicamente cuando no existe progreso restaurable en un checkpoint.", "Aclara por qué cambiar `earliest` o `latest` no modifica una consulta ya iniciada."],
      ["Suscripción", "Regla que determina qué topics y particiones forman la fuente, mediante subscribe, patrón o asignación explícita.", "Forma parte de la identidad de la consulta y condiciona descubrimiento, permisos y compatibilidad de recuperación."],
      ["Retención Kafka", "Política por la que el broker elimina segmentos antiguos independientemente del progreso del consumidor.", "Define la ventana máxima para recuperar backlog o hacer replay directamente desde Kafka."],
    ],
    "Un pipeline estuvo detenido diez días, pero el topic retiene siete; al reiniciar, el checkpoint solicita offsets ya eliminados y el equipo propone desactivar la detección de pérdida.",
    [
      "Cuantificar el hueco por partición y mantener el fallo visible, porque continuar silenciosamente violaría completitud sin saber qué falta.",
      "Recuperar el intervalo desde la capa bronze o fuente original en una consulta separada y reconciliarlo con claves de negocio.",
      "Ajustar retención y RTO para que futuras paradas recuperables quepan en la ventana, conservando el checkpoint principal como autoridad.",
    ],
    "La recuperación documenta y rellena la pérdida real sin fingir continuidad, y la política futura alinea retención del broker con objetivos operativos.",
  ),
  m15l3: deepDive(
    "Un contrato de evento define cómo convertir bytes en un hecho confiable y cómo evolucionará esa conversión. Incluye formato, versión, campos requeridos, tipos, semántica, compatibilidad y tratamiento de datos desconocidos. El parsing no debe mezclarse con reglas de negocio: primero se determina si el payload puede interpretarse; después se valida si el hecho es aceptable, y finalmente se transforma. Esta separación evita que una nueva columna opcional se confunda con corrupción o que un importe negativo derribe el decoder. En esquemas evolucionados, añadir un campo opcional con valor predeterminado suele ser compatible; renombrar, cambiar tipo o reinterpretar unidades puede romper consumidores aunque el JSON siga siendo válido. Una capa bronze guarda el original y la versión; silver materializa un esquema canónico y una cuarentena explicable. El objetivo no es aceptar todo, sino hacer explícita y reversible cada decisión de compatibilidad.",
    [
      "El consumidor inspecciona un header, subject de registry o campo de versión y selecciona el schema correcto. La deserialización produce una estructura tipada y una señal de error sin lanzar necesariamente una excepción global. A continuación, constraints separan filas válidas, desconocidas y semánticamente inválidas, conservando coordenadas Kafka. Una función de normalización traduce versiones compatibles al modelo canónico: convierte unidades, rellena defaults documentados y evita que columnas de transporte contaminen el dominio. Métricas por versión y causa permiten detectar adopción y regresiones.",
      "La compatibilidad backward permite que un consumidor nuevo lea eventos antiguos; forward permite que uno antiguo tolere eventos nuevos dentro de límites. Un registry puede aplicar reglas estructurales, pero no detecta cambios semánticos como pasar de euros a céntimos. Los despliegues se secuencian: primero consumidores tolerantes, después productores nuevos y finalmente retirada tras la retención máxima. Poison pills se aíslan para que el mismo registro no provoque reintentos infinitos. Reprocesar desde bronze permite aplicar un decoder corregido sin depender de que Kafka conserve el mensaje.",
    ],
    [
      ["Compatibilidad backward", "Capacidad de una versión nueva del lector para interpretar datos escritos con versiones anteriores del contrato.", "Permite desplegar consumidores antes o después sin bloquear el historial retenido."],
      ["Poison pill", "Registro cuya forma o contenido provoca de manera determinista el fallo repetido del consumidor.", "Debe aislarse con evidencia para evitar que retries conviertan un error de datos en indisponibilidad del pipeline."],
      ["Esquema canónico", "Representación interna estable a la que se normalizan versiones externas compatibles.", "Desacopla la evolución del productor de todas las transformaciones downstream y simplifica tests."],
    ],
    "Un productor cambia `amount` de decimal en euros a entero en céntimos y añade `currency`; ambos mensajes son JSON válidos y coexistirán durante una semana.",
    [
      "Identificar cada versión de forma inequívoca y rechazar la inferencia basada únicamente en el tipo numérico o presencia casual de campos.",
      "Normalizar ambas versiones a decimal y moneda explícita, conservando payload y versión para auditoría y pruebas de regresión.",
      "Desplegar primero el lector dual, vigilar métricas por versión y retirar el decoder antiguo solo después de la retención y el replay acordados.",
    ],
    "La transición no altera importes ni detiene el flujo; el modelo silver permanece estable mientras el contrato externo evoluciona de forma observable.",
  ),
  m15l4: deepDive(
    "El recorrido Kafka–Spark–Delta puede acercarse a exactamente una vez porque cada componente ofrece una identidad durable: offsets por partición, commits por microbatch y transacciones Delta. Sin embargo, esa composición depende de no introducir una frontera que desconozca el protocolo. El checkpoint hace que Spark vuelva a leer un rango cuando no quedó confirmado; Delta puede hacer que la repetición converja al mismo resultado si se usa el sink integrado o un `MERGE` determinista. Una API externa, otra base o dos tablas escritas secuencialmente pueden observar intentos parciales. Por eso se diseña una salida canónica única y se derivan efectos posteriores con consumidores independientes. También se distingue duplicado de origen —dos registros Kafka con el mismo evento— de reintento técnico —el mismo rango ejecutado otra vez—: el primero requiere clave de negocio, el segundo coordinación o idempotencia del sink.",
    [
      "Spark registra para el lote N los rangos de offsets de todas las particiones, calcula las transformaciones y escribe en Delta. Si el commit del sink y el progreso quedan reconocidos, el lote siguiente avanza. Si el proceso falla en una frontera ambigua, el lote puede repetirse; la transacción Delta o el `MERGE` debe reconocer la identidad lógica y no añadir otra copia. El offset compuesto sirve para trazabilidad, pero una reconstrucción desde otra fuente o checkpoint cambia identidades técnicas, de modo que la clave de negocio sigue siendo necesaria.",
      "Con `foreachBatch`, un upsert puede ser idempotente si dentro del lote existe a lo sumo una decisión final por clave y la secuencia resuelve conflictos. Escribir a una tabla de hechos y luego llamar a un servicio crea dos commits independientes. El patrón outbox materializa en Delta tanto el estado como una fila pendiente de efecto; otro stream publica y marca resultado con idempotency key. La latencia aumenta y hay estado operativo adicional, pero se gana recuperación, auditoría y capacidad de reparar un único consumidor sin rebobinar Kafka.",
    ],
    [
      ["Identidad técnica", "Coordenada del transporte, como topic-partition-offset o batch id, que identifica un intento dentro de una ejecución.", "Permite rastrear reintentos, pero no sustituye una identidad de negocio entre reconstrucciones."],
      ["Outbox", "Tabla transaccional de efectos pendientes escrita junto con el estado canónico y consumida de forma independiente.", "Evita intentar una transacción distribuida con APIs externas y hace reparables las publicaciones parciales."],
      ["Convergencia", "Propiedad por la que reejecutar datos conduce al mismo estado final pese a intentos repetidos o desordenados.", "Es una formulación práctica y comprobable de corrección para pipelines recuperables."],
    ],
    "Un stream de transferencias actualiza saldos en Delta y debe enviar cada operación a un sistema antifraude que solo ofrece una API HTTP.",
    [
      "Confirmar saldos y una fila outbox en el plano Delta mediante una transformación determinista por `transfer_id`.",
      "Crear un consumidor separado que use `transfer_id` como idempotency key de HTTP y registre respuesta, intentos y error definitivo.",
      "Probar caídas antes y después de cada commit, demostrando que el estado converge y que una reparación no vuelve a aplicar el saldo.",
    ],
    "La ruta conserva exactamente una decisión lógica de saldo y una entrega externa recuperable, sin atribuir al checkpoint una atomicidad que HTTP no ofrece.",
  ),
  m15l5: deepDive(
    "El throughput de Kafka está acotado inicialmente por sus particiones: una partición proporciona un flujo ordenado que una tarea consume por rango de offsets, mientras que varias particiones permiten paralelismo. Más particiones no garantizan equilibrio si la key concentra tráfico, y más workers que particiones no crean lectores útiles. Structured Streaming puede limitar offsets por trigger para proteger memoria, estado o sink durante picos. Ese límite regula admisión; no aumenta capacidad sostenida. Si la llegada media supera el proceso medio, el lag seguirá creciendo aunque los lotes sean pequeños. El objetivo operativo es mantener headroom, detectar skew por partición y estimar tiempo de vaciado del backlog. Cambiar particionado también afecta orden por entidad y puede requerir coordinación con productores, no es solo una opción del consumidor.",
    [
      "En cada trigger, el conector obtiene latest offsets por TopicPartition y calcula el rango nuevo desde el checkpoint. Un límite global se distribuye proporcionalmente entre particiones según backlog, sujeto a mínimos configurables. Cada rango se procesa en tareas Spark; la duración la marca la partición más lenta y las transformaciones downstream. Las métricas de offsets inicial, final y último disponible permiten calcular lag por partición. Una partición caliente aparece como cola persistente aunque el total agregado parezca aceptable.",
      "Aumentar `maxOffsetsPerTrigger` reduce tiempo de recuperación si compute y sink tienen margen, pero puede crear microbatches que superan SLA o disparan estado y spill. Reducirlo estabiliza picos y comparte capacidad, pero alarga el backlog. Escalar workers ayuda hasta el paralelismo disponible y los shuffles; después debe corregirse keying o ampliar particiones. Reparticionar dentro de Spark equilibra transformaciones posteriores, pero no cambia la velocidad con que una partición Kafka individual entrega su rango ni reconstruye el orden perdido.",
    ],
    [
      ["Consumer lag", "Diferencia por partición entre el último offset disponible en Kafka y el offset confirmado por la consulta.", "Mide backlog real y permite estimar si la frescura se recupera o se deteriora."],
      ["Partición caliente", "Partición que recibe o procesa mucha más carga que las demás por distribución sesgada de keys.", "Limita el lote completo y no se resuelve simplemente añadiendo workers o usando un promedio global."],
      ["Control de admisión", "Límite deliberado sobre cuántos offsets entran en un microbatch.", "Protege downstream durante ráfagas, pero debe distinguirse de una mejora de capacidad permanente."],
    ],
    "Tras una campaña, una de veinte particiones acumula millones de eventos porque todos los clientes anónimos usan la misma key; el equipo baja offsets por lote para estabilizar el sink.",
    [
      "Medir lag por partición y confirmar que la duración está dominada por la key anónima, no por falta uniforme de workers.",
      "Mantener un límite temporal que proteja el sink mientras el productor distribuye anónimos con una key estable de mayor cardinalidad.",
      "Dimensionar particiones y compute con la nueva distribución, comprobando que la tasa sostenida supera la llegada con margen y preserva orden donde importa.",
    ],
    "El límite evita el colapso inmediato y la corrección del particionado elimina la causa estructural, permitiendo vaciar el lag sin violar el contrato de orden por entidad.",
  ),
  m16l1: deepDive(
    "Change Data Feed convierte el historial transaccional de una tabla en una interfaz incremental de cambios por fila. En lugar de comparar snapshots completos, el consumidor solicita versiones y recibe inserts, deletes y, para updates, imágenes anteriores y posteriores junto con versión y timestamp de commit. La frontera importante es el commit Delta: todos los cambios de una transacción comparten versión, aunque su orden de filas dentro de ella no sea una secuencia de negocio. CDF facilita replicación, auditoría y ETL incremental, pero no constituye una copia permanente e independiente del historial; su disponibilidad depende de la retención de la tabla y de las políticas aplicables. En 2026 Databricks distingue el change data feed automático, calculado al leer mediante row lineage cuando es compatible, y el legado materializado durante escrituras. Ambos se consumen con las APIs documentadas, pero sus prerrequisitos y costes operativos deben comprobarse.",
    [
      "Una lectura batch usa `table_changes` o las opciones `readChangeFeed` con versión o timestamp inicial y opcionalmente final. Una lectura streaming toma primero un snapshot inicial como inserts por defecto y después emite commits nuevos, preservando la atomicidad de cada versión respecto a límites de tasa. Las columnas `_change_type`, `_commit_version` y `_commit_timestamp` acompañan a las columnas de negocio. Un update produce `update_preimage` y `update_postimage`; el consumidor elige si necesita auditar ambas o aplicar únicamente el estado posterior. El checkpoint registra hasta qué commit avanzó la consulta.",
      "Activar CDF legado solo registra cambios posteriores a la activación; no reconstruye versiones anteriores. La limpieza de log y archivos puede hacer que un rango antiguo ya no sea legible, por lo que un consumidor con RTO largo necesita una tabla bronze durable o retención alineada. La versión de commit es un orden total de transacciones dentro de la tabla, no necesariamente el orden causal originado en otro sistema. Para replicar deletes y updates, se conserva la clave y se define una secuencia de aplicación, evitando tratar cada preimage como una nueva fila de negocio.",
    ],
    [
      ["Change Data Feed", "Interfaz que expone cambios de filas confirmados entre versiones de una tabla con metadatos de tipo y commit.", "Permite procesamiento incremental sin escanear y comparar snapshots completos en cada ejecución."],
      ["Commit version", "Número monotónico que identifica una transacción Delta dentro del historial de una tabla.", "Sirve como frontera reproducible para checkpoints y replays, pero no sustituye la secuencia de negocio de la fuente."],
      ["Preimage/Postimage", "Valores anterior y posterior que CDF puede emitir para una fila actualizada.", "Distinguirlos evita duplicar entidades y permite elegir entre auditoría completa y aplicación del estado vigente."],
    ],
    "Un equipo replica clientes desde una tabla Delta a un índice de búsqueda y necesita recuperarse tras ocho días sin releer 500 millones de filas.",
    [
      "Verificar que la modalidad de CDF y la retención cubren el RTO, y persistir cambios en bronze si el consumidor puede quedar fuera de esa ventana.",
      "Leer desde la última versión confirmada, aplicar postimages e inserts por clave y traducir deletes a eliminaciones idempotentes del índice.",
      "Registrar la versión Delta publicada solo después de confirmar el lote externo, manteniendo una clave idempotente para reintentos ambiguos.",
    ],
    "La réplica avanza por commits trazables y puede reanudar sin snapshot completo, con una retención y una frontera externa explícitamente gobernadas.",
  ),
  m16l2: deepDive(
    "Un feed CDC describe transiciones, no filas independientes. Para reconstruir una entidad se necesita una clave estable, una operación y una secuencia total por clave. El timestamp de llegada no suele bastar: dos actualizaciones pueden atravesar particiones o reintentos y aparecer fuera de orden. La secuencia debe provenir del log de origen —LSN, SCN, versión o una estructura compuesta— y resolver empates de forma determinista. Deletes deben representarse explícitamente, y los nulls requieren semántica: pueden significar establecer null o simplemente campo ausente en una actualización parcial. Antes de aplicar cambios se valida el contrato, se deduplican reenvíos y se conserva el raw feed. Una clave mutable se trata como delete más insert o mediante una identidad inmutable separada. Este modelo permite demostrar el estado final ante replay y es requisito conceptual tanto para un `MERGE` manual como para AUTO CDC.",
    [
      "El pipeline agrupa lógicamente cambios por clave y los ordena mediante `sequence_by`. Para una misma secuencia, necesita un criterio adicional o debe rechazar la ambigüedad; una estructura con timestamp, contador y offset puede formar orden total. Un insert o update crea el estado posterior, un delete retira o cierra la entidad y un truncate —si se admite— tiene alcance global. En actualizaciones parciales, el motor debe distinguir ausencia del campo de un valor null intencionado. El resultado se publica solo después de resolver múltiples eventos de la misma clave dentro del rango.",
      "Eventos tardíos siguen siendo aplicables si su secuencia los coloca antes del estado vigente y el motor mantiene la información necesaria, pero una retención o diseño incorrecto puede perder contexto. Ordenar por ingestion time hace que un replay distinto produzca otro resultado. Duplicados con la misma operación y secuencia deberían ser idempotentes; conflictos con payload diferente deben ir a excepción porque esconden una violación del productor. Para SCD2, la secuencia define fronteras de validez y cualquier ambigüedad genera intervalos solapados o negativos, por lo que se prueba con casos fuera de orden y deletes.",
    ],
    [
      ["Secuencia total por clave", "Orden determinista que permite comparar cualquier par de cambios de la misma entidad, incluidos empates.", "Hace que el estado reconstruido sea idéntico en ejecución normal, reintento y replay."],
      ["Tombstone", "Evento que representa la eliminación lógica de una clave sin depender de que la fila desaparezca físicamente del feed.", "Permite propagar deletes y cerrar historia en vez de dejar entidades obsoletas downstream."],
      ["Actualización parcial", "Cambio que especifica solo algunos atributos y deja el resto sin modificar.", "Obliga a distinguir null de campo ausente para no borrar datos accidentalmente al aplicar CDC."],
    ],
    "Un log de clientes emite dos cambios con el mismo segundo, uno de dirección y otro de consentimiento; llegan invertidos y el segundo omite campos no modificados.",
    [
      "Construir `sequence_by` con LSN y contador de operación, no con timestamp de ingestión ni solo precisión de segundos.",
      "Preservar semántica de partial update, de modo que campos omitidos no sustituyan valores vigentes por null.",
      "Reproducir los eventos en órdenes físicos diferentes y exigir el mismo estado e intervalos antes de aprobar el contrato.",
    ],
    "El estado final y la historia resultan deterministas aunque cambie el orden de llegada, y los conflictos verdaderamente ambiguos quedan visibles.",
  ),
  m16l3: deepDive(
    "AUTO CDC es la API actual de Lakeflow pipelines para convertir un feed de cambios en una tabla SCD sin implementar manualmente orden, deduplicación y aplicación. Reemplaza el nombre anterior `APPLY CHANGES`; las APIs antiguas siguen disponibles, pero la documentación recomienda `AUTO CDC`. En Python se declara una streaming table destino y se crea un flow con `dp.create_auto_cdc_flow`; en SQL se usa `AUTO CDC INTO`. El autor aporta claves, `sequence_by`, reglas de delete, tratamiento de nulls, columnas y tipo SCD. El servicio se ocupa de eventos fuera de orden dentro de su semántica, pero no inventa un contrato correcto: una secuencia ambigua o clave inestable sigue produciendo un modelo defectuoso. También conviene distinguir Lakeflow pipelines, que extiende el framework declarativo con capacidades administradas, del proyecto Apache Spark Declarative Pipelines; AUTO CDC es una capacidad Databricks de Lakeflow, no una API portátil del núcleo Apache.",
    [
      "Primero se crea el target streaming table, porque el flow administra cómo llegan cambios a esa tabla. `keys` define identidad, `sequence_by` ordena cada clave y `apply_as_deletes` traduce una condición del feed a eliminación. `stored_as_scd_type` selecciona tipo 1 o 2; listas de columnas controlan proyección e historia. Cuando se declara manualmente un esquema SCD2, las columnas técnicas `__START_AT` y `__END_AT` deben usar el mismo tipo que la secuencia. El motor guarda estado suficiente para reordenar y aplicar cambios de manera incremental.",
      "`ignore_null_updates` es adecuado solo si null significa atributo ausente; activarlo cuando null es un valor de negocio impediría borrar un atributo. Un delete puede conservarse temporalmente para absorber cambios tardíos y después desaparecer físicamente según configuración. Cambiar claves, secuencia o tipo SCD en una tabla activa no es un ajuste cosmético: altera estado e historia y requiere migración probada. Aunque la sintaxis de APPLY CHANGES sea equivalente, material nuevo y preguntas de diseño deben emplear AUTO CDC y reconocer el nombre anterior únicamente al interpretar código legado.",
    ],
    [
      ["AUTO CDC", "API administrada de Lakeflow pipelines que aplica un change feed ordenado a una tabla SCD tipo 1 o 2.", "Reduce lógica manual propensa a errores y es la terminología actual recomendada por Databricks."],
      ["sequence_by", "Expresión escalar o estructurada que establece el orden de cambios para cada clave del flujo.", "Gobierna la resolución de eventos tardíos y la construcción correcta de estado e intervalos."],
      ["apply_as_deletes", "Condición que identifica qué registros del feed representan eliminaciones de la entidad destino.", "Sin ella, un tombstone podría tratarse como upsert y dejar datos que el origen ya eliminó."],
    ],
    "Una compañía migra un pipeline `APPLY CHANGES` de clientes con deletes y eventos desordenados, y quiere actualizar nombres sin alterar la tabla SCD2 existente.",
    [
      "Comparar la firma vigente y confirmar que `create_auto_cdc_flow` mantiene claves, secuencia, reglas de delete y tipo SCD del flujo anterior.",
      "Actualizar el nombre en una rama y ejecutar replay controlado contra un destino aislado, comparando intervalos y filas activas clave por clave.",
      "Desplegar conservando checkpoint y estado solo si la modificación es nominal y compatible; cualquier cambio semántico se trata como migración separada.",
    ],
    "El código adopta la API actual sin convertir un rename en un rediseño accidental, y la equivalencia del resultado queda probada con datos fuera de orden.",
  ),
  m16l4: deepDive(
    "SCD tipo 1 y tipo 2 responden preguntas distintas. Tipo 1 representa la mejor versión vigente de cada clave y sobrescribe atributos; es compacto y sencillo, pero no puede responder qué valor se conocía antes. Tipo 2 conserva una fila por periodo de validez, normalmente con fronteras técnicas de inicio y fin, y permite consultas temporales. No todo cambio merece historia: corregir un typo técnico puede no requerir una nueva versión, mientras que dirección, segmento o consentimiento sí pueden afectar hechos y auditoría. La secuencia del CDC define cuándo comienza cada versión, no el instante en que Databricks la procesó. Deletes pueden cerrar el intervalo activo o retirar la fila vigente según el tipo. El modelador debe separar business effective time de system processing time; una SCD2 estándar basada en secuencia no es automáticamente bitemporal ni conserva cuándo se descubrió una corrección.",
    [
      "En tipo 1, cada cambio válido se compara por clave y secuencia con el estado conocido; el más reciente actualiza columnas elegidas y un delete elimina la versión activa. En tipo 2, el motor inserta una nueva fila, abre su `__START_AT` y cierra `__END_AT` de la anterior. Un evento tardío puede obligar a insertar una versión intermedia y ajustar fronteras adyacentes. Las consultas as-of seleccionan el intervalo que contiene el instante, cuidando la convención inclusiva/exclusiva para no duplicar bordes.",
      "Tipo 2 multiplica almacenamiento, joins y complejidad de correcciones, especialmente con atributos que cambian frecuentemente. Rastrear solo columnas de negocio relevantes evita versiones por cambios operativos irrelevantes. Las claves sustitutas pueden estabilizar joins, pero la clave natural sigue siendo necesaria para aplicar CDC. En modelos de hechos, resolver la dimensión as-of durante la carga preserva el contexto histórico; unir siempre con la fila actual destruye esa semántica. Replays deben validar que existe como máximo un intervalo activo y que no hay solapamientos por clave.",
    ],
    [
      ["SCD tipo 1", "Modelo que mantiene una única fila vigente por clave y reemplaza atributos con el cambio más reciente.", "Es apropiado cuando solo importa el estado actual y minimiza coste y complejidad."],
      ["SCD tipo 2", "Modelo que conserva múltiples versiones por clave con intervalos de validez no solapados.", "Permite análisis as-of y auditoría de atributos cuyo valor histórico afecta decisiones."],
      ["Intervalo de validez", "Rango temporal durante el cual una versión de dimensión se considera efectiva.", "Es la base para joins temporales correctos y para detectar huecos o solapamientos de historia."],
    ],
    "Riesgos necesita conocer el país de residencia que tenía un cliente cuando se aprobó cada crédito, mientras soporte solo necesita el teléfono actual.",
    [
      "Clasificar país como atributo histórico y teléfono como vigente, evitando generar versiones SCD2 por cada corrección de contacto irrelevante para riesgo.",
      "Configurar historia solo para columnas reguladas y usar la secuencia del origen como frontera de intervalos.",
      "Enriquecer créditos mediante join as-of con el intervalo de residencia y validar una sola versión aplicable por cliente e instante.",
    ],
    "El modelo conserva evidencia regulatoria donde importa y mantiene los atributos operativos compactos, sin confundir estado actual con contexto histórico.",
  ),
  m16l5: deepDive(
    "AUTO CDC FROM SNAPSHOT resuelve fuentes que no exponen log de cambios: compara snapshots completos consecutivos, deriva inserts, updates y deletes sintéticos y aplica la misma lógica SCD. No recupera transiciones que ocurrieron y se revirtieron entre dos capturas; solo conoce las diferencias observables entre estados. La API actual está disponible en la interfaz Python de Lakeflow pipelines y necesita snapshots en orden ascendente mediante una versión fiable. Un snapshot debe ser completo y coherente para su versión; si llega truncado, el comparador puede interpretar miles de ausencias como deletes legítimos. Por ello, la adquisición publica primero un manifest con conteos, checksum, tiempo de extracción y estado completo. Los snapshots fuera de orden se ignoran según la semántica documentada, así que la versión no puede derivarse de una hora de llegada susceptible a retrasos.",
    [
      "La función proveedora entrega el siguiente DataFrame snapshot junto con una versión monotónica. El motor conserva referencia al estado anterior, compara por keys y genera un feed sintético: claves nuevas son inserts, ausentes son deletes y atributos distintos son updates. Ese feed alimenta el procesamiento SCD1 o SCD2. La primera versión establece la base; cada versión posterior debe representar toda la población acordada. El estado técnico y la tabla destino permiten continuar incrementalmente sin que el autor escriba manualmente un diff completo.",
      "Comparar snapshots grandes consume lectura y cómputo, aunque el resultado incremental reduzca trabajo downstream. Particionar la extracción o recibir fragmentos no equivale a un snapshot completo salvo que el contrato describa cómo ensamblarlos antes de publicar versión. Una versión diaria omite dos cambios intradía y no sirve para auditoría de cada transición. Antes de aceptar deletes masivos se validan conteos y completitud; un circuito de corte puede detener la aplicación y mantener el último estado bueno. Si aparece un snapshot antiguo después de uno nuevo, se audita como anomalía en vez de renumerarlo.",
    ],
    [
      ["Snapshot completo", "Imagen coherente de todas las claves en alcance para una versión concreta de la fuente.", "Las ausencias se interpretan como deletes, por lo que incompletitud puede causar pérdida masiva downstream."],
      ["Versión de snapshot", "Identificador monotónico y estable que ordena las imágenes por su secuencia de extracción lógica.", "Permite comparar pares correctos y evita aplicar una entrega retrasada como si fuera el estado más nuevo."],
      ["Cambio sintético", "Insert, update o delete inferido al comparar dos snapshots, no emitido directamente por el sistema origen.", "Aporta incrementalidad, pero no puede revelar transiciones intermedias invisibles entre capturas."],
    ],
    "Un ERP exporta cada noche cinco millones de proveedores; una transferencia interrumpida produce un archivo con solo el 60 % y llega antes que el manifest de control.",
    [
      "No publicar la versión hasta validar manifest, conteo, checksum y marca de extracción completa contra límites históricos.",
      "Entregar snapshots al flow por una versión del ERP monotónica, sin usar el timestamp de llegada del archivo como orden.",
      "Bloquear una caída anómala de cardinalidad y conservar la última versión buena, reintentando la extracción antes de inferir deletes.",
    ],
    "El pipeline obtiene beneficios de CDC sin convertir una exportación parcial en una eliminación masiva y reconoce explícitamente la pérdida de cambios intradía.",
  ),
  m17l1: deepDive(
    "Un SLA de streaming no es la frase tiempo real; es un contrato cuantificado entre productor, plataforma y consumidor. Se descompone en indicadores: frescura del evento publicado, completitud respecto a la fuente, corrección de reglas, disponibilidad de lectura y tiempo de recuperación. Cada indicador necesita método, ventana, percentil, presupuesto de error y dueño. La frescura puede medirse como reloj menos máximo event time válido, mientras que la latencia de microbatch es solo un componente interno. Un p95 de cinco minutos permite colas ocasionales que un máximo estricto no permitiría. RPO expresa cuántos datos podrían perderse y RTO cuánto se tarda en restaurar el servicio; checkpoints y replay deben demostrar ambos. El contrato también define comportamiento degradado: si Kafka se retrasa, puede ser mejor servir datos marcados como stale que bloquear una tabla consistente y disponible.",
    [
      "La instrumentación captura event time, ingestion time, commit time y momento de disponibilidad al consumidor. De esas marcas se deriva latencia por etapa y end-to-end. Conteos o checksums por ventana comparan fuente, bronze y silver para completitud; expectations y reconciliaciones miden corrección. Los indicadores se agregan con percentiles y ventanas móviles, evitando que promedios oculten colas. El presupuesto de error permite priorizar fiabilidad frente a cambios: una violación sostenida dispara runbook y una aislada puede consumir presupuesto sin declarar incidente total.",
      "El SLA debe ser alcanzable bajo volumen nominal y picos definidos. Reducir frescura exige compute residente, más headroom, menor estado o menor tolerancia de tardanza, cada uno con coste o pérdida de corrección. Un watermark no es por sí solo un SLA de llegada: expresa cuándo dejar de esperar dentro del operador. Para completitud, se documenta qué ocurre con datos posteriores a esa frontera. RTO se ensaya restaurando checkpoint o reconstruyendo desde bronze; si tarda más que la retención Kafka, el RPO prometido no es físicamente posible.",
    ],
    [
      ["SLI", "Medida concreta del comportamiento observado, como frescura p95 o porcentaje de eventos reconciliados.", "Convierte expectativas ambiguas en datos sobre los que se pueden alertar y mejorar."],
      ["SLO", "Objetivo interno para un SLI durante una ventana, normalmente más estricto que el límite contractual externo.", "Crea margen operativo y guía decisiones de capacidad y fiabilidad antes de incumplir el SLA."],
      ["RPO/RTO", "Máxima pérdida de datos aceptable y máximo tiempo para recuperar el servicio tras un incidente.", "Conecta checkpoints, retención, replay y runbooks con compromisos verificables de continuidad."],
    ],
    "Operaciones pide datos en menos de dos minutos, 99,9 % completos y recuperación en treinta minutos para un flujo que recibe picos diez veces mayores cada viernes.",
    [
      "Definir frescura p95/p99, reconciliación por ventanas y RTO con marcas medibles desde Kafka hasta la tabla consumida.",
      "Probar capacidad al pico, incluyendo state store y sink, y reservar headroom suficiente para que el backlog no consuma el presupuesto de error.",
      "Ensayar caída y replay dentro de la retención, documentando modo degradado y responsables cuando una dependencia externa impida cumplir.",
    ],
    "El acuerdo deja de ser aspiracional: cada promesa tiene medición, capacidad, presupuesto y una evidencia de recuperación asociada.",
  ),
  m17l2: deepDive(
    "Una arquitectura streaming recuperable separa fronteras de responsabilidad. La entrada bronze conserva el sobre original y una identidad reproducible; las transformaciones stateful usan checkpoints propios; la salida canónica se confirma idempotentemente; observabilidad registra tanto progreso técnico como verdad de negocio. Acoplar todas las etapas en una única consulta parece reducir latencia, pero amplía el dominio de fallo y hace que una API lenta bloquee ingestión. Separarlas con tablas Delta añade un commit y algo de latencia, a cambio de replay, aislamiento y evolución independiente. Cada consumidor tiene su checkpoint, por lo que reparar uno no rebobina los demás. El modelo medallion no es solo organización de calidad: sus commits son fronteras de recuperación. Los schemas, claves, secuencias y expectativas forman contratos versionados, y los efectos externos se derivan después de que exista una fuente canónica auditable.",
    [
      "El primer stream captura Kafka o archivos en bronze con metadatos, parsing básico y un checkpoint de ingestión. Otro stream lee la tabla como fuente incremental, aplica deduplicación, ventanas o AUTO CDC y publica silver con su propio estado. Gold materializa productos de consumo con latencia acorde. Si silver falla, bronze sigue acumulando datos y el reinicio retoma desde su checkpoint; si hay un bug lógico, una versión nueva puede reproducir el rango bronze a un destino paralelo sin tocar offsets de entrada.",
      "Cada frontera agrega almacenamiento, gobernanza y posibles retrasos. Para flujos extremadamente simples, una sola consulta puede ser suficiente, pero debe conservar raw data y aislar sinks no transaccionales. El checkpoint no se comparte entre etapas ni entornos. Los nombres de tabla y ruta incluyen versión de contrato; un cambio incompatible crea destino paralelo y cutover. La retención bronze cubre el máximo tiempo de detección más reconstrucción. Seguridad limita quién puede modificar fuentes, checkpoints y targets, porque borrar estado es una acción de integridad, no mantenimiento rutinario.",
    ],
    [
      ["Frontera de recuperación", "Commit durable desde el que una etapa downstream puede reanudar o reconstruirse sin releer el sistema original.", "Reduce radio de impacto y hace posible reparar una transformación sin afectar ingestión."],
      ["Tabla canónica", "Representación gobernada que constituye la verdad publicada para una etapa o dominio.", "Desacopla efectos externos y consumidores de reintentos y formatos del transporte."],
      ["Radio de impacto", "Conjunto de etapas, datos y consumidores afectados cuando falla o cambia un componente.", "Guía la decisión de separar consultas y checkpoints aunque aumente ligeramente la latencia."],
    ],
    "Una API de scoring empieza a responder lentamente y bloquea el `foreachBatch` que también ingiere eventos críticos desde Kafka.",
    [
      "Separar la captura a bronze y la decisión silver del efecto HTTP, estableciendo commits Delta antes de cualquier dependencia externa.",
      "Crear un consumidor de publicación con checkpoint propio, idempotency key y política de retry/circuit breaker.",
      "Dimensionar retención y alertas para que el backlog externo se repare sin detener ingestión ni reprocesar decisiones ya confirmadas.",
    ],
    "La degradación del proveedor solo retrasa su consumidor; el histórico y el producto canónico permanecen disponibles y reparables.",
  ),
  m17l3: deepDive(
    "Recuperar no siempre significa reiniciar. Un reinicio restaura el mismo plan desde un checkpoint compatible tras un fallo transitorio. Un replay vuelve a procesar un intervalo conservando una fuente durable, normalmente hacia staging o una versión nueva. Un rebuild reconstruye estado y destino completos cuando cambió la semántica o se perdió compatibilidad. Elegir mal puede ocultar pérdida o duplicar efectos. Antes de actuar se inmoviliza evidencia: error, batch, offsets, versiones Delta, estado de sinks y métricas. Borrar checkpoint convierte recuperación en consulta nueva y elimina la frontera que permitía razonar. El runbook debe indicar condiciones de entrada, autoridad, RPO/RTO, validaciones y rollback. Un replay no se publica directamente sobre producción sin reconciliar claves, secuencias, conteos e invariantes; además debe evitar efectos externos hasta aprobar el resultado.",
    [
      "Para un fallo transitorio de compute o red, el scheduler reintenta la tarea y Spark restaura offset, commit y state store del último lote confirmado. Si hay un bug de transformación, se determina la primera versión afectada en bronze y se crea código y checkpoint nuevos para procesar el rango a una tabla paralela. Un rebuild usa snapshot o historia completa retenida para formar de nuevo estado stateful. En todos los casos se registra un punto de corte para evitar que producción y corrección compitan por las mismas claves sin orden.",
      "Un repair in-place con `MERGE` puede ser válido cuando la función es determinista y la clave identifica todas las filas afectadas, pero debe manejar deletes y cambios derivados. Side effects se desactivan o usan una outbox separada. La validación compara no solo conteos: unicidad, totales financieros, intervalos SCD, watermarks, muestras y versiones. El cutover puede realizarse cambiando una vista o alias, conservando la salida previa durante el rollback. Después se decide si reanudar desde checkpoint antiguo, encadenar desde un nuevo punto o retirar la versión defectuosa.",
    ],
    [
      ["Reinicio", "Continuación del mismo plan lógico desde el último checkpoint compatible después de un fallo operativo.", "Es la opción de menor impacto cuando código, estado y datos siguen siendo válidos."],
      ["Replay", "Reprocesamiento deliberado de un intervalo histórico desde una fuente durable con límites explícitos.", "Corrige resultados sin destruir el progreso de la consulta activa y ofrece comparación antes de publicar."],
      ["Rebuild", "Reconstrucción completa o sustancial del estado y salida con un checkpoint nuevo.", "Es necesaria ante cambios incompatibles o corrupción, pero exige planificación de corte, coste y reconciliación."],
    ],
    "Una versión de código multiplicó importes durante tres horas; la consulta ya avanzó y los microbatches posteriores son correctos.",
    [
      "Capturar versiones y offsets afectados, detener efectos downstream sensibles y conservar el checkpoint para no perder evidencia.",
      "Reprocesar solo el intervalo desde bronze con código corregido a staging y comparar claves, sumas y deletes contra fuentes.",
      "Aplicar una reparación idempotente por clave o hacer cutover de la tabla validada, reactivando consumidores desde una frontera documentada.",
    ],
    "La corrección histórica no rebobina datos sanos ni duplica efectos y queda acompañada de evidencia suficiente para auditoría y rollback.",
  ),
  m17l4: deepDive(
    "La observabilidad útil enlaza cuatro planos: salud de la consulta, progreso de la fuente, comportamiento del estado y calidad del producto. Un dashboard que solo muestra cluster y estado `RUNNING` puede permanecer verde mientras se publican datos viejos o incompletos. Las métricas técnicas —offsets, batch duration, input rate, state rows, retries— responden cómo funciona el motor. Las métricas de negocio —máximo event time, pedidos por mercado, suma de importes, porcentaje válido— responden si entrega el producto prometido. Cada alerta debe combinar duración y severidad para evitar ruido durante microbatches vacíos o ráfagas normales, y debe señalar una primera comprobación. Logs estructurados incluyen run, query, batch, checkpoint version y correlación de la fuente; tablas de operaciones permiten tendencias y postmortems más allá de la retención de la interfaz.",
    [
      "Un colector persiste `StreamingQueryProgress` por batch y calcula lag de Kafka por partición. Consultas sobre las tablas publicadas derivan frescura y volumen por ventana. Expectations o reglas de reconciliación producen tasas de descartes. Los indicadores se etiquetan por pipeline, entorno y versión de código para comparar despliegues. Una alerta de backlog requiere que el lag aumente durante varias ventanas y que la tasa de proceso no alcance la llegada; una alerta de datos quietos considera calendarios de actividad para no dispararse durante periodos legítimos sin eventos.",
      "Cardinalidad excesiva de etiquetas puede convertir order_id o offset en millones de series; esos detalles se guardan en logs/tablas y las métricas usan dimensiones acotadas. Las notificaciones se dirigen por ownership y severidad. El runbook correlaciona patrones: lag creciente con CPU ociosa apunta a sink o partición caliente; estado creciente con watermark detenido apunta a fuente lenta o timestamps; frescura mala sin backlog apunta a event time atrasado upstream. Después de cada incidente se añade una señal que habría acortado detección o diagnóstico, no un dashboard ornamental.",
    ],
    [
      ["Observabilidad técnica", "Telemetría sobre ejecución, offsets, recursos, estado y fallos del motor streaming.", "Localiza mecanismos operativos, pero necesita contexto de negocio para determinar impacto real."],
      ["Observabilidad de negocio", "Indicadores sobre frescura, volumen, calidad y coherencia del producto de datos entregado.", "Detecta pipelines técnicamente activos que producen resultados inútiles o incompletos."],
      ["Alerta accionable", "Regla con umbral sostenido, severidad, owner y primera hipótesis o acción segura asociada.", "Reduce fatiga y transforma una señal en tiempo de diagnóstico y recuperación menor."],
    ],
    "El stream mantiene tasas normales y cero errores, pero una actualización del productor deja `event_ts` congelado mientras sigue enviando filas nuevas.",
    [
      "Detectar la anomalía con frescura basada en máximo event time y con el skew creciente entre ingestion y event time, no con estado del Job.",
      "Correlacionar por versión y productor para aislar el cambio, cuarentenando timestamps inválidos antes de que afecten watermarks.",
      "Activar el runbook del owner upstream y medir recuperación de la frescura y del backlog de cuarentena tras la corrección.",
    ],
    "La plataforma identifica un fallo semántico que las métricas de compute no podían ver y evita que timestamps congelados silencien el SLA.",
  ),
  m17l5: deepDive(
    "Un game day convierte supuestos de resiliencia en evidencia mediante fallos controlados. No busca demostrar que nada falla; comprueba que detección, recuperación, idempotencia y comunicación funcionan dentro de RTO/RPO. El experimento define hipótesis, alcance, guardas de seguridad, datos sintéticos o reversibles, responsables y criterio de aborto. Se eligen fallos representativos: matar el driver durante un commit, ralentizar un sink, detener una partición, enviar poison pills o llenar backlog. Antes se registra el estado esperado y después se reconcilia cada evento. Reiniciar con éxito no basta: hay que demostrar que no faltan ni sobran claves, que el state store recuperó, que alertas llegaron al owner y que el runbook no exigió conocimiento tribal. Los resultados alimentan capacidad, automatización y documentación; un fallo del ejercicio es aprendizaje antes de una incidencia real.",
    [
      "El equipo prepara un conjunto de eventos con identificadores y totales conocidos, activa telemetría y marca versiones de inicio. Inyecta el fallo en una ventana acordada y mide tiempo hasta alerta, reconocimiento, diagnóstico, mitigación y recuperación completa. El reinicio usa las mismas políticas que producción, sin borrar checkpoints. Al final, consultas de reconciliación comparan fuente, bronze, silver y efectos externos; también se comprueba lag cero o dentro de umbral y estado estable tras varios microbatches.",
      "Las guardas evitan experimentar sobre datos irreversibles o superar presupuesto de error: límites de volumen, feature flags, circuit breakers y rollback ensayado. Un game day demasiado pequeño puede no revelar skew ni checkpoint largo; uno sin objetivo solo genera caos. Se repite con pico realista y con dependencia degradada. Las acciones posteriores tienen owner y fecha: mejorar alerta, aumentar retención, corregir idempotencia o dividir arquitectura. La siguiente ejecución valida que la mejora cambió la métrica, cerrando el ciclo de fiabilidad.",
    ],
    [
      ["Hipótesis de resiliencia", "Afirmación medible sobre cómo responderá el sistema a un fallo concreto bajo condiciones definidas.", "Permite declarar éxito o fracaso con evidencia en vez de aceptar que el Job volvió a verde."],
      ["Guardrail", "Límite técnico u operativo que contiene el impacto del experimento y activa aborto o rollback.", "Hace posible probar escenarios realistas sin convertir el aprendizaje en un incidente incontrolado."],
      ["Reconciliación postfallo", "Comparación de identidades, conteos, importes y efectos antes y después de recuperar.", "Demuestra RPO e idempotencia, propiedades que una captura de estado RUNNING no puede probar."],
    ],
    "Antes del Black Friday, pagos quiere validar que una caída del driver durante `foreachBatch` no duplica cargos y que se recupera en veinte minutos.",
    [
      "Crear pagos sintéticos con totales conocidos, idempotency keys y guardas que impidan alcanzar el proveedor real fuera del entorno controlado.",
      "Interrumpir el driver en la frontera de escritura, medir alerta y seguir el runbook sin modificar ni borrar checkpoint.",
      "Reconciliar Kafka, Delta y el simulador externo, verificando una aplicación por `payment_id`, backlog recuperado y tiempos dentro del RTO.",
    ],
    "La prueba ofrece evidencia cuantitativa de recuperación y descubre cualquier hueco de alertas o idempotencia antes del pico comercial.",
  ),
  m18l1: deepDive(
    "Spark Declarative Pipelines cambia la unidad de razonamiento desde una secuencia de comandos hacia un grafo de datasets y flows. El autor declara qué representa cada streaming table, materialized view o sink y sus dependencias se deducen de las lecturas; el motor construye el DAG, elige el orden válido y administra actualizaciones incrementales. En Databricks, Lakeflow pipelines es la oferta gestionada que extiende e interopera con el framework Apache Spark Declarative Pipelines sobre un runtime optimizado, añadiendo operación, event log, gobernanza y capacidades específicas. No debe confundirse el framework con el antiguo nombre comercial Delta Live Tables: código o exámenes previos pueden usar DLT, pero el modelo vigente se expresa como pipelines, flows y datasets. Declarativo no significa automático sin contrato: claves, semántica temporal, calidad, costes y compatibilidad siguen perteneciendo al diseño humano.",
    [
      "Al cargar el proyecto, el runtime evalúa las definiciones para construir metadatos y dependencias; por eso las funciones declarativas deben devolver DataFrames y evitar iniciar acciones arbitrarias. Una lectura de otro dataset crea una arista del grafo. Durante una actualización, el servicio determina qué flows deben ejecutarse, provisiona compute según configuración, aplica transformaciones y confirma cada target mediante transacciones. El event log registra planificación, progreso, calidad y linaje. El orden del archivo fuente no define el orden de ejecución; las dependencias de datos sí lo hacen.",
      "La automatización incremental puede reducir código de orquestación, pero no garantiza que toda consulta se incrementalice ni que una materialized view evite siempre recomputación. Cambios de definición pueden alterar el fingerprint del plan y provocar refresh más amplio. Un efecto externo dentro de una función declarativa puede ejecutarse durante validación o reintentos y rompe reproducibilidad. Para portabilidad se distingue la API disponible en Apache Spark Declarative Pipelines de extensiones gestionadas de Lakeflow pipelines, como ciertas capacidades operativas y AUTO CDC, documentando cualquier dependencia específica de Databricks.",
    ],
    [
      ["Pipeline", "Unidad gestionada de desarrollo y ejecución que contiene datasets, flows, sinks, configuración y el grafo de dependencias que los relaciona.", "Define la frontera de actualización, observabilidad y despliegue que el equipo opera como un producto coherente."],
      ["Flow", "Relación declarativa que procesa una fuente mediante una consulta y escribe sus resultados en un destino administrado por el pipeline.", "Separa la lógica de movimiento de datos del objeto persistente y permite varias entradas controladas hacia un target."],
      ["Evaluación declarativa", "Fase en la que el runtime interpreta definiciones para descubrir objetos y dependencias antes de ejecutar el procesamiento efectivo de datos.", "Explica por qué las funciones deben ser deterministas y no contener acciones, llamadas externas ni efectos dependientes del orden del archivo."],
    ],
    "Un equipo migra quince notebooks que llaman unos a otros y crean tablas mediante efectos laterales; los fallos parciales dejan datasets incoherentes y nadie puede explicar el linaje completo a auditoría.",
    [
      "Modelar cada salida estable como streaming table o materialized view y expresar dependencias exclusivamente mediante lecturas de datasets declarados en el grafo.",
      "Extraer notificaciones y llamadas externas fuera de las definiciones, dejando funciones deterministas que solo construyen y devuelven DataFrames reproducibles.",
      "Operar el conjunto como un pipeline versionado y consultar su event log para validar orden, linaje, calidad y resultado de cada actualización.",
    ],
    "La migración reemplaza control manual frágil por un DAG deducido y observable, mientras conserva decisiones explícitas sobre contratos, actualización incremental y dependencias específicas de la plataforma.",
  ),
  m18l2: deepDive(
    "Una streaming table representa un dataset cuyo estado crece o cambia mediante uno o más flows incrementales alimentados por fuentes streaming. No es simplemente una tabla Delta a la que alguien ejecuta append: el pipeline administra la consulta, el checkpoint y la relación entre definición y actualización. Es apropiada para ingestión bronze, transformaciones silver continuas y CDC cuando la semántica se puede expresar incrementalmente. Leerla como stream transmite cambios nuevos a consumidores; leerla como relación batch observa su estado materializado. La entrada debe ser realmente streaming (`readStream`, `STREAM(...)` o una fuente equivalente); declarar una tabla streaming no convierte por sí sola una consulta batch completa en incremental. También importa distinguir append puro de actualizaciones: AUTO CDC usa un flow gestionado para aplicar cambios a una streaming table destino, mientras un simple append conservaría múltiples versiones como filas independientes.",
    [
      "En Python, una función decorada o una definición de tabla declara el target y devuelve un DataFrame streaming. En SQL, `CREATE OR REFRESH STREAMING TABLE ... AS SELECT ... FROM STREAM(source)` expresa la lectura incremental. El pipeline asigna progreso a la fuente, ejecuta nuevos rangos y confirma transacciones en el target. Cuando un downstream usa lectura streaming, consume los cambios que la semántica del target expone. Las propiedades, comentarios y expectativas se asocian al dataset para gobernanza y calidad durante cada update.",
      "Una streaming table sobresale cuando las transformaciones son compatibles con procesamiento incremental y el negocio acepta su semántica de actualización. Joins o agregaciones stateful siguen necesitando límites temporales y pueden acumular estado. Cambiar una consulta puede requerir full refresh o invalidar historia, según la transformación y metadatos. Si la fuente entrega snapshots completos, tratarlos como stream append duplicaría todas las entidades; se necesita materialized view, AUTO CDC FROM SNAPSHOT o una etapa que interprete versión y diferencias. La tabla no elimina la responsabilidad de retención y replay del raw input.",
    ],
    [
      ["Streaming table", "Dataset persistente administrado por un pipeline cuyos flows procesan incrementalmente una o varias fuentes streaming y conservan progreso recuperable.", "Es el objeto principal para ingestión y transformaciones continuas sin gestionar manualmente cada `writeStream` y checkpoint."],
      ["Lectura streaming", "Lectura que observa únicamente nuevos cambios disponibles desde una fuente y mantiene una posición incremental entre actualizaciones sucesivas.", "Evita escanear el estado completo, pero exige que la semántica upstream pueda propagarse correctamente como cambios."],
      ["Full refresh", "Reconstrucción del contenido de un dataset desde sus fuentes en lugar de continuar únicamente con el progreso incremental existente.", "Puede ser necesaria tras cambios incompatibles y requiere considerar coste, retención y efectos sobre consumidores."],
    ],
    "Una fuente deposita eventos de pedidos append-only cada minuto, mientras otra entrega cada noche un archivo completo de clientes; el equipo propone usar la misma definición streaming para ambas.",
    [
      "Usar una streaming table con Auto Loader para pedidos, porque cada archivo contiene hechos nuevos y existe una frontera incremental clara.",
      "Rechazar append directo de snapshots de clientes y seleccionar AUTO CDC FROM SNAPSHOT o una materialized view según la historia requerida.",
      "Documentar para cada target qué cambios expone downstream, cómo se recupera y en qué condiciones una modificación exige refresh completo.",
    ],
    "Cada fuente recibe un objeto acorde con su semántica, evitando duplicar snapshots como eventos y preservando procesamiento incremental real donde sí existe.",
  ),
  m18l3: deepDive(
    "Una materialized view almacena el resultado de una consulta declarativa y lo actualiza cuando cambian sus dependencias. A diferencia de una vista lógica, no recalcula para cada lector; a diferencia de una streaming table, su consulta se formula sobre relaciones batch y describe el estado completo deseado. El motor intenta mantenerla incrementalmente cuando el plan y las fuentes lo permiten, pero el contrato no promete que todas las transformaciones eviten recomputación. Esto la hace adecuada para agregados, joins y productos gold cuya semántica es una instantánea consistente. El autor debe razonar sobre frescura del refresh, coste de actualización y capacidad de incrementalización. Una materialized view independiente creada desde SQL sigue usando un pipeline administrado por detrás, mientras un proyecto Lakeflow agrupa muchos objetos bajo una misma frontera operativa. Cambiar la definición puede alterar el plan y desencadenar refresh más amplio.",
    [
      "La definición registra una consulta y sus dependencias. En cada refresh, el sistema detecta cambios upstream y determina una estrategia: aplicar únicamente deltas cuando puede demostrar equivalencia o recomputar partes o todo el resultado cuando no puede. El resultado se publica transaccionalmente como una tabla consultable. El event log y el query fingerprint permiten observar el modo de actualización y las causas de un refresh completo. Los consumidores leen el estado materializado sin ejecutar el join o agregado original en cada consulta.",
      "La incrementalización depende de operadores, fuentes y cambios de código; no debe presupuestarse coste mínimo sin medir. Una UDF opaca, consulta no determinista o dependencia incompatible puede obligar a recomputación. Una frecuencia de refresh alta mejora frescura, pero puede solapar cambios pequeños con overhead de arranque; una baja reduce coste y sirve datos más antiguos. Si el requisito es reaccionar fila por fila a una fuente streaming con checkpoint explícito, una streaming table suele encajar mejor. Si se necesita una instantánea corregible que refleje deletes y updates upstream, la materialized view suele expresar mejor la intención.",
    ],
    [
      ["Materialized view", "Resultado persistido de una consulta declarativa batch que el pipeline refresca para mantenerlo sincronizado con sus dependencias de datos.", "Ofrece lecturas rápidas y consistentes para productos complejos sin recalcular toda la consulta por consumidor."],
      ["Incrementalización", "Capacidad del motor para transformar cambios upstream en cambios equivalentes del resultado sin recomputar completamente la consulta declarada.", "Determina coste y duración de refresh, pero depende del plan y no debe asumirse como garantía universal."],
      ["Query fingerprint", "Identidad derivada de la definición y plan que ayuda a detectar cuándo cambió la lógica mantenida por una vista materializada.", "Permite explicar refresh completos y relacionar variaciones de coste con despliegues concretos del código."],
    ],
    "Finanzas necesita una tabla de margen diario que combine pedidos, devoluciones y tipos de cambio corregibles, con consultas rápidas y una frescura máxima de una hora.",
    [
      "Elegir materialized view porque el producto representa el estado completo corregido de varias relaciones, incluidos updates y deletes upstream.",
      "Configurar y medir refresh horario, observando en el event log si el plan incrementaliza o realiza recomputaciones costosas después de cambios.",
      "Mantener deterministas las expresiones y ensayar una modificación de esquema, estimando duración y presupuesto antes de desplegarla en producción.",
    ],
    "Finanzas obtiene un snapshot consistente y rápido de consultar, con una estrategia de refresco observable y un coste que se verifica en vez de suponerse.",
  ),
  m18l4: deepDive(
    "Un flow es la unidad que describe cómo datos de una fuente llegan a un target. Separar flow y tabla permite que varios orígenes alimenten el mismo dataset bajo reglas claras: un append flow para regiones, un AUTO CDC flow para cambios de clientes o un flow `ONCE` para una carga histórica. La multiplicidad no equivale a permitir escrituras arbitrarias concurrentes; todos los flows forman parte del grafo y del protocolo gestionado del pipeline. `ONCE` ejecuta una carga una sola vez dentro del ciclo de vida registrado y puede volver a ejecutarse en un refresh completo, por lo que su lógica debe ser determinista. AUTO CDC es el nombre vigente recomendado; `APPLY CHANGES` conserva la misma sintaxis y sigue disponible, además de aparecer en material de certificación Professional. El estudiante debe reconocer ambos términos sin presentar el nombre anterior como la opción nueva.",
    [
      "Un append flow lee una fuente streaming o batch compatible y añade sus filas al target declarado. Varios append flows pueden unificar feeds con el mismo contrato, y cada uno mantiene su progreso. Un AUTO CDC flow añade semántica de keys, sequence, deletes y SCD sobre la streaming table destino. Un flow marcado `once` procesa su entrada en la primera actualización aplicable y registra ese estado; una reconstrucción completa puede volver a incluirlo. El nombre del flow ayuda a distinguir progreso, métricas y errores en el event log.",
      "Múltiples flows exigen esquemas compatibles y una política de identidad global; dos regiones pueden producir la misma key y crear conflictos si no se namespacea. Un backfill `ONCE` no debe escribir efectos externos ni asumir que nunca se repetirá bajo full refresh. Mezclar append de eventos con snapshot completo en el mismo target crea duplicados semánticos. Para CDC, cambiar de `apply_changes` a `create_auto_cdc_flow` puede ser una migración nominal porque las firmas son equivalentes, pero cambiar sequence, keys o tipo SCD altera el contrato y requiere validación y posible destino nuevo.",
    ],
    [
      ["Append flow", "Flow declarativo que incorpora registros de una fuente al target sin interpretar cada nueva fila como una actualización de clave existente.", "Permite unir fuentes append-only manteniendo progreso y observabilidad separados dentro del mismo pipeline."],
      ["Flow ONCE", "Flow destinado a una carga finita que se ejecuta una vez en actualizaciones normales y puede repetirse durante full refresh.", "Sirve para bootstrap o backfill, pero obliga a escribir lógica determinista y compatible con reconstrucción."],
      ["APPLY CHANGES", "Nombre anterior todavía disponible para la API cuya opción recomendada actual se denomina AUTO CDC y conserva la misma sintaxis.", "Puede aparecer en código legado y en el blueprint Professional, por lo que hay que reconocerlo sin confundir la recomendación vigente."],
    ],
    "Tres regiones publican pedidos append-only, y una migración histórica debe cargar cinco años antes de activar el flujo diario sin duplicar filas durante futuros full refresh.",
    [
      "Crear append flows regionales con esquema común y una identidad que incluya región cuando los identificadores locales puedan colisionar.",
      "Implementar el histórico como flow `ONCE` determinista, deduplicado contra la misma clave global y sin llamadas externas irreversibles.",
      "Probar una actualización normal y un full refresh, verificando que el target converge al mismo conjunto y que cada flow aparece separadamente en telemetría.",
    ],
    "El target integra historia y llegadas continuas mediante flows gobernados, conservando reconstrucción reproducible y trazabilidad por origen sin escrituras ad hoc.",
  ),
  m18l5: deepDive(
    "Un proyecto declarativo mantenible organiza contratos, dominios y capas antes que archivos gigantes. Cada dataset tiene nombre estable, owner, comentario, claves, expectativas y dependencia clara; las funciones de definición son pequeñas y puras. La configuración de entorno —catálogo, schema, ubicaciones, tamaño o modo de ejecución— se inyecta desde el pipeline o bundle y no se codifica en cada notebook. El código compartido puede normalizar columnas y reglas, pero no debe generar dinámicamente un grafo imposible de revisar. Bronze conserva fidelidad de origen, silver aplica contratos y gold sirve productos; dividir por capas solo es útil si cada frontera tiene semántica de recuperación. Tests unitarios cubren funciones de DataFrame, mientras pruebas de integración crean datasets temporales y ejecutan updates. Lakeflow pipelines aporta la operación gestionada; el proyecto sigue necesitando control de versiones, revisión y promoción reproducible.",
    [
      "Durante evaluación, el runtime importa módulos y registra definiciones; cualquier acceso a widgets, reloj, red o acciones Spark puede cambiar el grafo entre ejecuciones. Las rutas de código se incluyen explícitamente en la configuración y los imports compartidos permanecen deterministas. Parámetros como `catalog` y `environment` se leen de configuración y validan al inicio. Un bundle o proceso CI despliega la misma fuente con variables diferentes, crea el pipeline y ejecuta una actualización de prueba antes de promoción. El event log se publica en un schema operativo gobernado.",
      "Separar un pipeline por cada tabla maximiza aislamiento pero multiplica operación y latencia; agrupar todos los dominios reduce overhead pero amplía el radio de fallo y permisos. La frontera adecuada reúne datasets que cambian y se recuperan juntos. Metaprogramación excesiva oculta nombres y linaje; repetición pequeña puede ser preferible a una fábrica opaca. Las librerías se fijan y prueban con la versión de runtime. Un cambio incompatible crea versión paralela, compara datos y hace cutover, en vez de mutar silently una tabla compartida.",
    ],
    [
      ["Definición pura", "Función declarativa determinista que construye y devuelve un DataFrame sin ejecutar acciones ni producir efectos externos durante la evaluación.", "Garantiza que el mismo código y configuración generen el mismo grafo en validación, despliegue y reintento."],
      ["Frontera de pipeline", "Conjunto de datasets y flows que comparten actualización, configuración, permisos, observabilidad y estrategia de recuperación coordinada.", "Equilibra aislamiento operativo con complejidad y evita agrupar dominios que no deberían fallar o desplegarse juntos."],
      ["Promoción reproducible", "Proceso que despliega el mismo artefacto versionado en dev, test y prod cambiando únicamente configuración controlada y credenciales.", "Reduce divergencias manuales y permite atribuir cada resultado a una versión concreta revisada y probada."],
    ],
    "Un pipeline de 3.000 líneas mezcla ventas y recursos humanos, contiene rutas de producción codificadas y crea tablas según la hora del día durante la evaluación.",
    [
      "Separar dominios por permisos y ciclo de recuperación, definiendo contratos estables y funciones puras para cada dataset del grafo.",
      "Extraer catálogo, schema y entorno a configuración validada, fijar dependencias y eliminar decisiones basadas en reloj o efectos laterales.",
      "Desplegar mediante el mismo artefacto en test, ejecutar fixtures y comparar event log y resultados antes de promover la versión a producción.",
    ],
    "El proyecto queda revisable, repetible y aislado por dominio; un despliegue produce el mismo grafo esperado y puede revertirse mediante una versión identificable.",
  ),
  m19l1: deepDive(
    "Una expectation es una regla booleana aplicada a cada fila que combina observación con una política de respuesta. La misma expresión puede conservar filas y registrar métricas, descartar las inválidas o fallar la actualización. La elección no expresa severidad estética, sino el daño de publicar el dato y la capacidad de remediarlo. `warn` —comportamiento de retención— sirve para medir y explorar; `drop` evita contaminar el target cuando perder esas filas está aceptado y existe trazabilidad; `fail` protege invariantes cuya violación invalida todo el resultado. En una actualización fallida, la transacción del flow se revierte, pero el alcance sobre flows paralelos y dependientes varía según el modo del pipeline. Además, las métricas de `fail` tienen limitaciones porque el update no se confirma como una ejecución normal. La regla necesita nombre estable, owner, umbral y ruta de investigación.",
    [
      "La expectation se incorpora al plan de la streaming table o materialized view y evalúa una expresión SQL por fila. Con retención, todas las filas continúan y los contadores de passed/failed se publican. Con drop, las filas que producen false o una semántica inválida se excluyen y se contabilizan. Con fail, una violación lanza un error, aborta la actualización afectada y preserva el target previamente confirmado. En pipelines triggered, otros flows paralelos pueden continuar; en continuous, se detienen el flow, sus dependientes y el pipeline según el comportamiento documentado.",
      "Una constraint no reemplaza tests de integridad entre tablas, reconciliación de conteos ni detección de drift. Expresiones costosas se ejecutan por fila y pueden impactar throughput. Un null en lógica SQL de tres valores no equivale automáticamente a true, así que condiciones deben tratarlo explícitamente. Aplicar drop sin persistir la fila y su procedencia destruye capacidad de corrección. Fail ante cualquier anomalía opcional crea indisponibilidad; warn para una clave primaria nula publica corrupción. La política se decide con análisis de riesgo y presupuesto de error.",
    ],
    [
      ["Expectation", "Restricción nombrada basada en una expresión booleana que evalúa calidad durante el procesamiento y registra o aplica una acción configurada.", "Integra controles de calidad con métricas y transacciones del pipeline en lugar de depender de comprobaciones posteriores aisladas."],
      ["Retain, drop, fail", "Tres políticas que respectivamente conservan y miden, excluyen filas inválidas, o abortan la actualización al detectar una violación.", "Permiten alinear cada regla con impacto, remediación y disponibilidad, evitando usar una única respuesta para toda anomalía."],
      ["Lógica de tres valores", "Semántica SQL donde una expresión con null puede resultar unknown en vez de verdadero o falso explícito.", "Obliga a formular constraints de nulabilidad cuidadosamente para no clasificar datos de forma distinta a la intención."],
    ],
    "Un feed de pedidos presenta 0,02 % de códigos postales desconocidos y ocasionalmente importes negativos, mientras `order_id` nulo haría imposible reconciliar cualquier venta.",
    [
      "Retener y medir códigos postales inicialmente para conocer distribución sin interrumpir un flujo cuyo dato principal sigue siendo utilizable.",
      "Enviar importes negativos a una ruta reparable o descartarlos según contrato financiero, conservando identidad y evidencia de la fila.",
      "Fallar la actualización ante `order_id` nulo porque viola identidad estructural y verificar el alcance del fallo sobre flows dependientes.",
    ],
    "Cada anomalía recibe una respuesta proporcional y observable: disponibilidad para casos tolerables, remediación para datos reparables y protección transaccional para invariantes críticas.",
  ),
  m19l2: deepDive(
    "Cuarentena no significa una carpeta donde los datos malos desaparecen; es un producto operativo con identidad, procedencia, causa, estado y ruta de reingreso. El patrón más explicable evalúa reglas una vez, añade un mapa o array de violaciones y divide el DataFrame en válido e inválido. La fila de cuarentena conserva payload original, campos parseados, fuente, coordenada, versión de contrato, tiempo de detección y nombres de reglas. Una reparación produce una nueva versión o evento, no modifica silenciosamente la evidencia. El reingreso utiliza la misma clave de negocio e idempotencia para evitar duplicar el target. Los datos pueden contener PII, por lo que cuarentena necesita controles de acceso y retención al menos tan estrictos como producción. Sus métricas revelan deuda: volumen entrante, edad, porcentaje corregido y causas recurrentes con owner.",
    [
      "Las reglas se materializan como columnas booleanas o una colección `failed_rules`. El flow válido filtra filas sin fallos y aplica expectativas apropiadas; otro flow selecciona las inválidas y escribe una streaming table de cuarentena con metadatos. Ambos derivan de la misma capa parsed para evitar discrepancias por lógica duplicada. Un proceso de remediación lee registros pendientes, añade correcciones aprobadas y los publica a una entrada de replay; el target usa `MERGE` o CDC por identidad estable. El registro original permanece inmutable para auditoría.",
      "Duplicar payloads sensibles aumenta superficie de riesgo y coste; se minimizan campos o se tokenizan cuando investigación no necesita texto completo. Una cuarentena sin SLA acumula millones de filas y se convierte en sumidero. Un error sistémico que afecta gran proporción no debe seguir degradando: umbrales convierten la tasa en fallo o incidente. Reprocesar directamente al target omitiendo las reglas originales crea un bypass; toda corrección atraviesa contrato versionado y registra quién, cómo y desde qué versión la autorizó.",
    ],
    [
      ["Provenance", "Metadatos que identifican origen, posición, versión y transformación mediante los cuales una fila llegó a la decisión de cuarentena.", "Permite reproducir el fallo, localizar productores responsables y demostrar que una corrección corresponde al registro exacto."],
      ["Estado de remediación", "Ciclo explícito de una anomalía, por ejemplo pendiente, investigada, corregida, descartada o reingresada con referencia a evidencia.", "Convierte cuarentena en una cola gobernada y permite medir deuda y cumplimiento de tiempos de resolución."],
      ["Reingreso idempotente", "Proceso que devuelve una fila corregida al flujo canónico sin crear más de una entidad o aplicar dos veces el mismo cambio.", "Evita que solucionar calidad introduzca duplicados y conserva una historia auditable de la reparación."],
    ],
    "Una integración sanitaria recibe identificadores mal formados junto con campos clínicos sensibles; cumplimiento exige corregir casos legítimos en 24 horas sin exponer payloads a todo el equipo.",
    [
      "Crear una tabla de cuarentena gobernada que conserve coordenada, reglas, versión y solo los campos mínimos necesarios, restringida al grupo autorizado.",
      "Asignar owner y estado, alertando por edad y tasa, mientras el flujo válido continúa únicamente si el porcentaje permanece bajo el umbral acordado.",
      "Publicar correcciones firmadas mediante una entrada idempotente que vuelve a ejecutar el contrato y enlaza resultado con el registro original inmutable.",
    ],
    "La organización repara datos dentro del plazo con mínimo acceso, conserva evidencia completa y evita que la cuarentena sea un vertedero o una puerta trasera.",
  ),
  m19l3: deepDive(
    "El pipeline event log es la bitácora estructurada de una ejecución declarativa. Registra eventos de actualización, flows, progreso, calidad, linaje, configuración y errores con un schema documentado y campos JSON para detalles. No es una tabla de negocio ni conviene depender de campos internos no documentados, porque pueden cambiar. La lectura comienza por identificar update y flow, ordenar por la secuencia del evento y extraer únicamente estructuras soportadas. Una fila aislada rara vez cuenta la historia completa: se correlacionan inicio, progreso y final de la misma actualización. Publicar el event log como tabla de Unity Catalog facilita permisos, retención y consultas cross-pipeline. Las expectations `warn` y `drop` producen métricas consultables; una violación `fail` aborta y puede no registrar contadores equivalentes, por lo que se combina el error del flow con datos de entrada y logs.",
    [
      "Cada evento incluye identidad, timestamp, nivel, tipo, origen, secuencia y un campo `details` cuyo contenido depende de la clase. Las consultas filtran tipos soportados y usan operadores JSON para proyectar métricas de flow progress o calidad. Agrupar por `update_id`, `flow_id` y expectation permite calcular filas aprobadas, fallidas y tasa. Eventos de lineage enlazan fuentes y targets. El orden semántico usa la secuencia documentada, no confía solo en timestamps que pueden coincidir o proceder de componentes distribuidos.",
      "El event log puede crecer y contener información operacional sensible; se aplican retención, privilegios y vistas para consumidores. Alertas no deberían consultar JSON completo sin filtros ni usar `SELECT *` como contrato. Un campo observado empíricamente pero no documentado se trata como interno. Para métricas de largo plazo se transforma a un modelo estable propio con versionado. La ausencia de eventos puede significar pipeline detenido o problema de publicación; una señal externa de ejecución ayuda a diferenciar. Siempre se conserva enlace al evento raw para investigación.",
    ],
    [
      ["Update", "Instancia identificable de actualización del pipeline que agrupa planificación, ejecución de flows y resultado final bajo una misma operación.", "Es la unidad correcta para correlacionar eventos y evitar mezclar métricas de ejecuciones concurrentes o sucesivas."],
      ["Event sequence", "Metadato estructurado que permite ordenar y relacionar eventos distribuidos del pipeline más fiablemente que un timestamp aislado.", "Hace posible reconstruir causalidad durante fallos y distinguir progreso anterior de mensajes posteriores de cierre."],
      ["Campo documentado", "Atributo del schema que Databricks declara apto para consumo de clientes y cuya semántica está publicada oficialmente.", "Reduce roturas al evitar dashboards dependientes de detalles internos que pueden cambiar sin contrato público."],
    ],
    "Tras un despliegue, la tasa de filas descartadas aumenta solo en uno de ocho flows y el dashboard actual mezcla datos de varias actualizaciones simultáneas.",
    [
      "Filtrar eventos de calidad por tipo documentado y agruparlos por `update_id`, flow y expectation antes de calcular cualquier tasa.",
      "Correlacionar el cambio con versión de pipeline y eventos de progreso, conservando secuencia para reconstruir el orden real de la actualización.",
      "Materializar una tabla operacional estable con dimensiones controladas y enlace al event log raw para alertas y análisis detallado posterior.",
    ],
    "El equipo localiza la regla y el flow responsables sin mezclar ejecuciones, y obtiene una base soportada para tendencias y alertas duraderas.",
  ),
  m19l4: deepDive(
    "Un contrato de calidad conecta significado de negocio con una expresión ejecutable y una respuesta operativa. Por cada regla documenta dimensión —validez, completitud, unicidad, consistencia, puntualidad—, ámbito, expresión, tolerancia, acción, owner, evidencia y procedimiento de remediación. Una expectation solo implementa la parte por fila; una clave única global, reconciliación entre tablas o frescura requieren controles agregados adicionales. Los umbrales deben basarse en riesgo: cero puede ser correcto para identidad primaria, pero absurdo para un atributo opcional con fuente imperfecta. Versionar el contrato permite explicar por qué cambió una tasa y revalidar historia. Antes de escribir código se prueban ejemplos límite, nulls, zonas horarias y evolución de schema. Separar regla de acción posibilita observar primero una nueva constraint, calibrarla y endurecerla sin modificar su significado.",
    [
      "El equipo define la población y el denominador: por ejemplo, pedidos de producción recibidos en una ventana, excluyendo tests identificados. La regla se expresa en SQL determinista y se asigna un nombre estable. Un nivel de fila se implementa como expectation; un control agregado se ejecuta después y publica resultados en una tabla de calidad. La política mapea severidad y tasa a warn, quarantine o fail. Los metadatos incluyen owner y enlace al runbook, de modo que la alerta no termine en un equipo genérico.",
      "Una regla que cambia silenciosamente invalida comparaciones históricas; se introduce una versión y se ejecuta en sombra para estimar impacto. El porcentaje por sí solo puede ocultar una pérdida concentrada en un país crítico, así que se segmenta por dimensiones de riesgo acotadas. Fallar por una dependencia externa sin modo degradado propaga indisponibilidad. Por otro lado, tolerar por presupuesto no significa descartar sin trazabilidad. El contrato define cuándo una tasa sostenida consume presupuesto y cuándo una sola fila de alto impacto basta para detener.",
    ],
    [
      ["Dimensión de calidad", "Categoría semántica que describe qué propiedad se evalúa, como completitud, validez, consistencia, unicidad o puntualidad del dato.", "Evita listas inconexas de expresiones y ayuda a comprobar que el producto cubre riesgos relevantes."],
      ["Denominador", "Población exacta sobre la que se calcula una tasa de cumplimiento, con inclusiones, exclusiones y ventana temporal definidas.", "Impide métricas engañosas cuyo porcentaje cambia por mezclar datos de prueba, replays o segmentos no comparables."],
      ["Contrato versionado", "Especificación identificable de reglas, umbrales, acciones y ownership válida para una versión del producto de datos.", "Permite auditar cambios, ejecutar reglas en sombra y atribuir variaciones a datos o a definiciones."],
    ],
    "Una plataforma global quiere declarar 99,5 % de direcciones válidas, pero los pedidos de recogida no llevan dirección y un país crítico usa un formato distinto.",
    [
      "Definir el denominador solo sobre pedidos que requieren envío y segmentar el país crítico para no ocultar su riesgo en el promedio global.",
      "Versionar expresiones por formato, ejecutar la nueva regla en modo observación y revisar falsos positivos con los owners locales.",
      "Asignar cuarentena y umbral sostenido para casos reparables, reservando fail para pérdidas que impidan identificar o cobrar correctamente el pedido.",
    ],
    "El indicador pasa a medir la población correcta y gobierna respuestas proporcionales, con una evolución trazable que no confunde cambio de regla con degradación real.",
  ),
  m19l5: deepDive(
    "Operar calidad significa convertir eventos y reglas en decisiones sostenidas. Los contadores de una expectation se transforman en tasas usando passed más failed como denominador, se agregan por update y se comparan con baselines y SLO. Una sola fila inválida puede ser crítica si afecta identidad; millones pueden ser tolerables si pertenecen a un campo opcional durante una migración acordada. Por eso alertas combinan severidad, proporción, volumen absoluto, duración y segmento. El event log muestra qué ocurrió dentro del pipeline; una tabla de calidad estable conserva tendencias, owners y estado de incidente. El ciclo completo incluye detectar, contener, diagnosticar, remediar, reingresar y prevenir recurrencia. Cambiar una expectation de drop a warn para hacer verde un Job no resuelve el problema: consume o redefine un riesgo y requiere aprobación del contrato.",
    [
      "Una tarea operacional extrae métricas documentadas del event log, agrupa por update, flow y expectation y calcula tasas con protección ante denominadores cero. Las une con catálogo de reglas para obtener severidad, owner y umbral. Ventanas móviles y consecutivas evitan alertas por ruido, mientras una regla crítica puede disparar de inmediato. Las alertas incluyen versión de código, muestras seguras, volumen afectado y enlace a cuarentena o runbook. Un dashboard muestra presupuesto consumido y edad de anomalías abiertas.",
      "Baselines adaptativos ayudan con estacionalidad, pero no deben reemplazar límites contractuales. Un aumento de drop puede preservar target mientras reduce completitud; por tanto el SLI del producto debe reflejarlo. Fail conserva el último estado bueno pero aumenta staleness, creando un tradeoff entre corrección y frescura. La respuesta puede pausar publicación downstream, activar modo degradado o permitir continuidad etiquetada. Después de reparar, se reprocesan filas con idempotencia y se verifica que métricas vuelvan a normalidad sin borrar la evidencia del incidente.",
    ],
    [
      ["Tasa de violación", "Proporción de registros fallidos respecto al total evaluado para una regla, update y población comparables claramente identificados.", "Normaliza volúmenes, pero debe acompañarse de conteo absoluto y criticidad para valorar el impacto real."],
      ["Presupuesto de calidad", "Cantidad acordada de incumplimiento tolerable durante una ventana antes de detener, degradar o escalar el producto.", "Hace explícito el equilibrio entre disponibilidad y corrección y evita decisiones improvisadas durante incidentes."],
      ["Modo degradado", "Estado operativo definido que mantiene parte del servicio mientras etiqueta, limita o retrasa resultados afectados por una anomalía conocida.", "Puede preservar utilidad sin presentar datos incompletos como normales, siempre que consumidores comprendan la señal."],
    ],
    "Una expectation empieza a descartar 3 % de pedidos tras un cambio upstream; la tabla permanece disponible, pero informes comerciales muestran una caída artificial de ventas.",
    [
      "Alertar por tasa y volumen sostenidos, relacionar el salto con versión upstream y declarar impacto de completitud aunque el pipeline siga verde.",
      "Contener la publicación del informe o marcarlo degradado, mientras las filas conservadas en cuarentena permiten diagnosticar el nuevo formato.",
      "Desplegar parser corregido, reingresar por clave idempotente y verificar reconciliación de ventas y recuperación del presupuesto antes de cerrar.",
    ],
    "La operación protege a consumidores de una cifra engañosa, repara los datos perdidos y conserva una historia cuantificable del incidente y su resolución.",
  ),
  m20l1: deepDive(
    "Un Lakeflow Job es un grafo de tareas, no una lista visual de notebooks. Cada arista declara una condición de dependencia y el scheduler ejecuta en paralelo únicamente las ramas cuyos prerrequisitos están satisfechos. El DAG debe reflejar dependencias de datos y efectos reales: dos tareas que escriben la misma tabla no son independientes aunque no se lean entre sí, y una arista innecesaria desperdicia paralelismo. La unidad de retry, timeout, compute, parámetros y observabilidad es la tarea; por eso conviene que sea cohesionada e idempotente. Un Job puede orquestar notebooks, scripts Python, pipelines, SQL y otros tipos, pero no convierte su contenido en transaccional de extremo a extremo. La arquitectura separa producir, validar y publicar para que un fallo no exponga datos parciales. Los nombres y task keys son contratos operativos porque aparecen en referencias dinámicas, repair runs, alertas y system tables.",
    [
      "Al iniciar un run, el scheduler materializa la versión configurada del grafo y marca tareas elegibles. Una tarea arranca cuando sus dependencias y condición `Run if` se cumplen; ramas sin dependencia pueden ejecutarse simultáneamente con compute compartido o separado según configuración. Cada resultado queda en un estado terminal que alimenta decisiones downstream. Un task de pipeline espera la actualización gestionada; uno de notebook termina según su proceso. El Job concluye cuando todas las tareas aplicables alcanzan estados compatibles con el resultado global.",
      "Paralelizar reduce duración crítica, pero aumenta concurrencia sobre warehouses, APIs y targets. Compartir job compute amortiza arranque y facilita caché, aunque un fallo o dependencia de librería puede afectar varias tareas; compute aislado reduce interferencia a mayor coste. Una tarea enorme limita reparación y visibilidad; fragmentar cada sentencia multiplica overhead. El camino crítico se mide en runs reales y las dependencias se revisan ante cambios. Para publicación atómica, las ramas escriben staging y una tarea final valida y conmuta una vista o realiza commit controlado.",
    ],
    [
      ["Task key", "Identificador estable y único de una tarea dentro del Job, utilizado por dependencias, referencias dinámicas, métricas y operaciones de reparación.", "Cambiarlo sin planificación puede romper parámetros downstream y comparabilidad histórica aunque el nombre visible parezca equivalente."],
      ["Camino crítico", "Secuencia dependiente de tareas cuya duración acumulada determina el tiempo mínimo posible para completar el run completo.", "Ayuda a optimizar donde realmente reduce SLA, en lugar de acelerar ramas que ya terminan antes."],
      ["Dependencia de efecto", "Relación no visible solo por lecturas, creada cuando tareas compiten por el mismo target, recurso externo o publicación.", "Debe representarse o eliminarse mediante aislamiento para impedir carreras y resultados no deterministas."],
    ],
    "Un Job diario carga ventas y clientes en paralelo, pero ambas tareas actualizan una tabla de métricas compartida antes de que una tercera publique el informe ejecutivo.",
    [
      "Separar las cargas para que cada rama escriba targets o staging independientes y declarar solo dependencias de datos verdaderamente necesarias.",
      "Añadir validaciones por rama y hacer que la publicación dependa de todas, evitando escrituras concurrentes sobre la misma tabla final.",
      "Medir el camino crítico y elegir compute compartido o aislado según librerías, arranque y contención demostrada durante ejecuciones de carga realistas.",
    ],
    "El DAG explota paralelismo seguro, elimina la carrera de escritura y ofrece una frontera final de publicación que puede repararse sin repetir trabajo sano.",
  ),
  m20l2: deepDive(
    "Los parámetros describen intención de ejecución; los task values transportan resultados pequeños calculados durante esa ejecución; las referencias dinámicas enlazan ambos sin copiar estado a notebooks. Un job parameter como `business_date` o `environment` debe tener tipo y validación conceptual, aunque llegue como texto. Puede propagarse a tareas mediante configuración, mientras `dbutils.jobs.taskValues.set` publica un valor para una tarea downstream o un `If/else`. No es un almacén de datos: payloads grandes pertenecen a tablas, Volumes u object storage y se pasan por referencia. Las referencias `{{...}}` se resuelven por el servicio antes de ejecutar la tarea y algunas no fallan si se escriben mal, por lo que deben revisarse y probarse. Secretos nunca viajan como parámetros visibles. El contrato incluye default seguro, timezone, formato, origen y comportamiento de rerun para que un repair use el mismo intervalo lógico.",
    [
      "Al disparar el Job, los valores suministrados se combinan con defaults y referencias del trigger. El scheduler sustituye referencias dinámicas en parámetros de cada tarea. Durante la ejecución, una tarea puede publicar un `taskValue` identificado por task key y clave; una downstream lo consulta explícitamente o lo usa en una condición. El valor queda ligado al run y no debe asumirse disponible en otro. Los datos voluminosos se materializan en una tabla con un `run_id`, y el task value transporta solo esa identidad o un conteo.",
      "Reutilizar widgets globales u obtener `current_date()` en cada notebook puede hacer que un repair al día siguiente procese otra ventana. El Job calcula y pasa un intervalo inmutable desde el trigger. Defaults útiles en desarrollo pueden ser peligrosos en producción si apuntan a catálogo incorrecto. Las referencias se validan con un run de test y observando parámetros resueltos, sin registrar secretos. Un task value ausente necesita rama o fallo claro; usar un fallback silencioso puede publicar datos aunque la tarea productora no haya calculado su control.",
    ],
    [
      ["Job parameter", "Entrada definida en el ámbito del Job que configura una ejecución y puede propagarse de forma consistente a múltiples tareas.", "Centraliza fecha, entorno o modo y hace reproducibles runs normales, manuales, backfills y reparaciones."],
      ["Task value", "Valor pequeño producido durante una tarea y expuesto por clave a condiciones o tareas posteriores dentro del mismo run.", "Permite comunicar decisiones y referencias sin acoplar notebooks a variables globales o archivos temporales implícitos."],
      ["Referencia dinámica", "Plantilla resuelta por Lakeflow Jobs con contexto del run, trigger, parámetros, tareas o metadatos disponibles oficialmente.", "Conecta configuración declarativa con valores de ejecución, pero exige sintaxis y alcance verificados para evitar literales accidentales."],
    ],
    "Un cierre financiero debe reprocesar exactamente la fecha original durante un repair realizado al día siguiente y pasar a publicación el conteo validado de asientos.",
    [
      "Calcular `business_date` una vez como parámetro del run y prohibir que notebooks la sustituyan por el reloj actual durante ejecución o repair.",
      "Persistir asientos con `run_id` y publicar solo conteo y referencia de staging mediante task values de tamaño pequeño.",
      "Hacer que validación y publicación fallen claramente si el valor requerido no existe, conservando parámetros resueltos para auditoría sin secretos.",
    ],
    "La reparación conserva el periodo contable exacto y comunica controles de forma explícita, sin depender de estado de notebook ni transportar datasets en parámetros.",
  ),
  m20l3: deepDive(
    "`If/else` y `Run if` controlan dimensiones diferentes. La tarea If/else compara un valor —parámetro, referencia dinámica o task value— con un operador y abre una rama verdadera o falsa. `Run if` evalúa estados terminales de dependencias, como todos correctos, al menos uno fallido o todos terminados, y decide si una tarea downstream es aplicable. Confundirlos produce DAGs frágiles: comprobar `row_count > 0` es decisión por valor; ejecutar limpieza aunque upstream falle es decisión por estado. Las tareas omitidas adquieren estados que influyen en dependientes, por lo que se diseña y prueba cada ruta, incluida la ausencia de datos. Una rama condicional no reemplaza validación transaccional: publicar porque una bandera dice true requiere confiar en quién calculó esa bandera y conservar evidencia. Las tareas de cleanup usan `All done`, pero deben ser idempotentes y no ocultar el fallo original.",
    [
      "Una tarea productora establece un task value serializable. If/else evalúa uno de los operadores soportados y el scheduler habilita la dependencia correspondiente; las tareas de la otra rama quedan excluidas. Por separado, cada tarea downstream configura `Run if` sobre los estados de sus upstream. Una notificación de fallo puede usar `At least one failed`; un teardown usa `All done`; la publicación suele requerir `All succeeded`. El resultado del Job conserva el fallo aunque una tarea de manejo se ejecute correctamente, según la topología y estados.",
      "Comparaciones numéricas y de strings deben respetar tipos y formatos; una fecha sin normalizar o booleano textual puede tomar la rama equivocada. Una condición nunca debe depender de mensajes de error libres. Las rutas menos frecuentes suelen quedar sin pruebas y acumulan permisos o parámetros inválidos. Se crean runs de fixtures para true, false, upstream failed y skipped. Las tareas de error escriben diagnóstico y alertan, pero no convierten corrupción en éxito. Si la lógica condicional crece demasiado, conviene separar Jobs o modelar una tabla de control gobernada.",
    ],
    [
      ["If/else task", "Tarea de control que compara un valor disponible con un operador soportado y habilita una de dos ramas del DAG.", "Expresa decisiones de negocio o de datos, como publicar únicamente cuando un conteo supera un umbral."],
      ["Run if", "Condición asociada a dependencias que decide ejecución según estados de tareas upstream, incluidos éxito, fallo o finalización.", "Permite cleanup, notificación y tolerancia parcial sin convertir estados técnicos en valores inventados."],
      ["Ruta omitida", "Conjunto de tareas que el scheduler no ejecuta porque una condición eligió otra rama o sus dependencias no aplican.", "Debe probarse porque su estado influye en downstream y puede ocultar que nunca se validó una alternativa rara."],
    ],
    "Un pipeline debe publicar si la reconciliación devuelve cero diferencias, alertar si existe alguna y limpiar staging tanto cuando la carga funciona como cuando falla.",
    [
      "Usar If/else sobre el task value numérico de diferencias para separar publicación y alerta de calidad, conservando la consulta que lo produjo.",
      "Configurar publicación con dependencias exitosas y limpieza con `All done`, sin permitir que cleanup o alerta oculten un fallo upstream.",
      "Probar runs con cero, valor positivo y error de carga, verificando estados de tareas ejecutadas y omitidas y resultado global del Job.",
    ],
    "El control distingue decisiones de datos de manejo de estados, cubre rutas de error y mantiene visible la causa original mientras libera recursos de forma segura.",
  ),
  m20l4: deepDive(
    "La tarea `For each` expande una colección en iteraciones de una tarea anidada y limita cuántas se ejecutan simultáneamente. Es adecuada cuando cada elemento —fecha, región, tabla— puede procesarse de forma aislada e idempotente. No es un sustituto general de paralelismo Spark: lanzar miles de tasks para particiones de un mismo DataFrame añade overhead de scheduler y compute que un único Job distribuido resolvería mejor. La colección debe ser acotada, validada y suficientemente pequeña para los límites de Jobs y referencias dinámicas. Cada iteración recibe el elemento actual y debe escribir a un namespace o clave que evite colisiones. La concurrencia se fija según cuotas de API, capacidad de warehouse y targets, no según el máximo disponible. Si una iteración falla, reparación y reintentos deben poder repetir solo esa unidad sin alterar las ya confirmadas.",
    [
      "Los inputs pueden venir de parámetros o task values en un formato admitido. El scheduler crea una instancia de la tarea anidada por elemento, inyecta su valor mediante referencia y mantiene hasta el límite de concurrencia. Cada instancia conserva estado y logs, lo que permite localizar el elemento fallido. Una downstream espera la finalización del contenedor según su condición. Los resultados grandes de cada iteración se escriben en tablas con `run_id` e item key, no se concatenan como task values desmesurados.",
      "Una lista duplicada puede ejecutar dos veces la misma unidad, por lo que se normaliza y valida antes del loop. Concurrencia alta puede provocar 429, bloqueos de base de datos o saturar un SQL warehouse aunque Jobs pueda lanzar las tasks. Compute nuevo por iteración multiplica arranque; compute compartido reduce coste pero puede tener aislamiento insuficiente. La lógica usa upsert o particiones deterministas y evita append ciego. Para millones de elementos se usa Spark reparticionado; For each se reserva a decenas o cientos de unidades operativas heterogéneas.",
    ],
    [
      ["Tarea anidada", "Definición ejecutable que For each instancia una vez por elemento, con parámetros resueltos y estado observable para esa iteración.", "Concentra la lógica repetible y permite reparar una unidad concreta sin duplicar toda la orquestación."],
      ["Concurrencia del bucle", "Máximo de iteraciones de For each que Lakeflow Jobs permite ejecutar simultáneamente dentro del run activo.", "Protege servicios y compute downstream y determina equilibrio entre duración, coste y riesgo de throttling."],
      ["Aislamiento por elemento", "Propiedad por la que una iteración lee y escribe recursos identificables sin competir ni depender implícitamente de otra.", "Es requisito para paralelismo seguro, idempotencia y reparación selectiva de iteraciones fallidas."],
    ],
    "Una empresa recalcula 80 países mediante una API que admite diez solicitudes concurrentes, y cada resultado debe reemplazar exclusivamente la partición de su país.",
    [
      "Validar y deduplicar la lista de países, usando cada código como parámetro e identidad de la salida de la tarea anidada.",
      "Limitar For each a diez o menos iteraciones según latencia y cuotas, evitando crear una task por cada fila retornada.",
      "Escribir cada partición idempotentemente con run metadata y probar que reparar un país fallido no modifica los 79 ya confirmados.",
    ],
    "El loop respeta la cuota externa, mantiene trazabilidad por país y permite una reparación selectiva sin convertir la orquestación en miles de tareas innecesarias.",
  ),
  m20l5: deepDive(
    "Un retry repite automáticamente una tarea ante un fallo que se presume transitorio; un repair run se inicia después para reejecutar tareas fallidas o omitidas y sus dependientes necesarios dentro de un run existente. Ninguno corrige lógica no idempotente. La política de retry especifica número, intervalo y, cuando aplica, backoff; debe ser corta para errores de red o capacidad recuperables y evitar tormentas sobre un servicio caído. Un error de schema, permiso o calidad determinista no mejora al repetir y consume tiempo de RTO. Repair conserva el contexto y parámetros del run original, por lo que es preferible a lanzar manualmente otro Job que pueda usar otra fecha. Antes de reparar se corrige la causa, se entiende qué outputs quedaron confirmados y se selecciona el mínimo subgrafo seguro. La publicación y los efectos externos necesitan claves que toleren repetición.",
    [
      "Cuando una tarea falla, Jobs consulta su configuración de retry y crea otro intento, conservando identidad del task run y parámetros. Si agota intentos, las downstream dependientes quedan sin ejecutar según condiciones. Desde la interfaz o API, un repair run elige tareas no satisfactorias; el scheduler reutiliza resultados exitosos cuando siguen válidos y reejecuta el subgrafo necesario. Logs y referencias dinámicas pueden incluir número de intento o repair para correlación. En Jobs continuous, el manejo incorpora reintentos con backoff según el comportamiento del servicio.",
      "Reintentar inmediatamente una API con 429 amplifica throttling; se usa backoff y jitter o se reduce concurrencia. Una tarea que hace append sin `run_id` duplica filas en retry. Una tarea exitosa puede haber producido un resultado funcionalmente defectuoso, y repair no la seleccionará solo por calidad; se necesita invalidación o nuevo run controlado. Cambiar parámetros durante repair rompe reproducibilidad. Tras reparar, validaciones comparan el estado completo antes de ejecutar publicación, y el postmortem decide si automatizar una clasificación de errores más precisa.",
    ],
    [
      ["Retry", "Nuevo intento automático de la misma tarea y contexto después de un fallo, sujeto a límites e intervalos configurados.", "Recupera errores transitorios sin intervención, pero exige idempotencia y clasificación para no repetir fallos deterministas."],
      ["Repair run", "Reanudación explícita de un run existente que reejecuta el subconjunto fallido o dependiente conservando su contexto original.", "Reduce trabajo duplicado y mantiene la fecha y parámetros lógicos después de corregir una causa."],
      ["Backoff", "Estrategia que aumenta el intervalo entre intentos, normalmente con aleatoriedad, para reducir presión sobre una dependencia degradada.", "Evita tormentas coordinadas de reintentos y mejora probabilidad de recuperación de servicios con throttling."],
    ],
    "La tarea de publicación recibe 429 tras confirmar staging; dos retries inmediatos fallan y el equipo quiere relanzar todo el Job con la fecha actual.",
    [
      "Mantener staging idempotente y clasificar 429 como transitorio, ajustando retry con backoff acorde a la cuota del servicio externo.",
      "Reparar únicamente publicación y dependientes desde el run original para conservar `business_date`, sin repetir las cargas exitosas.",
      "Validar que la idempotency key impide doble publicación si el proveedor aceptó un intento cuya respuesta se perdió antes del fallo.",
    ],
    "La operación recupera solo el subgrafo necesario con el contexto original y evita tanto una tormenta de retries como duplicados en la frontera externa.",
  ),
  m21l1: deepDive(
    "Un trigger debe representar la señal que afirma que existe trabajo, no la costumbre de ejecutar cada hora. Un schedule expresa una obligación temporal aunque no haya datos; file arrival reacciona a nuevos objetos en una ubicación gobernada; table update reacciona a commits de datasets compatibles; continuous inicia un run tras otro para servicios siempre activos. La señal no sustituye idempotencia: eventos pueden agruparse, repetirse o llegar mientras otro run está activo. Tampoco determina por sí sola la ventana de datos; el Job calcula límites reproducibles a partir del trigger y su checkpoint o tabla de control. Schedules incorporan timezone y horario de verano; triggers por evento incorporan espera tras el último cambio y mínimo entre ejecuciones. Elegir correctamente reduce polling y compute ocioso, pero exige entender disponibilidad de file events, permisos y comportamiento cuando se alcanza la concurrencia máxima.",
    [
      "El scheduler registra la configuración activa y, cuando se satisface, crea un run con metadatos del trigger accesibles mediante referencias dinámicas soportadas. Un schedule usa expresión y timezone; un evento de archivo o tabla se acumula según debounce/cooldown antes de lanzar. Continuous espera la finalización o fallo del run anterior y comienza el siguiente con comportamiento de reintento propio. Por defecto solo un run puede estar activo, y al superar máxima concurrencia los runs pueden quedar en cola o ser omitidos según configuración y tipo.",
      "File arrival señala presencia de objetos, no que su contenido sea completo o válido. Table update puede dispararse por cambios filtrados después por una vista y, al vigilar varias tablas, requiere decidir any versus all. Un schedule puede ser mejor para cierres regulatorios que deben generar salida vacía explícita. Continuous ofrece baja latencia, pero una tarea finita mal diseñada puede girar sin trabajo y consumir coste. Las referencias del trigger se registran como contexto, mientras el procesamiento conserva una frontera idempotente independiente.",
    ],
    [
      ["Schedule trigger", "Regla temporal con frecuencia y zona horaria que inicia runs incluso cuando ninguna fuente comunica una llegada de datos.", "Es apropiada para obligaciones de calendario, pero exige manejo explícito de ventanas, festivos y horario de verano."],
      ["Event trigger", "Mecanismo que inicia un run al observar llegada de archivo, actualización de tabla u otro cambio soportado y gobernado.", "Reduce polling y latencia ociosa, aunque la señal debe agruparse y no garantiza contenido válido."],
      ["Continuous trigger", "Modo de Jobs que mantiene servicio iniciando un nuevo run después de terminar o fallar el anterior con manejo específico.", "Encaja con cargas siempre activas, pero requiere costes, retries y ausencia de trabajo cuidadosamente controlados."],
    ],
    "Un informe regulatorio debe producirse a las 08:00 aunque no haya operaciones, mientras la ingestión de socios llega en archivos irregulares durante todo el día.",
    [
      "Mantener schedule con timezone explícita para el informe, haciendo que una ventana vacía sea un resultado válido y auditable.",
      "Usar file arrival para ingestión con debounce y checkpoint, validando completitud del archivo después de recibir la señal.",
      "Separar ambos Jobs y registrar referencias de trigger y fronteras de datos para que reintentos no cambien el periodo procesado.",
    ],
    "Cada flujo se activa por la realidad que representa: obligación temporal para regulación y evento de disponibilidad para ingestión, ambos con procesamiento reproducible.",
  ),
  m21l2: deepDive(
    "File arrival monitoriza una external location o Volume gobernado por Unity Catalog y convierte notificaciones de objetos en runs. Con file events habilitados en la external location, la plataforma usa eventos del proveedor para mayor eficiencia y escalabilidad; sin ellos puede depender de mecanismos de listing con más límites. `Wait after last change` actúa como debounce: cada llegada reinicia la espera para agrupar una ráfaga. `Minimum time between triggers` limita frecuencia después de un run. Ninguno garantiza que un archivo haya terminado de escribirse correctamente ni que pertenezca al contrato; productores deben publicar atómicamente o acompañarlo de manifest. El Job no debe confiar solo en el nombre recibido: Auto Loader o una tabla de control conserva qué archivos fueron procesados. Eventos duplicados o agrupados son normales y la carga debe converger.",
    [
      "El servicio vigila la ubicación autorizada, recibe o descubre cambios y espera según la configuración avanzada. Cuando crea el run, no necesariamente produce uno por archivo; una ejecución puede abarcar varias llegadas. La tarea enumera o consume incrementos mediante una fuente con checkpoint, valida tamaño, schema y manifest y confirma una tabla bronze. El cooldown evita una cascada de runs cuando un productor carga miles de partes. Las credenciales y permisos de Unity Catalog gobiernan tanto monitorización como lectura efectiva.",
      "Elegir una espera excesiva aumenta frescura; una demasiado corta inicia runs antes de completar una entrega multipart. Mover o reescribir objetos puede generar eventos distintos según proveedor. Las rutas con enorme cardinalidad necesitan file events y particionado razonable. Si un run dura más que la cadencia de llegada, concurrencia debe permanecer controlada y el siguiente run recoger el backlog desde estado, no procesar una lista efímera. Para backfills masivos se puede pausar trigger y ejecutar una carga parametrizada separada.",
    ],
    [
      ["File events", "Notificaciones de cambios de almacenamiento configuradas en una external location para evitar listing repetitivo y detectar llegadas eficientemente.", "Mejoran escala y latencia de triggers y Auto Loader, pero necesitan configuración y permisos del entorno cloud."],
      ["Debounce", "Espera que se reinicia con cada cambio adicional para agrupar una ráfaga antes de iniciar un único run.", "Evita procesar entregas multipart incompletas y reduce overhead de numerosos runs casi simultáneos."],
      ["Manifest", "Archivo o registro de control que declara partes, conteos, checksums y completitud de una entrega lógica de datos.", "Permite distinguir una llegada visible de un dataset realmente completo y seguro para publicar."],
    ],
    "Un socio entrega cada hora 2.000 archivos y un manifest final; iniciar al primer objeto publica datos parciales y lanzar un run por archivo satura el workspace.",
    [
      "Habilitar file events en la ubicación gobernada y configurar debounce para abarcar la duración habitual de la ráfaga sin exceder el SLA.",
      "Exigir manifest y validar conteos y checksums antes de confirmar bronze, dejando el checkpoint como autoridad de archivos procesados.",
      "Limitar concurrencia y medir backlog; si una entrega supera la espera, mantenerla pendiente en vez de presentar una partición incompleta.",
    ],
    "La ingestión crea un run por entrega lógica, verifica completitud y escala mediante eventos sin depender de un disparo exacto por cada archivo físico.",
  ),
  m21l3: deepDive(
    "Table update trigger inicia un Job cuando cambian tablas o vistas soportadas de Unity Catalog. Puede vigilar una sola fuente o varias y disparar cuando se actualice cualquiera (`Any`) o cuando todas hayan cambiado (`All`). La señal se refiere a commits observados, no necesariamente a filas relevantes para la consulta downstream: una vista filtrada puede considerarse actualizada aunque el cambio quede fuera del filtro. Las referencias dinámicas exponen lista de tablas actualizadas y, según el caso, versión y timestamp de commit; permiten procesamiento selectivo y auditoría. `Wait after last change` y mínimo entre triggers agrupan oleadas de commits. File events en las ubicaciones subyacentes mejoran rendimiento y habilitan capacidades relacionadas. El Job conserva de todos modos una tabla de control o checkpoints, porque dos commits pueden agruparse y una notificación no define exactamente el rango consumido.",
    [
      "El trigger evalúa cambios de objetos configurados y, al cumplir Any o All y las esperas, crea un run. `{{job.trigger.table_update.updated_tables}}` proporciona una lista JSON de objetos cambiados desde el run anterior; otras referencias ofrecen commit version o timestamp para tablas vigiladas. Una tarea puede decidir qué ramas procesar, pero valida el input y persiste el punto confirmado después de publicar. Para vistas soportadas, el sistema observa dependencias, de modo que un cambio upstream puede activar aunque el resultado visible permanezca igual.",
      "All puede bloquear indefinidamente si una tabla de referencia rara vez cambia; Any puede ejecutar antes de que dos fuentes coordinadas completen el mismo periodo. El contrato upstream debe definir si commits son independientes o forman una entrega conjunta. Hay límites de objetos por trigger y restricciones para algunas vistas o fuentes federadas que deben verificarse. Un loop causado porque el Job escribe una tabla que indirectamente activa su propio trigger se evita separando inputs monitorizados de outputs y documentando linaje.",
    ],
    [
      ["Updated tables reference", "Lista dinámica de objetos que el table update trigger observó como modificados para el contexto del run creado.", "Permite saltar ramas innecesarias y conservar evidencia de por qué se inició la ejecución."],
      ["Any versus All", "Política que dispara cuando cambia al menos una tabla vigilada o espera a que todas registren actualización respectivamente.", "Debe corresponder al contrato de coordinación upstream para evitar runs prematuros o bloqueados."],
      ["Commit signal", "Indicación de que un objeto gobernado registró una actualización, independientemente de si todas sus filas afectan al producto downstream.", "Evita interpretar el trigger como una prueba de cambio semántico y justifica filtrado y checkpoint propios."],
    ],
    "Un producto combina ventas diarias y tipos de cambio mensuales; usar All impediría 29 cierres, mientras Any podría recomputar tipos innecesariamente cada día.",
    [
      "Configurar Any para disponibilidad de ventas y tratar tipos como referencia vigente, no como requisito de cambio diario simultáneo.",
      "Usar updated tables y versiones para decidir qué materialized views o validaciones necesitan refresh, conservando frontera por fuente.",
      "Probar que la escritura de outputs no crea un ciclo de trigger y que un cambio filtrado no altera resultados ni duplica publicación.",
    ],
    "El Job reacciona a ventas sin esperar un commit mensual y utiliza metadatos del trigger para evitar trabajo innecesario manteniendo resultados reproducibles.",
  ),
  m21l4: deepDive(
    "Concurrencia describe cuántos runs del mismo Job pueden estar activos; queueing decide si un run espera cuando no hay capacidad; timeouts acotan cuánto puede permanecer una tarea o run; notificaciones comunican estados relevantes. Estos controles forman una política de presión, no simples opciones. La configuración segura por defecto suele ser una ejecución concurrente para evitar que dos runs escriban el mismo periodo. Aumentarla solo es correcto si ventanas, staging, checkpoints y efectos están aislados. Cuando los triggers llegan más rápido que el procesamiento, poner todo en cola conserva trabajo pero aumenta frescura y puede crear una deuda imposible; omitir runs es aceptable únicamente si el siguiente procesa acumulativamente desde un checkpoint. Timeouts deben exceder p99 normal y activar cancelación idempotente, no matar cargas sanas durante picos. Las alertas incluyen inicio tardío, duración, fallo y pérdida de SLA, no solo estado final.",
    [
      "El scheduler compara runs activos con `max_concurrent_runs`. Si queueing está habilitado y la plataforma lo admite, un nuevo run espera; en otros comportamientos puede omitirse al exceder concurrencia. Las tareas tienen retries y timeouts propios, y el Job puede imponer duración global. Una cancelación envía señal al compute, pero una llamada externa ya confirmada no se revierte. Las notificaciones por email o destinos del sistema se configuran para fallos, duración y otros eventos, y system tables permiten medir espera, ejecución y frecuencia histórica.",
      "Aumentar concurrencia para reducir cola puede empeorar la duración por contención y duplicar tablas. Un trigger por evento con `availableNow` suele converger con un solo run: el siguiente recoge todo lo no confirmado. Jobs particionados por fecha pueden admitir varios runs si cada fecha escribe staging independiente y una publicación serializa. Alertar por cada retry produce ruido; se alerta al agotar presupuesto o superar SLO. Los timeouts se prueban en backfill y pico, y el runbook distingue cancelar, dejar terminar o ampliar capacidad.",
    ],
    [
      ["Max concurrent runs", "Límite configurado de ejecuciones simultáneas del mismo Job que el scheduler admite antes de aplicar espera u omisión.", "Protege targets y dependencias, y solo debe crecer cuando existe aislamiento demostrable entre runs."],
      ["Queueing", "Política que mantiene un run pendiente hasta disponer de capacidad en lugar de descartarlo inmediatamente por límites de concurrencia.", "Preserva trabajo, pero transforma saturación en latencia acumulada que debe medirse contra frescura."],
      ["Timeout", "Límite de tiempo tras el cual una tarea o ejecución se cancela y adopta un estado terminal de fallo.", "Contiene bloqueos y coste, pero necesita idempotencia porque cancelar no deshace efectos externos ya confirmados."],
    ],
    "Un trigger de archivos crea runs cada tres minutos, cada carga tarda ocho y todas escriben la misma tabla silver; la cola crece y operaciones propone concurrencia cinco.",
    [
      "Mantener una sola ejecución porque los writes y checkpoint no están aislados, usando una fuente incremental que acumule archivos pendientes.",
      "Configurar debounce o frecuencia y medir que cada run `availableNow` vacíe backlog más rápido que la llegada media sostenida.",
      "Alertar por edad del dato y espera, ajustando capacidad o particionado antes de permitir concurrencia que produciría carreras de publicación.",
    ],
    "La política absorbe ráfagas mediante progreso incremental y hace visible la deuda de frescura, sin multiplicar runs que competirían por el mismo estado.",
  ),
  m21l5: deepDive(
    "Un backfill es una ejecución histórica del mismo contrato de transformación, delimitada por parámetros reproducibles y aislada de la publicación corriente. No debería requerir copiar un notebook y cambiar fechas manualmente. El Job acepta `start`, `end`, versión de código y modo, lee una fuente durable y escribe staging o particiones deterministas. La granularidad equilibra paralelismo y overhead; For each por día puede servir para meses, mientras millones de claves pertenecen a Spark. El backfill coexiste con producción mediante rangos no solapados o un paso serial de reconciliación. Debe cubrir inserts, updates y deletes, no solo añadir filas faltantes. Una vez validado, un `MERGE`, replaceWhere controlado o cutover publica el resultado. El checkpoint streaming de producción no se rebobina, y los efectos externos permanecen deshabilitados o idempotentes durante historia.",
    [
      "Una tarea genera intervalos cerrados-abiertos y For each procesa cada uno con concurrencia limitada. Cada iteración escribe a staging etiquetado con `backfill_id`, rango y versión, y produce métricas. Validaciones agregadas comprueban conteos, unicidad, importes y cobertura. Una tarea final ordenada compara con la tabla vigente y aplica cambios por clave o sustituye particiones completas cuando la semántica lo permite. El estado de cada intervalo permite repair selectivo sin volver a ejecutar los ya aprobados.",
      "Ejecutar backfill con código actual puede producir una historia diferente a la versión original; eso puede ser objetivo o defecto y se documenta. Un rango demasiado grande causa spill y timeout; demasiado pequeño multiplica arranque y commits. Producción puede modificar la misma partición mientras se valida, generando lost updates; se usa un punto de corte o se repropagan cambios posteriores. Borrar y reinsertar no maneja consumidores CDF igual que un MERGE, por lo que el impacto downstream se prueba antes.",
    ],
    [
      ["Intervalo cerrado-abierto", "Rango temporal que incluye su inicio y excluye su final, permitiendo concatenar particiones sin huecos ni doble conteo fronterizo.", "Hace deterministas backfills por día u hora y evita duplicar eventos exactamente en medianoche."],
      ["Backfill id", "Identificador único de la campaña histórica que acompaña staging, métricas, logs, approvals y acciones de publicación asociadas.", "Permite auditar, reparar y revertir una corrección sin mezclarla con runs normales o campañas anteriores."],
      ["Punto de corte", "Versión u instante hasta el cual se reconstruye historia antes de reconciliar cambios nuevos que producción continúa generando.", "Evita carreras y pérdida de updates durante una reconstrucción larga que convive con el flujo activo."],
    ],
    "Una corrección fiscal obliga a recalcular dos años de facturas mientras el pipeline diario sigue incorporando ajustes sobre los mismos clientes y meses recientes.",
    [
      "Fijar versión de corte y dividir meses en intervalos cerrados-abiertos, escribiendo staging aislado con backfill id y código aprobado.",
      "Limitar concurrencia según warehouse y validar impuestos, claves, deletes y cobertura por intervalo antes de marcarlo publicable.",
      "Serializar el cutover, aplicar o repropagar cambios posteriores al corte y conservar la tabla anterior para rollback y auditoría.",
    ],
    "La historia se corrige de forma paralela y verificable sin rebobinar producción, y el cutover preserva los cambios nuevos ocurridos durante el cálculo.",
  ),
  m22l1: deepDive(
    "Un pipeline de producción comienza con contratos y requisitos no funcionales, no con decoradores. Para cada fuente se documentan owner, formato, claves, secuencia, frecuencia, volumen, retención, evolución y semántica de delete. Para cada consumidor se definen grain, frescura, completitud, historia, permisos y tolerancia a cambios. Los NFR convierten esas relaciones en decisiones: RPO/RTO determinan checkpoints y bronze; SLA determina trigger y capacidad; privacidad determina catálogo y columnas; coste limita refresh y retención. Solo entonces se eligen streaming tables, materialized views, AUTO CDC, expectations y Jobs. El diagrama incluye fronteras de commit y recuperación, no solo flechas. Una matriz de riesgos cubre datos tardíos, snapshots parciales, schema drift, dependencia caída y backfill. El proyecto final demuestra por qué cada objeto existe y qué ocurriría si se reemplazara por una alternativa.",
    [
      "El diseño transforma requisitos en una especificación ejecutable: contratos versionados, esquema canónico, claves, secuencia, capas, flows y políticas de calidad. Se estima throughput nominal y pico, cardinalidad stateful y ventana de replay. Se decide frontera de pipeline por dominio y permisos, catálogo por entorno y event log gobernado. Un Job coordina actualización, validación y publicación con parámetros inmutables. Antes de implementar se crean fixtures que representan inserts, updates, deletes, duplicados, tardanza y corrupción.",
      "Optimizar solo latencia puede fusionar etapas y perder aislamiento; maximizar aislamiento puede multiplicar coste y commits. Una materialized view aporta estado corregible, pero su refresh puede ser más caro; una streaming table reduce lectura si la fuente es incremental. AUTO CDC elimina lógica manual, pero sigue dependiendo de una secuencia confiable. Fail protege invariantes, aunque puede degradar frescura. Cada tradeoff se registra con métrica y criterio de revisión, evitando decisiones irreversibles basadas en intuición o nombres de producto.",
    ],
    [
      ["Requisito funcional", "Comportamiento que el producto debe ofrecer, como aplicar deletes, conservar historia o publicar una métrica con grain definido.", "Determina la semántica correcta del modelo y permite probar si los datos responden preguntas esperadas."],
      ["Requisito no funcional", "Propiedad operativa cuantificada, como latencia, disponibilidad, recuperación, seguridad, escalabilidad o coste bajo condiciones específicas.", "Convierte arquitectura en compromisos medibles y evita considerar suficiente que una consulta produzca filas."],
      ["Frontera de commit", "Punto durable y atómico después del cual una etapa considera su resultado publicado y permite avanzar a dependientes.", "Hace explícita la recuperación y evita exponer resultados parciales durante fallos o reintentos."],
    ],
    "Una empresa combina pedidos Kafka, snapshots de clientes y referencias batch; exige silver en cinco minutos, SCD2 auditable, recuperación en una hora y aislamiento de PII.",
    [
      "Formalizar claves, secuencias, completitud de snapshots y consumidores, cuantificando pico, retención, RPO/RTO y atributos cuya historia debe conservarse.",
      "Asignar streaming table a pedidos, AUTO CDC FROM SNAPSHOT a clientes y materialized views a productos corregibles, con catálogos y permisos adecuados.",
      "Definir checkpoints, event log, expectations, backfill y pruebas de fallo antes de estimar capacidad y aprobar el diseño para implementación.",
    ],
    "La arquitectura queda trazada desde cada requisito hasta un mecanismo y una prueba, ofreciendo una base autosuficiente para justificar decisiones técnicas y operativas.",
  ),
  m22l2: deepDive(
    "Combinar append y CDC exige mantener semánticas separadas hasta una frontera común. Los pedidos append-only representan hechos nuevos y entran mediante un flow incremental; los clientes representan estado mutable y llegan como cambios que AUTO CDC ordena y aplica a una streaming table. `AUTO CDC` es la opción vigente recomendada por Databricks; `APPLY CHANGES` mantiene la misma sintaxis, sigue disponible y puede aparecer en preguntas Professional o código legado. Reconocer la equivalencia nominal no autoriza a mezclar los estados: cada flow conserva progreso, keys y secuencia propios. El enriquecimiento puede usar una materialized view que combine hechos y dimensión vigente o una estrategia temporal para SCD2. El proyecto evita un join stream-stream innecesario si solo requiere snapshot de dimensión y documenta qué versión del cliente se asigna a un pedido.",
    [
      "El flow de pedidos lee una fuente streaming, valida identidad y persiste bronze/silver append con checkpoint administrado. El flow de clientes crea un target streaming table y usa `create_auto_cdc_flow` o `AUTO CDC INTO` con keys, sequence, deletes y SCD. Una materialized view downstream lee ambos estados y refresca resultados. Los nombres anteriores `apply_changes` o `APPLY CHANGES INTO` se interpretan como la API reemplazada, con firma equivalente, pero el nuevo código adopta AUTO CDC.",
      "Un append de clientes produciría varias filas activas y joins duplicados. Un `MERGE` manual dentro de una función declarativa aumenta responsabilidad por orden y estado. SCD2 requiere decidir si el pedido se enriquece con la versión válida en event time o con el cliente actual; ambas responden preguntas distintas. La llegada tardía de una versión puede corregir el resultado materializado, mientras una tabla de hechos ya enriquecida puede necesitar backfill. Se prueba con eventos fuera de orden, delete y cambio simultáneo.",
    ],
    [
      ["Semántica append", "Modelo en el que cada registro aceptado representa un hecho adicional y no reemplaza implícitamente otra fila con la misma clave.", "Es apropiado para eventos inmutables y evita introducir estado de upsert innecesario."],
      ["Semántica CDC", "Modelo en el que registros codifican transiciones de entidades y deben aplicarse por clave, secuencia, operación y política de historia.", "Evita tratar updates y deletes como hechos independientes que duplicarían o dejarían obsoleto el estado."],
      ["Nombre legado", "Término anterior aún visible y soportado, como APPLY CHANGES, cuyo reemplazo recomendado actual es AUTO CDC con sintaxis equivalente.", "Permite responder exámenes y mantener código existente sin enseñar una API antigua como primera opción."],
    ],
    "Pedidos llegan por Kafka y clientes por Debezium con eventos fuera de orden; analítica necesita atribuir a cada pedido el segmento válido cuando ocurrió la compra.",
    [
      "Persistir pedidos como hechos append con event time y clientes mediante AUTO CDC SCD2 usando una secuencia total del log de origen.",
      "Construir el enriquecimiento por intervalo de validez del cliente, no mediante la fila actual, y probar deletes y versiones tardías.",
      "Documentar que APPLY CHANGES es el nombre anterior equivalente y validar migración nominal separadamente de cualquier cambio de keys o historia.",
    ],
    "El producto conserva hechos e historia con sus semánticas correctas y responde una pregunta temporal reproducible mientras utiliza terminología actual y reconocible en certificación.",
  ),
  m22l3: deepDive(
    "La calidad productiva se diseña como rutas y umbrales, no como una colección de constraints idénticas. Observación conserva y mide anomalías tolerables; cuarentena aísla filas reparables con procedencia; fail protege invariantes que harían inválido todo el target. Una misma regla puede evolucionar entre rutas después de medir impacto, pero el cambio se versiona. La arquitectura evalúa reglas comunes una vez y deriva flows coherentes, evitando que válido y cuarentena discrepen. Un umbral agregado puede escalar de drop a fallo cuando la tasa sugiere problema sistémico. El event log aporta métricas por expectation y una tabla operacional conserva tendencias y ownership. Para eventos con PII, muestras y cuarentena se enmascaran y gobiernan. Reingreso usa el mismo contrato y clave, y la salida final no se declara correcta hasta reconciliar filas válidas, descartadas y pendientes.",
    [
      "Las transformaciones añaden identificadores de reglas fallidas y metadatos de origen. El flow principal aplica expectations de retención o fail según invariantes; un flow de cuarentena persiste registros reparables. Otra tarea consulta métricas del event log y controles agregados, calcula tasas por update y compara con contrato. Si supera umbral, una condición de Jobs evita publicación y activa remediación. Correcciones se escriben a una entrada controlada y vuelven a atravesar deduplicación y expectations.",
      "Drop sin cuarentena mejora apariencia del target a costa de completitud invisible. Fail para una anomalía aislada opcional aumenta staleness y puede consumir disponibilidad. Warn en identidad nula publica corrupción. Los umbrales segmentan dominios críticos y usan denominadores correctos. Una regla cara puede dominar latencia; controles agregados se ubican después del commit de staging. El diseño prueba null SQL, schema evolution, grandes tasas de error y cómo un repair reutiliza la misma versión de contrato.",
    ],
    [
      ["Ruta de observación", "Tratamiento que conserva filas y publica métricas de una regla para calibrar riesgo sin alterar inmediatamente la salida procesada.", "Permite introducir controles nuevos y estimar falsos positivos antes de decidir una acción destructiva o bloqueante."],
      ["Ruta de cuarentena", "Tratamiento que aparta registros reparables del target canónico conservando payload mínimo, procedencia, reglas, owner y estado de remediación.", "Protege consumidores sin perder capacidad de investigación, corrección y reingreso idempotente."],
      ["Invariante bloqueante", "Propiedad cuya violación impide interpretar o reconciliar el conjunto completo y obliga a abortar la actualización afectada.", "Justifica fail por impacto estructural y evita usarlo indiscriminadamente para cualquier anomalía opcional."],
    ],
    "El 0,1 % de pedidos trae moneda desconocida y puede repararse, pero una duplicación de `order_id` rompe reconciliación financiera y no debe publicarse.",
    [
      "Cuarentenar moneda desconocida con identidad y owner, midiendo tasa y manteniendo una ruta de corrección sin descartar silenciosamente ingresos.",
      "Tratar unicidad global como control bloqueante de staging y condicionar publicación mediante Jobs después de evaluar el conjunto completo.",
      "Extraer métricas del event log, reconciliar válidos y cuarentena y probar reingreso idempotente antes de declarar completitud recuperada.",
    ],
    "El sistema mantiene disponibilidad ante errores reparables, detiene corrupción estructural y demuestra dónde quedó cada fila hasta su publicación o resolución autorizada.",
  ),
  m22l4: deepDive(
    "Lakeflow pipelines administra el grafo de datos; Lakeflow Jobs administra el proceso operativo que lo rodea. Un task de pipeline ejecuta la actualización, pero un flujo de producción suele necesitar parámetros de entorno, prechecks, validación agregada, decisión de publicación, notificaciones y backfills. Jobs no debe duplicar las dependencias internas del pipeline ni llamar cada dataset por separado: trata la actualización como una unidad y coordina fronteras externas. Un run recibe business window y versión de configuración inmutables. Después del pipeline, tareas leen event log y targets staging, calculan controles y una rama publica o contiene. Los retries se aplican a fallos transitorios; repair reejecuta el subgrafo necesario con el contexto original. Backfills usan el mismo artefacto y contrato con modo y rango explícitos, no copias de notebooks.",
    [
      "El DAG comienza con validación de parámetros y disponibilidad de fuentes. El task de pipeline actualiza datasets declarados y produce un update id. Una tarea de calidad consulta resultados y event log, publica task values pequeños y alimenta If/else. La rama aprobada conmuta vista o promueve staging; la rechazada alerta y conserva evidencia. Cleanup usa `All done` para recursos temporales sin borrar checkpoints ni cuarentena. Las referencias dinámicas registran run, trigger y parámetros en una tabla operacional.",
      "Reintentar todo el pipeline ante una expectation determinista solo repite el fallo; se clasifica error y se corrige contrato o datos. Publicar directamente dentro de cada flow puede exponer ramas aunque otra falle, dependiendo del modo; una validación posterior crea una frontera de producto clara. Jobs y pipeline con catálogos hardcoded divergen entre entornos, por lo que comparten configuración desplegada. Una reparación de publicación debe ser idempotente porque el update de datos ya puede estar confirmado.",
    ],
    [
      ["Pipeline task", "Tipo de tarea de Lakeflow Jobs que inicia y espera una actualización de un pipeline gestionado como una unidad operativa.", "Integra procesamiento declarativo con control flow, parámetros, reparaciones y notificaciones sin recrear el DAG de datasets."],
      ["Precheck", "Tarea previa que valida parámetros, permisos, disponibilidad o manifests antes de consumir compute y modificar datasets del pipeline.", "Falla pronto ante condiciones deterministas y evita updates costosos o parciales que nunca podrían publicarse."],
      ["Puerta de publicación", "Decisión posterior a procesamiento y validación que hace visible el resultado al consumidor únicamente cuando cumple controles acordados.", "Separa éxito técnico de corrección del producto y proporciona una frontera idempotente para repair y rollback."],
    ],
    "Un update de pipeline termina, pero una reconciliación posterior detecta que una fuente llegó incompleta; consumidores no deben ver el resultado y el histórico debe repararse.",
    [
      "Ejecutar el pipeline hacia targets de staging o una versión no publicada y conservar update id, run id y parámetros de la ventana.",
      "Calcular reconciliación en una tarea separada y usar If/else para bloquear publicación, alertar y mantener evidencia sin reintentar ciegamente.",
      "Tras corregir la fuente, usar repair o backfill con el mismo contexto y realizar una publicación idempotente después de superar controles.",
    ],
    "La orquestación distingue un update técnicamente completado de un producto válido y permite reparar la ventana exacta antes de exponerla a consumidores.",
  ),
  m22l5: deepDive(
    "Preparación productiva se demuestra con evidencia sobre corrección, recuperación, capacidad, seguridad y operación. Un run exitoso con datos felices solo prueba la ruta más sencilla. La checklist incluye replay determinista, backfill concurrente, schema evolution compatible e incompatible, expectation que falla, sink lento, checkpoint restore, límites de coste y permisos mínimos. Se mide SLA al volumen pico y RTO con un game day. El event log y system tables alimentan dashboards, alertas y atribución de coste. Un runbook describe síntomas, consultas, decisiones seguras, rollback y owners, y otra persona debe poder ejecutarlo sin conocimiento tribal. La promoción usa artefacto versionado, configuración revisada y criterios de aceptación; el rollback conserva tablas y checkpoints anteriores. La preparación también exige reconocer límites: ningún curso garantiza aprobar ni reemplaza práctica, pero el producto debe cubrir mecanismos y decisiones examinables con profundidad autosuficiente.",
    [
      "CI valida tipos, tests de transformaciones, configuración y grafo. Un entorno de integración ejecuta fixtures con inserts, updates, deletes, tardanza y corrupción. Pruebas de rendimiento reproducen pico y observan duración, estado, files y coste. Un game day interrumpe compute y dependencia externa, mide detección y recuperación y reconcilia outputs. Antes de producción se revisan grants, secretos, ownership, notificaciones, retención y presupuestos. El despliegue registra commit, bundle, pipeline update y Job run para trazabilidad completa.",
      "Una prueba pequeña puede ocultar skew y state store; un backfill puede competir con el SLA corriente; permisos de owner personal rompen continuidad. Alertas sin ensayo no prueban que lleguen al responsable. Un full refresh puede exceder retención o presupuesto aunque el incremental funcione. La decisión go/no-go exige umbrales explícitos y excepciones con fecha. Tras publicar se observa una ventana reforzada y se conserva rollback. Cada incidente actualiza tests y runbook, convirtiendo operación en una parte continua del diseño.",
    ],
    [
      ["Criterio de aceptación", "Condición medible que una versión debe satisfacer en corrección, rendimiento, recuperación, seguridad y coste antes de promoverse.", "Evita decisiones go-live basadas únicamente en un run verde o una revisión informal del código."],
      ["Game day", "Experimento controlado que introduce fallos representativos y mide alertas, diagnóstico, recuperación, reconciliación y cumplimiento de RTO/RPO.", "Transforma supuestos de resiliencia en evidencia y descubre dependencias de conocimiento o permisos antes de un incidente."],
      ["Runbook", "Procedimiento versionado con síntomas, consultas, decisiones, comandos seguros, criterios de escalado, rollback y responsables de la recuperación.", "Reduce tiempo de diagnóstico y permite que la operación no dependa exclusivamente del autor original."],
    ],
    "El equipo quiere promover un pipeline que procesó una muestra correcta, pero nunca probó deletes, full refresh, caída del driver, alertas ni permisos del usuario de servicio.",
    [
      "Bloquear promoción hasta ejecutar fixtures completos, revisión de identidad, seguridad y pruebas de capacidad con un volumen y skew representativos.",
      "Realizar game day de checkpoint y sink, medir RTO/RPO y reconciliar resultados mientras un operador distinto sigue el runbook.",
      "Registrar criterios, excepciones y rollback, desplegar con artefacto versionado y mantener observación reforzada durante la primera ventana productiva.",
    ],
    "La salida a producción se apoya en pruebas operativas y semánticas repetibles, con owners y rollback claros, en lugar de extrapolar confianza desde una demostración pequeña.",
  ),
} satisfies Record<string, LessonDeepDive>;

export const advancedContentA: Record<string, ModuleContentPack> = {
  m13: {
    lessons: [
      {
        summary: "Structured Streaming ejecuta una consulta incremental como una secuencia de microbatches y conserva el progreso necesario para continuar tras un fallo.",
        deepDive: deepDives.m13l1,
        explanation: [
          "Una lectura con `readStream` describe un flujo que todavía no está en ejecución. Spark construye el plan, descubre qué datos nuevos están disponibles en cada trigger y solo entonces materializa un microbatch. La misma API de DataFrames permite reutilizar transformaciones batch, pero una operación válida en batch puede ser inviable en streaming si exige conservar estado sin límite.",
          "En un pipeline de pedidos conviene separar tres decisiones: cómo se descubre la entrada, qué transformaciones son incrementales y cómo se confirma la salida. El SLA no lo decide `readStream`; lo determinan el trigger, el volumen por lote, la capacidad y el comportamiento del sink ante reintentos.",
        ],
        keyPoints: [
          "`readStream` y `writeStream` definen una consulta continua; una acción batch no la inicia.",
          "Cada microbatch procesa un rango identificable de entrada y lo confirma en el checkpoint.",
          "Una transformación stateful requiere límites temporales y una estrategia de recuperación explícita.",
        ],
        example: {
          language: "PySpark",
          title: "Consulta incremental mínima con destino Delta",
          code: `orders = spark.readStream.table("main.bronze.orders")

query = (
    orders.where("order_id IS NOT NULL")
      .writeStream
      .option("checkpointLocation", "/Volumes/main/ops/checkpoints/orders_silver")
      .trigger(processingTime="1 minute")
      .toTable("main.silver.orders")
)`,
          note: "El objeto `query` permite consultar estado y progreso; el checkpoint debe ser exclusivo de esta consulta.",
        },
        pitfalls: [
          "Confundir la latencia del trigger con el tiempo real de proceso: si un lote tarda dos minutos, un trigger de diez segundos no crea capacidad adicional.",
          "Usar el mismo checkpoint para dos consultas o destinos distintos, mezclando offsets y commits incompatibles.",
        ],
        examDecision: "Si el requisito pide procesamiento incremental recuperable, busca una fuente streaming, un sink compatible y un checkpoint durable; no basta con ejecutar repetidamente una lectura batch.",
        checkpoint: {
          question: "¿Qué parte del código inicia realmente la consulta?",
          answer: "La llamada terminal del `DataStreamWriter`, en este caso `toTable`; `readStream` solo construye el plan.",
        },
      },
      {
        summary: "El trigger expresa cuándo intentar procesar datos disponibles; `processingTime` prioriza cadencia y `availableNow` vacía el backlog y termina.",
        deepDive: deepDives.m13l2,
        explanation: [
          "`processingTime` mantiene una consulta activa y lanza microbatches con la periodicidad solicitada, siempre que el anterior haya acabado. Es apropiado para un dashboard que debe actualizarse durante todo el día. Reducir el intervalo por debajo de la duración real del lote solo aumenta la presión de planificación.",
          "`availableNow=True` procesa todos los datos disponibles en uno o varios microbatches y finaliza. Encaja con trabajos incrementales programados porque conserva checkpoints y límites por lote sin pagar por una consulta ociosa. También simplifica backfills controlados: el trabajo termina cuando alcanza el inicio del trigger.",
        ],
        keyPoints: [
          "`availableNow` conserva semántica incremental y puede crear varios lotes hasta agotar la entrada.",
          "Un trigger no sustituye el dimensionamiento ni controla por sí solo el tamaño del backlog.",
          "La elección se basa en SLA, patrón de llegada y modelo operativo, no en preferencia de sintaxis.",
        ],
        example: {
          language: "PySpark",
          title: "Ejecución incremental finita para un Job",
          code: `(
  spark.readStream.table("main.bronze.order_events")
    .writeStream
    .option("checkpointLocation", "/Volumes/main/ops/checkpoints/order_events")
    .trigger(availableNow=True)
    .toTable("main.silver.order_events")
    .awaitTermination()
)`,
          note: "La tarea del Job termina después de consumir el backlog disponible, pero la siguiente ejecución reanuda desde el mismo checkpoint.",
        },
        pitfalls: [
          "Sustituir `availableNow` por una lectura batch y perder el seguimiento incremental de offsets.",
          "Suponer que `availableNow` equivale a un único microbatch; puede dividir el backlog según los límites de la fuente.",
        ],
        examDecision: "Para una carga incremental orquestada que debe acabar y liberar compute, elige `availableNow`; para latencia continua, usa un trigger periódico o el modo compatible con el SLA.",
        checkpoint: {
          question: "¿Qué ocurre si llegan archivos mientras una ejecución `availableNow` está activa?",
          answer: "La ejecución procesa el conjunto delimitado por el trigger; los datos que queden fuera se recogerán en la siguiente ejecución desde el checkpoint.",
        },
      },
      {
        summary: "El checkpoint conserva offsets, commits y estado; forma parte de la identidad lógica de una consulta, no es una carpeta temporal.",
        deepDive: deepDives.m13l3,
        explanation: [
          "Al reiniciar, Spark consulta el checkpoint para conocer qué rangos de la fuente fueron procesados y qué lotes se confirmaron en el sink. Las operaciones con estado añaden metadatos y datos del state store. Borrar la carpeta convierte el siguiente arranque en una consulta nueva y puede reintroducir datos o perder la posición esperada.",
          "No todos los cambios de código son compatibles con un checkpoint existente. Cambiar el número de fuentes, el topic Kafka, el tipo de sink, las claves de una agregación o el esquema del estado suele exigir un checkpoint nuevo y un plan de migración o reproceso. Un simple filtro suele ser compatible, aunque puede cambiar el resultado funcional.",
        ],
        keyPoints: [
          "Un checkpoint pertenece a una consulta y debe residir en almacenamiento durable y gobernado.",
          "Offsets y commits permiten reanudar; el state store permite reconstruir operadores stateful.",
          "Cambiar la topología stateful sin evaluar compatibilidad puede impedir el reinicio.",
        ],
        example: {
          language: "Python",
          title: "Ruta de checkpoint estable por entorno y pipeline",
          code: `catalog = spark.conf.get("app.catalog", "main")
environment = spark.conf.get("app.environment", "dev")
checkpoint = f"/Volumes/{catalog}/ops/checkpoints/{environment}/orders_v1"

assert environment in {"dev", "test", "prod"}
print({"checkpoint": checkpoint, "query_version": 1})`,
          note: "Versiona la consulta cuando un cambio incompatible requiera un checkpoint nuevo; conserva el anterior hasta verificar el cutover.",
        },
        pitfalls: [
          "Guardar checkpoints críticos en una ubicación efímera o eliminarlos como primera respuesta ante un fallo.",
          "Reutilizar el checkpoint de producción durante pruebas, avanzando offsets o alterando estado real.",
        ],
        examDecision: "Ante un cambio de claves, fuente o estado, evalúa compatibilidad del checkpoint antes de reiniciar; crear uno nuevo implica decidir desde qué datos reconstruir el resultado.",
        checkpoint: {
          question: "¿Por qué no debe borrarse un checkpoint para 'forzar' un reintento?",
          answer: "Porque se pierden offsets, commits y estado; la consulta deja de ser una reanudación y puede duplicar, omitir o reconstruir incorrectamente datos.",
        },
      },
      {
        summary: "La garantía extremo a extremo depende tanto del seguimiento de offsets como de que el sink confirme lotes de forma idempotente.",
        deepDive: deepDives.m13l4,
        explanation: [
          "Los sinks Delta integrados coordinan los commits de cada microbatch con el checkpoint. Si una tarea falla después de escribir pero antes de confirmar, el reinicio puede volver a presentar el mismo lote y el sink debe reconocerlo. La garantía de la fuente por sí sola no impide duplicados en un servicio externo.",
          "`foreachBatch` abre la puerta a `MERGE`, múltiples destinos o APIs, pero transfiere responsabilidad al código. El `batch_id` y una clave de negocio estable permiten registrar el lote o hacer upsert determinista. Enviar eventos a un endpoint sin clave idempotente conserva, como mucho, semántica at-least-once.",
        ],
        keyPoints: [
          "Exactly-once es una propiedad del recorrido fuente–estado–sink, no una etiqueta aislada.",
          "`foreachBatch` permite lógica batch por microbatch y debe tolerar la repetición del mismo lote.",
          "Una clave de negocio suele ser más útil que confiar únicamente en el número de lote.",
        ],
        example: {
          language: "PySpark",
          title: "Upsert idempotente por microbatch",
          code: `from delta.tables import DeltaTable

def upsert_orders(batch_df, batch_id):
    target = DeltaTable.forName(spark, "main.silver.orders_current")
    (target.alias("t")
      .merge(batch_df.alias("s"), "t.order_id = s.order_id")
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute())

(orders.writeStream
  .foreachBatch(upsert_orders)
  .option("checkpointLocation", "/Volumes/main/ops/checkpoints/orders_upsert")
  .start())`,
          note: "El `MERGE` debe resolver múltiples cambios de la misma clave dentro del lote antes del upsert.",
        },
        pitfalls: [
          "Hacer `append` en `foreachBatch` y asumir que el checkpoint evita cualquier repetición posterior al fallo.",
          "Ejecutar varias acciones sobre `batch_df` sin persistirlo cuando el coste de recomputación sea relevante.",
        ],
        examDecision: "Si el sink no participa en commits exactamente una vez, diseña idempotencia explícita con clave o ledger de lotes y acepta que la entrega puede repetirse.",
        checkpoint: {
          question: "¿Qué debe garantizar una función `foreachBatch` para soportar reintentos?",
          answer: "Que ejecutar de nuevo el mismo microbatch produzca el mismo estado final, normalmente mediante deduplicación, `MERGE` o una clave idempotente.",
        },
      },
      {
        summary: "El progreso de una consulta permite separar falta de entrada, capacidad insuficiente, estado creciente y problemas del sink.",
        deepDive: deepDives.m13l5,
        explanation: [
          "`lastProgress` expone tasas de entrada y proceso, duración de fases, offsets y métricas de estado. Si `inputRowsPerSecond` supera sostenidamente `processedRowsPerSecond`, crece el backlog; si no hay filas nuevas, una latencia alta puede proceder del trigger o del propio sink. En Kafka, el desfase de offsets aporta otra señal independiente.",
          "La operación necesita umbrales vinculados al SLA: frescura máxima, duración p95 del lote, filas descartadas y tamaño del estado. Un runbook útil conecta cada alerta con hipótesis y acciones seguras, evitando reiniciar o borrar checkpoints sin diagnóstico.",
        ],
        keyPoints: [
          "Compara tasa de llegada con tasa de proceso a lo largo de varios lotes, no en una sola muestra.",
          "`stateOperators` revela filas y memoria mantenidas por agregaciones, joins o deduplicación.",
          "La frescura de negocio requiere comparar el máximo event time publicado con el reloj, no solo observar que el query está activo.",
        ],
        example: {
          language: "Python",
          title: "Inspección defensiva del último progreso",
          code: `progress = query.lastProgress or {}
summary = {
    "batch_id": progress.get("batchId"),
    "input_rps": progress.get("inputRowsPerSecond", 0),
    "processed_rps": progress.get("processedRowsPerSecond", 0),
    "batch_ms": progress.get("durationMs", {}).get("triggerExecution"),
    "state": progress.get("stateOperators", []),
}
print(summary)`,
          note: "En producción, envía estas métricas a una tabla o plataforma de monitorización en vez de depender de impresiones del driver.",
        },
        pitfalls: [
          "Interpretar una consulta `ACTIVE` como prueba de que cumple el SLA de frescura.",
          "Aumentar compute sin comprobar si el cuello está en el sink, el estado, el throttling de la fuente o datos sesgados.",
        ],
        examDecision: "Ante un stream atrasado, compara backlog, tasas, duración del microbatch y métricas de estado antes de cambiar recursos o el trigger.",
        checkpoint: {
          question: "¿Qué señal distingue un backlog creciente de una fuente momentáneamente vacía?",
          answer: "El backlog u offsets pendientes crecen y la tasa de entrada supera de forma sostenida la tasa procesada; una fuente vacía no acumula offsets nuevos.",
        },
      },
    ],
    lab: {
      title: "Pipeline incremental recuperable de pedidos",
      goal: "Publicar eventos válidos en Delta con `availableNow`, un checkpoint gobernado y evidencia de que un segundo arranque no reprocesa el mismo backlog.",
      scenario: "Una tienda deja JSON de pedidos en una tabla bronze alimentada continuamente. Operaciones quiere ejecutar el transformado cada cinco minutos como tarea finita y poder recuperar un fallo sin duplicar `order_id`.",
      steps: [
        "Lee `main.bronze.order_events` como stream y conserva solo eventos con identificador, timestamp e importe válidos.",
        "Selecciona un esquema silver estable y deduplica por `order_id` dentro del microbatch antes de escribir.",
        "Configura un checkpoint exclusivo bajo un Volume de operaciones y usa `availableNow=True`.",
        "Ejecuta, registra `lastProgress`, vuelve a ejecutar sin añadir datos y compara los conteos.",
        "Añade un evento nuevo y demuestra que solo ese cambio incrementa la tabla destino.",
      ],
      starterCode: `from pyspark.sql import functions as F

source = spark.readStream.table("main.bronze.order_events")

valid = source.where(
    F.col("order_id").isNotNull() &
    F.col("event_ts").isNotNull() &
    (F.col("amount") >= 0)
)

# TODO: selecciona columnas, configura checkpoint, availableNow y destino Delta.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m13_order_events_v1"
target = "main.silver.order_events"

source = spark.readStream.table("main.bronze.order_events")

valid = (
    source.where(
        F.col("order_id").isNotNull() &
        F.col("event_ts").isNotNull() &
        (F.col("amount") >= 0)
    )
    .select(
        "order_id",
        F.col("event_ts").cast("timestamp").alias("event_ts"),
        F.col("amount").cast("decimal(18,2)").alias("amount"),
        "customer_id",
        "source_file"
    )
    .dropDuplicates(["order_id"])
)

query = (
    valid.writeStream
      .queryName("m13_orders_to_silver")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable(target)
)
query.awaitTermination()

evidence = {
    "target": target,
    "rows": spark.table(target).count(),
    "progress": query.lastProgress,
}
print(evidence)`,
      checks: [
        { label: "Lee la fuente con readStream", pattern: "readStream\\.table" },
        { label: "Declara un checkpoint durable", pattern: "checkpointLocation" },
        { label: "Usa una ejecución incremental finita", pattern: "availableNow\\s*=\\s*True" },
        { label: "Publica en una tabla Delta", pattern: "toTable" },
      ],
      expectedEvidence: [
        "Conteo del destino tras la primera ejecución y el mismo conteo tras una segunda sin entrada nueva.",
        "`lastProgress` con `batchId`, número de filas de entrada y duración del trigger.",
        "Ruta de checkpoint exclusiva y nombre completo de la tabla silver.",
        "Prueba de que un nuevo evento válido aumenta el destino exactamente una vez.",
      ],
      cloudNotes: {
        AWS: "Aloja el Volume/checkpoint sobre S3 mediante una external location de Unity Catalog y una storage credential asociada a un IAM role; no incrustes access keys.",
        Azure: "Usa un Volume respaldado por ADLS Gen2 y una managed identity o service principal en la storage credential; valida permisos sobre contenedor y ruta.",
        GCP: "Usa GCS detrás de una external location y una service account de mínimo privilegio; separa los prefijos de checkpoint de dev y prod.",
      },
    },
    quiz: [
      {
        question: "Un Job debe procesar cada diez minutos todo lo acumulado y finalizar para no mantener compute ocioso. ¿Qué configuración encaja mejor?",
        options: [
          "Una lectura batch completa sin checkpoint",
          "Una consulta con `availableNow=True` y checkpoint estable",
          "Un trigger de 100 milisegundos ejecutado continuamente",
          "Borrar el checkpoint al comienzo de cada Job",
        ],
        answer: 1,
        explanation: "`availableNow` vacía incrementalmente el backlog disponible y termina; el checkpoint permite que la siguiente ejecución continúe sin releer lo ya confirmado.",
        domain: "Structured Streaming · triggers",
      },
      {
        question: "Tras cambiar las claves de una agregación stateful, la consulta no reinicia con el checkpoint anterior. ¿Cuál es la respuesta correcta?",
        options: [
          "Aumentar el número de workers hasta que el checkpoint sea compatible",
          "Desactivar la escritura de commits",
          "Evaluar una migración/reproceso con checkpoint nuevo porque cambió el esquema de estado",
          "Configurar `failOnDataLoss=false` en cualquier fuente",
        ],
        answer: 2,
        explanation: "Las claves de una operación stateful forman parte del esquema de estado. El cambio suele ser incompatible y exige un cutover controlado, no más capacidad.",
        domain: "Structured Streaming · checkpoints",
      },
      {
        question: "Un `foreachBatch` llama a una API que crea un cargo y el driver falla antes de confirmar el lote. ¿Qué evita cargos duplicados al reintentar?",
        options: [
          "Enviar una clave idempotente estable por transacción",
          "Usar un trigger más largo",
          "Cambiar el output mode a `complete`",
          "Reducir las particiones del DataFrame a una",
        ],
        answer: 0,
        explanation: "El microbatch puede volver a presentarse. Una clave idempotente aceptada por el sistema externo hace que la repetición tenga el mismo efecto final.",
        domain: "Structured Streaming · garantías de entrega",
      },
      {
        question: "La tasa de entrada es 8.000 filas/s, la procesada 5.000 filas/s y el lag crece durante una hora. ¿Qué conclusión está respaldada?",
        options: [
          "La fuente está vacía",
          "El checkpoint ha deduplicado demasiadas filas",
          "El watermark es necesariamente demasiado corto",
          "La consulta no sostiene la tasa de llegada y acumula backlog",
        ],
        answer: 3,
        explanation: "Una tasa procesada sostenidamente inferior a la tasa de entrada, junto con lag creciente, demuestra un déficit de capacidad o un cuello de ejecución que debe diagnosticarse.",
        domain: "Structured Streaming · monitorización",
      },
    ],
    sources: [
      {
        label: "Structured Streaming checkpoints · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/checkpoints",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
    ],
  },

  m14: {
    lessons: [
      {
        summary: "El event time pertenece al hecho de negocio; el processing time describe cuándo lo observa la plataforma y no corrige el desorden de llegada.",
        deepDive: deepDives.m14l1,
        explanation: [
          "Un pago generado a las 10:03 puede llegar a las 10:17 por una desconexión móvil. Agrupar por la hora de ingesta lo asignaría a una ventana distinta y haría que un reproceso produzca otro resultado. La columna de event time debe proceder del evento, convertirse a `timestamp` y validarse antes de cualquier operación temporal.",
          "El retraso `processing_time - event_time` es una distribución, no una constante. Para elegir tolerancia se estudian percentiles y casos extremos por fuente. Un reloj del productor defectuoso debe enviarse a cuarentena; ampliar indefinidamente el watermark para ocultarlo traslada el problema al state store.",
        ],
        keyPoints: [
          "Event time determina ventanas reproducibles; processing time mide la observación del sistema.",
          "La calidad y zona horaria del timestamp son parte del contrato del evento.",
          "La distribución de tardanza informa el watermark y el SLA de correcciones.",
        ],
        example: {
          language: "PySpark",
          title: "Normalización del tiempo de evento",
          code: `from pyspark.sql import functions as F

events = (
    raw.withColumn("event_ts", F.to_timestamp("event_time_iso"))
       .withColumn("ingested_at", F.current_timestamp())
       .withColumn(
           "lateness_seconds",
           F.col("ingested_at").cast("long") - F.col("event_ts").cast("long")
       )
)

valid = events.where("event_ts IS NOT NULL AND lateness_seconds >= 0")`,
          note: "Conserva ambos tiempos: uno gobierna la semántica y el otro permite medir el comportamiento de la fuente.",
        },
        pitfalls: [
          "Usar `current_timestamp()` como event time porque siempre está presente, haciendo que un replay cambie los resultados.",
          "Aceptar timestamps sin zona o muy futuros y permitir que adelanten prematuramente el watermark.",
        ],
        examDecision: "Si el resultado debe conservar la hora real del negocio pese a retrasos o replays, las ventanas deben usar event time validado.",
        checkpoint: {
          question: "¿Por qué un reproceso debe conservar el event time original?",
          answer: "Porque así el evento vuelve a la misma ventana de negocio; usar el momento del reproceso produciría agregados distintos.",
        },
      },
      {
        summary: "Una ventana agrupa por event time y el watermark limita cuánto estado se conserva antes de considerar una ventana finalizable.",
        deepDive: deepDives.m14l2,
        explanation: [
          "Las ventanas tumbling no se solapan; las sliding pueden asignar el mismo evento a varias ventanas. En una agregación, Spark mantiene acumuladores para ventanas todavía abiertas. El watermark avanza a partir del máximo event time observado menos el retraso configurado y permite retirar estado antiguo.",
          "Una tolerancia corta reduce memoria y acelera resultados finales, pero descarta más eventos tardíos. Una tolerancia larga mejora completitud a costa de latencia y estado. La decisión debe expresar un compromiso medible, por ejemplo aceptar el 99,5% de eventos en quince minutos y corregir el resto mediante un proceso separado.",
        ],
        keyPoints: [
          "Watermark no significa esperar exactamente ese tiempo desde la llegada de cada fila.",
          "La columna marcada debe participar en la ventana o condición temporal del operador stateful.",
          "Output mode y watermark determinan cuándo se emiten y retiran resultados.",
        ],
        example: {
          language: "PySpark",
          title: "Ventas por ventanas de cinco minutos",
          code: `from pyspark.sql import functions as F

sales_5m = (
    events.withWatermark("event_ts", "15 minutes")
      .groupBy(F.window("event_ts", "5 minutes"), "store_id")
      .agg(
          F.countDistinct("order_id").alias("orders"),
          F.sum("amount").alias("revenue")
      )
)`,
          note: "El retraso de quince minutos debe justificarse con la distribución real de tardanza y el SLA de publicación.",
        },
        pitfalls: [
          "Aplicar `withWatermark` a una columna y agrupar por otra, impidiendo que el operador use la marca temporal esperada.",
          "Elegir un watermark igual al intervalo de trigger; resuelven problemas diferentes.",
        ],
        examDecision: "Para acotar una agregación de event time, configura watermark según tardanza tolerada y usa esa columna en `window`; no lo sustituyas por más particiones.",
        checkpoint: {
          question: "¿Qué se sacrifica al reducir de una hora a diez minutos el watermark?",
          answer: "Se conserva menos estado y puede bajar la latencia, pero aumentan los eventos demasiado tardíos que ya no actualizarán el resultado.",
        },
      },
      {
        summary: "La deduplicación con watermark mantiene identificadores durante un horizonte finito y elimina repeticiones sin hacer crecer el estado para siempre.",
        deepDive: deepDives.m14l3,
        explanation: [
          "`dropDuplicatesWithinWatermark([\"event_id\"])` recuerda las claves observadas mientras el evento pueda seguir teniendo duplicados dentro de la tolerancia. La marca temporal debe definirse antes. Si dos copias pueden diferir en timestamp, la tolerancia debe superar la máxima distancia temporal entre ellas para garantizar la deduplicación.",
          "La clave debe representar identidad de negocio, no una combinación accidental de todas las columnas. Antes de deduplicar conviene validar nulos y normalizar tipos. Los eventos que llegan más tarde que el umbral pueden descartarse; la métrica de descarte y una ruta de reconciliación son parte del diseño.",
        ],
        keyPoints: [
          "`distinct` sin watermark puede conservar todas las filas únicas indefinidamente.",
          "`dropDuplicatesWithinWatermark` requiere una marca temporal en el DataFrame streaming.",
          "El horizonte debe cubrir la separación máxima esperada entre copias del mismo evento.",
        ],
        example: {
          language: "PySpark",
          title: "Deduplicación acotada por identificador",
          code: `deduplicated = (
    events.where("event_id IS NOT NULL AND event_ts IS NOT NULL")
      .withWatermark("event_ts", "30 minutes")
      .dropDuplicatesWithinWatermark(["event_id"])
)`,
          note: "Mide duplicados y eventos tardíos con datos de prueba que crucen varios microbatches.",
        },
        pitfalls: [
          "Deduplicar por todas las columnas cuando dos copias llevan distinto `ingested_at` y, por tanto, nunca coinciden.",
          "Escoger un umbral menor que el retraso entre duplicados y prometer una garantía que el estado ya no puede cumplir.",
        ],
        examDecision: "Si hay un ID estable y duplicados retrasados, usa deduplicación con watermark; un `dropDuplicates` sin límite puede comprometer memoria y latencia.",
        checkpoint: {
          question: "¿Qué condición permite retirar del estado un `event_id` antiguo?",
          answer: "Que el watermark haya avanzado más allá del horizonte en el que todavía se garantiza reconocer duplicados de ese evento.",
        },
      },
      {
        summary: "Un join entre dos streams necesita watermarks y una condición temporal para que Spark pueda descartar pares que ya no pueden coincidir.",
        deepDive: deepDives.m14l4,
        explanation: [
          "Relacionar clics con pagos solo por `session_id` deja abierta para siempre la posibilidad de una coincidencia futura. Añadir que el pago ocurra entre el clic y treinta minutos después proporciona un intervalo acotado. Cada entrada debe declarar su tolerancia de tardanza para que el motor calcule cuándo retirar estado.",
          "Los joins outer requieren esperar a que transcurra el horizonte antes de emitir una fila no emparejada. Eso aumenta la latencia de los `NULL` esperados. En múltiples streams, la política global por defecto avanza con el watermark más lento; cambiarla a `max` reduce latencia, pero puede descartar datos del stream rezagado.",
        ],
        keyPoints: [
          "Las claves de igualdad no acotan por sí solas el estado de un stream-stream join.",
          "La condición de rango temporal y los watermarks trabajan conjuntamente.",
          "Un outer join no puede declarar una fila sin pareja hasta que expire la posibilidad de coincidencia.",
        ],
        example: {
          language: "PySpark",
          title: "Join temporal de clics y pagos",
          code: `clicks_wm = clicks.withWatermark("click_ts", "20 minutes")
payments_wm = payments.withWatermark("payment_ts", "10 minutes")

matched = clicks_wm.join(
    payments_wm,
    (clicks_wm.session_id == payments_wm.session_id) &
    (payments_wm.payment_ts >= clicks_wm.click_ts) &
    (payments_wm.payment_ts <= clicks_wm.click_ts + F.expr("INTERVAL 30 MINUTES")),
    "leftOuter",
)`,
          note: "Documenta por separado la tardanza de cada fuente y el máximo intervalo de negocio entre los dos eventos.",
        },
        pitfalls: [
          "Añadir watermarks pero omitir el rango temporal del join, por lo que el estado sigue sin una frontera útil.",
          "Esperar que un outer join emita inmediatamente los no emparejados, antes de que expire el watermark.",
        ],
        examDecision: "Ante estado creciente en un stream-stream join, comprueba watermarks en ambas entradas y una condición temporal acotada antes de escalar compute.",
        checkpoint: {
          question: "¿Por qué un left outer join retrasa las filas sin pago?",
          answer: "Porque debe esperar hasta que el watermark demuestre que ya no puede llegar un pago válido dentro del intervalo temporal.",
        },
      },
      {
        summary: "Las métricas del state store revelan si el compromiso entre tardanza, cardinalidad y capacidad sigue siendo sostenible.",
        deepDive: deepDives.m14l5,
        explanation: [
          "`stateOperators` informa filas totales y actualizadas, memoria usada y filas retiradas por watermark. Un crecimiento continuo después de varios horizontes puede indicar claves de cardinalidad extrema, timestamps futuros, ausencia de watermark efectivo o una condición de join no acotada.",
          "El diagnóstico debe reproducir datos puntuales: a tiempo, duplicados, tardíos dentro de tolerancia, demasiado tardíos y timestamps inválidos. Una prueba de recuperación reinicia desde el mismo checkpoint; cambiar access mode o esquema de estado durante el experimento puede introducir otra variable.",
        ],
        keyPoints: [
          "El número de filas de estado debe estabilizarse para una carga estacionaria y un horizonte finito.",
          "Los timestamps futuros pueden empujar el watermark y provocar pérdidas silenciosas de eventos normales.",
          "La política global `max` favorece latencia y puede descartar datos del stream más lento; `min` prioriza seguridad.",
        ],
        example: {
          language: "Python",
          title: "Resumen de operadores con estado",
          code: `progress = query.lastProgress or {}
for operator in progress.get("stateOperators", []):
    print({
        "rows_total": operator.get("numRowsTotal"),
        "rows_updated": operator.get("numRowsUpdated"),
        "rows_removed": operator.get("numRowsRemoved"),
        "memory_bytes": operator.get("memoryUsedBytes"),
    })`,
          note: "Guarda la serie temporal; una única observación no permite distinguir una ventana grande de una fuga lógica de estado.",
        },
        pitfalls: [
          "Medir solo uso de CPU y omitir filas/memoria del estado.",
          "Cambiar a la política `max` para ocultar un stream lento sin aceptar explícitamente los descartes resultantes.",
        ],
        examDecision: "Si el estado crece sin estabilizarse, valida primero event time, watermark, cardinalidad y condiciones temporales; más memoria solo pospone el fallo.",
        checkpoint: {
          question: "¿Qué patrón indica que un watermark no está retirando estado como se esperaba?",
          answer: "Con entrada estable, `numRowsTotal` y memoria crecen durante muchos horizontes mientras `numRowsRemoved` permanece nulo o muy bajo.",
        },
      },
    ],
    lab: {
      title: "Deduplicación y ventanas con datos tardíos",
      goal: "Construir un agregado de cinco minutos que deduplique eventos, tolere quince minutos de tardanza y produzca evidencia sobre estado y descartes.",
      scenario: "Los dispositivos de tiendas envían ventas con reintentos y desconexiones. El 99% llega en menos de quince minutos, pero algunos eventos llegan duplicados o con timestamps inválidos.",
      steps: [
        "Normaliza `event_ts` y separa filas nulas o futuras antes de la operación stateful.",
        "Aplica un watermark de quince minutos y deduplica por `event_id` dentro del horizonte.",
        "Agrupa por ventanas tumbling de cinco minutos y `store_id`, calculando pedidos e importe.",
        "Escribe en Delta con checkpoint propio y ejecuta un conjunto de eventos a tiempo, duplicados y tardíos.",
        "Captura métricas de `stateOperators` y explica qué evento demasiado tardío no modifica el agregado.",
      ],
      starterCode: `from pyspark.sql import functions as F

events = spark.readStream.table("main.bronze.store_sales")
clean = events.withColumn("event_ts", F.to_timestamp("event_ts"))

# TODO: valida tiempos, aplica watermark, deduplica y agrega en ventanas de 5 minutos.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m14_sales_windows_v1"

events = (
    spark.readStream.table("main.bronze.store_sales")
      .withColumn("event_ts", F.to_timestamp("event_ts"))
      .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
)

clean = events.where(
    F.col("event_id").isNotNull() &
    F.col("event_ts").isNotNull() &
    (F.col("event_ts") <= F.current_timestamp() + F.expr("INTERVAL 2 MINUTES"))
)

deduplicated = (
    clean.withWatermark("event_ts", "15 minutes")
         .dropDuplicatesWithinWatermark(["event_id"])
)

sales_5m = (
    deduplicated.groupBy(
        F.window("event_ts", "5 minutes"),
        "store_id",
    )
    .agg(
        F.count("event_id").alias("orders"),
        F.sum("amount").alias("revenue"),
    )
    .select(
        "store_id",
        F.col("window.start").alias("window_start"),
        F.col("window.end").alias("window_end"),
        "orders",
        "revenue",
    )
)

query = (
    sales_5m.writeStream
      .outputMode("append")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable("main.gold.store_sales_5m")
)
query.awaitTermination()
print(query.lastProgress.get("stateOperators", []))`,
      checks: [
        { label: "Usa event time con watermark", pattern: "withWatermark\\(\"event_ts\",\\s*\"15 minutes\"\\)" },
        { label: "Deduplica dentro del horizonte", pattern: "dropDuplicatesWithinWatermark" },
        { label: "Agrupa en ventanas de cinco minutos", pattern: "window\\(\"event_ts\",\\s*\"5 minutes\"\\)" },
        { label: "Conserva un checkpoint", pattern: "checkpointLocation" },
      ],
      expectedEvidence: [
        "Tabla de entrada de prueba que identifica eventos a tiempo, duplicados, tardíos y demasiado tardíos.",
        "Conteos e importe por ventana antes y después de introducir un duplicado.",
        "Métricas `numRowsTotal`, `numRowsRemoved` y `memoryUsedBytes` del operador de estado.",
        "Explicación cuantitativa de por qué quince minutos satisface el objetivo de completitud.",
      ],
      cloudNotes: {
        AWS: "Mantén fuente y checkpoint en ubicaciones de S3 gobernadas por Unity Catalog; revisa que el IAM role permita listar y escribir solo los prefijos necesarios.",
        Azure: "Usa ADLS Gen2 mediante external locations y evita claves de cuenta; la identidad administrada necesita permisos separados para entrada y checkpoint.",
        GCP: "Separa buckets o prefijos de datos y estado en GCS y concede a la service account acceso mínimo de lectura/escritura según función.",
      },
    },
    quiz: [
      {
        question: "Un evento ocurrió a las 10:02, llegó a las 10:19 y debe contabilizarse en el intervalo real de venta. ¿Qué timestamp gobierna la ventana?",
        options: [
          "El momento de inicio del cluster",
          "El processing time de las 10:19",
          "El event time de las 10:02",
          "La hora de la siguiente ejecución del Job",
        ],
        answer: 2,
        explanation: "La ventana de negocio debe usar event time para que llegadas tardías y replays conserven la misma asignación temporal.",
        domain: "Structured Streaming · event time",
      },
      {
        question: "El estado de una agregación crece sin límite aunque existe `withWatermark`. ¿Qué revisión es más relevante primero?",
        options: [
          "Que la columna marcada participe realmente en la ventana y tenga timestamps válidos",
          "Que el SQL warehouse tenga auto-stop",
          "Que el catálogo use nombres de tres niveles",
          "Que el notebook tenga menos celdas",
        ],
        answer: 0,
        explanation: "Un watermark sobre una columna no utilizada por el operador, o adelantada por timestamps erróneos, no proporciona la frontera de estado esperada.",
        domain: "Structured Streaming · estado",
      },
      {
        question: "Dos copias del mismo `event_id` pueden diferir en 25 minutos de event time. ¿Qué configuración garantiza reconocer ambas como duplicadas?",
        options: [
          "Un trigger de cinco minutos sin watermark",
          "`distinct()` sobre `ingested_at`",
          "Un watermark de diez minutos",
          "`dropDuplicatesWithinWatermark` con un horizonte superior a 25 minutos",
        ],
        answer: 3,
        explanation: "La tolerancia debe superar la máxima separación temporal esperada entre duplicados; de lo contrario la primera clave puede salir del estado antes de llegar la segunda.",
        domain: "Structured Streaming · deduplicación",
      },
      {
        question: "Un left outer stream-stream join emite los registros sin pareja demasiado tarde para el consumidor. ¿Qué explica esa latencia?",
        options: [
          "Delta Lake siempre espera a `OPTIMIZE`",
          "El motor debe esperar al watermark y al límite temporal antes de concluir que no llegará una pareja",
          "Los outer joins solo se ejecutan en batch",
          "El checkpoint vuelve a leer todos los eventos",
        ],
        answer: 1,
        explanation: "La fila sin coincidencia no es definitiva hasta que el horizonte temporal se cierra; esa espera es parte de la corrección del outer join.",
        domain: "Structured Streaming · stream-stream joins",
      },
    ],
    sources: [
      {
        label: "Apply watermarks to control data processing thresholds · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/watermarks",
        reviewedAt,
      },
      {
        label: "dropDuplicatesWithinWatermark · Databricks PySpark reference",
        href: "https://docs.databricks.com/aws/en/pyspark/reference/classes/dataframe/dropDuplicatesWithinWatermark",
        reviewedAt,
      },
    ],
  },

  m15: {
    lessons: [
      {
        summary: "Kafka entrega registros binarios con metadatos de topic, partición y offset; deserializar el payload sin perder esa trazabilidad es la primera responsabilidad del consumidor.",
        deepDive: deepDives.m15l1,
        explanation: [
          "El DataFrame de Kafka expone `key`, `value`, `topic`, `partition`, `offset`, `timestamp` y headers. `key` y `value` llegan como bytes, por lo que hacer solo `CAST(value AS STRING)` no valida el contrato. Un esquema explícito con `from_json` permite distinguir una fila corrupta de una evolución compatible.",
          "Conservar `topic`, `partition` y `offset` en bronze permite investigar pérdidas, reconstruir un rango y demostrar qué mensaje originó una fila. La clave Kafka también importa: el productor la usa para particionar y preservar orden dentro de una partición, pero Kafka no ofrece orden global entre particiones.",
        ],
        keyPoints: [
          "El offset solo es único dentro de un par topic-partición.",
          "La key dirige particionado y orden local; no sustituye la clave de negocio del payload.",
          "Bronze debe conservar metadatos Kafka y el payload original o una referencia auditable.",
        ],
        example: {
          language: "PySpark",
          title: "Lectura con metadatos Kafka preservados",
          code: `kafka_raw = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .load()
)

bronze = kafka_raw.selectExpr(
    "CAST(key AS STRING) AS message_key",
    "CAST(value AS STRING) AS payload",
    "topic", "partition", "offset",
    "timestamp AS kafka_timestamp"
)`,
          note: "No registres credenciales en opciones ni notebooks; obtén endpoints y secretos desde configuración gobernada.",
        },
        pitfalls: [
          "Tratar `(offset)` como identificador global y provocar colisiones entre particiones.",
          "Descartar metadatos inmediatamente, haciendo imposible demostrar qué mensaje produjo un error.",
        ],
        examDecision: "Si la pregunta exige trazabilidad o replay selectivo, conserva topic, partición y offset junto al payload antes de transformar.",
        checkpoint: {
          question: "¿Qué combinación identifica de forma inequívoca una posición Kafka?",
          answer: "Topic, partición y offset; el offset por sí solo se repite en otras particiones y topics.",
        },
      },
      {
        summary: "Las opciones de suscripción y offsets solo fijan el inicio de una consulta nueva; al reanudar, el checkpoint gobierna la posición.",
        deepDive: deepDives.m15l2,
        explanation: [
          "`subscribe` elige topics concretos, `subscribePattern` usa una expresión regular y `assign` fija particiones. Debe configurarse exactamente uno. En streaming, `startingOffsets` es `latest` por defecto y solo se consulta si no existe progreso previo; cambiarlo después no rebobina una consulta con checkpoint.",
          "Para un backfill se usa un checkpoint y destino separados o una lectura batch con rangos explícitos, no se modifica a ciegas una consulta productiva. `failOnDataLoss=false` permite continuar cuando offsets ya no existen, pero acepta una posible pérdida y debe acompañarse de reconciliación; no es una solución genérica para errores.",
        ],
        keyPoints: [
          "Una consulta reanudada toma offsets del checkpoint, no de `startingOffsets`.",
          "`earliest` en una consulta nueva puede consumir toda la retención y generar un backlog considerable.",
          "`failOnDataLoss=false` cambia una garantía de integridad y exige una decisión operativa explícita.",
        ],
        example: {
          language: "PySpark",
          title: "Suscripción inicial controlada",
          code: `orders = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .option("startingOffsets", "earliest")
      .option("failOnDataLoss", "true")
      .option("maxOffsetsPerTrigger", 500000)
      .load()
)`,
          note: "Tras el primer commit, `startingOffsets` deja de decidir la posición; el checkpoint continúa desde los offsets confirmados.",
        },
        pitfalls: [
          "Cambiar `startingOffsets` a `earliest` esperando que un stream existente relea su historia.",
          "Desactivar `failOnDataLoss` para silenciar una retención insuficiente sin medir el hueco perdido.",
        ],
        examDecision: "Para reanudar exactamente donde quedó una consulta, conserva su checkpoint; para reprocesar, aísla checkpoint y destino y define el rango de offsets.",
        checkpoint: {
          question: "¿Qué ocurre si se cambia `startingOffsets` en una consulta que conserva el mismo checkpoint?",
          answer: "La consulta reanuda desde los offsets del checkpoint; la opción inicial no rebobina el progreso existente.",
        },
      },
      {
        summary: "Un contrato de evento separa deserialización, validación y evolución para que los mensajes incompatibles no detengan ni contaminen el flujo válido.",
        deepDive: deepDives.m15l3,
        explanation: [
          "Con JSON, un `StructType` explícito evita inferencia por microbatch y permite detectar `_corrupt_record` o campos obligatorios nulos. Avro o Protobuf con un schema registry ofrecen contratos más fuertes, pero siguen necesitando una política de compatibilidad entre productor y consumidor.",
          "Un patrón robusto publica el mensaje crudo en bronze, enruta fallos a cuarentena con el motivo y solo expone columnas tipadas en silver. Añadir un campo opcional suele ser compatible; renombrar o cambiar tipo requiere una migración coordinada o lectura multi-versión mediante un campo `schema_version`.",
        ],
        keyPoints: [
          "El esquema se valida antes de aplicar reglas de negocio.",
          "La cuarentena conserva payload y coordenadas Kafka para remediación.",
          "La evolución se negocia entre productor y consumidor; no se resuelve concediendo tipos `string` a todo.",
        ],
        example: {
          language: "PySpark",
          title: "Deserialización JSON con contrato",
          code: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
    T.StructField("schema_version", T.IntegerType(), False),
])

decoded = bronze.withColumn(
    "event", F.from_json("payload", order_schema)
)`,
          note: "Mantén `payload` hasta que la fila haya superado validación para poder diagnosticar y reintentar.",
        },
        pitfalls: [
          "Inferir el esquema en cada ejecución y aceptar cambios accidentales del productor.",
          "Descartar mensajes inválidos sin contador, payload ni coordenadas de origen.",
        ],
        examDecision: "Ante varios formatos o versiones, valida con un contrato explícito y enruta incompatibles; no detengas todo el topic por una fila ni la ignores sin evidencia.",
        checkpoint: {
          question: "¿Qué datos mínimos necesita una cuarentena Kafka para reprocesar una fila?",
          answer: "Payload original, motivo de rechazo, timestamp y coordenadas topic-partición-offset, además de la versión de esquema cuando exista.",
        },
      },
      {
        summary: "Kafka, checkpoint y Delta pueden ofrecer procesamiento exactamente una vez, pero cualquier sink externo vuelve a exigir idempotencia end-to-end.",
        deepDive: deepDives.m15l4,
        explanation: [
          "Spark registra rangos de offsets en el checkpoint y Delta confirma cada microbatch de manera transaccional. Un fallo puede hacer que el motor vuelva a calcular el lote, pero el protocolo del sink evita materializarlo dos veces. Esto no deduplica dos mensajes distintos que el productor publicó con el mismo `order_id`.",
          "Cuando el destino es una API, una base no transaccional o varios sistemas, `foreachBatch` ofrece semántica at-least-once a menos que la función sea idempotente. Un outbox del productor, identificadores de evento estables y `MERGE` en silver resuelven capas distintas del problema.",
        ],
        keyPoints: [
          "Exactly-once de procesamiento no elimina duplicados creados por el productor.",
          "Un checkpoint no puede deshacer un efecto externo ya confirmado fuera de Spark.",
          "La clave `event_id` permite deduplicación de negocio además de coordinación técnica de offsets.",
        ],
        example: {
          language: "SQL",
          title: "Upsert de eventos Kafka deduplicados",
          code: `MERGE INTO main.silver.orders AS target
USING staged_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.event_ts > target.event_ts THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;`,
          note: "Antes del `MERGE`, conserva una sola fila ganadora por `order_id` dentro del microbatch para evitar múltiples matches.",
        },
        pitfalls: [
          "Prometer exactly-once porque Kafka usa offsets, aunque el sink sea una API sin clave idempotente.",
          "Confundir reejecución del mismo offset con dos mensajes distintos enviados por el productor.",
        ],
        examDecision: "Evalúa garantías de cada frontera. Para un destino Delta integrado, usa checkpoint; para efectos externos, añade una operación idempotente o un ledger.",
        checkpoint: {
          question: "¿Puede el checkpoint eliminar un cargo duplicado ya creado en una API externa?",
          answer: "No. La API debe aceptar una clave idempotente o el pipeline debe registrar transacciones para que el reintento no repita el efecto.",
        },
      },
      {
        summary: "Particiones, límites de offsets y métricas de lag permiten regular throughput sin confundir una protección temporal con una solución de capacidad.",
        deepDive: deepDives.m15l5,
        explanation: [
          "El paralelismo máximo de lectura está condicionado por las particiones Kafka, aunque Spark pueda dividir rangos grandes en más tareas según capacidades de la fuente. `maxOffsetsPerTrigger` limita el volumen de un microbatch y protege al sink durante recuperación, pero si queda por debajo de la tasa de llegada el lag crecerá indefinidamente.",
          "Las métricas `avgOffsetsBehindLatest`, `maxOffsetsBehindLatest` y bytes estimados muestran atraso por fuente. Deben correlacionarse con duración del trigger, distribución de particiones y tasas de procesamiento. Una sola partición caliente puede dominar el SLA aunque la media parezca saludable.",
        ],
        keyPoints: [
          "`maxOffsetsPerTrigger` controla lote, no aumenta capacidad.",
          "La key del productor puede crear skew persistente entre particiones.",
          "Mide lag máximo y por partición, además de la media.",
        ],
        example: {
          language: "Python",
          title: "Extracción de lag desde el progreso",
          code: `progress = query.lastProgress or {}
for source in progress.get("sources", []):
    metrics = source.get("metrics", {})
    print({
        "description": source.get("description"),
        "avg_lag": metrics.get("avgOffsetsBehindLatest"),
        "max_lag": metrics.get("maxOffsetsBehindLatest"),
        "bytes_behind": metrics.get("estimatedTotalBytesBehindLatest"),
    })`,
          note: "Alerta por tendencia y tiempo estimado de recuperación, no por un valor aislado durante un pico esperado.",
        },
        pitfalls: [
          "Reducir el lote hasta estabilizar la duración mientras el backlog crece silenciosamente.",
          "Añadir workers cuando el topic tiene una sola partición caliente y no ofrece paralelismo útil.",
        ],
        examDecision: "Si el lag crece, compara tasa de llegada, límite por trigger, particiones y cuello del sink; ajusta el límite para estabilidad y la capacidad para converger.",
        checkpoint: {
          question: "¿Por qué un `maxOffsetsPerTrigger` demasiado bajo puede incumplir el SLA aunque cada lote termine rápido?",
          answer: "Porque admite menos eventos por unidad de tiempo de los que llegan y el backlog aumenta pese a microbatches cortos.",
        },
      },
    ],
    lab: {
      title: "Ingesta Kafka gobernada con cuarentena y trazabilidad",
      goal: "Consumir pedidos Kafka, conservar coordenadas de origen, validar un esquema y separar mensajes inválidos sin ocultar pérdida de offsets.",
      scenario: "El topic `orders.v1` recibe JSON de varios productores. Algunos mensajes están truncados y un productor reintenta eventos. Operaciones necesita una tabla bronze auditable y una silver tipada sin detener el flujo por una fila corrupta.",
      steps: [
        "Configura `subscribe`, bootstrap servers y offsets iniciales sin incrustar secretos.",
        "Conserva key, payload, topic, partition, offset y timestamp en la capa bronze.",
        "Deserializa con un `StructType` explícito y clasifica filas válidas e inválidas.",
        "Escribe válidas y cuarentena en tablas Delta usando checkpoints independientes o una operación idempotente común.",
        "Mide lag, duplicados y tasa de errores; documenta cómo se reprocesaría un rango concreto.",
      ],
      starterCode: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("event_id", T.StringType(), False),
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
])

# TODO: lee Kafka, conserva metadatos y separa válidas de cuarentena.`,
      solution: `from pyspark.sql import functions as F, types as T

order_schema = T.StructType([
    T.StructField("event_id", T.StringType(), False),
    T.StructField("order_id", T.StringType(), False),
    T.StructField("event_ts", T.TimestampType(), False),
    T.StructField("amount", T.DecimalType(18, 2), False),
])

raw = (
    spark.readStream.format("kafka")
      .option("kafka.bootstrap.servers", bootstrap_servers)
      .option("subscribe", "orders.v1")
      .option("startingOffsets", "latest")
      .option("failOnDataLoss", "true")
      .option("maxOffsetsPerTrigger", 250000)
      .load()
)

bronze = raw.selectExpr(
    "CAST(key AS STRING) AS message_key",
    "CAST(value AS STRING) AS payload",
    "topic", "partition", "offset",
    "timestamp AS kafka_timestamp"
).withColumn("event", F.from_json("payload", order_schema))

valid = (
    bronze.where(
        F.col("event").isNotNull() &
        F.col("event.event_id").isNotNull() &
        F.col("event.order_id").isNotNull() &
        (F.col("event.amount") >= 0)
    )
    .select("event.*", "topic", "partition", "offset", "kafka_timestamp")
)

quarantine = (
    bronze.where(
        F.col("event").isNull() |
        F.col("event.event_id").isNull() |
        F.col("event.order_id").isNull() |
        (F.col("event.amount") < 0)
    )
    .withColumn(
        "reason",
        F.when(F.col("event").isNull(), "INVALID_JSON")
         .when(F.col("event.event_id").isNull(), "MISSING_EVENT_ID")
         .when(F.col("event.order_id").isNull(), "MISSING_ORDER_ID")
         .otherwise("INVALID_AMOUNT")
    )
)

def publish(batch_df, batch_id):
    (batch_df.where("event IS NOT NULL")
       .select("event.*", "topic", "partition", "offset", "kafka_timestamp")
       .dropDuplicates(["event_id"])
       .write.mode("append").saveAsTable("main.silver.kafka_orders"))
    (batch_df.where("event IS NULL OR event.event_id IS NULL OR event.order_id IS NULL OR event.amount < 0")
       .withColumn("quarantined_at", F.current_timestamp())
       .write.mode("append").saveAsTable("main.ops.kafka_orders_quarantine"))

query = (
    bronze.writeStream.foreachBatch(publish)
      .option("checkpointLocation", "/Volumes/main/ops/checkpoints/m15_kafka_orders_v1")
      .start()
)`,
      checks: [
        { label: "Configura una suscripción Kafka", pattern: "format\\(\"kafka\"\\)[\\s\\S]*option\\(\"subscribe\"" },
        { label: "Conserva coordenadas de origen", pattern: "topic[\\s\\S]*partition[\\s\\S]*offset" },
        { label: "Deserializa con un esquema", pattern: "from_json" },
        { label: "Define checkpoint y cuarentena", pattern: "(?:checkpointLocation[\\s\\S]*quarantine|quarantine[\\s\\S]*checkpointLocation)" },
      ],
      expectedEvidence: [
        "Filas silver con `event_id` único y columnas topic, partition y offset.",
        "Filas de cuarentena con payload, coordenadas y motivo de rechazo.",
        "Captura de `lastProgress` con offsets y métricas de lag.",
        "Procedimiento de replay que usa checkpoint/destino aislados y un rango de offsets documentado.",
      ],
      cloudNotes: {
        AWS: "Para Amazon MSK, usa conectividad privada y el mecanismo SASL/IAM o TLS aprobado; almacena parámetros sensibles en secretos y limita Security Groups al compute.",
        Azure: "Con Event Hubs mediante su endpoint compatible con Kafka, configura SASL_SSL y la identidad/secreto gobernado; valida throughput units y retención además del código Spark.",
        GCP: "Para un servicio Kafka gestionado o Confluent en GCP, usa Private Service Connect/VPC según disponibilidad y una identidad de servicio; si la fuente es Pub/Sub, el conector y sus garantías son distintos y no debe disfrazarse como Kafka.",
      },
    },
    quiz: [
      {
        question: "Un equipo cambia `startingOffsets` de `latest` a `earliest`, mantiene el checkpoint y espera releer seis meses. ¿Qué ocurrirá?",
        options: [
          "Releerá desde earliest en el siguiente microbatch",
          "Kafka borrará el consumer group",
          "Reanudará desde el checkpoint; hace falta un reproceso aislado para rebobinar",
          "Duplicará solo la última partición",
        ],
        answer: 2,
        explanation: "En una consulta streaming reanudada mandan los offsets del checkpoint. `startingOffsets` solo aplica al arranque de una consulta nueva.",
        domain: "Kafka · offsets y checkpoints",
      },
      {
        question: "Debe investigarse exactamente qué mensaje produjo una fila silver incorrecta. ¿Qué metadatos son imprescindibles conservar?",
        options: [
          "Topic, partición y offset",
          "Solo la hora del cluster",
          "Solo el número de microbatch",
          "El nombre del notebook y el tamaño del driver",
        ],
        answer: 0,
        explanation: "La posición Kafka se identifica por topic-partición-offset; conservar payload y schema version completa la trazabilidad.",
        domain: "Kafka · trazabilidad",
      },
      {
        question: "Cada microbatch termina en 20 segundos, pero el lag crece porque llegan 300.000 eventos/minuto y `maxOffsetsPerTrigger` vale 100.000. ¿Qué diagnóstico es correcto?",
        options: [
          "El trigger está deduplicando por error",
          "El checkpoint debería borrarse cada minuto",
          "El topic necesita menos retención",
          "El límite de ingestión es inferior a la llegada y el pipeline no converge",
        ],
        answer: 3,
        explanation: "Procesar como máximo 100.000 por trigger frente a 300.000 entrantes crea backlog aunque cada lote individual sea corto.",
        domain: "Kafka · rendimiento",
      },
      {
        question: "Un sink HTTP recibe dos veces el mismo microbatch tras un fallo. ¿Qué diseño preserva un único efecto por pedido?",
        options: [
          "Cambiar `subscribe` por `assign`",
          "Enviar `event_id` como clave idempotente aceptada por el servicio",
          "Eliminar la key Kafka",
          "Establecer `failOnDataLoss=false`",
        ],
        answer: 1,
        explanation: "El checkpoint no puede revertir un efecto HTTP ya confirmado; el receptor debe deduplicar mediante una clave idempotente estable.",
        domain: "Kafka · garantías end-to-end",
      },
    ],
    sources: [
      {
        label: "Kafka connector for Structured Streaming · Databricks",
        href: "https://docs.databricks.com/aws/en/connect/streaming/kafka",
        reviewedAt,
      },
      {
        label: "Spark API options reference · Databricks",
        href: "https://docs.databricks.com/aws/en/spark/api-options",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
    ],
  },

  m16: {
    lessons: [
      {
        summary: "Delta Change Data Feed expone cambios confirmados de una tabla junto con su tipo, versión y timestamp de commit para consumo incremental.",
        deepDive: deepDives.m16l1,
        explanation: [
          "Al habilitar `delta.enableChangeDataFeed`, las versiones futuras pueden leerse con `readChangeFeed=true`. La salida incluye `_change_type`, `_commit_version` y `_commit_timestamp`; los updates generan imágenes previa y posterior. CDF no reconstruye cambios anteriores a su activación.",
          "El historial disponible depende de la retención de la tabla y de `VACUUM`. Un consumidor que permanezca caído más allá del horizonte puede no recuperar versiones antiguas. Por eso el SLA de recuperación debe relacionar retención, máxima indisponibilidad y una alternativa de snapshot.",
        ],
        keyPoints: [
          "CDF se habilita antes de los cambios que se quieren capturar.",
          "`update_preimage` y `update_postimage` representan dos vistas del mismo update.",
          "La versión de commit ordena cambios Delta; el timestamp ayuda a auditoría, pero no sustituye la secuencia de origen.",
        ],
        example: {
          language: "PySpark",
          title: "Lectura incremental de Change Data Feed",
          code: `spark.sql("""
ALTER TABLE main.bronze.customers
SET TBLPROPERTIES (delta.enableChangeDataFeed = true)
""")

changes = (
    spark.readStream
      .option("readChangeFeed", "true")
      .table("main.bronze.customers")
      .where("_change_type IN ('insert', 'update_postimage', 'delete')")
)`,
          note: "En un stream nuevo se puede fijar `startingVersion`; al reanudar, el checkpoint conserva la posición.",
        },
        pitfalls: [
          "Esperar que habilitar CDF genere retroactivamente cambios de versiones anteriores.",
          "Consumir preimages y postimages como dos actualizaciones independientes y duplicar efectos.",
        ],
        examDecision: "Usa CDF cuando la fuente ya es Delta y necesitas cambios fila a fila; si faltan versiones por retención, reconstruye desde snapshot en lugar de inventar offsets.",
        checkpoint: {
          question: "¿Qué tipos de cambio suelen conservarse para materializar el estado actual?",
          answer: "`insert`, `update_postimage` y `delete`; `update_preimage` sirve para auditoría o comparaciones, no como nuevo estado.",
        },
      },
      {
        summary: "Un feed CDC solo es determinista si define claves, una secuencia total por clave y semántica explícita para deletes y valores nulos.",
        deepDive: deepDives.m16l2,
        explanation: [
          "La hora de llegada no es una secuencia fiable: un update antiguo puede llegar después de uno nuevo. `SEQUENCE BY` debe usar un LSN, número de versión u otra columna monotónica del origen. Si hay empates, un `struct` con campos de desempate produce un orden lexicográfico estable.",
          "El pipeline también debe decidir si un `NULL` borra el valor o significa 'campo no enviado', y cómo identificar borrados. La clave no debe cambiar silenciosamente; una modificación de clave suele modelarse como delete de la antigua e insert de la nueva.",
        ],
        keyPoints: [
          "La secuencia se evalúa por clave y debe resolver eventos fuera de orden.",
          "`APPLY AS DELETE WHEN` convierte una condición del feed en eliminación lógica del target.",
          "`IGNORE NULL UPDATES` solo es correcto cuando los nulos significan ausencia de cambio.",
        ],
        example: {
          language: "SQL",
          title: "Orden compuesto para CDC",
          code: `SELECT
  customer_id,
  operation,
  sequence_number,
  event_ts,
  named_struct(
    'sequence_number', sequence_number,
    'event_ts', event_ts
  ) AS cdc_sequence
FROM STREAM(main.bronze.customer_cdc);`,
          note: "El primer campo del struct debe representar el orden autoritativo del origen; el timestamp solo desempata si su calidad está garantizada.",
        },
        pitfalls: [
          "Ordenar por `current_timestamp()` y permitir que el evento más tardío en llegar sobrescriba al más nuevo del origen.",
          "Activar `IGNORE NULL UPDATES` cuando un nulo representa realmente una eliminación de atributo.",
        ],
        examDecision: "Ante CDC fuera de orden, elige una secuencia monotónica del sistema fuente; añadir más compute no corrige la selección de una versión equivocada.",
        checkpoint: {
          question: "¿Por qué un timestamp de ingesta no es un buen `SEQUENCE BY`?",
          answer: "Porque ordena por llegada, no por el commit del origen; un cambio antiguo retrasado podría vencer a uno más reciente.",
        },
      },
      {
        summary: "AUTO CDC es el nombre actual de las APIs de pipelines que reemplazan a APPLY CHANGES y automatizan orden, deduplicación, deletes y SCD.",
        deepDive: deepDives.m16l3,
        explanation: [
          "En SQL se declara una streaming table target y un flow `AUTO CDC INTO`. En Python se usa la API equivalente de Spark Declarative Pipelines en Lakeflow. La fuente debe ser streaming y la clave, secuencia y reglas de borrado quedan en la definición declarativa.",
          "`APPLY CHANGES` sigue disponible por compatibilidad y comparte sintaxis, pero Databricks recomienda AUTO CDC. En documentación, código nuevo y respuestas de diseño debe aparecer el nombre actual; mencionar APPLY CHANGES solo aclara una configuración anterior o una migración.",
        ],
        keyPoints: [
          "AUTO CDC sustituye a APPLY CHANGES con la misma finalidad y sintaxis equivalente.",
          "El target de un flow AUTO CDC es una streaming table.",
          "La declaración no elimina la necesidad de validar claves, secuencia, deletes y retención.",
        ],
        example: {
          language: "SQL",
          title: "AUTO CDC SCD tipo 1",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_cdc_flow AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(sequence_number, event_ts)
COLUMNS * EXCEPT (operation, sequence_number)
STORED AS SCD TYPE 1;`,
          note: "`APPLY CHANGES INTO` es la denominación anterior. Para implementaciones nuevas usa `AUTO CDC INTO`.",
        },
        pitfalls: [
          "Copiar ejemplos antiguos y presentar APPLY CHANGES como la API recomendada actual.",
          "Omitir `SEQUENCE BY` autoritativo y asumir que el pipeline puede inferir el orden correcto.",
        ],
        examDecision: "Para aplicar un feed CDC en Lakeflow pipelines, elige AUTO CDC; usa SCD 1 o 2 según si el consumidor necesita estado actual o historia.",
        checkpoint: {
          question: "¿Cuál es la relación entre AUTO CDC y APPLY CHANGES?",
          answer: "AUTO CDC reemplaza y es el nombre recomendado para las APIs antes llamadas APPLY CHANGES; las anteriores siguen disponibles por compatibilidad.",
        },
      },
      {
        summary: "SCD tipo 1 conserva el valor vigente; SCD tipo 2 crea intervalos de validez para responder cómo era una dimensión en un momento pasado.",
        deepDive: deepDives.m16l4,
        explanation: [
          "Tipo 1 sobrescribe atributos y es apropiado para correcciones donde la historia no aporta valor. Tipo 2 conserva versiones con columnas de inicio y fin administradas por el pipeline. Consultas de hechos históricos pueden unir el event time del hecho con el intervalo de la dimensión.",
          "Guardar historia multiplica filas y exige decidir qué columnas disparan una nueva versión. `TRACK HISTORY ON` puede limitar ese conjunto en AUTO CDC. Campos operativos como `ingested_at` no deberían crear una versión de negocio cada vez que cambia.",
        ],
        keyPoints: [
          "SCD 1 responde 'cuál es el valor actual'; SCD 2 responde también 'cuál era entonces'.",
          "La secuencia determina intervalos; no debe confundirse con la fecha de carga.",
          "El conjunto de columnas históricas controla ruido y coste de almacenamiento.",
        ],
        example: {
          language: "SQL",
          title: "AUTO CDC SCD tipo 2 selectivo",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

CREATE FLOW customers_history_flow AS AUTO CDC INTO
  main.silver.customers_history
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY sequence_number
COLUMNS * EXCEPT (operation)
STORED AS SCD TYPE 2
TRACK HISTORY ON (name, segment, country);`,
          note: "Verifica los nombres de las columnas de control que expone el target antes de diseñar consultas point-in-time.",
        },
        pitfalls: [
          "Usar SCD 2 para cada atributo técnico y generar versiones sin valor analítico.",
          "Sobrescribir con SCD 1 cuando auditoría o reporting histórico necesitan el valor vigente al producirse el hecho.",
        ],
        examDecision: "Si el requisito contiene 'estado actual', SCD 1 suele bastar; si pide auditoría o joins históricos point-in-time, elige SCD 2.",
        checkpoint: {
          question: "¿Qué problema evita `TRACK HISTORY ON` en un target SCD 2?",
          answer: "Evita abrir una versión histórica por cambios en columnas irrelevantes y limita la historia a atributos de negocio seleccionados.",
        },
      },
      {
        summary: "AUTO CDC FROM SNAPSHOT procesa snapshots ordenados cuando la fuente no ofrece un log de cambios, pero necesita una versión fiable y cobertura completa.",
        deepDive: deepDives.m16l5,
        explanation: [
          "Algunas bases entregan una extracción completa diaria. Comparar snapshots permite inferir inserts, updates y deletes, y las APIs AUTO CDC FROM SNAPSHOT automatizan esa materialización. Cada snapshot debe tener una versión estrictamente creciente y representar el conjunto completo esperado.",
          "Una extracción parcial confundida con snapshot completo produciría borrados masivos. Antes de publicar se validan conteos, particiones y marcadores de finalización. Si el origen sí ofrece CDC continuo, AUTO CDC normal evita comparar toda la dimensión y reduce latencia.",
        ],
        keyPoints: [
          "Snapshot CDC sirve cuando no existe un feed de cambios fiable.",
          "La versión del snapshot debe ordenar entregas y no reutilizarse.",
          "La completitud se comprueba antes de interpretar ausencias como deletes.",
        ],
        example: {
          language: "Python",
          title: "Contrato mínimo de un snapshot",
          code: `snapshot_manifest = {
    "snapshot_version": 2026072101,
    "source_table": "crm.customers",
    "expected_rows": 12_450_230,
    "completed": True,
    "landing_path": "/Volumes/main/landing/customers/2026-07-21/",
}

assert snapshot_manifest["completed"]
assert snapshot_manifest["expected_rows"] > 0`,
          note: "La función que entrega snapshots a AUTO CDC debe ordenar versiones y devolver `None` cuando no haya una nueva disponible.",
        },
        pitfalls: [
          "Interpretar una partición ausente por fallo de extracción como eliminación de todos sus clientes.",
          "Procesar snapshots fuera de orden y reabrir una versión antigua como si fuera nueva.",
        ],
        examDecision: "Si la fuente solo entrega imágenes completas, usa AUTO CDC FROM SNAPSHOT con versión y validación de completitud; no fabriques un feed fila a fila sin base autoritativa.",
        checkpoint: {
          question: "¿Qué validación evita deletes falsos al comparar snapshots?",
          answer: "Confirmar mediante manifiesto/conteos que el snapshot es completo antes de interpretar filas ausentes como eliminadas.",
        },
      },
    ],
    lab: {
      title: "Dimensión de clientes SCD 2 con AUTO CDC",
      goal: "Materializar un feed CDC fuera de orden como historia SCD 2, con deletes explícitos y una secuencia compuesta determinista.",
      scenario: "El CRM publica inserts, updates y deletes de clientes. Los reintentos pueden entregar cambios fuera de orden y dos cambios comparten ocasionalmente timestamp, pero `sequence_number` es monotónico por cliente.",
      steps: [
        "Valida que `customer_id`, `sequence_number`, `operation` y `event_ts` estén presentes en bronze.",
        "Declara una streaming table target para el historial de clientes.",
        "Crea un flow AUTO CDC —no uno nuevo con el nombre anterior APPLY CHANGES— con clave y secuencia compuesta.",
        "Mapea `DELETE`, excluye columnas operativas y conserva historia solo para atributos de negocio.",
        "Prueba dos updates fuera de orden y demuestra que la versión de mayor secuencia queda vigente.",
      ],
      starterCode: `-- Spark Declarative Pipelines en Lakeflow · SQL
CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

-- TODO: crea un FLOW AUTO CDC desde main.bronze.customer_cdc
-- con customer_id, secuencia determinista, deletes y SCD TYPE 2.`,
      solution: `-- Spark Declarative Pipelines en Lakeflow · SQL
CREATE OR REFRESH STREAMING TABLE main.silver.customers_history;

CREATE FLOW customers_history_cdc AS AUTO CDC INTO
  main.silver.customers_history
FROM STREAM(main.bronze.customer_cdc)
KEYS (customer_id)
IGNORE NULL UPDATES
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(sequence_number, event_ts)
COLUMNS * EXCEPT (
  operation,
  sequence_number,
  source_lsn,
  ingested_at
)
STORED AS SCD TYPE 2
TRACK HISTORY ON (
  name,
  email,
  segment,
  country
);`,
      checks: [
        { label: "Usa la API AUTO CDC actual", pattern: "AUTO CDC INTO" },
        { label: "Define clave de negocio", pattern: "KEYS\\s*\\(\\s*customer_id\\s*\\)" },
        { label: "Ordena con una secuencia", pattern: "SEQUENCE BY" },
        { label: "Conserva historia SCD 2", pattern: "STORED AS SCD TYPE 2" },
      ],
      expectedEvidence: [
        "Caso de prueba con insert, update nuevo, update antiguo retrasado y delete para la misma clave.",
        "Consulta del target que muestra intervalos SCD 2 sin solapamiento y una sola versión vigente.",
        "Prueba de que el update retrasado no reemplaza la versión de mayor `sequence_number`.",
        "Explicación de la semántica de `IGNORE NULL UPDATES` para este feed concreto.",
      ],
      cloudNotes: {
        AWS: "Si el CDC procede de una base en AWS, usa conectividad privada y Lakeflow Connect/DMS según el patrón; gobierna tablas y checkpoints en Unity Catalog con IAM role de mínimo privilegio.",
        Azure: "Para CDC desde Azure SQL u otra fuente, prioriza conectividad privada e identidad administrada cuando sea compatible; guarda secretos de conexión fuera del pipeline.",
        GCP: "Para fuentes en GCP, usa private connectivity y service accounts separadas para extracción y almacenamiento; documenta retención del log o snapshots de recuperación.",
      },
    },
    quiz: [
      {
        question: "Un update con secuencia 104 llega antes que otro con secuencia 103. ¿Qué debe quedar vigente tras AUTO CDC?",
        options: [
          "El 103, porque llegó el último",
          "El 104, porque `SEQUENCE BY` representa el orden autoritativo",
          "Ambos como filas vigentes",
          "Ninguno hasta ejecutar `VACUUM`",
        ],
        answer: 1,
        explanation: "AUTO CDC usa la secuencia declarada para resolver eventos fuera de orden; la hora de llegada no debe hacer retroceder el estado.",
        domain: "CDC · orden y deduplicación",
      },
      {
        question: "Una solución nueva usa Lakeflow pipelines para aplicar un feed CDC. ¿Qué API debe nombrar la documentación actual?",
        options: [
          "COPY CHANGES",
          "MERGE STREAM",
          "APPLY CHANGES como única API vigente",
          "AUTO CDC, indicando que reemplaza a APPLY CHANGES",
        ],
        answer: 3,
        explanation: "Databricks recomienda AUTO CDC; APPLY CHANGES es la denominación anterior y sigue disponible por compatibilidad.",
        domain: "Lakeflow pipelines · AUTO CDC",
      },
      {
        question: "Reporting debe saber el segmento que tenía un cliente cuando se produjo cada venta. ¿Qué modelado corresponde?",
        options: [
          "SCD tipo 2 con intervalos de validez",
          "SCD tipo 1 sobrescribiendo el segmento",
          "Una vista del último microbatch sin clave",
          "Eliminar el historial tras cada ejecución",
        ],
        answer: 0,
        explanation: "SCD 2 conserva las versiones necesarias para un join point-in-time; SCD 1 solo conserva el valor actual.",
        domain: "CDC · SCD",
      },
      {
        question: "Un consumidor CDF estuvo detenido más tiempo que la retención y ya no existe la versión requerida. ¿Qué respuesta es segura?",
        options: [
          "Usar `failOnDataLoss=false` y asumir que no falta nada",
          "Inventar la versión a partir del timestamp actual",
          "Reconstruir desde un snapshot válido y restablecer el punto incremental",
          "Borrar la tabla fuente",
        ],
        answer: 2,
        explanation: "Cuando faltan versiones del feed no puede garantizarse continuidad; un snapshot autoritativo permite reconstruir el estado y reiniciar el consumo.",
        domain: "Delta Change Data Feed · recuperación",
      },
    ],
    sources: [
      {
        label: "Delta Change Data Feed · Databricks",
        href: "https://docs.databricks.com/aws/en/delta/delta-change-data-feed",
        reviewedAt,
      },
      {
        label: "AUTO CDC APIs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/cdc",
        reviewedAt,
      },
      {
        label: "AUTO CDC INTO SQL reference · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/developer/ldp-sql-ref-apply-changes-into",
        reviewedAt,
      },
    ],
  },

  m17: {
    lessons: [
      {
        summary: "Un SLA de streaming debe traducirse en indicadores medibles de frescura, completitud, corrección y disponibilidad, con ventanas y responsables explícitos.",
        deepDive: deepDives.m17l1,
        explanation: [
          "Decir 'tiempo real' no permite diseñar ni operar. Un SLO útil puede exigir que el p95 de `published_at - event_ts` sea inferior a cinco minutos y que al menos el 99,5% de eventos válidos aparezcan antes de quince minutos. La completitud se reconcilia con una fuente autoritativa, no con que el stream siga activo.",
          "Cada indicador necesita una fuente de medición, periodo y presupuesto de error. Un watermark de diez minutos no garantiza por sí mismo diez minutos de frescura: el backlog, el trigger y el sink también cuentan. La arquitectura se valida contra los SLO, no al revés.",
        ],
        keyPoints: [
          "Frescura compara tiempo de negocio publicado con el reloj; disponibilidad solo indica si el proceso está ejecutándose.",
          "Completitud requiere un denominador o reconciliación autoritativa.",
          "El presupuesto de error determina cuándo una desviación es incidente y qué cambios se priorizan.",
        ],
        example: {
          language: "SQL",
          title: "Indicadores de frescura y completitud",
          code: `WITH stream AS (
  SELECT
    date_trunc('hour', event_ts) AS hour,
    percentile_approx(
      unix_timestamp(published_at) - unix_timestamp(event_ts),
      0.95
    ) AS freshness_p95_s,
    count(DISTINCT event_id) AS published_events
  FROM main.silver.clickstream
  WHERE event_ts >= current_timestamp() - INTERVAL 24 HOURS
  GROUP BY 1
)
SELECT * FROM stream ORDER BY hour DESC;`,
          note: "La completitud necesita comparar `published_events` con un conteo independiente de la fuente o un manifiesto de productores.",
        },
        pitfalls: [
          "Medir solo duración de microbatch y llamarla frescura de negocio.",
          "Fijar un SLA sin definir zona horaria, percentil, ventana ni exclusiones de eventos inválidos.",
        ],
        examDecision: "Si el requisito es operacional, busca una métrica observable y un umbral; seleccionar `continuous` o más workers sin SLO no demuestra cumplimiento.",
        checkpoint: {
          question: "¿Por qué una consulta `ACTIVE` puede incumplir frescura?",
          answer: "Puede seguir activa mientras acumula backlog o publica eventos antiguos; hay que medir la diferencia entre event time y tiempo de publicación.",
        },
      },
      {
        summary: "La arquitectura separa entrada auditable, transformación stateful, publicación idempotente y observabilidad para que cada frontera pueda recuperarse.",
        deepDive: deepDives.m17l2,
        explanation: [
          "Bronze conserva el evento original y coordenadas de origen. Silver valida esquema, deduplica y aplica reglas temporales. Gold sirve agregados con la latencia acordada. Cada consulta tiene un checkpoint exclusivo y cada tabla una clave o contrato que permite recomponerla desde una capa anterior.",
          "La capacidad se diseña para la tasa sostenida más un margen de recuperación. Si tras una hora de caída llegan diez millones de eventos, el pipeline debe procesar más rápido que la tasa normal para volver al SLA. Separar ingestión de agregación evita que un operador stateful pesado bloquee la captura de entrada.",
        ],
        keyPoints: [
          "Bronze inmutable proporciona replay y auditoría.",
          "Checkpoints independientes reducen el radio de impacto de un cambio o fallo.",
          "Capacidad de recuperación debe superar la tasa de llegada, no solo sostenerla.",
        ],
        example: {
          language: "YAML",
          title: "Contrato operativo del pipeline",
          code: `pipeline: clickstream
sources:
  - main.bronze.web_events
targets:
  silver: main.silver.web_events
  gold: main.gold.sessions_5m
slo:
  freshness_p95_seconds: 300
  completeness_percent: 99.5
recovery:
  rto_minutes: 30
  replay_source: main.bronze.web_events
owner: data-platform-oncall`,
          note: "Este contrato debe acompañarse de consultas que calculen cada indicador y enlaces al runbook.",
        },
        pitfalls: [
          "Acoplar ingestión, enrichments externos y agregación en una sola consulta sin punto de replay intermedio.",
          "Dimensionar únicamente para el promedio y no poder reducir backlog después de una interrupción.",
        ],
        examDecision: "Para limitar radio de fallo y permitir replay, persiste bronze y separa checkpoints por etapa; no encadenes todos los efectos en un único `foreachBatch` opaco.",
        checkpoint: {
          question: "¿Qué condición permite que un pipeline recupere backlog?",
          answer: "Su throughput efectivo durante recuperación debe superar la tasa de llegada mientras el origen conserve los datos necesarios.",
        },
      },
      {
        summary: "Un plan de recuperación distingue reinicio, replay y rebuild, y nunca borra estado antes de capturar evidencia y delimitar el rango afectado.",
        deepDive: deepDives.m17l3,
        explanation: [
          "Un fallo transitorio del executor suele resolverse reanudando desde el mismo checkpoint. Un cambio incompatible de estado requiere checkpoint nuevo y reconstrucción desde bronze. Un error lógico publicado exige identificar versiones o tiempos afectados, corregir código y escribir de forma idempotente en un destino aislado antes del cutover.",
          "La retención de Kafka, CDF, archivos y Delta debe cubrir el RTO y el máximo tiempo de detección. Si el origen ya eliminó datos, restaurar compute no recupera completitud. Los runbooks incluyen criterios para pausar productores o consumidores, rutas alternativas y validación posterior.",
        ],
        keyPoints: [
          "Reinicio conserva checkpoint; replay usa un rango y estado aislados; rebuild reconstruye una tabla completa.",
          "Captura `lastProgress`, offsets, versión de código y error antes de mutar estado.",
          "La retención de origen es un requisito de recuperación, no solo una decisión de coste.",
        ],
        example: {
          language: "SQL",
          title: "Delimitación de una ventana de reparación",
          code: `SELECT
  min(event_ts) AS first_affected,
  max(event_ts) AS last_affected,
  count(*) AS affected_rows,
  count(DISTINCT event_id) AS affected_events
FROM main.silver.web_events
WHERE pipeline_version = '2026.07.20-bad'
  AND event_date BETWEEN DATE '2026-07-20' AND DATE '2026-07-21';`,
          note: "Repara primero en una tabla sombra y compara claves/conteos antes de reemplazar o hacer `MERGE` en producción.",
        },
        pitfalls: [
          "Borrar checkpoint como primer paso y perder el punto exacto del incidente.",
          "Reprocesar todo el histórico en el mismo destino sin aislar escrituras ni evitar duplicados.",
        ],
        examDecision: "Fallo transitorio: reanuda. Cambio stateful incompatible: checkpoint nuevo y rebuild. Error de datos: replay delimitado e idempotente con validación previa.",
        checkpoint: {
          question: "¿Cuándo es apropiado conservar el checkpoint durante la recuperación?",
          answer: "Cuando la topología y estado siguen siendo compatibles y el fallo es transitorio; así se reanuda desde los offsets confirmados.",
        },
      },
      {
        summary: "La observabilidad combina progreso Spark, lag de fuente, calidad de datos y SLO de negocio para ofrecer alertas accionables.",
        deepDive: deepDives.m17l4,
        explanation: [
          "El progreso de la consulta muestra duración, tasas y estado; Kafka o Auto Loader aportan backlog; las tablas silver aportan máximo event time y descartes. Una alerta de frescura debe enlazar esas señales para diferenciar fuente parada, cuello de proceso, dato inválido o sink lento.",
          "Las métricas se escriben en una tabla con `query_id`, `batch_id`, versión y timestamp. Un dashboard sin alertas ni propietario no reduce tiempo de recuperación. Cada alarma debe incluir umbral, periodo, severidad, enlace a evidencia y primera acción segura.",
        ],
        keyPoints: [
          "Una única métrica técnica rara vez explica un incumplimiento de negocio.",
          "Las alertas usan ventanas sostenidas para evitar ruido de un microbatch aislado.",
          "Versión de código y query ID permiten correlacionar regresiones con despliegues.",
        ],
        example: {
          language: "Python",
          title: "Registro estructurado del progreso",
          code: `import json
from pyspark.sql import Row

progress = query.lastProgress or {}
record = Row(
    query_id=str(query.id),
    batch_id=progress.get("batchId"),
    observed_at=progress.get("timestamp"),
    input_rps=progress.get("inputRowsPerSecond", 0.0),
    processed_rps=progress.get("processedRowsPerSecond", 0.0),
    progress_json=json.dumps(progress),
)
spark.createDataFrame([record]).write.mode("append").saveAsTable(
    "main.ops.streaming_progress"
)`,
          note: "Para una solución productiva usa un listener o monitor administrado y controla volumen/PII del JSON de progreso.",
        },
        pitfalls: [
          "Alertar por una tasa baja cuando la fuente no tiene eventos y el SLO sigue satisfecho.",
          "Guardar logs sin `batch_id`, versión ni owner, impidiendo correlación y respuesta.",
        ],
        examDecision: "Si una alerta debe ser accionable, incluye la señal de negocio, backlog/progreso y contexto de despliegue; no alertes solo porque una consulta está inactiva.",
        checkpoint: {
          question: "¿Qué señales distinguen una fuente parada de un consumidor lento?",
          answer: "Fuente parada: no aumentan offsets ni event time. Consumidor lento: aumentan offsets/backlog mientras la tasa procesada queda por debajo de la llegada.",
        },
      },
      {
        summary: "Un game day verifica con fallos controlados que checkpoints, capacidad, alertas y runbook cumplen el RTO sin duplicar ni perder datos.",
        deepDive: deepDives.m17l5,
        explanation: [
          "La prueba puede detener compute durante diez minutos, introducir un evento tardío y reiniciar desde el mismo checkpoint. Se mide tiempo hasta recuperar frescura, lag máximo, duplicados y completitud. Otra prueba despliega un cambio stateful incompatible en un entorno aislado para practicar rollback o rebuild.",
          "El runbook se escribe como decisiones observables: si el checkpoint está íntegro y el código es compatible, reanudar; si faltan offsets, escalar pérdida y reconciliar; si el sink tiene efectos externos, verificar idempotencia. El resultado del ejercicio genera acciones con responsable y fecha.",
        ],
        keyPoints: [
          "Define estado inicial y criterios de éxito antes de inyectar el fallo.",
          "Mide RTO y calidad final, no solo que el proceso vuelve a estado RUNNING.",
          "El game day debe ser reversible, aislado y aprobado por el owner del servicio.",
        ],
        example: {
          language: "YAML",
          title: "Caso de game day reproducible",
          code: `experiment: stop-streaming-compute
preconditions:
  - bronze_backlog_is_zero
  - baseline_freshness_p95_lt_300s
fault:
  duration_minutes: 10
success:
  - no_duplicate_event_ids
  - completeness_percent_gte_99.5
  - freshness_recovered_within_30m
rollback:
  - resume_original_job
  - preserve_checkpoint
owner: data-platform-oncall`,
          note: "No ejecutes un experimento de resiliencia en producción sin límites, observabilidad y autorización explícitos.",
        },
        pitfalls: [
          "Declarar éxito cuando el query reinicia aunque el backlog y los duplicados sigan creciendo.",
          "Probar borrado de checkpoint productivo sin snapshot, aislamiento ni procedimiento de rollback.",
        ],
        examDecision: "Una recuperación se considera completa cuando restablece SLO y calidad dentro del RTO; `RUNNING` por sí solo no es criterio suficiente.",
        checkpoint: {
          question: "¿Qué cuatro resultados mínimos debe registrar un game day de streaming?",
          answer: "RTO, frescura recuperada, completitud final y ausencia/control de duplicados, junto con la evidencia del backlog.",
        },
      },
    ],
    lab: {
      title: "Proyecto: clickstream con SLA y recuperación",
      goal: "Entregar un flujo deduplicado con ventanas, métricas de frescura, checkpoint recuperable y un game day que demuestre el RTO.",
      scenario: "Producto necesita sesiones de clics cada cinco minutos. El p95 de frescura debe ser menor de cinco minutos, el 99,5% debe publicarse en quince minutos y una parada de diez minutos debe recuperarse en menos de treinta.",
      steps: [
        "Define consultas SQL que midan frescura, completitud y duplicados sobre datos de prueba.",
        "Implementa validación temporal, watermark de quince minutos y deduplicación por `event_id`.",
        "Publica ventanas de cinco minutos con checkpoint versionado y `availableNow` para el ejercicio.",
        "Captura progreso y máximo event time después de cada ejecución.",
        "Simula una parada/backlog, reanuda con el mismo checkpoint y mide tiempo hasta recuperar el SLO.",
        "Entrega un runbook con criterios de reinicio, replay y rebuild.",
      ],
      starterCode: `from pyspark.sql import functions as F

events = spark.readStream.table("main.bronze.web_events")

# TODO: validar event_ts, deduplicar con watermark, crear ventanas y publicar.
# SLO: freshness p95 < 300 s; completeness >= 99.5%; RTO < 30 min.`,
      solution: `from pyspark.sql import functions as F

checkpoint = "/Volumes/main/ops/checkpoints/m17_clickstream_v1"
source = spark.readStream.table("main.bronze.web_events")

clean = (
    source.withColumn("event_ts", F.to_timestamp("event_ts"))
      .where(
          F.col("event_id").isNotNull() &
          F.col("session_id").isNotNull() &
          F.col("event_ts").isNotNull() &
          (F.col("event_ts") <= F.current_timestamp() + F.expr("INTERVAL 2 MINUTES"))
      )
)

deduplicated = (
    clean.withWatermark("event_ts", "15 minutes")
         .dropDuplicatesWithinWatermark(["event_id"])
)

sessions_5m = (
    deduplicated.groupBy(
        F.window("event_ts", "5 minutes"),
        "session_id",
    )
    .agg(
        F.count("event_id").alias("events"),
        F.countDistinct("page").alias("pages"),
        F.max("event_ts").alias("last_event_ts"),
    )
    .select(
        "session_id",
        F.col("window.start").alias("window_start"),
        F.col("window.end").alias("window_end"),
        "events", "pages", "last_event_ts",
        F.current_timestamp().alias("published_at"),
    )
)

query = (
    sessions_5m.writeStream
      .queryName("m17_clickstream_sessions")
      .outputMode("append")
      .option("checkpointLocation", checkpoint)
      .trigger(availableNow=True)
      .toTable("main.gold.clickstream_sessions_5m")
)
query.awaitTermination()
print({
    "progress": query.lastProgress,
    "target_rows": spark.table("main.gold.clickstream_sessions_5m").count(),
})`,
      checks: [
        { label: "Aplica watermark y deduplicación", pattern: "withWatermark[\\s\\S]*dropDuplicatesWithinWatermark" },
        { label: "Crea ventanas de cinco minutos", pattern: "window\\(\"event_ts\",\\s*\"5 minutes\"\\)" },
        { label: "Usa checkpoint versionado", pattern: "(?:checkpointLocation[\\s\\S]*m17_clickstream_v1|m17_clickstream_v1[\\s\\S]*checkpointLocation)" },
        { label: "Conserva evidencia de progreso", pattern: "lastProgress" },
      ],
      expectedEvidence: [
        "Definición cuantitativa de frescura, completitud, duplicados y RTO.",
        "Resultados de casos a tiempo, tardíos dentro del umbral, demasiado tardíos y duplicados.",
        "Serie antes/durante/después del game day con backlog y frescura.",
        "Prueba de reanudación desde el mismo checkpoint sin duplicar `event_id`.",
        "Runbook con responsables y decisiones de reinicio, replay y rebuild.",
      ],
      cloudNotes: {
        AWS: "Asegura que la retención de MSK/Kinesis o S3 cubra detección más RTO; usa CloudWatch y conectividad privada junto a las métricas de Databricks.",
        Azure: "Alinea retención de Event Hubs/ADLS con el RTO y usa Azure Monitor más métricas de streaming; la managed identity debe acceder a checkpoints durante recuperación.",
        GCP: "Configura retención de Pub/Sub/Kafka/GCS por encima del peor tiempo de recuperación y correlaciona Cloud Monitoring con el progreso de Databricks.",
      },
    },
    quiz: [
      {
        question: "La consulta está ACTIVE, pero el máximo `event_ts` publicado tiene 40 minutos de retraso. ¿Qué indicador está incumplido?",
        options: [
          "Disponibilidad del metastore",
          "Frescura de negocio",
          "Retención de VACUUM necesariamente",
          "Número de notebooks",
        ],
        answer: 1,
        explanation: "El proceso puede estar activo y, aun así, publicar datos antiguos. La diferencia entre event time y publicación mide frescura.",
        domain: "Streaming production readiness · SLA",
      },
      {
        question: "Tras un fallo transitorio del executor, código, fuente y estado no han cambiado. ¿Qué recuperación minimiza riesgo?",
        options: [
          "Reanudar con el mismo checkpoint",
          "Borrar bronze y empezar desde latest",
          "Crear un checkpoint nuevo sin reconciliación",
          "Vaciar el target antes de cada reintento",
        ],
        answer: 0,
        explanation: "Con topología compatible, el checkpoint conserva offsets, commits y estado y permite continuar desde el último punto confirmado.",
        domain: "Streaming production readiness · recuperación",
      },
      {
        question: "Después de una caída, el pipeline procesa exactamente a la misma tasa a la que llegan eventos nuevos. ¿Qué ocurre con el backlog?",
        options: [
          "Desaparece por el watermark",
          "Se duplica en cada trigger",
          "Permanece aproximadamente constante y no se recupera el SLA",
          "Delta lo convierte automáticamente en batch",
        ],
        answer: 2,
        explanation: "Para reducir backlog el throughput debe superar temporalmente la tasa de llegada; igualarla solo evita que aumente.",
        domain: "Streaming production readiness · capacidad",
      },
      {
        question: "Un game day se declara exitoso porque el Job vuelve a RUNNING, pero hay 4% de eventos perdidos. ¿Cuál es la evaluación correcta?",
        options: [
          "Éxito, porque el estado RUNNING es suficiente",
          "Éxito si el cluster usa Photon",
          "Éxito si se borró el checkpoint",
          "Fallo: la recuperación debe restaurar también completitud y SLO dentro del RTO",
        ],
        answer: 3,
        explanation: "El objetivo es recuperar el servicio correcto, no solo reiniciar el proceso. La pérdida incumple el criterio de completitud.",
        domain: "Streaming production readiness · game day",
      },
    ],
    sources: [
      {
        label: "Production considerations for Structured Streaming · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/production",
        reviewedAt,
      },
      {
        label: "Monitor Structured Streaming queries · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/stream-monitoring",
        reviewedAt,
      },
      {
        label: "Structured Streaming checkpoints · Databricks",
        href: "https://docs.databricks.com/aws/en/structured-streaming/checkpoints",
        reviewedAt,
      },
    ],
  },

  m18: {
    lessons: [
      {
        summary: "Spark Declarative Pipelines define datasets y dependencias; Lakeflow extiende el framework y gestiona el grafo, las actualizaciones, el linaje y los eventos.",
        deepDive: deepDives.m18l1,
        explanation: [
          "En lugar de iniciar manualmente varios `writeStream`, cada función devuelve un DataFrame que define un dataset. Las lecturas entre datasets establecen dependencias y el pipeline determina el orden. Esto reduce código operativo, pero no elimina decisiones sobre contrato, incrementabilidad, calidad o coste.",
          "El grafo debe expresar transformaciones de datos, no pasos imperativos con efectos externos. Crear archivos, llamar APIs o mutar tablas arbitrariamente dentro de una función declarativa rompe reevaluación y dificulta optimización. Esos efectos pertenecen a tareas de Jobs alrededor del pipeline.",
        ],
        keyPoints: [
          "Las funciones declarativas devuelven DataFrames y no deben ejecutar acciones como `collect()` o escrituras manuales.",
          "Las dependencias proceden de lecturas, no del orden físico de funciones en el archivo.",
          "El event log ofrece progreso, calidad, linaje y errores del grafo.",
        ],
        example: {
          language: "PySpark",
          title: "Dos datasets declarativos conectados",
          code: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.table(name="orders_bronze")
def orders_bronze():
    return spark.readStream.table("main.raw.orders")

@dp.materialized_view(name="daily_order_totals")
def daily_order_totals():
    return (
        spark.read.table("orders_bronze")
          .groupBy(F.to_date("event_ts").alias("order_date"))
          .agg(F.sum("amount").alias("revenue"))
    )`,
          note: "El nombre lógico `orders_bronze` crea la dependencia; el pipeline administra actualización y metadatos.",
        },
        pitfalls: [
          "Llamar `display`, `count` o `saveAsTable` dentro de una función decorada y mezclar declaración con ejecución.",
          "Depender del orden del archivo en vez de leer explícitamente el dataset upstream.",
        ],
        examDecision: "Si el objetivo es declarar un grafo de tablas y vistas con operación gestionada, usa pipelines; para efectos externos o control flow, envuélvelo con Lakeflow Jobs.",
        checkpoint: {
          question: "¿Qué crea una arista entre dos datasets del pipeline?",
          answer: "Que la definición downstream lea el dataset upstream; la posición de las funciones en el archivo no determina la dependencia.",
        },
      },
      {
        summary: "Una streaming table procesa nuevas filas de una fuente streaming y conserva semántica incremental apropiada para bronze y silver append/CDC.",
        deepDive: deepDives.m18l2,
        explanation: [
          "Una definición con `spark.readStream` produce un flujo continuo o por triggers dentro del pipeline. La tabla persiste resultados y el servicio gestiona checkpoints internos. Es adecuada cuando cada registro nuevo puede procesarse incrementalmente sin recalcular todo el resultado.",
          "No debe leerse una fuente cambiante con `spark.read` y esperar semántica streaming. Tampoco se usa una streaming table para una consulta que necesita revisar cambios arbitrarios en ambos lados de un join batch; una materialized view puede permitir actualización incremental gestionada.",
        ],
        keyPoints: [
          "`spark.readStream` señala una entrada incremental.",
          "El pipeline administra estado operativo; no se define `checkpointLocation` dentro del dataset.",
          "La compatibilidad de transformaciones streaming sigue aplicando, incluidos watermarks para estado acotado.",
        ],
        example: {
          language: "PySpark",
          title: "Streaming table desde archivos con Auto Loader",
          code: `from pyspark import pipelines as dp

@dp.table(
    name="orders_bronze",
    comment="Pedidos crudos con metadatos de origen",
    table_properties={"quality": "bronze"},
)
def orders_bronze():
    return (
        spark.readStream.format("cloudFiles")
          .option("cloudFiles.format", "json")
          .option("cloudFiles.schemaLocation", "/Volumes/main/ops/schemas/orders")
          .load("/Volumes/main/landing/orders")
    )`,
          note: "La ubicación de esquema de Auto Loader sigue siendo necesaria aunque el pipeline gestione su propio estado.",
        },
        pitfalls: [
          "Añadir manualmente `writeStream` o `checkpointLocation` dentro de una definición de pipeline.",
          "Aplicar una agregación stateful sin watermark y trasladar al servicio un estado ilimitado.",
        ],
        examDecision: "Elige streaming table cuando la entrada y transformación son incrementales fila a fila; conserva materialized view para resultados que el servicio puede refrescar desde cambios upstream.",
        checkpoint: {
          question: "¿Quién gestiona el checkpoint de una streaming table en un pipeline?",
          answer: "Spark Declarative Pipelines en Lakeflow; el código del dataset no debe iniciar un `writeStream` ni declarar su checkpoint.",
        },
      },
      {
        summary: "Una materialized view almacena el resultado de una consulta batch declarativa y el servicio intenta actualizarla incrementalmente cuando cambian sus dependencias.",
        deepDive: deepDives.m18l3,
        explanation: [
          "A diferencia de una vista lógica, la salida se materializa para servir consultas rápidas. La definición suele usar `spark.read.table` porque describe el resultado completo correcto. El motor decide si puede aplicar cambios incrementales o si necesita recomputar según consulta y origen.",
          "Es apropiada para joins, agregaciones y modelos gold donde el resultado puede cambiar por actualizaciones upstream. No promete que toda consulta sea siempre incremental; diseño de claves, filtros y operaciones influye en el plan de refresh y debe observarse en el event log.",
        ],
        keyPoints: [
          "La definición expresa el resultado completo, aunque el refresh pueda ser incremental.",
          "Una materialized view almacena datos; una vista estándar recalcula al consultar.",
          "El event log permite verificar modo y coste del refresh en vez de asumirlo.",
        ],
        example: {
          language: "PySpark",
          title: "Vista materializada gold",
          code: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.materialized_view(name="customer_order_metrics")
def customer_order_metrics():
    orders = spark.read.table("orders_silver")
    return (
        orders.groupBy("customer_id")
          .agg(
              F.countDistinct("order_id").alias("orders"),
              F.sum("amount").alias("lifetime_value"),
              F.max("event_ts").alias("last_order_at"),
          )
    )`,
          note: "Consulta el event log para confirmar si las actualizaciones concretas usan refresh incremental.",
        },
        pitfalls: [
          "Usar `readStream` por reflejo en una materialized view que describe un resultado completo cambiante.",
          "Prometer refresh incremental para cualquier UDF o consulta sin observar el plan real.",
        ],
        examDecision: "Para un agregado gold materializado que debe reflejar updates upstream, prefiere materialized view; para append continuo por fila, streaming table.",
        checkpoint: {
          question: "¿Por qué la definición de una materialized view puede usar una lectura batch y seguir actualizándose incrementalmente?",
          answer: "Porque declara el resultado completo y el servicio analiza cambios upstream para elegir una estrategia de refresh cuando es compatible.",
        },
      },
      {
        summary: "Los flows permiten varias entradas hacia un target y distinguen append, AUTO CDC y cargas `ONCE` dentro del mismo modelo declarativo.",
        deepDive: deepDives.m18l4,
        explanation: [
          "Un default flow acompaña la definición normal de un dataset. Flows adicionales pueden unir feeds regionales en una misma streaming table sin construir un `union` monolítico. Un append flow añade filas; AUTO CDC aplica cambios ordenados; `ONCE` ejecuta una carga batch una sola vez salvo full refresh.",
          "Cada flow debe tener identidad y semántica compatibles con el target. Un target de AUTO CDC solo recibe flows AUTO CDC. Para backfill histórico, un append flow `ONCE` aislado puede coexistir con la ingesta continua, siempre que no duplique rangos ya procesados.",
        ],
        keyPoints: [
          "Varios append flows pueden escribir en una misma streaming table.",
          "AUTO CDC targets solo aceptan flows AUTO CDC.",
          "`ONCE` sirve para una carga finita y vuelve a ejecutarse en un full refresh.",
        ],
        example: {
          language: "SQL",
          title: "Flows regionales hacia una tabla",
          code: `CREATE OR REFRESH STREAMING TABLE main.bronze.orders_all;

CREATE FLOW orders_eu AS INSERT INTO main.bronze.orders_all
BY NAME SELECT *, 'eu' AS region
FROM STREAM(main.raw.orders_eu);

CREATE FLOW orders_us AS INSERT INTO main.bronze.orders_all
BY NAME SELECT *, 'us' AS region
FROM STREAM(main.raw.orders_us);`,
          note: "Valida claves y esquema comunes; `BY NAME` evita depender del orden físico de columnas.",
        },
        pitfalls: [
          "Mezclar append y AUTO CDC sobre el mismo target sin respetar las restricciones del flow.",
          "Usar `ONCE` para datos que seguirán llegando y dejar de ingerir silenciosamente después de la primera actualización.",
        ],
        examDecision: "Cuando varias fuentes compatibles alimentan el mismo target, usa flows separados; para cambios de estado usa AUTO CDC, no un append de updates.",
        checkpoint: {
          question: "¿Cuándo volvería a ejecutarse un flow marcado `ONCE`?",
          answer: "En la primera actualización y de nuevo si se realiza un full refresh del target o pipeline, según la semántica documentada.",
        },
      },
      {
        summary: "Un pipeline mantenible separa datasets por dominio y capa, parametriza catálogos/rutas y mantiene efectos operativos fuera de las definiciones.",
        deepDive: deepDives.m18l5,
        explanation: [
          "Los archivos Python pueden agruparse por bronze, silver y gold o por dominio, siempre que los nombres de dataset sean únicos. Configuración como catálogo fuente, paths y umbrales entra mediante parámetros del pipeline, no constantes replicadas. Las funciones de transformación puras se prueban fuera de los decoradores.",
          "Dev, test y prod ejecutan el mismo código con targets y permisos distintos. Una actualización se valida en un catálogo aislado y con datos representativos antes de promover. El owner revisa event log, lineage y cambios de esquema tras desplegar.",
        ],
        keyPoints: [
          "Configuración cambia por entorno; lógica y artefacto permanecen iguales.",
          "Transformaciones puras son comprobables sin arrancar el pipeline completo.",
          "Nombres, comentarios y propiedades de tabla forman parte del contrato gobernado.",
        ],
        example: {
          language: "Python",
          title: "Configuración de entorno sin duplicar código",
          code: `source_catalog = spark.conf.get("pipelines.source_catalog")
target_catalog = spark.conf.get("pipelines.target_catalog")
lateness = spark.conf.get("pipelines.orders_lateness", "15 minutes")

source_table = f"{source_catalog}.bronze.orders"
target_prefix = f"{target_catalog}.commerce"

assert source_catalog != target_catalog or target_catalog.endswith("_dev")`,
          note: "Aplica permisos y ownership en la configuración de despliegue; una aserción no sustituye las políticas del entorno.",
        },
        pitfalls: [
          "Copiar el pipeline entero para prod y permitir que las versiones diverjan.",
          "Introducir llamadas externas en funciones declarativas y crear resultados no deterministas durante reevaluación.",
        ],
        examDecision: "Para promoción segura, usa un artefacto único parametrizado por entorno y prueba transformaciones puras; no mantengas ramas de código permanentes por workspace.",
        checkpoint: {
          question: "¿Qué debe variar entre dev y prod?",
          answer: "Catálogos, rutas, tamaños, identidades y parámetros; la misma lógica versionada debe promocionarse entre entornos.",
        },
      },
    ],
    lab: {
      title: "Pipeline declarativo de pedidos",
      goal: "Declarar una streaming table bronze, una silver validada y una materialized view gold sin escrituras imperativas dentro de las funciones.",
      scenario: "Pedidos llegan como JSON a un Volume. El equipo necesita ingesta incremental, una tabla silver tipada y métricas diarias que reflejen correcciones upstream con operación administrada.",
      steps: [
        "Crea una streaming table bronze con Auto Loader, metadatos de origen y schema location.",
        "Define una streaming table silver que normalice tipos y descarte filas estructuralmente inválidas.",
        "Define una materialized view diaria por fecha y región.",
        "Parametriza catálogo de entrada y ruta de landing mediante configuración del pipeline.",
        "Actualiza el pipeline dos veces y usa event log/lineage para demostrar dependencias y procesamiento incremental.",
      ],
      starterCode: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

landing = spark.conf.get("pipelines.orders_landing")

# TODO: @dp.table orders_bronze
# TODO: @dp.table orders_silver
# TODO: @dp.materialized_view daily_orders`,
      solution: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

landing = spark.conf.get("pipelines.orders_landing")
schema_location = spark.conf.get("pipelines.orders_schema_location")

@dp.table(
    name="orders_bronze",
    comment="Pedidos JSON crudos con procedencia",
    table_properties={"quality": "bronze"},
)
def orders_bronze():
    return (
        spark.readStream.format("cloudFiles")
          .option("cloudFiles.format", "json")
          .option("cloudFiles.schemaLocation", schema_location)
          .load(landing)
          .withColumn("source_file", F.input_file_name())
          .withColumn("ingested_at", F.current_timestamp())
    )

@dp.table(
    name="orders_silver",
    comment="Pedidos válidos y tipados",
    table_properties={"quality": "silver"},
)
def orders_silver():
    return (
        spark.readStream.table("orders_bronze")
          .withColumn("event_ts", F.to_timestamp("event_ts"))
          .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
          .where(
              F.col("order_id").isNotNull() &
              F.col("event_ts").isNotNull() &
              (F.col("amount") >= 0)
          )
          .select(
              "order_id", "customer_id", "region",
              "event_ts", "amount", "source_file", "ingested_at"
          )
    )

@dp.materialized_view(
    name="daily_orders",
    comment="Métricas diarias por región",
)
def daily_orders():
    return (
        spark.read.table("orders_silver")
          .groupBy(F.to_date("event_ts").alias("order_date"), "region")
          .agg(
              F.countDistinct("order_id").alias("orders"),
              F.sum("amount").alias("revenue"),
          )
    )`,
      checks: [
        { label: "Declara datasets con decoradores", pattern: "@dp\\.(table|materialized_view)" },
        { label: "Usa Auto Loader en bronze", pattern: "cloudFiles" },
        { label: "Lee silver como stream", pattern: "readStream\\.table\\(\"orders_bronze\"\\)" },
        { label: "Crea una materialized view gold", pattern: "@dp\\.materialized_view" },
      ],
      expectedEvidence: [
        "Grafo con `orders_bronze` → `orders_silver` → `daily_orders` y lineage visible.",
        "Primera actualización con archivos procesados y segunda sin duplicar entradas.",
        "Filas de muestra que demuestran tipos silver y agregados diarios.",
        "Consulta del event log con estado de los tres flows y estrategia de actualización observada.",
      ],
      cloudNotes: {
        AWS: "Configura `orders_landing` sobre un Volume/external location en S3 y usa managed file events cuando corresponda; la storage credential debe asumir un IAM role.",
        Azure: "Apunta el Volume a ADLS Gen2 y autoriza una managed identity o service principal; habilita file events compatibles en la external location.",
        GCP: "Usa GCS mediante external location y service account de mínimo privilegio; configura file events administrados cuando estén disponibles para el origen.",
      },
    },
    quiz: [
      {
        question: "Una función decorada llama `saveAsTable` y después devuelve un DataFrame. ¿Qué problema introduce?",
        options: [
          "Ninguno; toda función declarativa debe escribir manualmente",
          "El pipeline pierde Unity Catalog",
          "Mezcla un efecto imperativo con la declaración y dificulta reevaluación/optimización",
          "Convierte automáticamente la tabla en SCD 2",
        ],
        answer: 2,
        explanation: "Las funciones del pipeline deben describir datasets devolviendo DataFrames. El servicio administra escrituras y ejecución.",
        domain: "Spark Declarative Pipelines en Lakeflow · modelo declarativo",
      },
      {
        question: "Gold debe reflejar updates en silver y servir un agregado por cliente ya materializado. ¿Qué objeto encaja?",
        options: [
          "Una materialized view",
          "Un append de archivos sin tabla",
          "Un notebook con `display`",
          "Un checkpoint compartido entre consultas",
        ],
        answer: 0,
        explanation: "La materialized view conserva el resultado y el servicio puede refrescarlo a partir de cambios upstream.",
        domain: "Spark Declarative Pipelines en Lakeflow · materialized views",
      },
      {
        question: "Tres regiones alimentan una misma streaming table con el mismo contrato. ¿Qué diseño evita un `union` monolítico?",
        options: [
          "Tres catálogos sin dependencias",
          "Un full refresh por cada archivo",
          "Tres Jobs que sobrescriben el target",
          "Flows append separados hacia el mismo target",
        ],
        answer: 3,
        explanation: "Múltiples append flows pueden alimentar una streaming table y mantienen separada la operación de cada fuente.",
        domain: "Spark Declarative Pipelines en Lakeflow · flows",
      },
      {
        question: "¿Qué combinación debe mantenerse igual al promover de test a prod?",
        options: [
          "Catálogo, credenciales y capacidad",
          "El artefacto de código y su lógica versionada",
          "Todos los nombres físicos de recursos",
          "La identidad del desarrollador",
        ],
        answer: 1,
        explanation: "Se promociona el mismo artefacto; configuración, identidades, targets y capacidad cambian por entorno.",
        domain: "Spark Declarative Pipelines en Lakeflow · despliegue",
      },
    ],
    sources: [
      {
        label: "Spark Declarative Pipelines flows · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/flows",
        reviewedAt,
      },
      {
        label: "Materialized views · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/materialized-views",
        reviewedAt,
      },
      {
        label: "Spark Declarative Pipelines · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/",
        reviewedAt,
      },
    ],
  },

  m19: {
    lessons: [
      {
        summary: "Las expectations convierten reglas de calidad en métricas y acciones declarativas: observar, descartar o fallar la actualización.",
        deepDive: deepDives.m19l1,
        explanation: [
          "`expect` conserva tanto filas válidas como inválidas y registra métricas; es útil durante adopción o para reglas informativas. `expect_or_drop` elimina las filas que incumplen y permite continuar. `expect_or_fail` detiene el flow y revierte atómicamente la actualización afectada cuando aceptar datos incorrectos sería peor que retrasar publicación.",
          "La acción se elige por impacto y capacidad de remediación, no por severidad nominal. Un `order_id` nulo puede ir a cuarentena si el resto del pipeline debe continuar; una violación de unicidad en un saldo regulado puede justificar fallo. Toda regla necesita owner, definición y umbral operativo.",
        ],
        keyPoints: [
          "`expect` mide sin eliminar; `expect_or_drop` continúa sin la fila; `expect_or_fail` aborta el flow afectado.",
          "Los nombres de expectation deben ser estables y describir el contrato.",
          "Fallar una actualización protege el target, pero puede consumir el presupuesto de frescura.",
        ],
        example: {
          language: "PySpark",
          title: "Tres acciones de calidad diferenciadas",
          code: `from pyspark import pipelines as dp

@dp.table(name="orders_silver")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return spark.readStream.table("orders_bronze")`,
          note: "Aplicar tres acciones al mismo dataset solo es correcto si negocio ha decidido explícitamente el tratamiento de cada violación.",
        },
        pitfalls: [
          "Usar `expect_or_fail` para toda anomalía y convertir una fila reparable en una caída completa del flow.",
          "Usar `expect` para una clave obligatoria y permitir que inválidos lleguen silenciosamente a consumidores.",
        ],
        examDecision: "Observabilidad sin bloquear: `expect`. Filas aislables: `expect_or_drop` más cuarentena. Contrato cuya violación invalida el resultado: `expect_or_fail`.",
        checkpoint: {
          question: "¿Qué acción conserva filas inválidas pero produce métricas?",
          answer: "`expect`; ni descarta la fila ni falla la actualización.",
        },
      },
      {
        summary: "Una cuarentena útil conserva la fila, procedencia, regla incumplida y versión para que pueda corregirse y reprocesarse.",
        deepDive: deepDives.m19l2,
        explanation: [
          "Descartar con una expectation no crea automáticamente una tabla de cuarentena. El patrón explícito clasifica una vista común en salida válida e inválida. La rama inválida añade `failure_reasons`, timestamp, source file u offset y versión de pipeline; la rama válida aplica las mismas condiciones complementarias.",
          "La cuarentena necesita política de acceso porque puede contener PII, retención y un flujo de remediación. Reinyectar datos corregidos directamente en silver salta trazabilidad; conviene publicar una nueva entrada con identidad estable o una tabla de correcciones que pase por las mismas reglas.",
        ],
        keyPoints: [
          "Válidos e inválidos deben derivarse de una única clasificación para evitar huecos.",
          "Cada fila inválida conserva evidencia suficiente para diagnóstico y replay.",
          "La remediación vuelve a entrar por una frontera gobernada y evita doble conteo.",
        ],
        example: {
          language: "PySpark",
          title: "Clasificación con motivos de rechazo",
          code: `from pyspark.sql import functions as F

classified = (
    spark.readStream.table("orders_bronze")
      .withColumn(
          "failure_reasons",
          F.array_compact(F.array(
              F.when(F.col("order_id").isNull(), F.lit("MISSING_ORDER_ID")),
              F.when(F.col("amount") < 0, F.lit("NEGATIVE_AMOUNT")),
              F.when(F.col("event_ts").isNull(), F.lit("INVALID_EVENT_TS")),
          ))
      )
)

valid = classified.where("size(failure_reasons) = 0")
quarantine = classified.where("size(failure_reasons) > 0")`,
          note: "Usa una función compartida para que la condición válida sea exactamente el complemento de la cuarentena.",
        },
        pitfalls: [
          "Definir filtros independientes para válidos e inválidos y dejar filas que no caen en ninguna rama.",
          "Guardar solo un conteo de errores, sin payload ni procedencia para repararlos.",
        ],
        examDecision: "Si el requisito pide investigar o recuperar inválidos, una expectation de drop no basta: materializa una rama de cuarentena con motivos y procedencia.",
        checkpoint: {
          question: "¿Qué propiedad evita perder o duplicar filas entre silver y cuarentena?",
          answer: "Que ambas ramas provengan de una clasificación común y usen condiciones complementarias sobre la misma lista de motivos.",
        },
      },
      {
        summary: "El pipeline event log es la fuente estructurada para progreso, calidad, linaje y errores, y debe consultarse usando campos documentados.",
        deepDive: deepDives.m19l3,
        explanation: [
          "Los eventos `flow_progress` incluyen estado, métricas y `data_quality` dentro de `details`. `origin` identifica pipeline, update y flow. La función `event_log(TABLE(...))` permite consultar el log asociado a una tabla del pipeline desde SQL y construir tendencias por expectation.",
          "No todo campo interno es contrato público. Las consultas operativas seleccionan campos documentados y toleran ausencia de métricas en eventos que no sean de progreso. Conservar `update_id`, nombre de flow y timestamp permite relacionar una caída de calidad con despliegue y lote.",
        ],
        keyPoints: [
          "Filtra `event_type = 'flow_progress'` antes de interpretar métricas de flow.",
          "El JSON `details` se analiza con rutas documentadas y tipos explícitos.",
          "Event log complementa, no sustituye, una reconciliación de negocio.",
        ],
        example: {
          language: "SQL",
          title: "Inspección de calidad en el event log",
          code: `SELECT
  timestamp,
  origin.update_id AS update_id,
  origin.flow_name AS flow_name,
  details:flow_progress.status::STRING AS status,
  details:flow_progress.data_quality:expectations AS expectations
FROM event_log(TABLE(main.silver.orders_silver))
WHERE event_type = 'flow_progress'
ORDER BY timestamp DESC
LIMIT 100;`,
          note: "Normaliza el array de expectations en una vista operativa para calcular tasas por regla y actualización.",
        },
        pitfalls: [
          "Consultar cualquier evento como si contuviera `flow_progress` y generar nulos difíciles de interpretar.",
          "Construir dependencias permanentes sobre campos internos no documentados del JSON.",
        ],
        examDecision: "Para saber cuántas filas violaron una expectation o por qué falló un flow, consulta event log; el historial de Jobs solo indica el resultado de la tarea envolvente.",
        checkpoint: {
          question: "¿Qué evento contiene normalmente las métricas de expectations?",
          answer: "`flow_progress`, dentro de la sección documentada `details.flow_progress.data_quality`.",
        },
      },
      {
        summary: "Un contrato de calidad define dimensión, expresión, acción, umbral, owner y procedimiento de remediación antes de escribir código.",
        deepDive: deepDives.m19l4,
        explanation: [
          "Validez, completitud, unicidad, consistencia, puntualidad y exactitud requieren evidencias diferentes. `amount >= 0` comprueba validez, pero no exactitud frente al sistema de pagos. Una expectation fila a fila tampoco demuestra unicidad global sin una transformación o agregación adecuada.",
          "Las reglas evolucionan como código versionado. Un cambio de umbral debe revisar impacto histórico y despliegue; renombrar una expectation rompe series de métricas. Las reglas críticas pueden agruparse con `expect_all_or_fail`, mientras reglas de observación usan `expect_all` para una configuración compartida.",
        ],
        keyPoints: [
          "Cada expresión debe medir la dimensión que afirma medir.",
          "Acción y umbral forman parte del contrato, no son detalles de implementación.",
          "Nombres estables permiten comparar calidad entre versiones y actualizaciones.",
        ],
        example: {
          language: "Python",
          title: "Diccionario versionable de reglas",
          code: `structural_rules = {
    "order_id_present": "order_id IS NOT NULL",
    "event_ts_present": "event_ts IS NOT NULL",
    "amount_non_negative": "amount >= 0",
}

business_observations = {
    "known_currency": "currency IN ('EUR', 'USD', 'GBP')",
    "reasonable_amount": "amount <= 100000",
}`,
          note: "Agrupar expresiones facilita reutilización, pero documenta por separado la acción y el owner de cada conjunto.",
        },
        pitfalls: [
          "Llamar 'exactitud' a una comprobación de formato que no compara con una fuente autoritativa.",
          "Cambiar nombres de reglas en cada release y perder continuidad del indicador.",
        ],
        examDecision: "Antes de elegir expectation, identifica si la regla es fila a fila, agregada o de reconciliación; no toda dimensión cabe en un predicado SQL por registro.",
        checkpoint: {
          question: "¿Puede `amount >= 0` demostrar que el importe cobrado es exacto?",
          answer: "No; demuestra validez de rango. La exactitud requiere comparar con una fuente autoritativa, como el sistema de pagos.",
        },
      },
      {
        summary: "La operación de calidad convierte métricas del event log en tasas, alertas sostenidas y decisiones de detener, degradar o remediar.",
        deepDive: deepDives.m19l5,
        explanation: [
          "Un conteo absoluto de inválidos confunde crecimiento de volumen con degradación. La tasa `failed / (passed + failed)` por expectation, flow y ventana permite comparar. Para reglas críticas, una sola violación puede fallar; para calidad gradual, un umbral sostenido durante varias actualizaciones evita ruido.",
          "La alerta incluye filas de muestra seguras, enlace al update y owner. Si la tasa aumenta después de un despliegue, se decide rollback; si procede de un productor concreto, se aísla por `source_system`. La remediación se verifica con el mismo indicador hasta cerrar el incidente.",
        ],
        keyPoints: [
          "Normaliza por volumen y conserva numerador/denominador.",
          "Segmenta por fuente o versión para localizar el origen de una regresión.",
          "Una alerta se cierra cuando el indicador y los datos reparados vuelven al objetivo.",
        ],
        example: {
          language: "SQL",
          title: "Tasa de violación por regla",
          code: `SELECT
  window_start,
  flow_name,
  expectation_name,
  failed_records,
  passed_records,
  failed_records / NULLIF(failed_records + passed_records, 0) AS failure_rate
FROM main.ops.pipeline_expectation_metrics
WHERE window_start >= current_timestamp() - INTERVAL 24 HOURS
ORDER BY failure_rate DESC;`,
          note: "Define el umbral y la duración mínima de incumplimiento en el runbook, no dentro de una consulta ad hoc.",
        },
        pitfalls: [
          "Alertar solo por conteo y generar falsos positivos cuando el volumen crece.",
          "Mostrar payload con PII en la notificación en vez de enlazar a una vista restringida.",
        ],
        examDecision: "Para una alerta de calidad operable, usa tasa por regla y ventana, segmentación de origen y owner; una captura manual del UI no es monitorización.",
        checkpoint: {
          question: "¿Por qué es mejor alertar por tasa que solo por número de fallos?",
          answer: "Porque relaciona fallos con volumen total y permite distinguir crecimiento normal de una degradación proporcional real.",
        },
      },
    ],
    lab: {
      title: "Expectations, cuarentena y dashboard de calidad",
      goal: "Implementar acciones de calidad diferenciadas, una cuarentena trazable y una consulta del event log que calcule tasas por regla.",
      scenario: "El pipeline de pedidos recibe nulos, importes negativos y monedas nuevas. Finanzas exige bloquear importes negativos; operaciones quiere aislar IDs ausentes y observar monedas desconocidas sin detener toda la publicación.",
      steps: [
        "Clasifica cada regla como observación, descarte/cuarentena o fallo atómico y documenta el motivo.",
        "Construye una vista clasificada con `failure_reasons` y dos tablas complementarias: válidos y cuarentena.",
        "Aplica expectations con nombres estables a la tabla válida.",
        "Ejecuta datos de prueba para cada regla y confirma la acción esperada.",
        "Consulta el event log, extrae métricas por expectation y calcula tasas por update.",
      ],
      starterCode: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

rules = {
    "valid_order_id": "order_id IS NOT NULL",
    "non_negative_amount": "amount >= 0",
    "known_currency": "currency IN ('EUR', 'USD', 'GBP')",
}

# TODO: clasifica, crea orders_silver y orders_quarantine, y aplica acciones.`,
      solution: `from pyspark import pipelines as dp
from pyspark.sql import functions as F

@dp.temporary_view(name="orders_classified")
def orders_classified():
    return (
        spark.readStream.table("orders_bronze")
          .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
          .withColumn(
              "failure_reasons",
              F.array_compact(F.array(
                  F.when(F.col("order_id").isNull(), F.lit("MISSING_ORDER_ID")),
                  F.when(F.col("event_ts").isNull(), F.lit("INVALID_EVENT_TS")),
              ))
          )
    )

@dp.table(name="orders_quarantine", comment="Pedidos reparables rechazados")
def orders_quarantine():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) > 0")
          .withColumn("quarantined_at", F.current_timestamp())
          .withColumn("pipeline_version", F.lit("m19-v1"))
    )

@dp.table(name="orders_silver", comment="Pedidos válidos para consumo")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) = 0")
          .drop("failure_reasons")
    )

# Consulta después de actualizar el pipeline:
# SELECT timestamp, origin.flow_name,
#        details:flow_progress.data_quality:expectations AS expectations
# FROM event_log(TABLE(main.silver.orders_silver))
# WHERE event_type = 'flow_progress';`,
      checks: [
        { label: "Crea una cuarentena explícita", pattern: "orders_quarantine" },
        { label: "Observa una regla sin descartar", pattern: "@dp\\.expect\\(" },
        { label: "Falla ante la regla crítica", pattern: "@dp\\.expect_or_fail" },
        { label: "Incluye consulta del event log", pattern: "event_log\\(TABLE" },
      ],
      expectedEvidence: [
        "Matriz regla → dimensión → acción → owner → procedimiento de remediación.",
        "Filas de cuarentena con `failure_reasons`, procedencia y versión.",
        "Prueba de que una moneda desconocida se publica y mide, mientras un importe negativo falla el flow.",
        "Consulta de event log con métricas por expectation y tasa calculada por update.",
      ],
      cloudNotes: {
        AWS: "Restringe la tabla de cuarentena con Unity Catalog y, si expone muestras mediante alertas en AWS, evita enviar payload sensible a SNS/CloudWatch logs.",
        Azure: "Aplica permisos separados sobre cuarentena y usa Key Vault/managed identity para integraciones de alertas; no copies PII en notificaciones de Azure Monitor.",
        GCP: "Usa service accounts distintas para operación y consumo, limita acceso a cuarentena y envía solo identificadores no sensibles a Cloud Monitoring/Pub/Sub.",
      },
    },
    quiz: [
      {
        question: "Una regla de moneda nueva debe medirse durante dos semanas sin bloquear ni eliminar pedidos. ¿Qué acción corresponde?",
        options: [
          "`expect_or_fail`",
          "`expect`",
          "`expect_or_drop` sin cuarentena",
          "Borrar el event log",
        ],
        answer: 1,
        explanation: "`expect` conserva registros y produce métricas, adecuado para observar impacto antes de endurecer el contrato.",
        domain: "Lakeflow pipelines · expectations",
      },
      {
        question: "Operaciones necesita corregir y reinyectar pedidos sin `order_id`. ¿Qué diseño aporta evidencia suficiente?",
        options: [
          "Una tabla de cuarentena con payload, motivo, procedencia y versión",
          "Un contador de filas descartadas sin datos",
          "`expect_or_drop` y ningún registro adicional",
          "Un screenshot del pipeline una vez al mes",
        ],
        answer: 0,
        explanation: "La remediación requiere conservar la fila y su origen, además de una razón estable que guíe la corrección.",
        domain: "Data quality · cuarentena",
      },
      {
        question: "¿Dónde se encuentran las métricas estructuradas de una expectation durante una actualización?",
        options: [
          "Solo en Spark UI del driver",
          "En el nombre físico del checkpoint",
          "En el pipeline event log, dentro de eventos `flow_progress`",
          "En `VACUUM` history únicamente",
        ],
        answer: 2,
        explanation: "El event log registra progreso y `data_quality` por flow/update y puede consultarse desde SQL.",
        domain: "Lakeflow pipelines · event log",
      },
      {
        question: "Los fallos pasan de 100 a 150, pero el volumen crece de 10.000 a 100.000. ¿Qué indicador evita concluir erróneamente que la calidad empeoró?",
        options: [
          "El número de workers",
          "La versión de Photon",
          "El tamaño de cada archivo",
          "La tasa de fallos sobre registros evaluados",
        ],
        answer: 3,
        explanation: "La tasa cae del 1% al 0,15%; el conteo absoluto por sí solo ocultaría la mejora proporcional.",
        domain: "Data quality · observabilidad",
      },
    ],
    sources: [
      {
        label: "Manage data quality with pipeline expectations · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/expectations",
        reviewedAt,
      },
      {
        label: "Pipeline event log schema · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-log-schema",
        reviewedAt,
      },
      {
        label: "Monitor Lakeflow pipelines event logs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-logs",
        reviewedAt,
      },
    ],
  },

  m20: {
    lessons: [
      {
        summary: "El DAG de Lakeflow Jobs expresa dependencias de ejecución y permite paralelismo solo cuando tareas y datos son realmente independientes.",
        deepDive: deepDives.m20l1,
        explanation: [
          "Cada task tiene una responsabilidad, parámetros y resultado observable. Dos ingestas regionales pueden ejecutarse en paralelo si escriben particiones o targets independientes; la publicación gold depende de ambas. Introducir dependencias innecesarias alarga el critical path, pero eliminar una dependencia de datos crea carreras.",
          "El DAG no debe ocultar lógica de transformación dentro de docenas de notebooks. Jobs coordina unidades desplegables —pipeline, wheel, SQL o notebook— y las tareas comparten información mediante parámetros, task values o outputs, no variables de memoria del driver.",
        ],
        keyPoints: [
          "Dependencias representan requisitos de datos/estado, no preferencia visual.",
          "Tareas independientes pueden usar compute y retries separados.",
          "El critical path determina la latencia mínima del workflow.",
        ],
        example: {
          language: "YAML",
          title: "Paralelismo y convergencia explícitos",
          code: `tasks:
  - task_key: ingest_eu
    python_wheel_task:
      package_name: commerce
      entry_point: ingest
  - task_key: ingest_us
    python_wheel_task:
      package_name: commerce
      entry_point: ingest
  - task_key: publish_gold
    depends_on:
      - task_key: ingest_eu
      - task_key: ingest_us
    pipeline_task:
      pipeline_id: \${resources.pipelines.orders.id}`,
          note: "En el bundle real usa la sintaxis de sustitución `${resources.pipelines.orders.id}`; aquí se escapa el signo para mantener el ejemplo como texto.",
        },
        pitfalls: [
          "Serializar tareas independientes y aumentar tiempo/coste sin mejorar corrección.",
          "Ejecutar en paralelo tareas que sobrescriben el mismo rango de la tabla.",
        ],
        examDecision: "Añade una dependencia solo si existe una precondición real; para ramas independientes, paraleliza y converge en una tarea downstream.",
        checkpoint: {
          question: "¿Qué determina el critical path de un Job?",
          answer: "La cadena dependiente de mayor duración; acelerar una tarea fuera de esa cadena no reduce necesariamente el tiempo total.",
        },
      },
      {
        summary: "Job parameters, task values y referencias dinámicas trasladan contexto entre tareas sin acoplarlas a estado de notebook.",
        deepDive: deepDives.m20l2,
        explanation: [
          "Los job parameters describen entradas del run y se propagan a tareas compatibles. Una tarea puede publicar un valor pequeño mediante `dbutils.jobs.taskValues.set`; downstream lo referencia como `{{tasks.<task>.values.<key>}}`. Las referencias se sustituyen como texto, no evalúan expresiones.",
          "Los task values sirven para contadores, rutas o listas pequeñas, no para transportar DataFrames. Los datos voluminosos se materializan en tablas/Volumes y se pasa un identificador. Un nombre mal escrito puede tratarse como literal, así que la validación del bundle y una prueba smoke son esenciales.",
        ],
        keyPoints: [
          "Job parameter identifica el run; task value comunica un resultado pequeño de upstream.",
          "Referencias dinámicas usan doble llave y no ejecutan código.",
          "Datos grandes se comparten mediante almacenamiento gobernado, no mediante valores del DAG.",
        ],
        example: {
          language: "Python",
          title: "Publicación de evidencia para una condición",
          code: `invalid_rows = spark.table("main.ops.validation_results").where(
    "run_id = :run_id AND is_valid = false"
).count()

total_rows = spark.table("main.ops.validation_results").where(
    "run_id = :run_id"
).count()

ratio = invalid_rows / total_rows if total_rows else 1.0
dbutils.jobs.taskValues.set(key="invalid_ratio", value=ratio)`,
          note: "El downstream referencia `{{tasks.validate.values.invalid_ratio}}`; conserva el detalle de filas en una tabla, no en el task value.",
        },
        pitfalls: [
          "Pasar miles de filas como JSON en un task value y alcanzar límites de tamaño.",
          "Usar una referencia dinámica inexistente y no detectar que quedó como texto literal.",
        ],
        examDecision: "Para un escalar calculado por upstream usa task value; para entrada del run usa job parameter; para datasets usa una tabla o Volume.",
        checkpoint: {
          question: "¿Cómo consume downstream el valor `invalid_ratio` publicado por `validate`?",
          answer: "Mediante la referencia dinámica `{{tasks.validate.values.invalid_ratio}}` en un campo o parámetro compatible.",
        },
      },
      {
        summary: "If/else decide por un valor; Run if decide por el estado de tareas upstream y ambos resuelven problemas distintos.",
        deepDive: deepDives.m20l3,
        explanation: [
          "Una If/else task compara parámetros, valores dinámicos o task values con operadores como `>`, `==` o `!=`. Por ejemplo, publica si `invalid_ratio <= 0.01` y envía a cuarentena en caso contrario. Las tareas de cada rama declaran el outcome requerido.",
          "`Run if` se configura sobre una dependencia para ejecutar limpieza, notificación o recuperación según estados como `ALL_SUCCESS`, `AT_LEAST_ONE_FAILED` o `ALL_DONE`. No se debe codificar un valor de negocio como estado de tarea ni usar If/else para saber si upstream lanzó una excepción.",
        ],
        keyPoints: [
          "If/else evalúa datos o parámetros; Run if evalúa resultado de ejecución.",
          "Una tarea de cleanup suele usar `ALL_DONE` para ejecutarse incluso tras fallos.",
          "Las ramas deben converger con condiciones que acepten outcomes esperados.",
        ],
        example: {
          language: "JSON",
          title: "Condición basada en calidad",
          code: `{
  "task_key": "quality_gate",
  "depends_on": [{"task_key": "validate"}],
  "condition_task": {
    "op": "LESS_THAN_OR_EQUAL",
    "left": "{{tasks.validate.values.invalid_ratio}}",
    "right": "0.01"
  }
}`,
          note: "Las tareas downstream de publicación o cuarentena dependen de `quality_gate` con el outcome true o false correspondiente.",
        },
        pitfalls: [
          "Usar If/else para capturar fallos técnicos cuando `Run if` ya modela estados de upstream.",
          "Olvidar una rama o convergencia y dejar el Job aparentemente correcto pero incompleto.",
        ],
        examDecision: "Valor calculado determina ruta: If/else. Éxito, fallo o finalización upstream determina ruta: Run if.",
        checkpoint: {
          question: "¿Qué condición usarías para liberar un recurso tanto si upstream tuvo éxito como si falló?",
          answer: "Una dependencia con Run if `ALL_DONE`, no una comparación If/else de un task value.",
        },
      },
      {
        summary: "For each ejecuta una tarea anidada por elemento con concurrencia limitada y exige que cada iteración sea aislable e idempotente.",
        deepDive: deepDives.m20l4,
        explanation: [
          "La lista puede venir de un job parameter, task value o salida SQL y cada elemento se referencia con `{{input...}}`. Procesar regiones o fechas en paralelo reduce latencia, pero la concurrencia debe respetar límites del sistema origen, compute y destino.",
          "Cada iteración escribe una partición o clave independiente. Si todas hacen `overwrite` de la tabla completa, el loop crea carreras. Para miles de elementos, agrupar en rangos o usar una transformación Spark distribuida suele ser mejor que crear miles de task runs.",
        ],
        keyPoints: [
          "For each contiene exactamente una tarea anidada que recibe el elemento actual.",
          "Concurrency limita iteraciones simultáneas y protege dependencias externas.",
          "El cuerpo debe poder reintentarse por elemento sin duplicar efectos.",
        ],
        example: {
          language: "JSON",
          title: "Procesamiento regional acotado",
          code: `{
  "task_key": "process_regions",
  "for_each_task": {
    "inputs": "{{tasks.discover.values.regions}}",
    "concurrency": 4,
    "task": {
      "task_key": "process_region",
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/process_region",
        "base_parameters": {"region": "{{input}}"}
      }
    }
  }
}`,
          note: "`regions` debe ser JSON válido y pequeño; el notebook escribe solo el rango de la región recibida.",
        },
        pitfalls: [
          "Configurar concurrencia igual al número de elementos y saturar la API o base fuente.",
          "Usar For each para millones de filas que Spark puede procesar en un único DataFrame distribuido.",
        ],
        examDecision: "Usa For each para una colección moderada de unidades operativas; usa Spark para paralelismo por filas y limita concurrency según el sistema más restrictivo.",
        checkpoint: {
          question: "¿Qué hace segura una reparación parcial de un For each?",
          answer: "Que cada iteración esté aislada por clave/rango y sea idempotente, de modo que reintentar solo las fallidas no corrompa las exitosas.",
        },
      },
      {
        summary: "Retries corrigen fallos transitorios de una tarea; repair runs reejecutan el subconjunto fallido tras corregir la causa sin repetir trabajo exitoso.",
        deepDive: deepDives.m20l5,
        explanation: [
          "Una retry policy limita intentos e intervalo y debe reservarse para fallos plausiblemente transitorios. Reintentar una violación de esquema determinista solo consume tiempo. Las tareas con efectos deben ser idempotentes porque tanto retry como repair pueden ejecutarlas de nuevo.",
          "Un repair run mantiene el contexto del run original y permite reejecutar tareas fallidas o omitidas, con parámetros corregidos cuando corresponda. Antes de reparar se inspecciona error, input y versión; después se valida el resultado downstream. Una nueva ejecución completa es preferible si cambió el alcance o no puede garantizarse coherencia con tareas exitosas anteriores.",
        ],
        keyPoints: [
          "Retry es automática y cercana al fallo; repair es una decisión sobre una ejecución existente.",
          "No todos los errores son transitorios ni deben reintentarse.",
          "Idempotencia permite reejecutar una tarea sin duplicar o retroceder estado.",
        ],
        example: {
          language: "YAML",
          title: "Política de retry limitada",
          code: `task_key: ingest_partner_api
max_retries: 3
min_retry_interval_millis: 60000
retry_on_timeout: true
timeout_seconds: 1800
python_wheel_task:
  package_name: commerce
  entry_point: ingest_partner`,
          note: "El código debe escribir con una clave de petición o `MERGE`; tres reintentos de un append no idempotente pueden triplicar datos.",
        },
        pitfalls: [
          "Configurar retries ilimitados para un error de datos permanente y ocultar el incidente.",
          "Reparar downstream con parámetros distintos sin verificar que los outputs upstream exitosos siguen siendo compatibles.",
        ],
        examDecision: "Fallo transitorio: retry acotado. Causa corregida dentro del mismo run: repair. Cambio de alcance o outputs incompatibles: nuevo run controlado.",
        checkpoint: {
          question: "¿Por qué una tarea que soporta retries debe ser idempotente?",
          answer: "Porque puede haber producido parte o todo el efecto antes de fallar y la siguiente ejecución no debe duplicarlo.",
        },
      },
    ],
    lab: {
      title: "Job con quality gate, For each y reparación segura",
      goal: "Diseñar un DAG que descubra regiones, procese cada una con concurrencia limitada, condicione publicación por calidad y permita reparar solo fallos.",
      scenario: "Cada día deben procesarse regiones activas. Una API solo admite cuatro llamadas simultáneas. Si más del 1% de filas es inválido, no se publica gold; limpieza y notificación deben ejecutarse aunque falle una rama.",
      steps: [
        "Define tareas `discover_regions`, `process_regions`, `validate`, `quality_gate`, `publish`, `quarantine` y `cleanup`.",
        "Publica la lista de regiones y la tasa inválida como task values pequeños.",
        "Configura For each con concurrencia cuatro y una tarea idempotente por región.",
        "Usa If/else para el umbral de calidad y Run if para cleanup/notificación.",
        "Inyecta un fallo transitorio en una región, repáralo y demuestra que las exitosas no se duplican.",
      ],
      starterCode: `{
  "name": "regional_orders",
  "tasks": [
    {"task_key": "discover_regions"},
    {"task_key": "process_regions"},
    {"task_key": "validate"},
    {"task_key": "quality_gate"}
  ]
}`,
      solution: `{
  "name": "regional_orders",
  "max_concurrent_runs": 1,
  "parameters": [
    {"name": "process_date", "default": "{{job.start_time.iso_date}}"}
  ],
  "tasks": [
    {
      "task_key": "discover_regions",
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/discover_regions"
      }
    },
    {
      "task_key": "process_regions",
      "depends_on": [{"task_key": "discover_regions"}],
      "for_each_task": {
        "inputs": "{{tasks.discover_regions.values.regions}}",
        "concurrency": 4,
        "task": {
          "task_key": "process_region",
          "max_retries": 2,
          "min_retry_interval_millis": 60000,
          "notebook_task": {
            "notebook_path": "/Workspace/commerce/process_region",
            "base_parameters": {
              "region": "{{input}}",
              "process_date": "{{job.parameters.process_date}}"
            }
          }
        }
      }
    },
    {
      "task_key": "validate",
      "depends_on": [{"task_key": "process_regions"}],
      "notebook_task": {
        "notebook_path": "/Workspace/commerce/validate"
      }
    },
    {
      "task_key": "quality_gate",
      "depends_on": [{"task_key": "validate"}],
      "condition_task": {
        "op": "LESS_THAN_OR_EQUAL",
        "left": "{{tasks.validate.values.invalid_ratio}}",
        "right": "0.01"
      }
    },
    {
      "task_key": "publish",
      "depends_on": [{"task_key": "quality_gate", "outcome": "true"}],
      "notebook_task": {"notebook_path": "/Workspace/commerce/publish"}
    },
    {
      "task_key": "quarantine",
      "depends_on": [{"task_key": "quality_gate", "outcome": "false"}],
      "notebook_task": {"notebook_path": "/Workspace/commerce/quarantine"}
    },
    {
      "task_key": "cleanup",
      "depends_on": [
        {"task_key": "publish"},
        {"task_key": "quarantine"}
      ],
      "run_if": "ALL_DONE",
      "notebook_task": {"notebook_path": "/Workspace/commerce/cleanup"}
    }
  ]
}`,
      checks: [
        { label: "Incluye un For each", pattern: "for_each_task" },
        { label: "Limita concurrencia a cuatro", pattern: "\"concurrency\"\\s*:\\s*4" },
        { label: "Usa una If/else task", pattern: "condition_task" },
        { label: "Ejecuta cleanup tras cualquier resultado", pattern: "\"run_if\"\\s*:\\s*\"ALL_DONE\"" },
      ],
      expectedEvidence: [
        "Diagrama del DAG con ramas true/false y convergencia de cleanup.",
        "Task values publicados y referencia dinámica resuelta en el run.",
        "Máximo de cuatro iteraciones regionales simultáneas observado.",
        "Repair run que reejecuta la región fallida sin cambiar conteos de regiones exitosas.",
      ],
      cloudNotes: {
        AWS: "Si cada iteración llama una API o RDS en AWS, limita concurrency según quotas y conexiones; usa IAM roles/Secrets Manager mediante integración aprobada, no credenciales en parámetros.",
        Azure: "Alinea concurrency con límites de Azure SQL/API Management y usa managed identity/Key Vault; registra throttling 429 como fallo transitorio con backoff.",
        GCP: "Respeta quotas de Cloud SQL o APIs, usa service accounts y Secret Manager; configura retry solo para códigos transitorios y conserva claves idempotentes.",
      },
    },
    quiz: [
      {
        question: "Una tarea de limpieza debe ejecutarse incluso si cualquiera de dos ramas falla. ¿Qué condición corresponde?",
        options: [
          "If/else sobre el número de filas",
          "Run if `ALL_DONE`",
          "Run if `ALL_SUCCESS`",
          "Un trigger continuo independiente",
        ],
        answer: 1,
        explanation: "`ALL_DONE` evalúa estados upstream y permite cleanup después de éxito o fallo.",
        domain: "Lakeflow Jobs · control flow",
      },
      {
        question: "Una API admite como máximo cuatro peticiones simultáneas y hay 30 regiones. ¿Qué diseño es adecuado?",
        options: [
          "Un For each con concurrency 4 y cuerpo idempotente",
          "Treinta Jobs sin límite de concurrencia",
          "Un loop Python en el driver sin tareas",
          "Un `maxOffsetsPerTrigger` Kafka",
        ],
        answer: 0,
        explanation: "For each modela unidades operativas y su concurrency protege el límite externo.",
        domain: "Lakeflow Jobs · For each",
      },
      {
        question: "La tasa inválida calculada por `validate` decide si publicar. ¿Cómo se transmite mejor?",
        options: [
          "Copiando el DataFrame completo en un widget",
          "Con una variable global del notebook upstream",
          "Escribiéndola en el nombre del cluster",
          "Como task value referenciado por la If/else task",
        ],
        answer: 3,
        explanation: "Es un escalar pequeño producido por upstream, caso natural para `taskValues` y referencia dinámica.",
        domain: "Lakeflow Jobs · parámetros y task values",
      },
      {
        question: "Una tarea falló por timeout después de que las demás regiones terminaran. Se corrige la cuota y se quiere conservar el run. ¿Qué acción minimiza repetición?",
        options: [
          "Borrar todas las tablas y lanzar un Job distinto",
          "Aumentar retries infinitamente",
          "Reparar el run reejecutando el subconjunto fallido, verificando idempotencia",
          "Marcar manualmente la tarea como success",
        ],
        answer: 2,
        explanation: "Un repair run conserva contexto y reejecuta tareas fallidas/omitidas; la idempotencia protege frente a efectos parciales.",
        domain: "Lakeflow Jobs · repairs",
      },
    ],
    sources: [
      {
        label: "Control the flow of tasks within Lakeflow Jobs · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/control-flow",
        reviewedAt,
      },
      {
        label: "Dynamic value references · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/dynamic-value-references",
        reviewedAt,
      },
      {
        label: "Troubleshoot and repair job failures · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/repair-job-failures",
        reviewedAt,
      },
    ],
  },

  m21: {
    lessons: [
      {
        summary: "Un trigger se elige por la señal real de disponibilidad: calendario para obligaciones temporales, evento para llegadas irregulares y ejecución continua para servicios siempre activos.",
        deepDive: deepDives.m21l1,
        explanation: [
          "Un schedule es apropiado cuando el negocio define un corte, por ejemplo cerrar ventas a las 06:00 Europe/Madrid aunque no haya archivos. La zona horaria debe ser explícita y los cambios DST pueden producir intervalos irregulares; UTC simplifica cadencia técnica, pero quizá no coincide con el día de negocio.",
          "Un trigger por archivo o tabla evita polling y runs vacíos cuando la llegada es irregular. Sin embargo, un evento indica que hubo un cambio, no que un lote multiarchivo esté completo. El pipeline conserva idempotencia y consulta su propia frontera de datos en vez de asumir que cada trigger corresponde a un único lote.",
        ],
        keyPoints: [
          "Schedule expresa tiempo; file/table update expresa disponibilidad observada.",
          "Zona horaria y DST forman parte del contrato de un calendario.",
          "Todo trigger puede coalescer o repetir señales; la tarea sigue siendo idempotente.",
        ],
        example: {
          language: "YAML",
          title: "Schedule con zona y pausa inicial",
          code: `schedule:
  quartz_cron_expression: "0 0 6 * * ?"
  timezone_id: "Europe/Madrid"
  pause_status: "PAUSED"`,
          note: "Despliega el trigger pausado en producción, valida parámetros y permisos, y actívalo mediante el proceso de cambio aprobado.",
        },
        pitfalls: [
          "Usar la zona local por defecto y descubrir que el Job cambia de hora alrededor de DST.",
          "Programar cada minuto una fuente que entrega un lote diario y generar 1.439 ejecuciones vacías.",
        ],
        examDecision: "Obligación a una hora: schedule. Llegada irregular gobernada: file/table trigger. Servicio que debe reiniciar al acabar o fallar: continuous, evaluando coste y semántica.",
        checkpoint: {
          question: "¿Por qué UTC no siempre puede sustituir la zona de negocio en un cierre diario?",
          answer: "Porque el día local puede cambiar de offset con DST y el requisito suele referirse a una hora/calendario local, no a una hora UTC fija.",
        },
      },
      {
        summary: "File arrival monitoriza una external location o Volume de Unity Catalog y usa cooldown/debounce para convertir múltiples archivos en runs controlados.",
        deepDive: deepDives.m21l2,
        explanation: [
          "El trigger observa una raíz o subruta y comprueba recursivamente nuevas llegadas. Con managed file events en la external location, Databricks aprovecha notificaciones del proveedor y reduce listing. El Job necesita permisos de lectura sobre la ubicación y administración del Job.",
          "`wait_after_last_change_seconds` implementa debounce: espera un periodo sin cambios para agrupar un lote. `min_time_between_triggers_seconds` limita frecuencia. Ninguno garantiza completitud absoluta; productores serios publican un manifiesto o marcador y el código valida conteos antes de promover.",
        ],
        keyPoints: [
          "La ruta debe estar gobernada por Unity Catalog como external location o Volume.",
          "Debounce agrupa ráfagas; cooldown limita runs consecutivos.",
          "File events mejoran descubrimiento, pero la idempotencia sigue residiendo en el pipeline.",
        ],
        example: {
          language: "JSON",
          title: "Trigger de llegada con debounce",
          code: `{
  "trigger": {
    "file_arrival": {
      "url": "/Volumes/main/landing/orders/",
      "min_time_between_triggers_seconds": 900,
      "wait_after_last_change_seconds": 60
    }
  }
}`,
          note: "El ejemplo espera 60 segundos de calma y no crea runs con menos de 15 minutos de separación.",
        },
        pitfalls: [
          "Apuntar a una ruta no gobernada o sin permisos y asumir que el trigger hereda credenciales del notebook.",
          "Tratar el primer archivo como prueba de lote completo cuando el productor publica decenas durante varios minutos.",
        ],
        examDecision: "Para archivos irregulares en UC usa file arrival; configura debounce según patrón de lote y verifica completitud mediante manifiesto si el origen lo ofrece.",
        checkpoint: {
          question: "¿Qué diferencia hay entre cooldown y debounce?",
          answer: "Cooldown limita la frecuencia máxima de runs; debounce espera silencio tras el último cambio para agrupar una ráfaga antes de iniciar.",
        },
      },
      {
        summary: "Table update inicia un Job cuando cambian tablas Unity Catalog y entrega la lista actualizada como referencia dinámica para procesamiento selectivo.",
        deepDive: deepDives.m21l3,
        explanation: [
          "Es útil cuando una publicación Delta upstream es la señal autoritativa y no interesa observar archivos físicos. El trigger puede monitorizar una o varias tablas y el downstream consulta `{{job.trigger.table_update.updated_tables}}` para saber cuáles cambiaron desde el run anterior.",
          "La señal no debe convertirse en lógica frágil por tabla sin fallback. Un Job puede recibir varias actualizaciones coalescidas y debe leer el estado confirmado de cada tabla. Si se requiere orden transaccional entre varias tablas, un trigger separado no crea esa transacción; se necesita un marcador de publicación o una capa coordinadora.",
        ],
        keyPoints: [
          "Table update reacciona al objeto gobernado, no a su implementación de archivos.",
          "La lista de tablas actualizadas está disponible mediante dynamic value reference.",
          "Una notificación puede representar varios cambios y no sustituye un contrato de consistencia multitabla.",
        ],
        example: {
          language: "JSON",
          title: "Paso de tablas actualizadas a una tarea",
          code: `{
  "task_key": "refresh_consumers",
  "notebook_task": {
    "notebook_path": "/Workspace/commerce/refresh_consumers",
    "base_parameters": {
      "updated_tables": "{{job.trigger.table_update.updated_tables}}",
      "trigger_type": "{{job.trigger.type}}"
    }
  }
}`,
          note: "El notebook debe validar el JSON y ser capaz de actualizar todas las tablas relevantes aunque varias aparezcan en el mismo run.",
        },
        pitfalls: [
          "Monitorizar archivos de una tabla Delta y disparar antes de que el commit sea visible.",
          "Suponer que una señal por cada tabla ofrece una snapshot consistente entre varias tablas relacionadas.",
        ],
        examDecision: "Si el consumidor depende de commits de tablas UC, usa table update; si depende de archivos de landing aún no convertidos en tabla, usa file arrival.",
        checkpoint: {
          question: "¿Qué ventaja tiene table update sobre observar archivos internos Delta?",
          answer: "Reacciona al commit gobernado de la tabla y evita depender de detalles físicos que pueden cambiar o aparecer antes de una publicación consistente.",
        },
      },
      {
        summary: "Concurrencia, queueing, timeouts y notificaciones determinan cómo responde el Job cuando llegan triggers más rápido de lo que termina el trabajo.",
        deepDive: deepDives.m21l4,
        explanation: [
          "Por defecto, un Job suele admitir un run activo. Aumentar `max_concurrent_runs` puede reducir espera, pero solo si runs simultáneos escriben rangos aislados. Si no, aparecen carreras y sobrecarga. Queueing conserva runs cuando no hay capacidad; omitirlo o superar límites puede producir skips.",
          "Continuous inicia otro run al completar o fallar el anterior y aplica reintentos/backoff propios. Es adecuado para servicios siempre activos, no para un batch que espera datos. Las notificaciones se configuran para fallo, duración o atraso y deben incluir owner y contexto sin secretos.",
        ],
        keyPoints: [
          "Más concurrencia solo es segura con entradas y efectos aislables.",
          "Queueing gestiona presión del planificador; no corrige un Job más lento que la llegada indefinidamente.",
          "Timeout y alertas delimitan fallos colgados y protegen el SLO.",
        ],
        example: {
          language: "YAML",
          title: "Guardrails de ejecución",
          code: `max_concurrent_runs: 1
queue:
  enabled: true
timeout_seconds: 7200
email_notifications:
  on_failure:
    - data-platform-oncall@example.invalid
  on_duration_warning_threshold_exceeded:
    - data-platform-oncall@example.invalid`,
          note: "La dirección `.invalid` es deliberadamente ficticia; reemplázala por un destino gestionado del entorno.",
        },
        pitfalls: [
          "Aumentar concurrencia para reducir cola mientras todos los runs sobrescriben la misma partición.",
          "Usar continuous para una fuente ociosa y pagar reinicios/compute sin mejorar frescura.",
        ],
        examDecision: "Si se acumulan triggers, primero mide duración y aislamiento. Usa queueing para picos; aumenta concurrencia solo si las escrituras son independientes.",
        checkpoint: {
          question: "¿Cuándo es seguro permitir varios runs concurrentes del mismo Job?",
          answer: "Cuando cada run procesa rangos/targets independientes o las escrituras son transaccionales e idempotentes bajo concurrencia demostrada.",
        },
      },
      {
        summary: "Un backfill reutiliza el mismo Job parametrizado que producción para ejecutar intervalos históricos, con concurrencia y publicación controladas.",
        deepDive: deepDives.m21l5,
        explanation: [
          "Lakeflow Jobs puede generar múltiples runs para un rango e intervalo y pasar parámetros de backfill. El código usa `process_date` o límites temporales explícitos y escribe idempotentemente la partición correspondiente. Mantener una ruta de código distinta para históricos provoca divergencia justo cuando más se necesita fiabilidad.",
          "Antes de lanzar noventa días se calcula número de runs, volumen, coste, capacidad de origen y colisión con producción. Puede reducirse concurrency, escribir en una tabla sombra y promover por lotes. La validación compara conteos y totales por día, y el rollback conoce exactamente qué particiones tocó.",
        ],
        keyPoints: [
          "Backfill y ejecución ordinaria comparten artefacto y contrato.",
          "Parámetros temporales deben ser explícitos y usar límites no solapados.",
          "Coste, concurrencia y reconciliación se estiman antes de crear cientos de runs.",
        ],
        example: {
          language: "SQL",
          title: "Transformación idempotente por fecha",
          code: `MERGE INTO main.silver.orders_daily AS target
USING (
  SELECT *
  FROM main.bronze.orders
  WHERE event_date = :process_date
) AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;`,
          note: "El parámetro del run delimita el rango, mientras `MERGE` permite reintentar el mismo día sin duplicar claves.",
        },
        pitfalls: [
          "Crear un notebook especial para backfill que ya no comparte validaciones ni lógica de producción.",
          "Lanzar todos los días con máxima concurrencia y degradar el workload diario o la fuente.",
        ],
        examDecision: "Para reparar historia, usa backfill del mismo Job con parámetros y escrituras idempotentes; no copies código ni ejecutes un overwrite global.",
        checkpoint: {
          question: "¿Qué evita que reintentar un día de backfill duplique filas?",
          answer: "Una frontera temporal no solapada y una escritura idempotente, por ejemplo `MERGE` por la clave de negocio.",
        },
      },
    ],
    lab: {
      title: "Trigger por archivos y backfill de 90 días",
      goal: "Configurar una operación que agrupe llegadas irregulares, evite runs superpuestos y reutilice el mismo Job para un backfill idempotente.",
      scenario: "Un proveedor entrega entre 10 y 80 archivos por lote, sin horario fijo y durante ráfagas de hasta 45 segundos. Faltan además 90 días históricos y el sistema fuente admite como máximo cuatro lecturas simultáneas.",
      steps: [
        "Configura file arrival sobre un Volume con debounce de 60 s y cooldown de 15 min.",
        "Mantén `max_concurrent_runs=1` para producción y pasa la ubicación disparadora como parámetro observable.",
        "Implementa `process_date` opcional y un `MERGE` idempotente por pedido.",
        "Calcula el plan de backfill de 90 días con concurrency máxima cuatro y coste estimado.",
        "Ejecuta dos días de prueba, repara uno y reconcilia conteo/importe antes de ampliar el rango.",
      ],
      starterCode: `# Configuración conceptual del Job
job = {
    "name": "partner_orders",
    "max_concurrent_runs": 1,
    "parameters": [{"name": "process_date", "default": ""}],
    # TODO: file_arrival con debounce y cooldown
}

# TODO en la tarea: limitar lectura por process_date y hacer MERGE idempotente.`,
      solution: `# Jobs API / bundle fragment
job = {
    "name": "partner_orders",
    "max_concurrent_runs": 1,
    "queue": {"enabled": True},
    "parameters": [
        {"name": "process_date", "default": ""},
        {"name": "trigger_location", "default": "{{job.trigger.file_arrival.location}}"},
    ],
    "trigger": {
        "file_arrival": {
            "url": "/Volumes/main/landing/partner_orders/",
            "min_time_between_triggers_seconds": 900,
            "wait_after_last_change_seconds": 60,
        }
    },
    "tasks": [{
        "task_key": "process_orders",
        "max_retries": 2,
        "min_retry_interval_millis": 60000,
        "notebook_task": {
            "notebook_path": "/Workspace/commerce/process_partner_orders",
            "base_parameters": {
                "process_date": "{{job.parameters.process_date}}",
                "trigger_location": "{{job.parameters.trigger_location}}",
            },
        },
    }],
}

# Lógica SQL parametrizada de la tarea:
# MERGE INTO main.silver.partner_orders AS t
# USING (
#   SELECT * FROM main.bronze.partner_orders
#   WHERE (:process_date = '' OR event_date = CAST(:process_date AS DATE))
# ) AS s
# ON t.order_id = s.order_id
# WHEN MATCHED THEN UPDATE SET *
# WHEN NOT MATCHED THEN INSERT *;

backfill_plan = {
    "start_date": "2026-04-22",
    "end_date": "2026-07-20",
    "interval": "1 day",
    "max_concurrent_runs": 4,
    "parameter": "process_date",
}
print({"job": job, "backfill": backfill_plan})`,
      checks: [
        { label: "Configura file arrival", pattern: "file_arrival" },
        { label: "Incluye debounce de 60 segundos", pattern: "wait_after_last_change_seconds[\"']?\\s*:\\s*60" },
        { label: "Incluye cooldown de 900 segundos", pattern: "min_time_between_triggers_seconds[\"']?\\s*:\\s*900" },
        { label: "Define backfill diario y concurrencia cuatro", pattern: "backfill_plan[\\s\\S]*max_concurrent_runs[\"']?\\s*:\\s*4" },
      ],
      expectedEvidence: [
        "Prueba de que una ráfaga de archivos produce un solo run después del debounce.",
        "Dos ejecuciones del mismo `process_date` con el mismo conteo y sin claves duplicadas.",
        "Plan de 90 runs con concurrency ≤ 4, coste y ventana de ejecución estimados.",
        "Reconciliación por fecha de filas e importe contra el manifiesto del proveedor.",
      ],
      cloudNotes: {
        AWS: "Habilita managed file events en la external location de S3 cuando corresponda y configura el IAM role para eventos/listing; considera costes y límites del proveedor.",
        Azure: "Usa external location/Volume en ADLS Gen2 con file events y managed identity; valida la configuración administrada de eventos disponible.",
        GCP: "Usa GCS mediante external location y managed file events cuando estén soportados; concede a la service account permisos mínimos para objetos y notificaciones.",
      },
    },
    quiz: [
      {
        question: "Los archivos de un lote llegan durante 45 segundos y no debe iniciarse el Job a mitad. ¿Qué opción aborda ese requisito?",
        options: [
          "`wait_after_last_change_seconds` superior a la separación interna del lote",
          "`max_concurrent_runs=20`",
          "Un schedule cada segundo",
          "Borrar archivos tras el primero",
        ],
        answer: 0,
        explanation: "El debounce reinicia la espera con cada llegada y lanza el run cuando transcurre un periodo de calma.",
        domain: "Lakeflow Jobs · file arrival",
      },
      {
        question: "Un consumidor depende de un commit en una tabla Unity Catalog, no de los archivos físicos. ¿Qué trigger es más directo?",
        options: ["Continuous sin fuente", "Schedule anual", "Table update", "File arrival sobre `_delta_log`"],
        answer: 2,
        explanation: "Table update observa la actualización gobernada de la tabla y evita depender de archivos internos Delta.",
        domain: "Lakeflow Jobs · table update",
      },
      {
        question: "Se necesitan reprocesar 90 días con la misma lógica diaria. ¿Qué enfoque reduce divergencia?",
        options: [
          "Copiar el notebook y eliminar validaciones para acelerar",
          "Usar backfill del mismo Job parametrizado por fecha y escritura idempotente",
          "Sobrescribir toda la tabla con cada día",
          "Crear 90 Jobs permanentes distintos",
        ],
        answer: 1,
        explanation: "El backfill reutiliza la automatización productiva y genera runs por intervalo con parámetros controlados.",
        domain: "Lakeflow Jobs · backfills",
      },
      {
        question: "Runs tardan 40 minutos y llegan triggers cada 10. Todos sobrescriben la misma partición. ¿Qué cambio es inseguro?",
        options: [
          "Medir y reducir la duración del critical path",
          "Aplicar queueing para un pico acotado",
          "Cambiar la escritura a una frontera idempotente por fecha",
          "Aumentar concurrencia sin aislar las escrituras",
        ],
        answer: 3,
        explanation: "Runs concurrentes que mutan el mismo rango crean carreras; primero se necesita aislamiento o una operación transaccional demostrada.",
        domain: "Lakeflow Jobs · concurrencia",
      },
    ],
    sources: [
      {
        label: "Automate jobs with schedules and triggers · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/triggers",
        reviewedAt,
      },
      {
        label: "Trigger jobs when new files arrive · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/file-arrival-triggers",
        reviewedAt,
      },
      {
        label: "Backfill jobs · Databricks",
        href: "https://docs.databricks.com/aws/en/jobs/backfill-jobs",
        reviewedAt,
      },
    ],
  },

  m22: {
    lessons: [
      {
        summary: "El proyecto de producción parte de contratos y NFR: fuentes, claves, latencia, calidad, seguridad, recuperación y consumidores antes de elegir objetos del pipeline.",
        deepDive: deepDives.m22l1,
        explanation: [
          "Pedidos append y clientes CDC tienen naturalezas distintas: los primeros encajan en streaming tables; los segundos en AUTO CDC. Gold necesita métricas consistentes con updates de ambas fuentes y puede ser una materialized view. El diseño identifica owners y fronteras bronze/silver/gold con nombres gobernados.",
          "Los NFR se convierten en decisiones comprobables: p95 de frescura, umbral de errores, RTO, retención y presupuesto. Un diagrama sin criterios de aceptación no permite saber si el pipeline está terminado ni qué hacer ante un fallo.",
        ],
        keyPoints: [
          "Cada fuente declara semántica append, CDC o snapshot.",
          "Cada target declara clave, consumidor, SLO y estrategia de rebuild.",
          "Dependencias externas, clasificación de datos y PII se identifican antes de desplegar.",
        ],
        example: {
          language: "YAML",
          title: "Contrato mínimo del proyecto",
          code: `domain: commerce
sources:
  orders:
    semantics: append
    key: order_id
    freshness_p95_minutes: 10
  customers:
    semantics: cdc
    key: customer_id
    sequence: source_lsn
targets:
  silver_orders: main.silver.orders
  current_customers: main.silver.customers_current
  daily_sales: main.gold.daily_customer_sales
rto_minutes: 60
owner: commerce-data`,
          note: "Añade consumidores, clasificación, reconciliaciones y consultas de evidencia concretas en la entrega final.",
        },
        pitfalls: [
          "Elegir todos los targets como streaming tables sin considerar updates y resultado completo.",
          "Diseñar la capa gold antes de acordar claves y semántica de las fuentes.",
        ],
        examDecision: "Mapea semántica de fuente a objeto: append incremental → streaming table; CDC → AUTO CDC; resultado materializado con updates → materialized view.",
        checkpoint: {
          question: "¿Qué dato del feed de clientes es imprescindible además de `customer_id`?",
          answer: "Una secuencia autoritativa por clave y semántica explícita de operación/delete para resolver cambios fuera de orden.",
        },
      },
      {
        summary: "La implementación combina append de pedidos y AUTO CDC de clientes sin mezclar estados ni presentar el nombre anterior APPLY CHANGES como API nueva.",
        deepDive: deepDives.m22l2,
        explanation: [
          "Pedidos se ingieren en bronze y se validan en silver con lectura streaming. Clientes llegan como operaciones con `source_lsn`; AUTO CDC materializa el estado actual SCD 1 o el historial SCD 2. La streaming table target se declara antes del flow y las columnas operativas se excluyen.",
          "Gold une pedidos con clientes según la necesidad temporal. Si se necesita el cliente actual, SCD 1 basta; si la segmentación al momento del pedido importa, se usa SCD 2 y un join por intervalo. Esa decisión cambia corrección, coste y complejidad.",
        ],
        keyPoints: [
          "AUTO CDC es la API actual; APPLY CHANGES es la denominación anterior.",
          "Append y CDC usan flows/targets diferentes y convergen en consumo.",
          "El join dimensional se alinea con SCD 1 actual o SCD 2 point-in-time según requisito.",
        ],
        example: {
          language: "SQL",
          title: "Clientes actuales con AUTO CDC",
          code: `CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_current_cdc AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY source_lsn
COLUMNS * EXCEPT (operation)
STORED AS SCD TYPE 1;`,
          note: "Valida que `source_lsn` sea monotónico por clave y que su tipo tenga un orden total estable.",
        },
        pitfalls: [
          "Hacer append de updates CDC y dejar múltiples estados vigentes por cliente.",
          "Elegir SCD 1 cuando reporting necesita la dimensión histórica al momento del pedido.",
        ],
        examDecision: "Estado actual: AUTO CDC SCD 1. Historia point-in-time: SCD 2. Evita un MERGE manual si el pipeline ofrece AUTO CDC para ese feed.",
        checkpoint: {
          question: "¿Qué resuelve AUTO CDC frente a un append simple del feed?",
          answer: "Ordena por secuencia, deduplica cambios, interpreta deletes y materializa SCD 1 o 2 por clave.",
        },
      },
      {
        summary: "Calidad se diseña como rutas: observación para señales, cuarentena para filas reparables y fallo para invariantes que invalidan el target.",
        deepDive: deepDives.m22l3,
        explanation: [
          "Pedidos sin ID van a cuarentena con archivo y motivo. Monedas desconocidas pueden observarse mientras negocio decide. Un importe negativo en una tabla financiera puede fallar la actualización. La clasificación compartida evita que una fila desaparezca entre filtros inconsistentes.",
          "El event log alimenta un dashboard por update y flow. La aceptación incluye casos para cada acción, una tasa máxima y un procedimiento de reentrada. Proteger la cuarentena con permisos más estrictos evita convertir observabilidad en fuga de PII.",
        ],
        keyPoints: [
          "Regla, acción y remediación se prueban conjuntamente.",
          "Cuarentena es un producto operado con retención y acceso, no un vertedero permanente.",
          "Event log ofrece métricas; reconciliación externa valida completitud y exactitud.",
        ],
        example: {
          language: "PySpark",
          title: "Contrato crítico en silver",
          code: `@dp.table(name="orders_silver")
@dp.expect("known_currency", "currency IN ('EUR', 'USD', 'GBP')")
@dp.expect_or_fail("non_negative_amount", "amount >= 0")
def orders_silver():
    return (
        spark.readStream.table("orders_classified")
          .where("size(failure_reasons) = 0")
          .drop("failure_reasons")
    )`,
          note: "La rama `orders_quarantine` materializa las filas donde `failure_reasons` no está vacía.",
        },
        pitfalls: [
          "Aplicar `expect_or_drop` y afirmar que existe cuarentena aunque no se conserve la fila.",
          "Fallar por una regla reparable de baja severidad y consumir innecesariamente el SLO de frescura.",
        ],
        examDecision: "Si se necesita remediación, materializa cuarentena; si el target completo sería inválido, falla el flow; si solo se mide, observa.",
        checkpoint: {
          question: "¿Qué evidencia demuestra que una regla de cuarentena funciona?",
          answer: "La fila inválida aparece con motivo y procedencia, no llega a silver y puede corregirse/reinyectarse sin duplicar.",
        },
      },
      {
        summary: "Lakeflow Jobs envuelve el pipeline para parametrizar entorno, ejecutar validaciones, condicionar publicación y manejar alertas o backfills.",
        deepDive: deepDives.m22l4,
        explanation: [
          "Una pipeline task actualiza datasets declarativos. Una tarea posterior consulta event log y reconciliación; una If/else bloquea publicación si se supera el umbral. Cleanup y notificación usan Run if. El mismo bundle define recursos para dev, test y prod con identidades y catálogos diferentes.",
          "La promoción no consiste en copiar notebooks. Se valida el bundle, se despliega el mismo artefacto, se ejecuta un smoke test y se compara lineage/esquema. Producción se activa con trigger pausado inicialmente y rollback conocido.",
        ],
        keyPoints: [
          "Pipelines transforma; Jobs coordina control flow y efectos operativos.",
          "El mismo artefacto se parametriza por target y se ejecuta con service principal.",
          "Quality gate usa métricas persistidas y bloquea solo publicación downstream.",
        ],
        example: {
          language: "YAML",
          title: "DAG de actualización y validación",
          code: `tasks:
  - task_key: update_pipeline
    pipeline_task:
      pipeline_id: orders_pipeline
  - task_key: validate_update
    depends_on:
      - task_key: update_pipeline
    notebook_task:
      notebook_path: /Workspace/commerce/validate_update
  - task_key: quality_gate
    depends_on:
      - task_key: validate_update
    condition_task:
      left: "{{tasks.validate_update.values.failure_rate}}"
      op: LESS_THAN_OR_EQUAL
      right: "0.01"`,
          note: "En un bundle real `pipeline_id` referencia el recurso desplegado; evita IDs fijos entre entornos.",
        },
        pitfalls: [
          "Meter notificaciones y llamadas externas dentro de una función declarativa del pipeline.",
          "Desplegar prod con identidad personal y rutas hardcoded de dev.",
        ],
        examDecision: "Control de datos declarativo pertenece al pipeline; branching, alertas, aprobaciones y promoción pertenecen al Job y bundle.",
        checkpoint: {
          question: "¿Por qué separar `validate_update` del pipeline task?",
          answer: "Permite usar métricas como quality gate, reparar/alertar con control flow y mantener efectos operativos fuera de las definiciones declarativas.",
        },
      },
      {
        summary: "La preparación productiva se demuestra con replay, backfill, fallo de calidad, métricas, coste y un runbook ejecutado, no solo con un update exitoso.",
        deepDive: deepDives.m22l5,
        explanation: [
          "El equipo prueba una segunda ejecución sin datos, un update CDC fuera de orden, una fila en cuarentena y una caída recuperable. Un backfill de una fecha usa el mismo pipeline/Job y se reconcilia. El event log debe explicar qué flows procesaron filas y qué expectations fallaron.",
          "El runbook identifica owner, SLO, paneles, decisiones de retry, repair o full refresh y rutas de rollback. La entrega incluye consultas de evidencia y límites conocidos. Una demo feliz sin incidente ni recuperación no valida producción.",
        ],
        keyPoints: [
          "Idempotencia se prueba ejecutando dos veces el mismo input.",
          "Recuperación se prueba con fallo y checkpoint/estado realista.",
          "Aceptación incluye calidad, observabilidad, seguridad y coste además del resultado funcional.",
        ],
        example: {
          language: "YAML",
          title: "Checklist de aceptación operativa",
          code: `acceptance:
  - second_run_adds_zero_duplicates
  - out_of_order_cdc_keeps_highest_sequence
  - invalid_order_is_quarantined_with_reason
  - expectation_metrics_visible_in_event_log
  - one_day_backfill_reconciles_to_manifest
  - repair_run_preserves_successful_outputs
  - rto_under_60_minutes
  - service_principal_has_least_privilege`,
          note: "Cada elemento enlaza a una consulta, run o captura reproducible, no a una marca manual sin evidencia.",
        },
        pitfalls: [
          "Aceptar el proyecto porque las tablas existen aunque no haya pruebas de reintento o recuperación.",
          "Realizar full refresh por defecto sin estimar coste, disponibilidad ni efecto en consumers.",
        ],
        examDecision: "Antes de declarar production-ready, exige evidencia de idempotencia, observabilidad, reparación y NFR; un pipeline verde una vez no basta.",
        checkpoint: {
          question: "¿Qué prueba distingue idempotencia de una ejecución simplemente exitosa?",
          answer: "Repetir exactamente el mismo input y demostrar que estado final y conteos no cambian ni duplican efectos.",
        },
      },
    ],
    lab: {
      title: "Proyecto de pipeline declarativo de producción",
      goal: "Entregar pedidos append y clientes AUTO CDC con calidad, cuarentena, gold materializado, quality gate y evidencias de operación.",
      scenario: "Comercio quiere publicar ventas diarias enriquecidas con clientes. Pedidos llegan por archivos; clientes por CDC fuera de orden. Un ID ausente se repara, un importe negativo bloquea publicación y el proyecto debe soportar backfill diario.",
      steps: [
        "Declara contratos, SLO, claves y secuencias para pedidos y clientes.",
        "Implementa bronze/silver de pedidos con clasificación, cuarentena y expectations.",
        "Materializa clientes actuales mediante AUTO CDC SCD 1 y deletes explícitos.",
        "Crea una materialized view gold de ventas por día y segmento.",
        "Consulta event log y publica `failure_rate` para un quality gate de Jobs.",
        "Ejecuta casos de idempotencia, CDC fuera de orden, repair y backfill de un día.",
      ],
      starterCode: `-- Pipeline SQL
CREATE OR REFRESH STREAMING TABLE main.bronze.orders;
CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

-- TODO: orders_silver con constraints
-- TODO: orders_quarantine
-- TODO: FLOW AUTO CDC de clientes
-- TODO: MATERIALIZED VIEW daily_customer_sales
-- TODO: consulta event_log para quality gate`,
      solution: `-- Pedidos válidos; bronze ya se alimenta mediante Auto Loader.
CREATE OR REFRESH STREAMING TABLE main.silver.orders_silver (
  CONSTRAINT valid_order_id EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT non_negative_amount EXPECT (amount >= 0) ON VIOLATION FAIL UPDATE,
  CONSTRAINT known_currency EXPECT (currency IN ('EUR', 'USD', 'GBP'))
)
AS SELECT
  order_id,
  customer_id,
  CAST(event_ts AS TIMESTAMP) AS event_ts,
  CAST(amount AS DECIMAL(18,2)) AS amount,
  currency,
  source_file,
  ingested_at
FROM STREAM(main.bronze.orders)
WHERE event_ts IS NOT NULL;

-- Cuarentena explícita para filas reparables.
CREATE OR REFRESH STREAMING TABLE main.ops.orders_quarantine
AS SELECT
  *,
  CASE
    WHEN order_id IS NULL THEN 'MISSING_ORDER_ID'
    WHEN event_ts IS NULL THEN 'INVALID_EVENT_TS'
    ELSE 'UNKNOWN'
  END AS failure_reason,
  current_timestamp() AS quarantined_at
FROM STREAM(main.bronze.orders)
WHERE order_id IS NULL OR event_ts IS NULL;

-- API actual: AUTO CDC; APPLY CHANGES es el nombre anterior.
CREATE OR REFRESH STREAMING TABLE main.silver.customers_current;

CREATE FLOW customers_current_cdc AS AUTO CDC INTO
  main.silver.customers_current
FROM STREAM(main.bronze.customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN operation = 'DELETE'
SEQUENCE BY struct(source_lsn, event_ts)
COLUMNS * EXCEPT (operation, ingested_at)
STORED AS SCD TYPE 1;

-- Capa de consumo materializada.
CREATE OR REFRESH MATERIALIZED VIEW main.gold.daily_customer_sales
AS SELECT
  CAST(o.event_ts AS DATE) AS order_date,
  c.segment,
  count(DISTINCT o.order_id) AS orders,
  sum(o.amount) AS revenue
FROM main.silver.orders_silver o
LEFT JOIN main.silver.customers_current c
  ON o.customer_id = c.customer_id
GROUP BY CAST(o.event_ts AS DATE), c.segment;

-- Evidencia para quality gate de Lakeflow Jobs.
SELECT
  timestamp,
  origin.update_id AS update_id,
  origin.flow_name AS flow_name,
  details:flow_progress.data_quality:expectations AS expectations
FROM event_log(TABLE(main.silver.orders_silver))
WHERE event_type = 'flow_progress'
ORDER BY timestamp DESC;`,
      checks: [
        { label: "Usa expectations con acciones distintas", pattern: "EXPECT[\\s\\S]*(DROP ROW|FAIL UPDATE)" },
        { label: "Materializa cuarentena", pattern: "orders_quarantine" },
        { label: "Aplica clientes con AUTO CDC", pattern: "AUTO CDC INTO[\\s\\S]*KEYS[\\s\\S]*SEQUENCE BY" },
        { label: "Crea gold y consulta event log", pattern: "MATERIALIZED VIEW[\\s\\S]*event_log\\(TABLE" },
      ],
      expectedEvidence: [
        "Grafo y contratos de datasets con owners, SLO y estrategia de rebuild.",
        "Caso CDC fuera de orden donde vence el mayor `source_lsn` y un delete desaparece del estado actual.",
        "Filas inválidas en cuarentena y métricas de expectations en event log.",
        "Segunda ejecución idempotente y backfill diario reconciliado contra un manifiesto.",
        "Run/repair de Jobs con quality gate y runbook de producción.",
      ],
      cloudNotes: {
        AWS: "Usa Volumes sobre S3, IAM roles en storage credentials y conectividad privada a la fuente CDC; CloudWatch complementa alertas, pero event log conserva evidencia del pipeline.",
        Azure: "Usa ADLS Gen2 con managed identity, Private Link para fuentes y Key Vault para secretos; Azure Monitor complementa Jobs/event log sin copiar PII.",
        GCP: "Usa GCS con service accounts, conectividad privada y Secret Manager; Cloud Monitoring complementa métricas manteniendo Unity Catalog como frontera de gobierno.",
      },
    },
    quiz: [
      {
        question: "Clientes llegan como updates y deletes fuera de orden y solo se necesita el estado vigente. ¿Qué objeto es adecuado?",
        options: [
          "Append flow sin clave",
          "Materialized view sin secuencia",
          "AUTO CDC con SCD tipo 1, clave y `SEQUENCE BY`",
          "APPLY CHANGES presentado como única API actual",
        ],
        answer: 2,
        explanation: "AUTO CDC es la API actual y SCD 1 materializa estado vigente resolviendo orden y deletes por clave.",
        domain: "Production pipelines · CDC",
      },
      {
        question: "Un pedido sin ID debe corregirse más tarde sin detener pedidos válidos. ¿Qué acción satisface el requisito?",
        options: [
          "Clasificarlo en una cuarentena trazable y excluirlo de silver",
          "Fallar todos los flows paralelos",
          "Conservarlo en gold con ID nulo",
          "Descartarlo sin registro",
        ],
        answer: 0,
        explanation: "La cuarentena conserva evidencia y permite remediación, mientras la rama válida continúa.",
        domain: "Production pipelines · quality",
      },
      {
        question: "Se requiere bloquear publicación cuando la tasa inválida supera 1%, manteniendo limpia la transformación declarativa. ¿Dónde va el branching?",
        options: [
          "Dentro de `@dp.table` llamando una API",
          "En `VACUUM`",
          "En el schema Kafka",
          "En Lakeflow Jobs mediante validación, task value e If/else",
        ],
        answer: 3,
        explanation: "El pipeline produce datos y métricas; Jobs coordina decisiones y efectos operativos mediante control flow.",
        domain: "Production pipelines · orchestration",
      },
      {
        question: "El pipeline terminó verde una vez. ¿Qué evidencia falta para llamarlo production-ready?",
        options: [
          "Solo cambiar el color del dashboard",
          "Pruebas de idempotencia, fallo/repair, backfill, calidad, SLO y permisos",
          "Un notebook adicional sin ejecutar",
          "Eliminar el event log para ahorrar espacio",
        ],
        answer: 1,
        explanation: "La preparación productiva incluye comportamiento bajo reintentos e incidentes, observabilidad y gobierno, no solo el happy path.",
        domain: "Production pipelines · readiness",
      },
    ],
    sources: [
      {
        label: "Best practices for Spark Declarative Pipelines · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/best-practices",
        reviewedAt,
      },
      {
        label: "AUTO CDC APIs · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/cdc",
        reviewedAt,
      },
      {
        label: "Pipeline event log schema · Databricks",
        href: "https://docs.databricks.com/aws/en/ldp/monitor-event-log-schema",
        reviewedAt,
      },
    ],
  },
};

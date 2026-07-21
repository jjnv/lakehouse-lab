import type { LessonDeepDive, ModuleContentPack } from "./content-types";

const reviewedAt = "21 jul 2026";

const advancedDeepDives = {
  m23_1: {
    mentalModel: "Imagina una etapa de Spark como una carrera por equipos cuyo tiempo oficial lo determina el último corredor. Cada partición produce una tarea y todas deben terminar antes de avanzar; por eso el promedio oculta el dato decisivo. El skew no significa simplemente que el conjunto sea grande, sino que el reparto de trabajo entre tareas es muy desigual. Una clave frecuente, un valor nulo dominante o un rango temporal desproporcionado concentra registros y bytes en pocas particiones. El diagnóstico correcto enlaza tres niveles: distribución del dato de negocio, particionado físico tras el exchange y cola de duraciones observada en Spark UI. Escalar compute mejora capacidad general, pero no redistribuye una clave caliente por sí solo.",
    mechanics: [
      "Un join o una agregación con shuffle aplica una función de particionado a la clave y envía registros con el mismo resultado a la misma partición de salida. Cuando una clave domina, una tarea recibe mucho más shuffle read, memoria intermedia y CPU que las demás. Spark UI permite comparar máximo, mediana y percentiles de duración, registros y bytes por tarea. AQE puede detectar particiones sesgadas después del exchange y dividirlas, replicando cuando sea necesario el lado compatible del join; el plan adaptativo final muestra si esa regla llegó a aplicarse.",
      "La corrección depende de la causa. Separar nulos, aislar unas pocas claves calientes, agregar parcialmente antes del join o aplicar salting selectivo cambia la distribución, pero añade ramas, claves auxiliares y coste de recomposición. Aumentar particiones ayuda si muchas son razonablemente grandes, no si una clave indivisible domina. Un broadcast del lado pequeño puede evitar el shuffle de la tabla grande, aunque introduce memoria replicada. La decisión debe medirse con datos representativos y comparar tiempo máximo frente a mediana, shuffle, spill y corrección del resultado.",
    ],
    concepts: [
      { term: "Skew de datos", definition: "Distribución en la que unas pocas claves o rangos concentran una fracción desproporcionada de registros y trabajo.", whyItMatters: "Convierte unas pocas tareas en el camino crítico aunque el clúster tenga capacidad ociosa." },
      { term: "Exchange", definition: "Frontera del plan físico que redistribuye datos entre executors, normalmente para joins, agregaciones o ventanas.", whyItMatters: "Es el punto donde la distribución lógica de claves se materializa como particiones y puede revelar skew." },
      { term: "Straggler", definition: "Tarea mucho más lenta que sus pares dentro de la misma etapa.", whyItMatters: "La etapa no finaliza hasta que termina el straggler; por ello el máximo pesa más que la media." },
    ],
    workedScenario: {
      situation: "Un cierre diario procesa 2,4 TB. Novecientas noventa tareas duran unos 40 segundos y diez superan veinte minutos; el 38 % de pedidos tiene customer_id nulo por un canal invitado.",
      reasoning: [
        "Comparar por tarea duración, registros y shuffle read para demostrar que la cola coincide con particiones anormalmente grandes, no con lentitud uniforme.",
        "Perfilar customer_id y separar el flujo invitado antes del join, preservando su semántica con una rama que no necesita la dimensión de clientes.",
        "Ejecutar ambas ramas, recomponer con unionByName y contrastar recuentos, importes, máximos por tarea y plan adaptativo contra la línea base.",
      ],
      outcome: "La etapa deja de depender de diez particiones calientes y baja a seis minutos sin aumentar workers; el runbook documenta la rama de nulos y un umbral de skew observable.",
    },
  },
  m23_2: {
    mentalModel: "Piensa en la memoria de ejecución de Spark como una mesa de trabajo compartida, no como un almacén permanente. Un sort, hash aggregate o join construye estructuras temporales por tarea; si la porción activa no cabe, Spark conserva corrección escribiendo parte en disco y leyéndola después. Ese spill es un mecanismo de supervivencia, no necesariamente un fallo. Se vuelve problemático cuando domina el tiempo, coincide con garbage collection, reintentos o executors perdidos, o se concentra en particiones concretas. La pregunta útil no es cuánta memoria tiene todo el clúster, sino qué operador, con qué ancho de fila y distribución, exige cuánta memoria simultánea en cada tarea.",
    mechanics: [
      "Durante una agregación o un ordenamiento, Spark reserva memoria de ejecución para buffers, mapas hash y estructuras de sort. Cuando la tarea supera la memoria concedida, serializa bloques intermedios; memory spill refleja bytes desalojados conceptualmente y disk spill los bytes efectivamente escritos, por lo que no deben compararse como medidas idénticas. Spark UI sitúa el spill en etapa y tareas, mientras el plan físico identifica el operador que lo genera. Filtrar, proyectar columnas y preagregar antes de un exchange reducen directamente el estado intermedio.",
      "Más memoria por executor puede permitir estructuras mayores, pero reduce a menudo el número de executors por nodo y cambia el paralelismo. Más particiones disminuyen el volumen medio por tarea, aunque elevan scheduling y archivos pequeños; menos particiones hacen lo contrario. Un skew severo no se resuelve con una media de partición menor. La optimización debe conservar un margen de memoria, evitar coalesce a una sola partición y validarse con volumen pico, observando spill por tarea, GC, duración y estabilidad, no sólo una ejecución pequeña sin presión.",
    ],
    concepts: [
      { term: "Execution memory", definition: "Memoria usada temporalmente por operadores de shuffle, join, sort y aggregate mientras una tarea está activa.", whyItMatters: "Su presión ocurre por tarea y operador; sumar RAM del clúster no describe si una partición cabe." },
      { term: "Memory spill", definition: "Estimación de datos intermedios desalojados de estructuras en memoria durante la ejecución.", whyItMatters: "Señala presión, pero no equivale necesariamente a bytes físicos escritos en disco." },
      { term: "Disk spill", definition: "Datos intermedios serializados en almacenamiento local para que la operación pueda continuar.", whyItMatters: "Añade I/O y serialización; un valor alto sostenido suele explicar colas o inestabilidad." },
    ],
    workedScenario: {
      situation: "Un MERGE de 600 GB falla algunas noches con executor lost. La etapa de deduplicación arrastra una columna JSON de 40 KB que nunca participa en la clave ni en la actualización.",
      reasoning: [
        "Localizar el sort aggregate con spill y comprobar que las tareas grandes transportan el payload completo antes de deduplicar.",
        "Proyectar clave, secuencia y columnas actualizables, deduplicar ese marco estrecho y recuperar el payload sólo si el contrato final lo necesita.",
        "Repetir con el percentil pico, comparando spill, GC, tareas fallidas, recuento y checksum de columnas de negocio antes de redimensionar compute.",
      ],
      outcome: "El disk spill cae un 92 % y desaparecen las pérdidas de executor; se mantiene el tamaño de clúster y se añade una prueba que impide reintroducir columnas anchas antes del shuffle.",
    },
  },
  m23_3: {
    mentalModel: "Catalyst prepara una ruta con estimaciones; AQE actúa como un navegador que recalcula cuando ya conoce el tráfico real después de ciertos cruces. Esos cruces son query stages separados por exchanges o subconsultas. Al materializarse una etapa, Spark obtiene tamaños y distribuciones más fiables que las estadísticas previas y puede cambiar algunas decisiones físicas sin alterar la consulta lógica. AQE no es un optimizador omnisciente: no corrige semántica, no rediseña el modelo ni reordena libremente toda cadena de joins. Su valor está en adaptar particiones post-shuffle, tratar skew, propagar relaciones vacías y, cuando procede, sustituir un sort-merge por broadcast con evidencia runtime.",
    mechanics: [
      "AQE está habilitado por defecto para consultas batch compatibles que contienen exchanges o subconsultas. Tras completar un query stage, analiza estadísticas runtime y puede combinar particiones pequeñas para aproximarse a un tamaño objetivo, dividir particiones sesgadas y cambiar estrategias de join. El plan inicial aparece como AdaptiveSparkPlan; después de materializar una acción, Spark UI permite ver el plan final y las estadísticas reales. Un plan adaptativo puede conservar la misma forma si ninguna alternativa supera la decisión original, lo cual no significa que AQE estuviera desactivado.",
      "La adaptación tardía tiene límites de coste: si Spark descubre después de un shuffle que un lado es difundible, parte del intercambio quizá ya ocurrió, mientras un broadcast bien fundamentado desde el inicio podría evitarlo. Configuraciones agresivas pueden crear presión de memoria o demasiadas particiones; hints incorrectos restringen al optimizador. Conviene mantener defaults, estadísticas y reducción temprana de datos, usar hints sólo con invariantes operativas y comparar el plan final, bytes de exchange, tiempo y estabilidad sobre varios tamaños de entrada.",
    ],
    concepts: [
      { term: "Query stage", definition: "Fragmento del plan adaptativo delimitado por exchanges cuya salida puede materializar estadísticas runtime.", whyItMatters: "AQE toma nuevas decisiones con información precisa al terminar cada etapa materializable." },
      { term: "Post-shuffle coalescing", definition: "Combinación dinámica de particiones pequeñas producidas por un shuffle.", whyItMatters: "Reduce overhead de tareas diminutas sin imponer un número estático adecuado para todos los volúmenes." },
      { term: "Plan final adaptativo", definition: "Plan físico efectivo después de aplicar o descartar reglas AQE durante la ejecución.", whyItMatters: "Es la evidencia para saber qué estrategia se usó; el plan inicial no basta." },
    ],
    workedScenario: {
      situation: "Una consulta mensual une 8 TB de hechos con una tabla filtrada cuyo tamaño varía entre 30 MB y 2 GB según región; las estadísticas del catálogo están atrasadas.",
      reasoning: [
        "Mantener AQE y materializar la consulta para observar estadísticas de cada región y el plan final, sin asumir que el mismo join sirve siempre.",
        "Verificar si las regiones pequeñas cambian a broadcast y si las grandes conservan sort-merge, comparando también exchanges ya pagados y memoria máxima.",
        "Actualizar estadísticas y decidir si conviene un diseño separado por rango sólo si la variabilidad causa regresiones que AQE no puede evitar a tiempo.",
      ],
      outcome: "La consulta adopta estrategias distintas de forma segura por región; el equipo elimina un hint global que fallaba en los meses grandes y monitoriza el plan final.",
    },
  },
  m23_4: {
    mentalModel: "Una estrategia de join decide dónde se encuentran las filas, cuánto dato viaja y qué memoria se replica. Broadcast lleva una relación pequeña a cada executor y evita redistribuir la grande; sort-merge redistribuye ambos lados por clave y los ordena; shuffle hash también reparte y construye mapas por partición. No existe una estrategia universalmente rápida. La elección depende del tamaño después de filtros y proyecciones, el tipo de join, la distribución de claves, la calidad de estadísticas y los límites de memoria. El modelo mental correcto compara coste total y riesgo: red, ordenación, memoria repetida, posible skew y estabilidad cuando el lado supuestamente pequeño crece.",
    mechanics: [
      "En broadcast hash join, el driver coordina la relación difundida y cada executor construye una tabla hash local; el lado grande puede recorrerse sin shuffle por la clave. La compatibilidad depende de la semántica: en determinados outer joins sólo puede difundirse el lado que no debe preservar todas sus filas. Catalyst usa estadísticas y umbrales, AQE puede cambiar tarde la estrategia y un hint expresa preferencia. El plan físico confirma BuildLeft o BuildRight, exchanges y filtros efectivos; contar filas por sí solo ignora ancho y serialización.",
      "Sort-merge join tolera dos lados grandes pero paga shuffle, sort y potencial spill. Filtrar y proyectar antes reduce todos esos costes; particionar físicamente las tablas no garantiza evitar el exchange si distribución y requisitos no coinciden. Forzar broadcast puede provocar timeout o presión en cada executor, especialmente con concurrencia. La práctica segura fija un límite operativo del artefacto difundido, mantiene estadísticas, prueba el volumen máximo y conserva una alternativa distribuida. Un hint se justifica por una invariante medible, no por una captura puntual.",
    ],
    concepts: [
      { term: "Build side", definition: "Lado del join usado para construir la estructura hash, local o difundida.", whyItMatters: "Determina memoria, compatibilidad con outer joins y qué conjunto debe permanecer acotado." },
      { term: "Broadcast exchange", definition: "Operación que recopila y distribuye una relación a los executors que ejecutan el join.", whyItMatters: "Evita un shuffle grande, pero replica bytes y puede fallar si la relación crece." },
      { term: "Sort-merge join", definition: "Estrategia que reparte ambos lados por clave, los ordena y fusiona secuencialmente.", whyItMatters: "Escala a relaciones grandes a cambio de red, ordenación, memoria temporal y posible spill." },
    ],
    workedScenario: {
      situation: "Un pipeline une 4 TB de clicks con products. La tabla completa ocupa 12 GB, pero sólo 180 MB corresponden a productos activos y se necesitan tres columnas.",
      reasoning: [
        "Aplicar el filtro de vigencia y la proyección antes del join, medir bytes estimados y reales del resultado, y actualizar estadísticas si están obsoletas.",
        "Comprobar que el left join preserva clicks y que products puede ser el build side; ensayar broadcast con concurrencia representativa.",
        "Comparar plan, shuffle, memoria máxima y duración con sort-merge, y establecer alerta si la dimensión filtrada supera el límite acordado.",
      ],
      outcome: "Broadcast reduce el shuffle en terabytes y el SLA de 24 a 7 minutos, con un guardrail que revierte a estrategia distribuida cuando la dimensión deja de estar acotada.",
    },
  },
  m23_5: {
    mentalModel: "Catalyst sólo puede optimizar lo que entiende. Una expresión nativa forma parte del árbol lógico: el motor conoce tipos, nulabilidad y operadores, puede plegar constantes, empujar filtros y ejecutar con Photon cuando hay soporte. Una UDF de Python se parece a una caja negra situada al otro lado de una frontera de proceso; Spark debe serializar columnas, transferir lotes o filas y aceptar que no puede razonar sobre la lógica interna. Esto no hace ilegítimas las UDF, pero cambia la carga de prueba. Primero se buscan funciones SQL, funciones de orden superior y operaciones de tipos complejos; sólo la necesidad funcional justifica perder visibilidad y añadir contrato explícito.",
    mechanics: [
      "Las funciones nativas permanecen en el plan de Spark y pueden combinarse con code generation, pushdown y ejecución vectorizada. Una UDF escalar de Python mueve datos entre el runtime Spark y workers Python, introduce serialización y suele impedir que Photon ejecute ese operador. Las pandas UDF usan Arrow y procesan lotes para amortizar la frontera, pero conservan costes de conversión, memoria y semántica de nulos. Spark UI o Query Profile muestran el operador y el porcentaje fuera de Photon, mientras pruebas de datos extremos validan el resultado.",
      "Reescribir una UDF puede hacer la expresión más larga; la optimización no debe sacrificar comprensión ni contrato. Encapsular una composición nativa en una función Python que devuelve Column conserva visibilidad sin duplicar lógica. Si una biblioteca externa es imprescindible, se fijan tipos de entrada y salida, tratamiento de nulos, tamaño de lote, dependencias y casos deterministas. Se compara coste por volumen representativo y se acepta fallback cuando el valor funcional supera la penalización, documentando por qué no existe equivalente nativo.",
    ],
    concepts: [
      { term: "Expresión Catalyst", definition: "Nodo tipado del plan lógico que representa una operación conocida por el optimizador.", whyItMatters: "Permite simplificación, pushdown y elección de operadores nativos o Photon." },
      { term: "Frontera Python", definition: "Transferencia y serialización entre el proceso que ejecuta Spark y un worker Python.", whyItMatters: "Añade coste por lote o fila y oculta la semántica interna al optimizador." },
      { term: "Función de orden superior", definition: "Función nativa que transforma o filtra elementos de arrays y mapas mediante expresiones lambda SQL.", whyItMatters: "Resuelve lógica compleja manteniéndola visible y optimizable, a menudo evitando UDFs." },
    ],
    workedScenario: {
      situation: "Una UDF Python clasifica 9.000 millones de eventos diarios inspeccionando un array de atributos; el perfil muestra 63 % del tiempo fuera de Photon.",
      reasoning: [
        "Especificar la semántica, incluidos arrays nulos, vacíos y valores desconocidos, y mapearla a exists, transform y aggregate nativos.",
        "Implementar la expresión como una función que devuelve Column y ejecutar pruebas de equivalencia sobre casos límite y una muestra estratificada.",
        "Comparar plan, porcentaje Photon, CPU y duración a volumen pico; conservar la UDF detrás de una prueba de regresión hasta validar paridad.",
      ],
      outcome: "La lógica queda completamente visible para el motor, la consulta usa Photon de extremo a extremo y el tiempo baja un 46 % sin cambiar la clasificación.",
    },
  },
  m24_1: {
    mentalModel: "Photon no es otro clúster ni una base separada: es un motor vectorizado nativo que ejecuta operadores compatibles dentro del plan de Spark y SQL. Procesa valores por lotes con código optimizado y mejora especialmente scans amplios, joins, agregaciones y escrituras; un plan puede alternar operadores Photon y runtime Spark sin cambiar resultados. Por eso activar Photon no garantiza una aceleración uniforme. La métrica correcta es precio/rendimiento del workload completo y porcentaje de tiempo realmente ejecutado por Photon. Una UDF, una API RDD o una operación no soportada crea fallback; las consultas de menos de unos segundos pueden estar dominadas por latencia fija y no mostrar beneficio material.",
    mechanics: [
      "Catalyst sigue produciendo el plan; Photon implementa operadores compatibles con ejecución nativa vectorizada y un escritor Parquet propio. En Spark UI, los operadores Photon se distinguen en la visualización SQL/DataFrame; en Query Profile para warehouses y serverless, Execution Details informa del porcentaje de task time en Photon. Un operador no soportado cambia de forma transparente al runtime Spark para esa parte, de modo que la corrección se conserva. SQL y DataFrame APIs son candidatos, mientras UDFs, RDDs, Datasets y streaming con estado quedan fuera de su soporte actual.",
      "El coste debe normalizarse por trabajo terminado: euros por pipeline correcto, consulta o terabyte, no por DBU/hora aislada. Photon puede consumir una tarifa distinta y aun reducir tiempo, infraestructura activa y colas; también puede aportar poco si I/O remoto, espera o coordinación dominan. El benchmark necesita datos y concurrencia representativos, cachés controladas, varias ejecuciones y el mismo resultado. Primero se elimina fallback evitable y se mide; después se decide por SLA y coste total, evitando promesas basadas en un microbenchmark de dos segundos.",
    ],
    concepts: [
      { term: "Ejecución vectorizada", definition: "Procesamiento de lotes de valores mediante operaciones nativas eficientes en lugar de interpretar fila a fila.", whyItMatters: "Aumenta rendimiento de CPU y aprovecha mejor memoria para operadores analíticos compatibles." },
      { term: "Fallback", definition: "Ejecución transparente de un operador con el runtime Spark cuando Photon no lo soporta.", whyItMatters: "El resultado sigue siendo correcto, pero una sección costosa puede limitar la aceleración total." },
      { term: "Precio/rendimiento", definition: "Coste monetario o de uso por una unidad completa de trabajo útil y correcta.", whyItMatters: "Permite comparar motores aunque difieran tarifa horaria y duración." },
    ],
    workedScenario: {
      situation: "Un ETL de 70 minutos usa Photon, pero sólo dedica 18 % del tiempo a operadores Photon porque una pandas UDF de normalización domina la etapa central.",
      reasoning: [
        "Usar Query Profile para separar scan, join, UDF, escritura y espera, identificando el operador que obliga al fallback y su peso real.",
        "Reescribir la normalización con funciones nativas y validar equivalencia de nulos, Unicode y resultados históricos antes de comparar tiempos.",
        "Ejecutar varias veces con volumen pico y calcular coste por partición publicada, porcentaje Photon, duración y tasa de errores.",
      ],
      outcome: "El tiempo Photon alcanza 86 %, el ETL termina en 31 minutos y el coste por publicación baja 28 % aunque la tarifa horaria no cambie.",
    },
  },
  m24_2: {
    mentalModel: "Data skipping funciona como un índice grueso distribuido: Delta conserva estadísticas por archivo, como mínimos y máximos de columnas elegibles, y el motor descarta archivos imposibles antes de leer sus filas. No busca una fila concreta ni sustituye un filtro; reduce el conjunto de archivos candidatos cuando el predicado es selectivo y los valores relacionados están físicamente agrupados. Si cada archivo contiene todo el rango de fechas o clientes, sus intervalos se solapan y las estadísticas no ayudan. El diseño empieza con el historial real de filtros y joins, no con el orden de llegada. Clustering, compactación y tamaño de archivos moldean la utilidad de esas estadísticas sin crear una jerarquía rígida de directorios.",
    mechanics: [
      "Al escribir una tabla Delta, cada AddFile del log puede registrar estadísticas de columnas. Durante planificación, un predicado compatible se compara con esos rangos y evita abrir archivos que no pueden contener coincidencias; después el motor aplica el filtro normal a las filas leídas. La efectividad se observa en archivos y bytes podados frente a leídos en Query Profile. Predicados envueltos en funciones, conversiones innecesarias o columnas sin estadísticas pueden limitar pruning. Clustering aumenta la correlación física entre valores cercanos y archivos, haciendo los rangos más estrechos.",
      "Elegir demasiadas columnas de layout diluye la agrupación y añade mantenimiento. Una clave de alta cardinalidad puede ser valiosa con liquid clustering, pero particionarla como directorio produciría fragmentación. Los patrones cambian: una columna útil para filtros de ayer puede no justificar reescribir datos históricos. Se recogen top predicates y selectividad, se eligen pocas claves, se ejecuta optimización incremental y se compara porcentaje de archivos podados, latencia y coste de mantenimiento. Un scan amplio legítimo no mejora mágicamente con skipping.",
    ],
    concepts: [
      { term: "Estadística por archivo", definition: "Metadato como mínimo, máximo, nulos y recuento asociado a un archivo de datos.", whyItMatters: "Permite descartar archivos sin leer su contenido cuando el predicado queda fuera del rango." },
      { term: "Pruning", definition: "Eliminación de archivos o particiones candidatas durante la planificación de lectura.", whyItMatters: "Reduce I/O y trabajo downstream; Query Profile permite medir cuántos bytes se evitaron." },
      { term: "Selectividad", definition: "Fracción del conjunto total que satisface un predicado.", whyItMatters: "Los filtros selectivos obtienen más valor de un layout que agrupa sus columnas." },
    ],
    workedScenario: {
      situation: "Una tabla de 90 TB recibe eventos por hora, pero el soporte consulta por tenant_id y event_time. Cada consulta lee 60 % de los archivos para devolver 0,02 % de filas.",
      reasoning: [
        "Extraer del historial los predicados y confirmar que tenant_id más event_time dominan, midiendo selectividad y archivos podados en la línea base.",
        "Aplicar liquid clustering con esas claves y optimizar incrementalmente el rango activo sin particionar por tenant de alta cardinalidad.",
        "Comparar bytes leídos, archivos podados, latencia P95 y coste de OPTIMIZE durante varias semanas antes de reclusterizar datos fríos.",
      ],
      outcome: "Las consultas activas leen menos del 2 % de archivos y mejoran ocho veces; el equipo mantiene sólo dos claves y revisa trimestralmente el patrón de acceso.",
    },
  },
  m24_3: {
    mentalModel: "Liquid clustering separa la identidad lógica de una tabla de su organización física. En lugar de fijar directorios de partición que cada fila debe habitar para siempre, declara unas claves de clustering y deja que OPTIMIZE organice incrementalmente archivos para favorecer data skipping. Las claves pueden cambiar sin reescribir de inmediato todo el histórico; los datos nuevos y las futuras optimizaciones siguen la nueva intención. Esto hace el layout adaptable a cardinalidad alta, skew y consultas cambiantes. No significa que una declaración reordene instantáneamente los archivos existentes: activar o cambiar claves establece una política futura, y sólo el trabajo de clustering, automático o explícito, materializa gradualmente el beneficio.",
    mechanics: [
      "Una tabla con liquid clustering usa dominios y metadatos de clustering para registrar cómo están agrupados los archivos. CLUSTER BY define claves; OPTIMIZE reescribe incrementalmente los archivos que necesitan organización, y el motor aprovecha después las estadísticas para skipping. Liquid clustering no se combina con particiones ni ZORDER en la misma tabla. Cambiar claves afecta operaciones futuras; OPTIMIZE FULL puede forzar reclustering cuando la versión de runtime lo admite. CLUSTER BY AUTO requiere predictive optimization y selecciona claves a partir de patrones observados.",
      "La adaptabilidad reduce explosión de directorios y migraciones, pero clustering consume compute y reescritura. Claves poco usadas o demasiadas columnas pueden no recuperar su coste; claves con fuerte correlación quizá sean redundantes. Los lectores deben soportar las características de protocolo activadas, incluidas deletion vectors según configuración. La decisión combina selectividad, frecuencia, crecimiento, concurrencia y compatibilidad. Se empieza por tablas nuevas o rangos calientes, se mide skipping y se permite a la optimización incremental actuar antes de ordenar un FULL costoso.",
    ],
    concepts: [
      { term: "Clave de clustering", definition: "Columna declarada como señal para agrupar físicamente valores en archivos sin crear directorios de partición.", whyItMatters: "Mejora data skipping y puede cambiar conforme evoluciona el patrón de consulta." },
      { term: "Clustering incremental", definition: "Reescritura sólo de archivos que requieren reorganización durante operaciones de optimización.", whyItMatters: "Evita reclasificar toda la tabla en cada ejecución y hace viable el mantenimiento continuo." },
      { term: "OPTIMIZE FULL", definition: "Modo que fuerza reclustering más amplio de datos existentes en tablas liquid-clustered compatibles.", whyItMatters: "Materializa nuevas claves históricamente, pero su coste exige una razón y ventana operacional claras." },
    ],
    workedScenario: {
      situation: "Una tabla particionada por country genera un directorio de 45 TB para Estados Unidos y miles diminutos para países pequeños; las consultas ahora filtran account_id.",
      reasoning: [
        "Cuantificar skew, tamaños de archivo y predicados, y verificar que account_id tiene selectividad estable mientras country ya no poda eficazmente.",
        "Crear una tabla liquid-clustered por account_id y event_date o convertirla con una ruta soportada, validando protocolo y consumidores antes del cambio.",
        "Migrar por ventanas, comparar recuentos y skipping, y reservar OPTIMIZE FULL sólo para histórico cuyo beneficio esperado supera la reescritura.",
      ],
      outcome: "Desaparece la dependencia de directorios desbalanceados, el mantenimiento se vuelve incremental y el P95 baja 65 % sin miles de particiones pequeñas.",
    },
  },
  m24_4: {
    mentalModel: "Una deletion vector es una capa de indirection entre el archivo físico y la versión lógica visible de la tabla. En vez de reescribir un Parquet completo para cambiar unas pocas filas, la transacción registra qué posiciones quedan eliminadas o sustituidas; las lecturas consultan esa marca y reconstruyen el estado actual. Photon puede aprovechar este mecanismo para predictive I/O en UPDATE, DELETE y MERGE, y Delta puede habilitar concurrencia a nivel de fila en configuraciones compatibles. El ahorro de escritura desplaza parte del trabajo a lectura y mantenimiento posterior. Los bytes antiguos no desaparecen inmediatamente: REORG y VACUUM, con retención segura, materializan y purgan cuando corresponde.",
    mechanics: [
      "Sin deletion vectors, una modificación selectiva suele leer y reescribir cada archivo afectado. Con ellas, el commit añade metadatos compactos que identifican filas lógicamente removidas; lectores compatibles aplican la máscara y mantienen aislamiento transaccional. Predictive I/O con Photon decide de forma optimizada qué porciones tocar. La concurrencia por fila reduce conflictos entre modificaciones que afectan filas distintas, pero exige características como row tracking y runtimes compatibles. DESCRIBE DETAIL y el historial ayudan a verificar protocolo, features y operaciones, no sólo el tiempo de un MERGE.",
      "La ventaja disminuye cuando casi todas las filas de un archivo cambian o cuando lectores externos no soportan el protocolo. Muchas marcas acumuladas pueden añadir trabajo de lectura; REORG TABLE APPLY (PURGE) reescribe datos para materializar eliminaciones y después VACUUM elimina archivos antiguos sólo cuando la retención y consumidores lo permiten. Desactivar deletion vectors puede quitar concurrencia por fila y encarecer DML. Antes de habilitar, se inventariarían lectores, SLA de borrado físico, frecuencia de cambios y compatibilidad de rollback.",
    ],
    concepts: [
      { term: "Deletion vector", definition: "Metadato que identifica posiciones de filas lógicamente eliminadas sin reescribir inmediatamente su archivo.", whyItMatters: "Reduce write amplification en cambios selectivos y habilita optimizaciones y concurrencia compatibles." },
      { term: "Row-level concurrency", definition: "Capacidad de resolver conflictos de escrituras sobre filas distintas en lugar de todo el archivo.", whyItMatters: "Mejora throughput de MERGE, UPDATE y DELETE concurrentes cuando se cumplen los requisitos de tabla." },
      { term: "Purga física", definition: "Reescritura y eliminación posterior de archivos que aún contienen bytes de filas lógicamente borradas.", whyItMatters: "Una eliminación lógica rápida no satisface por sí sola requisitos de borrado físico o reducción de almacenamiento." },
    ],
    workedScenario: {
      situation: "Una tabla de perfiles de 18 TB recibe cuatro MERGE concurrentes por región y solicitudes de borrado; reescribir archivos causa conflictos y 9 TB diarios de write amplification.",
      reasoning: [
        "Verificar que tabla, runtime y todos los lectores soportan deletion vectors y row tracking, y separar SLA lógico de SLA de purga física.",
        "Habilitar las features en un clon de ensayo, reproducir concurrencia y medir conflictos, archivos reescritos, latencia de lectura y duración de MERGE.",
        "Programar REORG para rangos elegibles y VACUUM tras la retención aprobada, auditando que ningún stream ni rollback depende de versiones eliminadas.",
      ],
      outcome: "Los conflictos caen drásticamente y el DML termina cuatro veces antes; un proceso gobernado completa el borrado físico sin romper time travel operativo.",
    },
  },
  m24_5: {
    mentalModel: "Predictive optimization convierte el mantenimiento de tablas administradas por Unity Catalog en un bucle de control gestionado. La plataforma observa actividad y decide cuándo ejecutar OPTIMIZE, VACUUM y ANALYZE para mejorar layout, retirar archivos no referenciados y mantener estadísticas, en vez de exigir calendarios idénticos para miles de tablas. No es un botón que elimina responsabilidad: sólo opera sobre objetos elegibles, consume recursos serverless y debe convivir con retención, lectores y políticas. Su ventaja es ajustar frecuencia a la necesidad real. El ingeniero conserva el contrato: habilitación, observabilidad, compatibilidad, excepciones y retirada de jobs manuales que duplicarían trabajo o competirían con el servicio.",
    mechanics: [
      "En tablas administradas elegibles, predictive optimization usa telemetría para lanzar operaciones de mantenimiento. OPTIMIZE compacta y, con liquid clustering, agrupa incrementalmente; ANALYZE actualiza estadísticas que ayudan al optimizador; VACUUM retira archivos que ya no están referenciados y superan retención. La ejecución se registra y puede monitorizarse mediante system tables o historial disponible. La selección automática de claves con CLUSTER BY AUTO también depende de predictive optimization. No actúa igual sobre tablas externas, formatos o regiones no compatibles, por lo que la elegibilidad se verifica explícitamente.",
      "Mantener a la vez jobs programados de OPTIMIZE puede duplicar reescrituras y coste; tras habilitar se desactivan de forma controlada y se observa el servicio. Una retención agresiva sigue amenazando streams atrasados o time travel, y el hecho de que VACUUM sea automático no redefine requisitos legales. Algunas tablas críticas pueden necesitar ventanas o estrategias especiales. La evaluación compara coste total de mantenimiento, archivos pequeños, skipping, frescura de estadísticas y fallos antes y después, con un plan de excepción documentado.",
    ],
    concepts: [
      { term: "Tabla administrada elegible", definition: "Tabla gobernada por Unity Catalog cuya propiedad y características permiten mantenimiento automático por la plataforma.", whyItMatters: "Predictive optimization no es una solución universal para tablas externas o configuraciones incompatibles." },
      { term: "ANALYZE", definition: "Operación que recopila estadísticas utilizadas por el optimizador para estimar tamaños y cardinalidades.", whyItMatters: "Mejora decisiones de join y planificación; estadísticas obsoletas pueden producir planes frágiles." },
      { term: "Bucle de mantenimiento", definition: "Ciclo que observa uso, ejecuta optimización y vuelve a medir el estado de la tabla.", whyItMatters: "Adapta frecuencia a actividad real en lugar de aplicar calendarios fijos a todas las tablas." },
    ],
    workedScenario: {
      situation: "Una plataforma mantiene 3.800 tablas con jobs nocturnos idénticos; 70 % no cambia a diario y las tablas activas acumulan archivos pequeños antes de la ventana.",
      reasoning: [
        "Inventariar elegibilidad, retención, lectores y coste actual por tabla, distinguiendo mantenimiento inútil de retraso en tablas calientes.",
        "Habilitar predictive optimization por un dominio piloto, retirar gradualmente sus jobs duplicados y registrar operaciones automáticas y métricas de layout.",
        "Comparar coste, tamaño de archivos, pruning, estadísticas y SLA durante un ciclo completo, manteniendo excepciones para contratos no compatibles.",
      ],
      outcome: "El mantenimiento se concentra cuando aporta valor, baja 37 % el gasto asociado y mejoran las tablas calientes sin calendarios manuales por objeto.",
    },
  },
  m25_1: {
    mentalModel: "Elegir compute es elegir un contrato operativo, no una talla de máquina. Serverless entrega capacidad gestionada con arranque, escalado y actualizaciones abstraídos; un SQL warehouse ofrece un endpoint gobernado y concurrente para SQL y BI; el compute clásico expone familias de instancia, driver, workers, runtime y políticas para workloads que necesitan ese control. Las tres opciones ejecutan trabajo, pero difieren en APIs admitidas, aislamiento, latencia de preparación, responsabilidad de operación y forma de facturación. El punto de partida son las propiedades del workload: lenguaje, estado, duración, concurrencia, dependencias, red privada, previsibilidad y SLA. La preferencia personal por un tipo de clúster no es un requisito técnico.",
    mechanics: [
      "Serverless aprovisiona recursos administrados por Databricks para tareas compatibles y reduce decisiones de infraestructura; la plataforma gestiona runtime y capacidad dentro de sus límites. Un SQL warehouse separa el endpoint de consulta de los clientes y aplica colas, autoscaling y Photon para concurrencia SQL. El compute clásico crea driver y executors con configuración explícita, útil cuando se requieren bibliotecas, runtimes, topología o conectividad no cubiertos por serverless. La matriz de compatibilidad y el modo de acceso deben verificarse antes de asumir equivalencia funcional.",
      "La abstracción gestionada reduce toil, pero puede limitar ajustes de Spark, versiones o acceso de red; el control clásico aumenta responsabilidad por arranque, políticas, actualizaciones y sobredimensionamiento. Un warehouse interactivo optimiza latencia y concurrencia, mientras un job largo puede priorizar coste por trabajo. Se construye una tabla de decisión con requisitos obligatorios y luego se ensaya el candidato con SLA, concurrencia, seguridad y coste real. La portabilidad del código no garantiza portabilidad del entorno ni de las credenciales.",
    ],
    concepts: [
      { term: "Contrato de compute", definition: "Conjunto de capacidades, límites y responsabilidades operativas asociado a una modalidad de ejecución.", whyItMatters: "Evita elegir sólo por nombre o precio cuando una API, red o dependencia puede bloquear el workload." },
      { term: "SQL warehouse", definition: "Recurso de compute orientado a consultas SQL, BI y concurrencia mediante un endpoint administrado.", whyItMatters: "Aísla clientes del ciclo de vida del compute y ofrece controles específicos de cola y escalado." },
      { term: "Compute clásico", definition: "Compute con driver, workers, runtime y configuración de infraestructura explícitos.", whyItMatters: "Aporta control para requisitos especiales a cambio de mayor operación y riesgo de dimensionamiento." },
    ],
    workedScenario: {
      situation: "Una empresa debe ejecutar ingestión Python con una librería nativa, dashboards de 300 usuarios y transformaciones SQL horarias, todo bajo un catálogo común.",
      reasoning: [
        "Separar requisitos: la librería y red de ingestión, concurrencia interactiva de BI y compatibilidad serverless de las transformaciones, sin imponer un único compute.",
        "Asignar compute clásico gobernado a la ingestión, un SQL warehouse autoscaling a BI y serverless jobs al SQL compatible; definir identidades por workload.",
        "Probar rutas de datos, picos, arranque, coste por ejecución y permisos, y documentar una alternativa si una capability serverless cambia de disponibilidad.",
      ],
      outcome: "Cada carga obtiene el contrato adecuado, los dashboards dejan de competir con ETL y el equipo elimina un clúster compartido que era caro y difícil de gobernar.",
    },
  },
  m25_2: {
    mentalModel: "Dimensionar compute clásico es equilibrar un sistema distribuido con dos escalas distintas: recursos por tarea y número de tareas simultáneas. La memoria que necesita una partición determina si cada executor puede completar su operador; el número de cores y executors determina cuánto paralelismo se materializa. El driver tiene otra función: planifica, coordina, recopila metadatos y puede colapsar aunque los workers estén ociosos si el código hace collect o crea un plan enorme. Una máquina mayor no sustituye un buen particionado, y más workers no arreglan una tarea indivisible. Se mide primero el cuello de botella con CPU, I/O, spill, GC, distribución de tareas y presión del driver.",
    mechanics: [
      "Spark asigna tareas a slots basados en cores y ejecutors; cada tarea procesa normalmente una partición y comparte recursos del executor. Escalar horizontalmente aumenta slots y ancho de banda agregado, siempre que existan suficientes particiones y la fuente permita paralelismo. Escalar verticalmente aporta más memoria y CPU por executor, útil para particiones legítimamente grandes, pero puede ampliar pausas de GC o reducir aislamiento. El driver necesita capacidad acorde a número de tareas, tamaño del plan y resultados coordinados, no al volumen total de datos almacenados.",
      "Una etapa CPU-bound con utilización alta puede beneficiarse de más cores; una etapa con espera de almacenamiento exige revisar throughput y tamaños de archivo; spill por skew exige redistribución. Autoscaling reacciona a demanda, pero no elimina el tiempo de adquisición ni acelera una única etapa secuencial. El ensayo usa el volumen pico y registra utilización por nodo, máximo y mediana de tarea, coste, duración y errores. La configuración elegida se codifica en una policy y conserva margen para variación, evitando optimizar al límite de una muestra.",
    ],
    concepts: [
      { term: "Escalado horizontal", definition: "Aumento del número de workers o executors para disponer de más slots y throughput agregado.", whyItMatters: "Sólo acelera si el plan ofrece paralelismo y la etapa no depende de una tarea caliente o secuencial." },
      { term: "Escalado vertical", definition: "Uso de nodos con más CPU o memoria por proceso de ejecución.", whyItMatters: "Puede hacer caber particiones grandes, pero aumenta coste unitario y no corrige distribución deficiente." },
      { term: "Presión del driver", definition: "Carga de planificación, metadatos o resultados que consume memoria y CPU del proceso coordinador.", whyItMatters: "Un driver puede fallar aunque los executors tengan recursos; collect y planes enormes son señales distintas." },
    ],
    workedScenario: {
      situation: "Un job tiene workers al 35 % de CPU, driver al 98 %, millones de tareas diminutas y pausas largas antes de iniciar etapas; añadir diez workers no mejora el tiempo.",
      reasoning: [
        "Separar tiempo de planificación y ejecución, medir número de tareas y revisar el código por collect, loops que crean unions y archivos excesivamente pequeños.",
        "Compactar entradas, simplificar el plan y eliminar recopilaciones; dimensionar el driver por la coordinación restante antes de aumentar workers.",
        "Ejecutar con varias escalas, verificando tiempo de driver, throughput de workers, coste y que el resultado conserve recuentos y esquema.",
      ],
      outcome: "El plan inicia en segundos, la CPU de workers se usa de forma efectiva y el job baja de 80 a 26 minutos con menos nodos, no con un clúster mayor.",
    },
  },
  m25_3: {
    mentalModel: "Serverless mueve el control desde nodos individuales hacia objetivos de servicio. El ingeniero ya no elige cada instancia ni un init script arbitrario; expresa el tipo de workload, sus dependencias compatibles, paralelismo y límites, y evalúa latencia, coste y estabilidad como propiedades observadas. Los modos de rendimiento intercambian rapidez de provisión y respuesta por consumo, mientras los entornos versionados reducen variación de runtime. En streaming, el tamaño de microbatch conecta dos mundos: lotes grandes aprovechan throughput pero elevan latencia y estado temporal; lotes pequeños reaccionan antes pero pagan más overhead. La ausencia de clúster visible no elimina decisiones de diseño, sólo cambia las palancas permitidas.",
    mechanics: [
      "Serverless asigna capacidad de una flota administrada y aplica un entorno compatible al workload; las opciones expuestas dependen del producto y la región. El autoscaling responde a backlog y demanda sin que el usuario configure workers concretos. En jobs y pipelines se observan tiempos de setup, ejecución y espera por separado. Las dependencias deben declararse mediante mecanismos admitidos y fijarse para reproducibilidad; configuraciones Spark o acceso local que funcionaban en compute clásico pueden estar restringidos. Query Profile y system tables sustituyen parte de la inspección de hosts.",
      "Elegir un modo más rápido puede reducir SLA y coste total si acorta capacidad activa, pero también puede incrementar tarifa o resultar innecesario en batch nocturno. Para streaming, maxBytesPerTrigger u otros límites controlan trabajo por microbatch; restringir demasiado impide alcanzar la fuente y ampliar demasiado empeora latencia y riesgo. Se mide input rate, processing rate, backlog, duración, coste y errores bajo picos. Las optimizaciones deben mantenerse dentro de APIs soportadas, con rollback de configuración y entorno fijado.",
    ],
    concepts: [
      { term: "Entorno serverless", definition: "Conjunto versionado de runtime y dependencias compatibles usado por el compute administrado.", whyItMatters: "Aporta reproducibilidad sin control de imagen completa y obliga a declarar dependencias de forma soportada." },
      { term: "Backlog", definition: "Trabajo disponible que aún no ha sido procesado por el servicio.", whyItMatters: "Guía escalado y muestra si el throughput sostenido alcanza la tasa de entrada." },
      { term: "Límite de microbatch", definition: "Restricción de datos procesados en cada disparo de un stream.", whyItMatters: "Equilibra latencia, throughput, estado, coste y capacidad de recuperación tras una interrupción." },
    ],
    workedScenario: {
      situation: "Un stream serverless recibe normalmente 80 GB/h y picos de 700 GB/h. Tras un pico, cada microbatch dura 22 minutos y el dashboard de fraude queda atrasado dos horas.",
      reasoning: [
        "Comparar input rate, processing rate, backlog y duración por batch para confirmar que el límite y el estado, no la fuente, forman el cuello.",
        "Ensayar límites mayores y un modo de rendimiento apropiado en un replay controlado, comprobando memoria de estado, SLA y coste por GB procesado.",
        "Fijar entorno y parámetros validados, añadir alertas de backlog y definir un modo temporal de catch-up que se retira al recuperar el estado estable.",
      ],
      outcome: "El pipeline absorbe el pico en 38 minutos sin perder garantías; el modo acelerado se activa sólo durante catch-up y el coste normal permanece estable.",
    },
  },
  m25_4: {
    mentalModel: "Una policy es una barandilla ejecutable: transforma estándares de coste, seguridad y soporte en opciones permitidas antes de que nazca el compute. No reemplaza RBAC ni decide quién puede leer datos; limita cómo se configura la infraestructura, por ejemplo runtime, familia, Photon, autoscaling, autotermination o tags. En serverless, una usage policy sirve para atribuir consumo según metadatos y contexto disponibles, no para insertar secretos en etiquetas. La buena gobernanza ofrece caminos aprobados para clases de workload, con defaults sensatos y límites explícitos. Una policy demasiado abierta no controla; una demasiado rígida provoca excepciones manuales y equipos que mezclan cargas incompatibles en un único recurso.",
    mechanics: [
      "Las compute policies expresan reglas JSON sobre atributos de la API: valores fijos, permitidos, rangos, defaults u opciones prohibidas. El usuario necesita permiso para usar la policy y sólo puede crear configuraciones dentro del contrato. Las reglas pueden imponer autotermination, familias, límites de workers, runtimes y tags técnicos; algunos valores pueden ocultarse. Las usage policies para serverless permiten clasificar y atribuir el uso según políticas de cuenta. Después, system.billing.usage expone usage_metadata, identity_metadata y custom_tags para análisis gobernado.",
      "Una etiqueta viaja a telemetría y facturación, por lo que no debe contener nombres de clientes, datos personales ni credenciales. Tags opcionales se degradan rápido; campos obligatorios sin taxonomía generan valores inconsistentes. Se diseñan pocas categorías estables como cost_center, environment y workload_class, con propietarios y catálogo. Las excepciones requieren caducidad y evidencia. Se prueba creación permitida y denegada, atribución en system tables y experiencia del usuario; después se revisan policies cuando cambian runtimes y capacidades.",
    ],
    concepts: [
      { term: "Compute policy", definition: "Conjunto de reglas que limita y predetermina atributos al crear compute clásico.", whyItMatters: "Previene configuraciones inseguras o costosas sin depender de revisión manual posterior." },
      { term: "Usage policy", definition: "Mecanismo de clasificación y atribución del consumo de productos serverless.", whyItMatters: "Permite FinOps cuando no existe un clúster propio al que adjuntar tags tradicionales." },
      { term: "Taxonomía de coste", definition: "Vocabulario controlado de dimensiones como centro, entorno, producto y clase de workload.", whyItMatters: "Hace que la atribución sea agregable y evita cientos de etiquetas equivalentes o sensibles." },
    ],
    workedScenario: {
      situation: "Ciento veinte equipos crean compute con runtimes obsoletos, sin autoterminación y tags libres que incluyen nombres de clientes; el 34 % del uso no puede atribuirse.",
      reasoning: [
        "Definir clases aprobadas de desarrollo, job y excepción, con límites de workers, runtime soportado, autotermination y una taxonomía no sensible obligatoria.",
        "Implementar y probar policies con grupos piloto, y usage policies para serverless, verificando tanto rechazos como rutas válidas de autoservicio.",
        "Consultar billing para medir cobertura de atribución, corregir valores y establecer caducidad y revisión para excepciones documentadas.",
      ],
      outcome: "La atribución alcanza 98 %, desaparece compute huérfano y los equipos conservan autoservicio mediante tres plantillas claras en vez de solicitudes manuales.",
    },
  },
  m25_5: {
    mentalModel: "FinOps no intenta minimizar cada factura aislada; optimiza el coste de entregar valor con fiabilidad. En Databricks, los registros de uso son hechos temporales que deben unirse con precios efectivos, metadatos de identidad y recursos, y resultados del workload. Las horas de clúster son una aproximación pobre para serverless, autoscaling, tarifas cambiantes o correcciones. system.billing.usage incluye cantidades y metadatos, pero un registro puede ser una retracción o corrección y no todo consumo se atribuye igual. La unidad útil es coste por pipeline exitoso, tabla publicada, terabyte procesado o consulta con SLA. Esa normalización separa crecimiento sano del derroche y evita premiar jobs baratos que fallan.",
    mechanics: [
      "Los registros de billing contienen tiempo, SKU, unidad y cantidad de uso, además de estructuras de resource, identity y tags según producto. Para convertir uso en importe se aplica el precio válido durante el intervalo, respetando moneda, vigencia y posibles precios negociados disponibles. Los registros de corrección pueden anular o reemplazar uso anterior; sumar ingenuamente sólo positivos sobrestima coste. La atribución enlaza IDs de jobs, warehouses o compute con system tables operativas y distribuye costes compartidos mediante una regla explícita.",
      "Un dashboard sin reconciliación produce falsa precisión. Primero se iguala el total con la fuente oficial por período; después se clasifica cobertura, coste compartido y desconocido. Optimizar por unidad exige denominadores confiables: ejecuciones correctas, filas publicadas o SLA alcanzado. Coste menor con más retries puede ser peor. Se muestran tendencia, presupuesto, anomalía y confianza de atribución, y cada acción conserva propietario y verificación. Las etiquetas apoyan el análisis, pero identidad y usage_metadata suelen ser más estables para serverless.",
    ],
    concepts: [
      { term: "Registro de corrección", definition: "Entrada de facturación que retracta o ajusta una cantidad publicada previamente.", whyItMatters: "Debe netearse correctamente para no duplicar uso ni mostrar ahorros ficticios." },
      { term: "Coste unitario", definition: "Importe dividido por una unidad de valor o trabajo comparable.", whyItMatters: "Distingue aumento de gasto por crecimiento de una regresión de eficiencia." },
      { term: "Cobertura de atribución", definition: "Porcentaje del coste asignado de forma trazable a propietario, producto o workload.", whyItMatters: "Expone cuánto del dashboard es accionable y cuánto permanece compartido o desconocido." },
    ],
    workedScenario: {
      situation: "El gasto sube 42 % y dirección exige recortar, pero el volumen procesado se duplicó y un job crítico repite ejecuciones fallidas que no publica datos.",
      reasoning: [
        "Reconciliar usage con precios y correcciones, y unir IDs de job con runs para separar crecimiento de volumen, fallos y capacidad compartida.",
        "Calcular coste por TB publicado correctamente y por ejecución exitosa, mostrando retries y gasto no atribuido como dimensiones independientes.",
        "Priorizar el job con reintentos, validar su causa y medir ahorro real tras la corrección sin reducir el SLA de las cargas eficientes.",
      ],
      outcome: "El equipo evita un recorte indiscriminado, elimina 19 % de gasto improductivo y demuestra que el resto del aumento corresponde a mejor coste unitario con más volumen.",
    },
  },
  m26_1: {
    mentalModel: "Spark UI es una reconstrucción causal de una ejecución. Un job nace de una acción; cada job contiene stages separados por exchanges; cada stage ejecuta tareas equivalentes sobre particiones; los executors aportan procesos, memoria y cores. Leer de arriba abajo evita saltar a una métrica llamativa sin contexto. Primero se identifica el camino crítico, después la etapa dominante, luego la distribución por tarea y finalmente el recurso que explica esa distribución. El plan SQL conecta esas métricas con operadores y datos de negocio. Una hipótesis completa suena así: este join produce un shuffle, una clave concentra bytes, cinco tareas derraman a disco y determinan la duración. No basta decir que el clúster está lento.",
    mechanics: [
      "La pestaña Jobs muestra acciones y DAG; Stages presenta input, output, shuffle, spill, GC y distribuciones de tareas; Executors resume memoria, tareas, fallos y actividad por proceso; SQL/DataFrame vincula operadores al plan. Un stage retry puede crear varios attempts y los acumulados deben interpretarse sin mezclar intentos. Los percentiles y máximos revelan colas que los totales ocultan. El event timeline ayuda a distinguir trabajo, espera, fetch y GC. La correlación con una consulta o run ID conserva trazabilidad entre UI y orquestación.",
      "La UI de una ejecución individual no sustituye tendencias históricas y puede desaparecer según retención. Guardar sólo capturas pierde datos estructurados y contexto. Durante un incidente se registra application ID, run ID, stage y attempt, timestamps, plan y métricas clave. Se modifica una variable por vez, se repite con entrada comparable y se confirma corrección del resultado. CPU baja puede significar I/O, falta de tareas, cola o espera remota; se verifica con etapas y executors antes de escalar.",
    ],
    concepts: [
      { term: "Stage", definition: "Conjunto de tareas que pueden ejecutarse sin un nuevo shuffle y comparten el mismo plan físico local.", whyItMatters: "Sitúa la frontera donde cambian distribución y dependencia, permitiendo localizar el camino crítico." },
      { term: "Task attempt", definition: "Ejecución concreta de una tarea, incluida una repetición tras fallo o especulación.", whyItMatters: "Mezclar intentos puede inflar métricas y ocultar que la fiabilidad, no el volumen, causa el tiempo." },
      { term: "Camino crítico", definition: "Cadena de etapas y tareas que determina el tiempo mínimo de finalización del job.", whyItMatters: "Optimizar trabajo paralelo fuera de esa cadena puede no mejorar el SLA." },
    ],
    workedScenario: {
      situation: "Un job dura 55 minutos; el dashboard de clúster muestra CPU media de 22 %, pero una etapa final consume 41 minutos y tiene tres attempts.",
      reasoning: [
        "Abrir el job y aislar la etapa crítica por attempt, distinguiendo tiempo original de reintentos y observando distribución de tareas y fetch failures.",
        "Vincular el stage al exchange del plan y revisar executors perdidos, shuffle fetch, spill y skew para formular una causa verificable.",
        "Corregir la estabilidad del shuffle, repetir con el mismo snapshot y comparar attempts, máximo de tarea, duración y recuento final.",
      ],
      outcome: "Se identifica almacenamiento local insuficiente en dos executors, desaparecen reintentos y el job termina en 17 minutos sin confundir CPU media con capacidad faltante.",
    },
  },
  m26_2: {
    mentalModel: "Query Profile es el mapa de tiempo y movimiento de una consulta en compute administrado. La latencia total se descompone en cola, preparación y ejecución; dentro de la ejecución, cada operador consume filas, bytes, CPU y tiempo y produce otros. Esa separación es esencial: escalar un warehouse no arregla una expresión ineficiente si el cuello está en ejecución, y reescribir SQL no elimina una cola causada por concurrencia. El perfil permite seguir el flujo desde scan y pruning hasta joins, aggregations y write, observar Photon y detectar explosiones de cardinalidad. El operador con más tiempo no siempre es la causa original: puede procesar el exceso generado por un join anterior.",
    mechanics: [
      "En SQL warehouses y serverless, el perfil registra fases de consulta y un DAG de operadores. Los scans muestran archivos o bytes leídos y podados; joins revelan estrategias y filas; nodos posteriores muestran agregación, sort o escritura. Execution Details distingue tiempo de tareas en Photon. La historia de consultas aporta statement_id, estado, tiempos y compute para conectar una ejecución con el perfil. La comparación válida usa el mismo resultado, parámetros, estado de caché y concurrencia, porque una consulta repetida puede beneficiarse de datos ya disponibles.",
      "Reducir queue time implica capacidad, autoscaling o gestión de demanda; reducir compilation requiere planes más manejables; reducir execution exige menos datos, mejor layout o operadores. Un join que multiplica filas puede hacer que el sort final aparezca dominante, pero la causa es cardinalidad. Se recorren filas de entrada y salida, se identifica el primer salto anormal y se valida la semántica de claves. La optimización se confirma con P50 y P95, bytes leídos, pruning, coste y porcentaje Photon, no con una captura aislada.",
    ],
    concepts: [
      { term: "Queue time", definition: "Intervalo en que una consulta espera capacidad antes de comenzar su ejecución.", whyItMatters: "Se corrige con concurrencia y capacidad, no necesariamente cambiando el SQL." },
      { term: "Cardinality explosion", definition: "Aumento inesperado de filas provocado por joins no únicos, explode u otra operación multiplicativa.", whyItMatters: "Hace costosos todos los operadores posteriores y puede apuntar a un error de semántica." },
      { term: "Statement ID", definition: "Identificador único de una ejecución de sentencia en el historial de consultas.", whyItMatters: "Une evidencia de system tables, interfaz, alertas y diagnóstico reproducible." },
    ],
    workedScenario: {
      situation: "Un dashboard tarda 48 segundos en hora punta y 9 fuera de ella. El sort final figura como operador más lento y se propone reescribir ORDER BY.",
      reasoning: [
        "Separar queue de execution por statement_id y comprobar que 23 segundos son cola, mientras el plan además multiplica filas en un join de dimensiones no únicas.",
        "Corregir la unicidad de la dimensión y ajustar capacidad o autoscaling para el pico, tratando por separado las dos causas observadas.",
        "Comparar P95, filas tras join, bytes, cola y coste durante el mismo patrón horario, validando que el orden de resultados permanece correcto.",
      ],
      outcome: "La consulta queda en 6 segundos P95; el análisis evita una optimización cosmética del sort y resuelve tanto cardinalidad como concurrencia.",
    },
  },
  m26_3: {
    mentalModel: "Las system tables son el plano histórico de observabilidad de la cuenta. Cada esquema registra una perspectiva: billing describe consumo, query history sentencias, lakeflow jobs y tasks, compute configuraciones, access auditoría y lineage relaciones inferidas. Ninguna tabla cuenta por sí sola el incidente completo. El trabajo conceptual consiste en construir una línea de tiempo con identificadores, región y granularidad compatibles, y aceptar que algunas relaciones son opcionales o parciales. Son datos sensibles y gobernados dentro del catálogo system, con retención y disponibilidad propias. Una consulta selectiva por tiempo y workspace protege rendimiento; copiar todo fuera de la plataforma amplía superficie de riesgo y suele ser innecesario.",
    mechanics: [
      "Las tablas se habilitan y se consultan mediante Unity Catalog; los permisos USE CATALOG, USE SCHEMA y SELECT controlan acceso. billing.usage es global, mientras varias tablas operativas y de auditoría son regionales; los joins deben respetar esa diferencia. query.history incluye SQL warehouse y serverless, y lakeflow expone definiciones y timelines de runs. Clusters actúa como dimensión lentamente cambiante. Los IDs de workspace, job, run, task, statement o cluster sirven de puentes, pero los metadatos disponibles varían por producto y fecha.",
      "Lineage es inferido y no garantiza un registro para toda operación; audit describe eventos de control y acceso, no rendimiento; billing puede llegar con correcciones. Se preservan hechos crudos, luego se construyen vistas curadas con claves, ventanas temporales y calidad conocida. Las consultas deben filtrar fecha y región para evitar límites por volumen. La retención, actualmente normalmente de un año para muchas tablas, no sustituye una política propia cuando se exige análisis más largo. El acceso al dashboard debe enmascarar identidades según audiencia.",
    ],
    concepts: [
      { term: "Granularidad", definition: "Unidad que representa cada fila, como uso horario, sentencia, tarea, evento o relación de linaje.", whyItMatters: "Unir granos incompatibles sin agregación duplica métricas y produce conclusiones falsas." },
      { term: "Ámbito regional", definition: "Cobertura limitada a eventos o recursos de una región, a diferencia de tablas globales de cuenta.", whyItMatters: "Explica ausencias y obliga a consultar o consolidar regiones de forma explícita." },
      { term: "Dimensión lentamente cambiante", definition: "Historial de versiones de atributos de una entidad a lo largo del tiempo.", whyItMatters: "Permite asociar un run con la configuración de compute vigente entonces, no con la actual." },
    ],
    workedScenario: {
      situation: "El gasto de un workspace sube de madrugada y hay que saber qué cambio de job, consulta e identidad lo produjo tres semanas atrás.",
      reasoning: [
        "Filtrar billing por workspace, hora y SKU, netear correcciones y extraer resource metadata antes de unir a cualquier timeline.",
        "Relacionar IDs con runs de Lakeflow, query history y configuración histórica de compute, preservando granos para no duplicar el importe.",
        "Consultar audit y lineage alrededor del despliegue para identificar actor y tablas afectadas, marcando huecos donde la inferencia no aporta evidencia.",
      ],
      outcome: "La línea de tiempo atribuye el aumento a un backfill desplegado por un principal de servicio y demuestra qué tablas tocó, cuánto costó y cuándo fue retirado.",
    },
  },
  m26_4: {
    mentalModel: "Los logs se eligen por frontera de fallo. El event log de Spark describe eventos estructurados de aplicación y permite reconstruir jobs, stages y executors; el driver log contiene coordinación, stack traces del proceso principal y salida de usuario; el executor log contiene fallos dentro de tareas y procesos distribuidos. Mirar el archivo equivocado produce silencio o ruido. El modo de acceso determina quién puede ver logs y la retención local puede terminar al cerrar compute, por lo que incidentes críticos requieren entrega gobernada. Un log no es una fuente inocua: puede incluir rutas, parámetros, consultas o datos, así que permisos y redacción forman parte de observabilidad.",
    mechanics: [
      "El driver crea el SparkContext, construye planes y coordina tareas; errores antes de distribuir trabajo o un collect fallido aparecen allí. Los executors ejecutan particiones, de modo que una excepción sólo para ciertos datos se repite en sus logs y se correlaciona con task attempt. El Spark event log serializa eventos para reconstruir la UI después de la ejecución. Lakeflow pipeline event logs son otra fuente tabular específica del pipeline, no deben confundirse con logs del proceso. La configuración de entrega y la ACL se decide antes del incidente.",
      "Más logging puede exponer datos y aumentar volumen; menos logging puede impedir RCA. Se definen niveles por entorno, redacción de secretos, ubicación con retención y grupos de acceso. Durante diagnóstico se usa timestamp, run, application, stage y task para recortar el intervalo, en lugar de descargar todo. Una excepción de executor puede ser efecto de un dato corrupto, memoria o biblioteca; se conserva stack trace y partición antes de reintentar. Las evidencias materiales se enlazan al incidente con hash o ruta auditada.",
    ],
    concepts: [
      { term: "Spark event log", definition: "Secuencia estructurada de eventos de una aplicación usada para reconstruir su ejecución y Spark UI.", whyItMatters: "Permite análisis posterior aunque el compute ya no exista, si se configuró persistencia adecuada." },
      { term: "Driver log", definition: "Salida y errores del proceso que planifica, coordina y ejecuta código local de la aplicación.", whyItMatters: "Es la fuente para fallos de inicialización, planificación, librerías del driver y recopilación de resultados." },
      { term: "Executor log", definition: "Salida y excepciones de los procesos que ejecutan tareas sobre particiones distribuidas.", whyItMatters: "Localiza errores dependientes de datos, memoria o entorno que sólo ocurren en ciertos workers." },
    ],
    workedScenario: {
      situation: "Un job falla una de cada veinte veces con Python worker exited unexpectedly; el driver sólo muestra que una etapa abortó tras cuatro reintentos.",
      reasoning: [
        "Usar stage y task attempts del driver para localizar los executor logs exactos y comprobar si la misma partición y stack trace reaparecen.",
        "Preservar event log y muestra mínima del input problemático en una ubicación gobernada, redacting valores sensibles antes de compartir evidencia.",
        "Reproducir sobre esa partición, corregir la dependencia o dato, y verificar que nuevos runs no generan attempts ni errores equivalentes.",
      ],
      outcome: "Se descubre una biblioteca nativa ausente sólo en executors; la dependencia se empaqueta correctamente y el event log confirma estabilidad durante el pico.",
    },
  },
  m26_5: {
    mentalModel: "Una captura de diagnóstico automatizada debe ser una caja negra mínima, no una copia indiscriminada de la cuenta. Parte de un identificador de incidente y un intervalo, obtiene metadatos reproducibles mediante CLI o REST, sigue paginación y registra qué petición produjo cada artefacto. La autenticación representa una identidad de servicio con privilegios mínimos; el token nunca se imprime ni se almacena junto a la evidencia. Las APIs son eventualmente consistentes, versionadas y sujetas a límites, por lo que reintentos con backoff y marcadores de página son parte del mecanismo. El objetivo es preservar contexto suficiente para reconstruir la causa sin ampliar innecesariamente exposición de consultas, usuarios o datos.",
    mechanics: [
      "La Databricks CLI usa APIs y perfiles de autenticación para listar y obtener jobs, runs, compute u otros recursos. Las REST collections devuelven páginas con tokens o indicadores de continuación; ignorarlos produce una muestra truncada que parece completa. La captura almacena timestamp UTC, workspace, endpoint lógico, parámetros no secretos, código de respuesta y versión del cliente. Para llamadas transitorias se aplican reintentos acotados y jitter, pero un 403 no se resuelve reintentando: indica permiso o alcance incorrecto.",
      "Un principal demasiado privilegiado facilita la captura, pero convierte el paquete en riesgo. Se concede lectura sólo de recursos y system tables necesarios, se cifra el destino y se aplica retención. Los payloads se filtran para excluir tokens, parámetros sensibles y cuerpos de notebooks si no son imprescindibles. Cada archivo lleva checksum y manifest; así la investigación distingue datos originales de anotaciones. La automatización se prueba regularmente, porque descubrir paginación rota durante un incidente elimina justo la evidencia histórica necesaria.",
    ],
    concepts: [
      { term: "Paginación", definition: "División de una colección API en respuestas enlazadas mediante tokens, offsets o indicadores de continuación.", whyItMatters: "No recorrer todas las páginas crea diagnósticos incompletos y sesga recuentos o timelines." },
      { term: "Backoff con jitter", definition: "Espera creciente y ligeramente aleatoria antes de repetir errores transitorios.", whyItMatters: "Reduce presión sobre el servicio y evita que múltiples clientes reintenten simultáneamente." },
      { term: "Manifest de evidencia", definition: "Índice que registra origen, tiempo, parámetros y checksum de cada artefacto capturado.", whyItMatters: "Aporta trazabilidad e integridad sin depender de nombres de archivo informales." },
    ],
    workedScenario: {
      situation: "Tras un incidente se descubre que el script guardó sólo los primeros 25 runs, imprimió el token en un log de CI y omitió la configuración del job vigente.",
      reasoning: [
        "Revocar la credencial expuesta y definir un principal de lectura mínima, almacenamiento cifrado y un manifest sin secretos.",
        "Implementar recorrido de páginas, retries sólo para fallos transitorios y captura de job settings, run output y referencias de logs dentro del intervalo.",
        "Probar contra más de cien runs y simular respuestas 429, 403 y páginas vacías, verificando conteo, checksums y ausencia de secretos.",
      ],
      outcome: "La nueva caja negra conserva evidencia completa y auditable en minutos, con permisos mínimos y una prueba automática que detecta truncamiento o filtración.",
    },
  },
  m27_1: {
    mentalModel: "Un incidente es un sistema de decisiones bajo incertidumbre. Antes de optimizar Spark o cambiar compute, el equipo necesita una imagen común: impacto, severidad, servicio afectado, inicio probable, propietario y condición de recuperación. El incident commander coordina y protege la línea temporal; quienes investigan prueban hipótesis; quien comunica mantiene informados a los consumidores. Separar funciones reduce cambios simultáneos y memoria contradictoria. El objetivo inmediato no es encontrar la explicación perfecta, sino restaurar el servicio con una mitigación reversible y evidencia suficiente. Cada acción debe declarar hipótesis, riesgo, señal esperada y rollback. Sin esa disciplina, aumentar recursos puede ocultar la causa, elevar coste y destruir la comparación necesaria para el análisis posterior.",
    mechanics: [
      "La severidad se deriva del impacto y urgencia, no de lo impresionante que parezca un stack trace. El timeline registra en UTC detección, cambios recientes, síntomas, decisiones, comandos o runs y resultados. El incident commander asigna un único owner a cada frente, limita el número de cambios y decide cuándo escalar. Los criterios de éxito son observables: backlog bajo cierto valor, datos publicados hasta una marca temporal, P95 dentro del SLO y validaciones correctas. Un canal y documento centrales evitan que contexto crítico quede disperso.",
      "Mitigar puede significar detener un productor, aislar una partición, reparar un run o escalar temporalmente, pero cada opción altera riesgo y evidencia. Un cambio reversible se aplica de uno en uno y se evalúa durante una ventana acordada. Si el problema afecta integridad, recuperar latencia sin validar datos no cierra el incidente. Al pasar de respuesta a recuperación se congela el timeline, se asignan backfills y se mantiene comunicación hasta cumplir todos los criterios, no sólo hasta que el dashboard vuelve a verde.",
    ],
    concepts: [
      { term: "Incident commander", definition: "Rol único que coordina prioridades, responsables, decisiones y comunicación durante la respuesta, sin necesitar ejecutar cada investigación técnica personalmente.", whyItMatters: "Evita órdenes contradictorias, cambios simultáneos y pérdida de una visión común del impacto y la recuperación." },
      { term: "Mitigación reversible", definition: "Cambio temporal cuyo efecto puede deshacerse rápidamente si no mejora las señales o introduce un riesgo nuevo.", whyItMatters: "Permite recuperar servicio con incertidumbre sin convertir una reacción urgente en deuda o daño permanente." },
      { term: "Criterio de recuperación", definition: "Condición medible que combina disponibilidad, latencia, integridad y frescura para declarar restaurado el servicio afectado.", whyItMatters: "Impide cerrar cuando sólo desaparece el error visible pero permanecen datos atrasados, incorrectos o consumidores rotos." },
    ],
    workedScenario: {
      situation: "A las 07:10, el pipeline de liquidación no publica la tabla gold de las 06:00; seis países esperan el dato, hay dos cambios recientes y el equipo propone simultáneamente reiniciar, escalar y restaurar la tabla.",
      reasoning: [
        "Declarar severidad alta, nombrar commander y responsables de datos, plataforma y comunicación, y fijar como éxito publicación íntegra hasta 06:00 con reconciliación financiera aprobada.",
        "Congelar cambios no esenciales, construir timeline con despliegues y runs, y elegir primero la mitigación reversible que conserva checkpoints y evidencia del fallo.",
        "Validar recuentos, importes y frescura tras recuperar, comunicar intervalos regulares y posponer cualquier tuning permanente hasta disponer de una causa demostrada.",
      ],
      outcome: "El servicio se recupera en cuarenta minutos sin duplicar liquidaciones; el equipo conserva evidencia suficiente para atribuir la regresión a un cambio concreto y evita tres acciones incompatibles.",
    },
  },
  m27_2: {
    mentalModel: "El rendimiento percibido es la composición de tres capas. La capa de plan y datos decide cuánto trabajo existe: scans, cardinalidad, shuffles, skew y layout. La capa de recursos decide con qué velocidad se ejecuta: CPU, memoria, I/O, red, spill y fallos. La capa de servicio decide cuándo puede comenzar y cuánto compite: colas, concurrencia, autoscaling y límites externos. Una métrica aislada pertenece sólo a una capa. CPU alta no demuestra código ineficiente; cola alta no se arregla con liquid clustering; bytes leídos bajos no excluyen un join explosivo. Triangular significa formular una hipótesis que prediga señales coherentes en las tres capas y descartarla si una de ellas contradice el relato.",
    mechanics: [
      "El plan y Query Profile revelan operadores, filas, bytes, pruning y estrategia; Spark UI aporta distribución por tareas, shuffle, spill y executors; system tables y métricas del endpoint aportan timeline de concurrencia, cola y coste. Se alinea todo por run o statement ID y timestamps, evitando comparar medias de ventanas diferentes. El primer salto de filas o bytes suele localizar la causa upstream, mientras el operador más lento puede ser sólo quien recibe el exceso. El camino crítico determina qué señal puede explicar el SLA.",
      "El diagnóstico usa experimentos que separan capas: ejecutar la misma entrada en una ventana sin concurrencia prueba demanda; conservar capacidad y cambiar layout prueba datos; cambiar tamaño con el mismo plan prueba recursos. Las cachés, autoscaling y volumen deben controlarse para que la comparación sea válida. Aumentar compute puede ser una mitigación legítima, pero se marca como temporal hasta demostrar que la carga necesita capacidad y no que un cambio de cardinalidad multiplicó trabajo evitable.",
    ],
    concepts: [
      { term: "Triangulación", definition: "Método que combina evidencia independiente de plan, recursos y demanda para aceptar o refutar una explicación causal del rendimiento.", whyItMatters: "Reduce diagnósticos basados en correlaciones parciales y dirige la mitigación hacia la capa que realmente limita el SLA." },
      { term: "Señal upstream", definition: "Métrica producida antes del operador lento que explica por qué éste recibió más trabajo, como una explosión de cardinalidad.", whyItMatters: "Corregir la causa temprana evita optimizar repetidamente operadores posteriores que sólo procesan el exceso generado." },
      { term: "Experimento controlado", definition: "Comparación que modifica una sola palanca relevante mientras mantiene entrada, resultado y condiciones restantes suficientemente equivalentes.", whyItMatters: "Permite atribuir una mejora a la acción realizada y no a caché, demanda o variación de volumen." },
    ],
    workedScenario: {
      situation: "Un dashboard pasa de ocho a sesenta segundos. El warehouse llega al máximo de tamaño, pero Query Profile muestra que un join reciente multiplica por doce las filas y la cola empieza después del despliegue.",
      reasoning: [
        "Alinear statement IDs, despliegue y concurrencia para comprobar que la explosión de filas alarga cada consulta y, como efecto secundario, satura capacidad y crea cola.",
        "Corregir la relación many-to-many mediante una dimensión única, validar semántica y ejecutar con el mismo tamaño y pico de usuarios antes de ampliar warehouse.",
        "Comparar filas, execution time, queue time, P95 y coste, retirando el escalado temporal sólo cuando la capacidad base absorba la demanda validada.",
      ],
      outcome: "La cardinalidad vuelve al contrato, desaparece la cola y el P95 queda en nueve segundos; la organización evita duplicar capacidad para compensar un defecto lógico.",
    },
  },
  m27_3: {
    mentalModel: "Recuperar fiabilidad significa reanudar desde una frontera conocida sin perder ni duplicar efectos. En Delta, una transacción hace atómica una escritura, pero no vuelve idempotente todo un pipeline: llamadas externas, múltiples tablas o claves de negocio deficientes pueden repetir resultados. En streaming, el checkpoint vincula progreso de fuente, estado y configuración; borrarlo equivale a olvidar lo procesado y exige un plan explícito. Un backfill es una nueva ejecución sobre un intervalo delimitado, no una excusa para releer toda la historia. El diseño seguro define claves, deduplicación, merge condition, versión de código, snapshot de entrada, orden con el stream activo y pruebas de reconciliación antes de publicar.",
    mechanics: [
      "Un checkpoint conserva offsets y estado para que Structured Streaming retome consistentemente; cambiar fuente, estado o determinadas opciones puede ser incompatible con ese directorio. Delta garantiza commits atómicos y control optimista, pero un retry de lógica no idempotente puede escribir otra fila válida. MERGE necesita una clave que identifique el efecto de negocio y una regla determinista para cambios repetidos. En Jobs, repair run reutiliza resultados exitosos y ejecuta tareas fallidas o dependientes según el grafo, reduciendo superficie frente a relanzar todo.",
      "Para backfill se fija intervalo semiabierto, zona temporal, versión del código y tabla destino o predicate de MERGE. Si el stream sigue activo, ambos escritores deben coordinarse mediante claves e idempotencia o usar una tabla de staging y swap controlado. Se valida no sólo count: claves duplicadas, sumas, límites temporales, CDF y consumidores. Restaurar una tabla puede introducir cambios que streams downstream interpretan como nuevos; el runbook debe considerar la cadena, no sólo el objeto reparado.",
    ],
    concepts: [
      { term: "Idempotencia", definition: "Propiedad por la que repetir una operación con la misma entrada produce el mismo estado observable sin efectos adicionales.", whyItMatters: "Permite retries y backfills seguros cuando fallos parciales hacen incierto qué parte llegó a completarse." },
      { term: "Frontera de recuperación", definition: "Punto verificable de offsets, versión, timestamp o commit desde el que puede reanudarse procesamiento de forma coherente.", whyItMatters: "Evita reinicios arbitrarios que crean huecos, duplicados o mezclan código e input de periodos distintos." },
      { term: "Repair run", definition: "Reejecución selectiva de tareas fallidas y dependientes dentro de un run, preservando resultados válidos cuando el grafo lo permite.", whyItMatters: "Reduce tiempo, coste y riesgo comparado con repetir un workflow completo ya parcialmente correcto." },
    ],
    workedScenario: {
      situation: "Un stream de pagos se detuvo durante tres horas después de escribir silver pero antes de actualizar una tabla gold y notificar un sistema externo; no está claro qué notificaciones salieron.",
      reasoning: [
        "Preservar checkpoint y commits, inventariar efectos por payment_id y separar la transacción Delta de la llamada externa, que requiere su propio registro idempotente.",
        "Reparar gold mediante MERGE con payment_id y ventana exacta, y reenviar sólo notificaciones sin acuse usando una outbox gobernada.",
        "Reanudar el stream desde su checkpoint, reconciliar bronze-silver-gold-outbox y vigilar duplicados y atraso antes de cerrar la recuperación.",
      ],
      outcome: "Se recuperan las tres horas sin duplicar cargos ni mensajes; la outbox convierte futuros retries en operaciones demostrablemente idempotentes y auditables.",
    },
  },
  m27_4: {
    mentalModel: "Durante un incidente, el coste es una restricción y una señal, no el objetivo principal. Escalar temporalmente puede ser la decisión más barata si reduce una interrupción costosa, pero debe llevar caducidad, propietario y criterio de retirada. Recortar compute mientras se recopila evidencia puede prolongar el fallo o borrar logs; dejarlo ampliado indefinidamente convierte mitigación en nueva línea base. El análisis une coste incremental con tiempo de recuperación, backlog, riesgo de integridad y valor del servicio. También distingue compute útil de retries fallidos, scans repetidos y backfills solapados. La disciplina FinOps del incidente consiste en gastar conscientemente para recuperar y volver después a una configuración medida, no en bloquear acciones urgentes por presupuesto horario.",
    mechanics: [
      "Se establece una línea base anterior con billing y métricas de workload, luego se etiqueta o registra el periodo del incidente y cambios de capacidad. Cada mitigación estima coste por hora, duración máxima y señal de salida. Usage y timelines permiten separar el recurso ampliado de reintentos y trabajos normales. Un límite presupuestario puede alertar, pero no debe cancelar automáticamente una reparación que protege integridad sin entender dependencias. El commander aprueba escalados extraordinarios y FinOps documenta el impacto después.",
      "La retirada requiere demostrar que el cuello permanente se resolvió o que la demanda base justifica capacidad. Si el equipo optimizó código, repite con tamaño previo y compara SLA; si sólo se drenó backlog, vuelve gradualmente al modo normal. Se eliminan workers, modos acelerados y schedules de emergencia codificados temporalmente. El postmortem expresa coste del incidente, coste de mitigación y coste evitado, señalando incertidumbre. Así se evita celebrar un ahorro que prolongó la indisponibilidad o esconder gasto bajo una configuración permanente.",
    ],
    concepts: [
      { term: "Coste incremental", definition: "Diferencia de gasto atribuible al incidente y sus mitigaciones respecto a una línea base comparable de operación normal.", whyItMatters: "Permite evaluar decisiones urgentes sin confundir crecimiento ordinario con compute, retries o backfills extraordinarios." },
      { term: "Caducidad operativa", definition: "Fecha, condición o automatismo que obliga a revisar y retirar una configuración temporal de emergencia.", whyItMatters: "Impide que un escalado útil durante la crisis permanezca indefinidamente como gasto y deuda no examinados." },
      { term: "Coste evitado", definition: "Estimación del impacto de negocio o riesgo que no ocurrió gracias a una mitigación suficientemente rápida y segura.", whyItMatters: "Da contexto al gasto adicional y evita optimizar sólo la factura mientras aumenta la pérdida del servicio." },
    ],
    workedScenario: {
      situation: "Un pipeline regulatorio acumula ocho horas de backlog. El modo de alto rendimiento cuesta 900 euros adicionales por hora, pero cada hora de retraso expone una penalización y bloquea operaciones downstream.",
      reasoning: [
        "Calcular capacidad necesaria para drenar backlog, coste máximo de la ventana y criterio de salida, comparándolo con impacto y riesgo de mantener el retraso.",
        "Autorizar el modo temporal, conservar observabilidad y evitar backfills duplicados, registrando inicio, propietario y alerta automática al alcanzar el backlog objetivo.",
        "Volver a configuración base, verificar SLA estable y analizar la causa para decidir si una mejora de código evita repetir el gasto extraordinario.",
      ],
      outcome: "El backlog se drena en noventa minutos con un coste acotado muy inferior al impacto evitado; la capacidad extra se retira automáticamente y no contamina el presupuesto mensual.",
    },
  },
  m27_5: {
    mentalModel: "Un postmortem útil explica cómo el sistema permitió el incidente, no quién cometió el último error. La causa raíz rara vez es una persona o una única línea: incluye condiciones técnicas, señales ausentes, controles que no funcionaron y decisiones razonables con información incompleta. El documento separa hechos del timeline, hipótesis confirmadas, factores contribuyentes e impacto. Cada acción debe cambiar una propiedad verificable del sistema y tener owner, prioridad, fecha y evidencia de cierre. Añadir monitorización no basta si nadie sabe qué umbral representa daño ni qué runbook ejecutar. La revisión termina cuando los aprendizajes se convierten en tests, guardrails, observabilidad o diseño, no cuando se publica una narrativa elegante.",
    mechanics: [
      "El timeline se reconstruye con logs, commits, runs y comunicaciones, distinguiendo cuándo ocurrió, se detectó, se entendió y se mitigó. Five whys puede ayudar, pero se detiene en controles accionables, no en acusaciones. Se documenta qué salió bien y qué aumentó tiempo de recuperación. Las acciones se clasifican por prevención, detección, mitigación y recuperación; cada una define una prueba observable, como un test que falla con la regresión o una alerta que dispara antes de incumplir SLO.",
      "Acciones vagas como mejorar monitorización o tener más cuidado no se pueden cerrar objetivamente. Un gran backlog de tareas sin priorizar tampoco reduce riesgo. Se eligen pocas medidas de alto apalancamiento, se enlazan a trabajo rastreable y se revisa su eficacia después. Si la mitigación temporal sigue activa, aparece como acción urgente con caducidad. El postmortem comparte suficiente detalle para enseñar patrones, pero redacta datos sensibles y no convierte credenciales, consultas privadas o nombres individuales en material amplio.",
    ],
    concepts: [
      { term: "Factor contribuyente", definition: "Condición técnica u organizativa que aumentó probabilidad, impacto o tiempo de recuperación sin ser por sí sola causa suficiente.", whyItMatters: "Permite corregir varias defensas débiles en lugar de buscar una única explicación simplista o una persona culpable." },
      { term: "Acción verificable", definition: "Tarea correctiva con responsable, fecha y una evidencia concreta que demuestra que cambió el comportamiento del sistema.", whyItMatters: "Transforma aprendizaje en reducción de riesgo y evita cerrar promesas vagas sin comprobar su eficacia." },
      { term: "Tiempo de detección", definition: "Intervalo entre el inicio del impacto y el momento en que una señal accionable llega al equipo responsable.", whyItMatters: "Muestra si observabilidad y ownership permitieron reaccionar antes de que el daño creciera significativamente." },
    ],
    workedScenario: {
      situation: "Un cambio de esquema rompe un stream durante seis horas. La propuesta inicial culpa a quien añadió la columna, aunque no existían contrato automatizado, staging representativo ni alerta de backlog para el producto.",
      reasoning: [
        "Reconstruir timeline y demostrar que la evolución llegó sin prueba de consumidor, el backlog no alertó y el runbook sugería borrar checkpoint incorrectamente.",
        "Definir acciones: contract test en CI, canary con esquema real, alerta por atraso y runbook de recuperación validado, cada una con owner y prueba.",
        "Retirar lenguaje personal, revisar eficacia en un game day y cerrar sólo cuando las cuatro evidencias sobrevivan a un cambio compatible e incompatible.",
      ],
      outcome: "La organización corrige defensas sistémicas en lugar de penalizar una entrega válida; el siguiente cambio incompatible se bloquea antes de producción y genera una instrucción clara.",
    },
  },
  m28_1: {
    mentalModel: "Un notebook es una interfaz de trabajo, no una frontera arquitectónica. La lógica de negocio debería vivir en funciones y módulos puros que reciben DataFrames o valores y devuelven resultados; los adaptadores se ocupan de spark.table, widgets, secrets, escritura y APIs; el punto de entrada conecta ambos. Esta separación crea seams donde los tests sustituyen catálogos y servicios sin simular un workspace entero. También hace explícitas las dependencias y evita estado oculto de celdas ejecutadas fuera de orden. Un proyecto autosuficiente conserva notebooks delgados para exploración u orquestación, pero el comportamiento crítico se importa desde un paquete versionado que puede ejecutarse localmente, en CI y en Jobs con el mismo código.",
    mechanics: [
      "La capa de dominio opera sobre parámetros y DataFrames pasados por el llamador; no obtiene SparkSession global ni lee rutas dentro de la función. Un repositorio o adaptador encapsula Unity Catalog, JDBC o REST y devuelve tipos acordados. El entrypoint analiza configuración, crea dependencias, llama transformaciones y publica. Pyproject define paquete y tests; imports absolutos evitan depender del directorio actual. En Runtime moderno el CWD puede ser el directorio del archivo, pero un job remoto o wheel no debe confiar en la disposición interactiva del usuario.",
      "Demasiadas capas para una transformación pequeña añaden ceremonia, pero mezclar I/O y reglas hace cada test lento y frágil. La frontera se elige donde existe una decisión de negocio o dependencia externa. SparkSession puede compartirse como fixture en tests, mientras adaptadores se prueban en integración. Los notebooks no contienen copias del código: importan una versión y registran commit o wheel. La refactorización conserva un test de caracterización sobre datos conocidos antes de mover funciones para evitar cambiar semántica accidentalmente.",
    ],
    concepts: [
      { term: "Función pura de transformación", definition: "Función cuya salida depende sólo de entradas explícitas y no realiza lecturas, escrituras ni acceso oculto a configuración externa.", whyItMatters: "Puede probarse con datos pequeños y reutilizarse en notebook, job o pipeline sin preparar todo el entorno." },
      { term: "Adaptador", definition: "Componente que traduce entre la lógica interna y una dependencia concreta como Unity Catalog, REST, secrets o almacenamiento.", whyItMatters: "Aísla cambios de plataforma y permite sustituir la dependencia en tests unitarios sin falsear reglas de negocio." },
      { term: "Entrypoint", definition: "Punto de ejecución que carga configuración, crea dependencias y coordina lectura, transformación, validación y publicación del workload.", whyItMatters: "Mantiene orchestration visible y evita que módulos importados ejecuten efectos secundarios de forma accidental." },
    ],
    workedScenario: {
      situation: "Un notebook de 1.400 líneas lee ocho tablas, llama una API, transforma y escribe; sus tests ejecutan todo en un workspace durante cuarenta minutos y fallan por orden de celdas.",
      reasoning: [
        "Caracterizar salidas actuales y extraer reglas deterministas a funciones que aceptan DataFrames, dejando lecturas y escrituras detrás de adaptadores explícitos.",
        "Crear un entrypoint mínimo y fixtures locales para transformaciones; mantener una integración que ejercite permisos, catálogo y API simulada en staging.",
        "Empaquetar la misma versión para notebook y Job, comparar resultados históricos y eliminar celdas duplicadas sólo después de verificar paridad.",
      ],
      outcome: "Las pruebas unitarias terminan en segundos, la integración conserva cobertura de plataforma y el código deja de depender de estado interactivo sin alterar las salidas productivas.",
    },
  },
  m28_2: {
    mentalModel: "Un contrato de DataFrame describe significado además de columnas. Incluye nombres, tipos, nulabilidad, claves, unicidad, rangos, relaciones y reglas temporales; también aclara qué evolución es compatible. Un schema test detecta que amount cambió de decimal a string, pero no que se duplicó cada order_id o se invirtió el signo de devoluciones. Los tests de transformación deben cubrir ejemplos pequeños que representen equivalencias, nulos, duplicados, datos tardíos y límites. Comparar DataFrames exige normalizar orden o usar comparación insensible cuando el orden no forma parte del contrato. El objetivo no es replicar Spark con mocks, sino ejecutar Spark sobre casos precisos y separar lógica de invariantes de calidad de datos productivos.",
    mechanics: [
      "Los fixtures crean DataFrames con StructType explícito para evitar inferencia ambigua, especialmente con nulos y decimales. Las aserciones comparan schema y filas canónicas; para conjuntos grandes se usan invariantes o checksums con cuidado. Las propiedades pueden verificar que deduplicar dos veces es idempotente, que totales se conservan o que una regla nunca produce claves nulas. Los contratos de entrada fallan pronto con mensajes de columna y regla, antes de escribir una tabla parcial.",
      "Un test con sólo happy path da falsa confianza; cubrir cada combinación posible es inmanejable. Se seleccionan particiones de equivalencia y límites vinculados a riesgos del negocio. El orden se comprueba sólo cuando una window y desempate lo definen; de otro modo se compara como conjunto. Los snapshots completos son frágiles ante columnas nuevas compatibles, así que se distinguen campos obligatorios y extensibles. En integración se confirma el comportamiento real de Delta, permisos y tipos que una fixture local no reproduce.",
    ],
    concepts: [
      { term: "Contrato semántico", definition: "Especificación de schema, claves, calidad y significado que una transformación promete aceptar y producir para sus consumidores.", whyItMatters: "Detecta regresiones que compilan y ejecutan correctamente pero alteran significado, unicidad o integridad del producto de datos." },
      { term: "Partición de equivalencia", definition: "Clase de entradas que deberían activar el mismo comportamiento, representada por pocos casos cuidadosamente elegidos en las pruebas.", whyItMatters: "Aporta cobertura significativa sin enumerar combinaciones infinitas ni depender de enormes copias de producción." },
      { term: "Comparación canónica", definition: "Normalización de orden, tipos y representación antes de contrastar dos DataFrames que deben ser semánticamente equivalentes.", whyItMatters: "Evita fallos por orden distribuido no garantizado y mantiene visibles las diferencias que sí pertenecen al contrato." },
    ],
    workedScenario: {
      situation: "Una transformación de SCD pasa sus tests porque genera cuatro filas, pero una llegada tardía crea dos registros current para el mismo customer y rompe facturación al día siguiente.",
      reasoning: [
        "Añadir al contrato exactamente una fila current por clave, intervalos no solapados y desempate determinista por sequence y timestamp.",
        "Construir fixtures con empate, evento tardío, duplicado y nulo, ejecutando Spark real y comparando filas e invariantes sin depender del orden físico.",
        "Probar idempotencia al reprocesar el mismo lote y ejecutar integración contra una tabla Delta temporal para verificar MERGE y constraints.",
      ],
      outcome: "El test reproduce y bloquea la regresión, el pipeline mantiene intervalos consistentes y el equipo dispone de un contrato reutilizable para futuros cambios de CDC.",
    },
  },
  m28_3: {
    mentalModel: "Una wheel es una unidad inmutable de distribución Python: contiene código y metadatos de versión, no la promesa de que cualquier entorno resolverá dependencias igual. La reproducibilidad requiere separar dependencias de ejecución, desarrollo y plataforma, fijar rangos o lock donde corresponde y construir una vez para promover el mismo artefacto. Instalar desde una celda hace que cada run resuelva el mundo de nuevo y puede producir resultados distintos entre notebook, job y serverless. Las librerías ya proporcionadas por Databricks, como PySpark, suelen declararse de forma que el desarrollo conozca su API sin empaquetarlas innecesariamente. Las dependencias nativas exigen compatibilidad con arquitectura y runtime, no sólo un nombre en pyproject.",
    mechanics: [
      "pyproject.toml define build backend, nombre, versión, paquetes y dependencias. El build crea una wheel cuyo hash puede publicarse en un artifact repository o volumen gobernado. CI instala el artefacto en un entorno limpio, ejecuta tests y registra SBOM o lista resuelta. En un bundle, artifacts puede construir y sincronizar la wheel para que una tarea Python wheel ejecute package_name y entry_point. La versión del artefacto se enlaza al commit y nunca se sobrescribe bajo el mismo identificador.",
      "Fijar absolutamente cada dependencia puede impedir parches de seguridad; rangos amplios permiten drift inesperado. Una estrategia usa lock reproducible para build, actualización automatizada y pruebas antes de renovar. Dependencias de desarrollo no viajan a producción, y secretos jamás se incorporan al paquete. Serverless admite mecanismos concretos y no garantiza init scripts arbitrarios; se comprueba compatibilidad temprano. Promover la misma wheel evita reconstrucciones por ambiente, mientras configuración y credenciales se inyectan en ejecución.",
    ],
    concepts: [
      { term: "Wheel", definition: "Formato de distribución Python construido e instalable que empaqueta código, metadatos y puntos de entrada con una versión definida.", whyItMatters: "Crea un artefacto promovible y trazable en lugar de copiar código o reinstalarlo de forma ad hoc." },
      { term: "Lock de dependencias", definition: "Resolución concreta y versionada de paquetes transitivos usada para reconstruir un entorno equivalente de manera deliberada.", whyItMatters: "Reduce drift entre CI y ejecución, aunque debe actualizarse con pruebas para recibir correcciones de seguridad." },
      { term: "Build once, promote", definition: "Práctica de construir un artefacto una vez y mover exactamente sus mismos bytes por test y producción.", whyItMatters: "Elimina diferencias introducidas por reconstrucciones y permite atribuir el comportamiento a una versión verificable." },
    ],
    workedScenario: {
      situation: "El job de producción falla tras un deploy aunque staging pasó: ambos instalaron analytics-lib sin lock y resolvieron versiones transitivas diferentes con seis horas de separación.",
      reasoning: [
        "Comparar entornos resueltos y confirmar drift, luego construir una wheel versionada junto a un lock y registrar hashes de ambos en CI.",
        "Instalar el artefacto en un entorno limpio, ejecutar unit e integración y promover exactamente la misma wheel a staging y producción.",
        "Configurar renovaciones controladas de dependencias con scanning y tests, y eliminar instalaciones dinámicas de notebooks y entrypoints.",
      ],
      outcome: "Los tres ambientes ejecutan bytes y dependencias equivalentes; el despliegue se vuelve reproducible y futuras actualizaciones transitivas llegan mediante cambios revisables, no por azar temporal.",
    },
  },
  m28_4: {
    mentalModel: "Los tests unitarios y de integración responden preguntas distintas. Un unit test pregunta si una regla produce el resultado correcto con entradas controladas y sin depender de recursos externos. Una integración pregunta si el artefacto funciona con Spark, Unity Catalog, Delta, identidades, permisos, red y configuración reales. Simular todo en unit tests no demuestra que un GRANT exista; ejecutar todos los casos en un workspace hace feedback lento y caro. La pirámide adecuada concentra combinaciones y límites en tests rápidos, y reserva pocos recorridos representativos para fronteras de plataforma. Cada test posee datos y recursos aislados, limpia lo que crea y emite evidencia suficiente para distinguir fallo funcional de fallo ambiental.",
    mechanics: [
      "pytest puede compartir una SparkSession local para transformaciones, usar fixtures de schema y parametrizar casos. Los adaptadores se sustituyen por fakes que respetan su contrato, no por mocks de cada llamada interna. La integración despliega un catálogo o schema temporal con identidad de servicio, carga datos semilla, ejecuta la wheel o job y verifica tablas, historial, permisos y errores esperados. Nombres únicos por run evitan colisiones; teardown se ejecuta incluso ante fallo y una policy limita alcance del principal.",
      "Una integración completa puede ser lenta o flaky por infraestructura; se minimiza superficie y se separan smoke tests de suites periódicas. Reintentar ciegamente oculta defectos; sólo fallos transitorios conocidos reciben retry y quedan medidos. Las pruebas negativas de permisos son tan importantes como el camino autorizado. Se promueve sólo si unit y una integración crítica pasan sobre el mismo artefacto, pero un fallo de disponibilidad del entorno se clasifica sin convertir automáticamente código no probado en aprobado.",
    ],
    concepts: [
      { term: "Test unitario", definition: "Prueba rápida y aislada de una regla o componente con entradas controladas y dependencias externas sustituidas por contratos simples.", whyItMatters: "Permite explorar numerosos casos límite y localizar regresiones sin pagar despliegue ni variabilidad de plataforma." },
      { term: "Test de integración", definition: "Prueba que ejecuta el artefacto contra servicios reales relevantes para validar compatibilidad, permisos, formatos y comportamiento distribuido.", whyItMatters: "Detecta fallos que una simulación local no reproduce, especialmente en Unity Catalog, Delta, red e identidad." },
      { term: "Aislamiento por run", definition: "Uso de nombres, datos y recursos exclusivos para cada ejecución automatizada de la suite de integración.", whyItMatters: "Evita colisiones entre pipelines paralelos y permite limpiar con seguridad sólo los objetos creados por esa prueba." },
    ],
    workedScenario: {
      situation: "Una transformación pasa 180 tests locales, pero el Job productivo no puede crear la tabla destino porque el service principal carece de CREATE TABLE y el schema usa una feature Delta incompatible.",
      reasoning: [
        "Mantener los unit tests para semántica y añadir una integración mínima que despliegue la wheel con la misma identidad y runtime objetivo.",
        "Crear un schema aislado, ejecutar lectura, transformación y escritura, y probar explícitamente tanto permisos permitidos como una operación denegada.",
        "Capturar historial y protocolo de tabla, limpiar recursos por run y bloquear promoción cuando la integración del mismo artefacto no finalice correctamente.",
      ],
      outcome: "El pipeline detecta permisos y compatibilidad antes de producción, conserva feedback unitario rápido y reduce la integración a un recorrido estable de pocos minutos.",
    },
  },
  m28_5: {
    mentalModel: "Una puerta de promoción es una política de riesgo automatizada. No intenta demostrar que el software es perfecto; exige evidencia proporcional antes de permitir que el mismo artefacto avance. El orden suele ir de barato a costoso: formato y lint, tipos y seguridad, unit tests, build, contract tests e integración. Fallar pronto ahorra capacidad y ofrece feedback concreto. La puerta también valida el artefacto y la configuración que se desplegarán, no sólo el branch. Cobertura porcentual no sustituye casos relevantes y un scan sin política de severidad genera ruido. Las excepciones son decisiones explícitas, con responsable y caducidad, nunca un clic sin registro para saltar una señal incómoda. En automatización Databricks, el nombre vigente es Declarative Automation Bundles; Asset Bundles es el alias que todavía aparece en el blueprint Professional de 2025.",
    mechanics: [
      "CI toma un commit inmutable, instala dependencias reproducibles, ejecuta checks y construye la wheel. Se calcula hash, se publica y ese artefacto pasa a integración; un bundle se valida contra el target correspondiente. Cada gate produce evidencia machine-readable y evita desplegar si incumple umbral. Branch protection o el sistema de entrega exige estados correctos y revisiones. Las credenciales son de servicio, de corta duración cuando sea posible, y cada ambiente concede sólo permisos necesarios.",
      "Checks redundantes aumentan tiempo sin reducir riesgo; checks inestables enseñan a ignorar rojo. Se mide duración y tasa de falsos fallos, se paralelizan etapas independientes y se preserva una ruta de diagnóstico. Un hallazgo de seguridad se evalúa por severidad y explotabilidad, con política documentada. Cambios urgentes pueden usar un proceso break-glass auditado que crea automáticamente trabajo de seguimiento. Producción recibe exactamente el artefacto probado; reconstruir después de aprobación invalida parte de la evidencia.",
    ],
    concepts: [
      { term: "Gate de promoción", definition: "Condición automatizada y auditable que exige evidencia definida antes de mover un artefacto al siguiente ambiente de entrega.", whyItMatters: "Convierte estándares en comportamiento consistente y evita que presión temporal elimine silenciosamente pruebas críticas." },
      { term: "Evidencia de build", definition: "Resultados, hashes, reportes y metadatos que vinculan un commit con el artefacto exacto y las verificaciones ejecutadas.", whyItMatters: "Permite demostrar qué se probó y evita promover bytes distintos de los que recibieron aprobación." },
      { term: "Break-glass", definition: "Ruta excepcional y controlada para omitir temporalmente una barrera bajo autorización, registro y seguimiento obligatorios.", whyItMatters: "Permite responder a emergencias sin convertir la excepción en un bypass cotidiano invisible y permanente." },
    ],
    workedScenario: {
      situation: "Un hotfix urgente pasa unit tests, pero el scan encuentra una dependencia crítica y la integración falla intermitentemente; el equipo quiere reconstruir manualmente y desplegar directamente desde un portátil.",
      reasoning: [
        "Determinar si la vulnerabilidad alcanza el código y si el fallo ambiental es transitorio, preservando logs y evitando reconstruir un artefacto distinto.",
        "Corregir o mitigar la dependencia, estabilizar la fixture y repetir gates sobre el mismo commit, o activar break-glass sólo con riesgo aceptado y caducidad.",
        "Promover el hash probado mediante identidad de servicio, verificar smoke de producción y crear seguimiento automático para cualquier control excepcional pendiente.",
      ],
      outcome: "El hotfix llega con trazabilidad y sin bytes artesanales; la organización mantiene velocidad de respuesta mientras conserva una prueba explícita del riesgo aceptado y resuelto.",
    },
  },
  m29_1: {
    mentalModel: "Declarative Automation Bundles describen un proyecto Databricks completo como código: fuentes, artefactos, recursos, variables, permisos y targets forman una unidad que puede revisarse y desplegarse repetidamente. Desde el 16 de marzo de 2026 este es el nombre oficial de la capacidad antes llamada Databricks Asset Bundles; el blueprint Professional vigente, publicado antes del cambio, conserva Asset Bundles, pero ambos nombres señalan el mismo mecanismo evaluable. El bundle no sustituye el aprovisionamiento de toda la cuenta ni convierte cualquier script en infraestructura declarativa. Su frontera es el proyecto y sus recursos de aplicación, como Lakeflow Jobs y pipelines, enlazados a código versionado y a una identidad de despliegue.",
    mechanics: [
      "El archivo databricks.yml identifica el bundle y puede incluir recursos, artifacts, variables, include y targets; los archivos incluidos componen una configuración final. La CLI carga esa configuración, resuelve sustituciones y despliega recursos con identidad y estado asociados al target. Artifacts construye, por ejemplo, una wheel y la referencia desde una tarea. Los recursos declarados se revisan junto al código, de modo que schedule, parámetros y dependencias dejan de ser cambios manuales invisibles. Validate detecta schema y referencias antes de tocar el workspace.",
      "Un bundle gestiona recursos soportados dentro de su alcance, pero redes, cuentas cloud o configuración global pueden requerir Terraform u otra capa. Meter todos los equipos en un bundle monolítico aumenta blast radius y ownership ambiguo; dividir demasiado duplica contratos. La unidad adecuada agrupa recursos que se versionan, prueban y promueven juntos. Se documenta la equivalencia terminológica para examen: si una pregunta menciona Asset Bundles, se razona con Declarative Automation Bundles actuales, sin inventar una migración de tecnología distinta.",
    ],
    concepts: [
      { term: "Declarative Automation Bundle", definition: "Definición versionada de un proyecto Databricks que agrupa código, artefactos, configuración y recursos desplegables mediante la CLI.", whyItMatters: "Hace revisables y repetibles tanto la lógica como la configuración operativa que antes podía cambiarse manualmente." },
      { term: "Asset Bundles", definition: "Nombre anterior de Declarative Automation Bundles, todavía presente en el blueprint Professional del 30 de noviembre de 2025.", whyItMatters: "Reconocer el alias evita tratar una pregunta de examen como producto obsoleto o diferente del mecanismo actual." },
      { term: "Recurso declarativo", definition: "Objeto de workspace cuya configuración deseada se expresa en YAML, como un Lakeflow Job, pipeline o dashboard compatible.", whyItMatters: "Permite revisar diferencias, aplicar despliegues coherentes y reconstruir configuración sin edición manual del entorno." },
    ],
    workedScenario: {
      situation: "Un equipo mantiene notebooks en Git, pero los Jobs de test y producción se configuran a mano y difieren en retries, parámetros y principal; nadie puede reproducir el entorno tras un borrado accidental.",
      reasoning: [
        "Definir un Declarative Automation Bundle que incluya wheel, Job, parámetros, permissions y targets, registrando que Asset Bundles es el alias usado por el blueprint.",
        "Validar la configuración y desplegar primero a un target de desarrollo aislado, comprobando que el artefacto y referencias se resuelven desde el commit.",
        "Importar conscientemente la configuración necesaria o recrearla declarativamente, comparar comportamiento y retirar la edición manual mediante permisos y proceso de cambio.",
      ],
      outcome: "Código y operación se convierten en una unidad reproducible; el equipo puede reconstruir ambos ambientes y responder correctamente a terminología actual o histórica de certificación.",
    },
  },
  m29_2: {
    mentalModel: "Un target no es una copia completa del proyecto, sino una transformación controlada de una base común. La configuración compartida expresa lo que debe permanecer idéntico; los overrides declaran sólo diferencias legítimas como workspace, identidad, catálogo, schedule o escala. Los modos development y production añaden comportamientos convencionales y guardrails, pero no reemplazan una revisión explícita de cada diferencia. El aislamiento usa root paths, schemas y nombres que impiden colisión entre desarrolladores o ambientes. Si cada target contiene una segunda definición completa, el drift queda incorporado al diseño. Si no hay ninguna diferencia, producción puede heredar rutas o permisos de desarrollo. La meta es minimizar variación sin fingir que seguridad y capacidad son iguales.",
    mechanics: [
      "Targets dentro de databricks.yml pueden establecer workspace host y root_path, variables, mode y overrides de recursos. Las sustituciones componen nombres y referencias a partir del target activo. Development mode puede aplicar convenciones adecuadas a iteración personal, mientras production mode espera configuración más estable y controles coherentes. Variables se resuelven desde defaults, target o CLI según precedencia; valores no secretos pueden versionarse, pero credenciales se obtienen mediante autenticación y recursos seguros, no YAML.",
      "Los overrides excesivos hacen imposible saber qué se probó; la base debe incluir código, grafo, parámetros semánticos y políticas comunes. Capacidad, schedules y catálogos pueden variar cuando el ambiente lo exige. Una ruta compartida entre targets puede sobrescribir estado o archivos, por lo que se prueba unicidad con identidad y target. Se genera o inspecciona el plan efectivo, se revisan valores sensibles y se ejecuta un smoke por ambiente. El mismo artefacto se promueve sin reconstruirlo.",
    ],
    concepts: [
      { term: "Target", definition: "Configuración nombrada que selecciona workspace, modo, variables y overrides para desplegar el mismo proyecto en un ambiente concreto.", whyItMatters: "Permite promoción repetible sin mantener copias divergentes de código y recursos para desarrollo, test y producción." },
      { term: "Override mínimo", definition: "Diferencia explícita limitada a aquello que realmente cambia entre ambientes, heredando el resto desde una base compartida.", whyItMatters: "Reduce drift y hace visible qué propiedades productivas no fueron ejercitadas de forma equivalente en test." },
      { term: "Root path", definition: "Ruta de workspace usada por el bundle para almacenar archivos y estado desplegados bajo una identidad y target.", whyItMatters: "Un diseño único por ambiente o desarrollador evita colisiones, sobrescrituras y ownership ambiguo entre despliegues." },
    ],
    workedScenario: {
      situation: "Dos desarrolladores despliegan el mismo bundle a dev y sobrescriben archivos; producción hereda un schedule desactivado porque los tres targets duplican el recurso completo con diferencias ocultas.",
      reasoning: [
        "Mover la definición del Job a una base común y dejar sólo host, root path, catálogo, schedule y escala legítimamente distintos en cada target.",
        "Parametrizar la ruta de desarrollo por identidad, aplicar modos apropiados y revisar la configuración efectiva para detectar variables no resueltas o heredadas.",
        "Desplegar el mismo hash a dev, test y producción, ejecutar smoke y bloquear copias completas de recursos mediante revisión y validación automatizada.",
      ],
      outcome: "Los despliegues personales quedan aislados, el schedule productivo se vuelve una diferencia visible y el proyecto conserva una sola fuente de verdad para su comportamiento.",
    },
  },
  m29_3: {
    mentalModel: "Validate, plan, deploy y run responden preguntas diferentes. Validate comprueba que la configuración compone y referencia elementos válidos; plan muestra el cambio esperado sin aplicarlo; deploy materializa recursos y artefactos; run ejecuta un recurso ya desplegado. Ninguna etapa implica automáticamente la siguiente. Un YAML válido puede describir un cambio destructivo, un despliegue correcto puede contener código defectuoso y un run exitoso puede publicar datos semánticamente erróneos. La entrega robusta coloca evidencia entre transiciones: revisión del plan, aprobación según ambiente, smoke y validación de datos. En el blueprint anterior, estas operaciones aparecen bajo Asset Bundles; en la CLI actual pertenecen a Declarative Automation Bundles y conservan el mismo razonamiento.",
    mechanics: [
      "La CLI resuelve el target y ejecuta bundle validate antes de que CI autorice cambios. El plan efectivo permite identificar creates, updates o deletes y debe conservarse como artefacto de revisión cuando el flujo lo admita. Deploy sincroniza archivos, construye o carga artifacts y actualiza recursos dentro del estado del bundle. Run invoca un job o pipeline por su clave de recurso y puede recibir parámetros soportados. Los códigos de salida y run IDs se capturan para que cada gate sepa qué ocurrió.",
      "Automatizar deploy inmediatamente después de validate reduce fricción, pero elimina una oportunidad de detectar drift o borrado inesperado en producción. Exigir aprobación manual para todo ralentiza desarrollo; se aplica por riesgo, target y tipo de cambio. Run no sustituye tests de integración: prueba el recurso completo, pero necesita assertions sobre tablas y contratos. Un dry run sin datos representativos tampoco demuestra escalabilidad. El pipeline conserva el mismo artefacto, aplica la menor autoridad necesaria y falla cerrado si el plan no puede revisarse.",
    ],
    concepts: [
      { term: "Validación de bundle", definition: "Comprobación estática de estructura, tipos, referencias y configuración resuelta para un target antes de modificar recursos remotos.", whyItMatters: "Detecta errores baratos temprano, aunque no garantiza seguridad del cambio ni corrección del código ejecutado." },
      { term: "Plan de despliegue", definition: "Representación previa de las acciones que alinearían los recursos reales con la configuración declarada del bundle.", whyItMatters: "Permite revisar actualizaciones o eliminaciones inesperadas antes de que afecten un ambiente compartido o productivo." },
      { term: "Smoke run", definition: "Ejecución pequeña posterior al despliegue que confirma arranque, identidad, dependencias y un recorrido crítico del recurso.", whyItMatters: "Cubre la brecha entre recursos creados correctamente y un workload realmente capaz de operar en ese ambiente." },
    ],
    workedScenario: {
      situation: "CI valida un bundle y despliega automáticamente; una refactorización cambia una clave de recurso y el plan intenta borrar y recrear el Job productivo, perdiendo su identidad operacional.",
      reasoning: [
        "Separar validate de plan, conservar el diff y clasificar deletes o reemplazos como cambios que requieren aprobación explícita en producción.",
        "Mantener la clave estable o ejecutar una migración documentada, después desplegar el mismo artefacto y verificar permissions y schedule resultantes.",
        "Lanzar un smoke run, comprobar contrato de salida y registrar run ID, plan y hash como evidencia antes de completar la promoción.",
      ],
      outcome: "La recreación inesperada se detiene antes de aplicarse; la identidad del Job se conserva y el flujo demuestra configuración, ejecución y datos mediante gates separados.",
    },
  },
  m29_4: {
    mentalModel: "CI es un actor de producción y debe tener identidad propia. OAuth para un service principal entrega credenciales renovables o de corta duración y separa claramente automatización de una persona; un personal access token ata continuidad, auditoría y revocación al usuario que lo creó. La promoción no significa reconstruir: CI toma el artefacto cuyo hash superó pruebas, autentica contra el target y aplica sólo permisos de despliegue y ejecución requeridos. Separar identidades por ambiente limita blast radius, aunque una organización puede optar por un principal común con acceso explícito cuando su modelo lo justifica. En ambos casos, los secretos viven en el proveedor de CI y nunca en databricks.yml, logs o wheel.",
    mechanics: [
      "La CLI admite perfiles y métodos OAuth; para automatización se configura autenticación machine-to-machine del service principal y se inyectan valores mediante secretos protegidos. El principal debe existir en los workspaces destino y recibir permisos sobre recursos y rutas exactos. CI selecciona target, valida host esperado y evita mezclar --profile con opciones que produzcan una identidad ambigua. Los audit logs registran acciones del principal, facilitando distinguir deploy de ejecución del workload cuando se usan identidades separadas.",
      "Un principal por ambiente mejora aislamiento y revocación, pero aumenta gestión; uno compartido simplifica configuración y amplía impacto de una credencial. Se elige según separación de funciones, requisitos regulatorios y automatización de altas. Los tokens se rotan sin modificar repositorio y se ocultan en redacción de logs. La promoción registra artefacto, commit, aprobador, target e identidad. Los permisos se prueban negativamente: CI de test no debe poder desplegar a producción aunque cambie un argumento.",
    ],
    concepts: [
      { term: "OAuth M2M", definition: "Flujo de autorización máquina a máquina mediante el cual un service principal obtiene tokens sin depender de una sesión humana.", whyItMatters: "Mejora rotación, continuidad y atribución de CI frente a credenciales personales de larga duración." },
      { term: "Service principal", definition: "Identidad no humana gobernada que representa una aplicación o automatización y recibe permisos explícitos en cada workspace.", whyItMatters: "Separa responsabilidad del pipeline respecto a usuarios y permite mínimo privilegio, auditoría y revocación independientes." },
      { term: "Promoción inmutable", definition: "Movimiento del mismo artefacto probado entre ambientes sin reconstruir ni modificar sus bytes durante el proceso.", whyItMatters: "Garantiza que la evidencia de test corresponde exactamente al código que finalmente alcanza producción." },
    ],
    workedScenario: {
      situation: "El pipeline usa el PAT de una ingeniera administradora. Durante sus vacaciones la cuenta se desactiva, fallan despliegues y el token aparece accidentalmente en la salida de una tarea.",
      reasoning: [
        "Revocar el PAT, revisar audit logs y crear un service principal con OAuth M2M y permisos mínimos específicos para cada target de bundle.",
        "Guardar credenciales en el vault de CI con redacción, comprobar el host y bloquear que el principal de test pueda actuar en producción.",
        "Promover una wheel por hash, registrar identidad y target, y ensayar rotación sin cambiar código ni configuración versionada del proyecto.",
      ],
      outcome: "La entrega deja de depender de una persona, la exposición se contiene y cada despliegue queda atribuido a una identidad automatizada con alcance verificable.",
    },
  },
  m29_5: {
    mentalModel: "El estado declarado, el estado desplegado y el estado que realmente ejecuta producción pueden divergir. Drift aparece cuando alguien edita un recurso fuera del bundle, otra automatización comparte ownership o una referencia externa cambia. El bundle necesita una frontera de propietario: un recurso tiene una fuente de verdad y una identidad autorizada a modificarlo. Permissions también son configuración y deben evitar que el deploy se quite a sí mismo acceso o conceda control excesivo. Rollback no siempre es aplicar el commit anterior: código, schema y datos pueden haber evolucionado. Una estrategia reversible conserva artefactos, planes, compatibilidad hacia atrás y procedimientos para detener, redeployar o avanzar con una corrección.",
    mechanics: [
      "La identidad y claves de recursos permiten al bundle actualizar objetos existentes dentro de su state. Ediciones manuales pueden ser sobrescritas en el siguiente deploy o producir un plan inesperado; por eso se restringen y se detectan revisando el plan. Permissions declarativas asignan CAN_VIEW, CAN_MANAGE_RUN u otros niveles según recurso, y ownership se mantiene en grupos o principales operativos, no personas. Un deploy registra commit, target y artefactos para que una versión anterior pueda localizarse.",
      "Rollback de configuración es sencillo si el recurso y sus inputs siguen compatibles; revertir una migración de schema o un side effect no lo es. Se prefieren cambios expand-contract, feature flags y escrituras compatibles que permitan ejecutar versión N o N-1 durante la ventana. Destruir y recrear puede perder historial, URLs o triggers. El runbook decide stop, repair, redeploy o roll-forward según impacto. Tras recuperar, se reconcilia drift y se elimina cualquier permiso o cambio temporal.",
    ],
    concepts: [
      { term: "Drift", definition: "Diferencia entre la configuración versionada que se considera deseada y el estado real modificado por personas o automatizaciones externas.", whyItMatters: "Hace que despliegues sean impredecibles y puede reintroducir cambios manuales, permisos incorrectos o recursos huérfanos." },
      { term: "Frontera de ownership", definition: "Regla que asigna una única fuente de verdad y responsables autorizados para gestionar cada recurso desplegado.", whyItMatters: "Evita que dos sistemas compitan por el mismo objeto y sobrescriban mutuamente su configuración." },
      { term: "Expand-contract", definition: "Estrategia de cambio que añade primero compatibilidad nueva, migra consumidores y retira después la forma anterior.", whyItMatters: "Mantiene una ventana donde versiones adyacentes funcionan y hace viable rollback sin revertir datos destructivamente." },
    ],
    workedScenario: {
      situation: "Un operador cambia manualmente retries en producción durante un incidente; el siguiente deploy los revierte y además una migración renombra una columna que la versión anterior necesita para rollback.",
      reasoning: [
        "Capturar y decidir si el cambio manual debe codificarse o retirarse, restringiendo futuras ediciones y revisando el plan antes de desplegar.",
        "Adoptar expand-contract para la columna, publicar ambos nombres durante la transición y conservar wheels y configuraciones de las dos versiones.",
        "Ensayar stop, redeploy y roll-forward, verificar permisos de la identidad y documentar cómo reconciliar cambios temporales tras el incidente.",
      ],
      outcome: "El equipo recupera sin perder compatibilidad, elimina la competencia entre UI y bundle y convierte rollback en un procedimiento probado en lugar de una esperanza.",
    },
  },
  m30_1: {
    mentalModel: "Unity Catalog combina una jerarquía de securables con dos ideas distintas: ownership y privilegios. El owner puede administrar el objeto y delegar; un privilegio autoriza una acción concreta. Los usuarios necesitan además atravesar la jerarquía mediante USE CATALOG y USE SCHEMA antes de SELECT u otro permiso sobre el objeto. La herencia permite conceder en catálogo o schema para objetos presentes y futuros, lo que simplifica pero amplía alcance. El modelo sostenible asigna permisos a grupos por función y ownership a grupos operativos o principals, nunca a individuos como mecanismo normal. El mínimo privilegio no es el menor número de grants, sino el conjunto mínimo comprensible que permite trabajo y puede revocarse sin romper ownership.",
    mechanics: [
      "Los securables se organizan desde metastore, catalog y schema hasta tablas, vistas, volúmenes y funciones. GRANT y REVOKE modifican privilegios, y SHOW GRANTS o information_schema ayudan a inspeccionarlos. Los privilegios heredables concedidos en un nivel superior alcanzan objetos descendientes según el modelo vigente; ownership incluye capacidad administrativa y debe transferirse de forma deliberada. MANAGE permite gestionar grants sin convertir necesariamente al actor en owner. Los workspace bindings restringen además desde qué workspaces se accede a ciertos catálogos o credenciales.",
      "Grants directos a personas acumulan excepciones y sobreviven a cambios de rol; grupos sincronizados desde el proveedor de identidad expresan función y ciclo de vida. Conceder SELECT a nivel de catálogo es cómodo, pero puede exponer futuras tablas; un schema por dominio y grupos separados reduce blast radius. Se prueban rutas positivas y negativas con identidades reales, incluida la capacidad de otorgar permisos. Las automatizaciones se despliegan con Declarative Automation Bundles, nombre actual de Asset Bundles en el blueprint, sin mezclar ownership del deploy con acceso de lectores.",
    ],
    concepts: [
      { term: "Securable", definition: "Objeto gobernado de Unity Catalog sobre el que pueden asignarse ownership, privilegios, políticas o restricciones de workspace.", whyItMatters: "Define la unidad exacta de autorización y evita hablar de acceso genérico sin identificar catálogo, schema o activo." },
      { term: "Privilege inheritance", definition: "Propagación de determinados privilegios concedidos en un contenedor hacia sus objetos descendientes actuales y futuros.", whyItMatters: "Simplifica administración, pero un grant demasiado alto puede ampliar acceso automáticamente cuando aparecen objetos nuevos." },
      { term: "Ownership operativo", definition: "Asignación de propietario a un grupo o principal estable responsable del ciclo de vida, en vez de una persona.", whyItMatters: "Evita objetos huérfanos y mantiene administración cuando cambian miembros, equipos o cuentas individuales." },
    ],
    workedScenario: {
      situation: "La propietaria de un catálogo abandona la empresa y 240 grants directos mezclan analistas, ingenieros y service principals; nadie sabe qué objetos futuros serán visibles ni quién puede revocar accesos.",
      reasoning: [
        "Inventariar ownership, grants efectivos e herencia, y mapear funciones a grupos administrados por identidad antes de retirar permisos individuales.",
        "Transferir ownership a un grupo operativo, conceder USE y acciones en el nivel mínimo estable, y separar deploy, escritura y lectura.",
        "Ejecutar pruebas positivas y negativas por persona funcional, revocar grants directos y monitorizar solicitudes y denegaciones durante la transición.",
      ],
      outcome: "El catálogo mantiene administración continua, los accesos se explican por grupos y nivel jerárquico, y las nuevas tablas ya no heredan permisos personales accidentales.",
    },
  },
  m30_2: {
    mentalModel: "ABAC protege datos por atributos, no por una lista manual en cada tabla. Los governed tags forman una taxonomía controlada a nivel de cuenta; una policy adjunta a catálogo, schema o tabla selecciona objetos cuyas etiquetas cumplen una condición y aplica row filter o column mask. Cuando aparece una columna nueva etiquetada como PII, la política puede actuar automáticamente sin esperar otro ALTER TABLE. Eso escala sólo si la clasificación es fiable, los tags tienen ownership y la función de política es simple. ABAC complementa privilegios: primero el usuario necesita acceso al objeto; después la política limita filas o valores visibles. No sustituye minimización, workspace binding ni una revisión de limitaciones de compute y sharing.",
    mechanics: [
      "Los governed tags se definen con valores y permisos de asignación controlados. Una CREATE POLICY referencia una función SQL o lógica inline y usa condiciones de tags para seleccionar targets; su scope determina alcance e herencia. En tiempo de consulta, Unity Catalog evalúa políticas aplicables a usuario y objeto y aplica la función antes de devolver datos. ABAC actual exige compute compatible y presenta restricciones para time travel, clones, shares y combinaciones de políticas; múltiples políticas distintas sobre el mismo target pueden bloquear acceso en lugar de adivinar precedencia.",
      "Una taxonomía con cientos de tags ambiguos produce clasificación inconsistente y políticas impredecibles. Se empiezan pocas dimensiones como sensitivity y residency, se automatiza detección pero exige validación humana para casos críticos. Las excepciones usan EXCEPT con grupos o principals estrechos y auditados; no se añade a usuarios individualmente sin caducidad. El rendimiento depende de la complejidad de funciones y pushdown, así que se prueban seguridad y latencia. Cambios de policy se versionan y despliegan con revisión equivalente al código.",
    ],
    concepts: [
      { term: "Governed tag", definition: "Atributo de catálogo definido con valores y permisos controlados que clasifica securables para políticas y gobierno consistentes.", whyItMatters: "Impide etiquetas libres contradictorias y proporciona una señal confiable para aplicar ABAC automáticamente a escala." },
      { term: "ABAC policy", definition: "Política central que selecciona objetos por atributos y aplica filtros de filas o máscaras de columnas en tiempo de consulta.", whyItMatters: "Protege objetos presentes y futuros de forma uniforme sin mantener reglas manuales separadas para cada tabla." },
      { term: "Policy scope", definition: "Nivel jerárquico donde se adjunta una política y desde el que puede evaluar objetos descendientes que coincidan.", whyItMatters: "Determina alcance y blast radius; una policy de catálogo exige pruebas más amplias que una de tabla." },
    ],
    workedScenario: {
      situation: "Cincuenta esquemas contienen columnas PII y cada owner mantiene una máscara distinta; nuevas tablas permanecen semanas sin proteger y una adquisición duplicará el inventario durante el trimestre.",
      reasoning: [
        "Definir governed tags para sensitivity y una función de máscara simple, clasificar una muestra y comprobar precisión, ownership y compute compatible.",
        "Crear una ABAC policy en un scope piloto con excepciones mínimas, y ejecutar pruebas positivas, negativas, de latencia y de operaciones limitadas.",
        "Ampliar por dominios, auditar asignaciones y conflictos, y retirar máscaras manuales sólo cuando la cobertura automática y rollback estén demostrados.",
      ],
      outcome: "Las columnas nuevas etiquetadas quedan protegidas inmediatamente, la lógica se reduce a una política revisable y el equipo conserva excepciones y limitaciones explícitas.",
    },
  },
  m30_3: {
    mentalModel: "Row filters y column masks son transformaciones de seguridad insertadas en la consulta. Un row filter decide si cada fila puede atravesar; una mask sustituye el valor visible de una columna y debe devolver un tipo compatible. Pueden asignarse manualmente a una tabla o centralizarse mediante ABAC, opción recomendada para reglas repetidas. Como el motor debe impedir inferencias sobre valores protegidos, prioriza seguridad sobre ciertas optimizaciones, y funciones complejas reducen pushdown o rendimiento. Una máscara no cifra el almacenamiento ni borra el dato; controla la vista del usuario en consultas compatibles. Las claves de join, particiones y columnas usadas en la policy merecen pruebas especiales por semántica, rendimiento y limitaciones de DML.",
    mechanics: [
      "Un filtro suele ser una SQL UDF booleana que recibe columnas y contexto, y sólo deja filas true. Una mask recibe el valor y opcionalmente otras columnas, devuelve original o representación protegida y mantiene tipo convertible. La asignación manual usa ALTER TABLE, mientras ABAC aplica políticas por governed tags. El motor evalúa identidad y políticas en consulta. Algunas APIs Delta, clones, time travel, shares y versiones de runtime tienen limitaciones; la documentación vigente se verifica antes de prometer interoperabilidad.",
      "Funciones con joins, subqueries o lógica no determinista elevan coste y dificultan auditoría. Se prefieren funciones deterministas simples y tablas de entitlement bien gobernadas cuando son necesarias. Las pruebas cubren usuarios autorizados, no autorizados, nulos, agregaciones, joins y attempts de inferencia; también miden pruning y P95. Una dynamic view puede ser más adecuada para una presentación curada compleja, mientras ABAC escala mejor para una regla uniforme. El owner no debe poder omitir una policy central sin un proceso de excepción.",
    ],
    concepts: [
      { term: "Row filter", definition: "Función de seguridad evaluada en consulta que devuelve verdadero únicamente para las filas visibles por la identidad actual.", whyItMatters: "Implementa segmentación regional, departamental o por tenant sin crear copias físicas separadas de cada conjunto." },
      { term: "Column mask", definition: "Función que sustituye dinámicamente el valor mostrado de una columna mientras conserva un tipo compatible con su contrato.", whyItMatters: "Permite compartir estructura y datos no sensibles sin exponer el valor original a lectores no autorizados." },
      { term: "Secure optimization", definition: "Principio por el que el motor limita transformaciones del plan si podrían revelar información protegida por filtros o máscaras.", whyItMatters: "Explica por qué una policy correcta puede cambiar pushdown o rendimiento y exige medición específica." },
    ],
    workedScenario: {
      situation: "Una tabla global de nómina debe mostrar sólo el país del analista y enmascarar salary salvo para compensation-admins; las consultas agregadas actuales dependen de pruning por country.",
      reasoning: [
        "Diseñar un row filter determinista por entitlement y una mask tipada para salary, con grupos administrados y tratamiento explícito de identidades sin mapeo.",
        "Aplicar mediante ABAC en un scope piloto y probar filas, valores, nulos, joins, agregados, DML permitido y cualquier limitación de runtime.",
        "Comparar archivos podados y P95, simplificar funciones si degradan el plan y documentar una dynamic view sólo para consumidores incompatibles.",
      ],
      outcome: "Cada audiencia obtiene exactamente filas y valores autorizados, las pruebas negativas bloquean inferencia y el rendimiento permanece dentro del SLO con una policy central.",
    },
  },
  m30_4: {
    mentalModel: "Auditoría responde quién intentó qué, cuándo, desde dónde y con qué resultado; lineage responde qué activos leyó o escribió una operación cuando esa relación pudo inferirse. Son fuentes complementarias, no equivalentes. system.access.audit registra eventos de control y acceso con parámetros y respuestas; las system tables de lineage registran relaciones a nivel de tabla o columna para entidades capturadas. Lineage tiene cobertura parcial por diseño y la ausencia de un edge no demuestra ausencia de acceso. Ambas fuentes contienen identidades, nombres y consultas potencialmente sensibles, por lo que su acceso debe ser más estrecho que el dashboard que derivan. La evidencia útil conserva IDs, timestamps y granularidad sin exportar indiscriminadamente todo el plano de control.",
    mechanics: [
      "Audit logs se habilitan como system table regional para muchos eventos y permiten filtrar service_name, action_name, actor, workspace y tiempo. Las tablas de lineage contienen source, target, tipo de entidad y metadatos que pueden enlazarse con query history mediante identificadores disponibles. Un timeline combina eventos, pero evita convertir una relación uno-a-muchos en duplicación de recuentos. La retención y cobertura documentadas se consideran al diseñar investigaciones y alertas. Sólo grupos autorizados reciben SELECT o acceden mediante vistas redactadas.",
      "Una alerta sobre cada SELECT genera ruido; se priorizan grants, policy changes, exportaciones, accesos denegados y objetos sensibles. Los parámetros pueden contener valores privados y se minimizan en vistas. Para una investigación se preservan filtros, zona temporal y query IDs y se marca inferencia frente a hecho. Declarative Automation Bundles, antes Asset Bundles en el blueprint, pueden versionar jobs de detección, pero no convierten lineage parcial en una fuente completa. La separación de funciones impide que el mismo operador altere policy y borre evidencia.",
    ],
    concepts: [
      { term: "Audit event", definition: "Registro de una acción de cuenta o workspace con actor, operación, tiempo, parámetros relevantes y resultado observado.", whyItMatters: "Proporciona evidencia para cambios de permisos, accesos, despliegues e investigaciones de responsabilidad y cumplimiento." },
      { term: "Data lineage", definition: "Relación inferida entre activos de origen, destino y entidad ejecutora durante una lectura o escritura capturable.", whyItMatters: "Ayuda a evaluar impacto y trazabilidad, pero su cobertura parcial exige no interpretar ausencia como prueba negativa." },
      { term: "Vista redactada", definition: "Vista gobernada que expone sólo columnas y filas necesarias de telemetría sensible para una audiencia concreta.", whyItMatters: "Permite observabilidad operativa sin entregar consultas, identidades o parámetros completos a todos los consumidores." },
    ],
    workedScenario: {
      situation: "Aparece una máscara retirada durante veinte minutos y una tabla sensible fue consultada; seguridad necesita saber actor, consumidores downstream e impacto sin conceder audit completo a todo el equipo.",
      reasoning: [
        "Filtrar audit por policy, grant y tabla en la ventana exacta para identificar actor, acción, resultado y statement IDs sin asumir causalidad todavía.",
        "Relacionar query history y lineage disponible para enumerar lecturas y destinos, marcando claramente activos no capturados y verificando logs adicionales.",
        "Compartir una vista redactada con el equipo investigador, restaurar policy mediante proceso revisado y preservar evidencia con permisos y retención controlados.",
      ],
      outcome: "La organización delimita exposición y cadena downstream con evidencia trazable, mantiene la privacidad de la telemetría y añade una alerta específica para futuras retiradas.",
    },
  },
  m30_5: {
    mentalModel: "Privacidad es una propiedad end-to-end, no una máscara colocada al final. Empieza preguntando si el dato debe recopilarse, con qué finalidad, durante cuánto tiempo y en qué regiones; continúa con clasificación, acceso, minimización, retención, sharing y borrado verificable. Unity Catalog aporta ownership, tags, policies, lineage y workspace bindings, pero cada control cubre una frontera distinta. Un catálogo vinculado a un workspace limita desde dónde se accede; ABAC limita lo visible; retención limita cuánto persiste; ninguna reemplaza las demás. Las pruebas negativas demuestran que identidades, workspaces y consumidores no autorizados fallan. El diseño también conserva capacidad de investigación sin replicar PII en logs o etiquetas de coste.",
    mechanics: [
      "La clasificación aplica governed tags y ownership; los grants y ABAC implementan acceso; workspace-catalog bindings restringen catálogos, external locations o credenciales a workspaces autorizados. Las tablas definen retención y procesos de purga compatibles con requisitos y consumidores. Dynamic views o sharing curado minimizan columnas antes de cruzar fronteras. Audit y lineage verifican uso dentro de sus coberturas. La automatización actual se versiona con Declarative Automation Bundles, que el blueprint todavía llama Asset Bundles, y separa configuración pública de secretos.",
      "Conservar todo por si acaso eleva exposición y coste; borrar demasiado pronto rompe replays, investigaciones y obligaciones. Se documenta base y finalidad, se define un reloj de retención por clase y se ensaya borrado lógico y físico. Los datos sintéticos o tokenizados sustituyen PII en test. Cada release ejecuta pruebas negativas desde grupos y workspaces no autorizados, además de acceso legítimo. Sharing y federation requieren revisión de residencia y egress; una policy local no se supone aplicada automáticamente en el consumidor.",
    ],
    concepts: [
      { term: "Minimización", definition: "Principio de recopilar, procesar y compartir únicamente los atributos y periodos necesarios para una finalidad explícita.", whyItMatters: "Reduce impacto de incidentes, coste de gobierno y complejidad de cumplir borrado, residencia y acceso." },
      { term: "Workspace binding", definition: "Restricción que limita determinados objetos de Unity Catalog a un conjunto aprobado de workspaces dentro de la cuenta.", whyItMatters: "Añade una frontera de entorno incluso cuando una identidad posee privilegios sobre el objeto gobernado." },
      { term: "Prueba negativa de acceso", definition: "Verificación automatizada de que una identidad, workspace u operación fuera del contrato recibe una denegación efectiva.", whyItMatters: "Demuestra controles reales y detecta herencia, excepciones o bindings que una inspección de configuración podría pasar por alto." },
    ],
    workedScenario: {
      situation: "Un dominio sanitario copia PII completa a dev para probar pipelines, retiene tablas indefinidamente y comparte una vista con otra región asumiendo que la máscara del proveedor viajará siempre.",
      reasoning: [
        "Clasificar finalidad y residencia, sustituir datos de dev por sintéticos y vincular catálogos sensibles únicamente a workspaces productivos autorizados.",
        "Definir ABAC, vistas mínimas, retención y purga, y verificar explícitamente qué política se aplica o no al activo compartido y al recipient.",
        "Automatizar pruebas negativas, auditoría de accesos y ensayo de borrado físico, conservando sólo evidencia redactada de cumplimiento.",
      ],
      outcome: "Desarrollo deja de contener PII, el sharing cruza sólo columnas aprobadas y la organización puede demostrar aislamiento, retención y borrado con pruebas repetibles.",
    },
  },
  m31_1: {
    mentalModel: "OpenSharing mueve acceso gobernado hacia el consumidor sin copiar previamente el dataset a una base intermediaria. El proveedor registra un share de activos de solo lectura y un recipient; el consumidor consulta datos actualizados mediante el protocolo y credenciales autorizadas. Databricks-to-Databricks aprovecha Unity Catalog en ambos extremos y puede compartir más tipos de activo entre cuentas y nubes. Databricks-to-Open atiende herramientas o plataformas externas y sus capacidades dependen del protocolo abierto. La autenticación es una decisión separada: OIDC federation intercambia identidad del recipient por tokens cortos; bearer tokens son credenciales portables y duraderas con mayor carga de rotación y exposición. Compartir lectura no transfiere ownership ni aplica mágicamente toda política del proveedor al consumidor.",
    mechanics: [
      "Un share es un securable de Unity Catalog que contiene tablas, vistas u otros activos compatibles; un recipient representa la organización consumidora. En Databricks-to-Databricks, el recipient crea un catalog desde el provider y gobierna acceso interno. En el flujo abierto, clientes usan perfil o intercambio OIDC para solicitar datos; el proveedor entrega acceso temporal a archivos o resultados conforme al protocolo. OIDC U2M o M2M usa el IdP del consumidor, mientras un bearer token debe distribuirse y revocarse de forma segura.",
      "OIDC reduce secreto estático y vincula acceso a identidad, pero exige federación y configuración coordinada; bearer token acelera onboarding de clientes compatibles, pero cualquiera que lo obtenga puede usarlo dentro de su alcance y vigencia. Las capacidades de views, volumes, history o políticas varían por tipo de recipient. Se comprueban matriz actual, cloud, región y cliente antes de prometer una feature. Los eventos se auditan y la revocación se ensaya; acceso read-only no elimina egress ni residencia.",
    ],
    concepts: [
      { term: "Databricks-to-Databricks", definition: "Modelo de OpenSharing entre metastores de Unity Catalog donde proveedor y recipient usan Databricks, incluso en cuentas o nubes distintas.", whyItMatters: "Aprovecha identidad y gobierno nativos en ambos lados y admite tipos de activo más ricos según compatibilidad." },
      { term: "Databricks-to-Open", definition: "Modelo de OpenSharing para consumidores externos que acceden mediante clientes compatibles con el protocolo abierto de intercambio.", whyItMatters: "Amplía interoperabilidad, pero exige revisar formatos, autenticación y capacidades disponibles fuera de Unity Catalog del proveedor." },
      { term: "OIDC federation", definition: "Intercambio de una identidad afirmada por el IdP del consumidor por credenciales OAuth cortas aceptadas por Databricks.", whyItMatters: "Evita distribuir bearer tokens duraderos y mejora revocación, atribución y alineación con el ciclo de identidad." },
    ],
    workedScenario: {
      situation: "Un proveedor debe compartir ventas con una filial Databricks en otra nube y con un regulador que usa Python; seguridad prohíbe secretos estáticos de un año de vigencia.",
      reasoning: [
        "Clasificar cada recipient: Databricks-to-Databricks para la filial y Databricks-to-Open para el cliente Python, verificando activos y formatos compatibles.",
        "Configurar OIDC M2M con identidades separadas, claims mínimos y expiración corta, evitando reutilizar una credencial portable entre organizaciones.",
        "Probar lectura, denegación, auditoría, revocación y residencia en ambos flujos antes de activar acceso continuo al share productivo.",
      ],
      outcome: "Ambos consumidores reciben datos read-only mediante el modelo adecuado, sin bearer tokens duraderos, y cada acceso puede atribuirse y revocarse de forma independiente.",
    },
  },
  m31_2: {
    mentalModel: "Un share debe ser un producto de datos mínimo y contractual, no un catálogo entero expuesto por comodidad. El provider conserva tablas internas, transformaciones y PII; publica sólo activos estables, documentados y apropiados para la audiencia, a menudo mediante views que fijan columnas y semántica. El recipient obtiene acceso al share, no ownership sobre los objetos origen, y puede delegar lectura internamente según su modelo. Añadir o retirar activos cambia el contrato y requiere versionado o comunicación. La revocación forma parte del diseño inicial: debe saberse quién puede retirar recipient o share, cuánto tarda en surtir efecto y qué copias legítimas pudo materializar ya el consumidor.",
    mechanics: [
      "El provider crea share, añade tablas o views compatibles y concede SELECT o permisos de share conforme al flujo; después crea y autoriza recipients. Una view compartida puede proyectar, renombrar y filtrar, pero sus dependencias y políticas tienen requisitos específicos. El consumidor Databricks registra provider y crea un catalog read-only desde el share; los objetos se actualizan conforme cambia la fuente. Ownership de share y objetos se asigna a grupos operativos, y audit registra creación, modificación y consultas capturadas.",
      "Compartir una tabla base simplifica y maximiza flexibilidad, pero congela poco contrato y puede exponer columnas futuras. Una view estabiliza interfaz y minimiza, aunque añade dependencia y puede limitar features o rendimiento. Se versiona cuando hay cambios incompatibles y se ofrece ventana de transición. Declarative Automation Bundles, alias actual de Asset Bundles en el examen, puede versionar jobs y configuración soportada alrededor del producto; aun así las operaciones de sharing y permisos se verifican en el target.",
    ],
    concepts: [
      { term: "Share", definition: "Securable de Unity Catalog que agrupa un conjunto explícito de activos read-only ofrecidos por un proveedor a recipients autorizados.", whyItMatters: "Define la frontera revocable y auditable del producto compartido sin transferir propiedad del almacenamiento subyacente." },
      { term: "Recipient", definition: "Entidad registrada que representa a una organización consumidora y su método de autenticación para acceder a shares concedidos.", whyItMatters: "Separa consumidores, credenciales y revocación, evitando una identidad compartida cuyo uso no puede atribuirse." },
      { term: "Contrato compartido", definition: "Compromiso versionado sobre schema, significado, frescura, compatibilidad y proceso de cambio de los activos publicados.", whyItMatters: "Permite que consumidores dependan del producto sin quedar expuestos a cada detalle interno o columna futura." },
    ],
    workedScenario: {
      situation: "Un partner recibe una tabla gold completa; una nueva columna de margen confidencial aparece automáticamente y otro cambio renombra customer_segment, rompiendo su pipeline sin aviso.",
      reasoning: [
        "Sustituir la tabla base por una view mínima con columnas aprobadas y contrato de schema, validando que el tipo de recipient soporta esa forma.",
        "Publicar una versión nueva para el rename, mantener transición y comunicar deprecación con métricas de consumo y una fecha acordada.",
        "Ensayar revocación de un recipient de prueba, comprobar audit y asignar ownership del share a un grupo estable con runbook de emergencia.",
      ],
      outcome: "El partner recibe una interfaz estable sin margen confidencial, los cambios incompatibles siguen un ciclo versionado y la revocación deja de ser un procedimiento improvisado.",
    },
  },
  m31_3: {
    mentalModel: "Sharing cruza una frontera organizativa aunque los datos permanezcan en almacenamiento del proveedor. Cada consulta puede generar transferencia, credenciales temporales y eventos de acceso; por eso la evaluación abarca residencia, egress, identidad, retención y compatibilidad, no sólo un GRANT. Provider y recipient tienen responsabilidades distintas: el primero decide qué expone y monitorea solicitudes; el segundo gobierna quién puede leer el catálogo recibido y qué copias deriva. Una política ABAC del proveedor puede tener limitaciones o no gobernar el lado receptor como se imagina; el consumidor necesita sus propios controles. Bearer tokens se rotan y distribuyen con cuidado, OIDC se prefiere cuando está disponible, y todo onboarding incluye una prueba real de revocación.",
    mechanics: [
      "system.access.audit registra eventos de OpenSharing para providers y recipients cuando las system tables están habilitadas. Según el modo, una lectura puede aparecer como consulta de tabla o generación de credenciales temporales; request_params y response ayudan a identificar recipient y objeto. Cloud tokens o URLs firmadas otorgan acceso acotado, pero el egress se produce desde la ubicación del dato hacia el cliente. Los shares son read-only, aunque el recipient puede materializar resultados bajo su propio gobierno y retención.",
      "La residencia se evalúa con región de metastore, almacenamiento y consumidor; una conexión técnica posible no equivale a aprobación legal. Se presupuestan egress y patrones de scan, se minimizan columnas y periodos y se alertan volúmenes anómalos. Los logs contienen identidad y rutas, por lo que una vista redactada sirve a operaciones. Si se usa bearer token, se fija expiración, canal y rotación; si OIDC, se prueban claims, revocación en IdP y fallo cerrado. Las políticas del recipient se validan independientemente.",
    ],
    concepts: [
      { term: "Egress", definition: "Transferencia de datos desde la región o proveedor de almacenamiento hacia otra red, región, nube o consumidor externo.", whyItMatters: "Puede introducir coste, latencia y restricciones de residencia aunque OpenSharing evite una copia administrada previa." },
      { term: "Cloud credential temporal", definition: "Credencial de alcance y duración reducidos generada para que un cliente lea únicamente datos autorizados de un share.", whyItMatters: "Limita exposición frente a claves permanentes, pero su generación y uso todavía requieren auditoría y controles." },
      { term: "Responsabilidad compartida", definition: "División de obligaciones donde provider gobierna publicación y recipient gobierna acceso y derivados dentro de su organización.", whyItMatters: "Evita asumir que una policy del origen protege automáticamente copias, usuarios o retención en el consumidor." },
    ],
    workedScenario: {
      situation: "Un recipient europeo consulta diariamente 40 TB desde almacenamiento estadounidense, crea copias locales y usa un bearer token compartido por doce analistas sin atribución individual.",
      reasoning: [
        "Medir egress y revisar residencia, contrato y necesidad real de columnas y ventanas antes de optimizar únicamente la velocidad de transferencia.",
        "Migrar a OIDC o identidades separadas, minimizar el share y acordar controles del recipient sobre copias, retención y usuarios internos.",
        "Configurar consultas de audit y alertas de volumen, y ensayar revocación tanto en provider como en IdP del consumidor.",
      ],
      outcome: "La transferencia baja sustancialmente, cada acceso queda atribuido y ambas partes documentan residencia y derivados en lugar de confiar en un token colectivo indefinido.",
    },
  },
  m31_4: {
    mentalModel: "Lakehouse Federation consulta datos donde viven, pero hay dos arquitecturas diferentes. Query federation conecta mediante JDBC a una base operacional; parte del plan se empuja al motor remoto y el resto se ejecuta en Databricks. Catalog federation integra metadatos de un catálogo externo y Databricks lee directamente sus archivos de object storage con su propio compute. Ambas se presentan como foreign catalogs gobernados por Unity Catalog y son normalmente read-only, pero el lugar de ejecución, coste y límites no coinciden. El pushdown no es todo o nada: depende del conector y operación. Una consulta que devuelve demasiadas filas puede saturar la base remota o un executor aunque el SQL parezca simple.",
    mechanics: [
      "Query federation crea una connection con credenciales y un foreign catalog que refleja la base. Databricks traduce filtros, proyecciones o agregaciones soportadas a SQL remoto y recibe resultados por conexiones JDBC; operaciones no empujadas se completan en Databricks. Catalog federation obtiene metadatos desde sistemas como Hive Metastore o Glue, pero los executors leen directamente archivos accesibles en almacenamiento. Unity Catalog aplica permisos sobre foreign catalogs y registra lineage cuando puede inferirlo.",
      "Query federation aprovecha compute remoto y sirve exploración, pero compite con OLTP, hereda límites de conexiones, no usa los mismos caches y puede devolver un stream grande a una tarea. Catalog federation evita JDBC para datos de object storage, pero requiere credenciales, formatos y catálogo compatibles. Ninguna opción es una ruta general de escritura o CDC. Se prueba pushdown mediante profile y carga remota, latencia, consistencia, egress y permisos. Para alto volumen recurrente, ingestión gestionada suele ofrecer mejor aislamiento.",
    ],
    concepts: [
      { term: "Query federation", definition: "Acceso read-only a bases externas mediante JDBC, con pushdown compatible y ejecución repartida entre sistema remoto y Databricks.", whyItMatters: "Permite análisis in situ rápido, pero puede trasladar carga a un sistema operacional y limitar throughput." },
      { term: "Catalog federation", definition: "Integración de metadatos de un catálogo externo mientras Databricks lee directamente los archivos subyacentes con su propio compute.", whyItMatters: "Facilita modelos híbridos y migraciones sin JDBC, siempre que almacenamiento, credenciales y formatos sean compatibles." },
      { term: "Pushdown", definition: "Traducción de filtros, proyecciones o agregaciones para ejecutarlos en la fuente antes de transferir el resultado a Databricks.", whyItMatters: "Reduce movimiento cuando es compatible, pero debe verificarse porque operadores no soportados se ejecutan localmente." },
    ],
    workedScenario: {
      situation: "Un analista federado consulta PostgreSQL y une 900 millones de órdenes con Delta; el filtro usa una función no empujable y la base OLTP alcanza límites de conexiones durante horario comercial.",
      reasoning: [
        "Examinar profile y SQL remoto para confirmar qué se empuja, cuánto resultado cruza JDBC y cómo la consulta afecta CPU y conexiones operacionales.",
        "Reformular filtros compatibles para exploración inmediata y limitar warehouse, concurrencia y horario mientras se evalúa el patrón recurrente.",
        "Mover el caso estable a ingestión incremental o CDC con tabla Delta, manteniendo federation sólo para validación y consultas ad hoc pequeñas.",
      ],
      outcome: "La base operacional recupera margen, el análisis recurrente obtiene SLA predecible en Delta y federation conserva su función de acceso rápido sin convertirse en ETL oculto.",
    },
  },
  m31_5: {
    mentalModel: "Sharing, federation e ingestión resuelven direcciones distintas. Sharing publica desde un proveedor hacia consumidores read-only y conserva el producto en origen. Federation permite a Databricks consultar un sistema externo in situ, normalmente para exploración o modelo híbrido. Ingestión mueve cambios a Delta para que Databricks controle rendimiento, historial, calidad y escritura downstream. La decisión se formula con dirección, frecuencia, frescura, volumen, write needs, gobierno, egress y aislamiento operacional. La menor latencia aparente puede esconder carga en OLTP; la copia más robusta puede incumplir residencia; sharing puede ser perfecto para colaboración pero no para actualizar el sistema del provider. Ninguna etiqueta sustituye una matriz de requisitos y una prueba de fallo.",
    mechanics: [
      "OpenSharing usa shares y recipients y refleja actualizaciones read-only casi en tiempo real según activo y cliente. Federation crea connections y foreign catalogs y ejecuta lecturas en fuente o almacenamiento externo. Ingestión batch, query-based o CDC crea una copia gobernada con checkpoint, schema y SLA propios. Los tres pueden aparecer bajo Unity Catalog, pero ownership y operaciones permitidas difieren. El patrón elegido determina dónde se aplican expectativas, retención, lineage, coste y recovery.",
      "Federation evita pipeline inicial, pero cada consulta depende de disponibilidad y rendimiento externos. Ingestión añade almacenamiento y retraso, pero aísla consumidores y soporta transformaciones, CDF y replays. Sharing evita que cada recipient opere conectores de fuente, pero exige contrato y autenticación. Se puntúan requisitos obligatorios antes del coste, se prueba con volumen y fallo real y se documenta salida. La configuración automatizada usa Declarative Automation Bundles actuales; Asset Bundles es el alias que puede aparecer en el blueprint Professional.",
    ],
    concepts: [
      { term: "Dirección de acceso", definition: "Relación entre quien posee el dato, quien inicia la consulta y dónde debe materializarse el estado resultante.", whyItMatters: "Distingue publicar a consumidores, consultar una fuente externa y copiar datos para procesamiento controlado." },
      { term: "Aislamiento operacional", definition: "Grado en que fallos, carga o cambios de un sistema pueden afectar disponibilidad y rendimiento del otro.", whyItMatters: "Una consulta federada puede impactar OLTP, mientras una copia ingerida desacopla ambos a cambio de frescura." },
      { term: "Frescura efectiva", definition: "Edad observable del dato utilizable después de transporte, procesamiento, validación y disponibilidad para el consumidor.", whyItMatters: "Evita comparar sólo frecuencia de trigger y revela retrasos de calidad, backlog o publicación downstream." },
    ],
    workedScenario: {
      situation: "Una empresa necesita explorar CRM mañana, alimentar modelos horarios con 5 TB diarios y compartir resultados curados con tres partners que no deben acceder al CRM.",
      reasoning: [
        "Usar query federation temporalmente para exploración selectiva, con límites que protejan CRM y sin confundirla con la solución de alto volumen.",
        "Implantar ingestión incremental o CDC hacia Delta para modelos, calidad, historial y aislamiento con frescura horaria verificable.",
        "Publicar únicamente resultados curados mediante OpenSharing con recipients separados, contratos, OIDC y auditoría de cada consumidor.",
      ],
      outcome: "Cada necesidad usa el patrón coherente con dirección y carga: descubrimiento rápido, procesamiento aislado y distribución gobernada sin exponer el sistema operacional.",
    },
  },
  m32_1: {
    mentalModel: "Una arquitectura Professional es una cadena de decisiones trazables, no un collage de servicios. Cada requisito se transforma primero en una propiedad medible: frescura en SLO, exactitud en reconciliaciones, seguridad en principals y policies, recuperación en RPO y RTO, y coste en unidad de valor. Después se asignan componentes que satisfacen esas propiedades y se documentan tradeoffs y fallos. Ownership y contratos definen quién responde cuando el sistema se degrada. La certificación evalúa escoger la opción más adecuada bajo restricciones, por lo que una respuesta defendible conecta requisito, mecanismo y evidencia. Si dos soluciones funcionan, gana la que usa capacidades administradas, mínimo privilegio, idempotencia y menor carga operativa sin violar una condición explícita.",
    mechanics: [
      "El diseño empieza con fuentes, volumen, variabilidad, consumidores y límites regulatorios; dibuja data flow y trust boundaries. Para cada etapa declara input, output, schema, clave, semántica temporal, SLA y owner. Los SLO se acompañan de indicadores consultables y alertas; RPO y RTO se vinculan a checkpoints, retención, backfills y runbooks. La matriz de decisiones registra por qué se usa Lakeflow Connect, Auto Loader, Spark Declarative Pipelines, Jobs, Delta, Unity Catalog o sharing, en lugar de enumerarlos sin función.",
      "El blueprint Professional del 30 de noviembre de 2025 conserva términos de su fecha: Asset Bundles corresponde hoy a Declarative Automation Bundles, renombrado en marzo de 2026. La tecnología y el razonamiento de proyecto declarativo son equivalentes para examen. Del mismo modo, el diseño verifica nombres y límites actuales sin asumir que una feature preview es universal. Un architecture decision record incluye alternativa descartada, coste, riesgo, señal de éxito y condición que obligaría a revisar la elección.",
    ],
    concepts: [
      { term: "SLO", definition: "Objetivo cuantitativo de fiabilidad o rendimiento, como frescura, disponibilidad o latencia, medido durante una ventana acordada.", whyItMatters: "Convierte expectativas ambiguas en criterios que guían arquitectura, alertas, capacidad y decisiones durante incidentes." },
      { term: "Trust boundary", definition: "Frontera donde cambian identidad, control administrativo, residencia o nivel de confianza de datos y operaciones.", whyItMatters: "Obliga a diseñar autenticación, minimización, cifrado y auditoría exactamente donde aumenta el riesgo." },
      { term: "Architecture decision record", definition: "Registro breve del contexto, decisión, alternativas, tradeoffs y señales que justificarán revisar una elección arquitectónica.", whyItMatters: "Hace defendible el diseño y evita perder el razonamiento cuando cambian requisitos, equipos o capacidades de plataforma." },
    ],
    workedScenario: {
      situation: "Una aseguradora pide fraude en menos de cinco minutos, cierre financiero diario exacto, residencia europea, recuperación de dos horas y coste atribuible por póliza, pero el brief sólo dice usar lakehouse.",
      reasoning: [
        "Convertir cada frase en SLO, RPO/RTO, trust boundaries, contratos y métricas de coste, asignando owner y consumidor a cada producto intermedio.",
        "Comparar streaming, batch y capacidades gestionadas por requisito, documentando dónde se necesita estado, idempotencia, aislamiento y una ruta de backfill.",
        "Crear ADRs y pruebas de aceptación que midan frescura, reconciliación, residencia, recuperación y coste antes de aprobar la arquitectura propuesta.",
      ],
      outcome: "El resultado deja de ser un diagrama ornamental y se convierte en un sistema verificable cuya selección de componentes puede justificarse ante operación, seguridad, negocio y examen.",
    },
  },
  m32_2: {
    mentalModel: "Un flujo end-to-end correcto mantiene identidad y orden del cambio desde la fuente hasta el modelo curado. Batch y CDC pueden solaparse durante bootstrap; schema puede evolucionar; eventos pueden repetirse o llegar tarde. La idempotencia se diseña con claves de negocio, secuencia, checkpoints y operaciones declarativas como AUTO CDC o MERGE determinista, no confiando en que una ejecución ocurra una sola vez. Bronze preserva evidencia y metadatos de ingestión; silver aplica contrato, deduplicación y cambios; gold publica semántica de consumidor. Un backfill usa el mismo contrato o una ruta compatible, con intervalo, snapshot y versión registrados. La convergencia se demuestra mediante reconciliación, no por ausencia de excepciones.",
    mechanics: [
      "Auto Loader o Connect mantiene progreso de ingestión y schema según configuración; Spark Declarative Pipelines puede declarar streaming tables, expectations y AUTO CDC para aplicar cambios ordenados. Delta commits hacen atómica cada tabla, mientras claves y sequence_by determinan cómo resolver repeticiones y out-of-order. CDF ofrece cambios downstream cuando se habilita y retiene adecuadamente. Jobs orquesta bootstrap, flujo continuo, validaciones y publicación, pasando parámetros explícitos en lugar de estado oculto.",
      "Permitir evolución automática de toda columna puede propagar errores; bloquear todo schema paraliza cambios compatibles. Se define política por capa y cuarentena para desviaciones. SCD Type 1 sobrescribe estado; Type 2 conserva intervalos y requiere desempate y exclusividad de current. Backfill concurrente con stream puede colisionar o duplicar si no comparte claves y semántica. Se ensaya replay completo, evento duplicado, llegada tardía, cambio de schema y fallo entre capas, verificando recuentos, sums y versiones.",
    ],
    concepts: [
      { term: "Convergencia", definition: "Propiedad por la que procesamiento normal, retries y backfills alcanzan el mismo estado correcto para una entrada lógica equivalente.", whyItMatters: "Demuestra idempotencia real y permite recuperación sin depender de una secuencia perfecta de ejecuciones." },
      { term: "Sequence by", definition: "Expresión de orden usada por una operación CDC para decidir qué cambio es posterior para cada clave de negocio.", whyItMatters: "Resuelve llegadas fuera de orden de forma determinista y evita que un evento antiguo sobrescriba estado reciente." },
      { term: "Bootstrap", definition: "Carga inicial que establece un estado completo antes de aplicar cambios incrementales continuos desde una frontera coordinada.", whyItMatters: "Un solapamiento o hueco entre snapshot y CDC crea duplicados o pérdida histórica difícil de detectar después." },
    ],
    workedScenario: {
      situation: "Se migran 12 TB de clientes desde PostgreSQL: el snapshot tarda seis horas mientras CDC continúa, llegan updates duplicados y una columna nueva aparece antes de terminar bootstrap.",
      reasoning: [
        "Fijar una frontera consistente entre snapshot y log, conservar source sequence e ingestion metadata en bronze y definir la política de schema para la columna nueva.",
        "Aplicar AUTO CDC o MERGE determinista por customer_id y secuencia en silver, con cuarentena para cambios incompatibles y SCD explícita.",
        "Reproducir snapshot más CDC en un target aislado y reconciliar claves, current, intervalos y totales antes de promover el mismo flujo.",
      ],
      outcome: "Bootstrap e incremental convergen sin huecos ni duplicados, la columna nueva sigue un contrato controlado y futuros replays producen exactamente el mismo estado curado.",
    },
  },
  m32_3: {
    mentalModel: "Operar un producto de datos exige observar plataforma y significado. Una tarea verde sólo indica que el código terminó; no demuestra frescura, completitud ni exactitud. Expectations miden reglas en el flujo y pueden advertir, descartar o fallar según gravedad. El event log del pipeline explica updates y calidad; system tables aportan historia de jobs, queries, compute, coste, audit y lineage; las tablas de negocio aportan reconciliaciones. Las alertas se enlazan a un SLO y un runbook, con owner y acción inicial. El diseño también presupone que una fuente de observabilidad puede ser parcial o retrasada, por lo que combina señales y mantiene IDs comunes para reconstruir un incidente.",
    mechanics: [
      "Cada etapa emite métricas de input, output, cuarentena, retraso y versión. Expectations codifican invariantes locales y el event log permite consultar resultados por update. Lakeflow Jobs ofrece estados, duración, retries y task lineage; system tables soportan tendencias históricas. Query Profile o Spark UI aporta detalle de una ejecución concreta. Alertas sobre backlog, error budget, duplicados o coste incluyen run, tabla y enlace al runbook. La telemetría sensible se publica mediante vistas redactadas y acceso mínimo.",
      "Alertar cada fallo produce fatiga; ocultar warnings de calidad deja que el producto degrade silenciosamente. Se definen severidades: una fila inválida puede ir a cuarentena, una reconciliación financiera debe bloquear publicación. El runbook especifica diagnóstico, mitigación reversible, criterios de recuperación y escalado. Se ejecutan game days de source delay, schema break, skew y permiso revocado. Los dashboards miden error budget y tendencia, no sustituyen el ejercicio periódico y recurrente del procedimiento.",
    ],
    concepts: [
      { term: "Expectation", definition: "Regla declarativa de calidad asociada a un dataset que registra o aplica una acción cuando una fila la incumple.", whyItMatters: "Convierte contratos de datos en telemetría y control durante procesamiento, antes de publicar resultados defectuosos." },
      { term: "Error budget", definition: "Cantidad tolerada de incumplimiento de un SLO durante una ventana, derivada del objetivo de fiabilidad acordado.", whyItMatters: "Equilibra entrega y estabilidad y proporciona una señal objetiva para priorizar trabajo de fiabilidad." },
      { term: "Game day", definition: "Ejercicio controlado que introduce un fallo previsto para comprobar alertas, roles, runbooks y capacidad real de recuperación.", whyItMatters: "Detecta procedimientos incompletos antes de un incidente y transforma documentación no ejecutada en evidencia operativa." },
    ],
    workedScenario: {
      situation: "El Job finaliza correctamente durante una semana, pero el source dejó de enviar una región y gold publica 18 % menos ventas; no existe alerta porque sólo se monitoriza estado de tarea.",
      reasoning: [
        "Definir expectativa y reconciliación por región, frescura y volumen, con baseline estacional para evitar confundir una caída real de negocio con ausencia técnica.",
        "Consultar event log, runs y lineage por IDs comunes, bloquear publicación financiera y activar un runbook de fuente ausente y backfill idempotente.",
        "Añadir alerta ligada al SLO y ejecutar un game day que repita pérdida regional, validando comunicación, recuperación y cierre del error budget.",
      ],
      outcome: "La plataforma detecta ausencia antes de publicar, el backfill restaura la región sin duplicados y operación demuestra recuperación aunque todas las tareas hubieran estado verdes.",
    },
  },
  m32_4: {
    mentalModel: "Seguridad, privacidad y FinOps son restricciones de arquitectura, no revisiones posteriores. La identidad de servicio determina quién ejecuta; Unity Catalog y ABAC determinan qué objetos y valores puede usar; minimización y retención determinan qué datos existen; bindings y sharing determinan dónde circulan; system.billing.usage y metadatos determinan quién paga. Estas decisiones interactúan: una mask compleja puede afectar rendimiento, una copia para optimizar puede violar residencia y un tag de coste puede filtrar PII. El diseño Professional expresa tradeoffs y separa identidades de deploy, ejecución y consumo. Cada control tiene una prueba positiva, una negativa y una señal de auditoría, y cada coste se vincula a una unidad de valor sin debilitar integridad.",
    mechanics: [
      "Service principals reciben privilegios mínimos y secrets mediante mecanismos gobernados. Governed tags clasifican y activan ABAC; row filters y masks limitan datos en consulta; workspace bindings restringen entornos. OpenSharing usa recipients separados y OIDC cuando procede. billing.usage se une a jobs, query history y dimensiones de negocio para obtener coste por dominio o producto. La configuración de aplicación se despliega con Declarative Automation Bundles, nombre actual de Asset Bundles en el blueprint, usando identidades y targets aislados.",
      "Un único principal administrador simplifica demos pero elimina separación de funciones. Un tag con customer_name mejora atribución aparente a costa de privacidad; se usan IDs no sensibles y taxonomía controlada. Reducir coste por desactivar validaciones o acortar retención sin analizar recovery es una falsa optimización. El threat model enumera fronteras y abusos; las pruebas verifican denegación desde grupo y workspace incorrectos, revocación de share y cobertura de billing. Las excepciones tienen owner y caducidad.",
    ],
    concepts: [
      { term: "Separation of duties", definition: "Distribución de capacidades críticas entre identidades o grupos para que ninguna parte controle despliegue, acceso y auditoría completamente sola.", whyItMatters: "Reduce abuso y error, y mantiene independencia entre quien cambia controles y quien revisa su evidencia." },
      { term: "Coste por unidad de valor", definition: "Gasto atribuido dividido por un resultado de negocio verificable, como póliza procesada correctamente o tabla publicada con SLA.", whyItMatters: "Evita recortes que reducen calidad y distingue crecimiento útil de una regresión de eficiencia operacional." },
      { term: "Control compensatorio", definition: "Medida alternativa que reduce un riesgo cuando el control preferido no es viable por una limitación técnica o temporal.", whyItMatters: "Permite excepciones explícitas y evaluables sin fingir que el requisito desapareció o aceptar riesgo sin tratamiento." },
    ],
    workedScenario: {
      situation: "Un pipeline usa un principal owner del catálogo, copia PII a test, etiqueta compute con customer_name y cuesta 0,04 euros por registro, pero nadie incluye fallos en el denominador.",
      reasoning: [
        "Separar principals de deploy y ejecución, sustituir datos de test, aplicar grupos, ABAC y bindings, y eliminar identificadores sensibles de tags.",
        "Unir billing con runs correctos y volumen publicado para calcular coste por registro válido, mostrando retries y cuarentena como desperdicio visible.",
        "Automatizar pruebas negativas, audit y budgets en targets del bundle, manteniendo excepción documentada sólo donde una capacidad actual no cubra el control.",
      ],
      outcome: "El producto reduce privilegios y exposición, obtiene atribución no sensible y descubre que el coste real por registro correcto era el doble, habilitando una optimización honesta.",
    },
  },
  m32_5: {
    mentalModel: "Un simulacro Professional se resuelve como una revisión de diseño bajo tiempo. Primero se identifica la condición dominante y se clasifica el dominio: modelado, procesamiento, seguridad, observabilidad, testing, deployment o optimización. Después se descartan opciones que violan una palabra del caso, dependen de edición manual, destruyen estado o usan absolutos como siempre aumentar compute. La respuesta correcta suele combinar una capacidad específica con evidencia: preservar checkpoint, usar idempotencia, revisar plan, aplicar mínimo privilegio o promover un artefacto. No se memoriza la posición de respuestas ni preguntas reales. El blueprint orienta cobertura; la documentación vigente resuelve nomenclatura, como Declarative Automation Bundles, antes Asset Bundles en la guía de 2025.",
    mechanics: [
      "En una primera pasada se contestan decisiones claras y se marcan las que requieren comparar dos alternativas. En cada pregunta se subrayan estado actual, objetivo, restricción y señal solicitada. Se eliminan distractores por categoría: semántica incorrecta, capacidad incompatible, remedio de otra capa o exceso operacional. En la revisión se cambia una respuesta sólo al poder nombrar la condición que se interpretó mal. El tiempo se reserva por bloques y no se consume intentando recordar una frase exacta de documentación.",
      "Tras el simulacro, el porcentaje global oculta huecos. Se etiqueta cada error por dominio y tipo de razonamiento: concepto ausente, lectura, terminología o tradeoff. Se vuelve a la fuente oficial y se escribe una regla propia con un contraejemplo; después se responde una variante. El 80 % es un indicador interno del curso, no una nota oficial garantizada. La preparación autosuficiente exige explicar por qué tres distractores fallan y ejecutar laboratorios, no sólo reconocer una opción familiar.",
    ],
    concepts: [
      { term: "Restricción dominante", definition: "Condición del escenario que descarta más alternativas y debe satisfacerse antes de optimizar preferencias secundarias de diseño.", whyItMatters: "Evita elegir una práctica generalmente buena que incumple estado, seguridad, latencia o compatibilidad explícitamente exigidos." },
      { term: "Distractor de capa", definition: "Opción que propone una acción válida para rendimiento, datos, recursos o demanda, pero en una capa distinta de la causa descrita.", whyItMatters: "Reconocerlo impide escalar compute ante cardinalidad, cambiar SQL ante cola o borrar checkpoint ante corrupción de schema." },
      { term: "Revisión razonada", definition: "Análisis posterior que explica la opción correcta, refuta las restantes y enlaza el error con concepto y evidencia oficial.", whyItMatters: "Convierte el simulacro en aprendizaje transferible y reduce dependencia de memorizar patrones o posiciones de respuesta." },
    ],
    workedScenario: {
      situation: "En un simulacro, una pregunta describe cinco tareas con gran shuffle entre cuatro mil normales; las opciones ofrecen duplicar workers, coalesce a uno, activar autoscaling o tratar claves calientes con AQE.",
      reasoning: [
        "Identificar la distribución extrema como señal dominante de skew y ubicar la causa en datos y particiones, no en capacidad media del clúster.",
        "Descartar coalesce porque concentra trabajo, y escalado o autoscaling porque añaden slots sin dividir la clave que determina el camino crítico.",
        "Elegir diagnóstico de claves y tratamiento compatible con AQE, y verificar luego en documentación qué joins y planes adaptativos admiten esa corrección.",
      ],
      outcome: "La respuesta surge de mecanismo y evidencia, no de una palabra memorizada; el mismo método se transfiere a preguntas nuevas de spill, joins, coste o fiabilidad.",
    },
  },
} satisfies Record<string, LessonDeepDive>;

export const advancedContentB: Record<string, ModuleContentPack> = {
  m23: {
    lessons: [
      {
        summary: "Aprende a distinguir skew real de una etapa simplemente costosa usando la distribución de tiempos, bytes y registros por tarea.",
        deepDive: advancedDeepDives.m23_1,
        explanation: [
          "En Spark, una etapa termina cuando acaba su tarea más lenta. Por eso una media razonable puede ocultar una cola extrema: si la mediana dura 18 segundos y una tarea tarda 11 minutos, añadir workers no elimina la clave caliente que concentra datos. La evidencia útil está en la pestaña Stages de Spark UI: duración máxima frente a mediana, registros de entrada, shuffle read y tamaño de cada tarea.",
          "Antes de aplicar salting, confirma la causa. Un join con una clave nula dominante, un cliente desproporcionado o una partición temporal demasiado amplia producen remedios distintos. AQE puede dividir particiones sesgadas en joins compatibles; si la distribución forma parte del negocio, conviene además aislar claves calientes o rediseñar la agregación y medir el efecto con el mismo conjunto de datos.",
        ],
        keyPoints: [
          "Compara percentiles y máximos por tarea, no sólo la duración media de la etapa.",
          "Relaciona la tarea lenta con sus bytes de shuffle y número de registros.",
          "Corrige la distribución de datos antes de aumentar capacidad de forma permanente.",
        ],
        example: {
          language: "PySpark",
          title: "Medir la distribución de una clave antes del join",
          code: `from pyspark.sql import functions as F

key_profile = (
    orders.groupBy("customer_id")
    .count()
    .orderBy(F.desc("count"))
)

key_profile.show(20, truncate=False)
orders.where(F.col("customer_id").isNull()).count()`,
          note: "La tabla de frecuencias no sustituye Spark UI, pero permite conectar una tarea extrema con una clave de negocio concreta.",
        },
        pitfalls: [
          "Confundir muchas tareas pequeñas con skew: en ese caso el problema puede ser sobreparticionado y overhead de planificación.",
          "Aplicar salting a todas las claves y encarecer el join aunque sólo una fracción mínima esté sesgada.",
        ],
        examDecision: "Si unas pocas tareas concentran mucho más shuffle y tiempo que la mediana, investiga skew y deja que AQE actúe antes de redimensionar el clúster.",
        checkpoint: {
          question: "Una etapa tiene 4.000 tareas; 3.995 duran menos de 25 segundos y cinco superan 12 minutos con diez veces más shuffle read. ¿Cuál es la primera hipótesis?",
          answer: "Skew de datos en unas pocas particiones; hay que localizar las claves calientes y comprobar si AQE las divide.",
        },
      },
      {
        summary: "Interpreta memory spill y disk spill como síntomas de presión durante sort, aggregate o join, no como una orden automática de comprar más memoria.",
        deepDive: advancedDeepDives.m23_2,
        explanation: [
          "Spark derrama datos cuando una operación no puede mantener en memoria sus estructuras intermedias. El spill a disco añade serialización e I/O; un volumen pequeño puede ser normal, pero spill masivo junto con garbage collection, tareas largas o executor lost indica que el plan y la forma de los datos no caben de manera eficiente. Revisa la etapa concreta, el operador y la distribución antes de cambiar la máquina.",
          "Las palancas tienen costes distintos. Reducir el ancho de fila proyectando sólo columnas necesarias, filtrar antes del shuffle o sustituir una UDF por funciones nativas reduce trabajo. Reparticionar puede distribuir mejor la carga, mientras que workers con más memoria ayudan cuando cada partición es legítimamente grande. Aumentar `spark.sql.shuffle.partitions` sin medir puede crear miles de tareas diminutas.",
        ],
        keyPoints: [
          "Ubica el spill en una etapa y operador concretos.",
          "Reduce datos antes del shuffle mediante filtros y proyección de columnas.",
          "Diferencia presión por partición de falta de memoria global del workload.",
        ],
        example: {
          language: "PySpark",
          title: "Reducir el ancho antes de agregar",
          code: `from pyspark.sql import functions as F

daily_net = (
    events
    .where(F.col("event_date") >= F.date_sub(F.current_date(), 30))
    .select("event_date", "store_id", "net_amount")
    .groupBy("event_date", "store_id")
    .agg(F.sum("net_amount").alias("net_amount"))
)

daily_net.explain("formatted")`,
          note: "La proyección temprana evita transportar payloads que no participan en la agregación; confirma el cambio en el plan y en los bytes de shuffle.",
        },
        pitfalls: [
          "Aumentar el tamaño de los workers sin eliminar columnas grandes que atraviesan el shuffle.",
          "Usar `coalesce(1)` para controlar archivos y concentrar toda la escritura en una tarea.",
        ],
        examDecision: "Ante spill, reduce primero el volumen por partición y verifica el plan; escala verticalmente sólo cuando la partición necesaria sigue excediendo memoria.",
        checkpoint: {
          question: "¿Por qué un spill elevado no demuestra por sí solo que falte memoria en todo el clúster?",
          answer: "Porque puede originarse en una única partición sesgada o en un operador que mueve columnas innecesarias; hay que localizar etapa y tarea.",
        },
      },
      {
        summary: "Comprende qué puede reoptimizar Adaptive Query Execution en tiempo de ejecución y qué decisiones siguen dependiendo del diseño del ingeniero.",
        deepDive: advancedDeepDives.m23_3,
        explanation: [
          "AQE usa estadísticas disponibles después de exchanges para cambiar una estrategia sort-merge a broadcast hash, combinar particiones post-shuffle demasiado pequeñas, dividir particiones sesgadas y propagar relaciones vacías. En Databricks está habilitado por defecto para consultas batch compatibles con exchanges o subconsultas. El plan adaptativo final puede diferir del plan inicial mostrado antes de ejecutar.",
          "AQE no reordena dinámicamente todos los joins ni arregla un modelo de datos deficiente. Una relación que parece pequeña en catálogo puede superar el límite real, y determinados tipos de join no admiten broadcast en uno de sus lados. Usa `explain('formatted')`, el plan final de Spark UI y métricas de ejecución para demostrar qué regla se aplicó; evita copiar configuraciones antiguas que anulen los defaults optimizados.",
        ],
        keyPoints: [
          "AQE decide con estadísticas posteriores al shuffle, más precisas que muchas estimaciones previas.",
          "Puede coalescer particiones y tratar skew sin alterar el resultado lógico.",
          "No sustituye el orden lógico de joins ni una buena reducción temprana de datos.",
        ],
        example: {
          language: "PySpark",
          title: "Inspeccionar configuración y plan adaptativo",
          code: `print(spark.conf.get("spark.sql.adaptive.enabled"))

result = (
    facts.join(dimensions, "product_id")
    .groupBy("category")
    .count()
)

result.explain("formatted")
result.count()  # materializa el plan para revisarlo en Spark UI`,
          note: "La acción materializa la consulta; revisa después el plan final y no deduzcas la estrategia sólo del plan inicial.",
        },
        pitfalls: [
          "Suponer que AQE reordena automáticamente una cadena de joins mal diseñada.",
          "Desactivar AQE para reproducir una configuración heredada sin comparar resultados y métricas.",
        ],
        examDecision: "Confía en AQE para ajustes runtime compatibles; conserva hints sólo cuando conoces la relación y puedes demostrar que anticipar la estrategia evita trabajo.",
        checkpoint: {
          question: "¿Qué ventaja tiene un broadcast planeado estáticamente frente a uno elegido tarde por AQE?",
          answer: "Puede evitar desde el inicio el shuffle de ambos lados; AQE quizá sólo descubra el tamaño real después de que ese intercambio ya ocurra.",
        },
      },
      {
        summary: "Selecciona broadcast, sort-merge u otra estrategia según tamaño, tipo de join, estadísticas y riesgo para el driver y los executors.",
        deepDive: advancedDeepDives.m23_4,
        explanation: [
          "Un broadcast hash join replica la relación pequeña y evita repartir la grande por la clave. Es excelente para una dimensión realmente pequeña, pero peligroso si las estadísticas están obsoletas o si el lado difundido crece: la transferencia y la tabla hash consumen memoria en cada executor. Los hints expresan una preferencia al optimizador, no corrigen una semántica de join incompatible.",
          "Para joins grandes, el sort-merge distribuye ambos lados y paga shuffle y ordenación. Reduce primero las filas y columnas, conserva estadísticas y observa si hay claves calientes. En SQL y DataFrames, el criterio no es 'broadcast siempre es más rápido', sino coste total, compatibilidad del tipo de join y evidencia estable en ejecuciones representativas.",
        ],
        keyPoints: [
          "Difunde sólo relaciones acotadas cuyo tamaño conoces en producción.",
          "Un hint no cambia qué lado puede difundirse en cada tipo de join.",
          "Actualiza estadísticas y compara el plan físico, no sólo el código fuente.",
        ],
        example: {
          language: "PySpark",
          title: "Broadcast explícito de una dimensión acotada",
          code: `from pyspark.sql import functions as F

active_products = (
    spark.table("prod.ref.products")
    .where("is_active = true")
    .select("product_id", "category")
)

enriched = orders.join(F.broadcast(active_products), "product_id", "left")
enriched.explain("formatted")`,
          note: "Documenta el tamaño máximo esperado de `active_products`; un snapshot pequeño hoy no garantiza que siga siendo difundible.",
        },
        pitfalls: [
          "Forzar broadcast a partir de un `count()` de muestra que no representa el máximo diario.",
          "Difundir una tabla ancha cuando bastaba proyectar dos columnas de la dimensión.",
        ],
        examDecision: "Elige broadcast para una relación pequeña y acotada, compatible con el join; si ambas son grandes, reduce datos y deja una estrategia distribuida.",
        checkpoint: {
          question: "Una dimensión tiene 20 millones de filas pero sólo se necesitan dos columnas y los registros activos son el 1 %. ¿Qué harías antes del join?",
          answer: "Filtrar activos y proyectar las dos columnas; después medir el tamaño resultante y sólo entonces decidir si broadcast es seguro.",
        },
      },
      {
        summary: "Evita barreras entre Python y el motor usando expresiones nativas y reserva UDFs para lógica que la plataforma no puede expresar.",
        deepDive: advancedDeepDives.m23_5,
        explanation: [
          "Las funciones SQL y PySpark nativas permanecen visibles para Catalyst y pueden beneficiarse de Photon, generación de código, pushdown y simplificación de expresiones. Una UDF escalar de Python serializa datos entre JVM y Python, oculta parte de la lógica al optimizador y puede provocar fallback de Photon. Antes de crearla, busca funciones integradas para arrays, mapas, strings, fechas y tipos complejos.",
          "Cuando la lógica no existe, una pandas UDF o APIs basadas en Arrow pueden procesar lotes y reducir el coste por fila, pero siguen requiriendo medición, tipos explícitos y pruebas de nulos. La optimización correcta incluye mantenibilidad: una expresión nativa legible suele ser más fácil de gobernar y portar que una UDF opaca.",
        ],
        keyPoints: [
          "Prefiere funciones nativas porque el optimizador conserva visibilidad de la expresión.",
          "Comprueba en Query Profile o Spark UI si una UDF provoca fallback de Photon.",
          "Si necesitas Python, vectoriza por lotes y define contratos de tipos y nulos.",
        ],
        example: {
          language: "PySpark",
          title: "Normalización nativa sin UDF",
          code: `from pyspark.sql import functions as F

normalized = customers.withColumn(
    "email_domain",
    F.lower(F.element_at(F.split(F.trim("email"), "@"), -1)),
).withColumn(
    "is_company_email",
    ~F.col("email_domain").isin("gmail.com", "outlook.com", "yahoo.com"),
)`,
          note: "La expresión queda disponible para el plan; prueba explícitamente emails nulos, sin arroba y con espacios.",
        },
        pitfalls: [
          "Crear una UDF para operaciones ya cubiertas por `when`, `transform`, `regexp_extract` o funciones de fecha.",
          "Sustituir una UDF escalar por pandas UDF sin medir serialización, tamaño de lote y presión de memoria.",
        ],
        examDecision: "Si existe una expresión nativa equivalente, úsala; elige una UDF sólo por necesidad funcional y valida el coste y la compatibilidad del motor.",
        checkpoint: {
          question: "¿Qué señal confirma que una UDF perjudica Photon?",
          answer: "El plan o Query Profile muestra operadores que caen al runtime Spark alrededor de la UDF y aumenta el tiempo fuera de Photon.",
        },
      },
    ],
    lab: {
      title: "Diagnóstico de un join con skew y spill",
      goal: "Producir un diagnóstico reproducible que reduzca la cola de tareas sin sobredimensionar compute.",
      scenario: "El job nocturno `orders_enrichment` pasó de 18 a 54 minutos. El volumen creció 12 %, pero una etapa de join concentra el 71 % del tiempo, muestra spill a disco y cinco tareas extremas. Debes perfilar claves, reducir el lado grande, decidir si la dimensión puede difundirse y dejar una consulta optimizada verificable.",
      steps: [
        "Perfila `customer_id`, incluidos nulos, y documenta las cinco frecuencias más altas.",
        "Proyecta y filtra `prod.ref.customer_tier` antes del join para acotar su tamaño lógico.",
        "Activa una estrategia justificable: broadcast de la dimensión acotada o tratamiento aislado de claves calientes.",
        "Muestra el plan con `explain('formatted')` y materializa una acción de validación.",
        "Compara duración máxima/mediana, shuffle y spill de la etapa antes y después; registra un criterio de rollback.",
      ],
      starterCode: `from pyspark.sql import functions as F

orders = spark.table("prod.silver.orders")
tiers = spark.table("prod.ref.customer_tier")

# 1. Perfila las claves calientes y los nulos.
# 2. Reduce tiers a filas vigentes y columnas necesarias.
# 3. Construye enriched con una estrategia de join justificada.
# 4. Imprime el plan y una evidencia reproducible.`,
      solution: `from pyspark.sql import functions as F

orders = spark.table("prod.silver.orders")
tiers = spark.table("prod.ref.customer_tier")

key_profile = (
    orders.groupBy("customer_id")
    .count()
    .orderBy(F.desc("count"))
)
key_profile.show(5, truncate=False)
print("null_keys=", orders.where(F.col("customer_id").isNull()).count())

current_tiers = (
    tiers.where("valid_to IS NULL")
    .select("customer_id", "tier")
)

enriched = (
    orders
    .where(F.col("customer_id").isNotNull())
    .select("order_id", "customer_id", "order_date", "net_amount")
    .join(F.broadcast(current_tiers), "customer_id", "left")
)

enriched.explain("formatted")
print("validated_rows=", enriched.count())`,
      checks: [
        { label: "Perfila la distribución de customer_id", pattern: "groupBy\\(\"customer_id\"\\)" },
        { label: "Reduce la dimensión antes del join", pattern: "valid_to IS NULL" },
        { label: "Explicita la decisión de broadcast", pattern: "broadcast\\(current_tiers\\)" },
        { label: "Expone el plan físico", pattern: "explain\\(\"formatted\"\\)" },
      ],
      expectedEvidence: [
        "Tabla con las claves más frecuentes y recuento de claves nulas.",
        "Plan físico que muestre la estrategia de join aplicada.",
        "Comparación antes/después de máximo y mediana por tarea, shuffle read, spill y duración total.",
      ],
      cloudNotes: {
        AWS: "En compute clásico, relaciona spill con memoria y almacenamiento local de la familia EC2; no uses spot para el driver y verifica si Graviton es compatible con tus librerías.",
        Azure: "En compute clásico, compara familias de Azure VM con memoria/local SSD equivalentes y mantén el driver en capacidad bajo demanda; documenta restricciones de disponibilidad regional.",
        GCP: "En compute clásico, valida memoria y disco local de la familia Compute Engine elegida y evita preemptibles para el driver; AQE y el diagnóstico del plan no cambian entre nubes.",
      },
    },
    quiz: [
      {
        question: "Un stage tiene un spill agregado alto, pero el 98 % procede de dos tareas que también leen diez veces más shuffle que la mediana. ¿Qué acción es más sólida primero?",
        options: [
          "Duplicar todos los workers de forma permanente.",
          "Identificar las claves de esas particiones y comprobar el tratamiento de skew de AQE.",
          "Desactivar AQE para estabilizar el plan inicial.",
          "Reducir `spark.sql.shuffle.partitions` a uno.",
        ],
        answer: 1,
        explanation: "La concentración en dos tareas apunta a skew por partición. Más capacidad global puede ocultarlo, pero no corrige la distribución.",
        domain: "Data processing · performance",
      },
      {
        question: "Una dimensión filtrada ocupa 80 MB y es estable; el fact tiene 4 TB. Las estadísticas están actualizadas y el tipo de join admite broadcast. ¿Qué plan evita más movimiento?",
        options: [
          "Cross join y filtro posterior.",
          "Reparticionar ambos lados a una partición.",
          "Persistir el fact completo antes de cada ejecución.",
          "Broadcast hash join de la dimensión proyectada.",
        ],
        answer: 3,
        explanation: "Difundir la relación pequeña y acotada evita el shuffle del fact; la proyección reduce además la memoria replicada.",
        domain: "Data processing · joins",
      },
      {
        question: "¿Cuál es una capacidad real de AQE en Databricks?",
        options: [
          "Combinar particiones post-shuffle pequeñas usando estadísticas de ejecución.",
          "Reordenar arbitrariamente todos los joins durante la consulta.",
          "Convertir una transformación stateful streaming en batch.",
          "Eliminar la necesidad de estadísticas y observabilidad.",
        ],
        answer: 0,
        explanation: "AQE puede coalescer particiones, cambiar ciertas estrategias, manejar skew y propagar relaciones vacías; no rediseña toda la consulta.",
        domain: "Data processing · Spark",
      },
      {
        question: "Un pipeline usa una UDF escalar de Python para normalizar una fecha que admite `to_date` y `date_trunc`. ¿Qué cambio suele mejorar rendimiento y explicabilidad?",
        options: [
          "Aumentar la memoria del driver sin cambiar el código.",
          "Convertir cada fila a pandas y volver a Spark.",
          "Sustituir la UDF por funciones nativas y verificar el plan.",
          "Añadir un `collect()` antes de la UDF.",
        ],
        answer: 2,
        explanation: "Las funciones nativas evitan la barrera Python/JVM y conservan la expresión visible para Catalyst y Photon.",
        domain: "Data processing · optimization",
      },
    ],
    sources: [
      { label: "Adaptive query execution", href: "https://docs.databricks.com/aws/en/optimizations/aqe", reviewedAt },
      { label: "Diagnose cost and performance issues using the Spark UI", href: "https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/", reviewedAt },
      { label: "Best practices for performance efficiency", href: "https://docs.databricks.com/aws/en/lakehouse-architecture/performance-efficiency/best-practices", reviewedAt },
    ],
  },

  m24: {
    lessons: [
      {
        summary: "Entiende dónde Photon acelera el plan, cómo detecta un fallback y por qué medir precio/rendimiento importa más que comparar DBU por hora.",
        deepDive: advancedDeepDives.m24_1,
        explanation: [
          "Photon es el motor vectorizado nativo de Databricks. Catalyst sigue generando el plan, mientras Photon ejecuta operadores compatibles en lotes columnares y usa un runtime C++ que reduce costes de JVM. Está habilitado en serverless y SQL warehouses, y por defecto en compute clásico moderno; acelera scans, joins, agregaciones, shuffles y escrituras compatibles sin exigir reescribir SQL o DataFrames.",
          "No toda consulta mejora igual. UDFs, RDDs, APIs Dataset y operaciones no compatibles pueden ejecutar partes en Spark, y consultas subsegundo suelen estar dominadas por planificación. En Spark UI los operadores Photon se distinguen en el DAG; en Query Profile se observa el porcentaje de tiempo. Evalúa duración, task time, datos leídos y coste total, no sólo que la casilla esté activada.",
        ],
        keyPoints: [
          "Photon cambia la ejecución física, no la semántica ni el plan lógico de Catalyst.",
          "Localiza fallbacks con Spark UI o Query Profile.",
          "Compara coste por trabajo terminado, no tarifa aislada de DBU.",
        ],
        example: {
          language: "SQL",
          title: "Consulta compatible con ejecución vectorizada",
          code: `SELECT
  order_date,
  customer_segment,
  SUM(net_amount) AS net_revenue,
  COUNT(DISTINCT order_id) AS orders
FROM prod.gold.sales
WHERE order_date >= current_date() - INTERVAL 30 DAYS
GROUP BY order_date, customer_segment;`,
          note: "Revisa el Query Profile para confirmar pruning, operadores más caros y tiempo en Photon; no infieras el resultado sólo por la sintaxis.",
        },
        pitfalls: [
          "Atribuir toda mejora a Photon sin controlar caché, volumen y concurrencia entre pruebas.",
          "Mantener una UDF evitable y concluir que Photon no aporta valor al workload.",
        ],
        examDecision: "Elige Photon para SQL/DataFrames compatibles y decide con métricas de precio/rendimiento; investiga fallback antes de escalar compute.",
        checkpoint: {
          question: "¿Qué ocurre cuando Photon encuentra una operación no compatible?",
          answer: "Esa parte del plan cae de forma transparente al runtime Spark; el resultado sigue siendo correcto, pero puede perder aceleración.",
        },
      },
      {
        summary: "Diseña data skipping a partir de predicados reales y estadísticas, evitando layouts que sólo reflejan cómo llegó el dato.",
        deepDive: advancedDeepDives.m24_2,
        explanation: [
          "Delta registra estadísticas por archivo para que el motor descarte archivos cuyo rango no puede satisfacer el filtro. El skipping funciona cuando las columnas consultadas tienen estadísticas útiles y los valores están organizados de forma que distintos archivos cubren rangos discriminantes. Un filtro muy selectivo no ayuda si todos los archivos contienen casi todo el rango de la columna.",
          "En tablas Unity Catalog administradas, predictive optimization puede recopilar estadísticas automáticamente. Si cambias las columnas de estadísticas, `ANALYZE TABLE ... COMPUTE DELTA STATISTICS` recalcula la información del log; las estadísticas del optimizador se actualizan con `ANALYZE TABLE ... COMPUTE STATISTICS`. Verifica en Query Profile bytes leídos y porcentaje podado, no sólo el tiempo caliente de una segunda ejecución.",
        ],
        keyPoints: [
          "El skipping depende de estadísticas y distribución física, no de índices de filas tradicionales.",
          "Prioriza columnas presentes en filtros selectivos y frecuentes.",
          "Mide bytes/archivos podados con caché controlada.",
        ],
        example: {
          language: "SQL",
          title: "Actualizar estadísticas tras cambiar columnas de skipping",
          code: `ALTER TABLE prod.gold.orders
SET TBLPROPERTIES ('delta.dataSkippingStatsColumns' = 'order_date,customer_id');

ANALYZE TABLE prod.gold.orders COMPUTE DELTA STATISTICS;
ANALYZE TABLE prod.gold.orders COMPUTE STATISTICS;

SELECT *
FROM prod.gold.orders
WHERE order_date = DATE '2026-07-20'
  AND customer_id = 184203;`,
          note: "La recomputación puede ser costosa en tablas grandes; documenta el cambio y compara bytes leídos antes y después.",
        },
        pitfalls: [
          "Añadir muchas columnas de estadísticas sin relación con predicados, aumentando metadatos y mantenimiento.",
          "Medir sólo una segunda consulta que ya se beneficia de caché.",
        ],
        examDecision: "Cuando un filtro lee demasiados archivos, comprueba primero estadísticas y layout de las columnas filtradas; más compute no crea pruning.",
        checkpoint: {
          question: "Una consulta filtra por `customer_id`, pero todos los archivos contienen IDs de todo el rango. ¿Por qué el skipping será débil?",
          answer: "Porque los min/max de casi todos los archivos podrían contener el ID y el motor no puede descartarlos aunque el filtro sea selectivo.",
        },
      },
      {
        summary: "Usa liquid clustering para adaptar el layout a patrones de acceso cambiantes sin heredar la rigidez de particiones físicas de alta cardinalidad.",
        deepDive: advancedDeepDives.m24_3,
        explanation: [
          "Liquid clustering reemplaza particionado y `ZORDER` para tablas nuevas que necesitan layout flexible. `CLUSTER BY` define claves y las operaciones de mantenimiento reagrupan datos incrementalmente. Las claves pueden evolucionar sin reescribir inmediatamente toda la tabla; lecturas y escrituras requieren versiones compatibles del runtime y no debes mezclar la tabla con particionado tradicional o `ZORDER`.",
          "Automatic liquid clustering usa predictive optimization para escoger y evolucionar claves cuando el ahorro esperado por skipping supera el coste de clustering. La decisión práctica parte de consultas observadas: filtros por fecha y cliente pueden justificar claves, mientras una columna de cardinalidad extrema sin patrón estable puede empeorar mantenimiento. Valida en historial y perfiles qué archivos se podan.",
        ],
        keyPoints: [
          "Liquid clustering admite evolución de claves sin redefinir particiones físicas.",
          "No combines `CLUSTER BY` con `PARTITIONED BY` o `ZORDER` en la misma estrategia.",
          "Automatic liquid clustering requiere predictive optimization.",
        ],
        example: {
          language: "SQL",
          title: "Crear una tabla con liquid clustering",
          code: `CREATE TABLE prod.gold.customer_orders (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  net_amount DECIMAL(18,2)
)
USING DELTA
CLUSTER BY (order_date, customer_id);

INSERT INTO prod.gold.customer_orders
SELECT order_id, customer_id, order_date, net_amount
FROM prod.silver.orders;`,
          note: "Elige claves a partir de filtros reales; habilitar clustering no garantiza beneficio si las consultas no podan por esas columnas.",
        },
        pitfalls: [
          "Replicar la antigua columna de partición como clave sin revisar el historial de consultas.",
          "Ejecutar mantenimiento manual agresivo mientras predictive optimization ya gestiona la tabla.",
        ],
        examDecision: "Prefiere liquid clustering para tablas Delta nuevas con patrones de filtro evolutivos; usa particionado sólo cuando exista una razón de compatibilidad concreta.",
        checkpoint: {
          question: "¿Qué ventaja ofrece cambiar claves de liquid clustering frente a cambiar particiones tradicionales?",
          answer: "Las claves pueden evolucionar y el reclustering ocurre de forma incremental, sin exigir una reescritura inmediata y completa del layout.",
        },
      },
      {
        summary: "Relaciona deletion vectors, predictive I/O y concurrencia por fila con el coste real de `MERGE`, `UPDATE` y `DELETE`.",
        deepDive: advancedDeepDives.m24_4,
        explanation: [
          "Sin deletion vectors, modificar pocas filas puede obligar a reescribir archivos Parquet completos. Con la característica activada, Delta registra qué filas están lógicamente eliminadas y difiere la reescritura física. Photon puede usar predictive I/O para acelerar actualizaciones y lecturas compatibles; el protocolo de tabla se eleva, por lo que todos los clientes externos deben soportarlo.",
          "Los vectores no eliminan mantenimiento: operaciones posteriores materializan cambios cuando conviene, y `VACUUM` sigue gobernado por retención. También habilitan row-level concurrency en tablas elegibles, reduciendo conflictos entre escrituras sobre filas distintas. Desactivarlos por costumbre puede perder concurrencia; activarlos sin inventariar lectores externos puede romper interoperabilidad.",
        ],
        keyPoints: [
          "Deletion vectors evitan reescribir inmediatamente archivos completos por cambios de pocas filas.",
          "Comprueba compatibilidad de protocolo de todos los lectores y escritores.",
          "Predictive I/O para updates requiere Photon y usa deletion vectors.",
        ],
        example: {
          language: "SQL",
          title: "Habilitar vectores y verificar el protocolo",
          code: `ALTER TABLE prod.silver.customers
SET TBLPROPERTIES ('delta.enableDeletionVectors' = true);

DESCRIBE DETAIL prod.silver.customers;

DELETE FROM prod.silver.customers
WHERE deletion_requested_at < current_date() - INTERVAL 30 DAYS;`,
          note: "Revisa `tableFeatures` en `DESCRIBE DETAIL` y valida previamente cada motor externo que accede a la tabla.",
        },
        pitfalls: [
          "Activar una característica de protocolo sin probar consumidores Delta externos.",
          "Confundir borrado lógico inmediato con eliminación física segura de archivos.",
        ],
        examDecision: "Usa deletion vectors para DML frecuente y concurrencia compatible; prioriza interoperabilidad cuando existe un lector que no soporta la característica.",
        checkpoint: {
          question: "¿Por qué `DELETE` con deletion vectors no significa que el archivo antiguo desaparezca inmediatamente?",
          answer: "La fila queda marcada lógicamente; la reescritura y eliminación física se realizan después según mantenimiento y retención.",
        },
      },
      {
        summary: "Delega `OPTIMIZE`, `VACUUM` y `ANALYZE` a predictive optimization cuando la tabla administrada y su gobierno lo permiten.",
        deepDive: advancedDeepDives.m24_5,
        explanation: [
          "Predictive optimization observa tablas administradas por Unity Catalog y ejecuta mantenimiento donde estima beneficio: compacta y aplica clustering con `OPTIMIZE`, elimina archivos no referenciados con `VACUUM` y mantiene estadísticas mediante `ANALYZE`. Puede habilitarse en cuenta, catálogo, esquema o tabla, con herencia; las tablas externas quedan bajo responsabilidad del propietario.",
          "Automatizar no significa perder control. Revisa la propiedad efectiva con `DESCRIBE ... EXTENDED`, el historial de operaciones y el coste atribuido a `PREDICTIVE_OPTIMIZATION` en `system.billing.usage`. Evita jobs cron que ejecutan `OPTIMIZE` sobre todas las tablas sin observar necesidad: compiten con la automatización y pueden gastar más que el beneficio obtenido.",
        ],
        keyPoints: [
          "Sólo tablas administradas elegibles reciben predictive optimization.",
          "La configuración hereda desde cuenta, catálogo y esquema salvo override explícito.",
          "Audita tanto beneficio como consumo de las operaciones automáticas.",
        ],
        example: {
          language: "SQL",
          title: "Habilitar por catálogo y verificar una tabla",
          code: `ALTER CATALOG prod ENABLE PREDICTIVE OPTIMIZATION;

DESCRIBE CATALOG EXTENDED prod;
DESCRIBE TABLE EXTENDED prod.gold.orders;

SELECT operation, operationParameters, operationMetrics, timestamp
FROM (DESCRIBE HISTORY prod.gold.orders)
ORDER BY timestamp DESC
LIMIT 20;`,
          note: "La herencia no anula un `DISABLE` explícito en un hijo; verifica la configuración efectiva antes de diagnosticar ausencia de mantenimiento.",
        },
        pitfalls: [
          "Asumir que una tabla externa recibe mantenimiento automático porque está registrada en Unity Catalog.",
          "Conservar un job global de `OPTIMIZE` y `VACUUM` sin comprobar si duplica predictive optimization.",
        ],
        examDecision: "Para tablas administradas, habilita predictive optimization y elimina mantenimiento indiscriminado; para externas, diseña y observa tu propia política.",
        checkpoint: {
          question: "¿Qué tres operaciones principales ejecuta predictive optimization?",
          answer: "`OPTIMIZE`, `VACUUM` y `ANALYZE`, aplicadas selectivamente a tablas administradas elegibles.",
        },
      },
    ],
    lab: {
      title: "Rehabilitar una tabla Delta con scans excesivos y DML costoso",
      goal: "Diseñar un layout mantenible y demostrar pruning y menor amplificación de escrituras.",
      scenario: "`prod.gold.order_events` recibe `MERGE` cada quince minutos y alimenta consultas por `event_date` y `customer_id`. Query Profile muestra que una búsqueda de un cliente lee casi todos los archivos. La tabla está administrada, no tiene clustering y un job antiguo ejecuta `OPTIMIZE ... ZORDER` cada noche.",
      steps: [
        "Captura `DESCRIBE DETAIL`, historial y Query Profile de una consulta representativa.",
        "Define estadísticas para `event_date` y `customer_id` y actualízalas de forma consciente.",
        "Migra el layout a liquid clustering o crea una tabla de reemplazo compatible si el cambio in-place no es válido para el estado actual.",
        "Comprueba deletion vectors y compatibilidad de los consumidores antes de habilitarlos.",
        "Habilita predictive optimization en el ámbito correcto y retira el mantenimiento duplicado sólo tras observar una ventana completa.",
        "Compara bytes podados, archivos leídos, duración de `MERGE` y coste de mantenimiento.",
      ],
      starterCode: `-- Sustituye los nombres si trabajas en un catálogo de laboratorio.
DESCRIBE DETAIL prod.gold.order_events;
DESCRIBE HISTORY prod.gold.order_events;

-- 1. Configura estadísticas útiles.
-- 2. Define la estrategia de clustering.
-- 3. Habilita deletion vectors y predictive optimization si son compatibles.
-- 4. Incluye una consulta de validación selectiva.`,
      solution: `ALTER TABLE prod.gold.order_events
SET TBLPROPERTIES (
  'delta.dataSkippingStatsColumns' = 'event_date,customer_id',
  'delta.enableDeletionVectors' = true
);

ANALYZE TABLE prod.gold.order_events COMPUTE DELTA STATISTICS;
ANALYZE TABLE prod.gold.order_events COMPUTE STATISTICS;

ALTER TABLE prod.gold.order_events
CLUSTER BY (event_date, customer_id);

ALTER TABLE prod.gold.order_events
ENABLE PREDICTIVE OPTIMIZATION;

SELECT event_id, event_ts, event_type
FROM prod.gold.order_events
WHERE event_date = DATE '2026-07-20'
  AND customer_id = 184203;`,
      checks: [
        { label: "Configura columnas de skipping", pattern: "dataSkippingStatsColumns" },
        { label: "Actualiza estadísticas Delta", pattern: "COMPUTE DELTA STATISTICS" },
        { label: "Declara liquid clustering", pattern: "CLUSTER BY" },
        { label: "Activa mantenimiento predictivo", pattern: "ENABLE PREDICTIVE OPTIMIZATION" },
      ],
      expectedEvidence: [
        "Detalle de protocolo y características antes/después.",
        "Query Profile comparable con archivos y bytes leídos/podados.",
        "Historial de mantenimiento sin ejecución duplicada del job antiguo.",
      ],
      cloudNotes: {
        AWS: "Valida clientes Delta que lean directamente desde S3 y contabiliza egress/requests de S3 al comparar layouts; Photon y predictive optimization siguen siendo capacidades Databricks.",
        Azure: "Comprueba consumidores que accedan a ADLS Gen2 fuera de Databricks y el impacto de transacciones/listados; no asumas que todos soportan deletion vectors.",
        GCP: "Inventaría lectores directos de GCS y compatibilidad de protocolo; usa métricas de bytes y operaciones de GCS junto con el Query Profile para el coste total.",
      },
    },
    quiz: [
      {
        question: "Una consulta usa Photon, pero el perfil muestra fallback alrededor de una transformación de Python. ¿Cuál es la mejor primera mejora?",
        options: [
          "Cambiar el formato Delta a CSV.",
          "Deshabilitar Photon para que el plan sea uniforme.",
          "Reemplazar la UDF por funciones nativas si existe equivalencia.",
          "Reducir el warehouse a una sola unidad.",
        ],
        answer: 2,
        explanation: "Las funciones nativas mantienen la operación visible y compatible con el motor; escalar no elimina la barrera de la UDF.",
        domain: "Data processing · Photon",
      },
      {
        question: "Una tabla administrada recibe filtros cambiantes por fecha y cliente y necesita adaptar el layout sin particiones rígidas. ¿Qué estrategia encaja mejor?",
        options: [
          "Liquid clustering basado en patrones observados, idealmente con predictive optimization.",
          "Particionar por cada customer_id.",
          "Ejecutar `coalesce(1)` tras cada escritura.",
          "Desactivar las estadísticas de archivos.",
        ],
        answer: 0,
        explanation: "Liquid clustering permite evolucionar claves y evita particiones físicas de alta cardinalidad.",
        domain: "Data processing · Delta optimization",
      },
      {
        question: "¿Qué requisito debe comprobarse antes de habilitar deletion vectors en una tabla consumida fuera de Databricks?",
        options: [
          "Que todas las consultas usen `SELECT *`.",
          "Que la tabla esté particionada por fecha.",
          "Que el driver tenga el doble de memoria.",
          "Que todos los lectores y escritores soporten la característica de protocolo.",
        ],
        answer: 3,
        explanation: "Deletion vectors elevan las características del protocolo; un cliente incompatible puede dejar de leer o escribir la tabla.",
        domain: "Data processing · reliability",
      },
      {
        question: "Predictive optimization está activo en un catálogo de tablas administradas. ¿Qué práctica FinOps es más razonable?",
        options: [
          "Mantener además un `OPTIMIZE` global cada hora por seguridad.",
          "Retirar mantenimiento indiscriminado tras observar historial, rendimiento y coste automático.",
          "Convertir todas las tablas en externas.",
          "Deshabilitar `ANALYZE` para reducir metadatos.",
        ],
        answer: 1,
        explanation: "La automatización selecciona operaciones beneficiosas; conviene evitar duplicarlas y validar con historial y billing.",
        domain: "Operations · optimization",
      },
    ],
    sources: [
      { label: "What is Photon?", href: "https://docs.databricks.com/aws/en/compute/photon", reviewedAt },
      { label: "Use liquid clustering for tables", href: "https://docs.databricks.com/aws/en/delta/clustering", reviewedAt },
      { label: "Predictive optimization for Unity Catalog managed tables", href: "https://docs.databricks.com/aws/en/optimizations/predictive-optimization", reviewedAt },
      { label: "What is predictive I/O?", href: "https://docs.databricks.com/aws/en/optimizations/predictive-io", reviewedAt },
    ],
  },

  m25: {
    lessons: [
      {
        summary: "Elige serverless, SQL warehouse o compute clásico según APIs, latencia, control de infraestructura y patrón operativo.",
        deepDive: advancedDeepDives.m25_1,
        explanation: [
          "Databricks recomienda serverless para la mayoría de notebooks, jobs y pipelines porque administra aprovisionamiento, escalado, Photon y actualizaciones. Un SQL warehouse serverless sirve BI y SQL; jobs serverless sirve tareas automatizadas sin configurar clúster. Compute clásico sigue siendo válido cuando una API, runtime, red o configuración especializada no está soportada en serverless.",
          "La decisión se toma por requisito, no por preferencia histórica. Define SLA de arranque y ejecución, lenguaje, librerías, conectividad y observabilidad disponible. En serverless no hay Spark UI: se usa Query Profile. En clásico controlas familias y autoscaling, pero también capacidad, parches y tiempo ocioso. Evita all-purpose para producción automatizada salvo una excepción explícita.",
        ],
        keyPoints: [
          "Serverless es la opción por defecto para workloads compatibles.",
          "SQL warehouse corresponde a SQL/BI; jobs serverless a automatización general compatible.",
          "Compute clásico se justifica con una limitación concreta, no con costumbre.",
        ],
        example: {
          language: "JSON",
          title: "Registro de decisión de compute",
          code: `{
  "workload": "daily_customer_360",
  "candidate": "serverless_jobs",
  "requirements": {
    "startup_sla_minutes": 8,
    "languages": ["Python", "SQL"],
    "network": "managed_connector",
    "spark_ui_required": false
  },
  "fallback": "classic_jobs_compute",
  "review_after_runs": 20
}`,
          note: "La decisión incluye un fallback y una fecha de revisión; evita declarar serverless o clásico como dogma.",
        },
        pitfalls: [
          "Usar all-purpose compartido para un job crítico y mezclar su coste con trabajo interactivo.",
          "Migrar a serverless sin revisar configuraciones Spark, sinks o dependencias no compatibles.",
        ],
        examDecision: "Empieza por serverless; elige clásico sólo cuando un requisito verificado no esté cubierto y documenta cómo retirar la excepción.",
        checkpoint: {
          question: "¿Cuándo elegirías un SQL warehouse frente a jobs serverless?",
          answer: "Cuando la carga es SQL/BI y necesita las capacidades y concurrencia del warehouse; para tareas Python o workflows generales, jobs serverless suele encajar mejor.",
        },
      },
      {
        summary: "Dimensiona compute clásico con el cuello de botella real: memoria por partición, CPU, I/O, paralelismo y capacidad del driver.",
        deepDive: advancedDeepDives.m25_2,
        explanation: [
          "Más nodos pequeños y pocos nodos grandes pueden sumar cores y memoria similares, pero no se comportan igual. Joins y agregaciones con particiones grandes necesitan memoria por executor; workloads muy paralelos pueden aprovechar más workers. El driver planifica, recopila metadatos y recibe resultados de acciones como `collect()`, por lo que escalar workers no resuelve un driver sobrecargado.",
          "Comienza con una familia general, autoscaling y límites observables. Revisa utilización de CPU, memoria, spill, I/O y duración por stage; cambia una variable cada vez. En AWS, Azure y GCP varían nombres, discos y mercados spot, pero el método es el mismo. Mantén el driver bajo demanda y usa spot/preemptible en workers sólo si el workload tolera interrupciones.",
        ],
        keyPoints: [
          "Dimensiona por recursos de la etapa crítica, no por volumen total de la tabla.",
          "El driver y los workers tienen responsabilidades distintas.",
          "Autoscaling no arregla skew ni un único task no paralelizable.",
        ],
        example: {
          language: "JSON",
          title: "Rango de autoscaling para un job clásico",
          code: `{
  "spark_version": "16.4.x-scala2.12",
  "runtime_engine": "PHOTON",
  "autoscale": {
    "min_workers": 2,
    "max_workers": 8
  },
  "autotermination_minutes": 20,
  "custom_tags": {
    "cost_center": "finance-data",
    "environment": "prod"
  }
}`,
          note: "Los node types son deliberadamente externos al ejemplo porque cambian por nube; selecciónalos después de perfilar CPU, memoria y disco.",
        },
        pitfalls: [
          "Elevar `max_workers` cuando una sola tarea sesgada domina la duración.",
          "Usar spot/preemptible para el driver y exponer el job completo a una reclamación.",
        ],
        examDecision: "Si falta paralelismo, añade workers; si cada tarea derrama por memoria, mejora el plan o usa workers mayores; si falla el driver, trata el driver y elimina acciones locales.",
        checkpoint: {
          question: "Un job tiene CPU baja en casi todos los workers y una única tarea de 40 minutos. ¿Ayudará duplicar `max_workers`?",
          answer: "Probablemente no; la etapa no usa paralelismo disponible. Hay que investigar skew, particionado o una operación serial.",
        },
      },
      {
        summary: "Equilibra coste y latencia en serverless mediante modos de rendimiento, entornos versionados y límites de microbatch.",
        deepDive: advancedDeepDives.m25_3,
        explanation: [
          "Serverless jobs y pipelines ofrecen modo performance optimized para arranque rápido y modo standard para automatizaciones que toleran aproximadamente 4–6 minutos de inicio a cambio de menor coste. Los notebooks usan el modo interactivo adecuado. Serverless administra infraestructura y Photon, pero el ingeniero sigue controlando la forma de la consulta, paquetes, parámetros y cuánto dato procesa cada ejecución.",
          "Los entornos serverless sustituyen la selección directa de Databricks Runtime y mantienen una API base estable. Fija versiones de paquetes y usa entornos/base environments, porque init scripts no están soportados. En streaming serverless, `Trigger.AvailableNow` procesa lo disponible; limita `maxFilesPerTrigger` o `maxBytesPerTrigger` para evitar microbatches impredecibles.",
        ],
        keyPoints: [
          "Usa modo standard cuando el SLA admite más arranque y prima el coste.",
          "Fija versiones de paquetes dentro del modelo de entorno serverless.",
          "La infraestructura gestionada no elimina la necesidad de acotar cada workload.",
        ],
        example: {
          language: "Python",
          title: "Dependencias reproducibles para serverless",
          code: `# requirements.txt
pydantic==2.11.7
requests==2.32.4
tenacity==9.1.2

# En el job, selecciona un entorno compatible y conserva
# este fichero versionado junto al código y sus pruebas.`,
          note: "No dependas de una versión transitiva no fijada; valida el entorno en test antes de promoverlo.",
        },
        pitfalls: [
          "Elegir performance optimized para miles de jobs batch cuyo SLA tolera el arranque standard.",
          "Copiar init scripts de compute clásico a una migración serverless.",
        ],
        examDecision: "Para batch programado tolerante al arranque, usa modo standard; conserva performance optimized para interacción o SLA de inicio exigente.",
        checkpoint: {
          question: "¿Qué compensación introduce el modo standard de serverless jobs?",
          answer: "Acepta un arranque más lento para reducir coste frente al modo performance optimized.",
        },
      },
      {
        summary: "Impone guardrails con compute policies y atribuye serverless mediante usage policies sin incluir información sensible en tags.",
        deepDive: advancedDeepDives.m25_4,
        explanation: [
          "Las compute policies restringen la creación de compute clásico: pueden fijar runtime, modo de acceso, Photon, límites de workers, autotermination y tags. Las familias de políticas aportan bases mantenidas por Databricks. Una buena policy reduce opciones peligrosas y deja editables sólo parámetros que el equipo debe decidir; instalar librerías mediante policies es preferible a init scripts.",
          "Serverless usage policies son objetos distintos que asignan tags de coste a notebooks, jobs, pipelines y otros workloads serverless. Sus tags aparecen en `system.billing.usage.custom_tags`. Los tags viajan a registros y pueden replicarse globalmente: usa centro de coste, producto y entorno, nunca correo, nombre de cliente o datos confidenciales. Recuerda que un pipeline disparado por un job conserva su propia policy.",
        ],
        keyPoints: [
          "Compute policies gobiernan configuración clásica; serverless usage policies atribuyen actividad serverless.",
          "Fija y oculta guardrails, permite sólo decisiones necesarias.",
          "Los tags no son un almacén seguro para datos personales o secretos.",
        ],
        example: {
          language: "JSON",
          title: "Fragmento de compute policy con guardrails",
          code: `{
  "autotermination_minutes": {
    "type": "range",
    "maxValue": 60,
    "defaultValue": 20
  },
  "autoscale.max_workers": {
    "type": "range",
    "maxValue": 12,
    "defaultValue": 4
  },
  "custom_tags.cost_center": {
    "type": "fixed",
    "value": "finance-data"
  }
}`,
          note: "Completa la policy con familia y reglas del workspace; prueba que usuarios previstos pueden crear compute y no pueden superar guardrails.",
        },
        pitfalls: [
          "Usar la misma etiqueta `Name` que Databricks aplica al clúster y romper atribución/terminación.",
          "Incluir identificadores personales o secretos en tags de coste.",
        ],
        examDecision: "Usa policies para prevenir configuraciones caras y tags estables para chargeback; no confíes en disciplina manual del creador.",
        checkpoint: {
          question: "¿Dónde aparecen los tags heredados de una serverless usage policy?",
          answer: "En `custom_tags` de los registros correspondientes de `system.billing.usage`.",
        },
      },
      {
        summary: "Construye FinOps con cantidades de uso, precios efectivos, correcciones y metadatos de workload, no con estimaciones de horas de clúster.",
        deepDive: advancedDeepDives.m25_5,
        explanation: [
          "`system.billing.usage` ofrece registros regionales de consumo con SKU, producto origen, metadatos de job/notebook/warehouse, identidad y tags. Para coste monetario se une con la tabla de precios por SKU y vigencia; las correcciones pueden emitir retracciones y restatements, así que agrega `usage_quantity` con su signo en lugar de descartar filas negativas.",
          "Un dashboard útil separa coste, volumen y resultado: coste por ejecución, por millón de filas o por SLA cumplido. Segmenta serverless por `billing_origin_product` y `usage_metadata`, porque varias capacidades comparten SKU. Define presupuestos y alertas como detección temprana, no como mecanismo que detiene automáticamente todos los workloads.",
        ],
        keyPoints: [
          "Suma registros de corrección con signo para obtener consumo neto.",
          "Une uso y precios por SKU y periodo de vigencia.",
          "Normaliza coste por unidad de negocio o trabajo terminado.",
        ],
        example: {
          language: "SQL",
          title: "Uso diario por producto y centro de coste",
          code: `SELECT
  usage_date,
  billing_origin_product,
  custom_tags['cost_center'] AS cost_center,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
GROUP BY usage_date, billing_origin_product,
         custom_tags['cost_center'], sku_name
ORDER BY usage_date DESC, usage_quantity DESC;`,
          note: "Para moneda, une con `system.billing.list_prices` respetando SKU y periodo; este ejemplo evita fingir que DBU equivale directamente a coste.",
        },
        pitfalls: [
          "Multiplicar todas las DBU por un único precio sin considerar SKU ni vigencia contractual.",
          "Ignorar correcciones negativas y sobreestimar consumo histórico.",
        ],
        examDecision: "Usa system tables para coste neto y atribución; decide optimizaciones con coste por resultado y SLA, no sólo con DBU totales.",
        checkpoint: {
          question: "¿Por qué no conviene filtrar los registros con `usage_quantity < 0`?",
          answer: "Pueden ser retracciones de correcciones; eliminarlas deja el consumo original sin compensar y distorsiona el total.",
        },
      },
    ],
    lab: {
      title: "Plan FinOps para un portfolio híbrido",
      goal: "Asignar compute adecuado, guardrails y coste observable a tres workloads con SLA distinto.",
      scenario: "Un equipo ejecuta un dashboard SQL interactivo, un job batch diario tolerante a diez minutos de arranque y un pipeline con un conector no soportado en serverless. El gasto creció 38 % y parte del uso carece de centro de coste. Debes decidir compute, definir atribución y producir una consulta de control.",
      steps: [
        "Clasifica cada workload por lenguaje, SLA, conectividad y necesidad de control de infraestructura.",
        "Asigna SQL warehouse serverless, jobs serverless standard o jobs compute clásico según la evidencia.",
        "Diseña tags no sensibles y una serverless usage policy; añade guardrails al caso clásico.",
        "Consulta `system.billing.usage` por producto, workload y centro de coste preservando correcciones.",
        "Define dos alertas: incremento de coste y porcentaje de uso sin atribuir, con propietario y respuesta.",
      ],
      starterCode: `-- Completa una vista de atribución para los últimos 30 días.
SELECT
  usage_date,
  billing_origin_product,
  custom_tags['cost_center'] AS cost_center,
  usage_metadata.job_id AS job_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
-- Añade agrupación y una marca para uso no atribuido.`,
      solution: `CREATE OR REPLACE VIEW finops.ops.daily_attribution AS
SELECT
  usage_date,
  billing_origin_product,
  COALESCE(custom_tags['cost_center'], 'UNALLOCATED') AS cost_center,
  usage_metadata.job_id AS job_id,
  usage_metadata.warehouse_id AS warehouse_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
GROUP BY
  usage_date,
  billing_origin_product,
  COALESCE(custom_tags['cost_center'], 'UNALLOCATED'),
  usage_metadata.job_id,
  usage_metadata.warehouse_id,
  sku_name;

SELECT *
FROM finops.ops.daily_attribution
WHERE cost_center = 'UNALLOCATED'
   OR usage_quantity > 500
ORDER BY usage_date DESC, usage_quantity DESC;`,
      checks: [
        { label: "Consulta la tabla oficial de uso", pattern: "system\\.billing\\.usage" },
        { label: "Atribuye por custom_tags", pattern: "custom_tags\\['cost_center'\\]" },
        { label: "Conserva uso no asignado", pattern: "UNALLOCATED" },
        { label: "Agrega usage_quantity neta", pattern: "SUM\\(usage_quantity\\)" },
      ],
      expectedEvidence: [
        "Matriz de decisión de compute para los tres workloads y su excepción documentada.",
        "Vista diaria que exponga consumo sin centro de coste.",
        "Umbrales, propietario y runbook de las dos alertas FinOps.",
      ],
      cloudNotes: {
        AWS: "Para la excepción clásica, compara familias EC2, Graviton y spot en workers; al conciliar factura considera los tags propagados a recursos AWS y el egress de S3.",
        Azure: "Mapea node types a familias Azure VM y usa spot sólo en workers tolerantes; concilia los tags de Databricks con Azure Cost Management sin incluir PII.",
        GCP: "Evalúa familias Compute Engine y preemptible/spot en workers; contrasta los tags Databricks con Cloud Billing y el coste de operaciones/egress de GCS.",
      },
    },
    quiz: [
      {
        question: "Un job Python diario tolera seis minutos de arranque, usa APIs soportadas y no necesita red personalizada. ¿Qué opción inicial es más razonable?",
        options: [
          "Jobs serverless en modo standard.",
          "All-purpose clásico siempre encendido.",
          "SQL warehouse classic.",
          "Un clúster de un solo nodo sin autotermination.",
        ],
        answer: 0,
        explanation: "El workload es compatible y tolera el arranque; el modo standard reduce coste frente a performance optimized.",
        domain: "Operations · compute selection",
      },
      {
        question: "La duración está dominada por una única tarea con CPU alta; el resto de workers está ocioso. ¿Qué cambio NO aborda la causa?",
        options: [
          "Perfilar la clave que alimenta esa tarea.",
          "Revisar particionado y skew.",
          "Duplicar el máximo de workers sin cambiar el plan.",
          "Comprobar si la operación es serial o no paralelizable.",
        ],
        answer: 2,
        explanation: "Más workers no aceleran una tarea única; primero hay que recuperar paralelismo o corregir skew.",
        domain: "Operations · sizing",
      },
      {
        question: "¿Qué mecanismo atribuye tags a notebooks y jobs serverless en `system.billing.usage`?",
        options: [
          "Una init script global.",
          "Una serverless usage policy asignada al usuario o workload.",
          "Cambiar el nombre del warehouse.",
          "Un `VACUUM` programado.",
        ],
        answer: 1,
        explanation: "Las serverless usage policies propagan sus custom tags al registro de facturación.",
        domain: "Operations · governance",
      },
      {
        question: "Un informe de consumo excluye filas negativas de `system.billing.usage`. ¿Cuál es el riesgo?",
        options: [
          "Perder el nombre del notebook únicamente.",
          "Deshabilitar Photon.",
          "Convertir las DBU en horas de CPU.",
          "Ignorar retracciones de correcciones y sobreestimar consumo.",
        ],
        answer: 3,
        explanation: "Las correcciones pueden aparecer como retracción y restatement; hay que agregar la cantidad con signo.",
        domain: "Operations · FinOps",
      },
    ],
    sources: [
      { label: "Compute selection recommendations", href: "https://docs.databricks.com/aws/en/compute/choose-compute", reviewedAt },
      { label: "Best practices for serverless compute", href: "https://docs.databricks.com/aws/en/compute/serverless/best-practices", reviewedAt },
      { label: "Create and manage compute policies", href: "https://docs.databricks.com/aws/en/admin/clusters/policies", reviewedAt },
      { label: "Monitor the cost of serverless compute", href: "https://docs.databricks.com/aws/en/admin/system-tables/serverless-billing", reviewedAt },
    ],
  },

  m26: {
    lessons: [
      {
        summary: "Lee Spark UI de arriba abajo: job, stage, task y executor, manteniendo una hipótesis que conecte tiempo con datos y recursos.",
        deepDive: advancedDeepDives.m26_1,
        explanation: [
          "Spark UI es la herramienta de detalle para compute clásico. Empieza por la timeline y el job más largo, entra en su stage crítico y compara tareas. Scheduling delay señala falta de slots o overhead; shuffle read/write muestra movimiento; spill, GC y duración extrema orientan a memoria o skew. Los executors permiten comprobar si el trabajo se distribuyó y si hubo pérdidas.",
          "No conviertas cada métrica en una receta. Un stage con 90 % de tiempo en una tarea no mejora con más workers; una etapa I/O-bound puede necesitar mejor layout o pruning. Conserva IDs de job, stage y run, captura percentiles y anota el plan o commit analizado para que otra persona reproduzca el diagnóstico.",
        ],
        keyPoints: [
          "Navega desde la duración global hasta la tarea que explica el cuello.",
          "Correlaciona tiempo, bytes, registros, spill y ejecutor.",
          "Guarda identificadores y baseline para reproducibilidad.",
        ],
        example: {
          language: "PySpark",
          title: "Etiquetar una ejecución antes de abrir Spark UI",
          code: `spark.sparkContext.setJobGroup(
    "daily-margin-2026-07-21",
    "Daily margin aggregation · release 4f2c9ab",
)

result = build_daily_margin(spark.table("prod.silver.order_lines"))
result.write.mode("overwrite").saveAsTable("prod.gold.daily_margin")`,
          note: "El job group facilita localizar la ejecución correcta; no registres secretos ni datos personales en la descripción.",
        },
        pitfalls: [
          "Mirar sólo la página Executors y perder la etapa concreta que causa el problema.",
          "Comparar una ejecución fría con otra caliente sin registrar caché y volumen.",
        ],
        examDecision: "En compute clásico, empieza por la timeline, baja al stage más largo y decide con la distribución de tareas antes de cambiar recursos.",
        checkpoint: {
          question: "¿Qué vista usarías para demostrar que cinco tareas concentran el shuffle de una etapa?",
          answer: "Los detalles del stage y su tabla de tasks en Spark UI, comparando bytes de shuffle y duración por tarea.",
        },
      },
      {
        summary: "Usa Query Profile para serverless y SQL warehouses, separando cola, planificación, pruning y ejecución por operador.",
        deepDive: advancedDeepDives.m26_2,
        explanation: [
          "Query Profile visualiza el DAG de operadores y métricas como filas, tiempo, memoria y I/O. El resumen distingue wall-clock de task time agregado: el segundo puede ser mayor porque suma trabajo paralelo. Los top operators revelan scans completos, joins explosivos y agregaciones caras; los indicadores de pruning muestran si el layout evita leer datos irrelevantes.",
          "En serverless no hay Spark UI, por lo que Query Profile y query history son la ruta principal. Una consulta servida desde cache puede no disponer de perfil; cambia de forma inocua la consulta para una medición controlada. Usa CAN MONITOR en el warehouse o propiedad de la consulta, y concede acceso al mínimo grupo operativo necesario.",
        ],
        keyPoints: [
          "Wall-clock y task time agregado miden fenómenos distintos.",
          "Top operators y DAG localizan el operador dominante.",
          "Pruning e I/O validan layout mejor que una sensación de rapidez.",
        ],
        example: {
          language: "SQL",
          title: "Consulta etiquetada para comparar perfiles",
          code: `-- incident: INC-2041 | variant: filtered-before-join
WITH recent_orders AS (
  SELECT order_id, customer_id, net_amount
  FROM prod.gold.orders
  WHERE order_date >= current_date() - INTERVAL 7 DAYS
)
SELECT c.segment, SUM(o.net_amount) AS revenue
FROM recent_orders o
JOIN prod.gold.customers c USING (customer_id)
GROUP BY c.segment;`,
          note: "Guarda statement ID, variante y ventana de datos; compara las mismas métricas y concurrencia.",
        },
        pitfalls: [
          "Interpretar task time agregado como duración percibida por el usuario.",
          "Optimizar el operador más vistoso sin comprobar si está en la ruta crítica.",
        ],
        examDecision: "Para SQL warehouse o serverless, usa Query Profile; identifica el top operator y valida el cambio con I/O, pruning y wall-clock.",
        checkpoint: {
          question: "¿Por qué task time puede superar wall-clock?",
          answer: "Porque suma el tiempo de tareas ejecutadas en paralelo en distintos cores, mientras wall-clock mide tiempo transcurrido.",
        },
      },
      {
        summary: "Convierte system tables en una línea de tiempo común para consultas, jobs, compute y coste a escala de cuenta y región.",
        deepDive: advancedDeepDives.m26_3,
        explanation: [
          "`system.query.history` registra statements de SQL warehouses y serverless con estado, duración, compute y métricas. `system.lakeflow.job_run_timeline` y `job_task_run_timeline` permiten analizar ejecuciones y tareas de jobs; `system.billing.usage` aporta consumo. Estas tablas son regionales en gran parte, tienen retenciones documentadas y están gobernadas por Unity Catalog.",
          "Construye vistas restringidas para equipos en vez de conceder acceso amplio al catálogo `system`. Une usando IDs de job/run/statement disponibles y conserva intervalos temporales; no fuerces joins cuando la fuente no emite un identificador común. Una línea de tiempo fiable diferencia fallo de compute, cola, ejecución lenta y reintento posterior.",
        ],
        keyPoints: [
          "Respeta ámbito regional y retención de cada system table.",
          "Concede `USE` y `SELECT` mediante vistas de mínimo privilegio.",
          "Correlaciona por IDs y tiempo, declarando lag y huecos de telemetría.",
        ],
        example: {
          language: "SQL",
          title: "Detectar consultas fallidas y lentas",
          code: `SELECT
  workspace_id,
  statement_id,
  executed_by,
  execution_status,
  total_duration_ms,
  compute.type AS compute_type,
  error_message
FROM system.query.history
WHERE start_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (execution_status = 'FAILED' OR total_duration_ms > 600000)
ORDER BY start_time DESC;`,
          note: "Expón esta información mediante una vista que filtre workspaces o equipos; los mensajes pueden contener detalles sensibles.",
        },
        pitfalls: [
          "Asumir que una consulta desde otra región aparecerá en el metastore consultado.",
          "Dar `SELECT` amplio sobre auditoría y query history a todo el workspace.",
        ],
        examDecision: "Usa system tables para tendencias y correlación de cuenta; usa el perfil/UI del run para detalle puntual.",
        checkpoint: {
          question: "¿Por qué una vista dinámica es preferible a compartir directamente `system.query.history`?",
          answer: "Permite limitar filas y columnas por equipo o workspace y evitar exponer texto, errores e identidades innecesarias.",
        },
      },
      {
        summary: "Escoge event logs, driver logs o executor logs según el fallo y entiende cómo modo de acceso y retención limitan la investigación.",
        deepDive: advancedDeepDives.m26_4,
        explanation: [
          "El compute event log explica creación, cambios, escalado y terminación. Driver stdout/stderr/log4j contiene excepciones de planificación y aplicación; los worker/executor logs ayudan cuando una tarea concreta falla. Spark UI conserva detalle del runtime activo, pero reiniciar compute puede perder la vista histórica; configura entrega de logs cuando la política de soporte exige retención externa.",
          "El acceso depende del modo de compute. En standard, los usuarios no ven todos los logs de executor y sólo admins acceden a ciertos driver logs; en dedicated, el principal asignado obtiene más visibilidad. No registres payloads, secretos o tokens para facilitar depuración. Usa correlation IDs y métricas estructuradas que permitan unir el fallo con job/run sin exponer datos.",
        ],
        keyPoints: [
          "Event log describe ciclo de vida; driver logs, aplicación; executor logs, tareas concretas.",
          "Planifica retención antes del incidente.",
          "El modo de acceso condiciona quién puede investigar cada señal.",
        ],
        example: {
          language: "Python",
          title: "Logging estructurado sin datos de negocio",
          code: `import json
import logging

logger = logging.getLogger("orders_pipeline")
logger.setLevel(logging.INFO)

logger.info(json.dumps({
    "event": "quality_gate_completed",
    "run_id": dbutils.widgets.get("run_id"),
    "table": "prod.silver.orders",
    "invalid_rows": invalid_count,
    "contains_customer_data": False,
}))`,
          note: "Evita imprimir registros fallidos completos; guarda muestras sensibles sólo en una cuarentena gobernada.",
        },
        pitfalls: [
          "Reiniciar compute antes de capturar evidencia que no tiene entrega persistente.",
          "Añadir `print(df.collect())` y filtrar datos personales a logs operativos.",
        ],
        examDecision: "Elige la señal más cercana a la capa fallida y preserva evidencia antes de reparar; no amplíes permisos de logs sin necesidad.",
        checkpoint: {
          question: "El compute no llegó a iniciar la aplicación. ¿Qué revisarías antes que los executor logs?",
          answer: "El compute event log y los driver/init-script logs, porque quizá nunca existieron executors útiles para la tarea.",
        },
      },
      {
        summary: "Automatiza una captura mínima con CLI y APIs, manteniendo autenticación segura, paginación y trazabilidad de cada artefacto.",
        deepDive: advancedDeepDives.m26_5,
        explanation: [
          "La CLI ofrece comandos `jobs get-run`, `get-run-output`, `list-runs` y `repair-run`; el grupo `api` sirve para endpoints aún no envueltos. Una captura de incidente debe conservar run ID, estado, timestamps, configuración efectiva y enlaces a perfiles, no ejecutar reparaciones en el mismo paso. Usa OAuth para automatización y perfiles separados, nunca tokens pegados en scripts o notebooks.",
          "Las respuestas pueden paginarse y algunos outputs de tareas tienen límites. Diseña el script como lectura idempotente, almacena JSON en un volumen gobernado con retención y redacta campos sensibles. Después de formular una hipótesis, la reparación se convierte en una acción aprobada con evidencia antes/después.",
        ],
        keyPoints: [
          "Separa captura read-only de acciones de reparación.",
          "Usa OAuth/service principal y perfiles de entorno.",
          "Gestiona paginación, límites y redacción de datos sensibles.",
        ],
        example: {
          language: "CLI",
          title: "Captura read-only de un run",
          code: `databricks jobs get-run 987654321 --output json > run-987654321.json
databricks jobs get-run-output 987654321 --output json > output-987654321.json

# Inspecciona antes de cualquier repair-run.
# La autenticación procede de OAuth o de un perfil seguro, no del script.`,
          note: "Guarda los ficheros en un destino gobernado y aplica redacción si el output contiene parámetros sensibles.",
        },
        pitfalls: [
          "Ejecutar `repair-run` automáticamente al detectar cualquier fallo y borrar la evidencia causal.",
          "Guardar un PAT junto al script de diagnóstico o en el historial del shell.",
        ],
        examDecision: "Automatiza inventario y captura con CLI/API; deja repair/cancel como una fase controlada después del diagnóstico.",
        checkpoint: {
          question: "¿Por qué conviene separar la captura de `repair-run`?",
          answer: "Para preservar el estado causal, evitar mutaciones prematuras y permitir una decisión de reparación revisable.",
        },
      },
    ],
    lab: {
      title: "Expediente reproducible de una degradación",
      goal: "Correlacionar query history, job timeline y coste para priorizar el operador que realmente explica el incidente.",
      scenario: "El job `daily_margin` incumplió su SLA tres días seguidos. Dos runs fueron lentos y uno reintentó una tarea. El equipo sólo tiene capturas aisladas. Debes construir una vista de runs recientes, enlazar consultas lentas por ventana temporal y producir una secuencia de diagnóstico con acceso de mínimo privilegio.",
      steps: [
        "Extrae runs y task runs de `system.lakeflow` para el job y conserva IDs y tiempos.",
        "Localiza statements lentos o fallidos de la misma ventana en `system.query.history`.",
        "Clasifica tiempo de cola, ejecución, retry y fallo sin asumir causalidad por simple proximidad.",
        "Abre Query Profile o Spark UI del candidato y registra top operator, I/O, pruning, shuffle y spill aplicables.",
        "Crea una vista operativa limitada al equipo y un checklist de captura read-only por CLI.",
      ],
      starterCode: `-- Parámetros del incidente
-- job_id: 482901
-- window_start: 2026-07-18T00:00:00Z

WITH runs AS (
  SELECT *
  FROM system.lakeflow.job_run_timeline
  WHERE job_id = 482901
    AND period_start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
),
queries AS (
  SELECT *
  FROM system.query.history
  WHERE start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
)
-- Resume runs y consultas candidatas sin inventar una clave inexistente.`,
      solution: `CREATE OR REPLACE VIEW ops.observability.daily_margin_incident AS
WITH runs AS (
  SELECT
    workspace_id, job_id, run_id,
    period_start_time, period_end_time, result_state
  FROM system.lakeflow.job_run_timeline
  WHERE job_id = 482901
    AND period_start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
),
queries AS (
  SELECT
    workspace_id, statement_id, start_time, end_time,
    execution_status, total_duration_ms, error_message
  FROM system.query.history
  WHERE start_time >= TIMESTAMP '2026-07-18T00:00:00Z'
)
SELECT
  r.job_id, r.run_id, r.result_state,
  r.period_start_time, r.period_end_time,
  q.statement_id, q.execution_status, q.total_duration_ms
FROM runs r
LEFT JOIN queries q
  ON q.workspace_id = r.workspace_id
 AND q.start_time BETWEEN r.period_start_time AND r.period_end_time
ORDER BY r.period_start_time DESC, q.total_duration_ms DESC;`,
      checks: [
        { label: "Usa timeline de runs", pattern: "system\\.lakeflow\\.job_run_timeline" },
        { label: "Incluye query history", pattern: "system\\.query\\.history" },
        { label: "Acota por intervalo temporal", pattern: "BETWEEN r\\.period_start_time AND r\\.period_end_time" },
        { label: "Expone statement y run IDs", pattern: "statement_id" },
      ],
      expectedEvidence: [
        "Línea de tiempo de runs, task retries y statements candidatos.",
        "Captura de perfil con operador dominante y métricas comparables.",
        "Hipótesis, nivel de confianza, siguiente prueba y permisos de la vista operativa.",
      ],
      cloudNotes: {
        AWS: "Si la evidencia apunta a capacidad, añade eventos EC2/spot y acceso a S3 al expediente; los system tables siguen siendo regionales respecto al metastore.",
        Azure: "Correlaciona eventos de Azure VM/spot y acceso a ADLS cuando proceda, sin sustituir los IDs de run y statement por timestamps aproximados.",
        GCP: "Añade eventos de Compute Engine/preemptible y métricas de GCS si explican el incidente; consulta system tables desde la región correcta.",
      },
    },
    quiz: [
      {
        question: "Un job clásico tarda 35 minutos. ¿Cuál es la secuencia de diagnóstico más eficiente en Spark UI?",
        options: [
          "Cambiar el node type y después abrir la UI.",
          "Leer todos los driver logs desde el principio.",
          "Empezar por la timeline, localizar el stage dominante y bajar a sus tasks.",
          "Ejecutar `collect()` para obtener una muestra local.",
        ],
        answer: 2,
        explanation: "La navegación descendente conecta duración global con la etapa y las tareas que realmente la explican.",
        domain: "Operations · monitoring",
      },
      {
        question: "Una consulta serverless no tiene Spark UI. ¿Qué herramienta muestra top operators, pruning, I/O y tiempo en Photon?",
        options: [
          "Query Profile.",
          "El navegador de DBFS.",
          "Compute event log clásico.",
          "Un `DESCRIBE HISTORY` de cualquier tabla.",
        ],
        answer: 0,
        explanation: "Query Profile es la interfaz de diagnóstico para SQL warehouses y serverless compute.",
        domain: "Operations · query diagnostics",
      },
      {
        question: "¿Qué práctica protege mejor el acceso a `system.query.history` para un equipo de soporte?",
        options: [
          "Conceder administración de cuenta a todo el equipo.",
          "Exportar diariamente todo el texto a un bucket público.",
          "Compartir capturas manuales sin IDs.",
          "Crear una vista restringida por workspace/equipo y columnas necesarias.",
        ],
        answer: 3,
        explanation: "La vista aplica mínimo privilegio y evita exponer texto, errores o identidades fuera del ámbito operativo.",
        domain: "Data governance · system tables",
      },
      {
        question: "Un script de guardia obtiene un run fallido y llama inmediatamente a `repair-run`. ¿Cuál es la principal debilidad?",
        options: [
          "La CLI no puede consultar jobs.",
          "Muta el incidente antes de preservar y evaluar la evidencia causal.",
          "Los repairs siempre crean un job nuevo.",
          "OAuth no funciona con la CLI.",
        ],
        answer: 1,
        explanation: "Captura y reparación deben separarse para conservar evidencia y evitar acciones automáticas incorrectas.",
        domain: "Operations · incident response",
      },
    ],
    sources: [
      { label: "Query profile", href: "https://docs.databricks.com/aws/en/sql/user/queries/query-profile", reviewedAt },
      { label: "System tables reference", href: "https://docs.databricks.com/aws/en/admin/system-tables", reviewedAt },
      { label: "Monitor Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/monitor", reviewedAt },
      { label: "Debugging with the Spark UI", href: "https://docs.databricks.com/aws/en/compute/troubleshooting/debugging-spark-ui", reviewedAt },
    ],
  },

  m27: {
    lessons: [
      {
        summary: "Dirige un incidente con severidad, roles, timeline y criterios de éxito explícitos antes de tocar configuración.",
        deepDive: advancedDeepDives.m27_1,
        explanation: [
          "Un incidente de datos combina impacto técnico y de negocio: atraso, datos incorrectos, duplicados, indisponibilidad o sobrecoste. Declara severidad y alcance, asigna incident commander y comunicación, congela cambios no esenciales y establece una línea de tiempo en UTC con IDs de job, run, statement y commit. La primera meta es contener impacto sin destruir evidencia.",
          "Diferencia mitigación de causa raíz. Reprocesar una partición puede restaurar el SLA, pero no explica por qué falló; ampliar compute puede ganar tiempo, pero aumenta coste y oculta skew. Define criterios cuantificados de recuperación —freshness, completitud, duración, coste— y un rollback antes de ejecutar cualquier cambio.",
        ],
        keyPoints: [
          "Prioriza impacto y seguridad de datos sobre una optimización elegante.",
          "Registra cada hipótesis, acción, resultado e identificador.",
          "Separa mitigación inmediata de corrección permanente.",
        ],
        example: {
          language: "YAML",
          title: "Cabecera de un expediente de incidente",
          code: `incident: INC-2041
severity: SEV-2
started_at_utc: 2026-07-21T01:42:00Z
impact: "gold.sales_daily fuera de SLA; dashboards sin actualizar"
commander: data-platform-oncall
data_safety: "no ejecutar VACUUM ni borrar checkpoints"
recovery_criteria:
  freshness_minutes: 30
  duplicate_order_ids: 0
  p95_runtime_minutes: 24
rollback: "restaurar bundle release-2026.07.20"`,
          note: "El expediente es operativo: evita nombres de clientes y enlaza evidencia gobernada en lugar de pegar datos sensibles.",
        },
        pitfalls: [
          "Cambiar varias configuraciones a la vez y perder atribución causal.",
          "Declarar resuelto al terminar el job sin validar calidad y consumidores downstream.",
        ],
        examDecision: "Contén, preserva evidencia y define recuperación medible; la optimización permanente viene después de restaurar servicio seguro.",
        checkpoint: {
          question: "¿Qué diferencia una mitigación de una causa raíz?",
          answer: "La mitigación reduce impacto ahora; la causa raíz explica el mecanismo que originó el fallo y permite prevenir recurrencia.",
        },
      },
      {
        summary: "Triangula rendimiento con tres capas: plan y datos, recursos de ejecución y demanda/concurrencia del servicio.",
        deepDive: advancedDeepDives.m27_2,
        explanation: [
          "Una regresión puede provenir de cambio de código, crecimiento o distribución de datos, estadísticas/layout, compute o concurrencia. Compara el último run sano con el primero degradado usando la misma ventana: plan, top operator, bytes leídos, shuffle, spill, workers y cola. Un diff de bundle o historial de tabla acota cambios sin especular.",
          "Formula hipótesis falsables: 'la clave nula genera skew' se prueba con distribución y tareas; 'el warehouse se satura' con cola y concurrencia; 'faltan estadísticas' con pruning y plan. Prioriza la prueba barata y reversible que más reduce incertidumbre. No redimensiones hasta saber si la etapa puede utilizar capacidad adicional.",
        ],
        keyPoints: [
          "Compara un run sano y uno degradado con volumen controlado.",
          "Distingue plan/datos, recursos y concurrencia.",
          "Prueba una hipótesis a la vez con métrica de aceptación.",
        ],
        example: {
          language: "SQL",
          title: "Baseline de consultas por p95 y datos leídos",
          code: `SELECT
  DATE_TRUNC('day', start_time) AS day,
  statement_type,
  percentile(total_duration_ms, 0.95) AS p95_duration_ms,
  SUM(read_bytes) AS read_bytes,
  COUNT(*) AS executions
FROM system.query.history
WHERE start_time >= current_timestamp() - INTERVAL 14 DAYS
  AND statement_type IN ('SELECT', 'MERGE')
GROUP BY day, statement_type
ORDER BY day DESC;`,
          note: "Ajusta nombres de métricas al esquema disponible en tu región; conserva statement IDs para abrir el perfil concreto.",
        },
        pitfalls: [
          "Comparar runs con ventanas de datos o caché diferentes.",
          "Tratar correlación temporal entre dos eventos como causa demostrada.",
        ],
        examDecision: "Antes de escalar, localiza si el tiempo está en cola, scan, shuffle, spill o una tarea extrema y cambia la palanca correspondiente.",
        checkpoint: {
          question: "¿Qué evidencia refutaría la hipótesis de falta de capacidad global?",
          answer: "Workers mayoritariamente ociosos y una única tarea dominante muestran que más capacidad paralela no se aprovecharía.",
        },
      },
      {
        summary: "Recupera fiabilidad respetando idempotencia, checkpoints, contratos Delta y límites exactos del backfill.",
        deepDive: advancedDeepDives.m27_3,
        explanation: [
          "Antes de reintentar, determina el efecto parcial: qué commits Delta existen, qué tarea falló y si el sink externo recibió operaciones. Un `MERGE` con clave estable puede repetirse; un append sin deduplicación puede duplicar. En streaming, borrar un checkpoint cambia el progreso y el estado y rara vez es una reparación segura. Usa repair run para tareas fallidas cuando sus dependencias y outputs sean reutilizables.",
          "Un backfill debe declarar rango, versión de código, tabla destino, estrategia de overwrite/merge y validaciones. Aísla el proceso de la ingesta viva para evitar carreras y conserva una tabla de control de lotes. La recuperación termina cuando reconcilias conteos, claves únicas, freshness y consumidores, no sólo cuando el run aparece verde.",
        ],
        keyPoints: [
          "Inspecciona commits y efectos externos antes de reintentar.",
          "No borres checkpoints para resolver un fallo de código o calidad.",
          "Acota y valida cada backfill con una clave de lote.",
        ],
        example: {
          language: "SQL",
          title: "MERGE idempotente para un rango de backfill",
          code: `MERGE INTO prod.silver.orders AS target
USING staging.backfill_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN
  UPDATE SET *
WHEN NOT MATCHED THEN
  INSERT *;

SELECT order_id, COUNT(*) AS copies
FROM prod.silver.orders
GROUP BY order_id
HAVING COUNT(*) > 1;`,
          note: "La segunda consulta es una evidencia mínima; añade reconciliación de importes y rango temporal según el contrato.",
        },
        pitfalls: [
          "Borrar checkpoint y reprocesar toda la fuente sin conocer retención ni idempotencia.",
          "Ejecutar backfill y pipeline vivo sobre el mismo rango sin coordinación.",
        ],
        examDecision: "Repara sólo tareas fallidas cuando outputs previos son válidos; usa backfill acotado e idempotente cuando el dato histórico debe recalcularse.",
        checkpoint: {
          question: "¿Por qué un run verde después de un retry no demuestra recuperación completa?",
          answer: "Puede haber duplicados, efectos parciales o datos fuera de SLA; hay que validar contratos y consumidores downstream.",
        },
      },
      {
        summary: "Controla el gasto del incidente sin sacrificar evidencia ni convertir un aumento temporal de compute en deuda permanente.",
        deepDive: advancedDeepDives.m27_4,
        explanation: [
          "Durante un incidente puede ser racional aumentar temporalmente capacidad para restaurar un SLA, pero registra quién lo aprobó, duración máxima y rollback automático. `system.billing.usage` permite atribuir el run y comparar coste por ejecución. Una reparación que reduce runtime pero duplica coste no es mejora salvo que el impacto evitado justifique esa compensación.",
          "Después de estabilizar, elimina recursos temporales, restaura límites de policies y calcula coste de reintentos, backfill y mantenimiento. Distingue coste causado por el incidente del baseline. Los presupuestos alertan; no sustituyen un control operativo de concurrencia, autotermination y modos serverless adecuados.",
        ],
        keyPoints: [
          "Todo escalado de emergencia necesita caducidad y rollback.",
          "Compara coste por run y cumplimiento de SLA.",
          "Incluye reintentos y backfills en el coste total del incidente.",
        ],
        example: {
          language: "SQL",
          title: "Consumo asociado a un job durante el incidente",
          code: `SELECT
  usage_date,
  usage_metadata.job_id AS job_id,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_metadata.job_id = '482901'
  AND usage_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-21'
GROUP BY usage_date, usage_metadata.job_id, sku_name
ORDER BY usage_date;`,
          note: "Une precios para moneda y compara con días sanos equivalentes; conserva correcciones de uso.",
        },
        pitfalls: [
          "Dejar un warehouse o clúster sobredimensionado después de la mitigación.",
          "Omitir el coste de retries y backfills al evaluar la solución.",
        ],
        examDecision: "Acepta capacidad temporal si restaura un SLA crítico con rollback; para la solución final exige rendimiento, fiabilidad y coste medidos juntos.",
        checkpoint: {
          question: "¿Qué dos datos mínimos acompañan un escalado de emergencia?",
          answer: "Un criterio de caducidad/rollback y una métrica de impacto que justifique el coste adicional.",
        },
      },
      {
        summary: "Cierra con un postmortem sin culpa que transforme la causa técnica en controles, pruebas y observabilidad verificables.",
        deepDive: advancedDeepDives.m27_5,
        explanation: [
          "El postmortem reconstruye impacto, detección, timeline, causa raíz y factores contribuyentes con evidencia. Evita 'error humano' como causa final: pregunta qué guardrail, test o diseño permitió que una acción normal causara daño. Separa acciones correctivas por prevenir, detectar, mitigar y aprender, con propietario y fecha.",
          "Cada acción debe tener condición de cierre. 'Mejorar monitorización' no sirve; 'alertar si p95 supera 24 min durante dos runs y enlazar el Query Profile' sí. Actualiza runbooks, añade una prueba de regresión con distribución representativa y valida el fix bajo carga. Comparte el aprendizaje sin incluir datos sensibles del incidente.",
        ],
        keyPoints: [
          "Describe mecanismos y condiciones, no culpas.",
          "Convierte acciones en resultados verificables con propietario.",
          "Añade una prueba que reproduzca el patrón causal.",
        ],
        example: {
          language: "YAML",
          title: "Acciones correctivas verificables",
          code: `actions:
  - id: INC-2041-A1
    class: prevent
    owner: data-orders
    change: "test de skew con 45 % de claves nulas"
    done_when: "p95 de tareas < 3x mediana en CI de rendimiento"
  - id: INC-2041-A2
    class: detect
    owner: platform-observability
    change: "alerta de p95 runtime y enlace a statement_id"
    due: 2026-08-05`,
          note: "Una acción se cierra con evidencia; no marques completado sólo por crear un ticket.",
        },
        pitfalls: [
          "Usar 'formar al operador' como única acción ante un sistema sin guardrails.",
          "Cerrar tareas por despliegue sin verificar que el indicador cambió.",
        ],
        examDecision: "El postmortem útil produce controles medibles y una prueba de no regresión; una narración sin acciones no mejora la fiabilidad.",
        checkpoint: {
          question: "¿Qué hace verificable la acción 'añadir una alerta'?",
          answer: "Definir métrica, umbral, ventana, propietario, destino y una prueba que demuestre que dispara y conduce al runbook correcto.",
        },
      },
    ],
    lab: {
      title: "Recuperación integral de un pipeline dentro de SLA y presupuesto",
      goal: "Restaurar datos correctos, demostrar la causa y cerrar con controles de rendimiento, coste y fiabilidad.",
      scenario: "Una release cambió un join de `gold.sales_daily`. El runtime pasó de 19 a 61 minutos, un retry duplicó 0,4 % de pedidos y el clúster de emergencia duplicó el coste. Debes contener, reparar idempotentemente el rango afectado, validar el plan corregido y redactar acciones preventivas.",
      steps: [
        "Declara severidad, impacto, roles, ventana afectada, criterios de recuperación y acciones prohibidas.",
        "Compara release sana/degradada en plan, distribución de claves, stage crítico y coste por run.",
        "Corrige el join con filtros/proyección y una estrategia compatible; prueba con la distribución que causó skew.",
        "Repara el rango mediante `MERGE` idempotente y reconcilia duplicados, importes y freshness.",
        "Revierte el escalado temporal y valida dos runs consecutivos contra SLA y presupuesto.",
        "Entrega postmortem con causa, factores contribuyentes y al menos una acción preventiva y otra de detección.",
      ],
      starterCode: `-- Ventana afectada: 2026-07-18 a 2026-07-20
-- 1. Deduplica staging por order_id conservando el updated_at más reciente.
-- 2. Haz MERGE idempotente sobre prod.silver.orders.
-- 3. Añade queries de evidencia: duplicados, recuento e importe.

WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY order_id ORDER BY updated_at DESC
         ) AS rn
  FROM staging.recovered_orders
)
SELECT * FROM ranked WHERE rn = 1;`,
      solution: `CREATE OR REPLACE TEMP VIEW recovered_orders_dedup AS
SELECT * EXCEPT (rn)
FROM (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY order_id ORDER BY updated_at DESC
         ) AS rn
  FROM staging.recovered_orders
  WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
)
WHERE rn = 1;

MERGE INTO prod.silver.orders AS target
USING recovered_orders_dedup AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.updated_at > target.updated_at THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

SELECT COUNT(*) AS duplicate_keys
FROM (
  SELECT order_id
  FROM prod.silver.orders
  WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
  GROUP BY order_id
  HAVING COUNT(*) > 1
);

SELECT order_date, COUNT(*) AS rows, SUM(net_amount) AS net_amount
FROM prod.silver.orders
WHERE order_date BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'
GROUP BY order_date
ORDER BY order_date;`,
      checks: [
        { label: "Acota la ventana de recuperación", pattern: "BETWEEN DATE '2026-07-18' AND DATE '2026-07-20'" },
        { label: "Deduplica por clave y recencia", pattern: "ROW_NUMBER\\(\\) OVER" },
        { label: "Aplica MERGE idempotente", pattern: "MERGE INTO prod\\.silver\\.orders" },
        { label: "Reconcilia duplicados", pattern: "HAVING COUNT\\(\\*\\) > 1" },
      ],
      expectedEvidence: [
        "Timeline con release, runs, mitigación y rollback del compute de emergencia.",
        "Cero claves duplicadas y reconciliación diaria de filas e importe.",
        "Dos runs dentro de SLA, comparación de coste y postmortem con acciones verificables.",
      ],
      cloudNotes: {
        AWS: "Incluye en el coste del incidente spot interruptions, EC2 temporal, requests/egress S3 y confirma que el driver de emergencia no quedó en spot.",
        Azure: "Registra evictions de Azure Spot, cambios de VM y transacciones/egress de ADLS; revierte capacidad temporal mediante la configuración versionada.",
        GCP: "Incluye preemptions de Compute Engine, cambios de machine type y operaciones/egress GCS; devuelve policies y límites al baseline aprobado.",
      },
    },
    quiz: [
      {
        question: "Durante un SEV-2, aumentar compute restaura el SLA pero la causa sigue desconocida. ¿Cómo debe registrarse?",
        options: [
          "Como solución permanente porque funcionó.",
          "Como causa raíz del incidente.",
          "Como prueba de que faltaba CPU.",
          "Como mitigación temporal con caducidad, coste y rollback.",
        ],
        answer: 3,
        explanation: "La acción reduce impacto, pero no demuestra causa; necesita límites y reversión explícitos.",
        domain: "Operations · incident management",
      },
      {
        question: "Un retry dejó el run verde, pero el sink era append y la primera ejecución escribió parcialmente. ¿Qué falta antes de cerrar?",
        options: [
          "Aumentar la retención del driver log.",
          "Reconciliar duplicados y efectos parciales del rango afectado.",
          "Ejecutar `VACUUM RETAIN 0 HOURS`.",
          "Borrar el historial del job.",
        ],
        answer: 1,
        explanation: "El estado verde no valida semántica; un append parcial puede duplicar datos después del retry.",
        domain: "Data processing · reliability",
      },
      {
        question: "¿Cuál es la mejor hipótesis falsable para una etapa con cinco stragglers?",
        options: [
          "Cinco claves calientes concentran datos; se comprobará con frecuencias y bytes por task.",
          "Spark está lento y necesita más nodos.",
          "El cloud provider tuvo un problema.",
          "La consulta es demasiado compleja.",
        ],
        answer: 0,
        explanation: "La hipótesis especifica mecanismo y evidencia que puede confirmarla o refutarla.",
        domain: "Operations · root cause analysis",
      },
      {
        question: "¿Qué acción de postmortem está definida de forma verificable?",
        options: [
          "Mejorar observabilidad pronto.",
          "Recordar al equipo que revise los joins.",
          "Alertar si p95 supera 24 min en dos runs, con owner, runbook y prueba de disparo.",
          "Ser más cuidadosos en producción.",
        ],
        answer: 2,
        explanation: "Incluye métrica, umbral, ventana, propietario y condición de prueba.",
        domain: "Operations · continuous improvement",
      },
    ],
    sources: [
      { label: "Monitor Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/monitor", reviewedAt },
      { label: "Query profile", href: "https://docs.databricks.com/aws/en/sql/user/queries/query-profile", reviewedAt },
      { label: "Billable usage system table reference", href: "https://docs.databricks.com/aws/en/admin/system-tables/billing", reviewedAt },
    ],
  },

  m28: {
    lessons: [
      {
        summary: "Separa lógica de negocio, adaptadores Databricks y puntos de entrada para que el mismo código pueda probarse sin ejecutar un notebook completo.",
        deepDive: advancedDeepDives.m28_1,
        explanation: [
          "Un proyecto mantenible sitúa el paquete importable bajo `src/`, las pruebas bajo `tests/` y deja los notebooks como orquestadores finos. La lógica que transforma DataFrames vive en funciones con entradas y salidas explícitas; acceso a widgets, secretos, paths y escritura se encapsula en adaptadores. Así un cambio de notebook no es la única unidad desplegable ni verificable.",
          "`pyproject.toml` declara el paquete, versión de Python, dependencias y herramientas. El layout `src/` evita importar accidentalmente el código desde el directorio de trabajo en vez del artefacto instalado. En Databricks Runtime 16.0 o superior, un notebook no debe usarse como módulo Python: refactoriza código compartido a archivos `.py` o a una wheel.",
        ],
        keyPoints: [
          "Notebooks coordinan; módulos Python implementan lógica reutilizable.",
          "Separa transformaciones puras de lectura, escritura, widgets y secretos.",
          "Usa layout `src/` para probar el paquete que realmente distribuyes.",
        ],
        example: {
          language: "Python",
          title: "Transformación importable sin estado global",
          code: `# src/orders/transforms.py
from pyspark.sql import DataFrame, functions as F

def valid_orders(df: DataFrame) -> DataFrame:
    return (
        df.where(F.col("order_id").isNotNull())
          .where(F.col("net_amount") >= 0)
          .withColumn("order_date", F.to_date("ordered_at"))
          .select("order_id", "customer_id", "order_date", "net_amount")
    )`,
          note: "La función no conoce catálogo, widgets ni modo de escritura; esas decisiones pertenecen al entry point del job.",
        },
        pitfalls: [
          "Encapsular toda la pipeline en un notebook con variables globales y orden de celdas implícito.",
          "Importar un notebook como módulo cuando el runtime moderno exige archivos Python para código compartido.",
        ],
        examDecision: "Extrae lógica reutilizable a módulos y mantén los notebooks finos; un job productivo debe poder instalar y probar un artefacto versionado.",
        checkpoint: {
          question: "¿Por qué una función de transformación no debería leer directamente `dbutils.widgets`?",
          answer: "Porque acopla la lógica al notebook y dificulta pruebas; el entry point debe convertir parámetros y pasarlos a la función.",
        },
      },
      {
        summary: "Diseña contratos de DataFrame explícitos para que los tests detecten cambios de esquema, nulos, duplicados y semántica, no sólo errores de ejecución.",
        deepDive: advancedDeepDives.m28_2,
        explanation: [
          "Spark evalúa de forma perezosa, por lo que construir un DataFrame no demuestra que la transformación sea válida. Las pruebas deben materializar un resultado pequeño y comparar esquema, filas y casos borde. Crea fixtures mínimas que incluyan nulos, duplicados, timestamps y valores inválidos; evita copiar datasets productivos con información sensible.",
          "Una transformación testable recibe DataFrames y parámetros ordinarios. Para comparar resultados, ordena por claves deterministas o utiliza utilidades de aserción de DataFrames disponibles en tu stack; nunca dependas del orden natural de particiones. Separa el contrato técnico —tipos y columnas— del contrato de negocio —por ejemplo, un único pedido por ID—.",
        ],
        keyPoints: [
          "Materializa acciones pequeñas para ejecutar el plan bajo prueba.",
          "Compara esquema y contenido con orden determinista.",
          "Incluye casos borde sintéticos y libres de datos personales.",
        ],
        example: {
          language: "Python",
          title: "Prueba unitaria de una transformación Spark",
          code: `# tests/test_transforms.py
from orders.transforms import valid_orders

def test_valid_orders_rejects_negative_amounts(spark):
    source = spark.createDataFrame(
        [(1, 7, "2026-07-20T10:00:00Z", 12.5),
         (2, 8, "2026-07-20T11:00:00Z", -4.0)],
        "order_id long, customer_id long, ordered_at string, net_amount double",
    )

    actual = valid_orders(source).orderBy("order_id").collect()

    assert [row.order_id for row in actual] == [1]
    assert str(actual[0].order_date) == "2026-07-20"`,
          note: "El fixture prueba un comportamiento concreto; añade tests separados para nulos, zona horaria y esquema.",
        },
        pitfalls: [
          "Afirmar sólo que `df.count()` no lanza error sin comprobar valores o esquema.",
          "Comparar listas no ordenadas y aceptar tests intermitentes por particionado.",
        ],
        examDecision: "Para lógica DataFrame, prueba entradas sintéticas mínimas, fuerza evaluación y valida esquema más reglas de negocio.",
        checkpoint: {
          question: "¿Por qué `result = transform(df)` no basta como test?",
          answer: "Por lazy evaluation: muchos errores aparecen sólo al ejecutar una acción, y aún no se ha comprobado la semántica del resultado.",
        },
      },
      {
        summary: "Distribuye wheels reproducibles y fija dependencias en el nivel correcto para evitar que notebook, job y serverless resuelvan entornos distintos.",
        deepDive: advancedDeepDives.m28_3,
        explanation: [
          "Una wheel empaqueta módulos y metadatos en un artefacto versionado. Declara dependencias directas en `pyproject.toml`, crea un lock o constraints para CI y fija versiones cuando la reproducibilidad lo exija. En jobs, instala la wheel como librería de la tarea; para compute clásico puedes almacenarla en workspace files o Unity Catalog Volumes según modo de acceso y runtime.",
          "Serverless usa entornos y no admite init scripts. Fija paquetes y prueba el environment version seleccionado. Evita `%pip install` disperso por notebooks productivos: puede reiniciar Python, cambiar precedencia y hacer que dos tareas ejecuten código distinto. La promoción debe mover el mismo hash de wheel, no reconstruirla de fuentes diferentes en cada ambiente.",
        ],
        keyPoints: [
          "Promueve el mismo artefacto inmutable entre dev, test y prod.",
          "Declara dependencias directas y controla resolución transitiva.",
          "Adapta la instalación a serverless, access mode y ubicación gobernada.",
        ],
        example: {
          language: "Python",
          title: "Metadatos mínimos de paquete en pyproject.toml",
          code: `# pyproject.toml
[build-system]
requires = ["hatchling==1.27.0"]
build-backend = "hatchling.build"

[project]
name = "orders-pipeline"
version = "1.4.0"
requires-python = ">=3.11"
dependencies = [
  "pydantic==2.11.7",
]

[tool.pytest.ini_options]
testpaths = ["tests"]`,
          note: "No declares PySpark a ciegas como dependencia runtime si lo proporciona el entorno Databricks; documenta cómo lo aporta cada target de pruebas.",
        },
        pitfalls: [
          "Reconstruir la wheel en prod y obtener dependencias transitivas distintas a test.",
          "Usar init scripts para gestionar paquetes de serverless, donde no están soportados.",
        ],
        examDecision: "Construye una wheel una vez, verifica su hash y promueve ese artefacto; el entorno aporta Spark y las dependencias del proyecto quedan declaradas.",
        checkpoint: {
          question: "¿Qué riesgo evita promover exactamente la misma wheel de test a prod?",
          answer: "Evita divergencia de código o dependencias causada por reconstrucciones y resoluciones diferentes entre entornos.",
        },
      },
      {
        summary: "Combina tests unitarios rápidos con integración Databricks para cubrir catálogos, permisos, formatos y comportamiento distribuido.",
        deepDive: advancedDeepDives.m28_4,
        explanation: [
          "Los tests unitarios verifican funciones y contratos con datos pequeños; no demuestran que el service principal pueda leer Unity Catalog, que la wheel se instale o que un `MERGE` sea idempotente. Las pruebas de integración despliegan en un catálogo aislado, ejecutan el entry point con identidad real y validan side effects. Deben usar nombres únicos por ejecución y limpiar sólo recursos etiquetados como temporales.",
          "Databricks permite ejecutar pytest en el workspace y Databricks Connect puede acercar desarrollo local al compute remoto. Mantén la pirámide: muchas pruebas sin red, menos integraciones y pocas pruebas end-to-end. Marca suites y establece timeouts para que CI no ejecute por accidente una carga completa.",
        ],
        keyPoints: [
          "Unit tests cubren lógica; integración cubre plataforma, permisos y side effects.",
          "Aísla catálogos/esquemas de prueba por ejecución.",
          "Marca suites lentas y limita datos, tiempo y coste.",
        ],
        example: {
          language: "Python",
          title: "Test de integración idempotente",
          code: `import pytest

@pytest.mark.integration
def test_merge_is_idempotent(spark, target_table, sample_orders):
    sample_orders.createOrReplaceTempView("incoming_orders")
    run_merge(spark, "incoming_orders", target_table)
    first = spark.table(target_table).count()

    run_merge(spark, "incoming_orders", target_table)
    second = spark.table(target_table).count()

    assert second == first`,
          note: "El fixture `target_table` debe crear un nombre aislado y eliminar sólo ese objeto al finalizar, incluso si el test falla.",
        },
        pitfalls: [
          "Ejecutar integraciones contra tablas compartidas y generar colisiones entre ramas.",
          "Sustituir toda prueba por mocks y no detectar permisos o DDL incompatibles.",
        ],
        examDecision: "Usa unit tests para lógica pura y una capa de integración acotada para identidad, catálogos, artefacto y side effects.",
        checkpoint: {
          question: "¿Qué fallo sólo detectaría probablemente una prueba de integración?",
          answer: "Que el service principal del job carece de `USE SCHEMA` o que la wheel no puede instalarse en el access mode elegido.",
        },
      },
      {
        summary: "Convierte calidad en una puerta de promoción: formato, tipos, unit tests, integración, seguridad y contrato del artefacto.",
        deepDive: advancedDeepDives.m28_5,
        explanation: [
          "Una pipeline CI debe fallar pronto: lint y type check, tests unitarios, build de wheel, escaneo y validación del bundle. La integración se ejecuta con una identidad no humana y permisos mínimos en un target efímero o compartimentado. Conserva reporte de tests, hash del artefacto y commit para reconstruir la decisión de despliegue.",
          "Los secretos pertenecen al proveedor de identidad o al gestor de secretos del CI; prefiere OAuth workload identity/service principal a PAT de usuario. La promoción a producción requiere que el mismo artefacto superado sea referenciado por la configuración prod. Añade rollback a la versión anterior y una comprobación post-deploy antes de dirigir triggers reales.",
        ],
        keyPoints: [
          "Falla rápido antes de consumir compute remoto.",
          "CI usa identidad no humana y mínimo privilegio.",
          "Firma la promoción con commit y hash del artefacto.",
        ],
        example: {
          language: "YAML",
          title: "Orden de puertas en CI",
          code: `quality_gates:
  - name: unit
    command: pytest -m "not integration"
  - name: build
    command: python -m build
  - name: bundle_validate
    command: databricks bundle validate -t test
  - name: integration
    command: pytest -m integration
  - name: artifact_manifest
    command: sha256sum dist/*.whl`,
          note: "Adapta el sintaxis al CI elegido; el principio importante es que prod use el hash que superó estas puertas.",
        },
        pitfalls: [
          "Usar el PAT personal de un desarrollador y perder el pipeline cuando cambia de equipo.",
          "Desplegar desde la rama local después de que CI probó otro commit.",
        ],
        examDecision: "Promueve sólo artefactos trazables que superaron puertas automáticas con identidad de servicio; valida y conserva rollback.",
        checkpoint: {
          question: "¿Qué dos identificadores permiten demostrar qué código llegó a producción?",
          answer: "El commit de origen y el hash/version de la wheel desplegada.",
        },
      },
    ],
    lab: {
      title: "Empaquetar y probar una transformación de pedidos",
      goal: "Extraer lógica de notebook a un paquete, probar casos borde y definir una integración idempotente.",
      scenario: "Un notebook de 1.100 líneas normaliza pedidos, lee widgets en mitad de la lógica y escribe directamente en prod. Cada cambio exige ejecutar todo el notebook. Debes crear un módulo importable, pruebas unitarias y una prueba de integración que use una tabla aislada.",
      steps: [
        "Define `src/orders/transforms.py` con una función que reciba y devuelva DataFrames sin `dbutils`.",
        "Crea fixtures sintéticas para importe negativo, ID nulo, duplicado y timestamp inválido.",
        "Añade tests que materialicen resultados y validen esquema, filas y clave única.",
        "Declara paquete y dependencias en `pyproject.toml`; construye una wheel una vez.",
        "Diseña un test de integración idempotente con esquema o tabla única por run y limpieza segura.",
        "Registra hash de wheel, commit y resultados como evidencia de promoción.",
      ],
      starterCode: `from pyspark.sql import DataFrame

def normalize_orders(df: DataFrame) -> DataFrame:
    """Devuelve pedidos válidos con una fila por order_id."""
    # TODO: filtra ID/importe, convierte ordered_at y deduplica por updated_at.
    return df`,
      solution: `from pyspark.sql import DataFrame, Window, functions as F

def normalize_orders(df: DataFrame) -> DataFrame:
    latest = Window.partitionBy("order_id").orderBy(F.desc("updated_at"))

    return (
        df.where(F.col("order_id").isNotNull())
          .where(F.col("net_amount") >= 0)
          .withColumn("order_ts", F.to_timestamp("ordered_at"))
          .where(F.col("order_ts").isNotNull())
          .withColumn("_rank", F.row_number().over(latest))
          .where(F.col("_rank") == 1)
          .drop("_rank")
          .select(
              "order_id", "customer_id", "order_ts",
              "updated_at", "net_amount",
          )
    )`,
      checks: [
        { label: "Valida order_id", pattern: "order_id.*isNotNull" },
        { label: "Rechaza importes negativos", pattern: "net_amount.*>= 0" },
        { label: "Convierte y valida timestamp", pattern: "to_timestamp" },
        { label: "Deduplica por recencia", pattern: "row_number\\(\\).*over" },
      ],
      expectedEvidence: [
        "Suite unitaria con casos borde y salida determinista.",
        "Wheel y manifiesto con hash ligados al commit.",
        "Prueba de integración repetida dos veces sin duplicados y con limpieza limitada al recurso temporal.",
      ],
      cloudNotes: {
        AWS: "Para integración, usa un catálogo de test con storage credential hacia S3 y una identidad IAM de mínimo privilegio; almacena wheels en workspace files o Volumes según access mode.",
        Azure: "Aísla el esquema de test sobre ADLS Gen2 mediante managed identity o service principal; la wheel puede residir en workspace files o Unity Catalog Volumes.",
        GCP: "Usa una service account limitada al bucket GCS de test y un catálogo/esquema efímero; no copies credenciales de servicio al repositorio de pruebas.",
      },
    },
    quiz: [
      {
        question: "Un notebook importa otro notebook para reutilizar una función en un runtime moderno. ¿Qué refactor mejora testabilidad y compatibilidad?",
        options: [
          "Duplicar la celda en cada notebook.",
          "Mover la función a un archivo `.py` dentro de un paquete importable.",
          "Convertir la función en un widget.",
          "Guardar el código en un tag de compute.",
        ],
        answer: 1,
        explanation: "Los módulos Python son la unidad adecuada para código compartido; los notebooks deben coordinar y presentar.",
        domain: "Software engineering · project structure",
      },
      {
        question: "¿Qué prueba ofrece mejor evidencia sobre una transformación Spark?",
        options: [
          "Comprobar sólo que devuelve un objeto DataFrame.",
          "Revisar manualmente `show()` en producción.",
          "Comparar únicamente el número de columnas.",
          "Materializar datos sintéticos y validar esquema, filas y casos borde.",
        ],
        answer: 3,
        explanation: "La evaluación perezosa y los contratos de negocio requieren ejecutar y comparar un resultado concreto.",
        domain: "Software engineering · testing",
      },
      {
        question: "¿Cuál es la estrategia más reproducible para promover una librería?",
        options: [
          "Construir una wheel una vez y promover el mismo hash por ambientes.",
          "Ejecutar `%pip install` sin versión en cada notebook.",
          "Reconstruir desde `main` durante cada deploy.",
          "Instalar dependencias con init script en serverless.",
        ],
        answer: 0,
        explanation: "Un artefacto inmutable evita divergencias de código y resolución entre test y producción.",
        domain: "Software engineering · dependencies",
      },
      {
        question: "¿Qué debe cubrir una prueba de integración que un unit test puro no cubre?",
        options: [
          "La suma de dos números en Python.",
          "El formato del nombre de una función.",
          "Permisos reales, instalación de wheel y side effects Delta idempotentes.",
          "La ortografía del README.",
        ],
        answer: 2,
        explanation: "Esos comportamientos dependen de la plataforma y la identidad desplegada.",
        domain: "Software engineering · integration testing",
      },
    ],
    sources: [
      { label: "Python unit testing in the workspace", href: "https://docs.databricks.com/aws/en/files/python-unit-tests", reviewedAt },
      { label: "What are workspace files?", href: "https://docs.databricks.com/aws/en/files/workspace", reviewedAt },
      { label: "Install libraries", href: "https://docs.databricks.com/aws/en/libraries/", reviewedAt },
      { label: "Share code between Databricks notebooks", href: "https://docs.databricks.com/aws/en/notebooks/share-code", reviewedAt },
    ],
  },

  m29: {
    lessons: [
      {
        summary: "Modela código, artefactos y recursos Databricks como una unidad declarativa versionada mediante Declarative Automation Bundles.",
        deepDive: advancedDeepDives.m29_1,
        explanation: [
          "Declarative Automation Bundles —antes Asset Bundles— describen jobs, pipelines, permisos, artefactos y configuración junto al código. `databricks.yml` identifica el bundle y puede incluir ficheros por dominio; `resources` usa el esquema de las APIs de Databricks, mientras `artifacts` construye wheels u otros entregables. `sync` controla qué fuentes se envían al workspace.",
          "Un bundle no reemplaza Terraform para infraestructura de cuenta o nube. Su frontera natural son recursos del proyecto dentro de Databricks. Evita un YAML monolítico: separa `resources/jobs.yml`, `resources/pipelines.yml` y variables; valida que referencias como `${resources.jobs.orders.id}` se resuelven sin hardcodear IDs entre ambientes.",
        ],
        keyPoints: [
          "El bundle une configuración de recursos y artefactos versionados.",
          "Usa includes y referencias en lugar de duplicar IDs.",
          "Mantén fuera credenciales e infraestructura cloud no propia del proyecto.",
        ],
        example: {
          language: "YAML",
          title: "Anatomía mínima de un bundle",
          code: `bundle:
  name: orders-platform

include:
  - resources/*.yml

artifacts:
  default:
    type: whl
    build: python -m build
    path: .

sync:
  include:
    - src/**
    - tests/**
  exclude:
    - .venv/**`,
          note: "El recurso job puede vivir en `resources/orders.job.yml` y referenciar la wheel construida por el artefacto.",
        },
        pitfalls: [
          "Guardar host, token o contraseña dentro de `databricks.yml`.",
          "Usar bundles para crear redes, buckets y metastores que pertenecen a otra capa de infraestructura.",
        ],
        examDecision: "Usa Bundles para el ciclo de vida del proyecto Databricks; reserva IaC de cuenta/cloud para Terraform u otra herramienta dedicada.",
        checkpoint: {
          question: "¿Qué ventaja aporta referenciar un job por `${resources.jobs.<key>.id}`?",
          answer: "El ID se resuelve por target y despliegue, evitando hardcodear identificadores distintos entre workspaces.",
        },
      },
      {
        summary: "Define targets dev, test y prod con overrides mínimos, rutas aisladas y modos que expresen claramente la intención de cada ambiente.",
        deepDive: advancedDeepDives.m29_2,
        explanation: [
          "Un target aplica variables, workspace, modo y overrides a la misma definición base. Development mode añade aislamiento apropiado al desarrollador y permite iteración; production mode aplica validaciones y nombres estables. Las variables cambian catálogo, esquema, policy o warehouse, pero no deben duplicar toda la definición del job.",
          "Usa `${bundle.target}` y `${workspace.current_user.userName}` para rutas de desarrollo, y una identidad de despliegue estable en producción. Define `run_as` de forma explícita: quien despliega no tiene por qué ser quien ejecuta. Antes de promocionar, compara el plan para detectar eliminaciones o reemplazos inesperados.",
        ],
        keyPoints: [
          "Una base común reduce drift; targets sólo expresan diferencias reales.",
          "Aísla rutas y nombres de desarrollo por usuario/target.",
          "Separa deployment identity de `run_as` del workload.",
        ],
        example: {
          language: "YAML",
          title: "Targets con variables y modos",
          code: `variables:
  catalog:
    description: Catálogo de datos del target

targets:
  dev:
    mode: development
    default: true
    variables:
      catalog: dev
    workspace:
      root_path: /Workspace/Users/\${workspace.current_user.userName}/.bundle/\${bundle.name}/\${bundle.target}

  prod:
    mode: production
    variables:
      catalog: prod
    run_as:
      service_principal_name: \${var.prod_run_as}`,
          note: "Declara `prod_run_as` por un canal seguro de configuración; no pegues credenciales ni un ID de usuario personal.",
        },
        pitfalls: [
          "Copiar el job entero dentro de cada target y permitir que sus DAG diverjan.",
          "Ejecutar producción como el desarrollador que lanzó el deploy.",
        ],
        examDecision: "Mantén una definición común y limita overrides a catálogo, identidad, tamaño o schedule; producción usa service principal estable.",
        checkpoint: {
          question: "¿Por qué `run_as` debe separarse del usuario que ejecuta `bundle deploy`?",
          answer: "Para que permisos y continuidad del job dependan de una identidad de servicio gobernada, no de una persona.",
        },
      },
      {
        summary: "Usa `validate`, `plan`, `deploy` y `run` como puertas distintas; no conviertas un deploy correcto en prueba suficiente del workload.",
        deepDive: advancedDeepDives.m29_3,
        explanation: [
          "`bundle validate` resuelve configuración y comprueba el esquema contra el target. `bundle plan` muestra acciones previstas sin aplicarlas. `bundle deploy` sincroniza artefactos y recursos, y `bundle run` ejecuta un recurso ya desplegado. Una pipeline segura captura el plan, requiere aprobación para cambios destructivos y despliega el mismo artefacto validado.",
          "La validación no ejecuta SQL ni demuestra permisos de datos del `run_as`. Después del deploy, ejecuta un smoke test con parámetros y datos acotados, comprueba estado y contrato, y sólo entonces habilita triggers o tráfico productivo. Usa `bundle summary` y output estructurado para trazabilidad.",
        ],
        keyPoints: [
          "Validate comprueba configuración; plan anticipa cambios; deploy aplica; run verifica ejecución.",
          "Revisa manualmente cambios destructivos antes de desplegar.",
          "Añade smoke test post-deploy antes de activar producción.",
        ],
        example: {
          language: "CLI",
          title: "Secuencia segura de promoción",
          code: `databricks bundle validate -t test
databricks bundle plan -t test
databricks bundle deploy -t test
databricks bundle run -t test orders_smoke -- --business_date 2026-07-20

# Tras aprobar evidencia y el plan de prod:
databricks bundle plan -t prod
databricks bundle deploy -t prod`,
          note: "No uses `--force` para saltar validaciones de rama como comportamiento normal de CI.",
        },
        pitfalls: [
          "Desplegar directamente en prod sin leer un plan que elimina o reemplaza recursos.",
          "Confundir bundle validado con job funcional sobre datos y permisos reales.",
        ],
        examDecision: "Valida y planifica antes de desplegar; prueba el recurso desplegado con un smoke test antes de activar el trigger.",
        checkpoint: {
          question: "¿Qué aporta `bundle plan` que no aporta `bundle validate`?",
          answer: "Muestra las acciones sobre recursos —crear, actualizar o eliminar— que el despliegue realizaría en ese target.",
        },
      },
      {
        summary: "Autentica CI con OAuth y aplica promoción por ambientes sin tokens personales, rebuilds ni edición manual del workspace.",
        deepDive: advancedDeepDives.m29_4,
        explanation: [
          "CI debe usar workload identity federation o un service principal con OAuth y permisos limitados al workspace/recursos destino. Los secretos, hosts y client IDs viven en el sistema de CI o perfiles seguros. Un PAT personal tiene ciclo de vida humano, privilegios difíciles de justificar y riesgo de exposición; no es la identidad productiva adecuada.",
          "Construye y prueba la wheel, publica un manifiesto de hash, despliega en test y promueve el mismo artefacto a prod. Protege el ambiente prod con aprobación y branch policy. Prohíbe ediciones manuales de recursos gestionados por bundle o documenta un proceso de importación del cambio, porque el siguiente deploy puede sobrescribir drift.",
        ],
        keyPoints: [
          "CI usa OAuth y service principal de mínimo privilegio.",
          "El mismo hash atraviesa test y producción.",
          "Los recursos declarativos no se editan manualmente sin reconciliar código.",
        ],
        example: {
          language: "YAML",
          title: "Contrato conceptual de una promoción CI",
          code: `promotion:
  source_commit: 4f2c9ab
  artifact: orders_pipeline-1.4.0-py3-none-any.whl
  sha256: "<sha256-verificado-en-ci>"
  deploy_identity: sp-data-platform-cicd
  run_identity: sp-orders-prod
  gates:
    - bundle_plan_approved
    - integration_tests_passed
    - rollback_version_recorded`,
          note: "El fichero ilustra evidencia; las credenciales se obtienen por OAuth y nunca se escriben en el manifiesto.",
        },
        pitfalls: [
          "Reutilizar un PAT de administrador para todos los workspaces.",
          "Volver a construir el paquete en cada ambiente y perder identidad del artefacto.",
        ],
        examDecision: "CI/CD productivo usa identidad no humana, privilegios por target y promoción inmutable; evita cambios manuales que introduzcan drift.",
        checkpoint: {
          question: "¿Por qué un PAT personal es una mala dependencia de producción?",
          answer: "Expira o se revoca con la persona, suele tener permisos excesivos y no representa una identidad operativa estable.",
        },
      },
      {
        summary: "Gestiona drift, ownership, permisos y rollback como parte del bundle para que un despliegue sea reversible y auditable.",
        deepDive: advancedDeepDives.m29_5,
        explanation: [
          "Un recurso creado manualmente puede incorporarse mediante generación o binding según soporte, pero primero hay que decidir quién será su fuente de verdad. Dos bundles no deben gestionar el mismo job. Usa permisos declarados, nombres estables y ownership operativo; revisa el plan cuando cambia la identidad o la ruta raíz porque puede aparentar un recurso nuevo.",
          "Rollback normalmente despliega la última versión conocida del bundle y artefacto, no restaura datos automáticamente. Los cambios de esquema requieren una estrategia compatible hacia delante y hacia atrás. Conserva manifest, plan y resultados de smoke test por release; si un deploy falla a mitad, inspecciona el estado real antes de relanzar.",
        ],
        keyPoints: [
          "Un recurso tiene una sola fuente de verdad y un único bundle propietario.",
          "Rollback de configuración no revierte side effects de datos.",
          "Revisa plan y estado real antes de reparar un deploy parcial.",
        ],
        example: {
          language: "CLI",
          title: "Inventario antes de reconciliar un recurso existente",
          code: `databricks bundle validate -t prod
databricks bundle plan -t prod
databricks bundle summary -t prod

# Si el job ya existe, documenta ownership y usa el flujo
# de generación/binding soportado en lugar de duplicarlo.`,
          note: "No ejecutes binding a ciegas: confirma que ningún otro bundle o proceso gestiona ese recurso.",
        },
        pitfalls: [
          "Crear un job duplicado porque cambió `root_path` o la identidad del bundle.",
          "Creer que desplegar la versión anterior revierte filas ya escritas.",
        ],
        examDecision: "Ante drift, establece primero la fuente de verdad; usa plan/binding de forma consciente y diseña rollback de datos por separado.",
        checkpoint: {
          question: "¿Qué no resuelve por sí solo volver a desplegar el bundle anterior?",
          answer: "No revierte tablas, mensajes o side effects que la versión defectuosa ya produjo.",
        },
      },
    ],
    lab: {
      title: "Promoción reproducible de un job Python wheel",
      goal: "Crear un bundle con targets aislados, artefacto único, identidad de ejecución y una secuencia validate-plan-deploy-run.",
      scenario: "El job `orders_quality` se configuró manualmente en tres workspaces y sus parámetros divergieron. Debes declararlo una vez, usar catálogos dev/test/prod, ejecutar como service principal en producción y conservar el hash exacto de la wheel promovida.",
      steps: [
        "Crea `databricks.yml` con bundle, includes, artifact wheel y variable `catalog`.",
        "Define el job en `resources/orders.job.yml` con parámetros y referencia al artefacto.",
        "Configura targets dev, test y prod; aísla rutas dev y usa `run_as` no humano en prod.",
        "Ejecuta validate y plan en test, despliega y lanza un smoke test acotado.",
        "Promueve el mismo hash a prod sólo tras aprobar plan, permisos y rollback.",
        "Documenta ownership para evitar que el job vuelva a editarse manualmente.",
      ],
      starterCode: `bundle:
  name: orders-quality

variables:
  catalog:
    description: Catálogo del ambiente

# TODO: artifact wheel, resources y targets dev/test/prod.
# Producción debe usar un service principal en run_as.`,
      solution: `bundle:
  name: orders-quality

include:
  - resources/*.yml

variables:
  catalog:
    description: Catálogo del ambiente
  prod_run_as:
    description: Application ID del service principal productivo

artifacts:
  default:
    type: whl
    path: .
    build: python -m build

targets:
  dev:
    mode: development
    default: true
    variables:
      catalog: dev
    workspace:
      root_path: /Workspace/Users/\${workspace.current_user.userName}/.bundle/\${bundle.name}/\${bundle.target}
  test:
    variables:
      catalog: test
  prod:
    mode: production
    variables:
      catalog: prod
    run_as:
      service_principal_name: \${var.prod_run_as}`,
      checks: [
        { label: "Construye una wheel", pattern: "type: whl" },
        { label: "Incluye tres targets", pattern: "dev:[\\s\\S]*test:[\\s\\S]*prod:" },
        { label: "Aísla la ruta de desarrollo", pattern: "workspace\\.current_user\\.userName" },
        { label: "Usa service principal en producción", pattern: "service_principal_name" },
      ],
      expectedEvidence: [
        "Salida de validate y plan de test sin cambios destructivos inesperados.",
        "Smoke test exitoso con catálogo test y permisos del `run_as`.",
        "Manifiesto de commit, hash de wheel, plan prod aprobado y versión de rollback.",
      ],
      cloudNotes: {
        AWS: "Configura OAuth del service principal y variables de rutas S3/storage credentials por target; la autenticación cloud del dato no debe hardcodearse en el bundle.",
        Azure: "Usa el service principal/managed identity adecuado para ADLS y OAuth de Databricks; mantén IDs y hosts en configuración segura del target CI.",
        GCP: "Separa el service principal Databricks de la service account usada por storage credentials de GCS; ninguna clave JSON debe entrar en YAML o Git.",
      },
    },
    quiz: [
      {
        question: "¿Qué herramienta del bundle muestra cambios previstos sin aplicarlos?",
        options: [
          "`databricks bundle plan`",
          "`databricks bundle run`",
          "`databricks jobs repair-run`",
          "`DESCRIBE HISTORY`",
        ],
        answer: 0,
        explanation: "Plan calcula las acciones del target y permite revisar creaciones, actualizaciones o eliminaciones antes de deploy.",
        domain: "Deployment · Bundles",
      },
      {
        question: "Tres targets duplican toda la definición del job y sólo cambia el catálogo. ¿Qué diseño reduce drift?",
        options: [
          "Tres repositorios independientes.",
          "Una definición base y una variable `catalog` sobrescrita por target.",
          "Editar manualmente el job después de cada deploy.",
          "Hardcodear IDs de tablas en el wheel.",
        ],
        answer: 1,
        explanation: "Los targets deben expresar sólo diferencias reales; duplicar recursos permite que el DAG diverja.",
        domain: "Deployment · environment promotion",
      },
      {
        question: "¿Qué identidad debe ejecutar un job productivo aunque un ingeniero lance el despliegue?",
        options: [
          "El último usuario que editó el YAML.",
          "Un administrador de cuenta compartido.",
          "Un service principal estable definido mediante `run_as`.",
          "Cualquier usuario con CAN VIEW.",
        ],
        answer: 2,
        explanation: "Separar deploy y ejecución estabiliza permisos, ownership y continuidad operativa.",
        domain: "Deployment · identity",
      },
      {
        question: "Desplegar la versión anterior del bundle después de un `MERGE` defectuoso, ¿qué garantiza?",
        options: [
          "Restaura automáticamente la tabla con time travel.",
          "Elimina todos los runs fallidos.",
          "Revoca las credenciales del CI.",
          "Restaura configuración/código declarado, pero no revierte por sí solo datos escritos.",
        ],
        answer: 3,
        explanation: "El rollback del deployment y el rollback o reparación de datos son problemas distintos.",
        domain: "Deployment · rollback",
      },
    ],
    sources: [
      { label: "What are Declarative Automation Bundles?", href: "https://docs.databricks.com/aws/en/dev-tools/bundles/", reviewedAt },
      { label: "Bundle command group", href: "https://docs.databricks.com/aws/en/dev-tools/cli/bundle-commands", reviewedAt },
      { label: "Declarative Automation Bundles resources", href: "https://docs.databricks.com/aws/en/dev-tools/bundles/resources", reviewedAt },
    ],
  },

  m30: {
    lessons: [
      {
        summary: "Construye acceso base con ownership, grupos y herencia de privilegios, evitando grants directos a personas y propietarios operativos ambiguos.",
        deepDive: advancedDeepDives.m30_1,
        explanation: [
          "Unity Catalog evalúa privilegios en una jerarquía. Para consultar una tabla suelen intervenir `USE CATALOG`, `USE SCHEMA` y `SELECT`; los grants sobre catálogo o esquema pueden heredarse por descendientes según el modelo de privilegios. Ownership concede capacidades amplias, mientras `MANAGE` permite administrar permisos sin transferir propiedad en los objetos compatibles.",
          "Asigna privilegios a grupos de cuenta y service principals, no a usuarios individuales. Separa productores, consumidores y administradores de políticas. El propietario de un catálogo no debería ser una persona que puede marcharse, sino un grupo gobernado. Usa `SHOW GRANTS` e information schema para revisar acceso efectivo antes de añadir otro grant aparentemente necesario.",
        ],
        keyPoints: [
          "Concede a grupos y hereda desde el nivel más estable y limitado.",
          "Ownership no es el mecanismo cotidiano para consumir datos.",
          "Verifica privilegios efectivos y prerequisitos `USE` antes de ampliar acceso.",
        ],
        example: {
          language: "SQL",
          title: "Acceso de sólo lectura por grupo",
          code: `GRANT USE CATALOG ON CATALOG prod TO finance_analysts;
GRANT USE SCHEMA ON SCHEMA prod.gold TO finance_analysts;
GRANT SELECT ON TABLE prod.gold.daily_margin TO finance_analysts;

SHOW GRANTS ON TABLE prod.gold.daily_margin;`,
          note: "Si todo el esquema comparte el mismo contrato, evalúa un grant en esquema; no amplíes más de lo que el grupo necesita.",
        },
        pitfalls: [
          "Conceder `ALL PRIVILEGES` a usuarios para resolver un `USE SCHEMA` ausente.",
          "Dejar catálogos productivos propiedad de una cuenta personal.",
        ],
        examDecision: "Soluciona primero la cadena de `USE` y el privilegio mínimo sobre el objeto; usa grupos y ownership operativo estable.",
        checkpoint: {
          question: "Un grupo tiene `SELECT` sobre una tabla pero no puede consultarla. ¿Qué privilegios de navegación revisarías?",
          answer: "`USE CATALOG` en el catálogo y `USE SCHEMA` en el esquema que contiene la tabla.",
        },
      },
      {
        summary: "Escala protección con governed tags y ABAC para que nuevos objetos clasificados reciban políticas sin grants o masks manuales por tabla.",
        deepDive: advancedDeepDives.m30_2,
        explanation: [
          "Governed tags son etiquetas de cuenta con valores permitidos y permisos de asignación. Heredan desde catálogo y esquema a objetos descendientes, salvo reglas específicas como columnas. ABAC evalúa esos atributos y aplica políticas de row filter o column mask en el ámbito definido. Así el equipo de gobierno escribe una política y los data stewards clasifican objetos sin poder desactivar la protección.",
          "ABAC requiere compute compatible y governed tags, no etiquetas libres. Cambios de tag pueden tardar unos minutos en aplicarse. Diseña taxonomías pequeñas —clasificación, región, dominio— y evita PII en valores de tag porque pueden replicarse globalmente. Prueba conflictos: si varias políticas distintas aplican al mismo usuario/objeto, el acceso puede bloquearse de forma segura.",
        ],
        keyPoints: [
          "Los tags gobernados controlan valores y quién puede asignarlos.",
          "ABAC separa autores de política de propietarios de tablas.",
          "Prueba compatibilidad de compute, herencia y conflictos de políticas.",
        ],
        example: {
          language: "SQL",
          title: "Clasificar una tabla con tags gobernados",
          code: `ALTER TABLE prod.hr.employees
SET TAGS (
  'data_classification' = 'restricted',
  'data_region' = 'eu'
);

SHOW TAGS ON TABLE prod.hr.employees;`,
          note: "Los tags deben existir y el ejecutor necesita permiso ASSIGN; la política ABAC se gestiona por separado en el ámbito del catálogo o esquema.",
        },
        pitfalls: [
          "Crear etiquetas libres con variantes `PII`, `pii` y `personal` y esperar una política coherente.",
          "Guardar nombres de clientes o emails en tags para decidir acceso.",
        ],
        examDecision: "Usa ABAC cuando muchas tablas comparten reglas basadas en clasificación; reserva asignación manual por tabla para excepciones concretas.",
        checkpoint: {
          question: "¿Por qué ABAC escala mejor que una mask configurada manualmente en cada tabla?",
          answer: "La política se aplica automáticamente a objetos que cumplen los tags y protege también nuevas tablas clasificadas sin intervención por objeto.",
        },
      },
      {
        summary: "Aplica row filters y column masks con funciones simples, deterministas y auditables, entendiendo su impacto en optimización e interoperabilidad.",
        deepDive: advancedDeepDives.m30_3,
        explanation: [
          "Un row filter devuelve boolean y elimina filas que el usuario no debe ver; una column mask devuelve el valor original o transformado con un tipo compatible. Pueden asignarse directamente a una tabla mediante UDFs SQL o centralizarse con ABAC. La política se evalúa en query time y la seguridad prima sobre optimizaciones que pudieran filtrar información.",
          "Mantén UDFs simples: evita agregaciones, ventanas y lógica no determinista que limite `MERGE` o pushdown. Prueba cada grupo con usuarios representativos, incluyendo administradores exentos y service principals. Acceso por path y ciertos clientes externos no soportan tablas con políticas; inventaría interoperabilidad y crea una vista o share seguro cuando proceda.",
        ],
        keyPoints: [
          "Row filter controla filas; column mask transforma valores visibles.",
          "El tipo de la mask debe ser compatible con la columna.",
          "Políticas complejas pueden afectar DML, pushdown y clientes externos.",
        ],
        example: {
          language: "SQL",
          title: "Filtro regional y mask de email por tabla",
          code: `CREATE OR REPLACE FUNCTION prod.governance.region_filter(region STRING)
RETURN IF(is_account_group_member('finance_global'), TRUE, region = 'EU');

CREATE OR REPLACE FUNCTION prod.governance.mask_email(email STRING)
RETURN IF(
  is_account_group_member('pii_readers'),
  email,
  CONCAT('***@', element_at(split(email, '@'), -1))
);

ALTER TABLE prod.sales.customers
SET ROW FILTER prod.governance.region_filter ON (region);

ALTER TABLE prod.sales.customers
ALTER COLUMN email SET MASK prod.governance.mask_email;`,
          note: "El filtro fijo a EU es un ejemplo de laboratorio; en producción mapea identidad a región mediante una tabla de autorización gobernada.",
        },
        pitfalls: [
          "Implementar una mask que cambia STRING por un tipo incompatible.",
          "Usar una UDF no determinista o con subconsultas complejas y bloquear DML necesario.",
        ],
        examDecision: "Usa funciones simples y centraliza con ABAC a escala; valida DML y clientes compatibles antes de aplicar la política ampliamente.",
        checkpoint: {
          question: "¿Qué ocurre con una fila si el row filter devuelve FALSE?",
          answer: "La fila se excluye del resultado para ese usuario; la tabla base no se modifica.",
        },
      },
      {
        summary: "Demuestra quién hizo qué mediante `system.access.audit` y lineage, manteniendo separación de funciones y acceso restringido a telemetría sensible.",
        deepDive: advancedDeepDives.m30_4,
        explanation: [
          "El audit log system table registra eventos de cuenta y workspace con identidad, servicio, acción, parámetros y respuesta. Consulta cambios de permisos, tags, policies y accesos dentro de la región y retención documentada. Los eventos de creación, modificación y eliminación de políticas ABAC son auditables; una alerta debe filtrar acciones relevantes y enlazar el objeto afectado.",
          "Lineage de Unity Catalog captura lecturas y escrituras a nivel de tabla y columna para interfaces compatibles, y ayuda a analizar impacto de un cambio o flujo de PII. No reemplaza auditoría: lineage explica flujo, audit explica acción/actor. Expón vistas redactadas a seguridad y operaciones; no distribuyas request parameters completos sin evaluar secretos o datos personales.",
        ],
        keyPoints: [
          "Audit responde actor y acción; lineage, procedencia y consumo.",
          "Restringe columnas y filas de telemetría según función.",
          "Alerta sobre cambios de grants, policies, tags y accesos anómalos.",
        ],
        example: {
          language: "SQL",
          title: "Auditar cambios de permisos y políticas",
          code: `SELECT
  event_time,
  user_identity.email AS actor,
  service_name,
  action_name,
  request_params,
  response.status_code AS status_code
FROM system.access.audit
WHERE event_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (
    lower(action_name) LIKE '%grant%'
    OR lower(action_name) LIKE '%policy%'
    OR lower(action_name) LIKE '%tag%'
  )
ORDER BY event_time DESC;`,
          note: "Valida los action names reales de tu cuenta y limita la vista; `request_params` puede contener información que no necesita todo el equipo.",
        },
        pitfalls: [
          "Conceder acceso al audit log completo a quienes sólo investigan un catálogo.",
          "Interpretar ausencia de lineage de una API no soportada como prueba de que no hubo acceso.",
        ],
        examDecision: "Para investigar permisos usa audit; para impacto upstream/downstream usa lineage; combina ambos sin ampliar acceso innecesariamente.",
        checkpoint: {
          question: "¿Qué fuente usarías para saber quién revocó un grant y cuál para descubrir dashboards afectados?",
          answer: "`system.access.audit` para actor/acción y Unity Catalog lineage para consumidores downstream.",
        },
      },
      {
        summary: "Integra privacidad con clasificación, minimización, workspace bindings, retención y pruebas de acceso negativas.",
        deepDive: advancedDeepDives.m30_5,
        explanation: [
          "Privacidad no se limita a una mask. Clasifica datos, minimiza columnas, limita retención y separa ambientes. Workspace bindings restringen desde qué workspaces pueden usarse catálogos, external locations o storage credentials; combinados con grants y ABAC reducen el radio de exposición. Las tablas administradas permiten a Unity Catalog controlar también el ciclo de vida de almacenamiento.",
          "Prueba políticas desde tres perspectivas: usuario autorizado ve original, usuario restringido ve mask/filtro y principal no autorizado recibe denegación. Añade pruebas de path bypass, clones, time travel y shares según las limitaciones actuales. Cuando se comparte fuera, publica una vista/tabla derivada con minimización y contrato, no la tabla sensible por comodidad.",
        ],
        keyPoints: [
          "Combina clasificación, mínimo privilegio, bindings y ciclo de vida.",
          "Incluye pruebas negativas y de bypass en cada release de política.",
          "Comparte productos minimizados en lugar de exponer fuentes sensibles.",
        ],
        example: {
          language: "SQL",
          title: "Vista minimizada para consumo analítico",
          code: `CREATE OR REPLACE VIEW prod.analytics.customer_activity_safe AS
SELECT
  sha2(CAST(customer_id AS STRING), 256) AS customer_key,
  region,
  DATE_TRUNC('month', last_order_at) AS activity_month,
  order_count_12m
FROM prod.sales.customers
WHERE consent_analytics = TRUE;

GRANT SELECT ON VIEW prod.analytics.customer_activity_safe
TO marketing_analysts;`,
          note: "Hashing no es anonimización automática; evalúa reidentificación, salt/gestión de claves y necesidad real de cada atributo.",
        },
        pitfalls: [
          "Creer que una mask sustituye consentimiento, retención y minimización.",
          "Probar sólo con un administrador y no verificar la experiencia del usuario restringido.",
        ],
        examDecision: "Diseña defensa en profundidad y prueba allow/deny; una política correcta incluye también rutas, workspaces y activos compartidos.",
        checkpoint: {
          question: "¿Qué añade un workspace binding a un grant de Unity Catalog?",
          answer: "Limita desde qué workspaces puede accederse al objeto, reduciendo el ámbito aunque el principal tenga privilegios.",
        },
      },
    ],
    lab: {
      title: "Control fino de clientes por región y sensibilidad",
      goal: "Implementar un piloto de filtro/mask, tags gobernados y auditoría con pruebas positivas y negativas.",
      scenario: "Analistas regionales necesitan ventas de su región, el grupo `pii_readers` puede ver email completo y seguridad necesita auditar cambios. La tabla `prod.sales.customers` contiene EU/US y hoy todos los analistas tienen SELECT directo sin filtro.",
      steps: [
        "Define grupos, owner operativo y matriz de privilegios mínimos, incluidos `USE`.",
        "Clasifica tabla/columnas con governed tags y documenta la política ABAC objetivo.",
        "Crea UDFs simples y aplica un row filter regional y column mask de email como piloto controlado.",
        "Prueba usuario global, usuario restringido y principal sin acceso; valida también DML requerido.",
        "Crea una vista de audit log restringida para cambios de grants, masks y tags.",
        "Documenta migración del piloto por tabla a ABAC central antes de ampliar cobertura.",
      ],
      starterCode: `-- 1. Crea funciones region_filter y mask_email.
-- 2. Asócialas a prod.sales.customers.
-- 3. Consulta system.access.audit para cambios de política.

SHOW GRANTS ON TABLE prod.sales.customers;`,
      solution: `CREATE OR REPLACE FUNCTION prod.governance.region_filter(region STRING)
RETURN IF(is_account_group_member('finance_global'), TRUE, region = 'EU');

CREATE OR REPLACE FUNCTION prod.governance.mask_email(email STRING)
RETURN IF(
  is_account_group_member('pii_readers'),
  email,
  CONCAT('***@', element_at(split(email, '@'), -1))
);

ALTER TABLE prod.sales.customers
SET TAGS ('data_classification' = 'restricted');

ALTER TABLE prod.sales.customers
SET ROW FILTER prod.governance.region_filter ON (region);

ALTER TABLE prod.sales.customers
ALTER COLUMN email SET MASK prod.governance.mask_email;

SELECT event_time, user_identity.email, action_name, request_params
FROM system.access.audit
WHERE event_time >= current_timestamp() - INTERVAL 24 HOURS
  AND (lower(action_name) LIKE '%grant%'
       OR lower(action_name) LIKE '%tag%'
       OR lower(action_name) LIKE '%mask%');`,
      checks: [
        { label: "Clasifica con tag gobernado", pattern: "data_classification" },
        { label: "Aplica row filter", pattern: "SET ROW FILTER" },
        { label: "Aplica column mask", pattern: "SET MASK" },
        { label: "Consulta auditoría", pattern: "system\\.access\\.audit" },
      ],
      expectedEvidence: [
        "Matriz de acceso y resultados de pruebas allow, masked/filtered y deny.",
        "Salida de `SHOW GRANTS` y tags sin PII.",
        "Vista/eventos de auditoría y evaluación de compatibilidad con DML y consumidores externos.",
      ],
      cloudNotes: {
        AWS: "Sincroniza grupos desde tu IdP/IAM Identity Center y gobierna storage credentials sobre S3; ABAC de Unity Catalog no reemplaza políticas IAM de mínimo privilegio.",
        Azure: "Usa grupos de Microsoft Entra ID y managed identities/service principals para ADLS; valida que workspace bindings y RBAC cloud no abran una ruta alternativa.",
        GCP: "Sincroniza grupos del proveedor de identidad y limita service accounts/storage credentials sobre GCS; las IAM policies cloud y Unity Catalog deben ser coherentes.",
      },
    },
    quiz: [
      {
        question: "Un grupo tiene `SELECT` en una tabla pero recibe un error de acceso al resolver el nombre. ¿Qué revisar primero?",
        options: [
          "`USE CATALOG` y `USE SCHEMA`.",
          "Photon en el warehouse.",
          "Deletion vectors.",
          "El número de workers.",
        ],
        answer: 0,
        explanation: "La navegación por catálogo y esquema es prerequisito habitual aunque exista SELECT en el objeto.",
        domain: "Data governance · privileges",
      },
      {
        question: "Cientos de tablas nuevas con tag `restricted` deben recibir la misma mask. ¿Qué opción escala mejor?",
        options: [
          "Un grant manual a cada owner.",
          "Una vista diferente creada por cada analista.",
          "Una política ABAC basada en governed tags en catálogo o esquema.",
          "Copiar la UDF a cada notebook.",
        ],
        answer: 2,
        explanation: "ABAC separa clasificación y política y cubre automáticamente objetos que cumplen el atributo.",
        domain: "Data governance · ABAC",
      },
      {
        question: "¿Qué combinación responde mejor a 'quién cambió un grant y qué dashboards dependen de la tabla'?",
        options: [
          "Sólo `DESCRIBE DETAIL`.",
          "Audit log para el cambio y lineage para consumidores downstream.",
          "Spark UI y driver logs.",
          "Billing usage y list prices.",
        ],
        answer: 1,
        explanation: "Auditoría registra actor/acción; lineage describe flujo y dependencias.",
        domain: "Data governance · auditing",
      },
      {
        question: "Una column mask devuelve un integer para una columna email STRING. ¿Qué problema existe?",
        options: [
          "Las masks sólo funcionan con números.",
          "Obliga a habilitar liquid clustering.",
          "Concede SELECT al owner automáticamente.",
          "El resultado debe ser compatible con el tipo de la columna protegida.",
        ],
        answer: 3,
        explanation: "La mask debe devolver el mismo tipo o uno castable; de lo contrario la política no es válida/usable.",
        domain: "Data governance · masks",
      },
    ],
    sources: [
      { label: "Access control in Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control", reviewedAt },
      { label: "Attribute-based access control in Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/abac", reviewedAt },
      { label: "Row filters and column masks", href: "https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks/", reviewedAt },
      { label: "Governed tags", href: "https://docs.databricks.com/aws/en/admin/governed-tags", reviewedAt },
    ],
  },

  m31: {
    lessons: [
      {
        summary: "Distingue Databricks-to-Databricks OpenSharing de Open-to-Databricks y elige autenticación OIDC antes que credenciales portables de larga duración.",
        deepDive: advancedDeepDives.m31_1,
        explanation: [
          "OpenSharing es la evolución del intercambio abierto conocido históricamente como Delta Sharing. Entre metastores Databricks, el recipient accede mediante integración nativa y no necesita un fichero de credenciales. Para receptores sin Unity Catalog, el protocolo abierto permite Spark, pandas, Power BI y otros conectores mediante bearer token u OIDC federation.",
          "Los activos se consumen en modo read-only y el proveedor controla qué agrega al share. Prefiere OIDC con tokens cortos cuando el receptor puede federar su identidad; los bearer tokens requieren distribución segura, rotación y revocación. La nube del proveedor y receptor puede diferir, pero egress, ubicación y residencia siguen siendo decisiones de arquitectura.",
        ],
        keyPoints: [
          "Databricks-to-Databricks evita intercambiar ficheros de credenciales.",
          "OIDC reduce riesgo frente a bearer tokens largos.",
          "Compartir es read-only y no copia necesariamente los datos al receptor.",
        ],
        example: {
          language: "SQL",
          title: "Crear un share y añadir una tabla",
          code: `CREATE SHARE IF NOT EXISTS retail_partner;

ALTER SHARE retail_partner
ADD TABLE prod.shared.daily_inventory;

SHOW ALL IN SHARE retail_partner;`,
          note: "Antes de asignar un recipient, revisa columnas, historial compartido, región y contrato de datos.",
        },
        pitfalls: [
          "Enviar un bearer token por correo o guardarlo en un notebook compartido.",
          "Asumir que read-only elimina coste de egress o riesgo de reidentificación.",
        ],
        examDecision: "Usa Databricks-to-Databricks cuando ambos lados tienen UC; para clientes abiertos, prefiere OIDC y gobierna ciclo de vida del recipient.",
        checkpoint: {
          question: "¿Qué ventaja de seguridad ofrece OIDC frente a un bearer token duradero?",
          answer: "Intercambia identidad federada por credenciales OAuth de corta duración, reduciendo distribución y exposición de secretos persistentes.",
        },
      },
      {
        summary: "Publica un producto de datos mínimo mediante shares, views y recipients con ownership, contrato y revocación ensayada.",
        deepDive: advancedDeepDives.m31_2,
        explanation: [
          "El proveedor crea un share, añade tablas, vistas u otros activos compatibles y concede acceso a un recipient. Una vista compartida puede minimizar columnas y filtrar datos según contrato, pero sus capacidades y coste dependen del modelo de sharing. El owner del share debe ser un grupo operativo y los cambios deben pasar revisión igual que un API público.",
          "Versiona esquema y comunica breaking changes. Monitoriza accesos, establece fecha de expiración del acuerdo y prueba revocación. No compartas la tabla bronze por conveniencia: crea una capa estable, documentada y sin campos internos. Si el receptor necesita escribir o transformar en origen, sharing no satisface ese requisito read-only.",
        ],
        keyPoints: [
          "Comparte un contrato estable, no una tabla interna mutable.",
          "Ownership y revocación forman parte del producto.",
          "Read-only no cubre casos que requieren escritura remota.",
        ],
        example: {
          language: "SQL",
          title: "Vista minimizada para un partner",
          code: `CREATE OR REPLACE VIEW prod.shared.partner_inventory AS
SELECT
  sku,
  DATE_TRUNC('day', snapshot_ts) AS snapshot_date,
  region,
  available_units
FROM prod.gold.inventory
WHERE partner_visible = TRUE;

ALTER SHARE retail_partner
ADD VIEW prod.shared.partner_inventory;`,
          note: "Comprueba requisitos actuales para compartir vistas y quién paga el compute asociado; prueba el resultado como recipient.",
        },
        pitfalls: [
          "Compartir campos internos y confiar en que el receptor no los use.",
          "Cambiar nombres/tipos sin versión ni aviso porque el share sigue siendo accesible.",
        ],
        examDecision: "Expón una vista o tabla de producto minimizada y versionada; sharing es un contrato externo, no un atajo a silver/bronze.",
        checkpoint: {
          question: "¿Por qué conviene compartir una vista estable en lugar de la tabla operacional?",
          answer: "Permite minimizar y desacoplar el contrato externo de columnas y cambios internos.",
        },
      },
      {
        summary: "Gobierna sharing con auditoría, residencia, egress, rotación y compatibilidad de políticas antes de incorporar un consumidor.",
        deepDive: advancedDeepDives.m31_3,
        explanation: [
          "El proveedor conserva el control y puede revocar el recipient o retirar activos. Registra owner, propósito, región, base legal, clasificación, protocolo y método de autenticación. Audita acciones de shares/recipients y accesos según las system tables disponibles. Si usas bearer credentials, almacénalas como secretos, rota con solapamiento y destruye copias antiguas.",
          "Row filters/masks y ABAC tienen limitaciones específicas al compartir; no presupongas que una política aplicada a la fuente se reproduce igual en el receptor. Prueba el share con una identidad real del recipient. Modela egress cloud y foreign compute en el coste, especialmente para vistas, materialized views, streaming tables o datos federados.",
        ],
        keyPoints: [
          "Prueba la experiencia y restricciones desde el lado receptor.",
          "Incluye egress, compute y fuente remota en FinOps del share.",
          "Ensaya rotación y revocación antes del incidente.",
        ],
        example: {
          language: "SQL",
          title: "Inventario de objetos compartidos",
          code: `SHOW SHARES;
SHOW RECIPIENTS;
SHOW ALL IN SHARE retail_partner;

-- Conserva la salida con owner, propósito y fecha de revisión
-- en una tabla de control gobernada, no en una hoja personal.`,
          note: "Complementa el inventario con audit logs y el contrato del recipient; `SHOW` por sí solo no describe la base legal ni el coste.",
        },
        pitfalls: [
          "Suponer que una mask de la tabla base siempre se conserva igual en OpenSharing.",
          "Crear recipients sin owner o fecha de revisión y acumular acceso huérfano.",
        ],
        examDecision: "Antes de compartir, valida política efectiva, residencia, autenticación y coste desde el receptor; después monitoriza y recertifica.",
        checkpoint: {
          question: "¿Qué prueba demuestra mejor que una revocación funciona?",
          answer: "Revocar en un entorno controlado y comprobar desde la identidad del recipient que ya no puede enumerar o consultar el activo.",
        },
      },
      {
        summary: "Diferencia query federation de catalog federation y entiende dónde se ejecuta cada parte, qué se empuja y por qué ambas son read-only.",
        deepDive: advancedDeepDives.m31_4,
        explanation: [
          "Lakehouse Federation ofrece acceso gobernado mediante foreign catalogs. Query federation conecta bases relacionales por JDBC: Databricks empuja filtros/agregaciones compatibles y parte de la consulta se ejecuta en el sistema remoto. Catalog federation conecta catálogos externos como Hive Metastore, AWS Glue o plataformas compatibles y Databricks lee datos del object storage con su propio compute.",
          "Ambas rutas son read-only y sirven exploración, BI o migración gradual, no sustituyen una ingesta para cargas intensivas repetidas. Comprueba pushdown con `EXPLAIN`, latencia de red, límites del origen y concurrencia. Una consulta que extrae millones de filas sin filtro puede saturar la base operacional aunque el warehouse Databricks tenga capacidad.",
        ],
        keyPoints: [
          "Query federation usa JDBC y compute remoto con pushdown.",
          "Catalog federation lee object storage usando compute Databricks.",
          "Para transformación frecuente o escritura, ingiere y materializa en lakehouse.",
        ],
        example: {
          language: "SQL",
          title: "Crear un foreign catalog sobre una conexión existente",
          code: `CREATE FOREIGN CATALOG finance_postgres
USING CONNECTION finance_pg
OPTIONS (database 'finance');

EXPLAIN FORMATTED
SELECT region, SUM(amount) AS revenue
FROM finance_postgres.public.invoices
WHERE invoice_date >= current_date() - INTERVAL 7 DAYS
GROUP BY region;`,
          note: "La conexión debe usar secretos y red privada/permitida; revisa el plan para verificar qué predicados se empujan.",
        },
        pitfalls: [
          "Tratar un foreign catalog como destino escribible de ETL.",
          "Lanzar scans completos contra una base OLTP en horario de máxima carga.",
        ],
        examDecision: "Usa federation para acceso read-only y exploratorio con pushdown; ingiere cuando el uso es repetitivo, intensivo, transformacional o necesita SLA independiente.",
        checkpoint: {
          question: "¿Dónde se ejecuta una consulta de query federation?",
          answer: "Parte en Databricks y parte en la base remota mediante pushdown JDBC, según operaciones soportadas.",
        },
      },
      {
        summary: "Selecciona sharing, federation o ingestión comparando dirección, frecuencia, frescura, escritura, gobierno, coste y aislamiento operacional.",
        deepDive: advancedDeepDives.m31_5,
        explanation: [
          "Sharing publica un producto gobernado hacia consumidores externos; federation consulta una fuente externa in situ; ingestión copia cambios al lakehouse para transformación y SLA propios. Si un partner necesita leer una tabla curada, sharing evita una exportación. Si un analista explora PostgreSQL unas veces, federation reduce time-to-value. Si cientos de jobs agregan esa base cada hora, ingiere incrementalmente.",
          "Interoperabilidad no elimina contratos. Documenta tipos, time zones, semántica de deletes, límites y ownership. Considera Iceberg REST Catalog u otros protocolos cuando clientes externos deban leer tablas gobernadas directamente, siempre contrastando soporte de features Delta/ABAC. Diseña una salida: cómo revocar, materializar o migrar sin romper consumidores.",
        ],
        keyPoints: [
          "Sharing sirve publicación; federation, consulta in situ; ingestión, procesamiento controlado.",
          "La frecuencia y carga sobre el origen suelen decidir entre federation e ingesta.",
          "Cada patrón necesita contrato, owner, coste y estrategia de salida.",
        ],
        example: {
          language: "JSON",
          title: "Matriz de decisión de interoperabilidad",
          code: `{
  "use_case": "partner_inventory_daily",
  "direction": "outbound",
  "write_required": false,
  "freshness": "daily",
  "consumer_platform": "non_databricks",
  "classification": "internal",
  "selected_pattern": "open_sharing_oidc",
  "rejected": {
    "federation": "el partner no debe acceder al sistema operacional",
    "file_export": "duplica datos y credenciales"
  }
}`,
          note: "Una decisión útil conserva también el motivo de alternativas rechazadas y la fecha de revisión.",
        },
        pitfalls: [
          "Usar federation para una transformación horaria pesada y trasladar el cuello al OLTP.",
          "Exportar ficheros con credenciales estáticas cuando OpenSharing cubre el contrato.",
        ],
        examDecision: "Elige por dirección y patrón: outbound curado → sharing; lectura ocasional externa → federation; procesamiento recurrente/independiente → ingesta.",
        checkpoint: {
          question: "¿Qué señal indica que una consulta federada debería materializarse por ingesta?",
          answer: "Es frecuente, mueve mucho dato, carga el origen o necesita transformaciones/SLA que no deben depender del sistema remoto.",
        },
      },
    ],
    lab: {
      title: "Producto compartido y acceso federado con límites explícitos",
      goal: "Publicar inventario minimizado a un partner y diseñar una conexión federada segura para conciliación ocasional.",
      scenario: "Un partner sin Databricks necesita inventario diario read-only. Finanzas también consulta PostgreSQL dos veces al mes para conciliación. No se permite exportar CSV ni compartir credenciales permanentes; la base OLTP no debe recibir scans completos.",
      steps: [
        "Crea una vista de inventario con sólo columnas acordadas y contrato de esquema.",
        "Añade la vista a un share y diseña recipient OpenSharing con OIDC, owner y expiración.",
        "Prueba enumeración, lectura y revocación desde el receptor; registra egress y política efectiva.",
        "Define una connection gobernada a PostgreSQL y un foreign catalog sin secretos en código.",
        "Escribe una consulta de conciliación con filtros empujables y límite de ventana.",
        "Documenta cuándo migrar de federation a ingesta incremental.",
      ],
      starterCode: `CREATE SHARE IF NOT EXISTS retail_partner;

-- TODO: crea prod.shared.partner_inventory con datos mínimos.
-- TODO: añade la vista al share y muestra su inventario.
-- La conexión federada se crea con secretos fuera del código.`,
      solution: `CREATE OR REPLACE VIEW prod.shared.partner_inventory AS
SELECT
  sku,
  region,
  DATE_TRUNC('day', snapshot_ts) AS snapshot_date,
  available_units
FROM prod.gold.inventory
WHERE partner_visible = TRUE;

CREATE SHARE IF NOT EXISTS retail_partner;

ALTER SHARE retail_partner
ADD VIEW prod.shared.partner_inventory;

SHOW ALL IN SHARE retail_partner;

-- La conexión finance_pg ya existe y usa secretos gobernados.
CREATE FOREIGN CATALOG IF NOT EXISTS finance_postgres
USING CONNECTION finance_pg
OPTIONS (database 'finance');

SELECT invoice_date, SUM(amount) AS amount
FROM finance_postgres.public.invoices
WHERE invoice_date BETWEEN DATE '2026-07-01' AND DATE '2026-07-31'
GROUP BY invoice_date
ORDER BY invoice_date;`,
      checks: [
        { label: "Crea un producto minimizado", pattern: "partner_inventory" },
        { label: "Añade la vista al share", pattern: "ALTER SHARE retail_partner" },
        { label: "Declara foreign catalog", pattern: "CREATE FOREIGN CATALOG" },
        { label: "Acota la consulta remota", pattern: "BETWEEN DATE '2026-07-01' AND DATE '2026-07-31'" },
      ],
      expectedEvidence: [
        "Contrato del share, owner, recipient OIDC, resultado de lectura y prueba de revocación.",
        "Inventario de objetos compartidos sin columnas internas.",
        "Plan de consulta federada con filtro empujado y umbral documentado para migrar a ingesta.",
      ],
      cloudNotes: {
        AWS: "Calcula egress de S3 si el receptor está en otra región/nube y usa PrivateLink/VPC connectivity para la base federada cuando esté soportado; secretos en Unity Catalog connection.",
        Azure: "Evalúa egress de ADLS y residencia entre regiones; conecta Azure Database mediante red privada/allowlist adecuada y secretos gobernados, no en SQL versionado.",
        GCP: "Incluye egress de GCS y ubicación del recipient; para Cloud SQL usa conectividad permitida y una service account/secretos de mínimo privilegio.",
      },
    },
    quiz: [
      {
        question: "Dos organizaciones usan workspaces Unity Catalog. ¿Qué modelo evita intercambiar un fichero de credenciales?",
        options: [
          "Databricks-to-Databricks OpenSharing.",
          "Un export CSV a object storage público.",
          "Un bearer token compartido en chat.",
          "Query federation desde el receptor al metastore interno.",
        ],
        answer: 0,
        explanation: "La integración nativa entre metastores usa identidad de plataforma y no requiere el credential file del modelo abierto.",
        domain: "Data sharing · authentication",
      },
      {
        question: "Una base PostgreSQL se consulta de forma exploratoria y read-only con filtros selectivos. ¿Qué opción reduce tiempo de ingestión inicial?",
        options: [
          "Un backfill completo diario.",
          "OpenSharing outbound.",
          "Lakehouse query federation mediante foreign catalog.",
          "Copiar manualmente dumps a DBFS root.",
        ],
        answer: 2,
        explanation: "Federation ofrece acceso gobernado in situ y pushdown sin migrar primero los datos.",
        domain: "Interoperability · federation",
      },
      {
        question: "¿Cuándo conviene sustituir federation por ingesta incremental?",
        options: [
          "Cuando la consulta es mensual y filtra una fila.",
          "Cuando cargas frecuentes e intensivas afectan al origen y necesitan SLA propio.",
          "Cuando el catálogo se llama `foreign`.",
          "Siempre que el receptor use SQL.",
        ],
        answer: 1,
        explanation: "La materialización desacopla rendimiento y disponibilidad de una fuente remota sometida a carga repetida.",
        domain: "Interoperability · architecture",
      },
      {
        question: "Un partner no Databricks puede federar su IdP. ¿Qué autenticación es preferible para OpenSharing?",
        options: [
          "Una contraseña incluida en el nombre del share.",
          "Un PAT de administrador sin caducidad.",
          "Un bearer token publicado en Git.",
          "OIDC con intercambio por tokens OAuth de corta duración.",
        ],
        answer: 3,
        explanation: "OIDC evita distribuir una credencial portable de larga duración y facilita ciclo de vida centralizado.",
        domain: "Data sharing · security",
      },
    ],
    sources: [
      { label: "What is OpenSharing?", href: "https://docs.databricks.com/aws/en/opensharing", reviewedAt },
      { label: "Share data and AI assets securely", href: "https://docs.databricks.com/aws/en/data-sharing", reviewedAt },
      { label: "Connect to external databases and catalogs", href: "https://docs.databricks.com/aws/en/query-federation/", reviewedAt },
      { label: "What is query federation?", href: "https://docs.databricks.com/aws/en/query-federation/database-federation", reviewedAt },
    ],
  },

  m32: {
    lessons: [
      {
        summary: "Convierte requisitos ambiguos en una arquitectura defendible con SLO, contratos, ownership y trazabilidad hacia dominios Professional.",
        deepDive: advancedDeepDives.m32_1,
        explanation: [
          "El proyecto final comienza con decisiones, no productos. Define volumen, latencia, freshness, calidad, retención, RPO/RTO, consumidores, clasificación, regiones y presupuesto. Después asigna cada requisito a una capacidad: Auto Loader/Lakeflow Connect para ingesta, pipelines declarativos para transformación, Jobs para orquestación, Unity Catalog para gobierno y system tables para operación.",
          "Documenta alternativas rechazadas y condiciones de cambio. Una arquitectura Professional no es la que usa más servicios, sino la que minimiza estados y responsabilidades ambiguas. Cada tabla, checkpoint, job, policy y alerta tiene owner; cada SLO tiene una señal medible y un runbook. Mapea además evidencias a los dominios del blueprint sin convertirlo en memorización.",
        ],
        keyPoints: [
          "Requisitos cuantificados preceden a la selección de servicios.",
          "Cada componente necesita estado, owner, SLO y estrategia de recuperación.",
          "Registra alternativas y triggers que obligarían a revisar la decisión.",
        ],
        example: {
          language: "YAML",
          title: "Contrato de arquitectura y SLO",
          code: `product: commerce-orders
owners:
  product: commerce-analytics
  platform: data-platform
slos:
  freshness_minutes: 15
  completeness_percent: 99.95
  p95_pipeline_minutes: 12
recovery:
  rpo_minutes: 15
  rto_minutes: 60
governance:
  classification: confidential
  regions: [eu-west, us-east]
finops:
  monthly_budget_eur: 18000`,
          note: "Cada valor debe enlazar a una medición y una respuesta; un SLO sin observabilidad es sólo una aspiración.",
        },
        pitfalls: [
          "Elegir componentes antes de aclarar latencia, volumen y ownership.",
          "Confundir alta disponibilidad de la plataforma con idempotencia y recuperación de la aplicación.",
        ],
        examDecision: "Ante un escenario complejo, identifica primero requisito dominante y estado que debe protegerse; sólo después selecciona el componente.",
        checkpoint: {
          question: "¿Qué convierte un requisito 'casi en tiempo real' en una decisión arquitectónica comprobable?",
          answer: "Un SLO de freshness cuantificado, su señal, ventana de medición y respuesta al incumplimiento.",
        },
      },
      {
        summary: "Diseña un flujo end-to-end idempotente desde ingestión y CDC hasta modelos curados, con backfill y evolución de esquema ensayados.",
        deepDive: advancedDeepDives.m32_2,
        explanation: [
          "La ingesta incremental conserva progreso mediante checkpoint o estado del conector; bronze retiene hechos crudos suficientes para replay; silver aplica contratos, deduplicación y CDC; gold sirve modelos de consumo. Cada escritura usa una clave de negocio y semántica de retry conocida. Los datos tardíos, deletes y cambios de esquema tienen una política explícita, no un comportamiento accidental.",
          "Prueba replay y backfill antes de producción. Un pipeline vivo y un backfill no deben competir por el mismo rango sin coordinación. Usa `MERGE` o la API actual `AUTO CDC` —`APPLY CHANGES` en código legado— según la herramienta y orden de secuencia, conserva cuarentena para incumplimientos y reconcilia conteos/importe entre capas. Versiona cambios incompatibles del contrato.",
        ],
        keyPoints: [
          "Checkpoint más bronze reproducible permiten recuperación sin volver al origen cuando la retención lo permite.",
          "CDC necesita clave, secuencia y semántica de deletes.",
          "Backfill se diseña y prueba como un modo operativo de primera clase.",
        ],
        example: {
          language: "SQL",
          title: "MERGE idempotente de pedidos CDC",
          code: `MERGE INTO prod.silver.orders AS target
USING staging.orders_cdc AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.op = 'DELETE' THEN DELETE
WHEN MATCHED AND source.sequence_ts > target.sequence_ts THEN UPDATE SET *
WHEN NOT MATCHED AND source.op <> 'DELETE' THEN INSERT *;`,
          note: "Deduplica previamente múltiples eventos por clave/secuencia y define qué hacer con eventos fuera de orden.",
        },
        pitfalls: [
          "Borrar checkpoint para forzar un replay sin comprobar retención y side effects.",
          "Aplicar CDC sin una secuencia determinista y sobrescribir un estado nuevo con un evento tardío.",
        ],
        examDecision: "Para CDC, exige clave y orden; para recovery, preserva bronze/checkpoint y ejecuta backfills acotados e idempotentes.",
        checkpoint: {
          question: "¿Qué tres elementos mínimos necesita un CDC determinista?",
          answer: "Clave de negocio, columna/criterio de secuencia y semántica explícita para inserts, updates y deletes.",
        },
      },
      {
        summary: "Opera el producto con expectations, event logs, system tables, lineage, alertas y runbooks que cubran datos y plataforma.",
        deepDive: advancedDeepDives.m32_3,
        explanation: [
          "La observabilidad se diseña en capas: freshness y completitud del producto, calidad de registros, estado/duración/retries del pipeline, perfiles de consulta y coste. Expectations pueden fallar, descartar o registrar según severidad; event logs de pipelines explican updates y calidad; system tables agregan jobs, queries, billing, audit y lineage.",
          "Una alerta debe ser accionable: incluye umbral, ventana, owner, contexto y enlace al runbook. Evita alert fatigue agrupando síntomas del mismo fallo. En recuperación, valida downstream y no sólo el run. Usa lineage para impacto, audit para actor/cambio y Query Profile/Spark UI para rendimiento. Ensaya RTO con game days.",
        ],
        keyPoints: [
          "Mide producto, datos, ejecución y coste por separado.",
          "Cada alerta conduce a una decisión concreta y un owner.",
          "Prueba recovery y RTO; no confíes sólo en documentación.",
        ],
        example: {
          language: "SQL",
          title: "Indicador de freshness consumible por alertas",
          code: `CREATE OR REPLACE VIEW ops.slo.orders_freshness AS
SELECT
  MAX(processed_at) AS last_processed_at,
  TIMESTAMPDIFF(MINUTE, MAX(processed_at), current_timestamp()) AS freshness_minutes,
  CASE
    WHEN TIMESTAMPDIFF(MINUTE, MAX(processed_at), current_timestamp()) <= 15
      THEN 'OK'
    ELSE 'BREACH'
  END AS slo_state
FROM prod.silver.orders;`,
          note: "Distingue ausencia legítima de eventos de pipeline detenido; combina freshness con señal del origen y calendario de negocio.",
        },
        pitfalls: [
          "Alertar por cada tarea fallida aunque el retry automático recupere dentro del SLO.",
          "Declarar recuperación al ver un run verde sin medir freshness, duplicados y consumidores.",
        ],
        examDecision: "Elige la señal que representa impacto al consumidor y enlázala con telemetría técnica para diagnóstico; no alertes sólo por ruido interno.",
        checkpoint: {
          question: "¿Qué diferencia una métrica de producto de una métrica de ejecución?",
          answer: "La primera mide el resultado para el consumidor —por ejemplo freshness—; la segunda describe el mecanismo —duración, estado o retries del job—.",
        },
      },
      {
        summary: "Integra seguridad, privacidad y FinOps en el diseño: identidades de servicio, ABAC, datos minimizados y coste por unidad de valor.",
        deepDive: advancedDeepDives.m32_4,
        explanation: [
          "Cada job ejecuta como service principal con privilegios mínimos; CI despliega con otra identidad. Unity Catalog aporta grupos, grants, governed tags, ABAC, masks y audit. Clasifica antes de compartir y restringe workspaces/locations. Los secretos se referencian desde scopes o mecanismos administrados, nunca desde notebooks, tags o YAML versionado.",
          "El coste se atribuye mediante tags/policies y `system.billing.usage`; compara coste por millón de pedidos y por SLO cumplido. Serverless reduce gestión, pero no elimina consultas ineficientes. Predictive optimization, Photon y liquid clustering se habilitan donde el workload lo justifica y se validan con perfiles. El presupuesto incluye reintentos, backfills, egress y sharing/federation.",
        ],
        keyPoints: [
          "Separa identidad de deploy, run y consumo humano.",
          "La clasificación dirige policies y sharing minimizado.",
          "Optimiza coste por resultado, no sólo consumo bruto.",
        ],
        example: {
          language: "SQL",
          title: "Coste operativo atribuido por producto",
          code: `SELECT
  usage_date,
  custom_tags['data_product'] AS data_product,
  billing_origin_product,
  sku_name,
  SUM(usage_quantity) AS usage_quantity
FROM system.billing.usage
WHERE usage_date >= current_date() - INTERVAL 30 DAYS
  AND custom_tags['data_product'] = 'commerce-orders'
GROUP BY usage_date, custom_tags['data_product'],
         billing_origin_product, sku_name
ORDER BY usage_date DESC;`,
          note: "Une precios efectivos y una métrica de pedidos procesados para convertir consumo en coste unitario.",
        },
        pitfalls: [
          "Ejecutar CI y producción con el mismo principal administrador.",
          "Aplicar una mask a la tabla pero compartir una copia sin esa protección.",
        ],
        examDecision: "Diseña identidad y política junto al dato; FinOps y seguridad son requisitos de arquitectura, no tareas posteriores al go-live.",
        checkpoint: {
          question: "¿Por qué conviene separar service principal de CI y de ejecución?",
          answer: "CI necesita gestionar recursos; el workload sólo necesita ejecutar y acceder a datos. Separarlos reduce privilegios y mejora auditoría.",
        },
      },
      {
        summary: "Resuelve el simulacro Professional como una revisión de decisiones: identifica requisito, descarta absolutismos y justifica con señales observables.",
        deepDive: advancedDeepDives.m32_5,
        explanation: [
          "Las preguntas originales del simulacro deben ejercitar escenarios, no recordar frases. Lee primero la restricción dominante —SLA, recovery, mínimo privilegio, compatibilidad o coste— y después compara opciones. Descarta respuestas irreversibles, manuales o que eliminan estado sin diagnóstico. Cuando dos alternativas son técnicamente posibles, elige la que satisface requisitos con menor operación y mejor evidencia.",
          "Tras cada intento, agrupa errores por dominio y por tipo de razonamiento: confundir mitigación con solución, escalar antes de diagnosticar, ignorar idempotencia o ampliar permisos. Vuelve a los módulos y reproduce la decisión en un lab. El 80 % interno sólo señala preparación; no es nota oficial ni garantiza el examen. No uses dumps ni preguntas reales.",
        ],
        keyPoints: [
          "Extrae requisito y estado antes de leer las opciones como recetas.",
          "Prefiere decisiones reversibles, gestionadas y observables.",
          "Convierte errores del simulacro en prácticas dirigidas por dominio.",
        ],
        example: {
          language: "YAML",
          title: "Registro de revisión del simulacro",
          code: `attempt: professional-02
score_percent: 78
weak_domains:
  - performance_diagnosis
  - unity_catalog_abac
reasoning_errors:
  - "escalé antes de localizar el stage crítico"
  - "confundí SELECT con la cadena USE CATALOG/USE SCHEMA"
next_actions:
  - module: 23
    evidence: "comparar max/mediana por task en un join sesgado"
  - module: 30
    evidence: "probar allow, mask y deny con tres identidades"`,
          note: "Registra categorías y evidencia, no el texto de preguntas reales de certificación.",
        },
        pitfalls: [
          "Memorizar que una opción suele ser correcta por contener una palabra de producto.",
          "Repetir inmediatamente el mismo intento hasta recordar posiciones de respuestas.",
        ],
        examDecision: "Elige la opción que satisface la restricción con operación mínima y evidencia; evita absolutos como borrar, conceder todo o escalar siempre.",
        checkpoint: {
          question: "¿Qué revisión aporta más valor que repetir de inmediato el simulacro?",
          answer: "Clasificar el error de razonamiento, volver al dominio débil y producir una evidencia práctica antes del siguiente intento.",
        },
      },
    ],
    lab: {
      title: "Capstone Professional: comercio omnicanal gobernado",
      goal: "Entregar una arquitectura implementable con SLO, CDC, despliegue, observabilidad, seguridad, FinOps y recuperación demostrables.",
      scenario: "Una empresa ingiere pedidos CDC desde PostgreSQL y eventos de clickstream. Necesita silver en 15 minutos, gold horario, EU/US aislados, backfill de 90 días, compartir inventario con un partner y reducir coste 20 % sin empeorar el SLA. El equipo exige promoción dev/test/prod y RTO de 60 minutos.",
      steps: [
        "Especifica contratos, SLO, RPO/RTO, clasificación, ownership, regiones y presupuesto.",
        "Diseña ingesta CDC/eventos, bronze replayable, silver idempotente y gold dimensional con política de late data.",
        "Define Jobs/pipelines, targets Bundle, service principals y pruebas unitarias/integración.",
        "Diseña grants/ABAC, masks, workspace bindings y un producto OpenSharing minimizado.",
        "Crea métricas de freshness, calidad, p95, retries, coste unitario y alertas con runbook.",
        "Ejecuta tabletop de fallo y backfill; demuestra RTO, reconciliación y rollback.",
      ],
      starterCode: `product: commerce-orders
requirements:
  freshness_minutes: 15
  rpo_minutes: 15
  rto_minutes: 60
  backfill_days: 90

# Completa las secciones: architecture, data_contracts, delivery,
# governance, observability, finops, recovery y acceptance_evidence.`,
      solution: `product: commerce-orders
requirements:
  freshness_minutes: 15
  rpo_minutes: 15
  rto_minutes: 60
  backfill_days: 90
architecture:
  orders_cdc: lakeflow_connect
  clickstream: structured_streaming
  bronze: replayable_delta
  silver: keyed_sequence_aware_merge
  gold: hourly_dimensional_models
delivery:
  artifact: python_wheel
  automation: declarative_automation_bundle
  targets: [dev, test, prod]
  run_as: service_principal
governance:
  catalog: unity_catalog
  policy: governed_tags_plus_abac
  pii: column_masks
  partner: open_sharing_oidc_minimized_view
observability:
  product: [freshness, completeness, duplicate_keys]
  execution: [p95_runtime, retries, failed_tasks]
  cost: [cost_per_million_orders, unallocated_usage]
finops:
  serverless_mode: standard_for_scheduled_batch
  table_maintenance: predictive_optimization
  target_reduction_percent: 20
recovery:
  preserve: [checkpoints, bronze, delta_history]
  backfill: isolated_idempotent_range
  validation: [row_reconciliation, amount_reconciliation, downstream_freshness]
acceptance_evidence:
  - two_consecutive_runs_within_slo
  - tested_rto_under_60_minutes
  - zero_duplicate_order_ids
  - prod_bundle_hash_matches_test`,
      checks: [
        { label: "Define SLO y recuperación", pattern: "freshness_minutes:[\\s\\S]*rto_minutes:" },
        { label: "Incluye entrega declarativa", pattern: "declarative_automation_bundle" },
        { label: "Aplica gobierno y sharing", pattern: "governed_tags_plus_abac[\\s\\S]*open_sharing" },
        { label: "Exige evidencia verificable", pattern: "acceptance_evidence" },
      ],
      expectedEvidence: [
        "Diagrama/ADR con alternativas, estados, owners y mapping a requisitos.",
        "Resultados de unit/integration, plan Bundle y hash promovido.",
        "Dashboard SLO/coste y tabletop con RTO, backfill, reconciliación y rollback demostrados.",
      ],
      cloudNotes: {
        AWS: "Usa S3, IAM roles/storage credentials y conectividad privada a RDS/Kafka cuando corresponda; calcula egress del partner y separa regiones EU/US con catálogos/workspaces coherentes.",
        Azure: "Mapea almacenamiento a ADLS Gen2, identidades a Entra/managed identities y orígenes a Azure Database/Event Hubs; valida Private Link, residencia y egress del share.",
        GCP: "Usa GCS, service accounts/storage credentials y conectividad a Cloud SQL/Pub/Sub; respeta regiones del metastore, egress y aislamiento EU/US.",
      },
    },
    quiz: [
      {
        question: "Un requisito dice 'datos casi en tiempo real' sin más detalle. ¿Qué debe hacer primero el arquitecto?",
        options: [
          "Elegir streaming continuo.",
          "Aumentar el número de workers.",
          "Definir freshness SLO, volumen, tolerancia a late data y respuesta al breach.",
          "Crear una tabla particionada por segundo.",
        ],
        answer: 2,
        explanation: "La tecnología se elige después de convertir la ambigüedad en restricciones medibles.",
        domain: "Architecture · requirements",
      },
      {
        question: "Un CDC recibe dos updates fuera de orden para la misma clave. ¿Qué diseño evita que el antiguo sobrescriba al nuevo?",
        options: [
          "Aplicar clave y secuencia, aceptando sólo el evento más reciente.",
          "Ejecutar append y deduplicar en el dashboard.",
          "Borrar el checkpoint cada noche.",
          "Ordenar por hora de llegada del archivo únicamente.",
        ],
        answer: 0,
        explanation: "El CDC determinista necesita una secuencia de origen/negocio además de la clave.",
        domain: "Data processing · CDC",
      },
      {
        question: "El job terminó con éxito pero la tabla gold tiene freshness de 80 minutos frente a SLO 15. ¿Cuál es el estado del producto?",
        options: [
          "Sano porque el job está verde.",
          "Incumpliendo el SLO; hay que investigar la cadena y consumidores.",
          "Correcto si Photon estuvo activo.",
          "No puede determinarse sin borrar caché.",
        ],
        answer: 1,
        explanation: "El estado de ejecución no sustituye la métrica de resultado para el consumidor.",
        domain: "Operations · SLO",
      },
      {
        question: "CI despliega y el job ejecuta con el mismo principal administrador. ¿Qué mejora reduce el radio de impacto?",
        options: [
          "Añadir el token a un notebook para recuperación.",
          "Dar ownership de todos los catálogos al job.",
          "Compartir el principal con analistas para soporte.",
          "Separar identidad de deploy y `run_as`, cada una con privilegios mínimos.",
        ],
        answer: 3,
        explanation: "Las funciones requieren permisos distintos; separarlas mejora mínimo privilegio y auditoría.",
        domain: "Security · identity",
      },
    ],
    sources: [
      { label: "Data Engineer Professional exam guide", href: "https://www.databricks.com/sites/default/files/2025-11/databricks-certified-data-engineer-professional-exam-guide-november-30-2025_0.pdf", reviewedAt },
      { label: "Lakeflow Jobs", href: "https://docs.databricks.com/aws/en/jobs/", reviewedAt },
      { label: "Best practices for performance efficiency", href: "https://docs.databricks.com/aws/en/lakehouse-architecture/performance-efficiency/best-practices", reviewedAt },
      { label: "Data and AI governance with Unity Catalog", href: "https://docs.databricks.com/aws/en/data-governance", reviewedAt },
    ],
  },
};

# Data Engineering Playground

Entorno interactivo para practicar el trabajo diario de un Data Engineer:
investigar, diagnosticar, decidir, recuperar y prevenir. Esta página documenta
la **fase 1** (Production Incident Simulator), su arquitectura, su modelo de
evaluación, su metodología editorial y sus límites.

> Todos los datos, métricas, tiempos y costes son **sintéticos y educativos**.
> El Playground no ejecuta Spark, Kafka, Delta Lake ni Databricks: es una
> *simulación conceptual* basada en reglas deterministas. No es un benchmark.

## Qué incluye la fase 1

- `/playground`: dashboard público (sin registro) con continuar última
  actividad, cinco incidencias, competencias trabajadas, historial y próximas
  fases (listadas sin pantallas vacías).
- `/playground/scenario/[id]`: workspace de simulación con contexto,
  objetivos, métricas con serie temporal, acciones agrupadas por tipo,
  diagnóstico, evidencias, línea temporal, pistas (modo guiado), ficha
  editorial y, al cerrar, informe post mortem descargable en Markdown.
- Modos: Guiado, Práctica libre, Evaluación y Producción. Experto y
  Repetición comparada quedan para la fase 5 (hoy se puede reiniciar con otra
  semilla y comparar en el historial).

| ID estable | Categoría | Problema | Rutas válidas de referencia |
|---|---|---|---|
| `uc-permissions-run-as` | Gobierno | Faltan `USE SCHEMA` y `READ VOLUME` tras migrar el run-as a un service principal (dos causas) | Conceder ambos tras inspeccionar; conceder iterativamente |
| `merge-not-idempotent` | Delta Lake | Reintento completo re-añade archivos a Bronze y el MERGE inserta duplicados | Deduplicar en Silver; `RESTORE` + MERGE corregido + reaplicar v413 |
| `data-skew-join` | Rendimiento | Clave `GUEST` con el 31 % de filas en un sort merge join y skew join de AQE desactivado por política | Activar skew join de AQE; separar `GUEST` conservando el left join |
| `orchestration-retry-effects` | Orquestación | Variable de bundle sin override en prod usa el secret scope de dev; un "Run now" duplicó el ledger | Corregir bundle, deduplicar por `run_id` y reparar solo notify (en cualquier orden, siempre deduplicando antes de notificar) |
| `streaming-state-growth` | Streaming | `dropDuplicates(["event_id"])` sin event time en la clave: el watermark no expulsa estado | `dropDuplicatesWithinWatermark` con checkpoint nuevo y reconciliación de frontera; MERGE idempotente en el sink |

## Arquitectura

```
app/playground/
  domain/        contratos (types.ts), condiciones, semilla, competencias, contrato del intento
  engines/       incident-engine.ts: motor puro estado + entrada -> estado
  evaluation/    evaluate.ts (rúbrica) y report.ts (post mortem)
  scenarios/     catálogo versionado, un archivo por escenario (reglas + textos ES/EN)
  i18n/          textos compartidos de UI y resolución de claves
  curriculum-links.ts  enlaces a lecciones reales (solo servidor)
  page.tsx, scenario/[id]/page.tsx, playground.css
app/components/playground/  workspace, métricas, informe, almacenamiento local
app/enterprise/playground-service.ts  persistencia, reproducción en servidor, exportación y borrado
app/api/playground/attempts/route.ts  GET resumen privado / POST guardar intento
tests/playground/   dominio, catálogo, integridad e i18n (node:test)
tests/e2e/playground.spec.ts  recorridos, accesibilidad, móvil, API y aislamiento
```

- El dominio es TypeScript puro: no importa React, Next ni la base de datos.
  El mismo motor se ejecuta en el navegador (experiencia interactiva, sin
  coste de servidor) y en el servidor (corrección al guardar).
- No hay infraestructura nueva: monolito Next.js + Turso/Drizzle existentes.

### Motor determinista

Cada escenario (`ScenarioDefinition`) declara métricas, flags, dinámicas por
minuto, métricas derivadas (`derive`, función pura), evidencias, acciones con
prerrequisitos, coste temporal y económico, riesgo, efectos condicionales,
valoración pedagógica, diagnóstico (raíz, agravante, síntoma, incorrecta),
objetivos, restricciones (críticas o no), rúbrica y rutas de referencia.

Al aplicar una acción:

1. Se valida disponibilidad (`requires`, no repetible, simulación terminada).
2. Se valora la decisión con el estado **previo** (lo que se sabía al decidir).
3. Avanza el tiempo minuto a minuto aplicando dinámicas con el estado previo.
4. Se aplican los efectos cuya condición se cumple sobre una única
   instantánea (sin dependencia del orden de declaración).
5. Se recalculan métricas derivadas, restricciones, objetivos y expiración.

La única fuente de variación es una semilla `uint32` (mulberry32) que modula
la deriva de dinámicas marcadas con `jitter`. Misma semilla + mismas entradas
= mismo estado. Las consecuencias nunca son aleatorias: se derivan de reglas y
estado. El incidente se cierra explícitamente (`close`): cumplir objetivos no
basta, se espera validar y documentar antes.

### Evaluación

Diez dimensiones ponderadas por escenario, cada una con su motivo:
diagnóstico, uso de evidencias (antes del primer cambio), orden (investigar →
diagnosticar → cambiar → validar), tiempo, coste, riesgo, integridad y
seguridad, SLA, validación, y prevención/comunicación.

- Penalización explícita de 30 puntos por cada flag de integridad (pérdida,
  duplicados publicados, privilegios excesivos aunque se revoquen, identidad
  personal, pagos dobles…). Las pruebas verifican que una resolución rápida con
  pérdida puntúa al menos 30 puntos menos que una ruta segura más lenta.
- Techo de 40 puntos si el incidente no se recupera.
- Producción reduce el tiempo límite (×0,75) y las referencias de tiempo y
  coste (×0,8). Práctica libre no genera evidencias de competencia; Guiado
  las pondera ×0,7.
- La puntuación es **orientativa**, no una medición oficial de competencia.

## Persistencia, privacidad y seguridad

- Sin cuenta: todo funciona en el navegador; el intento en curso y un
  historial breve se guardan en `localStorage` (con `try/catch`; si falla, el
  Playground sigue funcionando). No se guarda ningún dato personal.
- Con espacio anónimo: `POST /api/playground/attempts` recibe **solo** escenario,
  versión, modo, semilla, entradas y clave de idempotencia. El servidor valida
  estrictamente el payload (rechaza campos extra como `score` o `userId`),
  reproduce el motor, exige un intento terminado y calcula la evaluación.
- Tabla `playground_attempts` (migración `0003`, aditiva): un registro por
  intento terminado, no por interacción. Unicidad `(user_id, idempotency_key)`:
  repetición idéntica → 200 con el mismo intento; misma clave y otro payload →
  409. Límite de 500 intentos guardados por persona (429). Coste guardado en
  centésimas (`cost_units`).
- Las evidencias de competencia se derivan de `evaluation_json`; no hay tabla
  aparte en fase 1. Diseños guardados, preferencias específicas e historial de
  recomendaciones se añadirán con las fases que los necesiten.
- Los datos se incluyen en `/api/me/export` (`playground.attempts`) y se
  eliminan con el borrado de progreso. Respuestas privadas con
  `cache-control: private, no-store`.
- Límites: 80 entradas por intento, 4 hipótesis por diagnóstico, payload
  limitado por `readJson`, sin ejecución de código, sin URLs externas, sin
  secretos.

### Exposición de soluciones

El motor se ejecuta en el cliente, por lo que las reglas (incluida la causa
raíz) forman parte del bundle del navegador, como el propio repositorio open
source. La interfaz no muestra la causa raíz, las valoraciones ni las
alternativas hasta cerrar el incidente. Esto evita la exposición accidental
durante la actividad; **no** ofrece garantías de integridad académica. Un modo
de evaluación con reglas privadas en servidor requeriría ejecutar cada paso en
el servidor y queda fuera de la fase 1.

## Metodología editorial

Cada escenario declara autoría, versión semántica, fecha de revisión,
tecnologías, compatibilidad, fuentes oficiales (Databricks, Apache Spark),
supuestos, limitaciones, estado de revisión, competencias y referencias
curriculares (módulo y lección). El estado actual es `internal-review`: **no se
declara revisión independiente**. Las pruebas verifican que las fuentes son
HTTPS de dominios oficiales y que los módulos y lecciones referenciados existen.

Puntos técnicos verificados contra la documentación al redactar:

- La deduplicación en streaming solo puede expulsar estado con watermark si la
  clave incluye la columna de event time; `dropDuplicatesWithinWatermark`
  (Spark 3.5+) deduplica por clave dentro del umbral.
- Cambiar o eliminar un operador stateful no es compatible con el checkpoint
  existente; borrar el checkpoint no es una recuperación segura.
- En Delta, `MERGE` falla si varias filas de origen coinciden con la misma fila
  destino; filas de origen duplicadas sin coincidencia se insertan ambas.
- `RESTORE` revierte también escrituras posteriores legítimas.
- El skew join de AQE divide particiones sesgadas; escalar o aumentar
  particiones no divide una única clave caliente.
- Unity Catalog exige `USE CATALOG` y `USE SCHEMA` además del privilegio sobre
  el objeto; leer de un volume requiere `READ VOLUME`.
- Repair run reejecuta solo tareas fallidas y omitidas; "Run now" repite todas.

Los modelos numéricos (p. ej. duración del microbatch lineal con el estado)
son simplificaciones documentadas en cada archivo de escenario.

### Añadir un escenario

1. Crea `app/playground/scenarios/<id>.ts` con `ScenarioDefinition` y textos
   ES/EN con las mismas claves; regístralo en `scenarios/index.ts`.
2. Define al menos dos `referencePaths` válidas, una acción peligrosa, hipótesis
   incorrectas plausibles y fuentes oficiales.
3. `npm run test:unit` valida integridad, i18n, resolubilidad y que las acciones
   peligrosas no se recompensen. Añade pruebas específicas de sus trampas.
4. Cambiar reglas de un escenario publicado exige subir su versión: los
   intentos guardados con otra versión no se reproducen (409).

## Pruebas

- `tests/playground/engine.test.mjs`: determinismo, inmutabilidad, rutas de
  referencia, consecuencias (escalar no corrige estado, despliegue sin plan de
  checkpoint falla, pérdida rápida < recuperación segura, pagos dobles
  críticos…), prerrequisitos y contrato del payload.
- `tests/playground/catalog.test.mjs`: integridad referencial, metadatos,
  currículo real, paridad ES/EN y resolución de todos los textos emitidos.
- `tests/e2e/playground.spec.ts`: acceso público sin cookie, WCAG 2.2 AA (axe),
  investigación, recuperación local, resolución completa, informe, guardado
  idempotente, exportación, navegación a lecciones, payload manipulado,
  intento sin terminar, aislamiento entre identidades, 401 anónimo, móvil sin
  scroll horizontal e inglés.

## Limitaciones conocidas

- Simulación conceptual: no reproduce un motor distribuido ni sus tiempos.
- Un único idioma activo por sesión (preferencia existente de Lakehouse Lab).
- En `next dev`, `request.url` se normaliza a `localhost`; el control
  same-origin existente rechaza POST del navegador si se navega por
  `127.0.0.1`. En producción no aplica. La prueba e2e de guardado navega por
  `localhost`.
- Las fases 2–5 (laboratorios, builder, FinOps, SQL con DuckDB-Wasm, proyectos,
  reto diario y motor adaptativo) no están implementadas.

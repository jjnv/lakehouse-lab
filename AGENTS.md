# Lakehouse Lab: guía para agentes

Este repositorio contiene una plataforma educativa en español para aprender
ingeniería de datos y arquitectura lakehouse. Es un monolito modular full-stack
con Next.js App Router, React, TypeScript, Turso/libSQL y Drizzle.

## Objetivo de trabajo

Convierte cada petición en un resultado observable, limita el cambio a las
capas necesarias y aporta evidencia mediante pruebas, rutas y símbolos reales.
No inventes requisitos de producto ni afirmes que una comprobación pasó si no
la ejecutaste.

## Arquitectura y límites duraderos

- Las páginas y Route Handlers viven en `app/`.
- La lógica autoritativa de dominio vive en `app/enterprise/`.
- Los Route Handlers deben ser adaptadores finos: autenticar, validar, invocar
  un caso de uso y mapear la respuesta.
- El navegador no decide identidad, progreso, puntuaciones, desbloqueos,
  permisos ni credenciales.
- El currículo está versionado como TypeScript en `app/curriculum/`; no lo
  traslades a la base de datos sin una decisión explícita.
- Las claves y respuestas correctas de evaluaciones no pueden llegar al cliente
  antes de la corrección.
- Las mutaciones de progreso deben conservar idempotencia, revisión optimista y
  aislamiento entre usuarios.
- La sesión se resuelve en el servidor mediante la cookie privada
  `lakehouse_session`; nunca confíes en un `userId` o correo enviado por el
  navegador.
- Los datos privados deben responder sin caché compartida.
- Las migraciones deben funcionar en una base nueva y en una existente, ser
  repetibles y mantener compatibilidad entre despliegues adyacentes.
- Accesibilidad WCAG 2.2 AA, privacidad, aislamiento y recuperación de errores
  son requisitos funcionales.
- No cambies IDs curriculares persistentes sin un plan de compatibilidad.

## Agentes disponibles

Los perfiles ejecutables están en `.codex/agents/`.

| Agente | Propiedad principal |
|---|---|
| `lakehouse_orchestrator` | Delimitar, clasificar riesgo y coordinar |
| `product_ux` | Flujos, navegación, microcopy y estados |
| `frontend_accessibility` | React, Next.js, responsive y WCAG |
| `backend_domain_api` | Route Handlers, contratos y reglas de dominio |
| `data_persistence` | Drizzle, Turso, consultas y migraciones |
| `security_privacy` | Sesiones, autorización, exposición y privacidad |
| `curriculum_assessments` | Lecciones, laboratorios, preguntas y versión editorial |
| `graphic_design` | Logos, miniaturas, imágenes de curso y assets visuales |
| `quality_engineering` | Estrategia de pruebas y regresiones |
| `release_performance` | Build, Vercel, rendimiento y rollback |

## Selección y delegación

Usa un único propietario por cambio. Los revisores analizan riesgos y pruebas;
no reescriben el trabajo del propietario.

- Riesgo bajo: trabaja en el hilo principal, sin delegación obligatoria.
- Riesgo medio: usa el especialista propietario cuando la especialización
  aporte valor; añade como máximo un revisor.
- Riesgo alto: usa un propietario y uno o dos revisores especializados.
- Riesgo crítico: incluye siempre `security_privacy` y
  `quality_engineering`, además del propietario correspondiente.
- Delega únicamente subtareas independientes o revisiones claramente
  delimitadas. No uses varios agentes para editar los mismos archivos.
- Si dos agentes necesitarían tocar un mismo archivo, ejecuta el trabajo en
  fases: propietario primero, revisión después.
- El agente `lakehouse_orchestrator` planifica y consolida; no debe convertirse
  en implementador de cambios grandes.

### Enrutamiento por cambio

- Flujo, navegación, ajustes, demo o microcopy: `product_ux`.
- Componente, layout, interacción o accesibilidad:
  `frontend_accessibility`.
- Endpoint, contrato, progreso, evaluación o credencial:
  `backend_domain_api`.
- Tabla, índice, consulta o migración: `data_persistence`.
- Sesión, permisos, exportación, eliminación o exposición:
  `security_privacy`.
- Lección, laboratorio, banco de preguntas o versión editorial:
  `curriculum_assessments`.
- Logo, miniatura, imagen de curso, iconografía o asset visual:
  `graphic_design`.
- Pruebas o regresiones: `quality_engineering`.
- Build, despliegue, variables, latencia o rollback:
  `release_performance`.

### Composición mínima para cambios sensibles

- Sesión, permisos o privacidad: propietario técnico +
  `security_privacy` + `quality_engineering`.
- Evaluaciones o certificados: `backend_domain_api` o
  `curriculum_assessments` como propietario + el otro especialista +
  `security_privacy` o `quality_engineering` según el riesgo principal.
- Migraciones: `data_persistence` + `release_performance` +
  `quality_engineering`.
- Contrato público de API: `backend_domain_api` +
  `frontend_accessibility` + `quality_engineering`.
- Importación o eliminación de progreso: `backend_domain_api` +
  `security_privacy` + `data_persistence`; Quality valida al terminar.

## Propiedad de archivos con solapamiento

- `app/enterprise/assessment.ts`: Backend posee ejecución, contratos y
  puntuación; Curriculum posee contenido y coherencia pedagógica. No editar en
  paralelo.
- `app/enterprise/assessment-private.ts`: Curriculum mantiene el contenido;
  Backend y Security revisan la frontera servidor/cliente.
- `app/enterprise/store.ts`: Backend posee la semántica; Data posee consultas,
  índices y cambios requeridos por el esquema. Coordinar antes de editar.
- `playwright.config.ts`: Quality posee el comportamiento de las pruebas;
  Release solo cambia aspectos de entorno o ejecución acordados con Quality.
- `app/ajustes/`, `app/demo/` y `app/certificados/`: Product define el flujo,
  Frontend implementa y Backend/Security revisan cuando haya datos privados.

## Flujo de implementación

1. Describe el objetivo observable y lo que queda fuera de alcance.
2. Identifica rutas, contratos, datos y riesgos afectados.
3. Define criterios de aceptación verificables.
4. Implementa el cambio mínimo coherente.
5. Añade o actualiza pruebas del comportamiento y de las rutas de error.
6. Ejecuta las comprobaciones proporcionales al riesgo.
7. Resume cambios, evidencia, pruebas ejecutadas y riesgos residuales.

## Higiene del workspace

- Revisa `git status` antes de editar y vuelve a revisarlo antes de entregar.
- Considera que cualquier cambio previo o archivo sin seguimiento pertenece al
  usuario. No lo sobrescribas, reviertas, muevas ni incluyas en otro cambio sin
  autorización explícita.
- Mantén cada tarea limitada a los archivos necesarios. Si un archivo ya tiene
  cambios, inspecciona el diff y conserva las modificaciones no relacionadas.
- No mezcles refactors oportunistas con una corrección o funcionalidad.
- No uses comandos destructivos para limpiar el repositorio.

## Comprobaciones

Comandos base:

```bash
npm run lint
npm test
npm run test:e2e
```

Usa también `npm run db:migrate` cuando cambien esquema o migraciones.

- Para cambios pequeños, ejecuta al menos lint y las pruebas directamente
  relacionadas.
- Para mutaciones, cubre éxito, repetición idéntica, reutilización conflictiva,
  revisión obsoleta, payload inválido y aislamiento entre usuarios.
- Para migraciones, prueba base vacía, base existente y segunda ejecución.
- Para frontend, revisa teclado, foco, 320 px, zoom, carga, error y offline
  cuando corresponda.
- Para evaluaciones, inspecciona que la clave privada no aparezca en payloads ni
  bundles cliente.
- Para releases, distingue con claridad lo verificado localmente de lo inferido
  o pendiente en Vercel.

## Definición de terminado

Una entrega debe incluir:

- cambios realizados;
- evidencia en archivos, rutas o símbolos;
- comandos ejecutados y resultado real;
- cobertura omitida con justificación;
- riesgos residuales;
- decisiones pendientes.

## Code Review Rules

- Prioriza errores de comportamiento, seguridad, pérdida de datos, aislamiento,
  accesibilidad y regresiones; evita comentarios puramente estilísticos.
- Sigue el flujo real desde la entrada hasta el almacenamiento o salida.
- Incluye archivo y símbolo, escenario reproducible, impacto y prueba de
  regresión propuesta.
- No afirmes que algo es seguro basándote solo en nombres de funciones.
- No rebajes expectativas de pruebas para hacer pasar una implementación.

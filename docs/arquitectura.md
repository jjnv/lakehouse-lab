# Arquitectura y desarrollo

Lakehouse Lab es un monolito modular con Next.js App Router, React,
TypeScript, Turso/libSQL y Drizzle. La aplicacion combina lectura publica,
curriculo versionado en codigo y un espacio personal anonimo para guardar
progreso cuando el visitante lo decide.

## Capas principales

- `app/`: paginas, Route Handlers, metadatos, sitemap, robots y estilos.
- `app/components/public/`: shell y componentes de paginas publicas.
- `app/components/enterprise/`: shell de aprendizaje, catalogo, curso,
  evaluaciones, expediente, ajustes y controles con estado cliente.
- `app/enterprise/`: casos de uso, contratos, autenticacion, busqueda,
  proyecciones publicas del curriculo y acceso al store.
- `app/curriculum/`: contenido editorial versionado, bancos de preguntas,
  recursos comunitarios, guias de notebooks y glosario.
- `db/` y `drizzle/`: esquema, cliente y migraciones.
- `tests/` y `tests/e2e/`: pruebas de contenido, contratos, seguridad,
  renderizado, recursos, accesibilidad y flujos end-to-end.

## Rutas publicas

- `/`: portada indexable con entrada a la primera leccion.
- `/ruta`: perfiles de aprendizaje y duracion estimada.
- `/catalogo`: modulos y progreso opcional.
- `/recursos`: notebooks y proyectos enlazados al curriculo.
- `/glosario`: conceptos comunes de Databricks con definiciones, fuentes y
  anclajes.
- `/simulacros`, `/simulacro/associate`, `/simulacro/professional`: simulacros
  internos.
- `/curso/[slug]` y `/curso/[slug]/[lessonId]`: modulos y lecciones con URLs
  estables.
- `/metodologia`, `/changelog`, `/acerca-de`, `/privacidad`, `/terminos`,
  `/recuperar`: confianza, legal, privacidad y recuperacion.

## Rutas privadas y API

La lectura publica no requiere identidad. El espacio personal se crea mediante
la cookie privada `lakehouse_session`, no con correos ni `userId` enviados por el
navegador.

- `/inicio`, `/mi-aprendizaje`, `/expediente`, `/ajustes`: vistas del espacio
  personal.
- `/api/session`: crea o lee la sesion anonima.
- `/api/me/*`: dashboard, progreso, preferencias, exportacion y codigo de
  recuperacion.
- `/api/assessments/*`: inicio, entrega y correccion de evaluaciones en
  servidor.
- `/api/labs/*`: atestacion de laboratorios.
- `/api/search`: busqueda publica cacheable de modulos, lecciones, conceptos,
  recursos y glosario.
- `/api/resources/[resourceId]/preview`: preview interna de notebooks cuando la
  licencia lo permite.
- `/api/credentials/[id]/pdf`: exportacion PDF de credenciales.

## Datos y persistencia

El curriculo canonico vive en TypeScript bajo `app/curriculum/` y se proyecta a
contratos publicos desde `app/enterprise/curriculum.ts`. No se guarda el temario
en la base de datos. La base persiste sesiones, progreso, preferencias,
recuperacion, intentos de evaluacion y credenciales.

Sin `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, el desarrollo local usa SQLite en
`.data/`. Con esas variables, el mismo cliente usa Turso/libSQL remoto.

## Seguridad y privacidad

- La sesion se resuelve en servidor con `lakehouse_session`.
- Las mutaciones usan revision optimista e identificador idempotente.
- Las claves de evaluaciones se mantienen en el servidor hasta la correccion.
- Las respuestas privadas se sirven sin cache compartida.
- Las rutas mutables validan origen, tipo de contenido y payload.
- El usuario puede recuperar, exportar y eliminar su actividad.

## Contenido editorial

La version editorial actual es `2026.07` y la revision global es
`24 de julio de 2026`. El contenido enlaza fuentes oficiales de Databricks,
Delta Lake o Apache Spark cuando corresponde. El glosario se mantiene en
`app/curriculum/glossary.ts` y se expone en `/glosario`, sitemap y busqueda
global.

## Desarrollo local

Requisitos:

```bash
npm ci
npm run dev
```

Comandos habituales:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run db:migrate
```

`npm test` ejecuta build y las pruebas unitarias `tests/*.test.mjs`. Para
cambios de esquema o migraciones, ejecuta tambien `npm run db:migrate` sobre una
base vacia, una existente y una segunda ejecucion.

## Despliegue

Vercel ejecuta `node scripts/migrate.mjs && next build` mediante
`npm run vercel-build`. La URL canonica se calcula desde
`NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` o el
dominio temporal. La preparacion de dominio propio esta en
[`docs/seo-dominio.md`](seo-dominio.md).

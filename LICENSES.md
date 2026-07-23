# Licencias de Lakehouse Lab

Lakehouse Lab combina software, contenido educativo y referencias a materiales
de terceros. Este documento define qué licencia corresponde a cada parte.

## Software — MIT

El código fuente se distribuye bajo la licencia MIT incluida en [LICENSE](LICENSE).
Esto comprende, salvo las expresiones educativas indicadas en la siguiente
sección:

- componentes, páginas, Route Handlers y lógica de dominio de `app/`;
- persistencia y migraciones de `db/` y `drizzle/`;
- scripts, configuración, pruebas y herramientas de desarrollo;
- documentación técnica y archivos de gobernanza del proyecto;
- recursos visuales originales de `public/`, salvo aviso específico.

## Contenido educativo — CC BY-SA 4.0

Los textos y datos docentes originales se distribuyen bajo `CC BY-SA 4.0` según
[CONTENT-LICENSE.md](CONTENT-LICENSE.md). El alcance incluye:

- `app/curriculum/**`;
- los datos docentes de `app/course-data.ts`;
- los datos editoriales de `app/editorial-data.ts`;
- los textos educativos originales de la portada y de la experiencia de aprendizaje;
- `deep-research-report.md`.

En archivos mixtos, el código sigue bajo MIT y el contenido expresivo docente
bajo `CC BY-SA 4.0`.

## Código de conducta

[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) está adaptado del Contributor Covenant
2.1, distribuido bajo
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

## Materiales de terceros

Los repositorios, notebooks y documentos externos conservan la licencia de sus
titulares. `app/curriculum/community-resources.ts` registra procedencia,
licencia, evidencia, commit y ruta curada, pero Lakehouse Lab no adquiere ni
transfiere derechos sobre esos artefactos.

Las vistas internas recuperan únicamente archivos upstream declarados y fijados
a un commit. Esa recuperación no convierte el contenido en parte de la licencia
MIT o `CC BY-SA 4.0` de Lakehouse Lab.

Las marcas y nombres de producto se utilizan con finalidad descriptiva. Lakehouse
Lab no está afiliado, patrocinado ni avalado por Databricks.

## Contribuciones

Al contribuir, conservas los derechos sobre tu trabajo y certificas, mediante el
Developer Certificate of Origin, que puedes publicarlo bajo la licencia aplicable:

- MIT para software y documentación técnica;
- `CC BY-SA 4.0` para contenido educativo.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un pull request.

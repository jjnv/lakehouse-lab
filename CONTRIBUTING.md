# Contribuir a Lakehouse Lab

Gracias por ayudar a construir una plataforma educativa abierta, rigurosa y
accesible. Son bienvenidas las correcciones, mejoras de producto, contenidos,
verificaciones de laboratorios y propuestas de recursos comunitarios.

## Antes de empezar

1. Busca una incidencia o pull request existente.
2. Para cambios relevantes, abre primero una incidencia que describa el resultado,
   el alcance y los riesgos.
3. No incluyas secretos, datos personales, dumps de exámenes ni materiales de
   terceros sin una licencia compatible.
4. Mantén los IDs curriculares existentes. Cambiarlos exige un plan explícito de
   compatibilidad con progreso y credenciales.

Los problemas de seguridad no se publican como incidencias normales. Sigue
[SECURITY.md](SECURITY.md).

## Desarrollo local

Requisitos: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Comprobaciones base:

```bash
npm run lint
npm test
npm run test:e2e
```

Para un cambio pequeño puedes ejecutar primero las pruebas directamente
relacionadas, pero el pull request debe explicar qué cobertura se ejecutó y cuál
queda pendiente.

## Tipos de contribución

### Software

- Mantén los Route Handlers como adaptadores finos.
- La identidad, el progreso, las puntuaciones y los permisos se resuelven en el
  servidor.
- Añade pruebas para éxito, errores, idempotencia, aislamiento y accesibilidad
  cuando corresponda.
- No mezcles refactors ajenos con la corrección o funcionalidad propuesta.

### Currículo y evaluaciones

- Sitúa los conceptos antes de evaluarlos.
- Aporta fuentes oficiales vigentes y fecha de revisión.
- Mantén una única respuesta defendible, distractores plausibles y explicaciones
  completas.
- No utilices preguntas memorizadas, dumps ni criterios internos presentados como
  requisitos oficiales.
- Indica impacto sobre progreso, laboratorios, evaluaciones y credenciales.
- Las claves de respuesta pueden existir en el repositorio abierto, pero nunca
  deben enviarse al cliente antes de la corrección.

### Laboratorios

- Declara runtime, cloud, permisos, dataset, coste estimado, cleanup y recuperación.
- Evita credenciales o datos privados.
- Si ejecutaste el laboratorio, documenta cloud, runtime, fecha y resultado.
- Distingue una especificación revisada de una reproducción independiente.

### Recursos comunitarios

Una propuesta debe incluir:

- repositorio, autor y procedencia;
- archivo o carpeta concreta;
- commit completo de 40 caracteres;
- licencia y ruta de evidencia dentro de ese commit;
- formato, lenguaje, cloud, dificultad y runtime;
- módulos relacionados y explicación pedagógica;
- confirmación de que el recurso puede enlazarse o reproducirse.

Los recursos sin licencia verificable pueden mantenerse como enlaces, pero su
contenido no se reproduce dentro de Lakehouse Lab.

## Licencias de las contribuciones

El mapa de licencias está en [LICENSES.md](LICENSES.md):

- software y documentación técnica: MIT;
- contenido educativo original: `CC BY-SA 4.0`;
- materiales de terceros: su licencia upstream.

No envíes una contribución si no tienes derecho a distribuirla bajo la licencia
correspondiente.

## Developer Certificate of Origin

Lakehouse Lab utiliza el
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
Al añadir una línea `Signed-off-by` certificas que has creado la contribución o
tienes derecho a enviarla, que puedes publicarla bajo las licencias del proyecto
y que el historial de la contribución será público.

Firma cada commit con:

```bash
git commit -s
```

La línea resultante debe coincidir con la identidad del commit:

```text
Signed-off-by: Nombre Apellido <correo@example.com>
```

Un mantenedor puede pedir que se corrija la firma antes de aceptar el cambio.

## Pull requests

Un pull request debe:

- describir el resultado observable y lo que queda fuera de alcance;
- enlazar la incidencia relacionada cuando exista;
- enumerar archivos y contratos afectados;
- incluir pruebas ejecutadas y resultados reales;
- señalar riesgos residuales y decisiones pendientes;
- conservar cambios no relacionados que ya existan en la rama.

Las decisiones y responsabilidades de revisión se describen en
[GOVERNANCE.md](GOVERNANCE.md).

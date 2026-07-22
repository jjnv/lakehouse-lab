# Lakehouse Lab

Plataforma educativa independiente en español para aprender ingeniería de datos sobre Databricks mediante una ruta de 20 semanas, 32 módulos, laboratorios, evaluaciones y progreso sincronizado.

> Proyecto personal e independiente. No está afiliado, patrocinado ni avalado por Databricks.

[Ver la aplicación](https://databricks-learning-path.jjxn.chatgpt.site) · [Explorar la demo sin registro](https://databricks-learning-path.jjxn.chatgpt.site/demo) · [Reportar una incidencia](https://github.com/jjnv/lakehouse-lab/issues)

![Vista de presentación de Lakehouse Lab](public/og-public.png)

## Qué incluye

- Portada y demo públicas sin registro.
- Espacio personal con inicio de sesión mediante ChatGPT.
- 160 lecciones, 32 laboratorios y simulacros Associate y Professional.
- Progreso persistente en Cloudflare D1 y repasos espaciados.
- Evaluaciones corregidas en el servidor sin enviar claves de respuesta al cliente.
- Exportación y eliminación del progreso.
- Credenciales de finalización verificables y exportables en PDF.
- Diseño adaptable y comprobaciones WCAG 2.2 AA.

## Arquitectura

- Next.js 16, React 19 y TypeScript.
- vinext y Cloudflare Workers.
- Cloudflare D1 con Drizzle ORM.
- Autenticación gestionada por el dispatcher de Sites.
- Pruebas de contrato, currículo, renderizado, aislamiento de usuarios y accesibilidad.

Las páginas públicas no requieren identidad. Las rutas de aprendizaje y todas las operaciones de escritura resuelven la persona autenticada en el servidor; ninguna API acepta un correo o `userId` enviado por el cliente.

## Desarrollo local

Requisitos: Node.js `>=22.13.0`, Bash y las utilidades GNU utilizadas por los scripts del proyecto.

```bash
npm ci
npm run dev
```

Para simular una cuenta local, crea un archivo `.env.local` sin publicarlo:

```dotenv
SITES_DEV_USER_EMAIL=learner@example.com
SITES_DEV_USER_NAME=Persona de prueba
```

## Comprobaciones

```bash
npm test
npm run lint
npm run test:e2e
```

## Privacidad y contenido

La demo pública no guarda progreso. El espacio personal informa de los datos tratados y permite exportar o eliminar la actividad. El contenido se redacta de forma original y enlaza documentación oficial; no contiene dumps de exámenes ni promete aprobar una certificación.

Versión editorial: **2026.07**. Última revisión: **22 de julio de 2026**.

## Licencias

El código fuente se publica bajo licencia MIT. El contenido educativo de `app/curriculum/` y los bancos de preguntas se distribuye bajo **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**. Consulta [LICENSE](LICENSE) y [CONTENT-LICENSE.md](CONTENT-LICENSE.md).

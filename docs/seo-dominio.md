# SEO y dominio propio

Dominio recomendado: `lakehouselab.es`.

Este dominio no se declara como adquirido ni configurado. Mientras no exista, producción puede seguir usando `https://lakehouse-lab.vercel.app/`.

## Variables

- `NEXT_PUBLIC_SITE_URL`: URL canónica de producción, por ejemplo `https://lakehouselab.es` cuando el dominio esté activo.
- `NEXT_PUBLIC_PROJECT_REPOSITORY_URL`: repositorio público usado en enlaces de confianza y reporte de errores.

## Metadatos

- `metadataBase` se calcula desde `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` o el dominio temporal de Vercel.
- Las rutas públicas usan `alternates.canonical` relativo para evitar duplicados.
- `app/sitemap.ts` genera URLs absolutas con `PROJECT_PUBLIC_URL`.
- `/glosario` es una ruta pública indexable con anclajes por término y se
  incluye en el sitemap.
- `app/robots.ts` bloquea API y zonas privadas, y expone `sitemap.xml`.
- Open Graph y Twitter/X cards usan `/og-public.png`.
- El favicon y el manifest usan los assets del directorio `public/`.

## Redirecciones

No se eliminan URLs públicas existentes. `/associate` y `/professional` se mantienen como páginas públicas y se enlazan desde la ruta. Las lecciones antiguas con `?lesson=` siguen abriéndose; las nuevas URLs canónicas son `/curso/[modulo]/[leccion]`.

## Contacto

Correo recomendado para publicar cuando el dominio esté bajo control: `hola@lakehouselab.es`.

## Pendiente fuera del repositorio

- Comprar o configurar el dominio.
- Añadirlo en Vercel.
- Configurar DNS.
- Activar `NEXT_PUBLIC_SITE_URL=https://lakehouselab.es`.
- Crear el buzón de contacto antes de publicarlo como canal operativo.

/** Fecha de la revisión editorial bilingüe del glosario. */
export const GLOSSARY_REVIEWED_AT = "2026-11-27";

/** Fuente en la documentación oficial de Databricks (ruta relativa a /aws/en). */
export const docs = (path: string, label: string) => ({
  sourceUrl: `https://docs.databricks.com/aws/en${path}`,
  sourceLabel: label,
  reviewedAt: GLOSSARY_REVIEWED_AT,
});

/** Fuente interna: capítulo de la página de fundamentos de Lakehouse Lab. */
export const foundationsChapter = (anchor: string) => ({
  sourceUrl: `/fundamentos#${anchor}`,
  sourceLabel: "Lakehouse Lab · Fundamentos",
  reviewedAt: GLOSSARY_REVIEWED_AT,
});

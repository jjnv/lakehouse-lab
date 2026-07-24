export const PROJECT_NAME = "Lakehouse Lab";
export const PROJECT_TAGLINE = "Ingeniería de datos con Databricks";
export const PROJECT_DESCRIPTION =
  "Ruta práctica e independiente en español para aprender ingeniería de datos con Databricks, con lecciones, laboratorios, evaluaciones y simulacros alineados con Data Engineer Associate y Professional.";
export const CONTENT_VERSION_LABEL = "2026.07";
export const CONTENT_REVIEW_DATE = "22 de julio de 2026";
export const RECOMMENDED_CUSTOM_DOMAIN = "lakehouselab.es";
export const RECOMMENDED_CONTACT_EMAIL = "hola@lakehouselab.es";
function optionalHttpsUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function vercelUrl(value: string | undefined) {
  const candidate = value?.trim();
  return candidate ? optionalHttpsUrl(`https://${candidate}`) : null;
}

export const PROJECT_PUBLIC_URL = optionalHttpsUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
) ?? vercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  ?? vercelUrl(process.env.VERCEL_URL)
  ?? "https://lakehouse-lab.vercel.app";

export const PROJECT_REPOSITORY_URL = optionalHttpsUrl(
  process.env.NEXT_PUBLIC_PROJECT_REPOSITORY_URL,
) ?? "https://github.com/jjnv/lakehouse-lab";
export const PROJECT_ISSUES_URL = `${PROJECT_REPOSITORY_URL}/issues`;

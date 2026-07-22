export const PROJECT_NAME = "Lakehouse Lab";
export const PROJECT_TAGLINE = "Ruta práctica de ingeniería de datos";
export const PROJECT_DESCRIPTION =
  "Proyecto educativo independiente en español con 32 módulos, laboratorios guiados, evaluaciones y progreso sincronizado.";
export const CONTENT_VERSION_LABEL = "2026.07";
export const CONTENT_REVIEW_DATE = "22 de julio de 2026";
export const PROJECT_PUBLIC_URL = "https://databricks-learning-path.jjxn.chatgpt.site";

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

export const PROJECT_REPOSITORY_URL = optionalHttpsUrl(
  process.env.NEXT_PUBLIC_PROJECT_REPOSITORY_URL,
) ?? "https://github.com/jjnv/lakehouse-lab";
export const PROJECT_ISSUES_URL = `${PROJECT_REPOSITORY_URL}/issues`;

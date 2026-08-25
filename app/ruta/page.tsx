import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { localizeLearningPathProfiles } from "../i18n/learning-paths";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";
import type { LearningPathId } from "../learning-paths";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Learning Path" : "Ruta de aprendizaje",
    description: locale === "en"
      ? "Choose a practical path to learn Databricks data engineering or prepare Associate and Professional."
      : "Elige una ruta práctica para aprender ingeniería de datos con Databricks o preparar Associate y Professional.",
    alternates: { canonical: "/ruta" },
    openGraph: {
      title: locale === "en" ? "Lakehouse Lab Path" : "Ruta Lakehouse Lab",
      description: locale === "en"
        ? "Five goal-based entry points for foundations, Associate, Professional, streaming and CDC, or practical labs."
        : "Cinco entradas por objetivo para fundamentos, Associate, Professional, streaming y CDC o laboratorios prácticos.",
      url: "/ruta",
    },
  };
}

const routeText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  available: string;
  modules: string;
  openFirstLab: string;
}> = {
  es: {
    kicker: "Objetivos de aprendizaje",
    title: "¿Qué quieres conseguir?",
    lead: "Elige un objetivo. Podrás cambiarlo sin perder acceso al resto del temario.",
    available: "Objetivos disponibles",
    modules: "módulos",
    openFirstLab: "Abrir el primer laboratorio",
  },
  en: {
    kicker: "Learning goals",
    title: "What do you want to achieve?",
    lead: "Choose one goal. You can change it without losing access to the rest of the curriculum.",
    available: "Available goals",
    modules: "modules",
    openFirstLab: "Open the first lab",
  },
};

const pathOrder: LearningPathId[] = [
  "databricks-cero",
  "associate",
  "professional",
  "streaming-cdc",
  "laboratorios",
];

export default async function RutaPage() {
  const locale = await getRequestLocale();
  const text = routeText[locale];
  const pathsById = new Map(localizeLearningPathProfiles(locale).map((path) => [path.id, path]));
  const paths = pathOrder.flatMap((id) => {
    const path = pathsById.get(id);
    return path ? [path] : [];
  });

  return (
    <PublicShell active="route" locale={locale}>
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="route-heading">
          <p className="public-kicker">{text.kicker}</p>
          <h1 id="route-heading">{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>
        </section>

        <ol className="public-phase-list" aria-label={text.available}>
          {paths.map((path, index) => (
            <li key={path.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{path.title}</h2>
                <p>{path.objective}</p>
                <p><strong>{path.durationLabel}</strong> · {path.moduleCount} {text.modules}</p>
                <Link className="public-secondary" href={path.href}>
                  {path.id === "laboratorios" ? text.openFirstLab : path.cta}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </PublicShell>
  );
}

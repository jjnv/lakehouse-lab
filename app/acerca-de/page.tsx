import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_REVIEW_DATE_EN, CONTENT_VERSION_LABEL, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "About the project" : "Acerca del proyecto",
    description: locale === "en"
      ? "Lakehouse Lab is an independent platform for Databricks Data Engineer preparation."
      : "Lakehouse Lab es una plataforma independiente para preparar Databricks Data Engineer.",
    alternates: { canonical: "/acerca-de" },
  };
}

const aboutText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  sections: Array<{ title: string; body: string }>;
  facts: { version: string; reviewed: string; language: string; languageValue: string };
  repo: string;
  issues: string;
}> = {
  es: {
    kicker: "Acerca del proyecto",
    title: "Preparación independiente para Data Engineers.",
    lead: "Lakehouse Lab es un proyecto personal, independiente y de código abierto para preparar Databricks Data Engineer Associate y Professional con práctica, evaluación y trazabilidad.",
    sections: [
      { title: "Qué reúne", body: "Producto, desarrollo full-stack, sesiones privadas, persistencia, accesibilidad y un currículo técnico centrado en Databricks Data Engineering." },
      { title: "Criterio editorial", body: "El contenido es original, enlaza fuentes públicas y evita dumps de examen. Las notas internas no son umbrales oficiales." },
      { title: "Independencia", body: "No está afiliado, patrocinado ni avalado por Databricks. Las marcas citadas pertenecen a sus titulares." },
    ],
    facts: { version: "Versión", reviewed: "Revisado", language: "Idioma", languageValue: "Español e inglés" },
    repo: "Repositorio publico",
    issues: "Avisar de contenido desactualizado",
  },
  en: {
    kicker: "About the project",
    title: "Independent preparation for Data Engineers.",
    lead: "Lakehouse Lab is a personal, independent, open-source project for Databricks Data Engineer Associate and Professional preparation with practice, assessment, and traceability.",
    sections: [
      { title: "What it combines", body: "Product design, full-stack development, private sessions, persistence, accessibility, and a technical curriculum focused on Databricks Data Engineering." },
      { title: "Editorial criteria", body: "Content is original, links public sources, and avoids exam dumps. Internal scores are not official thresholds." },
      { title: "Independence", body: "It is not affiliated with, sponsored by, or endorsed by Databricks. Referenced trademarks belong to their owners." },
    ],
    facts: { version: "Version", reviewed: "Reviewed", language: "Language", languageValue: "Spanish and English" },
    repo: "Public repository",
    issues: "Report outdated content",
  },
};

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const text = aboutText[locale];
  const reviewDate = locale === "en" ? CONTENT_REVIEW_DATE_EN : CONTENT_REVIEW_DATE;
  return <PublicShell active="about" locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p>
        <h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>
        {text.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
        <section>
          <h2>{locale === "en" ? "Project facts" : "Datos del proyecto"}</h2>
          <dl className="public-facts"><div><dt>{text.facts.version}</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>{text.facts.reviewed}</dt><dd>{reviewDate}</dd></div><div><dt>{text.facts.language}</dt><dd>{text.facts.languageValue}</dd></div></dl>
        </section>
        <section><h2>{locale === "en" ? "Code and collaboration" : "Codigo y colaboracion"}</h2><p><a href={PROJECT_REPOSITORY_URL} rel="noreferrer">{text.repo}</a> · <a href={PROJECT_ISSUES_URL} rel="noreferrer">{text.issues}</a></p></section>
      </article>
    </main>
  </PublicShell>;
}

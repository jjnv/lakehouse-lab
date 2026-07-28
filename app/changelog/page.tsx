import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { editorialChangelog } from "../editorial-model";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Editorial Changelog" : "Changelog editorial",
    description: locale === "en"
      ? "Public history of content, methodology, privacy, and experience changes in Lakehouse Lab."
      : "Historial público de cambios de contenido, metodología, privacidad y experiencia en Lakehouse Lab.",
    alternates: { canonical: "/changelog" },
  };
}

const changelogText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  aria: string;
  reference: string;
  noReference: string;
  type: string;
  description: string;
}> = {
  es: {
    kicker: "Changelog editorial",
    title: "Qué ha cambiado en el contenido.",
    lead: "Registro público compacto de cambios relevantes.",
    aria: "Cambios editoriales",
    reference: "Referencia",
    noReference: "Sin issue o PR asociado todavia.",
    type: "Cambio",
    description: "Cambio editorial registrado en el repositorio del proyecto.",
  },
  en: {
    kicker: "Editorial changelog",
    title: "What changed in the content.",
    lead: "Compact public record of relevant changes.",
    aria: "Editorial changes",
    reference: "Reference",
    noReference: "No associated issue or PR yet.",
    type: "Change",
    description: "Editorial change recorded in the project repository.",
  },
};

const changelogCopyEn: Record<string, { target: string; description: string; type: string }> = {
  "Glosario Databricks": {
    target: "Databricks glossary",
    description: "Added a public route with common platform, governance, Delta Lake, Lakeflow, streaming, performance, security, and cost concepts, integrated with search and sitemap.",
    type: "Content",
  },
  "Portada, navegación y rutas de entrada": {
    target: "Homepage, navigation, and entry routes",
    description: "Repositioned the experience toward practical data engineering with Databricks, with certifications treated as learning path outcomes.",
    type: "Product",
  },
  "Metodología, metadatos editoriales y URLs de lección": {
    target: "Methodology, editorial metadata, and lesson URLs",
    description: "Added public structure for sources, review status, error reporting, version policy, and stable lesson navigation.",
    type: "Content",
  },
  "Currículo v2.0.0": {
    target: "Curriculum v2.0.0",
    description: "Published the 32-module curriculum with official sources, labs, internal practice exams, and initial editorial review.",
    type: "Sources",
  },
};

export default async function ChangelogPage() {
  const locale = await getRequestLocale();
  const text = changelogText[locale];
  return <PublicShell active="changelog" locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p>
        <h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>
        <section className="public-changelog" aria-label={text.aria}>
          {editorialChangelog.map((change) => (
            <article key={`${change.date}-${change.target}`}>
              <time dateTime={change.date}>{new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", { dateStyle: "long" }).format(new Date(`${change.date}T12:00:00`))}</time>
              <span>{locale === "en" ? changelogCopyEn[change.target]?.type ?? text.type : change.type}</span>
              <h2>{locale === "en" ? changelogCopyEn[change.target]?.target ?? change.target : change.target}</h2>
              <p>{locale === "en" ? changelogCopyEn[change.target]?.description ?? text.description : change.description}</p>
              {change.reference ? <a href={change.reference} rel="noreferrer">{text.reference}</a> : <small>{text.noReference}</small>}
            </article>
          ))}
        </section>
      </article>
    </main>
  </PublicShell>;
}

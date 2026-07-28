import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import {
  EDITORIAL_OWNER,
  EDITORIAL_REVIEW_STATUS,
  EDITORIAL_UPDATE_FREQUENCY,
  methodologyReferences,
} from "../editorial-model";
import { CONTENT_REVIEW_DATE, CONTENT_REVIEW_DATE_EN, CONTENT_VERSION_LABEL, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";
import { getRequestLocale } from "../i18n/server";
import { localizeDurationMethod } from "../i18n/learning-paths";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Editorial Methodology" : "Metodología editorial",
    description: locale === "en"
      ? "How Lakehouse Lab content is created, reviewed, versioned, and corrected."
      : "Cómo se crea, revisa, versiona y corrige el contenido de Lakehouse Lab.",
    alternates: { canonical: "/metodologia" },
  };
}

const methodologyText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  author: string;
  sources: string;
  certification: string;
  review: string;
  updates: string;
  duration: string;
  limits: string;
  report: string;
}> = {
  es: {
    kicker: "Metodologia editorial",
    title: "Cómo validamos el contenido.",
    lead: "Fuentes, revisión y limitaciones quedan visibles para que puedas evaluar la confianza antes de estudiar.",
    author: "Autoría y contexto",
    sources: "Fuentes utilizadas",
    certification: "Relacion con Associate y Professional",
    review: "Redaccion y revision tecnica",
    updates: "Actualizacion, errores y versiones",
    duration: "Duracion estimada",
    limits: "Limitaciones",
    report: "Reportar errores",
  },
  en: {
    kicker: "Editorial methodology",
    title: "How we validate content.",
    lead: "Sources, review status, and limitations stay visible so you can assess trust before investing study time.",
    author: "Authorship and context",
    sources: "Sources used",
    certification: "Relationship with Associate and Professional",
    review: "Writing and technical review",
    updates: "Updates, errors, and versions",
    duration: "Estimated duration",
    limits: "Limitations",
    report: "Report issues",
  },
};

export default async function MetodologiaPage() {
  const locale = await getRequestLocale();
  const text = methodologyText[locale];
  const reviewDate = locale === "en" ? CONTENT_REVIEW_DATE_EN : CONTENT_REVIEW_DATE;
  const ownerRole = locale === "en" ? "Author and maintainer of the Lakehouse Lab project" : EDITORIAL_OWNER.role;
  const ownerNote = locale === "en"
    ? "The repository does not claim external reviewers or Databricks affiliation. The methodology keeps those fields ready for completion when verifiable evidence exists."
    : EDITORIAL_OWNER.note;
  const reviewStatus = locale === "en" ? "Internal editorial review" : EDITORIAL_REVIEW_STATUS;
  const updateFrequency = locale === "en"
    ? "Planned review when blueprints, official documentation, or curriculum dependencies change."
    : EDITORIAL_UPDATE_FREQUENCY;
  return <PublicShell active="methodology" locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p>
        <h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>

        <section><h2>{text.author}</h2><p>{EDITORIAL_OWNER.name}: {ownerRole}. {ownerNote}</p></section>
        <section><h2>{text.sources}</h2><ul>{methodologyReferences.map((reference) => <li key={reference.href}><a href={reference.href} rel="noreferrer">{reference.label}</a></li>)}</ul></section>
        <section><h2>{text.certification}</h2><p>{locale === "en" ? "Blueprints guide coverage; they are not copied as exams. Associate and Professional are learning paths and milestones." : "Los blueprints guian cobertura; no se copian como examenes. Associate y Professional son rutas e hitos de aprendizaje."}</p></section>
        <section><h2>{text.review}</h2><p>{locale === "en" ? `Current status: ${reviewStatus}. External reviewers are not claimed without public evidence.` : `Estado actual: ${reviewStatus}. No se declaran revisores externos sin evidencia publica.`}</p></section>
        <section><h2>{text.updates}</h2><p>{updateFrequency} {locale === "en" ? "Editorial version" : "Version editorial"}: {CONTENT_VERSION_LABEL}. {locale === "en" ? "Global review" : "Revision global"}: {reviewDate}.</p></section>
        <section><h2>{text.duration}</h2><p>{localizeDurationMethod(locale)}</p></section>
        <section><h2>{text.limits}</h2><p>{locale === "en" ? "Lakehouse Lab is independent from Databricks. Internal practice exams are not official exams and do not guarantee passing." : "Lakehouse Lab es independiente de Databricks. Los simulacros internos no son examenes oficiales ni garantizan aprobar."}</p></section>
        <section><h2>{text.report}</h2><p><a href={PROJECT_ISSUES_URL} rel="noreferrer">GitHub Issues</a> · <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">{PROJECT_REPOSITORY_URL}</a></p></section>
      </article>
    </main>
  </PublicShell>;
}

import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { moduleSummaries } from "../enterprise/curriculum";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Databricks Data Engineer Associate",
    description: locale === "en"
      ? "Independent preparation for Databricks Certified Data Engineer Associate with modules, labs, and an internal practice exam."
      : "Preparación independiente para Databricks Certified Data Engineer Associate con módulos, laboratorios y simulacro interno.",
    alternates: { canonical: "/associate" },
  };
}

const associateText: Record<Locale, {
  kicker: string;
  lead: string;
  viewModules: string;
  openExam: string;
  summaryAria: string;
  cards: Array<{ label: string; title: string; body: string }>;
  planKicker: string;
  planTitle: string;
  planBody: string;
}> = {
  es: {
    kicker: "Certificacion objetivo",
    lead: "Prepara los fundamentos de plataforma, Delta Lake, transformacion, ingesta, Jobs, Unity Catalog y CI/CD esencial con lecciones, laboratorios y un simulacro interno.",
    viewModules: "Ver modulos Associate",
    openExam: "Abrir simulacro",
    summaryAria: "Resumen Associate",
    cards: [
      { label: "Temario", title: "12 modulos troncales", body: "El tramo Associate cubre los dominios base antes de avanzar a Professional." },
      { label: "Practica", title: "Laboratorios guiados", body: "Cada modulo incluye una practica autocontenida con evidencias de aprendizaje." },
      { label: "Medicion", title: "Simulacro interno", body: "El resultado se desglosa por dominio y no equivale al examen oficial." },
    ],
    planKicker: "Plan Associate",
    planTitle: "Modulos incluidos.",
    planBody: "Lee sin registro o crea tu espacio privado para conservar avance, resultados y repasos.",
  },
  en: {
    kicker: "Target certification",
    lead: "Prepare platform foundations, Delta Lake, transformation, ingestion, Jobs, Unity Catalog, and essential CI/CD with lessons, labs, and an internal practice exam.",
    viewModules: "View Associate modules",
    openExam: "Open practice exam",
    summaryAria: "Associate summary",
    cards: [
      { label: "Curriculum", title: "12 core modules", body: "The Associate section covers the base domains before moving into Professional topics." },
      { label: "Practice", title: "Guided labs", body: "Each module includes a self-contained practice with learning evidence." },
      { label: "Measurement", title: "Internal practice exam", body: "Results are broken down by domain and are not equivalent to the official exam." },
    ],
    planKicker: "Associate plan",
    planTitle: "Included modules.",
    planBody: "Read without signing up or create a private workspace to keep progress, scores, and reviews.",
  },
};

export default async function AssociatePage() {
  const locale = await getRequestLocale();
  const text = associateText[locale];
  const modules = moduleSummaries(locale).filter((module) => module.level.includes("Associate"));
  return <PublicShell active="route" locale={locale}>
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="associate-heading">
        <p className="public-kicker">{text.kicker}</p>
        <h1 id="associate-heading">Databricks Data Engineer Associate</h1>
        <p className="public-document-lead">{text.lead}</p>
        <div className="public-actions"><Link className="public-primary" href="/catalogo?level=associate">{text.viewModules}<span aria-hidden="true">→</span></Link><Link className="public-secondary" href="/simulacro/associate">{text.openExam}</Link></div>
      </section>
      <section className="public-cert-grid" aria-label={text.summaryAria}>
        {text.cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.title}</strong><p>{card.body}</p></article>)}
      </section>
      <section className="public-section public-module-list" aria-labelledby="associate-modules-heading">
        <div className="public-section-heading"><p className="public-kicker">{text.planKicker}</p><h2 id="associate-modules-heading">{text.planTitle}</h2><p>{text.planBody}</p></div>
        <ol>{modules.slice(0, 12).map((module) => <li key={module.id} className={`public-artwork-${module.artwork.tone}`}><span>{module.number}</span><div><b><Link href={`/curso/${module.slug}`}>{module.title}</Link></b><p>{module.description}</p></div></li>)}</ol>
      </section>
    </main>
  </PublicShell>;
}

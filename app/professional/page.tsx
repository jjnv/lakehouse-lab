import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { moduleSummaries } from "../enterprise/curriculum";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Databricks Data Engineer Professional",
    description: locale === "en"
      ? "Independent preparation for Databricks Certified Data Engineer Professional with streaming, operations, performance, security, and an internal practice exam."
      : "Preparación independiente para Databricks Certified Data Engineer Professional con streaming, operación, rendimiento, seguridad y simulacro interno.",
    alternates: { canonical: "/professional" },
  };
}

const professionalText: Record<Locale, {
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
    lead: "Amplia Associate con streaming, CDC, Lakeflow, observabilidad, rendimiento, costes, gobierno avanzado, despliegue y defensa tecnica de arquitecturas lakehouse.",
    viewModules: "Ver modulos Professional",
    openExam: "Abrir simulacro",
    summaryAria: "Resumen Professional",
    cards: [
      { label: "Temario", title: "32 modulos", body: "Incluye el tramo Associate y anade dominios avanzados de operacion, streaming y entrega." },
      { label: "Practica", title: "Laboratorios y capstone", body: "Las practicas obligan a justificar decisiones, evidencias y recuperacion ante fallos." },
      { label: "Medicion", title: "Simulacro Professional", body: "El desglose por dominio ayuda a decidir que repasar antes del examen oficial." },
    ],
    planKicker: "Plan Professional",
    planTitle: "Todo el itinerario.",
    planBody: "Professional se apoya en los fundamentos Associate y anade practica transversal de produccion.",
  },
  en: {
    kicker: "Target certification",
    lead: "Extend Associate foundations with streaming, CDC, Lakeflow, observability, performance, cost, advanced governance, deployment, and technical defense of lakehouse architectures.",
    viewModules: "View Professional modules",
    openExam: "Open practice exam",
    summaryAria: "Professional summary",
    cards: [
      { label: "Curriculum", title: "32 modules", body: "Includes the Associate section and adds advanced operation, streaming, and delivery domains." },
      { label: "Practice", title: "Labs and capstone", body: "Practices require decisions, evidence, and failure recovery." },
      { label: "Measurement", title: "Professional practice exam", body: "Domain breakdowns help decide what to review before the official exam." },
    ],
    planKicker: "Professional plan",
    planTitle: "The full itinerary.",
    planBody: "Professional builds on Associate foundations and adds cross-cutting production practice.",
  },
};

export default async function ProfessionalPage() {
  const locale = await getRequestLocale();
  const text = professionalText[locale];
  const modules = moduleSummaries(locale);
  return <PublicShell active="route" locale={locale}>
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="professional-heading">
        <p className="public-kicker">{text.kicker}</p>
        <h1 id="professional-heading">Databricks Data Engineer Professional</h1>
        <p className="public-document-lead">{text.lead}</p>
        <div className="public-actions"><Link className="public-primary" href="/catalogo?level=professional">{text.viewModules}<span aria-hidden="true">→</span></Link><Link className="public-secondary" href="/simulacro/professional">{text.openExam}</Link></div>
      </section>
      <section className="public-cert-grid" aria-label={text.summaryAria}>
        {text.cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.title}</strong><p>{card.body}</p></article>)}
      </section>
      <section className="public-section public-module-list" aria-labelledby="professional-modules-heading">
        <div className="public-section-heading"><p className="public-kicker">{text.planKicker}</p><h2 id="professional-modules-heading">{text.planTitle}</h2><p>{text.planBody}</p></div>
        <ol>{modules.map((module) => <li key={module.id} className={`public-artwork-${module.artwork.tone}`}><span>{module.number}</span><div><b><Link href={`/curso/${module.slug}`}>{module.title}</Link></b><p>{module.description}</p></div></li>)}</ol>
      </section>
    </main>
  </PublicShell>;
}

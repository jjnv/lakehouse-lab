import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
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
  note: string;
}> = {
  es: {
    kicker: "Objetivo Associate",
    lead: "Recorre los fundamentos de plataforma, Delta Lake, transformación, ingesta, Jobs, Unity Catalog y CI/CD esencial con lecciones y laboratorios guiados.",
    viewModules: "Ver itinerario Associate",
    openExam: "Abrir simulacro interno",
    note: "Preparación independiente. El simulacro sirve para detectar áreas de repaso y no equivale al examen oficial.",
  },
  en: {
    kicker: "Associate goal",
    lead: "Cover platform foundations, Delta Lake, transformation, ingestion, Jobs, Unity Catalog, and essential CI/CD through lessons and guided labs.",
    viewModules: "View the Associate path",
    openExam: "Open internal practice exam",
    note: "Independent preparation. The practice exam helps identify review areas and is not equivalent to the official exam.",
  },
};

export default async function AssociatePage() {
  const locale = await getRequestLocale();
  const text = associateText[locale];

  return (
    <PublicShell active="route" locale={locale}>
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="associate-heading">
          <p className="public-kicker">{text.kicker}</p>
          <h1 id="associate-heading">Databricks Data Engineer Associate</h1>
          <p className="public-document-lead">{text.lead}</p>
          <div className="public-actions">
            <Link className="public-primary" href="/catalogo?level=associate">{text.viewModules}<span aria-hidden="true">→</span></Link>
            <Link className="public-secondary" href="/simulacro/associate">{text.openExam}</Link>
          </div>
          <p className="public-trust">{text.note}</p>
        </section>
      </main>
    </PublicShell>
  );
}

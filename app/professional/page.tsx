import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
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
  note: string;
}> = {
  es: {
    kicker: "Objetivo Professional",
    lead: "Conecta fundamentos Associate con streaming, CDC, Lakeflow, observabilidad, rendimiento, costes, gobierno, despliegue y defensa técnica a lo largo de 32 módulos.",
    viewModules: "Ver los 32 módulos",
    openExam: "Abrir simulacro interno",
    note: "Preparación independiente. El simulacro orienta el repaso y no garantiza resultados en una certificación externa.",
  },
  en: {
    kicker: "Professional goal",
    lead: "Connect Associate foundations with streaming, CDC, Lakeflow, observability, performance, cost, governance, deployment, and technical defense across 32 modules.",
    viewModules: "View all 32 modules",
    openExam: "Open internal practice exam",
    note: "Independent preparation. The practice exam guides review and does not guarantee results in an external certification.",
  },
};

export default async function ProfessionalPage() {
  const locale = await getRequestLocale();
  const text = professionalText[locale];

  return (
    <PublicShell active="route" locale={locale}>
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="professional-heading">
          <p className="public-kicker">{text.kicker}</p>
          <h1 id="professional-heading">Databricks Data Engineer Professional</h1>
          <p className="public-document-lead">{text.lead}</p>
          <div className="public-actions">
            <Link className="public-primary" href="/catalogo">{text.viewModules}<span aria-hidden="true">→</span></Link>
            <Link className="public-secondary" href="/simulacro/professional">{text.openExam}</Link>
          </div>
          <p className="public-trust">{text.note}</p>
        </section>
      </main>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { moduleSummaries } from "../enterprise/curriculum";

export const metadata: Metadata = {
  title: "Databricks Data Engineer Professional",
  description: "Preparación independiente en español para Databricks Certified Data Engineer Professional con streaming, operación, rendimiento, seguridad y simulacro interno.",
  alternates: { canonical: "/professional" },
  openGraph: {
    title: "Preparación Databricks Data Engineer Professional",
    description: "Lecciones, laboratorios y simulacro interno centrados en los dominios Professional.",
    url: "/professional",
  },
};

export default function ProfessionalPage() {
  const modules = moduleSummaries();
  return <PublicShell active="professional">
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="professional-heading">
        <p className="public-kicker">Certificación objetivo</p>
        <h1 id="professional-heading">Databricks Data Engineer Professional</h1>
        <p className="public-document-lead">Amplía Associate con streaming, CDC, Lakeflow, observabilidad, rendimiento, costes, gobierno avanzado, despliegue y defensa técnica de arquitecturas lakehouse.</p>
        <div className="public-actions"><Link className="public-primary" href="/catalogo?level=professional">Ver módulos Professional<span aria-hidden="true">→</span></Link><Link className="public-secondary" href="/simulacro/professional">Abrir simulacro</Link></div>
      </section>
      <section className="public-cert-grid" aria-label="Resumen Professional">
        <article><span>Temario</span><strong>32 módulos</strong><p>Incluye el tramo Associate y añade dominios avanzados de operación, streaming y entrega.</p></article>
        <article><span>Práctica</span><strong>Laboratorios y capstone</strong><p>Las prácticas obligan a justificar decisiones, evidencias y recuperación ante fallos.</p></article>
        <article><span>Medición</span><strong>Simulacro Professional</strong><p>El desglose por dominio ayuda a decidir qué repasar antes del examen oficial.</p></article>
      </section>
      <section className="public-section public-module-list" aria-labelledby="professional-modules-heading">
        <div className="public-section-heading"><p className="public-kicker">Plan Professional</p><h2 id="professional-modules-heading">Todo el itinerario.</h2><p>Professional se apoya en los fundamentos Associate y añade práctica transversal de producción.</p></div>
        <ol>{modules.map((module) => <li key={module.id} className={`public-artwork-${module.artwork.tone}`}><span>{module.number}</span><div><b><Link href={`/curso/${module.slug}`}>{module.title}</Link></b><p>{module.description}</p></div></li>)}</ol>
      </section>
    </main>
  </PublicShell>;
}

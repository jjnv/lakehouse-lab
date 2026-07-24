import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { moduleSummaries } from "../enterprise/curriculum";

export const metadata: Metadata = {
  title: "Databricks Data Engineer Associate",
  description: "Preparación independiente en español para Databricks Certified Data Engineer Associate con módulos, laboratorios y simulacro interno.",
  alternates: { canonical: "/associate" },
  openGraph: {
    title: "Preparación Databricks Data Engineer Associate",
    description: "Lecciones, laboratorios y simulacro interno centrados en los dominios Associate.",
    url: "/associate",
  },
};

export default function AssociatePage() {
  const modules = moduleSummaries().filter((module) => module.level.includes("Associate"));
  return <PublicShell active="associate">
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="associate-heading">
        <p className="public-kicker">Certificación objetivo</p>
        <h1 id="associate-heading">Databricks Data Engineer Associate</h1>
        <p className="public-document-lead">Prepara los fundamentos de plataforma, Delta Lake, transformación, ingesta, Jobs, Unity Catalog y CI/CD esencial con contenido en español, laboratorios y un simulacro interno.</p>
        <div className="public-actions"><Link className="public-primary" href="/catalogo?level=associate">Ver módulos Associate<span aria-hidden="true">→</span></Link><Link className="public-secondary" href="/simulacro/associate">Abrir simulacro</Link></div>
      </section>
      <section className="public-cert-grid" aria-label="Resumen Associate">
        <article><span>Temario</span><strong>12 módulos troncales</strong><p>El tramo Associate cubre los dominios base antes de avanzar a Professional.</p></article>
        <article><span>Práctica</span><strong>Laboratorios guiados</strong><p>Cada módulo incluye una práctica autocontenida con evidencias de aprendizaje.</p></article>
        <article><span>Medición</span><strong>Simulacro interno</strong><p>El resultado se desglosa por dominio y no equivale al examen oficial.</p></article>
      </section>
      <section className="public-section public-module-list" aria-labelledby="associate-modules-heading">
        <div className="public-section-heading"><p className="public-kicker">Plan Associate</p><h2 id="associate-modules-heading">Módulos incluidos.</h2><p>Lee sin registro o crea tu espacio privado para conservar avance, resultados y repasos.</p></div>
        <ol>{modules.slice(0, 12).map((module) => <li key={module.id} className={`public-artwork-${module.artwork.tone}`}><span>{module.number}</span><div><b><Link href={`/curso/${module.slug}`}>{module.title}</Link></b><p>{module.description}</p></div></li>)}</ol>
      </section>
    </main>
  </PublicShell>;
}

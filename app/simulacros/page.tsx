import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";

export const metadata: Metadata = {
  title: "Simulacros Databricks Data Engineer",
  description: "Simulacros internos de preparación para Databricks Data Engineer Associate y Professional, corregidos en servidor y con revisión por dominio.",
  alternates: { canonical: "/simulacros" },
  openGraph: {
    title: "Simulacros internos Associate y Professional",
    description: "Practica con resultados privados por dominio. No equivalen al examen oficial.",
    url: "/simulacros",
  },
};

export default function SimulacrosPage() {
  return <PublicShell active="simulacros">
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="simulacros-heading">
        <p className="public-kicker">Evaluación formativa</p>
        <h1 id="simulacros-heading">Simulacros internos Associate y Professional</h1>
        <p className="public-document-lead">Mide preparación por dominio con preguntas originales y corrección en servidor. Los resultados son privados y no garantizan aprobar un examen oficial.</p>
      </section>
      <section className="public-cert-grid" aria-label="Simulacros disponibles">
        <article><span>Associate</span><strong>Fundamentos de Data Engineering</strong><p>Para revisar el tramo Associate antes de avanzar o presentarte al examen.</p><Link className="public-secondary" href="/simulacro/associate">Ver simulacro</Link></article>
        <article><span>Professional</span><strong>Arquitectura y operación avanzada</strong><p>Para practicar decisiones transversales de streaming, rendimiento, gobierno y entrega.</p><Link className="public-secondary" href="/simulacro/professional">Ver simulacro</Link></article>
        <article><span>Privacidad</span><strong>Intentos protegidos</strong><p>Para responder necesitas crear un espacio privado. Las claves no llegan al navegador antes de la corrección.</p><Link className="public-secondary" href="/entrar?return_to=%2Fsimulacro%2Fprofessional">Crear espacio</Link></article>
      </section>
    </main>
  </PublicShell>;
}

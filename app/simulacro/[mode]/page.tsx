import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../components/enterprise/AppShell";
import PublicShell from "../../components/public/PublicShell";
import SimulatorWorkspace from "../../components/enterprise/SimulatorWorkspace";
import { getOptionalEnterprisePageContext } from "../../components/enterprise/getShellContext";

function validMode(mode: string): mode is "associate" | "professional" {
  return mode === "associate" || mode === "professional";
}

export async function generateMetadata({ params }: { params: Promise<{ mode: string }> }): Promise<Metadata> {
  const { mode } = await params;
  if (!validMode(mode)) return {};
  const label = mode === "associate" ? "Associate" : "Professional";
  return {
    title: `Simulacro ${label}`,
    description: `Simulacro interno de preparación para Databricks Data Engineer ${label}, corregido en servidor y con revisión por dominio.`,
    alternates: { canonical: `/simulacro/${mode}` },
    openGraph: {
      title: `Simulacro interno Databricks Data Engineer ${label}`,
      description: "Práctica formativa independiente. No equivale al examen oficial.",
      url: `/simulacro/${mode}`,
    },
  };
}

export default async function SimulacroPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!validMode(mode)) notFound();
  const context = await getOptionalEnterprisePageContext();
  const label = mode === "associate" ? "Associate" : "Professional";
  if (!context.learner) {
    const returnTo = encodeURIComponent(`/simulacro/${mode}`);
    return <PublicShell active="simulacros" accountHref={`/entrar?return_to=${returnTo}`} accountLabel="Crear espacio">
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="simulator-public-heading">
          <p className="public-kicker">Simulacro interno</p>
          <h1 id="simulator-public-heading">Databricks Data Engineer {label}</h1>
          <p className="public-document-lead">Practica con preguntas originales alineadas a los dominios de certificación. Para responder necesitas un espacio privado: las respuestas se corrigen en el servidor y las claves no llegan al navegador antes de la corrección.</p>
          <div className="public-actions"><a className="public-primary" href={`/entrar?return_to=${returnTo}`}>Crear espacio e iniciar<span aria-hidden="true">→</span></a><a className="public-secondary" href={mode === "associate" ? "/associate" : "/professional"}>Ver plan {label}</a></div>
        </section>
        <section className="public-cert-grid" aria-label="Condiciones del simulacro">
          <article><span>Uso</span><strong>Preparación formativa</strong><p>No equivale al examen oficial ni garantiza un resultado externo.</p></article>
          <article><span>Corrección</span><strong>Servidor</strong><p>El intento se guarda con sesión privada y revisión por dominio.</p></article>
          <article><span>Repetición</span><strong>Sin límite interno</strong><p>Puedes practicar de nuevo; el mejor resultado se conserva.</p></article>
        </section>
      </main>
    </PublicShell>;
  }
  return <AppShell active="learning" eyebrow="Evaluación interna" title={`Simulacro ${mode === "associate" ? "Associate" : "Professional"}`} brand={context.brand} userDisplayName={context.userDisplayName}><SimulatorWorkspace mode={mode} /></AppShell>;
}

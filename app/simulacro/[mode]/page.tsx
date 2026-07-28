import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../components/enterprise/AppShell";
import PublicShell from "../../components/public/PublicShell";
import SimulatorWorkspace from "../../components/enterprise/SimulatorWorkspace";
import { getOptionalEnterprisePageContext } from "../../components/enterprise/getShellContext";
import type { Locale } from "../../i18n/config";
import { getRequestLocale } from "../../i18n/server";

function validMode(mode: string): mode is "associate" | "professional" {
  return mode === "associate" || mode === "professional";
}

export async function generateMetadata({ params }: { params: Promise<{ mode: string }> }): Promise<Metadata> {
  const { mode } = await params;
  if (!validMode(mode)) return {};
  const locale = await getRequestLocale();
  const label = mode === "associate" ? "Associate" : "Professional";
  return {
    title: locale === "en" ? `${label} Practice Exam` : `Simulacro ${label}`,
    description: locale === "en"
      ? `Internal preparation practice exam for Databricks Data Engineer ${label}, scored on the server with domain review.`
      : `Simulacro interno de preparación para Databricks Data Engineer ${label}, corregido en servidor con revisión por dominio.`,
    alternates: { canonical: `/simulacro/${mode}` },
  };
}

const publicSimulatorText: Record<Locale, {
  account: string;
  kicker: string;
  lead: string;
  start: string;
  plan: (label: string) => string;
  conditions: string;
  cards: Array<{ label: string; title: string; body: string }>;
  eyebrow: string;
  title: (mode: string) => string;
}> = {
  es: {
    account: "Crear espacio",
    kicker: "Simulacro interno",
    lead: "Practica con preguntas originales alineadas a los dominios de certificacion. Para responder necesitas un espacio privado: las respuestas se corrigen en el servidor y las claves no llegan al navegador antes de la correccion.",
    start: "Crear espacio e iniciar",
    plan: (label) => `Ver plan ${label}`,
    conditions: "Condiciones del simulacro",
    cards: [
      { label: "Uso", title: "Preparacion formativa", body: "No equivale al examen oficial ni garantiza un resultado externo." },
      { label: "Correccion", title: "Servidor", body: "El intento se guarda con sesion privada y revision por dominio." },
      { label: "Repeticion", title: "Sin limite interno", body: "Puedes practicar de nuevo; el mejor resultado se conserva." },
    ],
    eyebrow: "Evaluacion interna",
    title: (mode) => `Simulacro ${mode === "associate" ? "Associate" : "Professional"}`,
  },
  en: {
    account: "Create workspace",
    kicker: "Internal practice exam",
    lead: "Practice with original questions aligned to certification domains. Answering requires a private workspace: responses are scored on the server and answer keys never reach the browser before scoring.",
    start: "Create workspace and start",
    plan: (label) => `View ${label} plan`,
    conditions: "Practice exam conditions",
    cards: [
      { label: "Use", title: "Formative preparation", body: "Not equivalent to the official exam and does not guarantee an external result." },
      { label: "Scoring", title: "Server-side", body: "The attempt is saved with a private session and reviewed by domain." },
      { label: "Retakes", title: "No internal limit", body: "You can practice again; the best result is preserved." },
    ],
    eyebrow: "Internal assessment",
    title: (mode) => `${mode === "associate" ? "Associate" : "Professional"} Practice Exam`,
  },
};

export default async function SimulacroPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!validMode(mode)) notFound();
  const context = await getOptionalEnterprisePageContext();
  const locale = context.locale;
  const text = publicSimulatorText[locale];
  const label = mode === "associate" ? "Associate" : "Professional";
  if (!context.learner) {
    const returnTo = encodeURIComponent(`/simulacro/${mode}`);
    return <PublicShell active="simulacros" accountHref={`/entrar?return_to=${returnTo}`} accountLabel={text.account} locale={locale}>
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="simulator-public-heading">
          <p className="public-kicker">{text.kicker}</p>
          <h1 id="simulator-public-heading">Databricks Data Engineer {label}</h1>
          <p className="public-document-lead">{text.lead}</p>
          <div className="public-actions"><a className="public-primary" href={`/entrar?return_to=${returnTo}`}>{text.start}<span aria-hidden="true">→</span></a><a className="public-secondary" href={mode === "associate" ? "/associate" : "/professional"}>{text.plan(label)}</a></div>
        </section>
        <section className="public-cert-grid" aria-label={text.conditions}>
          {text.cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.title}</strong><p>{card.body}</p></article>)}
        </section>
      </main>
    </PublicShell>;
  }
  return <AppShell active="learning" eyebrow={text.eyebrow} title={text.title(mode)} brand={context.brand} userDisplayName={context.userDisplayName} locale={locale}><SimulatorWorkspace mode={mode} locale={locale} /></AppShell>;
}

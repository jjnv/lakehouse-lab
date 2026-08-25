import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Databricks Data Engineer Practice Exams" : "Simulacros Databricks Data Engineer",
    description: locale === "en"
      ? "Internal Databricks Data Engineer Associate and Professional practice exams, scored on the server with domain review."
      : "Simulacros internos Databricks Data Engineer Associate y Professional, corregidos en servidor con revisión por dominio.",
    alternates: { canonical: "/simulacros" },
  };
}

const simulatorListText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  available: string;
  open: string;
  privacyNote: string;
  cards: Array<{ label: string; title: string; body: string; href: string }>;
}> = {
  es: {
    kicker: "Evaluación formativa",
    title: "Elige un simulacro",
    lead: "Practica con preguntas originales y revisa el resultado por dominio. Estos simulacros internos no equivalen a un examen oficial.",
    available: "Simulacros disponibles",
    open: "Ver simulacro",
    privacyNote: "Necesitas un espacio privado para responder. Las claves se corrigen en el servidor y no se muestran antes de enviar el intento.",
    cards: [
      { label: "Associate", title: "Fundamentos de Data Engineering", body: "Revisa los dominios troncales antes de avanzar o decidir si necesitas más práctica.", href: "/simulacro/associate" },
      { label: "Professional", title: "Arquitectura y operación avanzada", body: "Practica decisiones de streaming, rendimiento, gobierno, operación y entrega.", href: "/simulacro/professional" },
    ],
  },
  en: {
    kicker: "Formative assessment",
    title: "Choose a practice exam",
    lead: "Practice with original questions and review results by domain. These internal practice exams are not equivalent to an official exam.",
    available: "Available practice exams",
    open: "View practice exam",
    privacyNote: "You need a private workspace to answer. Keys are scored on the server and are not shown before you submit the attempt.",
    cards: [
      { label: "Associate", title: "Data Engineering foundations", body: "Review the core domains before moving ahead or deciding whether you need more practice.", href: "/simulacro/associate" },
      { label: "Professional", title: "Advanced architecture and operations", body: "Practice decisions across streaming, performance, governance, operations, and delivery.", href: "/simulacro/professional" },
    ],
  },
};

export default async function SimulacrosPage() {
  const locale = await getRequestLocale();
  const text = simulatorListText[locale];

  return (
    <PublicShell active="simulacros" locale={locale}>
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="simulacros-heading">
          <p className="public-kicker">{text.kicker}</p>
          <h1 id="simulacros-heading">{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>
        </section>
        <section className="public-route-grid" aria-label={text.available}>
          {text.cards.map((card) => (
            <article key={card.label}>
              <header>
                <span>{card.label}</span>
                <h2>{card.title}</h2>
              </header>
              <p>{card.body}</p>
              <Link className="public-secondary" href={card.href}>{text.open}<span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </section>
        <p className="public-trust">{text.privacyNote}</p>
      </main>
    </PublicShell>
  );
}

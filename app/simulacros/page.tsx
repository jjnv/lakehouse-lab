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
  create: string;
  cards: Array<{ label: string; title: string; body: string; href: string }>;
}> = {
  es: {
    kicker: "Evaluacion formativa",
    title: "Simulacros internos Associate y Professional",
    lead: "Mide preparacion por dominio con preguntas originales y correccion en servidor. Los resultados son privados y no garantizan aprobar un examen oficial.",
    available: "Simulacros disponibles",
    open: "Ver simulacro",
    create: "Crear espacio",
    cards: [
      { label: "Associate", title: "Fundamentos de Data Engineering", body: "Para revisar el tramo Associate antes de avanzar o presentarte al examen.", href: "/simulacro/associate" },
      { label: "Professional", title: "Arquitectura y operacion avanzada", body: "Para practicar decisiones transversales de streaming, rendimiento, gobierno y entrega.", href: "/simulacro/professional" },
      { label: "Privacidad", title: "Intentos protegidos", body: "Para responder necesitas crear un espacio privado. Las claves no llegan al navegador antes de la correccion.", href: "/entrar?return_to=%2Fsimulacro%2Fprofessional" },
    ],
  },
  en: {
    kicker: "Formative assessment",
    title: "Internal Associate and Professional practice exams",
    lead: "Measure readiness by domain with original questions scored on the server. Results are private and do not guarantee passing an official exam.",
    available: "Available practice exams",
    open: "View practice exam",
    create: "Create workspace",
    cards: [
      { label: "Associate", title: "Data Engineering fundamentals", body: "Review the Associate section before moving ahead or sitting the exam.", href: "/simulacro/associate" },
      { label: "Professional", title: "Advanced architecture and operations", body: "Practice cross-domain decisions for streaming, performance, governance, and delivery.", href: "/simulacro/professional" },
      { label: "Privacy", title: "Protected attempts", body: "Answering requires a private workspace. Answer keys never reach the browser before scoring.", href: "/entrar?return_to=%2Fsimulacro%2Fprofessional" },
    ],
  },
};

export default async function SimulacrosPage() {
  const locale = await getRequestLocale();
  const text = simulatorListText[locale];
  return <PublicShell active="simulacros" locale={locale}>
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="simulacros-heading">
        <p className="public-kicker">{text.kicker}</p>
        <h1 id="simulacros-heading">{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>
      </section>
      <section className="public-cert-grid" aria-label={text.available}>
        {text.cards.map((card, index) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
            <Link className="public-secondary" href={card.href}>{index === 2 ? text.create : text.open}</Link>
          </article>
        ))}
      </section>
    </main>
  </PublicShell>;
}

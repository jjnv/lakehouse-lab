import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_REVIEW_DATE_EN, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Privacy" : "Privacidad",
    description: locale === "en"
      ? "Privacy and personal progress controls in Lakehouse Lab."
      : "Privacidad y controles del progreso personal en Lakehouse Lab.",
    alternates: { canonical: "/privacidad" },
  };
}

const privacyText: Record<Locale, {
  kicker: string;
  title: string;
  lead: (date: string) => string;
  sections: Array<{ title: string; body: string }>;
  controlsTitle: string;
  controls: string[];
  settings: string;
  contactTitle: string;
  contact: string;
  security: string;
}> = {
  es: {
    kicker: "Privacidad",
    title: "Tu progreso te pertenece.",
    lead: (date) => `Nota operativa sobre datos y controles. Última actualización: ${date}.`,
    sections: [
      { title: "Alcance", body: "Cubre la web pública, el temario, los recursos y el espacio personal de preparación." },
      { title: "Datos tratados", body: "Usamos un identificador anónimo en cookie privada, progreso, resultados, preferencias y datos técnicos mínimos de integridad." },
      { title: "Infraestructura", body: "El sitio corre en Vercel y guarda progreso en Turso. La identidad se resuelve en servidor; no se acepta un userId enviado por el navegador." },
      { title: "Conservación", body: "El progreso se conserva mientras usas el espacio. Puedes exportarlo, borrarlo y rotar o revocar códigos de recuperación." },
    ],
    controlsTitle: "Tus controles",
    controls: ["Exportar progreso", "Generar o revocar código de recuperación", "Eliminar actividad con confirmación reforzada", "Navegar sin nombre ni correo"],
    settings: "Abrir controles de datos",
    contactTitle: "Contacto",
    contact: "Para incidencias generales usa GitHub Issues.",
    security: "Para vulnerabilidades usa GitHub Security Advisories.",
  },
  en: {
    kicker: "Privacy",
    title: "Your progress belongs to you.",
    lead: (date) => `Operational note about data and controls. Last updated: ${date}.`,
    sections: [
      { title: "Scope", body: "Covers the public website, curriculum, resources, and personal preparation workspace." },
      { title: "Data processed", body: "We use an anonymous identifier in a private cookie, progress, results, preferences, and minimal technical integrity data." },
      { title: "Infrastructure", body: "The site runs on Vercel and stores progress in Turso. Identity is resolved server-side; a browser-sent userId is not accepted." },
      { title: "Retention", body: "Progress is retained while you use the workspace. You can export it, delete it, and rotate or revoke recovery codes." },
    ],
    controlsTitle: "Your controls",
    controls: ["Export progress", "Generate or revoke a recovery code", "Delete activity with reinforced confirmation", "Use the site without name or email"],
    settings: "Open data controls",
    contactTitle: "Contact",
    contact: "Use GitHub Issues for general project issues.",
    security: "Use GitHub Security Advisories for vulnerabilities.",
  },
};

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const text = privacyText[locale];
  const reviewDate = locale === "en" ? CONTENT_REVIEW_DATE_EN : CONTENT_REVIEW_DATE;
  return <PublicShell active="privacy" locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p><h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead(reviewDate)}</p>
        {text.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
        <section><h2>{text.controlsTitle}</h2><ul>{text.controls.map((control) => <li key={control}>{control}</li>)}</ul><p><a href="/ajustes">{text.settings}</a></p></section>
        <section><h2>{text.contactTitle}</h2><p>{text.contact} <a href={PROJECT_ISSUES_URL} rel="noreferrer">GitHub Issues</a>.</p><p>{text.security} <a href={`${PROJECT_REPOSITORY_URL}/security/advisories/new`} rel="noreferrer">Security Advisories</a>.</p></section>
      </article>
    </main>
  </PublicShell>;
}

import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_REVIEW_DATE_EN } from "../project-info";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Terms" : "Términos",
    description: locale === "en"
      ? "Lakehouse Lab terms of use and limits for internal practice exams."
      : "Condiciones de uso de Lakehouse Lab y límites de los simulacros internos.",
    alternates: { canonical: "/terminos" },
  };
}

const termsText: Record<Locale, {
  kicker: string;
  title: string;
  lead: (date: string) => string;
  sections: Array<{ title: string; body: string }>;
}> = {
  es: {
    kicker: "Condiciones de uso",
    title: "Aprendizaje independiente, sin promesas engañosas.",
    lead: (date) => `Condiciones del servicio público de Lakehouse Lab. Última actualización: ${date}.`,
    sections: [
      { title: "Naturaleza del proyecto", body: "Lakehouse Lab es educativo, personal e independiente. No es un producto oficial ni formación oficial de Databricks." },
      { title: "Uso permitido", body: "Puedes usarlo para aprendizaje, evaluación formativa y práctica técnica. No puedes acceder a datos ajenos, abusar del servicio ni distribuir preguntas como dumps." },
      { title: "Contenido y certificaciones", body: "El temario se actualiza de buena fe, pero productos y exámenes cambian. Ninguna puntuación garantiza aprobar." },
      { title: "Constancia interna", body: "La constancia registra requisitos internos de Lakehouse Lab. No es una certificación proctorizada ni expedida por Databricks." },
      { title: "Disponibilidad y marcas", body: "La plataforma puede cambiar para corregir errores o mantener seguridad. Las marcas de terceros pertenecen a sus titulares." },
    ],
  },
  en: {
    kicker: "Terms of use",
    title: "Independent learning, no misleading promises.",
    lead: (date) => `Terms for the public Lakehouse Lab service. Last updated: ${date}.`,
    sections: [
      { title: "Project nature", body: "Lakehouse Lab is educational, personal, and independent. It is not an official Databricks product or official training." },
      { title: "Permitted use", body: "Use it for learning, formative assessment, and technical practice. Do not access other people's data, abuse the service, or distribute questions as exam dumps." },
      { title: "Content and certifications", body: "The curriculum is updated in good faith, but products and exams change. No score guarantees passing." },
      { title: "Internal certificate", body: "The certificate records Lakehouse Lab internal requirements. It is not proctored and is not issued by Databricks." },
      { title: "Availability and trademarks", body: "The platform may change to fix issues or preserve security. Third-party trademarks belong to their owners." },
    ],
  },
};

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const text = termsText[locale];
  const reviewDate = locale === "en" ? CONTENT_REVIEW_DATE_EN : CONTENT_REVIEW_DATE;
  return <PublicShell active="terms" locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p><h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead(reviewDate)}</p>
        {text.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
      </article>
    </main>
  </PublicShell>;
}

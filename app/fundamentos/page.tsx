import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import InlineText from "../components/InlineText";
import { modules } from "../course-data";
import { foundationChapters, foundationNextSteps, type FoundationExample } from "../curriculum/foundations";
import { glossaryEntryById } from "../curriculum/glossary";
import { localizeModule } from "../i18n/curriculum";
import type { Locale } from "../i18n/config";
import { getRequestLocale } from "../i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Data Foundations" : "Fundamentos de datos",
    description: locale === "en"
      ? "A step-by-step introduction to data, files, SQL, distributed processing, data lakes, warehouses and the lakehouse before starting the curriculum."
      : "Introducción paso a paso a datos, archivos, SQL, procesamiento distribuido, data lake, warehouse y lakehouse antes de empezar el temario.",
    alternates: { canonical: "/fundamentos" },
  };
}

const pageText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  howTo: string[];
  tocLabel: string;
  chapter: string;
  goal: string;
  analogy: string;
  oneLiner: string;
  glossary: string;
  deeper: string;
  check: string;
  showAnswer: string;
  nextHeading: string;
  nextLead: string;
  start: string;
  route: string;
  glossaryLink: string;
}> = {
  es: {
    kicker: "Antes del módulo 1",
    title: "Fundamentos de datos, paso a paso.",
    lead: "Nueve capítulos cortos que construyen el vocabulario mínimo para entender un lakehouse. Cada uno se apoya en el anterior: empieza por el primero aunque te suene, y comprueba al final de cada capítulo si lo has entendido.",
    howTo: [
      "Lee el objetivo: es lo que sabrás al terminar.",
      "Fíjate en la analogía y en el ejemplo antes de memorizar términos.",
      "Responde la pregunta de autocomprobación sin mirar y luego compara.",
    ],
    tocLabel: "Capítulos",
    chapter: "Capítulo",
    goal: "Al terminar sabrás",
    analogy: "Piénsalo así",
    oneLiner: "En una frase",
    glossary: "Términos del glosario",
    deeper: "Se profundiza en",
    check: "Comprueba tu comprensión",
    showAnswer: "Ver respuesta",
    nextHeading: "¿Y ahora qué?",
    nextLead: "Con estas bases ya puedes empezar el temario. Así continúa el recorrido:",
    start: "Empezar el módulo 1",
    route: "Ver la ruta completa",
    glossaryLink: "Abrir el glosario",
  },
  en: {
    kicker: "Before module 1",
    title: "Data foundations, step by step.",
    lead: "Nine short chapters that build the minimum vocabulary to understand a lakehouse. Each one builds on the previous: start with the first even if it sounds familiar, and check your understanding at the end of each chapter.",
    howTo: [
      "Read the goal: it is what you will know at the end.",
      "Look at the analogy and the example before memorising terms.",
      "Answer the self-check question without looking, then compare.",
    ],
    tocLabel: "Chapters",
    chapter: "Chapter",
    goal: "By the end you will",
    analogy: "Think of it like this",
    oneLiner: "In one sentence",
    glossary: "Glossary terms",
    deeper: "Covered in depth in",
    check: "Check your understanding",
    showAnswer: "Show answer",
    nextHeading: "What next?",
    nextLead: "With these basics you can start the curriculum. This is how the journey continues:",
    start: "Start module 1",
    route: "See the full path",
    glossaryLink: "Open the glossary",
  },
};

function ExampleBlock({ example }: { example: FoundationExample }) {
  if (example.kind === "table") {
    return (
      <figure className="public-foundation-example">
        <div className="public-foundation-table" tabIndex={0} role="region" aria-label={example.caption}>
          <table>
            <thead><tr>{example.columns.map((column, index) => <th key={index} scope="col">{column}</th>)}</tr></thead>
            <tbody>
              {example.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 && !example.columns[0]
                  ? <th key={cellIndex} scope="row">{cell}</th>
                  : <td key={cellIndex}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <figcaption><InlineText text={example.caption} /></figcaption>
      </figure>
    );
  }
  return (
    <figure className="public-foundation-example">
      <div className="public-foundation-code">
        <span>{example.language}</span>
        <pre tabIndex={0}><code>{example.code}</code></pre>
      </div>
      <figcaption><InlineText text={example.caption} /></figcaption>
    </figure>
  );
}

export default async function FundamentosPage() {
  const locale = await getRequestLocale();
  const text = pageText[locale] ?? pageText.es;
  const moduleById = new Map(modules.map((module) => [module.id, localizeModule(module, locale)]));
  const firstModule = moduleById.get("m01");

  return (
    <PublicShell active="foundations" locale={locale}>
      <main id="public-main" className="public-document-main public-foundations-main" tabIndex={-1}>
        <article className="public-document public-foundations">
          <p className="public-kicker">{text.kicker}</p>
          <h1>{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>
          <ol className="public-foundations-howto">
            {text.howTo.map((step) => <li key={step}>{step}</li>)}
          </ol>

          <nav className="public-foundations-toc" aria-labelledby="foundations-toc-heading">
            <h2 id="foundations-toc-heading">{text.tocLabel}</h2>
            <ol>
              {foundationChapters.map((chapter, index) => (
                <li key={chapter.id}>
                  <a href={`#${chapter.id}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{chapter[locale].title}</strong>
                    <small>{chapter[locale].goal}</small>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {foundationChapters.map((chapter, index) => {
            const content = chapter[locale];
            const headingId = `${chapter.id}-heading`;
            return (
              <section key={chapter.id} id={chapter.id} className="public-foundation-chapter" aria-labelledby={headingId}>
                <p className="public-foundation-number">{text.chapter} {index + 1} / {foundationChapters.length}</p>
                <h2 id={headingId}>{content.title}</h2>
                <p className="public-foundation-goal"><strong>{text.goal}:</strong> {content.goal.charAt(0).toLocaleLowerCase(locale) + content.goal.slice(1)}</p>

                {content.body.map((paragraph) => <p key={paragraph}><InlineText text={paragraph} /></p>)}

                <div className="public-foundation-callout is-analogy">
                  <strong>{text.analogy}</strong>
                  <p>{content.analogy}</p>
                </div>

                <ExampleBlock example={content.example} />

                <div className="public-foundation-callout is-summary">
                  <strong>{text.oneLiner}</strong>
                  <p>{content.oneLiner}</p>
                </div>

                <div className="public-foundation-links">
                  <div>
                    <span>{text.glossary}</span>
                    <ul>
                      {chapter.glossary.flatMap((id) => {
                        const entry = glossaryEntryById.get(id);
                        if (!entry) return [];
                        const term = locale === "en" ? entry.en.term ?? entry.term : entry.term;
                        return [<li key={id}><Link href={`/glosario#${id}`}>{term}</Link></li>];
                      })}
                    </ul>
                  </div>
                  <div>
                    <span>{text.deeper}</span>
                    <ul>
                      {chapter.modules.flatMap((id) => {
                        const courseModule = moduleById.get(id);
                        return courseModule ? [<li key={id}><Link href={`/curso/${courseModule.slug}`}>{courseModule.number} · {courseModule.short}</Link></li>] : [];
                      })}
                    </ul>
                  </div>
                </div>

                <details className="public-foundation-check">
                  <summary>
                    <span>{text.check}</span>
                    <strong><InlineText text={content.check.question} /></strong>
                    <em>{text.showAnswer}</em>
                  </summary>
                  <p><InlineText text={content.check.answer} /></p>
                </details>
              </section>
            );
          })}

          <section className="public-foundation-next" aria-labelledby="foundations-next-heading">
            <h2 id="foundations-next-heading">{text.nextHeading}</h2>
            <p>{text.nextLead}</p>
            <ol>
              {foundationNextSteps.map((step) => (
                <li key={step.modules.join("-")}>
                  <strong>{step[locale]}</strong>
                  <span>
                    {step.modules.flatMap((id) => {
                      const courseModule = moduleById.get(id);
                      return courseModule ? [<Link key={id} href={`/curso/${courseModule.slug}`}>{courseModule.number} · {courseModule.short}</Link>] : [];
                    })}
                  </span>
                </li>
              ))}
            </ol>
            <div className="public-actions">
              {firstModule ? <Link className="public-primary" href={`/curso/${firstModule.slug}/m01-l1`}>{text.start}</Link> : null}
              <Link className="public-secondary" href="/ruta">{text.route}</Link>
              <Link className="public-secondary" href="/glosario">{text.glossaryLink}</Link>
            </div>
          </section>
        </article>
      </main>
    </PublicShell>
  );
}

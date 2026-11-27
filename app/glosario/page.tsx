import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "../components/public/PublicShell";
import GlossaryExplorer, { type GlossaryExplorerEntry } from "../components/public/GlossaryExplorer";
import InlineText from "../components/InlineText";
import {
  glossaryCategoryLabels,
  glossaryEntries,
  glossaryEntryById,
  glossaryLevelLabels,
  type GlossaryCategory,
  type GlossaryLevel,
} from "../curriculum/glossary";
import { localizeGlossaryCategory, localizeGlossaryEntry } from "../i18n/curriculum";
import { glossaryText } from "../i18n/dictionaries";
import { getRequestLocale } from "../i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Lakehouse and Databricks Glossary" : "Glosario lakehouse y Databricks",
    description: locale === "en"
      ? "Bilingual glossary of data engineering, lakehouse and Databricks concepts with plain definitions, examples and related terms."
      : "Glosario bilingüe de ingeniería de datos, lakehouse y Databricks con definiciones llanas, ejemplos y términos relacionados.",
    alternates: { canonical: "/glosario" },
  };
}

/** Orden recomendado para quien empieza desde cero. */
const START_HERE = [
  "data",
  "table",
  "table-schema",
  "sql",
  "parquet",
  "distributed-computing",
  "data-lake",
  "data-warehouse",
  "lakehouse",
  "etl",
];

const levelOrder: GlossaryLevel[] = ["fundamentos", "intermedio", "avanzado"];

export default async function GlosarioPage() {
  const locale = await getRequestLocale();
  const text = glossaryText[locale] ?? glossaryText.es;
  const sortLocale = locale === "en" ? "en" : "es";

  const entries: GlossaryExplorerEntry[] = glossaryEntries
    .map((source) => {
      const entry = localizeGlossaryEntry(source, locale);
      return {
        id: entry.id,
        term: entry.term,
        aliases: entry.aliases,
        category: entry.category,
        categoryLabel: localizeGlossaryCategory(entry.category, locale),
        level: entry.level,
        levelLabel: glossaryLevelLabels[entry.level][locale === "en" ? "en" : "es"],
        definition: entry.definition,
        whyItMatters: entry.whyItMatters,
        example: entry.example,
        related: entry.related.flatMap((id) => {
          const related = glossaryEntryById.get(id);
          return related ? [{ id, term: localizeGlossaryEntry(related, locale).term }] : [];
        }),
        sourceUrl: entry.sourceUrl,
        sourceLabel: entry.sourceUrl.startsWith("/fundamentos")
          ? (locale === "en" ? "Lakehouse Lab · Foundations" : entry.sourceLabel)
          : entry.sourceLabel,
        reviewedAt: entry.reviewedAt,
      };
    })
    .sort((left, right) => left.term.localeCompare(right.term, sortLocale, { sensitivity: "base" }));

  const count = <T extends string>(key: (entry: GlossaryExplorerEntry) => T) =>
    entries.reduce<Record<string, number>>((totals, entry) => {
      totals[key(entry)] = (totals[key(entry)] ?? 0) + 1;
      return totals;
    }, {});
  const categoryCounts = count((entry) => entry.category);
  const levelCounts = count((entry) => entry.level);

  const categories = (Object.keys(glossaryCategoryLabels) as GlossaryCategory[]).map((id) => ({
    id,
    label: localizeGlossaryCategory(id, locale),
    count: categoryCounts[id] ?? 0,
  }));
  const levels = levelOrder.map((id) => ({
    id,
    label: glossaryLevelLabels[id][locale === "en" ? "en" : "es"],
    count: levelCounts[id] ?? 0,
  }));
  const startHere = START_HERE.flatMap((id) => entries.filter((entry) => entry.id === id));

  return (
    <PublicShell active="glossary" locale={locale}>
      <main id="public-main" className="public-document-main public-glossary-main" tabIndex={-1}>
        <article className="public-document public-glossary">
          <p className="public-kicker">{text.kicker}</p>
          <h1>{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>
          <p className="public-glossary-total"><b>{entries.length}</b> {text.reviewedTerms}</p>

          <div className="public-glossary-intro">
            <section aria-labelledby="glossary-howto-heading" className="public-glossary-howto">
              <h2 id="glossary-howto-heading">{text.howToHeading}</h2>
              <ol>{(text.howToSteps as string[]).map((step) => <li key={step}>{step}</li>)}</ol>
              <p><Link href="/fundamentos">{text.foundationsLink} →</Link></p>
            </section>

            <section aria-labelledby="glossary-start-heading" className="public-glossary-start">
              <h2 id="glossary-start-heading">{text.startHereHeading}</h2>
              <p>{text.startHereLead}</p>
              <ol>
                {startHere.map((entry) => (
                  <li key={entry.id}>
                    <a href={`#${entry.id}`}>{entry.term}</a>
                    <span><InlineText text={entry.definition.split(". ")[0].replace(/\.$/u, "")} /></span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section aria-labelledby="glossary-list-heading">
            <h2 id="glossary-list-heading">{text.definitionsHeading}</h2>
            <GlossaryExplorer entries={entries} categories={categories} levels={levels} locale={locale} />
          </section>
        </article>
      </main>
    </PublicShell>
  );
}

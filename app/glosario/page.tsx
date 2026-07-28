import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { glossaryCategoryLabels, glossaryEntries, glossaryEntriesByInitial } from "../curriculum/glossary";
import { localizeGlossaryCategory, localizeGlossaryEntry } from "../i18n/curriculum";
import { glossaryText } from "../i18n/dictionaries";
import { getRequestLocale } from "../i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Databricks Glossary" : "Glosario Databricks",
    description: locale === "en"
      ? "Glossary for Databricks, Delta Lake, Unity Catalog, Lakeflow, streaming, and performance."
      : "Glosario de Databricks, Delta Lake, Unity Catalog, Lakeflow, streaming y rendimiento.",
    alternates: { canonical: "/glosario" },
  };
}

const categoryCounts = glossaryEntries.reduce<Record<string, number>>((counts, entry) => {
  counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  return counts;
}, {});

const firstEntryByCategory = glossaryEntries.reduce<Record<string, string>>((targets, entry) => {
  targets[entry.category] ??= entry.id;
  return targets;
}, {});

export default async function GlosarioPage() {
  const locale = await getRequestLocale();
  const text = glossaryText[locale] ?? glossaryText.es;
  const groupedEntries = glossaryEntriesByInitial();
  const initials = Object.keys(groupedEntries).sort((left, right) => left.localeCompare(right, locale === "en" ? "en" : "es"));

  return (
    <PublicShell active="glossary" locale={locale}>
      <main id="public-main" className="public-document-main public-glossary-main" tabIndex={-1}>
        <article className="public-document public-glossary">
          <p className="public-kicker">{text.kicker}</p>
          <h1>{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>

          <section className="public-glossary-summary" aria-labelledby="glossary-summary-heading">
            <div>
              <span>{glossaryEntries.length}</span>
              <h2 id="glossary-summary-heading">{text.reviewedTerms}</h2>
              <p>{text.reviewedSummary}</p>
            </div>
            <nav aria-label={text.alphabetIndexAria}>
              {initials.map((initial) => <a key={initial} href={`#glosario-${initial.toLocaleLowerCase(locale === "en" ? "en" : "es")}`}>{initial}</a>)}
            </nav>
          </section>

          <section aria-labelledby="glossary-categories-heading">
            <h2 id="glossary-categories-heading">{text.categoriesHeading}</h2>
            <div className="public-glossary-categories">
              {Object.entries(glossaryCategoryLabels).map(([category, label]) => (
                <a key={category} href={`#${firstEntryByCategory[category]}`}>
                  <span>{locale === "en" ? localizeGlossaryCategory(category, locale) : label}</span>
                  <b>{categoryCounts[category] ?? 0}</b>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="glossary-list-heading">
            <h2 id="glossary-list-heading">{text.definitionsHeading}</h2>
            <div className="public-glossary-index">
              {initials.map((initial) => (
                <section key={initial} id={`glosario-${initial.toLocaleLowerCase(locale === "en" ? "en" : "es")}`} aria-labelledby={`glosario-heading-${initial}`}>
                  <h3 id={`glosario-heading-${initial}`}>{initial}</h3>
                  <div className="public-glossary-grid">
                    {groupedEntries[initial].map((sourceEntry) => {
                      const entry = localizeGlossaryEntry(sourceEntry, locale);
                      return <details key={entry.id} id={entry.id} className="public-glossary-card">
                        <summary>
                          <span>{locale === "en" ? localizeGlossaryCategory(entry.category, locale) : glossaryCategoryLabels[entry.category]}</span>
                          <strong>{entry.term}</strong>
                          <a href={`#${entry.id}`} aria-label={`${locale === "en" ? "Direct link to" : "Enlace directo a"} ${entry.term}`}>#</a>
                        </summary>
                        {entry.aliases.length ? <p className="public-glossary-aliases">{text.aliasPrefix} {entry.aliases.join(", ")}</p> : null}
                        <p>{entry.definition}</p>
                        <p><strong>{text.whyItMatters}</strong> {entry.whyItMatters}</p>
                        <dl>
                          <div><dt>{text.related}</dt><dd>{entry.related.join(" · ")}</dd></div>
                          <div><dt>{text.source}</dt><dd><a href={entry.sourceUrl} rel="noreferrer">{entry.sourceLabel}</a></dd></div>
                          <div><dt>{text.review}</dt><dd>{entry.reviewedAt}</dd></div>
                        </dl>
                      </details>
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </article>
      </main>
    </PublicShell>
  );
}

"use client";

import { useEffect, useId, useMemo, useState } from "react";
import InlineText from "../InlineText";
import type { Locale } from "../../i18n/config";
import { glossaryText } from "../../i18n/dictionaries";

export type GlossaryExplorerEntry = {
  id: string;
  term: string;
  aliases: string[];
  category: string;
  categoryLabel: string;
  level: string;
  levelLabel: string;
  definition: string;
  whyItMatters: string;
  example: string;
  related: { id: string; term: string }[];
  sourceUrl: string;
  sourceLabel: string;
  reviewedAt: string;
};

type Props = {
  entries: GlossaryExplorerEntry[];
  categories: { id: string; label: string; count: number }[];
  levels: { id: string; label: string; count: number }[];
  locale: Locale;
};

function normalize(value: string, locale: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(locale);
}

function initialOf(term: string, locale: string) {
  const initial = normalize(term, locale)[0]?.toLocaleUpperCase(locale) ?? "#";
  return /\p{L}/u.test(initial) ? initial : "#";
}

export default function GlossaryExplorer({ entries, categories, levels, locale }: Props) {
  const text = glossaryText[locale] ?? glossaryText.es;
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");

  // Si se llega con un ancla (#termino), se limpian filtros para que siempre sea visible.
  useEffect(() => {
    const reveal = () => {
      const target = decodeURIComponent(window.location.hash.slice(1));
      if (!target || !entries.some((entry) => entry.id === target)) return;
      setQuery("");
      setCategory("all");
      setLevel("all");
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    };
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim(), locale);
    return entries.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (level !== "all" && entry.level !== level) return false;
      if (!needle) return true;
      const haystack = normalize(`${entry.term} ${entry.aliases.join(" ")} ${entry.definition} ${entry.example}`, locale);
      return needle.split(/\s+/u).every((token) => haystack.includes(token));
    });
  }, [entries, query, category, level, locale]);

  const groups = useMemo(() => {
    const result = new Map<string, GlossaryExplorerEntry[]>();
    for (const entry of filtered) {
      const initial = initialOf(entry.term, locale);
      result.set(initial, [...(result.get(initial) ?? []), entry]);
    }
    return [...result.entries()];
  }, [filtered, locale]);

  const filtersActive = query !== "" || category !== "all" || level !== "all";

  return (
    <div className="public-glossary-explorer">
      <div className="public-glossary-filters" role="search">
        <div className="public-glossary-search">
          <label htmlFor={searchId}>{text.searchLabel}</label>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder={text.searchPlaceholder}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <fieldset>
          <legend>{text.levelLabel}</legend>
          <div className="public-glossary-chips">
            <button type="button" aria-pressed={level === "all"} onClick={() => setLevel("all")}>{text.allLevels}</button>
            {levels.map((option) => (
              <button key={option.id} type="button" aria-pressed={level === option.id} onClick={() => setLevel(option.id)}>
                {option.label} <b>{option.count}</b>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{text.categoryLabel}</legend>
          <div className="public-glossary-chips">
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>{text.allCategories}</button>
            {categories.map((option) => (
              <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>
                {option.label} <b>{option.count}</b>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="public-glossary-status">
          <p aria-live="polite">{String(text.results).replace("{count}", String(filtered.length)).replace("{total}", String(entries.length))}</p>
          {filtersActive ? (
            <button type="button" className="public-glossary-clear" onClick={() => { setQuery(""); setCategory("all"); setLevel("all"); }}>
              {text.clearFilters}
            </button>
          ) : null}
        </div>
      </div>

      {groups.length ? (
        <nav className="public-glossary-letters" aria-label={text.alphabetIndexAria}>
          {groups.map(([initial]) => <a key={initial} href={`#glosario-${initial.toLocaleLowerCase(locale)}`}>{initial}</a>)}
        </nav>
      ) : null}

      {groups.length ? (
        <div className="public-glossary-index">
          {groups.map(([initial, items]) => (
            <section key={initial} id={`glosario-${initial.toLocaleLowerCase(locale)}`} aria-labelledby={`glosario-heading-${initial}`}>
              <h3 id={`glosario-heading-${initial}`}>{initial}</h3>
              <div className="public-glossary-grid">
                {items.map((entry) => (
                  <article key={entry.id} id={entry.id} className="public-glossary-card" aria-labelledby={`${entry.id}-term`}>
                    <header>
                      <div className="public-glossary-badges">
                        <span className={`public-glossary-level is-${entry.level}`}>{entry.levelLabel}</span>
                        <span>{entry.categoryLabel}</span>
                      </div>
                      <h4 id={`${entry.id}-term`}>{entry.term}</h4>
                      <a className="public-glossary-permalink" href={`#${entry.id}`} aria-label={`${text.permalink} ${entry.term}`}>#</a>
                    </header>
                    {entry.aliases.length ? <p className="public-glossary-aliases">{text.aliasPrefix} {entry.aliases.join(", ")}</p> : null}
                    <p className="public-glossary-definition"><InlineText text={entry.definition} /></p>
                    <dl className="public-glossary-facts">
                      <div>
                        <dt>{text.whyItMatters}</dt>
                        <dd><InlineText text={entry.whyItMatters} /></dd>
                      </div>
                      <div>
                        <dt>{text.example}</dt>
                        <dd><InlineText text={entry.example} /></dd>
                      </div>
                    </dl>
                    <footer>
                      {entry.related.length ? (
                        <div className="public-glossary-related">
                          <span>{text.related}</span>
                          <ul>{entry.related.map((related) => <li key={related.id}><a href={`#${related.id}`}>{related.term}</a></li>)}</ul>
                        </div>
                      ) : null}
                      <p className="public-glossary-source">
                        {text.source}: <a href={entry.sourceUrl} rel={entry.sourceUrl.startsWith("http") ? "noreferrer" : undefined}>{entry.sourceLabel}</a>
                        {" · "}{text.review} {entry.reviewedAt}
                      </p>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="public-glossary-empty">{text.noResults}</p>
      )}
    </div>
  );
}

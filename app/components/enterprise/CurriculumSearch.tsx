"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { CurriculumSearchResult } from "../../enterprise/contracts";

const kindLabel: Record<CurriculumSearchResult["kind"], string> = {
  concept: "Concepto",
  lesson: "Lección",
  module: "Módulo",
};

export default function CurriculumSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CurriculumSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const normalizedQuery = query.trim();

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLocaleLowerCase("es") !== "k") return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      setOpen(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onShortcut);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onShortcut);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("No se pudo consultar el temario.");
        const body = await response.json() as { results?: CurriculumSearchResult[] };
        setResults(Array.isArray(body.results) ? body.results : []);
        setOpen(true);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(caught instanceof Error ? caught.message : "No se pudo consultar el temario.");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) window.location.assign(results[0].href);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setOpen(true);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
    }
  }

  function inputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      inputRef.current?.select();
    } else if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      rootRef.current?.querySelector<HTMLAnchorElement>(".ent-search-result")?.focus();
    }
  }

  const status = normalizedQuery.length < 2
    ? "Escribe al menos dos caracteres."
    : loading
      ? "Buscando en el temario…"
      : error || (results.length ? `${results.length} coincidencias en el temario.` : "No hay coincidencias. Prueba otro término.");

  return (
    <div ref={rootRef} className="ent-global-search">
      <form role="search" aria-label="Buscar en el temario" onSubmit={submit}>
        <label className="sr-only" htmlFor={resultsId}>Buscar conceptos en el temario</label>
        <span className="ent-search-symbol" aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          id={resultsId}
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          aria-controls={`${resultsId}-results`}
          aria-describedby={`${resultsId}-status`}
          placeholder="Buscar conceptos en el temario"
          onChange={(event) => changeQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={inputKeyDown}
        />
        <kbd aria-hidden="true">Ctrl K</kbd>
      </form>
      <section id={`${resultsId}-results`} className="ent-search-popover" aria-label="Resultados de búsqueda" hidden={!open}>
          <p id={`${resultsId}-status`} className="ent-search-status" role="status" aria-live="polite">{status}</p>
          {results.length ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <a className="ent-search-result" href={result.href} onClick={() => setOpen(false)}>
                    <span>{kindLabel[result.kind]}</span>
                    <strong>{result.label}</strong>
                    <p>{result.description}</p>
                    <small>{result.location}<b aria-hidden="true">→</b></small>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <footer><span>Enter abre la primera coincidencia</span><a href="/catalogo">Ver todo el temario</a></footer>
      </section>
    </div>
  );
}

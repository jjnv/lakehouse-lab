"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommunityResourceCatalogEntry, ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";
import { catalogWorkspaceText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";

type StatusFilter = "all" | "available" | "progress" | "completed" | "preview";
export type CatalogSurface = "modules" | "resources";

const formatLabel: Record<CommunityResourceCatalogEntry["format"], string> = {
  ipynb: ".ipynb",
  "databricks-source": "Notebook source",
  dbc: ".dbc",
  bundle: "Bundle",
  repository: "Repository",
  project: "Project",
};

function firstRelevantModule(resource: CommunityResourceCatalogEntry, phase: string) {
  return resource.relatedModules
    .filter((module) => phase === "all" || module.phaseId === phase)
    .sort((left, right) => left.rank - right.rank || Number(left.number) - Number(right.number))[0]
    ?? resource.relatedModules[0];
}

export default function CatalogWorkspace({
  modules,
  resources,
  surface,
  personalized = true,
  locale = "es",
}: {
  modules: ModuleSummary[];
  resources: CommunityResourceCatalogEntry[];
  surface: CatalogSurface;
  personalized?: boolean;
  locale?: Locale;
}) {
  const state = useDashboard(personalized);
  const text = catalogWorkspaceText[locale] ?? catalogWorkspaceText.es;
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState("all");
  const [format, setFormat] = useState("all");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const progressMap = useMemo(() => new Map(state.dashboard?.progress.map((item) => [item.moduleId, item]) ?? []), [state.dashboard]);
  const normalized = search.trim().toLocaleLowerCase(locale === "en" ? "en-US" : "es-ES");
  const ui = locale === "en" ? {
    moduleSummary: "Description",
    resourceDetails: "Details",
    moreFilters: "More filters",
    phaseModules: (count: number) => `${count} modules`,
    source: "Open source",
  } : {
    moduleSummary: "Descripción",
    resourceDetails: "Detalles",
    moreFilters: "Más filtros",
    phaseModules: (count: number) => `${count} módulos`,
    source: "Abrir fuente",
  };

  const difficultyLabel: Record<CommunityResourceCatalogEntry["difficulty"], string> = {
    beginner: text.difficultyBeginner,
    intermediate: text.difficultyIntermediate,
    advanced: text.difficultyAdvanced,
  };

  const previewUnavailableLabel: Record<Exclude<CommunityResourceCatalogEntry["previewUnavailableReason"], null>, string> = {
    license_unverified: locale === "en" ? "Unverified license" : "Licencia sin verificar",
    restricted_license: locale === "en" ? "Restricted license" : "Licencia restringida",
    no_compatible_file: locale === "en" ? "No compatible file" : "Sin archivo compatible",
  };

  useEffect(() => {
    function restoreLocation() {
      const params = new URLSearchParams(window.location.search);
      setSearch(params.get("q") ?? "");
      setPhase(params.get("phase") ?? "all");
      setLevel(params.get("level") ?? "all");
      setStatus((params.get("status") as StatusFilter | null) ?? "all");
      setDifficulty(params.get("difficulty") ?? "all");
      setFormat(params.get("format") ?? "all");
      setPreviewOnly(params.get("preview") === "1");
      setLocationReady(true);
    }
    restoreLocation();
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, []);

  const filteredModules = useMemo(() => modules.filter((module) => {
    const progress = progressMap.get(module.id);
    const started = Boolean(progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent != null);
    const statusMatches = status === "all"
      || (status === "completed" && progress?.completed)
      || (status === "progress" && started && !progress?.completed)
      || (status === "available" && progress?.unlocked && !started)
      || (status === "preview" && progress && !progress.unlocked);
    return (!normalized || `${module.title} ${module.short} ${module.description} ${module.phase} ${module.resourceConcepts.join(" ")}`.toLocaleLowerCase(locale === "en" ? "en-US" : "es-ES").includes(normalized))
      && (phase === "all" || module.phaseId === phase)
      && (level === "all" || module.level.toLocaleLowerCase(locale === "en" ? "en-US" : "es-ES").includes(level))
      && statusMatches;
  }), [level, locale, modules, normalized, phase, progressMap, status]);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const searchable = `${resource.title} ${resource.summary} ${resource.author} ${resource.repositoryName} ${resource.concepts.join(" ")} ${resource.runtimeNotes} ${resource.relatedModules.map((module) => `${module.id} ${module.title} ${module.phase}`).join(" ")}`.toLocaleLowerCase(locale === "en" ? "en-US" : "es-ES");
    return (!normalized || searchable.includes(normalized))
      && (phase === "all" || resource.relatedModules.some((module) => module.phaseId === phase))
      && (difficulty === "all" || resource.difficulty === difficulty)
      && (format === "all" || resource.format === format)
      && (!previewOnly || resource.previewAvailable);
  }), [difficulty, format, locale, normalized, phase, previewOnly, resources]);

  function updateLocation(next: Partial<{
    search: string;
    phase: string;
    level: string;
    status: StatusFilter;
    difficulty: string;
    format: string;
    previewOnly: boolean;
  }>, push = true) {
    const snapshot = { search, phase, level, status, difficulty, format, previewOnly, ...next };
    if (next.search !== undefined) setSearch(next.search);
    if (next.phase !== undefined) setPhase(next.phase);
    if (next.level !== undefined) setLevel(next.level);
    if (next.status !== undefined) setStatus(next.status);
    if (next.difficulty !== undefined) setDifficulty(next.difficulty);
    if (next.format !== undefined) setFormat(next.format);
    if (next.previewOnly !== undefined) setPreviewOnly(next.previewOnly);
    const params = new URLSearchParams(window.location.search);
    params.delete("view");
    const values = [
      ["q", snapshot.search.trim()],
      ["phase", snapshot.phase === "all" ? "" : snapshot.phase],
      ["level", snapshot.level === "all" ? "" : snapshot.level],
      ["status", snapshot.status === "all" ? "" : snapshot.status],
      ["difficulty", snapshot.difficulty === "all" ? "" : snapshot.difficulty],
      ["format", snapshot.format === "all" ? "" : snapshot.format],
      ["preview", snapshot.previewOnly ? "1" : ""],
    ] as const;
    for (const [key, value] of values) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    history[push ? "pushState" : "replaceState"]({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }

  function clearFilters() {
    updateLocation({ search: "", phase: "all", level: "all", status: "all", difficulty: "all", format: "all", previewOnly: false });
  }

  const phases = useMemo(() => [...new Map(modules.map((module) => [module.phaseId, module.phase])).entries()], [modules]);
  const groupedModules = useMemo(() => phases.map(([id, name]) => ({
    id,
    name,
    modules: filteredModules.filter((module) => module.phaseId === id),
  })).filter((group) => group.modules.length), [filteredModules, phases]);
  const relevantPhase = useMemo(() => {
    if (phase !== "all") return phase;
    if (!personalized) return phases[0]?.[0];
    return modules.find((module) => {
      const progress = progressMap.get(module.id);
      return progress?.unlocked !== false && !progress?.completed;
    })?.phaseId ?? phases[0]?.[0];
  }, [modules, personalized, phase, phases, progressMap]);
  const resultCount = surface === "modules" ? filteredModules.length : filteredResources.length;

  return (
    <div className="ent-page-stack ent-catalog-workspace">
      <section className="ent-page-intro" aria-labelledby="catalog-heading">
        <div>
          <h2 id="catalog-heading">{surface === "modules" ? text.modulesTitle : text.resourcesTitle}</h2>
          <p>{surface === "modules" ? text.modulesDesc : text.resourcesDesc}</p>
        </div>
        {personalized && state.dashboard
          ? <SaveState value={state.saveState} onRetry={state.refresh} locale={locale} />
          : <a className="ent-primary-action" href="/entrar?return_to=%2Fcatalogo">{text.createWorkspace}</a>}
      </section>

      <nav className="ent-catalog-switch" aria-label={locale === "en" ? "Curriculum sections" : "Secciones del temario"}>
        <a className={surface === "modules" ? "is-active" : undefined} aria-current={surface === "modules" ? "location" : undefined} href="/catalogo">{text.tabModules} <span>{modules.length}</span></a>
        <a className={surface === "resources" ? "is-active" : undefined} aria-current={surface === "resources" ? "location" : undefined} href="/recursos">{text.tabResources} <span>{resources.length}</span></a>
      </nav>

      <section className={`ent-catalog-filters ${surface === "resources" ? "is-resources" : ""}`} aria-label={locale === "en" ? "Catalog filters" : "Filtros del catálogo"} aria-busy={!locationReady} inert={!locationReady ? true : undefined}>
        <label className="ent-search-field">
          <span>{text.searchLabel}</span>
          <input type="search" value={search} onChange={(event) => updateLocation({ search: event.target.value }, false)} placeholder={surface === "modules" ? text.searchModulesPlaceholder : text.searchResourcesPlaceholder} />
        </label>
        <label>
          <span>{text.phaseLabel}</span>
          <select value={phase} onChange={(event) => updateLocation({ phase: event.target.value })}>
            <option value="all">{text.phaseAll}</option>
            {phases.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <details className="ent-more-filters">
          <summary>{ui.moreFilters}</summary>
          <div>
            {surface === "modules" ? (
              <>
                <label><span>{text.levelLabel}</span><select value={level} onChange={(event) => updateLocation({ level: event.target.value })}><option value="all">{text.levelAll}</option><option value="associate">Associate</option><option value="professional">Professional</option></select></label>
                {personalized ? <label><span>{text.statusLabel}</span><select value={status} onChange={(event) => updateLocation({ status: event.target.value as StatusFilter })}><option value="all">{text.statusAll}</option><option value="available">{text.statusAvailable}</option><option value="progress">{text.statusProgress}</option><option value="completed">{text.statusCompleted}</option><option value="preview">{text.statusPreview}</option></select></label> : null}
              </>
            ) : (
              <>
                <label><span>{text.difficultyLabel}</span><select value={difficulty} onChange={(event) => updateLocation({ difficulty: event.target.value })}><option value="all">{text.difficultyAll}</option><option value="beginner">{text.difficultyBeginner}</option><option value="intermediate">{text.difficultyIntermediate}</option><option value="advanced">{text.difficultyAdvanced}</option></select></label>
                <label><span>{text.formatLabel}</span><select value={format} onChange={(event) => updateLocation({ format: event.target.value })}><option value="all">{text.formatAll}</option>{Object.entries(formatLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="ent-preview-filter"><input type="checkbox" checked={previewOnly} onChange={(event) => updateLocation({ previewOnly: event.target.checked })} /><span>{text.previewFilter}</span></label>
              </>
            )}
          </div>
        </details>
      </section>

      <p className="ent-result-count" aria-live="polite"><strong>{resultCount}</strong><span>{text.resultsCount(resultCount).replace(/^\d+\s*/, "")}</span></p>

      {surface === "modules" ? (
        groupedModules.length ? <div className="ent-module-groups">{groupedModules.map((group) => {
          const open = Boolean(normalized) || group.id === relevantPhase;
          return <details key={`${group.id}-${normalized ? "search" : relevantPhase}`} className="ent-module-group" open={open}>
            <summary><span>{group.name}</span><small>{ui.phaseModules(group.modules.length)}</small></summary>
            <div className="ent-module-rows">{group.modules.map((module) => {
              const progress = progressMap.get(module.id);
              const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent != null);
              const percent = Math.round(units / 7 * 100);
              const action = !personalized ? text.readBtn : progress?.unlocked === false ? text.previewBtn : percent ? text.continueBtn : text.openBtn;
              return <article key={module.id} className={`ent-module-row ${progress?.completed ? "is-complete" : ""}`}>
                <div className="ent-module-row-main">
                  <span>{module.number}</span>
                  <div><small>{module.level}</small><h2>{module.title}</h2></div>
                  <a className="ent-module-row-action" href={`/curso/${module.slug}`} aria-label={`${action}: ${module.title}`}>{action}<span aria-hidden="true"> →</span></a>
                </div>
                {personalized && percent > 0 ? <div className="ent-progress" role="progressbar" aria-label={locale === "en" ? `Progress for ${module.title}` : `Progreso de ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div> : null}
                <details className="ent-row-details"><summary>{ui.moduleSummary}</summary><p>{module.description}</p></details>
              </article>;
            })}</div>
          </details>;
        })}</div> : <EmptyState onClear={clearFilters} text={text} />
      ) : (
        filteredResources.length ? <div className="ent-resource-list">{filteredResources.map((resource) => {
          const primaryModule = firstRelevantModule(resource, phase);
          const internalHref = primaryModule ? `/curso/${primaryModule.slug}?section=resources&resource=${encodeURIComponent(resource.id)}` : null;
          const primaryHref = resource.previewAvailable && internalHref ? internalHref : resource.href;
          const opensExternal = primaryHref === resource.href;
          return <article key={resource.id} className="ent-resource-row">
            <div className="ent-resource-row-main">
              <div>
                <small>{difficultyLabel[resource.difficulty]} · {formatLabel[resource.format]}</small>
                <h2>{resource.title}</h2>
              </div>
              <a className="ent-resource-row-action" href={primaryHref} target={opensExternal ? "_blank" : undefined} rel={opensExternal ? "noreferrer" : undefined}>
                {resource.previewAvailable && internalHref ? text.viewNotebook : text.viewFile}<span aria-hidden="true"> {opensExternal ? "↗" : "→"}</span>
              </a>
            </div>
            <details className="ent-row-details">
              <summary>{ui.resourceDetails}</summary>
              <p>{resource.summary}</p>
              <dl className="ent-resource-metadata">
                <div><dt>{locale === "en" ? "Source" : "Procedencia"}</dt><dd>{resource.provenance === "official" ? text.officialSource : text.community}</dd></div>
                <div><dt>{locale === "en" ? "License" : "Licencia"}</dt><dd>{resource.licenseStatus === "unknown" ? (locale === "en" ? "Unverified" : "Sin verificar") : resource.license}</dd></div>
                <div><dt>{locale === "en" ? "Concepts" : "Conceptos"}</dt><dd>{resource.concepts.join(", ")}</dd></div>
                <div><dt>{locale === "en" ? "Author" : "Autoría"}</dt><dd>{resource.author}</dd></div>
                <div><dt>{locale === "en" ? "Modules" : "Módulos"}</dt><dd>{resource.relatedModules.filter((module) => phase === "all" || module.phaseId === phase).map((module) => module.title).join(", ")}</dd></div>
                <div><dt>{locale === "en" ? "Review" : "Revisión"}</dt><dd>{text.reviewedOn(resource.reviewedAt)}</dd></div>
              </dl>
              {resource.previewUnavailableReason ? <p>{previewUnavailableLabel[resource.previewUnavailableReason]}</p> : null}
              {resource.licenseEvidenceHref ? <a href={resource.licenseEvidenceHref} target="_blank" rel="noreferrer">{ui.source} <span aria-hidden="true">↗</span></a> : null}
            </details>
          </article>;
        })}</div> : <EmptyState onClear={clearFilters} text={text} />
      )}
    </div>
  );
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function EmptyState({ onClear, text }: { onClear: () => void; text: Record<string, any> }) {
  return <div className="ent-empty"><strong>{text.emptyTitle}</strong><p>{text.emptyDesc}</p><button type="button" className="ent-secondary-action" onClick={onClear}>{text.clearFilters}</button></div>;
}

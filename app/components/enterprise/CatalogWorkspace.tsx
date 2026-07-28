"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommunityResourceCatalogEntry, ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";
import { catalogWorkspaceText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";

type StatusFilter = "all" | "available" | "progress" | "completed" | "preview";
type CatalogView = "modules" | "resources";

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
  personalized = true,
  initialView = "modules",
  locale = "es",
}: {
  modules: ModuleSummary[];
  resources: CommunityResourceCatalogEntry[];
  personalized?: boolean;
  initialView?: CatalogView;
  locale?: Locale;
}) {
  const state = useDashboard(personalized);
  const text = catalogWorkspaceText[locale] ?? catalogWorkspaceText.es;
  const [view, setView] = useState<CatalogView>(initialView);
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
      setView(params.get("view") === "resources" || initialView === "resources" ? "resources" : "modules");
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
  }, [initialView]);

  const filteredModules = useMemo(() => modules.filter((module) => {
    const progress = progressMap.get(module.id);
    const started = Boolean(progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent !== null);
    const statusMatches = status === "all" || (status === "completed" && progress?.completed) || (status === "progress" && started && !progress?.completed) || (status === "available" && progress?.unlocked && !started) || (status === "preview" && progress && !progress.unlocked);
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
    view: CatalogView;
    search: string;
    phase: string;
    level: string;
    status: StatusFilter;
    difficulty: string;
    format: string;
    previewOnly: boolean;
  }>, push = true) {
    const snapshot = { view, search, phase, level, status, difficulty, format, previewOnly, ...next };
    if (next.view !== undefined) setView(next.view);
    if (next.search !== undefined) setSearch(next.search);
    if (next.phase !== undefined) setPhase(next.phase);
    if (next.level !== undefined) setLevel(next.level);
    if (next.status !== undefined) setStatus(next.status);
    if (next.difficulty !== undefined) setDifficulty(next.difficulty);
    if (next.format !== undefined) setFormat(next.format);
    if (next.previewOnly !== undefined) setPreviewOnly(next.previewOnly);
    const params = new URLSearchParams(window.location.search);
    if (snapshot.view === "resources") params.set("view", "resources");
    else params.delete("view");
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

  const phases = [...new Map(modules.map((module) => [module.phaseId, module.phase])).entries()];

  return (
    <div className="ent-page-stack">
      <section className="ent-page-intro" aria-labelledby="catalog-heading">
        <div>
          <h2 id="catalog-heading">{view === "modules" ? text.modulesTitle : text.resourcesTitle}</h2>
          <p>{view === "modules" ? text.modulesDesc : text.resourcesDesc}</p>
        </div>
        {personalized && state.dashboard ? <SaveState value={state.saveState} onRetry={state.refresh} /> : <a className="ent-primary-action" href="/entrar?return_to=%2Fcatalogo">{text.createWorkspace}</a>}
      </section>

      <div className="ent-catalog-switch" role="tablist" aria-label={locale === "en" ? "Catalog view" : "Vista del catálogo"} aria-busy={!locationReady} inert={!locationReady ? true : undefined}>
        <button type="button" role="tab" aria-selected={view === "modules"} onClick={() => updateLocation({ view: "modules" })}>{/* Módulos */}{text.tabModules} <span>32</span></button>
        <button type="button" role="tab" aria-selected={view === "resources"} onClick={() => updateLocation({ view: "resources" })}>{/* Recursos */}{text.tabResources} <span>{resources.length}</span></button>
      </div>

      <section className={`ent-catalog-filters ${view === "resources" ? "is-resources" : ""}`} aria-label={locale === "en" ? `Filters for ${view === "modules" ? "modules" : "notebooks"}` : `Filtros de ${view === "modules" ? "módulos" : "notebooks"}`} aria-busy={!locationReady} inert={!locationReady ? true : undefined}>
        <label className="ent-search-field"><span>{text.searchLabel}</span><input type="search" value={search} onChange={(event) => updateLocation({ search: event.target.value }, false)} placeholder={view === "modules" ? text.searchModulesPlaceholder : text.searchResourcesPlaceholder} /></label>
        <label><span>{text.phaseLabel}</span><select value={phase} onChange={(event) => updateLocation({ phase: event.target.value })}><option value="all">{text.phaseAll}</option>{phases.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        {view === "modules" ? (
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
        <div className="ent-result-count" aria-live="polite"><strong>{view === "modules" ? filteredModules.length : filteredResources.length}</strong><span>{text.resultsCount(view === "modules" ? filteredModules.length : filteredResources.length).replace(/^\d+\s*/, "")}</span></div>
      </section>

      {view === "modules" ? (
        filteredModules.length ? <div className="ent-catalog-grid">{filteredModules.map((module) => {
          const progress = progressMap.get(module.id);
          const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent !== null && progress?.quizBestPercent !== undefined);
          const percent = Math.round(units / 7 * 100);
          const action = !personalized ? text.readBtn : progress?.unlocked === false ? text.previewBtn : percent ? text.continueBtn : text.openBtn;
          return <article key={module.id} className={`ent-catalog-card ent-artwork-${module.artwork.tone} ${progress?.completed ? "is-complete" : ""}`}><div className="ent-card-topline"><span>{module.number} · {module.phase}</span><small>{module.level}</small></div><h2><a className="ent-card-title-link" href={`/curso/${module.slug}`} aria-label={`${action}: ${module.title}`}>{module.title}</a></h2><details className="ent-card-details"><summary>{locale === "en" ? "Summary" : "Resumen"}</summary><p>{module.description}</p></details><div className="ent-catalog-card-footer"><div>{personalized ? <div className="ent-progress" role="progressbar" aria-label={locale === "en" ? `Progress for ${module.title}` : `Progreso de ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div> : null}</div><span className="ent-catalog-card-action">{action}<span aria-hidden="true">→</span></span></div></article>;
        })}</div> : <EmptyState onClear={clearFilters} text={text} />
      ) : (
        filteredResources.length ? <div className="ent-resource-grid">{filteredResources.map((resource) => {
          const primaryModule = firstRelevantModule(resource, phase);
          return (
            <article key={resource.id} className="ent-resource-card">
              <div className="ent-resource-card-topline">
                <span>{resource.provenance === "official" ? text.officialSource : text.community}</span>
                <b title={resource.previewAvailable ? (locale === "en" ? "Can be read inside Lakehouse Lab" : "Se puede leer dentro de Lakehouse Lab") : resource.previewUnavailableReason ? previewUnavailableLabel[resource.previewUnavailableReason] : undefined}>{resource.previewAvailable ? text.internalViewer : text.githubFile}</b>
              </div>
              <h2>{resource.title}</h2>
              <details className="ent-card-details"><summary>{locale === "en" ? "Summary" : "Resumen"}</summary><p>{resource.summary}</p></details>
              <div className="ent-resource-badges">
                <span>{difficultyLabel[resource.difficulty]}</span>
                <span>{formatLabel[resource.format]}</span>
                <span className={resource.licenseStatus === "unknown" ? "is-warning" : ""}>{resource.licenseEvidenceHref ? <a href={resource.licenseEvidenceHref} target="_blank" rel="noreferrer">{resource.license}</a> : resource.licenseStatus === "unknown" ? (locale === "en" ? "Unverified license" : "Licencia no verificada") : resource.license}</span>
              </div>
              <div className="ent-resource-concepts">{resource.concepts.slice(0, 4).map((concept) => <span key={concept}>{concept}</span>)}</div>
              <div className="ent-resource-modules">
                <span>{text.recommendedIn}</span>
                <div>{resource.relatedModules.filter((module) => phase === "all" || module.phaseId === phase).map((module) => <a key={module.id} href={`/curso/${module.slug}?section=resources&resource=${encodeURIComponent(resource.id)}`} title={module.title}>m{module.number}</a>)}</div>
              </div>
              <footer>
                <div><span>{resource.author}</span><small>{text.reviewedOn(resource.reviewedAt)}</small></div>
                <div className="ent-resource-card-actions">
                  <a className="ent-secondary-action" href={resource.href} target="_blank" rel="noreferrer">{text.viewFile} <span aria-hidden="true">↗</span></a>
                  {primaryModule ? <a className="ent-primary-action" href={`/curso/${primaryModule.slug}?section=resources&resource=${encodeURIComponent(resource.id)}`}>{text.viewNotebook} <span aria-hidden="true">→</span></a> : null}
                </div>
              </footer>
            </article>
          );
        })}</div> : <EmptyState onClear={clearFilters} text={text} />
      )}
    </div>
  );
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function EmptyState({ onClear, text }: { onClear: () => void; text: Record<string, any> }) {
  return <div className="ent-empty"><strong>{text.emptyTitle}</strong><p>{text.emptyDesc}</p><button type="button" className="ent-secondary-action" onClick={onClear}>{text.clearFilters}</button></div>;
}

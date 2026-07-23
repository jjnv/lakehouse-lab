"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommunityResourceCatalogEntry, ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";

type StatusFilter = "all" | "available" | "progress" | "completed" | "preview";
type CatalogView = "modules" | "resources";

const formatLabel: Record<CommunityResourceCatalogEntry["format"], string> = {
  ipynb: ".ipynb",
  "databricks-source": "Notebook source",
  dbc: ".dbc",
  bundle: "Bundle",
  repository: "Repositorio",
  project: "Proyecto",
};

const difficultyLabel: Record<CommunityResourceCatalogEntry["difficulty"], string> = {
  beginner: "Inicial",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function firstRelevantModule(resource: CommunityResourceCatalogEntry, phase: string) {
  return resource.relatedModules
    .filter((module) => phase === "all" || module.phaseId === phase)
    .sort((left, right) => left.rank - right.rank || Number(left.number) - Number(right.number))[0]
    ?? resource.relatedModules[0];
}

export default function CatalogWorkspace({ modules, resources }: { modules: ModuleSummary[]; resources: CommunityResourceCatalogEntry[] }) {
  const state = useDashboard();
  const [view, setView] = useState<CatalogView>("modules");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState("all");
  const [cloud, setCloud] = useState("all");
  const [format, setFormat] = useState("all");
  const [previewOnly, setPreviewOnly] = useState(false);
  const progressMap = useMemo(() => new Map(state.dashboard?.progress.map((item) => [item.moduleId, item]) ?? []), [state.dashboard]);
  const normalized = search.trim().toLocaleLowerCase("es");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") !== "resources") return;
    const frame = requestAnimationFrame(() => setView("resources"));
    return () => cancelAnimationFrame(frame);
  }, []);

  const filteredModules = useMemo(() => modules.filter((module) => {
    const progress = progressMap.get(module.id);
    const started = Boolean(progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent !== null);
    const statusMatches = status === "all" || (status === "completed" && progress?.completed) || (status === "progress" && started && !progress?.completed) || (status === "available" && progress?.unlocked && !started) || (status === "preview" && progress && !progress.unlocked);
    return (!normalized || `${module.title} ${module.short} ${module.description} ${module.phase} ${module.resourceConcepts.join(" ")}`.toLocaleLowerCase("es").includes(normalized))
      && (phase === "all" || module.phaseId === phase)
      && (level === "all" || module.level.toLocaleLowerCase("es").includes(level))
      && statusMatches;
  }), [level, modules, normalized, phase, progressMap, status]);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const searchable = `${resource.title} ${resource.summary} ${resource.author} ${resource.repositoryName} ${resource.concepts.join(" ")} ${resource.runtimeNotes} ${resource.relatedModules.map((module) => `${module.id} ${module.title} ${module.phase}`).join(" ")}`.toLocaleLowerCase("es");
    return (!normalized || searchable.includes(normalized))
      && (phase === "all" || resource.relatedModules.some((module) => module.phaseId === phase))
      && (difficulty === "all" || resource.difficulty === difficulty)
      && (cloud === "all" || resource.clouds.includes(cloud))
      && (format === "all" || resource.format === format)
      && (!previewOnly || resource.previewAvailable);
  }), [cloud, difficulty, format, normalized, phase, previewOnly, resources]);

  function changeView(next: CatalogView) {
    setView(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "resources") params.set("view", "resources");
    else params.delete("view");
    history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }

  function clearFilters() {
    setSearch("");
    setPhase("all");
    setLevel("all");
    setStatus("all");
    setDifficulty("all");
    setCloud("all");
    setFormat("all");
    setPreviewOnly(false);
  }

  const phases = [...new Map(modules.map((module) => [module.phaseId, module.phase])).entries()];
  const clouds = [...new Set(resources.flatMap((resource) => resource.clouds))].sort((left, right) => left.localeCompare(right, "es"));

  return (
    <div className="ent-page-stack">
      <section className="ent-page-intro" aria-labelledby="catalog-heading">
        <div>
          <p className="ent-kicker">32 módulos · 96 recomendaciones curadas</p>
          <h2 id="catalog-heading">{view === "modules" ? "Encuentra tu siguiente módulo" : "Explora recursos para practicar"}</h2>
          <p>{view === "modules" ? "Busca por tema o fase. Cada módulo incluye tres recursos comunitarios para ampliar la práctica." : "Explora notebooks y proyectos por temática. Los recursos son complementarios y no modifican tu progreso."}</p>
        </div>
        {state.dashboard ? <SaveState value={state.saveState} onRetry={state.refresh} /> : null}
      </section>

      <div className="ent-catalog-switch" role="tablist" aria-label="Vista del catálogo">
        <button type="button" role="tab" aria-selected={view === "modules"} onClick={() => changeView("modules")}>Módulos <span>32</span></button>
        <button type="button" role="tab" aria-selected={view === "resources"} onClick={() => changeView("resources")}>Notebooks <span>{resources.length}</span></button>
      </div>

      <section className={`ent-catalog-filters ${view === "resources" ? "is-resources" : ""}`} aria-label={`Filtros de ${view === "modules" ? "módulos" : "notebooks"}`}>
        <label className="ent-search-field"><span>Buscar</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === "modules" ? "Ej. streaming, Unity Catalog…" : "Ej. Delta, Kafka, FinOps…"} /></label>
        <label><span>Fase</span><select value={phase} onChange={(event) => setPhase(event.target.value)}><option value="all">Todas</option>{phases.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        {view === "modules" ? (
          <>
            <label><span>Nivel</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">Todos</option><option value="associate">Associate</option><option value="professional">Professional</option></select></label>
            <label><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">Todos</option><option value="available">Disponible</option><option value="progress">En curso</option><option value="completed">Superado</option><option value="preview">Vista previa</option></select></label>
          </>
        ) : (
          <>
            <label><span>Dificultad</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">Todas</option><option value="beginner">Inicial</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option></select></label>
            <label><span>Cloud</span><select value={cloud} onChange={(event) => setCloud(event.target.value)}><option value="all">Todos</option>{clouds.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span>Formato</span><select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">Todos</option>{Object.entries(formatLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="ent-preview-filter"><input type="checkbox" checked={previewOnly} onChange={(event) => setPreviewOnly(event.target.checked)} /><span>Con vista previa</span></label>
          </>
        )}
        <div className="ent-result-count" aria-live="polite"><strong>{view === "modules" ? filteredModules.length : filteredResources.length}</strong><span>resultados</span></div>
      </section>

      {view === "modules" ? (
        filteredModules.length ? <div className="ent-catalog-grid">{filteredModules.map((module) => {
          const progress = progressMap.get(module.id);
          const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent !== null && progress?.quizBestPercent !== undefined);
          const percent = Math.round(units / 7 * 100);
          const action = progress?.unlocked === false ? "Previsualizar" : percent ? "Continuar" : "Abrir";
          return <article key={module.id} className={`ent-catalog-card ${progress?.completed ? "is-complete" : ""}`}><div className="ent-card-topline"><span>{module.number} · {module.phase}</span><small>{module.minutes} min</small></div><p>{module.level}</p><h2><a className="ent-card-title-link" href={`/curso/${module.slug}`} aria-label={`${action}: ${module.title}`}>{module.title}</a></h2><p>{module.description}</p><div className="ent-card-tags"><span>5 lecciones</span><span>Laboratorio</span><span>{module.resourceCount} notebooks</span></div><div className="ent-catalog-card-footer"><div><span>{progress?.unlocked === false ? "Vista previa" : progress?.completed ? "Superado" : `${percent}% completado`}</span><div className="ent-progress" role="progressbar" aria-label={`Progreso de ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div></div><span className="ent-catalog-card-action">{action}<span aria-hidden="true">→</span></span></div></article>;
        })}</div> : <EmptyState onClear={clearFilters} />
      ) : (
        filteredResources.length ? <div className="ent-resource-grid">{filteredResources.map((resource) => {
          const primaryModule = firstRelevantModule(resource, phase);
          return (
            <article key={resource.id} className="ent-resource-card">
              <div className="ent-resource-card-topline">
                <span>{resource.provenance === "official" ? "Fuente oficial" : "Comunidad"}</span>
                {resource.previewAvailable ? <b>Vista previa</b> : null}
              </div>
              <h2>{resource.title}</h2>
              <p>{resource.summary}</p>
              <div className="ent-resource-badges">
                <span>{difficultyLabel[resource.difficulty]}</span>
                <span>{formatLabel[resource.format]}</span>
                <span>{resource.clouds.join(" · ")}</span>
                <span className={resource.licenseStatus === "unknown" ? "is-warning" : ""}>{resource.licenseStatus === "unknown" ? "Licencia no verificada" : resource.license}</span>
              </div>
              <div className="ent-resource-concepts">{resource.concepts.slice(0, 4).map((concept) => <span key={concept}>{concept}</span>)}</div>
              <div className="ent-resource-modules">
                <span>Recomendado en</span>
                <div>{resource.relatedModules.filter((module) => phase === "all" || module.phaseId === phase).map((module) => <a key={module.id} href={`/curso/${module.slug}?section=resources&resource=${encodeURIComponent(resource.id)}`} title={module.title}>m{module.number}</a>)}</div>
              </div>
              <footer>
                <div><span>{resource.author}</span><small>Revisado {resource.reviewedAt}</small></div>
                {primaryModule ? <a className="ent-primary-action" href={`/curso/${primaryModule.slug}?section=resources&resource=${encodeURIComponent(resource.id)}`}>Ver ficha <span aria-hidden="true">→</span></a> : null}
              </footer>
            </article>
          );
        })}</div> : <EmptyState onClear={clearFilters} />
      )}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return <div className="ent-empty"><strong>No hay coincidencias</strong><p>Prueba con menos filtros o un término más general.</p><button type="button" className="ent-secondary-action" onClick={onClear}>Limpiar filtros</button></div>;
}

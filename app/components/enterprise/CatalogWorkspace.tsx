"use client";

import { useMemo, useState } from "react";
import type { ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";

type StatusFilter = "all" | "available" | "progress" | "completed" | "preview";

export default function CatalogWorkspace({ modules }: { modules: ModuleSummary[] }) {
  const state = useDashboard();
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const progressMap = useMemo(() => new Map(state.dashboard?.progress.map((item) => [item.moduleId, item]) ?? []), [state.dashboard]);
  const normalized = search.trim().toLocaleLowerCase("es");
  const filtered = useMemo(() => modules.filter((module) => {
    const progress = progressMap.get(module.id);
    const started = Boolean(progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent !== null);
    const statusMatches = status === "all" || (status === "completed" && progress?.completed) || (status === "progress" && started && !progress?.completed) || (status === "available" && progress?.unlocked && !started) || (status === "preview" && progress && !progress.unlocked);
    return (!normalized || `${module.title} ${module.short} ${module.description} ${module.phase}`.toLocaleLowerCase("es").includes(normalized))
      && (phase === "all" || module.phaseId === phase)
      && (level === "all" || module.level.toLocaleLowerCase("es").includes(level))
      && statusMatches;
  }), [level, modules, normalized, phase, progressMap, status]);

  return <div className="ent-page-stack">
    <section className="ent-page-intro" aria-labelledby="catalog-heading"><div><p className="ent-kicker">32 módulos · ruta completa</p><h2 id="catalog-heading">Catálogo</h2><p>Busca por tema o fase. Puedes consultar los módulos futuros; el registro de actividad se activa al completar los prerrequisitos.</p></div>{state.dashboard ? <SaveState value={state.saveState} onRetry={state.refresh} /> : null}</section>
    <section className="ent-catalog-filters" aria-label="Filtros del catálogo">
      <label className="ent-search-field"><span>Buscar</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. streaming, Unity Catalog…" /></label>
      <label><span>Fase</span><select value={phase} onChange={(event) => setPhase(event.target.value)}><option value="all">Todas</option>{[...new Map(modules.map((module) => [module.phaseId, module.phase])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label><span>Nivel</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">Todos</option><option value="associate">Associate</option><option value="professional">Professional</option></select></label>
      <label><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">Todos</option><option value="available">Disponible</option><option value="progress">En curso</option><option value="completed">Superado</option><option value="preview">Vista previa</option></select></label>
      <div className="ent-result-count" aria-live="polite"><strong>{filtered.length}</strong><span>resultados</span></div>
    </section>
    {filtered.length ? <div className="ent-catalog-grid">{filtered.map((module) => {
      const progress = progressMap.get(module.id);
      const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent !== null && progress?.quizBestPercent !== undefined);
      const percent = Math.round(units / 7 * 100);
      const action = progress?.unlocked === false ? "Previsualizar" : percent ? "Continuar" : "Abrir";
      return <article key={module.id} className={`ent-catalog-card ${progress?.completed ? "is-complete" : ""}`}><div className="ent-card-topline"><span>{module.number} · {module.phase}</span><small>{module.minutes} min</small></div><p>{module.level}</p><h2><a className="ent-card-title-link" href={`/curso/${module.slug}`} aria-label={`${action}: ${module.title}`}>{module.title}</a></h2><p>{module.description}</p><div className="ent-card-tags"><span>5 lecciones</span><span>Laboratorio</span><span>Test 75 %</span></div><div className="ent-catalog-card-footer"><div><span>{progress?.unlocked === false ? "Vista previa" : progress?.completed ? "Superado" : `${percent}% completado`}</span><div className="ent-progress" role="progressbar" aria-label={`Progreso de ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div></div><span className="ent-catalog-card-action">{action}<span aria-hidden="true">→</span></span></div></article>;
    })}</div> : <div className="ent-empty"><strong>No hay coincidencias</strong><p>Prueba con menos filtros o un término más general.</p><button type="button" className="ent-secondary-action" onClick={() => { setSearch(""); setPhase("all"); setLevel("all"); setStatus("all"); }}>Limpiar filtros</button></div>}
  </div>;
}

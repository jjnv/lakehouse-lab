"use client";

import Link from "next/link";
import AssessmentPanel from "./AssessmentPanel";
import { SaveState, useDashboard } from "./useDashboard";

export default function SimulatorWorkspace({ mode }: { mode: "associate" | "professional" }) {
  const state = useDashboard();
  if (state.loading) return <div className="ent-state-card" role="status"><span className="ent-spinner" /><div><strong>Preparando el simulacro</strong><p>Generando un intento seguro.</p></div></div>;
  if (!state.dashboard) return <div className="ent-state-card is-error" role="alert"><div><strong>No se pudo abrir el simulacro</strong><p>{state.error}</p></div><button className="ent-secondary-action" onClick={state.refresh}>Reintentar</button></div>;
  const best = state.dashboard.bestSimulatorScores[mode];
  const kind = mode === "associate" ? "associate-simulator" : "professional-simulator";
  return <div className="ent-page-stack ent-simulator-page">
    <section className="ent-page-intro" aria-labelledby="simulator-heading"><div><p className="ent-kicker">Práctica sin límite</p><h2 id="simulator-heading">Simulacro {mode === "associate" ? "Associate" : "Professional"}</h2><p>Preguntas originales alineadas al blueprint y corregidas únicamente en el servidor. Este resultado mide preparación interna, no equivale al examen oficial.</p></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <div className="ent-simulator-context"><article><span>Umbral</span><strong>80 %</strong><p>Se exige un intento completo.</p></article><article><span>Mejor resultado</span><strong>{best === null ? "—" : `${best}%`}</strong><p>Un nuevo intento nunca reduce esta marca.</p></article><article><span>Adaptación de tiempo</span><strong>1× · 1,5× · 2×</strong><p>También puedes practicar sin límite.</p></article></div>
    <AssessmentPanel kind={kind} title={`Simulacro ${mode === "associate" ? "Associate" : "Professional"}`} bestScore={best} revision={state.dashboard.revision.value} onState={state.setSaveState} onCompleted={state.refresh} />
    <aside className="ent-simulator-disclaimer"><b>Uso interno</b><p>Las muestras oficiales se consultan desde las fuentes del curso. Lakehouse Lab no utiliza dumps ni afirma equivalencia con una certificación Databricks.</p></aside>
    <Link href="/mi-aprendizaje" className="ent-back-link">← Volver a mi aprendizaje</Link>
  </div>;
}

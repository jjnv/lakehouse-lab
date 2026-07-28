"use client";

import AssessmentPanel from "./AssessmentPanel";
import { SaveState, useDashboard } from "./useDashboard";
import { simulatorWorkspaceText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";

export default function SimulatorWorkspace({ mode, locale = "es" }: { mode: "associate" | "professional"; locale?: Locale }) {
  const state = useDashboard();
  const text = simulatorWorkspaceText[locale] ?? simulatorWorkspaceText.es;
  if (state.loading) return <div className="ent-state-card" role="status"><span className="ent-spinner" /><div><strong>{text.loadingTitle}</strong><p>{text.loadingDesc}</p></div></div>;
  if (!state.dashboard) return <div className="ent-state-card is-error" role="alert"><div><strong>{text.errorTitle}</strong><p>{state.error}</p></div><button className="ent-secondary-action" onClick={state.refresh}>{text.retry}</button></div>;
  const best = state.dashboard.bestSimulatorScores[mode];
  const kind = mode === "associate" ? "associate-simulator" : "professional-simulator";
  return <div className="ent-page-stack ent-simulator-page">
    <section className="ent-page-intro" aria-labelledby="simulator-heading"><div><p className="ent-kicker">{text.kicker}</p><h2 id="simulator-heading">{mode === "associate" ? text.titleAssociate : text.titlePro}</h2><p>{text.introDesc}</p></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <div className="ent-simulator-context"><article><span>{text.thresholdLabel}</span><strong>80 %</strong><p>{text.thresholdDesc}</p></article><article><span>{text.bestScoreLabel}</span><strong>{best === null ? "—" : `${best}%`}</strong><p>{text.bestScoreDesc}</p></article><article><span>{text.timingAdapLabel}</span><strong>1× · 1,5× · 2×</strong><p>{text.timingAdapDesc}</p></article></div>
    <AssessmentPanel kind={kind} title={mode === "associate" ? text.titleAssociate : text.titlePro} bestScore={best} revision={state.dashboard.revision.value} onState={state.setSaveState} onCompleted={state.refresh} locale={locale} />
    <aside className="ent-simulator-disclaimer"><b>{text.disclaimerTitle}</b><p>{text.disclaimerBody}</p></aside>
    <a href="/mi-aprendizaje" className="ent-back-link">{text.backToLearning}</a>
  </div>;
}

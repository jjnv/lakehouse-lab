"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation is intentional in the authenticated shell. */
import { useEffect, useRef, useState } from "react";
import type { LearnerDashboard, ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";
import { portalPagesText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";

function LoadingState({ locale = "es" }: { locale?: Locale }) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  return <div className="ent-state-card" role="status"><span className="ent-spinner" aria-hidden="true" /><div><strong>{text.loadingTitle}</strong><p>{text.loadingDesc}</p></div></div>;
}

function ErrorState({ message, retry, locale = "es" }: { message: string; retry: () => void; locale?: Locale }) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  return <div className="ent-state-card is-error" role="alert"><div><strong>{text.errorTitle}</strong><p>{message}</p></div><button type="button" className="ent-secondary-action" onClick={retry}>{text.retry}</button></div>;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return <div className="ent-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><i style={{ width: `${safeValue}%` }} /></div>;
}

function moduleProgress(dashboard: LearnerDashboard, moduleId: string) {
  return dashboard.progress.find((item) => item.moduleId === moduleId);
}

function totalProgress(dashboard: LearnerDashboard) {
  const completedUnits = dashboard.progress.reduce((total, item) => total + item.completedLessonIds.length + Number(item.labAttested) + (item.quizBestPercent !== null ? 1 : 0), 0);
  return Math.round(completedUnits / (dashboard.modules.length * 7) * 100);
}

function LegacyImportCard({ dashboard, candidate, onImport, onDismiss, locale = "es" }: {
  dashboard: LearnerDashboard;
  candidate: NonNullable<ReturnType<typeof useDashboard>["legacyCandidate"]>;
  onImport: () => void;
  onDismiss: () => void;
  locale?: Locale;
}) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  const serverLessons = dashboard.progress.reduce((total, item) => total + item.completedLessonIds.length, 0);
  const serverLabs = dashboard.progress.filter((item) => item.labAttested).length;
  return <section className="ent-import-card" aria-labelledby="legacy-import-heading">
    <div><h2 id="legacy-import-heading">{text.legacyTitle}</h2><p>{text.legacyDesc}</p></div>
    <div className="ent-import-comparison" role="group" aria-label="Comparación del progreso">
      <article><span>{text.legacyYourSpace}</span><strong>{serverLessons} {locale === "en" ? "lessons" : "lecciones"}</strong><small>{serverLabs} {locale === "en" ? "labs" : "laboratorios"} · {locale === "en" ? "rev" : "revisión"} {dashboard.revision.value}</small></article>
      <span aria-hidden="true">→</span>
      <article><span>{text.legacyThisBrowser}</span><strong>{candidate.summary.lessons} {locale === "en" ? "lessons" : "lecciones"}</strong><small>{candidate.summary.labs} {locale === "en" ? "labs" : "laboratorios"} · {candidate.summary.quizzes} tests</small></article>
    </div>
    <p className="ent-import-note">{text.legacyNote}</p>
    <div className="ent-form-actions"><button type="button" className="ent-secondary-action" onClick={onDismiss}>{text.legacyDismiss}</button><button type="button" className="ent-primary-action" onClick={onImport}>{text.legacyImport}</button></div>
  </section>;
}

function PreferencesForm({ dashboard, refresh, setSaveState, mode = "onboarding", locale = "es" }: {
  dashboard: LearnerDashboard;
  refresh: () => Promise<void>;
  setSaveState: (state: "saved" | "saving" | "offline" | "error") => void;
  mode?: "onboarding" | "settings";
  locale?: Locale;
}) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  const [goal, setGoal] = useState(dashboard.preferences.goal);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function savePreferences() {
    setPending(true);
    setMessage("");
    setSaveState("saving");
    try {
      const response = await fetch("/api/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goal,
          clientMutationId: crypto.randomUUID(),
          expectedRevision: dashboard.revision.value,
        }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || (locale === "en" ? "Could not save preferences." : "No se pudieron guardar las preferencias."));
      setSaveState("saved");
      setMessage(mode === "onboarding" ? (locale === "en" ? "Your path is ready." : "Tu ruta está lista.") : (locale === "en" ? "Preferences updated." : "Preferencias actualizadas."));
      await refresh();
    } catch (caught) {
      setSaveState(navigator.onLine ? "error" : "offline");
      setMessage(caught instanceof Error ? caught.message : (locale === "en" ? "Could not save preferences." : "No se pudieron guardar las preferencias."));
    } finally {
      setPending(false);
    }
  }

  return <section className={`ent-preferences ${mode === "onboarding" ? "is-onboarding" : ""}`} aria-labelledby={`${mode}-preferences-heading`}>
    {/* objetivo */}
    <header><h2 id={`${mode}-preferences-heading`}>{mode === "onboarding" ? text.prefOnboardingTitle : text.prefSettingsTitle}</h2><p>{text.prefDesc}</p></header>
    <fieldset><legend>{text.prefLegend}</legend><div className="ent-preference-options">{[
      ["associate", text.prefAssociateLabel, text.prefAssociateDesc],
      ["professional", text.prefProLabel, text.prefProDesc],
      ["topics", text.prefTopicsLabel, text.prefTopicsDesc],
    ].map(([value, label, description]) => <label key={value}><input type="radio" name={`${mode}-goal`} value={value} checked={goal === value} onChange={() => setGoal(value as typeof goal)} /><span><b>{label}</b><small>{description}</small></span></label>)}</div></fieldset>
    {message ? <p className="ent-form-status" role="status">{message}</p> : null}
    <div className="ent-form-actions"><a className="ent-secondary-action" href="/catalogo">{text.prefExplore}</a><button type="button" className="ent-primary-action" disabled={pending} onClick={() => void savePreferences()}>{pending ? text.prefSaving : mode === "onboarding" ? text.prefOnboardingSave : text.prefSettingsSave}</button></div>
  </section>;
}

export function EmployeeHomeV2({ locale = "es" }: { locale?: Locale }) {
  const state = useDashboard();
  const text = portalPagesText[locale] ?? portalPagesText.es;
  if (state.loading) return <LoadingState locale={locale} />;
  if (!state.dashboard) return <ErrorState message={state.error ?? (locale === "en" ? "Try again." : "Inténtalo de nuevo.")} retry={state.refresh} locale={locale} />;
  const dashboard = state.dashboard;
  const percent = totalProgress(dashboard);
  const goalLabel = dashboard.preferences.goal === "associate" ? "Associate" : dashboard.preferences.goal === "professional" ? "Professional" : (locale === "en" ? "by topic" : "por temas");

  if (!dashboard.preferences.onboardingCompleted && state.legacyCandidate) {
    return <div className="ent-page-stack"><LegacyImportCard dashboard={dashboard} candidate={state.legacyCandidate} onImport={() => void state.importLegacy(state.legacyCandidate!)} onDismiss={state.dismissLegacy} locale={locale} /></div>;
  }

  if (!dashboard.preferences.onboardingCompleted) {
    return <div className="ent-page-stack"><PreferencesForm dashboard={dashboard} refresh={state.refresh} setSaveState={state.setSaveState} locale={locale} /></div>;
  }

  return <div className="ent-page-stack">
    {state.legacyCandidate ? <LegacyImportCard dashboard={dashboard} candidate={state.legacyCandidate} onImport={() => void state.importLegacy(state.legacyCandidate!)} onDismiss={state.dismissLegacy} locale={locale} /> : null}

    <section className="ent-page-intro ent-page-intro-home" aria-labelledby="home-heading">
      <div><h2 id="home-heading">{text.homeGreeting(dashboard.learner.displayName.split(" ")[0], goalLabel)}</h2></div>
      <SaveState value={state.saveState} onRetry={state.refresh} />
    </section>

    <section className="ent-focus-layout" aria-label={locale === "en" ? "Learning priority" : "Prioridad de aprendizaje"}>
      <article className="ent-focus-card">
        <div className="ent-card-topline"><span>{text.homeNextActivity}</span></div>
        <h3>{dashboard.nextActivity.label}</h3>
        <a className="ent-primary-action" href={dashboard.nextActivity.href}>{text.homeContinue} <span aria-hidden="true">→</span></a>
      </article>
      <aside className="ent-week-card" aria-label={text.homeSimulatorsTitle}>
        <div><span>{text.homeSimulatorsTitle}</span><strong>{dashboard.bestSimulatorScores.associate === null ? text.homeAssociatePending : `Associate ${dashboard.bestSimulatorScores.associate}%`}</strong><small>{dashboard.bestSimulatorScores.professional === null ? text.homeProPending : `Professional ${dashboard.bestSimulatorScores.professional}%`}</small></div>
        <ProgressBar value={Math.min(100, Math.round(((dashboard.bestSimulatorScores.associate ?? 0) + (dashboard.bestSimulatorScores.professional ?? 0)) / 2))} label={locale === "en" ? "Practice exam score progress" : "Progreso de resultados de simulacro"} />
      </aside>
    </section>

    <section className="ent-overview-grid" aria-label={locale === "en" ? "Path status" : "Estado de la ruta"}>
      <article><span>{text.homeOverviewCompleted}</span><strong>{percent}%</strong><ProgressBar value={percent} label={locale === "en" ? "Total path progress" : "Progreso total de la ruta"} /></article>
      <article><span>{text.homePendingReviews}</span><strong>{dashboard.reviews.length}</strong><a href="/mi-aprendizaje#repasos">{text.homeOpenQueue}</a></article>
    </section>
  </div>;
}

export function MyLearningV2({ locale = "es" }: { locale?: Locale }) {
  const state = useDashboard();
  const text = portalPagesText[locale] ?? portalPagesText.es;
  if (state.loading) return <LoadingState locale={locale} />;
  if (!state.dashboard) return <ErrorState message={state.error ?? (locale === "en" ? "Try again." : "Inténtalo de nuevo.")} retry={state.refresh} locale={locale} />;
  const dashboard = state.dashboard;
  const phases = [...new Set(dashboard.modules.map((module) => module.phaseId))];

  return <div className="ent-page-stack">
    <section className="ent-page-intro" aria-labelledby="learning-heading"><div><h2 id="learning-heading">{text.learningTitle}</h2></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-route-banner" aria-label={locale === "en" ? "Professional preparation" : "Preparación Professional"}><div><span>{text.learningBannerTitle}</span><strong>{totalProgress(dashboard)}%</strong></div><ProgressBar value={totalProgress(dashboard)} label={locale === "en" ? "Preparation progress" : "Progreso de preparación"} /></section>

    <div className="ent-phase-list">
      {phases.map((phaseId, phaseIndex) => {
        const phaseModules = dashboard.modules.filter((module) => module.phaseId === phaseId);
        const completed = phaseModules.filter((module) => moduleProgress(dashboard, module.id)?.completed).length;
        return <section key={phaseId} className="ent-phase" aria-labelledby={`phase-${phaseId}`}>
          <header><span>{String(phaseIndex + 1).padStart(2, "0")}</span><div><h2 id={`phase-${phaseId}`}>{phaseModules[0]?.phase}</h2></div><small>{text.learningModulesCount(completed, phaseModules.length)}</small></header>
          <div className="ent-phase-modules">{phaseModules.map((module) => <ModuleRow key={module.id} module={module} dashboard={dashboard} locale={locale} />)}</div>
        </section>;
      })}
    </div>

    <section id="repasos" className="ent-section" aria-labelledby="reviews-heading"><div className="ent-section-heading"><div><h2 id="reviews-heading">{text.reviewsTitle}</h2></div><span>{dashboard.reviews.length}</span></div>
      {dashboard.reviews.length ? <div className="ent-review-list">{dashboard.reviews.map((review) => { const courseModule = dashboard.modules.find((item) => item.id === review.moduleId); return <article key={`${review.moduleId}-${review.lessonId}`}><span>{courseModule?.number}</span><div><b>{courseModule?.short}</b><small>{text.reviewsInterval(review.intervalDays, review.dueOn)}</small></div><a href={`/curso/${courseModule?.slug}?lesson=${review.lessonId}`}>{text.reviewsButton}</a></article>; })}</div> : <div className="ent-empty"><strong>{text.reviewsAllUpToDate}</strong><p>{text.reviewsEmptyText}</p></div>}
    </section>
  </div>;
}

function ModuleRow({ module, dashboard, locale = "es" }: { module: ModuleSummary; dashboard: LearnerDashboard; locale?: Locale }) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  const progress = moduleProgress(dashboard, module.id);
  const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent !== null && progress?.quizBestPercent !== undefined);
  const percent = Math.round(units / 7 * 100);
  return <article className={`ent-module-row ent-artwork-${module.artwork.tone} ${progress?.completed ? "is-complete" : ""} ${progress?.unlocked ? "" : "is-preview"}`}>
    <span>{module.number}</span><div><small>{module.level}</small><h3>{module.title}</h3><p>{text.moduleLessonsLabQuiz(progress?.completedLessonIds.length ?? 0, Boolean(progress?.labAttested), progress?.quizBestPercent ?? null)}</p><ProgressBar value={percent} label={locale === "en" ? `Progress for ${module.title}` : `Progreso de ${module.title}`} /></div><div><b>{progress?.completed ? text.modulePassed : progress?.unlocked ? `${percent}%` : text.modulePreview}</b><a href={`/curso/${module.slug}`}>{progress?.unlocked ? percent ? (locale === "en" ? "Continue" : "Continuar") : (locale === "en" ? "Start" : "Empezar") : (locale === "en" ? "View content" : "Ver contenido")}</a></div>
  </article>;
}

export function LearningRecordV2({ locale = "es" }: { locale?: Locale }) {
  const state = useDashboard();
  const text = portalPagesText[locale] ?? portalPagesText.es;
  if (state.loading) return <LoadingState locale={locale} />;
  if (!state.dashboard) return <ErrorState message={state.error ?? (locale === "en" ? "Try again." : "Inténtalo de nuevo.")} retry={state.refresh} locale={locale} />;
  const dashboard = state.dashboard;
  const visible = dashboard.modules.filter((module) => { const progress = moduleProgress(dashboard, module.id); return progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent !== null; });
  const completedModules = dashboard.progress.filter((item) => item.completed).length;
  const completedLabs = dashboard.progress.filter((item) => item.labAttested).length;
  const passedQuizzes = dashboard.progress.filter((item) => (item.quizBestPercent ?? 0) >= dashboard.enrollment.completionPolicy.moduleQuizMinimumPercent).length;
  const capstoneComplete = dashboard.progress.find((item) => item.moduleId === "m32")?.completed === true;
  const credentialCriteria: Array<{ label: string; current: number; required: number; met: boolean; href: string; suffix?: string; text?: string }> = [
    { label: locale === "en" ? "Modules" : "Módulos", current: completedModules, required: 32, met: completedModules === 32, href: "/mi-aprendizaje" },
    { label: locale === "en" ? "Labs" : "Laboratorios", current: completedLabs, required: 32, met: completedLabs === 32, href: "/mi-aprendizaje" },
    { label: locale === "en" ? "Module Quizzes" : "Evaluaciones de módulo", current: passedQuizzes, required: 32, met: passedQuizzes === 32, href: "/mi-aprendizaje" },
    { label: locale === "en" ? "Associate Practice Exam" : "Simulacro Associate", current: dashboard.bestSimulatorScores.associate ?? 0, required: 80, met: (dashboard.bestSimulatorScores.associate ?? 0) >= 80, href: "/simulacro/associate", suffix: "%" },
    { label: locale === "en" ? "Professional Practice Exam" : "Simulacro Professional", current: dashboard.bestSimulatorScores.professional ?? 0, required: 80, met: (dashboard.bestSimulatorScores.professional ?? 0) >= 80, href: "/simulacro/professional", suffix: "%" },
    { label: "Capstone", current: capstoneComplete ? 1 : 0, required: 1, met: capstoneComplete, href: dashboard.modules.find((item) => item.id === "m32") ? `/curso/${dashboard.modules.find((item) => item.id === "m32")!.slug}` : "/mi-aprendizaje", text: capstoneComplete ? (locale === "en" ? "Completed" : "Completado") : (locale === "en" ? "Pending" : "Pendiente") },
  ];
  return <div className="ent-page-stack">
    <section className="ent-page-intro" aria-labelledby="record-heading"><div><h2 id="record-heading">{text.recordTitle}</h2></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-credential-card" aria-labelledby="credential-heading"><div><h2 id="credential-heading">{dashboard.credential ? text.recordCredentialTitleIssued : text.recordCredentialTitleReq}</h2><p>{dashboard.credential ? text.recordCredentialIssuedOn(new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", { dateStyle: "long" }).format(new Date(dashboard.credential.issuedAt))) : text.recordCredentialReqDesc}</p></div>{dashboard.credential ? <div><a className="ent-primary-action" href={dashboard.credential.pdfHref}>{text.recordDownloadPdf}</a><a href={dashboard.credential.verificationHref}>{text.recordPublicVerification}</a></div> : <ul className="ent-credential-checklist">{credentialCriteria.map((criterion) => <li key={criterion.label} className={criterion.met ? "is-complete" : ""}><span aria-hidden="true">{criterion.met ? "✓" : "○"}</span><div><b>{criterion.label}</b><small>{criterion.text ?? `${criterion.current}${criterion.suffix ?? ""} ${locale === "en" ? "of" : "de"} ${criterion.required}${criterion.suffix ?? ""}`}</small></div><a href={criterion.href}>{criterion.met ? (locale === "en" ? "Review" : "Revisar") : (locale === "en" ? "Continue" : "Continuar")}</a></li>)}</ul>}<small>{text.recordDisclaimer}</small></section>
    <section className="ent-section" aria-labelledby="record-table-heading"><div className="ent-section-heading"><div><h2 id="record-table-heading">{text.recordTableTitle}</h2></div></div>{visible.length ? <div className="ent-table-wrap" tabIndex={0} aria-label={locale === "en" ? "Scrollable progress table" : "Tabla de progreso desplazable"}><table className="ent-table"><thead><tr><th>{text.recordColModule}</th><th>{text.recordColStatus}</th><th>{text.recordColLessons}</th><th>{text.recordColLab}</th><th>{text.recordColQuiz}</th><th><span className="sr-only">{text.recordColAction}</span></th></tr></thead><tbody>{visible.map((module) => { const progress = moduleProgress(dashboard, module.id)!; return <tr key={module.id}><td data-label={text.recordColModule}><span>{module.number}</span><b>{module.short}</b></td><td data-label={text.recordColStatus}><span className={`ent-status ${progress.completed ? "is-complete" : "is-progress"}`}>{progress.completed ? text.recordStatusPassed : text.recordStatusInProgress}</span></td><td data-label={text.recordColLessons}>{progress.completedLessonIds.length}/5</td><td data-label={text.recordColLab}>{progress.labAttested ? text.recordLabAttested : text.recordLabPending}</td><td data-label={text.recordColQuiz}>{progress.quizBestPercent === null ? "—" : `${progress.quizBestPercent}%`}</td><td data-label={text.recordColAction}><a href={`/curso/${module.slug}`}>{text.recordOpen}</a></td></tr>; })}</tbody></table></div> : <div className="ent-empty"><strong>{text.recordEmptyTitle}</strong><p>{text.recordEmptyDesc}</p><a href="/curso/data-intelligence-platform-y-arquitectura-lakehouse">{text.recordStart}</a></div>}</section>
  </div>;
}

function RecoveryControls({ locale = "es" }: { locale?: Locale }) {
  const text = portalPagesText[locale] ?? portalPagesText.es;
  const [recoveryCode, setRecoveryCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, setPending] = useState<"issue" | "revoke" | "logout" | null>(null);
  const [message, setMessage] = useState("");

  async function issueCode() {
    setPending("issue");
    setMessage("");
    try {
      const response = await fetch("/api/me/recovery-code", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const body = await response.json().catch(() => ({})) as { recoveryCode?: string; expiresAt?: string; message?: string };
      if (!response.ok || !body.recoveryCode) throw new Error(body.message || (locale === "en" ? "Could not create recovery code." : "No se pudo crear el código."));
      setRecoveryCode(body.recoveryCode);
      setExpiresAt(body.expiresAt ?? "");
      setMessage(locale === "en" ? "Save it in a password manager. Generating another will invalidate this code." : "Guárdalo en un gestor de contraseñas. Al generar otro, este dejará de funcionar.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : (locale === "en" ? "Could not create recovery code." : "No se pudo crear el código."));
    } finally {
      setPending(null);
    }
  }

  async function revokeCode() {
    setPending("revoke");
    setMessage("");
    try {
      const response = await fetch("/api/me/recovery-code", { method: "DELETE", headers: { "content-type": "application/json" }, body: "{}" });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || (locale === "en" ? "Could not revoke code." : "No se pudo revocar el código."));
      setRecoveryCode("");
      setExpiresAt("");
      setMessage(locale === "en" ? "The recovery code has been revoked." : "El código de recuperación ha quedado revocado.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : (locale === "en" ? "Could not revoke code." : "No se pudo revocar el código."));
    } finally {
      setPending(null);
    }
  }

  async function closeSession() {
    setPending("logout");
    setMessage("");
    try {
      const response = await fetch("/api/session", { method: "DELETE", headers: { "content-type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error(locale === "en" ? "Could not sign out." : "No se pudo cerrar la sesión.");
      window.location.assign("/");
    } catch (caught) {
      setPending(null);
      setMessage(caught instanceof Error ? caught.message : (locale === "en" ? "Could not sign out." : "No se pudo cerrar la sesión."));
    }
  }

  return <section className="ent-recovery-controls" aria-labelledby="recovery-heading"><div><h2 id="recovery-heading">{text.recoveryTitle}</h2><p>{text.recoveryIntro}</p></div>{recoveryCode ? <div className="ent-recovery-code"><span>{text.recoveryCodeLabel}</span><code>{recoveryCode}</code>{expiresAt ? <small>{text.recoveryValidUntil(new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", { dateStyle: "long" }).format(new Date(expiresAt)))}</small> : null}<button type="button" className="ent-secondary-action" onClick={() => void navigator.clipboard.writeText(recoveryCode).then(() => setMessage(locale === "en" ? "Code copied." : "Código copiado."))}>{text.recoveryCopyBtn}</button></div> : null}<div className="ent-form-actions"><a className="ent-secondary-action" href="/recuperar">{text.recoveryAlreadyHave}</a><button type="button" className="ent-secondary-action" disabled={pending !== null} onClick={() => void issueCode()}>{pending === "issue" ? text.recoveryGenerating : recoveryCode ? text.recoveryRotate : text.recoveryGenerate}</button><button type="button" className="ent-secondary-action" disabled={pending !== null} onClick={() => void revokeCode()}>{text.recoveryRevoke}</button><button type="button" className="ent-danger-action" disabled={pending !== null} onClick={() => void closeSession()}>{pending === "logout" ? text.recoveryLoggingOut : text.recoveryLogout}</button></div>{message ? <p className="ent-form-status" role="status">{message}</p> : null}</section>;
}

export function LearnerSettingsV2({ locale = "es" }: { locale?: Locale }) {
  const state = useDashboard();
  const text = portalPagesText[locale] ?? portalPagesText.es;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!confirmDelete) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = deleteTriggerRef.current;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletePending) {
        event.preventDefault();
        setConfirmDelete(false);
        setDeleteText("");
        setDeleteError(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('input:not([disabled]),button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => returnFocusTarget?.focus());
    };
  }, [confirmDelete, deletePending]);

  function closeDeleteDialog() {
    if (deletePending) return;
    setConfirmDelete(false);
    setDeleteText("");
    setDeleteError(null);
  }

  if (state.loading) return <LoadingState locale={locale} />;
  if (!state.dashboard) return <ErrorState message={state.error ?? (locale === "en" ? "Try again." : "Inténtalo de nuevo.")} retry={state.refresh} locale={locale} />;
  const dashboard = state.dashboard;
  async function deleteProgress() {
    setDeleteError(null);
    setDeletePending(true);
    state.setSaveState("saving");
    try {
      const response = await fetch("/api/me/progress", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientMutationId: crypto.randomUUID(), expectedRevision: dashboard.revision.value, confirmation: deleteText }) });
      if (!response.ok) {
        setDeletePending(false);
        state.setSaveState("error");
        setDeleteError(locale === "en" ? "Could not delete progress. Try again." : "No se pudo eliminar el progreso. Inténtalo de nuevo.");
        return;
      }
      setConfirmDelete(false);
      setDeleteText("");
      setDeletePending(false);
      await state.refresh();
      requestAnimationFrame(() => deleteTriggerRef.current?.focus());
    } catch {
      setDeletePending(false);
      state.setSaveState("error");
      setDeleteError(locale === "en" ? "Could not connect to server. Try again." : "No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
  }
  const deleting = deletePending;
  return <>
  <div className="ent-page-stack" inert={confirmDelete ? true : undefined}>
    <section className="ent-page-intro" aria-labelledby="settings-heading"><div><h2 id="settings-heading">{text.settingsTitle}</h2></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-settings-grid-v2">
      <article><h2>{dashboard.learner.displayName}</h2><dl><div><dt>{text.settingsAccount}</dt><dd>{text.settingsAnonymousSession}</dd></div><div><dt>{text.settingsLang}</dt><dd>{locale === "en" ? "English" : "Español"}</dd></div><div><dt>{text.settingsTz}</dt><dd>{dashboard.learner.timezone}</dd></div></dl></article>
      <article><h2>{text.settingsPrivacyTitle}</h2><p>{text.settingsPrivacyDesc}</p>{dashboard.brand.supportEmail ? <a href={`mailto:${dashboard.brand.supportEmail}`}>{text.settingsSupport}</a> : null}</article>
    </section>
    <PreferencesForm dashboard={dashboard} refresh={state.refresh} setSaveState={state.setSaveState} mode="settings" locale={locale} />
    <RecoveryControls locale={locale} />
    <section className="ent-account-actions" aria-labelledby="data-heading"><div><h2 id="data-heading">{text.settingsDataTitle}</h2><p>{text.settingsDataDesc}</p></div><div><a className="ent-secondary-action" href="/api/me/export" download>{text.settingsExport}</a><button ref={deleteTriggerRef} type="button" className="ent-danger-action" aria-haspopup="dialog" onClick={() => { setDeleteError(null); setConfirmDelete(true); }}>{text.settingsDeleteTrigger}</button></div></section>
  </div>
  {confirmDelete ? <div className="ent-dialog-layer"><button className="ent-dialog-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={closeDeleteDialog} /><section ref={dialogRef} className="ent-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-heading" aria-describedby="delete-description" aria-busy={deleting || undefined}><h2 id="delete-heading">{text.settingsDialogTitle}</h2><p id="delete-description">{text.settingsDialogDesc}</p><label htmlFor="delete-confirmation">{text.settingsConfirmLabel}</label><input id="delete-confirmation" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoComplete="off" aria-describedby="delete-description" disabled={deleting} />{deleteError ? <p className="ent-form-status" role="alert">{deleteError}</p> : null}<div className="ent-form-actions"><button ref={cancelRef} type="button" className="ent-secondary-action" disabled={deleting} onClick={closeDeleteDialog}>{text.settingsCancel}</button><button type="button" className="ent-danger-action" disabled={deleteText !== "ELIMINAR" || deleting} onClick={() => void deleteProgress()}>{deleting ? text.settingsDeleting : text.settingsDeleteDefinitive}</button></div></section></div> : null}
  </>;
}

"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation is intentional in the authenticated shell. */
import { useEffect, useRef, useState } from "react";
import type { LearnerDashboard, ModuleSummary } from "../../enterprise/contracts";
import { SaveState, useDashboard } from "./useDashboard";

function LoadingState() {
  return <div className="ent-state-card" role="status"><span className="ent-spinner" aria-hidden="true" /><div><strong>Preparando tu espacio</strong><p>Sincronizando matrícula y progreso.</p></div></div>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="ent-state-card is-error" role="alert"><div><strong>No pudimos cargar tu aprendizaje</strong><p>{message}</p></div><button type="button" className="ent-secondary-action" onClick={retry}>Reintentar</button></div>;
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

function LegacyImportCard({ dashboard, candidate, onImport, onDismiss }: {
  dashboard: LearnerDashboard;
  candidate: NonNullable<ReturnType<typeof useDashboard>["legacyCandidate"]>;
  onImport: () => void;
  onDismiss: () => void;
}) {
  const serverLessons = dashboard.progress.reduce((total, item) => total + item.completedLessonIds.length, 0);
  const serverLabs = dashboard.progress.filter((item) => item.labAttested).length;
  return <section className="ent-import-card" aria-labelledby="legacy-import-heading">
    <div><p className="ent-kicker">Importación opcional</p><h2 id="legacy-import-heading">Hemos encontrado progreso en este navegador.</h2><p>Compáralo antes de decidir. Nunca se subirán código, borradores, respuestas antiguas ni texto de recuerdo activo.</p></div>
    <div className="ent-import-comparison" role="group" aria-label="Comparación del progreso">
      <article><span>Tu espacio</span><strong>{serverLessons} lecciones</strong><small>{serverLabs} laboratorios · revisión {dashboard.revision.value}</small></article>
      <span aria-hidden="true">→</span>
      <article><span>Este navegador</span><strong>{candidate.summary.lessons} lecciones</strong><small>{candidate.summary.labs} laboratorios · {candidate.summary.quizzes} tests</small></article>
    </div>
    <p className="ent-import-note">El progreso se fusionará sin reducir notas aprobadas. Para emitir una constancia interna será necesario un nuevo simulacro Professional corregido por el servidor.</p>
    <div className="ent-form-actions"><button type="button" className="ent-secondary-action" onClick={onDismiss}>Ahora no</button><button type="button" className="ent-primary-action" onClick={onImport}>Importar con mi consentimiento</button></div>
  </section>;
}

function PreferencesForm({ dashboard, refresh, setSaveState, mode = "onboarding" }: {
  dashboard: LearnerDashboard;
  refresh: () => Promise<void>;
  setSaveState: (state: "saved" | "saving" | "offline" | "error") => void;
  mode?: "onboarding" | "settings";
}) {
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
      if (!response.ok) throw new Error(body.message || "No se pudieron guardar las preferencias.");
      setSaveState("saved");
      setMessage(mode === "onboarding" ? "Tu ruta está lista." : "Preferencias actualizadas.");
      await refresh();
    } catch (caught) {
      setSaveState(navigator.onLine ? "error" : "offline");
      setMessage(caught instanceof Error ? caught.message : "No se pudieron guardar las preferencias.");
    } finally {
      setPending(false);
    }
  }

  return <section className={`ent-preferences ${mode === "onboarding" ? "is-onboarding" : ""}`} aria-labelledby={`${mode}-preferences-heading`}>
    <header><p className="ent-kicker">{mode === "onboarding" ? "Tu preparación" : "Mi preparación"}</p><h2 id={`${mode}-preferences-heading`}>{mode === "onboarding" ? "Elige tu objetivo" : "Certificación objetivo"}</h2><p>Usamos este objetivo para priorizar la siguiente actividad y ordenar el plan. Puedes cambiarlo cuando quieras.</p></header>
    <fieldset><legend>¿Qué quieres preparar?</legend><div className="ent-preference-options">{[
      ["associate", "Preparar Associate", "Céntrate en los módulos troncales y el simulacro Associate."],
      ["professional", "Preparar Professional", "Añade streaming, operación, rendimiento, seguridad y simulacro Professional."],
      ["topics", "Consultar por temas", "Usa el temario como referencia flexible."],
    ].map(([value, label, description]) => <label key={value}><input type="radio" name={`${mode}-goal`} value={value} checked={goal === value} onChange={() => setGoal(value as typeof goal)} /><span><b>{label}</b><small>{description}</small></span></label>)}</div></fieldset>
    {message ? <p className="ent-form-status" role="status">{message}</p> : null}
    <div className="ent-form-actions"><a className="ent-secondary-action" href="/catalogo">Explorar temario</a><button type="button" className="ent-primary-action" disabled={pending} onClick={() => void savePreferences()}>{pending ? "Guardando…" : mode === "onboarding" ? "Preparar mi plan" : "Guardar objetivo"}</button></div>
  </section>;
}

export function EmployeeHomeV2() {
  const state = useDashboard();
  if (state.loading) return <LoadingState />;
  if (!state.dashboard) return <ErrorState message={state.error ?? "Inténtalo de nuevo."} retry={state.refresh} />;
  const dashboard = state.dashboard;
  const percent = totalProgress(dashboard);
  const completedModules = dashboard.progress.filter((item) => item.completed).length;
  const goalLabel = dashboard.preferences.goal === "associate" ? "Associate" : dashboard.preferences.goal === "professional" ? "Professional" : "por temas";

  if (!dashboard.preferences.onboardingCompleted && state.legacyCandidate) {
    return <div className="ent-page-stack"><LegacyImportCard dashboard={dashboard} candidate={state.legacyCandidate} onImport={() => void state.importLegacy(state.legacyCandidate!)} onDismiss={state.dismissLegacy} /></div>;
  }

  if (!dashboard.preferences.onboardingCompleted) {
    return <div className="ent-page-stack"><PreferencesForm dashboard={dashboard} refresh={state.refresh} setSaveState={state.setSaveState} /></div>;
  }

  return <div className="ent-page-stack">
    {state.legacyCandidate ? <LegacyImportCard dashboard={dashboard} candidate={state.legacyCandidate} onImport={() => void state.importLegacy(state.legacyCandidate!)} onDismiss={state.dismissLegacy} /> : null}

    <section className="ent-page-intro ent-page-intro-home" aria-labelledby="home-heading">
      <div><p className="ent-kicker">Preparación {goalLabel}</p><h2 id="home-heading">Hola, {dashboard.learner.displayName.split(" ")[0]}. Sigue donde importa.</h2><p>Tu espacio conserva módulos, laboratorios, repasos y resultados de simulacros. La preparación es interna e independiente de Databricks.</p></div>
      <SaveState value={state.saveState} onRetry={state.refresh} />
    </section>

    <section className="ent-focus-layout" aria-label="Prioridad de aprendizaje">
      <article className="ent-focus-card">
        <div className="ent-card-topline"><span>Siguiente actividad</span><small>{completedModules}/32 módulos</small></div>
        <p className="ent-focus-type">{dashboard.nextActivity.kind.replaceAll("_", " ")}</p>
        <h3>{dashboard.nextActivity.label}</h3>
        <p>{dashboard.nextActivity.reason}</p>
        <a className="ent-primary-action" href={dashboard.nextActivity.href}>Continuar <span aria-hidden="true">→</span></a>
      </article>
      <aside className="ent-week-card" aria-labelledby="weekly-goal-heading">
        <div><span>Simulacros</span><strong>{dashboard.bestSimulatorScores.associate === null ? "Associate pendiente" : `Associate ${dashboard.bestSimulatorScores.associate}%`}</strong><small>{dashboard.bestSimulatorScores.professional === null ? "Professional pendiente" : `Professional ${dashboard.bestSimulatorScores.professional}%`}</small></div>
        <ProgressBar value={Math.min(100, Math.round(((dashboard.bestSimulatorScores.associate ?? 0) + (dashboard.bestSimulatorScores.professional ?? 0)) / 2))} label="Progreso de resultados de simulacro" />
        <h3 id="weekly-goal-heading">Mide preparación por dominio</h3>
        <p>Los simulacros son internos, repetibles y no equivalen al examen oficial.</p>
      </aside>
    </section>

    <section className="ent-overview-grid" aria-label="Estado de la ruta">
      <article><span>Ruta completada</span><strong>{percent}%</strong><ProgressBar value={percent} label="Progreso total de la ruta" /></article>
      <article><span>Associate</span><strong>{dashboard.bestSimulatorScores.associate === null ? "—" : `${dashboard.bestSimulatorScores.associate}%`}</strong><a href="/simulacro/associate">Practicar</a></article>
      <article><span>Repasos pendientes</span><strong>{dashboard.reviews.length}</strong><a href="/mi-aprendizaje#repasos">Abrir cola</a></article>
      <article><span>Mejor Professional</span><strong>{dashboard.bestSimulatorScores.professional === null ? "—" : `${dashboard.bestSimulatorScores.professional}%`}</strong><a href="/simulacro/professional">Practicar</a></article>
    </section>

    <section className="ent-section" aria-labelledby="route-status-heading">
      <div className="ent-section-heading"><div><p className="ent-kicker">Progreso personal</p><h2 id="route-status-heading">Tu avance, sin ruido.</h2></div><a href="/mi-aprendizaje">Ver plan completo</a></div>
      <div className="ent-route-summary">
        <div><span>{percent}%</span><ProgressBar value={percent} label="Avance de la ruta Professional" /></div>
        <p>{completedModules} módulos superados. El contenido no se bloquea por fechas ni por objetivos de dedicación.</p>
      </div>
    </section>
  </div>;
}

export function MyLearningV2() {
  const state = useDashboard();
  if (state.loading) return <LoadingState />;
  if (!state.dashboard) return <ErrorState message={state.error ?? "Inténtalo de nuevo."} retry={state.refresh} />;
  const dashboard = state.dashboard;
  const phases = [...new Set(dashboard.modules.map((module) => module.phaseId))];

  return <div className="ent-page-stack">
    <section className="ent-page-intro" aria-labelledby="learning-heading"><div><p className="ent-kicker">Plan de estudio</p><h2 id="learning-heading">Preparación Databricks Data Engineer</h2><p>Los módulos se organizan por dominios de preparación. Puedes previsualizar contenido futuro; la actividad se registra al cumplir los prerrequisitos.</p></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-route-banner" aria-label="Preparación Professional"><div><span>Associate + Professional</span><strong>{totalProgress(dashboard)}%</strong></div><ProgressBar value={totalProgress(dashboard)} label="Progreso de preparación" /><p>Usa Associate para el tramo troncal y Professional para el itinerario completo.</p></section>

    <div className="ent-phase-list">
      {phases.map((phaseId, phaseIndex) => {
        const phaseModules = dashboard.modules.filter((module) => module.phaseId === phaseId);
        const completed = phaseModules.filter((module) => moduleProgress(dashboard, module.id)?.completed).length;
        return <section key={phaseId} className="ent-phase" aria-labelledby={`phase-${phaseId}`}>
          <header><span>{String(phaseIndex + 1).padStart(2, "0")}</span><div><p>Fase {phaseIndex + 1}</p><h2 id={`phase-${phaseId}`}>{phaseModules[0]?.phase}</h2></div><small>{completed}/{phaseModules.length} módulos</small></header>
          <div className="ent-phase-modules">{phaseModules.map((module) => <ModuleRow key={module.id} module={module} dashboard={dashboard} />)}</div>
        </section>;
      })}
    </div>

    <section id="repasos" className="ent-section" aria-labelledby="reviews-heading"><div className="ent-section-heading"><div><p className="ent-kicker">Recuerdo espaciado</p><h2 id="reviews-heading">Repasos pendientes</h2></div><span>{dashboard.reviews.length}</span></div>
      {dashboard.reviews.length ? <div className="ent-review-list">{dashboard.reviews.map((review) => { const courseModule = dashboard.modules.find((item) => item.id === review.moduleId); return <article key={`${review.moduleId}-${review.lessonId}`}><span>{courseModule?.number}</span><div><b>{courseModule?.short}</b><small>Intervalo {review.intervalDays} días · venció {review.dueOn}</small></div><a href={`/curso/${courseModule?.slug}?lesson=${review.lessonId}`}>Repasar</a></article>; })}</div> : <div className="ent-empty"><strong>Todo al día</strong><p>Los próximos repasos aparecerán aquí cuando corresponda.</p></div>}
    </section>
  </div>;
}

function ModuleRow({ module, dashboard }: { module: ModuleSummary; dashboard: LearnerDashboard }) {
  const progress = moduleProgress(dashboard, module.id);
  const units = (progress?.completedLessonIds.length ?? 0) + Number(Boolean(progress?.labAttested)) + Number(progress?.quizBestPercent !== null && progress?.quizBestPercent !== undefined);
  const percent = Math.round(units / 7 * 100);
  return <article className={`ent-module-row ent-artwork-${module.artwork.tone} ${progress?.completed ? "is-complete" : ""} ${progress?.unlocked ? "" : "is-preview"}`}>
    <span>{module.number}</span><div><small>{module.level}</small><h3>{module.title}</h3><p>{progress?.completedLessonIds.length ?? 0}/5 lecciones · {progress?.labAttested ? "laboratorio completado" : "laboratorio pendiente"} · {progress?.quizBestPercent === null || progress?.quizBestPercent === undefined ? "test pendiente" : `${progress.quizBestPercent}%`}</p><ProgressBar value={percent} label={`Progreso de ${module.title}`} /></div><div><b>{progress?.completed ? "Superado" : progress?.unlocked ? `${percent}%` : "Vista previa"}</b><a href={`/curso/${module.slug}`}>{progress?.unlocked ? percent ? "Continuar" : "Empezar" : "Ver contenido"}</a></div>
  </article>;
}

export function LearningRecordV2() {
  const state = useDashboard();
  if (state.loading) return <LoadingState />;
  if (!state.dashboard) return <ErrorState message={state.error ?? "Inténtalo de nuevo."} retry={state.refresh} />;
  const dashboard = state.dashboard;
  const visible = dashboard.modules.filter((module) => { const progress = moduleProgress(dashboard, module.id); return progress?.completedLessonIds.length || progress?.labAttested || progress?.quizBestPercent !== null; });
  const completedModules = dashboard.progress.filter((item) => item.completed).length;
  const completedLabs = dashboard.progress.filter((item) => item.labAttested).length;
  const passedQuizzes = dashboard.progress.filter((item) => (item.quizBestPercent ?? 0) >= dashboard.enrollment.completionPolicy.moduleQuizMinimumPercent).length;
  const capstoneComplete = dashboard.progress.find((item) => item.moduleId === "m32")?.completed === true;
  const credentialCriteria: Array<{ label: string; current: number; required: number; met: boolean; href: string; suffix?: string; text?: string }> = [
    { label: "Módulos", current: completedModules, required: 32, met: completedModules === 32, href: "/mi-aprendizaje" },
    { label: "Laboratorios", current: completedLabs, required: 32, met: completedLabs === 32, href: "/mi-aprendizaje" },
    { label: "Evaluaciones de módulo", current: passedQuizzes, required: 32, met: passedQuizzes === 32, href: "/mi-aprendizaje" },
    { label: "Simulacro Associate", current: dashboard.bestSimulatorScores.associate ?? 0, required: 80, met: (dashboard.bestSimulatorScores.associate ?? 0) >= 80, href: "/simulacro/associate", suffix: "%" },
    { label: "Simulacro Professional", current: dashboard.bestSimulatorScores.professional ?? 0, required: 80, met: (dashboard.bestSimulatorScores.professional ?? 0) >= 80, href: "/simulacro/professional", suffix: "%" },
    { label: "Capstone", current: capstoneComplete ? 1 : 0, required: 1, met: capstoneComplete, href: dashboard.modules.find((item) => item.id === "m32") ? `/curso/${dashboard.modules.find((item) => item.id === "m32")!.slug}` : "/mi-aprendizaje", text: capstoneComplete ? "Completado" : "Pendiente" },
  ];
  return <div className="ent-page-stack">
    <section className="ent-page-intro" aria-labelledby="record-heading"><div><p className="ent-kicker">Resultados de preparación</p><h2 id="record-heading">Simulacros, laboratorios y evidencias</h2><p>Este registro te pertenece. XP, rachas e insignias son motivación privada y no una certificación oficial.</p></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-overview-grid ent-overview-grid-three" aria-label="Resumen del expediente"><article><span>Módulos superados</span><strong>{dashboard.progress.filter((item) => item.completed).length}<small>/32</small></strong></article><article><span>Associate</span><strong>{dashboard.bestSimulatorScores.associate === null ? "—" : `${dashboard.bestSimulatorScores.associate}%`}</strong></article><article><span>Professional</span><strong>{dashboard.bestSimulatorScores.professional === null ? "—" : `${dashboard.bestSimulatorScores.professional}%`}</strong></article></section>
    <section className="ent-credential-card" aria-labelledby="credential-heading"><div><p className="ent-kicker">Registro interno</p><h2 id="credential-heading">{dashboard.credential ? "Constancia interna emitida" : "Requisitos de preparación avanzada"}</h2><p>{dashboard.credential ? `Emitida el ${new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(dashboard.credential.issuedAt))}. El enlace de verificación puede compartirse sin iniciar sesión.` : "Cada requisito muestra tu valor actual y lleva directamente a la acción pendiente."}</p></div>{dashboard.credential ? <div><a className="ent-primary-action" href={dashboard.credential.pdfHref}>Descargar PDF</a><a href={dashboard.credential.verificationHref}>Verificación pública</a></div> : <ul className="ent-credential-checklist">{credentialCriteria.map((criterion) => <li key={criterion.label} className={criterion.met ? "is-complete" : ""}><span aria-hidden="true">{criterion.met ? "✓" : "○"}</span><div><b>{criterion.label}</b><small>{criterion.text ?? `${criterion.current}${criterion.suffix ?? ""} de ${criterion.required}${criterion.suffix ?? ""}`}</small></div><a href={criterion.href}>{criterion.met ? "Revisar" : "Continuar"}</a></li>)}</ul>}<small>Constancia propia de Lakehouse Lab; no constituye una certificación oficial de Databricks ni una evaluación proctorizada.</small></section>
    <section className="ent-section" aria-labelledby="record-table-heading"><div className="ent-section-heading"><div><p className="ent-kicker">Actividad acreditada</p><h2 id="record-table-heading">Detalle por módulo</h2></div></div>{visible.length ? <div className="ent-table-wrap" tabIndex={0} aria-label="Tabla de progreso desplazable"><table className="ent-table"><thead><tr><th>Módulo</th><th>Estado</th><th>Lecciones</th><th>Laboratorio</th><th>Mejor test</th><th><span className="sr-only">Acción</span></th></tr></thead><tbody>{visible.map((module) => { const progress = moduleProgress(dashboard, module.id)!; return <tr key={module.id}><td data-label="Módulo"><span>{module.number}</span><b>{module.short}</b></td><td data-label="Estado"><span className={`ent-status ${progress.completed ? "is-complete" : "is-progress"}`}>{progress.completed ? "Superado" : "En curso"}</span></td><td data-label="Lecciones">{progress.completedLessonIds.length}/5</td><td data-label="Laboratorio">{progress.labAttested ? "Autoatestiguado" : "Pendiente"}</td><td data-label="Mejor test">{progress.quizBestPercent === null ? "—" : `${progress.quizBestPercent}%`}</td><td data-label="Acción"><a href={`/curso/${module.slug}`}>Abrir</a></td></tr>; })}</tbody></table></div> : <div className="ent-empty"><strong>Aún no hay actividad</strong><p>Empieza el primer módulo para construir tu expediente.</p><a href="/curso/data-intelligence-platform-y-arquitectura-lakehouse">Empezar</a></div>}</section>
    <section className="ent-private-motivation" aria-labelledby="motivation-heading"><div><p className="ent-kicker">Motivación privada</p><h2 id="motivation-heading">Tu constancia, para ti</h2></div><div><article><span>XP</span><strong>{dashboard.motivation.xp.toLocaleString("es-ES")}</strong></article><article><span>Racha</span><strong>{dashboard.motivation.streakDays} días</strong></article><article><span>Insignias</span><strong>{dashboard.motivation.badges.length}</strong></article></div></section>
  </div>;
}

function RecoveryControls() {
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
      if (!response.ok || !body.recoveryCode) throw new Error(body.message || "No se pudo crear el código.");
      setRecoveryCode(body.recoveryCode);
      setExpiresAt(body.expiresAt ?? "");
      setMessage("Guárdalo en un gestor de contraseñas. Al generar otro, este dejará de funcionar.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo crear el código.");
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
      if (!response.ok) throw new Error(body.message || "No se pudo revocar el código.");
      setRecoveryCode("");
      setExpiresAt("");
      setMessage("El código de recuperación ha quedado revocado.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo revocar el código.");
    } finally {
      setPending(null);
    }
  }

  async function closeSession() {
    setPending("logout");
    setMessage("");
    try {
      const response = await fetch("/api/session", { method: "DELETE", headers: { "content-type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("No se pudo cerrar la sesión.");
      window.location.assign("/");
    } catch (caught) {
      setPending(null);
      setMessage(caught instanceof Error ? caught.message : "No se pudo cerrar la sesión.");
    }
  }

  return <section className="ent-recovery-controls" aria-labelledby="recovery-heading"><div><p className="ent-kicker">Continuidad privada</p><h2 id="recovery-heading">Recupera tu espacio en otro dispositivo</h2><p>El código no contiene tu correo ni tu nombre. Quien lo conozca podrá acceder al progreso, así que trátalo como una contraseña.</p></div>{recoveryCode ? <div className="ent-recovery-code"><span>Código de recuperación</span><code>{recoveryCode}</code>{expiresAt ? <small>Válido hasta {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(expiresAt))}</small> : null}<button type="button" className="ent-secondary-action" onClick={() => void navigator.clipboard.writeText(recoveryCode).then(() => setMessage("Código copiado."))}>Copiar código</button></div> : null}<div className="ent-form-actions"><a className="ent-secondary-action" href="/recuperar">Ya tengo un código</a><button type="button" className="ent-secondary-action" disabled={pending !== null} onClick={() => void issueCode()}>{pending === "issue" ? "Generando…" : recoveryCode ? "Rotar código" : "Generar código"}</button><button type="button" className="ent-secondary-action" disabled={pending !== null} onClick={() => void revokeCode()}>Revocar código</button><button type="button" className="ent-danger-action" disabled={pending !== null} onClick={() => void closeSession()}>{pending === "logout" ? "Cerrando…" : "Cerrar este dispositivo"}</button></div>{message ? <p className="ent-form-status" role="status">{message}</p> : null}</section>;
}

export function LearnerSettingsV2() {
  const state = useDashboard();
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

  if (state.loading) return <LoadingState />;
  if (!state.dashboard) return <ErrorState message={state.error ?? "Inténtalo de nuevo."} retry={state.refresh} />;
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
        setDeleteError("No se pudo eliminar el progreso. Inténtalo de nuevo.");
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
      setDeleteError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
  }
  const deleting = deletePending;
  return <>
  <div className="ent-page-stack" inert={confirmDelete ? true : undefined}>
    <section className="ent-page-intro" aria-labelledby="settings-heading"><div><p className="ent-kicker">Mi cuenta</p><h2 id="settings-heading">Preferencias, privacidad y datos</h2><p>Tu espacio utiliza un identificador privado guardado en este navegador. No solicitamos nombre ni correo; puedes exportar o eliminar todo tu progreso.</p></div><SaveState value={state.saveState} onRetry={state.refresh} /></section>
    <section className="ent-settings-grid-v2">
      <article><p className="ent-kicker">Perfil</p><h2>{dashboard.learner.displayName}</h2><dl><div><dt>Cuenta</dt><dd>Sesión anónima</dd></div><div><dt>Idioma</dt><dd>Español</dd></div><div><dt>Zona horaria</dt><dd>{dashboard.learner.timezone}</dd></div></dl></article>
      <article><p className="ent-kicker">Privacidad</p><h2>Control personal</h2><p>El progreso, los intentos y la recuperación pertenecen a este espacio. Puedes descargar una copia, rotar el código de recuperación o eliminar actividad cuando lo necesites.</p>{dashboard.brand.supportEmail ? <a href={`mailto:${dashboard.brand.supportEmail}`}>Contactar con soporte</a> : null}</article>
    </section>
    <PreferencesForm dashboard={dashboard} refresh={state.refresh} setSaveState={state.setSaveState} mode="settings" />
    <RecoveryControls />
    <section className="ent-account-actions" aria-labelledby="data-heading"><div><p className="ent-kicker">Tus datos</p><h2 id="data-heading">Portabilidad y control</h2><p>Descarga una copia personal o elimina el progreso de preparación. Tu espacio podrá empezar de nuevo después del borrado.</p></div><div><a className="ent-secondary-action" href="/api/me/export" download>Exportar mi progreso</a><button ref={deleteTriggerRef} type="button" className="ent-danger-action" aria-haspopup="dialog" onClick={() => { setDeleteError(null); setConfirmDelete(true); }}>Eliminar progreso</button></div></section>
  </div>
  {confirmDelete ? <div className="ent-dialog-layer"><button className="ent-dialog-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={closeDeleteDialog} /><section ref={dialogRef} className="ent-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-heading" aria-describedby="delete-description" aria-busy={deleting || undefined}><p className="ent-kicker">Acción irreversible</p><h2 id="delete-heading">¿Eliminar todo tu progreso?</h2><p id="delete-description">Se eliminarán lecciones, repasos, laboratorios, intentos, recompensas y constancias internas. Escribe <b>ELIMINAR</b> para confirmar.</p><label htmlFor="delete-confirmation">Confirmación</label><input id="delete-confirmation" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoComplete="off" aria-describedby="delete-description" disabled={deleting} />{deleteError ? <p className="ent-form-status" role="alert">{deleteError}</p> : null}<div className="ent-form-actions"><button ref={cancelRef} type="button" className="ent-secondary-action" disabled={deleting} onClick={closeDeleteDialog}>Cancelar</button><button type="button" className="ent-danger-action" disabled={deleteText !== "ELIMINAR" || deleting} onClick={() => void deleteProgress()}>{deleting ? "Eliminando…" : "Eliminar definitivamente"}</button></div></section></div> : null}
  </>;
}

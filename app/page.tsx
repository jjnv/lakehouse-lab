"use client";

import { useEffect, useMemo, useState } from "react";
import {
  associateBlueprint,
  buildExamQuestions,
  modules,
  professionalBlueprint,
  totalMinutes,
  trackMeta,
  type CurriculumModule,
  type TrackId,
} from "./course-data";

type ModuleView = "lessons" | "lab" | "quiz";
type ExamMode = "associate" | "professional" | null;
type QuizAnswers = Record<string, Record<number, number>>;

type ProgressState = {
  completedLessons: Record<string, string[]>;
  labsPassed: string[];
  quizScores: Record<string, number>;
  quizAnswers: QuizAnswers;
  completedModules: string[];
  labCode: Record<string, string>;
  examScores: Partial<Record<"associate" | "professional", number>>;
};

const STORAGE_KEY = "lakehouse-lab-progress-v2";
const emptyProgress: ProgressState = {
  completedLessons: {},
  labsPassed: [],
  quizScores: {},
  quizAnswers: {},
  completedModules: [],
  labCode: {},
  examScores: {},
};

const trackOrder: TrackId[] = ["core", "streaming", "pipelines", "performance", "delivery", "final"];

function deriveProgress(progress: ProgressState): ProgressState {
  const completedModules = modules
    .filter((module) =>
      (progress.completedLessons[module.id]?.length ?? 0) >= module.lessons.length &&
      progress.labsPassed.includes(module.id) &&
      (progress.quizScores[module.id] ?? 0) >= 3,
    )
    .map((module) => module.id);
  return { ...progress, completedModules };
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export default function Home() {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState("m01");
  const [view, setView] = useState<ModuleView>("lessons");
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<TrackId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "completed">("all");
  const [cloud, setCloud] = useState<"AWS" | "Azure" | "GCP">("AWS");
  const [labResult, setLabResult] = useState<{ checks: boolean[]; passed: boolean } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [examMode, setExamMode] = useState<ExamMode>(null);
  const [examPage, setExamPage] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  const completed = useMemo(() => new Set(progress.completedModules), [progress.completedModules]);
  const activeModule = modules.find((module) => module.id === activeId) ?? modules[0];
  const completedMinutes = modules.filter((module) => completed.has(module.id)).reduce((sum, module) => sum + module.minutes, 0);
  const percent = Math.round((completedMinutes / totalMinutes) * 100);

  const isUnlocked = (module: CurriculumModule) => module.prerequisites.every((id) => completed.has(id));

  const filteredModules = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    return modules.filter((module) => {
      const matchesText = !normalized || [module.title, module.short, module.description, ...module.examDomains].join(" ").toLocaleLowerCase("es").includes(normalized);
      const matchesTrack = trackFilter === "all" || module.track === trackFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "completed" ? completed.has(module.id) : isUnlocked(module) && !completed.has(module.id));
      return matchesText && matchesTrack && matchesStatus;
    });
  }, [search, trackFilter, statusFilter, completed]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let restored = emptyProgress;
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (stored && typeof stored === "object") restored = deriveProgress({ ...emptyProgress, ...stored });
      } catch {}
      setProgress(restored);

      const params = new URLSearchParams(window.location.search);
      const exam = params.get("exam");
      const slug = params.get("module");
      const restoredCompleted = new Set(restored.completedModules);
      if (exam === "associate" && restoredCompleted.has("m11")) setExamMode(exam);
      if (exam === "professional" && ["m17","m22","m27","m31"].every((id) => restoredCompleted.has(id))) setExamMode(exam);
      if (slug) {
        const deepLinked = modules.find((module) => module.slug === slug);
        if (deepLinked && deepLinked.prerequisites.every((id) => restoredCompleted.has(id))) setActiveId(deepLinked.id);
      }
      setLoaded(true);
    });

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const exam = params.get("exam");
      setExamMode(exam === "associate" || exam === "professional" ? exam : null);
      const deepLinked = modules.find((module) => module.slug === params.get("module"));
      if (deepLinked) setActiveId(deepLinked.id);
    };
    window.addEventListener("popstate", onPopState);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", onPopState); };
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, loaded]);

  function updateProgress(updater: (current: ProgressState) => ProgressState) {
    setProgress((current) => deriveProgress(updater(current)));
  }

  function openModule(module: CurriculumModule) {
    if (!isUnlocked(module)) return;
    setActiveId(module.id);
    setView("lessons");
    setSubmittedQuiz(false);
    setLabResult(null);
    setShowSolution(false);
    setExamMode(null);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("module", module.slug);
    history.pushState({}, "", url);
    requestAnimationFrame(() => document.getElementById("academy")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openExam(mode: Exclude<ExamMode, null>) {
    const allowed = mode === "associate" ? completed.has("m11") : ["m17","m22","m27","m31"].every((id) => completed.has(id));
    if (!allowed) return;
    setExamMode(mode);
    setExamPage(0);
    setExamAnswers({});
    setExamSubmitted(false);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("exam", mode);
    history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeExam() {
    setExamMode(null);
    const url = new URL(window.location.href);
    url.search = "";
    history.pushState({}, "", url);
  }

  function toggleLesson(lessonId: string) {
    updateProgress((current) => {
      const lessons = new Set(current.completedLessons[activeModule.id] ?? []);
      lessons.has(lessonId) ? lessons.delete(lessonId) : lessons.add(lessonId);
      return { ...current, completedLessons: { ...current.completedLessons, [activeModule.id]: [...lessons] } };
    });
  }

  function setLabCode(value: string) {
    updateProgress((current) => ({ ...current, labCode: { ...current.labCode, [activeModule.id]: value } }));
    setLabResult(null);
  }

  function runLab() {
    const code = progress.labCode[activeModule.id] ?? activeModule.lab.starterCode;
    const checks = activeModule.lab.checks.map((check) => new RegExp(check.pattern, "i").test(code));
    const passed = checks.every(Boolean);
    setLabResult({ checks, passed });
    if (passed) updateProgress((current) => ({ ...current, labsPassed: [...new Set([...current.labsPassed, activeModule.id])] }));
  }

  function chooseQuizAnswer(question: number, option: number) {
    updateProgress((current) => ({
      ...current,
      quizAnswers: { ...current.quizAnswers, [activeModule.id]: { ...(current.quizAnswers[activeModule.id] ?? {}), [question]: option } },
    }));
    setSubmittedQuiz(false);
  }

  function submitQuiz() {
    const answers = progress.quizAnswers[activeModule.id] ?? {};
    const score = activeModule.quiz.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
    updateProgress((current) => ({ ...current, quizScores: { ...current.quizScores, [activeModule.id]: score } }));
    setSubmittedQuiz(true);
  }

  function resetAcademy() {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(emptyProgress);
    setActiveId("m01");
    setView("lessons");
    setSubmittedQuiz(false);
    setLabResult(null);
  }

  const continueModule = modules.find((module) => isUnlocked(module) && !completed.has(module.id)) ?? modules[31];

  if (examMode) {
    return <ExamSimulator
      mode={examMode}
      page={examPage}
      answers={examAnswers}
      submitted={examSubmitted}
      previousScore={progress.examScores[examMode]}
      onPage={setExamPage}
      onAnswer={(index, answer) => { setExamAnswers((current) => ({ ...current, [index]: answer })); setExamSubmitted(false); }}
      onSubmit={(score) => { setExamSubmitted(true); updateProgress((current) => ({ ...current, examScores: { ...current.examScores, [examMode]: score } })); }}
      onClose={closeExam}
    />;
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Inicio de Lakehouse Lab"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a>
        <nav aria-label="Navegación principal"><a href="#roadmap">Mapa</a><a href="#catalog">Temario</a><a href="#academy">Academia</a></nav>
        <div className="header-progress"><span>{percent}%</span><div><i style={{ width: `${percent}%` }} /></div></div>
      </header>

      <div id="top" className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Data Engineer Associate → Professional</p>
            <h1 id="hero-title">De lakehouse<br />a producción<span>.</span></h1>
            <p className="hero-text">Una academia de ingeniería Databricks: 32 módulos, 160 lecciones, 30 laboratorios y dos proyectos para dominar el examen y el trabajo real.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => openModule(continueModule)}>Continuar: módulo {continueModule.number}<span>→</span></button>
              <button className="secondary-button" onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior:"smooth" })}>Explorar el mapa</button>
            </div>
            <div className="hero-proof"><span>100 h</span><span>Multinube</span><span>Blueprint 2026</span><span>Práctica razonada</span></div>
          </div>
          <div className="hero-dashboard">
            <div className="hero-progress-card">
              <div className="progress-orbit" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><strong>{percent}%</strong><small>completado</small></div>
              <div><p>Tu progreso</p><b>{completed.size} de 32 módulos</b><span>{formatHours(completedMinutes)} de {formatHours(totalMinutes)}</span></div>
            </div>
            <div className="mini-path" aria-label="Estructura de la academia">
              <div className="mini-core"><span>01—12</span><b>Tronco común</b></div>
              <div className="branch-lines"><i /><i /><i /><i /></div>
              <div className="mini-branches"><span>Streaming</span><span>Pipelines</span><span>FinOps</span><span>Entrega</span></div>
              <div className="mini-final">32 · Professional</div>
            </div>
          </div>
        </section>

        <section className="exam-strip" aria-label="Simulacros de certificación">
          <div><p className="eyebrow">Evaluación acumulativa</p><h2>Dos hitos. Una carrera completa.</h2></div>
          <button disabled={!completed.has("m11")} onClick={() => openExam("associate")}><span>Associate</span><b>45 preguntas · 90 min</b><small>{progress.examScores.associate !== undefined ? `Último resultado: ${progress.examScores.associate}%` : completed.has("m11") ? "Listo para comenzar" : "Se desbloquea al completar el módulo 11"}</small></button>
          <button disabled={!(["m17","m22","m27","m31"].every((id) => completed.has(id)))} onClick={() => openExam("professional")}><span>Professional</span><b>59 preguntas · 120 min</b><small>{progress.examScores.professional !== undefined ? `Último resultado: ${progress.examScores.professional}%` : ["m17","m22","m27","m31"].every((id) => completed.has(id)) ? "Listo para comenzar" : "Se desbloquea al completar las cuatro ramas"}</small></button>
        </section>

        <section id="roadmap" className="roadmap" aria-labelledby="roadmap-title">
          <div className="section-heading"><div><p className="eyebrow">Mapa de dominio</p><h2 id="roadmap-title">Un núcleo. Cuatro especializaciones.</h2></div><p>Completa el tronco común para abrir las cuatro ramas. El proyecto Professional converge todo lo aprendido.</p></div>
          <TrackRow track="core" completed={completed} isUnlocked={isUnlocked} onOpen={openModule} />
          <div className="roadmap-split"><span /><span /><span /><span /></div>
          <div className="branch-grid">
            {(["streaming","pipelines","performance","delivery"] as TrackId[]).map((track) => <TrackRow key={track} track={track} completed={completed} isUnlocked={isUnlocked} onOpen={openModule} compact />)}
          </div>
          <div className="roadmap-merge"><span /><span /><span /><span /></div>
          <TrackRow track="final" completed={completed} isUnlocked={isUnlocked} onOpen={openModule} />
        </section>

        <section id="catalog" className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading"><div><p className="eyebrow">Catálogo completo</p><h2 id="catalog-title">Busca por habilidad, nivel o estado.</h2></div><button className="text-button" onClick={resetAcademy}>Reiniciar academia</button></div>
          <div className="filters">
            <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. Auto Loader, ABAC, skew…" /></label>
            <label><span>Rama</span><select value={trackFilter} onChange={(event) => setTrackFilter(event.target.value as TrackId | "all")}><option value="all">Todas</option>{trackOrder.map((track) => <option key={track} value={track}>{trackMeta[track].name}</option>)}</select></label>
            <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos</option><option value="available">Disponibles</option><option value="completed">Superados</option></select></label>
            <div className="result-count"><strong>{filteredModules.length}</strong><span>módulos</span></div>
          </div>
          <div className="module-grid">
            {filteredModules.map((module) => <ModuleCard key={module.id} module={module} unlocked={isUnlocked(module)} done={completed.has(module.id)} onOpen={openModule} />)}
          </div>
          {!filteredModules.length && <div className="empty-state"><b>No hay módulos con esos filtros.</b><button onClick={() => { setSearch(""); setTrackFilter("all"); setStatusFilter("all"); }}>Limpiar filtros</button></div>}
        </section>

        <section id="academy" className="academy" aria-labelledby="module-title">
          <aside className="academy-sidebar">
            <p className="eyebrow">Academia</p>
            <div className="sidebar-list">
              {modules.map((module) => <button key={module.id} disabled={!isUnlocked(module)} onClick={() => openModule(module)} className={activeModule.id === module.id ? "active" : completed.has(module.id) ? "done" : ""}><span>{completed.has(module.id) ? "✓" : module.number}</span><div><b>{module.short}</b><small>{trackMeta[module.track].name}</small></div></button>)}
            </div>
          </aside>

          <div className="academy-content">
            <div className="module-header">
              <div><p className="eyebrow">Módulo {activeModule.number} · {activeModule.level} · {formatHours(activeModule.minutes)}</p><h2 id="module-title">{activeModule.title}</h2><p>{activeModule.description}</p></div>
              <div className={`mastery ${completed.has(activeModule.id) ? "passed" : ""}`}><strong>{completed.has(activeModule.id) ? "✓" : `${Math.round(((progress.completedLessons[activeModule.id]?.length ?? 0) / activeModule.lessons.length) * 100)}%`}</strong><span>{completed.has(activeModule.id) ? "Superado" : "Lecciones"}</span></div>
            </div>
            <div className="module-metadata"><span>{trackMeta[activeModule.track].name}</span>{activeModule.examDomains.map((domain) => <span key={domain}>{domain}</span>)}</div>
            <div className="academy-tabs" role="tablist" aria-label="Contenido del módulo">
              <button role="tab" aria-selected={view === "lessons"} className={view === "lessons" ? "active" : ""} onClick={() => setView("lessons")}>01 · Lecciones <i>{progress.completedLessons[activeModule.id]?.length ?? 0}/5</i></button>
              <button role="tab" aria-selected={view === "lab"} className={view === "lab" ? "active" : ""} onClick={() => setView("lab")}>02 · Laboratorio <i>{progress.labsPassed.includes(activeModule.id) ? "✓" : ""}</i></button>
              <button role="tab" aria-selected={view === "quiz"} className={view === "quiz" ? "active" : ""} onClick={() => setView("quiz")}>03 · Test <i>{progress.quizScores[activeModule.id] ?? "—"}/4</i></button>
            </div>

            {view === "lessons" && <LessonsView module={activeModule} completedLessons={progress.completedLessons[activeModule.id] ?? []} onToggle={toggleLesson} onNext={() => setView("lab")} />}
            {view === "lab" && <LabView module={activeModule} code={progress.labCode[activeModule.id] ?? activeModule.lab.starterCode} cloud={cloud} result={labResult} passed={progress.labsPassed.includes(activeModule.id)} showSolution={showSolution} onCloud={setCloud} onCode={setLabCode} onRun={runLab} onSolution={() => setShowSolution((value) => !value)} onNext={() => setView("quiz")} />}
            {view === "quiz" && <QuizView module={activeModule} answers={progress.quizAnswers[activeModule.id] ?? {}} submitted={submittedQuiz} score={progress.quizScores[activeModule.id]} requirementsMet={(progress.completedLessons[activeModule.id]?.length ?? 0) >= activeModule.lessons.length && progress.labsPassed.includes(activeModule.id)} onAnswer={chooseQuizAnswer} onSubmit={submitQuiz} onBack={() => setView("lessons")} />}
          </div>
        </section>
      </div>

      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a><p>Contenido original basado en documentación oficial · no contiene preguntas reales de examen.</p><a href="#top">Volver arriba ↑</a></footer>
    </main>
  );
}

function TrackRow({ track, completed, isUnlocked, onOpen, compact = false }: { track: TrackId; completed: Set<string>; isUnlocked: (module: CurriculumModule) => boolean; onOpen: (module: CurriculumModule) => void; compact?: boolean }) {
  const items = modules.filter((module) => module.track === track);
  const meta = trackMeta[track];
  return <article className={`track-row track-${meta.color} ${compact ? "compact" : ""}`}>
    <div className="track-heading"><span>{meta.eyebrow}</span><h3>{meta.name}</h3><p>{meta.description}</p></div>
    <div className="track-modules">{items.map((module) => <button key={module.id} onClick={() => onOpen(module)} disabled={!isUnlocked(module)} className={completed.has(module.id) ? "done" : isUnlocked(module) ? "ready" : "locked"}><span>{completed.has(module.id) ? "✓" : module.number}</span><b>{module.short}</b><small>{formatHours(module.minutes)}</small></button>)}</div>
  </article>;
}

function ModuleCard({ module, unlocked, done, onOpen }: { module: CurriculumModule; unlocked: boolean; done: boolean; onOpen: (module: CurriculumModule) => void }) {
  const prerequisiteNames = module.prerequisites.map((id) => modules.find((item) => item.id === id)?.number).filter(Boolean).join(", ");
  return <button className={`module-card track-${trackMeta[module.track].color}`} onClick={() => onOpen(module)} disabled={!unlocked}>
    <span className="module-number">{done ? "✓" : module.number}</span>
    <span className="module-track">{trackMeta[module.track].name}</span>
    <b>{module.title}</b>
    <p>{module.description}</p>
    <div><span>{formatHours(module.minutes)}</span><span>5 lecciones</span><span>1 lab</span></div>
    <small className={done ? "done" : unlocked ? "ready" : "locked"}>{done ? "Módulo superado" : unlocked ? "Abrir módulo →" : `Requiere ${prerequisiteNames}`}</small>
  </button>;
}

function LessonsView({ module, completedLessons, onToggle, onNext }: { module: CurriculumModule; completedLessons: string[]; onToggle: (id: string) => void; onNext: () => void }) {
  return <div className="lessons-view" role="tabpanel">
    <div className="outcomes"><span>Al terminar podrás</span>{module.outcomes.map((outcome) => <p key={outcome}>✓ {outcome}</p>)}</div>
    {module.lessons.map((lesson, index) => {
      const done = completedLessons.includes(lesson.id);
      return <article className={`lesson ${done ? "done" : ""}`} key={lesson.id}>
        <div className="lesson-index">{String(index + 1).padStart(2,"0")}</div>
        <div className="lesson-copy"><p className="eyebrow">{lesson.kicker}</p><h3>{lesson.title}</h3><p className="lead">{lesson.summary}</p><p>{lesson.detail}</p><div className="decision-grid">{lesson.decisions.map((decision) => <span key={decision}>{decision}</span>)}</div></div>
        <button className="lesson-check" onClick={() => onToggle(lesson.id)} aria-pressed={done}>{done ? "✓ Leída" : "Marcar leída"}</button>
      </article>;
    })}
    <div className="source-card"><div><span>Fuente oficial · revisada {module.source.reviewedAt}</span><b>{module.source.label}</b></div><a href={module.source.href} target="_blank" rel="noreferrer">Abrir documentación ↗</a></div>
    <div className="view-next"><span>{completedLessons.length}/5 lecciones completadas</span><button className="primary-button" onClick={onNext}>Ir al laboratorio <span>→</span></button></div>
  </div>;
}

function LabView({ module, code, cloud, result, passed, showSolution, onCloud, onCode, onRun, onSolution, onNext }: { module: CurriculumModule; code: string; cloud: "AWS"|"Azure"|"GCP"; result: { checks:boolean[]; passed:boolean } | null; passed:boolean; showSolution:boolean; onCloud:(cloud:"AWS"|"Azure"|"GCP")=>void; onCode:(code:string)=>void; onRun:()=>void; onSolution:()=>void; onNext:()=>void }) {
  const cloudNote = module.lab.cloudNotes.find((item) => item.cloud === cloud)!;
  return <div className="lab-view" role="tabpanel">
    <div className="lab-brief"><span>⌘</span><div><p className="eyebrow">Práctica guiada · {formatHours(Math.max(60, module.minutes - 90))}</p><h3>{module.lab.title}</h3><p>{module.lab.goal}</p></div></div>
    <ol className="lab-steps">{module.lab.steps.map((step,index) => <li key={step}><span>{index+1}</span><p>{step}</p></li>)}</ol>
    <div className="cloud-panel"><div className="cloud-tabs" role="tablist" aria-label="Variante de nube">{(["AWS","Azure","GCP"] as const).map((item) => <button role="tab" aria-selected={cloud===item} className={cloud===item?"active":""} onClick={() => onCloud(item)} key={item}>{item}</button>)}</div><p>{cloudNote.note}</p></div>
    <div className="editor"><div className="editor-bar"><div><i/><i/><i/><b>{module.lab.solution.trimStart().startsWith("SELECT") || module.lab.solution.trimStart().startsWith("CREATE") || module.lab.solution.trimStart().startsWith("ALTER") || module.lab.solution.trimStart().startsWith("MERGE") ? "solution.sql" : "solution.py"}</b></div><button onClick={onSolution}>{showSolution ? "Ocultar solución" : "Ver referencia"}</button></div><textarea value={showSolution ? module.lab.solution : code} onChange={(event) => onCode(event.target.value)} readOnly={showSolution} spellCheck={false} aria-label="Editor del laboratorio"/><div className="editor-actions"><span>Sandbox didáctico · no ejecuta un clúster real</span><button onClick={onRun}>▶ Validar solución</button></div></div>
    {result && <div className={`lab-result ${result.passed ? "passed":"failed"}`}><div><strong>{result.passed ? "✓ Laboratorio validado" : "Revisa los checks pendientes"}</strong><span>{result.checks.filter(Boolean).length}/{result.checks.length} checks</span></div>{module.lab.checks.map((check,index) => <p key={check.label} className={result.checks[index]?"ok":"missing"}>{result.checks[index]?"✓":"×"} {check.label}</p>)}</div>}
    {passed && !result && <div className="lab-result passed"><strong>✓ Laboratorio ya superado</strong></div>}
    <div className="view-next"><span>{passed ? "Práctica completada" : "Completa todos los checks para avanzar"}</span><button className="primary-button" onClick={onNext}>Hacer el test <span>→</span></button></div>
  </div>;
}

function QuizView({ module, answers, submitted, score, requirementsMet, onAnswer, onSubmit, onBack }: { module: CurriculumModule; answers:Record<number,number>; submitted:boolean; score?:number; requirementsMet:boolean; onAnswer:(question:number,option:number)=>void; onSubmit:()=>void; onBack:()=>void }) {
  return <div className="quiz-view" role="tabpanel">
    <div className="quiz-intro"><div><p className="eyebrow">Evaluación razonada</p><h3>Necesitas 3 de 4 respuestas correctas.</h3><p>La explicación aparece al enviar. Para superar el módulo también debes completar las cinco lecciones y el laboratorio.</p></div><strong>{Object.keys(answers).length}/4</strong></div>
    <div className="quiz-list">{module.quiz.map((question,index) => <fieldset key={question.question}><legend><span>{String(index+1).padStart(2,"0")}</span>{question.question}</legend><div>{question.options.map((option,optionIndex) => { const selected=answers[index]===optionIndex; const correct=question.answer===optionIndex; return <label key={option} className={submitted ? correct?"correct":selected?"incorrect":"" : selected?"selected":""}><input type="radio" name={`${module.id}-${index}`} checked={selected} onChange={() => onAnswer(index,optionIndex)} /><span>{String.fromCharCode(65+optionIndex)}</span>{option}</label>; })}</div>{submitted && <p className="quiz-feedback">{question.explanation}</p>}</fieldset>)}</div>
    <div className="quiz-submit"><button className="secondary-button" onClick={onBack}>← Volver a lecciones</button><div>{submitted && <p className={(score??0)>=3&&requirementsMet?"pass":"warn"}>{(score??0)>=3 ? requirementsMet ? "Módulo superado. El siguiente ya está disponible." : "Test aprobado; completa lecciones y laboratorio." : `Resultado: ${score ?? 0}/4. Repasa las explicaciones.`}</p>}<button className="primary-button" disabled={Object.keys(answers).length<4} onClick={onSubmit}>Corregir test <span>→</span></button></div></div>
  </div>;
}

function ExamSimulator({ mode, page, answers, submitted, previousScore, onPage, onAnswer, onSubmit, onClose }: { mode:"associate"|"professional"; page:number; answers:Record<number,number>; submitted:boolean; previousScore?:number; onPage:(page:number)=>void; onAnswer:(index:number,answer:number)=>void; onSubmit:(score:number)=>void; onClose:()=>void }) {
  const questions = useMemo(() => buildExamQuestions(mode), [mode]);
  const pageSize = 10;
  const pages = Math.ceil(questions.length/pageSize);
  const visible = questions.slice(page*pageSize, (page+1)*pageSize);
  const score = questions.reduce((sum,question,index) => sum+(answers[index]===question.answer?1:0),0);
  const percent = Math.round((score/questions.length)*100);
  const answered = Object.keys(answers).length;
  const blueprint = mode === "associate" ? associateBlueprint : professionalBlueprint;
  return <main className="exam-shell">
    <header className="exam-header"><button className="brand as-button" onClick={onClose}><span className="brand-mark"><i/><i/><i/></span>Lakehouse Lab</button><div><span>{mode === "associate" ? "Associate":"Professional"}</span><b>{questions.length} preguntas · simulacro original</b></div><button className="secondary-button" onClick={onClose}>Cerrar</button></header>
    <div className="exam-progress"><i style={{width:`${(answered/questions.length)*100}%`}}/></div>
    <section className="exam-hero"><p className="eyebrow">Simulacro {mode === "associate" ? "Associate":"Professional"}</p><h1>Piensa como ingeniero,<br/>no como memorizador<span>.</span></h1><p>Preguntas originales inspiradas en dominios oficiales. El 80% es una señal interna de preparación, no la nota oficial del examen.</p><div><span>{answered}/{questions.length} respondidas</span>{previousScore !== undefined && <span>Anterior: {previousScore}%</span>}<a href={blueprint} target="_blank" rel="noreferrer">Blueprint oficial ↗</a></div></section>
    <section className="exam-questions"><div className="exam-page-heading"><span>Página {page+1} de {pages}</span><b>Preguntas {page*pageSize+1}—{Math.min((page+1)*pageSize,questions.length)}</b></div>{visible.map((question,localIndex) => { const index=page*pageSize+localIndex; return <fieldset key={index}><legend><span>{String(index+1).padStart(2,"0")}</span>{question.question}</legend><div>{question.options.map((option,optionIndex) => <label key={option} className={submitted ? question.answer===optionIndex?"correct":answers[index]===optionIndex?"incorrect":"" : answers[index]===optionIndex?"selected":""}><input type="radio" name={`exam-${index}`} checked={answers[index]===optionIndex} onChange={() => onAnswer(index,optionIndex)}/><span>{String.fromCharCode(65+optionIndex)}</span>{option}</label>)}</div>{submitted && <p className="quiz-feedback">{question.explanation}</p>}</fieldset> })}</section>
    <div className="exam-nav"><button className="secondary-button" disabled={page===0} onClick={() => {onPage(page-1);window.scrollTo({top:0,behavior:"smooth"})}}>← Anterior</button><div>{Array.from({length:pages},(_,index)=><button key={index} aria-label={`Ir a página ${index+1}`} className={page===index?"active":""} onClick={() => onPage(index)}>{index+1}</button>)}</div>{page<pages-1?<button className="primary-button" onClick={() => {onPage(page+1);window.scrollTo({top:0,behavior:"smooth"})}}>Siguiente →</button>:<button className="primary-button" disabled={answered<questions.length} onClick={() => onSubmit(percent)}>Corregir simulacro →</button>}</div>
    {submitted && <div className={`exam-result ${percent>=80?"passed":"failed"}`}><strong>{percent}%</strong><div><h2>{percent>=80?"Preparación sólida":"Aún hay dominios que reforzar"}</h2><p>{score} de {questions.length} respuestas correctas. Revisa las explicaciones y vuelve a intentarlo con un orden distinto.</p></div></div>}
  </main>;
}

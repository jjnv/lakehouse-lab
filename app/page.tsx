"use client";

import { useEffect, useMemo, useState } from "react";
import { modules } from "./course-data";

type LessonView = "learn" | "lab" | "test";
type AnswerMap = Record<number, Record<number, number>>;
type LabRun = { checks: boolean[]; passed: boolean };

const certificationFacts = [
  { name: "Data Engineer Associate", questions: "45 preguntas", time: "90 min", focus: "Fundamentos, ingesta, ETL, Jobs, CI/CD y gobierno", href: "https://www.databricks.com/learn/certification/data-engineer-associate" },
  { name: "Data Engineer Professional", questions: "59 preguntas", time: "120 min", focus: "Pipelines avanzados, streaming, rendimiento, seguridad y despliegue", href: "https://www.databricks.com/learn/certification/data-engineer-professional" },
];

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [view, setView] = useState<LessonView>("learn");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [labCode, setLabCode] = useState<Record<number, string>>({});
  const [labRuns, setLabRuns] = useState<Record<number, LabRun>>({});
  const [labsPassed, setLabsPassed] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState<Record<number, number>>({});
  const [showSolution, setShowSolution] = useState<number[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("lakehouse-lab-v2") || "{}");
        if (Array.isArray(stored.completed)) setCompleted(stored.completed.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < modules.length));
        if (stored.answers && typeof stored.answers === "object") setAnswers(stored.answers);
        if (stored.labCode && typeof stored.labCode === "object") setLabCode(stored.labCode);
        if (Array.isArray(stored.labsPassed)) setLabsPassed(stored.labsPassed);
      } catch {}
      setProgressLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (progressLoaded) localStorage.setItem("lakehouse-lab-v2", JSON.stringify({ completed, answers, labCode, labsPassed }));
  }, [completed, answers, labCode, labsPassed, progressLoaded]);

  const current = modules[active];
  const percent = Math.round((completed.length / modules.length) * 100);
  const moduleAnswers = useMemo(() => answers[active] || {}, [answers, active]);
  const moduleScore = useMemo(() => current.questions.reduce((score, question, index) => score + (moduleAnswers[index] === question.answer ? 1 : 0), 0), [current, moduleAnswers]);
  const hasSubmitted = submitted.includes(active);
  const hasPassed = moduleScore >= 3;
  const currentLabCode = labCode[active] ?? current.lab.starterCode;
  const currentLabRun = labRuns[active];
  const isUnlocked = (index: number) => index === 0 || completed.includes(index - 1);

  function openModule(index: number, nextView: LessonView = "learn") {
    if (!isUnlocked(index)) return;
    setActive(index);
    setView(nextView);
    setCopied(false);
    setShowSolution((items) => items.filter((item) => item !== index));
    requestAnimationFrame(() => document.getElementById("academy")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function chooseAnswer(question: number, option: number) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [active]: { ...(currentAnswers[active] || {}), [question]: option } }));
    setSubmitted((items) => items.filter((item) => item !== active));
  }

  function submitTest() {
    setSubmitted((items) => items.includes(active) ? items : [...items, active]);
    if (moduleScore >= 3) setCompleted((items) => items.includes(active) ? items : [...items, active].sort());
  }

  function retryTest() {
    setAnswers((items) => ({ ...items, [active]: {} }));
    setSubmitted((items) => items.filter((item) => item !== active));
  }

  function resetCourse() {
    setCompleted([]);
    setAnswers({});
    setSubmitted([]);
    setLabCode({});
    setLabRuns({});
    setLabsPassed([]);
    setHintStep({});
    setShowSolution([]);
    setActive(0);
    setView("learn");
  }

  async function copyCode() {
    await navigator.clipboard.writeText(current.code.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function runLab() {
    const checks = current.lab.checks.map((check) => new RegExp(check.pattern, "i").test(currentLabCode));
    const passed = checks.every(Boolean);
    setLabRuns((runs) => ({ ...runs, [active]: { checks, passed } }));
    if (passed) setLabsPassed((items) => items.includes(active) ? items : [...items, active].sort());
  }

  function resetLab() {
    setLabCode((items) => ({ ...items, [active]: current.lab.starterCode }));
    setLabRuns((items) => { const next = { ...items }; delete next[active]; return next; });
    setShowSolution((items) => items.filter((item) => item !== active));
    setHintStep((items) => ({ ...items, [active]: 0 }));
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#path" aria-label="Inicio de Lakehouse Lab"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a>
        <nav aria-label="Navegación principal">
          <a className="active" href="#path">Ruta</a>
          <a href="#modules">Módulos</a>
          <a href="#certification">Exámenes</a>
        </nav>
        <div className="header-progress"><span>{percent}%</span><div><i style={{ width: `${percent}%` }} /></div></div>
      </header>

      <div className="page-shell" id="path">
        <section className="hero-grid" aria-labelledby="hero-title">
          <div className="hero-card">
            <div className="hero-copy">
              <p className="eyebrow">Preparación Data Engineer Associate → Professional</p>
              <h1 id="hero-title">Aprende. Ejecuta.<br />Certifica<span>.</span></h1>
              <p className="hero-text">Teoría alineada al examen, laboratorios ejecutables de SQL/PySpark y tests razonados para las dos certificaciones.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => openModule(Math.min(completed.length, modules.length - 1))}>{completed.length ? "Continuar aprendiendo" : "Empezar el programa"}<span aria-hidden="true">→</span></button>
                <span className="hero-meta">Associate + Professional · práctica sin ayudas</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="dot-field" /><div className="chart-line"><i /><i /><i /><i /></div><div className="waves">≈≈≈</div></div>
          </div>

          <div className="progress-stack">
            <article className="progress-card">
              <div className="card-heading"><p>Progreso del programa</p>{completed.length > 0 && <button className="text-button" onClick={resetCourse}>Reiniciar</button>}</div>
              <div className="progress-content">
                <div className="progress-ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties} aria-label={`${percent}% completado`}><span>{percent}<small>%</small></span></div>
                <div><b>{completed.length} de {modules.length} módulos</b><p>{percent === 100 ? "Has superado todos los tests." : percent ? "Tu siguiente módulo ya está preparado." : "Aprueba cada test con al menos un 75%."}</p></div>
              </div>
            </article>
            <article className="path-card">
              <p className="card-title">Ruta de dominio</p>
              <div className="path-nodes">
                {modules.map((module, index) => {
                  const done = completed.includes(index);
                  const unlocked = isUnlocked(index);
                  return <button key={module.number} onClick={() => openModule(index)} disabled={!unlocked} className={done ? "done" : unlocked ? "current" : ""} aria-label={`${module.title}: ${done ? "superado" : unlocked ? "disponible" : "bloqueado"}`}><span>{done ? "✓" : index + 1}</span><small>{module.short}</small></button>;
                })}
              </div>
            </article>
          </div>
        </section>

        <section id="certification" className="certification-map" aria-labelledby="certification-title">
          <div className="certification-copy"><p className="eyebrow">Objetivo de certificación</p><h2 id="certification-title">Una ruta, dos niveles.</h2><p>El contenido prioriza el blueprint oficial actual. Los retos imitan decisiones de código y arquitectura, pero no contienen preguntas reales del examen.</p></div>
          {certificationFacts.map((exam, index) => <a href={exam.href} target="_blank" rel="noreferrer" className="exam-card" key={exam.name}><span>0{index + 1}</span><div><p>{exam.name}</p><b>{exam.questions} · {exam.time}</b><small>{exam.focus}</small></div><i>↗</i></a>)}
        </section>

        <section id="modules" className="modules-section" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow">Plan de estudios</p><h2 id="modules-title">Seis módulos. Un sistema completo.</h2></div><p>Supera el test de un módulo para desbloquear el siguiente.</p></div>
          <div className="module-grid">
            {modules.map((module, index) => {
              const done = completed.includes(index);
              const unlocked = isUnlocked(index);
              const answered = Object.keys(answers[index] || {}).length;
              return <button className={`module-card ${done ? "is-done" : ""}`} key={module.number} onClick={() => openModule(index)} disabled={!unlocked}>
                <span className="module-top"><b>{module.number}</b><i>{module.icon}</i></span>
                <span className="level-tag">{module.exam}</span>
                <span className="module-title">{module.title}</span>
                <span className="duration"><span aria-hidden="true">◷</span>{module.duration} · 3 lecciones</span>
                <span className={`status ${done ? "complete" : unlocked ? "ready" : "locked"}`}>{done ? "✓ Test superado" : unlocked ? answered ? `${answered}/4 respondidas` : "▷ Empezar módulo" : "▣ Bloqueado"}</span>
              </button>;
            })}
          </div>
        </section>

        <section id="academy" className="academy" aria-labelledby="lesson-title">
          <aside className="course-sidebar">
            <p className="eyebrow">Academia</p>
            <div className="sidebar-modules">
              {modules.map((module, index) => <button key={module.number} onClick={() => openModule(index)} disabled={!isUnlocked(index)} className={active === index ? "active" : ""}><span>{completed.includes(index) ? "✓" : module.number}</span><div><b>{module.short}</b><small>{completed.includes(index) ? "Superado" : isUnlocked(index) ? module.exam : "Bloqueado"}</small></div></button>)}
            </div>
          </aside>

          <div className="lesson-workspace">
            <div className="lesson-header">
              <div><p className="eyebrow">Módulo {current.number} · {current.exam} · {current.duration}</p><h2 id="lesson-title">{current.title}</h2><p>{current.description}</p></div>
              <div className={`mastery-badge ${completed.includes(active) ? "passed" : ""}`}><span>{completed.includes(active) ? "✓" : "75%"}</span><small>{completed.includes(active) ? "Superado" : "Para aprobar"}</small></div>
            </div>

            <div className="lesson-tabs" role="tablist" aria-label="Contenido del módulo">
              <button role="tab" aria-selected={view === "learn"} className={view === "learn" ? "active" : ""} onClick={() => setView("learn")}><span>01</span> Explicación</button>
              <button role="tab" aria-selected={view === "lab"} className={view === "lab" ? "active" : ""} onClick={() => setView("lab")}><span>02</span> Laboratorio {labsPassed.includes(active) && <i>✓</i>}</button>
              <button role="tab" aria-selected={view === "test"} className={view === "test" ? "active" : ""} onClick={() => setView("test")}><span>03</span> Test <i>{Object.keys(moduleAnswers).length}/4</i></button>
            </div>

            {view === "learn" && <div className="learn-view" role="tabpanel">
              <div className="outcomes-strip"><span>Al terminar podrás</span>{current.outcomes.map((outcome) => <p key={outcome}>✓ {outcome}</p>)}</div>
              {current.sections.map((section, index) => <article className="chapter" key={section.title}>
                <div className="chapter-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="chapter-body"><p className="eyebrow">{section.kicker}</p><h3>{section.title}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="key-points"><b>Ideas clave</b>{section.points.map((point) => <span key={point}>{point}</span>)}</div></div>
              </article>)}
              <article className="code-lab"><div className="code-heading"><div><span>{current.code.language}</span><b>{current.code.title}</b></div><button onClick={copyCode}>{copied ? "Copiado ✓" : "Copiar código"}</button></div><pre><code>{current.code.content}</code></pre></article>
              <div className="lesson-next"><a href={current.source.href} target="_blank" rel="noreferrer">{current.source.label} ↗</a><button className="primary-button compact-inline" onClick={() => setView("lab")}>Ir al laboratorio <span>→</span></button></div>
            </div>}

            {view === "lab" && <div className="lab-view" role="tabpanel">
              <div className="lab-brief"><div className="lab-icon">⌘</div><div><p className="eyebrow">Práctica guiada</p><h3>{current.lab.title}</h3><p>{current.lab.goal}</p></div></div>
              <ol className="lab-steps">{current.lab.steps.map((step, index) => <li key={step}><span>{index + 1}</span><div><b>{["Prepara", "Construye", "Comprueba", "Documenta"][index]}</b><p>{step}</p></div></li>)}</ol>
              <div className="lab-simulator">
                <div className="simulator-note"><span>⌁</span><div><b>Sandbox de práctica</b><p>Valida estructura e intención y devuelve un resultado simulado. No ejecuta contra un clúster real de Databricks.</p></div><em>{current.lab.language}</em></div>
                <div className="dataset-panel"><div className="panel-title"><div><span>Dataset</span><b>{current.lab.dataset.name}</b></div><small>{current.lab.dataset.schema.join(" · ")}</small></div><div className="table-scroll"><table><thead><tr>{current.lab.dataset.schema.map((field) => <th key={field}>{field.split(" ")[0]}</th>)}</tr></thead><tbody>{current.lab.dataset.preview.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div></div>
                <div className="challenge-bar"><span>Reto</span><p>{current.lab.challenge}</p></div>
                <div className="editor-shell"><div className="editor-toolbar"><div><i className="traffic red" /><i className="traffic yellow" /><i className="traffic green" /><b>{current.lab.language === "SQL" ? "solution.sql" : "solution.py"}</b></div><div><button onClick={() => setHintStep((items) => ({ ...items, [active]: Math.min((items[active] || 0) + 1, current.lab.hints.length) }))}>Pista {Math.min((hintStep[active] || 0) + 1, current.lab.hints.length)}</button><button onClick={resetLab}>Reiniciar</button></div></div><div className="editor-body"><div className="line-numbers">{currentLabCode.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={currentLabCode} onChange={(event) => { setLabCode((items) => ({ ...items, [active]: event.target.value })); setLabRuns((items) => { const next = { ...items }; delete next[active]; return next; }); }} spellCheck={false} aria-label={`Editor ${current.lab.language}`} /></div><div className="editor-footer"><span>{current.lab.language} · UTF-8</span><button className="run-button" onClick={runLab}>▶ Ejecutar</button></div></div>
                {(hintStep[active] || 0) > 0 && <div className="hints-box"><b>Pistas desbloqueadas</b>{current.lab.hints.slice(0, hintStep[active]).map((hint, index) => <p key={hint}><span>{index + 1}</span>{hint}</p>)}</div>}
                {currentLabRun && <div className={`execution-panel ${currentLabRun.passed ? "passed" : "failed"}`}><div className="execution-heading"><div><span>{currentLabRun.passed ? "✓" : "!"}</span><div><b>{currentLabRun.passed ? "Ejecución correcta" : "La solución aún no cumple el reto"}</b><p>{currentLabRun.passed ? current.lab.successMessage : "Revisa los checks fallidos y vuelve a ejecutar."}</p></div></div><small>{currentLabRun.checks.filter(Boolean).length}/{currentLabRun.checks.length} checks</small></div><div className="check-list">{current.lab.checks.map((check, index) => <p className={currentLabRun.checks[index] ? "ok" : "missing"} key={check.label}><span>{currentLabRun.checks[index] ? "✓" : "×"}</span>{check.label}</p>)}</div>{currentLabRun.passed && <div className="result-table"><div className="panel-title"><b>Resultado simulado</b><small>{current.lab.result.rows.length} filas</small></div><div className="table-scroll"><table><thead><tr>{current.lab.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{current.lab.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div></div>}</div>}
                {!currentLabRun?.passed && <div className="solution-reveal"><button onClick={() => setShowSolution((items) => items.includes(active) ? items.filter((item) => item !== active) : [...items, active])}>{showSolution.includes(active) ? "Ocultar solución" : "Ver solución de referencia"}</button>{showSolution.includes(active) && <pre><code>{current.lab.solution}</code></pre>}</div>}
              </div>
              <div className="checkpoint"><span>✓</span><div><b>Criterio de finalización</b><p>{current.lab.checkpoint}</p></div></div>
              <div className="lesson-next"><button className="ghost-button" onClick={() => setView("learn")}>← Volver a la explicación</button><button className="primary-button compact-inline" onClick={() => setView("test")}>Hacer el test <span>→</span></button></div>
            </div>}

            {view === "test" && <div className="test-view" role="tabpanel">
              <div className="test-intro"><div><p className="eyebrow">Evaluación del módulo</p><h3>Demuestra que dominas los conceptos.</h3><p>Necesitas 3 de 4 respuestas correctas. Tras enviar verás una explicación razonada para cada pregunta.</p></div><div className="test-meter"><span>{Object.keys(moduleAnswers).length}/4</span><small>respondidas</small></div></div>
              <div className="module-quiz">
                {current.questions.map((question, questionIndex) => {
                  const selected = moduleAnswers[questionIndex];
                  return <fieldset key={question.question}><legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</legend><div className="option-grid">{question.options.map((option, optionIndex) => {
                    const className = hasSubmitted ? optionIndex === question.answer ? "correct" : selected === optionIndex ? "incorrect" : "" : selected === optionIndex ? "selected" : "";
                    return <label key={option} className={className}><input type="radio" name={`module-${active}-question-${questionIndex}`} checked={selected === optionIndex} onChange={() => chooseAnswer(questionIndex, optionIndex)} /><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{hasSubmitted && optionIndex === question.answer && <b>✓</b>}{hasSubmitted && selected === optionIndex && optionIndex !== question.answer && <b>×</b>}</label>;
                  })}</div>{hasSubmitted && <div className={`answer-feedback ${selected === question.answer ? "correct" : "incorrect"}`}><b>{selected === question.answer ? "Correcto." : "Revisa este concepto."}</b> {question.explanation}</div>}</fieldset>;
                })}
              </div>
              {!hasSubmitted && <div className="test-submit"><p>{Object.keys(moduleAnswers).length < 4 ? `Responde ${4 - Object.keys(moduleAnswers).length} pregunta${4 - Object.keys(moduleAnswers).length === 1 ? "" : "s"} más.` : "Todo listo para corregir."}</p><button className="primary-button compact-inline" disabled={Object.keys(moduleAnswers).length < 4} onClick={submitTest}>Corregir test <span>→</span></button></div>}
              {hasSubmitted && <div className={`test-result ${hasPassed ? "passed" : "failed"}`}><div className="result-score"><strong>{moduleScore}/4</strong><span>{hasPassed ? "Módulo superado" : "Aún no superado"}</span></div><div><h3>{hasPassed ? "Excelente. Has demostrado dominio." : "Casi. Revisa el feedback y vuelve a intentarlo."}</h3><p>{hasPassed ? active === modules.length - 1 ? "Has completado toda la ruta avanzada." : "El siguiente módulo ya está desbloqueado." : "Necesitas al menos tres respuestas correctas para avanzar."}</p></div><div className="result-actions">{!hasPassed && <button className="ghost-button" onClick={retryTest}>Reintentar</button>}{hasPassed && active < modules.length - 1 && <button className="primary-button compact-inline" onClick={() => openModule(active + 1)}>Siguiente módulo <span>→</span></button>}</div></div>}
            </div>}
          </div>
        </section>
      </div>

      <footer><a className="brand" href="#path"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a><p>Explicación rigurosa · práctica guiada · evaluación razonada</p><a href="#path">Volver arriba ↑</a></footer>
    </main>
  );
}

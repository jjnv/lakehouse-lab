"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { PublicModule } from "../../enterprise/curriculum";
import { conceptAnchor } from "../../enterprise/search-anchor";
import AssessmentPanel from "./AssessmentPanel";
import { SaveState, useDashboard } from "./useDashboard";

type CourseSection = "lessons" | "lab" | "quiz";

async function mutationResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok)
    throw new Error(body.message || "No se pudo guardar el progreso.");
  return body;
}

export default function CourseWorkspace({ module }: { module: PublicModule }) {
  const state = useDashboard();
  const [section, setSection] = useState<CourseSection>("lessons");
  const [recall, setRecall] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [labChecks, setLabChecks] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const courseReady = Boolean(!state.loading && state.dashboard);

  const progress = state.dashboard?.progress.find(
    (item) => item.moduleId === module.id,
  );
  const unlocked = progress?.unlocked ?? false;
  const preview = state.dashboard ? !unlocked : false;
  const completedLessons = new Set(progress?.completedLessonIds ?? []);
  const moduleIndex =
    state.dashboard?.modules.findIndex((item) => item.id === module.id) ?? -1;
  const previous =
    moduleIndex > 0 ? state.dashboard?.modules[moduleIndex - 1] : null;
  const next =
    moduleIndex >= 0 ? state.dashboard?.modules[moduleIndex + 1] : null;

  useEffect(() => {
    if (!courseReady) return;
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const requestedSection = params.get("section") ?? params.get("view");
      if (
        requestedSection === "lessons" ||
        requestedSection === "lab" ||
        requestedSection === "quiz"
      ) {
        setSection(requestedSection);
      }
      const lesson = params.get("lesson");
      const requestedConcept = params.get("concept") ?? (window.location.hash.startsWith("#concept-") ? window.location.hash.slice(1) : null);
      if (lesson && module.lessons.some((item) => item.id === lesson)) {
        setSection("lessons");
        requestAnimationFrame(() => {
          const target = document.getElementById(
            `lesson-${lesson}`,
          ) as HTMLDetailsElement | null;
          if (target) {
            target.open = true;
            requestAnimationFrame(() => {
              const conceptTarget = requestedConcept ? document.getElementById(requestedConcept) : null;
              const focusTarget = conceptTarget ?? target.querySelector<HTMLElement>("summary");
              focusTarget?.scrollIntoView({ block: "center" });
              focusTarget?.focus();
            });
          }
        });
      } else {
        requestAnimationFrame(() => {
          const firstLesson = document.getElementById(
            `lesson-${module.lessons[0]?.id}`,
          ) as HTMLDetailsElement | null;
          if (firstLesson) firstLesson.open = true;
        });
      }
      const saved: Record<string, string> = {};
      for (const item of module.lessons)
        saved[item.id] =
          window.localStorage.getItem(`lakehouse-private-draft:${item.id}`) ?? "";
      setRecall(saved);
    });
    return () => cancelAnimationFrame(frame);
  }, [courseReady, module.lessons]);

  function changeSection(nextSection: CourseSection, focus = true) {
    setSection(nextSection);
    history.replaceState(
      {},
      "",
      `${window.location.pathname}?section=${nextSection}`,
    );
    if (focus)
      requestAnimationFrame(() =>
        document.getElementById(`course-panel-${nextSection}`)?.focus(),
      );
  }

  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (
      !(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 2
          : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
    tabRefs.current[target]?.focus();
    changeSection(
      (["lessons", "lab", "quiz"] as CourseSection[])[target],
      false,
    );
  }

  async function lessonMutation(
    lessonId: string,
    action: "complete" | "review",
    rating?: "again" | "good",
  ) {
    if (!state.dashboard || preview) return;
    state.setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch(
        `/api/lessons/${module.id}/${lessonId}/review`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action,
            rating,
            clientMutationId: crypto.randomUUID(),
            expectedRevision: state.dashboard.revision.value,
          }),
        },
      );
      await mutationResponse(response);
      if (action === "complete")
        window.localStorage.removeItem(`lakehouse-private-draft:${lessonId}`);
      setMessage(
        action === "complete"
          ? "Lección completada y repaso programado."
          : "Repaso actualizado.",
      );
      state.setSaveState("saved");
      await state.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "No se pudo guardar.",
      );
      state.setSaveState(navigator.onLine ? "error" : "offline");
    }
  }

  async function attestLab() {
    if (
      !state.dashboard ||
      preview ||
      labChecks.length !== module.lab.checks.length
    )
      return;
    state.setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch(`/api/labs/${module.id}/attest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkIds: labChecks,
          attested: true,
          clientMutationId: crypto.randomUUID(),
          expectedRevision: state.dashboard.revision.value,
        }),
      });
      await mutationResponse(response);
      setMessage("Laboratorio autoatestiguado y guardado.");
      state.setSaveState("saved");
      await state.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "No se pudo guardar.",
      );
      state.setSaveState(navigator.onLine ? "error" : "offline");
    }
  }

  const unitPercent = Math.round(
    ((completedLessons.size +
      Number(progress?.labAttested) +
      Number(
        progress?.quizBestPercent !== null &&
          progress?.quizBestPercent !== undefined,
      )) /
      7) *
      100,
  );
  const allLessonsDone = completedLessons.size === module.lessons.length;

  if (state.loading)
    return (
      <div className="ent-state-card" role="status">
        <span className="ent-spinner" />
        <div>
          <strong>Cargando el módulo</strong>
          <p>Recuperando tu progreso.</p>
        </div>
      </div>
    );
  if (!state.dashboard)
    return (
      <div className="ent-state-card is-error" role="alert">
        <div>
          <strong>No se pudo abrir el curso</strong>
          <p>{state.error}</p>
        </div>
        <button className="ent-secondary-action" onClick={state.refresh}>
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="ent-course-workspace">
      <aside className="ent-course-index" aria-label="Índice del módulo">
        <div>
          <span>Módulo {module.number}</span>
          <strong>{unitPercent}%</strong>
        </div>
        <div
          className="ent-progress"
          role="progressbar"
          aria-label="Progreso del módulo"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={unitPercent}
        >
          <i style={{ width: `${unitPercent}%` }} />
        </div>
        <nav>
          {module.lessons.map((lesson, index) => (
            <a
              key={lesson.id}
              href={`#lesson-${lesson.id}`}
              onClick={() => setSection("lessons")}
            >
              <span>{completedLessons.has(lesson.id) ? "✓" : index + 1}</span>
              {lesson.title}
            </a>
          ))}
          <button type="button" onClick={() => changeSection("lab")}>
            <span>{progress?.labAttested ? "✓" : "L"}</span>Laboratorio
          </button>
          <button type="button" onClick={() => changeSection("quiz")}>
            <span>{progress?.quizBestPercent != null ? "✓" : "T"}</span>
            Evaluación
          </button>
        </nav>
        {previous ? (
          <a href={`/curso/${previous.slug}`}>← Módulo anterior</a>
        ) : null}
      </aside>

      <article className="ent-course-reader">
        {preview ? (
          <div className="ent-preview-notice" role="note">
            <b>Vista previa</b>
            <p>
              Puedes leer el módulo, pero las actividades no se registrarán
              hasta completar:{" "}
              {module.prerequisites.join(", ") ||
                "los prerrequisitos anteriores"}
              .
            </p>
          </div>
        ) : null}
        <header className="ent-course-header">
          <div>
            <p className="ent-kicker">
              {module.level} · {module.minutes} min
            </p>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </div>
          <SaveState value={state.saveState} onRetry={state.refresh} />
        </header>
        <div className="ent-course-outcomes">
          <span>Al terminar podrás</span>
          <ul>
            {module.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </div>
        <div
          className="ent-course-tabs"
          role="tablist"
          aria-label="Actividades del módulo"
        >
          {(["lessons", "lab", "quiz"] as CourseSection[]).map(
            (item, index) => (
              <button
                id={`course-tab-${item}`}
                key={item}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={section === item}
                aria-controls={`course-panel-${item}`}
                tabIndex={section === item ? 0 : -1}
                onKeyDown={(event) => tabKey(event, index)}
                onClick={() => changeSection(item)}
              >
                {item === "lessons"
                  ? "Lecciones"
                  : item === "lab"
                    ? "Laboratorio"
                    : "Evaluación"}
                <span>
                  {item === "lessons"
                    ? `${completedLessons.size}/5`
                    : item === "lab"
                      ? progress?.labAttested
                        ? "✓"
                        : "1"
                      : progress?.quizBestPercent == null
                        ? "4"
                        : `${progress.quizBestPercent}%`}
                </span>
              </button>
            ),
          )}
        </div>

        {section === "lessons" ? (
          <section
            id="course-panel-lessons"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-lessons"
            className="ent-lessons-panel"
          >
            {module.lessons.map((lesson, index) => (
              <details
                id={`lesson-${lesson.id}`}
                className={`ent-lesson ${completedLessons.has(lesson.id) ? "is-complete" : ""}`}
                key={lesson.id}
              >
                <summary>
                  <span>
                    {completedLessons.has(lesson.id)
                      ? "✓"
                      : String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <small>{lesson.kicker}</small>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.summary}</p>
                  </div>
                  <i aria-hidden="true">+</i>
                </summary>
                <div className="ent-lesson-body">
                  <p className="ent-lesson-lead">{lesson.detail}</p>
                  {lesson.explanation.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <section className="ent-mental-model">
                    <p className="ent-kicker">Modelo mental</p>
                    <h4>{lesson.deepDive.mentalModel}</h4>
                    <div>
                      {lesson.deepDive.concepts.map((concept) => (
                        <article id={conceptAnchor(lesson.id, concept.term)} key={concept.term} tabIndex={-1}>
                          <strong>{concept.term}</strong>
                          <p>{concept.definition}</p>
                          <small>{concept.whyItMatters}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="ent-code-example">
                    <div>
                      <span>{lesson.example.language}</span>
                      <strong>{lesson.example.title}</strong>
                    </div>
                    <pre tabIndex={0}>
                      <code>{lesson.example.code}</code>
                    </pre>
                    <p>{lesson.example.note}</p>
                  </section>
                  <div className="ent-learning-notes">
                    <section>
                      <h4>Puntos clave</h4>
                      <ul>
                        {lesson.keyPoints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h4>Evita</h4>
                      <ul>
                        {lesson.pitfalls.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                  <section className="ent-recall-card">
                    <div>
                      <p className="ent-kicker">Recuerdo activo</p>
                      <h4>{lesson.checkpoint.question}</h4>
                      <span>Borrador privado · solo en este navegador</span>
                    </div>
                    <label htmlFor={`recall-${lesson.id}`}>
                      Explícalo con tus palabras
                    </label>
                    <textarea
                      id={`recall-${lesson.id}`}
                      value={recall[lesson.id] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setRecall((current) => ({
                          ...current,
                          [lesson.id]: value,
                        }));
                        window.localStorage.setItem(
                          `lakehouse-private-draft:${lesson.id}`,
                          value,
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="ent-secondary-action"
                      onClick={() =>
                        setRevealed((current) => ({
                          ...current,
                          [lesson.id]: true,
                        }))
                      }
                    >
                      Comparar con la respuesta
                    </button>
                    {revealed[lesson.id] ? (
                      <div className="ent-recall-answer">
                        <span>Respuesta orientativa</span>
                        <p>{lesson.checkpoint.answer}</p>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              void lessonMutation(lesson.id, "review", "again")
                            }
                            disabled={preview}
                          >
                            Necesito repasarlo
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void lessonMutation(lesson.id, "review", "good")
                            }
                            disabled={preview}
                          >
                            Lo recordé bien
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                  <footer>
                    <span>
                      {completedLessons.has(lesson.id)
                        ? "Completada"
                        : "Pendiente"}
                    </span>
                    <button
                      type="button"
                      className="ent-primary-action"
                      disabled={preview || completedLessons.has(lesson.id)}
                      onClick={() => void lessonMutation(lesson.id, "complete")}
                    >
                      {completedLessons.has(lesson.id)
                        ? "Lección completada"
                        : "Marcar como completada"}
                    </button>
                  </footer>
                </div>
              </details>
            ))}
            <div className="ent-reader-continue">
              <span>
                {allLessonsDone
                  ? "Cinco lecciones completadas"
                  : `${module.lessons.length - completedLessons.size} lecciones pendientes`}
              </span>
              <button
                type="button"
                className="ent-primary-action"
                onClick={() => changeSection("lab")}
              >
                Continuar al laboratorio <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        ) : null}

        {section === "lab" ? (
          <section
            id="course-panel-lab"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-lab"
            className="ent-lab-panel"
          >
            <div className="ent-lab-brief">
              <p className="ent-kicker">Práctica guiada · autoatestiguada</p>
              <h2>{module.lab.title}</h2>
              <p>{module.lab.scenario}</p>
            </div>
            <div className="ent-lab-spec">
              <article>
                <span>Objetivo</span>
                <p>{module.lab.goal}</p>
              </article>
              <article>
                <span>Entorno</span>
                <p>{module.lab.environment}</p>
              </article>
              <article>
                <span>Resultado esperado</span>
                <p>{module.lab.expectedOutcome}</p>
              </article>
            </div>
            <ol className="ent-lab-steps">
              {module.lab.steps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <section className="ent-code-example">
              <div>
                <span>Starter code</span>
                <strong>{module.lab.dataset.name}</strong>
              </div>
              <pre tabIndex={0}>
                <code>{module.lab.starterCode}</code>
              </pre>
            </section>
            <details className="ent-solution">
              <summary>Ver solución orientativa</summary>
              <pre tabIndex={0}>
                <code>{module.lab.solution}</code>
              </pre>
            </details>
            <fieldset className="ent-attestation">
              <legend>Confirma la evidencia obtenida</legend>
              <p>
                La academia no ejecuta ni verifica tu workspace. Declara
                únicamente lo que hayas comprobado.
              </p>
              {module.lab.checks.map((check) => (
                <label key={check.id}>
                  <input
                    type="checkbox"
                    checked={labChecks.includes(check.id)}
                    disabled={preview || progress?.labAttested}
                    onChange={(event) =>
                      setLabChecks((current) =>
                        event.target.checked
                          ? [...current, check.id]
                          : current.filter((id) => id !== check.id),
                      )
                    }
                  />
                  {check.label}
                </label>
              ))}
              <button
                type="button"
                className="ent-primary-action"
                disabled={
                  preview ||
                  progress?.labAttested ||
                  labChecks.length !== module.lab.checks.length
                }
                onClick={() => void attestLab()}
              >
                {progress?.labAttested
                  ? "Laboratorio autoatestiguado"
                  : "Confirmar laboratorio"}
              </button>
            </fieldset>
            <div className="ent-reader-continue">
              <span>
                {progress?.labAttested
                  ? "Práctica completada"
                  : "La declaración no sustituye una ejecución verificada"}
              </span>
              <button
                type="button"
                className="ent-primary-action"
                onClick={() => changeSection("quiz")}
              >
                Continuar a la evaluación <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        ) : null}

        {section === "quiz" ? (
          <section
            id="course-panel-quiz"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-quiz"
            className="ent-quiz-panel"
          >
            <AssessmentPanel
              kind="module-quiz"
              moduleId={module.id}
              title={`Evaluación · ${module.short}`}
              bestScore={progress?.quizBestPercent ?? null}
              revision={state.dashboard.revision.value}
              disabled={preview || !allLessonsDone || !progress?.labAttested}
              onState={state.setSaveState}
              onCompleted={state.refresh}
            />
          </section>
        ) : null}
        <p className="ent-course-status" role="status" aria-live="polite">
          {message}
        </p>
        <footer className="ent-course-footer">
          {previous ? (
            <a href={`/curso/${previous.slug}`}>← {previous.short}</a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={`/curso/${next.slug}`}>{next.short} →</a>
          ) : (
            <a href="/expediente">Abrir expediente →</a>
          )}
        </footer>
      </article>
    </div>
  );
}

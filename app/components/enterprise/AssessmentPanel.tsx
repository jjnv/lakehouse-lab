"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AssessmentKind,
  AssessmentTimingMode,
} from "../../enterprise/assessment";
import type { AssessmentAttemptPublic } from "../../enterprise/contracts";

type AssessmentResultView = {
  scorePercent: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  completed: boolean;
  corrections: Array<{
    questionId: string;
    selectedOptionId: string | null;
    correctOptionId: string;
    correct: boolean;
    explanation: string;
    domain: string;
  }>;
  domainBreakdown: Array<{
    domain: string;
    totalQuestions: number;
    correctAnswers: number;
    scorePercent: number;
  }>;
};

type Props = {
  kind: AssessmentKind;
  moduleId?: string;
  revision: number;
  title: string;
  bestScore: number | null;
  disabled?: boolean;
  onState: (state: "saved" | "saving" | "offline" | "error") => void;
  onCompleted: () => Promise<void> | void;
};

async function responseBody<T>(
  response: Response,
): Promise<{ data: T; revision?: number }> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body as { message?: string };
    throw new Error(error.message || "No se pudo completar la evaluación.");
  }
  const value =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const revisionRecord =
    value.revision && typeof value.revision === "object"
      ? (value.revision as Record<string, unknown>)
      : null;
  return {
    data: (value.data ?? value) as T,
    ...(typeof revisionRecord?.value === "number"
      ? { revision: revisionRecord.value }
      : {}),
  };
}

export default function AssessmentPanel({
  kind,
  moduleId,
  revision,
  title,
  bestScore,
  disabled = false,
  onState,
  onCompleted,
}: Props) {
  const [timingMode, setTimingMode] = useState<AssessmentTimingMode>("untimed");
  const [attempt, setAttempt] = useState<AssessmentAttemptPublic | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [warning, setWarning] = useState("");
  const [currentRevision, setCurrentRevision] = useState(revision);
  const submittingRef = useRef(false);
  const pageSize = kind === "module-quiz" ? 4 : 10;

  useEffect(
    () => setCurrentRevision((value) => Math.max(value, revision)),
    [revision],
  );

  const start = useCallback(async () => {
    setError(null);
    onState("saving");
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          moduleId,
          timingMode,
          clientMutationId: crypto.randomUUID(),
          expectedRevision: currentRevision,
        }),
      });
      const envelope = await responseBody<
        { attempt: AssessmentAttemptPublic } | AssessmentAttemptPublic
      >(response);
      const payload = envelope.data;
      const next = "attempt" in payload ? payload.attempt : payload;
      if (envelope.revision !== undefined)
        setCurrentRevision(envelope.revision);
      setAttempt(next);
      setSelections(next.selections ?? {});
      setResult(null);
      setPage(0);
      setSecondsLeft(
        next.expiresAt
          ? Math.max(
              0,
              Math.floor((Date.parse(next.expiresAt) - Date.now()) / 1000),
            )
          : null,
      );
      onState("saved");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo iniciar.",
      );
      onState(navigator.onLine ? "error" : "offline");
    }
  }, [currentRevision, kind, moduleId, onState, timingMode]);

  const submit = useCallback(async () => {
    if (!attempt || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    onState("saving");
    try {
      const response = await fetch(`/api/assessments/${attempt.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMutationId: crypto.randomUUID(),
          expectedRevision: currentRevision,
        }),
      });
      const envelope = await responseBody<
        { result: AssessmentResultView } | AssessmentResultView
      >(response);
      const payload = envelope.data;
      if (envelope.revision !== undefined)
        setCurrentRevision(envelope.revision);
      setResult("result" in payload ? payload.result : payload);
      onState("saved");
      await onCompleted();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo corregir.",
      );
      onState(navigator.onLine ? "error" : "offline");
    } finally {
      submittingRef.current = false;
    }
  }, [attempt, currentRevision, onCompleted, onState]);

  useEffect(() => {
    if (secondsLeft === null || result || !attempt) return;
    if (secondsLeft <= 0) {
      setWarning(
        "El tiempo ha terminado. El intento se enviará para corrección.",
      );
      void submit();
      return;
    }
    const timer = window.setTimeout(
      () =>
        setSecondsLeft((current) =>
          current === null ? null : Math.max(0, current - 1),
        ),
      1000,
    );
    if (secondsLeft === 300) setWarning("Quedan cinco minutos.");
    if (secondsLeft === 60) setWarning("Queda un minuto.");
    return () => window.clearTimeout(timer);
  }, [attempt, result, secondsLeft, submit]);

  async function select(questionId: string, optionId: string) {
    if (!attempt || result) return;
    const previous = selections;
    const next = { ...previous, [questionId]: optionId };
    setSelections(next);
    onState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/assessments/${attempt.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selections: next,
          clientMutationId: crypto.randomUUID(),
          expectedRevision: currentRevision,
        }),
      });
      const envelope = await responseBody(response);
      if (envelope.revision !== undefined)
        setCurrentRevision(envelope.revision);
      onState("saved");
    } catch (caught) {
      setSelections(previous);
      setError(
        caught instanceof Error ? caught.message : "No se guardó la respuesta.",
      );
      onState(navigator.onLine ? "error" : "offline");
    }
  }

  const questions = attempt?.assessment.questions ?? [];
  const pages = Math.max(1, Math.ceil(questions.length / pageSize));
  const visible = questions.slice(page * pageSize, (page + 1) * pageSize);
  const correctionMap = useMemo(
    () =>
      new Map(result?.corrections.map((item) => [item.questionId, item]) ?? []),
    [result],
  );
  const complete =
    questions.length > 0 &&
    questions.every((question) => selections[question.id]);
  const timerText =
    secondsLeft === null
      ? "Sin límite"
      : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  if (!attempt)
    return (
      <section
        className="ent-assessment-start"
        aria-labelledby="assessment-start-heading"
      >
        <div>
          <p className="ent-kicker">Evaluación protegida</p>
          <h2 id="assessment-start-heading">{title}</h2>
          <p>
            Las preguntas se corrigen en el servidor. La mejor nota aprobada
            nunca disminuye y puedes repetir sin límite.
          </p>
          {bestScore !== null ? (
            <span>
              Mejor resultado: <b>{bestScore}%</b>
            </span>
          ) : null}
        </div>
        <div>
          <label htmlFor={`timing-${kind}-${moduleId ?? "global"}`}>
            Tiempo del intento
          </label>
          <select
            id={`timing-${kind}-${moduleId ?? "global"}`}
            value={timingMode}
            onChange={(event) =>
              setTimingMode(event.target.value as AssessmentTimingMode)
            }
            disabled={disabled}
          >
            <option value="untimed">Sin límite</option>
            <option value="1x">Tiempo estándar</option>
            <option value="1.5x">Tiempo × 1,5</option>
            <option value="2x">Tiempo × 2</option>
          </select>
          <button
            type="button"
            className="ent-primary-action"
            disabled={disabled}
            onClick={() => void start()}
          >
            {disabled
              ? "Disponible al cumplir prerrequisitos"
              : "Iniciar intento"}
          </button>
        </div>
        {error ? (
          <p className="ent-inline-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );

  return (
    <section className="ent-assessment" aria-labelledby="assessment-heading">
      <header>
        <div>
          <p className="ent-kicker">Intento en curso</p>
          <h2 id="assessment-heading" tabIndex={-1}>
            {attempt.assessment.title}
          </h2>
          <p>{attempt.assessment.instructions}</p>
        </div>
        <div className="ent-assessment-timer">
          <span>Tiempo</span>
          <strong aria-label={`Tiempo restante ${timerText}`}>
            {timerText}
          </strong>
          <small>
            {Object.keys(selections).length}/{questions.length} respondidas
          </small>
        </div>
      </header>
      <div
        className="ent-assessment-progress"
        role="progressbar"
        aria-label="Preguntas respondidas"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={Object.keys(selections).length}
      >
        <i
          style={{
            width: `${questions.length ? (Object.keys(selections).length / questions.length) * 100 : 0}%`,
          }}
        />
      </div>
      <p className="sr-only" aria-live="assertive">
        {warning}
      </p>
      <div className="ent-question-list">
        {visible.map((question, index) => {
          const correction = correctionMap.get(question.id);
          return (
            <fieldset key={question.id}>
              <legend>
                <span>
                  {String(page * pageSize + index + 1).padStart(2, "0")}
                </span>
                {question.prompt}
              </legend>
              {question.domain ? <small>{question.domain}</small> : null}
              <div>
                {question.options.map((option) => {
                  const selected = selections[question.id] === option.id;
                  const className = result
                    ? option.id === correction?.correctOptionId
                      ? "is-correct"
                      : selected
                        ? "is-incorrect"
                        : ""
                    : selected
                      ? "is-selected"
                      : "";
                  return (
                    <label key={option.id} className={className}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={selected}
                        disabled={Boolean(result)}
                        onChange={() => void select(question.id, option.id)}
                      />
                      <span aria-hidden="true">
                        {String.fromCharCode(
                          65 + question.options.indexOf(option),
                        )}
                      </span>
                      {option.text}
                    </label>
                  );
                })}
              </div>
              {correction ? (
                <div
                  className={`ent-correction ${correction.correct ? "is-correct" : "is-review"}`}
                >
                  <b>
                    {correction.correct ? "Correcta" : "Revisa esta decisión"}
                  </b>
                  <p>{correction.explanation}</p>
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>
      <nav
        className="ent-assessment-pagination"
        aria-label="Páginas de preguntas"
      >
        <button
          type="button"
          className="ent-secondary-action"
          disabled={page === 0}
          onClick={() => {
            setPage((value) => Math.max(0, value - 1));
            document.getElementById("assessment-heading")?.focus();
          }}
        >
          Anterior
        </button>
        <span>
          Página {page + 1} de {pages}
        </span>
        {page < pages - 1 ? (
          <button
            type="button"
            className="ent-primary-action"
            onClick={() => {
              setPage((value) => Math.min(pages - 1, value + 1));
              document.getElementById("assessment-heading")?.focus();
            }}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            className="ent-primary-action"
            disabled={!complete || Boolean(result)}
            onClick={() => void submit()}
          >
            Entregar y corregir
          </button>
        )}
      </nav>
      {error ? (
        <p className="ent-inline-error" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <section
          className={`ent-assessment-result ${result.passed ? "is-pass" : "is-review"}`}
          aria-live="polite"
        >
          <div>
            <span>Resultado</span>
            <strong>{result.scorePercent}%</strong>
          </div>
          <div>
            <h2>
              {result.passed
                ? "Objetivo alcanzado"
                : "Conviene reforzar algunos dominios"}
            </h2>
            <p>
              {result.correctAnswers} de {result.totalQuestions} respuestas
              correctas.{" "}
              {result.passed
                ? "El intento queda registrado."
                : "Tu mejor nota anterior se conserva si era superior."}
            </p>
            <button
              type="button"
              className="ent-secondary-action"
              onClick={() => {
                setAttempt(null);
                setSelections({});
                setResult(null);
                setWarning("");
              }}
            >
              Nuevo intento
            </button>
          </div>
          {result.domainBreakdown?.length ? (
            <div className="ent-domain-breakdown">
              <h3>Desglose por dominio</h3>
              {result.domainBreakdown.map((domain) => (
                <p key={domain.domain}>
                  <span>{domain.domain}</span>
                  <b>{domain.scorePercent}%</b>
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

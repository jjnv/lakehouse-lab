"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiErrorBody, LearnerDashboard } from "../../enterprise/contracts";

const LEGACY_PROGRESS_KEY = "lakehouse-lab-progress-v2";
const MIGRATION_MARKER_KEY = "lakehouse-lab-enterprise-imported";

export type LegacyCandidate = {
  completedLessons: Record<string, string[]>;
  labsPassed: string[];
  quizScores: Record<string, number>;
  completedModules: string[];
  examScores: Partial<Record<"associate" | "professional", number>>;
  examCompleted: Partial<Record<"associate" | "professional", boolean>>;
  lessonReviews: Record<string, { dueOn: string; intervalDays: number; attempts: number; lastRating: "again" | "good"; lastReviewedOn: string }>;
  gamification: { xp: number; streak: number; badges: string[] };
  summary: { lessons: number; labs: number; quizzes: number; modules: number };
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && (!allowed || allowed.has(item))))];
}

function integer(value: unknown, minimum = 0, maximum = 100_000): number {
  const candidate = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : minimum;
  return Math.min(maximum, Math.max(minimum, candidate));
}

function readLegacyCandidate(dashboard: LearnerDashboard): LegacyCandidate | null {
  if (!dashboard.legacyImport.eligible || typeof window === "undefined") return null;
  if (window.localStorage.getItem(MIGRATION_MARKER_KEY)) return null;
  const raw = window.localStorage.getItem(LEGACY_PROGRESS_KEY);
  if (!raw) return null;

  let parsed: Record<string, unknown>;
  try { parsed = objectValue(JSON.parse(raw)); } catch { return null; }
  const allowedModules = new Set(dashboard.modules.map((module) => module.id));
  const completedLessonsRaw = objectValue(parsed.completedLessons);
  const completedLessons: Record<string, string[]> = {};
  for (const [moduleId, lessonIds] of Object.entries(completedLessonsRaw)) {
    if (!allowedModules.has(moduleId)) continue;
    const allowedLessonPrefix = `${moduleId}-l`;
    completedLessons[moduleId] = stringArray(lessonIds).filter((id) => id.startsWith(allowedLessonPrefix));
  }
  const scoresRaw = objectValue(parsed.quizScores);
  const quizScores = Object.fromEntries(Object.entries(scoresRaw)
    .filter(([moduleId, score]) => allowedModules.has(moduleId) && typeof score === "number")
    .map(([moduleId, score]) => [moduleId, integer(score, 0, 4)]));
  const reviewsRaw = objectValue(parsed.lessonReviews);
  const lessonReviews: LegacyCandidate["lessonReviews"] = {};
  for (const [lessonKey, rawReview] of Object.entries(reviewsRaw)) {
    const review = objectValue(rawReview);
    const dueOn = typeof review.dueOn === "string" ? review.dueOn : "";
    const lastReviewedOn = typeof review.lastReviewedOn === "string" ? review.lastReviewedOn : "";
    const lastRating = review.lastRating === "again" ? "again" : "good";
    const [moduleId, lessonId] = lessonKey.includes(":") ? lessonKey.split(":", 2) : [lessonKey.slice(0, 3), lessonKey];
    if (allowedModules.has(moduleId) && lessonId.startsWith(`${moduleId}-l`) && /^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
      lessonReviews[`${moduleId}:${lessonId}`] = { dueOn, lastReviewedOn, lastRating, intervalDays: integer(review.intervalDays, 0, 3650), attempts: integer(review.attempts, 0, 10_000) };
    }
  }
  const examScoresRaw = objectValue(parsed.examScores);
  const examCompletedRaw = objectValue(parsed.examCompleted);
  const gamificationRaw = objectValue(parsed.gamification);
  const completedModules = stringArray(parsed.completedModules, allowedModules);
  const labsPassed = stringArray(parsed.labsPassed, allowedModules);
  const candidate: LegacyCandidate = {
    completedLessons,
    labsPassed,
    quizScores,
    completedModules,
    examScores: {
      ...(typeof examScoresRaw.associate === "number" ? { associate: integer(examScoresRaw.associate, 0, 100) } : {}),
      ...(typeof examScoresRaw.professional === "number" ? { professional: integer(examScoresRaw.professional, 0, 100) } : {}),
    },
    examCompleted: {
      ...(typeof examCompletedRaw.associate === "boolean" ? { associate: examCompletedRaw.associate } : {}),
      ...(typeof examCompletedRaw.professional === "boolean" ? { professional: examCompletedRaw.professional } : {}),
    },
    lessonReviews,
    gamification: {
      xp: integer(gamificationRaw.xp, 0, 100_000),
      streak: integer(gamificationRaw.streak, 0, 10_000),
      badges: stringArray(gamificationRaw.badges).slice(0, 100),
    },
    summary: {
      lessons: Object.values(completedLessons).reduce((total, ids) => total + ids.length, 0),
      labs: labsPassed.length,
      quizzes: Object.keys(quizScores).length,
      modules: completedModules.length,
    },
  };
  const activity = candidate.summary.lessons + candidate.summary.labs + candidate.summary.quizzes + candidate.summary.modules;
  return activity ? candidate : null;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as T | ApiErrorBody | null;
  if (!response.ok) {
    const error = body as ApiErrorBody | null;
    throw new Error(error?.message || "No se pudo completar la operación.");
  }
  return body as T;
}

export function useDashboard(enabled = true) {
  const [dashboard, setDashboard] = useState<LearnerDashboard | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline" | "error">("saved");
  const [legacyDismissed, setLegacyDismissed] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/me/dashboard", { cache: "no-store", headers: { accept: "application/json" } });
      setDashboard(await readJson<LearnerDashboard>(response));
      setSaveState("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar tu aprendizaje.");
      setSaveState(navigator.onLine ? "error" : "offline");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const frame = requestAnimationFrame(() => void refresh());
    return () => cancelAnimationFrame(frame);
  }, [enabled, refresh]);
  useEffect(() => {
    if (!enabled) return;
    const online = () => { setSaveState("saved"); void refresh(); };
    const offline = () => setSaveState("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [enabled, refresh]);

  const legacyCandidate = useMemo(
    () => dashboard && !legacyDismissed ? readLegacyCandidate(dashboard) : null,
    [dashboard, legacyDismissed],
  );

  const importLegacy = useCallback(async (candidate: LegacyCandidate) => {
    if (!dashboard) return;
    setSaveState("saving");
    try {
      const response = await fetch("/api/progress/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMutationId: crypto.randomUUID(),
          expectedRevision: dashboard.revision.value,
          legacy: candidate,
        }),
      });
      await readJson(response);
      window.localStorage.removeItem(LEGACY_PROGRESS_KEY);
      window.localStorage.setItem(MIGRATION_MARKER_KEY, new Date().toISOString());
      setSaveState("saved");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo importar el progreso.");
      setSaveState("error");
    }
  }, [dashboard, refresh]);

  const dismissLegacy = useCallback(() => {
    setLegacyDismissed(true);
  }, []);

  return { dashboard, loading, error, saveState, refresh, legacyCandidate, importLegacy, dismissLegacy, setSaveState, setError };
}

export { default as SaveState } from "./SaveState";

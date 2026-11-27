"use client";

import type { LearningMode, SimulationAction } from "../../playground/domain/types";

/**
 * Persistencia local (solo en este navegador) del intento en curso y de un
 * historial breve. Es una comodidad: si el almacenamiento falla, el Playground
 * funciona igual. Nunca contiene datos personales.
 */
export type LocalAttempt = { scenarioId: string; version: string; seed: number; mode: LearningMode; inputs: SimulationAction[]; idempotencyKey: string; savedAttemptId?: string };
export type LocalHistoryEntry = { scenarioId: string; score: number; status: string; mode: LearningMode; at: string };

const PREFIX = "lakehouse-playground:v1";

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // Almacenamiento no disponible (modo privado, bloqueado): se ignora.
  }
}

export function loadAttempt(scenarioId: string) {
  return read<LocalAttempt>(`attempt:${scenarioId}`);
}

export function saveAttempt(attempt: LocalAttempt) {
  write(`attempt:${attempt.scenarioId}`, attempt);
  write("last", { scenarioId: attempt.scenarioId, at: new Date().toISOString() });
}

export function loadLast() {
  return read<{ scenarioId: string; at: string }>("last");
}

export function loadHistory() {
  return read<LocalHistoryEntry[]>("history") ?? [];
}

export function pushHistory(entry: LocalHistoryEntry) {
  write("history", [entry, ...loadHistory()].slice(0, 20));
}

export function randomSeed() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  } catch {
    return Math.floor(Math.random() * 0xffffffff);
  }
}

export function randomKey() {
  try {
    return [...crypto.getRandomValues(new Uint8Array(18))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.padEnd(24, "0");
  }
}

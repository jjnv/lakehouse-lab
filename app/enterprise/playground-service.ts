import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { playgroundAttempts } from "../../db/schema";
import { AttemptPayloadError, parseAttemptPayload } from "../playground/domain/attempt-contract";
import type { EvaluationResult, SimulationStatus } from "../playground/domain/types";
import { SimulationInputError, isTerminal, replay } from "../playground/engines/incident-engine";
import { evaluateAttempt } from "../playground/evaluation/evaluate";
import { scenarioById } from "../playground/scenarios";
import { LearningApiError } from "./learning-service";
import type { LearnerContext } from "./types";

/** Límite de intentos guardados por persona: evita persistencia ilimitada. */
export const MAX_STORED_PLAYGROUND_ATTEMPTS = 500;

export type PlaygroundAttemptSummary = {
  id: string;
  scenarioId: string;
  scenarioVersion: string;
  mode: string;
  status: SimulationStatus;
  score: number;
  durationMinutes: number;
  cost: number;
  createdAt: string;
};

export type PlaygroundSkillSummary = {
  skillId: string;
  attempts: number;
  solved: number;
  /** Media orientativa de la fuerza de las evidencias (0..1). */
  averageStrength: number;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function summary(row: typeof playgroundAttempts.$inferSelect): PlaygroundAttemptSummary {
  return {
    id: row.id,
    scenarioId: row.scenarioId,
    scenarioVersion: row.scenarioVersion,
    mode: row.mode,
    status: row.status,
    score: row.score,
    durationMinutes: row.durationMinutes,
    cost: row.costUnits / 100,
    createdAt: row.createdAt,
  };
}

/**
 * Guarda un intento terminado. El navegador envía solo semilla, modo y
 * entradas; el servidor reproduce la simulación y calcula la evaluación.
 * Idempotente por (usuario, clave): misma clave y mismo payload devuelve el
 * intento existente; misma clave con otro payload es un conflicto.
 */
export async function saveScenarioAttempt(learner: LearnerContext, body: unknown) {
  let payload;
  try {
    payload = parseAttemptPayload(body);
  } catch (error) {
    if (error instanceof AttemptPayloadError) throw new LearningApiError(422, error.code, "El intento no tiene un formato válido.");
    throw error;
  }
  const scenario = scenarioById(payload.scenarioId);
  if (!scenario) throw new LearningApiError(404, "SCENARIO_NOT_FOUND", "El escenario no existe.");
  if (scenario.definition.version.version !== payload.scenarioVersion) {
    throw new LearningApiError(409, "SCENARIO_VERSION_MISMATCH", "El escenario se ha actualizado. Reinícialo para guardar un intento con la versión actual.");
  }

  let state;
  try {
    state = replay(scenario.definition, { seed: payload.seed, mode: payload.mode }, payload.inputs);
  } catch (error) {
    if (error instanceof SimulationInputError) throw new LearningApiError(422, `SIMULATION_${error.code}`, "La secuencia de acciones no es válida para este escenario.");
    throw error;
  }
  if (!isTerminal(state)) throw new LearningApiError(422, "ATTEMPT_NOT_FINISHED", "Solo se guardan intentos terminados.");
  const evaluation = evaluateAttempt(scenario.definition, state);

  const payloadHash = await sha256(stableJson({ ...payload, idempotencyKey: undefined }));
  const db = getDb();
  const [existing] = await db.select().from(playgroundAttempts).where(and(
    eq(playgroundAttempts.userId, learner.user.id),
    eq(playgroundAttempts.idempotencyKey, payload.idempotencyKey),
  )).limit(1);
  if (existing) {
    if (existing.payloadHash !== payloadHash) throw new LearningApiError(409, "IDEMPOTENCY_CONFLICT", "La clave de idempotencia ya se usó con otro intento.");
    return { attempt: summary(existing), evaluation: JSON.parse(existing.evaluationJson) as EvaluationResult, replayed: true };
  }

  const [{ value: stored }] = await db.select({ value: count() }).from(playgroundAttempts).where(eq(playgroundAttempts.userId, learner.user.id));
  if (stored >= MAX_STORED_PLAYGROUND_ATTEMPTS) throw new LearningApiError(429, "ATTEMPT_LIMIT_REACHED", "Has alcanzado el máximo de intentos guardados. Elimina tu progreso o sigue practicando sin guardar.");

  const id = `pga_${(await sha256(`${learner.user.id}:${payload.idempotencyKey}`)).slice(0, 32)}`;
  const status = state.status === "running" ? "failed" : state.status;
  await db.insert(playgroundAttempts).values({
    id,
    organizationId: learner.organization.id,
    userId: learner.user.id,
    scenarioId: payload.scenarioId,
    scenarioVersion: payload.scenarioVersion,
    mode: payload.mode,
    seed: payload.seed,
    status,
    score: evaluation.score,
    durationMinutes: Math.round(evaluation.durationMinutes),
    costUnits: Math.round(evaluation.cost * 100),
    inputsJson: JSON.stringify(payload.inputs),
    evaluationJson: JSON.stringify(evaluation),
    idempotencyKey: payload.idempotencyKey,
    payloadHash,
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing();
  const [row] = await db.select().from(playgroundAttempts).where(and(
    eq(playgroundAttempts.userId, learner.user.id),
    eq(playgroundAttempts.idempotencyKey, payload.idempotencyKey),
  )).limit(1);
  if (!row) throw new Error("No se pudo recuperar el intento guardado.");
  if (row.payloadHash !== payloadHash) throw new LearningApiError(409, "IDEMPOTENCY_CONFLICT", "La clave de idempotencia ya se usó con otro intento.");
  return { attempt: summary(row), evaluation, replayed: row.id !== id };
}

/** Resumen privado del Playground: intentos recientes y competencias con su evidencia. */
export async function getPlaygroundOverview(learner: LearnerContext) {
  const db = getDb();
  const rows = await db.select().from(playgroundAttempts)
    .where(eq(playgroundAttempts.userId, learner.user.id))
    .orderBy(desc(playgroundAttempts.createdAt))
    .limit(MAX_STORED_PLAYGROUND_ATTEMPTS);
  const skills = new Map<string, PlaygroundSkillSummary & { strengthSum: number }>();
  for (const row of rows) {
    const evaluation = JSON.parse(row.evaluationJson) as EvaluationResult;
    for (const evidence of evaluation.skills) {
      const current = skills.get(evidence.skillId) ?? { skillId: evidence.skillId, attempts: 0, solved: 0, averageStrength: 0, strengthSum: 0 };
      current.attempts += 1;
      current.solved += evidence.level === "problem-solved" ? 1 : 0;
      current.strengthSum += evidence.strength;
      current.averageStrength = Math.round((current.strengthSum / current.attempts) * 100) / 100;
      skills.set(evidence.skillId, current);
    }
  }
  return {
    attempts: rows.slice(0, 20).map(summary),
    totalAttempts: rows.length,
    skills: [...skills.values()].map((skill) => ({ skillId: skill.skillId, attempts: skill.attempts, solved: skill.solved, averageStrength: skill.averageStrength })).sort((a, b) => b.averageStrength - a.averageStrength),
  };
}

export async function exportPlaygroundData(userId: string) {
  const db = getDb();
  const rows = await db.select().from(playgroundAttempts).where(eq(playgroundAttempts.userId, userId)).orderBy(playgroundAttempts.createdAt);
  return rows.map((row) => ({
    ...summary(row),
    seed: row.seed,
    inputs: JSON.parse(row.inputsJson) as unknown,
    evaluation: JSON.parse(row.evaluationJson) as unknown,
  }));
}

export async function deletePlaygroundData(userId: string) {
  await getDb().delete(playgroundAttempts).where(eq(playgroundAttempts.userId, userId));
}

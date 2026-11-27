/**
 * Contrato del intento que el navegador envía al servidor. El navegador solo
 * envía entradas; la puntuación se recalcula en el servidor reproduciendo el
 * motor determinista con la misma semilla.
 */
import { MAX_DIAGNOSIS_HYPOTHESES, MAX_SIMULATION_INPUTS } from "../engines/incident-engine";
import { isValidSeed } from "./random";
import type { LearningMode, SimulationAction } from "./types";
import { LEARNING_MODES } from "./types";

export type AttemptPayload = {
  scenarioId: string;
  scenarioVersion: string;
  mode: LearningMode;
  seed: number;
  inputs: SimulationAction[];
  idempotencyKey: string;
};

export class AttemptPayloadError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AttemptPayloadError";
  }
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/u;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;
const KEY_PATTERN = /^[A-Za-z0-9_-]{16,160}$/u;

function parseInput(value: unknown): SimulationAction {
  if (!value || typeof value !== "object") throw new AttemptPayloadError("INVALID_INPUT");
  const input = value as Record<string, unknown>;
  if (input.type === "close" && Object.keys(input).length === 1) return { type: "close" };
  if (input.type === "action" && typeof input.actionId === "string" && ID_PATTERN.test(input.actionId) && Object.keys(input).length === 2) {
    return { type: "action", actionId: input.actionId };
  }
  if (input.type === "diagnose" && Array.isArray(input.hypotheses) && Object.keys(input).length === 2
    && input.hypotheses.length >= 1 && input.hypotheses.length <= MAX_DIAGNOSIS_HYPOTHESES
    && input.hypotheses.every((item) => typeof item === "string" && ID_PATTERN.test(item))) {
    return { type: "diagnose", hypotheses: [...input.hypotheses] as string[] };
  }
  throw new AttemptPayloadError("INVALID_INPUT");
}

/** Valida estrictamente la forma del payload. No confía en campos extra (p. ej. puntuación o userId). */
export function parseAttemptPayload(value: unknown): AttemptPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AttemptPayloadError("INVALID_PAYLOAD");
  const body = value as Record<string, unknown>;
  const allowed = new Set(["scenarioId", "scenarioVersion", "mode", "seed", "inputs", "idempotencyKey"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw new AttemptPayloadError("UNEXPECTED_FIELD");
  if (typeof body.scenarioId !== "string" || !ID_PATTERN.test(body.scenarioId)) throw new AttemptPayloadError("INVALID_SCENARIO");
  if (typeof body.scenarioVersion !== "string" || !VERSION_PATTERN.test(body.scenarioVersion)) throw new AttemptPayloadError("INVALID_VERSION");
  if (typeof body.mode !== "string" || !(LEARNING_MODES as readonly string[]).includes(body.mode)) throw new AttemptPayloadError("INVALID_MODE");
  if (!isValidSeed(body.seed)) throw new AttemptPayloadError("INVALID_SEED");
  if (typeof body.idempotencyKey !== "string" || !KEY_PATTERN.test(body.idempotencyKey)) throw new AttemptPayloadError("INVALID_IDEMPOTENCY_KEY");
  if (!Array.isArray(body.inputs) || body.inputs.length === 0 || body.inputs.length > MAX_SIMULATION_INPUTS) throw new AttemptPayloadError("INVALID_INPUTS");
  const inputs = body.inputs.map(parseInput);
  if (inputs[inputs.length - 1].type !== "close" && inputs.filter((input) => input.type === "close").length > 0) throw new AttemptPayloadError("INVALID_INPUTS");
  return { scenarioId: body.scenarioId, scenarioVersion: body.scenarioVersion, mode: body.mode as LearningMode, seed: body.seed as number, inputs, idempotencyKey: body.idempotencyKey };
}

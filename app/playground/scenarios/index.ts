import type { LocalizedScenario } from "../domain/types";
import { dataSkewJoin } from "./data-skew";
import { mergeNotIdempotent } from "./merge-not-idempotent";
import { orchestrationRetryEffects } from "./orchestration-retry";
import { streamingStateGrowth } from "./streaming-state-growth";
import { ucPermissionsRunAs } from "./uc-permissions";

/** Versión del catálogo de escenarios. Cambia cuando se añaden o modifican escenarios. */
export const PLAYGROUND_CATALOG_VERSION = "playground-2026.11.0";

/** Orden progresivo recomendado. */
export const PLAYGROUND_SCENARIOS: readonly LocalizedScenario[] = [
  ucPermissionsRunAs,
  mergeNotIdempotent,
  dataSkewJoin,
  orchestrationRetryEffects,
  streamingStateGrowth,
];

export function scenarioById(id: string): LocalizedScenario | undefined {
  return PLAYGROUND_SCENARIOS.find((scenario) => scenario.definition.id === id);
}

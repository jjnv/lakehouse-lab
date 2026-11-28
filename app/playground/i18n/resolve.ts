import type { LocalizedScenario, PlaygroundLocale } from "../domain/types";
import { PLAYGROUND_UI } from "./ui";

/** Resuelve la clave de texto de un evento del motor. Devuelve null si falta (lo detectan las pruebas). */
export function eventText(scenario: LocalizedScenario, locale: PlaygroundLocale, textKey: string): string | null {
  const copy = scenario.copy[locale];
  const shared = PLAYGROUND_UI[locale].sharedEvents;
  if (textKey.startsWith("system.")) return shared[textKey] ?? null;
  if (textKey.startsWith("action.")) return copy.actions[textKey.slice(7)]?.label ?? null;
  if (textKey.startsWith("constraint.")) return copy.constraints[textKey.slice(11)] ?? null;
  if (textKey.startsWith("event.")) {
    const id = textKey.slice(6);
    return copy.events[id] ?? shared[id] ?? null;
  }
  return null;
}

export function noteText(scenario: LocalizedScenario, locale: PlaygroundLocale, note: string): string | null {
  return scenario.copy[locale].notes[note] ?? PLAYGROUND_UI[locale].sharedNotes[note] ?? null;
}

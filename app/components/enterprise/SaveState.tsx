"use client";

import type { Locale } from "../../i18n/config";

export type SaveStateValue = "idle" | "saving" | "saved" | "offline" | "error";

const copy: Record<Locale, Record<Exclude<SaveStateValue, "idle"> | "retry", string>> = {
  es: {
    saving: "Guardando…",
    saved: "Guardado",
    offline: "Sin conexión",
    error: "No se pudo guardar",
    retry: "Reintentar",
  },
  en: {
    saving: "Saving…",
    saved: "Saved",
    offline: "Offline",
    error: "Could not save",
    retry: "Retry",
  },
};

export default function SaveState({ value, onRetry, locale = "es" }: { value: SaveStateValue; onRetry?: () => void; locale?: Locale }) {
  if (value === "idle") return null;
  const text = copy[locale];
  return <span className={`ent-save-state is-${value}`} role={value === "error" ? "alert" : "status"} aria-live={value === "error" ? "assertive" : "polite"}><i aria-hidden="true" />{text[value]}{value === "error" && onRetry ? <button type="button" onClick={onRetry}>{text.retry}</button> : null}</span>;
}

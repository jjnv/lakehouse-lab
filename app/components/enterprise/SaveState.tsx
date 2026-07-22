"use client";

export default function SaveState({ value, onRetry }: { value: "saved" | "saving" | "offline" | "error"; onRetry?: () => void }) {
  const text = value === "saved" ? "Guardado" : value === "saving" ? "Guardando…" : value === "offline" ? "Sin conexión" : "No se pudo guardar";
  return <span className={`ent-save-state is-${value}`} role="status" aria-live="polite"><i aria-hidden="true" />{text}{value === "error" && onRetry ? <button type="button" onClick={onRetry}>Reintentar</button> : null}</span>;
}

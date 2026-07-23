"use client";

import { useState, type FormEvent } from "react";

export default function RecoveryWorkspace() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recoveryCode: code }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "No se pudo recuperar el espacio.");
      window.location.assign("/inicio");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo recuperar el espacio.");
      setPending(false);
    }
  }

  return <form className="public-recovery-form" onSubmit={recover}>
    <label htmlFor="recovery-code">Código de recuperación</label>
    <input id="recovery-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="off" spellCheck={false} placeholder="LLR-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" required aria-describedby={error ? "recovery-error" : "recovery-help"} />
    <p id="recovery-help">El código vinculará este navegador con tu espacio existente. No se envía ningún correo.</p>
    {error ? <p id="recovery-error" className="public-form-error" role="alert">{error}</p> : null}
    <button className="public-primary" type="submit" disabled={pending}>{pending ? "Recuperando…" : "Recuperar mi espacio"}</button>
  </form>;
}

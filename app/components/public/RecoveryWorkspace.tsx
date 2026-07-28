"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "../../i18n/config";

type RecoveryWorkspaceProps = {
  locale?: Locale;
};

const recoveryText: Record<Locale, {
  fallbackError: string;
  label: string;
  help: string;
  pending: string;
  submit: string;
}> = {
  es: {
    fallbackError: "No se pudo recuperar el espacio.",
    label: "Codigo de recuperacion",
    help: "El codigo vinculara este navegador con tu espacio existente. No se envia ningun correo.",
    pending: "Recuperando...",
    submit: "Recuperar mi espacio",
  },
  en: {
    fallbackError: "Could not recover the workspace.",
    label: "Recovery code",
    help: "The code links this browser with your existing workspace. No email is sent.",
    pending: "Recovering...",
    submit: "Recover my workspace",
  },
};

export default function RecoveryWorkspace({ locale = "es" }: RecoveryWorkspaceProps) {
  const text = recoveryText[locale];
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
      if (!response.ok) throw new Error(body.message || text.fallbackError);
      window.location.assign("/inicio");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.fallbackError);
      setPending(false);
    }
  }

  return <form className="public-recovery-form" onSubmit={recover}>
    <label htmlFor="recovery-code">{text.label}</label>
    <input id="recovery-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="off" spellCheck={false} placeholder="LLR-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" required aria-describedby={error ? "recovery-error" : "recovery-help"} />
    <p id="recovery-help">{text.help}</p>
    {error ? <p id="recovery-error" className="public-form-error" role="alert">{error}</p> : null}
    <button className="public-primary" type="submit" disabled={pending}>{pending ? text.pending : text.submit}</button>
  </form>;
}

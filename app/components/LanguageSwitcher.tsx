"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { languageSwitcherText } from "../i18n/dictionaries";
import type { Locale } from "../i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  compact?: boolean;
};

export default function LanguageSwitcher({ locale, compact = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const labelId = useId();
  const [pending, setPending] = useState<Locale | null>(null);
  const [error, setError] = useState("");
  const text = languageSwitcherText[locale];

  async function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale || pending) return;
    setPending(nextLocale);
    setError("");
    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      if (!response.ok) throw new Error(text.error);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={`ll-language-switcher ${compact ? "is-compact" : ""}`} aria-labelledby={labelId}>
      <span id={labelId}>{text.label}</span>
      <div role="group" aria-describedby={error ? `${labelId}-error` : undefined}>
        {(["es", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={locale === option}
            disabled={Boolean(pending)}
            onClick={() => void changeLocale(option)}
          >
            {compact ? option.toUpperCase() : text.options[option]}
          </button>
        ))}
      </div>
      {pending ? <small role="status">{text.saving}</small> : null}
      {error ? <small id={`${labelId}-error`} role="alert">{error}</small> : null}
    </div>
  );
}

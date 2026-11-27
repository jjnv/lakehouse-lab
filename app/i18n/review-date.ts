import type { Locale } from "./config";

/**
 * Client-safe date localization. Kept apart from `curriculum.ts`, which pulls
 * server-only assessment copy, so client components never bundle answer keys.
 */
export function localizeReviewDate(value: string | null, locale: Locale): string | null {
  if (locale === "es" || !value) return value;
  return value
    .replace("24 de julio de 2026", "July 24, 2026")
    .replace("23 de julio de 2026", "July 23, 2026")
    .replace("21 de julio de 2026", "July 21, 2026")
    .replace("24 jul 2026", "Jul 24, 2026")
    .replace("23 jul 2026", "Jul 23, 2026")
    .replace("21 jul 2026", "Jul 21, 2026");
}

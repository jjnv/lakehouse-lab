import type { Locale } from "./config";

const SPANISH_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ENGLISH_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function spanishMonthIndex(token: string) {
  const normalized = token.toLocaleLowerCase("es").replace(/\.$/u, "");
  const index = SPANISH_MONTHS.findIndex((month) => month === normalized || (normalized.length >= 3 && month.startsWith(normalized)));
  return index;
}

/**
 * Traduce las fechas editoriales en español ("25 ago 2026" o
 * "25 de agosto de 2026") al formato inglés. Cualquier otro texto se devuelve
 * sin cambios para no inventar fechas.
 */
export function localizeReviewDate(value: string | null, locale: Locale): string | null {
  if (locale === "es" || !value) return value;
  return value.replace(/\b(\d{1,2})(?: de)? ([a-záéíóú]+\.?)(?: de)? (\d{4})\b/giu, (match, day: string, month: string, year: string) => {
    const index = spanishMonthIndex(month);
    if (index < 0) return match;
    const name = ENGLISH_MONTHS[index];
    const label = month.length <= 4 ? name.slice(0, 3) : name;
    return `${label} ${Number(day)}, ${year}`;
  });
}

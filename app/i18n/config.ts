export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE_NAME = "lakehouse_locale";
export const SUPPORTED_LOCALES: readonly Locale[] = ["es", "en"];

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}

export function localeFromValue(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeLabel(locale: Locale) {
  return locale === "en" ? "English" : "Español";
}

export function bcp47Locale(locale: Locale) {
  return locale === "en" ? "en-US" : "es-ES";
}

export function openGraphLocale(locale: Locale) {
  return locale === "en" ? "en_US" : "es_ES";
}

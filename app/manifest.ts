import type { MetadataRoute } from "next";
import { getRequestLocale } from "./i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getRequestLocale();
  return {
    name: "Lakehouse Lab",
    short_name: "Lakehouse Lab",
    description: locale === "en"
      ? "Practical path in English for learning data engineering with Databricks."
      : "Ruta práctica en español para aprender ingeniería de datos con Databricks.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090D",
    theme_color: "#A93216",
    lang: locale,
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo-mark.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
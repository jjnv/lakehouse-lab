import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lakehouse Lab",
    short_name: "Lakehouse Lab",
    description: "Ruta práctica en español para aprender ingeniería de datos con Databricks.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090D",
    theme_color: "#A93216",
    lang: "es",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo-mark.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

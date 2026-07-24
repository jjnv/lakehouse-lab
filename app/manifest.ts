import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lakehouse Lab",
    short_name: "Lakehouse Lab",
    description: "Ruta práctica en español para aprender ingeniería de datos con Databricks.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F3EC",
    theme_color: "#385D7A",
    lang: "es",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo-mark.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lakehouse Lab",
    short_name: "Lakehouse Lab",
    description: "Preparación independiente para Databricks Data Engineer Associate y Professional.",
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

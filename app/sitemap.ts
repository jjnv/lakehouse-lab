import type { MetadataRoute } from "next";
import { moduleSummaries } from "./enterprise/curriculum";
import { PROJECT_PUBLIC_URL } from "./project-info";

const baseUrl = PROJECT_PUBLIC_URL.replace(/\/$/, "");

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${path}`,
    changeFrequency: "weekly",
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    entry("/", 1),
    entry("/associate", 0.9),
    entry("/professional", 0.9),
    entry("/simulacros", 0.85),
    entry("/simulacro/associate", 0.75),
    entry("/simulacro/professional", 0.75),
    entry("/catalogo", 0.8),
    entry("/acerca-de", 0.45),
    entry("/privacidad", 0.35),
    entry("/terminos", 0.35),
  ];
  const modules = moduleSummaries().map((module) => entry(`/curso/${module.slug}`, 0.7));
  return [...staticRoutes, ...modules];
}

import type { MetadataRoute } from "next";
import { moduleSummaries } from "./enterprise/curriculum";
import { PROJECT_PUBLIC_URL } from "./project-info";
import { modules as curriculumModules } from "./course-data";

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
    entry("/ruta", 0.95),
    entry("/associate", 0.9),
    entry("/professional", 0.9),
    entry("/simulacros", 0.85),
    entry("/simulacro/associate", 0.75),
    entry("/simulacro/professional", 0.75),
    entry("/catalogo", 0.8),
    entry("/recursos", 0.75),
    entry("/glosario", 0.72),
    entry("/metodologia", 0.65),
    entry("/changelog", 0.55),
    entry("/acerca-de", 0.45),
    entry("/privacidad", 0.35),
    entry("/terminos", 0.35),
  ];
  const modules = moduleSummaries().map((module) => entry(`/curso/${module.slug}`, 0.7));
  const lessons = moduleSummaries().flatMap((summary) => {
    const source = curriculumModules.find((module) => module.id === summary.id);
    return source ? source.lessons.map((lesson) => entry(`/curso/${summary.slug}/${lesson.id}`, 0.6)) : [];
  });
  return [...staticRoutes, ...modules, ...lessons];
}

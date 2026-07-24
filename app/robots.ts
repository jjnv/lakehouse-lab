import type { MetadataRoute } from "next";
import { PROJECT_PUBLIC_URL } from "./project-info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/inicio",
        "/mi-aprendizaje",
        "/expediente",
        "/ajustes",
        "/certificados/",
        "/entrar",
        "/salir",
        "/recuperar",
        "/offline",
      ],
    },
    sitemap: `${PROJECT_PUBLIC_URL.replace(/\/$/, "")}/sitemap.xml`,
  };
}

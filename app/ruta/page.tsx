import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { modules } from "../course-data";
import { DURATION_METHOD, learningPathProfiles, modulesForPath } from "../learning-paths";

export const metadata: Metadata = {
  title: "Ruta de aprendizaje",
  description: "Elige una ruta práctica en español para aprender ingeniería de datos con Databricks o preparar Associate y Professional.",
  alternates: { canonical: "/ruta" },
  openGraph: {
    title: "Ruta Lakehouse Lab",
    description: "Entradas por objetivo: Associate, Professional, Databricks desde cero, streaming, CDC y laboratorios.",
    url: "/ruta",
  },
};

export default function RutaPage() {
  const firstModule = modules[0];
  const firstLesson = firstModule.lessons[0];
  const firstLessonHref = `/curso/${firstModule.slug}/${firstLesson.id}`;
  const firstLessonMinutes = Math.max(12, Math.round((firstModule.minutes * 0.5) / firstModule.lessons.length));
  const recommendedPath = learningPathProfiles.find((path) => path.id === "databricks-cero") ?? learningPathProfiles[0];
  const groupedPaths = [
    { title: "Aprender desde cero", paths: learningPathProfiles.filter((path) => path.id === "databricks-cero") },
    { title: "Preparar una certificación", paths: learningPathProfiles.filter((path) => path.id === "associate" || path.id === "professional") },
    { title: "Profundizar en un área concreta", paths: learningPathProfiles.filter((path) => path.id === "streaming-cdc" || path.id === "laboratorios") },
  ].filter((group) => group.paths.length);

  return <PublicShell active="route">
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="route-heading">
        <p className="public-kicker">Ruta de aprendizaje</p>
        <h1 id="route-heading">Empieza desde cero si no sabes qué elegir.</h1>
        <p className="public-document-lead">La recomendación inicial es leer la primera lección de fundamentos. Después puedes cambiar de objetivo hacia certificación, streaming, CDC o laboratorios.</p>
      </section>

      <section aria-labelledby="recommended-route-heading">
        <article className="public-recommended-route">
          <span>Recomendación</span>
          <h2 id="recommended-route-heading">{recommendedPath.title}</h2>
          <p>{recommendedPath.objective}</p>
          <dl>
            <div><dt>Para quién</dt><dd>{recommendedPath.forWhom}</dd></div>
            <div><dt>Primera acción</dt><dd>{firstLesson.title} · {firstLessonMinutes} min aprox.</dd></div>
            <div><dt>Registro</dt><dd>No obligatorio para leer</dd></div>
          </dl>
          <div className="public-actions">
            <a className="public-primary" href={firstLessonHref}>Empezar por la primera lección<span aria-hidden="true">→</span></a>
            <a className="public-secondary" href={recommendedPath.href}>Ver módulos de fundamentos</a>
          </div>
        </article>
      </section>

      <details className="public-route-disclosure">
        <summary>Cambiar objetivo</summary>
        <div className="public-route-groups">
          {groupedPaths.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              <div className="public-route-grid">
                {group.paths.map((path) => {
                  const selectedModules = modulesForPath(path);
                  return <article key={path.id}>
                    <header>
                      <span>{path.shortTitle}</span>
                      <h3>{path.title}</h3>
                      <p>{path.objective}</p>
                    </header>
                    <dl>
                      <div><dt>Conocimientos previos</dt><dd>{path.prerequisites}</dd></div>
                      <div><dt>Duración estimada</dt><dd>{path.durationLabel}</dd></div>
                      <div><dt>Módulos incluidos</dt><dd>{path.moduleCount} módulos: {selectedModules.slice(0, 4).map((module) => module.short).join(", ")}{selectedModules.length > 4 ? "…" : ""}</dd></div>
                    </dl>
                    <details className="public-card-details">
                      <summary>Ver resultado esperado</summary>
                      <p>{path.expectedOutcome}</p>
                    </details>
                    <a className="public-secondary" href={path.href}>{path.cta}<span aria-hidden="true">→</span></a>
                  </article>;
                })}
              </div>
            </section>
          ))}
        </div>
      </details>

      <section className="public-section public-integrity" aria-labelledby="duration-heading">
        <div><p className="public-kicker">Criterio de duración</p><h2 id="duration-heading">Estimaciones, no garantías.</h2></div>
        <div><p>{DURATION_METHOD}</p><p>El tiempo real depende de experiencia previa, entorno disponible, profundidad de ejecución del laboratorio y repaso necesario después de las evaluaciones.</p></div>
      </section>
    </main>
  </PublicShell>;
}

import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
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
  return <PublicShell active="route">
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="route-heading">
        <p className="public-kicker">Ruta de aprendizaje</p>
        <h1 id="route-heading">Elige el punto de entrada que encaja con tu objetivo.</h1>
        <p className="public-document-lead">Lakehouse Lab está organizado como una ruta práctica de ingeniería de datos. Las certificaciones Associate y Professional aparecen como hitos posibles, no como la única razón para estudiar.</p>
      </section>

      <section className="public-route-grid" aria-label="Opciones de ruta">
        {learningPathProfiles.map((path) => {
          const selectedModules = modulesForPath(path);
          return <article key={path.id}>
            <header>
              <span>{path.shortTitle}</span>
              <h2>{path.title}</h2>
              <p>{path.objective}</p>
            </header>
            <dl>
              <div><dt>Para quién</dt><dd>{path.forWhom}</dd></div>
              <div><dt>Conocimientos previos</dt><dd>{path.prerequisites}</dd></div>
              <div><dt>Módulos incluidos</dt><dd>{path.moduleCount} módulos: {selectedModules.slice(0, 4).map((module) => module.short).join(", ")}{selectedModules.length > 4 ? "…" : ""}</dd></div>
              <div><dt>Duración estimada</dt><dd>{path.durationLabel}</dd></div>
              <div><dt>Resultado esperado</dt><dd>{path.expectedOutcome}</dd></div>
            </dl>
            <a className="public-primary" href={path.href}>{path.cta}<span aria-hidden="true">→</span></a>
          </article>;
        })}
      </section>

      <section className="public-section public-integrity" aria-labelledby="duration-heading">
        <div><p className="public-kicker">Criterio de duración</p><h2 id="duration-heading">Estimaciones, no garantías.</h2></div>
        <div><p>{DURATION_METHOD}</p><p>El tiempo real depende de experiencia previa, entorno disponible, profundidad de ejecución del laboratorio y repaso necesario después de las evaluaciones.</p></div>
      </section>
    </main>
  </PublicShell>;
}

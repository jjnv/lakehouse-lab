import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import {
  EDITORIAL_OWNER,
  EDITORIAL_REVIEW_STATUS,
  EDITORIAL_UPDATE_FREQUENCY,
  methodologyReferences,
} from "../editorial-model";
import { CONTENT_REVIEW_DATE, CONTENT_VERSION_LABEL, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";
import { DURATION_METHOD } from "../learning-paths";

export const metadata: Metadata = {
  title: "Metodología editorial",
  description: "Cómo se crea, revisa, versiona y corrige el contenido de Lakehouse Lab.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    title: "Metodología editorial de Lakehouse Lab",
    description: "Fuentes, blueprints, revisión técnica, limitaciones y proceso de corrección del contenido.",
    url: "/metodologia",
  },
};

export default function MetodologiaPage() {
  return <PublicShell active="methodology">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Metodología editorial</p>
        <h1>Cómo validamos el contenido.</h1>
        <p className="public-document-lead">Lakehouse Lab documenta sus fuentes y limitaciones para que puedas evaluar la confianza del material antes de invertir tiempo de estudio.</p>

        <section>
          <h2>1. Autoría y contexto</h2>
          <p>{EDITORIAL_OWNER.name} mantiene el proyecto como {EDITORIAL_OWNER.role}. {EDITORIAL_OWNER.note}</p>
        </section>

        <section>
          <h2>2. Fuentes utilizadas</h2>
          <p>Las lecciones y laboratorios enlazan fuentes principales por módulo. La prioridad editorial son documentación oficial de Databricks, blueprints de certificación y referencias técnicas de Delta Lake o Apache Spark cuando corresponda.</p>
          <ul>{methodologyReferences.map((reference) => <li key={reference.href}><a href={reference.href} rel="noreferrer">{reference.label}</a></li>)}</ul>
        </section>

        <section>
          <h2>3. Relación con Associate y Professional</h2>
          <p>Los blueprints se usan como mapa de cobertura, no como copia del examen. El producto enseña ingeniería de datos práctica con Databricks y usa Associate/Professional como rutas y resultados de aprendizaje.</p>
        </section>

        <section>
          <h2>4. Redacción y revisión técnica</h2>
          <p>El proceso actual combina modelado del currículo, redacción de lecciones, creación de laboratorios, preguntas formativas y revisión interna contra fuentes enlazadas. Estado actual: {EDITORIAL_REVIEW_STATUS}. No se declaran revisores externos hasta que exista evidencia pública.</p>
        </section>

        <section>
          <h2>5. Actualización, errores y versiones</h2>
          <p>{EDITORIAL_UPDATE_FREQUENCY} Versión editorial actual: {CONTENT_VERSION_LABEL}. Última revisión global: {CONTENT_REVIEW_DATE}.</p>
          <p>Los errores se reportan en <a href={PROJECT_ISSUES_URL} rel="noreferrer">GitHub Issues</a>. Cada módulo y lección incluye un enlace de reporte con contexto precargado. El changelog público resume cambios de contenido, producto, privacidad y accesibilidad.</p>
        </section>

        <section>
          <h2>6. Duración estimada</h2>
          <p>{DURATION_METHOD}</p>
        </section>

        <section>
          <h2>7. Limitaciones</h2>
          <p>Lakehouse Lab no está afiliado, patrocinado ni avalado por Databricks. Los simulacros son internos, no son exámenes oficiales, no garantizan aprobar y no sustituyen experiencia real en un workspace. Algunas prácticas pueden requerir capacidades de pago; cuando ocurre se indica en el laboratorio.</p>
          <p>El repositorio público permite revisar implementación, pruebas y cambios: <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">{PROJECT_REPOSITORY_URL}</a>.</p>
        </section>
      </article>
    </main>
  </PublicShell>;
}

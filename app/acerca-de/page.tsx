import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_VERSION_LABEL, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";

export default function AboutPage() {
  return <PublicShell active="about">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Acerca del proyecto</p>
        <h1>Una academia construida como producto real.</h1>
        <p className="public-document-lead">Lakehouse Lab es un proyecto personal e independiente creado para explorar cómo debería sentirse una ruta técnica rigurosa: clara, práctica, accesible y con control real sobre el progreso.</p>
        <section><h2>Qué demuestra</h2><p>El proyecto combina diseño de producto, desarrollo full-stack, autenticación, persistencia, accesibilidad, evaluación y modelado de un currículo técnico. La experiencia se ejecuta con Next.js, TypeScript, vinext, Cloudflare Workers y D1.</p></section>
        <section><h2>Criterio editorial</h2><p>El contenido se redacta de forma original y se contrasta con documentación pública. Cada módulo enlaza fuentes oficiales. No se utilizan dumps de exámenes ni se presentan las notas internas como umbrales oficiales.</p><dl className="public-facts"><div><dt>Versión</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>Revisado</dt><dd>{CONTENT_REVIEW_DATE}</dd></div><div><dt>Idioma</dt><dd>Español</dd></div></dl></section>
        <section><h2>Independencia</h2><p>Lakehouse Lab no está afiliado, patrocinado ni avalado por Databricks. Databricks, Apache Spark y los nombres de producto citados pertenecen a sus respectivos titulares.</p></section>
        <section><h2>Código y colaboración</h2><p>El código fuente y la documentación técnica están disponibles en <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">el repositorio público del proyecto</a>. Puedes <a href={PROJECT_ISSUES_URL} rel="noreferrer">avisar de contenido desactualizado o de un problema</a> mediante GitHub Issues.</p></section>
      </article>
    </main>
  </PublicShell>;
}

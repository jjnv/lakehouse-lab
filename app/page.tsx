import { getSessionUser, sessionStartPath } from "./session-auth";
import PublicShell from "./components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_VERSION_LABEL, PROJECT_REPOSITORY_URL } from "./project-info";

export const dynamic = "force-dynamic";

const capabilities = [
  { number: "01", title: "Associate", copy: "Fundamentos de plataforma, Delta Lake, ingesta, transformación, Jobs, Unity Catalog y simulacro interno." },
  { number: "02", title: "Professional", copy: "Streaming, CDC, Lakeflow, rendimiento, costes, seguridad, despliegue y simulacro interno." },
  { number: "03", title: "Laboratorios", copy: "Práctica guiada con objetivos, pasos, comprobaciones y evidencias de aprendizaje." },
  { number: "04", title: "Resultados", copy: "Progreso personal, repaso por dominio, exportación y eliminación desde tu cuenta." },
];

export default async function RootPage() {
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? "Ir a mi espacio" : "Crear mi espacio";
  const catalogHref = "/catalogo";

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel}>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-kicker">Independiente · no oficial de Databricks</p>
            <h1>Prepara Databricks Data Engineer <span>Associate y Professional.</span></h1>
            <p className="public-lead">Estudia en español con lecciones alineadas al blueprint, laboratorios guiados, simulacros internos y revisión por dominio. Lakehouse Lab no está afiliado ni avalado por Databricks.</p>
            <div className="public-actions">
              <a className="public-primary" href="/associate">Elegir nivel<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href={catalogHref}>Ver temario</a>
            </div>
            <p className="public-trust">El contenido se puede leer sin registro. Solo al guardar progreso se crea un identificador privado, sin pedir nombre ni correo; puedes exportarlo o eliminarlo cuando quieras.</p>
          </div>
          <div className="public-product-preview" aria-label="Resumen del itinerario">
            <div className="public-preview-top"><span>Preparación Databricks</span><b>Associate · Professional</b></div>
            <div className="public-preview-focus">
              <small>Simulacros internos</small>
              <strong>Practica por dominio antes del examen oficial</strong>
              <span>Resultados privados · corrección en servidor</span>
            </div>
            <div className="public-preview-progress">
              <div><strong>12</strong><span>módulos Associate</span></div>
              <div><strong>32</strong><span>módulos Professional</span></div>
              <div><strong>2</strong><span>simulacros</span></div>
            </div>
            <div className="public-preview-path" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </section>

        <section className="public-proof" aria-label="Alcance del programa">
          <div><strong>2</strong><span>certificaciones objetivo</span></div>
          <div><strong>32</strong><span>módulos completos</span></div>
          <div><strong>160</strong><span>lecciones</span></div>
          <div><strong>32</strong><span>laboratorios guiados</span></div>
        </section>

        <section id="programa" className="public-section public-program" aria-labelledby="program-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Temario de preparación</p>
            <h2 id="program-heading">De Associate a Professional.</h2>
            <p>El programa conecta los dominios evaluados: plataforma, Delta Lake, ingesta, transformación, Jobs, gobierno, streaming, rendimiento y operación.</p>
          </div>
          <ol className="public-phase-list">
            <li><span>01–12</span><div><b>Preparación Associate</b><p>Plataforma, Spark, Delta Lake, ingesta, Jobs, Unity Catalog y proyecto Associate.</p></div></li>
            <li><span>13–17</span><div><b>Streaming y CDC</b><p>Estado, watermarks, Kafka, Change Data Feed y un proyecto con SLA.</p></div></li>
            <li><span>18–22</span><div><b>Pipelines y orquestación</b><p>Lakeflow, calidad, reparaciones, alertas, backfills y operación reproducible.</p></div></li>
            <li><span>23–27</span><div><b>Rendimiento y FinOps</b><p>Spark UI, Photon, layout, políticas de cómputo, fiabilidad y coste.</p></div></li>
            <li><span>28–31</span><div><b>Entrega y gobierno</b><p>Proyectos Python, automatización declarativa, privacidad e interoperabilidad.</p></div></li>
            <li><span>32</span><div><b>Convergencia Professional</b><p>Arquitectura, operación, seguridad, FinOps y defensa técnica en un proyecto final.</p></div></li>
          </ol>
        </section>

        <section className="public-section public-capabilities" aria-labelledby="method-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Método</p>
            <h2 id="method-heading">Estudiar, practicar, medir.</h2>
          </div>
          <div className="public-capability-grid">
            {capabilities.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}
          </div>
        </section>

        <section className="public-section public-integrity" aria-labelledby="integrity-heading">
          <div><p className="public-kicker">Independiente y trazable</p><h2 id="integrity-heading">Preparación clara, sin promesas engañosas.</h2></div>
          <div>
            <p>El código se desarrolla en abierto y el contenido mantiene fuentes, versión y fecha de revisión. Los simulacros son internos y no garantizan resultados externos. Puedes consultar la implementación, proponer mejoras y comunicar contenido desactualizado en <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">el repositorio público</a>.</p>
            <dl><div><dt>Versión editorial</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>Última revisión</dt><dd>{CONTENT_REVIEW_DATE}</dd></div><div><dt>Acceso</dt><dd>Sin nombre ni correo</dd></div></dl>
          </div>
        </section>

        <section className="public-cta" aria-labelledby="cta-heading">
          <p className="public-kicker">Tu preparación</p>
          <h2 id="cta-heading">Elige Associate o Professional y guarda tu progreso cuando lo necesites.</h2>
          <div className="public-actions"><a className="public-primary" href={accountHref}>{accountLabel}<span aria-hidden="true">→</span></a><a className="public-secondary" href="/simulacros">Ver simulacros</a></div>
        </section>
      </main>
    </PublicShell>
  );
}

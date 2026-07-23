import { getSessionUser, sessionStartPath } from "./session-auth";
import PublicShell from "./components/public/PublicShell";
import { CONTENT_REVIEW_DATE, CONTENT_VERSION_LABEL, PROJECT_REPOSITORY_URL } from "./project-info";

export const dynamic = "force-dynamic";

const capabilities = [
  { number: "01", title: "Modelo mental", copy: "Explicaciones que conectan arquitectura, operación y decisiones reales." },
  { number: "02", title: "Práctica guiada", copy: "Laboratorios con objetivos, pasos, comprobaciones y evidencia de finalización." },
  { number: "03", title: "Evaluación", copy: "Tests por módulo y simulacros con revisión por dominio." },
  { number: "04", title: "Progreso propio", copy: "Historial persistente, exportable y eliminable desde tu espacio." },
];

export default async function RootPage() {
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? "Ir a mi espacio" : "Crear mi espacio";
  const catalogHref = "/catalogo";
  const notebooksHref = "/catalogo?view=resources";

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel}>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-kicker">Código abierto · aprendizaje independiente</p>
            <h1>Ingeniería de datos que se <span>practica.</span></h1>
            <p className="public-lead">Una ruta abierta en español para comprender, construir y operar soluciones lakehouse mediante lecciones, laboratorios, evaluaciones y notebooks comunitarios revisados.</p>
            <div className="public-actions">
              <a className="public-primary" href={catalogHref}>Explorar el catálogo<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href={notebooksHref}>Ver notebooks</a>
            </div>
            <p className="public-trust">El contenido se puede leer sin registro. Solo al guardar progreso se crea un identificador privado, sin pedir nombre ni correo; puedes exportarlo o eliminarlo cuando quieras.</p>
          </div>
          <div className="public-product-preview" aria-label="Resumen del itinerario">
            <div className="public-preview-top"><span>Ruta Professional</span><b>Semana 1 de 20</b></div>
            <div className="public-preview-focus">
              <small>Siguiente actividad</small>
              <strong>Lake, warehouse y lakehouse sin simplificaciones</strong>
              <span>Modelo mental · 18 min</span>
            </div>
            <div className="public-preview-progress">
              <div><strong>32</strong><span>módulos</span></div>
              <div><strong>100 h</strong><span>de práctica</span></div>
              <div><strong>2</strong><span>simulacros</span></div>
            </div>
            <div className="public-preview-path" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </section>

        <section className="public-proof" aria-label="Alcance del programa">
          <div><strong>20</strong><span>semanas orientativas</span></div>
          <div><strong>32</strong><span>módulos completos</span></div>
          <div><strong>160</strong><span>lecciones</span></div>
          <div><strong>32</strong><span>laboratorios guiados</span></div>
        </section>

        <section id="programa" className="public-section public-program" aria-labelledby="program-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Una ruta, no una lista de enlaces</p>
            <h2 id="program-heading">Del fundamento a la operación.</h2>
            <p>El programa conecta arquitectura lakehouse, streaming y CDC, pipelines, rendimiento, FinOps, entrega y gobierno.</p>
          </div>
          <ol className="public-phase-list">
            <li><span>01–12</span><div><b>Fundamentos lakehouse</b><p>Plataforma, Spark, Delta Lake, ingesta, Jobs, Unity Catalog y proyecto Associate.</p></div></li>
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
            <h2 id="method-heading">Aprender, practicar, recordar.</h2>
          </div>
          <div className="public-capability-grid">
            {capabilities.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}
          </div>
        </section>

        <section className="public-section public-integrity" aria-labelledby="integrity-heading">
          <div><p className="public-kicker">Abierto y trazable</p><h2 id="integrity-heading">Aprende con el proyecto, mejora el proyecto.</h2></div>
          <div>
            <p>El código se desarrolla en abierto y el contenido mantiene fuentes, versión y fecha de revisión. Puedes consultar la implementación, proponer mejoras y comunicar contenido desactualizado en <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">el repositorio público</a>.</p>
            <dl><div><dt>Versión editorial</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>Última revisión</dt><dd>{CONTENT_REVIEW_DATE}</dd></div><div><dt>Acceso</dt><dd>Sin nombre ni correo</dd></div></dl>
          </div>
        </section>

        <section className="public-cta" aria-labelledby="cta-heading">
          <p className="public-kicker">Tu ruta, a tu ritmo</p>
          <h2 id="cta-heading">Abre tu espacio personal y continúa donde lo dejaste.</h2>
          <div className="public-actions"><a className="public-primary" href={accountHref}>{accountLabel}<span aria-hidden="true">→</span></a><a className="public-secondary" href={notebooksHref}>Explorar notebooks</a></div>
        </section>
      </main>
    </PublicShell>
  );
}

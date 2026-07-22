import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
import PublicShell from "./components/public/PublicShell";
import { CONTENT_REVIEW_DATE } from "./project-info";

export const dynamic = "force-dynamic";

const capabilities = [
  { number: "01", title: "Modelo mental", copy: "Explicaciones que conectan arquitectura, operación y decisiones reales." },
  { number: "02", title: "Práctica guiada", copy: "Laboratorios con objetivos, pasos, comprobaciones y evidencia de finalización." },
  { number: "03", title: "Evaluación", copy: "Tests por módulo y simulacros con revisión por dominio." },
  { number: "04", title: "Progreso propio", copy: "Historial sincronizado, exportable y eliminable desde la cuenta." },
];

export default async function RootPage() {
  const user = await getChatGPTUser();
  const accountHref = user ? "/inicio" : chatGPTSignInPath("/inicio");
  const accountLabel = user ? "Ir a mi espacio" : "Empezar gratis";

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel}>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-kicker">Beta pública · proyecto independiente</p>
            <h1>Ingeniería de datos que se <span>practica.</span></h1>
            <p className="public-lead">Una ruta en español para comprender, construir y operar soluciones lakehouse. Sin dumps, sin promesas de aprobado y con fuentes oficiales en cada módulo.</p>
            <div className="public-actions">
              <a className="public-primary" href={accountHref}>{accountLabel}<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href="/demo">Explorar la demo</a>
            </div>
            <p className="public-trust">El acceso con ChatGPT solo identifica tu cuenta para guardar el progreso. Puedes exportarlo o eliminarlo cuando quieras.</p>
          </div>
          <div className="public-product-preview" aria-label="Vista previa del producto">
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
            <li><span>28–32</span><div><b>Entrega y gobierno</b><p>Proyectos Python, automatización declarativa, privacidad y convergencia Professional.</p></div></li>
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
          <div><p className="public-kicker">Integridad editorial</p><h2 id="integrity-heading">Preparación sin atajos.</h2></div>
          <div>
            <p>Las preguntas son originales y se apoyan en documentación pública. La plataforma no contiene volcados de exámenes ni representa una certificación oficial.</p>
            <dl><div><dt>Versión editorial</dt><dd>2026.07</dd></div><div><dt>Última revisión</dt><dd>{CONTENT_REVIEW_DATE}</dd></div><div><dt>Estado</dt><dd>Beta pública</dd></div></dl>
          </div>
        </section>

        <section className="public-cta" aria-labelledby="cta-heading">
          <p className="public-kicker">Empieza por una muestra</p>
          <h2 id="cta-heading">Comprueba el método antes de crear una cuenta.</h2>
          <div className="public-actions"><a className="public-primary" href="/demo">Abrir la demo<span aria-hidden="true">→</span></a><a className="public-secondary" href={accountHref}>{accountLabel}</a></div>
        </section>
      </main>
    </PublicShell>
  );
}

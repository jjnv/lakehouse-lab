import { getSessionUser, sessionStartPath } from "./session-auth";
import PublicShell from "./components/public/PublicShell";
import {
  CONTENT_REVIEW_DATE,
  CONTENT_VERSION_LABEL,
  PROJECT_REPOSITORY_URL,
} from "./project-info";
import { modules, totalMinutes } from "./course-data";
import { learningPathProfiles, totalLessonCount } from "./learning-paths";

export const dynamic = "force-dynamic";

const capabilities = [
  {
    number: "01",
    title: "Lecciones aplicadas",
    copy: "Conceptos, decisiones de diseño, ejemplos SQL/PySpark y recuerdo activo en cada módulo.",
  },
  {
    number: "02",
    title: "Laboratorios",
    copy: "Prácticas guiadas con objetivo, entorno, pasos, starter code, checks y evidencia esperada.",
  },
  {
    number: "03",
    title: "Evaluaciones",
    copy: "Preguntas por módulo y simulacros internos corregidos en servidor, sin exponer claves al cliente.",
  },
  {
    number: "04",
    title: "Continuidad",
    copy: "Progreso estructurado, recuperación privada, exportación y eliminación cuando decides guardar.",
  },
];

export default async function RootPage() {
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? "Ir a mi progreso" : "Guardar progreso";
  const sampleModule = modules[0];
  const sampleLesson = sampleModule.lessons[0];
  const sampleQuestion = sampleModule.quiz[0];
  const sampleLessonHref = `/curso/${sampleModule.slug}/${sampleLesson.id}`;
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel} active="home">
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-kicker">Ruta práctica en español · independiente de Databricks</p>
            <h1>Domina la ingeniería de datos <span>con Databricks.</span></h1>
            <p className="public-lead">
              Ruta práctica en español con lecciones, laboratorios, evaluaciones y simulacros alineados con las certificaciones Data Engineer Associate y Professional.
            </p>
            <div className="public-actions">
              <a className="public-primary" href="/ruta">Empezar la ruta<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href={sampleLessonHref}>Ver una lección de ejemplo</a>
            </div>
            <p className="public-trust">
              Señal verificable: proyecto público en GitHub, fuentes oficiales enlazadas por módulo, changelog editorial y metodología abierta. Lakehouse Lab no está afiliado ni avalado por Databricks.
            </p>
          </div>
          <div className="public-product-preview" aria-label="Vista resumida del producto">
            <div className="public-preview-top">
              <span>Módulo {sampleModule.number}</span>
              <b>{sampleModule.short}</b>
            </div>
            <div className="public-preview-focus">
              <small>Lección real</small>
              <strong>{sampleLesson.title}</strong>
              <span>{sampleLesson.summary}</span>
            </div>
            <div className="public-preview-progress">
              <div><strong>5</strong><span>lecciones</span></div>
              <div><strong>1</strong><span>laboratorio</span></div>
              <div><strong>{sampleModule.quiz.length}</strong><span>preguntas</span></div>
            </div>
            <div className="public-preview-path" role="img" aria-label="Progreso visual: lección, laboratorio y evaluación"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </section>

        <section className="public-proof" aria-label="Alcance verificable del programa">
          <div><strong>{modules.length}</strong><span>módulos versionados</span></div>
          <div><strong>{totalLessonCount()}</strong><span>lecciones</span></div>
          <div><strong>{modules.length}</strong><span>laboratorios guiados</span></div>
          <div><strong>{totalHours}</strong><span>horas estimadas</span></div>
        </section>

        <section id="objetivos" className="public-section public-goals" aria-labelledby="goals-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Entrada por perfil</p>
            <h2 id="goals-heading">¿Cuál es tu objetivo?</h2>
            <p>Elige una entrada funcional según lo que necesitas aprender ahora. Las duraciones son estimaciones curriculares, no garantías.</p>
          </div>
          <div className="public-goal-grid">
            {learningPathProfiles.map((path) => (
              <article key={path.id}>
                <span>{path.shortTitle}</span>
                <h3>{path.title}</h3>
                <dl>
                  <div><dt>Para quién</dt><dd>{path.forWhom}</dd></div>
                  <div><dt>Previos</dt><dd>{path.prerequisites}</dd></div>
                  <div><dt>Objetivo</dt><dd>{path.objective}</dd></div>
                  <div><dt>Incluye</dt><dd>{path.moduleCount} módulos · {path.lessonCount} lecciones · {path.labCount} labs</dd></div>
                  <div><dt>Duración</dt><dd>{path.durationLabel}</dd></div>
                  <div><dt>Resultado</dt><dd>{path.expectedOutcome}</dd></div>
                </dl>
                <a className="public-secondary" href={path.href}>{path.cta}<span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-demo" aria-labelledby="demo-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Cómo se estudia</p>
            <h2 id="demo-heading">Del concepto a la práctica y la medición.</h2>
            <p>Esta demostración usa contenido real del currículo: una lección, un laboratorio, una pregunta de evaluación, progreso y resultado de simulacro.</p>
          </div>
          <div className="public-demo-grid">
            <article>
              <span>Lección</span>
              <h3>{sampleLesson.title}</h3>
              <p>{sampleLesson.explanation[0]}</p>
              <pre tabIndex={0}><code>{sampleLesson.example.code}</code></pre>
            </article>
            <article>
              <span>Laboratorio</span>
              <h3>{sampleModule.lab.title}</h3>
              <p>{sampleModule.lab.goal}</p>
              <ol>{sampleModule.lab.steps.slice(0, 3).map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
            <article>
              <span>Evaluación</span>
              <h3>{sampleQuestion.domain}</h3>
              <p>{sampleQuestion.question}</p>
              <ul>{sampleQuestion.options.slice(0, 3).map((option) => <li key={option}>{option}</li>)}</ul>
            </article>
            <article>
              <span>Progreso</span>
              <h3>Continuar desde la última actividad</h3>
              <p>El panel privado muestra módulos, lecciones completadas, laboratorios, repasos y mejores resultados de simulacro.</p>
              <div className="public-demo-progress" role="img" aria-label="Ejemplo visual de progreso estructurado">
                <i style={{ width: "58%" }} />
              </div>
              <small>Simulacro interno: desglose por dominio, sin equivaler al examen oficial.</small>
            </article>
          </div>
        </section>

        <section className="public-section public-program" aria-labelledby="program-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Temario estructurado</p>
            <h2 id="program-heading">Una ruta de ingeniería de datos, no solo un preparador de examen.</h2>
            <p>Associate y Professional aparecen como hitos dentro de un recorrido práctico: fundamentos, streaming, orquestación, rendimiento, entrega, gobierno y capstone.</p>
          </div>
          <ol className="public-phase-list">
            <li><span>01-12</span><div><b>Fundamentos lakehouse</b><p>Plataforma, Spark, Delta Lake, ingesta, Jobs, Unity Catalog y proyecto Associate.</p></div></li>
            <li><span>13-17</span><div><b>Streaming y CDC</b><p>Estado, watermarks, Kafka, Change Data Feed y un proyecto con SLA.</p></div></li>
            <li><span>18-22</span><div><b>Pipelines y orquestación</b><p>Lakeflow, calidad, reparaciones, alertas, backfills y operación reproducible.</p></div></li>
            <li><span>23-27</span><div><b>Rendimiento y FinOps</b><p>Spark UI, Photon, layout, políticas de cómputo, fiabilidad y coste.</p></div></li>
            <li><span>28-31</span><div><b>Entrega y gobierno</b><p>Proyectos Python, automatización declarativa, privacidad e interoperabilidad.</p></div></li>
            <li><span>32</span><div><b>Convergencia Professional</b><p>Arquitectura, operación, seguridad, FinOps y defensa técnica en un proyecto final.</p></div></li>
          </ol>
        </section>

        <section className="public-section public-capabilities" aria-labelledby="method-heading">
          <div className="public-section-heading">
            <p className="public-kicker">Método</p>
            <h2 id="method-heading">Estudiar, practicar, medir y retomar.</h2>
          </div>
          <div className="public-capability-grid">
            {capabilities.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}
          </div>
        </section>

        <section className="public-section public-integrity" aria-labelledby="integrity-heading">
          <div><p className="public-kicker">Confianza verificable</p><h2 id="integrity-heading">Contenido trazable, sin testimonios inventados.</h2></div>
          <div>
            <p>El código se desarrolla en abierto y el contenido mantiene fuentes, versión y fecha de revisión. Los simulacros son internos y no garantizan resultados externos. Si encuentras un error, puedes reportarlo en <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">el repositorio público</a>.</p>
            <dl><div><dt>Versión editorial</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>Última revisión</dt><dd>{CONTENT_REVIEW_DATE}</dd></div><div><dt>Validación externa</dt><dd>No declarada</dd></div></dl>
          </div>
        </section>

        <section className="public-cta" aria-labelledby="cta-heading">
          <p className="public-kicker">Siguiente acción</p>
          <h2 id="cta-heading">Empieza por una ruta clara y guarda progreso solo cuando lo necesites.</h2>
          <div className="public-actions"><a className="public-primary" href="/ruta">Empezar la ruta<span aria-hidden="true">→</span></a><a className="public-secondary" href={sampleLessonHref}>Ver una lección de ejemplo</a></div>
        </section>
      </main>
    </PublicShell>
  );
}

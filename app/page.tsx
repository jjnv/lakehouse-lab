import { getSessionUser, sessionStartPath } from "./session-auth";
import PublicShell from "./components/public/PublicShell";
import {
  CONTENT_REVIEW_DATE,
  CONTENT_REVIEW_DATE_EN,
  CONTENT_VERSION_LABEL,
  PROJECT_REPOSITORY_URL,
} from "./project-info";
import { modules } from "./course-data";
import { learningPathProfiles } from "./learning-paths";
import { getRequestLocale } from "./i18n/server";
import { localizeModule } from "./i18n/curriculum";
import { localizeLearningPathProfile } from "./i18n/learning-paths";
import type { Locale } from "./i18n/config";

export const dynamic = "force-dynamic";

const homeText: Record<Locale, {
  accountProgress: string;
  accountSave: string;
  heroKicker: string;
  heroTitlePrefix: string;
  heroTitleAccent: string;
  heroLead: string;
  firstLesson: string;
  registration: string;
  registrationValue: string;
  level: string;
  levelValue: string;
  outcome: string;
  outcomeValue: string;
  startLesson: string;
  exploreRoutes: string;
  trust: string;
  module: string;
  lessonProgress: (current: number, total: number) => string;
  lessons: string;
  lab: string;
  questions: string;
  goalsKicker: string;
  goalsTitle: string;
  goalsDesc: string;
  recommendedRouteForWhom: string;
  recommendedRouteEffort: (firstLessonMins: number, fullDuration: string) => string;
  recommendedRouteOutcome: string;
  chooseAnotherGoal: string;
  prereqs: string;
  duration: string;
  result: string;
  howToStudyKicker: string;
  howToStudyTitle: string;
  howToStudyDesc: string;
  demoLesson: string;
  demoLab: string;
  demoQuiz: string;
  demoProgress: string;
  demoProgressTitle: string;
  demoProgressDesc: string;
  demoSimulatorNote: string;
  programKicker: string;
  programTitle: string;
  programDesc: string;
  phases: Array<{ idRange: string; title: string; desc: string }>;
  proofModules: string;
  proofLessons: string;
  proofHours: string;
  methodKicker: string;
  methodTitle: string;
  capabilities: Array<{ number: string; title: string; copy: string }>;
  integrityKicker: string;
  integrityTitle: string;
  integrityBody: string;
  editorialVersion: string;
  lastReview: string;
  externalValidation: string;
  externalValidationVal: string;
  ctaKicker: string;
  ctaTitle: string;
  startFirstLessonBtn: string;
  exploreRoutesBtn: string;
}> = {
  es: {
    accountProgress: "Mi progreso",
    accountSave: "Guardar progreso",
    heroKicker: "Ruta práctica en español · independiente de Databricks",
    heroTitlePrefix: "Empieza con fundamentos",
    heroTitleAccent: "lakehouse.",
    heroLead: "Primera sesión: lee una lección breve, entiende el modelo lakehouse y decide después si quieres guardar tu progreso.",
    firstLesson: "Primera lección",
    registration: "Registro",
    registrationValue: "No obligatorio",
    level: "Nivel",
    levelValue: "Inicial",
    outcome: "Resultado",
    outcomeValue: "Identificar plataforma, lakehouse y siguiente paso",
    startLesson: "Empezar la primera lección",
    exploreRoutes: "Explorar rutas",
    trust: "Puedes leer antes de crear una sesión. Fuentes, revisión editorial y metodología siguen disponibles cuando necesites comprobar el rigor.",
    module: "Módulo",
    lessonProgress: (current, total) => `Lección ${current} de ${total}`,
    lessons: "lecciones",
    lab: "laboratorio",
    questions: "preguntas",
    goalsKicker: "Ruta recomendada",
    goalsTitle: "¿Es tu primera vez con Databricks?",
    goalsDesc: "Empieza desde cero. No necesitas comparar todas las rutas para leer la primera lección.",
    recommendedRouteForWhom: "Para quién",
    recommendedRouteEffort: (firstLessonMins, fullDuration) => `Primera lección: ${firstLessonMins} min · ruta completa: ${fullDuration}`,
    recommendedRouteOutcome: "Resultado",
    chooseAnotherGoal: "Elegir otro objetivo",
    prereqs: "Previos",
    duration: "Duración",
    result: "Resultado",
    howToStudyKicker: "Cómo se estudia",
    howToStudyTitle: "Una lección revela la complejidad paso a paso.",
    howToStudyDesc: "Primero lees el concepto, después ves un ejemplo, respondes una pregunta de recuerdo activo y decides si continúas al laboratorio.",
    demoLesson: "Lección",
    demoLab: "Laboratorio",
    demoQuiz: "Evaluación",
    demoProgress: "Progreso",
    demoProgressTitle: "Continuar desde la última actividad",
    demoProgressDesc: "El panel privado muestra módulos, lecciones completadas, laboratorios, repasos y mejores resultados de simulacro.",
    demoSimulatorNote: "Simulacro interno: desglose por dominio, sin equivaler al examen oficial.",
    programKicker: "Temario estructurado",
    programTitle: "El alcance completo queda disponible cuando lo necesites.",
    programDesc: "Associate y Professional aparecen como hitos dentro de un recorrido práctico: fundamentos, streaming, orquestación, rendimiento, entrega, gobierno y capstone.",
    phases: [
      { idRange: "01-12", title: "Fundamentos lakehouse", desc: "Plataforma, Spark, Delta Lake, ingesta, Jobs, Unity Catalog y proyecto Associate." },
      { idRange: "13-17", title: "Streaming y CDC", desc: "Estado, watermarks, Kafka, Change Data Feed y un proyecto con SLA." },
      { idRange: "18-22", title: "Pipelines y orquestación", desc: "Lakeflow, calidad, reparaciones, alertas, backfills y operación reproducible." },
      { idRange: "23-27", title: "Rendimiento y FinOps", desc: "Spark UI, Photon, layout, políticas de cómputo, fiabilidad y coste." },
      { idRange: "28-31", title: "Entrega y gobierno", desc: "Proyectos Python, automatización declarativa, privacidad e interoperabilidad." },
      { idRange: "32", title: "Convergencia Professional", desc: "Arquitectura, operación, seguridad, FinOps y defensa técnica en un proyecto final." },
    ],
    proofModules: "módulos versionados",
    proofLessons: "lecciones",
    proofHours: "horas estimadas",
    methodKicker: "Método",
    methodTitle: "Estudiar, practicar, medir y retomar.",
    capabilities: [
      { number: "01", title: "Lecciones aplicadas", copy: "Conceptos, decisiones de diseño, ejemplos SQL/PySpark y recuerdo activo en cada módulo." },
      { number: "02", title: "Laboratorios", copy: "Prácticas guiadas con objetivo, entorno, pasos, starter code, checks y evidencia esperada." },
      { number: "03", title: "Evaluaciones", copy: "Preguntas por módulo y simulacros internos corregidos en servidor, sin exponer claves al cliente." },
      { number: "04", title: "Continuidad", copy: "Progreso estructurado, recuperación privada, exportación y eliminación cuando decides guardar." },
    ],
    integrityKicker: "Confianza verificable",
    integrityTitle: "Contenido trazable, sin testimonios inventados.",
    integrityBody: "El código se desarrolla en abierto y el contenido mantiene fuentes, versión y fecha de revisión. Los simulacros son internos y no garantizan resultados externos. Si encuentras un error, puedes reportarlo en el repositorio público.",
    editorialVersion: "Versión editorial",
    lastReview: "Última revisión",
    externalValidation: "Validación externa",
    externalValidationVal: "No declarada",
    ctaKicker: "Siguiente acción",
    ctaTitle: "Empieza por una ruta clara y guarda progreso solo cuando lo necesites.",
    startFirstLessonBtn: "Empezar la primera lección",
    exploreRoutesBtn: "Explorar rutas",
  },
  en: {
    accountProgress: "My progress",
    accountSave: "Save progress",
    heroKicker: "Practical learning path in English · independent from Databricks",
    heroTitlePrefix: "Start with",
    heroTitleAccent: "lakehouse fundamentals.",
    heroLead: "First session: read a short lesson, understand the lakehouse model, and then decide whether you want to save your progress.",
    firstLesson: "First lesson",
    registration: "Sign-up",
    registrationValue: "Not required",
    level: "Level",
    levelValue: "Beginner",
    outcome: "Outcome",
    outcomeValue: "Identify the platform, lakehouse model, and next step",
    startLesson: "Start the first lesson",
    exploreRoutes: "Explore paths",
    trust: "You can read before creating a session. Sources, editorial review, and methodology remain available when you need to verify rigor.",
    module: "Module",
    lessonProgress: (current, total) => `Lesson ${current} of ${total}`,
    lessons: "lessons",
    lab: "lab",
    questions: "questions",
    goalsKicker: "Recommended path",
    goalsTitle: "Is this your first time with Databricks?",
    goalsDesc: "Start from scratch. You don't need to compare all paths before reading the first lesson.",
    recommendedRouteForWhom: "Target audience",
    recommendedRouteEffort: (firstLessonMins, fullDuration) => `First lesson: ${firstLessonMins} min · full path: ${fullDuration}`,
    recommendedRouteOutcome: "Outcome",
    chooseAnotherGoal: "Choose another goal",
    prereqs: "Prerequisites",
    duration: "Duration",
    result: "Outcome",
    howToStudyKicker: "How it works",
    howToStudyTitle: "A lesson unveils complexity step by step.",
    howToStudyDesc: "First you read the concept, then view code examples, answer an active recall prompt, and choose whether to proceed to the lab.",
    demoLesson: "Lesson",
    demoLab: "Lab",
    demoQuiz: "Quiz",
    demoProgress: "Progress",
    demoProgressTitle: "Continue from your last activity",
    demoProgressDesc: "Your private dashboard shows modules, completed lessons, labs, reviews, and top practice exam scores.",
    demoSimulatorNote: "Internal practice exam: domain breakdown, not equivalent to official certification.",
    programKicker: "Structured curriculum",
    programTitle: "Full scope available whenever you need it.",
    programDesc: "Associate and Professional appear as milestones in a practical journey: fundamentals, streaming, orchestration, performance, delivery, governance, and capstone.",
    phases: [
      { idRange: "01-12", title: "Lakehouse Fundamentals", desc: "Platform, Spark, Delta Lake, ingestion, Jobs, Unity Catalog, and Associate capstone project." },
      { idRange: "13-17", title: "Streaming and CDC", desc: "State, watermarks, Kafka, Change Data Feed, and an SLA-bound project." },
      { idRange: "18-22", title: "Pipelines and Orchestration", desc: "Lakeflow, quality, repairs, alerts, backfills, and reproducible operations." },
      { idRange: "23-27", title: "Performance and FinOps", desc: "Spark UI, Photon, layout, compute policies, reliability, and cost." },
      { idRange: "28-31", title: "Delivery and Governance", desc: "Python projects, declarative automation, privacy, and interoperability." },
      { idRange: "32", title: "Professional Convergence", desc: "Architecture, operations, security, FinOps, and technical defense in a final capstone." },
    ],
    proofModules: "versioned modules",
    proofLessons: "lessons",
    proofHours: "estimated hours",
    methodKicker: "Methodology",
    methodTitle: "Study, practice, measure, and review.",
    capabilities: [
      { number: "01", title: "Applied lessons", copy: "Concepts, design choices, SQL/PySpark code examples, and active recall checkpoints in every module." },
      { number: "02", title: "Practical labs", copy: "Guided exercises with clear goals, environment specs, steps, starter code, checks, and expected evidence." },
      { number: "03", title: "Assessments", copy: "Module quizzes and internal practice exams scored on the server without exposing answers to the browser." },
      { number: "04", title: "Continuity", copy: "Structured progress, private session recovery, export, and deletion options whenever you decide to save." },
    ],
    integrityKicker: "Verifiable trust",
    integrityTitle: "Traceable content, no fake testimonials.",
    integrityBody: "Code is open source, and curriculum material maintains explicit sources, version labels, and review dates. Practice exams are internal tools and do not guarantee external pass rates. Found an issue? Report it on our public repository.",
    editorialVersion: "Editorial version",
    lastReview: "Last review",
    externalValidation: "External validation",
    externalValidationVal: "Not claimed",
    ctaKicker: "Next step",
    ctaTitle: "Start with a clear path and save progress only when you need to.",
    startFirstLessonBtn: "Start the first lesson",
    exploreRoutesBtn: "Explore learning paths",
  },
};

export default async function RootPage() {
  const locale = await getRequestLocale();
  const text = homeText[locale];
  const reviewDate = locale === "en" ? CONTENT_REVIEW_DATE_EN : CONTENT_REVIEW_DATE;
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? text.accountProgress : text.accountSave;
  const sampleModule = localizeModule(modules[0], locale);
  const sampleLesson = sampleModule.lessons[0];
  const sampleQuestion = sampleModule.quiz[0];
  const sampleLessonHref = `/curso/${sampleModule.slug}/${sampleLesson.id}`;
  const firstLessonMinutes = Math.max(12, Math.round((sampleModule.minutes * 0.5) / sampleModule.lessons.length));
  const recommendedPath = localizeLearningPathProfile(learningPathProfiles.find((path) => path.id === "databricks-cero") ?? learningPathProfiles[0], locale);

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel} active="home" locale={locale}>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero">
          <div className="public-hero-copy">
            <h1>{text.heroTitlePrefix} <span>{text.heroTitleAccent}</span></h1>
            <p className="public-lead">
              {text.heroLead}
            </p>
            <dl className="public-next-step" aria-label={locale === "en" ? "First lesson details" : "Datos de la primera lección"}>
              <div><dt>{text.firstLesson}</dt><dd>{firstLessonMinutes} min {locale === "en" ? "approx." : "aprox."}</dd></div>
              <div><dt>{text.level}</dt><dd>{text.levelValue}</dd></div>
            </dl>
            <div className="public-actions">
              <a className="public-primary" href={sampleLessonHref}>{text.startLesson}<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href="/ruta">{text.exploreRoutes}</a>
            </div>
            <p className="public-trust">
              {text.trust}
            </p>
          </div>
        </section>

        <section id="objetivos" className="public-section public-goals" aria-labelledby="goals-heading">
          <div className="public-section-heading">
            <h2 id="goals-heading">{text.goalsTitle}</h2>
            <p>{text.goalsDesc}</p>
          </div>
          <article className="public-recommended-route">
            <span>{recommendedPath.shortTitle}</span>
            <h3>{recommendedPath.title}</h3>
            <p>{recommendedPath.objective}</p>
            <dl>
              <div><dt>{text.recommendedRouteForWhom}</dt><dd>{recommendedPath.forWhom}</dd></div>
              <div><dt>{locale === "en" ? "Effort" : "Esfuerzo"}</dt><dd>{text.recommendedRouteEffort(firstLessonMinutes, recommendedPath.durationLabel)}</dd></div>
              <div><dt>{text.recommendedRouteOutcome}</dt><dd>{recommendedPath.expectedOutcome}</dd></div>
            </dl>
            <div className="public-actions">
              <a className="public-primary" href={sampleLessonHref}>{text.startFirstLessonBtn}<span aria-hidden="true">→</span></a>
              <a className="public-secondary" href={recommendedPath.href}>{locale === "en" ? "View path from scratch" : "Ver ruta desde cero"}</a>
            </div>
          </article>
        </section>

        <section className="public-section public-demo" aria-labelledby="demo-heading">
          <div className="public-section-heading">
            <h2 id="demo-heading">{text.howToStudyTitle}</h2>
            <p>{text.howToStudyDesc}</p>
          </div>
          <div className="public-demo-grid">
            <article>
              <span>{text.demoLesson}</span>
              <h3>{sampleLesson.title}</h3>
              <p>{sampleLesson.explanation[0]}</p>
              <pre tabIndex={0}><code>{sampleLesson.example.code}</code></pre>
            </article>
            <article>
              <span>{text.demoLab}</span>
              <h3>{sampleModule.lab.title}</h3>
              <p>{sampleModule.lab.goal}</p>
              <ol>{sampleModule.lab.steps.slice(0, 3).map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
            <article>
              <span>{text.demoQuiz}</span>
              <h3>{sampleQuestion.domain}</h3>
              <p>{sampleQuestion.question}</p>
              <ul>{sampleQuestion.options.slice(0, 3).map((option) => <li key={option}>{option}</li>)}</ul>
            </article>
          </div>
        </section>

        <section className="public-section public-program" aria-labelledby="program-heading">
          <div className="public-section-heading">
            <h2 id="program-heading">{text.programTitle}</h2>
            <p>{text.programDesc}</p>
          </div>
          <ol className="public-phase-list">
            {text.phases.map((phase) => (
              <li key={phase.idRange}>
                <span>{phase.idRange}</span>
                <div>
                  <b>{phase.title}</b>
                  <p>{phase.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="public-section public-integrity" aria-labelledby="integrity-heading">
          <div><h2 id="integrity-heading">{text.integrityTitle}</h2></div>
          <div>
            <p>{text.integrityBody} <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">{locale === "en" ? "our public repository" : "el repositorio público"}</a>.</p>
            <dl><div><dt>{text.editorialVersion}</dt><dd>{CONTENT_VERSION_LABEL}</dd></div><div><dt>{text.lastReview}</dt><dd>{reviewDate}</dd></div><div><dt>{text.externalValidation}</dt><dd>{text.externalValidationVal}</dd></div></dl>
          </div>
        </section>

        <section className="public-cta" aria-labelledby="cta-heading">
          <h2 id="cta-heading">{text.ctaTitle}</h2>
          <div className="public-actions"><a className="public-primary" href={sampleLessonHref}>{text.startFirstLessonBtn}<span aria-hidden="true">→</span></a><a className="public-secondary" href="/ruta">{text.exploreRoutesBtn}</a></div>
        </section>
      </main>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { modules } from "../course-data";
import { learningPathProfiles, modulesForPath } from "../learning-paths";
import { localizeModule } from "../i18n/curriculum";
import { localizeDurationMethod, localizeLearningPathProfile, localizeLearningPathProfiles } from "../i18n/learning-paths";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Learning Path" : "Ruta de aprendizaje",
    description: locale === "en"
      ? "Choose a practical path to learn Databricks data engineering or prepare Associate and Professional."
      : "Elige una ruta práctica para aprender ingeniería de datos con Databricks o preparar Associate y Professional.",
    alternates: { canonical: "/ruta" },
    openGraph: {
      title: locale === "en" ? "Lakehouse Lab Path" : "Ruta Lakehouse Lab",
      description: locale === "en"
        ? "Goal-based entry points: Associate, Professional, Databricks from scratch, streaming, CDC, and labs."
        : "Entradas por objetivo: Associate, Professional, Databricks desde cero, streaming, CDC y laboratorios.",
      url: "/ruta",
    },
  };
}

const routeText: Record<Locale, {
  kicker: string;
  title: string;
  lead: string;
  recommendation: string;
  forWhom: string;
  firstAction: string;
  register: string;
  registerValue: string;
  start: string;
  viewFundamentals: string;
  changeGoal: string;
  groups: [string, string, string];
  prereqs: string;
  duration: string;
  modulesIncluded: string;
  modules: string;
  expectedOutcome: string;
  durationKicker: string;
  durationTitle: string;
  durationBody: string;
}> = {
  es: {
    kicker: "Ruta de aprendizaje",
    title: "Empieza desde cero si no sabes qué elegir.",
    lead: "La recomendación inicial es leer la primera lección de fundamentos. Después puedes cambiar de objetivo hacia certificación, streaming, CDC o laboratorios.",
    recommendation: "Recomendación",
    forWhom: "Para quien",
    firstAction: "Primera accion",
    register: "Registro",
    registerValue: "No obligatorio para leer",
    start: "Empezar por la primera leccion",
    viewFundamentals: "Ver modulos de fundamentos",
    changeGoal: "Cambiar objetivo",
    groups: ["Aprender desde cero", "Preparar una certificacion", "Profundizar en un area concreta"],
    prereqs: "Conocimientos previos",
    duration: "Duracion estimada",
    modulesIncluded: "Modulos incluidos",
    modules: "modulos",
    expectedOutcome: "Ver resultado esperado",
    durationKicker: "Criterio de duracion",
    durationTitle: "Estimaciones, no garantías.",
    durationBody: "El tiempo real depende de experiencia previa, entorno disponible, profundidad de ejecución del laboratorio y repaso necesario después de las evaluaciones.",
  },
  en: {
    kicker: "Learning path",
    title: "Start from scratch if you are unsure what to choose.",
    lead: "The initial recommendation is to read the first fundamentals lesson. After that, you can switch toward certification, streaming, CDC, or labs.",
    recommendation: "Recommendation",
    forWhom: "Target audience",
    firstAction: "First action",
    register: "Sign-up",
    registerValue: "Not required for reading",
    start: "Start with the first lesson",
    viewFundamentals: "View fundamentals modules",
    changeGoal: "Change goal",
    groups: ["Learn from scratch", "Prepare a certification", "Go deeper in one area"],
    prereqs: "Prerequisites",
    duration: "Estimated duration",
    modulesIncluded: "Included modules",
    modules: "modules",
    expectedOutcome: "View expected outcome",
    durationKicker: "Duration method",
    durationTitle: "Estimates, not guarantees.",
    durationBody: "Actual time depends on prior experience, available environment, lab depth, and the review needed after assessments.",
  },
};

export default async function RutaPage() {
  const locale = await getRequestLocale();
  const text = routeText[locale];
  const firstModule = localizeModule(modules[0], locale);
  const firstLesson = firstModule.lessons[0];
  const firstLessonHref = `/curso/${firstModule.slug}/${firstLesson.id}`;
  const firstLessonMinutes = Math.max(12, Math.round((firstModule.minutes * 0.5) / firstModule.lessons.length));
  const localizedPaths = localizeLearningPathProfiles(locale);
  const recommendedPath = localizeLearningPathProfile(learningPathProfiles.find((path) => path.id === "databricks-cero") ?? learningPathProfiles[0], locale);
  const groupedPaths = [
    { title: text.groups[0], paths: localizedPaths.filter((path) => path.id === "databricks-cero") },
    { title: text.groups[1], paths: localizedPaths.filter((path) => path.id === "associate" || path.id === "professional") },
    { title: text.groups[2], paths: localizedPaths.filter((path) => path.id === "streaming-cdc" || path.id === "laboratorios") },
  ].filter((group) => group.paths.length);

  return <PublicShell active="route" locale={locale}>
    <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
      <section className="public-cert-hero" aria-labelledby="route-heading">
        <p className="public-kicker">{text.kicker}</p>
        <h1 id="route-heading">{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>
      </section>

      <section aria-labelledby="recommended-route-heading">
        <article className="public-recommended-route">
          <span>{text.recommendation}</span>
          <h2 id="recommended-route-heading">{recommendedPath.title}</h2>
          <p>{recommendedPath.objective}</p>
          <dl>
            <div><dt>{text.forWhom}</dt><dd>{recommendedPath.forWhom}</dd></div>
            <div><dt>{text.firstAction}</dt><dd>{firstLesson.title} · {firstLessonMinutes} min {locale === "en" ? "approx." : "aprox."}</dd></div>
            <div><dt>{text.register}</dt><dd>{text.registerValue}</dd></div>
          </dl>
          <div className="public-actions">
            <a className="public-primary" href={firstLessonHref}>{text.start}<span aria-hidden="true">→</span></a>
            <a className="public-secondary" href={recommendedPath.href}>{text.viewFundamentals}</a>
          </div>
        </article>
      </section>

      <details className="public-route-disclosure">
        <summary>{text.changeGoal}</summary>
        <div className="public-route-groups">
          {groupedPaths.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              <div className="public-route-grid">
                {group.paths.map((path) => {
                  const selectedModules = modulesForPath(path).map((module) => localizeModule(module, locale));
                  return <article key={path.id}>
                    <header>
                      <span>{path.shortTitle}</span>
                      <h3>{path.title}</h3>
                      <p>{path.objective}</p>
                    </header>
                    <dl>
                      <div><dt>{text.prereqs}</dt><dd>{path.prerequisites}</dd></div>
                      <div><dt>{text.duration}</dt><dd>{path.durationLabel}</dd></div>
                      <div><dt>{text.modulesIncluded}</dt><dd>{path.moduleCount} {text.modules}: {selectedModules.slice(0, 4).map((module) => module.short).join(", ")}{selectedModules.length > 4 ? "..." : ""}</dd></div>
                    </dl>
                    <details className="public-card-details">
                      <summary>{text.expectedOutcome}</summary>
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
        <div><p className="public-kicker">{text.durationKicker}</p><h2 id="duration-heading">{text.durationTitle}</h2></div>
        <div><p>{localizeDurationMethod(locale)}</p><p>{text.durationBody}</p></div>
      </section>
    </main>
  </PublicShell>;
}

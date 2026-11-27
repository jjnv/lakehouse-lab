import Link from "next/link";
import PublicShell from "./components/public/PublicShell";
import { modules } from "./course-data";
import { getRequestLocale } from "./i18n/server";
import { localizeModule } from "./i18n/curriculum";
import type { Locale } from "./i18n/config";
import { getSessionUser, sessionStartPath } from "./session-auth";

export const dynamic = "force-dynamic";

const homeText: Record<Locale, {
  accountProgress: string;
  accountSave: string;
  kicker: string;
  title: string;
  lead: string;
  layersCaption: string;
  layers: { name: string; body: string; tone: string }[];
  firstLessonLabel: string;
  facts: { modules: string; glossary: string; languages: string; price: string; priceValue: string };
  duration: (minutes: number) => string;
  level: string;
  startLesson: string;
  chooseGoal: string;
  independence: string;
  fromScratch: string;
  fromScratchLink: string;
  howHeading: string;
  howSteps: { href: string; title: string; body: string }[];
}> = {
  es: {
    accountProgress: "Mi progreso",
    accountSave: "Guardar progreso",
    kicker: "Lakehouse Lab · Ingeniería de datos",
    title: "Empieza con fundamentos de ingeniería de datos.",
    lead: "Empieza con una lección breve sobre la arquitectura lakehouse y decide el siguiente paso después de leerla.",
    duration: (minutes) => `${minutes} min aprox.`,
    level: "Nivel inicial",
    layersCaption: "Lo que vas a entender: las capas de un lakehouse",
    layers: [
      { name: "Gobierno", body: "Catálogo, permisos y linaje", tone: "governance" },
      { name: "Gold", body: "Métricas listas para negocio", tone: "gold" },
      { name: "Silver", body: "Datos limpios y validados", tone: "silver" },
      { name: "Bronze", body: "Ingesta en bruto, sin perder nada", tone: "bronze" },
      { name: "Almacenamiento abierto", body: "Archivos Delta y Parquet", tone: "storage" },
    ],
    firstLessonLabel: "Primera lección",
    facts: { modules: "Módulos", glossary: "Términos de glosario", languages: "Idiomas", price: "Lectura", priceValue: "Libre" },
    startLesson: "Empezar la primera lección",
    chooseGoal: "Elegir otro objetivo",
    independence: "Proyecto independiente de Databricks. Puedes leer sin registrarte.",
    fromScratch: "¿Empiezas desde cero?",
    fromScratchLink: "Lee antes los fundamentos de datos",
    howHeading: "Cómo aprender aquí",
    howSteps: [
      { href: "/fundamentos", title: "Fundamentos", body: "Datos, archivos, SQL, Spark y lakehouse explicados desde cero, con analogías y autocomprobación." },
      { href: "/catalogo", title: "Temario por módulos", body: "32 módulos con lecciones ordenadas: lo esencial, la idea, cómo funciona, un caso práctico y código." },
      { href: "/glosario", title: "Glosario", body: "Más de 130 términos con definición llana, ejemplo y términos relacionados, en español e inglés." },
      { href: "/simulacros", title: "Practica", body: "Laboratorios guiados y simulacros para comprobar lo aprendido antes de certificarte." },
    ],
  },
  en: {
    accountProgress: "My progress",
    accountSave: "Save progress",
    kicker: "Lakehouse Lab · Data engineering",
    title: "Start with data engineering fundamentals.",
    lead: "Start with a short lesson on lakehouse architecture, then choose your next step after reading it.",
    duration: (minutes) => `About ${minutes} min`,
    level: "Beginner level",
    layersCaption: "What you will understand: the layers of a lakehouse",
    layers: [
      { name: "Governance", body: "Catalog, permissions and lineage", tone: "governance" },
      { name: "Gold", body: "Business-ready metrics", tone: "gold" },
      { name: "Silver", body: "Clean, validated data", tone: "silver" },
      { name: "Bronze", body: "Raw ingestion, nothing lost", tone: "bronze" },
      { name: "Open storage", body: "Delta and Parquet files", tone: "storage" },
    ],
    firstLessonLabel: "First lesson",
    facts: { modules: "Modules", glossary: "Glossary terms", languages: "Languages", price: "Reading", priceValue: "Free" },
    startLesson: "Start the first lesson",
    chooseGoal: "Choose another goal",
    independence: "Independent from Databricks. You can read without signing up.",
    fromScratch: "Starting from scratch?",
    fromScratchLink: "Read the data foundations first",
    howHeading: "How to learn here",
    howSteps: [
      { href: "/fundamentos", title: "Foundations", body: "Data, files, SQL, Spark and the lakehouse explained from scratch, with analogies and self-checks." },
      { href: "/catalogo", title: "Curriculum by module", body: "32 modules with ordered lessons: the essentials, the idea, how it works, a worked example and code." },
      { href: "/glosario", title: "Glossary", body: "Over 130 terms with a plain definition, an example and related terms, in Spanish and English." },
      { href: "/simulacros", title: "Practice", body: "Guided labs and practice exams to check what you learned before certifying." },
    ],
  },
};

export default async function RootPage() {
  const locale = await getRequestLocale();
  const text = homeText[locale];
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? text.accountProgress : text.accountSave;
  const firstModule = localizeModule(modules[0], locale);
  const firstLesson = firstModule.lessons[0];
  const firstLessonHref = `/curso/${firstModule.slug}/${firstLesson.id}`;
  const firstLessonMinutes = Math.max(12, Math.round((firstModule.minutes * 0.5) / firstModule.lessons.length));

  return (
    <PublicShell accountHref={accountHref} accountLabel={accountLabel} active="home" locale={locale}>
      <main id="public-main" className="public-document-main public-home-main" tabIndex={-1}>
        <section className="public-home-hero" aria-labelledby="home-heading">
          <div className="public-home-copy">
            <p className="public-kicker">{text.kicker}</p>
            <h1 id="home-heading">{text.title}</h1>
            <p className="public-document-lead">{text.lead}</p>
            <div className="public-actions">
              <Link className="public-primary" href={firstLessonHref}>{text.startLesson}<span aria-hidden="true">→</span></Link>
              <Link className="public-secondary" href="/ruta">{text.chooseGoal}</Link>
            </div>
            <p className="public-trust">{text.fromScratch} <Link href="/fundamentos">{text.fromScratchLink}</Link>.</p>
          </div>
          <figure className="public-home-visual">
            <figcaption>{text.layersCaption}</figcaption>
            <ol className="public-home-layers">
              {text.layers.map((layer) => (
                <li key={layer.name} data-tone={layer.tone}>
                  <strong>{layer.name}</strong>
                  <span>{layer.body}</span>
                </li>
              ))}
            </ol>
            <Link className="public-home-lesson" href={firstLessonHref}>
              <small>{text.firstLessonLabel} · {text.duration(firstLessonMinutes)} · {text.level}</small>
              <strong>{firstLesson.title}</strong>
            </Link>
          </figure>
        </section>
        <dl className="public-home-facts">
          <div><dt>{text.facts.modules}</dt><dd>{modules.length}</dd></div>
          <div><dt>{text.facts.glossary}</dt><dd>130+</dd></div>
          <div><dt>{text.facts.languages}</dt><dd>ES · EN</dd></div>
          <div><dt>{text.facts.price}</dt><dd>{text.facts.priceValue}</dd></div>
        </dl>
        <section className="public-home-steps" aria-labelledby="home-steps-heading">
          <h2 id="home-steps-heading">{text.howHeading}</h2>
          <ol>
            {text.howSteps.map((step, index) => (
              <li key={step.href}>
                <Link href={step.href}>
                  <span className="public-home-step-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                  <span>{step.body}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <p className="public-trust public-home-independence">{text.independence}</p>
      </main>
    </PublicShell>
  );
}

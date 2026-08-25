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
  title: string;
  lead: string;
  duration: (minutes: number) => string;
  level: string;
  startLesson: string;
  chooseGoal: string;
  independence: string;
}> = {
  es: {
    accountProgress: "Mi progreso",
    accountSave: "Guardar progreso",
    title: "Empieza con fundamentos de ingeniería de datos.",
    lead: "Empieza con una lección breve sobre la arquitectura lakehouse y decide el siguiente paso después de leerla.",
    duration: (minutes) => `${minutes} min aprox.`,
    level: "Nivel inicial",
    startLesson: "Empezar la primera lección",
    chooseGoal: "Elegir otro objetivo",
    independence: "Proyecto independiente de Databricks. Puedes leer sin registrarte.",
  },
  en: {
    accountProgress: "My progress",
    accountSave: "Save progress",
    title: "Start with data engineering fundamentals.",
    lead: "Start with a short lesson on lakehouse architecture, then choose your next step after reading it.",
    duration: (minutes) => `About ${minutes} min`,
    level: "Beginner level",
    startLesson: "Start the first lesson",
    chooseGoal: "Choose another goal",
    independence: "Independent from Databricks. You can read without signing up.",
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
      <main id="public-main" className="public-document-main public-cert-main" tabIndex={-1}>
        <section className="public-cert-hero" aria-labelledby="home-heading">
          <h1 id="home-heading">{text.title}</h1>
          <p className="public-document-lead">{text.lead}</p>
          <p className="public-trust">{text.duration(firstLessonMinutes)} · {text.level}</p>
          <div className="public-actions">
            <Link className="public-primary" href={firstLessonHref}>{text.startLesson}<span aria-hidden="true">→</span></Link>
            <Link className="public-secondary" href="/ruta">{text.chooseGoal}</Link>
          </div>
          <p className="public-trust">{text.independence}</p>
        </section>
      </main>
    </PublicShell>
  );
}

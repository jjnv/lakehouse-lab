import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "../../../components/enterprise/AppShell";
import { getOptionalEnterprisePageContext } from "../../../components/enterprise/getShellContext";
import IncidentWorkspace from "../../../components/playground/IncidentWorkspace";
import { getRequestLocale } from "../../../i18n/server";
import { lessonLinks } from "../../curriculum-links";
import { PLAYGROUND_UI } from "../../i18n/ui";
import { scenarioById } from "../../scenarios";
import "../../playground.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const scenario = scenarioById(id);
  if (!scenario) return {};
  const locale = await getRequestLocale();
  const copy = scenario.copy[locale];
  return { title: `${copy.title} · Playground`, description: copy.summary, alternates: { canonical: `/playground/scenario/${id}` } };
}

export default async function PlaygroundScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = scenarioById(id);
  if (!scenario) notFound();
  const context = await getOptionalEnterprisePageContext();
  const locale = context.locale;
  const copy = scenario.copy[locale];
  const ui = PLAYGROUND_UI[locale];
  const definition = scenario.definition;
  const lessons = lessonLinks(definition.curriculum, locale);
  const authenticated = Boolean(context.learner);
  return <AppShell active="playground" title={copy.title} variant={authenticated ? "workspace" : "explore"} authenticated={authenticated} brand={context.brand} userDisplayName={context.userDisplayName} locale={locale}>
    <div className="ent-page-stack pg-page">
      <nav className="ent-breadcrumbs pg-breadcrumbs" aria-label={locale === "en" ? "Breadcrumbs" : "Migas de pan"}><a href="/playground">Playground</a> <span aria-hidden="true">/</span> <span aria-current="page">{copy.title}</span></nav>
      <header className="pg-scenario-head">
        <p className="ent-kicker">{ui.categories[definition.category]} · {ui.difficulties[definition.difficulty]} · <span className="pg-badge">{ui.executionKinds[definition.executionKind]}</span></p>
        <p className="pg-lead">{copy.summary}</p>
      </header>
      <IncidentWorkspace scenarioId={definition.id} locale={locale} authenticated={authenticated} lessons={lessons} />
      <details className="pg-metadata">
        <summary>{ui.labels.metadata}</summary>
        <dl>
          <div><dt>{ui.labels.version}</dt><dd>{definition.version.version}</dd></div>
          <div><dt>{ui.labels.reviewed}</dt><dd>{definition.version.reviewedAt}</dd></div>
          <div><dt>{ui.labels.reviewStatus}</dt><dd>{definition.version.reviewStatus}</dd></div>
          <div><dt>{ui.labels.authors}</dt><dd>{definition.version.authors.join(", ")}</dd></div>
          <div><dt>{ui.labels.technologies}</dt><dd>{definition.technologies.join(", ")}</dd></div>
          <div><dt>{ui.labels.compatibility}</dt><dd>{definition.compatibility}</dd></div>
        </dl>
        <h3>{ui.labels.sources}</h3>
        <ul>{definition.sources.map((source) => <li key={source.url}><a href={source.url} rel="noreferrer">{source.publisher}: {source.label}</a></li>)}</ul>
        <h3>{ui.labels.assumptions}</h3>
        <ul>{copy.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{ui.labels.limitations}</h3>
        <ul>{copy.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{ui.labels.lessons}</h3>
        <ul>{lessons.map((lesson) => <li key={lesson.href}><a href={lesson.href}>{lesson.label}</a></li>)}</ul>
      </details>
    </div>
  </AppShell>;
}

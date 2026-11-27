import type { Metadata } from "next";
import AppShell from "../components/enterprise/AppShell";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import PlaygroundResume from "../components/playground/PlaygroundResume";
import { getPlaygroundOverview } from "../enterprise/playground-service";
import { getRequestLocale } from "../i18n/server";
import { SKILL_LABELS, isSkillId } from "./domain/skills";
import { PLAYGROUND_ROADMAP, PLAYGROUND_UI } from "./i18n/ui";
import { PLAYGROUND_SCENARIOS } from "./scenarios";
import "./playground.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Data Engineering Playground",
    description: locale === "en"
      ? "Interactive production incident simulator for data engineers: investigate, decide, recover, and get an evidence-based postmortem."
      : "Simulador interactivo de incidencias de producción para Data Engineers: investiga, decide, recupera y recibe un post mortem basado en evidencias.",
    alternates: { canonical: "/playground" },
  };
}

export default async function PlaygroundPage() {
  const context = await getOptionalEnterprisePageContext();
  const locale = context.locale;
  const ui = PLAYGROUND_UI[locale];
  const label = ui.labels;
  const overview = context.learner ? await getPlaygroundOverview(context.learner) : null;
  const best = new Map<string, number>();
  const attempts = new Map<string, number>();
  for (const attempt of overview?.attempts ?? []) {
    best.set(attempt.scenarioId, Math.max(best.get(attempt.scenarioId) ?? 0, attempt.score));
    attempts.set(attempt.scenarioId, (attempts.get(attempt.scenarioId) ?? 0) + 1);
  }
  const authenticated = Boolean(context.learner);

  return <AppShell active="playground" title="Playground" variant={authenticated ? "workspace" : "explore"} authenticated={authenticated} brand={context.brand} userDisplayName={context.userDisplayName} locale={locale}>
    <div className="ent-page-stack pg-page">
      <section className="ent-page-intro">
        <div>
          <p className="ent-kicker">{label.heroKicker}</p>
          <h2>{label.heroTitle}</h2>
          <p>{label.heroLead}</p>
        </div>
      </section>
      <p className="pg-synthetic" role="note">{label.syntheticNotice}</p>

      <PlaygroundResume locale={locale} />

      <section className="ent-section" aria-labelledby="pg-incidents-heading">
        <div className="ent-section-heading"><div><h2 id="pg-incidents-heading">{label.incidents}</h2><p className="pg-muted">{label.incidentsLead}</p></div></div>
        <ol className="pg-scenarios">
          {PLAYGROUND_SCENARIOS.map(({ definition, copy }) => {
            const text = copy[locale];
            const score = best.get(definition.id);
            return <li key={definition.id}>
              <article>
                <p className="ent-kicker">{ui.categories[definition.category]} · {ui.difficulties[definition.difficulty]}</p>
                <h3><a href={`/playground/scenario/${definition.id}`}>{text.title}</a></h3>
                <p>{text.summary}</p>
                <p className="pg-tags">
                  <span className="pg-badge">{ui.executionKinds[definition.executionKind]}</span>
                  {definition.skills.map((skill) => <span key={skill}>{SKILL_LABELS[locale][skill]}</span>)}
                </p>
                {score !== undefined ? <p className="pg-muted">{label.best}: {score}/100 · {attempts.get(definition.id)} {label.attempts}</p> : null}
              </article>
            </li>;
          })}
        </ol>
      </section>

      <section className="ent-section" aria-labelledby="pg-skills-heading">
        <div className="ent-section-heading"><h2 id="pg-skills-heading">{label.skills}</h2></div>
        <p className="pg-muted">{label.skillsNote}</p>
        {overview && overview.skills.length ? <table className="pg-skills">
          <thead><tr><th scope="col">{label.skills}</th><th scope="col">{label.attempts}</th><th scope="col">{label.solved}</th><th scope="col">%</th></tr></thead>
          <tbody>{overview.skills.map((skill) => <tr key={skill.skillId}>
            <th scope="row">{isSkillId(skill.skillId) ? SKILL_LABELS[locale][skill.skillId] : skill.skillId}</th>
            <td>{skill.attempts}</td><td>{skill.solved}</td><td>{Math.round(skill.averageStrength * 100)}</td>
          </tr>)}</tbody>
        </table> : <p>{authenticated ? label.noHistory : label.saveNeedsSession}</p>}
        {overview && overview.attempts.length ? <>
          <h3>{label.recentHistory}</h3>
          <ul className="pg-history">{overview.attempts.slice(0, 8).map((attempt) => {
            const scenario = PLAYGROUND_SCENARIOS.find((item) => item.definition.id === attempt.scenarioId);
            return <li key={attempt.id}>{scenario?.copy[locale].title ?? attempt.scenarioId} · {ui.statuses[attempt.status]} · {attempt.score}/100 · {attempt.durationMinutes} {label.minutes}</li>;
          })}</ul>
        </> : null}
      </section>

      <section className="ent-section" aria-labelledby="pg-roadmap-heading">
        <div className="ent-section-heading"><h2 id="pg-roadmap-heading">{label.roadmap}</h2></div>
        <p className="pg-muted">{label.roadmapLead}</p>
        <ul className="pg-roadmap">{PLAYGROUND_ROADMAP[locale].map((item) => <li key={item.id}><span>{item.phase}</span> {item.title}</li>)}</ul>
      </section>
    </div>
  </AppShell>;
}

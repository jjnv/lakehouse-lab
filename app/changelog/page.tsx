import type { Metadata } from "next";
import PublicShell from "../components/public/PublicShell";
import { editorialChangelog } from "../editorial-model";

export const metadata: Metadata = {
  title: "Changelog editorial",
  description: "Historial público de cambios de contenido, metodología, privacidad y experiencia en Lakehouse Lab.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "Changelog editorial de Lakehouse Lab",
    description: "Cambios trazables del currículo y de la experiencia educativa.",
    url: "/changelog",
  },
};

export default function ChangelogPage() {
  return <PublicShell active="changelog">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Changelog editorial</p>
        <h1>Qué ha cambiado en el contenido.</h1>
        <p className="public-document-lead">Registro público de cambios relevantes. Cuando un cambio tenga issue o pull request asociado, se enlazará desde aquí.</p>
        <section className="public-changelog" aria-label="Cambios editoriales">
          {editorialChangelog.map((change) => (
            <article key={`${change.date}-${change.target}`}>
              <time dateTime={change.date}>{new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(`${change.date}T12:00:00`))}</time>
              <span>{change.type}</span>
              <h2>{change.target}</h2>
              <p>{change.description}</p>
              {change.reference ? <a href={change.reference} rel="noreferrer">Referencia</a> : <small>Sin issue o PR asociado todavía.</small>}
            </article>
          ))}
        </section>
      </article>
    </main>
  </PublicShell>;
}

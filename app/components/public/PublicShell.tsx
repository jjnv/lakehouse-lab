import type { ReactNode } from "react";
import Link from "next/link";
import { PROJECT_NAME, PROJECT_REPOSITORY_URL } from "../../project-info";

type PublicShellProps = {
  children: ReactNode;
  accountHref?: string;
  accountLabel?: string;
  active?: "about" | "privacy" | "terms";
};

export default function PublicShell({
  children,
  accountHref = "/inicio",
  accountLabel = "Entrar",
  active,
}: PublicShellProps) {
  return (
    <div className="public-site">
      <a className="public-skip" href="#public-main">Saltar al contenido</a>
      <header className="public-header">
        <Link className="public-brand" href="/" aria-label={`${PROJECT_NAME}, ir a la portada`}>
          <span className="public-brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>{PROJECT_NAME}</strong><small>Proyecto educativo independiente</small></span>
        </Link>
        <nav aria-label="Navegación pública">
          <Link href="/#programa">Programa</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo?view=resources">Notebooks</Link>
          <Link href="/acerca-de" aria-current={active === "about" ? "page" : undefined}>Proyecto</Link>
        </nav>
        <a className="public-header-action" href={accountHref}>{accountLabel}</a>
      </header>
      {children}
      <footer className="public-footer">
        <div>
          <Link className="public-brand" href="/">
            <span className="public-brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>{PROJECT_NAME}</strong><small>Aprendizaje abierto y verificable</small></span>
          </Link>
          <p>Proyecto personal e independiente. No está afiliado, patrocinado ni avalado por Databricks.</p>
        </div>
        <nav aria-label="Información del proyecto">
          <Link href="/acerca-de">Acerca del proyecto</Link>
          <Link href="/recuperar">Recuperar espacio</Link>
          <Link href="/privacidad" aria-current={active === "privacy" ? "page" : undefined}>Privacidad</Link>
          <Link href="/terminos" aria-current={active === "terms" ? "page" : undefined}>Términos</Link>
          {PROJECT_REPOSITORY_URL ? <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">Código en GitHub</a> : null}
        </nav>
      </footer>
    </div>
  );
}

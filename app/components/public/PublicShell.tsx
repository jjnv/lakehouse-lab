import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PROJECT_NAME, PROJECT_REPOSITORY_URL } from "../../project-info";

type PublicShellProps = {
  children: ReactNode;
  accountHref?: string;
  accountLabel?: string;
  active?:
    | "home"
    | "route"
    | "simulacros"
    | "catalog"
    | "resources"
    | "about"
    | "methodology"
    | "changelog"
    | "privacy"
    | "terms";
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
          <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
          <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong><small>Ingeniería de datos con Databricks</small></span>
        </Link>
        <nav aria-label="Navegación pública">
          <Link href="/ruta" aria-current={active === "route" ? "page" : undefined}>Ruta</Link>
          <Link href="/catalogo" aria-current={active === "catalog" ? "page" : undefined}>Temario</Link>
          <Link href="/simulacros" aria-current={active === "simulacros" ? "page" : undefined}>Simulacros</Link>
          <Link href="/recursos" aria-current={active === "resources" ? "page" : undefined}>Recursos</Link>
          <Link href={accountHref}>Mi progreso</Link>
        </nav>
        <a className="public-header-action" href={accountHref}>{accountLabel}</a>
      </header>
      {children}
      <footer className="public-footer">
        <div>
          <Link className="public-brand" href="/">
            <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
            <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong><small>Proyecto independiente</small></span>
          </Link>
          <p>Proyecto personal e independiente. No está afiliado, patrocinado ni avalado por Databricks.</p>
        </div>
        <nav aria-label="Información del proyecto">
          <Link href="/ruta">Ruta</Link>
          <Link href="/catalogo">Temario</Link>
          <Link href="/simulacros">Simulacros</Link>
          <Link href="/recursos">Recursos</Link>
          <Link href="/metodologia" aria-current={active === "methodology" ? "page" : undefined}>Metodología</Link>
          <Link href="/changelog" aria-current={active === "changelog" ? "page" : undefined}>Changelog</Link>
          <Link href="/associate">Associate</Link>
          <Link href="/professional">Professional</Link>
          <Link href="/acerca-de" aria-current={active === "about" ? "page" : undefined}>Acerca del proyecto</Link>
          <Link href="/recuperar">Recuperar espacio</Link>
          <Link href="/privacidad" aria-current={active === "privacy" ? "page" : undefined}>Privacidad</Link>
          <Link href="/terminos" aria-current={active === "terms" ? "page" : undefined}>Términos</Link>
          {PROJECT_REPOSITORY_URL ? <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">Código en GitHub</a> : null}
        </nav>
      </footer>
    </div>
  );
}

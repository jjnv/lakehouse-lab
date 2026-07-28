import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "../LanguageSwitcher";
import { PROJECT_NAME, PROJECT_REPOSITORY_URL } from "../../project-info";
import { publicShellText } from "../../i18n/dictionaries";
import { getRequestLocale } from "../../i18n/server";
import type { Locale } from "../../i18n/config";

type PublicShellProps = {
  children: ReactNode;
  accountHref?: string;
  accountLabel?: string;
  locale?: Locale;
  active?:
    | "home"
    | "route"
    | "simulacros"
    | "catalog"
    | "resources"
    | "glossary"
    | "about"
    | "methodology"
    | "changelog"
    | "privacy"
    | "terms";
};

export default async function PublicShell({
  children,
  accountHref = "/inicio",
  accountLabel,
  locale: providedLocale,
  active,
}: PublicShellProps) {
  const locale = providedLocale ?? await getRequestLocale();
  const text = publicShellText[locale];
  const effectiveAccountLabel = accountLabel ?? text.accountDefault;

  return (
    <div className="public-site">
      <a className="public-skip" href="#public-main">{text.skip}</a>
      <header className="public-header">
        <Link className="public-brand" href="/" aria-label={`${PROJECT_NAME}, ${locale === "en" ? "go to homepage" : "ir a la portada"}`}>
          <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
          <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong></span>
        </Link>
        <nav aria-label={text.publicNav}>
          <Link href="/ruta" aria-current={active === "route" ? "page" : undefined}>{text.links.route}</Link>
          <Link href="/catalogo" aria-current={active === "catalog" ? "page" : undefined}>{text.links.catalog}</Link>
          <Link href="/simulacros" aria-current={active === "simulacros" ? "page" : undefined}>{text.links.simulators}</Link>
          <Link href="/recursos" aria-current={active === "resources" ? "page" : undefined}>{text.links.resources}</Link>
          <Link href="/glosario" aria-current={active === "glossary" ? "page" : undefined}>{text.links.glossary}</Link>
          <Link href={accountHref}>{text.progress}</Link>
        </nav>
        <LanguageSwitcher locale={locale} compact />
        <a className="public-header-action" href={accountHref}>{effectiveAccountLabel}</a>
      </header>
      {children}
      <footer className="public-footer">
        <div>
          <Link className="public-brand" href="/">
            <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
            <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong><small>{text.projectIndependent}</small></span>
          </Link>
          <p>{text.footerDisclaimer}</p>
        </div>
        <nav aria-label={text.projectInfo}>
          <Link href="/ruta">{text.links.route}</Link>
          <Link href="/catalogo">{text.links.catalog}</Link>
          <Link href="/simulacros">{text.links.simulators}</Link>
          <Link href="/recursos">{text.links.resources}</Link>
          <Link href="/glosario" aria-current={active === "glossary" ? "page" : undefined}>{text.links.glossary}</Link>
          <Link href="/metodologia" aria-current={active === "methodology" ? "page" : undefined}>{text.links.methodology}</Link>
          <Link href="/changelog" aria-current={active === "changelog" ? "page" : undefined}>Changelog</Link>
          <Link href="/associate">Associate</Link>
          <Link href="/professional">Professional</Link>
          <Link href="/acerca-de" aria-current={active === "about" ? "page" : undefined}>{text.links.about}</Link>
          <Link href="/recuperar">{text.links.recovery}</Link>
          <Link href="/privacidad" aria-current={active === "privacy" ? "page" : undefined}>{text.links.privacy}</Link>
          <Link href="/terminos" aria-current={active === "terms" ? "page" : undefined}>{text.links.terms}</Link>
          {PROJECT_REPOSITORY_URL ? <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">{text.links.github}</a> : null}
        </nav>
      </footer>
    </div>
  );
}

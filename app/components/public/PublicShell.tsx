"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "../LanguageSwitcher";
import { PROJECT_NAME, PROJECT_REPOSITORY_URL } from "../../project-info";
import { publicShellText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";

type PublicArea =
  | "home"
  | "route"
  | "simulacros"
  | "glossary"
  | "about"
  | "methodology"
  | "changelog"
  | "privacy"
  | "terms";

type PublicShellProps = {
  children: ReactNode;
  accountHref?: string;
  accountLabel?: string;
  locale?: Locale;
  active?: PublicArea;
};

function PublicNavigationLinks({ locale, active, onNavigate }: { locale: Locale; active?: PublicArea; onNavigate: () => void }) {
  return (
    <>
      <Link href="/ruta" aria-current={active === "route" ? "page" : undefined} onClick={onNavigate}>{locale === "en" ? "Learn" : "Aprender"}</Link>
      <Link href="/catalogo" onClick={onNavigate}>{locale === "en" ? "Curriculum" : "Temario"}</Link>
      <Link href="/simulacros" aria-current={active === "simulacros" ? "page" : undefined} onClick={onNavigate}>{locale === "en" ? "Practice exams" : "Simulacros"}</Link>
    </>
  );
}

export default function PublicShell({
  children,
  accountHref = "/inicio",
  accountLabel,
  locale = "es",
  active,
}: PublicShellProps) {
  const text = publicShellText[locale];
  const effectiveAccountLabel = accountLabel ?? text.accountDefault;
  const [mobileNavigation, setMobileNavigation] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 950px)");
    const updateNavigationMode = () => {
      const isMobile = media.matches;
      setMobileNavigation(isMobile);
      if (!isMobile && menuDialogRef.current?.open) menuDialogRef.current.close();
    };
    updateNavigationMode();
    media.addEventListener("change", updateNavigationMode);
    return () => media.removeEventListener("change", updateNavigationMode);
  }, []);

  const openMenu = () => {
    const dialog = menuDialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setMenuOpen(true);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  };

  const closeMenu = () => {
    const dialog = menuDialogRef.current;
    if (dialog?.open) {
      setMenuOpen(false);
      dialog.close();
    }
  };

  return (
    <div className="public-site">
      <a className="public-skip" href="#public-main">{text.skip}</a>
      <header className="public-header">
        <Link className="public-brand" href="/" aria-label={`${PROJECT_NAME}, ${locale === "en" ? "go to homepage" : "ir a la portada"}`}>
          <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
          <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong></span>
        </Link>

        {mobileNavigation ? (
          <button
            ref={menuButtonRef}
            className="public-secondary"
            type="button"
            aria-controls="public-navigation-dialog"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={openMenu}
          >
            {locale === "en" ? "Menu" : "Menú"}
          </button>
        ) : (
          <nav aria-label={text.publicNav}><PublicNavigationLinks locale={locale} active={active} onNavigate={closeMenu} /></nav>
        )}

        <a className="public-header-action" href={accountHref}>{effectiveAccountLabel}</a>

        {mobileNavigation ? (
          <dialog
            ref={menuDialogRef}
            id="public-navigation-dialog"
            className="public-recommended-route"
            aria-labelledby="public-navigation-title"
            hidden={!menuOpen}
            onCancel={(event) => {
              event.preventDefault();
              closeMenu();
            }}
            onClose={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
          >
            <div>
              <strong id="public-navigation-title">{text.publicNav}</strong>
              <button ref={closeButtonRef} className="public-secondary" type="button" onClick={closeMenu}>
                {locale === "en" ? "Close" : "Cerrar"}
              </button>
            </div>
            <nav aria-label={text.publicNav}><div><PublicNavigationLinks locale={locale} active={active} onNavigate={closeMenu} /></div></nav>
            <LanguageSwitcher locale={locale} compact />
          </dialog>
        ) : null}
      </header>
      {children}
      <footer className="public-footer">
        <div>
          <Link className="public-brand" href="/">
            <Image className="public-brand-logo public-brand-lockup" src="/logo-horizontal.svg" alt="" aria-hidden="true" width={169} height={40} />
            <span className="public-brand-copy"><strong>{PROJECT_NAME}</strong><small>{text.projectIndependent}</small></span>
          </Link>
          <p>{text.footerDisclaimer}</p>
          <LanguageSwitcher locale={locale} compact />
        </div>
        <nav aria-label={text.projectInfo}>
          <Link href="/metodologia">{text.links.methodology}</Link>
          <Link href="/glosario">{text.links.glossary}</Link>
          <Link href="/acerca-de">{locale === "en" ? "About" : "Acerca de"}</Link>
          <Link href="/privacidad">{text.links.privacy}</Link>
          <Link href="/terminos">{text.links.terms}</Link>
          {PROJECT_REPOSITORY_URL ? <a href={PROJECT_REPOSITORY_URL} rel="noreferrer">GitHub</a> : null}
        </nav>
      </footer>
    </div>
  );
}

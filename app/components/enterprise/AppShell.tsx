"use client";

/* eslint-disable @next/next/no-img-element -- Tenant logos are runtime-configured external assets. */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_BRAND_CONFIG } from "../../enterprise/brand";
import type { BrandConfig } from "../../enterprise/types";
import LanguageSwitcher from "../LanguageSwitcher";
import { appShellText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";
import CurriculumSearch from "./CurriculumSearch";

export type EnterpriseArea = "home" | "learning" | "catalog" | "resources" | "record" | "settings" | "simulators";
export type AppShellVariant = "explore" | "workspace" | "course";

type AppShellProps = {
  active: EnterpriseArea;
  title: string;
  children: ReactNode;
  variant: AppShellVariant;
  authenticated: boolean;
  brand?: BrandConfig;
  userDisplayName?: string;
  locale?: Locale;
};

let lastClientPath: string | null = null;

export default function AppShell({ active, title, children, variant, authenticated, brand = DEFAULT_BRAND_CONFIG, userDisplayName, locale = "es" }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavigation, setMobileNavigation] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const restoreDrawerFocusRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const updateNavigationMode = () => {
      const isMobile = media.matches;
      setMobileNavigation(isMobile);
      if (!isMobile) {
        restoreDrawerFocusRef.current = false;
        setDrawerOpen(false);
      }
    };
    updateNavigationMode();
    media.addEventListener("change", updateNavigationMode);
    return () => media.removeEventListener("change", updateNavigationMode);
  }, []);

  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (lastClientPath && lastClientPath !== currentPath) {
      requestAnimationFrame(() => document.getElementById("main-content")?.focus());
    }
    lastClientPath = currentPath;
  }, [title]);

  useEffect(() => {
    if (!drawerOpen || !mobileNavigation) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    const menuButton = menuButtonRef.current;
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreDrawerFocusRef.current = true;
        setDrawerOpen(false);
        return;
      }
      const focusable = drawer?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (restoreDrawerFocusRef.current) requestAnimationFrame(() => menuButton?.focus());
      restoreDrawerFocusRef.current = false;
    };
  }, [drawerOpen, mobileNavigation]);

  const closeDrawer = (restoreFocus: boolean) => {
    restoreDrawerFocusRef.current = restoreFocus;
    setDrawerOpen(false);
  };

  const shellStyle = {
    "--tenant-primary": brand.primaryColor,
    "--tenant-accent": brand.accentColor,
    "--tenant-on-primary": "#ffffff",
  } as CSSProperties;
  const accountLabel = userDisplayName || brand.organizationName;
  const brandHref = authenticated ? "/inicio" : "/";
  const accountHref = authenticated ? "/ajustes" : "/entrar?return_to=%2Finicio";
  const hasGlobalNavigation = variant !== "course";
  const text = appShellText[locale];
  const workspaceNavigation: Array<{ href: string; label: string; activeWhen: EnterpriseArea[] }> = [
    { href: "/inicio", label: text.nav.home, activeWhen: ["home"] },
    { href: "/mi-aprendizaje", label: locale === "en" ? "Plan" : "Plan", activeWhen: ["learning"] },
    { href: "/catalogo", label: text.nav.catalog, activeWhen: ["catalog", "resources"] },
    { href: "/expediente", label: locale === "en" ? "Results" : "Resultados", activeWhen: ["record"] },
  ];
  const exploreNavigation: Array<{ href: string; label: string; activeWhen: EnterpriseArea[] }> = [
    { href: "/ruta", label: locale === "en" ? "Learn" : "Aprender", activeWhen: ["learning"] },
    { href: "/catalogo", label: text.nav.catalog, activeWhen: ["catalog", "resources"] },
    { href: "/simulacros", label: text.nav.simulators, activeWhen: ["simulators"] },
  ];
  const navigation = variant === "workspace" ? workspaceNavigation : exploreNavigation;

  const secondaryNavigation = (
    <>
      <p>{text.account}</p>
      <a
        href={accountHref}
        aria-current={authenticated && active === "settings" ? "page" : undefined}
        aria-label={authenticated ? `${text.myAccount}: ${accountLabel}` : text.createWorkspaceAria}
        onClick={() => closeDrawer(false)}
      >
        {authenticated ? text.myAccount : text.createWorkspace}
      </a>
      <div className="ent-shell-language"><LanguageSwitcher locale={locale} compact /></div>
      <a href="/recuperar" onClick={() => closeDrawer(false)}>{locale === "en" ? "Recover workspace" : "Recuperar espacio"}</a>
      <p>{text.project}</p>
      {/* A document navigation intentionally resets the private workspace state. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" onClick={() => closeDrawer(false)}>{text.backHome}</a>
      <a href="/glosario" onClick={() => closeDrawer(false)}>{locale === "en" ? "Glossary" : "Glosario"}</a>
      <a href="/acerca-de" onClick={() => closeDrawer(false)}>{text.about}</a>
      <a href="/privacidad" onClick={() => closeDrawer(false)}>{text.privacy}</a>
    </>
  );

  return (
    <div className={`ent-shell ent-shell-${variant}`} style={shellStyle}>
      <a className="ent-skip-link" href="#main-content">{text.skip}</a>

      {hasGlobalNavigation ? <header className="ent-mobile-header" inert={drawerOpen && mobileNavigation ? true : undefined}>
        <a className="ent-mobile-brand" href={brandHref} aria-label={text.brandHome(brand.productName)}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt ?? brand.organizationName} /> : <span className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></span>}
          <span><b>{brand.organizationName}</b><small>{brand.productName}</small></span>
        </a>
        <button ref={menuButtonRef} className="ent-menu-button" type="button" aria-controls="enterprise-navigation" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={() => { restoreDrawerFocusRef.current = false; setDrawerOpen(true); }}>
          <span aria-hidden="true"><i /><i /><i /></span>
          <span>{text.mobileMenu}</span>
        </button>
      </header> : null}

      {hasGlobalNavigation && drawerOpen && mobileNavigation ? <button className="ent-drawer-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={() => closeDrawer(true)} /> : null}

      {hasGlobalNavigation ? <aside
        ref={drawerRef}
        id="enterprise-navigation"
        className={`ent-rail ${drawerOpen ? "is-open" : ""}`}
        aria-label={text.mainNav}
        aria-hidden={mobileNavigation && !drawerOpen ? true : undefined}
        aria-modal={drawerOpen && mobileNavigation ? true : undefined}
        inert={mobileNavigation && !drawerOpen ? true : undefined}
        role={drawerOpen && mobileNavigation ? "dialog" : undefined}
      >
        <div className="ent-rail-brand">
          <a href={brandHref} aria-label={text.brandHome(brand.productName)} onClick={() => closeDrawer(false)}>
            {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt ?? brand.organizationName} /> : <span className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></span>}
            <span><b>{brand.organizationName}</b><small>{brand.productName}</small></span>
          </a>
          <button ref={drawerCloseRef} className="ent-drawer-close" type="button" aria-label={locale === "en" ? "Close navigation menu" : "Cerrar menú de navegación"} onClick={() => closeDrawer(true)}>{text.closeMenu}</button>
        </div>

        <nav className="ent-nav" aria-label={locale === "en" ? "Main areas" : "Áreas principales"}>
          <p>{text.learning}</p>
          {navigation.map((item) => {
            const isCurrent = item.activeWhen.includes(active);
            return <a key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined} onClick={() => closeDrawer(false)}>{item.label}</a>;
          })}
        </nav>

        <nav className="ent-nav ent-nav-secondary" aria-label={locale === "en" ? "Settings" : "Configuración"}>
          {secondaryNavigation}
        </nav>
      </aside> : null}

      <div className="ent-workspace" style={variant === "course" ? { gridColumn: "1 / -1" } : undefined} inert={drawerOpen && mobileNavigation ? true : undefined}>
        <header className="ent-topbar">
          <div className="ent-topbar-title">
            {variant === "course" ? <a href="/catalogo" aria-label={locale === "en" ? "Back to curriculum" : "Volver al temario"}>←</a> : null}
            <h1>{title}</h1>
          </div>
          <CurriculumSearch locale={locale} />
          {variant === "course" ? <details className="ent-shell-secondary-menu">
            <summary>{text.mobileMenu}</summary>
            <nav className="ent-nav ent-nav-secondary" aria-label={locale === "en" ? "Account and project" : "Cuenta y proyecto"}>
              {secondaryNavigation}
            </nav>
          </details> : null}
        </header>
        <main id="main-content" className="ent-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

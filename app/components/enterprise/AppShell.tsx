"use client";

/* eslint-disable @next/next/no-img-element -- Tenant logos are runtime-configured external assets. */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_BRAND_CONFIG } from "../../enterprise/brand";
import type { BrandConfig } from "../../enterprise/types";
import LanguageSwitcher from "../LanguageSwitcher";
import { appShellText } from "../../i18n/dictionaries";
import type { Locale } from "../../i18n/config";
import CurriculumSearch from "./CurriculumSearch";

export type EnterpriseArea = "home" | "learning" | "catalog" | "resources" | "record" | "settings";

type AppShellProps = {
  active: EnterpriseArea;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  courseMode?: boolean;
  brand?: BrandConfig;
  userDisplayName?: string;
  publicMode?: boolean;
  locale?: Locale;
};

let lastClientPath: string | null = null;

export default function AppShell({ active, title, children, courseMode = false, brand = DEFAULT_BRAND_CONFIG, userDisplayName, publicMode = false, locale = "es" }: AppShellProps) {
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
  const brandHref = publicMode ? "/" : "/inicio";
  const text = appShellText[locale];
  const primaryNavigation: Array<{ href: string; label: string; short: string; area: EnterpriseArea }> = [
    { href: "/inicio", label: text.nav.home, short: text.short.home, area: "home" },
    { href: "/mi-aprendizaje", label: text.nav.route, short: text.short.route, area: "learning" },
    { href: "/catalogo", label: text.nav.catalog, short: text.short.catalog, area: "catalog" },
    { href: "/recursos", label: text.nav.resources, short: text.short.resources, area: "resources" },
    { href: "/expediente", label: text.nav.progress, short: text.short.progress, area: "record" },
  ];
  const navigation = publicMode
    ? [
        { href: "/ruta", label: text.nav.route, short: text.short.route, area: "learning" as const },
        { href: "/catalogo", label: text.nav.catalog, short: text.short.catalog, area: "catalog" as const },
        { href: "/simulacros", label: text.nav.simulators, short: text.short.simulators, area: "catalog" as const },
        { href: "/recursos", label: text.nav.resources, short: text.short.resources, area: "resources" as const },
      ]
    : primaryNavigation;

  return (
    <div className={`ent-shell ${courseMode ? "ent-shell-course" : ""}`} style={shellStyle}>
      <a className="ent-skip-link" href="#main-content">{text.skip}</a>

      <header className="ent-mobile-header" inert={drawerOpen && mobileNavigation ? true : undefined}>
        <a className="ent-mobile-brand" href={brandHref} aria-label={text.brandHome(brand.productName)}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt ?? brand.organizationName} /> : <span className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></span>}
          <span><b>{brand.organizationName}</b><small>{brand.productName}</small></span>
        </a>
        <LanguageSwitcher locale={locale} compact />
        <button ref={menuButtonRef} className="ent-menu-button" type="button" aria-controls="enterprise-navigation" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={() => { restoreDrawerFocusRef.current = false; setDrawerOpen(true); }}>
          <span aria-hidden="true"><i /><i /><i /></span>
          <span>{text.mobileMenu}</span>
        </button>
      </header>

      {drawerOpen && mobileNavigation ? <button className="ent-drawer-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={() => closeDrawer(true)} /> : null}

      <aside
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
            const isCurrent = active === item.area;
            return <a key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined} onClick={() => closeDrawer(false)}>{item.label}</a>;
          })}
        </nav>

        <nav className="ent-nav ent-nav-secondary" aria-label={locale === "en" ? "Settings" : "Configuración"}>
          <p>{publicMode ? text.participate : text.account}</p>
          {publicMode ? (
            <a href="/entrar?return_to=%2Finicio" onClick={() => closeDrawer(false)}>{text.createWorkspace}</a>
          ) : (
            <a href="/ajustes" aria-current={active === "settings" ? "page" : undefined} onClick={() => closeDrawer(false)}>{text.myAccount}</a>
          )}
          {/* A document navigation intentionally resets the private workspace state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" onClick={() => closeDrawer(false)}>{text.backHome}</a>
          <p>{text.project}</p>
          <a href="/glosario" onClick={() => closeDrawer(false)}>{locale === "en" ? "Glossary" : "Glosario"}</a>
          <a href="/acerca-de" onClick={() => closeDrawer(false)}>{text.about}</a>
          <a href="/privacidad" onClick={() => closeDrawer(false)}>{text.privacy}</a>
        </nav>
      </aside>

      <div className="ent-workspace" inert={drawerOpen && mobileNavigation ? true : undefined}>
        <header className="ent-topbar">
          <div className="ent-topbar-title"><h1>{title}</h1></div>
          <CurriculumSearch locale={locale} />
          <LanguageSwitcher locale={locale} compact />
          <a href={publicMode ? "/entrar?return_to=%2Finicio" : "/ajustes"} className="ent-topbar-account" aria-label={publicMode ? text.createWorkspaceAria : text.accountAria}><span aria-hidden="true">{publicMode ? "＋" : accountLabel.slice(0, 2).toLocaleUpperCase("es")}</span><b>{publicMode ? text.saveProgress : accountLabel}</b></a>
        </header>
        <main id="main-content" className="ent-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

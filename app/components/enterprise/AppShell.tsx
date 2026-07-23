"use client";

/* eslint-disable @next/next/no-img-element -- Tenant logos are runtime-configured external assets. */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_BRAND_CONFIG } from "../../enterprise/brand";
import type { BrandConfig } from "../../enterprise/types";
import CurriculumSearch from "./CurriculumSearch";

export type EnterpriseArea = "home" | "learning" | "catalog" | "record" | "settings";

type AppShellProps = {
  active: EnterpriseArea;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  courseMode?: boolean;
  brand?: BrandConfig;
  userDisplayName?: string;
  publicMode?: boolean;
};

const primaryNavigation: Array<{ href: string; label: string; short: string; area: EnterpriseArea }> = [
  { href: "/inicio", label: "Inicio", short: "IN", area: "home" },
  { href: "/mi-aprendizaje", label: "Mi aprendizaje", short: "AP", area: "learning" },
  { href: "/catalogo", label: "Catálogo", short: "CA", area: "catalog" },
  { href: "/expediente", label: "Expediente", short: "EX", area: "record" },
];
let lastClientPath: string | null = null;

export default function AppShell({ active, title, eyebrow = "Lakehouse Lab", children, courseMode = false, brand = DEFAULT_BRAND_CONFIG, userDisplayName, publicMode = false }: AppShellProps) {
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
  const organizationInitials = brand.organizationName.slice(0, 2).toLocaleUpperCase("es");
  const accountLabel = userDisplayName || brand.organizationName;
  const brandHref = publicMode ? "/" : "/inicio";
  const navigation = publicMode
    ? [
        { href: "/catalogo", label: "Módulos", short: "MO", area: "catalog" as const },
        { href: "/catalogo?view=resources", label: "Notebooks", short: "NB", area: "catalog" as const },
      ]
    : primaryNavigation;

  return (
    <div className={`ent-shell ${courseMode ? "ent-shell-course" : ""}`} style={shellStyle}>
      <a className="ent-skip-link" href="#main-content">Saltar al contenido</a>

      <header className="ent-mobile-header" inert={drawerOpen && mobileNavigation ? true : undefined}>
        <a className="ent-mobile-brand" href={brandHref} aria-label={`${brand.productName}, ir a Inicio`}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt ?? brand.organizationName} /> : <span className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></span>}
          <span><b>{brand.organizationName}</b><small>{brand.productName}</small></span>
        </a>
        <button ref={menuButtonRef} className="ent-menu-button" type="button" aria-controls="enterprise-navigation" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={() => { restoreDrawerFocusRef.current = false; setDrawerOpen(true); }}>
          <span aria-hidden="true"><i /><i /><i /></span>
          <span>Menú</span>
        </button>
      </header>

      {drawerOpen && mobileNavigation ? <button className="ent-drawer-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={() => closeDrawer(true)} /> : null}

      <aside
        ref={drawerRef}
        id="enterprise-navigation"
        className={`ent-rail ${drawerOpen ? "is-open" : ""}`}
        aria-label="Navegación de la plataforma"
        aria-hidden={mobileNavigation && !drawerOpen ? true : undefined}
        aria-modal={drawerOpen && mobileNavigation ? true : undefined}
        inert={mobileNavigation && !drawerOpen ? true : undefined}
        role={drawerOpen && mobileNavigation ? "dialog" : undefined}
      >
        <div className="ent-rail-brand">
          <a href={brandHref} aria-label={`${brand.productName}, ir a Inicio`} onClick={() => closeDrawer(false)}>
            {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt ?? brand.organizationName} /> : <span className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></span>}
            <span><b>{brand.organizationName}</b><small>{brand.productName}</small></span>
          </a>
          <button ref={drawerCloseRef} className="ent-drawer-close" type="button" aria-label="Cerrar menú de navegación" onClick={() => closeDrawer(true)}>Cerrar</button>
        </div>

        {publicMode ? (
          <div className="ent-tenant">
            <span aria-hidden="true">OS</span>
            <div><small>Acceso público</small><b>Contenido abierto</b></div>
          </div>
        ) : (
          <div className="ent-tenant">
            <span aria-hidden="true">{organizationInitials}</span>
            <div><small>Organización</small><b>{brand.organizationName}</b></div>
          </div>
        )}

        <nav className="ent-nav" aria-label="Áreas principales">
          <p>Aprendizaje</p>
          {navigation.map((item) => {
            const isCurrent = active === item.area && (!publicMode || item.href === "/catalogo");
            return <a key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined} onClick={() => closeDrawer(false)}><span aria-hidden="true">{item.short}</span>{item.label}</a>;
          })}
        </nav>

        <nav className="ent-nav ent-nav-secondary" aria-label="Configuración">
          <p>{publicMode ? "Participa" : "Cuenta"}</p>
          {publicMode ? (
            <a href="/entrar?return_to=%2Finicio" onClick={() => closeDrawer(false)}><span aria-hidden="true">＋</span>Crear espacio personal</a>
          ) : (
            <a href="/ajustes" aria-current={active === "settings" ? "page" : undefined} onClick={() => closeDrawer(false)}><span aria-hidden="true">AJ</span>Ajustes</a>
          )}
          {/* A document navigation intentionally resets the private workspace state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" onClick={() => closeDrawer(false)}><span aria-hidden="true">↖</span>Volver a la portada</a>
          <p>Proyecto</p>
          <a href="/acerca-de" onClick={() => closeDrawer(false)}><span aria-hidden="true">PR</span>Acerca de</a>
          <a href="/privacidad" onClick={() => closeDrawer(false)}><span aria-hidden="true">PV</span>Privacidad</a>
        </nav>

        <div className="ent-rail-note">
          <span aria-hidden="true" />
          <p><b>{publicMode ? "Exploración sin registro" : "Progreso persistente"}</b><small>{publicMode ? "Crea un espacio solo al guardar" : "Recuperable con tu código privado"}</small></p>
        </div>
      </aside>

      <div className="ent-workspace" inert={drawerOpen && mobileNavigation ? true : undefined}>
        <header className="ent-topbar">
          <div className="ent-topbar-title"><span>{eyebrow}</span><h1>{title}</h1></div>
          <CurriculumSearch />
          <a href={publicMode ? "/entrar?return_to=%2Finicio" : "/ajustes"} className="ent-topbar-account" aria-label={publicMode ? "Crear un espacio personal" : "Abrir ajustes del espacio"}><span aria-hidden="true">{publicMode ? "＋" : accountLabel.slice(0, 2).toLocaleUpperCase("es")}</span><b>{publicMode ? "Guardar progreso" : accountLabel}</b></a>
        </header>
        <main id="main-content" className="ent-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

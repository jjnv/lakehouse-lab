import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";
import { getRequestLocale } from "../i18n/server";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Curriculum" : "Temario",
    description: locale === "en"
      ? "Public Lakehouse Lab curriculum for Databricks Data Engineer Associate and Professional preparation."
      : "Temario público de Lakehouse Lab para preparar Databricks Data Engineer Associate y Professional.",
    alternates: { canonical: "/catalogo" },
    openGraph: {
      title: locale === "en" ? "Databricks Data Engineer Curriculum" : "Temario Databricks Data Engineer",
      description: locale === "en"
        ? "Modules, labs, and preparation resources for Associate and Professional."
        : "Módulos, laboratorios y recursos de preparación para Associate y Professional.",
      url: "/catalogo",
    },
  };
}

type CatalogSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogoPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  const requested = await searchParams;
  const legacyView = Array.isArray(requested.view) ? requested.view[0] : requested.view;
  if (legacyView === "resources") {
    const preserved = new URLSearchParams();
    for (const [key, value] of Object.entries(requested)) {
      if (key === "view" || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((item) => preserved.append(key, item));
      else preserved.set(key, value);
    }
    permanentRedirect(`/recursos${preserved.size ? `?${preserved.toString()}` : ""}`);
  }
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  const title = context.locale === "en" ? "Curriculum" : "Temario";
  return <AppShell active="catalog" title={title} brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale} variant={personalized ? "workspace" : "explore"} authenticated={personalized}><CatalogWorkspace modules={moduleSummaries(context.locale)} resources={communityResourceCatalog(context.locale)} surface="modules" personalized={personalized} locale={context.locale} /></AppShell>;
}

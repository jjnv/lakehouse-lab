import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";
import { getRequestLocale } from "../i18n/server";
import type { Metadata } from "next";

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

export default async function CatalogoPage() {
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  const title = context.locale === "en" ? "Curriculum" : "Temario";
  return <AppShell active="catalog" title={title} brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale} publicMode={!personalized}><CatalogWorkspace modules={moduleSummaries(context.locale)} resources={communityResourceCatalog(context.locale)} personalized={personalized} locale={context.locale} /></AppShell>;
}

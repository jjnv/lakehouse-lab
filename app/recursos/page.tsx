import type { Metadata } from "next";
import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";
import { getRequestLocale } from "../i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Resources" : "Recursos prácticos",
    description: locale === "en"
      ? "Reviewed resources and notebooks for practicing Databricks data engineering from Lakehouse Lab."
      : "Recursos y notebooks revisados para practicar ingeniería de datos con Databricks desde Lakehouse Lab.",
    alternates: { canonical: "/recursos" },
    openGraph: {
      title: locale === "en" ? "Lakehouse Lab practical resources" : "Recursos prácticos Lakehouse Lab",
      description: locale === "en"
        ? "Notebooks, projects, and complementary resources linked to the curriculum."
        : "Notebooks, proyectos y recursos complementarios enlazados con el currículo.",
      url: "/recursos",
    },
  };
}

export default async function RecursosPage() {
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  const title = context.locale === "en" ? "Resources" : "Recursos";
  return <AppShell active="resources" title={title} brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale} publicMode={!personalized}>
    <CatalogWorkspace modules={moduleSummaries(context.locale)} resources={communityResourceCatalog(context.locale)} personalized={personalized} initialView="resources" locale={context.locale} />
  </AppShell>;
}

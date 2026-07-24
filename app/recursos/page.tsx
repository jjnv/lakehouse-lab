import type { Metadata } from "next";
import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";

export const metadata: Metadata = {
  title: "Recursos prácticos",
  description: "Recursos y notebooks revisados para practicar ingeniería de datos con Databricks desde Lakehouse Lab.",
  alternates: { canonical: "/recursos" },
  openGraph: {
    title: "Recursos prácticos Lakehouse Lab",
    description: "Notebooks, proyectos y recursos complementarios enlazados con el currículo.",
    url: "/recursos",
  },
};

export default async function RecursosPage() {
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  return <AppShell active="resources" title="Recursos" brand={context.brand} userDisplayName={context.userDisplayName} publicMode={!personalized}>
    <CatalogWorkspace modules={moduleSummaries()} resources={communityResourceCatalog()} personalized={personalized} initialView="resources" />
  </AppShell>;
}

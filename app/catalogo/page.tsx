import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temario",
  description: "Temario público de Lakehouse Lab para preparar Databricks Data Engineer Associate y Professional.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: "Temario Databricks Data Engineer",
    description: "Módulos, laboratorios y recursos de preparación para Associate y Professional.",
    url: "/catalogo",
  },
};

export default async function CatalogoPage() {
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  return <AppShell active="catalog" title="Temario" brand={context.brand} userDisplayName={context.userDisplayName} publicMode={!personalized}><CatalogWorkspace modules={moduleSummaries()} resources={communityResourceCatalog()} personalized={personalized} /></AppShell>;
}

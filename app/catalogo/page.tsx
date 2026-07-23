import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";

export default async function CatalogoPage() {
  const context = await requireEnterprisePageContext("/catalogo");
  return <AppShell active="catalog" title="Catálogo" brand={context.brand} userDisplayName={context.userDisplayName}><CatalogWorkspace modules={moduleSummaries()} resources={communityResourceCatalog()} /></AppShell>;
}

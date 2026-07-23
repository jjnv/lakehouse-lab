import AppShell from "../components/enterprise/AppShell";
import CatalogWorkspace from "../components/enterprise/CatalogWorkspace";
import { getOptionalEnterprisePageContext } from "../components/enterprise/getShellContext";
import { communityResourceCatalog, moduleSummaries } from "../enterprise/curriculum";

export default async function CatalogoPage() {
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  return <AppShell active="catalog" title="Catálogo" brand={context.brand} userDisplayName={context.userDisplayName} publicMode={!personalized}><CatalogWorkspace modules={moduleSummaries()} resources={communityResourceCatalog()} personalized={personalized} /></AppShell>;
}

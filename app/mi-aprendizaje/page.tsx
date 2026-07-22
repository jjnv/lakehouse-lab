import AppShell from "../components/enterprise/AppShell";
import { MyLearningV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";

export default async function MiAprendizajePage() {
  const context = await requireEnterprisePageContext("/mi-aprendizaje");
  return <AppShell active="learning" title="Mi aprendizaje" brand={context.brand} userDisplayName={context.userDisplayName}><MyLearningV2 /></AppShell>;
}

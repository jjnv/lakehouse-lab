import AppShell from "../components/enterprise/AppShell";
import { LearnerSettingsV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";

export default async function AjustesPage() {
  const context = await requireEnterprisePageContext("/ajustes");
  return <AppShell active="settings" title="Ajustes" brand={context.brand} userDisplayName={context.userDisplayName}><LearnerSettingsV2 /></AppShell>;
}

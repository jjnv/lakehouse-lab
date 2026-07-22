import AppShell from "../components/enterprise/AppShell";
import { EmployeeHomeV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";

export default async function InicioPage() {
  const context = await requireEnterprisePageContext("/inicio");
  return <AppShell active="home" title="Inicio" brand={context.brand} userDisplayName={context.userDisplayName}><EmployeeHomeV2 /></AppShell>;
}

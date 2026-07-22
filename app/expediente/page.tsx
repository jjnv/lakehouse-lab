import AppShell from "../components/enterprise/AppShell";
import { LearningRecordV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";

export default async function ExpedientePage() {
  const context = await requireEnterprisePageContext("/expediente");
  return <AppShell active="record" title="Expediente" brand={context.brand} userDisplayName={context.userDisplayName}><LearningRecordV2 /></AppShell>;
}

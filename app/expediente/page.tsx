import AppShell from "../components/enterprise/AppShell";
import { LearningRecordV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultados",
  robots: { index: false, follow: false },
};

export default async function ExpedientePage() {
  const context = await requireEnterprisePageContext("/expediente");
  return <AppShell active="record" title="Resultados" brand={context.brand} userDisplayName={context.userDisplayName}><LearningRecordV2 /></AppShell>;
}

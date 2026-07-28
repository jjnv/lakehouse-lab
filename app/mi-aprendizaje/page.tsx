import AppShell from "../components/enterprise/AppShell";
import { MyLearningV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan",
  robots: { index: false, follow: false },
};

export default async function MiAprendizajePage() {
  const context = await requireEnterprisePageContext("/mi-aprendizaje");
  return <AppShell active="learning" title="Plan" brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale}><MyLearningV2 locale={context.locale} /></AppShell>;
}

import AppShell from "../components/enterprise/AppShell";
import { LearnerSettingsV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function AjustesPage() {
  const context = await requireEnterprisePageContext("/ajustes");
  return <AppShell active="settings" title="Mi cuenta" brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale}><LearnerSettingsV2 locale={context.locale} /></AppShell>;
}

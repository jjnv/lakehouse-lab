import AppShell from "../components/enterprise/AppShell";
import { EmployeeHomeV2 } from "../components/enterprise/PortalPagesV2";
import { requireEnterprisePageContext } from "../components/enterprise/getShellContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
  robots: { index: false, follow: false },
};

export default async function InicioPage() {
  const context = await requireEnterprisePageContext("/inicio");
  return <AppShell active="home" title="Inicio" brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale}><EmployeeHomeV2 locale={context.locale} /></AppShell>;
}

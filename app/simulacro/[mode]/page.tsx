import { notFound } from "next/navigation";
import AppShell from "../../components/enterprise/AppShell";
import SimulatorWorkspace from "../../components/enterprise/SimulatorWorkspace";
import { requireEnterprisePageContext } from "../../components/enterprise/getShellContext";

export default async function SimulacroPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (mode !== "associate" && mode !== "professional") notFound();
  const context = await requireEnterprisePageContext(`/simulacro/${mode}`);
  return <AppShell active="learning" eyebrow="Evaluación interna" title={`Simulacro ${mode === "associate" ? "Associate" : "Professional"}`} brand={context.brand} userDisplayName={context.userDisplayName}><SimulatorWorkspace mode={mode} /></AppShell>;
}

import AppShell from "../../components/enterprise/AppShell";
import CredentialView from "../../components/enterprise/CredentialView";
import { requireEnterprisePageContext } from "../../components/enterprise/getShellContext";

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireEnterprisePageContext(`/certificados/${encodeURIComponent(id)}`);
  return <AppShell active="record" title="Verificar certificado" brand={context.brand} userDisplayName={context.userDisplayName}><CredentialView credentialId={id} /></AppShell>;
}

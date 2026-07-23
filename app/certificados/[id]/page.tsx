import AppShell from "../../components/enterprise/AppShell";
import CredentialView from "../../components/enterprise/CredentialView";
import { DEFAULT_BRAND_CONFIG } from "../../enterprise/brand";
import { getPublicCredentialVerification } from "../../enterprise/learning-service";

export default async function CertificadoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ code?: string }> }) {
  const { id } = await params;
  const { code = "" } = await searchParams;
  const verification = await getPublicCredentialVerification(id, code);
  return <AppShell active="record" title="Verificar certificado" brand={DEFAULT_BRAND_CONFIG} publicMode><CredentialView verification={verification} /></AppShell>;
}

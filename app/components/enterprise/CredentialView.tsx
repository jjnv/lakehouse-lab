"use client";

import { useDashboard } from "./useDashboard";

export default function CredentialView({ credentialId }: { credentialId: string }) {
  const state = useDashboard();
  if (state.loading) return <div className="ent-state-card" role="status"><span className="ent-spinner" /><div><strong>Verificando credencial</strong><p>Consultando el registro autenticado.</p></div></div>;
  const credential = state.dashboard?.credential;
  if (!state.dashboard || !credential || credential.id !== credentialId) return <div className="ent-empty"><strong>Credencial no disponible</strong><p>No existe, no pertenece a este espacio o todavía no se ha emitido.</p><a className="ent-primary-action" href="/expediente">Volver al expediente</a></div>;
  return <div className="ent-page-stack ent-credential-view">
    <section className="ent-verification-status" role="status"><span aria-hidden="true">✓</span><div><p className="ent-kicker">Registro autenticado</p><h2>Credencial válida</h2><p>La credencial figura como emitida y pertenece al espacio personal activo.</p></div></section>
    <article className="ent-certificate-card" aria-labelledby="certificate-heading"><header><div className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></div><div><strong>{state.dashboard.brand.organizationName}</strong><span>Lakehouse Lab · Proyecto educativo independiente</span></div></header><div><p>Credencial de finalización</p><h2 id="certificate-heading">{credential.title}</h2><span>Otorgado a</span><strong>{state.dashboard.learner.displayName}</strong></div><dl><div><dt>Fecha de emisión</dt><dd>{new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(credential.issuedAt))}</dd></div><div><dt>Versión</dt><dd>{credential.contentVersion}</dd></div><div><dt>Número</dt><dd>{credential.certificateNumber}</dd></div></dl><footer>Credencial propia de Lakehouse Lab; no constituye una certificación oficial de Databricks ni una evaluación proctorizada.</footer></article>
    <div className="ent-certificate-actions"><a href="/expediente">← Volver al expediente</a><a className="ent-primary-action" href={credential.pdfHref}>Descargar PDF</a></div>
  </div>;
}

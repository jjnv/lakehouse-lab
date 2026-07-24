import type { PublicCredentialVerification } from "../../enterprise/contracts";

export default function CredentialView({ verification }: { verification: PublicCredentialVerification }) {
  if (verification.status === "unknown") {
    return <div className="ent-empty"><strong>No se pudo verificar la constancia interna</strong><p>El identificador o el código no coinciden con un registro público. Comprueba que el enlace esté completo.</p><a className="ent-primary-action" href="/catalogo">Explorar el temario</a></div>;
  }
  const active = verification.status === "issued";
  return <div className="ent-page-stack ent-credential-view">
    <section className={`ent-verification-status ${active ? "" : "is-revoked"}`} role="status"><span aria-hidden="true">{active ? "✓" : "!"}</span><div><p className="ent-kicker">Registro público</p><h2>{active ? "Constancia interna válida" : "Constancia interna revocada"}</h2><p>{active ? "El código coincide con una constancia interna activa emitida por Lakehouse Lab." : "La constancia existió, pero ya no está activa."}</p></div></section>
    <article className="ent-certificate-card" aria-labelledby="certificate-heading"><header><div className="ent-brand-mark" aria-hidden="true"><i /><i /><i /></div><div><strong>{verification.issuerName}</strong><span>Lakehouse Lab · Preparación independiente</span></div></header><div><p>Constancia interna de finalización</p><h2 id="certificate-heading">{verification.title}</h2><span>Otorgada a</span><strong>{verification.learnerDisplayName}</strong></div><dl><div><dt>Fecha de emisión</dt><dd>{verification.issuedAt ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(verification.issuedAt)) : "—"}</dd></div><div><dt>Versión</dt><dd>{verification.contentVersion}</dd></div><div><dt>Número</dt><dd>{verification.certificateNumber}</dd></div></dl><footer>Constancia propia de Lakehouse Lab; no constituye una certificación oficial de Databricks ni una evaluación proctorizada.</footer></article>
    <div className="ent-certificate-actions"><a href="/catalogo">← Explorar el temario</a><span>Verificación pública sin necesidad de iniciar sesión</span></div>
  </div>;
}

"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="ent-standalone-state" id="main-content">
    <section className="ent-state-card is-error" role="alert">
      <div><p className="ent-kicker">Error recuperable</p><h1>No pudimos preparar esta pantalla</h1><p>Tu progreso guardado no se ha eliminado. Puedes volver a intentarlo o regresar al catálogo.</p></div>
      <div className="ent-form-actions"><button type="button" className="ent-primary-action" onClick={reset}>Reintentar</button><a className="ent-secondary-action" href="/catalogo">Ir al catálogo</a></div>
    </section>
  </main>;
}

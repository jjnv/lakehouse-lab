export default function OfflinePage() {
  return <main className="ent-standalone-state" id="main-content">
    <section className="ent-empty">
      <p className="ent-kicker">Sin conexión</p>
      <h1>El contenido guardado en esta pestaña sigue disponible.</h1>
      <p>Para sincronizar progreso, iniciar evaluaciones o cargar notebooks necesitas recuperar la conexión.</p>
      <div className="ent-form-actions"><a className="ent-primary-action" href="/inicio">Volver a intentar</a><a className="ent-secondary-action" href="/catalogo">Abrir catálogo público</a></div>
    </section>
  </main>;
}

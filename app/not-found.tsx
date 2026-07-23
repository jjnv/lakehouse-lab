import Link from "next/link";

export default function NotFound() {
  return <main className="ent-standalone-state" id="main-content">
    <section className="ent-empty">
      <p className="ent-kicker">404 · contenido no encontrado</p>
      <h1>Esta ruta no existe o ha cambiado.</h1>
      <p>Usa el catálogo para encontrar el módulo, concepto o notebook que buscabas.</p>
      <div className="ent-form-actions"><Link className="ent-primary-action" href="/catalogo">Abrir catálogo</Link><Link className="ent-secondary-action" href="/">Volver a la portada</Link></div>
    </section>
  </main>;
}

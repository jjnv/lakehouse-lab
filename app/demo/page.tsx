import { getSessionUser, sessionStartPath } from "../session-auth";
import PublicShell from "../components/public/PublicShell";
import { modules } from "../course-data";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const user = await getSessionUser();
  const accountHref = user ? "/inicio" : sessionStartPath("/inicio");
  const accountLabel = user ? "Ir a mi espacio" : "Guardar mi progreso";
  const sampleModules = modules.slice(0, 6);

  return <PublicShell active="demo" accountHref={accountHref} accountLabel={accountLabel}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <section className="demo-intro">
        <div><p className="public-kicker">Demo pública · sin registro</p><h1>Así se aprende dentro de Lakehouse Lab.</h1><p>Esta muestra no escribe datos ni guarda actividad. El espacio personal añade progreso persistente, repasos, evaluaciones y expediente.</p></div>
        <a className="public-primary" href={accountHref}>{accountLabel}<span aria-hidden="true">→</span></a>
      </section>
      <section className="demo-workspace" aria-label="Demostración de la plataforma">
        <aside className="demo-sidebar">
          <div><span className="public-brand-mark" aria-hidden="true"><i /><i /><i /></span><b>Ruta de aprendizaje</b></div>
          <nav aria-label="Módulos de muestra">
            {sampleModules.map((module, index) => <a key={module.id} href={`#demo-module-${module.id}`} aria-current={index === 0 ? "page" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{module.short}</a>)}
          </nav>
          <p>6 de 32 módulos visibles en esta muestra.</p>
        </aside>
        <article className="demo-reader" id="demo-module-m01">
          <header><div><p className="public-kicker">Módulo 01 · Associate</p><h2>Data Intelligence Platform y arquitectura lakehouse</h2><p>Construye un modelo mental preciso de almacenamiento, cómputo, gobierno y superficies de trabajo.</p></div><div className="demo-score"><strong>0%</strong><span>muestra</span></div></header>
          <div className="demo-outcomes"><span>Al terminar podrás</span><p>Explicar storage y compute</p><p>Relacionar Delta Lake y Unity Catalog</p><p>Elegir la superficie adecuada</p></div>
          <details className="demo-lesson" open>
            <summary><span>01</span><div><small>Modelo mental</small><h3>Lake, warehouse y lakehouse sin simplificaciones</h3></div><i aria-hidden="true">+</i></summary>
            <div>
              <p className="demo-lead">Un lakehouse combina la flexibilidad de un data lake con controles y rendimiento propios de un warehouse, manteniendo los datos en formatos abiertos.</p>
              <p>La separación entre almacenamiento y cómputo permite conservar una única copia gobernada de los datos y asignar motores distintos a ETL, BI o streaming. Delta Lake añade un registro transaccional sobre archivos Parquet; Unity Catalog aporta nombres, propiedad y permisos.</p>
              <section className="demo-mental-model" aria-labelledby="demo-model-heading"><h4 id="demo-model-heading">Cuatro preguntas para razonar</h4><div><article><b>Persistencia</b><p>¿Dónde viven los bytes?</p></article><article><b>Protocolo</b><p>¿Qué define una tabla válida?</p></article><article><b>Gobierno</b><p>¿Quién puede utilizarla?</p></article><article><b>Ejecución</b><p>¿Qué motor procesa la consulta?</p></article></div></section>
              <pre tabIndex={0} aria-label="Ejemplo SQL"><code>DESCRIBE DETAIL main.learning.events;</code></pre>
              <div className="demo-checkpoint"><span>Recuerdo activo</span><b>¿Qué componente conserva el historial ACID de una tabla Delta?</b><p>En el espacio personal puedes escribir tu explicación, compararla y programar un repaso.</p></div>
            </div>
          </details>
          <div className="demo-module-grid">
            {sampleModules.slice(1).map((module, index) => <article key={module.id} id={`demo-module-${module.id}`}><span>{String(index + 2).padStart(2, "0")}</span><h3>{module.title}</h3><p>{module.description}</p><small>{module.minutes} min · {module.level}</small></article>)}
          </div>
        </article>
      </section>
      <section className="public-cta"><p className="public-kicker">Espacio personal</p><h2>Continúa con los 32 módulos y conserva tu progreso.</h2><div className="public-actions"><a className="public-primary" href={accountHref}>{accountLabel}<span aria-hidden="true">→</span></a><a className="public-secondary" href="/privacidad">Cómo tratamos tus datos</a></div></section>
    </main>
  </PublicShell>;
}

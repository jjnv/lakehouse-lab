import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE } from "../project-info";

export default function TermsPage() {
  return <PublicShell active="terms">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Condiciones de uso</p><h1>Aprendizaje independiente, sin promesas engañosas.</h1>
        <p className="public-document-lead">Estas condiciones se aplican al servicio público de Lakehouse Lab. Última actualización: {CONTENT_REVIEW_DATE}.</p>
        <section><h2>Naturaleza del proyecto</h2><p>Lakehouse Lab es un proyecto educativo personal e independiente. No es un producto oficial de Databricks, no sustituye su documentación o formación y no está afiliado, patrocinado ni avalado por la compañía.</p></section>
        <section><h2>Uso permitido</h2><p>Puedes utilizar la plataforma para aprendizaje personal, evaluación formativa y práctica técnica. No puedes intentar acceder a datos de otras personas, alterar el servicio, automatizar abuso, distribuir bancos de preguntas como dumps de examen ni presentar las credenciales internas como certificaciones oficiales.</p></section>
        <section><h2>Contenido y certificaciones</h2><p>El temario se actualiza de buena fe, pero los productos, interfaces y exámenes pueden cambiar. Ninguna puntuación garantiza aprobar un examen ni acredita experiencia profesional. Contrasta siempre las decisiones de producción con la documentación oficial vigente.</p></section>
        <section><h2>Credencial</h2><p>La credencial emitida por Lakehouse Lab certifica únicamente la finalización de requisitos internos de esta ruta. No es una certificación proctorizada ni una credencial expedida por Databricks.</p></section>
        <section><h2>Disponibilidad</h2><p>La plataforma puede cambiar, interrumpirse o retirar contenido para corregir errores y mantener la seguridad. Antes de depender de tu expediente, utiliza la función de exportación disponible en Ajustes.</p></section>
        <section><h2>Propiedad intelectual y marcas</h2><p>El contenido propio y el código se rigen por las licencias publicadas con el proyecto. Los nombres y marcas de terceros pertenecen a sus respectivos titulares y se utilizan únicamente con finalidad descriptiva.</p></section>
      </article>
    </main>
  </PublicShell>;
}

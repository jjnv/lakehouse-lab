import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, PROJECT_ISSUES_URL, PROJECT_REPOSITORY_URL } from "../project-info";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Privacidad y controles de progreso personal en Lakehouse Lab.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return <PublicShell active="privacy">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Privacidad</p><h1>Tu progreso te pertenece.</h1>
        <p className="public-document-lead">Esta nota explica de forma operativa qué información utiliza Lakehouse Lab y qué controles tienes. Última actualización: {CONTENT_REVIEW_DATE}.</p>
        <section><h2>Responsable y alcance</h2><p>Lakehouse Lab es un proyecto personal independiente. Esta política cubre la web pública, el temario, los recursos y el espacio personal de preparación. Las solicitudes sobre datos se gestionan desde Mi cuenta.</p></section>
        <section><h2>Datos tratados</h2><ul><li>Un identificador aleatorio y anónimo guardado en una cookie privada del navegador; no solicitamos nombre ni correo.</li><li>Progreso: lecciones, repasos, laboratorios, intentos, resultados y constancias internas.</li><li>Preferencia de preparación: Associate, Professional o consulta por temas.</li><li>Datos técnicos mínimos necesarios para seguridad, diagnóstico e integridad de las operaciones.</li><li>Los borradores de recuerdo activo se guardan únicamente en el navegador.</li><li>Si generas un código de recuperación, el servidor conserva solo su huella criptográfica y nunca el código legible.</li></ul></section>
        <section><h2>Finalidades</h2><p>Los datos se utilizan para crear tu espacio en este navegador, conservar el aprendizaje, corregir actividades, emitir una constancia interna de finalización y proteger el servicio frente a operaciones duplicadas o no autorizadas. No se venden datos, no hay publicidad y no se elaboran perfiles comerciales.</p></section>
        <section><h2>Infraestructura y acceso</h2><p>El sitio se ejecuta en Vercel y guarda el progreso en Turso. El acceso a cada expediente se resuelve en el servidor mediante una cookie privada, aleatoria y no legible por JavaScript; las rutas de escritura no aceptan un correo o identificador de usuario enviado por el navegador.</p></section>
        <section><h2>Conservación</h2><p>El progreso se conserva mientras utilizas el espacio. Al solicitar su eliminación se borran lecciones, repasos, laboratorios, intentos, recompensas y constancias internas; se mantienen únicamente la matrícula básica y los registros mínimos de integridad. Los códigos de recuperación caducan a los 90 días y puedes rotarlos o revocarlos. Si borras la cookie, solo podrás volver a vincular el espacio con un código de recuperación vigente.</p></section>
        <section><h2>Tus controles</h2><ul><li><b>Acceso y portabilidad:</b> descarga una copia desde Mi cuenta.</li><li><b>Recuperación:</b> genera, rota o revoca un código privado desde Mi cuenta.</li><li><b>Supresión:</b> elimina el progreso desde Mi cuenta mediante confirmación reforzada.</li><li><b>Datos identificativos:</b> la plataforma no solicita nombre ni correo.</li><li><b>Navegación:</b> puedes volver a la portada sin cerrar ni perder tu espacio.</li></ul><p><a href="/ajustes">Abrir controles de datos</a></p></section>
        <section><h2>Contacto</h2><p>Para una incidencia general de privacidad sin datos personales, utiliza <a href={PROJECT_ISSUES_URL} rel="noreferrer">el seguimiento público del proyecto</a>. Las vulnerabilidades deben comunicarse de forma privada mediante <a href={`${PROJECT_REPOSITORY_URL}/security/advisories/new`} rel="noreferrer">GitHub Security Advisories</a>. Las solicitudes vinculadas al progreso deben realizarse desde Mi cuenta para poder asociarlas al espacio activo.</p></section>
        <section><h2>Recursos externos</h2><p>Las vistas previas de notebooks se recuperan desde fuentes editoriales permitidas y se muestran sin ejecutar código. Al abrir un repositorio o una documentación externa se aplican las políticas de privacidad de ese servicio.</p></section>
      </article>
    </main>
  </PublicShell>;
}

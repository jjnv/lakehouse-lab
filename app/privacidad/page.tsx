import PublicShell from "../components/public/PublicShell";
import { CONTENT_REVIEW_DATE, PROJECT_ISSUES_URL } from "../project-info";

export default function PrivacyPage() {
  return <PublicShell active="privacy">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Privacidad</p><h1>Tu progreso te pertenece.</h1>
        <p className="public-document-lead">Esta nota explica de forma operativa qué información utiliza Lakehouse Lab y qué controles tienes. Última actualización: {CONTENT_REVIEW_DATE}.</p>
        <section><h2>Responsable y alcance</h2><p>Lakehouse Lab es un proyecto personal independiente. Esta política cubre la web pública, la demo y el espacio personal de aprendizaje. Las solicitudes sobre datos de una cuenta se gestionan desde la sección Ajustes del propio espacio.</p></section>
        <section><h2>Datos tratados</h2><ul><li>Correo y nombre facilitados por el inicio de sesión con ChatGPT.</li><li>Progreso: lecciones, repasos, laboratorios, intentos, resultados y credenciales.</li><li>Datos técnicos mínimos necesarios para seguridad, diagnóstico e integridad de las operaciones.</li><li>Preferencias y borradores privados guardados únicamente en el navegador cuando se indica expresamente.</li></ul></section>
        <section><h2>Finalidades</h2><p>Los datos se utilizan para crear tu espacio, sincronizar el aprendizaje entre dispositivos, corregir actividades, emitir una credencial de finalización y proteger el servicio frente a operaciones duplicadas o no autorizadas. No se venden datos, no hay publicidad y no se elaboran perfiles comerciales.</p></section>
        <section><h2>Infraestructura y acceso</h2><p>El sitio se ejecuta mediante OpenAI Sites y servicios de infraestructura asociados. El acceso a cada expediente se resuelve en el servidor a partir de la identidad autenticada; las rutas de escritura no aceptan un correo o identificador de usuario enviado por el navegador.</p></section>
        <section><h2>Conservación</h2><p>El progreso se conserva mientras utilizas el espacio. Al solicitar su eliminación se borran lecciones, repasos, laboratorios, intentos, recompensas y credenciales. Se mantienen la cuenta, la matrícula básica y los registros mínimos necesarios para integridad, auditoría y prevención de importaciones duplicadas.</p></section>
        <section><h2>Tus controles</h2><ul><li><b>Acceso y portabilidad:</b> descarga una copia desde Ajustes.</li><li><b>Supresión:</b> elimina el progreso desde Ajustes mediante confirmación reforzada.</li><li><b>Rectificación:</b> el nombre y el correo proceden de la cuenta utilizada para iniciar sesión.</li><li><b>Salir:</b> puedes cerrar la sesión desde la navegación del espacio personal.</li></ul><p><a href="/ajustes">Abrir controles de datos</a></p></section>
        <section><h2>Contacto</h2><p>Para comunicar una incidencia general de privacidad o seguridad sin incluir datos personales, utiliza <a href={PROJECT_ISSUES_URL} rel="noreferrer">el seguimiento público del proyecto</a>. Las solicitudes vinculadas a una cuenta deben realizarse desde Ajustes para poder asociarlas a la identidad autenticada.</p></section>
        <section><h2>Demo pública</h2><p>La demo no crea una matrícula, no escribe progreso en el servidor y no necesita una cuenta. Los enlaces externos a documentación tienen sus propias políticas de privacidad.</p></section>
      </article>
    </main>
  </PublicShell>;
}

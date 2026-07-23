import PublicShell from "../components/public/PublicShell";
import RecoveryWorkspace from "../components/public/RecoveryWorkspace";

export default function RecuperarPage() {
  return <PublicShell accountHref="/entrar?return_to=%2Finicio" accountLabel="Crear otro espacio">
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">Identidad anónima y portable</p>
        <h1>Vuelve a tu aprendizaje.</h1>
        <p className="public-document-lead">Introduce el código que generaste en Ajustes. Lakehouse Lab no necesita saber quién eres para devolverte tu progreso.</p>
        <section aria-labelledby="recover-heading"><h2 id="recover-heading">Recuperar espacio</h2><RecoveryWorkspace /></section>
        <section><h2>¿No tienes código?</h2><p>El acceso anterior permanece en el navegador original. Desde sus Ajustes puedes generar un código nuevo. Si ya no tienes ese navegador, no existe una puerta trasera asociada a un correo o identidad personal.</p></section>
      </article>
    </main>
  </PublicShell>;
}

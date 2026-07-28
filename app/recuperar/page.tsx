import PublicShell from "../components/public/PublicShell";
import RecoveryWorkspace from "../components/public/RecoveryWorkspace";
import { getRequestLocale } from "../i18n/server";
import type { Locale } from "../i18n/config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Recover workspace" : "Recuperar espacio",
    description: locale === "en"
      ? "Recover a private Lakehouse Lab workspace with a recovery code."
      : "Recupera un espacio privado de Lakehouse Lab con un código de recuperación.",
    alternates: { canonical: "/recuperar" },
  };
}

const recoverPageText: Record<Locale, {
  account: string;
  kicker: string;
  title: string;
  lead: string;
  formTitle: string;
  noCodeTitle: string;
  noCodeBody: string;
}> = {
  es: {
    account: "Crear otro espacio",
    kicker: "Identidad anónima y portable",
    title: "Vuelve a tu aprendizaje.",
    lead: "Introduce el código que generaste en Ajustes. Lakehouse Lab no necesita saber quién eres para devolverte tu progreso.",
    formTitle: "Recuperar espacio",
    noCodeTitle: "¿No tienes código?",
    noCodeBody: "El acceso anterior permanece en el navegador original. Desde sus Ajustes puedes generar un código nuevo. Si ya no tienes ese navegador, no existe una puerta trasera asociada a un correo o identidad personal.",
  },
  en: {
    account: "Create another workspace",
    kicker: "Anonymous portable identity",
    title: "Return to your learning.",
    lead: "Enter the code you generated in Settings. Lakehouse Lab does not need to know who you are to restore your progress.",
    formTitle: "Recover workspace",
    noCodeTitle: "No code?",
    noCodeBody: "The previous access remains in the original browser. From its Settings page you can generate a new code. If you no longer have that browser, there is no back door tied to an email or personal identity.",
  },
};

export default async function RecuperarPage() {
  const locale = await getRequestLocale();
  const text = recoverPageText[locale];
  return <PublicShell accountHref="/entrar?return_to=%2Finicio" accountLabel={text.account} locale={locale}>
    <main id="public-main" className="public-document-main" tabIndex={-1}>
      <article className="public-document">
        <p className="public-kicker">{text.kicker}</p>
        <h1>{text.title}</h1>
        <p className="public-document-lead">{text.lead}</p>
        <section aria-labelledby="recover-heading"><h2 id="recover-heading">{text.formTitle}</h2><RecoveryWorkspace locale={locale} /></section>
        <section><h2>{text.noCodeTitle}</h2><p>{text.noCodeBody}</p></section>
      </article>
    </main>
  </PublicShell>;
}

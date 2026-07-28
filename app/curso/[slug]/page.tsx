import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../components/enterprise/AppShell";
import CourseWorkspace from "../../components/enterprise/CourseWorkspace";
import { getOptionalEnterprisePageContext } from "../../components/enterprise/getShellContext";
import { findModuleBySlug, moduleSummaries, publicModule } from "../../enterprise/curriculum";
import { getRequestLocale } from "../../i18n/server";
import { localizeModule } from "../../i18n/curriculum";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const courseModule = findModuleBySlug(slug);
  if (!courseModule) return {};
  const locale = await getRequestLocale();
  const localizedModule = localizeModule(courseModule, locale);
  return {
    title: localizedModule.title,
    description: localizedModule.description,
    alternates: { canonical: `/curso/${courseModule.slug}` },
    openGraph: {
      title: `${localizedModule.title} · Lakehouse Lab`,
      description: localizedModule.description,
      url: `/curso/${courseModule.slug}`,
    },
  };
}

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const courseModule = findModuleBySlug(slug);
  if (!courseModule) notFound();
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  const summaries = moduleSummaries(context.locale);
  const index = summaries.findIndex((item) => item.id === courseModule.id);
  const navigation = {
    previous: index > 0 ? summaries[index - 1] : null,
    next: index >= 0 && index < summaries.length - 1 ? summaries[index + 1] : null,
  };
  const modulePayload = publicModule(courseModule, context.locale);
  const eyebrow = context.locale === "en" ? `Module ${courseModule.number} · ${modulePayload.level}` : `Módulo ${courseModule.number} · ${modulePayload.level}`;
  return <AppShell active="learning" eyebrow={eyebrow} title={modulePayload.short} courseMode brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale} publicMode={!personalized}><CourseWorkspace module={modulePayload} personalized={personalized} navigation={navigation} locale={context.locale} /></AppShell>;
}

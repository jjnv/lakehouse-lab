import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../components/enterprise/AppShell";
import CourseWorkspace from "../../components/enterprise/CourseWorkspace";
import { getOptionalEnterprisePageContext } from "../../components/enterprise/getShellContext";
import { findModuleBySlug, moduleSummaries, publicModule } from "../../enterprise/curriculum";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const courseModule = findModuleBySlug(slug);
  if (!courseModule) return {};
  return {
    title: courseModule.title,
    description: courseModule.description,
    alternates: { canonical: `/curso/${courseModule.slug}` },
    openGraph: {
      title: `${courseModule.title} · Lakehouse Lab`,
      description: courseModule.description,
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
  const summaries = moduleSummaries();
  const index = summaries.findIndex((item) => item.id === courseModule.id);
  const navigation = {
    previous: index > 0 ? summaries[index - 1] : null,
    next: index >= 0 && index < summaries.length - 1 ? summaries[index + 1] : null,
  };
  return <AppShell active="learning" eyebrow={`Módulo ${courseModule.number} · ${courseModule.level}`} title={courseModule.short} courseMode brand={context.brand} userDisplayName={context.userDisplayName} publicMode={!personalized}><CourseWorkspace module={publicModule(courseModule)} personalized={personalized} navigation={navigation} /></AppShell>;
}

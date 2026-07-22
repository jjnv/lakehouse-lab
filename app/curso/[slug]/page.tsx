import { notFound } from "next/navigation";
import AppShell from "../../components/enterprise/AppShell";
import CourseWorkspace from "../../components/enterprise/CourseWorkspace";
import { requireEnterprisePageContext } from "../../components/enterprise/getShellContext";
import { findModuleBySlug, publicModule } from "../../enterprise/curriculum";

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const courseModule = findModuleBySlug(slug);
  if (!courseModule) notFound();
  const context = await requireEnterprisePageContext(`/curso/${encodeURIComponent(slug)}`);
  return <AppShell active="learning" eyebrow={`Módulo ${courseModule.number} · ${courseModule.level}`} title={courseModule.short} courseMode brand={context.brand} userDisplayName={context.userDisplayName}><CourseWorkspace module={publicModule(courseModule)} /></AppShell>;
}

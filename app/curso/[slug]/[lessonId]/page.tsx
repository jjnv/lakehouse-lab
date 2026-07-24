import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../../components/enterprise/AppShell";
import CourseWorkspace from "../../../components/enterprise/CourseWorkspace";
import { getOptionalEnterprisePageContext } from "../../../components/enterprise/getShellContext";
import { findModuleBySlug, moduleSummaries, publicModule } from "../../../enterprise/curriculum";
import { lessonEditorialMetadata, sourceStructuredData } from "../../../editorial-model";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lessonId: string }> }): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const courseModule = findModuleBySlug(slug);
  const lesson = courseModule?.lessons.find((candidate) => candidate.id === lessonId);
  if (!courseModule || !lesson) return {};
  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/curso/${courseModule.slug}/${lesson.id}` },
    openGraph: {
      title: `${lesson.title} · ${courseModule.short}`,
      description: lesson.summary,
      url: `/curso/${courseModule.slug}/${lesson.id}`,
    },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const courseModule = findModuleBySlug(slug);
  if (!courseModule || !courseModule.lessons.some((lesson) => lesson.id === lessonId)) notFound();
  const context = await getOptionalEnterprisePageContext();
  const personalized = Boolean(context.learner);
  const summaries = moduleSummaries();
  const index = summaries.findIndex((item) => item.id === courseModule.id);
  const navigation = {
    previous: index > 0 ? summaries[index - 1] : null,
    next: index >= 0 && index < summaries.length - 1 ? summaries[index + 1] : null,
  };
  const lesson = courseModule.lessons.find((candidate) => candidate.id === lessonId)!;
  const editorial = lessonEditorialMetadata(courseModule, lesson);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    inLanguage: "es",
    educationalLevel: courseModule.level,
    timeRequired: `PT${editorial.estimatedMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: "Lakehouse Lab",
    },
    citation: editorial.sources.map(sourceStructuredData),
  };
  return <AppShell active="learning" eyebrow={`Módulo ${courseModule.number} · Lección`} title={lesson.title} courseMode brand={context.brand} userDisplayName={context.userDisplayName} publicMode={!personalized}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <CourseWorkspace module={publicModule(courseModule)} personalized={personalized} navigation={navigation} initialLessonId={lessonId} singleLessonMode />
  </AppShell>;
}

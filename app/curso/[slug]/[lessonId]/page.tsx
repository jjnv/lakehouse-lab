import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppShell from "../../../components/enterprise/AppShell";
import CourseWorkspace from "../../../components/enterprise/CourseWorkspace";
import { getOptionalEnterprisePageContext } from "../../../components/enterprise/getShellContext";
import { findModuleBySlug, moduleSummaries, publicModule } from "../../../enterprise/curriculum";
import { lessonEditorialMetadata, sourceStructuredData } from "../../../editorial-model";
import { getRequestLocale } from "../../../i18n/server";
import { localizeModule } from "../../../i18n/curriculum";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lessonId: string }> }): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const courseModule = findModuleBySlug(slug);
  const lesson = courseModule?.lessons.find((candidate) => candidate.id === lessonId);
  if (!courseModule || !lesson) return {};
  const locale = await getRequestLocale();
  const localizedModule = localizeModule(courseModule, locale);
  const localizedLesson = localizedModule.lessons.find((candidate) => candidate.id === lessonId) ?? lesson;
  return {
    title: localizedLesson.title,
    description: localizedLesson.summary,
    alternates: { canonical: `/curso/${courseModule.slug}/${lesson.id}` },
    openGraph: {
      title: `${localizedLesson.title} · ${localizedModule.short}`,
      description: localizedLesson.summary,
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
  const summaries = moduleSummaries(context.locale);
  const index = summaries.findIndex((item) => item.id === courseModule.id);
  const navigation = {
    previous: index > 0 ? summaries[index - 1] : null,
    next: index >= 0 && index < summaries.length - 1 ? summaries[index + 1] : null,
  };
  const modulePayload = publicModule(courseModule, context.locale);
  const lesson = modulePayload.lessons.find((candidate) => candidate.id === lessonId)!;
  const sourceLesson = courseModule.lessons.find((candidate) => candidate.id === lessonId)!;
  const editorial = lessonEditorialMetadata(courseModule, sourceLesson);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    inLanguage: context.locale,
    educationalLevel: modulePayload.level,
    timeRequired: `PT${editorial.estimatedMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: "Lakehouse Lab",
    },
    citation: modulePayload.sources.map(sourceStructuredData),
  };
  const eyebrow = context.locale === "en" ? `Module ${courseModule.number} · Lesson` : `Módulo ${courseModule.number} · Lección`;
  return <AppShell active="learning" eyebrow={eyebrow} title={modulePayload.short} courseMode brand={context.brand} userDisplayName={context.userDisplayName} locale={context.locale} publicMode={!personalized}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <CourseWorkspace module={modulePayload} personalized={personalized} navigation={navigation} initialLessonId={lessonId} singleLessonMode locale={context.locale} />
  </AppShell>;
}

import { modules } from "../course-data";
import type { Locale } from "../i18n/config";
import { localizeModule } from "../i18n/curriculum";
import type { CurriculumReference } from "./domain/types";
import type { LessonLink } from "./evaluation/report";

/** Resuelve referencias curriculares a enlaces reales y localizados (solo servidor). */
export function lessonLinks(refs: CurriculumReference[], locale: Locale): LessonLink[] {
  return refs.flatMap((ref) => {
    const found = modules.find((item) => item.id === ref.moduleId);
    if (!found) return [];
    const localized = localizeModule(found, locale);
    if (!ref.lessonId) return [{ href: `/curso/${found.slug}`, label: `${found.number} · ${localized.title}` }];
    const lesson = localized.lessons.find((item) => item.id === ref.lessonId);
    return lesson ? [{ href: `/curso/${found.slug}/${lesson.id}`, label: `${found.number} · ${lesson.title}` }] : [];
  });
}

import type { LessonEssentials, LessonEssentialsSource } from "../content-types";
import { glossaryEntryById } from "../glossary";
import { coreEssentials } from "./core";
import { deliveryEssentials } from "./delivery";
import { performanceEssentials } from "./performance";
import { pipelinesEssentials } from "./pipelines";
import { streamingEssentials } from "./streaming";

type ModuleNumber =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08"
  | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16"
  | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24"
  | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32";

type LessonId = `m${ModuleNumber}-l${1 | 2 | 3 | 4 | 5}`;

/**
 * «Lo esencial» bilingüe de las 160 lecciones, indexado por ID persistente.
 * El tipo obliga a cubrir cada lección: añadir o quitar una rompe la compilación.
 */
export const lessonEssentials = {
  ...coreEssentials,
  ...streamingEssentials,
  ...pipelinesEssentials,
  ...performanceEssentials,
  ...deliveryEssentials,
} satisfies Record<LessonId, LessonEssentialsSource>;

/** Devuelve la ficha localizada con los términos del glosario ya resueltos. */
export function lessonEssentialsFor(lessonId: string, locale: "es" | "en"): LessonEssentials {
  const source = (lessonEssentials as Record<string, LessonEssentialsSource>)[lessonId];
  if (!source) throw new Error(`Falta «Lo esencial» para la lección ${lessonId}`);
  return {
    ...source[locale],
    glossary: source.glossary.flatMap((id) => {
      const entry = glossaryEntryById.get(id);
      if (!entry) return [];
      return [{ id, term: locale === "en" ? entry.en.term ?? entry.term : entry.term }];
    }),
  };
}

import { englishQuizAdvancedA } from "./advanced-a";
import { englishQuizAdvancedB } from "./advanced-b";
import { englishQuizAssociate } from "./associate";
import { englishQuizCore } from "./core";
import { englishQuizProfessionalAugmented } from "./professional-augmented";
import { englishQuizProfessionalBank } from "./professional-bank";
import type { EnglishQuizCopy, EnglishQuizCopyTable } from "./types";

export type { EnglishQuizCopy, EnglishQuizCopyTable } from "./types";

const tables: readonly EnglishQuizCopyTable[] = [
  englishQuizCore,
  englishQuizAdvancedA,
  englishQuizAdvancedB,
  englishQuizAssociate,
  englishQuizProfessionalBank,
  englishQuizProfessionalAugmented,
];

const copyByEditorialId = new Map<string, EnglishQuizCopy>();
for (const table of tables) {
  for (const [editorialId, copy] of Object.entries(table)) {
    if (copyByEditorialId.has(editorialId)) throw new Error(`English quiz copy duplicated for ${editorialId}`);
    copyByEditorialId.set(editorialId, copy);
  }
}

/** Server-only lookup of English quiz copy by persistent editorialId. */
export function englishQuizCopyFor(editorialId: string): EnglishQuizCopy | undefined {
  return copyByEditorialId.get(editorialId);
}

export function englishQuizEditorialIds(): readonly string[] {
  return [...copyByEditorialId.keys()];
}

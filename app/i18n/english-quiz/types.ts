/**
 * English copy for one canonical quiz or exam question, keyed by its
 * persistent `editorialId`. Options are listed in the canonical (source)
 * order, so the Spanish `answer` index applies unchanged. Server-only data:
 * explanations must never be imported by client components.
 */
export type EnglishQuizCopy = {
  question: string;
  options: readonly [string, string, string, string];
  explanation: string;
};

export type EnglishQuizCopyTable = Readonly<Record<string, EnglishQuizCopy>>;

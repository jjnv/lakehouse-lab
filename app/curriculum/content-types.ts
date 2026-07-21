export type CodeLanguage = "SQL" | "PySpark" | "Python" | "YAML" | "CLI" | "JSON";

export type ConceptDefinition = {
  term: string;
  definition: string;
  whyItMatters: string;
};

export type LessonDeepDive = {
  mentalModel: string;
  mechanics: [string, string];
  concepts: [ConceptDefinition, ConceptDefinition, ConceptDefinition];
  workedScenario: {
    situation: string;
    reasoning: [string, string, string];
    outcome: string;
  };
};

export type LessonContent = {
  summary: string;
  explanation: [string, string];
  deepDive: LessonDeepDive;
  keyPoints: [string, string, string];
  example: {
    language: CodeLanguage;
    title: string;
    code: string;
    note: string;
  };
  pitfalls: [string, string];
  examDecision: string;
  checkpoint: {
    question: string;
    answer: string;
  };
};

export type ContentCheck = {
  label: string;
  pattern: string;
};

export type LabContent = {
  title: string;
  goal: string;
  scenario: string;
  steps: string[];
  starterCode: string;
  solution: string;
  checks: ContentCheck[];
  expectedEvidence: string[];
  cloudNotes: {
    AWS: string;
    Azure: string;
    GCP: string;
  };
};

export type ContentQuizQuestion = {
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  domain: string;
};

export type ContentSource = {
  label: string;
  href: string;
  reviewedAt: string;
};

export type ModuleContentPack = {
  lessons: [LessonContent, LessonContent, LessonContent, LessonContent, LessonContent];
  lab: LabContent;
  quiz: [ContentQuizQuestion, ContentQuizQuestion, ContentQuizQuestion, ContentQuizQuestion];
  sources: [ContentSource, ContentSource, ...ContentSource[]];
};

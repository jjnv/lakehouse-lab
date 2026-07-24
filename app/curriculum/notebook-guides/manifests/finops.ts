import { createNotebookGuideManifest } from "../builder";
import { finopsNotebookGuidePart0 } from "./parts/finops-0";

export const finopsNotebookGuide = createNotebookGuideManifest({
  resourceId: "finops",
  upstreamRef: "7834d5dfd9f7733b24559b4ff30b424f5cdb7008",
  path: "README.md",
  reviewedAt: "23 jul 2026",
}, [
  ...finopsNotebookGuidePart0,
]);

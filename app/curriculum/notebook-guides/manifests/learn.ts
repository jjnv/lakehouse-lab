import { createNotebookGuideManifest } from "../builder";
import { learnNotebookGuidePart0 } from "./parts/learn-0";

export const learnNotebookGuide = createNotebookGuideManifest({
  resourceId: "learn",
  upstreamRef: "08c378cf95c0c1f16b9a7db25b6c7a01a643dd72",
  path: "README.md",
  reviewedAt: "23 jul 2026",
}, [
  ...learnNotebookGuidePart0,
]);

import { createNotebookGuideManifest } from "../builder";
import { bestPracticesNotebookGuidePart0 } from "./parts/best-practices-0";
import { bestPracticesNotebookGuidePart1 } from "./parts/best-practices-1";

export const bestPracticesNotebookGuide = createNotebookGuideManifest({
  resourceId: "best-practices",
  upstreamRef: "b4f55c13dc76f34c1861b25221b8ac6bb17956d8",
  path: "notebooks/covid_eda_modular.py",
  reviewedAt: "23 jul 2026",
}, [
  ...bestPracticesNotebookGuidePart0,
  ...bestPracticesNotebookGuidePart1,
]);

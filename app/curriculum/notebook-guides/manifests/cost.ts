import { createNotebookGuideManifest } from "../builder";
import { costNotebookGuidePart0 } from "./parts/cost-0";
import { costNotebookGuidePart1 } from "./parts/cost-1";

export const costNotebookGuide = createNotebookGuideManifest({
  resourceId: "cost",
  upstreamRef: "8e4bf7ca6508d4cdc20e8b01463896c903ef427d",
  path: "lake_view/demo_setup.py",
  reviewedAt: "23 jul 2026",
}, [
  ...costNotebookGuidePart0,
  ...costNotebookGuidePart1,
]);

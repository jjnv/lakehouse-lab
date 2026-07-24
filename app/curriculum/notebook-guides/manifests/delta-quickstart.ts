import { createNotebookGuideManifest } from "../builder";
import { deltaQuickstartNotebookGuidePart0 } from "./parts/delta-quickstart-0";
import { deltaQuickstartNotebookGuidePart1 } from "./parts/delta-quickstart-1";
import { deltaQuickstartNotebookGuidePart2 } from "./parts/delta-quickstart-2";
import { deltaQuickstartNotebookGuidePart3 } from "./parts/delta-quickstart-3";
import { deltaQuickstartNotebookGuidePart4 } from "./parts/delta-quickstart-4";

export const deltaQuickstartNotebookGuide = createNotebookGuideManifest({
  resourceId: "delta-quickstart",
  upstreamRef: "82ed21472bcd9801f0919b98a5afe9f40b3fcd74",
  path: "notebooks/pyspark/01_quickstart.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...deltaQuickstartNotebookGuidePart0,
  ...deltaQuickstartNotebookGuidePart1,
  ...deltaQuickstartNotebookGuidePart2,
  ...deltaQuickstartNotebookGuidePart3,
  ...deltaQuickstartNotebookGuidePart4,
]);

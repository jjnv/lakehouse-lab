import { createNotebookGuideManifest } from "../builder";
import { azureIngestionNotebookGuidePart0 } from "./parts/azure-ingestion-0";
import { azureIngestionNotebookGuidePart1 } from "./parts/azure-ingestion-1";
import { azureIngestionNotebookGuidePart2 } from "./parts/azure-ingestion-2";
import { azureIngestionNotebookGuidePart3 } from "./parts/azure-ingestion-3";
import { azureIngestionNotebookGuidePart4 } from "./parts/azure-ingestion-4";

export const azureIngestionNotebookGuide = createNotebookGuideManifest({
  resourceId: "azure-ingestion",
  upstreamRef: "2fcc3dbaf53bcfc691b9f598887d7c09db5b3512",
  path: "01-adls-gen2-integration/notebooks/03-medallion-architecture.py",
  reviewedAt: "23 jul 2026",
}, [
  ...azureIngestionNotebookGuidePart0,
  ...azureIngestionNotebookGuidePart1,
  ...azureIngestionNotebookGuidePart2,
  ...azureIngestionNotebookGuidePart3,
  ...azureIngestionNotebookGuidePart4,
]);

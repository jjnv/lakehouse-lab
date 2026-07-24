import { createNotebookGuideManifest } from "../builder";
import { lighthouseNotebookGuidePart0 } from "./parts/lighthouse-0";

export const lighthouseNotebookGuide = createNotebookGuideManifest({
  resourceId: "lighthouse",
  upstreamRef: "35217ff9e7c1a956ce65793c1f569a15990fe89a",
  path: "notebooks/databricks/DeltaClusteringMetrics.scala",
  reviewedAt: "23 jul 2026",
}, [
  ...lighthouseNotebookGuidePart0,
]);

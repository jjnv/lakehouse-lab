import { createNotebookGuideManifest } from "../builder";
import { databricksExamplesNotebookGuidePart0 } from "./parts/databricks-examples-0";
import { databricksExamplesNotebookGuidePart1 } from "./parts/databricks-examples-1";
import { databricksExamplesNotebookGuidePart2 } from "./parts/databricks-examples-2";

export const databricksExamplesNotebookGuide = createNotebookGuideManifest({
  resourceId: "databricks-examples",
  upstreamRef: "dcf7abe288d078fbc8037ecdbd8ced9452bddeb0",
  path: "notebooks/Learnt lessons with Spark and Delta.py",
  reviewedAt: "23 jul 2026",
}, [
  ...databricksExamplesNotebookGuidePart0,
  ...databricksExamplesNotebookGuidePart1,
  ...databricksExamplesNotebookGuidePart2,
]);

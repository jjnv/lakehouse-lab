import { createNotebookGuideManifest } from "../builder";
import { yokawasaEventhubNotebookGuidePart0 } from "./parts/yokawasa-eventhub-0";
import { yokawasaEventhubNotebookGuidePart1 } from "./parts/yokawasa-eventhub-1";

export const yokawasaEventhubNotebookGuide = createNotebookGuideManifest({
  resourceId: "yokawasa-eventhub",
  upstreamRef: "51e8e4b19a947cbb83f4780fbab513b0f3b176f4",
  path: "notebooks/tweet-streaming-eventhub-python.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...yokawasaEventhubNotebookGuidePart0,
  ...yokawasaEventhubNotebookGuidePart1,
]);

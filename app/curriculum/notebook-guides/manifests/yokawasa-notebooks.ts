import { createNotebookGuideManifest } from "../builder";
import { yokawasaNotebooksNotebookGuidePart0 } from "./parts/yokawasa-notebooks-0";
import { yokawasaNotebooksNotebookGuidePart1 } from "./parts/yokawasa-notebooks-1";
import { yokawasaNotebooksNotebookGuidePart2 } from "./parts/yokawasa-notebooks-2";
import { yokawasaNotebooksNotebookGuidePart3 } from "./parts/yokawasa-notebooks-3";
import { yokawasaNotebooksNotebookGuidePart4 } from "./parts/yokawasa-notebooks-4";
import { yokawasaNotebooksNotebookGuidePart5 } from "./parts/yokawasa-notebooks-5";

export const yokawasaNotebooksNotebookGuide = createNotebookGuideManifest({
  resourceId: "yokawasa-notebooks",
  upstreamRef: "51e8e4b19a947cbb83f4780fbab513b0f3b176f4",
  path: "notebooks/file-operations-python.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...yokawasaNotebooksNotebookGuidePart0,
  ...yokawasaNotebooksNotebookGuidePart1,
  ...yokawasaNotebooksNotebookGuidePart2,
  ...yokawasaNotebooksNotebookGuidePart3,
  ...yokawasaNotebooksNotebookGuidePart4,
  ...yokawasaNotebooksNotebookGuidePart5,
]);

import { createNotebookGuideManifest } from "../builder";
import { crdbNotebookGuidePart0 } from "./parts/crdb-0";
import { crdbNotebookGuidePart1 } from "./parts/crdb-1";
import { crdbNotebookGuidePart2 } from "./parts/crdb-2";
import { crdbNotebookGuidePart3 } from "./parts/crdb-3";
import { crdbNotebookGuidePart4 } from "./parts/crdb-4";
import { crdbNotebookGuidePart5 } from "./parts/crdb-5";

export const crdbNotebookGuide = createNotebookGuideManifest({
  resourceId: "crdb",
  upstreamRef: "042cb96da47f8872a097494fa2603a50c3c00eab",
  path: "crdb_to_dbx/cockroachdb-cdc-tutorial.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...crdbNotebookGuidePart0,
  ...crdbNotebookGuidePart1,
  ...crdbNotebookGuidePart2,
  ...crdbNotebookGuidePart3,
  ...crdbNotebookGuidePart4,
  ...crdbNotebookGuidePart5,
]);

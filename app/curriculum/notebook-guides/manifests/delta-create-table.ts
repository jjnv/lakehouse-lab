import { createNotebookGuideManifest } from "../builder";
import { deltaCreateTableNotebookGuidePart0 } from "./parts/delta-create-table-0";
import { deltaCreateTableNotebookGuidePart1 } from "./parts/delta-create-table-1";
import { deltaCreateTableNotebookGuidePart2 } from "./parts/delta-create-table-2";
import { deltaCreateTableNotebookGuidePart3 } from "./parts/delta-create-table-3";
import { deltaCreateTableNotebookGuidePart4 } from "./parts/delta-create-table-4";
import { deltaCreateTableNotebookGuidePart5 } from "./parts/delta-create-table-5";
import { deltaCreateTableNotebookGuidePart6 } from "./parts/delta-create-table-6";
import { deltaCreateTableNotebookGuidePart7 } from "./parts/delta-create-table-7";
import { deltaCreateTableNotebookGuidePart8 } from "./parts/delta-create-table-8";

export const deltaCreateTableNotebookGuide = createNotebookGuideManifest({
  resourceId: "delta-create-table",
  upstreamRef: "82ed21472bcd9801f0919b98a5afe9f40b3fcd74",
  path: "notebooks/pyspark/create-table-delta-lake.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...deltaCreateTableNotebookGuidePart0,
  ...deltaCreateTableNotebookGuidePart1,
  ...deltaCreateTableNotebookGuidePart2,
  ...deltaCreateTableNotebookGuidePart3,
  ...deltaCreateTableNotebookGuidePart4,
  ...deltaCreateTableNotebookGuidePart5,
  ...deltaCreateTableNotebookGuidePart6,
  ...deltaCreateTableNotebookGuidePart7,
  ...deltaCreateTableNotebookGuidePart8,
]);

import { createNotebookGuideManifest } from "../builder";
import { startupErpNotebookGuidePart0 } from "./parts/startup-erp-0";
import { startupErpNotebookGuidePart1 } from "./parts/startup-erp-1";
import { startupErpNotebookGuidePart2 } from "./parts/startup-erp-2";
import { startupErpNotebookGuidePart3 } from "./parts/startup-erp-3";

export const startupErpNotebookGuide = createNotebookGuideManifest({
  resourceId: "startup-erp",
  upstreamRef: "ba6c71ba1efa12faf27746b2302c60cf26b66d20",
  path: "notebooks/01_bronze_generate_startup_erp_data.py",
  reviewedAt: "23 jul 2026",
}, [
  ...startupErpNotebookGuidePart0,
  ...startupErpNotebookGuidePart1,
  ...startupErpNotebookGuidePart2,
  ...startupErpNotebookGuidePart3,
]);

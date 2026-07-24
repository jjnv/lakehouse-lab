import { createNotebookGuideManifest } from "../builder";
import { deltaCdfNotebookGuidePart0 } from "./parts/delta-cdf-0";
import { deltaCdfNotebookGuidePart1 } from "./parts/delta-cdf-1";
import { deltaCdfNotebookGuidePart2 } from "./parts/delta-cdf-2";
import { deltaCdfNotebookGuidePart3 } from "./parts/delta-cdf-3";
import { deltaCdfNotebookGuidePart4 } from "./parts/delta-cdf-4";
import { deltaCdfNotebookGuidePart5 } from "./parts/delta-cdf-5";
import { deltaCdfNotebookGuidePart6 } from "./parts/delta-cdf-6";
import { deltaCdfNotebookGuidePart7 } from "./parts/delta-cdf-7";
import { deltaCdfNotebookGuidePart8 } from "./parts/delta-cdf-8";
import { deltaCdfNotebookGuidePart9 } from "./parts/delta-cdf-9";
import { deltaCdfNotebookGuidePart10 } from "./parts/delta-cdf-10";
import { deltaCdfNotebookGuidePart11 } from "./parts/delta-cdf-11";
import { deltaCdfNotebookGuidePart12 } from "./parts/delta-cdf-12";

export const deltaCdfNotebookGuide = createNotebookGuideManifest({
  resourceId: "delta-cdf",
  upstreamRef: "82ed21472bcd9801f0919b98a5afe9f40b3fcd74",
  path: "notebooks/pyspark/change-data-feed.ipynb",
  reviewedAt: "23 jul 2026",
}, [
  ...deltaCdfNotebookGuidePart0,
  ...deltaCdfNotebookGuidePart1,
  ...deltaCdfNotebookGuidePart2,
  ...deltaCdfNotebookGuidePart3,
  ...deltaCdfNotebookGuidePart4,
  ...deltaCdfNotebookGuidePart5,
  ...deltaCdfNotebookGuidePart6,
  ...deltaCdfNotebookGuidePart7,
  ...deltaCdfNotebookGuidePart8,
  ...deltaCdfNotebookGuidePart9,
  ...deltaCdfNotebookGuidePart10,
  ...deltaCdfNotebookGuidePart11,
  ...deltaCdfNotebookGuidePart12,
]);

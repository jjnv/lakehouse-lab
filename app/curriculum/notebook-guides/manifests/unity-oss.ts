import { createNotebookGuideManifest } from "../builder";
import { unityOssNotebookGuidePart0 } from "./parts/unity-oss-0";

export const unityOssNotebookGuide = createNotebookGuideManifest({
  resourceId: "unity-oss",
  upstreamRef: "3c831260ecf308137943335fade3eaf278f735f2",
  path: "docs/quickstart.md",
  reviewedAt: "23 jul 2026",
}, [
  ...unityOssNotebookGuidePart0,
]);

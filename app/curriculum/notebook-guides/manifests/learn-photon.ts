import { createNotebookGuideManifest } from "../builder";
import { learnPhotonNotebookGuidePart0 } from "./parts/learn-photon-0";

export const learnPhotonNotebookGuide = createNotebookGuideManifest({
  resourceId: "learn-photon",
  upstreamRef: "08c378cf95c0c1f16b9a7db25b6c7a01a643dd72",
  path: "Photon.py",
  reviewedAt: "23 jul 2026",
}, [
  ...learnPhotonNotebookGuidePart0,
]);

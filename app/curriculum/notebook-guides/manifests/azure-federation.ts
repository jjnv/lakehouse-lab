import { createNotebookGuideManifest } from "../builder";
import { azureFederationNotebookGuidePart0 } from "./parts/azure-federation-0";
import { azureFederationNotebookGuidePart1 } from "./parts/azure-federation-1";
import { azureFederationNotebookGuidePart2 } from "./parts/azure-federation-2";
import { azureFederationNotebookGuidePart3 } from "./parts/azure-federation-3";

export const azureFederationNotebookGuide = createNotebookGuideManifest({
  resourceId: "azure-federation",
  upstreamRef: "2fcc3dbaf53bcfc691b9f598887d7c09db5b3512",
  path: "06-unity-catalog-fabric-mirror/notebooks/01-prepare-unity-catalog-tables.py",
  reviewedAt: "23 jul 2026",
}, [
  ...azureFederationNotebookGuidePart0,
  ...azureFederationNotebookGuidePart1,
  ...azureFederationNotebookGuidePart2,
  ...azureFederationNotebookGuidePart3,
]);

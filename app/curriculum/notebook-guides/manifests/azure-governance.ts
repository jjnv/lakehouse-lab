import { createNotebookGuideManifest } from "../builder";
import { azureGovernanceNotebookGuidePart0 } from "./parts/azure-governance-0";
import { azureGovernanceNotebookGuidePart1 } from "./parts/azure-governance-1";
import { azureGovernanceNotebookGuidePart2 } from "./parts/azure-governance-2";
import { azureGovernanceNotebookGuidePart3 } from "./parts/azure-governance-3";
import { azureGovernanceNotebookGuidePart4 } from "./parts/azure-governance-4";
import { azureGovernanceNotebookGuidePart5 } from "./parts/azure-governance-5";
import { azureGovernanceNotebookGuidePart6 } from "./parts/azure-governance-6";

export const azureGovernanceNotebookGuide = createNotebookGuideManifest({
  resourceId: "azure-governance",
  upstreamRef: "2fcc3dbaf53bcfc691b9f598887d7c09db5b3512",
  path: "09-unity-catalog-purview/notebooks/03-lineage-and-classification.py",
  reviewedAt: "23 jul 2026",
}, [
  ...azureGovernanceNotebookGuidePart0,
  ...azureGovernanceNotebookGuidePart1,
  ...azureGovernanceNotebookGuidePart2,
  ...azureGovernanceNotebookGuidePart3,
  ...azureGovernanceNotebookGuidePart4,
  ...azureGovernanceNotebookGuidePart5,
  ...azureGovernanceNotebookGuidePart6,
]);

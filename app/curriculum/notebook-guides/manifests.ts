import type { NotebookGuideManifest } from "./types";
import { learnNotebookGuide } from "./manifests/learn";
import { learnPhotonNotebookGuide } from "./manifests/learn-photon";
import { startupErpNotebookGuide } from "./manifests/startup-erp";
import { bestPracticesNotebookGuide } from "./manifests/best-practices";
import { databricksExamplesNotebookGuide } from "./manifests/databricks-examples";
import { deltaQuickstartNotebookGuide } from "./manifests/delta-quickstart";
import { deltaCreateTableNotebookGuide } from "./manifests/delta-create-table";
import { deltaCdfNotebookGuide } from "./manifests/delta-cdf";
import { deltaExamplesNotebookGuide } from "./manifests/delta-examples";
import { yokawasaNotebooksNotebookGuide } from "./manifests/yokawasa-notebooks";
import { yokawasaEventhubNotebookGuide } from "./manifests/yokawasa-eventhub";
import { azureIngestionNotebookGuide } from "./manifests/azure-ingestion";
import { azureGovernanceNotebookGuide } from "./manifests/azure-governance";
import { azureFederationNotebookGuide } from "./manifests/azure-federation";
import { crdbNotebookGuide } from "./manifests/crdb";
import { finopsNotebookGuide } from "./manifests/finops";
import { costNotebookGuide } from "./manifests/cost";
import { lighthouseNotebookGuide } from "./manifests/lighthouse";
import { unityOssNotebookGuide } from "./manifests/unity-oss";

export {
  learnNotebookGuide,
  learnPhotonNotebookGuide,
  startupErpNotebookGuide,
  bestPracticesNotebookGuide,
  databricksExamplesNotebookGuide,
  deltaQuickstartNotebookGuide,
  deltaCreateTableNotebookGuide,
  deltaCdfNotebookGuide,
  deltaExamplesNotebookGuide,
  yokawasaNotebooksNotebookGuide,
  yokawasaEventhubNotebookGuide,
  azureIngestionNotebookGuide,
  azureGovernanceNotebookGuide,
  azureFederationNotebookGuide,
  crdbNotebookGuide,
  finopsNotebookGuide,
  costNotebookGuide,
  lighthouseNotebookGuide,
  unityOssNotebookGuide,
};

export const notebookGuideManifests = [
  learnNotebookGuide,
  learnPhotonNotebookGuide,
  startupErpNotebookGuide,
  bestPracticesNotebookGuide,
  databricksExamplesNotebookGuide,
  deltaQuickstartNotebookGuide,
  deltaCreateTableNotebookGuide,
  deltaCdfNotebookGuide,
  deltaExamplesNotebookGuide,
  yokawasaNotebooksNotebookGuide,
  yokawasaEventhubNotebookGuide,
  azureIngestionNotebookGuide,
  azureGovernanceNotebookGuide,
  azureFederationNotebookGuide,
  crdbNotebookGuide,
  finopsNotebookGuide,
  costNotebookGuide,
  lighthouseNotebookGuide,
  unityOssNotebookGuide,
] as const satisfies readonly NotebookGuideManifest[];

const notebookGuideByResourceId = new Map(
  notebookGuideManifests.map((manifest) => [manifest.resourceId, manifest]),
);

export function findNotebookGuide(resourceId: string): NotebookGuideManifest | null {
  return notebookGuideByResourceId.get(resourceId) ?? null;
}

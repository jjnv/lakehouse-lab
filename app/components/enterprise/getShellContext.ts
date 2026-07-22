import { requireLearner } from "../../enterprise/auth";
import { getOrganizationBranding } from "../../enterprise/store";

export async function requireEnterprisePageContext(returnTo: string) {
  const learner = await requireLearner(returnTo);
  const brand = await getOrganizationBranding(learner.organization.id);
  return { brand, learner, userDisplayName: learner.user.displayName };
}

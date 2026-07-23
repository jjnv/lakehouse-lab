import { getLearner, requireLearner } from "../../enterprise/auth";
import { DEFAULT_BRAND_CONFIG } from "../../enterprise/brand";
import { getOrganizationBranding } from "../../enterprise/store";

export async function requireEnterprisePageContext(returnTo: string) {
  const learner = await requireLearner(returnTo);
  const brand = await getOrganizationBranding(learner.organization.id);
  return { brand, learner, userDisplayName: learner.user.displayName };
}

export async function getOptionalEnterprisePageContext() {
  const learner = await getLearner();
  if (!learner) {
    return {
      brand: DEFAULT_BRAND_CONFIG,
      learner: null,
      userDisplayName: undefined,
    };
  }
  const brand = await getOrganizationBranding(learner.organization.id);
  return { brand, learner, userDisplayName: learner.user.displayName };
}

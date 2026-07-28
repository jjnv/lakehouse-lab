import { getLearner, requireLearner } from "../../enterprise/auth";
import { DEFAULT_BRAND_CONFIG, localizeBrandConfig } from "../../enterprise/brand";
import { getOrganizationBranding } from "../../enterprise/store";
import { getRequestLocale } from "../../i18n/server";

export async function requireEnterprisePageContext(returnTo: string) {
  const learner = await requireLearner(returnTo);
  const brand = await getOrganizationBranding(learner.organization.id);
  return { brand: localizeBrandConfig(brand, learner.user.locale), learner, userDisplayName: learner.user.displayName, locale: learner.user.locale };
}

export async function getOptionalEnterprisePageContext() {
  const learner = await getLearner();
  if (!learner) {
    const locale = await getRequestLocale();
    return {
      brand: localizeBrandConfig(DEFAULT_BRAND_CONFIG, locale),
      learner: null,
      userDisplayName: undefined,
      locale,
    };
  }
  const brand = await getOrganizationBranding(learner.organization.id);
  return { brand: localizeBrandConfig(brand, learner.user.locale), learner, userDisplayName: learner.user.displayName, locale: learner.user.locale };
}

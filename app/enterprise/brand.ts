import type { BrandConfig, BrandValidationIssue, BrandValidationResult } from "./types";

export const DEFAULT_BRAND_CONFIG: BrandConfig = Object.freeze({
  organizationName: "Lakehouse Lab",
  productName: "Preparación Databricks Data Engineer",
  logoUrl: "/logo-mark.svg",
  logoAlt: "Lakehouse Lab",
  primaryColor: "#20242C",
  accentColor: "#A93216",
  supportUrl: null,
  privacyUrl: null,
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" ? value.trim() : value;
}

function validWebUrl(value: string, allowMailto = false) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (allowMailto && value.startsWith("mailto:")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice("mailto:".length));
  }
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(first: string, second: string) {
  if (!HEX_COLOR.test(first) || !HEX_COLOR.test(second)) return 0;
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateBrandConfig(value: unknown): BrandValidationResult {
  if (!isRecord(value)) {
    return { success: false, data: null, issues: [{ field: "root", message: "La configuración de marca debe ser un objeto." }] };
  }

  const candidate = {
    ...DEFAULT_BRAND_CONFIG,
    ...value,
    organizationName: typeof value.organizationName === "string" ? value.organizationName.trim() : value.organizationName,
    productName: typeof value.productName === "string" ? value.productName.trim() : value.productName,
    logoUrl: optionalString(value.logoUrl),
    logoAlt: optionalString(value.logoAlt),
    supportUrl: optionalString(value.supportUrl),
    privacyUrl: optionalString(value.privacyUrl),
  } as Record<keyof BrandConfig, unknown>;
  const issues: BrandValidationIssue[] = [];

  for (const field of ["organizationName", "productName"] as const) {
    const text = candidate[field];
    if (typeof text !== "string" || text.length < 2 || text.length > 80) {
      issues.push({ field, message: "Debe contener entre 2 y 80 caracteres." });
    }
  }

  for (const field of ["primaryColor", "accentColor"] as const) {
    const color = candidate[field];
    if (typeof color !== "string" || !HEX_COLOR.test(color)) {
      issues.push({ field, message: "Usa un color hexadecimal de seis dígitos, por ejemplo #694BB5." });
    } else if (contrastRatio(color, "#FFFFFF") < 4.5) {
      issues.push({ field, message: "El color necesita un contraste mínimo de 4.5:1 frente a blanco." });
    }
  }

  const logoUrl = candidate.logoUrl;
  const logoAlt = candidate.logoAlt;
  if (logoUrl !== null && (typeof logoUrl !== "string" || !validWebUrl(logoUrl))) {
    issues.push({ field: "logoUrl", message: "Usa una ruta local o una URL HTTPS." });
  }
  if (logoUrl !== null && (typeof logoAlt !== "string" || logoAlt.length < 2 || logoAlt.length > 120)) {
    issues.push({ field: "logoAlt", message: "Un logotipo necesita texto alternativo de 2 a 120 caracteres." });
  }
  if (logoUrl === null && logoAlt !== null) {
    issues.push({ field: "logoAlt", message: "No definas texto alternativo sin un logotipo." });
  }

  for (const [field, allowMailto] of [["supportUrl", true], ["privacyUrl", false]] as const) {
    const url = candidate[field];
    if (url !== null && (typeof url !== "string" || !validWebUrl(url, allowMailto))) {
      issues.push({ field, message: allowMailto ? "Usa una ruta local, URL HTTPS o dirección mailto válida." : "Usa una ruta local o URL HTTPS." });
    }
  }

  if (issues.length) return { success: false, data: null, issues };

  return {
    success: true,
    data: {
      organizationName: candidate.organizationName as string,
      productName: candidate.productName as string,
      logoUrl: candidate.logoUrl as string | null,
      logoAlt: candidate.logoAlt as string | null,
      primaryColor: (candidate.primaryColor as string).toUpperCase(),
      accentColor: (candidate.accentColor as string).toUpperCase(),
      supportUrl: candidate.supportUrl as string | null,
      privacyUrl: candidate.privacyUrl as string | null,
    },
    issues: [],
  };
}

export type TenantBrandOverrides = Readonly<{
  organizationName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
}>;

function validOrganizationName(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length >= 2 && normalized.length <= 80 ? normalized : null;
}

function accessibleColor(value: string | undefined, current: string, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) return current;
  return normalized && HEX_COLOR.test(normalized) && contrastRatio(normalized, "#FFFFFF") >= 4.5
    ? normalized.toUpperCase()
    : fallback;
}

function validSupportEmail(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

/** Applies runtime brand variables independently so one invalid value cannot break access. */
export function resolveTenantBrandConfig(base: BrandConfig, overrides: TenantBrandOverrides): BrandConfig {
  const organizationName = validOrganizationName(overrides.organizationName) ?? base.organizationName;
  const configuredLogo = overrides.logoUrl?.trim();
  const logoUrl = configuredLogo && validWebUrl(configuredLogo) ? configuredLogo : base.logoUrl;
  const supportEmail = validSupportEmail(overrides.supportEmail);
  return {
    ...base,
    organizationName,
    logoUrl,
    logoAlt: logoUrl ? `${organizationName} · logotipo` : null,
    primaryColor: accessibleColor(overrides.primaryColor, base.primaryColor, DEFAULT_BRAND_CONFIG.primaryColor),
    accentColor: accessibleColor(overrides.accentColor, base.accentColor, DEFAULT_BRAND_CONFIG.accentColor),
    supportUrl: supportEmail ? `mailto:${supportEmail}` : base.supportUrl,
  };
}

export function parseBrandConfig(value: unknown): BrandConfig {
  const result = validateBrandConfig(value);
  if (result.success) return result.data;
  throw new BrandConfigError(result.issues);
}

export class BrandConfigError extends Error {
  readonly issues: BrandValidationIssue[];

  constructor(issues: BrandValidationIssue[]) {
    super(`Configuración de marca inválida: ${issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ")}`);
    this.name = "BrandConfigError";
    this.issues = issues;
  }
}

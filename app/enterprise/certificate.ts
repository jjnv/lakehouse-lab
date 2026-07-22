/**
 * Rendering-neutral certificate specification.
 *
 * A future PDF renderer can consume this structure without making eligibility
 * decisions or importing assessment answer material.
 */

import { stableOpaqueId } from "./assessment";
import {
  evaluateAssessmentForCredential,
  type AssessmentResult,
  type CredentialEligibilityDecision,
} from "./assessment-private";

export const CERTIFICATE_SCHEMA_VERSION = "1.0" as const;
export const INTERNAL_CERTIFICATE_DISCLAIMER = "Certificado interno de finalización; no constituye una certificación oficial de Databricks ni una evaluación proctorizada";

export type CertificateSpecification = Readonly<{
  schemaVersion: typeof CERTIFICATE_SCHEMA_VERSION;
  certificateId: string;
  issuedAt: string;
  locale: string;
  language: string;
  page: Readonly<{
    size: "A4";
    orientation: "landscape";
  }>;
  learner: Readonly<{
    displayName: string;
  }>;
  issuer: Readonly<{
    name: string;
    signatoryName?: string;
    signatoryRole?: string;
  }>;
  credential: Readonly<{
    id: string;
    title: string;
    courseVersion: string;
    level?: string;
  }>;
  achievement: Readonly<{
    completedAt: string;
    assessmentId: string;
    attemptId: string;
    policyId: string;
    scorePercent: number;
    thresholdPercent: number;
  }>;
  verification: Readonly<{
    code: string;
    url: string | null;
    method: "online-record";
    cryptographicallySigned: false;
  }>;
  content: Readonly<{
    heading: string;
    awardedToLabel: string;
    achievementStatement: string;
    scoreStatement: string;
    verificationLabel: string;
    disclaimer: typeof INTERNAL_CERTIFICATE_DISCLAIMER;
  }>;
  accessibility: Readonly<{
    documentTitle: string;
    alternativeSummary: string;
    readingOrder: readonly ["heading", "learner", "achievement", "issuer", "verification"];
  }>;
}>;

export type CertificateSpecificationInput = Readonly<{
  learner: Readonly<{
    id: string;
    displayName: string;
  }>;
  issuer: Readonly<{
    name: string;
    signatoryName?: string;
    signatoryRole?: string;
  }>;
  credential: Readonly<{
    id: string;
    title: string;
    courseVersion: string;
    level?: string;
  }>;
  qualifyingResult: AssessmentResult;
  issuedAt: string;
  locale?: string;
  verificationBaseUrl?: string;
}>;

export class CertificateEligibilityError extends Error {
  readonly decision: CredentialEligibilityDecision;

  constructor(decision: CredentialEligibilityDecision) {
    super(decision.reason);
    this.name = "CertificateEligibilityError";
    this.decision = decision;
  }
}

export function buildCertificateSpecification(
  input: CertificateSpecificationInput,
): CertificateSpecification {
  const decision = evaluateAssessmentForCredential(input.qualifyingResult);
  if (!decision.eligible) throw new CertificateEligibilityError(decision);

  assertRequiredText(input.learner.id, "learner.id");
  assertRequiredText(input.learner.displayName, "learner.displayName");
  assertRequiredText(input.issuer.name, "issuer.name");
  assertRequiredText(input.credential.id, "credential.id");
  assertRequiredText(input.credential.title, "credential.title");
  assertRequiredText(input.credential.courseVersion, "credential.courseVersion");

  const issuedAt = parseIsoInstant(input.issuedAt, "issuedAt");
  const completedAt = parseIsoInstant(input.qualifyingResult.submittedAt, "qualifyingResult.submittedAt");
  if (Date.parse(issuedAt) < Date.parse(completedAt)) {
    throw new RangeError("issuedAt cannot precede the qualifying assessment");
  }

  const locale = normalizeLocale(input.locale ?? "es-ES");
  const language = locale.split("-")[0].toLowerCase();
  const certificateId = stableOpaqueId(
    "cert",
    input.learner.id,
    input.credential.id,
    input.credential.courseVersion,
    input.qualifyingResult.attemptId,
  );
  const verificationCode = stableOpaqueId(
    "verify",
    certificateId,
    input.qualifyingResult.assessmentId,
    input.qualifyingResult.attemptId,
  ).replace("verify_", "").toUpperCase();
  const verificationUrl = input.verificationBaseUrl
    ? buildVerificationUrl(input.verificationBaseUrl, certificateId, verificationCode)
    : null;
  const roundedScore = input.qualifyingResult.scorePercent.toLocaleString(locale, {
    maximumFractionDigits: 2,
  });
  const heading = "Certificado de finalización";
  const achievementStatement = `${input.learner.displayName} ha completado ${input.credential.title}.`;
  const scoreStatement = `Resultado: ${roundedScore} %, con un umbral de ${decision.thresholdPercent} %.`;

  return {
    schemaVersion: CERTIFICATE_SCHEMA_VERSION,
    certificateId,
    issuedAt,
    locale,
    language,
    page: { size: "A4", orientation: "landscape" },
    learner: { displayName: input.learner.displayName.trim() },
    issuer: {
      name: input.issuer.name.trim(),
      ...(input.issuer.signatoryName?.trim() ? { signatoryName: input.issuer.signatoryName.trim() } : {}),
      ...(input.issuer.signatoryRole?.trim() ? { signatoryRole: input.issuer.signatoryRole.trim() } : {}),
    },
    credential: {
      id: input.credential.id,
      title: input.credential.title.trim(),
      courseVersion: input.credential.courseVersion,
      ...(input.credential.level?.trim() ? { level: input.credential.level.trim() } : {}),
    },
    achievement: {
      completedAt,
      assessmentId: input.qualifyingResult.assessmentId,
      attemptId: input.qualifyingResult.attemptId,
      policyId: input.qualifyingResult.policyId,
      scorePercent: input.qualifyingResult.scorePercent,
      thresholdPercent: decision.thresholdPercent,
    },
    verification: {
      code: verificationCode,
      url: verificationUrl,
      method: "online-record",
      cryptographicallySigned: false,
    },
    content: {
      heading,
      awardedToLabel: "Otorgado a",
      achievementStatement,
      scoreStatement,
      verificationLabel: "Verificación del certificado",
      disclaimer: INTERNAL_CERTIFICATE_DISCLAIMER,
    },
    accessibility: {
      documentTitle: `${heading}: ${input.credential.title} — ${input.learner.displayName}`,
      alternativeSummary: `${achievementStatement} ${scoreStatement} Emitido por ${input.issuer.name}. ${INTERNAL_CERTIFICATE_DISCLAIMER}.`,
      readingOrder: ["heading", "learner", "achievement", "issuer", "verification"],
    },
  };
}

function buildVerificationUrl(base: string, certificateId: string, code: string): string {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new TypeError("verificationBaseUrl must be an absolute URL");
  }
  if (url.protocol !== "https:") throw new TypeError("verificationBaseUrl must use HTTPS");
  url.searchParams.set("certificate", certificateId);
  url.searchParams.set("code", code);
  return url.toString();
}

function normalizeLocale(locale: string): string {
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    throw new TypeError("locale must be a valid BCP 47 locale");
  }
}

function assertRequiredText(value: string, field: string): void {
  if (!value.trim()) throw new TypeError(`${field} is required`);
}

function parseIsoInstant(value: string, field: string): string {
  const timestamp = Date.parse(value);
  if (!value || !Number.isFinite(timestamp)) throw new TypeError(`${field} must be a valid ISO date-time`);
  return new Date(timestamp).toISOString();
}

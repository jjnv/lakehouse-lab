import { createHash, randomBytes } from "node:crypto";

export const RECOVERY_CODE_TTL_DAYS = 90;
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;

const RECOVERY_CODE_PATTERN = /^LLR-(?:[A-F0-9]{8}-){4}[A-F0-9]{8}$/u;

function sha256(namespace: string, secret: string) {
  return createHash("sha256").update(`${namespace}\0${secret}`, "utf8").digest("hex");
}

export function generateRecoveryCode() {
  const secret = randomBytes(20).toString("hex").toUpperCase();
  return `LLR-${secret.match(/.{8}/gu)!.join("-")}`;
}

export function normalizeRecoveryCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return RECOVERY_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function hashRecoveryCode(value: unknown) {
  const normalized = normalizeRecoveryCode(value);
  return normalized ? sha256("lakehouse-recovery-v1", normalized) : null;
}

export function hashSessionToken(token: string) {
  return sha256("lakehouse-session-v1", token);
}

export function expiryIsoFromNow(seconds: number, now = new Date()) {
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

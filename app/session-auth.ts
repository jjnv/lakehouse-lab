import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  expiryIsoFromNow,
  hashSessionToken,
  SESSION_TTL_SECONDS,
} from "./enterprise/anonymous-recovery";
import { resolveAnonymousSession } from "./enterprise/store";

export type SessionUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  sessionHash: string;
  sessionExpiresAt: string;
  needsBinding: boolean;
};

export const SESSION_COOKIE_NAME = "lakehouse_session";
const SESSION_PATTERN = /^[a-f0-9]{64}$/u;
const SIGN_IN_PATH = "/entrar";

async function currentSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Deterministic development identities keep automated and local testing
  // isolated without introducing a production backdoor.
  if (process.env.NODE_ENV !== "production") {
    const requestHeaders = await headers();
    sessionId = requestHeaders.get("x-lakehouse-test-session")
      ?? process.env.LAKEHOUSE_DEV_SESSION_ID?.trim()
      ?? sessionId;
  }
  return sessionId && SESSION_PATTERN.test(sessionId) ? sessionId : null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionId = await currentSessionId();
  if (!sessionId) return null;
  const sessionHash = hashSessionToken(sessionId);
  const stored = await resolveAnonymousSession(sessionHash);
  if (stored.status === "inactive") return null;
  if (stored.status === "active") {
    return {
      ...stored.identity,
      sessionHash,
      sessionExpiresAt: stored.expiresAt,
      needsBinding: false,
    };
  }

  // Backward-compatible enrollment for cookies issued before server-side
  // anonymous sessions existed. The hash-derived identity is bound on the
  // first protected request without changing the learner or their progress.
  const identityHash = createHash("sha256").update(sessionId).digest("hex");

  return {
    displayName: "Estudiante",
    email: `device-${identityHash.slice(0, 40)}@lakehouse.invalid`,
    fullName: null,
    sessionHash,
    sessionExpiresAt: sessionExpiryIso(),
    needsBinding: true,
  };
}

export async function requireSessionUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(sessionStartPath(returnTo));
}

export function createSessionId(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiryIso() {
  return expiryIsoFromNow(SESSION_TTL_SECONDS);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getCurrentSessionHash() {
  const sessionId = await currentSessionId();
  return sessionId ? hashSessionToken(sessionId) : null;
}

export function sessionStartPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    if (url.pathname === SIGN_IN_PATH) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

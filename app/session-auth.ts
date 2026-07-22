import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type SessionUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export const SESSION_COOKIE_NAME = "lakehouse_session";
const SESSION_PATTERN = /^[a-f0-9]{64}$/u;
const SIGN_IN_PATH = "/entrar";

export async function getSessionUser(): Promise<SessionUser | null> {
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

  if (!sessionId || !SESSION_PATTERN.test(sessionId)) return null;
  const identityHash = createHash("sha256").update(sessionId).digest("hex");

  return {
    displayName: "Estudiante",
    email: `device-${identityHash.slice(0, 40)}@lakehouse.invalid`,
    fullName: null,
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

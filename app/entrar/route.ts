import { NextRequest, NextResponse } from "next/server";
import {
  createSessionId,
  getSessionUser,
  safeRelativeReturnPath,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../session-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const returnTo = safeRelativeReturnPath(request.nextUrl.searchParams.get("return_to") ?? "/inicio");
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  // Re-entering must never detach a browser from an existing learner.
  if (!await getSessionUser()) {
    response.cookies.set(SESSION_COOKIE_NAME, createSessionId(), sessionCookieOptions());
  }
  return response;
}

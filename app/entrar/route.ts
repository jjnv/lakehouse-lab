import { NextRequest, NextResponse } from "next/server";
import { createSessionId, safeRelativeReturnPath, SESSION_COOKIE_NAME } from "../session-auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const returnTo = safeRelativeReturnPath(request.nextUrl.searchParams.get("return_to") ?? "/inicio");
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set(SESSION_COOKIE_NAME, createSessionId(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

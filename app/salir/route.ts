import { NextRequest, NextResponse } from "next/server";

// Backward-compatible destination for old bookmarks. Anonymous spaces remain
// attached to their private browser cookie until the user deletes site data.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

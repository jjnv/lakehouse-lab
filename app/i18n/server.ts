import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, localeFromValue, type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return localeFromValue(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export function localeCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PROJECT_DESCRIPTION, PROJECT_NAME, PROJECT_PUBLIC_URL, PROJECT_TAGLINE } from "./project-info";
import { openGraphLocale } from "./i18n/config";
import { getRequestLocale } from "./i18n/server";
import "./globals.css";
import "./public.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const title = locale === "en" ? "Data engineering with Databricks" : PROJECT_TAGLINE;
  const description = locale === "en"
    ? "Independent practical path to learn data engineering with Databricks, with lessons, labs, assessments, and practice exams aligned with Data Engineer Associate and Professional."
    : PROJECT_DESCRIPTION;
  return {
    metadataBase: new URL(PROJECT_PUBLIC_URL),
    title: { default: `${PROJECT_NAME} — ${title}`, template: `%s · ${PROJECT_NAME}` },
    description,
    applicationName: PROJECT_NAME,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${PROJECT_NAME} · ${title}`,
      description,
      type: "website",
      siteName: PROJECT_NAME,
      locale: openGraphLocale(locale),
      images: [{ url: "/og-public.png", width: 1734, height: 907, alt: `${PROJECT_NAME}: ${title}` }],
    },
    twitter: { card: "summary_large_image", title: PROJECT_NAME, description, images: ["/og-public.png"] },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/logo-mark.svg" },
    manifest: "/manifest.webmanifest",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return <html lang={locale}><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}<Analytics /></body></html>;
}

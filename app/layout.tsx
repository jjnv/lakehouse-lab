import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PROJECT_DESCRIPTION, PROJECT_NAME, PROJECT_PUBLIC_URL, PROJECT_TAGLINE } from "./project-info";
import "./globals.css";
import "./public.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(PROJECT_PUBLIC_URL),
    title: { default: `${PROJECT_NAME} — ${PROJECT_TAGLINE}`, template: `%s · ${PROJECT_NAME}` },
    description: PROJECT_DESCRIPTION,
    applicationName: PROJECT_NAME,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${PROJECT_NAME} · Ingeniería de datos con Databricks`,
      description: PROJECT_DESCRIPTION,
      type: "website",
      siteName: PROJECT_NAME,
      locale: "es_ES",
      images: [{ url: "/og-public.png", width: 1734, height: 907, alt: `${PROJECT_NAME}: ${PROJECT_TAGLINE}` }],
    },
    twitter: { card: "summary_large_image", title: PROJECT_NAME, description: PROJECT_DESCRIPTION, images: ["/og-public.png"] },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/logo-mark.svg" },
    manifest: "/manifest.webmanifest",
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}

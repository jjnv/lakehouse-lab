import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "databricks-learning-path.jjxn.chatgpt.site";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Lakehouse Lab — Academia Databricks Data Engineering",
    description: "Academia autosuficiente con 32 módulos, 160 capítulos conceptuales y 100 horas para Data Engineer Associate y Professional.",
    openGraph: {
      title: "Lakehouse Lab — 32 módulos · 100 horas",
      description: "Teoría profunda, casos razonados, laboratorios y simulacros de Data Engineer Associate a Professional.",
      type: "website",
      images: [{ url: "/og.png", width: 1744, height: 909, alt: "Lakehouse Lab: 32 módulos y 100 horas" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab — Academia Databricks",
      description: "32 módulos y 100 horas de teoría y práctica: Associate → Professional.",
      images: ["/og.png"],
    },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

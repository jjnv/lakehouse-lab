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
    description: "32 módulos y 100 horas de práctica para Data Engineer Associate y Professional.",
    openGraph: {
      title: "Lakehouse Lab — 32 módulos · 100 horas",
      description: "De Data Engineer Associate a Professional con lecciones, laboratorios y simulacros.",
      type: "website",
      images: [{ url: "/og.png", width: 1744, height: 909, alt: "Lakehouse Lab: 32 módulos y 100 horas" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab — Academia Databricks",
      description: "32 módulos y 100 horas: Associate → Professional.",
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

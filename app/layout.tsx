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
    title: "Lakehouse Lab v1.2.0 — Academia Databricks Data Engineering",
    description: "Academia Databricks limpia para el uso diario: continúa, aprende y explora 32 módulos con explicaciones progresivas y trazabilidad oficial.",
    openGraph: {
      title: "Lakehouse Lab v1.2.0 — De Associate a Professional",
      description: "Una experiencia diaria simplificada con 160 lecciones, trazabilidad oficial, práctica versionada y progreso local.",
      type: "website",
      images: [{ url: "/og-v1-1.png", width: 1744, height: 909, alt: "Lakehouse Lab: aprendizaje progresivo de Associate a Professional" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab v1.2.0 — Academia Databricks",
      description: "32 módulos explicados por capas en una interfaz diaria limpia, con blueprints auditables, práctica y XP.",
      images: ["/og-v1-1.png"],
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

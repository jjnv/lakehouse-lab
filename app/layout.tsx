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
    title: "Lakehouse Lab v1.0.0 — Academia Databricks Data Engineering",
    description: "Academia auditable con 32 módulos, 160 lecciones, laboratorios versionados, blueprints completos y gamificación para Data Engineer Associate y Professional.",
    openGraph: {
      title: "Lakehouse Lab v1.0.0 — De Associate a Professional",
      description: "32 módulos, 160 lecciones, trazabilidad oficial, laboratorios versionados y una ruta gamificada.",
      type: "website",
      images: [{ url: "/og-v1.png", width: 1744, height: 909, alt: "Lakehouse Lab v1.0.0: de Associate a Professional" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab v1.0.0 — Academia Databricks",
      description: "32 módulos y 160 lecciones con blueprints auditables, práctica versionada y XP.",
      images: ["/og-v1.png"],
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

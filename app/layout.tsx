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
    title: "Lakehouse Lab v1.1.0 — Academia Databricks Data Engineering",
    description: "Academia auditable con 32 módulos y 160 lecciones que introducen contexto, intuición, vocabulario y mecánica de forma progresiva.",
    openGraph: {
      title: "Lakehouse Lab v1.1.0 — De Associate a Professional",
      description: "160 lecciones explicadas paso a paso, con trazabilidad oficial, práctica versionada y una ruta gamificada.",
      type: "website",
      images: [{ url: "/og-v1-1.png", width: 1744, height: 909, alt: "Lakehouse Lab v1.1.0: aprendizaje progresivo de Associate a Professional" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab v1.1.0 — Academia Databricks",
      description: "32 módulos y 160 lecciones explicadas por capas, con blueprints auditables, práctica y XP.",
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

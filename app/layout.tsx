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
    title: "Lakehouse Lab v1.7.0 — Aprende Databricks practicando y repasando",
    description: "Ruta de Databricks Data Engineering con 32 módulos, recuerdo activo, repaso espaciado, laboratorios y trazabilidad oficial.",
    openGraph: {
      title: "Lakehouse Lab v1.7.0 — De Associate a Professional",
      description: "Domina Databricks practicando, explicando y repasando a lo largo de 32 módulos trazables.",
      type: "website",
      images: [{ url: "/og.png", width: 1731, height: 909, alt: "Lakehouse Lab: domina Databricks practicando, explicando y repasando" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab v1.7.0 — Academia Databricks",
      description: "32 módulos con recuerdo activo, repaso espaciado, práctica y blueprints auditables.",
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

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
    title: {
      default: "Lakehouse Lab Enterprise — Academia interna",
      template: "%s · Lakehouse Lab",
    },
    description: "Portal interno de formación Databricks con una ruta Professional de 20 semanas, práctica guiada y progreso sincronizado.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "Lakehouse Lab Enterprise",
      description: "Formación Databricks que se practica, se mide y se conserva.",
      type: "website",
      images: [{ url: "/og.png", width: 1731, height: 909, alt: "Lakehouse Lab Enterprise: ruta interna de aprendizaje Databricks" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lakehouse Lab Enterprise",
      description: "Formación Databricks que se practica, se mide y se conserva.",
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

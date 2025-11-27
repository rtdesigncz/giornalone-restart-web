import "./globals.css";
import { Inter, Outfit } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import AgentWidget from "@/components/ai/AgentWidget";
import type { Metadata, Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

// nuovo export per viewport (colore barra browser / splash)
export const viewport: Viewport = {
  themeColor: "#21b5ba",
};

export const metadata: Metadata = {
  title: "Giornalone Restart",
  description: "Gestionale appuntamenti - Restart Fitness Club",

  // collega il manifest PWA
  manifest: "/manifest.json",

  // icone
  icons: {
    icon: [{ url: "/favicon-v2.ico?v=3", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased min-h-screen">
        <MainLayout>{children}</MainLayout> {/* Wrapped children with MainLayout */}
        <AgentWidget />
      </body>
    </html>
  );
}
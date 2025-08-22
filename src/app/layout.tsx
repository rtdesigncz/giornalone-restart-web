import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Giornalone Restart",
  description: "Gestionale vendite & appuntamenti - Restart Fitness Club",

  // collega il manifest PWA
  manifest: "/manifest.json",

  // colore barra browser / splash
  themeColor: "#1eb4b9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
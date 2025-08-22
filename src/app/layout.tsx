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
  description: "Gestionale appuntamenti - Restart Fitness Club",

  // collega il manifest PWA
  manifest: "/manifest.json",

  // colore barra browser / splash (brand teal)
  themeColor: "#1eb4b9",

  // icone
  icons: {
    icon: [{ url: "/favicon-v2.ico?v=3", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180" }],
  },
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
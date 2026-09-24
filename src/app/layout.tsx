import "./globals.css";
import { Outfit } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import type { Metadata, Viewport } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: "#21b5ba",
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Giornalone Restart",
  description: "Gestionale appuntamenti - Restart Fitness Club",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-v2.ico?v=3", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-[#fbfbfb]">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}

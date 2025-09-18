// src/app/consulenze/page.tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import ConsulenzeClient from "./ConsulenzeClient";

export default function ConsulenzePage() {
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Header minimale */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b shadow-sm">
          <div className="px-3 md:px-4 lg:px-6 xl:px-8 py-3 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold">Consulenze</h1>
            <Link href="/" className="btn btn-brand">Torna al Giornalone</Link>
          </div>
        </header>

        <main className="flex-1 px-3 md:px-4 lg:px-6 xl:px-8 py-6">
          <ConsulenzeClient />
        </main>

        <footer className="py-6 text-center text-xs text-slate-500">
          © 2025 <span className="font-medium">Progettato da Roberto Tavano</span>
        </footer>
      </div>
    </Suspense>
  );
}
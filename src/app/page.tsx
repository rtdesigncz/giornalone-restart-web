// src/app/page.tsx
"use client";

import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import TopbarFilters from "@/components/TopbarFilters";
import SummaryCards from "@/components/SummaryCards";
import EntriesSection from "@/components/EntriesSection";
import ExportReportButton from "@/components/ExportReportButton";

export default function Home() {
  return (
    <AppShell>
      <section className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* Filtri */}
        <Suspense fallback={null}>
          <TopbarFilters />
        </Suspense>

        {/* Riepiloghi */}
        <Suspense fallback={null}>
          <SummaryCards />
        </Suspense>

        {/* Sezioni principali */}
        <Suspense fallback={null}>
          <EntriesSection title="TOUR SPONTANEI" />
        </Suspense>
        <Suspense fallback={null}>
          <EntriesSection title="APPUNTAMENTI RINNOVI E INTEGRAZIONI" />
        </Suspense>
        <Suspense fallback={null}>
          <EntriesSection title="APPUNTAMENTI (Pianificazione)" />
        </Suspense>
        <Suspense fallback={null}>
          <EntriesSection title="APPUNTAMENTI VERIFICHE DEL BISOGNO" />
        </Suspense>

        {/* Pulsante export report PDF */}
        <div className="flex justify-end mt-8">
          <Suspense fallback={null}>
            <ExportReportButton />
          </Suspense>
        </div>
      </section>
    </AppShell>
  );
}
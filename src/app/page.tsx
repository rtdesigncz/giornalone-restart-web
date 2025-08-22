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
    <Suspense fallback={null}>
      <AppShell>
        <section className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-8">
          {/* Filtri */}
          <TopbarFilters />

          {/* Riepiloghi */}
          <SummaryCards />

          {/* Sezioni principali */}
          <EntriesSection title="TOUR SPONTANEI" />
          <EntriesSection title="APPUNTAMENTI RINNOVI E INTEGRAZIONI" />
          <EntriesSection title="APPUNTAMENTI (Pianificazione)" />
          <EntriesSection title="APPUNTAMENTI VERIFICHE DEL BISOGNO" />

          {/* Pulsante export report PDF */}
          <div className="flex justify-end mt-8">
            <ExportReportButton />
          </div>
        </section>
      </AppShell>
    </Suspense>
  );
}
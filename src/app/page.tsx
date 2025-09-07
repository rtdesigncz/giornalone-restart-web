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
        <section className="px-3 md:px-4 lg:px-6 xl:px-8 py-6 space-y-8">
          {/* Filtri */}
          <TopbarFilters />

          {/* Riepiloghi */}
          <SummaryCards />

          {/* Sezioni principali */}
          <EntriesSection title="TOUR SPONTANEI" />
          <EntriesSection title="APPUNTAMENTI RINNOVI E INTEGRAZIONI" />
          <EntriesSection title="APPUNTAMENTI (Pianificazione)" />
          <EntriesSection title="APPUNTAMENTI VERIFICHE DEL BISOGNO" />
          {/* Nuova sezione in fondo */}
          <EntriesSection title="APPUNTAMENTI TELEFONICI" />

          {/* Pulsante export report PDF */}
          <div className="flex justify-end mt-8">
            <ExportReportButton />
          </div>
        </section>
      </AppShell>
    </Suspense>
  );
}
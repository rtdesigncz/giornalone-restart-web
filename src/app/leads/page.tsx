// src/app/leads/page.tsx
"use client";

import { Suspense } from "react";
import LeadsClient from "./LeadsClient";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Caricamento Leads...</div>}>
      <LeadsClient />
    </Suspense>
  );
}

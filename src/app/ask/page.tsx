// src/app/ask/page.tsx
"use client";

import { Suspense } from "react";
import AskClient from "./AskClient";

export default function AskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Caricamento assistente dati...</div>}>
      <AskClient />
    </Suspense>
  );
}

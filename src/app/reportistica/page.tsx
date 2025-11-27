// src/app/reportistica/page.tsx
"use client";

import { Suspense } from "react";
import ReportisticaClientV2 from "./ReportisticaClientV2";

export default function ReportisticaPage() {
  return (
    <Suspense fallback={null}>
      <ReportisticaClientV2 />
    </Suspense>
  );
}
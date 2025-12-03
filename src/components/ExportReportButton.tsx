// src/components/ExportReportButton.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { FileDown } from "lucide-react";

export default function ExportReportButton() {
  const sp = useSearchParams();
  const query = sp?.toString() ?? "";
  const href = `/api/report?${query}`;

  return (
    <a
      href={href}
      className="btn btn-brand flex items-center gap-2"
      title="Scarica Report PDF"
    >
      <FileDown className="w-5 h-5 text-red-600" />
      Scarica Report PDF
    </a>
  );
}
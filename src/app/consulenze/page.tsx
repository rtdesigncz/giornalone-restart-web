// src/app/consulenze/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConsulenzeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const dest = qs ? `/leads?${qs}` : "/leads";
    router.replace(dest);
  }, [router, searchParams]);

  return <div className="p-8 text-center text-slate-400">Reindirizzamento a Leads...</div>;
}

export default function ConsulenzePage() {
  return (
    <Suspense fallback={null}>
      <ConsulenzeRedirect />
    </Suspense>
  );
}

// src/app/consulenze/page.tsx
"use client";

import { Suspense } from "react";
import ConsulenzeClientV2 from "./ConsulenzeClientV2";

export default function ConsulenzePage() {
  return (
    <Suspense fallback={null}>
      <ConsulenzeClientV2 />
    </Suspense>
  );
}
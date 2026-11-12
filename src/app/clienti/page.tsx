// src/app/clienti/page.tsx
export const dynamic = "force-dynamic";

import ClientiClient from "./ClientiClient";

export const metadata = {
  title: "Anagrafica Clienti • Giornalone Restart",
  description: "Anagrafica clienti sincronizzata con Wellness in Cloud",
};

export default function ClientiPage() {
  return <ClientiClient />;
}

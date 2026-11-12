// src/app/rinnovi/page.tsx
export const dynamic = "force-dynamic";

import RinnoviClient from "./RinnoviClient";

export const metadata = {
  title: "Gestione Rinnovi • Giornalone Restart",
  description: "Campagne rinnovi sincronizzate in tempo reale con l'Agenda e Wellness in Cloud",
};

export default function RinnoviPage() {
  return <RinnoviClient />;
}

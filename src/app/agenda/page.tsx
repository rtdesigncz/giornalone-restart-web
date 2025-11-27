import AgendaView from "@/components/agenda/AgendaView";
import { Suspense } from "react";

export default function AgendaPage() {
    return (
        <Suspense fallback={<div>Caricamento agenda...</div>}>
            <AgendaView />
        </Suspense>
    );
}

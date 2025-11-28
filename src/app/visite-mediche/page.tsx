import MedicalVisitsView from "@/components/medical/MedicalVisitsView";
import { Suspense } from "react";

export default function MedicalVisitsPage() {
    return (
        <Suspense fallback={<div>Caricamento...</div>}>
            <MedicalVisitsView />
        </Suspense>
    );
}

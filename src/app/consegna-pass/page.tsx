
import { Suspense } from "react";
import ConsegnaPassClient from "./ConsegnaPassClient";

export default function ConsegnaPassPage() {
    return (
        <Suspense fallback={<div>Caricamento...</div>}>
            <ConsegnaPassClient />
        </Suspense>
    );
}

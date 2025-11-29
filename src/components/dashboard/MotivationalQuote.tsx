"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const QUOTES = [
    "Muoviti per amore, non per dovere.",
    "Il tuo corpo merita cura.",
    "Ogni passo è una vittoria.",
    "La salute è libertà.",
    "Ascolta il tuo corpo oggi.",
    "Sii gentile con te stesso.",
    "Il movimento è vita.",
    "Respira. Muoviti. Sorridi.",
    "La tua energia è preziosa.",
    "Oggi è un buon giorno.",
    "Prenditi cura della tua luce.",
    "Sei più forte di quanto pensi.",
    "Il benessere inizia da dentro.",
    "Fai ciò che ti fa stare bene.",
    "Il tuo cuore ringrazia.",
    "Celebra ciò che sai fare.",
    "Un respiro alla volta.",
    "La costanza è amore per sé.",
    "Muoviti con gioia.",
    "La salute è il primo passo.",
    "Sei capace di grandi cose.",
    "Il tuo corpo è casa.",
    "Rispetta i tuoi tempi.",
    "Ogni giorno è una nuova forza.",
    "Scegli di stare bene.",
    "Il movimento cura l'anima.",
    "Sei un esempio per molti.",
    "La tua salute, la tua priorità.",
    "Muoviti, vivi, ama.",
    "Oggi splendi."
];

export default function MotivationalQuote() {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        // Simple daily rotation based on day of year
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const quoteIndex = dayOfYear % QUOTES.length;
        setQuote(QUOTES[quoteIndex]);
    }, []);

    if (!quote) return null;

    return (
        <div className="flex items-start gap-2 max-w-2xl mt-2 animate-in-fade-in duration-700">
            <Quote size={14} className="text-brand/40 shrink-0 mt-0.5 rotate-180" />
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {quote}
            </p>
        </div>
    );
}

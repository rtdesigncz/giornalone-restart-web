"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const QUOTES = [
    "Il movimento non è solo fitness, è la celebrazione di ciò che il tuo corpo può fare.",
    "Non stiamo solo allenando muscoli, stiamo costruendo abitudini per la vita.",
    "Ogni passo conta. Il nostro lavoro è far capire alle persone quanto valgono quei passi.",
    "La salute non è una destinazione, è un modo di viaggiare. Guidiamoli in questo viaggio.",
    "Ispirare qualcuno a prendersi cura di sé è il regalo più grande che possiamo fare.",
    "La costanza batte l'intensità. Aiutiamo i nostri clienti a non mollare mai.",
    "Il tuo corpo è l'unico posto in cui devi vivere per sempre. Abbine cura.",
    "Non si tratta di essere perfetti, si tratta di essere migliori di ieri.",
    "La motivazione è ciò che ti fa iniziare. L'abitudine è ciò che ti fa continuare.",
    "Siamo qui per trasformare 'non ce la faccio' in 'ce l'ho fatta'.",
    "Il benessere è un atto d'amore verso se stessi. Insegniamolo ogni giorno.",
    "Un'ora di allenamento è solo il 4% della giornata. Nessuna scusa.",
    "La fatica di oggi è la forza di domani.",
    "Non aspettare di avere tutto sotto controllo per iniziare. Inizia e basta.",
    "Il nostro obiettivo non è solo farli sudare, è farli sorridere dopo la fatica.",
    "Ogni persona che entra dalla porta ha una storia. Aiutiamola a scriverne un capitolo migliore.",
    "La salute è la vera ricchezza. Noi siamo i consulenti finanziari del benessere.",
    "Credi nel processo. I risultati arriveranno.",
    "Non c'è ascensore per il successo. Devi fare le scale.",
    "Il momento migliore per piantare un albero era 20 anni fa. Il secondo momento migliore è adesso.",
    "Sii l'energia che vuoi attrarre.",
    "Allenarsi è celebrare il corpo, non punirlo per ciò che ha mangiato.",
    "La disciplina è scegliere tra ciò che vuoi ora e ciò che vuoi di più.",
    "Siamo educatori al movimento. La nostra missione è cambiare vite.",
    "Un piccolo progresso ogni giorno porta a grandi risultati nel tempo.",
    "Fai qualcosa oggi per cui il tuo futuro te stesso ti ringrazierà.",
    "La forza non viene da ciò che sai fare, ma dal superare ciò che pensavi di non saper fare.",
    "Il successo è la somma di piccoli sforzi, ripetuti giorno dopo giorno.",
    "Non limitare le tue sfide, sfida i tuoi limiti.",
    "Il corpo ottiene ciò in cui la mente crede.",
    "Sii il cambiamento che vuoi vedere nel mondo... e in palestra!"
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
            <p className="text-sm text-slate-500 italic font-medium leading-relaxed">
                {quote}
            </p>
        </div>
    );
}

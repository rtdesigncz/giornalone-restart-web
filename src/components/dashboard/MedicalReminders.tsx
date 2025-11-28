import { CheckCircle, Stethoscope, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MedicalRemindersProps {
    appointments: any[];
}

export default function MedicalReminders({ appointments }: MedicalRemindersProps) {
    const total = appointments.length;
    const sent = appointments.filter(a => a.whatsapp_sent).length;
    const isComplete = total > 0 && sent === total;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

    if (total === 0) return null;

    return (
        <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-sky-100 text-sky-600")}>
                        <Stethoscope size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Promemoria Visita Medica</h2>
                </div>
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-sky-100 text-sky-600")}>
                    {sent}/{total}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Progresso invio</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500 bg-sky-500")}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {isComplete ? (
                <div className="flex items-center gap-2 text-sky-600 text-sm font-bold bg-sky-50 p-3 rounded-xl border border-sky-100">
                    <CheckCircle size={18} />
                    <span>Tutti i messaggi inviati!</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse">
                    <AlertCircle size={18} />
                    <span>{total - sent} messaggi da inviare</span>
                </div>
            )}

            <Link href="/visite-mediche" className="btn btn-outline w-full justify-center text-xs">
                Vai a Visite Mediche
            </Link>
        </div>
    );
}

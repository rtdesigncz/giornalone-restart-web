import { CheckCircle, MessageCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DailyTasksProps {
    entries: any[];
}

export default function DailyTasks({ entries }: DailyTasksProps) {
    // Filter for appointments that typically need reminders
    // Excluding 'TOUR SPONTANEI' as they are walk-ins and don't need reminders.
    const reminderEntries = entries.filter(e => e.section !== "TOUR SPONTANEI");

    const total = reminderEntries.length;
    const sent = reminderEntries.filter(e => e.whatsapp_sent).length;
    const isComplete = total > 0 && sent === total;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

    if (total === 0) return null;

    return (
        <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-emerald-100 text-emerald-600")}>
                        <MessageCircle size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Whatsapp di Conferma</h2>
                </div>
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600")}>
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
                        className={cn("h-full rounded-full transition-all duration-500 bg-emerald-500")}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {isComplete ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <CheckCircle size={18} />
                    <span>Tutti i messaggi inviati!</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse">
                    <AlertCircle size={18} />
                    <span>{total - sent} messaggi da inviare</span>
                </div>
            )}

            <Link href="/agenda" className="btn btn-outline w-full justify-center text-xs">
                Vai all'Agenda
            </Link>
        </div>
    );
}

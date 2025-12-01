import { CheckCircle, MessageCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DailyTasksProps {
    entries: any[];
    onClick: () => void;
}

export default function DailyTasks({ entries, onClick }: DailyTasksProps) {
    // Filter for appointments that typically need reminders
    // Excluding 'TOUR SPONTANEI' as they are walk-ins and don't need reminders.
    const reminderEntries = entries.filter(e => {
        if (e.section === "TOUR SPONTANEI") return false;
        if (e.section === "APPUNTAMENTI TELEFONICI") return false;

        // Logic: Show reminder ONLY if created BEFORE 06:30 of the appointment date.
        // If created after 06:30, it means it was booked during opening hours of the same day -> No reminder needed.
        const cutoff = new Date(`${e.entry_date}T06:30:00`);
        const created = new Date(e.created_at);

        return created < cutoff;
    });

    const total = reminderEntries.length;
    const sent = reminderEntries.filter(e => e.whatsapp_sent).length;
    const isComplete = total > 0 && sent === total;
    const pending = total - sent;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

    // Even if total is 0, we render the widget as "Complete" (0/0)
    const isZeroTotal = total === 0;

    return (
        <div className="glass-card p-5 flex flex-col gap-4 border-l-4 border-emerald-500 border-t-0 border-r-0 border-b-0 h-full justify-between">
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-emerald-100 text-emerald-600")}>
                            <MessageCircle size={16} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Whatsapp Conferma</h2>
                    </div>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600")}>
                        {sent}/{total}
                    </span>
                </div>

                {/* Progress Bar - Always visible to maintain alignment */}
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

                {/* Status Box - Fixed height */}
                <div className="h-[52px]">
                    {(isComplete || isZeroTotal) ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 h-full">
                            <CheckCircle size={18} />
                            <span>Tutto confermato!</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse h-full">
                            <AlertCircle size={18} />
                            <span>{pending} {pending === 1 ? "messaggio" : "messaggi"} da inviare</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Button - Always visible or placeholder? User said "Tutti devono presentare... non deve scomparire" 
                But if complete, maybe we don't need the button? 
                The screenshot shows "Vai ai Pass" even if there are alerts. 
                If complete, maybe we show a disabled button or just keep the space?
                User said "I pulsanti... devono essere in linea". 
                If I remove the button when complete, alignment breaks.
                I will keep the button but maybe disable it or make it "Vedi Agenda" always.
            */}
            <div className="h-[34px]">
                <button onClick={onClick} className="btn btn-outline border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 w-full justify-center text-xs h-full">
                    Vedi Lista
                </button>
            </div>
        </div>
    );
}

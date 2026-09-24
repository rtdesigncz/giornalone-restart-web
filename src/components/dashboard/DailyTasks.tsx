import { CheckCircle, MessageCircle, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyTasksProps {
    entries: any[];
    onClick: () => void;
}

export default function DailyTasks({ entries, onClick }: DailyTasksProps) {
    const reminderEntries = entries.filter(e => {
        if (e.section === "TOUR SPONTANEI") return false;
        if (e.section === "APPUNTAMENTI TELEFONICI") return false;
        const cutoff = new Date(`${e.entry_date}T06:30:00`);
        const created = new Date(e.created_at);
        return created < cutoff;
    });

    const total = reminderEntries.length;
    const sent = reminderEntries.filter(e => e.whatsapp_sent).length;
    const isComplete = total > 0 && sent === total;
    const pending = total - sent;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
    const isZeroTotal = total === 0;

    return (
        <div className="saas-panel p-5 flex flex-col justify-between saas-panel-hover group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <MessageCircle size={18} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">WhatsApp Conferma</h2>
                </div>
                <span className="text-[13px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sent}/{total}
                </span>
            </div>

            <div className="space-y-2 flex-1">
                <div className="flex justify-between text-[13px] font-medium text-slate-500">
                    <span>Progresso</span>
                    <span className="font-semibold text-slate-900">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="pt-2 text-[13px] font-medium text-slate-600">
                    {(isComplete || isZeroTotal) ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={14} /> Tutto inviato
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-rose-600">
                            <AlertCircle size={14} /> {pending} da inviare
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onClick} className="btn btn-outline w-full justify-between mt-4">
                <span>Vedi Lista</span>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-600" />
            </button>
        </div>
    );
}

import { Phone, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallsWidgetProps {
    todos: any[];
    loading: boolean;
    currentTime: string;
    onCompleteCall: (id: string) => void;
}

export default function CallsWidget({ todos, loading, currentTime, onCompleteCall }: CallsWidgetProps) {
    const pendingCount = todos.filter(t => !t.contattato).length;

    return (
        <div className="saas-panel flex flex-col h-full max-h-[400px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-orange-50 text-orange-600">
                        <Phone size={16} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Da Chiamare Oggi</h2>
                </div>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {pendingCount}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-slate-400 text-xs py-6">Caricamento...</div>
                ) : todos.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-8">Nessuna telefonata in sospeso.</div>
                ) : (
                    todos.map((task) => {
                        const time = task.entry_time?.slice(0, 5) || "";
                        const isCompleted = task.contattato;
                        let isUrgent = false;
                        let isExpired = false;

                        if (!isCompleted && time && currentTime) {
                            if (currentTime > time) isExpired = true;
                            else {
                                const [h1, m1] = currentTime.split(":").map(Number);
                                const [h2, m2] = time.split(":").map(Number);
                                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                if (diff <= 10 && diff >= 0) isUrgent = true;
                            }
                        }

                        return (
                            <div key={task.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                                isCompleted ? "opacity-50 grayscale" : "hover:bg-slate-50"
                            )}>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                    isCompleted ? "bg-emerald-500" : isExpired ? "bg-rose-500" : isUrgent ? "bg-red-500" : "bg-orange-500"
                                )} />

                                <div className="min-w-0 flex-1">
                                    <p className={cn("text-[13px] font-bold truncate", isCompleted ? "line-through text-slate-500" : "text-slate-900")}>
                                        {task.nome} {task.cognome}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {time || "Oggi"}
                                        </span>
                                        {task.telefono && <span>• {task.telefono}</span>}
                                    </div>
                                </div>

                                {!isCompleted ? (
                                    <button
                                        onClick={() => onCompleteCall(task.id)}
                                        className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                ) : (
                                    <CheckCircle size={16} className="text-emerald-500" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

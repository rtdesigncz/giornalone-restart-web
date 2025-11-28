import { Phone, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallsWidgetProps {
    todos: any[];
    loading: boolean;
    currentTime: string;
    onCompleteCall: (id: string) => void;
}

export default function CallsWidget({ todos, loading, currentTime, onCompleteCall }: CallsWidgetProps) {
    return (
        <div className="glass-card p-5 flex flex-col h-full max-h-[400px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                        <Phone size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Da Chiamare</h2>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{todos.filter(t => !t.contattato).length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-slate-400 text-xs py-4">Caricamento...</div>
                ) : todos.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Tutto fatto! 🎉
                    </div>
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
                                "flex items-center gap-3 p-3 rounded-xl border transition-all relative group",
                                isCompleted ? "bg-emerald-50/50 border-emerald-100 opacity-60" :
                                    isUrgent ? "bg-rose-50 border-rose-100 animate-pulse" :
                                        "bg-white border-slate-100 hover:border-sky-200 hover:shadow-sm"
                            )}>
                                <div className={cn(
                                    "h-2 w-2 rounded-full flex-shrink-0",
                                    isCompleted ? "bg-emerald-500" : isExpired ? "bg-rose-400" : isUrgent ? "bg-red-500" : "bg-orange-400"
                                )} />

                                <div className="min-w-0 flex-1">
                                    <p className={cn("text-sm font-bold truncate", isCompleted ? "text-emerald-800 line-through" : "text-slate-800")}>
                                        {task.nome} {task.cognome}
                                    </p>
                                    {task.telefono && (
                                        <p className="text-xs text-slate-500 font-mono mb-0.5">{task.telefono}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className={cn(
                                            "flex items-center gap-1",
                                            isCompleted ? "text-emerald-600" : isUrgent ? "text-rose-600 font-bold" : "text-slate-500"
                                        )}>
                                            <Clock size={10} />
                                            {task.entry_time ? task.entry_time.slice(0, 5) : "Oggi"}
                                        </span>
                                        {task.consulente_name && (
                                            <span className="text-slate-400 flex items-center gap-0.5">
                                                • {task.consulente_name}
                                            </span>
                                        )}
                                        {isExpired && !isCompleted && (
                                            <span className="text-rose-500 flex items-center gap-0.5 font-bold ml-auto">
                                                <AlertCircle size={10} /> Scaduto
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!isCompleted ? (
                                    <button
                                        onClick={() => onCompleteCall(task.id)}
                                        className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Fatto"
                                    >
                                        <CheckCircle size={20} />
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

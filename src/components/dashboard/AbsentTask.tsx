"use client";

import { Ghost, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AbsentTaskProps {
    count: number;
    onClick: () => void;
}

export default function AbsentTask({ count, onClick }: AbsentTaskProps) {
    // If count is 0, it means "Tutto recuperato" (success)
    // If count > 0, it means pending tasks (alert)

    return (
        <div className="glass-card p-5 flex flex-col gap-4 border-l-4 border-yellow-400 border-t-0 border-r-0 border-b-0 h-full justify-between">
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-yellow-100 text-yellow-600")}>
                            <Ghost size={16} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Assenti da Recuperare</h2>
                    </div>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-600")}>
                        {count}
                    </span>
                </div>

                {/* Progress Bar - Placeholder for alignment */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Progresso recupero</span>
                        <span>0%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500 bg-yellow-400")}
                            style={{ width: `0%` }}
                        />
                    </div>
                </div>

                {/* Status Box - Fixed height */}
                <div className="h-[52px]">
                    {count === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 h-full">
                            <CheckCircle size={18} />
                            <span>Tutto recuperato!</span>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse cursor-pointer hover:bg-rose-100 transition-colors h-full"
                            onClick={onClick}
                        >
                            <AlertCircle size={18} />
                            <span>{count} {count === 1 ? "persona assente" : "persone assenti"}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Button - Always visible */}
            <div className="h-[34px]">
                {count > 0 ? (
                    <button onClick={onClick} className="btn btn-outline border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300 w-full justify-center text-xs h-full">
                        Vedi Lista
                    </button>
                ) : (
                    <button disabled className="btn btn-outline border-slate-200 text-slate-400 w-full justify-center text-xs h-full cursor-not-allowed">
                        Vedi Lista
                    </button>
                )}
            </div>
        </div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PassDeliveryTask({ count }: { count: number }) {
    const router = useRouter();

    // Logic: We only know "count" (pending). 
    // To match the UI of "Sent/Total", we simulate that 0 are sent and 'count' are pending.
    // So Total = count. Sent = 0.
    const total = count;
    const sent = 0;
    const progress = 0;

    return (
        <div className="glass-card p-5 flex flex-col gap-4 border-l-4 border-purple-500 border-t-0 border-r-0 border-b-0 h-full justify-between">
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-purple-100 text-purple-600")}>
                            <MessageCircle size={16} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Messaggi Consegna Pass</h2>
                    </div>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-600")}>
                        {count > 0 ? `${sent}/${total}` : "0/0"}
                    </span>
                </div>

                {/* Progress Bar - Always visible */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Progresso invio</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500 bg-purple-500")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Status Box - Fixed height */}
                <div className="h-[52px]">
                    {count === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 h-full">
                            <CheckCircle size={18} />
                            <span>Tutto completato!</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse cursor-pointer hover:bg-rose-100 transition-colors h-full"
                            onClick={() => router.push("/consegna-pass")}
                        >
                            <AlertCircle size={18} />
                            <span>{count} {count === 1 ? "persona" : "persone"} da contattare</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Button - Always visible */}
            <div className="h-[34px]">
                {count > 0 ? (
                    <Link href="/consegna-pass" className="btn btn-outline border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 w-full justify-center text-xs h-full">
                        Vai ai Pass
                    </Link>
                ) : (
                    <Link href="/consegna-pass" className="btn btn-outline border-slate-200 text-slate-400 hover:bg-slate-50 w-full justify-center text-xs h-full">
                        Vai ai Pass
                    </Link>
                )}
            </div>
        </div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PassDeliveryTask({ count }: { count: number }) {
    const router = useRouter();

    if (count === 0) return null;

    // Logic: We only know "count" (pending). 
    // To match the UI of "Sent/Total", we simulate that 0 are sent and 'count' are pending.
    // So Total = count. Sent = 0.
    const total = count;
    const sent = 0;
    const progress = 0;

    return (
        <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-rose-100 text-rose-600")}>
                        <MessageCircle size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Follow Up - Pass Consegnati</h2>
                </div>
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-600")}>
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
                        className={cn("h-full rounded-full transition-all duration-500 bg-rose-500")}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse cursor-pointer hover:bg-rose-100 transition-colors"
                onClick={() => router.push("/consegna-pass")}
            >
                <AlertCircle size={18} />
                <span>{count} persone da contattare</span>
            </div>

            <Link href="/consegna-pass" className="btn btn-outline w-full justify-center text-xs">
                Vai ai Pass
            </Link>
        </div>
    );
}

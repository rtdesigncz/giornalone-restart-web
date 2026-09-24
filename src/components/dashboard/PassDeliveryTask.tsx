import { Ticket, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PassDeliveryTask({ count }: { count: number }) {
    const isComplete = count === 0;
    return (
        <div className="saas-panel p-5 flex flex-col justify-between saas-panel-hover group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Ticket size={18} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Consegna PASS</h2>
                </div>
                <span className="text-[13px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {count}
                </span>
            </div>

            <div className="space-y-2 flex-1">
                <div className="flex justify-between text-[13px] font-medium text-slate-500">
                    <span>Progresso</span>
                    <span className="font-semibold text-slate-900">{isComplete ? "100%" : "0%"}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500 rounded-full", isComplete ? "bg-purple-500" : "bg-slate-200")} style={{ width: isComplete ? "100%" : "0%" }} />
                </div>
                <div className="pt-2 text-[13px] font-medium text-slate-600">
                    {isComplete ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={14} /> Nessun PASS in attesa
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-rose-600">
                            <AlertCircle size={14} /> {count} in scadenza
                        </div>
                    )}
                </div>
            </div>

            <Link href="/consegna-pass" className="btn btn-outline w-full justify-between mt-4">
                <span>Vai ai PASS</span>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-600" />
            </Link>
        </div>
    );
}

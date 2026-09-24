import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: "brand" | "blue" | "rose" | "orange" | "emerald";
}

const COLOR_MAP = {
    brand: "text-[#21b5ba] bg-[#21b5ba]/10",
    blue: "text-blue-600 bg-blue-50",
    rose: "text-rose-600 bg-rose-50",
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50",
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "brand" }: StatCardProps) {
    return (
        <div className={cn("bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between", color === "brand" && "border-cyan-100", color === "blue" && "border-blue-100", color === "rose" && "border-rose-100", color === "orange" && "border-orange-100", color === "emerald" && "border-emerald-100")}>
            {/* Colored top line */}
            <div className={cn("absolute top-0 left-0 w-full h-1", color === "brand" ? "bg-cyan-500" : color === "blue" ? "bg-blue-500" : color === "rose" ? "bg-rose-500" : color === "orange" ? "bg-orange-400" : "bg-emerald-500")}></div>
            
            <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className={cn("text-[11px] font-bold uppercase tracking-wide", color === "brand" ? "text-cyan-700" : color === "blue" ? "text-blue-700" : color === "rose" ? "text-rose-700" : color === "orange" ? "text-orange-700" : "text-emerald-700")}>{title}</h3>
                <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center", color === "brand" ? "bg-cyan-50 border-cyan-100" : color === "blue" ? "bg-blue-50 border-blue-100" : color === "rose" ? "bg-rose-50 border-rose-100" : color === "orange" ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100")}>
                    <Icon className={cn("w-3.5 h-3.5", color === "brand" ? "text-cyan-600" : color === "blue" ? "text-blue-600" : color === "rose" ? "text-rose-600" : color === "orange" ? "text-orange-500" : "text-emerald-600")} />
                </div>
            </div>
            
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            </div>

            {trend && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className={cn(
                        "flex items-center font-bold px-2 py-0.5 rounded text-[11px]",
                        trendUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                    )}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trendUp ? `+${trend}` : `-${trend}`}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">vs ieri</span>
                </div>
            )}
        </div>
    );
}

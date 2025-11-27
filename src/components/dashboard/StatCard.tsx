import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: "brand" | "blue" | "rose" | "orange" | "emerald";
}

const COLORS = {
    brand: "text-brand bg-brand/10",
    blue: "text-blue-600 bg-blue-50",
    rose: "text-rose-600 bg-rose-50",
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50",
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "brand" }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", COLORS[color])}>
                    <Icon size={20} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className={cn("font-medium", trendUp ? "text-emerald-600" : "text-rose-600")}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                    <span className="text-slate-400">rispetto a ieri</span>
                </div>
            )}
        </div>
    );
}

import { Check, Euro, ThumbsDown, Ghost, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";

type OutcomeType = 'presentato' | 'venduto' | 'negativo' | 'assente' | 'miss';

interface OutcomeButtonsProps {
    entry: any;
    onOutcomeClick: (type: OutcomeType, entry: any) => void;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    layout?: 'row' | 'grid'; // 'row' for tables, 'grid' for drawer
}

export default function OutcomeButtons({
    entry,
    onOutcomeClick,
    size = 'md',
    showLabels = true,
    layout = 'row'
}: OutcomeButtonsProps) {

    const btnBase = "flex flex-col items-center justify-center transition-all duration-200 border rounded-xl active:scale-95 relative group";
    const sizeClasses = size === 'sm' ? "h-8 w-8 p-1" : size === 'md' ? "h-12 w-12 p-2" : "h-16 w-16 p-3";
    const iconSize = size === 'sm' ? 14 : size === 'md' ? 20 : 24;

    const buttons = [
        {
            type: 'presentato' as OutcomeType,
            label: 'Presentato',
            icon: Check,
            activeClass: "bg-green-200 text-green-800 border-green-300 shadow-md shadow-green-100",
            inactiveClass: "bg-white text-slate-400 border-slate-200 hover:border-green-300 hover:text-green-600 hover:bg-green-50",
            isActive: entry.presentato
        },
        {
            type: 'venduto' as OutcomeType,
            label: 'Venduto',
            icon: Euro,
            activeClass: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200",
            inactiveClass: "bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50",
            isActive: entry.venduto
        },
        {
            type: 'negativo' as OutcomeType,
            label: 'Negativo',
            icon: ThumbsDown,
            activeClass: "bg-red-500 text-white border-red-600 shadow-md shadow-red-200",
            inactiveClass: "bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50",
            isActive: entry.negativo
        },
        {
            type: 'assente' as OutcomeType,
            label: 'Assente',
            icon: Ghost,
            activeClass: "bg-yellow-300 text-yellow-900 border-yellow-400 shadow-md shadow-yellow-100",
            inactiveClass: "bg-white text-slate-400 border-slate-200 hover:border-yellow-300 hover:text-yellow-600 hover:bg-yellow-50",
            isActive: entry.assente
        },
        {
            type: 'miss' as OutcomeType,
            label: 'Miss con App.',
            icon: CalendarX,
            activeClass: "bg-orange-400 text-white border-orange-500 shadow-md shadow-orange-200",
            inactiveClass: "bg-white text-slate-400 border-slate-200 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50",
            isActive: entry.miss
        }
    ];

    return (
        <div className={cn(
            "flex gap-2",
            layout === 'grid' ? "grid grid-cols-5 w-full" : "flex-row"
        )}>
            {buttons.map(btn => (
                <div key={btn.type} className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (btn.isActive) {
                                if (confirm("Sei sicuro di voler rimuovere questo esito?")) {
                                    onOutcomeClick(btn.type, entry);
                                }
                            } else {
                                onOutcomeClick(btn.type, entry);
                            }
                        }}
                        className={cn(
                            btnBase,
                            layout === 'grid' ? "w-full aspect-square" : sizeClasses,
                            btn.isActive ? btn.activeClass : btn.inactiveClass
                        )}
                        title={btn.label}
                    >
                        <btn.icon size={iconSize} />
                    </button>
                    {showLabels && (
                        <span className={cn(
                            "text-[10px] font-medium transition-colors text-center leading-tight",
                            btn.isActive ? "text-slate-800 font-bold" : "text-slate-400"
                        )}>
                            {btn.label}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

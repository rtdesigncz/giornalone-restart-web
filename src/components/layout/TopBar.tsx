"use client";

import { Menu, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

function parseISO(s: string) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}
function fmtISO(d: Date) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    const sp = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const scope = sp?.get("scope") ?? "day";
    const currentDate = sp?.get("date") ?? new Date().toISOString().slice(0, 10);

    // Logic from AppShell
    const isToday = scope === "day" && currentDate === new Date().toISOString().slice(0, 10);

    function apply(params: Record<string, string | undefined>) {
        const next = new URLSearchParams(sp?.toString() || "");
        Object.entries(params).forEach(([k, v]) => {
            if (!v) next.delete(k);
            else next.set(k, v);
        });
        router.push(`${pathname}?${next.toString()}`);
    }

    function shiftDay(delta: number) {
        const d = parseISO(currentDate);
        d.setUTCDate(d.getUTCDate() + delta);
        apply({ scope: "day", date: fmtISO(d), from: undefined, to: undefined });
    }

    function goToday() {
        const iso = new Date().toISOString().slice(0, 10);
        apply({ scope: "day", date: iso, from: undefined, to: undefined });
    }

    // Date Picker Input
    const inputRef = useRef<HTMLInputElement>(null);
    const openPicker = () => {
        try {
            if (inputRef.current && 'showPicker' in inputRef.current) {
                (inputRef.current as any).showPicker();
            } else {
                inputRef.current?.click();
            }
        } catch (e) {
            (inputRef.current as HTMLInputElement | null)?.click();
        }
    };

    // Format Date for Display
    const displayDate = useMemo(() => {
        if (scope !== "day") return "Periodo personalizzato";
        return new Intl.DateTimeFormat("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(parseISO(currentDate));
    }, [scope, currentDate]);

    const displayDateCapitalized = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
                >
                    <Menu size={20} />
                </button>

                {pathname === '/agenda' && (
                    <>
                        {/* Date Navigation */}
                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                            <button onClick={() => shiftDay(-1)} className="p-1.5 text-slate-500 hover:text-brand hover:bg-white rounded-md transition-all">
                                <ChevronLeft size={16} />
                            </button>

                            <div className="relative mx-1 group cursor-pointer" onClick={openPicker}>
                                <div className="flex items-center gap-2 px-2 py-1">
                                    <CalendarIcon size={14} className="text-slate-400 group-hover:text-brand" />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-brand-ink min-w-[140px] text-center select-none">
                                        {displayDateCapitalized}
                                    </span>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value={currentDate}
                                    onChange={(e) => apply({ scope: "day", date: e.target.value })}
                                />
                            </div>

                            <button onClick={() => shiftDay(1)} className="p-1.5 text-slate-500 hover:text-brand hover:bg-white rounded-md transition-all">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {!isToday && (
                            <button onClick={goToday} className="text-xs font-semibold text-brand hover:underline px-2">
                                Torna a oggi
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Placeholder for global search or notifications */}
            </div>
        </header>
    );
}

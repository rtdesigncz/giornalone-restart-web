"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import EntryDrawer from "./EntryDrawer";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

import { useSearchParams } from "next/navigation";
import { getLocalDateISO } from "@/lib/dateUtils";

// ... imports

export default function AgendaCalendar({ section }: { section: string }) {
    const searchParams = useSearchParams();
    const dateParam = searchParams?.get("date") ?? getLocalDateISO();

    // Derive month/year from the selected date
    const currentDate = new Date(dateParam);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateISO());
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

    const fetchMonthEntries = async () => {
        // ... same logic using year/month derived from dateParam
        setLoading(true);
        const start = new Date(year, month, 1);
        // ...
        const startISO = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

        // End of month
        const end = new Date(year, month + 1, 0);
        const endISO = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

        const { data, error } = await supabase
            .from("entries")
            .select("id, entry_date, entry_time, nome, cognome, section, venduto, miss, negativo, presentato, contattato, assente")
            .eq("section", section)
            .gte("entry_date", startISO)
            .lte("entry_date", endISO);

        if (error) console.error(error);
        else setEntries(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMonthEntries();
    }, [dateParam, section]); // Depend on dateParam

    const handleDayClick = (day: number) => {
        const date = new Date(year, month, day);
        const dateISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        setSelectedDate(dateISO);
        setSelectedEntry(null);
        setDrawerOpen(true);
    };

    // Calendar Grid Logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
    // Adjust for Monday start (Mon=0, Sun=6)
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const renderCalendarCells = () => {
        const cells = [];

        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`pad-${i}`} className="h-32 bg-slate-50/30 border border-slate-100/50" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            const dayEntries = entries.filter(e => e.entry_date === dateISO);
            const isToday = getLocalDateISO() === dateISO;

            cells.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                        "h-32 border border-slate-100 p-2 relative group hover:bg-sky-50/30 transition-colors cursor-pointer flex flex-col gap-1 overflow-hidden",
                        isToday && "bg-sky-50/50"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                            isToday ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-700"
                        )}>
                            {day}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-brand">
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mt-1">
                        {dayEntries.map(entry => {
                            // Determine color based on status
                            let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
                            if (entry.venduto) colorClass = "bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm"; // Verde scuro
                            else if (entry.miss) colorClass = "bg-orange-100 text-orange-700 border-orange-200"; // Arancione
                            else if (entry.assente) colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200"; // Giallo
                            else if (entry.negativo) colorClass = "bg-red-100 text-red-700 border-red-200"; // Rosso
                            else if (entry.presentato) colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200"; // Verde chiaro
                            else if (entry.contattato) colorClass = "bg-blue-100 text-blue-700 border-blue-200";

                            return (
                                <div key={entry.id} className={cn("text-[10px] px-1.5 py-0.5 rounded border truncate font-medium", colorClass)}>
                                    {entry.entry_time?.slice(0, 5)} {entry.nome} {entry.cognome?.charAt(0)}.
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return cells;
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
            {/* Header Removed - Controlled by Parent */}

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                    {DAYS.map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Cells */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Caricamento...
                    </div>
                ) : (
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {renderCalendarCells()}
                    </div>
                )}
            </div>

            {/* Drawer */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={selectedEntry}
                section={section}
                date={selectedDate}
                onSave={() => {
                    fetchMonthEntries();
                    setDrawerOpen(false);
                }}
                onDelete={async (id) => {
                    if (!confirm("Eliminare?")) return;
                    await supabase.from("entries").delete().eq("id", id);
                    fetchMonthEntries();
                    setDrawerOpen(false);
                }}
            />
        </div>
    );
}

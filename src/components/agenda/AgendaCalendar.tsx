"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import EntryDrawer from "./EntryDrawer";
import { useSearchParams } from "next/navigation";
import { getLocalDateISO } from "@/lib/dateUtils";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AgendaCalendar({ section }: { section: string }) {
    const searchParams = useSearchParams();
    const dateParam = searchParams?.get("date") ?? getLocalDateISO();

    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateISO());
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

    // Calculate Week Range
    const getWeekRange = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = d.getDay(); // 0=Sun, 1=Mon
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d);
        monday.setDate(diff);

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            weekDates.push(current.toISOString().slice(0, 10));
        }
        return weekDates;
    };

    const weekDates = getWeekRange(dateParam);
    const startISO = weekDates[0];
    const endISO = weekDates[6];

    const fetchWeekEntries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("entries")
            .select("*")
            .eq("section", section)
            .gte("entry_date", startISO)
            .lte("entry_date", endISO);

        if (error) console.error(error);
        else setEntries(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchWeekEntries();
    }, [dateParam, section]);

    const handleDayClick = (dateISO: string) => {
        setSelectedDate(dateISO);
        setSelectedEntry(null);
        setDrawerOpen(true);
    };

    const handleEntryClick = (e: React.MouseEvent, entry: any) => {
        e.stopPropagation();
        setSelectedDate(entry.entry_date);
        setSelectedEntry(entry);
        setDrawerOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm min-h-[600px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                {weekDates.map((dateISO, index) => {
                    const d = new Date(dateISO);
                    const isToday = dateISO === getLocalDateISO();
                    return (
                        <div key={dateISO} className={cn(
                            "py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center gap-1",
                            isToday && "bg-brand/5"
                        )}>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{DAYS[index]}</span>
                            <span className={cn(
                                "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                                isToday ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-700"
                            )}>
                                {d.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Caricamento settimana...
                    </div>
                ) : (
                    <div className="grid grid-cols-7 min-h-full divide-x divide-slate-200">
                        {weekDates.map(dateISO => {
                            const dayEntries = entries.filter(e => e.entry_date === dateISO);
                            const isToday = dateISO === getLocalDateISO();

                            return (
                                <div key={dateISO} className={cn(
                                    "relative flex flex-col p-2 gap-2 hover:bg-slate-50/50 transition-colors group min-h-[200px]",
                                    isToday && "bg-sky-50/30"
                                )}>
                                    {/* Entries List */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        {dayEntries.map(entry => {
                                            let colorClass = "bg-white border-slate-200 text-slate-600 hover:border-brand/50 hover:shadow-md";
                                            if (entry.venduto) colorClass = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400";
                                            else if (entry.miss) colorClass = "bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400";
                                            else if (entry.assente) colorClass = "bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400";
                                            else if (entry.negativo) colorClass = "bg-red-50 border-red-200 text-red-700 hover:border-red-400";
                                            else if (entry.presentato) colorClass = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400";
                                            else if (entry.contattato) colorClass = "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400";

                                            return (
                                                <div
                                                    key={entry.id}
                                                    onClick={(e) => handleEntryClick(e, entry)}
                                                    className={cn(
                                                        "p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all shadow-sm",
                                                        colorClass
                                                    )}
                                                >
                                                    <div className="font-bold mb-0.5">{entry.entry_time?.slice(0, 5)}</div>
                                                    <div className="truncate">{entry.nome} {entry.cognome}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Button */}
                                    <button
                                        onClick={() => handleDayClick(dateISO)}
                                        className="w-full py-2 mt-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg border border-dashed border-slate-300 hover:border-brand/30 transition-all"
                                    >
                                        <Plus size={14} />
                                        Nuovo
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={selectedEntry}
                section={section}
                date={selectedDate}
                onSave={() => {
                    fetchWeekEntries();
                    setDrawerOpen(false);
                }}
                onDelete={async (id) => {
                    if (!confirm("Eliminare?")) return;
                    await supabase.from("entries").delete().eq("id", id);
                    fetchWeekEntries();
                    setDrawerOpen(false);
                }}
            />
        </div>
    );
}

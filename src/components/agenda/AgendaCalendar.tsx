"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import EntryDrawer from "./EntryDrawer";
import { deleteEntryWithRinnoviSync } from "@/lib/agendaDeleteUtils";
import { useSearchParams } from "next/navigation";
import { getLocalDateISO } from "@/lib/dateUtils";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AgendaCalendar({
    section,
    selectedConsulente = "ALL",
    onConsulenteChange,
    consulenti = [],
}: {
    section: string;
    selectedConsulente?: string;
    onConsulenteChange?: (c: string) => void;
    consulenti?: any[];
}) {
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
        if (isNaN(d.getTime())) return [];
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
            .select("*, consulente:consulenti(*), tipo_abbonamento:tipi_abbonamento(*), client:clients(id, pacchetto_originale, data_scadenza, stato, disciplina)")
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

    const filteredEntries = entries.filter(e => {
        if (!selectedConsulente || selectedConsulente === "ALL") return true;
        if (selectedConsulente === "UNASSIGNED") return !e.consulente_id && !e.consulente;
        return (e.consulente_id || e.consulente?.id) === selectedConsulente;
    });

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative flex flex-col h-full min-h-[600px]">
            {/* Calendar Toolbar with Consultant Filter */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/70 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase mr-1">Consulente:</span>
                    <button
                        type="button"
                        onClick={() => onConsulenteChange?.("ALL")}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs",
                            selectedConsulente === "ALL"
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <span>Tutti</span>
                        <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                            selectedConsulente === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                            {entries.length}
                        </span>
                    </button>
                    {consulenti.map(c => {
                        const count = entries.filter(e => (e.consulente_id || e.consulente?.id) === c.id).length;
                        const isSelected = selectedConsulente === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onConsulenteChange?.(isSelected ? "ALL" : c.id)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs",
                                    isSelected
                                        ? "bg-[#21b5ba] text-white border-[#21b5ba] shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <span>{c.name}</span>
                                <span className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white sticky top-0 z-10">
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
                            const dayEntries = filteredEntries.filter(e => e.entry_date === dateISO);
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
                initialData={selectedConsulente && selectedConsulente !== "ALL" && selectedConsulente !== "UNASSIGNED" ? { consulente_id: selectedConsulente } : undefined}
                onSave={() => {
                    fetchWeekEntries();
                    setDrawerOpen(false);
                }}
                onDelete={async (id) => {
                    const row = entries.find(r => r.id === id) || (selectedEntry?.id === id ? selectedEntry : null);
                    const success = await deleteEntryWithRinnoviSync(row || id, supabase, selectedEntry);
                    if (success) {
                        fetchWeekEntries();
                        setDrawerOpen(false);
                    }
                }}
            />
        </div>
    );
}

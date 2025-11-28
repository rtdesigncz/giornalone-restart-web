"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import AgendaTable from "@/components/agenda/AgendaTable";
import AgendaCalendar from "@/components/agenda/AgendaCalendar";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutList, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalDateISO } from "@/lib/dateUtils";

import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";

export default function AgendaView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sectionParam = searchParams?.get("section");
    const dateParam = searchParams?.get("date") ?? getLocalDateISO();

    const [activeTab, setActiveTab] = useState(DB_SECTIONS[0]);
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

    useEffect(() => {
        if (sectionParam && DB_SECTIONS.includes(sectionParam)) {
            setActiveTab(sectionParam);
        }
    }, [sectionParam]);

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda</h1>
                    <p className="text-slate-500 mt-1">Gestisci appuntamenti e attività.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Selector */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => {
                                const d = new Date(dateParam);
                                d.setDate(d.getDate() - 1);
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex flex-col items-center px-4 min-w-[140px]">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {new Date(dateParam).toLocaleDateString("it-IT", { weekday: "long" })}
                            </span>
                            <input
                                type="date"
                                value={dateParam}
                                onChange={(e) => router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${e.target.value}`)}
                                className="bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 p-0 text-center cursor-pointer w-full"
                            />
                            {dateParam !== getLocalDateISO() && (
                                <button
                                    onClick={() => router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${getLocalDateISO()}`)}
                                    className="text-[10px] font-bold text-brand uppercase tracking-wide hover:underline mt-0.5"
                                >
                                    Torna ad oggi
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                const d = new Date(dateParam);
                                d.setDate(d.getDate() + 1);
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1" />

                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                viewMode === "list"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <LayoutList size={16} />
                            Lista
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                viewMode === "calendar"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <CalendarIcon size={16} />
                            Calendario
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 overflow-x-auto flex-shrink-0">
                <div className="flex space-x-1 min-w-max px-1">
                    {DB_SECTIONS.map((tab) => {
                        const isActive = activeTab === tab;
                        const label = getSectionLabel(tab);

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative",
                                    isActive
                                        ? "border-sky-500 text-sky-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                )}
                            >
                                {label}
                                {isActive && (
                                    <span className="absolute inset-0 bg-sky-50/50 -z-10 rounded-t-lg" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-card flex-1 overflow-hidden relative border border-slate-200/60 bg-white/50">
                {viewMode === "list" ? (
                    <AgendaTable section={activeTab} />
                ) : (
                    <AgendaCalendar section={activeTab} />
                )}
            </div>
        </div>
    );
}

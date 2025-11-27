"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import AgendaTable from "@/components/agenda/AgendaTable";
import AgendaCalendar from "@/components/agenda/AgendaCalendar";
import { useSearchParams } from "next/navigation";
import { LayoutList, Calendar as CalendarIcon } from "lucide-react";

import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";

export default function AgendaView() {
    const searchParams = useSearchParams();
    const sectionParam = searchParams?.get("section");

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

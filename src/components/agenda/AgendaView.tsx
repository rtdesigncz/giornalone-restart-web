"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import AgendaTable from "@/components/agenda/AgendaTable";
import AgendaCalendar from "@/components/agenda/AgendaCalendar";
import AgendaMobileList from "@/components/agenda/AgendaMobileList";
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
        <div className="space-y-6 flex flex-col animate-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
                    <p className="text-slate-500 mt-1">Gestisci appuntamenti e attività.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Date Selector */}
                    {/* Date Selector */}
                    <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                        <button
                            onClick={() => {
                                const d = new Date(dateParam);
                                d.setDate(d.getDate() - (viewMode === "calendar" ? 7 : 1));
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                            }}
                            className="h-11 w-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm flex-shrink-0"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="relative flex-1 bg-white h-11 rounded-xl border border-slate-200 shadow-sm overflow-hidden group min-w-[360px]">
                            {/* Grid Layout for Perfect Centering (Visual Layer) */}
                            <div className="absolute inset-0 grid grid-cols-3 items-center px-2 pointer-events-none z-0">
                                {/* Left: Empty Spacer */}
                                <div></div>

                                {/* Center: Date Text */}
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5 whitespace-nowrap">
                                        {viewMode === "calendar" ? "Settimana" : new Date(dateParam).toLocaleDateString("it-IT", { weekday: "long" })}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800 leading-none whitespace-nowrap">
                                        {viewMode === "calendar" ? (() => {
                                            const d = new Date(dateParam);
                                            const day = d.getDay();
                                            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                            const start = new Date(d);
                                            start.setDate(diff);
                                            const end = new Date(start);
                                            end.setDate(start.getDate() + 6);
                                            return `${start.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`;
                                        })() : new Date(dateParam).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
                                    </span>
                                </div>

                                {/* Right: Empty Spacer (reserves space for button) */}
                                <div></div>
                            </div>

                            {/* Invisible Full-Cover Input (Interactive Layer) */}
                            <input
                                type="date"
                                value={dateParam}
                                onChange={(e) => router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${e.target.value}`)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 appearance-none bg-transparent [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />

                            {/* "Back to Today" Button (Top Layer) */}
                            {dateParam !== getLocalDateISO() && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening date picker
                                        router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${getLocalDateISO()}`);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-brand/10 text-brand rounded-lg hover:bg-brand/20 transition-colors z-20 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                                    title="Torna ad oggi"
                                >
                                    Torna ad oggi
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                const d = new Date(dateParam);
                                d.setDate(d.getDate() + (viewMode === "calendar" ? 7 : 1));
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                            }}
                            className="h-11 w-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm flex-shrink-0"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* View Mode Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
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
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                viewMode === "calendar"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <CalendarIcon size={16} />
                            Settimana
                        </button>
                    </div>
                </div>
            </div>



            {/* Tabs (Desktop Only) */}
            <div className="hidden md:block border-b border-slate-200 flex-shrink-0">
                <div className="flex flex-wrap space-x-2 px-1">
                    {DB_SECTIONS.map((tab) => {
                        const isActive = activeTab === tab;
                        const label = getSectionLabel(tab);

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative flex-shrink-0",
                                    isActive
                                        ? "border-brand text-brand"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                )}
                            >
                                {label}
                                {isActive && (
                                    <span className="absolute inset-0 bg-brand/10 -z-10 rounded-t-lg" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-card relative border border-slate-200/60 bg-white/50">
                {viewMode === "list" ? (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <AgendaTable section={activeTab} />
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden pb-20">
                            <AgendaMobileList section={activeTab} onSectionChange={setActiveTab} />
                        </div>
                    </>
                ) : (
                    <AgendaCalendar section={activeTab} />
                )}
            </div>
        </div>
    );
}

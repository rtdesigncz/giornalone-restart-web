"use client";

import { Users, Phone, CalendarCheck, TrendingUp, Plus, CheckCircle, ArrowUpRight, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import StatCard from "./StatCard";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EntryDrawer from "../agenda/EntryDrawer";
import { cn } from "@/lib/utils";
import { getSectionLabel } from "@/lib/sections";
import DailyTasks from "./DailyTasks";
import MedicalReminders from "./MedicalReminders";
import CallsWidget from "./CallsWidget";
import NotesWidget from "./NotesWidget";
import { cleanPhone } from "@/lib/whatsapp";
import OutcomeButtons from "../outcomes/OutcomeButtons";
import ExportPdfButton from "./ExportPdfButton";
import PassDeliveryTask from "./PassDeliveryTask";
import AbsentTask from "./AbsentTask";
import MotivationalQuote from "./MotivationalQuote";

interface DashboardMobileProps {
    stats: any;
    loading: boolean;
    todayEntries: any[];
    medicalAppointments: any[];
    todos: any[];
    currentTime: string;
    pendingAppointments: any[];
    handleCompleteCall: (id: string) => void;
    handleOutcomeClick: (type: string, entry: any) => void;
    handleWhatsApp: (entry: any) => void;
    setDrawerOpen: (open: boolean) => void;
    drawerOpen: boolean;
    fetchDashboardData: () => void;
    rescheduleDrawerOpen: boolean;
    setRescheduleDrawerOpen: (open: boolean) => void;
    rescheduleEntryData: any;
    onRescheduleSaved: () => void;
    passDeliveryCount: number;
    absentEntries: any[];
    setAbsentListOpen: (open: boolean) => void;
}

export default function DashboardMobile({
    stats,
    loading,
    todayEntries,
    medicalAppointments,
    todos,
    currentTime,
    pendingAppointments,
    handleCompleteCall,
    handleOutcomeClick,
    handleWhatsApp,
    setDrawerOpen,
    drawerOpen,
    fetchDashboardData,
    rescheduleDrawerOpen,
    setRescheduleDrawerOpen,
    rescheduleEntryData,
    onRescheduleSaved,
    passDeliveryCount,
    absentEntries,
    setAbsentListOpen
}: DashboardMobileProps) {
    const router = useRouter();
    const [notesOpen, setNotesOpen] = useState(false);

    const showDailyTasks = todayEntries.filter(e => e.section !== "TOUR SPONTANEI").length > 0;
    const showMedicalReminders = medicalAppointments.length > 0;
    const showPassDelivery = passDeliveryCount > 0;
    const showAbsentTask = absentEntries && absentEntries.length > 0;

    return (
        <div className="space-y-6 pb-24 animate-in-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">Ciao, Team! 👋</h1>
                    <MotivationalQuote />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <ExportPdfButton />
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="btn btn-brand h-10 w-10 p-0 rounded-full flex items-center justify-center shadow-lg shadow-brand/20"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Carousel */}
            <div className="-mx-4 px-4 overflow-x-auto no-scrollbar flex gap-3 snap-x snap-mandatory py-2">
                <div className="snap-center shrink-0 w-[240px]">
                    <StatCard
                        title="Tour"
                        value={loading ? "-" : stats.tour.toString()}
                        icon={Users}
                        trend={Math.abs(stats.trends.tour).toString()}
                        trendUp={stats.trends.tour >= 0}
                        color="brand"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px]">
                    <StatCard
                        title="Appuntamenti"
                        value={loading ? "-" : stats.appuntamenti.toString()}
                        icon={CalendarCheck}
                        trend={Math.abs(stats.trends.appuntamenti).toString()}
                        trendUp={stats.trends.appuntamenti >= 0}
                        color="blue"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px]">
                    <StatCard
                        title="Telefonate"
                        value={loading ? "-" : stats.telefonate.toString()}
                        icon={Phone}
                        trend={Math.abs(stats.trends.telefonate).toString()}
                        trendUp={stats.trends.telefonate >= 0}
                        color="orange"
                    />
                </div>
                <div className="snap-center shrink-0 w-[240px]">
                    <StatCard
                        title="Vendite"
                        value={loading ? "-" : stats.vendite.toString()}
                        icon={TrendingUp}
                        trend={Math.abs(stats.trends.vendite).toString()}
                        trendUp={stats.trends.vendite >= 0}
                        color="emerald"
                    />
                </div>
            </div>

            {/* 1. Agenda Preview (Moved to Top) */}
            <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                            <CalendarCheck size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">In Corso / Da Fare</h2>
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">{pendingAppointments.length}</span>
                    </div>
                    <Link href="/agenda" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                        Vedi tutti <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400 text-sm">Caricamento...</div>
                    ) : pendingAppointments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
                            Nessun appuntamento in attesa.
                        </div>
                    ) : (
                        pendingAppointments.slice(0, 3).map((entry) => {
                            const isPresentato = entry.presentato;
                            const isExpired = currentTime && entry.entry_time < currentTime;

                            const tel = cleanPhone(entry.telefono);
                            const waLink = tel ? `https://wa.me/${tel}` : null;

                            return (
                                <div
                                    key={entry.id}
                                    onClick={() => router.push(`/agenda?section=${encodeURIComponent(entry.section)}&date=${entry.entry_date}`)}
                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "px-2 py-1 rounded-md text-xs font-bold",
                                                isPresentato ? "bg-emerald-100 text-emerald-700" : isExpired ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                                            )}>
                                                {entry.entry_time?.slice(0, 5)}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                {getSectionLabel(entry.section)}
                                            </span>
                                        </div>
                                        {waLink && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleWhatsApp(entry); }}
                                                className={cn(
                                                    "p-2 rounded-full transition-all border shadow-sm",
                                                    entry.whatsapp_sent
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                        : "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white"
                                                )}
                                            >
                                                {entry.whatsapp_sent ? <CheckCircle size={16} /> : <MessageCircle size={16} />}
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{entry.nome} {entry.cognome}</h3>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                                        <span className="flex items-center gap-1"><Users size={12} /> {entry.consulente_name || "N/D"}</span>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                                        <OutcomeButtons
                                            entry={entry}
                                            onOutcomeClick={handleOutcomeClick}
                                            size="md"
                                            showLabels={false}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. Calls Widget (Moved to Second) */}
            <CallsWidget
                todos={todos}
                loading={loading}
                currentTime={currentTime}
                onCompleteCall={handleCompleteCall}
            />

            {/* 3. Vertical Stack Widgets (Tasks) */}
            <div className="space-y-4">
                {showDailyTasks && <DailyTasks entries={todayEntries} />}
                {showPassDelivery && <PassDeliveryTask count={passDeliveryCount} />}
                {showAbsentTask && <AbsentTask count={absentEntries.length} onClick={() => setAbsentListOpen(true)} />}
                {showMedicalReminders && <MedicalReminders appointments={medicalAppointments} />}
            </div>

            {/* Team Notes (Always Visible) */}
            <div className="overflow-hidden">
                <NotesWidget />
            </div>

            {/* Drawers */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={null}
                section="TOUR SPONTANEI"
                date={new Date().toISOString().slice(0, 10)}
                onSave={fetchDashboardData}
                onDelete={() => { }}
                allowSectionChange={true}
            />

            <EntryDrawer
                isOpen={rescheduleDrawerOpen}
                onClose={() => setRescheduleDrawerOpen(false)}
                entry={rescheduleEntryData}
                section={rescheduleEntryData?.section || "TOUR SPONTANEI"}
                date={new Date().toISOString().slice(0, 10)}
                onSave={onRescheduleSaved}
                onDelete={() => { }}
                allowSectionChange={true}
            />
        </div>
    );
}

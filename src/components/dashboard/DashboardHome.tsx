"use client";

import { Users, Phone, CalendarCheck, TrendingUp, Plus, CheckCircle, MessageCircle, Check, Euro, CalendarX, ThumbsDown, ArrowUpRight, Clock, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import StatCard from "./StatCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel } from "@/lib/sections";
import { useRouter } from "next/navigation";
import EntryDrawer from "../agenda/EntryDrawer";
import { cn } from "@/lib/utils";
import NotesWidget from "./NotesWidget";
import ExportPdfButton from "./ExportPdfButton";

// Helper
const cleanPhone = (num?: string) => num?.replace(/[^0-9]/g, "") || "";

export default function DashboardHome() {
    const router = useRouter();
    const [stats, setStats] = useState({
        tour: 0,
        appuntamenti: 0,
        telefonate: 0,
        vendite: 0,
        trends: {
            tour: 0,
            appuntamenti: 0,
            telefonate: 0,
            vendite: 0
        }
    });
    const [todayEntries, setTodayEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);

    // Popups State
    const [salePopup, setSalePopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [reschedulePopup, setReschedulePopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [verifyPopup, setVerifyPopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [entryToMiss, setEntryToMiss] = useState<any | null>(null); // Track entry to mark as miss after reschedule
    const [completedOpen, setCompletedOpen] = useState(true); // Default open or closed? Let's say open for visibility but collapsible.

    // New Entry Drawer State for Rescheduling
    const [rescheduleDrawerOpen, setRescheduleDrawerOpen] = useState(false);
    const [rescheduleEntryData, setRescheduleEntryData] = useState<any>(null);

    const fetchDashboardData = async () => {
        const today = new Date().toISOString().slice(0, 10);
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().slice(0, 10);

        // Fetch entries for today and yesterday
        const { data: rawEntries, error } = await supabase
            .from("entries")
            .select(`
                *,
                consulente:consulenti(name),
                tipo_abbonamento:tipi_abbonamento(name)
            `)
            .in("entry_date", [today, yesterday]);

        if (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
            return;
        }

        const allEntries = (rawEntries || []).map((e: any) => ({
            ...e,
            consulente_name: e.consulente?.name,
            tipo_abbonamento_name: e.tipo_abbonamento?.name
        }));

        const tEntries = allEntries.filter((e: any) => e.entry_date === today);
        const yEntries = allEntries.filter((e: any) => e.entry_date === yesterday);

        setTodayEntries(tEntries);

        // Helper to calc stats
        const calcStats = (entries: any[]) => ({
            tour: entries.filter(e => e.section === "TOUR SPONTANEI").length,
            telefonate: entries.filter(e => e.section === "APPUNTAMENTI TELEFONICI").length,
            appuntamenti: entries.filter(e => !["TOUR SPONTANEI", "APPUNTAMENTI TELEFONICI"].includes(e.section)).length,
            vendite: entries.filter(e => e.venduto).length
        });

        const todayStats = calcStats(tEntries);
        const yesterdayStats = calcStats(yEntries);

        setStats({
            ...todayStats,
            trends: {
                tour: todayStats.tour - yesterdayStats.tour,
                appuntamenti: todayStats.appuntamenti - yesterdayStats.appuntamenti,
                telefonate: todayStats.telefonate - yesterdayStats.telefonate,
                vendite: todayStats.vendite - yesterdayStats.vendite
            }
        });

        setLoading(false);
    };

    const fetchSubscriptionTypes = async () => {
        const { data } = await supabase.from("tipi_abbonamento").select("name").eq("active", true).order("name");
        if (data) setSubscriptionTypes(data.map(d => d.name));
    };

    useEffect(() => {
        fetchDashboardData();
        fetchSubscriptionTypes();
    }, []);

    useEffect(() => {
        setCurrentTime(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCompleteCall = async (id: string) => {
        setTodayEntries(prev => prev.map(t => t.id === id ? { ...t, contattato: true } : t));
        await supabase.from("entries").update({ contattato: true }).eq("id", id);
    };

    // Derived Lists
    const todos = todayEntries
        .filter(e => e.section === "APPUNTAMENTI TELEFONICI" && !e.venduto && !e.miss)
        .sort((a, b) => (a.entry_time || "").localeCompare(b.entry_time || ""));

    const pendingAppointments = todayEntries
        .filter(e => {
            if (e.section === "APPUNTAMENTI TELEFONICI") return false;
            if (e.section === "TOUR SPONTANEI") return false;

            // Special Logic for VERIFICHE DEL BISOGNO: Presentato = Completed
            // DB Value is "APPUNTAMENTI VERIFICHE DEL BISOGNO"
            if (e.section === "APPUNTAMENTI VERIFICHE DEL BISOGNO" && e.presentato) return false;

            // Pending if NO final outcome
            return !e.venduto && !e.miss && !e.negativo;
        })
        .sort((a, b) => (a.entry_time || "").localeCompare(b.entry_time || ""));

    const completedAppointments = todayEntries
        .filter(e => {
            if (e.section === "APPUNTAMENTI TELEFONICI") return false;
            if (e.section === "TOUR SPONTANEI") return false;

            // Special Logic for VERIFICHE DEL BISOGNO: Presentato = Completed
            if (e.section === "APPUNTAMENTI VERIFICHE DEL BISOGNO" && e.presentato) return true;

            // Completed if ANY final outcome
            return e.venduto || e.miss || e.negativo;
        })
        .sort((a, b) => (b.entry_time || "").localeCompare(a.entry_time || "")); // Recent first

    // Actions
    const onPresentato = async (entry: any) => {
        // If it's "Verifiche del Bisogno" and we are setting it to TRUE, ask for confirmation
        if (entry.section === "APPUNTAMENTI VERIFICHE DEL BISOGNO" && !entry.presentato) {
            setVerifyPopup({ open: true, entry });
            return;
        }

        // Standard toggle for others or un-checking
        const newVal = !entry.presentato;

        // If unchecking Presentato, also reset outcomes to ensure consistency and return to pending
        let updates: any = { presentato: newVal };
        if (!newVal) {
            updates = {
                presentato: false,
                venduto: false,
                negativo: false,
                miss: false,
                tipo_abbonamento_id: null
            };
        }

        setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates } : e));
        await supabase.from("entries").update(updates).eq("id", entry.id);
    };

    const confirmVerify = async () => {
        const entry = verifyPopup.entry;
        if (!entry) return;

        const newVal = true;
        setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, presentato: newVal } : e));
        await supabase.from("entries").update({ presentato: newVal }).eq("id", entry.id);
        setVerifyPopup({ open: false, entry: null });
    };

    const onNegativo = async (entry: any) => {
        // Mark as negativo, remove venduto/miss
        const updates = { negativo: true, venduto: false, miss: false };
        setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates } : e));
        await supabase.from("entries").update(updates).eq("id", entry.id);
    };

    const onMissClick = (entry: any) => {
        setReschedulePopup({ open: true, entry });
    };

    const confirmMiss = async (reschedule: boolean) => {
        const entry = reschedulePopup.entry;
        if (!entry) return;

        setReschedulePopup({ open: false, entry: null });

        if (reschedule) {
            // DO NOT update status yet. Store entry to update LATER on save.
            setEntryToMiss(entry);

            // Open drawer for new appointment with pre-filled data
            setRescheduleEntryData({
                id: "new",
                nome: entry.nome,
                cognome: entry.cognome,
                telefono: entry.telefono,
                email: entry.email,
                section: entry.section,
                consulente_id: entry.consulente_id
            });
            setRescheduleDrawerOpen(true);
        } else {
            // Just mark as Miss immediately
            const updates = { miss: true, venduto: false, negativo: false };
            setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates } : e));
            await supabase.from("entries").update(updates).eq("id", entry.id);
        }
    };

    const onRescheduleSaved = async () => {
        // Called when the NEW appointment is saved
        if (entryToMiss) {
            const updates = { miss: true, venduto: false, negativo: false };
            // Optimistic update for the OLD entry
            setTodayEntries(prev => prev.map(e => e.id === entryToMiss.id ? { ...e, ...updates } : e));
            await supabase.from("entries").update(updates).eq("id", entryToMiss.id);
            setEntryToMiss(null);
        }
        fetchDashboardData();
    };

    const onVendutoClick = (entry: any) => {
        setSalePopup({ open: true, entry });
    };

    const confirmSale = async (tipoAbbonamento: string) => {
        const entry = salePopup.entry;
        if (!entry) return;

        // Quick fix: fetch ID for the selected name
        const { data: typeData } = await supabase.from("tipi_abbonamento").select("id").eq("name", tipoAbbonamento).single();
        const typeId = typeData?.id;

        const updates = { venduto: true, presentato: true, miss: false, negativo: false, tipo_abbonamento_id: typeId };

        setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates, tipo_abbonamento_name: tipoAbbonamento } : e));
        await supabase.from("entries").update(updates).eq("id", entry.id);

        setSalePopup({ open: false, entry: null });
    };


    return (
        <>
            <div className="space-y-8 animate-in-up pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Buongiorno, Team Restart! 👋</h1>
                        <p className="text-slate-500 mt-1 font-medium">Panoramica delle attività di oggi.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <ExportPdfButton />
                        <Link href="/agenda" className="btn btn-outline bg-white/60 backdrop-blur-sm">
                            <CalendarCheck size={18} className="mr-2" />
                            Agenda
                        </Link>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="btn btn-brand"
                        >
                            <Plus size={18} className="mr-2" />
                            Nuovo Inserimento
                        </button>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stats Row */}
                    <StatCard
                        title="Tour Spontanei"
                        value={loading ? "-" : stats.tour.toString()}
                        icon={Users}
                        trend={Math.abs(stats.trends.tour).toString()}
                        trendUp={stats.trends.tour >= 0}
                        color="brand"
                    />
                    <StatCard
                        title="Appuntamenti"
                        value={loading ? "-" : stats.appuntamenti.toString()}
                        icon={CalendarCheck}
                        trend={Math.abs(stats.trends.appuntamenti).toString()}
                        trendUp={stats.trends.appuntamenti >= 0}
                        color="blue"
                    />
                    <StatCard
                        title="Telefonate"
                        value={loading ? "-" : stats.telefonate.toString()}
                        icon={Phone}
                        trend={Math.abs(stats.trends.telefonate).toString()}
                        trendUp={stats.trends.telefonate >= 0}
                        color="orange"
                    />
                    <StatCard
                        title="Vendite"
                        value={loading ? "-" : stats.vendite.toString()}
                        icon={TrendingUp}
                        trend={Math.abs(stats.trends.vendite).toString()}
                        trendUp={stats.trends.vendite >= 0}
                        color="emerald"
                    />

                    {/* Main Content: Agenda & Calls */}
                    <div className="lg:col-span-3 flex flex-col gap-6">

                        {/* PENDING APPOINTMENTS */}
                        <div className="glass-card p-6 min-h-[300px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                                        <CalendarCheck size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800">In Corso / Da Fare</h2>
                                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">{pendingAppointments.length}</span>
                                </div>
                                <Link href="/agenda" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:gap-2 transition-all">
                                    Vedi tutti <ArrowUpRight size={16} />
                                </Link>
                            </div>

                            <div className="flex-1 space-y-3">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                        <div className="spinner-dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                                        <p>Caricamento agenda...</p>
                                    </div>
                                ) : pendingAppointments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                            <CheckCircle size={24} className="text-slate-300" />
                                        </div>
                                        <p>Nessun appuntamento in attesa.</p>
                                    </div>
                                ) : (
                                    pendingAppointments.map((entry, i) => {
                                        const tel = cleanPhone(entry.telefono);
                                        const waLink = tel ? `https://wa.me/${tel}` : null;
                                        const isExpired = currentTime && entry.entry_time < currentTime;
                                        const isPresentato = entry.presentato;

                                        return (
                                            <div
                                                key={entry.id}
                                                onClick={() => router.push(`/agenda?section=${encodeURIComponent(entry.section)}&date=${entry.entry_date}`)}
                                                className={cn(
                                                    "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer animate-in-up shadow-sm",
                                                    isPresentato
                                                        ? "bg-emerald-50/50 border-emerald-200"
                                                        : isExpired
                                                            ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50" // Yellow for expired
                                                            : "bg-white border-slate-100 hover:border-sky-200"
                                                )}
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl border flex flex-col items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform",
                                                    isPresentato
                                                        ? "bg-emerald-100 border-emerald-200 text-emerald-600"
                                                        : isExpired
                                                            ? "bg-amber-100 border-amber-200 text-amber-600"
                                                            : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 text-slate-600"
                                                )}>
                                                    <span className={cn("text-[10px] font-bold uppercase",
                                                        isPresentato ? "text-emerald-600" : isExpired ? "text-amber-600" : "text-slate-400"
                                                    )}>
                                                        {isPresentato ? "IN CORSO" : isExpired ? "SCAD." : "ORA"}
                                                    </span>
                                                    <span className={cn("text-lg font-bold leading-none",
                                                        isPresentato ? "text-emerald-700" : isExpired ? "text-amber-700" : "text-slate-800"
                                                    )}>
                                                        {entry.entry_time?.slice(0, 5)}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-slate-900 truncate text-lg">{entry.nome} {entry.cognome}</h4>
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                                                            {getSectionLabel(entry.section)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1"><Users size={14} /> {entry.consulente_name || "N/D"}</span>
                                                        {entry.telefono && <span className="flex items-center gap-1"><Phone size={14} /> {entry.telefono}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                                    {waLink && (
                                                        <a
                                                            href={waLink}
                                                            target="_blank"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all border border-green-100 hover:shadow-md hover:shadow-green-200"
                                                            title="WhatsApp"
                                                        >
                                                            <MessageCircle size={18} />
                                                        </a>
                                                    )}

                                                    <div className="h-8 w-px bg-slate-200 mx-1" />

                                                    <button onClick={(e) => { e.stopPropagation(); onPresentato(entry); }} className={cn("p-2.5 rounded-xl transition-all border", entry.presentato ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-200" : "bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500")} title="Presentato">
                                                        <Check size={18} />
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); onVendutoClick(entry); }} className="p-2.5 rounded-xl transition-all border bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-500" title="Venduto">
                                                        <Euro size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onNegativo(entry); }} className="p-2.5 rounded-xl transition-all border bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-500" title="Negativo">
                                                        <ThumbsDown size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onMissClick(entry); }} className="p-2.5 rounded-xl transition-all border bg-white text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-500" title="Non Presentato">
                                                        <CalendarX size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* COMPLETED APPOINTMENTS */}
                        <div className="glass-card overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setCompletedOpen(!completedOpen)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                                        <CheckCircle size={16} />
                                    </div>
                                    <h2 className="text-base font-bold text-slate-700">Completati Oggi</h2>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{completedAppointments.length}</span>
                                </div>
                                {completedOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                            </div>

                            {completedOpen && (
                                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/30 space-y-2">
                                    {completedAppointments.length === 0 ? (
                                        <p className="text-center text-slate-400 text-xs py-4">Nessun appuntamento completato oggi.</p>
                                    ) : (
                                        completedAppointments.map((entry) => (
                                            <div key={entry.id} className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 opacity-75 hover:opacity-100 transition-opacity">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm",
                                                    entry.venduto ? "bg-emerald-500" : entry.negativo ? "bg-amber-500" : entry.miss ? "bg-rose-500" : "bg-blue-500" // Blue for 'Verifiche' completed via Presentato
                                                )}>
                                                    {entry.venduto ? <Euro size={16} /> : entry.negativo ? <ThumbsDown size={16} /> : entry.miss ? <CalendarX size={16} /> : <Check size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-slate-700 text-sm truncate">{entry.nome} {entry.cognome}</h4>
                                                        <span className="text-xs font-mono text-slate-400">{entry.entry_time?.slice(0, 5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{getSectionLabel(entry.section)}</span>
                                                        {entry.venduto && <span className="text-emerald-600 font-bold">• {entry.tipo_abbonamento_name || "Venduto"}</span>}
                                                    </div>
                                                </div>

                                                {/* Edit Actions for Completed Items */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); onPresentato(entry); }} className={cn("p-1.5 rounded-lg border", entry.presentato ? "bg-blue-100 text-blue-600 border-blue-200" : "bg-white text-slate-400 border-slate-200 hover:text-blue-500")} title="Presentato">
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onVendutoClick(entry); }} className="p-1.5 rounded-lg border bg-white text-slate-400 border-slate-200 hover:text-emerald-500 hover:border-emerald-200" title="Venduto">
                                                        <Euro size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onNegativo(entry); }} className="p-1.5 rounded-lg border bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:border-amber-200" title="Negativo">
                                                        <ThumbsDown size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onMissClick(entry); }} className="p-1.5 rounded-lg border bg-white text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-200" title="Miss">
                                                        <CalendarX size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Calls & Notes */}
                    <div className="space-y-6 lg:col-span-1 flex flex-col">
                        {/* Calls Widget */}
                        <div className="glass-card p-5 flex-1 flex flex-col max-h-[500px]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                        <Phone size={16} />
                                    </div>
                                    <h2 className="text-base font-bold text-slate-800">Da Chiamare</h2>
                                </div>
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{todos.filter(t => !t.contattato).length}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {loading ? (
                                    <div className="text-center text-slate-400 text-xs py-4">Caricamento...</div>
                                ) : todos.length === 0 ? (
                                    <div className="text-center text-slate-400 text-xs py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        Tutto fatto! 🎉
                                    </div>
                                ) : (
                                    todos.map((task) => {
                                        const time = task.entry_time?.slice(0, 5) || "";
                                        const isCompleted = task.contattato;
                                        let isUrgent = false;
                                        let isExpired = false;

                                        if (!isCompleted && time && currentTime) {
                                            if (currentTime > time) isExpired = true;
                                            else {
                                                const [h1, m1] = currentTime.split(":").map(Number);
                                                const [h2, m2] = time.split(":").map(Number);
                                                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                                if (diff <= 10 && diff >= 0) isUrgent = true;
                                            }
                                        }

                                        return (
                                            <div key={task.id} className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all relative group",
                                                isCompleted ? "bg-emerald-50/50 border-emerald-100 opacity-60" :
                                                    isUrgent ? "bg-rose-50 border-rose-100 animate-pulse" :
                                                        "bg-white border-slate-100 hover:border-sky-200 hover:shadow-sm"
                                            )}>
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full flex-shrink-0",
                                                    isCompleted ? "bg-emerald-500" : isExpired ? "bg-rose-400" : isUrgent ? "bg-red-500" : "bg-orange-400"
                                                )} />

                                                <div className="min-w-0 flex-1">
                                                    <p className={cn("text-sm font-bold truncate", isCompleted ? "text-emerald-800 line-through" : "text-slate-800")}>
                                                        {task.nome} {task.cognome}
                                                    </p>
                                                    {task.telefono && (
                                                        <p className="text-xs text-slate-500 font-mono mb-0.5">{task.telefono}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px]">
                                                        <span className={cn(
                                                            "flex items-center gap-1",
                                                            isCompleted ? "text-emerald-600" : isUrgent ? "text-rose-600 font-bold" : "text-slate-500"
                                                        )}>
                                                            <Clock size={10} />
                                                            {task.entry_time ? task.entry_time.slice(0, 5) : "Oggi"}
                                                        </span>
                                                        {task.consulente_name && (
                                                            <span className="text-slate-400 flex items-center gap-0.5">
                                                                • {task.consulente_name}
                                                            </span>
                                                        )}
                                                        {isExpired && !isCompleted && (
                                                            <span className="text-rose-500 flex items-center gap-0.5 font-bold ml-auto">
                                                                <AlertCircle size={10} /> Scaduto
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {!isCompleted ? (
                                                    <button
                                                        onClick={() => handleCompleteCall(task.id)}
                                                        className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Fatto"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                ) : (
                                                    <CheckCircle size={16} className="text-emerald-500" />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Notes Widget */}
                        <div className="flex-1">
                            <NotesWidget />
                        </div>
                    </div>
                </div>

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

                {/* Reschedule Drawer */}
                <EntryDrawer
                    isOpen={rescheduleDrawerOpen}
                    onClose={() => setRescheduleDrawerOpen(false)}
                    entry={rescheduleEntryData} // Pass as entry
                    section={rescheduleEntryData?.section || "TOUR SPONTANEI"}
                    date={new Date().toISOString().slice(0, 10)}
                    onSave={onRescheduleSaved} // Use special handler
                    onDelete={() => { }}
                    allowSectionChange={true}
                />
            </div>

            {/* Sale Popup */}
            {salePopup.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Registra Vendita 💰</h3>
                            <button onClick={() => setSalePopup({ open: false, entry: null })} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <p className="text-slate-600 mb-4 text-sm">Che abbonamento ha acquistato <strong>{salePopup.entry?.nome}</strong>?</p>

                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {subscriptionTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => confirmSale(type)}
                                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left font-medium text-slate-700 transition-all text-sm"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Popup */}
            {reschedulePopup.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Cliente non presentato 👻</h3>
                            <button onClick={() => setReschedulePopup({ open: false, entry: null })} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">Vuoi riprogrammare subito un nuovo appuntamento per <strong>{reschedulePopup.entry?.nome}</strong>?</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => confirmMiss(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
                            >
                                No, solo Miss
                            </button>
                            <button
                                onClick={() => confirmMiss(true)}
                                className="flex-1 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all text-sm"
                            >
                                Sì, Riprogramma
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verify Popup */}
            {verifyPopup.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Conferma Presentato ✅</h3>
                            <button onClick={() => setVerifyPopup({ open: false, entry: null })} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">
                            Confermi che <strong>{verifyPopup.entry?.nome}</strong> si è presentato?
                            <br />
                            <span className="text-xs text-slate-400 mt-1 block">L'appuntamento verrà segnato come completato.</span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setVerifyPopup({ open: false, entry: null })}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={confirmVerify}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all text-sm"
                            >
                                Conferma
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


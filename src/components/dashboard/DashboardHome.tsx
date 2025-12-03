"use client";

import { Users, Phone, CalendarCheck, TrendingUp, Plus, CheckCircle, MessageCircle, Check, Euro, CalendarX, ThumbsDown, ArrowUpRight, Clock, AlertCircle, ChevronDown, ChevronUp, X, Ghost } from "lucide-react";
import StatCard from "./StatCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel } from "@/lib/sections";
import { useRouter } from "next/navigation";
import EntryDrawer from "../agenda/EntryDrawer";
import { cn } from "@/lib/utils";
import { formatDate, getLocalDateISO } from "@/lib/dateUtils";
import { getWhatsAppLink, markWhatsAppSent, cleanPhone } from "@/lib/whatsapp";
import NotesWidget from "./NotesWidget";
import ExportPdfButton from "./ExportPdfButton";
import DailyTasks from "./DailyTasks";
import MedicalReminders from "./MedicalReminders";
import CallsWidget from "./CallsWidget";
import CallReminderPopup from "./CallReminderPopup";
import { useOutcomeManager } from "@/hooks/useOutcomeManager";
import OutcomeButtons from "../outcomes/OutcomeButtons";
import { SalePopup, ReschedulePopup, VerifyPopup, AbsentPopup } from "../outcomes/OutcomePopups";
import DashboardMobile from "./DashboardMobile";
import PassDeliveryTask from "./PassDeliveryTask";
import MotivationalQuote from "./MotivationalQuote";
import AbsentTask from "./AbsentTask";
import AbsentListPopup from "./AbsentListPopup";
import ConfirmationListPopup from "./ConfirmationListPopup";

// Helper
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
    const [medicalAppointments, setMedicalAppointments] = useState<any[]>([]);
    const [statsOpen, setStatsOpen] = useState(true); // Default open as requested

    // Call Reminder State
    const [activeCallReminder, setActiveCallReminder] = useState<any | null>(null);
    const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
    const [completedOpen, setCompletedOpen] = useState(false);
    const [passDeliveryCount, setPassDeliveryCount] = useState(0);

    // Absent Task State
    const [absentEntries, setAbsentEntries] = useState<any[]>([]);
    const [absentListOpen, setAbsentListOpen] = useState(false);
    const [absentRescheduleDrawerOpen, setAbsentRescheduleDrawerOpen] = useState(false);
    const [absentRescheduleEntry, setAbsentRescheduleEntry] = useState<any | null>(null);

    // Confirmation Popup State
    const [confirmationPopupOpen, setConfirmationPopupOpen] = useState(false);

    // Filter for appointments that typically need reminders (Same logic as DailyTasks)
    const dailyTaskEntries = todayEntries.filter(e => {
        if (e.section === "TOUR SPONTANEI") return false;
        if (e.section === "APPUNTAMENTI TELEFONICI") return false;

        // Logic: Show reminder ONLY if created BEFORE 06:30 of the appointment date.
        const cutoff = new Date(`${e.entry_date}T06:30:00`);
        const created = new Date(e.created_at);

        return created < cutoff;
    });

    const handleConfirmSent = async (entry: any) => {
        const link = getWhatsAppLink(entry);
        if (!link) return alert("Numero non valido.");
        window.open(link, "_blank");

        if (!entry.whatsapp_sent) {
            const success = await markWhatsAppSent(entry.id);
            if (success) {
                setTodayEntries(prev => prev.map(e => e.id === entry.id ? { ...e, whatsapp_sent: true } : e));
            }
        }
    };

    const fetchDashboardData = async () => {
        const today = getLocalDateISO();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const offset = yesterdayDate.getTimezoneOffset();
        const localYesterday = new Date(yesterdayDate.getTime() - (offset * 60 * 1000));
        const yesterday = localYesterday.toISOString().slice(0, 10);

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

    const fetchMedicalReminders = async () => {
        const today = getLocalDateISO();
        const maxDateObj = new Date();
        maxDateObj.setDate(maxDateObj.getDate() + 2);
        const maxDate = maxDateObj.toISOString().slice(0, 10);

        // 1. Find sessions in range [today, today+2]
        const { data: sessions } = await supabase
            .from("medical_sessions")
            .select("id")
            .gte("date", today)
            .lte("date", maxDate);

        if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            // 2. Fetch appointments for these sessions
            const { data: appointments } = await supabase
                .from("medical_appointments")
                .select("*")
                .in("session_id", sessionIds);

            if (appointments) {
                setMedicalAppointments(appointments);
            } else {
                setMedicalAppointments([]);
            }
        } else {
            setMedicalAppointments([]);
        }
    };

    const fetchPassDeliveries = async () => {
        // Use getLocalDateISO to get "today" in YYYY-MM-DD local time
        const todayStr = getLocalDateISO();
        // Convert to Date object to subtract days safely
        const d = new Date(todayStr);
        d.setDate(d.getDate() - 2); // Aligned with UI "Yellow" logic (Math.ceil difference)
        const limitDate = d.toISOString().slice(0, 10);

        const { count, error } = await supabase
            .from("pass_items")
            .select("*", { count: "exact", head: true })
            .lte("data_consegna", limitDate)
            .is("data_attivazione", null)
            .is("whatsapp_sent_date", null);

        setPassDeliveryCount(count || 0);
    };

    const fetchAbsentEntries = async () => {
        const today = getLocalDateISO();

        // Fetch entries that are currently marked as absent
        const { data: currentAbsent, error: absentError } = await supabase
            .from("entries")
            .select(`
                id,
                entry_date,
                entry_time,
                created_at,
                assente,
                *,
                consulente:consulenti(name),
                tipo_abbonamento:tipi_abbonamento(name)
            `)
            .eq("assente", true)
            .not("negativo", "eq", true)
            .not("miss", "eq", true);

        if (absentError) {
            console.error("Error fetching absent entries:", absentError);
            return;
        }

        // Filter client-side for entries before today 06:30 AND exclude those marked as (NON PRESENTATO)
        const filteredAbsent = (currentAbsent || []).filter((e: any) => {
            // Exclude if note contains (NON PRESENTATO)
            if (e.note && e.note.includes("(NON PRESENTATO)")) return false;

            // For PAST dates: include ALL absents regardless of when created
            if (e.entry_date < today) {
                return true;
            }

            // For TODAY's dates: only include if created before 06:30 AND entry_time < 06:30
            if (e.entry_date === today) {
                const entryCutoff = new Date(`${e.entry_date}T06:30:00`);
                const entryCreated = new Date(e.created_at);
                const createdBeforeCutoff = entryCreated < entryCutoff;
                const timeBeforeCutoff = e.entry_time && e.entry_time < "06:30:00";

                return createdBeforeCutoff && timeBeforeCutoff;
            }

            // Future dates: exclude
            return false;
        });

        const entries = filteredAbsent.map((e: any) => ({
            ...e,
            consulente_name: e.consulente?.name,
            tipo_abbonamento_name: e.tipo_abbonamento?.name
        }));

        setAbsentEntries(entries);
    };

    useEffect(() => {
        fetchDashboardData();
        fetchMedicalReminders();
        fetchPassDeliveries();
        fetchAbsentEntries();
    }, []);

    useEffect(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
        setCurrentTime(timeString);

        // Check for call reminders every minute
        const checkReminders = () => {
            const nowTime = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
            setCurrentTime(nowTime);
        };

        const interval = setInterval(checkReminders, 60000);
        return () => clearInterval(interval);
    }, []);

    // Separate effect for checking reminders when time or entries change
    useEffect(() => {
        if (!currentTime || todayEntries.length === 0) return;

        const todos = todayEntries
            .filter(e => e.section === "APPUNTAMENTI TELEFONICI" && !e.venduto && !e.miss && !e.contattato);

        const upcomingCall = todos.find(task => {
            if (!task.entry_time) return false;
            if (dismissedReminders.includes(task.id)) return false;

            const [h1, m1] = currentTime.split(":").map(Number);
            const [h2, m2] = task.entry_time.split(":").map(Number);
            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);

            // Show if between 1 and 10 minutes before
            return diff <= 10 && diff > 0;
        });

        if (upcomingCall && (!activeCallReminder || activeCallReminder.id !== upcomingCall.id)) {
            setActiveCallReminder(upcomingCall);
        }
    }, [currentTime, todayEntries, dismissedReminders, activeCallReminder]);

    const handleCompleteCall = async (id: string) => {
        setTodayEntries(prev => prev.map(t => t.id === id ? { ...t, contattato: true } : t));
        await supabase.from("entries").update({ contattato: true }).eq("id", id);
    };

    // Outcome Manager
    const {
        salePopup, setSalePopup,
        reschedulePopup, setReschedulePopup,
        verifyPopup, setVerifyPopup,
        absentPopup, setAbsentPopup,
        rescheduleDrawerOpen, setRescheduleDrawerOpen,
        rescheduleEntryData,
        handleOutcomeClick,
        confirmVerify,
        confirmSale,
        confirmMiss,
        confirmAbsent,
        onRescheduleSaved
    } = useOutcomeManager(fetchDashboardData);

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
            return !e.venduto && !e.miss && !e.negativo && !e.assente;
        })
        .sort((a, b) => (a.entry_time || "").localeCompare(b.entry_time || ""));

    const completedAppointments = todayEntries
        .filter(e => {
            if (e.section === "APPUNTAMENTI TELEFONICI") return false;
            if (e.section === "TOUR SPONTANEI") return false;

            // Special Logic for VERIFICHE DEL BISOGNO: Presentato = Completed
            if (e.section === "APPUNTAMENTI VERIFICHE DEL BISOGNO" && e.presentato) return true;

            // Completed if ANY final outcome
            return e.venduto || e.miss || e.negativo || e.assente;
        })
        .sort((a, b) => (b.entry_time || "").localeCompare(a.entry_time || "")); // Recent first

    const handleWhatsApp = async (entry: any) => {
        const link = getWhatsAppLink(entry, true); // Use empty message
        if (!link) return alert("Numero non valido.");
        window.open(link, "_blank");
        // Generic button does NOT mark as sent anymore
    };

    // Load subscription types for SalePopup
    useEffect(() => {
        fetch("/api/settings/tipo/list")
            .then(res => res.json())
            .then(data => {
                if (data.items) setSubscriptionTypes(data.items.map((t: any) => t.name));
            });
    }, []);

    const handleReminderComplete = async () => {
        if (!activeCallReminder) return;
        await handleCompleteCall(activeCallReminder.id);
        setActiveCallReminder(null);
    };

    const handleReminderClose = () => {
        if (!activeCallReminder) return;
        setDismissedReminders(prev => [...prev, activeCallReminder.id]);
        setActiveCallReminder(null);
    };

    // Absent Task Handlers
    const handleAbsentWhatsApp = async (entry: any) => {
        const link = getWhatsAppLink(entry);
        if (!link) return alert("Numero non valido.");
        window.open(link, "_blank");

        if (!entry.whatsapp_sent) {
            const success = await markWhatsAppSent(entry.id);
            if (success) {
                setAbsentEntries(prev => prev.map(e => e.id === entry.id ? { ...e, whatsapp_sent: true } : e));
            }
        }
    };

    const handleAbsentReschedule = (entry: any) => {
        setAbsentRescheduleEntry(entry);
        setAbsentRescheduleDrawerOpen(true);
        setAbsentListOpen(false); // Close popup when opening drawer
    };

    const handleAbsentRescheduleSaved = async () => {
        if (!absentRescheduleEntry) return;

        // Update old entry: remove assente, set miss to true
        const { error } = await supabase
            .from("entries")
            .update({
                assente: false,
                miss: true
            })
            .eq("id", absentRescheduleEntry.id);

        if (error) {
            console.error("Error updating absent entry:", error);
            alert("Errore durante l'aggiornamento dell'appuntamento assente.");
            return;
        }

        // Refresh data
        await fetchDashboardData();
        await fetchAbsentEntries();

        setAbsentRescheduleDrawerOpen(false);
        setAbsentRescheduleEntry(null);
    };

    const handleAbsentNegative = async (entry: any) => {
        if (!confirm("Confermi che l'utente non si è presentato e vuoi rimuoverlo dalla lista recuperi?")) {
            return;
        }

        const newNote = (entry.note ? entry.note + " " : "") + "(NON PRESENTATO)";

        // Update entry: keep assente=true, do NOT set negativo=true, just update notes
        const { error } = await supabase
            .from("entries")
            .update({
                note: newNote
            })
            .eq("id", entry.id);

        if (error) {
            console.error("Error updating entry note:", error);
            alert("Errore durante l'aggiornamento.");
            return;
        }

        // Refresh data
        await fetchDashboardData();
        await fetchAbsentEntries();
    };

    // Responsive Grid Logic
    // Responsive Grid Logic
    const showDailyTasks = true; // Always shown
    const showMedicalReminders = medicalAppointments.length > 0;
    const showPassDelivery = true; // Always shown
    const showAbsentTask = true; // Always shown
    // CallsWidget moved to right column, so not part of this grid anymore

    const activeWidgetsCount = [showDailyTasks, showMedicalReminders, showPassDelivery, showAbsentTask].filter(Boolean).length;
    const gridColsClass = activeWidgetsCount === 1 ? 'grid-cols-1' : activeWidgetsCount === 2 ? 'grid-cols-1 md:grid-cols-2' : activeWidgetsCount === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

    // ... existing imports ...

    // ... inside DashboardHome component ...

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden">
                <DashboardMobile
                    stats={stats}
                    loading={loading}
                    todayEntries={todayEntries}
                    medicalAppointments={medicalAppointments}
                    todos={todos}
                    currentTime={currentTime}
                    pendingAppointments={pendingAppointments}
                    handleCompleteCall={handleCompleteCall}
                    handleOutcomeClick={handleOutcomeClick}
                    handleWhatsApp={handleWhatsApp}
                    setDrawerOpen={setDrawerOpen}
                    drawerOpen={drawerOpen}
                    fetchDashboardData={fetchDashboardData}
                    rescheduleDrawerOpen={rescheduleDrawerOpen}
                    setRescheduleDrawerOpen={setRescheduleDrawerOpen}
                    rescheduleEntryData={rescheduleEntryData}
                    onRescheduleSaved={onRescheduleSaved}
                    passDeliveryCount={passDeliveryCount}
                    absentEntries={absentEntries}
                    setAbsentListOpen={setAbsentListOpen}
                    handleConfirmSent={handleConfirmSent}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block space-y-8 animate-in-up pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Buongiorno, Team Restart! 👋</h1>
                        <MotivationalQuote />
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

                {/* Collapsible Stats Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setStatsOpen(!statsOpen)}
                            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            {statsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {statsOpen ? "Nascondi Statistiche" : "Mostra Statistiche"}
                        </button>
                    </div>

                    {statsOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in-fade-in slide-in-from-top-2">
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
                        </div>
                    )}
                </div>

                {/* PRIORITY TASKS ROW */}
                <div className={`grid ${gridColsClass} gap-6`}>
                    {showDailyTasks && <DailyTasks entries={todayEntries} onClick={() => setConfirmationPopupOpen(true)} />}

                    {showPassDelivery && (
                        <PassDeliveryTask count={passDeliveryCount} />
                    )}

                    {showAbsentTask && (
                        <AbsentTask
                            count={absentEntries.length}
                            onClick={() => setAbsentListOpen(true)}
                        />
                    )}

                    {showMedicalReminders && (
                        <MedicalReminders appointments={medicalAppointments} />
                    )}
                </div>

                {/* Main Content: Agenda & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Agenda (2/3 width) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
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
                                                        <h4 className="font-bold text-slate-900 text-lg leading-tight">
                                                            {entry.nome} {entry.cognome}
                                                            {entry.whatsapp_sent && (
                                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                                                                    <MessageCircle size={10} className="fill-emerald-600" />
                                                                    CONFERMA INVIATA
                                                                </div>
                                                            )}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-200 w-fit">
                                                            {getSectionLabel(entry.section)}
                                                        </span>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1"><Users size={14} /> {entry.consulente_name || "N/D"}</span>
                                                            {entry.telefono && <span className="flex items-center gap-1"><Phone size={14} /> {entry.telefono}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                                    {waLink && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleWhatsApp(entry); }}
                                                            className={cn(
                                                                "p-2.5 rounded-xl transition-all border",
                                                                "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white hover:shadow-md hover:shadow-green-200"
                                                            )}
                                                            title="Apri WhatsApp"
                                                        >
                                                            <MessageCircle size={18} />
                                                        </button>
                                                    )}

                                                    <div className="h-8 w-px bg-slate-200 mx-1" />

                                                    <OutcomeButtons
                                                        entry={entry}
                                                        onOutcomeClick={handleOutcomeClick}
                                                        size="sm"
                                                        showLabels={true}
                                                    />
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
                                                    entry.venduto ? "bg-emerald-700" : entry.negativo ? "bg-red-600" : entry.miss ? "bg-orange-500" : entry.assente ? "bg-yellow-400" : "bg-emerald-500"
                                                )}>
                                                    {entry.venduto ? <Euro size={16} /> : entry.negativo ? <ThumbsDown size={16} /> : entry.miss ? <CalendarX size={16} /> : entry.assente ? <Ghost size={16} /> : <Check size={16} />}
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
                                                    <OutcomeButtons
                                                        entry={entry}
                                                        onOutcomeClick={handleOutcomeClick}
                                                        size="sm"
                                                        showLabels={false}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Notes (1/3 width) */}
                    <div className="space-y-6 flex flex-col">
                        <CallsWidget
                            todos={todos}
                            loading={loading}
                            currentTime={currentTime}
                            onCompleteCall={handleCompleteCall}
                        />
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

            {/* Popups */}
            <SalePopup
                isOpen={salePopup.open}
                onClose={() => setSalePopup({ open: false, entry: null })}
                entry={salePopup.entry}
                subscriptionTypes={subscriptionTypes}
                onConfirm={confirmSale}
            />
            <ReschedulePopup
                isOpen={reschedulePopup.open}
                onClose={() => setReschedulePopup({ open: false, entry: null })}
                entry={reschedulePopup.entry}
                onConfirm={confirmMiss}
            />
            <VerifyPopup
                isOpen={verifyPopup.open}
                onClose={() => setVerifyPopup({ open: false, entry: null })}
                entry={verifyPopup.entry}
                onConfirm={confirmVerify}
            />
            <AbsentPopup
                isOpen={absentPopup.open}
                onClose={() => setAbsentPopup({ open: false, entry: null })}
                entry={absentPopup.entry}
                onConfirm={confirmAbsent}
            />
            <ConfirmationListPopup
                isOpen={confirmationPopupOpen}
                onClose={() => setConfirmationPopupOpen(false)}
                entries={dailyTaskEntries}
                onConfirm={handleConfirmSent}
            />

            {/* Call Reminder Popup */}
            <CallReminderPopup
                call={activeCallReminder}
                onComplete={handleReminderComplete}
                onClose={handleReminderClose}
            />

            {/* Absent List Popup */}
            <AbsentListPopup
                isOpen={absentListOpen}
                onClose={() => setAbsentListOpen(false)}
                entries={absentEntries}
                onWhatsApp={handleAbsentWhatsApp}
                onReschedule={handleAbsentReschedule}
                onNegative={handleAbsentNegative}
            />

            {/* Absent Reschedule Drawer */}
            <EntryDrawer
                isOpen={absentRescheduleDrawerOpen}
                onClose={() => {
                    setAbsentRescheduleDrawerOpen(false);
                    setAbsentRescheduleEntry(null);
                }}
                entry={absentRescheduleEntry ? {
                    id: "new", // Force "new" ID
                    section: absentRescheduleEntry.section, // Keep section but allow change
                    entry_date: new Date().toISOString().slice(0, 10), // Today
                    entry_time: "", // Reset time
                    nome: absentRescheduleEntry.nome,
                    cognome: absentRescheduleEntry.cognome,
                    telefono: absentRescheduleEntry.telefono,
                    consulente_id: absentRescheduleEntry.consulente_id,
                    tipo_abbonamento_id: absentRescheduleEntry.tipo_abbonamento_id,
                    fonte: absentRescheduleEntry.fonte,
                    note: absentRescheduleEntry.note,
                    // Reset all outcomes
                    miss: false,
                    venduto: false,
                    presentato: false,
                    negativo: false,
                    assente: false,
                    comeback: false,
                    contattato: false
                } : null}
                section={absentRescheduleEntry?.section || "TOUR SPONTANEI"}
                date={new Date().toISOString().slice(0, 10)}
                onSave={handleAbsentRescheduleSaved}
                onDelete={() => { }}
                allowSectionChange={true}
            />
        </>
    );
}


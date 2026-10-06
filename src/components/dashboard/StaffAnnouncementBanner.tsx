"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { 
    Megaphone, 
    AlertTriangle, 
    Pencil, 
    X, 
    Check, 
    Trash2, 
    Clock, 
    ChevronDown, 
    ChevronUp
} from "lucide-react";
import { getLocalDateISO } from "@/lib/dateUtils";

interface Announcement {
    id: string;
    message: string;
    type: "info" | "warning";
    author: string;
    is_active: boolean;
    expires_mode: "today" | "always";
    created_date: string;
    created_at: string;
    updated_at: string;
}

export default function StaffAnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Form State (solo Informativo o Urgente)
    const [formMessage, setFormMessage] = useState("");
    const [formType, setFormType] = useState<"info" | "warning">("info");
    const [formAuthor, setFormAuthor] = useState("Roberto");
    const [formExpiresMode, setFormExpiresMode] = useState<"today" | "always">("today");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Carica l'avviso attivo
    const fetchActiveAnnouncement = async () => {
        try {
            const today = getLocalDateISO();
            const { data, error } = await supabase
                .from("daily_announcements")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Errore fetch avviso bacheca:", error);
                setAnnouncement(null);
                return;
            }

            if (data && data.length > 0) {
                const current = data[0] as any;
                // Normalizza tipo se era 'target'
                if (current.type !== "warning") {
                    current.type = "info";
                }

                // Controlla se era valido solo per oggi ed è un giorno diverso
                if (current.expires_mode === "today" && current.created_date !== today) {
                    setAnnouncement(null);
                } else {
                    setAnnouncement(current as Announcement);
                }
            } else {
                setAnnouncement(null);
            }
        } catch (err) {
            console.error("Errore recupero bacheca:", err);
            setAnnouncement(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveAnnouncement();

        // Iscrizione a Supabase Realtime per aggiornamenti istantanei tra dispositivi
        const channel = supabase
            .channel("daily_announcements_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "daily_announcements" },
                () => {
                    fetchActiveAnnouncement();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleOpenModal = () => {
        if (announcement) {
            setFormMessage(announcement.message);
            setFormType(announcement.type === "warning" ? "warning" : "info");
            setFormAuthor(announcement.author || "Roberto");
            setFormExpiresMode(announcement.expires_mode || "today");
        } else {
            setFormMessage("");
            setFormType("info");
            setFormAuthor("Roberto");
            setFormExpiresMode("today");
        }
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formMessage.trim()) return;

        setSaving(true);
        try {
            const today = getLocalDateISO();

            // Disattiva eventuali vecchi avvisi
            await supabase
                .from("daily_announcements")
                .update({ is_active: false })
                .eq("is_active", true);

            // Inserisci il nuovo avviso
            const { data, error } = await supabase
                .from("daily_announcements")
                .insert({
                    message: formMessage.trim().toUpperCase(),
                    type: formType,
                    author: formAuthor.trim() || "Direzione",
                    expires_mode: formExpiresMode,
                    is_active: true,
                    created_date: today,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            setAnnouncement(data as Announcement);
            setModalOpen(false);
        } catch (err: any) {
            console.error("Errore salvataggio avviso:", err);
            alert("Errore durante il salvataggio dell'avviso: " + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!announcement) return;
        if (!confirm("Vuoi rimuovere questo avviso dalla bacheca?")) return;

        setSaving(true);
        try {
            await supabase
                .from("daily_announcements")
                .update({ is_active: false })
                .eq("id", announcement.id);

            setAnnouncement(null);
            setModalOpen(false);
        } catch (err: any) {
            console.error("Errore cancellazione avviso:", err);
            alert("Errore durante la rimozione.");
        } finally {
            setSaving(false);
        }
    };

    // Stili grafici in base al tipo (info o warning)
    const getTypeConfig = (type: string) => {
        if (type === "warning") {
            return {
                isUrgent: true,
                // Bordo rosso spesso con ring pulsante rosso vivo
                containerClass: "bg-gradient-to-r from-red-50 via-rose-50/70 to-white border-2 border-red-500 ring-4 ring-red-400/40 shadow-lg shadow-red-500/15 animate-pulse",
                badgeBg: "bg-red-600 text-white shadow-sm",
                badgeLabel: "URGENTE / ATTENZIONE",
                textClass: "text-red-950 font-extrabold",
                accentColor: "text-red-600",
                Icon: AlertTriangle
            };
        }

        // Informativo standard
        return {
            isUrgent: false,
            containerClass: "bg-gradient-to-r from-cyan-50/80 via-brand/10 to-white border border-brand/40 shadow-sm shadow-brand/5",
            badgeBg: "bg-brand text-white shadow-xs",
            badgeLabel: "AVVISO DI SERVIZIO",
            textClass: "text-slate-900 font-bold",
            accentColor: "text-brand",
            Icon: Megaphone
        };
    };

    const timeString = announcement?.created_at ? (() => {
        const d = new Date(announcement.created_at);
        const hours = d.getHours().toString().padStart(2, "0");
        const minutes = d.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
    })() : "";

    return (
        <>
            {/* Banner visibile in Dashboard */}
            {announcement ? (
                (() => {
                    const config = getTypeConfig(announcement.type);
                    const { Icon } = config;
                    const isLongText = announcement.message.length > 220;

                    return (
                        <div className={cn(
                            "relative w-full rounded-2xl p-4 md:p-6 transition-all group animate-in fade-in duration-300",
                            config.containerClass
                        )}>
                            {/* Fascia Superiore: Badge, Autore & Tasto Modifica */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 pb-3">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                                        config.badgeBg
                                    )}>
                                        <Icon size={14} className="shrink-0" />
                                        {config.badgeLabel}
                                    </span>

                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                        <Clock size={12} className="text-slate-400" />
                                        {announcement.created_date === getLocalDateISO() ? "Oggi" : announcement.created_date}
                                        {timeString && ` alle ${timeString}`}
                                        {announcement.author && ` • da ${announcement.author}`}
                                    </span>

                                    {announcement.expires_mode === "today" ? (
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                                            Valido solo oggi
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                                            Sempre attivo
                                        </span>
                                    )}
                                </div>

                                {/* Tasto Modifica */}
                                <button
                                    onClick={handleOpenModal}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/90 transition-all border border-transparent hover:border-slate-200 shrink-0 shadow-2xs"
                                    title="Modifica o Rimuovi Avviso"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>

                            {/* TESTO DEL MESSAGGIO: Molto più grande, in evidenza assoluta, sempre in MAIUSCOLO */}
                            <div className={cn(
                                "mt-3.5 text-base md:text-lg lg:text-[19px] leading-snug md:leading-normal tracking-tight whitespace-pre-line uppercase font-black",
                                config.textClass,
                                !expanded && isLongText && "line-clamp-3 md:line-clamp-4"
                            )}>
                                {announcement.message}
                            </div>

                            {/* Toggle "Mostra di più" per messaggi lunghi */}
                            {isLongText && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="mt-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                                >
                                    {expanded ? (
                                        <>Riduci testo <ChevronUp size={13} /></>
                                    ) : (
                                        <>Leggi tutto il messaggio <ChevronDown size={13} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })()
            ) : (
                /* Nessun avviso attivo: pulsantino discreto */
                <div className="w-full flex justify-end">
                    <button
                        onClick={handleOpenModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-brand hover:bg-brand/5 border border-dashed border-slate-300 hover:border-brand/40 rounded-xl transition-all shadow-2xs group"
                    >
                        <Megaphone size={14} className="text-slate-400 group-hover:text-brand transition-colors" />
                        <span>+ Bacheca avviso del giorno</span>
                    </button>
                </div>
            )}

            {/* MODAL DI SCRITTURA / MODIFICA */}
            {mounted && modalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-brand" />
                                <h3 className="text-base font-bold text-slate-900">
                                    {announcement ? "Modifica Avviso Bacheca" : "Nuovo Avviso per lo Staff"}
                                </h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Selezione solo: Informativo vs Urgente */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Tipo di Comunicazione
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormType("info")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs md:text-sm font-extrabold transition-all",
                                            formType === "info"
                                                ? "bg-brand/10 border-brand text-brand ring-2 ring-brand/30 shadow-xs"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <Megaphone size={18} />
                                        Informativo
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormType("warning")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs md:text-sm font-extrabold transition-all",
                                            formType === "warning"
                                                ? "bg-red-50 border-red-500 text-red-600 ring-2 ring-red-500/30 shadow-xs"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <AlertTriangle size={18} />
                                        Urgente (Bordo Lampeggiante)
                                    </button>
                                </div>
                            </div>

                            {/* Testo del Messaggio */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Testo del Messaggio (In Evidenza)
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formMessage}
                                    onChange={(e) => setFormMessage(e.target.value)}
                                    placeholder="Scrivi qui la comunicazione per lo staff..."
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm md:text-base focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all resize-none font-bold text-slate-900 uppercase"
                                />
                            </div>

                            {/* Opzioni: Autore e Durata */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Firma / Autore
                                    </label>
                                    <input
                                        type="text"
                                        value={formAuthor}
                                        onChange={(e) => setFormAuthor(e.target.value)}
                                        placeholder="es. Roberto, Direzione..."
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand outline-none font-semibold text-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Durata
                                    </label>
                                    <select
                                        value={formExpiresMode}
                                        onChange={(e) => setFormExpiresMode(e.target.value as any)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand outline-none bg-white font-semibold text-slate-800"
                                    >
                                        <option value="today">Solo per oggi (scade a mezzanotte)</option>
                                        <option value="always">Sempre attivo (finché non lo tolgo)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Azioni Inferiori */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                {announcement ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 size={14} />
                                        Rimuovi avviso
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        disabled={saving}
                                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || !formMessage.trim()}
                                        className="px-5 py-2 text-xs font-bold text-white bg-brand hover:brightness-105 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Check size={14} />
                                        {saving ? "Salvataggio..." : "Salva e Pubblica"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

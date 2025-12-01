import { SalePopup, ReschedulePopup, VerifyPopup, AbsentPopup } from "../outcomes/OutcomePopups";
import { useOutcomeManager } from "@/hooks/useOutcomeManager";
import OutcomeButtons from "../outcomes/OutcomeButtons";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Filter, Phone, Check, MessageCircle, Copy, Users } from "lucide-react";
import { getWhatsAppLink, markWhatsAppSent, toHHMM } from "@/lib/whatsapp";
import { getLocalDateISO } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabaseClient";
import EntryDrawer from "./EntryDrawer";

export default function AgendaTable({ section }: { section: string }) {
    const router = useRouter();
    const sp = useSearchParams();
    const dateParam = sp?.get("date") ?? getLocalDateISO();

    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
    const [isDuplicateMode, setIsDuplicateMode] = useState(false);

    const isTelefonici = section === "APPUNTAMENTI TELEFONICI";

    const fetchRows = async () => {
        setLoading(true);
        let q = supabase
            .from("entries")
            .select(`*, consulente:consulenti(*), tipo_abbonamento:tipi_abbonamento(*)`)
            .eq("section", section)
            .eq("entry_date", dateParam)
            .order("entry_time", { ascending: true });

        const { data, error } = await q;
        if (error) console.error(error);
        else setRows(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRows();
    }, [section, dateParam]);

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
    } = useOutcomeManager(fetchRows); // Refresh rows on update

    // Load subscription types for SalePopup
    const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);
    useEffect(() => {
        fetch("/api/settings/tipo/list")
            .then(res => res.json())
            .then(data => {
                if (data.items) setSubscriptionTypes(data.items.map((t: any) => t.name));
            });
    }, []);

    const filteredRows = rows.filter(r => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.nome?.toLowerCase().includes(s) ||
            r.cognome?.toLowerCase().includes(s) ||
            r.telefono?.includes(s)
        );
    });

    const handleRowClick = (row: any) => {
        setSelectedEntry(row);
        setIsDuplicateMode(false);
        setDrawerOpen(true);
    };

    const handleNewClick = () => {
        setSelectedEntry(null);
        setIsDuplicateMode(false);
        setDrawerOpen(true);
    };

    const handleDuplicate = (row: any) => {
        setSelectedEntry(row);
        setIsDuplicateMode(true);
        setDrawerOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa riga?")) return;
        await supabase.from("entries").delete().eq("id", id);
        setDrawerOpen(false);
        fetchRows();
    };

    const handlePhoneToggle = async (row: any) => {
        const newValue = !row.contattato;
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, contattato: newValue } : r));
        await supabase.from("entries").update({ contattato: newValue }).eq("id", row.id);
    };

    const handleWhatsAppClick = async (row: any) => {
        const link = getWhatsAppLink(row, true); // Use empty message
        if (!link) return;

        window.open(link, "_blank");
        // Generic button does NOT mark as sent anymore
    };

    return (
        <div className="flex flex-col bg-white/50 backdrop-blur-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white/40">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                    <input
                        className="input pl-10 w-full bg-white/80 border-slate-200 focus:border-brand/50 focus:ring-brand/20 transition-all"
                        placeholder="Cerca cliente o telefono..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleNewClick}
                    className="btn btn-brand"
                >
                    <Plus size={18} className="mr-2" />
                    Nuovo
                </button>
            </div>

            {/* Table */}
            <div className="w-full">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Ora</th>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Consulente</th>
                            {!isTelefonici && <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Abbonamento</th>}
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Stato</th>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="spinner-dots"><div className="dot bg-slate-300"></div><div className="dot bg-slate-300"></div><div className="dot bg-slate-300"></div></div>
                                    <span className="text-xs uppercase tracking-widest font-medium opacity-70">Caricamento dati</span>
                                </div>
                            </td></tr>
                        ) : filteredRows.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                                        <Filter size={20} />
                                    </div>
                                    <p>Nessun appuntamento trovato.</p>
                                </div>
                            </td></tr>
                        ) : (
                            filteredRows.map((row, i) => {
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className="hover:bg-sky-50/50 cursor-pointer transition-colors group animate-in-up"
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        <td className="py-4 px-6 font-mono text-sm text-slate-600 group-hover:text-brand font-medium border-l-4 border-transparent group-hover:border-brand transition-all">
                                            {toHHMM(row.entry_time)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-brand transition-colors">{row.nome} {row.cognome}</div>
                                            {row.whatsapp_sent && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                                                    <MessageCircle size={10} className="fill-emerald-600" />
                                                    CONFERMA INVIATA
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Users size={12} /> {row.consulente?.name || "N/D"}</span>
                                                {row.tipo_abbonamento?.name && <span className="text-brand-ink font-medium">• {row.tipo_abbonamento.name}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 hidden md:table-cell">
                                            {row.consulente?.name ? (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                                                    {row.consulente.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        {!isTelefonici && (
                                            <td className="py-4 px-6 text-sm text-slate-600 hidden lg:table-cell">
                                                {row.tipo_abbonamento?.name ? (
                                                    <span className="text-slate-700 font-medium">{row.tipo_abbonamento.name}</span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center">
                                                {isTelefonici ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePhoneToggle(row); }}
                                                        className={cn(
                                                            "h-8 w-8 flex items-center justify-center rounded-lg transition-all border",
                                                            row.contattato
                                                                ? "bg-green-500 text-white border-green-600 shadow-md shadow-green-200"
                                                                : "bg-white text-slate-400 border-slate-200 hover:border-green-300 hover:text-green-500"
                                                        )}
                                                        title={row.contattato ? "Contattato" : "Da chiamare"}
                                                    >
                                                        <Phone size={14} />
                                                    </button>
                                                ) : (
                                                    <OutcomeButtons
                                                        entry={row}
                                                        onOutcomeClick={handleOutcomeClick}
                                                        size="sm"
                                                        showLabels={true}
                                                        section={section}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (row.telefono) handleWhatsAppClick(row); }}
                                                    disabled={!row.telefono}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors border",
                                                        !row.telefono ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" :
                                                            "bg-green-50 text-green-600 hover:bg-green-100 border-green-100"
                                                    )}
                                                    title={!row.telefono ? "Nessun telefono" : "Apri WhatsApp"}
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(row)}
                                                    className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
                                                    title="Duplica"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={selectedEntry}
                section={section}
                date={dateParam}
                onSave={fetchRows}
                onDelete={handleDelete}
                isDuplicate={isDuplicateMode}
            />

            {/* Reschedule Drawer */}
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
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import EntryDrawer from "./EntryDrawer";
import { Plus, Search, Filter, MessageCircle, Copy, Check, Euro, CalendarX, ThumbsDown, Phone, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

import { getWhatsAppLink, markWhatsAppSent, toHHMM } from "@/lib/whatsapp";
import { getLocalDateISO } from "@/lib/dateUtils";

// Helper
// const toHHMM = (t: string | null) => t?.slice(0, 5) || ""; // Imported
const cleanPhone = (num?: string) => num?.replace(/[^0-9]/g, "") || "";

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

    const handleStatusToggle = async (row: any, field: 'venduto' | 'miss' | 'presentato' | 'negativo') => {
        const newValue = !row[field];

        // Optimistic update
        const updatedRow = { ...row, [field]: newValue };
        if (newValue) {
            if (field === 'venduto') {
                updatedRow.negativo = false;
                updatedRow.miss = false;
            }
            if (field === 'negativo') {
                updatedRow.venduto = false;
            }
            if (field === 'miss') {
                updatedRow.venduto = false;
            }
        }

        setRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));

        // DB Update
        const updates: any = { [field]: newValue };
        if (newValue) {
            if (field === 'venduto') {
                updates.negativo = false;
                updates.miss = false;
            }
            if (field === 'negativo') {
                updates.venduto = false;
            }
            if (field === 'miss') {
                updates.venduto = false;
            }
        }

        await supabase.from("entries").update(updates).eq("id", row.id);
    };

    const handlePhoneToggle = async (row: any) => {
        const newValue = !row.contattato;
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, contattato: newValue } : r));
        await supabase.from("entries").update({ contattato: newValue }).eq("id", row.id);
    };

    const handleWhatsAppClick = async (row: any) => {
        const link = getWhatsAppLink(row);
        if (!link) return;

        window.open(link, "_blank");

        // Mark as sent if not already
        if (!row.whatsapp_sent) {
            const success = await markWhatsAppSent(row.id);
            if (success) {
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, whatsapp_sent: true } : r));
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
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
                    className="btn bg-brand text-white hover:bg-brand-ink shadow-lg shadow-brand/20 border-transparent transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} className="mr-2" />
                    Nuovo
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Ora</th>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Consulente</th>
                            {!isTelefonici && <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Abbonamento</th>}
                            <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Stato</th>
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
                                            <div className="text-xs text-slate-400 md:hidden mt-0.5">{row.consulente?.name}</div>
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
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
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
                                                    <>
                                                        {/* Presentato */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(row, 'presentato'); }}
                                                            className={cn(
                                                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all border",
                                                                row.presentato
                                                                    ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-200"
                                                                    : "bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500"
                                                            )}
                                                            title="Presentato"
                                                        >
                                                            <Check size={14} />
                                                        </button>

                                                        {/* Venduto */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(row, 'venduto'); }}
                                                            className={cn(
                                                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all border",
                                                                row.venduto
                                                                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-200"
                                                                    : "bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-500"
                                                            )}
                                                            title="Venduto"
                                                        >
                                                            <Euro size={14} />
                                                        </button>

                                                        {/* Miss */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(row, 'miss'); }}
                                                            className={cn(
                                                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all border",
                                                                row.miss
                                                                    ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200"
                                                                    : "bg-white text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-500"
                                                            )}
                                                            title="Miss"
                                                        >
                                                            <CalendarX size={14} />
                                                        </button>

                                                        {/* Negativo */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(row, 'negativo'); }}
                                                            className={cn(
                                                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all border",
                                                                row.negativo
                                                                    ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-200"
                                                                    : "bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500"
                                                            )}
                                                            title="Negativo"
                                                        >
                                                            <ThumbsDown size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {row.telefono && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleWhatsAppClick(row); }}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-colors border",
                                                            row.whatsapp_sent
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                                                : "bg-green-50 text-green-600 hover:bg-green-100 border-green-100"
                                                        )}
                                                        title={row.whatsapp_sent ? "WhatsApp Inviato" : "Invia WhatsApp"}
                                                    >
                                                        {row.whatsapp_sent ? <Check size={14} /> : <MessageCircle size={14} />}
                                                    </button>
                                                )}
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
        </div>
    );
}

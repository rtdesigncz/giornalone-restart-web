// src/app/consulenze/ConsulenzeClientV2.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    MessageCircle, Pencil, Check, X, Trash2, Upload,
    Search, Filter, Plus, ChevronDown,
    Users, CheckCircle2, AlertCircle,
    Clock, AlertTriangle, Phone, Calendar, FileText,
    MoreHorizontal, ArrowRight, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import ImportCsvModal from "./ImportCsvModal";
import CustomSelect from "@/components/ui/CustomSelect";

type Gestione = { id: string; nome: string; descrizione?: string | null; csv_mapping_default?: any };

type Item = {
    id: string;
    gestione_id: string;
    nome: string | null;
    cognome: string | null;
    telefono: string | null;
    scadenza: string | null; // YYYY-MM-DD
    tipo_abbonamento_corrente: string | null;

    contattato: boolean | null;
    preso_appuntamento: boolean | null;
    consulenza_fatta: boolean | null;

    data_consulenza: string | null; // YYYY-MM-DD
    esito: "ISCRIZIONE" | "RINNOVO" | "INTEGRAZIONE" | "IN ATTESA" | "NEGATIVO" | null;
    nuovo_abbonamento_name: string | null;
    data_risposta: string | null; // YYYY-MM-DD

    note: string | null;

    _isDraft?: boolean;
    _editing?: boolean;
    _backup?: Partial<Item>;
};

const ESITI = ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE", "IN ATTESA", "NEGATIVO"] as const;

const cleanSubscription = (s: string | null) => {
    if (!s) return null;
    const upper = s.toUpperCase();
    if (upper.includes("MENSILE")) return "MENSILE";
    if (upper.includes("QUADRIMESTRALE")) return "QUADRIMESTRALE";
    if (upper.includes("ANNUALE")) return "ANNUALE";
    return s; // Fallback to original if no match
};

const cleanName = (s: string | null) => {
    if (!s) return "";
    // Rimuove tutto ciò che non è lettera, spazio, apostrofo o trattino
    return s.replace(/[^a-zA-Z\u00C0-\u00FF\s'\-]/g, " ").replace(/\s+/g, " ").trim();
};

// --- UI COMPONENTS ---

const StatusBadge = ({ label, color, className }: { label: string, color: "emerald" | "amber" | "red" | "slate" | "blue", className?: string }) => {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        red: "bg-red-100 text-red-700 border-red-200",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
        <span className={cn(`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors[color]}`, className)}>
            {label}
        </span>
    );
};

const StepIcon = ({ active, completed, icon: Icon, onClick, colorClass, disabled }: any) => {
    const colorStyles: Record<string, { completed: string, active: string }> = {
        emerald: {
            completed: "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200",
            active: "border-emerald-500 text-emerald-500 bg-white shadow-sm"
        },
        amber: {
            completed: "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200",
            active: "border-amber-500 text-amber-500 bg-white shadow-sm"
        },
        teal: {
            completed: "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200",
            active: "border-teal-500 text-teal-500 bg-white shadow-sm"
        },
        // Fallback for any other colors if needed, though we primarily use the above
        cyan: {
            completed: "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200",
            active: "border-cyan-500 text-cyan-500 bg-white shadow-sm"
        },
        blue: {
            completed: "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200",
            active: "border-blue-500 text-blue-500 bg-white shadow-sm"
        }
    };

    const styles = colorStyles[colorClass] || colorStyles.emerald; // Default to emerald if not found

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 relative group focus:outline-none focus:ring-2 focus:ring-offset-1",
                completed ? styles.completed :
                    active ? styles.active :
                        "border-slate-200 text-slate-300 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <Icon className="w-4 h-4" />
            {!disabled && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {completed ? "Clicca per annullare" : "Clicca per completare"}
                </span>
            )}
        </button>
    );
};

// --- MODAL COMPONENT ---
const ActionModal = ({ isOpen, title, children, onClose, onConfirm, confirmLabel = "Conferma", confirmColor = "indigo" }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-lg overflow-hidden flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 font-sans">
                    {children}
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3 font-sans">
                    <button onClick={onClose} className="btn btn-outline text-xs">Annulla</button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "btn btn-sm text-xs text-white shadow-md transition-all flex items-center gap-2",
                            confirmColor === "red" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "btn-brand"
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ConsulenzeClientV2() {
    // --- STATE MANAGEMENT ---
    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [gestioneId, setGestioneId] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [abbOptions, setAbbOptions] = useState<string[]>([]);

    const [q, setQ] = useState("");
    

    const [fContattati, setFContattati] = useState(false);
    const [fDaContattare, setFDaContattare] = useState(false);
    const [fAppuntamenti, setFAppuntamenti] = useState(false);
    const [fConsFatte, setFConsFatte] = useState(false);
    const [fEsiti, setFEsiti] = useState<string[]>([]);
    const [fAbb, setFAbb] = useState<string[]>([]);
    const [showImport, setShowImport] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newRecord, setNewRecord] = useState({ nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "" });
    const [showFilters, setShowFilters] = useState(false);

    // ACTION MODAL STATES
    const [actionModal, setActionModal] = useState<{
        type: 'CONFIRM_RESET' | 'SET_APPUNTAMENTO' | 'SET_ESITO' | null,
        item: Item | null,
        step?: 'CONTATTATO' | 'APPUNTAMENTO' | 'FATTA'
    }>({ type: null, item: null });

    // Temp states for modals
    const [tempDate, setTempDate] = useState("");
    const [tempEsito, setTempEsito] = useState<Item["esito"]>(null);
    const [tempNuovoAbb, setTempNuovoAbb] = useState("");
    const [tempDataRisp, setTempDataRisp] = useState("");
    const [tempNote, setTempNote] = useState("");
    const [addToAgenda, setAddToAgenda] = useState(false);
    const [pendingAgendaUpdate, setPendingAgendaUpdate] = useState<{ item: Item, date: string } | null>(null);

    const resetFiltri = () => {
        setQ(""); setFContattati(false); setFDaContattare(false); setFAppuntamenti(false);
        setFConsFatte(false); setFEsiti([]); setFAbb([]);
    };

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/consulenze/gestioni");
            const j = await res.json();
            setGestioni(j.rows || []);
            if (!gestioneId && j.rows?.[0]?.id) setGestioneId(j.rows[0].id);
        })().catch(() => { });
    }, []);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/consulenze/options/abbonamenti");
            const j = await res.json();
            setAbbOptions(j.options || []);
        })().catch(() => { });
    }, []);

    const reloadItems = async (gid: string) => {
        setLoading(true);
        setErr("");
        try {
            const ri = await fetch(`/api/consulenze/items?gestione=${gid}`);
            if (!ri.ok) throw new Error("Errore caricamento righe");
            const ji = await ri.json();
            const loaded: Item[] = (ji.rows || []).map((r: Item) => ({ ...r, _editing: false }));
            setItems(loaded);
        } catch (e: any) {
            setErr(String(e?.message || e));
            setItems([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (gestioneId) reloadItems(gestioneId);
    }, [gestioneId]);

    const rows = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return items.filter((r) => {
            if (qq) {
                const s = `${r.nome || ""} ${r.cognome || ""} ${r.telefono || ""}`.toLowerCase();
                if (!s.includes(qq)) return false;
            }
            
            if (fContattati && !r.contattato) return false;
            if (fDaContattare && r.contattato) return false;

            if (fAppuntamenti && !r.preso_appuntamento) return false;
            if (fConsFatte && !r.consulenza_fatta) return false;
            if (fEsiti.length && (!r.esito || !fEsiti.includes(r.esito))) return false;
            if (fAbb.length && (!r.nuovo_abbonamento_name || !fAbb.includes(r.nuovo_abbonamento_name))) return false;
            return true;
        });
    }, [items, q, fContattati, fDaContattare, fAppuntamenti, fConsFatte, fEsiti, fAbb]);

// SORTING STATE
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRows = useMemo(() => {
        let sortableItems = [...rows];
        if (sortConfig !== null) {
            sortableItems.sort((a: any, b: any) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                if (sortConfig.key === "nome") {
                    aVal = `${a.cognome || ""} ${a.nome || ""}`.trim().toLowerCase();
                    bVal = `${b.cognome || ""} ${b.nome || ""}`.trim().toLowerCase();
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                }
                if (typeof bVal === 'string') {
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [rows, sortConfig]);

    const kpi = useMemo(() => {
        const totale = items.length;
        const contattati = items.filter(r => !!r.contattato).length;
        const preso = items.filter(r => !!r.contattato && !!r.preso_appuntamento).length;
        const fatte = items.filter(r => !!r.consulenza_fatta).length;
        const daFare = items.filter(r => !r.contattato).length;
        const esiti = ESITI.map(e => ({ esito: e, cnt: items.filter(r => r.esito === e).length }));
        const abbMap = new Map<string, number>();
        for (const r of items) {
            const n = r.nuovo_abbonamento_name?.trim();
            if (!n) continue;
            abbMap.set(n, (abbMap.get(n) || 0) + 1);
        }
        const nuoviAbb = Array.from(abbMap.entries()).map(([name, cnt]) => ({ name, cnt }));
        return { totale, contattati, preso, fatte, daFare, esiti, nuoviAbb };
    }, [items]);

    const toggleStrIn = (arr: string[], set: (v: string[]) => void, val: string) => {
        if (arr.includes(val)) set(arr.filter(x => x !== val)); else set([...arr, val]);
    };

    // --- CRUD OPERATIONS ---
    const persistFullRow = async (r: Item) => {
        const body = {
            nome: r.nome ?? null,
            cognome: r.cognome ?? null,
            telefono: r.telefono ?? null,
            scadenza: r.scadenza || null,
            tipo_abbonamento_corrente: r.tipo_abbonamento_corrente || null,
            contattato: !!r.contattato,
            preso_appuntamento: !!r.preso_appuntamento,
            consulenza_fatta: !!r.consulenza_fatta,
            data_consulenza: r.data_consulenza || null,
            esito: r.esito || null,
            nuovo_abbonamento_name: r.nuovo_abbonamento_name || null,
            data_risposta: r.data_risposta || null,
            note: r.note || null,
        };
        const res = await fetch(`/api/consulenze/items?id=${r.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("Errore salvataggio riga");
    };

    // --- INTERACTIVE STATUS LOGIC ---
    const handleStepClick = (r: Item, step: 'CONTATTATO' | 'APPUNTAMENTO' | 'FATTA') => {
        if (r._editing) return; // Disable direct click in edit mode to avoid conflicts

        if (step === 'CONTATTATO') {
            if (r.contattato) {
                // Turning OFF
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'CONTATTATO' });
            } else {
                // Turning ON (Immediate)
                const updated = { ...r, contattato: true };
                setItems(it => it.map(x => x.id === r.id ? updated : x));
                persistFullRow(updated).catch(() => reloadItems(gestioneId));
            }
        } else if (step === 'APPUNTAMENTO') {
            if (r.preso_appuntamento) {
                // Turning OFF
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'APPUNTAMENTO' });
            } else {
                // Turning ON (Open Modal)
                setTempDate(new Date().toISOString().slice(0, 10)); // Default today
                setAddToAgenda(false);
                setActionModal({ type: 'SET_APPUNTAMENTO', item: r });
            }
        } else if (step === 'FATTA') {
            if (r.consulenza_fatta) {
                // Turning OFF
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'FATTA' });
            } else {
                // Turning ON (Open Modal)
                setTempEsito(null);
                setTempNuovoAbb("");
                setTempDataRisp("");
                setTempNote(r.note || "");
                setActionModal({ type: 'SET_ESITO', item: r });
            }
        }
    };

    const confirmAction = async () => {
        const { type, item, step } = actionModal;
        if (!item) return;

        let updated = { ...item };

        if (type === 'CONFIRM_RESET') {
            if (step === 'CONTATTATO') {
                updated.contattato = false;
                // Cascade reset
                updated.preso_appuntamento = false;
                updated.consulenza_fatta = false;
                updated.data_consulenza = null;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
            } else if (step === 'APPUNTAMENTO') {
                updated.preso_appuntamento = false;
                // Cascade reset
                updated.consulenza_fatta = false;
                updated.data_consulenza = null;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
            } else if (step === 'FATTA') {
                updated.consulenza_fatta = false;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
            }
        } else if (type === 'SET_APPUNTAMENTO') {
            if (addToAgenda) {
                setPendingAgendaUpdate({ item, date: tempDate });
                setDrawerEntry({
                    nome: item.nome,
                    cognome: item.cognome,
                    telefono: item.telefono,
                    note: item.note,
                    entry_date: tempDate,
                    start_time: "09:00",
                    end_time: "10:00",
                    status: "pending"
                });
                setDrawerOpen(true);
                setActionModal({ type: null, item: null });
                return;
            }
            updated.contattato = true; // Ensure previous step
            updated.preso_appuntamento = true;
            updated.data_consulenza = tempDate || null;
        } else if (type === 'SET_ESITO') {
            updated.contattato = true;
            updated.preso_appuntamento = true;
            updated.consulenza_fatta = true;
            updated.esito = tempEsito;
            updated.nuovo_abbonamento_name = tempNuovoAbb || null;
            updated.data_risposta = tempDataRisp || null;
            updated.note = tempNote || null;
        }

        // Optimistic update
        setItems(it => it.map(x => x.id === item.id ? updated : x));
        setActionModal({ type: null, item: null });

        try {
            await persistFullRow(updated);
        } catch {
            alert("Errore salvataggio");
            reloadItems(gestioneId);
        }
    };

    // --- OTHER CRUD ---
    const creaGestione = async () => {
        const nome = window.prompt("Nome della gestione?");
        if (!nome) return;
        const res = await fetch("/api/consulenze/gestioni", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });
        if (res.ok) {
            const j = await res.json();
            setGestioni((g) => [...g, j.row]);
            setGestioneId(j.row.id);
        } else alert("Errore creazione gestione");
    };
    const rinominaGestione = async () => {
        if (!gestioneId) return;
        const nome = window.prompt("Nuovo nome gestione?");
        if (!nome) return;
        const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });
        if (res.ok) setGestioni((g) => g.map(x => x.id === gestioneId ? { ...x, nome } : x));
        else alert("Errore rinomina gestione");
    };
    const eliminaGestione = async () => {
        if (!gestioneId) return;
        if (!confirm("Eliminare questa gestione e tutte le righe?")) return;
        const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, { method: "DELETE" });
        if (res.ok) {
            const next = gestioni.filter(x => x.id !== gestioneId);
            setGestioni(next);
            setGestioneId(next[0]?.id || "");
            setItems([]);
        } else alert("Errore eliminazione gestione");
    };

    const eliminaRiga = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (r?._isDraft) { setItems(it => it.filter(x => x.id !== id)); return; }
        if (!confirm("Eliminare la riga?")) return;
        const res = await fetch(`/api/consulenze/items?id=${id}`, { method: "DELETE" });
        if (res.ok) setItems(it => it.filter(r => r.id !== id));
        else alert("Errore eliminazione riga");
    };

    const aggiungiRiga = () => {
        if (!gestioneId) { alert("Seleziona una gestione"); return; }
        setNewRecord({ nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "" });
        setShowNewModal(true);
    };

    const confermaNuovo = async () => {
        if (!newRecord.nome && !newRecord.cognome) {
            alert("Inserisci almeno il nome o il cognome");
            return;
        }
        const body = { gestione_id: gestioneId, ...newRecord };
        const res = await fetch(`/api/consulenze/items`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) { alert("Errore creazione riga"); return; }
        setShowNewModal(false);
        reloadItems(gestioneId);
    };

    const salvaBozza = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        const body = {
            gestione_id: r.gestione_id,
            nome: r.nome ?? null, cognome: r.cognome ?? null, telefono: r.telefono ?? null,
            scadenza: r.scadenza || null, tipo_abbonamento_corrente: r.tipo_abbonamento_corrente || null,
            contattato: !!r.contattato, preso_appuntamento: !!r.preso_appuntamento, consulenza_fatta: !!r.consulenza_fatta,
            data_consulenza: r.data_consulenza || null, esito: r.esito || null,
            nuovo_abbonamento_name: r.nuovo_abbonamento_name || null, data_risposta: r.data_risposta || null,
            note: r.note || null,
        };
        const res = await fetch(`/api/consulenze/items`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) { alert("Errore salvataggio riga"); return; }
        const j = await res.json();
        setItems(it => it.map(x => x.id === id ? { ...j.row, _editing: false } : x));
    };
    const annullaBozza = (id: string) => setItems(it => it.filter(x => x.id !== id));

    const entraInModifica = (id: string) => {
        setItems(it => it.map(x => {
            if (x.id !== id) return x;
            const backup: Partial<Item> = {
                nome: x.nome, cognome: x.cognome, telefono: x.telefono,
                scadenza: x.scadenza, tipo_abbonamento_corrente: x.tipo_abbonamento_corrente,
                contattato: x.contattato, preso_appuntamento: x.preso_appuntamento, consulenza_fatta: x.consulenza_fatta,
                data_consulenza: x.data_consulenza, esito: x.esito, nuovo_abbonamento_name: x.nuovo_abbonamento_name,
                data_risposta: x.data_risposta, note: x.note
            };
            return { ...x, _editing: true, _backup: backup };
        }));
    };
    const salvaModifica = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        try {
            await persistFullRow(r);
            setItems(it => it.map(x => x.id === id ? { ...x, _editing: false, _backup: undefined } : x));
        } catch {
            alert("Errore salvataggio riga");
        }
    };
    const annullaModifica = (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        const b = r._backup || {};
        setItems(it => it.map(x => x.id === id ? { ...x, ...b, _editing: false, _backup: undefined } : x));
    };

    const editable = (r: Item) => !!(r._isDraft || r._editing);

    // Agenda Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerEntry, setDrawerEntry] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const handleAgendaSave = async () => {
        setDrawerOpen(false);
        setSuccessMsg("Salvato in agenda con successo!");
        setTimeout(() => setSuccessMsg(""), 3000);

        if (pendingAgendaUpdate) {
            const { item, date } = pendingAgendaUpdate;
            const updated = { ...item, contattato: true, preso_appuntamento: true, data_consulenza: date };
            setItems(it => it.map(x => x.id === item.id ? updated : x));
            try { await persistFullRow(updated); } catch { reloadItems(gestioneId); }
            setPendingAgendaUpdate(null);
        }
    };

    // --- RENDER ---

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Import Modal */}
            {showImport && (
                <ImportCsvModal
                    gestioneId={gestioneId}
                    onClose={() => setShowImport(false)}
                    onImported={() => { reloadItems(gestioneId); }}
                />
            )}

            {/* New Record Modal */}
            <ActionModal
                isOpen={showNewModal}
                title="Nuovo Cliente"
                confirmLabel="Salva Cliente"
                onClose={() => setShowNewModal(false)}
                onConfirm={confermaNuovo}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Mario"
                                value={newRecord.nome}
                                onChange={e => setNewRecord({ ...newRecord, nome: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cognome</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Rossi"
                                value={newRecord.cognome}
                                onChange={e => setNewRecord({ ...newRecord, cognome: e.target.value })}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="333 1234567"
                            value={newRecord.telefono}
                            onChange={e => setNewRecord({ ...newRecord, telefono: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo Abbonamento</label>
                            <select
                                className="input w-full"
                                value={newRecord.tipo_abbonamento_corrente}
                                onChange={e => setNewRecord({ ...newRecord, tipo_abbonamento_corrente: e.target.value })}
                            >
                                <option value="">— Seleziona —</option>
                                {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Scadenza</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={newRecord.scadenza}
                                onChange={e => setNewRecord({ ...newRecord, scadenza: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </ActionModal>


            {/* Success Toast */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            {/* ACTION MODALS */}
            {actionModal.type === 'CONFIRM_RESET' && (
                <ActionModal
                    isOpen={true}
                    title="Attenzione"
                    confirmLabel="Conferma Reset"
                    confirmColor="red"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <p className="text-sm font-medium">Stai per annullare questo stato.</p>
                        </div>
                        <p className="text-slate-600 text-sm">
                            Questa azione cancellerà i dati associati a questo step (es. date, esiti) e riporterà indietro lo stato di avanzamento.
                            <br /><br />
                            Sei sicuro di voler procedere?
                        </p>
                    </div>
                </ActionModal>
            )}

            {actionModal.type === 'SET_APPUNTAMENTO' && (
                <ActionModal
                    isOpen={true}
                    title="Fissa Appuntamento"
                    confirmLabel="Salva Appuntamento"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Seleziona la data dell'appuntamento per <b>{actionModal.item?.nome} {actionModal.item?.cognome}</b>.</p>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Data Appuntamento</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={tempDate}
                                onChange={e => setTempDate(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500"
                                checked={addToAgenda}
                                onChange={e => setAddToAgenda(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-indigo-900">Aggiungi in Agenda</span>
                        </label>
                    </div>
                </ActionModal>
            )}

            {actionModal.type === 'SET_ESITO' && (
                <ActionModal
                    isOpen={true}
                    title="Esito Consulenza"
                    confirmLabel="Completa Consulenza"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Registra l'esito della consulenza per <b>{actionModal.item?.nome} {actionModal.item?.cognome}</b>.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase">Esito Consulenza</label>
                                <CustomSelect
                                    options={ESITI.map(e => ({ value: e, label: e }))}
                                    value={tempEsito || ""}
                                    onChange={v => setTempEsito(v as any)}
                                    placeholder="— Seleziona Esito —"
                                />
                            </div>

                            {tempEsito && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(tempEsito) && (
                                <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Nuovo Abbonamento</label>
                                    <CustomSelect
                                        options={abbOptions.map(o => ({ value: o, label: o }))}
                                        value={tempNuovoAbb}
                                        onChange={v => setTempNuovoAbb(v)}
                                        placeholder="— Seleziona Abbonamento —"
                                    />
                                </div>
                            )}

                            {tempEsito === "IN ATTESA" && (
                                <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Data Risposta</label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={tempDataRisp}
                                        onChange={e => setTempDataRisp(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Note Aggiuntive</label>
                                <textarea
                                    className="input w-full min-h-[80px] resize-none text-sm"
                                    placeholder="Scrivi qui eventuali note..."
                                    value={tempNote}
                                    onChange={e => setTempNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </ActionModal>
            )}

            {/* TOP HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 py-3">
                    <div className="flex flex-col gap-3">
                        {/* Top Bar: Title + Gestione + Search + Main Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-between sm:justify-start gap-4">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-slate-900 hidden sm:block">Consulenze</h1>
                                </div>

                                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                {/* Gestione Selector */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <CustomSelect
                                        options={gestioni.map(g => ({ value: g.id, label: g.nome }))}
                                        value={gestioneId}
                                        onChange={setGestioneId}
                                        placeholder="Seleziona gestione..."
                                        className="w-full sm:w-[220px]"
                                    />

                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm shrink-0">
                                        <button className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-cyan-600 transition-colors" title="Nuova Gestione" onClick={creaGestione}>
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                                        <button className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-cyan-600 transition-colors" title="Rinomina" onClick={rinominaGestione} disabled={!gestioneId}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-red-600 transition-colors" title="Elimina" onClick={eliminaGestione} disabled={!gestioneId}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 sm:justify-end">
                                <div className="flex-1 sm:max-w-md relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cerca cliente..."
                                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                        value={q}
                                        onChange={e => setQ(e.target.value)}
                                    />
                                    {q && (
                                        <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {(fDaContattare || fContattati || fAppuntamenti || fConsFatte || fEsiti.length > 0 || fAbb.length > 0) && (
                                        <button 
                                            onClick={resetFiltri}
                                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
                                        >
                                            <Filter className="w-4 h-4" /> Reset Filtri
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => setShowImport(true)}
                                        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" /> Importa
                                    </button>
                                    <button
                                        onClick={aggiungiRiga}
                                        className="btn btn-brand whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuovo</span><span className="sm:hidden">Nuovo</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>                
            {/* NEW KPI SAAS CARDS */}
            <div className="bg-slate-50 border-b border-slate-200 py-4 px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-[1600px] mx-auto">
                    {/* Totale */}
                    <div onClick={() => { resetFiltri(); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", (!fDaContattare && !fContattati && !fAppuntamenti && !fConsFatte && fEsiti.length === 0 && fAbb.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3>
                            <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.totale}</p>
                    </div>
                    {/* Da Contattare */}
                    <div onClick={() => { resetFiltri(); setFDaContattare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fDaContattare ? "ring-2 ring-amber-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Da Contattare</h3>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.daFare}</p>
                    </div>

                    {/* Contattati */}
                    <div onClick={() => { resetFiltri(); setFContattati(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fContattati && !fAppuntamenti && !fConsFatte ? "ring-2 ring-cyan-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Contattati</h3>
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.contattati}</p>
                    </div>

                    {/* Appuntamenti Fissati */}
                    <div onClick={() => { resetFiltri(); setFAppuntamenti(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppuntamenti && !fConsFatte ? "ring-2 ring-teal-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Appuntamenti</h3>
                            <Calendar className="w-4 h-4 text-teal-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.preso}</p>
                    </div>

                    {/* Consulenze Fatte */}
                    <div onClick={() => { resetFiltri(); setFConsFatte(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fConsFatte ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Consulenze Fatte</h3>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.fatte}</p>
                    </div>

                    {/* Venduti */}
                    <div onClick={() => { resetFiltri(); setFEsiti(["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"]); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fEsiti.includes("ISCRIZIONE") ? "ring-2 ring-indigo-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Venduti</h3>
                            <Check className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">{kpi.esiti.filter(e => ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(e.esito)).reduce((a,b) => a+b.cnt, 0)}</p>
                        </div>
                    </div>
                </div>
                
                {/* Esiti & Abbonamenti Break-down */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4 max-w-[1600px] mx-auto overflow-x-auto pb-1">
                    {/* Esiti Breakdown */}
                    <div className="flex gap-2 flex-wrap justify-center">
                        {kpi.esiti.map(e => {
                            let colorClass = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                            let badgeClass = "text-slate-900";
                            if (e.esito === "ISCRIZIONE") { colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"; badgeClass = "text-emerald-900"; }
                            if (e.esito === "RINNOVO") { colorClass = "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"; badgeClass = "text-teal-900"; }
                            if (e.esito === "INTEGRAZIONE") { colorClass = "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"; badgeClass = "text-cyan-900"; }
                            if (e.esito === "IN ATTESA") { colorClass = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"; badgeClass = "text-amber-900"; }
                            if (e.esito === "NEGATIVO") { colorClass = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"; badgeClass = "text-red-900"; }

                            return (
                                <div key={e.esito} onClick={() => { resetFiltri(); setFEsiti([e.esito]); }} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-colors", colorClass)}>
                                    <span>{e.esito}</span>
                                    <span className={cn("bg-white px-1.5 rounded-md shadow-sm", badgeClass)}>{e.cnt}</span>
                                </div>
                            );
                        })}
                    </div>
                    
                    {kpi.nuoviAbb && kpi.nuoviAbb.length > 0 && (
                        <>
                            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {kpi.nuoviAbb.map(abb => (
                                    <div key={abb.name} onClick={() => { resetFiltri(); setFAbb([abb.name]); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                        <span>{abb.name}</span>
                                        <span className="bg-white px-1.5 rounded-md shadow-sm text-indigo-900">{abb.cnt}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MAIN TABLE AREA */}
            <div className="flex-1 overflow-auto relative bg-slate-50 p-6" >

                {
                    err && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Si è verificato un errore</h3>
                            <p className="text-slate-500 max-w-md mb-6">{err}</p>
                            <button className="btn bg-cyan-600 text-white hover:bg-cyan-700 px-6 py-2 rounded-lg" onClick={() => reloadItems(gestioneId)}>Riprova</button>
                        </div>
                    )
                }

                {
                    !err && (
                        <div className="w-full max-w-[1600px] mx-auto">
                            {/* DESKTOP TABLE */}
                            <div className="hidden md:block">
                                <table className="w-full border-separate border-spacing-y-3">
                                    
                                    <thead>
                                        <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                            <th className="pb-3 pl-4 whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('nome')}>
                                                Cliente {sortConfig?.key === 'nome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('scadenza')}>
                                                Abbonamento / Scadenza {sortConfig?.key === 'scadenza' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('data_consulenza')}>
                                                Stato / Data App. {sortConfig?.key === 'data_consulenza' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('esito')}>
                                                Esito {sortConfig?.key === 'esito' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 whitespace-nowrap">Note</th>
                                            <th className="pb-3 pr-4 text-right whitespace-nowrap">Azioni</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            // Skeleton Rows
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="bg-white shadow-sm rounded-xl border border-transparent animate-pulse">
                                                    <td className="py-4 pl-4 rounded-l-xl">
                                                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-24"></div>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <div className="h-4 bg-slate-200 rounded w-24 mx-auto mb-1"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-16 mx-auto"></div>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center gap-2">
                                                            <div className="w-20 flex flex-col items-center gap-1">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                                                <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                                            </div>
                                                            <div className="w-20 flex flex-col items-center gap-1">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                                                <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                                            </div>
                                                            <div className="w-20 flex flex-col items-center gap-1">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                                                <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="h-4 bg-slate-100 rounded w-full max-w-[200px]"></div>
                                                    </td>
                                                    <td className="py-4 pr-4 rounded-r-xl text-right">
                                                        <div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            sortedRows.length > 0 ? sortedRows.map(r => {
                                                const isEditing = editable(r);

                                                // Date Logic
                                                let dateClass = "text-slate-500";
                                                if (r.preso_appuntamento && !r.consulenza_fatta && r.data_consulenza) {
                                                    const d = new Date(r.data_consulenza);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (d < today) {
                                                        dateClass = "text-slate-500"; // Past = Gray
                                                    } else {
                                                        dateClass = "text-teal-600 font-medium"; // Future = Teal
                                                    }
                                                }

                                                return (
                                                    <tr key={r.id} className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-transparent hover:border-cyan-100">

                                                        {/* CLIENTE */}
                                                        <td className="py-4 pl-4 rounded-l-xl align-top max-w-[250px]">
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <input className="input-sm w-full font-bold" placeholder="Nome" value={r.nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nome: e.target.value } : x))} />
                                                                    <input className="input-sm w-full" placeholder="Cognome" value={r.cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cognome: e.target.value } : x))} />
                                                                    <input className="input-sm w-full font-mono text-xs" placeholder="Telefono" value={r.telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, telefono: e.target.value } : x))} />
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <div className="font-bold text-slate-800 text-sm">{cleanName(r.cognome)} {cleanName(r.nome)}</div>
                                                                    {r.telefono ? (
                                                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded">
                                                                            <Phone className="w-3 h-3" />
                                                                            {r.telefono}
                                                                        </div>
                                                                    ) : <span className="text-slate-300 text-xs italic mt-1">Nessun telefono</span>}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* ABBONAMENTO */}
                                                        <td className="py-4 align-top max-w-[200px] text-center">
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <input className="input-sm w-full text-xs" placeholder="Tipo Abb." value={r.tipo_abbonamento_corrente || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento_corrente: e.target.value } : x))} />
                                                                    <input type="date" className="input-sm w-full text-xs" value={r.scadenza || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, scadenza: e.target.value } : x))} />
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1 items-center">
                                                                    <div className="font-medium text-slate-700 text-sm truncate" title={r.tipo_abbonamento_corrente || ""}>
                                                                        {cleanSubscription(r.tipo_abbonamento_corrente) || <span className="text-slate-300">—</span>}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        Scad: {formatDate(r.scadenza) || "—"}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* STATO (STEPPER) */}
                                                        <td className="py-4 align-top min-w-[300px]">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {/* Step 1: Contattato */}
                                                                <div className="flex flex-col items-center gap-1 w-20">
                                                                    <StepIcon
                                                                        active={!r.contattato}
                                                                        completed={r.contattato}
                                                                        icon={MessageCircle}
                                                                        colorClass="amber"
                                                                        disabled={isEditing}
                                                                        onClick={() => handleStepClick(r, 'CONTATTATO')}
                                                                    />
                                                                    <span className={cn("text-[10px] font-medium uppercase", r.contattato ? "text-amber-600" : "text-slate-300")}>Contattato</span>
                                                                </div>

                                                                <div className={cn("w-4 h-0.5 mb-4", (r.contattato && r.preso_appuntamento) ? "bg-amber-200" : "bg-slate-100")}></div>

                                                                {/* Step 2: Appuntamento */}
                                                                <div className="flex flex-col items-center gap-1 w-20">
                                                                    <StepIcon
                                                                        active={r.contattato && !r.preso_appuntamento}
                                                                        completed={r.preso_appuntamento}
                                                                        icon={Calendar}
                                                                        colorClass="teal"
                                                                        disabled={isEditing}
                                                                        onClick={() => handleStepClick(r, 'APPUNTAMENTO')}
                                                                    />
                                                                    <span className={cn("text-[10px] font-medium uppercase", r.preso_appuntamento ? "text-teal-600" : "text-slate-300")}>Appuntam.</span>
                                                                </div>

                                                                <div className={cn("w-4 h-0.5 mb-4", (r.preso_appuntamento && r.consulenza_fatta) ? "bg-teal-200" : "bg-slate-100")}></div>

                                                                {/* Step 3: Fatta */}
                                                                <div className="flex flex-col items-center gap-1 w-20">
                                                                    <StepIcon
                                                                        active={r.preso_appuntamento && !r.consulenza_fatta}
                                                                        completed={r.consulenza_fatta}
                                                                        icon={CheckCircle2}
                                                                        colorClass="emerald"
                                                                        disabled={isEditing}
                                                                        onClick={() => handleStepClick(r, 'FATTA')}
                                                                    />
                                                                    <span className={cn("text-[10px] font-medium uppercase", r.consulenza_fatta ? "text-emerald-600" : "text-slate-300")}>Fatta</span>
                                                                </div>
                                                            </div>

                                                            {/* Date Info below stepper */}
                                                            {r.preso_appuntamento && (
                                                                <div className="mt-3 flex justify-center">
                                                                    {isEditing ? (
                                                                        <input type="date" className="input-sm text-xs w-32 text-center" value={r.data_consulenza || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, data_consulenza: e.target.value } : x))} />
                                                                    ) : (
                                                                        <div className={cn("text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50", dateClass)}>
                                                                            <Calendar className="w-3 h-3" />
                                                                            {formatDate(r.data_consulenza) || "Data non fissata"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* ESITO */}
                                                        <td className="py-4 align-top min-w-[200px] text-center">
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <select className="input-sm w-full text-xs" disabled={!r.consulenza_fatta} value={r.esito || ""}
                                                                        onChange={e => {
                                                                            const v = (e.target.value || null) as Item["esito"];
                                                                            const patch: any = { esito: v };
                                                                            if (!v || !["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(v)) patch.nuovo_abbonamento_name = null;
                                                                            if (v !== "IN ATTESA") patch.data_risposta = "";
                                                                            setItems(it => it.map(x => x.id === r.id ? { ...x, ...patch } : x));
                                                                        }}
                                                                    >
                                                                        <option value="">— Esito —</option>
                                                                        {ESITI.map(e => <option key={e} value={e}>{e}</option>)}
                                                                    </select>

                                                                    {r.esito && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(r.esito) && (
                                                                        <select className="input-sm w-full text-xs" value={r.nuovo_abbonamento_name || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nuovo_abbonamento_name: e.target.value } : x))}>
                                                                            <option value="">— Nuovo Abb —</option>
                                                                            {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                                                                        </select>
                                                                    )}

                                                                    {r.esito === "IN ATTESA" && (
                                                                        <input type="date" className="input-sm w-full text-xs" value={r.data_risposta || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, data_risposta: e.target.value } : x))} />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-2 items-center">
                                                                    {r.esito ? (
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <StatusBadge
                                                                                label={r.esito}
                                                                                color={
                                                                                    r.esito === "NEGATIVO" ? "red" :
                                                                                        r.esito === "IN ATTESA" ? "amber" : "emerald"
                                                                                }
                                                                                className={
                                                                                    (r.esito === "IN ATTESA" && r.data_risposta && new Date(r.data_risposta) < new Date(new Date().setHours(0,0,0,0))) 
                                                                                        ? "animate-pulse ring-2 ring-orange-500 bg-orange-100 text-orange-900 border-orange-500" 
                                                                                        : ""
                                                                                }
                                                                            />

                                                                            {r.nuovo_abbonamento_name && (
                                                                                <div className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-1">
                                                                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                                                                    {r.nuovo_abbonamento_name}
                                                                                </div>
                                                                            )}

                                                                            {r.data_risposta && (
                                                                                <div className="text-xs text-amber-600 flex items-center gap-1 mt-1 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                                    <Clock className="w-3 h-3" />
                                                                                    Risp: {formatDate(r.data_risposta)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 text-xs">—</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* NOTE */}
                                                        <td className="py-4 align-top max-w-[200px]">
                                                            {isEditing ? (
                                                                <textarea
                                                                    className="input-sm w-full text-xs min-h-[80px] resize-none"
                                                                    placeholder="Note..."
                                                                    value={r.note || ""}
                                                                    onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))}
                                                                />
                                                            ) : (
                                                                <div className="relative group/note">
                                                                    <div className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                                                        {r.note || <span className="text-slate-300 italic">Nessuna nota</span>}
                                                                    </div>
                                                                    {r.note && r.note.length > 50 && (
                                                                        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                            {r.note}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* AZIONI */}
                                                        <td className="py-4 pr-4 rounded-r-xl align-top text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Salva" onClick={() => r._isDraft ? salvaBozza(r.id) : salvaModifica(r.id)}>
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Annulla" onClick={() => r._isDraft ? annullaBozza(r.id) : annullaModifica(r.id)}>
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {r.telefono && (
                                                                            <a className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" href={`https://wa.me/${encodeURIComponent(r.telefono)}`} target="_blank" rel="noreferrer" title="WhatsApp">
                                                                                <MessageCircle className="w-4 h-4" />
                                                                            </a>
                                                                        )}
                                                                        <button className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors" title="Modifica" onClick={() => entraInModifica(r.id)}>
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setDrawerEntry({
                                                                                    nome: r.nome,
                                                                                    cognome: r.cognome,
                                                                                    telefono: r.telefono,
                                                                                    note: r.note,
                                                                                    entry_date: r.data_consulenza
                                                                                });
                                                                                setDrawerOpen(true);
                                                                            }}
                                                                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                                            title="Aggiungi in Agenda"
                                                                        >
                                                                            <Calendar className="w-4 h-4" />
                                                                        </button>
                                                                        <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Elimina" onClick={() => eliminaRiga(r.id)}>
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                                <Search className="w-10 h-10" />
                                                            </div>
                                                            <div className="text-lg font-medium text-slate-500">Nessun risultato trovato</div>
                                                            <p className="text-sm">Prova a cambiare i filtri o aggiungi un nuovo cliente.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARDS */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {rows.map(r => {
                                    const isEditing = editable(r);
                                    return (
                                        <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
                                            {/* Header: Name & Actions */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    {isEditing ? (
                                                        <div className="space-y-2 mb-2">
                                                            <input className="input-sm w-full font-bold" placeholder="Nome" value={r.nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nome: e.target.value } : x))} />
                                                            <input className="input-sm w-full" placeholder="Cognome" value={r.cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cognome: e.target.value } : x))} />
                                                            <input className="input-sm w-full font-mono text-xs" placeholder="Telefono" value={r.telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, telefono: e.target.value } : x))} />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-lg">{cleanName(r.cognome)} {cleanName(r.nome)}</div>
                                                            {r.telefono && (
                                                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 font-mono">
                                                                    <Phone className="w-3 h-3" />
                                                                    {r.telefono}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => r._isDraft ? salvaBozza(r.id) : salvaModifica(r.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => r._isDraft ? annullaBozza(r.id) : annullaModifica(r.id)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                                        </>
                                                    ) : (
                                                        <div className="relative group">
                                                            <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-20">
                                                                <button onClick={() => entraInModifica(r.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Pencil className="w-3 h-3" /> Modifica
                                                                </button>
                                                                <button onClick={() => eliminaRiga(r.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                    <Trash2 className="w-3 h-3" /> Elimina
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subscription Info */}
                                            <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                                                {isEditing ? (
                                                    <div className="w-full space-y-2">
                                                        <input className="input-sm w-full text-xs" placeholder="Tipo Abb." value={r.tipo_abbonamento_corrente || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento_corrente: e.target.value } : x))} />
                                                        <input type="date" className="input-sm w-full text-xs" value={r.scadenza || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, scadenza: e.target.value } : x))} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm font-medium text-slate-700">{cleanSubscription(r.tipo_abbonamento_corrente) || "—"}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(r.scadenza) || "—"}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Stepper */}
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex flex-col items-center gap-1">
                                                    <StepIcon active={!r.contattato} completed={r.contattato} icon={MessageCircle} colorClass="amber" disabled={isEditing} onClick={() => handleStepClick(r, 'CONTATTATO')} />
                                                    <span className={cn("text-[10px] font-medium uppercase", r.contattato ? "text-amber-600" : "text-slate-300")}>Contattato</span>
                                                </div>
                                                <div className={cn("flex-1 h-0.5 mx-2 mb-4", (r.contattato && r.preso_appuntamento) ? "bg-amber-200" : "bg-slate-100")}></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <StepIcon active={r.contattato && !r.preso_appuntamento} completed={r.preso_appuntamento} icon={Calendar} colorClass="teal" disabled={isEditing} onClick={() => handleStepClick(r, 'APPUNTAMENTO')} />
                                                    <span className={cn("text-[10px] font-medium uppercase", r.preso_appuntamento ? "text-teal-600" : "text-slate-300")}>Appuntam.</span>
                                                </div>
                                                <div className={cn("flex-1 h-0.5 mx-2 mb-4", (r.preso_appuntamento && r.consulenza_fatta) ? "bg-teal-200" : "bg-slate-100")}></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <StepIcon active={r.preso_appuntamento && !r.consulenza_fatta} completed={r.consulenza_fatta} icon={CheckCircle2} colorClass="emerald" disabled={isEditing} onClick={() => handleStepClick(r, 'FATTA')} />
                                                    <span className={cn("text-[10px] font-medium uppercase", r.consulenza_fatta ? "text-emerald-600" : "text-slate-300")}>Fatta</span>
                                                </div>
                                            </div>

                                            {/* Appointment Date Display */}
                                            {r.preso_appuntamento && !isEditing && (
                                                <div className="flex justify-center w-full mt-2">
                                                    <div className={cn("text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium",
                                                        r.data_consulenza && new Date(r.data_consulenza) >= new Date(new Date().setHours(0, 0, 0, 0))
                                                            ? "bg-teal-50 text-teal-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(r.data_consulenza) || "Data non fissata"}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Outcome & Notes */}
                                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <select className="input-sm w-full text-xs" disabled={!r.consulenza_fatta} value={r.esito || ""} onChange={e => { const v = (e.target.value || null) as Item["esito"]; setItems(it => it.map(x => x.id === r.id ? { ...x, esito: v } : x)); }}>
                                                            <option value="">-- Esito --</option>
                                                            {ESITI.map(e => <option key={e} value={e}>{e}</option>)}
                                                        </select>
                                                        <textarea className="input-sm w-full text-xs min-h-[60px]" placeholder="Note..." value={r.note || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-400 uppercase">Esito</span>
                                                            {r.esito ? (
                                                                <StatusBadge label={r.esito} color={r.esito === "ISCRIZIONE" ? "emerald" : r.esito === "NEGATIVO" ? "red" : r.esito === "RINNOVO" ? "blue" : "amber"} />
                                                            ) : <span className="text-slate-300 text-xs italic">In attesa</span>}
                                                        </div>
                                                        {r.note && (
                                                            <div className="bg-amber-50/50 p-2 rounded text-xs text-slate-600 italic border border-amber-100">
                                                                {r.note}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
            </div>

            {/* FOOTER */}
            <div className="border-t bg-white px-4 py-2 text-xs text-slate-400 flex justify-between items-center shrink-0">
                <div>{rows.length} righe visualizzate</div>
            </div>

            {/* AGENDA DRAWER */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={null}
                section="TOUR SPONTANEI"
                date={new Date().toISOString().slice(0, 10)}
                onSave={handleAgendaSave}
                onDelete={() => { }}
                allowSectionChange={true}
                {...((drawerEntry && { entry: { ...drawerEntry, id: "new" } }) || {})}
            />
        </div>
    );
}

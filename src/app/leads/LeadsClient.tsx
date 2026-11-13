// src/app/leads/LeadsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    MessageCircle, Pencil, Check, X, Trash2, Upload,
    Search, Filter, Plus, ChevronDown,
    Users, CheckCircle2, AlertCircle,
    Clock, AlertTriangle, Phone, Calendar, FileText,
    MoreHorizontal, ArrowRight, XCircle, Headphones, Sparkles, UserPlus, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import ImportCsvModal from "@/app/consulenze/ImportCsvModal";
import LeadsReportModal from "./LeadsReportModal";
import ClientTimelineDrawer from "@/components/ui/ClientTimelineDrawer";
import { PieChart } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

type Gestione = { id: string; nome: string; descrizione?: string | null; csv_mapping_default?: any };

type Item = {
    id: string;
    gestione_id: string;
    nome: string | null;
    cognome: string | null;
    telefono: string | null;
    scadenza: string | null; // Data lead / Data riferimento
    tipo_abbonamento_corrente: string | null; // Canale / Interesse (es. Sala, Corsi, Pilates, Meta Ads)

    contattato: boolean | null;
    preso_appuntamento: boolean | null;
    consulenza_fatta: boolean | null;

    data_consulenza: string | null; // YYYY-MM-DD
    esito: "ISCRIZIONE" | "IN ATTESA" | "NEGATIVO" | null;
    nuovo_abbonamento_name: string | null;
    data_risposta: string | null; // YYYY-MM-DD
    motivo_negativo: string | null;

    note: string | null;
    entry_id?: string | null;

    _isDraft?: boolean;
    _editing?: boolean;
    _backup?: Partial<Item>;
};

const ESITI = ["ISCRIZIONE", "IN ATTESA", "NEGATIVO"] as const;

export const MOTIVI_NEGATIVO = [
    { value: "INSODDISFATTO", label: "Prezzo / Non convinto" },
    { value: "NON FREQUENTA", label: "Mancanza di tempo" },
    { value: "TRASFERIMENTO", label: "Distanza / Fuori sede" },
    { value: "INFORTUNIO", label: "Salute / Infortunio" },
    { value: "NON_RISPONDE", label: "Non risponde / Irreperibile" },
    { value: "ALTRA_PALESTRA", label: "Altra palestra" },
] as const;

const cleanName = (s: string | null) => {
    if (!s) return "";
    return s.replace(/[^a-zA-Z\u00C0-\u00FF\s'\-]/g, " ").replace(/\s+/g, " ").trim();
};

// --- UI COMPONENTS ---
const StatusBadge = ({ label, color, className }: { label: string, color: "emerald" | "amber" | "red" | "slate" | "blue" | "cyan", className?: string }) => {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        red: "bg-red-100 text-red-700 border-red-200",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
        cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
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
        blue: {
            completed: "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200",
            active: "border-blue-500 text-blue-500 bg-white shadow-sm"
        }
    };

    const styles = colorStyles[colorClass] || colorStyles.emerald;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 relative group focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer",
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
const ActionModal = ({ isOpen, title, children, onClose, onConfirm, confirmLabel = "Conferma" }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-lg overflow-hidden flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200 font-sans">
                <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 font-sans">
                    {children}
                </div>
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all">Annulla</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-xs font-bold text-white bg-brand rounded-xl hover:opacity-90 transition-all shadow-md">{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default function LeadsClient() {
    const searchParams = useSearchParams();
    const urlGestioneId = searchParams?.get("gestione");
    const highlightId = searchParams?.get("highlight");

    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [gestioneId, setGestioneId] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const [fContattati, setFContattati] = useState(false);
    const [fDaContattare, setFDaContattare] = useState(false);
    const [fAppDaFissare, setFAppDaFissare] = useState(false);
    const [fAppDaFare, setFAppDaFare] = useState(false);
    const [fConsFatte, setFConsFatte] = useState(false);
    const [fEsiti, setFEsiti] = useState<string[]>([]);
    const [fAbb, setFAbb] = useState<string[]>([]);
    const [fMotiviNegativo, setFMotiviNegativo] = useState<string[]>([]);

    const [abbOptions, setAbbOptions] = useState<string[]>([]);
    const [showImport, setShowImport] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Timeline Drawer State
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [timelinePhone, setTimelinePhone] = useState<string | null>(null);
    const [timelineName, setTimelineName] = useState<string>("");

    const [newRecord, setNewRecord] = useState({
        nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "", note: ""
    });

    const [sortConfig, setSortConfig] = useState<{ key: keyof Item; direction: 'asc' | 'desc' } | null>(null);

    // Interactive Action Modals
    const [actionModal, setActionModal] = useState<{
        type: 'SET_APPUNTAMENTO' | 'SET_ESITO' | 'CONFIRM_RESET' | null;
        item: Item | null;
        step?: 'CONTATTATO' | 'APPUNTAMENTO' | 'FATTA';
    }>({ type: null, item: null });

    // Temp states for modals
    const [tempDate, setTempDate] = useState("");
    const [addToAgenda, setAddToAgenda] = useState(true);
    const [pendingAgendaUpdate, setPendingAgendaUpdate] = useState<{ item: Item, date: string } | null>(null);
    const [tempEsito, setTempEsito] = useState<Item["esito"]>(null);
    const [tempNuovoAbb, setTempNuovoAbb] = useState("");
    const [tempDataRisp, setTempDataRisp] = useState("");
    const [tempMotivoNegativo, setTempMotivoNegativo] = useState("");
    const [tempNote, setTempNote] = useState("");
    const [showNegativiKpi, setShowNegativiKpi] = useState(false);

    const resetFiltri = () => {
        setQ(""); setFContattati(false); setFDaContattare(false); setFAppDaFissare(false); setFAppDaFare(false);
        setFConsFatte(false); setFEsiti([]); setFAbb([]); setFMotiviNegativo([]); setShowNegativiKpi(false);
    };

    // Load list of gestioni / lead lists
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/consulenze/gestioni");
            const j = await res.json();
            const allRows: Gestione[] = j.rows || [];
            
            // Prioritize LEAD lists in sorting
            const sorted = [...allRows].sort((a, b) => {
                const aIsLead = a.nome.toUpperCase().includes("LEAD");
                const bIsLead = b.nome.toUpperCase().includes("LEAD");
                if (aIsLead && !bIsLead) return -1;
                if (!aIsLead && bIsLead) return 1;
                return a.nome.localeCompare(b.nome);
            });

            setGestioni(sorted);
            if (!gestioneId && sorted.length > 0) {
                // Default to URL gestione or the first LEAD list, or first list
                const preferred = urlGestioneId 
                    ? sorted.find(g => g.id === urlGestioneId)
                    : sorted.find(g => g.nome.toUpperCase().includes("LEAD")) || sorted[0];
                if (preferred) setGestioneId(preferred.id);
            }
        })().catch(() => { });
    }, []);

    // Load available subscriptions for sale
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
            setItems(ji.rows || []);
        } catch (e: any) {
            setErr(e.message || "Errore di rete");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!gestioneId) return;
        reloadItems(gestioneId);
    }, [gestioneId]);

    // Handle Deep Linking / Highlight
    useEffect(() => {
        if (!highlightId || items.length === 0) return;
        const target = items.find(i => i.id === highlightId);
        if (target) {
            setTimeout(() => {
                const el = document.getElementById(`lead-row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-cyan-50/80', 'ring-2', 'ring-cyan-500');
                    setTimeout(() => el.classList.remove('bg-cyan-50/80', 'ring-2', 'ring-cyan-500'), 3500);
                }
            }, 300);
        }
    }, [highlightId, items]);

    // Filtering & Sorting
    const rows = useMemo(() => {
        const query = q.trim().toLowerCase();
        return items.filter((r) => {
            if (query) {
                const fullName = `${r.cognome ?? ""} ${r.nome ?? ""}`.toLowerCase();
                const invName = `${r.nome ?? ""} ${r.cognome ?? ""}`.toLowerCase();
                const tel = (r.telefono ?? "").toLowerCase();
                const matches = fullName.includes(query) || invName.includes(query) || tel.includes(query);
                if (!matches) return false;
            }
            if (fDaContattare && r.contattato) return false;
            if (fContattati && !r.contattato) return false;
            if (fAppDaFissare && (!r.contattato || r.preso_appuntamento)) return false;
            if (fAppDaFare && (!r.preso_appuntamento || r.consulenza_fatta)) return false;
            if (fConsFatte && !r.consulenza_fatta) return false;
            if (fEsiti.length > 0 && (!r.esito || !fEsiti.includes(r.esito))) return false;
            if (fAbb.length > 0 && (!r.nuovo_abbonamento_name || !fAbb.includes(r.nuovo_abbonamento_name))) return false;
            if (fMotiviNegativo.length > 0) {
                if (r.esito !== "NEGATIVO") return false;
                const m = (r.motivo_negativo || "").toUpperCase();
                if (!fMotiviNegativo.includes(m)) return false;
            }
            return true;
        });
    }, [items, q, fContattati, fDaContattare, fAppDaFissare, fAppDaFare, fConsFatte, fEsiti, fAbb, fMotiviNegativo]);

    const handleSort = (key: keyof Item) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRows = useMemo(() => {
        let sortableItems = [...rows];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [rows, sortConfig]);

    // KPI funnel calculation for Leads
    const kpi = useMemo(() => {
        const totale = items.length;
        const contattati = items.filter(r => !!r.contattato).length;
        const appuntamentiDaFissare = items.filter(r => !!r.contattato && !r.preso_appuntamento).length;
        const appuntamentiDaFare = items.filter(r => !!r.preso_appuntamento && !r.consulenza_fatta).length;
        const fatte = items.filter(r => !!r.consulenza_fatta).length;
        const daFare = items.filter(r => !r.contattato).length;
        
        const iscritti = items.filter(r => r.esito === "ISCRIZIONE").length;
        const inAttesa = items.filter(r => r.esito === "IN ATTESA").length;
        const negativiTotali = items.filter(r => r.esito === "NEGATIVO").length;

        const tassoChiusura = fatte > 0 ? Math.round((iscritti / fatte) * 100) : 0;

        const esiti = [
            { esito: "ISCRIZIONE", cnt: iscritti },
            { esito: "IN ATTESA", cnt: inAttesa },
            { esito: "NEGATIVO", cnt: negativiTotali }
        ];

        // Breakdown abbonamenti venduti
        const abbMap = new Map<string, number>();
        for (const r of items) {
            if (r.esito === "ISCRIZIONE") {
                const n = r.nuovo_abbonamento_name?.trim();
                if (n) abbMap.set(n, (abbMap.get(n) || 0) + 1);
            }
        }
        const nuoviAbb = Array.from(abbMap.entries()).map(([name, cnt]) => ({ name, cnt }));

        // Breakdown motivazioni negativi
        const motiviNegativo = MOTIVI_NEGATIVO.map(m => {
            const cnt = items.filter(r => r.esito === "NEGATIVO" && (r.motivo_negativo || "").toUpperCase() === m.value).length;
            const pct = negativiTotali > 0 ? Math.round((cnt / negativiTotali) * 100) : 0;
            return { value: m.value, label: m.label, cnt, pct };
        });
        const negativiSenzaMotivo = items.filter(r => r.esito === "NEGATIVO" && !r.motivo_negativo).length;
        const negativiSenzaMotivoPct = negativiTotali > 0 ? Math.round((negativiSenzaMotivo / negativiTotali) * 100) : 0;

        return {
            totale, contattati, appuntamentiDaFissare, appuntamentiDaFare, fatte, daFare,
            iscritti, inAttesa, tassoChiusura, esiti, nuoviAbb,
            negativiTotali, motiviNegativo, negativiSenzaMotivo, negativiSenzaMotivoPct
        };
    }, [items]);

    // CRUD Persistence
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
            motivo_negativo: r.motivo_negativo || null,
            note: r.note || null,
            entry_id: r.entry_id || null,
        };
        const res = await fetch(`/api/consulenze/items?id=${r.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("Errore salvataggio riga");
    };

    // Step Click Handling
    const handleStepClick = (r: Item, step: 'CONTATTATO' | 'APPUNTAMENTO' | 'FATTA') => {
        if (r._editing) return;

        if (step === 'CONTATTATO') {
            if (r.contattato) {
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'CONTATTATO' });
            } else {
                const updated = { ...r, contattato: true };
                setItems(it => it.map(x => x.id === r.id ? updated : x));
                persistFullRow(updated).catch(() => reloadItems(gestioneId));
            }
        } else if (step === 'APPUNTAMENTO') {
            if (r.preso_appuntamento) {
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'APPUNTAMENTO' });
            } else {
                setTempDate(new Date().toISOString().slice(0, 10));
                setAddToAgenda(true);
                setActionModal({ type: 'SET_APPUNTAMENTO', item: r });
            }
        } else if (step === 'FATTA') {
            if (r.consulenza_fatta) {
                setActionModal({ type: 'CONFIRM_RESET', item: r, step: 'FATTA' });
            } else {
                setTempEsito(r.esito || null);
                setTempNuovoAbb(r.nuovo_abbonamento_name || "");
                setTempDataRisp(r.data_risposta || "");
                setTempMotivoNegativo(r.motivo_negativo || "");
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
                updated.preso_appuntamento = false;
                updated.consulenza_fatta = false;
                updated.data_consulenza = null;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
                updated.motivo_negativo = null;
            } else if (step === 'APPUNTAMENTO') {
                updated.preso_appuntamento = false;
                updated.consulenza_fatta = false;
                updated.data_consulenza = null;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
                updated.motivo_negativo = null;
            } else if (step === 'FATTA') {
                updated.consulenza_fatta = false;
                updated.esito = null;
                updated.nuovo_abbonamento_name = null;
                updated.data_risposta = null;
                updated.motivo_negativo = null;
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
                    section: "APPUNTAMENTI (Pianificazione)",
                    start_time: "09:00",
                    end_time: "10:00",
                    status: "pending"
                });
                setDrawerOpen(true);
                setActionModal({ type: null, item: null });
                return;
            }
            updated.contattato = true;
            updated.preso_appuntamento = true;
            updated.data_consulenza = tempDate || null;
        } else if (type === 'SET_ESITO') {
            if (tempEsito === "ISCRIZIONE" && !tempNuovoAbb) {
                alert("ATTENZIONE: Devi obbligatoriamente selezionare l'abbonamento sottoscritto per salvare l'iscrizione.");
                return;
            }
            updated.contattato = true;
            updated.preso_appuntamento = true;
            updated.consulenza_fatta = true;
            updated.esito = tempEsito;
            updated.nuovo_abbonamento_name = tempEsito === "ISCRIZIONE" ? (tempNuovoAbb || null) : null;
            updated.data_risposta = (tempEsito === "IN ATTESA") ? (tempDataRisp || null) : null;
            updated.motivo_negativo = (tempEsito === "NEGATIVO") ? (tempMotivoNegativo || null) : null;
            updated.note = tempNote || null;
        }

        setItems(it => it.map(x => x.id === item.id ? updated : x));
        setActionModal({ type: null, item: null });

        try {
            await persistFullRow(updated);
        } catch {
            alert("Errore salvataggio");
            reloadItems(gestioneId);
        }
    };

    // Campaign CRUD
    const creaGestione = async () => {
        const nome = window.prompt("Nome della nuova lista lead (es. LEAD NOVEMBRE, META ADS, OPEN DAY)?");
        if (!nome) return;
        const res = await fetch("/api/consulenze/gestioni", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });
        if (res.ok) {
            const j = await res.json();
            setGestioni((g) => [j.row, ...g]);
            setGestioneId(j.row.id);
        } else alert("Errore creazione lista");
    };

    const rinominaGestione = async () => {
        if (!gestioneId) return;
        const curr = gestioni.find(x => x.id === gestioneId);
        const nome = window.prompt("Nuovo nome lista?", curr?.nome || "");
        if (!nome) return;
        const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });
        if (res.ok) setGestioni((g) => g.map(x => x.id === gestioneId ? { ...x, nome } : x));
        else alert("Errore rinomina lista");
    };

    const eliminaGestione = async () => {
        if (!gestioneId) return;
        if (!confirm("Eliminare questa lista lead e tutti i relativi contatti?")) return;
        const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, { method: "DELETE" });
        if (res.ok) {
            const next = gestioni.filter(x => x.id !== gestioneId);
            setGestioni(next);
            setGestioneId(next[0]?.id || "");
            setItems([]);
        } else alert("Errore eliminazione lista");
    };

    const eliminaRiga = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (r?._isDraft) { setItems(it => it.filter(x => x.id !== id)); return; }
        if (!confirm("Eliminare questo lead?")) return;
        const res = await fetch(`/api/consulenze/items?id=${id}`, { method: "DELETE" });
        if (res.ok) setItems(it => it.filter(r => r.id !== id));
        else alert("Errore eliminazione lead");
    };

    const aggiungiRiga = () => {
        if (!gestioneId) { alert("Seleziona una lista lead"); return; }
        setNewRecord({ nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "", note: "" });
        setShowNewModal(true);
    };

    const salvaNuovoRecord = async () => {
        if (!gestioneId) return;
        if (!newRecord.nome.trim() || !newRecord.cognome.trim()) {
            alert("Nome e Cognome sono obbligatori");
            return;
        }

        const body = {
            gestione_id: gestioneId,
            nome: newRecord.nome.trim().toUpperCase(),
            cognome: newRecord.cognome.trim().toUpperCase(),
            telefono: newRecord.telefono.trim() || null,
            tipo_abbonamento_corrente: newRecord.tipo_abbonamento_corrente.trim() || null,
            scadenza: newRecord.scadenza || null,
            note: newRecord.note.trim() || null,
            contattato: false,
            preso_appuntamento: false,
            consulenza_fatta: false,
        };

        const res = await fetch("/api/consulenze/items", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            const j = await res.json();
            setItems(it => [j.row, ...it]);
            setShowNewModal(false);
        } else {
            alert("Errore inserimento lead");
        }
    };

    const avviaModifica = (r: Item) => {
        setItems(it => it.map(x => x.id === r.id ? { ...x, _editing: true, _backup: { ...x } } : x));
    };

    const salvaModifica = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        try {
            await persistFullRow(r);
            setItems(it => it.map(x => x.id === id ? { ...x, _editing: false, _backup: undefined } : x));
        } catch {
            alert("Errore salvataggio modifiche");
        }
    };

    const annullaModifica = (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        const b = r._backup || {};
        setItems(it => it.map(x => x.id === id ? { ...x, ...b, _editing: false, _backup: undefined } : x));
    };

    // Agenda Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerEntry, setDrawerEntry] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const handleAgendaSave = async (savedEntry?: any) => {
        setDrawerOpen(false);
        setSuccessMsg("Appuntamento salvato in Agenda!");
        setTimeout(() => setSuccessMsg(""), 3000);

        if (pendingAgendaUpdate) {
            const { item, date } = pendingAgendaUpdate;
            const entryId = savedEntry?.id || null;
            const entryDate = savedEntry?.entry_date || date;
            const updated = {
                ...item,
                contattato: true,
                preso_appuntamento: true,
                data_consulenza: entryDate,
                entry_id: entryId
            };
            setItems(it => it.map(x => x.id === item.id ? updated : x));
            try { await persistFullRow(updated); } catch { reloadItems(gestioneId); }
            setPendingAgendaUpdate(null);
        }
    };

    const currGestioneNome = gestioni.find(g => g.id === gestioneId)?.nome || "Lista";

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">

            {/* MODALS */}
            {actionModal.type === 'CONFIRM_RESET' && (
                <ActionModal
                    isOpen={true}
                    title="Conferma Ripristino"
                    confirmLabel="Sì, Ripristina"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-xs font-semibold">
                                Annullando questo stato, verranno azzerati anche tutti i passaggi ed esiti successivi.
                            </p>
                        </div>
                        <p className="text-sm text-slate-600">
                            Sei sicuro di voler resettare lo stato di <b>{actionModal.item?.nome} {actionModal.item?.cognome}</b>?
                        </p>
                    </div>
                </ActionModal>
            )}

            {actionModal.type === 'SET_APPUNTAMENTO' && (
                <ActionModal
                    isOpen={true}
                    title="Fissa Appuntamento"
                    confirmLabel="Procedi"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Seleziona la data dell'appuntamento per il prospect <b>{actionModal.item?.nome} {actionModal.item?.cognome}</b>.</p>
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
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-cyan-100 bg-cyan-50/50 cursor-pointer hover:bg-cyan-50 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-cyan-600 rounded border-cyan-300 focus:ring-cyan-500"
                                checked={addToAgenda}
                                onChange={e => setAddToAgenda(e.target.checked)}
                            />
                            <div>
                                <span className="text-sm font-bold text-cyan-950 block">Inserisci in Agenda (APPUNTAMENTI)</span>
                                <span className="text-xs text-cyan-700">Apre l'agenda per fissare orario e consulente nella sezione Appuntamenti</span>
                            </div>
                        </label>
                    </div>
                </ActionModal>
            )}

            {actionModal.type === 'SET_ESITO' && (
                <ActionModal
                    isOpen={true}
                    title="Esito Consulenza Prospect"
                    confirmLabel="Salva Esito"
                    onClose={() => setActionModal({ type: null, item: null })}
                    onConfirm={confirmAction}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Registra l'esito per <b>{actionModal.item?.nome} {actionModal.item?.cognome}</b>.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase">Esito Lead</label>
                                <CustomSelect
                                    options={ESITI.map(e => ({ value: e, label: e }))}
                                    value={tempEsito || ""}
                                    onChange={v => {
                                        const next = (v || null) as Item["esito"];
                                        setTempEsito(next);
                                        if (next !== "NEGATIVO") setTempMotivoNegativo("");
                                        if (next !== "ISCRIZIONE") setTempNuovoAbb("");
                                        if (next !== "IN ATTESA") setTempDataRisp("");
                                    }}
                                    placeholder="— Seleziona Esito —"
                                />
                            </div>

                            {tempEsito === "ISCRIZIONE" && (
                                <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
                                        <span>Abbonamento Sottoscritto</span>
                                        <span className="text-red-500 font-bold">* Obbligatorio</span>
                                    </label>
                                    <CustomSelect
                                        options={abbOptions.map(o => ({ value: o, label: o }))}
                                        value={tempNuovoAbb}
                                        onChange={v => setTempNuovoAbb(v)}
                                        placeholder="— Seleziona Abbonamento Acquistato —"
                                    />
                                </div>
                            )}

                            {tempEsito === "NEGATIVO" && (
                                <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-rose-700 uppercase flex items-center justify-between">
                                        <span>Motivazione Negativo</span>
                                        <span className="text-[10px] font-normal text-rose-500 lowercase">(opzionale)</span>
                                    </label>
                                    <CustomSelect
                                        options={MOTIVI_NEGATIVO.map(m => ({ value: m.value, label: m.label }))}
                                        value={tempMotivoNegativo}
                                        onChange={v => setTempMotivoNegativo(v)}
                                        placeholder="— Seleziona Motivazione —"
                                    />
                                </div>
                            )}

                            {tempEsito === "IN ATTESA" && (
                                <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-amber-800 uppercase">Data Ricontatto / Risposta</label>
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
                                    placeholder="Scrivi qui eventuali note o feedback..."
                                    value={tempNote}
                                    onChange={e => setTempNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </ActionModal>
            )}

            {/* TOP HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 shadow-xs">
                            <Target size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-display">
                                    Leads
                                </h1>
                                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={11} /> Pipeline Prospect
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Gestione lead, primo contatto, appuntamenti e conversioni
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Gestione Selector */}
                        <div className="flex items-center gap-2">
                            <CustomSelect
                                options={gestioni.map(g => ({ value: g.id, label: g.nome }))}
                                value={gestioneId}
                                onChange={setGestioneId}
                                placeholder="Seleziona lista lead..."
                                className="w-[180px] sm:w-[220px]"
                            />

                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs shrink-0">
                                <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer" title="Nuova Lista Lead" onClick={creaGestione}>
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                                <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer" title="Rinomina Lista" onClick={rinominaGestione} disabled={!gestioneId}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer" title="Elimina Lista" onClick={eliminaGestione} disabled={!gestioneId}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative group min-w-[160px] sm:min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cerca lead..."
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />
                            {q && (
                                <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Reset Filter Button */}
                        {(fDaContattare || fContattati || fAppDaFissare || fAppDaFare || fConsFatte || fEsiti.length > 0 || fAbb.length > 0 || fMotiviNegativo.length > 0) && (
                            <button 
                                onClick={resetFiltri}
                                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                                <Filter className="w-3.5 h-3.5" /> Reset
                            </button>
                        )}
                        
                        <button
                            onClick={() => setShowImport(true)}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                            <Upload className="w-3.5 h-3.5" /> Importa CSV
                        </button>
                        <button 
                            className="btn btn-outline gap-1.5 bg-white text-[#21b5ba] border-[#21b5ba] hover:bg-[#21b5ba] hover:text-white transition-all disabled:opacity-50 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center"
                            onClick={() => setReportOpen(true)}
                            disabled={!gestioneId || items.length === 0}
                            title="Vedi Report Lista Leads"
                        >
                            <PieChart className="w-3.5 h-3.5" />
                            <span>Report</span>
                        </button>
                        <button
                            onClick={aggiungiRiga}
                            className="btn btn-brand whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> <span>Nuovo Lead</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI FUNNEL CARDS */}
            <div className="bg-slate-50 border-b border-slate-200 py-5 sm:py-6 px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4 max-w-[1700px] mx-auto">
                    {/* Totale */}
                    <div onClick={() => { resetFiltri(); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", (!fDaContattare && !fContattati && !fAppDaFissare && !fAppDaFare && !fConsFatte && fEsiti.length === 0 && fAbb.length === 0 && fMotiviNegativo.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale Leads</h3>
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
                    <div onClick={() => { resetFiltri(); setFContattati(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fContattati && !fAppDaFissare && !fAppDaFare && !fConsFatte ? "ring-2 ring-cyan-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Contattati</h3>
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.contattati}</p>
                    </div>

                    {/* Da Fissare */}
                    <div onClick={() => { resetFiltri(); setFAppDaFissare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFissare ? "ring-2 ring-orange-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Da Fissare</h3>
                            <Phone className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.appuntamentiDaFissare}</p>
                    </div>

                    {/* Fissati (Da Svolgere) */}
                    <div onClick={() => { resetFiltri(); setFAppDaFare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFare ? "ring-2 ring-teal-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Fissati</h3>
                            <Calendar className="w-4 h-4 text-teal-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.appuntamentiDaFare}</p>
                    </div>

                    {/* Consulenze Svolte */}
                    <div onClick={() => { resetFiltri(); setFConsFatte(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fConsFatte ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Consulenze Svolte</h3>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.fatte}</p>
                    </div>

                    {/* Iscrizioni (Venduti) */}
                    <div onClick={() => { resetFiltri(); setFEsiti(["ISCRIZIONE"]); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fEsiti.includes("ISCRIZIONE") ? "ring-2 ring-emerald-600 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-900">Iscrizioni Chiuse</h3>
                            <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="text-2xl font-extrabold text-emerald-700">{kpi.iscritti}</p>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {kpi.tassoChiusura}% chiusura
                            </span>
                        </div>
                    </div>
                </div>

                {/* Esiti & Abbonamenti Break-down */}
                <div className="mt-5 max-w-[1700px] mx-auto">
                    <div className="bg-white/90 border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-center">
                        {/* Esiti Breakdown */}
                        <div className="flex gap-2.5 flex-wrap justify-center items-center py-0.5">
                            {kpi.esiti.map(e => {
                                let colorClass = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                                let badgeClass = "text-slate-900";
                                if (e.esito === "ISCRIZIONE") { colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"; badgeClass = "text-emerald-900"; }
                                if (e.esito === "IN ATTESA") { colorClass = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"; badgeClass = "text-amber-900"; }
                                if (e.esito === "NEGATIVO") { 
                                    const isSelected = fEsiti.includes("NEGATIVO") || showNegativiKpi || fMotiviNegativo.length > 0;
                                    colorClass = isSelected
                                        ? "bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400 shadow-xs"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"; 
                                    badgeClass = "text-red-900"; 
                                }

                                return (
                                    <div
                                        key={e.esito}
                                        onClick={() => {
                                            if (e.esito === "NEGATIVO") {
                                                const wasSelected = fEsiti.includes("NEGATIVO") && showNegativiKpi && !fMotiviNegativo.length;
                                                resetFiltri();
                                                if (!wasSelected) {
                                                    setFEsiti(["NEGATIVO"]);
                                                    setShowNegativiKpi(true);
                                                }
                                            } else {
                                                resetFiltri();
                                                setFEsiti([e.esito]);
                                            }
                                        }}
                                        className={cn("flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]", colorClass)}
                                    >
                                        <span>{e.esito}</span>
                                        <span className={cn("bg-white px-2 py-0.5 rounded-md shadow-xs text-xs font-black", badgeClass)}>{e.cnt}</span>
                                        {e.esito === "NEGATIVO" && kpi.negativiTotali > 0 && (
                                            <ChevronDown className={cn("w-3.5 h-3.5 text-red-500 transition-transform ml-0.5", (showNegativiKpi || fEsiti.includes("NEGATIVO") || fMotiviNegativo.length > 0) && "rotate-180")} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {kpi.nuoviAbb && kpi.nuoviAbb.length > 0 && (
                            <>
                                <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                                <div className="flex gap-2.5 flex-wrap justify-center items-center py-0.5">
                                    {kpi.nuoviAbb.map(abb => (
                                        <div key={abb.name} onClick={() => { resetFiltri(); setFAbb([abb.name]); }} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-all shadow-xs hover:scale-[1.02]">
                                            <span>{abb.name}</span>
                                            <span className="bg-white px-2 py-0.5 rounded-md shadow-xs text-emerald-900 text-xs font-black">{abb.cnt}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Breakdown Motivazioni Negativo */}
                    {(showNegativiKpi || fEsiti.includes("NEGATIVO") || fMotiviNegativo.length > 0) && kpi.negativiTotali > 0 && (
                        <div className="mt-3 bg-red-50/70 border border-red-200/90 rounded-2xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-200/50">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                                        Motivazioni Negativi ({kpi.negativiTotali})
                                    </h4>
                                </div>
                                <button 
                                    onClick={() => setShowNegativiKpi(false)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                >
                                    Chiudi
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                {kpi.motiviNegativo.map(m => {
                                    const isSelected = fMotiviNegativo.includes(m.value);
                                    return (
                                        <div 
                                            key={m.value}
                                            onClick={() => {
                                                const next = isSelected ? fMotiviNegativo.filter(x => x !== m.value) : [...fMotiviNegativo, m.value];
                                                setFMotiviNegativo(next);
                                                if (next.length > 0 && !fEsiti.includes("NEGATIVO")) setFEsiti(["NEGATIVO"]);
                                            }}
                                            className={cn(
                                                "p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex flex-col justify-between gap-1 shadow-2xs hover:scale-[1.02]",
                                                isSelected 
                                                    ? "bg-red-200/80 border-red-400 text-red-950 ring-2 ring-red-400" 
                                                    : m.cnt > 0 
                                                        ? "bg-white border-red-200 text-slate-800 hover:border-red-300 hover:bg-red-50/50" 
                                                        : "bg-white/50 border-slate-200 text-slate-400 opacity-60"
                                            )}
                                        >
                                            <span className="font-bold text-[11px] truncate" title={m.label}>{m.label}</span>
                                            <div className="flex items-baseline justify-between mt-1">
                                                <span className="text-base font-extrabold text-red-900">{m.cnt}</span>
                                                <span className="text-[10px] font-semibold text-red-600/80">{m.pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT / TABLE */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1700px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {successMsg && (
                        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            {successMsg}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('cognome')}>
                                        Prospect {sortConfig?.key === 'cognome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3.5 px-4 text-center">Interesse / Canale</th>
                                    <th className="py-3.5 px-4 text-center min-w-[280px]">Fase Contatto</th>
                                    <th className="py-3.5 px-4 text-center">Esito / Dettagli</th>
                                    <th className="py-3.5 px-4">Note</th>
                                    <th className="py-3.5 px-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {sortedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            {loading ? "Caricamento leads..." : "Nessun lead trovato con i filtri attuali."}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRows.map(r => {
                                        const isEditing = !!r._editing;
                                        return (
                                            <tr key={r.id} id={`lead-row-${r.id}`} className="hover:bg-slate-50/80 transition-colors group">
                                                
                                                {/* PROSPECT NAME & PHONE */}
                                                <td className="py-3.5 px-4 align-top">
                                                    {isEditing ? (
                                                        <div className="space-y-1.5">
                                                            <input className="input-sm w-full font-bold uppercase" placeholder="Nome" value={r.nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nome: e.target.value.toUpperCase() } : x))} />
                                                            <input className="input-sm w-full font-bold uppercase" placeholder="Cognome" value={r.cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cognome: e.target.value.toUpperCase() } : x))} />
                                                            <input className="input-sm w-full font-mono text-xs" placeholder="Telefono" value={r.telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, telefono: e.target.value } : x))} />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex items-center gap-2 group/timeline">
                                                                <div 
                                                                    className="font-bold text-slate-900 text-sm group-hover/timeline:text-brand transition-colors cursor-pointer"
                                                                    onClick={() => { setTimelinePhone(r.telefono); setTimelineName(`${cleanName(r.cognome)} ${cleanName(r.nome)}`); setTimelineOpen(true); }}
                                                                >
                                                                    {cleanName(r.cognome)} {cleanName(r.nome)}
                                                                </div>
                                                                <button 
                                                                    onClick={() => { setTimelinePhone(r.telefono); setTimelineName(`${cleanName(r.cognome)} ${cleanName(r.nome)}`); setTimelineOpen(true); }}
                                                                    className="opacity-0 group-hover/timeline:opacity-100 transition-opacity p-1 bg-brand/10 text-brand rounded-full hover:bg-brand hover:text-white cursor-pointer"
                                                                    title="Vedi Cronologia"
                                                                >
                                                                    <Clock className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            {r.telefono ? (
                                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-200">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    {r.telefono}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs italic mt-1 block">Nessun telefono</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* CANALE / INTERESSE */}
                                                <td className="py-3.5 px-4 align-top text-center max-w-[180px]">
                                                    {isEditing ? (
                                                        <div className="space-y-1.5">
                                                            <input className="input-sm w-full text-xs" placeholder="Interesse / Canale" value={r.tipo_abbonamento_corrente || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento_corrente: e.target.value } : x))} />
                                                            <input type="date" className="input-sm w-full text-xs" value={r.scadenza || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, scadenza: e.target.value } : x))} />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            {r.tipo_abbonamento_corrente ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 truncate max-w-full">
                                                                    {r.tipo_abbonamento_corrente}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                                                    Prospect
                                                                </span>
                                                            )}
                                                            {r.scadenza && (
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                    <Calendar size={11} /> {formatDate(r.scadenza)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* STEPPER CONTATTO */}
                                                <td className="py-3.5 px-4 align-top">
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
                                                            <span className={cn("text-[10px] font-bold uppercase", r.contattato ? "text-amber-600" : "text-slate-300")}>Contattato</span>
                                                        </div>

                                                        <div className={cn("w-4 h-0.5 mb-4", (r.contattato && r.preso_appuntamento) ? "bg-amber-300" : "bg-slate-200")}></div>

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
                                                            <span className={cn("text-[10px] font-bold uppercase", r.preso_appuntamento ? "text-teal-600" : "text-slate-300")}>Appuntam.</span>
                                                        </div>

                                                        <div className={cn("w-4 h-0.5 mb-4", (r.preso_appuntamento && r.consulenza_fatta) ? "bg-teal-300" : "bg-slate-200")}></div>

                                                        {/* Step 3: Consulenza Fatta */}
                                                        <div className="flex flex-col items-center gap-1 w-20">
                                                            <StepIcon
                                                                active={r.preso_appuntamento && !r.consulenza_fatta}
                                                                completed={r.consulenza_fatta}
                                                                icon={CheckCircle2}
                                                                colorClass="emerald"
                                                                disabled={isEditing}
                                                                onClick={() => handleStepClick(r, 'FATTA')}
                                                            />
                                                            <span className={cn("text-[10px] font-bold uppercase", r.consulenza_fatta ? "text-emerald-600" : "text-slate-300")}>Fatta</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ESITO / DETTAGLI */}
                                                <td className="py-3.5 px-4 align-top text-center min-w-[160px]">
                                                    {r.esito === "ISCRIZIONE" && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <StatusBadge label="ISCRIZIONE" color="emerald" />
                                                            {r.nuovo_abbonamento_name && (
                                                                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                    {r.nuovo_abbonamento_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {r.esito === "IN ATTESA" && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <StatusBadge label="IN ATTESA" color="amber" />
                                                            {r.data_risposta && (
                                                                <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                                                    <Clock size={11} /> Risposta: {formatDate(r.data_risposta)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {r.esito === "NEGATIVO" && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <StatusBadge label="NEGATIVO" color="red" />
                                                            {r.motivo_negativo && (
                                                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                                                    {MOTIVI_NEGATIVO.find(m => m.value === (r.motivo_negativo || "").toUpperCase())?.label || r.motivo_negativo}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!r.esito && (
                                                        <span className="text-slate-300 italic text-xs">—</span>
                                                    )}
                                                    {r.data_consulenza && (
                                                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                                                            <Calendar size={11} /> App: {formatDate(r.data_consulenza)}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* NOTE */}
                                                <td className="py-3.5 px-4 align-top max-w-[260px]">
                                                    {isEditing ? (
                                                        <textarea 
                                                            className="input-sm w-full text-xs min-h-[50px] resize-none"
                                                            placeholder="Note lead..."
                                                            value={r.note || ""}
                                                            onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))}
                                                        />
                                                    ) : (
                                                        <p className="text-slate-600 text-xs line-clamp-2" title={r.note || ""}>
                                                            {r.note || <span className="text-slate-300 italic">—</span>}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button onClick={() => salvaModifica(r.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 cursor-pointer" title="Salva">
                                                                <Check size={14} />
                                                            </button>
                                                            <button onClick={() => annullaModifica(r.id)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer" title="Annulla">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                                            {r.telefono && (
                                                                <>
                                                                    <a 
                                                                        href={`https://wa.me/${r.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${r.nome || ""}, ti contattiamo da Restart Fitness Club...`)}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                                                        title="WhatsApp"
                                                                    >
                                                                        <MessageCircle size={14} />
                                                                    </a>
                                                                    <a 
                                                                        href={`tel:${r.telefono}`}
                                                                        className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 border border-sky-200 cursor-pointer"
                                                                        title="Chiama"
                                                                    >
                                                                        <Phone size={14} />
                                                                    </a>
                                                                </>
                                                            )}
                                                            <button onClick={() => avviaModifica(r)} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200 cursor-pointer" title="Modifica">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button onClick={() => eliminaRiga(r.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 cursor-pointer" title="Elimina">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TABLE FOOTER */}
                    <div className="border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 flex justify-between items-center">
                        <div>Visualizzati <b>{sortedRows.length}</b> di <b>{items.length}</b> lead</div>
                        <div className="font-semibold">{currGestioneNome}</div>
                    </div>
                </div>
            </div>

            {/* MODAL NUOVO LEAD */}
            {showNewModal && (
                <ActionModal
                    isOpen={true}
                    title="Nuovo Lead Prospect"
                    confirmLabel="Aggiungi Lead"
                    onClose={() => setShowNewModal(false)}
                    onConfirm={salvaNuovoRecord}
                >
                    <div className="space-y-3 font-sans">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Nome *</label>
                                <input className="input w-full uppercase" placeholder="Es. MARIO" value={newRecord.nome} onChange={e => setNewRecord(p => ({ ...p, nome: e.target.value }))} autoFocus />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Cognome *</label>
                                <input className="input w-full uppercase" placeholder="Es. ROSSI" value={newRecord.cognome} onChange={e => setNewRecord(p => ({ ...p, cognome: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Telefono</label>
                            <input className="input w-full font-mono" placeholder="Es. 3331234567" value={newRecord.telefono} onChange={e => setNewRecord(p => ({ ...p, telefono: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Canale / Interesse</label>
                                <input className="input w-full" placeholder="Es. Meta Ads, Sala, Corsi..." value={newRecord.tipo_abbonamento_corrente} onChange={e => setNewRecord(p => ({ ...p, tipo_abbonamento_corrente: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Data Lead</label>
                                <input type="date" className="input w-full" value={newRecord.scadenza} onChange={e => setNewRecord(p => ({ ...p, scadenza: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Note Iniziali</label>
                            <textarea className="input w-full min-h-[60px] resize-none text-xs" placeholder="Provenienza, richieste, preferenze..." value={newRecord.note} onChange={e => setNewRecord(p => ({ ...p, note: e.target.value }))} />
                        </div>
                    </div>
                </ActionModal>
            )}

            {/* MODAL IMPORT CSV */}
            {showImport && (
                <ImportCsvModal
                    gestioneId={gestioneId}
                    onClose={() => setShowImport(false)}
                    onImported={(summary) => {
                        setShowImport(false);
                        reloadItems(gestioneId);
                        alert(`Import completato! Inseriti: ${summary.inserted}, Saltati/Duplicati: ${summary.skipped}`);
                    }}
                />
            )}

            {/* MODAL REPORT LEADS */}
            <LeadsReportModal
                isOpen={reportOpen}
                onClose={() => setReportOpen(false)}
                items={items}
                listName={currGestioneNome}
            />

            {/* CLIENT TIMELINE DRAWER */}
            <ClientTimelineDrawer
                isOpen={timelineOpen}
                onClose={() => setTimelineOpen(false)}
                phone={timelinePhone}
                name={timelineName}
            />

            {/* AGENDA ENTRY DRAWER (APPUNTAMENTI) */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={null}
                section="APPUNTAMENTI (Pianificazione)"
                date={new Date().toISOString().slice(0, 10)}
                onSave={handleAgendaSave}
                onDelete={() => { }}
                allowSectionChange={true}
                {...((drawerEntry && { entry: { ...drawerEntry, id: "new" } }) || {})}
            />

        </div>
    );
}

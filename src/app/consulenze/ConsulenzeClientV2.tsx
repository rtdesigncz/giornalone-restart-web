// src/app/consulenze/ConsulenzeClientV2.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    MessageCircle, Pencil, Check, X, Trash2, Upload,
    Search, Filter, Plus, MoreHorizontal, ChevronDown,
    LayoutDashboard, Users, Calendar, CheckCircle2, AlertCircle,
    Clock, AlertTriangle, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import ImportCsvModal from "./ImportCsvModal";

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

const ReadOnlyCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`min-h-[24px] flex items-center whitespace-normal break-words ${className}`}>
        {children || <span className="text-slate-300">—</span>}
    </div>
);

export default function ConsulenzeClientV2() {
    // --- STATE MANAGEMENT (Copied from V1) ---
    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [gestioneId, setGestioneId] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [abbOptions, setAbbOptions] = useState<string[]>([]);

    const [q, setQ] = useState("");
    const [fContattati, setFContattati] = useState(false);
    const [fAppuntamenti, setFAppuntamenti] = useState(false);
    const [fConsFatte, setFConsFatte] = useState(false);
    const [fEsiti, setFEsiti] = useState<string[]>([]);
    const [fAbb, setFAbb] = useState<string[]>([]);
    const [showImport, setShowImport] = useState(false);
    const [showFilters, setShowFilters] = useState(false); // New UI state

    const resetFiltri = () => {
        setQ(""); setFContattati(false); setFAppuntamenti(false);
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
            if (fAppuntamenti && !r.preso_appuntamento) return false;
            if (fConsFatte && !r.consulenza_fatta) return false;
            if (fEsiti.length && (!r.esito || !fEsiti.includes(r.esito))) return false;
            if (fAbb.length && (!r.nuovo_abbonamento_name || !fAbb.includes(r.nuovo_abbonamento_name))) return false;
            return true;
        });
    }, [items, q, fContattati, fAppuntamenti, fConsFatte, fEsiti, fAbb]);

    const kpi = useMemo(() => {
        const totale = items.length;
        const contattati = items.filter(r => !!r.contattato).length;
        const preso = items.filter(r => !!r.preso_appuntamento).length;
        const fatte = items.filter(r => !!r.consulenza_fatta).length;
        const daFare = items.filter(r => !r.consulenza_fatta).length;
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

    const rowBgForEsito = (e: Item["esito"]) => {
        if (e === "IN ATTESA") return "bg-amber-50/50 hover:bg-amber-50";
        if (e === "NEGATIVO") return "bg-red-50/50 hover:bg-red-50";
        if (e === "ISCRIZIONE" || e === "RINNOVO" || e === "INTEGRAZIONE") return "bg-emerald-50/50 hover:bg-emerald-50";
        return "hover:bg-slate-50";
    };

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
        const tmp: Item = {
            id: `tmp-${Date.now()}`,
            gestione_id: gestioneId,
            nome: "", cognome: "", telefono: "",
            scadenza: "", tipo_abbonamento_corrente: "",
            contattato: false, preso_appuntamento: false, consulenza_fatta: false,
            data_consulenza: "", esito: null, nuovo_abbonamento_name: null, data_risposta: "",
            note: "",
            _isDraft: true, _editing: true,
        };
        setItems((it) => [tmp, ...it]);
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
    const isConsFatta = (r: Item) => !!r.consulenza_fatta;
    const abilitaNuovoAbb = (r: Item) => r.esito && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(r.esito);
    const abilitaDataRisposta = (r: Item) => r.esito === "IN ATTESA";

    // Agenda Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerEntry, setDrawerEntry] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const handleAgendaSave = () => {
        setDrawerOpen(false);
        setSuccessMsg("Salvato in agenda con successo!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    // --- RENDER ---

    return (
        <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
            {/* Import Modal */}
            {showImport && (
                <ImportCsvModal
                    gestioneId={gestioneId}
                    onClose={() => setShowImport(false)}
                    onImported={() => { reloadItems(gestioneId); }}
                />
            )}

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            {/* TOP HEADER */}
            <header className="flex items-center justify-between px-4 py-2 border-b bg-white z-20 shrink-0 h-14">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-lg tracking-tight text-slate-800">Consulenze</div>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>

                    {/* Gestione Selector */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-w-[200px]"
                                value={gestioneId}
                                onChange={(e) => setGestioneId(e.target.value)}
                            >
                                {gestioni.map(g => (
                                    <option key={g.id} value={g.id}>{g.nome}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="flex items-center">
                            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500" title="Nuova Gestione" onClick={creaGestione}>
                                <Plus className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500" title="Rinomina" onClick={rinominaGestione} disabled={!gestioneId}>
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-red-600" title="Elimina" onClick={eliminaGestione} disabled={!gestioneId}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                            placeholder="Cerca..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <button
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                        Filtri
                        {(fContattati || fAppuntamenti || fConsFatte || fEsiti.length > 0 || fAbb.length > 0) && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
                        )}
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button className="btn btn-primary flex items-center gap-2 px-4 py-1.5 text-sm" onClick={aggiungiRiga}>
                        <Plus className="w-4 h-4" />
                        Nuovo
                    </button>
                    <button className="btn btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 border border-slate-200" onClick={() => setShowImport(true)}>
                        <Upload className="w-4 h-4" />
                        Importa
                    </button>
                </div>
            </header>

            {/* KPI RIBBON */}
            <div className="flex items-center gap-6 px-6 py-2 bg-slate-50 border-b text-sm overflow-x-auto shrink-0">
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{kpi.totale}</span> Clienti
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-slate-900">{kpi.fatte}</span> Fatte
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-slate-900">{kpi.daFare}</span> Da fare
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex gap-3">
                    {kpi.esiti.map(e => (
                        <div key={e.esito} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border text-xs">
                            <span className="text-slate-500 capitalize">{e.esito.toLowerCase()}:</span>
                            <span className="font-semibold">{e.cnt}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* FILTERS DRAWER */}
            {showFilters && (
                <div className="bg-slate-50 border-b px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stato</div>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={fContattati} onChange={e => setFContattati(e.target.checked)} />
                                Contattati
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={fAppuntamenti} onChange={e => setFAppuntamenti(e.target.checked)} />
                                Appuntamenti
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={fConsFatte} onChange={e => setFConsFatte(e.target.checked)} />
                                Consulenze Fatte
                            </label>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Esito</div>
                        <div className="flex flex-wrap gap-2">
                            {ESITI.map(e => (
                                <label key={e} className={`px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${fEsiti.includes(e) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                    <input type="checkbox" className="hidden" checked={fEsiti.includes(e)} onChange={() => toggleStrIn(fEsiti, setFEsiti, e)} />
                                    {e}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nuovo Abbonamento</div>
                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                            {abbOptions.map(n => (
                                <label key={n} className={`px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${fAbb.includes(n) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                    <input type="checkbox" className="hidden" checked={fAbb.includes(n)} onChange={() => toggleStrIn(fAbb, setFAbb, n)} />
                                    {n}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button className="text-xs text-slate-500 hover:text-slate-800 underline" onClick={resetFiltri}>Azzera filtri</button>
                    </div>
                </div>
            )}

            {/* MAIN TABLE AREA */}
            <div className="flex-1 overflow-auto relative bg-slate-100/50">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-sm text-slate-500 font-medium">Caricamento...</div>
                        </div>
                    </div>
                )}

                {err && (
                    <div className="p-8 text-center">
                        <div className="text-red-500 font-medium mb-2">Si è verificato un errore</div>
                        <div className="text-slate-500 text-sm">{err}</div>
                        <button className="mt-4 btn btn-outline btn-sm" onClick={() => reloadItems(gestioneId)}>Riprova</button>
                    </div>
                )}

                {!loading && !err && (
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {[
                                    ["Nome", "min-w-[100px] pl-2"], ["Cognome", "min-w-[100px]"], ["Scad.", "min-w-[80px]"], ["Abbon.", "min-w-[100px]"],
                                    ["Tel.", "min-w-[100px]"], ["Cont.", "w-10 text-center"], ["App.", "w-10 text-center"], ["Cons.", "min-w-[90px]"], [<Flag key="flag" size={14} className="mx-auto text-emerald-600" />, "w-10 text-center"],
                                    ["Esito", "min-w-[100px]"], ["Nuovo Abb.", "min-w-[120px]"], ["Risp.", "min-w-[90px]"], ["Note", "min-w-[150px]"], ["", "w-20 pr-2"]
                                ].map(([label, extra], i) => (
                                    <th key={i} className={`py-2 px-1 border-b border-slate-200 bg-white ${extra}`}>
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {rows.length > 0 ? rows.map(r => {
                                const editableNow = !!r.preso_appuntamento; // Date editable if appointment taken
                                const esitoEditable = !!r.consulenza_fatta; // Outcome editable only if consultation done

                                // Visual feedback for date
                                let dateClass = "text-slate-600";
                                let DateIcon = null;
                                if (r.preso_appuntamento && !r.consulenza_fatta && r.data_consulenza) {
                                    const d = new Date(r.data_consulenza);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (d < today) {
                                        dateClass = "text-rose-600 font-bold"; // Missed/To Confirm
                                        DateIcon = <AlertTriangle className="w-3 h-3 text-rose-500 mr-1" />;
                                    } else {
                                        dateClass = "text-blue-600 font-medium"; // Future
                                        DateIcon = <Clock className="w-3 h-3 text-blue-500 mr-1" />;
                                    }
                                }

                                const inputCls = "w-full bg-transparent border-b border-indigo-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 text-slate-900 placeholder-slate-300 transition-colors";
                                const rowBg = rowBgForEsito(r.esito);

                                return (
                                    <tr key={r.id} className={`group transition-colors ${rowBg} cursor-pointer hover:brightness-95`} onDoubleClick={() => entraInModifica(r.id)}>
                                        <td className="py-1 px-1 pl-2">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nome: e.target.value } : x))} placeholder="Nome" />
                                            ) : <ReadOnlyCell className="font-medium text-slate-700 text-xs">{r.nome}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cognome: e.target.value } : x))} placeholder="Cognome" />
                                            ) : <ReadOnlyCell className="font-medium text-slate-700 text-xs">{r.cognome}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input type="date" className={inputCls} value={r.scadenza || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, scadenza: v } : x)); }} />
                                            ) : <ReadOnlyCell className="text-slate-500 text-xs">{formatDate(r.scadenza)}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.tipo_abbonamento_corrente || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento_corrente: e.target.value } : x))} />
                                            ) : <ReadOnlyCell className="text-slate-500 text-xs">{r.tipo_abbonamento_corrente}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, telefono: e.target.value } : x))} />
                                            ) : (
                                                <ReadOnlyCell className="font-mono text-slate-600 text-[10px]">{r.telefono}</ReadOnlyCell>
                                            )}
                                        </td>

                                        {/* Checkboxes */}
                                        <td className="py-1 px-1 text-center">
                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-primary"
                                                disabled={!editable(r)}
                                                checked={!!r.contattato}
                                                onChange={e => { const v = e.target.checked; setItems(it => it.map(x => x.id === r.id ? { ...x, contattato: v } : x)); }}
                                            />
                                        </td>
                                        <td className="py-1 px-1 text-center">
                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary"
                                                disabled={!editable(r)}
                                                checked={!!r.preso_appuntamento}
                                                onChange={e => { const v = e.target.checked; setItems(it => it.map(x => x.id === r.id ? { ...x, preso_appuntamento: v } : x)); }}
                                            />
                                        </td>
                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input type="date" className={inputCls} disabled={!editableNow} value={r.data_consulenza || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_consulenza: v } : x)); }} />
                                            ) : (
                                                <div className={`min-h-[24px] flex items-center whitespace-nowrap overflow-hidden text-ellipsis text-xs ${dateClass}`}>
                                                    {DateIcon}
                                                    {formatDate(r.data_consulenza) || <span className="text-slate-300">—</span>}
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-1 px-1 text-center">
                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-success"
                                                disabled={!editable(r)}
                                                checked={!!r.consulenza_fatta}
                                                onChange={e => {
                                                    const v = e.target.checked;
                                                    const patch: any = { consulenza_fatta: v };
                                                    if (!v) { patch.data_consulenza = ""; patch.esito = null; patch.nuovo_abbonamento_name = null; patch.data_risposta = ""; }
                                                    setItems(it => it.map(x => x.id === r.id ? { ...x, ...patch } : x));
                                                }}
                                            />
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <select className={inputCls} disabled={!esitoEditable} value={r.esito || ""}
                                                    onChange={e => {
                                                        const v = (e.target.value || null) as Item["esito"];
                                                        const patch: any = { esito: v };
                                                        if (!v || !["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(v)) patch.nuovo_abbonamento_name = null;
                                                        if (v !== "IN ATTESA") patch.data_risposta = "";
                                                        setItems(it => it.map(x => x.id === r.id ? { ...x, ...patch } : x));
                                                    }}
                                                >
                                                    <option value="">—</option>
                                                    {ESITI.map(e => <option key={e} value={e}>{e}</option>)}
                                                </select>
                                            ) : (
                                                <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide
                          ${r.esito === 'ISCRIZIONE' || r.esito === 'RINNOVO' || r.esito === 'INTEGRAZIONE' ? 'bg-emerald-100 text-emerald-800' :
                                                        r.esito === 'NEGATIVO' ? 'bg-red-100 text-red-800' :
                                                            r.esito === 'IN ATTESA' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'
                                                    }`}>
                                                    {r.esito || "—"}
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <select className={inputCls} disabled={!esitoEditable || !["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(r.esito || "")} value={r.nuovo_abbonamento_name || ""} onChange={e => { const v = e.target.value || null; setItems(it => it.map(x => x.id === r.id ? { ...x, nuovo_abbonamento_name: v } : x)); }} >
                                                    <option value=""></option>
                                                    {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            ) : (
                                                <ReadOnlyCell className="text-xs">{r.nuovo_abbonamento_name}</ReadOnlyCell>
                                            )}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input type="date" className={inputCls} disabled={!esitoEditable || r.esito !== "IN ATTESA"} value={r.data_risposta || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_risposta: v } : x)); }} />
                                            ) : (
                                                <ReadOnlyCell className="text-xs">{r.data_risposta}</ReadOnlyCell>
                                            )}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <textarea className="w-full bg-transparent border-b border-indigo-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 text-slate-900 placeholder-slate-300 transition-colors min-h-[24px] resize-none overflow-hidden"
                                                    value={r.note || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))}
                                                />
                                            ) : (
                                                <div className="min-w-[150px] whitespace-normal break-words text-slate-500 text-[10px] leading-relaxed line-clamp-2" title={r.note || ""}>{r.note || <span className="text-slate-200">—</span>}</div>
                                            )}
                                        </td>

                                        <td className="py-1 px-1 pr-2 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {r._isDraft ? (
                                                    <>
                                                        <button className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" title="Salva" onClick={() => salvaBozza(r.id)}><Check className="w-4 h-4" /></button>
                                                        <button className="p-1 hover:bg-red-50 text-red-600 rounded" title="Annulla" onClick={() => annullaBozza(r.id)}><X className="w-4 h-4" /></button>
                                                    </>
                                                ) : r._editing ? (
                                                    <>
                                                        <button className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" title="Salva" onClick={() => salvaModifica(r.id)}><Check className="w-4 h-4" /></button>
                                                        <button className="p-1 hover:bg-red-50 text-red-600 rounded" title="Annulla" onClick={() => annullaModifica(r.id)}><X className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {r.telefono && (
                                                            <a className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" href={`https://wa.me/${encodeURIComponent(r.telefono)}`} target="_blank" rel="noreferrer" title="WhatsApp">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button className="p-1 hover:bg-indigo-50 text-indigo-600 rounded" title="Modifica" onClick={() => entraInModifica(r.id)}><Pencil className="w-4 h-4" /></button>
                                                        <button
                                                            onClick={() => {
                                                                setDrawerEntry({
                                                                    nome: r.nome,
                                                                    cognome: r.cognome,
                                                                    telefono: r.telefono,
                                                                    note: r.note,
                                                                    entry_date: r.data_consulenza // Pre-fill date
                                                                });
                                                                setDrawerOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                                                            title="Aggiungi in Agenda"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1 hover:bg-red-50 text-red-600 rounded" title="Elimina" onClick={() => eliminaRiga(r.id)}><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={14} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <div>Nessun risultato trovato</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* FOOTER */}
            <div className="border-t bg-white px-4 py-2 text-xs text-slate-400 flex justify-between items-center shrink-0">
                <div>{rows.length} righe visualizzate</div>
                <div>Progettato da Roberto Tavano</div>
            </div>
            {/* AGENDA DRAWER */}
            <EntryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={null} // Always new entry
                section="TOUR SPONTANEI" // Default, but user can change
                date={new Date().toISOString().slice(0, 10)}
                onSave={handleAgendaSave}
                onDelete={() => { }}
                allowSectionChange={true}
                // Pre-fill data
                {...((drawerEntry && { entry: { ...drawerEntry, id: "new" } }) || {})}
            />
        </div>
    );
}

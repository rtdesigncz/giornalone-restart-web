
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

type Gestione = { id: string; nome: string; descrizione?: string | null };

type Item = {
    id: string;
    gestione_id: string;

    cliente_nome: string | null;
    cliente_cognome: string | null;
    cliente_telefono: string | null;
    data_consegna: string | null; // YYYY-MM-DD

    referral_nome: string | null;
    referral_cognome: string | null;
    referral_telefono: string | null;

    data_attivazione: string | null; // YYYY-MM-DD
    iscritto: boolean | null;
    tipo_abbonamento: string | null;

    note: string | null;

    _isDraft?: boolean;
    _editing?: boolean;
    _backup?: Partial<Item>;
};

const ReadOnlyCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`min-h-[24px] flex items-center whitespace-normal break-words ${className}`}>
        {children || <span className="text-slate-300">—</span>}
    </div>
);

export default function ConsegnaPassClient() {
    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [gestioneId, setGestioneId] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [abbOptions, setAbbOptions] = useState<string[]>([]);
    const [q, setQ] = useState("");

    // Agenda Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerEntry, setDrawerEntry] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/pass/gestioni");
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
            const ri = await fetch(`/api/pass/items?gestione=${gid}`);
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
                const s = `${r.cliente_nome || ""} ${r.cliente_cognome || ""} ${r.referral_nome || ""} ${r.referral_cognome || ""} ${r.referral_telefono || ""}`.toLowerCase();
                if (!s.includes(qq)) return false;
            }
            return true;
        });
    }, [items, q]);

    const kpi = useMemo(() => {
        const totale = items.length;
        const attivati = items.filter(r => !!r.data_attivazione).length;
        const iscritti = items.filter(r => !!r.iscritto).length;

        const abbMap = new Map<string, number>();
        for (const r of items) {
            const n = r.tipo_abbonamento?.trim();
            if (!n) continue;
            abbMap.set(n, (abbMap.get(n) || 0) + 1);
        }
        const abbonamenti = Array.from(abbMap.entries()).map(([name, cnt]) => ({ name, cnt }));
        return { totale, attivati, iscritti, abbonamenti };
    }, [items]);

    const creaGestione = async () => {
        const nome = window.prompt("Nome della gestione?");
        if (!nome) return;
        const res = await fetch("/api/pass/gestioni", {
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
        const res = await fetch(`/api/pass/gestioni?id=${gestioneId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });
        if (res.ok) setGestioni((g) => g.map(x => x.id === gestioneId ? { ...x, nome } : x));
        else alert("Errore rinomina gestione");
    };

    const eliminaGestione = async () => {
        if (!gestioneId) return;
        if (!confirm("Eliminare questa gestione e tutte le righe?")) return;
        const res = await fetch(`/api/pass/gestioni?id=${gestioneId}`, { method: "DELETE" });
        if (res.ok) {
            const next = gestioni.filter(x => x.id !== gestioneId);
            setGestioni(next);
            setGestioneId(next[0]?.id || "");
            setItems([]);
        } else alert("Errore eliminazione gestione");
    };

    const persistFullRow = async (r: Item) => {
        const body = {
            cliente_nome: r.cliente_nome ?? null,
            cliente_cognome: r.cliente_cognome ?? null,
            cliente_telefono: r.cliente_telefono ?? null,
            data_consegna: r.data_consegna || null,
            referral_nome: r.referral_nome ?? null,
            referral_cognome: r.referral_cognome ?? null,
            referral_telefono: r.referral_telefono ?? null,
            data_attivazione: r.data_attivazione || null,
            iscritto: !!r.iscritto,
            tipo_abbonamento: r.tipo_abbonamento || null,
            note: r.note || null,
        };
        const res = await fetch(`/api/pass/items?id=${r.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || "Errore salvataggio riga");
        }
    };

    const eliminaRiga = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (r?._isDraft) { setItems(it => it.filter(x => x.id !== id)); return; }
        if (!confirm("Eliminare la riga?")) return;
        const res = await fetch(`/api/pass/items?id=${id}`, { method: "DELETE" });
        if (res.ok) setItems(it => it.filter(r => r.id !== id));
        else alert("Errore eliminazione riga");
    };

    const aggiungiRiga = () => {
        if (!gestioneId) { alert("Seleziona una gestione"); return; }
        const tmp: Item = {
            id: `tmp-${Date.now()}`,
            gestione_id: gestioneId,
            cliente_nome: "", cliente_cognome: "", cliente_telefono: "", data_consegna: new Date().toISOString().slice(0, 10),
            referral_nome: "", referral_cognome: "", referral_telefono: "",
            data_attivazione: "", iscritto: false, tipo_abbonamento: null,
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
            cliente_nome: r.cliente_nome ?? null, cliente_cognome: r.cliente_cognome ?? null, cliente_telefono: r.cliente_telefono ?? null, data_consegna: r.data_consegna || null,
            referral_nome: r.referral_nome ?? null, referral_cognome: r.referral_cognome ?? null, referral_telefono: r.referral_telefono ?? null,
            data_attivazione: r.data_attivazione || null, iscritto: !!r.iscritto, tipo_abbonamento: r.tipo_abbonamento || null,
            note: r.note || null,
        };
        const res = await fetch(`/api/pass/items`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert("Errore salvataggio riga: " + (j.error || "Sconosciuto"));
            return;
        }
        const j = await res.json();
        setItems(it => it.map(x => x.id === id ? { ...j.row, _editing: false } : x));
    };

    const annullaBozza = (id: string) => setItems(it => it.filter(x => x.id !== id));

    const entraInModifica = (id: string) => {
        setItems(it => it.map(x => {
            if (x.id !== id) return x;
            const backup: Partial<Item> = {
                cliente_nome: x.cliente_nome, cliente_cognome: x.cliente_cognome, cliente_telefono: x.cliente_telefono, data_consegna: x.data_consegna,
                referral_nome: x.referral_nome, referral_cognome: x.referral_cognome, referral_telefono: x.referral_telefono,
                data_attivazione: x.data_attivazione, iscritto: x.iscritto, tipo_abbonamento: x.tipo_abbonamento,
                note: x.note
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
        } catch (e: any) {
            alert("Errore salvataggio riga: " + e.message);
        }
    };

    const annullaModifica = (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        const b = r._backup || {};
        setItems(it => it.map(x => x.id === id ? { ...x, ...b, _editing: false, _backup: undefined } : x));
    };

    const editable = (r: Item) => !!(r._isDraft || r._editing);

    const handleAgendaSave = () => {
        setDrawerOpen(false);
        setSuccessMsg("Salvato in agenda con successo!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    return (
        <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
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
                    <div className="font-bold text-lg tracking-tight text-slate-800">Consegna Pass</div>
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
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button className="btn btn-primary flex items-center gap-2 px-4 py-1.5 text-sm" onClick={aggiungiRiga}>
                        <Plus className="w-4 h-4" />
                        Nuovo
                    </button>
                </div>
            </header>

            {/* KPI RIBBON */}
            <div className="flex items-center gap-6 px-6 py-2 bg-slate-50 border-b text-sm overflow-x-auto shrink-0">
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{kpi.totale}</span> Pass Consegnati
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-slate-900">{kpi.attivati}</span> Attivati
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Flag className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-slate-900">{kpi.iscritti}</span> Iscritti da Pass
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex gap-3">
                    {kpi.abbonamenti.map(e => (
                        <div key={e.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border text-xs">
                            <span className="text-slate-500 capitalize">{e.name.toLowerCase()}:</span>
                            <span className="font-semibold">{e.cnt}</span>
                        </div>
                    ))}
                </div>
            </div>

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
                                    ["Cliente", "min-w-[140px] pl-2"], ["Tel. Cli.", "min-w-[100px]"], ["Consegna", "min-w-[90px]"],
                                    ["Ref. Nome", "min-w-[100px]"], ["Ref. Cogn.", "min-w-[100px]"], ["Ref. Tel", "min-w-[100px]"],
                                    ["Att.", "w-10 text-center"], ["Data Att.", "min-w-[90px]"], ["Iscr.", "w-10 text-center"], ["Tipo Abb.", "min-w-[120px]"],
                                    ["Note", "min-w-[150px]"], ["", "w-20 pr-2"]
                                ].map(([label, extra], i) => (
                                    <th key={i} className={`py-2 px-1 border-b border-slate-200 bg-white ${extra}`}>
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {rows.length > 0 ? rows.map(r => {
                                const inputCls = "w-full bg-transparent border-b border-indigo-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 text-slate-900 placeholder-slate-300 transition-colors";

                                return (
                                    <tr key={r.id} className="group transition-colors hover:bg-slate-50 cursor-pointer hover:brightness-95" onDoubleClick={() => entraInModifica(r.id)}>
                                        <td className="py-1 px-1 pl-2">
                                            {editable(r) ? (
                                                <div className="flex gap-1">
                                                    <input className={inputCls} value={r.cliente_nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_nome: e.target.value } : x))} placeholder="Nome" />
                                                    <input className={inputCls} value={r.cliente_cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_cognome: e.target.value } : x))} placeholder="Cognome" />
                                                </div>
                                            ) : <ReadOnlyCell className="font-medium text-slate-700 text-xs">{r.cliente_nome} {r.cliente_cognome}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.cliente_telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_telefono: e.target.value } : x))} placeholder="Tel. Cliente" />
                                            ) : <ReadOnlyCell className="font-mono text-slate-600 text-[10px]">{r.cliente_telefono}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input type="date" className={inputCls} value={r.data_consegna || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_consegna: v } : x)); }} />
                                            ) : <ReadOnlyCell className="text-slate-500 text-xs">{formatDate(r.data_consegna)}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.referral_nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_nome: e.target.value } : x))} placeholder="Ref. Nome" />
                                            ) : <ReadOnlyCell className="text-slate-600 text-xs">{r.referral_nome}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.referral_cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_cognome: e.target.value } : x))} placeholder="Ref. Cognome" />
                                            ) : <ReadOnlyCell className="text-slate-600 text-xs">{r.referral_cognome}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input className={inputCls} value={r.referral_telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_telefono: e.target.value } : x))} placeholder="Ref. Tel" />
                                            ) : <ReadOnlyCell className="font-mono text-slate-600 text-[10px]">{r.referral_telefono}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1 text-center">
                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary"
                                                disabled={!editable(r)}
                                                checked={!!r.data_attivazione}
                                                onChange={e => {
                                                    const v = e.target.checked;
                                                    const today = new Date().toISOString().slice(0, 10);
                                                    setItems(it => it.map(x => x.id === r.id ? { ...x, data_attivazione: v ? today : null } : x));
                                                }}
                                            />
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <input type="date" className={inputCls} disabled={!r.data_attivazione} value={r.data_attivazione || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_attivazione: v } : x)); }} />
                                            ) : <ReadOnlyCell className="text-slate-500 text-xs">{formatDate(r.data_attivazione)}</ReadOnlyCell>}
                                        </td>

                                        <td className="py-1 px-1 text-center">
                                            <input type="checkbox" className="checkbox checkbox-xs checkbox-primary"
                                                disabled={!editable(r)}
                                                checked={!!r.iscritto}
                                                onChange={e => {
                                                    const v = e.target.checked;
                                                    const patch: any = { iscritto: v };
                                                    if (!v) patch.tipo_abbonamento = null;
                                                    setItems(it => it.map(x => x.id === r.id ? { ...x, ...patch } : x));
                                                }}
                                            />
                                        </td>

                                        <td className="py-1 px-1">
                                            {editable(r) ? (
                                                <select className={inputCls} disabled={!r.iscritto} value={r.tipo_abbonamento || ""} onChange={e => { const v = e.target.value || null; setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento: v } : x)); }} >
                                                    <option value=""></option>
                                                    {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            ) : (
                                                <ReadOnlyCell className="text-xs">{r.tipo_abbonamento}</ReadOnlyCell>
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
                                                        {r.referral_telefono && (
                                                            <a className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" href={`https://wa.me/${encodeURIComponent(r.referral_telefono)}`} target="_blank" rel="noreferrer" title="WhatsApp Referral">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button className="p-1 hover:bg-indigo-50 text-indigo-600 rounded" title="Modifica" onClick={() => entraInModifica(r.id)}><Pencil className="w-4 h-4" /></button>
                                                        <button
                                                            onClick={() => {
                                                                setDrawerEntry({
                                                                    nome: r.referral_nome,
                                                                    cognome: r.referral_cognome,
                                                                    telefono: r.referral_telefono,
                                                                    note: r.note
                                                                });
                                                                setDrawerOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                                                            title="Aggiungi in Agenda (Referral)"
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
                                    <td colSpan={12} className="py-12 text-center text-slate-400">
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
                section="APPUNTAMENTI (Pianificazione)" // Default as requested
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

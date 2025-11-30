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
    whatsapp_sent_date?: string | null;

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
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Success Toast */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            {/* TOP HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 py-3">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Consegna Pass</h1>
                                </div>

                                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                {/* Gestione Selector */}
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <select
                                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold min-w-[180px] transition-all hover:border-cyan-300 cursor-pointer"
                                            value={gestioneId}
                                            onChange={(e) => setGestioneId(e.target.value)}
                                        >
                                            {gestioni.map(g => (
                                                <option key={g.id} value={g.id}>{g.nome}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-cyan-500 transition-colors" />
                                    </div>

                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
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

                            <div className="flex-1 max-w-md relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cerca cliente..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                    value={q}
                                    onChange={e => setQ(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={aggiungiRiga}
                                    className="btn btn-brand"
                                >
                                    <Plus className="w-4 h-4" /> Nuovo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI RIBBON */}
            <div className="flex items-center gap-4 px-4 md:gap-8 md:px-8 py-3 bg-white border-b border-slate-200 text-sm overflow-x-auto shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-lg font-bold text-slate-900">{kpi.totale}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pass Totali</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600 font-medium">{kpi.attivati} <span className="text-slate-400 font-normal">Attivati</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-slate-600 font-medium">{kpi.iscritti} <span className="text-slate-400 font-normal">Iscritti</span></span>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-100"></div>

                <div className="flex gap-2">
                    {kpi.abbonamenti.map(e => (
                        <div key={e.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs transition-colors hover:bg-slate-100">
                            <span className="text-slate-500 capitalize font-medium">{e.name.toLowerCase()}</span>
                            <span className="bg-white px-1.5 rounded-md shadow-sm border border-slate-100 font-bold text-slate-700">{e.cnt}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN TABLE AREA */}
            <div className="flex-1 overflow-auto relative bg-slate-50 p-6">
                {err && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Si è verificato un errore</h3>
                        <p className="text-slate-500 max-w-md mb-6">{err}</p>
                        <button className="btn bg-cyan-600 text-white hover:bg-cyan-700 px-6 py-2 rounded-lg" onClick={() => reloadItems(gestioneId)}>Riprova</button>
                    </div>
                )}

                {!err && (
                    <div className="w-full max-w-[1600px] mx-auto">
                        <div className="hidden md:block">
                            <table className="w-full border-separate border-spacing-y-3">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {[
                                            ["Cliente", "pl-4"], ["Telefono", ""], ["Consegna", ""],
                                            ["Referral", ""], ["Tel. Ref.", ""],
                                            ["Attivato", "text-center"], ["Data Att.", ""], ["Iscritto", "text-center"], ["Abbonamento", ""],
                                            ["Note", ""], ["Azioni", "text-right pr-4"]
                                        ].map(([label, extra], i) => (
                                            <th key={i} className={`pb-2 whitespace-nowrap ${extra}`}>
                                                {label}
                                            </th>
                                        ))}
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
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-20"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                                                <td className="py-4 text-center"><div className="w-4 h-4 bg-slate-200 rounded mx-auto"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-20"></div></td>
                                                <td className="py-4 text-center"><div className="w-4 h-4 bg-slate-200 rounded mx-auto"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                                                <td className="py-4"><div className="h-3 bg-slate-100 rounded w-full"></div></td>
                                                <td className="py-4 pr-4 rounded-r-xl text-right"><div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : (
                                        rows.length > 0 ? rows.map(r => {
                                            const isEditing = editable(r);
                                            const inputCls = "input-sm w-full";

                                            const isActivated = !!r.data_attivazione;
                                            const today = new Date();
                                            const consegnaDate = r.data_consegna ? new Date(r.data_consegna) : null;
                                            let rowBorderClass = "border-transparent"; // Default

                                            if (isActivated) {
                                                rowBorderClass = "border-emerald-300 bg-emerald-50";
                                            } else if (consegnaDate) {
                                                const diffTime = Math.abs(today.getTime() - consegnaDate.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                if (diffDays >= 7) {
                                                    rowBorderClass = "border-red-300 bg-red-50";
                                                } else if (diffDays >= 3) {
                                                    rowBorderClass = "border-amber-300 bg-amber-50";
                                                }
                                            }

                                            return (
                                                <tr key={r.id} className={cn("group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border", rowBorderClass)}>

                                                    {/* CLIENTE */}
                                                    <td className="py-4 pl-4 rounded-l-xl align-top max-w-[200px]">
                                                        {isEditing ? (
                                                            <div className="space-y-2">
                                                                <input className="input-sm w-full font-bold" placeholder="Nome" value={r.cliente_nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_nome: e.target.value } : x))} />
                                                                <input className="input-sm w-full" placeholder="Cognome" value={r.cliente_cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_cognome: e.target.value } : x))} />
                                                            </div>
                                                        ) : (
                                                            <div className="font-bold text-slate-800 text-sm">{r.cliente_nome} {r.cliente_cognome}</div>
                                                        )}
                                                    </td>

                                                    {/* TELEFONO CLIENTE */}
                                                    <td className="py-4 align-top">
                                                        {isEditing ? (
                                                            <input className="input-sm w-full font-mono text-xs" placeholder="Telefono" value={r.cliente_telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_telefono: e.target.value } : x))} />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-mono text-slate-500 text-xs">{r.cliente_telefono || "—"}</div>
                                                                {r.cliente_telefono && !r._isDraft && (
                                                                    <button
                                                                        className={cn(
                                                                            "p-1 rounded-full transition-colors",
                                                                            r.whatsapp_sent_date ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600"
                                                                        )}
                                                                        title={r.whatsapp_sent_date ? "Follow-up inviato" : "Invia Follow-up WhatsApp"}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (!r.cliente_telefono) return;

                                                                            const msg = `Ciao ${r.cliente_nome || ""}, 
Ti scriviamo da Restart Fitness Club!

Qualche giorno fa ti abbiamo affidato un pass da donare a qualcuno a cui vuoi bene… un piccolo gesto che può diventare il primo passo verso più movimento, più energia, più benessere.

Crediamo davvero che muoversi cambi la vita: rende la mente più leggera, il corpo più vivo e le giornate un po’ più nostre. Per questo ci chiedevamo se, nel frattempo, hai pensato a qualcuno a cui potrebbe far bene questo invito.
Se la risposta è sì, puoi lasciarci il suo contatto, ci farebbe piacere farci una chiacchierata, capire come sta e mettere a disposizione il nostro aiuto, un passo alla volta, a ritrovare il piacere di muoversi e prendersi cura di sé.

Che ne pensi? Facci sapere, grazie di cuore!`;

                                                                            const link = `https://wa.me/${r.cliente_telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
                                                                            window.open(link, '_blank');

                                                                            // Update sent date
                                                                            if (!r.whatsapp_sent_date) {
                                                                                const now = new Date().toISOString();
                                                                                try {
                                                                                    await fetch(`/api/pass/items?id=${r.id}`, {
                                                                                        method: "PATCH",
                                                                                        headers: { "Content-Type": "application/json" },
                                                                                        body: JSON.stringify({ whatsapp_sent_date: now })
                                                                                    });
                                                                                    setItems(it => it.map(x => x.id === r.id ? { ...x, whatsapp_sent_date: now } : x));
                                                                                } catch (err) {
                                                                                    console.error("Error updating whatsapp date", err);
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        {r.whatsapp_sent_date ? <CheckCircle2 className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* DATA CONSEGNA */}
                                                    <td className="py-4 align-top">
                                                        {isEditing ? (
                                                            <input type="date" className="input-sm w-32 text-xs" value={r.data_consegna || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_consegna: v } : x)); }} />
                                                        ) : (
                                                            <div className="text-slate-500 text-xs font-medium">{formatDate(r.data_consegna)}</div>
                                                        )}
                                                    </td>

                                                    {/* REFERRAL */}
                                                    <td className="py-4 align-top max-w-[200px]">
                                                        {isEditing ? (
                                                            <div className="space-y-2">
                                                                <input className="input-sm w-full" placeholder="Ref. Nome" value={r.referral_nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_nome: e.target.value } : x))} />
                                                                <input className="input-sm w-full" placeholder="Ref. Cognome" value={r.referral_cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_cognome: e.target.value } : x))} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-600 text-sm">{r.referral_nome} {r.referral_cognome}</div>
                                                        )}
                                                    </td>

                                                    {/* REFERRAL TEL */}
                                                    <td className="py-4 align-top">
                                                        {isEditing ? (
                                                            <input className="input-sm w-full font-mono text-xs" placeholder="Ref. Tel" value={r.referral_telefono || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, referral_telefono: e.target.value } : x))} />
                                                        ) : (
                                                            <div className="font-mono text-slate-500 text-xs">{r.referral_telefono || "—"}</div>
                                                        )}
                                                    </td>

                                                    {/* ATTIVATO (CHECKBOX) */}
                                                    <td className="py-4 align-top text-center">
                                                        <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                                            disabled={!editable(r)}
                                                            checked={!!r.data_attivazione}
                                                            onChange={e => {
                                                                const v = e.target.checked;
                                                                const today = new Date().toISOString().slice(0, 10);
                                                                setItems(it => it.map(x => x.id === r.id ? { ...x, data_attivazione: v ? today : null } : x));
                                                            }}
                                                        />
                                                    </td>

                                                    {/* DATA ATTIVAZIONE */}
                                                    <td className="py-4 align-top">
                                                        {isEditing ? (
                                                            <input type="date" className="input-sm w-32 text-xs" disabled={!r.data_attivazione} value={r.data_attivazione || ""} onChange={e => { const v = e.target.value; setItems(it => it.map(x => x.id === r.id ? { ...x, data_attivazione: v } : x)); }} />
                                                        ) : (
                                                            <div className={cn("text-xs font-medium", r.data_attivazione ? "text-emerald-600" : "text-slate-300")}>{formatDate(r.data_attivazione) || "—"}</div>
                                                        )}
                                                    </td>

                                                    {/* ISCRITTO (CHECKBOX) */}
                                                    <td className="py-4 align-top text-center">
                                                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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

                                                    {/* ABBONAMENTO */}
                                                    <td className="py-4 align-top">
                                                        {isEditing ? (
                                                            <select className="input-sm w-full text-xs" disabled={!r.iscritto} value={r.tipo_abbonamento || ""} onChange={e => { const v = e.target.value || null; setItems(it => it.map(x => x.id === r.id ? { ...x, tipo_abbonamento: v } : x)); }} >
                                                                <option value=""></option>
                                                                {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                                                            </select>
                                                        ) : (
                                                            <div className="text-xs text-slate-700 font-medium">{r.tipo_abbonamento || "—"}</div>
                                                        )}
                                                    </td>

                                                    {/* NOTE */}
                                                    <td className="py-4 align-top max-w-[200px]">
                                                        {isEditing ? (
                                                            <textarea className="input-sm w-full min-h-[60px] resize-none"
                                                                value={r.note || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))}
                                                            />
                                                        ) : (
                                                            <div className="text-xs text-slate-500 line-clamp-3" title={r.note || ""}>{r.note || "—"}</div>
                                                        )}
                                                    </td>

                                                    {/* AZIONI */}
                                                    <td className="py-4 pr-4 rounded-r-xl align-top text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <button className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Salva" onClick={() => r._isDraft ? salvaBozza(r.id) : salvaModifica(r.id)}><Check className="w-4 h-4" /></button>
                                                                    <button className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Annulla" onClick={() => r._isDraft ? annullaBozza(r.id) : annullaModifica(r.id)}><X className="w-4 h-4" /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {r.referral_telefono && (
                                                                        <a className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" href={`https://wa.me/${encodeURIComponent(r.referral_telefono)}`} target="_blank" rel="noreferrer" title="WhatsApp Referral">
                                                                            <MessageCircle className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                    <button className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors" title="Modifica" onClick={() => entraInModifica(r.id)}><Pencil className="w-4 h-4" /></button>
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
                                                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                                        title="Aggiungi in Agenda (Referral)"
                                                                    >
                                                                        <Calendar className="w-4 h-4" />
                                                                    </button>
                                                                    <button className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Elimina" onClick={() => eliminaRiga(r.id)}><Trash2 className="w-4 h-4" /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={11} className="py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-8 h-8 opacity-20" />
                                                        <div>Nessun risultato trovato</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {loading ? (
                                // Skeleton Cards
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-sm border border-transparent p-4 space-y-4 animate-pulse">
                                        <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                rows.length > 0 ? rows.map(r => {
                                    const isEditing = editable(r);
                                    const isActivated = !!r.data_attivazione;
                                    const today = new Date();
                                    const consegnaDate = r.data_consegna ? new Date(r.data_consegna) : null;
                                    let cardBorderClass = "border-slate-100";

                                    if (isActivated) {
                                        cardBorderClass = "border-emerald-300 bg-emerald-50/30";
                                    } else if (consegnaDate) {
                                        const diffTime = Math.abs(today.getTime() - consegnaDate.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        if (diffDays >= 7) cardBorderClass = "border-red-300 bg-red-50/30";
                                        else if (diffDays >= 3) cardBorderClass = "border-amber-300 bg-amber-50/30";
                                    }

                                    return (
                                        <div key={r.id} className={cn("bg-white rounded-xl shadow-sm border p-4 space-y-4", cardBorderClass)}>
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    {isEditing ? (
                                                        <div className="space-y-2 mb-2">
                                                            <input className="input-sm w-full font-bold" placeholder="Nome" value={r.cliente_nome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_nome: e.target.value } : x))} />
                                                            <input className="input-sm w-full" placeholder="Cognome" value={r.cliente_cognome || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, cliente_cognome: e.target.value } : x))} />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-lg">{r.cliente_nome} {r.cliente_cognome}</div>
                                                            <div className="text-xs text-slate-500 font-mono mt-1">{r.cliente_telefono}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Actions */}
                                                <div className="flex items-center gap-1 ml-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => r._isDraft ? salvaBozza(r.id) : salvaModifica(r.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => r._isDraft ? annullaBozza(r.id) : annullaModifica(r.id)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                                        </>
                                                    ) : (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => entraInModifica(r.id)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => eliminaRiga(r.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-slate-50 p-2 rounded-lg">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Consegna</div>
                                                    <div className="font-medium text-slate-700">{formatDate(r.data_consegna) || "—"}</div>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Referral</div>
                                                    <div className="font-medium text-slate-700">{r.referral_nome} {r.referral_cognome || "—"}</div>
                                                </div>
                                            </div>

                                            {/* Status Toggles */}
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500"
                                                        disabled={!editable(r)}
                                                        checked={!!r.data_attivazione}
                                                        onChange={e => {
                                                            const v = e.target.checked;
                                                            const today = new Date().toISOString().slice(0, 10);
                                                            setItems(it => it.map(x => x.id === r.id ? { ...x, data_attivazione: v ? today : null } : x));
                                                        }}
                                                    />
                                                    <span className={cn(r.data_attivazione ? "text-emerald-700 font-medium" : "text-slate-500")}>Attivato</span>
                                                </label>

                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        disabled={!editable(r)}
                                                        checked={!!r.iscritto}
                                                        onChange={e => {
                                                            const v = e.target.checked;
                                                            const patch: any = { iscritto: v };
                                                            if (!v) patch.tipo_abbonamento = null;
                                                            setItems(it => it.map(x => x.id === r.id ? { ...x, ...patch } : x));
                                                        }}
                                                    />
                                                    <span className={cn(r.iscritto ? "text-indigo-700 font-medium" : "text-slate-500")}>Iscritto</span>
                                                </label>
                                            </div>

                                            {/* Extra Actions */}
                                            {!isEditing && (
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    {r.cliente_telefono && (
                                                        <button
                                                            className={cn("flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                                                                r.whatsapp_sent_date ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                            )}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!r.cliente_telefono) return;
                                                                const msg = `Ciao ${r.cliente_nome || ""}, 
Ti scriviamo da Restart Fitness Club!

Qualche giorno fa ti abbiamo affidato un pass da donare a qualcuno a cui vuoi bene… un piccolo gesto che può diventare il primo passo verso più movimento, più energia, più benessere.

Crediamo davvero che muoversi cambi la vita: rende la mente più leggera, il corpo più vivo e le giornate un po’ più nostre. Per questo ci chiedevamo se, nel frattempo, hai pensato a qualcuno a cui potrebbe far bene questo invito.
Se la risposta è sì, puoi lasciarci il suo contatto, ci farebbe piacere farci una chiacchierata, capire come sta e mettere a disposizione il nostro aiuto, un passo alla volta, a ritrovare il piacere di muoversi e prendersi cura di sé.

Che ne pensi? Facci sapere, grazie di cuore!`;
                                                                const link = `https://wa.me/${r.cliente_telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
                                                                window.open(link, '_blank');
                                                            }}
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                            {r.whatsapp_sent_date ? "Inviato" : "WhatsApp"}
                                                        </button>
                                                    )}
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
                                                        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors col-span-2"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        Aggiungi in Agenda
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
                                        Nessun pass trovato
                                    </div>
                                )
                            )}
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

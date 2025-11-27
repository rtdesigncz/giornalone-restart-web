// src/app/reportistica/ReportisticaClientV2.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Download,
    Search,
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";

// --- TYPES ---
type ReportRow = {
    id: string;
    entry_date: string;
    entry_time: string | null;
    section: string;
    nome: string | null;
    cognome: string | null;
    telefono: string | null;
    // Statuses
    presentato?: boolean | null;
    venduto?: boolean | null;
    miss?: boolean | null;
    contattato?: boolean | null;
    negativo?: boolean | null;

    consulente?: { name?: string } | null;
    tipo_abbonamento?: { name?: string } | null;
};

type ReportMeta = {
    options: {
        sezioni: string[];
        consulenti: string[];
        tipi_abbonamento: string[];
    };
    kpi: {
        totale: number;
        presentati: number;
        venduti: number;
        miss: number;
    };
};

type ReportResponse = {
    rows: ReportRow[];
    meta: ReportMeta;
};

// --- COMPONENTS ---

function TriStateFilter({
    label,
    value,
    onChange,
    colorClass
}: {
    label: string;
    value: boolean | null;
    onChange: (val: boolean | null) => void;
    colorClass: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                    onClick={() => onChange(null)}
                    className={cn(
                        "flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all text-center",
                        value === null ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Tutti
                </button>
                <button
                    onClick={() => onChange(true)}
                    className={cn(
                        "flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all text-center",
                        value === true ? cn("bg-white shadow-sm", colorClass) : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Sì
                </button>
                <button
                    onClick={() => onChange(false)}
                    className={cn(
                        "flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all text-center",
                        value === false ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    No
                </button>
            </div>
        </div>
    );
}

function StatusBadge({ label, active, colorClass }: { label: string; active: boolean; colorClass: string }) {
    if (!active) return <span className="text-slate-300 text-xs">-</span>;
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
            colorClass
        )}>
            {label}
        </span>
    );
}

// --- MAIN COMPONENT ---

export default function ReportisticaClientV2() {
    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState<ReportResponse | null>(null);
    const [error, setError] = useState("");
    const [showFilters, setShowFilters] = useState(false); // Default closed to save space

    // Filters
    const [modePeriodo, setModePeriodo] = useState<"giorno" | "periodo">("giorno");
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [from, setFrom] = useState<string>(new Date().toISOString().slice(0, 10));
    const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10));

    const [selectedSezioni, setSelectedSezioni] = useState<string[]>([]);
    const [selectedConsulenti, setSelectedConsulenti] = useState<string[]>([]);
    const [selectedTipi, setSelectedTipi] = useState<string[]>([]);

    // Status Filters (Tri-state: null=Any, true=Yes, false=No)
    const [fPresentato, setFPresentato] = useState<boolean | null>(null);
    const [fVenduto, setFVenduto] = useState<boolean | null>(null);
    const [fMiss, setFMiss] = useState<boolean | null>(null);
    const [fContattato, setFContattato] = useState<boolean | null>(null);
    const [fNegativo, setFNegativo] = useState<boolean | null>(null);

    // Search
    const [searchTerm, setSearchTerm] = useState("");

    // --- DATA FETCHING ---
    const buildParams = () => {
        const p = new URLSearchParams();
        p.set("format", "json");
        if (modePeriodo === "giorno") p.set("date", date);
        else {
            p.set("from", from);
            p.set("to", to);
        }
        selectedSezioni.forEach((s) => p.append("section", s));
        selectedConsulenti.forEach((c) => p.append("consulente", c));
        selectedTipi.forEach((t) => p.append("tipo_abbonamento", t));

        if (fPresentato !== null) p.append("presentato", String(fPresentato));
        if (fVenduto !== null) p.append("venduto", String(fVenduto));
        if (fMiss !== null) p.append("miss", String(fMiss));
        if (fContattato !== null) p.append("contattato", String(fContattato));
        if (fNegativo !== null) p.append("negativo", String(fNegativo));

        return p;
    };

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            setError("");
            try {
                const p = buildParams();
                const res = await fetch(`/api/report?${p.toString()}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`Errore API (${res.status})`);
                const data: ReportResponse = await res.json();
                setResp(data);
            } catch (e: any) {
                setError(e.message || "Errore sconosciuto");
                setResp(null);
            } finally {
                setLoading(false);
            }
        };

        const t = setTimeout(fetchReport, 300); // Debounce
        return () => clearTimeout(t);
    }, [
        modePeriodo, date, from, to,
        selectedSezioni, selectedConsulenti, selectedTipi,
        fPresentato, fVenduto, fMiss, fContattato, fNegativo
    ]);

    // --- FILTERED ROWS ---
    const filteredRows = useMemo(() => {
        if (!resp?.rows) return [];
        if (!searchTerm) return resp.rows;
        const lower = searchTerm.toLowerCase();
        return resp.rows.filter(
            (r) =>
                (r.nome?.toLowerCase().includes(lower)) ||
                (r.cognome?.toLowerCase().includes(lower)) ||
                (r.consulente?.name?.toLowerCase().includes(lower))
        );
    }, [resp, searchTerm]);

    // --- KPI CALCULATION ---
    const kpis = useMemo(() => {
        const source = resp?.rows || [];

        return {
            totale: source.length,
            presentato: source.filter(r => r.presentato).length,
            venduto: source.filter(r => r.venduto).length,
            miss: source.filter(r => r.miss).length,
            contattato: source.filter(r => r.contattato).length,
            negativo: source.filter(r => r.negativo).length,
        };
    }, [resp]);

    // --- HANDLERS ---
    const toggleSelection = (current: string[], setFn: (v: string[]) => void, item: string) => {
        if (current.includes(item)) setFn(current.filter((x) => x !== item));
        else setFn([...current, item]);
    };

    const resetFilters = () => {
        setSelectedSezioni([]);
        setSelectedConsulenti([]);
        setSelectedTipi([]);
        setFPresentato(null);
        setFVenduto(null);
        setFMiss(null);
        setFContattato(null);
        setFNegativo(null);
    };

    const pdfHref = useMemo(() => {
        const p = buildParams();
        p.set("format", "pdf");
        return `/api/report?${p.toString()}`;
    }, [buildParams]);

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
            {/* HEADER */}
            <header className="flex items-center justify-between px-4 py-2 border-b bg-white z-20 shrink-0 h-14">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-lg tracking-tight text-slate-800">Reportistica</div>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>

                    {/* Date Controls */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setModePeriodo("giorno")}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    modePeriodo === "giorno" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Giorno
                            </button>
                            <button
                                onClick={() => setModePeriodo("periodo")}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    modePeriodo === "periodo" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Periodo
                            </button>
                        </div>

                        {modePeriodo === "giorno" ? (
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input w-auto py-1 h-8 text-sm bg-slate-50 border-slate-200"
                            />
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-2 py-1 h-8">
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent"
                                />
                                <span className="text-slate-400 text-xs">→</span>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                            placeholder="Cerca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                        Filtri
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <a href={pdfHref} target="_blank" rel="noreferrer" className="btn btn-primary flex items-center gap-2 px-4 py-1.5 text-sm">
                        <Download className="w-4 h-4" />
                        PDF
                    </a>
                </div>
            </header>

            {/* KPI RIBBON */}
            <div className="flex items-center gap-6 px-6 py-2 bg-slate-50 border-b text-sm overflow-x-auto shrink-0">
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-900">{kpis.totale}</span> Totale
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-emerald-600">{kpis.presentato}</span> Presentati
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-amber-600">{kpis.venduto}</span> Venduti
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-rose-600">{kpis.miss}</span> Miss
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-blue-600">{kpis.contattato}</span> Contattati
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-600">{kpis.negativo}</span> Negativi
                </div>
            </div>

            {/* FILTERS DRAWER */}
            {showFilters && (
                <div className="bg-slate-50 border-b px-6 py-4 animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[40vh]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800 text-sm">Filtri Avanzati</h3>
                        <button onClick={resetFilters} className="text-xs text-indigo-600 hover:underline font-medium">Reset Filtri</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {/* Status Columns */}
                        <div className="space-y-4 border-r border-slate-200 pr-4">
                            <TriStateFilter label="Presentato" value={fPresentato} onChange={setFPresentato} colorClass="text-emerald-600" />
                            <TriStateFilter label="Venduto" value={fVenduto} onChange={setFVenduto} colorClass="text-amber-600" />
                            <TriStateFilter label="Miss" value={fMiss} onChange={setFMiss} colorClass="text-rose-600" />
                        </div>
                        <div className="space-y-4 border-r border-slate-200 pr-4">
                            <TriStateFilter label="Contattato" value={fContattato} onChange={setFContattato} colorClass="text-blue-600" />
                            <TriStateFilter label="Negativo" value={fNegativo} onChange={setFNegativo} colorClass="text-slate-600" />
                        </div>

                        {/* Multi Selects */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sezioni</label>
                            <div className="bg-white rounded-lg border border-slate-200 p-2 max-h-40 overflow-y-auto scrollbar-thin">
                                {(resp?.meta.options.sezioni || DB_SECTIONS).map(s => (
                                    <label key={s} className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer hover:text-indigo-600">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedSezioni.includes(s)} onChange={() => toggleSelection(selectedSezioni, setSelectedSezioni, s)} />
                                        <span className="truncate">{getSectionLabel(s)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consulenti</label>
                            <div className="bg-white rounded-lg border border-slate-200 p-2 max-h-40 overflow-y-auto scrollbar-thin">
                                {resp?.meta.options.consulenti.map(c => (
                                    <label key={c} className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer hover:text-indigo-600">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedConsulenti.includes(c)} onChange={() => toggleSelection(selectedConsulenti, setSelectedConsulenti, c)} />
                                        <span className="truncate">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipi Abbonamento</label>
                            <div className="bg-white rounded-lg border border-slate-200 p-2 max-h-40 overflow-y-auto scrollbar-thin">
                                {resp?.meta.options.tipi_abbonamento.map(t => (
                                    <label key={t} className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer hover:text-indigo-600">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedTipi.includes(t)} onChange={() => toggleSelection(selectedTipi, setSelectedTipi, t)} />
                                        <span className="truncate">{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
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

                {error && (
                    <div className="p-8 text-center">
                        <div className="text-red-500 font-medium mb-2">Si è verificato un errore</div>
                        <div className="text-slate-500 text-sm">{error}</div>
                    </div>
                )}

                {!loading && !error && (
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3 whitespace-nowrap w-32 border-b border-slate-200">Data/Ora</th>
                                <th className="px-4 py-3 whitespace-nowrap w-48 border-b border-slate-200">Sezione</th>
                                <th className="px-4 py-3 whitespace-nowrap w-48 border-b border-slate-200">Cliente</th>
                                <th className="px-4 py-3 whitespace-nowrap w-32 border-b border-slate-200">Telefono</th>
                                <th className="px-4 py-3 whitespace-nowrap w-40 border-b border-slate-200">Consulente</th>
                                <th className="px-4 py-3 whitespace-nowrap w-40 border-b border-slate-200">Tipo Abb.</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center w-20 border-b border-slate-200">Pres.</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center w-20 border-b border-slate-200">Vend.</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center w-20 border-b border-slate-200">Miss</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center w-20 border-b border-slate-200">Cont.</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center w-20 border-b border-slate-200">Neg.</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="font-medium text-slate-700">{row.entry_date}</div>
                                            <div className="text-xs text-slate-400">{row.entry_time?.slice(0, 5)}</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium truncate max-w-[180px]" title={getSectionLabel(row.section)}>
                                                {getSectionLabel(row.section)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 font-medium text-slate-900">
                                            {row.nome} {row.cognome}
                                        </td>
                                        <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                                            {row.telefono}
                                        </td>
                                        <td className="px-4 py-2 text-slate-700">
                                            {row.consulente?.name || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">
                                            {row.tipo_abbonamento?.name || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <StatusBadge label="Pres" active={!!row.presentato} colorClass="bg-emerald-100 text-emerald-700 border-emerald-200" />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <StatusBadge label="Vend" active={!!row.venduto} colorClass="bg-amber-100 text-amber-700 border-amber-200" />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <StatusBadge label="Miss" active={!!row.miss} colorClass="bg-rose-100 text-rose-700 border-rose-200" />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <StatusBadge label="Cont" active={!!row.contattato} colorClass="bg-blue-100 text-blue-700 border-blue-200" />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <StatusBadge label="Neg" active={!!row.negativo} colorClass="bg-slate-100 text-slate-700 border-slate-200" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} className="opacity-20" />
                                            <p>Nessun risultato trovato con i filtri correnti</p>
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
                <span>Mostrando {filteredRows.length} risultati</span>
                <span>Totale nel periodo: {resp?.rows.length || 0}</span>
            </div>
        </div>
    );
}

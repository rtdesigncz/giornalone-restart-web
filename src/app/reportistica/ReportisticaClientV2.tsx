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
    Calendar,
    BarChart3,
    ArrowRight,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";
import { getLocalDateISO } from "@/lib/dateUtils";

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
    assente?: boolean | null;

    consulente?: { name?: string } | null;
    tipo_abbonamento?: { name?: string } | null;
    conversion?: { date: string; type: string } | null;
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
        assenti: number;
        recuperati?: number;
        contattato: number;
        negativo: number;
    };
};

type ReportResponse = {
    rows: ReportRow[];
    meta: ReportMeta;
};

// --- COMPONENTS ---

function FilterPill({
    label,
    active,
    onClick,
    colorClass
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    colorClass: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all select-none border flex items-center gap-1.5",
                active
                    ? cn("bg-white shadow-sm", colorClass)
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
            )}
        >
            {active && <Check className="w-3 h-3" />}
            {label}
        </button>
    );
}

function StatusBadge({ label, active, colorClass, icon: Icon }: { label: string; active: boolean; colorClass: string, icon?: any }) {
    if (!active) return <span className="text-slate-300 text-xs">-</span>;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm",
            colorClass
        )}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}

function StatCard({ label, value, subLabel, colorClass, icon: Icon }: { label: string, value: number, subLabel?: string, colorClass: string, icon: any }) {
    return (
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-[140px]">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", colorClass.replace("text-", "bg-").replace("700", "100").replace("600", "100"))}>
                <Icon className={cn("w-5 h-5", colorClass)} />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</div>
                {subLabel && <div className="text-[10px] text-slate-400">{subLabel}</div>}
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

export default function ReportisticaClientV2() {
    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState<ReportResponse | null>(null);
    const [error, setError] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [modePeriodo, setModePeriodo] = useState<"giorno" | "periodo">("giorno");
    const [date, setDate] = useState<string>(getLocalDateISO());
    const [from, setFrom] = useState<string>(getLocalDateISO());
    const [to, setTo] = useState<string>(getLocalDateISO());

    const [selectedSezioni, setSelectedSezioni] = useState<string[]>([]);
    const [selectedConsulenti, setSelectedConsulenti] = useState<string[]>([]);
    const [selectedTipi, setSelectedTipi] = useState<string[]>([]);

    // Status Filters (Simple Toggle for simplicity in new UI, or keep tristate logic but UI as toggle?)
    // Let's keep it simple: Click to filter ONLY that status.
    // Actually, user might want to see "Venduti" AND "Presentati".
    // So let's use the same logic as Consulenze: Toggle ON/OFF.
    const [fPresentato, setFPresentato] = useState(false);
    const [fVenduto, setFVenduto] = useState(false);
    const [fMiss, setFMiss] = useState(false);
    const [fContattato, setFContattato] = useState(false);
    const [fNegativo, setFNegativo] = useState(false);
    const [fAssente, setFAssente] = useState(false);
    const [fRecuperati, setFRecuperati] = useState(false); // New filter for recovered

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

        // API expects "true", "false" or nothing.
        // If our UI toggles are "Show Only X", we should send true.
        // If multiple are selected, we send multiple trues.
        if (fPresentato) p.append("presentato", "true");
        if (fVenduto) p.append("venduto", "true");
        if (fMiss) p.append("miss", "true");
        if (fContattato) p.append("contattato", "true");
        if (fNegativo) p.append("negativo", "true");
        if (fAssente) p.append("assente", "true");
        // Note: API doesn't filter by "recuperati" yet, we do it client side or add it to API?
        // Client side filtering for "recuperati" is easier for now as it's a derived property.

        return p;
    };

    const fetchData = async () => {
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

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [
        modePeriodo, date, from, to,
        selectedSezioni, selectedConsulenti, selectedTipi,
        fPresentato, fVenduto, fMiss, fContattato, fNegativo, fAssente
    ]);

    // --- FILTERED ROWS ---
    const filteredRows = useMemo(() => {
        if (!resp?.rows) return [];
        let r = resp.rows;

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            r = r.filter(
                (row) =>
                    (row.nome?.toLowerCase().includes(lower)) ||
                    (row.cognome?.toLowerCase().includes(lower)) ||
                    (row.consulente?.name?.toLowerCase().includes(lower))
            );
        }

        if (fRecuperati) {
            r = r.filter(row => !!row.conversion);
        }

        return r;
    }, [resp, searchTerm, fRecuperati]);

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
            assenti: source.filter(r => r.assente).length,
            recuperati: source.filter(r => r.conversion).length,
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
        setFPresentato(false);
        setFVenduto(false);
        setFMiss(false);
        setFContattato(false);
        setFNegativo(false);
        setFAssente(false);
        setFRecuperati(false);
    };

    const pdfHref = useMemo(() => {
        const p = buildParams();
        p.set("format", "pdf");
        return `/api/report?${p.toString()}`;
    }, [buildParams]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
            {/* TOP HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1800px] mx-auto px-4 py-3">
                    <div className="flex flex-col gap-4">
                        {/* Row 1: Title + Date + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-slate-900 hidden sm:block">Reportistica</h1>
                                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                {/* Date Controls */}
                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setModePeriodo("giorno")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                            modePeriodo === "giorno" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Giorno
                                    </button>
                                    <button
                                        onClick={() => setModePeriodo("periodo")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                            modePeriodo === "periodo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
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
                                        className="input py-1.5 h-9 text-sm bg-white border-slate-200 w-auto font-medium text-slate-700"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5 h-9 shadow-sm">
                                        <input
                                            type="date"
                                            value={from}
                                            onChange={(e) => setFrom(e.target.value)}
                                            className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent font-medium"
                                        />
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <input
                                            type="date"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative group flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cerca..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all relative",
                                        showFilters ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>

                                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                                <a
                                    href={pdfHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">PDF</span>
                                </a>
                            </div>
                        </div>

                        {/* Row 2: KPI Cards */}
                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                            <StatCard label="Totale" value={kpis.totale} colorClass="text-slate-600" icon={BarChart3} />
                            <StatCard label="Presentati" value={kpis.presentato} colorClass="text-emerald-600" icon={Check} />
                            <StatCard label="Venduti" value={kpis.venduto} colorClass="text-emerald-700" icon={Check} />
                            <StatCard label="Miss" value={kpis.miss} colorClass="text-orange-600" icon={AlertCircle} />
                            <StatCard label="Assenti" value={kpis.assenti} colorClass="text-yellow-600" icon={AlertCircle} />
                            <StatCard label="Recuperati" value={kpis.recuperati || 0} colorClass="text-cyan-600" icon={RefreshCw} />
                            <StatCard label="Contattati" value={kpis.contattato} colorClass="text-blue-600" icon={Check} />
                            <StatCard label="Negativi" value={kpis.negativo} colorClass="text-red-600" icon={X} />
                        </div>

                        {/* Row 3: Filters (Collapsible) */}
                        {showFilters && (
                            <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Stato:</span>
                                        <FilterPill label="Presentato" active={fPresentato} onClick={() => setFPresentato(!fPresentato)} colorClass="text-emerald-600 border-emerald-200" />
                                        <FilterPill label="Venduto" active={fVenduto} onClick={() => setFVenduto(!fVenduto)} colorClass="text-emerald-700 border-emerald-300" />
                                        <FilterPill label="Miss" active={fMiss} onClick={() => setFMiss(!fMiss)} colorClass="text-orange-600 border-orange-200" />
                                        <FilterPill label="Assente" active={fAssente} onClick={() => setFAssente(!fAssente)} colorClass="text-yellow-600 border-yellow-200" />
                                        <FilterPill label="Contattato" active={fContattato} onClick={() => setFContattato(!fContattato)} colorClass="text-blue-600 border-blue-200" />
                                        <FilterPill label="Negativo" active={fNegativo} onClick={() => setFNegativo(!fNegativo)} colorClass="text-red-600 border-red-200" />
                                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                        <FilterPill label="Recuperati" active={fRecuperati} onClick={() => setFRecuperati(!fRecuperati)} colorClass="text-cyan-600 border-cyan-200" />

                                        <div className="flex-1"></div>
                                        <button onClick={resetFilters} className="text-xs text-cyan-600 hover:underline font-medium">Reset Filtri</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sezioni</label>
                                            <div className="flex flex-wrap gap-2">
                                                {(resp?.meta.options.sezioni || DB_SECTIONS).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => toggleSelection(selectedSezioni, setSelectedSezioni, s)}
                                                        className={cn(
                                                            "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                                                            selectedSezioni.includes(s) ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {getSectionLabel(s)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consulenti</label>
                                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
                                                {resp?.meta.options.consulenti.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => toggleSelection(selectedConsulenti, setSelectedConsulenti, c)}
                                                        className={cn(
                                                            "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                                                            selectedConsulenti.includes(c) ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abbonamenti</label>
                                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
                                                {resp?.meta.options.tipi_abbonamento.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => toggleSelection(selectedTipi, setSelectedTipi, t)}
                                                        className={cn(
                                                            "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                                                            selectedTipi.includes(t) ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN TABLE AREA */}
            <div className="flex-1 overflow-auto relative bg-slate-50 p-4">
                <div className="max-w-[1800px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-sm text-slate-500 font-medium animate-pulse">Caricamento dati...</div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Si è verificato un errore</h3>
                            <p className="text-slate-500 text-sm">{error}</p>
                            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">Riprova</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4 whitespace-nowrap">Data/Ora</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Sezione</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Cliente</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Contatti</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Dettagli</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center">Esito</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center bg-cyan-50/30 text-cyan-700">Conversione</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRows.length > 0 ? (
                                        filteredRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{formatDate(row.entry_date)}</span>
                                                        <span className="text-xs text-slate-400 font-mono">{row.entry_time?.slice(0, 5)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide truncate max-w-[150px]" title={getSectionLabel(row.section)}>
                                                        {getSectionLabel(row.section)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800">{row.nome} {row.cognome}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-slate-500 font-mono text-xs">{row.telefono}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs text-slate-700 font-medium">{row.consulente?.name || "-"}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{row.tipo_abbonamento?.name || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {row.presentato && <StatusBadge label="Pres" active={true} colorClass="bg-emerald-100 text-emerald-700 border-emerald-200" />}
                                                        {row.venduto && <StatusBadge label="Vend" active={true} colorClass="bg-emerald-600 text-white border-emerald-700 shadow-sm" />}
                                                        {row.miss && <StatusBadge label="Miss" active={true} colorClass="bg-orange-100 text-orange-700 border-orange-200" />}
                                                        {row.assente && <StatusBadge label="Ass" active={true} colorClass="bg-yellow-100 text-yellow-700 border-yellow-200" />}
                                                        {row.contattato && !row.presentato && !row.venduto && !row.miss && !row.assente && !row.negativo && (
                                                            <StatusBadge label="Cont" active={true} colorClass="bg-blue-100 text-blue-700 border-blue-200" />
                                                        )}
                                                        {row.negativo && <StatusBadge label="Neg" active={true} colorClass="bg-red-100 text-red-700 border-red-200" />}

                                                        {!row.presentato && !row.venduto && !row.miss && !row.assente && !row.contattato && !row.negativo && (
                                                            <span className="text-slate-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center bg-cyan-50/10 group-hover:bg-cyan-50/20 transition-colors">
                                                    {row.conversion ? (
                                                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-100 text-cyan-700 border border-cyan-200 mb-1">
                                                                <RefreshCw className="w-3 h-3" />
                                                                Recuperato
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-medium">
                                                                il {formatDate(row.conversion.date)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200 text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                        <Search className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <h3 className="text-slate-900 font-medium">Nessun risultato trovato</h3>
                                                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Prova a modificare i filtri o il periodo selezionato per vedere i dati.</p>
                                                    <button onClick={resetFilters} className="mt-2 text-cyan-600 text-sm font-medium hover:underline">Resetta filtri</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
                        <span>Mostrando <b>{filteredRows.length}</b> risultati</span>
                        <span>Totale nel periodo: <b>{resp?.rows.length || 0}</b></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

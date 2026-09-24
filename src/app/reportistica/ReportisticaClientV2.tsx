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


function DropdownFilter({ label, options, selected, toggle, clear, formatLabel = (x: string) => x }: any) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors h-10", selected.length > 0 ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                {label} {selected.length > 0 && `(${selected.length})`}
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
                            {options.map((opt: string) => (
                                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                    <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                                    <span className="text-sm text-slate-700 truncate">{formatLabel(opt)}</span>
                                </label>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <div className="p-2 border-t border-slate-100 bg-slate-50">
                                <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-700 w-full text-center font-medium">Deseleziona tutti</button>
                            </div>
                        )}
                    </div>
                </>
            )}
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
    const [selectedEsiti, setSelectedEsiti] = useState<string[]>([]);

    // Search
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // --- DATA FETCHING ---
    const buildParams = () => {
        const p = new URLSearchParams();
        p.set("format", "json");
        if (modePeriodo === "giorno") p.set("date", date);
        else {
            p.set("from", from);
            p.set("to", to);
        }

        if (selectedSezioni.length > 0) p.append("section", selectedSezioni.join(","));
        if (selectedConsulenti.length > 0) p.append("consulente", selectedConsulenti.join(","));
        if (selectedTipi.length > 0) p.append("tipo_abbonamento", selectedTipi.join(","));

        // Esiti are fetched directly without API filters for these flags in the original code,
        // wait, the original code had:
        // if (fPresentato) p.append("presentato", "true");
        // We can just omit them to fetch all and filter client-side, 
        // OR we can pass them. It's safer to fetch all and filter client-side since that's what we do.
        // Actually the original code did:
        if (selectedEsiti.includes("Presentati")) p.append("presentato", "true");
        if (selectedEsiti.includes("Venduti")) p.append("venduto", "true");
        if (selectedEsiti.includes("Miss")) p.append("miss", "true");
        if (selectedEsiti.includes("Contattati")) p.append("contattato", "true");
        if (selectedEsiti.includes("Negativi")) p.append("negativo", "true");
        if (selectedEsiti.includes("Assenti")) p.append("assente", "true");
        
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
        selectedEsiti
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

        if (selectedEsiti.length > 0) {
            r = r.filter(row => {
                let match = false;
                if (selectedEsiti.includes("Presentati") && row.presentato) match = true;
                if (selectedEsiti.includes("Venduti") && row.venduto) match = true;
                if (selectedEsiti.includes("Miss") && row.miss) match = true;
                if (selectedEsiti.includes("Assenti") && row.assente) match = true;
                if (selectedEsiti.includes("Contattati") && row.contattato) match = true;
                if (selectedEsiti.includes("Negativi") && row.negativo) match = true;
                return match;
            });
        }

        return r;
    }, [resp, searchTerm, selectedEsiti]);

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
        setSelectedEsiti([]);
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


    const sortedRows = useMemo(() => {
        let sortableItems = [...filteredRows];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof typeof a];
                let bValue: any = b[sortConfig.key as keyof typeof b];

                if (sortConfig.key === 'consulente') {
                    aValue = a.consulente?.name || "";
                    bValue = b.consulente?.name || "";
                }
                if (sortConfig.key === 'tipo_abbonamento') {
                    aValue = a.tipo_abbonamento?.name || "";
                    bValue = b.tipo_abbonamento?.name || "";
                }
                if (sortConfig.key === 'entry_date') {
                    aValue = new Date(`${a.entry_date}T${a.entry_time || '00:00'}`).getTime();
                    bValue = new Date(`${b.entry_date}T${b.entry_time || '00:00'}`).getTime();
                }
                if (sortConfig.key === 'nome') {
                    aValue = `${a.cognome || ''} ${a.nome || ''}`;
                    bValue = `${b.cognome || ''} ${b.nome || ''}`;
                }

                if (aValue === null || aValue === undefined) aValue = "";
                if (bValue === null || bValue === undefined) bValue = "";
                
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredRows, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
            {/* TOP HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1800px] mx-auto px-4 py-3">
                    <div className="flex flex-col gap-4">
                        {/* Row 1: Title + Date + PDF */}
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

                            <div className="flex items-center gap-2">
                                <a
                                    href={pdfHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 h-10 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Scarica PDF</span>
                                </a>
                            </div>
                        </div>

                        {/* Row 2: Filters */}
                        <div className="flex flex-wrap items-center gap-2 w-full">
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cerca cliente..."
                                    className="w-full pl-9 pr-8 py-2 h-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <DropdownFilter 
                                label="Sezioni" 
                                options={resp?.meta.options.sezioni || DB_SECTIONS} 
                                selected={selectedSezioni} 
                                toggle={(v: string) => toggleSelection(selectedSezioni, setSelectedSezioni, v)} 
                                clear={() => setSelectedSezioni([])} 
                                formatLabel={getSectionLabel}
                            />
                            <DropdownFilter 
                                label="Consulenti" 
                                options={resp?.meta.options.consulenti || []} 
                                selected={selectedConsulenti} 
                                toggle={(v: string) => toggleSelection(selectedConsulenti, setSelectedConsulenti, v)} 
                                clear={() => setSelectedConsulenti([])} 
                            />
                            <DropdownFilter 
                                label="Abbonamenti" 
                                options={resp?.meta.options.tipi_abbonamento || []} 
                                selected={selectedTipi} 
                                toggle={(v: string) => toggleSelection(selectedTipi, setSelectedTipi, v)} 
                                clear={() => setSelectedTipi([])} 
                            />
                            <DropdownFilter 
                                label="Esito" 
                                options={["Presentati", "Venduti", "Miss", "Assenti", "Contattati", "Negativi"]} 
                                selected={selectedEsiti} 
                                toggle={(v: string) => toggleSelection(selectedEsiti, setSelectedEsiti, v)} 
                                clear={() => setSelectedEsiti([])} 
                            />

                            {(searchTerm || selectedSezioni.length > 0 || selectedConsulenti.length > 0 || selectedTipi.length > 0 || selectedEsiti.length > 0) && (
                                <button onClick={resetFilters} className="hidden sm:flex items-center gap-2 px-3 py-2 h-10 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors">
                                    <Filter className="w-4 h-4" /> Reset
                                </button>
                            )}
                        </div>

                        {/* Row 3: KPI Cards (Clickable) */}
                        <div className="flex flex-wrap items-center gap-4 pb-4">
                            {/* Totale */}
                            <div onClick={resetFilters} className={cn("bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all cursor-pointer group shadow-sm hover:shadow-md w-[140px] shrink-0", (selectedEsiti.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.totale}</p>
                            </div>
                            
                            {/* Presentati */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Presentati"); }} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Presentati") ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.presentato}</p>
                            </div>

                            {/* Venduti */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Venduti"); }} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Venduti") ? "ring-2 ring-emerald-600 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-600" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.venduto}</p>
                            </div>

                            {/* Miss */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Miss"); }} className={cn("bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Miss") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Miss</h3><div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.miss}</p>
                            </div>

                            {/* Assenti */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Assenti"); }} className={cn("bg-white border border-yellow-100 rounded-xl p-5 hover:border-yellow-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Assenti") ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><div className="w-7 h-7 rounded-lg bg-yellow-50 border border-yellow-100 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.assenti}</p>
                            </div>

                            {/* Recuperati */}
                            <div className={cn("bg-cyan-50/50 border border-cyan-100 rounded-xl p-5 transition-all group shadow-sm relative overflow-hidden w-[140px] shrink-0")}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl"></div>
                                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-bold text-cyan-700 uppercase tracking-wide">Recuperati</h3><div className="w-7 h-7 rounded-lg bg-cyan-100/50 border border-cyan-200 flex items-center justify-center"><RefreshCw className="w-3.5 h-3.5 text-cyan-600" /></div></div>
                                <p className="text-3xl font-black text-cyan-900 tracking-tight">{kpis.recuperati || 0}</p>
                            </div>

                            {/* Contattati */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Contattati"); }} className={cn("bg-white border border-blue-100 rounded-xl p-5 hover:border-blue-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Contattati") ? "ring-2 ring-blue-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wide group-hover:text-blue-700">Contattati</h3><div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-blue-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.contattato}</p>
                            </div>

                            {/* Negativi */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Negativi"); }} className={cn("bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Negativi") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Negativi</h3><div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-600" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.negativo}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN TABLE AREA */}
            <div className="flex-1 overflow-auto relative bg-slate-50 p-4">
                <div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                                <thead className="bg-white border-b border-slate-200">
                                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('entry_date')}>
                                            Data / Ora {sortConfig?.key === 'entry_date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('section')}>
                                            Sezione {sortConfig?.key === 'section' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('nome')}>
                                            Cliente {sortConfig?.key === 'nome' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('telefono')}>
                                            Contatti {sortConfig?.key === 'telefono' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('consulente')}>
                                            Dettagli {sortConfig?.key === 'consulente' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center">Esito</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center bg-cyan-50/30 text-cyan-700">Conversione</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRows.length > 0 ? (
                                        sortedRows.map((row) => (
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
                                                    <div className="font-bold text-slate-800">{row.cognome} {row.nome}</div>
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
                                                    {row.isRecuperato ? (
                                                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-100 text-cyan-700 border border-cyan-200" title="Questo venduto deriva da un contatto precedente">
                                                                <RefreshCw className="w-3 h-3" />
                                                                RECUPERATO
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

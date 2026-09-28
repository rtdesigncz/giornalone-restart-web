"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Calendar, Users, BarChart3, Settings, Plus, Ticket, Home, ArrowRight, Activity, Phone, MapPin, Clock, Tag, User
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
    id: string;
    label: string;
    subtitle?: string;
    icon: any;
    action: () => void;
    group: string;
    tags?: { label: string, icon?: any }[];
    phone?: string;
    colorTheme?: string;
};


        
    const getThemeClasses = (type: string, isSelected: boolean) => {
        if (type === 'agenda') return isSelected ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-emerald-600/20" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-300 border-emerald-200 shadow-sm";
        if (type === 'consulenze') return isSelected ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 border-blue-600/20" : "bg-blue-50 text-blue-950 hover:bg-blue-100 hover:border-blue-300 border-blue-200 shadow-sm";
        if (type === 'medical' || type === 'waiting') return isSelected ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 border-purple-600/20" : "bg-purple-50 text-purple-950 hover:bg-purple-100 hover:border-purple-300 border-purple-200 shadow-sm";
        return isSelected ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-cyan-600/20" : "bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-200 border-slate-100 shadow-sm";
    };
    const getIconBoxClasses = (type: string, isSelected: boolean) => {
        if (isSelected) return "bg-white/20 text-white";
        if (type === 'agenda') return "bg-emerald-100 text-emerald-600";
        if (type === 'consulenze') return "bg-blue-100 text-blue-600";
        if (type === 'medical' || type === 'waiting') return "bg-purple-100 text-purple-600";
        return "bg-slate-100 text-slate-500";
    };
    const getBadgeClasses = (type: string, isSelected: boolean) => {
        if (isSelected) return "bg-white/20 text-white";
        if (type === 'agenda') return "bg-emerald-200/60 text-emerald-800";
        if (type === 'consulenze') return "bg-blue-200/60 text-blue-800";
        if (type === 'medical' || type === 'waiting') return "bg-purple-200/60 text-purple-800";
        return "bg-slate-100 text-slate-500";
    };
export default function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dbResults, setDbResults] = useState<CommandItem[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);

        return () => document.removeEventListener("keydown", down);
    }, []);

    

    useEffect(() => {
        if (!query || query.length < 2) {
            setDbResults([]);
            return;
        }

        const timer = setTimeout(() => {
            startTransition(async () => {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    
                    if (data.results) {
                        const mapped: CommandItem[] = data.results.map((r: any) => {
                            let icon = Users;
                            let action = () => {};
                            let tags: { label: string, icon?: any }[] = [];
                            
                            if (r.type === 'agenda') {
                                icon = Calendar;
                                action = () => router.push(`/agenda?section=${encodeURIComponent(r.raw.section)}&date=${r.raw.entry_date}&highlight=${r.id}`);
                                
                                const dateStr = r.raw.entry_date ? new Date(r.raw.entry_date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                tags.push({ label: r.raw.section, icon: Tag });
                                if (dateStr) tags.push({ label: dateStr, icon: Clock });
                                if (r.raw.consulenti?.name) tags.push({ label: r.raw.consulenti.name, icon: User });

                            } else if (r.type === 'consulenze') {
                                icon = Users;
                                action = () => router.push(`/consulenze?gestione=${r.raw.gestione_id}&highlight=${r.id}`);
                                
                                const listName = r.raw.gestioni?.nome || "Lista";
                                tags.push({ label: `Consulenze: ${listName}`, icon: MapPin });

                            } else if (r.type === 'medical') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?session=${r.raw.session_id}&highlight=${r.id}`);
                                
                                const sessionDate = r.raw.medical_sessions?.date ? new Date(r.raw.medical_sessions.date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                tags.push({ label: "Visita Medica", icon: Activity });
                                if (sessionDate) tags.push({ label: sessionDate, icon: Clock });

                            } else if (r.type === 'waiting') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?tab=waiting&highlight=${r.id}`);
                                tags.push({ label: "Lista d'Attesa", icon: Activity });
                            }

                            return {
                                id: `${r.type}-${r.id}`,
                                label: r.title,
                                phone: r.phone,
                                icon,
                                group: "Risultati Ricerca",
                                colorTheme: r.type,
                                action,
                                tags
                            };
                        });
                        setDbResults(mapped);
                    }
                } catch (e) {
                    console.error("Search failed", e);
                }
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [query, router]);

    const displayCommands = dbResults;

    useEffect(() => {
        setSelectedIndex(0);
    }, [query, dbResults]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => (i + 1) % displayCommands.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => (i - 1 + displayCommands.length) % displayCommands.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (displayCommands[selectedIndex]) {
                    displayCommands[selectedIndex].action();
                    setOpen(false);
                }
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, displayCommands, selectedIndex]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
            
            <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-scale flex flex-col max-h-[70vh]">
                <div className="flex items-center px-5 py-4 border-b border-slate-200/60">
                    <Search className={cn("w-6 h-6 mr-4 transition-colors", isPending ? "text-cyan-500 animate-pulse" : "text-slate-400")} />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-xl font-medium h-10"
                        placeholder="Cerca clienti o naviga..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 ml-3">ESC</div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50">
                    {query.trim() === "" ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Cerca nel Giornalone...</p>
                            <p className="text-slate-400 text-sm mt-1">Digita nome, cognome o numero di telefono</p>
                        </div>
                    ) : displayCommands.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {displayCommands.map((command, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={command.id}
                                        onClick={() => { command.action(); setOpen(false); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all border border-transparent",
                                            getThemeClasses(command.colorTheme || "", isSelected)
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", getIconBoxClasses(command.colorTheme || "", isSelected))}>
                                            <command.icon size={20} />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <span className={cn("font-bold text-base", isSelected ? "text-white" : "")}>{command.label}</span>
                                            {/* TAGS UI */}
                                            {(command.tags || command.phone) && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    {command.phone && (
                                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", getBadgeClasses(command.colorTheme || "", isSelected))}>
                                                            <Phone size={10} /> {command.phone}
                                                        </span>
                                                    )}
                                                    {command.tags?.map((t, i) => (
                                                        <span key={i} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", getBadgeClasses(command.colorTheme || "", isSelected))}>
                                                            {t.icon && <t.icon size={10} />} {t.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <ArrowRight size={20} className="opacity-80" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 bg-slate-100/80 border-t border-slate-200/60 text-xs font-medium text-slate-500 flex justify-between items-center">
                    <span>Spotlight Search <span className="text-slate-400 ml-1">v2.0</span></span>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-600">↵</span> Apri</span>
                        <span className="flex items-center gap-1.5"><span className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-600">↑↓</span> Muovi</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

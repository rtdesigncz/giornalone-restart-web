"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Calendar, Users, BarChart3, Settings, Plus, Ticket, Home, ArrowRight, Activity, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
    id: string;
    label: string;
    subtitle?: string;
    icon: any;
    action: () => void;
    group: string;
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

    const navCommands: CommandItem[] = [
        { id: "nav-home", label: "Vai alla Dashboard", icon: Home, group: "Navigazione", action: () => router.push("/") },
        { id: "nav-agenda", label: "Vai all'Agenda", icon: Calendar, group: "Navigazione", action: () => router.push("/agenda") },
        { id: "nav-consulenze", label: "Vai a Consulenze", icon: Users, group: "Navigazione", action: () => router.push("/consulenze") },
        { id: "nav-medical", label: "Vai a Visite Mediche", icon: Activity, group: "Navigazione", action: () => router.push("/visite-mediche") },
        { id: "nav-pass", label: "Vai a Consegna Pass", icon: Ticket, group: "Navigazione", action: () => router.push("/consegna-pass") },
        { id: "nav-report", label: "Vai a Reportistica", icon: BarChart3, group: "Navigazione", action: () => router.push("/reportistica") },
        { id: "nav-settings", label: "Impostazioni", icon: Settings, group: "Navigazione", action: () => router.push("/settings") },
    ];

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
                            
                            if (r.type === 'agenda') {
                                icon = Calendar;
                                action = () => router.push(`/agenda?section=${encodeURIComponent(r.raw.section)}&date=${r.raw.entry_date}&highlight=${r.id}`);
                            } else if (r.type === 'consulenze') {
                                icon = Users;
                                action = () => router.push(`/consulenze?gestione=${r.raw.gestione_id}&highlight=${r.id}`);
                            } else if (r.type === 'medical') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?session=${r.raw.session_id}&highlight=${r.id}`);
                            } else if (r.type === 'waiting') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?tab=waiting&highlight=${r.id}`);
                            }

                            return {
                                id: `${r.type}-${r.id}`,
                                label: r.title,
                                subtitle: `${r.subtitle}${r.phone ? ` • ${r.phone}` : ''}`,
                                icon,
                                group: "Risultati Ricerca",
                                action
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

    const displayCommands = query.length < 2 
        ? navCommands 
        : dbResults;

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
                    {displayCommands.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "{query}"</p>
                            <p className="text-slate-400 text-sm mt-1">Prova a cercare per nome, cognome o telefono.</p>
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
                                            isSelected
                                                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-cyan-600/20"
                                                : "bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-200 border-slate-100 shadow-sm"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", isSelected ? "bg-white/20" : "bg-slate-100")}>
                                            <command.icon size={20} className={cn(isSelected ? "text-white" : "text-slate-500")} />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <span className={cn("font-bold text-base", isSelected ? "text-white" : "text-slate-800")}>{command.label}</span>
                                            {command.subtitle && (
                                                <span className={cn("text-xs font-medium mt-0.5", isSelected ? "text-cyan-100" : "text-slate-400")}>
                                                    {command.subtitle}
                                                </span>
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

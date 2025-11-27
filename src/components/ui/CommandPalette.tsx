"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Calendar,
    Users,
    BarChart3,
    Settings,
    Plus,
    Ticket,
    Home,
    Command,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
    id: string;
    label: string;
    icon: any;
    action: () => void;
    group: string;
    shortcut?: string;
};

export default function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Toggle with Cmd+K
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

    const commands: CommandItem[] = [
        // Navigation
        { id: "nav-home", label: "Vai alla Dashboard", icon: Home, group: "Navigazione", action: () => router.push("/") },
        { id: "nav-agenda", label: "Vai all'Agenda", icon: Calendar, group: "Navigazione", action: () => router.push("/agenda") },
        { id: "nav-consulenze", label: "Vai a Consulenze", icon: Users, group: "Navigazione", action: () => router.push("/consulenze") },
        { id: "nav-pass", label: "Vai a Consegna Pass", icon: Ticket, group: "Navigazione", action: () => router.push("/consegna-pass") },
        { id: "nav-report", label: "Vai a Reportistica", icon: BarChart3, group: "Navigazione", action: () => router.push("/reportistica") },
        { id: "nav-settings", label: "Impostazioni", icon: Settings, group: "Navigazione", action: () => router.push("/settings") },

        // Actions
        { id: "act-new", label: "Nuovo Inserimento", icon: Plus, group: "Azioni", action: () => { /* TODO: Trigger Drawer */ alert("Funzione rapida in arrivo!"); } },
        { id: "act-ai", label: "Chiedi all'AI", icon: Command, group: "Azioni", action: () => window.dispatchEvent(new Event("open-ai-agent")) },
    ];

    const filteredCommands = commands.filter((command) =>
        command.label.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => (i + 1) % filteredCommands.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    setOpen(false);
                }
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, filteredCommands, selectedIndex]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-scale flex flex-col max-h-[60vh]">
                {/* Search Input */}
                <div className="flex items-center px-4 py-3 border-b border-slate-200/60">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-lg font-medium h-8"
                        placeholder="Cerca comandi..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        ESC
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredCommands.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">
                            Nessun risultato trovato.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCommands.map((command, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={command.id}
                                        onClick={() => {
                                            command.action();
                                            setOpen(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                                            isSelected
                                                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                                                : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        <command.icon size={18} className={cn(isSelected ? "text-white" : "text-slate-400")} />
                                        <span className="flex-1 font-medium">{command.label}</span>
                                        {isSelected && <ArrowRight size={16} className="opacity-80" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                    <span>Pro Tip: Usa le frecce per navigare</span>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1"><span className="font-bold">↵</span> Seleziona</span>
                        <span className="flex items-center gap-1"><span className="font-bold">↑↓</span> Naviga</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

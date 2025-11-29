"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";
import { ChevronUp, X, Check, Plus } from "lucide-react";

interface AgendaMobileBarProps {
    activeSection: string;
    onSelect: (section: string) => void;
    onNewClick: () => void;
}

export default function AgendaMobileBar({ activeSection, onSelect, onNewClick }: AgendaMobileBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <>
            {/* Bottom Bar (Fixed to Viewport) */}
            <div className="fixed bottom-16 left-0 right-0 z-[90] bg-[#21b5ba] border-t border-[#1a9296] shadow-[0_-4px_6px_-1px_rgba(33,181,186,0.2)] md:hidden flex items-center justify-between px-4 py-2 h-[72px]">
                {/* Section Selector Trigger */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-start justify-center flex-1 min-w-0 active:opacity-70 transition-opacity"
                >
                    <div className="flex items-center gap-1.5 text-white/80 mb-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Sezione</span>
                        <ChevronUp size={12} />
                    </div>
                    <p className="text-sm font-bold text-white truncate w-full text-left">
                        {getSectionLabel(activeSection)}
                    </p>
                </button>

                {/* New Entry Button */}
                <button
                    onClick={onNewClick}
                    className="btn bg-white text-[#21b5ba] shadow-lg shadow-black/10 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform ml-4 hover:bg-slate-50"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Drawer Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer Panel */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[101] bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden max-h-[80vh] flex flex-col",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Seleziona Sezione</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 pb-8">
                    {DB_SECTIONS.map((section) => {
                        const isActive = activeSection === section;
                        return (
                            <button
                                key={section}
                                onClick={() => {
                                    onSelect(section);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between mb-1",
                                    isActive
                                        ? "bg-brand/10 text-brand font-bold"
                                        : "text-slate-600 hover:bg-slate-50 font-medium"
                                )}
                            >
                                {getSectionLabel(section)}
                                {isActive && <Check size={18} className="text-brand" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>,
        document.body
    );
}

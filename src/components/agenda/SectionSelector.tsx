"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";
import { ChevronUp, X, Check } from "lucide-react";

interface SectionSelectorProps {
    activeSection: string;
    onSelect: (section: string) => void;
}

export default function SectionSelector({ activeSection, onSelect }: SectionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {/* Bottom Bar Trigger */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Sezione Attiva</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{getSectionLabel(activeSection)}</p>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-brand text-white shadow-lg shadow-brand/20 px-4 py-2 h-auto text-sm flex items-center gap-2"
                >
                    Cambia
                    <ChevronUp size={16} />
                </button>
            </div>

            {/* Drawer Portal */}
            {createPortal(
                <>
                    {/* Backdrop */}
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
            )}
        </>
    );
}

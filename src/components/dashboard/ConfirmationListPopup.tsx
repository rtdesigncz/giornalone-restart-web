"use client";

import { createPortal } from "react-dom";
import { X, MessageCircle, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSectionLabel } from "@/lib/sections";
import { cleanPhone } from "@/lib/whatsapp";

interface ConfirmationListPopupProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    onConfirm: (entry: any) => void;
}

export default function ConfirmationListPopup({ isOpen, onClose, entries, onConfirm }: ConfirmationListPopupProps) {
    if (!isOpen) return null;

    const total = entries.length;
    const sent = entries.filter(e => e.whatsapp_sent).length;
    const pending = total - sent;
    const progress = total > 0 ? (sent / total) * 100 : 0;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn(
                "bg-white w-full max-w-2xl flex flex-col shadow-2xl",
                "rounded-t-2xl md:rounded-2xl", // Round top only on mobile, all on desktop
                "max-h-[85vh] md:max-h-[80vh]", // Slightly taller on mobile
                "animate-in slide-in-from-bottom-full duration-300",
                "m-0 md:m-4" // No margin on mobile (full width)
            )}>
                {/* Mobile Drag Handle */}
                <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg transition-colors", pending === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                {pending === 0 ? <Check size={20} /> : <MessageCircle size={20} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {pending === 0 ? "Conferme Inviate" : "Conferme da Inviare"}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {sent} messaggi su {total} inviati
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden md:block"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Check size={24} className="text-emerald-600" />
                            </div>
                            <p>Tutte le conferme inviate! 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry, i) => {
                                const tel = cleanPhone(entry.telefono);
                                const hasPhone = !!tel;

                                return (
                                    <div
                                        key={entry.id}
                                        className="group flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all animate-in-up"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            {/* Time Badge */}
                                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-0.5">
                                                    ORA
                                                </span>
                                                <span className="text-lg font-bold text-slate-700 leading-none">
                                                    {entry.entry_time ? entry.entry_time.slice(0, 5) : "--:--"}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-slate-900 truncate text-lg md:text-base">
                                                        {entry.nome} {entry.cognome}
                                                    </h4>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                                                        {getSectionLabel(entry.section)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(entry.entry_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 ml-auto">
                                            {entry.whatsapp_sent ? (
                                                <div className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-100 flex items-center justify-center gap-2">
                                                    <Check size={18} className="md:w-[16px] md:h-[16px]" />
                                                    Conferma Inviata
                                                </div>
                                            ) : hasPhone ? (
                                                <button
                                                    onClick={() => onConfirm(entry)}
                                                    className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
                                                >
                                                    <MessageCircle size={18} className="md:w-[16px] md:h-[16px]" />
                                                    Invia Conferma
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-slate-100 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                                                >
                                                    <MessageCircle size={18} className="md:w-[16px] md:h-[16px]" />
                                                    No Telefono
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end flex-shrink-0 bg-slate-50 md:bg-white pb-8 md:pb-4">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost w-full md:w-auto"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

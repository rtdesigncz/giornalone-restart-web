"use client";

import { createPortal } from "react-dom";
import { X, MessageCircle, Calendar, Phone, Clock, Users as UsersIcon, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSectionLabel } from "@/lib/sections";
import { cleanPhone } from "@/lib/whatsapp";

interface AbsentListPopupProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    onWhatsApp: (entry: any) => void;
    onReschedule: (entry: any) => void;
    onNegative: (entry: any) => void;
}

export default function AbsentListPopup({ isOpen, onClose, entries, onWhatsApp, onReschedule, onNegative }: AbsentListPopupProps) {
    if (!isOpen) return null;

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
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                            <UsersIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Assenti da Gestire</h2>
                            <p className="text-sm text-slate-500">{entries.length} {entries.length === 1 ? "persona assente" : "persone assenti"}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden md:block"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <UsersIcon size={24} className="text-emerald-600" />
                            </div>
                            <p>Tutti riprogrammati! 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry, i) => {
                                const tel = cleanPhone(entry.telefono);
                                const hasPhone = !!tel;

                                return (
                                    <div
                                        key={entry.id}
                                        className="group flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/50 transition-all animate-in-up"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            {/* Time Badge */}
                                            <div className="w-14 h-14 rounded-xl bg-yellow-100 border border-yellow-200 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase text-yellow-600 leading-none mb-0.5">
                                                    {new Date(entry.entry_date).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}
                                                </span>
                                                <span className="text-lg font-bold text-yellow-700 leading-none">
                                                    {new Date(entry.entry_date).getDate()}
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
                                                    {entry.consulente_name && (
                                                        <span className="flex items-center gap-1">
                                                            <UsersIcon size={14} />
                                                            {entry.consulente_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-3 gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 md:flex md:items-center">
                                            {hasPhone && (
                                                <button
                                                    onClick={() => onWhatsApp(entry)}
                                                    className="col-span-1 md:col-auto p-3 md:p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-500 hover:text-white transition-all hover:shadow-md hover:shadow-green-200 flex justify-center items-center"
                                                    title="Invia WhatsApp"
                                                >
                                                    <MessageCircle size={20} className="md:w-[18px] md:h-[18px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onNegative(entry)}
                                                className="col-span-1 md:col-auto p-3 md:p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all hover:shadow-md hover:shadow-red-200 flex justify-center items-center"
                                                title="Negativo"
                                            >
                                                <ThumbsDown size={20} className="md:w-[18px] md:h-[18px]" />
                                            </button>
                                            <button
                                                onClick={() => onReschedule(entry)}
                                                className="col-span-1 md:col-auto px-4 py-3 md:py-2 rounded-xl bg-yellow-500 text-white font-medium text-sm hover:bg-yellow-600 transition-all hover:shadow-lg hover:shadow-yellow-200 flex items-center justify-center gap-2"
                                                title="Riprogramma"
                                            >
                                                <Calendar size={18} className="md:w-[16px] md:h-[16px]" />
                                                <span className="hidden md:inline">Riprogramma</span>
                                                <span className="md:hidden">Ripr.</span>
                                            </button>
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

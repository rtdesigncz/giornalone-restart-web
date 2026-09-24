import { X, Euro, Check, Ghost, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any;
}

const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

interface SalePopupProps extends PopupProps {
    subscriptionTypes: string[];
    onConfirm: (type: string) => void;
}

export function SalePopup({ isOpen, onClose, entry, subscriptionTypes, onConfirm }: SalePopupProps) {
    if (!isOpen) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-md p-6 border border-slate-200/80 animate-in zoom-in-95 duration-200 font-sans">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <Euro size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Registra Vendita</h3>
                                <p className="text-xs text-slate-500 font-medium">Seleziona l'abbonamento acquistato</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                    </div>

                    <p className="text-slate-700 mb-4 text-xs font-semibold">Cliente: <span className="font-extrabold text-slate-900">{entry?.nome} {entry?.cognome}</span></p>

                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {subscriptionTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => onConfirm(type)}
                                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/80 text-left font-bold text-slate-800 transition-all text-xs flex items-center justify-between group shadow-sm active:scale-[0.98]"
                            >
                                <span>{type}</span>
                                <Check size={16} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Portal>
    );
}

interface ReschedulePopupProps extends PopupProps {
    onConfirm: (reschedule: boolean, wasPresent: boolean) => void;
}

export function ReschedulePopup({ isOpen, onClose, entry, onConfirm }: ReschedulePopupProps) {
    if (!isOpen) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-md p-6 border border-slate-200/80 animate-in zoom-in-95 duration-200 font-sans">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                <Calendar size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Esito Appuntamento</h3>
                                <p className="text-xs text-slate-500 font-medium">Aggiorna lo stato di presenza</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                    </div>

                    <p className="text-slate-700 mb-5 text-xs font-semibold">
                        Il cliente <span className="font-extrabold text-slate-900">{entry?.nome} {entry?.cognome}</span> si è presentato all'appuntamento?
                    </p>

                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={() => onConfirm(true, true)}
                            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold hover:bg-emerald-100/80 transition-all text-xs flex items-center justify-between shadow-sm active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-2">
                                <Check size={18} className="text-emerald-600" />
                                Sì, era Presente (Ci deve pensare)
                            </span>
                        </button>
                        <button
                            onClick={() => onConfirm(true, false)}
                            className="w-full py-3.5 px-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/80 font-bold hover:bg-amber-100/80 transition-all text-xs flex items-center justify-between shadow-sm active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-2">
                                <Ghost size={18} className="text-amber-600" />
                                No, non era Presente (Riprogramma)
                            </span>
                        </button>
                        <button
                            onClick={() => onConfirm(false, false)}
                            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                        >
                            Annulla (Nessuna modifica)
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

interface VerifyPopupProps extends PopupProps {
    onConfirm: () => void;
}

export function VerifyPopup({ isOpen, onClose, entry, onConfirm }: VerifyPopupProps) {
    if (!isOpen) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-md p-6 border border-slate-200/80 animate-in zoom-in-95 duration-200 font-sans">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20">
                                <Check size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Conferma Presentato</h3>
                                <p className="text-xs text-slate-500 font-medium">Segna come completato</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                    </div>

                    <p className="text-slate-700 mb-6 text-xs font-semibold leading-relaxed">
                        Confermi che <span className="font-extrabold text-slate-900">{entry?.nome} {entry?.cognome}</span> si è presentato?
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-outline flex-1 text-xs py-2.5"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn btn-brand flex-1 text-xs py-2.5 shadow-md"
                        >
                            Conferma Presentato
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

interface AbsentPopupProps extends PopupProps {
    onConfirm: () => void;
}

export function AbsentPopup({ isOpen, onClose, entry, onConfirm }: AbsentPopupProps) {
    if (!isOpen) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-md p-6 border border-slate-200/80 animate-in zoom-in-95 duration-200 font-sans">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <Ghost size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Segna come Assente</h3>
                                <p className="text-xs text-slate-500 font-medium">Registra assenza cliente</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                    </div>

                    <p className="text-slate-700 mb-6 text-xs font-semibold leading-relaxed">
                        Confermi che <span className="font-extrabold text-slate-900">{entry?.nome} {entry?.cognome}</span> è assente?
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-outline flex-1 text-xs py-2.5"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn bg-amber-500 hover:bg-amber-600 text-white flex-1 text-xs py-2.5 shadow-md shadow-amber-500/20 border-transparent"
                        >
                            Conferma Assente
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

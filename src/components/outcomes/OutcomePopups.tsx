import { X, Euro, CalendarX, Check, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any;
}

// Helper to handle Portal
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Registra Vendita 💰</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>
                    <p className="text-slate-600 mb-4 text-sm">Che abbonamento ha acquistato <strong>{entry?.nome}</strong>?</p>
                    <div className="grid grid-cols-1 gap-2">
                        {subscriptionTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => onConfirm(type)}
                                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left font-medium text-slate-700 transition-all text-sm"
                            >
                                {type}
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Miss con Appuntamento 📅</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>
                    <p className="text-slate-600 mb-6 text-sm">Il cliente <strong>{entry?.nome}</strong> si è presentato all'appuntamento?</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onConfirm(true, true)}
                            className="w-full py-3 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-200 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Sì, era Presente (Ci deve pensare)
                        </button>
                        <button
                            onClick={() => onConfirm(true, false)}
                            className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold hover:bg-slate-200 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <Ghost size={16} />
                            No, non era Presente (Riprogramma)
                        </button>
                        <button
                            onClick={() => onConfirm(false, false)}
                            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                        >
                            Annulla (Nessuna azione)
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Conferma Presentato ✅</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>
                    <p className="text-slate-600 mb-6 text-sm">
                        Confermi che <strong>{entry?.nome}</strong> si è presentato?
                        <br />
                        <span className="text-xs text-slate-400 mt-1 block">L'appuntamento verrà segnato come completato.</span>
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all text-sm"
                        >
                            Conferma
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Segna come Assente 👻</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>
                    <p className="text-slate-600 mb-6 text-sm">
                        Confermi che <strong>{entry?.nome}</strong> è assente?
                        <br />
                        <span className="text-xs text-slate-400 mt-1 block">Non verrà riprogrammato al momento.</span>
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 rounded-xl bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-200 transition-all text-sm"
                        >
                            Conferma Assente
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

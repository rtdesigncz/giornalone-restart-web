import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserCog, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PassEditPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        referral_nome: string;
        referral_cognome: string;
        referral_telefono: string;
        iscritto: boolean;
        tipo_abbonamento: string | null;
    }) => void;
    onDelete: () => void;
    initialData: {
        referral_nome: string;
        referral_cognome: string;
        referral_telefono: string;
        iscritto: boolean;
        tipo_abbonamento: string | null;
    } | null;
    subscriptionTypes: string[];
}

export default function PassEditPopup({ isOpen, onClose, onConfirm, onDelete, initialData, subscriptionTypes }: PassEditPopupProps) {
    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [telefono, setTelefono] = useState("");
    const [iscritto, setIscritto] = useState(false);
    const [tipoAbbonamento, setTipoAbbonamento] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && initialData) {
            setNome(initialData.referral_nome || "");
            setCognome(initialData.referral_cognome || "");
            setTelefono(initialData.referral_telefono || "");
            setIscritto(initialData.iscritto || false);
            setTipoAbbonamento(initialData.tipo_abbonamento || "");
        }
    }, [isOpen, initialData]);

    if (!mounted) return null;
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            referral_nome: nome,
            referral_cognome: cognome,
            referral_telefono: telefono,
            iscritto,
            tipo_abbonamento: iscritto ? tipoAbbonamento : null
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <UserCog size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Modifica Referral
                            </h2>
                            <p className="text-sm text-slate-500">
                                Gestisci i dati e l'iscrizione
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dati Anagrafici */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Dati Anagrafici</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cognome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    value={cognome}
                                    onChange={e => setCognome(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefono</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Iscrizione */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Stato Iscrizione</h3>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <input
                                type="checkbox"
                                id="iscritto"
                                checked={iscritto}
                                onChange={e => setIscritto(e.target.checked)}
                                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <label htmlFor="iscritto" className="text-sm font-medium text-slate-700 cursor-pointer select-none flex-1">
                                Referral Iscritto
                            </label>
                        </div>

                        {iscritto && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo Abbonamento</label>
                                <select
                                    required={iscritto}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white"
                                    value={tipoAbbonamento}
                                    onChange={e => setTipoAbbonamento(e.target.value)}
                                >
                                    <option value="">Seleziona abbonamento...</option>
                                    {subscriptionTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                onDelete();
                                onClose();
                            }}
                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            Elimina
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                            >
                                Salva Modifiche
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

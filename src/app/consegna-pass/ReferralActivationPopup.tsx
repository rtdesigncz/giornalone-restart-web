import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralActivationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { nome: string; cognome: string; telefono: string; cliente_provenienza?: string; source_type?: string }) => void;
    clientName?: string;
    isManual?: boolean;
}

export default function ReferralActivationPopup({ isOpen, onClose, onConfirm, clientName, isManual = false }: ReferralActivationPopupProps) {
    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [telefono, setTelefono] = useState("");
    const [clienteProvenienza, setClienteProvenienza] = useState("");
    const [sourceType, setSourceType] = useState<'pass' | 'social' | 'whatsapp'>('pass');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setNome("");
            setCognome("");
            setTelefono("");
            setClienteProvenienza("");
            setSourceType('pass');
        }
    }, [isOpen]);

    if (!mounted) return null;
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || !cognome || !telefono) return;

        onConfirm({
            nome,
            cognome,
            telefono,
            cliente_provenienza: isManual && sourceType === 'pass' ? clienteProvenienza : undefined,
            source_type: isManual ? (sourceType === 'pass' ? 'manual_pass' : sourceType) : 'pass'
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {isManual ? "Nuovo Referral" : "Attiva Pass"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isManual ? "Inserisci i dati del nuovo referral" : `Inserisci i dati del Referral di ${clientName}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isManual && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fonte Referral</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSourceType('pass')}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                                            sourceType === 'pass' ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        Pass Cartaceo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceType('social')}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                                            sourceType === 'social' ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        Social
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceType('whatsapp')}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                                            sourceType === 'whatsapp' ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        WhatsApp
                                    </button>
                                </div>
                            </div>

                            {sourceType === 'pass' && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente Provenienza (Chi ha dato il pass?)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                        placeholder="Es. Mario Rossi (Opzionale)"
                                        value={clienteProvenienza}
                                        onChange={e => setClienteProvenienza(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome Referral</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                placeholder="Mario"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cognome Referral</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                placeholder="Rossi"
                                value={cognome}
                                onChange={e => setCognome(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefono Referral</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                            placeholder="333 1234567"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={!nome || !cognome || !telefono}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            {isManual ? "Crea Referral" : "Conferma Attivazione"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserCog, Trash2, Euro, MessageSquareText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    PassStrategy,
    PassItemMeta,
    ProposalStatus,
    parsePassItemMeta,
    serializePassItemMeta,
} from "@/lib/passUtils";

interface PassEditPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        referral_nome: string;
        referral_cognome: string;
        referral_telefono: string;
        iscritto: boolean;
        tipo_abbonamento: string | null;
        note: string | null;
    }) => void;
    onDelete: () => void;
    initialData: {
        referral_nome: string;
        referral_cognome: string;
        referral_telefono: string;
        iscritto: boolean;
        tipo_abbonamento: string | null;
        note?: string | null;
    } | null;
    subscriptionTypes: string[];
    strategy?: PassStrategy;
}

export default function PassEditPopup({
    isOpen,
    onClose,
    onConfirm,
    onDelete,
    initialData,
    subscriptionTypes,
    strategy,
}: PassEditPopupProps) {
    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [telefono, setTelefono] = useState("");
    const [iscritto, setIscritto] = useState(false);
    const [tipoAbbonamento, setTipoAbbonamento] = useState<string>("");
    const [paid, setPaid] = useState(false);
    const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("pending");
    const [proposalDate, setProposalDate] = useState<string>("");
    const [declineReason, setDeclineReason] = useState<string>("");
    const [freeNote, setFreeNote] = useState<string>("");
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

            const meta = parsePassItemMeta(initialData.note);
            setPaid(meta.paid);
            if (initialData.iscritto) {
                setProposalStatus("accepted");
            } else if (meta.proposal_status) {
                setProposalStatus(meta.proposal_status);
            } else {
                setProposalStatus("pending");
            }
            setProposalDate(meta.proposal_date || new Date().toISOString().slice(0, 10));
            setDeclineReason(meta.decline_reason || "");
            setFreeNote(meta.text || "");
        }
    }, [isOpen, initialData]);

    if (!mounted || !isOpen) return null;

    const handleProposalSelect = (status: ProposalStatus) => {
        setProposalStatus(status);
        if (status === "accepted") {
            setIscritto(true);
        } else {
            setIscritto(false);
        }
        if ((status === "made" || status === "declined") && !proposalDate) {
            setProposalDate(new Date().toISOString().slice(0, 10));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const prevMeta = parsePassItemMeta(initialData?.note);

        const nextMeta: PassItemMeta = {
            paid: strategy?.strategy_type === "paid" ? paid : prevMeta.paid,
            paid_amount:
                strategy?.strategy_type === "paid" && paid
                    ? prevMeta.paid_amount ?? strategy.price
                    : undefined,
            paid_date:
                strategy?.strategy_type === "paid" && paid
                    ? prevMeta.paid_date || new Date().toISOString().slice(0, 10)
                    : null,
            proposal_status: iscritto ? "accepted" : proposalStatus,
            proposal_date:
                proposalStatus === "made" || proposalStatus === "declined" || iscritto
                    ? proposalDate || new Date().toISOString().slice(0, 10)
                    : null,
            decline_reason: !iscritto && proposalStatus === "declined" ? declineReason.trim() || null : null,
            text: freeNote.trim() || null,
        };

        onConfirm({
            referral_nome: nome,
            referral_cognome: cognome,
            referral_telefono: telefono,
            iscritto,
            tipo_abbonamento: iscritto ? tipoAbbonamento : null,
            note: serializePassItemMeta(nextMeta),
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <UserCog size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Gestisci Prospect & Proposta
                            </h2>
                            <p className="text-xs text-slate-500">
                                Anagrafica, stato proposta commerciale, quota e iscrizione
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Dati Anagrafici */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dati Anagrafici</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Cognome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={cognome}
                                    onChange={(e) => setCognome(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Telefono</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Pagamento quota prova (se strategia paid) */}
                    {strategy?.strategy_type === "paid" && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                            <input
                                type="checkbox"
                                id="edit-pass-paid"
                                checked={paid}
                                onChange={(e) => setPaid(e.target.checked)}
                                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                            />
                            <label htmlFor="edit-pass-paid" className="text-sm font-bold text-amber-900 cursor-pointer select-none flex-1 flex items-center gap-1.5">
                                <Euro size={15} className="text-amber-600" />
                                Quota prove pagata (€{strategy.price})
                            </label>
                        </div>
                    )}

                    {/* Proposta & Iscrizione */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={13} className="text-purple-500" />
                            Proposta Commerciale & Chiusura
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleProposalSelect("pending")}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                                    proposalStatus === "pending" && !iscritto
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                ⏳ Da Proporre / In Corso
                            </button>

                            <button
                                type="button"
                                onClick={() => handleProposalSelect("made")}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                                    proposalStatus === "made" && !iscritto
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-indigo-50/60 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                )}
                            >
                                💬 Proposta Fatta
                            </button>

                            <button
                                type="button"
                                onClick={() => handleProposalSelect("accepted")}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                                    iscritto
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                )}
                            >
                                ✅ Iscritto (Venduto)
                            </button>

                            <button
                                type="button"
                                onClick={() => handleProposalSelect("declined")}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                                    proposalStatus === "declined" && !iscritto
                                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                        : "bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100"
                                )}
                            >
                                ❌ Non Interessato
                            </button>
                        </div>

                        {iscritto && (
                            <div className="space-y-1.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 animate-in fade-in duration-150">
                                <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                    Tipo Abbonamento Sottoscritto
                                </label>
                                <select
                                    required={iscritto}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-semibold"
                                    value={tipoAbbonamento}
                                    onChange={(e) => setTipoAbbonamento(e.target.value)}
                                >
                                    <option value="">Seleziona abbonamento...</option>
                                    {subscriptionTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {!iscritto && proposalStatus === "made" && (
                            <div className="space-y-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200 animate-in fade-in duration-150">
                                <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                                    Data in cui è stata fatta la proposta
                                </label>
                                <input
                                    type="date"
                                    value={proposalDate}
                                    onChange={(e) => setProposalDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 bg-white"
                                />
                            </div>
                        )}

                        {!iscritto && proposalStatus === "declined" && (
                            <div className="space-y-1.5 bg-rose-50/50 p-3 rounded-xl border border-rose-200 animate-in fade-in duration-150">
                                <label className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                                    Motivo rinuncia (opzionale)
                                </label>
                                <select
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-rose-200 bg-white"
                                >
                                    <option value="">Seleziona o lascia vuoto...</option>
                                    <option value="Prezzo / Budget">Prezzo / Budget</option>
                                    <option value="Orari / Tempo">Orari / Mancanza tempo</option>
                                    <option value="Indeciso / Ci pensa">Indeciso / Ci pensa</option>
                                    <option value="Distanza / Trasferimento">Distanza / Trasferimento</option>
                                    <option value="Altra palestra">Scelta altra palestra</option>
                                    <option value="Motivi personali/salute">Motivi personali / salute</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquareText size={13} />
                            Note Operative
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Es: Interessato ad annuale con pagamento rateale, richiamare venerdì..."
                            value={freeNote}
                            onChange={(e) => setFreeNote(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                onDelete();
                                onClose();
                            }}
                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
                        >
                            <Trash2 size={16} />
                            Elimina
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors text-sm"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 text-sm"
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

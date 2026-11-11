"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Settings2, Euro, Gift, CalendarClock, Check, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PassStrategy, DEFAULT_PASS_STRATEGY } from "@/lib/passUtils";

interface PassStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { nome: string; strategy: PassStrategy }) => Promise<void> | void;
    initialName?: string;
    initialStrategy?: PassStrategy;
    isNew?: boolean;
}

export default function PassStrategyModal({
    isOpen,
    onClose,
    onConfirm,
    initialName = "",
    initialStrategy = DEFAULT_PASS_STRATEGY,
    isNew = false,
}: PassStrategyModalProps) {
    const [nome, setNome] = useState(initialName);
    const [strategyType, setStrategyType] = useState<"free" | "paid">(initialStrategy.strategy_type);
    const [price, setPrice] = useState<string>(String(initialStrategy.price || 19));
    const [trialsCount, setTrialsCount] = useState<number>(initialStrategy.trials_count);
    const [proposalAfterDays, setProposalAfterDays] = useState<string>(String(initialStrategy.proposal_after_days ?? 2));
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setNome(initialName);
            setStrategyType(initialStrategy.strategy_type);
            setPrice(String(initialStrategy.price > 0 ? initialStrategy.price : 19));
            setTrialsCount(typeof initialStrategy.trials_count === "number" ? initialStrategy.trials_count : 3);
            setProposalAfterDays(String(initialStrategy.proposal_after_days ?? 2));
        }
    }, [isOpen, initialName, initialStrategy]);

    if (!mounted || !isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setSaving(true);
        try {
            await onConfirm({
                nome: nome.trim(),
                strategy: {
                    strategy_type: strategyType,
                    price: strategyType === "paid" ? Math.max(0, Number(price) || 0) : 0,
                    trials_count: Math.max(0, Math.floor(Number(trialsCount) || 0)),
                    proposal_after_days: Math.max(0, Number(proposalAfterDays) || 0),
                },
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                            <Settings2 size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {isNew ? "Nuova Campagna / Gestione Pass" : "Strategia Campagna Pass"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                Definisci il formato delle prove e i tempi di proposta commerciale
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Nome Gestione / Campagna
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Es. Promo Natale 2026, Pass Autunno..."
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>

                    {/* Tipo di Strategia (Gratuito vs A Pagamento) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Formula delle Prove per i Referral
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setStrategyType("free")}
                                className={cn(
                                    "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all",
                                    strategyType === "free"
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Gift size={16} className={strategyType === "free" ? "text-emerald-600" : "text-slate-400"} />
                                    Prove Gratuite
                                </div>
                                <span className="text-[11px] opacity-80">
                                    Il pass dà accesso gratuito alle prove previste
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStrategyType("paid")}
                                className={cn(
                                    "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all",
                                    strategyType === "paid"
                                        ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Euro size={16} className={strategyType === "paid" ? "text-amber-600" : "text-slate-400"} />
                                    Prove a Pagamento
                                </div>
                                <span className="text-[11px] opacity-80">
                                    Il prospect paga una quota promo per attivare il pass
                                </span>
                            </button>
                        </div>
                    </div>

                    {strategyType === "paid" && (
                        <div className="space-y-1.5 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-1 duration-150">
                            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                Quota Attivazione / Pacchetto Prove (€)
                            </label>
                            <div className="relative">
                                <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-300 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>
                    )}

                    {/* Numero Prove (Nessun limite!) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Prove Previste di Default
                            </label>
                            <span className="text-[11px] text-slate-400">
                                Puoi sempre aggiungerne altre oltre al limite
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setTrialsCount(num)}
                                    className={cn(
                                        "px-3.5 py-2 rounded-lg text-sm font-bold border transition-all",
                                        trialsCount === num
                                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => setTrialsCount(0)}
                                className={cn(
                                    "px-3.5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-1.5",
                                    trialsCount === 0
                                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <InfinityIcon size={15} />
                                <span>Libere</span>
                            </button>

                            <div className="flex items-center gap-1.5 ml-auto">
                                <span className="text-xs font-semibold text-slate-500">Altro:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={trialsCount}
                                    onChange={(e) => setTrialsCount(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Finestra Proposta */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <CalendarClock size={13} />
                            Alert Proposta entro (giorni dalla 1ª prova)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                max="30"
                                value={proposalAfterDays}
                                onChange={(e) => setProposalAfterDays(e.target.value)}
                                className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                            <p className="text-xs text-slate-400">
                                Se il prospect ha fatto la 1ª prova da almeno {proposalAfterDays || 0} giorni senza chiusura, si accende il radar urgente.
                            </p>
                        </div>
                    </div>

                    <div className="pt-3 flex gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !nome.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Check size={17} />
                            {saving ? "Salvataggio..." : isNew ? "Crea Campagna" : "Salva Strategia"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

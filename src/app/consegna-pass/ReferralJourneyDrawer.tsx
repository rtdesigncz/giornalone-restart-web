import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle2, Clock, ArrowRight, UserCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { cleanPhone } from "@/lib/whatsapp";

interface ReferralJourneyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    referral: any; // Using any for now, will define type properly
    onUpdate: (id: string, updates: any) => Promise<void>;
    onSchedule: (referral: any, date: string, time: string, step: number) => Promise<void>;
    abbOptions: string[];
}

export default function ReferralJourneyDrawer({ isOpen, onClose, referral, onUpdate, onSchedule, abbOptions }: ReferralJourneyDrawerProps) {
    const [loading, setLoading] = useState(false);

    // Local state for form inputs to avoid direct mutation/lag
    const [appDate, setAppDate] = useState("");
    const [appTime, setAppTime] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAppDate("");
            setAppTime("");
        }
    }, [isOpen, referral]);

    if (!isOpen || !referral) return null;

    // Determine current step based on appointments
    const getStep = () => {
        if (!referral.data_app_1) return 1;
        if (!referral.data_app_2 && referral.esito_app_1 === 'show') return 2;
        if (!referral.data_app_3 && referral.esito_app_2 === 'show') return 3;
        if (referral.esito_app_3 === 'show') return 4; // Completed
        return 1; // Default or stuck
    };

    const currentStep = getStep();

    const handleSchedule = async (step: number) => {
        if (!appDate || !appTime) return;
        setLoading(true);
        try {
            await onSchedule(referral, appDate, appTime, step);
            setAppDate("");
            setAppTime("");
        } catch (error) {
            console.error("Error scheduling", error);
            alert("Errore durante la prenotazione");
        } finally {
            setLoading(false);
        }
    };

    const handleOutcome = async (step: number, outcome: 'show' | 'no_show') => {
        setLoading(true);
        try {
            const updates: any = {};
            updates[`esito_app_${step}`] = outcome;
            await onUpdate(referral.id, updates);
        } catch (error) {
            console.error("Error updating outcome", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscription = async (iscritto: boolean, tipo: string | null) => {
        setLoading(true);
        try {
            await onUpdate(referral.id, { iscritto, tipo_abbonamento: tipo });
        } catch (error) {
            console.error("Error updating subscription", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = (step: number) => {
        const dataKey = `data_app_${step}`;
        const esitoKey = `esito_app_${step}`;
        const date = referral[dataKey];
        const esito = referral[esitoKey];

        const isLocked = step > 1 && (!referral[`esito_app_${step - 1}`] || referral[`esito_app_${step - 1}`] !== 'show');
        const isDone = !!esito && esito !== 'pending';
        const isScheduled = !!date;

        return (
            <div className={cn("relative pl-8 pb-8 border-l-2 last:border-0",
                isDone ? "border-emerald-200" : isLocked ? "border-slate-100" : "border-purple-200"
            )}>
                {/* Dot */}
                <div className={cn("absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white",
                    isDone ? "border-emerald-500 bg-emerald-500" :
                        isLocked ? "border-slate-200" :
                            "border-purple-500"
                )} />

                <div className={cn("space-y-3", isLocked && "opacity-50 pointer-events-none")}>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {step}° Incontro
                        {isDone && <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Completato</span>}
                    </h3>

                    {!isScheduled && !isDone && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <p className="text-sm text-slate-500">Programma il {step}° appuntamento con il referral.</p>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="input-sm flex-1"
                                    value={appDate}
                                    onChange={e => setAppDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className="input-sm w-24"
                                    value={appTime}
                                    onChange={e => setAppTime(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => handleSchedule(step)}
                                disabled={!appDate || !appTime || loading}
                                className="btn btn-brand w-full justify-center"
                            >
                                <Calendar size={16} />
                                Prenota in Agenda
                            </button>
                        </div>
                    )}

                    {isScheduled && !isDone && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm space-y-3">
                            <div className="flex items-center gap-3 text-purple-900">
                                <Calendar size={20} className="text-purple-500" />
                                <div>
                                    <div className="font-bold">{formatDate(date)}</div>
                                    <div className="text-xs opacity-70">In programma</div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => handleOutcome(step, 'show')}
                                    className="flex-1 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors"
                                >
                                    Presentato
                                </button>
                                <button
                                    onClick={() => handleOutcome(step, 'no_show')}
                                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                                >
                                    Non Presentato
                                </button>
                            </div>
                        </div>
                    )}

                    {isDone && (
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Appuntamento avvenuto il {formatDate(date)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[201] animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{referral.referral_nome} {referral.referral_cognome}</h2>
                            <p className="text-slate-500 text-sm">Referral di <span className="font-medium text-slate-700">{referral.cliente_nome} {referral.cliente_cognome}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {referral.referral_telefono && (
                            <a
                                href={`https://wa.me/${cleanPhone(referral.referral_telefono)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>
                        )}
                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-600 text-sm flex items-center justify-center">
                            {referral.referral_telefono || "No Tel"}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Il Percorso</h3>
                        {renderStep(1)}
                        {renderStep(2)}
                        {renderStep(3)}
                    </div>

                    {/* Final Outcome */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserCheck size={20} className="text-purple-600" />
                            Esito Finale
                        </h3>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-purple-300 transition-colors mb-4">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                checked={!!referral.iscritto}
                                onChange={e => handleSubscription(e.target.checked, referral.tipo_abbonamento)}
                            />
                            <span className="font-medium text-slate-700">Il Referral si è iscritto?</span>
                        </label>

                        {referral.iscritto && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipo Abbonamento</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={referral.tipo_abbonamento || ""}
                                    onChange={e => handleSubscription(true, e.target.value)}
                                >
                                    <option value="">Seleziona...</option>
                                    {abbOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

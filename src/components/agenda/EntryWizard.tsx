"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import OutcomeButtons from "../outcomes/OutcomeButtons";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel, DB_SECTIONS } from "@/lib/sections";

interface EntryWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: any;
}

export default function EntryWizard({ isOpen, onClose, onSave, initialData }: EntryWizardProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [consulenti, setConsulenti] = useState<any[]>([]);
    const [tipi, setTipi] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            // If initialData has an ID (editing), keep the section.
            // If it's new (no ID or id='new'), force section selection by clearing it.
            const isEditing = initialData && initialData.id && initialData.id !== 'new';

            setFormData(initialData || {
                section: "",
                entry_date: new Date().toISOString().split('T')[0],
                entry_time: "",
                nome: "",
                cognome: "",
                telefono: "",
                consulente_id: "",
                tipo_abbonamento_id: "",
                fonte: "",
                note: "",
                miss: false,
                venduto: false,
                presentato: false,
                negativo: false,
                assente: false,
                comeback: false,
                contattato: false,
            });

            if (!isEditing && (!initialData || initialData.id === 'new')) {
                setFormData((prev: any) => ({ ...prev, section: "" }));
            }
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        // Update entry_time default if section changes to "TOUR SPONTANEI"
        if (formData.section === "TOUR SPONTANEI" && !formData.entry_time) {
            setFormData((prev: any) => ({
                ...prev,
                entry_time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
            }));
        }
    }, [formData.section, formData.entry_time]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resConsulenti, resTipi] = await Promise.all([
                    fetch("/api/settings/consulente/list"),
                    fetch("/api/settings/tipo/list")
                ]);
                const c = await resConsulenti.json();
                const t = await resTipi.json();
                setConsulenti(c.items || []);
                setTipi(t.items || []);
            } catch (error) {
                console.error("Error fetching dropdowns:", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSectionSelect = (s: string) => {
        handleChange("section", s);
        // Auto-advance to next step for better UX
        setTimeout(() => setStep(2), 150);
    };

    const handleSave = async (withOutcome = true) => {
        setLoading(true);
        try {
            const payload = { ...formData };
            delete payload.consulente;
            delete payload.tipo_abbonamento;
            delete payload.id;

            if (!payload.consulente_id) payload.consulente_id = null;
            if (!payload.tipo_abbonamento_id) payload.tipo_abbonamento_id = null;
            if (!payload.entry_time) payload.entry_time = null;
            else if (payload.entry_time.length === 5) payload.entry_time += ":00";

            // If "Save without outcome", ensure all outcomes are false
            if (!withOutcome) {
                payload.miss = false;
                payload.venduto = false;
                payload.presentato = false;
                payload.negativo = false;
                payload.assente = false;
            }

            const { error } = await supabase.from("entries").insert(payload);
            if (error) throw error;

            onSave();
            onClose();
        } catch (e: any) {
            alert("Errore salvataggio: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isTelefonici = formData.section === "APPUNTAMENTI TELEFONICI";
    const totalSteps = 5;

    return createPortal(
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 leading-none">Nuovo Inserimento</h2>
                        <span className="text-xs text-slate-500 font-medium">Step {step} di {totalSteps}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 w-6 rounded-full transition-colors",
                                i + 1 <= step ? "bg-brand" : "bg-slate-200"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
                        <h3 className="text-2xl font-bold text-slate-800">Dove inserire?</h3>
                        <div className="space-y-4">
                            <label className="label">Sezione</label>
                            <div className="grid grid-cols-1 gap-2">
                                {DB_SECTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleSectionSelect(s)}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all active:scale-[0.98]",
                                            formData.section === s
                                                ? "bg-brand/10 border-brand text-brand shadow-sm ring-1 ring-brand"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="font-bold text-sm block">{getSectionLabel(s)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20 w-full max-w-full overflow-hidden">
                        <h3 className="text-2xl font-bold text-slate-800">Quando?</h3>
                        <div className="space-y-4 w-full max-w-full">
                            <div className="w-full min-w-0">
                                <label className="label block mb-2">Data</label>
                                <input
                                    type="date"
                                    className="input w-full max-w-full h-12 text-base box-border block appearance-none min-w-0"
                                    value={formData.entry_date || ""}
                                    onChange={(e) => handleChange("entry_date", e.target.value)}
                                />
                            </div>
                            <div className="w-full min-w-0">
                                <label className="label block mb-2">Ora</label>
                                <input
                                    type="time"
                                    className="input w-full max-w-full h-12 text-base box-border block appearance-none min-w-0"
                                    value={formData.entry_time?.slice(0, 5) || ""}
                                    onChange={(e) => handleChange("entry_time", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
                        <h3 className="text-2xl font-bold text-slate-800">Chi?</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nome</label>
                                <input
                                    className="input w-full h-12 text-lg box-border"
                                    placeholder="Nome"
                                    value={formData.nome || ""}
                                    onChange={(e) => handleChange("nome", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Cognome</label>
                                <input
                                    className="input w-full h-12 text-lg box-border"
                                    placeholder="Cognome"
                                    value={formData.cognome || ""}
                                    onChange={(e) => handleChange("cognome", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Telefono</label>
                                <input
                                    className="input w-full h-12 text-lg box-border"
                                    placeholder="Telefono"
                                    type="tel"
                                    value={formData.telefono || ""}
                                    onChange={(e) => handleChange("telefono", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
                        <h3 className="text-2xl font-bold text-slate-800">Dettagli</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Consulente</label>
                                <select
                                    className="input w-full h-12 text-lg box-border"
                                    value={formData.consulente_id || ""}
                                    onChange={(e) => handleChange("consulente_id", e.target.value)}
                                >
                                    <option value="">-- Seleziona --</option>
                                    {consulenti.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {!isTelefonici && (
                                <>
                                    <div>
                                        <label className="label">Fonte</label>
                                        <input
                                            className="input w-full h-12 text-lg box-border"
                                            value={formData.fonte || ""}
                                            onChange={(e) => handleChange("fonte", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Tipo Abbonamento</label>
                                        <select
                                            className="input w-full h-12 text-lg box-border"
                                            value={formData.tipo_abbonamento_id || ""}
                                            onChange={(e) => handleChange("tipo_abbonamento_id", e.target.value)}
                                        >
                                            <option value="">-- Seleziona --</option>
                                            {tipi.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
                        <h3 className="text-2xl font-bold text-slate-800">Esito & Note</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Note</label>
                                <textarea
                                    className="input w-full h-32 text-lg resize-none p-3 box-border"
                                    placeholder="Note opzionali..."
                                    value={formData.note || ""}
                                    onChange={(e) => handleChange("note", e.target.value)}
                                />
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <label className="label mb-3">Seleziona Esito (Opzionale)</label>
                                <OutcomeButtons
                                    entry={formData}
                                    onOutcomeClick={(type) => {
                                        setFormData((prev: any) => {
                                            const updates = { ...prev };
                                            // Reset others
                                            updates.venduto = false;
                                            updates.negativo = false;
                                            updates.miss = false;
                                            updates.assente = false;
                                            updates.presentato = false;

                                            // Toggle current if needed, or just set true. 
                                            // For Wizard, let's assume selection sets it to true.
                                            updates[type] = true;

                                            if (type === 'venduto') updates.presentato = true;

                                            return updates;
                                        });
                                    }}
                                    layout="grid"
                                    size="lg"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
                {step > 1 ? (
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="btn btn-ghost h-12 px-4"
                    >
                        <ChevronLeft className="mr-2" size={20} />
                        Indietro
                    </button>
                ) : (
                    <div /> // Spacer
                )}

                {step < totalSteps ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        className="btn btn-brand h-12 px-6 shadow-lg shadow-brand/20"
                        disabled={step === 1 && !formData.section} // Disable "Avanti" if section not selected
                    >
                        Avanti
                        <ChevronRight className="ml-2" size={20} />
                    </button>
                ) : (
                    <div className="flex gap-2 w-full justify-end">
                        <button
                            onClick={() => handleSave(true)}
                            disabled={loading}
                            className="btn btn-brand h-12 px-6 shadow-lg shadow-brand/20 flex-1 md:flex-none justify-center"
                        >
                            {loading ? <span className="animate-spin">...</span> : <Check className="mr-2" size={20} />}
                            Salva
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .label {
                    @apply block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5;
                }
            `}</style>
        </div>,
        document.body
    );
}

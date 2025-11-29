"use client";

import { X, Save, Trash2, Copy, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel, DB_SECTIONS } from "@/lib/sections";

import OutcomeButtons from "../outcomes/OutcomeButtons";

// Types (simplified for now, ideally shared)
type AnyObj = Record<string, any>;
type Entry = AnyObj & { id: string };

interface EntryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Entry | null; // If null, it's a new entry
    section: string;
    date: string; // Default date for new entries
    onSave: () => void;
    onDelete: (id: string) => void;
    isDuplicate?: boolean;
    allowSectionChange?: boolean;
}

export default function EntryDrawer({
    isOpen,
    onClose,
    entry,
    section,
    date,
    onSave,
    onDelete,
    isDuplicate = false,
    allowSectionChange = false,
}: EntryDrawerProps) {
    const [formData, setFormData] = useState<AnyObj>({});
    const [loading, setLoading] = useState(false);
    const [consulenti, setConsulenti] = useState<AnyObj[]>([]);
    const [tipi, setTipi] = useState<AnyObj[]>([]);
    const [targetSection, setTargetSection] = useState(section);

    const isNew = !entry || isDuplicate || entry.id === "new";
    // Use targetSection if we are duplicating OR if we allowed section change (which means we might be in a different section than the prop)
    // Actually, if allowSectionChange is true, we are creating a new entry in targetSection.
    const effectiveSection = (isDuplicate || allowSectionChange) ? targetSection : section;
    const isTelefonici = effectiveSection === "APPUNTAMENTI TELEFONICI";

    // Load dropdowns from API to bypass RLS
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resConsulenti, resTipi] = await Promise.all([
                    fetch("/api/settings/consulente/list"),
                    fetch("/api/settings/tipo/list")
                ]);

                const c = await resConsulenti.json();
                const t = await resTipi.json();

                setConsulenti(Array.isArray(c.items) ? c.items : []);
                setTipi(Array.isArray(t.items) ? t.items : []);
            } catch (error) {
                console.error("Error fetching dropdowns:", error);
            }
        };
        fetchData();
    }, []);

    // Reset form when entry changes
    useEffect(() => {
        if (isOpen) {
            setTargetSection(section);
            if (entry) {
                setFormData({ ...entry });
            } else {
                setFormData({
                    section,
                    entry_date: date,
                    entry_time: section === "TOUR SPONTANEI"
                        ? new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
                        : "",
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
            }
        }
    }, [isOpen, entry, section, date, isDuplicate]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);

        const effectiveSection = (isDuplicate || allowSectionChange) ? targetSection : section;

        // Validation: Time mandatory for everything except TOUR SPONTANEI
        if (effectiveSection !== "TOUR SPONTANEI" && !formData.entry_time) {
            alert("L'orario è obbligatorio per questa sezione.");
            setLoading(false);
            return;
        }

        try {
            // Prepare payload (sanitize empty strings to null for IDs if needed)
            const payload = { ...formData };
            // Remove joined objects that cause errors on insert/update
            delete payload.consulente;
            delete payload.tipo_abbonamento;
            delete payload.id; // Always remove ID from payload (it's either auto-generated for insert or used in .eq() for update)

            if (isDuplicate || allowSectionChange) {
                payload.section = effectiveSection;
            }

            if (!payload.consulente_id) payload.consulente_id = null;
            if (!payload.tipo_abbonamento_id) payload.tipo_abbonamento_id = null;
            if (!payload.entry_time) {
                payload.entry_time = null;
            } else if (payload.entry_time.length === 5) {
                payload.entry_time += ":00";
            }

            if (isNew) {
                const { error } = await supabase.from("entries").insert(payload);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("entries").update(payload).eq("id", entry.id);
                if (error) throw error;
            }
            onSave();
            onClose();
        } catch (e: any) {
            alert("Errore salvataggio: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Use a portal to break out of any parent transforms (like animate-in-up)
    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[101] w-full md:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full invisible"
                )}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {isDuplicate ? "Duplica Scheda" : isNew ? (entry?.id === "new" ? "Aggiungi in agenda" : "Nuovo Inserimento") : "Modifica Scheda"}
                        </h2>
                        {isDuplicate || allowSectionChange ? (
                            <div className="mt-1 flex items-center gap-2">
                                <label className="text-xs text-slate-500 font-semibold uppercase">
                                    {isDuplicate ? "Destinazione:" : "Sezione:"}
                                </label>
                                <select
                                    className="text-sm font-bold text-brand bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                                    value={targetSection}
                                    onChange={e => setTargetSection(e.target.value)}
                                >
                                    {DB_SECTIONS.map(s => <option key={s} value={s}>{getSectionLabel(s)}</option>)}
                                </select>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                                {getSectionLabel(section)}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body (Compact) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Time & Date & Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Data <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className={cn("input w-full py-1.5", !formData.entry_date && "border-red-500 focus:border-red-500 bg-red-50")}
                                value={formData.entry_date || ""}
                                onChange={(e) => handleChange("entry_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Ora <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                className={cn("input w-full py-1.5", !formData.entry_time && "border-red-500 focus:border-red-500 bg-red-50")}
                                value={formData.entry_time?.slice(0, 5) || ""}
                                onChange={(e) => handleChange("entry_time", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="label">Nome</label>
                                <input
                                    className="input w-full py-1.5"
                                    placeholder="Mario"
                                    value={formData.nome || ""}
                                    onChange={(e) => handleChange("nome", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Cognome</label>
                                <input
                                    className="input w-full py-1.5"
                                    placeholder="Rossi"
                                    value={formData.cognome || ""}
                                    onChange={(e) => handleChange("cognome", e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Telefono</label>
                            <input
                                className="input w-full py-1.5"
                                placeholder="+39..."
                                value={formData.telefono || ""}
                                onChange={(e) => handleChange("telefono", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Consulente</label>
                            <select
                                className="input w-full py-1.5"
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
                            <div>
                                <label className="label">Fonte</label>
                                <input
                                    className="input w-full py-1.5"
                                    value={formData.fonte || ""}
                                    onChange={(e) => handleChange("fonte", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {!isTelefonici && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="label">Tipo Abbonamento</label>
                                <select
                                    className="input w-full py-1.5"
                                    value={formData.tipo_abbonamento_id || ""}
                                    onChange={(e) => handleChange("tipo_abbonamento_id", e.target.value)}
                                >
                                    <option value="">-- Seleziona --</option>
                                    {tipi.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand"
                                        checked={!!formData.comeback}
                                        onChange={(e) => handleChange("comeback", e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-700">Comeback</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="label">Note</label>
                        <textarea
                            className="input w-full min-h-[60px] resize-none py-1.5"
                            placeholder="Scrivi qui..."
                            value={formData.note || ""}
                            onChange={(e) => handleChange("note", e.target.value)}
                        />
                    </div>

                    {/* Status Toggles */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Esito</h3>
                        {isTelefonici ? (
                            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                                    checked={!!formData.contattato}
                                    onChange={(e) => handleChange("contattato", e.target.checked)}
                                />
                                <span className="font-medium text-slate-700">Contattato</span>
                            </label>
                        ) : (
                            <OutcomeButtons
                                entry={formData}
                                onOutcomeClick={(type) => {
                                    setFormData(prev => {
                                        const updates: AnyObj = { ...prev };
                                        const currentVal = prev[type];
                                        if (currentVal) {
                                            updates[type] = false;
                                        } else {
                                            updates[type] = true;
                                            if (type === 'venduto') { updates.negativo = false; updates.miss = false; updates.assente = false; updates.presentato = true; }
                                            if (type === 'negativo') { updates.venduto = false; }
                                            if (type === 'miss') { updates.venduto = false; updates.negativo = false; updates.presentato = false; updates.assente = false; }
                                            if (type === 'assente') { updates.venduto = false; updates.negativo = false; updates.presentato = false; updates.miss = false; }
                                            if (type === 'presentato') { updates.miss = false; updates.assente = false; }
                                        }
                                        return updates;
                                    });
                                }}
                                layout="grid"
                                size="sm"
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                    {!isNew && (
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="btn bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                        <button onClick={onClose} className="btn btn-ghost">
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-brand text-white hover:bg-brand-ink shadow-lg shadow-brand/20 border-transparent min-w-[120px]"
                        >
                            {loading ? "Salvataggio..." : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Salva
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .label {
          @apply block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5;
        }
      `}</style>
        </>,
        document.body
    );
}

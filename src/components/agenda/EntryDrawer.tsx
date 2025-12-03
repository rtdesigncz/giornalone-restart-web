"use client";

import { X, Save, Trash2, Copy, MessageCircle, Phone, ChevronDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel, DB_SECTIONS } from "@/lib/sections";

import OutcomeButtons from "../outcomes/OutcomeButtons";
import EntryWizard from "./EntryWizard";

// Types (simplified for now, ideally shared)
type AnyObj = Record<string, any>;
type Entry = AnyObj & { id: string };

interface EntryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entry?: Entry | null; // If null, it's a new entry
    section?: string;
    date?: string; // Default date for new entries
    onSave?: (savedEntry?: any) => void;
    onDelete?: (id: string) => void;
    isDuplicate?: boolean;
    allowSectionChange?: boolean;
    initialData?: Partial<Entry>;
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
    initialData
}: EntryDrawerProps) {
    const [formData, setFormData] = useState<AnyObj>({});
    const [loading, setLoading] = useState(false);
    const [consulenti, setConsulenti] = useState<AnyObj[]>([]);
    const [tipi, setTipi] = useState<AnyObj[]>([]);
    const [targetSection, setTargetSection] = useState(section || initialData?.section || "APPUNTAMENTI (Pianificazione)");

    const isNew = !entry || isDuplicate || entry.id === "new";
    const effectiveSection = (isDuplicate || allowSectionChange) ? targetSection : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)");
    const isTelefonici = effectiveSection === "APPUNTAMENTI TELEFONICI";

    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
    const [isConsulenteDropdownOpen, setIsConsulenteDropdownOpen] = useState(false);
    const [isTipoDropdownOpen, setIsTipoDropdownOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load dropdowns from API to bypass RLS
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resConsulenti, resTipi] = await Promise.all([
                    fetch("/api/settings/consulente/list"),
                    fetch("/api/settings/tipo/list")
                ]);

                const parseRes = async (res: Response) => {
                    if (!res.ok) throw new Error(`Status: ${res.status}`);
                    const text = await res.text();
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("JSON Parse Error:", e, "Response text:", text);
                        return { items: [] };
                    }
                };

                const c = await parseRes(resConsulenti);
                const t = await parseRes(resTipi);

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
            setTargetSection(section || initialData?.section || "APPUNTAMENTI (Pianificazione)");
            if (entry) {
                if (isDuplicate) {
                    // Clean copy: only take visual fields, treat as new
                    setFormData({
                        section: targetSection,
                        entry_date: date || new Date().toISOString().split('T')[0],
                        entry_time: "",
                        nome: entry.nome,
                        cognome: entry.cognome,
                        telefono: entry.telefono,
                        consulente_id: entry.consulente_id || "",
                        tipo_abbonamento_id: entry.tipo_abbonamento_id || "",
                        fonte: entry.fonte,
                        note: entry.note,
                        miss: false,
                        venduto: false,
                        presentato: false,
                        negativo: false,
                        assente: false,
                        comeback: false,
                        contattato: false,
                        whatsapp_sent: false,
                        whatsapp_sent_date: null
                    });
                } else {
                    // Edit existing
                    setFormData({ ...entry });
                }
            } else if (initialData) {
                // Pre-fill from initialData
                setFormData({
                    section: initialData.section || section || "APPUNTAMENTI (Pianificazione)",
                    entry_date: initialData.entry_date || date || new Date().toISOString().split('T')[0],
                    entry_time: initialData.entry_time || "",
                    nome: initialData.nome || "",
                    cognome: initialData.cognome || "",
                    telefono: initialData.telefono || "",
                    consulente_id: initialData.consulente_id || "",
                    tipo_abbonamento_id: initialData.tipo_abbonamento_id || "",
                    fonte: initialData.fonte || "",
                    note: initialData.note || "",
                    miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false, whatsapp_sent_date: null
                });
            } else {
                // New empty entry
                setFormData({
                    section: section || "APPUNTAMENTI (Pianificazione)",
                    entry_date: date || new Date().toISOString().split('T')[0],
                    entry_time: "",
                    nome: "", cognome: "", telefono: "", consulente_id: "", tipo_abbonamento_id: "", fonte: "", note: "",
                    miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false, whatsapp_sent_date: null
                });
            }
        }
    }, [isOpen, entry, section, date, isDuplicate, initialData]);


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
            // Whitelist approach: Explicitly construct payload with only allowed fields
            // This guarantees no garbage fields or "null" strings are sent
            const payload: AnyObj = {
                section: isDuplicate || allowSectionChange ? effectiveSection : formData.section,
                entry_date: formData.entry_date,
                entry_time: formData.entry_time || null,
                nome: formData.nome || "",
                cognome: formData.cognome || "",
                telefono: formData.telefono || "",
                consulente_id: formData.consulente_id || null, // Convert "" to null
                tipo_abbonamento_id: formData.tipo_abbonamento_id || null, // Convert "" to null
                fonte: formData.fonte || "",
                note: formData.note || "",
                // Booleans
                miss: !!formData.miss,
                venduto: !!formData.venduto,
                presentato: !!formData.presentato,
                negativo: !!formData.negativo,
                assente: !!formData.assente,
                comeback: !!formData.comeback,
                contattato: !!formData.contattato,
            };

            // Double check for "null" string just in case (though whitelist should prevent it)
            if (payload.consulente_id === "null") payload.consulente_id = null;
            if (payload.tipo_abbonamento_id === "null") payload.tipo_abbonamento_id = null;

            if (payload.entry_time && payload.entry_time.length === 5) {
                payload.entry_time += ":00";
            }

            if (isNew) {
                const { error } = await supabase.from("entries").insert(payload);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("entries").update(payload).eq("id", entry.id);
                if (error) throw error;
            }
            if (onSave) onSave(payload);
            onClose();
        } catch (e: any) {
            alert("Errore salvataggio: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    if (isMobile && isOpen) {
        return (
            <EntryWizard
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSave}
                section={effectiveSection}
                date={date}
                initialData={entry ? (isDuplicate ? {
                    section: targetSection,
                    entry_date: date,
                    entry_time: "",
                    nome: entry.nome,
                    cognome: entry.cognome,
                    telefono: entry.telefono,
                    consulente_id: entry.consulente_id || "",
                    tipo_abbonamento_id: entry.tipo_abbonamento_id || "",
                    fonte: entry.fonte,
                    note: entry.note,
                    miss: false,
                    venduto: false,
                    presentato: false,
                    negativo: false,
                    assente: false,
                    comeback: false,
                    contattato: false,
                    whatsapp_sent: false,
                    whatsapp_sent_date: null
                } : { ...entry }) : initialData}
            />
        );
    }

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
                {/* Header (Ultra Compact) */}
                <div className="px-4 pt-6 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3 w-full">
                        <div className="shrink-0">
                            <h2 className="text-sm font-bold text-slate-800 leading-tight">
                                {isDuplicate ? "Duplica" : isNew ? "Nuovo" : "Modifica"}
                            </h2>
                        </div>

                        {/* Section Selector (Compact) */}
                        {isDuplicate || allowSectionChange ? (
                            <div className="relative flex-1 min-w-0">
                                <button
                                    onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-brand rounded-lg shadow-sm hover:bg-brand/5 transition-all group w-full justify-between h-11"
                                >
                                    <span className="text-sm font-black text-brand truncate">
                                        {getSectionLabel(targetSection)}
                                    </span>
                                    <ChevronDown size={16} className="text-brand/60 group-hover:text-brand transition-colors shrink-0" />
                                </button>

                                {isSectionDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsSectionDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-brand/20 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[300px] overflow-y-auto">
                                            {DB_SECTIONS.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setTargetSection(s);
                                                        setIsSectionDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0",
                                                        targetSection === s ? "bg-brand/10 text-brand" : "text-slate-700"
                                                    )}
                                                >
                                                    {getSectionLabel(s)}
                                                    {targetSection === s && <Check size={14} className="text-brand" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold truncate flex-1">
                                {getSectionLabel(section || "")}
                            </p>
                        )}

                        <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Body (Balanced Compact) */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                    {/* Row 1: Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Data <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className={cn("input w-full py-1 text-sm h-9", !formData.entry_date && "border-red-500 focus:border-red-500 bg-red-50")}
                                value={formData.entry_date || ""}
                                onChange={(e) => handleChange("entry_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Ora <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                className={cn("input w-full py-1 text-sm h-9", !formData.entry_time && "border-red-500 focus:border-red-500 bg-red-50")}
                                value={formData.entry_time?.slice(0, 5) || ""}
                                onChange={(e) => handleChange("entry_time", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Name & Surname */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Nome</label>
                            <input
                                className="input w-full py-1 text-sm h-9"
                                placeholder="Mario"
                                value={formData.nome || ""}
                                onChange={(e) => handleChange("nome", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Cognome</label>
                            <input
                                className="input w-full py-1 text-sm h-9"
                                placeholder="Rossi"
                                value={formData.cognome || ""}
                                onChange={(e) => handleChange("cognome", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 3: Phone & Comeback */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Telefono</label>
                            <input
                                className="input w-full py-1 text-sm h-9"
                                placeholder="+39..."
                                value={formData.telefono || ""}
                                onChange={(e) => handleChange("telefono", e.target.value)}
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none h-9 px-2 rounded-lg border border-transparent hover:bg-slate-50 transition-colors w-full">
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

                    {/* Row 4: Consultant & Source */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Consulente</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsConsulenteDropdownOpen(!isConsulenteDropdownOpen)}
                                    className="input w-full py-1 text-left flex items-center justify-between text-sm h-9"
                                >
                                    <span className={cn("truncate", !formData.consulente_id && "text-slate-400")}>
                                        {formData.consulente_id
                                            ? consulenti.find(c => c.id === formData.consulente_id)?.name || "Seleziona"
                                            : "-- Seleziona --"}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                </button>
                                {isConsulenteDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsConsulenteDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-40 overflow-y-auto">
                                            <button
                                                onClick={() => {
                                                    handleChange("consulente_id", "");
                                                    setIsConsulenteDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-500"
                                            >
                                                -- Seleziona --
                                            </button>
                                            {consulenti.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        handleChange("consulente_id", c.id);
                                                        setIsConsulenteDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between",
                                                        formData.consulente_id === c.id ? "bg-brand/5 text-brand font-medium" : "text-slate-700"
                                                    )}
                                                >
                                                    {c.name}
                                                    {formData.consulente_id === c.id && <Check size={14} className="text-brand" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {!isTelefonici && (
                            <div>
                                <label className="label">Fonte</label>
                                <input
                                    className="input w-full py-1 text-sm h-9"
                                    value={formData.fonte || ""}
                                    onChange={(e) => handleChange("fonte", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Row 5: Subscription Type (Full Width) */}
                    {!isTelefonici && (
                        <div>
                            <label className="label">Tipo Abbonamento</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsTipoDropdownOpen(!isTipoDropdownOpen)}
                                    className="input w-full py-1 text-left flex items-center justify-between text-sm h-9"
                                >
                                    <span className={cn("truncate", !formData.tipo_abbonamento_id && "text-slate-400")}>
                                        {formData.tipo_abbonamento_id
                                            ? tipi.find(t => t.id === formData.tipo_abbonamento_id)?.name || "Seleziona"
                                            : "-- Seleziona --"}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                </button>
                                {isTipoDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsTipoDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-40 overflow-y-auto">
                                            <button
                                                onClick={() => {
                                                    handleChange("tipo_abbonamento_id", "");
                                                    setIsTipoDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-500"
                                            >
                                                -- Seleziona --
                                            </button>
                                            {tipi.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => {
                                                        handleChange("tipo_abbonamento_id", t.id);
                                                        setIsTipoDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between",
                                                        formData.tipo_abbonamento_id === t.id ? "bg-brand/5 text-brand font-medium" : "text-slate-700"
                                                    )}
                                                >
                                                    {t.name}
                                                    {formData.tipo_abbonamento_id === t.id && <Check size={14} className="text-brand" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Row 6: Notes */}
                    <div>
                        <label className="label">Note</label>
                        <textarea
                            className="input w-full min-h-[40px] resize-none py-1 text-sm"
                            placeholder="Scrivi qui..."
                            value={formData.note || ""}
                            onChange={(e) => handleChange("note", e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Row 7: Status Toggles */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Esito</h3>
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
                                section={effectiveSection}
                            />
                        )}
                    </div>
                </div>

                {/* Footer (Compact) */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 shrink-0 h-[50px]">
                    {!isNew && onDelete && (
                        <button
                            onClick={() => onDelete(entry!.id)}
                            className="btn btn-sm bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 h-8 w-8 p-0 flex items-center justify-center"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={onClose} className="btn btn-ghost btn-sm h-8">
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-brand btn-sm text-white hover:bg-brand-ink shadow-lg shadow-brand/20 border-transparent min-w-[100px] h-8"
                        >
                            {loading ? "..." : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Salva
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .label {
          @apply block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5;
        }
      `}</style>
        </>,
        document.body
    );
}

"use client";

import { X, Save, Trash2, Calendar, Clock, User, Phone, Tag, FileText, ChevronDown, Check, Dumbbell, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { getSectionLabel, DB_SECTIONS } from "@/lib/sections";
import { hasAppointmentSlotChanged } from "@/lib/whatsapp";

import OutcomeButtons from "../outcomes/OutcomeButtons";
import EntryWizard from "./EntryWizard";
import CustomSelect from "@/components/ui/CustomSelect";

type AnyObj = Record<string, any>;
type Entry = AnyObj & { id: string };

interface EntryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entry?: Entry | null;
    section?: string;
    date?: string;
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
    const [targetSection, setTargetSection] = useState(isDuplicate ? "" : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)"));

    const isNew = !entry || isDuplicate || entry.id === "new";
    const effectiveSection = (isDuplicate || allowSectionChange) ? targetSection : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)");
    const isTelefonici = effectiveSection === "APPUNTAMENTI TELEFONICI";

    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Client autocomplete state
    const [clientSuggestions, setClientSuggestions] = useState<AnyObj[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClient, setSelectedClient] = useState<AnyObj | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autocompleteContainerRef = useRef<HTMLDivElement>(null);

    // Close autocomplete on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch client details if entry is linked
    useEffect(() => {
        if (!isOpen) {
            setSelectedClient(null);
            setShowSuggestions(false);
            return;
        }

        const linkedId = entry?.client_id || initialData?.client_id;
        if (linkedId) {
            fetch(`/api/clients/${linkedId}`)
                .then(r => r.json())
                .then(d => { if (d.client) setSelectedClient(d.client); })
                .catch(() => {});
        } else if (entry?.telefono) {
            fetch(`/api/clients?q=${encodeURIComponent(entry.telefono)}&limit=1`)
                .then(r => r.json())
                .then(d => { if (d.clients?.[0]) setSelectedClient(d.clients[0]); })
                .catch(() => {});
        }
    }, [isOpen, entry, initialData]);

    const handleClientSearch = (field: string, val: string) => {
        handleChange(field, val);
        const nextNome = field === "nome" ? val : formData.nome || "";
        const nextCognome = field === "cognome" ? val : formData.cognome || "";
        const nextPhone = field === "telefono" ? val : formData.telefono || "";
        const query = (field === "telefono" ? nextPhone : `${nextCognome} ${nextNome}`).trim();

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (query.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                fetch(`/api/clients?q=${encodeURIComponent(query)}&limit=6`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.clients && data.clients.length > 0) {
                            setClientSuggestions(data.clients);
                            setShowSuggestions(true);
                        } else {
                            setClientSuggestions([]);
                            setShowSuggestions(false);
                        }
                    })
                    .catch(() => {});
            }, 150);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleFocusSearch = (field: string) => {
        const nextNome = formData.nome || "";
        const nextCognome = formData.cognome || "";
        const nextPhone = formData.telefono || "";
        const query = (field === "telefono" ? nextPhone : `${nextCognome} ${nextNome}`).trim();

        if (query.length >= 2) {
            fetch(`/api/clients?q=${encodeURIComponent(query)}&limit=6`)
                .then(r => r.json())
                .then(data => {
                    if (data.clients && data.clients.length > 0) {
                        setClientSuggestions(data.clients);
                        setShowSuggestions(true);
                    }
                })
                .catch(() => {});
        }
    };

    const handleSelectClient = (client: AnyObj) => {
        setFormData(prev => ({
            ...prev,
            nome: client.nome || prev.nome,
            cognome: client.cognome || prev.cognome,
            telefono: client.telefono || prev.telefono,
            client_id: client.id,
        }));
        setSelectedClient(client);
        setShowSuggestions(false);
    };

    // Load dropdowns from API
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
            setTargetSection(isDuplicate ? "" : (entry?.section || section || initialData?.section || "APPUNTAMENTI (Pianificazione)"));
            if (entry) {
                if (isDuplicate) {
                    setFormData({
                        section: targetSection,
                        entry_date: date || new Date().toISOString().split('T')[0],
                        entry_time: "",
                        nome: entry.nome,
                        cognome: entry.cognome,
                        telefono: entry.telefono,
                        consulente_id: entry.consulente_id || "",
                        tipo_abbonamento_id: entry.tipo_abbonamento_id || "",
                        note: entry.note,
                        miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false
                    });
                } else {
                    setFormData({ ...entry });
                }
            } else if (initialData) {
                setFormData({
                    section: initialData.section || section || "APPUNTAMENTI (Pianificazione)",
                    entry_date: initialData.entry_date || date || new Date().toISOString().split('T')[0],
                    entry_time: initialData.entry_time || "",
                    nome: initialData.nome || "",
                    cognome: initialData.cognome || "",
                    telefono: initialData.telefono || "",
                    consulente_id: initialData.consulente_id || "",
                    tipo_abbonamento_id: initialData.tipo_abbonamento_id || "",
                    note: initialData.note || "",
                    miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false
                });
            } else {
                setFormData({
                    section: section || "APPUNTAMENTI (Pianificazione)",
                    entry_date: date || new Date().toISOString().split('T')[0],
                    entry_time: "",
                    nome: "", cognome: "", telefono: "", consulente_id: "", tipo_abbonamento_id: "", note: "",
                    miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false
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
        
        if ((isDuplicate || allowSectionChange) && !effectiveSection) {
            alert("Seleziona obbligatoriamente la sezione di destinazione.");
            setLoading(false);
            return;
        }

        if (effectiveSection !== "TOUR SPONTANEI" && !formData.entry_time) {
            alert("L'orario è obbligatorio per questa sezione.");
            setLoading(false);
            return;
        }

        try {
            const payload: AnyObj = {
                section: isDuplicate || allowSectionChange ? effectiveSection : formData.section,
                entry_date: formData.entry_date,
                entry_time: formData.entry_time || null,
                nome: formData.nome || "",
                cognome: formData.cognome || "",
                telefono: formData.telefono || "",
                client_id: formData.client_id || (selectedClient?.id ?? null),
                consulente_id: formData.consulente_id || null,
                tipo_abbonamento_id: formData.tipo_abbonamento_id || null,
                note: formData.note || "",
                miss: !!formData.miss,
                venduto: !!formData.venduto,
                presentato: !!formData.presentato,
                negativo: !!formData.negativo,
                assente: !!formData.assente,
                comeback: !!formData.comeback,
                contattato: !!formData.contattato,
            };

            if (payload.consulente_id === "null") payload.consulente_id = null;
            if (payload.tipo_abbonamento_id === "null") payload.tipo_abbonamento_id = null;

            if (payload.entry_time && payload.entry_time.length === 5) {
                payload.entry_time += ":00";
            }

            if (isNew) {
                // Nuovi inserimenti, duplicazioni e riprogrammazioni partono sempre senza conferma WhatsApp
                payload.whatsapp_sent = false;
            } else if (entry && hasAppointmentSlotChanged(entry, payload)) {
                // Se si sposta data, orario o sezione di un appuntamento esistente, la conferma WhatsApp precedente va azzerata
                payload.whatsapp_sent = false;
            }

            let savedData: any = payload;
            if (isNew) {
                const { data, error } = await supabase.from("entries").insert(payload).select().single();
                if (error) throw error;
                savedData = data || payload;
            } else {
                const { data, error } = await supabase.from("entries").update(payload).eq("id", entry.id).select().single();
                if (error) throw error;
                savedData = data || { ...payload, id: entry.id };
            }
            if (onSave) onSave(savedData);
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
                onSave={(savedData) => {
                    if (onSave) onSave(savedData);
                }}
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
                    note: entry.note,
                    miss: false, venduto: false, presentato: false, negativo: false, assente: false, comeback: false, contattato: false, whatsapp_sent: false
                } : { ...entry }) : initialData}
            />
        );
    }

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer Panel - Super Compact */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[101] w-full md:w-[560px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col font-sans",
                    isOpen ? "translate-x-0" : "translate-x-full invisible"
                )}
            >
                {/* Header Compatto */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-[#21b5ba]/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-[#21b5ba] to-[#0f766e] text-white shadow-md shadow-[#21b5ba]/20">
                            <Calendar size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                                {isDuplicate ? "Duplica Appuntamento" : (allowSectionChange && isNew) ? "Riprogramma Appuntamento" : isNew ? "Nuovo Inserimento" : "Modifica Appuntamento"}
                            </h2>
                            <p className="text-xs font-semibold text-[#0f766e] mt-0.5">
                                {getSectionLabel(effectiveSection)}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                        title="Chiudi"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Main Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
                    
                    {(isDuplicate || allowSectionChange) && (
                        <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 mb-4">
                            <label className="block text-xs font-bold text-cyan-800 mb-2 uppercase tracking-wide">Sezione di destinazione *</label>
                            <CustomSelect 
                                options={DB_SECTIONS.map(s => ({ value: s, label: getSectionLabel(s) }))}
                                value={targetSection}
                                onChange={(val) => setTargetSection(val)}
                                placeholder={isDuplicate ? "-- Scegli dove duplicare --" : "-- Scegli nuova sezione --"}
                            />
                        </div>
                    )}


                    {/* RIGA 1: Nome, Cognome e Telefono con Autocompletamento Clienti */}
                    <div className="relative" ref={autocompleteContainerRef}>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Nome</label>
                                <input
                                    className="input-modern"
                                    placeholder="Mario"
                                    value={formData.nome || ""}
                                    onChange={(e) => handleClientSearch("nome", e.target.value)}
                                    onFocus={() => handleFocusSearch("nome")}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Cognome</label>
                                <input
                                    className="input-modern"
                                    placeholder="Rossi"
                                    value={formData.cognome || ""}
                                    onChange={(e) => handleClientSearch("cognome", e.target.value)}
                                    onFocus={() => handleFocusSearch("cognome")}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Telefono</label>
                                <input
                                    className="input-modern font-mono"
                                    placeholder="+39..."
                                    value={formData.telefono || ""}
                                    onChange={(e) => handleClientSearch("telefono", e.target.value)}
                                    onFocus={() => handleFocusSearch("telefono")}
                                />
                            </div>
                        </div>

                        {/* Floating Suggestions Dropdown */}
                        {showSuggestions && clientSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Clienti Wellness trovati</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowSuggestions(false)}
                                        className="text-slate-400 hover:text-slate-700"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                {clientSuggestions.map((client) => (
                                    <div
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="p-2.5 hover:bg-cyan-50/50 cursor-pointer transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-900 text-xs">
                                                {client.cognome} {client.nome}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {client.telefono || "Nessun tel"} • {client.pacchetto_originale || "Abbonato"}
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                                                client.stato === "ATTIVO"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : client.stato === "IN_SCADENZA"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                            )}
                                        >
                                            {client.stato?.replace("_", " ")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Client Status Badge */}
                        {selectedClient && (
                            <div className="mt-2 p-2.5 rounded-xl border border-cyan-100 bg-cyan-50/40 flex items-center justify-between text-xs animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0",
                                            selectedClient.stato === "ATTIVO"
                                                ? "bg-emerald-500"
                                                : selectedClient.stato === "IN_SCADENZA"
                                                ? "bg-amber-500"
                                                : "bg-rose-500"
                                        )}
                                    />
                                    <div className="text-[11px]">
                                        <span className="font-bold text-slate-800">
                                            {selectedClient.pacchetto_originale || "Cliente censito"}
                                        </span>
                                        {selectedClient.data_scadenza && (
                                            <span className="text-slate-500 ml-1">
                                                • Scadenza: <b>{new Date(selectedClient.data_scadenza).toLocaleDateString("it-IT")}</b>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                                        selectedClient.stato === "ATTIVO"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : selectedClient.stato === "IN_SCADENZA"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                    )}
                                >
                                    {selectedClient.stato?.replace("_", " ")}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* RIGA 2: Data e Orario */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Data <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="input-modern"
                                value={formData.entry_date || ""}
                                onChange={(e) => handleChange("entry_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Orario <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="time"
                                className="input-modern"
                                value={formData.entry_time?.slice(0, 5) || ""}
                                onChange={(e) => handleChange("entry_time", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* RIGA 3: Consulente e Tipo Abbonamento (Senza Fonte Lead) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">Consulente Assegnato</label>
                            <CustomSelect
                                options={consulenti.map(c => ({ value: c.id, label: c.name }))}
                                value={formData.consulente_id || ""}
                                onChange={(val) => handleChange("consulente_id", val)}
                                placeholder="-- Seleziona Consulente --"
                                
                            />
                        </div>

                        {!isTelefonici ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Tipo Abbonamento</label>
                                <CustomSelect
                                    options={tipi.map(t => ({ value: t.id, label: t.name }))}
                                    value={formData.tipo_abbonamento_id || ""}
                                    onChange={(val) => handleChange("tipo_abbonamento_id", val)}
                                    placeholder="-- Seleziona Abbonamento --"
                                    
                                />
                            </div>
                        ) : (
                            <div></div>
                        )}
                    </div>

                    {/* RIGA 4: Note Aggiuntive */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Note Aggiuntive</label>
                        <textarea
                            className="input-modern h-12 py-1.5 resize-none text-xs"
                            placeholder="Scrivi qui eventuali informazioni utili..."
                            value={formData.note || ""}
                            onChange={(e) => handleChange("note", e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* RIGA 5: Spunta Comeback prima degli esiti */}
                    <div>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 transition-all">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-[#21b5ba] rounded border-slate-300 focus:ring-[#21b5ba]"
                                checked={!!formData.comeback}
                                onChange={(e) => handleChange("comeback", e.target.checked)}
                            />
                            <span className="text-xs font-bold text-slate-800">Cliente Comeback</span>
                        </label>
                    </div>

                    {/* RIGA 6: Esito Consulenza */}
                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80">
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Esito Consulenza</label>
                        {isTelefonici ? (
                            <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                                    checked={!!formData.contattato}
                                    onChange={(e) => handleChange("contattato", e.target.checked)}
                                />
                                <span className="font-bold text-slate-800 text-xs">Contattato Telefonico Completato</span>
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
                                
                                section={effectiveSection}
                            />
                        )}
                    </div>

                </div>

                {/* Footer del Modulo */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
                    {!isNew && onDelete && (
                        <button
                            onClick={() => onDelete(entry!.id)}
                            className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
                            title="Elimina Appuntamento"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div className="flex items-center gap-2.5 ml-auto">
                        <button onClick={onClose} className="btn btn-outline text-xs py-2 px-3.5">
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-brand text-xs py-2 px-5 shadow-md"
                        >
                            {loading ? "Salvataggio..." : (
                                <>
                                    <Save size={15} className="mr-1.5" />
                                    Salva Appuntamento
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

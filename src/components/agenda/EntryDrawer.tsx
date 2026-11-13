"use client";

import { X, Save, Trash2, Calendar, Clock, User, Phone, Tag, FileText, ChevronDown, Check, Dumbbell, Sparkles, CalendarCheck } from "lucide-react";
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

export const isRenewalOrVerifiche = (sec: string | undefined | null) => {
    if (!sec) return false;
    const upper = sec.toUpperCase();
    return (
        upper === "APPUNTAMENTI RINNOVI E INTEGRAZIONI" ||
        upper === "APPUNTAMENTI VERIFICHE DEL BISOGNO" ||
        upper.includes("RINNOV") ||
        upper.includes("INTEGRAZION") ||
        upper.includes("VERIFICH") ||
        upper.includes("BISOGNO")
    );
};

export const matchTipoAbbonamentoId = (client: AnyObj | null | undefined, tipiList: AnyObj[]): string => {
    if (!client || !tipiList || tipiList.length === 0) return "";

    // 1. Direct ID match
    if (client.tipo_abbonamento_id) {
        const found = tipiList.find(t => t.id === client.tipo_abbonamento_id);
        if (found) return found.id;
    }

    // 2. Name match with pacchetto_originale or clean subscription
    const raw = (client.pacchetto_originale || client.abbonamento || "").replace(/^=+\s*/, "").trim().toLowerCase();
    if (!raw) return "";

    // Exact name match
    const exact = tipiList.find(t => t.name?.trim().toLowerCase() === raw);
    if (exact) return exact.id;

    // Substring matches
    if (raw.includes("annuale")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("annuale"));
        if (f) return f.id;
    }
    if (raw.includes("quadrimestrale")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("quadrimestrale"));
        if (f) return f.id;
    }
    if (raw.includes("semestrale")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("semestrale"));
        if (f) return f.id;
    }
    if (raw.includes("trimestrale")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("trimestrale"));
        if (f) return f.id;
    }
    if (raw.includes("mensile")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("mensile"));
        if (f) return f.id;
    }
    if (raw.includes("reformer")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("reformer"));
        if (f) return f.id;
    }
    if (raw.includes("personal")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("personal"));
        if (f) return f.id;
    }
    if (raw.includes("10 ingressi") || raw.includes("ingressi")) {
        const f = tipiList.find(t => t.name?.toLowerCase().includes("ingressi"));
        if (f) return f.id;
    }

    // Generic match
    const partial = tipiList.find(t => t.name && (raw.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(raw)));
    if (partial) return partial.id;

    return "";
};

export const formatMonthHuman = (monthStr: string) => {
    if (!monthStr) return "";
    const [y, m] = monthStr.split("-").map(Number);
    const months = [
        "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    return `${months[m - 1] || ""} ${y}`;
};

export const cleanSubscription = (s: string | null | undefined) => {
    if (!s) return null;
    return s.replace(/^=+\s*/, "").trim();
};

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
    const isSectionLocked = !!(entry?.lockSectionChange || initialData?.lockSectionChange);
    const [targetSection, setTargetSection] = useState(
        isDuplicate
            ? ""
            : (entry?.section || section || initialData?.section || "APPUNTAMENTI (Pianificazione)")
    );

    const isNew = !entry || isDuplicate || entry.id === "new";
    const effectiveSection = isSectionLocked
        ? (targetSection || entry?.section || "APPUNTAMENTI RINNOVI E INTEGRAZIONI")
        : (isDuplicate || allowSectionChange)
        ? targetSection
        : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)");
    const isTelefonici = effectiveSection === "APPUNTAMENTI TELEFONICI";
    const isSubscriptionRequired = isRenewalOrVerifiche(effectiveSection);

    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Client autocomplete state
    const [clientSuggestions, setClientSuggestions] = useState<AnyObj[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClient, setSelectedClient] = useState<AnyObj | null>(null);
    const [selectedMeseRiferimento, setSelectedMeseRiferimento] = useState<string>("");
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autocompleteContainerRef = useRef<HTMLDivElement>(null);

    // Compute available months for renewal reference
    useEffect(() => {
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth() + 1;
        const set = new Set<string>();
        for (let i = -3; i <= 14; i++) {
            const d = new Date(Date.UTC(currYear, currMonth - 1 + i, 1));
            set.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
        }
        if (selectedClient?.data_scadenza) {
            set.add(selectedClient.data_scadenza.slice(0, 7));
        }
        setAvailableMonths(Array.from(set).sort());
    }, [selectedClient]);

    // Pre-select default renewal reference month from client's active expiration
    useEffect(() => {
        if (selectedClient?.data_scadenza) {
            const defMese = selectedClient.data_scadenza.slice(0, 7);
            setSelectedMeseRiferimento(defMese);
            setFormData(prev => ({ ...prev, mese_riferimento: defMese }));
        } else if (initialData?.mese_riferimento) {
            setSelectedMeseRiferimento(initialData.mese_riferimento);
        }
    }, [selectedClient, initialData]);

    // Fetch linked renewal month if editing an existing entry
    useEffect(() => {
        if (!isOpen) return;
        if (entry?.id && entry.id !== "new") {
            supabase
                .from("rinnovi_items")
                .select("mese_riferimento")
                .eq("entry_id", entry.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data?.mese_riferimento) {
                        setSelectedMeseRiferimento(data.mese_riferimento);
                        setFormData(prev => ({ ...prev, mese_riferimento: data.mese_riferimento }));
                    }
                });
        }
    }, [isOpen, entry]);

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

    // Auto-sync tipo_abbonamento_id when client or tipi is loaded/matched
    useEffect(() => {
        if (selectedClient && tipi.length > 0) {
            setFormData(prev => {
                if (!prev.tipo_abbonamento_id) {
                    const matchedTipoId = matchTipoAbbonamentoId(selectedClient, tipi);
                    if (matchedTipoId) {
                        return { ...prev, tipo_abbonamento_id: matchedTipoId };
                    }
                }
                return prev;
            });
        }
    }, [selectedClient, tipi]);

    const handleClientSearch = (field: string, val: string) => {
        const formattedVal = (field === "nome" || field === "cognome") ? val.toUpperCase() : val;
        handleChange(field, formattedVal);
        const nextNome = field === "nome" ? formattedVal : formData.nome || "";
        const nextCognome = field === "cognome" ? formattedVal : formData.cognome || "";
        const nextPhone = field === "telefono" ? formattedVal : formData.telefono || "";
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

                            // If exact match found while typing, auto-sync client and subscription
                            const exact = data.clients.find((c: any) =>
                                (nextPhone && nextPhone.length >= 6 && c.telefono === nextPhone) ||
                                (nextCognome && nextNome && c.cognome?.toLowerCase().trim() === nextCognome.toLowerCase().trim() && c.nome?.toLowerCase().trim() === nextNome.toLowerCase().trim())
                            );
                            if (exact) {
                                setSelectedClient(exact);
                                setFormData(prev => {
                                    const matchedTipo = matchTipoAbbonamentoId(exact, tipi);
                                    return {
                                        ...prev,
                                        client_id: exact.id,
                                        tipo_abbonamento_id: prev.tipo_abbonamento_id || matchedTipo || ""
                                    };
                                });
                            }
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
        const matchedTipoId = matchTipoAbbonamentoId(client, tipi);
        const defMese = client.data_scadenza ? client.data_scadenza.slice(0, 7) : "";
        if (defMese) setSelectedMeseRiferimento(defMese);

        setFormData(prev => ({
            ...prev,
            nome: client.nome || prev.nome,
            cognome: client.cognome || prev.cognome,
            telefono: client.telefono || prev.telefono,
            client_id: client.id,
            tipo_abbonamento_id: prev.tipo_abbonamento_id || matchedTipoId || "",
            mese_riferimento: defMese || prev.mese_riferimento || "",
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
        const val = (field === "nome" || field === "cognome") && typeof value === "string" ? value.toUpperCase() : value;
        setFormData((prev) => ({ ...prev, [field]: val }));
    };

    const handleSave = async () => {
        setLoading(true);

        const effectiveSection = isSectionLocked
            ? (targetSection || entry?.section || "APPUNTAMENTI RINNOVI E INTEGRAZIONI")
            : (isDuplicate || allowSectionChange)
            ? targetSection
            : section;
        
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
            let resolvedClientId = formData.client_id || (selectedClient?.id ?? null);

            // Auto-resolve client_id from clients table if not already linked
            if (!resolvedClientId) {
                if (formData.telefono && formData.telefono.trim().length >= 6) {
                    const cleanTel = formData.telefono.replace(/\D/g, "");
                    const { data: matchedClient } = await supabase
                        .from("clients")
                        .select("id")
                        .or(`telefono.eq.${formData.telefono.trim()},telefono.ilike.%${cleanTel.slice(-8)}%`)
                        .limit(1)
                        .maybeSingle();
                    if (matchedClient) {
                        resolvedClientId = matchedClient.id;
                    }
                }
                if (!resolvedClientId && formData.cognome && formData.nome) {
                    const { data: matchedClient } = await supabase
                        .from("clients")
                        .select("id")
                        .ilike("cognome", formData.cognome.trim())
                        .ilike("nome", formData.nome.trim())
                        .limit(1)
                        .maybeSingle();
                    if (matchedClient) {
                        resolvedClientId = matchedClient.id;
                    }
                }
            }

            const targetSection = isDuplicate || allowSectionChange ? effectiveSection : formData.section;
            const isSubRequired = isRenewalOrVerifiche(targetSection);

            // Auto-resolve subscription from client if missing
            let resolvedTipoId = formData.tipo_abbonamento_id || null;
            if ((!resolvedTipoId || resolvedTipoId === "null") && selectedClient && tipi.length > 0) {
                resolvedTipoId = matchTipoAbbonamentoId(selectedClient, tipi) || null;
            }
            if ((!resolvedTipoId || resolvedTipoId === "null") && resolvedClientId && tipi.length > 0) {
                const { data: cl } = await supabase
                    .from("clients")
                    .select("id, tipo_abbonamento_id, pacchetto_originale")
                    .eq("id", resolvedClientId)
                    .maybeSingle();
                if (cl) {
                    resolvedTipoId = matchTipoAbbonamentoId(cl, tipi) || null;
                }
            }

            if (isSubRequired && (!resolvedTipoId || resolvedTipoId === "null")) {
                alert("ATTENZIONE: La Tipologia di Abbonamento è obbligatoria per le sezioni Rinnovi e Integrazioni e Verifiche del Bisogno.");
                setLoading(false);
                return;
            }

            const payload: AnyObj = {
                section: targetSection,
                entry_date: formData.entry_date,
                entry_time: formData.entry_time || null,
                nome: (formData.nome || "").trim().toUpperCase(),
                cognome: (formData.cognome || "").trim().toUpperCase(),
                telefono: formData.telefono || "",
                client_id: resolvedClientId,
                consulente_id: formData.consulente_id || null,
                tipo_abbonamento_id: resolvedTipoId,
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

            // Sync with rinnovi_items if this appointment is in Rinnovi section and linked to a client
            const isRenewal = targetSection === "APPUNTAMENTI RINNOVI E INTEGRAZIONI" || targetSection?.includes("RINNOV");
            if (resolvedClientId && isRenewal) {
                try {
                    const { data: cl } = await supabase
                        .from("clients")
                        .select("id, data_scadenza, pacchetto_originale, disciplina, prezzo")
                        .eq("id", resolvedClientId)
                        .maybeSingle();

                    const meseRef = selectedMeseRiferimento || (cl?.data_scadenza ? cl.data_scadenza.slice(0, 7) : null);
                    if (meseRef) {
                        const { data: existingRin } = await supabase
                            .from("rinnovi_items")
                            .select("id")
                            .eq("client_id", resolvedClientId)
                            .eq("mese_riferimento", meseRef)
                            .maybeSingle();

                        const hasOutcome = !!(formData.venduto || formData.presentato || formData.negativo || formData.assente || formData.miss);
                        const esitoVal = formData.venduto
                            ? "venduto"
                            : formData.presentato
                            ? "presentato"
                            : formData.negativo
                            ? "negativo"
                            : formData.assente
                            ? "assente"
                            : formData.miss
                            ? "miss"
                            : null;

                        if (existingRin) {
                            await supabase.from("rinnovi_items").update({
                                preso_appuntamento: true,
                                data_consulenza: formData.entry_date,
                                contattato: true,
                                entry_id: savedData.id,
                                ...(hasOutcome ? { consulenza_fatta: true, esito: esitoVal } : {}),
                            }).eq("id", existingRin.id);
                        } else {
                            await supabase.from("rinnovi_items").insert({
                                client_id: resolvedClientId,
                                mese_riferimento: meseRef,
                                scadenza_originaria: cl?.data_scadenza || `${meseRef}-01`,
                                abbonamento_originario: cl?.pacchetto_originale ? cleanSubscription(cl.pacchetto_originale) : null,
                                disciplina: cl?.disciplina || "ALTRO",
                                prezzo_originario: cl?.prezzo || 0,
                                contattato: true,
                                preso_appuntamento: true,
                                data_consulenza: formData.entry_date,
                                entry_id: savedData.id,
                                consulenza_fatta: hasOutcome,
                                esito: esitoVal,
                            });
                        }

                        // Disassociate any other renewal item previously attached to this entry_id
                        await supabase
                            .from("rinnovi_items")
                            .update({ entry_id: null, preso_appuntamento: false })
                            .eq("entry_id", savedData.id)
                            .neq("mese_riferimento", meseRef);
                    }
                } catch (rinErr) {
                    console.error("Error auto-syncing rinnovi_item from EntryDrawer:", rinErr);
                }
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
                            <label className="block text-xs font-bold text-cyan-800 mb-2 uppercase tracking-wide flex items-center justify-between">
                                <span>Sezione di destinazione *</span>
                                {isSectionLocked && (
                                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        Non Modificabile (Rinnovi)
                                    </span>
                                )}
                            </label>
                            {isSectionLocked ? (
                                <div className="input-modern bg-slate-100/90 text-slate-800 font-bold flex items-center justify-between cursor-not-allowed border-slate-300 select-none">
                                    <span>{getSectionLabel(targetSection || "APPUNTAMENTI RINNOVI E INTEGRAZIONI")}</span>
                                    <span className="text-[11px] text-slate-500 font-normal">Fissa per Rinnovi/Integrazioni</span>
                                </div>
                            ) : (
                                <CustomSelect 
                                    options={DB_SECTIONS.map(s => ({ value: s, label: getSectionLabel(s) }))}
                                    value={targetSection}
                                    onChange={(val) => setTargetSection(val)}
                                    placeholder={isDuplicate ? "-- Scegli dove duplicare --" : "-- Scegli nuova sezione --"}
                                />
                            )}
                        </div>
                    )}


                    {/* RIGA 1: Nome, Cognome e Telefono con Autocompletamento Clienti */}
                    <div className="relative" ref={autocompleteContainerRef}>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Nome</label>
                                <input
                                    className="input-modern uppercase font-semibold"
                                    placeholder="MARIO"
                                    value={formData.nome || ""}
                                    onChange={(e) => handleClientSearch("nome", e.target.value)}
                                    onFocus={() => handleFocusSearch("nome")}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Cognome</label>
                                <input
                                    className="input-modern uppercase font-semibold"
                                    placeholder="ROSSI"
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

                        {/* Alternative 3: Scadenza di Riferimento Rinnovo */}
                        {isRenewalOrVerifiche(effectiveSection) && (
                            <div className="mt-3 p-3.5 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 shadow-xs animate-in fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                            <CalendarCheck size={14} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-indigo-950 uppercase tracking-tight">
                                                    Scadenza di Riferimento Rinnovo
                                                </span>
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                                                    Campagna Rinnovi
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                L&apos;appuntamento sarà collegato alla lista del mese selezionato
                                            </p>
                                        </div>
                                    </div>
                                    {selectedMeseRiferimento && (
                                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
                                            {formatMonthHuman(selectedMeseRiferimento)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1">
                                        <CustomSelect
                                            options={availableMonths.map((m) => {
                                                const isClientExp = selectedClient?.data_scadenza?.startsWith(m);
                                                return {
                                                    value: m,
                                                    label: `${formatMonthHuman(m)}${isClientExp ? " (Scadenza Attuale)" : ""}`,
                                                };
                                            })}
                                            value={selectedMeseRiferimento || ""}
                                            onChange={(val) => {
                                                setSelectedMeseRiferimento(val);
                                                handleChange("mese_riferimento", val);
                                            }}
                                            placeholder="-- Seleziona Mese di Scadenza --"
                                        />
                                    </div>
                                    {selectedClient?.data_scadenza && selectedMeseRiferimento !== selectedClient.data_scadenza.slice(0, 7) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const defMese = selectedClient.data_scadenza.slice(0, 7);
                                                setSelectedMeseRiferimento(defMese);
                                                handleChange("mese_riferimento", defMese);
                                            }}
                                            className="text-[10px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-2 rounded-xl transition-colors whitespace-nowrap shadow-2xs"
                                        >
                                            Usa scadenza cliente
                                        </button>
                                    )}
                                </div>

                                {selectedClient?.data_scadenza && (
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-2 font-medium bg-white/80 py-1.5 rounded-xl border border-indigo-100/70">
                                        <span>Abbonamento attivo: <b className="text-slate-800">{cleanSubscription(selectedClient.pacchetto_originale) || "—"}</b></span>
                                        <span>Data scadenza: <b className="text-indigo-900">{new Date(selectedClient.data_scadenza).toLocaleDateString("it-IT")}</b></span>
                                    </div>
                                )}
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
                                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                                    <span>
                                        Tipo Abbonamento
                                        {isSubscriptionRequired && (
                                            <span className="text-rose-600 font-extrabold ml-1" title="Obbligatorio per questa sezione">*</span>
                                        )}
                                    </span>
                                    {isSubscriptionRequired && (
                                        <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                            Obbligatorio
                                        </span>
                                    )}
                                </label>
                                <CustomSelect
                                    options={tipi.map(t => ({ value: t.id, label: t.name }))}
                                    value={formData.tipo_abbonamento_id || ""}
                                    onChange={(val) => handleChange("tipo_abbonamento_id", val)}
                                    placeholder="-- Seleziona Abbonamento --"
                                    className={isSubscriptionRequired && !formData.tipo_abbonamento_id ? "border-amber-400 ring-2 ring-amber-400/30" : ""}
                                />
                                {isSubscriptionRequired && !formData.tipo_abbonamento_id && (
                                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                                        * Seleziona la tipologia di abbonamento per proseguire.
                                    </p>
                                )}
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

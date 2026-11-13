import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useOutcomeManager(onUpdate: () => void) {
    const [salePopup, setSalePopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [reschedulePopup, setReschedulePopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [verifyPopup, setVerifyPopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });
    const [absentPopup, setAbsentPopup] = useState<{ open: boolean, entry: any | null }>({ open: false, entry: null });

    // For Reschedule Logic
    const [rescheduleDrawerOpen, setRescheduleDrawerOpen] = useState(false);
    const [rescheduleEntryData, setRescheduleEntryData] = useState<any>(null);
    const [entryToMiss, setEntryToMiss] = useState<any | null>(null);

    const handleOutcomeClick = (type: string, entry: any) => {
        if (type === 'presentato') {
            if (entry.presentato) {
                // Toggle off directly if already presented? Or confirm removal?
                // For now, simple toggle off without popup, or maybe confirm removal?
                // User said "popups everywhere". Let's assume toggle OFF is simple, toggle ON requires popup.
                updateEntry(entry.id, { presentato: false });
            } else {
                setVerifyPopup({ open: true, entry });
            }
        } else if (type === 'venduto') {
            if (entry.venduto) {
                updateEntry(entry.id, { venduto: false });
            } else {
                setSalePopup({ open: true, entry });
            }
        } else if (type === 'negativo') {
            // Negativo usually doesn't need complex popup, but maybe a confirm?
            // User didn't specify popup for Negativo, but said "standardized".
            // Let's just toggle for now, or maybe add a simple confirm later.
            // Actually, let's keep it simple toggle for Negativo as it has no extra data.
            // Wait, "Negativo" implies "Presentato" was true?
            // If I mark Negativo, I should probably ensure Presentato is true?
            // Let's stick to simple toggle for Negativo for now to avoid overengineering.
            updateEntry(entry.id, { negativo: !entry.negativo, venduto: false, miss: false, assente: false });
        } else if (type === 'miss') {
            if (entry.miss) {
                updateEntry(entry.id, { miss: false });
            } else {
                setReschedulePopup({ open: true, entry });
            }
        } else if (type === 'assente') {
            if (entry.assente) {
                updateEntry(entry.id, { assente: false });
            } else {
                setAbsentPopup({ open: true, entry });
            }
        }
    };

    const updateEntry = async (id: string, updates: any, subTypeName?: string) => {
        // If setting a positive status, clear conflicting ones
        if (updates.venduto) { updates.negativo = false; updates.miss = false; updates.assente = false; }
        if (updates.negativo) { updates.venduto = false; } // Negativo can coexist with Presentato? Yes.
        if (updates.miss) { updates.venduto = false; updates.negativo = false; updates.presentato = false; updates.assente = false; }
        if (updates.assente) { updates.venduto = false; updates.negativo = false; updates.presentato = false; updates.miss = false; }

        const { data: updatedEntry } = await supabase.from("entries").update(updates).eq("id", id).select("id, client_id, section, nome, cognome, telefono").maybeSingle();

        if (updatedEntry) {
            const entrySec = (updatedEntry.section || "").toUpperCase();
            const isRinnoviSec = entrySec.includes("RINNOV") || entrySec.includes("INTEGRAZION");

            // 1. SYNC RINNOVI
            if (updatedEntry.client_id && isRinnoviSec) {
                const rinUpdates: any = {};
                if (updates.venduto) {
                    rinUpdates.esito = "RINNOVO";
                    rinUpdates.consulenza_fatta = true;
                    if (subTypeName) rinUpdates.nuovo_abbonamento_name = subTypeName;
                } else if (updates.negativo) {
                    rinUpdates.esito = "NEGATIVO";
                    rinUpdates.consulenza_fatta = true;
                } else if (updates.miss) {
                    if (updates.presentato) {
                        rinUpdates.esito = "IN ATTESA";
                        rinUpdates.consulenza_fatta = true;
                    } else {
                        rinUpdates.consulenza_fatta = false;
                        rinUpdates.esito = null;
                    }
                } else if (updates.assente) {
                    rinUpdates.consulenza_fatta = false;
                    rinUpdates.esito = null;
                }
                if (Object.keys(rinUpdates).length > 0) {
                    await supabase.from("rinnovi_items").update(rinUpdates).eq("client_id", updatedEntry.client_id);
                }
            }

            // 2. SYNC LEADS (gestione_items)
            // Appuntamenti Pianificazione, Miss con Appuntamento, Tour Spontanei
            if (!isRinnoviSec) {
                let leadMatchIds: string[] = [];
                const { data: byEntryId } = await supabase.from("gestione_items").select("id").eq("entry_id", updatedEntry.id);
                if (byEntryId && byEntryId.length > 0) {
                    leadMatchIds = byEntryId.map((x: any) => x.id);
                } else if (updatedEntry.telefono) {
                    const { data: byTel } = await supabase.from("gestione_items").select("id").eq("telefono", updatedEntry.telefono);
                    if (byTel && byTel.length > 0) {
                        leadMatchIds = byTel.map((x: any) => x.id);
                    }
                }

                if (leadMatchIds.length > 0) {
                    const leadUpdates: any = {};
                    if (updates.venduto) {
                        leadUpdates.esito = "ISCRIZIONE";
                        leadUpdates.consulenza_fatta = true;
                        if (subTypeName) leadUpdates.nuovo_abbonamento_name = subTypeName;
                    } else if (updates.negativo) {
                        leadUpdates.esito = "NEGATIVO";
                        leadUpdates.consulenza_fatta = true;
                    } else if (updates.miss) {
                        if (updates.presentato) {
                            leadUpdates.esito = "IN ATTESA";
                            leadUpdates.consulenza_fatta = true;
                        } else {
                            leadUpdates.consulenza_fatta = false;
                            leadUpdates.esito = null;
                        }
                    } else if (updates.assente) {
                        leadUpdates.consulenza_fatta = false;
                        leadUpdates.esito = null;
                    } else if (updates.presentato) {
                        leadUpdates.consulenza_fatta = true;
                    }

                    if (Object.keys(leadUpdates).length > 0) {
                        await supabase.from("gestione_items").update(leadUpdates).in("id", leadMatchIds);
                    }
                }
            }
        }

        onUpdate();
    };

    // Confirm Handlers
    const confirmVerify = async () => {
        if (!verifyPopup.entry) return;
        await updateEntry(verifyPopup.entry.id, { presentato: true, miss: false, assente: false });
        setVerifyPopup({ open: false, entry: null });
    };

    const confirmSale = async (subscriptionType: string) => {
        if (!salePopup.entry) return;

        // Find ID of subscription type
        const { data: types } = await supabase.from("tipi_abbonamento").select("id, name").eq("name", subscriptionType).single();

        await updateEntry(salePopup.entry.id, {
            venduto: true,
            tipo_abbonamento_id: types?.id,
            negativo: false,
            miss: false,
            assente: false,
            presentato: true // Sale implies presence
        }, types?.name || subscriptionType);
        setSalePopup({ open: false, entry: null });
    };

    const confirmMiss = (shouldReschedule: boolean, wasPresent: boolean) => {
        if (!reschedulePopup.entry) return;

        if (shouldReschedule) {
            const entrySec = (reschedulePopup.entry.section || "").toUpperCase();
            const isRinnovi = entrySec === "APPUNTAMENTI RINNOVI E INTEGRAZIONI" ||
                              entrySec.includes("RINNOV") ||
                              entrySec.includes("INTEGRAZION");
            const targetSection = isRinnovi ? "APPUNTAMENTI RINNOVI E INTEGRAZIONI" : "MISS CON APPUNTAMENTO";

            setEntryToMiss({ ...reschedulePopup.entry, wasPresent }); // Store wasPresent for later
            setRescheduleEntryData({
                ...reschedulePopup.entry,
                id: "new", // Treat as new entry
                section: targetSection,
                lockSectionChange: isRinnovi, // SOLO per Rinnovi/Integrazioni la sezione di destinazione di default è RINNOVI ed è NON MODIFICABILE
                // Reset outcomes for the new copy
                miss: false,
                venduto: false,
                presentato: false,
                negativo: false,
                assente: false,
                comeback: false,
                contattato: false,
                // Clear time to force selection
                entry_time: "",
                note: `Riprogrammato da Miss il ${new Date().toLocaleDateString("it-IT")}. ${reschedulePopup.entry.note ? `Note prec: ${reschedulePopup.entry.note}` : ""}`,
                // Reset WhatsApp status
                whatsapp_sent: false
            });
            setRescheduleDrawerOpen(true);
        } else {
            setReschedulePopup({ open: false, entry: null });
        }
        setReschedulePopup({ open: false, entry: null });
    };

    const confirmAbsent = async () => {
        if (!absentPopup.entry) return;
        await updateEntry(absentPopup.entry.id, { assente: true, miss: false, presentato: false, venduto: false, negativo: false });
        setAbsentPopup({ open: false, entry: null });
    };

    const onRescheduleSaved = async () => {
        if (entryToMiss) {
            // Direct update to avoid updateEntry's mutual exclusivity logic
            await supabase.from("entries").update({
                miss: true,
                presentato: entryToMiss.wasPresent || false,
                assente: !entryToMiss.wasPresent,
                venduto: false,
                negativo: false
            }).eq("id", entryToMiss.id);

            const isRinSec = ((entryToMiss.section || "").toUpperCase()).includes("RINNOV") || ((entryToMiss.section || "").toUpperCase()).includes("INTEGRAZION");

            if (entryToMiss.client_id && isRinSec) {
                const rinUpdates: any = {};
                if (entryToMiss.wasPresent) {
                    rinUpdates.esito = "IN ATTESA";
                    rinUpdates.consulenza_fatta = true;
                } else {
                    rinUpdates.consulenza_fatta = false;
                    rinUpdates.esito = null;
                }
                await supabase.from("rinnovi_items").update(rinUpdates).eq("client_id", entryToMiss.client_id);
            }

            // Sync with Leads (gestione_items) when rescheduling non-Rinnovi appointments
            if (!isRinSec) {
                const leadUpdates: any = {};
                if (entryToMiss.wasPresent) {
                    leadUpdates.esito = "IN ATTESA";
                    leadUpdates.consulenza_fatta = true;
                } else {
                    leadUpdates.consulenza_fatta = false;
                    leadUpdates.esito = null;
                }
                let leadIds: string[] = [];
                const { data: gByEntry } = await supabase.from("gestione_items").select("id").eq("entry_id", entryToMiss.id);
                if (gByEntry && gByEntry.length > 0) {
                    leadIds = gByEntry.map((x: any) => x.id);
                } else if (entryToMiss.telefono) {
                    const { data: gByTel } = await supabase.from("gestione_items").select("id").eq("telefono", entryToMiss.telefono);
                    if (gByTel && gByTel.length > 0) leadIds = gByTel.map((x: any) => x.id);
                }
                if (leadIds.length > 0) {
                    await supabase.from("gestione_items").update(leadUpdates).in("id", leadIds);
                }
            }

            setEntryToMiss(null);
        }
        setRescheduleDrawerOpen(false);
        onUpdate();
    };

    return {
        // State
        salePopup, setSalePopup,
        reschedulePopup, setReschedulePopup,
        verifyPopup, setVerifyPopup,
        absentPopup, setAbsentPopup,
        rescheduleDrawerOpen, setRescheduleDrawerOpen,
        rescheduleEntryData,

        // Handlers
        handleOutcomeClick,
        confirmVerify,
        confirmSale,
        confirmMiss,
        confirmAbsent,
        onRescheduleSaved
    };
}

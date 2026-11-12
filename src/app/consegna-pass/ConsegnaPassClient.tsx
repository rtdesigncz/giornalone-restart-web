"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import {
    Trash2,
    Plus,
    Search,
    MessageCircle,
    UserPlus,
    Users,
    ArrowRight,
    ChevronDown,
    Edit2,
    Check,
    X,
    ArrowUp,
    ArrowDown,
    Settings2,
    Flame,
    Euro,
    Gift,
    Calendar,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Award,
    Sparkles,
    MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { cleanPhone } from "@/lib/whatsapp";
import ReferralActivationPopup from "./ReferralActivationPopup";
import PassDeliveryPopup from "./PassDeliveryPopup";
import PassEditPopup from "./PassEditPopup";
import PassStrategyModal from "./PassStrategyModal";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import {
    PassStrategy,
    DEFAULT_PASS_STRATEGY,
    PassAgendaSync,
    SyncedSlotInfo,
    parsePassStrategy,
    serializePassStrategy,
    parsePassItemMeta,
    serializePassItemMeta,
    upsertExtraApp,
    buildCompactedTrialsPatch,
    getUnifiedTrials,
    getEffectiveProposalState,
    getDaysDiffFromToday,
} from "@/lib/passUtils";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PassItem {
    id: string;
    gestione_id: string;
    data_consegna: string;
    cliente_nome: string;
    cliente_cognome: string;
    cliente_telefono: string;
    referral_nome?: string | null;
    referral_cognome?: string | null;
    referral_telefono?: string | null;
    data_attivazione?: string | null;
    is_lead: boolean;
    whatsapp_sent_date?: string | null;
    source_type?: string | null;
    note?: string | null;

    // Appointment Tracking
    data_app_1?: string | null;
    esito_app_1?: "pending" | "show" | "no_show" | null;
    id_app_1?: string | null;
    data_app_2?: string | null;
    esito_app_2?: "pending" | "show" | "no_show" | null;
    id_app_2?: string | null;
    data_app_3?: string | null;
    esito_app_3?: "pending" | "show" | "no_show" | null;
    id_app_3?: string | null;

    // Subscription
    iscritto?: boolean | null;
    tipo_abbonamento?: string | null;
    generated_lead_id?: string | null;

    // Server-enriched Agenda Sync
    agenda_sync?: PassAgendaSync | null;
}

interface Gestione {
    id: string;
    nome: string;
    descrizione?: string | null;
    active?: boolean;
}

type DeliveryFilter = "all" | "to_remind" | "pending" | "activated";
type PipelineFilter = "all" | "da_fissare" | "fare_proposta" | "da_recuperare" | "conclusi";

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const iso = dateString.slice(0, 10);
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date(dateString).toLocaleDateString("it-IT");
};

export default function ConsegnaPassClient() {
    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [selectedGestioneId, setSelectedGestioneId] = useState<string | null>(null);
    const [passItems, setPassItems] = useState<PassItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"distribuzione" | "referral">("distribuzione");

    // Filters
    const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
    const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");

    // Gestioni UI State
    const [isGestioneDropdownOpen, setIsGestioneDropdownOpen] = useState(false);
    const [editingGestioneId, setEditingGestioneId] = useState<string | null>(null);
    const [editingGestioneName, setEditingGestioneName] = useState("");
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [isCreatingGestione, setIsCreatingGestione] = useState(false);

    // Popup & Drawer State
    const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
    const [editingPassItem, setEditingPassItem] = useState<PassItem | null>(null);
    const [showActivationPopup, setShowActivationPopup] = useState(false);
    const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
    const [showManualActivationPopup, setShowManualActivationPopup] = useState(false);

    // Edit Popup State
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editingReferral, setEditingReferral] = useState<PassItem | null>(null);

    // Entry Drawer State for Appointments
    const [entryDrawerOpen, setEntryDrawerOpen] = useState(false);
    const [selectedAppointmentStep, setSelectedAppointmentStep] = useState<number | null>(null);
    const [selectedReferralForApp, setSelectedReferralForApp] = useState<PassItem | null>(null);
    const [editingAppointmentEntry, setEditingAppointmentEntry] = useState<any | null>(null);

    // Quick Proposal Menu & Slot Menu
    const [activeSlotMenu, setActiveSlotMenu] = useState<{
        itemId: string;
        step: number;
        position?: { top: number; left: number };
    } | null>(null);
    const [activeProposalMenu, setActiveProposalMenu] = useState<{
        itemId: string;
        position: { top: number; left: number };
    } | null>(null);

    // Options
    const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const handleSort = (key: "data_consegna" | "is_lead") => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        fetchGestioni();
        fetchSubscriptionTypes();
    }, []);

    useEffect(() => {
        if (selectedGestioneId) {
            fetchPassItems(selectedGestioneId);
        } else {
            setPassItems([]);
        }
    }, [selectedGestioneId]);

    const fetchGestioni = async () => {
        try {
            const res = await fetch("/api/pass/gestioni");
            const data = await res.json();
            if (data.rows) {
                setGestioni(data.rows);
                if (data.rows.length > 0 && !selectedGestioneId) {
                    setSelectedGestioneId(data.rows[0].id);
                }
            }
        } catch (err) {
            console.error("Error fetching gestioni:", err);
        }
    };

    const fetchPassItems = async (gestioneId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pass/items?gestione=${gestioneId}`);
            const data = await res.json();
            if (data.rows) {
                setPassItems(data.rows);
            }
        } catch (err) {
            console.error("Error fetching items:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptionTypes = async () => {
        const { data } = await supabase.from("tipi_abbonamento").select("name").eq("active", true).order("sort_order");
        if (data) setSubscriptionTypes(data.map((d) => d.name));
    };

    const selectedGestione = gestioni.find((g) => g.id === selectedGestioneId);
    const currentStrategy: PassStrategy = useMemo(() => {
        return parsePassStrategy(selectedGestione?.descrizione);
    }, [selectedGestione?.descrizione]);

    // Gestione Creation & Strategy Updates
    const handleOpenNewGestione = () => {
        setIsCreatingGestione(true);
        setShowStrategyModal(true);
        setIsGestioneDropdownOpen(false);
    };

    const handleOpenEditStrategy = () => {
        if (!selectedGestione) return;
        setIsCreatingGestione(false);
        setShowStrategyModal(true);
    };

    const handleSaveStrategy = async ({ nome, strategy }: { nome: string; strategy: PassStrategy }) => {
        const descrizione = serializePassStrategy(strategy);
        if (isCreatingGestione) {
            const res = await fetch("/api/pass/gestioni", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, descrizione }),
            });
            const json = await res.json();
            if (json.row) {
                setGestioni([json.row, ...gestioni]);
                setSelectedGestioneId(json.row.id);
            } else {
                alert("Errore creazione campagna: " + (json.error || ""));
            }
        } else if (selectedGestione) {
            const res = await fetch(`/api/pass/gestioni?id=${selectedGestione.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, descrizione }),
            });
            if (res.ok) {
                setGestioni(
                    gestioni.map((g) => (g.id === selectedGestione.id ? { ...g, nome, descrizione } : g))
                );
            } else {
                alert("Errore aggiornamento strategia");
            }
        }
    };

    const handleUpdateGestione = async (id: string) => {
        if (!editingGestioneName.trim()) return;
        const res = await fetch(`/api/pass/gestioni?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: editingGestioneName }),
        });
        if (!res.ok) alert("Errore aggiornamento gestione");
        else {
            setGestioni(gestioni.map((g) => (g.id === id ? { ...g, nome: editingGestioneName } : g)));
            setEditingGestioneId(null);
        }
    };

    const handleDeleteGestione = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa gestione? Tutti i pass associati verranno eliminati.")) return;
        const res = await fetch(`/api/pass/gestioni?id=${id}`, { method: "DELETE" });
        if (!res.ok) alert("Errore eliminazione gestione");
        else {
            const newGestioni = gestioni.filter((g) => g.id !== id);
            setGestioni(newGestioni);
            if (selectedGestioneId === id) {
                setSelectedGestioneId(newGestioni.length > 0 ? newGestioni[0].id : null);
            }
        }
    };

    const handleAddPass = () => {
        setEditingPassItem(null);
        setShowDeliveryPopup(true);
    };

    const handleEditPass = (item: PassItem) => {
        setEditingPassItem(item);
        setShowDeliveryPopup(true);
    };

    const handleConfirmDelivery = async (data: { nome: string; cognome: string; telefono: string }) => {
        try {
            if (!selectedGestioneId) {
                alert("Seleziona una gestione prima di aggiungere/modificare un pass.");
                return;
            }

            if (editingPassItem) {
                await updatePassItem(editingPassItem.id, {
                    cliente_nome: data.nome,
                    cliente_cognome: data.cognome,
                    cliente_telefono: data.telefono,
                });
            } else {
                const res = await fetch("/api/pass/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gestione_id: selectedGestioneId,
                        data_consegna: new Date().toISOString().split("T")[0],
                        cliente_nome: data.nome,
                        cliente_cognome: data.cognome,
                        cliente_telefono: data.telefono,
                        source_type: "pass",
                    }),
                });
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                setPassItems((prev) => [json.row, ...prev]);
            }
            setShowDeliveryPopup(false);
            setEditingPassItem(null);
        } catch (error) {
            console.error("Error saving pass:", error);
            alert("Errore durante il salvataggio");
        }
    };

    const updatePassItem = async (id: string, updates: any) => {
        const res = await fetch(`/api/pass/items?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("Error updating pass:", err);
            alert("Errore aggiornamento");
        } else {
            setPassItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
            if (selectedReferralForApp?.id === id) {
                setSelectedReferralForApp((prev) => (prev ? { ...prev, ...updates } : null));
            }
        }
    };

    const handleDeletePass = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo pass?")) return;
        const res = await fetch(`/api/pass/items?id=${id}`, { method: "DELETE" });
        if (!res.ok) alert("Errore eliminazione");
        else setPassItems((prev) => prev.filter((i) => i.id !== id));
    };

    // Activation Logic
    const openActivationPopup = (item: PassItem) => {
        setSelectedPassId(item.id);
        setShowManualActivationPopup(false);
        setShowActivationPopup(true);
    };

    const openManualReferralPopup = () => {
        setSelectedPassId(null);
        setShowManualActivationPopup(true);
        setShowActivationPopup(true);
    };

    const handleActivatePass = async (data: {
        nome: string;
        cognome: string;
        telefono: string;
        cliente_provenienza?: string;
        source_type?: string;
        paid?: boolean;
        paid_amount?: number;
    }) => {
        const metaNote = data.paid
            ? serializePassItemMeta({
                  paid: true,
                  paid_amount: data.paid_amount ?? currentStrategy.price,
                  paid_date: new Date().toISOString().slice(0, 10),
              })
            : null;

        if (showManualActivationPopup) {
            if (!selectedGestioneId) return;

            const clienteParts = (data.cliente_provenienza || "").split(" ");
            let defaultName = "Manuale";
            if (data.source_type === "social") defaultName = "Social";
            else if (data.source_type === "whatsapp") defaultName = "WhatsApp";

            const clienteNome = clienteParts[0] || defaultName;
            const clienteCognome = clienteParts.slice(1).join(" ") || "";

            const res = await fetch("/api/pass/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gestione_id: selectedGestioneId,
                    data_consegna: new Date().toISOString().split("T")[0],
                    cliente_nome: clienteNome,
                    cliente_cognome: clienteCognome,
                    cliente_telefono: "",
                    referral_nome: data.nome,
                    referral_cognome: data.cognome,
                    referral_telefono: data.telefono,
                    data_attivazione: new Date().toISOString(),
                    is_lead: true,
                    source_type: data.source_type || "pass",
                    note: metaNote,
                }),
            });
            const json = await res.json();
            if (json.error) {
                alert("Errore creazione referral: " + json.error);
            } else {
                setPassItems([json.row, ...passItems]);
            }
        } else {
            if (!selectedPassId) return;
            const existing = passItems.find((p) => p.id === selectedPassId);
            const prevMeta = parsePassItemMeta(existing?.note);
            const mergedNote = data.paid
                ? serializePassItemMeta({
                      ...prevMeta,
                      paid: true,
                      paid_amount: data.paid_amount ?? currentStrategy.price,
                      paid_date: new Date().toISOString().slice(0, 10),
                  })
                : existing?.note || null;

            await updatePassItem(selectedPassId, {
                referral_nome: data.nome,
                referral_cognome: data.cognome,
                referral_telefono: data.telefono,
                data_attivazione: new Date().toISOString(),
                is_lead: true,
                note: mergedNote,
            });
        }
    };

    // Referral Editing Logic
    const handleEditReferral = (item: PassItem) => {
        setEditingReferral(item);
        setShowEditPopup(true);
    };

    const handleUpdateReferral = async (data: any) => {
        if (!editingReferral) return;
        await updatePassItem(editingReferral.id, data);
        setShowEditPopup(false);
        setEditingReferral(null);
    };

    const handleTogglePaid = async (item: PassItem) => {
        const meta = parsePassItemMeta(item.note);
        const nextPaid = !meta.paid;
        const nextNote = serializePassItemMeta({
            ...meta,
            paid: nextPaid,
            paid_amount: nextPaid ? currentStrategy.price : undefined,
            paid_date: nextPaid ? new Date().toISOString().slice(0, 10) : null,
        });
        await updatePassItem(item.id, { note: nextNote });
    };

    const handleQuickProposalUpdate = async (
        item: PassItem,
        action: "made" | "pending" | "declined" | "sync_accept",
        extra?: { tipo_abbonamento?: string; decline_reason?: string }
    ) => {
        setActiveProposalMenu(null);
        const meta = parsePassItemMeta(item.note);

        if (action === "sync_accept") {
            const abb = extra?.tipo_abbonamento || item.agenda_sync?.sold_abbonamento || null;
            const nextNote = serializePassItemMeta({
                ...meta,
                proposal_status: "accepted",
                proposal_date: item.agenda_sync?.sold_date || new Date().toISOString().slice(0, 10),
            });
            await updatePassItem(item.id, {
                iscritto: true,
                tipo_abbonamento: abb,
                note: nextNote,
            });
            return;
        }

        const nextNote = serializePassItemMeta({
            ...meta,
            proposal_status: action,
            proposal_date: action === "pending" ? null : new Date().toISOString().slice(0, 10),
            decline_reason: action === "declined" ? extra?.decline_reason || meta.decline_reason || null : null,
        });
        await updatePassItem(item.id, {
            iscritto: false,
            note: nextNote,
        });
    };

    const handleDeleteReferral = async (id: string) => {
        const item = passItems.find((p) => p.id === id);
        if (!item) return;

        const isPhysicalPass = !item.source_type || item.source_type === "pass";

        if (isPhysicalPass) {
            if (!confirm("Vuoi cancellare i dati del referral? Il pass rimarrà segnato come consegnato.")) return;

            await updatePassItem(id, {
                referral_nome: null,
                referral_cognome: null,
                referral_telefono: null,
                data_attivazione: null,
                is_lead: false,
                iscritto: false,
                tipo_abbonamento: null,
                data_app_1: null,
                esito_app_1: null,
                id_app_1: null,
                data_app_2: null,
                esito_app_2: null,
                id_app_2: null,
                data_app_3: null,
                esito_app_3: null,
                id_app_3: null,
                generated_lead_id: null,
                note: null,
            });
        } else {
            await handleDeletePass(id);
        }

        setShowEditPopup(false);
        setEditingReferral(null);
    };

    // Appointment Logic
    const handleOpenAppointmentDrawer = (item: PassItem, step: number) => {
        setSelectedReferralForApp(item);
        setSelectedAppointmentStep(step);
        setEditingAppointmentEntry(null);
        setEntryDrawerOpen(true);
    };

    const handleAppointmentCreated = async (payload: any) => {
        if (!selectedReferralForApp || !selectedAppointmentStep) return;

        const updates: any = {};
        const date = payload.entry_date?.slice(0, 10) || payload.entry_date;
        const entryId = payload.id;
        const step = selectedAppointmentStep;

        const derivedOutcome = payload.venduto || payload.presentato ? "show" : payload.assente || payload.miss ? "no_show" : "pending";

        if (step >= 1 && step <= 3) {
            updates[`data_app_${step}`] = date;
            updates[`esito_app_${step}`] = derivedOutcome;
            if (entryId) updates[`id_app_${step}`] = entryId;
        } else {
            const meta = parsePassItemMeta(selectedReferralForApp.note);
            const nextMeta = upsertExtraApp(meta, {
                step,
                date,
                esito: derivedOutcome,
                entry_id: entryId || null,
            });
            updates.note = serializePassItemMeta(nextMeta);
        }

        await updatePassItem(selectedReferralForApp.id, updates);
        setEntryDrawerOpen(false);
        setSelectedReferralForApp(null);
        setSelectedAppointmentStep(null);

        if (selectedGestioneId) {
            fetchPassItems(selectedGestioneId);
        }
    };

    const findAppointmentEntry = async (item: PassItem, step: number) => {
        const unified = getUnifiedTrials(item).find((t) => t.step === step);
        const appointmentId = unified?.entry_id || null;
        const date = unified?.date?.slice(0, 10) || null;

        if (appointmentId) {
            const { data } = await supabase.from("entries").select("*").eq("id", appointmentId).maybeSingle();
            if (data) return data;
        }
        if (date) {
            const { data } = await supabase
                .from("entries")
                .select("*")
                .eq("nome", item.referral_nome)
                .eq("cognome", item.referral_cognome)
                .eq("entry_date", date)
                .limit(1)
                .maybeSingle();
            return data;
        }
        return null;
    };

    const handleEditAppointmentSlot = async (item: PassItem, step: number) => {
        setActiveSlotMenu(null);
        const entry = await findAppointmentEntry(item, step);
        if (entry) {
            setSelectedReferralForApp(item);
            setSelectedAppointmentStep(step);
            setEditingAppointmentEntry(entry);
            setEntryDrawerOpen(true);
        } else {
            alert("Appuntamento non trovato in agenda (potrebbe essere stato cancellato).");
            if (confirm("Vuoi pulire questo slot nel Pass?")) {
                await clearPassSlot(item.id, step);
                if (selectedGestioneId) fetchPassItems(selectedGestioneId);
            }
        }
    };

    const handleManualSlotOutcome = async (item: PassItem, step: number, outcome: "show" | "no_show" | "pending") => {
        setActiveSlotMenu(null);
        if (step <= 3) {
            const updates: any = {};
            updates[`esito_app_${step}`] = outcome;
            await updatePassItem(item.id, updates);
        } else {
            const unified = getUnifiedTrials(item).find((t) => t.step === step);
            const meta = parsePassItemMeta(item.note);
            const nextMeta = upsertExtraApp(meta, {
                step,
                date: unified?.date || new Date().toISOString().slice(0, 10),
                esito: outcome,
                entry_id: unified?.entry_id || null,
            });
            await updatePassItem(item.id, { note: serializePassItemMeta(nextMeta) });
        }
        if (selectedGestioneId) fetchPassItems(selectedGestioneId);
    };

    const handleDeleteAppointmentSlot = async (item: PassItem, step: number) => {
        setActiveSlotMenu(null);
        if (!confirm("Sei sicuro di voler eliminare questo appuntamento? Verrà rimosso anche dall'agenda.")) return;

        const entry = await findAppointmentEntry(item, step);
        if (entry) {
            const { error } = await supabase.from("entries").delete().eq("id", entry.id);
            if (error) {
                alert("Errore eliminazione appuntamento: " + error.message);
                return;
            }
        }
        await clearPassSlot(item.id, step);
        if (selectedGestioneId) fetchPassItems(selectedGestioneId);
    };

    const clearPassSlot = async (itemId: string, step: number) => {
        const item = passItems.find((p) => p.id === itemId);
        if (!item) return;

        const { patch, remainingTrials } = buildCompactedTrialsPatch(item, step);
        const res = await fetch(`/api/pass/items?id=${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            alert("Errore aggiornamento slot");
            return;
        }
        setPassItems((prev) =>
            prev.map((p) =>
                p.id === itemId
                    ? {
                          ...p,
                          ...patch,
                          agenda_sync: p.agenda_sync ? { ...p.agenda_sync, trials: remainingTrials } : null,
                      }
                    : p
            )
        );
    };

    // Sync All from Agenda helper (persists agenda outcomes & sales into pass_items)
    const unsyncedUpdates = useMemo(() => {
        const updatesList: { item: PassItem; patch: Record<string, any> }[] = [];
        for (const item of passItems) {
            if (!item.is_lead || !item.agenda_sync) continue;
            const patch: Record<string, any> = {};
            const sync = item.agenda_sync;
            let meta = parsePassItemMeta(item.note);
            let metaChanged = false;

            for (const s of sync.trials || []) {
                if (s.step <= 3) {
                    if (s.date && !item[`data_app_${s.step}` as keyof PassItem]) {
                        patch[`data_app_${s.step}`] = s.date;
                    }
                    if (s.entry_id && !item[`id_app_${s.step}` as keyof PassItem]) {
                        patch[`id_app_${s.step}`] = s.entry_id;
                    }
                    if (s.status !== "pending" && item[`esito_app_${s.step}` as keyof PassItem] !== s.status) {
                        patch[`esito_app_${s.step}`] = s.status;
                    }
                } else if (s.date) {
                    const existing = meta.extra_apps?.find((e) => e.step === s.step);
                    if (
                        !existing ||
                        existing.date !== s.date ||
                        (s.entry_id && existing.entry_id !== s.entry_id) ||
                        (s.status !== "pending" && existing.esito !== s.status)
                    ) {
                        meta = upsertExtraApp(meta, {
                            step: s.step,
                            date: s.date,
                            esito: s.status !== "pending" ? s.status : existing?.esito || "pending",
                            entry_id: s.entry_id || existing?.entry_id || null,
                        });
                        metaChanged = true;
                    }
                }
            }

            if (metaChanged) {
                patch.note = serializePassItemMeta(meta);
            }

            if (sync.sold_in_agenda && !item.iscritto) {
                patch.iscritto = true;
                if (sync.sold_abbonamento) patch.tipo_abbonamento = sync.sold_abbonamento;
            }

            if (Object.keys(patch).length > 0) {
                updatesList.push({ item, patch });
            }
        }
        return updatesList;
    }, [passItems]);

    const handleSyncAllToDb = async () => {
        if (unsyncedUpdates.length === 0 || syncing) return;
        setSyncing(true);
        try {
            await Promise.all(
                unsyncedUpdates.map(({ item, patch }) =>
                    fetch(`/api/pass/items?id=${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(patch),
                    })
                )
            );
            if (selectedGestioneId) {
                await fetchPassItems(selectedGestioneId);
            }
        } finally {
            setSyncing(false);
        }
    };

    // WhatsApp Links
    const getWhatsAppLink = (phone: string, message: string) => {
        return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
    };

    const sendClientFollowUp = async (item: PassItem) => {
        if (!item.cliente_telefono) return;
        const message = `Ciao ${item.cliente_nome}, 
Ti scriviamo da Restart Fitness Club!

Qualche giorno fa ti abbiamo affidato un pass da donare a qualcuno a cui vuoi bene… un piccolo gesto che può diventare il primo passo verso più movimento, più energia, più benessere.

Crediamo davvero che muoversi cambi la vita: rende la mente più leggera, il corpo più vivo e le giornate un po’ più nostre. Per questo ci chiedevamo se, nel frattempo, hai pensato a qualcuno a cui potrebbe far bene questo invito.
Se la risposta è sì, puoi lasciarci il suo contatto, ci farebbe piacere farci una chiacchierata, capire come sta e mettere a disposizione il nostro aiuto, un passo alla volta, a ritrovare il piacere di muoversi e prendersi cura di sé.

Che ne pensi? Facci sapere, grazie di cuore!`;
        window.open(getWhatsAppLink(item.cliente_telefono, message), "_blank");
        if (!item.whatsapp_sent_date) {
            await updatePassItem(item.id, { whatsapp_sent_date: new Date().toISOString() });
        }
    };

    // Delivery Highlight & Reminder helper
    const shouldHighlightDelivery = (item: PassItem) => {
        if (item.whatsapp_sent_date || item.is_lead || item.data_attivazione) return false;
        const diffDays = getDaysDiffFromToday(item.data_consegna);
        return diffDays !== null && diffDays >= 3;
    };

    // Pipeline stage helper (supports unlimited trials)
    const getPipelineInfo = (item: PassItem) => {
        const proposal = getEffectiveProposalState(item, currentStrategy);
        const sync = item.agenda_sync;
        const trials = getUnifiedTrials(item);
        const hasApp1 = trials.length > 0;
        const hasAnyShow = Boolean(sync?.has_any_show) || trials.some((t) => t.status === "show");

        const chronologicalTrials = [...trials]
            .filter((t) => t.date)
            .sort((a, b) => ((a.date || "") > (b.date || "") ? 1 : -1));
        const hasUnrecoveredNoShowLocal = chronologicalTrials.some((t, idx) => {
            if (t.status !== "no_show") return false;
            return !chronologicalTrials.slice(idx + 1).some((later) => (later.date || "") >= (t.date || ""));
        });
        const hasAnyNoShow = Boolean(sync?.has_unrecovered_no_show) || hasUnrecoveredNoShowLocal;

        const isConcluso = proposal.phase === "accepted" || proposal.phase === "declined";
        const isDaFissare = !isConcluso && !hasApp1;
        const isFareProposta = !isConcluso && hasAnyShow;
        const isDaRecuperare = !isConcluso && hasAnyNoShow;

        return {
            proposal,
            hasApp1,
            hasAnyShow,
            hasAnyNoShow,
            isConcluso,
            isDaFissare,
            isFareProposta,
            isDaRecuperare,
        };
    };

    // KPI Computations
    const kpiStats = useMemo(() => {
        const physicalPasses = passItems.filter((i) => !i.source_type || i.source_type === "pass");
        const activatedFromClients = passItems.filter(
            (i) => i.is_lead && (!i.source_type || i.source_type === "pass" || i.source_type === "manual_pass")
        );
        const toRemindCount = physicalPasses.filter((i) => shouldHighlightDelivery(i)).length;
        const allLeads = passItems.filter((i) => i.is_lead);

        let firstTrialDoneCount = 0;
        let radarPropostaCount = 0;
        let urgentPropostaCount = 0;
        let enrolledCount = 0;
        let paidCount = 0;
        let paidRevenue = 0;

        let countDaFissare = 0;
        let countFareProposta = 0;
        let countDaRecuperare = 0;
        let countConclusi = 0;

        for (const item of allLeads) {
            const pInfo = getPipelineInfo(item);
            if (pInfo.hasAnyShow) firstTrialDoneCount++;
            if (
                pInfo.proposal.phase === "ready_proposal" ||
                pInfo.proposal.phase === "urgent_proposal" ||
                pInfo.proposal.phase === "made"
            ) {
                radarPropostaCount++;
            }
            if (pInfo.proposal.phase === "urgent_proposal") {
                urgentPropostaCount++;
            }
            if (pInfo.proposal.phase === "accepted") {
                enrolledCount++;
            }
            if (pInfo.isDaFissare) countDaFissare++;
            if (pInfo.isFareProposta) countFareProposta++;
            if (pInfo.isDaRecuperare) countDaRecuperare++;
            if (pInfo.isConcluso) countConclusi++;

            const meta = parsePassItemMeta(item.note);
            if (meta.paid) {
                paidCount++;
                paidRevenue += meta.paid_amount ?? currentStrategy.price;
            }
        }

        const activationRate =
            physicalPasses.length > 0
                ? Math.round((activatedFromClients.length / physicalPasses.length) * 100)
                : 0;
        const conversionRate =
            allLeads.length > 0 ? Math.round((enrolledCount / allLeads.length) * 100) : 0;
        const showRate =
            allLeads.length > 0 ? Math.round((firstTrialDoneCount / allLeads.length) * 100) : 0;

        return {
            physicalCount: physicalPasses.length,
            toRemindCount,
            totalLeads: allLeads.length,
            activatedFromClients: activatedFromClients.length,
            activatedSocial: allLeads.filter((i) => i.source_type === "social").length,
            activatedWa: allLeads.filter((i) => i.source_type === "whatsapp").length,
            activationRate,
            firstTrialDoneCount,
            showRate,
            radarPropostaCount,
            urgentPropostaCount,
            enrolledCount,
            conversionRate,
            paidCount,
            paidRevenue,
            countDaFissare,
            countFareProposta,
            countDaRecuperare,
            countConclusi,
        };
    }, [passItems, currentStrategy]);

    // Filtering & Sorting
    const filteredItems = useMemo(() => {
        const search = searchTerm.toLowerCase();

        const list = passItems.filter((item) => {
            const matchesSearch =
                (item.cliente_nome || "").toLowerCase().includes(search) ||
                (item.cliente_cognome || "").toLowerCase().includes(search) ||
                (item.referral_nome || "").toLowerCase().includes(search) ||
                (item.referral_cognome || "").toLowerCase().includes(search) ||
                (item.referral_telefono || "").toLowerCase().includes(search);

            if (!matchesSearch) return false;

            if (activeTab === "distribuzione") {
                const isPassSource = !item.source_type || item.source_type === "pass";
                if (!isPassSource) return false;

                if (deliveryFilter === "to_remind") return shouldHighlightDelivery(item);
                if (deliveryFilter === "pending") return !item.is_lead;
                if (deliveryFilter === "activated") return item.is_lead;
                return true;
            } else {
                if (!item.is_lead) return false;

                if (pipelineFilter !== "all") {
                    const pInfo = getPipelineInfo(item);
                    if (pipelineFilter === "da_fissare") return pInfo.isDaFissare;
                    if (pipelineFilter === "fare_proposta") return pInfo.isFareProposta;
                    if (pipelineFilter === "da_recuperare") return pInfo.isDaRecuperare;
                    if (pipelineFilter === "conclusi") return pInfo.isConcluso;
                }
                return true;
            }
        });

        // Apply sorting
        if (sortConfig) {
            return [...list].sort((a, b) => {
                if (sortConfig.key === "data_consegna") {
                    const dateA = new Date(a.data_consegna).getTime();
                    const dateB = new Date(b.data_consegna).getTime();
                    return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
                }
                if (sortConfig.key === "is_lead") {
                    const valA = a.is_lead ? 1 : 0;
                    const valB = b.is_lead ? 1 : 0;
                    return sortConfig.direction === "asc" ? valA - valB : valB - valA;
                }
                return 0;
            });
        }

        // Default smart sorting for "fare_proposta": urgent proposals first!
        if (activeTab === "referral" && pipelineFilter === "fare_proposta") {
            return [...list].sort((a, b) => {
                const pA = getEffectiveProposalState(a, currentStrategy);
                const pB = getEffectiveProposalState(b, currentStrategy);
                const rank = (phase: string) =>
                    phase === "urgent_proposal" ? 0 : phase === "ready_proposal" ? 1 : 2;
                return rank(pA.phase) - rank(pB.phase);
            });
        }

        return list;
    }, [passItems, searchTerm, activeTab, deliveryFilter, pipelineFilter, sortConfig, currentStrategy]);

    // Helper to render Proposal Badge
    const renderProposalCell = (item: PassItem) => {
        const { phase, daysSinceFirstShow } = getEffectiveProposalState(item, currentStrategy);
        const meta = parsePassItemMeta(item.note);
        const sync = item.agenda_sync;

        const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveProposalMenu(
                activeProposalMenu?.itemId === item.id
                    ? null
                    : { itemId: item.id, position: { top: rect.bottom, left: rect.left + rect.width / 2 } }
            );
        };

        if (phase === "accepted") {
            const abbName = item.tipo_abbonamento || sync?.sold_abbonamento || "Iscritto";
            const isUnsyncedFromAgenda = Boolean(sync?.sold_in_agenda && !item.iscritto);
            return (
                <button
                    onClick={openMenu}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200/70 transition-colors"
                    title={isUnsyncedFromAgenda ? "Vendita rilevata in Agenda! Clicca per gestire" : "Iscritto"}
                >
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>{abbName}</span>
                    {isUnsyncedFromAgenda && (
                        <span className="text-[9px] bg-emerald-700 text-white px-1 py-0.2 rounded">SYNC</span>
                    )}
                </button>
            );
        }

        if (phase === "declined") {
            return (
                <button
                    onClick={openMenu}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                    title={meta.decline_reason || "Negativo / Non Interessato"}
                >
                    <XCircle size={13} />
                    <span>{meta.decline_reason || "Non Iscritto"}</span>
                </button>
            );
        }

        if (phase === "made") {
            return (
                <button
                    onClick={openMenu}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    title="Proposta presentata, in attesa risposta"
                >
                    <MessageSquare size={13} />
                    <span>Proposta {meta.proposal_date ? formatDate(meta.proposal_date).slice(0, 5) : "Fatta"}</span>
                </button>
            );
        }

        if (phase === "urgent_proposal") {
            return (
                <button
                    onClick={openMenu}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:opacity-95 animate-pulse"
                    title={`Ha svolto la 1ª prova ${daysSinceFirstShow} giorni fa! Clicca per segnare la proposta`}
                >
                    <Flame size={13} className="fill-white" />
                    <span>PROPOSTA ({daysSinceFirstShow}gg fa)</span>
                </button>
            );
        }

        if (phase === "ready_proposal") {
            return (
                <button
                    onClick={openMenu}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
                    title="1ª Prova fatta! Pronto per la proposta commerciale"
                >
                    <Flame size={13} className="text-amber-600" />
                    <span>Fare Proposta ({daysSinceFirstShow === 0 ? "oggi" : `${daysSinceFirstShow}gg`})</span>
                </button>
            );
        }

        return (
            <button
                onClick={openMenu}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300 hover:text-slate-600 transition-colors"
            >
                <Clock size={12} />
                <span>In attesa prova</span>
            </button>
        );
    };

    const getStepsToRender = (trials: SyncedSlotInfo[], isClosed = false): number[] => {
        const existingSteps = trials.map((t) => t.step).sort((a, b) => a - b);
        const maxExisting = existingSteps.length > 0 ? Math.max(...existingSteps) : 0;

        // Once enrolled or closed, show ONLY the actual completed/recorded trials (never show '+' or invent future slots)
        if (isClosed) {
            return existingSteps;
        }

        const target = currentStrategy.trials_count;

        if (target === 0) {
            // Unlimited / dynamic: show all existing trials + one '+' button for the next trial
            const nextStep = maxExisting + 1;
            const set = new Set([...existingSteps, nextStep]);
            return Array.from(set).sort((a, b) => a - b);
        }

        const upper = Math.max(target, maxExisting);
        const steps: number[] = [];
        for (let s = 1; s <= upper; s++) steps.push(s);

        // Always allow adding an extra trial beyond the expected count if all current slots are filled
        if (steps.every((s) => existingSteps.includes(s))) {
            steps.push(upper + 1);
        }
        return steps;
    };

    const renderTrialSlotButton = (item: PassItem, step: number, slot?: SyncedSlotInfo, isMobileLayout = false) => {
        const date = slot?.date || null;
        const outcome = slot?.status || "pending";

        return (
            <button
                key={step}
                onClick={(e) => {
                    if (date) {
                        if (isMobileLayout) {
                            handleEditAppointmentSlot(item, step);
                        } else {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveSlotMenu(
                                activeSlotMenu?.itemId === item.id && activeSlotMenu?.step === step
                                    ? null
                                    : {
                                          itemId: item.id,
                                          step,
                                          position: {
                                              top: rect.bottom,
                                              left: rect.left + rect.width / 2,
                                          },
                                      }
                            );
                        }
                    } else {
                        handleOpenAppointmentDrawer(item, step);
                    }
                }}
                className={cn(
                    "relative rounded-lg border flex items-center justify-center transition-all",
                    isMobileLayout ? "w-full h-11 px-2" : "min-h-[2.35rem] px-2.5 py-1 min-w-[3.4rem]",
                    date
                        ? outcome === "show"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                            : outcome === "no_show"
                                ? "bg-rose-50 border-rose-300 text-rose-700"
                                : "bg-purple-50 border-purple-200 text-purple-700"
                        : "bg-white border-slate-200 text-slate-300 hover:border-purple-300 hover:text-purple-500"
                )}
                title={
                    date
                        ? `Prova ${step}: ${formatDate(date)}${slot?.time ? ` alle ${slot.time}` : ""}${slot?.consulente ? ` (${slot.consulente})` : ""} — Stato: ${outcome === "show" ? "Presentato" : outcome === "no_show" ? "Assente/Miss" : "In attesa"}`
                        : `Fissa Prova ${step} in Agenda`
                }
            >
                <span
                    className={cn(
                        "absolute -top-1.5 -left-1 px-1 rounded text-[9px] font-black leading-tight border",
                        date
                            ? outcome === "show"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : outcome === "no_show"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                >
                    {step}°
                </span>
                {date ? (
                    <div className="flex flex-col items-center leading-none pt-0.5">
                        <span className="text-xs font-bold">{new Date(date).getDate()}</span>
                        <span className="text-[9px] uppercase font-bold">
                            {new Date(date).toLocaleString("it-IT", { month: "short" })}
                        </span>
                    </div>
                ) : (
                    <Plus size={14} />
                )}
            </button>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 min-h-[101vh]">
            {/* Header & Gestioni / Strategia Selector */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <span>Consegna Pass</span>
                        {unsyncedUpdates.length > 0 && (
                            <button
                                onClick={handleSyncAllToDb}
                                disabled={syncing}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition-colors shadow-xs"
                                title="Ci sono esiti o iscrizioni rilevati in Agenda da salvare nei Pass"
                            >
                                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                                <span>Sincronizza {unsyncedUpdates.length} aggiornamenti dall&apos;Agenda</span>
                            </button>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Monitora consegna pass, prove sincronizzate con l&apos;Agenda e proposte commerciali
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto relative">
                    {/* Gestione Dropdown */}
                    <div className="relative flex-1 sm:flex-none">
                        <button
                            onClick={() => setIsGestioneDropdownOpen(!isGestioneDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full sm:w-auto sm:min-w-[15rem] justify-between"
                        >
                            <span className="font-semibold text-slate-700 truncate">
                                {selectedGestione?.nome || "Seleziona Campagna"}
                            </span>
                            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                        </button>

                        {isGestioneDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => {
                                        setIsGestioneDropdownOpen(false);
                                        setEditingGestioneId(null);
                                    }}
                                />
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="max-h-64 overflow-y-auto p-1">
                                        {gestioni.map((g) => (
                                            <div
                                                key={g.id}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg transition-colors group",
                                                    selectedGestioneId === g.id ? "bg-purple-50" : "hover:bg-slate-50"
                                                )}
                                            >
                                                {editingGestioneId === g.id ? (
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            className="flex-1 min-w-0 px-2 py-1 text-sm border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                            value={editingGestioneName}
                                                            onChange={(e) => setEditingGestioneName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleUpdateGestione(g.id);
                                                                if (e.key === "Escape") setEditingGestioneId(null);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateGestione(g.id)}
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingGestioneId(null)}
                                                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedGestioneId(g.id);
                                                                setIsGestioneDropdownOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex-1 text-left text-sm font-medium truncate px-2",
                                                                selectedGestioneId === g.id ? "text-purple-700 font-bold" : "text-slate-700"
                                                            )}
                                                        >
                                                            {g.nome}
                                                        </button>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingGestioneId(g.id);
                                                                    setEditingGestioneName(g.nome);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteGestione(g.id);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                                        <button
                                            onClick={handleOpenNewGestione}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                                        >
                                            <Plus size={16} />
                                            Nuova Campagna Pass
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Config Strategia Button */}
                    {selectedGestione && (
                        <button
                            onClick={handleOpenEditStrategy}
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-300 hover:text-purple-700 text-slate-700 text-sm font-bold transition-all"
                            title="Imposta formula gratuita o a pagamento, numero prove e giorni alert proposta"
                        >
                            <Settings2 size={16} className="text-purple-600" />
                            <span>Strategia</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Strategy Banner */}
            {selectedGestione && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-white to-cyan-50/60 border border-purple-100 rounded-2xl px-4 py-3 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                            Strategia Attiva:
                        </span>
                        {currentStrategy.strategy_type === "paid" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Euro size={13} className="text-amber-600" />
                                Prove a Pagamento (€{currentStrategy.price})
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                <Gift size={13} className="text-emerald-600" />
                                Prove Gratuite
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-white text-slate-700 border border-slate-200">
                            <Calendar size={13} className="text-purple-500" />
                            {currentStrategy.trials_count === 0
                                ? "Prove libere (illimitate)"
                                : `${currentStrategy.trials_count} ${currentStrategy.trials_count === 1 ? "Prova" : "Prove"} (+ extra)`}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-white text-slate-700 border border-slate-200">
                            <Flame size={13} className="text-orange-500" />
                            Proposta entro {currentStrategy.proposal_after_days}gg dalla 1ª prova
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span>Sincronizzato in tempo reale con Agenda</span>
                    </div>
                </div>
            )}

            {/* KPI Funnel Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                    onClick={() => {
                        setActiveTab("distribuzione");
                        setDeliveryFilter("all");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-left hover:border-purple-200 transition-all"
                >
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pass Consegnati</div>
                    <div className="text-2xl font-black text-slate-800">{kpiStats.physicalCount}</div>
                    <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                        {kpiStats.toRemindCount > 0 ? `${kpiStats.toRemindCount} da sollecitare (+3gg)` : "Tutti gestiti"}
                    </div>
                </button>

                <button
                    onClick={() => {
                        setActiveTab("referral");
                        setPipelineFilter("all");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-left hover:border-purple-200 transition-all"
                >
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pass Attivati</div>
                    <div className="text-2xl font-black text-purple-600">{kpiStats.totalLeads}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                        {kpiStats.activationRate}% attivazione da clienti
                    </div>
                </button>

                <button
                    onClick={() => {
                        setActiveTab("referral");
                        setPipelineFilter("fare_proposta");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-left hover:border-emerald-200 transition-all"
                >
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">1ª Prova Fatta</div>
                    <div className="text-2xl font-black text-emerald-600">{kpiStats.firstTrialDoneCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                        {kpiStats.showRate}% show sugli attivati
                    </div>
                </button>

                <button
                    onClick={() => {
                        setActiveTab("referral");
                        setPipelineFilter("fare_proposta");
                    }}
                    className={cn(
                        "p-3.5 rounded-xl border shadow-sm text-left transition-all",
                        kpiStats.urgentPropostaCount > 0
                            ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300"
                            : "bg-white border-slate-100 hover:border-amber-200"
                    )}
                >
                    <div className="text-orange-700 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Flame size={11} />
                        Radar Proposta
                    </div>
                    <div className="text-2xl font-black text-orange-600">{kpiStats.radarPropostaCount}</div>
                    <div className="text-[11px] font-semibold text-orange-700 mt-0.5">
                        {kpiStats.urgentPropostaCount > 0
                            ? `${kpiStats.urgentPropostaCount} urgenti da chiudere!`
                            : "In finestra proposta"}
                    </div>
                </button>

                <button
                    onClick={() => {
                        setActiveTab("referral");
                        setPipelineFilter("conclusi");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-left hover:border-blue-200 transition-all"
                >
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Iscritti</div>
                    <div className="text-2xl font-black text-blue-600">{kpiStats.enrolledCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                        {kpiStats.conversionRate}% sugli attivati
                    </div>
                </button>

                {currentStrategy.strategy_type === "paid" ? (
                    <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-sm">
                        <div className="text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Euro size={11} />
                            Quote Pagate
                        </div>
                        <div className="text-2xl font-black text-amber-900">€{kpiStats.paidRevenue}</div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                            {kpiStats.paidCount} su {kpiStats.totalLeads} prospect
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Fonti Attivazione</div>
                        <div className="text-xs font-bold text-slate-700 space-y-0.5 mt-1">
                            <div className="flex justify-between">
                                <span>Clienti:</span>
                                <span className="text-purple-600">{kpiStats.activatedFromClients}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Social / WA:</span>
                                <span className="text-pink-600">{kpiStats.activatedSocial + kpiStats.activatedWa}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab("distribuzione")}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === "distribuzione"
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users size={18} />
                        Pass Consegnati
                        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                            {kpiStats.physicalCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("referral")}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === "referral"
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <UserPlus size={18} />
                        Pass Attivati (Prospect)
                        {kpiStats.totalLeads > 0 && (
                            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                                {kpiStats.totalLeads}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Sub-filter Pills: Metodo 1 (Consegne) OR Metodo 3 (Pipeline Operativa) */}
            {activeTab === "distribuzione" ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setDeliveryFilter("all")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            deliveryFilter === "all"
                                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        Tutti ({kpiStats.physicalCount})
                    </button>
                    <button
                        onClick={() => setDeliveryFilter("to_remind")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            deliveryFilter === "to_remind"
                                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                : "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100"
                        )}
                    >
                        <AlertTriangle size={13} />
                        Da Sollecitare +3gg ({kpiStats.toRemindCount})
                    </button>
                    <button
                        onClick={() => setDeliveryFilter("pending")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            deliveryFilter === "pending"
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        Non ancora attivati
                    </button>
                    <button
                        onClick={() => setDeliveryFilter("activated")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            deliveryFilter === "activated"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        )}
                    >
                        ✅ Attivati
                    </button>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setPipelineFilter("all")}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all",
                            pipelineFilter === "all"
                                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        Tutti ({kpiStats.totalLeads})
                    </button>

                    <button
                        onClick={() => setPipelineFilter("da_fissare")}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            pipelineFilter === "da_fissare"
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-purple-50/60 text-purple-800 border-purple-200 hover:bg-purple-100"
                        )}
                    >
                        <Calendar size={13} />
                        Da Fissare 1ª Prova ({kpiStats.countDaFissare})
                    </button>

                    <button
                        onClick={() => setPipelineFilter("fare_proposta")}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            pipelineFilter === "fare_proposta"
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs"
                                : "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
                        )}
                    >
                        <Flame size={13} />
                        In Prova / Fare Proposta ({kpiStats.countFareProposta})
                    </button>

                    <button
                        onClick={() => setPipelineFilter("da_recuperare")}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            pipelineFilter === "da_recuperare"
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                        )}
                    >
                        <Clock size={13} />
                        No-Show da Recuperare ({kpiStats.countDaRecuperare})
                    </button>

                    <button
                        onClick={() => setPipelineFilter("conclusi")}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            pipelineFilter === "conclusi"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        )}
                    >
                        <Award size={13} />
                        Conclusi ({kpiStats.countConclusi})
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca cliente, referral o telefono..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === "distribuzione" ? (
                    <button
                        onClick={handleAddPass}
                        className="w-full md:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200 text-sm"
                    >
                        <Plus size={18} />
                        Nuovo Pass Consegnato
                    </button>
                ) : (
                    <button
                        onClick={openManualReferralPopup}
                        className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 text-sm"
                    >
                        <Plus size={18} />
                        Nuovo Pass Attivato
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Caricamento e sincronizzazione con Agenda...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">Nessun elemento trovato per i filtri selezionati</div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredItems.map((item) => {
                                const meta = parsePassItemMeta(item.note);
                                const sync = item.agenda_sync;
                                const proposal = getEffectiveProposalState(item, currentStrategy);
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "bg-white p-4 rounded-xl border shadow-sm space-y-3",
                                            activeTab === "distribuzione" && shouldHighlightDelivery(item)
                                                ? "border-amber-300 bg-amber-50/40"
                                                : "border-slate-100"
                                        )}
                                    >
                                        {activeTab === "distribuzione" ? (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {item.cliente_nome} {item.cliente_cognome}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            Consegnato il {formatDate(item.data_consegna)}
                                                        </div>
                                                    </div>
                                                    {item.is_lead ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                            Attivato ({item.referral_nome})
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openActivationPopup(item)}
                                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm"
                                                        >
                                                            Attiva
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {item.cliente_telefono && (
                                                        <button
                                                            onClick={() => sendClientFollowUp(item)}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                                                                item.whatsapp_sent_date
                                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                                            )}
                                                        >
                                                            <MessageCircle size={16} />
                                                            {item.whatsapp_sent_date ? "Sollecito Inviato" : "WhatsApp"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditPass(item)}
                                                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePass(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-base">
                                                            {item.referral_nome} {item.referral_cognome}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-mono">{item.referral_telefono}</div>
                                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            <ArrowRight size={12} />
                                                            da {item.cliente_nome} {item.cliente_cognome}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {currentStrategy.strategy_type === "paid" && (
                                                            <button
                                                                onClick={() => handleTogglePaid(item)}
                                                                className={cn(
                                                                    "px-2 py-1 rounded-lg text-[10px] font-bold border",
                                                                    meta.paid
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                                )}
                                                            >
                                                                {meta.paid ? `€${meta.paid_amount ?? currentStrategy.price} OK` : "Da pagare"}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditReferral(item)}
                                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-50">
                                                    {(() => {
                                                        const isClosed = proposal.phase === "accepted" || proposal.phase === "declined";
                                                        const unifiedTrials = getUnifiedTrials(item);
                                                        const steps = getStepsToRender(unifiedTrials, isClosed);
                                                        if (steps.length === 0) {
                                                            return (
                                                                <span className="text-xs text-slate-400 italic">
                                                                    Nessuna prova registrata prima della chiusura
                                                                </span>
                                                            );
                                                        }
                                                        return steps.map((step) => {
                                                            const slot = unifiedTrials.find((t) => t.step === step);
                                                            return (
                                                                <div key={step} className="flex-1 min-w-[4.5rem]">
                                                                    {renderTrialSlotButton(item, step, slot, true)}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>

                                                <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                                                    <div>{renderProposalCell(item)}</div>
                                                    {proposal.phase !== "accepted" && (
                                                        <button
                                                            onClick={() => handleEditReferral(item)}
                                                            className="text-xs font-bold text-purple-600 hover:underline"
                                                        >
                                                            Gestisci
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        {activeTab === "distribuzione" ? (
                                            <>
                                                <th
                                                    className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                                    onClick={() => handleSort("data_consegna")}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Data Consegna
                                                        {sortConfig?.key === "data_consegna" &&
                                                            (sortConfig.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente Socio</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Sollecito WA</th>
                                                <th
                                                    className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                                    onClick={() => handleSort("is_lead")}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Stato / Attivazione
                                                        {sortConfig?.key === "is_lead" &&
                                                            (sortConfig.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prospect / Referral</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Telefono</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provenienza</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                                    Prove (Sync Agenda)
                                                </th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Radar Proposta</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map((item) => {
                                        const meta = parsePassItemMeta(item.note);
                                        const sync = item.agenda_sync;
                                        const isUrgentDelivery = activeTab === "distribuzione" && shouldHighlightDelivery(item);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    "hover:bg-slate-50/80 transition-colors group",
                                                    isUrgentDelivery ? "bg-amber-50/40 hover:bg-amber-50/70" : ""
                                                )}
                                            >
                                                {activeTab === "distribuzione" ? (
                                                    <>
                                                        <td className="p-4 text-sm text-slate-600 font-mono">
                                                            <div>{formatDate(item.data_consegna)}</div>
                                                            {isUrgentDelivery && (
                                                                <span className="text-[10px] font-sans font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                    +{getDaysDiffFromToday(item.data_consegna)}gg fa
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">
                                                                {item.cliente_nome} {item.cliente_cognome}
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-mono">{item.cliente_telefono}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.cliente_telefono && (
                                                                <button
                                                                    onClick={() => sendClientFollowUp(item)}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                                        item.whatsapp_sent_date
                                                                            ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                                                            : isUrgentDelivery
                                                                                ? "text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                                                                                : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                                    )}
                                                                    title={
                                                                        item.whatsapp_sent_date
                                                                            ? `Inviato il ${new Date(item.whatsapp_sent_date).toLocaleDateString("it-IT")}`
                                                                            : "Invia messaggio sollecito WhatsApp"
                                                                    }
                                                                >
                                                                    {item.whatsapp_sent_date ? <Check size={14} /> : <MessageCircle size={15} />}
                                                                    <span>
                                                                        {item.whatsapp_sent_date
                                                                            ? formatDate(item.whatsapp_sent_date).slice(0, 5)
                                                                            : "Sollecita"}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.is_lead ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveTab("referral");
                                                                        setSearchTerm(`${item.referral_nome || ""} ${item.referral_cognome || ""}`.trim());
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                                                    title="Clicca per vedere il percorso di questo amico"
                                                                >
                                                                    <Check size={12} />
                                                                    <span>
                                                                        Attivato: {item.referral_nome} {item.referral_cognome}
                                                                    </span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openActivationPopup(item)}
                                                                    className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Attiva Pass
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEditPass(item)}
                                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    title="Modifica Cliente"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePass(item.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Elimina"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800">
                                                                    {item.referral_nome} {item.referral_cognome}
                                                                </span>
                                                                {currentStrategy.strategy_type === "paid" && (
                                                                    <button
                                                                        onClick={() => handleTogglePaid(item)}
                                                                        className={cn(
                                                                            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors",
                                                                            meta.paid
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                                        )}
                                                                        title="Clicca per cambiare stato pagamento quota prove"
                                                                    >
                                                                        <Euro size={10} />
                                                                        <span>
                                                                            {meta.paid
                                                                                ? `${meta.paid_amount ?? currentStrategy.price} Pagato`
                                                                                : "Da pagare"}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {meta.text && (
                                                                <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate" title={meta.text}>
                                                                    📝 {meta.text}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-slate-600 font-mono">{item.referral_telefono}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-slate-700 font-medium">
                                                                {item.cliente_nome} {item.cliente_cognome}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                                                <span className="capitalize">
                                                                    {item.source_type === "social"
                                                                        ? "Social"
                                                                        : item.source_type === "whatsapp"
                                                                            ? "WhatsApp"
                                                                            : "Pass"}
                                                                </span>
                                                                {item.data_attivazione && (
                                                                    <span>• {formatDate(item.data_attivazione)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[290px] mx-auto pt-1">
                                                                {(() => {
                                                                    const proposal = getEffectiveProposalState(item, currentStrategy);
                                                                    const isClosed = proposal.phase === "accepted" || proposal.phase === "declined";
                                                                    const unifiedTrials = getUnifiedTrials(item);
                                                                    const steps = getStepsToRender(unifiedTrials, isClosed);
                                                                    if (steps.length === 0) {
                                                                        return (
                                                                            <span className="text-[11px] text-slate-400 italic">
                                                                                Nessuna prova
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return steps.map((step) => {
                                                                        const slot = unifiedTrials.find((t) => t.step === step);
                                                                        return renderTrialSlotButton(item, step, slot, false);
                                                                    });
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">{renderProposalCell(item)}</td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEditReferral(item)}
                                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    title="Modifica Prospect, Proposta & Iscrizione"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteReferral(item.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Elimina"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Popups & Modals */}
            <PassStrategyModal
                isOpen={showStrategyModal}
                onClose={() => setShowStrategyModal(false)}
                onConfirm={handleSaveStrategy}
                initialName={isCreatingGestione ? "" : selectedGestione?.nome || ""}
                initialStrategy={isCreatingGestione ? DEFAULT_PASS_STRATEGY : currentStrategy}
                isNew={isCreatingGestione}
            />

            <ReferralActivationPopup
                isOpen={showActivationPopup}
                onClose={() => setShowActivationPopup(false)}
                onConfirm={handleActivatePass}
                clientName={
                    selectedPassId
                        ? passItems.find((p) => p.id === selectedPassId)?.cliente_nome +
                          " " +
                          passItems.find((p) => p.id === selectedPassId)?.cliente_cognome
                        : ""
                }
                isManual={showManualActivationPopup}
                strategy={currentStrategy}
            />

            <PassDeliveryPopup
                isOpen={showDeliveryPopup}
                onClose={() => setShowDeliveryPopup(false)}
                onConfirm={handleConfirmDelivery}
                initialData={
                    editingPassItem
                        ? {
                              nome: editingPassItem.cliente_nome,
                              cognome: editingPassItem.cliente_cognome,
                              telefono: editingPassItem.cliente_telefono,
                          }
                        : null
                }
            />

            <PassEditPopup
                isOpen={showEditPopup}
                onClose={() => setShowEditPopup(false)}
                onConfirm={handleUpdateReferral}
                onDelete={() => editingReferral && handleDeleteReferral(editingReferral.id)}
                initialData={
                    editingReferral
                        ? {
                              referral_nome: editingReferral.referral_nome || "",
                              referral_cognome: editingReferral.referral_cognome || "",
                              referral_telefono: editingReferral.referral_telefono || "",
                              iscritto: Boolean(editingReferral.iscritto || editingReferral.agenda_sync?.sold_in_agenda),
                              tipo_abbonamento:
                                  editingReferral.tipo_abbonamento ||
                                  editingReferral.agenda_sync?.sold_abbonamento ||
                                  null,
                              note: editingReferral.note || null,
                          }
                        : null
                }
                subscriptionTypes={subscriptionTypes}
                strategy={currentStrategy}
            />

            <EntryDrawer
                isOpen={entryDrawerOpen}
                onClose={() => {
                    setEntryDrawerOpen(false);
                    setEditingAppointmentEntry(null);
                    setSelectedReferralForApp(null);
                }}
                onSave={handleAppointmentCreated}
                allowSectionChange={true}
                entry={editingAppointmentEntry}
                initialData={
                    !editingAppointmentEntry && selectedReferralForApp
                        ? {
                              nome: selectedReferralForApp.referral_nome,
                              cognome: selectedReferralForApp.referral_cognome,
                              telefono: selectedReferralForApp.referral_telefono,
                              section: "APPUNTAMENTI (Pianificazione)",
                              note: `Referral di ${selectedReferralForApp.cliente_nome} ${selectedReferralForApp.cliente_cognome} - ${selectedAppointmentStep}° Incontro - ${selectedGestione?.nome || ""}`,
                          }
                        : undefined
                }
            />

            {/* Appointment Slot Context Menu */}
            {activeSlotMenu &&
                activeSlotMenu.position &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setActiveSlotMenu(null)} />
                        <div
                            className="absolute z-[9999] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[165px] animate-in fade-in zoom-in-95 duration-150"
                            style={{
                                top: activeSlotMenu.position.top + window.scrollY + 4,
                                left: activeSlotMenu.position.left + window.scrollX,
                                transform: "translateX(-50%)",
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const item = passItems.find((i) => i.id === activeSlotMenu.itemId);
                                    if (item) handleEditAppointmentSlot(item, activeSlotMenu.step);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 flex items-center gap-2"
                            >
                                <Edit2 size={12} /> Apri in Agenda
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const item = passItems.find((i) => i.id === activeSlotMenu.itemId);
                                    if (item) handleManualSlotOutcome(item, activeSlotMenu.step, "show");
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 border-t border-slate-50"
                            >
                                <Check size={12} /> Segna Fatta (Show)
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const item = passItems.find((i) => i.id === activeSlotMenu.itemId);
                                    if (item) handleManualSlotOutcome(item, activeSlotMenu.step, "no_show");
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"
                            >
                                <X size={12} /> Segna Assente
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const item = passItems.find((i) => i.id === activeSlotMenu.itemId);
                                    if (item) handleDeleteAppointmentSlot(item, activeSlotMenu.step);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                            >
                                <Trash2 size={12} /> Elimina Slot
                            </button>
                        </div>
                    </>,
                    document.body
                )}

            {/* Quick Proposal Action Menu */}
            {activeProposalMenu &&
                activeProposalMenu.position &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setActiveProposalMenu(null)} />
                        <div
                            className="absolute z-[9999] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
                            style={{
                                top: activeProposalMenu.position.top + window.scrollY + 4,
                                left: activeProposalMenu.position.left + window.scrollX,
                                transform: "translateX(-50%)",
                            }}
                        >
                            {(() => {
                                const item = passItems.find((i) => i.id === activeProposalMenu.itemId);
                                if (!item) return null;
                                return (
                                    <>
                                        <button
                                            onClick={() => handleQuickProposalUpdate(item, "made")}
                                            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                                        >
                                            <MessageSquare size={14} /> Segna Proposta Fatta (Oggi)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveProposalMenu(null);
                                                handleEditReferral(item);
                                            }}
                                            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 border-t border-slate-50"
                                        >
                                            <CheckCircle2 size={14} /> Chiudi come Iscritto...
                                        </button>
                                        <button
                                            onClick={() => handleQuickProposalUpdate(item, "declined")}
                                            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"
                                        >
                                            <XCircle size={14} /> Segna Non Interessato
                                        </button>
                                        <button
                                            onClick={() => handleQuickProposalUpdate(item, "pending")}
                                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                                        >
                                            <Clock size={13} /> Ripristina &quot;Da Proporre&quot;
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
}

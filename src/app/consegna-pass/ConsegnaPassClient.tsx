"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import { Trash2, Plus, Search, MessageCircle, UserPlus, Users, ArrowRight, Calendar, ChevronDown, Edit2, Check, X, MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
// ... imports

// ... inside component

import { cn } from "@/lib/utils";
import { cleanPhone } from "@/lib/whatsapp";
import { getLocalDateISO } from "@/lib/dateUtils";
import ReferralActivationPopup from "./ReferralActivationPopup";
import PassDeliveryPopup from "./PassDeliveryPopup";
import PassEditPopup from "./PassEditPopup";
import EntryDrawer from "@/components/agenda/EntryDrawer";

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
    source_type?: string | null; // 'pass', 'whatsapp', 'social'

    // Appointment Tracking
    data_app_1?: string | null;
    esito_app_1?: 'pending' | 'show' | 'no_show' | null;
    data_app_2?: string | null;
    esito_app_2?: 'pending' | 'show' | 'no_show' | null;
    data_app_3?: string | null;
    esito_app_3?: 'pending' | 'show' | 'no_show' | null;

    // Subscription
    iscritto?: boolean | null;
    tipo_abbonamento?: string | null;
    generated_lead_id?: string | null;
}

interface Gestione {
    id: string;
    nome: string;
    active: boolean;
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("it-IT");
};

export default function ConsegnaPassClient() {
    const [gestioni, setGestioni] = useState<Gestione[]>([]);
    const [selectedGestioneId, setSelectedGestioneId] = useState<string | null>(null);
    const [passItems, setPassItems] = useState<PassItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'distribuzione' | 'referral'>('distribuzione');

    // Gestioni UI State
    const [isGestioneDropdownOpen, setIsGestioneDropdownOpen] = useState(false);
    const [editingGestioneId, setEditingGestioneId] = useState<string | null>(null);
    const [editingGestioneName, setEditingGestioneName] = useState("");

    // Popup & Drawer State
    const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
    const [editingPassItem, setEditingPassItem] = useState<PassItem | null>(null);
    const [showActivationPopup, setShowActivationPopup] = useState(false);
    const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
    const [showManualActivationPopup, setShowManualActivationPopup] = useState(false);

    // New Edit Popup State
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editingReferral, setEditingReferral] = useState<PassItem | null>(null);

    // Entry Drawer State for Appointments
    const [entryDrawerOpen, setEntryDrawerOpen] = useState(false);
    const [selectedAppointmentStep, setSelectedAppointmentStep] = useState<number | null>(null);
    const [selectedReferralForApp, setSelectedReferralForApp] = useState<PassItem | null>(null);

    // Options
    const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: 'data_consegna' | 'is_lead') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
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
        const { data, error } = await supabase
            .from("pass_gestioni")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Error fetching gestioni:", JSON.stringify(error, null, 2));
            console.error("Full error object:", error);
        }
        else {
            setGestioni(data || []);
            if (data && data.length > 0 && !selectedGestioneId) {
                setSelectedGestioneId(data[0].id);
            }
        }
    };

    const fetchPassItems = async (gestioneId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("pass_items")
            .select("*")
            .eq("gestione_id", gestioneId)
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching items:", error);
        else setPassItems(data || []);
        setLoading(false);
    };

    const fetchSubscriptionTypes = async () => {
        const { data } = await supabase.from("tipi_abbonamento").select("name").eq("active", true).order("sort_order");
        if (data) setSubscriptionTypes(data.map(d => d.name));
    };

    const handleCreateGestione = async () => {
        const nome = prompt("Nome della nuova gestione (es. Promo Natale 2025):");
        if (!nome) return;
        const { data, error } = await supabase.from("pass_gestioni").insert([{ nome }]).select().single();
        if (error) alert("Errore creazione gestione");
        else {
            setGestioni([data, ...gestioni]);
            setSelectedGestioneId(data.id);
        }
    };

    const handleUpdateGestione = async (id: string) => {
        if (!editingGestioneName.trim()) return;
        const { error } = await supabase.from("pass_gestioni").update({ nome: editingGestioneName }).eq("id", id);
        if (error) alert("Errore aggiornamento gestione");
        else {
            setGestioni(gestioni.map(g => g.id === id ? { ...g, nome: editingGestioneName } : g));
            setEditingGestioneId(null);
        }
    };

    const handleDeleteGestione = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa gestione? Tutti i pass associati verranno eliminati.")) return;
        const { error } = await supabase.from("pass_gestioni").delete().eq("id", id);
        if (error) alert("Errore eliminazione gestione");
        else {
            const newGestioni = gestioni.filter(g => g.id !== id);
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
                // Update existing pass
                const { error } = await supabase
                    .from('pass_items')
                    .update({
                        cliente_nome: data.nome,
                        cliente_cognome: data.cognome,
                        cliente_telefono: data.telefono
                    })
                    .eq('id', editingPassItem.id);

                if (error) throw error;

                // Optimistic update
                setPassItems(prev => prev.map(item =>
                    item.id === editingPassItem.id
                        ? { ...item, cliente_nome: data.nome, cliente_cognome: data.cognome, cliente_telefono: data.telefono }
                        : item
                ));
            } else {
                // Create new pass
                const { data: newItem, error } = await supabase
                    .from('pass_items')
                    .insert([{
                        gestione_id: selectedGestioneId,
                        data_consegna: new Date().toISOString().split('T')[0],
                        cliente_nome: data.nome,
                        cliente_cognome: data.cognome,
                        cliente_telefono: data.telefono,
                        source_type: 'pass'
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setPassItems(prev => [newItem, ...prev]);
            }
            setShowDeliveryPopup(false);
            setEditingPassItem(null);
        } catch (error) {
            console.error('Error saving pass:', error);
            alert('Errore durante il salvataggio');
        }
    };

    const updatePassItem = async (id: string, updates: any) => {
        const { error } = await supabase.from("pass_items").update(updates).eq("id", id);
        if (error) {
            console.error("Error updating pass:", error);
            alert("Errore aggiornamento");
        } else {
            setPassItems(passItems.map(item => item.id === id ? { ...item, ...updates } : item));
            // Also update selected referral if open
            if (selectedReferralForApp?.id === id) {
                setSelectedReferralForApp(prev => prev ? { ...prev, ...updates } : null);
            }
        }
    };

    const handleDeletePass = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo pass?")) return;
        const { error } = await supabase.from("pass_items").delete().eq("id", id);
        if (error) alert("Errore eliminazione");
        else setPassItems(passItems.filter(i => i.id !== id));
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

    const handleActivatePass = async (data: { nome: string; cognome: string; telefono: string; cliente_provenienza?: string; source_type?: string }) => {
        if (showManualActivationPopup) {
            // Create new referral from scratch
            if (!selectedGestioneId) return;

            // Split cliente_provenienza into nome/cognome if possible, or just put it in nome
            const clienteParts = (data.cliente_provenienza || "").split(" ");
            let defaultName = "Manuale";
            if (data.source_type === 'social') defaultName = "Social";
            else if (data.source_type === 'whatsapp') defaultName = "WhatsApp";

            const clienteNome = clienteParts[0] || defaultName;
            const clienteCognome = clienteParts.slice(1).join(" ") || "";

            const { data: newItem, error } = await supabase.from("pass_items").insert([{
                gestione_id: selectedGestioneId,
                data_consegna: new Date().toISOString().split('T')[0],
                cliente_nome: clienteNome,
                cliente_cognome: clienteCognome,
                cliente_telefono: "", // Not needed for manual source
                referral_nome: data.nome,
                referral_cognome: data.cognome,
                referral_telefono: data.telefono,
                data_attivazione: new Date().toISOString(),
                is_lead: true,
                source_type: data.source_type || 'pass'
            }]).select().single();

            if (error) {
                console.error("Error creating manual referral:", error);
                alert("Errore creazione referral");
            } else {
                setPassItems([newItem, ...passItems]);
            }
        } else {
            // Activate existing pass
            if (!selectedPassId) return;

            await updatePassItem(selectedPassId, {
                referral_nome: data.nome,
                referral_cognome: data.cognome,
                referral_telefono: data.telefono,
                data_attivazione: new Date().toISOString(),
                is_lead: true
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

    const handleDeleteReferral = async (id: string) => {
        const item = passItems.find(p => p.id === id);
        if (!item) return;

        const isPhysicalPass = !item.source_type || item.source_type === 'pass';

        if (isPhysicalPass) {
            // It's a physical pass: we only clear referral data, keep the pass delivery record
            if (!confirm("Vuoi cancellare i dati del referral? Il pass rimarrà segnato come consegnato.")) return;

            const { error } = await supabase.from("pass_items").update({
                referral_nome: null,
                referral_cognome: null,
                referral_telefono: null,
                data_attivazione: null,
                is_lead: false,
                iscritto: false,
                tipo_abbonamento: null,
                data_app_1: null,
                esito_app_1: null,
                data_app_2: null,
                esito_app_2: null,
                data_app_3: null,
                esito_app_3: null,
                generated_lead_id: null,
                whatsapp_sent_date: null // Reset also whatsapp sent date if we are resetting the referral? Maybe not if it was sent to the CLIENT.
                // Wait, whatsapp_sent_date is for the CLIENT follow up. We should NOT reset it if it's about the pass delivery follow up.
                // But if it's about the referral? The column is on pass_items.
                // The whatsapp button in the table is "Invia WhatsApp" to the CLIENT.
                // So we should NOT reset whatsapp_sent_date.
            }).eq("id", id);

            if (error) {
                console.error("Error resetting referral:", error);
                alert("Errore durante la cancellazione dei dati referral: " + (error.message || JSON.stringify(error)));
            } else {
                // Update local state
                setPassItems(passItems.map(i => i.id === id ? {
                    ...i,
                    referral_nome: null,
                    referral_cognome: null,
                    referral_telefono: null,
                    data_attivazione: null,
                    is_lead: false,
                    iscritto: false,
                    tipo_abbonamento: null,
                    data_app_1: null,
                    esito_app_1: null,
                    data_app_2: null,
                    esito_app_2: null,
                    data_app_3: null,
                    esito_app_3: null,
                    generated_lead_id: null
                } : i));
            }
        } else {
            // It's a manual/social/whatsapp lead: delete the whole row
            // handleDeletePass already has a confirm dialog, but we want a specific message here maybe?
            // handleDeletePass says "Sei sicuro di voler eliminare questo pass?".
            // Let's call handleDeletePass directly, it fits.
            await handleDeletePass(id);
        }

        setShowEditPopup(false);
        setEditingReferral(null);
    };

    // Appointment Logic
    const handleOpenAppointmentDrawer = (item: PassItem, step: number) => {
        setSelectedReferralForApp(item);
        setSelectedAppointmentStep(step);
        setEntryDrawerOpen(true);
    };

    const handleAppointmentCreated = async (payload: any) => {
        if (!selectedReferralForApp || !selectedAppointmentStep) return;

        const updates: any = {};
        const date = payload.entry_date;
        const entryId = payload.id; // Get the ID from the payload

        if (selectedAppointmentStep === 1) {
            updates.data_app_1 = date;
            updates.esito_app_1 = 'pending';
            updates.id_app_1 = entryId; // Save the ID
        } else if (selectedAppointmentStep === 2) {
            updates.data_app_2 = date;
            updates.esito_app_2 = 'pending';
            updates.id_app_2 = entryId; // Save the ID
        } else if (selectedAppointmentStep === 3) {
            updates.data_app_3 = date;
            updates.esito_app_3 = 'pending';
            updates.id_app_3 = entryId; // Save the ID
        }

        await updatePassItem(selectedReferralForApp.id, updates);
        setEntryDrawerOpen(false);
        setSelectedReferralForApp(null);
        setSelectedAppointmentStep(null);
    };

    // --- APPOINTMENT ACTIONS (Edit/Delete) ---
    const [activeSlotMenu, setActiveSlotMenu] = useState<{ itemId: string, step: number, position?: { top: number, left: number } } | null>(null);

    const findAppointmentEntry = async (item: PassItem, step: number) => {
        const idKey = `id_app_${step}` as keyof PassItem;
        const dateKey = `data_app_${step}` as keyof PassItem;

        const appointmentId = item[idKey] as string | null;
        const date = item[dateKey] as string | null;

        if (appointmentId) {
            // Best case: we have the ID
            const { data, error } = await supabase
                .from("entries")
                .select("*")
                .eq("id", appointmentId)
                .maybeSingle();

            if (error) console.error("Error finding appointment by ID:", error);
            return data;
        } else if (date) {
            // Fallback: search by Name + Surname + Date (Legacy)
            const { data, error } = await supabase
                .from("entries")
                .select("*")
                .eq("nome", item.referral_nome)
                .eq("cognome", item.referral_cognome)
                .eq("entry_date", date)
                .limit(1)
                .maybeSingle();

            if (error) console.error("Error finding appointment by Date:", error);
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
            setEntryDrawerOpen(true);
            setEditingAppointmentEntry(entry);
        } else {
            alert("Appuntamento non trovato in agenda (potrebbe essere stato cancellato).");
            if (confirm("Vuoi pulire questo slot nel Pass?")) {
                await clearPassSlot(item.id, step);
            }
        }
    };

    const [editingAppointmentEntry, setEditingAppointmentEntry] = useState<any | null>(null);

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
    };

    const clearPassSlot = async (itemId: string, step: number) => {
        const updates: any = {};
        updates[`data_app_${step}`] = null;
        updates[`esito_app_${step}`] = null;
        updates[`id_app_${step}`] = null; // Clear ID too
        await updatePassItem(itemId, updates);
    };



    const getWhatsAppLink = (phone: string, message: string) => {
        return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
    };

    // WhatsApp Logic
    const sendClientFollowUp = async (item: PassItem) => {
        if (!item.cliente_telefono) return;
        const message = `Ciao ${item.cliente_nome}, 
Ti scriviamo da Restart Fitness Club!

Qualche giorno fa ti abbiamo affidato un pass da donare a qualcuno a cui vuoi bene… un piccolo gesto che può diventare il primo passo verso più movimento, più energia, più benessere.

Crediamo davvero che muoversi cambi la vita: rende la mente più leggera, il corpo più vivo e le giornate un po’ più nostre. Per questo ci chiedevamo se, nel frattempo, hai pensato a qualcuno a cui potrebbe far bene questo invito.
Se la risposta è sì, puoi lasciarci il suo contatto, ci farebbe piacere farci una chiacchierata, capire come sta e mettere a disposizione il nostro aiuto, un passo alla volta, a ritrovare il piacere di muoversi e prendersi cura di sé.

Che ne pensi? Facci sapere, grazie di cuore!`;
        const link = getWhatsAppLink(item.cliente_telefono, message);
        window.open(link, '_blank');

        if (!item.whatsapp_sent_date) {
            await updatePassItem(item.id, { whatsapp_sent_date: new Date().toISOString() });
        }
    };

    // Filtering & Sorting
    const filteredItems = passItems.filter(item => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (item.cliente_nome || "").toLowerCase().includes(search) ||
            (item.cliente_cognome || "").toLowerCase().includes(search) ||
            (item.referral_nome || "").toLowerCase().includes(search) ||
            (item.referral_cognome || "").toLowerCase().includes(search);

        if (activeTab === 'distribuzione') {
            const isPassSource = !item.source_type || item.source_type === 'pass';
            return matchesSearch && isPassSource;
        } else {
            return matchesSearch && item.is_lead;
        }
    }).sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        if (key === 'data_consegna') {
            const dateA = new Date(a.data_consegna).getTime();
            const dateB = new Date(b.data_consegna).getTime();
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (key === 'is_lead') {
            // false (Attiva Pass) comes before true (Attivato) in asc
            const valA = a.is_lead ? 1 : 0;
            const valB = b.is_lead ? 1 : 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
    });

    const selectedGestione = gestioni.find(g => g.id === selectedGestioneId);

    const shouldHighlight = (item: PassItem) => {
        if (activeTab === 'distribuzione') {
            if (item.whatsapp_sent_date || item.data_attivazione) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deliveryDate = new Date(item.data_consegna);
            deliveryDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - deliveryDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays >= 2;
        }
        return false;
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 min-h-[101vh]">
            {/* Header & Gestioni Selector */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Consegna Pass</h1>
                    <p className="text-slate-500">Gestisci le campagne promozionali e i referral</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto relative">
                    {/* Custom Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsGestioneDropdownOpen(!isGestioneDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto md:min-w-[16rem] justify-between"
                        >
                            <span className="font-medium text-slate-700">
                                {selectedGestione?.nome || "Seleziona Gestione"}
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
                                        {gestioni.map(g => (
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
                                                            onChange={e => setEditingGestioneName(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleUpdateGestione(g.id);
                                                                if (e.key === 'Escape') setEditingGestioneId(null);
                                                            }}
                                                        />
                                                        <button onClick={() => handleUpdateGestione(g.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingGestioneId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
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
                                                                selectedGestioneId === g.id ? "text-purple-700" : "text-slate-700"
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
                                            onClick={() => {
                                                handleCreateGestione();
                                                setIsGestioneDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                                        >
                                            <Plus size={16} />
                                            Nuova Gestione
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Pass Consegnati</div>
                    <div className="text-xl font-bold text-slate-800">
                        {passItems.filter(i => i.source_type === 'pass' || !i.source_type).length}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Totale Attivati</div>
                    <div className="text-xl font-bold text-emerald-600">
                        {passItems.filter(i => i.is_lead).length}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Attivati da Clienti</div>
                    <div className="text-xl font-bold text-purple-600">
                        {passItems.filter(i => i.is_lead && (i.source_type === 'pass' || i.source_type === 'manual_pass' || !i.source_type)).length}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Attivati da Social</div>
                    <div className="text-xl font-bold text-pink-600">
                        {passItems.filter(i => i.is_lead && i.source_type === 'social').length}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Attivati da WhatsApp</div>
                    <div className="text-xl font-bold text-green-600">
                        {passItems.filter(i => i.is_lead && i.source_type === 'whatsapp').length}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Iscritti da Attivati</div>
                    <div className="text-xl font-bold text-blue-600">
                        {passItems.filter(i => i.is_lead && i.iscritto).length}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                        {passItems.filter(i => i.is_lead).length > 0
                            ? Math.round((passItems.filter(i => i.is_lead && i.iscritto).length / passItems.filter(i => i.is_lead).length) * 100)
                            : 0}% conversione
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('distribuzione')}
                    className={cn(
                        "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'distribuzione'
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Users size={18} />
                    Pass Consegnati
                </button>
                <button
                    onClick={() => setActiveTab('referral')}
                    className={cn(
                        "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'referral'
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <UserPlus size={18} />
                    Pass Attivati
                    {passItems.filter(i => i.is_lead).length > 0 && (
                        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                            {passItems.filter(i => i.is_lead).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca cliente o referral..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'distribuzione' ? (
                    <button
                        onClick={handleAddPass}
                        className="w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                    >
                        <Plus size={18} />
                        Nuovo Pass Consegnato
                    </button>
                ) : (
                    <button
                        onClick={openManualReferralPopup}
                        className="w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        + Nuovo Pass Attivato
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Caricamento...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">Nessun elemento trovato</div>
                ) : (
                    <div className="overflow-x-auto">
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {filteredItems.map(item => (
                                    <div key={item.id} className={cn(
                                        "bg-white p-4 rounded-xl border shadow-sm space-y-3",
                                        shouldHighlight(item) ? "border-yellow-200 bg-yellow-50/50" : "border-slate-100"
                                    )}>
                                        {activeTab === 'distribuzione' ? (
                                            // Mobile Card: Pass Consegnati
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-800">{item.cliente_nome} {item.cliente_cognome}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">Consegnato il {formatDate(item.data_consegna)}</div>
                                                    </div>
                                                    {item.is_lead ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                            Attivato
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openActivationPopup(item)}
                                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-purple-200"
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
                                                            {item.whatsapp_sent_date ? "Inviato" : "WhatsApp"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeletePass(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            // Mobile Card: Pass Attivati
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-lg">{item.referral_nome} {item.referral_cognome}</div>
                                                        <div className="text-sm text-slate-500 font-mono">{item.referral_telefono}</div>
                                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            <ArrowRight size={12} />
                                                            da {item.cliente_nome} {item.cliente_cognome}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => handleEditReferral(item)}
                                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors self-end"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Appointment Slots Grid */}
                                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
                                                    {[1, 2, 3].map(step => {
                                                        const dateKey = `data_app_${step}` as keyof PassItem;
                                                        const outcomeKey = `esito_app_${step}` as keyof PassItem;
                                                        const date = item[dateKey] as string | null;
                                                        const outcome = item[outcomeKey] as string | null;

                                                        return (
                                                            <div key={step} className="flex flex-col gap-1">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase text-center">App. {step}</div>
                                                                <button
                                                                    onClick={() => handleOpenAppointmentDrawer(item, step)}
                                                                    className={cn(
                                                                        "h-10 rounded-lg border flex items-center justify-center transition-all relative overflow-hidden",
                                                                        date
                                                                            ? outcome === 'show'
                                                                                ? "bg-green-50 border-green-200 text-green-700"
                                                                                : outcome === 'no_show'
                                                                                    ? "bg-red-50 border-red-200 text-red-700"
                                                                                    : "bg-purple-50 border-purple-200 text-purple-700"
                                                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-purple-200"
                                                                    )}
                                                                >
                                                                    {date ? (
                                                                        <div className="flex flex-col items-center leading-none py-0.5">
                                                                            <span className="text-xs font-bold">{new Date(date).getDate()}</span>
                                                                            <span className="text-[9px] uppercase font-bold">{new Date(date).toLocaleString('it-IT', { month: 'short' })}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <Plus size={14} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Subscription Status Footer */}
                                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            item.iscritto ? "bg-green-500" : "bg-slate-300"
                                                        )} />
                                                        <span className={cn(
                                                            "text-xs font-bold uppercase tracking-wider",
                                                            item.iscritto ? "text-green-600" : "text-slate-500"
                                                        )}>
                                                            {item.iscritto ? item.tipo_abbonamento || "Iscritto" : "Non Iscritto"}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteReferral(item.id)}
                                                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                                                    >
                                                        Elimina
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            {activeTab === 'distribuzione' ? (
                                                <>
                                                    <th
                                                        className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                                        onClick={() => handleSort('data_consegna')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Data Consegna
                                                            {sortConfig?.key === 'data_consegna' && (
                                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">WhatsApp</th>
                                                    <th
                                                        className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                                        onClick={() => handleSort('is_lead')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            Attiva Pass
                                                            {sortConfig?.key === 'is_lead' && (
                                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Referral</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Telefono</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provenienza</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Appuntamenti</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Iscrizione</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    "hover:bg-slate-50/80 transition-colors group",
                                                    shouldHighlight(item) ? "bg-yellow-50/50 hover:bg-yellow-50" : ""
                                                )}
                                            >
                                                {activeTab === 'distribuzione' ? (
                                                    <>
                                                        <td className="p-4 text-sm text-slate-600 font-mono">
                                                            {formatDate(item.data_consegna)}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">{item.cliente_nome} {item.cliente_cognome}</div>
                                                            <div className="text-xs text-slate-400">{item.cliente_telefono}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.cliente_telefono && (
                                                                <button
                                                                    onClick={() => sendClientFollowUp(item)}
                                                                    className={cn(
                                                                        "p-2 rounded-lg transition-all relative group/btn",
                                                                        item.whatsapp_sent_date
                                                                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                                                                            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                                                    )}
                                                                    title={item.whatsapp_sent_date ? `Inviato il ${new Date(item.whatsapp_sent_date).toLocaleDateString()}` : "Invia WhatsApp"}
                                                                >
                                                                    {item.whatsapp_sent_date ? <Check size={18} /> : <MessageCircle size={18} />}
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.is_lead ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Attivato
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openActivationPopup(item)}
                                                                    className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Attiva Pass
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => handleDeletePass(item.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Elimina"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">{item.referral_nome} {item.referral_cognome}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-slate-600 font-mono">{item.referral_telefono}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-slate-600">
                                                                {item.cliente_nome} {item.cliente_cognome}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {item.source_type === 'social' ? 'Social' :
                                                                    item.source_type === 'whatsapp' ? 'WhatsApp' : 'Pass'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {[1, 2, 3].map(step => {
                                                                    const dateKey = `data_app_${step}` as keyof PassItem;
                                                                    const outcomeKey = `esito_app_${step}` as keyof PassItem;
                                                                    const date = item[dateKey] as string | null;
                                                                    const outcome = item[outcomeKey] as string | null;

                                                                    return (
                                                                        <button
                                                                            key={step}
                                                                            onClick={(e) => {
                                                                                if (date) {
                                                                                    e.stopPropagation();
                                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                                    setActiveSlotMenu(activeSlotMenu?.itemId === item.id && activeSlotMenu?.step === step ? null : {
                                                                                        itemId: item.id,
                                                                                        step,
                                                                                        position: { top: rect.bottom, left: rect.left + rect.width / 2 }
                                                                                    });
                                                                                } else {
                                                                                    handleOpenAppointmentDrawer(item, step);
                                                                                }
                                                                            }}
                                                                            className={cn(
                                                                                "h-auto min-h-[2rem] px-2 py-1 rounded-lg border flex items-center justify-center transition-all min-w-[3.5rem]",
                                                                                date
                                                                                    ? outcome === 'show'
                                                                                        ? "bg-green-50 border-green-200 text-green-700"
                                                                                        : outcome === 'no_show'
                                                                                            ? "bg-red-50 border-red-200 text-red-700"
                                                                                            : "bg-purple-50 border-purple-200 text-purple-700"
                                                                                    : "bg-white border-slate-200 text-slate-300 hover:border-purple-300 hover:text-purple-400"
                                                                            )}
                                                                            title={date ? `App. ${step}: ${new Date(date).toLocaleDateString()}` : `Fissa App. ${step}`}
                                                                        >
                                                                            {date ? (
                                                                                <div className="flex flex-col items-center leading-none">
                                                                                    <span className="text-xs font-bold">{new Date(date).getDate()}</span>
                                                                                    <span className="text-[9px] uppercase font-bold">{new Date(date).toLocaleString('it-IT', { month: 'short' })}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <Plus size={14} />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {item.iscritto ? (
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold border border-emerald-200">
                                                                    <Check size={12} />
                                                                    {item.tipo_abbonamento || "Iscritto"}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                                                                    Non Iscritto
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEditReferral(item)}
                                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    title="Modifica Dati"
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    </div>
                )}
            </div>

            <ReferralActivationPopup
                isOpen={showActivationPopup}
                onClose={() => setShowActivationPopup(false)}
                onConfirm={handleActivatePass}
                clientName={selectedPassId ? passItems.find(p => p.id === selectedPassId)?.cliente_nome + " " + passItems.find(p => p.id === selectedPassId)?.cliente_cognome : ""}
                isManual={showManualActivationPopup}
            />

            <PassDeliveryPopup
                isOpen={showDeliveryPopup}
                onClose={() => setShowDeliveryPopup(false)}
                onConfirm={handleConfirmDelivery}
                initialData={editingPassItem ? {
                    nome: editingPassItem.cliente_nome,
                    cognome: editingPassItem.cliente_cognome,
                    telefono: editingPassItem.cliente_telefono
                } : null}
            />

            <PassEditPopup
                isOpen={showEditPopup}
                onClose={() => setShowEditPopup(false)}
                onConfirm={handleUpdateReferral}
                onDelete={() => editingReferral && handleDeleteReferral(editingReferral.id)}
                initialData={editingReferral ? {
                    referral_nome: editingReferral.referral_nome || "",
                    referral_cognome: editingReferral.referral_cognome || "",
                    referral_telefono: editingReferral.referral_telefono || "",
                    iscritto: editingReferral.iscritto || false,
                    tipo_abbonamento: editingReferral.tipo_abbonamento || null
                } : null}
                subscriptionTypes={subscriptionTypes}
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
                entry={editingAppointmentEntry} // Pass entry for editing
                initialData={!editingAppointmentEntry && selectedReferralForApp ? {
                    nome: selectedReferralForApp.referral_nome,
                    cognome: selectedReferralForApp.referral_cognome,
                    telefono: selectedReferralForApp.referral_telefono,
                    section: "APPUNTAMENTI (Pianificazione)",
                    note: `Referral di ${selectedReferralForApp.cliente_nome} ${selectedReferralForApp.cliente_cognome} - ${selectedAppointmentStep}° Incontro - ${gestioni.find(g => g.id === selectedGestioneId)?.nome || ""}`
                } : undefined}
            />
            {/* Action Menu - Rendered via Portal to escape all layout constraints */}
            {/* Action Menu - Rendered via Portal to escape all layout constraints */}
            {activeSlotMenu && activeSlotMenu.position && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setActiveSlotMenu(null)} />
                    <div
                        className="absolute z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: activeSlotMenu.position.top + window.scrollY + 4,
                            left: activeSlotMenu.position.left + window.scrollX,
                            transform: "translateX(-50%)"
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const item = passItems.find(i => i.id === activeSlotMenu.itemId);
                                if (item) handleEditAppointmentSlot(item, activeSlotMenu.step);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-purple-600 flex items-center gap-2"
                        >
                            <Edit2 size={12} /> Modifica
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const item = passItems.find(i => i.id === activeSlotMenu.itemId);
                                if (item) handleDeleteAppointmentSlot(item, activeSlotMenu.step);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 border-t border-slate-50"
                        >
                            <Trash2 size={12} /> Elimina
                        </button>
                    </div>
                </>,
                document.body
            )}
        </div >
    );
}

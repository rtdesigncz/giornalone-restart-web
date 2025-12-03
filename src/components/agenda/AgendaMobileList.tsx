import { SalePopup, ReschedulePopup, VerifyPopup, AbsentPopup } from "../outcomes/OutcomePopups";
import { useOutcomeManager } from "@/hooks/useOutcomeManager";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { getWhatsAppLink, markWhatsAppSent } from "@/lib/whatsapp";
import { getLocalDateISO } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabaseClient";
import EntryDrawer from "./EntryDrawer";
import EntryCard from "../EntryCard";

import AgendaMobileBar from "./AgendaMobileBar";

// ... existing imports ...

export default function AgendaMobileList({ section, onSectionChange }: { section: string, onSectionChange: (s: string) => void }) {
    const router = useRouter();
    const sp = useSearchParams();
    const dateParam = sp?.get("date") ?? getLocalDateISO();

    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
    const [isDuplicateMode, setIsDuplicateMode] = useState(false);

    const fetchRows = async () => {
        setLoading(true);
        let q = supabase
            .from("entries")
            .select(`*, consulente:consulenti(*), tipo_abbonamento:tipi_abbonamento(*)`)
            .eq("section", section)
            .eq("entry_date", dateParam)
            .order("entry_time", { ascending: true });

        const { data, error } = await q;
        if (error) console.error(error);
        else setRows(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRows();
    }, [section, dateParam]);

    // Outcome Manager
    const {
        salePopup, setSalePopup,
        reschedulePopup, setReschedulePopup,
        verifyPopup, setVerifyPopup,
        absentPopup, setAbsentPopup,
        rescheduleDrawerOpen, setRescheduleDrawerOpen,
        rescheduleEntryData,
        handleOutcomeClick,
        confirmVerify,
        confirmSale,
        confirmMiss,
        confirmAbsent,
        onRescheduleSaved
    } = useOutcomeManager(fetchRows);

    // Load subscription types for SalePopup
    const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);
    useEffect(() => {
        fetch("/api/settings/tipo/list")
            .then(async res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("JSON Parse Error:", e, "Response text:", text);
                    return { items: [] };
                }
            })
            .then(data => {
                if (data.items) setSubscriptionTypes(data.items.map((t: any) => t.name));
            })
            .catch(err => console.error("Fetch Error:", err));
    }, []);

    const filteredRows = rows.filter(r => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.nome?.toLowerCase().includes(s) ||
            r.cognome?.toLowerCase().includes(s) ||
            r.telefono?.includes(s)
        );
    });

    const handleEdit = (row: any) => {
        setSelectedEntry(row);
        setIsDuplicateMode(false);
        setDrawerOpen(true);
    };

    const handleNewClick = () => {
        setSelectedEntry(null);
        setIsDuplicateMode(false);
        setDrawerOpen(true);
    };

    const handleDuplicate = (row: any) => {
        setSelectedEntry(row);
        setIsDuplicateMode(true);
        setDrawerOpen(true);
    };

    const handleDelete = async (row: any) => {
        if (!confirm("Sei sicuro di voler eliminare questa riga?")) return;
        await supabase.from("entries").delete().eq("id", row.id);
        fetchRows();
    };

    const handlePhoneToggle = async (row: any) => {
        const newValue = !row.contattato;
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, contattato: newValue } : r));
        await supabase.from("entries").update({ contattato: newValue }).eq("id", row.id);
    };

    const handleWhatsAppClick = async (row: any) => {
        const link = getWhatsAppLink(row);
        if (!link) return;

        window.open(link, "_blank");
        // Generic button does NOT mark as sent anymore
    };

    const handleCallClick = (row: any) => {
        if (row.telefono) window.location.href = `tel:${row.telefono}`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 relative">
            {/* Search (Scrollable) */}
            <div className="p-4 pb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        className="input pl-9 w-full bg-white border-slate-200 focus:border-brand/50 text-sm h-11 shadow-sm rounded-xl"
                        placeholder="Cerca nome, telefono..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto px-4 pb-24 space-y-3">
                {/* ... existing list rendering ... */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                        <div className="spinner-dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                        <span className="text-xs uppercase tracking-widest font-medium opacity-70">Caricamento...</span>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-2">
                            <Filter size={20} />
                        </div>
                        <p className="text-sm">Nessun appuntamento.</p>
                    </div>
                ) : (
                    filteredRows.map((row) => (
                        <EntryCard
                            key={row.id}
                            row={row}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onWhatsapp={handleWhatsAppClick}
                            onCall={handleCallClick}
                            onOutcomeClick={handleOutcomeClick}
                            onToggleContattato={handlePhoneToggle}
                            onDuplicate={handleDuplicate}
                        />
                    ))
                )}
            </div>

            {/* Unified Bottom Bar */}
            <AgendaMobileBar
                activeSection={section}
                onSelect={onSectionChange}
                onNewClick={handleNewClick}
            />

            {/* Drawer */}
            <EntryDrawer
                // ... existing props ...
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                entry={selectedEntry}
                section={section}
                date={dateParam}
                onSave={fetchRows}
                onDelete={(id) => handleDelete({ id })}
                isDuplicate={isDuplicateMode}
            />

            {/* ... other drawers and popups ... */}
            <EntryDrawer
                isOpen={rescheduleDrawerOpen}
                onClose={() => setRescheduleDrawerOpen(false)}
                entry={rescheduleEntryData}
                section={rescheduleEntryData?.section || "TOUR SPONTANEI"}
                date={new Date().toISOString().slice(0, 10)}
                onSave={onRescheduleSaved}
                onDelete={() => { }}
                allowSectionChange={true}
            />

            <SalePopup
                isOpen={salePopup.open}
                onClose={() => setSalePopup({ open: false, entry: null })}
                entry={salePopup.entry}
                subscriptionTypes={subscriptionTypes}
                onConfirm={confirmSale}
            />
            <ReschedulePopup
                isOpen={reschedulePopup.open}
                onClose={() => setReschedulePopup({ open: false, entry: null })}
                entry={reschedulePopup.entry}
                onConfirm={confirmMiss}
            />
            <VerifyPopup
                isOpen={verifyPopup.open}
                onClose={() => setVerifyPopup({ open: false, entry: null })}
                entry={verifyPopup.entry}
                onConfirm={confirmVerify}
            />
            <AbsentPopup
                isOpen={absentPopup.open}
                onClose={() => setAbsentPopup({ open: false, entry: null })}
                entry={absentPopup.entry}
                onConfirm={confirmAbsent}
            />
        </div>
    );
}

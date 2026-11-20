import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PassDeliveryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { nome: string; cognome: string; telefono: string }) => void;
    initialData?: { nome: string; cognome: string; telefono: string } | null;
}

export default function PassDeliveryPopup({ isOpen, onClose, onConfirm, initialData }: PassDeliveryPopupProps) {
    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [telefono, setTelefono] = useState("");
    const [mounted, setMounted] = useState(false);

    // Client autocomplete state (come nel Drawer)
    const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [activeField, setActiveField] = useState<"nome" | "cognome" | "telefono">("nome");

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autocompleteContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNome(initialData.nome || "");
                setCognome(initialData.cognome || "");
                setTelefono(initialData.telefono || "");

                // Cerca se esiste già il cliente censito per mostrare il badge di stato
                const q = (initialData.telefono || `${initialData.cognome} ${initialData.nome}`).trim();
                if (q) {
                    fetch(`/api/clients?q=${encodeURIComponent(q)}&limit=1`)
                        .then(r => r.json())
                        .then(d => {
                            if (d.clients && d.clients.length > 0) {
                                setSelectedClient(d.clients[0]);
                            }
                        })
                        .catch(() => {});
                }
            } else {
                setNome("");
                setCognome("");
                setTelefono("");
                setSelectedClient(null);
            }
            setShowSuggestions(false);
            setClientSuggestions([]);
        }
    }, [isOpen, initialData]);

    // Chiudi suggerimenti al click esterno
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!mounted) return null;
    if (!isOpen) return null;

    const handleClientSearch = (field: "nome" | "cognome" | "telefono", val: string) => {
        setActiveField(field);
        const formattedVal = (field === "nome" || field === "cognome") ? val.toUpperCase() : val;
        
        if (field === "nome") setNome(formattedVal);
        else if (field === "cognome") setCognome(formattedVal);
        else if (field === "telefono") setTelefono(formattedVal);

        const nextNome = field === "nome" ? formattedVal : nome;
        const nextCognome = field === "cognome" ? formattedVal : cognome;
        const nextPhone = field === "telefono" ? formattedVal : telefono;
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

                            // Se c'è match esatto mentre digita, aggancia il cliente
                            const exact = data.clients.find((c: any) =>
                                (nextPhone && nextPhone.length >= 6 && c.telefono === nextPhone) ||
                                (nextCognome && nextNome && c.cognome?.toLowerCase().trim() === nextCognome.toLowerCase().trim() && c.nome?.toLowerCase().trim() === nextNome.toLowerCase().trim())
                            );
                            if (exact) {
                                setSelectedClient(exact);
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

    const handleFocusSearch = (field: "nome" | "cognome" | "telefono") => {
        setActiveField(field);
        const query = (field === "telefono" ? telefono : `${cognome} ${nome}`).trim();

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

    const handleSelectClient = (client: any) => {
        setNome((client.nome || "").trim().toUpperCase());
        setCognome((client.cognome || "").trim().toUpperCase());
        setTelefono(client.telefono || "");
        setSelectedClient(client);
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || !cognome || !telefono) return;

        onConfirm({
            nome: nome.trim().toUpperCase(),
            cognome: cognome.trim().toUpperCase(),
            telefono: telefono.trim(),
        });
        onClose();
    };

    const renderSuggestionsDropdown = () => {
        if (!showSuggestions || clientSuggestions.length === 0) return null;

        return (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                    <span className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-purple-500" />
                        Clienti Wellness trovati
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                    >
                        <X size={12} />
                    </button>
                </div>
                {clientSuggestions.map((client) => (
                    <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="p-2.5 hover:bg-purple-50/70 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                        <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                                {client.cognome} {client.nome}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                                {client.telefono || "Nessun tel"} • {client.pacchetto_originale || "Abbonato"}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                                client.stato === "ATTIVO"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : client.stato === "IN_SCADENZA"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                            )}
                        >
                            {client.stato?.replace("_", " ") || "CLIENTE"}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {initialData ? "Modifica Pass" : "Nuovo Pass Consegnato"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {initialData ? "Modifica i dati del cliente" : "Inserisci i dati del cliente che riceve il pass"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div ref={autocompleteContainerRef} className="space-y-4">
                        {/* RIGA 1: Nome e Cognome */}
                        <div className="relative">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all uppercase font-semibold"
                                        placeholder="MARIO"
                                        value={nome}
                                        onChange={e => handleClientSearch("nome", e.target.value)}
                                        onFocus={() => handleFocusSearch("nome")}
                                        onKeyDown={e => { if (e.key === "Escape") setShowSuggestions(false); }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cognome Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all uppercase font-semibold"
                                        placeholder="ROSSI"
                                        value={cognome}
                                        onChange={e => handleClientSearch("cognome", e.target.value)}
                                        onFocus={() => handleFocusSearch("cognome")}
                                        onKeyDown={e => { if (e.key === "Escape") setShowSuggestions(false); }}
                                    />
                                </div>
                            </div>
                            {/* Dropdown sotto Nome/Cognome */}
                            {activeField !== "telefono" && renderSuggestionsDropdown()}
                        </div>

                        {/* RIGA 2: Telefono Cliente */}
                        <div className="relative space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefono Cliente</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                                placeholder="333 1234567"
                                value={telefono}
                                onChange={e => handleClientSearch("telefono", e.target.value)}
                                onFocus={() => handleFocusSearch("telefono")}
                                onKeyDown={e => { if (e.key === "Escape") setShowSuggestions(false); }}
                            />
                            {/* Dropdown sotto Telefono se si sta cercando per telefono */}
                            {activeField === "telefono" && renderSuggestionsDropdown()}
                        </div>

                        {/* Selected Client Status Badge */}
                        {selectedClient && (
                            <div className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 flex items-center justify-between text-xs animate-in fade-in">
                                <div className="flex items-center gap-2 min-w-0">
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
                                    <div className="text-[11px] truncate">
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
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                                        selectedClient.stato === "ATTIVO"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : selectedClient.stato === "IN_SCADENZA"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                    )}
                                >
                                    {selectedClient.stato?.replace("_", " ") || "ATTIVO"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={!nome || !cognome || !telefono}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Conferma
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

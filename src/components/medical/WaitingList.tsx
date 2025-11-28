"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, CheckCircle, Circle, Phone, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WaitingList() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newSurname, setNewSurname] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newNotes, setNewNotes] = useState("");

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("medical_waiting_list")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error(error);
        else setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleAdd = async () => {
        if (!newName) return;

        const { error } = await supabase
            .from("medical_waiting_list")
            .insert([{
                name: newName,
                surname: newSurname,
                phone: newPhone,
                notes: newNotes
            }]);

        if (error) {
            alert("Errore: " + error.message);
        } else {
            setNewName("");
            setNewSurname("");
            setNewPhone("");
            setNewNotes("");
            fetchItems();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare dalla lista?")) return;
        await supabase.from("medical_waiting_list").delete().eq("id", id);
        fetchItems();
    };

    const toggleContacted = async (id: string, current: boolean) => {
        await supabase
            .from("medical_waiting_list")
            .update({ contacted: !current })
            .eq("id", id);
        fetchItems();
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Input Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome</label>
                    <input
                        className="input w-full"
                        placeholder="Nome"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cognome</label>
                    <input
                        className="input w-full"
                        placeholder="Cognome"
                        value={newSurname}
                        onChange={e => setNewSurname(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Telefono</label>
                    <input
                        className="input w-full"
                        placeholder="+39..."
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Note</label>
                    <input
                        className="input w-full"
                        placeholder="Note..."
                        value={newNotes}
                        onChange={e => setNewNotes(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!newName}
                    className="btn btn-primary w-full justify-center"
                >
                    <Plus size={18} className="mr-2" /> Aggiungi
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Telefono</th>
                            <th className="p-3">Note</th>
                            <th className="p-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2" /> Caricamento...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    Nessuna persona in lista d'attesa.
                                </td>
                            </tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-3">
                                        <button
                                            onClick={() => toggleContacted(item.id, item.contacted)}
                                            className={cn(
                                                "transition-colors",
                                                item.contacted ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"
                                            )}
                                            title={item.contacted ? "Contattato" : "Segna come contattato"}
                                        >
                                            {item.contacted ? <CheckCircle size={18} /> : <Circle size={18} />}
                                        </button>
                                    </td>
                                    <td className="p-3 font-medium text-slate-800">
                                        {item.name} {item.surname}
                                    </td>
                                    <td className="p-3 text-slate-600 font-mono text-xs flex items-center gap-2">
                                        {item.phone && (
                                            <>
                                                <a href={`tel:${item.phone}`} className="flex items-center gap-1 hover:text-brand hover:underline">
                                                    <Phone size={12} /> {item.phone}
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        const phone = item.phone.replace(/\D/g, '');
                                                        if (phone) window.open(`https://wa.me/${phone}`, '_blank');
                                                    }}
                                                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                                                    title="Apri WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                    <td className="p-3 text-slate-500 italic">
                                        {item.notes}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

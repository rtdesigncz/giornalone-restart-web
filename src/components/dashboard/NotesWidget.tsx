"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Send, Trash2, User, ArrowRight, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
    id: string;
    created_at: string;
    content: string;
    author_id: string;
    author_name: string;
    recipient_id: string;
    recipient_name: string;
};

type Consulente = {
    id: string;
    name: string;
};

export default function NotesWidget() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [consulenti, setConsulenti] = useState<Consulente[]>([]);

    // Form State
    const [content, setContent] = useState("");
    const [authorId, setAuthorId] = useState("");
    const [recipientId, setRecipientId] = useState("");

    const fetchNotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notes_v")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) console.error("Error fetching notes:", error);
        else setNotes(data || []);
        setLoading(false);
    };

    const fetchConsulenti = async () => {
        const { data, error } = await supabase.from("consulenti").select("*").order("name");
        if (error) console.error(error);
        else setConsulenti(data || []);
    };

    useEffect(() => {
        fetchNotes();
        fetchConsulenti();
    }, []);

    const handleSave = async () => {
        if (!content.trim() || !authorId || !recipientId) {
            alert("Compila tutti i campi (Messaggio, Chi scrive, A chi).");
            return;
        }

        const { error } = await supabase.from("notes").insert({
            content,
            author_id: authorId,
            recipient_id: recipientId
        });

        if (error) {
            alert("Errore salvataggio nota: " + error.message);
        } else {
            setContent("");
            setIsAdding(false);
            fetchNotes();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questa nota?")) return;
        await supabase.from("notes").delete().eq("id", id);
        fetchNotes();
    };

    return (
        <div className="glass-card flex flex-col h-[500px] relative overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/50 flex items-center justify-between bg-white/40 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Note Team</h2>
                        <p className="text-xs text-slate-500">Bacheca messaggi interna</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "btn btn-sm transition-all shadow-sm",
                        isAdding ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-200"
                    )}
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 custom-scrollbar">
                {isAdding && (
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-500/10 mb-6 animate-in-up">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-indigo-900">Nuova Nota</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Da</label>
                                <select
                                    className="input h-9 text-sm py-1"
                                    value={authorId}
                                    onChange={e => setAuthorId(e.target.value)}
                                >
                                    <option value="">Seleziona...</option>
                                    {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">A</label>
                                <select
                                    className="input h-9 text-sm py-1"
                                    value={recipientId}
                                    onChange={e => setRecipientId(e.target.value)}
                                >
                                    <option value="">Seleziona...</option>
                                    {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <textarea
                            className="input w-full min-h-[100px] text-sm resize-none mb-3 p-3 leading-relaxed"
                            placeholder="Scrivi qui il messaggio..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn bg-indigo-500 text-white hover:bg-indigo-600 btn-sm shadow-lg shadow-indigo-500/20"
                            >
                                <Send size={14} className="mr-2" /> Pubblica
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
                        <div className="spinner-dots"><div className="dot bg-indigo-400"></div><div className="dot bg-indigo-400"></div><div className="dot bg-indigo-400"></div></div>
                        <span className="text-xs uppercase tracking-widest font-medium opacity-70">Caricamento</span>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-600">Nessuna nota</p>
                            <p className="text-xs text-slate-400 mt-1">La bacheca è vuota.</p>
                        </div>
                    </div>
                ) : (
                    notes.map((note, i) => (
                        <div
                            key={note.id}
                            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all relative animate-in-up"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {note.author_name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">
                                            {note.author_name || "Sconosciuto"}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <span>per</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                                {note.recipient_name || "Tutti"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                    {new Date(note.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>

                            <div className="pl-10">
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                    {note.content}
                                </p>
                            </div>

                            <button
                                onClick={() => handleDelete(note.id)}
                                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Elimina nota"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

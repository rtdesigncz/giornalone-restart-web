"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Send, Trash2, User, ArrowRight, MessageSquare, X, Pin, Clock, Check, CheckCheck, AlertCircle, Info, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
    id: string;
    created_at: string;
    content: string;
    author_id: string;
    author_name: string;
    recipient_id: string;
    recipient_name: string;
    priority: 'normal' | 'urgent' | 'info';
    is_pinned: boolean;
    expires_at: string | null;
    read_by: string[];
    parent_id: string | null;
    replies?: Note[]; // Virtual field for UI
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
    const [currentUser, setCurrentUser] = useState<string | null>(null); // Simulating current user selection

    // Form State
    const [content, setContent] = useState("");
    const [authorId, setAuthorId] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [priority, setPriority] = useState<'normal' | 'urgent' | 'info'>('normal');
    const [isPinned, setIsPinned] = useState(false);
    const [expiresIn, setExpiresIn] = useState<string>(""); // "1h", "24h", "7d"
    const [replyTo, setReplyTo] = useState<Note | null>(null);

    const fetchNotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notes_v")
            .select("*")
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching notes:", error);
        } else {
            // Filter expired notes
            const now = new Date();
            const validNotes = (data || []).filter((n: any) => !n.expires_at || new Date(n.expires_at) > now);

            // Organize threads
            const threads: Note[] = [];
            const replyMap = new Map<string, Note[]>();

            // First pass: collect replies
            validNotes.forEach((n: Note) => {
                if (n.parent_id) {
                    if (!replyMap.has(n.parent_id)) replyMap.set(n.parent_id, []);
                    replyMap.get(n.parent_id)?.push(n);
                }
            });

            // Second pass: build root notes with replies
            validNotes.forEach((n: Note) => {
                if (!n.parent_id) {
                    const replies = replyMap.get(n.id) || [];
                    // Sort replies by date asc
                    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    threads.push({ ...n, replies });
                }
            });

            setNotes(threads);
        }
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

    // Effect to simulate "Me" based on authorId selection in form (for demo purposes)
    // In a real app, this would come from auth context
    useEffect(() => {
        if (authorId) setCurrentUser(authorId);
    }, [authorId]);

    const handleSave = async () => {
        if (!content.trim() || !authorId) {
            alert("Compila almeno il messaggio e chi scrive.");
            return;
        }

        let expiresAt = null;
        if (expiresIn) {
            const date = new Date();
            if (expiresIn === "1h") date.setHours(date.getHours() + 1);
            if (expiresIn === "24h") date.setHours(date.getHours() + 24);
            if (expiresIn === "7d") date.setDate(date.getDate() + 7);
            expiresAt = date.toISOString();
        }

        const payload = {
            content,
            author_id: authorId,
            recipient_id: recipientId || null, // Allow null for "All"
            priority,
            is_pinned: isPinned,
            expires_at: expiresAt,
            parent_id: replyTo?.id || null
        };

        const { error } = await supabase.from("notes").insert(payload);

        if (error) {
            alert("Errore salvataggio nota: " + error.message);
        } else {
            setContent("");
            setReplyTo(null);
            setIsAdding(false);
            // Reset defaults but keep author for convenience
            setPriority('normal');
            setIsPinned(false);
            setExpiresIn("");
            fetchNotes();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questa nota?")) return;
        await supabase.from("notes").delete().eq("id", id);
        fetchNotes();
    };

    const markAsRead = async (note: Note) => {
        if (!currentUser) return alert("Seleziona 'Chi scrive' nel form per identificarti.");

        if (note.read_by?.includes(currentUser)) return;

        const newReadBy = [...(note.read_by || []), currentUser];
        const { error } = await supabase
            .from("notes")
            .update({ read_by: newReadBy })
            .eq("id", note.id);

        if (!error) {
            // Optimistic update
            setNotes(prev => prev.map(n => {
                if (n.id === note.id) return { ...n, read_by: newReadBy };
                if (n.replies) {
                    const updatedReplies = n.replies.map(r => r.id === note.id ? { ...r, read_by: newReadBy } : r);
                    return { ...n, replies: updatedReplies };
                }
                return n;
            }));
        }
    };

    const startReply = (note: Note) => {
        setReplyTo(note);
        setIsAdding(true);
        // Pre-fill recipient with original author if replying
        setRecipientId(note.author_id);
    };

    const getPriorityColor = (p: string) => {
        if (p === 'urgent') return "bg-rose-100 text-rose-600 border-rose-200";
        if (p === 'info') return "bg-sky-100 text-sky-600 border-sky-200";
        return "bg-slate-100 text-slate-600 border-slate-200";
    };

    const getPriorityIcon = (p: string) => {
        if (p === 'urgent') return <AlertCircle size={12} />;
        if (p === 'info') return <Info size={12} />;
        return null;
    };

    // Count unread for "currentUser"
    const unreadCount = currentUser ? notes.filter(n =>
        (n.recipient_id === currentUser || !n.recipient_id) && // For me or for all
        n.author_id !== currentUser && // Not mine
        !n.read_by?.includes(currentUser)
    ).length : 0;

    return (
        <div className="glass-card flex flex-col h-[600px] relative overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/50 flex items-center justify-between bg-white/40 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="relative p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <MessageSquare size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Note Team</h2>
                        <p className="text-xs text-slate-500">
                            {unreadCount > 0 ? `${unreadCount} nuovi messaggi` : "Bacheca messaggi interna"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setIsAdding(!isAdding); setReplyTo(null); }}
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
                            <h3 className="text-sm font-bold text-indigo-900">
                                {replyTo ? `Risposta a ${replyTo.author_name}` : "Nuova Nota"}
                            </h3>
                            {replyTo && (
                                <button onClick={() => setReplyTo(null)} className="text-xs text-slate-400 hover:text-slate-600">
                                    Annulla risposta
                                </button>
                            )}
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
                                    <option value="">Tutti</option>
                                    {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setPriority('normal')}
                                    className={cn("px-2 py-1 rounded-md text-xs font-bold transition-colors", priority === 'normal' ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600")}
                                >Normal</button>
                                <button
                                    onClick={() => setPriority('urgent')}
                                    className={cn("px-2 py-1 rounded-md text-xs font-bold transition-colors", priority === 'urgent' ? "bg-rose-100 text-rose-600 shadow-sm" : "text-slate-400 hover:text-rose-500")}
                                >Urgent</button>
                                <button
                                    onClick={() => setPriority('info')}
                                    className={cn("px-2 py-1 rounded-md text-xs font-bold transition-colors", priority === 'info' ? "bg-sky-100 text-sky-600 shadow-sm" : "text-slate-400 hover:text-sky-500")}
                                >Info</button>
                            </div>

                            <button
                                onClick={() => setIsPinned(!isPinned)}
                                className={cn("p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-bold", isPinned ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-400 hover:text-amber-500")}
                            >
                                <Pin size={14} className={isPinned ? "fill-current" : ""} /> Pin
                            </button>

                            <select
                                className="input h-[34px] text-xs py-1 w-auto"
                                value={expiresIn}
                                onChange={e => setExpiresIn(e.target.value)}
                            >
                                <option value="">No Scadenza</option>
                                <option value="1h">1 Ora</option>
                                <option value="24h">24 Ore</option>
                                <option value="7d">7 Giorni</option>
                            </select>
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
                            className={cn(
                                "group bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all relative animate-in-up",
                                note.is_pinned ? "border-amber-200 bg-amber-50/30" : "border-slate-100 hover:border-indigo-100"
                            )}
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {/* Note Header */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {note.author_name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                            {note.author_name || "Sconosciuto"}
                                            {note.is_pinned && <Pin size={10} className="text-amber-500 fill-current" />}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <span>per</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                                {note.recipient_name || "Tutti"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", getPriorityColor(note.priority))}>
                                        {getPriorityIcon(note.priority)}
                                        {note.priority.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(note.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>

                            {/* Note Content */}
                            <div className="pl-10 mb-3">
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                    {note.content}
                                </p>
                            </div>

                            {/* Actions & Replies */}
                            <div className="pl-10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startReply(note)}
                                        className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Reply size={12} /> Rispondi
                                    </button>

                                    {currentUser && (
                                        <button
                                            onClick={() => markAsRead(note)}
                                            className={cn(
                                                "text-xs font-medium flex items-center gap-1 transition-colors",
                                                note.read_by?.includes(currentUser) ? "text-emerald-500 cursor-default" : "text-slate-400 hover:text-emerald-500"
                                            )}
                                            disabled={!!note.read_by?.includes(currentUser)}
                                        >
                                            {note.read_by?.includes(currentUser) ? <CheckCheck size={12} /> : <Check size={12} />}
                                            {note.read_by?.includes(currentUser) ? "Letto" : "Segna letto"}
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Elimina nota"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Replies List */}
                            {note.replies && note.replies.length > 0 && (
                                <div className="mt-3 pl-10 space-y-2">
                                    {note.replies.map(reply => (
                                        <div key={reply.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs relative group/reply">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-700">{reply.author_name}</span>
                                                <span className="text-slate-400">{new Date(reply.created_at).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-slate-600">{reply.content}</p>
                                            <button
                                                onClick={() => handleDelete(reply.id)}
                                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/reply:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Calendar as CalendarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalDateISO } from "@/lib/dateUtils";
import AppointmentTable from "./AppointmentTable";

export default function SessionManager() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [startTime, setStartTime] = useState("15:00");
    const [endTime, setEndTime] = useState("18:00");

    const [editingSession, setEditingSession] = useState<any | null>(null);
    const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

    const fetchSessions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("medical_sessions")
            .select("*")
            .order("date", { ascending: true });

        if (error) {
            console.error("Error fetching sessions:", error);
        } else {
            setSessions(data || []);
            // Select the first future session or the last one if available
            if (data && data.length > 0 && !selectedSessionId) {
                // Logic to select nearest future date could go here, for now just pick first
                setSelectedSessionId(data[0].id);
            }

            // Fetch pending counts for all sessions
            if (data && data.length > 0) {
                const sessionIds = data.map(s => s.id);
                const { data: appointments } = await supabase
                    .from("medical_appointments")
                    .select("session_id")
                    .in("session_id", sessionIds)
                    .not("whatsapp_sent", "eq", true);

                const counts: Record<string, number> = {};
                appointments?.forEach((app: any) => {
                    counts[app.session_id] = (counts[app.session_id] || 0) + 1;
                });
                setPendingCounts(counts);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const shouldShowBadge = (sessionDate: string) => {
        const today = getLocalDateISO();
        const d = new Date(today);
        const maxDateObj = new Date(d);
        maxDateObj.setDate(d.getDate() + 2);
        const maxDate = maxDateObj.toISOString().slice(0, 10);

        return sessionDate >= today && sessionDate <= maxDate;
    };

    const handleAddSession = async () => {
        if (!newDate) return;

        const { data, error } = await supabase
            .from("medical_sessions")
            .insert([{
                date: newDate,
                start_time: startTime,
                end_time: endTime
            }])
            .select()
            .single();

        if (error) {
            alert("Errore: " + error.message);
        } else {
            setNewDate("");
            await fetchSessions();
            setSelectedSessionId(data.id);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa data e tutti gli appuntamenti associati?")) return;

        const { error } = await supabase
            .from("medical_sessions")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Errore eliminazione: " + error.message);
        } else {
            setSelectedSessionId(null);
            fetchSessions();
        }
    };

    const handleUpdateSession = async () => {
        if (!editingSession) return;

        const { error } = await supabase
            .from("medical_sessions")
            .update({
                date: editingSession.date,
                start_time: editingSession.start_time,
                end_time: editingSession.end_time
            })
            .eq("id", editingSession.id);

        if (error) {
            alert("Errore aggiornamento: " + error.message);
        } else {
            setEditingSession(null);
            fetchSessions();
        }
    };

    return (
        <div className="flex flex-col">
            {/* Toolbar */}
            {/* 1. Add Session Form (Top) */}
            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 w-full overflow-hidden min-w-0">
                <div className="flex flex-col gap-4">
                    <div className="w-full min-w-0">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nuova Data</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="input text-base py-2 px-3 w-full max-w-full h-10 box-border block appearance-none min-w-0 bg-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full min-w-0">
                        <div className="w-full min-w-0">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Inizio</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="input text-base py-2 px-3 w-full max-w-full h-10 box-border block appearance-none min-w-0 bg-white"
                            />
                        </div>
                        <div className="w-full min-w-0">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fine</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="input text-base py-2 px-3 w-full max-w-full h-10 box-border block appearance-none min-w-0 bg-white"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddSession}
                        disabled={!newDate}
                        className="btn btn-brand text-sm py-2 px-3 h-10 w-full justify-center shadow-md shadow-brand/10"
                    >
                        <Plus size={18} className="mr-2" />
                        Aggiungi Data
                    </button>
                </div>
            </div>

            {/* 2. Session List (Middle) */}
            <div className="mb-6 w-full overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto w-full py-3 px-1 no-scrollbar snap-x">
                    {loading && sessions.length === 0 ? (
                        <div className="flex items-center text-slate-400 text-sm w-full justify-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Loader2 className="animate-spin mr-2" size={16} /> Caricamento date...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center w-full py-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Nessuna data disponibile. Aggiungine una sopra.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={cn(
                                    "relative flex-shrink-0 snap-start flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all whitespace-nowrap shadow-sm",
                                    selectedSessionId === session.id
                                        ? "bg-brand text-white border-brand shadow-brand/20"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-brand/50 hover:text-brand"
                                )}
                            >
                                <CalendarIcon size={16} />
                                {new Date(session.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}

                                {pendingCounts[session.id] > 0 && shouldShowBadge(session.date) && (
                                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-10">
                                        {pendingCounts[session.id]}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Session Actions (Bottom) */}
            {selectedSessionId && (
                <div className="mb-6 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    {editingSession && editingSession.id === selectedSessionId ? (
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-bold text-slate-700">Modifica Data e Orari</span>
                            <div className="flex flex-col gap-2 w-full min-w-0">
                                <input
                                    type="date"
                                    value={editingSession.date}
                                    onChange={e => setEditingSession({ ...editingSession, date: e.target.value })}
                                    className="input h-10 w-full max-w-full min-w-0 box-border block appearance-none text-base"
                                />
                                <div className="flex items-center gap-2 w-full min-w-0">
                                    <input
                                        type="time"
                                        value={editingSession.start_time}
                                        onChange={e => setEditingSession({ ...editingSession, start_time: e.target.value })}
                                        className="input h-10 flex-1 min-w-0 max-w-full box-border appearance-none text-base"
                                    />
                                    <span className="text-slate-400 flex-shrink-0">-</span>
                                    <input
                                        type="time"
                                        value={editingSession.end_time}
                                        onChange={e => setEditingSession({ ...editingSession, end_time: e.target.value })}
                                        className="input h-10 flex-1 min-w-0 max-w-full box-border appearance-none text-base"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleUpdateSession} className="btn btn-brand flex-1 h-9 text-xs">Salva</button>
                                <button onClick={() => setEditingSession(null)} className="btn btn-ghost flex-1 h-9 text-xs">Annulla</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                    <CalendarIcon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Orario Visite</p>
                                    <p className="font-bold text-slate-800">
                                        {sessions.find(s => s.id === selectedSessionId)?.start_time?.slice(0, 5)} - {sessions.find(s => s.id === selectedSessionId)?.end_time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingSession(sessions.find(s => s.id === selectedSessionId))}
                                    className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                                    title="Modifica Orari"
                                >
                                    <Pencil size={18} />
                                    <span className="text-[10px] font-bold">Modifica</span>
                                </button>
                                <div className="w-px h-8 bg-slate-100 mx-1"></div>
                                <button
                                    onClick={() => handleDeleteSession(selectedSessionId)}
                                    className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Elimina Data"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-[10px] font-bold">Elimina</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="mt-4">
                {selectedSessionId ? (
                    <AppointmentTable sessionId={selectedSessionId} onUpdate={fetchSessions} />
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <CalendarIcon size={48} className="mb-4 opacity-20" />
                        <p>Seleziona una data o aggiungine una nuova per gestire gli appuntamenti.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

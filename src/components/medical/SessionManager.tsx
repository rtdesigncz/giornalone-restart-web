"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AppointmentTable from "./AppointmentTable";

export default function SessionManager() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [startTime, setStartTime] = useState("15:00");
    const [endTime, setEndTime] = useState("18:00");

    const [editingSession, setEditingSession] = useState<any | null>(null);

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
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
                    {loading && sessions.length === 0 ? (
                        <div className="flex items-center text-slate-400 text-sm">
                            <Loader2 className="animate-spin mr-2" size={16} /> Caricamento date...
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap",
                                    selectedSessionId === session.id
                                        ? "bg-brand/10 border-brand text-brand shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <CalendarIcon size={14} />
                                {new Date(session.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                            </button>
                        ))
                    )}
                </div>

                <div className="flex flex-wrap items-end gap-2 flex-shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-200 w-full md:w-auto">
                    <div className="flex flex-col gap-1 flex-1 md:flex-none min-w-[120px]">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Data</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="input text-sm py-1 px-2 w-full md:w-auto h-8"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 md:flex-none min-w-[80px]">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Inizio</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input text-sm py-1 px-2 w-full md:w-24 h-8"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 md:flex-none min-w-[80px]">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Fine</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="input text-sm py-1 px-2 w-full md:w-24 h-8"
                        />
                    </div>
                    <button
                        onClick={handleAddSession}
                        disabled={!newDate}
                        className="btn btn-primary text-sm py-1 px-3 h-8 gap-2 w-full md:w-auto justify-center"
                    >
                        <Plus size={16} />
                        Aggiungi
                    </button>
                </div>
            </div>

            {/* Session Actions (Edit/Delete) */}
            {selectedSessionId && (
                <div className="mb-4 flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    {editingSession && editingSession.id === selectedSessionId ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">Modifica Orari:</span>
                            <input
                                type="time"
                                value={editingSession.start_time}
                                onChange={e => setEditingSession({ ...editingSession, start_time: e.target.value })}
                                className="input h-8 w-24 text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="time"
                                value={editingSession.end_time}
                                onChange={e => setEditingSession({ ...editingSession, end_time: e.target.value })}
                                className="input h-8 w-24 text-sm"
                            />
                            <button onClick={handleUpdateSession} className="btn btn-primary h-8 text-xs">Salva</button>
                            <button onClick={() => setEditingSession(null)} className="btn btn-ghost h-8 text-xs">Annulla</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            {sessions.find(s => s.id === selectedSessionId) && (
                                <>
                                    <span className="font-medium">
                                        Orario: {sessions.find(s => s.id === selectedSessionId).start_time?.slice(0, 5)} - {sessions.find(s => s.id === selectedSessionId).end_time?.slice(0, 5)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingSession(sessions.find(s => s.id === selectedSessionId))}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Modifica Orari
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            onClick={() => handleDeleteSession(selectedSessionId)}
                                            className="text-rose-600 hover:underline text-xs"
                                        >
                                            Elimina Data
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="mt-4">
                {selectedSessionId ? (
                    <AppointmentTable sessionId={selectedSessionId} />
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

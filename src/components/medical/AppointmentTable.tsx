"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Trash2, MessageCircle, Edit2, X, Check, Loader2, Euro, FileDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanPhone } from "@/lib/whatsapp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AppointmentTableProps {
    sessionId: string;
}

export default function AppointmentTable({ sessionId }: AppointmentTableProps) {
    const [appointments, setAppointments] = useState<Record<string, any>>({}); // Map slot -> appointment
    const [loading, setLoading] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);
    const [slots, setSlots] = useState<string[]>([]);

    // Editing State
    const [editingSlot, setEditingSlot] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        client_name: "",
        client_surname: "",
        client_phone: "",
        price: 35.00,
        is_paid: false
    });

    const generateSlots = (start: string, end: string) => {
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);

        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;
        const interval = 10;

        const newSlots = [];
        // Inclusive loop: t <= endTime
        for (let t = startTime; t <= endTime; t += interval) {
            const h = Math.floor(t / 60);
            const m = t % 60;
            newSlots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        }
        return newSlots;
    };

    const fetchAppointments = async () => {
        setLoading(true);

        // Fetch session details
        const { data: sData } = await supabase
            .from("medical_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sData) {
            setSessionData(sData);
            setSlots(generateSlots(sData.start_time || "15:00", sData.end_time || "18:00"));
        }

        const { data, error } = await supabase
            .from("medical_appointments")
            .select("*")
            .eq("session_id", sessionId);

        if (error) {
            console.error(error);
        } else {
            const map: Record<string, any> = {};
            data?.forEach(app => {
                const time = app.time_slot.slice(0, 5);
                map[time] = app;
            });
            setAppointments(map);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAppointments();
        setEditingSlot(null);
    }, [sessionId]);

    const handleSave = async (slot: string) => {
        const existing = appointments[slot];

        const payload = {
            session_id: sessionId,
            time_slot: slot,
            client_name: editForm.client_name,
            client_surname: editForm.client_surname,
            client_phone: editForm.client_phone,
            price: editForm.price,
            is_paid: editForm.is_paid
        };

        let error;
        if (existing) {
            const { error: err } = await supabase
                .from("medical_appointments")
                .update(payload)
                .eq("id", existing.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from("medical_appointments")
                .insert([payload]);
            error = err;
        }

        if (error) {
            alert("Errore salvataggio: " + error.message);
        } else {
            setEditingSlot(null);
            fetchAppointments();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare appuntamento?")) return;
        await supabase.from("medical_appointments").delete().eq("id", id);
        fetchAppointments();
    };

    const startEdit = (slot: string, app?: any) => {
        setEditingSlot(slot);
        if (app) {
            setEditForm({
                client_name: app.client_name || "",
                client_surname: app.client_surname || "",
                client_phone: app.client_phone || "",
                price: app.price || 35.00,
                is_paid: app.is_paid || false
            });
        } else {
            setEditForm({
                client_name: "",
                client_surname: "",
                client_phone: "",
                price: 35.00,
                is_paid: false
            });
        }
    };

    const handleWhatsApp = async (app: any) => {
        if (!app.client_phone) {
            alert("Numero di telefono mancante");
            return;
        }

        const phone = cleanPhone(app.client_phone);
        if (!phone) {
            alert("Numero di telefono non valido");
            return;
        }

        const formattedDate = new Date(sessionData.date).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
        // Use only First Name
        const message = `Ciao ${app.client_name},
ti ricordiamo che in data ${formattedDate} alle ore ${app.time_slot.slice(0, 5)}, ti aspettiamo in palestra per il rilascio del certificato medico.
Il prezzo sarà di €${app.price} pagabili in contanti al desk.

Ti aspettiamo!`;

        const encodedMessage = encodeURIComponent(message);
        const link = `https://wa.me/${phone}?text=${encodedMessage}`;

        window.open(link, "_blank");

        await supabase
            .from("medical_appointments")
            .update({ whatsapp_sent: true })
            .eq("id", app.id);

        fetchAppointments();
    };

    const togglePaid = async (app: any) => {
        await supabase
            .from("medical_appointments")
            .update({ is_paid: !app.is_paid })
            .eq("id", app.id);
        fetchAppointments();
    };

    const exportPDF = async () => {
        if (!sessionData) return;

        const doc = new jsPDF();
        const dateStr = new Date(sessionData.date).toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        // Add Logo
        try {
            const img = new Image();
            img.src = "/app-logo.png";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            // Center logo: Page width is 210mm. Logo width approx 40mm?
            const pageWidth = doc.internal.pageSize.getWidth();
            const logoWidth = 40;
            const logoHeight = (img.height / img.width) * logoWidth;
            const x = (pageWidth - logoWidth) / 2;

            doc.addImage(img, "PNG", x, 10, logoWidth, logoHeight);

            // Move title down
            doc.setFontSize(16);
            doc.setTextColor(33, 181, 186); // Brand color #21b5ba
            doc.text(`Report Visite Mediche`, pageWidth / 2, 10 + logoHeight + 10, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(dateStr, pageWidth / 2, 10 + logoHeight + 18, { align: "center" });

            const tableData = slots.map(slot => {
                const app = appointments[slot];
                return [
                    slot,
                    app ? app.client_name : "",
                    app ? app.client_surname : "",
                    app ? app.client_phone : "",
                    app ? (app.is_paid ? "Sì" : "No") : "",
                    app ? `€ ${app.price}` : ""
                ];
            });

            autoTable(doc, {
                startY: 10 + logoHeight + 25,
                head: [['Ora', 'Nome', 'Cognome', 'Telefono', 'Pagato', 'Prezzo']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [33, 181, 186] }, // Brand color #21b5ba
                styles: { fontSize: 10 },
            });

            doc.save(`visite_mediche_${sessionData.date}.pdf`);
        } catch (e) {
            console.error("Error loading logo", e);
            alert("Errore generazione PDF");
        }
    };

    if (loading && slots.length === 0) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <button onClick={exportPDF} className="btn btn-outline gap-2 text-sm">
                    <FileDown size={16} /> Esporta PDF
                </button>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">

                {/* Desktop Table */}
                <table className="hidden md:table w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="p-3 w-20 text-center">Ora</th>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Cognome</th>
                            <th className="p-3 w-40">Telefono</th>
                            <th className="p-3 w-24 text-center">Pagato</th>
                            <th className="p-3 w-24 text-right">Prezzo</th>
                            <th className="p-3 w-40 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {slots.map(slot => {
                            const app = appointments[slot];
                            const isEditing = editingSlot === slot;

                            return (
                                <tr key={slot} className={cn("group transition-colors", app ? "bg-white hover:bg-slate-50" : "bg-slate-50/30 hover:bg-slate-50")}>
                                    <td className="p-3 text-center font-mono font-bold text-slate-600 bg-slate-50 border-r border-slate-100">
                                        {slot}
                                    </td>

                                    {isEditing ? (
                                        <>
                                            <td className="p-2">
                                                <input
                                                    className="input w-full h-8 text-sm"
                                                    placeholder="Nome"
                                                    autoFocus
                                                    value={editForm.client_name}
                                                    onChange={e => setEditForm({ ...editForm, client_name: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    className="input w-full h-8 text-sm"
                                                    placeholder="Cognome"
                                                    value={editForm.client_surname}
                                                    onChange={e => setEditForm({ ...editForm, client_surname: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    className="input w-full h-8 text-sm"
                                                    placeholder="Telefono"
                                                    value={editForm.client_phone}
                                                    onChange={e => setEditForm({ ...editForm, client_phone: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={editForm.is_paid}
                                                    onChange={e => setEditForm({ ...editForm, is_paid: e.target.checked })}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    type="number"
                                                    className="input w-20 h-8 text-sm text-right"
                                                    value={editForm.price}
                                                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                                />
                                            </td>
                                            <td className="p-2 text-right flex items-center justify-end gap-1">
                                                <button onClick={() => handleSave(slot)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200">
                                                    <Save size={16} />
                                                </button>
                                                <button onClick={() => setEditingSlot(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200">
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 font-medium text-slate-800">
                                                {app ? app.client_name : <span className="text-slate-400 italic text-xs">Libero</span>}
                                            </td>
                                            <td className="p-3 font-medium text-slate-800">
                                                {app ? app.client_surname : ""}
                                            </td>
                                            <td className="p-3 text-slate-600 font-mono text-xs">
                                                {app?.client_phone}
                                            </td>
                                            <td className="p-3 text-center">
                                                {app && (
                                                    <button
                                                        onClick={() => togglePaid(app)}
                                                        className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase", app.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}
                                                    >
                                                        {app.is_paid ? "Sì" : "No"}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono text-slate-600">
                                                {app && `€${app.price}`}
                                            </td>
                                            <td className="p-3 text-right flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {app ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleWhatsApp(app)}
                                                            className={cn(
                                                                "p-1.5 rounded hover:bg-emerald-100 transition-colors",
                                                                app.whatsapp_sent ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-emerald-600"
                                                            )}
                                                            title="Invia WhatsApp"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </button>
                                                        <button onClick={() => startEdit(slot, app)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(app.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => startEdit(slot)} className="px-3 py-1 bg-slate-100 hover:bg-brand hover:text-white text-slate-600 text-xs font-bold rounded transition-colors">
                                                        Prenota
                                                    </button>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-4 bg-slate-50/50">
                    {slots.map(slot => {
                        const app = appointments[slot];
                        const isEditing = editingSlot === slot;

                        if (isEditing) {
                            return (
                                <div key={slot} className="bg-white p-4 rounded-xl border border-brand shadow-lg ring-4 ring-brand/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-lg font-bold text-brand">{slot}</span>
                                        <span className="text-xs font-bold uppercase text-slate-400">Modifica</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                                                <input
                                                    className="input w-full"
                                                    placeholder="Nome"
                                                    value={editForm.client_name}
                                                    onChange={e => setEditForm({ ...editForm, client_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Cognome</label>
                                                <input
                                                    className="input w-full"
                                                    placeholder="Cognome"
                                                    value={editForm.client_surname}
                                                    onChange={e => setEditForm({ ...editForm, client_surname: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Telefono</label>
                                            <input
                                                className="input w-full"
                                                placeholder="Telefono"
                                                value={editForm.client_phone}
                                                onChange={e => setEditForm({ ...editForm, client_phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Prezzo</label>
                                                <div className="relative">
                                                    <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        className="input w-full pl-8"
                                                        value={editForm.price}
                                                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-4">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={editForm.is_paid}
                                                    onChange={e => setEditForm({ ...editForm, is_paid: e.target.checked })}
                                                />
                                                <span className="text-sm font-medium text-slate-700">Pagato</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => setEditingSlot(null)} className="btn btn-ghost flex-1">Annulla</button>
                                            <button onClick={() => handleSave(slot)} className="btn btn-primary flex-1">Salva</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={slot} className={cn(
                                "bg-white p-4 rounded-xl border shadow-sm transition-all",
                                app ? "border-slate-200" : "border-slate-100 bg-slate-50/50 opacity-80"
                            )}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{slot}</span>
                                        {app ? (
                                            <div>
                                                <div className="font-bold text-slate-900">{app.client_name} {app.client_surname}</div>
                                                {app.client_phone && <div className="text-xs text-slate-500 font-mono">{app.client_phone}</div>}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">Libero</span>
                                        )}
                                    </div>
                                    {app && (
                                        <button
                                            onClick={() => togglePaid(app)}
                                            className={cn(
                                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border",
                                                app.is_paid
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                            )}
                                        >
                                            {app.is_paid ? "Pagato" : "Non Pagato"}
                                        </button>
                                    )}
                                </div>

                                {app ? (
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleWhatsApp(app)}
                                            className={cn(
                                                "flex-1 h-10 flex items-center justify-center rounded-lg border transition-colors",
                                                app.whatsapp_sent
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                                            )}
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => startEdit(slot, app)}
                                            className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => startEdit(slot)}
                                        className="w-full mt-2 py-2 bg-white border border-dashed border-slate-300 text-slate-400 rounded-lg hover:border-brand hover:text-brand transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Prenota
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

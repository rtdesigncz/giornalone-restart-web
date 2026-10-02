"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { X, Calendar, MessageSquare, CheckCircle2, XCircle, Clock, AlertCircle, Phone, ArrowRight, Users } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface ClientTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string | null;
  name: string | null;
}

type TimelineEvent = {
  id: string;
  entry_date: string;
  entry_time: string | null;
  consulente_id: string | null;
  consulente_name: string | null;
  section: string;
  note: string | null;
  venduto: boolean;
  miss: boolean;
  assente: boolean;
  esito: string | null;
  tipo_abbonamento_id: string | null;
  nuovo_abbonamento_name: string | null;
  isRecuperato?: boolean;
};

export default function ClientTimelineDrawer({ isOpen, onClose, phone, name }: ClientTimelineDrawerProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!phone && !name) {
      setEvents([]);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      
      // Fetch tipi abbonamento per mappare l'ID al Nome
      const { data: tipiData } = await supabase.from("tipi_abbonamento").select("*");
      const tipiMap: Record<string, string> = {};
      if (tipiData) {
        tipiData.forEach(t => { tipiMap[t.id] = t.name || t.nome || "Sconosciuto"; });
      }

      const { data: consulentiData } = await supabase.from("consulenti").select("*");
      const consulentiMap: Record<string, string> = {};
      if (consulentiData) {
        consulentiData.forEach(c => { consulentiMap[c.id] = c.name || c.nome || "Sconosciuto"; });
      }

      let query = supabase.from("entries").select("*");
      
      if (phone && phone.length > 4) {
        query = query.eq("telefono", phone);
      } else if (name) {
        const nameParts = name.trim().split(" ");
        if (nameParts.length > 1) {
            query = query.ilike("nome", `%${nameParts[0]}%`).ilike("cognome", `%${nameParts.slice(1).join(" ")}%`);
        } else {
            query = query.ilike("nome", `%${name}%`);
        }
      }

      const { data, error } = await query.order("entry_date", { ascending: false });
      
      if (!error && data) {
        const mappedData = data.map(ev => ({
          ...ev,
          nuovo_abbonamento_name: ev.tipo_abbonamento_id ? tipiMap[ev.tipo_abbonamento_id] : null,
          consulente_name: ev.consulente_id ? consulentiMap[ev.consulente_id] : null
        }));
        console.log("Timeline events:", mappedData, "TipiMap:", tipiMap);
        setEvents(mappedData);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [isOpen, phone, name]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 shrink-0 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-xl shadow-inner">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{name || "Cliente Sconosciuto"}</h2>
                {phone && (
                  <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-1">
                    <Phone size={13} className="text-slate-400" /> {phone}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content (Timeline) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Lettura storico...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3 opacity-60">
              <Clock size={32} />
              <p className="text-sm font-medium text-center">Nessun evento passato trovato per questo cliente.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-8">
              {events.map((ev, index) => {
                
                let Icon = Calendar;
                
                const now = new Date();
                const eventDate = new Date(`${ev.entry_date}T${ev.entry_time || "00:00:00"}`);
                const isPast = eventDate < now;
                
                let colorClass = isPast ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-500 border-blue-200";
                let statusText = isPast ? "Senza Esito" : "Da Svolgere";
                
                if (ev.venduto) {
                  Icon = CheckCircle2;
                  colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                  statusText = "Venduto";
                } else if (ev.assente) {
                  Icon = AlertCircle;
                  colorClass = "bg-rose-100 text-rose-500 border-rose-200";
                  statusText = "Assente";
                } else if (ev.miss) {
                  Icon = XCircle;
                  colorClass = "bg-orange-100 text-orange-500 border-orange-200";
                  statusText = "Miss";
                } else if (ev.esito) {
                  // Se ha un esito (non nullo) ma non rientra nei 3 sopra
                  statusText = "Svolto";
                }

                return (
                  <div key={ev.id} className="relative pl-6">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${colorClass} shadow-sm z-10`}>
                      <Icon size={14} />
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-2 bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                            <Calendar size={12} className="text-slate-400" />
                            {formatDate(ev.entry_date)} {ev.entry_time ? `• ${ev.entry_time.slice(0, 5)}` : ""}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${colorClass.replace('bg-', 'bg-opacity-30 bg-').replace('border-', 'border-')}`}>
                            {statusText}
                          </span>
                        </div>
                        {ev.consulente_name && (
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                            <Users size={11} className="text-slate-400 shrink-0" />
                            Consulente: <span className="uppercase text-slate-700 tracking-wider font-bold">{ev.consulente_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <ArrowRight size={14} className="text-brand shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-snug">{ev.section}</span>
                        </div>

                        {ev.venduto && (
                          <div className="inline-flex bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 mt-2 shadow-sm">
                            + {ev.nuovo_abbonamento_name || "TIPO NON SPECIFICATO"}
                          </div>
                        )}

                        {ev.esito && !ev.venduto && (
                          <div className="inline-flex bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 mt-2">
                            Esito: {ev.esito}
                          </div>
                        )}

                        {ev.note && (
                          <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100 text-sm text-slate-700 flex gap-2 items-start mt-2 shadow-inner">
                            <MessageSquare size={14} className="mt-0.5 shrink-0 text-amber-500" />
                            <p className="whitespace-pre-wrap leading-relaxed">{ev.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

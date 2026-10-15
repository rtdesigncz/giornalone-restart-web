"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { 
  X, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Phone, 
  PhoneCall,
  ArrowRight, 
  Users, 
  RefreshCw, 
  ThumbsDown, 
  Check 
} from "lucide-react";
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
  venduto?: boolean;
  presentato?: boolean;
  miss?: boolean;
  assente?: boolean;
  negativo?: boolean;
  contattato?: boolean;
  esito?: string | null;
  tipo_abbonamento_id?: string | null;
  nuovo_abbonamento_name?: string | null;
  isRecuperato?: boolean;
  sourceType: 'entry' | 'consulenza';
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
      
      try {
        // 1. Fetch maps for foreign keys
        const [{ data: tipiData }, { data: consulentiData }] = await Promise.all([
          supabase.from("tipi_abbonamento").select("id, name"),
          supabase.from("consulenti").select("id, name")
        ]);

        const tipiMap: Record<string, string> = {};
        if (tipiData) {
          tipiData.forEach((t: any) => { tipiMap[t.id] = t.name || "Sconosciuto"; });
        }

        const consulentiMap: Record<string, string> = {};
        if (consulentiData) {
          consulentiData.forEach((c: any) => { consulentiMap[c.id] = c.name || "Sconosciuto"; });
        }

        // Clean phone for resilient matching
        const rawPhone = phone ? phone.trim() : "";
        const cleanDigits = rawPhone.replace(/\D/g, "");
        const searchPhone = cleanDigits.length >= 7 ? cleanDigits.slice(-7) : cleanDigits;

        // Name tokens for flexible matching
        const nameTokens = name ? name.trim().split(/\s+/).filter(Boolean) : [];

        // 2. Query entries (Agenda & Reportistica)
        let entriesQuery = supabase.from("entries").select("*");
        if (searchPhone.length >= 6) {
          entriesQuery = entriesQuery.or(`telefono.ilike.%${searchPhone}%,telefono.eq.${rawPhone}`);
        } else if (nameTokens.length >= 2) {
          const t1 = nameTokens[0];
          const t2 = nameTokens.slice(1).join(" ");
          entriesQuery = entriesQuery.or(`and(nome.ilike.%${t1}%,cognome.ilike.%${t2}%),and(nome.ilike.%${t2}%,cognome.ilike.%${t1}%)`);
        } else if (nameTokens.length === 1) {
          entriesQuery = entriesQuery.or(`nome.ilike.%${nameTokens[0]}%,cognome.ilike.%${nameTokens[0]}%`);
        } else {
          setEvents([]);
          setLoading(false);
          return;
        }

        // 3. Query gestione_items (Consulenze)
        let gestioneQuery = supabase.from("gestione_items").select("*, gestioni(nome)");
        if (searchPhone.length >= 6) {
          gestioneQuery = gestioneQuery.or(`telefono.ilike.%${searchPhone}%,telefono.eq.${rawPhone}`);
        } else if (nameTokens.length >= 2) {
          const t1 = nameTokens[0];
          const t2 = nameTokens.slice(1).join(" ");
          gestioneQuery = gestioneQuery.or(`and(nome.ilike.%${t1}%,cognome.ilike.%${t2}%),and(nome.ilike.%${t2}%,cognome.ilike.%${t1}%)`);
        } else if (nameTokens.length === 1) {
          gestioneQuery = gestioneQuery.or(`nome.ilike.%${nameTokens[0]}%,cognome.ilike.%${nameTokens[0]}%`);
        }

        const [{ data: entriesData, error: errEntries }, { data: gestioneData }] = await Promise.all([
          entriesQuery.order("entry_date", { ascending: false }),
          gestioneQuery.order("created_at", { ascending: false })
        ]);

        if (errEntries) throw errEntries;

        const allTimelineEvents: TimelineEvent[] = [];

        // Map entries
        if (entriesData) {
          entriesData.forEach((ev: any) => {
            allTimelineEvents.push({
              id: ev.id,
              entry_date: ev.entry_date,
              entry_time: ev.entry_time,
              consulente_id: ev.consulente_id,
              consulente_name: ev.consulente_id ? consulentiMap[ev.consulente_id] : null,
              section: ev.section,
              note: ev.note,
              venduto: Boolean(ev.venduto),
              presentato: Boolean(ev.presentato),
              miss: Boolean(ev.miss),
              assente: Boolean(ev.assente),
              negativo: Boolean(ev.negativo),
              contattato: Boolean(ev.contattato),
              tipo_abbonamento_id: ev.tipo_abbonamento_id,
              nuovo_abbonamento_name: ev.tipo_abbonamento_id ? tipiMap[ev.tipo_abbonamento_id] : null,
              sourceType: 'entry'
            });
          });
        }

        // Map gestione_items (Consulenze)
        if (gestioneData) {
          gestioneData.forEach((g: any) => {
            const dateStr = g.data_consulenza || g.scadenza || (g.created_at ? g.created_at.slice(0, 10) : "");
            const listTitle = g.gestioni?.nome ? `Consulenza (${g.gestioni.nome})` : "Consulenza";
            
            // Skip duplicate if entry_id already tracked
            if (g.entry_id && allTimelineEvents.some(e => e.id === g.entry_id)) {
              return;
            }

            const esitoUpper = g.esito ? g.esito.toUpperCase() : null;
            const isSale = Boolean(esitoUpper && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(esitoUpper));

            allTimelineEvents.push({
              id: `gestione-${g.id}`,
              entry_date: dateStr,
              entry_time: null,
              consulente_id: null,
              consulente_name: null,
              section: listTitle,
              note: g.note,
              venduto: isSale,
              presentato: Boolean(g.consulenza_fatta),
              miss: false,
              assente: false,
              negativo: esitoUpper === "NEGATIVO",
              contattato: Boolean(g.contattato),
              esito: g.esito,
              tipo_abbonamento_id: null,
              nuovo_abbonamento_name: g.nuovo_abbonamento_name || null,
              sourceType: 'consulenza'
            });
          });
        }

        // Look-ahead for Miss Recuperato
        const soldDates = allTimelineEvents
          .filter(e => e.venduto && e.entry_date)
          .map(e => e.entry_date);

        allTimelineEvents.forEach(ev => {
          if (ev.miss && ev.entry_date) {
            const hasFutureSale = soldDates.some(sDate => sDate >= ev.entry_date);
            if (hasFutureSale) {
              ev.isRecuperato = true;
            }
          }
        });

        // Sort descending by date, then time
        allTimelineEvents.sort((a, b) => {
          const dateDiff = (b.entry_date || "").localeCompare(a.entry_date || "");
          if (dateDiff !== 0) return dateDiff;
          return (b.entry_time || "00:00").localeCompare(a.entry_time || "00:00");
        });

        setEvents(allTimelineEvents);
      } catch (err) {
        console.error("Error fetching client history:", err);
      } finally {
        setLoading(false);
      }
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
              {events.map((ev) => {
                const now = new Date();
                const eventDateTime = new Date(`${ev.entry_date || ""}T${ev.entry_time || "00:00:00"}`);
                const isPast = eventDateTime < now;

                let Icon = Calendar;
                let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
                let statusText = isPast ? "Senza Esito" : "Da Svolgere";

                // Outcome evaluation hierarchy
                if (ev.venduto) {
                  Icon = CheckCircle2;
                  colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
                  statusText = ev.esito ? ev.esito : "Venduto";
                } else if (ev.isRecuperato) {
                  Icon = RefreshCw;
                  colorClass = "bg-cyan-100 text-cyan-700 border-cyan-200";
                  statusText = "Miss Recuperato";
                } else if (ev.miss) {
                  Icon = XCircle;
                  colorClass = "bg-orange-100 text-orange-700 border-orange-200";
                  statusText = ev.presentato ? "Miss (Presentato)" : "Miss con App.";
                } else if (ev.assente) {
                  Icon = AlertCircle;
                  colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                  statusText = "Assente";
                } else if (ev.negativo) {
                  Icon = ThumbsDown;
                  colorClass = "bg-rose-100 text-rose-700 border-rose-200";
                  statusText = "Negativo";
                } else if (ev.presentato) {
                  Icon = Check;
                  colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  statusText = "Presentato";
                } else if (ev.esito) {
                  if (ev.esito.toUpperCase() === "IN ATTESA") {
                    Icon = Clock;
                    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
                    statusText = "In Attesa";
                  } else {
                    Icon = CheckCircle2;
                    colorClass = "bg-slate-100 text-slate-700 border-slate-200";
                    statusText = ev.esito;
                  }
                } else if (ev.section === "APPUNTAMENTI TELEFONICI") {
                  if (ev.contattato) {
                    Icon = PhoneCall;
                    colorClass = "bg-blue-100 text-blue-700 border-blue-200";
                    statusText = "Contattato";
                  } else {
                    Icon = Phone;
                    colorClass = "bg-sky-50 text-sky-700 border-sky-200";
                    statusText = "Da Chiamare";
                  }
                } else if (ev.contattato) {
                  Icon = PhoneCall;
                  colorClass = "bg-blue-100 text-blue-700 border-blue-200";
                  statusText = "Contattato";
                } else {
                  Icon = Clock;
                  colorClass = isPast ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-600 border-blue-200";
                  statusText = isPast ? "Senza Esito" : "Da Svolgere";
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

                        {/* Sold badge */}
                        {ev.venduto && (
                          <div className="inline-flex bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 mt-2 shadow-sm">
                            + {ev.nuovo_abbonamento_name || "TIPO NON SPECIFICATO"}
                          </div>
                        )}

                        {/* Recovered badge */}
                        {ev.isRecuperato && (
                          <div className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-200 mt-2 shadow-sm">
                            <RefreshCw size={12} /> Contatto recuperato (ha acquistato in seguito)
                          </div>
                        )}

                        {/* Presence badge if also attended */}
                        {ev.presentato && !ev.venduto && !ev.isRecuperato && ev.miss && (
                          <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            <Check size={11} /> Cliente presente all&apos;appuntamento
                          </div>
                        )}

                        {/* Custom consultation status */}
                        {ev.esito && !ev.venduto && ev.esito.toUpperCase() !== "NEGATIVO" && (
                          <div className="inline-flex bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 mt-2">
                            Esito: {ev.esito}
                          </div>
                        )}

                        {/* Note */}
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

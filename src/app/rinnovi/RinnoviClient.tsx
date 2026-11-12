// src/app/rinnovi/RinnoviClient.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  Users,
  ChevronDown,
  Check,
  X,
  XCircle,
  MoreHorizontal,
  Flame,
  ArrowRight,
  TrendingUp,
  History,
  FileText,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import ClientDetailDrawer from "@/app/clienti/ClientDetailDrawer";
import CustomSelect from "@/components/ui/CustomSelect";

const ESITI = ["RINNOVO", "INTEGRAZIONE", "IN ATTESA", "NEGATIVO"] as const;

export const MOTIVI_NEGATIVO = [
  { value: "NON FREQUENTA", label: "Non frequenta" },
  { value: "INSODDISFATTO", label: "Insoddisfatto" },
  { value: "TRASFERIMENTO", label: "Trasferimento" },
  { value: "INFORTUNIO", label: "Infortunio" },
  { value: "ALTRO", label: "Altro" },
] as const;

export default function RinnoviClient() {
  const [mese, setMese] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    contattati: 0,
    appuntamenti: 0,
    consulenze: 0,
    rinnovati: 0,
    integrazioni: 0,
    inAttesa: 0,
    negativi: 0,
    tassoChiusura: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [esitoFilter, setEsitoFilter] = useState("ALL");
  const [disciplinaFilter, setDisciplinaFilter] = useState("ALL");

  // Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<any>(null);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  // Editing cells state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const fetchRinnovi = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("mese", mese);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (esitoFilter !== "ALL") params.set("esito", esitoFilter);
      if (disciplinaFilter !== "ALL") params.set("disciplina", disciplinaFilter);

      const res = await fetch(`/api/rinnovi?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setItems(data.items);
        setCounts(data.counts || {});
        if (data.availableMonths && data.availableMonths.length > 0) {
          setAvailableMonths(data.availableMonths);
        }
      }
    } catch (err) {
      console.error("Error fetching rinnovi:", err);
    } finally {
      setLoading(false);
    }
  }, [mese, searchQuery, esitoFilter, disciplinaFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRinnovi();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRinnovi]);

  const updateItem = async (id: string, updates: Record<string, any>) => {
    // Optimistic UI update
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

    try {
      await fetch(`/api/rinnovi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update item:", err);
      fetchRinnovi();
    }
  };

  const handleBookAppointment = (item: any) => {
    const client = item.client;
    setDrawerInitialData({
      section: "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
      nome: client?.nome || "",
      cognome: client?.cognome || "",
      telefono: client?.telefono || "",
      client_id: item.client_id,
      note: `RINNOVO DA LISTA SCADENZA ${formatMonthHuman(item.mese_riferimento)} - Abbonamento precedente: ${item.abbonamento_originario || ""}`,
    });
    setDrawerOpen(true);
  };

  const formatMonthHuman = (mStr: string) => {
    const [y, m] = mStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    const monthName = new Intl.DateTimeFormat("it-IT", { month: "long" }).format(date);
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  };

  const cleanPhone = (p?: string | null) => (p || "").replace(/[^\d]/g, "");

  const getDaysDiff = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[1650px] mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#21b5ba]/10 text-[#21b5ba] flex items-center justify-center font-bold shadow-inner">
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestione Rinnovi</h1>
                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                  Real-Time Agenda
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Sincronizzazione in tempo reale con l'Agenda e le scadenze clienti
              </p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mese Scadenza:</span>
            <select
              value={mese}
              onChange={(e) => setMese(e.target.value)}
              className="text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#21b5ba]/20 focus:border-[#21b5ba] cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthHuman(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1650px] mx-auto px-4 md:px-8 pt-5 space-y-5">
        {/* KPI Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* Card 1: In Scadenza */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>In Scadenza</span>
              <Calendar size={14} className="text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{counts.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{formatMonthHuman(mese)}</div>
          </div>

          {/* Card 2: Contattati */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Contattati</span>
              <Phone size={14} className="text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-cyan-600 mt-1">{counts.contattati}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {counts.total > 0 ? `${Math.round((counts.contattati / counts.total) * 100)}% del totale` : "0%"}
            </div>
          </div>

          {/* Card 3: Appuntamenti */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>In Agenda</span>
              <CalendarCheck size={14} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{counts.appuntamenti}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Fissati per colloquio</div>
          </div>

          {/* Card 4: Rinnovati */}
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-300 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <span>Rinnovati</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{counts.rinnovati}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Tasso: <b>{counts.tassoChiusura}%</b>
            </div>
          </div>

          {/* Card 5: In Attesa */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span>In Attesa / Miss</span>
              <Clock size={14} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{counts.inAttesa}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Da richiamare</div>
          </div>

          {/* Card 6: Negativi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 uppercase tracking-wider">
              <span>Negativi</span>
              <AlertCircle size={14} className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{counts.negativi}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Non rinnovati</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca cliente, telefono..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#21b5ba]/20 focus:border-[#21b5ba] text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Esito Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setEsitoFilter("ALL")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "ALL" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Tutti
              </button>
              <button
                onClick={() => setEsitoFilter("DA_CONTATTARE")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "DA_CONTATTARE" ? "bg-slate-700 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Da Contattare
              </button>
              <button
                onClick={() => setEsitoFilter("PRESO_APPUNTAMENTO")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "PRESO_APPUNTAMENTO" ? "bg-indigo-600 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Fissati
              </button>
              <button
                onClick={() => setEsitoFilter("RINNOVO")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "RINNOVO" ? "bg-emerald-600 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Rinnovati
              </button>
              <button
                onClick={() => setEsitoFilter("IN ATTESA")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "IN ATTESA" ? "bg-amber-500 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                In Attesa
              </button>
              <button
                onClick={() => setEsitoFilter("NEGATIVO")}
                className={cn("px-2.5 py-1 rounded-lg transition-all", esitoFilter === "NEGATIVO" ? "bg-rose-600 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Negativi
              </button>
            </div>

            {/* Disciplina Selector */}
            <select
              value={disciplinaFilter}
              onChange={(e) => setDisciplinaFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-[#21b5ba]"
            >
              <option value="ALL">Tutte le discipline</option>
              <option value="CORSI">Corsi</option>
              <option value="SALA">Sala</option>
              <option value="SALA+CORSI">Open (Sala+Corsi)</option>
            </select>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Cliente</th>
                  <th className="py-3 px-3.5">Recapito</th>
                  <th className="py-3 px-3.5">Scadenza</th>
                  <th className="py-3 px-3.5">Abbonamento Attuale</th>
                  <th className="py-3 px-3.5 text-center">Contattato</th>
                  <th className="py-3 px-3.5">Appuntamento Agenda</th>
                  <th className="py-3 px-3.5 text-center">Consulenza</th>
                  <th className="py-3 px-3.5">Esito Rinnovo</th>
                  <th className="py-3 px-3.5">Note Commerciali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-cyan-600" />
                        <span>Caricamento campagna rinnovi {formatMonthHuman(mese)}...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      Nessun cliente in scadenza trovato per {formatMonthHuman(mese)} con i filtri attuali.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const client = row.client;
                    const days = getDaysDiff(row.scadenza_originaria);
                    const agenda = row.agenda_entry;

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-slate-50/70 transition-colors",
                          row.esito === "RINNOVO" ? "bg-emerald-50/20" : row.esito === "NEGATIVO" ? "bg-rose-50/20" : ""
                        )}
                      >
                        {/* 1. Cliente */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setDetailClientId(row.client_id)}
                              className="font-bold text-slate-900 text-xs hover:text-cyan-700 cursor-pointer transition-colors"
                            >
                              {client ? `${client.cognome} ${client.nome}` : "—"}
                            </span>
                            <button
                              onClick={() => setDetailClientId(row.client_id)}
                              className="text-slate-300 hover:text-cyan-600 p-0.5 transition-colors"
                              title="Apri scheda cliente"
                            >
                              <History size={13} />
                            </button>
                          </div>
                          {row.disciplina && (
                            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              {row.disciplina}
                            </span>
                          )}
                        </td>

                        {/* 2. Recapito */}
                        <td className="py-3 px-3.5">
                          {client?.telefono ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{client.telefono}</span>
                              <a
                                href={`https://wa.me/39${cleanPhone(client.telefono)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Invia WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Nessun tel</span>
                          )}
                        </td>

                        {/* 3. Scadenza */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">
                            {row.scadenza_originaria
                              ? new Date(row.scadenza_originaria).toLocaleDateString("it-IT")
                              : "—"}
                          </div>
                          {days !== null && (
                            <div
                              className={cn(
                                "text-[10px] font-semibold mt-0.5",
                                days > 0 ? "text-amber-600" : days === 0 ? "text-amber-700 font-bold" : "text-rose-600"
                              )}
                            >
                              {days > 0 ? `Tra ${days} gg` : days === 0 ? "Oggi!" : `Scaduto da ${Math.abs(days)} gg`}
                            </div>
                          )}
                        </td>

                        {/* 4. Abbonamento Attuale */}
                        <td className="py-3 px-3.5">
                          <div className="text-xs font-semibold text-slate-800 max-w-[200px] truncate" title={row.abbonamento_originario}>
                            {row.abbonamento_originario || "—"}
                          </div>
                        </td>

                        {/* 5. Contattato (Checkbox) */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => updateItem(row.id, { contattato: !row.contattato })}
                            className={cn(
                              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto",
                              row.contattato
                                ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
                                : "bg-white border-slate-300 hover:border-slate-400 text-transparent"
                            )}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </td>

                        {/* 6. Appuntamento in Agenda (Real-Time Smart Pill) */}
                        <td className="py-3 px-3.5">
                          {agenda ? (
                            <div className="flex items-center gap-1.5">
                              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                                <CalendarCheck size={13} className="text-indigo-600 flex-shrink-0" />
                                <div>
                                  <span>
                                    {new Date(agenda.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                                  </span>
                                  {agenda.time && <span className="ml-1 text-indigo-600 font-bold">{agenda.time.slice(0, 5)}</span>}
                                  {agenda.consulente_name && (
                                    <span className="text-indigo-500 text-[10px] block font-normal">
                                      con {agenda.consulente_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBookAppointment(row)}
                              className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50/30 text-slate-500 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <span>+ Fissa in Agenda</span>
                            </button>
                          )}
                        </td>

                        {/* 7. Consulenza Fatta (Checkbox) */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => updateItem(row.id, { consulenza_fatta: !row.consulenza_fatta })}
                            className={cn(
                              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto",
                              row.consulenza_fatta
                                ? "bg-indigo-500 border-indigo-600 text-white shadow-xs"
                                : "bg-white border-slate-300 hover:border-slate-400 text-transparent"
                            )}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </td>

                        {/* 8. Esito Rinnovo (Interactive Selector) */}
                        <td className="py-3 px-3.5">
                          <select
                            value={row.esito || ""}
                            onChange={(e) => updateItem(row.id, { esito: e.target.value || null })}
                            className={cn(
                              "text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none transition-all",
                              row.esito === "RINNOVO"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-black"
                                : row.esito === "INTEGRAZIONE"
                                ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                                : row.esito === "IN ATTESA"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : row.esito === "NEGATIVO"
                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                : "bg-white text-slate-500 border-slate-200"
                            )}
                          >
                            <option value="">-- Seleziona --</option>
                            <option value="RINNOVO">RINNOVO</option>
                            <option value="INTEGRAZIONE">INTEGRAZIONE</option>
                            <option value="IN ATTESA">IN ATTESA</option>
                            <option value="NEGATIVO">NEGATIVO</option>
                          </select>

                          {/* Se Negativo: Motivo */}
                          {row.esito === "NEGATIVO" && (
                            <select
                              value={row.motivo_negativo || ""}
                              onChange={(e) => updateItem(row.id, { motivo_negativo: e.target.value || null })}
                              className="text-[10px] mt-1 block w-full py-0.5 px-1.5 rounded border border-rose-200 bg-rose-50/50 text-rose-700 font-semibold"
                            >
                              <option value="">-- Motivo Negativo --</option>
                              {MOTIVI_NEGATIVO.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {row.nuovo_abbonamento_name && row.esito === "RINNOVO" && (
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                              {row.nuovo_abbonamento_name}
                            </div>
                          )}
                        </td>

                        {/* 9. Note Commerciali */}
                        <td className="py-3 px-3.5">
                          {editingNoteId === row.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                autoFocus
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                className="text-xs p-1 rounded border border-cyan-400 focus:outline-none w-48 text-slate-800"
                              />
                              <button
                                onClick={() => {
                                  updateItem(row.id, { note: noteDraft });
                                  setEditingNoteId(null);
                                }}
                                className="p-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNoteId(row.id);
                                setNoteDraft(row.note || "");
                              }}
                              className="cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 p-1 rounded text-xs min-h-[26px] flex items-center transition-colors max-w-[220px]"
                              title="Clicca per modificare la nota"
                            >
                              {row.note ? (
                                <span className="italic truncate">{row.note}</span>
                              ) : (
                                <span className="text-slate-300 italic">+ Aggiungi nota</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Appointment Drawer */}
      <EntryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialData={drawerInitialData}
        onSave={() => {
          setDrawerOpen(false);
          fetchRinnovi();
        }}
      />

      {/* Client Detail Drawer */}
      <ClientDetailDrawer
        clientId={detailClientId}
        onClose={() => setDetailClientId(null)}
        onClientUpdated={fetchRinnovi}
      />
    </div>
  );
}

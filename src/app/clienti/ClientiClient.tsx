"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Dumbbell,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImportWellnessModal from "./ImportWellnessModal";
import ClientDetailDrawer from "./ClientDetailDrawer";

export default function ClientiClient() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, attivi: 0, in_scadenza: 0, scaduti: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStato, setSelectedStato] = useState<string>("ALL");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("ALL");

  // Modals & Drawer
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedStato !== "ALL") params.set("stato", selectedStato);
      if (selectedDisciplina !== "ALL") params.set("disciplina", selectedDisciplina);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));

      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();

      if (data.clients) {
        setClients(data.clients);
        setCounts(data.counts || { total: 0, attivi: 0, in_scadenza: 0, scaduti: 0 });
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStato, selectedDisciplina, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleCardFilterClick = (stato: string) => {
    setSelectedStato((prev) => (prev === stato ? "ALL" : stato));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getDaysDiff = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const cleanPhone = (p?: string | null) => (p || "").replace(/[^\d]/g, "");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#21b5ba]/10 text-[#21b5ba] flex items-center justify-center font-bold shadow-inner">
                <Users size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Anagrafica Clienti</span>
                  <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                    Wellness in Cloud
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {counts.total} clienti registrati • Sincronizzazione automatica scadenze e presenze
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#21b5ba] hover:bg-[#1ca3a8] text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <UploadCloud size={16} />
              <span>Importa CSV Wellness</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Card */}
          <div
            onClick={() => handleCardFilterClick("ALL")}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer shadow-sm select-none",
              selectedStato === "ALL"
                ? "bg-white border-slate-400 ring-2 ring-slate-400/20 shadow-md"
                : "bg-white border-slate-200/80 hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Totale Censiti</span>
              <Users size={16} className="text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{counts.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Archivio completo</div>
          </div>

          {/* Attivi Card */}
          <div
            onClick={() => handleCardFilterClick("ATTIVO")}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer shadow-sm select-none",
              selectedStato === "ATTIVO"
                ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-md"
                : "bg-white border-slate-200/80 hover:border-emerald-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Clienti Attivi</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{counts.attivi}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">Abbonamento regolare</div>
          </div>

          {/* In Scadenza Card */}
          <div
            onClick={() => handleCardFilterClick("IN_SCADENZA")}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer shadow-sm select-none",
              selectedStato === "IN_SCADENZA"
                ? "bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                : "bg-white border-slate-200/80 hover:border-amber-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">In Scadenza (≤ 30 gg)</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{counts.in_scadenza}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5 font-medium">Da contattare per rinnovo</div>
          </div>

          {/* Scaduti Card */}
          <div
            onClick={() => handleCardFilterClick("SCADUTO")}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer shadow-sm select-none",
              selectedStato === "SCADUTO"
                ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20 shadow-md"
                : "bg-white border-slate-200/80 hover:border-rose-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Abbonati Scaduti</span>
              <AlertCircle size={16} className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{counts.scaduti}</div>
            <div className="text-[11px] text-rose-700/80 mt-0.5 font-medium">Ex-abbonati da recuperare</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Cerca per cognome, nome, cellulare..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#21b5ba]/20 focus:border-[#21b5ba] text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Stato selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => { setSelectedStato("ALL"); setPagination(p => ({ ...p, page: 1 })); }}
                className={cn("px-3 py-1 rounded-lg transition-all", selectedStato === "ALL" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900")}
              >
                Tutti
              </button>
              <button
                onClick={() => { setSelectedStato("ATTIVO"); setPagination(p => ({ ...p, page: 1 })); }}
                className={cn("px-3 py-1 rounded-lg transition-all", selectedStato === "ATTIVO" ? "bg-emerald-500 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Attivi
              </button>
              <button
                onClick={() => { setSelectedStato("IN_SCADENZA"); setPagination(p => ({ ...p, page: 1 })); }}
                className={cn("px-3 py-1 rounded-lg transition-all", selectedStato === "IN_SCADENZA" ? "bg-amber-500 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                In Scadenza
              </button>
              <button
                onClick={() => { setSelectedStato("SCADUTO"); setPagination(p => ({ ...p, page: 1 })); }}
                className={cn("px-3 py-1 rounded-lg transition-all", selectedStato === "SCADUTO" ? "bg-rose-500 text-white shadow-sm font-bold" : "hover:text-slate-900")}
              >
                Scaduti
              </button>
            </div>

            {/* Disciplina selector */}
            <select
              value={selectedDisciplina}
              onChange={(e) => {
                setSelectedDisciplina(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-[#21b5ba]"
            >
              <option value="ALL">Tutte le attività</option>
              <option value="CORSI">Solo Corsi</option>
              <option value="SALA">Solo Sala Attrezzi</option>
              <option value="SALA+CORSI">Open (Sala + Corsi)</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Recapiti</th>
                  <th className="py-3 px-4">Abbonamento Attivo</th>
                  <th className="py-3 px-4">Scadenza</th>
                  <th className="py-3 px-4">Accessi Tornello</th>
                  <th className="py-3 px-4">Stato</th>
                  <th className="py-3 px-4 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-cyan-600" />
                        <span>Caricamento anagrafica clienti...</span>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      Nessun cliente trovato con i filtri attuali.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => {
                    const days = getDaysDiff(c.data_scadenza);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedClientId(c.id)}
                        className="hover:bg-cyan-50/30 transition-colors cursor-pointer group"
                      >
                        {/* Nome & Cognome */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">
                            {c.cognome} {c.nome}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {c.data_nascita
                              ? `Nato il ${new Date(c.data_nascita).toLocaleDateString("it-IT")}`
                              : "—"}
                          </div>
                        </td>

                        {/* Recapiti */}
                        <td className="py-3.5 px-4">
                          {c.telefono ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{c.telefono}</span>
                              <a
                                href={`https://wa.me/39${cleanPhone(c.telefono)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Apri WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Nessun tel</span>
                          )}
                          {c.email && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {c.email}
                            </div>
                          )}
                        </td>

                        {/* Pacchetto */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-xs">
                            {c.pacchetto_originale || "Nessuno"}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {c.tipi_abbonamento?.name && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {c.tipi_abbonamento.name}
                              </span>
                            )}
                            {c.disciplina && (
                              <span className="bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {c.disciplina}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Scadenza */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {c.data_scadenza
                              ? new Date(c.data_scadenza).toLocaleDateString("it-IT")
                              : "—"}
                          </div>
                          {days !== null && (
                            <div
                              className={cn(
                                "text-[11px] font-semibold mt-0.5",
                                days > 30
                                  ? "text-slate-400"
                                  : days > 0
                                  ? "text-amber-600"
                                  : days === 0
                                  ? "text-amber-700 font-bold"
                                  : "text-rose-600"
                              )}
                            >
                              {days > 0 ? (
                                `Mancano ${days} gg`
                              ) : days === 0 ? (
                                "Scade oggi!"
                              ) : (
                                `Scaduto da ${Math.abs(days)} gg`
                              )}
                            </div>
                          )}
                        </td>

                        {/* Accessi tornello */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {c.accessi_effettuati || 0} ingressi
                          </div>
                          {c.ultimo_accesso && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Ultimo: {new Date(c.ultimo_accesso).toLocaleDateString("it-IT")}
                            </div>
                          )}
                        </td>

                        {/* Stato */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                              c.stato === "ATTIVO"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : c.stato === "IN_SCADENZA"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}
                          >
                            {c.stato?.replace("_", " ")}
                          </span>
                        </td>

                        {/* Azioni */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(c.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Apri scheda"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <div>
              Mostrati da {(pagination.page - 1) * pagination.limit + 1} a{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} di {pagination.total} clienti
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Pagina <b>{pagination.page}</b> di <b>{pagination.totalPages}</b>
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportWellnessModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          fetchClients();
        }}
      />

      {/* Detail Drawer */}
      <ClientDetailDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onClientUpdated={() => fetchClients()}
      />
    </div>
  );
}

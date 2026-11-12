"use client";

import { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  History,
  MessageCircle,
  Save,
  Loader2,
  CalendarCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientDetailDrawerProps {
  clientId: string | null;
  onClose: () => void;
  onClientUpdated?: () => void;
}

export default function ClientDetailDrawer({
  clientId,
  onClose,
  onClientUpdated,
}: ClientDetailDrawerProps) {
  const [data, setData] = useState<{ client: any; entries: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/clients/${clientId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.client) {
          setData(res);
          setNoteDraft(res.client.note || "");
        }
      })
      .catch((err) => console.error("Error loading client details:", err))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (!clientId) return null;

  const client = data?.client;
  const entries = data?.entries || [];

  const handleSaveNote = async () => {
    if (!clientId) return;
    setSavingNote(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onClientUpdated?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const getDaysDiff = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const diffDays = getDaysDiff(client?.data_scadenza);
  const isExpired = client?.stato === "SCADUTO" || (diffDays !== null && diffDays < 0);
  const isExpiring = !isExpired && (client?.stato === "IN_SCADENZA" || (diffDays !== null && diffDays <= 15));

  const cleanPhone = (p?: string | null) => (p || "").replace(/[^\d]/g, "");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {client ? `${client.cognome} ${client.nome}` : "Caricamento..."}
                </h2>
                {client?.stato && (
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                      client.stato === "ATTIVO"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : client.stato === "IN_SCADENZA"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}
                  >
                    {client.stato.replace("_", " ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {client?.data_nascita
                  ? `Nato il ${new Date(client.data_nascita).toLocaleDateString("it-IT")}`
                  : "Anagrafica cliente"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-cyan-600" />
                <span className="text-xs font-semibold">Caricamento scheda cliente...</span>
              </div>
            ) : client ? (
              <>
                {/* Quick Actions (WhatsApp & Call) */}
                {client.telefono && (
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/39${cleanPhone(client.telefono)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${client.telefono}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Phone size={15} />
                      <span>Chiama</span>
                    </a>
                  </div>
                )}

                {/* Subscriptions Card */}
                <div
                  className={cn(
                    "rounded-2xl p-4 text-white shadow-lg space-y-3 border transition-colors",
                    isExpired
                      ? "bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-rose-900/40"
                      : isExpiring
                      ? "bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-amber-900/40"
                      : "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between text-xs font-semibold tracking-wide uppercase",
                      isExpired
                        ? "text-rose-400"
                        : isExpiring
                        ? "text-amber-400"
                        : "text-emerald-400"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <AlertTriangle size={14} className="text-rose-400" />
                      ) : isExpiring ? (
                        <Clock size={14} className="text-amber-400" />
                      ) : (
                        <Dumbbell size={14} className="text-emerald-400" />
                      )}
                      <span>
                        {isExpired
                          ? "Abbonamento Scaduto"
                          : isExpiring
                          ? "Abbonamento In Scadenza"
                          : "Abbonamento Attivo"}
                      </span>
                    </div>
                    {client.disciplina && (
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white font-bold">
                        {client.disciplina}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-base font-bold text-white leading-tight">
                      {client.pacchetto_originale
                        ? client.pacchetto_originale.replace(/^=+\s*/, "").trim()
                        : "Nessun pacchetto registrato"}
                    </div>
                    {client.tipi_abbonamento?.name && (
                      <div className="text-xs text-slate-300 mt-0.5">
                        Categoria: {client.tipi_abbonamento.name}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Inizio validità</div>
                      <div className="font-semibold text-slate-200 mt-0.5">
                        {client.data_inizio
                          ? new Date(client.data_inizio).toLocaleDateString("it-IT")
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Data Scadenza</div>
                      <div
                        className={cn(
                          "font-semibold mt-0.5",
                          isExpired
                            ? "text-rose-300"
                            : isExpiring
                            ? "text-amber-300"
                            : "text-emerald-300"
                        )}
                      >
                        {client.data_scadenza
                          ? new Date(client.data_scadenza).toLocaleDateString("it-IT")
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {diffDays !== null && (
                    <div className="text-[11px] font-medium text-slate-300 pt-1 flex items-center gap-1.5">
                      <Clock
                        size={12}
                        className={
                          isExpired
                            ? "text-rose-400"
                            : isExpiring
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      />
                      {diffDays > 0 ? (
                        <span>
                          Scade tra <b>{diffDays} giorni</b>
                        </span>
                      ) : diffDays === 0 ? (
                        <span className="text-amber-300 font-bold">Scade oggi!</span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          Scaduto da {Math.abs(diffDays)} giorni
                        </span>
                      )}
                    </div>
                  )}

                  {/* Accesses info */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <div>
                      Accessi tornello: <b className="text-white">{client.accessi_effettuati || 0}</b>
                    </div>
                    {client.ultimo_accesso && (
                      <div className="text-[11px] text-slate-400">
                        Ultimo: {new Date(client.ultimo_accesso).toLocaleDateString("it-IT")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Address Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                    Recapiti e Residenza
                  </div>
                  {client.telefono && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Phone size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{client.telefono}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Mail size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {(client.indirizzo || client.citta) && (
                    <div className="flex items-start gap-2.5 text-slate-600">
                      <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>
                        {client.indirizzo} {client.civico ? `, ${client.civico}` : ""}
                        {client.citta ? ` - ${client.cap || ""} ${client.citta} (${client.provincia || ""})` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Internal Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Note Interne Giornalone
                    </label>
                    {saveSuccess && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Salvato
                      </span>
                    )}
                  </div>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Aggiungi note su abitudini, preferenze o accordi con il cliente..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote || noteDraft === (client.note || "")}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Salva Note</span>
                    </button>
                  </div>
                </div>

                {/* Timeline History in Giornalone */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-slate-500" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Storico Giornalone ({entries.length})
                      </h4>
                    </div>
                  </div>

                  {entries.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nessun appuntamento precedente registrato sul Giornalone per questo cliente.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <CalendarCheck size={13} className="text-cyan-600" />
                              <span>{new Date(entry.entry_date).toLocaleDateString("it-IT")}</span>
                              {entry.entry_time && (
                                <span className="text-slate-400 font-normal">
                                  {entry.entry_time.slice(0, 5)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {entry.section}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {(entry.consulente?.name || entry.consulenti?.name || entry.consulenti?.nome) && (
                              <span className="flex items-center gap-1">
                                <User size={11} className="text-slate-400" />
                                <b>{entry.consulente?.name || entry.consulenti?.name || entry.consulenti?.nome}</b>
                              </span>
                            )}
                            {entry.venduto && (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                                Venduto
                              </span>
                            )}
                            {entry.miss && (
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-bold">
                                Miss
                              </span>
                            )}
                            {entry.assente && (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                                Assente
                              </span>
                            )}
                          </div>

                          {entry.note && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                              "{entry.note}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

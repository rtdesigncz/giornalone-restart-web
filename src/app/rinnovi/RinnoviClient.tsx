// src/app/rinnovi/RinnoviClient.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  X,
  History,
  AlertTriangle,
  PieChart,
  Check,
  ArrowUpDown,
  Sparkles,
  Users,
  ChevronDown,
  Pencil,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import EntryDrawer from "@/components/agenda/EntryDrawer";
import ClientDetailDrawer from "@/app/clienti/ClientDetailDrawer";
import RinnoviReportModal from "./RinnoviReportModal";
import CustomSelect from "@/components/ui/CustomSelect";

export const ESITI = ["RINNOVO", "INTEGRAZIONE", "IN ATTESA", "NEGATIVO"] as const;

export const MOTIVI_NEGATIVO = [
  { value: "INSODDISFATTO", label: "Insoddisfatto" },
  { value: "NON FREQUENTA", label: "Non frequenta" },
  { value: "TRASFERIMENTO", label: "Trasferimento" },
  { value: "INFORTUNIO", label: "Infortunio" },
  { value: "ALTRO", label: "Altro" },
] as const;

export const cleanSubscription = (s: string | null | undefined) => {
  if (!s) return null;
  const str = s.replace(/^=+\s*/, "").trim();
  const upper = str.toUpperCase();
  if (upper.includes("MENSILE")) return "MENSILE";
  if (upper.includes("QUADRIMESTRALE")) return "QUADRIMESTRALE";
  if (upper.includes("ANNUALE")) return "ANNUALE";
  if (upper.includes("SEMESTRALE")) return "SEMESTRALE";
  if (upper.includes("TRIMESTRALE")) return "TRIMESTRALE";
  if (upper.includes("BIENNALE")) return "BIENNALE";
  return str;
};

// Visual Step Icon (Identical to Consulenze)
const StepIcon = ({
  completed,
  active,
  icon: Icon,
  onClick,
  colorClass = "emerald",
  disabled,
}: {
  completed?: boolean;
  active?: boolean;
  icon: any;
  onClick: () => void;
  colorClass?: "emerald" | "amber" | "teal" | "cyan" | "blue" | "indigo" | "rose";
  disabled?: boolean;
}) => {
  const colorStyles: Record<string, { completed: string; active: string }> = {
    emerald: {
      completed: "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200",
      active: "border-emerald-500 text-emerald-500 bg-white shadow-sm",
    },
    amber: {
      completed: "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200",
      active: "border-amber-500 text-amber-500 bg-white shadow-sm",
    },
    teal: {
      completed: "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200",
      active: "border-teal-500 text-teal-500 bg-white shadow-sm",
    },
    cyan: {
      completed: "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200",
      active: "border-cyan-500 text-cyan-500 bg-white shadow-sm",
    },
    blue: {
      completed: "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200",
      active: "border-blue-500 text-blue-500 bg-white shadow-sm",
    },
    indigo: {
      completed: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200",
      active: "border-indigo-600 text-indigo-600 bg-white shadow-sm",
    },
    rose: {
      completed: "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200",
      active: "border-rose-500 text-rose-500 bg-white shadow-sm",
    },
  };

  const styles = colorStyles[colorClass] || colorStyles.emerald;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 relative group focus:outline-none focus:ring-2 focus:ring-offset-1",
        completed
          ? styles.completed
          : active
          ? styles.active
          : "border-slate-200 text-slate-300 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4" />
      {!disabled && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
          {completed ? "Clicca per annullare" : "Clicca per completare"}
        </span>
      )}
    </button>
  );
};

// Polished Action Modal for workflow transitions
const ActionModal = ({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Conferma",
  confirmColor = "indigo",
}: {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmColor?: "indigo" | "red" | "emerald";
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-lg overflow-hidden flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
          <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 font-sans">{children}</div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2",
              confirmColor === "red"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                : confirmColor === "emerald"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RinnoviClient() {
  const [mese, setMese] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    total: 0,
    contattati: 0,
    daContattare: 0,
    appuntamentiDaFissare: 0,
    appuntamentiDaFare: 0,
    appuntamentiTotali: 0,
    consulenzeFatte: 0,
    rinnovati: 0,
    integrazioni: 0,
    inAttesa: 0,
    negativi: 0,
    tassoChiusura: 0,
    motiviCounts: {},
  });
  const [abbOptions, setAbbOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filtro, setFiltro] = useState("ALL"); // ALL, DA_CONTATTARE, CONTATTATI, APP_DA_FISSARE, APP_DA_FARE, CONSULENZE_FATTE, VENDUTI, RINNOVO, INTEGRAZIONE, IN ATTESA, NEGATIVO
  const [disciplinaFilter, setDisciplinaFilter] = useState("ALL");
  const [selectedAbb, setSelectedAbb] = useState<string | null>(null);
  const [selectedMotivoNegativo, setSelectedMotivoNegativo] = useState<string | null>(null);
  const [showNegativiKpi, setShowNegativiKpi] = useState(false);
  const [showNegativiModal, setShowNegativiModal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const resetFiltri = () => {
    setFiltro("ALL");
    setSelectedAbb(null);
    setSelectedMotivoNegativo(null);
    setShowNegativiKpi(false);
  };

  // Sorting
  const [sortKey, setSortKey] = useState<"scadenza" | "cliente">("scadenza");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<any>(null);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [pendingAgendaItem, setPendingAgendaItem] = useState<any>(null);

  // Note Popup Modal & Editor State
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    item: any | null;
    isEditing: boolean;
    draft: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    item: null,
    isEditing: false,
    draft: "",
    isSaving: false,
  });

  // Action Modals State
  const [actionModal, setActionModal] = useState<{
    type: "CONFIRM_RESET" | "SET_APPUNTAMENTO" | "SET_ESITO" | null;
    item: any | null;
    step?: "CONTATTATO" | "APPUNTAMENTO" | "FATTA";
  }>({ type: null, item: null });

  // Modal temporary form values
  const [tempDate, setTempDate] = useState("");
  const [tempEsito, setTempEsito] = useState<string | null>(null);
  const [tempNuovoAbb, setTempNuovoAbb] = useState("");
  const [tempDataRisp, setTempDataRisp] = useState("");
  const [tempMotivoNegativo, setTempMotivoNegativo] = useState("");
  const [tempNote, setTempNote] = useState("");
  const [addToAgenda, setAddToAgenda] = useState(false);

  // Fetch Abbonamenti Options once
  useEffect(() => {
    fetch("/api/consulenze/options/abbonamenti")
      .then((r) => r.json())
      .then((d) => {
        if (d.options) setAbbOptions(d.options);
      })
      .catch(() => {});
  }, []);

  // Fetch Rinnovi data for current month & filters
  const fetchRinnovi = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("mese", mese);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (filtro !== "ALL") params.set("filtro", filtro);
      if (disciplinaFilter !== "ALL") params.set("disciplina", disciplinaFilter);
      if (selectedAbb) params.set("abbonamento", selectedAbb);
      if (selectedMotivoNegativo) params.set("motivo", selectedMotivoNegativo);

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
  }, [mese, searchQuery, filtro, disciplinaFilter, selectedAbb, selectedMotivoNegativo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRinnovi();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchRinnovi]);

  // Patch an individual rinnovi_item
  const updateItem = async (id: string, updates: Record<string, any>) => {
    // Optimistic UI update
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

    try {
      const res = await fetch(`/api/rinnovi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Errore aggiornamento");
    } catch (err) {
      console.error("Failed to update item:", err);
      fetchRinnovi();
    }
  };

  // Step click handler with modal transitions
  const handleStepClick = (item: any, step: "CONTATTATO" | "APPUNTAMENTO" | "FATTA") => {
    if (step === "CONTATTATO") {
      if (item.contattato) {
        setActionModal({ type: "CONFIRM_RESET", item, step: "CONTATTATO" });
      } else {
        updateItem(item.id, { contattato: true });
      }
    } else if (step === "APPUNTAMENTO") {
      if (item.preso_appuntamento) {
        setActionModal({ type: "CONFIRM_RESET", item, step: "APPUNTAMENTO" });
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        setTempDate(item.data_consulenza || todayStr);
        setAddToAgenda(false);
        setActionModal({ type: "SET_APPUNTAMENTO", item });
      }
    } else if (step === "FATTA") {
      if (item.consulenza_fatta) {
        setActionModal({ type: "CONFIRM_RESET", item, step: "FATTA" });
      } else {
        setTempEsito(item.esito || null);
        setTempNuovoAbb(item.nuovo_abbonamento_name || "");
        setTempDataRisp(item.data_risposta || "");
        setTempMotivoNegativo(item.motivo_negativo || "");
        setTempNote(item.note || "");
        setActionModal({ type: "SET_ESITO", item });
      }
    }
  };

  // Confirm action modal
  const confirmActionModal = async () => {
    const { type, item, step } = actionModal;
    if (!item) return;

    if (type === "CONFIRM_RESET") {
      if (step === "CONTATTATO") {
        await updateItem(item.id, {
          contattato: false,
          preso_appuntamento: false,
          consulenza_fatta: false,
          data_consulenza: null,
          esito: null,
          nuovo_abbonamento_name: null,
          data_risposta: null,
          motivo_negativo: null,
        });
      } else if (step === "APPUNTAMENTO") {
        await updateItem(item.id, {
          preso_appuntamento: false,
          consulenza_fatta: false,
          data_consulenza: null,
          esito: null,
          nuovo_abbonamento_name: null,
          data_risposta: null,
          motivo_negativo: null,
        });
      } else if (step === "FATTA") {
        await updateItem(item.id, {
          consulenza_fatta: false,
          esito: null,
          nuovo_abbonamento_name: null,
          data_risposta: null,
          motivo_negativo: null,
        });
      }
      setActionModal({ type: null, item: null });
    } else if (type === "SET_APPUNTAMENTO") {
      if (addToAgenda) {
        setPendingAgendaItem({ item, date: tempDate });
        setDrawerInitialData({
          section: "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
          nome: item.client?.nome || "",
          cognome: item.client?.cognome || "",
          telefono: item.client?.telefono || "",
          client_id: item.client_id,
          entry_date: tempDate,
          note: `RINNOVO ${formatMonthHuman(item.mese_riferimento)} - Precedente: ${item.abbonamento_originario || ""}`,
        });
        setDrawerOpen(true);
        setActionModal({ type: null, item: null });
        return;
      }

      await updateItem(item.id, {
        contattato: true,
        preso_appuntamento: true,
        data_consulenza: tempDate || null,
      });
      setActionModal({ type: null, item: null });
    } else if (type === "SET_ESITO") {
      if (tempEsito && ["RINNOVO", "INTEGRAZIONE"].includes(tempEsito)) {
        if (!tempNuovoAbb) {
          alert("ATTENZIONE: Seleziona obbligatoriamente il Nuovo Abbonamento per salvare un esito positivo.");
          return;
        }
      }

      await updateItem(item.id, {
        contattato: true,
        preso_appuntamento: true,
        consulenza_fatta: true,
        esito: tempEsito,
        nuovo_abbonamento_name: ["RINNOVO", "INTEGRAZIONE"].includes(tempEsito || "") ? tempNuovoAbb || null : null,
        motivo_negativo: tempEsito === "NEGATIVO" ? tempMotivoNegativo || null : null,
        data_risposta: tempEsito === "IN ATTESA" ? tempDataRisp || null : null,
        note: tempNote || null,
      });
      setActionModal({ type: null, item: null });
    }
  };

  // Open EntryDrawer directly for booking
  const handleBookInAgenda = (item: any) => {
    setPendingAgendaItem({ item, date: new Date().toISOString().slice(0, 10) });
    setDrawerInitialData({
      section: "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
      nome: item.client?.nome || "",
      cognome: item.client?.cognome || "",
      telefono: item.client?.telefono || "",
      client_id: item.client_id,
      note: `RINNOVO ${formatMonthHuman(item.mese_riferimento)} - Scadenza: ${item.scadenza_originaria || ""} - ${item.abbonamento_originario || ""}`,
    });
    setDrawerOpen(true);
  };

  // Callback when entry is saved in EntryDrawer
  const handleEntryDrawerSave = () => {
    setDrawerOpen(false);
    if (pendingAgendaItem) {
      updateItem(pendingAgendaItem.item.id, {
        contattato: true,
        preso_appuntamento: true,
        data_consulenza: pendingAgendaItem.date,
      });
      setPendingAgendaItem(null);
    }
    setTimeout(() => fetchRinnovi(), 400);
  };

  const formatMonthHuman = (mStr?: string | null) => {
    if (!mStr) return "";
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

  // Sort rows client-side
  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      if (sortKey === "scadenza") {
        const da = a.scadenza_originaria || "";
        const db = b.scadenza_originaria || "";
        return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
      } else {
        const na = `${a.client?.cognome || ""} ${a.client?.nome || ""}`.trim().toLowerCase();
        const nb = `${b.client?.cognome || ""} ${b.client?.nome || ""}`.trim().toLowerCase();
        return sortDir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
      }
    });
    return list;
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: "scadenza" | "cliente") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#21b5ba]/10 text-[#21b5ba] flex items-center justify-center font-bold shadow-inner">
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestione Rinnovi</h1>
                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> Real-Time Agenda
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pannello commerciale integrato con l'Anagrafica Clienti e l'Agenda Giornalone
              </p>
            </div>
          </div>

          {/* Actions: Month Selector + Report Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Campagna:</span>
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

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              disabled={items.length === 0}
              className="btn btn-outline gap-2 bg-white text-[#21b5ba] border-[#21b5ba] hover:bg-[#21b5ba] hover:text-white transition-all disabled:opacity-50 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center"
              title="Vedi Report Lista Rinnovi"
            >
              <PieChart className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* NEW KPI SAAS CARDS - IDENTICAL TO CONSULENZE */}
      <div className="bg-slate-50 border-b border-slate-200 py-5 sm:py-6 px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 max-w-[1700px] mx-auto">
          {/* 1. Totale */}
          <div
            onClick={() => resetFiltri()}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "ALL" && !selectedAbb && !selectedMotivoNegativo
                ? "ring-2 ring-slate-400 border-transparent shadow-sm"
                : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Totale
              </h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.total || 0}</p>
          </div>

          {/* 2. Da Contattare */}
          <div
            onClick={() => {
              const next = filtro === "DA_CONTATTARE" ? "ALL" : "DA_CONTATTARE";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "DA_CONTATTARE" ? "ring-2 ring-amber-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Da Contattare
              </h3>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.daContattare || 0}</p>
          </div>

          {/* 3. Contattati */}
          <div
            onClick={() => {
              const next = filtro === "CONTATTATI" ? "ALL" : "CONTATTATI";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "CONTATTATI" ? "ring-2 ring-cyan-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Contattati
              </h3>
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.contattati || 0}</p>
          </div>

          {/* 4. Da Fissare */}
          <div
            onClick={() => {
              const next = filtro === "APP_DA_FISSARE" ? "ALL" : "APP_DA_FISSARE";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "APP_DA_FISSARE" ? "ring-2 ring-orange-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Da Fissare
              </h3>
              <Phone className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.appuntamentiDaFissare || 0}</p>
          </div>

          {/* 5. Fissati */}
          <div
            onClick={() => {
              const next = filtro === "APP_DA_FARE" ? "ALL" : "APP_DA_FARE";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "APP_DA_FARE" ? "ring-2 ring-teal-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Fissati
              </h3>
              <Calendar className="w-4 h-4 text-teal-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.appuntamentiDaFare || 0}</p>
          </div>

          {/* 6. Consulenze Fatte */}
          <div
            onClick={() => {
              const next = filtro === "CONSULENZE_FATTE" ? "ALL" : "CONSULENZE_FATTE";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "CONSULENZE_FATTE" ? "ring-2 ring-emerald-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Consulenze Fatte
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{counts.consulenzeFatte || 0}</p>
          </div>

          {/* 7. Venduti */}
          <div
            onClick={() => {
              const next = filtro === "VENDUTI" ? "ALL" : "VENDUTI";
              resetFiltri();
              setFiltro(next);
            }}
            className={cn(
              "saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group",
              filtro === "VENDUTI" ? "ring-2 ring-indigo-500 border-transparent shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">
                Venduti
              </h3>
              <Check className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold text-slate-900">
                {counts.venduti ?? (counts.rinnovati + (counts.integrazioni || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Esiti & Abbonamenti Break-down */}
        <div className="mt-5 max-w-[1700px] mx-auto">
          <div className="bg-white/90 border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Esiti Breakdown */}
            <div className="flex gap-2.5 flex-wrap justify-center items-center py-0.5">
              {/* RINNOVO */}
              <div
                onClick={() => {
                  const next = filtro === "RINNOVO" ? "ALL" : "RINNOVO";
                  resetFiltri();
                  setFiltro(next);
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]",
                  filtro === "RINNOVO"
                    ? "bg-teal-100 text-teal-800 border-teal-300 ring-2 ring-teal-400 shadow-xs"
                    : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                )}
              >
                <span>RINNOVO</span>
                <span className="bg-white px-2 py-0.5 rounded-md shadow-xs text-xs font-black text-teal-900">
                  {counts.rinnovati || 0}
                </span>
              </div>

              {/* INTEGRAZIONE */}
              <div
                onClick={() => {
                  const next = filtro === "INTEGRAZIONE" ? "ALL" : "INTEGRAZIONE";
                  resetFiltri();
                  setFiltro(next);
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]",
                  filtro === "INTEGRAZIONE"
                    ? "bg-cyan-100 text-cyan-800 border-cyan-300 ring-2 ring-cyan-400 shadow-xs"
                    : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                )}
              >
                <span>INTEGRAZIONE</span>
                <span className="bg-white px-2 py-0.5 rounded-md shadow-xs text-xs font-black text-cyan-900">
                  {counts.integrazioni || 0}
                </span>
              </div>

              {/* IN ATTESA */}
              <div
                onClick={() => {
                  const next = filtro === "IN ATTESA" ? "ALL" : "IN ATTESA";
                  resetFiltri();
                  setFiltro(next);
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]",
                  filtro === "IN ATTESA"
                    ? "bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400 shadow-xs"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                )}
              >
                <span>IN ATTESA</span>
                <span className="bg-white px-2 py-0.5 rounded-md shadow-xs text-xs font-black text-amber-900">
                  {counts.inAttesa || 0}
                </span>
              </div>

              {/* NEGATIVO */}
              <div
                onClick={() => {
                  if (filtro === "NEGATIVO") {
                    resetFiltri();
                  } else {
                    resetFiltri();
                    setFiltro("NEGATIVO");
                    setShowNegativiKpi(true);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]",
                  filtro === "NEGATIVO" || showNegativiKpi || selectedMotivoNegativo
                    ? "bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400 shadow-xs"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                )}
              >
                <span>NEGATIVO</span>
                <span className="bg-white px-2 py-0.5 rounded-md shadow-xs text-xs font-black text-red-900">
                  {counts.negativi || 0}
                </span>
                {(counts.negativi || 0) > 0 && (
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-red-500 transition-transform ml-0.5",
                      (showNegativiKpi || filtro === "NEGATIVO" || selectedMotivoNegativo) && "rotate-180"
                    )}
                  />
                )}
              </div>
            </div>

            {/* Abbonamenti Nuovi Breakdown */}
            {counts.nuoviAbb && counts.nuoviAbb.length > 0 && (
              <>
                <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                <div className="flex gap-2.5 flex-wrap justify-center items-center py-0.5">
                  {counts.nuoviAbb.map((abb: any) => {
                    const isSelected = selectedAbb === abb.name;
                    return (
                      <div
                        key={abb.name}
                        onClick={() => {
                          const next = isSelected ? null : abb.name;
                          resetFiltri();
                          setSelectedAbb(next);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs hover:scale-[1.02]",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                        )}
                      >
                        <span>{cleanSubscription(abb.name)}</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md shadow-xs text-xs font-black",
                            isSelected ? "bg-indigo-800 text-white" : "bg-white text-indigo-900"
                          )}
                        >
                          {abb.cnt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* KPI A COMPARSA - MOTIVAZIONI NEGATIVI */}
        {(showNegativiKpi || filtro === "NEGATIVO" || selectedMotivoNegativo) && (counts.negativi || 0) > 0 && (
          <div className="mt-4 pt-3.5 border-t border-rose-200/70 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-gradient-to-r from-rose-50/90 via-white to-rose-50/90 border border-rose-200 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-200 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Motivazioni Negativi ({counts.negativi})
                </span>
                {selectedMotivoNegativo && (
                  <button
                    onClick={() => setSelectedMotivoNegativo(null)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-2 cursor-pointer"
                  >
                    Tutti i negativi
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap justify-center items-center">
                {(counts.motiviNegativo || []).map((m: any) => {
                  const isSelected = selectedMotivoNegativo === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => {
                        if (filtro !== "NEGATIVO") setFiltro("NEGATIVO");
                        setSelectedMotivoNegativo(isSelected ? null : m.value);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shadow-sm",
                        isSelected
                          ? "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 ring-offset-1 shadow-rose-200 scale-[1.02]"
                          : "bg-white text-slate-700 border-rose-200/80 hover:bg-rose-50/80 hover:border-rose-300 hover:scale-[1.01]"
                      )}
                    >
                      <span>{m.label}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-black",
                          isSelected ? "bg-rose-700 text-white" : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {m.cnt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-8 pt-5 space-y-5">
        {/* Search & Discipline Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca cliente, telefono, abbonamento, note..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#21b5ba]/20 focus:border-[#21b5ba] text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Disciplina:</span>
              <select
                value={disciplinaFilter}
                onChange={(e) => setDisciplinaFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-[#21b5ba] cursor-pointer shadow-xs"
              >
                <option value="ALL">Tutte le discipline</option>
                <option value="CORSI">Corsi</option>
                <option value="SALA">Sala</option>
                <option value="SALA+CORSI">Open (Sala+Corsi)</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>

            {(filtro !== "ALL" || selectedAbb || selectedMotivoNegativo || searchQuery || disciplinaFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  resetFiltri();
                  setSearchQuery("");
                  setDisciplinaFilter("ALL");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline px-2 py-1"
              >
                Reset filtri
              </button>
            )}
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 pl-4 pr-3 cursor-pointer hover:text-slate-800 w-[22%]" onClick={() => toggleSort("cliente")}>
                    <div className="flex items-center gap-1">
                      <span>Cliente</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-800 w-[18%]" onClick={() => toggleSort("scadenza")}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Abbonamento / Scadenza</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-[28%]">Stato / Data App.</th>
                  <th className="py-3 px-3 text-center w-[14%]">Esito</th>
                  <th className="py-3 pl-3 pr-4 w-[18%]">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-cyan-600" />
                        <span>Caricamento campagna rinnovi {formatMonthHuman(mese)}...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      Nessun cliente trovato per {formatMonthHuman(mese)} con i filtri selezionati.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((row) => {
                    const client = row.client;
                    const days = getDaysDiff(row.scadenza_originaria);
                    const agenda = row.agenda_entry;

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-b-0",
                          row.esito === "RINNOVO"
                            ? "bg-emerald-50/20"
                            : row.esito === "NEGATIVO"
                            ? "bg-rose-50/20"
                            : row.esito === "IN ATTESA"
                            ? "bg-amber-50/20"
                            : ""
                        )}
                      >
                        {/* 1. Cliente */}
                        <td className="py-4 pl-4 pr-3 align-top max-w-[260px]">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => setDetailClientId(row.client_id)}
                                className="font-bold text-slate-900 text-sm hover:text-cyan-700 cursor-pointer transition-colors"
                              >
                                {client ? `${client.cognome} ${client.nome}` : "—"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDetailClientId(row.client_id)}
                                className="text-slate-300 hover:text-cyan-600 p-0.5 transition-colors"
                                title="Apri scheda anagrafica cliente"
                              >
                                <History size={13} />
                              </button>
                            </div>
                            {client?.telefono ? (
                              <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-100">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{client.telefono}</span>
                                <a
                                  href={`https://wa.me/39${cleanPhone(client.telefono)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 ml-0.5"
                                  title="Invia WhatsApp"
                                >
                                  <MessageCircle size={13} />
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs italic mt-1">Nessun telefono</span>
                            )}
                            {row.disciplina && (
                              <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded mt-1.5 w-fit">
                                {row.disciplina}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Abbonamento / Scadenza */}
                        <td className="py-4 px-3 align-top max-w-[220px] text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <div
                              className="font-bold text-slate-800 text-sm tracking-wide truncate max-w-[210px]"
                              title={row.abbonamento_originario || ""}
                            >
                              {cleanSubscription(row.abbonamento_originario) || <span className="text-slate-300">—</span>}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Scad: {row.scadenza_originaria ? formatDate(row.scadenza_originaria) : "—"}</span>
                            </div>
                            {days !== null && (
                              <div
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block",
                                  days > 0
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : days === 0
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 font-bold animate-pulse"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                )}
                              >
                                {days > 0 ? `Tra ${days} gg` : days === 0 ? "Oggi!" : `Scaduto da ${Math.abs(days)} gg`}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Stato (Stepper identico a Consulenze) */}
                        <td className="py-4 px-3 align-top min-w-[280px]">
                          <div className="flex items-center justify-center gap-2">
                            {/* Step 1: Contattato */}
                            <div className="flex flex-col items-center gap-1 w-20">
                              <StepIcon
                                active={!row.contattato}
                                completed={row.contattato}
                                icon={MessageCircle}
                                colorClass="amber"
                                onClick={() => handleStepClick(row, "CONTATTATO")}
                              />
                              <span
                                className={cn(
                                  "text-[10px] font-medium uppercase",
                                  row.contattato ? "text-amber-600 font-semibold" : "text-slate-300"
                                )}
                              >
                                Contattato
                              </span>
                            </div>

                            <div
                              className={cn(
                                "w-4 h-0.5 mb-4",
                                row.contattato && row.preso_appuntamento ? "bg-amber-200" : "bg-slate-100"
                              )}
                            />

                            {/* Step 2: Appuntamento */}
                            <div className="flex flex-col items-center gap-1 w-20">
                              <StepIcon
                                active={row.contattato && !row.preso_appuntamento}
                                completed={row.preso_appuntamento}
                                icon={Calendar}
                                colorClass="teal"
                                onClick={() => handleStepClick(row, "APPUNTAMENTO")}
                              />
                              <span
                                className={cn(
                                  "text-[10px] font-medium uppercase",
                                  row.preso_appuntamento ? "text-teal-600 font-semibold" : "text-slate-300"
                                )}
                              >
                                Appuntam.
                              </span>
                            </div>

                            <div
                              className={cn(
                                "w-4 h-0.5 mb-4",
                                row.preso_appuntamento && row.consulenza_fatta ? "bg-teal-200" : "bg-slate-100"
                              )}
                            />

                            {/* Step 3: Fatta */}
                            <div className="flex flex-col items-center gap-1 w-20">
                              <StepIcon
                                active={row.preso_appuntamento && !row.consulenza_fatta}
                                completed={row.consulenza_fatta}
                                icon={CheckCircle2}
                                colorClass="emerald"
                                onClick={() => handleStepClick(row, "FATTA")}
                              />
                              <span
                                className={cn(
                                  "text-[10px] font-medium uppercase",
                                  row.consulenza_fatta ? "text-emerald-600 font-semibold" : "text-slate-300"
                                )}
                              >
                                Fatta
                              </span>
                            </div>
                          </div>

                          {/* Date Info below stepper */}
                          {(row.preso_appuntamento || agenda) && (
                            <div className="mt-2.5 flex flex-col items-center gap-1">
                              <div
                                className={cn(
                                  "text-xs flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full font-semibold shadow-2xs",
                                  row.da_riprogrammare
                                    ? agenda?.assente
                                      ? "bg-rose-50 border border-rose-200 text-rose-800"
                                      : "bg-amber-50 border border-amber-200 text-amber-800"
                                    : row.riprogrammato
                                    ? "bg-teal-50 border border-teal-200 text-teal-900"
                                    : agenda
                                    ? "bg-indigo-50 border border-indigo-200 text-indigo-900"
                                    : "bg-teal-50 border border-teal-200 text-teal-800"
                                )}
                              >
                                <Calendar
                                  className={cn(
                                    "w-3 h-3",
                                    row.da_riprogrammare
                                      ? agenda?.assente
                                        ? "text-rose-600"
                                        : "text-amber-600"
                                      : row.riprogrammato
                                      ? "text-teal-600"
                                      : agenda
                                      ? "text-indigo-600"
                                      : "text-teal-600"
                                  )}
                                />
                                <span>
                                  {agenda
                                    ? `${new Date(agenda.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}${
                                        agenda.time ? ` ${agenda.time.slice(0, 5)}` : ""
                                      }`
                                    : formatDate(row.data_consulenza) || "Data non fissata"}
                                </span>
                                {agenda?.consulente_name && (
                                  <span className="font-normal opacity-80">({agenda.consulente_name})</span>
                                )}
                              </div>

                              {/* Flag se è già stato riprogrammato (ha ereditato la nuova data dall'agenda) */}
                              {row.riprogrammato && (
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                                  <RefreshCw className="w-2.5 h-2.5 text-teal-600" />
                                  Riprogrammato
                                </span>
                              )}

                              {/* Flag se l'appuntamento è saltato/assente e NON ancora riprogrammato in agenda */}
                              {row.da_riprogrammare && (
                                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                      agenda?.assente
                                        ? "text-rose-700 bg-rose-50 border border-rose-200"
                                        : "text-amber-700 bg-amber-50 border border-amber-200"
                                    )}
                                  >
                                    {agenda?.assente ? "Assente - Da Riprogrammare" : "Miss - Da Riprogrammare"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleBookInAgenda(row)}
                                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline"
                                  >
                                    + Riprogramma
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {!row.preso_appuntamento && !agenda && (
                            <div className="text-center mt-2">
                              <button
                                type="button"
                                onClick={() => handleBookInAgenda(row)}
                                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline bg-teal-50/80 border border-teal-200/80 px-2.5 py-0.5 rounded-full transition-colors"
                              >
                                + Fissa in Agenda
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 4. Esito Commerciale */}
                        <td className="py-4 px-3 align-top max-w-[170px]">
                          {row.esito ? (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleStepClick(row, "FATTA")}
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border transition-transform hover:scale-105",
                                  row.esito === "RINNOVO"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : row.esito === "INTEGRAZIONE"
                                    ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                                    : row.esito === "IN ATTESA"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-rose-100 text-rose-800 border-rose-300"
                                )}
                              >
                                {row.esito}
                              </button>

                              {row.nuovo_abbonamento_name && row.esito === "RINNOVO" && (
                                <div className="text-[10px] font-bold text-emerald-700">
                                  {cleanSubscription(row.nuovo_abbonamento_name)}
                                </div>
                              )}

                              {row.motivo_negativo && row.esito === "NEGATIVO" && (
                                <div className="text-[10px] font-semibold text-rose-600 italic">
                                  {row.motivo_negativo}
                                </div>
                              )}

                              {row.data_risposta && row.esito === "IN ATTESA" && (
                                <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Risp: {formatDate(row.data_risposta)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStepClick(row, "FATTA")}
                              className="text-[11px] text-slate-400 hover:text-slate-700 italic border border-dashed border-slate-200 hover:border-slate-300 px-2 py-1 rounded-lg transition-colors"
                            >
                              + Registra esito
                            </button>
                          )}
                        </td>

                        {/* 5. Note Commerciali */}
                        <td className="py-4 pl-3 pr-4 align-top min-w-[190px] max-w-[320px]">
                          <div
                            onClick={() => {
                              setNoteModal({
                                isOpen: true,
                                item: row,
                                isEditing: !row.note,
                                draft: row.note || "",
                                isSaving: false,
                              });
                            }}
                            className="group cursor-pointer rounded-xl p-2 transition-all hover:bg-slate-100/80 border border-transparent hover:border-slate-200"
                            title="Clicca per leggere o modificare la nota"
                          >
                            {row.note ? (
                              <div className="flex items-start justify-between gap-1.5">
                                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 italic break-words flex-1 group-hover:text-slate-900">
                                  {row.note}
                                </p>
                                <span
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 group-hover:text-cyan-600 shrink-0 mt-0.5"
                                  title="Apri o modifica nota"
                                >
                                  <Pencil size={12} />
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-300 text-xs italic group-hover:text-cyan-600">
                                <Pencil size={11} className="text-slate-300 group-hover:text-cyan-500" />
                                <span>+ Aggiungi nota</span>
                              </div>
                            )}
                          </div>
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

      {/* ACTION MODAL: CONFIRM RESET */}
      {actionModal.type === "CONFIRM_RESET" && (
        <ActionModal
          isOpen={true}
          title="Attenzione: Reset Stato"
          confirmLabel="Conferma Reset"
          confirmColor="red"
          onClose={() => setActionModal({ type: null, item: null })}
          onConfirm={confirmActionModal}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Stai per annullare questo step di avanzamento.</p>
            </div>
            <p className="text-slate-600 text-sm">
              Questa operazione riporterà indietro lo stato di questo cliente cancellando eventuali date o esiti
              associati a questo step.
              <br />
              <br />
              Sei sicuro di voler procedere?
            </p>
          </div>
        </ActionModal>
      )}

      {/* ACTION MODAL: SET APPUNTAMENTO */}
      {actionModal.type === "SET_APPUNTAMENTO" && (
        <ActionModal
          isOpen={true}
          title="Fissa Appuntamento Rinnovo"
          confirmLabel="Salva Appuntamento"
          confirmColor="indigo"
          onClose={() => setActionModal({ type: null, item: null })}
          onConfirm={confirmActionModal}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Registra l'appuntamento per il rinnovo di{" "}
              <b>
                {actionModal.item?.client?.cognome} {actionModal.item?.client?.nome}
              </b>
              .
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Appuntamento</label>
              <input
                type="date"
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                autoFocus
              />
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500"
                checked={addToAgenda}
                onChange={(e) => setAddToAgenda(e.target.checked)}
              />
              <span className="text-xs font-bold text-indigo-950">
                Apri drawer per inserire direttamente in Agenda Giornalone
              </span>
            </label>
          </div>
        </ActionModal>
      )}

      {/* ACTION MODAL: SET ESITO */}
      {actionModal.type === "SET_ESITO" && (
        <ActionModal
          isOpen={true}
          title="Esito Consulenza Rinnovo"
          confirmLabel="Salva Esito"
          confirmColor="emerald"
          onClose={() => setActionModal({ type: null, item: null })}
          onConfirm={confirmActionModal}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Registra l'esito della consulenza per{" "}
              <b>
                {actionModal.item?.client?.cognome} {actionModal.item?.client?.nome}
              </b>
              .
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Esito Consulenza</label>
                <CustomSelect
                  options={ESITI.map((e) => ({ value: e, label: e }))}
                  value={tempEsito || ""}
                  onChange={(v) => {
                    const next = v || null;
                    setTempEsito(next);
                    if (next !== "NEGATIVO") setTempMotivoNegativo("");
                    if (!next || !["RINNOVO", "INTEGRAZIONE"].includes(next)) setTempNuovoAbb("");
                    if (next !== "IN ATTESA") setTempDataRisp("");
                  }}
                  placeholder="— Seleziona Esito —"
                />
              </div>

              {tempEsito && ["RINNOVO", "INTEGRAZIONE"].includes(tempEsito) && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Nuovo Abbonamento <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    options={abbOptions.map((o) => ({ value: o, label: o }))}
                    value={tempNuovoAbb}
                    onChange={(v) => setTempNuovoAbb(v)}
                    placeholder="— Seleziona Nuovo Pacchetto (Obbligatorio) —"
                  />
                </div>
              )}

              {tempEsito === "NEGATIVO" && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-bold text-rose-700 uppercase flex items-center justify-between">
                    <span>Motivazione Mancato Rinnovo</span>
                    <span className="text-[10px] font-normal text-rose-500 lowercase">(opzionale)</span>
                  </label>
                  <CustomSelect
                    options={MOTIVI_NEGATIVO.map((m) => ({ value: m.value, label: m.label }))}
                    value={tempMotivoNegativo}
                    onChange={(v) => setTempMotivoNegativo(v)}
                    placeholder="— Seleziona Motivazione —"
                  />
                </div>
              )}

              {tempEsito === "IN ATTESA" && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data Risposta / Recall</label>
                  <input
                    type="date"
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={tempDataRisp}
                    onChange={(e) => setTempDataRisp(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Note Aggiuntive</label>
                <textarea
                  className="w-full min-h-[70px] text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none font-medium text-slate-800"
                  placeholder="Scrivi qui eventuali note commerciali..."
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </ActionModal>
      )}

      {/* MODAL: MOTIVI NEGATIVO BREAKDOWN */}
      {showNegativiModal && (
        <ActionModal
          isOpen={true}
          title={`Motivazioni Mancati Rinnovi (${formatMonthHuman(mese)})`}
          confirmLabel="Chiudi"
          onClose={() => setShowNegativiModal(false)}
          onConfirm={() => setShowNegativiModal(false)}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Analisi delle motivazioni espresse dai clienti non rinnovati nel mese di {formatMonthHuman(mese)}:
            </p>
            <div className="space-y-2 mt-2">
              {MOTIVI_NEGATIVO.map((m) => {
                const count = counts.motiviCounts?.[m.value] || 0;
                const pct = counts.negativi > 0 ? Math.round((count / counts.negativi) * 100) : 0;
                return (
                  <div key={m.value} className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border border-slate-100">
                    <span className="text-xs font-bold text-slate-800">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600">{count}</span>
                      <span className="text-[11px] text-slate-400 font-semibold">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              {counts.motiviCounts?.["NON SPECIFICATO"] && (
                <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Non specificato</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600">{counts.motiviCounts["NON SPECIFICATO"]}</span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      ({Math.round((counts.motiviCounts["NON SPECIFICATO"] / counts.negativi) * 100)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ActionModal>
      )}

      {/* REPORT MODAL (IDENTICAL TO CONSULENZE) */}
      <RinnoviReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        items={items}
        listName={formatMonthHuman(mese)}
      />

      {/* NOTE POPUP MODAL (VIEW & EDIT) */}
      {noteModal.isOpen && noteModal.item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 w-full max-w-lg overflow-hidden flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100/80">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Note Commerciali</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {noteModal.item.client?.cognome} {noteModal.item.client?.nome}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNoteModal({ isOpen: false, item: null, isEditing: false, draft: "", isSaving: false })
                }
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"
                title="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 font-sans">
              {noteModal.isEditing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Modifica nota cliente</span>
                    <span className="text-[11px] font-normal normal-case text-slate-400">
                      {noteModal.draft.length} caratteri
                    </span>
                  </div>
                  <textarea
                    value={noteModal.draft}
                    onChange={(e) => setNoteModal((prev) => ({ ...prev, draft: e.target.value }))}
                    placeholder="Inserisci note commerciali, dettagli o promemoria..."
                    rows={6}
                    autoFocus
                    className="w-full text-sm p-4 rounded-2xl border border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 placeholder:text-slate-400 resize-y leading-relaxed bg-slate-50/50 shadow-inner"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Contenuto della nota</span>
                    {noteModal.item.note && (
                      <span className="text-[11px] font-normal normal-case text-slate-400">
                        {noteModal.item.note.length} caratteri
                      </span>
                    )}
                  </div>
                  {noteModal.item.note ? (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-normal">
                      {noteModal.item.note}
                    </div>
                  ) : (
                    <div
                      onClick={() => setNoteModal((prev) => ({ ...prev, isEditing: true }))}
                      className="bg-slate-50 border border-dashed border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/30 rounded-2xl p-8 text-center text-sm text-slate-400 italic cursor-pointer transition-all"
                    >
                      Nessuna nota inserita per questo cliente.
                      <div className="text-xs text-cyan-600 font-bold not-italic mt-2 flex items-center justify-center gap-1">
                        <Pencil size={12} /> Clicca qui per aggiungerne una
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3 font-sans">
              {noteModal.isEditing ? (
                <>
                  <button
                    type="button"
                    disabled={noteModal.isSaving}
                    onClick={() =>
                      setNoteModal((prev) => ({
                        ...prev,
                        isEditing: false,
                        draft: prev.item?.note || "",
                      }))
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={noteModal.isSaving}
                    onClick={async () => {
                      const newNote = noteModal.draft.trim();
                      setNoteModal((prev) => ({ ...prev, isSaving: true }));
                      await updateItem(noteModal.item.id, { note: newNote || null });
                      setNoteModal((prev) => ({
                        ...prev,
                        isSaving: false,
                        isEditing: false,
                        item: { ...prev.item, note: newNote || null },
                      }));
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all flex items-center gap-1.5"
                  >
                    {noteModal.isSaving ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Salvataggio...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>Salva Nota</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setNoteModal((prev) => ({ ...prev, isEditing: true }))}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors flex items-center gap-1.5"
                  >
                    <Pencil size={13} />
                    <span>Modifica Nota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNoteModal({ isOpen: false, item: null, isEditing: false, draft: "", isSaving: false })
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Chiudi
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AGENDA ENTRY DRAWER */}
      <EntryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleEntryDrawerSave}
        initialData={drawerInitialData}
      />

      {/* CLIENT DETAIL DRAWER */}
      <ClientDetailDrawer
        clientId={detailClientId}
        onClose={() => setDetailClientId(null)}
      />
    </div>
  );
}

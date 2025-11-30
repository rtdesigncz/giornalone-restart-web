// src/components/EntryCard.tsx
"use client";

import { Phone, MessageCircle, Pencil, Trash2, CheckCircle, XCircle, Copy, Users } from "lucide-react";

type Entry = {
  id: string;
  entry_date: string;
  entry_time: string | null;
  section: string;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  consulente?: { name?: string | null; nome?: string | null } | null;
  tipo_abbonamento?: { name?: string | null; nome?: string | null } | null;
  fonte: string | null;
  comeback: boolean;
  miss: boolean;
  venduto: boolean;
  contattato?: boolean;
  note: string | null;
  consulente_id: string | null;
  tipo_abbonamento_id: string | null;
  whatsapp_sent?: boolean;
  presentato: boolean;
  negativo?: boolean;
  assente?: boolean; // Added assente
  created_at: string;
  updated_at: string;
};

import OutcomeButtons from "./outcomes/OutcomeButtons";

// ... imports ...

export default function EntryCard({
  row,
  onEdit,
  onDelete,
  onWhatsapp,
  onCall,
  onOutcomeClick, // Unified handler
  onToggleContattato, // Keep for Telefonici specific logic if needed, or unify?
  onDuplicate,
}: {
  row: Entry;
  onEdit: (row: Entry) => void;
  onDelete: (row: Entry) => void;
  onWhatsapp: (row: Entry) => void;
  onCall: (row: Entry) => void;
  onOutcomeClick?: (type: string, row: Entry) => void;
  onToggleContattato?: (row: Entry) => void;
  onDuplicate: (row: Entry) => void;
}) {
  const cons = row?.consulente?.name ?? row?.consulente?.nome ?? "";
  const tipo = row?.tipo_abbonamento?.name ?? row?.tipo_abbonamento?.nome ?? "";
  const ora = row.entry_time ? row.entry_time.slice(0, 5) : "";

  const isTelefonici = row.section === "APPUNTAMENTI TELEFONICI";

  const badge =
    isTelefonici
      ? "bg-white border-slate-200"
      : row.venduto
        ? "bg-emerald-200 border-emerald-400 shadow-sm" // Verde più scuro
        : row.miss
          ? "bg-orange-100 border-orange-300 shadow-sm"
          : row.assente
            ? "bg-yellow-100 border-yellow-300 shadow-sm"
            : row.negativo
              ? "bg-red-100 border-red-300 shadow-sm"
              : row.presentato
                ? "bg-green-100 border-green-300 shadow-sm" // Verde chiaro
                : "bg-white border-slate-200";

  return (
    <div className={`card card-hover p-4 transition-all duration-300 ${badge}`}>
      {/* Header: Name & Details */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[16px] font-bold text-slate-900 leading-tight">
            {row.nome ?? ""} {row.cognome ?? ""}
          </div>
          {!isTelefonici && ora && (
            <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
              {ora}
            </span>
          )}
        </div>

        <div className="text-[13px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          {cons && <span className="flex items-center gap-1"><Users size={12} /> {cons}</span>}
          {!isTelefonici && tipo && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-brand-ink font-bold">{tipo}</span>
            </>
          )}
        </div>
      </div>

      {/* Outcome Buttons Row */}
      <div className="mb-4">
        {isTelefonici ? (
          <button
            className={`w-full py-3 rounded-xl flex items-center justify-center border transition-all active:scale-95 gap-2 font-bold ${row.contattato ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200" : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500"
              }`}
            onClick={() => onToggleContattato?.(row)}
          >
            <CheckCircle className="h-5 w-5" />
            {row.contattato ? "Contattato" : "Segna come Contattato"}
          </button>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            <OutcomeButtons
              entry={row}
              onOutcomeClick={(type) => onOutcomeClick?.(type, row)}
              size="md"
              showLabels={true}
              section={row.section}
            />
          </div>
        )}
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-4">
        {row.telefono && (
          <a href={`tel:${row.telefono}`} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 active:bg-slate-100">
            <Phone size={14} /> <span className="font-medium">{row.telefono}</span>
          </a>
        )}
        {!isTelefonici && row.fonte && <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">🏷️ {row.fonte}</div>}
        {row.note && <div className="w-full mt-1 flex items-start gap-1.5 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100/50 text-yellow-700 text-xs">
          <span className="mt-0.5">📝</span>
          <span className="line-clamp-2">{row.note}</span>
        </div>}
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          className={`h-11 flex-1 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${row.whatsapp_sent ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600"}`}
          onClick={() => onWhatsapp(row)}
        >
          {row.whatsapp_sent ? <CheckCircle size={20} /> : <MessageCircle size={20} />}
        </button>

        <button
          className="h-11 flex-1 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-all active:scale-95"
          onClick={() => onCall(row)}
        >
          <Phone size={20} />
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1"></div>

        <button
          className="h-11 w-11 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-all active:scale-95"
          onClick={() => onEdit(row)}
        >
          <Pencil size={20} />
        </button>

        <button
          className="h-11 w-11 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-all active:scale-95"
          onClick={() => onDuplicate(row)}
        >
          <Copy size={20} />
        </button>

        <button
          className="h-11 w-11 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all active:scale-95"
          onClick={() => onDelete(row)}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
// src/components/EntryCard.tsx
"use client";

import { Phone, MessageCircle, Pencil, Trash2, CheckCircle, XCircle, Copy } from "lucide-react";

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
  fonte?: string | null;
  comeback: boolean;
  miss: boolean;
  venduto: boolean;
  contattato?: boolean; // NEW
  note?: string | null;
  consulente_id?: string | null;
  tipo_abbonamento_id?: string | null;
};

export default function EntryCard({
  row,
  onEdit,
  onDelete,
  onWhatsapp,
  onCall,
  onToggleMiss,
  onToggleVenduto,
  onTogglePresentato,   // opzionale per altre sezioni
  onToggleContattato,   // NEW per telefonici
  onDuplicate,
}: {
  row: Entry;
  onEdit: (row: Entry) => void;
  onDelete: (row: Entry) => void;
  onWhatsapp: (row: Entry) => void;
  onCall: (row: Entry) => void;
  onToggleMiss: (row: Entry) => void;
  onToggleVenduto: (row: Entry) => void;
  onTogglePresentato?: (row: Entry) => void;
  onToggleContattato?: (row: Entry) => void;
  onDuplicate: (row: Entry) => void;
}) {
  const cons = row?.consulente?.name ?? row?.consulente?.nome ?? "";
  const tipo = row?.tipo_abbonamento?.name ?? row?.tipo_abbonamento?.nome ?? "";
  const ora = row.entry_time ? row.entry_time.slice(0, 5) : "";

  const isTelefonici = row.section === "APPUNTAMENTI TELEFONICI";

  const badge =
    isTelefonici
      ? "bg-slate-50 text-slate-700 border border-slate-200"
      : row.venduto
        ? "bg-green-50 text-green-700 border border-green-200"
        : row.miss
          ? "bg-rose-50 text-rose-700 border border-rose-200"
          : "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <div className={`card card-hover p-4 transition-all duration-300 ${badge}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold truncate text-slate-800">
            {row.nome ?? ""} {row.cognome ?? ""}
          </div>
          <div className="text-[13px] text-slate-500 truncate mt-0.5">
            {!isTelefonici && ora ? <span className="font-medium text-slate-700">{ora}</span> : ""}
            {!isTelefonici && ora ? <span className="mx-1.5 text-slate-300">|</span> : ""}
            {cons}
            {!isTelefonici && tipo ? <span className="mx-1.5 text-slate-300">|</span> : ""}
            {!isTelefonici && tipo ? <span className="text-brand-ink font-medium">{tipo}</span> : ""}
          </div>
        </div>

        {/* Toggle area (varia per sezione) */}
        <div className="flex items-center gap-2">
          {isTelefonici ? (
            <button
              className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${row.contattato ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200" : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
                }`}
              title="Contattato"
              onClick={() => onToggleContattato?.(row)}
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${row.venduto ? "bg-brand text-white border-brand shadow-md shadow-cyan-200" : "bg-white border-slate-200 text-slate-400 hover:border-brand hover:text-brand"
                  }`}
                title="Venduto"
                onClick={() => onToggleVenduto(row)}
              >
                <CheckCircle className="h-5 w-5" />
              </button>
              <button
                className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${row.miss ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200" : "bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500"
                  }`}
                title="Miss"
                onClick={() => onToggleMiss(row)}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-600">
        {row.telefono && <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-slate-100">📞 <span className="font-medium">{row.telefono}</span></div>}
        {!isTelefonici && row.fonte && <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-slate-100">🏷️ {row.fonte}</div>}
        {row.note && <div className="truncate flex items-center gap-1.5 bg-yellow-50/50 px-2 py-1 rounded-lg border border-yellow-100/50 text-yellow-700">📝 {row.note}</div>}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100/50 pt-3">
        <button
          className="icon-btn"
          onClick={() => onWhatsapp(row)}
          title="WhatsApp"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
        </button>
        <button
          className="icon-btn"
          onClick={() => onCall(row)}
          title="Chiama"
        >
          <Phone className="h-4 w-4 text-sky-600" />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <button
          className="icon-btn"
          onClick={() => onEdit(row)}
          title="Modifica"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="icon-btn"
          onClick={() => onDuplicate(row)}
          title="Duplica in…"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          className="icon-btn hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
          onClick={() => onDelete(row)}
          title="Elimina"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
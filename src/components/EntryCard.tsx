// src/components/EntryCard.tsx
"use client";

import { Phone, MessageCircle, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

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
}: {
  row: Entry;
  onEdit: (row: Entry) => void;
  onDelete: (row: Entry) => void;
  onWhatsapp: (row: Entry) => void;
  onCall: (row: Entry) => void;
  onToggleMiss: (row: Entry) => void;
  onToggleVenduto: (row: Entry) => void;
}) {
  const cons = row?.consulente?.name ?? row?.consulente?.nome ?? "";
  const tipo = row?.tipo_abbonamento?.name ?? row?.tipo_abbonamento?.nome ?? "";
  const ora = row.entry_time ? row.entry_time.slice(0, 5) : "";

  const badge =
    row.venduto
      ? "bg-green-50 text-green-700 border border-green-200"
      : row.miss
      ? "bg-rose-50 text-rose-700 border border-rose-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <div className={`rounded-xl p-3 ${badge}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate">
            {row.nome ?? ""} {row.cognome ?? ""}
          </div>
          <div className="text-[12px] text-slate-500 truncate">
            {ora ? `${ora} · ` : ""}
            {cons}
            {tipo ? ` · ${tipo}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Venduto / Miss toggle */}
          <button
            className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
              row.venduto
                ? "bg-green-600 text-white border-green-600"
                : "border-slate-300 text-slate-600"
            }`}
            title="Venduto"
            onClick={() => onToggleVenduto(row)}
          >
            <CheckCircle className="h-5 w-5" />
          </button>
          <button
            className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
              row.miss
                ? "bg-rose-600 text-white border-rose-600"
                : "border-slate-300 text-slate-600"
            }`}
            title="Miss"
            onClick={() => onToggleMiss(row)}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Telefono / Fonte / Note */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-600">
        {row.telefono && <div>📞 {row.telefono}</div>}
        {row.fonte && <div>🏷️ {row.fonte}</div>}
        {row.note && <div className="truncate">📝 {row.note}</div>}
      </div>

      {/* Azioni (solo icone) */}
      <div className="mt-3 flex items-center gap-3">
        <button
          className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center"
          onClick={() => onWhatsapp(row)}
          title="WhatsApp"
        >
          <MessageCircle className="h-5 w-5 text-green-600" />
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center"
          onClick={() => onCall(row)}
          title="Chiama"
        >
          <Phone className="h-5 w-5 text-sky-600" />
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center"
          onClick={() => onEdit(row)}
          title="Modifica"
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-rose-300 text-rose-700 flex items-center justify-center"
          onClick={() => onDelete(row)}
          title="Elimina"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
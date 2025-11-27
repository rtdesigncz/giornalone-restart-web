// src/components/RowActions.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";
import { MessageCircle, Phone, Trash2 } from "lucide-react";
import { useState } from "react";

function cleanPhone(num?: string | null) {
  if (!num) return "";
  const only = num.replace(/[^\d+]/g, "");
  if (only.startsWith("+")) return only;
  if (only.startsWith("00")) return "+" + only.slice(2);
  if (only.startsWith("3")) return "+39" + only;
  return only;
}

export default function RowActions({
  id,
  telefono,
  nome,
  consulente_name,
  entry_date,
  entry_time, // già formattato HH:mm
}: {
  id: string;
  telefono?: string | null;
  nome?: string | null;
  consulente_name?: string | null;
  entry_date?: string | null;
  entry_time?: string | null; // HH:mm
}) {
  const [deleting, setDeleting] = useState(false);

  const tel = cleanPhone(telefono);
  const dateIT = entry_date
    ? new Date(entry_date + "T00:00:00Z").toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  const timeStr = entry_time ?? ""; // HH:mm passato da RowsClient

  const msg =
    `Ciao ${nome ?? ""},

Ti ricordiamo l'appuntamento del giorno ${dateIT}, alle ore ${timeStr}, con ${consulente_name ?? ""}. Ti aspettiamo!

Restart Fitness Club`;

  const wa = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  const callHref = tel ? `tel:${tel}` : undefined;

  const onDelete = async () => {
    if (!confirm("Eliminare questa riga?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) alert("Errore eliminazione: " + error.message);
      else window.location.reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* WhatsApp */}
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded border hover:opacity-90"
        style={{ background: "#22c55e", color: "white", borderColor: "#22c55e" }}
        title="WhatsApp"
      >
        <MessageCircle size={16} />
      </a>

      {/* Chiama */}
      <a
        href={callHref}
        className="p-2 rounded border hover:opacity-90"
        style={{
          background: "#1AB4B8",
          color: "white",
          borderColor: "#1AB4B8",
          pointerEvents: callHref ? "auto" : "none",
          opacity: callHref ? 1 : 0.5,
        }}
        title="Chiama"
      >
        <Phone size={16} />
      </a>

      {/* Elimina */}
      <button
        onClick={onDelete}
        disabled={deleting}
        className="p-2 rounded border hover:opacity-90"
        style={{ background: "#ef4444", color: "white", borderColor: "#ef4444", opacity: deleting ? 0.6 : 1 }}
        title="Elimina"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizeToDB(val: string): string | null {
  if (!val) return null;
  const m = val.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

export default function EditableTime({
  id,
  value,              // HH:mm oppure ""
  onChangeHHmm,       // callback verso il parent
}: {
  id: string;
  value: string;
  onChangeHHmm?: (newHHmm: string) => void;
}) {
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const onChange = async (v: string) => {
    setVal(v);
    onChangeHHmm?.(v); // 👈 aggiorna subito il parent
    setSaving(true);
    try {
      const toDB = normalizeToDB(v);
      const { error } = await supabase.from("entries").update({ entry_time: toDB }).eq("id", id);
      if (error) console.error("Errore update time:", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1"
      />
      {saving && <span className="text-xs text-gray-500">salvo…</span>}
    </div>
  );
}
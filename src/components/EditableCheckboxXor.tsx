// src/components/EditableCheckboxXor.tsx
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Checkbox che aggiorna in modo atomico un campo booleano
 * e forza l'altro a false quando viene messo a true (XOR).
 */
export default function EditableCheckboxXor({
  id,
  field,       // "miss" | "venduto"
  value,
  otherField,  // "venduto" | "miss"
  otherValue,
}: {
  id: string;
  field: "miss" | "venduto";
  value: boolean;
  otherField: "miss" | "venduto";
  otherValue: boolean;
}) {
  const [checked, setChecked] = useState(!!value);
  const [saving, setSaving] = useState(false);

  const onChange = async (next: boolean) => {
    setChecked(next);
    setSaving(true);
    try {
      let payload: any = {};
      if (next) {
        // se attivo questo, spengo l'altro
        payload[field] = true;
        payload[otherField] = false;
      } else {
        // se lo disattivo, non tocco l'altro
        payload[field] = false;
      }
      const { error } = await supabase.from("entries").update(payload).eq("id", id);
      if (error) {
        console.error("Errore update XOR:", error.message);
        alert("Errore salvataggio: " + error.message);
        // ripristina stato UI
        setChecked(value);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={saving}
      />
      {saving && <span className="text-xs text-gray-500">salvo…</span>}
    </label>
  );
}

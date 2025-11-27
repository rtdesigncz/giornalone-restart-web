// src/components/EditableCheckboxXor.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Checkbox che aggiorna in modo atomico un campo booleano
 * e forza l'altro a false quando viene messo a true (XOR).
 */
export default function EditableCheckboxXor({
  id,
  field,
  value,
  otherField,
  otherValue,
}: {
  id: string;
  field: string;
  value: boolean;
  otherField?: string;
  otherValue?: boolean;
}) {
  const [checked, setChecked] = useState(!!value);
  const [saving, setSaving] = useState(false);

  const onChange = async (next: boolean) => {
    setChecked(next);
    setSaving(true);
    try {
      let payload: any = {};
      payload[field] = next;

      if (next && otherField) {
        // se attivo questo, spengo l'altro (solo se definito)
        payload[otherField] = false;
      }
      // se lo disattivo, non tocco l'altro

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

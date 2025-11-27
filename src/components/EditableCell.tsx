"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Props = {
  id: string;          // id della riga
  field: string;       // nome colonna nel DB (es. "nome")
  value: any;          // valore attuale
};

export default function EditableCell({ id, field, value }: Props) {
  const [val, setVal] = useState(value ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save(newVal: string) {
    setLoading(true);
    const { error } = await supabase
      .from("entries")
      .update({ [field]: newVal })
      .eq("id", id);

    setLoading(false);
    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else {
      router.refresh();
    }
  }

  return (
    <input
      className="px-2 py-1 border rounded w-full text-sm"
      value={val}
      disabled={loading}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => save(e.target.value)}
    />
  );
}

"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

function sanitizePhone(raw: string) {
  const only = raw.replace(/[\s\-\(\)\.]/g, "");
  if (only.startsWith("+")) return only;
  if (only.startsWith("00")) return "+" + only.slice(2);
  if (only.startsWith("3")) return "+39" + only;
  return only;
}

export default function EditablePhone(props: { id: string; value?: string | null }) {
  const router = useRouter();
  const [val, setVal] = useState(props.value ?? "");
  const [loading, setLoading] = useState(false);

  const onBlur = async () => {
    setLoading(true);
    const cleaned = val ? sanitizePhone(val) : null;
    const { error } = await supabase.from("entries").update({ telefono: cleaned }).eq("id", props.id);
    setLoading(false);
    if (error) alert("Errore salvataggio: " + error.message);
    else {
      setVal(cleaned ?? "");
      router.refresh();
    }
  };

  return (
    <input
      className="px-2 py-1 border rounded w-full text-sm"
      value={val}
      disabled={loading}
      onChange={(e) => setVal(e.target.value)}
      onBlur={onBlur}
      placeholder="+39..."
    />
  );
}

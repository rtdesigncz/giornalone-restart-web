"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

export default function EditableSelect(props: {
  id: string;                    // id della riga entries
  field: "consulente_id" | "tipo_abbonamento_id";
  value?: string | null;         // id attuale
  placeholder?: string;
}) {
  const router = useRouter();
  const [val, setVal] = useState<string>(props.value ?? "");
  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (props.field === "consulente_id") {
        const { data, error } = await supabase
          .from("consulenti")
          .select("id, name")
          .order("name", { ascending: true });
        if (!error) setOpts((data ?? []) as Option[]);
      } else {
        const { data, error } = await supabase
          .from("tipi_abbonamento")
          .select("id, name")
          .eq("active", true)
          .order("name", { ascending: true });
        if (!error) setOpts((data ?? []) as Option[]);
      }
    })();
  }, [props.field]);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setVal(next);
    setLoading(true);
    const { error } = await supabase
      .from("entries")
      .update({ [props.field]: next || null })
      .eq("id", props.id);
    setLoading(false);
    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else {
      router.refresh();
    }
  };

return (
  <select
    className="border rounded px-2 py-1 w-full text-sm"
    value={val}
    disabled={loading}
    onChange={onChange}
  >
    {/* Mostra il placeholder solo se non c'è un valore selezionato */}
    {(!val || val === "") && (
      <option value="">{props.placeholder ?? "—"}</option>
    )}
    {opts.map((o) => (
      <option key={o.id} value={o.id}>
        {o.name}
      </option>
    ))}
  </select>
);

}

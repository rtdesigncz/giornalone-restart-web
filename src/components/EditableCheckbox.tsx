"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditableCheckbox(props: {
  id: string;
  field: "miss" | "venduto" | "comeback";
  value: boolean;
}) {
  const router = useRouter();
  const [val, setVal] = useState(!!props.value);
  const [loading, setLoading] = useState(false);

  const onToggle = async () => {
    const next = !val;
    setVal(next);
    setLoading(true);

    const update: Record<string, any> = { [props.field]: next };
    if (props.field === "venduto" && next === true) update["miss"] = false;

    const { error } = await supabase.from("entries").update(update).eq("id", props.id);
    setLoading(false);
    if (error) alert("Errore salvataggio: " + error.message);
    else router.refresh();
  };

  return <input type="checkbox" checked={val} disabled={loading} onChange={onToggle} />;
}

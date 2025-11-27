// src/components/AddRowInline.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

export default function AddRowInline({ section }: { section: string }) {
  const sp = useSearchParams();
  const router = useRouter();

  const scope = sp.get("scope") ?? "day";
  const selectedDate = sp.get("date") ?? new Date().toISOString().slice(0, 10);
  const isDay = scope === "day";

  const [open, setOpen] = useState(false);

  // default time: ora corrente solo per TOUR SPONTANEI
  const nowHHmm = useMemo(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, []);
  const defaultTime = section === "TOUR SPONTANEI" ? nowHHmm : "";

  const [entryTime, setEntryTime] = useState<string>(defaultTime);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fonte, setFonte] = useState("");
  const [note, setNote] = useState("");

  const [comeback, setComeback] = useState(false);
  const [miss, setMiss] = useState(false);
  const [venduto, setVenduto] = useState(false);

  const [consulenti, setConsulenti] = useState<Option[]>([]);
  const [tipi, setTipi] = useState<Option[]>([]);
  const [consulenteId, setConsulenteId] = useState<string>("");
  const [tipoId, setTipoId] = useState<string>("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("consulenti").select("id,name").order("name");
      setConsulenti((c ?? []) as Option[]);
      const { data: t } = await supabase.from("tipi_abbonamento").select("id,name").eq("active", true).order("name");
      setTipi((t ?? []) as Option[]);
    })();
  }, []);

  useEffect(() => {
    if (venduto && miss) setMiss(false);
  }, [venduto, miss]);

  const sanitizePhone = (raw: string) => {
    const only = raw.replace(/[\s\-\(\)\.]/g, "");
    if (only.startsWith("+")) return only;
    if (only.startsWith("00")) return "+" + only.slice(2);
    if (only.startsWith("3")) return "+39" + only; // IT default
    return only;
  };

  const resetForm = () => {
    setEntryTime(defaultTime);
    setNome(""); setCognome(""); setTelefono("");
    setFonte(""); setNote("");
    setComeback(false); setMiss(false); setVenduto(false);
    setConsulenteId(""); setTipoId("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalMiss = venduto ? false : miss;
      const { error } = await supabase.from("entries").insert({
        entry_date: selectedDate,
        entry_time: entryTime ? `${entryTime}:00` : null,
        section,
        nome: nome || null,
        cognome: cognome || null,
        telefono: telefono ? sanitizePhone(telefono) : null,
        consulente_id: consulenteId || null,
        tipo_abbonamento_id: tipoId || null,
        fonte: fonte || null,
        comeback,
        miss: finalMiss,
        note: note || null,
        venduto,
      });
      if (error) alert("Errore salvataggio: " + error.message);
      else {
        resetForm();
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  // Se non è Giorno, nascondi (potresti anche disabilitarlo se preferisci)
  if (!isDay) return null;

  return (
    <div className="flex items-center gap-2">
      {!open ? (
        <button
          type="button"
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: "#1AB4B8", color: "white" }}
          onClick={() => setOpen(true)}
        >
          Aggiungi riga
        </button>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <div><label className="block text-xs">Giorno</label>
            <input value={selectedDate} disabled className="border rounded px-2 py-1 w-[130px]" />
          </div>
          <div><label className="block text-xs">Ora</label>
            <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div><label className="block text-xs">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div><label className="block text-xs">Cognome</label>
            <input value={cognome} onChange={(e) => setCognome(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div><label className="block text-xs">Telefono</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="border rounded px-2 py-1" placeholder="+39..." />
          </div>
          <div><label className="block text-xs">Consulente</label>
            <select value={consulenteId} onChange={(e) => setConsulenteId(e.target.value)} className="border rounded px-2 py-1">
              <option value="">—</option>
              {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs">Tipo</label>
            <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="border rounded px-2 py-1">
              <option value="">—</option>
              {tipi.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs">Fonte</label>
            <input value={fonte} onChange={(e) => setFonte(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <label className="inline-flex items-center gap-2 px-2"><span className="text-xs">Come Back</span>
            <input type="checkbox" checked={comeback} onChange={(e) => setComeback(e.target.checked)} />
          </label>
          <label className="inline-flex items-center gap-2 px-2"><span className="text-xs">Miss</span>
            <input type="checkbox" checked={miss} onChange={(e) => setMiss(e.target.checked)} disabled={venduto} />
          </label>
          <label className="inline-flex items-center gap-2 px-2"><span className="text-xs">Venduto</span>
            <input type="checkbox" checked={venduto} onChange={(e) => setVenduto(e.target.checked)} />
          </label>
          <div className="min-w-[200px]"><label className="block text-xs">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>

          <button type="submit" className="px-3 py-2 rounded border" disabled={saving}
            style={{ backgroundColor: "#1AB4B8", color: "white", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Aggiunta…" : "Salva"}
          </button>
          <button type="button" className="px-3 py-2 rounded border" onClick={() => { resetForm(); setOpen(false); }}>
            Annulla
          </button>
        </form>
      )}
    </div>
  );
}

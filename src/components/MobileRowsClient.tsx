// src/components/MobileRowsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import EditableCell from "./EditableCell";
import EditablePhone from "./EditablePhone";
import EditableTime from "./EditableTime";
import RowActions from "./RowActions";
import EditableCheckboxXor from "./EditableCheckboxXor";

type Option = { id: string; name: string };

interface Props {
  section: string;
  rows: any[];
  showDateColumn: boolean;
  isDay: boolean;
  selectedDate: string;
}

function hhmm(val: unknown): string {
  const s = String(val ?? "");
  const m = s.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}
function normalizeToDB(val: string): string | null {
  if (!val) return null;
  const m = val.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

export default function MobileRowsClient({
  section, rows, showDateColumn, isDay, selectedDate,
}: Props) {
  const [data, setData] = useState<any[]>(rows);
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<any | null>(null);
  const [consulenti, setConsulenti] = useState<Option[]>([]);
  const [tipi, setTipi] = useState<Option[]>([]);
  const [savingNew, setSavingNew] = useState(false);

  const nowHHmm = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, []);
  const defaultTime: string = section === "TOUR SPONTANEI" ? nowHHmm : "";

  useEffect(() => setData(rows), [rows]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("consulenti").select("id,name").order("name");
      setConsulenti((c ?? []) as Option[]);
      const { data: t } = await supabase.from("tipi_abbonamento").select("id,name").eq("active", true).order("name");
      setTipi((t ?? []) as Option[]);
    })();
  }, []);

  const toggleEdit = (id: string) => {
    setEditing(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addDraft = () => {
    if (!isDay || draft) return;
    setDraft({
      __isNew: true,
      id: "__draft__",
      entry_date: selectedDate,
      entry_time: defaultTime,
      section,
      nome: "", cognome: "", telefono: "",
      consulente_id: "", tipo_abbonamento_id: "",
      fonte: "", comeback: false, miss: false, note: "", venduto: false,
    });
  };
  const cancelDraft = () => setDraft(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.section === section) addDraft();
    };
    window.addEventListener("add-draft", handler as EventListener);
    return () => window.removeEventListener("add-draft", handler as EventListener);
  }, [section, isDay, draft]);

  const sanitizePhone = (raw: string) => {
    const only = (raw || "").replace(/[\s\-\(\)\.]/g, "");
    if (!only) return "";
    if (only.startsWith("+")) return only;
    if (only.startsWith("00")) return "+" + only.slice(2);
    if (only.startsWith("3")) return "+39" + only;
    return only;
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSavingNew(true);
    try {
      const payload: any = {
        entry_date: draft.entry_date,
        entry_time: normalizeToDB(draft.entry_time),
        section: draft.section,
        nome: draft.nome || null,
        cognome: draft.cognome || null,
        telefono: draft.telefono ? sanitizePhone(draft.telefono) : null,
        consulente_id: draft.consulente_id || null,
        tipo_abbonamento_id: draft.tipo_abbonamento_id || null,
        fonte: draft.fonte || null,
        comeback: !!draft.comeback,
        miss: draft.venduto ? false : !!draft.miss,
        note: draft.note || null,
        venduto: !!draft.venduto,
      };
      const { error } = await supabase.from("entries").insert(payload);
      if (error) { alert("Errore salvataggio: " + error.message); return; }
      window.location.reload();
    } finally { setSavingNew(false); }
  };

  const handleTimeChanged = (id: string, newHHmm: string) => {
    setData(prev => prev.map(r => r.id === id ? ({ ...r, entry_time: newHHmm }) : r));
  };

  return (
    <div className="space-y-3 md:hidden">
      {/* Card bozza */}
      {draft && (
        <div className={`card p-3 ${draft.venduto ? "bg-green-50" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600">
              {showDateColumn ? <span className="label">Data</span> : null}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-brand" onClick={saveDraft} disabled={savingNew}>
                {savingNew ? "Salvo…" : "Salva"}
              </button>
              <button className="btn btn-ghost" onClick={cancelDraft}>Annulla</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showDateColumn && (
              <div>
                <div className="label">Data</div>
                <div>{String(draft.entry_date).split("-").reverse().join("-")}</div>
              </div>
            )}
            <div>
              <div className="label">Ora</div>
              <input type="time" value={draft.entry_time ?? ""} onChange={(e) => setDraft({ ...draft, entry_time: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <div className="label">Nome</div>
              <input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <div className="label">Cognome</div>
              <input value={draft.cognome} onChange={(e) => setDraft({ ...draft, cognome: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <div className="label">Telefono</div>
              <input value={draft.telefono} onChange={(e) => setDraft({ ...draft, telefono: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="+39..." />
            </div>
            <div>
              <div className="label">Consulente</div>
              <select value={draft.consulente_id} onChange={(e) => setDraft({ ...draft, consulente_id: e.target.value })} className="border rounded px-2 py-1 w-full">
                <option value="">—</option>
                {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Fonte</div>
              <input value={draft.fonte} onChange={(e) => setDraft({ ...draft, fonte: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <div className="label">Tipo</div>
              <select value={draft.tipo_abbonamento_id} onChange={(e) => setDraft({ ...draft, tipo_abbonamento_id: e.target.value })} className="border rounded px-2 py-1 w-full">
                <option value="">—</option>
                {tipi.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!draft.comeback} onChange={(e) => setDraft({ ...draft, comeback: e.target.checked })} />
                <span>Come Back</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!draft.miss} onChange={(e) => setDraft({ ...draft, miss: e.target.checked, venduto: e.target.checked ? false : draft.venduto })} disabled={draft.venduto} />
                <span>Miss</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!draft.venduto} onChange={(e) => setDraft({ ...draft, venduto: e.target.checked, miss: e.target.checked ? false : draft.miss })} disabled={draft.miss} />
                <span>Venduto</span>
              </label>
            </div>
            <div className="col-span-2">
              <div className="label">Note</div>
              <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Cards righe esistenti */}
      {data.length === 0 && !draft ? (
        <div className="text-slate-500 px-4">Nessuna riga.</div>
      ) : (
        data.map(r => {
          const isEditing = editing.has(r.id);
          const timeText = hhmm(r.entry_time);

          return (
            <div key={r.id} className={`card p-3 ${r.venduto ? "bg-green-50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{r.nome ?? ""} {r.cognome ?? ""}</div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost" onClick={() => toggleEdit(r.id)}>
                    {isEditing ? "Fine" : "Modifica"}
                  </button>
                  <RowActions
                    id={r.id}
                    telefono={r.telefono}
                    nome={r.nome}
                    consulente_name={r.consulente_name}
                    entry_date={r.entry_date}
                    entry_time={timeText}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {showDateColumn && (
                  <div>
                    <div className="label">Data</div>
                    <div>{String(r.entry_date).split("-").reverse().join("-")}</div>
                  </div>
                )}
                <div>
                  <div className="label">Ora</div>
                  {isEditing ? <EditableTime id={r.id} value={timeText} onChangeHHmm={(v) => handleTimeChanged(r.id, v)} /> : <div>{timeText}</div>}
                </div>
                <div>
                  <div className="label">Telefono</div>
                  {isEditing ? <EditablePhone id={r.id} value={r.telefono} /> : <div>{r.telefono ?? ""}</div>}
                </div>
                <div>
                  <div className="label">Consulente</div>
                  <div>{r.consulente_name ?? ""}</div>
                </div>
                <div>
                  <div className="label">Fonte</div>
                  {isEditing ? <EditableCell id={r.id} field="fonte" value={r.fonte} /> : <div>{r.fonte ?? ""}</div>}
                </div>
                <div>
                  <div className="label">Tipo</div>
                  <div>{r.tipo_abbonamento_name ?? ""}</div>
                </div>
                <div className="col-span-2 flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2">
                    <EditableCheckboxXor id={r.id} field="miss" value={!!r.miss} otherField="venduto" otherValue={!!r.venduto} />
                    <span>Miss</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!r.comeback} readOnly />
                    <span>Come Back</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <EditableCheckboxXor id={r.id} field="venduto" value={!!r.venduto} otherField="miss" otherValue={!!r.miss} />
                    <span>Venduto</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <div className="label">Note</div>
                  {isEditing ? <EditableCell id={r.id} field="note" value={r.note} /> : <div>{r.note ?? ""}</div>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
// src/components/RowsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import EditableCell from "./EditableCell";
import EditablePhone from "./EditablePhone";
import EditableTime from "./EditableTime";
import RowActions from "./RowActions";
import EditableCheckboxXor from "./EditableCheckboxXor";

type Option = { id: string; name: string };

interface RowsClientProps {
  section: string;
  rows: any[];
  showDateColumn: boolean;
  isDay: boolean;
  selectedDate: string;
}

// Helpers
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

export default function RowsClient(props: RowsClientProps) {
  const { section, rows, showDateColumn, isDay, selectedDate } = props;

  const [data, setData] = useState<any[]>(rows);
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<any | null>(null);
  const [consulenti, setConsulenti] = useState<Option[]>([]);
  const [tipi, setTipi] = useState<Option[]>([]);
  const [savingNew, setSavingNew] = useState(false);

  const nowHHmm = useMemo(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, []);
  const defaultTime: string = section === "TOUR SPONTANEI" ? nowHHmm : "";

  useEffect(() => setData(rows), [rows]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("consulenti").select("id,name").order("name");
      setConsulenti((c ?? []) as Option[]);
      const { data: t } = await supabase
        .from("tipi_abbonamento")
        .select("id,name")
        .eq("active", true)
        .order("name");
      setTipi((t ?? []) as Option[]);
    })();
  }, []);

  const toggleEdit = (id: string) => {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // riga nuova inline
  const addDraft = () => {
    if (!isDay || draft) return;
    setDraft({
      __isNew: true,
      id: "__draft__",
      entry_date: selectedDate,
      entry_time: defaultTime, // "" nelle altre sezioni
      section,
      nome: "",
      cognome: "",
      telefono: "",
      consulente_id: "",
      tipo_abbonamento_id: "",
      fonte: "",
      comeback: false,
      miss: false,
      note: "",
      venduto: false,
      presentato: false,
    });
  };
  const cancelDraft = () => setDraft(null);

  // ascolta il bottone “+ Aggiungi Riga”
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
    if (only === "") return "";
    if (only.startsWith("+")) return only;
    if (only.startsWith("00")) return "+" + only.slice(2);
    if (only.startsWith("3")) return "+39" + only;
    return only;
  };

  const saveDraft = async () => {
    if (!draft) return;
    // Se vuoi forzare l’ora obbligatoria:
    // if (!draft.entry_time) { alert("Imposta un orario"); return; }
    setSavingNew(true);
    try {
      const payload: any = {
        entry_date: draft.entry_date,
        entry_time: normalizeToDB(draft.entry_time), // normalizzo (HH:mm:00)
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
        presentato: !!draft.presentato,
      };
      const { error } = await supabase.from("entries").insert(payload);
      if (error) {
        alert("Errore salvataggio: " + error.message);
        return;
      }
      window.location.reload();
    } finally {
      setSavingNew(false);
    }
  };

  // 👉 callback per aggiornare l’ora nello stato locale quando modifichi una riga esistente
  const handleTimeChanged = (id: string, newHHmm: string) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, entry_time: newHHmm } : r)));
  };

  return (
    <>
      <tbody className="[&>tr>td]:align-top [&>tr>td]:break-words">
        {/* Riga bozza */}
        {draft && (
          <tr className={draft.venduto ? "bg-green-50" : ""}>
            {showDateColumn && (
              <td className="px-3 py-2">
                {String(draft.entry_date).split("-").reverse().join("-")}
              </td>
            )}
            {/* ORA: input time SOLO nella riga nuova */}
            <td className="px-3 py-2">
              <input
                type="time"
                value={draft.entry_time ?? ""}
                onChange={(e) => setDraft({ ...draft, entry_time: e.target.value })}
                className="border rounded px-2 py-1"
              />
            </td>
            <td className="px-3 py-2">
              <input
                value={draft.nome}
                onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                className="border rounded px-2 py-1"
              />
            </td>
            <td className="px-3 py-2">
              <input
                value={draft.cognome}
                onChange={(e) => setDraft({ ...draft, cognome: e.target.value })}
                className="border rounded px-2 py-1"
              />
            </td>
            <td className="px-3 py-2">
              <input
                value={draft.telefono}
                onChange={(e) => setDraft({ ...draft, telefono: e.target.value })}
                className="border rounded px-2 py-1"
                placeholder="+39..."
              />
            </td>
            <td className="px-3 py-2">
              <select
                value={draft.consulente_id}
                onChange={(e) => setDraft({ ...draft, consulente_id: e.target.value })}
                className="border rounded px-2 py-1"
              >
                <option value="">—</option>
                {consulenti.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </td>
            <td className="px-3 py-2">
              <input
                value={draft.fonte}
                onChange={(e) => setDraft({ ...draft, fonte: e.target.value })}
                className="border rounded px-2 py-1"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="checkbox"
                checked={!!draft.comeback}
                onChange={(e) => setDraft({ ...draft, comeback: e.target.checked })}
              />
            </td>
            <td className="px-3 py-2">
              <select
                value={draft.tipo_abbonamento_id}
                onChange={(e) => setDraft({ ...draft, tipo_abbonamento_id: e.target.value })}
                className="border rounded px-2 py-1"
              >
                <option value="">—</option>
                {tipi.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </td>
            <td className="px-3 py-2">
              <input
                type="checkbox"
                checked={!!draft.miss}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    miss: e.target.checked,
                    venduto: e.target.checked ? false : draft.venduto,
                  })
                }
                disabled={draft.venduto}
              />
            </td>
            <td className="px-3 py-2">
              <input
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                className="border rounded px-2 py-1 w-full"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="checkbox"
                checked={!!draft.venduto}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    venduto: e.target.checked,
                    miss: e.target.checked ? false : draft.miss,
                  })
                }
                disabled={draft.miss}
              />
            </td>
            <td className="px-3 py-2 whitespace-nowrap flex gap-2">
              <button
                className="px-2 py-1 border rounded hover:opacity-90"
                onClick={saveDraft}
                disabled={savingNew}
                style={{ background: "#1AB4B8", color: "#fff", opacity: savingNew ? 0.6 : 1 }}
              >
                {savingNew ? "Salvo…" : "Salva"}
              </button>
              <button className="px-2 py-1 border rounded hover:bg-gray-50" onClick={cancelDraft}>
                Annulla
              </button>
            </td>
          </tr>
        )}

        {/* Righe esistenti */}
        {data.length === 0 && !draft ? (
          <tr>
            <td className="px-3 py-3 text-gray-500" colSpan={showDateColumn ? 14 : 13}> {/* Adjusted colspan */}
              Nessuna riga.
            </td>
          </tr>
        ) : (
          data.map((r) => {
            const isEditing = editing.has(r.id);
            const timeText = hhmm(r.entry_time); // HH:mm in lettura e per WhatsApp

            return (
              <tr key={r.id} className={r.venduto ? "bg-green-50" : ""}>
                {showDateColumn && (
                  <td className="px-3 py-2">
                    {String(r.entry_date).split("-").reverse().join("-")}
                  </td>
                )}

                {/* ORA: testo fuori da Modifica, editor in Modifica */}
                <td className="px-3 py-2">
                  {isEditing ? (
                    <EditableTime
                      id={r.id}
                      value={timeText}
                      onChangeHHmm={(val) => handleTimeChanged(r.id, val)} // 👈 aggiorna stato locale
                    />
                  ) : (
                    timeText
                  )}
                </td>

                <td className="px-3 py-2">
                  {isEditing ? <EditableCell id={r.id} field="nome" value={r.nome} /> : (r.nome ?? "")}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? <EditableCell id={r.id} field="cognome" value={r.cognome} /> : (r.cognome ?? "")}
                </td>

                <td className="px-3 py-2">
                  {isEditing ? <EditablePhone id={r.id} value={r.telefono} /> : (r.telefono ?? "")}
                </td>

                <td className="px-3 py-2">{r.consulente_name ?? ""}</td>

                <td className="px-3 py-2">
                  {isEditing ? <EditableCell id={r.id} field="fonte" value={r.fonte} /> : (r.fonte ?? "")}
                </td>

                <td className="px-3 py-2"><input type="checkbox" checked={!!r.comeback} readOnly /></td>
                <td className="px-3 py-2">{r.tipo_abbonamento_name ?? ""}</td>

                <td className="px-3 py-2">
                  <EditableCheckboxXor id={r.id} field="presentato" value={!!r.presentato} otherField="miss" otherValue={!!r.miss} />
                </td>

                <td className="px-3 py-2">
                  <EditableCheckboxXor id={r.id} field="miss" value={!!r.miss} otherField="venduto" otherValue={!!r.venduto} />
                </td>

                <td className="px-3 py-2">
                  {isEditing ? <EditableCell id={r.id} field="note" value={r.note} /> : (r.note ?? "")}
                </td>

                <td className="px-3 py-2">
                  {/* Contattato */}
                  <EditableCheckboxXor id={r.id} field="contattato" value={!!r.contattato} />
                </td>

                <td className="px-3 py-2">
                  {/* Negativo */}
                  <EditableCheckboxXor id={r.id} field="negativo" value={!!r.negativo} />
                </td>

                <td className="px-3 py-2">
                  <EditableCheckboxXor id={r.id} field="venduto" value={!!r.venduto} otherField="miss" otherValue={!!r.miss} />
                </td>

                <td className="px-3 py-2 whitespace-nowrap flex gap-2">
                  <button className="px-2 py-1 border rounded hover:bg-gray-50" onClick={() => toggleEdit(r.id)}>
                    {isEditing ? "Fine" : "Modifica"}
                  </button>
                  <RowActions
                    id={r.id}
                    telefono={r.telefono}
                    nome={r.nome}
                    consulente_name={r.consulente_name}
                    entry_date={r.entry_date}
                    entry_time={timeText} // HH:mm aggiornato grazie al callback
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );
}

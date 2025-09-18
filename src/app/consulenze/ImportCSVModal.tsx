// src/app/consulenze/ImportCsvModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  gestioneId: string;
  onClose: () => void;
  onImported: (summary: { inserted: number; skipped: number }) => void;
};

type Mapping = Record<string, string>; // CSV header -> target field

const TARGET_FIELDS = [
  { key: "nome", label: "NOME" },
  { key: "cognome", label: "COGNOME" },
  { key: "telefono", label: "TELEFONO" },
  { key: "scadenza", label: "SCADENZA (YYYY-MM-DD)" },
  { key: "tipo_abbonamento_corrente", label: "TIPO ABB." },
  { key: "contattato", label: "CONTATTATO (flag)" },
  { key: "preso_appuntamento", label: "PRESO APP. (flag)" },
  { key: "consulenza_fatta", label: "CONS. FATTA (flag)" },
  { key: "data_consulenza", label: "DATA CONSULENZA (YYYY-MM-DD)" },
  { key: "esito", label: "ESITO (ISCRIZIONE|RINNOVO|INTEGRAZIONE|IN ATTESA|NEGATIVO)" },
  { key: "nuovo_abbonamento_name", label: "NUOVO ABBONAMENTO (nome)" },
  { key: "data_risposta", label: "DATA RISPOSTA (YYYY-MM-DD)" },
  { key: "note", label: "NOTE" },
] as const;

export default function ImportCsvModal({ gestioneId, onClose, onImported }: Props) {
  const [fileName, setFileName] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [saveDefaultMapping, setSaveDefaultMapping] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carica mapping di default dalla gestione (se esiste)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/consulenze/gestioni");
        const j = await res.json();
        const g = (j.rows || []).find((x: any) => x.id === gestioneId);
        if (g?.csv_mapping_default && typeof g.csv_mapping_default === "object") {
          setMapping(g.csv_mapping_default);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [gestioneId]);

  // Lettura file
  const onPickFile = async (f: File) => {
    setErr("");
    setFileName(f.name);
    const text = await f.text();
    setCsvText(text);
    // parsing veloce client per preview (server farà parsing robusto)
    const { headers: hh, rows: rr } = quickParseForPreview(text);
    setHeaders(hh);
    setRows(rr.slice(0, 50)); // preview prime 50
    // Se non ho una mapping, prova autoguida per columns simili
    if (Object.keys(mapping).length === 0) {
      const auto: Mapping = {};
      for (const h of hh) {
        const norm = h.trim().toLowerCase();
        if (norm.includes("nome")) auto[h] = "nome";
        else if (norm.includes("cogn")) auto[h] = "cognome";
        else if (norm.includes("tel")) auto[h] = "telefono";
        else if (norm.includes("scad")) auto[h] = "scadenza";
        else if (norm.includes("tipo") || norm.includes("abb")) auto[h] = "tipo_abbonamento_corrente";
        else if (norm.includes("contatt")) auto[h] = "contattato";
        else if (norm.includes("appunt")) auto[h] = "preso_appuntamento";
        else if (norm.includes("consul")) {
          if (norm.includes("data")) auto[h] = "data_consulenza";
          else auto[h] = "consulenza_fatta";
        } else if (norm.includes("esito")) auto[h] = "esito";
        else if (norm.includes("nuovo") || norm.includes("abbon")) auto[h] = "nuovo_abbonamento_name";
        else if (norm.includes("risp")) auto[h] = "data_risposta";
        else if (norm.includes("note")) auto[h] = "note";
      }
      setMapping(auto);
    }
  };

  const setMap = (csvHeader: string, target: string) => {
    setMapping((m) => ({ ...m, [csvHeader]: target }));
  };

  const mappedTargetsUsed = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping]);

  const submit = async () => {
    if (!csvText || headers.length === 0) {
      setErr("Seleziona un CSV valido.");
      return;
    }
    setLoading(true); setErr("");
    try {
      // invio come FormData (csvText + mapping + options)
      const fd = new FormData();
      fd.append("gestione_id", gestioneId);
      fd.append("csv_text", csvText);
      fd.append("mapping_json", JSON.stringify(mapping || {}));
      fd.append("save_mapping_default", saveDefaultMapping ? "1" : "0");
      fd.append("skip_duplicates", skipDuplicates ? "1" : "0");

      const res = await fetch("/api/consulenze/import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Errore import");
      onImported({ inserted: j.inserted || 0, skipped: j.skipped || 0 });
      onClose();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[min(1000px,96vw)] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-lg font-semibold">Importa CSV</div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-auto">
          {/* Upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            <div className="text-slate-600 text-sm">{fileName}</div>
          </div>

          {/* Mappatura */}
          {headers.length > 0 && (
            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b font-medium">Mappatura colonne</div>
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <div className="w-1/2">
                        <div className="text-xs text-slate-500">Colonna CSV</div>
                        <div className="font-medium truncate" title={h}>{h}</div>
                      </div>
                      <div className="w-1/2">
                        <div className="text-xs text-slate-500">Campo destinazione</div>
                        <select
                          className="input w-full"
                          value={mapping[h] || ""}
                          onChange={(e) => setMap(h, e.target.value)}
                        >
                          <option value="">— ignora —</option>
                          {TARGET_FIELDS.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-col md:flex-row md:items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={saveDefaultMapping}
                      onChange={(e) => setSaveDefaultMapping(e.target.checked)}
                    />
                    <span className="text-sm">Salva come mappatura predefinita per questa gestione</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                    />
                    <span className="text-sm">Salta duplicati per TELEFONO nella stessa gestione</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b font-medium">Anteprima (prime {rows.length} righe)</div>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      {headers.map((h) => (
                        <th key={h} className="py-2 px-2 border-b text-left whitespace-nowrap">
                          {h}
                          {mapping[h] ? (
                            <span className="ml-2 text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1 py-[1px] rounded">
                              {mapping[h]}
                            </span>
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t">
                        {r.map((c, j) => (
                          <td key={j} className="px-2 py-1.5 align-top">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {err && <div className="text-red-600">{err}</div>}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Campi mappabili: {Array.from(mappedTargetsUsed).join(", ") || "— nessuno —"}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button className="btn" disabled={!csvText || loading} onClick={submit}>
              {loading ? "Import in corso…" : "Importa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Parser super-rapido per preview lato client (comma/semicolon) */
function quickParseForPreview(text: string): { headers: string[]; rows: string[][] } {
  // tenta delimitatore ; poi ,
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length) || "";
  const delim = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0], delim);
  const rows = lines.slice(1).map((ln) => splitCsvLine(ln, delim));
  return { headers, rows };
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if (!inQuotes && ch === delim) {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
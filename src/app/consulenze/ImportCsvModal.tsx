// src/app/consulenze/ImportCsvModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  gestioneId: string;
  onClose: () => void;
  onImported: (summary: { inserted: number; skipped: number }) => void;
};

type Mapping = Record<string, string>; // CSV header -> target field

const TARGET_FIELDS = [
  { key: "nome", label: "Nome" },
  { key: "cognome", label: "Cognome" },
  { key: "telefono", label: "Telefono" },
  { key: "scadenza", label: "Scadenza (YYYY-MM-DD)" },
  { key: "tipo_abbonamento_corrente", label: "Tipo Abbonamento" },
  { key: "contattato", label: "Contattato (flag)" },
  { key: "preso_appuntamento", label: "Preso App. (flag)" },
  { key: "consulenza_fatta", label: "Cons. Fatta (flag)" },
  { key: "data_consulenza", label: "Data Consulenza" },
  { key: "esito", label: "Esito" },
  { key: "nuovo_abbonamento_name", label: "Nuovo Abbonamento" },
  { key: "data_risposta", label: "Data Risposta" },
  { key: "note", label: "Note" },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Importa CSV</h2>
              <p className="text-sm text-slate-500">Carica un file per aggiungere nuove consulenze</p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">

          {/* Upload Section */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer group",
              fileName ? "border-emerald-300 bg-emerald-50/30" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            <div className="flex flex-col items-center gap-3">
              {fileName ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{fileName}</div>
                    <div className="text-sm text-emerald-600 font-medium">File caricato con successo</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Clicca per caricare</div>
                    <div className="text-sm text-slate-500">o trascina il file CSV qui</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {headers.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

              {/* Mapping Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">1</span>
                    Mappatura Colonne
                  </h3>
                  <div className="text-xs text-slate-500">
                    {mappedTargetsUsed.size} campi collegati
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {headers.map((h, i) => (
                    <div key={`${i}-${h}`} className={cn(
                      "p-3 rounded-lg border transition-all",
                      mapping[h] ? "bg-indigo-50/30 border-indigo-200" : "bg-slate-50 border-slate-200 opacity-70"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate max-w-[120px]" title={h}>
                          {h}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </div>
                      <select
                        className={cn(
                          "w-full text-sm rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-1.5",
                          mapping[h] ? "text-indigo-900 font-medium" : "text-slate-500"
                        )}
                        value={mapping[h] || ""}
                        onChange={(e) => setMap(h, e.target.value)}
                      >
                        <option value="">Ignora</option>
                        {TARGET_FIELDS.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={saveDefaultMapping}
                      onChange={(e) => setSaveDefaultMapping(e.target.checked)}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">Salva come mappatura predefinita</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">Salta duplicati (per telefono)</span>
                  </label>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">2</span>
                    Anteprima Dati
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={`${i}-${h}`} className="py-3 px-4 font-semibold text-slate-600 border-b whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span>{h}</span>
                              {mapping[h] && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] w-fit">
                                  {TARGET_FIELDS.find(t => t.key === mapping[h])?.label}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {r.map((c, j) => (
                            <td key={j} className="px-4 py-2.5 text-slate-600 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {err && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 animate-in shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{err}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!csvText || loading}
            onClick={submit}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importazione...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importa Dati
              </>
            )}
          </button>
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
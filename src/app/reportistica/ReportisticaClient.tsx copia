// src/app/reportistica/ReportisticaClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ReportRow = {
  id: string;
  entry_date: string;        // YYYY-MM-DD
  entry_time: string | null; // HH:MM:SS
  section: string;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  miss?: boolean | null;
  venduto?: boolean | null;
  presentato?: boolean | null;
  consulente?: { name?: string } | null;
  tipo_abbonamento?: { name?: string } | null;
};

type ReportMeta = {
  options: {
    sezioni: string[];
    consulenti: string[];
    tipi_abbonamento: string[];
  };
  kpi: {
    totale: number;
    presentati: number;
    venduti: number;
    miss: number;
  };
};

type ReportResponse = {
  rows: ReportRow[];
  meta: ReportMeta;
};

const SEZIONI_PRESET = [
  "TOUR SPONTANEI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ReportisticaClient() {
  // --- FILTRI ---
  const [modePeriodo, setModePeriodo] = useState<"giorno" | "periodo">("giorno");
  const [date, setDate] = useState<string>(toISO(new Date()));
  const [from, setFrom] = useState<string>(toISO(new Date()));
  const [to, setTo] = useState<string>(toISO(new Date()));

  // Multi selezione
  const [sezioni, setSezioni] = useState<string[]>([]);
  const [consulenti, setConsulenti] = useState<string[]>([]);
  const [tipi, setTipi] = useState<string[]>([]);

  // Booleani a doppio checkbox (Sì/No)
  const [presentatoYes, setPresentatoYes] = useState(false);
  const [presentatoNo, setPresentatoNo] = useState(false);
  const [vendutoYes, setVendutoYes] = useState(false);
  const [vendutoNo, setVendutoNo] = useState(false);
  const [missYes, setMissYes] = useState(false);
  const [missNo, setMissNo] = useState(false);

  // --- DATI ---
  const [loading, setLoading] = useState<boolean>(false);
  const [resp, setResp] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string>("");

  // Opzioni dropdown (arrivano dall'API)
  const optsSezioni = useMemo(() => {
    const o = new Set<string>([...SEZIONI_PRESET, ...(resp?.meta?.options?.sezioni ?? [])]);
    return Array.from(o);
  }, [resp]);
  const optsConsulenti = resp?.meta?.options?.consulenti ?? [];
  const optsTipi = resp?.meta?.options?.tipi_abbonamento ?? [];

  // Costruzione querystring con array (append multipli)
  const buildParams = () => {
    const p = new URLSearchParams();
    p.set("format", "json");
    if (modePeriodo === "giorno") p.set("date", date);
    else {
      p.set("from", from);
      p.set("to", to);
    }
    sezioni.forEach((s) => p.append("section", s));
    consulenti.forEach((c) => p.append("consulente", c));
    tipi.forEach((t) => p.append("tipo_abbonamento", t));

    // Booleani: nessuna selezione -> nessun filtro; entrambe selezioni -> nessun filtro
    const pushBool = (yes: boolean, no: boolean, key: string) => {
      if (yes && !no) p.append(key, "true");
      else if (!yes && no) p.append(key, "false");
      // yes && no  => no filter
      // !yes && !no => no filter
    };
    pushBool(presentatoYes, presentatoNo, "presentato");
    pushBool(vendutoYes, vendutoNo, "venduto");
    pushBool(missYes, missNo, "miss");

    return p;
  };

  // Debounce fetch (realtime)
  useEffect(() => {
    const p = buildParams();
    setLoading(true);
    setError("");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/report?${p.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Errore API (${res.status})`);
        const j: ReportResponse = await res.json();
        setResp(j);
      } catch (e: any) {
        setError(String(e?.message || e));
        setResp(null);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modePeriodo,
    date,
    from,
    to,
    JSON.stringify(sezioni),
    JSON.stringify(consulenti),
    JSON.stringify(tipi),
    presentatoYes,
    presentatoNo,
    vendutoYes,
    vendutoNo,
    missYes,
    missNo,
  ]);

  // Helpers UI
  const toggleIn = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    if (arr.includes(val)) setArr(arr.filter((x) => x !== val));
    else setArr([...arr, val]);
  };

  const pdfHref = useMemo(() => {
    const p = buildParams();
    p.set("format", "pdf");
    return `/api/report?${p.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modePeriodo,
    date,
    from,
    to,
    JSON.stringify(sezioni),
    JSON.stringify(consulenti),
    JSON.stringify(tipi),
    presentatoYes,
    presentatoNo,
    vendutoYes,
    vendutoNo,
    missYes,
    missNo,
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* FILTRI */}
      <aside className="lg:col-span-1">
        <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
          <h2 className="text-lg font-semibold">Filtri</h2>

          {/* Data / Periodo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ambito</label>
            <div className="flex gap-2">
              <button
                className={`btn ${modePeriodo === "giorno" ? "btn-brand" : "btn-ghost"}`}
                onClick={() => setModePeriodo("giorno")}
              >
                Giorno
              </button>
              <button
                className={`btn ${modePeriodo === "periodo" ? "btn-brand" : "btn-ghost"}`}
                onClick={() => setModePeriodo("periodo")}
              >
                Periodo
              </button>
            </div>

            {modePeriodo === "giorno" ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
                <span className="text-slate-500 text-sm">→</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
              </div>
            )}
          </div>

          {/* Sezioni (checkbox multi) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sezioni</label>
              <button
                className="text-xs text-slate-500 hover:underline"
                onClick={() => setSezioni([])}
                title="Azzera"
              >
                Azzera
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {optsSezioni.map((s) => (
                <label key={s} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sezioni.includes(s)}
                    onChange={() => toggleIn(sezioni, setSezioni, s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Consulenti (checkbox multi) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Consulenti</label>
              <button className="text-xs text-slate-500 hover:underline" onClick={() => setConsulenti([])}>
                Azzera
              </button>
            </div>
            <div className="max-h-56 overflow-auto pr-1 grid grid-cols-1 gap-2">
              {optsConsulenti.map((c) => (
                <label key={c} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consulenti.includes(c)}
                    onChange={() => toggleIn(consulenti, setConsulenti, c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipologie abbonamento (checkbox multi) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tipologia abbonamento</label>
              <button className="text-xs text-slate-500 hover:underline" onClick={() => setTipi([])}>
                Azzera
              </button>
            </div>
            <div className="max-h-56 overflow-auto pr-1 grid grid-cols-1 gap-2">
              {optsTipi.map((t) => (
                <label key={t} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tipi.includes(t)}
                    onChange={() => toggleIn(tipi, setTipi, t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Booleani (Sì/No combinabili) */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Presentato</div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={presentatoYes} onChange={(e) => setPresentatoYes(e.target.checked)} />
                  <span>Sì</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={presentatoNo} onChange={(e) => setPresentatoNo(e.target.checked)} />
                  <span>No</span>
                </label>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Venduto</div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={vendutoYes} onChange={(e) => setVendutoYes(e.target.checked)} />
                  <span>Sì</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={vendutoNo} onChange={(e) => setVendutoNo(e.target.checked)} />
                  <span>No</span>
                </label>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Miss</div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={missYes} onChange={(e) => setMissYes(e.target.checked)} />
                  <span>Sì</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={missNo} onChange={(e) => setMissNo(e.target.checked)} />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex gap-2 pt-2">
            <a className="btn btn-ghost" href={pdfHref} target="_blank" rel="noreferrer">
              Esporta PDF
            </a>
          </div>
        </div>
      </aside>

      {/* RISULTATI */}
      <section className="lg:col-span-3">
        <div className="rounded-xl border bg-white shadow-sm p-4">
          {error ? (
            <div className="text-red-600">{error}</div>
          ) : loading ? (
            <div className="text-slate-500">Caricamento in corso…</div>
          ) : (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-slate-500">Totale</div>
                  <div className="text-xl font-semibold">{resp?.meta?.kpi?.totale ?? 0}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-slate-500">Presentati</div>
                  <div className="text-xl font-semibold">{resp?.meta?.kpi?.presentati ?? 0}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-slate-500">Venduti</div>
                  <div className="text-xl font-semibold">{resp?.meta?.kpi?.venduti ?? 0}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-slate-500">Miss</div>
                  <div className="text-xl font-semibold">{resp?.meta?.kpi?.miss ?? 0}</div>
                </div>
              </div>

              {/* TABELLA */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-3">Data</th>
                      <th className="py-2 pr-3">Ora</th>
                      <th className="py-2 pr-3">Sezione</th>
                      <th className="py-2 pr-3">Nome</th>
                      <th className="py-2 pr-3">Cognome</th>
                      <th className="py-2 pr-3">Telefono</th>
                      <th className="py-2 pr-3">Consulente</th>
                      <th className="py-2 pr-3">Tipo Abb.</th>
                      <th className="py-2 pr-3">Presentato</th>
                      <th className="py-2 pr-3">Venduto</th>
                      <th className="py-2 pr-3">Miss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resp?.rows?.length ? (
                      resp.rows.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="py-2 pr-3">{r.entry_date}</td>
                          <td className="py-2 pr-3">{r.entry_time ? r.entry_time.slice(0, 5) : ""}</td>
                          <td className="py-2 pr-3">{r.section}</td>
                          <td className="py-2 pr-3">{r.nome ?? ""}</td>
                          <td className="py-2 pr-3">{r.cognome ?? ""}</td>
                          <td className="py-2 pr-3">{r.telefono ?? ""}</td>
                          <td className="py-2 pr-3">{r.consulente?.name ?? ""}</td>
                          <td className="py-2 pr-3">{r.tipo_abbonamento?.name ?? ""}</td>
                          <td className="py-2 pr-3">{r.presentato ? "Sì" : ""}</td>
                          <td className="py-2 pr-3">{r.venduto ? "Sì" : ""}</td>
                          <td className="py-2 pr-3">{r.miss ? "Sì" : ""}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-500">
                          Nessun risultato con i filtri correnti.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
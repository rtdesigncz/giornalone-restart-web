"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AnyObj = Record<string, any>;
type Opt = { id: string; label: string; sort_order?: number };

const lbl = (o: AnyObj) => (o?.name ?? o?.nome ?? "") as string;

export default function TopbarFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL params
  const scope = sp.get("scope") ?? "day";
  const date = sp.get("date") ?? new Date().toISOString().slice(0, 10);
  const from = sp.get("from") ?? date;
  const to = sp.get("to") ?? date;
  const q = sp.get("q") ?? "";
  const consulente = sp.get("consulente") ?? "";
  const tipo = sp.get("tipo") ?? "";
  const miss = sp.get("miss") === "1";
  const venduto = sp.get("venduto") === "1";

  // dati per select (ordinati per sort_order)
  const [consulenti, setConsulenti] = useState<Opt[]>([]);
  const [tipi, setTipi] = useState<Opt[]>([]);

  // UI: pannello filtri espandibile
  const [open, setOpen] = useState(false);
  const [qLocal, setQLocal] = useState(q);

  useEffect(() => {
    (async () => {
      const [{ data: cData }, { data: tData }] = await Promise.all([
        supabase.from("consulenti").select("*"),
        supabase.from("tipi_abbonamento").select("*"),
      ]);
      const cs = (cData ?? [])
        .map((x: AnyObj) => ({ id: x.id, label: lbl(x), sort_order: Number(x.sort_order ?? 0) }))
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            a.label.localeCompare(b.label, "it", { sensitivity: "base" })
        );
      const ts = (tData ?? [])
        .map((x: AnyObj) => ({ id: x.id, label: lbl(x), sort_order: Number(x.sort_order ?? 0) }))
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            a.label.localeCompare(b.label, "it", { sensitivity: "base" })
        );
      setConsulenti(cs);
      setTipi(ts);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    });
    router.push(`${pathname}?${next.toString()}`);
  }

  function resetAll() {
    router.push(pathname);
    setQLocal("");
  }

  function setScope(nextScope: "day" | "month" | "year" | "range") {
    if (nextScope === "day") {
      // usa 'date' singola
      apply({ scope: "day", date, from: undefined, to: undefined });
    } else if (nextScope === "month") {
      const d = new Date(date);
      const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      apply({ scope: "month", date: first, from: first, to: last });
    } else if (nextScope === "year") {
      const d = new Date(date);
      const first = new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const last = new Date(d.getFullYear(), 11, 31).toISOString().slice(0, 10);
      apply({ scope: "year", date: first, from: first, to: last });
    } else {
      // intervallo libero
      apply({ scope: "range", date: undefined, from, to });
    }
  }

  // Header compatto: scope + selettore data per "Giorno" (richiesta tua)
  return (
    <div className="card p-4">
      {/* riga compatta superiore */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <button
            className={`btn ${scope === "day" ? "btn-brand" : "btn-ghost"}`}
            onClick={() => setScope("day")}
          >
            Giorno
          </button>
          <button
            className={`btn ${scope === "month" ? "btn-brand" : "btn-ghost"}`}
            onClick={() => setScope("month")}
          >
            Mese
          </button>
          <button
            className={`btn ${scope === "year" ? "btn-brand" : "btn-ghost"}`}
            onClick={() => setScope("year")}
          >
            Anno
          </button>
          <button
            className={`btn ${scope === "range" ? "btn-brand" : "btn-ghost"}`}
            onClick={() => setScope("range")}
          >
            Intervallo
          </button>
        </div>

        {/* Selettore data rapido nello scope (solo per Giorno, come richiesto) */}
        {scope === "day" && (
          <div>
            <label className="text-[12px] text-slate-500 block">Data</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => apply({ date: e.target.value })}
            />
          </div>
        )}

        {/* Toggle filtri espandibili */}
        <div className="ml-auto">
          <button
            className="btn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="filters-panel"
          >
            {open ? "Nascondi filtri" : "Mostra filtri"}
          </button>
        </div>
      </div>

      {/* pannello espandibile */}
      {open && (
        <div id="filters-panel" className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Se non sei in Giorno, mostro Da/A qui */}
            {scope !== "day" ? (
              <>
                <div>
                  <label className="text-[12px] text-slate-500 block">Da</label>
                  <input
                    type="date"
                    className="input"
                    value={from}
                    onChange={(e) => apply({ from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-500 block">A</label>
                  <input
                    type="date"
                    className="input"
                    value={to}
                    onChange={(e) => apply({ to: e.target.value })}
                  />
                </div>
              </>
            ) : null}

            <div className="grow min-w-[220px]">
              <label className="text-[12px] text-slate-500 block">Ricerca</label>
              <input
                className="input"
                placeholder="nome, cognome, telefono, note…"
                value={qLocal}
                onChange={(e) => {
                  const v = e.target.value;
                  setQLocal(v);
                  const snapshot = v;
                  // debounce 300ms
                  setTimeout(() => {
                    if (snapshot === v) apply({ q: snapshot || undefined });
                  }, 300);
                }}
              />
            </div>

            <div>
              <label className="text-[12px] text-slate-500 block">Consulente</label>
              <select
                className="select"
                value={consulente}
                onChange={(e) => apply({ consulente: e.target.value || undefined })}
              >
                <option value="">Tutti</option>
                {consulenti.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] text-slate-500 block">Tipo</label>
              <select
                className="select"
                value={tipo}
                onChange={(e) => apply({ tipo: e.target.value || undefined })}
              >
                <option value="">Tutti</option>
                {tipi.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="check-lg"
                  checked={miss}
                  onChange={(e) => apply({ miss: e.target.checked ? "1" : undefined })}
                />
                <span>Miss</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="check-lg"
                  checked={venduto}
                  onChange={(e) => apply({ venduto: e.target.checked ? "1" : undefined })}
                />
                <span>Venduto</span>
              </label>

              <button className="btn" onClick={resetAll}>
                Reset filtri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
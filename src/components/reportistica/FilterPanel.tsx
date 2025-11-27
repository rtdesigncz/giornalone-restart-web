// src/components/FiltersBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Option = { id: string; name: string };

export default function FiltersBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const [consulenti, setConsulenti] = useState<Option[]>([]);
  const [tipi, setTipi] = useState<Option[]>([]);

  const scope = sp.get("scope") ?? "day";
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    scope,
    date: sp.get("date") ?? today,
    month: (sp.get("date") ?? today).slice(0, 7),
    year: (sp.get("date") ?? today).slice(0, 4),
    from: sp.get("from") ?? today,
    to: sp.get("to") ?? today,
    q: sp.get("q") ?? "",
    consulente: sp.get("consulente") ?? "",
    tipo: sp.get("tipo") ?? "",
    miss: sp.get("miss") === "1",
  });

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("consulenti").select("id,name").order("name");
      setConsulenti((c ?? []) as Option[]);
      const { data: t } = await supabase.from("tipi_abbonamento").select("id,name").eq("active", true).order("name");
      setTipi((t ?? []) as Option[]);
    })();
  }, []);

  const onApply = () => {
    const params = new URLSearchParams();
    params.set("scope", form.scope);
    if (form.scope === "day") {
      params.set("date", form.date);
    } else if (form.scope === "month") {
      params.set("date", form.month + "-01");
    } else if (form.scope === "year") {
      params.set("date", form.year + "-01-01");
    } else {
      params.set("from", form.from);
      params.set("to", form.to);
    }
    if (form.q) params.set("q", form.q);
    if (form.consulente) params.set("consulente", form.consulente);
    if (form.tipo) params.set("tipo", form.tipo);
    if (form.miss) params.set("miss", "1");
    router.push("/?" + params.toString());
  };

  const onReset = () => {
    router.push("/?scope=day&date=" + today);
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm text-slate-500">Filtri</span>
      </div>

      <div className="filters-grid">
        <div className="filters-col-2">
          <label className="label">Periodo</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
          >
            <option value="day">Giorno</option>
            <option value="month">Mese</option>
            <option value="year">Anno</option>
            <option value="range">Intervallo</option>
          </select>
        </div>

        {form.scope === "day" && (
          <div className="filters-col-2">
            <label className="label">Data</label>
            <input type="date" className="border rounded px-2 py-2 w-full" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        )}

        {form.scope === "month" && (
          <div className="filters-col-2">
            <label className="label">Mese</label>
            <input type="month" className="border rounded px-2 py-2 w-full" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
          </div>
        )}

        {form.scope === "year" && (
          <div className="filters-col-2">
            <label className="label">Anno</label>
            <input type="number" min="2000" max="2100" className="border rounded px-2 py-2 w-full"
              value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </div>
        )}

        {form.scope === "range" && (
          <>
            <div className="filters-col-2">
              <label className="label">Da</label>
              <input type="date" className="border rounded px-2 py-2 w-full" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            </div>
            <div className="filters-col-2">
              <label className="label">A</label>
              <input type="date" className="border rounded px-2 py-2 w-full" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            </div>
          </>
        )}

        <div className="filters-col-3">
          <label className="label">Ricerca</label>
          <input placeholder="Cognome, telefono, note…" className="border rounded px-2 py-2 w-full"
            value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} />
        </div>

        <div className="filters-col-2">
          <label className="label">Consulente</label>
          <select className="border rounded px-2 py-2 w-full" value={form.consulente} onChange={(e) => setForm({ ...form, consulente: e.target.value })}>
            <option value="">—</option>
            {consulenti.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="filters-col-2">
          <label className="label">Tipo abbonamento</label>
          <select className="border rounded px-2 py-2 w-full" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="">—</option>
            {tipi.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="filters-col-2">
          <label className="label">Solo Miss</label>
          <div className="border rounded px-2 py-2">
            <input type="checkbox" checked={form.miss} onChange={(e) => setForm({ ...form, miss: e.target.checked })} /> <span className="ml-1">Miss</span>
          </div>
        </div>

        <div className="filters-col-12 flex items-center justify-end gap-2 mt-2">
          <button className="btn btn-ghost" onClick={onReset}>Reset</button>
          <button className="btn btn-brand" onClick={onApply}>Applica</button>
        </div>
      </div>
    </div>
  );
}
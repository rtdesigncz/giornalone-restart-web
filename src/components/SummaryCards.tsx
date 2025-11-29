"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Summary = {
  base: { tour_spontanei: number; miss: number; assente: number; venduti_total: number };
  tipi: { tipo_id: string | null; tipo_nome: string; quanti: number }[];
};

function fmtISO(d: Date) { return d.toISOString().slice(0, 10); }
function monthRange(anchorISO: string) { const d = new Date(anchorISO); return { from: fmtISO(new Date(d.getFullYear(), d.getMonth(), 1)), to: fmtISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }; }
function yearRange(anchorISO: string) { const d = new Date(anchorISO); return { from: fmtISO(new Date(d.getFullYear(), 0, 1)), to: fmtISO(new Date(d.getFullYear(), 11, 31)) }; }

function normalizeSummaryPayload(data: any): Summary {
  let obj = data;
  if (Array.isArray(obj)) obj = obj[0] ?? null;
  if (obj && typeof obj === "object" && "entries_summary" in obj) obj = (obj as any).entries_summary;
  if (!obj || !obj.base) return { base: { tour_spontanei: 0, miss: 0, assente: 0, venduti_total: 0 }, tipi: [] };
  return obj as Summary;
}

async function fetchRPC(from: string, to: string, filters: Record<string, any>): Promise<Summary> {
  const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/entries_summary`);
  const body = {
    from_date: from,
    to_date: to,
    consulente: filters.consulente || null,
    tipo: filters.tipo || null,
    q: filters.q || null,
    miss_only: filters.miss === "1",
    venduto_only: filters.venduto === "1",
  };
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = await res.json();
  return normalizeSummaryPayload(json);
}

type AnyObj = Record<string, any>;
const lbl = (o?: AnyObj | null) => ((o?.name ?? o?.nome ?? "") as string);

async function fetchEntriesClient(from: string, to: string, filters: Record<string, any>) {
  let qy = supabase
    .from("entries")
    .select(`
      *,
      consulente:consulenti (*),
      tipo_abbonamento:tipi_abbonamento (*)
    `)
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: true });

  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    qy = qy.or(`nome.ilike.${like},cognome.ilike.${like},telefono.ilike.${like},fonte.ilike.${like},note.ilike.${like}`);
  }
  if (filters.consulente) qy = qy.eq("consulente_id", filters.consulente);
  if (filters.tipo) qy = qy.eq("tipo_abbonamento_id", filters.tipo);
  if (filters.miss === "1") qy = qy.eq("miss", true);
  if (filters.venduto === "1") qy = qy.eq("venduto", true);

  const { data, error } = await qy;
  if (error) throw error;
  return (data ?? []) as AnyObj[];
}

function summarizeClient(rows: AnyObj[]): Summary {
  const tour = rows.filter(r => r.section === "TOUR SPONTANEI").length;
  const miss = rows.filter(r => r.miss === true).length;
  const assente = rows.filter(r => r.assente === true).length;
  const vend = rows.filter(r => r.venduto === true).length;

  const vendRows = rows.filter(r => r.venduto === true);
  const by: Record<string, { tipo_id: string | null; tipo_nome: string; quanti: number }> = {};
  for (const r of vendRows) {
    const id = r.tipo_abbonamento_id ?? null;
    const name = lbl(r.tipo_abbonamento) || "—";
    const key = `${id ?? "null"}|${name}`;
    if (!by[key]) by[key] = { tipo_id: id, tipo_nome: name, quanti: 0 };
    by[key].quanti += 1;
  }
  const tipi = Object.values(by).sort((a, b) => a.tipo_nome.localeCompare(b.tipo_nome, "it", { sensitivity: "base" }));
  return { base: { tour_spontanei: tour, miss, assente, venduti_total: vend }, tipi };
}

export default function SummaryCards() {
  const sp = useSearchParams();

  const date = sp?.get("date") ?? fmtISO(new Date());
  const from = sp?.get("from") ?? date;
  const to = sp?.get("to") ?? date;

  const filters = useMemo(() => ({
    q: sp?.get("q") ?? "",
    consulente: sp?.get("consulente") ?? "",
    tipo: sp?.get("tipo") ?? "",
    miss: sp?.get("miss") ?? "",
    venduto: sp?.get("venduto") ?? "",
  }), [sp]);

  const [daily, setDaily] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Summary | null>(null);
  const [yearly, setYearly] = useState<Summary | null>(null);
  const [open, setOpen] = useState({ day: false, month: false, year: false });
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const rerun = useCallback(async () => {
    try {
      setLoading(true);
      const dayFrom = date, dayTo = date;
      const m = monthRange(date);
      const y = yearRange(date);

      const [dRpc, mRpc, yRpc] = await Promise.all([
        fetchRPC(dayFrom, dayTo, filters).catch(() => null),
        fetchRPC(m.from, m.to, filters).catch(() => null),
        fetchRPC(y.from, y.to, filters).catch(() => null),
      ]);

      const needD = !dRpc || (dRpc.base.tour_spontanei === 0 && dRpc.base.miss === 0 && dRpc.base.venduti_total === 0);
      const needM = !mRpc || (mRpc.base.tour_spontanei === 0 && mRpc.base.miss === 0 && mRpc.base.venduti_total === 0);
      const needY = !yRpc || (yRpc.base.tour_spontanei === 0 && yRpc.base.miss === 0 && yRpc.base.venduti_total === 0);

      const [dRows, mRows, yRows] = await Promise.all([
        needD ? fetchEntriesClient(dayFrom, dayTo, filters).catch(() => []) : Promise.resolve([]),
        needM ? fetchEntriesClient(m.from, m.to, filters).catch(() => []) : Promise.resolve([]),
        needY ? fetchEntriesClient(y.from, y.to, filters).catch(() => []) : Promise.resolve([]),
      ]);

      const dFinal = dRpc ?? (needD ? summarizeClient(dRows) : null);
      const mFinal = mRpc ?? (needM ? summarizeClient(mRows) : null);
      const yFinal = yRpc ?? (needY ? summarizeClient(yRows) : null);

      setDaily(dFinal);
      setMonthly(mFinal);
      setYearly(yFinal);
    } finally {
      setLoading(false);
    }
  }, [date, filters]);

  // Primo fetch e refetch su cambi parametri
  useEffect(() => { rerun(); }, [rerun, from, to]);

  // 🔴 Realtime: ascolta modifiche su entries e rifetch con debounce
  useEffect(() => {
    const channel = supabase
      .channel("summaries-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "entries" },
        () => {
          // debounce 300ms per raggruppare eventi multipli
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => { rerun(); }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [rerun]);

  const Card = ({ title, data, isOpen, onToggle }: { title: string; data: Summary | null; isOpen: boolean; onToggle: () => void; }) => (
    <div className="card p-5 w-full transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</div>
          {loading ? (
            <div className="mt-2"><span className="spinner-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span></div>
          ) : (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Tour</span>
                <span className="text-2xl font-bold text-slate-700">{data?.base?.tour_spontanei ?? 0}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Miss</span>
                <span className="text-2xl font-bold text-rose-500">{data?.base?.miss ?? 0}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Assente</span>
                <span className="text-2xl font-bold text-orange-500">{data?.base?.assente ?? 0}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Venduti</span>
                <span className="text-2xl font-bold text-brand">{data?.base?.venduti_total ?? 0}</span>
              </div>
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-xs rounded-full" onClick={onToggle}>{isOpen ? "Chiudi" : "Dettaglio"}</button>
      </div>

      {isOpen && !loading && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Vendite per tipologia</div>
          {data && data.tipi && data.tipi.length > 0 ? (
            <ul className="space-y-2">
              {data.tipi.map(t => (
                <li key={`${t.tipo_id}-${t.tipo_nome}`} className="text-sm flex justify-between items-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700 font-medium">{t.tipo_nome}</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs font-bold text-slate-600">{t.quanti}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400 italic">Nessun venduto nel periodo.</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card title="Riepilogo Giornaliero" data={daily} isOpen={open.day} onToggle={() => setOpen(s => ({ ...s, day: !s.day }))} />
      <Card title="Riepilogo Mensile" data={monthly} isOpen={open.month} onToggle={() => setOpen(s => ({ ...s, month: !s.month }))} />
      <Card title="Riepilogo Annuale" data={yearly} isOpen={open.year} onToggle={() => setOpen(s => ({ ...s, year: !s.year }))} />
    </div>
  );
}
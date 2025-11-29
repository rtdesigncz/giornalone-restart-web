// src/components/SummariesRow.tsx
import { supabase } from "../lib/supabaseClient";

async function getDaily(filters: {
  date: string; q: string; consulente: string; tipo: string; miss: boolean;
}) {
  let q = supabase.from("entries_v").select("*").eq("entry_date", filters.date);
  if (filters.consulente) q = q.eq("consulente_id", filters.consulente);
  if (filters.tipo) q = q.eq("tipo_abbonamento_id", filters.tipo);
  if (filters.miss) q = q.eq("miss", true);
  if (filters.q) {
    const like = `%${filters.q}%`;
    q = q.or(`nome.ilike.${like},cognome.ilike.${like},telefono.ilike.${like},fonte.ilike.${like},note.ilike.${like}`);
  }
  const { data, error } = await q;
  if (error) return { error, rows: [] as any[] };
  return { error: null, rows: (data ?? []) as any[] };
}
async function getMonthly(dateISO: string) {
  const monthStart = dateISO.slice(0, 7) + "-01";
  const { data: baseArr } = await supabase.from("monthly_overview").select("*").eq("month_start", monthStart).limit(1);
  const base = baseArr?.[0] ?? null;
  const { data: tipis } = await supabase.from("monthly_venduti_per_tipo").select("*").eq("month_start", monthStart).order("tipo_abbonamento_name");
  return { base, tipis: tipis ?? [] };
}
async function getAnnual(dateISO: string) {
  const yearStart = dateISO.slice(0, 4) + "-01-01";
  const { data: baseArr } = await supabase.from("annual_overview").select("*").eq("year_start", yearStart).limit(1);
  const base = baseArr?.[0] ?? null;
  const { data: tipis } = await supabase.from("annual_venduti_per_tipo").select("*").eq("year_start", yearStart).order("tipo_abbonamento_name");
  return { base, tipis: tipis ?? [] };
}

export default async function SummariesRow({
  dateISO, filters,
}: { dateISO: string; filters: { date: string; q: string; consulente: string; tipo: string; miss: boolean } }) {
  const [{ error, rows }, monthly, annual] = await Promise.all([
    getDaily(filters), getMonthly(dateISO), getAnnual(dateISO),
  ]);
  if (error) return <section><pre className="text-red-600">Errore riepilogo: {error.message}</pre></section>;

  const tourSpontanei = rows.filter((r) => r.section === "TOUR SPONTANEI").length;
  const missCount = rows.filter((r) => r.miss).length;
  const vendutiTotal = rows.filter((r) => r.venduto).length;
  const perTipo = new Map<string, number>();
  rows.filter((r) => r.venduto).forEach((r) => {
    const key = r.tipo_abbonamento_name ?? "(Senza tipo)";
    perTipo.set(key, (perTipo.get(key) ?? 0) + 1);
  });

  const Card = ({ title, body }: { title: string; body: React.ReactNode }) => (
    <details className="card p-4" open>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-2 text-sm leading-6">{body}</div>
    </details>
  );

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Riepilogo Giornaliero"
          body={
            <>
              <div>Tour Spontanei: <b>{tourSpontanei}</b></div>
              <div>Miss: <b>{missCount}</b></div>
              <div>Assente: <b>{rows.filter((r) => r.assente).length}</b></div>
              <div>Venduti (totale): <b>{vendutiTotal}</b></div>
              <div className="mt-2"><b>Venduti per tipologia</b></div>
              {perTipo.size === 0 ? <div>Nessun venduto.</div> : (
                <ul className="list-disc ml-4">
                  {[...perTipo.entries()].map(([k, v]) => <li key={k}>{k}: <b>{v}</b></li>)}
                </ul>
              )}
            </>
          }
        />
        <Card
          title="Riepilogo Mensile"
          body={
            <>
              <div>Tour Spontanei: <b>{monthly.base?.tour_spontanei_count ?? 0}</b></div>
              <div>Miss: <b>{monthly.base?.miss_count ?? 0}</b></div>
              <div>Venduti (totale): <b>{monthly.base?.venduti_total ?? 0}</b></div>
              <div className="mt-2"><b>Abbonamenti venduti per tipologia</b></div>
              {monthly.tipis.length === 0 ? <div>Nessun venduto.</div> : (
                <ul className="list-disc ml-4">
                  {monthly.tipis.map((r: any) => (
                    <li key={r.tipo_abbonamento_id}>{r.tipo_abbonamento_name ?? "(Senza tipo)"}: <b>{r.venduti}</b></li>
                  ))}
                </ul>
              )}
            </>
          }
        />
        <Card
          title="Riepilogo Annuale"
          body={
            <>
              <div>Tour Spontanei: <b>{annual.base?.tour_spontanei_count ?? 0}</b></div>
              <div>Miss: <b>{annual.base?.miss_count ?? 0}</b></div>
              <div>Venduti (totale): <b>{annual.base?.venduti_total ?? 0}</b></div>
              <div className="mt-2"><b>Abbonamenti venduti per tipologia</b></div>
              {annual.tipis.length === 0 ? <div>Nessun venduto.</div> : (
                <ul className="list-disc ml-4">
                  {annual.tipis.map((r: any) => (
                    <li key={r.tipo_abbonamento_id}>{r.tipo_abbonamento_name ?? "(Senza tipo)"}: <b>{r.venduti}</b></li>
                  ))}
                </ul>
              )}
            </>
          }
        />
      </div>
    </section>
  );
}
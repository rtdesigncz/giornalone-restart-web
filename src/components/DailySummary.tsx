import { supabase } from "../lib/supabaseClient";

export default async function DailySummary({
  filters,
}: {
  filters: { date: string; q: string; consulente: string; tipo: string; miss: boolean };
}) {
  let query = supabase
    .from("entries_v")
    .select("*")
    .eq("entry_date", filters.date);

  if (filters.consulente) query = query.eq("consulente_id", filters.consulente);
  if (filters.tipo)       query = query.eq("tipo_abbonamento_id", filters.tipo);
  if (filters.miss)       query = query.eq("miss", true);
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(
      `nome.ilike.${like},cognome.ilike.${like},telefono.ilike.${like},fonte.ilike.${like},note.ilike.${like}`
    );
  }

  const { data, error } = await query;
  if (error) return <pre className="mx-auto max-w-[1400px] px-4">Errore riepilogo: {error.message}</pre>;
  const rows = (data ?? []) as any[];

  const tourSpontanei = rows.filter((r) => r.section === "TOUR SPONTANEI").length;
  const missCount = rows.filter((r) => r.miss).length;
  const vendutiTotal = rows.filter((r) => r.venduto).length;

  const perTipo = new Map<string, number>();
  rows.filter((r) => r.venduto).forEach((r) => {
    const key = r.tipo_abbonamento_name ?? "(Senza tipo)";
    perTipo.set(key, (perTipo.get(key) ?? 0) + 1);
  });

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <details className="rounded-lg border bg-white p-3" open>
          <summary className="cursor-pointer font-semibold">Riepilogo Giornaliero</summary>
          <div className="mt-2 text-sm leading-6">
            <div>Tour Spontanei: <b>{tourSpontanei}</b></div>
            <div>Miss: <b>{missCount}</b></div>
            <div>Venduti (totale): <b>{vendutiTotal}</b></div>
            <div className="mt-2"><b>Venduti per tipologia</b></div>
            {perTipo.size === 0 ? (
              <div>Nessun venduto.</div>
            ) : (
              <ul className="list-disc ml-4">
                {[...perTipo.entries()].map(([k, v]) => (
                  <li key={k}>{k}: <b>{v}</b></li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}

import { supabase } from "../lib/supabaseClient";

async function getMonthly(dateISO: string) {
  const monthStart = dateISO.slice(0, 7) + "-01";
  const { data: baseArr } = await supabase
    .from("monthly_overview")
    .select("*")
    .eq("month_start", monthStart)
    .limit(1);
  const base = (baseArr && baseArr.length > 0) ? baseArr[0] : null;

  const { data: tipis } = await supabase
    .from("monthly_venduti_per_tipo")
    .select("*")
    .eq("month_start", monthStart)
    .order("tipo_abbonamento_name");

  return { base, tipis };
}

async function getAnnual(dateISO: string) {
  const yearStart = dateISO.slice(0, 4) + "-01-01";
  const { data: baseArr } = await supabase
    .from("annual_overview")
    .select("*")
    .eq("year_start", yearStart)
    .limit(1);
  const base = (baseArr && baseArr.length > 0) ? baseArr[0] : null;

  const { data: tipis } = await supabase
    .from("annual_venduti_per_tipo")
    .select("*")
    .eq("year_start", yearStart)
    .order("tipo_abbonamento_name");

  return { base, tipis };
}

export default async function SummaryPanels({ dateISO }: { dateISO: string }) {
  const [{ base: mBase, tipis: mTipi }, { base: aBase, tipis: aTipi }] =
    await Promise.all([getMonthly(dateISO), getAnnual(dateISO)]);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Spazio riservato alla card giornaliera (già resa da DailySummary) */}
        <div className="hidden md:block" />

        <details className="rounded-lg border bg-white p-3">
          <summary className="cursor-pointer font-semibold">Riepilogo Mensile</summary>
          <div className="mt-2 text-sm leading-6">
            <div>Tour Spontanei: <b>{mBase?.tour_spontanei_count ?? 0}</b></div>
            <div>Miss: <b>{mBase?.miss_count ?? 0}</b></div>
            <div>Venduti (totale): <b>{mBase?.venduti_total ?? 0}</b></div>
            <div className="mt-2"><b>Abbonamenti venduti per tipologia</b></div>
            {(mTipi?.length ?? 0) === 0 ? (
              <div>Nessun venduto.</div>
            ) : (
              <ul className="list-disc ml-4">
                {mTipi!.map((r: any) => (
                  <li key={r.tipo_abbonamento_id}>
                    {r.tipo_abbonamento_name ?? "(Senza tipo)"}: <b>{r.venduti}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        <details className="rounded-lg border bg-white p-3">
          <summary className="cursor-pointer font-semibold">Riepilogo Annuale</summary>
          <div className="mt-2 text-sm leading-6">
            <div>Tour Spontanei: <b>{aBase?.tour_spontanei_count ?? 0}</b></div>
            <div>Miss: <b>{aBase?.miss_count ?? 0}</b></div>
            <div>Venduti (totale): <b>{aBase?.venduti_total ?? 0}</b></div>
            <div className="mt-2"><b>Abbonamenti venduti per tipologia</b></div>
            {(aTipi?.length ?? 0) === 0 ? (
              <div>Nessun venduto.</div>
            ) : (
              <ul className="list-disc ml-4">
                {aTipi!.map((r: any) => (
                  <li key={r.tipo_abbonamento_id}>
                    {r.tipo_abbonamento_name ?? "(Senza tipo)"}: <b>{r.venduti}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}

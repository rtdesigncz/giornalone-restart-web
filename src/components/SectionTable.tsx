// src/components/SectionTable.tsx
import { supabase } from "../lib/supabaseClient";
import PaginationBar from "./PaginationBar";
import RowsClient from "./RowsClient";
import MobileRowsClient from "./MobileRowsClient";
import AddRowTrigger from "./AddRowTrigger";

type Filters = {
  scope: "day" | "month" | "year" | "range";
  date: string; from: string; to: string;
  q: string; consulente: string; tipo: string; miss: boolean;
  page: number; limit: number;
};

type Props = { section: string; filters: Filters };

function monthBounds(iso: string) { const d = new Date(iso); const y = d.getUTCFullYear(), m = d.getUTCMonth(); return { from: new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10), to: new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10) } }
function yearBounds(iso: string) { const y = new Date(iso).getUTCFullYear(); return { from: `${y}-01-01`, to: `${y}-12-31` } }

export default async function SectionTable({ section, filters }: Props) {
  let rangeFrom = filters.from, rangeTo = filters.to;
  if (filters.scope === "day") { rangeFrom = filters.date; rangeTo = filters.date }
  else if (filters.scope === "month") { const { from, to } = monthBounds(filters.date); rangeFrom = from; rangeTo = to }
  else if (filters.scope === "year") { const { from, to } = yearBounds(filters.date); rangeFrom = from; rangeTo = to }

  const offset = (filters.page - 1) * filters.limit;

  let base = supabase.from("entries_v").select([
    "id", "entry_date", "entry_time", "section", "nome", "cognome", "telefono",
    "consulente_id", "consulente_name", "tipo_abbonamento_id", "tipo_abbonamento_name",
    "fonte", "comeback", "miss", "note", "venduto", "presentato", "contattato", "negativo"
  ].join(", "), { count: "exact" })
    .gte("entry_date", rangeFrom).lte("entry_date", rangeTo).eq("section", section);

  if (filters.consulente) base = base.eq("consulente_id", filters.consulente);
  if (filters.tipo) base = base.eq("tipo_abbonamento_id", filters.tipo);
  if (filters.miss) base = base.eq("miss", true);
  if (filters.q) { const like = `%${filters.q}%`; base = base.or(`nome.ilike.${like},cognome.ilike.${like},telefono.ilike.${like},fonte.ilike.${like},note.ilike.${like}`) }

  const { data, error, count } = await base
    .order("entry_date", { ascending: true })
    .order("entry_time", { ascending: true })
    .range(offset, offset + filters.limit - 1);

  const rows = (data ?? []) as any[];
  const showDateColumn = filters.scope !== "day";
  const total = count ?? rows.length;
  const isDay = filters.scope === "day";
  const selectedDate = filters.date;

  return (
    <section className="border rounded-lg overflow-hidden">
      {/* Header sezione brand */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3" style={{ background: "#1AB4B8", color: "white" }}>
        <h2 className="text-lg font-semibold">{section}</h2>
        <AddRowTrigger section={section} isDay={isDay} />
      </div>

      <div className="bg-white">
        {error ? (
          <div className="p-4 text-red-600">Errore: {error.message}</div>
        ) : (
          <>
            {total > filters.limit && (
              <div className="px-4 lg:px-6 pt-4">
                <PaginationBar total={total} limit={filters.limit} page={filters.page} />
              </div>
            )}

            {/* Desktop table */}
            <div className="px-2 lg:px-4 pb-4 hidden md:block">
              <table className="w-full table-fixed table-flat">
                <colgroup>
                  {showDateColumn && <col className="w-[8%]" />}
                  <col className="w-[6%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[5%]" />
                  <col className="w-[10%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                  <col className="w-[10%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr>
                    {showDateColumn && <th>Data</th>}
                    <th>Ora</th>
                    <th>Nome</th>
                    <th>Cognome</th>
                    <th>Telefono</th>
                    <th>Consulente</th>
                    <th>Fonte</th>
                    <th>C.Back</th>
                    <th>Tipo Abb.</th>
                    <th>Pres.</th>
                    <th>Miss</th>
                    <th>Note</th>
                    <th>Cont.</th>
                    <th>Neg.</th>
                    <th>Vend.</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <RowsClient
                  section={section}
                  rows={rows}
                  showDateColumn={showDateColumn}
                  isDay={isDay}
                  selectedDate={selectedDate}
                />
              </table>
            </div>

            {/* Mobile cards */}
            <div className="px-3 pb-4 md:hidden">
              <MobileRowsClient
                section={section}
                rows={rows}
                showDateColumn={showDateColumn}
                isDay={isDay}
                selectedDate={selectedDate}
              />
            </div>

            {total > filters.limit && (
              <div className="px-4 lg:px-6 pb-4">
                <PaginationBar total={total} limit={filters.limit} page={filters.page} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
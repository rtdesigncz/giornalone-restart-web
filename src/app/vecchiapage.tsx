import Header from "@/components/Header";
import FiltersBar from "@/components/FiltersBar";
import DailySummary from "@/components/DailySummary";
import SectionTable from "@/components/SectionTable";
import SummaryPanels from "@/components/SummaryPanels";
import AddRow from "@/components/AddRow";

type PageProps = {
  searchParams?: {
    scope?: "day" | "month" | "year" | "range";
    date?: string;
    from?: string;
    to?: string;
    q?: string;
    consulente?: string;
    tipo?: string;
    miss?: string; // "1" => true
    page?: string; // pagina per la paginazione
  };
};

export default async function Home({ searchParams }: PageProps) {
  const scope = (searchParams?.scope as any) ?? "day";
  const date  = searchParams?.date ?? new Date().toISOString().slice(0,10);
  const from  = searchParams?.from ?? date;
  const to    = searchParams?.to   ?? date;
  const q     = searchParams?.q ?? "";
  const consulente = searchParams?.consulente ?? "";
  const tipo       = searchParams?.tipo ?? "";
  const miss       = searchParams?.miss === "1";
  const page       = Math.max(1, parseInt(searchParams?.page ?? "1", 10));
  const limit      = 50;

  const filters = { scope, date, from, to, q, consulente, tipo, miss, page, limit };

  return (
    <>
      <Header />
      <main className="container-app py-6">
        <FiltersBar />
        <DailySummary filters={{ date, q, consulente, tipo, miss }} />
        <SummaryPanels dateISO={date} />

        {/* Form di aggiunta riga (visibile solo su Giorno) */}
        <AddRow section="TOUR SPONTANEI" />
        <SectionTable section="TOUR SPONTANEI" filters={filters} />

        <AddRow section="APPUNTAMENTI RINNOVI E INTEGRAZIONI" />
        <SectionTable section="APPUNTAMENTI RINNOVI E INTEGRAZIONI" filters={filters} />

        <AddRow section="APPUNTAMENTI (Pianificazione)" />
        <SectionTable section="APPUNTAMENTI (Pianificazione)" filters={filters} />

        <AddRow section="APPUNTAMENTI VERIFICHE DEL BISOGNO" />
        <SectionTable section="APPUNTAMENTI VERIFICHE DEL BISOGNO" filters={filters} />
      </main>
    </>
  );
}

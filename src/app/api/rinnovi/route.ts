// src/app/api/rinnovi/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getMonthBounds(monthStr: string) {
  // monthStr is format "YYYY-MM" (e.g. "2026-11")
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export async function GET(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const mese = (searchParams.get("mese") || defaultMonth).trim();
    const q = (searchParams.get("q") || "").trim();
    const esitoFilter = searchParams.get("esito") || "ALL"; // ALL, RINNOVO, INTEGRAZIONE, IN_ATTESA, NEGATIVO, DA_CONTATTARE, PRESO_APPUNTAMENTO
    const disciplinaFilter = searchParams.get("disciplina") || "ALL";

    const { startDate, endDate } = getMonthBounds(mese);

    // 1. Auto-seed / sync clients expiring in this month into rinnovi_items if not already present
    const { data: expiringClients, error: expErr } = await supabase
      .from("clients")
      .select("id, cognome, nome, telefono, email, pacchetto_originale, disciplina, data_scadenza, prezzo")
      .gte("data_scadenza", startDate)
      .lte("data_scadenza", endDate);

    if (expErr) throw expErr;

    if (expiringClients && expiringClients.length > 0) {
      // Find which ones already exist in rinnovi_items for this month
      const { data: existingItems } = await supabase
        .from("rinnovi_items")
        .select("client_id")
        .eq("mese_riferimento", mese);

      const existingClientIds = new Set((existingItems || []).map((x: any) => x.client_id));

      const toInsert = expiringClients
        .filter((c: any) => !existingClientIds.has(c.id))
        .map((c: any) => ({
          client_id: c.id,
          mese_riferimento: mese,
          scadenza_originaria: c.data_scadenza,
          abbonamento_originario: c.pacchetto_originale,
          disciplina: c.disciplina || "ALTRO",
          prezzo_originario: c.prezzo || 0,
          contattato: false,
          preso_appuntamento: false,
          consulenza_fatta: false,
        }));

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("rinnovi_items").insert(toInsert);
        if (insErr) console.error("Error auto-inserting rinnovi_items:", insErr);
      }
    }

    // 2. Fetch all rinnovi_items for this month
    const { data: items, error: itemsErr } = await supabase
      .from("rinnovi_items")
      .select(`
        *,
        client:clients (
          id, nome, cognome, telefono, email, data_nascita, stato, data_scadenza, ultimo_accesso, accessi_effettuati
        )
      `)
      .eq("mese_riferimento", mese)
      .order("scadenza_originaria", { ascending: true });

    if (itemsErr) throw itemsErr;

    // 3. Real-time enrichment from entries (Agenda)
    const clientIds = (items || []).map((it: any) => it.client_id).filter(Boolean);
    const entriesByClient = new Map<string, any>();

    if (clientIds.length > 0) {
      // Fetch entries for these clients, especially from APPUNTAMENTI RINNOVI E INTEGRAZIONI or matching month
      const { data: agendaEntries } = await supabase
        .from("entries")
        .select(`
          id, entry_date, entry_time, section, venduto, presentato, assente, miss, note,
          client_id,
          consulente:consulenti(name),
          tipo_abbonamento:tipi_abbonamento(name)
        `)
        .in("client_id", clientIds)
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false });

      (agendaEntries || []).forEach((e: any) => {
        if (!entriesByClient.has(e.client_id)) {
          entriesByClient.set(e.client_id, e);
        }
      });
    }

    // 4. Enrich and calculate live states
    const enrichedList = (items || []).map((it: any) => {
      const agenda = entriesByClient.get(it.client_id);
      let presoApp = it.preso_appuntamento;
      let consulenzaFatta = it.consulenza_fatta;
      let esito = it.esito;
      let nuovoAbb = it.nuovo_abbonamento_name;
      let assente = false;

      if (agenda) {
        presoApp = true;
        if (agenda.presentato || agenda.venduto) consulenzaFatta = true;
        if (agenda.assente) assente = true;

        if (!esito) {
          if (agenda.venduto) {
            esito = "RINNOVO";
            nuovoAbb = agenda.tipo_abbonamento?.name || "Rinnovato";
          } else if (agenda.miss) {
            esito = "IN ATTESA";
          }
        }
      }

      return {
        ...it,
        preso_appuntamento: presoApp,
        consulenza_fatta: consulenzaFatta,
        esito,
        nuovo_abbonamento_name: nuovoAbb,
        assente,
        agenda_entry: agenda
          ? {
              id: agenda.id,
              date: agenda.entry_date,
              time: agenda.entry_time,
              consulente_name: agenda.consulente?.name || null,
              section: agenda.section,
              venduto: agenda.venduto,
              presentato: agenda.presentato,
              assente: agenda.assente,
              miss: agenda.miss,
              note: agenda.note,
            }
          : null,
      };
    });

    // 5. Filter list by search query and dropdown filters
    let filtered = enrichedList;

    if (q) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((it: any) => {
        const c = it.client;
        if (!c) return false;
        const text = `${c.cognome || ""} ${c.nome || ""} ${c.telefono || ""} ${c.email || ""}`.toLowerCase();
        return words.every((w: string) => text.includes(w));
      });
    }

    if (disciplinaFilter && disciplinaFilter !== "ALL") {
      filtered = filtered.filter((it: any) => (it.disciplina || "").toUpperCase() === disciplinaFilter.toUpperCase());
    }

    if (esitoFilter && esitoFilter !== "ALL") {
      if (esitoFilter === "DA_CONTATTARE") {
        filtered = filtered.filter((it: any) => !it.contattato && !it.preso_appuntamento && !it.esito);
      } else if (esitoFilter === "PRESO_APPUNTAMENTO") {
        filtered = filtered.filter((it: any) => it.preso_appuntamento && !it.esito);
      } else if (esitoFilter === "CONSULENZA_FATTA") {
        filtered = filtered.filter((it: any) => it.consulenza_fatta);
      } else {
        filtered = filtered.filter((it: any) => (it.esito || "").toUpperCase() === esitoFilter.toUpperCase());
      }
    }

    // 6. Compute KPI summary for the entire month (unfiltered)
    const total = enrichedList.length;
    const contattati = enrichedList.filter((x: any) => x.contattato || x.preso_appuntamento || x.esito).length;
    const appuntamenti = enrichedList.filter((x: any) => x.preso_appuntamento).length;
    const consulenze = enrichedList.filter((x: any) => x.consulenza_fatta).length;
    const rinnovati = enrichedList.filter((x: any) => x.esito === "RINNOVO").length;
    const integrazioni = enrichedList.filter((x: any) => x.esito === "INTEGRAZIONE").length;
    const inAttesa = enrichedList.filter((x: any) => x.esito === "IN ATTESA").length;
    const negativi = enrichedList.filter((x: any) => x.esito === "NEGATIVO").length;
    const tassoChiusura = consulenze > 0 ? Math.round((rinnovati / consulenze) * 100) : 0;

    // 7. Get available months list from database (all months where clients expire + past months)
    const { data: monthsData } = await supabase
      .from("clients")
      .select("data_scadenza")
      .not("data_scadenza", "is", null)
      .order("data_scadenza", { ascending: true });

    const availableMonthsSet = new Set<string>();
    (monthsData || []).forEach((row: any) => {
      if (row.data_scadenza && row.data_scadenza.length >= 7) {
        availableMonthsSet.add(row.data_scadenza.slice(0, 7));
      }
    });
    // Ensure current month and next month are included
    availableMonthsSet.add(defaultMonth);

    const availableMonths = Array.from(availableMonthsSet).sort();

    return NextResponse.json({
      mese,
      items: filtered,
      counts: {
        total,
        contattati,
        appuntamenti,
        consulenze,
        rinnovati,
        integrazioni,
        inAttesa,
        negativi,
        tassoChiusura,
      },
      availableMonths,
    });
  } catch (err: any) {
    console.error("Error in GET /api/rinnovi:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

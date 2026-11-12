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

  // Time window for renewal appointments: from 45 days before the month starts to 30 days after month ends
  const wStart = new Date(Date.UTC(y, m - 1, 1 - 45)).toISOString().slice(0, 10);
  const wEnd = new Date(Date.UTC(y, m, 30)).toISOString().slice(0, 10);

  return { startDate, endDate, wStart, wEnd };
}

export async function GET(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const mese = (searchParams.get("mese") || defaultMonth).trim();
    const q = (searchParams.get("q") || "").trim();
    const filtro = searchParams.get("filtro") || "ALL"; // ALL, DA_CONTATTARE, CONTATTATI, APP_DA_FISSARE, APP_DA_FARE, CONSULENZE_FATTE, RINNOVO, INTEGRAZIONE, IN ATTESA, NEGATIVO
    const disciplinaFilter = searchParams.get("disciplina") || "ALL";
    const motivoFilter = searchParams.get("motivo") || "ALL";

    const { startDate, endDate, wStart, wEnd } = getMonthBounds(mese);

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
          id, nome, cognome, telefono, email, data_nascita, stato, data_scadenza, ultimo_accesso, accessi_effettuati, pacchetto_originale, disciplina
        )
      `)
      .eq("mese_riferimento", mese)
      .order("scadenza_originaria", { ascending: true });

    if (itemsErr) throw itemsErr;

    // 3. Real-time enrichment from entries (Agenda)
    // ONLY match entries that belong to APPUNTAMENTI RINNOVI E INTEGRAZIONI within [wStart, wEnd]
    // OR matching explicit entry_id
    const clientIds = (items || []).map((it: any) => it.client_id).filter(Boolean);
    const explicitEntryIds = (items || []).map((it: any) => it.entry_id).filter(Boolean);
    const entriesByClient = new Map<string, any>();
    const entriesById = new Map<string, any>();

    if (clientIds.length > 0) {
      const { data: agendaEntries } = await supabase
        .from("entries")
        .select(`
          id, entry_date, entry_time, section, venduto, presentato, assente, miss, note,
          client_id,
          consulente:consulenti(name),
          tipo_abbonamento:tipi_abbonamento(name)
        `)
        .in("client_id", clientIds)
        .eq("section", "APPUNTAMENTI RINNOVI E INTEGRAZIONI")
        .gte("entry_date", wStart)
        .lte("entry_date", wEnd)
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false });

      (agendaEntries || []).forEach((e: any) => {
        if (!entriesByClient.has(e.client_id)) {
          entriesByClient.set(e.client_id, e);
        }
      });
    }

    if (explicitEntryIds.length > 0) {
      const { data: explicitEntries } = await supabase
        .from("entries")
        .select(`
          id, entry_date, entry_time, section, venduto, presentato, assente, miss, note,
          client_id,
          consulente:consulenti(name),
          tipo_abbonamento:tipi_abbonamento(name)
        `)
        .in("id", explicitEntryIds);

      (explicitEntries || []).forEach((e: any) => {
        entriesById.set(e.id, e);
      });
    }

    // 4. Enrich and calculate live states
    const enrichedList = (items || []).map((it: any) => {
      const agenda = (it.entry_id ? entriesById.get(it.entry_id) : null) || entriesByClient.get(it.client_id);
      
      let presoApp = !!it.preso_appuntamento || !!agenda;
      let consulenzaFatta = !!it.consulenza_fatta || (agenda ? (agenda.presentato || agenda.venduto) : false);
      let esito = it.esito || null;
      let nuovoAbb = it.nuovo_abbonamento_name || null;
      let assente = agenda ? !!agenda.assente : false;

      // Auto-sync esito from live agenda if not explicitly set manually
      if (!esito && agenda) {
        if (agenda.venduto) {
          esito = "RINNOVO";
          nuovoAbb = agenda.tipo_abbonamento?.name || "Rinnovato";
        } else if (agenda.miss) {
          esito = "IN ATTESA";
        }
      }

      // If appointment is taken or esito is set, contacted is logically true
      const contattato = !!it.contattato || presoApp || !!esito;

      return {
        ...it,
        contattato,
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

    // 5. Filter list by search query and category filters
    let filtered = enrichedList;

    if (q) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((it: any) => {
        const c = it.client;
        const text = `${c?.cognome || ""} ${c?.nome || ""} ${c?.telefono || ""} ${it.abbonamento_originario || ""} ${it.note || ""}`.toLowerCase();
        return words.every((w: string) => text.includes(w));
      });
    }

    if (disciplinaFilter && disciplinaFilter !== "ALL") {
      filtered = filtered.filter((it: any) => (it.disciplina || "").toUpperCase() === disciplinaFilter.toUpperCase());
    }

    if (motivoFilter && motivoFilter !== "ALL") {
      filtered = filtered.filter((it: any) => (it.motivo_negativo || "").toUpperCase() === motivoFilter.toUpperCase());
    }

    if (filtro && filtro !== "ALL") {
      switch (filtro) {
        case "DA_CONTATTARE":
          filtered = filtered.filter((it: any) => !it.contattato && !it.preso_appuntamento && !it.esito);
          break;
        case "CONTATTATI":
          filtered = filtered.filter((it: any) => it.contattato);
          break;
        case "APP_DA_FISSARE":
          filtered = filtered.filter((it: any) => it.contattato && !it.preso_appuntamento && !it.esito);
          break;
        case "APP_DA_FARE":
          filtered = filtered.filter((it: any) => it.preso_appuntamento && !it.consulenza_fatta && !it.esito);
          break;
        case "CONSULENZE_FATTE":
          filtered = filtered.filter((it: any) => it.consulenza_fatta);
          break;
        case "RINNOVO":
        case "INTEGRAZIONE":
        case "IN ATTESA":
        case "NEGATIVO":
          filtered = filtered.filter((it: any) => (it.esito || "").toUpperCase() === filtro.toUpperCase());
          break;
      }
    }

    // 6. Compute KPI summary for the entire month (unfiltered)
    const total = enrichedList.length;
    const contattati = enrichedList.filter((x: any) => x.contattato).length;
    const daContattare = enrichedList.filter((x: any) => !x.contattato && !x.preso_appuntamento && !x.esito).length;
    const appuntamentiDaFissare = enrichedList.filter((x: any) => x.contattato && !x.preso_appuntamento && !x.esito).length;
    const appuntamentiDaFare = enrichedList.filter((x: any) => x.preso_appuntamento && !x.consulenza_fatta && !x.esito).length;
    const appuntamentiTotali = enrichedList.filter((x: any) => x.preso_appuntamento).length;
    const consulenzeFatte = enrichedList.filter((x: any) => x.consulenza_fatta).length;
    const rinnovati = enrichedList.filter((x: any) => x.esito === "RINNOVO").length;
    const integrazioni = enrichedList.filter((x: any) => x.esito === "INTEGRAZIONE").length;
    const inAttesa = enrichedList.filter((x: any) => x.esito === "IN ATTESA").length;
    const negativi = enrichedList.filter((x: any) => x.esito === "NEGATIVO").length;
    const tassoChiusura = consulenzeFatte > 0 ? Math.round((rinnovati / consulenzeFatte) * 100) : 0;

    // Negativi reasons breakdown
    const motiviCounts: Record<string, number> = {};
    enrichedList
      .filter((x: any) => x.esito === "NEGATIVO")
      .forEach((x: any) => {
        const m = x.motivo_negativo || "NON SPECIFICATO";
        motiviCounts[m] = (motiviCounts[m] || 0) + 1;
      });

    // 7. Curated available months list
    // Get unique months from rinnovi_items + past 2 months + next 6 months
    const { data: dbMonths } = await supabase
      .from("rinnovi_items")
      .select("mese_riferimento");

    const monthsSet = new Set<string>();
    (dbMonths || []).forEach((r: any) => {
      if (r.mese_riferimento) monthsSet.add(r.mese_riferimento);
    });

    // Add reasonable window around today: -2 months to +6 months
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;
    for (let offset = -2; offset <= 6; offset++) {
      const d = new Date(Date.UTC(currYear, currMonth - 1 + offset, 1));
      const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthsSet.add(mStr);
    }

    const availableMonths = Array.from(monthsSet).sort();

    return NextResponse.json({
      mese,
      items: filtered,
      counts: {
        total,
        contattati,
        daContattare,
        appuntamentiDaFissare,
        appuntamentiDaFare,
        appuntamentiTotali,
        consulenzeFatte,
        rinnovati,
        integrazioni,
        inAttesa,
        negativi,
        tassoChiusura,
        motiviCounts,
      },
      availableMonths,
    });
  } catch (err: any) {
    console.error("GET /api/rinnovi error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// src/app/api/consulenze/kpi/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const url = new URL(req.url);
    const gestione = url.searchParams.get("gestione");
    if (!gestione) return NextResponse.json({ error: "gestione mancante" }, { status: 400 });

    const [ovr, es, ab] = await Promise.all([
      supabase.from("gestione_kpi_overview").select("*").eq("gestione_id", gestione).single(),
      supabase.from("gestione_kpi_esiti").select("*").eq("gestione_id", gestione),
      supabase.from("gestione_kpi_nuovi_abbonamenti").select("*").eq("gestione_id", gestione),
    ]);

    if (ovr.error && ovr.error.code !== "PGRST116") throw ovr.error; // PGRST116 = no rows
    if (es.error) throw es.error;
    if (ab.error) throw ab.error;

    return NextResponse.json({
      overview: ovr.data || {
        gestione_id: gestione,
        totale_clienti: 0,
        contattati: 0,
        preso_appuntamento: 0,
        consulenza_fatta: 0,
        consulenza_da_fare: 0,
      },
      esiti: es.data ?? [],
      nuovi_abbonamenti: ab.data ?? [],
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
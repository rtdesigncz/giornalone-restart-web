// src/app/api/clients/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const stato = searchParams.get("stato") || "ALL";
    const disciplina = searchParams.get("disciplina") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const sort = searchParams.get("sort") || "cognome";
    const order = searchParams.get("order") === "desc" ? false : true;

    // Fetch summary counts
    const [
      { count: totalCount },
      { count: attiviPureCount },
      { count: inScadenzaCount },
      { count: scadutiCount },
    ] = await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("stato", "ATTIVO"),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("stato", "IN_SCADENZA"),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("stato", "SCADUTO"),
    ]);

    // I clienti "in scadenza" hanno un abbonamento valido e sono a tutti gli effetti ATTIVI
    const attiviTotali = (attiviPureCount || 0) + (inScadenzaCount || 0);

    // Build main query
    let query = supabase
      .from("clients")
      .select("*, tipi_abbonamento(name)", { count: "exact" });

    if (stato && stato !== "ALL") {
      if (stato === "ATTIVO") {
        // Mostra tutti i clienti con abbonamento in corso di validità (inclusi quelli in scadenza)
        query = query.in("stato", ["ATTIVO", "IN_SCADENZA"]);
      } else {
        query = query.eq("stato", stato);
      }
    }

    if (disciplina && disciplina !== "ALL") {
      query = query.eq("disciplina", disciplina);
    }

    if (q) {
      // Support multi-word searches (e.g. "Claudia Foresta" or "Foresta Claudia")
      const words = q.trim().split(/\s+/).filter(Boolean);
      for (const w of words) {
        query = query.or(
          `cognome.ilike.%${w}%,nome.ilike.%${w}%,telefono.ilike.%${w}%,email.ilike.%${w}%`
        );
      }
    }

    // Sort & Pagination
    query = query
      .order(sort, { ascending: order })
      .order("nome", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      clients: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      counts: {
        total: totalCount || 0,
        attivi: attiviTotali,
        attivi_oltre_30: attiviPureCount || 0,
        in_scadenza: inScadenzaCount || 0,
        scaduti: scadutiCount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

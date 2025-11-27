// src/app/api/consulenze/items/route.ts
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

    const { data, error } = await supabase
      .from("gestione_items")
      .select("*")
      .eq("gestione_id", gestione)
      .order("updated_at", { ascending: false })
      .limit(5000); // eventuale paginazione futura
    if (error) throw error;
    return NextResponse.json({ rows: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const gestione_id = body?.gestione_id;
    if (!gestione_id) return NextResponse.json({ error: "gestione_id mancante" }, { status: 400 });
    const insert: any = {
      gestione_id,
      nome: body?.nome ?? null,
      cognome: body?.cognome ?? null,
      telefono: body?.telefono ?? null,
      scadenza: body?.scadenza ?? null,
      tipo_abbonamento_corrente: body?.tipo_abbonamento_corrente ?? null,
    };
    const { data, error } = await supabase
      .from("gestione_items")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ row: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
    const body = await req.json();

    // white-list campi aggiornabili
    const allowed = [
      "nome", "cognome", "telefono", "scadenza", "tipo_abbonamento_corrente",
      "contattato", "preso_appuntamento", "consulenza_fatta",
      "data_consulenza", "esito", "nuovo_abbonamento_name", "data_risposta",
      "note"
    ];
    const patch: any = {};
    for (const k of allowed) if (k in body) patch[k] = body[k];

    const { data, error } = await supabase
      .from("gestione_items")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ row: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
    const { error } = await supabase.from("gestione_items").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
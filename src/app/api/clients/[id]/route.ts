// src/app/api/clients/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID cliente mancante." }, { status: 400 });
    }

    // 1. Fetch client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*, tipi_abbonamento(name)")
      .eq("id", id)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: "Cliente non trovato." }, { status: 404 });
    }

    // 2. Fetch linked agenda entries
    const { data: entries, error: entriesErr } = await supabase
      .from("entries")
      .select("id, entry_date, entry_time, section, venduto, presentato, contattato, note, assente, comeback, miss, consulenti(nome)")
      .eq("client_id", id)
      .order("entry_date", { ascending: false })
      .order("entry_time", { ascending: false });

    // Also look for matching unlinked entries by phone or name
    let unlinkedMatches: any[] = [];
    if (client.telefono) {
      const { data: phoneEntries } = await supabase
        .from("entries")
        .select("id, entry_date, entry_time, section, venduto, presentato, contattato, note, assente, comeback, miss, consulenti(nome)")
        .is("client_id", null)
        .eq("telefono", client.telefono)
        .order("entry_date", { ascending: false });
      unlinkedMatches = phoneEntries || [];
    }

    const allEntries = [...(entries || []), ...unlinkedMatches];

    return NextResponse.json({
      client,
      entries: allEntries,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ["note", "email", "telefono", "telefono_secondario", "tags"];
    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nessun campo modificabile specificato." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, client: data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

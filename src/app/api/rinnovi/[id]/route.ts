// src/app/api/rinnovi/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID mancante." }, { status: 400 });

    const body = await req.json();
    const allowed = [
      "contattato",
      "preso_appuntamento",
      "consulenza_fatta",
      "data_consulenza",
      "entry_id",
      "esito",
      "nuovo_abbonamento_name",
      "motivo_negativo",
      "data_risposta",
      "note",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) {
      if (k in body) {
        updates[k] = body[k];
      }
    }

    const { data, error } = await supabase
      .from("rinnovi_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (err: any) {
    console.error("Error updating rinnovo item:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// src/app/api/settings/consulente/reorder/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    // Aggiorniamo una riga alla volta per evitare qualsiasi tentativo di INSERT.
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const { error } = await supabase
        .from("consulenti")
        .update({ sort_order: i + 1 })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: `Update failed on id=${id}: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
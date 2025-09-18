// src/app/api/consulenze/options/abbonamenti/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    // Fonte ufficiale: tipi_abbonamento (solo name)
    const { data, error } = await supabase
      .from("tipi_abbonamento")
      .select("name")
      .order("name", { ascending: true });
    if (error) throw error;
    const options = (data ?? []).map((x:any)=>x.name).filter(Boolean);
    return NextResponse.json({ options }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
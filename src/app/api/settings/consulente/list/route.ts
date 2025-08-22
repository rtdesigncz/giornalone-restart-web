import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;

const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
const lbl = (o: any) => (o?.name ?? o?.nome ?? "") as string;

export async function GET() {
  try {
    const { data, error } = await supabase.from("consulenti").select("*");
    if (error) throw error;

    // Ordina in memoria per sort_order poi per nome
    const items = (data ?? []).sort(
      (a: any, b: any) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        lbl(a).localeCompare(lbl(b), "it", { sensitivity: "base" })
    );

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
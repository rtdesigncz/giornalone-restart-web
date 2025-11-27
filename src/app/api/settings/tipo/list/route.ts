import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const lbl = (o: any) => (o?.name ?? o?.nome ?? "") as string;

export async function GET() {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const { data, error } = await supabase.from("tipi_abbonamento").select("*");
    if (error) throw error;

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
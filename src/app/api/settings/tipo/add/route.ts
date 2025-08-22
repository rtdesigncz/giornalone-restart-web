import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("tipi_abbonamento")
      .insert([{ name }])
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
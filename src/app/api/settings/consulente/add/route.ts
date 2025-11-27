import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const { name, email } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("consulenti")
      .insert([{ name, email: email || null }])
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
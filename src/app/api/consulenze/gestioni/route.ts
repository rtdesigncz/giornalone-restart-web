// src/app/api/consulenze/gestioni/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("gestioni")
    .select("id, nome, descrizione")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] }, { status: 200 });
}

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const nome = (body?.nome || "").trim();
    if (!nome) return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
    const { data, error } = await supabase
      .from("gestioni")
      .insert({ nome })
      .select("id, nome, descrizione")
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
    const patch: any = {};
    if (typeof body.nome === "string") patch.nome = body.nome;
    if (typeof body.descrizione === "string") patch.descrizione = body.descrizione;

    const { data, error } = await supabase
      .from("gestioni")
      .update(patch)
      .eq("id", id)
      .select("id, nome, descrizione")
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
    const { error } = await supabase.from("gestioni").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
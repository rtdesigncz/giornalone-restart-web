import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;

    const { error } = await supabase
      .from("tipi_abbonamento")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message) }, { status: 500 });
  }
}

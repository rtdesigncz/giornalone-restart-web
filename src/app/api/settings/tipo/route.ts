import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    if (name) {
      const { error } = await supabase.from("tipi_abbonamento").insert({ name, active: true });
      if (error) {
        console.error("Supabase insert error (tipo):", error.message);
      }
    }
    return NextResponse.redirect(new URL("/settings", req.url));
  } catch (e: any) {
    console.error("Route /api/settings/tipo error:", e?.message || e);
    return NextResponse.redirect(new URL("/settings", req.url));
  }
}

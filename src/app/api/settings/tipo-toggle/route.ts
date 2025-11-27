import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") || "");
    if (id) {
      const { data: cur, error: e1 } = await supabase
        .from("tipi_abbonamento")
        .select("active")
        .eq("id", id)
        .single();
      if (!e1) {
        const { error: e2 } = await supabase
          .from("tipi_abbonamento")
          .update({ active: !cur?.active })
          .eq("id", id);
        if (e2) console.error("Supabase update error (tipo-toggle):", e2.message);
      } else {
        console.error("Supabase select error (tipo-toggle):", e1.message);
      }
    }
    return NextResponse.redirect(new URL("/settings", req.url));
  } catch (e: any) {
    console.error("Route /api/settings/tipo-toggle error:", e?.message || e);
    return NextResponse.redirect(new URL("/settings", req.url));
  }
}

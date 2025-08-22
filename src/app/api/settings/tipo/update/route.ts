import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  const name = String(form.get("name") || "").trim();
  const activeStr = String(form.get("active") || "");
  const active = activeStr === "true" ? true : activeStr === "false" ? false : undefined;

  if (id) {
    const update: any = {};
    if (name) update.name = name;
    if (typeof active !== "undefined") update.active = active;
    if (Object.keys(update).length > 0) {
      await supabase.from("tipi_abbonamento").update(update).eq("id", id);
    }
  }
  return NextResponse.redirect(new URL("/settings", req.url));
}

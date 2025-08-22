import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  const name = String(form.get("name") || "").trim();
  if (id && name) {
    await supabase.from("consulenti").update({ name }).eq("id", id);
  }
  return NextResponse.redirect(new URL("/settings", req.url));
}

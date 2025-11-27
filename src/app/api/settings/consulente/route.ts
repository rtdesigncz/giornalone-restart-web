import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  if (name) {
    await supabase.from("consulenti").insert({ name });
  }
  return NextResponse.redirect(new URL("/settings", req.url));
}

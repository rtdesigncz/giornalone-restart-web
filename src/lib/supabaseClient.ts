// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ⚠️ Queste due env DEVONO iniziare con NEXT_PUBLIC_ perché servono al browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
}
if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
}

// Client per l'uso nel browser (TopbarFilters, page.tsx, ecc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
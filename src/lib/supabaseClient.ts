// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ⚠️ Queste due env DEVONO iniziare con NEXT_PUBLIC_ perché servono al browser
// Fallback for build time or if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pmjnmgehdmamyrlvqyeh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtam5tZ2VoZG1hbXlybHZxeWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTQ1OTEsImV4cCI6MjA3MTE3MDU5MX0.5dZJq-6jdeCupeuTxVrOj4rKixgG6fmHbWLoTMsrPqM";

console.log("DEBUG: supabaseUrl used:", supabaseUrl);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("WARNING: NEXT_PUBLIC_SUPABASE_URL is missing, using placeholder.");
}

// Client per l'uso nel browser (TopbarFilters, page.tsx, ecc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
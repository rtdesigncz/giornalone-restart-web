import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "present (hidden)"
      : "MISSING",
    SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SB_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "present (hidden)"
      : "MISSING",
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? "present (hidden)"
      : "MISSING",
    FROM_EMAIL: process.env.FROM_EMAIL,
  });
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
    try {
        const results = [];

        // 1. APPUNTAMENTI (Pianificazione) -> APPUNTAMENTI
        const { error: err1, count: count1 } = await supabase
            .from("entries")
            .update({ section: "APPUNTAMENTI" })
            .eq("section", "APPUNTAMENTI (Pianificazione)")
            .select("id", { count: "exact" });
        results.push({ from: "APPUNTAMENTI (Pianificazione)", to: "APPUNTAMENTI", count: count1, error: err1 });

        // 2. APPUNTAMENTI VERIFICHE DEL BISOGNO -> VERIFICHE DEL BISOGNO
        const { error: err2, count: count2 } = await supabase
            .from("entries")
            .update({ section: "VERIFICHE DEL BISOGNO" })
            .eq("section", "APPUNTAMENTI VERIFICHE DEL BISOGNO")
            .select("id", { count: "exact" });
        results.push({ from: "APPUNTAMENTI VERIFICHE DEL BISOGNO", to: "VERIFICHE DEL BISOGNO", count: count2, error: err2 });

        // 3. APPUNTAMENTI RINNOVI E INTEGRAZIONI -> RINNOVI/INTEGRAZIONI
        const { error: err3, count: count3 } = await supabase
            .from("entries")
            .update({ section: "RINNOVI/INTEGRAZIONI" })
            .eq("section", "APPUNTAMENTI RINNOVI E INTEGRAZIONI")
            .select("id", { count: "exact" });
        results.push({ from: "APPUNTAMENTI RINNOVI E INTEGRAZIONI", to: "RINNOVI/INTEGRAZIONI", count: count3, error: err3 });

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

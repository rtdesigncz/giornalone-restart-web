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
        const { data: data1, error: err1 } = await supabase
            .from("entries")
            .update({ section: "APPUNTAMENTI" })
            .eq("section", "APPUNTAMENTI (Pianificazione)")
            .select("id");
        results.push({ from: "APPUNTAMENTI (Pianificazione)", to: "APPUNTAMENTI", count: data1?.length ?? 0, error: err1 });

        // 2. APPUNTAMENTI VERIFICHE DEL BISOGNO -> VERIFICHE DEL BISOGNO
        const { data: data2, error: err2 } = await supabase
            .from("entries")
            .update({ section: "VERIFICHE DEL BISOGNO" })
            .eq("section", "APPUNTAMENTI VERIFICHE DEL BISOGNO")
            .select("id");
        results.push({ from: "APPUNTAMENTI VERIFICHE DEL BISOGNO", to: "VERIFICHE DEL BISOGNO", count: data2?.length ?? 0, error: err2 });

        // 3. APPUNTAMENTI RINNOVI E INTEGRAZIONI -> RINNOVI/INTEGRAZIONI
        const { data: data3, error: err3 } = await supabase
            .from("entries")
            .update({ section: "RINNOVI/INTEGRAZIONI" })
            .eq("section", "APPUNTAMENTI RINNOVI E INTEGRAZIONI")
            .select("id");
        results.push({ from: "APPUNTAMENTI RINNOVI E INTEGRAZIONI", to: "RINNOVI/INTEGRAZIONI", count: data3?.length ?? 0, error: err3 });

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

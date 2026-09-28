export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
    try {
        const url = new URL(req.url);
        const q = url.searchParams.get("q");
        
        if (!q || q.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        const terms = q.trim().split(/\s+/).filter(t => t.length > 0);
        
        let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, consulenti(name)");
        let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id, gestioni(nome)");
        let medicalQuery = supabase.from("medical_appointments").select("id, client_name, client_surname, client_phone, session_id, medical_sessions(date)");
        let waitingQuery = supabase.from("medical_waiting_list").select("id, name, surname, phone");

        terms.forEach(term => {
            const t = `%${term}%`;
            agendaQuery = agendaQuery.or(`nome.ilike.${t},cognome.ilike.${t},telefono.ilike.${t}`);
            consulenzeQuery = consulenzeQuery.or(`nome.ilike.${t},cognome.ilike.${t},telefono.ilike.${t}`);
            medicalQuery = medicalQuery.or(`client_name.ilike.${t},client_surname.ilike.${t},client_phone.ilike.${t}`);
            waitingQuery = waitingQuery.or(`name.ilike.${t},surname.ilike.${t},phone.ilike.${t}`);
        });

        const { data: agenda } = await agendaQuery.limit(10);
        const { data: consulenze } = await consulenzeQuery.limit(10);
        const { data: medical } = await medicalQuery.limit(5);
        const { data: waiting } = await waitingQuery.limit(5);

        const results = [];

        if (agenda) {
            agenda.forEach(a => {
            const dateStr = a.entry_date ? new Date(a.entry_date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
            const consulenteStr = a.consulente ? ` • ${a.consulente}` : "";
            results.push({ type: "agenda", id: a.id, title: `${a.nome} ${a.cognome}`, subtitle: `${a.section} - ${dateStr}${consulenteStr}`, phone: a.telefono, raw: a });
        });
        }
        if (consulenze) {
            consulenze.forEach(c => {
            const listName = c.gestioni?.nome || "Lista Sconosciuta";
            results.push({ type: "consulenze", id: c.id, title: `${c.nome} ${c.cognome}`, subtitle: `Consulenze: ${listName}`, phone: c.telefono, raw: c });
        });
        }
        if (medical) {
            medical.forEach(m => {
            const sessionDate = m.medical_sessions?.date ? new Date(m.medical_sessions.date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
            const dateStr = sessionDate ? ` del ${sessionDate}` : "";
            results.push({ type: "medical", id: m.id, title: `${m.client_name} ${m.client_surname}`, subtitle: `Visita Medica${dateStr}`, phone: m.client_phone, raw: m });
        });
        }
        if (waiting) {
            waiting.forEach(w => results.push({ type: "waiting", id: w.id, title: `${w.name} ${w.surname}`, subtitle: `Lista d'attesa Medico`, phone: w.phone, raw: w }));
        }

        return NextResponse.json({ results });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
    }
}

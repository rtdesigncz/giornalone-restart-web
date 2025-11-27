import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Giornalone <noreply@example.com>";
// const resend = new Resend(RESEND_API_KEY); // Moved inside handler

const INCLUDED_SECTIONS = new Set<string>([
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
]);

function todayISOInRome(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
function toHHMM(t?: string | null) {
  if (!t) return "—";
  const [hh, mm] = t.split(":");
  return `${hh}:${mm}`;
}
const label = (o: any) => (o?.name ?? o?.nome ?? "") as string;

function buildEmailHTML(dateISO: string, rows: any[]) {
  const itDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(dateISO + "T00:00:00Z"));

  const grouped: Record<string, any[]> = {};
  for (const r of rows) (grouped[r.section] ||= []).push(r);

  const sections = Object.keys(grouped);

  const sectionBlocks = sections.map((sec) => {
    const trs = grouped[sec].map((r) => {
      const ora = toHHMM(r.entry_time);
      const nome = r.nome ?? "";
      const cognome = r.cognome ?? "";
      const tel = r.telefono ?? "";
      const tipo = label(r.tipo_abbonamento) || "—";
      const note = r.note ?? "";
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${ora}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${nome} ${cognome}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${tel}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${tipo}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${note}</td>
        </tr>
      `;
    }).join("");

    return `
      <h3 style="margin:18px 0 6px 0;color:#0f172a;">${sec}</h3>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead style="background:#f8fafc;">
          <tr>
            <th style="text-align:left;padding:8px;font-size:12px;color:#64748b;">Ora</th>
            <th style="text-align:left;padding:8px;font-size:12px;color:#64748b;">Nome</th>
            <th style="text-align:left;padding:8px;font-size:12px;color:#64748b;">Telefono</th>
            <th style="text-align:left;padding:8px;font-size:12px;color:#64748b;">Tipo Abb.</th>
            <th style="text-align:left;padding:8px;font-size:12px;color:#64748b;">Note</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
    `;
  }).join("");

  const emptyState = `
    <div style="padding:12px;color:#64748b;text-align:center;border:1px dashed #e5e7eb;border-radius:8px;">
      Nessun appuntamento per oggi nelle sezioni selezionate.
    </div>
  `;

  return `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.45;">
      <h2 style="margin:0 0 8px 0;color:#0f172a;">Agenda di oggi</h2>
      <div style="color:#64748b;margin-bottom:16px;">${itDate}</div>
      ${sections.length ? sectionBlocks : emptyState}
      <p style="color:#94a3b8;font-size:12px;margin-top:14px;">Email automatica • Giornalone Restart</p>
    </div>
  `;
}

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const body = await req.json().catch(() => ({}));
    const consulenteId = body?.id as string | undefined;
    if (!consulenteId) {
      return NextResponse.json({ error: "Missing consulente id" }, { status: 400 });
    }

    const { data: consultant, error: errC } = await supabase
      .from("consulenti")
      .select("*")
      .eq("id", consulenteId)
      .maybeSingle();
    if (errC) throw errC;

    const email = (consultant?.email ?? "").trim();
    if (!email) {
      return NextResponse.json({ error: "Il consulente non ha un'email impostata" }, { status: 400 });
    }

    const today = todayISOInRome();

    const { data: rowsRaw, error: errR } = await supabase
      .from("entries")
      .select(`
        *,
        tipo_abbonamento:tipi_abbonamento (*)
      `)
      .eq("entry_date", today)
      .eq("consulente_id", consulenteId)
      .order("section", { ascending: true })
      .order("entry_time", { ascending: true });
    if (errR) throw errR;

    const rows = (rowsRaw ?? []).filter((r: any) => INCLUDED_SECTIONS.has(r.section));
    const html = buildEmailHTML(today, rows);

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Appuntamenti di oggi – ${today}`,
      html,
    });

    return NextResponse.json({ ok: true, sent: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
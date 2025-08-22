// supabase/functions/send-daily-agenda/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Env
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Giornalone <noreply@example.com>";
const FORCE_SEND = Deno.env.get("FORCE_SEND") === "1";
const ADMIN_BCC = Deno.env.get("ADMIN_BCC") || ""; // opzionale

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Sezioni valide
const INCLUDED_SECTIONS = new Set<string>([
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
]);

function romeHourNow(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    hour12: false,
  });
  return Number(fmt.format(new Date()));
}

function todayISOInRome(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function toHHMM(t: string | null | undefined): string {
  if (!t) return "—";
  const [hh, mm] = t.split(":");
  return `${hh}:${mm}`;
}

const label = (o: any) => (o?.name ?? o?.nome ?? "") as string;

async function getConsultantsWithEmail() {
  const { data, error } = await supabase
    .from("consulenti")
    .select("*")
    .not("email", "is", null);
  if (error) throw error;
  return data ?? [];
}

async function getEntriesForConsultantOn(dateISO: string, consulenteId: string) {
  const { data, error } = await supabase
    .from("entries")
    .select(`
      *,
      tipo_abbonamento:tipi_abbonamento (*)
    `)
    .eq("entry_date", dateISO)
    .eq("consulente_id", consulenteId)
    .order("section", { ascending: true })
    .order("entry_time", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((r: any) => INCLUDED_SECTIONS.has(r.section));
}

function groupBySection(rows: any[]) {
  const map: Record<string, any[]> = {};
  for (const r of rows) (map[r.section] ||= []).push(r);
  return map;
}

function buildEmailHTML(dateISO: string, rows: any[]) {
  const itDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(dateISO + "T00:00:00Z"));

  const grouped = groupBySection(rows);
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
  </div>`;
}

async function sendWithResendHTTP({ to, subject, html }: { to: string; subject: string; html: string; }) {
  const payload: any = { from: FROM_EMAIL, to, subject, html };
  if (ADMIN_BCC) payload.bcc = ADMIN_BCC;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep raw text */ }

  return {
    status: res.status,
    ok: res.ok,
    body: json ?? text,
  };
}

async function runSend(force: boolean, debug: boolean) {
  const nowHr = romeHourNow();
  if (!force && nowHr !== 7) {
    return { ok: true, skipped: `hour=${nowHr}` };
  }

  const today = todayISOInRome();
  const consultants = await getConsultantsWithEmail();

  let totalEmails = 0;
  const details: any[] = [];

  for (const c of consultants) {
    const to = String(c.email ?? "").trim();
    if (!to) continue;

    const rows = await getEntriesForConsultantOn(today, c.id);
    if (!rows.length) {
      if (debug) details.push({ to, status: "no-rows" });
      continue;
    }

    const html = buildEmailHTML(today, rows);
    const result = await sendWithResendHTTP({
      to,
      subject: `Appuntamenti di oggi – ${today}`,
      html,
    });

    if (debug) details.push({ to, ...result });
    if (result.ok) totalEmails++;
  }

  return debug ? { ok: true, sent_to: totalEmails, details } : { ok: true, sent_to: totalEmails };
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const forceParam = url.searchParams.get("force") === "1";
    const debug = url.searchParams.get("debug") === "1";
    const force = FORCE_SEND || forceParam;

    if (req.method !== "GET" && req.method !== "POST" && req.method !== "HEAD") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await runSend(force, debug);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
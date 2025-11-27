// src/app/api/consulenze/import/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type RowObj = Record<string, any>;
const ESITI = new Set(["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE", "IN ATTESA", "NEGATIVO"]);

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const form = await req.formData();
    const gestione_id = String(form.get("gestione_id") || "");
    const csv_text = String(form.get("csv_text") || "");
    const mapping_json = String(form.get("mapping_json") || "{}");
    const save_mapping_default = String(form.get("save_mapping_default") || "0") === "1";
    const skip_duplicates = String(form.get("skip_duplicates") || "1") === "1";

    if (!gestione_id) return NextResponse.json({ error: "gestione_id mancante" }, { status: 400 });
    if (!csv_text.trim()) return NextResponse.json({ error: "CSV vuoto" }, { status: 400 });

    const mapping = JSON.parse(mapping_json || "{}") as Record<string, string>;

    // Parsing CSV robusto lato server (supporta ; e , e virgolette)
    const { headers, records } = parseCsv(csv_text);

    // Applica mappatura (header CSV -> campi tabella)
    const mappedRows: RowObj[] = records.map((arr) => {
      const obj: RowObj = {};
      headers.forEach((h, i) => {
        const target = mapping[h];
        if (!target) return; // colonna non mappata -> ignora
        obj[target] = arr[i] ?? "";
      });
      return obj;
    });

    // Normalizzazioni campi
    const normRows = mappedRows.map((r) => normalizeRow(r));

    // Se richiesto, salva la mappatura di default sulla gestione
    if (save_mapping_default) {
      const { error: upErr } = await supabase
        .from("gestioni")
        .update({ csv_mapping_default: mapping })
        .eq("id", gestione_id);
      if (upErr) throw upErr;
    }

    // Duplicati per telefono nella stessa gestione (se richiesto)
    let existingPhones = new Set<string>();
    if (skip_duplicates) {
      const phones = Array.from(new Set(normRows.map(r => (r.telefono || "").trim()).filter(Boolean)));
      if (phones.length) {
        const { data: exist, error: exErr } = await supabase
          .from("gestione_items")
          .select("telefono")
          .eq("gestione_id", gestione_id)
          .in("telefono", phones);
        if (exErr) throw exErr;
        existingPhones = new Set((exist || []).map((x: any) => (x.telefono || "").trim()));
      }
    }

    const toInsert = normRows
      .filter(r => Object.keys(r).length > 0)
      .filter(r => {
        if (!skip_duplicates) return true;
        const tel = (r.telefono || "").trim();
        return tel ? !existingPhones.has(tel) : true;
      })
      .map(r => ({
        gestione_id,
        ...r
      }));

    let inserted = 0;
    let skipped = normRows.length - toInsert.length;

    // Inserimento batch a chunk per evitare payload troppo grossi
    const CH = 1000;
    for (let i = 0; i < toInsert.length; i += CH) {
      const chunk = toInsert.slice(i, i + CH);
      if (chunk.length === 0) continue;
      const { error: insErr, count } = await supabase
        .from("gestione_items")
        .insert(chunk, { count: "exact" });
      if (insErr) throw insErr;
      inserted += count ?? chunk.length;
    }

    return NextResponse.json({ ok: true, inserted, skipped }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

/** CSV parser che supporta virgolette, escape, delimitatore ; o ,  */
function parseCsv(text: string): { headers: string[]; records: string[][] } {
  // scegliamo delimitatore in base alla prima riga non vuota
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim().length) || "");
  const delim = chooseDelimiter(firstLine);
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  for (const ln of lines) {
    // accumuliamo linee per righe con virgolette aperte
    if (rows.length === 0) rows.push([]);
    const cur = rows[rows.length - 1];
    if (cur.length === 0) {
      // nuova linea
      rows[rows.length - 1] = splitCsvLine(ln, delim);
    } else {
      // verifica se la linea precedente è “completa”
      const prevJoined = joinCsvFields(cur, delim);
      if (!isBalanced(prevJoined)) {
        // concateno con newline e riparsifico
        const merged = prevJoined + "\n" + ln;
        rows[rows.length - 1] = splitCsvLine(merged, delim);
      } else {
        // nuova riga
        rows.push(splitCsvLine(ln, delim));
      }
    }
  }
  // filtra righe vuote
  const cleaned = rows.filter((r) => r.some((c) => (c || "").trim().length > 0));
  if (!cleaned.length) return { headers: [], records: [] };
  const headers = cleaned[0].map((h) => (h || "").trim());
  const records = cleaned.slice(1);
  return { headers, records };
}

function chooseDelimiter(firstLine: string): string {
  // semplice euristica
  const c = (firstLine.match(/,/g) || []).length;
  const s = (firstLine.match(/;/g) || []).length;
  if (s > c) return ";";
  return ",";
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if (!inQuotes && ch === delim) {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function joinCsvFields(arr: string[], delim: string) {
  return arr.map((v) => {
    if (v.includes(delim) || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  }).join(delim);
}

function isBalanced(line: string) {
  // verifica numero di virgolette pari (tenendo conto di escape doppie "")
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (line[i + 1] === '"') { i++; continue; }
      count++;
    }
  }
  return count % 2 === 0;
}

/** Normalizzazioni coerenti con i campi della tabella */
function normalizeRow(r: RowObj): RowObj {
  const out: RowObj = {};
  const txt = (v: any) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

  if ("nome" in r) out.nome = safeText(r.nome);
  if ("cognome" in r) out.cognome = safeText(r.cognome);
  if ("telefono" in r) out.telefono = normalizePhone(r.telefono);
  if ("scadenza" in r) out.scadenza = normalizeDate(r.scadenza);
  if ("tipo_abbonamento_corrente" in r) out.tipo_abbonamento_corrente = safeText(r.tipo_abbonamento_corrente);

  if ("contattato" in r) out.contattato = toBool(r.contattato);
  if ("preso_appuntamento" in r) out.preso_appuntamento = toBool(r.preso_appuntamento);
  if ("consulenza_fatta" in r) out.consulenza_fatta = toBool(r.consulenza_fatta);

  if ("data_consulenza" in r) out.data_consulenza = normalizeDate(r.data_consulenza);
  if ("esito" in r) {
    const e = (txt(r.esito) || "").toUpperCase();
    out.esito = ESITI.has(e) ? e : null;
  }
  if ("nuovo_abbonamento_name" in r) out.nuovo_abbonamento_name = safeText(r.nuovo_abbonamento_name);
  if ("data_risposta" in r) out.data_risposta = normalizeDate(r.data_risposta);

  if ("note" in r) out.note = safeText(r.note);
  return out;
}

function safeText(v: any): string | null {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  return s.length ? s : null;
}
function normalizePhone(v: any): string | null {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  const only = s.replace(/[^\d+]/g, "");
  return only.length ? only : null;
}
function normalizeDate(v: any): string | null {
  if (!v) return null;
  let s = String(v).trim();
  if (!s) return null;
  // supporto dd/mm/yyyy o dd-mm-yyyy
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const dd = m1[1].padStart(2, "0");
    const mm = m1[2].padStart(2, "0");
    const yyyy = m1[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // se è già yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return s;
  // fallback: prova Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}
function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v || "").trim().toLowerCase();
  return ["1", "true", "si", "sì", "y", "yes", "x"].includes(s);
}
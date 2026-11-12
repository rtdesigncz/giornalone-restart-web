// src/app/api/clients/import/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function cleanCell(val: any): string {
  if (val == null) return "";
  let s = String(val).trim();
  // Strip Excel formula wrap ="..."
  if (s.startsWith('="') && s.endsWith('"')) {
    s = s.slice(2, -1);
  }
  // Strip outer quotes if any
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function parseDateDDMMYYYY(val: string): string | null {
  if (!val) return null;
  const s = val.trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return m2[0];
  return null;
}

function parsePrice(val: string): number {
  if (!val) return 0;
  const s = val.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function normalizePhone(val: string): string | null {
  if (!val) return null;
  const upper = val.toUpperCase().trim();
  if (["NO", "/", "NONE", "NULL", "-", "0"].includes(upper)) return null;
  const digits = val.replace(/[^\d+]/g, "").trim();
  return digits.length >= 6 ? digits : null;
}

export async function POST(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

  try {
    let csvText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (file) {
        csvText = await file.text();
      } else {
        csvText = String(form.get("csv_text") || "");
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      csvText = body.csv_text || "";
    } else {
      csvText = await req.text();
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: "Nessun contenuto CSV fornito." }, { status: 400 });
    }

    // 1. Fetch tipi_abbonamento to map macro-categories
    const { data: tipiData, error: tipiErr } = await supabase
      .from("tipi_abbonamento")
      .select("id, name");
    if (tipiErr) throw tipiErr;

    const tipiMap: Record<string, string> = {};
    (tipiData || []).forEach((t: { id: string; name: string }) => {
      tipiMap[t.name.toUpperCase()] = t.id;
    });

    // 2. Parse CSV rows
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: "Il file CSV non contiene righe di dati." }, { status: 400 });
    }

    const firstLine = lines[0];
    const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";

    const headerCells = lines[0].split(delim).map(cleanCell);
    const colIdx: Record<string, number> = {};
    headerCells.forEach((h, i) => {
      const norm = h.toLowerCase().trim();
      if (norm === "cognome") colIdx.cognome = i;
      else if (norm === "nome") colIdx.nome = i;
      else if (norm.includes("data di nascita") || norm === "data nascita") colIdx.data_nascita = i;
      else if (norm.includes("ultimo accesso utente") || norm.includes("ultimo accesso")) colIdx.ultimo_accesso = i;
      else if (norm.includes("inizio abilitazione") || norm.includes("inizio abbonamento")) colIdx.inizio_ab = i;
      else if (norm.includes("termine abilitazione") || norm.includes("fine abilitazione") || norm.includes("scadenza")) colIdx.termine_ab = i;
      else if (norm === "pacchetto" || norm.includes("pacchetto")) colIdx.pacchetto = i;
      else if (norm === "cellulare" || norm.includes("cellulare")) colIdx.cellulare = i;
      else if (norm === "telefono" || norm.includes("telefono")) colIdx.telefono = i;
      else if (norm === "prezzo" || norm.includes("prezzo")) colIdx.prezzo = i;
      else if (norm.includes("e-mail") || norm.includes("email") || norm === "mail") colIdx.email = i;
      else if (norm.includes("accessi effettuati") || norm === "accessi effettuati") colIdx.accessi = i;
      else if (norm.includes("stato utente")) colIdx.stato_utente = i;
      else if (norm === "indirizzo") colIdx.indirizzo = i;
      else if (norm === "civico") colIdx.civico = i;
      else if (norm === "cap") colIdx.cap = i;
      else if (norm === "città" || norm === "citta") colIdx.citta = i;
      else if (norm === "provincia") colIdx.provincia = i;
    });

    if (colIdx.cognome === undefined || colIdx.nome === undefined) {
      return NextResponse.json(
        { error: "Intestazioni 'Cognome' e 'Nome' obbligatorie non trovate nel CSV." },
        { status: 400 }
      );
    }

    // 3. Consolidate clients (handling multi-row clients with renewals)
    interface ClientConsolidated {
      cognome: string;
      nome: string;
      data_nascita: string | null;
      telefono: string | null;
      email: string | null;
      indirizzo: string | null;
      civico: string | null;
      cap: string | null;
      citta: string | null;
      provincia: string | null;
      pacchetto_originale: string | null;
      tipo_abbonamento_id: string | null;
      disciplina: string | null;
      data_inizio: string | null;
      data_scadenza: string | null;
      stato: "ATTIVO" | "IN_SCADENZA" | "SCADUTO";
      prezzo: number;
      accessi_effettuati: number;
      ultimo_accesso: string | null;
    }

    const consolidatedMap = new Map<string, ClientConsolidated>();
    const todayStr = new Date().toISOString().slice(0, 10);
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    for (let r = 1; r < lines.length; r++) {
      const cells = lines[r].split(delim).map(cleanCell);
      if (cells.length < 2) continue;

      const cognome = cleanCell(cells[colIdx.cognome] || "");
      const nome = cleanCell(cells[colIdx.nome] || "");
      if (!cognome && !nome) continue;

      const dataNascita = colIdx.data_nascita !== undefined ? parseDateDDMMYYYY(cells[colIdx.data_nascita]) : null;
      const ultimoAcc = colIdx.ultimo_accesso !== undefined ? parseDateDDMMYYYY(cells[colIdx.ultimo_accesso]) : null;
      const inizioAb = colIdx.inizio_ab !== undefined ? parseDateDDMMYYYY(cells[colIdx.inizio_ab]) : null;
      const fineAb = colIdx.termine_ab !== undefined ? parseDateDDMMYYYY(cells[colIdx.termine_ab]) : null;
      const pacchetto = colIdx.pacchetto !== undefined ? cleanCell(cells[colIdx.pacchetto]) : null;
      const cellulare = colIdx.cellulare !== undefined ? normalizePhone(cells[colIdx.cellulare]) : null;
      const telefonoAlt = colIdx.telefono !== undefined ? normalizePhone(cells[colIdx.telefono]) : null;
      const phone = cellulare || telefonoAlt;
      const email = colIdx.email !== undefined ? cleanCell(cells[colIdx.email]) || null : null;
      const prezzo = colIdx.prezzo !== undefined ? parsePrice(cells[colIdx.prezzo]) : 0;
      const accessi = colIdx.accessi !== undefined ? parseInt(cells[colIdx.accessi] || "0", 10) || 0 : 0;
      const indirizzo = colIdx.indirizzo !== undefined ? cleanCell(cells[colIdx.indirizzo]) || null : null;
      const civico = colIdx.civico !== undefined ? cleanCell(cells[colIdx.civico]) || null : null;
      const cap = colIdx.cap !== undefined ? cleanCell(cells[colIdx.cap]) || null : null;
      const citta = colIdx.citta !== undefined ? cleanCell(cells[colIdx.citta]) || null : null;
      const provincia = colIdx.provincia !== undefined ? cleanCell(cells[colIdx.provincia]) || null : null;

      // Composite identity key: Cognome + Nome + DataNascita (fallback Phone)
      const key = `${cognome.toUpperCase()}_${nome.toUpperCase()}_${dataNascita || phone || ""}`;

      // Resolve macro-subscription ID
      let macroTipoId: string | null = null;
      let disciplina: string = "ALTRO";

      if (pacchetto) {
        const pUp = pacchetto.toUpperCase();
        if (pUp.includes("ANNUALE")) macroTipoId = tipiMap["ANNUALE"] || null;
        else if (pUp.includes("QUADRIMESTRALE")) macroTipoId = tipiMap["QUADRIMESTRALE"] || null;
        else if (pUp.includes("MENSILE")) macroTipoId = tipiMap["MENSILE"] || null;
        else if (pUp.includes("REFORMER")) macroTipoId = tipiMap["PACCHETTO REFORMER"] || null;
        else if (pUp.includes("PERSONAL")) macroTipoId = tipiMap["PACCHETTO PERSONAL"] || null;
        else if (pUp.includes("INGRESSI")) macroTipoId = tipiMap["PACCHETTO 10 INGRESSI"] || null;

        if (pUp.includes("CORSI") && pUp.includes("SALA")) disciplina = "SALA+CORSI";
        else if (pUp.includes("CORSI")) disciplina = "CORSI";
        else if (pUp.includes("SALA")) disciplina = "SALA";
        else disciplina = "ALTRO";
      }

      // Calculate status
      let stato: "ATTIVO" | "IN_SCADENZA" | "SCADUTO" = "ATTIVO";
      if (fineAb) {
        if (fineAb < todayStr) stato = "SCADUTO";
        else if (fineAb <= thirtyDaysAhead) stato = "IN_SCADENZA";
        else stato = "ATTIVO";
      }

      const existing = consolidatedMap.get(key);
      if (!existing) {
        consolidatedMap.set(key, {
          cognome,
          nome,
          data_nascita: dataNascita,
          telefono: phone,
          email,
          indirizzo,
          civico,
          cap,
          citta,
          provincia,
          pacchetto_originale: pacchetto,
          tipo_abbonamento_id: macroTipoId,
          disciplina,
          data_inizio: inizioAb,
          data_scadenza: fineAb,
          stato,
          prezzo,
          accessi_effettuati: accessi,
          ultimo_accesso: ultimoAcc,
        });
      } else {
        // Person already exists: consolidate!
        // If current row expiration is further in the future, take current subscription!
        if (fineAb && (!existing.data_scadenza || fineAb > existing.data_scadenza)) {
          existing.data_scadenza = fineAb;
          existing.data_inizio = inizioAb || existing.data_inizio;
          existing.pacchetto_originale = pacchetto || existing.pacchetto_originale;
          existing.tipo_abbonamento_id = macroTipoId || existing.tipo_abbonamento_id;
          existing.disciplina = disciplina || existing.disciplina;
          existing.prezzo = prezzo;
          existing.stato = stato;
        }
        if (accessi > existing.accessi_effettuati) {
          existing.accessi_effettuati = accessi;
        }
        if (ultimoAcc && (!existing.ultimo_accesso || ultimoAcc > existing.ultimo_accesso)) {
          existing.ultimo_accesso = ultimoAcc;
        }
        if (!existing.telefono && phone) existing.telefono = phone;
        if (!existing.email && email) existing.email = email;
        if (!existing.indirizzo && indirizzo) existing.indirizzo = indirizzo;
      }
    }

    const uniqueClients = Array.from(consolidatedMap.values());

    // 4. Upsert clients in batch
    // First, fetch existing clients from DB to know whether to insert or update
    const { data: dbClients, error: fetchErr } = await supabase
      .from("clients")
      .select("id, nome, cognome, data_nascita, telefono");
    if (fetchErr) throw fetchErr;

    const dbMapByComposite = new Map<string, string>(); // compositeKey -> id
    const dbMapByPhone = new Map<string, string>(); // phone -> id

    (dbClients || []).forEach((c: any) => {
      const nKey = `${(c.cognome || "").trim().toUpperCase()}_${(c.nome || "").trim().toUpperCase()}_${c.data_nascita || ""}`;
      dbMapByComposite.set(nKey, c.id);
      if (c.telefono) {
        dbMapByPhone.set(c.telefono.trim(), c.id);
      }
    });

    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    const now = new Date().toISOString();

    for (const c of uniqueClients) {
      const compKeyWithBirth = `${c.cognome.toUpperCase()}_${c.nome.toUpperCase()}_${c.data_nascita || ""}`;
      const compKeyWithPhone = `${c.cognome.toUpperCase()}_${c.nome.toUpperCase()}_${c.telefono || ""}`;

      let existingId = dbMapByComposite.get(compKeyWithBirth) || dbMapByComposite.get(compKeyWithPhone);

      const clientPayload = {
        cognome: c.cognome,
        nome: c.nome,
        data_nascita: c.data_nascita,
        telefono: c.telefono,
        email: c.email,
        indirizzo: c.indirizzo,
        civico: c.civico,
        cap: c.cap,
        citta: c.citta,
        provincia: c.provincia,
        pacchetto_originale: c.pacchetto_originale,
        tipo_abbonamento_id: c.tipo_abbonamento_id,
        disciplina: c.disciplina,
        data_inizio: c.data_inizio,
        data_scadenza: c.data_scadenza,
        stato: c.stato,
        prezzo: c.prezzo,
        accessi_effettuati: c.accessi_effettuati,
        ultimo_accesso: c.ultimo_accesso,
        last_synced_at: now,
      };

      if (existingId) {
        toUpdate.push({ id: existingId, ...clientPayload });
      } else {
        toInsert.push(clientPayload);
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;

    // Execute inserts in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const { data: insData, error: insErr } = await supabase
        .from("clients")
        .insert(chunk)
        .select("id, nome, cognome, telefono, data_nascita");
      if (insErr) throw insErr;
      insertedCount += (insData || []).length;

      // Update local dbMap
      (insData || []).forEach((c: any) => {
        const nKey = `${(c.cognome || "").trim().toUpperCase()}_${(c.nome || "").trim().toUpperCase()}_${c.data_nascita || ""}`;
        dbMapByComposite.set(nKey, c.id);
        if (c.telefono) dbMapByPhone.set(c.telefono.trim(), c.id);
      });
    }

    // Execute updates
    for (const item of toUpdate) {
      const { id, ...fields } = item;
      const { error: updErr } = await supabase.from("clients").update(fields).eq("id", id);
      if (!updErr) updatedCount++;
    }

    // 5. Auto-link unlinked entries in Agenda to clients
    // Find unlinked entries where client_id is null
    const { data: unlinkedEntries } = await supabase
      .from("entries")
      .select("id, nome, cognome, telefono")
      .is("client_id", null)
      .limit(2000);

    let linkedEntriesCount = 0;
    if (unlinkedEntries && unlinkedEntries.length > 0) {
      for (const ent of unlinkedEntries) {
        const eCognome = (ent.cognome || "").trim().toUpperCase();
        const eNome = (ent.nome || "").trim().toUpperCase();
        const ePhone = normalizePhone(ent.telefono);

        let matchedClientId: string | undefined;

        if (eCognome && eNome) {
          // Check by name and phone first
          for (const [k, cid] of dbMapByComposite.entries()) {
            if (k.startsWith(`${eCognome}_${eNome}_`)) {
              matchedClientId = cid;
              break;
            }
          }
        }

        if (!matchedClientId && ePhone) {
          matchedClientId = dbMapByPhone.get(ePhone);
        }

        if (matchedClientId) {
          await supabase.from("entries").update({ client_id: matchedClientId }).eq("id", ent.id);
          linkedEntriesCount++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total_in_file: lines.length - 1,
      unique_clients: uniqueClients.length,
      inserted: insertedCount,
      updated: updatedCount,
      linked_entries: linkedEntriesCount,
      timestamp: now,
    });
  } catch (err: any) {
    console.error("Error in clients import:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

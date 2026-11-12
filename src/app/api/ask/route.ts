import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pmjnmgehdmamyrlvqyeh.supabase.co";
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface ModelCandidate {
  name: string;
  generationConfig: Record<string, any>;
  timeoutMs: number;
}

const CANDIDATE_MODELS: ModelCandidate[] = [
  {
    name: "gemini-flash-lite-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    },
    timeoutMs: 9000
  },
  {
    name: "gemini-3.1-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 }
    },
    timeoutMs: 9000
  },
  {
    name: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      thinkingConfig: { thinkingLevel: "LOW" }
    },
    timeoutMs: 12000
  }
];

function getSystemPrompt(): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  const currentMonthName = monthNames[now.getMonth()];

  return `Sei l'analista dati e Business Intelligence AI per il gestionale della palestra 'Restart Fitness Club'.
Il tuo obiettivo è convertire le domande in linguaggio naturale degli amministratori in query SQL PostgreSQL veloci, precise, corrette semanticamente ed eseguibili.

CONTESTO TEMPORALE ATTUALE (FONDAMENTALE PER LA PRECISIONE):
- DATA DI OGGI: ${todayStr} (Giorno: ${now.getDate()}, Mese: ${currentMonth} - ${currentMonthName}, Anno: ${currentYear}).
- Anno di riferimento corrente: ${currentYear}.

REGOLE TASSATIVE SULLE DATE E PERIODI:
1. DIVIETO ASSOLUTO DI 'EXTRACT(MONTH FROM ...)' SENZA ANNO:
   NON scrivere MAI 'EXTRACT(MONTH FROM entry_date) = X' senza filtrare esplicitamente anche l'anno!
   Usa SEMPRE intervalli espliciti chiusi con anno:
   \`entry_date >= '2026-10-01' AND entry_date <= '2026-10-31'\`

2. DETERMINAZIONE DELL'ANNO QUANDO NON SPECIFICATO:
   - Se l'utente cita un mese (es. "a ottobre", "a settembre", "a gennaio") senza specificare l'anno:
     Usa l'anno più recente coerente rispetto alla data di oggi (${todayStr}).
   - Se l'utente specifica date esatte (es. "dal 01/06/2026 al 31/10/2026"), convertile nel formato ISO \`'2026-06-01'\` e \`'2026-10-31'\`.

3. INTERVALLI CHIUSI (INIZIO E FINE OBBLIGATORI):
   Quando l'utente richiede un mese, una settimana o un periodo, applica SEMPRE sia il limite iniziale (>=) sia il limite finale (<=).

4. ESPRESSIONI TEMPORALI RELATIVE:
   - "oggi": \`entry_date = '${todayStr}'\`
   - "ieri": \`entry_date = ('${todayStr}'::date - INTERVAL '1 day')\`
   - "questo mese": \`entry_date >= '${currentYear}-${String(currentMonth).padStart(2, '0')}-01' AND entry_date <= '${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}'\`
   - "mese scorso": primo e ultimo giorno del mese solare precedente rispetto a oggi.
   - "ultimi 30 giorni": \`entry_date >= ('${todayStr}'::date - INTERVAL '30 days') AND entry_date <= '${todayStr}'::date\`

5. QUALE COLONNA DATA USARE:
   - In "entries" (agenda): usa SEMPRE \`entry_date\`. NON usare mai \`created_at\`.
   - In "gestione_items" (consulenze): usa \`data_consulenza\` per la data consulenza o \`scadenza\` per la scadenza.
   - In "pass_items" (consegna pass): usa \`data_consegna\` per i PASS CONSEGNATI e \`data_attivazione\` per i PASS ATTIVATI.

SCHEMA COMPLETO DEL DATABASE:

1) Tabella "entries" (Tabella principale dell'agenda giornaliera, presenze, esiti e vendite):
   - id: uuid (chiave primaria)
   - entry_date: date (data a calendario dell'appuntamento o tour)
   - entry_time: time (orario appuntamento, es. '15:30:00')
   - section: text (Sezione esatta dell'agenda). Valori possibili ESATTI:
     * 'APPUNTAMENTI (Pianificazione)' -> Prime iscrizioni / pianificazione commerciale
     * 'APPUNTAMENTI VERIFICHE DEL BISOGNO' -> Verifiche del bisogno con gli iscritti
     * 'APPUNTAMENTI RINNOVI E INTEGRAZIONI' -> Rinnovi o integrazioni abbonamento
     * 'TOUR SPONTANEI' -> Tour spontanei / Walk-in
     * 'APPUNTAMENTI TELEFONICI' -> Appuntamenti telefonici
     * 'MISS CON APPUNTAMENTO' -> Appuntamenti persi da ripianificare
   - nome: text (nome cliente)
   - cognome: text (cognome cliente)
   - telefono: text (numero di telefono)
   - consulente_id: uuid (collegato a consulenti.id)
   - tipo_abbonamento_id: uuid (collegato a tipi_abbonamento.id)
   - fonte: text (canale marketing di provenienza lead)
   - note: text (note libere)
   - venduto: boolean (TRUE = ha acquistato/sottoscritto l'abbonamento)
   - presentato: boolean (TRUE = il cliente si è presentato)
   - assente: boolean (TRUE = il cliente non si è presentato)
   - miss: boolean (TRUE = appuntamento saltato / perso)
   - negativo: boolean (TRUE = trattativa con esito negativo)
   - contattato: boolean (TRUE = contattato)
   - comeback: boolean (TRUE = comeback)

2) Tabella "consulenti":
   - id: uuid, name: text, active: boolean

3) Tabella "tipi_abbonamento":
   - id: uuid, name: text, active: boolean

4) Tabella "gestione_items" (Modulo 'Consulenze'):
   - id: uuid, gestione_id: uuid, nome: text, cognome: text, telefono: text, scadenza: date
   - tipo_abbonamento_corrente: text, nuovo_abbonamento_name: text, data_consulenza: date
   - esito: text ('ISCRIZIONE', 'RINNOVO', 'INTEGRAZIONE', 'IN ATTESA', 'NEGATIVO')
   - motivo_negativo: text ('INSODDISFATTO', 'NON FREQUENTA', 'TRASFERIMENTO', 'INFORTUNIO')
   - note: text, contattato: boolean, preso_appuntamento: boolean, consulenza_fatta: boolean

5) Tabella "pass_items" (Modulo 'Consegna Pass'):
   - id: uuid, gestione_id: uuid (collegato a pass_gestioni.id)
   - cliente_nome: text, cliente_cognome: text, cliente_telefono: text
   - referral_nome: text, referral_cognome: text, referral_telefono: text
   - data_consegna: date, data_attivazione: date, whatsapp_sent_date: timestamp
   - is_lead: boolean (TRUE = il pass è stato attivato come prospect/referral)
   - source_type: text ('pass' o NULL = pass fisico consegnato al cliente; 'manual_pass' = attivato manualmente senza consegna fisica; 'social' / 'whatsapp' = attivato da canale social/WA)
   - iscritto: boolean (TRUE = il referral si è iscritto), tipo_abbonamento: text, note: text
   REGOLE TASSATIVE SU "pass_items" (PASS CONSEGNATI vs PASS ATTIVATI):
   - Quando l'utente chiede **PASS CONSEGNATI** (o quanti pass sono stati consegnati): filtra SEMPRE OBBLIGATORIAMENTE \`(source_type IS NULL OR source_type = 'pass')\` e usa \`data_consegna\`. NON includere MAI \`source_type IN ('manual_pass', 'social', 'whatsapp')\`, anche se hanno \`data_consegna\` valorizzata!
   - Quando l'utente chiede **PASS ATTIVATI**: filtra \`is_lead = TRUE\` e usa \`data_attivazione\` (include sia i pass fisici poi attivati \`'pass'\`, sia quelli manuali \`'manual_pass'\`, sia \`'social'\`/\`'whatsapp'\`).
   - Se chiede specificamente attivati manualmente: \`is_lead = TRUE AND source_type = 'manual_pass'\`.

6) Tabella "pass_gestioni" (Campagne di 'Consegna Pass'):
   - id: uuid, nome: text (es. 'Pass NOVEMBRE', 'PASS SET-OTT'), descrizione: text
   - Se l'utente nomina una campagna specifica, fai JOIN \`pass_gestioni g ON pass_items.gestione_id = g.id\` filtrando \`g.nome ILIKE '%...%'\`.

OTTIMIZZAZIONE E CORRETTEZZA PER CONFRONTO PERSONE TRA APPUNTAMENTI (JOIN / EXISTS / NOT EXISTS):
Quando devi confrontare persone tra più appuntamenti (es. chi ha acquistato e POI ha/non ha un altro appuntamento):
1. Usa SEMPRE una CTE iniziale \`entries_clean\` che pre-calcola una sola volta i campi normalizzati per garantire velocità istantanea (< 1 secondo):
\`\`\`sql
WITH entries_clean AS (
  SELECT 
    e.id, e.entry_date, e.entry_time, e.section, e.nome, e.cognome, e.telefono,
    e.venduto, e.presentato, e.assente, e.miss, e.negativo, e.note, e.fonte,
    e.consulente_id, e.tipo_abbonamento_id, e.created_at,
    RIGHT(regexp_replace(COALESCE(e.telefono, ''), '[^0-9]', '', 'g'), 9) AS clean_phone,
    length(regexp_replace(COALESCE(e.telefono, ''), '[^0-9]', '', 'g')) AS phone_len,
    UPPER(TRIM(COALESCE(e.cognome, ''))) AS clean_cognome,
    UPPER(TRIM(COALESCE(e.nome, ''))) AS clean_nome
  FROM entries e
)
\`\`\`
2. Nella condizione di JOIN, EXISTS o NOT EXISTS tra \`e1\` (es. acquisto) ed \`e2\` (es. appuntamento successivo):
   - Includi SEMPRE OBBLIGATORIAMENTE \`e2.id <> e1.id\` (altrimenti la riga di acquisto fa match con se stessa se appartiene alla sezione rinnovi!).
   - Condizione di match persona:
     \`((e1.phone_len >= 9 AND e2.phone_len >= 9 AND e1.clean_phone = e2.clean_phone) OR (length(e1.clean_cognome) >= 2 AND length(e1.clean_nome) >= 2 AND e1.clean_cognome = e2.clean_cognome AND e1.clean_nome = e2.clean_nome))\`

REGOLA TASSATIVA PER I "MISS" / "MISS REALI" / "MISS DI UN PERIODO" (SENZA DUPLICATI):
Quando l'utente chiede i **miss** di un periodo (elenco, conteggio, recupero miss), NON limitarti a \`WHERE miss = TRUE\`: usa SEMPRE questa definizione esatta di business tramite \`entries_clean\`:
1. **Sezioni valide ONLY:** \`section IN ('APPUNTAMENTI (Pianificazione)', 'TOUR SPONTANEI', 'MISS CON APPUNTAMENTO')\`. ESCLUDI sempre \`'APPUNTAMENTI RINNOVI E INTEGRAZIONI'\`, \`'APPUNTAMENTI VERIFICHE DEL BISOGNO'\`, \`'APPUNTAMENTI TELEFONICI'\`.
2. **Almeno un vero MISS:** nel periodo richiesto (e nelle 3 sezioni valide), la persona deve avere almeno una riga con \`miss = TRUE\` (un puro \`assente = TRUE\` che non ha mai avuto \`miss = TRUE\` nel periodo NON è un miss!).
3. **Nessun esito conclusivo successivo:** da quella data in poi (\`e2.entry_date >= e1.entry_date\` AND \`e2.id <> e1.id\`, ANCHE oltre la fine del periodo chiesto), NON deve esistere nessuna riga della stessa persona con \`venduto = TRUE\` oppure \`negativo = TRUE\`.
4. **Niente duplicati (1 riga per persona, l'appuntamento più recente tra Miss o Assente):** tra le righe del periodo nelle 3 sezioni valide in cui \`(miss = TRUE OR assente = TRUE)\` per quella persona idonea, restituisci UNA sola riga per persona prendendo quella più recente (\`ORDER BY person_key, entry_date DESC, entry_time DESC NULLS LAST, created_at DESC\` con \`DISTINCT ON (person_key)\`, dove \`person_key\` è \`CASE WHEN phone_len >= 9 THEN 'P:' || clean_phone ELSE 'N:' || clean_cognome || '|' || clean_nome END\`).
Schema SQL di riferimento da seguire per i Miss di un periodo \`[DATA_INIZIO, DATA_FINE]\`:
\`\`\`sql
WITH entries_clean AS (...),
miss_candidates AS (
  SELECT e1.*
  FROM entries_clean e1
  WHERE e1.entry_date >= 'DATA_INIZIO' AND e1.entry_date <= 'DATA_FINE'
    AND e1.section IN ('APPUNTAMENTI (Pianificazione)', 'TOUR SPONTANEI', 'MISS CON APPUNTAMENTO')
    AND (e1.miss = TRUE OR e1.assente = TRUE)
    AND EXISTS (
      SELECT 1 FROM entries_clean em
      WHERE em.entry_date >= 'DATA_INIZIO' AND em.entry_date <= 'DATA_FINE'
        AND em.section IN ('APPUNTAMENTI (Pianificazione)', 'TOUR SPONTANEI', 'MISS CON APPUNTAMENTO')
        AND em.miss = TRUE
        AND ((em.phone_len >= 9 AND e1.phone_len >= 9 AND em.clean_phone = e1.clean_phone)
          OR (length(em.clean_cognome) >= 2 AND length(em.clean_nome) >= 2 AND em.clean_cognome = e1.clean_cognome AND em.clean_nome = e1.clean_nome))
    )
    AND NOT EXISTS (
      SELECT 1 FROM entries_clean e2
      WHERE e2.id <> e1.id
        AND (e2.venduto = TRUE OR e2.negativo = TRUE)
        AND e2.entry_date >= e1.entry_date
        AND ((e1.phone_len >= 9 AND e2.phone_len >= 9 AND e1.clean_phone = e2.clean_phone)
          OR (length(e1.clean_cognome) >= 2 AND length(e1.clean_nome) >= 2 AND e1.clean_cognome = e2.clean_cognome AND e1.clean_nome = e2.clean_nome))
    )
),
deduped AS (
  SELECT DISTINCT ON (CASE WHEN phone_len >= 9 THEN 'P:' || clean_phone ELSE 'N:' || clean_cognome || '|' || clean_nome END) *
  FROM miss_candidates
  ORDER BY (CASE WHEN phone_len >= 9 THEN 'P:' || clean_phone ELSE 'N:' || clean_cognome || '|' || clean_nome END),
    entry_date DESC, entry_time DESC NULLS LAST, created_at DESC
)
SELECT d.entry_date AS data_piu_recente, d.section AS sezione, d.nome, d.cognome, d.telefono, d.miss, d.assente, c.name AS consulente, d.note
FROM deduped d
LEFT JOIN consulenti c ON d.consulente_id = c.id
ORDER BY d.entry_date DESC
LIMIT 500
\`\`\`

REGOLE TECNICHE DI SICUREZZA:
- Genera SOLO query SELECT o WITH ... SELECT.
- MAI comandi di modifica (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE).
- NON inserire MAI il punto e virgola ';' finale.
- Fornisci alias chiari in italiano a tutte le colonne.
- Inserisci sempre un ordinamento logico (\`ORDER BY ... DESC\`) e \`LIMIT 500\`.

RISPONDI ESCLUSIVAMENTE IN JSON VALIDO:
{
  "sql": "query SQL pura senza punto e virgola finale",
  "explanation": "Spiegazione chiara in italiano in 2 frasi di quali filtri temporali e criteri sono stati applicati."
}
`;
}

async function callGemini(contents: any[]) {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY non configurata nelle variabili d'ambiente.");
  }

  let lastError: any = null;
  for (const candidate of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), candidate.timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidate.name}:generateContent?key=${GOOGLE_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig: candidate.generationConfig
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
        if (text) {
          return { text, model: candidate.name };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[CHIEDI AI DATI] Modello ${candidate.name} HTTP ${res.status}`);
        lastError = new Error(`Modello ${candidate.name} errore HTTP ${res.status}: ${JSON.stringify(errData)}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn(`[CHIEDI AI DATI] Modello ${candidate.name} timeout o errore:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error("Tutti i modelli Gemini sono temporaneamente occupati. Riprova tra pochi istanti.");
}

function sanitizeAndValidateSql(rawSql: string): string {
  const sql = rawSql.trim().replace(/;+$/, "").trim();

  const upper = sql.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    throw new Error("Solo query di lettura SELECT o WITH sono consentite.");
  }

  const forbidden = [
    "INSERT ",
    "UPDATE ",
    "DELETE ",
    "DROP ",
    "ALTER ",
    "TRUNCATE ",
    "CREATE ",
    "REPLACE ",
    "GRANT ",
    "REVOKE ",
    "EXEC "
  ];

  for (const word of forbidden) {
    const regex = new RegExp(`\\b${word.trim()}\\b`, "i");
    if (regex.test(sql)) {
      throw new Error(`Comando non consentito per sicurezza: ${word.trim()}`);
    }
  }

  return sql;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Domanda mancante o non valida." }, { status: 400 });
    }

    if (!SB_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY mancante nel server." }, { status: 500 });
    }

    console.log("\n==========================================");
    console.log("[CHIEDI AI DATI] Domanda ricevuta:", question.trim());

    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
    const systemPrompt = getSystemPrompt();

    // Step 1: Chiedi a Gemini di generare la query SQL
    const messages: any[] = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nDomanda dell'utente: ${question.trim()}` }]
      }
    ];

    const tGeminiStart = Date.now();
    let geminiResult = await callGemini(messages);
    console.log(`[CHIEDI AI DATI] Modello ${geminiResult.model} ha risposto in ${Date.now() - tGeminiStart}ms`);

    let parsed: { sql: string; explanation: string };

    try {
      let cleanText = geminiResult.text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*/, "").replace(/```$/, "").trim();
      }
      parsed = JSON.parse(cleanText);
    } catch {
      throw new Error("La risposta dell'AI non è in formato JSON valido.");
    }

    console.log("[CHIEDI AI DATI] Spiegazione:", parsed.explanation);
    console.log("[CHIEDI AI DATI] SQL generato:\n", parsed.sql);

    let executableSql = sanitizeAndValidateSql(parsed.sql);

    // Step 2: Esegui la query su Supabase RPC
    const tDbStart = Date.now();
    let execResult = await supabase.rpc("exec_sql", { query: executableSql });
    console.log(`[CHIEDI AI DATI] Query DB eseguita in ${Date.now() - tDbStart}ms`);

    // Step 3: Se c'è un errore SQL, tenta un auto-fix automatico con Gemini
    if (execResult.error) {
      console.warn("[CHIEDI AI DATI] SQL fallito, tentativo di auto-correzione:", execResult.error.message);
      const correctionMessages = [
        ...messages,
        {
          role: "model",
          parts: [{ text: geminiResult.text }]
        },
        {
          role: "user",
          parts: [
            {
              text: `La query SQL precedente ha generato questo errore da PostgreSQL:\n"${execResult.error.message}" (codice: ${execResult.error.code})\n\nCorreggi la query SQL risolvendo l'errore e restituisci il JSON con campi 'sql' ed 'explanation'. Assicurati che non ci siano punti e virgola finali, rispetta i limiti temporali e mantieni fedeltà alla richiesta originaria.`
            }
          ]
        }
      ];

      try {
        const retryGemini = await callGemini(correctionMessages);
        let retryClean = retryGemini.text.trim();
        if (retryClean.startsWith("```json")) {
          retryClean = retryClean.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        } else if (retryClean.startsWith("```")) {
          retryClean = retryClean.replace(/^```\s*/, "").replace(/```$/, "").trim();
        }
        const retryParsed = JSON.parse(retryClean);
        const retrySql = sanitizeAndValidateSql(retryParsed.sql);
        const retryExec = await supabase.rpc("exec_sql", { query: retrySql });

        if (!retryExec.error) {
          executableSql = retrySql;
          parsed.explanation = retryParsed.explanation;
          execResult = retryExec;
          console.log("[CHIEDI AI DATI] Auto-correzione riuscita! Nuovo SQL:\n", retrySql);
        } else {
          console.error("[CHIEDI AI DATI] Auto-correzione fallita:", retryExec.error.message);
        }
      } catch (retryErr) {
        console.error("[CHIEDI AI DATI] Errore durante auto-correzione:", retryErr);
      }
    }

    if (execResult.error) {
      return NextResponse.json({
        error: `Errore nell'esecuzione della query generata: ${execResult.error.message}`,
        sql: executableSql,
        explanation: parsed.explanation
      }, { status: 422 });
    }

    const rows = execResult.data || [];
    const executionTimeMs = Date.now() - startTime;

    console.log(`[CHIEDI AI DATI] Righe restituite: ${Array.isArray(rows) ? rows.length : 0} in ${executionTimeMs}ms totali`);
    console.log("==========================================\n");

    return NextResponse.json({
      success: true,
      question: question.trim(),
      sql: executableSql,
      explanation: parsed.explanation,
      modelUsed: geminiResult.model,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      results: rows,
      executionTimeMs
    });

  } catch (err: any) {
    console.error("[CHIEDI AI DATI] Errore API:", err);
    return NextResponse.json({
      error: err.message || "Si è verificato un errore inaspettato durante l'elaborazione."
    }, { status: 500 });
  }
}

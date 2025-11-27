import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- CONFIG ---
// In a real app, use an SDK like 'openai' or 'google-generative-ai'
// For this implementation, we will use a direct fetch to an LLM endpoint (e.g., OpenAI)
// assuming the key is in process.env.OPENAI_API_KEY.

export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using Anon key for safety, or Service Role if RLS allows.
// Ideally, use a restricted user. For now, we use the standard client.

const SCHEMA_CONTEXT = `
You are a SQL expert. Your job is to translate a natural language question into a SQL query for a PostgreSQL database.
The database has the following tables:

1. entries (The main table for appointments/records)
   - id (uuid)
   - entry_date (date, YYYY-MM-DD)
   - entry_time (time, HH:MM:SS)
   - section (text) - e.g., 'TOUR SPONTANEI', 'APPUNTAMENTI TELEFONICI', 'FIRST', 'CLUBBER', 'RENEWAL'
   - nome (text)
   - cognome (text)
   - telefono (text)
   - fonte (text) - Source of the lead (e.g., 'Facebook', 'Walk-in')
   - consulente_id (uuid) -> joins with consulenti.id
   - tipo_abbonamento_id (uuid) -> joins with tipi_abbonamento.id
   - venduto (boolean) - TRUE if sold
   - miss (boolean) - TRUE if missed appointment
   - presentato (boolean) - TRUE if showed up
   - contattato (boolean) - TRUE if contacted (for phone calls)
   - negativo (boolean) - TRUE if outcome was negative
   - note (text)

2. consulenti (Consultants/Salespeople)
   - id (uuid)
   - name (text)

3. tipi_abbonamento (Subscription Types)
   - id (uuid)
   - name (text)
   -- price (numeric) -- This column might not exist, rely on name.

RULES:
- Return ONLY the SQL query. No markdown, no explanations.
- Use PostgreSQL syntax.
- Do not use 'entries_v', use 'entries' table with joins if needed.
- To filter by consultant name, join with 'consulenti' and use ILIKE on 'consulenti.name'.
- To filter by subscription type, join with 'tipi_abbonamento' and use ILIKE on 'tipi_abbonamento.name'.
- "Oggi" = CURRENT_DATE
- "Ieri" = CURRENT_DATE - 1
- "Ultimi X giorni" = entry_date >= CURRENT_DATE - X
- "Mese corrente" = date_trunc('month', entry_date) = date_trunc('month', CURRENT_DATE)
- Always limit results to 50 unless asking for a count.
- If asking for "Quanti...", use SELECT COUNT(*).

SPECIFIC SCENARIOS:
- **Customer History**: If asked about a specific person (e.g., "Quante volte è venuto Mario Rossi?", "Storia di Rossi"), search matching 'nome' OR 'cognome' (ILIKE). Return a detailed list: entry_date, section, consulenti.name as consulente, tipi_abbonamento.name as abbonamento, venduto, miss, presentato, note. Order by entry_date DESC.
- **Detailed Counts**: If asked "Quanti appuntamenti..." for a person, usually implies wanting to know the details too. If the question seems to imply analysis, prefer returning the rows over just a count, or return both.
`;

export async function POST(req: Request) {
    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
    try {
        const { message } = await req.json();

        if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key mancante. Configura GOOGLE_API_KEY nel file .env" },
                { status: 500 }
            );
        }

        // 1. Dynamic Model Discovery
        // Fetch available models to avoid 404s on specific versions
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!modelsRes.ok) {
            const err = await modelsRes.text();
            throw new Error(`Failed to list models: ${err}`);
        }

        const modelsData = await modelsRes.json();
        const availableModels = modelsData.models || [];

        // Find a model that supports 'generateContent'
        // Prefer 'gemini-1.5-flash' or 'gemini-pro' if available, otherwise take the first one.
        const capableModels = availableModels.filter((m: any) =>
            m.supportedGenerationMethods?.includes("generateContent")
        );

        if (capableModels.length === 0) {
            throw new Error("Nessun modello disponibile per questa API Key che supporti 'generateContent'.");
        }

        // Priority selection
        let selectedModel = capableModels.find((m: any) => m.name.includes("gemini-1.5-flash"))
            || capableModels.find((m: any) => m.name.includes("gemini-pro"))
            || capableModels[0];

        const modelName = selectedModel.name.replace("models/", ""); // API usually expects just the name or models/name depending on endpoint, but let's use the full name from the list if needed or strip it. 
        // Actually v1beta/models/MODEL_NAME:generateContent expects just the name part usually if using the :generateContent syntax on the resource.
        // But the 'name' field in list response is 'models/gemini-pro'. 
        // The endpoint format is https://generativelanguage.googleapis.com/v1beta/models/MODEL_ID:generateContent
        // So we need to strip 'models/' if it's there, or just use the name as is if the URL is constructed differently.
        // Let's use the 'name' field directly in the URL path, as it likely contains 'models/'.

        // Wait, the endpoint is `.../v1beta/{model=models/*}:generateContent`
        // So if selectedModel.name is "models/gemini-pro", we can use it directly in the URL path?
        // URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
        // If name is "models/gemini-pro", we should probably strip "models/" to avoid double "models/models/".

        const cleanModelName = selectedModel.name.replace(/^models\//, "");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`;

        // console.log("Selected Gemini Model:", cleanModelName);

        const llmRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: SCHEMA_CONTEXT + "\n\nQuestion: " + message }]
                }]
            }),
        });

        if (!llmRes.ok) {
            const errText = await llmRes.text();
            throw new Error(`Gemini Error (${cleanModelName}): ${errText}`);
        }

        const llmJson = await llmRes.json();
        let sqlQuery = llmJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!sqlQuery) throw new Error("Nessuna risposta da Gemini");

        // Cleanup markdown if present
        sqlQuery = sqlQuery.replace(/```sql/g, "").replace(/```/g, "").trim().replace(/;$/, "");

        // Security Check (Basic)
        if (!sqlQuery.toLowerCase().startsWith("select")) {
            return NextResponse.json(
                { error: "Per sicurezza, posso eseguire solo operazioni di lettura (SELECT)." },
                { status: 400 }
            );
        }

        // 2. Execute SQL
        const { data, error } = await supabase.rpc("exec_sql", { query: sqlQuery });

        if (error) {
            throw new Error(`Database Error: ${error.message}`);
        }

        // 3. Summarize Answer
        const summaryRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `
You are a helpful assistant for a gym management dashboard.
Your goal is to explain the data clearly and concisely in Italian.

DATA: ${JSON.stringify(data)}
QUESTION: ${message}

RULES FOR THE ANSWER:
1. Start with a direct summary sentence (e.g., "Mario Rossi ha 5 appuntamenti...").
2. If there is a list of items (like appointments), use a bulleted list.
3. Format dates as DD/MM/YYYY.
4. Use **BOLD** for key statuses (e.g., **Venduto**, **Miss**, **Presentato**).
5. Be clean and professional. Avoid clutter.
6. If the data is empty, say "Non ho trovato nessun dato."

Answer:` }]
                }]
            }),
        });
        const summaryJson = await summaryRes.json();
        const answer = summaryJson.candidates?.[0]?.content?.parts?.[0]?.text;

        return NextResponse.json({
            answer,
            sql: sqlQuery,
            data
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "Errore interno" }, { status: 500 });
    }
}

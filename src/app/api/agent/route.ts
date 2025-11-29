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

const APP_MANUAL = `
APP MANUAL (How the app works):

1. DASHBOARD
   - **KPIs**: Top row shows daily stats (Total appointments, Sold, Missed, Conversion Rate).
   - **In Corso/Da Fare**: This list shows appointments that are currently happening or past due but not yet marked with an outcome.
   - **Daily Tasks**:
     - **WhatsApp**: Confirmations to send for tomorrow's appointments.
     - **Medical**: Reminders for medical visits.
     - **Calls**: Follow-up calls to make.

2. AGENDA (Main Calendar)
   - **Add Entry**: Click "+" to open the Wizard. Select time, section (e.g., TOUR, FIRST), and fill details.
   - **Sections**:
     - *Tour Spontanei*: Walk-ins.
     - *Appuntamenti Telefonici*: Booked via phone.
     - *First/Clubber/Renewal*: Specific appointment types.
   - **Outcomes (Rules)**:
     - *Venduto*: Sale made. **Implies Presentato**. Clears Miss, Assente, Negativo.
     - *Miss*: No-show without notice. **Mutually exclusive** with Assente, Presentato, Venduto.
     - *Assente*: Absent (specific status, e.g., warned). **Mutually exclusive** with Miss, Presentato, Venduto.
     - *Presentato*: Showed up. **Incompatible** with Miss/Assente.
     - *Negativo*: Showed up but didn't buy. **Incompatible** with Venduto.

3. VISITE MEDICHE (Medical)
   - **Booking**: Click a slot in the calendar.
   - **Payment**: Mark "Pagato" when client pays (usually 35€).
   - **Waiting List**: Use the side panel to add people waiting for a slot.

4. CONSEGNA PASS (Pass Delivery)
   - **Gestioni**: Passes are organized by Campaigns (e.g., "Summer 2025"). Create a new one for a new batch.
   - **Add Pass**: Inside a campaign, add a pass.
     - *Cliente*: Who GIVES the pass.
     - *Referral*: Who RECEIVES the pass.
   - **Status**: Mark "Attivo" when the referral activates it, and "Iscritto" if they join.

5. CONSULENZE (Consultations)
   - **Gestioni**: Organized by Campaigns (e.g., "Rinnovi Gennaio").
   - **Items**: Each row is a client to contact/consult.
   - **Esiti**:
     - *In Attesa*: Pending, needs contact or appointment.
     - *Iscrizione/Rinnovo/Integrazione*: Success outcomes.
     - *Negativo*: Not interested.
   - **Cross-Reference**: You can check if a client in "In Attesa" has booked an appointment in the Agenda.

6. REPORTISTICA
   - Use filters to analyze performance over time. Export to PDF/CSV available.
`;

const SCHEMA_CONTEXT = `
You are Mauriz, a helpful and friendly AI assistant for a gym management dashboard.
Your goal is to assist the user with data queries, general conversation, OR app tutorials.

CONTEXT:
${APP_MANUAL}

The database has the following tables:

1. entries (Main Agenda - Appointments & Outcomes)
   - id (uuid)
   - entry_date (date)
   - entry_time (time)
   - section (text) - 'TOUR SPONTANEI', 'APPUNTAMENTI TELEFONICI', 'FIRST', 'CLUBBER', 'RENEWAL'
   - nome (text), cognome (text), telefono (text)
   - fonte (text) - Lead source
   - consulente_id (uuid) -> joins consulenti.id
   - tipo_abbonamento_id (uuid) -> joins tipi_abbonamento.id
   - venduto (boolean) - TRUE if sold (Sale made)
   - miss (boolean) - TRUE if missed appointment (No-show)
   - assente (boolean) - TRUE if absent (distinct from miss)
   - presentato (boolean) - TRUE if showed up but outcome is pending/not sold yet
   - contattato (boolean) - TRUE if contacted (specifically for phone appointments)
   - negativo (boolean) - TRUE if outcome was negative (Not interested)
   - note (text)

2. consulenti (Consultants)
   - id (uuid), name (text)

3. tipi_abbonamento (Subscription Types)
   - id (uuid), name (text)

4. medical_sessions (Medical Visit Days)
   - id (uuid)
   - date (date) - The day of the visits

5. medical_appointments (Medical Visits - Specific Slots)
   - id (uuid)
   - session_id (uuid) -> joins medical_sessions.id
   - time_slot (time)
   - client_name (text), client_phone (text)
   - price (decimal), is_paid (boolean)
   - whatsapp_sent (boolean)

6. medical_waiting_list (Medical Waiting List)
   - id (uuid)
   - name (text), surname (text), phone (text), notes (text)
   - contacted (boolean)

7. pass_gestioni (Pass Campaigns/Batches)
   - id (uuid)
   - nome (text) - e.g., "Campagna Estiva"
   - descrizione (text)

8. pass_items (Individual Passes Delivered)
   - id (uuid)
   - gestione_id (uuid) -> joins pass_gestioni.id
   - cliente_nome (text), cliente_cognome (text) - The person giving the pass (Referrer)
   - referral_nome (text), referral_cognome (text), referral_telefono (text) - The person receiving the pass (Lead)
   - data_consegna (date) - When it was given
   - data_attivazione (date) - When it was activated (NULL if not active)
   - iscritto (boolean) - If they signed up
   - tipo_abbonamento (text) - What they bought
   - note (text)

9. gestioni (Consultations Campaigns)
   - id (uuid)
   - nome (text) - e.g., "Consulenze Gennaio"

10. gestione_items (Consultations - Specific Records)
    - id (uuid)
    - gestione_id (uuid) -> joins gestioni.id
    - nome (text), cognome (text), telefono (text)
    - consulenza_fatta (boolean) - If the consultation was completed
    - esito (text) - 'ISCRIZIONE', 'RINNOVO', 'INTEGRAZIONE', 'IN ATTESA', 'NEGATIVO'
    - nuovo_abbonamento_name (text) - If they bought a new subscription

RULES:
- Analyze the user's question.
- IF data query -> Generate SQL (PostgreSQL).
    - Return ONLY SQL.
    - "Oggi" = CURRENT_DATE.
    - "Visite scadute" = medical_sessions.date < CURRENT_DATE.
    - "Pass attivi" = pass_items.data_attivazione IS NOT NULL.
    - "Pass consegnati" = pass_items.data_consegna IS NOT NULL.
    - Always limit to 50 unless counting.
- IF general question OR tutorial request -> Generate text response (start with "TEXT_RESPONSE:").
    - If asking "How to..." or "How does it work?", refer to the APP MANUAL.
    - Be concise and clear.

SPECIFIC SCENARIOS:
- **Outcomes**:
    - "Quanti venduti?" -> Count where venduto = TRUE.
    - "Quanti miss?" -> Count where miss = TRUE.
    - "Quanti assenti?" -> Count where assente = TRUE.
    - "Quanti presentati?" -> Count where presentato = TRUE.
- **Campaigns (Gestioni)**:
    - Both 'Pass' and 'Consulenze' are grouped by 'gestioni'.
    - If asked about "Consulenze", join 'gestione_items' with 'gestioni'.
    - If asked about "Pass", join 'pass_items' with 'pass_gestioni'.
- **Cross-Referencing (Consulenze <-> Agenda)**:
    - IF asked "Who in 'In Attesa' has an appointment?" OR "Check if [Name] has an appointment":
    - JOIN 'gestione_items' AND 'entries' ON 'gestione_items.nome' ILIKE 'entries.nome' AND 'gestione_items.cognome' ILIKE 'entries.cognome'.
    - FILTER 'gestione_items.esito' = 'IN ATTESA' (or IS NULL).
    - FILTER 'entries.entry_date' >= CURRENT_DATE.
    - SELECT 'gestione_items.nome', 'gestione_items.cognome', 'entries.entry_date', 'entries.entry_time', 'gestioni.nome' as campagna.
- **Customer History**: Check 'entries' for appointments AND 'pass_items' (as referral or client) AND 'medical_appointments' (as client_name) AND 'gestione_items'.
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
        let llmResponse = llmJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!llmResponse) throw new Error("Nessuna risposta da Gemini");

        // Check if it's a text response or SQL
        if (llmResponse.startsWith("TEXT_RESPONSE:")) {
            const textAnswer = llmResponse.replace("TEXT_RESPONSE:", "").trim();
            return NextResponse.json({
                answer: textAnswer,
                sql: null,
                data: null
            });
        }

        let sqlQuery = llmResponse;

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
You are Mauriz, a helpful assistant for a gym management dashboard.
Your goal is to explain the data clearly and concisely in Italian.

DATA: ${JSON.stringify(data)}
QUESTION: ${message}

RULES FOR THE ANSWER:
1. Start with a direct summary sentence (e.g., "Mario Rossi ha 5 appuntamenti...").
2. ALWAYS put a newline before starting the list.
3. Use a bulleted list (* Item) for each event.
4. Format dates as DD/MM/YYYY.
5. Use **BOLD** for key statuses (e.g., **Venduto**, **Miss**, **Presentato**).
6. Be clean and professional. Avoid clutter.
7. If the data is empty, say "Non ho trovato nessun dato."
8. Maintain the persona of Mauriz (friendly, professional).

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

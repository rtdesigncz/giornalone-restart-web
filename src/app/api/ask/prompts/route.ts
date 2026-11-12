import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pmjnmgehdmamyrlvqyeh.supabase.co";
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET_NAME = "ask-config";
const FILE_NAME = "saved-prompts.json";

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  badge?: string;
  createdAt: string;
}

const INITIAL_PROMPTS: SavedPrompt[] = [
  {
    id: "default-4",
    title: "Miss reali degli ultimi 60 giorni",
    badge: "Recupero",
    prompt: "Mostrami tutti i miss degli ultimi 60 giorni senza duplicati.",
    createdAt: "2026-11-12T12:00:00.000Z",
  },
  {
    id: "default-6",
    title: "Verifiche del Bisogno mancanti",
    badge: "Consigliato",
    prompt: "Mostrami tutti gli iscritti attivi a cui non è ancora stata fissata la verifica del bisogno, distinguendo chi è entro i 15 giorni e chi oltre.",
    createdAt: "2026-11-12T12:00:00.000Z",
  },
];

function getAdminClient(): SupabaseClient {
  if (!SB_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY mancante nel server.");
  }
  return createClient(SB_URL, SB_SERVICE_ROLE_KEY);
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

async function writePromptsToStorage(supabase: SupabaseClient, prompts: SavedPrompt[]) {
  await ensureBucket(supabase);
  const body = JSON.stringify(prompts, null, 2);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(FILE_NAME, Buffer.from(body, "utf-8"), {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });
  if (error) throw new Error(error.message);
}

async function readPromptsFromStorage(supabase: SupabaseClient): Promise<SavedPrompt[]> {
  await ensureBucket(supabase);
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(FILE_NAME, 60);

  if (signErr || !signed?.signedUrl) {
    // File does not exist yet: seed only once with initial prompts
    await writePromptsToStorage(supabase, INITIAL_PROMPTS);
    return INITIAL_PROMPTS;
  }

  const res = await fetch(`${signed.signedUrl}&cb=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) {
      await writePromptsToStorage(supabase, INITIAL_PROMPTS);
      return INITIAL_PROMPTS;
    }
    throw new Error(`Errore lettura ricerche frequenti (${res.status})`);
  }

  const parsed = await res.json();
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed;
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    const prompts = await readPromptsFromStorage(supabase);
    return NextResponse.json(
      { prompts },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    console.error("[ASK PROMPTS GET]", err);
    return NextResponse.json({ error: err.message || "Errore caricamento" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const prompt = String(body?.prompt || "").trim();
    const badge = String(body?.badge || "Frequente").trim() || "Frequente";

    if (!title || !prompt) {
      return NextResponse.json({ error: "Titolo e testo prompt obbligatori." }, { status: 400 });
    }

    const supabase = getAdminClient();
    const current = await readPromptsFromStorage(supabase);

    const newPrompt: SavedPrompt = {
      id: "prompt-" + Date.now(),
      title,
      prompt,
      badge,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPrompt, ...current];
    await writePromptsToStorage(supabase, updated);

    return NextResponse.json({ prompts: updated, prompt: newPrompt });
  } catch (err: any) {
    console.error("[ASK PROMPTS POST]", err);
    return NextResponse.json({ error: err.message || "Errore salvataggio" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parametro id mancante." }, { status: 400 });
    }

    const supabase = getAdminClient();
    const current = await readPromptsFromStorage(supabase);
    const updated = current.filter((p) => p.id !== id);
    await writePromptsToStorage(supabase, updated);

    return NextResponse.json({ prompts: updated });
  } catch (err: any) {
    console.error("[ASK PROMPTS DELETE]", err);
    return NextResponse.json({ error: err.message || "Errore eliminazione" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const supabase = getAdminClient();

    if (body?.action === "restore_defaults") {
      const current = await readPromptsFromStorage(supabase);
      const existingIds = new Set(current.map((p) => p.id));
      const merged = [...current];
      for (const d of INITIAL_PROMPTS) {
        if (!existingIds.has(d.id)) {
          merged.push(d);
        }
      }
      await writePromptsToStorage(supabase, merged);
      return NextResponse.json({ prompts: merged });
    }

    if (Array.isArray(body?.prompts)) {
      await writePromptsToStorage(supabase, body.prompts);
      return NextResponse.json({ prompts: body.prompts });
    }

    return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
  } catch (err: any) {
    console.error("[ASK PROMPTS PUT]", err);
    return NextResponse.json({ error: err.message || "Errore aggiornamento" }, { status: 500 });
  }
}

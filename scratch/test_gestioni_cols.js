import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(".env.local") });

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from("gestione_items").select("created_at").limit(1);
    console.log("Data:", data, "Error:", error);
}
run();
